import express from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError } from '../middleware/error-handler';
import TradingAnalysisService from '../services/TradingAnalysisService';

const router = express.Router();

const checkValidation = (req: express.Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
};

// @route   POST /api/trading-analysis/quick-check
// @desc    Quick trading analysis without creating a full scan
// @access  Private
router.post('/quick-check', [
  authMiddleware,
  body('symbol').optional().isString().withMessage('Symbol must be a string'),
  body('platform').optional().isString().withMessage('Platform must be a string'),
  body('amount').optional().isNumeric().withMessage('Amount must be numeric'),
  body('currency').optional().isString().withMessage('Currency must be a string')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { symbol, platform, amount, currency } = req.body;
  
  if (!symbol && !platform) {
    throw new ValidationError('Either symbol or platform must be provided');
  }
  
  const tradingInfo = { symbol, platform, amount, currency };
  const analysis = await TradingAnalysisService.analyzeTradingInfo(tradingInfo, 'quick-check');
  
  res.json({
    success: true,
    data: { analysis }
  });
}));

export default router;