# Vercel Environment Setup

To fix the "Internal Server Error" on the live site, you must add these environment variables to your Vercel project.

## 1. Go to Vercel Dashboard
1.  Open your project: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2.  Navigate to **Settings** > **Environment Variables**.

## 2. Add the following variables:

**Key:** `NEXT_PUBLIC_SUPABASE_URL`
**Value:**
```text
https://gcrkijxkecsfafjbojey.supabase.co
```

**Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value:**
```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpanhrZWNzZmFmamJvamV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzk5NTcsImV4cCI6MjA3MDY1NTk1N30.Pk1cNqv5V_EjOIaPY9u7Lgg1NrhRN6uAnhBEbJ3Y68A
```

## 3. Redeploy
After adding these variables, you must **Redeploy** for them to take effect:
1.  Go to the **Deployments** tab.
2.  Click the three dots (`...`) next to the latest deployment.
3.  Select **Redeploy**.

---

### Optional (For Real Market Data)
If you want real-time stock/crypto data instead of simulated results, add:
- `ALPHA_VANTAGE_API_KEY`
- `COINMARKETCAP_API_KEY`
- `HIBP_API_KEY` (For email breach checks)
