'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AgentProfile } from '@/lib/marketing/types'
import { useToast } from '@/hooks/use-toast'

interface PromptState {
  [agentId: string]: string
}

interface Props {
  agents: AgentProfile[]
}

export function AgentPromptManager({ agents }: Props) {
  const { toast } = useToast()
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(agents[0] ?? null)
  const [prompts, setPrompts] = useState<PromptState>(() =>
    agents.reduce((acc, agent) => {
      acc[agent.id] = agent.prompt
      return acc
    }, {} as PromptState),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isOptimising, setIsOptimising] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setSelectedAgent((prev) => prev ?? agents[0] ?? null)
    setPrompts(
      agents.reduce((acc, agent) => {
        acc[agent.id] = agent.prompt
        return acc
      }, {} as PromptState),
    )
  }, [agents])

  const activePrompt = selectedAgent ? prompts[selectedAgent.id] : ''

  const agentsByStatus = useMemo(() => {
    return agents.reduce<Record<string, AgentProfile[]>>((acc, agent) => {
      acc[agent.status] = acc[agent.status] ? [...acc[agent.status], agent] : [agent]
      return acc
    }, {})
  }, [agents])

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        const response = await fetch('/api/marketing/prompts')
        if (!response.ok) return
        const payload = await response.json()
        const records = Array.isArray(payload?.data) ? payload.data : []

        if (!cancelled && records.length) {
          setPrompts((prev) => {
            const next = { ...prev }
            records.forEach((record: any) => {
              if (record?.agentId && record?.prompt) {
                next[record.agentId] = record.prompt
              }
            })
            return next
          })
        }
      } catch (error) {
        console.warn('[AgentPromptManager] Failed to fetch prompts', error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    if (!selectedAgent) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/marketing/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          prompt: prompts[selectedAgent.id],
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message ?? 'Unable to persist prompt')
      }

      toast({
        title: 'Prompt updated',
        description: `${selectedAgent.name} is ready with the latest guidance.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Offline mode: keep a local copy.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleOptimise = async () => {
    if (!selectedAgent) return
    setIsOptimising(true)
    try {
      const response = await fetch('/api/marketing/optimise-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          prompt: prompts[selectedAgent.id],
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message ?? 'Optimisation unavailable. Check OpenAI credentials.')
      }

      const payload = await response.json()
      if (payload?.prompt) {
        setPrompts((prev) => ({
          ...prev,
          [selectedAgent.id]: payload.prompt,
        }))
      }

      toast({
        title: 'Prompt refined',
        description: 'AI co-pilot polished your prompt for clarity and performance.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Optimisation failed',
        description: error instanceof Error ? error.message : 'Could not reach optimisation service.',
      })
    } finally {
      setIsOptimising(false)
    }
  }

  return (
    <section className="space-y-6" id="prompts">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">AI agent prompt governance</h2>
          <p className="text-sm text-white/50">
            Inspect, edit, and optimise every agent prompt with human oversight.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
          Real-time sync with Supabase once credentials are configured.
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          {(['active', 'calibrating', 'paused'] as AgentProfile['status'][]).map((status) => {
            const agents = agentsByStatus[status]
            if (!agents?.length) return null
            return (
              <div key={status} className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  {status === 'active' ? 'Active' : status === 'calibrating' ? 'Calibrating' : 'Paused'}
                </p>
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedAgent?.id === agent.id
                          ? 'border-white/40 bg-white/15 text-white shadow-[0_20px_50px_-30px_rgba(59,130,246,0.6)]'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      <p className="text-sm font-semibold">{agent.name}</p>
                      <p className="text-xs text-white/60">{agent.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </aside>

        {selectedAgent ? (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">{selectedAgent.model}</p>
            <h3 className="text-xl font-semibold text-white">{selectedAgent.name}</h3>
            <p className="text-sm text-white/60">{selectedAgent.mission}</p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span>Tone · {selectedAgent.tone ?? 'Not set'}</span>
              <span>Channel · {selectedAgent.channel}</span>
              <span>Last updated · {selectedAgent.lastUpdated}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              {(selectedAgent.strengths ?? []).map((strength) => (
                <span key={strength} className="rounded-full border border-white/15 px-3 py-1">
                  {strength}
                </span>
              ))}
            </div>
          </div>

          <textarea
            value={activePrompt}
            onChange={(event) =>
              setPrompts((prev) => ({
                ...prev,
                [selectedAgent.id]: event.target.value,
              }))
            }
            className="min-h-[220px] w-full rounded-2xl border border-white/15 bg-black/30 p-4 text-sm text-white/80 outline-none transition focus:border-white/40 focus:ring-0"
            placeholder={isLoading ? 'Loading prompt…' : 'Enter updated instructions for this agent'}
            disabled={isLoading}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/50">
              Linked Knowledge · {(selectedAgent.linkedDocs ?? ['Not set']).join(', ')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOptimise}
                disabled={isOptimising}
                className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isOptimising ? 'Optimising…' : 'Optimise with AI'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="holo-button px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? 'Saving…' : 'Save prompt'}
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            No agents detected. Update MARKETING_AGENTS_TEAM_PLAYBOOK.md or seed Supabase to manage prompts.
          </div>
        )}
      </div>
    </section>
  )
}
