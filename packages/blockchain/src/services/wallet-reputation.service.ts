import { ethers } from 'ethers';
import axios from 'axios';
import { Web3ProviderService } from './web3-provider.service';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import {
  WalletReputation,
  SuspiciousActivity,
  RiskFactor,
  TransactionAnalysis,
  BlockchainNetwork,
} from '../types';

export class WalletReputationService {
  private static instance: WalletReputationService;
  private web3Provider: Web3ProviderService;
  private redis: RedisService;

  // Known scammer addresses (this would be loaded from a database)
  private readonly KNOWN_SCAMMER_ADDRESSES = new Set([
    // Add known scammer addresses here
  ]);

  // Known phishing addresses
  private readonly KNOWN_PHISHING_ADDRESSES = new Set([
    // Add known phishing addresses here
  ]);

  // Known mixer/tumbler addresses
  private readonly KNOWN_MIXER_ADDRESSES = new Set([
    // Tornado Cash addresses and other mixers
    '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc',
    '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936',
    '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf',
  ]);

  // Suspicious transaction patterns
  private readonly SUSPICIOUS_PATTERNS = {
    RAPID_TRANSFERS: 'rapid_consecutive_transfers',
    ROUND_AMOUNTS: 'round_number_transactions',
    MEV_BOT: 'mev_bot_behavior',
    SANDWICH_ATTACK: 'sandwich_attack',
    FLASH_LOAN: 'flash_loan_usage',
    LARGE_TRANSFERS: 'unusually_large_transfers',
    DUST_ATTACKS: 'dust_attack_transactions',
  };

  private constructor() {
    this.web3Provider = Web3ProviderService.getInstance();
    this.redis = RedisService.getInstance();
  }

  public static getInstance(): WalletReputationService {
    if (!WalletReputationService.instance) {
      WalletReputationService.instance = new WalletReputationService();
    }
    return WalletReputationService.instance;
  }

