import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import {
  getMissingRequiredSections,
  getStructuredEvidenceRefs,
  getStructuredSections,
} from '@/lib/deliverables/structured';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const DIM = 'rgba(245, 245, 240, 0.48)';
const TEAL = '#14B8A6';
const PURPLE = '#9B6DFF';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

interface DeliverableRow {
  id: string;
  engagement_id: string;
  deliverable_type_key: string;
  title: string;
  status: string;
  current_version: number;
  created_by: string | null;
  signed_off_by: string | null;
  signed_off_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TypeRow {
  type_key: string;
  title: string;
  description: string | null;
  applicable_phases: number[];
  applicable_topics: string[];
  output_format: string | null;
  maturity: string | null;
}

interface VersionRow {
  id: string;
  deliverable_id: string;
  version: number;
  content: string;
  structured_data: unknown;
  quality_score: { total_score?: number } | null;
  quality_issues: { total_score?: number; critical?: string[]; remaining?: string[]; resolved?: string[] } | null;
  generated_at: string;
  generated_from_context_hash: string | null;
}

function statusColor(s: string): string {
  if (s === 'signed_off') return GREEN;
  if (s === 'in_review') return AMBER;
  if (s === 'superseded') return MUTE;
  return TEAL;
}

function qualityColor(score: number | undefined): string {
  if (score == null) return MUTE;
  if (score >= 85) return GREEN;
  if (score >= 70) return AMBER;
  return CORAL;
}

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ');
}

