"""BERT-based text classifier for scam detection."""

import logging
from typing import List, Dict, Tuple, Optional
import torch
import torch.nn as nn
import numpy as np
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification,
    AutoConfig,
    pipeline
)
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import pickle
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


class BERTScamClassifier:
    """BERT-based classifier for scam detection."""
    
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.BERT_MODEL_NAME
        self.tokenizer = None
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.classifier = None
        self.is_loaded = False
        
        # Model metadata
        self.model_version = "1.0.0"
        self.training_date = None
        self.performance_metrics = {}
    
    def load_model(self, model_path: Optional[str] = None) -> bool:
        """
        Load BERT model for inference.
        
        Args:
            model_path: Path to custom trained model (optional)
            
        Returns:
            True if model loaded successfully
        """
        try:
            if model_path and Path(model_path).exists():
                # Load custom trained model
                logger.info(f"Loading custom model from {model_path}")
                self.tokenizer = AutoTokenizer.from_pretrained(model_path)
                self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
            else:
                # Load pre-trained model for simulation
                logger.info(f"Loading pre-trained model: {self.model_name}")
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                
                # Create a simulation model with custom configuration
                config = AutoConfig.from_pretrained(self.model_name)
                config.num_labels = 2  # Binary classification: scam/not scam
                self.model = AutoModelForSequenceClassification.from_pretrained(
                    self.model_name, 
                    config=config,
                    ignore_mismatched_sizes=True
                )
            
            # Move model to device
            self.model.to(self.device)
            self.model.eval()
            
            # Create classification pipeline
            self.classifier = pipeline(
                "text-classification",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device.type == 'cuda' else -1,
                return_all_scores=True
            )
            
            self.is_loaded = True
            logger.info("BERT model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading BERT model: {e}")
            self.is_loaded = False
            return False
    
    def predict_single(self, text: str) -> Dict[str, float]:
        """
        Predict scam probability for a single text.
        
        Args:
            text: Input text to classify
            
        Returns:
            Dictionary with prediction results
        """
        if not self.is_loaded:
            logger.error("Model not loaded")
            return {"scam_probability": 0.0, "confidence": 0.0, "prediction": "not_scam"}
        
        try:
            # Truncate text if too long
            if len(text) > settings.BERT_MAX_LENGTH * 4:  # Rough character limit
                text = text[:settings.BERT_MAX_LENGTH * 4]
            
            # Get prediction from pipeline
            results = self.classifier(text)
            
            # Extract probabilities (assuming binary classification)
            if isinstance(results[0], list):
                scores = {result['label']: result['score'] for result in results[0]}
            else:
                scores = {results[0]['label']: results[0]['score']}
            
            # Map labels to our format
            scam_prob = self._extract_scam_probability(scores)
            confidence = max(scores.values())
            prediction = "scam" if scam_prob > settings.SCAM_THRESHOLD else "not_scam"
            
            return {
                "scam_probability": float(scam_prob),
                "confidence": float(confidence),
                "prediction": prediction,
                "raw_scores": scores
            }
            
        except Exception as e:
            logger.error(f"Error in BERT prediction: {e}")
            return {"scam_probability": 0.0, "confidence": 0.0, "prediction": "not_scam"}
    
    def predict_batch(self, texts: List[str]) -> List[Dict[str, float]]:
        """
        Predict scam probability for multiple texts.
        
        Args:
            texts: List of texts to classify
            
        Returns:
            List of prediction results
        """
        if not self.is_loaded:
            logger.error("Model not loaded")
            return [{"scam_probability": 0.0, "confidence": 0.0, "prediction": "not_scam"}] * len(texts)
        
        try:
            results = []
            
            # Process in batches to manage memory
            batch_size = settings.BERT_BATCH_SIZE
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                
                # Truncate texts if necessary
                processed_batch = []
                for text in batch:
                    if len(text) > settings.BERT_MAX_LENGTH * 4:
                        text = text[:settings.BERT_MAX_LENGTH * 4]
                    processed_batch.append(text)
                
                # Get batch predictions
                batch_results = self.classifier(processed_batch)
                
                # Process results
                for j, result in enumerate(batch_results):
                    if isinstance(result, list):
                        scores = {r['label']: r['score'] for r in result}
                    else:
                        scores = {result['label']: result['score']}
                    
                    scam_prob = self._extract_scam_probability(scores)
                    confidence = max(scores.values())
                    prediction = "scam" if scam_prob > settings.SCAM_THRESHOLD else "not_scam"
                    
                    results.append({
                        "scam_probability": float(scam_prob),
                        "confidence": float(confidence),
                        "prediction": prediction,
                        "raw_scores": scores
                    })
            
            logger.info(f"Processed batch of {len(texts)} texts")
            return results
            
        except Exception as e:
            logger.error(f"Error in batch prediction: {e}")
            return [{"scam_probability": 0.0, "confidence": 0.0, "prediction": "not_scam"}] * len(texts)
    
    def _extract_scam_probability(self, scores: Dict[str, float]) -> float:
        """Extract scam probability from model scores."""
        # Handle different label formats
        scam_labels = ['LABEL_1', 'scam', 'SCAM', '1', 'positive', 'POSITIVE']
        not_scam_labels = ['LABEL_0', 'not_scam', 'NOT_SCAM', '0', 'negative', 'NEGATIVE']
        
        scam_prob = 0.0
        for label in scam_labels:
            if label in scores:
                scam_prob = scores[label]
                break
        
        # If no direct scam label found, infer from not_scam probability
        if scam_prob == 0.0:
            for label in not_scam_labels:
                if label in scores:
                    scam_prob = 1.0 - scores[label]
                    break
        
        # If still no match, use simulation logic
        if scam_prob == 0.0 and scores:
            # For simulation, assume first label is positive class
            first_score = list(scores.values())[0]
            scam_prob = first_score if len(scores) == 1 else first_score
        
        return scam_prob
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        return {
            "model_name": self.model_name,
            "is_loaded": self.is_loaded,
            "device": str(self.device),
            "model_version": self.model_version,
            "training_date": self.training_date,
            "performance_metrics": self.performance_metrics,
            "max_length": settings.BERT_MAX_LENGTH
        }
    
    def save_model(self, save_path: str) -> bool:
        """
        Save the current model.
        
        Args:
            save_path: Directory to save the model
            
        Returns:
            True if saved successfully
        """
        try:
            if not self.is_loaded:
                logger.error("No model to save")
                return False
            
            save_dir = Path(save_path)
            save_dir.mkdir(parents=True, exist_ok=True)
            
            # Save model and tokenizer
            self.model.save_pretrained(save_dir)
            self.tokenizer.save_pretrained(save_dir)
            
            # Save metadata
            metadata = {
                "model_version": self.model_version,
                "training_date": self.training_date,
                "performance_metrics": self.performance_metrics,
                "model_name": self.model_name
            }
            
            with open(save_dir / "metadata.pkl", "wb") as f:
                pickle.dump(metadata, f)
            
            logger.info(f"Model saved to {save_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            return False
    
    def evaluate(self, texts: List[str], labels: List[int]) -> Dict[str, float]:
        """
        Evaluate model performance.
        
        Args:
            texts: List of texts
            labels: True labels (0 for not_scam, 1 for scam)
            
        Returns:
            Dictionary of performance metrics
        """
        try:
            predictions = self.predict_batch(texts)
            pred_labels = [1 if p["prediction"] == "scam" else 0 for p in predictions]
            
            accuracy = accuracy_score(labels, pred_labels)
            precision, recall, f1, _ = precision_recall_fscore_support(
                labels, pred_labels, average='binary'
            )
            
            metrics = {
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1)
            }
            
            self.performance_metrics = metrics
            logger.info(f"Model evaluation: {metrics}")
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error evaluating model: {e}")
            return {}


