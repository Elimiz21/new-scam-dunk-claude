## Scam Dunk Operations Runbook

### Environment Prep
- Copy `.env.local` (web) and `packages/api/.env` (API) from the secrets vault; verify Supabase URL + service role key.
- Run `npm install` at the repo root; install service packages as needed (`npm --prefix packages/api install`, `npm --prefix packages/web install`).
- Launch Postgres/Redis if testing against local services (`./start.sh` or `docker-compose-dev.yml`).

### Daily Quality Gate
- `npm run lint`
- `npm run test` (Jest API suite + Playwright smoke/auth/dashboard flows)
- `npm --prefix packages/web run build`
- Capture `packages/api/logs/latest.log` and Prometheus `/metrics` output when investigating backend telemetry anomalies.

### Manual Smoke Test (optional but recommended before releases)
1. `npm --prefix packages/web run dev` and `npm --prefix packages/api run dev` in separate terminals.
2. Login via `http://localhost:3000/login` using a known Supabase user; confirm dashboard widgets render and telemetry entries stream to Supabase.
3. Run each scan type with sample payloads; validate responses, rate-limit headers, and Supabase `detection_telemetry` entries.
4. Check `packages/web/playwright-report/index.html` if Playwright tests fail locally or in CI.

### Pre-Deployment Checklist
- Sync feature flags (`config.featureFlags`) with the intended provider rollout for the release window.
- Confirm all external provider credentials (EmailRep/HIBP/OpenAI/etc.) exist in Supabase secrets and Vercel environment settings.
- Run the daily quality gate commands; archive build + test logs in the release ticket.
- Update `REBUILD_PLAN.md` progress once verifications pass and highlight any newly opened risks.

### Rollback
- Re-deploy prior Vercel build from dashboard.
- Restore previous Supabase `detection_telemetry` snapshot if schema changes shipped.
- Revert feature flags to disable external providers while keeping auth live.
- If auth failures surface, invalidate the service-role key, re-issue a new one in Supabase, and redeploy with updated environment variables.
