#!/usr/bin/env node

/**
 * Syncs critical Scam Dunk secrets from the local secure vault into the Vercel project.
 * Reads values from ../.secure/scam-dunk-phase-secrets.env and upserts them via the Vercel API.
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const secretsPath = path.resolve(repoRoot, '..', '.secure', 'scam-dunk-phase-secrets.env');

function mask(value) {
  if (!value) return '(missing)';
  if (value.length <= 8) return `${value.slice(0, 2)}…${value.slice(-2)}`;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function parseEnvFile(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split('=');
      acc[key] = rest.join('=').trim();
      return acc;
    }, {});
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function main() {
  const raw = await readFile(secretsPath, 'utf8');
  const secrets = parseEnvFile(raw);

  const vercelToken = secrets.VERCEL_TOKEN;
  const projectId = secrets.VERCEL_PROJECT_ID;
  const teamId = secrets.VERCEL_TEAM_ID;

  if (!vercelToken || !projectId) {
    throw new Error('VERCEL_TOKEN or VERCEL_PROJECT_ID missing from secure vault.');
  }

  const targets = ['production', 'preview'];

  const desiredVars = [
    ['NEXT_PUBLIC_SUPABASE_URL', secrets.SUPABASE_URL],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', secrets.SUPABASE_ANON_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', secrets.SUPABASE_SERVICE_ROLE_KEY],
    ['SUPABASE_URL', secrets.SUPABASE_URL],
    ['DATABASE_URL', secrets.SUPABASE_DB_CONNECTION],
    ['DIRECT_URL', secrets.SUPABASE_DB_CONNECTION],
    ['JWT_SECRET', secrets.SUPABASE_JWT_SECRET],
    ['OPENAI_API_KEY', secrets.OPENAI_API_KEY]
  ].filter(([, value]) => value);

  const query = teamId ? `?teamId=${teamId}` : '';
  const baseUrl = `https://api.vercel.com/v10/projects/${projectId}/env${query}`;

  const existing = await fetchJson(baseUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${vercelToken}`
    }
  });

  const existingByKey = new Map(
    (existing.envs || []).map((env) => [env.key, env])
  );

  for (const [key, value] of desiredVars) {
    const masked = mask(value);
    const type = key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted';

    if (existingByKey.has(key)) {
      const envId = existingByKey.get(key).id;
      const url = `https://api.vercel.com/v10/projects/${projectId}/env/${envId}${query}`;
      console.log(`🔄 Updating ${key} → ${masked}`);
      await fetchJson(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value,
          target: targets
        })
      });
    } else {
      console.log(`➕ Creating ${key} → ${masked}`);
      await fetchJson(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          value,
          target: targets,
          type
        })
      });
    }
  }

  console.log(`✅ Synced ${desiredVars.length} environment variables to Vercel project ${projectId}.`);
}

main().catch((error) => {
  console.error('Sync failed:', error.message);
  process.exit(1);
});
