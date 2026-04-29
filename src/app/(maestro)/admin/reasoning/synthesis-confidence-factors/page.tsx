// /admin/reasoning/synthesis-confidence-factors — Factor sensitivity analysis
// for synthesis confidence scores. Answers: which input factors drive confidence
// most, and how much upside exists for each instance if each factor improved to
// its ideal value?
//
// Sections:
//   SummaryStrip       — N instances · avg confidence · top factor
//   PortfolioFactors   — table: factor name · avg value · avg sensitivity · rank
//   PerInstanceCards   — top-8 by upside: current score + factor bars + potential
//   CorrelationHeatmap — factor × confidence-bucket avg values
//   KeyInsight         — italic callout: top factor + estimated upside

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';
import type { SynthesisContext } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Synthesis Confidence Factors | AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EVIDENCE_HIGH_THRESHOLD = 5; // mirrors synthesis-confidence.ts constant

// ─── Data types ───────────────────────────────────────────────────────────────

interface FactorSnapshot {
  /** Raw count of unmet gates for this instance. */
  unmetGates: number;
  /** Total gates for this instance. */
  totalGates: number;
  /** Active contradiction count. */
  contradictions: number;
  /** Active failure mode count. */
  failureModes: number;
  /** Evidence (citation) count. */
  evidence: number;
}

interface InstanceSensitivity {
  instanceId: string;
  instanceName: string;
  instanceType: 'source-event' | 'program';
  baseScore: number;
  factors: FactorSnapshot;
  /** Sensitivity: how many pts gained if contradictions → 0 */
  contradictionSensitivity: number;
  /** Sensitivity: how many pts gained if all gates met */
  gateSensitivity: number;
  /** Sensitivity: how many pts gained if evidence reaches high threshold */
  evidenceSensitivity: number;
  /** Sensitivity: how many pts gained if failure modes → 0 */
  failureModeSensitivity: number;
  /** Max single-factor upside */
  upsidePotential: number;
}

// ─── Sensitivity computation ──────────────────────────────────────────────────

function computeSensitivity(ctx: SynthesisContext, instanceName: string): InstanceSensitivity {
  const baseResult = computeSynthesisConfidence(ctx);
  const base = baseResult.score;

  const snap: FactorSnapshot = {
    unmetGates: ctx.gatesSummary.unmet,
    totalGates: ctx.gatesSummary.total,
    contradictions: ctx.activeContradictions.length,
    failureModes: ctx.failureModes.length,
    evidence: ctx.citations.length,
  };

  // Sensitivity: contradictions → 0
  const ctxNoContradictions: SynthesisContext = {
    ...ctx,
    activeContradictions: [],
  };
  const contradictionSensitivity = Math.max(
    0,
    computeSynthesisConfidence(ctxNoContradictions).score - base,
  );

  // Sensitivity: all gates met
  const ctxAllGatesMet: SynthesisContext = {
    ...ctx,
    gatesSummary: {
      ...ctx.gatesSummary,
      met: ctx.gatesSummary.total,
      unmet: 0,
      blocked: [],
    },
  };
  const gateSensitivity = Math.max(
    0,
    computeSynthesisConfidence(ctxAllGatesMet).score - base,
  );

  // Sensitivity: evidence → high threshold (5)
  const ctxHighEvidence: SynthesisContext = {
    ...ctx,
    citations: Array.from(
      { length: Math.max(EVIDENCE_HIGH_THRESHOLD, ctx.citations.length) },
      (_, i) =>
        ctx.citations[i] ?? {
          ref: { patternId: '', patternVersion: '', section: '' },
          excerpt: '',
          relevance: '',
        },
    ),
  };
  const evidenceSensitivity = Math.max(
    0,
    computeSynthesisConfidence(ctxHighEvidence).score - base,
  );

  // Sensitivity: failure modes → 0
  const ctxNoFailureModes: SynthesisContext = {
    ...ctx,
    failureModes: [],
  };
  const failureModeSensitivity = Math.max(
    0,
    computeSynthesisConfidence(ctxNoFailureModes).score - base,
  );

  const upsidePotential = Math.max(
    contradictionSensitivity,
    gateSensitivity,
    evidenceSensitivity,
    failureModeSensitivity,
  );

  return {
    instanceId: ctx.instanceId,
    instanceName: instanceName,
    instanceType: ctx.instanceType as 'source-event' | 'program',
    baseScore: base,
    factors: snap,
    contradictionSensitivity,
    gateSensitivity,
    evidenceSensitivity,
    failureModeSensitivity,
    upsidePotential,
  };
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildAllSensitivities(): InstanceSensitivity[] {
  const results: InstanceSensitivity[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === inst.patternId,
    );
    if (!pattern) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    results.push(computeSensitivity(ctx, inst.name));
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === inst.patternId,
    );
    const ctx = buildProgramSynthesisContext(inst, pattern);
    results.push(computeSensitivity(ctx, inst.name));
  }

  return results;
}

