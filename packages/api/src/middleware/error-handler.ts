import { Request, Response, NextFunction } from 'express';
import { logger } from '../index';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error caught by error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details || null;
  
  // Handle specific error types
  
  // MongoDB/Mongoose errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values((error as any).errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
    details = {
      field: (error as any).path,
      value: (error as any).value
    };
  } else if ((error as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Resource already exists';
    const field = Object.keys((error as any).keyValue)[0];
    details = {
      field,
      value: (error as any).keyValue[field]
    };
  }
  
  // JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }
  
  // Express validator errors
  else if (error.name === 'ValidationError' && (error as any).array) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = (error as any).array();
  }
  
  // Rate limiting errors
  else if (error.message && error.message.includes('Too many requests')) {
    statusCode = 429;
    code = 'RATE_LIMITED';
    message = 'Too many requests, please try again later';
  }
  
  // File upload errors
  else if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    
    switch ((error as any).code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = 'File upload error';
    }
  }
  
  // Network/API errors
  else if (error.name === 'AxiosError' || error.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    code = 'SERVICE_UNAVAILABLE';
    message = 'External service temporarily unavailable';
  }
  
  // Custom application errors
  else if (error.message.includes('User not found')) {
    statusCode = 404;
    code = 'USER_NOT_FOUND';
    message = 'User not found';
  } else if (error.message.includes('Invalid credentials')) {
    statusCode = 401;
    code = 'INVALID_CREDENTIALS';
    message = 'Invalid email or password';
  } else if (error.message.includes('Account not verified')) {
    statusCode = 403;
    code = 'ACCOUNT_NOT_VERIFIED';
    message = 'Please verify your email address';
  } else if (error.message.includes('Insufficient permissions')) {
    statusCode = 403;
    code = 'INSUFFICIENT_PERMISSIONS';
    message = 'You do not have permission to perform this action';
  }
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
    details = null;
  }
  
  // Log errors that should be monitored
  if (statusCode >= 500) {
    logger.error('Server error occurred:', {
      error: error.message,
      stack: error.stack,
      statusCode,
      code,
      details,
      request: {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query
      }
    });
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      statusCode,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      })
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as CustomError;
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error classes
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';
  
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';
  
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMITED';
  
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends Error {
  statusCode = 503;
  code = 'SERVICE_UNAVAILABLE';
  
  constructor(message: string = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}