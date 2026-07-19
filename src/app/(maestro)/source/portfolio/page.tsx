import { SourcePortfolioPage } from '@/components/source/SourcePortfolioPage';
import { SourcePortfolioBookPage } from '@/components/source/SourcePortfolioBookPage';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { listSourcingEvents } from '@/lib/source/queries';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';

export const metadata = { title: 'Source Portfolio · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * The table-forward Source command-center. This was the `/source` landing
 * until the iteration-2 punch-list moved the Decision Queue into that slot
 * (see `../page.tsx`). The portfolio view stays reachable here for users who
 * want the full event table rather than the triggered-decision inbox.
 */
export default async function SourcePortfolioRoute({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; status?: string; demo?: string }>;
}) {
  const [events, params, activeClient, tenancy] = await Promise.all([
    listSourcingEvents(),
    searchParams,
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  const sourceAccessPolicy = activeClient && tenancy
    ? await loadUserSourceAccessPolicy(tenancy, { activeClientKey: activeClient.key }).catch(() => null)
    : null;
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';

  // source_analytics · the redesigned "Your sourcing book" home. Platform
  // default ON: every Source tenant should render the realigned book. The table
  // fallback remains only as emergency rollback plumbing.
  const sourceAnalyticsEnabled = isFeatureEnabled(
    { clientKey: activeClient?.key ?? null, clientId: activeClient?.id ?? null },
    'source_analytics',
  );
  const canViewFinancialValues = sourceAccessPolicy?.canViewFinancialData === true;

  if (sourceAnalyticsEnabled) {
    return (
      <SourcePortfolioBookPage
        events={events}
        tenantName={activeClientDisplayName}
        canViewFinancialValues={canViewFinancialValues}
      />
    );
  }

  return (
    <SourcePortfolioPage
      events={events}
      searchParams={params}
      tenantName={activeClientDisplayName}
      canViewFinancialValues={canViewFinancialValues}
    />
  );
}
