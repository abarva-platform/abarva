// /admin/reasoning/pattern-coverage-matrix — Pattern × dimension coverage matrix.
//
// Pure server component, force-dynamic.
//
// For each lifecycle pattern, scores coverage across five key dimensions
// (governance, risk, compliance, technical, commercial) using keyword matching
// against gate criteria descriptions.
//
// Sections:
//   CoverageMatrix     — patterns × 5 dimensions + total; mint/amber/rust cells
//   DimensionLeaders   — best + worst pattern per dimension
//   CoverageGaps       — patterns with any dimension < 30%
//   BalancedPatterns   — patterns where all 5 dimensions ≥ 40%

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern Coverage Matrix · AbarVa Admin',
};

// Suppress unused-import lint for SHELL (used for consistency with sibling pages)
void SHELL;

// ─── Dimension scoring ────────────────────────────────────────────────────────

const DIMENSIONS = ['governance', 'risk', 'compliance', 'technical', 'commercial'] as const;
type Dimension = typeof DIMENSIONS[number];

const DIMENSION_KEYWORDS: Record<Dimension, string[]> = {
  governance:  ['approv', 'execut', 'sign-off', 'author', 'review', 'policy', 'comply'],
  risk:        ['risk', 'assess', 'mitiga', 'vulnera', 'threat', 'audit'],
  compliance:  ['legal', 'regulat', 'contract', 'law', 'gdpr', 'sox', 'complian'],
  technical:   ['technical', 'system', 'integrat', 'architect', 'deploy', 'infra', 'api'],
  commercial:  ['vendor', 'cost', 'budget', 'commerc', 'procure', 'financ', 'price'],
};

function dimensionScore(pattern: LifecyclePatternSeed, dimension: Dimension): number {
  const keywords = DIMENSION_KEYWORDS[dimension];
  const allCriteria = pattern.gateCriteria.map((c) => c.description?.toLowerCase() ?? '');
  const matches = allCriteria.filter((c) => keywords.some((k) => c.includes(k))).length;
  return Math.min(100, Math.round((matches / Math.max(allCriteria.length, 1)) * 200));
}

// ─── Row type ─────────────────────────────────────────────────────────────────

interface PatternCoverageRow {
  patternId: string;
  patternTitle: string;
  scores: Record<Dimension, number>;
  totalScore: number; // avg of 5 dimensions
}

function buildCoverageRows(patterns: LifecyclePatternSeed[]): PatternCoverageRow[] {
  return patterns.map((p) => {
    const scores = {} as Record<Dimension, number>;
    for (const dim of DIMENSIONS) {
      scores[dim] = dimensionScore(p, dim);
    }
    const totalScore = Math.round(
      DIMENSIONS.reduce((sum, d) => sum + scores[d], 0) / DIMENSIONS.length,
    );
    return {
      patternId: p.patternId,
      patternTitle: p.title,
      scores,
      totalScore,
    };
  });
}

// ─── Cell colour helpers ──────────────────────────────────────────────────────

function scoreBg(score: number): string {
  if (score >= 70) return COLORS.mintSoft;
  if (score >= 40) return COLORS.amberSoft;
  return COLORS.coralSoft;
}

function scoreInk(score: number): string {
  if (score >= 70) return COLORS.mintInk;
  if (score >= 40) return COLORS.amberInk;
  return COLORS.coralInk;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
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

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  balanced,
  withGaps,
  avgTotal,
}: {
  total: number;
  balanced: number;
  withGaps: number;
  avgTotal: number;
}) {
  const items = [
    { label: 'patterns', value: total },
    { label: 'well-rounded', value: balanced },
    { label: 'coverage gaps', value: withGaps },
    { label: 'avg coverage', value: `${avgTotal}%` },
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
        gap: SPACING.lg,
        alignItems: 'baseline',
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 28,
              color: COLORS.ink,
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
        </div>
      ))}
    </div>
  );
}

// ─── CoverageMatrix ───────────────────────────────────────────────────────────

function ScoreCell({ score }: { score: number }) {
  return (
    <td
      style={{
        ...BODY_CELL,
        textAlign: 'center',
        background: scoreBg(score),
        padding: '6px 8px',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: scoreInk(score),
        }}
      >
        {score}
      </span>
    </td>
  );
}

