// /admin/reasoning/stage-dwell — Per-instance time-in-current-stage metrics.
//
// Server component. For each SOURCE_EVENT_INSTANCE computes how long it has
// been dwelling in its current stage (days since enteredAt of the current
// stage entry). Ranks instances from longest dwell to shortest.
//
// Sections:
//   SummaryStrip — N instances tracked · Avg dwell · Longest dwell
//   DwellTable   — Instance | Stage | Entered | Days | Status pill
//   StageDwellBar — Horizontal bar chart: count per current stage

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Stage dwell · AbarVa Admin',
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-29');
const TODAY_MS = TODAY.getTime();

// Freshness thresholds (days)
const THRESHOLD_AMBER = 14;
const THRESHOLD_RUST = 30;

// ─── Data model ────────────────────────────────────────────────────────────────

type FreshnessStatus = 'green' | 'amber' | 'rust';

interface DwellRow {
  instanceId: string;
  instanceName: string;
  currentStage: string;
  enteredAt: string;        // ISO date
  dwellDays: number;
  status: FreshnessStatus;
}

// ─── Data derivation ──────────────────────────────────────────────────────────

function computeDwellRows(): DwellRow[] {
  const rows: DwellRow[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    // Current stage = last entry in stageHistory (no exitedAt), or fall back
    // to currentStage field.
    const history = inst.stageHistory ?? [];
    const currentEntry =
      history.length > 0 ? history[history.length - 1] : null;

    const stageId =
      (currentEntry?.stageId as string | undefined) ??
      (inst.currentStage as string | undefined) ??
      'Unknown';

    const enteredAt = currentEntry?.enteredAt ?? '';

    let dwellDays = 0;
    if (enteredAt) {
      const entered = new Date(enteredAt).getTime();
      if (!Number.isNaN(entered)) {
        dwellDays = Math.max(0, Math.floor((TODAY_MS - entered) / 86_400_000));
      }
    }

    const status: FreshnessStatus =
      dwellDays > THRESHOLD_RUST
        ? 'rust'
        : dwellDays >= THRESHOLD_AMBER
          ? 'amber'
          : 'green';

    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      currentStage: stageId,
      enteredAt,
      dwellDays,
      status,
    });
  }

  // Sort: longest dwell first
  rows.sort((a, b) => b.dwellDays - a.dwellDays);

  return rows;
}

interface StageCount {
  stageId: string;
  count: number;
  /** avg dwell for instances in this stage */
  avgDwell: number;
}

function buildStageDistribution(rows: DwellRow[]): StageCount[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const cur = map.get(row.currentStage) ?? { total: 0, count: 0 };
    map.set(row.currentStage, { total: cur.total + row.dwellDays, count: cur.count + 1 });
  }
  return Array.from(map.entries())
    .map(([stageId, { total, count }]) => ({
      stageId,
      count,
      avgDwell: count > 0 ? Math.round(total / count) : 0,
    }))
    .sort((a, b) => b.count - a.count || b.avgDwell - a.avgDwell);
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [year, mon, day] = iso.split('-');
  const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const n = parseInt(mon, 10);
  return `${parseInt(day, 10)} ${MONTHS[n] ?? mon} ${year}`;
}

// ─── Status pill colours ───────────────────────────────────────────────────────

const PILL_PALETTE: Record<FreshnessStatus, { bg: string; fg: string; label: string }> = {
  green: { bg: COLORS.mintSoft,  fg: COLORS.mintInk,  label: 'Fresh'   },
  amber: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Aging'   },
  rust:  { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Stale'   },
};

// ─── Cell styles ──────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left' as const,
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
  verticalAlign: 'middle' as const,
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  instanceCount,
  avgDwell,
  longestDwell,
}: {
  instanceCount: number;
  avgDwell: number;
  longestDwell: number;
}) {
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
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.navy,
          fontWeight: 600,
        }}
      >
        {instanceCount} instance{instanceCount === 1 ? '' : 's'} tracked
      </span>

      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>·</span>

      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99` }}>
        Avg dwell:{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontWeight: 600, color: COLORS.ink }}>
          {avgDwell} day{avgDwell === 1 ? '' : 's'}
        </span>
      </span>

      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>·</span>

      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99` }}>
        Longest:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontWeight: 700,
            color: longestDwell > THRESHOLD_RUST ? COLORS.coralInk : COLORS.ink,
          }}
        >
          {longestDwell} day{longestDwell === 1 ? '' : 's'}
        </span>
      </span>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: FreshnessStatus }) {
  const p = PILL_PALETTE[status];
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.bg,
        color: p.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {p.label}
    </span>
  );
}

