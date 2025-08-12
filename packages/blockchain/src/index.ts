import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { verificationRouter } from './routes/verification.routes';
import { analysisRouter } from './routes/analysis.routes';
import { priceRouter } from './routes/price.routes';
import { RedisService } from './services/redis.service';
import { Web3ProviderService } from './services/web3-provider.service';
import { ContractAnalysisService } from './services/contract-analysis.service';
import { TokenVerificationService } from './services/token-verification.service';
import { WalletReputationService } from './services/wallet-reputation.service';
import { PriceFeedService } from './services/price-feed.service';
import { RiskScoringService } from './services/risk-scoring.service';
import { logger, requestLogger } from './utils/logger';
import { config } from './config';
import { authenticateApiKey, optionalAuth } from './middleware/auth';
import { generalRateLimit, createEndpointRateLimit } from './middleware/rate-limit';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = config.server.port;

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for API responses
}));
app.use(compression());
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));
app.use(requestLogger);

// General rate limiting
app.use(generalRateLimit);

// Health check route (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    version: '1.0.0',
    services: {
      redis: RedisService.getInstance().isConnected(),
      web3: true, // Would check actual connection status
    },
  });
});

// API Routes with authentication and rate limiting
app.use('/api/v1/verify', optionalAuth, createEndpointRateLimit('analysis'), verificationRouter);
app.use('/api/v1/analyze', optionalAuth, createEndpointRateLimit('analysis'), analysisRouter);
app.use('/api/v1/price', optionalAuth, createEndpointRateLimit('data'), priceRouter);

// Protected admin routes (require API key)
app.use('/api/v1/admin', authenticateApiKey, (req, res) => {
  res.json({
    message: 'Admin endpoints - under construction',
    user: req.user,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Scam Dunk Blockchain Verification Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date(),
    endpoints: {
      health: '/health',
      verification: '/api/v1/verify',
      analysis: '/api/v1/analyze',
      pricing: '/api/v1/price',
    },
    documentation: 'https://docs.scamdunk.dev/blockchain-api',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date(),
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date(),
  });
});

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing blockchain verification services...');
    
    // Initialize Redis connection
    await RedisService.getInstance().connect();
    logger.info('✅ Redis service connected');
    
    // Initialize Web3 providers
    const web3Service = Web3ProviderService.getInstance();
    logger.info('✅ Web3 providers initialized');
    
    // Initialize analysis services
    const contractService = ContractAnalysisService.getInstance();
    const tokenService = TokenVerificationService.getInstance();
    const walletService = WalletReputationService.getInstance();
    const priceFeedService = PriceFeedService.getInstance();
    const riskScoringService = RiskScoringService.getInstance();
    
    logger.info('✅ All analysis services initialized');
    
    // Test connections
    const supportedNetworks = web3Service.getSupportedNetworks();
    logger.info(`✅ Supporting ${supportedNetworks.length} blockchain networks:`, supportedNetworks);
    
    logger.info('🚀 All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await RedisService.getInstance().disconnect();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  await initializeServices();
  
  server.listen(PORT, () => {
    logger.info(`🚀 Scam Dunk Blockchain Verification Service running on port ${PORT}`);
    logger.info(`📡 API available at: http://localhost:${PORT}`);
    logger.info(`📚 Documentation: https://docs.scamdunk.dev/blockchain-api`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
});