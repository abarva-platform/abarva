// /admin/reasoning/scorecard — All instances ranked by composite health score.
//
// Server component. Calls buildHealthBoardRows() to get every fixture instance,
// computes a composite score per row, sorts descending, and renders a ranked
// table with an inline progress bar for the score column.
//
// Composite score formula (0–100):
//   gates_component    = (gatesMet / max(gatesTotal, 1)) * 60
//   contradictions_cmp = (1 - min(activeContradictions / 5, 1)) * 30
//   baseline           = 10
//   total              = round(gates_component + contradictions_cmp + baseline)
//
// Score bands: ≥70 → mint, 40–69 → amber, <40 → rust.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reasoning scorecard | AbarVa Admin',
};

// ─── Score computation ────────────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
    (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
    10,
  );
}

// ─── Score band helpers ───────────────────────────────────────────────────────

type ScoreBand = 'mint' | 'amber' | 'rust';

function scoreBand(score: number): ScoreBand {
  if (score >= 70) return 'mint';
  if (score >= 40) return 'amber';
  return 'rust';
}

interface BandPalette {
  bar: string;
  text: string;
  barBg: string;
}

function bandPalette(band: ScoreBand): BandPalette {
  if (band === 'mint') {
    return { bar: SHELL.MINT_TEXT, text: SHELL.MINT_TEXT, barBg: SHELL.MINT_BG };
  }
  if (band === 'amber') {
    return { bar: SHELL.AMBER_DOT, text: SHELL.AMBER_DOT, barBg: SHELL.PAPER_DEEP };
  }
  return { bar: SHELL.RUST_TEXT, text: SHELL.RUST_TEXT, barBg: SHELL.RUST_BG };
}

// ─── Health label palette ─────────────────────────────────────────────────────

interface HealthPalette {
  bg: string;
  text: string;
}

function healthPalette(label: InstanceHealthRow['healthLabel']): HealthPalette {
  if (label === 'healthy') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT };
  if (label === 'warning') return { bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT };
  if (label === 'critical') return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT };
}

// ─── Row type with computed score ─────────────────────────────────────────────

interface ScoredRow {
  row: InstanceHealthRow;
  score: number;
}

// ─── Table styles ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
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

const TD: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const TD_MONO: React.CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: ScoredRow[] }) {
  const avg = rows.length === 0
    ? 0
    : Math.round(rows.reduce((sum, r) => sum + r.score, 0) / rows.length);
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.ink,
      }}
    >
      <span style={{ fontWeight: 600 }}>
        {rows.length} instance{rows.length === 1 ? '' : 's'}
      </span>
      <span style={{ color: `${COLORS.ink}66` }}>·</span>
      <span>
        Average score:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 13,
            fontWeight: 700,
            color: bandPalette(scoreBand(avg)).text,
          }}
        >
          {avg}
        </span>
      </span>
    </div>
  );
}

function TypeBadge({ type }: { type: InstanceHealthRow['type'] }) {
  const isSource = type === 'source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? SHELL.PEACH_BG : SHELL.BLUE_BG,
        color: isSource ? SHELL.PEACH_TEXT : SHELL.INK_MID,
        border: `1px solid ${isSource ? SHELL.PEACH_LINE : SHELL.BLUE_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {isSource ? 'Source event' : 'Program'}
    </span>
  );
}

function ScoreCell({ score }: { score: number }) {
  const band = scoreBand(score);
  const palette = bandPalette(band);
  const pct = score; // score is already 0-100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: palette.text,
          minWidth: 52,
          flexShrink: 0,
        }}
      >
        {score} / 100
      </span>
      {/* Narrow inline progress bar */}
      <div
        aria-hidden="true"
        style={{
          flex: 1,
          height: 6,
          borderRadius: RADIUS.pill,
          background: palette.barBg,
          overflow: 'hidden',
          minWidth: 48,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: palette.bar,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
    </div>
  );
}

function HealthBadge({ label }: { label: InstanceHealthRow['healthLabel'] }) {
  const palette = healthPalette(label);
  const display = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {display}
    </span>
  );
}

function ScorecardTable({ scored }: { scored: ScoredRow[] }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 36 }}>#</th>
              <th style={TH}>Instance</th>
              <th style={TH}>Type</th>
              <th style={TH}>Stage / Phase</th>
              <th style={{ ...TH, minWidth: 180 }}>Score</th>
              <th style={TH}>Gates</th>
              <th style={TH}>Contradictions</th>
              <th style={TH}>Health</th>
            </tr>
          </thead>
          <tbody>
            {scored.map(({ row, score }, idx) => {
              const stageOrPhase = row.stageLabel ?? row.phaseLabel ?? '—';
              const gatesDisplay =
                row.gatesTotal === 0
                  ? '—'
                  : `${row.gatesMet}/${row.gatesTotal}`;
              const hasContradictions = row.activeContradictions > 0;
              return (
                <tr key={row.id}>
                  <td style={{ ...TD_MONO, color: `${COLORS.ink}66`, textAlign: 'center' }}>
                    {idx + 1}
                  </td>
                  <td style={TD}>
                    <a
                      href={`/admin/reasoning/instances/${row.id}`}
                      style={{ color: SHELL.INK, textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.serif,
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.ink,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {row.label}
                      </div>
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}77`,
                          marginTop: 2,
                        }}
                      >
                        {row.id}
                      </div>
                    </a>
                  </td>
                  <td style={TD}>
                    <TypeBadge type={row.type} />
                  </td>
                  <td style={TD_MONO}>{stageOrPhase}</td>
                  <td style={{ ...TD, padding: `${SPACING.sm} ${SPACING.md}` }}>
                    <ScoreCell score={score} />
                  </td>
                  <td style={TD_MONO}>{gatesDisplay}</td>
                  <td
                    style={{
                      ...TD_MONO,
                      fontWeight: hasContradictions ? 700 : undefined,
                      color: hasContradictions ? SHELL.RUST_TEXT : `${COLORS.ink}66`,
                    }}
                  >
                    {row.activeContradictions}
                  </td>
                  <td style={TD}>
                    <HealthBadge label={row.healthLabel} />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReasoningScorecardPage() {
  const rows = buildHealthBoardRows();

  const scored: ScoredRow[] = rows
    .map((row) => ({ row, score: computeScore(row) }))
    .sort((a, b) => b.score - a.score);

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
        title="Instance Scorecard"
        subtitle="All fixture instances ranked by composite reasoning health score. Score = gates component (60 pts) + contradiction penalty (30 pts) + baseline (10 pts). Mint ≥ 70, amber 40–69, rust below 40."
      >
        <SummaryStrip rows={scored} />
        <ScorecardTable scored={scored} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
