import { SourcePortfolioPage } from '@/components/source/SourcePortfolioPage';
import { listSourcingEvents } from '@/lib/source/queries';

export const metadata = { title: 'Source · AbarVa' };
export const dynamic = 'force-dynamic';

// SourceIndexPage remains the legacy deterministic dashboard reference;
// SourcePortfolioPage keeps that seeded portfolio content below the new
// Sentinel canvas instead of rendering the old two-column route directly.

export default async function SourcePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; status?: string; demo?: string }>;
}) {
  const [events, params] = await Promise.all([listSourcingEvents(), searchParams]);

  return <SourcePortfolioPage events={events} searchParams={params} />;
}
