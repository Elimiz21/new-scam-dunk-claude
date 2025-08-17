import yahooFinance from 'yahoo-finance2';
import axios from 'axios';
import NodeCache from 'node-cache';
import { logger } from '../index';

interface TradingInfo {
  symbol?: string;
  platform?: string;
  amount?: number;
  currency?: string;
  additionalData?: any;
}

interface SecurityInfo {
  symbol: string;
  name: string;
  price: number;
  marketCap?: number;
  volume?: number;
  change24h?: number;
  isLegitimate: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  exchange?: string;
  sector?: string;
}

interface PlatformInfo {
  name: string;
  isRegulated: boolean;
  regulators: string[];
  jurisdiction: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  website?: string;
  founded?: number;
}

interface TradingAnalysisResult {
  securityAnalysis?: SecurityInfo;
  platformAnalysis?: PlatformInfo;
  overallRisk: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  recommendations: string[];
  flags: Array<{
    type: string;
    severity: 'info' | 'warning' | 'danger';
    message: string;
    evidence?: any;
  }>;
  marketData?: any;
  regulatory?: any;
}

class TradingAnalysisService {
  private cache: NodeCache;
  private coinGeckoBaseUrl: string;
  private knownScamPlatforms: Set<string>;
  private regulatedPlatforms: Map<string, PlatformInfo>;
  private knownScamTokens: Set<string>;
  
  constructor() {
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
    this.coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
    this.initializeKnownData();
  }
  
  private initializeKnownData() {
    // Known scam platforms
    this.knownScamPlatforms = new Set([
      'fakebroker.com',
      'scam-trading.net',
      'fake-crypto-exchange.com',
      'ponzi-investment.io',
      'quick-profits.biz',
      'guaranteed-returns.net'
    ]);
    
    // Regulated platforms
    this.regulatedPlatforms = new Map([
      ['coinbase', {
        name: 'Coinbase',
        isRegulated: true,
        regulators: ['SEC', 'CFTC', 'FINCEN'],
        jurisdiction: 'United States',
        riskLevel: 'low',
        warnings: [],
        website: 'coinbase.com',
        founded: 2012
      }],
      ['binance', {
        name: 'Binance',
        isRegulated: true,
        regulators: ['FCA', 'AUSTRAC'],
        jurisdiction: 'Multiple',
        riskLevel: 'low',
        warnings: ['Regulatory challenges in some jurisdictions'],
        website: 'binance.com',
        founded: 2017
      }],
      ['kraken', {
        name: 'Kraken',
        isRegulated: true,
        regulators: ['FinCEN', 'NYDFS'],
        jurisdiction: 'United States',
        riskLevel: 'low',
        warnings: [],
        website: 'kraken.com',
        founded: 2011
      }],
      ['robinhood', {
        name: 'Robinhood',
        isRegulated: true,
        regulators: ['SEC', 'FINRA', 'SIPC'],
        jurisdiction: 'United States',
        riskLevel: 'low',
        warnings: [],
        website: 'robinhood.com',
        founded: 2013
      }],
      ['etrade', {
        name: 'E*TRADE',
        isRegulated: true,
        regulators: ['SEC', 'FINRA', 'SIPC'],
        jurisdiction: 'United States',
        riskLevel: 'low',
        warnings: [],
        website: 'etrade.com',
        founded: 1991
      }],
      ['fidelity', {
        name: 'Fidelity',
        isRegulated: true,
        regulators: ['SEC', 'FINRA', 'SIPC'],
        jurisdiction: 'United States',
        riskLevel: 'low',
        warnings: [],
        website: 'fidelity.com',
        founded: 1946
      }]
    ]);
    
    // Known scam tokens/securities
    this.knownScamTokens = new Set([
      'SCAMCOIN',
      'PONZI',
      'RUGPULL',
      'FAKECOIN',
      'HONEYPOT',
      'SQUID', // Historical reference to Squid Game token
      'SAFEMOON2', // Many fake versions of popular tokens
      'BITCOIN2' // Fake bitcoin variants
    ]);
  }
  
