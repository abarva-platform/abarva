// /admin/reasoning/instance-scorecard — Full scorecard for every instance.
//
// Pure server component. Loads all fixture instances, enriches each with
// evidence count (from the in-memory ingestion store) and waiver count
// (from the gate-waiver store), then renders:
//   1. SummaryStrip  — N instances · avg score · healthy / warning / critical
//   2. ScorecardTable — dense comparison table sorted by health score desc
//   3. ScoreDistribution — mini bar chart by health band
//
// Score formula (0–100, from /admin/reasoning/scorecard):
//   gates_component    = (gatesMet / max(gatesTotal, 1)) * 60
//   contradictions_cmp = (1 - min(activeContradictions / 5, 1)) * 30
//   baseline           = 10

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance scorecard · AbarVa Admin',
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
  pill: string;
  pillBg: string;
}

function bandPalette(band: ScoreBand): BandPalette {
  if (band === 'mint') return { pill: SHELL.MINT_TEXT, pillBg: SHELL.MINT_BG };
  if (band === 'amber') return { pill: SHELL.AMBER_DOT, pillBg: SHELL.PAPER_DEEP };
  return { pill: SHELL.RUST_TEXT, pillBg: SHELL.RUST_BG };
}

function healthPalette(label: InstanceHealthRow['healthLabel']): { bg: string; text: string } {
  if (label === 'healthy') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT };
  if (label === 'warning') return { bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT };
  if (label === 'critical') return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT };
}

// ─── Enriched row type ────────────────────────────────────────────────────────

interface EnrichedRow {
  row: InstanceHealthRow;
  score: number;
  evidenceCount: number;
  waiverCount: number;
}

// ─── Table styles ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 12,
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

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ enriched }: { enriched: EnrichedRow[] }) {
  const count = enriched.length;
  const avg =
    count === 0
      ? 0
      : Math.round(enriched.reduce((s, r) => s + r.score, 0) / count);
  const healthy = enriched.filter((r) => r.row.healthLabel === 'healthy').length;
  const warning = enriched.filter((r) => r.row.healthLabel === 'warning').length;
  const critical = enriched.filter((r) => r.row.healthLabel === 'critical').length;

  const sep = (
    <span
      aria-hidden="true"
      style={{ color: `${COLORS.ink}44`, fontFamily: TYPOGRAPHY.sans, fontSize: 13 }}
    >
      ·
    </span>
  );

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: COLORS.ink,
      }}
    >
      <span style={{ fontWeight: 600 }}>
        {count} instance{count === 1 ? '' : 's'}
      </span>
      {sep}
      <span>
        Avg score:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontWeight: 700,
            color: bandPalette(scoreBand(avg)).pill,
          }}
        >
          {avg}
        </span>
      </span>
      {sep}
      <span>
        <span style={{ color: SHELL.MINT_TEXT, fontWeight: 600 }}>{healthy} healthy</span>
      </span>
      {sep}
      <span>
        <span style={{ color: SHELL.AMBER_DOT, fontWeight: 600 }}>{warning} warning</span>
      </span>
      {sep}
      <span>
        <span style={{ color: SHELL.RUST_TEXT, fontWeight: 600 }}>{critical} critical</span>
      </span>
    </div>
  );
}

// ─── ScorePill ────────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  const { pill, pillBg } = bandPalette(scoreBand(score));
  return (
    <span
      style={{
        display: 'inline-block',
        background: pillBg,
        color: pill,
        border: `1px solid ${pill}33`,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {score}
    </span>
  );
}

// ─── HealthBadge ──────────────────────────────────────────────────────────────

function HealthBadge({ label }: { label: InstanceHealthRow['healthLabel'] }) {
  const { bg, text } = healthPalette(label);
  const display = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: text,
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

// ─── TypeBadge ────────────────────────────────────────────────────────────────

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
      {isSource ? 'Source' : 'Program'}
    </span>
  );
}

// ─── ScorecardTable ───────────────────────────────────────────────────────────

