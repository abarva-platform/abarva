// /admin/reasoning/instance-comparison — Top vs. bottom performer comparison.
//
// Pure server component, force-dynamic.
//
// Computes the top 3 and bottom 3 instances by composite health score, then
// renders a side-by-side comparison grid with a summary strip and a key
// differences card.
//
// Composite score formula (0–100) — same formula used by scorecard and
// instance-compare so the ranking is consistent:
//   gates_component    = (gatesMet / max(gatesTotal, 1)) * 60
//   contradictions_cmp = (1 - min(activeContradictions / 5, 1)) * 30
//   baseline           = 10
//   total              = round(gates_component + contradictions_cmp + baseline)
//
// Grade bands: ≥70 → A, ≥55 → B, ≥40 → C, <40 → D

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance comparison · AbarVa Admin',
};

// ─── Score helpers ────────────────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

type ScoreGrade = 'A' | 'B' | 'C' | 'D';

function scoreGrade(score: number): ScoreGrade {
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

// ─── Enriched row ─────────────────────────────────────────────────────────────

interface EnrichedRow {
  id: string;
  label: string;
  type: 'source' | 'program';
  stage: string;
  patternName: string;
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
  healthLabel: InstanceHealthRow['healthLabel'];
  score: number;
  grade: ScoreGrade;
  evidenceCount: number;
}

function enrich(
  row: InstanceHealthRow,
  patternNames: Map<string, string>,
): EnrichedRow {
  const score = computeScore(row);
  return {
    id: row.id,
    label: row.label,
    type: row.type,
    stage: row.stageLabel ?? row.phaseLabel ?? '—',
    patternName: patternNames.get(row.id) ?? '—',
    gatesMet: row.gatesMet,
    gatesTotal: row.gatesTotal,
    activeContradictions: row.activeContradictions,
    healthLabel: row.healthLabel,
    score,
    grade: scoreGrade(score),
    evidenceCount: getEvidenceFor(row.id).length,
  };
}

// ─── Avg helpers ──────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function fmt1(n: number): string {
  return n.toFixed(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  topAvg,
  bottomAvg,
}: {
  topAvg: number;
  bottomAvg: number;
}) {
  const gap = Math.round(topAvg - bottomAvg);
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.lg,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        Score summary
      </span>
      <SummaryPill label="Top 3 avg" value={`${Math.round(topAvg)}`} color={SHELL.MINT_TEXT} bg={SHELL.MINT_BG} />
      <SummaryPill label="Bottom 3 avg" value={`${Math.round(bottomAvg)}`} color={SHELL.RUST_TEXT} bg={SHELL.RUST_BG} />
      <SummaryPill label="Gap" value={`${gap} pts`} color={COLORS.navy} bg={COLORS.skyPale} />
    </div>
  );
}

function SummaryPill({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        background: bg,
        color,
        borderRadius: RADIUS.pill,
        padding: '5px 14px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ fontWeight: 400, opacity: 0.75 }}>{label}:</span>
      {value}
    </span>
  );
}

function GradeBadge({ grade }: { grade: ScoreGrade }) {
  const palette: Record<ScoreGrade, { bg: string; text: string }> = {
    A: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT },
    B: { bg: COLORS.skyPale, text: COLORS.navy },
    C: { bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT },
    D: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT },
  };
  const p = palette[grade];
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.bg,
        color: p.text,
        borderRadius: RADIUS.sm,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}
    >
      {grade}
    </span>
  );
}

