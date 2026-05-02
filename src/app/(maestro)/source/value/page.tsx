import { AppShell } from '@/components/shell/AppShell';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourceValueLedger } from '@/components/source/SourceValueLedger';
import { getSourceValueLedger } from '@/lib/source/queries';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { redactSourceFinancialText } from '@/lib/source/financial-display';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const dynamic = 'force-dynamic';

export default async function SourceValuePage() {
  const [snapshot, activeClient, tenancy] = await Promise.all([
    getSourceValueLedger(),
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
    >
      <SentinelAgentColumn
        quote={quote}
        agentContext={`Sentinel · Source value ledger · ${activeClientDisplayName}`}
        actions={[
          { letter: 'A', text: 'Show assumptions', detail: 'Value projections and their evidence basis' },
          { letter: 'B', text: 'Show evidence gaps', detail: 'Value claims missing audit confirmation' },
          { letter: 'C', text: 'Explain value confidence', detail: 'Confidence breakdown by source and tier' },
        ]}
      />
      <SourceWorkingPane>
        <SourceValueLedger
          snapshot={snapshot}
          canViewFinancialValues={canViewFinancialValues}
        />
      </SourceWorkingPane>
    </AppShell>
  );
}
