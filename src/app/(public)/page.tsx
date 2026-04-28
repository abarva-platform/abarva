import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { MaestroHero } from '@/components/public-site/MaestroHero';
import { ContradictionsScoreboard } from '@/components/public-site/ContradictionsScoreboard';
import { HowItWorks } from '@/components/public-site/HowItWorks';
import { ElevenPlaneDiagram } from '@/components/public-site/ElevenPlaneDiagram';
import { PatternCard } from '@/components/public-site/PatternCard';
import { getPublicPatterns } from '@/lib/public-site/public-patterns';
import { ATLAS_SAMPLE_INSIGHTS } from '@/lib/public-site/atlas-public-scope';
import { getAllEditorialPieces } from '@/lib/public-site/editorial-loader';

export const metadata: Metadata = buildPageMetadata({
  title: 'AbarVa — A knowledge layer for AI programs',
  description:
    '60 patterns. 30 signals. 10 contradictions. Cited reasoning for every decision your AI portfolio depends on.',
});

const ARCH_TEASER_CARDS = [
  {
    title: 'The 5-store knowledge fabric',
    href: '/architecture/knowledge-fabric/',
    description: 'Relational, vector, graph, object, evidence — one corpus.',
  },
  {
    title: 'The four-agent voice model',
    href: '/architecture/agents/',
    description: 'Nexus, Sentinel, Atlas, Steward. Each one does one thing.',
  },
  {
    title: 'JWT-bounded data plane',
    href: '/architecture/data-plane/',
    description: '15-min TTL. Tenant isolation at the storage layer.',
  },
];