export default async function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ engagementId: string; deliverableId: string }>;
}) {
  const { engagementId: graphId, deliverableId } = await params;
  const engagement = await getEngagementByGraphId(graphId);
  if (!engagement) notFound();

  const sb = getServerSupabase();
  const { data: delivData } = await sb
    .from('deliverables_v2')
    .select('id, engagement_id, deliverable_type_key, title, status, current_version, created_by, signed_off_by, signed_off_at, created_at, updated_at')
    .eq('id', deliverableId)
    .eq('engagement_id', engagement.id)
    .maybeSingle();
  const deliverable = delivData as DeliverableRow | null;
  if (!deliverable) notFound();

  const { data: typeData } = await sb
    .from('deliverable_types')
    .select('type_key, title, description, applicable_phases, applicable_topics, output_format, maturity')
    .eq('type_key', deliverable.deliverable_type_key)
    .maybeSingle();
  const type = typeData as TypeRow | null;

  const { data: versionsData } = await sb
    .from('deliverable_versions')
    .select('id, deliverable_id, version, content, structured_data, quality_score, quality_issues, generated_at, generated_from_context_hash')
    .eq('deliverable_id', deliverableId)
    .order('version', { ascending: false });
  const versions = (versionsData as VersionRow[] | null) ?? [];
  const latest = versions[0] ?? null;
  const latestScore = latest?.quality_issues?.total_score ?? latest?.quality_score?.total_score;
  const critical = latest?.quality_issues?.critical ?? [];
  const remaining = latest?.quality_issues?.remaining ?? [];
  const resolved = latest?.quality_issues?.resolved ?? [];

  // Extract sections from structured_data when present; fall back to content
  const sections = getStructuredSections(latest?.structured_data, latest?.content);
  const evidenceRefs = getStructuredEvidenceRefs(latest?.structured_data, latest?.content);
  const missingRequiredSections = getMissingRequiredSections(latest?.structured_data);

  return (
    <div
      style={{
        padding: '24px 32px 60px',
        maxWidth: 1200,
        margin: '0 auto',
        color: INK,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <Link
          href={`/engagements/${encodeURIComponent(graphId)}/deliverables`}
          style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textDecoration: 'none', letterSpacing: '0.08em' }}
        >
          ← deliverables
        </Link>
      </div>

      {/* Meta header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.14em', marginBottom: 6 }}>
          {engagement.name.toUpperCase()} · {deliverable.deliverable_type_key}
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, margin: '0 0 8px' }}>
          {deliverable.title}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', fontSize: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: statusColor(deliverable.status), letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            ● {statusLabel(deliverable.status)}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em' }}>
            v{deliverable.current_version}
          </span>
          {typeof latestScore === 'number' && (
            <span style={{ fontFamily: MONO, fontSize: 10, color: qualityColor(latestScore), letterSpacing: '0.1em' }}>
              QUALITY {latestScore}/100
            </span>
          )}
          <span style={{ color: MUTE }}>· updated {new Date(deliverable.updated_at).toLocaleString()}</span>
          {deliverable.signed_off_at && (
            <span style={{ color: GREEN }}>
              · signed off {new Date(deliverable.signed_off_at).toLocaleDateString()}
              {deliverable.signed_off_by ? ` by ${deliverable.signed_off_by}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Signal tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, border: BORDER, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
        <Tile label="VERSIONS" value={versions.length.toString()} sub={latest ? `latest ${new Date(latest.generated_at).toLocaleDateString()}` : '—'} accent={INK} />
        <Tile label="QUALITY" value={typeof latestScore === 'number' ? `${latestScore}/100` : '—'} sub={latest ? `v${latest.version}` : '—'} accent={qualityColor(latestScore)} />
        <Tile label="CRITICAL" value={critical.length.toString()} sub={critical.length === 0 ? 'clean' : 'issues'} accent={critical.length > 0 ? CORAL : GREEN} />
        <Tile label="REMAINING" value={remaining.length.toString()} sub={remaining.length === 0 ? 'clean' : 'open'} accent={remaining.length > 0 ? AMBER : GREEN} />
        <Tile label="RESOLVED" value={resolved.length.toString()} sub="across revisions" accent={resolved.length > 0 ? GREEN : MUTE} isLast />
      </div>

      {/* Two-column: left content, right type meta + version history */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20 }}>
        <div>
          {/* Quality issues */}
          {(critical.length > 0 || remaining.length > 0) && (
            <section style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 10 }}>
                QUALITY ISSUES · {critical.length + remaining.length} open
              </div>
              {critical.length > 0 && (
                <div style={{ padding: 12, background: 'rgba(255,107,74,0.05)', border: `0.5px solid ${CORAL}40`, borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: CORAL, letterSpacing: '0.14em', marginBottom: 6 }}>
                    ⚠ CRITICAL · {critical.length}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: INK, lineHeight: 1.6 }}>
                    {critical.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              {remaining.length > 0 && (
                <div style={{ padding: 12, background: 'rgba(245,197,74,0.05)', border: `0.5px solid ${AMBER}40`, borderRadius: 8 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: AMBER, letterSpacing: '0.14em', marginBottom: 6 }}>
                    REMAINING · {remaining.length}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: MUTE, lineHeight: 1.6 }}>
                    {remaining.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}

          {(evidenceRefs.length > 0 || missingRequiredSections.length > 0) && (
            <section style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 10 }}>
                TRACEABILITY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 8 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 8 }}>
                    EVIDENCE REFS · {evidenceRefs.length}
                  </div>
                  {evidenceRefs.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {evidenceRefs.map((ref) => (
                        <span
                          key={ref}
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            padding: '4px 7px',
                            borderRadius: 999,
                            background: 'rgba(20,184,166,0.08)',
                            border: `0.5px solid ${TEAL}40`,
                            color: TEAL,
                            letterSpacing: '0.08em',
                          }}
                        >
                          {ref.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: DIM }}>No citations extracted.</div>
                  )}
                </div>
                <div style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 8 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: missingRequiredSections.length > 0 ? CORAL : GREEN, letterSpacing: '0.14em', marginBottom: 8 }}>
                    REQUIRED SECTIONS
                  </div>
                  {missingRequiredSections.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18, color: INK, fontSize: 12, lineHeight: 1.6 }}>
                      {missingRequiredSections.map((section) => (
                        <li key={section}>{section.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ fontSize: 12, color: GREEN }}>All required sections populated.</div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Sections preview */}
          <section>
            <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 10 }}>
              CONTENT · v{latest?.version ?? '—'}
            </div>
            {sections.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sections.map((s, i) => (
                  <details
                    key={s.key}
                    open={i < 2}
                    style={{
                      background: PANEL_BG,
                      border: BORDER,
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <summary
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        listStyle: 'none',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 10,
                      }}
                    >
                      <span style={{ fontFamily: MONO, fontSize: 9, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{s.title}</span>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE, marginLeft: 'auto' }}>
                        {s.citations.length} cite{s.citations.length === 1 ? '' : 's'}
                      </span>
                    </summary>
                    <div style={{ padding: '0 14px 14px' }}>
                      <div
                        style={{
                          padding: 12,
                          background: 'rgba(0,0,0,0.25)',
                          borderRadius: 6,
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: INK,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {s.body}
                      </div>
                      {s.citations.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {s.citations.map((citation) => (
                            <span
                              key={citation}
                              style={{
                                fontFamily: MONO,
                                fontSize: 9,
                                color: TEAL,
                                letterSpacing: '0.08em',
                                padding: '3px 6px',
                                borderRadius: 999,
                                background: 'rgba(20,184,166,0.08)',
                                border: `0.5px solid ${TEAL}30`,
                              }}
                            >
                              {citation.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            ) : latest?.content ? (
              <div
                style={{
                  padding: 16,
                  background: PANEL_BG,
                  border: BORDER,
                  borderRadius: 10,
                  whiteSpace: 'pre-wrap',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: INK,
                  maxHeight: 600,
                  overflowY: 'auto',
                }}
              >
                {latest.content}
              </div>
            ) : (
              <div style={{ padding: 16, background: PANEL_BG, border: BORDER, borderRadius: 10, color: DIM, fontSize: 13 }}>
                No content generated yet.
              </div>
            )}
          </section>
        </div>

        <div>
          {/* Type metadata */}
          {type && (
            <section style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 10 }}>
                TYPE · {type.type_key}
              </div>
              <div style={{ padding: 14, background: PANEL_BG, border: BORDER, borderRadius: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{type.title}</div>
                {type.description && (
                  <div style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.5, marginBottom: 10 }}>{type.description}</div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {type.output_format && (
                    <span style={{ fontFamily: MONO, fontSize: 9, padding: '3px 7px', background: 'rgba(255,255,255,0.04)', border: BORDER, borderRadius: 4, color: MUTE, letterSpacing: '0.08em' }}>
                      {type.output_format.toUpperCase()}
                    </span>
                  )}
                  {type.maturity && (
                    <span style={{ fontFamily: MONO, fontSize: 9, padding: '3px 7px', background: 'rgba(255,255,255,0.04)', border: BORDER, borderRadius: 4, color: MUTE, letterSpacing: '0.08em' }}>
                      {type.maturity.toUpperCase()}
                    </span>
                  )}
                </div>
                {type.applicable_phases?.length > 0 && (
                  <div style={{ fontFamily: MONO, fontSize: 10, color: DIM, letterSpacing: '0.08em', marginBottom: 3 }}>
                    PHASES · {type.applicable_phases.join(', ')}
                  </div>
                )}
                {type.applicable_topics?.length > 0 && (
                  <div style={{ fontFamily: MONO, fontSize: 10, color: DIM, letterSpacing: '0.08em' }}>
                    TOPICS · {type.applicable_topics.slice(0, 6).join(', ')}
                    {type.applicable_topics.length > 6 ? ` +${type.applicable_topics.length - 6}` : ''}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Version history */}
          <section>
            <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 10 }}>
              VERSION HISTORY · {versions.length}
            </div>
            {versions.length === 0 ? (
              <div style={{ padding: 12, background: PANEL_BG, border: BORDER, borderRadius: 10, color: DIM, fontSize: 13 }}>
                No versions on file.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {versions.map((v) => {
                  const vScore = v.quality_issues?.total_score ?? v.quality_score?.total_score;
                  const vCritical = v.quality_issues?.critical?.length ?? 0;
                  const isLatest = v.version === deliverable.current_version;
                  return (
                    <div
                      key={v.id}
                      style={{
                        padding: 10,
                        background: isLatest ? 'rgba(45,212,200,0.05)' : PANEL_BG,
                        border: isLatest ? `0.5px solid ${TEAL}40` : BORDER,
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: isLatest ? TEAL : MUTE, letterSpacing: '0.1em' }}>
                          v{v.version}
                        </span>
                        {typeof vScore === 'number' && (
                          <span style={{ fontFamily: MONO, fontSize: 10, color: qualityColor(vScore), letterSpacing: '0.1em' }}>
                            {vScore}/100
                          </span>
                        )}
                        {vCritical > 0 && (
                          <span style={{ fontFamily: MONO, fontSize: 10, color: CORAL, letterSpacing: '0.08em' }}>
                            ⚠ {vCritical}
                          </span>
                        )}
                        <span style={{ fontFamily: MONO, fontSize: 10, color: DIM, marginLeft: 'auto' }}>
                          {new Date(v.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                      {v.generated_from_context_hash && (
                        <div style={{ fontFamily: MONO, fontSize: 9, color: DIM, letterSpacing: '0.05em' }}>
                          ctx {v.generated_from_context_hash.slice(0, 8)}
                        </div>
                      )}
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

function Tile({ label, value, sub, accent, isLast }: { label: string; value: string; sub: string; accent: string; isLast?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderRight: isLast ? 'none' : BORDER, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.14em' }}>{label}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, color: accent, marginTop: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
