#!/usr/bin/env node

/**
 * Minimal live QA check for Scam Dunk API.
 * - Verifies /health responds 200
 * - Confirms Supabase connection using service role key
 */

import { createClient } from '@supabase/supabase-js';
import process from 'process';

const apiBase =
  process.env.API_BASE_URL ||
  `http://localhost:${process.env.PORT || 3001}`;

async function assertHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  let response;
  try {
    response = await fetch(`${apiBase}/health`, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new Error(`/health failed with status ${response.status}`);
  }
  const body = await response.json();
  if (body.status !== 'OK') {
    throw new Error(`/health responded with unexpected payload: ${JSON.stringify(body)}`);
  }
  console.log('✅ /health endpoint OK');
}

async function assertSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing; skipping Supabase connectivity check.');
    return;
  }

  const client = createClient(supabaseUrl, serviceKey);
  const { error } = await client
    .from('users')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  if (error) {
    throw new Error(`Supabase connectivity failed: ${error.message}`);
  }

  console.log('✅ Supabase access verified via service role key');
}

async function main() {
  console.log(`🔍 Running QA live check against ${apiBase}`);
  await assertHealth();
  await assertSupabase();
  console.log('🎉 QA live check passed.');
}

main().catch((err) => {
  console.error('❌ QA live check failed:', err.message);
  process.exit(1);
});
