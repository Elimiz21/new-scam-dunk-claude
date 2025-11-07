import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-admin'

interface Payload {
  githubRepo?: string
  githubToken?: string
  supabaseUrl?: string
  supabaseServiceKey?: string
  vercelProjectId?: string
  vercelToken?: string
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        integrations: [],
        source: 'local',
        message: 'Supabase credentials missing. Provide env vars to enable live integration tracking.',
      })
    }

    const { data, error } = await supabase
      .from('marketing_integrations')
      .select('provider, status, description, actions, url, last_synced')

    if (error) {
      console.error('[integrations] Supabase select error', error)
      if (error.code === '42P01') {
        return NextResponse.json({
          message: 'Create table marketing_integrations to track connector state.',
          hint: `CREATE TABLE marketing_integrations (
  provider text PRIMARY KEY,
  status text NOT NULL,
  description text,
  actions text[],
  url text,
  last_synced timestamptz
);`,
          integrations: [],
        }, { status: 200 })
      }
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    if (!data?.length) {
      return NextResponse.json({
        integrations: [],
        source: 'fallback',
        message: 'No integration rows found. Insert data into marketing_integrations to track connection state.',
      })
    }

    return NextResponse.json({
      integrations: data.map((row) => ({
        provider: row.provider,
        status: row.status ?? 'pending',
        description: row.description ?? '',
        actions: row.actions ?? [],
        url: row.url ?? undefined,
        lastSynced: row.last_synced ?? undefined,
      })),
      source: 'supabase',
    })
  } catch (error) {
    console.error('[integrations] Unexpected error', error)
    return NextResponse.json({ message: 'Failed to load integrations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload: Payload = await request.json()
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json({
        message: 'Supabase credentials missing. Store secrets locally until configured.',
      })
    }

    const records = [
      payload.githubRepo || payload.githubToken
        ? {
            provider: 'github',
            data: {
              repo: payload.githubRepo,
              token: payload.githubToken ? Buffer.from(payload.githubToken).toString('base64') : undefined,
            },
          }
        : null,
      payload.supabaseUrl || payload.supabaseServiceKey
        ? {
            provider: 'supabase',
            data: {
              url: payload.supabaseUrl,
              serviceKey: payload.supabaseServiceKey
                ? Buffer.from(payload.supabaseServiceKey).toString('base64')
                : undefined,
            },
          }
        : null,
      payload.vercelProjectId || payload.vercelToken
        ? {
            provider: 'vercel',
            data: {
              projectId: payload.vercelProjectId,
              token: payload.vercelToken ? Buffer.from(payload.vercelToken).toString('base64') : undefined,
            },
          }
        : null,
    ].filter(Boolean) as { provider: string; data: Record<string, string | undefined> }[]

    if (!records.length) {
      return NextResponse.json({ message: 'No integration credentials provided.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('marketing_integration_credentials')
      .upsert(
        records.map((record) => ({
          provider: record.provider,
          payload: record.data,
        })),
        { onConflict: 'provider', ignoreDuplicates: false },
      )

    if (error) {
      console.error('[integrations] Supabase upsert error', error)
      if (error.code === '42P01') {
        return NextResponse.json({
          message: 'Create table marketing_integration_credentials to store secrets securely.',
          sql: `CREATE TABLE marketing_integration_credentials (
  provider text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);`,
        }, { status: 400 })
      }
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    const now = new Date().toISOString()
    const { error: statusError } = await supabase
      .from('marketing_integrations')
      .upsert(
        records.map((record) => ({
          provider: record.provider,
          status: 'connected',
          last_synced: now,
        })),
        { onConflict: 'provider', ignoreDuplicates: false },
      )

    if (statusError && statusError.code !== '42P01') {
      console.error('[integrations] status upsert error', statusError)
    }

    return NextResponse.json({ message: 'Integrations updated.' })
  } catch (error) {
    console.error('[integrations] Unexpected error', error)
    return NextResponse.json({ message: 'Failed to update integrations' }, { status: 500 })
  }
}
