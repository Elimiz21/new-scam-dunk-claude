"""Text preprocessing pipeline for scam detection."""

import re
import string
from typing import List, Dict, Tuple, Optional
import logging
import unicodedata
from langdetect import detect, DetectorFactory
from textblob import TextBlob
import emoji
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

from app.core.config import settings

# Set seed for consistent language detection
DetectorFactory.seed = 0

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
except Exception as e:
    logging.warning(f"Failed to download NLTK data: {e}")

logger = logging.getLogger(__name__)


class TextPreprocessor:
    """Comprehensive text preprocessing for scam detection."""
    
    def __init__(self):
        self.stemmer = PorterStemmer()
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
        # Initialize TF-IDF vectorizer
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=settings.TFIDF_MAX_FEATURES,
            ngram_range=settings.TFIDF_NGRAM_RANGE,
            stop_words='english',
            lowercase=True,
            token_pattern=r'\b[a-zA-Z]{2,}\b'
        )
        
        # Compile regex patterns
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Compile frequently used regex patterns."""
        self.url_pattern = re.compile(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',
            re.IGNORECASE
        )
        self.email_pattern = re.compile(
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        )
        self.phone_pattern = re.compile(
            r'(\+?1[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})'
        )
        self.crypto_address_pattern = re.compile(
            r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b|0x[a-fA-F0-9]{40}\b'
        )
        self.money_pattern = re.compile(
            r'\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:dollars?|USD|euros?|EUR|pounds?|GBP)'
        )
        self.special_chars_pattern = re.compile(r'[^\w\s]')
        self.whitespace_pattern = re.compile(r'\s+')
    
    def normalize_text(self, text: str) -> str:
        """
        Normalize text by handling encoding, case, and basic cleaning.
        
        Args:
            text: Input text to normalize
            
        Returns:
            Normalized text
        """
        try:
            # Handle None or empty text
            if not text or not isinstance(text, str):
                return ""
            
            # Normalize Unicode characters
            text = unicodedata.normalize('NFKD', text)
            
            # Convert to lowercase
            text = text.lower()
            
            # Remove extra whitespace
            text = self.whitespace_pattern.sub(' ', text).strip()
            
            return text
            
        except Exception as e:
            logger.error(f"Error normalizing text: {e}")
            return ""
    
    def handle_emojis(self, text: str, strategy: str = "convert") -> str:
        """
        Handle emojis in text.
        
        Args:
            text: Input text
            strategy: 'remove', 'convert', or 'keep'
            
        Returns:
            Processed text
        """
        if strategy == "remove":
            return emoji.replace_emoji(text, replace='')
        elif strategy == "convert":
            return emoji.demojize(text, delimiters=(" ", " "))
        else:  # keep
            return text
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract various entities from text.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of extracted entities
        """
        entities = {
            'urls': [],
            'emails': [],
            'phones': [],
            'crypto_addresses': [],
            'money_amounts': []
        }
        
        try:
            # Extract URLs
            entities['urls'] = self.url_pattern.findall(text)
            
            # Extract emails
            entities['emails'] = self.email_pattern.findall(text)
            
            # Extract phone numbers
            phone_matches = self.phone_pattern.findall(text)
            entities['phones'] = [''.join(match) for match in phone_matches]
            
            # Extract crypto addresses
            entities['crypto_addresses'] = self.crypto_address_pattern.findall(text)
            
            # Extract money amounts
            entities['money_amounts'] = self.money_pattern.findall(text)
            
        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
        
        return entities
    
    def detect_language(self, text: str) -> str:
        """
        Detect the language of the text.
        
        Args:
            text: Input text
            
        Returns:
            Language code (e.g., 'en', 'es', 'fr')
        """
        try:
            if len(text.strip()) < 10:
                return 'unknown'
            
            lang = detect(text)
            return lang if lang in settings.SUPPORTED_LANGUAGES else 'unknown'
            
        except Exception as e:
            logger.error(f"Error detecting language: {e}")
            return 'unknown'
    
    def correct_spelling(self, text: str) -> str:
        """
        Perform basic spelling correction.
        
        Args:
            text: Input text
            
        Returns:
            Spell-corrected text
        """
        try:
            blob = TextBlob(text)
            return str(blob.correct())
        except Exception as e:
            logger.error(f"Error correcting spelling: {e}")
            return text
    
    def tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into words.
        
        Args:
            text: Input text
            
        Returns:
            List of tokens
        """
        try:
            tokens = word_tokenize(text)
            # Filter out punctuation and short tokens
            tokens = [token for token in tokens if token.isalnum() and len(token) > 1]
            return tokens
        except Exception as e:
            logger.error(f"Error tokenizing text: {e}")
            return []
    
    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """
        Remove stop words from tokens.
        
        Args:
            tokens: List of tokens
            
        Returns:
            Filtered tokens
        """
        return [token for token in tokens if token.lower() not in self.stop_words]
    
    def stem_tokens(self, tokens: List[str]) -> List[str]:
        """
        Apply stemming to tokens.
        
        Args:
            tokens: List of tokens
            
        Returns:
            Stemmed tokens
        """
        return [self.stemmer.stem(token) for token in tokens]
    
    def lemmatize_tokens(self, tokens: List[str]) -> List[str]:
        """
        Apply lemmatization to tokens.
        
        Args:
            tokens: List of tokens
            
        Returns:
            Lemmatized tokens
        """
        return [self.lemmatizer.lemmatize(token) for token in tokens]
    
    def extract_features(self, texts: List[str], fit: bool = False) -> np.ndarray:
        """
        Extract TF-IDF features from texts.
        
        Args:
            texts: List of texts to process
            fit: Whether to fit the vectorizer
            
        Returns:
            TF-IDF feature matrix
        """
        try:
            if fit:
                return self.tfidf_vectorizer.fit_transform(texts).toarray()
            else:
                return self.tfidf_vectorizer.transform(texts).toarray()
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return np.array([])
    
    def get_text_statistics(self, text: str) -> Dict[str, float]:
        """
        Calculate text statistics.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of statistics
        """
        try:
            # Basic counts
            char_count = len(text)
            word_count = len(text.split())
            sentence_count = len(sent_tokenize(text))
            
            # Calculate ratios
            avg_word_length = np.mean([len(word) for word in text.split()]) if word_count > 0 else 0
            avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0
            
            # Special character ratio
            special_chars = len(self.special_chars_pattern.findall(text))
            special_char_ratio = special_chars / char_count if char_count > 0 else 0
            
            # Uppercase ratio
            uppercase_chars = sum(1 for c in text if c.isupper())
            uppercase_ratio = uppercase_chars / char_count if char_count > 0 else 0
            
            # Digit ratio
            digits = sum(1 for c in text if c.isdigit())
            digit_ratio = digits / char_count if char_count > 0 else 0
            
            return {
                'char_count': char_count,
                'word_count': word_count,
                'sentence_count': sentence_count,
                'avg_word_length': avg_word_length,
                'avg_sentence_length': avg_sentence_length,
                'special_char_ratio': special_char_ratio,
                'uppercase_ratio': uppercase_ratio,
                'digit_ratio': digit_ratio
            }
            
        except Exception as e:
            logger.error(f"Error calculating text statistics: {e}")
            return {}
    
    def preprocess(
        self,
        text: str,
        normalize: bool = True,
        handle_emojis: str = "convert",
        extract_entities: bool = True,
        tokenize: bool = True,
        remove_stopwords: bool = True,
        apply_stemming: bool = False,
        apply_lemmatization: bool = True,
        correct_spelling: bool = False,
        get_stats: bool = True
    ) -> Dict:
        """
        Complete preprocessing pipeline.
        
        Args:
            text: Input text to process
            normalize: Whether to normalize text
            handle_emojis: How to handle emojis ('remove', 'convert', 'keep')
            extract_entities: Whether to extract entities
            tokenize: Whether to tokenize
            remove_stopwords: Whether to remove stop words
            apply_stemming: Whether to apply stemming
            apply_lemmatization: Whether to apply lemmatization
            correct_spelling: Whether to correct spelling
            get_stats: Whether to calculate statistics
            
        Returns:
            Dictionary containing processed text and metadata
        """
        result = {
            'original_text': text,
            'processed_text': text,
            'language': 'unknown',
            'entities': {},
            'tokens': [],
            'statistics': {},
            'processing_steps': []
        }
        
        try:
            # Validate input
            if not text or not isinstance(text, str):
                logger.warning("Invalid input text")
                return result
            
            if len(text) < settings.MIN_TEXT_LENGTH:
                logger.warning(f"Text too short: {len(text)} characters")
                return result
            
            if len(text) > settings.MAX_TEXT_LENGTH:
                logger.warning(f"Text too long, truncating: {len(text)} characters")
                text = text[:settings.MAX_TEXT_LENGTH]
            
            processed_text = text
            
            # Language detection
            result['language'] = self.detect_language(processed_text)
            result['processing_steps'].append('language_detection')
            
            # Entity extraction (before normalization)
            if extract_entities:
                result['entities'] = self.extract_entities(processed_text)
                result['processing_steps'].append('entity_extraction')
            
            # Text normalization
            if normalize:
                processed_text = self.normalize_text(processed_text)
                result['processing_steps'].append('normalization')
            
            # Emoji handling
            if handle_emojis != "keep":
                processed_text = self.handle_emojis(processed_text, handle_emojis)
                result['processing_steps'].append(f'emoji_{handle_emojis}')
            
            # Spell correction
            if correct_spelling and result['language'] == 'en':
                processed_text = self.correct_spelling(processed_text)
                result['processing_steps'].append('spell_correction')
            
            # Tokenization
            if tokenize:
                tokens = self.tokenize(processed_text)
                result['processing_steps'].append('tokenization')
                
                # Stop word removal
                if remove_stopwords:
                    tokens = self.remove_stopwords(tokens)
                    result['processing_steps'].append('stopword_removal')
                
                # Stemming or Lemmatization
                if apply_stemming:
                    tokens = self.stem_tokens(tokens)
                    result['processing_steps'].append('stemming')
                elif apply_lemmatization:
                    tokens = self.lemmatize_tokens(tokens)
                    result['processing_steps'].append('lemmatization')
                
                result['tokens'] = tokens
                processed_text = ' '.join(tokens)
            
            result['processed_text'] = processed_text
            
            # Statistics
            if get_stats:
                result['statistics'] = self.get_text_statistics(result['original_text'])
                result['processing_steps'].append('statistics')
            
            logger.info(f"Successfully preprocessed text with steps: {result['processing_steps']}")
            
        except Exception as e:
            logger.error(f"Error in preprocessing pipeline: {e}")
        
        return result


# Global preprocessor instance
text_preprocessor = TextPreprocessor()