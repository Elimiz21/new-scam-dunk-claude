---
description: Cleanup and Optimization Tasks for Scam Dunk
---

# Cleanup & Optimization Tasks

## 1. CSS Consolidation
- [ ] **Analyze CSS Usage**: Determine which styles from `globals.css` are actually used vs. `globals-holographic.css`.
- [ ] **Remove Legacy Files**: Delete `globals-old.css`.
- [ ] **Merge**: Consolidate necessary base styles into a single `globals.css` (or keep `globals-holographic.css` as the main one and rename it).

## 2. Configuration Fixes
- [ ] **Fix Next.js Config**: Remove `env.JWT_SECRET` from `next.config.js` options if it's causing warnings. Use `process.env.JWT_SECRET` directly in code or `publicRuntimeConfig` (though env vars are preferred).

## 3. Python Backend Optimization
- [ ] **NLTK Data**: Create a script to download NLTK data during the build process (e.g., in `Dockerfile` or a `prestart.sh`) instead of checking at runtime in `text_preprocessor.py`.

## 4. Error Handling
- [ ] **Frontend UI**: Update `ChatAnalysisPage` to show inline error states for better UX.
