import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import {
  listAllTopics,
  listEngagementTopics,
  recommendTopics,
  type TopicRow,
  type DiagnosticQuestion,
} from '@/lib/topics/db';
import { assignTopicAction, unassignTopicAction, toggleQuestionAction, togglePrimaryAction } from './actions';

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

function questionId(q: DiagnosticQuestion, idx: number): string {
  return q.id ?? `q-${idx}`;
}

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

  const assignedByKey = new Map(assigned.map((a) => [a.topic_key, a]));
  const unassignedTopics = allTopics.filter((t) => !assignedByKey.has(t.topic_key));

  const industryFit = (t: TopicRow) =>
    t.industries.length === 0 ||
    t.industries.includes(engagement.industry_code) ||
    t.industries.includes('GENERAL');

  const recommendations = recommendTopics({
    industryCode: engagement.industry_code,
    objectiveCode: engagement.objective_code,
    functionCode: engagement.function_code,
    engagementName: engagement.name,
    candidates: unassignedTopics,
  }).slice(0, 3);
  const recommendedKeys = new Set(recommendations.map((r) => r.topic.topic_key));

  const sortedUnassigned = unassignedTopics
    .slice()
    .filter((t) => !recommendedKeys.has(t.topic_key))
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
          PROGRAM · TOPICS
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>{engagement.name}</div>
        <div style={{ fontSize: 13, color: MUTE, marginTop: 4 }}>
          Topic playbooks drive Nexus&rsquo;s phase-aware reasoning · assignment seeds diagnostic workbook + topic-triggered retrieval injection on every Nexus turn.
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <Link
            href={`/engagements/${encodeURIComponent(graphId)}`}
            style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textDecoration: 'none', letterSpacing: '0.08em' }}
          >
            ← back to engagement console
          </Link>
          <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em' }}>
            {assigned.length} ASSIGNED · {recommendations.length} RECOMMENDED · {sortedUnassigned.length} AVAILABLE
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 24, alignItems: 'start' }}>
        {/* LEFT · assigned topics · rich workbook cards */}
        <div>

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
              const topic = allTopics.find((t) => t.topic_key === et.topic_key);
              if (!topic) return null;
              const progress = et.progress ?? {};
              const questions = topic.diagnostic_questions;
              const done = questions.filter((q, i) => progress[questionId(q, i)]).length;
              const total = questions.length;
              const fraction = total > 0 ? done / total : 0;
              const color = fraction === 1 ? GREEN : fraction >= 0.5 ? AMBER : TEAL;
              return (
                <div
                  key={et.topic_key}
                  style={{
                    padding: 18,
                    border: BORDER,
                    borderRadius: 12,
                    background: PANEL_BG,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{topic.title}</div>
                    {et.is_primary && (
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 9,
                          color: PURPLE,
                          background: 'rgba(155,109,255,0.08)',
                          padding: '1px 6px',
                          borderRadius: 3,
                          letterSpacing: '0.1em',
                        }}
                      >
                        PRIMARY
                      </span>
                    )}
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
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <Link
                        href={`/intelligence/topics/${encodeURIComponent(et.topic_key)}`}
                        style={{
                          fontFamily: MONO,
                          fontSize: 10,
                          background: 'transparent',
                          border: `0.5px solid ${TEAL}`,
                          color: TEAL,
                          padding: '4px 10px',
                          borderRadius: 6,
                          textDecoration: 'none',
                          letterSpacing: '0.1em',
                        }}
                      >
                        VIEW SPEC →
                      </Link>
                      <form action={togglePrimaryAction}>
                        <input type="hidden" name="engagementGraphId" value={graphId} />
                        <input type="hidden" name="topicKey" value={et.topic_key} />
                        <input type="hidden" name="isPrimary" value={et.is_primary ? 'false' : 'true'} />
                        <button
                          type="submit"
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            background: et.is_primary ? PURPLE : 'transparent',
                            border: `0.5px solid ${PURPLE}`,
                            color: et.is_primary ? '#0A0A0A' : PURPLE,
                            padding: '4px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            letterSpacing: '0.1em',
                            fontWeight: et.is_primary ? 700 : 500,
                          }}
                        >
                          {et.is_primary ? 'CLEAR PRIMARY' : 'MARK PRIMARY'}
                        </button>
                      </form>
                      <form action={unassignTopicAction}>
                        <input type="hidden" name="engagementGraphId" value={graphId} />
                        <input type="hidden" name="topicKey" value={et.topic_key} />
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
                  </div>
                  {topic.tagline && (
                    <div style={{ fontSize: 13, color: MUTE, marginBottom: 14, lineHeight: 1.5 }}>{topic.tagline}</div>
                  )}

                  {/* Diagnostic questions workbook */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {questions.map((q, i) => {
                      const qid = questionId(q, i);
                      const isDone = Boolean(progress[qid]);
                      const phase = q.phase ?? 0;
                      return (
                        <form
                          key={qid}
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
                          <input type="hidden" name="topicKey" value={et.topic_key} />
                          <input type="hidden" name="questionId" value={qid} />
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
                              P{phase} {PHASE_LABEL[phase]?.toUpperCase() ?? ''}
                              {typeof q.probe_depth === 'number' ? ` · depth ${q.probe_depth}` : ''}
                            </span>
                            {q.question}
                            {q.tags && q.tags.length > 0 && (
                              <span style={{ fontFamily: MONO, fontSize: 9, color: MUTE, marginLeft: 8 }}>
                                [{q.tags.join(', ')}]
                              </span>
                            )}
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
                            {topic.common_contradictions.slice(0, 3).map((c, i) => {
                              const text = typeof c === 'string' ? c : c.description;
                              return <li key={i}>{text}</li>;
                            })}
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
        </div>
        {/* RIGHT · recommendations + library · browsable sidebar */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Recommended for this engagement */}
      {recommendations.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.14em', marginBottom: 12 }}>
            RECOMMENDED FOR THIS PROGRAM · {recommendations.length}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            {recommendations.map((r) => (
              <div
                key={r.topic.topic_key}
                style={{
                  padding: 16,
                  border: `0.5px solid ${PURPLE}`,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(155,109,255,0.06) 0%, rgba(45,212,200,0.04) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{r.topic.title}</div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      color: PURPLE,
                      letterSpacing: '0.1em',
                      marginLeft: 'auto',
                    }}
                  >
                    SCORE {r.score}
                  </span>
                </div>
                {r.topic.tagline && (
                  <div style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.45 }}>{r.topic.tagline}</div>
                )}
                {r.reasons.length > 0 && (
                  <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.06em' }}>
                    {r.reasons.slice(0, 3).map((reason, i) => (
                      <span key={i}>
                        {reason}
                        {i < Math.min(r.reasons.length, 3) - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </div>
                )}
                <form action={assignTopicAction} style={{ marginTop: 'auto' }}>
                  <input type="hidden" name="engagementGraphId" value={graphId} />
                  <input type="hidden" name="topicKey" value={r.topic.topic_key} />
                  <button
                    type="submit"
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      background: PURPLE,
                      color: '#0A0A0A',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      letterSpacing: '0.1em',
                      fontWeight: 700,
                    }}
                  >
                    ASSIGN RECOMMENDED →
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available to assign */}
      <section>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 12 }}>
          ASSIGN · {sortedUnassigned.length} available
          {recommendations.length > 0 ? ' · recommendations shown above excluded from fit-ranked list' : ''}
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
                  key={t.topic_key}
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
                      <input type="hidden" name="topicKey" value={t.topic_key} />
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
        </div>
      </div>
    </div>
  );
}