function ScorecardTable({ enriched }: { enriched: EnrichedRow[] }) {
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
          Full scorecard
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Sorted by health score descending. Score = gates (60 pts) + contradiction penalty (30 pts) + baseline (10 pts).
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 36, textAlign: 'center' }}>#</th>
              <th style={TH}>Instance</th>
              <th style={TH}>Stage / Phase</th>
              <th style={{ ...TH, textAlign: 'center' }}>Score</th>
              <th style={TH}>Gates</th>
              <th style={TH}>Contradictions</th>
              <th style={TH}>Evidence</th>
              <th style={TH}>Waivers</th>
              <th style={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map(({ row, score, evidenceCount, waiverCount }, idx) => {
              const stageOrPhase = row.stageLabel ?? row.phaseLabel ?? '—';
              const gatesDisplay =
                row.gatesTotal === 0 ? '—' : `${row.gatesMet} / ${row.gatesTotal}`;
              const hasContradictions = row.activeContradictions > 0;
              return (
                <tr key={row.id}>
                  <td
                    style={{
                      ...TD_MONO,
                      color: `${COLORS.ink}55`,
                      textAlign: 'center',
                      width: 36,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={TD}>
                    <a
                      href={`/admin/reasoning/instances/${row.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: SPACING.sm,
                          marginBottom: 2,
                        }}
                      >
                        <TypeBadge type={row.type} />
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.serif,
                            fontSize: 14,
                            fontWeight: 600,
                            color: COLORS.ink,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {row.label}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}66`,
                        }}
                      >
                        {row.id}
                      </div>
                    </a>
                  </td>
                  <td style={TD_MONO}>{stageOrPhase}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <ScorePill score={score} />
                  </td>
                  <td
                    style={{
                      ...TD_MONO,
                      fontWeight: row.gatesTotal > 0 ? 600 : undefined,
                    }}
                  >
                    {gatesDisplay}
                  </td>
                  <td
                    style={{
                      ...TD_MONO,
                      fontWeight: hasContradictions ? 700 : undefined,
                      color: hasContradictions ? SHELL.RUST_TEXT : `${COLORS.ink}55`,
                    }}
                  >
                    {row.activeContradictions}
                  </td>
                  <td style={TD_MONO}>{evidenceCount > 0 ? evidenceCount : '—'}</td>
                  <td
                    style={{
                      ...TD_MONO,
                      color: waiverCount > 0 ? SHELL.AMBER_DOT : `${COLORS.ink}55`,
                      fontWeight: waiverCount > 0 ? 600 : undefined,
                    }}
                  >
                    {waiverCount > 0 ? waiverCount : '—'}
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

// ─── ScoreDistribution ────────────────────────────────────────────────────────

interface BandCount {
  label: string;
  count: number;
  palette: BandPalette;
}

function ScoreDistribution({ enriched }: { enriched: EnrichedRow[] }) {
  const bands: BandCount[] = [
    {
      label: '≥ 70 — Mint',
      count: enriched.filter((r) => r.score >= 70).length,
      palette: bandPalette('mint'),
    },
    {
      label: '40–69 — Amber',
      count: enriched.filter((r) => r.score >= 40 && r.score < 70).length,
      palette: bandPalette('amber'),
    },
    {
      label: '< 40 — Rust',
      count: enriched.filter((r) => r.score < 40).length,
      palette: bandPalette('rust'),
    },
  ];

  const maxCount = Math.max(...bands.map((b) => b.count), 1);

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md}`,
          letterSpacing: '-0.01em',
        }}
      >
        Score distribution
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {bands.map((band) => {
          const pct = Math.round((band.count / maxCount) * 100);
          return (
            <div
              key={band.label}
              style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}
            >
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: band.palette.pill,
                  fontWeight: 600,
                  minWidth: 120,
                  flexShrink: 0,
                }}
              >
                {band.label}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 18,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: band.palette.pillBg,
                    borderRight: band.count > 0 ? `2px solid ${band.palette.pill}` : 'none',
                    borderRadius: RADIUS.sm,
                    minWidth: band.count > 0 ? 8 : 0,
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  color: band.count > 0 ? band.palette.pill : `${COLORS.ink}44`,
                  minWidth: 28,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {band.count}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstanceScorecardPage() {
  // 1. Load all health rows
  const rows = buildHealthBoardRows();

  // 2. Build per-instance evidence and waiver counts
  const allWaivers = getWaivers();
  const waiversByInstance = new Map<string, number>();
  for (const w of allWaivers) {
    waiversByInstance.set(w.instanceId, (waiversByInstance.get(w.instanceId) ?? 0) + 1);
  }

  // 3. Enrich rows
  const enriched: EnrichedRow[] = rows
    .map((row) => ({
      row,
      score: computeScore(row),
      evidenceCount: getEvidenceFor(row.id).length,
      waiverCount: waiversByInstance.get(row.id) ?? 0,
    }))
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
        subtitle="Full scorecard comparison for every fixture instance — health score, gate progress, contradictions, evidence items, and active waivers in one dense table."
      >
        <SummaryStrip enriched={enriched} />
        <ScorecardTable enriched={enriched} />
        <ScoreDistribution enriched={enriched} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
