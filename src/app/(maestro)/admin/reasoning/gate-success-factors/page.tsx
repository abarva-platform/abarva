// /admin/reasoning/gate-success-factors — Correlation analysis of what drives gate pass rates.
//
// Pure server component, force-dynamic.
//
// Segments all instances into two cohorts by gate pass rate:
//   High performers  — pass rate ≥ 70%
//   Low performers   — pass rate <  70%
//
// Computes per-factor averages for each cohort across five dimensions:
//   1. Health Score
//   2. Active Contradictions
//   3. Stage Index
//   4. Waiver Count
//   5. Evidence Count (proxy: min(stageIndex * 3 + 2, 20))
//
// Ranks factors by impact score = abs(delta / avg) and surfaces:
//   CohortOverview         — instance counts, avg pass rate, avg health per cohort
//   SuccessFactorTable     — factors sorted by impact score; interpretation blurb
//   ActionableInsights     — 3 bullet-point findings from top factors
//   InstanceDistribution   — chip grids of high- vs. low-performer instance names

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Success Factors · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const HIGH_PASS_THRESHOLD = 0.7; // 70%

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Stage index: approximate ordinal position in lifecycle (0-based). */
function deriveStageIndex(row: InstanceHealthRow): number {
  // Use gatesTotal as a rough proxy for how advanced the stage is.
  // Source instances at later stages accumulate more gates.
  if (row.type === 'program') return Math.min(Math.floor(row.gatesTotal / 3), 5);
  return Math.min(Math.floor(row.gatesTotal / 2), 7);
}

/** Composite health score identical to the gate-benchmark formula. */
function computeHealthScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

