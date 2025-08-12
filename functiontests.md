# Function Test Results - Tue Aug 12 15:26:40 IDT 2025

## Test Execution Summary

Started at: Tue Aug 12 15:26:40 IDT 2025

## 1. Container Health Checks

- ✅ scamdunk-postgres: Running
- ✅ scamdunk-redis: Running
- ✅ scamdunk-api: Running
- ✅ scamdunk-web: Running
- ✅ scamdunk-ai: Running
- ✅ scamdunk-blockchain: Running

## 2. Health Check Endpoints

- ✅ API Health Check - HTTP 200
- ❌ Web Health Check - HTTP 500
  Error: <!DOCTYPE html><html><head><style data-next-hide-fouc="true">body{display:none}</style><noscript data-next-hide-fouc="true"><style>body{display:block}</style></noscript><meta charSet="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="next-head-count" content="2"/><noscript data-n-css=""></noscript><script defer="" nomodule="" src="/_next/static/chunks/polyfills.js?ts=1755001600967"></script><script src="/_next/static/chunks/fallback/webpack.js?ts=1755001600967" defer=""></script><script src="/_next/static/chunks/fallback/main.js?ts=1755001600967" defer=""></script><script src="/_next/static/chunks/fallback/pages/_app.js?ts=1755001600967" defer=""></script><script src="/_next/static/chunks/fallback/pages/_error.js?ts=1755001600967" defer=""></script><noscript id="__next_css__DO_NOT_USE__"></noscript></head><body><div id="__next"></div><script src="/_next/static/chunks/fallback/react-refresh.js?ts=1755001600967"></script><script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"statusCode":500}},"page":"/_error","query":{},"buildId":"development","isFallback":false,"err":{"name":"Error","source":"server","message":"Module not found: Can't resolve '@radix-ui/react-toast'\n  2 |\n  3 | import * as React from 'react'\n\u003e 4 | import * as ToastPrimitives from '@radix-ui/react-toast'\n  5 | import { cva, type VariantProps } from 'class-variance-authority'\n  6 | import { X } from 'lucide-react'\n  7 | import { cn } from '@/lib/utils'\n\nhttps://nextjs.org/docs/messages/module-not-found\n","stack":"Error: Module not found: Can't resolve '@radix-ui/react-toast'\n\u001b[0m \u001b[90m 2 |\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 3 |\u001b[39m \u001b[36mimport\u001b[39m \u001b[33m*\u001b[39m \u001b[36mas\u001b[39m \u001b[33mReact\u001b[39m \u001b[36mfrom\u001b[39m \u001b[32m'react'\u001b[39m\u001b[0m\n\u001b[0m\u001b[31m\u001b[1m\u003e\u001b[22m\u001b[39m\u001b[90m 4 |\u001b[39m \u001b[36mimport\u001b[39m \u001b[33m*\u001b[39m \u001b[36mas\u001b[39m \u001b[33mToastPrimitives\u001b[39m \u001b[36mfrom\u001b[39m \u001b[32m'@radix-ui/react-toast'\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 5 |\u001b[39m \u001b[36mimport\u001b[39m { cva\u001b[33m,\u001b[39m type \u001b[33mVariantProps\u001b[39m } \u001b[36mfrom\u001b[39m \u001b[32m'class-variance-authority'\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 6 |\u001b[39m \u001b[36mimport\u001b[39m { \u001b[33mX\u001b[39m } \u001b[36mfrom\u001b[39m \u001b[32m'lucide-react'\u001b[39m\u001b[0m\n\u001b[0m \u001b[90m 7 |\u001b[39m \u001b[36mimport\u001b[39m { cn } \u001b[36mfrom\u001b[39m \u001b[32m'@/lib/utils'\u001b[39m\u001b[0m\n\nhttps://nextjs.org/docs/messages/module-not-found\n\n    at getNotFoundError (/app/node_modules/next/dist/build/webpack/plugins/wellknown-errors-plugin/parseNotFoundError.js:120:16)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async getModuleBuildError (/app/node_modules/next/dist/build/webpack/plugins/wellknown-errors-plugin/webpackModuleError.js:102:27)\n    at async /app/node_modules/next/dist/build/webpack/plugins/wellknown-errors-plugin/index.js:29:49\n    at async Promise.all (index 0)\n    at async /app/node_modules/next/dist/build/webpack/plugins/wellknown-errors-plugin/index.js:27:21"},"gip":true,"scriptLoader":[]}</script></body></html>
- ✅ AI Service Health Check - HTTP 200
- ✅ Blockchain Service Health Check - HTTP 200

## 3. API Service Endpoints

### Authentication Endpoints
- ✅ Auth Register - HTTP 200
- ✅ Auth Login - HTTP 200
- ✅ Auth Logout - HTTP 200
- ✅ Auth Refresh Token - HTTP 200
- ✅ Auth Forgot Password - HTTP 200
- ✅ Auth Reset Password - HTTP 200
- ✅ Auth Verify Email - HTTP 200
- ✅ Auth Resend Verification - HTTP 200

### User Management Endpoints
- ✅ Get Current User - HTTP 200
- ✅ Update Current User - HTTP 200
- ✅ Get User Stats - HTTP 200
- ✅ Delete Current User - HTTP 200

### Scan Endpoints
- ✅ Create New Scan - HTTP 200
- ✅ Get All Scans - HTTP 200
- ✅ Get Scan by ID - HTTP 200

### Chat Import Endpoints
- ✅ Initialize Chat Upload - HTTP 200
- ✅ Get Supported Formats - HTTP 200
- ✅ List Chat Imports - HTTP 200

### Detection Endpoints
- ✅ Get Detections for Scan - HTTP 200

### Notification Endpoints
- ✅ Get Notifications - HTTP 200
- ✅ Mark Notification as Read - HTTP 200

## 4. AI Service Endpoints

- ✅ AI Quick Scan - HTTP 200
- ✅ AI Analyze Messages - HTTP 200
- ✅ AI Batch Detection - HTTP 200
- ✅ AI Get Detection Patterns - HTTP 200
- ✅ AI Service Status - HTTP 200
- ✅ AI Available Models - HTTP 200
- ✅ AI Service Version - HTTP 200

## 5. Blockchain Service Endpoints

### Verification Endpoints
- ✅ Verify Token - HTTP 200
- ✅ Verify Wallet - HTTP 200
- ✅ Scan Transaction - HTTP 200
- ✅ Get Verification Status - HTTP 200

### Analysis Endpoints
- ✅ Analyze Contract - HTTP 200
- ✅ Detect Honeypot - HTTP 200
- ✅ Detect Rugpull - HTTP 200
- ✅ Get Supported Networks - HTTP 200

### Price Endpoints
- ✅ Get Token Price - HTTP 200
- ✅ Get Historical Price - HTTP 200
- ✅ Get Trending Prices - HTTP 200

## 6. WebSocket Endpoints

- ❌ WebSocket endpoint not accessible

## 7. Container Error Analysis

- ✅ scamdunk-postgres: No errors detected
- ✅ scamdunk-redis: No errors detected
- ⚠️ scamdunk-api:     2157 error(s) detected
    - src/users/users.controller.ts(14,35): error TS2307: Cannot find module '@scam-dunk/shared' or its corresponding type declarations.
    - src/users/users.resolver.ts(1,49): error TS2307: Cannot find module '@nestjs/graphql' or its corresponding type declarations.
    - src/users/users.service.ts(3,41): error TS2307: Cannot find module '@scam-dunk/shared' or its corresponding type declarations.
- ⚠️ scamdunk-web:        1 error(s) detected
    - > Build failed because of webpack errors
- ✅ scamdunk-ai: No errors detected
- ⚠️ scamdunk-blockchain:     1430 error(s) detected
    - src/services/web3-provider.service.ts(183,19): error TS2365: Operator '/' cannot be applied to types 'bigint' and 'number'.
    - src/utils/formatting.ts(1,23): error TS2307: Cannot find module 'bignumber.js' or its corresponding type declarations.
    - src/utils/validation.ts(3,27): error TS2307: Cannot find module '@solana/web3.js' or its corresponding type declarations.

## Test Summary

- **Total Tests**: 43
- **Passed**: 42
- **Failed**: 1
- **Success Rate**: 97%

Completed at: Tue Aug 12 15:26:42 IDT 2025
