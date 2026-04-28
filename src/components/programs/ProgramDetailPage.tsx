'use client';

// SHELL-B — Program Detail Page adapted to AppShell.

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { RibbonSynthesis } from '@/components/shell/RibbonSynthesis';
import { AtlasDrawer } from '@/components/shell/AtlasDrawer';
import { WorkingPaneContainer } from '@/components/shell/WorkingPaneContainer';
import { programsShapeResolver } from '@/lib/programs/programs-shape-resolver';
import { PhaseStrip } from '@/components/shell/PhaseStrip';
import type { PhaseStripSlot } from '@/components/shell/PhaseStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { ProgramDetailView, ProgramPhaseId, EvidenceItem } from '@/lib/programs/programs-types';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import type { StageId } from '@/lib/shell/atlas-page-state';
import { LinkedProgramChip } from '@/components/shell/LinkedProgramChip';
import { SubNavStrip } from '@/components/shell/SubNavStrip';
import { useToast } from '@/components/shell/Toast';
import { PatternChip } from '@/components/programs/PatternChip';
import { NexusSynthesisQuote } from '@/components/programs/NexusSynthesisQuote';
import { ProgramProvenanceRibbon } from '@/components/programs/ProgramProvenanceRibbon';
import { SourceEventChip } from '@/components/programs/SourceEventChip';
import { buildProgramSourceLinkView } from '@/lib/programs/program-source-link-view';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { summarizeFailureModes } from '@/lib/reasoning/provenance-ribbon-helpers';
import { FailureModeWarningChip } from '@/components/_shared/FailureModeWarningChip';
import { ContradictionDetailCardClient } from '@/components/_shared/ContradictionDetailCardClient';
import { CascadeImpactCard, ReverseCascadeCard } from '@/components/_shared/CascadeImpactCard';
import { InstanceEventTimeline } from '@/components/_shared/InstanceEventTimeline';
import { computeReverseCascade } from '@/lib/reasoning/cross-instance-reasoner';
import { buildInstanceEventTimeline } from '@/lib/reasoning/instance-event-timeline';
import { isResolved as isContradictionResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { buildProgramStorylineContext, matchStorylinePatterns } from '@/lib/intelligence/storyline-matcher';
import { buildGateApprovalDrawerView } from '@/lib/programs/gate-approval-drawer-view';
import type { GateApprovalDrawerView } from '@/lib/programs/gate-approval-drawer-view';
import { buildDeliverablesCanvasView } from '@/lib/programs/deliverable-canvas-polish-view';
import type { DeliverablesCanvasView } from '@/lib/programs/deliverable-canvas-polish-view';
import { buildMaestroNextActionView } from '@/lib/programs/maestro-next-action-view';
import { buildWorkshopNotesActionPlanView } from '@/lib/programs/workshop-notes-action-plan-view';
import { WorkshopNotesActionPlanPanel } from '@/components/programs/WorkshopNotesActionPlanPanel';
import { MissionList } from '@/components/_shared/MissionList';
import { getMissionsForProgram } from '@/lib/agent/agent-mission-derived';
import { AddProgramEvidenceForm } from '@/components/programs/AddProgramEvidenceForm';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgramDetailPageProps {
  view: ProgramDetailView;
}

// ─── Gate pill ────────────────────────────────────────────────────────────────

function GatePill({ status }: { status: ProgramDetailView['gateStatus'] }) {
  let bg: string;
  let color: string;
  let label: string;

  switch (status) {
    case 'pending':
      bg = SHELL.PEACH_BG;
      color = SHELL.PEACH_TEXT;
      label = 'Gate Pending';
      break;
    case 'open':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = 'Gate Open';
      break;
    case 'approved':
      bg = SHELL.MINT_BG;
      color = SHELL.MINT_TEXT;
      label = 'Gate Approved';
      break;
    default:
      bg = SHELL.GRAY_BG;
      color = SHELL.GRAY_TEXT;
      label = status === 'idle' ? 'Idle' : 'Gate N/A';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Gate ribbon (PRG-STA-GATE-PENDING) ───────────────────────────────────────

interface GateRibbonProps {
  fromPhase: number;
  toPhase: number;
  totalCriteria: number;
  metCriteria: number;
  onRequestApproval: () => void;
}

function GateRibbon({
  fromPhase,
  toPhase,
  totalCriteria,
  metCriteria,
  onRequestApproval,
}: GateRibbonProps) {
  const fromPhaseLabel = PHASE_LABEL_MAP[fromPhase as ProgramPhaseId] ?? `Phase ${fromPhase}`;
  const toPhaseLabel = PHASE_LABEL_MAP[toPhase as ProgramPhaseId] ?? `Phase ${toPhase}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
        background: SHELL.PEACH_BG,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        borderRadius: 10,
        padding: '14px 20px',
      }}
    >
      {/* Amber dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: SHELL.AMBER_DOT,
          flexShrink: 0,
        }}
      />

      {/* "GATE REVIEW" label */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          color: SHELL.PEACH_TEXT,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        Gate Review
      </span>

      {/* Arrow */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 12,
          color: SHELL.INK_MUTED,
        }}
      >
        →
      </span>

      {/* Phase transition label */}
      <span
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          color: SHELL.INK,
          whiteSpace: 'nowrap',
        }}
      >
        P{fromPhase} {fromPhaseLabel} → P{toPhase} {toPhaseLabel}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Criteria badge */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.PEACH_TEXT,
          background: SHELL.PEACH_LINE,
          padding: '3px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {metCriteria} of {totalCriteria} criteria met
      </span>

      {/* Request approval button */}
      <button
        onClick={onRequestApproval}
        style={{
          background: SHELL.INK,
          color: SHELL.PAPER,
          fontFamily: SHELL.MONO,
          fontSize: 11,
          padding: '6px 14px',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Request gate approval
      </button>
    </div>
  );
}

// ─── Gate approve modal (PRG-MOD-GATE-APPROVE) ────────────────────────────────

interface GateApproveModalProps {
  fromPhase: number;
  toPhase: number;
  unmetCriteria: string[];
  onApprove: (rationale: string) => void;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
}

function GateApproveModal({
  fromPhase,
  toPhase,
  unmetCriteria,
  onApprove,
  onClose,
  isLoading = false,
  error = null,
}: GateApproveModalProps) {
  const [rationale, setRationale] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  void fromPhase;
  const toPhaseLabel = PHASE_LABEL_MAP[toPhase as ProgramPhaseId] ?? `Phase ${toPhase}`;

  const canApprove = rationale.trim().length > 10;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 520,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Gate Approval
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              color: SHELL.INK,
              lineHeight: 1.25,
            }}
          >
            Advance to P{toPhase} {toPhaseLabel}?
          </div>
        </div>

        {/* Warning section for unmet criteria */}
        {unmetCriteria.length > 0 && (
          <div
            style={{
              background: SHELL.PEACH_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {unmetCriteria.map((criterion, i) => (
                <div
                  key={`unmet-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    color: SHELL.PEACH_TEXT,
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ flexShrink: 0 }}>✗</span>
                  <span>{criterion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rationale textarea */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Approval Rationale (required)
          </div>
          <textarea
            ref={textareaRef}
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              padding: 10,
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              color: SHELL.INK,
              outline: 'none',
              lineHeight: 1.5,
            }}
            placeholder="Describe why this gate advance is approved despite any open criteria…"
          />
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: '8px 12px',
              background: SHELL.PEACH_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 6,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.PEACH_TEXT,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: 'transparent',
              fontFamily: SHELL.SANS,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: SHELL.INK,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => canApprove && !isLoading && onApprove(rationale)}
            disabled={!canApprove || isLoading}
            style={{
              background: canApprove && !isLoading ? SHELL.INK : SHELL.GRAY_BG,
              color: canApprove && !isLoading ? SHELL.PAPER : SHELL.GRAY_TEXT,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: canApprove && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? 'Approving...' : 'Approve gate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gate criteria ────────────────────────────────────────────────────────────

function GateCriteriaList({
  criteria,
}: {
  criteria: NonNullable<ProgramDetailView['phasePanel']['gateCriteria']>;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Gate criteria
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {criteria.map((g, i) => (
          <div
            key={`gc-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 12px',
              borderRadius: 7,
              background: g.met
                ? SHELL.MINT_BG
                : SHELL.PEACH_BG,
              border: `1px solid ${g.met ? SHELL.MINT_LINE : SHELL.PEACH_LINE}`,
            }}
          >
            {/* Circle icon */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                flexShrink: 0,
                background: g.met ? SHELL.MINT_TEXT : 'transparent',
                border: g.met ? 'none' : `1.5px solid ${SHELL.INK}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {g.met && (
                <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>
              )}
            </div>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: g.met ? SHELL.MINT_TEXT : SHELL.INK,
                lineHeight: 1.4,
              }}
            >
              {g.criterion}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: g.met ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
              }}
            >
              {g.met ? 'Met' : 'Open'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deliverables ─────────────────────────────────────────────────────────────

function DeliverablesList({
  deliverables,
}: {
  deliverables: NonNullable<ProgramDetailView['phasePanel']['deliverables']>;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Deliverables
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {deliverables.map((d, i) => {
          const statusDotColor =
            d.status === 'done'
              ? SHELL.MINT_TEXT
              : d.status === 'blocked'
              ? SHELL.RUST_TEXT
              : SHELL.AMBER_DOT;

          return (
            <div
              key={`del-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 12px',
                borderRadius: 7,
                background: SHELL.CARD_WHITE,
                border: `1px solid ${SHELL.CARD_LINE}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: statusDotColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK,
                  flex: 1,
                  lineHeight: 1.4,
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: statusDotColor,
                }}
              >
                {d.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Deliverables canvas (PROG22) ─────────────────────────────────────────────

function DeliverablesCanvas({ canvasView }: { canvasView: DeliverablesCanvasView }) {
  function readinessDot(r: DeliverablesCanvasView['items'][number]['readiness']): string {
    if (r === 'trustworthy') return SHELL.MINT_TEXT;
    if (r === 'blocked') return SHELL.RUST_TEXT;
    if (r === 'partial') return SHELL.AMBER_DOT;
    return SHELL.INK_MUTED;
  }

  return (
    <div data-testid="deliverables-canvas">
      {/* Canvas header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>
          {canvasView.phaseLabel} Deliverables
        </div>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.06em' }}>
          {canvasView.canvasSummary}
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {canvasView.items.map((item, i) => (
          <div
            key={`del-canvas-${i}`}
            data-testid="deliverable-canvas-item"
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            {/* Item header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: readinessDot(item.readiness),
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK, lineHeight: 1.4, marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: readinessDot(item.readiness) }}>
                    {item.readinessLabel}
                  </span>
                  <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.06em' }}>
                    · {item.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence citations */}
            {item.evidenceCitations.length > 0 && (
              <div style={{ marginBottom: 8, paddingTop: 8, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
                <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.08em', color: SHELL.INK_MUTED, marginBottom: 4 }}>
                  Evidence
                </div>
                {item.evidenceCitations.map((cite, j) => (
                  <div key={`cite-${j}`} style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT, lineHeight: 1.4, marginBottom: 2 }}>
                    · {cite}
                  </div>
                ))}
              </div>
            )}

            {/* Missing inputs */}
            {item.missingInputs.length > 0 && (
              <div style={{ marginBottom: 8, paddingTop: 8, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
                <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.08em', color: SHELL.INK_MUTED, marginBottom: 4 }}>
                  Missing inputs
                </div>
                {item.missingInputs.map((input, j) => (
                  <div key={`miss-${j}`} style={{ display: 'flex', gap: 6, fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.PEACH_TEXT, lineHeight: 1.4, marginBottom: 2 }}>
                    <span style={{ flexShrink: 0 }}>✗</span>
                    <span>{input}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Next action */}
            <div style={{ marginBottom: 10, fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em' }}>
              Next: {item.nextAction}
            </div>

            {/* Disabled actions — rendered explicitly so testids appear as static strings */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
              {item.actions.find((a) => a.key === 'approve') && (
                <button
                  data-testid="deliverable-approve-action"
                  disabled={true}
                  title={item.actions.find((a) => a.key === 'approve')!.reason}
                  style={{
                    fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: SHELL.INK_MUTED, background: SHELL.GRAY_BG,
                    border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 4,
                    padding: '5px 10px', cursor: 'not-allowed', opacity: 0.55,
                  }}
                >
                  Approve
                </button>
              )}
              {item.actions.find((a) => a.key === 'export') && (
                <button
                  data-testid="deliverable-export-action"
                  disabled={true}
                  title={item.actions.find((a) => a.key === 'export')!.reason}
                  style={{
                    fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: SHELL.INK_MUTED, background: SHELL.GRAY_BG,
                    border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 4,
                    padding: '5px 10px', cursor: 'not-allowed', opacity: 0.55,
                  }}
                >
                  Export
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Honest disclaimer */}
      <div
        data-testid="deliverables-canvas-disclaimer"
        data-honest-disclaimer="deliverables-canvas"
        style={{ marginTop: 16, fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em', lineHeight: 1.5 }}
      >
        {canvasView.honestDisclaimer}
      </div>
    </div>
  );
}

// ─── PRG-MOD-SCORECARD-OVERRIDE: Scorecard override modal ────────────────────

interface ScorecardOverrideModalProps {
  onClose: () => void;
  currentScore: string;
}

function ScorecardOverrideModal({ onClose, currentScore }: ScorecardOverrideModalProps) {
  const [selectedScore, setSelectedScore] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [rationale, setRationale] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const presetScores = ['20%', '40%', '60%', '80%'];

  function handleConfirm() {
    if (rationale.trim() === '') return;
    setConfirmed(true);
    setTimeout(() => onClose(), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${SHELL.CARD_LINE}`,
    borderRadius: 6,
    padding: '8px 12px',
    fontFamily: SHELL.SANS,
    fontSize: 13,
    background: SHELL.PAPER,
    color: SHELL.INK,
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: SHELL.INK_MUTED,
    display: 'block',
    marginBottom: 5,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(12,26,58,0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          borderRadius: 12,
          padding: 32,
          maxWidth: 480,
          width: '100%',
          margin: '10vh auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 18,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            Override Coverage Score
          </div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.1em',
            }}
          >
            Ste · Steward override · rationale required
          </div>
        </div>

        {confirmed ? (
          <div>
            <div
              style={{
                padding: '14px 16px',
                background: SHELL.PEACH_BG,
                border: `1px solid ${SHELL.PEACH_LINE}`,
                borderRadius: 8,
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.PEACH_TEXT,
              }}
            >
              Override logged — score will update in next gate review cycle
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Current score */}
            <div>
              <label style={labelStyle}>Current assessed score</label>
              <div
                style={{
                  fontFamily: SHELL.SERIF,
                  fontSize: 32,
                  fontWeight: 700,
                  color: SHELL.INK,
                  lineHeight: 1,
                }}
              >
                {currentScore}
              </div>
            </div>

            {/* New score pills */}
            <div>
              <label style={labelStyle}>New score</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {presetScores.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSelectedScore(s); setCustomMode(false); setCustomValue(''); }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      background: selectedScore === s && !customMode ? SHELL.PEACH_BG : SHELL.GRAY_BG,
                      color: selectedScore === s && !customMode ? SHELL.PEACH_TEXT : SHELL.INK_SOFT,
                      transition: 'background 120ms ease, color 120ms ease',
                    }}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => { setCustomMode(true); setSelectedScore(null); }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    background: customMode ? SHELL.PEACH_BG : SHELL.GRAY_BG,
                    color: customMode ? SHELL.PEACH_TEXT : SHELL.INK_SOFT,
                    transition: 'background 120ms ease, color 120ms ease',
                  }}
                >
                  Custom
                </button>
              </div>
              {customMode && (
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => { setCustomValue(e.target.value); setSelectedScore(e.target.value); }}
                  placeholder="e.g. 55%"
                  style={{ ...inputStyle, marginTop: 8 }}
                />
              )}
            </div>

            {/* Rationale */}
            <div>
              <label style={labelStyle}>Rationale (required)</label>
              <textarea
                rows={4}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                style={inputStyle}
                placeholder="Explain the basis for this score override…"
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <button
                onClick={onClose}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: SHELL.INK_SOFT,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={rationale.trim() === ''}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  background: rationale.trim() === '' ? SHELL.GRAY_BG : SHELL.INK,
                  color: rationale.trim() === '' ? SHELL.INK_MUTED : SHELL.PAPER,
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 18px',
                  cursor: rationale.trim() === '' ? 'not-allowed' : 'pointer',
                  transition: 'background 120ms ease, color 120ms ease',
                }}
              >
                Confirm override
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Evidence section ─────────────────────────────────────────────────────────

interface EvidenceSectionProps {
  items: EvidenceItem[];
  onView: (item: EvidenceItem) => void;
}

function EvidenceSection({ items, onView }: EvidenceSectionProps) {
  function confidenceDotColor(confidence: EvidenceItem['confidence']): string {
    if (confidence === 'high') return SHELL.MINT_TEXT;
    if (confidence === 'medium') return SHELL.AMBER_DOT;
    return SHELL.RUST_TEXT;
  }

  return (
    <div>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        Evidence · {items.length} citations
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onView(item)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: SHELL.CARD_WHITE,
              marginBottom: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            {/* Confidence dot */}
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: confidenceDotColor(item.confidence),
                flexShrink: 0,
              }}
            />
            {/* Citation */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK,
                  lineHeight: 1.4,
                }}
              >
                {item.citation}
              </div>
              {item.provenanceNote ? (
                <div
                  style={{
                    marginTop: 3,
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    color: SHELL.INK_MUTED,
                    letterSpacing: '0.08em',
                  }}
                >
                  {item.provenanceNote}
                </div>
              ) : null}
            </div>
            {/* Conflict badge */}
            {item.hasContradiction && (
              <span
                style={{
                  background: SHELL.PEACH_BG,
                  color: SHELL.PEACH_TEXT,
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  padding: '2px 7px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                ⚠ conflict
              </span>
            )}
            {/* View arrow */}
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                whiteSpace: 'nowrap',
              }}
            >
              View →
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evidence drawer ──────────────────────────────────────────────────────────

interface EvidenceDrawerProps {
  item: EvidenceItem;
  onClose: () => void;
  onResolveContradiction: (item: EvidenceItem) => void;
}

function EvidenceDrawer({ item, onClose, onResolveContradiction }: EvidenceDrawerProps) {
  function confidenceDotColor(confidence: EvidenceItem['confidence']): string {
    if (confidence === 'high') return SHELL.MINT_TEXT;
    if (confidence === 'medium') return SHELL.AMBER_DOT;
    return SHELL.RUST_TEXT;
  }

  function confidenceLabel(confidence: EvidenceItem['confidence']): string {
    if (confidence === 'high') return 'High confidence';
    if (confidence === 'medium') return 'Medium confidence';
    return 'Low confidence';
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: SHELL.PAPER,
        borderLeft: `1px solid ${SHELL.CARD_LINE}`,
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          Evidence Citation
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 20,
            color: SHELL.INK_SOFT,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 24px',
        }}
      >
        {/* Citation */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 16,
            color: SHELL.INK,
            fontWeight: 'bold',
            marginBottom: 4,
          }}
        >
          {item.citation}
        </div>

        {/* Source */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 16,
          }}
        >
          {item.source}
        </div>

        {item.provenanceNote ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 8px',
              marginBottom: 16,
              borderRadius: 999,
              background: SHELL.PAPER_SOFT,
              border: `1px solid ${SHELL.CARD_LINE}`,
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.06em',
            }}
          >
            {item.provenanceNote}
          </div>
        ) : null}

        {/* Excerpt */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK,
            lineHeight: 1.7,
            borderLeft: `3px solid ${SHELL.CARD_LINE}`,
            paddingLeft: 14,
            marginBottom: 20,
          }}
        >
          {item.excerpt}
        </div>

        {/* Confidence */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: item.hasContradiction ? 20 : 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: confidenceDotColor(item.confidence),
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: SHELL.INK_MUTED,
            }}
          >
            {confidenceLabel(item.confidence)}
          </span>
        </div>

        {/* Contradiction box */}
        {item.hasContradiction && (
          <div
            style={{
              background: SHELL.PEACH_BG,
              border: `1px solid ${SHELL.PEACH_LINE}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.PEACH_TEXT,
                marginBottom: 10,
              }}
            >
              ⚠ Conflicting evidence detected
            </div>
            <button
              onClick={() => {
                onClose();
                onResolveContradiction(item);
              }}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                letterSpacing: '0.06em',
              }}
            >
              Resolve contradiction →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Contradiction modal ──────────────────────────────────────────────────────

interface ContradictionModalProps {
  item: EvidenceItem;
  onResolve: (resolution: string) => void;
  onClose: () => void;
}

function ContradictionModal({ item, onResolve, onClose }: ContradictionModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const options = [
    'Accept this evidence — discard conflicting item',
    'Accept conflicting item — flag this as superseded',
    'Defer — flag both items for sponsor review',
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 500,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Contradiction
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              color: SHELL.INK,
              lineHeight: 1.25,
            }}
          >
            Conflicting evidence detected
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {item.citation}
        </div>

        {/* Resolution options */}
        <div style={{ marginBottom: 20 }}>
          {options.map((opt, i) => (
            <div
              key={`opt-${i}`}
              onClick={() => setSelected(i)}
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                border: `1.5px solid ${selected === i ? SHELL.INK : SHELL.CARD_LINE}`,
                background: selected === i ? SHELL.PAPER_DEEP : SHELL.CARD_WHITE,
                cursor: 'pointer',
                marginBottom: 6,
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK,
                lineHeight: 1.4,
              }}
            >
              {opt}
            </div>
          ))}
        </div>

        {/* Note textarea */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Resolution Note (optional)
          </div>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              padding: 10,
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              color: SHELL.INK,
              outline: 'none',
              lineHeight: 1.5,
            }}
            placeholder="Optional note about this resolution…"
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              background: 'transparent',
              fontFamily: SHELL.SANS,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              color: SHELL.INK,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const resolution = selected !== null ? options[selected] : '';
              onResolve(resolution + (note ? ` — ${note}` : ''));
            }}
            style={{
              background: SHELL.INK,
              color: SHELL.PAPER,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Record resolution
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SuggestedActionOverlay (PRG-STA-SUGGESTED-ACTION) ────────────────────────

interface SuggestedActionOverlayProps {
  action: { letter: 'A' | 'B' | 'C'; text: string; detail?: string; href?: string; frame: 1 | 2 | 3 };
  onAdvance: () => void;
  onDismiss: () => void;
}

function SuggestedActionOverlay({ action, onAdvance, onDismiss }: SuggestedActionOverlayProps) {
  const ghostBtn: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 10,
    color: 'rgba(250,247,241,0.8)',
    background: 'none',
    border: '1px solid rgba(250,247,241,0.3)',
    borderRadius: 6,
    padding: '7px 14px',
    cursor: 'pointer',
    letterSpacing: '0.06em',
  };
  const solidBtn: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 10,
    color: SHELL.INK,
    background: SHELL.PAPER,
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    cursor: 'pointer',
    letterSpacing: '0.06em',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 320,
        background: SHELL.INK,
        borderRadius: 12,
        padding: '20px 24px',
        width: 340,
        boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
        zIndex: 800,
      }}
    >
      {action.frame === 1 && (
        <>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: 'rgba(250,247,241,0.7)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Nexus suggests
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 15,
              color: SHELL.PAPER,
              lineHeight: 1.4,
              marginBottom: 4,
            }}
          >
            {action.text}
          </div>
          {action.detail && (
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: 'rgba(250,247,241,0.7)',
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {action.detail}
            </div>
          )}
          {!action.detail && <div style={{ marginBottom: 16 }} />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={ghostBtn} onClick={onDismiss}>Dismiss</button>
            <button style={solidBtn} onClick={onAdvance}>Proceed →</button>
          </div>
        </>
      )}

      {action.frame === 2 && (
        <>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: 'rgba(250,247,241,0.7)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Confirm action
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 15,
              color: SHELL.PAPER,
              lineHeight: 1.4,
              marginBottom: 6,
            }}
          >
            Are you sure you want to: {action.text}?
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: 'rgba(250,247,241,0.7)',
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            This will queue a deterministic follow-up on the current program surface.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={ghostBtn} onClick={onDismiss}>← Back</button>
            <button style={solidBtn} onClick={onAdvance}>Confirm and proceed</button>
          </div>
        </>
      )}

      {action.frame === 3 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: SHELL.MINT_TEXT,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: SHELL.MINT_TEXT,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              Action logged
            </span>
          </div>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 14,
              color: SHELL.PAPER,
              lineHeight: 1.4,
              marginBottom: 6,
            }}
          >
            {action.text}
          </div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: 'rgba(250,247,241,0.7)',
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            Action queued in the current preview state. Nexus follow-up remains seeded until runtime automation is wired.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {action.href && (
              <a
                href={action.href}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.PAPER,
                  background: 'rgba(250,247,241,0.15)',
                  border: '1px solid rgba(250,247,241,0.4)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Open →
              </a>
            )}
            <button style={solidBtn} onClick={onDismiss}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── FileUploadOverlay (PRG-STA-FILE-UPLOAD) ──────────────────────────────────

interface FileUploadOverlayProps {
  programName: string;
  programId: string;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUploadOverlay({ programName, programId, onClose }: FileUploadOverlayProps) {
  const { toast } = useToast();
  const [uploadState, setUploadState] = useState<{
    name: string;
    size: string;
    stage: 'uploading' | 'parsing' | 'done';
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadState) return;

    setUploadError(null);
    setUploadState({ name: file.name, size: formatFileSize(file.size), stage: 'uploading' });

    const form = new FormData();
    form.append('file', file);
    form.append('sessionId', `prog-${Date.now()}`);

    try {
      const res = await fetch('/api/v1/nexus/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const msg = await res.text().catch(() => 'Upload failed');
        setUploadState(null);
        setUploadError(msg || 'Upload failed');
        return;
      }
    } catch {
      setUploadState(null);
      setUploadError('Upload failed — network error');
      return;
    }

    setUploadState((s) => (s ? { ...s, stage: 'parsing' } : null));
    setTimeout(() => {
      setUploadState((s) => (s ? { ...s, stage: 'done' } : null));
      toast({ type: 'success', title: 'Evidence uploaded', message: 'File received · ingestion in progress' });
    }, 1000);
  };

  const progressPct =
    uploadState?.stage === 'uploading'
      ? 33
      : uploadState?.stage === 'parsing'
      ? 70
      : 100;

  const insightChips: Array<{ label: string; bg: string }> = [
    { label: 'Evidence candidate extracted', bg: SHELL.PEACH_BG },
    { label: 'Gate-readiness reference detected', bg: SHELL.MINT_BG },
    { label: 'Cross-surface citation available', bg: SHELL.BLUE_BG },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: SHELL.PAPER,
        borderLeft: `1px solid ${SHELL.CARD_LINE}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 910,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: SHELL.INK,
          }}
        >
          Upload document
        </span>
        <div
          style={{
            marginLeft: 12,
            marginRight: 'auto',
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.08em',
          }}
        >
          {programId}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: SHELL.SANS,
            fontSize: 18,
            color: SHELL.INK_MUTED,
            lineHeight: 1,
            padding: '0 2px',
          }}
        >
          ×
        </button>
      </div>

      {/* Upload zone / progress */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.docx"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {!uploadState ? (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                margin: 24,
                border: `2px dashed ${SHELL.CARD_LINE}`,
                borderRadius: 10,
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: SHELL.PAPER_SOFT,
              }}
            >
              <div
                style={{
                  fontFamily: SHELL.SERIF,
                  fontSize: 15,
                  color: SHELL.INK,
                  marginBottom: 6,
                }}
              >
                Drop a file here
              </div>
              <div
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK_MUTED,
                }}
              >
                {programName} · click to browse · PDF, DOCX, PPTX up to 25MB
              </div>
            </div>
            {uploadError && (
              <div
                style={{
                  margin: '0 24px',
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: '#c0392b',
                }}
              >
                {uploadError}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '24px 24px 0' }}>
            {/* File info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  fontWeight: 700,
                  color: SHELL.INK,
                }}
              >
                {uploadState.name}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.06em',
                }}
              >
                {uploadState.size}
              </span>
            </div>

            {/* Stage indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    uploadState.stage === 'done' ? SHELL.MINT_TEXT : SHELL.AMBER_DOT,
                }}
              />
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color:
                    uploadState.stage === 'done' ? SHELL.MINT_TEXT : SHELL.INK_MUTED,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                }}
              >
                {uploadState.stage === 'uploading' && 'Uploading...'}
                {uploadState.stage === 'parsing' && 'Nexus is parsing document...'}
                {uploadState.stage === 'done' && 'Document parsed · 3 insights extracted'}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: SHELL.CARD_LINE,
                marginBottom: 20,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: SHELL.MINT_TEXT,
                  width: `${progressPct}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            {/* Insight chips (shown when done) */}
            {uploadState.stage === 'done' && (
              <>
                <div
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: SHELL.INK_MUTED,
                    marginBottom: 10,
                  }}
                >
                  Extracted insights
                </div>
                <div style={{ marginBottom: 20 }}>
                  {insightChips.map((chip) => (
                    <div
                      key={chip.label}
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        color: SHELL.INK,
                        background: chip.bg,
                        padding: '4px 10px',
                        borderRadius: 10,
                        marginBottom: 6,
                        display: 'inline-block',
                        marginRight: 4,
                      }}
                    >
                      {chip.label}
                    </div>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 11,
                    color: SHELL.PAPER,
                    background: SHELL.INK,
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                  }}
                >
                  Return to program evidence →
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Nexus advisory */}
      <div
        style={{
          background: SHELL.PAPER_SOFT,
          padding: '12px 16px',
          borderTop: `1px solid ${SHELL.CARD_LINE}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 4,
          }}
        >
          Nexus
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_MUTED,
            lineHeight: 1.5,
          }}
        >
          Documents are parsed for evidence and linked to {programName}. This is a deterministic extraction preview; Nexus highlights likely gate criteria without mutating the program record here.
        </div>
      </div>
    </div>
  );
}

// ─── Agent handoff overlay (PRG-STA-AGENT-HANDOFF) ───────────────────────────

interface AgentHandoffOverlayProps {
  fromAgent: { initials: string; name: string };
  toAgent: { initials: string; name: string };
  context: string;
  onComplete: () => void;
}

function AgentHandoffOverlay({
  fromAgent,
  toAgent,
  context,
  onComplete,
}: AgentHandoffOverlayProps) {
  const [status, setStatus] = useState<'idle' | 'transferring' | 'complete'>('idle');

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('transferring'), 600);
    const t2 = setTimeout(() => setStatus('complete'), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12,26,58,0.85)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: SHELL.INK,
          borderRadius: 16,
          padding: '40px 48px',
          maxWidth: 460,
          width: '90%',
          textAlign: 'center',
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(250,247,241,0.5)',
          }}
        >
          Agent Handoff
        </div>

        {/* Agent transfer visualization */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            margin: '24px 0',
          }}
        >
          {/* From-agent circle */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: SHELL.PAPER_DEEP,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 14,
                fontWeight: 700,
                color: SHELL.INK,
              }}
            >
              {fromAgent.initials}
            </span>
          </div>

          {/* Arrow */}
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              color: 'rgba(250,247,241,0.4)',
            }}
          >
            →
          </span>

          {/* To-agent circle */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: SHELL.MINT_BG,
              border: `2px solid ${SHELL.MINT_LINE}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 14,
                color: SHELL.MINT_TEXT,
              }}
            >
              {toAgent.initials}
            </span>
          </div>
        </div>

        {/* Handoff title */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            color: 'rgba(250,247,241,1)',
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {fromAgent.name} → {toAgent.name}
        </div>

        {/* Context */}
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: 'rgba(250,247,241,0.65)',
            marginBottom: 24,
          }}
        >
          {context}
        </div>

        {/* Transfer items box */}
        <div
          style={{
            background: 'rgba(237,231,213,0.10)',
            borderRadius: 8,
            padding: '12px 16px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(250,247,241,0.5)',
              marginBottom: 8,
            }}
          >
            Transferring
          </div>
          {[
            'Evidence citations → Evidence ledger',
            'Gate criteria status → Readiness assessment',
            `${context} → Active review`,
          ].map((row, i) => (
            <div
              key={`tr-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: i < 2 ? 6 : 0,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: SHELL.MINT_BG,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: 'rgba(250,247,241,0.8)',
                }}
              >
                {row}
              </span>
            </div>
          ))}
        </div>

        {/* Status line */}
        {status !== 'idle' && (
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: status === 'complete' ? SHELL.MINT_TEXT : SHELL.AMBER_DOT,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: status === 'complete' ? SHELL.MINT_TEXT : SHELL.AMBER_DOT,
              }}
            >
              {status === 'complete'
                ? '✓ Sentinel review is ready'
                : 'Transferring context...'}
            </span>
          </div>
        )}

        {/* Action button */}
        <div style={{ marginTop: 24 }}>
          {status !== 'complete' ? (
            <button
              disabled
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                background: SHELL.GRAY_BG,
                color: SHELL.GRAY_TEXT,
                border: 'none',
                borderRadius: 6,
                padding: '10px 24px',
                cursor: 'not-allowed',
              }}
            >
              Please wait...
            </button>
          ) : (
            <button
              onClick={onComplete}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                background: SHELL.MINT_BG,
                color: SHELL.MINT_TEXT,
                border: `1px solid ${SHELL.MINT_LINE}`,
                borderRadius: 6,
                padding: '10px 24px',
                cursor: 'pointer',
              }}
            >
              Open Sentinel review →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Gate approval drawer (PROG21) ────────────────���──────────────────────────

interface GateApprovalDrawerProps {
  drawerView: GateApprovalDrawerView;
  onClose: () => void;
}

function GateApprovalDrawer({ drawerView, onClose }: GateApprovalDrawerProps) {
  function statusDot(status: GateApprovalDrawerView['criteriaRows'][number]['status']): string {
    if (status === 'known') return SHELL.MINT_TEXT;
    if (status === 'blocked') return SHELL.RUST_TEXT;
    return SHELL.AMBER_DOT;
  }

  function statusLabel(status: GateApprovalDrawerView['criteriaRows'][number]['status']): string {
    if (status === 'known') return 'Known';
    if (status === 'blocked') return 'Blocked';
    return 'Missing';
  }

  function postureBg(posture: GateApprovalDrawerView['approvalPosture']): string {
    if (posture === 'ready') return SHELL.MINT_BG;
    if (posture === 'blocked' || posture === 'waiver_needed') return SHELL.PEACH_BG;
    return SHELL.PEACH_BG;
  }

  function postureText(posture: GateApprovalDrawerView['approvalPosture']): string {
    if (posture === 'ready') return SHELL.MINT_TEXT;
    return SHELL.PEACH_TEXT;
  }

  return (
    <div
      data-testid="gate-approval-drawer"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 480,
        background: SHELL.PAPER,
        borderLeft: `1px solid ${SHELL.CARD_LINE}`,
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 52,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 2 }}>
            Gate Review
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK, fontWeight: 500 }}>
            {drawerView.transitionLabel}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{ fontFamily: SHELL.SANS, fontSize: 20, color: SHELL.INK_SOFT, cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

        {/* Posture badge */}
        <div
          data-testid="gate-approval-posture-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: postureBg(drawerView.approvalPosture),
            borderRadius: 4,
            padding: '5px 10px',
            marginBottom: 20,
          }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: postureText(drawerView.approvalPosture) }}>
            {drawerView.postureLabel}
          </span>
        </div>

        {/* Gate summary */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 8 }}>
            Gate Summary
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK }}>
            {drawerView.gateSummary}
          </div>
        </div>

        {/* Criteria rows */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 10 }}>
            Gate Criteria
          </div>
          <div data-testid="gate-approval-criteria-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {drawerView.criteriaRows.map((row, i) => (
              <div
                key={`gate-criterion-${i}`}
                style={{
                  background: SHELL.CARD_WHITE,
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: statusDot(row.status),
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK, lineHeight: 1.4, marginBottom: 4 }}>
                      {row.criterion}
                    </div>
                    <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusDot(row.status) }}>
                      {statusLabel(row.status)}
                    </div>
                  </div>
                </div>
                {row.linkedEvidence.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
                    <div style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em', marginBottom: 4 }}>
                      Evidence
                    </div>
                    {row.linkedEvidence.map((cite, j) => (
                      <div key={`cite-${j}`} style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_SOFT, lineHeight: 1.4, marginBottom: 2 }}>
                        · {cite}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 8, fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em' }}>
                  Next: {row.nextAction}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval authority */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 6 }}>
            Approval Authority
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK }}>
            {drawerView.approvalAuthority}
          </div>
        </div>

        {/* Waiver caveat */}
        <div
          data-testid="gate-approval-waiver-caveat"
          style={{
            background: SHELL.PEACH_BG,
            border: `1px solid ${SHELL.PEACH_LINE}`,
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: SHELL.PEACH_TEXT, marginBottom: 6 }}>
            Waiver caveat
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.PEACH_TEXT, lineHeight: 1.5 }}>
            {drawerView.waiverCaveat}
          </div>
        </div>
      </div>

      {/* Footer — honest disclaimer */}
      <div
        style={{
          borderTop: `1px solid ${SHELL.CARD_LINE}`,
          padding: '12px 20px',
          flexShrink: 0,
        }}
      >
        <div
          data-testid="gate-approval-drawer-disclaimer"
          data-honest-disclaimer="gate-approval"
          style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em', lineHeight: 1.5 }}
        >
          {drawerView.honestDisclaimer}
        </div>
      </div>
    </div>
  );
}

// ─── Maestro next action composer (PROG24) ────────────────────────────────────

interface MaestroNextActionComposerProps {
  composerView: ReturnType<typeof buildMaestroNextActionView>;
  selectedChoice: 'A' | 'B' | 'C' | 'custom' | null;
  customText: string;
  onSelectChoice: (key: 'A' | 'B' | 'C' | 'custom') => void;
  onCustomTextChange: (text: string) => void;
}

function MaestroNextActionComposer({
  composerView,
  selectedChoice,
  customText,
  onSelectChoice,
  onCustomTextChange,
}: MaestroNextActionComposerProps) {
  const canSubmit =
    selectedChoice !== null &&
    (selectedChoice !== 'custom' || customText.trim().length > 5);

  return (
    <div
      data-testid="maestro-next-action-composer"
      style={{
        marginTop: 24,
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '16px 18px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 4 }}>
          Client Maestro
        </div>
        <div style={{ fontFamily: SHELL.SERIF, fontSize: 16, color: SHELL.INK, marginBottom: 4 }}>
          {composerView.headline}
        </div>
        <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.4 }}>
          {composerView.contextLine}
        </div>
      </div>

      {/* 3 Choices — explicit static testids required by integration tests */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {/* Choice A */}
        <button
          data-testid="maestro-action-choice-A"
          onClick={() => onSelectChoice('A')}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
            background: selectedChoice === 'A' ? SHELL.MINT_BG : SHELL.CARD_WHITE,
            border: `1px solid ${selectedChoice === 'A' ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
            borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
          }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 10, fontWeight: 700, color: selectedChoice === 'A' ? SHELL.MINT_TEXT : SHELL.INK_MUTED, background: selectedChoice === 'A' ? SHELL.MINT_BG : SHELL.PAPER_DEEP, borderRadius: 4, padding: '2px 7px', minWidth: 22, textAlign: 'center', flexShrink: 0 }}>A</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, marginBottom: 2 }}>{composerView.choices[0].label}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.4 }}>{composerView.choices[0].detail}</div>
          </div>
        </button>
        {/* Choice B */}
        <button
          data-testid="maestro-action-choice-B"
          onClick={() => onSelectChoice('B')}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
            background: selectedChoice === 'B' ? SHELL.MINT_BG : SHELL.CARD_WHITE,
            border: `1px solid ${selectedChoice === 'B' ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
            borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
          }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 10, fontWeight: 700, color: selectedChoice === 'B' ? SHELL.MINT_TEXT : SHELL.INK_MUTED, background: selectedChoice === 'B' ? SHELL.MINT_BG : SHELL.PAPER_DEEP, borderRadius: 4, padding: '2px 7px', minWidth: 22, textAlign: 'center', flexShrink: 0 }}>B</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, marginBottom: 2 }}>{composerView.choices[1].label}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.4 }}>{composerView.choices[1].detail}</div>
          </div>
        </button>
        {/* Choice C */}
        <button
          data-testid="maestro-action-choice-C"
          onClick={() => onSelectChoice('C')}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
            background: selectedChoice === 'C' ? SHELL.MINT_BG : SHELL.CARD_WHITE,
            border: `1px solid ${selectedChoice === 'C' ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
            borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
          }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 10, fontWeight: 700, color: selectedChoice === 'C' ? SHELL.MINT_TEXT : SHELL.INK_MUTED, background: selectedChoice === 'C' ? SHELL.MINT_BG : SHELL.PAPER_DEEP, borderRadius: 4, padding: '2px 7px', minWidth: 22, textAlign: 'center', flexShrink: 0 }}>C</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, marginBottom: 2 }}>{composerView.choices[2].label}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.4 }}>{composerView.choices[2].detail}</div>
          </div>
        </button>

        {/* Custom option */}
        <button
          data-testid="maestro-action-choice-custom"
          onClick={() => onSelectChoice('custom')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 14px',
            background: selectedChoice === 'custom' ? SHELL.MINT_BG : SHELL.CARD_WHITE,
            border: `1px solid ${selectedChoice === 'custom' ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
            borderRadius: 8,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 10, fontWeight: 700, color: selectedChoice === 'custom' ? SHELL.MINT_TEXT : SHELL.INK_MUTED }}>
            ✎
          </span>
          <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>
            Write a custom action
          </span>
        </button>
      </div>

      {/* Custom text area (shown when custom selected) */}
      {selectedChoice === 'custom' && (
        <div style={{ marginBottom: 12 }}>
          <textarea
            rows={3}
            value={customText}
            onChange={(e) => onCustomTextChange(e.target.value)}
            placeholder={composerView.customPlaceholder}
            style={{
              width: '100%',
              fontFamily: SHELL.SANS,
              fontSize: 13,
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              padding: 10,
              boxSizing: 'border-box',
              resize: 'vertical',
              color: SHELL.INK,
              outline: 'none',
              lineHeight: 1.5,
            }}
          />
        </div>
      )}

      {/* Submit row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button
          data-testid="maestro-action-submit"
          disabled={true}
          title={composerView.submitDisabledReason}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            padding: '8px 18px',
            borderRadius: 6,
            border: 'none',
            background: canSubmit ? SHELL.INK : SHELL.GRAY_BG,
            color: canSubmit ? SHELL.PAPER : SHELL.GRAY_TEXT,
            cursor: 'not-allowed',
            opacity: 0.6,
          }}
        >
          {composerView.submitLabel}
        </button>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.06em' }}>
          Deferred · live dispatch not yet wired
        </span>
      </div>

      {/* Honest disclaimer */}
      <div
        data-testid="maestro-action-composer-disclaimer"
        data-honest-disclaimer="maestro-next-action"
        style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em', lineHeight: 1.5 }}
      >
        {composerView.honestDisclaimer}
      </div>
    </div>
  );
}

// ─── CustomActionPanel (PRG-MOD-CUSTOM-ACTION) ──────────────────────────────���─

interface CustomActionPanelProps {
  placeholder?: string;
  onSubmit: (text: string) => void;
  onClose: () => void;
}

function CustomActionPanel({ placeholder, onSubmit, onClose }: CustomActionPanelProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div
      style={{
        background: SHELL.INK_MID,
        borderRadius: 8,
        padding: '12px 14px',
      }}
    >
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? 'Tell Nexus what to do...'}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          padding: '10px 12px',
          color: SHELL.PAPER,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          width: '100%',
          boxSizing: 'border-box',
          resize: 'none',
          outline: 'none',
          lineHeight: 1.5,
        }}
      />
      {/* Button row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: 'rgba(250,247,241,0.5)',
            padding: '5px 0',
            letterSpacing: '0.06em',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={{
            background: SHELL.PAPER,
            color: SHELL.INK,
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            fontFamily: SHELL.MONO,
            fontSize: 10,
            padding: '5px 12px',
            letterSpacing: '0.06em',
          }}
        >
          Send to Nexus
        </button>
      </div>
    </div>
  );
}

// ─── PhaseTransitionOverlay (PRG-STA-PHASE-TRANSITION) ────────────────────────

interface PhaseTransitionOverlayProps {
  fromPhase: number;
  fromPhaseLabel: string;
  toPhase: number;
  toPhaseLabel: string;
  programName: string;
  onComplete: () => void;
}

function PhaseTransitionOverlay({
  fromPhase,
  fromPhaseLabel,
  toPhase,
  toPhaseLabel,
  programName,
  onComplete,
}: PhaseTransitionOverlayProps) {
  const [animState, setAnimState] = useState<'entering' | 'showing' | 'complete'>('entering');
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    // entering → showing at 300ms
    const t1 = setTimeout(() => setAnimState('showing'), 300);
    // start progress bar fill after showing begins
    const t2 = setTimeout(() => setBarWidth(100), 350);
    // complete at 2500ms
    const t3 = setTimeout(() => {
      setAnimState('complete');
    }, 2500);
    // call onComplete slightly after fade-out starts
    const t4 = setTimeout(() => onComplete(), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const opacity = animState === 'entering' ? 0 : animState === 'complete' ? 0 : 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: SHELL.INK,
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* PHASE ADVANCE label */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: 'rgba(250,247,241,0.5)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom: 32,
        }}
      >
        Phase Advance
      </div>

      {/* Phase transition row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 40,
          alignItems: 'center',
        }}
      >
        {/* From phase */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: SHELL.MINT_BG,
              border: `1px solid ${SHELL.MINT_LINE}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.MINT_TEXT }}>
              P{fromPhase}
            </span>
          </div>
          <span style={{ fontFamily: SHELL.SERIF, fontSize: 16, color: SHELL.PAPER }}>
            {fromPhaseLabel}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: 'rgba(250,247,241,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Complete
          </span>
        </div>

        {/* Arrow */}
        <span style={{ fontFamily: SHELL.SERIF, fontSize: 28, color: 'rgba(250,247,241,0.3)' }}>
          →
        </span>

        {/* To phase */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: SHELL.PAPER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK }}>
              P{toPhase}
            </span>
          </div>
          <span style={{ fontFamily: SHELL.SERIF, fontSize: 20, color: SHELL.PAPER }}>
            {toPhaseLabel}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.AMBER_DOT,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Starting now
          </span>
        </div>
      </div>

      {/* Program name */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: 'rgba(250,247,241,0.5)',
          marginTop: 24,
        }}
      >
        {programName}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 200,
          height: 4,
          borderRadius: 2,
          background: SHELL.CARD_LINE,
          marginTop: 32,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 2,
            background: SHELL.MINT_TEXT,
            width: `${barWidth}%`,
            transition: 'width 2s linear',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProgramDetailPage({ view }: ProgramDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const gateSectionRef = useRef<HTMLDivElement>(null);
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateApproveError, setGateApproveError] = useState<string | null>(null);
  const [isApprovingGate, setIsApprovingGate] = useState(false);
  // PROG21 — Gate approval interaction drawer
  const [showGateApprovalDrawer, setShowGateApprovalDrawer] = useState(false);
  const gateApprovalDrawerView = buildGateApprovalDrawerView(view);
  // PROG22 — Deliverables canvas polish
  const deliverablesCanvasView = buildDeliverablesCanvasView(view);
  // PROG24 — Maestro next action composer
  const maestroActionView = buildMaestroNextActionView(view);
  // PROG25 — Workshop notes to actions/deliverables plan
  const workshopNotesPlanView = buildWorkshopNotesActionPlanView(view);
  const [maestroSelectedChoice, setMaestroSelectedChoice] = useState<'A' | 'B' | 'C' | 'custom' | null>(null);
  const [maestroCustomText, setMaestroCustomText] = useState('');
  const [evidenceDrawerItem, setEvidenceDrawerItem] = useState<EvidenceItem | null>(null);
  const [contradictionItem, setContradictionItem] = useState<EvidenceItem | null>(null);

  // PRG-STA-SUGGESTED-ACTION state
  const [suggestedAction, setSuggestedAction] = useState<{
    letter: 'A' | 'B' | 'C';
    text: string;
    detail?: string;
    href?: string;
    frame: 1 | 2 | 3;
  } | null>(null);

  // PRG-STA-FILE-UPLOAD state
  const [showFileUpload, setShowFileUpload] = useState(false);

  // PRG-STA-AGENT-HANDOFF state
  const [showHandoff, setShowHandoff] = useState(false);

  // PRG-MOD-CUSTOM-ACTION state
  const [showCustomAction, setShowCustomAction] = useState(false);
  const [customActionSent, setCustomActionSent] = useState(false);

  // PRG-STA-PHASE-TRANSITION state
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);

  // PRG-MOD-SCORECARD-OVERRIDE state
  const [showScorecardOverride, setShowScorecardOverride] = useState(false);

  // Mode B — AtlasDrawer open state (Shell Layout Spec v2 §5)
  const [drawerOpen, setDrawerOpen] = useState(false);

  // REASON-15 — live Nexus synthesis quote (streams from /api/programs/synthesis)
  const [synthesisQuote, setSynthesisQuote] = useState(view.workbench.prose);

  // PROG20 — Section tab navigation
  type SectionKey = 'overview' | 'gate' | 'evidence' | 'deliverables' | 'workshop' | 'actions' | 'decisions';
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');

  const phaseLabel = PHASE_LABEL_MAP[view.viewingPhase] ?? `Phase ${view.viewingPhase}`;
  // PROG23 — linked source event context (deterministic, matches displayId casing)
  const sourceLinkView = buildProgramSourceLinkView(view.displayId);
  const currentScore =
    view.programId === 'apx-cdp-2026' && view.viewingPhase === 2
      ? '36%'
      : view.programId === 'apx-cdp-2026' && view.viewingPhase === 3
        ? '100%'
        : '—';

  // Map ProgramPhaseSlot to PhaseStripSlot
  const stripPhases: PhaseStripSlot[] = view.phases.map((s) => ({
    id: s.id as PhaseStripSlot['id'],
    label: s.label,
    state: s.state,
  }));

  const handlePhaseSelect = (id: PhaseStripSlot['id']) => {
    router.push(`/programs/${view.programId}?phase=${id}`, { scroll: false });
  };

  // Cast actions for AgentColumn
  const agentActions = view.workbench.actions.map((a) => ({
    letter: a.letter as 'A' | 'B' | 'C',
    text: a.text,
    detail: a.detail,
    href: a.href,
  }));

  const handleActionClick = (letter: 'A' | 'B' | 'C') => {
    if (letter === 'A') {
      // Switch to Gate tab so the gate criteria section is visible
      setActiveSection('gate');
      setTimeout(() => gateSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return;
    }
    if (letter === 'B') {
      setShowHandoff(true);
      return;
    }
    // C falls through to the SuggestedActionOverlay
    const action = view.workbench.actions.find((a) => a.letter === letter);
    if (action) {
      setSuggestedAction({
        letter: action.letter as 'A' | 'B' | 'C',
        text: action.text,
        detail: action.detail,
        href: action.href,
        frame: 1,
      });
    }
  };

  // Stage-aware pane contract (Shell Layout Spec v2 §7)
  const currentStage = `P${view.viewingPhase}` as StageId;
  const programSurfaceContext: Record<string, unknown> = {
    programId: view.programId,
    displayId: view.displayId,
    programName: view.name,
    phase: view.viewingPhase,
    phaseLabel,
    gateStatus: view.gateStatus,
  };
  const storylineMatches = matchStorylinePatterns(
    buildProgramStorylineContext({
      programId: view.programId,
      displayId: view.displayId,
      name: view.name,
      phaseLabel,
    }),
  );

  // REASON-29 — Header-level failure-mode warning chip for Programs detail.
  // Builds the same SynthesisContext used by the provenance ribbon so a
  // high-confidence detected anti-pattern is visible alongside the GatePill
  // without scrolling.
  const failureModeHeaderInfo = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    const ctx = buildProgramSynthesisContext(instance);
    const summary = summarizeFailureModes(ctx);
    if (summary.topLabel === null || summary.highConfidence === 0) return null;
    const topDetection = ctx.failureModes.find(
      (d) => d.label === summary.topLabel,
    );
    return {
      topLabel: summary.topLabel,
      topConfidence: summary.topConfidence,
      highCount: summary.highConfidence,
      mitigations: topDetection?.mitigations,
    };
  })();

  // REASON-30 — Active contradictions for the current program instance,
  // filtered against the local resolution ring buffer so dismissed cards
  // do not reappear on subsequent renders within the same server lifetime.
  const contradictionInfo = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    const ctx = buildProgramSynthesisContext(instance);
    const active = ctx.activeContradictions.filter(
      (c) => !isContradictionResolved(`${instance.id}::${c.templateId}`),
    );
    return { instanceId: instance.id, contradictions: active };
  })();

  // REASON-31 — Cascade impact info: downstream impacts from the synthesis
  // context plus the upstream `computeReverseCascade` view so the user can
  // see both directions of the cross-instance dependency graph.
  const cascadeInfo = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    const ctx = buildProgramSynthesisContext(instance);
    return {
      instanceId: instance.displayId,
      impacts: ctx.cascadeContext,
      upstream: computeReverseCascade(instance),
    };
  })();

  // PRG-EVIDENCE-INGEST — Resolve the underlying program-instance id +
  // currentPhase so the demo evidence-ingestion form can POST against the
  // shared in-memory store (mirrors the Source detail page).
  const evidenceIngestionInfo = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    return { instanceId: instance.id, currentPhase: instance.currentPhase };
  })();

  // REASON-32 — Per-instance reasoning event timeline entries. Reads from
  // the synthesis telemetry, evidence ingestion store, and contradiction
  // resolution state, all keyed by the underlying program-instance id.
  const timelineEntries = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    return { instanceId: instance.id, entries: buildInstanceEventTimeline(instance.id) };
  })();

  return (
    <AppShell
      surface="programs-detail"
      stage={currentStage}
      surfaceContext={programSurfaceContext}
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `${view.displayId} · P${view.viewingPhase} ${phaseLabel}`,
      }}
      middleStrip={
        <PhaseStrip phases={stripPhases} onPhaseSelect={handlePhaseSelect} />
      }
    >
      {/* Mode B: full-width canvas column with ribbon + scrollable work pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <RibbonSynthesis
          agentInitials="Nx"
          agentName="Nexus"
          quote={synthesisQuote}
          isOpen={drawerOpen}
          onToggle={() => setDrawerOpen((v) => !v)}
        />

        {/* REASON-28 — provenance ribbon: surfaces what informed Nexus's synthesis */}
        {(() => {
          const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
            (i) =>
              i.displayId === view.displayId ||
              i.id.toLowerCase() === view.programId.toLowerCase(),
          );
          if (!instance) return null;
          const synthesisContext = buildProgramSynthesisContext(instance);
          return <ProgramProvenanceRibbon context={synthesisContext} />;
        })()}

        {/* REASON-15 — hidden synthesis node; streams live Nexus quote into ribbon */}
        <div style={{ display: 'none' }} aria-hidden>
          <NexusSynthesisQuote
            programId={view.programId}
            fallback={view.workbench.prose}
            onLoaded={setSynthesisQuote}
          />
        </div>

        {/* Work pane — WorkingPaneContainer adds stage label strip + gate badge
            and renders existing content as children (Shell Layout Spec v2 §7) */}
        <WorkingPaneContainer
          shapeResolver={programsShapeResolver}
          style={{ background: SHELL.PAPER }}
        >
        <div data-testid="program-detail-page" style={{ padding: '24px 32px' }}>
        {/* Program header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                fontWeight: 700,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.06em',
              }}
            >
              {view.displayId}
            </span>
            <GatePill status={view.gateStatus} />
            {failureModeHeaderInfo && (
              <FailureModeWarningChip
                topLabel={failureModeHeaderInfo.topLabel}
                topConfidence={failureModeHeaderInfo.topConfidence}
                highCount={failureModeHeaderInfo.highCount}
                mitigations={failureModeHeaderInfo.mitigations}
              />
            )}
            {/* Upload affordance */}
            <button
              onClick={() => setShowFileUpload(true)}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_SOFT,
                background: 'none',
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 5,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              ↑ Upload document
            </button>
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 600,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            {view.name}
          </h1>
          <div
            style={{
              marginTop: 8,
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.06em',
            }}
          >
            <span data-honest-disclaimer="programs-detail">
              {view.displayId} · Deterministic seed
            </span>
          </div>
        </div>

        {storylineMatches.length > 0 && (
          <div
            data-testid="program-storyline-pattern-chips"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              margin: '-8px 0 16px',
            }}
          >
            {storylineMatches.map((pattern) => (
              <PatternChip key={pattern.id} pattern={pattern} />
            ))}
          </div>
        )}

        {/* Mission queue · derived from the program's pending gate criteria.
            TASK-oriented complement to the Gate section's STATUS view. */}
        {(() => {
          const missions = getMissionsForProgram(view.programId);
          return (
            <div style={{ marginBottom: 20 }}>
              <MissionList
                missions={missions}
                title="Pending gates · this program"
                maxRows={6}
              />
            </div>
          );
        })()}

        {/* PROG20 — Section tab strip */}
        <div
          data-testid="program-section-tabs"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${SHELL.CARD_LINE}`,
            marginBottom: 20,
            gap: 0,
          }}
        >
          <SubNavStrip
            items={[
              { key: 'overview', label: 'Overview', active: activeSection === 'overview', onClick: () => setActiveSection('overview') },
              { key: 'gate', label: 'Gate', count: view.phasePanel.gateCriteria?.length, active: activeSection === 'gate', onClick: () => setActiveSection('gate') },
              { key: 'evidence', label: 'Evidence', count: view.phasePanel.evidenceItems?.length, active: activeSection === 'evidence', onClick: () => setActiveSection('evidence') },
              { key: 'deliverables', label: 'Deliverables', count: view.phasePanel.deliverables?.length, active: activeSection === 'deliverables', onClick: () => setActiveSection('deliverables') },
              { key: 'workshop', label: 'Workshop', active: activeSection === 'workshop', onClick: () => setActiveSection('workshop') },
              { key: 'actions', label: 'Actions', count: view.workbench.actions.length, active: activeSection === 'actions', onClick: () => setActiveSection('actions') },
              { key: 'decisions', label: 'Decisions', active: activeSection === 'decisions', onClick: () => setActiveSection('decisions') },
            ]}
          />
        </div>

        {/* ── Overview section ──────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div data-testid="program-section-overview">
            {view.phasePanel.summary && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 14px',
                  background: SHELL.PAPER_DEEP,
                  borderRadius: 7,
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK,
                  lineHeight: 1.7,
                }}
              >
                {view.phasePanel.summary}
              </div>
            )}
            {view.phasePanel.blockerNote && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 14px',
                  background: SHELL.PEACH_BG,
                  border: `1px solid ${SHELL.PEACH_LINE}`,
                  borderRadius: 7,
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.PEACH_TEXT,
                  lineHeight: 1.5,
                }}
              >
                {view.phasePanel.blockerNote}
              </div>
            )}
            {view.linkedSourceEvent && (
              <div data-testid="program-linked-source-chip" style={{ marginBottom: 12 }}>
                <LinkedProgramChip
                  direction="program-to-source"
                  linkedId="SRC-AMS-2026"
                  linkedName="AMS Vendor Consolidation 2026"
                  linkedStage="BAFO · Stage 7"
                  href="/source/events/apex-retail-ams-outsourcing-2026"
                />
              </div>
            )}
            {/* PROG23 — Source event commercial context card */}
            {sourceLinkView && (
              <div
                data-testid="program-source-context-card"
                style={{ marginBottom: 20 }}
              >
                <SourceEventChip view={sourceLinkView} />
              </div>
            )}
            {!view.phasePanel.summary && !view.phasePanel.blockerNote && !view.linkedSourceEvent && !sourceLinkView && (
              <div
                style={{
                  padding: '20px 0',
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK_MUTED,
                }}
              >
                No phase summary available for P{view.viewingPhase}.
              </div>
            )}
          </div>
        )}

        {/* ── Gate section ──────────────────────────────────────────── */}
        {activeSection === 'gate' && (
          <div data-testid="program-section-gate">
            <div data-testid="program-gate-ribbon">
            {view.gateStatus === 'pending' && view.phasePanel.gateCriteria && (
              <>
                <GateRibbon
                  fromPhase={view.viewingPhase}
                  toPhase={view.viewingPhase + 1}
                  totalCriteria={view.phasePanel.gateCriteria.length}
                  metCriteria={view.phasePanel.gateCriteria.filter((c) => c.met).length}
                  onRequestApproval={() => setShowGateModal(true)}
                />
                {/* PRG-STA-PHASE-TRANSITION preview trigger */}
                <div style={{ marginBottom: 8, textAlign: 'right' }}>
                  <button
                    onClick={() => setShowPhaseTransition(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: SHELL.MONO,
                      fontSize: 9,
                      color: SHELL.INK_MUTED,
                      letterSpacing: '0.08em',
                    }}
                  >
                    Preview phase transition →
                  </button>
                </div>
              </>
            )}
            </div>
            {view.phasePanel.gateCriteria && view.phasePanel.gateCriteria.length > 0 && (
              <div ref={gateSectionRef} style={{ marginBottom: 20 }}>
                <GateCriteriaList criteria={view.phasePanel.gateCriteria} />
              </div>
            )}
            {!view.phasePanel.gateCriteria && (
              <div style={{ padding: '20px 0', fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED }}>
                Gate criteria not defined for P{view.viewingPhase}.
              </div>
            )}
            {/* REASON-30 — Contradiction detail card sits below gate criteria */}
            {contradictionInfo && contradictionInfo.contradictions.length > 0 && (
              <ContradictionDetailCardClient
                contradictions={contradictionInfo.contradictions}
                instanceId={contradictionInfo.instanceId}
              />
            )}
            {/* REASON-31 — Cascade impact detail (downstream + upstream) */}
            {cascadeInfo && (
              <>
                <CascadeImpactCard
                  impacts={cascadeInfo.impacts}
                  title="Downstream impacts"
                />
                {cascadeInfo.upstream.length > 0 && (
                  <ReverseCascadeCard
                    upstream={cascadeInfo.upstream}
                    thisInstanceId={cascadeInfo.instanceId}
                    title="Upstream dependencies"
                  />
                )}
              </>
            )}
            {/* REASON-32 — Per-instance reasoning event timeline. */}
            {timelineEntries && (
              <InstanceEventTimeline entries={timelineEntries.entries} />
            )}
            {/* PRG-EVIDENCE-INGEST — demo form to POST evidence and watch
                gates flip on next render via buildProgramEvidenceMapWithIngestions. */}
            {evidenceIngestionInfo && (
              <div style={{ marginTop: 12 }}>
                <AddProgramEvidenceForm
                  instanceId={evidenceIngestionInfo.instanceId}
                  currentPhase={evidenceIngestionInfo.currentPhase}
                />
              </div>
            )}
            {/* PROG21 — Gate approval interaction drawer trigger */}
            {gateApprovalDrawerView && (
              <div style={{ marginTop: 12 }}>
                <button
                  data-testid="gate-approval-drawer-trigger"
                  onClick={() => setShowGateApprovalDrawer(true)}
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: SHELL.INK_MUTED,
                    background: 'none',
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: 4,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Review gate readiness →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Evidence section ──────────────────────────────────────── */}
        {activeSection === 'evidence' && (
          <div data-testid="program-section-evidence">
            {view.phasePanel.evidenceItems && view.phasePanel.evidenceItems.length > 0 ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <EvidenceSection
                    items={view.phasePanel.evidenceItems}
                    onView={(item) => setEvidenceDrawerItem(item)}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => setShowScorecardOverride(true)}
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      color: SHELL.INK_MUTED,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Ste · Override coverage score →
                  </button>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <button
                    onClick={() => setShowHandoff(true)}
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK_SOFT,
                      background: 'none',
                      border: `1px solid ${SHELL.CARD_LINE}`,
                      borderRadius: 5,
                      padding: '5px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Sn · Request Sentinel evidence review →
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '20px 0', fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED }}>
                No evidence citations logged for P{view.viewingPhase}.
              </div>
            )}
          </div>
        )}

        {/* ── Deliverables section ──────────────────────────────────── */}
        {activeSection === 'deliverables' && (
          <div data-testid="program-section-deliverables">
            {deliverablesCanvasView ? (
              <div style={{ marginBottom: 20 }}>
                <DeliverablesCanvas canvasView={deliverablesCanvasView} />
              </div>
            ) : view.phasePanel.deliverables && view.phasePanel.deliverables.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <DeliverablesList deliverables={view.phasePanel.deliverables} />
              </div>
            ) : (
              <div style={{ padding: '20px 0', fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED }}>
                No deliverables logged for P{view.viewingPhase}.
              </div>
            )}
          </div>
        )}

        {/* ── Workshop section ──────────────────────────────────────── */}
        {activeSection === 'workshop' && (
          <div data-testid="program-section-workshop">
            <div
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: SHELL.MINT_BG,
                borderRadius: 8,
                border: `1px solid ${SHELL.MINT_LINE}`,
              }}
            >
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: SHELL.MINT_TEXT,
                  marginBottom: 8,
                }}
              >
                Nexus · {view.workbench.title}
              </div>
              <p style={{ fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.7, color: SHELL.INK, margin: 0 }}>
                {view.workbench.prose}
              </p>
            </div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                marginBottom: 10,
              }}
            >
              {view.workbench.actionsLabel}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {view.workbench.actions.map((a) => (
                <div
                  key={a.letter}
                  style={{
                    padding: '10px 14px',
                    background: SHELL.PAPER_DEEP,
                    borderRadius: 7,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 11,
                      fontWeight: 700,
                      color: SHELL.INK,
                      minWidth: 16,
                    }}
                  >
                    {a.letter}
                  </span>
                  <div>
                    <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, marginBottom: 2 }}>
                      {a.text}
                    </div>
                    <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>
                      {a.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <WorkshopNotesActionPlanPanel view={workshopNotesPlanView} />
            {/* PROG24 — Maestro next action composer */}
            <MaestroNextActionComposer
              composerView={maestroActionView}
              selectedChoice={maestroSelectedChoice}
              customText={maestroCustomText}
              onSelectChoice={setMaestroSelectedChoice}
              onCustomTextChange={setMaestroCustomText}
            />
          </div>
        )}

        {/* ── Actions section ───────────────────────────────────────── */}
        {activeSection === 'actions' && (
          <div data-testid="program-section-actions">
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                marginBottom: 12,
              }}
            >
              Nexus · Next actions · P{view.viewingPhase} {phaseLabel}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {view.workbench.actions.map((a) => (
                <button
                  key={a.letter}
                  onClick={() => handleActionClick(a.letter as 'A' | 'B' | 'C')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: SHELL.PAPER,
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: 7,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      color: SHELL.INK,
                      background: SHELL.PAPER_DEEP,
                      borderRadius: 4,
                      padding: '2px 7px',
                      minWidth: 22,
                      textAlign: 'center',
                    }}
                  >
                    {a.letter}
                  </span>
                  <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK }}>
                    {a.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Decisions section ─────────────────────────────────────── */}
        {activeSection === 'decisions' && (
          <div data-testid="program-section-decisions">
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                marginBottom: 12,
              }}
            >
              Decisions · P{view.viewingPhase} {phaseLabel}
            </div>
            {[
              {
                id: 'DEC-01',
                label: 'Data architecture vendor',
                status: view.linkedSourceEvent ? 'pending' : 'open',
                note: view.linkedSourceEvent
                  ? 'Pending AMS BAFO outcome (Stage 7) — Vendor C preferred'
                  : 'No linked sourcing event',
              },
              {
                id: 'DEC-02',
                label: 'AI Cloud Spend rate card',
                status: 'pending',
                note: 'Rate card recovery option available · spend 33% over budget',
              },
              {
                id: 'DEC-03',
                label: 'Gate approval authority',
                status: view.gateStatus === 'approved' ? 'closed' : 'open',
                note: view.gateStatus === 'approved'
                  ? 'Gate approved — next phase unlocked'
                  : `Gate ${view.gateStatus} — Steward review required`,
              },
            ].map((dec) => (
              <div
                key={dec.id}
                style={{
                  marginBottom: 10,
                  padding: '10px 14px',
                  background: SHELL.PAPER_DEEP,
                  borderRadius: 7,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    fontWeight: 700,
                    color: dec.status === 'closed' ? SHELL.MINT_TEXT : SHELL.PEACH_TEXT,
                    background: dec.status === 'closed' ? SHELL.MINT_BG : SHELL.PEACH_BG,
                    borderRadius: 4,
                    padding: '2px 6px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    minWidth: 48,
                    textAlign: 'center',
                  }}
                >
                  {dec.status}
                </span>
                <div>
                  <div style={{ fontFamily: SHELL.SANS, fontSize: 13, fontWeight: 600, color: SHELL.INK, marginBottom: 2 }}>
                    {dec.label}
                  </div>
                  <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.5 }}>
                    {dec.note}
                  </div>
                </div>
              </div>
            ))}
            <div
              style={{ marginTop: 8, fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.08em' }}
              data-honest-disclaimer="programs-decisions"
            >
              Deterministic seed · decisions reflect fixture context only
            </div>
          </div>
        )}

        </div>
      </WorkingPaneContainer>
      </div>

      {/* Mode B — AtlasDrawer (shared AtlasPageState, Shell Layout Spec v2 §5.1) */}
      <AtlasDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        agent={{ initials: 'Nx', name: 'Nexus', role: 'Program Orchestrator' }}
        quote={view.workbench.prose}
        surface="programs-detail"
        programId={view.programId}
      />

      {/* Gate approval modal — portal-style fixed overlay */}
      {showGateModal && view.phasePanel.gateCriteria && (
        <GateApproveModal
          fromPhase={view.viewingPhase}
          toPhase={view.viewingPhase + 1}
          unmetCriteria={view.phasePanel.gateCriteria
            .filter((c) => !c.met)
            .map((c) => c.criterion)}
          isLoading={isApprovingGate}
          error={gateApproveError}
          onApprove={async (rationale) => {
            setIsApprovingGate(true);
            setGateApproveError(null);
            try {
              const res = await fetch(`/api/v1/programs/${view.programId}/advance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  toPhase: view.viewingPhase + 1,
                  bypassGate: true,
                  snapshot: { rationale, approvedAt: new Date().toISOString() },
                }),
              });
              const data = await res.json();
              if (data.ok) {
                setShowGateModal(false);
                const advancedPhase = data.newPhase as ProgramPhaseId;
                const advancedLabel = PHASE_LABEL_MAP[advancedPhase] ?? `Phase ${data.newPhase}`;
                toast({
                  type: 'success',
                  title: 'Gate approved',
                  message: `${view.displayId} advancing to P${data.newPhase} ${advancedLabel}`,
                });
                setShowPhaseTransition(true);
                setTimeout(() => {
                  setShowPhaseTransition(false);
                  router.push(`/programs/${view.programId}?phase=${data.newPhase}`);
                }, 2500);
              } else if (data.error === 'gate_blocked') {
                const errMsg = 'Gate blocked — hard gate criteria must be met before advancing';
                setGateApproveError(errMsg);
                toast({ type: 'error', title: 'Gate approval failed', message: errMsg });
              } else if (data.error === 'approval_required') {
                const errMsg = 'Approval request created — waiting for founder sign-off';
                setGateApproveError(errMsg);
                toast({ type: 'error', title: 'Gate approval failed', message: errMsg });
              } else {
                const errMsg = data.detail ?? data.message ?? 'Phase advance failed — please try again';
                setGateApproveError(errMsg);
                toast({ type: 'error', title: 'Gate approval failed', message: errMsg });
              }
            } catch {
              const errMsg = 'Network error — please try again';
              setGateApproveError(errMsg);
              toast({ type: 'error', title: 'Gate approval failed', message: errMsg });
            } finally {
              setIsApprovingGate(false);
            }
          }}
          onClose={() => setShowGateModal(false)}
        />
      )}

      {/* PRG-MOD-SCORECARD-OVERRIDE modal */}
      {showScorecardOverride && (
        <ScorecardOverrideModal
          currentScore={currentScore}
          onClose={() => setShowScorecardOverride(false)}
        />
      )}

      {/* Evidence drawer */}
      {evidenceDrawerItem && (
        <EvidenceDrawer
          item={evidenceDrawerItem}
          onClose={() => setEvidenceDrawerItem(null)}
          onResolveContradiction={(item) => {
            setEvidenceDrawerItem(null);
            setContradictionItem(item);
          }}
        />
      )}

      {/* Contradiction modal */}
      {contradictionItem && (
        <ContradictionModal
          item={contradictionItem}
          onResolve={(res) => {
            console.log('Resolved', res);
            setContradictionItem(null);
          }}
          onClose={() => setContradictionItem(null)}
        />
      )}

      {/* PRG-STA-SUGGESTED-ACTION overlay */}
      {suggestedAction && (
        <SuggestedActionOverlay
          action={suggestedAction}
          onAdvance={() =>
            setSuggestedAction((s) =>
              s ? { ...s, frame: (s.frame < 3 ? s.frame + 1 : 3) as 1 | 2 | 3 } : null,
            )
          }
          onDismiss={() => setSuggestedAction(null)}
        />
      )}

      {/* PRG-STA-FILE-UPLOAD overlay */}
      {showFileUpload && (
        <FileUploadOverlay
          programName={view.name}
          programId={view.programId}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {/* PRG-STA-AGENT-HANDOFF overlay */}
      {showHandoff && (
        <AgentHandoffOverlay
          fromAgent={{ initials: 'Nx', name: 'Nexus' }}
          toAgent={{ initials: 'Sn', name: 'Sentinel' }}
          context={`${view.displayId} · P${view.viewingPhase} ${phaseLabel} evidence review`}
          onComplete={() => setShowHandoff(false)}
        />
      )}

      {/* PRG-STA-PHASE-TRANSITION overlay */}
      {showPhaseTransition && (
        <PhaseTransitionOverlay
          fromPhase={view.viewingPhase}
          fromPhaseLabel={PHASE_LABEL_MAP[view.viewingPhase as ProgramPhaseId] ?? ''}
          toPhase={view.viewingPhase + 1}
          toPhaseLabel={PHASE_LABEL_MAP[(view.viewingPhase + 1) as ProgramPhaseId] ?? ''}
          programName={view.name}
          onComplete={() => setShowPhaseTransition(false)}
        />
      )}

      {/* PROG21 — Gate approval interaction drawer */}
      {showGateApprovalDrawer && gateApprovalDrawerView && (
        <GateApprovalDrawer
          drawerView={gateApprovalDrawerView}
          onClose={() => setShowGateApprovalDrawer(false)}
        />
      )}
    </AppShell>
  );
}
