import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { PriceFeedService } from '../services/price-feed.service';
import { Web3ProviderService } from '../services/web3-provider.service';
import { logger } from '../utils/logger';
import { ApiResponse, BlockchainNetwork } from '../types';

const router = Router();
const priceFeedService = PriceFeedService.getInstance();
const web3Service = Web3ProviderService.getInstance();

// Validation schemas
const priceQuerySchema = Joi.object({
  token: Joi.string().required().min(20).max(100),
  network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
  vs_currency: Joi.string().valid('usd', 'eth', 'btc', 'eur', 'gbp').default('usd'),
});

const liquidityQuerySchema = Joi.object({
  pair: Joi.string().required().min(20).max(100),
  network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
  dex: Joi.string().valid('uniswap', 'sushiswap', 'pancakeswap', 'quickswap').optional(),
});

const historicalPriceSchema = Joi.object({
  token: Joi.string().required().min(20).max(100),
  network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
  period: Joi.string().valid('1h', '24h', '7d', '30d', '1y').default('24h'),
  vs_currency: Joi.string().valid('usd', 'eth', 'btc', 'eur', 'gbp').default('usd'),
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
 * GET /price/:token
 * Get real-time price for a token
 */
router.get('/price/:token', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const { token } = req.params;
    const network = req.query.network as string;
    const vs_currency = (req.query.vs_currency as string) || 'usd';

    // Validate request
    const { error, value } = priceQuerySchema.validate({
      token,
      network,
      vs_currency,
    });
    
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    logger.info('Price query request', { 
      requestId, 
      token, 
      network,
      vs_currency,
      ip: req.ip 
    });

    // Validate address format
    const isValidAddress = await web3Service.isValidAddress(token, network as BlockchainNetwork);
    if (!isValidAddress) {
      return res.status(400).json(createResponse(false, null, 'Invalid token address format'));
    }

    // Get price data
    const priceData = await priceFeedService.getTokenPrice(token, network as BlockchainNetwork, vs_currency);

    const result = {
      token,
      network,
      priceData,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Price query completed', { 
      requestId, 
      token, 
      price: priceData.price,
      source: priceData.source,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Price query failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * GET /liquidity/:pair
 * Check liquidity for a trading pair
 */
router.get('/liquidity/:pair', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const { pair } = req.params;
    const network = req.query.network as string;
    const dex = req.query.dex as string;

    // Validate request
    const { error, value } = liquidityQuerySchema.validate({
      pair,
      network,
      dex,
    });
    
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    logger.info('Liquidity query request', { 
      requestId, 
      pair, 
      network,
      dex,
      ip: req.ip 
    });

    // Validate pair address format
    const isValidAddress = await web3Service.isValidAddress(pair, network as BlockchainNetwork);
    if (!isValidAddress) {
      return res.status(400).json(createResponse(false, null, 'Invalid pair address format'));
    }

    // Get liquidity data
    const liquidityData = await priceFeedService.getLiquidityData(pair, network as BlockchainNetwork, dex);

    const result = {
      pair,
      network,
      dex: dex || 'all',
      liquidityData,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Liquidity query completed', { 
      requestId, 
      pair, 
      totalLiquidity: liquidityData.totalLiquidity,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Liquidity query failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * GET /price/historical/:token
 * Get historical price data for a token
 */
router.get('/price/historical/:token', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const { token } = req.params;
    const network = req.query.network as string;
    const period = (req.query.period as string) || '24h';
    const vs_currency = (req.query.vs_currency as string) || 'usd';

    // Validate request
    const { error, value } = historicalPriceSchema.validate({
      token,
      network,
      period,
      vs_currency,
    });
    
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    logger.info('Historical price query request', { 
      requestId, 
      token, 
      network,
      period,
      vs_currency,
      ip: req.ip 
    });

    // Validate address format
    const isValidAddress = await web3Service.isValidAddress(token, network as BlockchainNetwork);
    if (!isValidAddress) {
      return res.status(400).json(createResponse(false, null, 'Invalid token address format'));
    }

    // Get historical price data
    const historicalData = await priceFeedService.getHistoricalPrices(
      token, 
      network as BlockchainNetwork, 
      period, 
      vs_currency
    );

    const result = {
      token,
      network,
      period,
      vs_currency,
      historicalData,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Historical price query completed', { 
      requestId, 
      token, 
      dataPoints: historicalData.prices.length,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Historical price query failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * GET /price/multi
 * Get prices for multiple tokens at once
 */
router.get('/price/multi', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const multiPriceSchema = Joi.object({
      tokens: Joi.array().items(Joi.string().required()).min(1).max(10).required(),
      network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
      vs_currency: Joi.string().valid('usd', 'eth', 'btc', 'eur', 'gbp').default('usd'),
    });

    // Parse comma-separated tokens from query parameter
    const tokensParam = req.query.tokens as string;
    const tokens = tokensParam ? tokensParam.split(',') : [];
    const network = req.query.network as string;
    const vs_currency = (req.query.vs_currency as string) || 'usd';

    // Validate request
    const { error, value } = multiPriceSchema.validate({
      tokens,
      network,
      vs_currency,
    });
    
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    logger.info('Multi-price query request', { 
      requestId, 
      tokenCount: tokens.length,
      network,
      vs_currency,
      ip: req.ip 
    });

    const results = [];

    for (const token of tokens) {
      try {
        // Validate address format
        const isValidAddress = await web3Service.isValidAddress(token, network as BlockchainNetwork);
        if (!isValidAddress) {
          results.push({
            token,
            success: false,
            error: 'Invalid address format',
          });
          continue;
        }

        // Get price data
        const priceData = await priceFeedService.getTokenPrice(token, network as BlockchainNetwork, vs_currency);
        
        results.push({
          token,
          success: true,
          data: priceData,
        });

      } catch (error) {
        results.push({
          token,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const result = {
      results,
      summary: {
        total: tokens.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Multi-price query completed', { 
      requestId, 
      total: tokens.length,
      successful: result.summary.successful,
      failed: result.summary.failed,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Multi-price query failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * GET /price/trending
 * Get trending tokens by price change
 */
router.get('/price/trending', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const network = req.query.network as string;
    const limit = parseInt((req.query.limit as string) || '20');
    const timeframe = (req.query.timeframe as string) || '24h';

    // Validate parameters
    if (network && !['ethereum', 'bsc', 'polygon', 'solana', 'bitcoin'].includes(network)) {
      return res.status(400).json(createResponse(false, null, 'Invalid network'));
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json(createResponse(false, null, 'Limit must be between 1 and 100'));
    }

    logger.info('Trending tokens request', { 
      requestId, 
      network,
      limit,
      timeframe,
      ip: req.ip 
    });

    // Get trending data
    const trendingData = await priceFeedService.getTrendingTokens(
      network as BlockchainNetwork, 
      limit, 
      timeframe
    );

    const result = {
      network: network || 'all',
      timeframe,
      limit,
      trendingData,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Trending tokens query completed', { 
      requestId, 
      tokensCount: trendingData.length,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Trending tokens query failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

/**
 * GET /price/volume/:token
 * Get volume analysis for a token
 */
router.get('/price/volume/:token', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    const { token } = req.params;
    const network = req.query.network as string;
    const period = (req.query.period as string) || '24h';

    // Validate request
    const { error, value } = Joi.object({
      token: Joi.string().required().min(20).max(100),
      network: Joi.string().valid('ethereum', 'bsc', 'polygon', 'solana', 'bitcoin').required(),
      period: Joi.string().valid('1h', '24h', '7d', '30d').default('24h'),
    }).validate({ token, network, period });
    
    if (error) {
      return res.status(400).json(createResponse(false, null, error.details[0].message));
    }

    logger.info('Volume analysis request', { 
      requestId, 
      token, 
      network,
      period,
      ip: req.ip 
    });

    // Validate address format
    const isValidAddress = await web3Service.isValidAddress(token, network as BlockchainNetwork);
    if (!isValidAddress) {
      return res.status(400).json(createResponse(false, null, 'Invalid token address format'));
    }

    // Get volume analysis
    const volumeAnalysis = await priceFeedService.getVolumeAnalysis(
      token, 
      network as BlockchainNetwork, 
      period
    );

    const result = {
      token,
      network,
      period,
      volumeAnalysis,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };

    logger.info('Volume analysis completed', { 
      requestId, 
      token, 
      volume: volumeAnalysis.volume,
      processingTime: Date.now() - startTime 
    });

    res.json(createResponse(true, result));
  } catch (error) {
    logger.error('Volume analysis failed', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createResponse(false, null, 'Internal server error'));
  }
});

export { router as priceRouter };