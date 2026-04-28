// ADMIN8 — /admin/production-readiness is the canonical Production Readiness page.
// ADMIN16 — Depth additions: sub-nav tabs, per-tile expand, blocker drawer,
//           gate criteria matrix, history strip, action strip.
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
import { ProductionReadinessTabs } from '@/components/admin/production-readiness/ProductionReadinessTabs';
import { ProductionReadinessActionStrip } from '@/components/admin/production-readiness/ProductionReadinessActionStrip';
import { ReadinessTileExpanded } from '@/components/admin/production-readiness/ReadinessTileExpanded';
import { BlockerDetailDrawer } from '@/components/admin/production-readiness/BlockerDetailDrawer';
import { GateCriteriaMatrix } from '@/components/admin/production-readiness/GateCriteriaMatrix';
import { ReadinessHistoryStrip } from '@/components/admin/production-readiness/ReadinessHistoryStrip';
import {
  buildProductionReadinessPageView,
  resolveProductionReadinessTab,
  resolveExpandedTile,
  findBlockerDetail,
} from '@/lib/admin/production-readiness-page-view';

export const metadata = {
  title: 'Production Readiness | Nexus Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = '/admin/production-readiness';

export default async function AdminProductionReadinessPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; expand?: string; blocker?: string }>;
}) {
  // Opt out of static caching for request-time freshness; the layout already
  // calls connection() but we keep the call here so PROD3 freshness contract
  // is asserted on the page itself.
  await connection();
  const view = await buildProductionReadinessPageView();
  const resolved = searchParams ? await searchParams : undefined;
  const activeTab = resolveProductionReadinessTab(resolved?.tab);
  const expandedTile = resolveExpandedTile(resolved?.expand);
  const activeBlocker = findBlockerDetail(view, resolved?.blocker);
  const expandedDetail = expandedTile ? view.tileDetailMap[expandedTile] : null;

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

        <ProductionReadinessActionStrip actions={view.actionStrip} />
        <ProductionReadinessTabs
          tabs={view.tabs}
          activeTab={activeTab}
          baseUrl={BASE_URL}
        />

        {activeTab === 'decision' && (
          <>
            <DemoPilotProductionTiles tiles={view.tiles} />
            {expandedDetail && (
              <ReadinessTileExpanded
                detail={expandedDetail}
                baseUrl={BASE_URL}
                closeHref={`${BASE_URL}?tab=decision`}
              />
            )}
          </>
        )}

        {activeTab === 'blockers' && (
          <>
            <TopBlockersTable blockers={view.topBlockers} />
            {activeBlocker && (
              <BlockerDetailDrawer
                blocker={activeBlocker}
                baseUrl={BASE_URL}
                returnTab="blockers"
              />
            )}
          </>
        )}

        {activeTab === 'gates' && <GateCriteriaMatrix groups={view.gateCriteria} />}

        {activeTab === 'history' && <ReadinessHistoryStrip history={view.historyStrip} />}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
