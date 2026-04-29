// /admin/reasoning/pattern-gap — Pattern definition completeness report.
//
// Pure server component, force-dynamic.
//
// For each lifecycle pattern: detects structural gaps (empty stages, missing
// contradiction templates, failure modes, source docs, single-stage patterns),
// computes a completeness score (5 = fully defined, 0 = all gaps present), and
// surfaces patterns that need enrichment.
//
// Sections:
//   SummaryStrip     — N patterns · X fully complete · Y with gaps · Z total gap instances
//   GapTable         — sorted by completeness score ascending (most gaps first)
//   CriticalGapsCard — patterns with completeness < 3, with their specific gaps listed

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern gap report · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatternGaps {
  emptyStages: string[];         // stage IDs with zero gate criteria
  noContradictions: boolean;
  noFailureModes: boolean;
  noSourceDocs: boolean;
  singleStage: boolean;
}

interface PatternGapRow {
  patternId: string;
  patternTitle: string;
  score: number;          // 5 = no gaps, 0 = all 5 gaps present
  gaps: PatternGaps;
  totalGapInstances: number;  // sum of individual gap counts
}

// ─── Gap analysis ─────────────────────────────────────────────────────────────

function analyzePattern(p: LifecyclePatternSeed): PatternGapRow {
  const emptyStages = p.stages
    .filter((stage) => p.gateCriteria.filter((g) => g.stageId === stage.id).length === 0)
    .map((stage) => stage.id);

  const noContradictions =
    !p.contradictionTemplates || p.contradictionTemplates.length === 0;
  const noFailureModes =
    !p.failureModes || p.failureModes.length === 0;
  const noSourceDocs =
    !p.sourceDocuments || p.sourceDocuments.length === 0;
  const singleStage = p.stages.length < 2;

  const gaps: PatternGaps = {
    emptyStages,
    noContradictions,
    noFailureModes,
    noSourceDocs,
    singleStage,
  };

  // Score: start at 5, deduct 1 per gap dimension
  let score = 5;
  if (emptyStages.length > 0) score -= 1;
  if (noContradictions) score -= 1;
  if (noFailureModes) score -= 1;
  if (noSourceDocs) score -= 1;
  if (singleStage) score -= 1;

  const totalGapInstances =
    emptyStages.length +
    (noContradictions ? 1 : 0) +
    (noFailureModes ? 1 : 0) +
    (noSourceDocs ? 1 : 0) +
    (singleStage ? 1 : 0);

  return {
    patternId: p.patternId,
    patternTitle: p.title,
    score,
    gaps,
    totalGapInstances,
  };
}

// ─── Shared table cell styles ──────────────────────────────────────────────────

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

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  fullyComplete,
  withGaps,
  totalGapInstances,
}: {
  total: number;
  fullyComplete: number;
  withGaps: number;
  totalGapInstances: number;
}) {
  const items = [
    { label: 'patterns', value: total },
    { label: 'fully complete', value: fullyComplete },
    { label: 'with gaps', value: withGaps },
    { label: 'total gap instances', value: totalGapInstances },
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

function ScoreBadge({ score }: { score: number }) {
  const bg =
    score === 5
      ? COLORS.mintSoft
      : score >= 3
        ? COLORS.amberSoft
        : COLORS.coralSoft;
  const fg =
    score === 5
      ? COLORS.mintInk
      : score >= 3
        ? COLORS.amberInk
        : COLORS.coralInk;
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
      {score}/5
    </span>
  );
}

function CheckCell({ pass }: { pass: boolean }) {
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 13,
        color: pass ? COLORS.mintInk : COLORS.coralInk,
      }}
    >
      {pass ? '✓' : '✗'}
    </span>
  );
}