  async analyzeTradingInfo(tradingInfo: TradingInfo, scanId: string): Promise<TradingAnalysisResult> {
    try {
      logger.info(`Starting trading analysis for scan ${scanId}`);
      
      let securityAnalysis: SecurityInfo | undefined;
      let platformAnalysis: PlatformInfo | undefined;
      let marketData: any = {};
      
      // Analyze the security/asset if symbol is provided
      if (tradingInfo.symbol) {
        securityAnalysis = await this.analyzeSecurity(tradingInfo.symbol);
        marketData = await this.getMarketData(tradingInfo.symbol);
      }
      
      // Analyze the platform if provided
      if (tradingInfo.platform) {
        platformAnalysis = await this.analyzePlatform(tradingInfo.platform);
      }
      
      // Calculate overall risk
      const riskAssessment = this.calculateOverallRisk(
        securityAnalysis,
        platformAnalysis,
        tradingInfo
      );
      
      // Generate recommendations and flags
      const recommendations = this.generateRecommendations(
        securityAnalysis,
        platformAnalysis,
        tradingInfo,
        riskAssessment.riskLevel
      );
      
      const flags = this.generateFlags(
        securityAnalysis,
        platformAnalysis,
        tradingInfo
      );
      
      const result: TradingAnalysisResult = {
        securityAnalysis,
        platformAnalysis,
        overallRisk: riskAssessment.overallRisk,
        riskLevel: riskAssessment.riskLevel,
        confidence: riskAssessment.confidence,
        recommendations,
        flags,
        marketData,
        regulatory: await this.getRegulatory(tradingInfo.symbol, tradingInfo.platform)
      };
      
      logger.info(`Trading analysis completed for scan ${scanId} with risk level: ${result.riskLevel}`);
      return result;
      
    } catch (error) {
      logger.error('Trading analysis failed:', error);
      throw error;
    }
  }
  
  private async analyzeSecurity(symbol: string): Promise<SecurityInfo> {
    try {
      const cacheKey = `security_${symbol.toUpperCase()}`;
      const cached = this.cache.get<SecurityInfo>(cacheKey);
      if (cached) return cached;
      
      const upperSymbol = symbol.toUpperCase();
      let securityInfo: SecurityInfo;
      
      // Check if it's a known scam token
      if (this.knownScamTokens.has(upperSymbol)) {
        securityInfo = {
          symbol: upperSymbol,
          name: 'Known Scam Token',
          price: 0,
          isLegitimate: false,
          riskLevel: 'critical',
          warnings: [
            'This token is known to be a scam',
            'Do not invest in this token',
            'High risk of total loss'
          ]
        };
      } else {
        // Try to get data from multiple sources
        securityInfo = await this.getSecurityFromAPIs(symbol);
      }
      
      this.cache.set(cacheKey, securityInfo, 300);
      return securityInfo;
      
    } catch (error) {
      logger.error(`Security analysis failed for ${symbol}:`, error);
      return {
        symbol: symbol.toUpperCase(),
        name: 'Unknown Security',
        price: 0,
        isLegitimate: false,
        riskLevel: 'high',
        warnings: ['Unable to verify security information']
      };
    }
  }
  
