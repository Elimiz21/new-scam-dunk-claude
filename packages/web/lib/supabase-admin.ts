import { createClient } from '@supabase/supabase-js';

type ClientRole = 'service' | 'anon';

function coerceSupabaseUrl(rawUrl: string | undefined) {
  if (!rawUrl) return undefined;

  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  if (!trimmed.startsWith('postgresql://')) {
    return trimmed;
  }

  const match = trimmed.match(/db\.([a-z0-9]+)\.supabase\.co/i);
  if (match?.[1]) {
    console.warn('Detected Postgres connection string; derived Supabase REST URL automatically.');
    return `https://${match[1]}.supabase.co`;
  }

  console.error('Unable to derive Supabase REST URL from Postgres connection string.');
  return undefined;
}

function pickKey(role: ClientRole) {
  const candidates =
    role === 'service'
      ? [process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY]
      : [process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY];

  for (const candidate of candidates) {
    if (candidate?.trim()) {
      return candidate.replace(/[\s\n\r]+/g, '').trim();
    }
  }

  return undefined;
}

export function getSupabaseClient(role: ClientRole = 'service') {
  const supabaseUrl = coerceSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = pickKey(role);

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing. Ensure environment variables are set via Vercel secrets.');
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to instantiate Supabase client:', error);
    return null;
  }
}
