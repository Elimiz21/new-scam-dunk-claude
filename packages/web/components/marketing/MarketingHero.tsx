'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function MarketingHero() {
  const [connectedIntegrations, setConnectedIntegrations] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchIntegrations() {
      try {
        const response = await fetch('/api/marketing/integrations')
        if (!response.ok) return
        const payload = await response.json()
        if (!cancelled && Array.isArray(payload?.integrations)) {
          const connected = payload.integrations.filter(
            (integration: { status?: string }) => integration.status === 'connected',
          ).length
          setConnectedIntegrations(connected)
        }
      } catch (error) {
        console.warn('[MarketingHero] Failed to hydrate integrations', error)
      }
    }

    fetchIntegrations()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-10 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.6)] backdrop-blur-xl">
      <div className="absolute -left-28 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full bg-gradient-to-r from-holo-cyan/40 via-holo-green/30 to-holo-amber/30 blur-3xl md:block" />
      <div className="absolute -right-24 -top-20 hidden h-56 w-56 rounded-full bg-gradient-to-br from-white/30 to-transparent blur-3xl md:block" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
            Marketing Command Center · Live
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
            Orchestrate the entire Scam&nbsp;Dunk launch with a single, Apple-grade control surface.
          </h1>
          <p className="text-lg text-white/70">
            Coordinate AI agents, briefs, analytics, and launch readiness with a workspace engineered for focus.
            Designed to feel calm, premium, and precise—so your team can ship with confidence.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#timeline" className="holo-button px-6 py-3 text-base">
              Review Launch Timeline
            </Link>
            <Link
              href="#integrations"
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              Connect Integrations
            </Link>
            {process.env.NEXT_PUBLIC_APP_MODE === 'marketing' && (
              <Link
                href={process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://scam-dunk-production.vercel.app'}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                → Main App
              </Link>
            )}
          </div>
        </div>

        <div className="relative grid max-w-sm gap-4">
          <div className="glass-card space-y-4 rounded-2xl px-6 py-5">
            <p className="text-sm font-medium text-white/60">Today&apos;s Focus</p>
            <h3 className="text-2xl font-semibold text-white">Provable launch confidence</h3>
            <p className="text-sm text-white/70">
              Tie briefs, builds, and agents to measurable outcomes. See what&apos;s ready, what&apos;s at risk,
              and which collaborator is on point.
            </p>
          </div>
          <div className="glass-card flex items-center justify-between rounded-2xl px-6 py-5">
            <div>
              <p className="text-sm font-medium text-white/60">Integrations Online</p>
              <p className="text-2xl font-semibold text-white">{connectedIntegrations}/3</p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
              GitHub · Supabase · Vercel
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
