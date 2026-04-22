import { notFound } from 'next/navigation';
import { IndustryCompositionPage } from '@/components/intelligence/IndustryCompositionPage';
import { getPatternIndustryComposition } from '@/lib/intelligence/industry-compositions';
import type { IndustryVerticalKey } from '@/lib/intelligence/industry-knowledge';

export const dynamic = 'force-dynamic';

export default async function PatternIndustryCompositionRoute({
  params,
}: {
  params: Promise<{ patternKey: string; verticalKey: IndustryVerticalKey }>;
}) {
  const { patternKey, verticalKey } = await params;
  const composition = getPatternIndustryComposition(patternKey, verticalKey);
  if (composition === null) notFound();

  return (
    <IndustryCompositionPage
      composition={composition}
      backHref={`/intelligence/patterns/${encodeURIComponent(patternKey)}`}
      backLabel="back to pattern"
      anchorHref={`/intelligence/patterns/${encodeURIComponent(patternKey)}`}
      anchorLabel="See the base pattern page"
    />
  );
}
