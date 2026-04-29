// /admin/reasoning/instance-deep-dive — Comprehensive per-instance deep-dive.
//
// Pure server component. For each instance (up to 12, sorted by health score
// descending) renders a card with:
//   - Header row: name, health badge, benchmark rating chip, current stage pill
//   - Metrics grid (2×3): health score, gates, waivers, contradictions, evidence, stages remaining
//   - Stage track: condensed horizontal pipeline (max 6 stages, 48px per cell)
//   - Synthesis advisory: 1–2 sentence deterministic summary
//   - Waiver list (if any)
//
// Above the cards: a summary bar. Below: a footer nav link.

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance Deep Dive · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_INSTANCES = 12;
const MAX_STAGE_CELLS = 6;
const STAGE_CELL_WIDTH = 48;

// ─── Score / rating helpers ───────────────────────────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

type BenchmarkRating = 'Outperforming' | 'Above avg' | 'Below avg' | 'Underperforming';

function benchmarkRating(score: number): BenchmarkRating {
  if (score >= 75) return 'Outperforming';
  if (score >= 60) return 'Above avg';
  if (score >= 45) return 'Below avg';
  return 'Underperforming';
}

function benchmarkPalette(rating: BenchmarkRating): { bg: string; text: string; border: string } {
  if (rating === 'Outperforming') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, border: `${SHELL.MINT_TEXT}33` };
  if (rating === 'Above avg') return { bg: COLORS.skyPale, text: COLORS.navy, border: `${COLORS.navy}33` };
  if (rating === 'Below avg') return { bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT, border: `${SHELL.AMBER_DOT}33` };
  return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, border: `${SHELL.RUST_TEXT}33` };
}

function healthPalette(label: InstanceHealthRow['healthLabel']): { bg: string; text: string } {
  if (label === 'healthy') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT };
  if (label === 'warning') return { bg: SHELL.PAPER_DEEP, text: SHELL.AMBER_DOT };
  if (label === 'critical') return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT };
}

// ─── Stage track helpers ──────────────────────────────────────────────────────

type StageStatus = 'complete' | 'active' | 'upcoming';

interface StageCell {
  label: string;
  status: StageStatus;
}

function buildStageCells(
  currentStageLabel: string | null,
  refStages: Array<{ label: string; order: number }>,
): { cells: StageCell[]; stagesRemaining: number } {
  const capped = [...refStages].sort((a, b) => a.order - b.order).slice(0, MAX_STAGE_CELLS);
  const needle = (currentStageLabel ?? '').toLowerCase();
  let activeIdx = capped.findIndex(
    (s) => s.label.toLowerCase() === needle || s.label.toLowerCase().startsWith(needle.slice(0, 4)),
  );
  if (activeIdx < 0) activeIdx = 0;

  const cells: StageCell[] = capped.map((s, idx) => ({
    label: s.label.slice(0, 5),
    status: idx < activeIdx ? 'complete' : idx === activeIdx ? 'active' : 'upcoming',
  }));

  const stagesRemaining = Math.max(0, capped.length - activeIdx - 1);
  return { cells, stagesRemaining };
}

// ─── Synthesis advisory ───────────────────────────────────────────────────────

function buildAdvisory(row: InstanceHealthRow): string {
  const gatePct =
    row.gatesTotal === 0
      ? 0
      : Math.round((row.gatesMet / row.gatesTotal) * 100);
  const stage = row.stageLabel ?? row.phaseLabel ?? 'current stage';
  const contPart =
    row.activeContradictions > 0
      ? 'Active contradictions require resolution.'
      : 'No active contradictions.';
  return `This instance has met ${gatePct}% of gate criteria at ${stage}. ${contPart}`;
}

// ─── Enriched record ─────────────────────────────────────────────────────────

