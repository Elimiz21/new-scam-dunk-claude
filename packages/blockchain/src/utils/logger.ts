import winston from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'blockchain-service',
    version: '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let logMessage = `${timestamp} [${level}]: ${message}`;
          
          if (Object.keys(meta).length > 0) {
            logMessage += ` ${JSON.stringify(meta, null, 2)}`;
          }
          
          return logMessage;
        })
      ),
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'blockchain-service.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true,
    }),
    
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logDir, 'blockchain-service-error.log'),
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'blockchain-service-exceptions.log'),
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'blockchain-service-rejections.log'),
  })
);

// Create a request logger for HTTP requests
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.headers['x-request-id'] || 'unknown',
    });
  });
  
  next();
};

// Create a structured logging helper
export const createLoggerWithContext = (context: Record<string, any>) => {
  return {
    debug: (message: string, meta?: Record<string, any>) => 
      logger.debug(message, { ...context, ...meta }),
    info: (message: string, meta?: Record<string, any>) => 
      logger.info(message, { ...context, ...meta }),
    warn: (message: string, meta?: Record<string, any>) => 
      logger.warn(message, { ...context, ...meta }),
    error: (message: string, meta?: Record<string, any>) => 
      logger.error(message, { ...context, ...meta }),
  };
};

// Create performance logger
export const performanceLogger = {
  time: (label: string) => {
    console.time(label);
    const startTime = Date.now();
    
    return {
      end: () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.timeEnd(label);
        logger.info('Performance', {
          label,
          duration: `${duration}ms`,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        });
        return duration;
      },
    };
  },
};

export default logger;