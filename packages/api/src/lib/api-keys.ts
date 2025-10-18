import { supabase } from './supabase';
import logger from './logger';

const CACHE_TTL_MS = Number(process.env.API_KEY_CACHE_TTL_MS || 10 * 60 * 1000);

const cache = new Map<string, { value: string | null; expiresAt: number }>();

export async function getApiKey(name: string): Promise<string | null> {
  const now = Date.now();
  const cached = cache.get(name);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('key_name', name)
      .maybeSingle();

    if (error) {
      logger.warn({ err: error, key: name }, 'Failed to fetch API key from Supabase');
      cache.set(name, { value: null, expiresAt: now + CACHE_TTL_MS });
      return null;
    }

    const value = data?.key_value?.trim() || null;
    cache.set(name, { value, expiresAt: now + CACHE_TTL_MS });
    return value;
  } catch (error) {
    logger.warn({ err: error, key: name }, 'Exception while fetching API key');
    cache.set(name, { value: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }
}
