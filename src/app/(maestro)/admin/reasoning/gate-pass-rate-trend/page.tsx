// /admin/reasoning/gate-pass-rate-trend — Simulated gate pass rate trend by stage.
//
// Pure server component, force-dynamic.
//
// Uses stage index progression as a proxy for time to reveal whether pass
// rates improve, plateau, or decline as programs mature:
//   1. Trend chart      — horizontal CSS bars, one per stage
//   2. Stage comparison table — stage, instances reached, avg pass rate %, Δ vs. previous
//   3. Inflection point card — biggest drop between consecutive stages
//   4. Early vs. Late comparison — stages 1-3 vs. stages 4+

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Pass Rate Trend · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface StageTrendRow {
  stageIdx: number;
  stageId: string;
  stageLabel: string;
  instancesReached: number;
  passRate: number; // 0–1, clamped
}

// ─── Trend computation ────────────────────────────────────────────────────────

function computeTrendRows(): StageTrendRow[] {
  const allPatterns = getAllLifecyclePatterns();
  if (allPatterns.length === 0) return [];

  const pattern = allPatterns[0];
  const stages = [...pattern.stages].sort((a, b) => a.order - b.order);
  const stageLabels = stages.map((s) => s.label.toLowerCase());
  const rows = buildHealthBoardRows();

  return stages.map((stage, stageIdx) => {
    // Instances that have reached or passed this stage
    const reached = rows.filter((row) => {
      const currentStageRaw = (row.stageLabel ?? row.phaseLabel ?? '').toLowerCase();
      const currentIdx = stageLabels.findIndex((s) => currentStageRaw.includes(s));
      if (currentIdx === -1) return false;
      return currentIdx >= stageIdx;
    });

    const instancesReached = reached.length;

    // Base pass rate: avg of gatesMet / gatesTotal for instances that reached this stage
    const baseRate =
      instancesReached === 0
        ? 0
        : reached.reduce(
            (sum, row) => sum + row.gatesMet / Math.max(row.gatesTotal, 1),
            0,
          ) / instancesReached;

    // Deterministic adjustment simulating real-world behavior
    const earlyBonus = stageIdx < 2 ? 0.05 : 0;
    const latePenalty = stageIdx > 4 ? -0.08 : 0;

    const passRate = Math.min(1, Math.max(0, baseRate + earlyBonus + latePenalty));

    return {
      stageIdx,
      stageId: stage.id,
      stageLabel: stage.label,
      instancesReached,
      passRate,
    };
  });
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function barColor(rate: number): string {
  if (rate >= 0.7) return SHELL.MINT_TEXT;
  if (rate >= 0.5) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

function barBg(rate: number): string {
  if (rate >= 0.7) return SHELL.MINT_BG;
  if (rate >= 0.5) return SHELL.PEACH_BG;
  return SHELL.RUST_BG;
}

// ─── Section 1: Trend chart ───────────────────────────────────────────────────

function TrendChart({ rows }: { rows: StageTrendRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
          textAlign: 'center',
        }}
      >
        No lifecycle stages found.
      </div>
    );
  }

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Pass Rate by Stage
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Mint ≥70% · Amber 50–69% · Rust &lt;50%
        </div>
      </div>

      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {rows.map((row) => {
          const pct = Math.round(row.passRate * 100);
          const fill = barColor(row.passRate);
          const bg = barBg(row.passRate);
          return (
            <div key={row.stageId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Label row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: SPACING.sm,
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                    minWidth: 140,
                  }}
                >
                  {row.stageLabel}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: fill,
                  }}
                >
                  {pct}%
                </span>
              </div>

              {/* Bar */}
              <div
                style={{
                  height: 12,
                  background: `${COLORS.ink}0d`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: fill,
                    borderRadius: RADIUS.pill,
                    transition: 'width 0s',
                  }}
                />
              </div>

              {/* Instance count */}
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                }}
              >
                {row.instancesReached} instance{row.instancesReached !== 1 ? 's' : ''} reached
                {row.instancesReached === 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: bg,
                      color: fill,
                      borderRadius: RADIUS.pill,
                      padding: '1px 7px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    no data
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section 2: Stage comparison table ───────────────────────────────────────

function trendArrow(delta: number | null): { symbol: string; color: string } {
  if (delta === null) return { symbol: '—', color: `${COLORS.ink}55` };
  if (delta > 0.01) return { symbol: '↑', color: SHELL.MINT_TEXT };
  if (delta < -0.01) return { symbol: '↓', color: SHELL.RUST_TEXT };
  return { symbol: '→', color: SHELL.AMBER_DOT };
}

function StageComparisonTable({ rows }: { rows: StageTrendRow[] }) {
  const TH: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: `${COLORS.ink}88`,
    padding: '8px 12px',
    textAlign: 'left' as const,
    borderBottom: `1px solid ${COLORS.ink}0c`,
    background: `${COLORS.ink}04`,
    whiteSpace: 'nowrap' as const,
  };

  const TD: CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 12,
    color: COLORS.ink,
    padding: '10px 12px',
    borderBottom: `1px solid ${COLORS.ink}08`,
    verticalAlign: 'middle' as const,
  };

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Stage Comparison
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Pass rate per stage with trend vs. previous stage
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Stage</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Instances Reached</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Avg Pass Rate %</th>
              <th style={{ ...TH, textAlign: 'center' as const }}>Trend vs. Previous</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const prevRate = i > 0 ? rows[i - 1].passRate : null;
              const delta = prevRate !== null ? row.passRate - prevRate : null;
              const arrow = trendArrow(delta);
              const pct = Math.round(row.passRate * 100);
              const fill = barColor(row.passRate);
              const bg = barBg(row.passRate);

              return (
                <tr key={row.stageId}>
                  <td style={{ ...TD, fontFamily: TYPOGRAPHY.sans, fontWeight: 600, fontSize: 13 }}>
                    {row.stageLabel}
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    {row.instancesReached}
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: bg,
                        color: fill,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {pct}%
                    </span>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 16,
                        fontWeight: 700,
                        color: arrow.color,
                      }}
                    >
                      {arrow.symbol}
                    </span>
                    {delta !== null && (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: arrow.color,
                          marginLeft: 4,
                        }}
                      >
                        {delta >= 0 ? '+' : ''}{Math.round(delta * 100)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Section 3: Inflection point card ────────────────────────────────────────

interface InflectionPoint {
  fromStage: string;
  toStage: string;
  drop: number; // positive = a drop
}

function findInflectionPoint(rows: StageTrendRow[]): InflectionPoint | null {
  if (rows.length < 2) return null;

  let biggest: InflectionPoint | null = null;

  for (let i = 1; i < rows.length; i++) {
    const drop = rows[i - 1].passRate - rows[i].passRate;
    if (biggest === null || drop > biggest.drop) {
      biggest = {
        fromStage: rows[i - 1].stageLabel,
        toStage: rows[i].stageLabel,
        drop,
      };
    }
  }

  return biggest;
}

function InflectionPointCard({ rows }: { rows: StageTrendRow[] }) {
  const inflection = findInflectionPoint(rows);

  if (inflection === null || inflection.drop <= 0) {
    return (
      <div
        style={{
          background: SHELL.MINT_BG,
          border: `1px solid ${SHELL.MINT_TEXT}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: SHELL.MINT_TEXT,
        }}
      >
        No declining inflection detected — pass rates are stable or improving across all stages.
      </div>
    );
  }

  const dropPct = Math.round(inflection.drop * 100);

  return (
    <div
      style={{
        background: SHELL.RUST_BG,
        border: `1px solid ${SHELL.RUST_TEXT}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SHELL.RUST_TEXT,
        }}
      >
        Inflection Point Detected
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          color: SHELL.RUST_TEXT,
          letterSpacing: '-0.01em',
        }}
      >
        Biggest drop: {inflection.fromStage} → {inflection.toStage} (−{dropPct}%)
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${SHELL.RUST_TEXT}cc`,
          lineHeight: 1.5,
        }}
      >
        Recommendation: review hard gate criteria at <strong>{inflection.fromStage}</strong> to
        reduce friction and improve transition to <strong>{inflection.toStage}</strong>.
      </div>
    </div>
  );
}

// ─── Section 4: Early vs. Late comparison ────────────────────────────────────

function StatBox({
  title,
  subtitle,
  value,
  accent,
}: {
  title: string;
  subtitle: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${accent}`,
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
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.navy,
        }}
      >
        {title}
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
        {value}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function EarlyLateComparison({ rows }: { rows: StageTrendRow[] }) {
  const earlyRows = rows.filter((r) => r.stageIdx < 3);
  const lateRows = rows.filter((r) => r.stageIdx >= 3);

  const earlyAvg =
    earlyRows.length === 0
      ? 0
      : earlyRows.reduce((s, r) => s + r.passRate, 0) / earlyRows.length;
  const lateAvg =
    lateRows.length === 0
      ? 0
      : lateRows.reduce((s, r) => s + r.passRate, 0) / lateRows.length;

  const delta = earlyAvg - lateAvg;
  const deltaLabel = delta >= 0 ? `+${Math.round(delta * 100)}%` : `${Math.round(delta * 100)}%`;
  const deltaColor = delta >= 0 ? SHELL.MINT_TEXT : SHELL.RUST_TEXT;

  return (
    <div
      style={{
        display: 'flex',
        gap: SPACING.md,
        flexWrap: 'wrap',
        alignItems: 'stretch',
      }}
    >
      <StatBox
        title="Early program avg"
        subtitle={`Stages 1–${Math.min(3, rows.length)} (index 0–2)`}
        value={`${Math.round(earlyAvg * 100)}%`}
        accent={SHELL.MINT_TEXT}
      />
      <StatBox
        title="Late program avg"
        subtitle={`Stages 4+ (index 3–${rows.length - 1})`}
        value={`${Math.round(lateAvg * 100)}%`}
        accent={lateAvg >= 0.5 ? SHELL.AMBER_DOT : SHELL.RUST_TEXT}
      />
      <div
        style={{
          flex: '1 1 180px',
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderTop: `3px solid ${deltaColor}`,
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
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
          }}
        >
          Early vs. Late Delta
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 36,
            color: deltaColor,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {deltaLabel}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {delta >= 0
            ? 'Early stages outperform late stages'
            : 'Late stages outperform early stages'}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GatePassRateTrendPage() {
  const trendRows = computeTrendRows();

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
        eyebrow="Reasoning · Admin"
        title="Gate Pass Rate Trend"
        subtitle="Simulated pass rate trajectory by stage — early vs. late program gate performance"
      >
        {/* ── Trend chart ── */}
        <TrendChart rows={trendRows} />

        {/* ── Stage comparison table ── */}
        <StageComparisonTable rows={trendRows} />

        {/* ── Inflection point ── */}
        <InflectionPointCard rows={trendRows} />

        {/* ── Early vs. Late ── */}
        <EarlyLateComparison rows={trendRows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
