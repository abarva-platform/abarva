// /admin/reasoning/gate-health-index — Portfolio Gate Health Index (GHI).
//
// Composite 0-100 score derived from 5 weighted sub-indices:
//   Pass Rate (30%), Evidence Coverage (25%), No-Waiver (20%),
//   No-Contradiction (15%), Progression (10%).
//
// Pure server component. All data sourced from fixture stores + lifecycle
// patterns; no IO, no Date.now(), no randomness.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Health Index · AbarVa Admin',
};

// ─── Color constants (inlined — no banned tokens) ────────────────────────────

const DEEP_MINT = '#0D3B1A';      // GHI ≥ 80 Excellent
const MINT_INK = COLORS.mintInk;  // GHI 65-79 Good
const AMBER_INK = COLORS.amberInk; // GHI 50-64 Fair
const ORANGE_INK = '#7A3500';      // GHI 35-49 Poor
const RUST_INK = COLORS.coralInk; // GHI < 35 Critical

const MINT_SOFT = COLORS.mintSoft;
const AMBER_SOFT = COLORS.amberSoft;
const ORANGE_SOFT = '#FFF0E1';
const CORAL_SOFT = COLORS.coralSoft;

// ─── GHI computation ─────────────────────────────────────────────────────────

interface SubIndex {
  name: string;
  score: number;         // 0-100
  weight: number;        // decimal, e.g. 0.30
  weightLabel: string;   // e.g. "30%"
  contribution: number;  // score * weight, rounded
  description: string;
}

interface GHIData {
  ghi: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  subIndices: SubIndex[];
  totalInstances: number;
}

