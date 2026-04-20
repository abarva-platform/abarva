import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';
import type { TopicRow, VendorEntry } from '@/lib/topics/db';

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

const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];
const PHASE_KEYS = ['phase_0_charter', 'phase_1_diagnose', 'phase_2_design', 'phase_3_business_case', 'phase_4_execute'];

async function loadTopic(topicKey: string): Promise<TopicRow | null> {
  const { data } = await getServerSupabase()
    .from('engagement_topics')
    .select('*')
    .eq('topic_key', topicKey)
    .maybeSingle();
  return (data as TopicRow | null) ?? null;
}

async function loadEngagementsOnTopic(topicKey: string): Promise<Array<{ id: string; name: string; graph_node_id: string; current_phase: number; is_primary: boolean }>> {
  const { data } = await getServerSupabase()
    .from('engagement_topics_map')
    .select('is_primary, engagement:engagements(id, name, graph_node_id, current_phase, status)')
    .eq('topic_key', topicKey);

  const rows = (data as Array<{
    is_primary: boolean;
    engagement: { id: string; name: string; graph_node_id: string; current_phase: number; status: string } | null;
  }> | null) ?? [];

  return rows
    .filter((r): r is typeof r & { engagement: NonNullable<typeof r.engagement> } => r.engagement !== null)
    .filter((r) => r.engagement.status === 'active')
    .map((r) => ({
      id: r.engagement.id,
      name: r.engagement.name,
      graph_node_id: r.engagement.graph_node_id,
      current_phase: r.engagement.current_phase,
      is_primary: r.is_primary,
    }));
}

function Section({ label, color, children }: { label: string; color?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color ?? MUTE, letterSpacing: '0.14em', marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </section>
  );
}

