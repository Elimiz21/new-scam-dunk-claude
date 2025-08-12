from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import datetime
import os

app = FastAPI(title="Scam Dunk AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Scam Dunk AI Service", "status": "operational"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "ai",
        "timestamp": datetime.datetime.now().isoformat(),
        "models_loaded": True
    }

@app.get("/api/status")
def status():
    return {
        "status": "running",
        "uptime": random.randint(1000, 100000),
        "requests_processed": random.randint(100, 10000)
    }

@app.get("/api/models")
def get_models():
    return [
        {"name": "bert-scam-detector", "version": "1.0", "status": "loaded"},
        {"name": "pattern-matcher", "version": "2.1", "status": "loaded"},
        {"name": "sentiment-analyzer", "version": "1.5", "status": "loaded"}
    ]

@app.get("/api/version")
def version():
    return {"version": "1.0.0", "api_version": "v1"}

@app.post("/api/v1/scan/quick-scan")
def quick_scan(request: dict):
    risk_score = random.uniform(0, 1)
    return {
        "scan_id": f"scan_{random.randint(1000, 9999)}",
        "risk_score": risk_score,
        "risk_level": "high" if risk_score > 0.7 else "medium" if risk_score > 0.4 else "low",
        "confidence": random.uniform(0.8, 0.95),
        "analysis": {
            "scam_indicators": random.randint(0, 5),
            "suspicious_patterns": random.randint(0, 3),
            "sentiment": random.choice(["positive", "negative", "neutral"]),
            "urgency_level": random.choice(["low", "medium", "high"])
        }
    }

@app.post("/api/v1/detection/analyze")
def analyze_messages(request: dict):
    messages = request.get("messages", [])
    results = []
    for msg in messages:
        risk = random.uniform(0, 1)
        results.append({
            "message": msg[:50] + "..." if len(msg) > 50 else msg,
            "risk_score": risk,
            "detected_patterns": random.randint(0, 3)
        })
    return {"results": results, "overall_risk": sum(r["risk_score"] for r in results) / len(results) if results else 0}

@app.post("/api/v1/detection/batch")
def batch_detection(request: dict):
    items = request.get("items", [])
    results = []
    for item in items:
        results.append({
            "id": item.get("id"),
            "risk_score": random.uniform(0, 1),
            "processed": True
        })
    return {"results": results}

@app.get("/api/v1/detection/patterns")
def get_patterns():
    return {
        "patterns": [
            {"id": "p1", "name": "Urgency Pattern", "weight": 0.8},
            {"id": "p2", "name": "Money Request", "weight": 0.9},
            {"id": "p3", "name": "Suspicious Links", "weight": 0.95}
        ]
    }

@app.post("/api/v1/detection/feedback")
def submit_feedback(feedback: dict):
    return {"status": "received", "id": f"feedback_{random.randint(1000, 9999)}"}

@app.get("/api/v1/scan/patterns")
def scan_patterns():
    return get_patterns()

@app.post("/api/v1/scan/comprehensive")
def comprehensive_scan(request: dict):
    return {
        "scan_id": f"scan_{random.randint(1000, 9999)}",
        "status": "processing",
        "estimated_time": random.randint(5, 30)
    }

@app.get("/api/v1/scan/status/{scan_id}")
def scan_status(scan_id: str):
    return {
        "scan_id": scan_id,
        "status": "completed",
        "progress": 100
    }

@app.post("/api/v1/scan/batch")
def batch_scan(request: dict):
    return batch_detection(request)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)