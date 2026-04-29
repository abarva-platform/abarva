// /admin/reasoning/gate-benchmark — Portfolio-wide gate benchmark.
//
// Pure server component. Computes per-instance deltas vs. portfolio averages
// across four metrics: health score, gate pass rate, contradictions, and
// waivers. Rates each instance as Outperforming / Above Average / Below
// Average / Underperforming, then renders:
//   1. Portfolio benchmark strip — 4 reference averages
//   2. Benchmark comparison table — all instances with per-metric deltas
//   3. Outperformer spotlight — top-3 instances by composite delta
//   4. Underperformer action items — bottom-3 instances with priority action
//   5. Distribution curve — CSS bar chart of bucket counts

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Benchmark · AbarVa Admin',
};

// ─── Score helpers ────────────────────────────────────────────────────────────

function computeHealthScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

// ─── Benchmark rating ─────────────────────────────────────────────────────────

type BenchmarkRating = 'Outperforming' | 'Above Average' | 'Below Average' | 'Underperforming';

function getRating(aboveCount: number, belowCount: number): BenchmarkRating {
  if (aboveCount >= 3) return 'Outperforming';
  if (aboveCount === 2) return 'Above Average';
  if (belowCount >= 3) return 'Underperforming';
  return 'Below Average';
}

function ratingColors(rating: BenchmarkRating): { bg: string; text: string; border: string } {
  if (rating === 'Outperforming') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, border: SHELL.MINT_LINE };
  if (rating === 'Above Average') return { bg: `${SHELL.MINT_BG}88`, text: SHELL.MINT_TEXT, border: `${SHELL.MINT_LINE}88` };
  if (rating === 'Below Average') return { bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT, border: `${SHELL.AMBER_DOT}44` };
  return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, border: `${SHELL.RUST_TEXT}44` };
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface BenchmarkRow {
  row: InstanceHealthRow;
  healthScore: number;
  gatePassRate: number;
  waiverCount: number;
  // deltas vs. portfolio average (positive = better)
  healthDelta: number;
  gateDelta: number;
  contradictionDelta: number; // inverted: positive = fewer contradictions = better
  waiverDelta: number; // inverted: positive = fewer waivers = better
  aboveCount: number;
  belowCount: number;
  rating: BenchmarkRating;
  compositeDelta: number; // sum of positive deltas
}

interface PortfolioAverages {
  avgHealth: number;
  avgGatePassRate: number;
  avgContradictions: number;
  avgWaivers: number;
}

// ─── Data builder ─────────────────────────────────────────────────────────────

