import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';

// Create Redis-based rate limiter
class RedisRateLimiter {
  private redis = RedisService.getInstance();

  async isAllowed(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const redisKey = `rate_limit:${key}:${window}`;

    try {
      const current = await this.redis.increment(redisKey, Math.ceil(windowMs / 1000));
      
      const remaining = Math.max(0, limit - current);
      const resetTime = (window + 1) * windowMs;
      
      return {
        allowed: current <= limit,
        remaining,
        resetTime,
      };
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }
  }
}

const redisLimiter = new RedisRateLimiter();

// Custom rate limit handler with Redis
export const createRedisRateLimit = (options: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return async (req: Request, res: Response, next: Function) => {
    const keyGenerator = options.keyGenerator || ((req: Request) => req.ip);
    const key = keyGenerator(req);
    
    try {
      const result = await redisLimiter.isAllowed(
        key,
        options.max,
        options.windowMs
      );

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': options.max.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      });

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          key,
          ip: req.ip,
          path: req.path,
          userAgent: req.get('User-Agent'),
        });

        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          timestamp: new Date(),
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      next(); // Continue on error
    }
  };
};

// General rate limiter (fallback to memory-based)
export const generalRateLimit = rateLimit({
  windowMs: config.server.rateLimit.windowMs,
  max: config.server.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    timestamp: new Date(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use API key if available, otherwise IP
    return req.user?.apiKey || req.ip;
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  onLimitReached: (req: Request) => {
    logger.warn('General rate limit reached', {
      ip: req.ip,
      apiKey: req.user?.apiKey?.substring(0, 8),
      path: req.path,
      userAgent: req.get('User-Agent'),
    });
  },
});

// Strict rate limiter for analysis endpoints
export const analysisRateLimit = createRedisRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyGenerator: (req: Request) => {
    return req.user?.apiKey || req.ip;
  },
});

// Lenient rate limiter for price/data endpoints
export const dataRateLimit = createRedisRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  keyGenerator: (req: Request) => {
    return req.user?.apiKey || req.ip;
  },
});

// Very strict rate limiter for bulk operations
export const bulkRateLimit = createRedisRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per 5 minutes
  keyGenerator: (req: Request) => {
    return req.user?.apiKey || req.ip;
  },
});

// Rate limiter for public endpoints (no auth required)
export const publicRateLimit = createRedisRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  keyGenerator: (req: Request) => req.ip,
});

// Dynamic rate limiter based on user tier
export const dynamicRateLimit = (req: Request, res: Response, next: Function) => {
  // Determine rate limits based on API key tier
  let windowMs = 60 * 1000; // 1 minute default
  let max = 20; // 20 requests per minute default

  if (req.user?.apiKey) {
    // Check if it's a premium API key (this would come from database)
    const isPremium = req.user.permissions?.includes('premium');
    
    if (isPremium) {
      max = 100; // Higher limit for premium users
    } else {
      max = 30; // Standard limit for registered users
    }
  } else {
    max = 10; // Lower limit for anonymous users
  }

  // Apply the dynamic rate limit
  createRedisRateLimit({ windowMs, max })(req, res, next);
};

// Create rate limit middleware based on endpoint type
export const createEndpointRateLimit = (endpointType: 'analysis' | 'data' | 'bulk' | 'public') => {
  switch (endpointType) {
    case 'analysis':
      return analysisRateLimit;
    case 'data':
      return dataRateLimit;
    case 'bulk':
      return bulkRateLimit;
    case 'public':
      return publicRateLimit;
    default:
      return generalRateLimit;
  }
};