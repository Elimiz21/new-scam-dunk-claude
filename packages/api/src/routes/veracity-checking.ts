import express from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError } from '../middleware/error-handler';
import VeracityCheckingService from '../services/VeracityCheckingService';

const router = express.Router();

const checkValidation = (req: express.Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
};

// @route   POST /api/veracity-checking/quick-check
// @desc    Quick veracity check without creating a full scan
// @access  Private
router.post('/quick-check', [
  authMiddleware,
  body('companyName').optional().isString().withMessage('Company name must be a string'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('registrationNumber').optional().isString().withMessage('Registration number must be a string')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { companyName, website, registrationNumber } = req.body;
  
  if (!companyName && !website && !registrationNumber) {
    throw new ValidationError('At least one of company name, website, or registration number must be provided');
  }
  
  const companyInfo = { name: companyName, website, registrationNumber };
  const result = await VeracityCheckingService.checkVeracity(companyInfo, 'quick-check');
  
  res.json({
    success: true,
    data: { result }
  });
}));

// @route   POST /api/veracity-checking/bulk
// @desc    Bulk veracity checking
// @access  Private
router.post('/bulk', [
  authMiddleware,
  body('companies').isArray({ min: 1, max: 10 }).withMessage('Companies must be an array of 1-10 items'),
  body('companies.*.companyName').optional().isString(),
  body('companies.*.website').optional().isURL(),
  body('companies.*.registrationNumber').optional().isString()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { companies } = req.body;
  
  // Validate that each company has at least one field
  for (const company of companies) {
    if (!company.companyName && !company.website && !company.registrationNumber) {
      throw new ValidationError('Each company must have at least one of: companyName, website, or registrationNumber');
    }
  }
  
  const results = await VeracityCheckingService.getBulkVeracityCheck(
    companies.map((c: any) => ({
      name: c.companyName,
      website: c.website,
      registrationNumber: c.registrationNumber
    }))
  );
  
  res.json({
    success: true,
    data: { results }
  });
}));

// @route   GET /api/veracity-checking/history/:companyName
// @desc    Get veracity check history for a company
// @access  Private
router.get('/history/:companyName', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { companyName } = req.params;
  
  const history = await VeracityCheckingService.getVeracityHistory(companyName);
  
  res.json({
    success: true,
    data: { history }
  });
}));

export default router;