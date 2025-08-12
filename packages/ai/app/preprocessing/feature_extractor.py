"""Feature extraction for scam detection."""

import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from textblob import TextBlob
import re

from app.core.config import settings, model_config
from app.preprocessing.text_preprocessor import text_preprocessor

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """Extract features from text for scam detection models."""
    
    def __init__(self):
        self.tfidf_vectorizer = None
        self.count_vectorizer = None
        self.lda_model = None
        self._initialize_vectorizers()
    
    def _initialize_vectorizers(self):
        """Initialize feature extraction models."""
        try:
            # TF-IDF Vectorizer
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=settings.TFIDF_MAX_FEATURES,
                ngram_range=settings.TFIDF_NGRAM_RANGE,
                stop_words='english',
                lowercase=True,
                min_df=2,
                max_df=0.95
            )
            
            # Count Vectorizer for LDA
            self.count_vectorizer = CountVectorizer(
                max_features=1000,
                stop_words='english',
                lowercase=True,
                min_df=2,
                max_df=0.95
            )
            
            logger.info("Feature extractors initialized")
            
        except Exception as e:
            logger.error(f"Error initializing feature extractors: {e}")
    
    def extract_linguistic_features(self, text: str) -> Dict[str, float]:
        """
        Extract linguistic features from text.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of linguistic features
        """
        features = {}
        
        try:
            if not text:
                return features
            
            blob = TextBlob(text)
            
            # Sentiment features
            sentiment = blob.sentiment
            features['sentiment_polarity'] = sentiment.polarity
            features['sentiment_subjectivity'] = sentiment.subjectivity
            
            # Text statistics
            stats = text_preprocessor.get_text_statistics(text)
            features.update(stats)
            
            # Readability features
            features['flesch_kincaid'] = self._calculate_flesch_kincaid(text)
            features['avg_syllables_per_word'] = self._avg_syllables_per_word(text)
            
            # Punctuation features
            features['exclamation_count'] = text.count('!')
            features['question_count'] = text.count('?')
            features['ellipsis_count'] = text.count('...')
            features['caps_lock_ratio'] = self._caps_lock_ratio(text)
            
            # Repetition features
            features['repeated_chars'] = self._repeated_character_ratio(text)
            features['repeated_words'] = self._repeated_word_ratio(text)
            
        except Exception as e:
            logger.error(f"Error extracting linguistic features: {e}")
        
        return features
    
    def extract_scam_pattern_features(self, text: str) -> Dict[str, float]:
        """
        Extract scam-specific pattern features.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of pattern features
        """
        features = {}
        
        try:
            text_lower = text.lower()
            
            # Scam pattern matching
            scam_pattern_count = 0
            for pattern in model_config.SCAM_PATTERNS:
                matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
                features[f'pattern_{pattern[:20]}'] = matches
                scam_pattern_count += matches
            
            features['total_scam_patterns'] = scam_pattern_count
            features['scam_pattern_density'] = scam_pattern_count / len(text.split()) if text.split() else 0
            
            # Urgency keywords
            urgency_count = sum(1 for keyword in model_config.URGENCY_KEYWORDS 
                              if keyword.lower() in text_lower)
            features['urgency_keywords'] = urgency_count
            
            # Financial entities
            financial_count = sum(1 for entity in model_config.FINANCIAL_ENTITIES 
                                if entity.lower() in text_lower)
            features['financial_entities'] = financial_count
            
            # Suspicious domains
            domain_count = sum(1 for domain in model_config.SUSPICIOUS_DOMAINS 
                             if domain in text_lower)
            features['suspicious_domains'] = domain_count
            
            # Contact information pressure
            contact_patterns = [
                r'call\s+(?:me\s+)?(?:now|immediately|asap)',
                r'text\s+(?:me\s+)?(?:now|back|asap)',
                r'email\s+(?:me\s+)?(?:now|back|asap)',
                r'respond\s+(?:now|immediately|asap)',
                r'reply\s+(?:now|immediately|asap)'
            ]
            
            contact_pressure = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) 
                                 for pattern in contact_patterns)
            features['contact_pressure'] = contact_pressure
            
            # Time pressure indicators
            time_patterns = [
                r'(?:expires?|deadline|limited\s+time|offer\s+ends?)',
                r'(?:today|tonight|now|immediately)',
                r'(?:hurry|quick|fast|urgent|asap)',
                r'(?:last\s+chance|final\s+(?:warning|notice))'
            ]
            
            time_pressure = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) 
                              for pattern in time_patterns)
            features['time_pressure'] = time_pressure
            
        except Exception as e:
            logger.error(f"Error extracting scam pattern features: {e}")
        
        return features
    
    def extract_entity_features(self, text: str) -> Dict[str, float]:
        """
        Extract entity-based features.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of entity features
        """
        features = {}
        
        try:
            entities = text_preprocessor.extract_entities(text)
            
            # Entity counts
            features['url_count'] = len(entities.get('urls', []))
            features['email_count'] = len(entities.get('emails', []))
            features['phone_count'] = len(entities.get('phones', []))
            features['crypto_address_count'] = len(entities.get('crypto_addresses', []))
            features['money_amount_count'] = len(entities.get('money_amounts', []))
            
            # Entity ratios (per word)
            word_count = len(text.split())
            if word_count > 0:
                features['url_ratio'] = features['url_count'] / word_count
                features['email_ratio'] = features['email_count'] / word_count
                features['phone_ratio'] = features['phone_count'] / word_count
                features['crypto_ratio'] = features['crypto_address_count'] / word_count
                features['money_ratio'] = features['money_amount_count'] / word_count
            else:
                features['url_ratio'] = 0
                features['email_ratio'] = 0
                features['phone_ratio'] = 0
                features['crypto_ratio'] = 0
                features['money_ratio'] = 0
            
            # Suspicious URL features
            suspicious_url_count = 0
            for url in entities.get('urls', []):
                if any(domain in url for domain in model_config.SUSPICIOUS_DOMAINS):
                    suspicious_url_count += 1
            
            features['suspicious_url_count'] = suspicious_url_count
            features['suspicious_url_ratio'] = (
                suspicious_url_count / features['url_count'] 
                if features['url_count'] > 0 else 0
            )
            
        except Exception as e:
            logger.error(f"Error extracting entity features: {e}")
        
        return features
    
    def extract_tfidf_features(self, texts: List[str], fit: bool = False) -> np.ndarray:
        """
        Extract TF-IDF features from texts.
        
        Args:
            texts: List of texts
            fit: Whether to fit the vectorizer
            
        Returns:
            TF-IDF feature matrix
        """
        try:
            if fit and self.tfidf_vectorizer:
                return self.tfidf_vectorizer.fit_transform(texts).toarray()
            elif self.tfidf_vectorizer:
                return self.tfidf_vectorizer.transform(texts).toarray()
            else:
                logger.error("TF-IDF vectorizer not initialized")
                return np.array([])
        except Exception as e:
            logger.error(f"Error extracting TF-IDF features: {e}")
            return np.array([])
    
    def extract_topic_features(self, texts: List[str], n_topics: int = 10, fit: bool = False) -> np.ndarray:
        """
        Extract topic modeling features using LDA.
        
        Args:
            texts: List of texts
            n_topics: Number of topics
            fit: Whether to fit the model
            
        Returns:
            Topic feature matrix
        """
        try:
            if fit:
                # Fit count vectorizer and LDA
                count_matrix = self.count_vectorizer.fit_transform(texts)
                self.lda_model = LatentDirichletAllocation(
                    n_components=n_topics,
                    random_state=42,
                    max_iter=10
                )
                return self.lda_model.fit_transform(count_matrix)
            elif self.lda_model and self.count_vectorizer:
                count_matrix = self.count_vectorizer.transform(texts)
                return self.lda_model.transform(count_matrix)
            else:
                logger.warning("Topic model not fitted")
                return np.zeros((len(texts), n_topics))
        except Exception as e:
            logger.error(f"Error extracting topic features: {e}")
            return np.array([])
    
    def _calculate_flesch_kincaid(self, text: str) -> float:
        """Calculate Flesch-Kincaid readability score."""
        try:
            words = text.split()
            sentences = text.count('.') + text.count('!') + text.count('?')
            syllables = sum(self._count_syllables(word) for word in words)
            
            if sentences == 0 or len(words) == 0:
                return 0.0
            
            score = (206.835 - 1.015 * (len(words) / sentences) - 
                    84.6 * (syllables / len(words)))
            return max(0.0, min(100.0, score))
        except:
            return 0.0
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word."""
        word = word.lower()
        vowels = "aeiouy"
        count = 0
        prev_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                count += 1
            prev_was_vowel = is_vowel
        
        if word.endswith('e'):
            count -= 1
        
        return max(1, count)
    
    def _avg_syllables_per_word(self, text: str) -> float:
        """Calculate average syllables per word."""
        try:
            words = text.split()
            if not words:
                return 0.0
            
            total_syllables = sum(self._count_syllables(word) for word in words)
            return total_syllables / len(words)
        except:
            return 0.0
    
    def _caps_lock_ratio(self, text: str) -> float:
        """Calculate ratio of uppercase letters."""
        if not text:
            return 0.0
        
        uppercase_count = sum(1 for c in text if c.isupper())
        return uppercase_count / len(text)
    
    def _repeated_character_ratio(self, text: str) -> float:
        """Calculate ratio of repeated characters (e.g., 'aaaa')."""
        if not text:
            return 0.0
        
        repeated_count = len(re.findall(r'(.)\1{2,}', text))
        return repeated_count / len(text)
    
    def _repeated_word_ratio(self, text: str) -> float:
        """Calculate ratio of repeated words."""
        words = text.lower().split()
        if len(words) < 2:
            return 0.0
        
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        repeated_words = sum(count - 1 for count in word_counts.values() if count > 1)
        return repeated_words / len(words)
    
    def extract_all_features(self, text: str) -> Dict[str, Any]:
        """
        Extract all available features from text.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary containing all features
        """
        all_features = {}
        
        try:
            # Linguistic features
            linguistic_features = self.extract_linguistic_features(text)
            all_features.update(linguistic_features)
            
            # Scam pattern features
            pattern_features = self.extract_scam_pattern_features(text)
            all_features.update(pattern_features)
            
            # Entity features
            entity_features = self.extract_entity_features(text)
            all_features.update(entity_features)
            
            logger.info(f"Extracted {len(all_features)} features from text")
            
        except Exception as e:
            logger.error(f"Error extracting all features: {e}")
        
        return all_features
    
    def prepare_feature_vector(self, features: Dict[str, Any]) -> np.ndarray:
        """
        Convert feature dictionary to numpy array.
        
        Args:
            features: Dictionary of features
            
        Returns:
            Feature vector as numpy array
        """
        try:
            # Get numeric features only
            numeric_features = {k: v for k, v in features.items() 
                              if isinstance(v, (int, float)) and not np.isnan(v)}
            
            if not numeric_features:
                return np.array([])
            
            # Convert to array
            feature_vector = np.array(list(numeric_features.values()))
            
            # Handle any remaining NaN values
            feature_vector = np.nan_to_num(feature_vector)
            
            return feature_vector
            
        except Exception as e:
            logger.error(f"Error preparing feature vector: {e}")
            return np.array([])


# Global feature extractor instance
feature_extractor = FeatureExtractor()