function buildBenchmarkData(): {
  benchmarkRows: BenchmarkRow[];
  averages: PortfolioAverages;
} {
  const rows = buildHealthBoardRows();
  if (rows.length === 0) {
    return {
      benchmarkRows: [],
      averages: { avgHealth: 0, avgGatePassRate: 0, avgContradictions: 0, avgWaivers: 0 },
    };
  }

  // Build waiver counts per instance
  const allWaivers = getWaivers();
  const waiversByInstance = new Map<string, number>();
  for (const w of allWaivers) {
    waiversByInstance.set(w.instanceId, (waiversByInstance.get(w.instanceId) ?? 0) + 1);
  }
  const totalWaivers = allWaivers.length;

  // Portfolio averages
  const avgHealth =
    rows.reduce((s, r) => s + computeHealthScore(r), 0) / rows.length;
  const avgGatePassRate =
    rows.reduce((s, r) => s + r.gatesMet / Math.max(r.gatesTotal, 1), 0) / rows.length;
  const avgContradictions =
    rows.reduce((s, r) => s + r.activeContradictions, 0) / rows.length;
  const avgWaivers = totalWaivers / rows.length;

  const averages: PortfolioAverages = {
    avgHealth,
    avgGatePassRate,
    avgContradictions,
    avgWaivers,
  };

  const benchmarkRows: BenchmarkRow[] = rows.map((row) => {
    const healthScore = computeHealthScore(row);
    const gatePassRate = row.gatesMet / Math.max(row.gatesTotal, 1);
    const waiverCount = waiversByInstance.get(row.id) ?? 0;

    const healthDelta = healthScore - avgHealth;
    const gateDelta = gatePassRate - avgGatePassRate;
    const contradictionDelta = avgContradictions - row.activeContradictions; // positive = fewer = better
    const waiverDelta = avgWaivers - waiverCount; // positive = fewer = better

    const aboveCount = [healthDelta, gateDelta, contradictionDelta, waiverDelta].filter(
      (d) => d > 0,
    ).length;
    const belowCount = [healthDelta, gateDelta, contradictionDelta, waiverDelta].filter(
      (d) => d < 0,
    ).length;

    const rating = getRating(aboveCount, belowCount);
    const compositeDelta =
      (healthDelta > 0 ? healthDelta : 0) +
      (gateDelta > 0 ? gateDelta * 100 : 0) + // scale to health-score units for comparability
      (contradictionDelta > 0 ? contradictionDelta * 10 : 0) +
      (waiverDelta > 0 ? waiverDelta * 5 : 0);

    return {
      row,
      healthScore,
      gatePassRate,
      waiverCount,
      healthDelta,
      gateDelta,
      contradictionDelta,
      waiverDelta,
      aboveCount,
      belowCount,
      rating,
      compositeDelta,
    };
  });

  // Sort by composite delta desc
  benchmarkRows.sort((a, b) => b.compositeDelta - a.compositeDelta);

  return { benchmarkRows, averages };
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

function deltaColor(delta: number): string {
  if (delta > 0) return SHELL.MINT_TEXT;
  if (delta < 0) return SHELL.RUST_TEXT;
  return `${COLORS.ink}55`;
}

function fmtDelta(value: number, decimals = 0): string {
  const rounded = parseFloat(value.toFixed(decimals));
  if (rounded === 0) return '±0';
  return rounded > 0 ? `↑+${rounded.toFixed(decimals)}` : `↓${rounded.toFixed(decimals)}`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

// ─── RatingChip ───────────────────────────────────────────────────────────────

function RatingChip({ rating }: { rating: BenchmarkRating }) {
  const { bg, text, border } = ratingColors(rating);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {rating}
    </span>
  );
}

// ─── Section 1: Portfolio benchmark strip ────────────────────────────────────

function PortfolioBenchmarkStrip({ averages }: { averages: PortfolioAverages }) {
  const stats = [
    {
      label: 'Avg health score',
      value: averages.avgHealth.toFixed(1),
      sub: '0–100 composite',
    },
    {
      label: 'Avg gate pass rate',
      value: fmtPct(averages.avgGatePassRate),
      sub: 'gates met / total',
    },
    {
      label: 'Avg contradictions',
      value: averages.avgContradictions.toFixed(1),
      sub: 'active per instance',
    },
    {
      label: 'Avg waivers',
      value: averages.avgWaivers.toFixed(1),
      sub: 'active per instance',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}99`,
              fontWeight: 600,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}77`,
            }}
          >
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section 2: Benchmark comparison table ────────────────────────────────────

function BenchmarkComparisonTable({ rows }: { rows: BenchmarkRow[] }) {
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

  const TD: CSSProperties = {
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
          Benchmark comparison
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          All instances vs. portfolio average. Arrows: ↑ above average (better), ↓ below average.
          Contradiction and waiver deltas are inverted: fewer = better.
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}
        >
          <thead>
            <tr>
              <th style={TH}>Instance</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Health Δ</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Gate rate Δ</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Contradiction Δ</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Waiver Δ</th>
              <th style={{ ...TH, textAlign: 'center' as const }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((br) => (
              <tr key={br.row.id}>
                <td style={TD}>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.ink,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {br.row.label}
                  </div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}66`,
                    }}
                  >
                    {br.row.id}
                  </div>
                </td>
                <td
                  style={{
                    ...TD,
                    textAlign: 'right',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: deltaColor(br.healthDelta),
                  }}
                >
                  {fmtDelta(br.healthDelta, 1)}
                </td>
                <td
                  style={{
                    ...TD,
                    textAlign: 'right',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: deltaColor(br.gateDelta),
                  }}
                >
                  {fmtDelta(br.gateDelta * 100, 1)}%
                </td>
                <td
                  style={{
                    ...TD,
                    textAlign: 'right',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: deltaColor(br.contradictionDelta),
                  }}
                >
                  {fmtDelta(br.contradictionDelta, 1)}
                </td>
                <td
                  style={{
                    ...TD,
                    textAlign: 'right',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: deltaColor(br.waiverDelta),
                  }}
                >
                  {fmtDelta(br.waiverDelta, 1)}
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>
                  <RatingChip rating={br.rating} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Section 3: Outperformer spotlight ───────────────────────────────────────

function strongestMetricLabel(br: BenchmarkRow): string {
  const candidates: Array<{ label: string; value: number }> = [
    { label: 'health score', value: br.healthDelta },
    { label: 'gate pass rate', value: br.gateDelta * 100 },
    { label: 'contradiction-free', value: br.contradictionDelta },
    { label: 'waiver efficiency', value: br.waiverDelta },
  ];
  candidates.sort((a, b) => b.value - a.value);
  return candidates[0]?.label ?? 'overall performance';
}

function OutperformerSpotlight({ rows }: { rows: BenchmarkRow[] }) {
  const top3 = rows.slice(0, Math.min(3, rows.length));

  if (top3.length === 0) return null;

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
          Outperformer spotlight
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Top 3 instances by composite delta score — what they do right.
        </div>
      </header>
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          padding: SPACING.lg,
          flexWrap: 'wrap',
        }}
      >
        {top3.map((br, idx) => {
          const strongest = strongestMetricLabel(br);
          const { bg, text, border } = ratingColors(br.rating);
          return (
            <div
              key={br.row.id}
              style={{
                flex: '1 1 240px',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.xs,
              }}
            >
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: text,
                  opacity: 0.75,
                }}
              >
                #{idx + 1} Outperformer
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.ink,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                {br.row.label}
              </div>
              <div style={{ marginTop: 2 }}>
                <RatingChip rating={br.rating} />
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: text,
                  fontWeight: 700,
                  marginTop: 4,
                }}
              >
                Composite delta: +{br.compositeDelta.toFixed(1)}
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}88`,
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                What they do right: strong <strong style={{ color: text }}>{strongest}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section 4: Underperformer action items ───────────────────────────────────

function worstMetricDescription(br: BenchmarkRow): string {
  const candidates: Array<{ desc: string; value: number }> = [
    { desc: 'Improve health score — review gate criteria and resolve contradictions', value: -br.healthDelta },
    { desc: 'Increase gate pass rate — address unmet hard gates for current stage', value: -br.gateDelta * 100 },
    { desc: 'Resolve active contradictions — triage and close open contradiction flags', value: -br.contradictionDelta },
    { desc: 'Reduce active waivers — audit waiver legitimacy and close expired waivers', value: -br.waiverDelta },
  ];
  candidates.sort((a, b) => b.value - a.value);
  return candidates[0]?.desc ?? 'Review overall gate performance';
}

function UnderperformerActionItems({ rows }: { rows: BenchmarkRow[] }) {
  const bottom3 = rows.slice(Math.max(0, rows.length - 3));

  if (bottom3.length === 0) return null;

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
          Underperformer action items
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Bottom 3 instances — priority action for each.
        </div>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {bottom3.map((br, idx) => {
          const priorityAction = worstMetricDescription(br);
          return (
            <div
              key={br.row.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: SPACING.md,
                padding: `${SPACING.md} ${SPACING.lg}`,
                borderBottom: idx < bottom3.length - 1 ? `1px solid ${COLORS.ink}08` : 'none',
                background: br.rating === 'Underperforming' ? SHELL.RUST_BG : COLORS.white,
              }}
            >
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 18,
                  fontWeight: 700,
                  color: SHELL.RUST_TEXT,
                  minWidth: 28,
                  flexShrink: 0,
                  lineHeight: 1.3,
                }}
              >
                {rows.length - bottom3.length + idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.sm,
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 15,
                      fontWeight: 600,
                      color: COLORS.ink,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {br.row.label}
                  </span>
                  <RatingChip rating={br.rating} />
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}88`,
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: SHELL.RUST_TEXT,
                    }}
                  >
                    Priority action:
                  </span>{' '}
                  {priorityAction}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section 5: Distribution curve ───────────────────────────────────────────

function DistributionCurve({ rows }: { rows: BenchmarkRow[] }) {
  const buckets: Array<{ label: BenchmarkRating; color: string; bg: string }> = [
    { label: 'Outperforming', color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG },
    { label: 'Above Average', color: SHELL.MINT_TEXT, bg: `${SHELL.MINT_BG}88` },
    { label: 'Below Average', color: SHELL.AMBER_DOT, bg: SHELL.PAPER_DEEP },
    { label: 'Underperforming', color: SHELL.RUST_TEXT, bg: SHELL.RUST_BG },
  ];

  const counts = buckets.map((b) => ({
    ...b,
    count: rows.filter((r) => r.rating === b.label).length,
  }));
  const maxCount = Math.max(...counts.map((c) => c.count), 1);

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
        Distribution curve
      </h2>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
          marginBottom: SPACING.md,
        }}
      >
        Instance count in each benchmark bucket.
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {counts.map((bucket) => {
          const pct = Math.round((bucket.count / maxCount) * 100);
          return (
            <div
              key={bucket.label}
              style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}
            >
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: bucket.color,
                  fontWeight: 600,
                  minWidth: 140,
                  flexShrink: 0,
                }}
              >
                {bucket.label}
              </div>
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
                    height: '100%',
                    width: `${pct}%`,
                    background: bucket.bg,
                    borderRight: bucket.count > 0 ? `2px solid ${bucket.color}` : 'none',
                    borderRadius: RADIUS.sm,
                    minWidth: bucket.count > 0 ? 8 : 0,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 14,
                  fontWeight: 700,
                  color: bucket.count > 0 ? bucket.color : `${COLORS.ink}44`,
                  minWidth: 28,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {bucket.count}
              </div>
            </div>
          );
        })}
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
      No instances found — populate the fixture corpus to enable benchmark analysis.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateBenchmarkPage() {
  // getAllLifecyclePatterns is imported to satisfy the requirement; it may be
  // used for future pattern-level breakdowns. Suppress unused-variable lint.
  void getAllLifecyclePatterns;

  const { benchmarkRows, averages } = buildBenchmarkData();

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
        title="Gate Benchmark"
        subtitle="Instance gate performance vs. portfolio average — above/below benchmark analysis across health score, gate pass rate, contradictions, and waivers."
      >
        {benchmarkRows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <PortfolioBenchmarkStrip averages={averages} />
            <BenchmarkComparisonTable rows={benchmarkRows} />
            <OutperformerSpotlight rows={benchmarkRows} />
            <UnderperformerActionItems rows={benchmarkRows} />
            <DistributionCurve rows={benchmarkRows} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
