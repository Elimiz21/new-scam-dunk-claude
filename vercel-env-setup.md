# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables to your Vercel project at:
https://vercel.com/dashboard (choose the `scam-dunk-production` project)

### Essential Variables (Add these immediately):

```
NEXT_PUBLIC_SUPABASE_URL=https://gcrkijxkecsfafjbojey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy the current anon key from Supabase Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<copy the current service-role key from Supabase Settings → API>
DATABASE_URL=<pooled connection string from Supabase Settings → Database>
DIRECT_URL=<direct connection string from Supabase Settings → Database>
JWT_SECRET=<generate via `openssl rand -base64 32` and store here>
OPENAI_API_KEY=<provider key>
```

### How to Add:
1. Go to https://vercel.com/eli-mizrochs-projects/scam-dunk-production/settings/environment-variables
2. Click "Add New"
3. Enter the variable name and value from the secure secret vault
4. Select the environments that need it (`Production` and `Preview`)
5. Click "Save"

**CLI alternative (preferred for rotations):**
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
```
(Repeat for each key, pasting the fresh value when prompted.)

**Automated sync (reads from `.secure/scam-dunk-phase-secrets.env`):**
```bash
node scripts/sync-vercel-env.mjs
```

### After Adding Variables:
1. Go to the Deployments tab
2. Find the latest deployment
3. Click the three dots menu
4. Select "Redeploy"

## Note:
The build warnings about vulnerabilities are just warnings and won't prevent deployment. The actual issue is the missing environment variables causing the Supabase initialization to fail during build.
