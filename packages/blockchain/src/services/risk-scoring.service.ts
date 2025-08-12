import { ContractAnalysisService } from './contract-analysis.service';
import { TokenVerificationService } from './token-verification.service';
import { WalletReputationService } from './wallet-reputation.service';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import {
  RiskIndicators,
  RiskFactor,
  AnalysisResult,
  BlockchainNetwork,
  TokenMetadata,
  ContractInfo,
  HolderAnalysis,
  LiquidityInfo,
  WalletReputation,
} from '../types';

export class RiskScoringService {
  private static instance: RiskScoringService;
  private contractService: ContractAnalysisService;
  private tokenService: TokenVerificationService;
  private walletService: WalletReputationService;
  private redis: RedisService;

  // Risk scoring weights
  private readonly RISK_WEIGHTS = {
    HONEYPOT: 0.25,
    RUG_PULL: 0.30,
    LIQUIDITY: 0.20,
    OWNERSHIP: 0.15,
    TRADING: 0.10,
  };

  // Risk thresholds
  private readonly RISK_THRESHOLDS = {
    LOW: 0,
    MEDIUM: 30,
    HIGH: 60,
    CRITICAL: 80,
  };

  private constructor() {
    this.contractService = ContractAnalysisService.getInstance();
    this.tokenService = TokenVerificationService.getInstance();
    this.walletService = WalletReputationService.getInstance();
    this.redis = RedisService.getInstance();
  }

  public static getInstance(): RiskScoringService {
    if (!RiskScoringService.instance) {
      RiskScoringService.instance = new RiskScoringService();
    }
    return RiskScoringService.instance;
  }

