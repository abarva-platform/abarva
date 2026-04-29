// /admin/reasoning/feedback-stats — Synthesis feedback statistics.
//
// Server component. Reads all events from the synthesis telemetry ring buffer,
// filters to those that have received 👍/👎 feedback, and renders:
//   - Three summary metric cards (total, up, down)
//   - Per-surface breakdown table (source / programs / tower)
//   - Per-instance table (instances that have any feedback, sorted by total desc)
//
// No client JS needed — purely point-in-time. `force-dynamic` ensures each page
// load reflects the latest ring buffer state.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  getRecentSynthesisEvents,
  type SynthesisSurface,
  type SynthesisTelemetryEvent,
} from '@/lib/reasoning/synthesis-telemetry';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Feedback stats · AbarVa Admin',
};

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SurfaceFeedbackStats {
  surface: SynthesisSurface;
  total: number;
  up: number;
  down: number;
  upPct: number | null;
}

interface InstanceFeedbackStats {
  instanceId: string;
  surface: SynthesisSurface;
  up: number;
  down: number;
  total: number;
  upPct: number | null;
}

// ─── Data computation ────────────────────────────────────────────────────────────

const SURFACE_ORDER: ReadonlyArray<SynthesisSurface> = ['source', 'programs', 'tower'];

function computeStats(events: SynthesisTelemetryEvent[]): {
  totalFeedback: number;
  totalUp: number;
  totalDown: number;
  bySurface: SurfaceFeedbackStats[];
  byInstance: InstanceFeedbackStats[];
} {
  let totalUp = 0;
  let totalDown = 0;

  const surfaceUp = new Map<SynthesisSurface, number>();
  const surfaceDown = new Map<SynthesisSurface, number>();

  const instanceUp = new Map<string, number>();
  const instanceDown = new Map<string, number>();
  const instanceSurface = new Map<string, SynthesisSurface>();

  for (const event of events) {
    if (event.feedback === undefined) continue;

    const isUp = event.feedback === 'up';
    if (isUp) {
      totalUp += 1;
      surfaceUp.set(event.surface, (surfaceUp.get(event.surface) ?? 0) + 1);
      instanceUp.set(event.instanceId, (instanceUp.get(event.instanceId) ?? 0) + 1);
    } else {
      totalDown += 1;
      surfaceDown.set(event.surface, (surfaceDown.get(event.surface) ?? 0) + 1);
      instanceDown.set(event.instanceId, (instanceDown.get(event.instanceId) ?? 0) + 1);
    }

    if (!instanceSurface.has(event.instanceId)) {
      instanceSurface.set(event.instanceId, event.surface);
    }
  }

  const bySurface: SurfaceFeedbackStats[] = SURFACE_ORDER.map((surface) => {
    const up = surfaceUp.get(surface) ?? 0;
    const down = surfaceDown.get(surface) ?? 0;
    const total = up + down;
    return {
      surface,
      total,
      up,
      down,
      upPct: total === 0 ? null : up / total,
    };
  });

  const instanceIds = Array.from(
    new Set([...instanceUp.keys(), ...instanceDown.keys()]),
  );

  const byInstance: InstanceFeedbackStats[] = instanceIds
    .map((instanceId) => {
      const up = instanceUp.get(instanceId) ?? 0;
      const down = instanceDown.get(instanceId) ?? 0;
      const total = up + down;
      return {
        instanceId,
        surface: instanceSurface.get(instanceId) ?? 'source',
        up,
        down,
        total,
        upPct: total === 0 ? null : up / total,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    totalFeedback: totalUp + totalDown,
    totalUp,
    totalDown,
    bySurface,
    byInstance,
  };
}

// ─── Format helpers ───────────────────────────────────────────────────────────────

function fmtPct(ratio: number | null): string {
  if (ratio === null) return '—';
  return `${(ratio * 100).toFixed(1)}%`;
}

// ─── Style constants ──────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  color: `${COLORS.ink}cc`,
  textAlign: 'left' as const,
  padding: `${SPACING.sm} ${SPACING.md}`,
  background: COLORS.skyPale,
  borderBottom: `1px solid ${COLORS.ink}1a`,
  whiteSpace: 'nowrap' as const,
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'top' as const,
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}bb`,
};

// ─── Components ───────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: number;
  accentColor: string;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        minWidth: 160,
        flex: '1 1 160px',
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 40,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          color: accentColor,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricRow({
  totalFeedback,
  totalUp,
  totalDown,
}: {
  totalFeedback: number;
  totalUp: number;
  totalDown: number;
}) {
  return (
    <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
      <MetricCard label="Total feedback" value={totalFeedback} accentColor={COLORS.navy} />
      <MetricCard label="Thumbs up" value={totalUp} accentColor={COLORS.mintInk} />
      <MetricCard label="Thumbs down" value={totalDown} accentColor={COLORS.coralInk} />
    </div>
  );
}

function SurfaceBreakdown({ rows }: { rows: SurfaceFeedbackStats[] }) {
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
          Per-surface breakdown
        </h2>
      </header>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={HEADER_CELL}>Surface</th>
            <th style={HEADER_CELL}>Total feedback</th>
            <th style={{ ...HEADER_CELL, color: COLORS.mintInk }}>Up</th>
            <th style={{ ...HEADER_CELL, color: COLORS.coralInk }}>Down</th>
            <th style={HEADER_CELL}>Up %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.surface}>
              <td style={{ ...BODY_CELL, textTransform: 'capitalize', fontWeight: 600 }}>
                {row.surface}
              </td>
              <td style={MONO_CELL}>{row.total}</td>
              <td
                style={{
                  ...MONO_CELL,
                  color: row.up > 0 ? COLORS.mintInk : `${COLORS.ink}55`,
                  fontWeight: row.up > 0 ? 700 : 400,
                }}
              >
                {row.up}
              </td>
              <td
                style={{
                  ...MONO_CELL,
                  color: row.down > 0 ? COLORS.coralInk : `${COLORS.ink}55`,
                  fontWeight: row.down > 0 ? 700 : 400,
                }}
              >
                {row.down}
              </td>
              <td style={MONO_CELL}>{fmtPct(row.upPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SurfacePill({ surface }: { surface: SynthesisSurface }) {
  const palette: Record<SynthesisSurface, { bg: string; fg: string }> = {
    source: { bg: COLORS.skyPale, fg: COLORS.navy },
    programs: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
    tower: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  };
  const { bg, fg } = palette[surface];
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        letterSpacing: '0.02em',
      }}
    >
      {surface}
    </span>
  );
}

function InstanceBreakdown({ rows }: { rows: InstanceFeedbackStats[] }) {
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
          Per-instance breakdown
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} instance{rows.length === 1 ? '' : 's'} with feedback
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance ID</th>
              <th style={HEADER_CELL}>Surface</th>
              <th style={{ ...HEADER_CELL, color: COLORS.mintInk }}>Up</th>
              <th style={{ ...HEADER_CELL, color: COLORS.coralInk }}>Down</th>
              <th style={HEADER_CELL}>Up %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? COLORS.white : `${COLORS.ink}04`;
              const cellOverride: React.CSSProperties = { background: rowBg };
              return (
                <tr key={row.instanceId}>
                  <td style={{ ...MONO_CELL, ...cellOverride, fontSize: 12 }}>
                    {row.instanceId}
                  </td>
                  <td style={{ ...BODY_CELL, ...cellOverride }}>
                    <SurfacePill surface={row.surface} />
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      ...cellOverride,
                      color: row.up > 0 ? COLORS.mintInk : `${COLORS.ink}55`,
                      fontWeight: row.up > 0 ? 700 : 400,
                    }}
                  >
                    {row.up}
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      ...cellOverride,
                      color: row.down > 0 ? COLORS.coralInk : `${COLORS.ink}55`,
                      fontWeight: row.down > 0 ? 700 : 400,
                    }}
                  >
                    {row.down}
                  </td>
                  <td style={{ ...MONO_CELL, ...cellOverride }}>{fmtPct(row.upPct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyBufferState() {
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
        lineHeight: 1.6,
      }}
    >
      Synthesis telemetry buffer is empty. Generate some synthesis events first.
    </div>
  );
}

function NoFeedbackState() {
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
        lineHeight: 1.6,
      }}
    >
      No synthesis feedback recorded yet. Use the thumbs-up / thumbs-down buttons on synthesis
      cards to rate quality.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

export default function FeedbackStatsPage() {
  const events = getRecentSynthesisEvents();

  if (events.length === 0) {
    return (
      <AdminCanonShellV2
        agentRail={
          <AgentRail
            primaryAgentLabel="Steward"
            primaryActionLabel="Back to reasoning"
            primaryActionHref="/admin/reasoning"
          />
        }
      >
        <EditorialCanvas
          eyebrow="Reasoning · Feedback"
          title="Synthesis feedback stats"
          subtitle="Aggregated thumbs-up / thumbs-down ratings from the synthesis telemetry ring buffer, broken down by surface and instance."
        >
          <EmptyBufferState />
        </EditorialCanvas>
      </AdminCanonShellV2>
    );
  }

  const stats = computeStats(events);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Feedback"
        title="Synthesis feedback stats"
        subtitle="Aggregated thumbs-up / thumbs-down ratings from the synthesis telemetry ring buffer, broken down by surface and instance."
      >
        {stats.totalFeedback === 0 ? (
          <NoFeedbackState />
        ) : (
          <>
            <MetricRow
              totalFeedback={stats.totalFeedback}
              totalUp={stats.totalUp}
              totalDown={stats.totalDown}
            />
            <SurfaceBreakdown rows={stats.bySurface} />
            {stats.byInstance.length > 0 && (
              <InstanceBreakdown rows={stats.byInstance} />
            )}
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