function TotalCell({ score }: { score: number }) {
  return (
    <td
      style={{
        ...BODY_CELL,
        textAlign: 'center',
        background: `${scoreBg(score)}cc`,
        borderLeft: `2px solid ${COLORS.ink}18`,
        padding: '6px 10px',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: scoreInk(score),
        }}
      >
        {score}%
      </span>
    </td>
  );
}

function CoverageMatrix({ rows }: { rows: PatternCoverageRow[] }) {
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
            Coverage matrix
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Score 0–100 per dimension · keyword match frequency scaled ×2
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} pattern{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 680,
          }}
        >
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern</th>
              {DIMENSIONS.map((dim) => (
                <th
                  key={dim}
                  style={{
                    ...HEADER_CELL,
                    textAlign: 'center',
                    textTransform: 'capitalize',
                  }}
                >
                  {dim}
                </th>
              ))}
              <th
                style={{
                  ...HEADER_CELL,
                  textAlign: 'center',
                  borderLeft: `2px solid ${COLORS.ink}18`,
                  color: COLORS.ink,
                  fontStyle: 'normal',
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.patternId}>
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
                {DIMENSIONS.map((dim) => {
                  const sc = row.scores[dim];
                  return (
                    <td
                      key={dim}
                      style={{
                        ...BODY_CELL,
                        textAlign: 'center',
                        background: scoreBg(sc),
                        padding: '6px 8px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 12,
                          fontWeight: 700,
                          color: scoreInk(sc),
                        }}
                      >
                        {sc}
                      </span>
                    </td>
                  );
                })}
                <TotalCell score={row.totalScore} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <footer
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          background: `${COLORS.ink}03`,
          borderTop: `1px solid ${COLORS.ink}08`,
          display: 'flex',
          gap: SPACING.lg,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {[
          { bg: COLORS.mintSoft, ink: COLORS.mintInk, label: '≥ 70 — strong' },
          { bg: COLORS.amberSoft, ink: COLORS.amberInk, label: '40–69 — moderate' },
          { bg: COLORS.coralSoft, ink: COLORS.coralInk, label: '< 40 — weak' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: RADIUS.sm,
                background: item.bg,
                border: `1px solid ${item.ink}44`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </footer>
    </section>
  );
}

// ─── DimensionLeaders ─────────────────────────────────────────────────────────

function DimensionLeaderCard({
  dimension,
  best,
  worst,
}: {
  dimension: Dimension;
  best: PatternCoverageRow;
  worst: PatternCoverageRow;
}) {
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
          padding: `${SPACING.sm} ${SPACING.md}`,
          background: `${COLORS.ink}05`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.ink,
            textTransform: 'capitalize',
            letterSpacing: '-0.01em',
          }}
        >
          {dimension}
        </span>
      </div>
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.md}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {/* Best */}
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.mintInk,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 2,
            }}
          >
            Best
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm }}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.ink,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {best.patternTitle}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.mintInk,
                background: COLORS.mintSoft,
                borderRadius: RADIUS.pill,
                padding: '2px 8px',
                flexShrink: 0,
              }}
            >
              {best.scores[dimension]}
            </span>
          </div>
        </div>
        {/* Worst */}
        <div style={{ borderTop: `1px solid ${COLORS.ink}08`, paddingTop: SPACING.sm }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.coralInk,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 2,
            }}
          >
            Weakest
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm }}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.ink,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {worst.patternTitle}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.coralInk,
                background: COLORS.coralSoft,
                borderRadius: RADIUS.pill,
                padding: '2px 8px',
                flexShrink: 0,
              }}
            >
              {worst.scores[dimension]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DimensionLeaders({ rows }: { rows: PatternCoverageRow[] }) {
  if (rows.length === 0) return null;

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
          Dimension leaders
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Best and weakest-scoring pattern per dimension
        </div>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: SPACING.md,
          padding: SPACING.md,
        }}
      >
        {DIMENSIONS.map((dim) => {
          const sorted = [...rows].sort((a, b) => b.scores[dim] - a.scores[dim]);
          const best = sorted[0];
          const worst = sorted[sorted.length - 1];
          return (
            <div key={dim}>
              <DimensionLeaderCard
                dimension={dim}
                best={best}
                worst={worst}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── CoverageGaps ─────────────────────────────────────────────────────────────

interface GapEntry {
  patternTitle: string;
  dimension: Dimension;
  score: number;
  exampleKeyword: string;
}

function CoverageGaps({ rows }: { rows: PatternCoverageRow[] }) {
  const gaps: GapEntry[] = [];

  for (const row of rows) {
    for (const dim of DIMENSIONS) {
      if (row.scores[dim] < 30) {
        const keywords = DIMENSION_KEYWORDS[dim];
        gaps.push({
          patternTitle: row.patternTitle,
          dimension: dim,
          score: row.scores[dim],
          exampleKeyword: keywords[0],
        });
      }
    }
  }

  if (gaps.length === 0) {
    return (
      <section
        style={{
          background: COLORS.mintSoft,
          border: `1px solid ${COLORS.mintInk}22`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: COLORS.mintInk,
          lineHeight: 1.5,
        }}
      >
        No patterns with dimension coverage below 30% — all dimensions meet the minimum threshold.
      </section>
    );
  }

  return (
    <section
      style={{
        background: COLORS.coralSoft,
        border: `1px solid ${COLORS.coralInk}22`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.coralInk}22`,
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
              color: COLORS.coralInk,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Coverage gaps
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.coralInk}cc`,
              marginTop: 2,
            }}
          >
            Patterns with any dimension below 30% — consider enriching gate criteria
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: COLORS.coralInk,
            fontWeight: 700,
          }}
        >
          {gaps.length} gap{gaps.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {gaps.map((gap, idx) => (
          <div
            key={`${gap.patternTitle}-${gap.dimension}`}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom:
                idx < gaps.length - 1
                  ? `1px solid ${COLORS.coralInk}18`
                  : 'none',
              display: 'flex',
              alignItems: 'baseline',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.coralInk,
                background: `${COLORS.coralInk}18`,
                borderRadius: RADIUS.pill,
                padding: '2px 8px',
                flexShrink: 0,
              }}
            >
              {gap.score}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: COLORS.coralInk,
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              Pattern{' '}
              <strong>{gap.patternTitle}</strong> has poor{' '}
              <strong>{gap.dimension}</strong> coverage — consider adding{' '}
              <em>{gap.exampleKeyword}</em>-related criteria
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── BalancedPatterns ─────────────────────────────────────────────────────────

function BalancedPatterns({ rows }: { rows: PatternCoverageRow[] }) {
  const balanced = rows.filter((r) =>
    DIMENSIONS.every((d) => r.scores[d] >= 40),
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
            Balanced patterns
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Well-rounded patterns that cover all lifecycle dimensions (all 5 ≥ 40%)
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {balanced.length} / {rows.length}
        </span>
      </header>

      {balanced.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: `${COLORS.ink}88`,
          }}
        >
          No patterns currently score ≥ 40% on all five dimensions.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: SPACING.sm,
            padding: SPACING.md,
          }}
        >
          {balanced.map((row) => (
            <div
              key={row.patternId}
              style={{
                background: COLORS.mintSoft,
                border: `1px solid ${COLORS.mintInk}22`,
                borderRadius: RADIUS.md,
                padding: `${SPACING.sm} ${SPACING.md}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.mintInk,
                }}
              >
                {row.patternTitle}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                }}
              >
                {DIMENSIONS.map((dim) => (
                  <span
                    key={dim}
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      fontWeight: 600,
                      color: COLORS.mintInk,
                      background: `${COLORS.mintInk}18`,
                      borderRadius: RADIUS.pill,
                      padding: '1px 6px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {dim} {row.scores[dim]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PatternCoverageMatrixPage() {
  const patterns = getAllLifecyclePatterns();
  // buildHealthBoardRows used for context consistency with sibling pages
  void buildHealthBoardRows();

  const rows = buildCoverageRows(patterns).sort(
    (a, b) => b.totalScore - a.totalScore || a.patternId.localeCompare(b.patternId),
  );

  const balanced = rows.filter((r) => DIMENSIONS.every((d) => r.scores[d] >= 40));
  const withGaps = rows.filter((r) => DIMENSIONS.some((d) => r.scores[d] < 30));
  const avgTotal =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.totalScore, 0) / rows.length)
      : 0;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Pattern gap report"
          primaryActionHref="/admin/reasoning/pattern-gap"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Patterns"
        title="Pattern Coverage Matrix"
        subtitle="Lifecycle pattern coverage across governance, risk, compliance, technical, and commercial dimensions"
      >
        <SummaryStrip
          total={rows.length}
          balanced={balanced.length}
          withGaps={withGaps.length}
          avgTotal={avgTotal}
        />
        <CoverageMatrix rows={rows} />
        <DimensionLeaders rows={rows} />
        <CoverageGaps rows={rows} />
        <BalancedPatterns rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
