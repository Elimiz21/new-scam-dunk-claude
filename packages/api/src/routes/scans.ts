import express from 'express';
import { body, validationResult } from 'express-validator';
import Scan from '../models/Scan';
import User from '../models/User';
import { authMiddleware, checkApiLimits, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error-handler';
import { logger } from '../index';
import { io } from '../index';

// Import services
import ContactVerificationService from '../services/ContactVerificationService';
import ChatAnalysisService from '../services/ChatAnalysisService';
import TradingAnalysisService from '../services/TradingAnalysisService';
import VeracityCheckingService from '../services/VeracityCheckingService';

const router = express.Router();

// Helper function to check validation results
const checkValidation = (req: express.Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
};

// Helper function to update user API usage
const updateUserUsage = async (userId: string) => {
  const user = await User.findById(userId);
  if (user) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Reset daily counter if needed
    if (!user.apiUsage.lastScanDate || user.apiUsage.lastScanDate < today) {
      user.apiUsage.scansToday = 0;
    }
    
    // Reset monthly counter if needed
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (!user.apiUsage.lastScanDate || user.apiUsage.lastScanDate < thisMonth) {
      user.apiUsage.scansThisMonth = 0;
    }
    
    user.apiUsage.scansToday += 1;
    user.apiUsage.scansThisMonth += 1;
    user.apiUsage.lastScanDate = now;
    
    await user.save();
  }
};

// @route   POST /api/scans/contact
// @desc    Create a contact verification scan
// @access  Private
router.post('/contact', [
  authMiddleware,
  checkApiLimits,
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[\d\s\-\(\)]{7,15}$/)
    .withMessage('Invalid phone number format'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { phoneNumber, priority = 'medium' } = req.body;
  const userId = req.user!._id;
  
  // Create scan record
  const scan = new Scan({
    userId,
    type: 'contact',
    status: 'pending',
    priority,
    input: { phoneNumber },
    metadata: {
      startTime: new Date(),
      processingSteps: [{
        step: 'contact_verification',
        status: 'pending',
        startTime: new Date()
      }]
    }
  });
  
  await scan.save();
  
  // Update user API usage
  await updateUserUsage(userId);
  
  // Emit WebSocket event
  io.to(`scan-${scan._id}`).emit('scan-status', {
    scanId: scan._id,
    status: 'processing',
    step: 'Starting contact verification'
  });
  
  // Process scan asynchronously
  processContactScan(scan._id.toString()).catch(error => {
    logger.error('Contact scan processing failed:', error);
  });
  
  res.status(202).json({
    success: true,
    message: 'Contact verification scan started',
    data: { scan }
  });
}));

// @route   POST /api/scans/chat
// @desc    Create a chat analysis scan
// @access  Private
router.post('/chat', [
  authMiddleware,
  checkApiLimits,
  body('chatContent')
    .notEmpty()
    .withMessage('Chat content is required')
    .isLength({ max: 100000 })
    .withMessage('Chat content too long (max 100,000 characters)'),
  body('platform')
    .isIn(['whatsapp', 'telegram', 'discord', 'sms', 'email', 'other'])
    .withMessage('Invalid platform'),
  body('analysisDepth')
    .optional()
    .isIn(['basic', 'standard', 'comprehensive'])
    .withMessage('Invalid analysis depth'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { chatContent, platform, analysisDepth = 'standard', priority = 'medium' } = req.body;
  const userId = req.user!._id;
  
  // Parse chat content (simplified - in production, you'd have proper parsers)
  const messages = parseChatContent(chatContent, platform);
  
  // Create scan record
  const scan = new Scan({
    userId,
    type: 'chat',
    status: 'pending',
    priority,
    input: { chatContent, platform },
    metadata: {
      startTime: new Date(),
      processingSteps: [{
        step: 'chat_analysis',
        status: 'pending',
        startTime: new Date()
      }]
    }
  });
  
  await scan.save();
  
  // Update user API usage
  await updateUserUsage(userId);
  
  // Emit WebSocket event
  io.to(`scan-${scan._id}`).emit('scan-status', {
    scanId: scan._id,
    status: 'processing',
    step: 'Starting chat analysis'
  });
  
  // Process scan asynchronously
  processChatScan(scan._id.toString(), messages, platform, analysisDepth).catch(error => {
    logger.error('Chat scan processing failed:', error);
  });
  
  res.status(202).json({
    success: true,
    message: 'Chat analysis scan started',
    data: { scan }
  });
}));

