export interface TradingAnalysisRequest {
  analysisType: TradingAnalysisType;
  tradingData: TradingData;
  timeframe: TimeframeOptions;
  options?: TradingAnalysisOptions;
}

export interface TradingData {
  symbol: string;
  platform: TradingPlatform;
  transactions: Transaction[];
  priceHistory: PricePoint[];
  volumeData: VolumePoint[];
  orderBookData?: OrderBookSnapshot[];
  socialMetrics?: SocialMetric[];
  marketCapData?: MarketCapPoint[];
}

export interface Transaction {
  id: string;
  timestamp: Date;
  type: TransactionType;
  symbol: string;
  quantity: number;
  price: number;
  value: number;
  fee?: number;
  wallet?: string;
  exchange?: string;
  tradeId?: string;
  metadata?: TransactionMetadata;
}

export interface TransactionMetadata {
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  sessionId?: string;
  referrer?: string;
}

export interface PricePoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  marketCap?: number;
}

export interface VolumePoint {
  timestamp: Date;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  uniqueTraders: number;
  largeOrderCount: number;
}

export interface OrderBookSnapshot {
  timestamp: Date;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  depth: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface SocialMetric {
  timestamp: Date;
  platform: string;
  mentions: number;
  sentiment: number; // -1 to 1
  reach: number;
  engagement: number;
  influencerMentions: number;
}

export interface MarketCapPoint {
  timestamp: Date;
  marketCap: number;
  fullyDilutedCap: number;
  circulatingSupply: number;
  totalSupply: number;
}

export interface TimeframeOptions {
  start: Date;
  end: Date;
  granularity: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  timezone?: string;
}

export interface TradingAnalysisOptions {
  enableAIDetection: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'maximum';
  includeMarketContext: boolean;
  analyzeSocialSignals: boolean;
  checkRegulatory: boolean;
  crossReferenceKnownScams: boolean;
  realTimeMonitoring: boolean;
  generateAlerts: boolean;
}

export interface TradingAnalysisResult {
  id: string;
  analysisType: TradingAnalysisType;
  symbol: string;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  
  // Core Analysis Results
  pumpDumpDetection: PumpDumpAnalysis;
  washTradingDetection: WashTradingAnalysis;
  frontRunningDetection: FrontRunningAnalysis;
  coordinatedManipulation: CoordinatedManipulationAnalysis;
  insiderTradingDetection: InsiderTradingAnalysis;
  
  // Market Analysis
  marketAnomalies: MarketAnomaly[];
  volumeAnalysis: VolumeAnalysis;
  priceMovementAnalysis: PriceMovementAnalysis;
  liquidityAnalysis: LiquidityAnalysis;
  
  // AI-Powered Detection
  aiPredictions: AIPrediction[];
  patternRecognition: PatternRecognitionResult[];
  behaviorProfiling: BehaviorProfile[];
  
  // Risk Factors
  riskFactors: RiskFactor[];
  suspiciousActivities: SuspiciousActivity[];
  regulatoryFlags: RegulatoryFlag[];
  
  // Summary and Recommendations
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  alertLevel: AlertLevel;
  
  // Metadata
  processingTime: number;
  dataPointsAnalyzed: number;
  lastAnalyzed: Date;
  nextRecommendedAnalysis?: Date;
}

export interface PumpDumpAnalysis {
  isPumpDump: boolean;
  confidence: number;
  pumpPhase?: PumpDumpPhase;
  priceIncrease: number;
  volumeSpike: number;
  timeToDisposal?: number; // minutes
  suspiciousAccounts: SuspiciousAccount[];
  coordinationIndicators: string[];
  historicalPatterns: HistoricalPattern[];
}

export interface WashTradingAnalysis {
  isWashTrading: boolean;
  confidence: number;
  suspiciousWallets: string[];
  circularTradingPatterns: CircularPattern[];
  artificialVolumeEstimate: number;
  timePatterns: string[];
  priceStabilityIndicators: number[];
}

export interface FrontRunningAnalysis {
  isFrontRunning: boolean;
  confidence: number;
  suspectedFrontRunners: FrontRunnerProfile[];
  victimTransactions: string[];
  profitGenerated: number;
  executionDelayPatterns: ExecutionPattern[];
  mempoolAnalysis?: MempoolAnalysis;
}

export interface CoordinatedManipulationAnalysis {
  isCoordinated: boolean;
  confidence: number;
  participantGroups: ParticipantGroup[];
  coordinationMethods: CoordinationMethod[];
  timelineAnalysis: TimelineEvent[];
  communicationChannels: CommunicationChannel[];
  manipulationTactics: ManipulationTactic[];
}

export interface InsiderTradingAnalysis {
  isInsiderTrading: boolean;
  confidence: number;
  suspiciousAccounts: InsiderAccount[];
  informationEvents: InformationEvent[];
  tradingPatterns: InsiderTradingPattern[];
  profitAnalysis: ProfitAnalysis;
  relationshipMapping: RelationshipMap[];
}

export interface MarketAnomaly {
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  duration?: number;
  impact: number;
  affectedMetrics: string[];
  evidence: string[];
}

export interface VolumeAnalysis {
  averageVolume: number;
  volumeSpikes: VolumeSpike[];
  volumeDistribution: VolumeDistribution;
  artificialVolumePercentage: number;
  volumeVelocity: number;
  unusualPatterns: VolumePatter[];
}

export interface PriceMovementAnalysis {
  volatility: number;
  abnormalMoves: PriceMove[];
  supportResistanceLevels: PriceLevel[];
  momentumIndicators: MomentumIndicator[];
  technicalIndicators: TechnicalIndicator[];
  priceManipulationScore: number;
}

export interface LiquidityAnalysis {
  liquidityScore: number;
  spreadAnalysis: SpreadAnalysis;
  marketDepth: MarketDepth;
  liquidityProviders: LiquidityProvider[];
  liquidityEvents: LiquidityEvent[];
  slippageAnalysis: SlippageAnalysis;
}

export interface AIPrediction {
  predictionType: PredictionType;
  confidence: number;
  timeHorizon: string;
  prediction: string;
  factors: PredictionFactor[];
  accuracy: number; // Historical accuracy of this prediction type
  riskAssessment: string;
}

export interface PatternRecognitionResult {
  patternType: PatternType;
  matches: PatternMatch[];
  confidence: number;
  historicalOutcomes: HistoricalOutcome[];
  riskImplication: string;
  actionRecommendation: string;
}

export interface BehaviorProfile {
  accountId: string;
  behaviorType: BehaviorType;
  riskScore: number;
  characteristics: string[];
  tradingPatterns: TradingPattern[];
  suspiciousActivities: number;
  profileAccuracy: number;
}

export interface RiskFactor {
  type: RiskFactorType;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  mitigation: string[];
  probability: number;
  timeframe: string;
}

export interface SuspiciousActivity {
  type: SuspiciousActivityType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  involvedAccounts: string[];
  evidence: ActivityEvidence[];
  regulatoryImplications: string[];
}

export interface RegulatoryFlag {
  regulation: RegulationType;
  jurisdiction: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  potentialViolation: string;
  requiredActions: string[];
  reportingRequirements: string[];
}

// Supporting interfaces

export interface SuspiciousAccount {
  accountId: string;
  walletAddress?: string;
  riskScore: number;
  suspiciousActivities: string[];
  firstSeen: Date;
  lastActive: Date;
  transactionCount: number;
  totalVolume: number;
}

export interface HistoricalPattern {
  patternType: string;
  occurrence: Date;
  similarity: number;
  outcome: string;
  duration: number;
  profitLoss: number;
}

export interface CircularPattern {
  accounts: string[];
  transactionChain: string[];
  volume: number;
  timeframe: string;
  frequency: number;
  purposeAnalysis: string;
}

export interface FrontRunnerProfile {
  accountId: string;
  accuracy: number;
  profitability: number;
  executionSpeed: number;
  frontRunningEvents: number;
  averageProfit: number;
}

export interface ExecutionPattern {
  victimTxHash: string;
  frontRunTxHash: string;
  delayMs: number;
  gasPrice: number;
  profitAmount: number;
  blockPosition: number;
}

export interface MempoolAnalysis {
  pendingTransactions: number;
  gasPriceDistribution: number[];
  frontRunningOpportunities: number;
  mevBotActivity: number;
}

export interface ParticipantGroup {
  groupId: string;
  participants: string[];
  coordinationStrength: number;
  activities: string[];
  communicationMethods: string[];
  effectivenessScore: number;
}

export interface CoordinationMethod {
  type: 'telegram' | 'discord' | 'twitter' | 'signal' | 'other';
  evidence: string[];
  participantCount: number;
  activityLevel: number;
}

export interface TimelineEvent {
  timestamp: Date;
  event: string;
  participants: string[];
  impact: number;
  evidence: string[];
}

export interface CommunicationChannel {
  platform: string;
  channelId: string;
  participants: number;
  messageCount: number;
  coordinationScore: number;
}

export interface ManipulationTactic {
  tactic: string;
  effectiveness: number;
  frequency: number;
  participants: string[];
  impact: string;
}

export interface InsiderAccount {
  accountId: string;
  relationshipType: string;
  accessLevel: string;
  tradingAdvantage: number;
  suspiciousTradeCount: number;
  profitFromInformation: number;
}

export interface InformationEvent {
  eventType: string;
  timestamp: Date;
  publicAnnouncementTime?: Date;
  informationValue: string;
  marketImpact: number;
  tradingWindowPre: number;
}

export interface InsiderTradingPattern {
  patternType: string;
  frequency: number;
  successRate: number;
  averageProfit: number;
  timeBeforeAnnouncement: number;
}

export interface ProfitAnalysis {
  totalProfit: number;
  averageProfitPerTrade: number;
  informationPremium: number;
  abnormalReturns: number;
  riskAdjustedReturns: number;
}

export interface RelationshipMap {
  account: string;
  relationshipType: string;
  strength: number;
  informationAccess: string[];
  verificationStatus: string;
}

export interface VolumeSpike {
  timestamp: Date;
  volumeIncrease: number;
  duration: number;
  trigger?: string;
  authenticity: number;
}

export interface VolumeDistribution {
  buyVolume: number;
  sellVolume: number;
  neutralVolume: number;
  largeOrderPercentage: number;
  retailPercentage: number;
  institutionalPercentage: number;
}

export interface VolumePatter {
  patternType: string;
  frequency: number;
  authenticity: number;
  description: string;
}

export interface PriceMove {
  timestamp: Date;
  magnitude: number;
  direction: 'up' | 'down';
  duration: number;
  volume: number;
  catalyst?: string;
  suspiciousness: number;
}

export interface PriceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
  testCount: number;
  lastTest: Date;
}

