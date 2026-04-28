import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import {
  getPublicPatterns,
  getPublicPatternBySlug,
  getDomainLabel,
} from '@/lib/public-site/public-patterns';
import { PatternDetail } from '@/components/public-site/PatternDetail';

export function generateStaticParams() {
  return getPublicPatterns().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pattern = getPublicPatternBySlug(slug);

  if (!pattern) {
    return { title: 'Pattern not found | AbarVa' };
  }

  const categoryLabel = getDomainLabel(pattern.domain);

  return buildPageMetadata({
    title: pattern.title,
    description: pattern.thesis,
    openGraph: {
      url: CANONICAL_URLS.patterns(slug),
      title: `${pattern.title} | AbarVa Pattern`,
      description: pattern.thesis,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pattern.title} | AbarVa Pattern`,
      description: pattern.thesis,
    },
    keywords: [
      'AbarVa pattern',
      categoryLabel,
      pattern.vertical,
      'enterprise AI',
      'AI governance',
    ],
  });
}

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pattern = getPublicPatternBySlug(slug);

  if (!pattern) {
    notFound();
  }

  return <PatternDetail pattern={pattern} />;
}
