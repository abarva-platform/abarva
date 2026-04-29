// /admin/reasoning/gate-coverage-gaps — Structural gaps in gate coverage.
//
// Pure server component, force-dynamic.
//
// Identifies:
//   1. Sparse stages: fewer than 2 gate criteria
//   2. No-hard-gate stages: 0 hard gates (cannot block advancement)
//   3. Evidence-less criteria: simulated via criterion name charcode hash
//   4. Instances with potential skipped stages: stageIndex > 2 && stageIndex % 3 === 0
//
// Sections:
//   GapSummaryStrip        — 4 headline counts
//   PatternGapTable        — per-pattern sparse/no-hard-gate counts and coverage score
//   SparseStageDetail      — flat list of all sparse stages, ascending by criteria count
//   EvidencelessTable      — criteria with no evidence mapped, with fix suggestions
//   RecommendationCard     — top 3 highest-priority structural fixes

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Coverage Gaps · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SparseStageItem {
  patternId: string;
  patternTitle: string;
  stageId: string;
  criteriaCount: number;
}

interface PatternCoverageRow {
  patternId: string;
  patternTitle: string;
  totalStages: number;
  sparseCount: number;
  noHardGateCount: number;
  coverageScore: number; // (nonSparseStages / totalStages) * 100
  instanceCount: number;
}

interface EvidencelessCriterion {
  criterionId: string;
  criterionName: string;
  stageId: string;
  patternId: string;
  patternTitle: string;
}

interface RecommendationItem {
  rank: number;
  title: string;
  detail: string;
  impact: 'critical' | 'high' | 'medium';
}

// ─── Simulation helpers ───────────────────────────────────────────────────────

/**
 * Returns true when a criterion has no evidence mapped.
 * Simulated: Math.abs(criterion.name.charCodeAt(0) * 3) % 4 === 0
 */
function isEvidenceless(criterionName: string): boolean {
  return Math.abs(criterionName.charCodeAt(0) * 3) % 4 === 0;
}

/**
 * Returns true when an instance appears to have skipped a stage.
 * Simulated: stageIndex > 2 && stageIndex % 3 === 0
 */
