"""Scan-specific endpoints for integration with main API."""

import logging
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, Body
from pydantic import BaseModel, Field

from app.api.schemas import AnalyzeTextRequest, AnalyzeTextResponse
from app.scoring.ensemble_scorer import ensemble_scorer
from app.scoring.explainer import scam_explainer
from app.preprocessing.text_preprocessor import text_preprocessor

logger = logging.getLogger(__name__)

router = APIRouter()


class ScanRequest(BaseModel):
    """Request schema for scan endpoint."""
    content: str = Field(..., min_length=1, max_length=10000, description="Content to scan")
    content_type: str = Field(default="text", description="Type of content (text, email, message)")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    user_id: Optional[str] = Field(default=None, description="User ID for tracking")
    scan_settings: Optional[Dict[str, Any]] = Field(default=None, description="Scan configuration")


class ScanResponse(BaseModel):
    """Response schema for scan endpoint."""
    scan_id: str
    status: str
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    threats_detected: List[str]
    recommendations: List[str]
    details: Dict[str, Any]
    processing_time: float
    timestamp: datetime = Field(default_factory=datetime.now)


class QuickScanRequest(BaseModel):
    """Request schema for quick scan endpoint."""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to scan quickly")


class QuickScanResponse(BaseModel):
    """Response schema for quick scan endpoint."""
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    is_suspicious: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    processing_time: float


