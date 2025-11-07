# Production API Keys Setup Guide

**Last Updated**: November 7, 2025
**Platform**: Scam Dunk - Production Environment
**Deployment**: https://scam-dunk-production.vercel.app

---

## Overview

This guide provides a comprehensive checklist for obtaining and configuring production API keys for all Scam Dunk detection systems and platform services.

## Critical Priority API Keys

### 1. OpenAI API Key (HIGHEST PRIORITY)
**Service**: Chat Language Analysis + Marketing Prompt Optimization
**Used by**:
- `/api/detection/chat-analysis`
- `/api/marketing/optimise-prompt`

**Setup Steps**:
1. Visit https://platform.openai.com/api-keys
2. Create account or log in
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Name it: `scam-dunk-production`
6. Copy the key (starts with `sk-proj-...`)
7. Add to Vercel environment variables:
   - Variable name: `OPENAI_API_KEY`
   - Value: `sk-proj-...`
   - Scope: Production
8. Redeploy the application

**Estimated Cost**: ~$5-20/month for startup volume
**Model Used**: `gpt-4o-mini` (cost-effective)

**Important Note**: There's a bug in the code - line 53 of `packages/web/app/api/marketing/optimise-prompt/route.ts` uses `gpt-4.1-mini` which doesn't exist. Should be `gpt-4o-mini`.

---

### 2. CoinGecko API Key
**Service**: Cryptocurrency Data & Veracity Checking
**Used by**:
- `/api/detection/veracity-checking`
- `/api/detection/trading-analysis`

**Setup Steps**:
1. Visit https://www.coingecko.com/en/api/pricing
2. Sign up for "Analyst" plan ($129/month) or "Demo" (free, rate-limited)
3. Navigate to API dashboard
4. Copy your API key
5. Add to Vercel environment variables:
   - Variable name: `COINGECKO_API_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**: Free tier available (50 calls/min), Paid $129/month for higher limits

---

### 3. Alpha Vantage API Key
**Service**: Stock Market Data & Trading Analysis
**Used by**: `/api/detection/trading-analysis`

**Setup Steps**:
1. Visit https://www.alphavantage.co/support/#api-key
2. Fill out the form (name, email, organization)
3. Receive key via email
4. Add to Vercel environment variables:
   - Variable name: `ALPHA_VANTAGE_API_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**: FREE (500 requests/day, 5 requests/min)
**Note**: Free tier sufficient for MVP, premium available at $49.99/month

---

### 4. Truecaller API Key
**Service**: Phone Number Verification & Contact Verification
**Used by**: `/api/detection/contact-verification`

**Setup Steps**:
1. Visit https://developer.truecaller.com/
2. Sign up for business account
3. Complete verification process
4. Apply for API access (requires business justification)
5. Once approved, obtain API key
6. Add to Vercel environment variables:
   - Variable name: `TRUECALLER_API_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**: Contact sales (typically enterprise pricing)
**Alternative**: Hunter.io (below) or Numverify

---

### 5. Hunter.io API Key
**Service**: Email Verification & Domain Verification
**Used by**: `/api/detection/contact-verification`

**Setup Steps**:
1. Visit https://hunter.io/api-keys
2. Sign up for account
3. Navigate to API section
4. Copy your API key
5. Add to Vercel environment variables:
   - Variable name: `HUNTER_API_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**:
- Free: 25 searches/month
- Starter: $49/month (500 searches)
- Growth: $99/month (2,500 searches)

---

## Secondary Priority API Keys

### 6. NewsAPI Key
**Service**: Trading Activity Analysis - News Correlation
**Used by**: `/api/detection/trading-analysis`

**Setup Steps**:
1. Visit https://newsapi.org/register
2. Fill out registration form
3. Verify email
4. Copy API key from dashboard
5. Add to Vercel environment variables:
   - Variable name: `NEWSAPI_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**:
- Free: 100 requests/day (development only)
- Business: $449/month (production use required)

---

### 7. Numverify API Key
**Service**: Phone Number Validation (Alternative to Truecaller)
**Used by**: `/api/detection/contact-verification`

**Setup Steps**:
1. Visit https://numverify.com/product
2. Sign up for account
3. Select plan (Free or Paid)
4. Copy API key from dashboard
5. Add to Vercel environment variables:
   - Variable name: `NUMVERIFY_API_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**:
