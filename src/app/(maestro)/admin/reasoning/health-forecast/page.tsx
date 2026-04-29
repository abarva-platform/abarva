// /admin/reasoning/health-forecast — Projected health scores based on trajectory.
//
// Pure server component. For each instance computes a deterministic forecast
// score derived from open hard gates and remaining lifecycle stages. Sorts by
// forecast score ascending (most at-risk first) and surfaces a critical-zone
// card for instances projected below 40.
//
// Forecast formula:
//   forecastScore = clamp(currentScore - (openHardGates * 3) + (stagesRemaining > 0 ? -5 : 10), 10, 100)
//   trajectory    = forecastScore > currentScore+5 ? 'improving'
//                 : forecastScore < currentScore-5 ? 'declining'
//                 : 'stable'

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  buildHealthBoardRows,
  type InstanceHealthRow,
} from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health forecast · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Trajectory = 'improving' | 'stable' | 'declining';

interface ForecastRow {
  row: InstanceHealthRow;
  currentScore: number;
  forecastScore: number;
  delta: number;
  trajectory: Trajectory;
  openHardGates: number;
  stagesRemaining: number;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

/**
 * Derives the current composite score from the health board row using the
 * same formula as the health-alerts page so scores are consistent across admin.
 */
function currentScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function trajectory(current: number, forecast: number): Trajectory {
  if (forecast > current + 5) return 'improving';
  if (forecast < current - 5) return 'declining';
  return 'stable';
}

// ─── Stages-remaining lookup ──────────────────────────────────────────────────

/**
 * Build a map from instanceId → stagesRemaining.
 * Source instances: totalStages - stageHistory.length
 * Program instances: totalPhases - currentPhase - 1
 */
function buildStagesRemainingMap(): Map<string, number> {
  const patterns = getAllLifecyclePatterns();
  const out = new Map<string, number>();

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = patterns.find((p) => p.patternId === inst.patternId);
    const total = pattern ? pattern.stages.length : 0;
    const completed = inst.stageHistory.length;
    out.set(inst.id, Math.max(0, total - completed));
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    // 7 phases (0–6); stagesRemaining = phases not yet completed
    const totalPhases = 7;
    const remaining = Math.max(0, totalPhases - inst.currentPhase - 1);
    out.set(inst.id, remaining);
  }

  return out;
}

// ─── Page data builder ────────────────────────────────────────────────────────

function buildForecastRows(): ForecastRow[] {
  const healthRows = buildHealthBoardRows();
  const stagesMap = buildStagesRemainingMap();

  const rows: ForecastRow[] = healthRows.map((row) => {
    const current = currentScore(row);
    const openHardGates = Math.max(0, row.gatesTotal - row.gatesMet);
    const stagesRemaining = stagesMap.get(row.id) ?? 0;

    const forecast = clamp(
      current - openHardGates * 3 + (stagesRemaining > 0 ? -5 : 10),
      10,
      100,
    );

    return {
      row,
      currentScore: current,
      forecastScore: forecast,
      delta: forecast - current,
      trajectory: trajectory(current, forecast),
      openHardGates,
      stagesRemaining,
    };
  });

  // Sort by forecast score ascending (most at-risk first)
  return rows.sort((a, b) => a.forecastScore - b.forecastScore);
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
  color: `${COLORS.ink}cc`,
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: ForecastRow[] }) {
  const total = rows.length;
  const improving = rows.filter((r) => r.trajectory === 'improving').length;
  const stable = rows.filter((r) => r.trajectory === 'stable').length;
  const declining = rows.filter((r) => r.trajectory === 'declining').length;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: SPACING.md,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Health forecast
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {total} instance{total === 1 ? '' : 's'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip color={COLORS.mintInk} bg={COLORS.mintSoft} label={`${improving} improving`} />
        <Chip
          color={COLORS.amberInk}
          bg={COLORS.amberSoft}
          label={`${stable} stable`}
        />
        <Chip color={COLORS.coralInk} bg={COLORS.coralSoft} label={`${declining} declining`} />
      </div>
    </div>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: bg,
        color,
        borderRadius: RADIUS.pill,
        padding: '4px 14px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// ─── TrajectoryPill ───────────────────────────────────────────────────────────

function TrajectoryPill({ t }: { t: Trajectory }) {
  if (t === 'improving') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: COLORS.mintSoft,
          color: COLORS.mintInk,
          borderRadius: RADIUS.pill,
          padding: '3px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        ↑ improving
      </span>
    );
  }
  if (t === 'declining') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: COLORS.coralSoft,
          color: COLORS.coralInk,
          borderRadius: RADIUS.pill,
          padding: '3px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        ↓ declining
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: COLORS.amberSoft,
        color: COLORS.amberInk,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      → stable
    </span>
  );
}

