export interface ContactVerificationRequest {
  type: ContactType;
  value: string;
  metadata?: {
    context?: string;
    urgency?: 'low' | 'medium' | 'high';
    source?: string;
  };
}

export interface ContactVerificationResult {
  id: string;
  contactType: ContactType;
  contactValue: string;
  isScammer: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  verificationSources: VerificationSource[];
  scammerDatabases: ScammerDatabaseResult[];
  additionalInfo: ContactAdditionalInfo;
  recommendations: string[];
  lastVerified: Date;
  flags: VerificationFlag[];
}

export interface VerificationSource {
  name: string;
  url?: string;
  lastChecked: Date;
  status: 'verified' | 'flagged' | 'unknown' | 'error';
  details?: string;
  confidence: number;
}

export interface ScammerDatabaseResult {
  databaseName: string;
  foundMatch: boolean;
  matchDetails?: {
    reportCount: number;
    firstReported: Date;
    lastReported: Date;
    scamTypes: string[];
    victimCount?: number;
    totalLoss?: number;
    jurisdictions: string[];
  };
  confidence: number;
}

export interface ContactAdditionalInfo {
  phoneInfo?: PhoneVerificationInfo;
  emailInfo?: EmailVerificationInfo;
  nameInfo?: NameVerificationInfo;
  crossReferences: CrossReference[];
  socialMediaPresence: SocialMediaPresence[];
  behaviorPatterns: BehaviorPattern[];
}

export interface PhoneVerificationInfo {
  isValid: boolean;
  countryCode: string;
  carrier?: string;
  lineType: 'mobile' | 'landline' | 'voip' | 'toll-free' | 'unknown';
  isPortedNumber: boolean;
  location?: {
    country: string;
    region?: string;
    city?: string;
  };
  reputation: {
    spamScore: number;
    teleMarketingLikelihood: number;
    fraudLikelihood: number;
  };
}

export interface EmailVerificationInfo {
  isValid: boolean;
  isDeliverable: boolean;
  domain: string;
  domainAge?: number;
  disposableEmail: boolean;
  roleAccount: boolean;
  reputation: {
    spamScore: number;
    phishingLikelihood: number;
    compromisedAccount: boolean;
  };
  breachHistory: DataBreachInfo[];
}

export interface NameVerificationInfo {
  commonName: boolean;
  genderPrediction?: 'male' | 'female' | 'neutral' | 'unknown';
  ethnicityPrediction?: string[];
  ageEstimate?: {
    min: number;
    max: number;
  };
  associatedScams: string[];
  publicRecords: PublicRecordMatch[];
}

export interface CrossReference {
  type: 'phone_email' | 'email_name' | 'phone_name' | 'all_three';
  matches: ContactMatch[];
  riskImplication: string;
}

export interface ContactMatch {
  contactType: ContactType;
  value: string;
  source: string;
  confidence: number;
  lastSeen: Date;
}

export interface SocialMediaPresence {
  platform: string;
  profileExists: boolean;
  accountAge?: number;
  followers?: number;
  activityLevel: 'low' | 'medium' | 'high' | 'suspicious';
  profileFlags: string[];
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  riskIndicator: boolean;
  description: string;
}

export interface DataBreachInfo {
  breachName: string;
  breachDate: Date;
  dataTypes: string[];
  source: string;
}

export interface PublicRecordMatch {
  type: 'court' | 'criminal' | 'business' | 'property' | 'other';
  description: string;
  date?: Date;
  jurisdiction: string;
  riskLevel: RiskLevel;
}

export interface VerificationFlag {
  type: VerificationFlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  actionRecommended: string;
}

export interface ContactVerificationConfig {
  enabledSources: string[];
  timeoutMs: number;
  maxRetries: number;
  cacheTtlHours: number;
  apiKeys: {
    truecaller?: string;
    numverify?: string;
    clearbit?: string;
    hunter?: string;
    emailRep?: string;
    scammerInfo?: string;
    fbi_ic3?: string;
    ftc_sentinel?: string;
  };
}

export enum ContactType {
  PHONE = 'phone',
  EMAIL = 'email',
  NAME = 'name'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum VerificationFlagType {
  KNOWN_SCAMMER = 'KNOWN_SCAMMER',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  MULTIPLE_REPORTS = 'MULTIPLE_REPORTS',
  RECENT_COMPLAINTS = 'RECENT_COMPLAINTS',
  FAKE_IDENTITY = 'FAKE_IDENTITY',
  COMPROMISED_ACCOUNT = 'COMPROMISED_ACCOUNT',
  DISPOSABLE_CONTACT = 'DISPOSABLE_CONTACT',
  RAPID_ACCOUNT_CREATION = 'RAPID_ACCOUNT_CREATION',
  LOCATION_MISMATCH = 'LOCATION_MISMATCH',
  HIGH_RISK_DOMAIN = 'HIGH_RISK_DOMAIN',
  VOIP_MASKING = 'VOIP_MASKING',
  BURNER_PHONE = 'BURNER_PHONE'
}

export interface ContactVerificationStats {
  totalVerifications: number;
  scammersDetected: number;
  falsePositives: number;
  avgResponseTime: number;
  sourceReliability: Record<string, number>;
}