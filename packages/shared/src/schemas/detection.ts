import { z } from 'zod';
import { riskScoreSchema } from './common';

export const detectionTypeSchema = z.enum([
  'phishing',
  'investment_scam',
  'romance_scam',
  'fake_support',
  'malware',
  'social_engineering',
  'impersonation',
  'pump_dump',
  'ponzi_scheme',
  'fake_exchange',
  'rug_pull',
  'fake_giveaway',
  'advance_fee',
  'tech_support',
  'fake_job',
  'lottery_scam',
  'charity_scam',
]);

export const evidenceSchema = z.object({
  type: z.enum(['text_pattern', 'url_analysis', 'domain_reputation', 'blockchain_analysis', 'image_analysis', 'behavior_pattern']),
  description: z.string(),
  data: z.any(),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

export const threatIndicatorSchema = z.object({
  type: z.enum(['domain', 'ip', 'email', 'phone', 'wallet_address', 'text_pattern', 'url_pattern']),
  value: z.string(),
  description: z.string(),
  firstSeen: z.date().optional(),
  lastSeen: z.date().optional(),
  reportedBy: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
});

export const mitigationAdviceSchema = z.object({
  immediateActions: z.array(z.string()),
  preventiveActions: z.array(z.string()),
  reportingAdvice: z.array(z.string()),
  recoverySteps: z.array(z.string()).optional(),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    description: z.string(),
  })),
});

export const externalReferenceSchema = z.object({
  source: z.string(),
  title: z.string(),
  url: z.string().url(),
  type: z.enum(['report', 'analysis', 'news', 'official']),
  publishedAt: z.date().optional(),
});

export const detectionResultSchema = z.object({
  id: z.string(),
  type: detectionTypeSchema,
  confidence: z.number().min(0).max(1),
  riskScore: riskScoreSchema,
  description: z.string(),
  evidence: z.array(evidenceSchema),
  indicators: z.array(threatIndicatorSchema),
  mitigation: mitigationAdviceSchema,
  references: z.array(externalReferenceSchema).optional(),
});

export const detectionRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: detectionTypeSchema,
  pattern: z.string(),
  weight: z.number().min(0).max(1),
  enabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.object({
    author: z.string(),
    version: z.string(),
    tags: z.array(z.string()),
  }).optional(),
});

export const detectionStatisticsSchema = z.object({
  totalDetections: z.number(),
  byType: z.record(detectionTypeSchema, z.number()),
  byRiskLevel: z.record(z.string(), z.number()),
  averageConfidence: z.number(),
  trendsOverTime: z.array(z.object({
    period: z.string(),
    count: z.number(),
    types: z.array(detectionTypeSchema),
  })),
  mostCommonIndicators: z.array(z.object({
    type: z.string(),
    value: z.string(),
    count: z.number(),
  })),
});

export const feedbackOnDetectionSchema = z.object({
  detectionId: z.string(),
  userId: z.string(),
  accurate: z.boolean(),
  comment: z.string().optional(),
  additionalInfo: z.string().optional(),
  submittedAt: z.date(),
});

export const detectionUpdateSchema = z.object({
  id: z.string(),
  description: z.string(),
  newRiskScore: riskScoreSchema.optional(),
  additionalEvidence: z.array(evidenceSchema).optional(),
  updatedAt: z.date(),
  reason: z.string(),
});