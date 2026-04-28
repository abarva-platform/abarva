import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';

export const metadata: Metadata = buildPageMetadata({
  title: 'AbarVa — A knowledge layer for AI programs',
  description:
    '60 patterns. 30 signals. 10 contradictions. Cited reasoning for every decision your AI portfolio depends on.',
});

export default function HomePage() {
  return (
    <>
      {/* Hero placeholder — PUB-2 replaces this with MaestroHero */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '56px 32px 80px',
          background: 'var(--pub-paper)',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--pub-font-serif)',
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--pub-ink)',
            maxWidth: '820px',
            marginBottom: '24px',
          }}
        >
          A knowledge layer for AI programs.
        </h1>
        <p
          style={{
            fontFamily: 'var(--pub-font-sans)',
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            lineHeight: 1.6,
            color: 'var(--pub-slate)',
            maxWidth: '640px',
            marginBottom: '40px',
          }}
        >
          60 patterns. 30 signals. 10 contradictions. Cited reasoning for every decision your AI
          portfolio depends on.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="/atlas/"
            style={{
              fontFamily: 'var(--pub-font-sans)',
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              background: 'var(--pub-signal)',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 28px',
              textDecoration: 'none',
            }}
          >
            Search the corpus
          </a>
          <a
            href="#how-it-works"
            style={{
              fontFamily: 'var(--pub-font-sans)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--pub-ink)',
              background: 'transparent',
              border: '1.5px solid var(--pub-ink)',
              borderRadius: '8px',
              padding: '14px 28px',
              textDecoration: 'none',
            }}
          >
            How it works
          </a>
        </div>
      </section>
    </>
  );
}
