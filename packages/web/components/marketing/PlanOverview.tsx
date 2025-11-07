import { ObjectiveItem, PlanHighlight } from '@/lib/marketing/types'

const DOC_FILE_LABELS = {
  executive: 'MARKETING_EXECUTIVE_SUMMARY.md',
}

interface Props {
  highlights: PlanHighlight[]
  objectives: ObjectiveItem[]
  guardrails: string[]
}

export function PlanOverview({ highlights, objectives, guardrails }: Props) {
  return (
    <section className="space-y-8" id="overview">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">Strategic Spine</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Built for the GPT‑5 marketing mandate</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Every surface references the GPT‑5 marketing dossier—executive summary, strategy, execution plan, and
            AI agents playbook—to keep the experience honest to the Scam Dunk launch.
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs text-white/60">
          Source folder · <span className="text-white">gpt5 marketing docs/</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_15px_40px_-25px_rgba(15,23,42,0.8)]"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">{item.doc}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm text-white/70">{item.summary}</p>
          </article>
        ))}
        {!highlights.length && (
          <article className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Add bullet points to <span className="text-white">{DOC_FILE_LABELS.executive}</span> using the format
            `- **Label**: detail` and they will appear here automatically.
          </article>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Objectives · next 90–180 days</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {objectives.map((objective) => (
            <article key={objective.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">{objective.doc}</p>
              <h4 className="mt-1 text-lg font-semibold text-white">{objective.label}</h4>
              <p className="text-sm text-white/70">{objective.detail}</p>
            </article>
          ))}
          {!objectives.length && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
              Add bullets under the <span className="text-white">Objectives</span> heading in the marketing strategy doc to
              populate this grid.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white">Guardrails & KPIs</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Compliance Non-Negotiables</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {guardrails.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-holo-green" />
                  <span>{rule}</span>
                </li>
              ))}
              {!guardrails.length && (
                <li className="text-white/50">
                  Populate the non-negotiables list inside the agent playbook doc to render guardrails here.
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 lg:col-span-2 text-sm text-white/60">
            Track KPIs inside Supabase table `marketing_metrics` or GA4 dashboards. Values shown above sync directly from the
            executive summary document until structured data is provided.
          </div>
        </div>
      </div>
    </section>
  )
}
