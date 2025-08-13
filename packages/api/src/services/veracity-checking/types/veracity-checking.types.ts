export interface VeracityCheckRequest {
  checkType: VeracityCheckType;
  target: VeracityTarget;
  options?: VeracityCheckOptions;
}

export interface VeracityTarget {
  type: TargetType;
  identifier: string; // Symbol, URL, company name, etc.
  additionalInfo?: AdditionalTargetInfo;
}

export interface AdditionalTargetInfo {
  exchange?: string;
  contractAddress?: string;
  website?: string;
  companyName?: string;
  jurisdiction?: string;
  claimedValue?: number;
  dateContext?: Date;
}

export interface VeracityCheckOptions {
  thoroughnessLevel: 'basic' | 'standard' | 'comprehensive' | 'forensic';
  includeHistoricalData: boolean;
  checkLawEnforcement: boolean;
  verifyRegulatory: boolean;
  crossReferenceMultipleSources: boolean;
  realTimeVerification: boolean;
  generateComplianceReport: boolean;
}

export interface VeracityCheckResult {
  id: string;
  checkType: VeracityCheckType;
  target: VeracityTarget;
  
  // Overall Results
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  overallConfidence: number;
  riskLevel: RiskLevel;
  
  // Detailed Verification Results
  existenceVerification: ExistenceVerification;
  regulatoryVerification: RegulatoryVerification;
  lawEnforcementVerification: LawEnforcementVerification;
  marketDataVerification: MarketDataVerification;
  reputationVerification: ReputationVerification;
  
  // Supporting Information
  verificationSources: VerificationSource[];
  crossReferences: CrossReference[];
  warnings: VeracityWarning[];
  redFlags: VeracityRedFlag[];
  
  // Summary and Recommendations
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  
  // Metadata
  processingTime: number;
  sourcesChecked: number;
  lastVerified: Date;
  nextRecommendedCheck?: Date;
}

export interface ExistenceVerification {
  exists: boolean;
  confidence: number;
  verificationMethods: ExistenceVerificationMethod[];
  officialSources: OfficialSource[];
  registrationDetails?: RegistrationDetails;
  operationalStatus: OperationalStatus;
  historicalExistence: HistoricalExistence;
}

export interface ExistenceVerificationMethod {
  method: 'registry_lookup' | 'api_verification' | 'web_scraping' | 'database_check' | 'manual_verification';
  result: boolean;
  confidence: number;
  source: string;
  timestamp: Date;
  details?: string;
}

export interface OfficialSource {
  name: string;
  type: 'government' | 'regulatory' | 'exchange' | 'registry' | 'industry_body';
  url?: string;
  status: 'active' | 'delisted' | 'suspended' | 'unknown';
  verificationDate: Date;
  registrationNumber?: string;
  jurisdiction: string;
}

export interface RegistrationDetails {
  registrationNumber: string;
  registrationDate: Date;
  registrationAuthority: string;
  jurisdiction: string;
  legalName: string;
  status: 'active' | 'inactive' | 'dissolved' | 'suspended';
  lastUpdated: Date;
}

export interface OperationalStatus {
  isOperational: boolean;
  operatingFor: number; // days
  businessHours?: string;
  contactVerified: boolean;
  websiteActive: boolean;
  socialMediaActive: boolean;
  lastActivity?: Date;
}

export interface HistoricalExistence {
  firstKnownDate: Date;
  significantEvents: SignificantEvent[];
  nameChanges: NameChange[];
  statusChanges: StatusChange[];
  continuityVerified: boolean;
}

export interface SignificantEvent {
  date: Date;
  event: string;
  source: string;
  impact: 'positive' | 'negative' | 'neutral';
  verified: boolean;
}

export interface NameChange {
  previousName: string;
  newName: string;
  changeDate: Date;
  authority: string;
  reason?: string;
}

export interface StatusChange {
  previousStatus: string;
  newStatus: string;
  changeDate: Date;
  authority: string;
  reason?: string;
}

export interface RegulatoryVerification {
  isCompliant: boolean;
  compliance: ComplianceStatus[];
  licenses: LicenseInfo[];
  violations: RegulatoryViolation[];
  sanctions: SanctionInfo[];
  investigations: InvestigationInfo[];
  regulatoryHistory: RegulatoryEvent[];
}

