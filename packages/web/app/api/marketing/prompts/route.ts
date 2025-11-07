import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-admin'
import { getMarketingState } from '@/lib/marketing/get-state'

export async function GET() {
  try {
    const state = await getMarketingState()
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        data: state.agents.map((agent) => ({
          agentId: agent.id,
          prompt: agent.prompt,
          updatedAt: agent.lastUpdated,
          persisted: false,
        })),
        source: 'mock',
      })
    }

    const { data, error } = await supabase
      .from('marketing_agent_prompts')
      .select('agent_id, prompt, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[prompts] Supabase select error', error)
      if (error.code === '42P01') {
        return NextResponse.json({
          message: 'Create table marketing_agent_prompts before persisting prompts.',
          hint: `CREATE TABLE marketing_agent_prompts (
  agent_id text PRIMARY KEY,
  prompt text NOT NULL,
  updated_at timestamptz DEFAULT now()
);`,
          data: state.agents.map((agent) => ({
            agentId: agent.id,
            prompt: agent.prompt,
            updatedAt: agent.lastUpdated,
            persisted: false,
          })),
        }, { status: 200 })
      }
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    if (!data?.length) {
      return NextResponse.json({
        data: state.agents.map((agent) => ({
          agentId: agent.id,
          prompt: agent.prompt,
          updatedAt: agent.lastUpdated,
          persisted: false,
        })),
        source: 'fallback',
      })
    }

    return NextResponse.json({
      data: data.map((row) => ({
        agentId: row.agent_id,
        prompt: row.prompt,
        updatedAt: row.updated_at,
        persisted: true,
      })),
      source: 'supabase',
    })
  } catch (error) {
    console.error('[prompts] Unexpected error', error)
    return NextResponse.json({ message: 'Failed to fetch prompts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { agentId, prompt } = body ?? {}

    if (!agentId || !prompt) {
      return NextResponse.json({ message: 'agentId and prompt are required.' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        message: 'Supabase credentials missing. Prompt kept client-side only.',
        persisted: false,
      })
    }

    const { error } = await supabase
      .from('marketing_agent_prompts')
      .upsert({
        agent_id: agentId,
        prompt,
      }, { onConflict: 'agent_id', ignoreDuplicates: false })

    if (error) {
      console.error('[prompts] Supabase upsert error', error)
      if (error.code === '42P01') {
        return NextResponse.json({
          message: 'Create table marketing_agent_prompts to enable persistence.',
          sql: `CREATE TABLE marketing_agent_prompts (
  agent_id text PRIMARY KEY,
  prompt text NOT NULL,
  updated_at timestamptz DEFAULT now()
);`,
        }, { status: 400 })
      }
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Prompt stored successfully.',
      persisted: true,
    })
  } catch (error) {
    console.error('[prompts] Unexpected error', error)
    return NextResponse.json({ message: 'Failed to store prompt' }, { status: 500 })
  }
}