function computeGHI(): GHIData {
  const rows = buildHealthBoardRows();
  const waivers = getWaivers();
  const patterns = getAllLifecyclePatterns();

  const totalInstances = rows.length;
  if (totalInstances === 0) {
    const empty: SubIndex[] = [
      { name: 'Pass Rate', score: 0, weight: 0.30, weightLabel: '30%', contribution: 0, description: 'Average gate pass rate across all instances' },
      { name: 'Evidence Coverage', score: 0, weight: 0.25, weightLabel: '25%', contribution: 0, description: 'Instances with substantial evidence (stage ≥ 2 proxy)' },
      { name: 'No-Waiver', score: 100, weight: 0.20, weightLabel: '20%', contribution: 20, description: 'Penalty-adjusted score for active gate waivers' },
      { name: 'No-Contradiction', score: 100, weight: 0.15, weightLabel: '15%', contribution: 15, description: 'Penalty-adjusted score for active contradictions' },
      { name: 'Progression', score: 0, weight: 0.10, weightLabel: '10%', contribution: 0, description: 'Average stage progress as a % of total stages' },
    ];
    return { ghi: 0, rating: 'Critical', subIndices: empty, totalInstances: 0 };
  }

  // 1. Pass Rate Index
  const totalPassRate = rows.reduce(
    (sum, r) => sum + (r.gatesTotal > 0 ? r.gatesMet / r.gatesTotal : 0),
    0,
  );
  const avgGatePassRate = totalPassRate / totalInstances;
  const passRateIndex = Math.round(avgGatePassRate * 100);

  // 2. Evidence Coverage Index
  // Proxy: instance has "substantial evidence" if it's past an early stage.
  // We look up total stages from the first pattern; instances on stage ≥ 2
  // of their pattern are considered well-evidenced.
  const totalStages = patterns.length > 0 ? patterns[0].stages.length : 8;
  let instancesWithEvidence = 0;
  for (const row of rows) {
    const stageLabel = row.stageLabel ?? row.phaseLabel ?? '';
    const pattern = patterns.find((p) =>
      // Match pattern by source type heuristic
      row.type === 'source'
        ? p.patternId.startsWith('PAT-SRC')
        : p.patternId.startsWith('PAT-PRG'),
    );
    const patternToUse = pattern ?? patterns[0];
    if (!patternToUse) {
      instancesWithEvidence++;
      continue;
    }
    const stageIdx = patternToUse.stages.findIndex(
      (s) => s.label.toLowerCase() === stageLabel.toLowerCase() ||
             s.id.toLowerCase() === stageLabel.toLowerCase(),
    );
    // stageIdx >= 2 means they've advanced past the first two stages
    if (stageIdx >= 2) instancesWithEvidence++;
  }
  const evidenceCoverageIndex = Math.round((instancesWithEvidence / totalInstances) * 100);

  // 3. No-Waiver Index
  const totalWaivers = waivers.length;
  const noWaiverPenalty = Math.min(100, (totalWaivers / Math.max(totalInstances, 1)) * 20);
  const noWaiverIndex = Math.max(0, Math.round(100 - noWaiverPenalty));

  // 4. No-Contradiction Index
  const totalContradictions = rows.reduce((sum, r) => sum + r.activeContradictions, 0);
  const avgContradictions = totalContradictions / totalInstances;
  const noContradictionIndex = Math.max(0, Math.round(100 - avgContradictions * 25));

  // 5. Progression Index
  let totalProgressSum = 0;
  for (const row of rows) {
    const stageLabel = row.stageLabel ?? row.phaseLabel ?? '';
    const pattern = patterns.find((p) =>
      row.type === 'source'
        ? p.patternId.startsWith('PAT-SRC')
        : p.patternId.startsWith('PAT-PRG'),
    );
    const patternToUse = pattern ?? patterns[0];
    if (!patternToUse || patternToUse.stages.length === 0) {
      totalProgressSum += 0;
      continue;
    }
    const stageIdx = patternToUse.stages.findIndex(
      (s) => s.label.toLowerCase() === stageLabel.toLowerCase() ||
             s.id.toLowerCase() === stageLabel.toLowerCase(),
    );
    const progressPct = stageIdx >= 0
      ? stageIdx / Math.max(patternToUse.stages.length - 1, 1)
      : 0;
    totalProgressSum += progressPct;
  }
  const avgProgressPct = totalProgressSum / totalInstances;
  const progressionIndex = Math.round(avgProgressPct * 100);

  // GHI composite
  const ghi = Math.round(
    0.30 * passRateIndex +
    0.25 * evidenceCoverageIndex +
    0.20 * noWaiverIndex +
    0.15 * noContradictionIndex +
    0.10 * progressionIndex,
  );

  const rating: GHIData['rating'] =
    ghi >= 80 ? 'Excellent' :
    ghi >= 65 ? 'Good' :
    ghi >= 50 ? 'Fair' :
    ghi >= 35 ? 'Poor' :
    'Critical';

  const subIndices: SubIndex[] = [
    {
      name: 'Pass Rate',
      score: passRateIndex,
      weight: 0.30,
      weightLabel: '30%',
      contribution: Math.round(0.30 * passRateIndex * 10) / 10,
      description: 'Average gate pass rate across all instances',
    },
    {
      name: 'Evidence Coverage',
      score: evidenceCoverageIndex,
      weight: 0.25,
      weightLabel: '25%',
      contribution: Math.round(0.25 * evidenceCoverageIndex * 10) / 10,
      description: 'Instances with substantial evidence (stage ≥ 2 proxy)',
    },
    {
      name: 'No-Waiver',
      score: noWaiverIndex,
      weight: 0.20,
      weightLabel: '20%',
      contribution: Math.round(0.20 * noWaiverIndex * 10) / 10,
      description: 'Penalty-adjusted score for active gate waivers',
    },
    {
      name: 'No-Contradiction',
      score: noContradictionIndex,
      weight: 0.15,
      weightLabel: '15%',
      contribution: Math.round(0.15 * noContradictionIndex * 10) / 10,
      description: 'Penalty-adjusted score for active contradictions',
    },
    {
      name: 'Progression',
      score: progressionIndex,
      weight: 0.10,
      weightLabel: '10%',
      contribution: Math.round(0.10 * progressionIndex * 10) / 10,
      description: 'Average stage advancement as % of total stages',
    },
  ];

  return { ghi, rating, subIndices, totalInstances };
}

// ─── Rating helpers ───────────────────────────────────────────────────────────

function ratingColor(rating: GHIData['rating']): string {
  switch (rating) {
    case 'Excellent': return DEEP_MINT;
    case 'Good':      return MINT_INK;
    case 'Fair':      return AMBER_INK;
    case 'Poor':      return ORANGE_INK;
    case 'Critical':  return RUST_INK;
  }
}

function ratingBg(rating: GHIData['rating']): string {
  switch (rating) {
    case 'Excellent': return MINT_SOFT;
    case 'Good':      return MINT_SOFT;
    case 'Fair':      return AMBER_SOFT;
    case 'Poor':      return ORANGE_SOFT;
    case 'Critical':  return CORAL_SOFT;
  }
}

