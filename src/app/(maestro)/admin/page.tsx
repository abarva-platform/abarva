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
import { StatusHeader } from '@/components/admin/overview/StatusHeader';
import { StewardOrientation } from '@/components/admin/overview/StewardOrientation';
import { ActionQueue } from '@/components/admin/overview/ActionQueue';
import { RecentActivity } from '@/components/admin/overview/RecentActivity';
import { composeOverviewBlocks } from '@/lib/admin/overview-composer';
import { getApprovalQueueForTenant } from '@/lib/programs/approval';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { SPACING } from '@/lib/design/design-tokens';

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

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={activeClientDisplayName}>
      <div
        data-testid="overview-page"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
          padding: SPACING.xl,
        }}
      >
        <StatusHeader
          tenantName={blocks.status.tenantName}
          readinessPercent={blocks.status.readinessPercent}
          agentLevel={blocks.status.agentLevel}
          blockedCapabilityTracks={blocks.status.blockedCapabilityTracks}
        />
        <StewardOrientation
          tenantName={blocks.orientation.tenantName}
          industryPhrase={blocks.orientation.industryPhrase}
          loadedSummary={blocks.orientation.loadedSummary}
          missingSummary={blocks.orientation.missingSummary}
          nextLoadName={blocks.orientation.nextLoadName}
          nextLoadConsequence={blocks.orientation.nextLoadConsequence}
        />
        <ActionQueue
          items={blocks.actionQueue.items}
          totalPending={blocks.actionQueue.totalPending}
        />
        <RecentActivity items={blocks.recentActivity.items} />
      </div>
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
