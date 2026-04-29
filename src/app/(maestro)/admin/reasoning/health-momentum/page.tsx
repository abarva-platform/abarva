// /admin/reasoning/health-momentum — Health score momentum tracking.
//
// Pure server component. For each instance computes a velocity metric
// (health gain per stage) using stageIndex progression as a proxy for time
// and projects future health if momentum continues.
//
// Momentum formula:
//   dampingFactor = 0.65
//   historicalHealth(stageIdx) = round(currentHealth × (stageIdx / max(totalStages-1,1)) × 0.65 + 10)
//   velocity = stageIndex > 0 ? (currentHealth - historicalHealth(0)) / stageIndex : 0
//   projectedNextHealth = min(100, round(currentHealth + velocity))

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health Momentum · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type MomentumLabel = 'Accelerating' | 'Improving' | 'Stable' | 'Declining';

interface MomentumRow {
  row: InstanceHealthRow;
  healthScore: number;
  stageIndex: number;
  totalStages: number;
  velocity: number;
  momentumLabel: MomentumLabel;
  projectedNextHealth: number;
}

// ─── Score helper ─────────────────────────────────────────────────────────────

function derivedHealthScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

// ─── Stage index map ──────────────────────────────────────────────────────────

function buildStageIndexMap(): Map<string, { stageIndex: number; totalStages: number }> {
  const patterns = getAllLifecyclePatterns();
  const out = new Map<string, { stageIndex: number; totalStages: number }>();

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = patterns.find((p) => p.patternId === inst.patternId);
    const totalStages = pattern ? pattern.stages.length : Math.max(inst.stageHistory.length, 1);
    const stageIndex = Math.max(0, inst.stageHistory.length - 1);
    out.set(inst.id, { stageIndex, totalStages });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const totalStages = 7; // 0–6 phases
    const stageIndex = inst.currentPhase;
    out.set(inst.id, { stageIndex, totalStages });
  }

  return out;
}

// ─── Momentum computation ─────────────────────────────────────────────────────

const DAMPING_FACTOR = 0.65;

function computeMomentum(
  healthScore: number,
  stageIndex: number,
  totalStages: number,
): { velocity: number; projectedNextHealth: number; momentumLabel: MomentumLabel } {
  const historicalHealth = (stageIdx: number): number =>
    Math.round(
      healthScore * (stageIdx / Math.max(totalStages - 1, 1)) * DAMPING_FACTOR + 10,
    );

  const velocity =
    stageIndex > 0 ? (healthScore - historicalHealth(0)) / stageIndex : 0;

  const projectedNextHealth = Math.min(100, Math.round(healthScore + velocity));

  let momentumLabel: MomentumLabel;
  if (velocity > 5) {
    momentumLabel = 'Accelerating';
  } else if (velocity >= 1) {
    momentumLabel = 'Improving';
  } else if (velocity >= -1) {
    momentumLabel = 'Stable';
  } else {
    momentumLabel = 'Declining';
  }

  return { velocity, projectedNextHealth, momentumLabel };
}

// ─── Page data builder ────────────────────────────────────────────────────────