export interface MomentumIndicator {
  indicator: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  timeframe: string;
}

export interface TechnicalIndicator {
  indicator: string;
  value: number;
  interpretation: string;
  timeframe: string;
  reliability: number;
}

export interface SpreadAnalysis {
  averageSpread: number;
  spreadVolatility: number;
  wideSpreads: number;
  spreadManipulation: number;
  impactOnTrading: string;
}

export interface MarketDepth {
  bidDepth: number;
  askDepth: number;
  totalDepth: number;
  imbalance: number;
  qualityScore: number;
}

export interface LiquidityProvider {
  providerId: string;
  liquidityProvided: number;
  marketShare: number;
  consistency: number;
  quality: number;
}

export interface LiquidityEvent {
  eventType: 'withdrawal' | 'addition' | 'manipulation';
  timestamp: Date;
  impact: number;
  duration: number;
  cause?: string;
}

export interface SlippageAnalysis {
  averageSlippage: number;
  slippageDistribution: number[];
  highSlippageEvents: number;
  slippageManipulation: number;
}

export interface PredictionFactor {
  factor: string;
  weight: number;
  confidence: number;
  description: string;
}

export interface PatternMatch {
  timestamp: Date;
  confidence: number;
  description: string;
  historicalOutcome: string;
  riskLevel: RiskLevel;
}

export interface HistoricalOutcome {
  pattern: string;
  outcomes: {
    outcome: string;
    frequency: number;
    averageReturn: number;
    riskLevel: RiskLevel;
  }[];
}

export interface TradingPattern {
  patternType: string;
  frequency: number;
  profitability: number;
  riskLevel: RiskLevel;
  description: string;
}

export interface ActivityEvidence {
  type: string;
  timestamp: Date;
  description: string;
  severity: number;
  verifiable: boolean;
}

// Enums

export enum TradingAnalysisType {
  COMPREHENSIVE = 'COMPREHENSIVE',
  PUMP_DUMP_DETECTION = 'PUMP_DUMP_DETECTION',
  WASH_TRADING = 'WASH_TRADING',
  FRONT_RUNNING = 'FRONT_RUNNING',
  INSIDER_TRADING = 'INSIDER_TRADING',
  MARKET_MANIPULATION = 'MARKET_MANIPULATION',
  REGULATORY_COMPLIANCE = 'REGULATORY_COMPLIANCE'
}

