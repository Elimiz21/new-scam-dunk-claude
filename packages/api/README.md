# Scam Dunk Backend API

TypeScript Express service powering the Scam Dunk detection workflows. The API connects to Supabase Postgres, enforces JWT authentication, applies per-user rate limiting/caching, and records telemetry for every detection request.

## 🚀 Key Features

- **Supabase-backed auth & persistence** with JWT session handling
- **Deterministic heuristics** for contact, chat, trading, and veracity assessments
- **Comprehensive scans** aggregate per-test results and recommendations
- **Per-user rate limiting** with hashed payload caching and telemetry logging
- **Operational telemetry** stored in `detection_telemetry` for live monitoring
- **Structured logging** with Pino (pretty-printed locally, JSON in production)
- **Prometheus metrics** exposed on `/metrics` (default + detection counters)
- **Automated testing** via Jest + Supertest and live Supabase integration checks

## 🪛 Environment Setup

Create two env files so both the API and Next.js can share credentials.

`packages/api/.env`
```bash
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
JWT_SECRET=<shared-secret>
PORT=3001
```

Root `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=<same-shared-secret>
```

> **Security note:** the service-role key is highly privileged—keep it server-side only.

Optional feature flags for external providers:

```bash
# Enable/disable external detection providers (default: false)
ENABLE_CONTACT_PROVIDER=false
ENABLE_TRADING_PROVIDER=false
ENABLE_CHAT_PROVIDER=false
ENABLE_VERACITY_PROVIDER=false

# Provider endpoints (only read when the corresponding flag above is true)
CONTACT_PROVIDER_URL=https://provider/contact
TRADING_PROVIDER_URL=https://provider/trading
CHAT_PROVIDER_URL=https://provider/chat
VERACITY_PROVIDER_URL=https://provider/veracity

# Optional timeout (ms) for provider calls
PROVIDER_TIMEOUT_MS=2500
```

## 🗄️ Database Bootstrap

Run the SQL in `packages/api/prisma/init.sql` once against the Supabase project (SQL editor or `psql`). It provisions:

- `users` — auth and profile data
- `scans` — comprehensive workflow storage
- `contact_verifications` — per-request history
- `detection_telemetry` — operational metrics for detections

## 🧪 Testing

```bash
# From the repo root
npm test                       # runs Jest via packages/api

# Direct invocation
npm --prefix packages/api test

# Live integration check against Supabase
node -r ts-node/register -r dotenv/config packages/api/scripts/live-check.ts
```

The live script spins up the Express app, registers/logs in a synthetic user, retrieves `/api/users/profile`, and exercises `/api/contact-verification` to validate caching, rate limiting, and telemetry persistence. Inspect the console output (and Supabase tables) for confirmation.

## 🧩 Detection Helpers (Overview)

| Service              | Heuristic Inputs                                           | Outputs                                                  |
|----------------------|------------------------------------------------------------|----------------------------------------------------------|
| Contact Verification | Email domain, phone prefix, hashed signal weighting        | `riskScore`, `riskLevel`, recommendations, flags         |
| Chat Analysis        | Platform + messages (keyword scan, tone heuristics)        | `overallRiskScore`, suspicious phrases, summary          |
| Trading Analysis     | Symbol patterns, watchlists, hashed weighting              | `overallRiskScore`, key findings, recommendations        |
| Veracity Checking    | Identifier heuristics (shell/offshore terms, etc.)         | `isVerified`, `overallConfidence`, follow-up suggestions |

Comprehensive scans orchestrate all four helpers and compute an overall risk grade from the individual scores.

## 🔭 Observability

- Metrics: scrape `GET /metrics` (Prometheus format) for counters (`scam_dunk_detection_requests_total`), histograms (`scam_dunk_detection_duration_ms`), and rate-limit totals.
- Logging: structured JSON via Pino (pretty printed locally). Adjust verbosity with `LOG_LEVEL`.
- Telemetry: each detection request is also written to the `detection_telemetry` table for historical analysis.

## 🔁 Development Scripts

```bash
npm --prefix packages/api run dev      # Start Express in watch mode
npm --prefix packages/api run build    # Compile TypeScript
npm run test:api                      # Convenience alias (root package.json)
```

## ✅ Verification Checklist (current work)

- `npm --prefix packages/api test`
- `node -r ts-node/register -r dotenv/config packages/api/scripts/live-check.ts`

Re-run these commands before continuing with Step 4 of the rebuild plan.
