#!/usr/bin/env node

/**
 * Removes legacy `perf-*` seed data from Supabase.
 * Intended to run in CI before integration/load tests.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials. Export SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function deleteInBatches(table, column, values) {
  let total = 0;
  for (const batch of chunk(values, 200)) {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .in(column, batch);

    if (error) {
      throw new Error(`Failed to delete from ${table}: ${error.message}`);
    }
    total += count ?? 0;
  }
  return total;
}

async function main() {
  console.log('🔍 Fetching legacy perf-* users…');
  const { data: users, error } = await supabase
    .from('users')
    .select('id,email')
    .ilike('email', 'perf-%');

  if (error) {
    throw new Error(`Failed to query users: ${error.message}`);
  }

  if (!users?.length) {
    console.log('✅ No perf-* users found. Nothing to clean.');
    return;
  }

  const userIds = users.map((user) => user.id);
  console.log(`🧹 Found ${users.length} perf-* users. Purging related artifacts…`);

  const contactDeleted = await deleteInBatches('contact_verifications', 'user_id', userIds);
  console.log(`   • Deleted ${contactDeleted} contact verification rows`);

  const scansDeleted = await deleteInBatches('scans', 'user_id', userIds);
  console.log(`   • Deleted ${scansDeleted} scan rows`);

  const userDeleted = await deleteInBatches('users', 'id', userIds);
  console.log(`   • Deleted ${userDeleted} user rows`);

  const { error: apiKeyError, count: apiKeyCount } = await supabase
    .from('api_keys')
    .delete({ count: 'exact' })
    .like('key_name', 'perf-%');

  if (apiKeyError) {
    throw new Error(`Failed to delete perf-* api_keys: ${apiKeyError.message}`);
  }

  console.log(`   • Deleted ${apiKeyCount ?? 0} api_key rows`);
  console.log('✅ perf-* cleanup complete.');
}

main().catch((err) => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
