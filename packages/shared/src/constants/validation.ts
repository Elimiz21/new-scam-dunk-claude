export const VALIDATION_LIMITS = {
  // Text inputs
  MAX_TEXT_LENGTH: 10000,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_BIO_LENGTH: 500,
  MAX_COMMENT_LENGTH: 1000,
  
  // Names
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 1,
  
  // Passwords
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Files
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_CHAT_EXPORT_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Pagination
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
  
  // Arrays
  MAX_TAGS: 10,
  MAX_SOCIAL_LINKS: 5,
  MAX_API_KEYS: 10,
  MAX_SESSIONS: 20,
} as const;

export const ALLOWED_FILE_TYPES = {
  IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'txt'],
  CHAT_EXPORTS: ['json', 'txt', 'csv', 'zip'],
  ALL: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt', 'json', 'csv', 'zip'],
} as const;

export const MIME_TYPES = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'txt': 'text/plain',
  'json': 'application/json',
  'csv': 'text/csv',
  'zip': 'application/zip',
} as const;

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/.+/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Blockchain addresses
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  BITCOIN_ADDRESS: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
  SOLANA_ADDRESS: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  
  // Social handles
  TWITTER_HANDLE: /^@?[A-Za-z0-9_]{1,15}$/,
  TELEGRAM_HANDLE: /^@?[A-Za-z0-9_]{5,32}$/,
  
  // Common scam patterns
  SUSPICIOUS_URGENCY: /\b(urgent|immediately|asap|now|hurry|limited time|expires soon)\b/i,
  SUSPICIOUS_MONEY: /\b(guaranteed|profit|roi|investment|return|money|cash|bitcoin|crypto)\b/i,
  SUSPICIOUS_CONTACT: /\b(whatsapp|telegram|dm|direct message|contact me)\b/i,
} as const;

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  forbidCommon: true,
} as const;

export const COMMON_PASSWORDS = [
  'password',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'password123',
  'admin',
  'letmein',
  'welcome',
  'monkey',
] as const;