  private async getSecurityFromAPIs(symbol: string): Promise<SecurityInfo> {
    const upperSymbol = symbol.toUpperCase();
    
    // Try Yahoo Finance first (for stocks)
    try {
      const quote = await yahooFinance.quote(upperSymbol);
      if (quote && quote.regularMarketPrice) {
        return {
          symbol: upperSymbol,
          name: quote.longName || quote.shortName || upperSymbol,
          price: quote.regularMarketPrice,
          marketCap: quote.marketCap,
          volume: quote.regularMarketVolume,
          change24h: quote.regularMarketChangePercent,
          isLegitimate: true,
          riskLevel: this.assessStockRisk(quote),
          warnings: this.getStockWarnings(quote),
          exchange: quote.fullExchangeName,
          sector: (quote as any).sector || 'Unknown'
        };
      }
    } catch (error) {
      logger.debug(`Yahoo Finance failed for ${symbol}, trying CoinGecko`);
    }
    
    // Try CoinGecko for crypto
    try {
      const cryptoData = await this.getCryptoData(symbol);
      if (cryptoData) {
        return {
          symbol: upperSymbol,
          name: cryptoData.name,
          price: cryptoData.current_price,
          marketCap: cryptoData.market_cap,
          volume: cryptoData.total_volume,
          change24h: cryptoData.price_change_percentage_24h,
          isLegitimate: this.assessCryptoLegitimacy(cryptoData),
          riskLevel: this.assessCryptoRisk(cryptoData),
          warnings: this.getCryptoWarnings(cryptoData)
        };
      }
    } catch (error) {
      logger.debug(`CoinGecko failed for ${symbol}`);
    }
    
    // If not found in APIs, it might be a scam or very new token
    return {
      symbol: upperSymbol,
      name: 'Unverified Token/Security',
      price: 0,
      isLegitimate: false,
      riskLevel: 'high',
      warnings: [
        'Token/security not found in major databases',
        'Possible scam or extremely high-risk investment',
        'Exercise extreme caution'
      ]
    };
  }
  
