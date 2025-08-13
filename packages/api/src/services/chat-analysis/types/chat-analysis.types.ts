export interface ChatAnalysisRequest {
  chatId?: string;
  messages: ChatMessage[];
  participants: ChatParticipant[];
  metadata?: ChatAnalysisMetadata;
  options?: ChatAnalysisOptions;
}

export interface ChatMessage {
  id: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  content: string;
  messageType: MessageType;
  edited?: boolean;
  deleted?: boolean;
  forwarded?: boolean;
  replyToId?: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  url: string;
  filename?: string;
  size?: number;
  metadata?: any;
}

export interface ChatParticipant {
  id: string;
  name: string;
  username?: string;
  phoneNumber?: string;
  role: ParticipantRole;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface ChatAnalysisMetadata {
  platform: ChatPlatform;
  chatType: 'individual' | 'group';
  totalMessages: number;
  dateRange: {
    from: Date;
    to: Date;
  };
  context?: string;
  reportedBy?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
}

export interface ChatAnalysisOptions {
  analyzeManipulation: boolean;
  detectEmotionalPatterns: boolean;
  extractEntities: boolean;
  checkConsistency: boolean;
  analyzeTiming: boolean;
  deepPsychologicalAnalysis: boolean;
  crossReferenceKnownScams: boolean;
}

export interface ChatAnalysisResult {
  id: string;
  chatId?: string;
  analysisType: ChatAnalysisType;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  
  // Core Analysis Results
  psychologicalManipulation: PsychologicalManipulationAnalysis;
  emotionalPatterns: EmotionalPatternAnalysis;
  entityAnalysis: EntityAnalysis;
  consistencyCheck: ConsistencyAnalysis;
  timingAnalysis: TimingAnalysis;
  
  // Scam-specific Analysis
  scamTypeDetection: ScamTypeDetection;
  redFlags: RedFlag[];
  trustIndicators: TrustIndicator[];
  