// ─── DeltaCell ────────────────────────────────────────────────────────────────

function DeltaCell({ delta }: { delta: number }) {
  const sign = delta > 0 ? '+' : '';
  const color =
    delta > 5
      ? COLORS.mintInk
      : delta < -5
        ? COLORS.coralInk
        : COLORS.amberInk;
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        color,
      }}
    >
      {sign}{delta}
    </span>
  );
}

// ─── ForecastTable ────────────────────────────────────────────────────────────

function ForecastTable({ rows }: { rows: ForecastRow[] }) {
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
          Trajectory forecast
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          sorted by forecast score · lowest first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Current</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Forecast</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Delta</th>
              <th style={HEADER_CELL}>Trajectory</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Open gates</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Stages left</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((fr) => (
              <tr key={fr.row.id}>
                <td style={BODY_CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{fr.row.label}</span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {fr.row.id} · {fr.row.type}
                    </span>
                  </div>
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>{fr.currentScore}</td>
                <td style={{ ...MONO_CELL, textAlign: 'right', fontWeight: 700 }}>
                  {fr.forecastScore}
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                  <DeltaCell delta={fr.delta} />
                </td>
                <td style={BODY_CELL}>
                  <TrajectoryPill t={fr.trajectory} />
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>{fr.openHardGates}</td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>{fr.stagesRemaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── AtRiskCard ───────────────────────────────────────────────────────────────

function AtRiskCard({ rows }: { rows: ForecastRow[] }) {
  const atRisk = rows.filter((r) => r.forecastScore < 40);
  if (atRisk.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.amberInk,
            fontWeight: 700,
          }}
        >
          Critical zone — forecast &lt; 40
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
          }}
        >
          {atRisk.length} instance{atRisk.length === 1 ? '' : 's'} at risk
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Projected health score below 40 — action recommended before next gate review.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {atRisk.map((fr) => (
          <div
            key={fr.row.id}
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.amberInk}22`,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {fr.row.label}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                }}
              >
                {fr.row.id} · {fr.row.type}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}66`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  current
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 22,
                    color: COLORS.ink,
                    lineHeight: 1,
                  }}
                >
                  {fr.currentScore}
                </div>
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 16,
                  color: `${COLORS.ink}44`,
                }}
              >
                →
              </span>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: COLORS.coralInk,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  forecast
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 22,
                    color: COLORS.coralInk,
                    lineHeight: 1,
                    fontWeight: 700,
                  }}
                >
                  {fr.forecastScore}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <TrajectoryPill t={fr.trajectory} />
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    color: `${COLORS.ink}88`,
                  }}
                >
                  {fr.openHardGates} open gate{fr.openHardGates === 1 ? '' : 's'} ·{' '}
                  {fr.stagesRemaining} stage{fr.stagesRemaining === 1 ? '' : 's'} left
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthForecastPage() {
  const rows = buildForecastRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Forecast"
        title="Health forecast"
        subtitle="Deterministic trajectory projection for every instance — open hard gates and remaining lifecycle stages drive the forecast. Instances sorted from most at-risk to most stable."
      >
        <SummaryStrip rows={rows} />
        <AtRiskCard rows={rows} />
        <ForecastTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
