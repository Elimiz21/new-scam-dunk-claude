import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { StatsD } from 'node-statsd';
import winston from 'winston';
import 'winston-daily-rotate-file';

// Initialize Sentry for error tracking
export const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        new ProfilingIntegration(),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: 1.0,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
          delete event.request.headers?.['x-api-key'];
        }
        return event;
      },
    });
    
    console.log('✅ Sentry initialized');
  }
};

// Initialize StatsD for metrics
export const metrics = new StatsD({
  host: process.env.STATSD_HOST || 'localhost',
  port: Number(process.env.STATSD_PORT) || 8125,
  prefix: 'scamdunk.api.',
  cacheDns: true,
});

// Custom metrics helpers
export const recordMetric = {
  // Increment counter
  increment: (metric: string, tags?: string[]) => {
    metrics.increment(metric, 1, tags);
  },
  
  // Record timing
  timing: (metric: string, time: number, tags?: string[]) => {
    metrics.timing(metric, time, tags);
  },
  
  // Record gauge
  gauge: (metric: string, value: number, tags?: string[]) => {
    metrics.gauge(metric, value, tags);
  },
  
  // Record histogram
  histogram: (metric: string, value: number, tags?: string[]) => {
    metrics.histogram(metric, value, tags);
  },
};

// Track API endpoint performance
export const trackEndpoint = (method: string, path: string, statusCode: number, duration: number) => {
  const tags = [
    `method:${method}`,
    `path:${path.replace(/\/\d+/g, '/:id')}`, // Replace IDs with :id
    `status:${statusCode}`,
    `status_category:${Math.floor(statusCode / 100)}xx`
  ];
  
  recordMetric.timing('request.duration', duration, tags);
  recordMetric.increment('request.count', tags);
  
  if (statusCode >= 400) {
    recordMetric.increment('request.error', tags);
  }
};

// Track scan operations
export const trackScan = (scanType: string, success: boolean, duration: number) => {
  const tags = [
    `type:${scanType}`,
    `success:${success}`
  ];
  
  recordMetric.timing('scan.duration', duration, tags);
  recordMetric.increment('scan.count', tags);
  
  if (!success) {
    recordMetric.increment('scan.failure', tags);
  }
};

// Track external API calls
export const trackExternalAPI = (service: string, endpoint: string, success: boolean, duration: number) => {
  const tags = [
    `service:${service}`,
    `endpoint:${endpoint}`,
    `success:${success}`
  ];
  
  recordMetric.timing('external_api.duration', duration, tags);
  recordMetric.increment('external_api.count', tags);
  
  if (!success) {
    recordMetric.increment('external_api.failure', tags);
  }
};

// Configure Winston logger
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports based on environment
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' 
      ? logFormat 
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  })
);

// File transport for production
if (process.env.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  );
  
  // Combined logs
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Log unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  Sentry.captureException(reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  Sentry.captureException(error);
  process.exit(1);
});

// Performance monitoring middleware
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    trackEndpoint(req.method, req.path, res.statusCode, duration);
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
};

// Health check metrics
export const recordHealthMetrics = () => {
  // Memory usage
  const memUsage = process.memoryUsage();
  recordMetric.gauge('memory.rss', memUsage.rss);
  recordMetric.gauge('memory.heap_used', memUsage.heapUsed);
  recordMetric.gauge('memory.heap_total', memUsage.heapTotal);
  
  // CPU usage
  const cpuUsage = process.cpuUsage();
  recordMetric.gauge('cpu.user', cpuUsage.user);
  recordMetric.gauge('cpu.system', cpuUsage.system);
  
  // Event loop lag (if available)
  if (global.gc) {
    global.gc();
  }
};

// Start health metrics collection
setInterval(recordHealthMetrics, 60000); // Every minute

// Custom error class with Sentry integration
export class MonitoredError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'MonitoredError';
    
    // Automatically report to Sentry
    Sentry.captureException(this);
    
    // Log the error
    logger.error(message, {
      error: this.message,
      stack: this.stack,
      statusCode
    });
  }
}

// Audit logging for security events
export const auditLog = {
  login: (userId: string, success: boolean, ip: string) => {
    const event = {
      type: 'LOGIN',
      userId,
      success,
      ip,
      timestamp: new Date().toISOString()
    };
    
    logger.info('Security Audit', event);
    recordMetric.increment('security.login', [`success:${success}`]);
  },
  
  apiAccess: (apiKey: string, endpoint: string, ip: string) => {
    const event = {
      type: 'API_ACCESS',
      apiKey: apiKey.substring(0, 8) + '...',
      endpoint,
      ip,
      timestamp: new Date().toISOString()
    };
    
    logger.info('API Access Audit', event);
    recordMetric.increment('security.api_access');
  },
  
  suspiciousActivity: (type: string, details: any, ip: string) => {
    const event = {
      type: 'SUSPICIOUS_ACTIVITY',
      activityType: type,
      details,
      ip,
      timestamp: new Date().toISOString()
    };
    
    logger.warn('Suspicious Activity Detected', event);
    Sentry.captureMessage(`Suspicious activity: ${type}`, 'warning');
    recordMetric.increment('security.suspicious', [`type:${type}`]);
  }
};

// Initialize monitoring
export const initMonitoring = () => {
  initSentry();
  logger.info('Monitoring initialized', {
    sentryEnabled: !!process.env.SENTRY_DSN,
    statsdHost: process.env.STATSD_HOST || 'localhost',
    logLevel: process.env.LOG_LEVEL || 'info'
  });
};

export default {
  logger,
  metrics: recordMetric,
  trackEndpoint,
  trackScan,
  trackExternalAPI,
  auditLog,
  initMonitoring,
  performanceMiddleware,
  Sentry,
  MonitoredError
};