  public async getWalletReputation(address: string, network: BlockchainNetwork): Promise<WalletReputation> {
    const cacheKey = this.redis.generateKey('wallet-reputation', network, address);
    
    // Check cache first
    const cached = await this.redis.get<WalletReputation>(cacheKey);
    if (cached) {
      logger.info(`Wallet reputation cache hit for ${address} on ${network}`);
      return cached;
    }

    logger.info(`Analyzing wallet reputation for ${address} on ${network}`);

    try {
      const reputation: WalletReputation = {
        address,
        riskScore: 0,
        riskLevel: 'LOW',
        transactionCount: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
        labels: [],
        riskFactors: [],
        suspiciousActivities: [],
      };

      // Basic wallet analysis
      await this.analyzeBasicWalletInfo(reputation, network);

      // Check against known bad addresses
      await this.checkKnownAddresses(reputation);

      // Analyze transaction history
      await this.analyzeTransactionHistory(reputation, network);

      // Check for suspicious patterns
      await this.detectSuspiciousPatterns(reputation, network);

      // Calculate final risk score and level
      this.calculateFinalRiskScore(reputation);

      // Cache the result
      await this.redis.set(cacheKey, reputation, config.redis.ttl.walletReputation);

      return reputation;
    } catch (error) {
      logger.error(`Failed to analyze wallet reputation for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async analyzeTransaction(hash: string, network: BlockchainNetwork): Promise<TransactionAnalysis> {
    const cacheKey = this.redis.generateKey('transaction-analysis', network, hash);
    
    // Check cache first
    const cached = await this.redis.get<TransactionAnalysis>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Analyzing transaction ${hash} on ${network}`);

    try {
      // Get transaction details
      const tx = await this.web3Provider.getTransaction(hash, network);
      const receipt = await this.web3Provider.getTransactionReceipt(hash, network);

      if (!tx || !receipt) {
        throw new Error('Transaction not found');
      }

      const analysis: TransactionAnalysis = {
        hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice.toString(),
        status: receipt.status === 1,
        riskFactors: [],
        suspiciousPatterns: [],
      };

      // Analyze sender and receiver
      const senderReputation = await this.getWalletReputation(tx.from, network);
      if (senderReputation.riskLevel === 'HIGH' || senderReputation.riskLevel === 'CRITICAL') {
        analysis.riskFactors.push({
          category: 'Sender Risk',
          factor: 'High-risk sender',
          risk: senderReputation.riskScore,
          severity: senderReputation.riskLevel,
          description: `Transaction from high-risk address: ${tx.from}`,
        });
      }

      if (tx.to) {
        const receiverReputation = await this.getWalletReputation(tx.to, network);
        if (receiverReputation.riskLevel === 'HIGH' || receiverReputation.riskLevel === 'CRITICAL') {
          analysis.riskFactors.push({
            category: 'Receiver Risk',
            factor: 'High-risk receiver',
            risk: receiverReputation.riskScore,
            severity: receiverReputation.riskLevel,
            description: `Transaction to high-risk address: ${tx.to}`,
          });
        }
      }

      // Check for suspicious transaction patterns
      await this.analyzeSuspiciousTransactionPatterns(analysis, tx, receipt, network);

      // Cache the result
      await this.redis.set(cacheKey, analysis, config.redis.ttl.contractAnalysis);

      return analysis;
    } catch (error) {
      logger.error(`Failed to analyze transaction ${hash} on ${network}:`, error);
      throw error;
    }
  }

  public async checkPhishingAddress(address: string): Promise<{
    isPhishing: boolean;
    confidence: number;
    source: string;
    reportedAt?: Date;
  }> {
    const cacheKey = this.redis.generateKey('phishing-check', address);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Check against known phishing addresses
      if (this.KNOWN_PHISHING_ADDRESSES.has(address.toLowerCase())) {
        const result = {
          isPhishing: true,
          confidence: 100,
          source: 'Known phishing database',
          reportedAt: new Date(),
        };
        await this.redis.set(cacheKey, result, 3600); // Cache for 1 hour
        return result;
      }

      // Check against external phishing databases
      const externalCheck = await this.checkExternalPhishingDatabases(address);
      if (externalCheck.isPhishing) {
        await this.redis.set(cacheKey, externalCheck, 3600);
        return externalCheck;
      }

      const result = {
        isPhishing: false,
        confidence: 0,
        source: 'No matches found',
      };

      await this.redis.set(cacheKey, result, 1800); // Cache for 30 minutes
      return result;
    } catch (error) {
      logger.error(`Failed to check phishing address ${address}:`, error);
      throw error;
    }
  }

