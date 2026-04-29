// /admin/reasoning/pattern-similarity — Pairwise lifecycle pattern similarity.
//
// Pure server component. For every pair of lifecycle patterns (A, B) it
// computes a 0-100 similarity score from:
//   - Shared gate criteria IDs / union × 50
//   - Shared contradiction template IDs / union × 30
//   - Co-applies/related relationship bonus × 20
//
// Sections:
//   SummaryStrip    — N patterns · M pairs · Avg similarity
//   SimilarityTable — sorted pairs with breakdown columns + score bar
//   SimilarityMatrix — N×N heatmap grid (capped to 8 patterns)

import React from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern similarity · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type RelationshipKind = 'co-applies' | 'related' | 'derived' | 'none';

interface PatternPair {
  patternA: LifecyclePatternSeed;
  patternB: LifecyclePatternSeed;
  sharedCriteriaCount: number;
  sharedContradictionCount: number;
  criteriaScore: number;   // 0-50
  contradictionScore: number; // 0-30
  relationshipBonus: number;  // 0 or 20
  score: number;           // 0-100
  relationship: RelationshipKind;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function jaccardFraction(idsA: string[], idsB: string[]): { shared: number; fraction: number } {
  const setA = new Set(idsA);
  const setB = new Set(idsB);
  const shared = [...setA].filter((id) => setB.has(id)).length;
  const union = new Set([...idsA, ...idsB]).size;
  return { shared, fraction: union === 0 ? 0 : shared / union };
}

function detectRelationship(a: LifecyclePatternSeed, b: LifecyclePatternSeed): RelationshipKind {
  const aCoApplies = a.coAppliesWithPatternIds ?? [];
  const bCoApplies = b.coAppliesWithPatternIds ?? [];
  const aRelated = a.relatedPatternIds ?? [];
  const bRelated = b.relatedPatternIds ?? [];
  const aDerived = a.derivedFromPatternIds ?? [];
  const bDerived = b.derivedFromPatternIds ?? [];

  if (
    aCoApplies.includes(b.patternId) ||
    bCoApplies.includes(a.patternId)
  ) {
    return 'co-applies';
  }
  if (aRelated.includes(b.patternId) || bRelated.includes(a.patternId)) {
    return 'related';
  }
  if (aDerived.includes(b.patternId) || bDerived.includes(a.patternId)) {
    return 'derived';
  }
  return 'none';
}

function computePairs(patterns: LifecyclePatternSeed[]): PatternPair[] {
  const pairs: PatternPair[] = [];

  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const a = patterns[i];
      const b = patterns[j];

      const criteriaIdsA = (a.gateCriteria ?? []).map((g) => g.id);
      const criteriaIdsB = (b.gateCriteria ?? []).map((g) => g.id);
      const { shared: sharedCriteria, fraction: criteriaFraction } = jaccardFraction(
        criteriaIdsA,
        criteriaIdsB,
      );

      const contraIdsA = (a.contradictionTemplates ?? []).map((c) => c.id);
      const contraIdsB = (b.contradictionTemplates ?? []).map((c) => c.id);
      const { shared: sharedContra, fraction: contraFraction } = jaccardFraction(
        contraIdsA,
        contraIdsB,
      );

      const relationship = detectRelationship(a, b);
      const relationshipBonus = relationship === 'co-applies' || relationship === 'related' ? 20 : 0;

      const criteriaScore = criteriaFraction * 50;
      const contradictionScore = contraFraction * 30;
      const score = Math.min(100, criteriaScore + contradictionScore + relationshipBonus);

      if (score > 0) {
        pairs.push({
          patternA: a,
          patternB: b,
          sharedCriteriaCount: sharedCriteria,
          sharedContradictionCount: sharedContra,
          criteriaScore,
          contradictionScore,
          relationshipBonus,
          score,
          relationship,
        });
      }
    }
  }

  return pairs.sort((a, b) => b.score - a.score);
}

function computeScore(a: LifecyclePatternSeed, b: LifecyclePatternSeed): number {
  const criteriaIdsA = (a.gateCriteria ?? []).map((g) => g.id);
  const criteriaIdsB = (b.gateCriteria ?? []).map((g) => g.id);
  const { fraction: criteriaFraction } = jaccardFraction(criteriaIdsA, criteriaIdsB);

  const contraIdsA = (a.contradictionTemplates ?? []).map((c) => c.id);
  const contraIdsB = (b.contradictionTemplates ?? []).map((c) => c.id);
  const { fraction: contraFraction } = jaccardFraction(contraIdsA, contraIdsB);

  const relationship = detectRelationship(a, b);
  const relationshipBonus = relationship === 'co-applies' || relationship === 'related' ? 20 : 0;

  return Math.min(100, criteriaFraction * 50 + contraFraction * 30 + relationshipBonus);
}

