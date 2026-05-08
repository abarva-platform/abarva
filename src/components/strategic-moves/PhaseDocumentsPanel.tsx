// PhaseDocumentsPanel — async server component
//
// Fetches and renders the full phase-by-phase document set for a program.
// Used in two places:
//   1. The "Documents" tab on the move detail page (/strategic-moves/[moveId]?tab=documents)
//   2. The standalone Evidence Hub page (/strategic-moves/[moveId]/evidence)
//
// Props:
//   moveId        — program / engagement id
//   compact       — if true, reduces padding and hides the KPI strip (for tab use)
//   currentPhase  — highlights the current phase section

import { getServerSupabase } from '@/lib/supabase-server';
import { listAttachmentsForProgram } from '@/lib/programs/attachments';
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  FORMAT_LABELS,
  type DeliverableSpec,
  type DeliverableFormat,
} from '@/lib/programs/deliverable-registry';
import type { AttachmentRecord } from '@/lib/programs/attachments/types';

interface Props {
  moveId: string;
  currentPhase?: number;
  compact?: boolean;
}

interface DbDeliverable {
  id: string;
  deliverable_type_key: string;
  title: string | null;
  status: string;
  current_version: number;
  updated_at: string | null;
  latest_content: string | null;
}

// ── Data helpers ──────────────────────────────────────────────────────────────

async function fetchDeliverablesByKey(programId: string): Promise<Map<string, DbDeliverable>> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('deliverables_v2')
    .select(`
      id, deliverable_type_key, title, status, current_version, updated_at,
      deliverable_versions!inner(content, version)
    `)
    .eq('engagement_id', programId)
    .order('updated_at', { ascending: false });

  if (!data) return new Map();

  const byKey = new Map<string, DbDeliverable>();
  for (const row of data as Array<{
    id: string; deliverable_type_key: string; title: string | null;
    status: string; current_version: number; updated_at: string | null;
    deliverable_versions: Array<{ content: string | null; version: number }>;
  }>) {
    const versions = row.deliverable_versions ?? [];
    const latest = versions.reduce(
      (best, v) => (v.version > (best?.version ?? -1) ? v : best),
      null as { content: string | null; version: number } | null,
    );
    const existing = byKey.get(row.deliverable_type_key);
    if (!existing || (latest && latest.version > (existing.current_version ?? 0))) {
      byKey.set(row.deliverable_type_key, {
        id: row.id,
        deliverable_type_key: row.deliverable_type_key,
        title: row.title,
        status: row.status,
        current_version: row.current_version,
        updated_at: row.updated_at,
        latest_content: latest?.content ?? null,
      });
    }
  }
  return byKey;
}

function inferPhaseFromKey(typeKey: string): number {
  const spec = DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === typeKey);
  if (spec) return spec.phase;
  const k = typeKey.toLowerCase();
  if (/^p1_|charter/.test(k)) return 1;
  if (/^p2_|discover|diagnos|baseline|root_cause/.test(k)) return 2;
  if (/^p3_|design|architecture|operating|sourcing/.test(k)) return 3;
  if (/^p4_|roadmap|business_case|financial|tower_metric/.test(k)) return 4;
  if (/^p5_|mobili|handoff|measurement/.test(k)) return 5;
  return 0;
}

// ── Micro-components (plain JSX, no CSS modules) ──────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('docx')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('xlsx')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('pptx')) return '📋';
  if (mimeType.includes('image')) return '🖼';
  return '📎';
}

function statusDot(status: string): { color: string; label: string } {
  if (status === 'signed_off') return { color: '#16A34A', label: 'Signed off' };
  if (status === 'in_review')  return { color: '#D97706', label: 'In review' };
  return { color: '#9AA3B2', label: 'Draft' };
}

function FormatPills({ format }: { format: DeliverableFormat }) {
  const labels = FORMAT_LABELS[format];
  const colors: Record<string, { bg: string; fg: string }> = {
    HTML:  { bg: 'rgba(27,43,92,0.07)',  fg: '#1B2B5C' },
    Word:  { bg: 'rgba(37,99,235,0.07)', fg: '#1D4ED8' },
    Excel: { bg: 'rgba(22,163,74,0.07)', fg: '#15803D' },
  };
  return (
    <>
      {labels.map((label) => (
        <span key={label} style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          padding: '1px 6px', borderRadius: 3,
          fontFamily: 'JetBrains Mono, monospace',
          backgroundColor: colors[label]?.bg ?? 'rgba(82,88,102,0.06)',
          color: colors[label]?.fg ?? '#525866',
        }}>
          {label}
        </span>
      ))}
    </>
  );
}

