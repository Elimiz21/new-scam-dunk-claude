import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError } from '../middleware/error-handler';
import ContactVerificationService from '../services/ContactVerificationService';

const router = express.Router();

const checkValidation = (req: express.Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
};

// @route   POST /api/contact-verification/verify
// @desc    Verify contacts
// @access  Private
router.post('/verify', [
  authMiddleware,
  body('contacts').isArray().withMessage('Contacts must be an array'),
  body('contacts.*.name').optional().isString(),
  body('contacts.*.phone').optional().isString(),
  body('contacts.*.email').optional().isEmail()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { contacts } = req.body;
  
  // Process contacts
  const results = await Promise.all(
    contacts.map(async (contact: any) => {
      if (contact.phone) {
        return await ContactVerificationService.verifyContact(contact.phone, req.user?._id || req.user?.id || '');
      }
      return {
        contact,
        verified: false,
        riskLevel: 'unknown',
        message: 'Phone number required for verification'
      };
    })
  );
  
  const result = {
    contacts: results,
    overallRiskScore: results.reduce((acc: number, r: any) => acc + (r.riskScore || 0), 0) / results.length,
    timestamp: new Date()
  };
  
  res.json({
    success: true,
    data: result
  });
}));

// @route   GET /api/contact-verification/history/:phoneNumber
// @desc    Get verification history for a phone number
// @access  Private
router.get('/history/:phoneNumber', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { phoneNumber } = req.params;
  
  const history = await ContactVerificationService.getVerificationHistory(phoneNumber);
  
  res.json({
    success: true,
    data: { history }
  });
}));

// @route   GET /api/contact-verification/high-risk
// @desc    Get high-risk phone numbers
// @access  Private
router.get('/high-risk', [
  authMiddleware,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const limit = parseInt(req.query.limit as string) || 20;
  const highRiskNumbers = await ContactVerificationService.getHighRiskNumbers(limit);
  
  res.json({
    success: true,
    data: { numbers: highRiskNumbers }
  });
}));

// @route   GET /api/contact-verification/spam
// @desc    Get known spam numbers
// @access  Private
router.get('/spam', [
  authMiddleware,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const limit = parseInt(req.query.limit as string) || 20;
  const spamNumbers = await ContactVerificationService.getSpamNumbers(limit);
  
  res.json({
    success: true,
    data: { numbers: spamNumbers }
  });
}));

export default router;