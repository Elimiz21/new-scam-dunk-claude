# Gemini Knowledge Base & Status Report

## Project Overview
**App Name:** Scam Dunk
**Purpose:** A comprehensive scam detection platform helping users verify contacts, analyze trading activity, check for data breaches, and analyze chat conversations for potential fraud.

## Architecture
### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom "Holographic" Theme
- **State Management:** Zustand (`auth-store`, etc.)
- **Authentication:** Custom JWT implementation (localStorage) + Supabase (Database)
- **Deployment:** Vercel

### Backend / Services
- **Next.js API Routes:** Handle business logic, external API calls, and auth verification.
- **Python AI Service:** FastAPI-based service for advanced text analysis (BERT, pattern matching).
- **Database:** Supabase (PostgreSQL)

### Key Features & Implementation
1.  **Trading Analysis:**
    - Input: Ticker symbol (Stock/Crypto).
    - Logic: Fetches data from AlphaVantage/CoinMarketCap via Next.js API.
    - Status: **OPERATIONAL**. API keys now loaded from database fallback.
2.  **Veracity Check:**
    - Input: Stock/Crypto Ticker (repurposed from HIBP).
    - Logic: Reuses Trading Provider logic to verify asset existence.
    - Status: **OPERATIONAL**. Fixed logic to correctly map "stock" type to external provider check.
3.  **Chat Analysis:**
    - Input: Chat text.
    - Logic: Streams data to Python AI service.
    - Status: **OPERATIONAL (Fallback Mode)**. 
    - **Update:** If `AI_SERVICE_URL` is unreachable (service not deployed), the backend now falls back to a heuristic local analysis instead of returning an error.
4.  **Contact Verification:**
    - Input: Phone/Email.
    - Logic: Checks NumVerify/EmailRep.
    - Status: **OPERATIONAL**.
    - **Update:** Missing `EMAILREP_API_KEY` is now logged as a warning and skips the check gracefully without failing the request. `NUMVERIFY_API_KEY` has been added by user.

## Current Status Report
**Date:** November 26, 2025
**Time:** 16:35

### Recent Achievements
- **Diagnostic Run:** Performed a live browser simulation on `scam-dunk-production.vercel.app`.
- **Finding:** The "Comprehensive Scan" currently returns **Error** for all 4 tests. This confirms the live site is running the *old* code which swallows errors and lacks the fallback logic I implemented.
- **Preparation:** Codebase is fully patched and ready for deployment. Created `test-production-suite.sh` for post-deploy verification.

### Active Issues
- **Production Out of Sync:** The live production site does not yet have the fixes for robust error handling and API fallbacks.

### Next Steps (User Action Required)
1.  **Deploy to Production:**
    - Run `vercel deploy --prod` in your terminal.
    - This will push the new robust error handling and fallback logic.
2.  **Verify:**
    - Run `./test-production-suite.sh`
    - Visit `https://scam-dunk-production.vercel.app`
    - Run a "Comprehensive Scan".
    - Expect **Chat Analysis** to pass (using fallback if AI service is down).
    - Expect **Contact Verification** to pass (using Numverify).
