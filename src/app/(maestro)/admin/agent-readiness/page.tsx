import { SPACING } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { ContextBar } from '@/components/admin/ContextBar';
import { StewardEditorial } from '@/components/admin/StewardEditorial';
import { AgentPostureGrid } from '@/components/admin/AgentPostureGrid';
import { AgentReadinessTabs } from '@/components/admin/AgentReadinessTabs';
import { AgentReadinessActionStrip } from '@/components/admin/AgentReadinessActionStrip';
import { AgentExpandableCard } from '@/components/admin/AgentExpandableCard';
import { ContextCoverageMatrix } from '@/components/admin/ContextCoverageMatrix';
import {
  buildAgentReadinessPageView,
  findAgentDetail,
  resolveAgentReadinessTab,
} from '@/lib/admin/agent-readiness-page-view';

export const metadata = {
  title: 'Agent Readiness | AbarVa Setup',
};

const BASE_URL = '/admin/agent-readiness';

export default async function AgentReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ agent?: string }>;
}) {
  const view = await buildAgentReadinessPageView();
  const resolved = searchParams ? await searchParams : undefined;
  const activeTab = resolveAgentReadinessTab(resolved?.agent);
  const activeDetail =
    activeTab === 'overview' ? null : findAgentDetail(view, activeTab);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel={view.primaryAgentLabel}
          primaryActionLabel={view.primaryActionLabel}
          primaryActionHref={view.primaryActionHref}
        />
      }
    >
      <EditorialCanvas eyebrow={view.eyebrow} title={view.title} subtitle={view.subtitle}>
        <ContextBar
          tenant={view.context.tenant}
          mode={view.context.mode}
          agent={view.context.agent}
          data={view.context.data}
          liveStatus={view.context.liveStatus}
          liveStatusKind={view.context.liveStatusKind}
        />
        <StewardEditorial
          title={view.editorial.title}
          body={view.editorial.body}
          contextUsed={view.editorial.contextUsed}
          evidenceStrength={view.editorial.evidenceStrength}
          blocker={view.editorial.blocker}
          primaryAction={view.editorial.primaryAction}
        />

        <div data-agent-readiness-depth="true" style={{ marginTop: SPACING.xl }}>
          <AgentReadinessActionStrip actions={view.actionStrip} />
          <AgentReadinessTabs
            tabs={view.tabs}
            activeTab={activeTab}
            baseUrl={BASE_URL}
          />

          {activeTab === 'overview' && (
            <>
              <AgentPostureGrid agents={view.agents} />
              <div style={{ marginTop: SPACING.lg }}>
                <ContextCoverageMatrix rows={view.contextCoverageMatrix} />
              </div>
            </>
          )}

          {activeDetail && <AgentExpandableCard detail={activeDetail} />}
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
