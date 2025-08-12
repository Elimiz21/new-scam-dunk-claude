"""Simulate pre-trained models with realistic scam detection behavior."""

import re
import logging
import random
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class ScamModelSimulator:
    """Simulate realistic scam detection model behavior."""
    
    def __init__(self):
        self.load_simulation_data()
        self.initialize_models()
    
    def load_simulation_data(self):
        """Load simulation data and patterns."""
        # High-risk scam patterns with associated probabilities
        self.high_risk_patterns = [
            # Financial scams
            (r"guaranteed\s+(?:returns?|profits?|money)", 0.92, "investment_scam"),
            (r"risk\s*-?\s*free\s+investment", 0.88, "investment_scam"),
            (r"double\s+your\s+money", 0.89, "investment_scam"),
            (r"make\s+\$\d+\s+(?:daily|per\s+day|a\s+day)", 0.85, "get_rich_quick"),
            (r"work\s+from\s+home\s+\$\d+", 0.78, "job_scam"),
            
            # Crypto scams
            (r"bitcoin\s+(?:giveaway|doubler)", 0.94, "crypto_scam"),
            (r"send\s+\d+\s+btc\s+get\s+\d+\s+back", 0.96, "crypto_scam"),
            (r"elon\s+musk\s+(?:bitcoin|crypto)", 0.91, "crypto_scam"),
            
            # Phishing
            (r"verify\s+your\s+account\s+immediately", 0.87, "phishing"),
            (r"account\s+(?:suspended|locked|compromised)", 0.84, "phishing"),
            (r"click\s+here\s+to\s+(?:verify|confirm)", 0.82, "phishing"),
            (r"urgent\s+action\s+required", 0.79, "phishing"),
            
            # Romance/Social engineering
            (r"need\s+money\s+for\s+(?:emergency|medical)", 0.83, "romance_scam"),
            (r"western\s+union\s+transfer", 0.86, "romance_scam"),
            (r"gift\s+card\s+payment", 0.88, "social_engineering"),
            
            # Tech support
            (r"microsoft\s+support\s+(?:urgent|security)", 0.85, "tech_support_scam"),
            (r"computer\s+(?:infected|virus|malware)", 0.81, "tech_support_scam"),
            (r"call\s+this\s+number\s+immediately", 0.83, "tech_support_scam"),
            
            # Lottery/Prize
            (r"you\s+(?:have\s+)?won\s+\$?[\d,]+", 0.86, "lottery_scam"),
            (r"claim\s+your\s+(?:prize|winnings)", 0.84, "lottery_scam"),
            (r"congratulations\s+you\s+(?:won|selected)", 0.79, "lottery_scam"),
        ]
        
        # Medium-risk patterns
        self.medium_risk_patterns = [
            (r"limited\s+time\s+offer", 0.65, "pressure_tactics"),
            (r"act\s+now\s+or\s+miss\s+out", 0.68, "pressure_tactics"),
            (r"exclusive\s+(?:offer|deal)", 0.58, "marketing"),
            (r"pre\s*-?\s*approved", 0.62, "financial"),
            (r"no\s+credit\s+check", 0.63, "financial"),
            (r"call\s+(?:now|today)", 0.55, "telemarketing"),
            (r"don\'?t\s+miss\s+(?:out|this)", 0.57, "pressure_tactics"),
            (r"special\s+offer\s+for\s+you", 0.54, "marketing"),
        ]
        
        # Low-risk patterns (legitimate but promotional)
        self.low_risk_patterns = [
            (r"newsletter\s+subscription", 0.25, "legitimate_marketing"),
            (r"unsubscribe", 0.15, "legitimate_marketing"),
            (r"contact\s+us", 0.20, "legitimate_business"),
            (r"privacy\s+policy", 0.18, "legitimate_business"),
            (r"terms\s+(?:and\s+conditions|of\s+service)", 0.16, "legitimate_business"),
        ]
        
        # Compile all patterns
        self.compiled_patterns = []
        for patterns, risk_level in [
            (self.high_risk_patterns, "high"),
            (self.medium_risk_patterns, "medium"),
            (self.low_risk_patterns, "low")
        ]:
            for pattern, prob, category in patterns:
                try:
                    compiled = re.compile(pattern, re.IGNORECASE)
                    self.compiled_patterns.append((compiled, pattern, prob, category, risk_level))
                except re.error as e:
                    logger.warning(f"Failed to compile pattern '{pattern}': {e}")
    
    def initialize_models(self):
        """Initialize simulated model components."""
        # Model confidence factors
        self.model_confidence = {
            "pattern_matching": 0.85,
            "bert_simulation": 0.78,
            "sentiment_analysis": 0.72,
            "entity_extraction": 0.80
        }
        
        # Base probabilities for different text types
        self.base_probabilities = {
            "empty": 0.01,
            "very_short": 0.15,  # < 20 chars
            "short": 0.25,       # 20-100 chars
            "medium": 0.35,      # 100-500 chars
            "long": 0.30         # > 500 chars
        }
        
        # Seed for reproducible results
        np.random.seed(42)
    
    def simulate_bert_prediction(self, text: str) -> Dict[str, Any]:
        """
        Simulate BERT-like deep learning prediction.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Simulated prediction result
        """
        try:
            if not text or len(text.strip()) < 5:
                return self._empty_prediction()
            
            # Text length analysis
            text_length = len(text)
            text_lower = text.lower()
            
            # Base score based on length
            base_score = self._get_base_score_by_length(text_length)
            
            # Pattern-based scoring
            pattern_score, matched_patterns = self._calculate_pattern_score(text_lower)
            
            # Contextual features
            context_score = self._calculate_context_score(text_lower)
            
            # Combine scores with realistic neural network behavior
            combined_score = self._combine_scores_neural_style(
                base_score, pattern_score, context_score
            )
            
            # Add model uncertainty
            final_score, confidence = self._add_model_uncertainty(combined_score)
            
            # Determine prediction
            prediction = "scam" if final_score > 0.5 else "not_scam"
            
            return {
                "scam_probability": float(final_score),
                "confidence": float(confidence),
                "prediction": prediction,
                "model_type": "bert_simulation",
                "matched_patterns": len(matched_patterns),
                "pattern_details": matched_patterns[:3],  # Top 3
                "processing_metadata": {
                    "text_length": text_length,
                    "base_score": base_score,
                    "pattern_score": pattern_score,
                    "context_score": context_score,
                    "combined_score": combined_score
                }
            }
            
        except Exception as e:
            logger.error(f"Error in BERT simulation: {e}")
            return self._error_prediction(str(e))
    
    def simulate_ensemble_prediction(
        self,
        text: str,
        include_individual: bool = True
    ) -> Dict[str, Any]:
        """
        Simulate ensemble model prediction.
        
        Args:
            text: Input text
            include_individual: Whether to include individual model predictions
            
        Returns:
            Ensemble prediction result
        """
        try:
            individual_predictions = {}
            
            # Get predictions from individual models
            if include_individual:
                individual_predictions["bert"] = self.simulate_bert_prediction(text)
                individual_predictions["pattern"] = self._simulate_pattern_model(text)
                individual_predictions["sentiment"] = self._simulate_sentiment_model(text)
                individual_predictions["entity"] = self._simulate_entity_model(text)
            
            # Simulate ensemble combination
            if individual_predictions:
                ensemble_score = self._combine_ensemble_predictions(individual_predictions)
            else:
                # Direct ensemble prediction
                ensemble_score = self.simulate_bert_prediction(text)["scam_probability"]
            
            # Ensemble-specific adjustments
            ensemble_confidence = self._calculate_ensemble_confidence(individual_predictions)
            
            # Final ensemble prediction
            final_score = np.clip(ensemble_score, 0.0, 1.0)
            prediction = "scam" if final_score > 0.5 else "not_scam"
            
            # Risk level classification
            if final_score >= 0.9:
                risk_level = "critical"
            elif final_score >= 0.7:
                risk_level = "high"
            elif final_score >= 0.5:
                risk_level = "medium"
            elif final_score >= 0.3:
                risk_level = "low"
            else:
                risk_level = "minimal"
            
            return {
                "final_score": float(final_score),
                "risk_level": risk_level,
                "confidence": float(ensemble_confidence),
                "prediction": prediction,
                "model_type": "ensemble_simulation",
                "individual_predictions": individual_predictions,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in ensemble simulation: {e}")
            return self._error_prediction(str(e))
    
    def simulate_batch_predictions(
        self,
        texts: List[str],
        include_individual: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Simulate batch predictions with realistic processing variance.
        
        Args:
            texts: List of texts to analyze
            include_individual: Whether to include individual model predictions
            
        Returns:
            List of prediction results
        """
        results = []
        
        try:
            for i, text in enumerate(texts):
                # Add slight processing time variation
                processing_delay = np.random.normal(0.1, 0.02)  # ~100ms ± 20ms
                
                # Get prediction
                if include_individual:
                    result = self.simulate_ensemble_prediction(text, include_individual=True)
                else:
                    result = self.simulate_bert_prediction(text)
                
                # Add batch metadata
                result["batch_index"] = i
                result["estimated_processing_time"] = max(0.05, processing_delay)
                
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch simulation: {e}")
            return [self._error_prediction(str(e)) for _ in texts]
    
    # Private helper methods
    
    def _get_base_score_by_length(self, text_length: int) -> float:
        """Get base score based on text length."""
        if text_length == 0:
            return self.base_probabilities["empty"]
        elif text_length < 20:
            return self.base_probabilities["very_short"]
        elif text_length < 100:
            return self.base_probabilities["short"]
        elif text_length < 500:
            return self.base_probabilities["medium"]
        else:
            return self.base_probabilities["long"]
    
    def _calculate_pattern_score(self, text_lower: str) -> Tuple[float, List[Dict]]:
        """Calculate score based on pattern matching."""
        max_score = 0.0
        matched_patterns = []
        
        for compiled_pattern, original_pattern, prob, category, risk_level in self.compiled_patterns:
            matches = compiled_pattern.findall(text_lower)
            
            if matches:
                # Boost probability for multiple matches
                boosted_prob = min(0.98, prob + len(matches) * 0.02)
                
                if boosted_prob > max_score:
                    max_score = boosted_prob
                
                matched_patterns.append({
                    "pattern": original_pattern,
                    "matches": matches,
                    "probability": boosted_prob,
                    "category": category,
                    "risk_level": risk_level,
                    "match_count": len(matches)
                })
        
        # Sort by probability
        matched_patterns.sort(key=lambda x: x["probability"], reverse=True)
        
        return max_score, matched_patterns
    
    def _calculate_context_score(self, text_lower: str) -> float:
        """Calculate contextual score based on text features."""
        context_score = 0.0
        
        # URL analysis
        url_patterns = [r'http[s]?://', r'bit\.ly', r'tinyurl', r'goo\.gl']
        url_count = sum(len(re.findall(pattern, text_lower)) for pattern in url_patterns)
        if url_count > 0:
            context_score += min(0.3, url_count * 0.1)
        
        # Email analysis
        email_count = len(re.findall(r'\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b', text_lower))
        if email_count > 1:
            context_score += 0.15
        
        # Phone number analysis
        phone_patterns = [r'\d{3}-\d{3}-\d{4}', r'\(\d{3}\)\s*\d{3}-\d{4}']
        phone_count = sum(len(re.findall(pattern, text_lower)) for pattern in phone_patterns)
        if phone_count > 0:
            context_score += min(0.2, phone_count * 0.1)
        
        # Money amounts
        money_patterns = [r'\$\d+', r'\d+\s*dollars?', r'\d+\s*usd']
        money_count = sum(len(re.findall(pattern, text_lower)) for pattern in money_patterns)
        if money_count > 0:
            context_score += min(0.25, money_count * 0.08)
        
        # Urgency indicators
        urgency_words = ['urgent', 'asap', 'immediately', 'now', 'hurry']
        urgency_count = sum(text_lower.count(word) for word in urgency_words)
        if urgency_count > 0:
            context_score += min(0.3, urgency_count * 0.1)
        
        # Caps lock ratio
        if len(text_lower) > 10:
            caps_ratio = sum(1 for c in text_lower if c.isupper()) / len(text_lower)
            if caps_ratio > 0.3:  # More than 30% caps
                context_score += 0.15
        
        return min(1.0, context_score)
    
    def _combine_scores_neural_style(
        self,
        base_score: float,
        pattern_score: float,
        context_score: float
    ) -> float:
        """Combine scores in a neural network style."""
        # Weighted combination with non-linear activation
        weights = [0.2, 0.6, 0.2]  # [base, pattern, context]
        
        linear_combination = (
            base_score * weights[0] +
            pattern_score * weights[1] +
            context_score * weights[2]
        )
        
        # Apply sigmoid-like activation
        activated = 1 / (1 + np.exp(-5 * (linear_combination - 0.5)))
        
        return float(np.clip(activated, 0.0, 1.0))
    
    def _add_model_uncertainty(self, score: float) -> Tuple[float, float]:
        """Add realistic model uncertainty."""
        # Add Gaussian noise
        noise_std = 0.05  # 5% standard deviation
        noisy_score = score + np.random.normal(0, noise_std)
        final_score = np.clip(noisy_score, 0.0, 1.0)
        
        # Calculate confidence based on distance from decision boundary
        distance_from_boundary = abs(final_score - 0.5)
        confidence = min(0.95, 0.5 + distance_from_boundary)
        
        return final_score, confidence
    
    def _simulate_pattern_model(self, text: str) -> Dict[str, Any]:
        """Simulate pattern matching model."""
        pattern_score, matched_patterns = self._calculate_pattern_score(text.lower())
        
        confidence = self.model_confidence["pattern_matching"]
        if matched_patterns:
            # Higher confidence when patterns are found
            confidence = min(0.95, confidence + len(matched_patterns) * 0.05)
        
        return {
            "scam_probability": float(pattern_score),
            "confidence": float(confidence),
            "model_type": "pattern_matching",
            "matched_patterns": len(matched_patterns),
            "pattern_details": matched_patterns[:5]
        }
    
    def _simulate_sentiment_model(self, text: str) -> Dict[str, Any]:
        """Simulate sentiment analysis model."""
        text_lower = text.lower()
        
        # Simple sentiment-based risk scoring
        negative_words = ['urgent', 'warning', 'danger', 'risk', 'lose', 'miss']
        positive_words = ['guaranteed', 'win', 'profit', 'money', 'earn']
        
        negative_count = sum(text_lower.count(word) for word in negative_words)
        positive_count = sum(text_lower.count(word) for word in positive_words)
        
        # High positive sentiment about money/winning can be suspicious
        sentiment_risk = min(1.0, (positive_count * 0.15 + negative_count * 0.1))
        
        return {
            "scam_probability": float(sentiment_risk),
            "confidence": self.model_confidence["sentiment_analysis"],
            "model_type": "sentiment_analysis",
            "sentiment_features": {
                "negative_indicators": negative_count,
                "positive_indicators": positive_count
            }
        }
    
    def _simulate_entity_model(self, text: str) -> Dict[str, Any]:
        """Simulate named entity recognition model."""
        text_lower = text.lower()
        
        # Simple entity-based risk
        entity_risk = 0.0
        entities_found = []
        
        # Financial entities
        if re.search(r'\$\d+|bitcoin|cryptocurrency|bank|account', text_lower):
            entity_risk += 0.3
            entities_found.append("financial")
        
        # Contact entities
        if re.search(r'@|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|call|email', text_lower):
            entity_risk += 0.2
            entities_found.append("contact")
        
        # Location entities
        if re.search(r'nigeria|ukraine|ghana|philippines', text_lower):
            entity_risk += 0.25
            entities_found.append("suspicious_location")
        
        return {
            "scam_probability": float(min(1.0, entity_risk)),
            "confidence": self.model_confidence["entity_extraction"],
            "model_type": "entity_extraction",
            "entities_detected": entities_found
        }
    
    def _combine_ensemble_predictions(
        self,
        individual_predictions: Dict[str, Dict[str, Any]]
    ) -> float:
        """Combine individual model predictions into ensemble score."""
        weights = {
            "bert": 0.4,
            "pattern": 0.3,
            "sentiment": 0.2,
            "entity": 0.1
        }
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for model_name, prediction in individual_predictions.items():
            if model_name in weights:
                weight = weights[model_name]
                score = prediction.get("scam_probability", 0.0)
                confidence = prediction.get("confidence", 0.5)
                
                # Weight by confidence
                effective_weight = weight * confidence
                weighted_sum += score * effective_weight
                total_weight += effective_weight
        
        if total_weight > 0:
            return weighted_sum / total_weight
        else:
            return 0.5  # Neutral if no valid predictions
    
    def _calculate_ensemble_confidence(
        self,
        individual_predictions: Dict[str, Dict[str, Any]]
    ) -> float:
        """Calculate ensemble confidence."""
        if not individual_predictions:
            return 0.5
        
        # Average individual confidences
        confidences = [
            pred.get("confidence", 0.5)
            for pred in individual_predictions.values()
        ]
        
        avg_confidence = np.mean(confidences)
        
        # Reduce confidence if models disagree
        scores = [
            pred.get("scam_probability", 0.5)
            for pred in individual_predictions.values()
        ]
        
        if len(scores) > 1:
            score_variance = np.var(scores)
            disagreement_penalty = min(0.3, score_variance * 2)
            final_confidence = max(0.1, avg_confidence - disagreement_penalty)
        else:
            final_confidence = avg_confidence
        
        return float(final_confidence)
    
    def _empty_prediction(self) -> Dict[str, Any]:
        """Return prediction for empty/invalid text."""
        return {
            "scam_probability": 0.01,
            "confidence": 0.95,
            "prediction": "not_scam",
            "model_type": "empty_text_handler",
            "matched_patterns": 0,
            "pattern_details": []
        }
    
    def _error_prediction(self, error_msg: str) -> Dict[str, Any]:
        """Return prediction for error cases."""
        return {
            "scam_probability": 0.0,
            "confidence": 0.0,
            "prediction": "error",
            "model_type": "error_handler",
            "error": error_msg,
            "matched_patterns": 0,
            "pattern_details": []
        }


# Global simulator instance
model_simulator = ScamModelSimulator()