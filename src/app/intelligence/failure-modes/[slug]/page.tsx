// /intelligence/failure-modes/[slug] · INT-1.7
//
// J1-shaped placeholder page that renders the full failure-mode
// narrative from the J0 card registry plus a "Coming with INT-2"
// notice. Per INT-1_DETAILED_DESIGN.md §9 D2: the deep-link gives
// the user something substantive (the full narrative they would
// have seen in J1 anyway) until the topic surface lands at INT-2.
//
// Server component; no client islands. Public route (auth-gate
// removed in INT-1.3). The headline failure mode + cited research +
// example scenarios all render inline.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  getCanonicalFailureMode,
  getJ0CardBySlug,
} from '@/lib/intelligence/j0-failure-mode-cards';
import { J0_FAILURE_MODE_CARDS, slugifyEditorialName } from '@/lib/intelligence/j0-failure-mode-cards';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const card = getJ0CardBySlug(slug);
  if (!card) {
    return { title: 'Not found · Intelligence | AbarVa' };
  }
  return {
    title: `${card.editorialName} · Intelligence | AbarVa`,
    description: card.oneLineHook,
  };
}

export async function generateStaticParams() {
  return J0_FAILURE_MODE_CARDS.map((card) => ({
    slug: slugifyEditorialName(card.editorialName),
  }));
}

export default async function FailureModePage({ params }: PageProps) {
  const { slug } = await params;
  const card = getJ0CardBySlug(slug);
  if (!card) {
    notFound();
  }
  const canonical = getCanonicalFailureMode(card);

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Intelligence · ${card.editorialName}`,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          data-testid="intelligence-failure-mode-page"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: SHELL.PAPER,
            padding: '32px 48px 64px',
            maxWidth: 880,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginBottom: 20,
            }}
          >
            <Link
              href="/intelligence"
              style={{
                color: SHELL.INK_SOFT,
                textDecoration: 'none',
              }}
            >
              ← Intelligence
            </Link>
            <span style={{ margin: '0 8px' }}>·</span>
            <span style={{ color: SHELL.INK_MUTED }}>
              #{card.failureModeId} {canonical.name}
            </span>
          </nav>

          {/* Header */}
          <header style={{ marginBottom: 32 }}>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Failure mode #{card.failureModeId}
            </div>
            <h1
              style={{
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 400,
                color: SHELL.INK,
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
              }}
            >
              {card.editorialName}
            </h1>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 16,
                color: SHELL.INK_SOFT,
                lineHeight: 1.55,
                margin: '14px 0 0',
                maxWidth: 640,
              }}
            >
              {card.oneLineHook}
            </p>
          </header>

          {/* Expanded narrative */}
          <section style={{ marginBottom: 32 }}>
            {card.expandedNarrative
              .split('\n\n')
              .map((para, idx) => (
                <p
                  key={idx}
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 14.5,
                    color: SHELL.INK,
                    lineHeight: 1.65,
                    margin: '0 0 16px',
                  }}
                >
                  {para.trim()}
                </p>
              ))}
          </section>

          {/* Why it kills */}
          <section style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                margin: '0 0 10px',
              }}
            >
              Why it kills programs
            </h2>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                color: SHELL.INK,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {card.whyItKills}
            </p>
          </section>

          {/* What good looks like */}
          <section style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.MINT_TEXT,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                margin: '0 0 10px',
              }}
            >
              What good looks like
            </h2>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                color: SHELL.INK,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {card.whatGoodLooksLike}
            </p>
          </section>

          {/* Research anchors */}
          <section style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                margin: '0 0 12px',
              }}
            >
              Research anchors · {card.citedResearch.length}
            </h2>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {card.citedResearch.map((ref, idx) => (
                <li
                  key={idx}
                  style={{
                    paddingLeft: 12,
                    borderLeft: `2px solid ${SHELL.CARD_LINE}`,
                    fontFamily: SHELL.SANS,
                    fontSize: 13,
                    color: SHELL.INK_SOFT,
                    lineHeight: 1.55,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginRight: 8,
                      fontWeight: 600,
                    }}
                  >
                    {ref.source}
                  </span>
                  {ref.citation}
                </li>
              ))}
            </ul>
          </section>

          {/* Example scenarios */}
          <section style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                margin: '0 0 12px',
              }}
            >
              Example scenarios · {card.exampleScenarios.length}
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {card.exampleScenarios.map((scenario, idx) => (
                <article
                  key={idx}
                  style={{
                    background: SHELL.CARD_WHITE,
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: 8,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK_MUTED,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    {scenario.industryContext}
                  </div>
                  <p
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 13,
                      color: SHELL.INK,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {scenario.scenario}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* INT-2 notice */}
          <aside
            style={{
              padding: '14px 18px',
              background: SHELL.PAPER_SOFT,
              border: `1px dashed ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              lineHeight: 1.55,
              marginBottom: 16,
            }}
          >
            <strong style={{ color: SHELL.INK }}>Coming with INT-2:</strong>{' '}
            this page becomes the J1 oriented-browse surface — pattern depth,
            graph traversal, and contradictions surfaced inline. Today you
            see the full failure-mode narrative; the topic deep-dive is on
            the way.
          </aside>

          {/* Cited patterns — preview */}
          {card.citedPatternIds.length > 0 && (
            <section>
              <h2
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  margin: '0 0 12px',
                }}
              >
                Patterns · {card.citedPatternIds.length}
              </h2>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {card.citedPatternIds.map((id) => (
                  <li
                    key={id}
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 11,
                      color: SHELL.INK_SOFT,
                    }}
                  >
                    {id}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