  // Summary and Recommendations
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  
  // Metadata
  processingTime: number;
  messagesAnalyzed: number;
  lastAnalyzed: Date;
}

export interface PsychologicalManipulationAnalysis {
  overallScore: number;
  techniques: ManipulationTechnique[];
  riskLevel: RiskLevel;
  evidence: ManipulationEvidence[];
  confidenceLevel: number;
}

export interface ManipulationTechnique {
  type: ManipulationTechniqueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  examples: string[];
  description: string;
  psychologicalImpact: string;
  counterMeasures: string[];
}

export interface ManipulationEvidence {
  messageId: string;
  timestamp: Date;
  content: string;
  technique: ManipulationTechniqueType;
  severity: number;
  context: string;
}

export interface EmotionalPatternAnalysis {
  overallEmotionalState: EmotionalState;
  emotionalProgression: EmotionalProgression[];
  manipulationVulnerabilities: VulnerabilityIndicator[];
  emotionalTriggers: EmotionalTrigger[];
  resilienceFactors: ResilienceFactor[];
}

export interface EmotionalProgression {
  phase: string;
  startTime: Date;
  endTime: Date;
  dominantEmotions: string[];
  manipulationTactics: string[];
  victimResponse: VictimResponse;
}

export interface VictimResponse {
  type: 'compliant' | 'resistant' | 'questioning' | 'eager' | 'skeptical';
  indicators: string[];
  riskLevel: RiskLevel;
}

export interface VulnerabilityIndicator {
  type: VulnerabilityType;
  strength: number;
  indicators: string[];
  riskImplication: string;
}

export interface EmotionalTrigger {
  trigger: string;
  frequency: number;
  effectiveness: number;
  examples: string[];
}

export interface ResilienceFactor {
  factor: string;
  strength: number;
  examples: string[];
}

export interface EntityAnalysis {
  financialEntities: FinancialEntity[];
  personalInfo: PersonalInfoEntity[];
  contacts: ContactEntity[];
  urls: URLEntity[];
  locations: LocationEntity[];
  cryptoAddresses: CryptoEntity[];
  suspiciousPatterns: SuspiciousPattern[];
}

export interface FinancialEntity {
  type: 'bank_account' | 'credit_card' | 'payment_app' | 'investment_platform';
  value: string;
  confidence: number;
  context: string;
  riskFlags: string[];
  verified: boolean;
}

export interface PersonalInfoEntity {
  type: 'name' | 'ssn' | 'dob' | 'address' | 'phone' | 'email';
  value: string;
  confidence: number;
  owner: 'sender' | 'recipient' | 'third_party';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContactEntity {
  type: 'phone' | 'email' | 'username' | 'social_media';
  value: string;
  confidence: number;
  owner: string;
  verificationStatus: 'verified' | 'suspicious' | 'unknown';
  associatedRisks: string[];
}

export interface URLEntity {
  url: string;
  domain: string;
  riskScore: number;
  category: 'legitimate' | 'suspicious' | 'malicious' | 'phishing' | 'unknown';
  analysis: URLAnalysis;
}

export interface URLAnalysis {
  domainAge: number;
  ssl: boolean;
  redirects: string[];
  suspiciousPatterns: string[];
  similarPhishingSites: string[];
  reputationSources: ReputationSource[];
}

export interface LocationEntity {
  type: 'address' | 'city' | 'country' | 'coordinates';
  value: string;
  confidence: number;
  riskFlags: string[];
}

export interface CryptoEntity {
  type: 'bitcoin' | 'ethereum' | 'other';
  address: string;
  confidence: number;
  transactionHistory?: CryptoTransaction[];
  riskFlags: string[];
}

export interface CryptoTransaction {
  amount: number;
  timestamp: Date;
  counterparty?: string;
  riskLevel: RiskLevel;
}

export interface SuspiciousPattern {
  pattern: string;
  frequency: number;
  riskLevel: RiskLevel;
  examples: string[];
  description: string;
}

export interface ConsistencyAnalysis {
  overallConsistency: number;
  inconsistencies: Inconsistency[];
  identityVerification: IdentityVerification;
  storyCoherence: StoryCoherence;
}

export interface Inconsistency {
  type: InconsistencyType;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  evidence: string[];
  implications: string[];
}

export interface IdentityVerification {
  nameConsistency: number;
  contactConsistency: number;
  locationConsistency: number;
  conflictingInfo: string[];
  verifiableDetails: string[];
}

export interface StoryCoherence {
  timelineConsistency: number;
  factualConsistency: number;
  emotionalConsistency: number;
  contradictions: string[];
  verifiableFacts: string[];
}

export interface TimingAnalysis {
  messagingPatterns: MessagingPattern[];
  urgencyTactics: UrgencyTactic[];
  responseTimeAnalysis: ResponseTimeAnalysis;
  suspiciousTiming: SuspiciousTiming[];
}

export interface MessagingPattern {
  type: 'normal' | 'burst' | 'delayed' | 'automated' | 'coordinated';
  timeWindows: TimeWindow[];
  frequency: number;
  riskImplication: string;
}

export interface TimeWindow {
  start: Date;
  end: Date;
  messageCount: number;
  averageInterval: number;
}

export interface UrgencyTactic {
  type: UrgencyTacticType;
  intensity: number;
  frequency: number;
  examples: string[];
  effectiveness: number;
}

export interface ResponseTimeAnalysis {
  averageResponseTime: number;
  responsePatterns: string[];
  suspiciouslyFastResponses: number;
  delayedCriticalResponses: number;
}

export interface SuspiciousTiming {
  type: string;
  description: string;
  riskLevel: RiskLevel;
  evidence: string[];
}

export interface ScamTypeDetection {
  primaryScamType: ScamType;
  confidence: number;
  secondaryTypes: ScamTypeMatch[];
  scamPhase: ScamPhase;
  progressionIndicators: string[];
}

export interface ScamTypeMatch {
  type: ScamType;
  confidence: number;
  indicators: string[];
}

export interface RedFlag {
  type: RedFlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  frequency: number;
  riskContribution: number;
}

export interface TrustIndicator {
  type: TrustIndicatorType;
  strength: number;
  description: string;
  evidence: string[];
  reliability: number;
}

export interface ReputationSource {
  name: string;
  score: number;
  lastChecked: Date;
  details: string;
}

// Enums

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  STICKER = 'STICKER',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
  SYSTEM = 'SYSTEM'
}

export enum ParticipantRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR', 
  MEMBER = 'MEMBER',
  BOT = 'BOT',
  UNKNOWN = 'UNKNOWN'
}

