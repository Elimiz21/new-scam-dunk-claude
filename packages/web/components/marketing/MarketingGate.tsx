'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Props {
  children: React.ReactNode
}

export function MarketingGate({ children }: Props) {
  const { isAuthenticated, initialized, initializeAuth } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initializeAuth()
    }
  }, [initialized, initializeAuth])

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
        <p className="text-lg font-semibold text-white">Log in to access the Marketing Operations Command Center</p>
        <p className="mt-2 text-sm text-white/60">
          This workspace contains launch plans, AI agent prompts, and integrations reserved for authenticated collaborators.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="holo-button px-6 py-3">
            Log in
          </Link>
          <Link href="/register" className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white/80 hover:border-white/35">
            Request access
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
