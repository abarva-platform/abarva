import { Metadata } from 'next';
import { HomeIndexPage } from '@/components/home/HomeIndexPage';
import { buildReasoningDashboardSummary } from '@/lib/reasoning/dashboard-summary';

export const metadata: Metadata = { title: 'Home · AbarVa' };

export default function HomePage() {
  const reasoning = buildReasoningDashboardSummary();
  return <HomeIndexPage reasoning={reasoning} />;
}