- Free: 100 requests/month
- Basic: $9.99/month (5,000 requests)

---

### 8. EmailRep API Key
**Service**: Email Reputation & Scammer Database Checking
**Used by**: `/api/detection/contact-verification`

**Setup Steps**:
1. Visit https://emailrep.io/
2. Sign up for API access
3. Select plan
4. Copy API key
5. Add to Vercel environment variables:
   - Variable name: `EMAILREP_API_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**:
- Free: 100 requests/day
- Pro: $99/month (unlimited)

---

## Blockchain & Crypto APIs

### 9. Etherscan API Key
**Service**: Ethereum Smart Contract Analysis & Wallet Verification
**Used by**: `/api/detection/veracity-checking`

**Setup Steps**:
1. Visit https://etherscan.io/myapikey
2. Create account and verify email
3. Click "Add" to create new API key
4. Name it: `scam-dunk-production`
5. Copy the key
6. Add to Vercel environment variables:
   - Variable name: `ETHERSCAN_API_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**: FREE (5 calls/second)
**Premium**: $199/month for higher rate limits

---

### 10. BSCScan API Key
**Service**: Binance Smart Chain Contract Analysis
**Used by**: `/api/detection/veracity-checking`

**Setup Steps**:
1. Visit https://bscscan.com/myapikey
2. Create account and verify email
3. Generate API key
4. Add to Vercel environment variables:
   - Variable name: `BSCSCAN_API_KEY`
   - Value: Your key
   - Scope: Production

**Estimated Cost**: FREE

---

## Existing Keys (Already Configured)

### Supabase (✅ Configured)
- `NEXT_PUBLIC_SUPABASE_URL`: https://gcrkijxkecsfafjbojey.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Configured in Vercel]
- `SUPABASE_SERVICE_ROLE_KEY`: [Configured in Vercel]

**Status**: Working (confirmed November 27, 2024)

---

## Vercel Environment Variables Setup

### How to Add Keys to Vercel:

1. Visit https://vercel.com/elimiz21s-projects/scam-dunk-production/settings/environment-variables
2. For each API key:
   - Click "Add New"
   - Enter variable name (e.g., `OPENAI_API_KEY`)
   - Enter value (the actual API key)
   - Select "Production" environment
   - Click "Save"
3. After adding all keys, redeploy:
   - Go to Deployments tab
   - Click on latest deployment
   - Click "Redeploy"

### Complete Environment Variables Checklist:

**Critical (Must Have)**:
- [ ] `OPENAI_API_KEY` - Chat analysis & marketing optimization
- [ ] `COINGECKO_API_KEY` - Crypto data
- [ ] `ALPHA_VANTAGE_API_KEY` - Stock data
- [ ] `HUNTER_API_KEY` - Email verification

**High Priority (Should Have)**:
- [ ] `TRUECALLER_API_KEY` or `NUMVERIFY_API_KEY` - Phone verification
- [ ] `ETHERSCAN_API_KEY` - Ethereum verification
- [ ] `BSCSCAN_API_KEY` - BSC verification

**Medium Priority (Nice to Have)**:
- [ ] `NEWSAPI_KEY` - News correlation
- [ ] `EMAILREP_API_KEY` - Email reputation

