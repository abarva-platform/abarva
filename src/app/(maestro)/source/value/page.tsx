import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourceValueLedger } from '@/components/source/SourceValueLedger';
import { getSourceValueLedger } from '@/lib/source/queries';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { redactSourceFinancialText } from '@/lib/source/financial-display';
import { canonicalClientDisplayName } from '@/lib/client-config';
import type { SourceValueLedgerSnapshot } from '@/lib/source/types';

export const dynamic = 'force-dynamic';

function emptySourceValueLedgerSnapshot(): SourceValueLedgerSnapshot {
  return {
    updatedAt: 'temporarily unavailable',
    projected: [],
    realized: [],
  };
}

async function loadSourceValueLedgerSnapshot(): Promise<{
  snapshot: SourceValueLedgerSnapshot;
  isDegraded: boolean;
}> {
  return getSourceValueLedger()
    .then((snapshot) => ({ snapshot, isDegraded: false }))
    .catch(() => ({
      snapshot: emptySourceValueLedgerSnapshot(),
      isDegraded: true,
    }));
}

export default async function SourceValuePage() {
  const [ledger, activeClient, tenancy] = await Promise.all([
    loadSourceValueLedgerSnapshot(),
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  const sourceAccessPolicy = activeClient && tenancy
    ? await loadUserSourceAccessPolicy(tenancy, { activeClientKey: activeClient.key }).catch(() => null)
    : null;
  const canViewFinancialValues = sourceAccessPolicy?.canViewFinancialData === true;
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';
  const quote = redactSourceFinancialText(
    '$2.1M sourcing-attributed value confirmed · $890K asserted by vendors, pending audit. AMS contributes $1.4M of confirmed total.',
    canViewFinancialValues,
  );

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: 'Source · Value ledger',
      }}
      subNav={<SourceSubNav />}
    >
      <main
        data-testid="source-value-layout"
        style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}
      >
        <SentinelAgentColumn
          quote={quote}
          agentContext={`Value ledger review · ${activeClientDisplayName}`}
          actions={[
            { letter: 'A', text: 'Show assumptions', detail: 'Value projections and their evidence basis' },
            { letter: 'B', text: 'Show evidence gaps', detail: 'Value claims missing audit confirmation' },
            { letter: 'C', text: 'Explain value confidence', detail: 'Confidence breakdown by source and tier' },
          ]}
        />
        <SourceWorkingPane>
          <SourceValueLedger
            snapshot={ledger.snapshot}
            canViewFinancialValues={canViewFinancialValues}
            isDegraded={ledger.isDegraded}
          />
        </SourceWorkingPane>
      </main>
    </AppShell>
  );
}
