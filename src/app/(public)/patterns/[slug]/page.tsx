import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPatternDetail } from '@/components/public-pattern/PublicPatternDetail';
import { getPublicPatternBySlug, getPublicPatternSample } from '@/lib/public-patterns/curated-list';

export function generateStaticParams() {
  return getPublicPatternSample().map((pattern) => ({ slug: pattern.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pattern = getPublicPatternBySlug(slug);

  if (!pattern) {
    return { title: 'Pattern not found | AbarVa' };
  }

  return {
    title: `${pattern.title} | Public Pattern Sample`,
    description: pattern.publicSummary,
  };
}

export default async function PublicPatternDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = getPublicPatternBySlug(slug);

  if (!pattern) {
    notFound();
  }

  return <PublicPatternDetail pattern={pattern} />;
}