/** Evidence count proxy per spec. */
function evidenceCountProxy(stageIndex: number): number {
  return Math.min(stageIndex * 3 + 2, 20);
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtNum(v: number, d = 2): string {
  return v.toFixed(d);
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface EnrichedInstance {
  row: InstanceHealthRow;
  gatePassRate: number;
  healthScore: number;
  stageIndex: number;
  waiverCount: number;
  evidenceCount: number;
  isHighPerformer: boolean;
}

interface FactorStats {
  name: string;
  highAvg: number;
  lowAvg: number;
  delta: number; // highAvg - lowAvg
  impactScore: number; // abs(delta / midpoint), 0–∞
  interpretation: string;
  /** Higher is "better" for this factor? */
  higherIsBetter: boolean;
}

interface CohortStats {
  count: number;
  avgPassRate: number;
  avgHealth: number;
}

interface SuccessFactorData {
  high: CohortStats;
  low: CohortStats;
  factors: FactorStats[];
  highInstances: EnrichedInstance[];
  lowInstances: EnrichedInstance[];
}

// ─── Data builder ─────────────────────────────────────────────────────────────

function buildSuccessFactorData(): SuccessFactorData {
  const rows = buildHealthBoardRows();

  const allWaivers = getWaivers();
  const waiversByInstance = new Map<string, number>();
  for (const w of allWaivers) {
    waiversByInstance.set(w.instanceId, (waiversByInstance.get(w.instanceId) ?? 0) + 1);
  }

  // Suppress unused import lint — getAllLifecyclePatterns available for future extension
  void getAllLifecyclePatterns;

  const enriched: EnrichedInstance[] = rows.map((row) => {
    const gatePassRate = row.gatesMet / Math.max(row.gatesTotal, 1);
    const healthScore = computeHealthScore(row);
    const stageIndex = deriveStageIndex(row);
    const waiverCount = waiversByInstance.get(row.id) ?? 0;
    const evidenceCount = evidenceCountProxy(stageIndex);
    return {
      row,
      gatePassRate,
      healthScore,
      stageIndex,
      waiverCount,
      evidenceCount,
      isHighPerformer: gatePassRate >= HIGH_PASS_THRESHOLD,
    };
  });

  const highGroup = enriched.filter((e) => e.isHighPerformer);
  const lowGroup = enriched.filter((e) => !e.isHighPerformer);

  function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  const highAvgPassRate = avg(highGroup.map((e) => e.gatePassRate));
  const lowAvgPassRate = avg(lowGroup.map((e) => e.gatePassRate));
  const highAvgHealth = avg(highGroup.map((e) => e.healthScore));
  const lowAvgHealth = avg(lowGroup.map((e) => e.healthScore));

  const high: CohortStats = {
    count: highGroup.length,
    avgPassRate: highAvgPassRate,
    avgHealth: highAvgHealth,
  };

  const low: CohortStats = {
    count: lowGroup.length,
    avgPassRate: lowAvgPassRate,
    avgHealth: lowAvgHealth,
  };

  // ─── Factor computations ─────────────────────────────────────────────────

  function buildFactor(
    name: string,
    higherIsBetter: boolean,
    highVals: number[],
    lowVals: number[],
    interpretFn: (highA: number, lowA: number, delta: number) => string,
  ): FactorStats {
    const highAvg = avg(highVals);
    const lowAvg = avg(lowVals);
    const delta = highAvg - lowAvg;
    const midpoint = (Math.abs(highAvg) + Math.abs(lowAvg)) / 2;
    const impactScore = Math.abs(delta) / Math.max(midpoint, 1);
    return {
      name,
      highAvg,
      lowAvg,
      delta,
      impactScore,
      interpretation: interpretFn(highAvg, lowAvg, delta),
      higherIsBetter,
    };
  }

  const healthFactor = buildFactor(
    'Health Score',
    true,
    highGroup.map((e) => e.healthScore),
    lowGroup.map((e) => e.healthScore),
    (h, l) =>
      h > l
        ? `High performers score ${fmtNum(h - l, 1)} pts higher on health`
        : 'Similar health scores across cohorts',
  );

  const contradictionFactor = buildFactor(
    'Active Contradictions',
    false,
    highGroup.map((e) => e.row.activeContradictions),
    lowGroup.map((e) => e.row.activeContradictions),
    (h, l) => {
      const ratio = l / Math.max(h, 0.1);
      return h < l
        ? `High performers have ${fmtNum(ratio, 1)}× fewer contradictions`
        : 'Contradiction counts are similar across cohorts';
    },
  );

  const stageFactor = buildFactor(
    'Stage Index',
    true,
    highGroup.map((e) => e.stageIndex),
    lowGroup.map((e) => e.stageIndex),
    (h, l) =>
      h > l
        ? `High performers are ${fmtNum(h - l, 1)} stages further along`
        : 'Stage depth is comparable across cohorts',
  );

  const waiverFactor = buildFactor(
    'Waiver Count',
    false,
    highGroup.map((e) => e.waiverCount),
    lowGroup.map((e) => e.waiverCount),
    (h, l) =>
      h < l
        ? `High performers carry ${fmtNum(l - h, 1)} fewer active waivers`
        : 'Waiver counts are similar across cohorts',
  );

  const evidenceFactor = buildFactor(
    'Evidence Count (proxy)',
    true,
    highGroup.map((e) => e.evidenceCount),
    lowGroup.map((e) => e.evidenceCount),
    (h, l) =>
      h > l
        ? `High performers have ${fmtNum(h - l, 1)} more evidence items on average`
        : 'Evidence counts are comparable across cohorts',
  );

  const factors = [
    healthFactor,
    contradictionFactor,
    stageFactor,
    waiverFactor,
    evidenceFactor,
  ].sort((a, b) => b.impactScore - a.impactScore);

  return {
    high,
    low,
    factors,
    highInstances: highGroup,
    lowInstances: lowGroup,
  };
}

// ─── Cohort overview card ─────────────────────────────────────────────────────

function CohortCard({
  label,
  stats,
  accent,
  accentText,
  accentLine,
}: {
  label: string;
  stats: CohortStats;
  accent: string;
  accentText: string;
  accentLine: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 260px',
        background: accent,
        border: `1px solid ${accentLine}`,
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
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: accentText,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 36,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        {stats.count}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
        }}
      >
        instances
      </div>
      <div
        style={{
          marginTop: SPACING.xs,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}99`,
          }}
        >
          <span>Avg gate pass rate</span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontWeight: 700,
              color: accentText,
            }}
          >
            {fmtPct(stats.avgPassRate)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}99`,
          }}
        >
          <span>Avg health score</span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontWeight: 700,
              color: accentText,
            }}
          >
            {fmtNum(stats.avgHealth, 1)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section 1: Cohort overview ───────────────────────────────────────────────

function CohortOverview({ data }: { data: SuccessFactorData }) {
  return (
    <section>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md}`,
          letterSpacing: '-0.01em',
        }}
      >
        Cohort overview
      </h2>
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <CohortCard
          label="High performers (pass rate ≥ 70%)"
          stats={data.high}
          accent={SHELL.MINT_BG}
          accentText={SHELL.MINT_TEXT}
          accentLine={SHELL.MINT_LINE}
        />
        <CohortCard
          label="Low performers (pass rate < 70%)"
          stats={data.low}
          accent={SHELL.RUST_BG}
          accentText={SHELL.RUST_TEXT}
          accentLine={`${SHELL.RUST_TEXT}44`}
        />
      </div>
    </section>
  );
}

// ─── Section 2: Success factor ranking table ──────────────────────────────────

function FactorValueCell({
  value,
  higherIsBetter,
  isHigh,
  style: extraStyle,
}: {
  value: number;
  higherIsBetter: boolean;
  isHigh: boolean;
  style?: CSSProperties;
}) {
  // For a "high performer" cell, good = higher value if higherIsBetter
  // For a "low performer" cell, good = lower value if higherIsBetter
  const isGoodValue = isHigh ? higherIsBetter : !higherIsBetter;
  // Compare within the pair
  const color = isGoodValue ? SHELL.MINT_TEXT : SHELL.RUST_TEXT;

  return (
    <td
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 13,
        fontWeight: 700,
        color,
        padding: `${SPACING.sm} ${SPACING.md}`,
        borderBottom: `1px solid ${COLORS.ink}08`,
        textAlign: 'right',
        verticalAlign: 'middle',
        ...extraStyle,
      }}
    >
      {fmtNum(value, 1)}
    </td>
  );
}

function ImpactBar({ score }: { score: number }) {
  // Clamp to 0–1 for display; score > 1 means very strong correlation
  const displayPct = Math.min(score * 60, 100);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        minWidth: 100,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 8,
          background: `${COLORS.ink}10`,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayPct}%`,
            background: COLORS.navy,
            borderRadius: RADIUS.pill,
            minWidth: displayPct > 0 ? 4 : 0,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
          minWidth: 30,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {fmtNum(score, 2)}
      </span>
    </div>
  );
}

