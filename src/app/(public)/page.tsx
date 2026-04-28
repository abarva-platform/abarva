import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { MaestroHero } from '@/components/public-site/MaestroHero';
import { ContradictionsScoreboard } from '@/components/public-site/ContradictionsScoreboard';
import { HowItWorks } from '@/components/public-site/HowItWorks';
import { ElevenPlaneDiagram } from '@/components/public-site/ElevenPlaneDiagram';

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
    </>
  );
}
