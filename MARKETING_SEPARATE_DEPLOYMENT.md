# Marketing Dashboard - Separate Deployment Guide

**Goal**: Deploy the Marketing Operations Dashboard to a completely separate URL from the main Scam Dunk app.

**Options**:
1. Separate Vercel project (subdomain)
2. Separate Vercel project (custom domain)
3. Monorepo with selective deployment

---

## Recommended Approach: Separate Vercel Project

### Option A: Subdomain Deployment (Recommended)

**URLs**:
- Main App: `https://scam-dunk-production.vercel.app` (or `scamdunk.com`)
- Marketing Dashboard: `https://marketing.scamdunk.com` or `https://ops.scamdunk.com`

**Advantages**:
- Complete isolation from main app
- Can deploy independently
- Separate environment variables
- Different access controls
- Easier to manage permissions

**Steps**:

1. **Create New Vercel Project**
2. **Configure DNS for Subdomain**
3. **Set Up Deployment Filter**
4. **Configure Environment Variables**
5. **Deploy**

---

## Implementation Plan

### Step 1: Create Separate Vercel Project

1. Go to https://vercel.com/new
2. Click "Add New Project"
3. Select the same GitHub repo: `Elimiz21/new-scam-dunk-claude`
4. Name it: `scam-dunk-marketing`
5. **Don't deploy yet** - we need to configure it first

### Step 2: Configure Vercel Project Settings

**Root Directory**: Leave as root (for monorepo access)

**Build Settings**:
```bash
# Framework Preset: Next.js
# Root Directory: ./
# Build Command: cd packages/web && npm run build
# Output Directory: packages/web/.next
# Install Command: npm install --legacy-peer-deps
```

**Environment Variables** (copy from main project):
```
NEXT_PUBLIC_SUPABASE_URL=https://gcrkijxkecsfafjbojey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]
OPENAI_API_KEY=[your-openai-key]
```

### Step 3: Create Marketing-Specific Configuration

Create a new file for marketing-only deployment:

**File**: `packages/web-marketing/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Only include marketing routes
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/marketing',
      },
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // Redirect all non-marketing routes to main app
  async redirects() {
    return [
      {
        source: '/scan/:path*',
        destination: 'https://scam-dunk-production.vercel.app/scan/:path*',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: 'https://scam-dunk-production.vercel.app/dashboard',
        permanent: false,
      },
      {
        source: '/alerts',
        destination: 'https://scam-dunk-production.vercel.app/alerts',
        permanent: false,
      },
      {
        source: '/history',
        destination: 'https://scam-dunk-production.vercel.app/history',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
```

### Step 4: Set Up DNS (If Using Custom Domain)

**For `marketing.scamdunk.com`**:

