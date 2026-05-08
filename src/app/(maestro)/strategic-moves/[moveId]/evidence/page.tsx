// Phase Evidence Hub — /strategic-moves/[moveId]/evidence
//
// Server Component. Shows every phase (P1–P5) with:
//   • Nexus-generated deliverables — title, status, version,
//     "Download HTML" and "Download Word" links
//   • Uploaded attachments — filename, size, phase, download link
//
// Auth mirrors the phase workspace page: requireProductModule('programs')
// + getStrategicMovesTenancy() + getStrategicMoveById().
// listAttachmentsForProgram() runs server-side with the service-role client.

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { getStrategicMoveById } from '@/lib/programs/queries';
import { getStrategicMovesTenancy } from '@/lib/programs/strategic-moves-context';
import { listAttachmentsForProgram } from '@/lib/programs/attachments';
import { getServerSupabase } from '@/lib/supabase-server';
import { AppShell } from '@/components/shell/AppShell';
import type { AttachmentRecord } from '@/lib/programs/attachments/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ moveId: string }>;
}

interface DeliverableRow {
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
  5: 'P5 Mobilize & Handoff',
};

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
  if (mimeType.includes('word') || mimeType.includes('docx') || mimeType.includes('doc')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('xlsx')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('pptx')) return '📋';
  if (mimeType.includes('image')) return '🖼';
  if (mimeType.includes('text')) return '📃';
  return '📎';
}

function statusChipStyle(status: string): { backgroundColor: string; color: string; border: string } {
  switch (status) {
    case 'signed_off': return { backgroundColor: 'rgba(22,163,74,0.08)', color: '#15803D', border: '1px solid rgba(22,163,74,0.25)' };
    case 'in_review': return { backgroundColor: 'rgba(234,179,8,0.08)', color: '#A16207', border: '1px solid rgba(234,179,8,0.25)' };
    default: return { backgroundColor: 'rgba(82,88,102,0.06)', color: '#525866', border: '1px solid rgba(82,88,102,0.15)' };
  }
}

