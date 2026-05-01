import { Metadata } from 'next';
import { HomeIndexPage } from '@/components/home/HomeIndexPage';
import { getActiveClientRow } from '@/lib/active-client';
import { buildReasoningDashboardSummary } from '@/lib/reasoning/dashboard-summary';

export const metadata: Metadata = { title: 'Home · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const reasoning = buildReasoningDashboardSummary();
  return (
    <HomeIndexPage
      activeTenantName={activeClient?.name ?? 'AbarVa Client'}
      hasTenantKey={Boolean(activeClient)}
      reasoning={reasoning}
    />
  );
}