export enum ChatPlatform {
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
  INSTAGRAM = 'INSTAGRAM',
  SIGNAL = 'SIGNAL',
  IMESSAGE = 'IMESSAGE',
  OTHER = 'OTHER'
}

export enum ChatAnalysisType {
  BASIC = 'BASIC',
  DETAILED = 'DETAILED',
  FORENSIC = 'FORENSIC',
  PSYCHOLOGICAL = 'PSYCHOLOGICAL'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ManipulationTechniqueType {
  FEAR_MONGERING = 'FEAR_MONGERING',
  URGENCY_PRESSURE = 'URGENCY_PRESSURE',
  AUTHORITY_IMPERSONATION = 'AUTHORITY_IMPERSONATION',
  SOCIAL_PROOF = 'SOCIAL_PROOF',
  RECIPROCITY = 'RECIPROCITY',
  COMMITMENT_CONSISTENCY = 'COMMITMENT_CONSISTENCY',
  LIKING_SIMILARITY = 'LIKING_SIMILARITY',
  SCARCITY = 'SCARCITY',
  EMOTIONAL_MANIPULATION = 'EMOTIONAL_MANIPULATION',
  GASLIGHTING = 'GASLIGHTING',
  LOVE_BOMBING = 'LOVE_BOMBING',
  GROOMING = 'GROOMING',
  FALSE_INTIMACY = 'FALSE_INTIMACY',
  TRUST_EXPLOITATION = 'TRUST_EXPLOITATION',
  COGNITIVE_OVERLOAD = 'COGNITIVE_OVERLOAD'
}

export enum EmotionalState {
  VULNERABLE = 'VULNERABLE',
  ANXIOUS = 'ANXIOUS',
  EXCITED = 'EXCITED',
  CONFUSED = 'CONFUSED',
  TRUSTING = 'TRUSTING',
  SKEPTICAL = 'SKEPTICAL',
  RESISTANT = 'RESISTANT',
  COMPLIANT = 'COMPLIANT'
}

export enum VulnerabilityType {
  FINANCIAL_DESPERATION = 'FINANCIAL_DESPERATION',
  LONELINESS = 'LONELINESS',
  LACK_OF_TECH_KNOWLEDGE = 'LACK_OF_TECH_KNOWLEDGE',
  AUTHORITY_TRUST = 'AUTHORITY_TRUST',
  FEAR_OF_CONSEQUENCES = 'FEAR_OF_CONSEQUENCES',
  DESIRE_FOR_QUICK_GAINS = 'DESIRE_FOR_QUICK_GAINS',
  SOCIAL_ISOLATION = 'SOCIAL_ISOLATION',
  RECENT_LIFE_CHANGES = 'RECENT_LIFE_CHANGES'
}

export enum InconsistencyType {
  IDENTITY_MISMATCH = 'IDENTITY_MISMATCH',
  STORY_CONTRADICTION = 'STORY_CONTRADICTION',
  TIMELINE_ERROR = 'TIMELINE_ERROR',
  FACTUAL_INCONSISTENCY = 'FACTUAL_INCONSISTENCY',
  BEHAVIORAL_INCONSISTENCY = 'BEHAVIORAL_INCONSISTENCY',
  EMOTIONAL_INCONSISTENCY = 'EMOTIONAL_INCONSISTENCY'
}

export enum UrgencyTacticType {
  TIME_LIMITED_OFFER = 'TIME_LIMITED_OFFER',
  IMMEDIATE_ACTION_REQUIRED = 'IMMEDIATE_ACTION_REQUIRED',
  THREAT_OF_CONSEQUENCES = 'THREAT_OF_CONSEQUENCES',
  OPPORTUNITY_LOSS = 'OPPORTUNITY_LOSS',
  EMERGENCY_SITUATION = 'EMERGENCY_SITUATION',
  LIMITED_AVAILABILITY = 'LIMITED_AVAILABILITY'
}

export enum ScamType {
  INVESTMENT_FRAUD = 'INVESTMENT_FRAUD',
  ROMANCE_SCAM = 'ROMANCE_SCAM',
  PHISHING = 'PHISHING',
  TECH_SUPPORT = 'TECH_SUPPORT',
  ADVANCE_FEE = 'ADVANCE_FEE',
  FAKE_EMPLOYMENT = 'FAKE_EMPLOYMENT',
  LOTTERY_PRIZE = 'LOTTERY_PRIZE',
  CHARITY_FRAUD = 'CHARITY_FRAUD',
  IMPERSONATION = 'IMPERSONATION',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  SHOPPING_FRAUD = 'SHOPPING_FRAUD',
  IDENTITY_THEFT = 'IDENTITY_THEFT'
}

export enum ScamPhase {
  INITIAL_CONTACT = 'INITIAL_CONTACT',
  RELATIONSHIP_BUILDING = 'RELATIONSHIP_BUILDING',
  TRUST_ESTABLISHMENT = 'TRUST_ESTABLISHMENT',
  VULNERABILITY_EXPLOITATION = 'VULNERABILITY_EXPLOITATION',
  FINANCIAL_REQUEST = 'FINANCIAL_REQUEST',
  PERSISTENCE_PRESSURE = 'PERSISTENCE_PRESSURE',
  EXTRACTION = 'EXTRACTION',
  AFTERMATH = 'AFTERMATH'
}

export enum RedFlagType {
  FINANCIAL_REQUEST = 'FINANCIAL_REQUEST',
  PERSONAL_INFO_REQUEST = 'PERSONAL_INFO_REQUEST',
  URGENT_ACTION_DEMAND = 'URGENT_ACTION_DEMAND',
  INCONSISTENT_STORY = 'INCONSISTENT_STORY',
  EMOTIONAL_MANIPULATION = 'EMOTIONAL_MANIPULATION',
  AVOIDANCE_OF_VERIFICATION = 'AVOIDANCE_OF_VERIFICATION',
  SUSPICIOUS_LINKS = 'SUSPICIOUS_LINKS',
  PREMATURE_INTIMACY = 'PREMATURE_INTIMACY',
  REFUSAL_TO_MEET = 'REFUSAL_TO_MEET',
  GRAMMAR_ERRORS = 'GRAMMAR_ERRORS',
  GENERIC_RESPONSES = 'GENERIC_RESPONSES',
  MULTIPLE_IDENTITIES = 'MULTIPLE_IDENTITIES'
}

export enum TrustIndicatorType {
  CONSISTENT_IDENTITY = 'CONSISTENT_IDENTITY',
  VERIFIABLE_INFORMATION = 'VERIFIABLE_INFORMATION',
  REASONABLE_REQUESTS = 'REASONABLE_REQUESTS',
  PATIENT_COMMUNICATION = 'PATIENT_COMMUNICATION',
  RESPECT_FOR_BOUNDARIES = 'RESPECT_FOR_BOUNDARIES',
  TRANSPARENT_INTENTIONS = 'TRANSPARENT_INTENTIONS',
  LEGITIMATE_CONTACT_INFO = 'LEGITIMATE_CONTACT_INFO'
}

export interface ChatAnalysisConfig {
  enableDeepLearning: boolean;
  psychologicalAnalysisDepth: 'basic' | 'intermediate' | 'advanced';
  entityExtractionSensitivity: number;
  manipulationDetectionThreshold: number;
  consistencyCheckStrength: number;
  timingAnalysisEnabled: boolean;
  crossReferenceEnabled: boolean;
  realTimeAnalysis: boolean;
  languageSupport: string[];
}

export interface ChatAnalysisStats {
  totalAnalyses: number;
  scamsDetected: number;
  accuracyRate: number;
  averageProcessingTime: number;
  manipulationTechniquesFound: Record<ManipulationTechniqueType, number>;
  scamTypesDetected: Record<ScamType, number>;
  falsePositiveRate: number;
  falseNegativeRate: number;
}