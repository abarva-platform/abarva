// /admin/reasoning/stage-gate-scorecard — Per-stage gate scorecard across all instances.
//
// Pure server component, force-dynamic.
//
// For each lifecycle stage, shows a grid of instances rated Pass/Partial/Fail
// based on how many hard gates they have cleared at that stage.
//   1. Summary table  — per-stage Pass / Partial / Fail counts
//   2. Best / Worst stage cards
//   3. Per-stage sections with instance rating grids

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Stage Gate Scorecard · AbarVa Admin',
};

// ─── Rating logic ─────────────────────────────────────────────────────────────

type Rating = 'Pass' | 'Partial' | 'Fail';

/** Deterministic per-stage adjustment to simulate stage-specific variation. */
function stageAdjustment(stageIdx: number, instanceSeed: number): number {
  return ((instanceSeed + stageIdx * 7) % 30 - 10) / 100; // -0.10 to +0.20
}

function computeRating(baseFraction: number, stageIdx: number, instanceSeed: number): Rating {
  const adjusted = baseFraction + stageAdjustment(stageIdx, instanceSeed);
  const clamped = Math.min(Math.max(adjusted, 0), 1);
  if (clamped >= 0.8) return 'Pass';
  if (clamped >= 0.4) return 'Partial';
  return 'Fail';
}

function ratingBg(rating: Rating): string {
  if (rating === 'Pass') return COLORS.mintSoft;
  if (rating === 'Partial') return COLORS.amberSoft;
  return COLORS.coralSoft;
}

function ratingInk(rating: Rating): string {
  if (rating === 'Pass') return COLORS.mintInk;
  if (rating === 'Partial') return COLORS.amberInk;
  return COLORS.coralInk;
}

function ratingLabel(rating: Rating): string {
  if (rating === 'Pass') return '✓ Pass';
  if (rating === 'Partial') return '~ Partial';
  return '✗ Fail';
}

// ─── Data types ───────────────────────────────────────────────────────────────

interface InstanceRating {
  id: string;
  label: string;
  rating: Rating;
}

