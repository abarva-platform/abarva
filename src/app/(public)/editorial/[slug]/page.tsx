import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import {
  EDITORIAL_SLUGS,
  getAllEditorialPieces,
  getEditorialPiece,
} from '@/lib/public-site/editorial-loader';
import { EditorialPiece } from '@/components/public-site/EditorialPiece';

export function generateStaticParams() {
  return EDITORIAL_SLUGS.map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const piece = getEditorialPiece(slug);
  if (!piece) return {};

  return buildPageMetadata({
    title: piece.title,
    description: piece.summary,
    alternates: {
      canonical: CANONICAL_URLS.editorial(slug),
    },
    openGraph: {
      url: CANONICAL_URLS.editorial(slug),
      title: `${piece.title} | AbarVa`,
      description: piece.summary,
    },
  });
}

export default async function EditorialDetailPage({ params }: Props) {
  const { slug } = await params;
  const piece = getEditorialPiece(slug);

  if (!piece) {
    notFound();
  }

  const allPieces = getAllEditorialPieces();
  const otherPieces = allPieces
    .filter((p) => p.slug !== slug)
    .map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <main
      style={{
        background: 'var(--pub-paper, #faf7f1)',
        minHeight: '100vh',
        paddingBottom: '80px',
      }}
    >
      <section
        style={{
          maxWidth: '860px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '32px',
          paddingRight: '32px',
          paddingTop: '64px',
        }}
      >
        <EditorialPiece piece={piece} otherPieces={otherPieces} />
      </section>
    </main>
  );
}