function HealthPill({ label }: { label: InstanceHealthRow['healthLabel'] }) {
  const palette: Record<InstanceHealthRow['healthLabel'], { bg: string; text: string }> = {
    healthy: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT },
    warning: { bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT },
    critical: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT },
    unknown: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT },
  };
  const p = palette[label];
  return (
    <span
      style={{
        display: 'inline-block',
        background: p.bg,
        color: p.text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 100);
  const fill =
    score >= 70 ? SHELL.MINT_TEXT : score >= 40 ? SHELL.AMBER_DOT : SHELL.RUST_TEXT;
  return (
    <div
      style={{
        position: 'relative',
        height: 6,
        borderRadius: RADIUS.pill,
        background: `${COLORS.ink}12`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${pct}%`,
          background: fill,
          borderRadius: RADIUS.pill,
        }}
      />
    </div>
  );
}

function InstanceCard({ row, rank }: { row: EnrichedRow; rank: number }) {
  const gatesPct =
    row.gatesTotal > 0 ? Math.round((row.gatesMet / row.gatesTotal) * 100) : 0;

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
      {/* Header row: rank + name + grade */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING.sm }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
            paddingTop: 2,
            flexShrink: 0,
          }}
        >
          #{rank}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 16,
              color: COLORS.ink,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {row.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}66`,
              marginTop: 2,
            }}
          >
            {row.id}
          </div>
        </div>
        <GradeBadge grade={row.grade} />
      </div>

      {/* Score bar */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 4,
          }}
        >
          <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: `${COLORS.ink}88` }}>
            Health score
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.ink,
            }}
          >
            {row.score}
          </span>
        </div>
        <ScoreBar score={row.score} />
      </div>

      {/* Metadata grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: `${SPACING.xs} ${SPACING.md}`,
          marginTop: SPACING.xs,
        }}
      >
        <MetaItem label="Pattern" value={row.patternName} mono />
        <MetaItem label="Stage" value={row.stage} />
        <MetaItem label="Gates met" value={`${row.gatesMet} / ${row.gatesTotal} (${gatesPct}%)`} />
        <MetaItem label="Contradictions" value={String(row.activeContradictions)} />
        <MetaItem label="Evidence" value={`${row.evidenceCount} item${row.evidenceCount === 1 ? '' : 's'}`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              color: `${COLORS.ink}66`,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Health
          </span>
          <HealthPill label={row.healthLabel} />
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          color: `${COLORS.ink}66`,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? TYPOGRAPHY.mono : TYPOGRAPHY.sans,
          fontSize: 12,
          color: COLORS.ink,
          lineHeight: 1.3,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ColumnHeader({
  title,
  accent,
  count,
}: {
  title: string;
  accent: { bg: string; text: string; border: string };
  count: number;
}) {
  return (
    <div
      style={{
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        borderRadius: `${RADIUS.lg} ${RADIUS.lg} 0 0`,
        padding: `${SPACING.sm} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 17,
          fontWeight: 700,
          color: accent.text,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: accent.text,
          opacity: 0.7,
        }}
      >
        {count} instance{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function ComparisonGrid({
  top,
  bottom,
}: {
  top: EnrichedRow[];
  bottom: EnrichedRow[];
}) {
  const mintAccent = { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, border: SHELL.MINT_LINE };
  const rustAccent = { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, border: `${SHELL.RUST_TEXT}40` };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: SPACING.md,
        alignItems: 'start',
      }}
    >
      {/* Top performers column */}
      <div>
        <ColumnHeader title="Top Performers" accent={mintAccent} count={top.length} />
        <div
          style={{
            border: `1px solid ${SHELL.MINT_LINE}`,
            borderTop: 'none',
            borderRadius: `0 0 ${RADIUS.lg} ${RADIUS.lg}`,
            padding: SPACING.md,
            background: `${SHELL.MINT_BG}44`,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          {top.map((row, i) => (
            <div key={row.id}><InstanceCard row={row} rank={i + 1} /></div>
          ))}
        </div>
      </div>

      {/* Needs attention column */}
      <div>
        <ColumnHeader title="Needs Attention" accent={rustAccent} count={bottom.length} />
        <div
          style={{
            border: `1px solid ${SHELL.RUST_TEXT}40`,
            borderTop: 'none',
            borderRadius: `0 0 ${RADIUS.lg} ${RADIUS.lg}`,
            padding: SPACING.md,
            background: `${SHELL.RUST_BG}66`,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          {bottom.map((row, i) => (
            <div key={row.id}><InstanceCard row={row} rank={i + 1} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiffRow({ label, topVal, bottomVal, delta, positive }: {
  label: string;
  topVal: string;
  bottomVal: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <tr>
      <td
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}cc`,
          padding: `${SPACING.sm} ${SPACING.md}`,
          borderBottom: `1px solid ${COLORS.ink}0a`,
          verticalAlign: 'middle',
        }}
      >
        {label}
      </td>
      <td
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: SHELL.MINT_TEXT,
          padding: `${SPACING.sm} ${SPACING.md}`,
          borderBottom: `1px solid ${COLORS.ink}0a`,
          textAlign: 'right',
          verticalAlign: 'middle',
        }}
      >
        {topVal}
      </td>
      <td
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: SHELL.RUST_TEXT,
          padding: `${SPACING.sm} ${SPACING.md}`,
          borderBottom: `1px solid ${COLORS.ink}0a`,
          textAlign: 'right',
          verticalAlign: 'middle',
        }}
      >
        {bottomVal}
      </td>
      <td
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          fontWeight: 700,
          color: positive ? SHELL.MINT_TEXT : SHELL.RUST_TEXT,
          padding: `${SPACING.sm} ${SPACING.md}`,
          borderBottom: `1px solid ${COLORS.ink}0a`,
          textAlign: 'right',
          verticalAlign: 'middle',
        }}
      >
        {delta}
      </td>
    </tr>
  );
}

function KeyDifferences({
  top,
  bottom,
}: {
  top: EnrichedRow[];
  bottom: EnrichedRow[];
}) {
  const topAvgScore = avg(top.map((r) => r.score));
  const bottomAvgScore = avg(bottom.map((r) => r.score));

  const topAvgGates = avg(top.map((r) => (r.gatesTotal > 0 ? r.gatesMet / r.gatesTotal : 0) * 100));
  const bottomAvgGates = avg(bottom.map((r) => (r.gatesTotal > 0 ? r.gatesMet / r.gatesTotal : 0) * 100));

  const topAvgContradictions = avg(top.map((r) => r.activeContradictions));
  const bottomAvgContradictions = avg(bottom.map((r) => r.activeContradictions));

  const topAvgEvidence = avg(top.map((r) => r.evidenceCount));
  const bottomAvgEvidence = avg(bottom.map((r) => r.evidenceCount));

  const scoreDelta = topAvgScore - bottomAvgScore;
  const gatesDelta = topAvgGates - bottomAvgGates;
  const contDelta = bottomAvgContradictions - topAvgContradictions; // positive = bottom has more
  const evidenceDelta = topAvgEvidence - bottomAvgEvidence;

  const HEADER_CELL: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: `${COLORS.ink}88`,
    fontWeight: 600,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.ink}18`,
    textAlign: 'right',
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
            Key differences
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Average metrics across the two groups
          </div>
        </div>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, textAlign: 'left' }}>Metric</th>
              <th style={{ ...HEADER_CELL, color: SHELL.MINT_TEXT }}>Top 3 avg</th>
              <th style={{ ...HEADER_CELL, color: SHELL.RUST_TEXT }}>Bottom 3 avg</th>
              <th style={{ ...HEADER_CELL }}>Difference</th>
            </tr>
          </thead>
          <tbody>
            <DiffRow
              label="Health score"
              topVal={fmt1(topAvgScore)}
              bottomVal={fmt1(bottomAvgScore)}
              delta={`+${fmt1(scoreDelta)}`}
              positive={true}
            />
            <DiffRow
              label="Gate pass rate"
              topVal={`${fmt1(topAvgGates)}%`}
              bottomVal={`${fmt1(bottomAvgGates)}%`}
              delta={`+${fmt1(gatesDelta)} pp`}
              positive={true}
            />
            <DiffRow
              label="Avg contradictions"
              topVal={fmt1(topAvgContradictions)}
              bottomVal={fmt1(bottomAvgContradictions)}
              delta={contDelta >= 0 ? `${fmt1(contDelta)} fewer in top` : `${fmt1(-contDelta)} more in top`}
              positive={contDelta >= 0}
            />
            <DiffRow
              label="Evidence items"
              topVal={fmt1(topAvgEvidence)}
              bottomVal={fmt1(bottomAvgEvidence)}
              delta={evidenceDelta >= 0 ? `+${fmt1(evidenceDelta)}` : fmt1(evidenceDelta)}
              positive={evidenceDelta >= 0}
            />
          </tbody>
        </table>
      </div>

      {/* Plain-language summary */}
      <div
        style={{
          padding: SPACING.lg,
          borderTop: `1px solid ${COLORS.ink}0a`,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}cc`,
          lineHeight: 1.6,
        }}
      >
        Top performers average{' '}
        <strong style={{ color: SHELL.MINT_TEXT }}>{fmt1(topAvgScore)}</strong> vs.{' '}
        <strong style={{ color: SHELL.RUST_TEXT }}>{fmt1(bottomAvgScore)}</strong> for the bottom
        group — a <strong>{fmt1(scoreDelta)}-point gap</strong>. The top group passes{' '}
        <strong style={{ color: SHELL.MINT_TEXT }}>{fmt1(topAvgGates)}%</strong> of gate criteria
        vs. <strong style={{ color: SHELL.RUST_TEXT }}>{fmt1(bottomAvgGates)}%</strong>, and carries{' '}
        <strong style={{ color: SHELL.MINT_TEXT }}>{fmt1(topAvgContradictions)}</strong> avg
        contradictions vs.{' '}
        <strong style={{ color: SHELL.RUST_TEXT }}>{fmt1(bottomAvgContradictions)}</strong>.
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstanceComparisonPage() {
  const rows = buildHealthBoardRows();

  // Build a patternId → patternName map from both catalogues
  const patternNames = new Map<string, string>();
  const allPatterns = getAllLifecyclePatterns();
  // Index by patternId; map instance id → pattern name via row.id lookups below
  const patternNameById = new Map<string, string>(
    allPatterns.map((p) => [p.patternId, p.title ?? p.patternId]),
  );

  // Enrich all rows — look up pattern name via instance patternId.
  const allInstances: Array<{ id: string; patternId: string }> = [
    ...SOURCE_EVENT_INSTANCES,
    ...APEX_RETAIL_PROGRAM_INSTANCES,
  ];

  for (const inst of allInstances) {
    const name = patternNameById.get(inst.patternId);
    if (name !== undefined) {
      patternNames.set(inst.id, name);
    }
  }

  const enriched = rows.map((r) => enrich(r, patternNames));

  // Sort descending by score
  const sorted = [...enriched].sort((a, b) => b.score - a.score);

  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3).reverse(); // worst first

  const topAvg = avg(top3.map((r) => r.score));
  const bottomAvg = avg(bottom3.map((r) => r.score));

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
        title="Instance comparison"
        subtitle="Top 3 vs. bottom 3 instances by composite health score — side-by-side gate coverage, contradiction load, evidence depth, and health grade."
      >
        <SummaryStrip topAvg={topAvg} bottomAvg={bottomAvg} />
        <ComparisonGrid top={top3} bottom={bottom3} />
        <KeyDifferences top={top3} bottom={bottom3} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
