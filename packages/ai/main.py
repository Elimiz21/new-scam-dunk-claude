from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from app.api.routes import detection, health, scan
from app.core.config import settings
from app.services.redis_service import redis_service
from app.services.detection_service import detection_service

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await redis_service.connect()
    await detection_service.initialize()
    
    # Start background task processor
    await start_background_processors()
    
    yield
    
    # Shutdown
    await redis_service.disconnect()

app = FastAPI(
    title="Scam Dunk AI Service",
    description="AI-powered scam detection service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(detection.router, prefix="/api/v1/detection", tags=["detection"])
app.include_router(scan.router, prefix="/api/v1/scan", tags=["scan"])

@app.get("/")
async def root():
    return {
        "message": "Scam Dunk AI Service",
        "version": "1.0.0",
        "status": "running"
    }

async def start_background_processors():
    """Start background task processors"""
    import asyncio
    from app.workers.scan_processor import ScanProcessor
    
    processor = ScanProcessor()
    asyncio.create_task(processor.start())

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )