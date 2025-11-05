# Scam Dunk Sprint 3 – Cloud & Remote Continuation Guide

_Updated 2025-11-04_

This guide explains how to resume the Sprint 3 remediation program from any machine (local or cloud). Follow each section in order to reproduce the Phase 0 baseline, run validation scripts, and prepare for Phases 1–3.

---

## 1. Clone the Repositories
```
git clone git@github.com:<org>/prompt-library.git
cd prompt-library
git submodule update --init --recursive   # if new-scam-dunk-claude is tracked as a submodule
```
If the `new-scam-dunk-claude` repository is independent, clone it separately alongside the prompt library.

---

## 2. Install Prerequisites
- **Node.js:** v20.x (LTS). Local macOS machines currently ship with Node 18; install Node 20 via nvm or volta.  
  ```
  nvm install 20
  nvm use 20
  ```
- **npm:** v10 or later (bundled with Node 20).  
- **PostgreSQL tooling:** `libpq` for `psql`/`pg_dump`.  
  macOS: `brew install libpq && echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc`.
- **Supabase CLI (optional but recommended):** `brew install supabase/tap/supabase`.
- **k6 (Phase 1+):** `brew install k6` or download from https://k6.io/open-source/.

---

## 3. Restore the Secure Secrets File
1. Create the secure directory if it does not exist:
   ```
   mkdir -p .secure && chmod 700 .secure
   ```
2. Copy the latest `scam-dunk-phase-secrets.env` file into `.secure/`. This file contains:
   ```
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   SUPABASE_ANON_KEY=
   SUPABASE_DB_CONNECTION=
   SUPABASE_JWT_SECRET=
   VERCEL_TOKEN=
   VERCEL_PROJECT_ID=
   CI_ACCESS_TOKEN=
   OPENAI_API_KEY=
   ```
   Optional entries: `VERCEL_TEAM_ID`, `PROMETHEUS_CREDENTIAL`, `ALERT_WEBHOOK_URL`, `K6_API_TOKEN`.
3. Lock file permissions: `chmod 600 .secure/scam-dunk-phase-secrets.env`.

If you are missing any value, fetch it from the source service (Supabase, Vercel, GitHub, OpenAI, monitoring provider).

---

## 4. Seed Environment Variables
To use the secrets in shell sessions:
```
eval "$(python3 - <<'PY'
from pathlib import Path
import shlex
text = Path('.secure/scam-dunk-phase-secrets.env').read_text()
for line in text.splitlines():
    line = line.strip()
    if not line or line.startswith('#') or '<replace' in line:
        continue
    if '=' not in line:
        continue
    key, value = line.split('=', 1)
    print(f"export {key}={shlex.quote(value)}")
PY)"
```
Run this snippet in every new terminal (or add it to your shell profile with care).

---

## 5. Install Dependencies
From the prompt-library root:
```
npm install
cd new-scam-dunk-claude
npm install
npm --prefix packages/api install
npm --prefix packages/web install
```
This ensures both the monorepo tooling and individual packages have their lockfiles respected.

---

## 6. Sync Vercel Environment Variables
Ensure the tokens in the secrets file are current, then run:
```
cd new-scam-dunk-claude
node scripts/sync-vercel-env.mjs
```
The script upserts all required environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, etc.) to both production and preview environments. The script emits masked summaries for audit trails.

---

## 7. Purge Legacy Perf Artefacts
Before running integration or load tests, clean the Supabase database of stale `perf-*` users:
```
cd new-scam-dunk-claude
npm run cleanup:perf
```
This deletes test accounts, associated scans, and any `perf-*` api keys.

---

## 8. Run Phase 0 Validations
1. **API Unit Harness**
   ```
   npm --prefix packages/api test
   ```
2. **Web Lint (Warnings expected for hook dependencies; document any deviations)**
   ```
   npm --prefix packages/web run lint
   ```
3. **QA Live Check (API + Supabase)**
   ```
   export API_BASE_URL=http://localhost:3011
   PORT=3011 SUPABASE_URL=$SUPABASE_URL SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
     JWT_SECRET=$SUPABASE_JWT_SECRET node packages/api/dist/simple-index.js &
   SERVER_PID=$!
   sleep 3
   SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
     npm --prefix packages/api run qa:live-check
   kill $SERVER_PID
   ```
   Record the console output in `docs/testing/sprint3/raw-data/qa-live-check-<date>.txt`.
4. **Schema Snapshot (optional but recommended for auditors)**
   ```
   export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
   pg_dump --schema-only --no-owner --dbname="$SUPABASE_DB_CONNECTION" \
     > docs/testing/sprint0/schema-$(date +%Y%m%d).sql
   ```

---

## 9. Document Evidence
- Append test logs, lint output, and QA summaries under `docs/testing/sprint3/raw-data/`.
- Update `docs/testing/sprint3/executive-summary.md` and `technical-analysis-report.md` with new findings or status shifts.
- Capture Vercel/Supabase rotation screenshots in your compliance archive; note the timestamp in `docs/testing/sprint0/environment-and-tooling-inventory.md`.

---

## 10. Preparing for Phase 1 Onward
With Phase 0 validated:
1. Branch from `main` (e.g., `phase1/auth-hardening`).  
2. Work through the prompts in `docs/testing/sprint3/developer-prompt-playbook.md` for each squad.  
3. For each change:
   - Implement code updates.
   - Update runbooks (`OPERATIONS_RUNBOOK.md`, `remediation-plan.md`).
   - Add or update tests (Playwright, unit, integration).
   - Run:
     ```
     npm --prefix packages/api test
     npm --prefix packages/web run lint
     npm --prefix packages/web run test:e2e   # once Playwright is reconfigured
     npm run cleanup:perf                     # before load tests
     ```
   - Commit using the designated prefix (`phase1/<scope>: <summary>`).
4. Use `scripts/sync-vercel-env.mjs` after any secret rotation or new environment variable introduction.
5. Before merge/deploy, rerun the QA live check and append fresh evidence.

---

## 11. Cloud Execution Tips
- **VS Code Codespaces / GitHub Codespaces:**  
  - Create secrets under repository settings (`SUPABASE_*`, `VERCEL_TOKEN`, `OPENAI_API_KEY`).  
  - Add a dotfiles checkout that injects the `eval` snippet automatically.  
  - Ensure Codespaces has permissive firewall rules to reach Supabase.

- **CI Pipelines:**  
  - Store secrets as encrypted variables.  
  - For GitHub Actions, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and related values on the repository or, ideally, the environment (`production`, `preview`).  
  - Use the `cleanup:perf` script as a pre-step before integration or load tests.

- **Containerized Runners:**  
  - Mount `.secure/scam-dunk-phase-secrets.env` as a secret volume.  
  - Run `node scripts/sync-vercel-env.mjs` only when `VERCEL_TOKEN` is present.

---

## 12. Contact & Ownership Matrix
Refer to `docs/testing/sprint0/environment-and-tooling-inventory.md` for the latest owner list. Before initiating any testing from a new environment, ping the DevOps owner to confirm the Supabase project is in an operable state and that no conflicting rotations are in progress.

---

By following this guide, any authorized engineer can bootstrap the remediation environment, run the necessary validation steps, and proceed with the remaining phases without waiting for the original workstation. Update this guide whenever new tooling or credentials are introduced.
