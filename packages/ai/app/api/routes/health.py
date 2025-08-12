"""Health check and system status endpoints."""

import logging
import psutil
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.api.schemas import HealthResponse, ModelStatusResponse
from app.core.config import settings
from app.scoring.ensemble_scorer import ensemble_scorer
from app.models.bert_classifier import bert_classifier
from app.models.pattern_matcher import pattern_matcher
from app.models.sentiment_analyzer import sentiment_analyzer

logger = logging.getLogger(__name__)

router = APIRouter()

# Store startup time for uptime calculation
startup_time = datetime.now()


@router.get(
    "/",
    response_model=HealthResponse,
    summary="Health check",
    description="Get overall system health status"
)
async def health_check() -> HealthResponse:
    """
    Comprehensive health check endpoint.
    
    Returns system status, model availability, and performance metrics.
    """
    try:
        # Calculate uptime
        uptime = (datetime.now() - startup_time).total_seconds()
        
        # Get model statuses
        models_status = await _get_models_status()
        
        # Get system information
        system_info = await _get_system_info()
        
        # Determine overall status
        overall_status = "healthy"
        
        # Check if critical models are loaded
        critical_models_loaded = any(
            model.is_loaded for model in models_status 
            if model.model_name in ["bert", "pattern", "sentiment"]
        )
        
        if not critical_models_loaded:
            overall_status = "degraded"
        
        # Check system resources
        if system_info.get("memory_usage_percent", 0) > 90:
            overall_status = "degraded"
        
        if system_info.get("cpu_usage_percent", 0) > 95:
            overall_status = "degraded"
        
        return HealthResponse(
            status=overall_status,
            timestamp=datetime.now(),
            version=settings.VERSION,
            models_status=models_status,
            system_info=system_info,
            uptime_seconds=uptime
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )


@router.get(
    "/models",
    response_model=List[ModelStatusResponse],
    summary="Model status",
    description="Get detailed status of all AI models"
)
async def get_models_status() -> List[ModelStatusResponse]:
    """Get detailed status of all AI models."""
    try:
        return await _get_models_status()
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving model status: {str(e)}"
        )


@router.get(
    "/system",
    summary="System information",
    description="Get detailed system resource information"
)
async def get_system_info() -> Dict[str, Any]:
    """Get detailed system information."""
    try:
        return await _get_system_info()
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving system information: {str(e)}"
        )


@router.get(
    "/metrics",
    summary="Performance metrics",
    description="Get performance metrics and statistics"
)
async def get_metrics() -> Dict[str, Any]:
    """Get performance metrics."""
    try:
        metrics = await _get_performance_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving metrics: {str(e)}"
        )


@router.post(
    "/test",
    summary="Test analysis pipeline",
    description="Test the analysis pipeline with sample data"
)
async def test_pipeline() -> Dict[str, Any]:
    """Test the analysis pipeline with sample data."""
    try:
        test_texts = [
            "Hello, how are you today?",  # Normal text
            "URGENT: Your account will be suspended! Click here immediately!",  # Scam text
            "Guaranteed 500% returns on your investment! Act now!",  # Investment scam
            "I love you but need money for emergency travel",  # Romance scam
        ]
        
        test_results = []
        start_time = time.time()
        
        for i, text in enumerate(test_texts):
            try:
                result = ensemble_scorer.predict_single(text, explain=False)
                test_results.append({
                    "test_id": i,
                    "text_preview": text[:50] + "..." if len(text) > 50 else text,
                    "score": result.final_score,
                    "risk_level": result.risk_level,
                    "confidence": result.confidence,
                    "processing_time": result.processing_time,
                    "status": "success"
                })
            except Exception as e:
                test_results.append({
                    "test_id": i,
                    "text_preview": text[:50] + "..." if len(text) > 50 else text,
                    "status": "failed",
                    "error": str(e)
                })
        
        total_time = time.time() - start_time
        
        # Calculate success rate
        successful_tests = sum(1 for result in test_results if result.get("status") == "success")
        success_rate = successful_tests / len(test_results) * 100
        
        return {
            "test_summary": {
                "total_tests": len(test_results),
                "successful_tests": successful_tests,
                "failed_tests": len(test_results) - successful_tests,
                "success_rate_percent": success_rate,
                "total_processing_time": total_time,
                "avg_processing_time": total_time / len(test_results)
            },
            "test_results": test_results,
            "pipeline_status": "healthy" if success_rate >= 75 else "degraded",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Pipeline test failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline test failed: {str(e)}"
        )