function ratingDescription(rating: GHIData['rating']): string {
  switch (rating) {
    case 'Excellent': return 'Gate portfolio is performing at an outstanding level across all sub-indices.';
    case 'Good':      return 'Gate portfolio is performing well; minor improvements could push toward Excellent.';
    case 'Fair':      return 'Gate portfolio has notable gaps; targeted remediation will yield meaningful gains.';
    case 'Poor':      return 'Gate portfolio has systemic issues; multiple sub-indices need urgent attention.';
    case 'Critical':  return 'Gate portfolio is in a critical state; immediate intervention required across all dimensions.';
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return DEEP_MINT;
  if (score >= 65) return MINT_INK;
  if (score >= 50) return AMBER_INK;
  if (score >= 35) return ORANGE_INK;
  return RUST_INK;
}

function scoreBg(score: number): string {
  if (score >= 65) return MINT_SOFT;
  if (score >= 50) return AMBER_SOFT;
  if (score >= 35) return ORANGE_SOFT;
  return CORAL_SOFT;
}

function actionRecommendation(name: string, score: number): string {
  switch (name) {
    case 'Pass Rate':
      return `Gate pass rate is at ${score}/100. Review unmet hard gate criteria across instances at /admin/reasoning/gate-gap to identify the most common blockers.`;
    case 'Evidence Coverage':
      return `Evidence coverage index is ${score}/100. Inject missing evidence fields at /admin/reasoning/evidence-ingest to help instances reach substantive evidence thresholds.`;
    case 'No-Waiver':
      return `Waiver index is ${score}/100. Review and resolve waivers in /admin/reasoning/waiver-risk-register to reduce the waiver penalty on GHI.`;
    case 'No-Contradiction':
      return `Contradiction index is ${score}/100. Resolve active contradictions at /admin/reasoning/contradiction-resolver to eliminate health suppression.`;
    case 'Progression':
      return `Progression index is ${score}/100. Identify stage-advancement blockers at /admin/reasoning/stage-blockers to accelerate instances through lifecycle stages.`;
    default:
      return `Address the root causes of the low ${name} score to improve GHI.`;
  }
}

// ─── Style constants ──────────────────────────────────────────────────────────

const CARD: CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
};

const CARD_HEADER: CSSProperties = {
  padding: `${SPACING.md} ${SPACING.lg}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
};

const SECTION_TITLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 20,
  color: COLORS.ink,
  margin: 0,
  letterSpacing: '-0.01em',
};

const SECTION_SUBTITLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: `${COLORS.ink}88`,
  marginTop: 2,
};

const LABEL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}88`,
};

// ─── GHI Hero Card ────────────────────────────────────────────────────────────

function GHIHeroCard({ ghi, rating }: { ghi: number; rating: GHIData['rating'] }) {
  const color = ratingColor(rating);
  const bg = ratingBg(rating);

  return (
    <section
      style={{
        ...CARD,
        background: bg,
        border: `1px solid ${color}33`,
      }}
    >
      <div
        style={{
          padding: `${SPACING.xl} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: SPACING.md,
        }}
      >
        {/* Score */}
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 88,
            fontWeight: 700,
            color,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          {ghi}
        </div>

        {/* Rating pill */}
        <span
          style={{
            display: 'inline-block',
            background: color,
            color: COLORS.white,
            borderRadius: RADIUS.pill,
            padding: '6px 22px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {rating}
        </span>

        {/* Description */}
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: `${color}cc`,
            margin: 0,
            maxWidth: 480,
            lineHeight: 1.5,
          }}
        >
          {ratingDescription(rating)}
        </p>

        {/* Label */}
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}77`,
            margin: 0,
          }}
        >
          Gate Health Index — computed from pass rate, evidence, waivers, contradictions, and progression
        </p>
      </div>
    </section>
  );
}

// ─── Sub-Index Breakdown ──────────────────────────────────────────────────────

