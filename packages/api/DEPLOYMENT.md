# Backend API Deployment Guide

## Deployment to Render.com

### Prerequisites
1. Create a free account at [Render.com](https://render.com)
2. Create a free MongoDB Atlas cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Choose a cloud provider and region close to your Render deployment (Oregon/US-West)
4. Create a database user with password
5. Add `0.0.0.0/0` to IP Whitelist (for Render access)
6. Get your connection string: `mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/scamdunk?retryWrites=true&w=majority`

### Render Deployment Steps

1. **Fork or Connect GitHub Repository**
   - Connect your GitHub account to Render
   - Select the repository: `new-scam-dunk-claude`

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect to your GitHub repository
   - Configure:
     - Name: `scam-dunk-api`
     - Region: Oregon (US West)
     - Branch: main
     - Root Directory: `packages/api`
     - Runtime: Node
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`

3. **Environment Variables**
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-a-secure-random-string>
   JWT_EXPIRES_IN=7d
   REFRESH_TOKEN_EXPIRES_IN=30d
   FRONTEND_URL=https://scam-dunk-production.vercel.app
   ALLOWED_ORIGINS=https://scam-dunk-production.vercel.app,https://ocma.dev
   LOG_LEVEL=info
   
   # Optional (for full functionality)
   OPENAI_API_KEY=<your-openai-api-key>
   REDIS_URL=<redis-connection-string>
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your API will be available at: `https://scam-dunk-api.onrender.com`

### Alternative: Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   cd packages/api
   railway init
   ```

3. **Add MongoDB Plugin**
   ```bash
   railway add mongodb
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=$(openssl rand -base64 32)
   railway variables set FRONTEND_URL=https://scam-dunk-production.vercel.app
   ```

### Alternative: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

2. **Create Heroku App**
   ```bash
   heroku create scam-dunk-api
   cd packages/api
   ```

3. **Add MongoDB Add-on**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=$(openssl rand -base64 32)
   heroku config:set FRONTEND_URL=https://scam-dunk-production.vercel.app
   ```

## Vercel Frontend Configuration

After deploying the backend, update your Vercel environment variables:

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your `new-scam-dunk-claude` project
3. Go to Settings → Environment Variables
4. Add/Update:
   ```
   NEXT_PUBLIC_API_URL=https://scam-dunk-api.onrender.com
   NEXT_PUBLIC_WS_URL=wss://scam-dunk-api.onrender.com
   ```
5. Redeploy the frontend

## Testing Production Deployment

1. **Test API Health**
   ```bash
   curl https://scam-dunk-api.onrender.com/health
   ```

2. **Test CORS**
   ```bash
   curl -H "Origin: https://scam-dunk-production.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        https://scam-dunk-api.onrender.com/health
   ```

3. **Test Authentication**
   ```bash
   curl -X POST https://scam-dunk-api.onrender.com/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"Test123456!","firstName":"Test","lastName":"User"}'
   ```

## Monitoring

- Render provides basic monitoring in the dashboard
- Check logs: Dashboard → Logs
- Set up alerts for downtime
- Consider adding Sentry for error tracking

## Scaling

When ready to scale:
1. Upgrade Render plan for more resources
2. Add Redis for caching (Redis Cloud free tier)
3. Implement rate limiting per user
4. Add CDN for static assets
5. Consider multi-region deployment