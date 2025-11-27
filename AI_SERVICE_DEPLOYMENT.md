# AI Service Deployment Guide

The Chat Analysis feature requires the Python AI service (`packages/ai`) to be running and accessible by the Next.js web app.

## Option 1: Deploy to Render (Recommended for ease)

1.  **Create a new Web Service** on [Render.com](https://render.com).
2.  **Connect your GitHub repository**.
3.  **Root Directory**: `packages/ai`
4.  **Runtime**: Python 3
5.  **Build Command**: `pip install -r requirements.txt`
6.  **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7.  **Environment Variables**:
    *   `PYTHON_VERSION`: `3.11.0`
    *   (Add any other API keys needed by the AI service if applicable)

Once deployed, Render will give you a URL (e.g., `https://scam-dunk-ai.onrender.com`).

## Option 2: Deploy to Railway

1.  **New Project** > **Deploy from GitHub repo**.
2.  **Settings** > **Root Directory**: `packages/ai`
3.  Railway usually auto-detects the `requirements.txt` and `Procfile` (if present) or start command.
4.  If needed, set Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Final Step: Connect Web App

1.  Copy your new AI Service URL.
2.  Go to your Vercel Project (Web App).
3.  **Settings** > **Environment Variables**.
4.  Add/Update: `AI_SERVICE_URL` with the value of your new URL (e.g., `https://scam-dunk-ai.onrender.com`).
5.  **Redeploy** the Web App (or just the latest commit) for the env var to take effect.