// @route   POST /api/scans/trading
// @desc    Create a trading analysis scan
// @access  Private
router.post('/trading', [
  authMiddleware,
  checkApiLimits,
  body('symbol').optional().isString().withMessage('Symbol must be a string'),
  body('platform').optional().isString().withMessage('Platform must be a string'),
  body('amount').optional().isNumeric().withMessage('Amount must be numeric'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { symbol, platform, amount, currency, priority = 'medium' } = req.body;
  const userId = req.user!._id;
  
  if (!symbol && !platform) {
    throw new ValidationError('Either symbol or platform must be provided');
  }
  
  // Create scan record
  const scan = new Scan({
    userId,
    type: 'trading',
    status: 'pending',
    priority,
    input: {
      tradingInfo: { symbol, platform, amount, currency }
    },
    metadata: {
      startTime: new Date(),
      processingSteps: [{
        step: 'trading_analysis',
        status: 'pending',
        startTime: new Date()
      }]
    }
  });
  
  await scan.save();
  
  // Update user API usage
  await updateUserUsage(userId);
  
  // Emit WebSocket event
  io.to(`scan-${scan._id}`).emit('scan-status', {
    scanId: scan._id,
    status: 'processing',
    step: 'Starting trading analysis'
  });
  
  // Process scan asynchronously
  processTradingScan(scan._id.toString(), { symbol, platform, amount, currency }).catch(error => {
    logger.error('Trading scan processing failed:', error);
  });
  
  res.status(202).json({
    success: true,
    message: 'Trading analysis scan started',
    data: { scan }
  });
}));

// @route   POST /api/scans/veracity
// @desc    Create a veracity checking scan
// @access  Private
router.post('/veracity', [
  authMiddleware,
  checkApiLimits,
  body('companyName').optional().isString().withMessage('Company name must be a string'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('registrationNumber').optional().isString().withMessage('Registration number must be a string'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { companyName, website, registrationNumber, priority = 'medium' } = req.body;
  const userId = req.user!._id;
  
  if (!companyName && !website && !registrationNumber) {
    throw new ValidationError('At least one of company name, website, or registration number must be provided');
  }
  
  // Create scan record
  const scan = new Scan({
    userId,
    type: 'veracity',
    status: 'pending',
    priority,
    input: {
      companyInfo: { name: companyName, website, registrationNumber }
    },
    metadata: {
      startTime: new Date(),
      processingSteps: [{
        step: 'veracity_checking',
        status: 'pending',
        startTime: new Date()
      }]
    }
  });
  
  await scan.save();
  
  // Update user API usage
  await updateUserUsage(userId);
  
  // Emit WebSocket event
  io.to(`scan-${scan._id}`).emit('scan-status', {
    scanId: scan._id,
    status: 'processing',
    step: 'Starting veracity check'
  });
  
  // Process scan asynchronously
  processVeracityScan(scan._id.toString(), { name: companyName, website, registrationNumber }).catch(error => {
    logger.error('Veracity scan processing failed:', error);
  });
  
  res.status(202).json({
    success: true,
    message: 'Veracity checking scan started',
    data: { scan }
  });
}));

// @route   POST /api/scans/comprehensive
// @desc    Create a comprehensive scan combining multiple analysis types
// @access  Private
router.post('/comprehensive', [
  authMiddleware,
  checkApiLimits,
  body('phoneNumber').optional().isString(),
  body('chatContent').optional().isString(),
  body('platform').optional().isString(),
  body('symbol').optional().isString(),
  body('tradingPlatform').optional().isString(),
  body('companyName').optional().isString(),
  body('website').optional().isURL(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const {
    phoneNumber,
    chatContent,
    platform,
    symbol,
    tradingPlatform,
    companyName,
    website,
    priority = 'high'
  } = req.body;
  const userId = req.user!._id;
  
  // Validate that at least one input is provided
  if (!phoneNumber && !chatContent && !symbol && !tradingPlatform && !companyName && !website) {
    throw new ValidationError('At least one input parameter must be provided');
  }
  
  // Create scan record
  const scan = new Scan({
    userId,
    type: 'comprehensive',
    status: 'pending',
    priority,
    input: {
      phoneNumber,
      chatContent,
      tradingInfo: { symbol, platform: tradingPlatform },
      companyInfo: { name: companyName, website }
    },
    metadata: {
      startTime: new Date(),
      processingSteps: [{
        step: 'comprehensive_analysis',
        status: 'pending',
        startTime: new Date()
      }]
    }
  });
  
  await scan.save();
  
  // Update user API usage (comprehensive scans count as 2 scans)
  await updateUserUsage(userId);
  await updateUserUsage(userId);
  
  // Emit WebSocket event
  io.to(`scan-${scan._id}`).emit('scan-status', {
    scanId: scan._id,
    status: 'processing',
    step: 'Starting comprehensive analysis'
  });
  
  // Process scan asynchronously
  processComprehensiveScan(scan._id.toString(), {
    phoneNumber,
    chatContent,
    platform,
    symbol,
    tradingPlatform,
    companyName,
    website
  }).catch(error => {
    logger.error('Comprehensive scan processing failed:', error);
  });
  
  res.status(202).json({
    success: true,
    message: 'Comprehensive scan started',
    data: { scan }
  });
}));

// @route   GET /api/scans/:scanId
// @desc    Get scan details
// @access  Private
router.get('/:scanId', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const scan = await Scan.findOne({
    _id: req.params.scanId,
    $or: [
      { userId: req.user!._id },
      { 'sharing.isPublic': true },
      { 'sharing.sharedWith': req.user!._id }
    ]
  });
  
  if (!scan) {
    throw new NotFoundError('Scan not found');
  }
  
  res.json({
    success: true,
    data: { scan }
  });
}));