function ActionPill({ score }: { score: number }) {
  if (score === 5) {
    return (
      <span
        style={{
          display: 'inline-block',
          background: COLORS.mintSoft,
          color: COLORS.mintInk,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Complete
      </span>
    );
  }
  if (score >= 3) {
    return (
      <span
        style={{
          display: 'inline-block',
          background: COLORS.amberSoft,
          color: COLORS.amberInk,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Enrich
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.coralSoft,
        color: COLORS.coralInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      Urgent
    </span>
  );
}

function GapTable({ rows }: { rows: PatternGapRow[] }) {
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
            All patterns
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by completeness score ascending — most gaps first
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Score</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Empty stages</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>No contradictions</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>No failure modes</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>No source docs</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Action</th>
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
                <td style={{ ...MONO_CELL, textAlign: 'center' }}>
                  <ScoreBadge score={row.score} />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  {row.gaps.emptyStages.length > 0 ? (
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        color: COLORS.coralInk,
                        fontWeight: 700,
                      }}
                    >
                      {row.gaps.emptyStages.length}
                    </span>
                  ) : (
                    <CheckCell pass={true} />
                  )}
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <CheckCell pass={!row.gaps.noContradictions} />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <CheckCell pass={!row.gaps.noFailureModes} />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <CheckCell pass={!row.gaps.noSourceDocs} />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <ActionPill score={row.score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GapChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.coralSoft,
        color: COLORS.coralInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  );
}

function CriticalGapsCard({ rows }: { rows: PatternGapRow[] }) {
  const critical = rows.filter((r) => r.score < 3);
  if (critical.length === 0) {
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
        No patterns with completeness score below 3 — all patterns meet the minimum
        definition threshold.
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
            Critical gaps
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.coralInk}cc`,
              marginTop: 2,
            }}
          >
            Patterns with completeness score &lt; 3 — priority enrichment targets
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
          {critical.length} pattern{critical.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {critical.map((row, idx) => (
          <div
            key={row.patternId}
            style={{
              padding: `${SPACING.md} ${SPACING.lg}`,
              borderBottom:
                idx < critical.length - 1
                  ? `1px solid ${COLORS.coralInk}18`
                  : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.sm,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: SPACING.md,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.coralInk,
                  }}
                >
                  {row.patternTitle}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.coralInk}aa`,
                    marginLeft: SPACING.sm,
                  }}
                >
                  {row.patternId}
                </span>
              </div>
              <ScoreBadge score={row.score} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}>
              {row.gaps.emptyStages.length > 0 && (
                <GapChip
                  label={`${row.gaps.emptyStages.length} empty stage${row.gaps.emptyStages.length === 1 ? '' : 's'}`}
                />
              )}
              {row.gaps.noContradictions && (
                <GapChip label="no contradiction templates" />
              )}
              {row.gaps.noFailureModes && (
                <GapChip label="no failure modes" />
              )}
              {row.gaps.noSourceDocs && (
                <GapChip label="no source docs" />
              )}
              {row.gaps.singleStage && (
                <GapChip label="single-stage pattern" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PatternGapPage() {
  const patterns = getAllLifecyclePatterns();

  const rows: PatternGapRow[] = patterns
    .map((p) => analyzePattern(p))
    .sort((a, b) => a.score - b.score || a.patternId.localeCompare(b.patternId));

  const fullyComplete = rows.filter((r) => r.score === 5).length;
  const withGaps = rows.filter((r) => r.score < 5).length;
  const totalGapInstances = rows.reduce((sum, r) => sum + r.totalGapInstances, 0);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Pattern stats"
          primaryActionHref="/admin/reasoning/pattern-stats"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Patterns"
        title="Pattern gap report"
        subtitle="Definition completeness across all lifecycle patterns — stages with no gate criteria, missing contradiction templates, failure modes, and source documents. Use as an enrichment priority queue."
      >
        <SummaryStrip
          total={rows.length}
          fullyComplete={fullyComplete}
          withGaps={withGaps}
          totalGapInstances={totalGapInstances}
        />
        <CriticalGapsCard rows={rows} />
        <GapTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
