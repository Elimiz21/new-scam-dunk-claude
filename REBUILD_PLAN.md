# Scam Dunk Rebuild Plan & Progress

## Program Objectives
- Reconnect the web app to real, secured backend services (auth, detection, billing).
- Harden security boundaries (proper auth, principled CORS, secret management, rate limiting).
- Deliver reliable detection workflows powered by external data providers with graceful degradation.
- Establish automated quality gates (linting, tests, CI/CD) and observability for ongoing maintenance.
- Maintain or improve the existing UX, ensuring accessibility and responsive behaviour.

## Phased Implementation Plan
1. **API Surface Alignment**
   - Restore/standardise REST endpoints consumed by the web client.
   - Normalize client-side service calls and response handling.
   - Remove deprecated or mock endpoints.
2. **Authentication & Authorization Overhaul**
   - Implement real login/register flows wired to the backend.
   - Centralise token storage, enforce auth guards in web and API layers.
   - Restrict service-role key usage and tighten CORS.
3. **Detection Pipeline Hardening**
   - Stabilise contact, chat, trading, and veracity detection services with error handling.
   - Introduce per-test telemetry, caching, and rate controls.
   - Reconcile result schemas for consistent risk scoring.
4. **Security & Infrastructure**
   - Secrets management (Vault/ENV), TLS everywhere, request throttling.
   - Monitoring/alerting hooks (Sentry, logs, metrics).
   - Isolated dev/staging/prod environments with automated deployments.
5. **Quality Assurance & UX Enhancements**
   - Automated unit/integration/E2E test suites.
   - Accessibility audits, loading/error state design, content polish.
   - Formal documentation, changelog, and runbooks.

## Progress to Date
- ✅ **Step 1: API Surface Alignment (client-side)**
  - Updated `packages/web/services/detection.service.ts` to target the live Next.js API routes instead of deprecated `/verify` endpoints.
  - Added consistent response extraction, error handling, and overall risk score calculation.
- ✅ **Step 2: Authentication & Authorization Overhaul (phase 1)**
  - Implemented secure Next.js API routes for login and registration using Supabase + bcrypt hashing (`app/api/auth/login`, `app/api/auth/register`).
  - Centralised auth handling in `lib/stores/auth-store.ts`, synchronising JWT storage with localStorage and updating all auth pages to use real backend flows.
  - Added JWT verification middleware (`lib/auth/server-auth.ts`) and enforced auth on scan-related API routes (contact, chat, trading, veracity, eligibility, subscriptions).
  - Guarded dashboard layouts to require an authenticated session before rendering private pages.
  - Remaining Step 2 work: secure the legacy Express API build, backfill `/users/profile` handler, and audit service-role key usage per route.

## Upcoming Priorities
1. Complete Step 2 by aligning the Express API build with the new JWT contract, adding the `/users/profile` handler, and replacing remaining service-role key fallbacks.
2. Harden operational tooling in Step 3: add telemetry, rate limiting, and caching around the detection pipelines.
3. Stand up automated quality gates (unit/integration smoke tests) ahead of the infrastructure/security work in Step 4.

## Notes for Next Session
- Backend TypeScript compilation currently blocked by large NestJS code paths; previous attempt rolled back—needs a scoped strategy when resuming Step 2.
- No automated tests were run in this session; plan to introduce targeted integration tests once auth endpoints are re-enabled.
- Ensure removal of deprecated mock login logic in `/app/(auth)/login/*` after real auth is live.