// ─── Portfolio factor analysis ────────────────────────────────────────────────

interface FactorSummary {
  factorName: string;
  avgRawValue: number;
  avgSensitivity: number;
  rank: number;
}

function buildFactorSummaries(instances: InstanceSensitivity[]): FactorSummary[] {
  const n = Math.max(instances.length, 1);

  const avgContradictions =
    instances.reduce((s, i) => s + i.factors.contradictions, 0) / n;
  const avgUnmetGates =
    instances.reduce((s, i) => s + i.factors.unmetGates, 0) / n;
  const avgEvidence =
    instances.reduce((s, i) => s + i.factors.evidence, 0) / n;
  const avgFailureModes =
    instances.reduce((s, i) => s + i.factors.failureModes, 0) / n;

  const avgContradictionSens =
    instances.reduce((s, i) => s + i.contradictionSensitivity, 0) / n;
  const avgGateSens =
    instances.reduce((s, i) => s + i.gateSensitivity, 0) / n;
  const avgEvidenceSens =
    instances.reduce((s, i) => s + i.evidenceSensitivity, 0) / n;
  const avgFailureModeSens =
    instances.reduce((s, i) => s + i.failureModeSensitivity, 0) / n;

  const unsorted: Omit<FactorSummary, 'rank'>[] = [
    { factorName: 'Gates (unmet)', avgRawValue: avgUnmetGates, avgSensitivity: avgGateSens },
    { factorName: 'Contradictions', avgRawValue: avgContradictions, avgSensitivity: avgContradictionSens },
    { factorName: 'Evidence (citations)', avgRawValue: avgEvidence, avgSensitivity: avgEvidenceSens },
    { factorName: 'Failure modes', avgRawValue: avgFailureModes, avgSensitivity: avgFailureModeSens },
  ];

  // Rank by sensitivity descending
  const sorted = [...unsorted].sort((a, b) => b.avgSensitivity - a.avgSensitivity);
  return sorted.map((f, idx) => ({ ...f, rank: idx + 1 }));
}

// ─── Correlation heatmap data ─────────────────────────────────────────────────

interface HeatmapRow {
  factorName: string;
  /** avg factor raw value for instances with score < 40 */
  lowBucket: number;
  /** avg factor raw value for instances with 40 ≤ score < 70 */
  mediumBucket: number;
  /** avg factor raw value for instances with score ≥ 70 */
  highBucket: number;
}

function buildHeatmapRows(instances: InstanceSensitivity[]): HeatmapRow[] {
  const low = instances.filter((i) => i.baseScore < 40);
  const medium = instances.filter((i) => i.baseScore >= 40 && i.baseScore < 70);
  const high = instances.filter((i) => i.baseScore >= 70);

  function avg(arr: InstanceSensitivity[], fn: (i: InstanceSensitivity) => number) {
    if (arr.length === 0) return 0;
    return arr.reduce((s, i) => s + fn(i), 0) / arr.length;
  }

  return [
    {
      factorName: 'Unmet gates',
      lowBucket: avg(low, (i) => i.factors.unmetGates),
      mediumBucket: avg(medium, (i) => i.factors.unmetGates),
      highBucket: avg(high, (i) => i.factors.unmetGates),
    },
    {
      factorName: 'Contradictions',
      lowBucket: avg(low, (i) => i.factors.contradictions),
      mediumBucket: avg(medium, (i) => i.factors.contradictions),
      highBucket: avg(high, (i) => i.factors.contradictions),
    },
    {
      factorName: 'Evidence',
      lowBucket: avg(low, (i) => i.factors.evidence),
      mediumBucket: avg(medium, (i) => i.factors.evidence),
      highBucket: avg(high, (i) => i.factors.evidence),
    },
    {
      factorName: 'Failure modes',
      lowBucket: avg(low, (i) => i.factors.failureModes),
      mediumBucket: avg(medium, (i) => i.factors.failureModes),
      highBucket: avg(high, (i) => i.factors.failureModes),
    },
  ];
}

// ─── Score-band helpers ───────────────────────────────────────────────────────

