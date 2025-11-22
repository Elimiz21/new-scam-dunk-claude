"""Detection API endpoints for scam analysis."""

import logging
import asyncio
from typing import List, Dict, Any
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from dataclasses import asdict
import json

from app.api.schemas import (
    AnalyzeTextRequest, AnalyzeTextResponse,
    AnalyzeConversationRequest, AnalyzeConversationResponse,
    BatchProcessRequest, BatchProcessResponse,
    FeedbackRequest, FeedbackResponse,
    ErrorResponse
)
from app.scoring.ensemble_scorer import ensemble_scorer
from app.scoring.explainer import scam_explainer
from app.preprocessing.text_preprocessor import text_preprocessor
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


async def validate_request_size(text: str) -> bool:
    """Validate request text size."""
    if len(text) > settings.MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=413,
            detail=f"Text too long. Maximum {settings.MAX_TEXT_LENGTH} characters allowed."
        )
    if len(text) < settings.MIN_TEXT_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Text too short. Minimum {settings.MIN_TEXT_LENGTH} characters required."
        )
    return True


@router.post(
    "/analyze/text",
    response_model=AnalyzeTextResponse,
    summary="Analyze single text for scam indicators",
    description="Analyze a single text message for scam patterns and risk level"
)
async def analyze_text(request: AnalyzeTextRequest) -> AnalyzeTextResponse:
    """
    Analyze a single text for scam indicators.
    
    - **text**: Text content to analyze
    - **include_explanation**: Whether to include detailed explanation
    - **include_evidence**: Whether to highlight evidence in text
    - **model_settings**: Optional model configuration overrides
    """
    try:
        # Validate request
        await validate_request_size(request.text)
        
        # Generate unique text ID
        text_id = str(uuid.uuid4())
        
        # Preprocess text
        preprocessing_result = text_preprocessor.preprocess(
            request.text,
            normalize=True,
            extract_entities=True,
            get_stats=True
        )
        
        # Get ensemble prediction
        ensemble_result = ensemble_scorer.predict_single(
            request.text,
            explain=request.include_explanation
        )
        
        # Prepare response data
        response_data = {
            "text_id": text_id,
            "final_score": ensemble_result.final_score,
            "risk_level": ensemble_result.risk_level,
            "confidence": ensemble_result.confidence,
            "processing_time": ensemble_result.processing_time,
            "timestamp": ensemble_result.timestamp
        }
        
        # Add model predictions
        if ensemble_result.model_predictions:
            response_data["model_predictions"] = [
                {
                    "model_name": pred.model_name,
                    "score": pred.score,
                    "confidence": pred.confidence,
                    "processing_time": pred.processing_time,
                    "metadata": pred.metadata
                }
                for pred in ensemble_result.model_predictions
            ]
        
        # Add explanations if requested
        if request.include_explanation:
            explanation_result = scam_explainer.explain_prediction(
                request.text,
                ensemble_result,
                include_evidence=request.include_evidence
            )
            
            response_data.update({
                "explanation": ensemble_result.explanation,
                "key_factors": [
                    {
                        "feature_name": factor.feature_name,
                        "importance": factor.importance,
                        "value": factor.value,
                        "explanation": factor.explanation
                    }
                    for factor in explanation_result.key_factors
                ],
                "evidence_text": explanation_result.evidence_text if request.include_evidence else None,
                "recommendations": explanation_result.recommendations,
                "summary": scam_explainer.generate_summary_explanation(explanation_result)
            })
        
        # Add preprocessing info
        response_data.update({
            "preprocessing_info": {
                "language": preprocessing_result.get("language"),
                "processing_steps": preprocessing_result.get("processing_steps", [])
            },
            "detected_entities": preprocessing_result.get("entities", {}),
            "text_statistics": preprocessing_result.get("statistics", {})
        })
        
        logger.info(f"Text analysis completed - ID: {text_id}, Risk: {ensemble_result.risk_level}")
        
        return AnalyzeTextResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in text analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during analysis: {str(e)}"
        )


