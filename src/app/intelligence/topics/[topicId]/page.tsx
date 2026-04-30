// /intelligence/topics/[topicId] · INT-2.4
//
// J1 topic deep-dive page. Server component, public route. Renders:
//   - Breadcrumb (Intelligence → Topics → <title>)
//   - Topic title + thesis
//   - Two-column "What industry gets wrong" / "What good looks like"
//     (collapses to single-column on mobile via flex-wrap)
//   - Associated patterns (cards with name + category + link to
//     /intelligence/patterns/<slug>)
//   - Related failure modes (link cards back to
//     /intelligence/failure-modes/<slug>)
//   - Example program archetypes (chip list)
//   - Affordances: "Ask Sentinel about this topic →" + back to topics
//
// Per docs/build/intelligence/INT-2_DETAILED_DESIGN.md §4.2 + §2.3.
//
// generateStaticParams() pre-renders all 10 canonical topic IDs at
// build. Unknown topicIds → notFound() → 404.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  J1_TOPICS,
  getTopicById,
} from '@/lib/intelligence/j1-topics';
import { FAILURE_MODES } from '@/lib/programs/failure-modes';
import {
  getPatternManifestEntry,
  patternRouteFor,
} from '@/lib/intelligence/pattern-manifest';
import { J0_FAILURE_MODE_CARDS, slugifyEditorialName } from '@/lib/intelligence/j0-failure-mode-cards';

interface PageProps {
  params: Promise<{ topicId: string }>;
}

export async function generateStaticParams() {
  return J1_TOPICS.map((t) => ({ topicId: t.topicId }));
}

export async function generateMetadata({ params }: PageProps) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);
  if (!topic) {
    return { title: 'Not found · Intelligence | AbarVa' };
  }
  return {
    title: `${topic.title} · Topics · Intelligence | AbarVa`,
    description: topic.thesis.slice(0, 160),
  };
}

// Resolve a failure-mode slug for cross-linking back to /intelligence/failure-modes/<slug>.
// Editorial slug (e.g. 'phantom-sponsor') is what /intelligence/failure-modes/<slug> uses.
function failureModeSlug(failureModeId: number): string | null {
  const card = J0_FAILURE_MODE_CARDS.find((c) => c.failureModeId === failureModeId);
  if (!card) return null;
  return slugifyEditorialName(card.editorialName);
}

export default async function TopicDeepDivePage({ params }: PageProps) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);
  if (!topic) {
    notFound();
  }

  // Resolve associated patterns (manifest entries) — render only those that resolve.
  const patternEntries = topic.associatedPatternIds
    .map((id) => getPatternManifestEntry(id))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  // Resolve associated failure modes — both canonical FAILURE_MODES and editorial slug.
  const relatedFailureModes = topic.associatedFailureModeIds
    .map((id) => {
      const mode = FAILURE_MODES.find((m) => m.id === id);
      const slug = failureModeSlug(id);
      const card = J0_FAILURE_MODE_CARDS.find((c) => c.failureModeId === id);
      if (!mode || !slug || !card) return null;
      return { mode, slug, editorialName: card.editorialName };
    })
    .filter(<T,>(v: T | null): v is T => v !== null);

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Intelligence · ${topic.title}`,
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
          data-testid="intelligence-j1-topic-deep-dive-page"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: SHELL.PAPER,
            padding: '32px 48px 64px',
            maxWidth: 920,
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
              style={{ color: SHELL.INK_SOFT, textDecoration: 'none' }}
            >
              ← Intelligence
            </Link>
            <span style={{ margin: '0 8px' }}>·</span>
            <Link
              href="/intelligence/topics"
              style={{ color: SHELL.INK_SOFT, textDecoration: 'none' }}
            >
              Topics
            </Link>
            <span style={{ margin: '0 8px' }}>·</span>
            <span style={{ color: SHELL.INK_MUTED }}>{topic.title}</span>
          </nav>

          {/* Header */}
          <header style={{ marginBottom: 28 }}>
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
              Topic
            </div>
            <h1
              style={{
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: 'clamp(26px, 3.6vw, 38px)',
                fontWeight: 400,
                color: SHELL.INK,
                margin: 0,
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
              }}
            >
              {topic.title}
            </h1>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 16,
                color: SHELL.INK_SOFT,
                lineHeight: 1.55,
                margin: '14px 0 0',
                maxWidth: 720,
              }}
            >
              {topic.thesis}
            </p>
          </header>

          {/* Two-column: what gets wrong / what good looks like */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <article
              data-testid="intelligence-j1-topic-what-gets-wrong"
              style={{
                background: SHELL.PAPER_SOFT,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 10,
                padding: 18,
              }}
            >
              <h2
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.RUST_TEXT,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  margin: '0 0 10px',
                }}
              >
                What industry gets wrong
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
                {topic.whatIndustryGetsWrong}
              </p>
            </article>

            <article
              data-testid="intelligence-j1-topic-what-good-looks-like"
              style={{
                background: SHELL.PAPER_SOFT,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 10,
                padding: 18,
              }}
            >
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
                {topic.whatGoodLooksLike}
              </p>
            </article>
          </section>

          {/* Associated patterns */}
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
                Associated patterns · {patternEntries.length}
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
                    data-testid={`intelligence-j1-topic-pattern-card-${pattern.id}`}
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

          {/* Related failure modes */}
          {relatedFailureModes.length > 0 && (
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
                Related failure modes · {relatedFailureModes.length}
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {relatedFailureModes.map(({ mode, slug, editorialName }) => (
                  <Link
                    key={mode.id}
                    href={`/intelligence/failure-modes/${slug}`}
                    data-testid={`intelligence-j1-topic-failure-mode-link-${mode.id}`}
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
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 10,
                        color: SHELL.INK_MUTED,
                      }}
                    >
                      #{mode.id}
                    </span>
                    <span style={{ fontWeight: 500 }}>{editorialName}</span>
                    <span style={{ color: SHELL.INK_MUTED }}>→</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Example program archetypes */}
          {topic.exampleProgramArchetypes.length > 0 && (
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
                Example program archetypes
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {topic.exampleProgramArchetypes.map((archetype) => (
                  <span
                    key={archetype}
                    style={{
                      padding: '6px 12px',
                      background: SHELL.GRAY_BG,
                      border: `1px solid ${SHELL.GRAY_LINE}`,
                      borderRadius: 999,
                      fontFamily: SHELL.SANS,
                      fontSize: 12,
                      color: SHELL.INK_SOFT,
                    }}
                  >
                    {archetype}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Ask Sentinel affordance */}
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
              data-testid="intelligence-j1-topic-ask-sentinel"
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
              Ask Sentinel about this topic →
            </Link>
            <Link
              href="/intelligence/topics"
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
              ← All topics
            </Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
