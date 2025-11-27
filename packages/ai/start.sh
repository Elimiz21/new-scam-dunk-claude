#!/bin/bash
set -e

# Use PORT environment variable provided by Railway, default to 8001
PORT="${PORT:-8001}"

echo "Starting Scam Dunk AI Service on port $PORT..."

# Start Uvicorn
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1

