# Production Deployment Guide for Scam Dunk

## Overview
This guide provides step-by-step instructions for deploying Scam Dunk to production.

## Prerequisites

### 1. Required Accounts & Services
- [ ] AWS or Google Cloud Platform account
- [ ] Domain name (scamdunk.com or similar)
- [ ] SSL certificate (Let's Encrypt or paid)
- [ ] Production database (PostgreSQL)
- [ ] Redis instance for caching
- [ ] Email service (SendGrid/AWS SES)
- [ ] Monitoring service (Datadog/New Relic)
- [ ] Error tracking (Sentry)

### 2. API Keys Required
**Contact Verification**
- [ ] Truecaller API Key
- [ ] Hunter.io API Key
- [ ] EmailRep API Key
- [ ] Numverify API Key

**Trading Analysis**
- [ ] Alpha Vantage API Key
- [ ] Yahoo Finance API Key (if required)
- [ ] CoinGecko API Key
- [ ] CoinMarketCap API Key
- [ ] NewsAPI Key

**Blockchain**
- [ ] Etherscan API Key
- [ ] BSCScan API Key

**AI Services**
- [ ] OpenAI API Key (GPT-4)
- [ ] Anthropic API Key (optional)
- [ ] HuggingFace API Key

**Other Services**
- [ ] Supabase/PostgreSQL credentials
- [ ] Redis credentials
- [ ] SendGrid/Email API Key
- [ ] Sentry DSN
- [ ] Datadog API Key

## Deployment Steps

### Step 1: Environment Configuration

1. **Create production environment file**
```bash
cp .env.example .env.production
```

2. **Update all API keys and credentials**
3. **Set production URLs and domains**

### Step 2: Database Setup

1. **Create production database**
```bash
# For Supabase
npx prisma migrate deploy
npx prisma generate
```

2. **Seed initial data (if needed)**
```bash
npx prisma db seed
```

### Step 3: Build Process

1. **Install dependencies**
```bash
npm ci --production
```

2. **Build all packages**
```bash
npm run build
```

3. **Run production tests**
```bash
npm run test:production
```

### Step 4: Cloud Infrastructure Setup

#### Option A: AWS Deployment

1. **EC2 Instance Setup**
```bash
# Instance type: t3.large or higher
# OS: Ubuntu 22.04 LTS
# Security groups: 80, 443, 22 (SSH)
```

2. **RDS PostgreSQL**
```bash
# Engine: PostgreSQL 15
# Instance: db.t3.medium
# Storage: 100GB SSD
# Multi-AZ: Yes
```

3. **ElastiCache Redis**
```bash
# Node type: cache.t3.micro
# Number of nodes: 2 (primary + replica)
```

4. **Application Load Balancer**
```bash
# Target groups for each service
# Health check endpoints configured
# SSL termination at ALB
```

#### Option B: Google Cloud Platform

1. **Compute Engine**
2. **Cloud SQL (PostgreSQL)**
3. **Memorystore (Redis)**
4. **Cloud Load Balancing**

#### Option C: Vercel + Supabase (Recommended for Quick Deploy)

1. **Frontend on Vercel**
2. **Database on Supabase**
3. **API on Railway/Render**
4. **Redis on Upstash**

### Step 5: Application Deployment

1. **Deploy Frontend (Next.js)**
```bash
# For Vercel
vercel --prod

# For traditional hosting
npm run build
npm run start
```

2. **Deploy API Services**
```bash
# Start all services with PM2
pm2 start ecosystem.config.js --env production
```

3. **Deploy AI Service**
```bash
# Python FastAPI service
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Step 6: DNS & SSL Configuration

1. **Configure DNS records**
```
A     @         -> Your server IP
A     www       -> Your server IP
A     api       -> API server IP
CNAME ai        -> AI service domain
```

2. **Install SSL certificate**
```bash
# Using Certbot for Let's Encrypt
sudo certbot --nginx -d scamdunk.com -d www.scamdunk.com
```

### Step 7: Security Hardening

1. **Configure firewall**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. **Set up fail2ban**
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

3. **Configure rate limiting**
4. **Enable DDoS protection (Cloudflare)**
5. **Set up WAF rules**

### Step 8: Monitoring & Logging

1. **Set up application monitoring**
```javascript
// Datadog
const tracer = require('dd-trace').init({
  hostname: process.env.DD_AGENT_HOST,
  port: 8126
});

// Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production'
});
```

2. **Configure log aggregation**
```bash
# CloudWatch, Datadog Logs, or ELK stack
```

3. **Set up uptime monitoring**
- StatusPage.io
- Pingdom
- UptimeRobot

### Step 9: Performance Optimization

1. **Enable caching**
- CloudFlare CDN for static assets
- Redis for API responses
- Browser caching headers

2. **Image optimization**
```bash
npm run optimize:images
```

3. **Code splitting and lazy loading**
4. **Database query optimization**
5. **Enable gzip compression**

### Step 10: Backup & Disaster Recovery

1. **Database backups**
```bash
# Daily automated backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

