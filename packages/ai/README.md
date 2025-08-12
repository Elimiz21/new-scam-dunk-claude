# Scam Dunk AI Detection Service

A comprehensive AI-powered scam detection service built with FastAPI, featuring ensemble models, real-time analysis, and advanced pattern matching.

## Features

### Core AI Capabilities
- **Multi-Model Ensemble**: Combines BERT-based text classification, pattern matching, sentiment analysis, and entity recognition
- **Real-time Detection**: Fast analysis of text messages, emails, and conversations
- **Batch Processing**: Handle multiple texts simultaneously with async processing
- **Explainable AI**: Detailed explanations of why content was flagged as suspicious

### Advanced Features
- **Pattern Library**: Comprehensive database of known scam patterns across multiple categories
- **Risk Scoring**: Sophisticated scoring algorithm with confidence calibration
- **Conversation Analysis**: Context-aware analysis of multi-message conversations
- **Performance Monitoring**: Real-time metrics and model drift detection

### Technical Architecture
- **FastAPI Framework**: High-performance async web framework
- **Redis Integration**: Caching and background job processing
- **Docker Support**: Full containerization with multi-stage builds
- **Scalable Design**: Horizontal scaling support with load balancing

## Quick Start

### Prerequisites
- Python 3.11+
- Redis
- PostgreSQL (optional)
- Docker & Docker Compose (recommended)

### Installation with Docker (Recommended)

1. **Clone and setup:**
```bash
git clone <repository-url>
cd packages/ai
cp .env.example .env
```

2. **Start the services:**
```bash
# Start basic services
docker-compose up -d

# Or start with monitoring
docker-compose --profile monitoring up -d

# Or start with nginx proxy
docker-compose --profile with-proxy up -d
```

3. **Verify installation:**
```bash
curl http://localhost:8001/health/
```

### Local Development Installation

1. **Setup Python environment:**
```bash
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

2. **Download required models:**
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"
python -m spacy download en_core_web_sm
```

3. **Start Redis:**
```bash
redis-server
```

4. **Run the service:**
```bash
python main.py
```

## API Usage

### Basic Text Analysis
```bash
curl -X POST "http://localhost:8001/api/v1/detection/analyze/text" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Guaranteed 500% returns! Act now before this limited time offer expires!",
    "include_explanation": true,
    "include_evidence": true
  }'
```

### Conversation Analysis
```bash
curl -X POST "http://localhost:8001/api/v1/detection/analyze/conversation" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"sender": "unknown", "text": "Hello, I have a great investment opportunity for you"},
      {"sender": "user", "text": "What kind of investment?"},
      {"sender": "unknown", "text": "Bitcoin trading with guaranteed 200% returns in 24 hours!"}
    ]
  }'
```

### Batch Processing
```bash
curl -X POST "http://localhost:8001/api/v1/detection/analyze/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "Your account has been suspended. Click here to verify immediately.",
      "Hello, how are you today?",
      "You have won $1,000,000! Claim your prize now!"
    ]
  }'
```

### Quick Scan
```bash
curl -X POST "http://localhost:8001/api/v1/scan/quick-scan" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Urgent action required! Your account will be locked."
  }'
```

## API Documentation

Once running, visit:
- **Interactive API Docs**: http://localhost:8001/docs
- **ReDoc Documentation**: http://localhost:8001/redoc
- **Health Check**: http://localhost:8001/health/

## Model Components

### 1. BERT-Based Classifier
- Uses DistilBERT for text classification
- Simulated model for development/testing
- Fine-tunable for specific domains

### 2. Pattern Matcher
- 100+ predefined scam patterns
- Categorized by threat type
- Regular expression based matching
- Weighted scoring system

### 3. Sentiment Analyzer
- Urgency and pressure tactic detection
- Emotional manipulation identification
- Fear and greed appeal analysis

### 4. Ensemble Scorer
- Weighted combination of all models
- Confidence calibration
- Explainable predictions

## Configuration

Key configuration options in `.env`:

