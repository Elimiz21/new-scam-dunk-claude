#!/bin/bash
set -e

# Debugging Info
echo "=== Debug Info ==="
echo "Date: $(date)"
echo "User: $(whoami)"
echo "Dir: $(pwd)"
echo "PATH: $PATH"
echo "Python: $(python --version)"
echo "Uvicorn: $(python -m uvicorn --version || echo 'not found')"
echo "Installed packages:"
pip list | head -n 20
echo "=================="

# Use PORT environment variable provided by Railway, default to 8001
PORT="${PORT:-8001}"

echo "Starting Scam Dunk AI Service on port $PORT..."

# Start Uvicorn using python -m to ensure we use the module in the current environment
# Using --log-level debug to see more startup info
exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1 --log-level debug
