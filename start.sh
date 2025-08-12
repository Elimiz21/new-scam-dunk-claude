#!/bin/bash

# Scam Dunk - Complete Stack Startup Script
# This script starts all services for the Scam Dunk platform

set -e

echo "🚀 Starting Scam Dunk Platform..."
echo "================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p monitoring/grafana/{dashboards,datasources}
mkdir -p packages/{api,web,ai,blockchain}/logs

# Check if .env files exist, create from examples if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cat > .env << EOF
# Blockchain API Keys (Get free keys from respective providers)
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
INFURA_PROJECT_ID=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# External APIs (Optional)
COINGECKO_API_KEY=your_coingecko_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
EOF
    echo "⚠️  Please update .env with your API keys"
fi

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v 2>/dev/null || true

# Build images
echo "🔨 Building Docker images..."
docker-compose build --parallel

# Start infrastructure services first
echo "🏗️ Starting infrastructure services..."
docker-compose up -d postgres redis elasticsearch kafka minio

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U scamdunk -d scamdunk > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✅"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✅"

# Wait for Elasticsearch to be ready (this takes longer)
echo "⏳ Waiting for Elasticsearch to be ready (this may take a minute)..."
for i in {1..30}; do
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo " ✅"
        break
    fi
    echo -n "."
    sleep 2
done

# Start application services
echo "🚀 Starting application services..."
docker-compose up -d api ai blockchain

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo " ✅"
        break
    fi
    echo -n "."
    sleep 2
done

# Start web application
echo "🌐 Starting web application..."
docker-compose up -d web

# Start monitoring services
echo "📊 Starting monitoring services..."
docker-compose up -d prometheus grafana

# Start Nginx reverse proxy
echo "🔄 Starting Nginx reverse proxy..."
docker-compose up -d nginx

# Wait for all services to be healthy
echo "🏥 Checking service health..."
sleep 5

# Display service status
echo ""
echo "================================="
echo "✅ Scam Dunk Platform is running!"
echo "================================="
echo ""
echo "🌐 Web Application: http://localhost:3000"
echo "🔌 API Server: http://localhost:4000"
echo "🤖 AI Service: http://localhost:8001"
echo "🔗 Blockchain Service: http://localhost:3002"
echo "📊 Grafana Dashboard: http://localhost:3333 (admin/admin)"
echo "📈 Prometheus: http://localhost:9090"
echo "🗄️ MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
echo ""
echo "📝 Logs: docker-compose logs -f [service_name]"
echo "🛑 Stop: ./stop.sh"
echo ""
echo "⚠️  First time setup:"
echo "1. Run database migrations: docker-compose exec api npm run db:migrate"
echo "2. Seed database: docker-compose exec api npm run db:seed"
echo "3. Update .env with your API keys"
echo ""
echo "Happy scam hunting! 🎯"