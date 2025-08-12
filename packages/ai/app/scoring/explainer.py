"""Explainability module for scam detection predictions."""

import logging
from typing import Dict, List, Any, Tuple, Optional
import numpy as np
from dataclasses import dataclass
import re
from collections import Counter

from app.core.config import model_config

logger = logging.getLogger(__name__)


@dataclass
class FeatureImportance:
    """Individual feature importance."""
    feature_name: str
    importance: float
    value: Any
    explanation: str


@dataclass
class ExplanationResult:
    """Complete explanation of a prediction."""
    prediction_score: float
    risk_level: str
    key_factors: List[FeatureImportance]
    evidence_text: List[str]
    recommendations: List[str]
    confidence: float


class ScamExplainer:
    """Generate explanations for scam detection predictions."""
    
    def __init__(self):
        self.feature_explanations = {
            # Pattern-based explanations
            "scam_patterns": "Contains known scam phrases or patterns",
            "urgency_keywords": "Uses urgent or pressuring language",
            "financial_entities": "Mentions money, payments, or financial information",
            "suspicious_domains": "Contains suspicious or shortened URLs",
            "contact_pressure": "Pressures for immediate contact or response",
            "time_pressure": "Creates artificial time constraints",
            
            # Sentiment-based explanations
            "sentiment_polarity": "Overall emotional tone of the message",
            "sentiment_subjectivity": "Level of opinion vs factual content",
            "urgency_score": "Urgency and pressure tactics detected",
            "manipulation_score": "Emotional manipulation techniques used",
            "fear_indicators": "Uses fear-based persuasion tactics",
            "greed_indicators": "Appeals to greed or get-rich-quick desires",
            
            # Entity-based explanations
            "url_count": "Number of web links in message",
            "email_count": "Number of email addresses mentioned",
            "phone_count": "Number of phone numbers provided",
            "crypto_address_count": "Cryptocurrency addresses present",
            "money_amount_count": "Specific dollar amounts mentioned",
            
            # Text statistics
            "char_count": "Length of the message",
            "exclamation_count": "Excessive use of exclamation marks",
            "caps_lock_ratio": "Percentage of text in ALL CAPS",
            "special_char_ratio": "Use of special characters and symbols"
        }
    
    def explain_prediction(
        self, 
        text: str, 
        ensemble_result: Any,
        include_evidence: bool = True
    ) -> ExplanationResult:
        """
        Generate comprehensive explanation for a prediction.
        
        Args:
            text: Original text that was analyzed
            ensemble_result: Result from ensemble scorer
            include_evidence: Whether to highlight evidence in text
            
        Returns:
            ExplanationResult with detailed explanation
        """
        try:
            # Extract key factors from model predictions
            key_factors = self._extract_key_factors(ensemble_result.model_predictions)
            
            # Find evidence in text
            evidence_text = []
            if include_evidence:
                evidence_text = self._find_evidence_in_text(text, key_factors)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                ensemble_result.final_score, 
                ensemble_result.risk_level,
                key_factors
            )
            
            return ExplanationResult(
                prediction_score=ensemble_result.final_score,
                risk_level=ensemble_result.risk_level,
                key_factors=key_factors,
                evidence_text=evidence_text,
                recommendations=recommendations,
                confidence=ensemble_result.confidence
            )
            
        except Exception as e:
            logger.error(f"Error generating explanation: {e}")
            return ExplanationResult(
                prediction_score=0.0,
                risk_level="error",
                key_factors=[],
                evidence_text=[],
                recommendations=["Unable to generate explanation - manual review required"],
                confidence=0.0
            )
    
    def _extract_key_factors(self, model_predictions: List[Any]) -> List[FeatureImportance]:
        """Extract key factors from model predictions."""
        key_factors = []
        
        try:
            for prediction in model_predictions:
                if prediction.model_name == "pattern":
                    pattern_factors = self._extract_pattern_factors(prediction.metadata)
                    key_factors.extend(pattern_factors)
                
                elif prediction.model_name == "sentiment":
                    sentiment_factors = self._extract_sentiment_factors(prediction.metadata)
                    key_factors.extend(sentiment_factors)
                
                elif prediction.model_name == "bert":
                    bert_factors = self._extract_bert_factors(prediction.metadata)
                    key_factors.extend(bert_factors)
            
            # Sort by importance and take top factors
            key_factors.sort(key=lambda x: x.importance, reverse=True)
            return key_factors[:10]  # Top 10 factors
            
        except Exception as e:
            logger.error(f"Error extracting key factors: {e}")
            return []
    
    def _extract_pattern_factors(self, pattern_metadata: Dict) -> List[FeatureImportance]:
        """Extract factors from pattern analysis."""
        factors = []
        
        try:
            risk_analysis = pattern_metadata.get("risk_analysis", {})
            matches_by_category = pattern_metadata.get("matches_by_category", {})
            
            # Overall pattern risk
            risk_score = risk_analysis.get("risk_score", 0.0)
            if risk_score > 0.3:
                factors.append(FeatureImportance(
                    feature_name="pattern_risk_score",
                    importance=risk_score,
                    value=risk_score,
                    explanation=f"Pattern analysis detected {risk_score:.1%} scam probability"
                ))
            
            # Category-specific factors
            for category, matches in matches_by_category.items():
                if matches:
                    category_importance = len(matches) * 0.2
                    category_name = category.replace("_", " ").title()
                    
                    factors.append(FeatureImportance(
                        feature_name=f"pattern_{category}",
                        importance=category_importance,
                        value=len(matches),
                        explanation=f"Contains {len(matches)} {category_name.lower()} indicators"
                    ))
            
        except Exception as e:
            logger.error(f"Error extracting pattern factors: {e}")
        
        return factors
    
    def _extract_sentiment_factors(self, sentiment_metadata: Dict) -> List[FeatureImportance]:
        """Extract factors from sentiment analysis."""
        factors = []
        
        try:
            urgency_analysis = sentiment_metadata.get("urgency_analysis", {})
            manipulation_analysis = sentiment_metadata.get("manipulation_analysis", {})
            
            # Urgency factors
            urgency_score = urgency_analysis.get("urgency_score", 0.0)
            if urgency_score > 0.3:
                factors.append(FeatureImportance(
                    feature_name="urgency_score",
                    importance=urgency_score,
                    value=urgency_score,
                    explanation=f"High urgency pressure detected ({urgency_score:.1%})"
                ))
            
            # Manipulation factors
            manipulation_score = manipulation_analysis.get("manipulation_score", 0.0)
            if manipulation_score > 0.3:
                factors.append(FeatureImportance(
                    feature_name="manipulation_score",
                    importance=manipulation_score,
                    value=manipulation_score,
                    explanation=f"Emotional manipulation tactics detected ({manipulation_score:.1%})"
                ))
            
            # Specific emotional indicators
            fear_indicators = manipulation_analysis.get("fear_indicators", {})
            greed_indicators = manipulation_analysis.get("greed_indicators", {})
            
            if fear_indicators.get("count", 0) > 0:
                factors.append(FeatureImportance(
                    feature_name="fear_indicators",
                    importance=fear_indicators.get("density", 0.0),
                    value=fear_indicators.get("count", 0),
                    explanation=f"Uses {fear_indicators.get('count', 0)} fear-based keywords"
                ))
            
            if greed_indicators.get("count", 0) > 0:
                factors.append(FeatureImportance(
                    feature_name="greed_indicators",
                    importance=greed_indicators.get("density", 0.0),
                    value=greed_indicators.get("count", 0),
                    explanation=f"Contains {greed_indicators.get('count', 0)} greed-appeal terms"
                ))
            
        except Exception as e:
            logger.error(f"Error extracting sentiment factors: {e}")
        
        return factors
    
    def _extract_bert_factors(self, bert_metadata: Dict) -> List[FeatureImportance]:
        """Extract factors from BERT prediction."""
        factors = []
        
        try:
            scam_probability = bert_metadata.get("scam_probability", 0.0)
            confidence = bert_metadata.get("confidence", 0.0)
            
            if scam_probability > 0.3:
                factors.append(FeatureImportance(
                    feature_name="bert_prediction",
                    importance=scam_probability * confidence,
                    value=scam_probability,
                    explanation=f"AI language model predicts {scam_probability:.1%} scam probability"
                ))
            
            # Pattern details if using simulator
            pattern_details = bert_metadata.get("pattern_details", [])
            if pattern_details:
                for pattern_info in pattern_details[:3]:  # Top 3 patterns
                    pattern, count, weight = pattern_info
                    factors.append(FeatureImportance(
                        feature_name=f"bert_pattern_{hash(pattern) % 1000}",
                        importance=weight,
                        value=count,
                        explanation=f"Matches high-risk pattern {count} time(s)"
                    ))
            
        except Exception as e:
            logger.error(f"Error extracting BERT factors: {e}")
        
        return factors
    
    def _find_evidence_in_text(self, text: str, key_factors: List[FeatureImportance]) -> List[str]:
        """Find and highlight evidence in the original text."""
        evidence = []
        
        try:
            text_lower = text.lower()
            
            # Look for pattern matches
            for pattern in model_config.SCAM_PATTERNS:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    for match in matches[:2]:  # Max 2 per pattern
                        # Find context around the match
                        match_pos = text_lower.find(match.lower())
                        if match_pos != -1:
                            start = max(0, match_pos - 20)
                            end = min(len(text), match_pos + len(match) + 20)
                            context = text[start:end].strip()
                            evidence.append(f"Suspicious phrase: \"{context}\"")
            
            # Look for urgency keywords
            urgency_found = []
            for keyword in ["urgent", "immediately", "asap", "act now", "limited time"]:
                if keyword in text_lower:
                    pos = text_lower.find(keyword)
                    start = max(0, pos - 15)
                    end = min(len(text), pos + len(keyword) + 15)
                    context = text[start:end].strip()
                    urgency_found.append(context)
            
            if urgency_found:
                evidence.extend([f"Urgency tactic: \"{ctx}\"" for ctx in urgency_found[:2]])
            
            # Look for financial terms
            financial_terms = ["money", "$", "payment", "account", "bitcoin", "investment"]
            for term in financial_terms:
                if term in text_lower:
                    pos = text_lower.find(term)
                    start = max(0, pos - 15)
                    end = min(len(text), pos + len(term) + 15)
                    context = text[start:end].strip()
                    evidence.append(f"Financial reference: \"{context}\"")
                    break  # Only add one financial evidence
            
        except Exception as e:
            logger.error(f"Error finding evidence in text: {e}")
        
        return evidence[:5]  # Max 5 evidence pieces
    
    def _generate_recommendations(
        self, 
        score: float, 
        risk_level: str, 
        key_factors: List[FeatureImportance]
    ) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []
        
        try:
            # Risk-level based recommendations
            if risk_level in ["critical", "high"]:
                recommendations.extend([
                    "⚠️ HIGH RISK: Do not respond or engage with this message",
                    "🚫 Do not click any links or download attachments",
                    "💰 Never send money or provide financial information",
                    "📞 Do not call any phone numbers provided",
                    "🔒 Report this message to relevant authorities"
                ])
            
            elif risk_level == "medium":
                recommendations.extend([
                    "⚠️ MEDIUM RISK: Exercise extreme caution",
                    "🔍 Verify sender identity through independent channels",
                    "❌ Do not provide personal or financial information",
                    "💭 Be skeptical of urgent requests or time pressure"
                ])
            
            elif risk_level == "low":
                recommendations.extend([
                    "⚠️ LOW RISK: Some suspicious elements detected",
                    "🔍 Verify legitimacy before taking any action",
                    "💭 Be cautious with personal information"
                ])
            
            # Factor-specific recommendations
            has_patterns = any("pattern" in factor.feature_name for factor in key_factors)
            has_urgency = any("urgency" in factor.feature_name for factor in key_factors)
            has_manipulation = any("manipulation" in factor.feature_name for factor in key_factors)
            
            if has_patterns:
                recommendations.append("📋 Message contains known scam patterns")
            
            if has_urgency:
                recommendations.append("⏰ Pressure tactics detected - legitimate services don't rush you")
            
            if has_manipulation:
                recommendations.append("🧠 Emotional manipulation detected - step back and think critically")
            
            # General security recommendations
            if score > 0.5:
                recommendations.extend([
                    "🛡️ Consider using email filtering or security software",
                    "📚 Learn more about common scam tactics",
                    "👥 Share this with others who might be vulnerable"
                ])
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            recommendations.append("Manual review recommended due to analysis error")
        
        return recommendations[:8]  # Max 8 recommendations
    
    def generate_summary_explanation(self, explanation_result: ExplanationResult) -> str:
        """Generate a concise summary explanation."""
        try:
            risk_emoji = {
                "critical": "🚨",
                "high": "⚠️",
                "medium": "⚡",
                "low": "ℹ️",
                "minimal": "✅"
            }
            
            emoji = risk_emoji.get(explanation_result.risk_level, "❓")
            
            summary = f"{emoji} **{explanation_result.risk_level.upper()} RISK** "
            summary += f"({explanation_result.prediction_score:.0%} scam probability)\n\n"
            
            # Top 3 factors
            if explanation_result.key_factors:
                summary += "**Key concerns:**\n"
                for factor in explanation_result.key_factors[:3]:
                    summary += f"• {factor.explanation}\n"
                summary += "\n"
            
            # Top recommendation
            if explanation_result.recommendations:
                summary += f"**Action:** {explanation_result.recommendations[0]}\n"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Unable to generate explanation summary"


# Global explainer instance
scam_explainer = ScamExplainer()