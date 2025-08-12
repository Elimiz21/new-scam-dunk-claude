import { RiskScore, RiskFactor } from './common';

export type DetectionType = 
  | 'phishing'
  | 'investment_scam'
  | 'romance_scam'
  | 'fake_support'
  | 'malware'
  | 'social_engineering'
  | 'impersonation'
  | 'pump_dump'
  | 'ponzi_scheme'
  | 'fake_exchange'
  | 'rug_pull'
  | 'fake_giveaway'
  | 'advance_fee'
  | 'tech_support'
  | 'fake_job'
  | 'lottery_scam'
  | 'charity_scam';

export interface DetectionResult {
  id: string;
  type: DetectionType;
  confidence: number;
  riskScore: RiskScore;
  description: string;
  evidence: Evidence[];
  indicators: ThreatIndicator[];
  mitigation: MitigationAdvice;
  references?: ExternalReference[];
}

export interface Evidence {
  type: 'text_pattern' | 'url_analysis' | 'domain_reputation' | 'blockchain_analysis' | 'image_analysis' | 'behavior_pattern';
  description: string;
  data: any;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ThreatIndicator {
  type: 'domain' | 'ip' | 'email' | 'phone' | 'wallet_address' | 'text_pattern' | 'url_pattern';
  value: string;
  description: string;
  firstSeen?: Date;
  lastSeen?: Date;
  reportedBy?: string[];
  confidence: number;
}

export interface MitigationAdvice {
  immediateActions: string[];
  preventiveActions: string[];
  reportingAdvice: string[];
  recoverySteps?: string[];
  resources: {
    title: string;
    url: string;
    description: string;
  }[];
}

export interface ExternalReference {
  source: string;
  title: string;
  url: string;
  type: 'report' | 'analysis' | 'news' | 'official';
  publishedAt?: Date;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  type: DetectionType;
  pattern: string | RegExp;
  weight: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    author: string;
    version: string;
    tags: string[];
  };
}

export interface DetectionStatistics {
  totalDetections: number;
  byType: Record<DetectionType, number>;
  byRiskLevel: Record<string, number>;
  averageConfidence: number;
  trendsOverTime: {
    period: string;
    count: number;
    types: DetectionType[];
  }[];
  mostCommonIndicators: {
    type: string;
    value: string;
    count: number;
  }[];
}

export interface FeedbackOnDetection {
  detectionId: string;
  userId: string;
  accurate: boolean;
  comment?: string;
  additionalInfo?: string;
  submittedAt: Date;
}

export interface DetectionUpdate {
  id: string;
  description: string;
  newRiskScore?: RiskScore;
  additionalEvidence?: Evidence[];
  updatedAt: Date;
  reason: string;
}