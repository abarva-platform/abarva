import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { ContextBar } from '@/components/admin/ContextBar';
import { StewardEditorial } from '@/components/admin/StewardEditorial';
import { DemoPilotProductionTiles } from '@/components/admin/DemoPilotProductionTiles';
import { TopBlockersTable } from '@/components/admin/TopBlockersTable';
import { buildProductionReadinessPageView } from '@/lib/admin/production-readiness-page-view';

export const metadata = {
  title: 'Production Readiness | AbarVa Admin',
};

export default function AdminProductionReadinessPage() {
  const view = buildProductionReadinessPageView();
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
        <DemoPilotProductionTiles tiles={view.tiles} />
        <TopBlockersTable blockers={view.topBlockers} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