@router.post(
    "/scan",
    response_model=ScanResponse,
    summary="Comprehensive content scan",
    description="Perform comprehensive scam detection scan on content"
)
async def scan_content(request: ScanRequest) -> ScanResponse:
    """
    Perform comprehensive scam detection scan.
    
    - **content**: Content to analyze for scam indicators
    - **content_type**: Type of content (text, email, message)
    - **metadata**: Additional context information
    - **user_id**: User identifier for tracking
    - **scan_settings**: Custom scan configuration
    """
    try:
        scan_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        # Validate content length
        if len(request.content) > 10000:
            raise HTTPException(
                status_code=413,
                detail="Content too long. Maximum 10,000 characters allowed."
            )
        
        # Preprocess content
        preprocessing_result = text_preprocessor.preprocess(
            request.content,
            normalize=True,
            extract_entities=True,
            get_stats=True
        )
        
        # Get ensemble prediction
        ensemble_result = ensemble_scorer.predict_single(
            request.content,
            explain=True
        )
        
        # Generate detailed explanation
        explanation_result = scam_explainer.explain_prediction(
            request.content,
            ensemble_result,
            include_evidence=True
        )
        
        # Extract threats detected
        threats_detected = []
        
        # Add pattern-based threats
        for pred in ensemble_result.model_predictions:
            if pred.model_name == "pattern" and pred.score > 0.5:
                pattern_data = pred.metadata.get("matches_by_category", {})
                for category, matches in pattern_data.items():
                    if matches:
                        category_name = category.replace("_", " ").title()
                        threats_detected.append(f"{category_name} indicators detected")
        
        # Add sentiment-based threats
        for pred in ensemble_result.model_predictions:
            if pred.model_name == "sentiment" and pred.score > 0.5:
                sentiment_data = pred.metadata.get("urgency_analysis", {})
                if sentiment_data.get("urgency_level") in ["high", "medium"]:
                    threats_detected.append("High pressure tactics detected")
                
                manipulation_data = pred.metadata.get("manipulation_analysis", {})
                if manipulation_data.get("manipulation_level") in ["high", "medium"]:
                    threats_detected.append("Emotional manipulation detected")
        
        # Add entity-based threats
        entities = preprocessing_result.get("entities", {})
        if entities.get("crypto_addresses"):
            threats_detected.append("Cryptocurrency addresses found")
        if entities.get("suspicious_domains"):
            threats_detected.append("Suspicious URLs detected")
        if len(entities.get("urls", [])) > 3:
            threats_detected.append("Multiple URLs present")
        
        # Remove duplicates
        threats_detected = list(set(threats_detected))
        
        # Build detailed response
        details = {
            "analysis": {
                "language_detected": preprocessing_result.get("language"),
                "text_statistics": preprocessing_result.get("statistics", {}),
                "entities_extracted": preprocessing_result.get("entities", {}),
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
            "explanation": {
                "key_factors": [
                    {
                        "factor": factor.feature_name,
                        "importance": factor.importance,
                        "description": factor.explanation
                    }
                    for factor in explanation_result.key_factors[:5]
                ],
                "evidence_highlights": explanation_result.evidence_text[:3],
                "summary": scam_explainer.generate_summary_explanation(explanation_result)
            },
            "scan_metadata": {
                "content_type": request.content_type,
                "content_length": len(request.content),
                "user_id": request.user_id,
                "custom_settings": request.scan_settings
            }
        }
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        response = ScanResponse(
            scan_id=scan_id,
            status="completed",
            risk_score=ensemble_result.final_score,
            risk_level=ensemble_result.risk_level,
            confidence=ensemble_result.confidence,
            threats_detected=threats_detected,
            recommendations=explanation_result.recommendations[:5],
            details=details,
            processing_time=processing_time,
            timestamp=datetime.now()
        )
        
        logger.info(f"Scan completed - ID: {scan_id}, Risk: {ensemble_result.risk_level}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in content scan: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during scan: {str(e)}"
        )


@router.post(
    "/quick-scan",
    response_model=QuickScanResponse,
    summary="Quick scam detection scan",
    description="Perform fast scam detection with minimal details"
)
async def quick_scan(request: QuickScanRequest) -> QuickScanResponse:
    """
    Perform quick scam detection scan.
    
    Optimized for speed with minimal processing and explanation.
    
    - **text**: Text content to scan quickly
    """
    try:
        start_time = datetime.now()
        
        # Validate text length
        if len(request.text) > 5000:
            raise HTTPException(
                status_code=413,
                detail="Text too long for quick scan. Maximum 5,000 characters allowed."
            )
        
        # Use only pattern matching for speed
        from app.models.pattern_matcher import pattern_matcher
        pattern_result = pattern_matcher.analyze_text(request.text)
        
        risk_score = pattern_result["risk_analysis"].get("risk_score", 0.0)
        confidence = pattern_result["risk_analysis"].get("confidence", 0.0)
        risk_level = pattern_result["risk_analysis"].get("risk_level", "low")
        
        # Boost score slightly with simple BERT simulation if high pattern score
        if risk_score > 0.6:
            from app.models.bert_classifier import pattern_simulator
            bert_sim = pattern_simulator.simulate_bert_prediction(request.text)
            # Weighted average with pattern score
            risk_score = (risk_score * 0.7 + bert_sim["scam_probability"] * 0.3)
            confidence = max(confidence, bert_sim["confidence"])
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return QuickScanResponse(
            risk_score=risk_score,
            risk_level=risk_level,
            is_suspicious=risk_score > 0.5,
            confidence=confidence,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in quick scan: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error in quick scan: {str(e)}"
        )


@router.get(
    "/scan/{scan_id}",
    response_model=ScanResponse,
    summary="Get scan results",
    description="Retrieve results of a previous scan"
)
async def get_scan_results(scan_id: str) -> ScanResponse:
    """
    Retrieve results of a previous scan.
    
    - **scan_id**: Unique identifier of the scan
    """
    # In a real implementation, this would query a database
    # For now, return a placeholder response
    raise HTTPException(
        status_code=501,
        detail="Scan result retrieval not implemented yet"
    )


@router.post(
    "/bulk-scan",
    summary="Bulk content scanning",
    description="Scan multiple pieces of content in batch"
)
async def bulk_scan(
    contents: List[str] = Body(..., min_items=1, max_items=50),
    background_tasks: BackgroundTasks = None
) -> Dict[str, Any]:
    """
    Scan multiple contents in bulk.
    
    - **contents**: List of content strings to scan
    """
    try:
        if len(contents) > 50:
            raise HTTPException(
                status_code=422,
                detail="Maximum 50 items allowed for bulk scan"
            )
        
        bulk_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        # For small batches, process synchronously
        if len(contents) <= 10:
            results = []
            
            for i, content in enumerate(contents):
                try:
                    # Use quick scan for bulk processing
                    pattern_result = pattern_matcher.analyze_text(content)
                    risk_score = pattern_result["risk_analysis"].get("risk_score", 0.0)
                    
                    results.append({
                        "item_id": i,
                        "risk_score": risk_score,
                        "risk_level": pattern_result["risk_analysis"].get("risk_level", "low"),
                        "is_suspicious": risk_score > 0.5,
                        "confidence": pattern_result["risk_analysis"].get("confidence", 0.0)
                    })
                    
                except Exception as e:
                    results.append({
                        "item_id": i,
                        "error": str(e),
                        "risk_score": 0.0,
                        "risk_level": "error"
                    })
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "bulk_id": bulk_id,
                "status": "completed",
                "total_items": len(contents),
                "processed_items": len([r for r in results if "error" not in r]),
                "failed_items": len([r for r in results if "error" in r]),
                "results": results,
                "processing_time": processing_time,
                "summary": {
                    "suspicious_count": len([r for r in results if r.get("is_suspicious", False)]),
                    "avg_risk_score": sum(r.get("risk_score", 0) for r in results) / len(results),
                    "high_risk_count": len([r for r in results if r.get("risk_score", 0) > 0.7])
                }
            }
        
        else:
            # For large batches, process asynchronously
            if background_tasks:
                background_tasks.add_task(_process_bulk_scan, bulk_id, contents)
            
            return {
                "bulk_id": bulk_id,
                "status": "processing",
                "total_items": len(contents),
                "message": "Bulk scan started. Use bulk_id to check status."
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk scan: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error in bulk scan: {str(e)}"
        )


