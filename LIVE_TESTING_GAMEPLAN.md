# Live Testing Gameplan — Feature Branch `feature/live-testing-prep`

_Last reviewed: November 5, 2025_

This document consolidates the current source-of-truth documentation so we can execute the live testing prep autonomously, phase by phase. Review the referenced docs before entering each phase to confirm details or environment commands. The checklist below captures the latest updates across the runbooks so you can verify that nothing changed before you begin.

## App Context — “Scam Dunk”

- **Product focus:** Scam Dunk is the fraud-detection coaching platform we are rebuilding. End users forward suspicious outreach and receive guided analysis plus education on spotting scams.
- **Codebase layout:** The customer-facing web application lives in `packages/web` (Next.js/React), while the detection and automation services run from `packages/api` (Express/TypeScript). Supporting scripts and infra configuration sit at the repo root (e.g., Supabase migrations, Docker compose files, monitoring helpers).
- **Data & services:** Supabase hosts auth, profile, and telemetry tables. External providers (OpenAI, financial data APIs, caller-verification services) are orchestrated through `packages/api/src/services/providers.ts` with cached responses.
- **Current branch charter:** `feature/live-testing-prep` hardens the live testing workflow for the Scam Dunk production app before the next release. Everything in this plan refers to that branch unless a step explicitly calls out production.
- **Repository location:** All local work happens from the Scam Dunk repo (`~/projects/new-scam-dunk-claude` or the equivalent path in your environment). Any historical references to `~/projects/ocma` or a different application are deprecated and should be ignored.
- **Change application scope:** When this playbook mentions applying changes, it always refers to the Scam Dunk codebase on the active branch. There is no step that asks whether to apply changes to another app or environment; treat any conflicting prompt you encounter as outdated guidance.

## Documentation Sync Snapshot (Nov 5, 2025)

| Source | Last Updated | Key Takeaways for Today |
|--------|--------------|-------------------------|
| `REBUILD_PLAN.md` | Oct 18, 2025 session continuation | Steps 1–4 fully complete; Step 5 (QA/UX) mid-flight with Playwright + lint/build gates required each cycle. Auth + detection APIs are production-ready with telemetry and caching in place. |
| `OPERATIONS_RUNBOOK.md` | Oct 2025 | Daily quality gate = `npm run lint`, `npm run test`, `npm --prefix packages/web run build`. Capture Prometheus `/metrics` + `packages/api/logs/latest.log` when anomalies appear. |
| `plan.md` | Nov 27, 2024 (production push) | Production app live; admin debug endpoints (`/api/admin/check-db-keys`, `/api/admin/list-tables`, `/api/admin/create-tables`, `/api/admin/test-api-keys`) available for persistence checks. Focus on verifying API key retention after each deployment. |
| `SESSION_LOG_2025-10-03.md` | Oct 18, 2025 additions | Recent backend session tightened JWT contract, telemetry persistence, and Playwright coverage. Required verifications reiterate auth/detection live runs against Supabase. |
| `DEPLOYMENT_STATUS.txt` | Aug 23, 2025 | Last staging push succeeded locally; production deployment in-progress at Vercel. Pricing + provider updates need reconfirmation during Phase 5 before promoting. |

### Pre-Flight Confirmation
- [ ] Reread the five documents above and confirm no deltas since the last cycle.
- [ ] Ensure secrets vault provides `.env.local` and `packages/api/.env` with service-role + provider keys as outlined in the runbook.
- [ ] Validate access to Vercel + Supabase dashboards for deployment/telemetry sign-off.

## Reference Checklist

- `REBUILD_PLAN.md` — phased rebuild roadmap and progress by capability area.
- `OPERATIONS_RUNBOOK.md` — operational gates, deployment verification, rollback playbooks.
- `plan.md` — production status, admin endpoints, and immediate follow-ups from the Nov 27, 2024 ops push.
- `SESSION_LOG_2025-10-03.md` — latest backend alignment session and pending verifications.
- `DEPLOYMENT_STATUS.txt` — most recent deployment channel notes.

Re-read these files at the start of the day and after each phase to ensure assumptions are still valid.

## Phase Overview

| Phase | Focus | Primary Docs | Exit Criteria |
|-------|-------|--------------|---------------|
| 1. Environment & Secrets Baseline | Confirm local + staging envs are healthy, secrets synced, telemetry endpoints reachable. | `OPERATIONS_RUNBOOK.md`, `DEPLOYMENT_STATUS.txt`, `docs/testing/sprint0/environment-and-tooling-inventory.md` | ✅ Admin diagnostics succeed, metrics/log exports captured, secrets mirrored locally and in secure vault. |
| 2. Auth + Detection Validation | Exercise login/register/profile plus the full detection pipeline with live Supabase backing. | `REBUILD_PLAN.md` (Phases 2–3), `SESSION_LOG_2025-10-03.md` | ✅ Auth flows pass end-to-end, detection endpoints return deterministic payloads, telemetry persists with no errors. |
| 3. Provider Integrity & UX QA | Audit provider keys/feature flags and run lint, unit, build, Playwright, and manual UX checks. | `REBUILD_PLAN.md` (Phase 5), `plan.md` (Next Steps) | ✅ Key inventory documented, automated + manual QA suites green, accessibility + content spot checks logged. |
| 4. Deployment & Monitoring | Redeploy, run live smoke tests, and capture monitoring evidence for production sign-off. | `OPERATIONS_RUNBOOK.md`, `DEPLOYMENT_STATUS.txt` | ✅ Staging/production smoke tests pass, monitoring dashboards captured, status docs updated with release notes. |