  private async getCryptoData(symbol: string) {
    try {
      const response = await axios.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: symbol.toLowerCase(),
          order: 'market_cap_desc',
          per_page: 1,
          page: 1,
          sparkline: false
        },
        timeout: 5000
      });
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      
      // Try searching by symbol if ID search fails
      const searchResponse = await axios.get(`${this.coinGeckoBaseUrl}/search`, {
        params: { query: symbol },
        timeout: 5000
      });
      
      if (searchResponse.data.coins && searchResponse.data.coins.length > 0) {
        const coinId = searchResponse.data.coins[0].id;
        const detailResponse = await axios.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            ids: coinId,
            order: 'market_cap_desc',
            per_page: 1,
            page: 1,
            sparkline: false
          },
          timeout: 5000
        });
        
        return detailResponse.data[0];
      }
      
      return null;
    } catch (error) {
      logger.error(`CoinGecko API error for ${symbol}:`, error);
      return null;
    }
  }
  
  private assessStockRisk(quote: any): 'low' | 'medium' | 'high' | 'critical' {
    // Assess stock risk based on various factors
    const marketCap = quote.marketCap || 0;
    const volume = quote.regularMarketVolume || 0;
    const price = quote.regularMarketPrice || 0;
    
    // Penny stocks are higher risk
    if (price < 1) return 'high';
    
    // Very low market cap stocks are risky
    if (marketCap < 100000000) return 'medium'; // < $100M
    
    // Low volume is a risk factor
    if (volume < 10000) return 'medium';
    
    // Large, established companies are generally lower risk
    if (marketCap > 10000000000) return 'low'; // > $10B
    
    return 'low';
  }
  
  private getStockWarnings(quote: any): string[] {
    const warnings = [];
    const price = quote.regularMarketPrice || 0;
    const marketCap = quote.marketCap || 0;
    const volume = quote.regularMarketVolume || 0;
    
    if (price < 1) {
      warnings.push('Penny stock - extremely high volatility and risk');
    }
    
    if (marketCap < 100000000) {
      warnings.push('Small market cap - higher volatility risk');
    }
    
    if (volume < 10000) {
      warnings.push('Low trading volume - may be difficult to sell');
    }
    
    if (quote.regularMarketChangePercent && Math.abs(quote.regularMarketChangePercent) > 20) {
      warnings.push('High volatility - large price movements detected');
    }
    
    return warnings;
  }
  
  private assessCryptoLegitimacy(cryptoData: any): boolean {
    // Assess if crypto is legitimate based on various factors
    const marketCap = cryptoData.market_cap || 0;
    const volume = cryptoData.total_volume || 0;
    const age = cryptoData.ath_date ? new Date().getTime() - new Date(cryptoData.ath_date).getTime() : 0;
    
    // Very new tokens with low market cap are suspicious
    if (marketCap < 1000000 && age < 30 * 24 * 60 * 60 * 1000) { // Less than $1M cap and less than 30 days old
      return false;
    }
    
    // No trading volume is suspicious
    if (volume === 0) {
      return false;
    }
    
    // Established tokens with significant market cap are likely legitimate
    if (marketCap > 100000000) { // > $100M
      return true;
    }
    
    return marketCap > 10000000; // > $10M threshold for legitimacy
  }
  
  private assessCryptoRisk(cryptoData: any): 'low' | 'medium' | 'high' | 'critical' {
    const marketCap = cryptoData.market_cap || 0;
    const volume = cryptoData.total_volume || 0;
    const change24h = Math.abs(cryptoData.price_change_percentage_24h || 0);
    
    // Very small market cap is critical risk
    if (marketCap < 1000000) return 'critical';
    
    // High volatility
    if (change24h > 50) return 'high';
    if (change24h > 20) return 'medium';
    
    // Low volume relative to market cap
    const volumeToMcapRatio = volume / marketCap;
    if (volumeToMcapRatio < 0.001) return 'high';
    
    // Large, established cryptos
    if (marketCap > 1000000000) return 'low'; // > $1B
    if (marketCap > 100000000) return 'medium'; // > $100M
    
    return 'high';
  }
  
  private getCryptoWarnings(cryptoData: any): string[] {
    const warnings = [];
    const marketCap = cryptoData.market_cap || 0;
    const volume = cryptoData.total_volume || 0;
    const change24h = cryptoData.price_change_percentage_24h || 0;
    
    if (marketCap < 1000000) {
      warnings.push('Extremely low market cap - high risk of total loss');
    }
    
    if (volume === 0) {
      warnings.push('No trading volume - may be impossible to sell');
    }
    
    if (Math.abs(change24h) > 30) {
      warnings.push('Extreme volatility - price may be heavily manipulated');
    }
    
    if (volume > 0 && marketCap > 0) {
      const volumeToMcapRatio = volume / marketCap;
      if (volumeToMcapRatio < 0.001) {
        warnings.push('Very low liquidity - may be difficult to sell');
      }
    }
    
    if (cryptoData.name && /safe|moon|doge|elon|shiba/i.test(cryptoData.name)) {
      warnings.push('Meme token characteristics - extremely high risk');
    }
    
    return warnings;
  }
  
  private async analyzePlatform(platform: string): Promise<PlatformInfo> {
    try {
      const cacheKey = `platform_${platform.toLowerCase()}`;
      const cached = this.cache.get<PlatformInfo>(cacheKey);
      if (cached) return cached;
      
      const lowerPlatform = platform.toLowerCase();
      
      // Check if it's a known scam platform
      if (this.knownScamPlatforms.has(lowerPlatform)) {
        const platformInfo: PlatformInfo = {
          name: platform,
          isRegulated: false,
          regulators: [],
          jurisdiction: 'Unknown',
          riskLevel: 'critical',
          warnings: [
            'Known scam platform',
            'Do not deposit funds',
            'High risk of financial loss'
          ]
        };
        
        this.cache.set(cacheKey, platformInfo, 3600);
        return platformInfo;
      }
      
      // Check regulated platforms
      for (const [key, info] of this.regulatedPlatforms.entries()) {
        if (lowerPlatform.includes(key) || key.includes(lowerPlatform)) {
          this.cache.set(cacheKey, info, 3600);
          return info;
        }
      }
      
      // For unknown platforms, assess risk based on domain and other factors
      const platformInfo = await this.assessUnknownPlatform(platform);
      this.cache.set(cacheKey, platformInfo, 1800);
      return platformInfo;
      
    } catch (error) {
      logger.error(`Platform analysis failed for ${platform}:`, error);
      return {
        name: platform,
        isRegulated: false,
        regulators: [],
        jurisdiction: 'Unknown',
        riskLevel: 'high',
        warnings: ['Unable to verify platform information']
      };
    }
  }
  
  private async assessUnknownPlatform(platform: string): Promise<PlatformInfo> {
    const warnings = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    // Check for suspicious characteristics
    if (/\.(tk|ml|ga|cf)$/.test(platform)) {
      warnings.push('Uses free domain extension - common in scams');
      riskLevel = 'high';
    }
    
    if (/guaranteed|profit|rich|quick|easy|bonus/.test(platform.toLowerCase())) {
      warnings.push('Platform name contains typical scam keywords');
      riskLevel = 'high';
    }
    
    if (platform.includes('127.0.0.1') || platform.includes('localhost')) {
      warnings.push('Local or development platform - not suitable for real trading');
      riskLevel = 'critical';
    }
    
    // Check if it looks like a legitimate exchange domain
    const legitimatePatterns = /\.(com|org|net)$/;
    if (!legitimatePatterns.test(platform)) {
      warnings.push('Unusual domain extension for financial platform');
      riskLevel = 'high';
    }
    
    return {
      name: platform,
      isRegulated: false,
      regulators: [],
      jurisdiction: 'Unknown',
      riskLevel,
      warnings: [
        'Unverified platform - cannot confirm regulation status',
        ...warnings
      ]
    };
  }
  
  private calculateOverallRisk(
    securityAnalysis?: SecurityInfo,
    platformAnalysis?: PlatformInfo,
    tradingInfo?: TradingInfo
  ) {
    let riskScore = 0;
    let confidence = 50;
    
    // Factor in security risk
    if (securityAnalysis) {
      const securityRiskScores = { low: 10, medium: 30, high: 60, critical: 90 };
      riskScore += securityRiskScores[securityAnalysis.riskLevel];
      confidence += 20;
      
      if (!securityAnalysis.isLegitimate) {
        riskScore += 30;
      }
    }
    
    // Factor in platform risk
    if (platformAnalysis) {
      const platformRiskScores = { low: 5, medium: 20, high: 50, critical: 80 };
      riskScore += platformRiskScores[platformAnalysis.riskLevel];
      confidence += 20;
      
      if (!platformAnalysis.isRegulated) {
        riskScore += 20;
      }
    }
    
    // Factor in investment amount
    if (tradingInfo?.amount) {
      if (tradingInfo.amount > 10000) {
        riskScore += 10; // Higher amounts deserve more scrutiny
      }
      confidence += 10;
    }
    
    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);
    confidence = Math.min(confidence, 100);
    
    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';
    
    return {
      overallRisk: Math.round(riskScore),
      riskLevel,
      confidence: Math.round(confidence)
    };
  }
  
  private generateRecommendations(
    securityAnalysis?: SecurityInfo,
    platformAnalysis?: PlatformInfo,
    tradingInfo?: TradingInfo,
    riskLevel?: string
  ): string[] {
    const recommendations = [];
    
    if (riskLevel === 'critical') {
      recommendations.push('🚨 CRITICAL RISK: Do not proceed with this investment');
      recommendations.push('This appears to be a scam or extremely high-risk investment');
      recommendations.push('Consult with a licensed financial advisor');
    } else if (riskLevel === 'high') {
      recommendations.push('⚠️ HIGH RISK: Exercise extreme caution');
      recommendations.push('Only invest money you can afford to lose completely');
      recommendations.push('Research thoroughly before proceeding');
    }
    
    if (securityAnalysis && !securityAnalysis.isLegitimate) {
      recommendations.push('The security/token appears to be illegitimate or unverified');
    }
    
    if (platformAnalysis && !platformAnalysis.isRegulated) {
      recommendations.push('Use only regulated trading platforms for better protection');
      recommendations.push('Verify platform credentials with financial regulators');
    }
    
    if (tradingInfo?.amount && tradingInfo.amount > 1000) {
      recommendations.push('For large investments, consider using established, regulated platforms');
      recommendations.push('Diversify investments across multiple assets and platforms');
    }
    
    // General recommendations
    recommendations.push('Always do your own research (DYOR)');
    recommendations.push('Never invest more than you can afford to lose');
    recommendations.push('Be suspicious of guaranteed returns or get-rich-quick schemes');
    
    return recommendations;
  }
  
  private generateFlags(
    securityAnalysis?: SecurityInfo,
    platformAnalysis?: PlatformInfo,
    tradingInfo?: TradingInfo
  ) {
    const flags = [];
    
    if (securityAnalysis) {
      if (!securityAnalysis.isLegitimate) {
        flags.push({
          type: 'illegitimate_security',
          severity: 'danger' as const,
          message: 'Security appears to be illegitimate or unverified',
          evidence: { symbol: securityAnalysis.symbol, warnings: securityAnalysis.warnings }
        });
      }
      
      if (securityAnalysis.riskLevel === 'critical' || securityAnalysis.riskLevel === 'high') {
        flags.push({
          type: 'high_risk_security',
          severity: 'warning' as const,
          message: `High-risk security detected: ${securityAnalysis.symbol}`,
          evidence: { riskLevel: securityAnalysis.riskLevel, warnings: securityAnalysis.warnings }
        });
      }
    }
    
    if (platformAnalysis) {
      if (platformAnalysis.riskLevel === 'critical') {
        flags.push({
          type: 'scam_platform',
          severity: 'danger' as const,
          message: 'Platform appears to be a known scam',
          evidence: { platform: platformAnalysis.name, warnings: platformAnalysis.warnings }
        });
      }
      
      if (!platformAnalysis.isRegulated) {
        flags.push({
          type: 'unregulated_platform',
          severity: 'warning' as const,
          message: 'Platform is not verified as regulated',
          evidence: { platform: platformAnalysis.name, jurisdiction: platformAnalysis.jurisdiction }
        });
      }
    }
    
    if (tradingInfo?.amount && tradingInfo.amount > 50000) {
      flags.push({
        type: 'large_investment',
        severity: 'info' as const,
        message: 'Large investment amount detected',
        evidence: { amount: tradingInfo.amount, currency: tradingInfo.currency }
      });
    }
    
    return flags;
  }
  
  private async getMarketData(symbol: string) {
    try {
      const upperSymbol = symbol.toUpperCase();
      
      // Try Yahoo Finance first
      try {
        const quote = await yahooFinance.quote(upperSymbol);
        if (quote) {
          return {
            source: 'Yahoo Finance',
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            volume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            dayHigh: quote.regularMarketDayHigh,
            dayLow: quote.regularMarketDayLow,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow
          };
        }
      } catch (error) {
        logger.debug('Yahoo Finance market data failed, trying CoinGecko');
      }
      
      // Try CoinGecko for crypto
      const cryptoData = await this.getCryptoData(symbol);
      if (cryptoData) {
        return {
          source: 'CoinGecko',
          price: cryptoData.current_price,
          change: cryptoData.price_change_24h,
          changePercent: cryptoData.price_change_percentage_24h,
          volume: cryptoData.total_volume,
          marketCap: cryptoData.market_cap,
          dayHigh: cryptoData.high_24h,
          dayLow: cryptoData.low_24h,
          athPrice: cryptoData.ath,
          atlPrice: cryptoData.atl
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`Market data retrieval failed for ${symbol}:`, error);
      return null;
    }
  }
  
  private async getRegulatory(symbol?: string, platform?: string) {
    const regulatory: any = {};
    
    if (platform) {
      const platformInfo = this.regulatedPlatforms.get(platform.toLowerCase());
      if (platformInfo) {
        regulatory.platform = {
          isRegulated: platformInfo.isRegulated,
          regulators: platformInfo.regulators,
          jurisdiction: platformInfo.jurisdiction
        };
      }
    }
    
    if (symbol) {
      // Add basic regulatory info for major assets
      const upperSymbol = symbol.toUpperCase();
      if (['BTC', 'ETH', 'LTC'].includes(upperSymbol)) {
        regulatory.asset = {
          type: 'cryptocurrency',
          regulated: false,
          notes: 'Cryptocurrency regulation varies by jurisdiction'
        };
      } else {
        regulatory.asset = {
          type: 'unknown',
          regulated: 'unknown',
          notes: 'Regulatory status unclear'
        };
      }
    }
    
    return regulatory;
  }
}

export default new TradingAnalysisService();