interface DeepDiveRow {
  row: InstanceHealthRow;
  score: number;
  rating: BenchmarkRating;
  evidenceCount: number;
  waivers: Array<{ criterionId: string; reason: string }>;
  stages: StageCell[];
  stagesRemaining: number;
  advisory: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthBadge({ label }: { label: InstanceHealthRow['healthLabel'] }) {
  const { bg, text } = healthPalette(label);
  const display = label.charAt(0).toUpperCase() + label.slice(1);
  const pillStyle: CSSProperties = {
    display: 'inline-block',
    background: bg,
    color: text,
    borderRadius: RADIUS.pill,
    padding: '2px 10px',
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };
  return <span style={pillStyle}>{display}</span>;
}

function BenchmarkChip({ rating }: { rating: BenchmarkRating }) {
  const { bg, text, border } = benchmarkPalette(rating);
  const chipStyle: CSSProperties = {
    display: 'inline-block',
    background: bg,
    color: text,
    border: `1px solid ${border}`,
    borderRadius: RADIUS.pill,
    padding: '2px 10px',
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };
  return <span style={chipStyle}>{rating}</span>;
}

function StagePill({ label }: { label: string }) {
  const pillStyle: CSSProperties = {
    display: 'inline-block',
    background: SHELL.BLUE_BG,
    color: SHELL.INK_MID,
    border: `1px solid ${SHELL.BLUE_LINE}`,
    borderRadius: RADIUS.pill,
    padding: '2px 10px',
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 11,
    whiteSpace: 'nowrap',
  };
  return <span style={pillStyle}>{label}</span>;
}

function MetricCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const cellStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    background: COLORS.cream,
    borderRadius: RADIUS.sm,
  };
  return (
    <div style={cellStyle}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          color: `${COLORS.ink}77`,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          fontWeight: 700,
          color: accent ?? COLORS.ink,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StageTrack({ cells }: { cells: StageCell[] }) {
  const trackStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    overflowX: 'auto',
  };

  return (
    <div style={trackStyle}>
      {cells.map((cell, idx) => {
        const isComplete = cell.status === 'complete';
        const isActive = cell.status === 'active';

        const bg = isComplete
          ? SHELL.MINT_BG
          : isActive
            ? COLORS.navy
            : `${COLORS.ink}08`;
        const fg = isComplete
          ? SHELL.MINT_TEXT
          : isActive
            ? COLORS.white
            : `${COLORS.ink}55`;
        const icon = isComplete ? '✓' : isActive ? '▶' : '–';

        const cellStyle: CSSProperties = {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: STAGE_CELL_WIDTH,
          height: 40,
          borderRadius: RADIUS.sm,
          background: bg,
          flexShrink: 0,
          gap: 2,
        };
        const iconStyle: CSSProperties = {
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: fg,
          lineHeight: 1,
        };
        const lblStyle: CSSProperties = {
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 9,
          color: fg,
          letterSpacing: '0.04em',
          textAlign: 'center',
          lineHeight: 1,
          maxWidth: STAGE_CELL_WIDTH - 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        };

        return (
          <div key={idx} style={cellStyle} title={cell.label}>
            <span style={iconStyle}>{icon}</span>
            <span style={lblStyle}>{cell.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function WaiverList({ waivers }: { waivers: Array<{ criterionId: string; reason: string }> }) {
  if (waivers.length === 0) return null;
  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };
  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 11,
    color: `${COLORS.ink}cc`,
  };
  const chipStyle: CSSProperties = {
    display: 'inline-block',
    background: SHELL.PAPER_DEEP,
    color: SHELL.AMBER_DOT,
    border: `1px solid ${SHELL.AMBER_DOT}33`,
    borderRadius: RADIUS.pill,
    padding: '1px 8px',
    fontSize: 10,
    fontFamily: TYPOGRAPHY.sans,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
  return (
    <div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: SHELL.AMBER_DOT,
          marginBottom: 6,
        }}
      >
        Active Waivers
      </div>
      <div style={listStyle}>
        {waivers.map((w, i) => (
          <div key={i} style={itemStyle}>
            <span>{w.criterionId}</span>
            <span style={chipStyle}>Waiver granted</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstanceCard({ data, rank }: { data: DeepDiveRow; rank: number }) {
  const { row, score, rating, evidenceCount, waivers, stages, stagesRemaining, advisory } = data;
  const stageDisplay = row.stageLabel ?? row.phaseLabel ?? '—';
  const gatesPct =
    row.gatesTotal === 0 ? 0 : Math.round((row.gatesMet / row.gatesTotal) * 100);

  const cardStyle: CSSProperties = {
    background: COLORS.white,
    border: `1px solid ${COLORS.ink}14`,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  };
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderBottom: `1px solid ${COLORS.ink}0a`,
    background: SHELL.PAPER,
  };
  const bodyStyle: CSSProperties = {
    padding: `${SPACING.md} ${SPACING.lg}`,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.md,
  };
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: SPACING.xs,
  };
  const advisoryStyle: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 12,
    color: `${COLORS.ink}cc`,
    lineHeight: 1.6,
    background: `${COLORS.ink}04`,
    borderLeft: `3px solid ${COLORS.ink}22`,
    padding: `${SPACING.xs} ${SPACING.sm}`,
    borderRadius: `0 ${RADIUS.sm} ${RADIUS.sm} 0`,
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}55`,
            paddingTop: 1,
            flexShrink: 0,
          }}
        >
          #{rank}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            flex: 1,
            minWidth: 120,
          }}
        >
          {row.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' }}>
          <HealthBadge label={row.healthLabel} />
          <BenchmarkChip rating={rating} />
          <StagePill label={stageDisplay} />
        </div>
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        {/* Metrics grid — 2×3 */}
        <div style={gridStyle}>
          <MetricCell
            label="Health Score"
            value={`${score}`}
            accent={
              score >= 70
                ? SHELL.MINT_TEXT
                : score >= 40
                  ? SHELL.AMBER_DOT
                  : SHELL.RUST_TEXT
            }
          />
          <MetricCell
            label="Gates Met"
            value={`${row.gatesMet}/${row.gatesTotal} (${gatesPct}%)`}
          />
          <MetricCell
            label="Waivers"
            value={`${waivers.length}`}
            accent={waivers.length > 0 ? SHELL.AMBER_DOT : undefined}
          />
          <MetricCell
            label="Contradictions"
            value={`${row.activeContradictions}`}
            accent={row.activeContradictions > 0 ? SHELL.RUST_TEXT : undefined}
          />
          <MetricCell
            label="Evidence"
            value={`${evidenceCount} item${evidenceCount === 1 ? '' : 's'}`}
          />
          <MetricCell
            label="Stages Left"
            value={`${stagesRemaining}`}
          />
        </div>

        {/* Stage track */}
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}66`,
              marginBottom: 6,
            }}
          >
            Stage Track
          </div>
          <StageTrack cells={stages} />
        </div>

        {/* Synthesis advisory */}
        <p style={advisoryStyle}>{advisory}</p>

        {/* Waiver list (conditional) */}
        <WaiverList waivers={waivers} />
      </div>
    </div>
  );
}

function SummaryBar({
  shown,
  total,
  avgHealth,
  onTrack,
}: {
  shown: number;
  total: number;
  avgHealth: number;
  onTrack: number;
}) {
  const barStyle: CSSProperties = {
    background: SHELL.CARD_WHITE,
    border: `1px solid ${SHELL.CARD_LINE}`,
    borderRadius: RADIUS.lg,
    padding: `${SPACING.md} ${SPACING.lg}`,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.md,
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    color: COLORS.ink,
  };
  const sep = (
    <span aria-hidden="true" style={{ color: `${COLORS.ink}44` }}>·</span>
  );

  return (
    <div style={barStyle}>
      <span style={{ fontWeight: 600 }}>
        {shown} instance{shown === 1 ? '' : 's'} shown
      </span>
      {sep}
      <span>
        Avg health:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontWeight: 700,
            color:
              avgHealth >= 70
                ? SHELL.MINT_TEXT
                : avgHealth >= 40
                  ? SHELL.AMBER_DOT
                  : SHELL.RUST_TEXT,
          }}
        >
          {avgHealth}
        </span>
      </span>
      {sep}
      <span>
        On track:{' '}
        <span style={{ fontWeight: 700, color: SHELL.MINT_TEXT }}>{onTrack}</span>
      </span>
      {sep}
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}77` }}>
        Showing first {shown} of {total} instances, sorted by health descending
      </span>
    </div>
  );
}

function FooterNav() {
  const style: CSSProperties = {
    background: `${COLORS.ink}04`,
    border: `1px solid ${COLORS.ink}10`,
    borderRadius: RADIUS.lg,
    padding: `${SPACING.md} ${SPACING.lg}`,
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    color: `${COLORS.ink}88`,
  };
  return (
    <div style={style}>
      For full portfolio view, see{' '}
      <a
        href="/admin/reasoning/program-health-report"
        style={{ color: COLORS.navy, textDecoration: 'underline' }}
      >
        Program Health Report
      </a>{' '}
      (/admin/reasoning/program-health-report)
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstanceDeepDivePage() {
  // 1. Load all health rows
  const rows = buildHealthBoardRows();

  // 2. Load waivers
  const allWaivers = getWaivers();
  const waiversByInstance = new Map<string, Array<{ criterionId: string; reason: string }>>();
  for (const w of allWaivers) {
    if (!waiversByInstance.has(w.instanceId)) {
      waiversByInstance.set(w.instanceId, []);
    }
    waiversByInstance.get(w.instanceId)!.push({ criterionId: w.criterionId, reason: w.reason });
  }

  // 3. Build reference stage list from lifecycle patterns
  const allPatterns = getAllLifecyclePatterns();
  const refStages =
    allPatterns.length > 0
      ? [...allPatterns[0].stages].sort((a, b) => a.order - b.order)
      : [];

  // 4. Enrich and sort
  const enriched: DeepDiveRow[] = rows
    .map((row) => {
      const score = computeScore(row);
      const stageLabel = row.stageLabel ?? row.phaseLabel ?? null;
      const { cells, stagesRemaining } = buildStageCells(stageLabel, refStages);
      return {
        row,
        score,
        rating: benchmarkRating(score),
        evidenceCount: getEvidenceFor(row.id).length,
        waivers: waiversByInstance.get(row.id) ?? [],
        stages: cells,
        stagesRemaining,
        advisory: buildAdvisory(row),
      };
    })
    .sort((a, b) => b.score - a.score);

  const total = enriched.length;
  const sliced = enriched.slice(0, MAX_INSTANCES);
  const avgHealth =
    sliced.length === 0
      ? 0
      : Math.round(sliced.reduce((s, r) => s + r.score, 0) / sliced.length);
  const onTrack = sliced.filter((r) => r.score >= 70).length;

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
        title="Instance Deep Dive"
        subtitle="Comprehensive per-instance metrics — health, gates, waivers, contradictions, evidence, and stage status"
      >
        <SummaryBar shown={sliced.length} total={total} avgHealth={avgHealth} onTrack={onTrack} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          {sliced.map((data, idx) => (
            <div key={data.row.id}>
              <InstanceCard data={data} rank={idx + 1} />
            </div>
          ))}
        </div>

        <FooterNav />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
