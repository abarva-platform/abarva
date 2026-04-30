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

import { getActiveClientKey } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  formatRelativeTimestamp,
  getSetupActsContent,
  getSetupSummaryCountsWithSnapshot,
  mergeInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import {
  getCrossProgramSignals,
  getSetupInventorySnapshot,
} from '@/lib/admin/setup-data-broker';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { SetupAdminLanding } from '@/components/admin/setup/SetupAdminLanding';
import { SetupLandingTelemetryBridge } from '@/components/admin/setup/SetupLandingTelemetryBridge';

export const metadata = { title: 'Setup · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOverviewPage() {
  const clientKey = await getActiveClientKey().catch(() => null);
  const brokerTenantKey = clientKey ? clientKeyToInventorySubstrateKey(clientKey) : null;
  const baseContent = getSetupActsContent(clientKey);
  const [snapshot, signals] = brokerTenantKey
    ? await Promise.all([
        getSetupInventorySnapshot(brokerTenantKey).catch(() => null),
        getCrossProgramSignals(brokerTenantKey).catch(() => []),
      ])
    : [null, []];
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const counts = getSetupSummaryCountsWithSnapshot(content, snapshot);
  const lastIngestedRelative = snapshot?.lastIngestedAt
    ? formatRelativeTimestamp(snapshot.lastIngestedAt)
    : undefined;
  const atlasHighSeverityCount = signals.filter((s) => s.severityBucket === 'high').length;
  const programSegment = snapshot?.segments.find((s) => s.segmentId === 'program_inventory');
  const complianceSegment = snapshot?.segments.find((s) => s.segmentId === 'compliance');

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Sentinel"
          primaryActionLabel="Ask Sentinel about your data"
          primaryActionHref="/intelligence/ask"
        />
      }
    >
      <SetupAdminLanding
        content={content}
        segmentRollups={snapshot?.segments ?? []}
        totalRecords={counts.totalRecords}
        segmentsTracked={counts.segmentsTracked}
        capabilitiesGrounded={counts.capabilitiesGrounded}
        lastIngestedRelative={lastIngestedRelative}
        atlasSignalCount={signals.length}
        atlasHighSeverityCount={atlasHighSeverityCount}
        nexusProgramCount={programSegment?.recordCount ?? 0}
        stewardFindingCount={complianceSegment?.recordCount ?? 0}
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
