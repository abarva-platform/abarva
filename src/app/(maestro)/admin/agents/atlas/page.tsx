/**
 * /admin/agents/atlas · Atlas detail surface · SETUP-1.3
 *
 * The cross-program reasoning agent's surface. Lists every signal
 * Atlas is currently tracking (segment 14) grouped by severity,
 * with the recommendation in Sentinel-voice. HIGH-severity
 * entries warrant a sponsor decision; MEDIUM are tracked; LOW
 * are informational.
 *
 * Per `feedback_agent_anchored_setup.md` — every Setup-adjacent
 * surface is anchored to a named agent, not just a substrate
 * dump.
 */

import { getActiveClientKey } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { getCrossProgramSignals } from '@/lib/admin/setup-data-broker';
import { resolveSegmentRef } from '@/lib/admin/setup-acts-registry';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { CrossProgramSignalsPanel } from '@/components/admin/setup/CrossProgramSignalsPanel';

export const metadata = { title: 'Atlas · cross-program signals · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminAtlasPage() {
  const clientKey = await getActiveClientKey().catch(() => null);
  const brokerTenantKey = clientKey ? clientKeyToInventorySubstrateKey(clientKey) : null;
  const tenantDisplayName = clientKey
    ? (canonicalClientDisplayName({ key: clientKey }) ?? 'Your tenant')
    : 'Your tenant';
  const signals = brokerTenantKey
    ? await getCrossProgramSignals(brokerTenantKey).catch(() => [])
    : [];
  // Reference resolves to the cross_program_signals segment (#14).
  // Used for breadcrumb context.
  resolveSegmentRef('cross_program_signals');

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Atlas"
          primaryActionLabel="Ask Atlas about a signal"
          primaryActionHref="/intelligence/ask"
        />
      }
    >
      <CrossProgramSignalsPanel
        tenantDisplayName={tenantDisplayName}
        signals={signals}
      />
    </AdminCanonShellV2>
  );
}
