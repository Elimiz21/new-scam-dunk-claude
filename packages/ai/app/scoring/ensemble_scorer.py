"""Ensemble scoring system for scam detection."""

import logging
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from dataclasses import dataclass
from datetime import datetime
import json

from app.core.config import settings
from app.models.bert_classifier import bert_classifier, pattern_simulator
from app.models.pattern_matcher import pattern_matcher
from app.models.sentiment_analyzer import sentiment_analyzer
from app.preprocessing.feature_extractor import feature_extractor

logger = logging.getLogger(__name__)


@dataclass
class ModelPrediction:
    """Individual model prediction result."""
    model_name: str
    score: float
    confidence: float
    metadata: Dict[str, Any]
    processing_time: float


@dataclass
class EnsembleResult:
    """Final ensemble prediction result."""
    final_score: float
    risk_level: str
    confidence: float
    explanation: List[str]
    model_predictions: List[ModelPrediction]
    processing_time: float
    timestamp: datetime


class EnsembleScorer:
    """Multi-model ensemble scorer for scam detection."""
    
    def __init__(self):
        self.model_weights = settings.ENSEMBLE_WEIGHTS
        self.risk_thresholds = {
            "critical": 0.9,
            "high": 0.7,
            "medium": 0.5,
            "low": 0.3
        }
        
        # Model availability flags
        self.models_loaded = {
            "bert": False,
            "pattern": True,
            "sentiment": True,
            "ner": False  # Will implement if needed
        }
        
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize all models in the ensemble."""
        try:
            # Try to load BERT model (fallback to pattern simulator)
            self.models_loaded["bert"] = bert_classifier.load_model()
            if not self.models_loaded["bert"]:
                logger.warning("BERT model not available, using pattern simulation")
            
            logger.info(f"Ensemble initialized with models: {self.models_loaded}")
            
        except Exception as e:
            logger.error(f"Error initializing ensemble models: {e}")
    
    def predict_single(self, text: str, explain: bool = True) -> EnsembleResult:
        """
        Generate ensemble prediction for single text.
        
        Args:
            text: Input text to analyze
            explain: Whether to generate explanations
            
        Returns:
            EnsembleResult with final prediction
        """
        start_time = datetime.now()
        model_predictions = []
        explanations = []
        
        try:
            # BERT/Pattern-based prediction
            bert_prediction = self._get_bert_prediction(text)
            model_predictions.append(bert_prediction)
            
            # Pattern matching prediction
            pattern_prediction = self._get_pattern_prediction(text)
            model_predictions.append(pattern_prediction)
            
            # Sentiment analysis prediction
            sentiment_prediction = self._get_sentiment_prediction(text)
            model_predictions.append(sentiment_prediction)
            
            # Calculate ensemble score
            final_score, confidence = self._calculate_ensemble_score(model_predictions)
            
            # Determine risk level
            risk_level = self._determine_risk_level(final_score)
            
            # Generate explanations
            if explain:
                explanations = self._generate_explanations(model_predictions, final_score)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return EnsembleResult(
                final_score=final_score,
                risk_level=risk_level,
                confidence=confidence,
                explanation=explanations,
                model_predictions=model_predictions,
                processing_time=processing_time,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Error in ensemble prediction: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return EnsembleResult(
                final_score=0.0,
                risk_level="error",
                confidence=0.0,
                explanation=[f"Prediction failed: {str(e)}"],
                model_predictions=model_predictions,
                processing_time=processing_time,
                timestamp=datetime.now()
            )
    
    def predict_batch(self, texts: List[str], explain: bool = False) -> List[EnsembleResult]:
        """
        Generate ensemble predictions for multiple texts.
        
        Args:
            texts: List of texts to analyze
            explain: Whether to generate explanations
            
        Returns:
            List of EnsembleResult objects
        """
        results = []
        
        try:
            for i, text in enumerate(texts):
                result = self.predict_single(text, explain=explain)
                results.append(result)
                
                if (i + 1) % 10 == 0:
                    logger.info(f"Processed {i + 1}/{len(texts)} texts")
            
            logger.info(f"Batch processing complete: {len(texts)} texts")
            
        except Exception as e:
            logger.error(f"Error in batch prediction: {e}")
        
        return results
    
    def _get_bert_prediction(self, text: str) -> ModelPrediction:
        """Get BERT model prediction."""
        start_time = datetime.now()
        
        try:
            if self.models_loaded["bert"]:
                result = bert_classifier.predict_single(text)
                score = result.get("scam_probability", 0.0)
                confidence = result.get("confidence", 0.0)
                metadata = result
            else:
                # Use pattern simulator as fallback
                result = pattern_simulator.simulate_bert_prediction(text)
                score = result.get("scam_probability", 0.0)
                confidence = result.get("confidence", 0.0)
                metadata = result
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ModelPrediction(
                model_name="bert",
                score=score,
                confidence=confidence,
                metadata=metadata,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in BERT prediction: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ModelPrediction(
                model_name="bert",
                score=0.0,
                confidence=0.0,
                metadata={"error": str(e)},
                processing_time=processing_time
            )
    
    def _get_pattern_prediction(self, text: str) -> ModelPrediction:
        """Get pattern matching prediction."""
        start_time = datetime.now()
        
        try:
            result = pattern_matcher.analyze_text(text)
            score = result["risk_analysis"].get("risk_score", 0.0)
            confidence = result["risk_analysis"].get("confidence", 0.0)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ModelPrediction(
                model_name="pattern",
                score=score,
                confidence=confidence,
                metadata=result,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in pattern prediction: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ModelPrediction(
                model_name="pattern",
                score=0.0,
                confidence=0.0,
                metadata={"error": str(e)},
                processing_time=processing_time
            )
    
    def _get_sentiment_prediction(self, text: str) -> ModelPrediction:
        """Get sentiment analysis prediction."""
        start_time = datetime.now()
        
        try:
            result = sentiment_analyzer.analyze_complete_sentiment(text)
            score = result.get("composite_risk_score", 0.0)
            
            # Calculate confidence based on analysis quality
            urgency_conf = result["urgency_analysis"].get("urgency_score", 0.0)
            manip_conf = result["manipulation_analysis"].get("manipulation_score", 0.0)
            confidence = (urgency_conf + manip_conf) / 2
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ModelPrediction(
                model_name="sentiment",
                score=score,
                confidence=confidence,
                metadata=result,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in sentiment prediction: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ModelPrediction(
                model_name="sentiment",
                score=0.0,
                confidence=0.0,
                metadata={"error": str(e)},
                processing_time=processing_time
            )
    
    def _calculate_ensemble_score(self, predictions: List[ModelPrediction]) -> Tuple[float, float]:
        """
        Calculate weighted ensemble score.
        
        Args:
            predictions: List of model predictions
            
        Returns:
            Tuple of (final_score, confidence)
        """
        try:
            if not predictions:
                return 0.0, 0.0
            
            total_weighted_score = 0.0
            total_weight = 0.0
            confidence_scores = []
            
            for pred in predictions:
                model_weight = self.model_weights.get(pred.model_name, 0.1)
                
                # Apply confidence weighting
                effective_weight = model_weight * pred.confidence
                
                total_weighted_score += pred.score * effective_weight
                total_weight += effective_weight
                confidence_scores.append(pred.confidence)
            
            # Calculate final score
            if total_weight > 0:
                final_score = total_weighted_score / total_weight
            else:
                final_score = np.mean([pred.score for pred in predictions])
            
            # Calculate ensemble confidence
            avg_confidence = np.mean(confidence_scores) if confidence_scores else 0.0
            confidence_variance = np.var(confidence_scores) if len(confidence_scores) > 1 else 0.0
            
            # Reduce confidence if models disagree
            disagreement_penalty = min(0.3, confidence_variance * 2)
            ensemble_confidence = max(0.1, avg_confidence - disagreement_penalty)
            
            return float(final_score), float(ensemble_confidence)
            
        except Exception as e:
            logger.error(f"Error calculating ensemble score: {e}")
            return 0.0, 0.0
    
    def _determine_risk_level(self, score: float) -> str:
        """Determine risk level from score."""
        if score >= self.risk_thresholds["critical"]:
            return "critical"
        elif score >= self.risk_thresholds["high"]:
            return "high"
        elif score >= self.risk_thresholds["medium"]:
            return "medium"
        elif score >= self.risk_thresholds["low"]:
            return "low"
        else:
            return "minimal"
    
    def _generate_explanations(self, predictions: List[ModelPrediction], final_score: float) -> List[str]:
        """
        Generate human-readable explanations.
        
        Args:
            predictions: List of model predictions
            final_score: Final ensemble score
            
        Returns:
            List of explanation strings
        """
        explanations = []
        
        try:
            # Overall assessment
            risk_level = self._determine_risk_level(final_score)
            explanations.append(f"Overall risk level: {risk_level.upper()} ({final_score:.2f})")
            
            # Individual model contributions
            for pred in predictions:
                if pred.score > 0.5:  # Only explain significant scores
                    if pred.model_name == "bert":
                        explanations.append(f"AI language model detected {pred.score:.1%} scam probability")
                    
                    elif pred.model_name == "pattern":
                        pattern_data = pred.metadata.get("risk_analysis", {})
                        match_count = pred.metadata.get("total_matches", 0)
                        if match_count > 0:
                            explanations.append(f"Pattern analysis found {match_count} suspicious indicators")
                    
                    elif pred.model_name == "sentiment":
                        sentiment_data = pred.metadata.get("urgency_analysis", {})
                        urgency_level = sentiment_data.get("urgency_level", "unknown")
                        if urgency_level in ["high", "medium"]:
                            explanations.append(f"High urgency/pressure tactics detected")
            
            # Specific warnings based on patterns
            for pred in predictions:
                if pred.model_name == "pattern" and pred.score > 0.6:
                    categories = pred.metadata.get("matches_by_category", {})
                    high_risk_categories = [cat for cat in categories.keys() 
                                          if "scam" in cat or "phishing" in cat]
                    if high_risk_categories:
                        explanations.append(f"Contains {', '.join(high_risk_categories[:2])} indicators")
            
            # Confidence warnings
            confidences = [pred.confidence for pred in predictions]
            avg_confidence = np.mean(confidences) if confidences else 0.0
            
            if avg_confidence < 0.5:
                explanations.append("Low confidence prediction - manual review recommended")
            elif final_score > 0.8 and avg_confidence > 0.8:
                explanations.append("High confidence scam detection - immediate action recommended")
            
        except Exception as e:
            logger.error(f"Error generating explanations: {e}")
            explanations.append("Unable to generate detailed explanation")
        
        return explanations
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of all models in ensemble."""
        return {
            "models_loaded": self.models_loaded,
            "model_weights": self.model_weights,
            "risk_thresholds": self.risk_thresholds,
            "ensemble_ready": any(self.models_loaded.values())
        }
    
    def update_weights(self, new_weights: Dict[str, float]) -> bool:
        """
        Update model weights.
        
        Args:
            new_weights: Dictionary of new weights
            
        Returns:
            True if updated successfully
        """
        try:
            # Validate weights
            if not all(0 <= weight <= 1 for weight in new_weights.values()):
                raise ValueError("Weights must be between 0 and 1")
            
            # Normalize weights to sum to 1
            total_weight = sum(new_weights.values())
            if total_weight > 0:
                normalized_weights = {k: v/total_weight for k, v in new_weights.items()}
                self.model_weights.update(normalized_weights)
                logger.info(f"Updated model weights: {self.model_weights}")
                return True
            else:
                raise ValueError("Total weight must be greater than 0")
                
        except Exception as e:
            logger.error(f"Error updating weights: {e}")
            return False
    
    def calibrate_thresholds(self, validation_data: List[Dict]) -> Dict[str, float]:
        """
        Calibrate risk thresholds based on validation data.
        
        Args:
            validation_data: List of {text, label} dictionaries
            
        Returns:
            Optimal thresholds
        """
        try:
            if not validation_data:
                return self.risk_thresholds
            
            # Get predictions for validation data
            texts = [item["text"] for item in validation_data]
            labels = [item["label"] for item in validation_data]  # 0/1 labels
            
            results = self.predict_batch(texts, explain=False)
            scores = [result.final_score for result in results]
            
            # Find optimal threshold using F1 score
            best_threshold = 0.5
            best_f1 = 0.0
            
            for threshold in np.arange(0.1, 0.95, 0.05):
                predictions = [1 if score >= threshold else 0 for score in scores]
                
                # Calculate F1 score
                tp = sum(1 for p, l in zip(predictions, labels) if p == 1 and l == 1)
                fp = sum(1 for p, l in zip(predictions, labels) if p == 1 and l == 0)
                fn = sum(1 for p, l in zip(predictions, labels) if p == 0 and l == 1)
                
                precision = tp / (tp + fp) if (tp + fp) > 0 else 0
                recall = tp / (tp + fn) if (tp + fn) > 0 else 0
                f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
                
                if f1 > best_f1:
                    best_f1 = f1
                    best_threshold = threshold
            
            # Update thresholds based on optimal threshold
            optimized_thresholds = {
                "critical": min(0.95, best_threshold + 0.2),
                "high": best_threshold,
                "medium": max(0.3, best_threshold - 0.2),
                "low": max(0.1, best_threshold - 0.4)
            }
            
            logger.info(f"Calibrated thresholds: {optimized_thresholds} (F1: {best_f1:.3f})")
            return optimized_thresholds
            
        except Exception as e:
            logger.error(f"Error calibrating thresholds: {e}")
            return self.risk_thresholds


# Global ensemble scorer instance
ensemble_scorer = EnsembleScorer()