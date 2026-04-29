// /admin/reasoning/instance-timeline — Per-instance chronological event stream.
//
// Pure server component. Collects stage transitions, evidence ingestions,
// waivers, and contradiction resolutions for every SOURCE_EVENT_INSTANCE and
// APEX_RETAIL_PROGRAM_INSTANCE, merges them into a flat, time-sorted event
// stream per instance, and renders a vertical CSS timeline with color-coded
// event type dots.
//
// Event type colors:
//   stage      → navy
//   evidence   → mint
//   waiver     → peach
//   resolution → gray

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import {
  getEvidenceFor,
  getEvidenceTimestampsFor,
} from '@/lib/reasoning/evidence-ingestion-store';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance timeline · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

type EventType = 'stage' | 'evidence' | 'waiver' | 'resolution';

interface TimelineEvent {
  type: EventType;
  description: string;
  timestamp: string;
  actor?: string;
}

interface InstanceGroup {
  id: string;
  name: string;
  currentStage: string;
  healthLabel: string;
  events: TimelineEvent[];
}

// ─── Event color tokens ───────────────────────────────────────────────────────

const EVENT_COLORS: Record<EventType, { dot: string; pillBg: string; pillFg: string }> = {
  stage: {
    dot: COLORS.navy,
    pillBg: COLORS.skyPale,
    pillFg: COLORS.navy,
  },
  evidence: {
    dot: SHELL.MINT_TEXT,
    pillBg: SHELL.MINT_BG,
    pillFg: SHELL.MINT_TEXT,
  },
  waiver: {
    dot: SHELL.PEACH_TEXT,
    pillBg: SHELL.PEACH_BG,
    pillFg: SHELL.PEACH_TEXT,
  },
  resolution: {
    dot: SHELL.GRAY_TEXT,
    pillBg: SHELL.GRAY_BG,
    pillFg: SHELL.GRAY_TEXT,
  },
};

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  stage: 'Stage',
  evidence: 'Evidence',
  waiver: 'Waiver',
  resolution: 'Resolution',
};

// ─── Data derivation ──────────────────────────────────────────────────────────

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function readField(item: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return '';
}

function buildSourceInstanceGroups(): InstanceGroup[] {
  const allWaivers = getWaivers();
  const allResolutions = getResolvedEntries();

  return SOURCE_EVENT_INSTANCES.map((inst) => {
    const events: TimelineEvent[] = [];

    // ── Stage transitions ──────────────────────────────────────────
    for (const stage of inst.stageHistory ?? []) {
      // Entry event
      events.push({
        type: 'stage',
        description: `Entered stage "${stage.stageId}"${stage.gateApprovalRef ? ` · gate ${stage.gateApprovalRef}` : ''}`,
        timestamp: stage.enteredAt,
        actor: stage.advancedBy !== 'system' ? stage.advancedBy : undefined,
      });
      // Exit event (only if exited)
      if (stage.exitedAt) {
        events.push({
          type: 'stage',
          description: `Exited stage "${stage.stageId}"`,
          timestamp: stage.exitedAt,
          actor: stage.advancedBy !== 'system' ? stage.advancedBy : undefined,
        });
      }
    }

    // ── Evidence ingestions ────────────────────────────────────────
    const evidenceItems = getEvidenceFor(inst.id);
    const evidenceTimestamps = getEvidenceTimestampsFor(inst.id);
    for (let i = 0; i < evidenceItems.length; i++) {
      const item = evidenceItems[i];
      const ts = evidenceTimestamps[i] ?? new Date().toISOString();
      const field = readField(item, 'field', 'kind', 'type');
      const value = readField(item, 'value');
      const description = field && value
        ? `Evidence ingested · ${field} = ${truncate(value, 48)}`
        : field
        ? `Evidence ingested · ${field}`
        : 'Evidence ingested';
      events.push({ type: 'evidence', description, timestamp: ts });
    }

    // ── Waivers ────────────────────────────────────────────────────
    for (const w of allWaivers) {
      if (w.instanceId !== inst.id) continue;
      events.push({
        type: 'waiver',
        description: `Gate waiver · criterion ${w.criterionId} — ${truncate(w.reason, 60)}`,
        timestamp: w.waivedAt,
      });
    }

    // ── Contradiction resolutions ──────────────────────────────────
    const prefix = `${inst.id}::`;
    for (const { id, resolvedAt } of allResolutions) {
      if (!id.startsWith(prefix)) continue;
      const templateId = id.slice(prefix.length);
      events.push({
        type: 'resolution',
        description: `Contradiction resolved · ${templateId}`,
        timestamp: resolvedAt,
      });
    }

    // Sort newest-first
    events.sort((a, b) => {
      const cmp = b.timestamp.localeCompare(a.timestamp);
      if (cmp !== 0) return cmp;
      return a.description.localeCompare(b.description);
    });

    const openFlagCount = (inst.flags ?? []).filter((f) => f.status === 'open').length;
    const healthLabel = openFlagCount === 0 ? 'Healthy' : `${openFlagCount} flag${openFlagCount === 1 ? '' : 's'}`;

    return {
      id: inst.id,
      name: inst.name,
      currentStage: inst.currentStage,
      healthLabel,
      events,
    };
  });
}

