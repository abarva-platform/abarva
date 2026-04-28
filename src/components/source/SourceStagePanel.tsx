import { SOURCE_ARTIFACT_STATUS_LABELS } from '@/lib/source/constants';
import type { SourcingEventDetail, WorkflowStage } from '@/lib/source/types';
import type { CSSProperties } from 'react';
import { EXPERIENCE_COLORS, FONTS, TEXT } from '@/lib/design-system';
import { sourceCard, sourceInsetCard, sourceMuted, sourceSectionLabel } from './foundationStyles';

export function SourceStagePanel({ event }: { event: SourcingEventDetail }) {
  return (
    <section
      style={{
        ...sourceCard,
        background: EXPERIENCE_COLORS.surface,
        border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
      }}
    >
      <div>
        <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Stage gates and shell placeholders</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>
          Gate readiness remains read-only
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {event.stages.map((stage) => (
          <StageGateRow key={stage.key} stage={stage} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 10 }}>
        <div style={LIGHT_INSET}>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Artifact shell</div>
          <div style={{ display: 'grid', gap: 7 }}>
            {event.artifacts.slice(0, 3).map((artifact) => (
              <div key={artifact.id} style={LIGHT_ROW}>
                <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>{artifact.title}</div>
                <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                  {SOURCE_ARTIFACT_STATUS_LABELS[artifact.status]} / read-only summary
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={LIGHT_INSET}>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Approval shell</div>
          <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 800 }}>
            Scorecard approval: {event.scorecard.approvalState.replace('_', ' ')}
          </div>
          <p style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary, margin: 0 }}>
            Approval routing, versioning, scorecard lock, and review workflow remain placeholders.
          </p>
        </div>
      </div>
    </section>
  );
}

function StageGateRow({ stage }: { stage: WorkflowStage }) {
  return (
    <div
      style={{
        ...sourceInsetCard,
        background: EXPERIENCE_COLORS.surfaceWarm,
        border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>{stage.label}</div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: stage.gate.status === 'blocked' ? EXPERIENCE_COLORS.riskRed : EXPERIENCE_COLORS.textSecondary,
          }}
        >
          {stage.gate.status.replace('_', ' ')}
        </div>
      </div>
      <div style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary }}>{stage.summary}</div>
      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
        Owner - {stage.gate.ownerRole}
      </div>
      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
        Required artifacts - {stage.gate.requiredArtifacts.join(', ')}
      </div>
      {stage.gate.blocker ? (
        <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.riskRed, fontWeight: 800 }}>
          Blocker - {stage.gate.blocker}
        </div>
      ) : null}
    </div>
  );
}

const LIGHT_INSET: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 13,
};

const LIGHT_ROW: CSSProperties = {
  display: 'grid',
  gap: 4,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surface,
  padding: '9px 10px',
};
