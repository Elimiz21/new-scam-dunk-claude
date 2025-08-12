import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { ContractAnalysisService } from '../services/contract-analysis.service';
import { Web3ProviderService } from '../services/web3-provider.service';
import { logger } from '../utils/logger';
import { ApiResponse, BlockchainNetwork } from '../types';

const router = Router();
const contractService = ContractAnalysisService.getInstance();
const web3Service = Web3ProviderService.getInstance();

// Validation schemas
const contractAnalysisSchema = Joi.object({
  address: Joi.string().required().min(20).max(100),
  network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
});

// Helper function to create API response
const createResponse = <T>(success: boolean, data?: T, error?: string): ApiResponse<T> => ({
  success,
  data,
  error,
  timestamp: new Date(),
  requestId: uuidv4(),
});

/**
 * POST /analyze/contract
 * Analyze smart contract for security issues
 */
router.post('/analyze/contract', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Validate request
    const { error, value } = contractAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { address, network } = value;

    logger.info('Contract analysis request', { 
      requestId, 
      address, 
      network,
      ip: req.ip 
    });

    // Validate address format
    const isValidAddress = await web3Service.isValidAddress(address, network as BlockchainNetwork);
    if (!isValidAddress) {
      return res.status(400).json(createResponse(false, null, 'Invalid address format'));
    }

    // Check if address is actually a contract
    const code = await web3Service.getContractCode(address, network as BlockchainNetwork);
    if (!code || code === '0x') {
      return res.status(400).json(createResponse(false, null, 'Address is not a smart contract'));
    }

    // Analyze contract
    const contractInfo = await contractService.analyzeContract(address, network as BlockchainNetwork);
    
    // Check code similarity to known scams
    const similarityAnalysis = await contractService.checkCodeSimilarity(address, network as BlockchainNetwork);

    const result = {
      contract: {
        address,
        network,
        info: contractInfo,
        similarityAnalysis,
      },
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Contract analysis completed', { 
      requestId, 
      address, 
      verified: contractInfo.verified,
      isProxy: contractInfo.isProxy,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Contract analysis failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * POST /detect/honeypot
 * Detect if a token contract is a honeypot
 */
router.post('/detect/honeypot', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Validate request
    const { error, value } = contractAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { address, network } = value;

    logger.info('Honeypot detection request', { 
      requestId, 
      address, 
      network,
      ip: req.ip 
    });

    // Validate address format
    const isValidAddress = await web3Service.isValidAddress(address, network as BlockchainNetwork);
    if (!isValidAddress) {
      return res.status(400).json(createResponse(false, null, 'Invalid address format'));
    }

    // Detect honeypot
    const honeypotAnalysis = await contractService.detectHoneypot(address, network as BlockchainNetwork);

    const result = {
      address,
      network,
      honeypotAnalysis,
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Honeypot detection completed', { 
      requestId, 
      address, 
      isHoneypot: honeypotAnalysis.isHoneypot,
      confidence: honeypotAnalysis.confidence,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Honeypot detection failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * POST /detect/rugpull
 * Detect rug pull risk indicators
 */
router.post('/detect/rugpull', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Validate request
    const { error, value } = contractAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { address, network } = value;

    logger.info('Rug pull detection request', { 
      requestId, 
      address, 
      network,
      ip: req.ip 
    });

    // Validate address format
    const isValidAddress = await web3Service.isValidAddress(address, network as BlockchainNetwork);
    if (!isValidAddress) {
      return res.status(400).json(createResponse(false, null, 'Invalid address format'));
    }

    // Detect rug pull risk
    const rugPullAnalysis = await contractService.detectRugPull(address, network as BlockchainNetwork);

    const result = {
      address,
      network,
      rugPullAnalysis,
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Rug pull detection completed', { 
      requestId, 
      address, 
      riskLevel: rugPullAnalysis.riskLevel,
      riskScore: rugPullAnalysis.riskScore,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Rug pull detection failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * POST /analyze/comprehensive
 * Comprehensive analysis including all detection methods
 */
router.post('/analyze/comprehensive', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Validate request
    const { error, value } = contractAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { address, network } = value;

    logger.info('Comprehensive analysis request', { 
      requestId, 
      address, 
      network,
      ip: req.ip 
    });

    // Validate address format
    const isValidAddress = await web3Service.isValidAddress(address, network as BlockchainNetwork);
    if (!isValidAddress) {
      return res.status(400).json(createResponse(false, null, 'Invalid address format'));
    }

    // Check if address is actually a contract
    const code = await web3Service.getContractCode(address, network as BlockchainNetwork);
    if (!code || code === '0x') {
      return res.status(400).json(createResponse(false, null, 'Address is not a smart contract'));
    }

    // Run all analyses in parallel for better performance
    const [
      contractInfo,
      honeypotAnalysis,
      rugPullAnalysis,
      similarityAnalysis,
    ] = await Promise.all([
      contractService.analyzeContract(address, network as BlockchainNetwork),
      contractService.detectHoneypot(address, network as BlockchainNetwork),
      contractService.detectRugPull(address, network as BlockchainNetwork),
      contractService.checkCodeSimilarity(address, network as BlockchainNetwork),
    ]);

    // Calculate overall risk score
    const overallRiskScore = Math.max(
      honeypotAnalysis.confidence,
      rugPullAnalysis.riskScore,
      similarityAnalysis.isKnownScam ? 100 : similarityAnalysis.similarityScore
    );

    let overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (overallRiskScore >= 80) overallRiskLevel = 'CRITICAL';
    else if (overallRiskScore >= 60) overallRiskLevel = 'HIGH';
    else if (overallRiskScore >= 30) overallRiskLevel = 'MEDIUM';
    else overallRiskLevel = 'LOW';

    const result = {
      contract: {
        address,
        network,
        info: contractInfo,
      },
      analysis: {
        honeypot: honeypotAnalysis,
        rugPull: rugPullAnalysis,
        codeSimilarity: similarityAnalysis,
        overall: {
          riskScore: overallRiskScore,
          riskLevel: overallRiskLevel,
          recommendations: generateRecommendations(overallRiskLevel, {
            honeypot: honeypotAnalysis,
            rugPull: rugPullAnalysis,
            similarity: similarityAnalysis,
          }),
        },
      },
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Comprehensive analysis completed', { 
      requestId, 
      address, 
      overallRiskLevel,
      overallRiskScore,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Comprehensive analysis failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * GET /analyze/supported-networks
 * Get list of supported networks for analysis
 */
router.get('/analyze/supported-networks', (req: Request, res: Response) => {
  const supportedNetworks = web3Service.getSupportedNetworks();
  
  const networksInfo = supportedNetworks.map(network => ({
    id: network,
    name: getNetworkDisplayName(network),
    chainId: getNetworkChainId(network),
    supported: true,
    features: {
      contractAnalysis: ['ethereum', 'bsc', 'polygon'].includes(network),
      honeypotDetection: ['ethereum', 'bsc', 'polygon'].includes(network),
      rugPullDetection: ['ethereum', 'bsc', 'polygon'].includes(network),
      walletAnalysis: true,
    },
  }));

  res.json(createResponse(true, {
    networks: networksInfo,
    totalSupported: supportedNetworks.length,
  }));
});

/**
 * POST /analyze/batch
 * Batch analysis for multiple contracts
 */
router.post('/analyze/batch', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const batchSchema = Joi.object({
      addresses: Joi.array().items(Joi.string().required()).min(1).max(5).required(),
      network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
      analysisType: Joi.string().valid('honeypot', 'rugpull', 'comprehensive').default('comprehensive'),
    });

    // Validate request
    const { error, value } = batchSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { addresses, network, analysisType } = value;

    logger.info('Batch analysis request', { 
      requestId, 
      addressCount: addresses.length,
      network,
      analysisType,
      ip: req.ip 
    });

    const results = [];

    for (const address of addresses) {
      try {
        // Validate address format
        const isValidAddress = await web3Service.isValidAddress(address, network as BlockchainNetwork);
        if (!isValidAddress) {
          results.push({
            address,
            success: false,
            error: 'Invalid address format',
          });
          continue;
        }

        // Check if address is actually a contract
        const code = await web3Service.getContractCode(address, network as BlockchainNetwork);
        if (!code || code === '0x') {
          results.push({
            address,
            success: false,
            error: 'Address is not a smart contract',
          });
          continue;
        }

        let analysisResult;
        
        switch (analysisType) {
          case 'honeypot':
            analysisResult = await contractService.detectHoneypot(address, network as BlockchainNetwork);
            break;
          case 'rugpull':
            analysisResult = await contractService.detectRugPull(address, network as BlockchainNetwork);
            break;
          case 'comprehensive':
          default:
            const [honeypot, rugPull, similarity] = await Promise.all([
              contractService.detectHoneypot(address, network as BlockchainNetwork),
              contractService.detectRugPull(address, network as BlockchainNetwork),
              contractService.checkCodeSimilarity(address, network as BlockchainNetwork),
            ]);
            analysisResult = { honeypot, rugPull, similarity };
            break;
        }

        results.push({
          address,
          success: true,
          data: analysisResult,
        });

      } catch (error) {
        results.push({
          address,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const result = {
      results,
      summary: {
        total: addresses.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Batch analysis completed', { 
      requestId, 
      total: addresses.length,
      successful: result.summary.successful,
      failed: result.summary.failed,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Batch analysis failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

// Helper functions
function generateRecommendations(
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  analyses: {
    honeypot: any;
    rugPull: any;
    similarity: any;
  }
): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'CRITICAL') {
    recommendations.push('🚨 CRITICAL RISK: Do not interact with this contract');
    recommendations.push('This contract shows multiple high-risk indicators');
  }

  if (analyses.honeypot.isHoneypot) {
    recommendations.push('⚠️ Honeypot detected: You may not be able to sell this token');
  }

  if (analyses.rugPull.riskLevel === 'HIGH' || analyses.rugPull.riskLevel === 'CRITICAL') {
    recommendations.push('🎯 High rug pull risk: Liquidity may be removed at any time');
  }

  if (analyses.similarity.isKnownScam) {
    recommendations.push('🔍 Code similarity to known scams detected');
  }

  if (riskLevel === 'LOW') {
    recommendations.push('✅ Low risk detected, but always do your own research');
  }

  return recommendations;
}

function getNetworkDisplayName(network: BlockchainNetwork): string {
  const names = {
    ethereum: 'Ethereum',
    bsc: 'Binance Smart Chain',
    polygon: 'Polygon',
    solana: 'Solana',
    bitcoin: 'Bitcoin',
  };
  return names[network] || network;
}

function getNetworkChainId(network: BlockchainNetwork): number {
  const chainIds = {
    ethereum: 1,
    bsc: 56,
    polygon: 137,
    solana: 0, // Solana doesn't use EVM chain IDs
    bitcoin: 0, // Bitcoin doesn't use EVM chain IDs
  };
  return chainIds[network] || 0;
}

export { router as analysisRouter };