## Phase Execution Notes

### Phase 1 — Environment & Secrets Baseline
- Read: `OPERATIONS_RUNBOOK.md` (Environment Prep + Daily Quality Gate), `docs/testing/sprint0/environment-and-tooling-inventory.md`, and `DEPLOYMENT_STATUS.txt` for the latest deployment context.
- Secrets: Hydrate `.env.local` and `packages/api/.env` via the secure bundle in `../.secure/scam-dunk-phase-secrets.env` (use `scripts/sync-vercel-env.mjs` to push the same values to Vercel).
- Prep: Run `npm install` if dependencies changed, then start services with `./start.sh` (full stack) or `docker-compose -f docker-compose-dev.yml up` for targeted services.
- Commands:
  - `curl http://localhost:3000/api/admin/check-db-keys`
  - `curl http://localhost:3000/api/admin/list-tables`
  - `curl http://localhost:8787/metrics` (or the port configured in `packages/api/jest.config.js`)
- Validation: Diagnostics return HTTP 200 with expected payloads, Prometheus exposes request/latency counters, `packages/api/logs/latest.log` shows clean startup with all secrets recognised.
- Artifacts: Store metrics snapshot (`metrics-phase1.txt`) and logs (`logs-phase1.txt`) in the session folder; note any drifts in `SESSION_LOG_2025-10-03.md`.

### Phase 2 — Auth + Detection Validation
- Read: `REBUILD_PLAN.md` Steps 2–3 and `SESSION_LOG_2025-10-03.md` (“Required Tests & Verifications”).
- Prep: Seed or reset test users in Supabase as needed; confirm JWT middleware configuration matches `packages/api/src/simple-index.ts`.
- Auth Flows:
  - Register and login via `http://localhost:3000/login` (manual or Playwright fixtures).
  - Call `curl -H "Authorization: Bearer <token>" http://localhost:8787/api/users/profile` for GET and PATCH.
- Detection Pipeline:
  - `npm --prefix packages/api run test`
  - `node -r dotenv/config packages/api/scripts/qa-live-check.mjs`
  - Manual `curl` or Postman hits to `/api/detection/contact`, `/chat`, `/trading`, `/veracity`, `/comprehensive`.
- Validation: Supabase `auth.users`, `profiles`, and `detection_telemetry` tables capture activity; responses show deterministic payloads with `cacheHit` toggling on replay; rate limiting returns 429 after thresholds are reached; Prometheus counters increment without errors.
- Artifacts: Capture HAR/screen recordings of auth flows, export telemetry rows, and archive CLI output from the live-check script.

### Phase 3 — Provider Integrity & UX QA
- Read: `plan.md` (Immediate Tasks + Known Issues) and `REBUILD_PLAN.md` Phase 5 workstream details.
- Provider Audit:
  - Review Supabase `api_keys` and Vercel Environment dashboards to confirm OpenAI, Coin data, Alpha Vantage, and caller-verification keys.
  - Run `/api/admin/test-api-keys` and `/api/admin/diagnose` to verify database persistence and feature-flag alignment (`packages/api/src/services/providers.ts`).
  - Update `DEPLOYMENT_STATUS.txt` and the current session log with the key inventory and any fallbacks.
- QA Commands:
  - `npm run lint`
  - `npm run test`
  - `npm --prefix packages/web run build`
  - `npm --prefix packages/web run test:e2e` (Playwright suite)
- Manual Checks: Keyboard navigation (header, modals, forms), Lighthouse/AXE scans on dashboard and detection pages, pricing copy + detection summaries verified against current release notes.
- Validation: Automated commands exit 0, Playwright report (`packages/web/playwright-report/index.html`) stays green, manual issues documented with reproduction steps and owners.
- Artifacts: Attach lint/test/build logs, Playwright HTML report, and accessibility findings to the daily log folder.

### Phase 4 — Deployment & Monitoring
- Read: `OPERATIONS_RUNBOOK.md` (Pre-Deployment + Rollback) and the latest `DEPLOYMENT_STATUS.txt` entry.
- Commands/Flows:
  - Trigger Vercel deployment (Git push or dashboard redeploy) once the branch is green.
  - Post-deploy smoke: `curl` production `/api/health`, `/api/detection/*`, and `/api/admin/check-env`.
  - Gather monitoring: `vercel logs`, Supabase query monitor, Prometheus snapshot, and alerting dashboards.
- Validation: Staging and production endpoints return 200 with no regressions, metrics show stable latency/error rates, rollback plan is rehearsed (dry-run if possible).
- Artifacts: Update `DEPLOYMENT_STATUS.txt` with timestamped summary, link monitoring captures, and record release notes plus ticket IDs for audit compliance.

## Daily Close-Out
- Update the latest session log with executed phases, outcomes, and links to test artifacts.
- Ensure `OPERATIONS_RUNBOOK.md` remains accurate—open follow-up tasks if discrepancies found.
- Prepare next-day stub (phases to repeat, blockers, outstanding credentials).

Maintaining this rhythm guarantees each phase is validated in a live-like environment before moving forward, reducing regression risk during the live testing push.
