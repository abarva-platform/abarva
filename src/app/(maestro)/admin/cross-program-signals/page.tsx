/**
 * /admin/cross-program-signals · Cross-program signals workflow page
 *
 * Lists every cross-program signal currently tracked (segment 14) grouped
 * by severity, with recommendations in agent voice. HIGH-severity entries
 * warrant a sponsor decision; MEDIUM are tracked; LOW are informational.
 *
 * Per `feedback_workflow_first_agents_hidden.md` — primary navigation is
 * workflow-anchored. The chat front for Setup is Steward; cross-program
 * signal synthesis is the Atlas-flavored capability bucket. Atlas appears
 * in the chat window and trace, not as a navigation surface label.
 *
 * (Replaces the prior /admin/agents/atlas surface; old route now redirects
 * to this one.)
 */

import { getActiveClientKey } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { getCrossProgramSignals } from '@/lib/admin/setup-data-broker';
import { resolveSegmentRef } from '@/lib/admin/setup-acts-registry';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { CrossProgramSignalsPanel } from '@/components/admin/setup/CrossProgramSignalsPanel';

export const metadata = { title: 'Cross-program signals · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CrossProgramSignalsPage() {
  const clientKey = await getActiveClientKey().catch(() => null);
  const brokerTenantKey = clientKey ? clientKeyToInventorySubstrateKey(clientKey) : null;
  const tenantDisplayName = clientKey
    ? (canonicalClientDisplayName({ key: clientKey }) ?? 'Your tenant')
    : 'Your tenant';
  const signals = brokerTenantKey
    ? await getCrossProgramSignals(brokerTenantKey).catch(() => [])
    : [];
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