type Band = 'mint' | 'amber' | 'rust';

function scoreBand(score: number): Band {
  if (score >= 70) return 'mint';
  if (score >= 40) return 'amber';
  return 'rust';
}

interface BandPalette {
  bar: string;
  text: string;
  barBg: string;
  pillBg: string;
  pillText: string;
}

function bandPalette(band: Band): BandPalette {
  if (band === 'mint') {
    return {
      bar: SHELL.MINT_TEXT,
      text: SHELL.MINT_TEXT,
      barBg: SHELL.MINT_BG,
      pillBg: SHELL.MINT_BG,
      pillText: SHELL.MINT_TEXT,
    };
  }
  if (band === 'amber') {
    return {
      bar: SHELL.AMBER_DOT,
      text: SHELL.AMBER_DOT,
      barBg: SHELL.PAPER_DEEP,
      pillBg: SHELL.PAPER_DEEP,
      pillText: SHELL.AMBER_DOT,
    };
  }
  return {
    bar: SHELL.RUST_TEXT,
    text: SHELL.RUST_TEXT,
    barBg: SHELL.RUST_BG,
    pillBg: SHELL.RUST_BG,
    pillText: SHELL.RUST_TEXT,
  };
}

// ─── Shared table styles ──────────────────────────────────────────────────────

const TH: CSSProperties = {
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

const TD: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const TD_MONO: CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  instances,
  topFactor,
}: {
  instances: InstanceSensitivity[];
  topFactor: string;
}) {
  const n = instances.length;
  const avg =
    n === 0
      ? 0
      : Math.round(instances.reduce((s, i) => s + i.baseScore, 0) / Math.max(n, 1));
  const avgUpside =
    n === 0
      ? 0
      : Math.round(
          instances.reduce((s, i) => s + i.upsidePotential, 0) / Math.max(n, 1),
        );
  const band = scoreBand(avg);
  const palette = bandPalette(band);

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: `${SPACING.sm} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.ink,
      }}
    >
      <span style={{ fontWeight: 600 }}>
        {n} instance{n === 1 ? '' : 's'}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span>
        Avg confidence:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontWeight: 700,
            color: palette.text,
          }}
        >
          {avg}%
        </span>
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span>
        Avg upside potential:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontWeight: 700,
            color: SHELL.MINT_TEXT,
          }}
        >
          +{avgUpside} pts
        </span>
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span>
        Top factor:{' '}
        <span style={{ fontWeight: 600 }}>{topFactor}</span>
      </span>
    </div>
  );
}

// ─── PortfolioFactorTable ──────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const bg =
    rank === 1
      ? SHELL.RUST_BG
      : rank === 2
        ? SHELL.PAPER_DEEP
        : `${COLORS.ink}08`;
  const fg =
    rank === 1
      ? SHELL.RUST_TEXT
      : rank === 2
        ? SHELL.AMBER_DOT
        : `${COLORS.ink}99`;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}
    >
      #{rank}
    </span>
  );
}

function SensBar({ pts, maxPts }: { pts: number; maxPts: number }) {
  const pct = maxPts === 0 ? 0 : Math.min(100, (pts / Math.max(maxPts, 1)) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: RADIUS.pill,
          background: `${COLORS.ink}0d`,
          overflow: 'hidden',
          minWidth: 60,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: SHELL.MINT_TEXT,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          fontWeight: 700,
          color: SHELL.MINT_TEXT,
          minWidth: 44,
          textAlign: 'right',
        }}
      >
        +{pts.toFixed(1)} pts
      </span>
    </div>
  );
}

function PortfolioFactorTable({ summaries }: { summaries: FactorSummary[] }) {
  const maxSens = Math.max(...summaries.map((s) => s.avgSensitivity), 1);

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
          Portfolio factor analysis
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Ranked by average sensitivity — how much confidence improves if each
          factor is brought to ideal across all instances.
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}
        >
          <thead>
            <tr>
              <th style={{ ...TH, width: 56 }}>Rank</th>
              <th style={TH}>Factor</th>
              <th style={{ ...TH, minWidth: 110 }}>Avg raw value</th>
              <th style={{ ...TH, minWidth: 200 }}>Avg sensitivity</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.factorName}>
                <td style={TD}>
                  <RankBadge rank={s.rank} />
                </td>
                <td
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.sans,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {s.factorName}
                </td>
                <td style={TD_MONO}>{s.avgRawValue.toFixed(1)}</td>
                <td style={TD}>
                  <SensBar pts={s.avgSensitivity} maxPts={maxSens} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Per-instance sensitivity cards ──────────────────────────────────────────

interface FactorBarProps {
  label: string;
  value: number;
  maxValue: number;
  upside: number;
  barColor: string;
}

function FactorBar({ label, value, maxValue, upside, barColor }: FactorBarProps) {
  const pct = maxValue === 0 ? 0 : Math.min(100, (value / Math.max(maxValue, 1)) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}aa`,
          }}
        >
          {label}
        </span>
        {upside > 0 && (
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              fontWeight: 700,
              color: SHELL.MINT_TEXT,
            }}
          >
            +{upside} pts
          </span>
        )}
      </div>
      <div
        style={{
          height: 5,
          borderRadius: RADIUS.pill,
          background: `${COLORS.ink}0d`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
    </div>
  );
}

