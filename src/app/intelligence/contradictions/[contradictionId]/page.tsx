// INT-DTL-CONTRADICTION — Intelligence contradiction detail reading view.
// I5: New server-component route for individual contradiction records.
// The most distinctive surface in Intelligence — a conflict, made explicit.
// View model built server-side via buildIntelligenceContradictionDetailView().
// Unknown contradictionId redirects to the library index.

import { redirect } from 'next/navigation';
import { IntelligenceContradictionDetailPage } from '@/components/intelligence/IntelligenceContradictionDetailPage';
import { getActiveClientRow } from '@/lib/active-client';
import {
  buildIntelligenceContradictionDetailView,
} from '@/lib/intelligence/intelligence-contradiction-detail-view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ contradictionId: string }>;
}) {
  const { contradictionId } = await params;
  const view = buildIntelligenceContradictionDetailView(contradictionId);
  if (!view) return { title: 'Contradiction · Intelligence' };
  return { title: `${contradictionId.toUpperCase()} · Contradiction · Intelligence` };
}

export default async function ContradictionDetailRoute({
  params,
}: {
  params: Promise<{ contradictionId: string }>;
}) {
  const { contradictionId } = await params;
  const view = buildIntelligenceContradictionDetailView(contradictionId);

  if (!view) {
    redirect('/intelligence');
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  return (
    <IntelligenceContradictionDetailPage
      view={view}
      tenantName={activeClient?.name ?? 'Client workspace'}
    />
  );
}