class ScamPatternSimulator:
    """Simulate BERT-like behavior for scam pattern detection."""
    
    def __init__(self):
        self.scam_patterns = [
            # High-risk patterns (0.8-0.95 probability)
            r"guaranteed\s+(?:returns?|profit|money)",
            r"risk\s*-?\s*free\s+investment",
            r"double\s+your\s+money",
            r"act\s+now\s+or\s+lose\s+out",
            r"limited\s+time\s+offer\s+expires?",
            r"urgent\s+action\s+required",
            r"verify\s+your\s+account\s+immediately",
            r"suspended\s+account\s+warning",
            r"click\s+here\s+to\s+claim",
            r"you\s+(?:have\s+)?won\s+\$?\d+",
            
            # Medium-risk patterns (0.6-0.79 probability)
            r"make\s+money\s+(?:fast|quickly|easy)",
            r"work\s+from\s+home\s+opportunity",
            r"investment\s+opportunity",
            r"bitcoin\s+(?:investment|trading|giveaway)",
            r"cryptocurrency\s+offer",
            r"need\s+money\s+for\s+emergency",
            r"western\s+union\s+transfer",
            r"gift\s+card\s+payment",
            r"confirm\s+your\s+(?:identity|details)",
            r"update\s+your\s+payment\s+method",
            
            # Lower-risk patterns (0.4-0.59 probability)
            r"special\s+offer\s+for\s+you",
            r"exclusive\s+deal",
            r"congratulations\s+you\s+qualify",
            r"pre\s*-?\s*approved",
            r"no\s+credit\s+check",
            r"call\s+(?:now|today)",
            r"limited\s+(?:spots|availability)",
            r"don\'?t\s+miss\s+out"
        ]
        
        # Compile patterns
        self.compiled_patterns = [
            (re.compile(pattern, re.IGNORECASE), self._get_pattern_weight(i))
            for i, pattern in enumerate(self.scam_patterns)
        ]
    
    def _get_pattern_weight(self, pattern_index: int) -> float:
        """Get weight for pattern based on its risk level."""
        if pattern_index < 10:  # High-risk patterns
            return np.random.uniform(0.8, 0.95)
        elif pattern_index < 20:  # Medium-risk patterns  
            return np.random.uniform(0.6, 0.79)
        else:  # Lower-risk patterns
            return np.random.uniform(0.4, 0.59)
    
    def simulate_bert_prediction(self, text: str) -> Dict[str, float]:
        """
        Simulate BERT prediction using advanced model simulator.
        
        Args:
            text: Input text
            
        Returns:
            Simulated prediction results
        """
        try:
            # Use the advanced simulator for more realistic results
            return self.advanced_simulator.simulate_bert_prediction(text)
            
        except Exception as e:
            logger.error(f"Error in BERT simulation: {e}")
            return {"scam_probability": 0.1, "confidence": 0.5, "prediction": "not_scam"}


# Global instances
bert_classifier = BERTScamClassifier()
pattern_simulator = ScamPatternSimulator()