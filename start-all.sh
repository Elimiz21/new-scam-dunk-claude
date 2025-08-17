#!/bin/bash

# Start all services for Scam Dunk

echo "🚀 Starting Scam Dunk Services..."

# Check if MongoDB is running (for local development)
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can use Docker: docker run -d -p 27017:27017 --name mongodb mongo:7.0"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "packages/api/node_modules" ]; then
    echo "📦 Installing API dependencies..."
    cd packages/api && npm install && cd ../..
fi

if [ ! -d "packages/web/node_modules" ]; then
    echo "📦 Installing Web dependencies..."
    cd packages/web && npm install --legacy-peer-deps && cd ../..
fi

# Create .env files if they don't exist
if [ ! -f "packages/api/.env" ]; then
    echo "📝 Creating API .env file..."
    cat > packages/api/.env << EOF
# API Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/scamdunk
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# API Keys (Add your real keys here)
OPENAI_API_KEY=sk-test-key
YAHOO_FINANCE_API_KEY=your-key
COINGECKO_API_KEY=your-key

# Services
TRUECALLER_API_KEY=simulated
SEC_API_KEY=simulated
FINRA_API_KEY=simulated

# Email
MAILGUN_API_KEY=your-key
MAILGUN_DOMAIN=your-domain

# SMS
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL
FRONTEND_URL=http://localhost:3002
EOF
fi

# Start services
echo "🔧 Starting API server on port 3001..."
cd packages/api && npm run dev &
API_PID=$!

echo "🌐 Starting Web server on port 3002..."
cd ../web && PORT=3002 npm run dev &
WEB_PID=$!

echo "✅ All services started!"
echo "   API: http://localhost:3001"
echo "   Web: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $API_PID $WEB_PID; exit" INT
wait