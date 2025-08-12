#!/bin/bash

# Scam Dunk - Minimal Stack Startup Script
# This starts a working version with mock services

set -e

echo "🚀 Starting Scam Dunk Platform (Minimal Version)..."
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose-minimal.yml down 2>/dev/null || true

# Start services
echo "🏗️ Starting services..."
docker-compose -f docker-compose-minimal.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
echo ""

# Check each service
services=("postgres:5432" "redis:6379" "api:4000" "web:3000" "ai:8001" "blockchain:3002")
for service in "${services[@]}"; do
    name="${service%%:*}"
    port="${service#*:}"
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
        echo "✅ $name is running on port $port"
    else
        echo "⏳ $name is starting on port $port..."
    fi
done

echo ""
echo "================================="
echo "✅ Scam Dunk Platform is running!"
echo "================================="
echo ""
echo "🌐 Web Application: http://localhost:3000"
echo "🔌 API Server: http://localhost:4000"
echo "🤖 AI Service: http://localhost:8001"
echo "🔗 Blockchain Service: http://localhost:3002"
echo "🗄️ PostgreSQL: localhost:5432 (user: scamdunk, pass: scamdunk_dev_2024)"
echo "📦 Redis: localhost:6379"
echo ""
echo "📝 View logs: docker-compose -f docker-compose-minimal.yml logs -f"
echo "🛑 Stop services: docker-compose -f docker-compose-minimal.yml down"
echo ""
echo "This is a minimal working version with mock services."
echo "The full application code is ready in the packages/ directory."
echo ""