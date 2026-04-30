'use client';

import { getStageStateLabel } from '@/lib/source/lifecycle';
import type { WorkflowStage } from '@/lib/source/types';
import { SHELL } from '@/lib/shell/shell-tokens';

const sourceCard = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 10,
};

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

const sourceMuted = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

export interface SourceJourneyTrackerProps {
  stages: WorkflowStage[];
  /**
   * Optional callback fired when the user clicks "View synthesis →" on a stage
   * chip. Receives the stage `key` (SourceStageKey) and the stage `label` so
   * the caller can map to the lifecycle-pattern stage id for
   * StageSynthesisDrawer.
   */
  onSynthesisClick?: (stageKey: string, stageLabel: string) => void;
}

export function SourceJourneyTracker({ stages, onSynthesisClick }: SourceJourneyTrackerProps) {
  return (
    <section
      style={{
        ...sourceCard,
        background: SHELL.CARD_WHITE,
        border: '1px solid ' + SHELL.CARD_LINE,
        gap: 14,
      }}
      aria-label="Source journey tracker"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Journey map</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: SHELL.INK }}>
            Current workflow position
          </div>
        </div>
        <div style={{ ...sourceMuted, maxWidth: 340, color: SHELL.INK_MUTED, fontSize: 12 }}>
          Stages are read-only in this shell. Blocked and waiting states explain what Nexus needs before movement.
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, minmax(96px, 1fr))`,
          gap: 8,
          overflowX: 'auto',
        }}
      >
        {stages.map((stage, index) => (
          <div
            key={stage.key}
            style={{
              border: '1px solid ' + stageBorder(stage),
              borderRadius: 12,
              padding: '8px 10px',
              background: stageBackground(stage),
              minWidth: 96,
              display: 'grid',
              gap: 5,
            }}
          >
            <div style={{ fontFamily: SHELL.SANS, fontSize: 10.5, lineHeight: 1.25, color: SHELL.INK_MUTED }}>
              Step {index + 1}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.2, fontWeight: 800, color: SHELL.INK }}>{stage.label}</div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: stageColor(stage),
              }}
            >
              {getStageStateLabel(stage.status)}
            </div>
            {stage.gate.blocker ? (
              <div style={{ ...sourceMuted, color: SHELL.RUST_TEXT, fontSize: '11px', lineHeight: 1.25 }}>
                {stage.gate.blocker}
              </div>
            ) : null}
            {onSynthesisClick && (
              <button
                type="button"
                data-testid={`stage-synthesis-trigger-${stage.key}`}
                onClick={() => onSynthesisClick(stage.key, stage.label)}
                style={{
                  marginTop: 4,
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  letterSpacing: '0.06em',
                  color: SHELL.INK_MUTED,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  lineHeight: 1.4,
                }}
              >
                View synthesis →
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function stageColor(stage: WorkflowStage): string {
  if (stage.status === 'blocked') return SHELL.RUST_TEXT;
  if (stage.status === 'needs_approval') return SHELL.PEACH_TEXT;
  if (stage.status === 'complete') return SHELL.MINT_TEXT;
  if (stage.status === 'active' || stage.status === 'reopened') return SHELL.INK_MID;
  return SHELL.INK_MUTED;
}

function stageBorder(stage: WorkflowStage): string {
  if (stage.status === 'blocked') return SHELL.PEACH_LINE;
  if (stage.status === 'active' || stage.status === 'reopened') return SHELL.BLUE_LINE;
  if (stage.status === 'complete') return SHELL.MINT_LINE;
  if (stage.status === 'needs_approval') return SHELL.PEACH_LINE;
  return SHELL.CARD_LINE;
}

function stageBackground(stage: WorkflowStage): string {
  if (stage.status === 'blocked') return SHELL.RUST_BG;
  if (stage.status === 'active' || stage.status === 'reopened') return SHELL.BLUE_BG;
  if (stage.status === 'complete') return SHELL.MINT_BG;
  if (stage.status === 'needs_approval') return SHELL.PEACH_BG;
  return SHELL.PAPER_SOFT;
}