@router.post(
    "/stream/analyze",
    summary="Stream analysis results",
    description="Stream analysis results step-by-step using Server-Sent Events (SSE)"
)
async def stream_analyze_text(request: AnalyzeTextRequest):
    """
    Stream analysis results for a single text.
    
    - **text**: Text content to analyze
    - **include_explanation**: Whether to include detailed explanation
    """
    try:
        await validate_request_size(request.text)
        
        async def event_generator():
            try:
                # Custom JSON encoder for datetime and dataclasses
                def json_serial(obj):
                    if isinstance(obj, datetime):
                        return obj.isoformat()
                    raise TypeError(f"Type {type(obj)} not serializable")

                for step_data in ensemble_scorer.predict_stream(request.text, explain=request.include_explanation):
                    # Convert dataclass objects to dicts
                    if "result" in step_data and hasattr(step_data["result"], "__dataclass_fields__"):
                        step_data["result"] = asdict(step_data["result"])
                        
                        # Handle nested dataclasses in list (like model_predictions)
                        if "model_predictions" in step_data["result"]:
                            step_data["result"]["model_predictions"] = [
                                asdict(p) if hasattr(p, "__dataclass_fields__") else p 
                                for p in step_data["result"]["model_predictions"]
                            ]
                    
                    yield f"data: {json.dumps(step_data, default=json_serial)}\n\n"
                    # Add a small delay to simulate processing if it's too fast (optional, but good for UX testing)
                    # await asyncio.sleep(0.1) 
                    
            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield f"data: {json.dumps({'step': 'error', 'message': str(e)})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/analyze/conversation",
    response_model=AnalyzeConversationResponse,
    summary="Analyze conversation for scam patterns",
    description="Analyze a multi-message conversation for scam indicators and patterns"
)
async def analyze_conversation(request: AnalyzeConversationRequest) -> AnalyzeConversationResponse:
    """
    Analyze a conversation for scam patterns.
    
    - **messages**: List of conversation messages
    - **analyze_individual**: Whether to analyze each message individually
    - **analyze_context**: Whether to analyze conversation context
    - **include_explanation**: Whether to include detailed explanations
    """
    try:
        start_time = datetime.now()
        conversation_id = str(uuid.uuid4())
        
        # Validate conversation
        if not request.messages:
            raise HTTPException(status_code=422, detail="No messages provided")
        
        # Combine all messages for overall analysis
        combined_text = " ".join([msg.text for msg in request.messages])
        await validate_request_size(combined_text)
        
        # Analyze overall conversation
        overall_result = ensemble_scorer.predict_single(
            combined_text,
            explain=request.include_explanation
        )
        
        # Convert to response format
        overall_response_data = {
            "text_id": f"{conversation_id}_overall",
            "final_score": overall_result.final_score,
            "risk_level": overall_result.risk_level,
            "confidence": overall_result.confidence,
            "processing_time": overall_result.processing_time,
            "timestamp": overall_result.timestamp
        }
        
        # Add explanations for overall analysis
        if request.include_explanation:
            explanation_result = scam_explainer.explain_prediction(
                combined_text,
                overall_result,
                include_evidence=True
            )
            
            overall_response_data.update({
                "explanation": overall_result.explanation,
                "key_factors": [
                    {
                        "feature_name": factor.feature_name,
                        "importance": factor.importance,
                        "value": factor.value,
                        "explanation": factor.explanation
                    }
                    for factor in explanation_result.key_factors
                ],
                "evidence_text": explanation_result.evidence_text,
                "recommendations": explanation_result.recommendations,
                "summary": scam_explainer.generate_summary_explanation(explanation_result)
            })
        
        overall_analysis = AnalyzeTextResponse(**overall_response_data)
        
        # Analyze individual messages if requested
        individual_analyses = None
        if request.analyze_individual:
            individual_analyses = []
            
            for i, message in enumerate(request.messages):
                try:
                    if len(message.text.strip()) >= settings.MIN_TEXT_LENGTH:
                        msg_result = ensemble_scorer.predict_single(
                            message.text,
                            explain=False  # Skip explanations for individual messages
                        )
                        
                        msg_response_data = {
                            "text_id": f"{conversation_id}_msg_{i}",
                            "final_score": msg_result.final_score,
                            "risk_level": msg_result.risk_level,
                            "confidence": msg_result.confidence,
                            "processing_time": msg_result.processing_time,
                            "timestamp": msg_result.timestamp
                        }
                        
                        individual_analyses.append(AnalyzeTextResponse(**msg_response_data))
                        
                except Exception as e:
                    logger.warning(f"Failed to analyze message {i}: {e}")
                    # Add placeholder for failed message
                    individual_analyses.append(AnalyzeTextResponse(
                        text_id=f"{conversation_id}_msg_{i}",
                        final_score=0.0,
                        risk_level="error",
                        confidence=0.0,
                        processing_time=0.0,
                        timestamp=datetime.now()
                    ))
        
        # Analyze conversation context
        context_analysis = None
        conversation_patterns = None
        timeline_analysis = None
        
        if request.analyze_context:
            context_analysis = await _analyze_conversation_context(request.messages)
            conversation_patterns = await _analyze_conversation_patterns(request.messages)
            
            # Timeline analysis if timestamps available
            if any(msg.timestamp for msg in request.messages):
                timeline_analysis = await _analyze_conversation_timeline(request.messages)
        
        total_processing_time = (datetime.now() - start_time).total_seconds()
        
        response = AnalyzeConversationResponse(
            conversation_id=conversation_id,
            overall_risk=overall_analysis,
            individual_messages=individual_analyses,
            context_analysis=context_analysis,
            conversation_patterns=conversation_patterns,
            timeline_analysis=timeline_analysis,
            processing_time=total_processing_time,
            timestamp=datetime.now()
        )
        
        logger.info(f"Conversation analysis completed - ID: {conversation_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in conversation analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during conversation analysis: {str(e)}"
        )