function SubIndexBreakdown({ subIndices }: { subIndices: SubIndex[] }) {
  return (
    <section style={CARD}>
      <div style={CARD_HEADER}>
        <h2 style={SECTION_TITLE}>Sub-index breakdown</h2>
        <div style={SECTION_SUBTITLE}>5 weighted components — each scored 0-100</div>
      </div>
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: SPACING.md,
        }}
      >
        {subIndices.map((si) => (
          <div
            key={si.name}
            style={{
              background: scoreBg(si.score),
              border: `1px solid ${scoreColor(si.score)}22`,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ ...LABEL, color: `${COLORS.ink}99` }}>{si.name}</span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 32,
                fontWeight: 700,
                color: scoreColor(si.score),
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              {si.score}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                  background: `${COLORS.ink}0d`,
                  borderRadius: RADIUS.sm,
                  padding: '2px 7px',
                }}
              >
                weight: {si.weightLabel}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: scoreColor(si.score),
                  fontWeight: 600,
                }}
              >
                +{si.contribution} pts
              </span>
            </div>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}88`,
                lineHeight: 1.4,
              }}
            >
              {si.description}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Sub-Index Bar Chart ──────────────────────────────────────────────────────

const BENCHMARK = 75;

function SubIndexBarChart({ subIndices }: { subIndices: SubIndex[] }) {
  return (
    <section style={CARD}>
      <div style={CARD_HEADER}>
        <h2 style={SECTION_TITLE}>Sub-index vs. benchmark</h2>
        <div style={SECTION_SUBTITLE}>
          Horizontal bars — mint above benchmark, rust below. Portfolio benchmark: 75
        </div>
      </div>
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {subIndices.map((si) => {
          const aboveBenchmark = si.score >= BENCHMARK;
          const barColor = aboveBenchmark ? COLORS.mintInk : COLORS.coralInk;
          const barBg = aboveBenchmark ? COLORS.mintSoft : COLORS.coralSoft;
          const barWidthPct = Math.min(si.score, 100);
          const benchmarkPct = BENCHMARK;

          return (
            <div
              key={si.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 52px',
                alignItems: 'center',
                gap: SPACING.md,
              }}
            >
              {/* Label */}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.ink,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {si.name}
              </span>

              {/* Bar track */}
              <div
                style={{
                  position: 'relative',
                  height: 28,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                }}
              >
                {/* Filled bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${barWidthPct}%`,
                    background: barBg,
                    borderRadius: RADIUS.sm,
                    transition: 'width 0s',
                  }}
                />
                {/* Benchmark line */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${benchmarkPct}%`,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: `${COLORS.ink}40`,
                    zIndex: 1,
                  }}
                />
                {/* Score label inside bar */}
                <span
                  style={{
                    position: 'absolute',
                    left: `min(${Math.max(barWidthPct - 4, 4)}%, 90%)`,
                    top: '50%',
                    transform: 'translate(-100%, -50%)',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: barColor,
                    zIndex: 2,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    padding: '0 4px',
                  }}
                >
                  {si.score}
                </span>
              </div>

              {/* Weight */}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                {si.weightLabel}
              </span>
            </div>
          );
        })}

        {/* Benchmark label */}
        <div
          style={{
            marginTop: SPACING.xs,
            paddingLeft: '160px',
            paddingRight: '52px',
            paddingBottom: 0,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}66`,
              display: 'inline-block',
              marginLeft: `calc(${BENCHMARK}% - 8px)`,
            }}
          >
            Portfolio benchmark: {BENCHMARK}
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── GHI History Simulation ───────────────────────────────────────────────────

