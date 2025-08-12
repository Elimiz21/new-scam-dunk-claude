import { z } from 'zod';
import { baseEntitySchema, locationSchema, emailSchema } from './common';
import { userRoleSchema } from './auth';

export const subscriptionPlanSchema = z.enum(['free', 'basic', 'premium', 'enterprise']);

export const notificationPreferencesSchema = z.object({
  email: z.object({
    scanResults: z.boolean(),
    securityAlerts: z.boolean(),
    newsletter: z.boolean(),
    marketing: z.boolean(),
  }),
  push: z.object({
    scanResults: z.boolean(),
    securityAlerts: z.boolean(),
  }),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'never']),
});

export const privacyPreferencesSchema = z.object({
  profileVisibility: z.enum(['public', 'private']),
  showActivity: z.boolean(),
  shareAnalytics: z.boolean(),
});

export const appearancePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(2).max(5),
  timezone: z.string(),
  currency: z.string().length(3),
});

export const userPreferencesSchema = z.object({
  notifications: notificationPreferencesSchema,
  privacy: privacyPreferencesSchema,
  appearance: appearancePreferencesSchema,
});

export const userStatisticsSchema = z.object({
  totalScans: z.number().nonnegative(),
  scamsDetected: z.number().nonnegative(),
  moneyPotentiallySaved: z.number().nonnegative(),
  joinedAt: z.date(),
  streakDays: z.number().nonnegative(),
});

export const userProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: locationSchema.optional(),
  website: z.string().url().optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string().url(),
  })).optional(),
  preferences: userPreferencesSchema,
  statistics: userStatisticsSchema,
});

export const userApiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  key: z.string(),
  permissions: z.array(z.string()),
  lastUsed: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
});

export const userSessionSchema = z.object({
  id: z.string(),
  deviceInfo: z.object({
    userAgent: z.string(),
    ip: z.string(),
    location: locationSchema.optional(),
    device: z.string(),
    browser: z.string(),
    os: z.string(),
  }),
  createdAt: z.date(),
  lastActiveAt: z.date(),
  expiresAt: z.date(),
});

export const subscriptionUsageSchema = z.object({
  scansUsed: z.number().nonnegative(),
  scansLimit: z.number().positive(),
  apiCallsUsed: z.number().nonnegative(),
  apiCallsLimit: z.number().positive(),
  resetDate: z.date(),
});

export const userSubscriptionSchema = z.object({
  plan: subscriptionPlanSchema,
  status: z.enum(['active', 'cancelled', 'expired', 'trialing']),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean(),
  trialEnd: z.date().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  usage: subscriptionUsageSchema,
});

export const userSettingsSchema = z.object({
  twoFactorSecret: z.string().optional(),
  backupCodes: z.array(z.string()).optional(),
  apiKeys: z.array(userApiKeySchema).optional(),
  sessions: z.array(userSessionSchema),
});

export const userSchema = baseEntitySchema.extend({
  email: emailSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  avatar: z.string().url().optional(),
  role: userRoleSchema,
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  lastLoginAt: z.date().optional(),
  profile: userProfileSchema.optional(),
  subscription: userSubscriptionSchema.optional(),
  settings: userSettingsSchema,
});

export const updateUserRequestSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  profile: userProfileSchema.partial().optional(),
});

export const updatePreferencesRequestSchema = z.object({
  notifications: notificationPreferencesSchema.partial().optional(),
  privacy: privacyPreferencesSchema.partial().optional(),
  appearance: appearancePreferencesSchema.partial().optional(),
});