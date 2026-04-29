// /admin/reasoning/pattern-conflict-detector — Structural conflicts between lifecycle patterns.
//
// Pure server component. For every pair of lifecycle patterns (A, B) it detects:
//   1. Stage ordering conflicts — shared stage names appear in opposite order
//   2. Duplicate criterion names — same criterion name at different stage positions
//   3. Gate count mismatch — shared stage names with very different gate counts (diff > 3)
//
// Sections:
//   ConflictSummary   — 3 KPIs: pairs analyzed · pairs with conflicts · total conflicts
//   ConflictMatrix    — N×N grid (capped 6×6): 0=mint ✓, 1-2=amber ~, 3+=rust !
//   ConflictDetailList — per conflicting pair: chips + details
//   SafeToCoApply     — pairs with zero conflicts as mint chips
//   Recommendation    — warning if any pair has ≥ 3 conflicts

import React from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern Conflict Detector · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ConflictType = 'Stage Order' | 'Duplicate Criterion' | 'Gate Mismatch';

interface PairConflict {
  patternA: LifecyclePatternSeed;
  patternB: LifecyclePatternSeed;
  stageOrderConflicts: string[];
  duplicateCriterionConflicts: string[];
  gateMismatchConflicts: string[];
  totalConflicts: number;
}

// ─── Detection logic ──────────────────────────────────────────────────────────

/** Stage ordering conflict: Pattern A has stage X before Y, Pattern B has Y before X */
function detectStageOrderConflicts(a: LifecyclePatternSeed, b: LifecyclePatternSeed): string[] {
  const conflicts: string[] = [];
  // Use stage label as the shared "name"
  const aOrder = a.stages.map((s) => s.label);
  const bOrder = b.stages.map((s) => s.label);
  const shared = aOrder.filter((n) => bOrder.includes(n));

  for (let i = 0; i < shared.length - 1; i++) {
    const aIdxCurr = aOrder.indexOf(shared[i]);
    const aIdxNext = aOrder.indexOf(shared[i + 1]);
    const bIdxCurr = bOrder.indexOf(shared[i]);
    const bIdxNext = bOrder.indexOf(shared[i + 1]);
    if ((aIdxCurr < aIdxNext) !== (bIdxCurr < bIdxNext)) {
      conflicts.push(`${shared[i]} → ${shared[i + 1]}`);
    }
  }
  return conflicts;
}

/** Duplicate criterion: same criterion description appears in different stage positions */
function detectDuplicateCriterionConflicts(
  a: LifecyclePatternSeed,
  b: LifecyclePatternSeed,
): string[] {
  const conflicts: string[] = [];

  // Build map: criterion description -> stage index (0-based position in pattern's stage list)
  const aStageIndex = new Map<string, number>();
  a.stages.forEach((stage, idx) => {
    const criteriaInStage = a.gateCriteria.filter((c) => c.stageId === stage.id);
    for (const c of criteriaInStage) {
      const key = c.description.trim().toLowerCase();
      if (!aStageIndex.has(key)) aStageIndex.set(key, idx);
    }
  });

  b.stages.forEach((stage, idx) => {
    const criteriaInStage = b.gateCriteria.filter((c) => c.stageId === stage.id);
    for (const c of criteriaInStage) {
      const key = c.description.trim().toLowerCase();
      const aIdx = aStageIndex.get(key);
      if (aIdx !== undefined && aIdx !== idx) {
        // Same criterion appears at different stage positions
        const truncated = c.description.length > 40 ? c.description.slice(0, 40) + '…' : c.description;
        const conflict = `"${truncated}" at stage ${aIdx + 1} vs ${idx + 1}`;
        if (!conflicts.includes(conflict)) {
          conflicts.push(conflict);
        }
      }
    }
  });

  return conflicts;
}

/** Gate count mismatch: shared stage label with gate count diff > 3 */
function detectGateMismatchConflicts(
  a: LifecyclePatternSeed,
  b: LifecyclePatternSeed,
): string[] {
  const conflicts: string[] = [];

  const aStageLabels = a.stages.map((s) => s.label);
  const bStageLabels = b.stages.map((s) => s.label);
  const sharedLabels = aStageLabels.filter((l) => bStageLabels.includes(l));

  for (const label of sharedLabels) {
    const aStage = a.stages.find((s) => s.label === label);
    const bStage = b.stages.find((s) => s.label === label);
    if (!aStage || !bStage) continue;

    const aGates = a.gateCriteria.filter((c) => c.stageId === aStage.id).length;
    const bGates = b.gateCriteria.filter((c) => c.stageId === bStage.id).length;

    if (Math.abs(aGates - bGates) > 3) {
      conflicts.push(`Stage "${label}": ${aGates} vs ${bGates} gates`);
    }
  }

  return conflicts;
}

