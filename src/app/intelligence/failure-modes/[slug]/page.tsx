// /intelligence/failure-modes/[slug] · INT-1.7 → INT-2.4 enhancement
//
// J1 failure-mode anchored deep-dive. Renders the failure-mode
// narrative + cited research + example scenarios (INT-1.7) PLUS:
//   - Pattern citations as cards with name + category + 1-line
//     description, linking to /intelligence/patterns/<slug>
//     (INT-2.4 enhancement; replaces monospace-id list).
//   - "Related topics" section listing J1 topics whose
//     associatedFailureModeIds[] includes this failure mode
//     (INT-2.4 new section).
//   - INT-2 coming-soon notice REPLACED with a contextual nav
//     block ("Explore related topics ↓ · Ask Sentinel about
//     this →").
//
// Server component; public route. Per
// INT-2_DETAILED_DESIGN.md §2.4 + §4.3.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  getCanonicalFailureMode,
  getJ0CardBySlug,
} from '@/lib/intelligence/j0-failure-mode-cards';
import { J0_FAILURE_MODE_CARDS, slugifyEditorialName } from '@/lib/intelligence/j0-failure-mode-cards';
import { getTopicsByFailureModeId } from '@/lib/intelligence/j1-topics';
import {
  getPatternManifestEntry,
  patternRouteFor,
} from '@/lib/intelligence/pattern-manifest';
import { J1TelemetryBridge } from '@/components/intelligence/J1TelemetryBridge';
import { J1TopicLink } from '@/components/intelligence/J1TopicLink';
import { getActiveClientRow } from '@/lib/active-client';

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

  // INT-2.4: resolve cited patterns to manifest entries (name +
  // category + description + canonical route). Patterns that fail
  // to resolve are filtered out (validation tests catch this at
  // build, so this is defensive only).
  const patternEntries = card.citedPatternIds
    .map((id) => getPatternManifestEntry(id))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  // INT-2.4: resolve related topics whose associatedFailureModeIds[]
  // includes this card's failureModeId.
  const relatedTopics = getTopicsByFailureModeId(card.failureModeId);

  // INT-2.6: tenant detection for telemetry.
  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantKey = activeClient?.key ?? null;
  const visitorType: 'cold' | 'authenticated' =
    activeClient ? 'authenticated' : 'cold';

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
            <span
              aria-current="page"
              style={{ color: SHELL.INK_MUTED }}
            >
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

          {/* Cited patterns — INT-2.4 enhanced rendering */}
          {patternEntries.length > 0 && (
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
                Patterns · {patternEntries.length}
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                {patternEntries.map((pattern) => (
                  <Link
                    key={pattern.id}
                    href={patternRouteFor(pattern.slug)}
                    data-testid={`intelligence-j1-failure-mode-pattern-card-${pattern.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: SHELL.CARD_WHITE,
                      border: `1px solid ${SHELL.CARD_LINE}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      textDecoration: 'none',
                      color: SHELL.INK,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: SHELL.SERIF,
                        fontSize: 15,
                        fontWeight: 400,
                        color: SHELL.INK,
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {pattern.name}
                    </div>
                    {pattern.category && (
                      <div
                        style={{
                          fontFamily: SHELL.MONO,
                          fontSize: 10,
                          color: SHELL.INK_MUTED,
                          letterSpacing: '0.04em',
                          marginBottom: 6,
                        }}
                      >
                        {pattern.category}
                      </div>
                    )}
                    {pattern.shortDescription && (
                      <p
                        style={{
                          fontFamily: SHELL.SANS,
                          fontSize: 12,
                          color: SHELL.INK_SOFT,
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        {pattern.shortDescription.length > 120
                          ? `${pattern.shortDescription.slice(0, 117)}…`
                          : pattern.shortDescription}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related topics — INT-2.4 new section */}
          {relatedTopics.length > 0 && (
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
                Related topics · {relatedTopics.length}
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {relatedTopics.map((topic) => (
                  <J1TopicLink
                    key={topic.topicId}
                    href={`/intelligence/topics/${topic.topicId}`}
                    eventName="j1_failure_mode_topic_clicked"
                    eventDetail={{ failure_mode_id: card.failureModeId, topic_id: topic.topicId }}
                    testid={`intelligence-j1-failure-mode-related-topic-${topic.topicId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      background: SHELL.CARD_WHITE,
                      border: `1px solid ${SHELL.CARD_LINE}`,
                      borderRadius: 999,
                      textDecoration: 'none',
                      color: SHELL.INK,
                      fontFamily: SHELL.SANS,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{topic.title}</span>
                    <span style={{ color: SHELL.INK_MUTED }}>→</span>
                  </J1TopicLink>
                ))}
              </div>
            </section>
          )}

          {/* INT-2.4 contextual nav (replaces the old "Coming with INT-2"
              notice). Kept brief — the page already has substance. */}
          <aside
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              padding: '14px 18px',
              background: SHELL.PAPER_SOFT,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
            }}
          >
            <Link
              href="/intelligence/ask"
              data-testid="intelligence-j1-failure-mode-ask-sentinel"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: SHELL.INK,
                color: SHELL.PAPER,
                border: `1px solid ${SHELL.INK}`,
                borderRadius: 6,
                textDecoration: 'none',
                fontFamily: SHELL.SANS,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Ask Sentinel about this →
            </Link>
            <Link
              href="/intelligence"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'transparent',
                color: SHELL.INK,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 6,
                textDecoration: 'none',
                fontFamily: SHELL.SANS,
                fontSize: 13,
              }}
            >
              ← All failure modes
            </Link>
          </aside>

          {/* Telemetry: bridge listens for j1_failure_mode_topic_clicked
              dispatched by the related-topic chips above. */}
          <J1TelemetryBridge
            tenantKey={tenantKey}
            visitorType={visitorType}
            surface="failure_mode_page"
          />
        </div>
      </div>
    </AppShell>
  );
}