function linkStyle(variant: 'primary' | 'ghost' | 'muted' | 'excel'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '4px 10px', borderRadius: 4,
    fontSize: 11, fontWeight: 600, textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
  switch (variant) {
    case 'primary': return { ...base, backgroundColor: '#1B2B5C', border: '1px solid #1B2B5C', color: '#FFFFFF' };
    case 'ghost':   return { ...base, backgroundColor: '#F8F7F4', border: '1px solid #D4D0C8', color: '#1A1A18' };
    case 'muted':   return { ...base, backgroundColor: 'transparent', border: '1px solid #E2DFD8', color: '#525866' };
    case 'excel':   return { ...base, backgroundColor: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', color: '#15803D' };
  }
}

function DocumentRow({
  spec,
  dbRow,
  moveId,
}: {
  spec: DeliverableSpec;
  dbRow: DbDeliverable | undefined;
  moveId: string;
}) {
  const hasContent = Boolean(dbRow?.latest_content?.trim());
  const dot = dbRow ? statusDot(dbRow.status) : null;
  const isExcel = spec.formatRecommendation === 'excel';
  const base = `/api/programs/${moveId}/deliverables/${dbRow?.id}/content-export`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      background: '#FFFFFF',
      border: '1px solid #ECEAE4',
      borderLeft: `3px solid ${spec.gateArtifact ? '#1B2B5C' : '#D4D0C8'}`,
      borderRadius: 6,
      flexWrap: 'wrap',
    }}>
      {/* Left: title block */}
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
          <FormatPills format={spec.formatRecommendation} />
          {spec.gateArtifact && (
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
              color: '#1B2B5C', backgroundColor: 'rgba(27,43,92,0.07)',
              padding: '1px 5px', borderRadius: 2,
              fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
            }}>Gate</span>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', lineHeight: 1.3 }}>
          {spec.documentTitle}
        </div>
        <div style={{ fontSize: 10, color: '#9AA3B2', marginTop: 1 }}>
          {spec.audiencePrimary}
        </div>
      </div>

      {/* Middle: status + date */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
        {dot && hasContent ? (
          <>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dot.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#6B7280' }}>{dot.label}</span>
          </>
        ) : (
          <span style={{ fontSize: 10, color: '#C4C0B8', fontStyle: 'italic' }}>not generated</span>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        {hasContent && dbRow ? (
          <>
            {!isExcel && (
              <>
                <a href={`${base}?format=html`} style={linkStyle('ghost')}>↓ HTML</a>
                <a href={`${base}?format=docx`} style={linkStyle('primary')}>↓ Word</a>
              </>
            )}
            {(isExcel || spec.formatRecommendation === 'html-word-excel') && (
              <a href={`${base}?format=xlsx`} style={linkStyle('excel')}>↓ Excel</a>
            )}
            <span style={{ fontSize: 10, color: '#C4C0B8' }}>{formatDate(dbRow.updated_at)}</span>
          </>
        ) : (
          <a href={`/strategic-moves/${moveId}/phase/${spec.phase}`} style={linkStyle('muted')}>
            Generate →
          </a>
        )}
      </div>
    </div>
  );
}

function AttachmentRow({ attachment, moveId }: { attachment: AttachmentRecord; moveId: string }) {
  return (
    <a
      href={`/api/programs/${moveId}/attachments/${attachment.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px',
        backgroundColor: '#FAFAF8', border: '1px solid #ECEAE4',
        borderRadius: 5, textDecoration: 'none', color: 'inherit',
      }}
    >
      <span style={{ fontSize: 14, flexShrink: 0 }}>{mimeIcon(attachment.mimeType)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attachment.originalName}
        </div>
        <div style={{ fontSize: 10, color: '#9AA3B2' }}>
          {formatBytes(attachment.sizeBytes)} · {formatDate(attachment.createdAt)}
        </div>
      </div>
      <span style={{ fontSize: 10, color: '#1B2B5C', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>↓</span>
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<number, string> = {
  1: 'P1 Charter',
  2: 'P2 Discover & Diagnose',
  3: 'P3 Design Future State',
  4: 'P4 Roadmap & Business Case',
  5: 'P5 Approval & Mobilization',
};

export async function PhaseDocumentsPanel({ moveId, currentPhase, compact }: Props) {
  const [deliverablesByKey, attachments] = await Promise.all([
    fetchDeliverablesByKey(moveId),
    listAttachmentsForProgram(moveId).catch(() => [] as AttachmentRecord[]),
  ]);

  // Group attachments by phase
  const attachmentsByPhase = new Map<number, AttachmentRecord[]>();
  for (const a of attachments) {
    const phase = a.phase ?? 0;
    if (!attachmentsByPhase.has(phase)) attachmentsByPhase.set(phase, []);
    attachmentsByPhase.get(phase)!.push(a);
  }

  // Collect non-registry deliverables (legacy keys)
  const canonicalKeys = new Set(DELIVERABLE_REGISTRY.map((d) => d.deliverableTypeKey));
  const extraDeliverables = Array.from(deliverablesByKey.values()).filter(
    (d) => !canonicalKeys.has(d.deliverable_type_key),
  );

  const withContent = Array.from(deliverablesByKey.values()).filter((d) => d.latest_content?.trim()).length;
  const totalCanonical = DELIVERABLE_REGISTRY.filter((d) => !d.deprecated).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* KPI strip — hidden in compact mode */}
      {!compact && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Expected', value: String(totalCanonical) },
            { label: 'Generated', value: String(withContent) },
            { label: 'Uploads', value: String(attachments.length) },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              padding: '6px 12px', backgroundColor: '#FFFFFF',
              border: '1px solid #E2DFD8', borderRadius: 5, minWidth: 70,
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#9AA3B2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1 }}>{kpi.label}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1A1A18' }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#6B7280' }}>
          <div style={{ width: 3, height: 12, backgroundColor: '#1B2B5C', borderRadius: 1 }} />
          Gate artifact
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#6B7280' }}>
          <div style={{ width: 3, height: 12, backgroundColor: '#D4D0C8', borderRadius: 1 }} />
          Working document
        </div>
      </div>

      {/* Phase sections */}
      {[1, 2, 3, 4, 5].map((phase) => {
        const keys = PHASE_CANONICAL_KEYS[phase] ?? [];
        const specs = keys
          .map((key) => DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key))
          .filter(Boolean) as DeliverableSpec[];
        const phaseAttachments = attachmentsByPhase.get(phase) ?? [];
        const generatedCount = specs.filter(
          (s) => deliverablesByKey.get(s.deliverableTypeKey)?.latest_content?.trim(),
        ).length;
        const isCurrent = phase === currentPhase;

        return (
          <div key={phase} style={{ marginBottom: compact ? 24 : 32 }}>
            {/* Phase header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 8,
              marginBottom: 8,
              borderBottom: `2px solid ${isCurrent ? '#1B2B5C' : '#E2DFD8'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: compact ? 14 : 15,
                  color: isCurrent ? '#1A1A18' : '#525866',
                  fontWeight: isCurrent ? 'normal' : 'normal',
                }}>
                  {PHASE_LABELS[phase]}
                </span>
                {isCurrent && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    color: '#1B2B5C', backgroundColor: 'rgba(27,43,92,0.07)',
                    border: '1px solid rgba(27,43,92,0.2)',
                    padding: '1px 6px', borderRadius: 3,
                    fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
                  }}>Current</span>
                )}
                <span style={{ fontSize: 10, color: '#9AA3B2' }}>
                  {generatedCount}/{specs.length}
                </span>
              </div>
              <a
                href={`/strategic-moves/${moveId}/phase/${phase}`}
                style={{ fontSize: 11, color: '#1B2B5C', fontWeight: 600, textDecoration: 'none' }}
              >
                Open workspace →
              </a>
            </div>

            {/* Document rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {specs.map((spec) => (
                <DocumentRow
                  key={spec.deliverableTypeKey}
                  spec={spec}
                  dbRow={deliverablesByKey.get(spec.deliverableTypeKey)}
                  moveId={moveId}
                />
              ))}

              {/* Attachments for this phase */}
              {phaseAttachments.length > 0 && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#C4C0B8',
                    fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', marginBottom: 2,
                  }}>
                    Uploaded evidence ({phaseAttachments.length})
                  </div>
                  {phaseAttachments.map((a) => (
                    <AttachmentRow key={a.id} attachment={a} moveId={moveId} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Legacy / extra deliverables */}
      {extraDeliverables.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px dashed #D4D0C8' }}>
          <div style={{ fontSize: 10, color: '#9AA3B2', fontStyle: 'italic', marginBottom: 8 }}>
            Other documents (legacy)
          </div>
          {extraDeliverables.map((row) => {
            const title = row.title || row.deliverable_type_key.replace(/_/g, ' ');
            const phase = inferPhaseFromKey(row.deliverable_type_key);
            const hasContent = Boolean(row.latest_content?.trim());
            return (
              <div key={row.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 6,
                background: '#FAFAF8', border: '1px solid #ECEAE4', borderRadius: 5,
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#C4C0B8', fontFamily: 'JetBrains Mono, monospace' }}>{row.deliverable_type_key}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#525866' }}>{title}</div>
                </div>
                {hasContent && (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <a href={`/api/programs/${moveId}/deliverables/${row.id}/content-export?format=html`} style={linkStyle('ghost')}>↓ HTML</a>
                    <a href={`/api/programs/${moveId}/deliverables/${row.id}/content-export?format=docx`} style={linkStyle('primary')}>↓ Word</a>
                  </div>
                )}
                <a href={`/strategic-moves/${moveId}/phase/${phase || 1}`} style={linkStyle('muted')}>Workspace →</a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
