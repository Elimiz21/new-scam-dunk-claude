import { Request, Response, NextFunction } from 'express';
import { logger } from '../index';

interface LoggedRequest extends Request {
  startTime?: number;
  requestId?: string;
}

export const loggerMiddleware = (req: LoggedRequest, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.requestId = generateRequestId();
  req.startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
      'content-length': req.get('Content-Length'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer')
    },
    ip: getClientIp(req),
    timestamp: new Date().toISOString()
  });
  
  // Capture response details
  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    // Log response
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || body?.length || 0,
      timestamp: new Date().toISOString(),
      responseSize: getResponseSize(body)
    });
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
    
    // Log error responses
    if (res.statusCode >= 400) {
      const logLevel = res.statusCode >= 500 ? 'error' : 'warn';
      logger[logLevel]('Request failed', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        error: res.statusCode >= 500 ? 'Server error' : 'Client error'
      });
    }
    
    return originalSend.call(this, body);
  };
  
  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

export const apiMetricsMiddleware = (req: LoggedRequest, res: Response, next: NextFunction) => {
  // Track API metrics (in production, you might want to use a dedicated metrics service)
  req.startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    // Log metrics for monitoring
    logger.info('API Metrics', {
      endpoint: `${req.method} ${req.route?.path || req.path}`,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
      success: res.statusCode < 400,
      userAgent: req.get('User-Agent'),
      ip: getClientIp(req)
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};

export const securityLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log security-relevant events
  const securityHeaders = {
    'x-forwarded-for': req.get('X-Forwarded-For'),
    'x-real-ip': req.get('X-Real-IP'),
    'authorization': req.get('Authorization') ? 'Bearer [REDACTED]' : undefined,
    'origin': req.get('Origin'),
    'referer': req.get('Referer')
  };
  
  // Log authentication attempts
  if (req.path.includes('/auth/')) {
    logger.info('Authentication attempt', {
      path: req.path,
      method: req.method,
      ip: getClientIp(req),
      userAgent: req.get('User-Agent'),
      headers: securityHeaders,
      timestamp: new Date().toISOString()
    });
  }
  
  // Log admin actions
  if (req.path.includes('/admin/')) {
    logger.warn('Admin endpoint accessed', {
      path: req.path,
      method: req.method,
      ip: getClientIp(req),
      userAgent: req.get('User-Agent'),
      headers: securityHeaders,
      timestamp: new Date().toISOString()
    });
  }
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript protocol
    /data:/i,  // Data protocol
    /eval\(/i,  // Eval function
    /exec\(/i,  // Exec function
  ];
  
  const fullUrl = req.originalUrl || req.url;
  const bodyString = JSON.stringify(req.body || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(bodyString)) {
      logger.warn('Suspicious request pattern detected', {
        pattern: pattern.toString(),
        url: fullUrl,
        method: req.method,
        body: req.body,
        ip: getClientIp(req),
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      break;
    }
  }
  
  next();
};

function generateRequestId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getClientIp(req: Request): string {
  return (
    req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    req.get('X-Real-IP') ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    'unknown'
  );
}

function getResponseSize(body: any): number {
  if (!body) return 0;
  if (typeof body === 'string') return Buffer.byteLength(body, 'utf8');
  if (Buffer.isBuffer(body)) return body.length;
  return Buffer.byteLength(JSON.stringify(body), 'utf8');
}

// Express.js logger format for Morgan (alternative)
export const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Custom token for Morgan to include request ID
export const morganTokens = {
  'request-id': (req: LoggedRequest) => req.requestId || 'unknown'
};