// @route   GET /api/scans/:scanId/status
// @desc    Get scan status
// @access  Private
router.get('/:scanId/status', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const scan = await Scan.findOne({
    _id: req.params.scanId,
    userId: req.user!._id
  }).select('status metadata.processingSteps results.riskLevel');
  
  if (!scan) {
    throw new NotFoundError('Scan not found');
  }
  
  res.json({
    success: true,
    data: {
      scanId: scan._id,
      status: scan.status,
      processingSteps: scan.metadata.processingSteps,
      riskLevel: scan.results?.riskLevel || null
    }
  });
}));

// @route   GET /api/scans/public/:reportId
// @desc    Get public scan report
// @access  Public
router.get('/public/:reportId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const scan = await Scan.findOne({
    'sharing.reportId': req.params.reportId,
    'sharing.isPublic': true
  }).select('-input -metadata.apiCalls -userId');
  
  if (!scan) {
    throw new NotFoundError('Public report not found');
  }
  
  res.json({
    success: true,
    data: { scan }
  });
}));

// Processing functions

async function processContactScan(scanId: string) {
  const scan = await Scan.findById(scanId);
  if (!scan) return;
  
  try {
    scan.status = 'processing';
    await scan.save();
    
    // Emit status update
    io.to(`scan-${scanId}`).emit('scan-status', {
      scanId,
      status: 'processing',
      step: 'Verifying contact information'
    });
    
    // Perform contact verification
    const verification = await ContactVerificationService.verifyContact(
      scan.input.phoneNumber!,
      scanId
    );
    
    // Update scan with results
    scan.status = 'completed';
    scan.results = {
      riskScore: verification.riskAnalysis.riskScore,
      riskLevel: verification.riskAnalysis.isHighRisk ? 'high' : 'medium',
      confidence: 85,
      summary: `Contact verification completed for +${verification.countryCode}${verification.phoneNumber}`,
      details: verification,
      recommendations: verification.riskAnalysis.recommendations,
      flags: verification.riskAnalysis.isHighRisk ? [{
        type: 'high_risk_contact',
        severity: 'warning' as const,
        message: 'High-risk contact detected',
        evidence: verification.riskAnalysis.riskFactors
      }] : []
    };
    
    scan.metadata.endTime = new Date();
    scan.metadata.processingSteps[0].status = 'completed';
    scan.metadata.processingSteps[0].endTime = new Date();
    
    await scan.save();
    
    // Emit completion
    io.to(`scan-${scanId}`).emit('scan-complete', {
      scanId,
      status: 'completed',
      results: scan.results
    });
    
  } catch (error) {
    logger.error('Contact scan processing error:', error);
    scan.status = 'failed';
    scan.metadata.processingSteps[0].status = 'failed';
    scan.metadata.processingSteps[0].error = error instanceof Error ? error.message : 'Unknown error';
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-error', {
      scanId,
      status: 'failed',
      error: 'Scan processing failed'
    });
  }
}

