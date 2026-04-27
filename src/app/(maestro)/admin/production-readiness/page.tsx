// ADMIN8 — /admin/production-readiness is the canonical Production Readiness page.
// Auth is enforced by /admin/layout.tsx (Clerk admin allowlist) — no inline guard.
// /platform/admin/production-readiness redirects here for backward compatibility.
import { connection } from 'next/server';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { ContextBar } from '@/components/admin/ContextBar';
import { StewardEditorial } from '@/components/admin/StewardEditorial';
import { DemoPilotProductionTiles } from '@/components/admin/DemoPilotProductionTiles';
import { TopBlockersTable } from '@/components/admin/TopBlockersTable';
import { buildProductionReadinessPageView } from '@/lib/admin/production-readiness-page-view';

export const metadata = {
  title: 'Production Readiness | Nexus Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProductionReadinessPage() {
  // Opt out of static caching for request-time freshness; the layout already
  // calls connection() but we keep the call here so PROD3 freshness contract
  // is asserted on the page itself.
  await connection();
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
