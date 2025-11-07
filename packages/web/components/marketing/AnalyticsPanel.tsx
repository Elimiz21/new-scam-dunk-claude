'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnalyticsSnapshot } from '@/lib/marketing/types'

interface Props {
  analytics?: AnalyticsSnapshot | null
}

export function AnalyticsPanel({ analytics }: Props) {
  if (!analytics) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60" id="analytics">
        Connect Supabase or your analytics warehouse to provide marketing velocity, channel ROI, and budget data. Populate the
        `marketing_analytics_velocity`, `marketing_channel_performance`, and `marketing_budget` tables to render this dashboard.
      </section>
    )
  }

  return (
    <section className="space-y-6" id="analytics">
      <header className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-white">Performance intelligence</h2>
        <p className="text-sm text-white/50">
          Unified analytics fused from Supabase events, GitHub velocity, and revenue projections.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Launch velocity</h3>
              <p className="text-xs text-white/50">Sprint throughput vs. new issues each week</p>
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
              Source · GitHub + Supabase
            </span>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.velocityTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                <YAxis stroke="rgba(255,255,255,0.4)" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.3)' }} />
                <Legend />
                <Line type="monotone" dataKey="velocity" stroke="#34d399" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="completed" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="newIssues" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Message coverage</h3>
            <p className="text-xs text-white/50">Share of voice per narrative pillar</p>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  data={analytics.coverage}
                  innerRadius="30%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background={{ fill: 'rgba(255,255,255,0.04)' }}
                    dataKey="value"
                    cornerRadius={18}
                    fill="#38bdf8"
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.3)' }} />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Channel ROI</h3>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.channelPerformance}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="channel" stroke="rgba(255,255,255,0.4)" hide />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.3)' }} />
                  <Bar dataKey="roi" fill="#34d399" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2 text-xs text-white/60">
              {analytics.channelPerformance.map((channel) => (
                <div key={channel.channel} className="flex items-center justify-between">
                  <span>{channel.channel}</span>
                  <span>{channel.roi.toFixed(1)}x ROI</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Investment alignment</h3>
            <p className="text-xs text-white/50">Budget allocation vs. actual utilisation</p>
          </div>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
            Finance sync ready
          </span>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.budget}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.3)' }} />
              <Legend />
              <Area type="monotone" dataKey="plan" stackId="1" stroke="#60a5fa" fill="#60a5fa3d" />
              <Area type="monotone" dataKey="actual" stackId="1" stroke="#34d399" fill="#34d39933" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