function buildMomentumRows(): MomentumRow[] {
  const healthRows = buildHealthBoardRows();
  const stageMap = buildStageIndexMap();

  const rows: MomentumRow[] = healthRows.map((row) => {
    const healthScore = derivedHealthScore(row);
    const { stageIndex, totalStages } = stageMap.get(row.id) ?? {
      stageIndex: 0,
      totalStages: 1,
    };

    const { velocity, projectedNextHealth, momentumLabel } = computeMomentum(
      healthScore,
      stageIndex,
      totalStages,
    );

    return {
      row,
      healthScore,
      stageIndex,
      totalStages,
      velocity,
      momentumLabel,
      projectedNextHealth,
    };
  });

  // Sort by velocity descending
  return rows.sort((a, b) => b.velocity - a.velocity);
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function momentumColor(label: MomentumLabel): { bg: string; color: string } {
  switch (label) {
    case 'Accelerating':
      return { bg: COLORS.mintSoft, color: COLORS.mintInk };
    case 'Improving':
      return { bg: '#D4EDDA', color: '#155724' };
    case 'Stable':
      return { bg: COLORS.amberSoft, color: COLORS.amberInk };
    case 'Declining':
      return { bg: COLORS.coralSoft, color: COLORS.coralInk };
  }
}

function healthScoreColor(score: number): string {
  if (score >= 70) return COLORS.mintInk;
  if (score >= 45) return COLORS.amberInk;
  return COLORS.coralInk;
}

function healthScoreBg(score: number): string {
  if (score >= 70) return COLORS.mintSoft;
  if (score >= 45) return COLORS.amberSoft;
  return COLORS.coralSoft;
}

// ─── Shared cell styles ───────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
  color: `${COLORS.ink}cc`,
};

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ rows }: { rows: MomentumRow[] }) {
  const accelerating = rows.filter((r) => r.momentumLabel === 'Accelerating').length;
  const improving = rows.filter((r) => r.momentumLabel === 'Improving').length;
  const stable = rows.filter((r) => r.momentumLabel === 'Stable').length;
  const declining = rows.filter((r) => r.momentumLabel === 'Declining').length;

  const cards: Array<{ label: MomentumLabel; count: number }> = [
    { label: 'Accelerating', count: accelerating },
    { label: 'Improving', count: improving },
    { label: 'Stable', count: stable },
    { label: 'Declining', count: declining },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: SPACING.md,
      }}
    >
      {cards.map(({ label, count }) => {
        const { bg, color } = momentumColor(label);
        return (
          <div
            key={label}
            style={{
              background: bg,
              border: `1px solid ${color}33`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 36,
                color: COLORS.ink,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {count}
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}88`,
              }}
            >
              instance{count === 1 ? '' : 's'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Momentum chip ────────────────────────────────────────────────────────────

function MomentumChip({ label }: { label: MomentumLabel }) {
  const { bg, color } = momentumColor(label);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        color,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// ─── Momentum table ───────────────────────────────────────────────────────────

function MomentumTable({ rows }: { rows: MomentumRow[] }) {
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
          Momentum table
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          sorted by velocity · highest first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}
        >
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Health</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Velocity (pts/stage)</th>
              <th style={HEADER_CELL}>Momentum</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Projected next</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((mr) => {
              const velSign = mr.velocity > 0 ? '+' : '';
              const velColor =
                mr.velocity > 5
                  ? COLORS.mintInk
                  : mr.velocity >= 1
                    ? '#155724'
                    : mr.velocity >= -1
                      ? COLORS.amberInk
                      : COLORS.coralInk;
              return (
                <tr key={mr.row.id}>
                  <td style={BODY_CELL}>
                    <div
                      style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      <span style={{ fontWeight: 600 }}>{mr.row.label}</span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: `${COLORS.ink}66`,
                        }}
                      >
                        {mr.row.id} · {mr.row.type}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: healthScoreBg(mr.healthScore),
                        color: healthScoreColor(mr.healthScore),
                        borderRadius: RADIUS.pill,
                        padding: '3px 10px',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {mr.healthScore}
                    </span>
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'center',
                    }}
                  >
                    {mr.stageIndex} / {mr.totalStages}
                  </td>
                  <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        fontWeight: 700,
                        color: velColor,
                      }}
                    >
                      {velSign}
                      {mr.velocity.toFixed(1)}
                    </span>
                  </td>
                  <td style={BODY_CELL}>
                    <MomentumChip label={mr.momentumLabel} />
                  </td>
                  <td style={{ ...MONO_CELL, textAlign: 'right', fontWeight: 700 }}>
                    {mr.projectedNextHealth}
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

// ─── Velocity distribution bar chart ─────────────────────────────────────────

function VelocityChart({ rows }: { rows: MomentumRow[] }) {
  const maxAbsVelocity = Math.max(1, ...rows.map((r) => Math.abs(r.velocity)));

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
          Velocity distribution
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}66`,
            marginTop: 4,
          }}
        >
          Horizontal bars proportional to velocity — mint = positive, coral = negative
        </div>
      </header>
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {rows.map((mr) => {
          const isNeg = mr.velocity < 0;
          const absVel = Math.abs(mr.velocity);
          const barWidth = Math.round((absVel / maxAbsVelocity) * 100);
          const barColor = isNeg ? COLORS.coralSoft : COLORS.mintSoft;
          const barBorder = isNeg ? COLORS.coralInk : COLORS.mintInk;
          const label = mr.row.label.length > 12 ? mr.row.label.slice(0, 12) : mr.row.label;
          const velDisplay = isNeg
            ? `−${absVel.toFixed(1)}`
            : `+${mr.velocity.toFixed(1)}`;

          return (
            <div
              key={mr.row.id}
              style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  width: 96,
                  flexShrink: 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 16,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: barColor,
                    border: `1px solid ${barBorder}44`,
                    borderRadius: RADIUS.sm,
                    transition: 'width 0.2s',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isNeg ? COLORS.coralInk : COLORS.mintInk,
                  width: 44,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {velDisplay}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Top accelerators card ────────────────────────────────────────────────────

function TopAcceleratorsCard({ rows }: { rows: MomentumRow[] }) {
  const top = rows.filter((r) => r.velocity > 0).slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.mintSoft,
        border: `1px solid ${COLORS.mintInk}33`,
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
            color: COLORS.mintInk,
            fontWeight: 700,
          }}
        >
          Top accelerators
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
          Top {top.length} by velocity
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {top.map((mr) => {
          const stagesToReach80 =
            mr.velocity > 0 && mr.healthScore < 80
              ? Math.ceil((80 - mr.healthScore) / mr.velocity)
              : null;
          const projStage =
            stagesToReach80 !== null
              ? mr.stageIndex + stagesToReach80
              : null;

          return (
            <div
              key={mr.row.id}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.mintInk}22`,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: SPACING.md,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {mr.row.label}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  {mr.row.id} · {mr.row.type}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  alignItems: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLORS.mintInk,
                  }}
                >
                  +{mr.velocity.toFixed(1)} pts/stage
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}88`,
                  }}
                >
                  {mr.healthScore >= 80
                    ? 'Already above 80 health'
                    : projStage !== null
                      ? `On track to reach 80+ health by stage ${projStage}`
                      : 'Velocity insufficient to project'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Declining instances card ─────────────────────────────────────────────────

function DecliningCard({ rows }: { rows: MomentumRow[] }) {
  const declining = rows.filter((r) => r.velocity < -1);
  if (declining.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.coralSoft,
        border: `1px solid ${COLORS.coralInk}33`,
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
            color: COLORS.coralInk,
            fontWeight: 700,
          }}
        >
          Declining instances
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
          {declining.length} instance{declining.length === 1 ? '' : 's'} losing momentum
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {declining.map((mr) => {
          const atRisk = mr.projectedNextHealth < 50;
          return (
            <div
              key={mr.row.id}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.coralInk}22`,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: SPACING.md,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {mr.row.label}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  {mr.row.id} · {mr.row.type}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  alignItems: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLORS.coralInk,
                  }}
                >
                  {mr.velocity.toFixed(1)} pts/stage
                </span>
                {atRisk ? (
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORS.coralInk,
                    }}
                  >
                    at risk of dropping below 50 (projected: {mr.projectedNextHealth})
                  </span>
                ) : (
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: `${COLORS.ink}88`,
                    }}
                  >
                    projected: {mr.projectedNextHealth} next stage
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthMomentumPage() {
  const rows = buildMomentumRows();

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
        eyebrow="Reasoning · Health"
        title="Health Momentum"
        subtitle="Rate of health improvement per stage — velocity, momentum, and trajectory projection"
      >
        <SummaryCards rows={rows} />
        <MomentumTable rows={rows} />
        <VelocityChart rows={rows} />
        <TopAcceleratorsCard rows={rows} />
        <DecliningCard rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
