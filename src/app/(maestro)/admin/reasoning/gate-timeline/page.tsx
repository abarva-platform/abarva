// /admin/reasoning/gate-timeline — Horizontal timeline of gate events per instance.
//
// Pure server component, force-dynamic.
//
// Shows chronological gate events (gate-met, waiver-granted, stage-transition)
// for every instance, using hash-derived demo timestamps for determinism.

import type { CSSProperties } from 'react';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Timeline · AbarVa Admin',
};

// ─── Demo timestamp derivation ────────────────────────────────────────────────

function demoDate(seed: string, offsetDays: number): Date {
  const base = new Date('2025-10-01');
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  base.setDate(base.getDate() + (hash % 90) + offsetDays);
  return base;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Event types ──────────────────────────────────────────────────────────────

type EventKind = 'gate-met' | 'waiver' | 'stage-transition';

interface TimelineEvent {
  key: string;
  kind: EventKind;
  label: string;
  date: Date;
  detail?: string;
}

// ─── Color palette for event kinds ───────────────────────────────────────────

const EVENT_COLORS: Record<EventKind, { dot: string; bg: string; fg: string; border: string }> = {
  'gate-met': {
    dot: COLORS.mintInk,
    bg: COLORS.mintSoft,
    fg: COLORS.mintInk,
    border: `${COLORS.mintInk}44`,
  },
  waiver: {
    dot: COLORS.amberInk,
    bg: COLORS.amberSoft,
    fg: COLORS.amberInk,
    border: `${COLORS.amberInk}44`,
  },
  'stage-transition': {
    dot: COLORS.navy,
    bg: COLORS.skyPale,
    fg: COLORS.navy,
    border: `${COLORS.navy}44`,
  },
};

const KIND_LABEL: Record<EventKind, string> = {
  'gate-met': 'Gate met',
  waiver: 'Waiver',
  'stage-transition': 'Stage',
};

// ─── Build events per instance ────────────────────────────────────────────────

interface InstanceTimeline {
  row: InstanceHealthRow;
  events: TimelineEvent[];
}

function buildTimelines(): InstanceTimeline[] {
  const rows = buildHealthBoardRows();
  const allPatterns = getAllLifecyclePatterns();
  const waivers = getWaivers();

  // Group waivers by instanceId
  const waiversByInstance = new Map<string, typeof waivers>();
  for (const w of waivers) {
    const existing = waiversByInstance.get(w.instanceId) ?? [];
    existing.push(w);
    waiversByInstance.set(w.instanceId, existing);
  }

  const timelines: InstanceTimeline[] = [];

  for (const row of rows) {
    const events: TimelineEvent[] = [];

    // Find matching pattern
    const pattern = allPatterns.find((p) => {
      // Try to match by stage labels present in instance
      return p.stages && p.stages.length > 0;
    });

    // ── Gate-met events ──
    // Use gateCriteria from pattern, limited by how many gates are "met"
    if (pattern && pattern.gateCriteria && pattern.gateCriteria.length > 0) {
      const metCount = row.gatesMet;
      const criteria = pattern.gateCriteria.slice(0, metCount > 0 ? metCount : 2);
      for (const criterion of criteria) {
        const seed = `${row.id}-gate-${criterion.id}`;
        events.push({
          key: `gate-${row.id}-${criterion.id}`,
          kind: 'gate-met',
          label: `Gate: ${criterion.description.slice(0, 48)}${criterion.description.length > 48 ? '…' : ''}`,
          date: demoDate(seed, 0),
          detail: criterion.gateType === 'hard' ? 'hard gate' : 'soft gate',
        });
      }
    }

    // ── Waiver events ──
    const instanceWaivers = waiversByInstance.get(row.id) ?? [];
    for (const w of instanceWaivers) {
      events.push({
        key: `waiver-${row.id}-${w.criterionId}`,
        kind: 'waiver',
        label: `Waiver: ${w.criterionId}`,
        date: w.waivedAt ? new Date(w.waivedAt) : demoDate(`${row.id}-waiver-${w.criterionId}`, 5),
        detail: w.reason.slice(0, 60),
      });
    }

    // ── Stage-transition events ──
    // Derive the number of stages passed from health info
    // Use stageLabel/phaseLabel to figure out current position
    if (pattern && pattern.stages && pattern.stages.length > 0) {
      const currentStageStr = (row.stageLabel ?? row.phaseLabel ?? '').toLowerCase();
      const stageLabels = pattern.stages.map((s) => s.label.toLowerCase());
      const currentIdx = stageLabels.findIndex((s) => currentStageStr.includes(s));
      const stagesCompleted = currentIdx >= 0 ? currentIdx : 1;

      for (let i = 0; i < stagesCompleted && i < pattern.stages.length; i++) {
        const stage = pattern.stages[i];
        const seed = `${row.id}-stage-${stage.id}`;
        events.push({
          key: `stage-${row.id}-${stage.id}`,
          kind: 'stage-transition',
          label: `Stage: ${stage.label}`,
          date: demoDate(seed, i * 14),
        });
      }
    } else {
      // Fallback: one synthetic stage transition
      events.push({
        key: `stage-${row.id}-init`,
        kind: 'stage-transition',
        label: `Stage: ${row.stageLabel ?? row.phaseLabel ?? 'Initial'}`,
        date: demoDate(`${row.id}-stage-init`, 0),
      });
    }

    // Sort ascending by date, cap at 12
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    timelines.push({ row, events: events.slice(0, 12) });
  }

  return timelines;
}

// ─── Summary stats ────────────────────────────────────────────────────────────

interface SummaryStats {
  totalGateMet: number;
  totalWaivers: number;
  totalStageTransitions: number;
  avgEventsPerInstance: number;
}

function computeStats(timelines: InstanceTimeline[]): SummaryStats {
  let totalGateMet = 0;
  let totalWaivers = 0;
  let totalStageTransitions = 0;
  let totalEvents = 0;

  for (const t of timelines) {
    for (const e of t.events) {
      if (e.kind === 'gate-met') totalGateMet++;
      else if (e.kind === 'waiver') totalWaivers++;
      else if (e.kind === 'stage-transition') totalStageTransitions++;
    }
    totalEvents += t.events.length;
  }

  const avgEventsPerInstance =
    timelines.length > 0 ? Math.round((totalEvents / timelines.length) * 10) / 10 : 0;

  return { totalGateMet, totalWaivers, totalStageTransitions, avgEventsPerInstance };
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const SECTION_CARD: CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
};

const SECTION_HEADER: CSSProperties = {
  padding: `${SPACING.md} ${SPACING.lg}`,
  borderBottom: `1px solid ${COLORS.ink}0c`,
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: SPACING.md,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthBadge({ label }: { label: InstanceHealthRow['healthLabel'] }) {
  const color =
    label === 'healthy'
      ? COLORS.mintInk
      : label === 'warning'
        ? COLORS.amberInk
        : label === 'critical'
          ? COLORS.coralInk
          : `${COLORS.ink}88`;
  const bg =
    label === 'healthy'
      ? COLORS.mintSoft
      : label === 'warning'
        ? COLORS.amberSoft
        : label === 'critical'
          ? COLORS.coralSoft
          : `${COLORS.ink}0a`;

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}
    >
      {label}
    </span>
  );
}