// ─── Style constants ──────────────────────────────────────────────────────────

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

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  patternCount,
  pairCount,
  avgScore,
}: {
  patternCount: number;
  pairCount: number;
  avgScore: number;
}) {
  const stats = [
    `${patternCount} pattern${patternCount === 1 ? '' : 's'}`,
    `${pairCount} similar pair${pairCount === 1 ? '' : 's'}`,
    `Avg similarity: ${avgScore.toFixed(1)}%`,
  ];

  return (
    <div
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {stats.map((stat, i) => (
        <span
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: i === 0 ? 600 : 400,
            color: i === 0 ? COLORS.navy : `${COLORS.ink}99`,
          }}
        >
          {i > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}33`,
                marginRight: SPACING.sm,
              }}
            >
              ·
            </span>
          )}
          {stat}
        </span>
      ))}
    </div>
  );
}

// ─── RelationshipChip ─────────────────────────────────────────────────────────

function RelationshipChip({ kind }: { kind: RelationshipKind }) {
  const palette =
    kind === 'co-applies'
      ? { bg: COLORS.mintSoft, fg: COLORS.mintInk }
      : kind === 'related'
        ? { bg: COLORS.skyPale, fg: COLORS.navy }
        : kind === 'derived'
          ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
          : { bg: `${COLORS.ink}08`, fg: `${COLORS.ink}55` };

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
      {kind}
    </span>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const fill =
    pct >= 60
      ? COLORS.mintInk
      : pct >= 30
        ? COLORS.navy
        : `${COLORS.ink}55`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
      <div
        style={{
          width: 80,
          height: 6,
          borderRadius: RADIUS.pill,
          background: `${COLORS.ink}14`,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: fill,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: COLORS.ink,
          minWidth: 34,
          textAlign: 'right',
        }}
      >
        {pct.toFixed(0)}
      </span>
    </div>
  );
}

// ─── PatternLabel ─────────────────────────────────────────────────────────────

function PatternLabel({ pattern }: { pattern: LifecyclePatternSeed }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.ink,
          lineHeight: 1.3,
        }}
      >
        {pattern.title}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}66`,
        }}
      >
        {pattern.patternId}
      </span>
    </div>
  );
}

// ─── SimilarityTable ─────────────────────────────────────────────────────────

