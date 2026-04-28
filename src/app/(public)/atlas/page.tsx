import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { ATLAS_SAMPLE_INSIGHTS } from '@/lib/public-site/atlas-public-scope';
import { PublicAtlas } from '@/components/public-site/PublicAtlas';

export const metadata: Metadata = buildPageMetadata({
  title: 'Atlas — AI research assistant',
  description:
    'Atlas is an AI research assistant trained exclusively on the AbarVa knowledge corpus — 60 patterns, 30 signals, and 10 contradictions, all cited.',
  alternates: {
    canonical: CANONICAL_URLS.atlas,
  },
  openGraph: {
    url: CANONICAL_URLS.atlas,
    title: 'Atlas — AI research assistant | AbarVa',
    description:
      'Ask Atlas anything about your AI program. Private beta — request early access.',
  },
});

export default function AtlasPage() {
  return (
    <main
      style={{
        background: 'var(--pub-paper, #faf7f1)',
        minHeight: '100vh',
        paddingBottom: '80px',
      }}
    >
      {/* Hero */}
      <section
        className="pub-atlas-hero-section"
        style={{
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '32px',
          paddingRight: '32px',
          paddingTop: '80px',
          paddingBottom: '64px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--pub-signal, #0066CC)',
            marginBottom: '16px',
          }}
        >
          Atlas · Knowledge synthesis
        </p>

        <h1
          style={{
            fontFamily: 'var(--pub-font-serif, serif)',
            fontSize: 'clamp(36px, 5vw, 52px)',
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: 'var(--pub-ink, #000)',
            maxWidth: '740px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '20px',
          }}
        >
          Ask Atlas anything about your AI program.
        </h1>

        <p
          style={{
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '18px',
            lineHeight: 1.65,
            color: 'var(--pub-slate, #5F5E5A)',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '0',
          }}
        >
          Atlas is an AI research assistant trained exclusively on the AbarVa knowledge corpus —{' '}
          <strong style={{ color: 'var(--pub-ink, #000)', fontWeight: 600 }}>60 patterns</strong>,{' '}
          <strong style={{ color: 'var(--pub-ink, #000)', fontWeight: 600 }}>30 signals</strong>,
          and{' '}
          <strong style={{ color: 'var(--pub-ink, #000)', fontWeight: 600 }}>
            10 contradictions
          </strong>
          , all cited.
        </p>
      </section>

      {/* Divider */}
      <div
        style={{
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '32px',
          paddingRight: '32px',
        }}
      >
        <div
          style={{ height: '1px', background: 'var(--pub-rule, rgba(136,135,128,0.25))', marginBottom: '64px' }}
        />
      </div>

      {/* Atlas component with sample insights */}
      <section
        style={{
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '32px',
          paddingRight: '32px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--pub-stone, #888780)',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          Sample insights from the corpus
        </h2>
        <PublicAtlas insights={ATLAS_SAMPLE_INSIGHTS} />
      </section>
    </main>
  );
}
