#!/bin/bash

# Deploy Marketing Dashboard to Separate Vercel Project
# Usage: ./scripts/deploy-marketing.sh [production|preview]

set -e

ENV=${1:-preview}
PROJECT_NAME="scam-dunk-marketing"

echo "🚀 Deploying Marketing Dashboard..."
echo "Environment: $ENV"
echo "Project: $PROJECT_NAME"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if .env.marketing.example exists
if [ ! -f ".env.marketing.example" ]; then
    echo "❌ .env.marketing.example not found!"
    exit 1
fi

echo "📋 Environment Variables Required:"
echo "  - NEXT_PUBLIC_APP_MODE=marketing"
echo "  - NEXT_PUBLIC_MAIN_APP_URL"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - OPENAI_API_KEY"
echo ""
echo "⚠️  Make sure these are configured in Vercel project settings!"
echo ""

# Deploy based on environment
if [ "$ENV" = "production" ]; then
    echo "🔥 Deploying to PRODUCTION..."
    vercel --prod \
        --name "$PROJECT_NAME" \
        --yes \
        --env NEXT_PUBLIC_APP_MODE=marketing \
        --env NEXT_PUBLIC_MAIN_APP_URL=https://scam-dunk-production.vercel.app
else
    echo "🧪 Deploying to PREVIEW..."
    vercel \
        --name "$PROJECT_NAME" \
        --yes \
        --env NEXT_PUBLIC_APP_MODE=marketing \
        --env NEXT_PUBLIC_MAIN_APP_URL=https://scam-dunk-production.vercel.app
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Visit the deployment URL provided above"
echo "2. Test login and authentication"
echo "3. Verify all 6 dashboard tabs load"
echo "4. Test prompt optimization (requires OpenAI key)"
echo "5. Configure custom domain if desired"
echo ""
echo "Custom Domain Setup:"
echo "1. Go to Vercel project settings"
echo "2. Settings → Domains"
echo "3. Add: marketing.scamdunk.com (or your preferred subdomain)"
echo "4. Update DNS CNAME: marketing → cname.vercel-dns.com"
echo ""
