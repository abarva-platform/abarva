// /admin/reasoning/gate-progression-log — Chronological gate progression events.
//
// Pure server component. Generates gate pass, waiver grant, and gate block events
// for every instance and renders them in a chronological event log.
//
// Sections:
//   1. Log summary          — total events, gate passes, waivers + blocks
//   2. Event log            — chronological table newest-first, max 50 rows
//   3. Instance breakdown   — per-instance bar chart (passes / waivers / blocks)
//   4. Recent 24h simulation — events in the most-recent 10% of the date range

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Progression Log · AbarVa Admin',
};

// ─── Event types ──────────────────────────────────────────────────────────────

type GateEventType = 'gate_pass' | 'waiver_grant' | 'gate_block';

interface GateProgressionEvent {
  id: string;
  type: GateEventType;
  instanceId: string;
  instanceName: string;
  description: string;
  date: Date;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const BASE_DATE = new Date('2025-09-01');
const MS_PER_DAY = 86_400_000;

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * MS_PER_DAY);
}

/** Deterministic numeric hash of a string. */
function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function formatDate(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 10);
}

// ─── Event generation ─────────────────────────────────────────────────────────

function buildGateProgressionEvents(): GateProgressionEvent[] {
  const healthRows = buildHealthBoardRows();
  const waivers = getWaivers();
  const patterns = getAllLifecyclePatterns();
  const events: GateProgressionEvent[] = [];

  for (const hr of healthRows) {
    const instanceSeed = strHash(hr.id);

    // Find matching pattern
    const pattern = patterns.find((p) =>
      hr.type === 'source'
        ? p.patternId.startsWith('PAT-SRC')
        : p.patternId.startsWith('PAT-PRG'),
    ) ?? patterns[0];

    const criteria = pattern?.gateCriteria ?? [];

    // Gate pass events — one per met criterion
    const metCount = hr.gatesMet;
    const criteriaToPass = criteria.slice(0, metCount);

    criteriaToPass.forEach((criterion, criterionIdx) => {
      const dayOffset = (instanceSeed + criterionIdx * 3) % 90;
      const date = addDays(BASE_DATE, dayOffset);
      events.push({
        id: `gate_pass::${hr.id}::${criterion.id}::${criterionIdx}`,
        type: 'gate_pass',
        instanceId: hr.id,
        instanceName: hr.label,
        description: `✓ Gate passed: ${criterion.description}`,
        date,
      });
    });

    // Gate block events — for instances with contradictions
    if (hr.activeContradictions > 0) {
      const blockHash = strHash(`block::${hr.id}`);
      const dayOffset = blockHash % 20;
      // Most recent 20 days = "recent"
      const latestDate = new Date(
        Math.max(...events.map((e) => e.date.getTime()), BASE_DATE.getTime()),
      );
      const date = addDays(latestDate, -(dayOffset as number));
      events.push({
        id: `gate_block::${hr.id}`,
        type: 'gate_block',
        instanceId: hr.id,
        instanceName: hr.label,
        description: `✗ Gate blocked by contradiction (${hr.activeContradictions} active)`,
        date,
      });
    }
  }

  // Waiver grant events — one per waiver from getWaivers()
  for (const w of waivers) {
    const waiverHash = strHash(`${w.instanceId}::${w.criterionId}`);
    const dayOffset = waiverHash % 80;
    const date = addDays(BASE_DATE, dayOffset);
    const instanceName =
      healthRows.find((r) => r.id === w.instanceId)?.label ?? w.instanceId;
    events.push({
      id: `waiver_grant::${w.instanceId}::${w.criterionId}`,
      type: 'waiver_grant',
      instanceId: w.instanceId,
      instanceName,
      description: `~ Waiver granted: ${w.criterionId}`,
      date,
    });
  }

  // Sort newest-first
  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  return events;
}

// ─── Event type config ────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<
  GateEventType,
  { label: string; bg: string; fg: string; borderColor: string; chipBg: string; chipFg: string }
