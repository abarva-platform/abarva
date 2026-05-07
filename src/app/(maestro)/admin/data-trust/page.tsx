/**
 * /admin/data-trust · Setup Redesign Package PR B.
 *
 * Four blocks per `WIREFRAME_REFERENCE.html` Panel 2:
 *   2.1 State header (4 metrics)
 *   2.2 What's loaded (5 plain-language buckets)
 *   2.3 Action queue (next loads ranked by impact)
 *   2.4 Trust ladder per segment (collapsible)
 *
 * Reads segments from the same source the Overview composer uses
 * (live snapshot from `data_inventory_segments` or authored
 * fallback) — so PR A and PR B never disagree on substrate state.
 */

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { PageHead } from '@/components/admin/overview/PageHead';
import { DataTrustStateHeader } from '@/components/admin/data-trust-redesign/DataTrustStateHeader';
import { WhatsLoadedBuckets } from '@/components/admin/data-trust-redesign/WhatsLoadedBuckets';
import { DataTrustActionQueue } from '@/components/admin/data-trust-redesign/DataTrustActionQueue';
import { TrustLadderTable } from '@/components/admin/data-trust-redesign/TrustLadderTable';
import { SETUP } from '@/lib/admin/setup-tokens';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  buildAuthoredInventoryFallback,
  getSetupActsContent,
  mergeInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import { getSetupInventorySnapshot } from '@/lib/admin/setup-data-broker';
import { composeDataTrustBlocks } from '@/lib/admin/data-trust-composer';
import { SPACING } from '@/lib/design/design-tokens';

export const metadata = {
  title: 'Data Trust | AbarVa Setup',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = '/admin/data-trust';

interface DataTrustPageProps {
  searchParams?: Promise<{ expand?: string }>;
}

export default async function DataTrustPage({ searchParams }: DataTrustPageProps) {
  const tenant = await resolveAdminTenant();
  const params = (await searchParams) ?? {};
  const expanded = params.expand === 'ladder';

  const brokerTenantKey = clientKeyToInventorySubstrateKey(tenant.clientKey);
  const baseContent = getSetupActsContent(tenant.clientKey);
  const snapshot = brokerTenantKey
    ? await getSetupInventorySnapshot(brokerTenantKey).catch(() => null)
    : null;
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const segments = snapshot
    ? snapshot.segments
    : buildAuthoredInventoryFallback(content).segments;

  const blocks = composeDataTrustBlocks(segments);

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={tenant.tenantName}>
      <div
        data-testid="data-trust-page"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
          padding: SPACING.xl,
          background: SETUP.paper,
        }}
      >
        <PageHead
          eyebrow={`Setup · Data Trust · ${tenant.tenantName}`}
          title="What we know about you, and what's missing"
          lede="The substrate panel — what's loaded, what to load next, and what each segment unlocks."
        />
        <DataTrustStateHeader metrics={blocks.state} />
        <WhatsLoadedBuckets buckets={blocks.buckets} />
        <DataTrustActionQueue items={blocks.actionQueue} />
        <TrustLadderTable rows={blocks.ladder} expanded={expanded} baseHref={BASE_URL} />
      </div>
    </AdminCanonShellV2>
  );
}