function statusLabel(status: string): string {
  if (status === 'signed_off') return 'Signed off';
  if (status === 'in_review') return 'In review';
  return 'Draft';
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchDeliverables(programId: string): Promise<DeliverableRow[]> {
  const sb = getServerSupabase();
  // Fetch deliverables with their latest version content in one join
  const { data, error } = await sb
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

  if (error || !data) return [];

  // Group by deliverable id, keep only the max version's content
  const byId = new Map<string, DeliverableRow>();
  for (const row of data as Array<{
    id: string;
    deliverable_type_key: string;
    title: string | null;
    status: string;
    current_version: number;
    updated_at: string | null;
    deliverable_versions: Array<{ content: string | null; version: number }>;
  }>) {
    const existing = byId.get(row.id);
    const versions = row.deliverable_versions ?? [];
    const latest = versions.reduce(
      (best, v) => (v.version > (best?.version ?? -1) ? v : best),
      null as { content: string | null; version: number } | null,
    );
    if (!existing || (latest && (latest.version > (existing.current_version ?? 0)))) {
      byId.set(row.id, {
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
  return Array.from(byId.values());
}

// Infer phase number from deliverable_type_key naming conventions:
//   p1_charter, charter → 1
//   p2_discovery_report → 2
//   p3_design → 3
//   p4_roadmap → 4
//   p5_handoff → 5
//   origination_brief, brief → 0
function inferPhase(typeKey: string): number {
  const k = typeKey.toLowerCase();
  if (/^p1_|_p1_|_charter$|^charter$/.test(k)) return 1;
  if (/^p2_|_p2_|discover|diagnos|baseline|root.cause/.test(k)) return 2;
  if (/^p3_|_p3_|design|future.state|architecture|stakehold/.test(k)) return 3;
  if (/^p4_|_p4_|roadmap|business.case|financial|economic/.test(k)) return 4;
  if (/^p5_|_p5_|mobili|handoff|tower/.test(k)) return 5;
  if (/origina|brief|pilot|okr/.test(k)) return 0;
  return 0;
}

// ── Components ────────────────────────────────────────────────────────────────

function SectionHeader({ phase, count }: { phase: number; count: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 0 10px',
      borderBottom: '1px solid #E2DFD8',
      marginBottom: 16,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: '#1B2B5C',
        backgroundColor: 'rgba(27,43,92,0.06)',
        border: '1px solid rgba(27,43,92,0.15)',
        borderRadius: 3,
        padding: '2px 8px',
      }}>
        {PHASE_LABELS[phase] ?? `Phase ${phase}`}
      </span>
      {count === 0 && (
        <span style={{ fontSize: 12, color: '#9AA3B2' }}>No items yet</span>
      )}
    </div>
  );
}

function DeliverableCard({
  row,
  programId,
}: {
  row: DeliverableRow;
  programId: string;
}) {
  const title = row.title || row.deliverable_type_key.replace(/_/g, ' ');
  const chip = statusChipStyle(row.status);
  const hasContent = Boolean(row.latest_content?.trim());

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2DFD8',
      borderRadius: 8,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B2', letterSpacing: '0.06em', marginBottom: 3 }}>
            {row.deliverable_type_key}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A18', lineHeight: 1.4 }}>{title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ ...chip, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
            {statusLabel(row.status)}
          </span>
          <span style={{ fontSize: 10, color: '#9AA3B2' }}>v{row.current_version}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#9AA3B2' }}>
          Updated {formatDate(row.updated_at)}
        </span>
        {!hasContent && (
          <span style={{ fontSize: 11, color: '#B45309', fontStyle: 'italic' }}>
            No content yet — generate in the phase workspace
          </span>
        )}
      </div>

      {hasContent && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <a
            href={`/api/programs/${programId}/deliverables/${row.id}/content-export?format=html`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              backgroundColor: '#F8F7F4',
              border: '1px solid #D4D0C8',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#1A1A18',
              textDecoration: 'none',
            }}
          >
            ↓ HTML
          </a>
          <a
            href={`/api/programs/${programId}/deliverables/${row.id}/content-export?format=docx`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              backgroundColor: '#1B2B5C',
              border: '1px solid #1B2B5C',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            ↓ Word
          </a>
          <a
            href={`/strategic-moves/${programId}/phase/${inferPhase(row.deliverable_type_key)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #D4D0C8',
              borderRadius: 5,
              fontSize: 12,
              color: '#525866',
              textDecoration: 'none',
            }}
          >
            Open workspace →
          </a>
        </div>
      )}

      {!hasContent && (
        <div style={{ marginTop: 4 }}>
          <a
            href={`/strategic-moves/${programId}/phase/${inferPhase(row.deliverable_type_key)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              backgroundColor: '#1B2B5C',
              border: '1px solid #1B2B5C',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            Go to phase workspace →
          </a>
        </div>
      )}
    </div>
  );
}

function AttachmentRow({ attachment, programId }: { attachment: AttachmentRecord; programId: string }) {
  const icon = mimeIcon(attachment.mimeType);
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
        transition: 'border-color 0.15s',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attachment.originalName}
        </div>
        <div style={{ fontSize: 11, color: '#9AA3B2', marginTop: 1 }}>
          {formatBytes(attachment.sizeBytes)} · {formatDate(attachment.createdAt)}
          {attachment.scanStatus === 'clean' && ' · ✓ scanned'}
          {attachment.scanStatus === 'pending' && ' · scan pending'}
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
      }}>
        ↓ Download
      </span>
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

  const [deliverables, attachments] = await Promise.all([
    fetchDeliverables(moveId),
    listAttachmentsForProgram(moveId).catch(() => [] as AttachmentRecord[]),
  ]);

  // Group deliverables by phase
  const deliverablesByPhase = new Map<number, DeliverableRow[]>();
  for (const d of deliverables) {
    const phase = inferPhase(d.deliverable_type_key);
    if (!deliverablesByPhase.has(phase)) deliverablesByPhase.set(phase, []);
    deliverablesByPhase.get(phase)!.push(d);
  }

  // Group attachments by phase (null phase → 0)
  const attachmentsByPhase = new Map<number, AttachmentRecord[]>();
  for (const a of attachments) {
    const phase = a.phase ?? 0;
    if (!attachmentsByPhase.has(phase)) attachmentsByPhase.set(phase, []);
    attachmentsByPhase.get(phase)!.push(a);
  }

  // Phases to render — always show all 5 + phase 0 if there's content
  const phasesToShow = [0, 1, 2, 3, 4, 5].filter((p) => {
    if (p === 0) {
      return (deliverablesByPhase.get(0)?.length ?? 0) > 0 || (attachmentsByPhase.get(0)?.length ?? 0) > 0;
    }
    return true;
  });

  const totalDeliverables = deliverables.length;
  const totalAttachments = attachments.length;
  const withContent = deliverables.filter((d) => d.latest_content?.trim()).length;

  return (
    <AppShell surface="programs-detail">
      <div style={{ padding: '24px 32px', maxWidth: 920, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, color: '#9AA3B2' }}>
            <Link href="/strategic-moves" style={{ color: '#9AA3B2', textDecoration: 'none' }}>Strategic Moves</Link>
            <span>›</span>
            <Link href={`/strategic-moves/${moveId}`} style={{ color: '#9AA3B2', textDecoration: 'none' }}>{move.displayCode}</Link>
            <span>›</span>
            <span>Evidence</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 'normal', margin: '0 0 6px', color: '#1A1A18' }}>
            Phase Evidence
          </h1>
          <div style={{ fontSize: 13, color: '#525866', marginBottom: 16 }}>
            {move.name} · {move.tenant.name}
          </div>

          {/* Summary strip */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Deliverables', value: String(totalDeliverables) },
              { label: 'With content', value: String(withContent) },
              { label: 'Uploads', value: String(totalAttachments) },
              { label: 'Current phase', value: `P${move.currentPhase ?? 1}` },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                padding: '8px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2DFD8',
                borderRadius: 6,
                minWidth: 80,
              }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#9AA3B2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{kpi.label}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A18' }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase sections */}
        {phasesToShow.map((phase) => {
          const phaseDeliverables = deliverablesByPhase.get(phase) ?? [];
          const phaseAttachments = attachmentsByPhase.get(phase) ?? [];
          const total = phaseDeliverables.length + phaseAttachments.length;

          return (
            <div key={phase} style={{ marginBottom: 40 }}>
              <SectionHeader phase={phase} count={total} />

              {phaseDeliverables.length > 0 && (
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
                    Generated deliverables ({phaseDeliverables.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {phaseDeliverables.map((d) => (
                      <DeliverableCard key={d.id} row={d} programId={moveId} />
                    ))}
                  </div>
                </div>
              )}

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

              {total === 0 && (
                <div style={{
                  padding: '20px 16px',
                  background: '#FAFAF8',
                  border: '1px dashed #D4D0C8',
                  borderRadius: 6,
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#9AA3B2',
                }}>
                  No deliverables or uploads yet for this phase.{' '}
                  <a
                    href={`/strategic-moves/${moveId}/phase/${phase || 1}`}
                    style={{ color: '#1B2B5C', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Open phase workspace →
                  </a>
                </div>
              )}
            </div>
          );
        })}

        {/* Footer nav */}
        <div style={{ borderTop: '1px solid #E2DFD8', paddingTop: 20, marginTop: 8, display: 'flex', gap: 16 }}>
          <Link
            href={`/strategic-moves/${moveId}`}
            style={{ fontSize: 13, color: '#1B2B5C', fontWeight: 600, textDecoration: 'none' }}
          >
            ← Back to Move
          </Link>
          <Link
            href={`/strategic-moves/${moveId}/phase/${move.currentPhase ?? 1}`}
            style={{ fontSize: 13, color: '#525866', textDecoration: 'none' }}
          >
            Open phase workspace →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