function detectPairConflicts(a: LifecyclePatternSeed, b: LifecyclePatternSeed): PairConflict {
  const stageOrderConflicts = detectStageOrderConflicts(a, b);
  const duplicateCriterionConflicts = detectDuplicateCriterionConflicts(a, b);
  const gateMismatchConflicts = detectGateMismatchConflicts(a, b);
  const totalConflicts =
    stageOrderConflicts.length + duplicateCriterionConflicts.length + gateMismatchConflicts.length;

  return {
    patternA: a,
    patternB: b,
    stageOrderConflicts,
    duplicateCriterionConflicts,
    gateMismatchConflicts,
    totalConflicts,
  };
}

function computeAllPairConflicts(patterns: LifecyclePatternSeed[]): PairConflict[] {
  const pairs: PairConflict[] = [];
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      pairs.push(detectPairConflicts(patterns[i], patterns[j]));
    }
  }
  return pairs;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 700,
  color: `${COLORS.ink}99`,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `2px solid ${COLORS.ink}14`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0c`,
  verticalAlign: 'middle',
};

// ─── ConflictSummary ──────────────────────────────────────────────────────────

function KpiTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        flex: 1,
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}88`,
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
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}66`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function ConflictSummary({
  totalPairs,
  conflictingPairs,
  totalConflicts,
}: {
  totalPairs: number;
  conflictingPairs: number;
  totalConflicts: number;
}) {
  return (
    <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
      <KpiTile
        label="Pairs analyzed"
        value={totalPairs}
        sub="N×(N-1)/2 combinations"
      />
      <KpiTile
        label="Pairs with conflicts"
        value={conflictingPairs}
        sub={totalPairs > 0 ? `${((conflictingPairs / totalPairs) * 100).toFixed(0)}% of pairs` : '—'}
      />
      <KpiTile
        label="Total conflicts"
        value={totalConflicts}
        sub="stage order + criterion + gate"
      />
    </div>
  );
}

// ─── ConflictMatrix ───────────────────────────────────────────────────────────

const MATRIX_CAP = 6;

function matrixCellStyle(count: number, isDiag: boolean): React.CSSProperties {
  if (isDiag) {
    return {
      background: `${COLORS.ink}0a`,
      border: `1px solid ${COLORS.ink}18`,
    };
  }
  if (count === 0) {
    return {
      background: COLORS.mintSoft,
      border: `1px solid ${COLORS.mintInk}33`,
    };
  }
  if (count <= 2) {
    return {
      background: COLORS.amberSoft,
      border: `1px solid ${COLORS.amberInk}44`,
    };
  }
  return {
    background: COLORS.coralSoft,
    border: `1px solid ${COLORS.coralInk}44`,
  };
}

function matrixCellLabel(count: number, isDiag: boolean): string {
  if (isDiag) return '—';
  if (count === 0) return '✓';
  if (count <= 2) return '~';
  return '!';
}

function matrixCellColor(count: number, isDiag: boolean): string {
  if (isDiag) return `${COLORS.ink}55`;
  if (count === 0) return COLORS.mintInk;
  if (count <= 2) return COLORS.amberInk;
  return COLORS.coralInk;
}

function ConflictMatrix({
  patterns,
  conflictMap,
}: {
  patterns: LifecyclePatternSeed[];
  conflictMap: Map<string, number>;
}) {
  const visible = patterns.slice(0, MATRIX_CAP);
  const n = visible.length;

  if (n < 2) return null;

  const shortLabel = (p: LifecyclePatternSeed): string => {
    const t = p.title;
    return t.length > 10 ? t.slice(0, 10) : t;
  };

  const cellSize = 52;
  const labelWidth = 100;

  const getCount = (a: LifecyclePatternSeed, b: LifecyclePatternSeed): number => {
    if (a.patternId === b.patternId) return 0;
    const key =
      a.patternId < b.patternId
        ? `${a.patternId}__${b.patternId}`
        : `${b.patternId}__${a.patternId}`;
    return conflictMap.get(key) ?? 0;
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
            Conflict matrix
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            ✓ = no conflict (mint) · ~ = 1–2 conflicts (amber) · ! = 3+ conflicts (rust)
            {patterns.length > MATRIX_CAP
              ? ` · showing first ${MATRIX_CAP} of ${patterns.length} patterns`
              : ''}
          </div>
        </div>
        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            flexShrink: 0,
          }}
        >
          {[
            { label: '✓', bg: COLORS.mintSoft, fg: COLORS.mintInk },
            { label: '~', bg: COLORS.amberSoft, fg: COLORS.amberInk },
            { label: '!', bg: COLORS.coralSoft, fg: COLORS.coralInk },
          ].map((item) => (
            <span
              key={item.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                background: item.bg,
                color: item.fg,
                borderRadius: RADIUS.sm,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {item.label}
            </span>
          ))}
        </div>
      </header>

      <div style={{ overflowX: 'auto', padding: SPACING.md }}>
        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${labelWidth}px repeat(${n}, ${cellSize}px)`,
            gap: 3,
            marginBottom: 3,
          }}
        >
          <div />
          {visible.map((p) => (
            <div
              key={p.patternId}
              style={{
                width: cellSize,
                height: labelWidth,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 4,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 9,
                  color: `${COLORS.ink}88`,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  whiteSpace: 'nowrap',
                  maxHeight: labelWidth - 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {shortLabel(p)}
              </span>
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {visible.map((rowPattern) => (
          <div
            key={rowPattern.patternId}
            style={{
              display: 'grid',
              gridTemplateColumns: `${labelWidth}px repeat(${n}, ${cellSize}px)`,
              gap: 3,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: SPACING.sm,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 9,
                  color: `${COLORS.ink}88`,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: labelWidth - 8,
                }}
              >
                {shortLabel(rowPattern)}
              </span>
            </div>
            {visible.map((colPattern) => {
              const isDiag = rowPattern.patternId === colPattern.patternId;
              const count = isDiag ? 0 : getCount(rowPattern, colPattern);
              return (
                <div
                  key={colPattern.patternId}
                  title={
                    isDiag
                      ? rowPattern.title
                      : `${rowPattern.title} × ${colPattern.title}: ${count} conflict${count === 1 ? '' : 's'}`
                  }
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: RADIUS.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...matrixCellStyle(count, isDiag),
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 13,
                      fontWeight: 700,
                      color: matrixCellColor(count, isDiag),
                    }}
                  >
                    {matrixCellLabel(count, isDiag)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── ConflictTypeChip ─────────────────────────────────────────────────────────

function ConflictTypeChip({ type }: { type: ConflictType }) {
  const palette =
    type === 'Stage Order'
      ? { bg: COLORS.coralSoft, fg: COLORS.coralInk }
      : type === 'Duplicate Criterion'
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
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {type}
    </span>
  );
}

// ─── ConflictDetailList ───────────────────────────────────────────────────────

function ConflictDetailList({ pairs }: { pairs: PairConflict[] }) {
  const conflicting = pairs.filter((p) => p.totalConflicts > 0);

  if (conflicting.length === 0) {
    return (
      <div
        style={{
          background: COLORS.mintSoft,
          border: `1px solid ${COLORS.mintInk}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: COLORS.mintInk,
          fontWeight: 600,
        }}
      >
        No conflicts detected between any pattern pairs.
      </div>
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
            Conflict detail
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Conflicting pairs ranked by total conflict count
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {conflicting.length} pair{conflicting.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern A</th>
              <th style={HEADER_CELL}>Pattern B</th>
              <th style={HEADER_CELL}>Conflict types</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Count</th>
              <th style={HEADER_CELL}>Details</th>
            </tr>
          </thead>
          <tbody>
            {[...conflicting]
              .sort((a, b) => b.totalConflicts - a.totalConflicts)
              .map((pair, idx) => {
                const types: ConflictType[] = [];
                if (pair.stageOrderConflicts.length > 0) types.push('Stage Order');
                if (pair.duplicateCriterionConflicts.length > 0) types.push('Duplicate Criterion');
                if (pair.gateMismatchConflicts.length > 0) types.push('Gate Mismatch');

                const allDetails = [
                  ...pair.stageOrderConflicts.map((d) => `Stage order: ${d}`),
                  ...pair.duplicateCriterionConflicts.map((d) => `Dup criterion: ${d}`),
                  ...pair.gateMismatchConflicts.map((d) => `Gate mismatch: ${d}`),
                ];

                return (
                  <tr
                    key={`${pair.patternA.patternId}__${pair.patternB.patternId}`}
                    style={{
                      background: idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
                    }}
                  >
                    <td style={BODY_CELL}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 12,
                            fontWeight: 600,
                            color: COLORS.ink,
                          }}
                        >
                          {pair.patternA.title}
                        </span>
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.mono,
                            fontSize: 10,
                            color: `${COLORS.ink}66`,
                          }}
                        >
                          {pair.patternA.patternId}
                        </span>
                      </div>
                    </td>
                    <td style={BODY_CELL}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 12,
                            fontWeight: 600,
                            color: COLORS.ink,
                          }}
                        >
                          {pair.patternB.title}
                        </span>
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.mono,
                            fontSize: 10,
                            color: `${COLORS.ink}66`,
                          }}
                        >
                          {pair.patternB.patternId}
                        </span>
                      </div>
                    </td>
                    <td style={BODY_CELL}>
                      <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
                        {types.map((t) => (
                          <ConflictTypeChip key={t} type={t} />
                        ))}
                      </div>
                    </td>
                    <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          background:
                            pair.totalConflicts >= 3 ? COLORS.coralSoft : COLORS.amberSoft,
                          color:
                            pair.totalConflicts >= 3 ? COLORS.coralInk : COLORS.amberInk,
                          borderRadius: RADIUS.pill,
                          padding: '2px 10px',
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {pair.totalConflicts}
                      </span>
                    </td>
                    <td style={BODY_CELL}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                        }}
                      >
                        {allDetails.slice(0, 4).map((d, i) => (
                          <span
                            key={i}
                            style={{
                              fontFamily: TYPOGRAPHY.sans,
                              fontSize: 11,
                              color: `${COLORS.ink}99`,
                              lineHeight: 1.4,
                            }}
                          >
                            {d}
                          </span>
                        ))}
                        {allDetails.length > 4 && (
                          <span
                            style={{
                              fontFamily: TYPOGRAPHY.mono,
                              fontSize: 10,
                              color: `${COLORS.ink}55`,
                            }}
                          >
                            +{allDetails.length - 4} more
                          </span>
                        )}
                      </div>
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

// ─── SafeToCoApply ────────────────────────────────────────────────────────────

function SafeToCoApply({ pairs }: { pairs: PairConflict[] }) {
  const safePairs = pairs.filter((p) => p.totalConflicts === 0);

  if (safePairs.length === 0) return null;

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
          Safe to co-apply
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          These patterns can be safely applied together — no structural conflicts detected
        </div>
      </header>
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
        }}
      >
        {safePairs.map((pair) => (
          <span
            key={`${pair.patternA.patternId}__${pair.patternB.patternId}`}
            style={{
              display: 'inline-block',
              background: COLORS.mintSoft,
              color: COLORS.mintInk,
              borderRadius: RADIUS.pill,
              padding: '4px 14px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            {pair.patternA.title} + {pair.patternB.title}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Recommendation ───────────────────────────────────────────────────────────

function Recommendation({ pairs }: { pairs: PairConflict[] }) {
  const severe = pairs.filter((p) => p.totalConflicts >= 3);
  if (severe.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.coralSoft,
        border: `1px solid ${COLORS.coralInk}33`,
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
          fontSize: 13,
          fontWeight: 700,
          color: COLORS.coralInk,
          letterSpacing: '0.02em',
        }}
      >
        Conflict recommendations
      </div>
      {severe.map((pair) => (
        <div
          key={`${pair.patternA.patternId}__${pair.patternB.patternId}`}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.coralInk,
            lineHeight: 1.5,
          }}
        >
          ⚠️ <strong>{pair.patternA.title}</strong> and{' '}
          <strong>{pair.patternB.title}</strong> have significant structural conflicts (
          {pair.totalConflicts}). Applying both to the same instance may cause gate
          evaluation inconsistencies.
        </div>
      ))}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternConflictDetectorPage() {
  const allPatterns = getAllLifecyclePatterns();
  const allPairs = computeAllPairConflicts(allPatterns);

  const totalPairs = allPairs.length; // N*(N-1)/2
  const conflictingPairs = allPairs.filter((p) => p.totalConflicts > 0).length;
  const totalConflicts = allPairs.reduce((sum, p) => sum + p.totalConflicts, 0);

  // Build a lookup map: patternA.patternId + '__' + patternB.patternId → totalConflicts
  // Keys are always sorted: smaller id first
  const conflictMap = new Map<string, number>();
  for (const pair of allPairs) {
    const key =
      pair.patternA.patternId < pair.patternB.patternId
        ? `${pair.patternA.patternId}__${pair.patternB.patternId}`
        : `${pair.patternB.patternId}__${pair.patternA.patternId}`;
    conflictMap.set(key, pair.totalConflicts);
  }

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Patterns"
        title="Pattern Conflict Detector"
        subtitle="Structural conflicts between patterns — incompatible gate requirements and stage ordering conflicts"
      >
        <ConflictSummary
          totalPairs={totalPairs}
          conflictingPairs={conflictingPairs}
          totalConflicts={totalConflicts}
        />
        <ConflictMatrix patterns={allPatterns} conflictMap={conflictMap} />
        <ConflictDetailList pairs={allPairs} />
        <SafeToCoApply pairs={allPairs} />
        <Recommendation pairs={allPairs} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