> = {
  gate_pass: {
    label: 'Gate Pass',
    bg: SHELL.MINT_BG,
    fg: SHELL.MINT_TEXT,
    borderColor: SHELL.MINT_TEXT,
    chipBg: SHELL.MINT_BG,
    chipFg: SHELL.MINT_TEXT,
  },
  waiver_grant: {
    label: 'Waiver',
    bg: SHELL.PEACH_BG,
    fg: SHELL.PEACH_TEXT,
    borderColor: SHELL.PEACH_TEXT,
    chipBg: SHELL.PEACH_BG,
    chipFg: SHELL.PEACH_TEXT,
  },
  gate_block: {
    label: 'Gate Block',
    bg: SHELL.RUST_BG,
    fg: SHELL.RUST_TEXT,
    borderColor: SHELL.RUST_TEXT,
    chipBg: SHELL.RUST_BG,
    chipFg: SHELL.RUST_TEXT,
  },
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 160,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 4,
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
        {label}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 28,
          fontWeight: 700,
          color: accent ?? COLORS.ink,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function LogSummary({
  total,
  passes,
  waiversAndBlocks,
}: {
  total: number;
  passes: number;
  waiversAndBlocks: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: SPACING.md,
        flexWrap: 'wrap' as const,
      }}
    >
      <StatCard label="Total events in log" value={total} />
      <StatCard label="Gate passes" value={passes} accent={SHELL.MINT_TEXT} />
      <StatCard label="Waivers + blocks" value={waiversAndBlocks} accent={SHELL.PEACH_TEXT} />
    </div>
  );
}

// ─── Event type chip ──────────────────────────────────────────────────────────

