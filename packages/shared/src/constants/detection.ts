export const DETECTION_TYPES = {
  PHISHING: 'phishing',
  INVESTMENT_SCAM: 'investment_scam',
  ROMANCE_SCAM: 'romance_scam',
  FAKE_SUPPORT: 'fake_support',
  MALWARE: 'malware',
  SOCIAL_ENGINEERING: 'social_engineering',
  IMPERSONATION: 'impersonation',
  PUMP_DUMP: 'pump_dump',
  PONZI_SCHEME: 'ponzi_scheme',
  FAKE_EXCHANGE: 'fake_exchange',
  RUG_PULL: 'rug_pull',
  FAKE_GIVEAWAY: 'fake_giveaway',
  ADVANCE_FEE: 'advance_fee',
  TECH_SUPPORT: 'tech_support',
  FAKE_JOB: 'fake_job',
  LOTTERY_SCAM: 'lottery_scam',
  CHARITY_SCAM: 'charity_scam',
} as const;

export const DETECTION_DESCRIPTIONS = {
  [DETECTION_TYPES.PHISHING]: 'Attempt to steal credentials or personal information',
  [DETECTION_TYPES.INVESTMENT_SCAM]: 'Fraudulent investment opportunity or scheme',
  [DETECTION_TYPES.ROMANCE_SCAM]: 'Romantic relationship used for financial exploitation',
  [DETECTION_TYPES.FAKE_SUPPORT]: 'Impersonation of legitimate customer support',
  [DETECTION_TYPES.MALWARE]: 'Malicious software or suspicious links',
  [DETECTION_TYPES.SOCIAL_ENGINEERING]: 'Manipulation to reveal information or perform actions',
  [DETECTION_TYPES.IMPERSONATION]: 'Pretending to be a person, company, or authority',
  [DETECTION_TYPES.PUMP_DUMP]: 'Artificial inflation of asset prices for profit',
  [DETECTION_TYPES.PONZI_SCHEME]: 'Investment fraud using new investor funds',
  [DETECTION_TYPES.FAKE_EXCHANGE]: 'Fraudulent cryptocurrency exchange platform',
  [DETECTION_TYPES.RUG_PULL]: 'Sudden removal of liquidity from DeFi project',
  [DETECTION_TYPES.FAKE_GIVEAWAY]: 'False promise of free cryptocurrency or prizes',
  [DETECTION_TYPES.ADVANCE_FEE]: 'Upfront payment required for promised benefit',
  [DETECTION_TYPES.TECH_SUPPORT]: 'Fake technical support for computer problems',
  [DETECTION_TYPES.FAKE_JOB]: 'Fraudulent employment opportunity',
  [DETECTION_TYPES.LOTTERY_SCAM]: 'False lottery or sweepstakes winnings',
  [DETECTION_TYPES.CHARITY_SCAM]: 'Fraudulent charitable organization or cause',
} as const;

export const SCAM_KEYWORDS = {
  URGENCY: [
    'urgent', 'immediately', 'asap', 'now', 'hurry', 'quick', 'fast',
    'limited time', 'expires soon', 'act now', 'don\'t miss', 'last chance',
  ],
  MONEY: [
    'guaranteed', 'profit', 'roi', 'investment', 'return', 'money', 'cash',
    'bitcoin', 'crypto', 'ethereum', 'free money', 'easy money', 'passive income',
    'double your money', 'triple your investment', 'huge profits',
  ],
  CONTACT: [
    'whatsapp', 'telegram', 'dm', 'direct message', 'contact me', 'text me',
    'call me', 'email me', 'reach out', 'get in touch',
  ],
  TRUST: [
    'trust me', 'believe me', 'honest', 'legitimate', 'verified', 'certified',
    'registered', 'licensed', 'official', 'authorized', 'approved',
  ],
  SECRECY: [
    'secret', 'confidential', 'private', 'exclusive', 'insider', 'vip',
    'members only', 'invitation only', 'select few', 'don\'t tell anyone',
  ],
  FEAR: [
    'account suspended', 'account closed', 'security breach', 'unauthorized access',
    'verify immediately', 'confirm identity', 'update payment', 'expired',
  ],
} as const;

export const SUSPICIOUS_DOMAINS = [
  // Common typosquatting patterns
  'payp4l.com',
  'paypaI.com', // capital i instead of l
  'paypal1.com',
  'paypal-security.com',
  'amazon-security.com',
  'apple-support.com',
  'microsoft-support.com',
  'binance-support.com',
  'coinbase-security.com',
] as const;

export const BLOCKCHAIN_RISK_INDICATORS = {
  MIXER_SERVICES: ['tornado.cash', 'mixer', 'tumbler'],
  DARKNET_MARKETS: ['silk', 'agora', 'evolution'],
  RANSOMWARE: ['locky', 'cryptolocker', 'wannacry'],
  EXCHANGE_HACKS: ['mt.gox', 'quadriga', 'ftx'],
} as const;

export const AI_MODEL_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
  MINIMUM: 0.3,
} as const;

export const SCAN_PROCESSING_TIMEOUT = {
  TEXT: 30000, // 30 seconds
  URL: 60000, // 1 minute
  IMAGE: 120000, // 2 minutes
  CHAT_IMPORT: 300000, // 5 minutes
  FILE: 180000, // 3 minutes
} as const;

export const DETECTION_WEIGHTS = {
  [DETECTION_TYPES.PHISHING]: 0.9,
  [DETECTION_TYPES.INVESTMENT_SCAM]: 0.95,
  [DETECTION_TYPES.ROMANCE_SCAM]: 0.8,
  [DETECTION_TYPES.FAKE_SUPPORT]: 0.85,
  [DETECTION_TYPES.MALWARE]: 0.95,
  [DETECTION_TYPES.SOCIAL_ENGINEERING]: 0.75,
  [DETECTION_TYPES.IMPERSONATION]: 0.8,
  [DETECTION_TYPES.PUMP_DUMP]: 0.9,
  [DETECTION_TYPES.PONZI_SCHEME]: 0.95,
  [DETECTION_TYPES.FAKE_EXCHANGE]: 0.9,
  [DETECTION_TYPES.RUG_PULL]: 0.95,
  [DETECTION_TYPES.FAKE_GIVEAWAY]: 0.85,
  [DETECTION_TYPES.ADVANCE_FEE]: 0.8,
  [DETECTION_TYPES.TECH_SUPPORT]: 0.75,
  [DETECTION_TYPES.FAKE_JOB]: 0.7,
  [DETECTION_TYPES.LOTTERY_SCAM]: 0.85,
  [DETECTION_TYPES.CHARITY_SCAM]: 0.8,
} as const;