function ConfidencePill({ score }: { score: number }) {
  const band = scoreBand(score);
  const p = bandPalette(band);
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.pillBg,
        color: p.pillText,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {score}%
    </span>
  );
}

function InstanceSensitivityCard({
  inst,
  rank,
}: {
  inst: InstanceSensitivity;
  rank: number;
}) {
  const band = scoreBand(inst.baseScore);
  const p = bandPalette(band);
  const maxRaw = Math.max(
    inst.factors.unmetGates,
    inst.factors.contradictions,
    inst.factors.evidence,
    inst.factors.failureModes,
    1,
  );
  const potential = inst.baseScore + inst.upsidePotential;

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          background: p.barBg + '55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}66`,
              minWidth: 20,
            }}
          >
            #{rank}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 15,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {inst.instanceName}
          </span>
          <span
            style={{
              display: 'inline-block',
              background:
                inst.instanceType === 'source-event'
                  ? SHELL.PEACH_BG
                  : SHELL.BLUE_BG,
              color:
                inst.instanceType === 'source-event'
                  ? SHELL.PEACH_TEXT
                  : SHELL.INK_MID,
              border: `1px solid ${inst.instanceType === 'source-event' ? SHELL.PEACH_LINE : SHELL.BLUE_LINE}`,
              borderRadius: RADIUS.pill,
              padding: '2px 8px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
            }}
          >
            {inst.instanceType === 'source-event' ? 'Source' : 'Program'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <ConfidencePill score={inst.baseScore} />
        </div>
      </div>

      {/* Factor bars */}
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        <FactorBar
          label={`Unmet gates (${inst.factors.unmetGates} / ${inst.factors.totalGates})`}
          value={inst.factors.unmetGates}
          maxValue={maxRaw}
          upside={inst.gateSensitivity}
          barColor={inst.gateSensitivity > 0 ? SHELL.RUST_TEXT : `${COLORS.ink}33`}
        />
        <FactorBar
          label={`Contradictions (${inst.factors.contradictions})`}
          value={inst.factors.contradictions}
          maxValue={maxRaw}
          upside={inst.contradictionSensitivity}
          barColor={inst.contradictionSensitivity > 0 ? SHELL.AMBER_DOT : `${COLORS.ink}33`}
        />
        <FactorBar
          label={`Evidence / citations (${inst.factors.evidence})`}
          value={inst.factors.evidence}
          maxValue={Math.max(maxRaw, EVIDENCE_HIGH_THRESHOLD)}
          upside={inst.evidenceSensitivity}
          barColor={SHELL.MINT_TEXT}
        />
        <FactorBar
          label={`Failure modes (${inst.factors.failureModes})`}
          value={inst.factors.failureModes}
          maxValue={maxRaw}
          upside={inst.failureModeSensitivity}
          barColor={inst.failureModeSensitivity > 0 ? SHELL.RUST_TEXT : `${COLORS.ink}33`}
        />
      </div>

      {/* Potential footer */}
      <div
        style={{
          padding: `${SPACING.xs} ${SPACING.md} ${SPACING.sm}`,
          borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: SPACING.sm,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
        }}
      >
        Max confidence potential:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontWeight: 700,
            color: SHELL.MINT_TEXT,
            fontSize: 13,
          }}
        >
          {Math.min(100, potential)}%
        </span>
      </div>
    </div>
  );
}

