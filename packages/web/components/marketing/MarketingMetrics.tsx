import { MarketingMetric } from '@/lib/marketing/types'

const trendCopy: Record<string, string> = {
  up: 'text-emerald-300',
  down: 'text-rose-300',
  flat: 'text-white/60',
}

interface Props {
  metrics: MarketingMetric[]
}

export function MarketingMetrics({ metrics }: Props) {
  if (!metrics.length) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        No marketing metrics detected yet. Populate `/gpt5 marketing docs/MARKETING_EXECUTIVE_SUMMARY.md` or write to the
        `marketing_metrics` table in Supabase to light up this panel.
      </section>
    )
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06] p-6 shadow-[0_20px_50px_-30px_rgba(13,20,33,0.6)] transition hover:border-white/30 hover:bg-white/[0.10]"
        >
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-holo-cyan/40 via-transparent to-transparent blur-2xl" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
          {metric.change && (
            <p className={`mt-1 text-sm font-medium ${metric.trend ? trendCopy[metric.trend] : 'text-white/60'}`}>
              {metric.change}
            </p>
          )}
          {metric.description && (
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              {metric.description}
            </p>
          )}
        </div>
      ))}
    </section>
  )
}