2. **Application code backups**
3. **Disaster recovery plan**
4. **Regular backup testing**

## Environment Variables Template

```env
# Production Environment Variables
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/scamdunk_prod
REDIS_URL=redis://host:6379

# API URLs
NEXT_PUBLIC_API_URL=https://api.scamdunk.com
AI_SERVICE_URL=https://ai.scamdunk.com

# Contact Verification APIs
TRUECALLER_API_KEY=
HUNTER_IO_API_KEY=
EMAILREP_API_KEY=
NUMVERIFY_API_KEY=

# Trading Analysis APIs
ALPHA_VANTAGE_API_KEY=
YAHOO_FINANCE_API_KEY=
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=
NEWS_API_KEY=

# Blockchain APIs
ETHERSCAN_API_KEY=
BSCSCAN_API_KEY=

# AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
HUGGINGFACE_API_KEY=

# Security
JWT_SECRET=
ENCRYPTION_KEY=
SESSION_SECRET=

# Email
SENDGRID_API_KEY=
EMAIL_FROM=noreply@scamdunk.com

# Monitoring
SENTRY_DSN=
DATADOG_API_KEY=

# Feature Flags
ENABLE_CONTACT_VERIFICATION=true
ENABLE_CHAT_ANALYSIS=true
ENABLE_TRADING_ANALYSIS=true
ENABLE_VERACITY_CHECK=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Commands

### Quick Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy to AWS with Docker
```bash
# Build Docker images
docker build -t scamdunk-web ./packages/web
docker build -t scamdunk-api ./packages/api

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL
docker tag scamdunk-web:latest $ECR_URL/scamdunk-web:latest
docker push $ECR_URL/scamdunk-web:latest

# Deploy with ECS/Fargate
aws ecs update-service --cluster production --service scamdunk-web --force-new-deployment
```

### Deploy with PM2
```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

## Health Check Endpoints

```javascript
// API Health Check
GET /health
Response: { status: 'ok', timestamp: '...', version: '1.0.0' }

// Database Health Check
GET /health/db
Response: { status: 'connected', latency: '5ms' }

// Redis Health Check
GET /health/redis
Response: { status: 'connected', latency: '2ms' }
```

## Post-Deployment Checklist

### Immediate (First Hour)
- [ ] Verify all services are running
- [ ] Test critical user flows
- [ ] Check error logging
- [ ] Verify SSL certificate
- [ ] Test email notifications
- [ ] Check database connections
- [ ] Verify API endpoints
- [ ] Test payment processing (if applicable)

### First 24 Hours
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review security logs
- [ ] Test backup systems
- [ ] Verify rate limiting
- [ ] Check CDN caching
- [ ] Monitor resource usage

### First Week
- [ ] Conduct load testing
- [ ] Security penetration testing
- [ ] Performance optimization
- [ ] User feedback collection
- [ ] Bug fixes and patches
- [ ] Documentation updates

## Rollback Plan

If issues occur:

1. **Immediate Rollback**
```bash
# Revert to previous version
git revert HEAD
npm run deploy:rollback
```

2. **Database Rollback**
```bash
npx prisma migrate revert
```

3. **DNS Failover**
- Switch to backup servers
- Enable maintenance mode

## Support & Monitoring

### Key Metrics to Monitor
- Response time (p50, p95, p99)
- Error rate
- Database query time
- API usage by endpoint
- User sessions
- Conversion rates

### Alert Thresholds
- Error rate > 1%
- Response time > 2s
- Database connections > 80%
- Memory usage > 85%
- CPU usage > 80%

## Security Considerations

1. **API Security**
- Rate limiting per IP/user
- API key rotation
- Request signing
- CORS configuration

2. **Data Protection**
- Encryption at rest
- Encryption in transit
- PII handling
- GDPR compliance

3. **Access Control**
- IAM roles
- Principle of least privilege
- MFA for admin access
- Audit logging

## Cost Optimization

### Estimated Monthly Costs
- **Small (< 10k users)**: $500-1000/month
- **Medium (10k-100k users)**: $2000-5000/month
- **Large (100k+ users)**: $10,000+/month

### Cost Saving Tips
1. Use reserved instances
2. Implement auto-scaling
3. Optimize database queries
4. Use CDN effectively
5. Clean up unused resources

## Contact & Support

For deployment assistance:
- Technical Lead: [email]
- DevOps Team: [slack channel]
- Emergency: [phone number]

---

**Last Updated**: August 13, 2025
**Version**: 1.0.0
**Status**: Ready for Production Deployment