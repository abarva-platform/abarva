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

interface SourceStageCanvasPanelProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
}

export function SourceStageCanvasPanel({
  stageKey,
  event,
  nextGateEvaluations = [],
}: SourceStageCanvasPanelProps) {
  const config = getStageCanvasConfig(stageKey);
  const pageState = useAtlasPageState();
  const [showDeliverables, setShowDeliverables] = useState(false);

  if (!config) return null;

  const disabled = !pageState || pageState.isStreaming;
  const totalSteps = SOURCE_STAGE_ORDER.length;
  const stageLabel = SOURCE_STAGE_LABELS[stageKey] ?? stageKey;
  const isCurrentStage = event.currentStageKey === stageKey;

  const canonicalIndex = SOURCE_STAGE_ORDER.indexOf(config.stageKey as SourceStageKey);
  const nextStageKey = SOURCE_STAGE_ORDER[canonicalIndex + 1];
  const nextStageLabel = nextStageKey ? SOURCE_STAGE_LABELS[nextStageKey] : null;

  // Gate criteria: live evaluations when on current stage; config exit criteria otherwise
  const gateCriteria = isCurrentStage && nextGateEvaluations.length > 0
    ? nextGateEvaluations.slice(0, 5).map((ev) => ({
        label: ev.criterionId
          .replaceAll('_', ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        status: ev.status,
      }))
    : config.exitCriteria.map((c) => ({ label: c, status: 'unmet' as const }));

  // Blocking gate count — hard gates not met/waived (for advance button)
  const blockingHardGates = isCurrentStage
    ? nextGateEvaluations.filter(
        (ev) => ev.gateType === 'hard' && ev.status !== 'met' && ev.status !== 'waived',
      ).length
    : 0;
  const allHardGatesClear = isCurrentStage && blockingHardGates === 0 && nextGateEvaluations.length > 0;

  // Artifact shelf — match live artifacts or fall back to config stubs
  const artifactShelf = config.artifactIds.map((id) => {
    const friendlyLabel = id
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const live = event.artifacts.find(
      (a) =>
        a.id.includes(id) ||
        a.title.toLowerCase().replace(/\s+/g, '_').includes(id),
    );
    return {
      id,
      label: live?.title ?? friendlyLabel,
      status: live?.status ?? 'not_started',
    };
  });

  const artifactCount = event.artifacts.length;
  const dataReadyCount = event.dataReadiness.filter(
    (item) =>
      item.readinessState === 'Usable Evidence' ||
      item.readinessState === 'Available',
  ).length;
  const dataTotalCount = event.dataReadiness.length;

  const continueChoice = config.choices[0];

  return (
    <section
      aria-label={`Stage canvas — ${stageLabel}`}
      style={STAGE_PANEL}
    >
      {/* Context bundle strip */}
      <div style={CONTEXT_STRIP}>
        <BundleToken
          value={
            event.name.length > 26
              ? event.name.slice(0, 24) + '…'
              : event.name
          }
        />
        <BundleDot />
        <BundleToken value={`Step ${config.stepNumber} of ${totalSteps}`} />
        {dataTotalCount > 0 && (
          <>
            <BundleDot />
            <BundleToken value={`Data ${dataReadyCount}/${dataTotalCount}`} />
          </>
        )}
        {artifactCount > 0 && (
          <>
            <BundleDot />
            <BundleToken value={`${artifactCount} artifacts`} />
          </>
        )}
      </div>

      {/* Stage frame */}
      <div style={STAGE_FRAME}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={STAGE_EYEBROW}>
              Step {config.stepNumber} · {config.leadAgent}
            </div>
            <h2 style={STAGE_HEADING}>{stageLabel}</h2>
          </div>
          {isCurrentStage && (
            <span style={CURRENT_BADGE} aria-label="Current stage">
              Active
            </span>
          )}
        </div>
        <p style={STAGE_INTENT}>{config.intent}</p>
      </div>

      {/* Gate criteria */}
      <div style={GATE_SECTION}>
        <div style={SECTION_LABEL}>
          {nextStageLabel
            ? `Gate — advance to ${nextStageLabel}`
            : 'Completion criteria'}
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {gateCriteria.map((criterion, index) => (
            <div key={index} style={GATE_ROW}>
              <span
                style={gateStatusDot(criterion.status)}
                aria-hidden="true"
              />
              <span style={GATE_CRITERION_TEXT}>{criterion.label}</span>
              {criterion.status === 'met' && (
                <span style={MET_BADGE}>met</span>
              )}
              {criterion.status === 'waived' && (
                <span style={WAIVED_BADGE}>waived</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deliverables & templates */}
      {artifactShelf.length > 0 && (
        <div style={ARTIFACT_SECTION}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={SECTION_LABEL}>
              Step deliverables · {artifactShelf.length} required
            </div>
            <button
              type="button"
              onClick={() => setShowDeliverables((prev) => !prev)}
              style={EXPAND_TOGGLE}
              aria-expanded={showDeliverables}
              aria-label="Toggle step deliverables"
            >
              {showDeliverables ? 'Collapse ↑' : 'Show templates ↓'}
            </button>
          </div>

          {/* Compact summary tiles (always visible) */}
          <div style={ARTIFACT_GRID}>
            {artifactShelf.map((artifact) => (
              <div key={artifact.id} style={ARTIFACT_TILE}>
                <span
                  style={artifactStatusDot(artifact.status)}
                  aria-hidden="true"
                />
                <div style={ARTIFACT_TILE_LABEL}>{artifact.label}</div>
                <div style={ARTIFACT_STATUS_TEXT}>
                  {artifact.status.replaceAll('_', ' ')}
                </div>
              </div>
            ))}
          </div>

          {/* Expanded deliverables panel — template download + upload actions */}
          {showDeliverables && (
            <div style={DELIVERABLES_PANEL} role="region" aria-label="Step templates and upload">
              <div style={DELIVERABLES_HEADER}>
                Templates provisioned for this step. Download blank → fill → upload completed.
              </div>
              <div style={{ display: 'grid', gap: 7 }}>
                {artifactShelf.map((artifact) => {
                  const gapCount = artifact.status === 'not_started' || artifact.status === 'needs_inputs' ? 1 : 0;
                  return (
                    <div key={artifact.id} style={DELIVERABLE_ROW}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={DELIVERABLE_LABEL}>{artifact.label}</div>
                        <div style={ARTIFACT_STATUS_TEXT}>
                          {artifact.status.replaceAll('_', ' ')}
                          {gapCount > 0 && (
                            <span style={GAP_BADGE}> · gap</span>
                          )}
                        </div>
                      </div>
                      <div style={DELIVERABLE_ACTIONS}>
                        <a
                          href={`/source/templates/${artifact.id}.docx`}
                          download
                          style={TEMPLATE_LINK}
                          aria-label={`Download blank ${artifact.label} template`}
                        >
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
                          style={{
                            ...UPLOAD_BUTTON,
                            opacity: disabled ? 0.6 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                          }}
                          aria-label={`Ask agent how to upload ${artifact.label}`}
                        >
                          Upload guide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Gap review prompt */}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  pageState?.ask(
                    `Review the deliverables gap for ${stageLabel}. For each required artifact, tell me: what's missing, who needs to provide it, what format it must be, and how Sentinel will validate it once uploaded.`,
                  )
                }
                style={{
                  ...GAP_REVIEW_BUTTON,
                  opacity: disabled ? 0.6 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                aria-label={`Ask ${config.leadAgent} to review deliverables gaps`}
              >
                <span style={GAP_REVIEW_LABEL}>Ask {config.leadAgent} · review all gaps →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gate status + stage advance — only on current stage */}
      {isCurrentStage && (
        <div style={GATE_ADVANCE_SECTION}>
          {allHardGatesClear ? (
            <div style={GATE_CLEAR_BANNER} role="status" aria-label="All gate criteria met">
              <span style={GATE_CLEAR_DOT} aria-hidden="true" />
              <span style={GATE_CLEAR_TEXT}>All hard gates met — ready to advance</span>
            </div>
          ) : blockingHardGates > 0 ? (
            <div style={GATE_BLOCKED_BANNER} role="status" aria-label={`${blockingHardGates} blocking gates`}>
              <span style={GATE_BLOCKED_DOT} aria-hidden="true" />
              <span style={GATE_BLOCKED_TEXT}>
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

      {/* Secondary action — ask lead agent */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => pageState?.ask(continueChoice.prompt)}
        style={{
          ...CONTINUE_BUTTON,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-label={`Ask ${config.leadAgent}: ${continueChoice.label}`}
      >
        <span style={CONTINUE_AGENT}>Ask {config.leadAgent}</span>
        <span style={CONTINUE_LABEL}>{continueChoice.label} →</span>
      </button>
    </section>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function BundleToken({ value }: { value: string }) {
  return <span style={BUNDLE_TOKEN}>{value}</span>;
}

function BundleDot() {
  return (
    <span style={BUNDLE_DOT} aria-hidden="true">
      ·
    </span>
  );
}

function gateStatusDot(status: string): CSSProperties {
  const color =
    status === 'met'
      ? SHELL.MINT_TEXT
      : status === 'waived'
        ? SHELL.INK_MUTED
        : status === 'partial'
          ? SHELL.AMBER_DOT
          : SHELL.PEACH_TEXT;
  return {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: 2,
  };
}

function artifactStatusDot(status: string): CSSProperties {
  const color =
    status === 'approved' || status === 'locked'
      ? SHELL.MINT_TEXT
      : status === 'draft' || status === 'needs_review'
        ? SHELL.AMBER_DOT
        : SHELL.GRAY_LINE;
  return {
    display: 'block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color,
    marginBottom: 4,
  };
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const STAGE_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 16,
  background: `linear-gradient(145deg, ${SHELL.CARD_WHITE} 0%, ${SHELL.BLUE_BG} 100%)`,
  padding: '13px 14px',
  display: 'grid',
  gap: 12,
  boxShadow: '0 14px 32px rgba(12, 26, 58, 0.06)',
};

const CONTEXT_STRIP: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 5,
  paddingBottom: 10,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const BUNDLE_TOKEN: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: SHELL.INK_SOFT,
  fontWeight: 600,
};

const BUNDLE_DOT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  lineHeight: 1,
};

const STAGE_FRAME: CSSProperties = {
  display: 'grid',
  gap: 7,
};

const STAGE_EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const STAGE_HEADING: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: SHELL.SERIF,
  fontSize: 22,
  lineHeight: 1.1,
  color: SHELL.INK,
  letterSpacing: '-0.02em',
};

const STAGE_INTENT: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.48,
  color: SHELL.INK_SOFT,
};

const CURRENT_BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: `1px solid ${SHELL.MINT_LINE}`,
  borderRadius: 999,
  background: SHELL.MINT_BG,
  padding: '3px 9px',
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: SHELL.MINT_TEXT,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const GATE_SECTION: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const GATE_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 7,
};

const GATE_CRITERION_TEXT: CSSProperties = {
  flex: 1,
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  lineHeight: 1.38,
  color: SHELL.INK_SOFT,
};

const MET_BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: `1px solid ${SHELL.MINT_LINE}`,
  borderRadius: 4,
  background: SHELL.MINT_BG,
  padding: '1px 5px',
  fontFamily: SHELL.MONO,
  fontSize: 7.5,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: SHELL.MINT_TEXT,
  fontWeight: 700,
  flexShrink: 0,
};

const WAIVED_BADGE: CSSProperties = {
  ...MET_BADGE,
  border: `1px solid ${SHELL.GRAY_LINE}`,
  background: SHELL.GRAY_BG,
  color: SHELL.GRAY_TEXT,
};

const ARTIFACT_SECTION: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const ARTIFACT_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 100px), 1fr))',
  gap: 7,
};

const ARTIFACT_TILE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 10,
  background: 'rgba(253, 251, 246, 0.82)',
  padding: '7px 9px',
};

const ARTIFACT_TILE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 10.5,
  lineHeight: 1.3,
  color: SHELL.INK,
  fontWeight: 700,
};

const ARTIFACT_STATUS_TEXT: CSSProperties = {
  marginTop: 3,
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: '0.06em',
  color: SHELL.INK_MUTED,
};

const CONTINUE_BUTTON: CSSProperties = {
  appearance: 'none',
  border: `1px solid ${SHELL.INK}`,
  borderRadius: 10,
  background: SHELL.INK,
  padding: '9px 12px',
  font: 'inherit',
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const CONTINUE_AGENT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.6)',
  fontWeight: 700,
};

const CONTINUE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  color: '#ffffff',
  fontWeight: 700,
};

const EXPAND_TOGGLE: CSSProperties = {
  appearance: 'none',
  background: 'none',
  border: 'none',
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  cursor: 'pointer',
  padding: '2px 0',
};

const DELIVERABLES_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: '10px 11px',
  display: 'grid',
  gap: 10,
};

const DELIVERABLES_HEADER: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.38,
  color: SHELL.INK_MUTED,
};

const DELIVERABLE_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  paddingBottom: 7,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
};

const DELIVERABLE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  color: SHELL.INK,
  fontWeight: 700,
  lineHeight: 1.3,
};

const DELIVERABLE_ACTIONS: CSSProperties = {
  display: 'flex',
  gap: 5,
  flexShrink: 0,
};

const TEMPLATE_LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 6,
  background: SHELL.PAPER_SOFT,
  padding: '3px 7px',
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.08em',
  color: SHELL.INK_SOFT,
  textDecoration: 'none',
  fontWeight: 600,
};

const UPLOAD_BUTTON: CSSProperties = {
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 6,
  background: SHELL.BLUE_BG,
  padding: '3px 7px',
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: '0.08em',
  color: SHELL.INK_SOFT,
  font: 'inherit',
};

const GAP_BADGE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: '0.08em',
  color: SHELL.PEACH_TEXT,
  fontWeight: 700,
};

const GAP_REVIEW_BUTTON: CSSProperties = {
  appearance: 'none',
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.PAPER_SOFT,
  padding: '7px 10px',
  font: 'inherit',
  textAlign: 'left',
  width: '100%',
};

const GAP_REVIEW_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  color: SHELL.INK_SOFT,
  fontWeight: 600,
};

const GATE_ADVANCE_SECTION: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const GATE_CLEAR_BANNER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  background: 'rgba(52,199,89,0.08)',
  border: '1px solid rgba(52,199,89,0.28)',
  borderRadius: 8,
  padding: '7px 11px',
};

const GATE_CLEAR_DOT: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#34C759',
  flexShrink: 0,
  display: 'inline-block',
};

const GATE_CLEAR_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  color: '#1a7a38',
  fontWeight: 600,
};

const GATE_BLOCKED_BANNER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  background: 'rgba(255,149,0,0.07)',
  border: '1px solid rgba(255,149,0,0.28)',
  borderRadius: 8,
  padding: '7px 11px',
};

const GATE_BLOCKED_DOT: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#FF9500',
  flexShrink: 0,
  display: 'inline-block',
};

const GATE_BLOCKED_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  color: '#7a4a00',
  fontWeight: 600,
};