**Already Configured**:
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`

---

## Database Tables Required for Marketing Features

The marketing dashboard requires 3 additional Supabase tables:

### 1. marketing_agent_prompts
```sql
CREATE TABLE marketing_agent_prompts (
  agent_id text PRIMARY KEY,
  prompt text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
```

### 2. marketing_integrations
```sql
CREATE TABLE marketing_integrations (
  provider text PRIMARY KEY,
  status text NOT NULL,
  description text,
  actions text[],
  url text,
  last_synced timestamptz
);
```

### 3. marketing_integration_credentials
```sql
CREATE TABLE marketing_integration_credentials (
  provider text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
```

**To create these tables**:
1. Log into Supabase dashboard: https://supabase.com/dashboard/project/gcrkijxkecsfafjbojey
2. Navigate to SQL Editor
3. Run each CREATE TABLE statement above
4. Verify tables created in Table Editor

---

## Testing After Setup

### Test Detection APIs:
1. Visit https://scam-dunk-production.vercel.app/scan
2. Log in with test account
3. Run each of the 4 detection tests:
   - Contact Verification (needs Truecaller/Hunter.io)
   - Chat Analysis (needs OpenAI)
   - Trading Analysis (needs Alpha Vantage/CoinGecko/NewsAPI)
   - Veracity Checking (needs CoinGecko/Etherscan)
4. Verify results display without errors

### Test Marketing Dashboard:
1. Visit https://scam-dunk-production.vercel.app/marketing
2. Log in
3. Check that all sections load:
   - Metrics
   - Plan Overview
   - Execution Timeline
   - Workflow, Docs, Agents tabs
4. Test "Optimize Prompt" feature (needs OpenAI)

---

## Cost Estimation

### Minimal Setup (MVP):
- OpenAI: ~$5-20/month
- Alpha Vantage: FREE
- CoinGecko: FREE (rate-limited)
- Hunter.io: $49/month
- **Total**: ~$54-69/month

### Recommended Setup:
- OpenAI: ~$20-50/month
- Alpha Vantage: FREE
- CoinGecko: $129/month
- Hunter.io: $99/month
- Numverify: $9.99/month
- Etherscan: FREE
- BSCScan: FREE
- **Total**: ~$258-279/month

### Full Production Setup:
- OpenAI: ~$100+/month
- CoinGecko: $129/month
- Alpha Vantage: $49.99/month
- Truecaller: Enterprise pricing (contact sales)
- Hunter.io: $99/month
- NewsAPI: $449/month
- EmailRep: $99/month
- Etherscan: $199/month
- **Total**: ~$1,125+/month (excluding Truecaller)

---

## Priority Implementation Order

**Week 1** (Must have for basic functionality):
1. OpenAI API key - Chat analysis is core feature
2. Alpha Vantage - Free and essential for trading analysis
3. Hunter.io - Email verification for contact checking
4. CoinGecko free tier - Basic crypto data

**Week 2-3** (Enhance capabilities):
5. CoinGecko paid tier - Remove rate limits
6. Numverify - Add phone verification
7. Etherscan - Blockchain verification
8. BSCScan - Multi-chain support

**Month 2+** (Full production):
9. NewsAPI paid tier - News correlation
10. Truecaller - Premium phone verification
11. EmailRep - Enhanced email reputation
12. Upgrade tiers as usage grows

---

## Known Issues to Fix Before Production Launch

### 1. OpenAI Model Name Bug
**File**: `packages/web/app/api/marketing/optimise-prompt/route.ts:53`
**Issue**: Uses `gpt-4.1-mini` which doesn't exist
**Fix**: Change to `gpt-4o-mini` or `gpt-4-turbo-preview`

### 2. Hardcoded GitHub URLs
**File**: `packages/web/lib/marketing/get-state.ts:151`
**Issue**: Branch name hardcoded as `cursor/develop-comprehensive-app-marketing-strategy-60f6`
**Fix**: Use `main` or dynamically detect branch

### 3. Missing Database Tables
**Status**: Need to create 3 marketing tables (SQL provided above)

---

## Support & Resources

- Vercel Dashboard: https://vercel.com/elimiz21s-projects/scam-dunk-production
- Supabase Dashboard: https://supabase.com/dashboard/project/gcrkijxkecsfafjbojey
- GitHub Repo: https://github.com/Elimiz21/new-scam-dunk-claude
- Production URL: https://scam-dunk-production.vercel.app

---

**Next Steps**:
1. Review this guide
2. Obtain critical API keys (OpenAI, Alpha Vantage, Hunter.io)
3. Add to Vercel environment variables
4. Create missing database tables
5. Test all detection systems
6. Monitor costs and usage
7. Scale up tiers as needed