export default function HomePage() {
  // Pick 3 representative validated-tier patterns for the Layer 5 teaser
  const teaserPatterns = getPublicPatterns()
    .filter((p) => p.tier === 'validated')
    .slice(0, 3);

  // Atlas: first sample insight for homepage teaser
  const atlasTeaser = ATLAS_SAMPLE_INSIGHTS[0];

  // Editorial: 2 most recent pieces
  const editorialPieces = getAllEditorialPieces().slice(0, 2);

  return (
    <>
      <MaestroHero />
      <ContradictionsScoreboard />
      <HowItWorks />
      {/* Layer 4: Architecture teaser */}
      <section
        id="architecture-teaser"
        style={{
          background: 'var(--pub-paper, #faf7f1)',
          borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          paddingTop: '80px',
          paddingBottom: '80px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          {/* Section header */}
          <div style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'var(--pub-ink, #000)',
                marginBottom: '12px',
              }}
            >
              Architecture, not magic
            </h2>
            <p
              style={{
                fontFamily: 'var(--pub-font-sans, sans-serif)',
                fontSize: '17px',
                lineHeight: 1.6,
                color: 'var(--pub-slate, #5F5E5A)',
                maxWidth: '560px',
              }}
            >
              Eleven planes. Five stores. Four agents. JWT-bounded API surfaces.
            </p>
          </div>

          {/* Mini diagram */}
          <div style={{ marginBottom: '40px', maxWidth: '860px' }}>
            <ElevenPlaneDiagram />
          </div>

          {/* Three architecture teaser cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {ARCH_TEASER_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  display: 'block',
                  background: 'var(--pub-paper, #faf7f1)',
                  border: '1px solid rgba(136,135,128,0.35)',
                  borderRadius: '8px',
                  padding: '20px',
                  textDecoration: 'none',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--pub-font-sans, sans-serif)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--pub-signal, #0066CC)',
                    marginBottom: '6px',
                    lineHeight: 1.3,
                  }}
                >
                  {card.title} →
                </p>
                <p
                  style={{
                    fontFamily: 'var(--pub-font-sans, sans-serif)',
                    fontSize: '13px',
                    color: 'var(--pub-stone, #888780)',
                    lineHeight: 1.5,
                  }}
                >
                  {card.description}
                </p>
              </Link>
            ))}
          </div>

          {/* View full architecture link */}
          <Link
            href="/architecture/"
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '15px',
              color: 'var(--pub-signal, #0066CC)',
              textDecoration: 'none',
            }}
          >
            View full architecture →
          </Link>
        </div>
      </section>

      {/* Layer 5: Patterns teaser */}
      <section
        id="patterns-teaser"
        className="pub-patterns-teaser"
        aria-label="Pattern library teaser"
        style={{
          background: 'var(--pub-navy, #0c1a3a)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '80px',
          paddingBottom: '80px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <div style={{ marginBottom: '40px' }}>
            <h2
              className="pub-patterns-teaser__title"
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                marginBottom: '12px',
              }}
            >
              60 patterns. Every claim cited.
            </h2>
            <p
              style={{
                fontFamily: 'var(--pub-font-sans, sans-serif)',
                fontSize: '17px',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.65)',
                maxWidth: '560px',
              }}
            >
              A structured corpus of enterprise AI operating patterns — each with thesis,
              applicability, evidence, and confidence score.
            </p>
          </div>

          <ul
            className="pub-patterns-teaser__grid"
            role="list"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
              listStyle: 'none',
              padding: 0,
            }}
          >
            {teaserPatterns.map((pattern) => (
              <li key={pattern.id} className="pub-patterns-teaser__grid-item">
                <PatternCard pattern={pattern} />
              </li>
            ))}
          </ul>

          <Link
            href={CANONICAL_URLS.patternIndex}
            className="pub-patterns-teaser__cta"
            aria-label="View all patterns in the library"
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '15px',
              color: 'var(--pub-signal, #0066CC)',
              textDecoration: 'none',
            }}
          >
            View all patterns →
          </Link>
        </div>
      </section>

      {/* Layer 5a: Atlas teaser */}
      <section
        id="atlas-teaser"
        className="pub-atlas-teaser"
        aria-label="Atlas knowledge synthesis teaser"
        style={{
          background: 'var(--pub-paper, #faf7f1)',
          borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          paddingTop: '80px',
          paddingBottom: '80px',
        }}
      >
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
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)',
              gap: '56px',
              alignItems: 'center',
            }}
          >
            {/* Left: copy */}
            <div>
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
                Atlas · Private beta
              </p>
              <h2
                style={{
                  fontFamily: 'var(--pub-font-serif, serif)',
                  fontSize: 'clamp(24px, 3.5vw, 36px)',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '16px',
                }}
              >
                Ask Atlas anything.
              </h2>
              <p
                style={{
                  fontFamily: 'var(--pub-font-sans, sans-serif)',
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: 'var(--pub-slate, #5F5E5A)',
                  marginBottom: '28px',
                }}
              >
                Atlas synthesizes answers from the full AbarVa knowledge corpus — 60 patterns, 30
                signals, and 10 contradictions, all cited.
              </p>
              <Link
                href={CANONICAL_URLS.atlas}
                style={{
                  fontFamily: 'var(--pub-font-sans, sans-serif)',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--pub-signal, #0066CC)',
                  textDecoration: 'none',
                }}
              >
                Learn more →
              </Link>
            </div>

            {/* Right: sample insight card */}
            <div
              style={{
                background: 'var(--pub-navy, #0c1a3a)',
                borderRadius: '10px',
                padding: '28px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <span
                  style={{
                    fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--pub-signal, #0066CC)',
                    background: 'rgba(0,102,204,0.15)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                    marginTop: '2px',
                  }}
                >
                  Q
                </span>
                <p
                  style={{
                    fontFamily: 'var(--pub-font-sans, sans-serif)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ffffff',
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {atlasTeaser.question}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span
                  style={{
                    fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.5)',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                    marginTop: '2px',
                  }}
                >
                  A
                </span>
                <p
                  style={{
                    fontFamily: 'var(--pub-font-sans, sans-serif)',
                    fontSize: '13px',
                    lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.7)',
                    margin: 0,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  } as React.CSSProperties}
                >
                  {atlasTeaser.answer}
                </p>
              </div>
              <div
                style={{
                  marginTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  confidence {Math.round(atlasTeaser.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layer 5b: Editorial teaser */}
      <section
        id="editorial-teaser"
        className="pub-editorial-teaser"
        aria-label="Editorial teaser"
        style={{
          background: 'var(--pub-paper, #faf7f1)',
          borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          paddingTop: '64px',
          paddingBottom: '64px',
        }}
      >
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
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: 'clamp(22px, 3vw, 30px)',
                fontWeight: 500,
                letterSpacing: '-0.015em',
                color: 'var(--pub-ink, #000)',
              }}
            >
              From the research team
            </h2>
            <Link
              href={CANONICAL_URLS.editorialIndex}
              style={{
                fontFamily: 'var(--pub-font-sans, sans-serif)',
                fontSize: '14px',
                color: 'var(--pub-signal, #0066CC)',
                textDecoration: 'none',
              }}
            >
              All articles →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {editorialPieces.map((piece) => (
              <Link
                key={piece.slug}
                href={`/editorial/${piece.slug}/`}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '24px',
                  border: '1px solid rgba(136,135,128,0.25)',
                  borderRadius: '8px',
                  background: 'var(--pub-paper, #faf7f1)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--pub-font-mono, "JetBrains Mono", ui-monospace, monospace)',
                    fontSize: '11px',
                    color: 'var(--pub-stone, #888780)',
                    marginBottom: '8px',
                  }}
                >
                  {piece.readingTime} min read
                </p>
                <p
                  style={{
                    fontFamily: 'var(--pub-font-serif, serif)',
                    fontSize: '18px',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                    color: 'var(--pub-ink, #000)',
                    marginBottom: '8px',
                  }}
                >
                  {piece.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--pub-font-sans, sans-serif)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: 'var(--pub-slate, #5F5E5A)',
                  }}
                >
                  {piece.summary}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
