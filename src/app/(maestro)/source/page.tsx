import { SourcePortfolioPage } from '@/components/source/SourcePortfolioPage';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { listSourcingEvents } from '@/lib/source/queries';

export const metadata = { title: 'Source · AbarVa' };
export const dynamic = 'force-dynamic';

// SourcePortfolioPage is the table-forward command-center entry; the legacy
// SourceIndexPage remains available only as a deterministic reference surface.

export default async function SourcePage({
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

  return (
    <SourcePortfolioPage
      events={events}
      searchParams={params}
      tenantName={activeClient?.name ?? 'AbarVa Client'}
      canViewFinancialValues={sourceAccessPolicy?.canViewFinancialData === true}
    />
  );
}
