"""Main detection service orchestrating all AI models."""

import logging
import hashlib
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import json

from app.core.config import settings
from app.scoring.ensemble_scorer import ensemble_scorer
from app.scoring.explainer import scam_explainer
from app.preprocessing.text_preprocessor import text_preprocessor
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)


class DetectionService:
    """Main service for scam detection operations."""
    
    def __init__(self):
        self.is_initialized = False
        self.performance_metrics = {
            "total_requests": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "avg_response_time": 0.0,
            "error_count": 0
        }
        
    async def initialize(self) -> bool:
        """Initialize the detection service."""
        try:
            logger.info("Initializing detection service...")
            
            # Initialize models through ensemble scorer
            # (This calls model loading in the background)
            model_status = ensemble_scorer.get_model_status()
            
            if not model_status.get("ensemble_ready", False):
                logger.warning("Some models may not be available")
            
            # Test basic functionality
            test_result = await self._test_pipeline()
            if not test_result:
                logger.error("Pipeline test failed during initialization")
                return False
            
            self.is_initialized = True
            logger.info("Detection service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize detection service: {e}")
            self.is_initialized = False
            return False
    
    async def analyze_text(
        self,
        text: str,
        include_explanation: bool = True,
        include_evidence: bool = True,
        use_cache: bool = True,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze text for scam indicators with caching and metrics.
        
        Args:
            text: Text to analyze
            include_explanation: Whether to include explanations
            include_evidence: Whether to include evidence highlights
            use_cache: Whether to use caching
            user_context: Additional user context
            
        Returns:
            Complete analysis result
        """
        start_time = datetime.now()
        
        try:
            self.performance_metrics["total_requests"] += 1
            
            # Generate text hash for caching
            text_hash = self._generate_text_hash(text)
            
            # Try to get from cache first
            if use_cache:
                cached_result = await redis_service.get_cached_analysis(text_hash)
                if cached_result:
                    self.performance_metrics["cache_hits"] += 1
                    logger.info(f"Cache hit for text hash: {text_hash}")
                    
                    # Add fresh timestamp
                    cached_result["retrieved_at"] = datetime.now().isoformat()
                    return cached_result
                else:
                    self.performance_metrics["cache_misses"] += 1
            
            # Perform analysis
            result = await self._perform_analysis(
                text,
                include_explanation,
                include_evidence,
                user_context
            )
            
            # Cache the result
            if use_cache and result.get("status") == "success":
                await redis_service.cache_analysis_result(
                    text_hash,
                    result,
                    expire=settings.MODEL_UPDATE_INTERVAL
                )
            
            # Update performance metrics
            processing_time = (datetime.now() - start_time).total_seconds()
            self._update_performance_metrics(processing_time)
            
            return result
            
        except Exception as e:
            self.performance_metrics["error_count"] += 1
            logger.error(f"Error in text analysis: {e}")
            
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "processing_time": (datetime.now() - start_time).total_seconds()
            }
    
    async def analyze_conversation(
        self,
        messages: List[Dict[str, Any]],
        analyze_individual: bool = True,
        analyze_context: bool = True,
        include_explanation: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze conversation for scam patterns.
        
        Args:
            messages: List of message dictionaries
            analyze_individual: Whether to analyze each message
            analyze_context: Whether to analyze conversation context
            include_explanation: Whether to include explanations
            
        Returns:
            Conversation analysis result
        """
        start_time = datetime.now()
        
        try:
            # Combine messages for overall analysis
            combined_text = " ".join([msg.get("text", "") for msg in messages])
            
            # Analyze overall conversation
            overall_result = await self.analyze_text(
                combined_text,
                include_explanation=include_explanation,
                include_evidence=True,
                use_cache=True
            )
            
            # Analyze individual messages if requested
            individual_results = []
            if analyze_individual:
                for i, message in enumerate(messages):
                    msg_text = message.get("text", "")
                    if len(msg_text.strip()) >= settings.MIN_TEXT_LENGTH:
                        msg_result = await self.analyze_text(
                            msg_text,
                            include_explanation=False,
                            include_evidence=False,
                            use_cache=True
                        )
                        msg_result["message_index"] = i
                        individual_results.append(msg_result)
            
            # Analyze conversation context
            context_analysis = {}
            if analyze_context:
                context_analysis = await self._analyze_conversation_context(messages)
            
            # Calculate conversation-level metrics
            conversation_metrics = self._calculate_conversation_metrics(
                individual_results, messages
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "status": "success",
                "conversation_analysis": {
                    "overall_risk": overall_result,
                    "individual_messages": individual_results,
                    "context_analysis": context_analysis,
                    "conversation_metrics": conversation_metrics,
                    "message_count": len(messages),
                    "processing_time": processing_time,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error in conversation analysis: {e}")
            return {
                "status": "error",
                "error": str(e),
                "processing_time": (datetime.now() - start_time).total_seconds(),
                "timestamp": datetime.now().isoformat()
            }
    
    async def batch_analyze(
        self,
        texts: List[str],
        batch_id: str,
        include_explanation: bool = False,
        callback_url: Optional[str] = None,
        priority: str = "normal"
    ) -> Dict[str, Any]:
        """
        Process texts in batch.
        
        Args:
            texts: List of texts to analyze
            batch_id: Unique batch identifier
            include_explanation: Whether to include explanations
            callback_url: Optional callback URL for completion
            priority: Processing priority
            
        Returns:
            Batch processing result
        """
        start_time = datetime.now()
        
        try:
            # Initialize batch status
            batch_status = {
                "batch_id": batch_id,
                "status": "processing",
                "total_items": len(texts),
                "processed_items": 0,
                "failed_items": 0,
                "start_time": start_time.isoformat(),
                "priority": priority
            }
            
            await redis_service.set_batch_status(batch_id, batch_status)
            
            # Process texts
            results = []
            processed_count = 0
            failed_count = 0
            
            for i, text in enumerate(texts):
                try:
                    result = await self.analyze_text(
                        text,
                        include_explanation=include_explanation,
                        include_evidence=False,
                        use_cache=True
                    )
                    
                    result["item_index"] = i
                    results.append(result)
                    
                    if result.get("status") == "success":
                        processed_count += 1
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f"Error processing batch item {i}: {e}")
                    results.append({
                        "item_index": i,
                        "status": "error",
                        "error": str(e)
                    })
                    failed_count += 1
                
                # Update batch status periodically
                if (i + 1) % 10 == 0:
                    batch_status.update({
                        "processed_items": processed_count,
                        "failed_items": failed_count,
                        "progress_percent": ((i + 1) / len(texts)) * 100
                    })
                    await redis_service.set_batch_status(batch_id, batch_status)
            
            # Final batch status
            processing_time = (datetime.now() - start_time).total_seconds()
            
            final_status = {
                "batch_id": batch_id,
                "status": "completed",
                "total_items": len(texts),
                "processed_items": processed_count,
                "failed_items": failed_count,
                "processing_time": processing_time,
                "completed_at": datetime.now().isoformat(),
                "results": results
            }
            
            await redis_service.set_batch_status(batch_id, final_status)
            
            # Send callback if provided
            if callback_url:
                await self._send_batch_callback(callback_url, final_status)
            
            return final_status
            
        except Exception as e:
            logger.error(f"Error in batch processing: {e}")
            
            # Update batch status to failed
            error_status = {
                "batch_id": batch_id,
                "status": "failed",
                "error": str(e),
                "processing_time": (datetime.now() - start_time).total_seconds(),
                "failed_at": datetime.now().isoformat()
            }
            
            await redis_service.set_batch_status(batch_id, error_status)
            return error_status
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get service performance metrics."""
        try:
            # Get Redis metrics
            redis_health = await redis_service.health_check()
            
            # Get model metrics
            model_status = ensemble_scorer.get_model_status()
            
            # Calculate additional metrics
            cache_hit_rate = (
                self.performance_metrics["cache_hits"] / 
                max(1, self.performance_metrics["cache_hits"] + self.performance_metrics["cache_misses"])
            ) * 100
            
            error_rate = (
                self.performance_metrics["error_count"] / 
                max(1, self.performance_metrics["total_requests"])
            ) * 100
            
            return {
                "service_metrics": {
                    **self.performance_metrics,
                    "cache_hit_rate_percent": cache_hit_rate,
                    "error_rate_percent": error_rate,
                    "is_initialized": self.is_initialized
                },
                "redis_metrics": redis_health,
                "model_metrics": model_status,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting performance metrics: {e}")
            return {"error": str(e)}
    
    # Private methods
    
    async def _perform_analysis(
        self,
        text: str,
        include_explanation: bool,
        include_evidence: bool,
        user_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform the actual analysis."""
        try:
            # Preprocess text
            preprocessing_result = text_preprocessor.preprocess(
                text,
                normalize=True,
                extract_entities=True,
                get_stats=True
            )
            
            # Get ensemble prediction
            ensemble_result = ensemble_scorer.predict_single(
                text,
                explain=include_explanation
            )
            
            # Generate explanation if requested
            explanation_result = None
            if include_explanation:
                explanation_result = scam_explainer.explain_prediction(
                    text,
                    ensemble_result,
                    include_evidence=include_evidence
                )
            
            # Build result
            result = {
                "status": "success",
                "analysis": {
                    "risk_score": ensemble_result.final_score,
                    "risk_level": ensemble_result.risk_level,
                    "confidence": ensemble_result.confidence,
                    "processing_time": ensemble_result.processing_time
                },
                "preprocessing": {
                    "language": preprocessing_result.get("language"),
                    "entities": preprocessing_result.get("entities", {}),
                    "statistics": preprocessing_result.get("statistics", {}),
                    "processing_steps": preprocessing_result.get("processing_steps", [])
                },
                "model_predictions": [
                    {
                        "model": pred.model_name,
                        "score": pred.score,
                        "confidence": pred.confidence,
                        "processing_time": pred.processing_time
                    }
                    for pred in ensemble_result.model_predictions
                ],
                "timestamp": datetime.now().isoformat()
            }
            
            # Add explanation if available
            if explanation_result:
                result["explanation"] = {
                    "key_factors": [
                        {
                            "factor": factor.feature_name,
                            "importance": factor.importance,
                            "description": factor.explanation
                        }
                        for factor in explanation_result.key_factors
                    ],
                    "evidence_text": explanation_result.evidence_text if include_evidence else [],
                    "recommendations": explanation_result.recommendations,
                    "summary": scam_explainer.generate_summary_explanation(explanation_result)
                }
            
            # Add user context if provided
            if user_context:
                result["user_context"] = user_context
            
            return result
            
        except Exception as e:
            logger.error(f"Error performing analysis: {e}")
            raise
    
    def _generate_text_hash(self, text: str) -> str:
        """Generate hash for text caching."""
        return hashlib.sha256(text.encode()).hexdigest()[:16]
    
    def _update_performance_metrics(self, processing_time: float):
        """Update performance metrics."""
        # Update average response time
        total_requests = self.performance_metrics["total_requests"]
        current_avg = self.performance_metrics["avg_response_time"]
        
        new_avg = (current_avg * (total_requests - 1) + processing_time) / total_requests
        self.performance_metrics["avg_response_time"] = new_avg
    
    async def _analyze_conversation_context(
        self,
        messages: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze conversation context."""
        try:
            context = {
                "message_count": len(messages),
                "unique_senders": len(set(msg.get("sender", "") for msg in messages)),
                "time_span_analysis": {},
                "escalation_detected": False,
                "sender_behavior": {}
            }
            
            # Analyze time spans if timestamps available
            timestamps = [msg.get("timestamp") for msg in messages if msg.get("timestamp")]
            if len(timestamps) >= 2:
                time_diffs = []
                for i in range(1, len(timestamps)):
                    try:
                        prev_time = datetime.fromisoformat(timestamps[i-1].replace('Z', '+00:00'))
                        curr_time = datetime.fromisoformat(timestamps[i].replace('Z', '+00:00'))
                        diff = (curr_time - prev_time).total_seconds()
                        time_diffs.append(diff)
                    except:
                        continue
                
                if time_diffs:
                    context["time_span_analysis"] = {
                        "avg_response_time_seconds": sum(time_diffs) / len(time_diffs),
                        "min_response_time": min(time_diffs),
                        "max_response_time": max(time_diffs),
                        "total_duration_seconds": sum(time_diffs)
                    }
            
            return context
            
        except Exception as e:
            logger.error(f"Error analyzing conversation context: {e}")
            return {"error": str(e)}
    
    def _calculate_conversation_metrics(
        self,
        individual_results: List[Dict[str, Any]],
        messages: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate conversation-level metrics."""
        try:
            if not individual_results:
                return {}
            
            risk_scores = []
            confidence_scores = []
            
            for result in individual_results:
                if result.get("status") == "success":
                    analysis = result.get("analysis", {})
                    risk_scores.append(analysis.get("risk_score", 0.0))
                    confidence_scores.append(analysis.get("confidence", 0.0))
            
            if not risk_scores:
                return {"error": "No successful analyses"}
            
            return {
                "avg_risk_score": sum(risk_scores) / len(risk_scores),
                "max_risk_score": max(risk_scores),
                "min_risk_score": min(risk_scores),
                "risk_trend": self._calculate_risk_trend(risk_scores),
                "avg_confidence": sum(confidence_scores) / len(confidence_scores),
                "high_risk_messages": len([s for s in risk_scores if s > 0.7]),
                "suspicious_message_ratio": len([s for s in risk_scores if s > 0.5]) / len(risk_scores)
            }
            
        except Exception as e:
            logger.error(f"Error calculating conversation metrics: {e}")
            return {"error": str(e)}
    
    def _calculate_risk_trend(self, risk_scores: List[float]) -> str:
        """Calculate risk trend over conversation."""
        if len(risk_scores) < 3:
            return "insufficient_data"
        
        # Simple trend calculation
        first_third = risk_scores[:len(risk_scores)//3]
        last_third = risk_scores[-len(risk_scores)//3:]
        
        avg_first = sum(first_third) / len(first_third)
        avg_last = sum(last_third) / len(last_third)
        
        if avg_last > avg_first + 0.2:
            return "escalating"
        elif avg_last < avg_first - 0.2:
            return "de-escalating"
        else:
            return "stable"
    
    async def _send_batch_callback(self, callback_url: str, result: Dict[str, Any]):
        """Send callback for batch completion."""
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    callback_url,
                    json=result,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Batch callback sent successfully to {callback_url}")
                else:
                    logger.warning(f"Batch callback failed: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error sending batch callback: {e}")
    
    async def _test_pipeline(self) -> bool:
        """Test the analysis pipeline."""
        try:
            test_text = "This is a test message for the analysis pipeline."
            
            result = await self._perform_analysis(
                test_text,
                include_explanation=False,
                include_evidence=False,
                user_context=None
            )
            
            return result.get("status") == "success"
            
        except Exception as e:
            logger.error(f"Pipeline test failed: {e}")
            return False


# Global detection service instance
detection_service = DetectionService()