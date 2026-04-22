import { notFound } from 'next/navigation';
import { IndustryCompositionPage } from '@/components/intelligence/IndustryCompositionPage';
import { getTopicIndustryComposition } from '@/lib/intelligence/industry-compositions';
import type { IndustryVerticalKey } from '@/lib/intelligence/industry-knowledge';

export const dynamic = 'force-dynamic';

export default async function TopicIndustryCompositionRoute({
  params,
}: {
  params: Promise<{ topicKey: string; verticalKey: IndustryVerticalKey }>;
}) {
  const { topicKey, verticalKey } = await params;
  const composition = getTopicIndustryComposition(topicKey, verticalKey);
  if (composition === null) notFound();

  return (
    <IndustryCompositionPage
      composition={composition}
      backHref={`/intelligence/topics/${encodeURIComponent(topicKey)}`}
      backLabel="back to topic"
      anchorHref={`/intelligence/topics/${encodeURIComponent(topicKey)}`}
      anchorLabel="See the base topic page"
    />
  );
}
