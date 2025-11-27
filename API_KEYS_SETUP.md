# Missing API Keys Setup

To fix the "Contact Verification" errors, you need to add the following keys to your Vercel Production Environment.

## Required Keys

| Variable Name | Purpose | Where to get it |
| :--- | :--- | :--- |
| `EMAILREP_API_KEY` | Email verification | [EmailRep.io](https://emailrep.io/) (Free tier available) |
| `NUMVERIFY_API_KEY` | Phone verification | [Numverify](https://numverify.com/) (Free tier available) |

## How to Add to Vercel

1.  Go to your Vercel Dashboard.
2.  Select the `scam-dunk` project.
3.  Click **Settings** -> **Environment Variables**.
4.  Add `EMAILREP_API_KEY` and paste your key.
5.  Add `NUMVERIFY_API_KEY` and paste your key.
6.  **IMPORTANT**: You must redeploy for these changes to take effect.
    *   Go to **Deployments**.
    *   Click the three dots on the latest deployment.
    *   Select **Redeploy**.

