# Fix API Keys Storage Issue

## Problem Identified
The Supabase API key stored in Vercel's environment variables is invalid, preventing database connections.

## Solution Steps

### 1. Fix Supabase Environment Variables in Vercel

Go to your Vercel dashboard: https://vercel.com/dashboard

1. Select the `scam-dunk-production` project
2. Go to Settings → Environment Variables
3. Update these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://gcrkijhkecsfafjbojey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpamhrZWNzZmFmamJvamV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzOTE5MTUsImV4cCI6MjA0ODk2NzkxNX0.VsHcZtqR01JVsYMKZ5dvn2yB2zxUJFCvPqQQ7i5FQPA
```

**IMPORTANT**: Make sure there are NO line breaks or extra spaces in the API key!

### 2. Get Service Role Key (Optional but Recommended)

If you have access to your Supabase dashboard:
1. Go to https://app.supabase.com/
2. Select your project
3. Go to Settings → API
4. Copy the `service_role` key (NOT the anon key)
5. Add it to Vercel:
```
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### 3. Redeploy After Fixing Variables

After updating the environment variables:
1. Go to the Deployments tab in Vercel
2. Click on the three dots next to the latest deployment
3. Click "Redeploy"
4. Choose "Use existing Build Cache"

### 4. Test the Fix

Once redeployed, your API keys should:
- Be saved when you enter them in the admin panel
- Persist across login sessions
- Show as "Configured" with green badges

## What Was Fixed in Code

1. **Supabase Key Parsing**: Added code to strip whitespace/newlines from API keys
2. **Shared Utility**: Created `/lib/supabase-admin.ts` for consistent Supabase client creation
3. **Visual Indicators**: Improved UI to clearly show when keys are configured
4. **Error Handling**: Added proper error handling for database connections

## Manual API Key Entry (If Database Connection Still Fails)

If the database connection still doesn't work, you can manually add API keys to your code:

1. Create a file `/workspace/packages/web/.env.production.local`
2. Add your API keys directly:
```
OPENAI_API_KEY=sk-...
COINMARKETCAP_API_KEY=...
ALPHA_VANTAGE_API_KEY=...
ETHERSCAN_API_KEY=...
```

3. These will be used as fallbacks if the database isn't available.

## Verification

After fixing, you should see:
- Green "Configured" badges next to saved API keys
- "Key saved: ••••••xxxx" in placeholders
- "This API key is currently active in the database" message
- Keys persist when you log out and back in

## Need Help?

If issues persist:
1. Check Vercel build logs for errors
2. Verify Supabase project is active (not paused)
3. Ensure API keys don't have special characters that need escaping