import { getStageStateLabel } from '@/lib/source/lifecycle';
import type { WorkflowStage } from '@/lib/source/types';
import { SHELL } from '@/lib/shell/shell-tokens';

const sourceCard = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
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

export function SourceJourneyTracker({ stages }: { stages: WorkflowStage[] }) {
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
        <div style={{ ...sourceMuted, maxWidth: 360, color: SHELL.INK_MUTED }}>
          Stages are read-only in this shell. Blocked and waiting states explain what Nexus needs before movement.
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, minmax(120px, 1fr))`,
          gap: 10,
          overflowX: 'auto',
        }}
      >
        {stages.map((stage, index) => (
          <div
            key={stage.key}
            style={{
              border: '1px solid ' + stageBorder(stage),
              borderRadius: 12,
              padding: '12px 13px',
              background: stageBackground(stage),
              minWidth: 120,
              display: 'grid',
              gap: 7,
            }}
          >
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
              Step {index + 1}
            </div>
            <div style={{ fontWeight: 800, color: SHELL.INK }}>{stage.label}</div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: stageColor(stage),
              }}
            >
              {getStageStateLabel(stage.status)}
            </div>
            {stage.gate.blocker ? (
              <div style={{ ...sourceMuted, color: SHELL.RUST_TEXT, fontSize: '12px' }}>
                {stage.gate.blocker}
              </div>
            ) : null}
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
