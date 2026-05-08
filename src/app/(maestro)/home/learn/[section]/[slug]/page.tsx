// /home/learn/<section>/<slug> · per-entry page.
// Known training guides render via LearnTrainingFrame (full-height iframe).
// All other slugs fall back to the generic placeholder.

import { notFound } from 'next/navigation';
import { LearnSectionPlaceholder } from '@/components/home/LearnSectionPlaceholder';
import { LearnTrainingFrame } from '@/components/home/LearnTrainingFrame';
import { findLearnSection } from '@/lib/home/learn-sections';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Map section/slug → static training asset + readable title.
const TRAINING_GUIDES: Record<string, { src: string; title: string }> = {
  'workflows/originate-a-move': {
    src: '/training/how-to-create-a-move.html',
    title: 'How to Create a Strategic Move — AbarVa Training Guide',
  },
};

interface Props {
  params: Promise<{ section: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { section, slug } = await params;
  const guide = TRAINING_GUIDES[`${section}/${slug}`];
  if (guide) return { title: `${guide.title} · Learn | AbarVa` };
  return { title: `${slug} · ${section} · Learn | AbarVa Home` };
}

export default async function LearnSubPage({ params }: Props) {
  const { section, slug } = await params;
  const def = findLearnSection(section);
  if (!def) notFound();

  const guide = TRAINING_GUIDES[`${section}/${slug}`];
  const known = def.sampleSubPages?.find((p) => p.slug === slug);
  const subPage = known ?? { slug, label: slug };

  if (guide) {
    return (
      <LearnTrainingFrame
        src={guide.src}
        title={guide.title}
        sectionLabel={def.label}
        subPageLabel={subPage.label}
        sectionRoute={def.routeSegment}
      />
    );
  }

  return <LearnSectionPlaceholder section={def} subPage={subPage} />;
}
