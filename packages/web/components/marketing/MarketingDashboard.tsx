import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarketingState } from '@/lib/marketing/types'
import { MarketingHero } from './MarketingHero'
import { MarketingMetrics } from './MarketingMetrics'
import { PlanOverview } from './PlanOverview'
import { ExecutionTimeline } from './ExecutionTimeline'
import { WorkflowBoard } from './WorkflowBoard'
import { DocumentationPanel } from './DocumentationPanel'
import { AgentPlaybook } from './AgentPlaybook'
import { AgentPromptManager } from './AgentPromptManager'
import { AnalyticsPanel } from './AnalyticsPanel'
import { IntegrationsPanel } from './IntegrationsPanel'
import { TeamPanel } from './TeamPanel'

interface Props {
  state: MarketingState
}

export function MarketingDashboard({ state }: Props) {
  return (
    <div className="space-y-10">
      <MarketingHero />
      <MarketingMetrics metrics={state.metrics} />
      <PlanOverview highlights={state.highlights} objectives={state.objectives} guardrails={state.guardrails} />
      <ExecutionTimeline phases={state.timeline} />

      <Tabs defaultValue="workflow" className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-auto flex-wrap gap-2 bg-white/10 p-2">
            <TabsTrigger value="workflow" className="rounded-xl px-4 py-2 text-sm text-white data-[state=active]:bg-white/30">
              Workflow
            </TabsTrigger>
            <TabsTrigger value="docs" className="rounded-xl px-4 py-2 text-sm text-white data-[state=active]:bg-white/30">
              Documentation
            </TabsTrigger>
            <TabsTrigger value="agents" className="rounded-xl px-4 py-2 text-sm text-white data-[state=active]:bg-white/30">
              Agent prompts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-4 py-2 text-sm text-white data-[state=active]:bg-white/30">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-xl px-4 py-2 text-sm text-white data-[state=active]:bg-white/30">
              Integrations
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-xl px-4 py-2 text-sm text-white data-[state=active]:bg-white/30">
              Team
            </TabsTrigger>
          </TabsList>
          <p className="text-sm text-white/60">
            Operate with conviction · align builds, briefs, and agents in one premium workspace.
          </p>
        </div>

        <TabsContent value="workflow">
          <WorkflowBoard lanes={state.workflow} />
        </TabsContent>
        <TabsContent value="docs">
          <DocumentationPanel documents={state.documents} />
        </TabsContent>
        <TabsContent value="agents">
          <AgentPlaybook agents={state.agents} guardrails={state.guardrails} />
          <AgentPromptManager agents={state.agents} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsPanel analytics={state.analytics} />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsPanel />
        </TabsContent>
        <TabsContent value="team">
          <TeamPanel team={state.team} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
