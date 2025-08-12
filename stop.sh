#!/bin/bash

# Scam Dunk - Graceful Shutdown Script

echo "🛑 Stopping Scam Dunk Platform..."
echo "================================="

# Stop application services first
echo "📦 Stopping application services..."
docker-compose stop web api ai blockchain nginx

# Stop monitoring services
echo "📊 Stopping monitoring services..."
docker-compose stop prometheus grafana

# Stop infrastructure services
echo "🏗️ Stopping infrastructure services..."
docker-compose stop elasticsearch kafka minio redis postgres

echo ""
echo "✅ All services stopped successfully!"
echo ""
echo "Options:"
echo "  • Remove containers: docker-compose down"
echo "  • Remove containers and volumes: docker-compose down -v"
echo "  • Restart services: ./start.sh"
echo ""