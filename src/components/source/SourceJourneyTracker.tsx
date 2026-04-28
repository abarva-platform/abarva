import { getStageStateLabel } from '@/lib/source/lifecycle';
import type { WorkflowStage } from '@/lib/source/types';
import { EXPERIENCE_COLORS, FONTS, TEXT } from '@/lib/design-system';
import { sourceCard, sourceMuted, sourceSectionLabel } from './foundationStyles';

export function SourceJourneyTracker({ stages }: { stages: WorkflowStage[] }) {
  return (
    <section
      style={{
        ...sourceCard,
        background: EXPERIENCE_COLORS.surface,
        border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
        gap: 14,
      }}
      aria-label="Source journey tracker"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Journey map</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>
            Current workflow position
          </div>
        </div>
        <div style={{ ...sourceMuted, maxWidth: 360, color: EXPERIENCE_COLORS.textSecondary }}>
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
              border: `1px solid ${stageBorder(stage)}`,
              borderRadius: 12,
              padding: '12px 13px',
              background: stageBackground(stage),
              minWidth: 120,
              display: 'grid',
              gap: 7,
            }}
          >
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
              Step {index + 1}
            </div>
            <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>{stage.label}</div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: stageColor(stage),
              }}
            >
              {getStageStateLabel(stage.status)}
            </div>
            {stage.gate.blocker ? (
              <div style={{ ...sourceMuted, color: EXPERIENCE_COLORS.riskRed, fontSize: '12px' }}>
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
  if (stage.status === 'blocked') return EXPERIENCE_COLORS.journeyBlocked;
  if (stage.status === 'needs_approval') return EXPERIENCE_COLORS.journeyWaiting;
  if (stage.status === 'complete') return EXPERIENCE_COLORS.journeyComplete;
  if (stage.status === 'active' || stage.status === 'reopened') return EXPERIENCE_COLORS.journeyActive;
  return EXPERIENCE_COLORS.textSecondary;
}

function stageBorder(stage: WorkflowStage): string {
  if (stage.status === 'blocked') return 'rgba(181,69,47,0.36)';
  if (stage.status === 'active' || stage.status === 'reopened') return 'rgba(46,111,216,0.36)';
  if (stage.status === 'complete') return 'rgba(47,138,94,0.28)';
  if (stage.status === 'needs_approval') return 'rgba(184,107,18,0.32)';
  return EXPERIENCE_COLORS.borderSoft;
}

function stageBackground(stage: WorkflowStage): string {
  if (stage.status === 'blocked') return 'rgba(181,69,47,0.07)';
  if (stage.status === 'active' || stage.status === 'reopened') return 'rgba(46,111,216,0.07)';
  if (stage.status === 'complete') return 'rgba(47,138,94,0.06)';
  if (stage.status === 'needs_approval') return 'rgba(184,107,18,0.07)';
  return EXPERIENCE_COLORS.surfaceWarm;
}
