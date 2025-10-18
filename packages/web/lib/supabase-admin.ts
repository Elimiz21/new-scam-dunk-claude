import { createClient } from '@supabase/supabase-js'

function resolveSupabaseUrl() {
  const explicitUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!explicitUrl) {
    console.error('[supabase-admin] Missing SUPABASE_URL environment variable')
    return null
  }

  if (explicitUrl.startsWith('postgresql://')) {
    console.warn('[supabase-admin] PostgreSQL connection string detected; attempting to derive REST URL')
    const match = explicitUrl.match(/db\.([a-z0-9]+)\.supabase\.co/i)
    if (match?.[1]) {
      return `https://${match[1]}.supabase.co`
    }

    console.error('[supabase-admin] Unable to derive REST URL from PostgreSQL string')
    return null
  }

  return explicitUrl
}

export function getSupabaseClient() {
  const supabaseUrl = resolveSupabaseUrl()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[supabase-admin] Missing Supabase URL or service role key; admin client unavailable')
    return null
  }

  const cleanedKey = serviceRoleKey.replace(/[\s\n\r]+/g, '').trim()

  try {
    return createClient(supabaseUrl, cleanedKey, {
      auth: { persistSession: false },
    })
  } catch (error) {
    console.error('[supabase-admin] Failed to instantiate client:', error)
    return null
  }
}
