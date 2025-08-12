import { RiskLevel, RiskScore, RiskFactor } from '../types/common';

export function calculateRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

export function combineRiskScores(scores: RiskScore[]): RiskScore {
  if (scores.length === 0) {
    return {
      score: 0,
      level: 'low',
      confidence: 0,
      factors: [],
    };
  }

  // Weighted average based on confidence
  const weightedSum = scores.reduce((sum, score) => {
    return sum + (score.score * score.confidence);
  }, 0);
  
  const totalConfidence = scores.reduce((sum, score) => sum + score.confidence, 0);
  const averageScore = totalConfidence > 0 ? weightedSum / totalConfidence : 0;
  
  // Average confidence
  const averageConfidence = totalConfidence / scores.length;
  
  // Combine all factors
  const allFactors = scores.flatMap(score => score.factors);
  
  return {
    score: Math.round(averageScore),
    level: calculateRiskLevel(averageScore),
    confidence: averageConfidence,
    factors: allFactors,
  };
}

export function createRiskScore(
  score: number,
  factors: RiskFactor[],
  baseConfidence = 0.8
): RiskScore {
  // Adjust confidence based on number and quality of factors
  const factorConfidence = factors.reduce((avg, factor) => avg + factor.confidence, 0) / factors.length;
  const confidence = factors.length > 0 ? (baseConfidence + factorConfidence) / 2 : baseConfidence;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    level: calculateRiskLevel(score),
    confidence: Math.max(0, Math.min(1, confidence)),
    factors,
  };
}

export function addRiskFactor(
  riskScore: RiskScore,
  factor: RiskFactor
): RiskScore {
  const newFactors = [...riskScore.factors, factor];
  
  // Recalculate score based on impact
  const impactSum = newFactors.reduce((sum, f) => sum + (f.impact * f.confidence), 0);
  const confidenceSum = newFactors.reduce((sum, f) => sum + f.confidence, 0);
  
  const baseScore = riskScore.score;
  const impactAverage = confidenceSum > 0 ? impactSum / confidenceSum : 0;
  const newScore = baseScore + (impactAverage * 0.1); // Scale impact
  
  return {
    ...riskScore,
    score: Math.max(0, Math.min(100, newScore)),
    level: calculateRiskLevel(newScore),
    factors: newFactors,
  };
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return '#10B981'; // green
    case 'medium':
      return '#F59E0B'; // yellow
    case 'high':
      return '#EF4444'; // red
    case 'critical':
      return '#7C2D12'; // dark red
    default:
      return '#6B7280'; // gray
  }
}

export function getRiskIcon(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return '✓';
    case 'medium':
      return '⚠';
    case 'high':
      return '⚠';
    case 'critical':
      return '⚠';
    default:
      return '?';
  }
}

export function formatRiskLevel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function isHighRisk(riskScore: RiskScore): boolean {
  return riskScore.level === 'high' || riskScore.level === 'critical';
}

export function isCriticalRisk(riskScore: RiskScore): boolean {
  return riskScore.level === 'critical';
}

export function getRiskThresholds() {
  return {
    low: { min: 0, max: 25 },
    medium: { min: 26, max: 50 },
    high: { min: 51, max: 75 },
    critical: { min: 76, max: 100 },
  };
}

export function normalizeRiskScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function weightedRiskAverage(
  scores: Array<{ score: number; weight: number }>
): number {
  if (scores.length === 0) return 0;
  
  const weightedSum = scores.reduce((sum, { score, weight }) => sum + (score * weight), 0);
  const totalWeight = scores.reduce((sum, { weight }) => sum + weight, 0);
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function createRiskFactor(
  type: string,
  description: string,
  impact: number,
  confidence = 0.8
): RiskFactor {
  return {
    type,
    description,
    impact: Math.max(-100, Math.min(100, impact)),
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}