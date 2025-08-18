# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables to your Vercel project at:
https://vercel.com/eli-mizrochs-projects/scam-dunk-production/settings/environment-variables

### Essential Variables (Add these immediately):

```
NEXT_PUBLIC_SUPABASE_URL=https://gcrkijxkecsfafjbojey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpanhrZWNzZmFmamJvamV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzOTE5MTUsImV4cCI6MjA0ODk2NzkxNX0.VsHcZtqR01JVsYMKZ5dvn2yB2zxUJFCvPqQQ7i5FQPA
```

### How to Add:
1. Go to https://vercel.com/eli-mizrochs-projects/scam-dunk-production/settings/environment-variables
2. Click "Add New"
3. Enter the variable name and value
4. Select "Production" environment
5. Click "Save"

### After Adding Variables:
1. Go to the Deployments tab
2. Find the latest deployment
3. Click the three dots menu
4. Select "Redeploy"

## Note:
The build warnings about vulnerabilities are just warnings and won't prevent deployment. The actual issue is the missing environment variables causing the Supabase initialization to fail during build.