import { SOURCE_ARTIFACT_STATUS_LABELS } from '@/lib/source/constants';
import type { SourcingEventDetail, WorkflowStage } from '@/lib/source/types';
import type { CSSProperties } from 'react';
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

const sourceInsetCard = {
  background: SHELL.PAPER_SOFT,
  border: '1px solid ' + SHELL.CARD_LINE_SOFT,
  borderRadius: 8,
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

export function SourceStagePanel({ event }: { event: SourcingEventDetail }) {
  return (
    <section
      style={{
        ...sourceCard,
        background: SHELL.CARD_WHITE,
        border: '1px solid ' + SHELL.CARD_LINE,
      }}
    >
      <div>
        <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Stage gates and shell placeholders</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: SHELL.INK }}>
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
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Artifact shell</div>
          <div style={{ display: 'grid', gap: 7 }}>
            {event.artifacts.slice(0, 3).map((artifact) => (
              <div key={artifact.id} style={LIGHT_ROW}>
                <div style={{ fontWeight: 800, color: SHELL.INK }}>{artifact.title}</div>
                <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                  {SOURCE_ARTIFACT_STATUS_LABELS[artifact.status]} / read-only summary
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={LIGHT_INSET}>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Approval shell</div>
          <div style={{ color: SHELL.INK, fontWeight: 800 }}>
            Scorecard approval: {event.scorecard.approvalState.replace('_', ' ')}
          </div>
          <p style={{ ...sourceMuted, color: SHELL.INK_MUTED, margin: 0 }}>
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
        background: SHELL.PAPER_SOFT,
        border: '1px solid ' + SHELL.CARD_LINE_SOFT,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontWeight: 800, color: SHELL.INK }}>{stage.label}</div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: stage.gate.status === 'blocked' ? SHELL.RUST_TEXT : SHELL.INK_MUTED,
          }}
        >
          {stage.gate.status.replace('_', ' ')}
        </div>
      </div>
      <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>{stage.summary}</div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
        Owner - {stage.gate.ownerRole}
      </div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
        Required artifacts - {stage.gate.requiredArtifacts.join(', ')}
      </div>
      {stage.gate.blocker ? (
        <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.RUST_TEXT, fontWeight: 800 }}>
          Blocker - {stage.gate.blocker}
        </div>
      ) : null}
    </div>
  );
}

const LIGHT_INSET: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.PAPER_SOFT,
  padding: 13,
};

const LIGHT_ROW: CSSProperties = {
  display: 'grid',
  gap: 4,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: '9px 10px',
};
