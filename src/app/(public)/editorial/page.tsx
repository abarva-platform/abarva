import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { getAllEditorialPieces } from '@/lib/public-site/editorial-loader';

export const metadata: Metadata = buildPageMetadata({
  title: 'Editorial',
  description:
    'Analysis from the AbarVa research team — AI program management, knowledge infrastructure, and organizational patterns.',
  alternates: {
    canonical: CANONICAL_URLS.editorialIndex,
  },
  openGraph: {
    url: CANONICAL_URLS.editorialIndex,
  },
});

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function EditorialIndexPage() {
  const pieces = getAllEditorialPieces();

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
          paddingTop: '80px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '56px' }}>
          <h1
            style={{
              fontFamily: 'var(--pub-font-serif, serif)',
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: 'var(--pub-ink, #000)',
              marginBottom: '12px',
            }}
          >
            Editorial
          </h1>
          <p
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '17px',
              lineHeight: 1.6,
              color: 'var(--pub-slate, #5F5E5A)',
            }}
          >
            Analysis from the AbarVa research team.
          </p>
        </div>

        {/* Article list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {pieces.map((piece, idx) => (
            <article
              key={piece.slug}
              style={{
                paddingTop: idx === 0 ? '0' : '32px',
                paddingBottom: '32px',
                borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '10px',
                }}
              >
                <time
                  dateTime={piece.publishedAt}
                  style={{
                    fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
                    fontSize: '12px',
                    color: 'var(--pub-stone, #888780)',
                  }}
                >
                  {formatDate(piece.publishedAt)}
                </time>
                <span style={{ color: 'var(--pub-stone, #888780)', fontSize: '12px' }}>·</span>
                <span
                  style={{
                    fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
                    fontSize: '12px',
                    color: 'var(--pub-stone, #888780)',
                  }}
                >
                  {piece.readingTime} min read
                </span>
              </div>

              <h2
                style={{
                  fontFamily: 'var(--pub-font-serif, serif)',
                  fontSize: 'clamp(20px, 2.5vw, 26px)',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  letterSpacing: '-0.015em',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '10px',
                }}
              >
                <Link
                  href={`/editorial/${piece.slug}/`}
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  {piece.title}
                </Link>
              </h2>

              <p
                style={{
                  fontFamily: 'var(--pub-font-sans, sans-serif)',
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: 'var(--pub-slate, #5F5E5A)',
                  marginBottom: '14px',
                  maxWidth: '640px',
                }}
              >
                {piece.summary}
              </p>

              <Link
                href={`/editorial/${piece.slug}/`}
                style={{
                  fontFamily: 'var(--pub-font-sans, sans-serif)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--pub-signal, #0066CC)',
                  textDecoration: 'none',
                }}
              >
                Read →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