export enum TradingPlatform {
  BINANCE = 'BINANCE',
  COINBASE = 'COINBASE',
  KRAKEN = 'KRAKEN',
  UNISWAP = 'UNISWAP',
  PANCAKESWAP = 'PANCAKESWAP',
  ETHEREUM = 'ETHEREUM',
  BITCOIN = 'BITCOIN',
  OTHER = 'OTHER'
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  TRANSFER = 'TRANSFER',
  SWAP = 'SWAP',
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  LIQUIDITY_ADD = 'LIQUIDITY_ADD',
  LIQUIDITY_REMOVE = 'LIQUIDITY_REMOVE'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum PumpDumpPhase {
  ACCUMULATION = 'ACCUMULATION',
  PUMP = 'PUMP',
  DISTRIBUTION = 'DISTRIBUTION',
  DUMP = 'DUMP',
  AFTERMATH = 'AFTERMATH'
}

export enum AnomalyType {
  VOLUME_SPIKE = 'VOLUME_SPIKE',
  PRICE_MANIPULATION = 'PRICE_MANIPULATION',
  LIQUIDITY_WITHDRAWAL = 'LIQUIDITY_WITHDRAWAL',
  ORDER_BOOK_SPOOFING = 'ORDER_BOOK_SPOOFING',
  WASH_TRADING = 'WASH_TRADING',
  FRONT_RUNNING = 'FRONT_RUNNING',
  MARKET_CORNER = 'MARKET_CORNER'
}

export enum PredictionType {
  PUMP_DUMP_LIKELIHOOD = 'PUMP_DUMP_LIKELIHOOD',
  PRICE_MOVEMENT = 'PRICE_MOVEMENT',
  VOLUME_PREDICTION = 'VOLUME_PREDICTION',
  MANIPULATION_RISK = 'MANIPULATION_RISK',
  LIQUIDITY_CRISIS = 'LIQUIDITY_CRISIS',
  REGULATORY_ACTION = 'REGULATORY_ACTION'
}

export enum PatternType {
  PUMP_DUMP = 'PUMP_DUMP',
  ACCUMULATION = 'ACCUMULATION',
  DISTRIBUTION = 'DISTRIBUTION',
  BREAKOUT = 'BREAKOUT',
  REVERSAL = 'REVERSAL',
  CONTINUATION = 'CONTINUATION',
  MANIPULATION = 'MANIPULATION'
}

export enum BehaviorType {
  RETAIL_TRADER = 'RETAIL_TRADER',
  INSTITUTIONAL = 'INSTITUTIONAL',
  BOT_TRADING = 'BOT_TRADING',
  MARKET_MAKER = 'MARKET_MAKER',
  MANIPULATOR = 'MANIPULATOR',
  INSIDER = 'INSIDER',
  WHALE = 'WHALE'
}

export enum RiskFactorType {
  REGULATORY = 'REGULATORY',
  TECHNICAL = 'TECHNICAL',
  MARKET = 'MARKET',
  LIQUIDITY = 'LIQUIDITY',
  MANIPULATION = 'MANIPULATION',
  OPERATIONAL = 'OPERATIONAL',
  REPUTATIONAL = 'REPUTATIONAL'
}

export enum SuspiciousActivityType {
  COORDINATED_TRADING = 'COORDINATED_TRADING',
  UNUSUAL_VOLUME = 'UNUSUAL_VOLUME',
  PRICE_MANIPULATION = 'PRICE_MANIPULATION',
  WASH_TRADING = 'WASH_TRADING',
  SPOOFING = 'SPOOFING',
  LAYERING = 'LAYERING',
  MOMENTUM_IGNITION = 'MOMENTUM_IGNITION',
  CROSS_MARKET_MANIPULATION = 'CROSS_MARKET_MANIPULATION'
}

export enum RegulationType {
  SEC = 'SEC',
  CFTC = 'CFTC',
  FINRA = 'FINRA',
  FCA = 'FCA',
  ESMA = 'ESMA',
  MAS = 'MAS',
  OTHER = 'OTHER'
}

export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ALERT = 'ALERT',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY'
}

export interface TradingAnalysisConfig {
  aiModelsEnabled: boolean;
  realTimeProcessing: boolean;
  alertThresholds: {
    pumpDump: number;
    washTrading: number;
    frontRunning: number;
    insiderTrading: number;
    marketManipulation: number;
  };
  dataRetentionDays: number;
  apiKeys: {
    alphavantage?: string;
    coinbase?: string;
    binance?: string;
    etherscan?: string;
    moralis?: string;
  };
}

export interface TradingAnalysisStats {
  totalAnalyses: number;
  manipulationDetected: number;
  falsePositiveRate: number;
  accuracyRate: number;
  averageProcessingTime: number;
  topManipulationTypes: Record<string, number>;
  regulatoryReports: number;
  alertsGenerated: number;
}