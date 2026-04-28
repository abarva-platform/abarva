// INT-DTL — Shell-native Intelligence pattern detail reading view.
// I2: PatternDetailPage (client component) replaced by IntelligencePatternDetailPage
// (server component) with ProvenanceRibbon. View model built server-side via
// buildIntelligencePatternDetailView(). Pattern content is now correct per
// patternId (previously hardcoded to T3-H01).

import { redirect } from 'next/navigation';
import { IntelligencePatternDetailPage } from '@/components/intelligence/IntelligencePatternDetailPage';
import {
  buildIntelligencePatternDetailView,
  getKnownPatternIds,
} from '@/lib/intelligence/intelligence-pattern-detail-view';

export function generateStaticParams() {
  return getKnownPatternIds().map((patternId) => ({ patternId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;
  const view = buildIntelligencePatternDetailView(patternId);
  if (!view) return { title: 'Pattern · Intelligence' };
  return { title: `${view.patternKey} · ${view.patternName} · Intelligence` };
}

export default async function PatternDetailRoute({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;
  const view = buildIntelligencePatternDetailView(patternId);

  if (!view) {
    // Unknown pattern ID — redirect to library index.
    redirect('/intelligence');
  }

  return <IntelligencePatternDetailPage view={view} />;
}
