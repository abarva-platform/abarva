// /admin/reasoning/pattern-health-correlation — Correlation between lifecycle
// pattern choice and health outcomes.
//
// Pure server component, force-dynamic.
//
// Sections:
//   1. Pattern leaderboard — ranked by avg health score descending
//   2. Metric breakdown table — all patterns × 5 metrics, quartile coloring
//   3. Correlation insight — Pearson-lite correlation of each metric vs health
//   4. Sample size note

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern-Health Correlation · AbarVa Admin',
};

// ─── Score helpers ────────────────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
    (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
    10,
  );
}

function gatePassRate(row: InstanceHealthRow): number {
  return Math.round((row.gatesMet / Math.max(row.gatesTotal, 1)) * 100);
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface PatternMetrics {
  patternId: string;
  patternTitle: string;
  instanceCount: number;
  avgHealth: number;
  avgGatePassRate: number;
  avgContradictions: number;
  avgWaivers: number;
  avgStagesCompleted: number;
}

// ─── Build data ───────────────────────────────────────────────────────────────

function buildPatternMetrics(): PatternMetrics[] {
  const allPatterns = getAllLifecyclePatterns();
  const patternMeta = new Map<string, string>();
  for (const p of allPatterns) {
    patternMeta.set(p.patternId, p.title);
  }

  // Build id → patternId lookup; fall back to round-robin
  const idToPattern = new Map<string, string>();
  const allInstances = [...SOURCE_EVENT_INSTANCES, ...APEX_RETAIL_PROGRAM_INSTANCES];
  const patternIds = allPatterns.map((p) => p.patternId);

  for (let idx = 0; idx < allInstances.length; idx++) {
    const inst = allInstances[idx];
    const pid = (inst as { patternId?: string }).patternId
      ?? patternIds[idx % Math.max(patternIds.length, 1)];
    idToPattern.set(inst.id, pid);
  }

  // Waiver count map
  const allWaivers = getWaivers();
  const waiverCountMap = new Map<string, number>();
  for (const w of allWaivers) {
    waiverCountMap.set(w.instanceId, (waiverCountMap.get(w.instanceId) ?? 0) + 1);
  }

  const rows = buildHealthBoardRows();

  // Accumulate per-pattern
  interface Acc {
    health: number[];
    gatePassRate: number[];
    contradictions: number[];
    waivers: number[];
    stagesCompleted: number[];
  }
  const grouped = new Map<string, Acc>();

  for (const row of rows) {
    const pid = idToPattern.get(row.id);
    if (!pid) continue;
    const acc = grouped.get(pid) ?? {
      health: [],
      gatePassRate: [],
      contradictions: [],
      waivers: [],
      stagesCompleted: [],
    };
    acc.health.push(computeScore(row));
    acc.gatePassRate.push(gatePassRate(row));
    acc.contradictions.push(row.activeContradictions);
    acc.waivers.push(waiverCountMap.get(row.id) ?? 0);
    // Use gatesMet as a proxy for stages completed
    acc.stagesCompleted.push(row.gatesMet);
    grouped.set(pid, acc);
  }

  function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
  }

  const result: PatternMetrics[] = [];
  for (const [pid, acc] of grouped.entries()) {
    if (acc.health.length === 0) continue;
    result.push({
      patternId: pid,
      patternTitle: patternMeta.get(pid) ?? pid,
      instanceCount: acc.health.length,
      avgHealth: avg(acc.health),
      avgGatePassRate: avg(acc.gatePassRate),
      avgContradictions: avg(acc.contradictions),
      avgWaivers: avg(acc.waivers),
      avgStagesCompleted: avg(acc.stagesCompleted),
    });
  }

  return result.sort((a, b) => b.avgHealth - a.avgHealth);
}

// ─── Quartile coloring ────────────────────────────────────────────────────────

type QuartileBand = 'top' | 'bottom' | 'mid';

/**
 * For health, gatePassRate, stagesCompleted: higher = better.
 * For contradictions, waivers: lower = better.
 */