async function processChatScan(scanId: string, messages: any[], platform: string, analysisDepth: string) {
  const scan = await Scan.findById(scanId);
  if (!scan) return;
  
  try {
    scan.status = 'processing';
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-status', {
      scanId,
      status: 'processing',
      step: 'Analyzing chat content'
    });
    
    // Perform chat analysis
    const analysis = await ChatAnalysisService.analyzeChat(
      messages,
      platform,
      scanId,
      analysisDepth as any
    );
    
    // Update scan with results
    scan.status = 'completed';
    scan.results = {
      riskScore: analysis.riskAssessment.overallRisk,
      riskLevel: analysis.riskAssessment.riskLevel,
      confidence: analysis.riskAssessment.confidence,
      summary: analysis.aiAnalysis.summary,
      details: analysis,
      recommendations: analysis.riskAssessment.recommendations,
      flags: analysis.riskAssessment.redFlags.map(flag => ({
        type: 'chat_risk',
        severity: 'warning' as const,
        message: flag,
        evidence: null
      }))
    };
    
    scan.metadata.endTime = new Date();
    scan.metadata.processingSteps[0].status = 'completed';
    scan.metadata.processingSteps[0].endTime = new Date();
    
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-complete', {
      scanId,
      status: 'completed',
      results: scan.results
    });
    
  } catch (error) {
    logger.error('Chat scan processing error:', error);
    scan.status = 'failed';
    scan.metadata.processingSteps[0].status = 'failed';
    scan.metadata.processingSteps[0].error = error instanceof Error ? error.message : 'Unknown error';
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-error', {
      scanId,
      status: 'failed',
      error: 'Scan processing failed'
    });
  }
}

async function processTradingScan(scanId: string, tradingInfo: any) {
  const scan = await Scan.findById(scanId);
  if (!scan) return;
  
  try {
    scan.status = 'processing';
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-status', {
      scanId,
      status: 'processing',
      step: 'Analyzing trading information'
    });
    
    // Perform trading analysis
    const analysis = await TradingAnalysisService.analyzeTradingInfo(tradingInfo, scanId);
    
    // Update scan with results
    scan.status = 'completed';
    scan.results = {
      riskScore: analysis.overallRisk,
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence,
      summary: `Trading analysis completed for ${tradingInfo.symbol || tradingInfo.platform}`,
      details: analysis,
      recommendations: analysis.recommendations,
      flags: analysis.flags
    };
    
    scan.metadata.endTime = new Date();
    scan.metadata.processingSteps[0].status = 'completed';
    scan.metadata.processingSteps[0].endTime = new Date();
    
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-complete', {
      scanId,
      status: 'completed',
      results: scan.results
    });
    
  } catch (error) {
    logger.error('Trading scan processing error:', error);
    scan.status = 'failed';
    scan.metadata.processingSteps[0].status = 'failed';
    scan.metadata.processingSteps[0].error = error instanceof Error ? error.message : 'Unknown error';
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-error', {
      scanId,
      status: 'failed',
      error: 'Scan processing failed'
    });
  }
}

async function processVeracityScan(scanId: string, companyInfo: any) {
  const scan = await Scan.findById(scanId);
  if (!scan) return;
  
  try {
    scan.status = 'processing';
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-status', {
      scanId,
      status: 'processing',
      step: 'Checking company veracity'
    });
    
    // Perform veracity checking
    const analysis = await VeracityCheckingService.checkVeracity(companyInfo, scanId);
    
    // Update scan with results
    scan.status = 'completed';
    scan.results = {
      riskScore: 100 - analysis.overallVeracity, // Invert for risk score
      riskLevel: analysis.veracityLevel === 'verified' ? 'low' : 
                analysis.veracityLevel === 'likely_legitimate' ? 'medium' : 'high',
      confidence: analysis.confidence,
      summary: `Company veracity check completed: ${analysis.veracityLevel}`,
      details: analysis,
      recommendations: analysis.recommendations,
      flags: analysis.redFlags.map(flag => ({
        type: 'veracity_risk',
        severity: 'warning' as const,
        message: flag,
        evidence: null
      }))
    };
    
    scan.metadata.endTime = new Date();
    scan.metadata.processingSteps[0].status = 'completed';
    scan.metadata.processingSteps[0].endTime = new Date();
    
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-complete', {
      scanId,
      status: 'completed',
      results: scan.results
    });
    
  } catch (error) {
    logger.error('Veracity scan processing error:', error);
    scan.status = 'failed';
    scan.metadata.processingSteps[0].status = 'failed';
    scan.metadata.processingSteps[0].error = error instanceof Error ? error.message : 'Unknown error';
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-error', {
      scanId,
      status: 'failed',
      error: 'Scan processing failed'
    });
  }
}