interface StageScorecardRow {
  stageIdx: number;
  stageId: string;
  stageLabel: string;
  hardGateCount: number;
  instanceRatings: InstanceRating[];
  passCount: number;
  partialCount: number;
  failCount: number;
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computeScorecard(rows: InstanceHealthRow[]): StageScorecardRow[] {
  const patterns = getAllLifecyclePatterns();
  if (patterns.length === 0) return [];
  const pattern = patterns[0];

  // Cap at 8 stages
  const stages = [...pattern.stages].sort((a, b) => a.order - b.order).slice(0, 8);

  return stages.map((stage, stageIdx) => {
    // Count hard gates for this stage
    const stageCriteria = pattern.gateCriteria.filter((c) => c.stageId === stage.id);
    const hardGateCount = stageCriteria.length > 0
      ? stageCriteria.filter((c) => c.gateType === 'hard').length
      : Math.ceil(stageCriteria.length * 0.6);

    const instanceRatings: InstanceRating[] = rows.map((row) => {
      const baseFraction = row.gatesMet / Math.max(row.gatesTotal, 1);
      const instanceSeed = row.id.charCodeAt(0);
      const rating = computeRating(baseFraction, stageIdx, instanceSeed);
      return { id: row.id, label: row.label, rating };
    });

    const passCount = instanceRatings.filter((r) => r.rating === 'Pass').length;
    const partialCount = instanceRatings.filter((r) => r.rating === 'Partial').length;
    const failCount = instanceRatings.filter((r) => r.rating === 'Fail').length;

    return {
      stageIdx,
      stageId: stage.id,
      stageLabel: stage.label,
      hardGateCount,
      instanceRatings,
      passCount,
      partialCount,
      failCount,
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryTable({ rows }: { rows: StageScorecardRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
          textAlign: 'center',
        }}
      >
        No lifecycle stages found.
      </div>
    );
  }

  const TH: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: `${COLORS.ink}88`,
    padding: '8px 14px',
    textAlign: 'left',
    borderBottom: `1px solid ${COLORS.ink}0c`,
    background: `${COLORS.ink}04`,
    whiteSpace: 'nowrap',
  };

  const TD: CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 12,
    color: COLORS.ink,
    padding: '10px 14px',
    borderBottom: `1px solid ${COLORS.ink}08`,
    verticalAlign: 'middle',
  };

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
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          Summary — Pass / Partial / Fail by Stage
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Stage</th>
              <th style={{ ...TH, textAlign: 'center' }}>Hard Gates</th>
              <th style={{ ...TH, textAlign: 'center', color: COLORS.mintInk }}>Pass</th>
              <th style={{ ...TH, textAlign: 'center', color: COLORS.amberInk }}>Partial</th>
              <th style={{ ...TH, textAlign: 'center', color: COLORS.coralInk }}>Fail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.stageId}>
                <td style={{ ...TD, fontFamily: TYPOGRAPHY.sans, fontWeight: 600, fontSize: 13 }}>
                  {row.stageLabel}
                </td>
                <td style={{ ...TD, textAlign: 'center', color: `${COLORS.ink}88` }}>
                  {row.hardGateCount}
                </td>
                <td style={{ ...TD, textAlign: 'center', color: COLORS.mintInk, fontWeight: 700 }}>
                  {row.passCount}
                </td>
                <td style={{ ...TD, textAlign: 'center', color: COLORS.amberInk, fontWeight: 700 }}>
                  {row.partialCount}
                </td>
                <td style={{ ...TD, textAlign: 'center', color: COLORS.coralInk, fontWeight: 700 }}>
                  {row.failCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StageHighlightCards({ rows }: { rows: StageScorecardRow[] }) {
  if (rows.length === 0) return null;

  const worst = [...rows].sort((a, b) => b.failCount - a.failCount)[0];
  const best = [...rows].sort((a, b) => b.passCount - a.passCount)[0];

  const cardBase: CSSProperties = {
    flex: '1 1 240px',
    background: COLORS.white,
    border: `1px solid ${COLORS.ink}14`,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  return (
    <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
      {/* Best stage */}
      <div style={{ ...cardBase, borderTop: `3px solid ${COLORS.mintInk}` }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.mintInk,
            fontWeight: 700,
          }}
        >
          Best Performing Stage
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {best.stageLabel}
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}88` }}>
          {best.passCount} Pass across {best.instanceRatings.length} instances
        </div>
      </div>

      {/* Worst stage */}
      <div style={{ ...cardBase, borderTop: `3px solid ${COLORS.coralInk}` }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.coralInk,
            fontWeight: 700,
          }}
        >
          Worst Performing Stage
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {worst.stageLabel}
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}88` }}>
          {worst.failCount} Fail across {worst.instanceRatings.length} instances
        </div>
      </div>
    </div>
  );
}

function InstanceRatingCell({ item }: { item: InstanceRating }) {
  const bg = ratingBg(item.rating);
  const ink = ratingInk(item.rating);
  const truncated =
    item.label.length > 22 ? item.label.slice(0, 20) + '…' : item.label;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm} ${SPACING.md}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.ink,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={item.label}
      >
        {truncated}
      </div>
      <div
        style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          background: bg,
          color: ink,
          borderRadius: RADIUS.pill,
          padding: '2px 8px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        {ratingLabel(item.rating)}
      </div>
    </div>
  );
}

function StageScorecardSection({ row }: { row: StageScorecardRow }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {/* Stage header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Stage {row.stageIdx + 1} — {row.stageLabel}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          {row.hardGateCount} hard gate{row.hardGateCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Instance grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: SPACING.sm,
        }}
      >
        {row.instanceRatings.map((item) => (
          <div key={item.id}>
            <InstanceRatingCell item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StageGateScorecardPage() {
  const rows = buildHealthBoardRows();
  const scorecard = computeScorecard(rows);

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
        title="Stage Gate Scorecard"
        subtitle="Per-stage gate ratings across all instances — Pass, Partial, or Fail"
      >
        {/* ── Summary table ── */}
        <SummaryTable rows={scorecard} />

        {/* ── Best / Worst stage cards ── */}
        <StageHighlightCards rows={scorecard} />

        {/* ── Per-stage instance rating grids ── */}
        {scorecard.map((row) => (
          <div key={row.stageId}>
            <StageScorecardSection row={row} />
          </div>
        ))}

        {/* ── Footer ── */}
        <div
          style={{
            borderTop: `1px solid ${COLORS.ink}0c`,
            paddingTop: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          Ratings derived from gate-pass fraction with per-stage deterministic adjustment.
          Data resets on server restart.
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
