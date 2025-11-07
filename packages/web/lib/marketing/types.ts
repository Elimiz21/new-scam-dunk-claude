export type TrendDirection = 'up' | 'down' | 'flat'

export interface MarketingMetric {
  id: string
  label: string
  value: string
  change?: string
  trend?: TrendDirection
  description?: string
  target?: string
  sourceDoc?: string
}

export type TaskEffort = 'S' | 'M' | 'L' | 'TBD'
export type TaskRisk = 'low' | 'medium' | 'high' | 'unknown'

export interface WorkflowTask {
  id: string
  title: string
  owner?: string
  dueDate?: string
  effort?: TaskEffort
  status?: string
  tags?: string[]
  progress?: number
  risk?: TaskRisk
  summary?: string
  docRef?: string
}

export interface WorkflowLane {
  id: string
  title: string
  description?: string
  tasks: WorkflowTask[]
}

export type DocumentType = 'Brief' | 'Strategy' | 'Guideline' | 'Dataset' | 'Report' | 'Playbook'
export type DocumentStatus = 'Draft' | 'Review' | 'Approved'

export interface DocumentItem {
  id: string
  title: string
  owner: string
  type: DocumentType
  status: DocumentStatus
  updatedAt: string
  link: string
  tags: string[]
  summary?: string
}

export type AgentStatus = 'active' | 'calibrating' | 'paused'

export interface AgentProfile {
  id: string
  name: string
  role: string
  mission: string
  prompt: string
  model: string
  channel: string
  status: AgentStatus
  lastUpdated: string
  tone?: string
  strengths?: string[]
  linkedDocs?: string[]
}

export interface AnalyticsTimelinePoint {
  date: string
  velocity: number
  completed: number
  newIssues: number
}

export interface ChannelPerformance {
  channel: string
  roi: number
  spend: number
  reach: number
}

export interface CoverageDatum {
  name: string
  value: number
}

export interface BudgetDatum {
  name: string
  plan: number
  actual: number
}

export interface AnalyticsSnapshot {
  velocityTrend: AnalyticsTimelinePoint[]
  channelPerformance: ChannelPerformance[]
  coverage: CoverageDatum[]
  budget: BudgetDatum[]
}

export type IntegrationProvider = 'github' | 'supabase' | 'vercel'
export type IntegrationStatus = 'connected' | 'pending' | 'missing'

export interface IntegrationConfig {
  provider: IntegrationProvider
  status: IntegrationStatus
  description: string
  actions: string[]
  url?: string
  lastSynced?: string
}

export type Availability = 'available' | 'partial' | 'ooo' | 'unspecified'
export type AssignmentStatus = 'on-track' | 'at-risk' | 'blocked' | 'pending'

export interface Assignment {
  initiative: string
  focus: string
  status: AssignmentStatus
}

export interface TeamMember {
  id: string
  name: string
  role: string
  focus: string
  availability: Availability
  timezone: string
  seniority: string
  skills: string[]
  assignments: Assignment[]
}

export interface PlanHighlight {
  id: string
  title: string
  summary: string
  doc: string
}

export interface ObjectiveItem {
  id: string
  label: string
  detail: string
  doc: string
}

export interface TimelinePhase {
  id: string
  title: string
  focus: string
  doc: string
  checklist: string[]
}

export interface MarketingState {
  highlights: PlanHighlight[]
  objectives: ObjectiveItem[]
  guardrails: string[]
  timeline: TimelinePhase[]
  documents: DocumentItem[]
  metrics: MarketingMetric[]
  workflow: WorkflowLane[]
  agents: AgentProfile[]
  team: TeamMember[]
  analytics?: AnalyticsSnapshot | null
}
