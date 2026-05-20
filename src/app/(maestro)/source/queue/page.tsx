import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourceDecisionQueueView } from '@/components/source/SourceDecisionQueueView';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { loadSourceDecisionQueueWithEvidence } from '@/lib/source/decision-queue/load';

export const metadata = { title: 'Source · Decision Queue · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * The Source Decision Queue — the triggered-decision inbox (Practitioner-Fit
 * §3). Re-fronts Source as "here is what to decide today" rather than "start
 * a workflow". Cards deep-link into the Renewal Cockpit, pre-loaded.
 */
export default async function SourceDecisionQueuePage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientKey = activeClient?.key ?? 'apexretail';
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';
  const { queue, evidenceContext } =
    await loadSourceDecisionQueueWithEvidence(clientKey);

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: 'Source · Decision Queue',
      }}
      subNav={<SourceSubNav />}
    >
      <SourceWorkingPane>
        <SourceDecisionQueueView queue={queue} evidenceContext={evidenceContext} />
      </SourceWorkingPane>
    </AppShell>
  );
}
