// /home/learn/<section>/<slug> · per-entry sub-page.
// Falls back to the generic section placeholder for any unmatched slug.

import { notFound } from 'next/navigation';
import { LearnSectionPlaceholder } from '@/components/home/LearnSectionPlaceholder';
import { findLearnSection } from '@/lib/home/learn-sections';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ section: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { section, slug } = await params;
  return { title: `${slug} · ${section} · Learn | AbarVa` };
}

export default async function LearnSubPage({ params }: Props) {
  const { section, slug } = await params;
  const def = findLearnSection(section);
  if (!def) notFound();

  const known = def.sampleSubPages?.find((p) => p.slug === slug);
  const subPage = known ?? { slug, label: slug };

  return <LearnSectionPlaceholder section={def} subPage={subPage} />;
}
