import express from 'express';
import { query, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError } from '../middleware/error-handler';
import ChatAnalysisService from '../services/ChatAnalysisService';

const router = express.Router();

const checkValidation = (req: express.Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
};

// @route   GET /api/chat-analysis/history/:scanId
// @desc    Get chat analysis history for a scan
// @access  Private
router.get('/history/:scanId', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { scanId } = req.params;
  
  const analysis = await ChatAnalysisService.getAnalysisHistory(scanId);
  
  res.json({
    success: true,
    data: { analysis }
  });
}));

// @route   GET /api/chat-analysis/high-risk
// @desc    Get high-risk chat analyses
// @access  Private
router.get('/high-risk', [
  authMiddleware,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const limit = parseInt(req.query.limit as string) || 20;
  const highRiskAnalyses = await ChatAnalysisService.getHighRiskAnalyses(limit);
  
  res.json({
    success: true,
    data: { analyses: highRiskAnalyses }
  });
}));

// @route   GET /api/chat-analysis/platform/:platform
// @desc    Get analyses by platform
// @access  Private
router.get('/platform/:platform', [
  authMiddleware,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { platform } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const analyses = await ChatAnalysisService.getAnalysesByPlatform(platform, limit);
  
  res.json({
    success: true,
    data: { analyses }
  });
}));

export default router;