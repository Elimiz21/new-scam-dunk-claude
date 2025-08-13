import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { createHash } from 'crypto';

// Rate limiting configurations for different endpoints
export const generalRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth attempts
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

export const scanRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 scans per minute
  message: 'Scan rate limit exceeded, please wait before scanning again.',
});

export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Higher limit for API key users
  keyGenerator: (req) => {
    // Use API key for rate limiting if present
    return req.headers['x-api-key'] as string || req.ip;
  }
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://scamdunk.com',
      'https://www.scamdunk.com',
      'https://api.scamdunk.com'
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, postman, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // Allow all origins in development
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};

// API Key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide an API key in the X-API-Key header'
    });
  }

  // Hash the API key for comparison (never store plain text keys)
  const hashedKey = createHash('sha256').update(apiKey).digest('hex');
  
  // In production, validate against database of API keys
  // For now, using environment variable
  const validKeyHash = createHash('sha256')
    .update(process.env.MASTER_API_KEY || 'development-key')
    .digest('hex');

  if (hashedKey !== validKeyHash) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid'
    });
  }

  next();
};

// Request ID middleware for tracking
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 
    `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Remove potential SQL injection attempts
        req.query[key] = (req.query[key] as string)
          .replace(/[<>'"]/g, '')
          .trim();
      }
    });
  }

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          // Basic XSS prevention
          obj[key] = obj[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    sanitizeObject(req.body);
  }

  next();
};

// IP blocking middleware
const blockedIPs = new Set<string>();

export const ipBlockingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || '';
  
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your IP has been blocked due to suspicious activity'
    });
  }
  
  next();
};

// Add IP to blocklist
export const blockIP = (ip: string) => {
  blockedIPs.add(ip);
  console.log(`Blocked IP: ${ip}`);
};

// Remove IP from blocklist
export const unblockIP = (ip: string) => {
  blockedIPs.delete(ip);
  console.log(`Unblocked IP: ${ip}`);
};

// Security audit logging
export const securityAuditLog = (req: Request, res: Response, next: NextFunction) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.headers['x-request-id'],
    apiKey: req.headers['x-api-key'] ? 'present' : 'absent',
  };

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to Datadog, CloudWatch, etc.
    console.log('SECURITY_AUDIT:', JSON.stringify(logEntry));
  }

  next();
};

// Combined security middleware
export const applySecurityMiddleware = (app: any) => {
  app.use(requestIdMiddleware);
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  app.use(sanitizeInput);
  app.use(ipBlockingMiddleware);
  app.use(securityAuditLog);
  
  // Apply rate limiting to specific routes
  app.use('/api/auth', authRateLimiter);
  app.use('/api/scan', scanRateLimiter);
  app.use('/api/public', generalRateLimiter);
  
  // Protected routes require API key
  app.use('/api/admin', validateApiKey);
  app.use('/api/internal', validateApiKey);
};