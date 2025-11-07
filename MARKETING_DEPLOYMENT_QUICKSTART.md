# Marketing Dashboard - Separate Deployment Quick Start

**Goal**: Deploy marketing dashboard to its own URL in 10 minutes.

---

## Option 1: Vercel Dashboard (Recommended - Easiest)

### Step 1: Create New Project (3 minutes)

1. Go to https://vercel.com/new
2. Select your GitHub repo: `Elimiz21/new-scam-dunk-claude`
3. Click "Import"
4. Configure:
   ```
   Project Name: scam-dunk-marketing
   Framework: Next.js
   Root Directory: ./
   Build Command: cd packages/web && npm run build
   Output Directory: packages/web/.next
   Install Command: npm install --legacy-peer-deps
   ```
5. Click "Deploy" (it will fail - that's OK, we need to add env vars first)

### Step 2: Add Environment Variables (5 minutes)

Go to Project Settings → Environment Variables and add:

**Required**:
```bash
NEXT_PUBLIC_APP_MODE=marketing
NEXT_PUBLIC_MAIN_APP_URL=https://scam-dunk-production.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://gcrkijxkecsfafjbojey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
OPENAI_API_KEY=<your-openai-key>
```

**Optional** (copy from main project if you have them):
```bash
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
SENTRY_ORG=<your-org>
SENTRY_PROJECT=<your-project>
SENTRY_AUTH_TOKEN=<your-token>
```

**How to get values**:
- Supabase keys: Copy from `scam-dunk-production` project environment variables
- OpenAI key: Get from https://platform.openai.com/api-keys
- Main app URL: Use `https://scam-dunk-production.vercel.app` or your custom domain

### Step 3: Redeploy (2 minutes)

1. Go to Deployments tab
2. Click the three dots on latest deployment
3. Click "Redeploy"
4. Wait for build to complete

### Step 4: Test (2 minutes)

1. Click "Visit" to open the deployed site
2. You should see the marketing dashboard at the root URL (`/`)
3. Try logging in
4. Check that all tabs work

**Done!** Your marketing dashboard is now at:
- Vercel URL: `https://scam-dunk-marketing.vercel.app`
- You can add a custom domain next

---

## Option 2: Vercel CLI (For Advanced Users)

### Prerequisites
```bash
npm install -g vercel
```

### Deploy Command
```bash
# From project root
./scripts/deploy-marketing.sh production
```

Or manually:
```bash
vercel --prod \
  --name scam-dunk-marketing \
  --yes \
  --env NEXT_PUBLIC_APP_MODE=marketing \
  --env NEXT_PUBLIC_MAIN_APP_URL=https://scam-dunk-production.vercel.app
```

---

## Adding Custom Domain (Optional)

### For `marketing.scamdunk.com`:

**Step 1: Configure DNS**
1. Log into your domain registrar
2. Add CNAME record:
   ```
   Type: CNAME
   Name: marketing
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

**Step 2: Add to Vercel**
1. Go to Project Settings → Domains
2. Click "Add"
3. Enter: `marketing.scamdunk.com`
4. Click "Add"
5. Wait for SSL certificate (usually 1-2 minutes)

**Done!** Your dashboard is now at:
- `https://marketing.scamdunk.com`

---

## Recommended URL Structure

```
Main App:       https://scam-dunk-production.vercel.app (or app.scamdunk.com)
Marketing Ops:  https://scam-dunk-marketing.vercel.app (or marketing.scamdunk.com)
```

Benefits:
- ✅ Complete isolation
- ✅ Independent deployments
- ✅ Separate access controls
- ✅ Different analytics tracking
- ✅ Can restrict by IP (Vercel Firewall)

---

## Testing Checklist

After deployment, verify:

- [ ] Root URL (`/`) shows marketing dashboard, not login page
- [ ] Login redirects to Supabase and back
- [ ] All 6 tabs load (Workflow, Docs, Agents, Analytics, Integrations, Team)
- [ ] Agent prompt editor works
- [ ] "Optimize Prompt" button works (requires OpenAI key)
- [ ] Documentation links go to GitHub
- [ ] "Main App" link goes to production app
- [ ] Navigating to `/scan` redirects to main app

---

## Troubleshooting

### Issue: Root shows 404 or blank page
**Solution**: Check that `NEXT_PUBLIC_APP_MODE=marketing` is set in environment variables

### Issue: Redirect loop on login
**Solution**: Verify Supabase URL and keys are correct

### Issue: "Optimize Prompt" fails
**Solution**: Check that `OPENAI_API_KEY` is set and valid

### Issue: Marketing page not found
**Solution**: Ensure `packages/web/app/marketing/page.tsx` exists in deployment

### Issue: Build fails
**Solution**:
1. Check build logs for specific error
2. Verify `next.config.js` has no syntax errors
3. Try deploying main app first to ensure code is valid

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_APP_MODE` | ✅ Yes | Enables marketing mode | `marketing` |
| `NEXT_PUBLIC_MAIN_APP_URL` | ✅ Yes | Main app URL for redirects | `https://scam-dunk-production.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service key | `eyJhbG...` |
| `OPENAI_API_KEY` | ⚠️ Recommended | OpenAI for prompt optimization | `sk-proj-...` |
| `NEXT_PUBLIC_SENTRY_DSN` | ⬜ Optional | Error tracking | `https://...` |
| `NEXT_PUBLIC_GA_ID` | ⬜ Optional | Google Analytics | `G-...` |

---

## What Gets Deployed

**Marketing-Only Routes**:
- `/` → redirects to `/marketing`
- `/marketing` → Dashboard (all 6 tabs)
- `/login`, `/register` → Authentication pages
- `/api/marketing/*` → Marketing API routes

**Redirected to Main App**:
- `/scan/*` → Main app
- `/dashboard` → Main app
- `/alerts` → Main app
- `/history` → Main app
- `/chat-import` → Main app

---

## Security Notes

1. **Authentication**: Marketing dashboard requires login (MarketingGate component)
2. **Firewall** (Optional): Add IP allowlist in Vercel Settings → Firewall
3. **Role-Based Access** (Future): Can add role check to restrict to marketing team only
4. **Audit Logs**: All prompt changes and integration updates should be logged

---

## Cost

**Vercel Pricing**:
- Free: 2 projects, 100GB bandwidth/month
- Pro: $20/month per team member, unlimited projects

**Recommendation**:
- Start with Free tier
- Upgrade to Pro when you need:
  - Custom domains
  - Team collaboration
  - Advanced analytics
  - Priority support

---

## Next Steps After Deployment

1. **Create Database Tables**:
   - See `PRODUCTION_API_KEYS_SETUP.md`
   - Create 3 marketing tables in Supabase

2. **Test All Features**:
   - Login and verify authentication
   - Test each dashboard tab
   - Try prompt optimization
   - Check documentation links

3. **Configure Monitoring**:
   - Set up Sentry error tracking
   - Add Google Analytics
   - Monitor API usage and costs

4. **Set Up Custom Domain** (if desired):
   - Configure DNS CNAME
   - Add domain in Vercel
   - Update `NEXT_PUBLIC_MAIN_APP_URL` if main app also gets custom domain

5. **Share with Team**:
   - Send marketing dashboard URL
   - Create accounts for team members
   - Set up role-based access (optional)

---

## Support

- **Deployment Issues**: Check Vercel deployment logs
- **Authentication Issues**: Check Supabase logs
- **API Issues**: Check browser console and network tab
- **Build Errors**: Review `next.config.js` and package.json

**Documentation**:
- Full guide: `MARKETING_SEPARATE_DEPLOYMENT.md`
- API keys setup: `PRODUCTION_API_KEYS_SETUP.md`
- Implementation review: `MARKETING_IMPLEMENTATION_REVIEW.md`

---

**Estimated Setup Time**: 10-15 minutes

**Result**: Marketing dashboard at its own URL, completely isolated from main app!
