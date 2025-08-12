import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

// Extend Request interface to include authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        apiKey: string;
        permissions?: string[];
      };
    }
  }
}

/**
 * API Key authentication middleware
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string || req.query.apikey as string;

  if (!apiKey) {
    logger.warn('API request without API key', { 
      ip: req.ip, 
      path: req.path,
      userAgent: req.get('User-Agent') 
    });
    
    return res.status(401).json({
      success: false,
      error: 'API key required',
      timestamp: new Date(),
    });
  }

  // Check if API key is valid
  if (!config.security.apiKeys.includes(apiKey)) {
    logger.warn('Invalid API key used', { 
      apiKey: apiKey.substring(0, 8) + '...', 
      ip: req.ip, 
      path: req.path 
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      timestamp: new Date(),
    });
  }

  // Add user info to request
  req.user = {
    id: `api_user_${apiKey.substring(0, 8)}`,
    apiKey,
    permissions: ['read', 'analyze'], // Default permissions
  };

  logger.info('Authenticated API request', { 
    userId: req.user.id, 
    path: req.path,
    method: req.method 
  });

  next();
};

/**
 * Optional API key authentication (doesn't fail if no key provided)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string || req.query.apikey as string;

  if (apiKey && config.security.apiKeys.includes(apiKey)) {
    req.user = {
      id: `api_user_${apiKey.substring(0, 8)}`,
      apiKey,
      permissions: ['read', 'analyze'],
    };
  }

  next();
};

/**
 * Check if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date(),
      });
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      logger.warn('Insufficient permissions', { 
        userId: req.user.id, 
        requiredPermission: permission,
        userPermissions: req.user.permissions 
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date(),
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.permissions?.includes('admin')) {
    logger.warn('Admin access attempted by non-admin', { 
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      path: req.path 
    });
    
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      timestamp: new Date(),
    });
  }

  next();
};