function PerInstanceCards({ instances }: { instances: InstanceSensitivity[] }) {
  // Top 8 by upside potential
  const top8 = [...instances]
    .sort((a, b) => b.upsidePotential - a.upsidePotential)
    .slice(0, 8);

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
          Per-instance sensitivity
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          top 8 by upside potential
        </span>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: SPACING.md,
          padding: SPACING.md,
        }}
      >
        {top8.map((inst, idx) => (
          <div key={inst.instanceId}>
            <InstanceSensitivityCard inst={inst} rank={idx + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Correlation heatmap ──────────────────────────────────────────────────────

function HeatCell({ value, maxVal }: { value: number; maxVal: number }) {
  const intensity = maxVal === 0 ? 0 : Math.min(1, value / Math.max(maxVal, 0.001));
  // Fade from transparent to rust for penalty factors; we use opacity
  const bg = `rgba(180, 60, 40, ${(intensity * 0.55).toFixed(2)})`;
  return (
    <td
      style={{
        ...TD,
        background: bg,
        textAlign: 'center' as const,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 600,
        color: intensity > 0.5 ? '#fff' : COLORS.ink,
        minWidth: 80,
      }}
    >
      {value.toFixed(1)}
    </td>
  );
}

function CorrelationHeatmap({
  rows,
  counts,
}: {
  rows: HeatmapRow[];
  counts: { low: number; medium: number; high: number };
}) {
  const maxVals = rows.map((r) =>
    Math.max(r.lowBucket, r.mediumBucket, r.highBucket, 0.001),
  );

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
          Factor correlation heatmap
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Average factor raw value per confidence bucket. Darker = higher avg
          factor value. Penalty factors (gates, contradictions, failure modes)
          should be highest in the low-confidence bucket.
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}
        >
          <thead>
            <tr>
              <th style={TH}>Factor</th>
              <th style={{ ...TH, textAlign: 'center' as const }}>
                Low &lt;40%{' '}
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}77`,
                  }}
                >
                  ({counts.low})
                </span>
              </th>
              <th style={{ ...TH, textAlign: 'center' as const }}>
                Medium 40–70%{' '}
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}77`,
                  }}
                >
                  ({counts.medium})
                </span>
              </th>
              <th style={{ ...TH, textAlign: 'center' as const }}>
                High ≥70%{' '}
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}77`,
                  }}
                >
                  ({counts.high})
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.factorName}>
                <td
                  style={{
                    ...TD,
                    fontFamily: TYPOGRAPHY.sans,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {row.factorName}
                </td>
                <HeatCell value={row.lowBucket} maxVal={maxVals[ri] ?? 1} />
                <HeatCell value={row.mediumBucket} maxVal={maxVals[ri] ?? 1} />
                <HeatCell value={row.highBucket} maxVal={maxVals[ri] ?? 1} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── KeyInsight ───────────────────────────────────────────────────────────────

function KeyInsight({
  topFactor,
  avgUpside,
}: {
  topFactor: string;
  avgUpside: number;
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.serif,
        fontSize: 15,
        fontStyle: 'italic',
        color: COLORS.ink,
        lineHeight: 1.6,
        letterSpacing: '-0.005em',
      }}
    >
      The factor with the highest sensitivity across this portfolio is{' '}
      <strong style={{ fontStyle: 'normal' }}>{topFactor}</strong>, contributing
      an estimated{' '}
      <strong style={{ fontStyle: 'normal', color: SHELL.MINT_TEXT }}>
        {avgUpside.toFixed(1)} points
      </strong>{' '}
      of average upside if brought to ideal.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SynthesisConfidenceFactorsPage() {
  const instances = buildAllSensitivities();
  const factorSummaries = buildFactorSummaries(instances);
  const heatmapRows = buildHeatmapRows(instances);

  const topFactor = factorSummaries[0]?.factorName ?? 'unknown';
  const avgTopUpside = factorSummaries[0]?.avgSensitivity ?? 0;

  const bucketCounts = {
    low: instances.filter((i) => i.baseScore < 40).length,
    medium: instances.filter((i) => i.baseScore >= 40 && i.baseScore < 70).length,
    high: instances.filter((i) => i.baseScore >= 70).length,
  };

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Confidence breakdown"
          primaryActionHref="/admin/reasoning/confidence-breakdown"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Synthesis"
        title="Synthesis Confidence Factors"
        subtitle="What drives confidence scores — factor sensitivity and contribution analysis"
      >
        <SummaryStrip instances={instances} topFactor={topFactor} />
        <PortfolioFactorTable summaries={factorSummaries} />
        <PerInstanceCards instances={instances} />
        <CorrelationHeatmap rows={heatmapRows} counts={bucketCounts} />
        <KeyInsight topFactor={topFactor} avgUpside={avgTopUpside} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
