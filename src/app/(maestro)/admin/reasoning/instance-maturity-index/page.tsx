// /admin/reasoning/instance-maturity-index — Instance Maturity Index (IMI).
//
// Pure server component. Computes a composite IMI score (0-100) for each
// instance across four equally-weighted dimensions (25 pts each):
//   1. Governance      — waiver count penalty
//   2. Gate compliance — gates met / total
//   3. Evidence maturity — stage depth index
//   4. Contradiction-free — active contradiction penalty
//
// Sections:
//   1. IMI leaderboard (all instances sorted desc, with dimension bars)
//   2. Dimension breakdown (4 cards: avg, best, action for weakest)
//   3. Maturity distribution (stacked bar: Advanced/Developing/Foundational/Nascent)
//   4. Pathway to Advanced (non-Advanced instances + what pushes them to ≥80)

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance Maturity Index · AbarVa Admin',
};

// ── Color constants ────────────────────────────────────────────────────────────

// Deep mint for Advanced (IMI ≥ 80)
const DEEP_MINT_BG = '#D6EED6';
const DEEP_MINT_FG = '#0D3B1A';

// Standard mint for Developing (60-79)
const MINT_BG = COLORS.mintSoft;
const MINT_FG = COLORS.mintInk;

// Amber for Foundational (40-59)
const AMBER_BG = COLORS.amberSoft;
const AMBER_FG = COLORS.amberInk;

// Rust for Nascent (< 40)
const RUST_BG = '#FFF0E6';
const RUST_FG = '#8B3A0F';

// ── IMI computation ────────────────────────────────────────────────────────────

const governanceScore = (waivers: number): number =>
  waivers === 0 ? 25 : waivers === 1 ? 18 : waivers === 2 ? 10 : 0;

const gateScore = (met: number, total: number): number =>
  Math.round((met / Math.max(total, 1)) * 25);

const evidenceScore = (stageIdx: number): number =>
  stageIdx >= 3 ? 25 : stageIdx === 2 ? 18 : stageIdx === 1 ? 10 : 5;

const contradictionScore = (c: number): number =>
  c === 0 ? 25 : c === 1 ? 15 : c === 2 ? 5 : 0;

// ── Maturity level ─────────────────────────────────────────────────────────────

type MaturityLevel = 'Advanced' | 'Developing' | 'Foundational' | 'Nascent';

const maturityLevel = (imi: number): MaturityLevel =>
  imi >= 80 ? 'Advanced' : imi >= 60 ? 'Developing' : imi >= 40 ? 'Foundational' : 'Nascent';

const MATURITY_PALETTE: Record<MaturityLevel, { bg: string; fg: string }> = {
  Advanced:    { bg: DEEP_MINT_BG, fg: DEEP_MINT_FG },
  Developing:  { bg: MINT_BG,      fg: MINT_FG },
  Foundational:{ bg: AMBER_BG,     fg: AMBER_FG },
  Nascent:     { bg: RUST_BG,      fg: RUST_FG },
};

// ── Data model ─────────────────────────────────────────────────────────────────

interface ImiDimensions {
  governance: number;
  gateCompliance: number;
  evidenceMaturity: number;
  contradictionFree: number;
}

interface ImiRow {
  instanceId: string;
  instanceName: string;
  type: 'source' | 'program';
  waivers: number;
  gatesMet: number;
  gatesTotal: number;
  stageIdx: number;
  activeContradictions: number;
  dimensions: ImiDimensions;
  imi: number;
  level: MaturityLevel;
}

// ── Build rows ─────────────────────────────────────────────────────────────────

