# Production Debugging Guide

## Issue: Site Not Loading Properly

### What We've Confirmed:
1. ✅ **Server is responding** - HTTP 200 status
2. ✅ **HTML is being served** - Content includes "Scam Dunk"
3. ✅ **APIs are working** - All 4 detection endpoints functional
4. ✅ **Static files exist** - Next.js chunks are being served
5. ❌ **Iframe blocked** - Security headers prevent embedding (this is normal)

### To Debug in Your Browser:

1. **Open the site directly**: https://scam-dunk-production.vercel.app

2. **Open Developer Console** (F12 or Right-click → Inspect)

3. **Check Console Tab** for errors:
   - Look for red error messages
   - Common issues:
     - "Failed to fetch"
     - "Uncaught TypeError"
     - "Hydration failed"
     - "ChunkLoadError"

4. **Check Network Tab**:
   - Refresh the page with Network tab open
   - Look for any red (failed) requests
   - Check if JavaScript files are loading (should be 200 status)
   - Look for files from `/_next/static/`

5. **Check for JavaScript Disabled**:
   - The site requires JavaScript to run
   - Check browser settings

6. **Try Incognito/Private Mode**:
   - Rules out extensions/cache issues
   - Chrome: Cmd+Shift+N (Mac) or Ctrl+Shift+N (Windows)
   - Safari: Cmd+Shift+N
   - Firefox: Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)

### Common Fixes:

1. **Clear Cache**:
   ```
   Mac: Cmd + Shift + R
   Windows: Ctrl + Shift + R
   ```

2. **Disable Ad Blockers/Extensions**:
   - Some extensions can break React apps
   - Try disabling all extensions temporarily

3. **Check Browser Compatibility**:
   - Site requires modern browser
   - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### If You See Specific Errors:

**"Hydration failed"** or **"Text content does not match"**:
- This means server and client rendering mismatch
- Usually a date/time or random value issue

**"ChunkLoadError"** or **"Failed to fetch dynamically imported module"**:
- Build cache issue
- Deployment may need cache clearing

**"Cannot read properties of undefined"**:
- Missing environment variable or API response issue

### Quick Test URLs:
- Homepage: https://scam-dunk-production.vercel.app
- Scan Page: https://scam-dunk-production.vercel.app/scan
- Admin Login: https://scam-dunk-production.vercel.app/admin/login
- API Test: https://scam-dunk-production.vercel.app/api/contact-verification (should show error for GET)

### Report Back:
Please share:
1. Any error messages from Console
2. Any failed requests from Network tab
3. Which browser and version you're using
4. Whether incognito mode works