function quartileBand(
  value: number,
  allValues: number[],
  higherIsBetter: boolean,
): QuartileBand {
  const sorted = [...allValues].sort((a, b) => a - b);
  const n = sorted.length;
  if (n < 2) return 'mid';
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  if (higherIsBetter) {
    if (value >= q3) return 'top';
    if (value <= q1) return 'bottom';
  } else {
    if (value <= q1) return 'top';
    if (value >= q3) return 'bottom';
  }
  return 'mid';
}

function quartileStyle(band: QuartileBand): CSSProperties {
  if (band === 'top') {
    return { background: SHELL.MINT_BG, color: SHELL.MINT_TEXT, fontWeight: 700 };
  }
  if (band === 'bottom') {
    return { background: SHELL.RUST_BG, color: SHELL.RUST_TEXT, fontWeight: 700 };
  }
  return {};
}

// ─── Pearson-lite correlation ─────────────────────────────────────────────────

function pearsonLite(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * (ys[i] ?? 0), 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const sumY2 = ys.reduce((a, y) => a + y * y, 0);
  const denom = Math.sqrt(
    Math.max((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2), 0),
  );
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

interface CorrelationResult {
  metricLabel: string;
  r: number;
}

function computeCorrelations(patterns: PatternMetrics[]): CorrelationResult[] {
  const health = patterns.map((p) => p.avgHealth);
  const metrics: Array<{ label: string; values: number[] }> = [
    { label: 'Gate Pass Rate', values: patterns.map((p) => p.avgGatePassRate) },
    { label: 'Contradictions', values: patterns.map((p) => p.avgContradictions) },
    { label: 'Waivers', values: patterns.map((p) => p.avgWaivers) },
    { label: 'Stages Completed', values: patterns.map((p) => p.avgStagesCompleted) },
  ];
  return metrics.map((m) => ({
    metricLabel: m.label,
    r: pearsonLite(m.values, health),
  }));
}

// ─── Shared styles ────────────────────────────────────────────────────────────

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
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}08`,
  verticalAlign: 'middle',
};

const CARD_WRAP: CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
};

const SECTION_HEADER: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 17,
  fontWeight: 700,
  color: COLORS.ink,
  letterSpacing: '-0.01em',
  marginBottom: SPACING.sm,
};

// ─── Section 1: Pattern leaderboard ──────────────────────────────────────────

function HealthBadge({ score }: { score: number }) {
  const bg = score >= 70 ? SHELL.MINT_BG : score >= 40 ? SHELL.PAPER_DEEP : SHELL.RUST_BG;
  const fg = score >= 70 ? SHELL.MINT_TEXT : score >= 40 ? SHELL.AMBER_DOT : SHELL.RUST_TEXT;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {score}
    </span>
  );
}

function PatternLeaderboard({ patterns }: { patterns: PatternMetrics[] }) {
  if (patterns.length === 0) {
    return (
      <div
        style={{
          ...CARD_WRAP,
          padding: SPACING.lg,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}88`,
        }}
      >
        No pattern data available.
      </div>
    );
  }

  const best = patterns[0];
  const worst = patterns[patterns.length - 1];

  const highlightCardBase: CSSProperties = {
    flex: '1 1 260px',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xs,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {/* Best / Worst highlight cards */}
      <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
        {/* Best pattern */}
        <div
          style={{
            ...highlightCardBase,
            background: SHELL.MINT_BG,
            border: `1px solid ${SHELL.MINT_LINE}`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: SHELL.MINT_TEXT,
            }}
          >
            Best pattern
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {best.patternTitle}
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 32,
                fontWeight: 700,
                color: SHELL.MINT_TEXT,
                lineHeight: 1,
              }}
            >
              {best.avgHealth}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: SHELL.MINT_TEXT,
              }}
            >
              avg health · {best.instanceCount} instance{best.instanceCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: SHELL.MINT_TEXT,
            }}
          >
            Gate pass: {best.avgGatePassRate}% · Contradictions: {best.avgContradictions}
          </div>
        </div>

        {/* Worst pattern */}
        {worst !== best && (
          <div
            style={{
              ...highlightCardBase,
              background: SHELL.RUST_BG,
              border: `1px solid ${COLORS.ink}18`,
            }}
          >
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: SHELL.RUST_TEXT,
              }}
            >
              Worst pattern
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.ink,
                letterSpacing: '-0.01em',
              }}
            >
              {worst.patternTitle}
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 32,
                  fontWeight: 700,
                  color: SHELL.RUST_TEXT,
                  lineHeight: 1,
                }}
              >
                {worst.avgHealth}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: SHELL.RUST_TEXT,
                }}
              >
                avg health · {worst.instanceCount} instance{worst.instanceCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: SHELL.RUST_TEXT,
              }}
            >
              Gate pass: {worst.avgGatePassRate}% · Contradictions: {worst.avgContradictions}
            </div>
          </div>
        )}
      </div>

      {/* Ranked table */}
      <div style={CARD_WRAP}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}
          >
            <thead>
              <tr>
                <th style={{ ...TH, width: 36, textAlign: 'center' }}>Rank</th>
                <th style={TH}>Pattern</th>
                <th style={{ ...TH, textAlign: 'center' as const }}>Avg Health</th>
                <th style={{ ...TH, textAlign: 'right' as const }}>Instances</th>
                <th style={{ ...TH, textAlign: 'right' as const }}>Gate Pass %</th>
                <th style={{ ...TH, textAlign: 'right' as const }}>Avg Contradictions</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p, idx) => (
                <tr
                  key={p.patternId}
                  style={{
                    background:
                      idx === 0
                        ? `${SHELL.MINT_BG}55`
                        : idx === patterns.length - 1
                          ? `${SHELL.RUST_BG}44`
                          : COLORS.white,
                  }}
                >
                  <td
                    style={{
                      ...TD,
                      textAlign: 'center',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        idx === 0
                          ? SHELL.MINT_TEXT
                          : idx === patterns.length - 1
                            ? SHELL.RUST_TEXT
                            : `${COLORS.ink}66`,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.serif,
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.ink,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {p.patternTitle}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}66`,
                        }}
                      >
                        {p.patternId}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <HealthBadge score={p.avgHealth} />
                  </td>
                  <td
                    style={{
                      ...TD,
                      textAlign: 'right',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                    }}
                  >
                    {p.instanceCount}
                  </td>
                  <td
                    style={{
                      ...TD,
                      textAlign: 'right',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                    }}
                  >
                    {p.avgGatePassRate}%
                  </td>
                  <td
                    style={{
                      ...TD,
                      textAlign: 'right',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                    }}
                  >
                    {p.avgContradictions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Metric breakdown table ───────────────────────────────────────

function MetricBreakdownTable({ patterns }: { patterns: PatternMetrics[] }) {
  if (patterns.length === 0) return null;

  const allHealth = patterns.map((p) => p.avgHealth);
  const allGatePass = patterns.map((p) => p.avgGatePassRate);
  const allContradictions = patterns.map((p) => p.avgContradictions);
  const allWaivers = patterns.map((p) => p.avgWaivers);
  const allStages = patterns.map((p) => p.avgStagesCompleted);

  const cellBase: CSSProperties = {
    ...TD,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 12,
    borderRadius: 3,
    transition: 'background 0.1s',
  };

  return (
    <div style={CARD_WRAP}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={TH}>Pattern</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Avg Health</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Gate Pass %</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Contradictions</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Waivers</th>
              <th style={{ ...TH, textAlign: 'right' as const }}>Stages Completed</th>
            </tr>
          </thead>
          <tbody>
            {patterns.map((p) => {
              const healthBand = quartileBand(p.avgHealth, allHealth, true);
              const gateBand = quartileBand(p.avgGatePassRate, allGatePass, true);
              const contraBand = quartileBand(p.avgContradictions, allContradictions, false);
              const waiverBand = quartileBand(p.avgWaivers, allWaivers, false);
              const stageBand = quartileBand(p.avgStagesCompleted, allStages, true);

              return (
                <tr key={p.patternId} style={{ background: COLORS.white }}>
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {p.patternTitle}
                    </span>
                  </td>
                  <td style={{ ...cellBase, ...quartileStyle(healthBand) }}>
                    {p.avgHealth}
                  </td>
                  <td style={{ ...cellBase, ...quartileStyle(gateBand) }}>
                    {p.avgGatePassRate}%
                  </td>
                  <td style={{ ...cellBase, ...quartileStyle(contraBand) }}>
                    {p.avgContradictions}
                  </td>
                  <td style={{ ...cellBase, ...quartileStyle(waiverBand) }}>
                    {p.avgWaivers}
                  </td>
                  <td style={{ ...cellBase, ...quartileStyle(stageBand) }}>
                    {p.avgStagesCompleted}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderTop: `1px solid ${COLORS.ink}0a`,
          display: 'flex',
          gap: SPACING.md,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          Cell shading:
        </span>
        <span
          style={{
            background: SHELL.MINT_BG,
            color: SHELL.MINT_TEXT,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            padding: '1px 8px',
            borderRadius: RADIUS.pill,
          }}
        >
          Top quartile
        </span>
        <span
          style={{
            background: SHELL.RUST_BG,
            color: SHELL.RUST_TEXT,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            padding: '1px 8px',
            borderRadius: RADIUS.pill,
          }}
        >
          Bottom quartile
        </span>
      </div>
    </div>
  );
}

// ─── Section 3: Correlation insight ──────────────────────────────────────────

function correlationColor(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.5) return SHELL.MINT_TEXT;
  if (abs >= 0.2) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

function correlationBg(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.5) return SHELL.MINT_BG;
  if (abs >= 0.2) return SHELL.PAPER_DEEP;
  return SHELL.RUST_BG;
}

function CorrelationInsights({
  correlations,
}: {
  correlations: CorrelationResult[];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {correlations.map((c) => {
        const sign = c.r >= 0 ? '+' : '';
        const rStr = `${sign}${c.r.toFixed(2)}`;
        const fg = correlationColor(c.r);
        const bg = correlationBg(c.r);
        const strengthLabel =
          Math.abs(c.r) >= 0.5 ? 'strong' : Math.abs(c.r) >= 0.2 ? 'moderate' : 'weak';

        return (
          <div
            key={c.metricLabel}
            style={{
              background: bg,
              border: `1px solid ${fg}33`,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 20,
                fontWeight: 700,
                color: fg,
                flexShrink: 0,
                minWidth: 56,
              }}
            >
              {rStr}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {c.metricLabel} correlates {rStr} with health
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}88`,
                }}
              >
                {strengthLabel.charAt(0).toUpperCase() + strengthLabel.slice(1)} correlation
                {c.r < 0 ? ' — higher values associated with lower health' : ' — higher values associated with higher health'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternHealthCorrelationPage() {
  const patterns = buildPatternMetrics();
  const correlations = computeCorrelations(patterns);
  const totalInstances = patterns.reduce((s, p) => s + p.instanceCount, 0);

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
        title="Pattern-Health Correlation"
        subtitle="Which lifecycle patterns are associated with better health, gate performance, and contradiction rates"
      >
        {/* Section 1: Pattern leaderboard */}
        <div>
          <div style={SECTION_HEADER}>Pattern leaderboard</div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}88`,
              marginBottom: SPACING.md,
            }}
          >
            Patterns ranked by average health score descending. Scores = gates (60 pts) +
            contradiction penalty (30 pts) + baseline (10 pts).
          </div>
          <PatternLeaderboard patterns={patterns} />
        </div>

        {/* Section 2: Metric breakdown table */}
        <div>
          <div style={SECTION_HEADER}>Metric breakdown</div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}88`,
              marginBottom: SPACING.md,
            }}
          >
            All patterns compared across five metrics. Top-quartile cells are mint; bottom-quartile
            are rust.
          </div>
          <MetricBreakdownTable patterns={patterns} />
        </div>

        {/* Section 3: Correlation insight */}
        <div>
          <div style={SECTION_HEADER}>Correlation insights</div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}88`,
              marginBottom: SPACING.md,
            }}
          >
            Pearson-lite correlation between each metric and average health score across pattern
            groups.
          </div>
          <CorrelationInsights correlations={correlations} />
        </div>

        {/* Section 4: Sample size note */}
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}77`,
            fontStyle: 'italic',
            padding: `${SPACING.sm} 0`,
          }}
        >
          Correlation results are demo data. With N={totalInstances} instances and{' '}
          {patterns.length} patterns, statistical significance is limited.
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