  public async detectMixerUsage(address: string, network: BlockchainNetwork): Promise<{
    usesMixers: boolean;
    mixerInteractions: string[];
    riskScore: number;
  }> {
    const cacheKey = this.redis.generateKey('mixer-check', network, address);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const mixerInteractions: string[] = [];
      let riskScore = 0;

      // Get recent transactions
      const transactions = await this.getWalletTransactions(address, network, 100);

      for (const tx of transactions) {
        // Check if transaction involves known mixer addresses
        if (this.KNOWN_MIXER_ADDRESSES.has(tx.to?.toLowerCase() || '')) {
          mixerInteractions.push(tx.hash);
          riskScore += 25;
        }

        if (this.KNOWN_MIXER_ADDRESSES.has(tx.from?.toLowerCase() || '')) {
          mixerInteractions.push(tx.hash);
          riskScore += 25;
        }
      }

      const result = {
        usesMixers: mixerInteractions.length > 0,
        mixerInteractions,
        riskScore: Math.min(riskScore, 100),
      };

      await this.redis.set(cacheKey, result, config.redis.ttl.walletReputation);
      return result;
    } catch (error) {
      logger.error(`Failed to detect mixer usage for ${address}:`, error);
      throw error;
    }
  }

  private async analyzeBasicWalletInfo(reputation: WalletReputation, network: BlockchainNetwork): Promise<void> {
    try {
      // Get basic wallet info
      const balance = await this.web3Provider.getBalance(reputation.address, network);
      const txCount = await this.web3Provider.getTransactionCount(reputation.address, network);

      reputation.transactionCount = txCount || 0;

      // Get first and last transaction timestamps
      const timestamps = await this.getWalletActivityTimestamps(reputation.address, network);
      if (timestamps) {
        reputation.firstSeen = timestamps.firstSeen;
        reputation.lastSeen = timestamps.lastSeen;
      }

      // Check if it's a contract address
      const code = await this.web3Provider.getContractCode(reputation.address, network);
      if (code && code !== '0x') {
        reputation.labels.push('Smart Contract');
        
        // Contracts have different risk profiles
        reputation.riskFactors.push({
          category: 'Address Type',
          factor: 'Smart Contract',
          risk: 0, // Neutral, depends on the contract
          severity: 'LOW',
          description: 'This address is a smart contract',
        });
      } else {
        reputation.labels.push('Externally Owned Account');
      }

      // Check account age
      const accountAge = Date.now() - reputation.firstSeen.getTime();
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

      if (daysSinceCreation < 7) {
        reputation.riskFactors.push({
          category: 'Account Age',
          factor: 'Very new account',
          risk: 30,
          severity: 'MEDIUM',
          description: `Account created less than 7 days ago (${Math.floor(daysSinceCreation)} days)`,
        });
        reputation.riskScore += 30;
      } else if (daysSinceCreation < 30) {
        reputation.riskFactors.push({
          category: 'Account Age',
          factor: 'New account',
          risk: 15,
          severity: 'LOW',
          description: `Account created less than 30 days ago (${Math.floor(daysSinceCreation)} days)`,
        });
        reputation.riskScore += 15;
      }

    } catch (error) {
      logger.error(`Failed to analyze basic wallet info:`, error);
    }
  }

  private async checkKnownAddresses(reputation: WalletReputation): Promise<void> {
    const address = reputation.address.toLowerCase();

    // Check against known scammer addresses
    if (this.KNOWN_SCAMMER_ADDRESSES.has(address)) {
      reputation.labels.push('Known Scammer');
      reputation.riskScore += 100;
      reputation.riskFactors.push({
        category: 'Known Threats',
        factor: 'Known scammer address',
        risk: 100,
        severity: 'CRITICAL',
        description: 'This address is in the known scammer database',
      });
    }

    // Check against known phishing addresses
    if (this.KNOWN_PHISHING_ADDRESSES.has(address)) {
      reputation.labels.push('Known Phishing');
      reputation.riskScore += 90;
      reputation.riskFactors.push({
        category: 'Known Threats',
        factor: 'Known phishing address',
        risk: 90,
        severity: 'CRITICAL',
        description: 'This address is associated with phishing attacks',
      });
    }

    // Check against known mixer addresses
    if (this.KNOWN_MIXER_ADDRESSES.has(address)) {
      reputation.labels.push('Mixer/Tumbler');
      reputation.riskScore += 70;
      reputation.riskFactors.push({
        category: 'Privacy Tools',
        factor: 'Mixer/Tumbler service',
        risk: 70,
        severity: 'HIGH',
        description: 'This address belongs to a cryptocurrency mixer/tumbler service',
      });
    }
  }

  private async analyzeTransactionHistory(reputation: WalletReputation, network: BlockchainNetwork): Promise<void> {
    try {
      const transactions = await this.getWalletTransactions(reputation.address, network, 50);
      
      if (transactions.length === 0) {
        reputation.riskFactors.push({
          category: 'Transaction History',
          factor: 'No transaction history',
          risk: 20,
          severity: 'LOW',
          description: 'Address has no transaction history',
        });
        reputation.riskScore += 20;
        return;
      }

      // Analyze transaction patterns
      this.analyzeTransactionPatterns(reputation, transactions);
      
    } catch (error) {
      logger.error(`Failed to analyze transaction history:`, error);
    }
  }

  private analyzeTransactionPatterns(reputation: WalletReputation, transactions: any[]): void {
    // Check for rapid consecutive transactions
    let rapidTransfers = 0;
    let roundAmountTransfers = 0;
    
    for (let i = 0; i < transactions.length - 1; i++) {
      const current = transactions[i];
      const next = transactions[i + 1];
      
      // Check for rapid transfers (within 1 minute)
      const timeDiff = Math.abs(current.timestamp - next.timestamp);
      if (timeDiff < 60) {
        rapidTransfers++;
      }
      
      // Check for round amounts (suspicious for automation)
      const value = parseFloat(current.value);
      if (value > 0 && value === Math.round(value)) {
        roundAmountTransfers++;
      }
    }

    // Rapid transfers risk
    if (rapidTransfers > 5) {
      reputation.suspiciousActivities.push({
        type: this.SUSPICIOUS_PATTERNS.RAPID_TRANSFERS,
        description: `${rapidTransfers} rapid consecutive transfers detected`,
        severity: rapidTransfers > 20 ? 'HIGH' : 'MEDIUM',
        detectedAt: new Date(),
      });
      reputation.riskScore += Math.min(rapidTransfers * 2, 40);
    }

    // Round amounts risk
    if (roundAmountTransfers > transactions.length * 0.5) {
      reputation.suspiciousActivities.push({
        type: this.SUSPICIOUS_PATTERNS.ROUND_AMOUNTS,
        description: 'High frequency of round number transactions',
        severity: 'MEDIUM',
        detectedAt: new Date(),
      });
      reputation.riskScore += 20;
    }
  }

  private async detectSuspiciousPatterns(reputation: WalletReputation, network: BlockchainNetwork): Promise<void> {
    try {
      // Check for MEV bot behavior
      const isMEVBot = await this.detectMEVBotBehavior(reputation.address, network);
      if (isMEVBot) {
        reputation.labels.push('MEV Bot');
        reputation.suspiciousActivities.push({
          type: this.SUSPICIOUS_PATTERNS.MEV_BOT,
          description: 'Address shows MEV bot behavior patterns',
          severity: 'MEDIUM',
          detectedAt: new Date(),
        });
        reputation.riskScore += 30;
      }

      // Check for sandwich attack patterns
      const sandwichAttacks = await this.detectSandwichAttacks(reputation.address, network);
      if (sandwichAttacks > 0) {
        reputation.labels.push('Sandwich Attacker');
        reputation.suspiciousActivities.push({
          type: this.SUSPICIOUS_PATTERNS.SANDWICH_ATTACK,
          description: `${sandwichAttacks} potential sandwich attacks detected`,
          severity: sandwichAttacks > 10 ? 'HIGH' : 'MEDIUM',
          detectedAt: new Date(),
        });
        reputation.riskScore += Math.min(sandwichAttacks * 10, 50);
      }

      // Check for flash loan usage
      const flashLoanUsage = await this.detectFlashLoanUsage(reputation.address, network);
      if (flashLoanUsage.count > 0) {
        reputation.labels.push('Flash Loan User');
        reputation.suspiciousActivities.push({
          type: this.SUSPICIOUS_PATTERNS.FLASH_LOAN,
          description: `${flashLoanUsage.count} flash loan transactions detected`,
          severity: flashLoanUsage.count > 5 ? 'HIGH' : 'MEDIUM',
          detectedAt: new Date(),
        });
        reputation.riskScore += Math.min(flashLoanUsage.count * 5, 30);
      }

    } catch (error) {
      logger.error(`Failed to detect suspicious patterns:`, error);
    }
  }

  private calculateFinalRiskScore(reputation: WalletReputation): void {
    // Ensure risk score doesn't exceed 100
    reputation.riskScore = Math.min(reputation.riskScore, 100);
    
    // Determine risk level
    if (reputation.riskScore >= 80) {
      reputation.riskLevel = 'CRITICAL';
    } else if (reputation.riskScore >= 60) {
      reputation.riskLevel = 'HIGH';
    } else if (reputation.riskScore >= 30) {
      reputation.riskLevel = 'MEDIUM';
    } else {
      reputation.riskLevel = 'LOW';
    }
  }

  private async analyzeSuspiciousTransactionPatterns(
    analysis: TransactionAnalysis, 
    tx: any, 
    receipt: any, 
    network: BlockchainNetwork
  ): Promise<void> {
    // Check for unusually high gas price
    const avgGasPrice = await this.getAverageGasPrice(network);
    if (avgGasPrice && parseFloat(tx.gasPrice) > avgGasPrice * 2) {
      analysis.suspiciousPatterns.push('Unusually high gas price');
      analysis.riskFactors.push({
        category: 'Transaction Patterns',
        factor: 'High gas price',
        risk: 20,
        severity: 'MEDIUM',
        description: 'Transaction uses unusually high gas price',
      });
    }

    // Check for failed transaction
    if (!analysis.status) {
      analysis.suspiciousPatterns.push('Failed transaction');
      analysis.riskFactors.push({
        category: 'Transaction Status',
        factor: 'Failed transaction',
        risk: 15,
        severity: 'LOW',
        description: 'Transaction failed during execution',
      });
    }

    // Check for large value transfers
    const valueInEth = parseFloat(ethers.formatEther(tx.value || '0'));
    if (valueInEth > 100) { // More than 100 ETH equivalent
      analysis.suspiciousPatterns.push('Large value transfer');
      analysis.riskFactors.push({
        category: 'Transaction Value',
        factor: 'Large value transfer',
        risk: Math.min(valueInEth / 10, 50),
        severity: valueInEth > 1000 ? 'HIGH' : 'MEDIUM',
        description: `Large value transfer: ${valueInEth.toFixed(4)} ETH`,
      });
    }
  }

  private async getWalletActivityTimestamps(address: string, network: BlockchainNetwork): Promise<{
    firstSeen: Date;
    lastSeen: Date;
  } | null> {
    try {
      // This would typically query a blockchain indexer or explorer API
      // For now, return current time as placeholder
      const now = new Date();
      return {
        firstSeen: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        lastSeen: now,
      };
    } catch (error) {
      logger.error(`Failed to get wallet activity timestamps:`, error);
      return null;
    }
  }

  private async getWalletTransactions(address: string, network: BlockchainNetwork, limit: number): Promise<any[]> {
    try {
      // This would typically query a blockchain indexer or explorer API
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      logger.error(`Failed to get wallet transactions:`, error);
      return [];
    }
  }

  private async detectMEVBotBehavior(address: string, network: BlockchainNetwork): Promise<boolean> {
    // This would implement MEV bot detection logic
    return false;
  }

  private async detectSandwichAttacks(address: string, network: BlockchainNetwork): Promise<number> {
    // This would implement sandwich attack detection
    return 0;
  }

  private async detectFlashLoanUsage(address: string, network: BlockchainNetwork): Promise<{ count: number }> {
    // This would implement flash loan detection
    return { count: 0 };
  }

  private async getAverageGasPrice(network: BlockchainNetwork): Promise<number | null> {
    try {
      const gasPrice = await this.web3Provider.getGasPrice(network);
      return gasPrice ? parseFloat(gasPrice) : null;
    } catch (error) {
      return null;
    }
  }

  private async checkExternalPhishingDatabases(address: string): Promise<{
    isPhishing: boolean;
    confidence: number;
    source: string;
    reportedAt?: Date;
  }> {
    // This would check against external phishing databases
    return {
      isPhishing: false,
      confidence: 0,
      source: 'External database check',
    };
  }
}