function hasSkippedStage(stageIndex: number): boolean {
  return stageIndex > 2 && stageIndex % 3 === 0;
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computeCoverageData(): {
  sparseStages: SparseStageItem[];
  noHardGateTotal: number;
  evidencelessCriteria: EvidencelessCriterion[];
  skippedStageInstanceCount: number;
  patternRows: PatternCoverageRow[];
  recommendations: RecommendationItem[];
} {
  const patterns = getAllLifecyclePatterns();

  // Count instances per pattern
  const instancesPerPattern = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    instancesPerPattern.set(inst.patternId, (instancesPerPattern.get(inst.patternId) ?? 0) + 1);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    instancesPerPattern.set(inst.patternId, (instancesPerPattern.get(inst.patternId) ?? 0) + 1);
  }

  const sparseStages: SparseStageItem[] = [];
  const evidencelessCriteria: EvidencelessCriterion[] = [];
  const patternRows: PatternCoverageRow[] = [];
  let noHardGateTotal = 0;

  for (const pattern of patterns) {
    let patternSparseCount = 0;
    let patternNoHardGateCount = 0;

    for (const stage of pattern.stages) {
      const stageCriteria = pattern.gateCriteria.filter((c) => c.stageId === stage.id);
      const criteriaCount = stageCriteria.length;

      // Sparse stage: fewer than 2 criteria
      if (criteriaCount < 2) {
        patternSparseCount++;
        sparseStages.push({
          patternId: pattern.patternId,
          patternTitle: pattern.title,
          stageId: stage.id,
          criteriaCount,
        });
      }

      // No-hard-gate stage: 0 hard gates
      const hardGates = stageCriteria.filter(
        (c) => (c.gateType ?? (c as { type?: string }).type) === 'hard',
      );
      if (hardGates.length === 0) {
        patternNoHardGateCount++;
        noHardGateTotal++;
      }

      // Evidence-less criteria
      for (const criterion of stageCriteria) {
        if (isEvidenceless(criterion.description)) {
          evidencelessCriteria.push({
            criterionId: criterion.id,
            criterionName: criterion.description,
            stageId: stage.id,
            patternId: pattern.patternId,
            patternTitle: pattern.title,
          });
        }
      }
    }

    const totalStages = pattern.stages.length;
    const nonSparseStages = totalStages - patternSparseCount;
    const coverageScore = totalStages > 0 ? (nonSparseStages / totalStages) * 100 : 100;

    patternRows.push({
      patternId: pattern.patternId,
      patternTitle: pattern.title,
      totalStages,
      sparseCount: patternSparseCount,
      noHardGateCount: patternNoHardGateCount,
      coverageScore,
      instanceCount: instancesPerPattern.get(pattern.patternId) ?? 0,
    });
  }

  // Sort sparse stages by criteria count ascending
  sparseStages.sort((a, b) => a.criteriaCount - b.criteriaCount);

  // Sort pattern rows: most sparse first, then alphabetical
  patternRows.sort((a, b) => b.sparseCount - a.sparseCount || a.patternTitle.localeCompare(b.patternTitle));

  // Skipped stage instance count simulation
  const allInstances = [
    ...SOURCE_EVENT_INSTANCES.map((inst, i) => ({ id: inst.id, stageIndex: i })),
    ...APEX_RETAIL_PROGRAM_INSTANCES.map((inst, i) => ({ id: inst.id, stageIndex: i })),
  ];
  const skippedStageInstanceCount = allInstances.filter((inst) =>
    hasSkippedStage(inst.stageIndex),
  ).length;

  // ── Recommendations ──────────────────────────────────────────────────────────
  const recommendations: RecommendationItem[] = [];

  // #1: no-hard-gate stage in a pattern used by >= 3 instances
  const highUsageNoHardGate = patternRows.find(
    (r) => r.noHardGateCount > 0 && r.instanceCount >= 3,
  );
  if (highUsageNoHardGate) {
    recommendations.push({
      rank: 1,
      title: `Add hard gates to "${highUsageNoHardGate.patternTitle}"`,
      detail: `${highUsageNoHardGate.noHardGateCount} stage${highUsageNoHardGate.noHardGateCount !== 1 ? 's' : ''} with no hard gates — used by ${highUsageNoHardGate.instanceCount} instance${highUsageNoHardGate.instanceCount !== 1 ? 's' : ''}. Without hard gates, advancement cannot be blocked.`,
      impact: 'critical',
    });
  }

  // #2: sparse stage in the most widely-used pattern
  const sparseHighUsage = patternRows
    .filter((r) => r.sparseCount > 0)
    .sort((a, b) => b.instanceCount - a.instanceCount)[0];
  if (sparseHighUsage) {
    recommendations.push({
      rank: recommendations.length + 1,
      title: `Expand gate criteria in "${sparseHighUsage.patternTitle}"`,
      detail: `${sparseHighUsage.sparseCount} sparse stage${sparseHighUsage.sparseCount !== 1 ? 's' : ''} with fewer than 2 criteria — used by ${sparseHighUsage.instanceCount} instance${sparseHighUsage.instanceCount !== 1 ? 's' : ''}. Thin gate coverage reduces evaluation confidence.`,
      impact: 'high',
    });
  }

  // #3: evidence-less criteria if present
  if (evidencelessCriteria.length > 0) {
    recommendations.push({
      rank: recommendations.length + 1,
      title: 'Map evidence payloads to ungated criteria',
      detail: `${evidencelessCriteria.length} criterion${evidencelessCriteria.length !== 1 ? 'a' : ''} with no evidence mapped. Without evidence, gate evaluators cannot assess these criteria.`,
      impact: 'medium',
    });
  }

  // Trim to top 3
  return {
    sparseStages,
    noHardGateTotal,
    evidencelessCriteria,
    skippedStageInstanceCount,
    patternRows,
    recommendations: recommendations.slice(0, 3),
  };
}

// ─── Shared styles ────────────────────────────────────────────────────────────

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

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── GapSummaryStrip ──────────────────────────────────────────────────────────

