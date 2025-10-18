import dotenv from 'dotenv';

dotenv.config();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'] as const;

type RequiredKey = typeof required[number];

const getRequired = (key: RequiredKey) => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
};

const featureFlags = {
  useContactProvider: process.env.ENABLE_CONTACT_PROVIDER === 'true',
  useChatProvider: process.env.ENABLE_CHAT_PROVIDER === 'true',
  useTradingProvider: process.env.ENABLE_TRADING_PROVIDER === 'true',
  useVeracityProvider: process.env.ENABLE_VERACITY_PROVIDER === 'true',
};

const providers = {
  contact: process.env.CONTACT_PROVIDER_URL?.trim() || null,
  chat: process.env.CHAT_PROVIDER_URL?.trim() || null,
  trading: process.env.TRADING_PROVIDER_URL?.trim() || null,
  veracity: process.env.VERACITY_PROVIDER_URL?.trim() || null,
};

export const config = {
  supabaseUrl: getRequired('SUPABASE_URL'),
  supabaseServiceRoleKey: getRequired('SUPABASE_SERVICE_ROLE_KEY'),
  jwtSecret: getRequired('JWT_SECRET'),
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  port: Number(process.env.PORT || 3001),
  providerTimeoutMs: Number(process.env.PROVIDER_TIMEOUT_MS || 2500),
  featureFlags,
  providers,
  openAiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
  hibpUserAgent: process.env.HIBP_USER_AGENT?.trim() || 'ScamDunk/1.0 (+https://scam-dunk.com)',
};

export default config;
