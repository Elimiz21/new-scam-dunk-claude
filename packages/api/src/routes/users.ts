import express from 'express';
import { body, query, validationResult } from 'express-validator';
import User from '../models/User';
import Scan from '../models/Scan';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError } from '../middleware/error-handler';
import { logger } from '../index';

const router = express.Router();

// Helper function to check validation results
const checkValidation = (req: express.Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
};

// @route   GET /api/users/profile
// @desc    Get current user profile with detailed information
// @access  Private
router.get('/profile', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get user's scan statistics
  const scanStats = await Scan.aggregate([
    { $match: { userId: req.user!._id } },
    {
      $group: {
        _id: null,
        totalScans: { $sum: 1 },
        totalCritical: { $sum: { $cond: [{ $eq: ['$results.riskLevel', 'critical'] }, 1, 0] } },
        totalHigh: { $sum: { $cond: [{ $eq: ['$results.riskLevel', 'high'] }, 1, 0] } },
        totalMedium: { $sum: { $cond: [{ $eq: ['$results.riskLevel', 'medium'] }, 1, 0] } },
        totalLow: { $sum: { $cond: [{ $eq: ['$results.riskLevel', 'low'] }, 1, 0] } },
        avgRiskScore: { $avg: '$results.riskScore' }
      }
    }
  ]);
  
  const stats = scanStats[0] || {
    totalScans: 0,
    totalCritical: 0,
    totalHigh: 0,
    totalMedium: 0,
    totalLow: 0,
    avgRiskScore: 0
  };
  
  res.json({
    success: true,
    data: {
      user: user.toJSON(),
      stats: {
        scans: stats,
        apiUsage: user.apiUsage,
        subscription: user.subscription
      }
    }
  });
}));

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userId = req.user!._id;
  
  // Get recent scans
  const recentScans = await Scan.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('type status results.riskLevel results.riskScore createdAt');
  
  // Get scan statistics by type
  const scansByType = await Scan.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgRiskScore: { $avg: '$results.riskScore' }
      }
    }
  ]);
  
  // Get scan statistics by risk level
  const scansByRisk = await Scan.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$results.riskLevel',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get monthly scan trend
  const monthlyTrend = await Scan.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        avgRiskScore: { $avg: '$results.riskScore' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  
  res.json({
    success: true,
    data: {
      recentScans,
      statistics: {
        byType: scansByType,
        byRisk: scansByRisk,
        monthlyTrend
      },
      apiUsage: req.user!.apiUsage
    }
  });
}));

// @route   GET /api/users/scans
// @desc    Get user's scans with pagination and filtering
// @access  Private
router.get('/scans', [
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['contact', 'chat', 'trading', 'veracity', 'comprehensive']).withMessage('Invalid scan type'),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']).withMessage('Invalid status'),
  query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid risk level'),
  query('sortBy').optional().isIn(['createdAt', 'riskScore', 'type']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter: any = { userId: req.user!._id };
  
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.riskLevel) filter['results.riskLevel'] = req.query.riskLevel;
  
  // Build sort
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort: any = { [sortBy]: sortOrder };
  
  // If sorting by riskScore, sort by results.riskScore
  if (sortBy === 'riskScore') {
    sort['results.riskScore'] = sortOrder;
    delete sort.riskScore;
  }
  
  const [scans, total] = await Promise.all([
    Scan.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-input -metadata.apiCalls'), // Exclude sensitive/large data
    Scan.countDocuments(filter)
  ]);
  
  res.json({
    success: true,
    data: {
      scans,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  });
}));

// @route   GET /api/users/scans/:scanId
// @desc    Get detailed scan information
// @access  Private
router.get('/scans/:scanId', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const scan = await Scan.findOne({
    _id: req.params.scanId,
    userId: req.user!._id
  });
  
  if (!scan) {
    throw new NotFoundError('Scan not found');
  }
  
  res.json({
    success: true,
    data: { scan }
  });
}));

// @route   DELETE /api/users/scans/:scanId
// @desc    Delete a scan
// @access  Private
router.delete('/scans/:scanId', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const scan = await Scan.findOne({
    _id: req.params.scanId,
    userId: req.user!._id
  });
  
  if (!scan) {
    throw new NotFoundError('Scan not found');
  }
  
  await Scan.findByIdAndDelete(scan._id);
  
  logger.info('Scan deleted', {
    scanId: scan._id,
    userId: req.user!._id,
    scanType: scan.type
  });
  
  res.json({
    success: true,
    message: 'Scan deleted successfully'
  });
}));

