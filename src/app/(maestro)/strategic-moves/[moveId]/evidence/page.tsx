// Phase Evidence Hub — /strategic-moves/[moveId]/evidence
//
// Server Component. Shows every phase (P1–P5) with:
//   • Expected document set from the registry (gate artifacts + working docs)
//   • Per document: status (generated/empty), audience, format badges, exports
//   • Uploaded attachments by phase
//
// The registry defines what SHOULD exist; the DB shows what DOES exist.
// Documents not yet generated show a "Generate" call-to-action linking to
// the phase workspace.

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { getStrategicMoveById } from '@/lib/programs/queries';
import { getStrategicMovesTenancy } from '@/lib/programs/strategic-moves-context';
import { listAttachmentsForProgram } from '@/lib/programs/attachments';
import { getServerSupabase } from '@/lib/supabase-server';
import { AppShell } from '@/components/shell/AppShell';
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  FORMAT_LABELS,
  type DeliverableSpec,
  type DeliverableFormat,
} from '@/lib/programs/deliverable-registry';
import type { AttachmentRecord } from '@/lib/programs/attachments/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ moveId: string }>;
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

const PHASE_LABELS: Record<number, string> = {
  0: 'P0 Originate',
  1: 'P1 Charter',
  2: 'P2 Discover & Diagnose',
  3: 'P3 Design Future State',
  4: 'P4 Roadmap & Business Case',
  5: 'P5 Approval & Mobilization',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mimeIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('docx')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('xlsx')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('pptx')) return '📋';
  if (mimeType.includes('image')) return '🖼';
  if (mimeType.includes('text')) return '📃';
  return '📎';
}

