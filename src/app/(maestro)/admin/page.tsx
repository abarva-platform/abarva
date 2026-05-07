/**
 * /admin · Setup landing page · SETUP-1.2
 *
 * Story-led entry point for tenant admins. Replaces the previous
 * redirect to /admin/connectors. Per
 * docs/build/intelligence/SETUP-1_DETAILED_DESIGN.md the page is
 * organized as three Acts (what we know / what we can reason /
 * what changes on upload) plus an activity feed.
 *
 * Server component. Resolves the active client, maps the
 * ClientKey to its broker tenant key, reads a live snapshot of
 * the inventory substrate, and merges it onto the authored
 * content. Falls back to authored fixture when the live read is
 * unavailable.
 */

import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  formatRelativeTimestamp,
  getSetupActsContent,
  getSetupSummaryCountsWithSnapshot,
  mergeInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import {
  getCrossProgramSignals,
  getContextChunkStats,
  getSetupInventorySnapshot,
} from '@/lib/admin/setup-data-broker';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { SetupAdminLanding } from '@/components/admin/setup/SetupAdminLanding';
import { SetupLandingTelemetryBridge } from '@/components/admin/setup/SetupLandingTelemetryBridge';
import { DataLandscapeTable } from '@/components/admin/setup/DataLandscapeTable';
import { getApprovalQueueForTenant } from '@/lib/programs/approval';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata = { title: 'Setup · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOverviewPage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'Apex Retail Group';
  // Fall back to apexretail so authored content always matches the top bar
  // (which also hard-codes Apex Retail Group when no row is found).
  const clientKey = activeClient?.key ?? 'apexretail';
  const brokerTenantKey = clientKeyToInventorySubstrateKey(clientKey);
  const baseContent = getSetupActsContent(clientKey);
  const [snapshot, signals, chunkStats, programApprovalQueue] = brokerTenantKey
    ? await Promise.all([
        getSetupInventorySnapshot(brokerTenantKey).catch(() => null),
        getCrossProgramSignals(brokerTenantKey).catch(() => []),
        getContextChunkStats(brokerTenantKey).catch(() => []),
        getApprovalQueueForTenant(clientKey).catch(() => []),
      ])
    : [null, [], [], []];
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const counts = getSetupSummaryCountsWithSnapshot(content, snapshot);
  const lastIngestedRelative = snapshot?.lastIngestedAt
    ? formatRelativeTimestamp(snapshot.lastIngestedAt)
    : undefined;
  const atlasHighSeverityCount = signals.filter((s) => s.severityBucket === 'high').length;

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={activeClientDisplayName}>
      <SetupAdminLanding
        content={content}
        segmentRollups={snapshot?.segments ?? []}
        totalRecords={counts.totalRecords}
        segmentsTracked={counts.segmentsTracked}
        capabilitiesGrounded={counts.capabilitiesGrounded}
        lastIngestedRelative={lastIngestedRelative}
        atlasSignalCount={signals.length}
        atlasHighSeverityCount={atlasHighSeverityCount}
        programApprovalPendingCount={programApprovalQueue.length}
      />
      <DataLandscapeTable
        segments={snapshot?.segments ?? []}
        chunkStats={chunkStats}
        totalRecords={counts.totalRecords ?? 0}
        totalChunks={snapshot?.totalChunks ?? 0}
        totalNodes={snapshot?.totalNodes ?? 0}
        totalEdges={snapshot?.totalEdges ?? 0}
        lastIngestedRelative={lastIngestedRelative}
      />
      <SetupLandingTelemetryBridge
        tenantKey={brokerTenantKey}
        tenantDataRichness={content.tenantDataRichness}
        totalRecords={counts.totalRecords}
        segmentsTracked={counts.segmentsTracked}
        capabilitiesGrounded={counts.capabilitiesGrounded}
        liveSnapshotPresent={snapshot !== null}
      />
    </AdminCanonShellV2>
  );
}