1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS settings for `scamdunk.com`
3. Add a CNAME record:
   ```
   Type: CNAME
   Name: marketing
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
4. In Vercel project settings:
   - Go to Settings → Domains
   - Add `marketing.scamdunk.com`
   - Vercel will verify DNS and issue SSL certificate

**For Vercel subdomain only**:
- Use: `scam-dunk-marketing.vercel.app` (automatic)

---

## Alternative: Filtered Deployment (Same Repo, Separate Deploy)

### Create `vercel-marketing.json`

```json
{
  "version": 2,
  "name": "scam-dunk-marketing",
  "buildCommand": "cd packages/web && npm run build",
  "outputDirectory": "packages/web/.next",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "regions": ["iad1"],

  "build": {
    "env": {
      "NEXT_PUBLIC_APP_MODE": "marketing"
    }
  },

  "routes": [
    {
      "src": "/",
      "dest": "/marketing"
    },
    {
      "src": "/(marketing|api/marketing)/.*",
      "dest": "/$1"
    },
    {
      "src": "/(login|register)",
      "dest": "/(auth)/$1"
    },
    {
      "src": "/.*",
      "status": 404,
      "dest": "/marketing"
    }
  ],

  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Deploy Command

```bash
vercel --prod --config vercel-marketing.json
```

---

## Quick Start: Easiest Method

### Method 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Navigate to project root
cd /Users/elimizroch/Projects/GitHub/new-scam-dunk-claude

# Deploy marketing dashboard as new project
vercel --name scam-dunk-marketing

# Follow prompts:
# - Link to existing project? No (create new)
# - Project name: scam-dunk-marketing
# - Which directory: ./ (root)
# - Override settings? Yes
# - Build Command: cd packages/web && npm run build
# - Output Directory: packages/web/.next
# - Development Command: cd packages/web && npm run dev

# Deploy to production
vercel --prod --name scam-dunk-marketing
```

### Method 2: Vercel Dashboard (Easiest)

1. **Create New Project**:
   - Go to https://vercel.com/new
   - Select `Elimiz21/new-scam-dunk-claude` repo
   - Name: `scam-dunk-marketing`

2. **Configure Build**:
   ```
   Framework: Next.js
   Root Directory: ./
   Build Command: cd packages/web && npm run build
   Output Directory: packages/web/.next
   Install Command: npm install --legacy-peer-deps
   ```

3. **Environment Variables** (copy all from main project):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - Add: `NEXT_PUBLIC_APP_MODE=marketing`

4. **Deploy**: Click "Deploy"

5. **Set as Root Route**:
   After deployment, in Vercel dashboard:
   - Settings → General → Root Directory
   - Or use rewrites in `next.config.js` (see below)

---

## Code Changes Needed

### 1. Update `packages/web/next.config.js`

Add marketing mode detection:

```javascript
const isMarketingDeploy = process.env.NEXT_PUBLIC_APP_MODE === 'marketing'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config

  async rewrites() {
    if (isMarketingDeploy) {
      return [
        {
          source: '/',
          destination: '/marketing',
        },
      ]
    }
    return []
  },

  async redirects() {
    if (isMarketingDeploy) {
      // Redirect main app routes to production app
      return [
        {
          source: '/scan/:path*',
          destination: 'https://scam-dunk-production.vercel.app/scan/:path*',
          permanent: false,
        },
        {
          source: '/dashboard',
          destination: 'https://scam-dunk-production.vercel.app/dashboard',
          permanent: false,
        },
      ]
    }
    return []
  },
}

module.exports = nextConfig
```

### 2. Update Marketing Header Navigation

**File**: `packages/web/components/marketing/MarketingHero.tsx`

Add link to main app:

```typescript
<Link
  href="https://scam-dunk-production.vercel.app"
  className="text-sm text-white/70 hover:text-white"
  target="_blank"
>
  → Go to Main App
</Link>
```

### 3. Update Main App Header

**File**: `packages/web/components/layout/holographic-header.tsx`

Update marketing link to point to new URL:

```typescript
<Link
  href={process.env.NEXT_PUBLIC_MARKETING_URL || '/marketing'}
  className="..."
>
  Marketing Ops