function SimilarityTable({ pairs }: { pairs: PatternPair[] }) {
  if (pairs.length === 0) {
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
        }}
      >
        No similar pattern pairs found — all pairs scored 0.
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
            Similarity pairs
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by similarity score descending — pairs with score &gt; 0 only
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {pairs.length} pair{pairs.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern A</th>
              <th style={HEADER_CELL}>Pattern B</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Shared criteria</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Shared contradictions</th>
              <th style={HEADER_CELL}>Relationship</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Similarity</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, idx) => (
              <tr
                key={`${pair.patternA.patternId}__${pair.patternB.patternId}`}
                style={{
                  background: idx % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
                }}
              >
                <td style={BODY_CELL}>
                  <PatternLabel pattern={pair.patternA} />
                </td>
                <td style={BODY_CELL}>
                  <PatternLabel pattern={pair.patternB} />
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'center' }}>
                  {pair.sharedCriteriaCount > 0 ? (
                    <span
                      style={{
                        background: COLORS.mintSoft,
                        color: COLORS.mintInk,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontWeight: 600,
                      }}
                    >
                      {pair.sharedCriteriaCount}
                    </span>
                  ) : (
                    <span style={{ color: `${COLORS.ink}33` }}>—</span>
                  )}
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'center' }}>
                  {pair.sharedContradictionCount > 0 ? (
                    <span
                      style={{
                        background: COLORS.amberSoft,
                        color: COLORS.amberInk,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontWeight: 600,
                      }}
                    >
                      {pair.sharedContradictionCount}
                    </span>
                  ) : (
                    <span style={{ color: `${COLORS.ink}33` }}>—</span>
                  )}
                </td>
                <td style={BODY_CELL}>
                  <RelationshipChip kind={pair.relationship} />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                  <ScoreBar score={pair.score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── SimilarityMatrix ─────────────────────────────────────────────────────────

const MATRIX_CAP = 8;

function heatmapColor(score: number): string {
  if (score <= 0) return COLORS.white;
  // Diagonal (self-comparison sentinel 100) → deep mint
  const t = Math.min(1, score / 100);
  // Interpolate white → mintSoft → mintInk at increasing intensity
  if (t < 0.25) {
    // Very light mint
    const a = Math.round(t * 4 * 0x28); // 0 → 40
    return `rgba(${0xe8}, ${0xf5}, ${0xe8}, ${t * 4})`;
  }
  if (t < 0.6) {
    return COLORS.mintSoft;
  }
  // High similarity → stronger mint
  return `${COLORS.mintInk}33`;
}

function SimilarityMatrix({ patterns }: { patterns: LifecyclePatternSeed[] }) {
  const visible = patterns.slice(0, MATRIX_CAP);
  const n = visible.length;

  if (n < 2) {
    return null;
  }

  // Short labels for axis headings (first 12 chars of title or patternId fragment)
  const shortLabel = (p: LifecyclePatternSeed): string => {
    const id = p.patternId;
    // Use last segment after last hyphen if it's distinguishing
    const parts = id.split('-');
    if (parts.length >= 2) return parts.slice(-2).join('-');
    return id.slice(0, 12);
  };

  // Pre-compute matrix
  const matrix: number[][] = visible.map((a) =>
    visible.map((b) => (a === b ? 100 : computeScore(a, b))),
  );

  const cellSize = 48;
  const labelWidth = 96;

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
            Similarity matrix
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            N×N heatmap — white = 0, mint = high similarity
            {patterns.length > MATRIX_CAP
              ? ` (showing first ${MATRIX_CAP} of ${patterns.length} patterns)`
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
          }}
        >
          <span>Low</span>
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <div
              key={v}
              style={{
                width: 14,
                height: 14,
                borderRadius: RADIUS.sm,
                background: heatmapColor(v),
                border: `1px solid ${COLORS.ink}14`,
              }}
            />
          ))}
          <span>High</span>
        </div>
      </header>

      <div style={{ overflowX: 'auto', padding: SPACING.md }}>
        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${labelWidth}px repeat(${n}, ${cellSize}px)`,
            gap: 2,
            marginBottom: 2,
          }}
        >
          {/* empty corner */}
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
        {visible.map((rowPattern, ri) => (
          <div
            key={rowPattern.patternId}
            style={{
              display: 'grid',
              gridTemplateColumns: `${labelWidth}px repeat(${n}, ${cellSize}px)`,
              gap: 2,
              marginBottom: 2,
            }}
          >
            {/* Row label */}
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

            {/* Cells */}
            {visible.map((colPattern, ci) => {
              const score = matrix[ri][ci];
              const isDiag = ri === ci;
              return (
                <div
                  key={colPattern.patternId}
                  title={
                    isDiag
                      ? rowPattern.title
                      : `${rowPattern.patternId} × ${colPattern.patternId}: ${score.toFixed(0)}`
                  }
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: RADIUS.sm,
                    background: isDiag ? `${COLORS.navy}22` : heatmapColor(score),
                    border: isDiag
                      ? `1px solid ${COLORS.navy}44`
                      : `1px solid ${COLORS.ink}0c`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 9,
                      color: isDiag ? COLORS.navy : score > 40 ? COLORS.mintInk : `${COLORS.ink}55`,
                      fontWeight: score > 40 ? 700 : 400,
                    }}
                  >
                    {isDiag ? '—' : score > 0 ? score.toFixed(0) : ''}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternSimilarityPage() {
  const allPatterns = getAllLifecyclePatterns();
  const pairs = computePairs(allPatterns);

  const avgScore =
    pairs.length > 0 ? pairs.reduce((sum, p) => sum + p.score, 0) / pairs.length : 0;

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
        title="Pattern similarity"
        subtitle="Pairwise similarity between lifecycle patterns. Score = shared gate criteria (Jaccard ×50) + shared contradiction templates (×30) + co-applies/related relationship bonus (×20)."
      >
        <SummaryStrip
          patternCount={allPatterns.length}
          pairCount={pairs.length}
          avgScore={avgScore}
        />
        <SimilarityTable pairs={pairs} />
        <SimilarityMatrix patterns={allPatterns} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
