#!/bin/bash

# Verification Script for Scam Dunk Production

echo "🔍 Verifying Scam Dunk Production Endpoints..."
echo "=============================================="

BASE_URL="https://scam-dunk-production.vercel.app"

# 1. Check Health
echo "1. Checking Health Endpoint..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}\n" "$BASE_URL/api/health")
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Health Check Passed (200 OK)"
else
    echo "❌ Health Check Failed (Status: $HTTP_CODE)"
fi

# 2. Check Trading Analysis (Public Check)
# Note: This usually requires Auth, so we expect 401, but 404 would mean route missing
echo "2. Checking Trading Analysis Route..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}\n" -X POST "$BASE_URL/api/trading-analysis")
if [ "$HTTP_CODE" == "401" ]; then
    echo "✅ Route Exists (401 Unauthorized - Expected)"
elif [ "$HTTP_CODE" == "404" ]; then
    echo "❌ Route Missing (404 Not Found)"
else
    echo "⚠️  Unexpected Status: $HTTP_CODE"
fi

echo "=============================================="
echo "Next Steps:"
echo "1. Run 'vercel deploy --prod' to apply latest error handling fixes."
echo "2. Check Vercel Logs for 'AI_SERVICE_URL' connection errors."
echo "3. Verify API Keys in Vercel Dashboard."

