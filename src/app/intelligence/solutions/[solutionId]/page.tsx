// INT-DTL-SOLUTION — Intelligence solution detail reading view.
// I5: New server-component route for individual solution archetypes.
// View model built server-side via buildIntelligenceSolutionDetailView().
// Unknown solutionId redirects to the solutions index.

import { redirect } from 'next/navigation';
import { IntelligenceSolutionDetailPage } from '@/components/intelligence/IntelligenceSolutionDetailPage';
import {
  buildIntelligenceSolutionDetailView,
  getKnownSolutionIds,
} from '@/lib/intelligence/intelligence-solution-detail-view';

export function generateStaticParams() {
  return getKnownSolutionIds().map((solutionId) => ({ solutionId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ solutionId: string }>;
}) {
  const { solutionId } = await params;
  const view = buildIntelligenceSolutionDetailView(solutionId);
  if (!view) return { title: 'Solution · Intelligence' };
  return { title: `${view.name} · Solution · Intelligence` };
}

export default async function SolutionDetailRoute({
  params,
}: {
  params: Promise<{ solutionId: string }>;
}) {
  const { solutionId } = await params;
  const view = buildIntelligenceSolutionDetailView(solutionId);

  if (!view) {
    redirect('/intelligence/solutions');
  }

  return <IntelligenceSolutionDetailPage view={view} />;
}