function EventRow({ event }: { event: TimelineEvent }) {
  const palette = EVENT_COLORS[event.kind];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: `${SPACING.sm} 0`,
        borderBottom: `1px solid ${COLORS.ink}07`,
      }}
    >
      {/* Colored dot indicator */}
      <div
        style={{
          flexShrink: 0,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: palette.dot,
          marginTop: 3,
        }}
      />
      {/* Date badge */}
      <span
        style={{
          flexShrink: 0,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}88`,
          whiteSpace: 'nowrap',
          minWidth: 90,
        }}
      >
        {formatDate(event.date)}
      </span>
      {/* Kind pill */}
      <span
        style={{
          flexShrink: 0,
          display: 'inline-block',
          background: palette.bg,
          color: palette.fg,
          border: `1px solid ${palette.border}`,
          borderRadius: RADIUS.pill,
          padding: '1px 8px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          minWidth: 70,
          textAlign: 'center',
        }}
      >
        {KIND_LABEL[event.kind]}
      </span>
      {/* Label */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: COLORS.ink,
          lineHeight: 1.4,
          flex: 1,
          minWidth: 0,
        }}
      >
        {event.label}
        {event.detail && (
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: `${COLORS.ink}77`,
              marginLeft: 6,
            }}
          >
            ({event.detail})
          </span>
        )}
      </span>
    </div>
  );
}

function InstanceTimelineBlock({ timeline }: { timeline: InstanceTimeline }) {
  const { row, events } = timeline;

  return (
    <div style={SECTION_CARD}>
      <div style={SECTION_HEADER}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 17,
              fontWeight: 400,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {row.label}
          </span>
          <HealthBadge label={row.healthLabel} />
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: `${COLORS.ink}55`,
            }}
          >
            {row.type} · {row.stageLabel ?? row.phaseLabel ?? '—'}
          </span>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
            whiteSpace: 'nowrap',
          }}
        >
          {events.length} event{events.length === 1 ? '' : 's'}
        </span>
      </div>
      <div style={{ padding: `${SPACING.sm} ${SPACING.lg}` }}>
        {events.length === 0 ? (
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}66`,
              padding: `${SPACING.sm} 0`,
            }}
          >
            No events derived for this instance.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.key}>
              <EventRow event={event} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LegendStrip() {
  return (
    <div
      style={{
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 700,
          color: `${COLORS.ink}77`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        Legend
      </span>
      {(['gate-met', 'waiver', 'stage-transition'] as EventKind[]).map((kind) => {
        const palette = EVENT_COLORS[kind];
        return (
          <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: palette.dot,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: palette.fg,
              }}
            >
              {KIND_LABEL[kind]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryStatsStrip({ stats }: { stats: SummaryStats }) {
  const items: Array<{ label: string; value: string | number; accent: string }> = [
    { label: 'Gate-met events', value: stats.totalGateMet, accent: COLORS.mintInk },
    { label: 'Waiver events', value: stats.totalWaivers, accent: COLORS.amberInk },
    { label: 'Stage transitions', value: stats.totalStageTransitions, accent: COLORS.navy },
    {
      label: 'Avg events / instance',
      value: stats.avgEventsPerInstance,
      accent: `${COLORS.ink}88`,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            flex: '1 1 140px',
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderTop: `3px solid ${item.accent}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
              fontWeight: 700,
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 28,
              color: COLORS.ink,
              lineHeight: 1,
              letterSpacing: '-0.01em',
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateTimelinePage() {
  const timelines = buildTimelines();
  const stats = computeStats(timelines);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Gates"
        title="Gate Timeline"
        subtitle="Chronological gate events per instance — met gates, waivers, and stage transitions"
      >
        {/* ── Legend ── */}
        <LegendStrip />

        {/* ── Per-instance timeline blocks ── */}
        {timelines.map((timeline) => (
          <div key={timeline.row.id}>
            <InstanceTimelineBlock timeline={timeline} />
          </div>
        ))}

        {/* ── Summary stats ── */}
        <div
          style={{
            borderTop: `1px solid ${COLORS.ink}0c`,
            paddingTop: SPACING.lg,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.navy,
              fontWeight: 700,
              marginBottom: SPACING.md,
            }}
          >
            Summary
          </div>
          <SummaryStatsStrip stats={stats} />
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
