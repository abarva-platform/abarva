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
import { getOverviewSupplementalData } from '@/lib/admin/overview-data';

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
  // counts. Fetched via the broker-boundary abstraction so the page
  // component does not directly reference the Supabase client.
  const clientId = activeClient?.id ?? null;
  const {
    programsCount,
    programsP6Count,
    sourceEventsCount,
    sourceEventsAtRiskCount,
    initiativesList,
  } = await getOverviewSupplementalData(clientKey, clientId);
  const initiativesAtRiskCount = initiativesList.filter((i) =>
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
