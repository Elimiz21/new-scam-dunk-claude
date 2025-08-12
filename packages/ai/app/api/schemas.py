"""Pydantic schemas for API requests and responses."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level enumeration."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"


class TextAnalysisRequest(BaseModel):
    """Request schema for text analysis."""
    text: str = Field(..., min_length=1, max_length=10000, description="Text to analyze")
    include_explanation: bool = Field(default=True, description="Include detailed explanation")
    include_evidence: bool = Field(default=True, description="Highlight evidence in text")
    model_config: Optional[Dict[str, Any]] = Field(default=None, description="Model configuration overrides")
    
    @validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Text cannot be empty')
        return v.strip()


class ConversationMessage(BaseModel):
    """Individual message in a conversation."""
    sender: str = Field(..., description="Sender identifier")
    timestamp: Optional[datetime] = Field(default=None, description="Message timestamp")
    text: str = Field(..., min_length=1, description="Message content")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")


class ConversationAnalysisRequest(BaseModel):
    """Request schema for conversation analysis."""
    messages: List[ConversationMessage] = Field(..., min_items=1, description="List of messages")
    analyze_individual: bool = Field(default=True, description="Analyze each message individually")
    analyze_context: bool = Field(default=True, description="Analyze conversation context")
    include_explanation: bool = Field(default=True, description="Include detailed explanation")
    
    @validator('messages')
    def validate_messages(cls, v):
        if not v:
            raise ValueError('At least one message required')
        return v


class BatchAnalysisRequest(BaseModel):
    """Request schema for batch analysis."""
    texts: List[str] = Field(..., min_items=1, max_items=100, description="List of texts to analyze")
    include_explanation: bool = Field(default=False, description="Include explanations (slower)")
    priority: str = Field(default="normal", description="Processing priority")
    callback_url: Optional[str] = Field(default=None, description="Callback URL for results")
    
    @validator('texts')
    def validate_texts(cls, v):
        if not v:
            raise ValueError('At least one text required')
        if len(v) > 100:
            raise ValueError('Maximum 100 texts per batch')
        return [text.strip() for text in v if text.strip()]


class ModelPredictionResponse(BaseModel):
    """Response schema for individual model prediction."""
    model_name: str
    score: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    processing_time: float
    metadata: Optional[Dict[str, Any]] = None


class FeatureImportanceResponse(BaseModel):
    """Response schema for feature importance."""
    feature_name: str
    importance: float
    value: Any
    explanation: str


class TextAnalysisResponse(BaseModel):
    """Response schema for text analysis."""
    text_id: Optional[str] = None
    final_score: float = Field(..., ge=0.0, le=1.0, description="Final scam probability")
    risk_level: RiskLevel = Field(..., description="Risk level classification")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence")
    processing_time: float = Field(..., description="Processing time in seconds")
    timestamp: datetime = Field(default_factory=datetime.now)
    
    # Model predictions
    model_predictions: Optional[List[ModelPredictionResponse]] = None
    
    # Explanations
    explanation: Optional[List[str]] = None
    key_factors: Optional[List[FeatureImportanceResponse]] = None
    evidence_text: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    summary: Optional[str] = None
    
    # Additional analysis
    preprocessing_info: Optional[Dict[str, Any]] = None
    detected_entities: Optional[Dict[str, List[str]]] = None
    text_statistics: Optional[Dict[str, float]] = None


class ConversationAnalysisResponse(BaseModel):
    """Response schema for conversation analysis."""
    conversation_id: Optional[str] = None
    overall_risk: TextAnalysisResponse
    individual_messages: Optional[List[TextAnalysisResponse]] = None
    context_analysis: Optional[Dict[str, Any]] = None
    conversation_patterns: Optional[Dict[str, Any]] = None
    timeline_analysis: Optional[Dict[str, Any]] = None
    processing_time: float
    timestamp: datetime = Field(default_factory=datetime.now)


class BatchAnalysisResponse(BaseModel):
    """Response schema for batch analysis."""
    batch_id: str
    status: str = Field(..., description="Processing status")
    total_items: int
    processed_items: int
    failed_items: int
    results: Optional[List[TextAnalysisResponse]] = None
    processing_time: float
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


class ModelStatusResponse(BaseModel):
    """Response schema for model status."""
    model_name: str
    is_loaded: bool
    version: Optional[str] = None
    last_updated: Optional[datetime] = None
    performance_metrics: Optional[Dict[str, float]] = None
    memory_usage: Optional[float] = None


class HealthResponse(BaseModel):
    """Response schema for health check."""
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str
    models_status: List[ModelStatusResponse]
    system_info: Dict[str, Any]
    uptime_seconds: float


class FeedbackRequest(BaseModel):
    """Request schema for user feedback."""
    text_id: Optional[str] = None
    original_text: str = Field(..., description="Original analyzed text")
    predicted_score: float = Field(..., ge=0.0, le=1.0)
    actual_label: int = Field(..., ge=0, le=1, description="Actual label: 0=not_scam, 1=scam")
    user_feedback: Optional[str] = None
    confidence: Optional[int] = Field(None, ge=1, le=5, description="User confidence 1-5")


class FeedbackResponse(BaseModel):
    """Response schema for feedback submission."""
    feedback_id: str
    message: str
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


# Request/Response models for different endpoints
class AnalyzeTextRequest(TextAnalysisRequest):
    """Specific request for /analyze/text endpoint."""
    pass


class AnalyzeTextResponse(TextAnalysisResponse):
    """Specific response for /analyze/text endpoint."""
    pass


class AnalyzeConversationRequest(ConversationAnalysisRequest):
    """Specific request for /analyze/conversation endpoint."""
    pass


class AnalyzeConversationResponse(ConversationAnalysisResponse):
    """Specific response for /analyze/conversation endpoint."""
    pass


class BatchProcessRequest(BatchAnalysisRequest):
    """Specific request for /analyze/batch endpoint."""
    pass


class BatchProcessResponse(BatchAnalysisResponse):
    """Specific response for /analyze/batch endpoint."""
    pass