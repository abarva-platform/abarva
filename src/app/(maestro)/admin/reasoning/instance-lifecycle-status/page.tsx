// /admin/reasoning/instance-lifecycle-status — Visual pipeline showing current
// stage position for every instance: completed, active, and upcoming stages at
// a glance.
//
// Pure server component — no client JS needed.

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance Lifecycle Status · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum stages to show per row. Wider tracks are clipped. */
const MAX_STAGES = 8;

// ─── Types ────────────────────────────────────────────────────────────────────

type StageStatus = 'complete' | 'active' | 'upcoming';

interface StageCell {
  label: string;
  status: StageStatus;
}

interface PipelineRow {
  id: string;
  label: string;
  healthLabel: 'healthy' | 'warning' | 'critical' | 'unknown';
  healthScore: number;
  stageIndex: number;
  totalStages: number;
  stages: StageCell[];
  stagesRemaining: number;
}

// ─── Derive health score from label ──────────────────────────────────────────

function labelToScore(label: PipelineRow['healthLabel']): number {
  if (label === 'healthy') return 88;
  if (label === 'warning') return 62;
  if (label === 'critical') return 32;
  return 50;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildPipelineRows(): PipelineRow[] {
  const rows = buildHealthBoardRows();
  // Use the first lifecycle pattern's stages as a reference stage list.
  const allPatterns = getAllLifecyclePatterns();
  const refStages =
    allPatterns.length > 0
      ? [...allPatterns[0].stages].sort((a, b) => a.order - b.order)
      : [];

  return rows.map((row) => {
    // Determine stageIndex by matching the row's current stage label against
    // the reference stage list. Fall back to index 0 when no match.
    const stageLabel = row.stageLabel ?? row.phaseLabel ?? '';
    let stageIndex = refStages.findIndex(
      (s) =>
        s.label.toLowerCase() === stageLabel.toLowerCase() ||
        s.id === stageLabel,
    );
    if (stageIndex < 0) stageIndex = 0;

    const cappedStages = refStages.slice(0, MAX_STAGES);
    const totalStages = cappedStages.length;

    const stages: StageCell[] = cappedStages.map((s, idx) => {
      let status: StageStatus;
      if (idx < stageIndex) {
        status = 'complete';
      } else if (idx === stageIndex) {
        status = 'active';
      } else {
        status = 'upcoming';
      }
      return { label: s.label.slice(0, 6), status };
    });

    const stagesRemaining = Math.max(0, totalStages - stageIndex - 1);
    const healthScore = labelToScore(row.healthLabel);

    return {
      id: row.id,
      label: row.label,
      healthLabel: row.healthLabel,
      healthScore,
      stageIndex,
      totalStages,
      stages,
      stagesRemaining,
    };
  });
}

// ─── FleetStats ───────────────────────────────────────────────────────────────

function FleetStats({ pipelineRows }: { pipelineRows: PipelineRow[] }) {
  const early = pipelineRows.filter((r) => r.stageIndex <= 1).length;
  const mid = pipelineRows.filter((r) => r.stageIndex >= 2 && r.stageIndex <= 4).length;
  const late = pipelineRows.filter((r) => r.stageIndex >= 5 && r.stagesRemaining !== 0).length;
  const final = pipelineRows.filter((r) => r.stagesRemaining === 0).length;

  const statStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
    minWidth: 100,
    padding: `${SPACING.sm} ${SPACING.md}`,
  };
  const numStyle: CSSProperties = {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: 32,
    color: COLORS.ink,
    letterSpacing: '-0.02em',
    lineHeight: 1,
  };
  const capStyle: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: SHELL.INK_SOFT,
    textAlign: 'center',
  };

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        alignItems: 'stretch',
        justifyContent: 'space-around',
      }}
    >
      <div style={statStyle}>
        <span style={numStyle}>{early}</span>
        <span style={capStyle}>Early stages{'\n'}(0–1)</span>
      </div>
      <div
        aria-hidden="true"
        style={{ alignSelf: 'center', color: SHELL.CARD_LINE, fontFamily: TYPOGRAPHY.mono }}
      >
        |
      </div>
      <div style={statStyle}>
        <span style={numStyle}>{mid}</span>
        <span style={capStyle}>Mid stages{'\n'}(2–4)</span>
      </div>
      <div
        aria-hidden="true"
        style={{ alignSelf: 'center', color: SHELL.CARD_LINE, fontFamily: TYPOGRAPHY.mono }}
      >
        |
      </div>
      <div style={statStyle}>
        <span style={numStyle}>{late}</span>
        <span style={capStyle}>Late stages{'\n'}(5+)</span>
      </div>
      <div
        aria-hidden="true"
        style={{ alignSelf: 'center', color: SHELL.CARD_LINE, fontFamily: TYPOGRAPHY.mono }}
      >
        |
      </div>
      <div style={statStyle}>
        <span style={numStyle}>{final}</span>
        <span style={capStyle}>At final{'\n'}stage</span>
      </div>
    </div>
  );
}

// ─── HealthBadge ──────────────────────────────────────────────────────────────

function HealthBadge({ label, score }: { label: PipelineRow['healthLabel']; score: number }) {
  const bg =
    label === 'healthy'
      ? SHELL.MINT_BG
      : label === 'warning'
        ? SHELL.PEACH_BG
        : label === 'critical'
          ? SHELL.RUST_BG
          : SHELL.GRAY_BG;
  const fg =
    label === 'healthy'
      ? SHELL.MINT_TEXT
      : label === 'warning'
        ? SHELL.PEACH_TEXT
        : label === 'critical'
          ? SHELL.RUST_TEXT
          : SHELL.GRAY_TEXT;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {score}
    </span>
  );
}