function VendorGroup({ category, vendors }: { category: string; vendors: (string | VendorEntry)[] }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, color: INK, fontWeight: 500, marginBottom: 6, textTransform: 'capitalize' }}>
        {category.replace(/_/g, ' ')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {vendors.map((v, i) => {
          const entry: VendorEntry = typeof v === 'string' ? { name: v } : v;
          return (
            <div key={i} style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.5, padding: '6px 10px', background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 6 }}>
              <span style={{ color: INK, fontWeight: 500 }}>{entry.name}</span>
              {entry.role && <span> · {entry.role}</span>}
              {entry.typical_spend_range_monthly && (
                <span style={{ fontFamily: MONO, fontSize: 10, color: AMBER, marginLeft: 8 }}>
                  ${Math.round(entry.typical_spend_range_monthly[0] / 1000)}k–${Math.round(entry.typical_spend_range_monthly[1] / 1000)}k/mo
                </span>
              )}
              {entry.consolidation_play && (
                <div style={{ fontSize: 11, color: MUTE, marginTop: 3, fontStyle: 'italic' }}>
                  {entry.consolidation_play}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicKey: string }>;
}) {
  const { topicKey } = await params;
  const topic = await loadTopic(topicKey);
  if (!topic) notFound();
  const engagements = await loadEngagementsOnTopic(topicKey);

  const questionsByPhase = new Map<number, typeof topic.diagnostic_questions>();
  for (const q of topic.diagnostic_questions) {
    const phase = q.phase ?? 0;
    if (!questionsByPhase.has(phase)) questionsByPhase.set(phase, []);
    questionsByPhase.get(phase)!.push(q);
  }

  return (
    <div
      style={{
        padding: '28px 32px 60px',
        maxWidth: 1200,
        margin: '0 auto',
        color: INK,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <div style={{ marginBottom: 4 }}>
        <Link
          href="/intelligence/library?category=topic"
          style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textDecoration: 'none', letterSpacing: '0.08em' }}
        >
          ← library · topics
        </Link>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.14em', marginBottom: 6 }}>
          ENGAGEMENT TOPIC · {topic.industries.join(' · ')}
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
          {topic.title}
        </h1>
        {topic.tagline && (
          <div style={{ fontSize: 15, color: MUTE, marginTop: 8, lineHeight: 1.5, maxWidth: 760 }}>
            {topic.tagline}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em' }}>
          <span>MATURITY v{topic.maturity_version}</span>
          <span>·</span>
          <span>{topic.diagnostic_questions.length} DIAGNOSTIC Qs</span>
          {topic.key_patterns.length > 0 && (
            <>
              <span>·</span>
              <span>{topic.key_patterns.length} LINKED PATTERNS</span>
            </>
          )}
          {engagements.length > 0 && (
            <>
              <span>·</span>
              <span style={{ color: TEAL }}>ACTIVE IN {engagements.length} ENGAGEMENT{engagements.length === 1 ? '' : 'S'}</span>
            </>
          )}
        </div>
      </div>

      {engagements.length > 0 && (
        <Section label="ACTIVE ENGAGEMENTS" color={TEAL}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {engagements.map((e) => (
              <Link
                key={e.id}
                href={`/engage/${encodeURIComponent(e.graph_node_id)}`}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  padding: '8px 12px',
                  border: BORDER,
                  borderRadius: 8,
                  background: PANEL_BG,
                  textDecoration: 'none',
                  color: INK,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</span>
                {e.is_primary && (
                  <span style={{ fontFamily: MONO, fontSize: 9, color: PURPLE, letterSpacing: '0.1em' }}>PRIMARY</span>
                )}
                <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE, marginLeft: 'auto' }}>
                  Phase {e.current_phase} {PHASE_LABELS[e.current_phase]}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {topic.typical_triggers.length > 0 && (
        <Section label="TYPICAL TRIGGERS">
          <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13.5, lineHeight: 1.7 }}>
            {topic.typical_triggers.map((t, i) => {
              const text = typeof t === 'string' ? t : (t.phrase ?? t.description ?? '');
              return <li key={i}>{text}</li>;
            })}
          </ul>
        </Section>
      )}

      {topic.key_patterns.length > 0 && (
        <Section label="KEY PATTERNS" color={CORAL}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topic.key_patterns.map((code) => (
              <Link
                key={code}
                href={`/intelligence/patterns?code=${encodeURIComponent(code)}`}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  padding: '6px 12px',
                  background: 'rgba(255,107,74,0.06)',
                  border: `0.5px solid ${CORAL}`,
                  borderRadius: 6,
                  color: INK,
                  textDecoration: 'none',
                  letterSpacing: '0.1em',
                }}
              >
                {code}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(topic.vendor_landscape).length > 0 && (
        <Section label="VENDOR LANDSCAPE" color={AMBER}>
          {Object.entries(topic.vendor_landscape).map(([category, vendors]) => (
            <VendorGroup key={category} category={category} vendors={vendors ?? []} />
          ))}
        </Section>
      )}

      {questionsByPhase.size > 0 && (
        <Section label="DIAGNOSTIC QUESTIONS · BY PHASE">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0, 1, 2, 3, 4].map((phase) => {
              const qs = questionsByPhase.get(phase);
              if (!qs || qs.length === 0) return null;
              return (
                <div key={phase} style={{ padding: 14, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 8 }}>
                    PHASE {phase} · {PHASE_LABELS[phase].toUpperCase()}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.7 }}>
                    {qs.map((q, i) => (
                      <li key={i}>
                        {q.question}
                        {typeof q.probe_depth === 'number' && (
                          <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE, marginLeft: 8 }}>
                            [depth {q.probe_depth}]
                          </span>
                        )}
                        {q.tags && q.tags.length > 0 && (
                          <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE, marginLeft: 8 }}>
                            · {q.tags.join(', ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {topic.common_contradictions.length > 0 && (
        <Section label="COMMON CONTRADICTIONS" color={AMBER}>
          <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.6 }}>
            {topic.common_contradictions.map((c, i) => {
              if (typeof c === 'string') return <li key={i}>{c}</li>;
              return (
                <li key={i}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: AMBER, marginRight: 6 }}>
                    {c.type?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {c.description}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {Object.keys(topic.phase_playbook).length > 0 && (
        <Section label="PHASE PLAYBOOK">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PHASE_KEYS.map((key, phase) => {
              const entry = topic.phase_playbook[key] ?? topic.phase_playbook[String(phase)];
              if (!entry) return null;
              return (
                <div key={key} style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 8 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 8 }}>
                    PHASE {phase} · {PHASE_LABELS[phase].toUpperCase()}
                  </div>
                  {typeof entry === 'string' ? (
                    <div style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>{entry}</div>
                  ) : (
                    <>
                      {entry.priorities && entry.priorities.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.6 }}>
                          {entry.priorities.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      )}
                      {entry.deliverable && (
                        <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.1em' }}>
                          DELIVERABLE · {entry.deliverable.toUpperCase()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {topic.typical_deliverables.length > 0 && (
        <Section label="TYPICAL DELIVERABLES" color={PURPLE}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topic.typical_deliverables.map((d) => (
              <span
                key={d}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  padding: '6px 12px',
                  background: 'rgba(155,109,255,0.06)',
                  border: `0.5px solid ${PURPLE}`,
                  borderRadius: 6,
                  color: INK,
                  letterSpacing: '0.08em',
                }}
              >
                {d.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </Section>
      )}

      {topic.success_signals.length > 0 && (
        <Section label="SUCCESS SIGNALS" color={GREEN}>
          <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.6 }}>
            {topic.success_signals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {topic.failure_modes.length > 0 && (
        <Section label="FAILURE MODES" color={CORAL}>
          <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.6 }}>
            {topic.failure_modes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </Section>
      )}

      {topic.source_attribution && (
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: BORDER, fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em' }}>
          SOURCE · {topic.source_attribution}
        </div>
      )}
    </div>
  );
}