function buildImiRows(): ImiRow[] {
  const healthRows = buildHealthBoardRows();
  const waivers = getWaivers();
  const patterns = getAllLifecyclePatterns();

  // Build per-instance waiver count map
  const waiverCountMap = new Map<string, number>();
  for (const w of waivers) {
    waiverCountMap.set(w.instanceId, (waiverCountMap.get(w.instanceId) ?? 0) + 1);
  }

  return healthRows.map((row) => {
    const waiverCount = waiverCountMap.get(row.id) ?? 0;

    // Stage index: find the current stage position in the pattern's stages array
    const stageLabel = row.stageLabel ?? row.phaseLabel ?? '';
    const pattern = patterns.find((p) =>
      row.type === 'source'
        ? p.patternId.startsWith('PAT-SRC')
        : p.patternId.startsWith('PAT-PRG'),
    );
    const patternToUse = pattern ?? patterns[0];
    const stageIdx = patternToUse
      ? Math.max(
          0,
          patternToUse.stages.findIndex(
            (s) =>
              s.label.toLowerCase() === stageLabel.toLowerCase() ||
              s.id.toLowerCase() === stageLabel.toLowerCase(),
          ),
        )
      : 0;

    const gov = governanceScore(waiverCount);
    const gate = gateScore(row.gatesMet, row.gatesTotal);
    const evid = evidenceScore(stageIdx);
    const contra = contradictionScore(row.activeContradictions);
    const imi = gov + gate + evid + contra;

    return {
      instanceId: row.id,
      instanceName: row.label,
      type: row.type,
      waivers: waiverCount,
      gatesMet: row.gatesMet,
      gatesTotal: row.gatesTotal,
      stageIdx,
      activeContradictions: row.activeContradictions,
      dimensions: {
        governance: gov,
        gateCompliance: gate,
        evidenceMaturity: evid,
        contradictionFree: contra,
      },
      imi,
      level: maturityLevel(imi),
    };
  });
}

// ── Style constants ────────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
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

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function MaturityChip({ level }: { level: MaturityLevel }) {
  const p = MATURITY_PALETTE[level];
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
      }}
    >
      {level}
    </span>
  );
}

