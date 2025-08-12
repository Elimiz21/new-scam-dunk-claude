import { ethers } from 'ethers';
import axios from 'axios';
import { Web3ProviderService } from './web3-provider.service';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import {
  ContractInfo,
  ContractFunction,
  RiskFactor,
  RiskIndicators,
  BlockchainNetwork,
  SecurityAudit,
} from '../types';

export class ContractAnalysisService {
  private static instance: ContractAnalysisService;
  private web3Provider: Web3ProviderService;
  private redis: RedisService;

  // Known dangerous function signatures
  private readonly DANGEROUS_FUNCTIONS = [
    'renounceOwnership()',
    'mint(uint256)',
    'mint(address,uint256)',
    'burn(uint256)',
    'burnFrom(address,uint256)',
    'setTaxFee(uint256)',
    'setLiquidityFee(uint256)',
    'excludeFromFee(address)',
    'includeInFee(address)',
    'swapAndLiquifyEnabled()',
    'setSwapAndLiquifyEnabled(bool)',
    'transferOwnership(address)',
    'pause()',
    'unpause()',
    'blacklist(address)',
    'unblacklist(address)',
    'setMaxTxAmount(uint256)',
    'setMinTokensBeforeSwap(uint256)',
  ];

  // Known honeypot patterns
  private readonly HONEYPOT_PATTERNS = [
    /require\s*\(\s*from\s*!=\s*uniswapV2Pair/gi,
    /require\s*\(\s*amount\s*<=\s*maxTxAmount/gi,
    /if\s*\(\s*to\s*==\s*uniswapV2Pair\s*\)/gi,
    /modifier\s+onlyOwner/gi,
    /transfer.*revert/gi,
    /balanceOf.*transfer.*false/gi,
  ];

  // Known rug pull indicators
  private readonly RUG_PULL_INDICATORS = [
    /removeLiquidity/gi,
    /emergencyWithdraw/gi,
    /migrateLiquidity/gi,
    /teamWithdraw/gi,
    /devWithdraw/gi,
    /rugPull/gi,
    /withdrawETH/gi,
    /withdrawToken/gi,
  ];

  private constructor() {
    this.web3Provider = Web3ProviderService.getInstance();
    this.redis = RedisService.getInstance();
  }

  public static getInstance(): ContractAnalysisService {
    if (!ContractAnalysisService.instance) {
      ContractAnalysisService.instance = new ContractAnalysisService();
    }
    return ContractAnalysisService.instance;
  }

  public async analyzeContract(address: string, network: BlockchainNetwork): Promise<ContractInfo> {
    const cacheKey = this.redis.generateKey('contract', network, address);
    
    // Check cache first
    const cached = await this.redis.get<ContractInfo>(cacheKey);
    if (cached) {
      logger.info(`Contract analysis cache hit for ${address} on ${network}`);
      return cached;
    }

    logger.info(`Analyzing contract ${address} on ${network}`);
    
    const contractInfo: ContractInfo = {
      address,
      creator: '',
      createdAt: new Date(),
      verified: false,
      isProxy: false,
    };

    try {
      // Get contract creation info from blockchain explorer
      const creationInfo = await this.getContractCreationInfo(address, network);
      if (creationInfo) {
        contractInfo.creator = creationInfo.creator;
        contractInfo.createdAt = creationInfo.createdAt;
      }

      // Get contract source code and ABI
      const sourceInfo = await this.getContractSourceCode(address, network);
      if (sourceInfo) {
        contractInfo.verified = true;
        contractInfo.sourceCode = sourceInfo.sourceCode;
        contractInfo.abi = sourceInfo.abi;
        contractInfo.compiler = sourceInfo.compiler;
      }

      // Check if contract is a proxy
      contractInfo.isProxy = await this.isProxyContract(address, network);
      if (contractInfo.isProxy) {
        contractInfo.proxyImplementation = await this.getProxyImplementation(address, network);
      }

      // Cache the result
      await this.redis.set(cacheKey, contractInfo, config.redis.ttl.contractAnalysis);

      return contractInfo;
    } catch (error) {
      logger.error(`Failed to analyze contract ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async detectHoneypot(address: string, network: BlockchainNetwork): Promise<{
    isHoneypot: boolean;
    confidence: number;
    indicators: string[];
  }> {
    const cacheKey = this.redis.generateKey('honeypot', network, address);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Detecting honeypot for ${address} on ${network}`);

    try {
      const indicators: string[] = [];
      let riskScore = 0;

      // Get contract source code
      const contractInfo = await this.analyzeContract(address, network);
      
      if (contractInfo.sourceCode) {
        // Check for honeypot patterns in source code
        for (const pattern of this.HONEYPOT_PATTERNS) {
          if (pattern.test(contractInfo.sourceCode)) {
            indicators.push(`Honeypot pattern detected: ${pattern.source}`);
            riskScore += 20;
          }
        }

        // Check for suspicious functions
        const suspiciousFunctions = this.findSuspiciousFunctions(contractInfo.sourceCode);
        indicators.push(...suspiciousFunctions);
        riskScore += suspiciousFunctions.length * 10;
      }

      // Simulate buy and sell transactions
      const simulationResults = await this.simulateTransactions(address, network);
      if (simulationResults.buySuccess && !simulationResults.sellSuccess) {
        indicators.push('Cannot sell tokens after purchase');
        riskScore += 50;
      }

      // Check for high transfer taxes
      const transferTax = await this.checkTransferTax(address, network);
      if (transferTax > 10) {
        indicators.push(`High transfer tax: ${transferTax}%`);
        riskScore += Math.min(transferTax, 30);
      }

      const result = {
        isHoneypot: riskScore >= 50,
        confidence: Math.min(riskScore, 100),
        indicators,
      };

      // Cache the result
      await this.redis.set(cacheKey, result, config.redis.ttl.contractAnalysis);

      return result;
    } catch (error) {
      logger.error(`Failed to detect honeypot for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async detectRugPull(address: string, network: BlockchainNetwork): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;
    indicators: RiskFactor[];
  }> {
    const cacheKey = this.redis.generateKey('rugpull', network, address);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info(`Detecting rug pull risk for ${address} on ${network}`);

    try {
      const indicators: RiskFactor[] = [];
      let riskScore = 0;

      // Get contract info
      const contractInfo = await this.analyzeContract(address, network);

      // Check ownership concentration
      const ownershipRisk = await this.checkOwnershipConcentration(address, network);
      riskScore += ownershipRisk.score;
      indicators.push(...ownershipRisk.factors);

      // Check for dangerous functions
      if (contractInfo.sourceCode) {
        const dangerousFunctions = this.findDangerousFunctions(contractInfo.sourceCode);
        for (const func of dangerousFunctions) {
          indicators.push({
            category: 'Contract Functions',
            factor: `Dangerous function: ${func.name}`,
            risk: func.riskLevel === 'CRITICAL' ? 25 : func.riskLevel === 'HIGH' ? 15 : 10,
            severity: func.riskLevel || 'MEDIUM',
            description: `Contract contains potentially dangerous function: ${func.name}`,
          });
          riskScore += func.riskLevel === 'CRITICAL' ? 25 : func.riskLevel === 'HIGH' ? 15 : 10;
        }

        // Check for rug pull patterns
        for (const pattern of this.RUG_PULL_INDICATORS) {
          if (pattern.test(contractInfo.sourceCode)) {
            indicators.push({
              category: 'Code Patterns',
              factor: 'Rug pull pattern detected',
              risk: 30,
              severity: 'HIGH',
              description: `Code contains pattern associated with rug pulls: ${pattern.source}`,
            });
            riskScore += 30;
          }
        }
      }

      // Check liquidity lock status
      const liquidityRisk = await this.checkLiquidityLock(address, network);
      riskScore += liquidityRisk.score;
      indicators.push(...liquidityRisk.factors);

      // Check team token allocation
      const teamAllocation = await this.checkTeamTokenAllocation(address, network);
      if (teamAllocation > 20) {
        indicators.push({
          category: 'Token Distribution',
          factor: 'High team allocation',
          risk: Math.min(teamAllocation, 40),
          severity: teamAllocation > 50 ? 'CRITICAL' : teamAllocation > 30 ? 'HIGH' : 'MEDIUM',
          description: `Team holds ${teamAllocation}% of total supply`,
        });
        riskScore += Math.min(teamAllocation, 40);
      }

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (riskScore >= 80) riskLevel = 'CRITICAL';
      else if (riskScore >= 60) riskLevel = 'HIGH';
      else if (riskScore >= 30) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';

      const result = {
        riskLevel,
        riskScore: Math.min(riskScore, 100),
        indicators,
      };

      // Cache the result
      await this.redis.set(cacheKey, result, config.redis.ttl.contractAnalysis);

      return result;
    } catch (error) {
      logger.error(`Failed to detect rug pull risk for ${address} on ${network}:`, error);
      throw error;
    }
  }

  public async checkCodeSimilarity(address: string, network: BlockchainNetwork): Promise<{
    similarContracts: string[];
    similarityScore: number;
    isKnownScam: boolean;
  }> {
    const cacheKey = this.redis.generateKey('similarity', network, address);
    
    // Check cache first
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const contractInfo = await this.analyzeContract(address, network);
      
      if (!contractInfo.sourceCode) {
        return {
          similarContracts: [],
          similarityScore: 0,
          isKnownScam: false,
        };
      }

      // Get known scam contracts from database/cache
      const knownScamContracts = await this.getKnownScamContracts(network);
      
      const similarContracts: string[] = [];
      let highestSimilarity = 0;
      let isKnownScam = false;

      for (const scamAddress of knownScamContracts) {
        const similarity = await this.calculateCodeSimilarity(
          contractInfo.sourceCode,
          scamAddress,
          network
        );
        
        if (similarity > 70) {
          similarContracts.push(scamAddress);
          highestSimilarity = Math.max(highestSimilarity, similarity);
          
          if (similarity > 90) {
            isKnownScam = true;
          }
        }
      }

      const result = {
        similarContracts,
        similarityScore: highestSimilarity,
        isKnownScam,
      };

      // Cache the result
      await this.redis.set(cacheKey, result, config.redis.ttl.contractAnalysis);

      return result;
    } catch (error) {
      logger.error(`Failed to check code similarity for ${address} on ${network}:`, error);
      throw error;
    }
  }

  private async getContractCreationInfo(
    address: string,
    network: BlockchainNetwork
  ): Promise<{ creator: string; createdAt: Date } | null> {
    try {
      const apiKey = this.getExplorerApiKey(network);
      const baseUrl = this.getExplorerBaseUrl(network);
      
      const response = await axios.get(`${baseUrl}/api`, {
        params: {
          module: 'contract',
          action: 'getcontractcreation',
          contractaddresses: address,
          apikey: apiKey,
        },
      });

      if (response.data.status === '1' && response.data.result.length > 0) {
        const result = response.data.result[0];
        return {
          creator: result.contractCreator,
          createdAt: new Date(parseInt(result.txHash) * 1000), // This would need proper timestamp conversion
        };
      }

      return null;
    } catch (error) {
      logger.error(`Failed to get contract creation info for ${address}:`, error);
      return null;
    }
  }

  private async getContractSourceCode(
    address: string,
    network: BlockchainNetwork
  ): Promise<{ sourceCode: string; abi: any[]; compiler: string } | null> {
    try {
      const apiKey = this.getExplorerApiKey(network);
      const baseUrl = this.getExplorerBaseUrl(network);
      
      const response = await axios.get(`${baseUrl}/api`, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: address,
          apikey: apiKey,
        },
      });

      if (response.data.status === '1' && response.data.result.length > 0) {
        const result = response.data.result[0];
        
        if (result.SourceCode) {
          return {
            sourceCode: result.SourceCode,
            abi: JSON.parse(result.ABI || '[]'),
            compiler: result.CompilerVersion,
          };
        }
      }

      return null;
    } catch (error) {
      logger.error(`Failed to get contract source code for ${address}:`, error);
      return null;
    }
  }

  private async isProxyContract(address: string, network: BlockchainNetwork): Promise<boolean> {
    try {
      const code = await this.web3Provider.getContractCode(address, network);
      if (!code || code === '0x') return false;

      // Check for common proxy patterns
      const proxyPatterns = [
        '363d3d373d3d3d363d73', // EIP-1167 minimal proxy
        'a165627a7a72305820', // Solidity metadata hash
        '6080604052', // Common proxy initialization
      ];

      return proxyPatterns.some(pattern => code.includes(pattern));
    } catch (error) {
      logger.error(`Failed to check if contract is proxy for ${address}:`, error);
      return false;
    }
  }

  private async getProxyImplementation(address: string, network: BlockchainNetwork): Promise<string | undefined> {
    try {
      const web3 = this.web3Provider.getWeb3Provider(network);
      if (!web3) return undefined;

      // Try to get implementation from storage slot (EIP-1967)
      const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
      const implementation = await web3.eth.getStorageAt(address, implementationSlot);
      
      if (implementation && implementation !== '0x' + '0'.repeat(64)) {
        return '0x' + implementation.slice(-40);
      }

      return undefined;
    } catch (error) {
      logger.error(`Failed to get proxy implementation for ${address}:`, error);
      return undefined;
    }
  }

  private findSuspiciousFunctions(sourceCode: string): string[] {
    const indicators: string[] = [];
    
    // Look for functions that might prevent selling
    const suspiciousPatterns = [
      /function.*transfer.*onlyOwner/gi,
      /function.*approve.*onlyOwner/gi,
      /require.*_msgSender.*owner/gi,
      /modifier.*noReentrancy/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sourceCode)) {
        indicators.push(`Suspicious function pattern: ${pattern.source}`);
      }
    }

    return indicators;
  }

  private findDangerousFunctions(sourceCode: string): ContractFunction[] {
    const functions: ContractFunction[] = [];
    
    for (const dangerousFunc of this.DANGEROUS_FUNCTIONS) {
      if (sourceCode.includes(dangerousFunc)) {
        functions.push({
          name: dangerousFunc,
          type: 'function',
          inputs: [],
          outputs: [],
          stateMutability: 'nonpayable',
          suspicious: true,
          riskLevel: this.getDangerousFunctionRisk(dangerousFunc),
        });
      }
    }

    return functions;
  }

  private getDangerousFunctionRisk(functionName: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (functionName.includes('renounceOwnership') || functionName.includes('transferOwnership')) {
      return 'HIGH';
    }
    if (functionName.includes('mint') || functionName.includes('burn')) {
      return 'HIGH';
    }
    if (functionName.includes('blacklist') || functionName.includes('pause')) {
      return 'CRITICAL';
    }
    if (functionName.includes('Tax') || functionName.includes('Fee')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private async simulateTransactions(address: string, network: BlockchainNetwork): Promise<{
    buySuccess: boolean;
    sellSuccess: boolean;
  }> {
    // This would require complex simulation logic
    // For now, return a simplified result
    return {
      buySuccess: true,
      sellSuccess: true,
    };
  }

  private async checkTransferTax(address: string, network: BlockchainNetwork): Promise<number> {
    // This would require analyzing the contract's transfer function
    // For now, return 0 (no tax detected)
    return 0;
  }

  private async checkOwnershipConcentration(address: string, network: BlockchainNetwork): Promise<{
    score: number;
    factors: RiskFactor[];
  }> {
    // This would analyze token holder distribution
    // For now, return minimal risk
    return {
      score: 0,
      factors: [],
    };
  }

  private async checkLiquidityLock(address: string, network: BlockchainNetwork): Promise<{
    score: number;
    factors: RiskFactor[];
  }> {
    // This would check if liquidity is locked
    // For now, return minimal risk
    return {
      score: 0,
      factors: [],
    };
  }

  private async checkTeamTokenAllocation(address: string, network: BlockchainNetwork): Promise<number> {
    // This would analyze team token holdings
    // For now, return 0% team allocation
    return 0;
  }

  private async getKnownScamContracts(network: BlockchainNetwork): Promise<string[]> {
    // This would fetch from a database of known scam contracts
    // For now, return empty array
    return [];
  }

  private async calculateCodeSimilarity(
    sourceCode: string,
    scamAddress: string,
    network: BlockchainNetwork
  ): Promise<number> {
    // This would implement code similarity algorithm
    // For now, return 0 (no similarity)
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
}