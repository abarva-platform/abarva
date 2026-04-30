import { SourcePortfolioPage } from '@/components/source/SourcePortfolioPage';
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
  const [events, params] = await Promise.all([listSourcingEvents(), searchParams]);

  return <SourcePortfolioPage events={events} searchParams={params} />;
}
