// /admin/reasoning/gate-approvals — Gate approval log.
//
// Server component. Collects gate approval records from two sources:
//   1. approvalAuditBuffer — runtime approvals posted via /api/reasoning/gate-approval
//   2. stageHistory.gateApprovalRef — static refs seeded in SOURCE_EVENT_INSTANCES
//
// De-duplication: static refs carry no timestamp or actor; they are shown as
// "seeded" records. Runtime buffer records are shown as "live" records.
// All records sorted descending by timestamp (seeded records sort last).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { approvalAuditBuffer } from '@/app/api/reasoning/audit/route';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate approvals · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ApprovalRow {
  source: 'live' | 'seeded';
  instanceId: string;
  instanceName: string;
  stageId?: string;
  criterionId?: string;
  action: 'approve' | 'reject' | 'advance';
  justification?: string;
  approvedBy: string;
  timestamp: string;
  gateApprovalRef?: string;
}

// ─── Data ──────────────────────────────────────────────────────────────────────

function collectApprovalRows(): ApprovalRow[] {
  const rows: ApprovalRow[] = [];

  // 1. Runtime buffer — from /api/reasoning/gate-approval POSTs
  for (const record of approvalAuditBuffer) {
    // Find instance name from SOURCE_EVENT_INSTANCES if possible
    const instance = SOURCE_EVENT_INSTANCES.find((i) => i.id === record.instanceId);
    rows.push({
      source: 'live',
      instanceId: record.instanceId,
      instanceName: instance?.name ?? record.instanceId,
      criterionId: record.criterionId,
      action: record.action,
      justification: record.justification,
      approvedBy: 'demo-user',
      timestamp: record.actedAt,
      gateApprovalRef: undefined,
    });
  }

  // 2. Seeded stageHistory.gateApprovalRef from SOURCE_EVENT_INSTANCES
  const seededRefs = new Set<string>();
  for (const instance of SOURCE_EVENT_INSTANCES) {
    for (const t of instance.stageHistory) {
      if (!t.gateApprovalRef) continue;
      // Avoid duplicates if same ref appears on multiple stages
      if (seededRefs.has(t.gateApprovalRef)) continue;
      seededRefs.add(t.gateApprovalRef);
      rows.push({
        source: 'seeded',
        instanceId: instance.id,
        instanceName: instance.name,
        stageId: t.stageId,
        action: 'advance',
        approvedBy: t.advancedBy ?? 'system',
        timestamp: t.enteredAt,
        gateApprovalRef: t.gateApprovalRef,
      });
    }
  }

  // Sort descending — live records by actedAt, seeded by enteredAt
  rows.sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return tb - ta;
  });

  return rows;
}

// ─── Formatting ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const utc = d.toISOString();
  const timePart = utc.slice(11, 19);
  if (timePart === '00:00:00') return utc.slice(0, 10);
  return utc.slice(0, 10) + ' ' + utc.slice(11, 16);
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

function ActionPill({ action }: { action: ApprovalRow['action'] }) {
  if (action === 'approve') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: SHELL.MINT_BG,
          color: SHELL.MINT_TEXT,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        approved
      </span>
    );
  }
  if (action === 'reject') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: SHELL.RUST_BG,
          color: SHELL.RUST_TEXT,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        rejected
      </span>
    );
  }
  // 'advance' — seeded stage advancement
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.BLUE_BG,
        color: COLORS.ink,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      advance
    </span>
  );
}

function SourceBadge({ source }: { source: ApprovalRow['source'] }) {
  if (source === 'live') {
    return (
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: SHELL.MINT_TEXT,
          background: SHELL.MINT_BG,
          borderRadius: RADIUS.sm,
          padding: '1px 6px',
        }}
      >
        live
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        color: SHELL.INK_MUTED,
        background: SHELL.GRAY_BG,
        borderRadius: RADIUS.sm,
        padding: '1px 6px',
      }}
    >
      seeded
    </span>
  );
}

function AllClearBanner() {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          fontWeight: 600,
          color: SHELL.MINT_TEXT,
        }}
      >
        No gate approvals recorded yet.
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${SHELL.MINT_TEXT}99`,
        }}
      >
        The in-memory store is empty and no stage refs are seeded.
      </span>
    </div>
  );
}

function SummaryStrip({ count }: { count: number }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.ink,
        }}
      >
        {count} approval record{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateApprovalsPage() {
  const rows = collectApprovalRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open gate status matrix"
          primaryActionHref="/admin/reasoning/gate-status-matrix"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Gate approvals"
        subtitle="All gate advancement approvals — which instances advanced through which stages and when."
      >
        <SummaryStrip count={rows.length} />

        {rows.length === 0 ? (
          <AllClearBanner />
        ) : (
          <section
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.ink}14`,
              borderRadius: RADIUS.lg,
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={HEADER_CELL}>Instance</th>
                    <th style={HEADER_CELL}>Stage</th>
                    <th style={HEADER_CELL}>Criterion / Ref</th>
                    <th style={HEADER_CELL}>Action</th>
                    <th style={HEADER_CELL}>Justification</th>
                    <th style={HEADER_CELL}>Approved by</th>
                    <th style={HEADER_CELL}>Timestamp</th>
                    <th style={HEADER_CELL}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={`${row.instanceId}-${row.gateApprovalRef ?? row.criterionId ?? idx}-${row.timestamp}`}>
                      <td style={BODY_CELL}>
                        <span style={{ fontWeight: 600 }}>{row.instanceName}</span>
                        <br />
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.mono,
                            fontSize: 10,
                            color: `${COLORS.ink}66`,
                          }}
                        >
                          {row.instanceId}
                        </span>
                      </td>
                      <td style={MONO_CELL}>
                        {row.stageId ?? (
                          <span style={{ color: `${COLORS.ink}44` }}>—</span>
                        )}
                      </td>
                      <td style={MONO_CELL}>
                        {row.gateApprovalRef ? (
                          <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>
                            {row.gateApprovalRef}
                          </span>
                        ) : row.criterionId ? (
                          row.criterionId
                        ) : (
                          <span style={{ color: `${COLORS.ink}44` }}>—</span>
                        )}
                      </td>
                      <td style={BODY_CELL}>
                        <ActionPill action={row.action} />
                      </td>
                      <td
                        style={{
                          ...BODY_CELL,
                          maxWidth: 280,
                          color: `${COLORS.ink}cc`,
                        }}
                        title={row.justification}
                      >
                        {row.justification ? (
                          truncate(row.justification)
                        ) : (
                          <span style={{ color: `${COLORS.ink}44` }}>—</span>
                        )}
                      </td>
                      <td style={MONO_CELL}>{row.approvedBy}</td>
                      <td style={MONO_CELL}>{formatDate(row.timestamp)}</td>
                      <td style={BODY_CELL}>
                        <SourceBadge source={row.source} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