function buildProgramInstanceGroups(): InstanceGroup[] {
  const allWaivers = getWaivers();
  const allResolutions = getResolvedEntries();

  return APEX_RETAIL_PROGRAM_INSTANCES.map((inst) => {
    const events: TimelineEvent[] = [];

    // ── Phase transitions ──────────────────────────────────────────
    for (const phase of inst.phases ?? []) {
      if (phase.enteredAt) {
        events.push({
          type: 'stage',
          description: `Entered phase P${phase.phaseId} "${phase.phaseLabel}"${phase.gateStatus === 'approved' ? ' · gate approved' : ''}`,
          timestamp: phase.enteredAt,
        });
      }
      if (phase.exitedAt) {
        events.push({
          type: 'stage',
          description: `Exited phase P${phase.phaseId} "${phase.phaseLabel}"`,
          timestamp: phase.exitedAt,
        });
      }
    }

    // ── Evidence ingestions ────────────────────────────────────────
    const evidenceItems = getEvidenceFor(inst.id);
    const evidenceTimestamps = getEvidenceTimestampsFor(inst.id);
    for (let i = 0; i < evidenceItems.length; i++) {
      const item = evidenceItems[i];
      const ts = evidenceTimestamps[i] ?? new Date().toISOString();
      const field = readField(item, 'field', 'kind', 'type');
      const value = readField(item, 'value');
      const description = field && value
        ? `Evidence ingested · ${field} = ${truncate(value, 48)}`
        : field
        ? `Evidence ingested · ${field}`
        : 'Evidence ingested';
      events.push({ type: 'evidence', description, timestamp: ts });
    }

    // ── Waivers ────────────────────────────────────────────────────
    for (const w of allWaivers) {
      if (w.instanceId !== inst.id) continue;
      events.push({
        type: 'waiver',
        description: `Gate waiver · criterion ${w.criterionId} — ${truncate(w.reason, 60)}`,
        timestamp: w.waivedAt,
      });
    }

    // ── Contradiction resolutions ──────────────────────────────────
    const prefix = `${inst.id}::`;
    for (const { id, resolvedAt } of allResolutions) {
      if (!id.startsWith(prefix)) continue;
      const templateId = id.slice(prefix.length);
      events.push({
        type: 'resolution',
        description: `Contradiction resolved · ${templateId}`,
        timestamp: resolvedAt,
      });
    }

    // Sort newest-first
    events.sort((a, b) => {
      const cmp = b.timestamp.localeCompare(a.timestamp);
      if (cmp !== 0) return cmp;
      return a.description.localeCompare(b.description);
    });

    const openFlagCount = (inst.flags ?? []).filter((f) => f.status === 'open').length;
    const healthLabel = openFlagCount === 0 ? 'Healthy' : `${openFlagCount} flag${openFlagCount === 1 ? '' : 's'}`;

    return {
      id: inst.id,
      name: inst.name,
      currentStage: `P${inst.currentPhase}`,
      healthLabel,
      events,
    };
  });
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = d.getUTCFullYear();
  const month = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  // If time component is not midnight, show it too
  const hasTime = iso.length > 10 && !iso.endsWith('T00:00:00Z') && !iso.match(/^\d{4}-\d{2}-\d{2}$/);
  if (hasTime) {
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} · ${h}:${m}Z`;
  }
  return `${day} ${month} ${year}`;
}

function computeSpanDays(groups: InstanceGroup[]): number {
  let minTs = '';
  let maxTs = '';
  for (const g of groups) {
    for (const ev of g.events) {
      if (!minTs || ev.timestamp < minTs) minTs = ev.timestamp;
      if (!maxTs || ev.timestamp > maxTs) maxTs = ev.timestamp;
    }
  }
  if (!minTs || !maxTs) return 0;
  const diff = Date.parse(maxTs) - Date.parse(minTs);
  if (Number.isNaN(diff) || diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
}

// ─── Components ───────────────────────────────────────────────────────────────

function EventTypePill({ type }: { type: EventType }) {
  const { pillBg, pillFg } = EVENT_COLORS[type];
  return (
    <span
      style={{
        display: 'inline-block',
        background: pillBg,
        color: pillFg,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {EVENT_TYPE_LABEL[type]}
    </span>
  );
}

function HealthBadge({ label }: { label: string }) {
  const isHealthy = label === 'Healthy';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isHealthy ? SHELL.MINT_BG : SHELL.PEACH_BG,
        color: isHealthy ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
        border: `1px solid ${isHealthy ? SHELL.MINT_LINE : SHELL.PEACH_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function EmptyEventRow() {
  return (
    <div
      style={{
        padding: `${SPACING.md} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: `${COLORS.ink}66`,
        fontStyle: 'italic',
      }}
    >
      No events recorded yet for this instance.
    </div>
  );
}

function EventRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const { dot } = EVENT_COLORS[event.type];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACING.md,
        padding: `10px ${SPACING.md}`,
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.ink}08`,
        position: 'relative',
      }}
    >
      {/* Timeline line + dot column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
          width: 16,
          paddingTop: 2,
        }}
      >
        {/* Dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dot,
            flexShrink: 0,
          }}
        />
        {/* Vertical line below dot (except last row) */}
        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              background: `${COLORS.ink}18`,
              minHeight: 20,
              marginTop: 4,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: SPACING.sm,
          flex: 1,
          minWidth: 0,
          flexWrap: 'wrap',
        }}
      >
        <EventTypePill type={event.type} />

        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
            flex: 1,
            minWidth: 0,
            lineHeight: 1.45,
          }}
        >
          {event.description}
          {event.actor && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                color: `${COLORS.ink}88`,
                marginLeft: 8,
              }}
            >
              {event.actor}
            </span>
          )}
        </span>

        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {formatTimestamp(event.timestamp)}
        </span>
      </div>
    </div>
  );
}

function EventTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return <EmptyEventRow />;
  return (
    <div
      style={{
        borderLeft: `2px solid ${COLORS.ink}14`,
        marginLeft: SPACING.md,
        paddingLeft: 0,
      }}
    >
      {events.map((ev, idx) => {
        return (
          <div key={`${ev.type}-${ev.timestamp}-${idx}`}>
            <EventRow event={ev} isLast={idx === events.length - 1} />
          </div>
        );
      })}
    </div>
  );
}

function InstanceSection({ group }: { group: InstanceGroup }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Instance header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          background: `${COLORS.ink}04`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 17,
                fontWeight: 700,
                color: COLORS.ink,
                letterSpacing: '-0.01em',
              }}
            >
              {group.name}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                color: `${COLORS.ink}66`,
                letterSpacing: '0.03em',
              }}
            >
              {group.id}
            </span>
          </div>
          <div
            style={{
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}88`,
              }}
            >
              Current stage:
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: COLORS.navy,
                fontWeight: 600,
              }}
            >
              {group.currentStage}
            </span>
            <span style={{ color: `${COLORS.ink}33` }}>·</span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {group.events.length} event{group.events.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <HealthBadge label={group.healthLabel} />
      </header>

      {/* Timeline body */}
      <div style={{ padding: `${SPACING.sm} 0` }}>
        <EventTimeline events={group.events} />
      </div>
    </section>
  );
}

function SummaryStrip({
  instanceCount,
  totalEvents,
  spanDays,
}: {
  instanceCount: number;
  totalEvents: number;
  spanDays: number;
}) {
  const parts = [
    `${instanceCount} instance${instanceCount === 1 ? '' : 's'}`,
    `${totalEvents} total event${totalEvents === 1 ? '' : 's'}`,
    spanDays > 0 ? `Spanning ${spanDays} day${spanDays === 1 ? '' : 's'}` : 'No events yet',
  ];
  return (
    <div
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {parts.map((part, idx) => (
        <span
          key={idx}
          style={{
            fontFamily: idx === 0 ? TYPOGRAPHY.sans : TYPOGRAPHY.mono,
            fontSize: idx === 0 ? 13 : 12,
            fontWeight: idx === 0 ? 600 : 400,
            color: idx === 0 ? COLORS.navy : `${COLORS.ink}99`,
          }}
        >
          {idx > 0 && (
            <span style={{ marginRight: 12, color: `${COLORS.ink}44` }}>&middot;</span>
          )}
          {part}
        </span>
      ))}
    </div>
  );
}

function ColorLegend() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
        padding: `${SPACING.sm} 0`,
      }}
    >
      {(Object.keys(EVENT_COLORS) as EventType[]).map((type) => {
        const { dot, pillFg } = EVENT_COLORS[type];
        return (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: dot,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: pillFg,
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {EVENT_TYPE_LABEL[type]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InstanceTimelinePage() {
  const sourceGroups = buildSourceInstanceGroups();
  const programGroups = buildProgramInstanceGroups();
  const allGroups = [...sourceGroups, ...programGroups];

  const totalEvents = allGroups.reduce((sum, g) => sum + g.events.length, 0);
  const spanDays = computeSpanDays(allGroups);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Evidence Ingest"
          primaryActionHref="/admin/reasoning/evidence-ingest"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Instance timeline"
        subtitle="Per-instance chronological event stream — stage transitions, evidence ingestions, waivers, and contradictions combined. Sorted newest-first."
      >
        <SummaryStrip
          instanceCount={allGroups.length}
          totalEvents={totalEvents}
          spanDays={spanDays}
        />

        <ColorLegend />

        {sourceGroups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Source event instances
            </h2>
            {sourceGroups.map((group) => {
              return (
                <div key={group.id}>
                  <InstanceSection group={group} />
                </div>
              );
            })}
          </div>
        )}

        {programGroups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Program instances
            </h2>
            {programGroups.map((group) => {
              return (
                <div key={group.id}>
                  <InstanceSection group={group} />
                </div>
              );
            })}
          </div>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