export interface ComplianceStatus {
  regulation: string;
  jurisdiction: string;
  status: 'compliant' | 'non_compliant' | 'under_review' | 'unknown';
  lastChecked: Date;
  authority: string;
  details?: string;
}

export interface LicenseInfo {
  licenseType: string;
  licenseNumber: string;
  issuedBy: string;
  issueDate: Date;
  expirationDate?: Date;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  jurisdiction: string;
  restrictions?: string[];
}

export interface RegulatoryViolation {
  violationType: string;
  authority: string;
  violationDate: Date;
  description: string;
  penalty?: string;
  penaltyAmount?: number;
  resolution?: string;
  resolutionDate?: Date;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
}

export interface SanctionInfo {
  sanctionType: string;
  authority: string;
  sanctionDate: Date;
  description: string;
  jurisdiction: string;
  status: 'active' | 'lifted' | 'modified';
  expirationDate?: Date;
  reason: string;
}

export interface InvestigationInfo {
  investigationType: string;
  authority: string;
  startDate: Date;
  status: 'ongoing' | 'closed' | 'suspended';
  description: string;
  outcome?: string;
  publicDisclosure: boolean;
}

export interface RegulatoryEvent {
  date: Date;
  event: string;
  authority: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  publicRecord: boolean;
}

export interface LawEnforcementVerification {
  hasLawEnforcementIssues: boolean;
  criminalInvestigations: CriminalInvestigation[];
  civilActions: CivilAction[];
  fraudAlerts: FraudAlert[];
  scamReports: ScamReport[];
  watchlistEntries: WatchlistEntry[];
  lawEnforcementSources: LawEnforcementSource[];
}

export interface CriminalInvestigation {
  caseNumber?: string;
  agency: string;
  investigationType: string;
  status: 'ongoing' | 'closed' | 'suspended';
  charges?: string[];
  jurisdiction: string;
  publicRecord: boolean;
  startDate?: Date;
  description: string;
}

export interface CivilAction {
  caseNumber?: string;
  court: string;
  actionType: string;
  status: 'pending' | 'settled' | 'dismissed' | 'judgment';
  plaintiffs: string[];
  allegations: string[];
  amount?: number;
  filingDate: Date;
  publicRecord: boolean;
}

export interface FraudAlert {
  alertId: string;
  source: string;
  alertDate: Date;
  alertType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  relatedCases?: string[];
}

export interface ScamReport {
  reportId: string;
  source: string;
  reportDate: Date;
  scamType: string;
  description: string;
  victimCount?: number;
  estimatedLoss?: number;
  verified: boolean;
  followUpActions?: string[];
}

export interface WatchlistEntry {
  watchlistName: string;
  authority: string;
  addedDate: Date;
  reason: string;
  category: string;
  severity: 'informational' | 'caution' | 'warning' | 'danger';
  expirationDate?: Date;
  publicDisclosure: boolean;
}

export interface LawEnforcementSource {
  agency: string;
  database: string;
  jurisdiction: string;
  lastChecked: Date;
  accessLevel: 'public' | 'restricted' | 'classified';
  recordsFound: number;
  reliability: number;
}

export interface MarketDataVerification {
  hasMarketData: boolean;
  tradingActivity: TradingActivityVerification;
  priceData: PriceDataVerification;
  volumeData: VolumeDataVerification;
  marketCapVerification: MarketCapVerification;
  exchangeListings: ExchangeListing[];
  marketAnomalies: MarketAnomaly[];
}

export interface TradingActivityVerification {
  isActivelyTraded: boolean;
  averageDailyVolume: number;
  lastTradeDate: Date;
  tradingVenues: number;
  liquidityScore: number;
  tradingPatternAnalysis: TradingPatternAnalysis;
}

export interface TradingPatternAnalysis {
  isNormal: boolean;
  suspiciousPatterns: string[];
  manipulationIndicators: string[];
  volumeAnomalies: number;
  priceAnomalies: number;
}

