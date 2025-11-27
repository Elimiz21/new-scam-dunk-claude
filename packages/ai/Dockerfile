# Multi-stage Docker build for Scam Dunk AI Service
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    make \
    libffi-dev \
    libssl-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash scamdunk
USER scamdunk
WORKDIR /home/scamdunk

# Install Python dependencies
COPY --chown=scamdunk:scamdunk requirements.txt .
RUN pip install --user -r requirements.txt

# Download ML model data
RUN python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('wordnet', quiet=True); nltk.download('averaged_perceptron_tagger', quiet=True)"
RUN pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

# Production stage
FROM python:3.11-slim as production

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/home/scamdunk/.local/bin:$PATH"
ENV NLTK_DATA="/home/scamdunk/nltk_data"

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash scamdunk

# Copy Python packages from base stage
COPY --from=base /home/scamdunk/.local /home/scamdunk/.local

# Copy NLTK data
COPY --from=base /home/scamdunk/nltk_data /home/scamdunk/nltk_data

USER scamdunk
WORKDIR /home/scamdunk/app

# Copy application code
COPY --chown=scamdunk:scamdunk . .

# Create directories for models, logs, and data
RUN mkdir -p \
    models/cache \
    models/custom \
    logs \
    data/training \
    data/validation

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health/ || exit 1

# Expose port
EXPOSE 8001

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]