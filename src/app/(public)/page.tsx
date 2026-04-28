import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { MaestroHero } from '@/components/public-site/MaestroHero';

export const metadata: Metadata = buildPageMetadata({
  title: 'AbarVa — A knowledge layer for AI programs',
  description:
    '60 patterns. 30 signals. 10 contradictions. Cited reasoning for every decision your AI portfolio depends on.',
});

export default function HomePage() {
  return (
    <>
      <MaestroHero />
    </>
  );
}
