// /admin/reasoning/synthesis-comparison — Side-by-side comparison of synthesis
// confidence scores across all instances. Identifies outliers and rank reversals
// between structural health rank and synthesis confidence rank.
//
// Sections:
//   RankComparisonStrip  — health-ranked list vs confidence-ranked list; ⚠️ on reversals ≥ 3
//   ScatterTable         — all instances; health score, confidence %, ranks, delta, gates, contradictions
//   OutlierCards         — overperformers (confidence >> health) and underperformers (health >> confidence)
//   CorrelationNote      — italic footer

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Synthesis Comparison · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComparisonRow {
  id: string;
  name: string;
  type: 'source' | 'program';
  healthScore: number;
  confidenceScore: number;
  healthRank: number;
  confidenceRank: number;
  rankDelta: number;
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildComparisonRows(): ComparisonRow[] {
  // Get health rows from health board
  const healthRows = buildHealthBoardRows();

  // Build confidence scores for each instance
  const confidenceByInstanceId: Record<string, number> = {};

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    const { score } = computeSynthesisConfidence(ctx);
    confidenceByInstanceId[inst.id] = score;
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    const { score } = computeSynthesisConfidence(ctx);
    confidenceByInstanceId[inst.id] = score;
  }

  // Compute health score from the formula — or derive from gatesMet/gatesTotal/contradictions
  const rows: Omit<ComparisonRow, 'healthRank' | 'confidenceRank' | 'rankDelta'>[] =
    healthRows
      .filter((r) => confidenceByInstanceId[r.id] !== undefined)
      .map((r) => {
        const healthScore = Math.round(
          (r.gatesMet / Math.max(r.gatesTotal, 1)) * 60 +
            (1 - Math.min(r.activeContradictions / 5, 1)) * 30 +
            10,
        );
        return {
          id: r.id,
          name: r.label,
          type: r.type,
          healthScore,
          confidenceScore: confidenceByInstanceId[r.id] ?? 0,
          gatesMet: r.gatesMet,
          gatesTotal: r.gatesTotal,
          activeContradictions: r.activeContradictions,
        };
      });

  // Compute ranks — sort copies descending, then findIndex
  const byHealth = [...rows].sort((a, b) => b.healthScore - a.healthScore);
  const byConfidence = [...rows].sort((a, b) => b.confidenceScore - a.confidenceScore);

  return rows.map((r) => {
    const healthRank = byHealth.findIndex((x) => x.id === r.id) + 1;
    const confidenceRank = byConfidence.findIndex((x) => x.id === r.id) + 1;
    return {
      ...r,
      healthRank,
      confidenceRank,
      rankDelta: Math.abs(healthRank - confidenceRank),
    };
  });
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function healthScoreColor(score: number): string {
  if (score >= 70) return SHELL.MINT_TEXT;
  if (score >= 40) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

function confidenceColor(score: number): string {
  if (score >= 75) return SHELL.MINT_TEXT;
  if (score >= 45) return SHELL.AMBER_DOT;
  return SHELL.RUST_TEXT;
}

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

// ─── RankComparisonStrip ──────────────────────────────────────────────────────

function RankItem({
  rank,
  name,
  score,
  scoreLabel,
  scoreColor,
  isReversal,
}: {
  rank: number;
  name: string;
  score: number;
  scoreLabel: string;
  scoreColor: string;
  isReversal: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: `${SPACING.xs} ${SPACING.sm}`,
        borderRadius: RADIUS.md,
        background: isReversal ? `${SHELL.AMBER_DOT}12` : 'transparent',
        border: isReversal ? `1px solid ${SHELL.AMBER_DOT}44` : '1px solid transparent',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}66`,
          minWidth: 22,
          flexShrink: 0,
        }}
      >
        #{rank}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.ink,
          fontWeight: 500,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
      {isReversal && (
        <span
          title="Rank reversal ≥ 3 between health and confidence"
          style={{ flexShrink: 0, fontSize: 13 }}
        >
          ⚠️
        </span>
      )}
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: scoreColor,
          flexShrink: 0,
        }}
      >
        {score}{scoreLabel}
      </span>
    </div>
  );
}

function RankComparisonStrip({ rows }: { rows: ComparisonRow[] }) {
  const byHealth = [...rows].sort((a, b) => a.healthRank - b.healthRank);
  const byConfidence = [...rows].sort((a, b) => a.confidenceRank - b.confidenceRank);

  const reversalIds = new Set(rows.filter((r) => r.rankDelta >= 3).map((r) => r.id));

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
          Rank comparison
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Left: ranked by health score &nbsp;·&nbsp; Right: ranked by synthesis confidence &nbsp;·&nbsp;
          <span style={{ color: SHELL.AMBER_DOT, fontWeight: 600 }}>⚠️ = rank reversal ≥ 3</span>
        </div>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        }}
      >
        {/* Left: health rank */}
        <div
          style={{
            padding: SPACING.md,
            borderRight: `1px solid ${COLORS.ink}0e`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: COLORS.navy,
              marginBottom: SPACING.sm,
              paddingLeft: SPACING.sm,
            }}
          >
            By Health Score
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {byHealth.map((r) => (
              <div key={r.id}>
                <RankItem
                  rank={r.healthRank}
                  name={r.name}
                  score={r.healthScore}
                  scoreLabel=""
                  scoreColor={healthScoreColor(r.healthScore)}
                  isReversal={reversalIds.has(r.id)}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Right: confidence rank */}
        <div style={{ padding: SPACING.md }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: COLORS.navy,
              marginBottom: SPACING.sm,
              paddingLeft: SPACING.sm,
            }}
          >
            By Synthesis Confidence
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {byConfidence.map((r) => (
              <div key={r.id}>
                <RankItem
                  rank={r.confidenceRank}
                  name={r.name}
                  score={r.confidenceScore}
                  scoreLabel="%"
                  scoreColor={confidenceColor(r.confidenceScore)}
                  isReversal={reversalIds.has(r.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ScatterTable ─────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  const isHigh = delta >= 3;
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        color: isHigh ? SHELL.RUST_TEXT : `${COLORS.ink}99`,
        background: isHigh ? SHELL.RUST_BG : `${COLORS.ink}08`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
      }}
    >
      {isHigh ? `⚠️ ${delta}` : delta}
    </span>
  );
}

function ScatterTable({ rows }: { rows: ComparisonRow[] }) {
  const sorted = [...rows].sort((a, b) => a.healthRank - b.healthRank);

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
          All instances — scatter metrics
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          sorted by health rank
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={TH}>Instance</th>
              <th style={{ ...TH, minWidth: 90 }}>Health score</th>
              <th style={{ ...TH, width: 72 }}>H-rank</th>
              <th style={{ ...TH, minWidth: 100 }}>Confidence %</th>
              <th style={{ ...TH, width: 72 }}>C-rank</th>
              <th style={{ ...TH, width: 90 }}>Rank delta</th>
              <th style={{ ...TH, minWidth: 90 }}>Gates met %</th>
              <th style={{ ...TH, width: 100 }}>Contradictions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const gatesPct =
                r.gatesTotal > 0
                  ? Math.round((r.gatesMet / r.gatesTotal) * 100)
                  : 100;
              return (
                <tr key={r.id}>
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {r.name}
                    </span>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}77`,
                        marginTop: 2,
                      }}
                    >
                      {r.id}
                    </div>
                  </td>
                  <td style={{ ...TD_MONO, color: healthScoreColor(r.healthScore), fontWeight: 700 }}>
                    {r.healthScore}
                  </td>
                  <td style={{ ...TD_MONO, color: `${COLORS.ink}88` }}>#{r.healthRank}</td>
                  <td
                    style={{
                      ...TD_MONO,
                      color: confidenceColor(r.confidenceScore),
                      fontWeight: 700,
                    }}
                  >
                    {r.confidenceScore}%
                  </td>
                  <td style={{ ...TD_MONO, color: `${COLORS.ink}88` }}>#{r.confidenceRank}</td>
                  <td style={TD}>
                    <DeltaBadge delta={r.rankDelta} />
                  </td>
                  <td
                    style={{
                      ...TD_MONO,
                      color: gatesPct >= 80 ? SHELL.MINT_TEXT : gatesPct >= 50 ? SHELL.AMBER_DOT : SHELL.RUST_TEXT,
                      fontWeight: 700,
                    }}
                  >
                    {gatesPct}%
                  </td>
                  <td
                    style={{
                      ...TD_MONO,
                      color: r.activeContradictions > 0 ? SHELL.RUST_TEXT : `${COLORS.ink}99`,
                      fontWeight: r.activeContradictions > 0 ? 700 : 400,
                    }}
                  >
                    {r.activeContradictions}
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

// ─── OutlierCards ─────────────────────────────────────────────────────────────

function OutlierList({
  instances,
  emptyLabel,
  accentColor,
}: {
  instances: ComparisonRow[];
  emptyLabel: string;
  accentColor: string;
}) {
  if (instances.length === 0) {
    return (
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}77`,
          padding: `${SPACING.sm} 0`,
        }}
      >
        {emptyLabel}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
      {instances.map((r) => (
        <div
          key={r.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: SPACING.sm,
            padding: `${SPACING.xs} ${SPACING.sm}`,
            borderRadius: RADIUS.md,
            background: `${accentColor}10`,
            border: `1px solid ${accentColor}33`,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              fontWeight: 500,
              color: COLORS.ink,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {r.name}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}88`,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            H#{r.healthRank} → C#{r.confidenceRank} &nbsp;(Δ{r.rankDelta})
          </span>
        </div>
      ))}
    </div>
  );
}