```env
# Model weights for ensemble
ENSEMBLE_WEIGHTS={"bert": 0.4, "pattern": 0.3, "sentiment": 0.15, "ner": 0.15}

# Detection thresholds
SCAM_THRESHOLD=0.7
HIGH_RISK_THRESHOLD=0.9
CONFIDENCE_THRESHOLD=0.6

# Performance settings
MAX_TEXT_LENGTH=10000
BERT_BATCH_SIZE=16
REDIS_POOL_SIZE=10
```

## Deployment

### Production Deployment

1. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with production values
```

2. **Deploy with Docker Compose:**
```bash
docker-compose -f docker-compose.yml --profile with-proxy --profile monitoring up -d
```

3. **Configure SSL (recommended):**
```bash
# Add SSL certificates to ./ssl/
# Uncomment HTTPS section in nginx.conf
```

### Kubernetes Deployment

```yaml
# Example deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scamdunk-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: scamdunk-ai
  template:
    metadata:
      labels:
        app: scamdunk-ai
    spec:
      containers:
      - name: scamdunk-ai
        image: scamdunk-ai:latest
        ports:
        - containerPort: 8001
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
```

## Monitoring and Observability

### Health Checks
- **Basic Health**: `GET /health/`
- **Detailed Status**: `GET /health/models`
- **System Info**: `GET /health/system`
- **Performance Metrics**: `GET /health/metrics`

### Metrics Collection
- Request/response metrics
- Model performance tracking
- Error rate monitoring
- Resource utilization

### Logging
Structured logging with multiple levels:
```python
# Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL=INFO
LOG_FILE=logs/scamdunk-ai.log
```

## Development

### Running Tests
```bash
pytest tests/ -v --cov=app
```

### Code Quality
```bash
# Format code
black app/
isort app/

# Lint code
flake8 app/
mypy app/
```

### Adding New Models

1. **Create model class:**
```python
class NewScamModel:
    def predict(self, text: str) -> Dict[str, float]:
        # Implementation
        return {"scam_probability": 0.5, "confidence": 0.8}
```

2. **Register in ensemble:**
```python
# In ensemble_scorer.py
def _get_new_model_prediction(self, text: str) -> ModelPrediction:
    # Integration logic
```

3. **Update configuration:**
```python
# Add to ENSEMBLE_WEIGHTS
"new_model": 0.1
```

## Performance Optimization

### Caching Strategy
- Text hash-based caching
- Configurable TTL
- Redis-backed storage
- Cache hit rate monitoring

### Scaling Considerations
- Stateless design for horizontal scaling
- Background job processing
- Database connection pooling
- Resource-based auto-scaling

### Memory Management
- Model lazy loading
- Batch processing optimization
- Memory usage monitoring
- Garbage collection tuning

## Security

### Authentication & Authorization
- API key authentication (optional)
- Rate limiting per IP/user
- Request size limits
- CORS configuration

### Data Protection
- Input sanitization
- Output filtering
- Secure headers
- SSL/TLS encryption

### Privacy
- No persistent text storage
- Configurable data retention
- GDPR compliance options
- Audit logging

## Troubleshooting

### Common Issues

1. **Model Loading Errors:**
```bash
# Check model files
ls -la models/
# Verify dependencies
pip check
```

2. **Redis Connection Issues:**
```bash
# Check Redis status
redis-cli ping
# Verify configuration
echo $REDIS_URL
```

3. **High Memory Usage:**
```bash
# Monitor memory
docker stats scamdunk-ai
# Adjust batch sizes
export BERT_BATCH_SIZE=8
```

4. **Slow Response Times:**
```bash
# Check health metrics
curl http://localhost:8001/health/metrics
# Enable caching
export USE_CACHE=true
```

### Debug Mode
```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
python main.py
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-model`)
3. Commit changes (`git commit -am 'Add new scam model'`)
4. Push to branch (`git push origin feature/new-model`)
5. Create Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create GitHub issues for bugs
- Check documentation for API usage
- Monitor logs for debugging
- Review health endpoints for status

## Roadmap

- [ ] Advanced transformer models (GPT-based)
- [ ] Multilingual support expansion
- [ ] Real-time learning from feedback
- [ ] Graph-based analysis for conversation networks
- [ ] Integration with threat intelligence feeds
- [ ] Mobile SDK development