export interface PriceDataVerification {
  hasPriceData: boolean;
  currentPrice?: number;
  priceSource: string[];
  priceConsistency: number;
  lastPriceUpdate: Date;
  priceDiscrepancies: PriceDiscrepancy[];
}

export interface PriceDiscrepancy {
  source1: string;
  source2: string;
  price1: number;
  price2: number;
  discrepancyPercent: number;
  timestamp: Date;
}

export interface VolumeDataVerification {
  hasVolumeData: boolean;
  averageVolume: number;
  volumeSource: string[];
  volumeConsistency: number;
  volumeSpikes: VolumeSpike[];
}

export interface VolumeSpike {
  date: Date;
  volume: number;
  percentageIncrease: number;
  explanation?: string;
  verified: boolean;
}

export interface MarketCapVerification {
  hasMarketCap: boolean;
  marketCap?: number;
  marketCapSource: string[];
  fullyDilutedCap?: number;
  capConsistency: number;
  capCategory: 'micro' | 'small' | 'mid' | 'large' | 'mega';
}

export interface ExchangeListing {
  exchange: string;
  symbol: string;
  listingDate: Date;
  listingStatus: 'active' | 'delisted' | 'suspended';
  volume24h?: number;
  lastVerified: Date;
  tier: 'tier1' | 'tier2' | 'tier3' | 'unknown';
}

export interface MarketAnomaly {
  anomalyType: string;
  description: string;
  detectedDate: Date;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  explanation?: string;
}

export interface ReputationVerification {
  overallReputation: number;
  reputationSources: ReputationSource[];
  newsAnalysis: NewsAnalysis;
  socialMediaAnalysis: SocialMediaAnalysis;
  expertOpinions: ExpertOpinion[];
  communityFeedback: CommunityFeedback[];
  reputationTrends: ReputationTrend[];
}