function SuccessFactorTable({ factors }: { factors: FactorStats[] }) {
  const TH: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: `${COLORS.ink}66`,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.ink}14`,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };

  const TD_BASE: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 12,
    color: COLORS.ink,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.ink}08`,
    verticalAlign: 'middle',
  };

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
          Success factor ranking
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Factors sorted by impact score (higher = stronger predictor of gate success).
          Contradiction and waiver deltas: fewer is better for high performers.
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={TH}>#</th>
              <th style={TH}>Factor</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>High performers avg</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Low performers avg</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Delta</th>
              <th style={{ ...TH, minWidth: 160 }}>Impact score</th>
              <th style={TH}>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {factors.map((f, idx) => {
              const deltaPositive = f.delta > 0;
              const deltaColor = f.higherIsBetter
                ? deltaPositive
                  ? SHELL.MINT_TEXT
                  : SHELL.RUST_TEXT
                : deltaPositive
                  ? SHELL.RUST_TEXT
                  : SHELL.MINT_TEXT;

              return (
                <tr key={f.name}>
                  <td
                    style={{
                      ...TD_BASE,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: `${COLORS.ink}55`,
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      ...TD_BASE,
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {f.name}
                  </td>
                  <FactorValueCell
                    value={f.highAvg}
                    higherIsBetter={f.higherIsBetter}
                    isHigh={true}
                  />
                  <FactorValueCell
                    value={f.lowAvg}
                    higherIsBetter={f.higherIsBetter}
                    isHigh={false}
                  />
                  <td
                    style={{
                      ...TD_BASE,
                      textAlign: 'right',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                      fontWeight: 700,
                      color: deltaColor,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.delta > 0 ? '↑' : f.delta < 0 ? '↓' : '±'}
                    {Math.abs(f.delta).toFixed(1)}
                  </td>
                  <td style={{ ...TD_BASE, minWidth: 160 }}>
                    <ImpactBar score={f.impactScore} />
                  </td>
                  <td
                    style={{
                      ...TD_BASE,
                      fontSize: 11,
                      color: `${COLORS.ink}99`,
                      lineHeight: 1.5,
                      maxWidth: 280,
                    }}
                  >
                    {f.interpretation}
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

// ─── Section 3: Actionable insights ──────────────────────────────────────────

function ActionableInsights({
  factors,
  high,
  low,
}: {
  factors: FactorStats[];
  high: CohortStats;
  low: CohortStats;
}) {
  const [top1, top2, top3] = factors;

  const passRateDelta = ((high.avgPassRate - low.avgPassRate) * 100).toFixed(1);

  function insightFor(f: FactorStats | undefined, index: number): string {
    if (!f) return 'Collect more instances to surface additional insights.';

    if (f.name === 'Active Contradictions') {
      const lowA = fmtNum(f.lowAvg, 1);
      const highA = fmtNum(f.highAvg, 1);
      return `Reducing contradictions from ${lowA} to ${highA} correlates with +${passRateDelta}% gate pass rate — contradiction resolution is the highest-leverage action.`;
    }
    if (f.name === 'Health Score') {
      return `Instances with health score ≥ ${Math.round(f.highAvg)} have ${passRateDelta}% higher gate pass rates — prioritise criteria that move the health composite.`;
    }
    if (f.name === 'Stage Index') {
      const highStage = Math.round(f.highAvg);
      return `Instances at stage index ${highStage}+ have ${passRateDelta}% higher gate pass rates — earlier stage engagement predicts gate success.`;
    }
    if (f.name === 'Waiver Count') {
      const direction = f.highAvg < f.lowAvg ? 'lower' : 'higher';
      return `Waiver usage is ${direction} in high-performing instances (${fmtNum(f.highAvg, 1)} vs. ${fmtNum(f.lowAvg, 1)}) — review waiver legitimacy on underperforming instances.`;
    }
    if (f.name === 'Evidence Count (proxy)') {
      return `High performers carry ${fmtNum(f.delta, 1)} more evidence items on average — improving evidence depth correlates with +${passRateDelta}% gate pass rate.`;
    }
    return `${f.name}: high performers average ${fmtNum(f.highAvg, 1)} vs. ${fmtNum(f.lowAvg, 1)} for low performers (Δ ${fmtNum(f.delta, 1)}, impact ${fmtNum(f.impactScore, 2)}).`;
  }

  const insights = [insightFor(top1, 0), insightFor(top2, 1), insightFor(top3, 2)];

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
          Actionable insights
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Derived from the top 3 impact factors — highest-leverage levers for improving gate pass rates.
        </div>
      </header>
      <ul
        style={{
          margin: 0,
          padding: `${SPACING.md} ${SPACING.lg}`,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {insights.map((insight, idx) => (
          <li
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: SPACING.md,
              paddingBottom: idx < insights.length - 1 ? SPACING.md : 0,
              borderBottom: idx < insights.length - 1 ? `1px solid ${COLORS.ink}08` : 'none',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.navy,
                background: `${COLORS.navy}12`,
                borderRadius: RADIUS.sm,
                padding: '2px 7px',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {idx + 1}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: COLORS.ink,
                lineHeight: 1.55,
              }}
            >
              {insight}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Section 4: Instance distribution ────────────────────────────────────────

function InstanceChip({
  label,
  bg,
  text,
  border,
}: {
  label: string;
  bg: string;
  text: string;
  border: string;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: RADIUS.pill,
        padding: '3px 12px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function InstanceColumn({
  title,
  instances,
  bg,
  text,
  border,
}: {
  title: string;
  instances: EnrichedInstance[];
  bg: string;
  text: string;
  border: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 260px',
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
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: text,
          paddingBottom: SPACING.sm,
          borderBottom: `1px solid ${border}`,
        }}
      >
        {title}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontWeight: 400,
            marginLeft: 8,
            color: `${COLORS.ink}55`,
          }}
        >
          ({instances.length})
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
        }}
      >
        {instances.length === 0 ? (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}55`,
              fontStyle: 'italic',
            }}
          >
            No instances in this cohort
          </span>
        ) : (
          instances.map((e) => (
            <span key={e.row.id} style={{ display: 'contents' }}>
              <InstanceChip
                label={e.row.label}
                bg={bg}
                text={text}
                border={border}
              />
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function InstanceDistribution({ data }: { data: SuccessFactorData }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md}`,
          letterSpacing: '-0.01em',
        }}
      >
        Instance distribution
      </h2>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
          marginBottom: SPACING.lg,
        }}
      >
        All instances classified by gate pass rate cohort.
      </div>
      <div
        style={{
          display: 'flex',
          gap: SPACING.xl,
          flexWrap: 'wrap',
        }}
      >
        <InstanceColumn
          title="High Performers"
          instances={data.highInstances}
          bg={SHELL.MINT_BG}
          text={SHELL.MINT_TEXT}
          border={SHELL.MINT_LINE}
        />
        <InstanceColumn
          title="Low Performers"
          instances={data.lowInstances}
          bg={SHELL.PEACH_BG}
          text={SHELL.PEACH_TEXT}
          border={`${SHELL.PEACH_TEXT}55`}
        />
      </div>
    </section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
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
      No instances found — populate the fixture corpus to enable success factor analysis.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateSuccessFactorsPage() {
  const data = buildSuccessFactorData();
  const hasData = data.high.count + data.low.count > 0;

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
        title="Gate Success Factors"
        subtitle="What drives gate pass rates — correlation analysis across health, stage, contradictions, and waivers"
      >
        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            <CohortOverview data={data} />
            <SuccessFactorTable factors={data.factors} />
            <ActionableInsights
              factors={data.factors}
              high={data.high}
              low={data.low}
            />
            <InstanceDistribution data={data} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
