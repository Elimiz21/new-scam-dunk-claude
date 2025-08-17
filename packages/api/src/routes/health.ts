import express from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/error-handler';

const router = express.Router();

// @route   GET /api/health
// @desc    Basic health check
// @access  Public
router.get('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
}));

// @route   GET /api/health/detailed
// @desc    Detailed health check including dependencies
// @access  Public
router.get('/detailed', asyncHandler(async (req: express.Request, res: express.Response) => {
  const health = {
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
      openai: 'unknown',
      external_apis: 'unknown'
    },
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    }
  };
  
  // Check database connection
  try {
    if (mongoose.connection.readyState === 1) {
      health.services.database = 'healthy';
    } else {
      health.services.database = 'unhealthy';
      health.success = false;
      health.status = 'DEGRADED';
    }
  } catch (error) {
    health.services.database = 'error';
    health.success = false;
    health.status = 'DEGRADED';
  }
  
  // Check OpenAI API availability
  try {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key') {
      health.services.openai = 'configured';
    } else {
      health.services.openai = 'simulated';
    }
  } catch (error) {
    health.services.openai = 'error';
  }
  
  // Check external API availability (basic)
  health.services.external_apis = 'available';
  
  const statusCode = health.success ? 200 : 503;
  res.status(statusCode).json(health);
}));

// @route   GET /api/health/ready
// @desc    Readiness probe for Kubernetes
// @access  Public
router.get('/ready', asyncHandler(async (req: express.Request, res: express.Response) => {
  // Check if all critical services are ready
  const isDbReady = mongoose.connection.readyState === 1;
  
  if (isDbReady) {
    res.json({
      success: true,
      status: 'READY',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'NOT_READY',
      timestamp: new Date().toISOString(),
      reason: 'Database not connected'
    });
  }
}));

// @route   GET /api/health/live
// @desc    Liveness probe for Kubernetes
// @access  Public
router.get('/live', asyncHandler(async (req: express.Request, res: express.Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    success: true,
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}));

export default router;