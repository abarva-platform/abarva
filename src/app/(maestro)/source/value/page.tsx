import { AppShell } from '@/components/shell/AppShell';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourceValueLedger } from '@/components/source/SourceValueLedger';
import { getSourceValueLedger } from '@/lib/source/queries';

export const dynamic = 'force-dynamic';

export default async function SourceValuePage() {
  const snapshot = await getSourceValueLedger();

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Source · Value ledger',
      }}
    >
      <SentinelAgentColumn
        quote="$2.1M sourcing-attributed value confirmed · $890K asserted by vendors, pending audit. AMS contributes $1.4M of confirmed total."
        agentContext="Sentinel · Source value ledger · Apex Retail Group"
        actions={[
          { letter: 'A', text: 'Show assumptions', detail: 'Value projections and their evidence basis' },
          { letter: 'B', text: 'Show evidence gaps', detail: 'Value claims missing audit confirmation' },
          { letter: 'C', text: 'Explain value confidence', detail: 'Confidence breakdown by source and tier' },
        ]}
      />
      <SourceWorkingPane>
        <SourceValueLedger snapshot={snapshot} />
      </SourceWorkingPane>
    </AppShell>
  );
}