@router.post(
    "/analyze/batch",
    response_model=BatchProcessResponse,
    summary="Batch process multiple texts",
    description="Process multiple texts in batch for scam analysis"
)
async def analyze_batch(
    request: BatchProcessRequest,
    background_tasks: BackgroundTasks
) -> BatchProcessResponse:
    """
    Process multiple texts in batch.
    
    - **texts**: List of texts to analyze
    - **include_explanation**: Whether to include explanations (slower)
    - **priority**: Processing priority (normal, high)
    - **callback_url**: Optional callback URL for results
    """
    try:
        batch_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        # Validate batch size
        if len(request.texts) > 100:
            raise HTTPException(
                status_code=422,
                detail="Maximum 100 texts allowed per batch"
            )
        
        # Validate total size
        total_chars = sum(len(text) for text in request.texts)
        if total_chars > settings.MAX_TEXT_LENGTH * 20:  # 20x single text limit
            raise HTTPException(
                status_code=413,
                detail="Total batch size too large"
            )
        
        # For small batches, process synchronously
        if len(request.texts) <= 10:
            results = ensemble_scorer.predict_batch(
                request.texts,
                explain=request.include_explanation
            )
            
            # Convert results to response format
            response_results = []
            for i, result in enumerate(results):
                response_data = {
                    "text_id": f"{batch_id}_item_{i}",
                    "final_score": result.final_score,
                    "risk_level": result.risk_level,
                    "confidence": result.confidence,
                    "processing_time": result.processing_time,
                    "timestamp": result.timestamp
                }
                
                if request.include_explanation:
                    response_data["explanation"] = result.explanation
                
                response_results.append(AnalyzeTextResponse(**response_data))
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return BatchProcessResponse(
                batch_id=batch_id,
                status="completed",
                total_items=len(request.texts),
                processed_items=len(response_results),
                failed_items=len(request.texts) - len(response_results),
                results=response_results,
                processing_time=processing_time,
                created_at=start_time,
                completed_at=datetime.now()
            )
        
        else:
            # For large batches, process asynchronously
            background_tasks.add_task(
                _process_batch_async,
                batch_id,
                request.texts,
                request.include_explanation,
                request.callback_url
            )
            
            return BatchProcessResponse(
                batch_id=batch_id,
                status="processing",
                total_items=len(request.texts),
                processed_items=0,
                failed_items=0,
                results=None,
                processing_time=0.0,
                created_at=start_time,
                completed_at=None
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch processing: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during batch processing: {str(e)}"
        )


@router.get(
    "/batch/{batch_id}",
    response_model=BatchProcessResponse,
    summary="Get batch processing status",
    description="Retrieve status and results of a batch processing job"
)
async def get_batch_status(batch_id: str) -> BatchProcessResponse:
    """Get status of a batch processing job."""
    # In a real implementation, this would query a database or cache
    # For now, return a placeholder response
    raise HTTPException(
        status_code=501,
        detail="Batch status retrieval not implemented yet"
    )


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    summary="Submit user feedback",
    description="Submit feedback on prediction accuracy for model improvement"
)
async def submit_feedback(request: FeedbackRequest) -> FeedbackResponse:
    """
    Submit user feedback on predictions.
    
    - **text_id**: Optional ID of the analyzed text
    - **original_text**: The original text that was analyzed
    - **predicted_score**: The score predicted by the model
    - **actual_label**: The actual label (0=not_scam, 1=scam)
    - **user_feedback**: Optional additional feedback
    - **confidence**: User confidence in their labeling (1-5)
    """
    try:
        feedback_id = str(uuid.uuid4())
        
        # In a real implementation, this would:
        # 1. Store feedback in database
        # 2. Add to model training queue
        # 3. Update model performance metrics
        
        logger.info(f"Received feedback - ID: {feedback_id}, Label: {request.actual_label}")
        
        return FeedbackResponse(
            feedback_id=feedback_id,
            message="Feedback received successfully",
            status="accepted",
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error processing feedback: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing feedback: {str(e)}"
        )