# Helper functions

async def _get_models_status() -> List[ModelStatusResponse]:
    """Get status of all models."""
    models_status = []
    
    try:
        # BERT model status
        bert_info = bert_classifier.get_model_info()
        models_status.append(ModelStatusResponse(
            model_name="bert",
            is_loaded=bert_info.get("is_loaded", False),
            version=bert_info.get("model_version"),
            last_updated=None,  # Would be set from database in real implementation
            performance_metrics=bert_info.get("performance_metrics"),
            memory_usage=None  # Would calculate actual memory usage
        ))
        
        # Pattern matcher status
        models_status.append(ModelStatusResponse(
            model_name="pattern",
            is_loaded=True,  # Pattern matcher is always available
            version="1.0.0",
            last_updated=None,
            performance_metrics=None,
            memory_usage=None
        ))
        
        # Sentiment analyzer status
        models_status.append(ModelStatusResponse(
            model_name="sentiment",
            is_loaded=True,  # Sentiment analyzer is always available
            version="1.0.0",
            last_updated=None,
            performance_metrics=None,
            memory_usage=None
        ))
        
        # Ensemble scorer status
        ensemble_status = ensemble_scorer.get_model_status()
        models_status.append(ModelStatusResponse(
            model_name="ensemble",
            is_loaded=ensemble_status.get("ensemble_ready", False),
            version="1.0.0",
            last_updated=None,
            performance_metrics=None,
            memory_usage=None
        ))
        
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
    
    return models_status


async def _get_system_info() -> Dict[str, Any]:
    """Get system resource information."""
    try:
        # Memory information
        memory = psutil.virtual_memory()
        
        # CPU information
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        
        # Disk information
        disk = psutil.disk_usage('/')
        
        # Process information
        process = psutil.Process()
        process_memory = process.memory_info()
        
        return {
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "usage_percent": memory.percent
            },
            "cpu": {
                "usage_percent": cpu_percent,
                "core_count": cpu_count,
                "load_average": list(psutil.getloadavg()) if hasattr(psutil, 'getloadavg') else None
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "usage_percent": round(disk.used / disk.total * 100, 2)
            },
            "process": {
                "memory_mb": round(process_memory.rss / (1024**2), 2),
                "memory_percent": process.memory_percent(),
                "cpu_percent": process.cpu_percent(),
                "num_threads": process.num_threads()
            },
            "python_version": f"{psutil.version_info}",
            "platform": psutil.LINUX if hasattr(psutil, 'LINUX') else "unknown"
        }
        
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        return {"error": str(e)}


async def _get_performance_metrics() -> Dict[str, Any]:
    """Get performance metrics."""
    try:
        # In a real implementation, these would be collected from:
        # - Redis/database with actual request metrics
        # - Model performance tracking
        # - Error rates and response times
        
        return {
            "requests": {
                "total_processed": 0,  # Would query from database
                "successful": 0,
                "failed": 0,
                "avg_response_time_ms": 0.0,
                "requests_per_minute": 0.0
            },
            "models": {
                "bert": {
                    "predictions_made": 0,
                    "avg_processing_time_ms": 0.0,
                    "confidence_distribution": {
                        "high": 0,
                        "medium": 0,
                        "low": 0
                    }
                },
                "pattern": {
                    "patterns_matched": 0,
                    "avg_processing_time_ms": 0.0
                },
                "sentiment": {
                    "analyses_performed": 0,
                    "avg_processing_time_ms": 0.0
                }
            },
            "risk_levels": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "minimal": 0
            },
            "errors": {
                "total_errors": 0,
                "error_rate_percent": 0.0,
                "common_errors": []
            },
            "uptime": {
                "uptime_seconds": (datetime.now() - startup_time).total_seconds(),
                "last_restart": startup_time.isoformat(),
                "availability_percent": 99.9  # Would calculate from actual downtime
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        return {"error": str(e)}