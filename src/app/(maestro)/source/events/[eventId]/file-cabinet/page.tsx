import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { FileCabinetPanel } from '@/components/source/FileCabinetPanel';

export const dynamic = 'force-dynamic';

export default async function SourceEventFileCabinetPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientName = canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ?? 'AbarVa Client';

  return (
    <AppShell
      surface="source"
      topBarProps={{ tenantName: clientName, showLocked: true, context: 'Source · File Cabinet' }}
      subNav={<SourceSubNav />}
    >
      <SourceWorkingPane>
        <FileCabinetPanel eventId={eventId} />
      </SourceWorkingPane>
    </AppShell>
  );
}
