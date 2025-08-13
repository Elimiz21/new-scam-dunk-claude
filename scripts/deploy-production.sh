#!/bin/bash

# Production Deployment Script for Scam Dunk
# This script handles the complete production deployment process

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   print_error "Please do not run this script as root!"
   exit 1
fi

print_status "🚀 Starting Scam Dunk Production Deployment..."

# Step 1: Environment Check
print_status "Checking environment..."

if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_warning "Please copy .env.production.example to .env.production and configure all values."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Verify critical environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "NEXT_PUBLIC_API_URL"
    "OPENAI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set!"
        exit 1
    fi
done

print_success "Environment variables verified"

# Step 2: Install Dependencies
print_status "Installing dependencies..."

# Install root dependencies
npm ci --production

# Install package dependencies
cd packages/web && npm ci --production && cd ../..
cd packages/api && npm ci --production && cd ../..
cd packages/blockchain && npm ci --production && cd ../..

print_success "Dependencies installed"

# Step 3: Run Tests
print_status "Running production tests..."

npm run test:production || {
    print_error "Tests failed! Aborting deployment."
    exit 1
}

print_success "All tests passed"

# Step 4: Build Applications
print_status "Building applications..."

# Build web application
cd packages/web
npm run build
cd ../..

# Build API
cd packages/api
npm run build
cd ../..

# Build blockchain service
cd packages/blockchain
npm run build
cd ../..

print_success "Applications built successfully"

# Step 5: Database Setup
print_status "Setting up database..."

cd packages/api
npx prisma migrate deploy
npx prisma generate
cd ../..

print_success "Database configured"

# Step 6: Asset Optimization
print_status "Optimizing assets..."

# Compress static assets
find packages/web/.next/static -type f \( -name "*.js" -o -name "*.css" \) -exec gzip -k {} \;

print_success "Assets optimized"

# Step 7: Security Checks
print_status "Running security audit..."

npm audit --production || print_warning "Some vulnerabilities found. Please review."

# Check for exposed secrets
if grep -r "sk_live\|pk_live\|api_key" packages/web/.next/static 2>/dev/null; then
    print_error "Potential secrets found in build! Aborting."
    exit 1
fi

print_success "Security checks completed"

# Step 8: Docker Build (if using Docker)
if [ -f "docker-compose.production.yml" ]; then
    print_status "Building Docker containers..."
    docker-compose -f docker-compose.production.yml build
    print_success "Docker containers built"
fi

# Step 9: Deploy with PM2 (if not using Docker)
if [ ! -f "docker-compose.production.yml" ] || [ "$DEPLOY_METHOD" = "pm2" ]; then
    print_status "Deploying with PM2..."
    
    # Stop existing processes
    pm2 stop ecosystem.config.js 2>/dev/null || true
    
    # Start new processes
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    print_success "PM2 deployment complete"
fi

# Step 10: Nginx Configuration
print_status "Configuring Nginx..."

if [ -f "/etc/nginx/sites-available/scamdunk" ]; then
    print_warning "Nginx configuration already exists. Skipping..."
else
    sudo cp nginx/sites-enabled/scamdunk.conf /etc/nginx/sites-available/scamdunk
    sudo ln -s /etc/nginx/sites-available/scamdunk /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    print_success "Nginx configured"
fi

# Step 11: SSL Certificate
print_status "Setting up SSL certificate..."

if [ ! -f "/etc/letsencrypt/live/scamdunk.com/fullchain.pem" ]; then
    sudo certbot --nginx -d scamdunk.com -d www.scamdunk.com --non-interactive --agree-tos -m admin@scamdunk.com
    print_success "SSL certificate installed"
else
    print_warning "SSL certificate already exists"
fi

# Step 12: Health Checks
print_status "Running health checks..."

sleep 5

# Check web app
curl -f http://localhost:3000/api/health || {
    print_error "Web app health check failed!"
    exit 1
}

# Check API
curl -f http://localhost:4000/health || {
    print_error "API health check failed!"
    exit 1
}

print_success "Health checks passed"

# Step 13: Cache Warming
print_status "Warming caches..."

# Warm Redis cache with common queries
node scripts/warm-cache.js

print_success "Caches warmed"

# Step 14: Monitoring Setup
print_status "Setting up monitoring..."

# Configure Datadog (if API key is set)
if [ ! -z "$DATADOG_API_KEY" ]; then
    DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=$DATADOG_API_KEY DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
    print_success "Datadog agent installed"
fi

# Step 15: Backup Initial State
print_status "Creating initial backup..."

./scripts/backup-production.sh

print_success "Initial backup created"

# Step 16: Notification
print_status "Sending deployment notification..."

curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"🚀 Scam Dunk deployed to production successfully! Version: $(git rev-parse --short HEAD)\"}" \
    2>/dev/null || print_warning "Could not send Slack notification"

# Final Summary
echo ""
echo "========================================="
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo "========================================="
echo ""
echo "Application URLs:"
echo "  Web: https://scamdunk.com"
echo "  API: https://api.scamdunk.com"
echo ""
echo "Monitoring:"
echo "  PM2: pm2 status"
echo "  Logs: pm2 logs"
echo "  Metrics: pm2 monit"
echo ""
echo "Next Steps:"
echo "1. Verify all features are working correctly"
echo "2. Monitor application logs for errors"
echo "3. Check performance metrics"
echo "4. Configure alerts and notifications"
echo "5. Document any issues for rollback procedures"
echo ""
print_success "Deployment completed at $(date)"