</Link>
```

Add to environment variables:
```
NEXT_PUBLIC_MARKETING_URL=https://marketing.scamdunk.com
```

---

## Testing Checklist

After deployment:

### Marketing Dashboard Tests:
- [ ] Visit new marketing URL
- [ ] Login works (redirects to Supabase auth)
- [ ] All 6 dashboard tabs load
- [ ] Documentation links work
- [ ] Agent prompt editor loads
- [ ] Prompt optimization works (needs OpenAI key)
- [ ] Integration panel loads
- [ ] API routes work (`/api/marketing/*`)

### Cross-Origin Tests:
- [ ] Login from marketing dashboard works
- [ ] Session persists across both apps
- [ ] API calls from marketing to Supabase work
- [ ] CORS configured correctly

### Navigation Tests:
- [ ] Links from marketing dashboard to main app work
- [ ] Links from main app to marketing dashboard work
- [ ] Authentication state syncs between both

---

## Security Considerations

### 1. Restrict Access to Marketing Dashboard

Add IP allowlist in Vercel (optional):
- Settings → Firewall
- Add allowed IPs for marketing team

### 2. Add Marketing-Specific Auth

**File**: `packages/web/components/marketing/MarketingGate.tsx`

Add role check:

```typescript
export function MarketingGate({ children }: Props) {
  const { isAuthenticated, user } = useAuthStore()

  // Check if user has marketing role
  const hasMarketingAccess = user?.app_metadata?.role === 'marketing' ||
                             user?.email?.endsWith('@scamdunk.com')

  if (!isAuthenticated || !hasMarketingAccess) {
    return <AccessDenied />
  }

  return <>{children}</>
}
```

### 3. Separate Analytics

Add separate Google Analytics ID for marketing dashboard:

```typescript
// In _app.tsx or layout
const GA_ID = process.env.NEXT_PUBLIC_APP_MODE === 'marketing'
  ? 'G-MARKETING-ID'
  : 'G-MAIN-APP-ID'
```

---

## Recommended URL Structure

**Option A: Subdomain** (Professional):
```
Main App:       https://app.scamdunk.com
Marketing Ops:  https://marketing.scamdunk.com
Admin Panel:    https://admin.scamdunk.com (future)
Marketing Site: https://scamdunk.com (public landing page)
```

**Option B: Vercel Subdomains** (Easy):
```
Main App:       https://scam-dunk-production.vercel.app
Marketing Ops:  https://scam-dunk-marketing.vercel.app
```

**Option C: Path-Based** (Not recommended for your use case):
```
Main App:       https://scamdunk.com/app
Marketing Ops:  https://scamdunk.com/marketing
```

---

## Cost Implications

**Current Setup** (1 Vercel project):
- Free tier: OK for development
- Pro: $20/month per team member

**Separate Deployment** (2 Vercel projects):
- Free tier: 2 projects allowed
- Pro: Same $20/month (unlimited projects per team)

**Recommendation**:
- Use Vercel Pro if you need:
  - Custom domains
  - Team collaboration
  - Better analytics
  - Priority support

---

## Quick Decision Matrix

| Requirement | Subdomain | Separate Project | Filtered Deploy |
|------------|-----------|-----------------|-----------------|
| Complete isolation | ✅ | ✅ | ⚠️ |
| Easy to set up | ⚠️ | ✅ | ✅ |
| Custom domain | ✅ | ✅ | ❌ |
| Independent deploys | ✅ | ✅ | ⚠️ |
| Shared code | ✅ | ✅ | ✅ |
| Different access control | ✅ | ✅ | ⚠️ |
| Cost | Same | Same | Same |

**Recommendation**: **Separate Vercel Project with Subdomain** (`marketing.scamdunk.com`)

---

## Implementation Steps (Recommended Path)

### Phase 1: Create Separate Project (5 minutes)
1. Create new Vercel project from same repo
2. Name it `scam-dunk-marketing`
3. Copy environment variables from main project
4. Add `NEXT_PUBLIC_APP_MODE=marketing`

### Phase 2: Configure Routes (10 minutes)
1. Update `next.config.js` with conditional rewrites
2. Update marketing components with cross-app links
3. Test locally with environment variable

### Phase 3: Deploy (5 minutes)
1. Deploy to Vercel
2. Test all marketing routes
3. Verify authentication works

### Phase 4: Custom Domain (15 minutes)
1. Configure DNS CNAME record
2. Add domain in Vercel
3. Wait for SSL certificate
4. Test production URL

**Total Time**: ~35 minutes

---

## Need Help Deciding?

**Choose Separate Vercel Project If**:
- You want complete isolation
- Different team members manage each app
- You want different deployment schedules
- You need different access controls

**Choose Filtered Deploy If**:
- You want simplicity
- Same team manages everything
- You don't need custom domain
- You're OK with single deployment pipeline

**My Recommendation**: **Separate Vercel Project** - It's cleaner, more flexible, and easier to manage long-term.

---

## Next Steps

1. Decide on URL structure (subdomain vs Vercel URL)
2. Create new Vercel project
3. I'll help you configure the code changes
4. Test deployment
5. Set up custom domain (if desired)

Let me know which approach you prefer and I'll help you implement it!