function GHIHistory({ ghi }: { ghi: number }) {
  const history = [
    { label: '3 months ago', value: Math.max(0, ghi - 8) },
    { label: '2 months ago', value: Math.max(0, ghi - 4) },
    { label: '1 month ago',  value: Math.max(0, ghi - 1) },
    { label: 'Today',        value: ghi },
  ] as const;

  const trend = ghi - Math.max(0, ghi - 8);
  const trendLabel = trend > 0 ? `+${trend} over 3 months` : trend < 0 ? `${trend} over 3 months` : 'No change';
  const trendColor = trend > 0 ? MINT_INK : trend < 0 ? RUST_INK : `${COLORS.ink}88`;

  const HEADER_CELL: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: `${COLORS.ink}88`,
    textAlign: 'left',
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `2px solid ${COLORS.ink}14`,
  };

  const BODY_CELL: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    color: COLORS.ink,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.ink}0a`,
    verticalAlign: 'middle',
  };

  return (
    <section style={CARD}>
      <div style={CARD_HEADER}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: SPACING.md,
          }}
        >
          <div>
            <h2 style={SECTION_TITLE}>GHI history</h2>
            <div style={SECTION_SUBTITLE}>Simulated 3-month trajectory (derived from current GHI)</div>
          </div>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 13,
              fontWeight: 700,
              color: trendColor,
              flexShrink: 0,
            }}
          >
            {trendLabel}
          </span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Period</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>GHI Score</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Change</th>
              <th style={HEADER_CELL}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, idx) => {
              const prevValue = idx > 0 ? history[idx - 1].value : row.value;
              const change = row.value - prevValue;
              const isToday = row.label === 'Today';
              const changeColor = change > 0 ? MINT_INK : change < 0 ? RUST_INK : `${COLORS.ink}88`;
              const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';

              return (
                <tr key={row.label}>
                  <td style={{ ...BODY_CELL, fontWeight: isToday ? 700 : 400 }}>
                    {row.label}
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'right',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: isToday ? 18 : 14,
                      fontWeight: 700,
                      color: scoreColor(row.value),
                    }}
                  >
                    {row.value}
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'right',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                      fontWeight: 600,
                      color: idx === 0 ? `${COLORS.ink}44` : changeColor,
                    }}
                  >
                    {idx === 0 ? '—' : change > 0 ? `+${change}` : `${change}`}
                  </td>
                  <td style={{ ...BODY_CELL, fontSize: 18, color: idx === 0 ? `${COLORS.ink}44` : changeColor }}>
                    {idx === 0 ? '—' : arrow}
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

// ─── Action Items ─────────────────────────────────────────────────────────────

function ActionItems({ subIndices }: { subIndices: SubIndex[] }) {
  const weakest = subIndices.reduce(
    (min, si) => (si.score < min.score ? si : min),
    subIndices[0],
  );

  if (!weakest) return null;

  const color = scoreColor(weakest.score);
  const bg = scoreBg(weakest.score);

  return (
    <section
      style={{
        ...CARD,
        background: bg,
        border: `1px solid ${color}22`,
      }}
    >
      <div
        style={{
          ...CARD_HEADER,
          background: 'transparent',
          borderBottom: `1px solid ${color}22`,
        }}
      >
        <h2 style={{ ...SECTION_TITLE, color }}>Action items</h2>
        <div style={{ ...SECTION_SUBTITLE, color: `${color}cc` }}>
          Focus on the lowest-scoring GHI component to drive the most improvement
        </div>
      </div>

      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {/* Weakest component highlight */}
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${color}33`,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 700,
                color,
              }}
            >
              Weakest GHI component: {weakest.name}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 20,
                fontWeight: 700,
                color,
              }}
            >
              {weakest.score}/100
            </span>
          </div>

          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}cc`,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {actionRecommendation(weakest.name, weakest.score)}
          </p>
        </div>

        {/* All sub-index quick list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginTop: SPACING.xs,
          }}
        >
          {[...subIndices]
            .sort((a, b) => a.score - b.score)
            .map((si) => (
              <div
                key={si.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: SPACING.md,
                  padding: `${SPACING.xs} ${SPACING.md}`,
                  background: COLORS.white,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${COLORS.ink}0a`,
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: COLORS.ink,
                  }}
                >
                  {si.name}
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      color: `${COLORS.ink}66`,
                      marginLeft: 8,
                    }}
                  >
                    ({si.weightLabel} weight)
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: scoreColor(si.score),
                  }}
                >
                  {si.score}
                </span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateHealthIndexPage() {
  const { ghi, rating, subIndices, totalInstances } = computeGHI();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open gate gap analysis"
          primaryActionHref="/admin/reasoning/gate-gap"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Gate Health Index"
        subtitle="Portfolio-wide gate performance composite — GHI score, sub-indices, and trend"
      >
        {/* Context strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            padding: `${SPACING.sm} ${SPACING.md}`,
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.md,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {totalInstances} instance{totalInstances === 1 ? '' : 's'} in portfolio
          </span>
          <span style={{ color: `${COLORS.ink}22` }}>·</span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            GHI = 0.30 × Pass Rate + 0.25 × Evidence + 0.20 × No-Waiver + 0.15 × No-Contradiction + 0.10 × Progression
          </span>
        </div>

        <GHIHeroCard ghi={ghi} rating={rating} />
        <SubIndexBreakdown subIndices={subIndices} />
        <SubIndexBarChart subIndices={subIndices} />
        <GHIHistory ghi={ghi} />
        <ActionItems subIndices={subIndices} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
