'use client'

import { useMemo, useState } from 'react'
import type { DocumentItem, DocumentStatus, DocumentType } from '@/lib/marketing/types'

const typeFilters: { label: string; value: DocumentType | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Briefs', value: 'Brief' },
  { label: 'Strategies', value: 'Strategy' },
  { label: 'Guidelines', value: 'Guideline' },
  { label: 'Datasets', value: 'Dataset' },
  { label: 'Reports', value: 'Report' },
]

const statusPill: Record<DocumentStatus, string> = {
  Draft: 'border-amber-300/40 bg-amber-300/10 text-amber-200',
  Review: 'border-holo-cyan/30 bg-holo-cyan/10 text-cyan-200',
  Approved: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200',
}

interface Props {
  documents: DocumentItem[]
}

export function DocumentationPanel({ documents }: Props) {
  const [activeType, setActiveType] = useState<DocumentType | 'All'>('All')

  const filtered = useMemo(() => {
    if (activeType === 'All') return documents
    return documents.filter((doc) => doc.type === activeType)
  }, [activeType, documents])

  return (
    <section className="space-y-6" id="documents">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Documentation & knowledge base</h2>
          <p className="text-sm text-white/50">
            Every brief, playbook, and guideline centralised with ownership and status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/15 bg-white/[0.04] p-2">
          {typeFilters.map((option) => (
            <button
              key={option.label}
              onClick={() => setActiveType(option.value)}
              className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                activeType === option.value
                  ? 'bg-white/20 text-white shadow-[0_12px_30px_-20px_rgba(59,130,246,0.6)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((doc) => (
          <article
            key={doc.id}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            <div className="absolute -right-16 top-1/2 hidden h-28 w-28 -translate-y-1/2 rounded-full bg-gradient-to-r from-holo-cyan/40 to-transparent blur-3xl opacity-0 transition-opacity group-hover:opacity-100 md:block" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">{doc.type}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{doc.title}</h3>
                <p className="mt-2 text-sm text-white/60">{doc.summary}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusPill[doc.status]}`}>
                {doc.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/50">
              <span>Owner · {doc.owner}</span>
              <span>Updated · {doc.updatedAt}</span>
              {doc.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/15 px-3 py-1">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <a
                href={doc.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Open Document
              </a>
            </div>
          </article>
        ))}
        {!documents.length && (
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-sm text-white/60">
            No documents detected. Add markdown files to <span className="text-white">/gpt5 marketing docs</span> to populate this
            view automatically.
          </article>
        )}
      </div>
    </section>
  )
}
