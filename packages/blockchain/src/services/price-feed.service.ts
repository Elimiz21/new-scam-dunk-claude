import axios from 'axios';
import BigNumber from 'bignumber.js';
import { Web3ProviderService } from './web3-provider.service';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import {
  PriceData,
  LiquidityInfo,
  BlockchainNetwork,
} from '../types';

export class PriceFeedService {
  private static instance: PriceFeedService;
  private web3Provider: Web3ProviderService;
  private redis: RedisService;

  // Rate limiting for API calls
  private readonly API_RATE_LIMITS = {
    coingecko: { requests: 10, window: 60000 }, // 10 requests per minute
    coinmarketcap: { requests: 30, window: 60000 }, // 30 requests per minute
    defipulse: { requests: 20, window: 60000 }, // 20 requests per minute
  };

  private constructor() {
    this.web3Provider = Web3ProviderService.getInstance();
    this.redis = RedisService.getInstance();
  }

  public static getInstance(): PriceFeedService {
    if (!PriceFeedService.instance) {
      PriceFeedService.instance = new PriceFeedService();
    }
    return PriceFeedService.instance;
  }

  public async getTokenPrice(
    tokenAddress: string,
    network: BlockchainNetwork,
    vsCurrency = 'usd'
  ): Promise<PriceData> {
    const cacheKey = this.redis.generateKey('price', network, tokenAddress, vsCurrency);
    
    // Check cache first
    const cached = await this.redis.get<PriceData>(cacheKey);
    if (cached) {
      logger.info(`Price data cache hit for ${tokenAddress} on ${network}`);
      return cached;
    }

    logger.info(`Getting price data for ${tokenAddress} on ${network}`);

    try {
      // Try multiple price sources in order of preference
      const priceSources = [
        () => this.getPriceFromCoinGecko(tokenAddress, network, vsCurrency),
        () => this.getPriceFromCoinMarketCap(tokenAddress, network, vsCurrency),
        () => this.getPriceFromDEX(tokenAddress, network, vsCurrency),
      ];

      let priceData: PriceData | null = null;
      
      for (const getPrice of priceSources) {
        try {
          priceData = await getPrice();
          if (priceData) break;
        } catch (error) {
          logger.warn('Price source failed, trying next', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      if (!priceData) {
        throw new Error('No price data available from any source');
      }

      // Cache the result
      await this.redis.set(cacheKey, priceData, config.redis.ttl.priceData);

      return priceData;
    } catch (error) {
      logger.error(`Failed to get price for ${tokenAddress} on ${network}:`, error);
      throw error;
    }
  }

  public async getLiquidityData(
    pairAddress: string,
    network: BlockchainNetwork,
    dex?: string
  ): Promise<LiquidityInfo> {
    const cacheKey = this.redis.generateKey('liquidity', network, pairAddress, dex || 'all');
    
    // Check cache first
    const cached = await this.redis.get<LiquidityInfo>(cacheKey);
    if (cached) {
      logger.info(`Liquidity data cache hit for ${pairAddress} on ${network}`);
      return cached;
    }

    logger.info(`Getting liquidity data for ${pairAddress} on ${network}`);

    try {
      // Get liquidity from various DEXs
      const liquidityPools = await this.getLiquidityFromDEXs(pairAddress, network, dex);
      
      let totalLiquidity = new BigNumber(0);
      let lockedLiquidity = new BigNumber(0);

      for (const pool of liquidityPools) {
        totalLiquidity = totalLiquidity.plus(pool.reserve0).plus(pool.reserve1);
        if (pool.lockedAmount) {
          lockedLiquidity = lockedLiquidity.plus(pool.lockedAmount);
        }
      }

      const liquidityRatio = totalLiquidity.isZero() 
        ? 0 
        : lockedLiquidity.dividedBy(totalLiquidity).multipliedBy(100).toNumber();

      const liquidityInfo: LiquidityInfo = {
        totalLiquidity: totalLiquidity.toString(),
        liquidityPools,
        lockedLiquidity: lockedLiquidity.toString(),
        liquidityRatio,
      };

      // Cache the result
      await this.redis.set(cacheKey, liquidityInfo, config.redis.ttl.tokenData);

      return liquidityInfo;
    } catch (error) {
      logger.error(`Failed to get liquidity data for ${pairAddress} on ${network}:`, error);
      throw error;
    }
  }

  public async getHistoricalPrices(
    tokenAddress: string,
    network: BlockchainNetwork,
    period: string,
    vsCurrency = 'usd'
  ): Promise<{
    prices: Array<[number, number]>;
    market_caps: Array<[number, number]>;
    total_volumes: Array<[number, number]>;
  }> {
    const cacheKey = this.redis.generateKey('historical', network, tokenAddress, period, vsCurrency);
    
    // Check cache first (longer TTL for historical data)
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Getting historical price data for ${tokenAddress} on ${network}`);

    try {
      // Convert period to days
      const days = this.periodToDays(period);
      
      // Try CoinGecko first
      const historicalData = await this.getHistoricalFromCoinGecko(tokenAddress, network, days, vsCurrency);
      
      if (historicalData) {
        // Cache for longer period since historical data doesn't change
        await this.redis.set(cacheKey, historicalData, 3600); // 1 hour
        return historicalData;
      }

      // Fallback to constructing historical data from current price
      const currentPrice = await this.getTokenPrice(tokenAddress, network, vsCurrency);
      const fallbackData = {
        prices: [[Date.now(), currentPrice.price]],
        market_caps: [[Date.now(), 0]],
        total_volumes: [[Date.now(), currentPrice.volume24h || 0]],
      };

      await this.redis.set(cacheKey, fallbackData, 300); // 5 minutes for fallback
      return fallbackData;

    } catch (error) {
      logger.error(`Failed to get historical prices for ${tokenAddress}:`, error);
      throw error;
    }
  }

  public async getTrendingTokens(
    network?: BlockchainNetwork,
    limit = 20,
    timeframe = '24h'
  ): Promise<Array<{
    address: string;
    name: string;
    symbol: string;
    price: number;
    priceChange: number;
    volume: number;
    marketCap?: number;
  }>> {
    const cacheKey = this.redis.generateKey('trending', network || 'all', timeframe, limit.toString());
    
    // Check cache first
    const cached = await this.redis.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Getting trending tokens for ${network || 'all networks'}`);

    try {
      // Get trending data from CoinGecko
      const trending = await this.getTrendingFromCoinGecko(network, limit);
      
      // Cache the result
      await this.redis.set(cacheKey, trending, 600); // 10 minutes
      
      return trending;
    } catch (error) {
      logger.error(`Failed to get trending tokens:`, error);
      return [];
    }
  }

  public async getVolumeAnalysis(
    tokenAddress: string,
    network: BlockchainNetwork,
    period: string
  ): Promise<{
    volume: number;
    volumeChange: number;
    volumeRank: number;
    suspiciousVolumePatterns: string[];
  }> {
    const cacheKey = this.redis.generateKey('volume-analysis', network, tokenAddress, period);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Analyzing volume for ${tokenAddress} on ${network}`);

    try {
      // Get current and historical volume data
      const currentPrice = await this.getTokenPrice(tokenAddress, network);
      const historicalData = await this.getHistoricalPrices(tokenAddress, network, period);
      
      const volumes = historicalData.total_volumes.map(([, volume]) => volume);
      const currentVolume = currentPrice.volume24h || 0;
      const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
      
      const volumeChange = avgVolume > 0 ? ((currentVolume - avgVolume) / avgVolume) * 100 : 0;
      
      // Detect suspicious volume patterns
      const suspiciousPatterns = this.detectSuspiciousVolumePatterns(volumes);
      
      const analysis = {
        volume: currentVolume,
        volumeChange,
        volumeRank: 0, // Would need market data to calculate rank
        suspiciousVolumePatterns: suspiciousPatterns,
      };

      // Cache the result
      await this.redis.set(cacheKey, analysis, config.redis.ttl.priceData);
      
      return analysis;
    } catch (error) {
      logger.error(`Failed to analyze volume for ${tokenAddress}:`, error);
      throw error;
    }
  }

  private async getPriceFromCoinGecko(
    tokenAddress: string,
    network: BlockchainNetwork,
    vsCurrency: string
  ): Promise<PriceData | null> {
    try {
      // Check rate limit
      const rateLimitKey = 'rate_limit:coingecko';
      const currentRequests = await this.redis.increment(rateLimitKey, 60);
      
      if (currentRequests > this.API_RATE_LIMITS.coingecko.requests) {
        throw new Error('CoinGecko rate limit exceeded');
      }

      const platformId = this.getCoingeckoPlatformId(network);
      if (!platformId) return null;

      const url = `${config.external.coingecko.baseUrl}/simple/token_price/${platformId}`;
      const params: any = {
        contract_addresses: tokenAddress,
        vs_currencies: vsCurrency,
        include_24hr_change: true,
        include_24hr_vol: true,
        include_market_cap: true,
      };

      if (config.external.coingecko.apiKey) {
        params.x_cg_demo_api_key = config.external.coingecko.apiKey;
      }

      const response = await axios.get(url, { params });
      
      const tokenData = response.data[tokenAddress.toLowerCase()];
      if (!tokenData) return null;

      return {
        tokenAddress,
        price: tokenData[vsCurrency] || 0,
        priceChange24h: tokenData[`${vsCurrency}_24h_change`] || 0,
        volume24h: tokenData[`${vsCurrency}_24h_vol`] || 0,
        marketCap: tokenData[`${vsCurrency}_market_cap`],
        lastUpdated: new Date(),
        source: 'CoinGecko',
      };
    } catch (error) {
      logger.warn('CoinGecko price fetch failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  private async getPriceFromCoinMarketCap(
    tokenAddress: string,
    network: BlockchainNetwork,
    vsCurrency: string
  ): Promise<PriceData | null> {
    try {
      if (!config.external.coinmarketcap.apiKey) {
        return null;
      }

      // Check rate limit
      const rateLimitKey = 'rate_limit:coinmarketcap';
      const currentRequests = await this.redis.increment(rateLimitKey, 60);
      
      if (currentRequests > this.API_RATE_LIMITS.coinmarketcap.requests) {
        throw new Error('CoinMarketCap rate limit exceeded');
      }

      const url = `${config.external.coinmarketcap.baseUrl}/cryptocurrency/quotes/latest`;
      const response = await axios.get(url, {
        headers: {
          'X-CMC_PRO_API_KEY': config.external.coinmarketcap.apiKey,
        },
        params: {
          address: tokenAddress,
          convert: vsCurrency.toUpperCase(),
        },
      });

      const data = Object.values(response.data.data)[0] as any;
      if (!data) return null;

      const quote = data.quote[vsCurrency.toUpperCase()];

      return {
        tokenAddress,
        price: quote.price || 0,
        priceChange24h: quote.percent_change_24h || 0,
        volume24h: quote.volume_24h || 0,
        marketCap: quote.market_cap,
        lastUpdated: new Date(),
        source: 'CoinMarketCap',
      };
    } catch (error) {
      logger.warn('CoinMarketCap price fetch failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  private async getPriceFromDEX(
    tokenAddress: string,
    network: BlockchainNetwork,
    vsCurrency: string
  ): Promise<PriceData | null> {
    try {
      // This would implement DEX price fetching using on-chain data
      // For now, return null as a placeholder
      return null;
    } catch (error) {
      logger.warn('DEX price fetch failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  private async getLiquidityFromDEXs(
    pairAddress: string,
    network: BlockchainNetwork,
    dex?: string
  ): Promise<any[]> {
    // This would implement liquidity fetching from various DEXs
    // For now, return empty array as placeholder
    return [];
  }

  private async getHistoricalFromCoinGecko(
    tokenAddress: string,
    network: BlockchainNetwork,
    days: number,
    vsCurrency: string
  ): Promise<any | null> {
    try {
      const platformId = this.getCoingeckoPlatformId(network);
      if (!platformId) return null;

      const url = `${config.external.coingecko.baseUrl}/coins/${platformId}/contract/${tokenAddress}/market_chart`;
      const params: any = {
        vs_currency: vsCurrency,
        days: days.toString(),
      };

      if (config.external.coingecko.apiKey) {
        params.x_cg_demo_api_key = config.external.coingecko.apiKey;
      }

      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      logger.warn('CoinGecko historical data fetch failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  private async getTrendingFromCoinGecko(
    network?: BlockchainNetwork,
    limit = 20
  ): Promise<any[]> {
    try {
      const url = `${config.external.coingecko.baseUrl}/search/trending`;
      const params: any = {};

      if (config.external.coingecko.apiKey) {
        params.x_cg_demo_api_key = config.external.coingecko.apiKey;
      }

      const response = await axios.get(url, { params });
      
      // Transform the response to match our interface
      return response.data.coins?.slice(0, limit).map((coin: any) => ({
        address: coin.item.id, // This would need to be mapped to actual addresses
        name: coin.item.name,
        symbol: coin.item.symbol,
        price: 0, // Would need additional API call
        priceChange: 0, // Would need additional API call
        volume: 0, // Would need additional API call
        marketCap: coin.item.market_cap_rank,
      })) || [];
    } catch (error) {
      logger.warn('CoinGecko trending fetch failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  private detectSuspiciousVolumePatterns(volumes: number[]): string[] {
    const patterns: string[] = [];
    
    if (volumes.length < 7) return patterns;

    // Calculate volume statistics
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);

    // Check for volume spikes
    if (maxVolume > avgVolume * 10) {
      patterns.push('Extreme volume spike detected');
    }

    // Check for volume manipulation patterns
    const recentVolumes = volumes.slice(-7);
    const recentAvg = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    
    if (recentAvg > avgVolume * 5) {
      patterns.push('Recent volume manipulation possible');
    }

    // Check for wash trading patterns (very consistent volumes)
    const volumeVariance = this.calculateVariance(volumes);
    const volumeStdDev = Math.sqrt(volumeVariance);
    const coefficientOfVariation = volumeStdDev / avgVolume;
    
    if (coefficientOfVariation < 0.1 && avgVolume > 1000) {
      patterns.push('Suspiciously consistent volume (possible wash trading)');
    }

    return patterns;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private periodToDays(period: string): number {
    const periodMap: Record<string, number> = {
      '1h': 1 / 24,
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '1y': 365,
    };
    return periodMap[period] || 1;
  }

  private getCoingeckoPlatformId(network: BlockchainNetwork): string | null {
    const platformMap: Record<BlockchainNetwork, string> = {
      ethereum: 'ethereum',
      bsc: 'binance-smart-chain',
      polygon: 'polygon-pos',
      solana: 'solana',
      bitcoin: 'bitcoin',
    };
    return platformMap[network] || null;
  }
}