// ─── DwellTable ───────────────────────────────────────────────────────────────

function DwellTable({ rows }: { rows: DwellRow[] }) {
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
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Dwell ranking
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            Ranked longest-to-shortest · as of 29 Apr 2026
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>#</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Current stage</th>
              <th style={HEADER_CELL}>Entered</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Days in stage</th>
              <th style={HEADER_CELL}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.instanceId}>
                <td style={{ ...MONO_CELL, color: `${COLORS.ink}66`, width: 36 }}>
                  {idx + 1}
                </td>

                <td style={BODY_CELL}>
                  <a
                    href={`/admin/reasoning/instances/${row.instanceId}`}
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: COLORS.navy,
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    {row.instanceName}
                  </a>
                </td>

                <td style={BODY_CELL}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: `${COLORS.ink}08`,
                      color: COLORS.ink,
                      borderRadius: RADIUS.pill,
                      padding: '2px 10px',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {row.currentStage}
                  </span>
                </td>

                <td style={MONO_CELL}>{formatDate(row.enteredAt)}</td>

                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right' as const,
                    fontWeight: row.dwellDays > THRESHOLD_RUST ? 700 : 400,
                    color:
                      row.dwellDays > THRESHOLD_RUST
                        ? COLORS.coralInk
                        : row.dwellDays >= THRESHOLD_AMBER
                          ? COLORS.amberInk
                          : `${COLORS.ink}cc`,
                    paddingRight: SPACING.lg,
                  }}
                >
                  {row.dwellDays}d
                </td>

                <td style={BODY_CELL}>
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── StageDwellBar ────────────────────────────────────────────────────────────

function StageDwellBar({ stages }: { stages: StageCount[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

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
          Stage distribution
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Count of instances per current stage — bar width proportional to count
        </div>
      </header>

      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {stages.map((s) => {
          const pct = (s.count / maxCount) * 100;
          return (
            <div key={s.stageId} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
              {/* Stage label */}
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}cc`,
                  width: 160,
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.stageId}
              </div>

              {/* Bar track */}
              <div
                style={{
                  flex: 1,
                  height: 20,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: COLORS.skyPale,
                    border: `1px solid ${COLORS.navy}33`,
                    borderRadius: RADIUS.sm,
                    minWidth: pct > 0 ? 4 : 0,
                  }}
                />
              </div>

              {/* Count badge */}
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: COLORS.navy,
                  fontWeight: 600,
                  width: 28,
                  textAlign: 'right' as const,
                  flexShrink: 0,
                }}
              >
                {s.count}
              </div>

              {/* Avg dwell */}
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  width: 60,
                  flexShrink: 0,
                }}
              >
                avg {s.avgDwell}d
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StageDwellPage() {
  const rows = computeDwellRows();
  const stages = buildStageDistribution(rows);

  const instanceCount = rows.length;
  const avgDwell =
    instanceCount > 0
      ? Math.round(rows.reduce((s, r) => s + r.dwellDays, 0) / instanceCount)
      : 0;
  const longestDwell = rows.length > 0 ? rows[0].dwellDays : 0;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="View stage transitions"
          primaryActionHref="/admin/reasoning/stage-transitions"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Stage dwell"
        subtitle="Per-instance time-in-current-stage metrics — ranked by longest dwell, with freshness thresholds."
      >
        <SummaryStrip
          instanceCount={instanceCount}
          avgDwell={avgDwell}
          longestDwell={longestDwell}
        />

        <StageDwellBar stages={stages} />

        <DwellTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
