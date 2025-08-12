export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  description?: string;
  logoURI?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export interface ContractInfo {
  address: string;
  creator: string;
  createdAt: Date;
  verified: boolean;
  sourceCode?: string;
  abi?: any[];
  proxyImplementation?: string;
  isProxy: boolean;
  compiler?: string;
}

export interface LiquidityInfo {
  totalLiquidity: string;
  liquidityPools: LiquidityPool[];
  lockedLiquidity: string;
  liquidityRatio: number;
}

export interface LiquidityPool {
  platform: string;
  pairAddress: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  lockedAmount?: string;
  lockDuration?: number;
}

export interface HolderAnalysis {
  totalHolders: number;
  topHolders: TokenHolder[];
  concentration: {
    top10Percentage: number;
    top50Percentage: number;
    top100Percentage: number;
  };
  distributions: {
    whales: number; // > 1%
    large: number;  // 0.1% - 1%
    medium: number; // 0.01% - 0.1%
    small: number;  // < 0.01%
  };
}

export interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
  isContract: boolean;
  label?: string;
}

export interface RiskIndicators {
  honeypotRisk: number;
  rugPullRisk: number;
  liquidityRisk: number;
  ownershipRisk: number;
  tradingRisk: number;
  overallRisk: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RiskFactor {
  category: string;
  factor: string;
  risk: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface TransactionAnalysis {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: boolean;
  riskFactors: RiskFactor[];
  suspiciousPatterns: string[];
}

export interface WalletReputation {
  address: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  transactionCount: number;
  firstSeen: Date;
  lastSeen: Date;
  labels: string[];
  riskFactors: RiskFactor[];
  suspiciousActivities: SuspiciousActivity[];
}

export interface SuspiciousActivity {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: Date;
  transactionHash?: string;
}

export interface PriceData {
  tokenAddress: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: Date;
  source: string;
}

export interface ScamDatabase {
  contracts: string[];
  wallets: string[];
  domains: string[];
  patterns: ScamPattern[];
}

export interface ScamPattern {
  type: string;
  pattern: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AnalysisResult {
  tokenAddress: string;
  network: string;
  timestamp: Date;
  metadata: TokenMetadata;
  contractInfo: ContractInfo;
  liquidityInfo: LiquidityInfo;
  holderAnalysis: HolderAnalysis;
  riskIndicators: RiskIndicators;
  riskFactors: RiskFactor[];
  priceData?: PriceData;
  analysisVersion: string;
}

export interface VerificationRequest {
  address: string;
  network: string;
  requestId: string;
  timestamp: Date;
}

export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrls: string[];
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
}

export type BlockchainNetwork = 'ethereum' | 'bsc' | 'polygon' | 'solana' | 'bitcoin';

export interface ContractFunction {
  name: string;
  type: string;
  inputs: any[];
  outputs: any[];
  stateMutability: string;
  suspicious?: boolean;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SecurityAudit {
  auditor: string;
  date: Date;
  report: string;
  findings: AuditFinding[];
  overallScore: number;
}

export interface AuditFinding {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  recommendation: string;
}