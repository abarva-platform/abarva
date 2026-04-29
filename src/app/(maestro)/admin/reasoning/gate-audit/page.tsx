// /admin/reasoning/gate-audit — Complete gate action audit log.
//
// Pure server component. Merges waivers, approvals, and evidence submissions
// that affected gate status into a single unified stream sorted newest-first.
// Designed for operator review and demo transparency.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import {
  waiverAuditBuffer,
  approvalAuditBuffer,
} from '@/app/api/reasoning/audit/route';
import {
  getEvidenceFor,
  getEvidenceTimestampsFor,
} from '@/lib/reasoning/evidence-ingestion-store';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate audit · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type GateEventType = 'waiver' | 'approval' | 'evidence';

interface GateAuditEvent {
  id: string;
  type: GateEventType;
  instanceId: string;
  instanceName: string;
  gate: string;
  action: string;
  actor: string;
  note: string;
  timestamp: string;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildInstanceNameMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    map.set(inst.id, inst.name ?? inst.id);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    map.set(inst.id, inst.name ?? inst.id);
  }
  return map;
}

function buildGateAuditEvents(): GateAuditEvent[] {
  const nameMap = buildInstanceNameMap();
  const events: GateAuditEvent[] = [];
  const seen = new Set<string>();

  // 1. Gate waivers from the waiver store (current state)
  for (const w of getWaivers()) {
    const id = `waiver-store::${w.instanceId}::${w.criterionId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({
      id,
      type: 'waiver',
      instanceId: w.instanceId,
      instanceName: nameMap.get(w.instanceId) ?? w.instanceId,
      gate: w.criterionId,
      action: 'Waived',
      actor: 'demo-user',
      note: w.reason,
      timestamp: w.waivedAt,
    });
  }

  // 2. Waiver audit buffer (live session buffer — may overlap waiver store)
  for (const w of waiverAuditBuffer) {
    const id = `waiver-buf::${w.instanceId}::${w.criterionId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({
      id,
      type: 'waiver',
      instanceId: w.instanceId,
      instanceName: nameMap.get(w.instanceId) ?? w.instanceId,
      gate: w.criterionId,
      action: 'Waived',
      actor: 'demo-user',
      note: w.reason,
      timestamp: w.waivedAt,
    });
  }

  // 3. Approval audit buffer
  for (const r of approvalAuditBuffer) {
    const id = `approval::${r.instanceId}::${r.criterionId}::${r.action}`;
    if (seen.has(id)) continue;
    seen.add(id);
    events.push({
      id,
      type: 'approval',
      instanceId: r.instanceId,
      instanceName: nameMap.get(r.instanceId) ?? r.instanceId,
      gate: r.criterionId,
      action: r.action === 'approve' ? 'Approved' : 'Rejected',
      actor: 'demo-user',
      note: r.justification,
      timestamp: r.actedAt,
    });
  }

  // 4. Evidence submissions across all instances
  const allInstanceIds = [
    ...SOURCE_EVENT_INSTANCES.map((i) => i.id),
    ...APEX_RETAIL_PROGRAM_INSTANCES.map((i) => i.id),
  ];
  for (const instanceId of allInstanceIds) {
    const items = getEvidenceFor(instanceId);
    const tss = getEvidenceTimestampsFor(instanceId);
    const instName = nameMap.get(instanceId) ?? instanceId;
    for (let i = 0; i < items.length; i++) {
      const id = `evidence::${instanceId}::${i}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const item = items[i] as Record<string, unknown>;
      const gate =
        typeof item['criterionId'] === 'string'
          ? item['criterionId']
          : typeof item['field'] === 'string'
            ? item['field']
            : 'evidence-upload';
      const kind =
        typeof item['kind'] === 'string'
          ? item['kind']
          : typeof item['type'] === 'string'
            ? item['type']
            : typeof item['evidenceType'] === 'string'
              ? item['evidenceType']
              : 'unknown';
      events.push({
        id,
        type: 'evidence',
        instanceId,
        instanceName: instName,
        gate,
        action: 'Evidence submitted',
        actor: 'system',
        note: `type: ${kind}`,
        timestamp: tss[i] ?? new Date().toISOString(),
      });
    }
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

// ─── Event type pill config ───────────────────────────────────────────────────

const GATE_EVENT_TYPE_CONFIG: Record<GateEventType, { label: string; bg: string; fg: string }> = {
  waiver:   { label: 'Waiver',   bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT },
  approval: { label: 'Approval', bg: SHELL.BLUE_BG,  fg: '#1a4a8a' },
  evidence: { label: 'Evidence', bg: SHELL.MINT_BG,  fg: SHELL.MINT_TEXT },
};

// ─── Table cell styles ────────────────────────────────────────────────────────

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

// ─── Components ───────────────────────────────────────────────────────────────

function EventTypePill({ type }: { type: GateEventType }) {
  const { label, bg, fg } = GATE_EVENT_TYPE_CONFIG[type];
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </span>
  );
}

function SummaryStrip({
  total,
  waivers,
  approvals,
  evidence,
}: {
  total: number;
  waivers: number;
  approvals: number;
  evidence: number;
}) {
  const dot = (
    <span
      aria-hidden="true"
      style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}
    >
      ·
    </span>
  );
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        flexWrap: 'wrap' as const,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.ink,
        }}
      >
        {total} gate event{total === 1 ? '' : 's'}
      </span>
      {dot}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: SHELL.PEACH_TEXT,
          background: SHELL.PEACH_BG,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontWeight: 600,
        }}
      >
        {waivers} waiver{waivers === 1 ? '' : 's'}
      </span>
      {dot}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: '#1a4a8a',
          background: SHELL.BLUE_BG,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontWeight: 600,
        }}
      >
        {approvals} approval{approvals === 1 ? '' : 's'}
      </span>
      {dot}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: SHELL.MINT_TEXT,
          background: SHELL.MINT_BG,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontWeight: 600,
        }}
      >
        {evidence} evidence submission{evidence === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function GateAuditTable({ events }: { events: GateAuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}aa`,
          lineHeight: 1.5,
        }}
      >
        No gate events yet — use the Playground or Bulk waiver tools to generate activity.
      </div>
    );
  }

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Gate event log
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {events.length} event{events.length === 1 ? '' : 's'} · newest first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Timestamp</th>
              <th style={HEADER_CELL}>Event type</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Gate / Criterion</th>
              <th style={HEADER_CELL}>Action</th>
              <th style={HEADER_CELL}>Actor</th>
              <th style={HEADER_CELL}>Note / Justification</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td style={{ ...MONO_CELL, whiteSpace: 'nowrap' }}>
                  {formatTimestamp(event.timestamp)}
                </td>
                <td style={BODY_CELL}>
                  <EventTypePill type={event.type} />
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={event.instanceId}
                >
                  {event.instanceName}
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={event.gate}
                >
                  {event.gate}
                </td>
                <td style={{ ...BODY_CELL, fontWeight: 600 }}>{event.action}</td>
                <td style={MONO_CELL}>{event.actor}</td>
                <td
                  style={{
                    ...BODY_CELL,
                    maxWidth: 320,
                    color: `${COLORS.ink}cc`,
                  }}
                  title={event.note}
                >
                  {truncate(event.note)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface InstanceActivityRow {
  instanceId: string;
  instanceName: string;
  waivers: number;
  approvals: number;
  evidence: number;
  total: number;
}

function GateSummaryCard({ events }: { events: GateAuditEvent[] }) {
  // Count activity per instance
  const byInstance = new Map<string, InstanceActivityRow>();
  for (const e of events) {
    const existing = byInstance.get(e.instanceId);
    if (!existing) {
      byInstance.set(e.instanceId, {
        instanceId: e.instanceId,
        instanceName: e.instanceName,
        waivers: e.type === 'waiver' ? 1 : 0,
        approvals: e.type === 'approval' ? 1 : 0,
        evidence: e.type === 'evidence' ? 1 : 0,
        total: 1,
      });
    } else {
      existing.total++;
      if (e.type === 'waiver') existing.waivers++;
      else if (e.type === 'approval') existing.approvals++;
      else if (e.type === 'evidence') existing.evidence++;
    }
  }

  const rows = Array.from(byInstance.values()).sort((a, b) => b.total - a.total);

  if (rows.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Activity by instance
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Gate events per instance — ranked by total activity
        </div>
      </header>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HEADER_CELL}>Instance</th>
            <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Total</th>
            <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Waivers</th>
            <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Approvals</th>
            <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Evidence</th>
            <th style={{ ...HEADER_CELL, width: '40%' }}>Activity bar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const maxTotal = rows[0]?.total ?? 1;
            const barPct = Math.round((row.total / maxTotal) * 100);
            return (
              <tr key={row.instanceId}>
                <td style={{ ...BODY_CELL, fontWeight: 600 }}>
                  <div>{row.instanceName}</div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}66`,
                      marginTop: 1,
                    }}
                  >
                    {row.instanceId}
                  </div>
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right' as const, fontWeight: 700 }}>
                  {row.total}
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right' as const,
                    color: row.waivers > 0 ? SHELL.PEACH_TEXT : `${COLORS.ink}44`,
                  }}
                >
                  {row.waivers}
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right' as const,
                    color: row.approvals > 0 ? '#1a4a8a' : `${COLORS.ink}44`,
                  }}
                >
                  {row.approvals}
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right' as const,
                    color: row.evidence > 0 ? SHELL.MINT_TEXT : `${COLORS.ink}44`,
                  }}
                >
                  {row.evidence}
                </td>
                <td style={BODY_CELL}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: RADIUS.pill,
                      background: `${COLORS.ink}10`,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${barPct}%`,
                        background: COLORS.navy,
                        borderRadius: RADIUS.pill,
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateAuditPage() {
  const events = buildGateAuditEvents();

  const waiverCount = events.filter((e) => e.type === 'waiver').length;
  const approvalCount = events.filter((e) => e.type === 'approval').length;
  const evidenceCount = events.filter((e) => e.type === 'evidence').length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open audit trail"
          primaryActionHref="/admin/reasoning/audit-trail"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Gate audit"
        subtitle="Complete audit log of all gate-related actions: waivers granted, approvals and rejections made, and evidence submissions that affected gate status. Resets on server restart."
      >
        <SummaryStrip
          total={events.length}
          waivers={waiverCount}
          approvals={approvalCount}
          evidence={evidenceCount}
        />
        <GateAuditTable events={events} />
        <GateSummaryCard events={events} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
