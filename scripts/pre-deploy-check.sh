#!/bin/bash
set -e

echo "🚀 Starting Pre-Deployment Checks..."
echo "===================================="

# 1. Check Web Package
echo "📦 Checking Web Package..."
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root/packages/web"
echo "   - Linting..."
npm run lint
echo "   - Building..."
npm run build
echo "✅ Web Package Ready!"

echo ""
echo "📋 Next Steps for YOU:"
echo "1. Run: vercel login (if not logged in)"
echo "2. Run: vercel deploy --prod"
echo "3. Go to Vercel Dashboard > Settings > Environment Variables"
echo "4. Add: EMAILREP_API_KEY and NUMVERIFY_API_KEY"

