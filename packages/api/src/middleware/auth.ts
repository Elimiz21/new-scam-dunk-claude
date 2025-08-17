import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { User } from '@prisma/client';
import { logger } from '../index';

interface AuthRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header required',
        code: 'AUTH_HEADER_MISSING'
      });
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : authHeader;
    
    if (!token) {
      return res.status(401).json({
        error: 'Token required',
        code: 'TOKEN_MISSING'
      });
    }
    
    // Verify the token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'SERVER_CONFIG_ERROR'
      });
    }
    
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'TOKEN_INVALID'
        });
      } else {
        throw jwtError;
      }
    }
    
    // Find the user
    const user = await UserService.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Update last login if it's been more than 1 hour
    const now = new Date();
    if (!user.lastLoginAt || (now.getTime() - user.lastLoginAt.getTime()) > 3600000) {
      await UserService.updateLastLogin(user.id);
    }
    
    // Attach user to request (without password)
    req.user = UserService.sanitizeUser(user);
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal server error during authentication',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
};

export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continue without authentication
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : authHeader;
    
    if (!token) {
      return next(); // Continue without authentication
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(); // Continue without authentication
    }
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      const user = await UserService.findById(decoded.userId);
      
      if (user) {
        req.user = UserService.sanitizeUser(user);
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
      logger.debug('Optional auth failed:', jwtError);
    }
    
    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next(); // Continue without authentication on error
  }
};

export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};

export const requireVerifiedEmail = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.isVerified) {
    return res.status(403).json({
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }
  
  next();
};

export const checkApiLimits = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  const user = req.user;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Check if we need to reset daily counter
  if (!user.apiUsage.lastScanDate || user.apiUsage.lastScanDate < today) {
    user.apiUsage.scansToday = 0;
  }
  
  // Check if we need to reset monthly counter
  if (!user.apiUsage.lastScanDate || user.apiUsage.lastScanDate < thisMonth) {
    user.apiUsage.scansThisMonth = 0;
  }
  
  // Define limits based on subscription plan
  const limits = {
    free: { daily: 5, monthly: 20 },
    premium: { daily: 50, monthly: 500 },
    pro: { daily: 200, monthly: 2000 }
  };
  
  const userLimits = limits[user.subscription.plan];
  
  // Check daily limit
  if (user.apiUsage.scansToday >= userLimits.daily) {
    return res.status(429).json({
      error: 'Daily scan limit exceeded',
      code: 'DAILY_LIMIT_EXCEEDED',
      limits: userLimits,
      current: {
        daily: user.apiUsage.scansToday,
        monthly: user.apiUsage.scansThisMonth
      }
    });
  }
  
  // Check monthly limit
  if (user.apiUsage.scansThisMonth >= userLimits.monthly) {
    return res.status(429).json({
      error: 'Monthly scan limit exceeded',
      code: 'MONTHLY_LIMIT_EXCEEDED',
      limits: userLimits,
      current: {
        daily: user.apiUsage.scansToday,
        monthly: user.apiUsage.scansThisMonth
      }
    });
  }
  
  next();
};

export const generateToken = (user: User): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role.toString()
  };
  
  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

export const generateRefreshToken = (user: User): string => {
  const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }
  
  const payload = {
    userId: user.id,
    type: 'refresh'
  };
  
  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }
  
  const decoded = jwt.verify(token, jwtSecret) as any;
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return { userId: decoded.userId };
};

// Export type for use in other files
export type { AuthRequest };