  public async performComprehensiveAnalysis(
    address: string,
    network: BlockchainNetwork
  ): Promise<AnalysisResult> {
    const cacheKey = this.redis.generateKey('comprehensive-analysis', network, address);
    
    // Check cache first
    const cached = await this.redis.get<AnalysisResult>(cacheKey);
    if (cached) {
      logger.info(`Comprehensive analysis cache hit for ${address} on ${network}`);
      return cached;
    }

    logger.info(`Performing comprehensive analysis for ${address} on ${network}`);

    try {
      // Run all analyses in parallel
      const [
        metadata,
        contractInfo,
        holderAnalysis,
        liquidityInfo,
        honeypotAnalysis,
        rugPullAnalysis,
        similarityAnalysis,
      ] = await Promise.all([
        this.tokenService.getTokenMetadata(address, network),
        this.contractService.analyzeContract(address, network),
        this.tokenService.analyzeHolders(address, network),
        this.tokenService.getLiquidityInfo(address, network),
        this.contractService.detectHoneypot(address, network),
        this.contractService.detectRugPull(address, network),
        this.contractService.checkCodeSimilarity(address, network),
      ]);

      // Calculate comprehensive risk indicators
      const riskIndicators = await this.calculateRiskIndicators({
        address,
        network,
        metadata,
        contractInfo,
        holderAnalysis,
        liquidityInfo,
        honeypotAnalysis,
        rugPullAnalysis,
        similarityAnalysis,
      });

      // Generate detailed risk factors
      const riskFactors = await this.generateRiskFactors({
        honeypotAnalysis,
        rugPullAnalysis,
        similarityAnalysis,
        holderAnalysis,
        liquidityInfo,
        contractInfo,
      });

      const analysisResult: AnalysisResult = {
        tokenAddress: address,
        network,
        timestamp: new Date(),
        metadata,
        contractInfo,
        liquidityInfo,
        holderAnalysis,
        riskIndicators,
        riskFactors,
        analysisVersion: '1.0.0',
      };

      // Cache the result
      await this.redis.set(cacheKey, analysisResult, config.redis.ttl.contractAnalysis);

      return analysisResult;
    } catch (error) {
      logger.error(`Comprehensive analysis failed for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async calculateTokenRiskScore(
    address: string,
    network: BlockchainNetwork
  ): Promise<{
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    breakdown: Record<string, number>;
  }> {
    logger.info(`Calculating risk score for ${address} on ${network}`);

    try {
      // Get analysis data
      const analysisResult = await this.performComprehensiveAnalysis(address, network);
      
      // Calculate individual risk components
      const riskBreakdown = {
        honeypot: analysisResult.riskIndicators.honeypotRisk,
        rugPull: analysisResult.riskIndicators.rugPullRisk,
        liquidity: analysisResult.riskIndicators.liquidityRisk,
        ownership: analysisResult.riskIndicators.ownershipRisk,
        trading: analysisResult.riskIndicators.tradingRisk,
      };

      // Calculate weighted risk score
      const weightedScore = 
        riskBreakdown.honeypot * this.RISK_WEIGHTS.HONEYPOT +
        riskBreakdown.rugPull * this.RISK_WEIGHTS.RUG_PULL +
        riskBreakdown.liquidity * this.RISK_WEIGHTS.LIQUIDITY +
        riskBreakdown.ownership * this.RISK_WEIGHTS.OWNERSHIP +
        riskBreakdown.trading * this.RISK_WEIGHTS.TRADING;

      // Determine risk level
      const riskLevel = this.determineRiskLevel(weightedScore);

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(analysisResult);

      return {
        riskScore: Math.round(weightedScore),
        riskLevel,
        confidence,
        breakdown: riskBreakdown,
      };
    } catch (error) {
      logger.error(`Risk score calculation failed for ${address}:`, error);
      throw error;
    }
  }

  public async analyzeWalletRisk(
    address: string,
    network: BlockchainNetwork
  ): Promise<{
    reputation: WalletReputation;
    riskAssessment: {
      overallRisk: number;
      categories: Record<string, number>;
      recommendations: string[];
    };
  }> {
    logger.info(`Analyzing wallet risk for ${address} on ${network}`);

    try {
      const reputation = await this.walletService.getWalletReputation(address, network);
      
      // Calculate risk categories
      const categories = this.categorizeWalletRisks(reputation);
      
      // Generate recommendations
      const recommendations = this.generateWalletRecommendations(reputation);
      
      return {
        reputation,
        riskAssessment: {
          overallRisk: reputation.riskScore,
          categories,
          recommendations,
        },
      };
    } catch (error) {
      logger.error(`Wallet risk analysis failed for ${address}:`, error);
      throw error;
    }
  }

  public async detectAnomaliousActivity(
    address: string,
    network: BlockchainNetwork
  ): Promise<{
    anomalies: Array<{
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      description: string;
      confidence: number;
      detectedAt: Date;
    }>;
    overallAnomalyScore: number;
  }> {
    logger.info(`Detecting anomalous activity for ${address} on ${network}`);

    try {
      const anomalies = [];
      
      // Check for unusual trading patterns
      const tradingAnomalies = await this.detectTradingAnomalies(address, network);
      anomalies.push(...tradingAnomalies);
      
      // Check for suspicious token transfers
      const transferAnomalies = await this.detectTransferAnomalies(address, network);
      anomalies.push(...transferAnomalies);
      
      // Check for MEV bot activity
      const mevAnomalies = await this.detectMEVAnomalies(address, network);
      anomalies.push(...mevAnomalies);
      
      // Check for flash loan usage
      const flashLoanAnomalies = await this.detectFlashLoanAnomalies(address, network);
      anomalies.push(...flashLoanAnomalies);

      // Calculate overall anomaly score
      const overallAnomalyScore = this.calculateAnomalyScore(anomalies);

      return {
        anomalies,
        overallAnomalyScore,
      };
    } catch (error) {
      logger.error(`Anomaly detection failed for ${address}:`, error);
      throw error;
    }
  }

  private async calculateRiskIndicators(data: {
    address: string;
    network: BlockchainNetwork;
    metadata: TokenMetadata;
    contractInfo: ContractInfo;
    holderAnalysis: HolderAnalysis;
    liquidityInfo: LiquidityInfo;
    honeypotAnalysis: any;
    rugPullAnalysis: any;
    similarityAnalysis: any;
  }): Promise<RiskIndicators> {
    // Honeypot risk
    const honeypotRisk = data.honeypotAnalysis.confidence || 0;

    // Rug pull risk
    const rugPullRisk = data.rugPullAnalysis.riskScore || 0;

    // Liquidity risk
    const liquidityRisk = this.calculateLiquidityRisk(data.liquidityInfo);

    // Ownership risk
    const ownershipRisk = this.calculateOwnershipRisk(data.holderAnalysis);

    // Trading risk
    const tradingRisk = await this.calculateTradingRisk(data.address, data.network);

    // Overall risk (weighted average)
    const overallRisk = 
      honeypotRisk * this.RISK_WEIGHTS.HONEYPOT +
      rugPullRisk * this.RISK_WEIGHTS.RUG_PULL +
      liquidityRisk * this.RISK_WEIGHTS.LIQUIDITY +
      ownershipRisk * this.RISK_WEIGHTS.OWNERSHIP +
      tradingRisk * this.RISK_WEIGHTS.TRADING;

    return {
      honeypotRisk,
      rugPullRisk,
      liquidityRisk,
      ownershipRisk,
      tradingRisk,
      overallRisk: Math.round(overallRisk),
      riskLevel: this.determineRiskLevel(overallRisk),
    };
  }

  private async generateRiskFactors(data: {
    honeypotAnalysis: any;
    rugPullAnalysis: any;
    similarityAnalysis: any;
    holderAnalysis: HolderAnalysis;
    liquidityInfo: LiquidityInfo;
    contractInfo: ContractInfo;
  }): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    // Add honeypot risk factors
    if (data.honeypotAnalysis.isHoneypot) {
      riskFactors.push({
        category: 'Honeypot Detection',
        factor: 'Honeypot contract detected',
        risk: data.honeypotAnalysis.confidence,
        severity: data.honeypotAnalysis.confidence > 80 ? 'CRITICAL' : 'HIGH',
        description: 'This contract may prevent token sales after purchase',
      });
    }

    // Add rug pull risk factors
    data.rugPullAnalysis.indicators?.forEach((indicator: RiskFactor) => {
      riskFactors.push(indicator);
    });

    // Add code similarity risk factors
    if (data.similarityAnalysis.isKnownScam) {
      riskFactors.push({
        category: 'Code Analysis',
        factor: 'Code similarity to known scams',
        risk: 90,
        severity: 'CRITICAL',
        description: 'Contract code is similar to known scam contracts',
      });
    }

    // Add holder concentration risk factors
    if (data.holderAnalysis.concentration.top10Percentage > 80) {
      riskFactors.push({
        category: 'Token Distribution',
        factor: 'Extreme holder concentration',
        risk: 70,
        severity: 'HIGH',
        description: `Top 10 holders control ${data.holderAnalysis.concentration.top10Percentage.toFixed(1)}% of supply`,
      });
    }

    // Add liquidity risk factors
    if (parseFloat(data.liquidityInfo.totalLiquidity) < 10000) {
      riskFactors.push({
        category: 'Liquidity',
        factor: 'Low liquidity',
        risk: 60,
        severity: 'HIGH',
        description: 'Token has very low liquidity which may impact trading',
      });
    }

    return riskFactors;
  }

  private calculateLiquidityRisk(liquidityInfo: LiquidityInfo): number {
    const totalLiquidity = parseFloat(liquidityInfo.totalLiquidity);
    const lockedPercentage = liquidityInfo.liquidityRatio;

    let risk = 0;

    // Low liquidity risk
    if (totalLiquidity < 1000) risk += 80;
    else if (totalLiquidity < 10000) risk += 60;
    else if (totalLiquidity < 100000) risk += 30;

    // Low locked liquidity risk
    if (lockedPercentage < 20) risk += 50;
    else if (lockedPercentage < 50) risk += 30;
    else if (lockedPercentage < 80) risk += 15;

    return Math.min(risk, 100);
  }

  private calculateOwnershipRisk(holderAnalysis: HolderAnalysis): number {
    const { concentration } = holderAnalysis;
    
    let risk = 0;

    // High concentration risk
    if (concentration.top10Percentage > 90) risk += 80;
    else if (concentration.top10Percentage > 80) risk += 60;
    else if (concentration.top10Percentage > 70) risk += 40;
    else if (concentration.top10Percentage > 60) risk += 20;

    // Very few holders risk
    if (holderAnalysis.totalHolders < 100) risk += 50;
    else if (holderAnalysis.totalHolders < 500) risk += 30;
    else if (holderAnalysis.totalHolders < 1000) risk += 15;

    return Math.min(risk, 100);
  }

  private async calculateTradingRisk(address: string, network: BlockchainNetwork): Promise<number> {
    try {
      // Get fake volume analysis
      const fakeVolumeAnalysis = await this.tokenService.detectFakeVolume(address, network);
      
      // Get price manipulation analysis
      const priceManipulation = await this.tokenService.detectPriceManipulation(address, network);
      
      let risk = 0;

      if (fakeVolumeAnalysis.isFakeVolume) {
        risk += fakeVolumeAnalysis.confidence * 0.6;
      }

      if (priceManipulation.isManipulated) {
        risk += priceManipulation.confidence * 0.4;
      }

      return Math.min(risk, 100);
    } catch (error) {
      logger.warn('Failed to calculate trading risk:', error);
      return 0;
    }
  }

  private determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= this.RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (riskScore >= this.RISK_THRESHOLDS.HIGH) return 'HIGH';
    if (riskScore >= this.RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
  }

  private calculateConfidence(analysisResult: AnalysisResult): number {
    let confidence = 0;
    let factors = 0;

    // Contract verification adds confidence
    if (analysisResult.contractInfo.verified) {
      confidence += 30;
    }
    factors++;

    // Holder data adds confidence
    if (analysisResult.holderAnalysis.totalHolders > 0) {
      confidence += 25;
    }
    factors++;

    // Liquidity data adds confidence
    if (analysisResult.liquidityInfo.liquidityPools.length > 0) {
      confidence += 25;
    }
    factors++;

    // Risk factors data adds confidence
    if (analysisResult.riskFactors.length > 0) {
      confidence += 20;
    }
    factors++;

    return factors > 0 ? confidence / factors : 50; // Default 50% confidence
  }

  private categorizeWalletRisks(reputation: WalletReputation): Record<string, number> {
    const categories: Record<string, number> = {
      phishing: 0,
      scamming: 0,
      mixerUsage: 0,
      suspiciousActivity: 0,
      newAccount: 0,
    };

    // Analyze risk factors
    reputation.riskFactors.forEach(factor => {
      switch (factor.category.toLowerCase()) {
        case 'known threats':
          if (factor.factor.includes('phishing')) {
            categories.phishing += factor.risk;
          } else if (factor.factor.includes('scam')) {
            categories.scamming += factor.risk;
          }
          break;
        case 'privacy tools':
          categories.mixerUsage += factor.risk;
          break;
        case 'account age':
          categories.newAccount += factor.risk;
          break;
        default:
          categories.suspiciousActivity += factor.risk;
          break;
      }
    });

    // Normalize scores
    Object.keys(categories).forEach(key => {
      categories[key] = Math.min(categories[key], 100);
    });

    return categories;
  }

  private generateWalletRecommendations(reputation: WalletReputation): string[] {
    const recommendations: string[] = [];

    if (reputation.riskLevel === 'CRITICAL') {
      recommendations.push('🚨 CRITICAL: Do not interact with this wallet');
      recommendations.push('This wallet has been flagged for high-risk activities');
    } else if (reputation.riskLevel === 'HIGH') {
      recommendations.push('⚠️ HIGH RISK: Exercise extreme caution');
      recommendations.push('Verify the legitimacy of any transactions with this wallet');
    } else if (reputation.riskLevel === 'MEDIUM') {
      recommendations.push('⚡ MEDIUM RISK: Proceed with caution');
      recommendations.push('Verify transaction details carefully');
    } else {
      recommendations.push('✅ LOW RISK: Generally safe to interact with');
      recommendations.push('Continue to monitor for any changes in behavior');
    }

    // Add specific recommendations based on labels
    if (reputation.labels.includes('Known Phishing')) {
      recommendations.push('🎣 This wallet is associated with phishing activities');
    }

    if (reputation.labels.includes('Mixer/Tumbler')) {
      recommendations.push('🌪️ This wallet uses privacy/mixing services');
    }

    if (reputation.labels.includes('MEV Bot')) {
      recommendations.push('🤖 This wallet shows automated trading behavior');
    }

    return recommendations;
  }

  private async detectTradingAnomalies(address: string, network: BlockchainNetwork): Promise<any[]> {
    // This would implement trading anomaly detection
    return [];
  }

  private async detectTransferAnomalies(address: string, network: BlockchainNetwork): Promise<any[]> {
    // This would implement transfer anomaly detection
    return [];
  }

  private async detectMEVAnomalies(address: string, network: BlockchainNetwork): Promise<any[]> {
    // This would implement MEV anomaly detection
    return [];
  }

  private async detectFlashLoanAnomalies(address: string, network: BlockchainNetwork): Promise<any[]> {
    // This would implement flash loan anomaly detection
    return [];
  }

  private calculateAnomalyScore(anomalies: any[]): number {
    if (anomalies.length === 0) return 0;
    
    const totalScore = anomalies.reduce((sum, anomaly) => {
      const severityScores = { LOW: 10, MEDIUM: 30, HIGH: 60, CRITICAL: 100 };
      return sum + (severityScores[anomaly.severity] || 0) * (anomaly.confidence / 100);
    }, 0);

    return Math.min(totalScore / anomalies.length, 100);
  }
}