async function processComprehensiveScan(scanId: string, inputs: any) {
  const scan = await Scan.findById(scanId);
  if (!scan) return;
  
  try {
    scan.status = 'processing';
    await scan.save();
    
    const results: any = {};
    let totalRisk = 0;
    let riskCount = 0;
    const allRecommendations: string[] = [];
    const allFlags: any[] = [];
    
    // Process each available input
    if (inputs.phoneNumber) {
      io.to(`scan-${scanId}`).emit('scan-status', {
        scanId,
        status: 'processing',
        step: 'Analyzing contact information'
      });
      
      try {
        const verification = await ContactVerificationService.verifyContact(inputs.phoneNumber, scanId);
        results.contactVerification = verification;
        totalRisk += verification.riskAnalysis.riskScore;
        riskCount++;
        allRecommendations.push(...verification.riskAnalysis.recommendations);
      } catch (error) {
        logger.error('Contact verification failed in comprehensive scan:', error);
      }
    }
    
    if (inputs.chatContent) {
      io.to(`scan-${scanId}`).emit('scan-status', {
        scanId,
        status: 'processing',
        step: 'Analyzing chat content'
      });
      
      try {
        const messages = parseChatContent(inputs.chatContent, inputs.platform);
        const analysis = await ChatAnalysisService.analyzeChat(messages, inputs.platform, scanId);
        results.chatAnalysis = analysis;
        totalRisk += analysis.riskAssessment.overallRisk;
        riskCount++;
        allRecommendations.push(...analysis.riskAssessment.recommendations);
      } catch (error) {
        logger.error('Chat analysis failed in comprehensive scan:', error);
      }
    }
    
    if (inputs.symbol || inputs.tradingPlatform) {
      io.to(`scan-${scanId}`).emit('scan-status', {
        scanId,
        status: 'processing',
        step: 'Analyzing trading information'
      });
      
      try {
        const tradingInfo = { symbol: inputs.symbol, platform: inputs.tradingPlatform };
        const analysis = await TradingAnalysisService.analyzeTradingInfo(tradingInfo, scanId);
        results.tradingAnalysis = analysis;
        totalRisk += analysis.overallRisk;
        riskCount++;
        allRecommendations.push(...analysis.recommendations);
        allFlags.push(...analysis.flags);
      } catch (error) {
        logger.error('Trading analysis failed in comprehensive scan:', error);
      }
    }
    
    if (inputs.companyName || inputs.website) {
      io.to(`scan-${scanId}`).emit('scan-status', {
        scanId,
        status: 'processing',
        step: 'Checking company veracity'
      });
      
      try {
        const companyInfo = { name: inputs.companyName, website: inputs.website };
        const analysis = await VeracityCheckingService.checkVeracity(companyInfo, scanId);
        results.veracityCheck = analysis;
        totalRisk += (100 - analysis.overallVeracity); // Invert veracity for risk
        riskCount++;
        allRecommendations.push(...analysis.recommendations);
      } catch (error) {
        logger.error('Veracity checking failed in comprehensive scan:', error);
      }
    }
    
    // Calculate overall risk
    const overallRisk = riskCount > 0 ? Math.round(totalRisk / riskCount) : 0;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    
    if (overallRisk >= 80) riskLevel = 'critical';
    else if (overallRisk >= 60) riskLevel = 'high';
    else if (overallRisk >= 40) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Update scan with results
    scan.status = 'completed';
    scan.results = {
      riskScore: overallRisk,
      riskLevel,
      confidence: Math.min(90, 60 + (riskCount * 10)),
      summary: `Comprehensive analysis completed with ${riskCount} components analyzed`,
      details: results,
      recommendations: [...new Set(allRecommendations)], // Remove duplicates
      flags: allFlags
    };
    
    scan.metadata.endTime = new Date();
    scan.metadata.processingSteps[0].status = 'completed';
    scan.metadata.processingSteps[0].endTime = new Date();
    
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-complete', {
      scanId,
      status: 'completed',
      results: scan.results
    });
    
  } catch (error) {
    logger.error('Comprehensive scan processing error:', error);
    scan.status = 'failed';
    scan.metadata.processingSteps[0].status = 'failed';
    scan.metadata.processingSteps[0].error = error instanceof Error ? error.message : 'Unknown error';
    await scan.save();
    
    io.to(`scan-${scanId}`).emit('scan-error', {
      scanId,
      status: 'failed',
      error: 'Scan processing failed'
    });
  }
}

function parseChatContent(chatContent: string, platform: string) {
  // Simplified chat parsing - in production, you'd have proper parsers for each platform
  const lines = chatContent.split('\n').filter(line => line.trim());
  const messages = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Basic message structure
      const message = {
        id: i,
        timestamp: new Date(Date.now() - (lines.length - i) * 60000), // Simulate timestamps
        sender: i % 2 === 0 ? 'user1' : 'user2', // Alternate senders
        text: line
      };
      messages.push(message);
    }
  }
  
  return messages;
}

export default router;