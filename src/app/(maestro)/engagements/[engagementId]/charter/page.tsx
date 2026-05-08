import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getStructuredEvidenceRefs,
  getStructuredSections,
} from '@/lib/deliverables/structured';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#14B8A6';
const PURPLE = '#9B6DFF';
const CORAL = '#FF6B4A';
const AMBER = '#F5C54A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

function stanceColor(s: string): string {
  if (s === 'sponsor' || s === 'champion') return TEAL;
  if (s === 'skeptic' || s === 'blocker') return CORAL;
  return MUTE;
}

export default async function CharterPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId: graphId } = await params;
  const engagement = await getEngagementByGraphId(graphId);
  if (!engagement) notFound();
  const sb = getServerSupabase();

  const { data: deliverableData } = await sb
    .from('deliverables_v2')
    .select('id, current_version, updated_at')
    .eq('engagement_id', engagement.id)
    .eq('deliverable_type_key', 'charter')
    .maybeSingle();
  const charterDeliverable = deliverableData as { id: string; current_version: number; updated_at: string } | null;

  const { data: versionData } = charterDeliverable
    ? await sb
        .from('deliverable_versions')
        .select('content, structured_data, generated_at')
        .eq('deliverable_id', charterDeliverable.id)
        .eq('version', charterDeliverable.current_version)
        .maybeSingle()
    : { data: null };
  const charterVersion = versionData as {
    content: string | null;
    structured_data: unknown;
    generated_at: string;
  } | null;

  const legacyCharter = ((Array.isArray(engagement.deliverables) ? engagement.deliverables : []) as Array<{
    type?: string;
    generated_at?: string;
    content?: Record<string, unknown>;
  }>).find((item) => item.type === 'engagement_charter' || item.type === 'charter');

  const charter = ((engagement.charter ?? legacyCharter?.content ?? {}) as {
    problem_statement?: string;
    forcing_event?: string;
    scope_in?: string[];
    scope_out?: string[];
    stakeholders?: Array<{ name: string; role: string; stance: string }>;
    success_criteria?: string[];
    constraints?: string[];
    generated_at?: string;
  });
  const v2Sections = getStructuredSections(charterVersion?.structured_data, charterVersion?.content ?? null);
  const v2EvidenceRefs = getStructuredEvidenceRefs(charterVersion?.structured_data, charterVersion?.content ?? null);

  const isEmpty = v2Sections.length === 0 && Object.keys(charter).length === 0;

  return (
    <div
      style={{
        padding: '24px 32px 60px',
        maxWidth: 1100,
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
        <div style={{ fontFamily: MONO, fontSize: 10, color: PURPLE, letterSpacing: '0.14em', marginBottom: 6 }}>
          ENGAGEMENT CHARTER
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
          {engagement.name}
        </h1>
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.1em', marginTop: 6 }}>
          {engagement.industry_code} · {engagement.function_code} · Phase {engagement.current_phase}
          {(charterVersion?.generated_at || charter.generated_at || legacyCharter?.generated_at) && <> · LOCKED {new Date(charterVersion?.generated_at ?? charter.generated_at ?? legacyCharter!.generated_at!).toLocaleDateString()}</>}
        </div>
      </div>

      {isEmpty ? (
        <div style={{ padding: 24, border: BORDER, borderRadius: 10, background: PANEL_BG, color: MUTE, fontSize: 14, lineHeight: 1.6 }}>
          Charter not yet generated. It lands when Phase 0 is approved by the sponsor or when the
          charter generator is re-run for this engagement. Once available, this view renders the
          problem statement, scope, stakeholder map, success criteria, and constraints directly from
          the generated artifact.
        </div>
      ) : v2Sections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {v2EvidenceRefs.length > 0 && (
            <section>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', marginBottom: 10 }}>
                SOURCE TURNS · {v2EvidenceRefs.length}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {v2EvidenceRefs.map((ref) => (
                  <span
                    key={ref}
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      color: TEAL,
                      letterSpacing: '0.08em',
                      padding: '4px 7px',
                      borderRadius: 999,
                      background: 'rgba(20,184,166,0.08)',
                      border: `0.5px solid ${TEAL}40`,
                    }}
                  >
                    {ref.toUpperCase()}
                  </span>
                ))}
              </div>
            </section>
          )}

          {v2Sections.map((section, index) => (
            <section key={section.key}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.14em' }}>
                  {section.title.toUpperCase()}
                </div>
                {section.citations.length > 0 && (
                  <span style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em', marginLeft: 'auto' }}>
                    {section.citations.length} cite{section.citations.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <div style={{ padding: 16, border: BORDER, borderRadius: 10, background: PANEL_BG, color: INK, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {section.body}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {charter.problem_statement && (
            <Section label="PROBLEM STATEMENT">
              <p style={{ fontSize: 14, color: INK, lineHeight: 1.6, margin: 0 }}>{charter.problem_statement}</p>
            </Section>
          )}

          {charter.forcing_event && (
            <Section label="FORCING EVENT" color={AMBER}>
              <p style={{ fontSize: 14, color: INK, lineHeight: 1.6, margin: 0 }}>{charter.forcing_event}</p>
            </Section>
          )}

          {(charter.scope_in?.length || charter.scope_out?.length) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {charter.scope_in && charter.scope_in.length > 0 && (
                <Section label="IN SCOPE" color={TEAL}>
                  <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.7 }}>
                    {charter.scope_in.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </Section>
              )}
              {charter.scope_out && charter.scope_out.length > 0 && (
                <Section label="OUT OF SCOPE" color={MUTE}>
                  <ul style={{ margin: 0, paddingLeft: 20, color: MUTE, fontSize: 13, lineHeight: 1.7 }}>
                    {charter.scope_out.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </Section>
              )}
            </div>
          )}

          {charter.stakeholders && charter.stakeholders.length > 0 && (
            <Section label="STAKEHOLDERS">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {charter.stakeholders.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: BORDER, borderRadius: 6 }}>
                    <span style={{ fontSize: 13, color: INK, fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: MUTE }}>· {s.role}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: stanceColor(s.stance), letterSpacing: '0.1em', marginLeft: 'auto' }}>
                      {s.stance?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {charter.success_criteria && charter.success_criteria.length > 0 && (
            <Section label="SUCCESS CRITERIA" color={TEAL}>
              <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.7 }}>
                {charter.success_criteria.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </Section>
          )}

          {charter.constraints && charter.constraints.length > 0 && (
            <Section label="CONSTRAINTS" color={CORAL}>
              <ul style={{ margin: 0, paddingLeft: 20, color: INK, fontSize: 13, lineHeight: 1.7 }}>
                {charter.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, color, children }: { label: string; color?: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ fontFamily: MONO, fontSize: 10, color: color ?? MUTE, letterSpacing: '0.14em', marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </section>
  );
}
