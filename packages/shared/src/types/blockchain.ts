import { BaseEntity, RiskScore, ContactInfo } from './common';

export type BlockchainNetwork = 
  | 'ethereum'
  | 'bitcoin'
  | 'binance_smart_chain'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'avalanche'
  | 'fantom'
  | 'solana'
  | 'cardano'
  | 'polkadot';

export interface BlockchainAnalysis {
  network: BlockchainNetwork;
  address: string;
  addressType: 'wallet' | 'contract' | 'exchange' | 'mixer' | 'unknown';
  riskScore: RiskScore;
  reputation: AddressReputation;
  tokenAnalysis?: TokenAnalysis;
  contractAnalysis?: ContractAnalysis;
  transactionAnalysis: TransactionAnalysis;
  associations: AddressAssociation[];
  flags: AddressFlag[];
  lastUpdated: Date;
}

export interface AddressReputation {
  trustScore: number; // 0-100
  isExchange: boolean;
  isKnownService: boolean;
  isMalicious: boolean;
  isSanctioned: boolean;
  labels: string[];
  sources: ReputationSource[];
}

export interface ReputationSource {
  name: string;
  score: number;
  labels: string[];
  lastUpdated: Date;
  url?: string;
}

export interface TokenAnalysis {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  isVerified: boolean;
  riskFactors: TokenRiskFactor[];
  liquidityAnalysis: LiquidityAnalysis;
  ownershipAnalysis: OwnershipAnalysis;
  tradingAnalysis: TradingAnalysis;
}

export interface TokenRiskFactor {
  type: 'honeypot' | 'high_tax' | 'mint_function' | 'pause_function' | 'blacklist_function' | 'proxy_contract' | 'unverified_contract';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: any;
}

export interface LiquidityAnalysis {
  totalLiquidity: string;
  liquidityPools: LiquidityPool[];
  liquidityScore: number; // 0-100
  isLiquidityLocked: boolean;
  lockUntil?: Date;
}

export interface LiquidityPool {
  exchange: string;
  pair: string;
  liquidity: string;
  volume24h: string;
  priceImpact: number;
}

export interface OwnershipAnalysis {
  ownerAddress?: string;
  isRenounced: boolean;
  topHolders: TokenHolder[];
  concentrationRisk: number; // 0-100
  distributionScore: number; // 0-100
}

export interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
  isContract: boolean;
  labels?: string[];
}

export interface TradingAnalysis {
  volume24h: string;
  transactions24h: number;
  uniqueTraders24h: number;
  priceChange24h: number;
  marketCap?: string;
  holders: number;
  suspiciousActivity: SuspiciousActivity[];
}

export interface SuspiciousActivity {
  type: 'flash_loan_attack' | 'rug_pull' | 'wash_trading' | 'frontrunning' | 'sandwich_attack';
  description: string;
  timestamp: Date;
  txHash: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContractAnalysis {
  bytecode?: string;
  sourceCode?: string;
  isVerified: boolean;
  compiler?: string;
  functions: ContractFunction[];
  events: ContractEvent[];
  vulnerabilities: ContractVulnerability[];
  securityScore: number; // 0-100
}

export interface ContractFunction {
  name: string;
  signature: string;
  isPayable: boolean;
  isPublic: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  description?: string;
}

export interface ContractEvent {
  name: string;
  signature: string;
  parameters: EventParameter[];
}

export interface EventParameter {
  name: string;
  type: string;
  indexed: boolean;
}

export interface ContractVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration
}

export interface TransactionAnalysis {
  totalTransactions: number;
  incomingTransactions: number;
  outgoingTransactions: number;
  totalVolume: string;
  averageTransactionValue: string;
  firstTransaction?: Date;
  lastTransaction?: Date;
  patterns: TransactionPattern[];
}

export interface TransactionPattern {
  type: 'mixing' | 'layering' | 'rapid_fire' | 'round_number' | 'dusting';
  description: string;
  occurrences: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AddressAssociation {
  address: string;
  relationship: 'cluster' | 'exchange' | 'service' | 'counterparty';
  strength: number; // 0-1
  firstSeen: Date;
  lastSeen: Date;
  transactionCount: number;
  volume: string;
}

export interface AddressFlag {
  type: 'sanctions' | 'malware' | 'ransomware' | 'darknet' | 'mixer' | 'gambling' | 'scam' | 'hack';
  source: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  addedAt: Date;
  confirmed: boolean;
}

export interface BlockchainService {
  id: string;
  name: string;
  type: 'exchange' | 'wallet' | 'defi' | 'nft' | 'bridge' | 'other';
  networks: BlockchainNetwork[];
  addresses: string[];
  website?: string;
  contact?: ContactInfo;
  verified: boolean;
  riskScore: RiskScore;
}

export interface DeFiProtocolAnalysis {
  protocol: string;
  version?: string;
  tvl: string; // Total Value Locked
  governance: GovernanceAnalysis;
  audits: AuditResult[];
  incidents: SecurityIncident[];
  riskScore: RiskScore;
}

export interface GovernanceAnalysis {
  hasGovernance: boolean;
  tokenAddress?: string;
  votingPower: VotingPowerDistribution[];
  proposals: GovernanceProposal[];
  centralizationRisk: number; // 0-100
}

export interface VotingPowerDistribution {
  address: string;
  votingPower: number; // percentage
  isKnownEntity: boolean;
  label?: string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'passed' | 'rejected';
  votesFor: string;
  votesAgainst: string;
  quorum: string;
  deadline: Date;
}

export interface AuditResult {
  auditor: string;
  date: Date;
  scope: string;
  findings: AuditFinding[];
  reportUrl?: string;
  score?: number;
}

export interface AuditFinding {
  severity: 'informational' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'acknowledged' | 'fixed';
}

export interface SecurityIncident {
  date: Date;
  type: 'hack' | 'rug_pull' | 'exploit' | 'governance_attack';
  description: string;
  lossAmount?: string;
  affectedUsers?: number;
  resolved: boolean;
  postMortem?: string;
}