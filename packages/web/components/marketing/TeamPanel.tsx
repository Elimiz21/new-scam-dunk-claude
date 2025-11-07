import { TeamMember } from '@/lib/marketing/types'

const availabilityCopy: Record<string, string> = {
  available: 'text-emerald-300 bg-emerald-300/10 border-emerald-300/40',
  partial: 'text-amber-200 bg-amber-200/10 border-amber-300/40',
  ooo: 'text-rose-200 bg-rose-200/10 border-rose-300/40',
  unspecified: 'text-white/70 border-white/20 bg-white/5',
}

interface Props {
  team: TeamMember[]
}

export function TeamPanel({ team }: Props) {
  return (
    <section className="space-y-6" id="team">
      <header>
        <h2 className="text-2xl font-semibold text-white">Elite delivery team</h2>
        <p className="text-sm text-white/50">
          Principal-level leadership across strategy, creative, data, and trust &amp; safety.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {team.map((member) => (
          <article
            key={member.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-white/60">{member.role}</p>
                <p className="mt-3 text-xs text-white/50">{member.focus}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  availabilityCopy[member.availability] ?? availabilityCopy.unspecified
                }`}
              >
                {member.availability === 'available'
                  ? 'Available'
                  : member.availability === 'partial'
                    ? 'Partial'
                    : member.availability === 'ooo'
                      ? 'OOO'
                      : 'TBD'}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
              <span>Timezone · {member.timezone}</span>
              <span>Seniority · {member.seniority}</span>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Skills</p>
              <div className="flex flex-wrap gap-2">
                {member.skills.length ? (
                  member.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-white/50">Document skills for this role in the playbook.</span>
                )}
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Active assignments</p>
              <div className="space-y-2">
                {member.assignments.length ? (
                  member.assignments.map((assignment) => (
                    <div
                      key={`${member.id}-${assignment.initiative}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                    >
                      <p className="font-medium text-white/80">{assignment.initiative}</p>
                      <p className="text-white/60">{assignment.focus}</p>
                      <p className="text-white/50">Status · {assignment.status.replace('-', ' ')}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                    Assign initiatives via Supabase (`marketing_team_assignments`) or update the playbook to detail ownership.
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
        {!team.length && (
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Team roster mirrors the AI Agents Playbook. Add roles to MARKETING_AGENTS_TEAM_PLAYBOOK.md or seed Supabase to show
            collaborators.
          </article>
        )}
      </div>
    </section>
  )
}