// @route   PUT /api/users/scans/:scanId/share
// @desc    Update scan sharing settings
// @access  Private
router.put('/scans/:scanId/share', [
  authMiddleware,
  body('isPublic').isBoolean().withMessage('isPublic must be a boolean'),
  body('sharedWith').optional().isArray().withMessage('sharedWith must be an array of user IDs')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { isPublic, sharedWith } = req.body;
  
  const scan = await Scan.findOne({
    _id: req.params.scanId,
    userId: req.user!._id
  });
  
  if (!scan) {
    throw new NotFoundError('Scan not found');
  }
  
  scan.sharing.isPublic = isPublic;
  if (sharedWith !== undefined) {
    scan.sharing.sharedWith = sharedWith;
  }
  
  // Generate report ID for public scans
  if (isPublic && !scan.sharing.reportId) {
    scan.sharing.reportId = generateReportId();
  }
  
  await scan.save();
  
  res.json({
    success: true,
    message: 'Sharing settings updated',
    data: { scan }
  });
}));

// @route   GET /api/users/subscription
// @desc    Get subscription information
// @access  Private
router.get('/subscription', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Calculate remaining scans for current period
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const limits = {
    free: { daily: 5, monthly: 20 },
    premium: { daily: 50, monthly: 500 },
    pro: { daily: 200, monthly: 2000 }
  };
  
  const userLimits = limits[user.subscription.plan];
  
  res.json({
    success: true,
    data: {
      subscription: user.subscription,
      usage: user.apiUsage,
      limits: userLimits,
      remaining: {
        daily: Math.max(0, userLimits.daily - user.apiUsage.scansToday),
        monthly: Math.max(0, userLimits.monthly - user.apiUsage.scansThisMonth)
      }
    }
  });
}));

// @route   GET /api/users/settings
// @desc    Get user settings
// @access  Private
router.get('/settings', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: {
      preferences: user.preferences,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin
    }
  });
}));

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', [
  authMiddleware,
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.push').optional().isBoolean(),
  body('preferences.notifications.sms').optional().isBoolean(),
  body('preferences.privacy.profileVisible').optional().isBoolean(),
  body('preferences.privacy.shareData').optional().isBoolean()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  const { preferences } = req.body;
  
  if (preferences) {
    if (preferences.notifications) {
      user.preferences.notifications = { ...user.preferences.notifications, ...preferences.notifications };
    }
    if (preferences.privacy) {
      user.preferences.privacy = { ...user.preferences.privacy, ...preferences.privacy };
    }
  }
  
  await user.save();
  
  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: {
      preferences: user.preferences
    }
  });
}));

// Admin Routes

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', [
  authMiddleware,
  requireRole(['admin', 'moderator']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('role').optional().isIn(['user', 'admin', 'moderator']),
  query('isActive').optional().isBoolean()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter: any = {};
  
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { email: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex }
    ];
  }
  
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'),
    User.countDocuments(filter)
  ]);
  
  res.json({
    success: true,
    data: {
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  });
}));

// @route   GET /api/users/:userId
// @desc    Get user by ID (Admin only)
// @access  Private (Admin)
router.get('/:userId', [
  authMiddleware,
  requireRole(['admin', 'moderator'])
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get user's scan statistics
  const scanStats = await Scan.aggregate([
    { $match: { userId: req.params.userId } },
    {
      $group: {
        _id: null,
        totalScans: { $sum: 1 },
        totalCritical: { $sum: { $cond: [{ $eq: ['$results.riskLevel', 'critical'] }, 1, 0] } },
        totalHigh: { $sum: { $cond: [{ $eq: ['$results.riskLevel', 'high'] }, 1, 0] } },
        avgRiskScore: { $avg: '$results.riskScore' }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      user: user.toJSON(),
      stats: scanStats[0] || { totalScans: 0, totalCritical: 0, totalHigh: 0, avgRiskScore: 0 }
    }
  });
}));

// @route   PUT /api/users/:userId
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.put('/:userId', [
  authMiddleware,
  requireRole('admin'),
  body('role').optional().isIn(['user', 'admin', 'moderator']),
  body('isActive').optional().isBoolean(),
  body('isVerified').optional().isBoolean()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  const { role, isActive, isVerified } = req.body;
  
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (isVerified !== undefined) user.isVerified = isVerified;
  
  await user.save();
  
  logger.warn('User updated by admin', {
    adminId: req.user!._id,
    targetUserId: user._id,
    changes: { role, isActive, isVerified }
  });
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: user.toJSON() }
  });
}));

function generateReportId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default router;