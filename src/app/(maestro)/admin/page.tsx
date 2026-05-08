/**
 * /admin · Setup Overview · Setup Redesign Package PR A.
 *
 * Compressed from 7 sections to 4 small blocks per
 * `WIREFRAME_REFERENCE.html` Panel 1:
 *   - Block 1.1 StatusHeader
 *   - Block 1.2 StewardOrientation
 *   - Block 1.3 ActionQueue (hidden when empty)
 *   - Block 1.4 RecentActivity (hidden when empty)
 *
 * Substrate-related content (Act 1 fact cards, Capability
 * Constellation matrix, Client Data Landscape table, Act 3 upload
 * templates) migrated out — absorbed by Data Trust (PR B) and Agent
 * Readiness (PR C). Components remain in the codebase pending those
 * PRs.
 */

import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  buildAuthoredInventoryFallback,
  getSetupActsContent,
  mergeInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import {
  getCrossProgramSignals,
  getSetupInventorySnapshot,
} from '@/lib/admin/setup-data-broker';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { SetupLandingTelemetryBridge } from '@/components/admin/setup/SetupLandingTelemetryBridge';
import { HomeOverviewV2 } from '@/components/home/HomeOverviewV2';
import { composeOverviewBlocks } from '@/lib/admin/overview-composer';
import { composeHomeV2Extras } from '@/lib/admin/home-overview-v2';
import { getApprovalQueueForTenant } from '@/lib/programs/approval';
import { canonicalClientDisplayName, isClientKey } from '@/lib/client-config';
import { getServerSupabase } from '@/lib/supabase-server';
import {
  listInitiativesForClient,
  type AIInitiative,
} from '@/lib/admin/ai-initiatives/queries';

export const metadata = { title: 'Setup · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOverviewPage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'Apex Retail Group';
  const clientKey = activeClient?.key ?? 'apexretail';
  const brokerTenantKey = clientKeyToInventorySubstrateKey(clientKey);
  const baseContent = getSetupActsContent(clientKey);
  const [snapshot, signals, programApprovalQueue] = brokerTenantKey
    ? await Promise.all([
        getSetupInventorySnapshot(brokerTenantKey).catch(() => null),
        getCrossProgramSignals(brokerTenantKey).catch(() => []),
        getApprovalQueueForTenant(clientKey).catch(() => []),
      ])
    : [null, [], []];
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const atlasHighSeverityCount = signals.filter((s) => s.severityBucket === 'high').length;

  // Substrate or authored fallback (Setup Fix Package PR 3 logic
  // preserved — segments still drive the Overview composer).
  const segments = snapshot
    ? snapshot.segments
    : buildAuthoredInventoryFallback(content).segments;

  const recentSnapshotActivity =
    snapshot?.recentActivity?.map((e) => ({
      actor: e.actor,
      what: e.what,
      timestamp: e.timestampIso,
    })) ?? [];

  const blocks = composeOverviewBlocks({
    tenantName: activeClientDisplayName,
    industryCode: activeClient?.industry_code,
    clientKey,
    segments,
    content,
    programApprovalPendingCount: programApprovalQueue.length,
    atlasSignalCount: signals.length,
    atlasHighSeverityCount,
    ssoConfigured: false,
    recentSnapshotActivity,
  });

  // Section 01 + 05 inputs: programs + source events + initiatives
  // counts. Fail-soft to zero so the page still renders for unbound
  // tenants.
  const sb = (() => {
    try { return getServerSupabase(); } catch { return null; }
  })();
  const clientId = activeClient?.id ?? null;

  // Pull engagements + source events + initiatives in parallel,
  // fail-soft per-query so the page renders even when a tenant is
  // unbound or RLS blocks a row.
  const [programsRes, sourceEventsRes, initiativesList] = await Promise.all([
    sb && clientId
      ? sb.from('engagements').select('id, current_phase').eq('client_id', clientId)
      : Promise.resolve({ data: null }),
    sb
      ? sb.from('source_events').select('id, lifecycle_state').eq('client_key', clientKey)
      : Promise.resolve({ data: null }),
    clientId
      ? listInitiativesForClient(clientId).catch(() => [] as ReadonlyArray<AIInitiative>)
      : Promise.resolve([] as ReadonlyArray<AIInitiative>),
  ]);
  const programsRows = (programsRes.data ?? []) as Array<{ id: string; current_phase: number | null }>;
  const sourceEventsRows = (sourceEventsRes.data ?? []) as Array<{ id: string; lifecycle_state: string | null }>;
  const programsCount = programsRows.length;
  const programsP6Count = programsRows.filter((r) => (r.current_phase ?? 0) >= 6).length;
  const sourceEventsCount = sourceEventsRows.length;
  const sourceEventsAtRiskCount = sourceEventsRows.filter((r) =>
    /risk|blocked|stalled/i.test(r.lifecycle_state ?? ''),
  ).length;
  const initiativesAtRiskCount = initiativesList.filter((i: AIInitiative) =>
    /risk|blocked|attention/i.test(i.statusFlag ?? ''),
  ).length;

  const extras = composeHomeV2Extras({
    segments,
    programsCount,
    programsP6Count,
    sourceEventsCount,
    sourceEventsAtRiskCount,
    initiativesCount: initiativesList.length,
    initiativesAtRiskCount,
    lastIngestedAt: snapshot?.lastIngestedAt ?? null,
  });

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={activeClientDisplayName}>
      <HomeOverviewV2
        tenantName={activeClientDisplayName}
        clientKey={isClientKey(clientKey) ? clientKey : null}
        blocks={blocks}
        extras={extras}
      />
      <SetupLandingTelemetryBridge
        tenantKey={brokerTenantKey}
        tenantDataRichness={content.tenantDataRichness}
        totalRecords={segments.reduce((n, s) => n + s.recordCount, 0)}
        segmentsTracked={segments.length}
        capabilitiesGrounded={
          content.actTwoCapabilityNodes.filter((n) => n.depthState === 'grounded').length
        }
        liveSnapshotPresent={snapshot !== null}
      />
    </AdminCanonShellV2>
  );
}
