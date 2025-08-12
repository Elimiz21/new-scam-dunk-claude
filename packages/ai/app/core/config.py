"""Configuration settings for the AI detection service."""

import os
from typing import List, Optional
from pydantic import BaseSettings, validator
from pathlib import Path


class Settings(BaseSettings):
    """Application settings."""
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Scam Dunk AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    WORKERS: int = 1
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "https://ocma.dev",
        "https://www.ocma.dev"
    ]
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/scamdunk"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0
    REDIS_POOL_SIZE: int = 10
    
    # Model Configuration
    MODEL_CACHE_DIR: str = "./models/cache"
    MODEL_UPDATE_INTERVAL: int = 3600  # seconds
    MAX_MODEL_MEMORY: int = 2048  # MB
    
    # BERT Configuration
    BERT_MODEL_NAME: str = "distilbert-base-uncased"
    BERT_MAX_LENGTH: int = 512
    BERT_BATCH_SIZE: int = 16
    
    # Scam Detection Configuration
    SCAM_THRESHOLD: float = 0.7
    HIGH_RISK_THRESHOLD: float = 0.9
    CONFIDENCE_THRESHOLD: float = 0.6
    
    # Text Processing Configuration
    MAX_TEXT_LENGTH: int = 10000
    MIN_TEXT_LENGTH: int = 10
    SUPPORTED_LANGUAGES: List[str] = ["en", "es", "fr", "de", "it"]
    
    # Feature Extraction Configuration
    TFIDF_MAX_FEATURES: int = 10000
    TFIDF_NGRAM_RANGE: tuple = (1, 3)
    WORD_EMBEDDING_DIM: int = 300
    
    # Risk Scoring Configuration
    ENSEMBLE_WEIGHTS: dict = {
        "bert": 0.4,
        "pattern": 0.3,
        "sentiment": 0.15,
        "ner": 0.15
    }
    
    # Background Processing Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    TASK_TIMEOUT: int = 300  # seconds
    MAX_RETRIES: int = 3
    
    # Security Configuration
    SECRET_KEY: str = "your-secret-key-here"
    API_KEY: Optional[str] = None
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: str = "logs/scamdunk-ai.log"
    
    # Monitoring Configuration
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    HEALTH_CHECK_INTERVAL: int = 30
    
    # Model Training Configuration
    TRAINING_DATA_PATH: str = "./data/training"
    VALIDATION_DATA_PATH: str = "./data/validation"
    MODEL_SAVE_PATH: str = "./models/custom"
    TRAINING_BATCH_SIZE: int = 32
    LEARNING_RATE: float = 2e-5
    NUM_EPOCHS: int = 3
    
    @validator("MODEL_CACHE_DIR", "TRAINING_DATA_PATH", "VALIDATION_DATA_PATH", "MODEL_SAVE_PATH")
    def create_directories(cls, v):
        """Ensure directories exist."""
        Path(v).mkdir(parents=True, exist_ok=True)
        return v
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        """Parse CORS origins from environment variable."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


class ModelConfig:
    """Configuration for ML models."""
    
    SCAM_PATTERNS = [
        # Financial scams
        r"guaranteed\s+returns?",
        r"risk\s*-?\s*free\s+investment",
        r"make\s+money\s+fast",
        r"easy\s+money",
        r"limited\s+time\s+offer",
        r"act\s+now",
        r"urgent\s+action\s+required",
        r"confirm\s+your\s+account",
        r"verify\s+your\s+identity",
        r"suspended\s+account",
        
        # Crypto scams
        r"bitcoin\s+giveaway",
        r"crypto\s+investment",
        r"trading\s+bot",
        r"pump\s+and\s+dump",
        r"rug\s+pull",
        
        # Romance scams
        r"i\s+love\s+you",
        r"need\s+money\s+for",
        r"emergency\s+funds",
        r"western\s+union",
        r"money\s+gram",
        
        # Tech support scams
        r"microsoft\s+support",
        r"virus\s+detected",
        r"computer\s+infected",
        r"call\s+this\s+number",
        
        # Phishing
        r"click\s+here\s+to",
        r"download\s+attachment",
        r"update\s+your\s+payment",
        r"expired\s+credit\s+card"
    ]
    
    SUSPICIOUS_DOMAINS = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "goo.gl",
        "ow.ly"
    ]
    
    FINANCIAL_ENTITIES = [
        "bank", "account", "credit card", "bitcoin", "ethereum",
        "crypto", "investment", "profit", "money", "cash",
        "wire transfer", "paypal", "venmo", "cashapp"
    ]
    
    URGENCY_KEYWORDS = [
        "urgent", "immediate", "asap", "now", "quickly",
        "hurry", "limited time", "expires", "deadline"
    ]


# Model configuration instance
model_config = ModelConfig()