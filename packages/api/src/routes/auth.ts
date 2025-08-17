import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { UserService } from '../services/UserService';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authMiddleware,
  AuthRequest 
} from '../middleware/auth';
import { asyncHandler, ValidationError, UnauthorizedError, ConflictError } from '../middleware/error-handler';
import { logger } from '../index';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Helper function to check validation results
const checkValidation = (req: express.Request) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  checkValidation(req);
  
  const { email, password, firstName, lastName } = req.body;
  
  // Check if user already exists
  const existingUser = await UserService.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('User already exists with this email');
  }
  
  // Create new user
  const user = await UserService.createUser({
    email,
    password,
    firstName: firstName.trim(),
    lastName: lastName.trim()
  });
  
  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  
  logger.info('User registered successfully', {
    userId: user.id,
    email: user.email,
    ip: req.ip
  });
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: UserService.sanitizeUser(user),
      token,
      refreshToken
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  checkValidation(req);
  
  const { email, password } = req.body;
  
  // Find user
  const user = await UserService.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  // Verify password
  const isPasswordValid = await UserService.verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    logger.warn('Failed login attempt', {
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    throw new UnauthorizedError('Invalid credentials');
  }
  
  // Update last login
  await UserService.updateLastLogin(user.id);
  
  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  
  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    ip: req.ip
  });
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: UserService.sanitizeUser(user),
      token,
      refreshToken
    }
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }
  
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await UserService.findById(decoded.userId);
    
    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    
    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  authMiddleware,
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.push').optional().isBoolean(),
  body('preferences.notifications.sms').optional().isBoolean(),
  body('preferences.privacy.profileVisible').optional().isBoolean(),
  body('preferences.privacy.shareData').optional().isBoolean()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  const { firstName, lastName, preferences } = req.body;
  
  // Update allowed fields
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (preferences !== undefined) {
    if (preferences.notifications !== undefined) {
      user.preferences.notifications = { ...user.preferences.notifications, ...preferences.notifications };
    }
    if (preferences.privacy !== undefined) {
      user.preferences.privacy = { ...user.preferences.privacy, ...preferences.privacy };
    }
  }
  
  await user.save();
  
  logger.info('User profile updated', {
    userId: user._id,
    ip: req.ip
  });
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: UserService.sanitizeUser(user)
    }
  });
}));

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  authMiddleware,
  ...changePasswordValidation
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  logger.info('User password changed', {
    userId: user._id,
    ip: req.ip
  });
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // In a real application, you might want to maintain a blacklist of tokens
  // or use Redis to track valid tokens
  
  logger.info('User logged out', {
    userId: req.user!._id,
    ip: req.ip
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  authMiddleware,
  body('password').notEmpty().withMessage('Password is required for account deletion')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  checkValidation(req);
  
  const { password } = req.body;
  
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Password is incorrect');
  }
  
  // Soft delete - mark as inactive
  user.isActive = false;
  await user.save();
  
  logger.warn('User account deleted', {
    userId: user._id,
    email: user.email,
    ip: req.ip
  });
  
  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', asyncHandler(async (req: express.Request, res: express.Response) => {
  // In a real implementation, you would verify the email token
  // For now, we'll just mark all users as verified
  
  const { token } = req.params;
  
  // This is a simplified implementation
  // In production, you would:
  // 1. Decode/verify the token
  // 2. Find the user by token
  // 3. Mark as verified
  
  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification
// @access  Private
router.post('/resend-verification', authMiddleware, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const user = req.user!;
  
  if (user.isVerified) {
    return res.json({
      success: true,
      message: 'Email is already verified'
    });
  }
  
  // In a real implementation, you would send a verification email
  logger.info('Verification email resent', {
    userId: user._id,
    email: user.email
  });
  
  res.json({
    success: true,
    message: 'Verification email sent'
  });
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], asyncHandler(async (req: express.Request, res: express.Response) => {
  checkValidation(req);
  
  const { email } = req.body;
  
  const user = await User.findOne({ email: email.toLowerCase() });
  
  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
  
  if (user) {
    // In a real implementation, you would send a password reset email
    logger.info('Password reset requested', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });
  }
}));

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], asyncHandler(async (req: express.Request, res: express.Response) => {
  checkValidation(req);
  
  const { token } = req.params;
  const { password } = req.body;
  
  // In a real implementation, you would:
  // 1. Verify the reset token
  // 2. Find the user by token
  // 3. Update the password
  // 4. Invalidate the token
  
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

export default router;