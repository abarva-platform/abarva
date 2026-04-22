import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#14B8A6';
const PURPLE = '#9B6DFF';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];

interface LegacyDeliverable {
  type: string;
  phase: number;
  generated_at: string;
  content: Record<string, unknown>;
}

function legacyTitle(type: string): string {
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function legacyPreview(deliverable: LegacyDeliverable): string {
  const content = deliverable.content ?? {};
  if (typeof content.problem_statement === 'string' && content.problem_statement.trim()) return content.problem_statement;
  if (typeof content.current_state_summary === 'string' && content.current_state_summary.trim()) return content.current_state_summary;
  if (typeof content.recommendation_rationale === 'string' && content.recommendation_rationale.trim()) return content.recommendation_rationale;
  if (Array.isArray(content.root_causes) && content.root_causes.length > 0) return `Root causes: ${content.root_causes.slice(0, 2).join(' · ')}`;
  if (Array.isArray(content.hypotheses) && content.hypotheses.length > 0) return `Hypotheses: ${content.hypotheses.slice(0, 2).join(' · ')}`;
  if (Array.isArray(content.metrics_compared) && content.metrics_compared.length > 0) return `Metrics compared: ${content.metrics_compared.length}`;
  return `${Object.keys(content).length} structured fields available`;
}

function legacySignals(deliverable: LegacyDeliverable): string[] {
  const content = deliverable.content ?? {};
  const signals: string[] = [];
  if (Array.isArray(content.stakeholders) && content.stakeholders.length > 0) signals.push(`${content.stakeholders.length} stakeholders`);
  if (Array.isArray(content.success_criteria) && content.success_criteria.length > 0) signals.push(`${content.success_criteria.length} success criteria`);
  if (Array.isArray(content.quantified_problem) && content.quantified_problem.length > 0) signals.push(`${content.quantified_problem.length} quantified metrics`);
  if (Array.isArray(content.active_genome_patterns) && content.active_genome_patterns.length > 0) signals.push(`${content.active_genome_patterns.length} genome patterns`);
  if (Array.isArray(content.roadmap) && content.roadmap.length > 0) signals.push(`${content.roadmap.length} roadmap milestones`);
  if (Array.isArray(content.metrics_compared) && content.metrics_compared.length > 0) signals.push(`${content.metrics_compared.length} verified outcomes`);
  return signals;
}

interface V2Deliverable {
  id: string;
  deliverable_type_key: string;
  title: string;
  status: string;
  current_version: number;
  created_at: string;
  updated_at: string;
  latest_version?: {
    version: number;
    quality_issues: { total_score?: number; critical?: string[]; remaining?: string[] } | null;
    generated_at: string;
  } | null;
}

async function loadV2Deliverables(engagementId: string): Promise<V2Deliverable[]> {
  const sb = getServerSupabase();
  try {
    const { data } = await sb
      .from('deliverables_v2')
      .select('id, deliverable_type_key, title, status, current_version, created_at, updated_at')
      .eq('engagement_id', engagementId)
      .order('updated_at', { ascending: false });
    const rows = (data as V2Deliverable[] | null) ?? [];
    // Pull latest version per deliverable for quality signal
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const { data: versions } = await sb
      .from('deliverable_versions')
      .select('deliverable_id, version, quality_issues, generated_at')
      .in('deliverable_id', ids)
      .order('version', { ascending: false });
    type LatestV = NonNullable<V2Deliverable['latest_version']>;
    const latest = new Map<string, LatestV>();
    for (const v of (versions as Array<{ deliverable_id: string; version: number; quality_issues: LatestV['quality_issues']; generated_at: string }> | null) ?? []) {
      if (!latest.has(v.deliverable_id)) {
        latest.set(v.deliverable_id, {
          version: v.version,
          quality_issues: v.quality_issues,
          generated_at: v.generated_at,
        });
      }
    }
    return rows.map((r) => ({ ...r, latest_version: latest.get(r.id) ?? null }));
  } catch (err) {
    console.warn('[loadV2Deliverables]', err);
    return [];
  }
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

export default async function DeliverablesPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId: graphId } = await params;
  const engagement = await getEngagementByGraphId(graphId);
  if (!engagement) notFound();

  const legacyList = (Array.isArray(engagement.deliverables) ? engagement.deliverables : []) as LegacyDeliverable[];
  const legacy = legacyList.slice().sort((a, b) => b.phase - a.phase);
  const v2 = await loadV2Deliverables(engagement.id);

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
      <div style={{ marginBottom: 6 }}>
        <Link
          href={`/engagements/${encodeURIComponent(graphId)}`}
          style={{ fontFamily: MONO, fontSize: 11, color: TEAL, textDecoration: 'none', letterSpacing: '0.08em' }}
        >
          ← engagement console
        </Link>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.14em', marginBottom: 4 }}>
          DELIVERABLES · {engagement.name}
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400, margin: 0 }}>
          Work products
        </h1>
      </div>

      {v2.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 12 }}>
            GENERATED · {v2.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {v2.map((d) => {
              const totalScore = d.latest_version?.quality_issues?.total_score;
              const critical = d.latest_version?.quality_issues?.critical ?? [];
              const remaining = d.latest_version?.quality_issues?.remaining ?? [];
              return (
                <Link
                  key={d.id}
                  href={`/engagements/${encodeURIComponent(graphId)}/deliverables/${d.id}`}
                  style={{
                    display: 'block',
                    padding: 14,
                    background: PANEL_BG,
                    border: BORDER,
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: INK,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{d.title}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: statusColor(d.status), letterSpacing: '0.12em' }}>
                      ● {d.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.1em' }}>
                      v{d.current_version}
                    </span>
                    {typeof totalScore === 'number' && (
                      <span style={{ fontFamily: MONO, fontSize: 9, color: qualityColor(totalScore), letterSpacing: '0.1em', marginLeft: 'auto' }}>
                        QUALITY {totalScore}/100
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: MUTE, fontFamily: MONO, letterSpacing: '0.08em' }}>
                    {d.deliverable_type_key} · generated {d.latest_version ? new Date(d.latest_version.generated_at).toLocaleString() : new Date(d.updated_at).toLocaleString()}
                  </div>
                  {(critical.length > 0 || remaining.length > 0) && (
                    <div style={{ marginTop: 8, fontSize: 12, color: MUTE, lineHeight: 1.5 }}>
                      {critical.length > 0 && (
                        <div style={{ color: CORAL, fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', marginBottom: 2 }}>
                          {critical.length} CRITICAL ISSUE{critical.length === 1 ? '' : 'S'}
                        </div>
                      )}
                      {remaining.length > 0 && (
                        <div style={{ color: AMBER, fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em' }}>
                          {remaining.length} REMAINING ISSUE{remaining.length === 1 ? '' : 'S'}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.1em', marginTop: 8 }}>
                    VIEW DETAIL →
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em', marginBottom: 12 }}>
          PHASE-GATE DELIVERABLES · {legacy.length}
        </div>
        {legacy.length === 0 && v2.length === 0 ? (
          <div style={{ padding: 20, border: BORDER, borderRadius: 10, background: PANEL_BG, color: MUTE, fontSize: 13.5, lineHeight: 1.5 }}>
            No deliverables generated yet. Phase-gate deliverables land automatically when the
            sponsor approves a phase (Phase 0 → charter; Phase 1 → diagnostic; etc.). On-demand
            deliverables (spec Phase 4 generator) can be triggered when the topic + deliverable
            type are assigned.
          </div>
        ) : legacy.length === 0 ? (
          <div style={{ padding: 14, border: BORDER, borderRadius: 10, background: PANEL_BG, color: MUTE, fontSize: 12 }}>
            No phase-gate deliverables yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {legacy.map((d, i) => (
              <div
                key={`${d.type}-${d.phase}-${i}`}
                style={{
                  padding: 14,
                  background: 'rgba(45,212,200,0.04)',
                  border: `0.5px solid rgba(45,212,200,0.2)`,
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: TEAL, letterSpacing: '0.14em' }}>
                    PHASE {d.phase} · {PHASE_LABELS[d.phase]?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {legacyTitle(d.type)}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: MUTE, marginLeft: 'auto' }}>
                    {new Date(d.generated_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: INK, lineHeight: 1.55, marginBottom: 8 }}>
                  {legacyPreview(d)}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {legacySignals(d).length > 0 ? legacySignals(d).map((signal) => (
                    <span
                      key={signal}
                      style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        color: MUTE,
                        letterSpacing: '0.08em',
                        padding: '3px 7px',
                        borderRadius: 999,
                        border: BORDER,
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      {signal.toUpperCase()}
                    </span>
                  )) : (
                    <span style={{ fontSize: 12, color: MUTE }}>
                      {Object.keys(d.content ?? {}).length} structured fields
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
