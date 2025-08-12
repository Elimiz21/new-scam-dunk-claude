"""Sentiment analysis for urgency and emotional manipulation detection."""

import logging
from typing import Dict, List, Tuple, Optional
import numpy as np
from textblob import TextBlob
from transformers import pipeline
import re

from app.core.config import settings

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """Analyze sentiment and emotional manipulation in text."""
    
    def __init__(self):
        self.transformer_analyzer = None
        self.urgency_keywords = [
            'urgent', 'immediately', 'asap', 'hurry', 'quickly', 'fast',
            'now', 'today', 'tonight', 'deadline', 'expires', 'limited',
            'last chance', 'final warning', 'don\'t delay', 'act now',
            'time running out', 'while supplies last', 'limited time'
        ]
        
        self.fear_keywords = [
            'danger', 'risk', 'threat', 'warning', 'alert', 'emergency',
            'security', 'breach', 'compromised', 'hacked', 'virus',
            'malware', 'suspended', 'locked', 'frozen', 'terminated',
            'lose', 'loss', 'miss out', 'regret', 'disaster'
        ]
        
        self.greed_keywords = [
            'money', 'cash', 'profit', 'earn', 'rich', 'wealthy',
            'millionaire', 'fortune', 'jackpot', 'win', 'winner',
            'prize', 'reward', 'bonus', 'guaranteed', 'easy money',
            'get rich', 'financial freedom', 'passive income'
        ]
        
        self.trust_keywords = [
            'trust', 'honest', 'legitimate', 'legal', 'authorized',
            'certified', 'verified', 'official', 'government',
            'bank', 'secure', 'safe', 'protected', 'confidential'
        ]
        
        self._initialize_transformer()
    
    def _initialize_transformer(self):
        """Initialize transformer-based sentiment analyzer."""
        try:
            self.transformer_analyzer = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1  # CPU
            )
            logger.info("Transformer sentiment analyzer initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize transformer analyzer: {e}")
            self.transformer_analyzer = None
    
    def analyze_basic_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze basic sentiment using TextBlob.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary with sentiment scores
        """
        try:
            blob = TextBlob(text)
            
            return {
                "polarity": float(blob.sentiment.polarity),  # -1 to 1
                "subjectivity": float(blob.sentiment.subjectivity),  # 0 to 1
                "sentiment_label": self._get_sentiment_label(blob.sentiment.polarity)
            }
        except Exception as e:
            logger.error(f"Error in basic sentiment analysis: {e}")
            return {"polarity": 0.0, "subjectivity": 0.0, "sentiment_label": "neutral"}
    
    def analyze_transformer_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment using transformer model.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary with sentiment scores
        """
        if not self.transformer_analyzer:
            return {"label": "unknown", "score": 0.0}
        
        try:
            # Truncate text if too long
            if len(text) > 512:
                text = text[:512]
            
            result = self.transformer_analyzer(text)[0]
            
            return {
                "label": result["label"].lower(),
                "score": float(result["score"]),
                "normalized_score": self._normalize_transformer_score(result)
            }
        except Exception as e:
            logger.error(f"Error in transformer sentiment analysis: {e}")
            return {"label": "unknown", "score": 0.0, "normalized_score": 0.0}
    
    def analyze_urgency(self, text: str) -> Dict[str, float]:
        """
        Analyze urgency indicators in text.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary with urgency analysis
        """
        try:
            text_lower = text.lower()
            word_count = len(text.split())
            
            # Count urgency keywords
            urgency_count = sum(
                len(re.findall(rf'\b{keyword}\b', text_lower, re.IGNORECASE))
                for keyword in self.urgency_keywords
            )
            
            # Calculate urgency density
            urgency_density = urgency_count / word_count if word_count > 0 else 0
            
            # Check for urgency patterns
            urgency_patterns = [
                r'act\s+now',
                r'limited\s+time',
                r'expires?\s+(?:today|soon|tonight)',
                r'hurry\s+up',
                r'don\'?t\s+(?:delay|wait|hesitate)',
                r'immediately\s+(?:required|needed)',
                r'urgent\s+(?:action|response)',
                r'time\s+(?:is\s+)?running\s+out',
                r'while\s+(?:supplies|stocks?)\s+last',
                r'last\s+(?:chance|opportunity)'
            ]
            
            pattern_matches = sum(
                len(re.findall(pattern, text_lower, re.IGNORECASE))
                for pattern in urgency_patterns
            )
            
            # Calculate urgency score (0-1)
            urgency_score = min(1.0, (urgency_density * 10 + pattern_matches * 0.2))
            
            # Classify urgency level
            if urgency_score >= 0.7:
                urgency_level = "high"
            elif urgency_score >= 0.4:
                urgency_level = "medium"
            elif urgency_score >= 0.1:
                urgency_level = "low"
            else:
                urgency_level = "none"
            
            return {
                "urgency_score": float(urgency_score),
                "urgency_level": urgency_level,
                "urgency_keyword_count": urgency_count,
                "urgency_density": float(urgency_density),
                "urgency_pattern_matches": pattern_matches
            }
            
        except Exception as e:
            logger.error(f"Error analyzing urgency: {e}")
            return {
                "urgency_score": 0.0,
                "urgency_level": "unknown",
                "urgency_keyword_count": 0,
                "urgency_density": 0.0,
                "urgency_pattern_matches": 0
            }
    
    def analyze_emotional_manipulation(self, text: str) -> Dict[str, float]:
        """
        Analyze emotional manipulation tactics.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary with manipulation analysis
        """
        try:
            text_lower = text.lower()
            word_count = len(text.split())
            
            # Count different types of emotional keywords
            fear_count = sum(
                len(re.findall(rf'\b{keyword}\b', text_lower, re.IGNORECASE))
                for keyword in self.fear_keywords
            )
            
            greed_count = sum(
                len(re.findall(rf'\b{keyword}\b', text_lower, re.IGNORECASE))
                for keyword in self.greed_keywords
            )
            
            trust_count = sum(
                len(re.findall(rf'\b{keyword}\b', text_lower, re.IGNORECASE))
                for keyword in self.trust_keywords
            )
            
            # Calculate densities
            fear_density = fear_count / word_count if word_count > 0 else 0
            greed_density = greed_count / word_count if word_count > 0 else 0
            trust_density = trust_count / word_count if word_count > 0 else 0
            
            # Detect specific manipulation patterns
            manipulation_patterns = {
                "authority": [
                    r'government\s+(?:official|agency)',
                    r'bank\s+(?:official|representative)',
                    r'microsoft\s+support',
                    r'apple\s+support',
                    r'authorized\s+(?:agent|representative)',
                    r'certified\s+(?:professional|expert)'
                ],
                "scarcity": [
                    r'limited\s+(?:time|quantity|availability)',
                    r'only\s+\d+\s+(?:left|remaining|available)',
                    r'exclusive\s+offer',
                    r'rare\s+opportunity',
                    r'while\s+supplies\s+last',
                    r'limited\s+spots?'
                ],
                "social_proof": [
                    r'thousands\s+of\s+(?:people|customers)',
                    r'everyone\s+is\s+(?:doing|buying)',
                    r'most\s+popular',
                    r'trending\s+now',
                    r'recommended\s+by',
                    r'#1\s+(?:choice|rated)'
                ]
            }
            
            pattern_counts = {}
            for category, patterns in manipulation_patterns.items():
                count = sum(
                    len(re.findall(pattern, text_lower, re.IGNORECASE))
                    for pattern in patterns
                )
                pattern_counts[category] = count
            
            # Calculate overall manipulation score
            emotion_score = (fear_density + greed_density) * 2 - trust_density
            pattern_score = sum(pattern_counts.values()) * 0.1
            manipulation_score = min(1.0, max(0.0, emotion_score + pattern_score))
            
            # Determine manipulation level
            if manipulation_score >= 0.7:
                manipulation_level = "high"
            elif manipulation_score >= 0.4:
                manipulation_level = "medium"
            elif manipulation_score >= 0.1:
                manipulation_level = "low"
            else:
                manipulation_level = "none"
            
            return {
                "manipulation_score": float(manipulation_score),
                "manipulation_level": manipulation_level,
                "fear_indicators": {
                    "count": fear_count,
                    "density": float(fear_density)
                },
                "greed_indicators": {
                    "count": greed_count,
                    "density": float(greed_density)
                },
                "false_trust_indicators": {
                    "count": trust_count,
                    "density": float(trust_density)
                },
                "manipulation_patterns": pattern_counts
            }
            
        except Exception as e:
            logger.error(f"Error analyzing emotional manipulation: {e}")
            return {
                "manipulation_score": 0.0,
                "manipulation_level": "unknown",
                "fear_indicators": {"count": 0, "density": 0.0},
                "greed_indicators": {"count": 0, "density": 0.0},
                "false_trust_indicators": {"count": 0, "density": 0.0},
                "manipulation_patterns": {}
            }
    
    def _get_sentiment_label(self, polarity: float) -> str:
        """Convert polarity score to label."""
        if polarity > 0.1:
            return "positive"
        elif polarity < -0.1:
            return "negative"
        else:
            return "neutral"
    
    def _normalize_transformer_score(self, result: Dict) -> float:
        """Normalize transformer score to -1 to 1 range."""
        label = result["label"].upper()
        score = result["score"]
        
        if label == "POSITIVE":
            return score
        elif label == "NEGATIVE":
            return -score
        else:
            return 0.0
    
    def analyze_complete_sentiment(self, text: str) -> Dict[str, any]:
        """
        Perform complete sentiment analysis.
        
        Args:
            text: Input text
            
        Returns:
            Complete sentiment analysis results
        """
        try:
            # Basic sentiment
            basic_sentiment = self.analyze_basic_sentiment(text)
            
            # Transformer sentiment
            transformer_sentiment = self.analyze_transformer_sentiment(text)
            
            # Urgency analysis
            urgency_analysis = self.analyze_urgency(text)
            
            # Emotional manipulation analysis
            manipulation_analysis = self.analyze_emotional_manipulation(text)
            
            # Calculate composite scores
            sentiment_risk_score = self._calculate_sentiment_risk(
                basic_sentiment, urgency_analysis, manipulation_analysis
            )
            
            return {
                "basic_sentiment": basic_sentiment,
                "transformer_sentiment": transformer_sentiment,
                "urgency_analysis": urgency_analysis,
                "manipulation_analysis": manipulation_analysis,
                "composite_risk_score": sentiment_risk_score,
                "processing_successful": True
            }
            
        except Exception as e:
            logger.error(f"Error in complete sentiment analysis: {e}")
            return {
                "basic_sentiment": {"polarity": 0.0, "subjectivity": 0.0, "sentiment_label": "unknown"},
                "transformer_sentiment": {"label": "unknown", "score": 0.0},
                "urgency_analysis": {"urgency_score": 0.0, "urgency_level": "unknown"},
                "manipulation_analysis": {"manipulation_score": 0.0, "manipulation_level": "unknown"},
                "composite_risk_score": 0.0,
                "processing_successful": False
            }
    
    def _calculate_sentiment_risk(
        self, 
        basic_sentiment: Dict, 
        urgency_analysis: Dict, 
        manipulation_analysis: Dict
    ) -> float:
        """Calculate composite sentiment risk score."""
        try:
            # Weight different factors
            urgency_weight = 0.4
            manipulation_weight = 0.4
            sentiment_weight = 0.2
            
            # Get individual scores
            urgency_score = urgency_analysis.get("urgency_score", 0.0)
            manipulation_score = manipulation_analysis.get("manipulation_score", 0.0)
            
            # Convert sentiment to risk (negative sentiment = higher risk for scams)
            sentiment_polarity = basic_sentiment.get("polarity", 0.0)
            sentiment_risk = max(0.0, -sentiment_polarity * 0.5 + 0.5)  # Convert to 0-1
            
            # Calculate weighted risk
            composite_risk = (
                urgency_score * urgency_weight +
                manipulation_score * manipulation_weight +
                sentiment_risk * sentiment_weight
            )
            
            return float(min(1.0, max(0.0, composite_risk)))
            
        except Exception as e:
            logger.error(f"Error calculating sentiment risk: {e}")
            return 0.0


# Global sentiment analyzer instance
sentiment_analyzer = SentimentAnalyzer()