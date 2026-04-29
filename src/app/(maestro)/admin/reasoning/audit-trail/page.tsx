// /admin/reasoning/audit-trail — Unified audit trail.
//
// Pure server component. Merges gate waivers, contradiction resolutions,
// evidence ingestions, and stage approvals from all in-memory stores into
// a single flat event log sorted newest-first. Gives operators a single
// view of "what happened to this system."

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import {
  getEvidenceFor,
  getEvidenceTimestampsFor,
} from '@/lib/reasoning/evidence-ingestion-store';
import {
  waiverAuditBuffer,
  approvalAuditBuffer,
} from '@/app/api/reasoning/audit/route';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Audit trail · AbarVa Admin',
};

// ─── AuditEvent type ─────────────────────────────────────────────────────────

type AuditEventType = 'waiver' | 'resolution' | 'evidence' | 'approval';

interface AuditEvent {
  id: string;
  type: AuditEventType;
  instanceId: string;
  instanceName: string;
  description: string;
  actor: string;
  timestamp: string;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

/** Build a name → id lookup for all known instances. */
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

function buildAuditEvents(): AuditEvent[] {
  const nameMap = buildInstanceNameMap();
  const events: AuditEvent[] = [];

  // 1. Gate waivers from the waiver store
  for (const w of getWaivers()) {
    events.push({
      id: `waiver::${w.instanceId}::${w.criterionId}`,
      type: 'waiver',
      instanceId: w.instanceId,
      instanceName: nameMap.get(w.instanceId) ?? w.instanceId,
      description: `Gate criterion "${w.criterionId}" waived — ${w.reason}`,
      actor: 'demo-user',
      timestamp: w.waivedAt,
    });
  }

  // 2. Gate approvals / rejections from the approval audit buffer
  for (const r of approvalAuditBuffer) {
    events.push({
      id: `approval::${r.instanceId}::${r.criterionId}::${r.action}`,
      type: 'approval',
      instanceId: r.instanceId,
      instanceName: nameMap.get(r.instanceId) ?? r.instanceId,
      description: `Gate criterion "${r.criterionId}" ${r.action === 'approve' ? 'approved' : 'rejected'} — ${r.justification}`,
      actor: 'demo-user',
      timestamp: r.actedAt,
    });
  }

  // Also pull live waiver audit buffer entries not already in the waiver store
  for (const w of waiverAuditBuffer) {
    const id = `waiver_buf::${w.instanceId}::${w.criterionId}`;
    // Deduplicate against waiver-store entries already added above
    if (!events.some((e) => e.id === `waiver::${w.instanceId}::${w.criterionId}`)) {
      events.push({
        id,
        type: 'waiver',
        instanceId: w.instanceId,
        instanceName: nameMap.get(w.instanceId) ?? w.instanceId,
        description: `Gate criterion "${w.criterionId}" waived — ${w.reason}`,
        actor: 'demo-user',
        timestamp: w.waivedAt,
      });
    }
  }

  // 3. Contradiction resolutions
  for (const r of getResolvedEntries()) {
    const parts = r.id.split('::');
    const instanceId = parts.length >= 2 ? parts[0] : 'unknown';
    const templateId = parts.length >= 2 ? parts.slice(1).join('::') : r.id;
    events.push({
      id: `resolution::${r.id}`,
      type: 'resolution',
      instanceId,
      instanceName: nameMap.get(instanceId) ?? instanceId,
      description: `Contradiction "${templateId}" marked resolved`,
      actor: 'demo-user',
      timestamp: r.resolvedAt,
    });
  }

  // 4. Evidence ingestions — all instances
  const allInstanceIds = [
    ...SOURCE_EVENT_INSTANCES.map((i) => i.id),
    ...APEX_RETAIL_PROGRAM_INSTANCES.map((i) => i.id),
  ];
  for (const instanceId of allInstanceIds) {
    const items = getEvidenceFor(instanceId);
    const timestamps = getEvidenceTimestampsFor(instanceId);
    const instName = nameMap.get(instanceId) ?? instanceId;

    for (let i = 0; i < items.length; i++) {
      const ts = timestamps[i] ?? new Date().toISOString();
      const item = items[i];
      // Build a compact description
      let desc = 'Evidence ingested';
      if (item && typeof item === 'object') {
        const kind =
          (item as Record<string, unknown>)['kind'] ??
          (item as Record<string, unknown>)['type'] ??
          (item as Record<string, unknown>)['evidenceType'];
        if (typeof kind === 'string') desc = `Evidence ingested — type: ${kind}`;
      }
      events.push({
        id: `evidence::${instanceId}::${i}`,
        type: 'evidence',
        instanceId,
        instanceName: instName,
        description: desc,
        actor: 'system',
        timestamp: ts,
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

function truncate(text: string, max = 90): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

// ─── Event type pill config ───────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<
  AuditEventType,
  { label: string; bg: string; fg: string }
> = {
  evidence: { label: 'Evidence', bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT },
  approval: { label: 'Approval', bg: SHELL.BLUE_BG, fg: '#1a4a8a' },
  waiver: { label: 'Waiver', bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT },
  resolution: { label: 'Resolution', bg: SHELL.GRAY_BG, fg: SHELL.GRAY_TEXT },
};

// ─── Components ───────────────────────────────────────────────────────────────

function EventTypePill({ type }: { type: AuditEventType }) {
  const { label, bg, fg } = EVENT_TYPE_CONFIG[type];
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
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function SummaryStrip({
  totalCount,
  instanceCount,
  typeCounts,
}: {
  totalCount: number;
  instanceCount: number;
  typeCounts: Record<AuditEventType, number>;
}) {
  const coveredTypes = (Object.keys(typeCounts) as AuditEventType[])
    .filter((t) => typeCounts[t] > 0)
    .map((t) => EVENT_TYPE_CONFIG[t].label.toLowerCase())
    .join(', ');

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
        flexWrap: 'wrap' as const,
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
        {totalCount} total event{totalCount === 1 ? '' : 's'}
      </span>
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}55` }}>·</span>
      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99` }}>
        {instanceCount} instance{instanceCount === 1 ? '' : 's'}
      </span>
      {coveredTypes.length > 0 && (
        <>
          <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}55` }}>·</span>
          <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}88` }}>
            Covering {coveredTypes}
          </span>
        </>
      )}
    </div>
  );
}