function GapSummaryStrip({
  sparseCount,
  noHardGateCount,
  evidencelessCount,
  skippedStageCount,
}: {
  sparseCount: number;
  noHardGateCount: number;
  evidencelessCount: number;
  skippedStageCount: number;
}) {
  const items: Array<{ label: string; value: number; color: string }> = [
    { label: 'sparse stages', value: sparseCount, color: COLORS.amberInk },
    { label: 'no-hard-gate stages', value: noHardGateCount, color: SHELL.RUST_TEXT },
    { label: 'evidence-less criteria', value: evidencelessCount, color: COLORS.amberInk },
    { label: 'potential skipped stages', value: skippedStageCount, color: COLORS.navy },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: `${SPACING.sm} ${SPACING.lg}`,
      }}
    >
      {items.map((item, i) => (
        <span
          key={item.label}
          style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
        >
          {i > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}40`,
                marginRight: 4,
              }}
            >
              ·
            </span>
          )}
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 26,
              color: item.color,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── PatternGapTable ──────────────────────────────────────────────────────────

function PatternGapTable({ rows }: { rows: PatternCoverageRow[] }) {
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
            Pattern gap breakdown
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sparse stages and no-hard-gate stages per pattern with coverage score
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} pattern{rows.length !== 1 ? 's' : ''}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Stages</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Sparse (&lt;2 criteria)</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>No hard gates</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Coverage score</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Instances</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowBg = idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03`;
              const sparseColor = row.sparseCount > 0 ? COLORS.amberInk : `${COLORS.ink}55`;
              const noHardColor = row.noHardGateCount > 0 ? SHELL.RUST_TEXT : `${COLORS.ink}55`;
              const coveragePct = `${row.coverageScore.toFixed(0)}%`;

              return (
                <tr key={row.patternId} style={{ background: rowBg }}>
                  <td style={BODY_CELL}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {row.patternTitle}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}88`,
                        marginTop: 2,
                      }}
                    >
                      {row.patternId}
                    </div>
                  </td>
                  <td style={{ ...MONO_CELL, textAlign: 'center' }}>{row.totalStages}</td>
                  <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        fontWeight: row.sparseCount > 0 ? 700 : 400,
                        color: sparseColor,
                        background: row.sparseCount > 0 ? COLORS.amberSoft : 'transparent',
                        borderRadius: RADIUS.pill,
                        padding: row.sparseCount > 0 ? '2px 10px' : undefined,
                      }}
                    >
                      {row.sparseCount > 0 ? row.sparseCount : '—'}
                    </span>
                  </td>
                  <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        fontWeight: row.noHardGateCount > 0 ? 700 : 400,
                        color: noHardColor,
                        background: row.noHardGateCount > 0 ? SHELL.RUST_BG : 'transparent',
                        borderRadius: RADIUS.pill,
                        padding: row.noHardGateCount > 0 ? '2px 10px' : undefined,
                      }}
                    >
                      {row.noHardGateCount > 0 ? row.noHardGateCount : '—'}
                    </span>
                  </td>
                  <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          row.coverageScore === 100
                            ? SHELL.MINT_TEXT
                            : row.coverageScore >= 75
                              ? COLORS.amberInk
                              : SHELL.RUST_TEXT,
                      }}
                    >
                      {coveragePct}
                    </span>
                  </td>
                  <td style={{ ...MONO_CELL, textAlign: 'center' }}>{row.instanceCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── SparseStageDetail ────────────────────────────────────────────────────────

function SparseStageDetail({ items }: { items: SparseStageItem[] }) {
  if (items.length === 0) {
    return (
      <section
        style={{
          background: SHELL.MINT_BG,
          border: `1px solid ${SHELL.MINT_LINE}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: SHELL.MINT_TEXT,
          lineHeight: 1.5,
        }}
      >
        No sparse stages — all stages have at least 2 gate criteria.
      </section>
    );
  }

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
            Sparse stage detail
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Stages with fewer than 2 criteria — sorted by criteria count ascending
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {items.length} sparse stage{items.length !== 1 ? 's' : ''}
        </span>
      </header>
      <ul
        style={{
          margin: 0,
          padding: `${SPACING.sm} ${SPACING.lg}`,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {items.map((item, idx) => (
          <li
            key={`${item.patternId}-${item.stageId}`}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: SPACING.sm,
              padding: `${SPACING.xs} 0`,
              borderBottom: idx < items.length - 1 ? `1px solid ${COLORS.ink}0d` : 'none',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: COLORS.ink,
                fontWeight: 600,
              }}
            >
              {item.patternTitle}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              →
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: COLORS.navy,
              }}
            >
              {item.stageId}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}88`,
              }}
            >
              :
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: COLORS.amberInk,
                background: COLORS.amberSoft,
                borderRadius: RADIUS.pill,
                padding: '1px 10px',
                fontWeight: 600,
              }}
            >
              {item.criteriaCount} {item.criteriaCount === 1 ? 'criterion' : 'criteria'} (needs ≥ 2)
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── EvidencelessTable ────────────────────────────────────────────────────────

function EvidencelessTable({ criteria }: { criteria: EvidencelessCriterion[] }) {
  if (criteria.length === 0) {
    return (
      <section
        style={{
          background: SHELL.MINT_BG,
          border: `1px solid ${SHELL.MINT_LINE}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: SHELL.MINT_TEXT,
          lineHeight: 1.5,
        }}
      >
        No evidence-less criteria detected — all criteria have evidence payloads mapped.
      </section>
    );
  }

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
            Evidence-less criteria
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Criteria with no evidence payload mapped — simulated via name hash
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {criteria.length} criterion{criteria.length !== 1 ? 'a' : ''}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Criterion</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Evidence status</th>
              <th style={HEADER_CELL}>Suggested action</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, idx) => {
              const rowBg = idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03`;
              return (
                <tr key={`${c.patternId}-${c.criterionId}-${idx}`} style={{ background: rowBg }}>
                  <td style={BODY_CELL}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{c.criterionName}</div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}88`,
                        marginTop: 2,
                      }}
                    >
                      {c.criterionId}
                    </div>
                  </td>
                  <td style={MONO_CELL}>{c.stageId}</td>
                  <td style={BODY_CELL}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{c.patternTitle}</div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}88`,
                        marginTop: 2,
                      }}
                    >
                      {c.patternId}
                    </div>
                  </td>
                  <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: COLORS.amberSoft,
                        color: COLORS.amberInk,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                      }}
                    >
                      No evidence mapped
                    </span>
                  </td>
                  <td style={{ ...BODY_CELL, maxWidth: 260, fontSize: 12, color: `${COLORS.ink}cc` }}>
                    Add evidence payload for <strong>{c.criterionName.slice(0, 40)}{c.criterionName.length > 40 ? '…' : ''}</strong>
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

// ─── RecommendationCard ───────────────────────────────────────────────────────

function ImpactBadge({ impact }: { impact: RecommendationItem['impact'] }) {
  const palette =
    impact === 'critical'
      ? { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT }
      : impact === 'high'
        ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
        : { bg: COLORS.skyPale, fg: COLORS.navy };

  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}
    >
      {impact}
    </span>
  );
}

function RecommendationCard({ recommendations }: { recommendations: RecommendationItem[] }) {
  if (recommendations.length === 0) return null;

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
          Top recommendations
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Highest-priority structural fixes ranked by impact
        </div>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {recommendations.map((rec, idx) => (
          <div
            key={rec.rank}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: SPACING.md,
              padding: `${SPACING.md} ${SPACING.lg}`,
              borderBottom: idx < recommendations.length - 1 ? `1px solid ${COLORS.ink}0d` : 'none',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 22,
                color: `${COLORS.ink}33`,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                minWidth: 24,
                flexShrink: 0,
              }}
            >
              {rec.rank}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: SPACING.sm,
                  flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  {rec.title}
                </span>
                <ImpactBadge impact={rec.impact} />
              </div>
              <p
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}99`,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {rec.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateCoverageGapsPage() {
  const {
    sparseStages,
    noHardGateTotal,
    evidencelessCriteria,
    skippedStageInstanceCount,
    patternRows,
    recommendations,
  } = computeCoverageData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Gate gap"
          primaryActionHref="/admin/reasoning/gate-gap"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Gates"
        title="Gate Coverage Gaps"
        subtitle="Structural gaps in gate coverage — sparse stages, unverified criteria, ungated categories"
      >
        <GapSummaryStrip
          sparseCount={sparseStages.length}
          noHardGateCount={noHardGateTotal}
          evidencelessCount={evidencelessCriteria.length}
          skippedStageCount={skippedStageInstanceCount}
        />
        <RecommendationCard recommendations={recommendations} />
        <PatternGapTable rows={patternRows} />
        <SparseStageDetail items={sparseStages} />
        <EvidencelessTable criteria={evidencelessCriteria} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
