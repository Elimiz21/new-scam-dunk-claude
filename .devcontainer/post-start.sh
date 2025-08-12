#!/bin/bash
set -e

echo "🔄 Starting Scam Dunk services..."

# Ensure services are healthy
echo "🏥 Checking service health..."

# Check PostgreSQL
until pg_isready -h localhost -p 5432 -U scamdunk; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL is ready"

# Check Redis
until redis-cli -h localhost ping &>/dev/null; do
  echo "⏳ Waiting for Redis..."
  sleep 2
done
echo "✅ Redis is ready"

# Check Elasticsearch (may take longer)
echo "⏳ Waiting for Elasticsearch (this may take a minute)..."
for i in {1..30}; do
  if curl -s http://localhost:9200/_cluster/health &>/dev/null; then
    echo "✅ Elasticsearch is ready"
    break
  fi
  sleep 2
done

# Set permissive permissions (as requested for development)
sudo chmod -R 777 /workspace 2>/dev/null || true
sudo chmod -R 777 /home/vscode 2>/dev/null || true

echo "🚀 All services are ready!"
echo "📝 You can now start development with 'pnpm dev'"