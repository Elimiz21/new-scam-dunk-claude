import type { TaskRisk, WorkflowLane } from '@/lib/marketing/types'

const riskClass: Record<TaskRisk | 'unknown', string> = {
  low: 'text-emerald-300 bg-emerald-300/10 border-emerald-300/40',
  medium: 'text-amber-300 bg-amber-300/10 border-amber-300/40',
  high: 'text-rose-300 bg-rose-300/10 border-rose-300/40',
  unknown: 'text-white/70 border-white/20',
}

interface Props {
  lanes: WorkflowLane[]
}

export function WorkflowBoard({ lanes }: Props) {
  return (
    <section className="space-y-6" id="workflow">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Workflow orchestration</h2>
        <a
          href="#timeline"
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
        >
          Jump to timeline
        </a>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="flex flex-col gap-4 rounded-3xl border border-white/12 bg-white/[0.05] p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.65)]"
          >
            <header className="space-y-1">
              <p className="text-sm text-white/50">{lane.title}</p>
              <p className="text-xs text-white/40">{lane.description}</p>
            </header>
            <div className="flex-1 space-y-3">
              {lane.tasks.map((task) => (
                <article key={task.id} className="glass-card space-y-3 rounded-2xl px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{task.title}</p>
                      <p className="text-xs text-white/50">
                        {task.owner ? `Owner · ${task.owner}` : 'Owner TBD'}
                      </p>
                    </div>
                    {task.risk && (
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${riskClass[task.risk]}`}>
                        {task.risk === 'low' ? 'On track' : task.risk === 'medium' ? 'Watch' : 'Blocker'}
                      </span>
                    )}
                  </div>
                  {task.summary && <p className="text-xs text-white/60">{task.summary}</p>}
                  {(task.dueDate || task.effort) && (
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{task.dueDate ? `Due ${task.dueDate}` : 'Due date TBD'}</span>
                      <span>{task.effort ? `Effort · ${task.effort}` : 'Effort TBD'}</span>
                    </div>
                  )}
                  {typeof task.progress === 'number' && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-holo-cyan to-holo-green transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                  {task.tags && (
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {task.docRef && (
                    <a
                      href={`https://github.com/Elimiz21/new-scam-dunk-claude/blob/main/${encodeURIComponent(
                        'gpt5 marketing docs',
                      )}/${task.docRef}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-holo-cyan underline-offset-4 hover:underline"
                    >
                      View source doc
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        ))}
        {!lanes.length && (
          <div className="rounded-3xl border border-white/12 bg-white/[0.05] p-4 text-sm text-white/60">
            Workflow tasks mirror the execution timeline. Populate `MARKETING_EXECUTION_PLAN.md` or create structured entries in
            Supabase to activate this board.
          </div>
        )}
      </div>
    </section>
  )
}