function OutlierCards({ rows }: { rows: ComparisonRow[] }) {
  // Overperformers: confidence rank better (lower number) than health rank by ≥ 3
  const overperformers = rows.filter((r) => r.healthRank - r.confidenceRank >= 3);
  // Underperformers: confidence rank worse (higher number) than health rank by ≥ 3
  const underperformers = rows.filter((r) => r.confidenceRank - r.healthRank >= 3);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: SPACING.md,
      }}
    >
      {/* Overperformers */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderTop: `3px solid ${SHELL.MINT_TEXT}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 17,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            marginBottom: 4,
          }}
        >
          Overperformers
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginBottom: SPACING.sm,
          }}
        >
          Confidence rank significantly better than health rank
        </div>
        <OutlierList
          instances={overperformers}
          emptyLabel="No overperformers detected."
          accentColor={SHELL.MINT_TEXT}
        />
      </div>

      {/* Underperformers */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderTop: `3px solid ${SHELL.RUST_TEXT}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 17,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            marginBottom: 4,
          }}
        >
          Underperformers
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginBottom: SPACING.sm,
          }}
        >
          Confidence rank significantly worse than health rank
        </div>
        <OutlierList
          instances={underperformers}
          emptyLabel="No underperformers detected."
          accentColor={SHELL.RUST_TEXT}
        />
      </div>
    </div>
  );
}

// ─── CorrelationNote ──────────────────────────────────────────────────────────

function CorrelationNote() {
  return (
    <p
      style={{
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        fontStyle: 'italic',
        color: `${COLORS.ink}99`,
        margin: 0,
        lineHeight: 1.7,
        textAlign: 'center',
        padding: `${SPACING.sm} 0`,
      }}
    >
      High rank delta indicates synthesis confidence and structural health are diverging — review
      evidence quality and contradiction resolution status.
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SynthesisComparisonPage() {
  const rows = buildComparisonRows();

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
        eyebrow="Reasoning · Synthesis"
        title="Synthesis Comparison"
        subtitle="Side-by-side confidence, health, and gate metrics — identify outliers and rank reversals"
      >
        <RankComparisonStrip rows={rows} />
        <ScatterTable rows={rows} />
        <OutlierCards rows={rows} />
        <CorrelationNote />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