// ─── StagePill ────────────────────────────────────────────────────────────────

function StagePill({ cell }: { cell: StageCell }) {
  let pillStyle: CSSProperties;
  let prefix: string;

  if (cell.status === 'complete') {
    pillStyle = {
      background: SHELL.MINT_BG,
      color: SHELL.MINT_TEXT,
      border: `1px solid ${SHELL.MINT_LINE}`,
      fontWeight: 600,
    };
    prefix = '✓';
  } else if (cell.status === 'active') {
    pillStyle = {
      background: 'transparent',
      color: SHELL.MINT_TEXT,
      border: `2px solid ${SHELL.MINT_TEXT}`,
      fontWeight: 700,
    };
    prefix = '▶';
  } else {
    pillStyle = {
      background: SHELL.PAPER_SOFT,
      color: SHELL.INK_MUTED,
      border: `1px solid ${SHELL.CARD_LINE}`,
      fontWeight: 400,
    };
    prefix = '–';
  }

  return (
    <div
      style={{
        width: 60,
        flexShrink: 0,
        borderRadius: RADIUS.sm,
        padding: '4px 2px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        textAlign: 'center',
        ...pillStyle,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 8 }}>
        {prefix}
      </span>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 54,
          display: 'block',
        }}
      >
        {cell.label}
      </span>
    </div>
  );
}

// ─── InstancePipelineRow ──────────────────────────────────────────────────────

function InstancePipelineRow({ row }: { row: PipelineRow }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: `${SPACING.sm} ${SPACING.md}`,
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        flexWrap: 'wrap',
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 600,
          color: SHELL.INK,
          width: 120,
          flexShrink: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={row.label}
      >
        {row.label}
      </span>

      {/* Health badge */}
      <HealthBadge label={row.healthLabel} score={row.healthScore} />

      {/* Stage track */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
        }}
      >
        {row.stages.map((cell, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <StagePill cell={cell} />
            {idx < row.stages.length - 1 && (
              <span
                aria-hidden="true"
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                  flexShrink: 0,
                }}
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Completion projection */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: SHELL.INK_SOFT,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          marginLeft: SPACING.sm,
        }}
      >
        {row.stagesRemaining === 0 ? 'Final stage' : `${row.stagesRemaining} to completion`}
      </span>
    </div>
  );
}

// ─── BottleneckAnalysis ───────────────────────────────────────────────────────

function BottleneckAnalysis({ pipelineRows }: { pipelineRows: PipelineRow[] }) {
  const allPatterns = getAllLifecyclePatterns();
  const refStages =
    allPatterns.length > 0
      ? [...allPatterns[0].stages].sort((a, b) => a.order - b.order).slice(0, MAX_STAGES)
      : [];

  // Count how many instances are at each stage index.
  const countsByStage: number[] = refStages.map((_, idx) =>
    pipelineRows.filter((r) => r.stageIndex === idx).length,
  );

  const maxCount = Math.max(...countsByStage, 1);
  const crowdedIdx = countsByStage.indexOf(Math.max(...countsByStage));
  const crowdedStage = refStages[crowdedIdx];
  const crowdedCount = countsByStage[crowdedIdx] ?? 0;

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
            fontSize: 18,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Bottleneck analysis
        </h2>
        {crowdedStage !== undefined && crowdedCount > 0 && (
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.INK_SOFT,
            }}
          >
            Most crowded stage: <strong>{crowdedStage.label}</strong> ({crowdedCount} instance
            {crowdedCount === 1 ? '' : 's'})
          </span>
        )}
      </header>
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          height: 120,
        }}
      >
        {refStages.map((stage, idx) => {
          const count = countsByStage[idx] ?? 0;
          const pct = (count / maxCount) * 100;
          const isCrowded = idx === crowdedIdx && count > 0;
          return (
            <div
              key={stage.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: isCrowded ? SHELL.MINT_TEXT : SHELL.INK_SOFT,
                  fontWeight: isCrowded ? 700 : 400,
                }}
              >
                {count}
              </span>
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(4, pct)}%`,
                  background: isCrowded ? SHELL.MINT_BG : SHELL.PAPER_SOFT,
                  border: `1px solid ${isCrowded ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
                  borderRadius: `${RADIUS.sm} ${RADIUS.sm} 0 0`,
                  transition: 'height 0.2s',
                }}
              />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                  textAlign: 'center',
                  maxWidth: 48,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={stage.label}
              >
                {stage.label.slice(0, 6)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── InstancePipelineSection ──────────────────────────────────────────────────

function InstancePipelineSection({ pipelineRows }: { pipelineRows: PipelineRow[] }) {
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
            fontSize: 18,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Instance pipelines
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {pipelineRows.length} instance{pipelineRows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div>
        {pipelineRows.length === 0 ? (
          <div
            style={{
              padding: SPACING.lg,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}99`,
            }}
          >
            No instances found.
          </div>
        ) : (
          pipelineRows.map((row) => (
            <div key={row.id}>
              <InstancePipelineRow row={row} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstanceLifecycleStatusPage() {
  const pipelineRows = buildPipelineRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Lifecycle map"
          primaryActionHref="/admin/reasoning/lifecycle-map"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Lifecycle"
        title="Instance Lifecycle Status"
        subtitle="Current stage position for all instances — completed, active, and upcoming stages at a glance"
      >
        <FleetStats pipelineRows={pipelineRows} />
        <InstancePipelineSection pipelineRows={pipelineRows} />
        <BottleneckAnalysis pipelineRows={pipelineRows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
