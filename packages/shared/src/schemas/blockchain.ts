import { z } from 'zod';
import { riskScoreSchema, contactInfoSchema } from './common';

export const blockchainNetworkSchema = z.enum([
  'ethereum',
  'bitcoin',
  'binance_smart_chain',
  'polygon',
  'arbitrum',
  'optimism',
  'avalanche',
  'fantom',
  'solana',
  'cardano',
  'polkadot',
]);

export const addressTypeSchema = z.enum(['wallet', 'contract', 'exchange', 'mixer', 'unknown']);

export const reputationSourceSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  labels: z.array(z.string()),
  lastUpdated: z.date(),
  url: z.string().url().optional(),
});

export const addressReputationSchema = z.object({
  trustScore: z.number().min(0).max(100),
  isExchange: z.boolean(),
  isKnownService: z.boolean(),
  isMalicious: z.boolean(),
  isSanctioned: z.boolean(),
  labels: z.array(z.string()),
  sources: z.array(reputationSourceSchema),
});

export const tokenRiskFactorSchema = z.object({
  type: z.enum(['honeypot', 'high_tax', 'mint_function', 'pause_function', 'blacklist_function', 'proxy_contract', 'unverified_contract']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  evidence: z.any().optional(),
});

export const liquidityPoolSchema = z.object({
  exchange: z.string(),
  pair: z.string(),
  liquidity: z.string(),
  volume24h: z.string(),
  priceImpact: z.number(),
});

export const liquidityAnalysisSchema = z.object({
  totalLiquidity: z.string(),
  liquidityPools: z.array(liquidityPoolSchema),
  liquidityScore: z.number().min(0).max(100),
  isLiquidityLocked: z.boolean(),
  lockUntil: z.date().optional(),
});

export const tokenHolderSchema = z.object({
  address: z.string(),
  balance: z.string(),
  percentage: z.number(),
  isContract: z.boolean(),
  labels: z.array(z.string()).optional(),
});

export const ownershipAnalysisSchema = z.object({
  ownerAddress: z.string().optional(),
  isRenounced: z.boolean(),
  topHolders: z.array(tokenHolderSchema),
  concentrationRisk: z.number().min(0).max(100),
  distributionScore: z.number().min(0).max(100),
});

export const suspiciousActivitySchema = z.object({
  type: z.enum(['flash_loan_attack', 'rug_pull', 'wash_trading', 'frontrunning', 'sandwich_attack']),
  description: z.string(),
  timestamp: z.date(),
  txHash: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

export const tradingAnalysisSchema = z.object({
  volume24h: z.string(),
  transactions24h: z.number(),
  uniqueTraders24h: z.number(),
  priceChange24h: z.number(),
  marketCap: z.string().optional(),
  holders: z.number(),
  suspiciousActivity: z.array(suspiciousActivitySchema),
});

export const tokenAnalysisSchema = z.object({
  contractAddress: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  totalSupply: z.string(),
  isVerified: z.boolean(),
  riskFactors: z.array(tokenRiskFactorSchema),
  liquidityAnalysis: liquidityAnalysisSchema,
  ownershipAnalysis: ownershipAnalysisSchema,
  tradingAnalysis: tradingAnalysisSchema,
});

export const contractFunctionSchema = z.object({
  name: z.string(),
  signature: z.string(),
  isPayable: z.boolean(),
  isPublic: z.boolean(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  description: z.string().optional(),
});

export const eventParameterSchema = z.object({
  name: z.string(),
  type: z.string(),
  indexed: z.boolean(),
});

export const contractEventSchema = z.object({
  name: z.string(),
  signature: z.string(),
  parameters: z.array(eventParameterSchema),
});

export const contractVulnerabilitySchema = z.object({
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  recommendation: z.string(),
  cwe: z.string().optional(),
});

export const contractAnalysisSchema = z.object({
  bytecode: z.string().optional(),
  sourceCode: z.string().optional(),
  isVerified: z.boolean(),
  compiler: z.string().optional(),
  functions: z.array(contractFunctionSchema),
  events: z.array(contractEventSchema),
  vulnerabilities: z.array(contractVulnerabilitySchema),
  securityScore: z.number().min(0).max(100),
});

export const transactionPatternSchema = z.object({
  type: z.enum(['mixing', 'layering', 'rapid_fire', 'round_number', 'dusting']),
  description: z.string(),
  occurrences: z.number(),
  riskLevel: z.enum(['low', 'medium', 'high']),
});

export const transactionAnalysisSchema = z.object({
  totalTransactions: z.number(),
  incomingTransactions: z.number(),
  outgoingTransactions: z.number(),
  totalVolume: z.string(),
  averageTransactionValue: z.string(),
  firstTransaction: z.date().optional(),
  lastTransaction: z.date().optional(),
  patterns: z.array(transactionPatternSchema),
});

export const addressAssociationSchema = z.object({
  address: z.string(),
  relationship: z.enum(['cluster', 'exchange', 'service', 'counterparty']),
  strength: z.number().min(0).max(1),
  firstSeen: z.date(),
  lastSeen: z.date(),
  transactionCount: z.number(),
  volume: z.string(),
});

export const addressFlagSchema = z.object({
  type: z.enum(['sanctions', 'malware', 'ransomware', 'darknet', 'mixer', 'gambling', 'scam', 'hack']),
  source: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  addedAt: z.date(),
  confirmed: z.boolean(),
});

export const blockchainAnalysisSchema = z.object({
  network: blockchainNetworkSchema,
  address: z.string(),
  addressType: addressTypeSchema,
  riskScore: riskScoreSchema,
  reputation: addressReputationSchema,
  tokenAnalysis: tokenAnalysisSchema.optional(),
  contractAnalysis: contractAnalysisSchema.optional(),
  transactionAnalysis: transactionAnalysisSchema,
  associations: z.array(addressAssociationSchema),
  flags: z.array(addressFlagSchema),
  lastUpdated: z.date(),
});

export const blockchainServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['exchange', 'wallet', 'defi', 'nft', 'bridge', 'other']),
  networks: z.array(blockchainNetworkSchema),
  addresses: z.array(z.string()),
  website: z.string().url().optional(),
  contact: contactInfoSchema.optional(),
  verified: z.boolean(),
  riskScore: riskScoreSchema,
});