export interface ReputationSource {
  source: string;
  rating?: number;
  review?: string;
  date: Date;
  credibility: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface NewsAnalysis {
  totalArticles: number;
  sentimentScore: number;
  positiveArticles: number;
  neutralArticles: number;
  negativeArticles: number;
  recentTrend: 'improving' | 'stable' | 'declining';
  keyTopics: string[];
  credibleSources: number;
}

export interface SocialMediaAnalysis {
  platforms: SocialPlatformAnalysis[];
  overallSentiment: number;
  mentionCount: number;
  influencerMentions: number;
  suspiciousActivity: boolean;
  botActivity: number;
}

export interface SocialPlatformAnalysis {
  platform: string;
  followers?: number;
  engagement: number;
  sentiment: number;
  lastActive: Date;
  verified: boolean;
  suspiciousActivity: boolean;
}

export interface ExpertOpinion {
  expert: string;
  organization?: string;
  opinion: string;
  rating?: number;
  date: Date;
  credibility: number;
  expertise: string[];
}

export interface CommunityFeedback {
  platform: string;
  feedbackType: 'review' | 'rating' | 'comment';
  rating?: number;
  feedback: string;
  date: Date;
  verified: boolean;
  helpful: number;
}

export interface ReputationTrend {
  period: string;
  trend: 'improving' | 'stable' | 'declining';
  score: number;
  factors: string[];
  significance: 'minor' | 'moderate' | 'major';
}

export interface VerificationSource {
  name: string;
  type: SourceType;
  url?: string;
  reliability: number;
  lastChecked: Date;
  status: 'verified' | 'unverified' | 'error' | 'timeout';
  dataQuality: number;
  responseTime: number;
}

export interface CrossReference {
  referenceType: string;
  source: string;
  target: string;
  matchStrength: number;
  verified: boolean;
  conflicting: boolean;
  details: string;
}

export interface VeracityWarning {
  warningType: WarningType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface VeracityRedFlag {
  flagType: RedFlagType;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  evidence: string[];
  implications: string[];
  actionRequired: string;
  verificationStatus: boolean;
}

// Enums

export enum VeracityCheckType {
  STOCK_VERIFICATION = 'STOCK_VERIFICATION',
  CRYPTO_VERIFICATION = 'CRYPTO_VERIFICATION',
  COMPANY_VERIFICATION = 'COMPANY_VERIFICATION',
  INVESTMENT_VERIFICATION = 'INVESTMENT_VERIFICATION',
  PLATFORM_VERIFICATION = 'PLATFORM_VERIFICATION',
  COMPREHENSIVE_VERIFICATION = 'COMPREHENSIVE_VERIFICATION'
}

export enum TargetType {
  STOCK_SYMBOL = 'STOCK_SYMBOL',
  CRYPTO_SYMBOL = 'CRYPTO_SYMBOL',
  CRYPTO_CONTRACT = 'CRYPTO_CONTRACT',
  COMPANY_NAME = 'COMPANY_NAME',
  TRADING_PLATFORM = 'TRADING_PLATFORM',
  INVESTMENT_FUND = 'INVESTMENT_FUND',
  FINANCIAL_PRODUCT = 'FINANCIAL_PRODUCT',
  WEBSITE_URL = 'WEBSITE_URL'
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  PARTIALLY_VERIFIED = 'PARTIALLY_VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  SUSPICIOUS = 'SUSPICIOUS',
  FRAUDULENT = 'FRAUDULENT',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum SourceType {
  GOVERNMENT = 'GOVERNMENT',
  REGULATORY = 'REGULATORY',
  EXCHANGE = 'EXCHANGE',
  NEWS = 'NEWS',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  LAW_ENFORCEMENT = 'LAW_ENFORCEMENT',
  INDUSTRY = 'INDUSTRY',
  THIRD_PARTY = 'THIRD_PARTY',
  BLOCKCHAIN = 'BLOCKCHAIN'
}

export enum WarningType {
  REGULATORY_ISSUES = 'REGULATORY_ISSUES',
  LAW_ENFORCEMENT_CONCERNS = 'LAW_ENFORCEMENT_CONCERNS',
  MARKET_ANOMALIES = 'MARKET_ANOMALIES',
  REPUTATION_CONCERNS = 'REPUTATION_CONCERNS',
  DATA_INCONSISTENCIES = 'DATA_INCONSISTENCIES',
  OPERATIONAL_ISSUES = 'OPERATIONAL_ISSUES',
  COMPLIANCE_GAPS = 'COMPLIANCE_GAPS'
}

export enum RedFlagType {
  FAKE_REGISTRATION = 'FAKE_REGISTRATION',
  CRIMINAL_ASSOCIATIONS = 'CRIMINAL_ASSOCIATIONS',
  REGULATORY_VIOLATIONS = 'REGULATORY_VIOLATIONS',
  MARKET_MANIPULATION = 'MARKET_MANIPULATION',
  PONZI_INDICATORS = 'PONZI_INDICATORS',
  MONEY_LAUNDERING = 'MONEY_LAUNDERING',
  SANCTIONS_VIOLATIONS = 'SANCTIONS_VIOLATIONS',
  FRAUDULENT_CLAIMS = 'FRAUDULENT_CLAIMS',
  UNLICENSED_OPERATIONS = 'UNLICENSED_OPERATIONS',
  SUSPICIOUS_PATTERNS = 'SUSPICIOUS_PATTERNS'
}

export interface VeracityCheckingConfig {
  enableRealTimeChecks: boolean;
  thoroughnessDefault: 'basic' | 'standard' | 'comprehensive' | 'forensic';
  cacheTimeoutHours: number;
  maxSourcesPerCheck: number;
  apiTimeoutMs: number;
  retryAttempts: number;
  lawEnforcementAccess: boolean;
  regulatoryDatabaseAccess: boolean;
  apiKeys: {
    sec?: string;
    finra?: string;
    fbi?: string;
    interpol?: string;
    coinGecko?: string;
    alphavantage?: string;
    polygon?: string;
    newsapi?: string;
    clearbit?: string;
    crunchbase?: string;
  };
}

export interface VeracityCheckingStats {
  totalChecks: number;
  verifiedEntities: number;
  suspiciousEntities: number;
  fraudulentEntities: number;
  averageProcessingTime: number;
  sourcesIntegrated: number;
  accuracyRate: number;
  falsePositiveRate: number;
  lawEnforcementReports: number;
  regulatoryReports: number;
  topWarningTypes: Record<string, number>;
  topRedFlagTypes: Record<string, number>;
}