// /home/learn/<section> · per-section placeholder.

import { notFound } from 'next/navigation';
import { LearnSectionPlaceholder } from '@/components/home/LearnSectionPlaceholder';
import { findLearnSection } from '@/lib/home/learn-sections';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ section: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { section } = await params;
  const def = findLearnSection(section);
  return { title: `${def?.label ?? section} · Learn | AbarVa Home` };
}

export default async function LearnSectionPage({ params }: Props) {
  const { section } = await params;
  const def = findLearnSection(section);
  if (!def) notFound();
  return <LearnSectionPlaceholder section={def} />;
}
