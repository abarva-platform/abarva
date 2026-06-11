import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { GateDecisionPanel } from '@/components/source/GateDecisionPanel';

export const dynamic = 'force-dynamic';

export default async function SourceEventGatePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientName = canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ?? 'AbarVa Client';

  return (
    <AppShell
      surface="source"
      topBarProps={{ tenantName: clientName, showLocked: true, context: 'Source · Stage Gate' }}
      subNav={<SourceSubNav />}
    >
      <SourceWorkingPane>
        <GateDecisionPanel eventId={eventId} />
      </SourceWorkingPane>
    </AppShell>
  );
}