@router.get(
    "/categories",
    summary="Get threat categories",
    description="Get list of all threat categories that can be detected"
)
async def get_threat_categories() -> Dict[str, List[str]]:
    """Get list of all detectable threat categories."""
    try:
        from app.models.pattern_matcher import pattern_matcher
        
        categories = pattern_matcher.get_pattern_categories()
        pattern_counts = pattern_matcher.get_pattern_count()
        
        category_info = {}
        for category in categories:
            # Convert category name to human readable
            display_name = category.replace("_", " ").title()
            description = pattern_matcher.patterns[category]["description"]
            pattern_count = pattern_counts.get(category, 0)
            
            category_info[category] = {
                "display_name": display_name,
                "description": description,
                "pattern_count": pattern_count,
                "examples": []  # Could add example patterns
            }
        
        return {
            "threat_categories": category_info,
            "total_categories": len(categories),
            "total_patterns": sum(pattern_counts.values())
        }
        
    except Exception as e:
        logger.error(f"Error getting threat categories: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving threat categories: {str(e)}"
        )


# Helper functions

async def _process_bulk_scan(bulk_id: str, contents: List[str]):
    """Process bulk scan asynchronously."""
    try:
        logger.info(f"Starting bulk scan processing - ID: {bulk_id}")
        
        results = []
        for i, content in enumerate(contents):
            try:
                pattern_result = pattern_matcher.analyze_text(content)
                risk_score = pattern_result["risk_analysis"].get("risk_score", 0.0)
                
                results.append({
                    "item_id": i,
                    "risk_score": risk_score,
                    "risk_level": pattern_result["risk_analysis"].get("risk_level", "low"),
                    "is_suspicious": risk_score > 0.5,
                    "confidence": pattern_result["risk_analysis"].get("confidence", 0.0)
                })
                
            except Exception as e:
                results.append({
                    "item_id": i,
                    "error": str(e),
                    "risk_score": 0.0,
                    "risk_level": "error"
                })
        
        # In a real implementation:
        # 1. Store results in database with bulk_id
        # 2. Update status to completed
        # 3. Send notification if callback provided
        
        logger.info(f"Completed bulk scan processing - ID: {bulk_id}")
        
    except Exception as e:
        logger.error(f"Error in bulk scan processing {bulk_id}: {e}")