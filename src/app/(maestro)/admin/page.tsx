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
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  formatRelativeTimestamp,
  getSetupActsContent,
  getSetupSummaryCountsWithSnapshot,
  mergeInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import { getSetupInventorySnapshot } from '@/lib/admin/setup-data-broker';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { SetupAdminLanding } from '@/components/admin/setup/SetupAdminLanding';

export const metadata = { title: 'Setup · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOverviewPage() {
  const clientKey = await getActiveClientKey().catch(() => null);
  const brokerTenantKey = clientKey ? clientKeyToBrokerTenantKey(clientKey) : null;
  const baseContent = getSetupActsContent(clientKey);
  const snapshot = brokerTenantKey
    ? await getSetupInventorySnapshot(brokerTenantKey).catch(() => null)
    : null;
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const counts = getSetupSummaryCountsWithSnapshot(content, snapshot);
  const lastIngestedRelative = snapshot?.lastIngestedAt
    ? formatRelativeTimestamp(snapshot.lastIngestedAt)
    : undefined;

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
      />
    </AdminCanonShellV2>
  );
}
