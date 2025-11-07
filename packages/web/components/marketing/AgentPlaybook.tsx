import { AgentProfile } from '@/lib/marketing/types'

interface Props {
  agents: AgentProfile[]
  guardrails: string[]
}

export function AgentPlaybook({ agents, guardrails }: Props) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6" id="agents">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">AI Agent Stack</p>
          <h3 className="text-2xl font-semibold text-white">Roles anchored to the GPT-5 marketing playbook</h3>
          <p className="text-sm text-white/60">
            Every agent honors the non-negotiables from <span className="text-white">MARKETING_AGENTS_TEAM_PLAYBOOK.md</span>.
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-xs text-white/60">
          Guardrails:
          <span className="ml-2 text-white">
            {guardrails.length ? guardrails.slice(0, 2).join(' · ') : 'Document missing non-negotiables'}
          </span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {agents.map((role) => (
          <article key={role.id} className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{role.status}</p>
                <h4 className="text-lg font-semibold text-white">{role.name}</h4>
                <p className="text-sm text-white/60">{role.mission}</p>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                {role.channel}
              </span>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-white/70">
              {(role.strengths ?? []).map((output) => (
                <li key={output} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1 w-1 rounded-full bg-holo-cyan" />
                  <span>{output}</span>
                </li>
              ))}
              {!role.strengths?.length && (
                <li className="text-white/50">Document outputs under the role inside the playbook to detail this agent.</li>
              )}
            </ul>
          </article>
        ))}
        {!agents.length && (
          <article className="rounded-3xl border border-white/10 bg-black/30 p-5 text-sm text-white/60">
            Add roles in MARKETING_AGENTS_TEAM_PLAYBOOK.md to populate the agent roster.
          </article>
        )}
      </div>
    </section>
  )
}
