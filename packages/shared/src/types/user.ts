import { BaseEntity, ContactInfo, Location } from './common';
import { UserRole } from './auth';

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  profile?: UserProfile;
  subscription?: UserSubscription;
  settings: UserSettings;
}

export interface UserProfile {
  bio?: string;
  location?: Location;
  website?: string;
  socialLinks?: {
    platform: string;
    url: string;
  }[];
  preferences: UserPreferences;
  statistics: UserStatistics;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  appearance: AppearancePreferences;
}

export interface NotificationPreferences {
  email: {
    scanResults: boolean;
    securityAlerts: boolean;
    newsletter: boolean;
    marketing: boolean;
  };
  push: {
    scanResults: boolean;
    securityAlerts: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private';
  showActivity: boolean;
  shareAnalytics: boolean;
}

export interface AppearancePreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  currency: string;
}

export interface UserStatistics {
  totalScans: number;
  scamsDetected: number;
  moneyPotentiallySaved: number;
  joinedAt: Date;
  streakDays: number;
}

export interface UserSettings {
  twoFactorSecret?: string;
  backupCodes?: string[];
  apiKeys?: UserApiKey[];
  sessions: UserSession[];
}

export interface UserApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface UserSession {
  id: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    location?: Location;
    device: string;
    browser: string;
    os: string;
  };
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
}

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  usage: SubscriptionUsage;
}

export interface SubscriptionUsage {
  scansUsed: number;
  scansLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  resetDate: Date;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  profile?: Partial<UserProfile>;
}

export interface UpdatePreferencesRequest {
  notifications?: Partial<NotificationPreferences>;
  privacy?: Partial<PrivacyPreferences>;
  appearance?: Partial<AppearancePreferences>;
}