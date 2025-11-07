import { TimelinePhase } from '@/lib/marketing/types'

interface Props {
  phases: TimelinePhase[]
}

export function ExecutionTimeline({ phases }: Props) {
  return (
    <section className="space-y-6" id="timeline">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Execution Plan</p>
        <h2 className="text-2xl font-semibold text-white">Zero/lean-budget launch timeline</h2>
        <p className="text-sm text-white/60">
          Derived from <span className="text-white">MARKETING_EXECUTION_PLAN.md</span> · each phase includes checklist-ready deliverables and
          handoff cues for Atlas, Lyric, Pulse, Nova, Relay, and the extended AI agent team.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {phases.map((phase) => (
          <article key={phase.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{phase.doc}</p>
                <h3 className="text-xl font-semibold text-white">{phase.title}</h3>
                <p className="text-sm text-white/60">{phase.focus}</p>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
                {phase.checklist.length} items
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {phase.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-holo-amber" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
        {!phases.length && (
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Add `### Week …` sections to MARKETING_EXECUTION_PLAN.md to populate the live launch timeline.
          </article>
        )}
      </div>
    </section>
  )
}
