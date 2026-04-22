import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TOPIC_DEPTH_OVERLAYS } from '@/lib/intelligence/fix-spec-v3-content';
import { getTopicIndustryCompositions } from '@/lib/intelligence/industry-compositions';
import { getServerSupabase } from '@/lib/supabase-server';
import type { TopicRow, VendorEntry } from '@/lib/topics/db';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#14B8A6';
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
  const overlay = TOPIC_DEPTH_OVERLAYS[topicKey] ?? null;

  // Either a DB row or an overlay is sufficient to render — patterns route
  // has the same shape. Overlay-only topics (e.g. spec additions that ship
  // ahead of the seed-pipeline migration) still get a full-depth page.
  if (!topic && !overlay) notFound();
  const engagements = topic ? await loadEngagementsOnTopic(topicKey) : [];
  const industryCompositions = getTopicIndustryCompositions(topicKey);
  const triggerItems =
    overlay?.triggers && overlay.triggers.length > 0
      ? overlay.triggers
      : (topic?.typical_triggers ?? []).map((t) => (typeof t === 'string' ? t : (t.phrase ?? t.description ?? ''))).filter(Boolean);

  const questionsByPhase = new Map<number, NonNullable<TopicRow>['diagnostic_questions']>();
  for (const q of topic?.diagnostic_questions ?? []) {
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
          ENGAGEMENT TOPIC{topic?.industries?.length ? ` · ${topic.industries.join(' · ')}` : overlay?.industriesLabel ? ` · ${overlay.industriesLabel}` : ''}
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
          {topic?.title ?? overlay?.title ?? topicKey}
        </h1>
        {(topic?.tagline || overlay?.tagline) && (
          <div style={{ fontSize: 15, color: MUTE, marginTop: 8, lineHeight: 1.5, maxWidth: 760 }}>
            {topic?.tagline ?? overlay?.tagline}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em' }}>
          {topic ? (
            <>
              <span>MATURITY v{topic.maturity_version}</span>
              <span>·</span>
              <span>{topic.diagnostic_questions.length} DIAGNOSTIC Qs</span>
              {topic.key_patterns.length > 0 && (
                <>
                  <span>·</span>
                  <span>{topic.key_patterns.length} LINKED PATTERNS</span>
                </>
              )}
            </>
          ) : overlay ? (
            <>
              <span>MATURITY v3 · OVERLAY</span>
              {overlay.patternCards?.length ? (
                <>
                  <span>·</span>
                  <span>{overlay.patternCards.length} LINKED PATTERNS</span>
                </>
              ) : null}
            </>
          ) : null}
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
                href={`/engagements/${encodeURIComponent(e.graph_node_id)}`}
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

      {industryCompositions.length > 0 && (
        <Section label="INDUSTRY LENSES" color={TEAL}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {industryCompositions.map((composition) => (
              <Link
                key={composition.slug}
                href={`/intelligence/topics/${encodeURIComponent(topicKey)}/${encodeURIComponent(composition.verticalKey)}`}
                style={{
                  display: 'block',
                  padding: 14,
                  borderRadius: 10,
                  border: `0.5px solid ${TEAL}55`,
                  background: 'rgba(20,184,166,0.08)',
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.12em', marginBottom: 8 }}>
                  {composition.verticalLabel.toUpperCase()} · INDUSTRY KNOWLEDGE LAYER
                </div>
                <div style={{ color: INK, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  {composition.title}
                </div>
                <div style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.55 }}>
                  {composition.subtitle}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {overlay?.concept && overlay.concept.length > 0 && (
        <Section label="THE CONCEPT" color={TEAL}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {overlay.concept.map((paragraph, index) => (
              <p key={index} style={{ margin: 0, color: INK, fontSize: 13.5, lineHeight: 1.7, maxWidth: 920 }}>
                {paragraph}
              </p>
            ))}
          </div>
        </Section>
      )}

      {triggerItems.length > 0 && (
        <Section label="TYPICAL TRIGGERS">
          <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13.5, lineHeight: 1.7 }}>
            {triggerItems.map((text, i) => <li key={i}>{text}</li>)}
          </ul>
        </Section>
      )}

      {overlay?.conceptualLandscape && overlay.conceptualLandscape.length > 0 && (
        <Section label="CONCEPTUAL LANDSCAPE" color={PURPLE}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {overlay.conceptualLandscape.map((item) => (
              <div key={item.name} style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
                <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.name}</div>
                <div style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.55 }}>{item.note}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {overlay?.practitionerLandscape && overlay.practitionerLandscape.length > 0 && (
        <Section label="PRACTITIONER LANDSCAPE" color={AMBER}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {overlay.practitionerLandscape.map((item) => (
              <div key={item.name} style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
                <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.name}</div>
                <div style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.55 }}>{item.note}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {overlay?.patternCards && overlay.patternCards.length > 0 ? (
        <Section label="KEY PATTERNS" color={CORAL}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {overlay.patternCards.map((pattern) => (
              <Link
                key={pattern.code}
                href={`/intelligence/patterns?code=${encodeURIComponent(pattern.code)}`}
                style={{
                  display: 'block',
                  padding: 12,
                  background: 'rgba(255,107,74,0.06)',
                  border: `0.5px solid ${CORAL}55`,
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 10, color: CORAL, letterSpacing: '0.1em', marginBottom: 6 }}>
                  {pattern.code}
                </div>
                <div style={{ fontSize: 13, color: INK, fontWeight: 600, marginBottom: 6 }}>{pattern.name}</div>
                <div style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.55 }}>{pattern.description}</div>
              </Link>
            ))}
          </div>
        </Section>
      ) : topic && topic.key_patterns.length > 0 && (
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

      {topic && Object.keys(topic.vendor_landscape).length > 0 ? (
        <Section label="VENDOR LANDSCAPE" color={AMBER}>
          {Object.entries(topic.vendor_landscape).map(([category, vendors]) => (
            <VendorGroup key={category} category={category} vendors={vendors ?? []} />
          ))}
        </Section>
      ) : overlay?.vendorLandscape?.length ? (
        <Section label="VENDOR + CAPABILITY LANDSCAPE · 2026" color={AMBER}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {overlay.vendorLandscape.map((group) => (
              <div key={group.layer} style={{ padding: 16, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.12em', marginBottom: 4 }}>
                  {group.layer.toUpperCase()}
                </div>
                <div style={{ fontSize: 14, color: INK, fontWeight: 500, marginBottom: 8 }}>{group.title}</div>
                {group.pointOfView && (
                  <div style={{ fontSize: 13, color: MUTE, fontStyle: 'italic', borderLeft: `2px solid ${TEAL}`, paddingLeft: 10, marginBottom: 12, lineHeight: 1.55 }}>
                    {group.pointOfView}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                  {group.vendors.map((v, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'rgba(20,184,166,0.04)', border: `0.5px solid rgba(20,184,166,0.18)`, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: INK, fontWeight: 500 }}>{v.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, marginTop: 3 }}>{v.descriptor}</div>
                      {v.opinion && (
                        <div style={{ fontSize: 12, color: MUTE, fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
                          {v.opinion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

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

      {topic && topic.common_contradictions.length > 0 && (
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

      {overlay?.evidenceBase && overlay.evidenceBase.length > 0 && (
        <Section label="EVIDENCE BASE" color={GREEN}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {overlay.evidenceBase.map((item) => (
              <div key={item.name} style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
                <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.name}</div>
                <div style={{ color: MUTE, fontSize: 12.5, lineHeight: 1.55 }}>{item.note}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {overlay?.maestroRubric && (
        <Section label="MAESTRO RUBRIC" color={TEAL}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            <div style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.12em', marginBottom: 8 }}>PROBE FOR</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 12.5, lineHeight: 1.55 }}>
                {overlay.maestroRubric.probeFor.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: AMBER, letterSpacing: '0.12em', marginBottom: 8 }}>CONFIRMING SIGNALS</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 12.5, lineHeight: 1.55 }}>
                {overlay.maestroRubric.confirmingSignals.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: GREEN, letterSpacing: '0.12em', marginBottom: 8 }}>RESOLUTION SIGNALS</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 12.5, lineHeight: 1.55 }}>
                {overlay.maestroRubric.resolutionSignals.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          </div>
        </Section>
      )}

      {topic && Object.keys(topic.phase_playbook).length > 0 && (
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

      {topic && topic.typical_deliverables.length > 0 && (
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

      {topic && topic.success_signals.length > 0 && (
        <Section label="SUCCESS SIGNALS" color={GREEN}>
          <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.6 }}>
            {topic.success_signals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}

      {topic && topic.failure_modes.length > 0 && (
        <Section label="FAILURE MODES" color={CORAL}>
          <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.6 }}>
            {topic.failure_modes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </Section>
      )}

      {topic?.source_attribution && (
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: BORDER, fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em' }}>
          SOURCE · {topic.source_attribution}
        </div>
      )}
    </div>
  );
}
