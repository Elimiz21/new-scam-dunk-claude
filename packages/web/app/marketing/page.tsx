import { Metadata } from 'next'
import { MarketingDashboard } from '@/components/marketing/MarketingDashboard'
import { getMarketingState } from '@/lib/marketing/get-state'
import { MarketingGate } from '@/components/marketing/MarketingGate'

export const metadata: Metadata = {
  title: 'Marketing Operations Command Center',
  description: 'Manage Scam Dunk marketing implementation plans, AI agents, and analytics in one Apple-grade hub.',
}

export default async function MarketingOpsPage() {
  const state = await getMarketingState()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-16 pt-10 md:px-10">
      <MarketingGate>
        <MarketingDashboard state={state} />
      </MarketingGate>
    </div>
  )
}
