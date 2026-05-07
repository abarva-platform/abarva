/**
 * /admin/agent-readiness · Setup Redesign Package PR C.
 *
 * Three blocks per `WIREFRAME_REFERENCE.html` Panel 5:
 *   5.1 AgentReadinessStateHeader (per-agent quick reads)
 *   5.2 CapabilityConstellation (14×6 matrix as page hero)
 *   5.3 PerAgentActions (admin-actionable + engineering-tracked,
 *       visually distinct)
 *
 * Reads segments from the same source Overview + Data Trust use
 * (live snapshot or authored fallback) so all three panels agree
 * on substrate state.
 */

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { PageHead } from '@/components/admin/overview/PageHead';
import { AgentReadinessStateHeader } from '@/components/admin/agent-readiness-redesign/AgentReadinessStateHeader';
import { CapabilityConstellation } from '@/components/admin/agent-readiness-redesign/CapabilityConstellation';
import { PerAgentActions } from '@/components/admin/agent-readiness-redesign/PerAgentActions';
import { SETUP } from '@/lib/admin/setup-tokens';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import {
  buildAuthoredInventoryFallback,
  getSetupActsContent,
  mergeInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import { getSetupInventorySnapshot } from '@/lib/admin/setup-data-broker';
import { composeAgentReadinessBlocks } from '@/lib/admin/agent-readiness-composer';
import { SPACING } from '@/lib/design/design-tokens';

export const metadata = {
  title: 'Agent Readiness | AbarVa Setup',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AgentReadinessPage() {
  const tenant = await resolveAdminTenant();

  const brokerTenantKey = clientKeyToInventorySubstrateKey(tenant.clientKey);
  const baseContent = getSetupActsContent(tenant.clientKey);
  const snapshot = brokerTenantKey
    ? await getSetupInventorySnapshot(brokerTenantKey).catch(() => null)
    : null;
  const content = mergeInventorySnapshot(baseContent, snapshot);
  const segments = snapshot
    ? snapshot.segments
    : buildAuthoredInventoryFallback(content).segments;

  const blocks = composeAgentReadinessBlocks(segments);

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={tenant.tenantName}>
      <div
        data-testid="agent-readiness-page"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
          padding: SPACING.xl,
          background: SETUP.paper,
        }}
      >
        <PageHead
          eyebrow={`Setup · Agent Readiness · ${tenant.tenantName}`}
          title="What your agents can confidently do today"
          lede="Per-agent state, segment-by-capability map, and what closes each gap."
        />
        <AgentReadinessStateHeader agents={blocks.state} />
        <CapabilityConstellation matrix={blocks.matrix} />
        <PerAgentActions
          adminActionable={blocks.adminActionable}
          engineeringTracked={blocks.engineeringTracked}
        />
      </div>
    </AdminCanonShellV2>
  );
}
