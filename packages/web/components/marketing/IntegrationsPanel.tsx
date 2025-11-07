'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { IntegrationConfig } from '@/lib/marketing/types'

interface IntegrationFormState {
  githubRepo: string
  githubToken: string
  supabaseUrl: string
  supabaseServiceKey: string
  vercelProjectId: string
  vercelToken: string
}

const initialState: IntegrationFormState = {
  githubRepo: '',
  githubToken: '',
  supabaseUrl: '',
  supabaseServiceKey: '',
  vercelProjectId: '',
  vercelToken: '',
}

export function IntegrationsPanel() {
  const [formState, setFormState] = useState<IntegrationFormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false

    async function fetchIntegrations() {
      try {
        const response = await fetch('/api/marketing/integrations')
        if (!response.ok) return
        const payload = await response.json()
        if (!cancelled && Array.isArray(payload?.integrations)) {
          setIntegrations(payload.integrations)
        }
      } catch (error) {
        console.warn('[IntegrationsPanel] Failed to load integrations', error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchIntegrations()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/marketing/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message ?? 'Unable to update integrations')
      }

      toast({
        title: 'Integrations updated',
        description: 'Credentials stored securely in Supabase.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Integration update failed',
        description: error instanceof Error ? error.message : 'Please verify credentials and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6" id="integrations">
      <header>
        <h2 className="text-2xl font-semibold text-white">Integrations & automation</h2>
        <p className="text-sm text-white/50">
          Connect GitHub, Supabase, and Vercel so plans, prompts, and deployments stay in lock-step.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {integrations.map((integration) => (
          <article
            key={integration.provider}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white capitalize">{integration.provider}</h3>
                <p className="mt-1 text-sm text-white/60">{integration.description}</p>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
                {integration.status === 'connected' ? 'Connected' : integration.status === 'pending' ? 'Pending' : 'Missing'}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {(integration.actions ?? []).map((action: string) => (
                <p key={action} className="text-xs text-white/45">
                  • {action}
                </p>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-white/40">
              <span>{integration.lastSynced ?? 'Awaiting sync'}</span>
              {integration.url && (
                <a
                  href={integration.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/60 underline-offset-4 hover:text-white hover:underline"
                >
                  Docs
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Secure credential vault</h3>
        <p className="mt-1 text-xs text-white/50">
          Values are encrypted by Supabase. Non-production usage recommended while testing.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-white/70">
            GitHub repository (owner/name)
            <input
              type="text"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none transition focus:border-white/40"
              value={formState.githubRepo}
              onChange={(event) => setFormState((prev) => ({ ...prev, githubRepo: event.target.value }))}
              placeholder="scam-dunk/marketing-ops"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            GitHub personal access token
            <input
              type="password"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none transition focus:border-white/40"
              value={formState.githubToken}
              onChange={(event) => setFormState((prev) => ({ ...prev, githubToken: event.target.value }))}
              placeholder="ghp_••••••••••"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            Supabase project URL
            <input
              type="text"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none transition focus:border-white/40"
              value={formState.supabaseUrl}
              onChange={(event) => setFormState((prev) => ({ ...prev, supabaseUrl: event.target.value }))}
              placeholder="https://abc123.supabase.co"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            Supabase service role key
            <input
              type="password"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none transition focus:border-white/40"
              value={formState.supabaseServiceKey}
              onChange={(event) => setFormState((prev) => ({ ...prev, supabaseServiceKey: event.target.value }))}
              placeholder="service_role_••••••"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            Vercel project ID
            <input
              type="text"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none transition focus:border-white/40"
              value={formState.vercelProjectId}
              onChange={(event) => setFormState((prev) => ({ ...prev, vercelProjectId: event.target.value }))}
              placeholder="prj_••••••••"
            />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            Vercel API token
            <input
              type="password"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none transition focus:border-white/40"
              value={formState.vercelToken}
              onChange={(event) => setFormState((prev) => ({ ...prev, vercelToken: event.target.value }))}
              placeholder="vercel_••••••"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="holo-button px-6 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Encrypting…' : isLoading ? 'Save & refresh' : 'Save credentials'}
          </button>
        </div>
      </div>
    </section>
  )
}
