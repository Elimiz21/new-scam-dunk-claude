import fs from 'fs/promises'
import path from 'path'
import { cache } from 'react'
import {
  AgentProfile,
  DocumentItem,
  MarketingMetric,
  MarketingState,
  ObjectiveItem,
  PlanHighlight,
  TeamMember,
  TimelinePhase,
  WorkflowLane,
  WorkflowTask,
} from './types'

const DOCS_DIR = path.join(process.cwd(), 'gpt5 marketing docs')
const DOC_FILES = {
  executive: 'MARKETING_EXECUTIVE_SUMMARY.md',
  strategy: 'MARKETING_STRATEGY.md',
  execution: 'MARKETING_EXECUTION_PLAN.md',
  playbook: 'MARKETING_AGENTS_TEAM_PLAYBOOK.md',
  specs: 'MARKETING_SPECS.md',
}

async function readDoc(file: string) {
  try {
    const fullPath = path.join(DOCS_DIR, file)
    return await fs.readFile(fullPath, 'utf8')
  } catch (error) {
    console.warn(`[marketing-state] Unable to read ${file}:`, error)
    return ''
  }
}

const stripMarkdown = (text: string) =>
  text.replace(/\*\*/g, '').replace(/`/g, '').replace(/\[(.*?)\]\((.*?)\)/g, '$1').trim()

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function extractSection(content: string, heading: string) {
  const headingIndex = content.indexOf(heading)
  if (headingIndex === -1) return ''
  const afterHeading = content.slice(headingIndex + heading.length)
  const nextHeadingIndex = afterHeading.search(/\n#{2,3}\s/)
  if (nextHeadingIndex === -1) {
    return afterHeading
  }
  return afterHeading.slice(0, nextHeadingIndex)
}

function parseExecutiveHighlights(content: string): PlanHighlight[] {
  const regex = /^-\s+\*\*(.+?)\*\*:? (.+)$/gm
  const highlights: PlanHighlight[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    highlights.push({
      id: slugify(match[1]),
      title: stripMarkdown(match[1]),
      summary: stripMarkdown(match[2]),
      doc: DOC_FILES.executive,
    })
  }
  return highlights
}

function parseObjectives(content: string): ObjectiveItem[] {
  const section = extractSection(content, '### Objectives')
  const lines = section.split('\n').map((line) => line.trim())
  const objectives: ObjectiveItem[] = []
  lines.forEach((line) => {
    if (line.startsWith('- ')) {
      const cleaned = line.replace(/^- /, '')
      const [label, ...rest] = cleaned.split(':')
      if (label && rest.length) {
        objectives.push({
          id: slugify(label),
          label: stripMarkdown(label),
          detail: stripMarkdown(rest.join(':').trim()),
          doc: DOC_FILES.strategy,
        })
      }
    }
  })
  return objectives
}

function parseGuardrails(content: string): string[] {
  const section = extractSection(content, '## 0) Non-Negotiables')
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => stripMarkdown(line.replace(/^- /, '')))
}

function parseTimeline(content: string): TimelinePhase[] {
  const phaseRegex = /### (Week[\s\S]*?)(?=###|\Z)/g
  const phases: TimelinePhase[] = []
  let match
  while ((match = phaseRegex.exec(content)) !== null) {
    const [titleLine, ...rest] = match[1].split('\n')
    if (!titleLine) continue
    const [titlePart, ...focusParts] = titleLine.split(' - ')
    const colonSplit = titlePart.split(':')
    const title =
      colonSplit.length > 1
        ? `${colonSplit[0].trim()}`
        : stripMarkdown(titleLine)
    const focus =
      focusParts.join(' - ').trim() ||
      colonSplit.slice(1).join(':').trim() ||
      'Execution focus'
    const checklist = rest
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => stripMarkdown(line.replace(/^- /, '')))
    phases.push({
      id: slugify(titleLine),
      title: stripMarkdown(title),
      focus,
      doc: DOC_FILES.execution,
      checklist,
    })
  }
  return phases
}

async function parseDocuments(): Promise<DocumentItem[]> {
  try {
    const files = await fs.readdir(DOCS_DIR)
    const documents: DocumentItem[] = []
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const content = await readDoc(file)
      const titleMatch = content.match(/^#\s+(.*)$/m)
      const summaryMatch = content.match(/^[^-#>\n].+$/m)
      documents.push({
        id: slugify(file),
        title: stripMarkdown(titleMatch?.[1] ?? file.replace('.md', '')),
        owner: 'Scam Dunk Marketing',
        type: file.includes('PLAYBOOK')
          ? 'Playbook'
          : file.includes('STRATEGY')
            ? 'Strategy'
            : 'Guideline',
        status: 'Approved',
        updatedAt: new Date().toISOString().split('T')[0],
        link: `https://github.com/Elimiz21/new-scam-dunk-claude/blob/main/${encodeURIComponent(
          'gpt5 marketing docs',
        )}/${encodeURIComponent(file)}`,
        tags: [file.includes('EXECUTION') ? 'Execution' : 'Strategy'],
        summary: summaryMatch ? stripMarkdown(summaryMatch[0]) : undefined,
      })
    }
    return documents
  } catch (error) {
    console.warn('[marketing-state] Unable to scan docs folder:', error)
    return []
  }
}

function parseAgentRoles(content: string): AgentProfile[] {
  const section =
    extractSection(content, '## 1) Team Structure') ||
    extractSection(content, '## 1) Team Structure (Roles, Mission, Core Outputs)')

  const lines = section.split('\n')
  const agents: AgentProfile[] = []
  let current: AgentProfile | null = null

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') && !trimmed.toLowerCase().startsWith('- mission') && !trimmed.toLowerCase().startsWith('- outputs')) {
      if (current) {
        agents.push(current)
      }
      const title = stripMarkdown(trimmed.replace(/^- /, ''))
      current = {
        id: slugify(title),
        name: title,
        role: title,
        mission: '',
        prompt: '',
        model: 'gpt-4o',
        channel: 'Marketing Ops',
        status: 'active',
        lastUpdated: new Date().toISOString().split('T')[0],
        linkedDocs: [DOC_FILES.playbook],
        strengths: [],
      }
    } else if (trimmed.toLowerCase().startsWith('- mission:') && current) {
      current.mission = stripMarkdown(trimmed.split(':').slice(1).join(':').trim())
      current.prompt = `Mission: ${current.mission}. Uphold diagnostic, privacy-first, accessibility-safe guidance.`
    } else if (trimmed.toLowerCase().startsWith('- outputs:')) {
      // ignore label, sub bullets handled below
    } else if (line.startsWith('    -') && current) {
      current.strengths = current.strengths ?? []
      current.strengths.push(stripMarkdown(line.replace(/^\s*-\s*/, '')))
    }
  })

  if (current) agents.push(current)
  return agents
}

function convertTimelineToWorkflow(timeline: TimelinePhase[]): WorkflowLane[] {
  return timeline.map((phase) => {
    const tasks: WorkflowTask[] = phase.checklist.map((item, index) => ({
      id: `${phase.id}-${index}`,
      title: item,
      summary: item,
      docRef: phase.doc,
    }))
    return {
      id: phase.id,
      title: phase.title,
      description: phase.focus,
      tasks,
    }
  })
}

function buildTeamFromAgents(agents: AgentProfile[]): TeamMember[] {
  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    focus: agent.mission || 'Unspecified mission',
    availability: 'unspecified',
    timezone: 'Not set',
    seniority: 'Principal',
    skills: agent.strengths ?? [],
    assignments: [
      {
        initiative: 'Launch',
        focus: agent.mission || 'Unspecified focus',
        status: 'pending',
      },
    ],
  }))
}

function deriveMetricsFromHighlights(highlights: PlanHighlight[]): MarketingMetric[] {
  return highlights.map((highlight) => ({
    id: highlight.id,
    label: highlight.title,
    value: highlight.summary,
    description: highlight.summary,
    sourceDoc: highlight.doc,
  }))
}

export const getMarketingState = cache(async (): Promise<MarketingState> => {
  const executiveSummary = await readDoc(DOC_FILES.executive)
  const strategyDoc = await readDoc(DOC_FILES.strategy)
  const executionPlan = await readDoc(DOC_FILES.execution)
  const playbook = await readDoc(DOC_FILES.playbook)

  const highlights = parseExecutiveHighlights(executiveSummary)
  const objectives = parseObjectives(strategyDoc)
  const guardrails = parseGuardrails(playbook)
  const timeline = parseTimeline(executionPlan)
  const documents = await parseDocuments()
  const agents = parseAgentRoles(playbook)
  const workflow = convertTimelineToWorkflow(timeline)
  const team = buildTeamFromAgents(agents)
  const metrics = deriveMetricsFromHighlights(highlights)

  return {
    highlights,
    objectives,
    guardrails,
    timeline,
    documents,
    metrics,
    workflow,
    agents,
    team,
    analytics: null,
  }
})
