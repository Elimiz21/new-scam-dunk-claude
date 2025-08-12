export const APP_NAME = 'Scam Dunk';
export const APP_DESCRIPTION = 'AI-Native Anti-Scam Investment Protection Platform';
export const APP_VERSION = '1.0.0';
export const APP_URL = 'https://scam-dunk.app';

export const COMPANY = {
  name: 'Scam Dunk Inc.',
  website: 'https://scam-dunk.com',
  email: 'hello@scam-dunk.com',
  support: 'support@scam-dunk.com',
} as const;

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/scamdunk',
  linkedin: 'https://linkedin.com/company/scamdunk',
  github: 'https://github.com/scamdunk',
  discord: 'https://discord.gg/scamdunk',
} as const;

export const LEGAL_LINKS = {
  terms: '/legal/terms',
  privacy: '/legal/privacy',
  cookies: '/legal/cookies',
  disclaimer: '/legal/disclaimer',
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE]: {
    scansPerMonth: 10,
    apiCallsPerMonth: 100,
    features: ['basic_scan', 'text_analysis'],
  },
  [SUBSCRIPTION_PLANS.BASIC]: {
    scansPerMonth: 100,
    apiCallsPerMonth: 1000,
    features: ['basic_scan', 'text_analysis', 'url_analysis', 'chat_import'],
  },
  [SUBSCRIPTION_PLANS.PREMIUM]: {
    scansPerMonth: 1000,
    apiCallsPerMonth: 10000,
    features: ['all_features', 'priority_support', 'advanced_analytics'],
  },
  [SUBSCRIPTION_PLANS.ENTERPRISE]: {
    scansPerMonth: -1, // unlimited
    apiCallsPerMonth: -1, // unlimited
    features: ['all_features', 'white_label', 'sla', 'dedicated_support'],
  },
} as const;

export const DEFAULT_TIMEZONE = 'UTC';
export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_CURRENCY = 'USD';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
] as const;

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
] as const;