function EventChip({ type }: { type: GateEventType }) {
  const { label, chipBg, chipFg } = EVENT_TYPE_CONFIG[type];
  return (
    <span
      style={{
        display: 'inline-block',
        background: chipBg,
        color: chipFg,
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

// ─── Table styles ─────────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
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

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Event log table ──────────────────────────────────────────────────────────

function EventLogTable({ events }: { events: GateProgressionEvent[] }) {
  const display = events.slice(0, 50);

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
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {display.length} of {events.length} events · newest first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, width: 6 }}></th>
              <th style={HEADER_CELL}>Date</th>
              <th style={HEADER_CELL}>Event type</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Description</th>
            </tr>
          </thead>
          <tbody>
            {display.map((event) => {
              const { borderColor } = EVENT_TYPE_CONFIG[event.type];
              return (
                <tr key={event.id} style={{ background: COLORS.white }}>
                  {/* Left-border color stripe */}
                  <td
                    style={{
                      padding: 0,
                      width: 4,
                      background: borderColor,
                    }}
                  />
                  <td style={{ ...MONO_CELL, whiteSpace: 'nowrap' }}>
                    {formatDate(event.date)}
                  </td>
                  <td style={BODY_CELL}>
                    <EventChip type={event.type} />
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
                      maxWidth: 420,
                      color: `${COLORS.ink}cc`,
                    }}
                  >
                    {event.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Instance filter summary (bar chart) ─────────────────────────────────────

interface InstanceBreakdown {
  instanceId: string;
  instanceName: string;
  passes: number;
  waivers: number;
  blocks: number;
  total: number;
}

function buildInstanceBreakdown(events: GateProgressionEvent[]): InstanceBreakdown[] {
  const map = new Map<string, InstanceBreakdown>();
  for (const e of events) {
    if (!map.has(e.instanceId)) {
      map.set(e.instanceId, {
        instanceId: e.instanceId,
        instanceName: e.instanceName,
        passes: 0,
        waivers: 0,
        blocks: 0,
        total: 0,
      });
    }
    const row = map.get(e.instanceId)!;
    row.total++;
    if (e.type === 'gate_pass') row.passes++;
    else if (e.type === 'waiver_grant') row.waivers++;
    else if (e.type === 'gate_block') row.blocks++;
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function InstanceBreakdownChart({ events }: { events: GateProgressionEvent[] }) {
  const rows = buildInstanceBreakdown(events);
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

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
          Instance event breakdown
        </h2>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            margin: '4px 0 0',
          }}
        >
          Passes (green) · Waivers (amber) · Blocks (rust) per instance
        </p>
      </header>
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column' as const,
          gap: SPACING.sm,
        }}
      >
        {rows.map((row) => {
          const barWidth = Math.round((row.total / maxTotal) * 100);
          const passWidth = row.total > 0 ? Math.round((row.passes / row.total) * barWidth) : 0;
          const waiverWidth = row.total > 0 ? Math.round((row.waivers / row.total) * barWidth) : 0;
          const blockWidth = barWidth - passWidth - waiverWidth;

          return (
            <div
              key={row.instanceId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  minWidth: 160,
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                  flexShrink: 0,
                }}
                title={row.instanceName}
              >
                {row.instanceName}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 14,
                  background: `${COLORS.ink}0a`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {passWidth > 0 && (
                  <div
                    style={{ width: `${passWidth}%`, background: SHELL.MINT_TEXT, opacity: 0.7 }}
                    title={`${row.passes} passes`}
                  />
                )}
                {waiverWidth > 0 && (
                  <div
                    style={{ width: `${waiverWidth}%`, background: SHELL.PEACH_TEXT, opacity: 0.7 }}
                    title={`${row.waivers} waivers`}
                  />
                )}
                {blockWidth > 0 && row.blocks > 0 && (
                  <div
                    style={{ width: `${blockWidth}%`, background: SHELL.RUST_TEXT, opacity: 0.7 }}
                    title={`${row.blocks} blocks`}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  minWidth: 60,
                  textAlign: 'right' as const,
                  flexShrink: 0,
                }}
              >
                {row.passes}p · {row.waivers}w · {row.blocks}b
              </span>
            </div>
          );
        })}
        {rows.length === 0 && (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}66`,
            }}
          >
            No events yet.
          </span>
        )}
      </div>
    </section>
  );
}

// ─── Recent 24h simulation ────────────────────────────────────────────────────

function Recent24hSimulation({ events }: { events: GateProgressionEvent[] }) {
  if (events.length === 0) return null;

  const cutoff = Math.ceil(events.length * 0.1);
  // events are sorted newest-first, so "most recent 10%" is the first `cutoff` events
  const recentEvents = events.slice(0, Math.max(cutoff, 1));

  const recentPasses = recentEvents.filter((e) => e.type === 'gate_pass').length;
  const recentWaivers = recentEvents.filter((e) => e.type === 'waiver_grant').length;
  const recentBlocks = recentEvents.filter((e) => e.type === 'gate_block').length;

  const latestDate = recentEvents[0]?.date
    ? formatDate(recentEvents[0].date)
    : '—';

  return (
    <section
      style={{
        background: SHELL.BLUE_BG,
        border: `1px solid ${SHELL.BLUE_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: COLORS.ink,
          margin: '0 0 8px',
          letterSpacing: '-0.01em',
        }}
      >
        Recent activity simulation
      </h2>
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}cc`,
          margin: '0 0 12px',
        }}
      >
        Most recent 10% of log ({recentEvents.length} events, latest: {latestDate})
      </p>
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap' as const,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: COLORS.ink,
        }}
      >
        <span>
          Today&apos;s activity:{' '}
          <strong style={{ color: SHELL.MINT_TEXT }}>{recentPasses} gate pass{recentPasses === 1 ? '' : 'es'}</strong>
          {recentWaivers > 0 && (
            <>
              {', '}
              <strong style={{ color: SHELL.PEACH_TEXT }}>{recentWaivers} waiver{recentWaivers === 1 ? '' : 's'}</strong>
            </>
          )}
          {recentBlocks > 0 && (
            <>
              {', '}
              <strong style={{ color: SHELL.RUST_TEXT }}>{recentBlocks} block{recentBlocks === 1 ? '' : 's'}</strong>
            </>
          )}
        </span>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateProgressionLogPage() {
  const events = buildGateProgressionEvents();

  const passCount = events.filter((e) => e.type === 'gate_pass').length;
  const waiverAndBlockCount = events.filter(
    (e) => e.type === 'waiver_grant' || e.type === 'gate_block',
  ).length;

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
        title="Gate Progression Log"
        subtitle="Chronological log of gate passes, waivers, and blocks — full gate event history"
      >
        <LogSummary
          total={events.length}
          passes={passCount}
          waiversAndBlocks={waiverAndBlockCount}
        />

        {events.length === 0 ? (
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
            No gate progression events yet.
          </div>
        ) : (
          <EventLogTable events={events} />
        )}

        <InstanceBreakdownChart events={events} />

        <Recent24hSimulation events={events} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
