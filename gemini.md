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
    - Status: API Auth fixed (JWT), but requires external API keys in Vercel.
2.  **Veracity Check:**
    - Input: Email/Identifier.
    - Logic: Checks "Have I Been Pwned" API.
    - Status: API Auth fixed (JWT), requires HIBP API key.
3.  **Chat Analysis:**
    - Input: Chat text.
    - Logic: Streams data to Python AI service.
    - Status: API Auth fixed (JWT).
4.  **Contact Verification:**
    - Input: Phone/Email.
    - Logic: Checks NumVerify/EmailRep.

## Current Status Report
**Date:** November 26, 2025
**Time:** 14:45

### Recent Achievements
- **Auth Fix:** Resolved `401 Unauthorized` errors on API routes by switching from Supabase Cookie auth to Custom JWT verification (Bearer header).
- **UI Fixes:** Resolved invisible text issues in Login/Register forms.
- **Cleanup:** Removed diagnostic probes from production code.
- **Polish:** Added missing favicons and re-enabled Content Security Policy (CSP).

### Active Issues
1.  **Hanging Requests (BLOCKED):** Trading and Veracity analysis features hang indefinitely.
    - **Root Cause:** Missing environment variables in Vercel (`ALPHA_VANTAGE_API_KEY`, `COINMARKETCAP_API_KEY`, `HIBP_API_KEY`).
    - **Status:** Waiting for user to configure keys.

### Next Steps
1.  **Verify Environment:** Once keys are added, run full E2E tests.
2.  **Full E2E Verification:** Ensure all features work end-to-end.