function EventTypeLegend({ typeCounts }: { typeCounts: Record<AuditEventType, number> }) {
  const types = Object.keys(EVENT_TYPE_CONFIG) as AuditEventType[];
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
        flexWrap: 'wrap' as const,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: `${COLORS.ink}88`,
          fontWeight: 600,
        }}
      >
        Event types
      </span>
      {types.map((type) => {
        const { label, bg, fg } = EVENT_TYPE_CONFIG[type];
        const count = typeCounts[type];
        return (
          <span
            key={type}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: bg,
              color: fg,
              borderRadius: RADIUS.pill,
              padding: '3px 12px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.04em',
            }}
          >
            {label}
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                fontWeight: 700,
                opacity: 0.8,
              }}
            >
              {count}
            </span>
          </span>
        );
      })}
    </div>
  );
}

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

function AuditTable({ events }: { events: AuditEvent[] }) {
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
          Event log
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {events.length} event{events.length === 1 ? '' : 's'} · newest first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Timestamp</th>
              <th style={HEADER_CELL}>Event type</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Description</th>
              <th style={HEADER_CELL}>Actor</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} style={{ background: COLORS.white }}>
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
                    ...BODY_CELL,
                    maxWidth: 400,
                    color: `${COLORS.ink}cc`,
                  }}
                  title={event.description}
                >
                  {truncate(event.description)}
                </td>
                <td style={MONO_CELL}>{event.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyBanner() {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        fontWeight: 600,
        color: SHELL.MINT_TEXT,
      }}
    >
      No audit events yet
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const events = buildAuditEvents();

  const instanceCount = new Set(events.map((e) => e.instanceId)).size;

  const typeCounts: Record<AuditEventType, number> = {
    waiver: 0,
    resolution: 0,
    evidence: 0,
    approval: 0,
  };
  for (const e of events) {
    typeCounts[e.type]++;
  }

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open demo state"
          primaryActionHref="/admin/reasoning/demo-state"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Audit trail"
        subtitle="Unified event log — gate waivers, contradiction resolutions, evidence ingestions, and stage approvals in one view. Resets on server restart."
      >
        <SummaryStrip
          totalCount={events.length}
          instanceCount={instanceCount}
          typeCounts={typeCounts}
        />

        <EventTypeLegend typeCounts={typeCounts} />

        {events.length === 0 ? <EmptyBanner /> : <AuditTable events={events} />}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
