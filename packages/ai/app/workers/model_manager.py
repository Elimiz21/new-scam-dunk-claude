"""Background worker for model management and updates."""

import logging
import asyncio
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import hashlib
import pickle

from app.core.config import settings
from app.models.bert_classifier import bert_classifier
from app.scoring.ensemble_scorer import ensemble_scorer
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)


class ModelManager:
    """Background manager for AI model lifecycle."""
    
    def __init__(self):
        self.is_running = False
        self.last_update_check = None
        self.model_versions = {}
        self.performance_tracking = {
            "predictions_made": 0,
            "avg_processing_time": 0.0,
            "accuracy_samples": [],
            "drift_alerts": []
        }
    
    async def start(self):
        """Start the model manager."""
        if self.is_running:
            logger.warning("Model manager already running")
            return
        
        self.is_running = True
        logger.info("Starting model manager...")
        
        try:
            # Initialize model versions tracking
            await self._initialize_version_tracking()
            
            # Start management tasks
            tasks = [
                asyncio.create_task(self._model_health_monitor()),
                asyncio.create_task(self._performance_tracker()),
                asyncio.create_task(self._model_update_checker()),
                asyncio.create_task(self._drift_detector())
            ]
            
            # Wait for all tasks
            await asyncio.gather(*tasks, return_exceptions=True)
            
        except Exception as e:
            logger.error(f"Error in model manager: {e}")
        finally:
            self.is_running = False
            logger.info("Model manager stopped")
    
    async def stop(self):
        """Stop the model manager."""
        self.is_running = False
        logger.info("Stopping model manager...")
    
    async def reload_models(self) -> Dict[str, bool]:
        """
        Reload all models.
        
        Returns:
            Dictionary of model reload statuses
        """
        try:
            logger.info("Reloading all models...")
            
            results = {}
            
            # Reload BERT model
            results["bert"] = bert_classifier.load_model()
            
            # Reinitialize ensemble scorer
            ensemble_scorer._initialize_models()
            results["ensemble"] = True
            
            # Update version tracking
            await self._update_version_tracking()
            
            logger.info(f"Model reload completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Error reloading models: {e}")
            return {"error": str(e)}
    
    async def update_model_weights(self, new_weights: Dict[str, float]) -> bool:
        """
        Update ensemble model weights.
        
        Args:
            new_weights: New model weights
            
        Returns:
            True if successful
        """
        try:
            success = ensemble_scorer.update_weights(new_weights)
            
            if success:
                # Log the update
                await redis_service.set_cache(
                    "model_weights_update",
                    {
                        "weights": new_weights,
                        "updated_at": datetime.now().isoformat(),
                        "updated_by": "model_manager"
                    },
                    expire=86400  # 24 hours
                )
                
                logger.info(f"Updated model weights: {new_weights}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error updating model weights: {e}")
            return False
    
    async def get_model_performance(self) -> Dict[str, Any]:
        """Get comprehensive model performance metrics."""
        try:
            # Get ensemble status
            ensemble_status = ensemble_scorer.get_model_status()
            
            # Get BERT model info
            bert_info = bert_classifier.get_model_info()
            
            # Get performance tracking data
            performance_data = {
                **self.performance_tracking,
                "last_update_check": self.last_update_check.isoformat() if self.last_update_check else None,
                "model_versions": self.model_versions
            }
            
            return {
                "ensemble_status": ensemble_status,
                "bert_info": bert_info,
                "performance_tracking": performance_data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting model performance: {e}")
            return {"error": str(e)}
    
    async def record_prediction(
        self,
        model_name: str,
        processing_time: float,
        confidence: float,
        prediction_data: Optional[Dict[str, Any]] = None
    ):
        """
        Record a prediction for performance tracking.
        
        Args:
            model_name: Name of the model
            processing_time: Time taken for prediction
            confidence: Prediction confidence
            prediction_data: Additional prediction data
        """
        try:
            self.performance_tracking["predictions_made"] += 1
            
            # Update average processing time
            current_avg = self.performance_tracking["avg_processing_time"]
            count = self.performance_tracking["predictions_made"]
            new_avg = (current_avg * (count - 1) + processing_time) / count
            self.performance_tracking["avg_processing_time"] = new_avg
            
            # Store in Redis for aggregation
            await redis_service.increment_counter(f"model_predictions:{model_name}")
            await redis_service.set_cache(
                f"last_prediction:{model_name}",
                {
                    "processing_time": processing_time,
                    "confidence": confidence,
                    "timestamp": datetime.now().isoformat(),
                    "data": prediction_data
                },
                expire=3600
            )
            
        except Exception as e:
            logger.error(f"Error recording prediction: {e}")
    
    async def add_feedback(
        self,
        predicted_score: float,
        actual_label: int,
        confidence: float,
        text_features: Optional[Dict[str, Any]] = None
    ):
        """
        Add user feedback for model improvement.
        
        Args:
            predicted_score: Model's predicted score
            actual_label: Actual label (0 or 1)
            confidence: User's confidence in labeling
            text_features: Text features for analysis
        """
        try:
            feedback_data = {
                "predicted_score": predicted_score,
                "actual_label": actual_label,
                "confidence": confidence,
                "timestamp": datetime.now().isoformat(),
                "features": text_features
            }
            
            # Store feedback
            feedback_id = hashlib.md5(str(feedback_data).encode()).hexdigest()[:12]
            await redis_service.set_cache(
                f"feedback:{feedback_id}",
                feedback_data,
                expire=86400 * 30  # 30 days
            )
            
            # Add to accuracy tracking
            is_correct = (
                (predicted_score >= 0.5 and actual_label == 1) or
                (predicted_score < 0.5 and actual_label == 0)
            )
            
            self.performance_tracking["accuracy_samples"].append({
                "is_correct": is_correct,
                "predicted_score": predicted_score,
                "actual_label": actual_label,
                "timestamp": datetime.now().isoformat()
            })
            
            # Keep only recent samples
            if len(self.performance_tracking["accuracy_samples"]) > 1000:
                self.performance_tracking["accuracy_samples"] = \
                    self.performance_tracking["accuracy_samples"][-1000:]
            
            logger.info(f"Added feedback: predicted={predicted_score:.2f}, actual={actual_label}")
            
        except Exception as e:
            logger.error(f"Error adding feedback: {e}")
    
    # Private methods
    
    async def _initialize_version_tracking(self):
        """Initialize model version tracking."""
        try:
            # Get current model versions
            bert_info = bert_classifier.get_model_info()
            self.model_versions = {
                "bert": bert_info.get("model_version", "unknown"),
                "pattern_matcher": "1.0.0",  # Static version
                "sentiment_analyzer": "1.0.0",  # Static version
                "ensemble": "1.0.0"  # Static version
            }
            
            # Store in Redis
            await redis_service.set_cache(
                "model_versions",
                self.model_versions,
                expire=86400
            )
            
            logger.info(f"Model versions initialized: {self.model_versions}")
            
        except Exception as e:
            logger.error(f"Error initializing version tracking: {e}")
    
    async def _update_version_tracking(self):
        """Update model version tracking."""
        try:
            # Update versions after reload
            await self._initialize_version_tracking()
            
        except Exception as e:
            logger.error(f"Error updating version tracking: {e}")
    
    async def _model_health_monitor(self):
        """Monitor model health and availability."""
        logger.info("Starting model health monitor")
        
        while self.is_running:
            try:
                # Check every 5 minutes
                await asyncio.sleep(300)
                
                if not self.is_running:
                    break
                
                # Check model status
                ensemble_status = ensemble_scorer.get_model_status()
                bert_info = bert_classifier.get_model_info()
                
                # Log health status
                health_status = {
                    "timestamp": datetime.now().isoformat(),
                    "ensemble_ready": ensemble_status.get("ensemble_ready", False),
                    "bert_loaded": bert_info.get("is_loaded", False),
                    "models_loaded": ensemble_status.get("models_loaded", {})
                }
                
                await redis_service.set_cache(
                    "model_health",
                    health_status,
                    expire=600  # 10 minutes
                )
                
                # Alert on critical issues
                if not health_status["ensemble_ready"]:
                    logger.warning("Ensemble not ready - models may be unavailable")
                
                logger.debug("Model health check completed")
                
            except Exception as e:
                logger.error(f"Error in model health monitor: {e}")
                await asyncio.sleep(60)  # Shorter sleep on error
    
    async def _performance_tracker(self):
        """Track model performance over time."""
        logger.info("Starting performance tracker")
        
        while self.is_running:
            try:
                # Track every 10 minutes
                await asyncio.sleep(600)
                
                if not self.is_running:
                    break
                
                # Calculate current accuracy
                recent_samples = self.performance_tracking["accuracy_samples"][-100:]  # Last 100
                if recent_samples:
                    accuracy = sum(1 for s in recent_samples if s["is_correct"]) / len(recent_samples)
                    
                    performance_snapshot = {
                        "timestamp": datetime.now().isoformat(),
                        "predictions_made": self.performance_tracking["predictions_made"],
                        "avg_processing_time": self.performance_tracking["avg_processing_time"],
                        "recent_accuracy": accuracy,
                        "sample_count": len(recent_samples)
                    }
                    
                    await redis_service.set_cache(
                        "performance_snapshot",
                        performance_snapshot,
                        expire=3600
                    )
                    
                    logger.info(f"Performance snapshot: accuracy={accuracy:.3f}, "
                               f"avg_time={self.performance_tracking['avg_processing_time']:.3f}s")
                
            except Exception as e:
                logger.error(f"Error in performance tracker: {e}")
                await asyncio.sleep(300)  # Shorter sleep on error
    
    async def _model_update_checker(self):
        """Check for model updates periodically."""
        logger.info("Starting model update checker")
        
        while self.is_running:
            try:
                # Check every hour
                await asyncio.sleep(3600)
                
                if not self.is_running:
                    break
                
                self.last_update_check = datetime.now()
                
                # In a real implementation, this would:
                # 1. Check for new model versions in model registry
                # 2. Download and validate new models
                # 3. Perform A/B testing on new models
                # 4. Auto-update if performance improves
                
                logger.debug("Model update check completed")
                
            except Exception as e:
                logger.error(f"Error in model update checker: {e}")
                await asyncio.sleep(1800)  # 30 minutes on error
    
    async def _drift_detector(self):
        """Detect model drift and performance degradation."""
        logger.info("Starting drift detector")
        
        while self.is_running:
            try:
                # Check every 30 minutes
                await asyncio.sleep(1800)
                
                if not self.is_running:
                    break
                
                # Analyze recent accuracy samples
                recent_samples = self.performance_tracking["accuracy_samples"][-200:]  # Last 200
                
                if len(recent_samples) >= 50:
                    # Split into two halves for comparison
                    half_point = len(recent_samples) // 2
                    first_half = recent_samples[:half_point]
                    second_half = recent_samples[half_point:]
                    
                    # Calculate accuracies
                    first_accuracy = sum(1 for s in first_half if s["is_correct"]) / len(first_half)
                    second_accuracy = sum(1 for s in second_half if s["is_correct"]) / len(second_half)
                    
                    # Check for significant drift
                    accuracy_drop = first_accuracy - second_accuracy
                    if accuracy_drop > 0.1:  # 10% drop
                        drift_alert = {
                            "timestamp": datetime.now().isoformat(),
                            "type": "accuracy_drift",
                            "first_half_accuracy": first_accuracy,
                            "second_half_accuracy": second_accuracy,
                            "accuracy_drop": accuracy_drop,
                            "sample_count": len(recent_samples)
                        }
                        
                        self.performance_tracking["drift_alerts"].append(drift_alert)
                        
                        # Keep only recent alerts
                        if len(self.performance_tracking["drift_alerts"]) > 50:
                            self.performance_tracking["drift_alerts"] = \
                                self.performance_tracking["drift_alerts"][-50:]
                        
                        # Store alert in Redis
                        await redis_service.set_cache(
                            f"drift_alert:{datetime.now().timestamp()}",
                            drift_alert,
                            expire=86400 * 7  # 7 days
                        )
                        
                        logger.warning(f"Model drift detected: accuracy dropped by {accuracy_drop:.1%}")
                
            except Exception as e:
                logger.error(f"Error in drift detector: {e}")
                await asyncio.sleep(900)  # 15 minutes on error