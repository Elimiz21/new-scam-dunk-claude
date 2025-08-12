import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import { Web3ProviderService } from './web3-provider.service';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import {
  TokenMetadata,
  HolderAnalysis,
  TokenHolder,
  LiquidityInfo,
  LiquidityPool,
  PriceData,
  BlockchainNetwork,
} from '../types';

export class TokenVerificationService {
  private static instance: TokenVerificationService;
  private web3Provider: Web3ProviderService;
  private redis: RedisService;

  // Standard ERC-20 ABI
  private readonly ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address,address) view returns (uint256)',
    'function transfer(address,uint256) returns (bool)',
    'function approve(address,uint256) returns (bool)',
    'function transferFrom(address,address,uint256) returns (bool)',
  ];

  // Uniswap V2 Pair ABI (minimal)
  private readonly UNISWAP_V2_PAIR_ABI = [
    'function getReserves() view returns (uint112,uint112,uint32)',
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function totalSupply() view returns (uint256)',
  ];

  // Uniswap V2 Factory ABI (minimal)
  private readonly UNISWAP_V2_FACTORY_ABI = [
    'function getPair(address,address) view returns (address)',
  ];

  private constructor() {
    this.web3Provider = Web3ProviderService.getInstance();
    this.redis = RedisService.getInstance();
  }

  public static getInstance(): TokenVerificationService {
    if (!TokenVerificationService.instance) {
      TokenVerificationService.instance = new TokenVerificationService();
    }
    return TokenVerificationService.instance;
  }

  public async getTokenMetadata(address: string, network: BlockchainNetwork): Promise<TokenMetadata> {
    const cacheKey = this.redis.generateKey('token-metadata', network, address);
    
    // Check cache first
    const cached = await this.redis.get<TokenMetadata>(cacheKey);
    if (cached) {
      logger.info(`Token metadata cache hit for ${address} on ${network}`);
      return cached;
    }

    logger.info(`Getting token metadata for ${address} on ${network}`);

    try {
      const ethersProvider = this.web3Provider.getEthersProvider(network);
      if (!ethersProvider) {
        throw new Error(`No provider available for network: ${network}`);
      }

      const contract = new ethers.Contract(address, this.ERC20_ABI, ethersProvider);

      // Get basic token info
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().catch(() => 'Unknown'),
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => BigNumber(0)),
      ]);

      const metadata: TokenMetadata = {
        name: name || 'Unknown',
        symbol: symbol || 'UNKNOWN',
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
      };

      // Try to get additional metadata from external sources
      const externalMetadata = await this.getExternalTokenMetadata(address, network);
      if (externalMetadata) {
        Object.assign(metadata, externalMetadata);
      }

      // Cache the result
      await this.redis.set(cacheKey, metadata, config.redis.ttl.tokenData);

      return metadata;
    } catch (error) {
      logger.error(`Failed to get token metadata for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async analyzeHolders(address: string, network: BlockchainNetwork): Promise<HolderAnalysis> {
    const cacheKey = this.redis.generateKey('holder-analysis', network, address);
    
    // Check cache first
    const cached = await this.redis.get<HolderAnalysis>(cacheKey);
    if (cached) {
      logger.info(`Holder analysis cache hit for ${address} on ${network}`);
      return cached;
    }

    logger.info(`Analyzing token holders for ${address} on ${network}`);

    try {
      // Get holders from blockchain explorer
      const holders = await this.getTokenHolders(address, network);
      
      // Calculate total supply for percentage calculations
      const metadata = await this.getTokenMetadata(address, network);
      const totalSupply = new BigNumber(metadata.totalSupply);

      // Calculate holder analysis
      const topHolders: TokenHolder[] = holders.slice(0, 100).map(holder => ({
        ...holder,
        percentage: new BigNumber(holder.balance).dividedBy(totalSupply).multipliedBy(100).toNumber(),
      }));

      // Calculate concentration metrics
      const top10Percentage = topHolders
        .slice(0, 10)
        .reduce((sum, holder) => sum + holder.percentage, 0);

      const top50Percentage = topHolders
        .slice(0, 50)
        .reduce((sum, holder) => sum + holder.percentage, 0);

      const top100Percentage = topHolders
        .reduce((sum, holder) => sum + holder.percentage, 0);

      // Calculate distribution categories
      const distributions = {
        whales: topHolders.filter(h => h.percentage >= 1).length,
        large: topHolders.filter(h => h.percentage >= 0.1 && h.percentage < 1).length,
        medium: topHolders.filter(h => h.percentage >= 0.01 && h.percentage < 0.1).length,
        small: topHolders.filter(h => h.percentage < 0.01).length,
      };

      const analysis: HolderAnalysis = {
        totalHolders: holders.length,
        topHolders,
        concentration: {
          top10Percentage,
          top50Percentage,
          top100Percentage,
        },
        distributions,
      };

      // Cache the result
      await this.redis.set(cacheKey, analysis, config.redis.ttl.tokenData);

      return analysis;
    } catch (error) {
      logger.error(`Failed to analyze holders for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async getLiquidityInfo(address: string, network: BlockchainNetwork): Promise<LiquidityInfo> {
    const cacheKey = this.redis.generateKey('liquidity-info', network, address);
    
    // Check cache first
    const cached = await this.redis.get<LiquidityInfo>(cacheKey);
    if (cached) {
      logger.info(`Liquidity info cache hit for ${address} on ${network}`);
      return cached;
    }

    logger.info(`Getting liquidity info for ${address} on ${network}`);

    try {
      const liquidityPools = await this.findLiquidityPools(address, network);
      
      let totalLiquidity = new BigNumber(0);
      let lockedLiquidity = new BigNumber(0);

      for (const pool of liquidityPools) {
        const poolLiquidity = await this.calculatePoolLiquidity(pool, network);
        totalLiquidity = totalLiquidity.plus(poolLiquidity.total);
        lockedLiquidity = lockedLiquidity.plus(poolLiquidity.locked);
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
      logger.error(`Failed to get liquidity info for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async getTradingVolume(address: string, network: BlockchainNetwork): Promise<{
    volume24h: string;
    volumeChange: number;
    transactions24h: number;
    avgTransactionSize: string;
  }> {
    const cacheKey = this.redis.generateKey('trading-volume', network, address);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Getting trading volume for ${address} on ${network}`);

    try {
      // Get trading data from external APIs
      const tradingData = await this.getTradingDataFromAPI(address, network);
      
      const result = {
        volume24h: tradingData.volume24h || '0',
        volumeChange: tradingData.volumeChange || 0,
        transactions24h: tradingData.transactions24h || 0,
        avgTransactionSize: tradingData.avgTransactionSize || '0',
      };

      // Cache the result
      await this.redis.set(cacheKey, result, config.redis.ttl.priceData);

      return result;
    } catch (error) {
      logger.error(`Failed to get trading volume for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async detectFakeVolume(address: string, network: BlockchainNetwork): Promise<{
    isFakeVolume: boolean;
    confidence: number;
    indicators: string[];
  }> {
    const cacheKey = this.redis.generateKey('fake-volume', network, address);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Detecting fake volume for ${address} on ${network}`);

    try {
      const indicators: string[] = [];
      let suspicionScore = 0;

      // Get recent transactions
      const recentTxs = await this.getRecentTransactions(address, network);
      
      // Check for wash trading patterns
      const washTradingScore = this.detectWashTrading(recentTxs);
      if (washTradingScore > 50) {
        indicators.push('Potential wash trading detected');
        suspicionScore += washTradingScore;
      }

      // Check for bot trading patterns
      const botTradingScore = this.detectBotTrading(recentTxs);
      if (botTradingScore > 50) {
        indicators.push('Bot trading patterns detected');
        suspicionScore += botTradingScore;
      }

      // Check volume vs. price correlation
      const volumePriceCorrelation = await this.checkVolumePriceCorrelation(address, network);
      if (volumePriceCorrelation < 0.3) {
        indicators.push('Low volume-price correlation');
        suspicionScore += 30;
      }

      // Check for repeated transaction amounts
      const repeatedAmounts = this.detectRepeatedTransactionAmounts(recentTxs);
      if (repeatedAmounts > 30) {
        indicators.push('High frequency of repeated transaction amounts');
        suspicionScore += repeatedAmounts;
      }

      const result = {
        isFakeVolume: suspicionScore >= 100,
        confidence: Math.min(suspicionScore, 100),
        indicators,
      };

      // Cache the result
      await this.redis.set(cacheKey, result, config.redis.ttl.tokenData);

      return result;
    } catch (error) {
      logger.error(`Failed to detect fake volume for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async detectPriceManipulation(address: string, network: BlockchainNetwork): Promise<{
    isManipulated: boolean;
    confidence: number;
    indicators: string[];
    pricePattern: 'PUMP_AND_DUMP' | 'GRADUAL_MANIPULATION' | 'FLASH_MANIPULATION' | 'NONE';
  }> {
    const cacheKey = this.redis.generateKey('price-manipulation', network, address);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Detecting price manipulation for ${address} on ${network}`);

    try {
      const indicators: string[] = [];
      let suspicionScore = 0;
      let pricePattern: 'PUMP_AND_DUMP' | 'GRADUAL_MANIPULATION' | 'FLASH_MANIPULATION' | 'NONE' = 'NONE';

      // Get price history
      const priceHistory = await this.getPriceHistory(address, network, 24); // Last 24 hours
      
      // Check for pump and dump pattern
      const pumpDumpScore = this.detectPumpAndDump(priceHistory);
      if (pumpDumpScore > 70) {
        indicators.push('Pump and dump pattern detected');
        suspicionScore += pumpDumpScore;
        pricePattern = 'PUMP_AND_DUMP';
      }

      // Check for flash manipulation
      const flashManipScore = this.detectFlashManipulation(priceHistory);
      if (flashManipScore > 60) {
        indicators.push('Flash manipulation detected');
        suspicionScore += flashManipScore;
        if (pricePattern === 'NONE') pricePattern = 'FLASH_MANIPULATION';
      }

      // Check for gradual manipulation
      const gradualManipScore = this.detectGradualManipulation(priceHistory);
      if (gradualManipScore > 50) {
        indicators.push('Gradual price manipulation detected');
        suspicionScore += gradualManipScore;
        if (pricePattern === 'NONE') pricePattern = 'GRADUAL_MANIPULATION';
      }

      // Check for unusual price volatility
      const volatility = this.calculatePriceVolatility(priceHistory);
      if (volatility > 50) {
        indicators.push(`Extremely high price volatility: ${volatility.toFixed(2)}%`);
        suspicionScore += Math.min(volatility, 50);
      }

      const result = {
        isManipulated: suspicionScore >= 80,
        confidence: Math.min(suspicionScore, 100),
        indicators,
        pricePattern,
      };

      // Cache the result
      await this.redis.set(cacheKey, result, config.redis.ttl.tokenData);

      return result;
    } catch (error) {
      logger.error(`Failed to detect price manipulation for ${address} on ${network}:`, error);
      throw error;
    }
  }

  private async getExternalTokenMetadata(address: string, network: BlockchainNetwork): Promise<Partial<TokenMetadata> | null> {
    try {
      // Try to get metadata from CoinGecko or other sources
      // This is a placeholder implementation
      return null;
    } catch (error) {
      logger.error(`Failed to get external token metadata:`, error);
      return null;
    }
  }

  private async getTokenHolders(address: string, network: BlockchainNetwork): Promise<TokenHolder[]> {
    try {
      const apiKey = this.getExplorerApiKey(network);
      const baseUrl = this.getExplorerBaseUrl(network);
      
      const response = await axios.get(`${baseUrl}/api`, {
        params: {
          module: 'token',
          action: 'tokenholderlist',
          contractaddress: address,
          page: 1,
          offset: 100,
          apikey: apiKey,
        },
      });

      if (response.data.status === '1' && response.data.result) {
        return response.data.result.map((holder: any) => ({
          address: holder.TokenHolderAddress,
          balance: holder.TokenHolderQuantity,
          percentage: 0, // Will be calculated later
          isContract: false, // Would need additional check
        }));
      }

      return [];
    } catch (error) {
      logger.error(`Failed to get token holders:`, error);
      return [];
    }
  }

  private async findLiquidityPools(address: string, network: BlockchainNetwork): Promise<LiquidityPool[]> {
    const pools: LiquidityPool[] = [];
    
    try {
      const ethersProvider = this.web3Provider.getEthersProvider(network);
      if (!ethersProvider) return pools;

      // Common DEX factory addresses for each network
      const factoryAddresses = this.getDEXFactoryAddresses(network);
      
      for (const factory of factoryAddresses) {
        const factoryContract = new ethers.Contract(
          factory.address, 
          this.UNISWAP_V2_FACTORY_ABI, 
          ethersProvider
        );

        // Get common trading pairs (WETH, USDT, USDC, etc.)
        const basePairs = this.getBasePairAddresses(network);
        
        for (const basePair of basePairs) {
          try {
            const pairAddress = await factoryContract.getPair(address, basePair.address);
            
            if (pairAddress !== ethers.ZeroAddress) {
              const poolInfo = await this.getPoolInfo(pairAddress, address, basePair.address, network);
              if (poolInfo) {
                pools.push({
                  ...poolInfo,
                  platform: factory.name,
                });
              }
            }
          } catch (error) {
            // Pair doesn't exist, continue
          }
        }
      }

      return pools;
    } catch (error) {
      logger.error(`Failed to find liquidity pools:`, error);
      return pools;
    }
  }

  private async getPoolInfo(
    pairAddress: string, 
    token0: string, 
    token1: string, 
    network: BlockchainNetwork
  ): Promise<Omit<LiquidityPool, 'platform'> | null> {
    try {
      const ethersProvider = this.web3Provider.getEthersProvider(network);
      if (!ethersProvider) return null;

      const pairContract = new ethers.Contract(pairAddress, this.UNISWAP_V2_PAIR_ABI, ethersProvider);
      
      const [reserves, totalSupply] = await Promise.all([
        pairContract.getReserves(),
        pairContract.totalSupply(),
      ]);

      return {
        pairAddress,
        token0,
        token1,
        reserve0: reserves[0].toString(),
        reserve1: reserves[1].toString(),
        totalSupply: totalSupply.toString(),
      };
    } catch (error) {
      logger.error(`Failed to get pool info:`, error);
      return null;
    }
  }

  private async calculatePoolLiquidity(pool: LiquidityPool, network: BlockchainNetwork): Promise<{
    total: BigNumber;
    locked: BigNumber;
  }> {
    // This would implement actual liquidity calculation
    // For now, return placeholder values
    return {
      total: new BigNumber(0),
      locked: new BigNumber(0),
    };
  }

  private async getTradingDataFromAPI(address: string, network: BlockchainNetwork): Promise<any> {
    // This would fetch trading data from external APIs like DEXTools, CoinGecko, etc.
    // For now, return placeholder data
    return {
      volume24h: '0',
      volumeChange: 0,
      transactions24h: 0,
      avgTransactionSize: '0',
    };
  }

  private async getRecentTransactions(address: string, network: BlockchainNetwork): Promise<any[]> {
    // This would fetch recent transactions for the token
    // For now, return empty array
    return [];
  }

  private detectWashTrading(transactions: any[]): number {
    // This would implement wash trading detection logic
    // For now, return 0 (no wash trading detected)
    return 0;
  }

  private detectBotTrading(transactions: any[]): number {
    // This would implement bot trading detection logic
    // For now, return 0 (no bot trading detected)
    return 0;
  }

  private async checkVolumePriceCorrelation(address: string, network: BlockchainNetwork): Promise<number> {
    // This would calculate volume-price correlation
    // For now, return 1 (perfect correlation)
    return 1;
  }

  private detectRepeatedTransactionAmounts(transactions: any[]): number {
    // This would detect repeated transaction amounts
    // For now, return 0 (no repeated amounts)
    return 0;
  }

  private async getPriceHistory(address: string, network: BlockchainNetwork, hours: number): Promise<any[]> {
    // This would fetch price history
    // For now, return empty array
    return [];
  }

  private detectPumpAndDump(priceHistory: any[]): number {
    // This would implement pump and dump detection
    // For now, return 0
    return 0;
  }

  private detectFlashManipulation(priceHistory: any[]): number {
    // This would implement flash manipulation detection
    // For now, return 0
    return 0;
  }

  private detectGradualManipulation(priceHistory: any[]): number {
    // This would implement gradual manipulation detection
    // For now, return 0
    return 0;
  }

  private calculatePriceVolatility(priceHistory: any[]): number {
    // This would calculate price volatility
    // For now, return 0
    return 0;
  }

  private getExplorerApiKey(network: BlockchainNetwork): string {
    switch (network) {
      case 'ethereum':
        return config.blockchain.ethereum.etherscanApiKey;
      case 'bsc':
        return config.blockchain.bsc.bscscanApiKey;
      case 'polygon':
        return config.blockchain.polygon.polygonscanApiKey;
      default:
        return '';
    }
  }

  private getExplorerBaseUrl(network: BlockchainNetwork): string {
    switch (network) {
      case 'ethereum':
        return 'https://api.etherscan.io';
      case 'bsc':
        return 'https://api.bscscan.com';
      case 'polygon':
        return 'https://api.polygonscan.com';
      default:
        return '';
    }
  }

  private getDEXFactoryAddresses(network: BlockchainNetwork): { name: string; address: string }[] {
    switch (network) {
      case 'ethereum':
        return [
          { name: 'Uniswap V2', address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f' },
          { name: 'Uniswap V3', address: '0x1F98431c8aD98523631AE4a59f267346ea31F984' },
          { name: 'SushiSwap', address: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac' },
        ];
      case 'bsc':
        return [
          { name: 'PancakeSwap V2', address: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73' },
          { name: 'PancakeSwap V1', address: '0xBCfCcbde45cE874adCB698cC183deBcF17952812' },
        ];
      case 'polygon':
        return [
          { name: 'QuickSwap', address: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32' },
          { name: 'SushiSwap', address: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4' },
        ];
      default:
        return [];
    }
  }

  private getBasePairAddresses(network: BlockchainNetwork): { name: string; address: string }[] {
    switch (network) {
      case 'ethereum':
        return [
          { name: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
          { name: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
          { name: 'USDC', address: '0xA0b86a33E6441C44D10c9c2B18ddE2e8D0eB9B08' },
        ];
      case 'bsc':
        return [
          { name: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' },
          { name: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' },
          { name: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955' },
        ];
      case 'polygon':
        return [
          { name: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' },
          { name: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
          { name: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
        ];
      default:
        return [];
    }
  }
}