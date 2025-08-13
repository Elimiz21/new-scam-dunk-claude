import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { TokenVerificationService } from '../services/token-verification.service';
import { WalletReputationService } from '../services/wallet-reputation.service';
import { Web3ProviderService } from '../services/web3-provider.service';
import { logger } from '../utils/logger';
import { ApiResponse, BlockchainNetwork } from '../types';

const router = Router();
const tokenService = TokenVerificationService.getInstance();
const walletService = WalletReputationService.getInstance();
const web3Service = Web3ProviderService.getInstance();

// Validation schemas
const tokenVerificationSchema = Joi.object({
  address: Joi.string().required().min(20).max(100),
  network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
});

const walletVerificationSchema = Joi.object({
  address: Joi.string().required().min(20).max(100),
  network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
});

const transactionAnalysisSchema = Joi.object({
  hash: Joi.string().required().min(60).max(70),
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
 * POST /verify/token
 * Verify token contract and analyze risks
 */
router.post('/verify/token', async (req: Request, res: Response): Promise<Response> => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Validate request
    const { error, value } = tokenVerificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { address, network } = value;

    logger.info('Token verification request', { 
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

    // Get token metadata
    const metadata = await tokenService.getTokenMetadata(address, network as BlockchainNetwork);
    
    // Analyze token holders
    const holderAnalysis = await tokenService.analyzeHolders(address, network as BlockchainNetwork);
    
    // Get liquidity information
    const liquidityInfo = await tokenService.getLiquidityInfo(address, network as BlockchainNetwork);
    
    // Get trading volume
    const tradingVolume = await tokenService.getTradingVolume(address, network as BlockchainNetwork);
    
    // Detect fake volume
    const fakeVolumeAnalysis = await tokenService.detectFakeVolume(address, network as BlockchainNetwork);
    
    // Detect price manipulation
    const priceManipulation = await tokenService.detectPriceManipulation(address, network as BlockchainNetwork);

    const result = {
      token: {
        address,
        network,
        metadata,
        holderAnalysis,
        liquidityInfo,
        tradingVolume,
      },
      riskAnalysis: {
        fakeVolume: fakeVolumeAnalysis,
        priceManipulation,
      },
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Token verification completed', { 
      requestId, 
      address, 
      processingTime: Date.now() - startTime 
    });

    return res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Token verification failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * POST /verify/wallet
 * Check wallet reputation and risk factors
 */
router.post('/verify/wallet', async (req: Request, res: Response): Promise<Response> => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Validate request
    const { error, value } = walletVerificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { address, network } = value;

    logger.info('Wallet verification request', { 
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

    // Get wallet reputation
    const reputation = await walletService.getWalletReputation(address, network as BlockchainNetwork);
    
    // Check for phishing
    const phishingCheck = await walletService.checkPhishingAddress(address);
    
    // Check for mixer usage
    const mixerUsage = await walletService.detectMixerUsage(address, network as BlockchainNetwork);

    const result = {
      wallet: {
        address,
        network,
        reputation,
        phishingCheck,
        mixerUsage,
      },
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Wallet verification completed', { 
      requestId, 
      address, 
      riskLevel: reputation.riskLevel,
      processingTime: Date.now() - startTime 
    });

    return res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Wallet verification failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * POST /scan/transaction
 * Analyze transaction for suspicious patterns
 */
router.post('/scan/transaction', async (req: Request, res: Response): Promise<Response> => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Validate request
    const { error, value } = transactionAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { hash, network } = value;

    logger.info('Transaction analysis request', { 
      requestId, 
      hash, 
      network,
      ip: req.ip 
    });

    // Analyze transaction
    const analysis = await walletService.analyzeTransaction(hash, network as BlockchainNetwork);

    const result = {
      transaction: analysis,
      analysisTimestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Transaction analysis completed', { 
      requestId, 
      hash, 
      riskFactorsCount: analysis.riskFactors.length,
      processingTime: Date.now() - startTime 
    });

    return res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Transaction analysis failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * POST /verify/bulk
 * Bulk verification for multiple addresses
 */
router.post('/verify/bulk', async (req: Request, res: Response): Promise<Response> => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const bulkSchema = Joi.object({
      addresses: Joi.array().items(Joi.string().required()).min(1).max(10).required(),
      network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
      type: Joi.string().valid('token', 'wallet').required(),
    });

    // Validate request
    const { error, value } = bulkSchema.validate(req.body);
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    const { addresses, network, type } = value;

    logger.info('Bulk verification request', { 
      requestId, 
      addressCount: addresses.length,
      network,
      type,
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

        if (type === 'token') {
          const metadata = await tokenService.getTokenMetadata(address, network as BlockchainNetwork);
          const holderAnalysis = await tokenService.analyzeHolders(address, network as BlockchainNetwork);
          
          results.push({
            address,
            success: true,
            data: {
              metadata,
              holderAnalysis,
            },
          });
        } else if (type === 'wallet') {
          const reputation = await walletService.getWalletReputation(address, network as BlockchainNetwork);
          
          results.push({
            address,
            success: true,
            data: {
              reputation,
            },
          });
        }
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

    logger.info('Bulk verification completed', { 
      requestId, 
      total: addresses.length,
      successful: result.summary.successful,
      failed: result.summary.failed,
      processingTime: Date.now() - startTime 
    });

    return res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Bulk verification failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * GET /verify/status/:requestId
 * Get status of a verification request (for async processing)
 */
router.get('/verify/status/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    // This would typically check a job queue or database for the request status
    // For now, return a simple response
    const result = {
      requestId,
      status: 'completed',
      progress: 100,
      result: null,
    };

    return res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Status check failed', { 
      requestId: req.params.requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

export { router as verificationRouter };