function statusChip(status: string): { backgroundColor: string; color: string; border: string; label: string } {
  switch (status) {
    case 'signed_off': return { backgroundColor: 'rgba(22,163,74,0.08)', color: '#15803D', border: '1px solid rgba(22,163,74,0.25)', label: 'Signed off' };
    case 'in_review':  return { backgroundColor: 'rgba(234,179,8,0.08)',  color: '#A16207', border: '1px solid rgba(234,179,8,0.25)',  label: 'In review' };
    default:           return { backgroundColor: 'rgba(82,88,102,0.06)', color: '#525866', border: '1px solid rgba(82,88,102,0.15)', label: 'Draft' };
  }
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

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchDeliverables(programId: string): Promise<Map<string, DbDeliverable>> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('deliverables_v2')
    .select(`
      id,
      deliverable_type_key,
      title,
      status,
      current_version,
      updated_at,
      deliverable_versions!inner(content, version)
    `)
    .eq('engagement_id', programId)
    .order('updated_at', { ascending: false });

  if (!data) return new Map();

  const byKey = new Map<string, DbDeliverable>();
  for (const row of data as Array<{
    id: string;
    deliverable_type_key: string;
    title: string | null;
    status: string;
    current_version: number;
    updated_at: string | null;
    deliverable_versions: Array<{ content: string | null; version: number }>;
  }>) {
    const versions = row.deliverable_versions ?? [];
    const latest = versions.reduce(
      (best, v) => (v.version > (best?.version ?? -1) ? v : best),
      null as { content: string | null; version: number } | null,
    );
    const key = row.deliverable_type_key;
    const existing = byKey.get(key);
    if (!existing || (latest && latest.version > (existing.current_version ?? 0))) {
      byKey.set(key, {
        id: row.id,
        deliverable_type_key: key,
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

// ── Sub-components ────────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: DeliverableFormat }) {
  const labels = FORMAT_LABELS[format];
  const colors: Record<string, { bg: string; color: string }> = {
    'HTML':  { bg: 'rgba(27,43,92,0.06)',   color: '#1B2B5C' },
    'Word':  { bg: 'rgba(37,99,235,0.07)',  color: '#1D4ED8' },
    'Excel': { bg: 'rgba(22,163,74,0.07)',  color: '#15803D' },
  };
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {labels.map((label) => (
        <span key={label} style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.06em',
          padding: '2px 6px',
          borderRadius: 3,
          fontFamily: 'JetBrains Mono, monospace',
          backgroundColor: colors[label]?.bg ?? 'rgba(82,88,102,0.06)',
          color: colors[label]?.color ?? '#525866',
        }}>
          {label}
        </span>
      ))}
    </div>
  );
}

function DocumentCard({
  spec,
  dbRow,
  programId,
}: {
  spec: DeliverableSpec;
  dbRow: DbDeliverable | undefined;
  programId: string;
}) {
  const hasContent = Boolean(dbRow?.latest_content?.trim());
  const chip = dbRow ? statusChip(dbRow.status) : null;
  const isExcel = spec.formatRecommendation === 'excel';

  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${hasContent ? '#E2DFD8' : '#EAE8E2'}`,
      borderLeft: `3px solid ${spec.gateArtifact ? '#1B2B5C' : '#D4D0C8'}`,
      borderRadius: 8,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      opacity: hasContent ? 1 : 0.85,
    }}>
      {/* Top row: title + gate badge + format + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            {spec.gateArtifact && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#1B2B5C',
                backgroundColor: 'rgba(27,43,92,0.08)',
                border: '1px solid rgba(27,43,92,0.2)',
                padding: '1px 6px',
                borderRadius: 3,
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
              }}>
                Gate Artifact
              </span>
            )}
            <FormatBadge format={spec.formatRecommendation} />
            {spec.deprecated && (
              <span style={{
                fontSize: 9,
                color: '#9AA3B2',
                fontStyle: 'italic',
                fontFamily: 'JetBrains Mono, monospace',
              }}>legacy</span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A18', lineHeight: 1.35 }}>
            {spec.documentTitle}
          </div>
          <div style={{ fontSize: 11, color: '#9AA3B2', marginTop: 2 }}>
            {spec.audiencePrimary}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {chip && (
            <span style={{ ...chip, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
              {chip.label}
            </span>
          )}
          {dbRow && (
            <span style={{ fontSize: 10, color: '#C4C0B8', fontFamily: 'JetBrains Mono, monospace' }}>
              v{dbRow.current_version} · {formatDate(dbRow.updated_at)}
            </span>
          )}
        </div>
      </div>

      {/* Purpose line */}
      <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
        {spec.documentPurpose}
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {hasContent && dbRow ? (
          <>
            {!isExcel && (
              <>
                <a
                  href={`/api/programs/${programId}/deliverables/${dbRow.id}/content-export?format=html`}
                  style={exportLinkStyle('ghost')}
                >
                  ↓ HTML
                </a>
                <a
                  href={`/api/programs/${programId}/deliverables/${dbRow.id}/content-export?format=docx`}
                  style={exportLinkStyle('primary')}
                >
                  ↓ Word
                </a>
              </>
            )}
            {(isExcel || spec.formatRecommendation === 'html-word-excel') && (
              <a
                href={`/api/programs/${programId}/deliverables/${dbRow.id}/content-export?format=xlsx`}
                style={{
                  ...exportLinkStyle('green'),
                }}
              >
                ↓ Excel
              </a>
            )}
            <a
              href={`/strategic-moves/${programId}/phase/${spec.phase}`}
              style={exportLinkStyle('muted')}
            >
              Open workspace →
            </a>
          </>
        ) : (
          <>
            <span style={{ fontSize: 11, color: '#B45309', fontStyle: 'italic' }}>
              Not generated yet
            </span>
            <a
              href={`/strategic-moves/${programId}/phase/${spec.phase}`}
              style={exportLinkStyle('primary')}
            >
              Generate in workspace →
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// Tiny helper to keep style objects DRY
function exportLinkStyle(variant: 'primary' | 'ghost' | 'muted' | 'green'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  };
  switch (variant) {
    case 'primary': return { ...base, backgroundColor: '#1B2B5C', border: '1px solid #1B2B5C', color: '#FFFFFF' };
    case 'ghost':   return { ...base, backgroundColor: '#F8F7F4', border: '1px solid #D4D0C8', color: '#1A1A18' };
    case 'muted':   return { ...base, backgroundColor: 'transparent', border: '1px solid #D4D0C8', color: '#525866' };
    case 'green':   return { ...base, backgroundColor: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', color: '#15803D' };
  }
}

function AttachmentRow({ attachment, programId }: { attachment: AttachmentRecord; programId: string }) {
  return (
    <a
      href={`/api/programs/${programId}/attachments/${attachment.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2DFD8',
        borderRadius: 6,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <span style={{ fontSize: 16 }}>{mimeIcon(attachment.mimeType)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attachment.originalName}
        </div>
        <div style={{ fontSize: 11, color: '#9AA3B2', marginTop: 1 }}>
          {formatBytes(attachment.sizeBytes)} · {formatDate(attachment.createdAt)}
          {attachment.scanStatus === 'clean' && ' · ✓ scanned'}
        </div>
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: '#1B2B5C',
        backgroundColor: 'rgba(27,43,92,0.06)',
        padding: '2px 7px',
        borderRadius: 3,
        fontFamily: 'JetBrains Mono, monospace',
        flexShrink: 0,
      }}>↓</span>
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PhaseEvidenceHubPage({ params }: Props) {
  await requireProductModule('programs');
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect('/sign-in');

  const { moveId } = await params;
  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  const [deliverablesByKey, attachments] = await Promise.all([
    fetchDeliverables(moveId),
    listAttachmentsForProgram(moveId).catch(() => [] as AttachmentRecord[]),
  ]);

  // Group attachments by phase
  const attachmentsByPhase = new Map<number, AttachmentRecord[]>();
  for (const a of attachments) {
    const phase = a.phase ?? 0;
    if (!attachmentsByPhase.has(phase)) attachmentsByPhase.set(phase, []);
    attachmentsByPhase.get(phase)!.push(a);
  }

  // Collect any DB deliverables NOT in the canonical registry (legacy / custom)
  const canonicalKeys = new Set(DELIVERABLE_REGISTRY.map((d) => d.deliverableTypeKey));
  const extraDeliverables: DbDeliverable[] = [];
  for (const [key, row] of deliverablesByKey.entries()) {
    if (!canonicalKeys.has(key)) extraDeliverables.push(row);
  }

  const totalGenerated = deliverablesByKey.size;
  const withContent = Array.from(deliverablesByKey.values()).filter((d) => d.latest_content?.trim()).length;
  const totalCanonical = DELIVERABLE_REGISTRY.filter((d) => !d.deprecated).length;

  return (
    <AppShell surface="programs-detail">
      <div style={{ padding: '24px 32px', maxWidth: 960, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, color: '#9AA3B2' }}>
            <Link href="/strategic-moves" style={{ color: '#9AA3B2', textDecoration: 'none' }}>Strategic Moves</Link>
            <span>›</span>
            <Link href={`/strategic-moves/${moveId}`} style={{ color: '#9AA3B2', textDecoration: 'none' }}>{move.displayCode}</Link>
            <span>›</span>
            <span>Evidence</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 'normal', margin: '0 0 4px', color: '#1A1A18' }}>
            Phase Evidence Hub
          </h1>
          <div style={{ fontSize: 13, color: '#525866', marginBottom: 18 }}>
            {move.name} · {move.tenant.name}
          </div>

          {/* KPI strip */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Documents expected', value: String(totalCanonical) },
              { label: 'Generated', value: String(withContent) },
              { label: 'Uploads', value: String(attachments.length) },
              { label: 'Current phase', value: `P${move.currentPhase ?? 1}` },
            ].map((kpi) => (
              <div key={kpi.label} style={{ padding: '8px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2DFD8', borderRadius: 6, minWidth: 90 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{kpi.label}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A18' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
              <div style={{ width: 3, height: 16, backgroundColor: '#1B2B5C', borderRadius: 2 }} />
              Gate artifact (blocks phase advancement)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
              <div style={{ width: 3, height: 16, backgroundColor: '#D4D0C8', borderRadius: 2 }} />
              Working document
            </div>
          </div>
        </div>

        {/* ── Phase sections ── */}
        {[1, 2, 3, 4, 5].map((phase) => {
          const canonicalKeys = PHASE_CANONICAL_KEYS[phase] ?? [];
          const specs = canonicalKeys
            .map((key) => DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key))
            .filter(Boolean) as DeliverableSpec[];

          const phaseAttachments = attachmentsByPhase.get(phase) ?? [];
          const gateSpecs = specs.filter((s) => s.gateArtifact);
          const workingSpecs = specs.filter((s) => !s.gateArtifact);
          const generatedCount = specs.filter((s) => deliverablesByKey.get(s.deliverableTypeKey)?.latest_content?.trim()).length;

          return (
            <div key={phase} style={{ marginBottom: 44 }}>
              {/* Phase header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 0 10px',
                borderBottom: '2px solid #1B2B5C',
                marginBottom: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 17,
                    fontWeight: 'normal',
                    color: '#1A1A18',
                  }}>
                    {PHASE_LABELS[phase]}
                  </span>
                  <span style={{ fontSize: 11, color: '#9AA3B2' }}>
                    {generatedCount}/{specs.length} documents generated
                  </span>
                </div>
                <Link
                  href={`/strategic-moves/${moveId}/phase/${phase}`}
                  style={{ fontSize: 12, color: '#1B2B5C', fontWeight: 600, textDecoration: 'none' }}
                >
                  Open workspace →
                </Link>
              </div>

              {/* Gate artifacts */}
              {gateSpecs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#1B2B5C',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}>
                    Gate artifacts — required for phase advancement
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {gateSpecs.map((spec) => (
                      <DocumentCard
                        key={spec.deliverableTypeKey}
                        spec={spec}
                        dbRow={deliverablesByKey.get(spec.deliverableTypeKey)}
                        programId={moveId}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Working documents */}
              {workingSpecs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#9AA3B2',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}>
                    Working documents
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {workingSpecs.map((spec) => (
                      <DocumentCard
                        key={spec.deliverableTypeKey}
                        spec={spec}
                        dbRow={deliverablesByKey.get(spec.deliverableTypeKey)}
                        programId={moveId}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded evidence */}
              {phaseAttachments.length > 0 && (
                <div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#9AA3B2',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}>
                    Uploaded evidence ({phaseAttachments.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {phaseAttachments.map((a) => (
                      <AttachmentRow key={a.id} attachment={a} programId={moveId} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Extra / legacy deliverables ── */}
        {(extraDeliverables.length > 0 || (attachmentsByPhase.get(0)?.length ?? 0) > 0) && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ borderBottom: '1px dashed #D4D0C8', paddingBottom: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 13, color: '#9AA3B2', fontStyle: 'italic' }}>
                Other / legacy documents
              </span>
            </div>
            {extraDeliverables.map((row) => {
              const title = row.title || row.deliverable_type_key.replace(/_/g, ' ');
              const phase = inferPhaseFromKey(row.deliverable_type_key);
              const hasContent = Boolean(row.latest_content?.trim());
              const chip = statusChip(row.status);
              return (
                <div key={row.id} style={{
                  background: '#FAFAF8',
                  border: '1px solid #E2DFD8',
                  borderRadius: 6,
                  padding: '12px 14px',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#C4C0B8', marginBottom: 2 }}>
                      {row.deliverable_type_key}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#525866' }}>{title}</div>
                  </div>
                  <span style={{ ...chip, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>{chip.label}</span>
                  {hasContent && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`/api/programs/${moveId}/deliverables/${row.id}/content-export?format=html`} style={exportLinkStyle('ghost')}>↓ HTML</a>
                      <a href={`/api/programs/${moveId}/deliverables/${row.id}/content-export?format=docx`} style={exportLinkStyle('primary')}>↓ Word</a>
                    </div>
                  )}
                  <a href={`/strategic-moves/${moveId}/phase/${phase || 1}`} style={exportLinkStyle('muted')}>Workspace →</a>
                </div>
              );
            })}
            {(attachmentsByPhase.get(0) ?? []).map((a) => (
              <AttachmentRow key={a.id} attachment={a} programId={moveId} />
            ))}
          </div>
        )}

        {/* Footer nav */}
        <div style={{ borderTop: '1px solid #E2DFD8', paddingTop: 20, display: 'flex', gap: 16 }}>
          <Link href={`/strategic-moves/${moveId}`} style={{ fontSize: 13, color: '#1B2B5C', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to move
          </Link>
          <Link href={`/strategic-moves/${moveId}/phase/${move.currentPhase ?? 1}`} style={{ fontSize: 13, color: '#525866', textDecoration: 'none' }}>
            Open current phase workspace →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
