# 🚀 SIMPLE DEPLOYMENT GUIDE FOR SCAM DUNK

Follow these steps to deploy your app to production in 10 minutes!

## Option 1: Deploy to Vercel (EASIEST - Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
(Follow the prompts to login with your email)

### Step 3: Deploy
```bash
cd /Users/elimizroch/ai_projects/new-scam-dunk-claude
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- Project name? **scam-dunk** (or press enter for default)
- Directory? **./packages/web**
- Override settings? **N**

### Step 4: Add Environment Variables
After deployment, go to: https://vercel.com/dashboard

1. Click on your **scam-dunk** project
2. Go to **Settings** → **Environment Variables**
3. Add these variables (COPY AND PASTE):

```
DATABASE_URL=postgresql://postgres.gcrkijxkecsfafjbojey:Elinka025045139@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.gcrkijxkecsfafjbojey:Elinka025045139@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://gcrkijxkecsfafjbojey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpanhrZWNzZmFmamJvamV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzOTE5MTUsImV4cCI6MjA0ODk2NzkxNX0.VsHcZtqR01JVsYMKZ5dvn2yB2zxUJFCvPqQQ7i5FQPA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpanhrZWNzZmFmamJvamV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzM5MTkxNSwiZXhwIjoyMDQ4OTY3OTE1fQ.t9XBUPK3Nl5e7EiZCKRjkUyKQ7nL3rHfBGZ1f76FXgM
NEXTAUTH_SECRET=your-super-secret-key-change-this-123456
JWT_SECRET=another-secret-key-change-this-789012
```

### Step 5: Redeploy
```bash
vercel --prod
```

### ✅ DONE! Your app is live!
Visit the URL Vercel gives you (like: https://scam-dunk.vercel.app)

---

## Option 2: Deploy to Netlify (Alternative)

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Build the app
```bash
cd /Users/elimizroch/ai_projects/new-scam-dunk-claude/packages/web
npm run build
```

### Step 3: Deploy
```bash
netlify deploy --prod --dir=.next
```

Follow the prompts to create a new site.

### Step 4: Add Environment Variables
Go to Netlify dashboard → Site settings → Environment variables
Add the same variables as above.

---

## What You Get:
- ✅ Free hosting
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Auto-scaling
- ✅ Your existing database (Supabase) connected
- ✅ All 4 detection tests working

## After Deployment:
1. Share your URL: `https://scam-dunk.vercel.app`
2. Test all features
3. Monitor usage in Vercel/Netlify dashboard

## Need Custom Domain?
In Vercel dashboard:
1. Go to Settings → Domains
2. Add your domain (e.g., scamdunk.com)
3. Follow DNS instructions

## Troubleshooting:
- If build fails: Try `vercel` without `--prod` first
- If database errors: Check Supabase is not paused
- If pages 404: Make sure you're in the right directory

## Questions?
The app is now deployed and live! Share the URL with others to start protecting people from scams!