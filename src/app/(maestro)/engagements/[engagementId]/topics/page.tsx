import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { listAllTopics, listEngagementTopics, type TopicRow } from '@/lib/topics/db';
import { assignTopicAction, unassignTopicAction, toggleQuestionAction } from './actions';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#2DD4C8';
const PURPLE = '#9B6DFF';
const AMBER = '#F5C54A';
const CORAL = '#FF6B4A';
const GREEN = '#3FB27F';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

const PHASE_LABEL = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];

export default async function EngagementTopicsPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId: graphId } = await params;
  const engagement = await getEngagementByGraphId(graphId);
  if (!engagement) notFound();

  const [allTopics, assigned] = await Promise.all([
    listAllTopics(),
    listEngagementTopics(engagement.id),
  ]);

  const assignedById = new Map(assigned.map((a) => [a.topic_id, a]));
  const unassignedTopics = allTopics.filter((t) => !assignedById.has(t.id));

  const industryFit = (t: TopicRow) =>
    t.industries.length === 0 ||
    t.industries.includes(engagement.industry_code) ||
    t.industries.includes('GENERAL');

  const sortedUnassigned = unassignedTopics
    .slice()
    .sort((a, b) => Number(industryFit(b)) - Number(industryFit(a)) || a.title.localeCompare(b.title));

  return (
    <div
      style={{
        padding: '24px 28px 60px',
        maxWidth: 1400,
        margin: '0 auto',
        color: INK,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 4 }}>
          ENGAGEMENT · TOPICS
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>{engagement.name}</div>
        <div style={{ fontSize: 13, color: MUTE, marginTop: 4 }}>
          Assigned topic playbooks drive Nexus&rsquo;s phase intelligence. v1 is schema + catalog;
          v2 (topic-triggered retrieval injection on Nexus turns) ships next.
        </div>
        <div style={{ marginTop: 8 }}>
          <Link
            href={`/engage/${encodeURIComponent(graphId)}`}
            style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textDecoration: 'none', letterSpacing: '0.08em' }}
          >
            ← back to engagement console
          </Link>
        </div>
      </div>

      {/* Assigned topics */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 12 }}>
          ASSIGNED · {assigned.length}
        </div>
        {assigned.length === 0 ? (
          <div
            style={{
              padding: 18,
              border: BORDER,
              borderRadius: 10,
              background: PANEL_BG,
              color: MUTE,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            No topics assigned yet. Assign below to seed diagnostic questions + playbook context for
            this engagement.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assigned.map((et) => {
              const topic = allTopics.find((t) => t.id === et.topic_id);
              if (!topic) return null;
              const progress = et.progress ?? {};
              const done = topic.diagnostic_questions.filter((q) => progress[q.id]).length;
              const total = topic.diagnostic_questions.length;
              const fraction = total > 0 ? done / total : 0;
              const color = fraction === 1 ? GREEN : fraction >= 0.5 ? AMBER : TEAL;
              return (
                <div
                  key={et.id}
                  style={{
                    padding: 18,
                    border: BORDER,
                    borderRadius: 12,
                    background: PANEL_BG,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{topic.title}</div>
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        color,
                        letterSpacing: '0.12em',
                      }}
                    >
                      {done}/{total} questions
                    </div>
                    <form action={unassignTopicAction} style={{ marginLeft: 'auto' }}>
                      <input type="hidden" name="engagementGraphId" value={graphId} />
                      <input type="hidden" name="engagementTopicId" value={et.id} />
                      <button
                        type="submit"
                        style={{
                          fontFamily: MONO,
                          fontSize: 10,
                          background: 'transparent',
                          border: `0.5px solid ${CORAL}`,
                          color: CORAL,
                          padding: '4px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          letterSpacing: '0.1em',
                        }}
                      >
                        UNASSIGN
                      </button>
                    </form>
                  </div>
                  {topic.tagline && (
                    <div style={{ fontSize: 13, color: MUTE, marginBottom: 14, lineHeight: 1.5 }}>{topic.tagline}</div>
                  )}

                  {/* Diagnostic questions workbook */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {topic.diagnostic_questions.map((q) => {
                      const isDone = Boolean(progress[q.id]);
                      return (
                        <form
                          key={q.id}
                          action={toggleQuestionAction}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '6px 10px',
                            background: isDone ? 'rgba(63,178,127,0.04)' : 'transparent',
                            borderRadius: 6,
                          }}
                        >
                          <input type="hidden" name="engagementGraphId" value={graphId} />
                          <input type="hidden" name="engagementTopicId" value={et.id} />
                          <input type="hidden" name="questionId" value={q.id} />
                          <input type="hidden" name="done" value={isDone ? 'false' : 'true'} />
                          <button
                            type="submit"
                            aria-label={isDone ? 'mark open' : 'mark done'}
                            style={{
                              width: 16,
                              height: 16,
                              marginTop: 2,
                              flexShrink: 0,
                              borderRadius: 4,
                              border: `1px solid ${isDone ? GREEN : 'rgba(255,255,255,0.24)'}`,
                              background: isDone ? GREEN : 'transparent',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          />
                          <div style={{ fontSize: 13, color: isDone ? MUTE : INK, lineHeight: 1.5, textDecoration: isDone ? 'line-through' : 'none' }}>
                            <span
                              style={{
                                fontFamily: MONO,
                                fontSize: 9,
                                color: MUTE,
                                letterSpacing: '0.12em',
                                marginRight: 6,
                              }}
                            >
                              P{q.phase} {PHASE_LABEL[q.phase]?.toUpperCase() ?? ''}
                            </span>
                            {q.question}
                          </div>
                        </form>
                      );
                    })}
                  </div>

                  {(topic.common_contradictions.length > 0 || topic.failure_modes.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 6 }}>
                      {topic.common_contradictions.length > 0 && (
                        <div>
                          <div style={{ fontFamily: MONO, fontSize: 9, color: AMBER, letterSpacing: '0.14em', marginBottom: 6 }}>
                            COMMON CONTRADICTIONS
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, color: MUTE, fontSize: 12, lineHeight: 1.6 }}>
                            {topic.common_contradictions.slice(0, 3).map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {topic.failure_modes.length > 0 && (
                        <div>
                          <div style={{ fontFamily: MONO, fontSize: 9, color: CORAL, letterSpacing: '0.14em', marginBottom: 6 }}>
                            FAILURE MODES
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, color: MUTE, fontSize: 12, lineHeight: 1.6 }}>
                            {topic.failure_modes.slice(0, 3).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Available to assign */}
      <section>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 12 }}>
          ASSIGN · {sortedUnassigned.length} available
        </div>
        {sortedUnassigned.length === 0 ? (
          <div
            style={{
              padding: 14,
              border: BORDER,
              borderRadius: 10,
              background: PANEL_BG,
              color: MUTE,
              fontSize: 13,
            }}
          >
            All topics assigned. Run <code>npx tsx src/scripts/seed/topics.ts</code> to refresh the catalog.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {sortedUnassigned.map((t) => {
              const fits = industryFit(t);
              return (
                <div
                  key={t.id}
                  style={{
                    padding: 14,
                    border: BORDER,
                    borderRadius: 10,
                    background: PANEL_BG,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    opacity: fits ? 1 : 0.68,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                    {fits && (
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 9,
                          color: TEAL,
                          background: 'rgba(45,212,200,0.08)',
                          padding: '1px 6px',
                          borderRadius: 3,
                          letterSpacing: '0.1em',
                        }}
                      >
                        FIT
                      </span>
                    )}
                  </div>
                  {t.tagline && (
                    <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.45 }}>{t.tagline}</div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                    {t.industries.slice(0, 4).map((i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: MONO,
                          fontSize: 9,
                          padding: '1px 6px',
                          border: BORDER,
                          borderRadius: 3,
                          color: MUTE,
                          letterSpacing: '0.08em',
                        }}
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE }}>
                      {t.diagnostic_questions.length} diagnostic Qs
                    </span>
                    <form action={assignTopicAction}>
                      <input type="hidden" name="engagementGraphId" value={graphId} />
                      <input type="hidden" name="topicId" value={t.id} />
                      <button
                        type="submit"
                        style={{
                          fontFamily: MONO,
                          fontSize: 10,
                          background: TEAL,
                          color: '#0A0A0A',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          letterSpacing: '0.1em',
                          fontWeight: 600,
                        }}
                      >
                        ASSIGN →
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Unused accent — lint assist */}
      <span style={{ color: PURPLE, display: 'none' }} aria-hidden="true" />
    </div>
  );
}
