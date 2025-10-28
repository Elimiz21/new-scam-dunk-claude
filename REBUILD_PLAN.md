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
- ✅ **Step 2: Authentication & Authorization Overhaul**
  - Implemented secure Next.js API routes for login and registration using Supabase + bcrypt hashing (`app/api/auth/login`, `app/api/auth/register`).
  - Centralised auth handling in `lib/stores/auth-store.ts`, synchronising JWT storage with localStorage and updating all auth pages to use real backend flows.
  - Added JWT verification middleware (`lib/auth/server-auth.ts`) and enforced auth on scan-related API routes (contact, chat, trading, veracity, eligibility, subscriptions).
  - Guarded dashboard layouts to require an authenticated session before rendering private pages.
- ✅ Legacy Express build aligned to the new JWT contract, `/api/users/profile` implemented, and all Supabase service-role usage audited.
- ✅ **Step 2: Legacy Express alignment (current session)**
  - Enforced JWT contract across `packages/api/src/simple-index.ts`, introduced sanitized user payloads, and wired `/api/users/profile` GET/PATCH handlers.
  - Removed Supabase anon/service-role fallbacks in the web admin layer; `getSupabaseClient` now requires real service credentials.
- ✅ **Step 3: Detection Pipeline Hardening**
  - Added per-user rate limiting, SHA-256 keyed caching, and Supabase-backed telemetry persistence across contact/chat/trading/veracity/comprehensive endpoints.
  - Replaced randomised outputs with deterministic heuristics (risk scoring, summaries, recommendations) and updated comprehensive scans to aggregate per-test results.
  - Automated coverage now exercises auth, detection caching, rate limits, and trading-analysis determinism (Jest + live Supabase integration checks).
- ✅ **Step 4: Security & Infrastructure**
  - Introduced structured logging (Pino), Prometheus metrics (`/metrics`), and Supabase-backed telemetry for comprehensive observability.
  - Centralised config validation for critical secrets and added CI automation (lint + tests via GitHub Actions).
- 🚧 **Step 5: Quality Assurance & UX Enhancements (phase 1)**
  - Added feature-flagged external provider hooks for contact/chat/trading/veracity analyses with graceful fallbacks and telemetry metadata.
  - Implemented OpenAI GPT-based chat analysis fallback and Have I Been Pwned breach lookups when direct provider URLs are unset.
  - Expanded automated API coverage to exercise external provider integrations (contact, trading, chat, veracity) and Supabase API key retrieval.
  - Rewired the Next.js detection service to the Express API and refreshed scan UIs (contact/chat/trading/veracity) to surface real provider findings and recommendations.
  - Fixed auth/trading/veracity pages to consume store loading state, import all Lucide icons, and tightened type guards so `npm --prefix packages/web run build` passes locally before deployment.
  - Introduced Playwright-based smoke tests for landing/login/register flows with automated dev-server orchestration to guard critical entry points.
  - Added authenticated Playwright flows for login, registration, and dashboard widgets so the primary user journey is covered end-to-end without external dependencies.
  - Retired the legacy holographic login variant to avoid mock-auth regressions and keep the entry experience consistent with production.
  - Authored `OPERATIONS_RUNBOOK.md` to document daily quality gates, deployment checks, and rollback procedures.
  - Extended root lint/test commands to cover the Next.js web package, establishing `next lint` as part of the shared CI gate.

## Upcoming Priorities
1. Extend provider network (e.g., domain reputation, business registry checks) and surface results consistently in the web dashboard UI.
2. Restore EmailRep/HIBP integrations when keys become available and re-run the full build/test pipeline.
3. Validate telemetry + auth flows against a real Supabase instance and capture findings in `OPERATIONS_RUNBOOK.md`.

## Verification Checklist (latest session)
- `npm run test`
- `npm --prefix packages/web run build`

## Notes for Next Session
- Verify the Express build against real Supabase data (login, `/api/users/profile`, detection routes) and capture telemetry output for baseline metrics.
- Backend TypeScript compilation currently blocked by large NestJS code paths; previous attempt rolled back—needs a scoped strategy when resuming Step 2.
- Wire the new Playwright suite into CI before tackling Step 4 infra tasks.
- Gather production-grade Supabase credentials (URL + service-role key) to unblock live auth/telemetry verification steps.