# Helper functions

async def _analyze_conversation_context(messages: List) -> Dict[str, Any]:
    """Analyze conversation context and flow."""
    try:
        context_analysis = {
            "message_count": len(messages),
            "unique_senders": len(set(msg.sender for msg in messages)),
            "avg_message_length": sum(len(msg.text) for msg in messages) / len(messages),
            "sender_distribution": {},
            "escalation_detected": False,
            "conversation_flow": []
        }
        
        # Analyze sender distribution
        sender_counts = {}
        for msg in messages:
            sender_counts[msg.sender] = sender_counts.get(msg.sender, 0) + 1
        
        context_analysis["sender_distribution"] = sender_counts
        
        # Simple escalation detection (increasing urgency/risk over time)
        if len(messages) >= 3:
            scores = []
            for msg in messages:
                if len(msg.text) >= settings.MIN_TEXT_LENGTH:
                    result = ensemble_scorer.predict_single(msg.text, explain=False)
                    scores.append(result.final_score)
            
            if len(scores) >= 3:
                # Check if scores generally increase
                increasing_trend = sum(
                    1 for i in range(1, len(scores)) 
                    if scores[i] > scores[i-1]
                ) >= len(scores) * 0.6
                
                context_analysis["escalation_detected"] = increasing_trend
                context_analysis["risk_progression"] = scores
        
        return context_analysis
        
    except Exception as e:
        logger.error(f"Error analyzing conversation context: {e}")
        return {"error": str(e)}


async def _analyze_conversation_patterns(messages: List) -> Dict[str, Any]:
    """Analyze patterns in conversation."""
    try:
        patterns = {
            "repeated_phrases": {},
            "sender_behavior": {},
            "response_patterns": [],
            "topic_shifts": 0
        }
        
        # Find repeated phrases
        all_text = " ".join([msg.text.lower() for msg in messages])
        words = all_text.split()
        
        # Find repeated phrases (2-3 words)
        for i in range(len(words) - 1):
            phrase = " ".join(words[i:i+2])
            if len(phrase) > 6:  # Skip very short phrases
                patterns["repeated_phrases"][phrase] = patterns["repeated_phrases"].get(phrase, 0) + 1
        
        # Keep only phrases that appear more than once
        patterns["repeated_phrases"] = {
            k: v for k, v in patterns["repeated_phrases"].items() 
            if v > 1
        }
        
        return patterns
        
    except Exception as e:
        logger.error(f"Error analyzing conversation patterns: {e}")
        return {"error": str(e)}


async def _analyze_conversation_timeline(messages: List) -> Dict[str, Any]:
    """Analyze conversation timeline."""
    try:
        timeline = {
            "duration_hours": 0.0,
            "message_frequency": [],
            "peak_activity": None,
            "response_times": []
        }
        
        # Sort messages by timestamp
        timestamped_messages = [msg for msg in messages if msg.timestamp]
        if len(timestamped_messages) < 2:
            return {"error": "Not enough timestamped messages"}
        
        timestamped_messages.sort(key=lambda x: x.timestamp)
        
        # Calculate duration
        start_time = timestamped_messages[0].timestamp
        end_time = timestamped_messages[-1].timestamp
        duration = (end_time - start_time).total_seconds() / 3600  # hours
        timeline["duration_hours"] = duration
        
        # Calculate response times between messages
        response_times = []
        for i in range(1, len(timestamped_messages)):
            prev_msg = timestamped_messages[i-1]
            curr_msg = timestamped_messages[i]
            
            # Only calculate if different senders
            if prev_msg.sender != curr_msg.sender:
                response_time = (curr_msg.timestamp - prev_msg.timestamp).total_seconds() / 60  # minutes
                response_times.append(response_time)
        
        timeline["response_times"] = response_times
        
        return timeline
        
    except Exception as e:
        logger.error(f"Error analyzing conversation timeline: {e}")
        return {"error": str(e)}


async def _process_batch_async(
    batch_id: str,
    texts: List[str],
    include_explanation: bool,
    callback_url: str = None
):
    """Process batch asynchronously in background."""
    try:
        logger.info(f"Starting async batch processing - ID: {batch_id}")
        
        # Process texts
        results = ensemble_scorer.predict_batch(texts, explain=include_explanation)
        
        # In a real implementation:
        # 1. Store results in database
        # 2. Update batch status
        # 3. Send callback if URL provided
        # 4. Clean up temporary data
        
        logger.info(f"Completed async batch processing - ID: {batch_id}")
        
    except Exception as e:
        logger.error(f"Error in async batch processing {batch_id}: {e}")
        # Update batch status to failed