function DimBar({ score, max = 25 }: { score: number; max?: number }) {
  const pct = max === 0 ? 0 : Math.round((score / max) * 100);
  const filled =
    pct >= 80 ? DEEP_MINT_FG : pct >= 60 ? MINT_FG : pct >= 40 ? AMBER_FG : RUST_FG;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: `${COLORS.ink}12`,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: filled,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}88`,
          whiteSpace: 'nowrap',
          minWidth: 32,
        }}
      >
        {score}/{max}
      </span>
    </div>
  );
}

// ── Section 1: IMI Leaderboard ─────────────────────────────────────────────────

function LeaderboardTable({ rows }: { rows: ImiRow[] }) {
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
            IMI Leaderboard
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            All instances sorted by composite IMI score (descending) — dimension bars show 0–25 contribution
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, width: 44, textAlign: 'center' as const }}>#</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' as const, width: 72 }}>IMI</th>
              <th style={{ ...HEADER_CELL, width: 110 }}>Level</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Governance</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Gate Compliance</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Evidence</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Contradiction-Free</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const p = MATURITY_PALETTE[row.level];
              return (
                <tr
                  key={row.instanceId}
                  style={{ background: idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03` }}
                >
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'center' as const,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: `${COLORS.ink}55`,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={BODY_CELL}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: 14,
                        fontWeight: 600,
                        color: COLORS.ink,
                        lineHeight: 1.3,
                      }}
                    >
                      {row.instanceName}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}55`,
                        marginTop: 1,
                      }}
                    >
                      {row.instanceId}
                    </div>
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'center' as const,
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 22,
                      fontWeight: 700,
                      color: p.fg,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {row.imi}
                  </td>
                  <td style={BODY_CELL}>
                    <MaturityChip level={row.level} />
                  </td>
                  <td style={BODY_CELL}>
                    <DimBar score={row.dimensions.governance} />
                  </td>
                  <td style={BODY_CELL}>
                    <DimBar score={row.dimensions.gateCompliance} />
                  </td>
                  <td style={BODY_CELL}>
                    <DimBar score={row.dimensions.evidenceMaturity} />
                  </td>
                  <td style={BODY_CELL}>
                    <DimBar score={row.dimensions.contradictionFree} />
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

// ── Section 2: Dimension Breakdown ────────────────────────────────────────────

type DimKey = keyof ImiDimensions;

const DIMENSION_META: Record<DimKey, { label: string; action: string }> = {
  governance: {
    label: 'Governance',
    action: 'Clear active gate waivers or obtain formal waiver sign-off to improve governance score',
  },
  gateCompliance: {
    label: 'Gate Compliance',
    action: 'Address unmet gate criteria — assign owners and provide required evidence or approvals',
  },
  evidenceMaturity: {
    label: 'Evidence Maturity',
    action: 'Advance the instance through lifecycle stages; deeper stages signal richer evidence maturity',
  },
  contradictionFree: {
    label: 'Contradiction-Free',
    action: 'Resolve active contradictions — investigate conflicting evidence and close open flags',
  },
};

function DimensionCard({ dim, rows }: { dim: DimKey; rows: ImiRow[] }) {
  if (rows.length === 0) return null;

  const scores = rows.map((r) => r.dimensions[dim]);
  const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  const best = rows.reduce((a, b) => (a.dimensions[dim] >= b.dimensions[dim] ? a : b));
  const worst = rows.reduce((a, b) => (a.dimensions[dim] <= b.dimensions[dim] ? a : b));
  const { label, action } = DIMENSION_META[dim];
  const avgPct = Math.round((avg / 25) * 100);
  const barColor = avgPct >= 80 ? DEEP_MINT_FG : avgPct >= 60 ? MINT_FG : avgPct >= 40 ? AMBER_FG : RUST_FG;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACING.sm }}>
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 17,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </h3>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}66` }}>
          weight: 25 pts
        </span>
      </div>

      {/* Portfolio avg bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}88`,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              fontWeight: 600,
            }}
          >
            Portfolio avg
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: barColor,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {avg}
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}66` }}>
              /25
            </span>
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: `${COLORS.ink}12`,
            borderRadius: RADIUS.pill,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${avgPct}%`,
              height: '100%',
              background: barColor,
              borderRadius: RADIUS.pill,
            }}
          />
        </div>
      </div>

      {/* Best */}
      <div
        style={{
          background: DEEP_MINT_BG,
          borderRadius: RADIUS.md,
          padding: `${SPACING.xs} ${SPACING.sm}`,
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            fontWeight: 700,
            color: DEEP_MINT_FG,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          Best
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: DEEP_MINT_FG,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {best.instanceName}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: DEEP_MINT_FG,
            fontWeight: 700,
            flexShrink: 0,
            marginLeft: 'auto',
          }}
        >
          {best.dimensions[dim]}/25
        </span>
      </div>

      {/* Weakest + action */}
      <div
        style={{
          background: AMBER_BG,
          borderRadius: RADIUS.md,
          padding: `${SPACING.xs} ${SPACING.sm}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 700,
              color: AMBER_FG,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              flexShrink: 0,
            }}
          >
            Weakest
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: AMBER_FG,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {worst.instanceName}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: AMBER_FG,
              fontWeight: 700,
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            {worst.dimensions[dim]}/25
          </span>
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: AMBER_FG,
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 700 }}>Action:</span> {action}
        </div>
      </div>
    </div>
  );
}

function DimensionBreakdown({ rows }: { rows: ImiRow[] }) {
  const dims: DimKey[] = ['governance', 'gateCompliance', 'evidenceMaturity', 'contradictionFree'];
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
        Dimension Breakdown
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: SPACING.md,
        }}
      >
        {dims.map((dim) => (
          <div key={dim}>
            <DimensionCard dim={dim} rows={rows} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 3: Maturity Distribution ─────────────────────────────────────────

function MaturityDistribution({ rows }: { rows: ImiRow[] }) {
  const total = rows.length;
  if (total === 0) return null;

  const counts: Record<MaturityLevel, number> = {
    Advanced: 0,
    Developing: 0,
    Foundational: 0,
    Nascent: 0,
  };
  for (const row of rows) counts[row.level]++;

  const segments: { level: MaturityLevel; count: number }[] = [
    { level: 'Advanced', count: counts.Advanced },
    { level: 'Developing', count: counts.Developing },
    { level: 'Foundational', count: counts.Foundational },
    { level: 'Nascent', count: counts.Nascent },
  ];

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACING.md }}>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Maturity Distribution
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {total} instance{total === 1 ? '' : 's'}
        </span>
      </div>

      {/* Stacked bar */}
      <div
        style={{
          height: 28,
          display: 'flex',
          borderRadius: RADIUS.md,
          overflow: 'hidden',
          border: `1px solid ${COLORS.ink}12`,
        }}
      >
        {segments.map(({ level, count }) => {
          if (count === 0) return null;
          const pct = (count / total) * 100;
          const p = MATURITY_PALETTE[level];
          return (
            <div
              key={level}
              title={`${level}: ${count} (${pct.toFixed(0)}%)`}
              style={{
                width: `${pct}%`,
                background: p.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {pct > 8 && (
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    fontWeight: 700,
                    color: p.fg,
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.md }}>
        {segments.map(({ level, count }) => {
          const p = MATURITY_PALETTE[level];
          const pct = ((count / total) * 100).toFixed(0);
          return (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: RADIUS.sm,
                  background: p.bg,
                  border: `1px solid ${p.fg}44`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: p.fg,
                  fontWeight: 600,
                }}
              >
                {level}
              </span>
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}66` }}>
                {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Section 4: Pathway to Advanced ────────────────────────────────────────────

interface PathwayRow {
  instanceId: string;
  instanceName: string;
  imi: number;
  level: MaturityLevel;
  gapToAdvanced: number;
  // What each dimension could contribute if maximised
  govGain: number;
  contradictionGain: number;
  gateGain: number;
  evidenceGain: number;
}

function buildPathwayRows(rows: ImiRow[]): PathwayRow[] {
  return rows
    .filter((r) => r.level !== 'Advanced')
    .map((row) => {
      const gapToAdvanced = Math.max(0, 80 - row.imi);
      // Max possible gain per dimension
      const govGain = 25 - row.dimensions.governance;
      const contradictionGain = 25 - row.dimensions.contradictionFree;
      const gateGain = 25 - row.dimensions.gateCompliance;
      const evidenceGain = 25 - row.dimensions.evidenceMaturity;

      return {
        instanceId: row.instanceId,
        instanceName: row.instanceName,
        imi: row.imi,
        level: row.level,
        gapToAdvanced,
        govGain,
        contradictionGain,
        gateGain,
        evidenceGain,
      };
    });
}

function PathwayToAdvanced({ rows }: { rows: ImiRow[] }) {
  const pathwayRows = buildPathwayRows(rows);
  if (pathwayRows.length === 0) {
    return (
      <section
        style={{
          background: DEEP_MINT_BG,
          border: `1px solid ${DEEP_MINT_FG}22`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: DEEP_MINT_FG,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Pathway to Advanced
        </h2>
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: DEEP_MINT_FG }}>
          All instances have reached Advanced maturity (IMI ≥ 80).
        </div>
      </section>
    );
  }

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
        Pathway to Advanced
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {pathwayRows.map((row) => {
          const p = MATURITY_PALETTE[row.level];
          // Build the action hint
          const actions: string[] = [];
          if (row.govGain > 0) actions.push(`clear waivers (+${row.govGain} pts governance)`);
          if (row.contradictionGain > 0) actions.push(`resolve contradictions (+${row.contradictionGain} pts)`);
          if (row.gateGain > 0) actions.push(`meet gates (+${row.gateGain} pts compliance)`);
          if (row.evidenceGain > 0) actions.push(`advance stage (+${row.evidenceGain} pts evidence)`);

          return (
            <div
              key={row.instanceId}
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.ink}14`,
                borderRadius: RADIUS.lg,
                padding: `${SPACING.md} ${SPACING.lg}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.md, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 15,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {row.instanceName}
                </span>
                <MaturityChip level={row.level} />
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    color: p.fg,
                    fontWeight: 700,
                  }}
                >
                  IMI {row.imi}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}88`,
                  }}
                >
                  Needs <strong>+{row.gapToAdvanced} pts</strong> to reach Advanced
                </span>
              </div>
              {actions.length > 0 && (
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: `${COLORS.ink}99`,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontWeight: 700, color: COLORS.ink }}>Path:</span>{' '}
                  {actions.join('; ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InstanceMaturityIndexPage() {
  const allRows = buildImiRows();
  const sorted = [...allRows].sort((a, b) => b.imi - a.imi);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Governance"
        title="Instance Maturity Index"
        subtitle="Composite maturity score per instance — governance, evidence, and lifecycle progression"
      >
        <LeaderboardTable rows={sorted} />
        <DimensionBreakdown rows={sorted} />
        <MaturityDistribution rows={sorted} />
        <PathwayToAdvanced rows={sorted} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
