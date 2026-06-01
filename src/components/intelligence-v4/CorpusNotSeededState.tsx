'use client';

// CorpusNotSeededState · honest empty state for the Brief / Map corpus
// stages when the active tenant has no real seeded Intelligence corpus.
//
// No-fabrication rule: every figure on the Intelligence surface must
// trace to that tenant's real seeded substrate. When the server cannot
// bind an explicit tenant corpus payload, Brief and Map render this
// honest "not yet seeded" state instead of inventing ranked bets,
// values, pattern deltas, or source-backed coverage.
//
// Visual language is borrowed from the existing honest empty states on
// this surface (StrategicPatternsList → StrategicPatternsEmptyState):
// soft paper panel, mono eyebrow, Fraunces headline, Inter body.

import Link from 'next/link';

const F_DISPLAY = 'var(--font-fraunces), Georgia, serif';
const F_BODY = 'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const F_MONO = 'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  faint: '#6B7280',
  navy: '#1B2B5C',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
  surface2: '#FBFAF7',
};

interface Props {
  /** 'brief' or 'map' — drives the headline copy only. */
  stage: 'brief' | 'map';
  /** Active tenant display name, e.g. "Meridian Health System". */
  tenantName: string;
}

export function CorpusNotSeededState({ stage, tenantName }: Props) {
  const stageLabel = stage === 'brief' ? 'The Brief' : 'The Map';
  const headline =
    stage === 'brief'
      ? `${tenantName}'s Intelligence corpus is not yet seeded.`
      : `${tenantName}'s Intelligence landscape is not yet seeded.`;

  return (
    <div
      data-testid={`intelligence-${stage}-not-seeded`}
      style={{
        background: C.surface,
        fontFamily: F_BODY,
        color: C.body,
        minHeight: 'calc(100vh - 112px)',
      }}
    >
      <main style={{ padding: '28px clamp(28px, 4vw, 64px) 80px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: C.faint,
              marginBottom: 18,
            }}
          >
            INTELLIGENCE · <span style={{ color: C.ink }}>{stageLabel.toUpperCase()}</span>
          </div>

          <section
            aria-label={`${stageLabel} not yet seeded`}
            style={{
              background: C.surface2,
              border: `1px solid ${C.borderLight}`,
              borderLeft: `4px solid ${C.navy}`,
              borderRadius: 8,
              padding: '32px clamp(24px, 3vw, 40px)',
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <p
                style={{
                  margin: '0 0 8px',
                  fontFamily: F_MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: C.faint,
                }}
              >
                Corpus not yet seeded
              </p>
              <h1
                style={{
                  margin: '0 0 12px',
                  fontFamily: F_DISPLAY,
                  fontSize: 'clamp(24px, 2.6vw, 32px)',
                  fontWeight: 520,
                  lineHeight: 1.12,
                  letterSpacing: '-0.012em',
                  color: C.ink,
                }}
              >
                {headline}
              </h1>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: C.body,
                }}
              >
                {stageLabel} synthesizes ranked AI bets, patterns, and the
                portfolio landscape from this tenant&apos;s seeded Intelligence
                corpus. {tenantName} has no corpus loaded yet, so there is
                nothing here to show.
              </p>
              <p
                style={{
                  margin: '0 0 20px',
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: C.faint,
                }}
              >
                AbarVa will never invent figures to fill this space — every
                number on the Intelligence surface traces to real seeded
                substrate. The other Intelligence stages
                (Today, Patterns, By function, and the rest) still build from
                this tenant&apos;s live initiatives.
              </p>
              <Link
                href="/intelligence#today"
                prefetch={false}
                style={{
                  display: 'inline-block',
                  fontFamily: F_MONO,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '9px 14px',
                  borderRadius: 4,
                  textDecoration: 'none',
                  border: `1px solid ${C.ink}`,
                  background: C.ink,
                  color: C.surface,
                }}
              >
                Go to Today
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
