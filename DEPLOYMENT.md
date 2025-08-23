# Deployment Status

Last Updated: August 23, 2025

## Latest Changes (v2.0.0)

### Pricing Updates
- ✅ Free Trial: 1 free test per user
- ✅ Pay Per Scan: $4.99 per scan  
- ✅ Personal Plan: $9.99/month (1 user, unlimited)
- ✅ Family Plan: $19.99/month (up to 3 users)
- ✅ Teams Plan: $49.99/month (unlimited users)
- ✅ Enterprise: Custom pricing

### API Updates
- ✅ CoinMarketCap now primary crypto data source (replaced CoinGecko)
- ✅ Added 12 new free scammer detection APIs:
  - FBI IC3 Database
  - INTERPOL Notices
  - ScamAlert Singapore
  - Scamwatch Australia
  - Action Fraud UK
  - PhishTank
  - VirusTotal
  - Google Safe Browsing
  - And more...

### Backend Updates
- ✅ New subscription management system
- ✅ User scan eligibility tracking
- ✅ Payment processing structure
- ✅ Team member management

### Database Updates
- ✅ New pricing and subscription tables
- ✅ User scan usage tracking
- ✅ Payment transaction logging

## Deployment Instructions

1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys from GitHub
3. Monitor at: https://vercel.com/eli-mizrochs-projects/scam-dunk-production

## Production URLs
- Main App: https://scam-dunk-production.vercel.app
- API Endpoints: https://scam-dunk-production.vercel.app/api/*

## Environment Variables Required
Ensure these are set in Vercel Dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET
- COINMARKETCAP_API_KEY (new - required)