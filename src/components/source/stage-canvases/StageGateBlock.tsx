'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import { StageAdvanceButton } from '@/components/source/StageAdvanceButton';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getStageCanvasConfig } from '@/lib/source/stage-canvas-config';
import { SOURCE_STAGE_ORDER, SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey, SourcingEventDetail } from '@/lib/source/types';
import type { GateEvaluation } from '@/lib/reasoning/types';

interface StageGateBlockProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
  showAskButton?: boolean;
}

export function StageGateBlock({
  stageKey,
  event,
  nextGateEvaluations = [],
  showAskButton = true,
}: StageGateBlockProps) {
  const config = getStageCanvasConfig(stageKey);
  const pageState = useAtlasPageState();
  const [showDeliverables, setShowDeliverables] = useState(false);

  if (!config) return null;

  const disabled = !pageState || pageState.isStreaming;
  const stageLabel = SOURCE_STAGE_LABELS[stageKey] ?? stageKey;
  const isCurrentStage = event.currentStageKey === stageKey;

  const canonicalIndex = SOURCE_STAGE_ORDER.indexOf(config.stageKey as SourceStageKey);
  const nextStageKey = SOURCE_STAGE_ORDER[canonicalIndex + 1];
  const nextStageLabel = nextStageKey ? SOURCE_STAGE_LABELS[nextStageKey] : null;

  const prevStageKey = SOURCE_STAGE_ORDER[canonicalIndex - 1];
  const prevConfig = prevStageKey ? getStageCanvasConfig(prevStageKey) : null;
  const prevStageLabel = prevStageKey ? SOURCE_STAGE_LABELS[prevStageKey] : null;
  const entryCriteria = prevConfig?.exitCriteria ?? [];

  const gateCriteria = isCurrentStage && nextGateEvaluations.length > 0
    ? nextGateEvaluations.slice(0, 5).map((ev) => ({
        label: ev.criterionId.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        status: ev.status,
      }))
    : config.exitCriteria.map((c) => ({ label: c, status: 'unmet' as const }));

  const blockingHardGates = isCurrentStage
    ? nextGateEvaluations.filter(
        (ev) => ev.gateType === 'hard' && ev.status !== 'met' && ev.status !== 'waived',
      ).length
    : 0;
  const allHardGatesClear = isCurrentStage && blockingHardGates === 0 && nextGateEvaluations.length > 0;

  const artifactShelf = config.artifactIds.map((id) => {
    const friendlyLabel = id.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const live = event.artifacts.find(
      (a) => a.id.includes(id) || a.title.toLowerCase().replace(/\s+/g, '_').includes(id),
    );
    return {
      id,
      label: live?.title ?? friendlyLabel,
      status: live?.status ?? 'not_started',
    };
  });

  const continueChoice = config.choices[0];

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {/* Entry criteria */}
      {entryCriteria.length > 0 && (
        <details style={ENTRY_SECTION}>
          <summary style={ENTRY_SUMMARY}>
            Entry criteria — from {prevStageLabel ?? 'previous stage'} ({entryCriteria.length})
          </summary>
          <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
            {entryCriteria.map((criterion, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={ENTRY_DOT} aria-hidden="true" />
                <span style={ENTRY_TEXT}>{criterion}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Gate criteria */}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={SECTION_LABEL}>
          {nextStageLabel ? `Gate — advance to ${nextStageLabel}` : 'Completion criteria'}
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {gateCriteria.map((criterion, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <span style={gateStatusDot(criterion.status)} aria-hidden="true" />
              <span style={GATE_TEXT}>{criterion.label}</span>
              {criterion.status === 'met' && <span style={MET_BADGE}>met</span>}
              {criterion.status === 'waived' && <span style={WAIVED_BADGE}>waived</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Deliverables shelf */}
      {artifactShelf.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={SECTION_LABEL}>Step deliverables · {artifactShelf.length} required</div>
            <button
              type="button"
              onClick={() => setShowDeliverables((prev) => !prev)}
              style={EXPAND_TOGGLE}
              aria-expanded={showDeliverables}
            >
              {showDeliverables ? 'Collapse ↑' : 'Show templates ↓'}
            </button>
          </div>
          <div style={ARTIFACT_GRID}>
            {artifactShelf.map((artifact) => (
              <div key={artifact.id} style={ARTIFACT_TILE}>
                <span style={artifactStatusDot(artifact.status)} aria-hidden="true" />
                <div style={ARTIFACT_LABEL}>{artifact.label}</div>
                <div style={ARTIFACT_STATUS}>{artifact.status.replaceAll('_', ' ')}</div>
              </div>
            ))}
          </div>
          {showDeliverables && (
            <div style={DELIVERABLES_PANEL}>
              <div style={DELIVERABLES_HEADER}>
                Templates provisioned for this step. Download blank → fill → upload completed.
              </div>
              <div style={{ display: 'grid', gap: 7 }}>
                {artifactShelf.map((artifact) => (
                  <div key={artifact.id} style={DELIVERABLE_ROW}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={DELIVERABLE_LABEL}>{artifact.label}</div>
                      <div style={ARTIFACT_STATUS}>{artifact.status.replaceAll('_', ' ')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <a href={`/source/templates/${artifact.id}.docx`} download style={TEMPLATE_LINK}>
                        Download ↓
                      </a>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          pageState?.ask(
                            `I need to upload a completed ${artifact.label} for ${stageLabel}. What format should it be, what must it contain, and how will Sentinel validate it?`,
                          )
                        }
                        style={{ ...UPLOAD_BUTTON, opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                      >
                        Upload guide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gate advance — current stage only */}
      {isCurrentStage && (
        <div style={{ display: 'grid', gap: 8 }}>
          {allHardGatesClear ? (
            <div style={GATE_CLEAR_BANNER} role="status">
              <span style={GATE_CLEAR_DOT} aria-hidden="true" />
              <span style={{ fontFamily: SHELL.SANS, fontSize: 11.5, color: '#1a7a38', fontWeight: 600 }}>
                All hard gates met — ready to advance
              </span>
            </div>
          ) : blockingHardGates > 0 ? (
            <div style={GATE_BLOCKED_BANNER} role="status">
              <span style={GATE_BLOCKED_DOT} aria-hidden="true" />
              <span style={{ fontFamily: SHELL.SANS, fontSize: 11.5, color: '#7a4a00', fontWeight: 600 }}>
                {blockingHardGates} blocking gate{blockingHardGates > 1 ? 's' : ''} — self-approve to override
              </span>
            </div>
          ) : null}
          <StageAdvanceButton
            eventId={event.id}
            currentStageKey={event.currentStageKey}
            blockingGateCount={blockingHardGates}
            blockingGateLabel={nextStageLabel ?? undefined}
          />
        </div>
      )}

      {/* Ask lead agent */}
      {showAskButton && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => pageState?.ask(continueChoice.prompt)}
          style={{ ...ASK_BUTTON, opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
            Ask {config.leadAgent}
          </span>
          <span style={{ fontFamily: SHELL.SANS, fontSize: 12.5, color: '#ffffff', fontWeight: 700 }}>
            {continueChoice.label} →
          </span>
        </button>
      )}
    </div>
  );
}

function gateStatusDot(status: string): CSSProperties {
  const color =
    status === 'met' ? SHELL.MINT_TEXT
    : status === 'waived' ? SHELL.INK_MUTED
    : status === 'partial' ? SHELL.AMBER_DOT
    : SHELL.PEACH_TEXT;
  return { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2 };
}

function artifactStatusDot(status: string): CSSProperties {
  const color =
    status === 'approved' || status === 'locked' ? SHELL.MINT_TEXT
    : status === 'draft' || status === 'needs_review' ? SHELL.AMBER_DOT
    : SHELL.GRAY_LINE;
  return { display: 'block', width: 6, height: 6, borderRadius: '50%', background: color, marginBottom: 4 };
}

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const GATE_TEXT: CSSProperties = {
  flex: 1,
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  lineHeight: 1.38,
  color: SHELL.INK_SOFT,
};

const MET_BADGE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.MINT_LINE}`, borderRadius: 4,
  background: SHELL.MINT_BG, padding: '1px 5px',
  fontFamily: SHELL.MONO, fontSize: 7.5, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: SHELL.MINT_TEXT, fontWeight: 700, flexShrink: 0,
};

const WAIVED_BADGE: CSSProperties = {
  ...MET_BADGE,
  border: `1px solid ${SHELL.GRAY_LINE}`,
  background: SHELL.GRAY_BG,
  color: SHELL.GRAY_TEXT,
};

const ENTRY_SECTION: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8, padding: '6px 10px', background: SHELL.PAPER_SOFT,
};

const ENTRY_SUMMARY: CSSProperties = {
  fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, fontWeight: 700, cursor: 'pointer', listStyle: 'none',
};

const ENTRY_DOT: CSSProperties = {
  width: 5, height: 5, borderRadius: '50%', background: SHELL.INK_MUTED,
  flexShrink: 0, marginTop: 4, display: 'inline-block',
};

const ENTRY_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, lineHeight: 1.4,
};

const ARTIFACT_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 100px), 1fr))',
  gap: 7,
};

const ARTIFACT_TILE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 10,
  background: 'rgba(253, 251, 246, 0.82)', padding: '7px 9px',
};

const ARTIFACT_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS, fontSize: 10.5, lineHeight: 1.3, color: SHELL.INK, fontWeight: 700,
};

const ARTIFACT_STATUS: CSSProperties = {
  marginTop: 3, fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.06em', color: SHELL.INK_MUTED,
};

const EXPAND_TOGGLE: CSSProperties = {
  appearance: 'none', background: 'none', border: 'none',
  fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: SHELL.INK_MUTED, cursor: 'pointer', padding: '2px 0',
};

const DELIVERABLES_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 12,
  background: SHELL.CARD_WHITE, padding: '10px 11px', display: 'grid', gap: 10,
};

const DELIVERABLES_HEADER: CSSProperties = {
  fontFamily: SHELL.SANS, fontSize: 11.5, lineHeight: 1.38, color: SHELL.INK_MUTED,
};

const DELIVERABLE_ROW: CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 8,
  paddingBottom: 7, borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
};

const DELIVERABLE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS, fontSize: 11.8, color: SHELL.INK, fontWeight: 700, lineHeight: 1.3,
};

const TEMPLATE_LINK: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 6,
  background: SHELL.PAPER_SOFT, padding: '3px 7px',
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.08em',
  color: SHELL.INK_SOFT, textDecoration: 'none', fontWeight: 600,
};

const UPLOAD_BUTTON: CSSProperties = {
  appearance: 'none', display: 'inline-flex', alignItems: 'center',
  border: `1px solid ${SHELL.BLUE_LINE}`, borderRadius: 6,
  background: SHELL.BLUE_BG, padding: '3px 7px',
  fontFamily: SHELL.MONO, fontSize: 8.5, letterSpacing: '0.08em', color: SHELL.INK_SOFT, font: 'inherit',
};

const GATE_CLEAR_BANNER: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.28)',
  borderRadius: 8, padding: '7px 11px',
};

const GATE_CLEAR_DOT: CSSProperties = {
  width: 8, height: 8, borderRadius: '50%', background: '#34C759', flexShrink: 0, display: 'inline-block',
};

const GATE_BLOCKED_BANNER: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  background: 'rgba(255,149,0,0.07)', border: '1px solid rgba(255,149,0,0.28)',
  borderRadius: 8, padding: '7px 11px',
};

const GATE_BLOCKED_DOT: CSSProperties = {
  width: 8, height: 8, borderRadius: '50%', background: '#FF9500', flexShrink: 0, display: 'inline-block',
};

const ASK_BUTTON: CSSProperties = {
  appearance: 'none', border: `1px solid ${SHELL.INK}`,
  borderRadius: 10, background: SHELL.INK, padding: '9px 12px',
  font: 'inherit', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2,
};
