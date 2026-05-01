'use client';

// SHELL-B — Program Detail Page adapted to AppShell.

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Artifact as NexusArtifact } from '@/lib/agent/artifacts';
// NexusReactivePanel renders inside AgentCanvas now; the import here is
// no longer needed at the page level.
import { AgentCanvas } from '@/components/programs/AgentCanvas';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { RibbonSynthesis } from '@/components/shell/RibbonSynthesis';
// AtlasDrawer used to render here as a Mode B overlay drawer. Surface
// 2 PR-F replaced it with the embedded chat inside <AgentCanvas>; the
// import lives on through AgentCanvas (which embeds AtlasDrawer with
// `embedded` prop).
import { WorkingPaneContainer } from '@/components/shell/WorkingPaneContainer';
import { programsShapeResolver } from '@/lib/programs/programs-shape-resolver';
import { PhaseStrip } from '@/components/shell/PhaseStrip';
import type { PhaseStripSlot } from '@/components/shell/PhaseStrip';
import { ProgramJourneyRail } from '@/components/programs/ProgramJourneyRail';
import type { ProgramPhaseSlot } from '@/components/programs/ProgramJourneyRail';
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
import { DownloadContextButton } from '@/components/reasoning/DownloadContextButton';
import { SourceEventChip } from '@/components/programs/SourceEventChip';
import { buildProgramSourceLinkView } from '@/lib/programs/program-source-link-view';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { summarizeFailureModes } from '@/lib/reasoning/provenance-ribbon-helpers';
import { FailureModeWarningChip } from '@/components/_shared/FailureModeWarningChip';
import { EvidenceQualityChip } from '@/components/_shared/EvidenceQualityChip';
import { StaleEvidenceChip } from '@/components/reasoning/StaleEvidenceChip';
import { InstanceHealthBadge } from '@/components/_shared/InstanceHealthBadge';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import {
  summarizeEvidenceQuality,
  summaryGrade,
  scoreEvidenceItem,
} from '@/lib/reasoning/evidence-quality';
import { CompareWithDropdown } from '@/components/_shared/CompareWithDropdown';
import { getAllInstanceIds } from '@/lib/reasoning/instance-resolver';
import { ContradictionDetailCardClient } from '@/components/_shared/ContradictionDetailCardClient';
import { RiskRegisterPanel } from '@/components/_shared/RiskRegisterPanel';
import { buildRiskRegisterForInstance } from '@/lib/reasoning/risk-register';
import { CascadeImpactCard, ReverseCascadeCard } from '@/components/_shared/CascadeImpactCard';
import { LinkedInstanceTilesGrid } from '@/components/_shared/LinkedInstanceTilesGrid';
import { InstanceEventTimeline } from '@/components/_shared/InstanceEventTimeline';
import { InstanceEventTimelineFilterBar } from '@/components/_shared/InstanceEventTimelineFilterBar';
import type { TimelineFilters } from '@/lib/reasoning/instance-event-timeline-filters';
import { LifecycleMiniGraph } from '@/components/_shared/LifecycleMiniGraph';
import { StageSynthesisDrawer } from '@/components/_shared/StageSynthesisDrawer';
import { HandoffNarrativePanel } from '@/components/_shared/HandoffNarrativePanel';
import type { StageStatus } from '@/components/shell/StageTrackerStrip';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { buildStageMicroSynthesisMap } from '@/lib/reasoning/stage-micro-synthesis';
import { buildStageHandoffNarratives } from '@/lib/reasoning/stage-handoff-narrative';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
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
import { MissionListInteractive } from '@/components/_shared/MissionListInteractive';
import { RecentMissionStates } from '@/components/_shared/RecentMissionStates';
import { getMissionsForProgram } from '@/lib/agent/agent-mission-derived';
import { AddProgramEvidenceForm } from '@/components/programs/AddProgramEvidenceForm';
import { BulkEvidenceImportButton } from '@/components/programs/BulkEvidenceImportButton';
import { CascadeImpactSection } from '@/components/_shared/CascadeImpactSection';
import { PhaseAdvanceButton } from '@/components/programs/PhaseAdvanceButton';
import { EvidenceCoverageHeatmap } from '@/components/reasoning/EvidenceCoverageHeatmap';
import { EvidenceNetworkGraph } from '@/components/reasoning/EvidenceNetworkGraph';
import { ReasoningErrorBoundary } from '@/components/reasoning/ReasoningErrorBoundary';
import { EvidenceTagChips } from '@/components/reasoning/EvidenceTagChips';
import { EvidenceSuggestionsPanel } from '@/components/reasoning/EvidenceSuggestionsPanel';
import { buildEvidenceSuggestions } from '@/lib/reasoning/evidence-suggestions';
import { GateHistorySidebar } from '@/components/reasoning/GateHistorySidebar';
import { Phase0Primer } from '@/components/programs/Phase0Primer';
import type { ArchetypePrimer } from '@/lib/programs/archetype-primers';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProgramDetailPageProps {
  view: ProgramDetailView;
  /**
   * URL-driven filter state for the per-instance reasoning event timeline.
   * Decoded from the page-level `searchParams` upstream so the rendered
   * filter strip reflects the current URL, and the entries are filtered
   * server-side. `undefined` → render the full timeline with no filter.
   */
  timelineFilters?: TimelineFilters;
  /**
   * Search params already on the page (e.g. `phase=3`) — emitted as hidden
   * inputs by the timeline filter bar so they survive the GET round-trip.
   */
  preservedSearchParams?: Readonly<Record<string, string | undefined>>;
  /**
   * OV2-3b · Phase-0 archetype primer resolved server-side from the
   * program's `patternId`. Rendered as a top-level page section above
   * the AgentCanvas when the program is in P0; null when no primer is
   * registered for the resolved patternId or the program is past P0.
   */
  phase0Primer?: ArchetypePrimer | null;
  /**
   * CB-8 · whether the session has a real tenant binding. Resolved
   * server-side from `getCurrentUser().defaultClientId`. Threaded into
   * AppShell so the 4-mode toggle can correctly disable Tenant / Full
   * when no tenant is bound. Defaults to `false`.
   */
  hasTenantKey?: boolean;
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

function LifecycleStateBanner({ view }: { view: ProgramDetailView }) {
  const state = view.lifecycleState;
  if (state !== 'submitted_for_approval' && !(state === 'approved' && view.currentPhase === 0)) {
    return null;
  }

  const isPendingSetup = state === 'submitted_for_approval';
  return (
    <div
      data-testid="program-lifecycle-state-banner"
      style={{
        margin: '14px 0 4px',
        padding: '14px 16px',
        borderRadius: 10,
        border: `1px solid ${isPendingSetup ? SHELL.PEACH_LINE : SHELL.MINT_LINE}`,
        background: isPendingSetup ? SHELL.PEACH_BG : SHELL.MINT_BG,
        fontFamily: SHELL.SANS,
        color: SHELL.INK,
        lineHeight: 1.45,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: isPendingSetup ? SHELL.PEACH_TEXT : SHELL.MINT_TEXT,
          fontWeight: 800,
          marginBottom: 6,
        }}
      >
        {isPendingSetup ? 'Waiting on Setup approval' : 'Approved for Phase 0'}
      </div>
      <div style={{ fontSize: 13 }}>
        {isPendingSetup
          ? 'The program seed has been captured, but Phase 0 is locked until a tenant admin approves it in Setup. Nexus should preserve the draft and avoid pretending the program is active.'
          : 'This program can now begin P0 Origination. Nexus should complete the P0 entry and exit criteria, generate/save the seed deliverables, and submit the P0 exit approval before Discovery unlocks.'}
      </div>
      {isPendingSetup && (
        <Link
          href="/admin/programs/approvals"
          style={{
            display: 'inline-block',
            marginTop: 8,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: SHELL.INK,
            textDecoration: 'none',
            borderBottom: `1px dashed ${SHELL.INK}`,
          }}
        >
          Review in Setup approvals →
        </Link>
      )}
    </div>
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

// Types for the gate approval inline workflow.
type ApprovalAction = 'approve' | 'reject';
interface ApprovalRecord {
  action: ApprovalAction;
  justification: string;
}

function GateCriteriaList({
  criteria,
  instanceId,
}: {
  criteria: NonNullable<ProgramDetailView['phasePanel']['gateCriteria']>;
  instanceId: string;
}) {
  // Local waiver state — demo only, no persistence.
  // Key: criterion index (stable within a single view render).
  const [waivedIndices, setWaivedIndices] = useState<Set<number>>(new Set());
  const [inFlightIndices, setInFlightIndices] = useState<Set<number>>(new Set());

  // Approval workflow state. expandedApproval: index of row with open justification input.
  const [approvedMap, setApprovedMap] = useState<Map<number, ApprovalRecord>>(new Map());
  const [expandedApproval, setExpandedApproval] = useState<number | null>(null);
  const [justificationText, setJustificationText] = useState('');
  const [approvalInFlight, setApprovalInFlight] = useState(false);

  async function handleWaive(index: number, criterion: string) {
    setInFlightIndices((prev) => new Set(prev).add(index));
    try {
      await fetch('/api/reasoning/gate-waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'gate_waiver',
          criterionId: `${instanceId}::${index}`,
          instanceId,
          reason: 'demo',
          criterion,
        }),
      });
    } finally {
      setInFlightIndices((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      // Optimistic update regardless of server response — demo state only.
      setWaivedIndices((prev) => new Set(prev).add(index));
    }
  }

  function handleResetWaivers() {
    setWaivedIndices(new Set());
  }

  function openApprovalInput(index: number) {
    setExpandedApproval(index);
    setJustificationText('');
  }

  function cancelApproval() {
    setExpandedApproval(null);
    setJustificationText('');
  }

  async function confirmApproval(index: number, action: ApprovalAction) {
    if (justificationText.trim().length === 0) return;
    setApprovalInFlight(true);
    try {
      await fetch('/api/reasoning/gate-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          criterionId: `${instanceId}::${index}`,
          justification: justificationText.trim(),
          action,
        }),
      });
    } finally {
      setApprovalInFlight(false);
      // Optimistic update regardless of server response — demo state only.
      setApprovedMap((prev) => {
        const next = new Map(prev);
        next.set(index, { action, justification: justificationText.trim() });
        return next;
      });
      setExpandedApproval(null);
      setJustificationText('');
    }
  }

  const hasWaivers = waivedIndices.size > 0;

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
        {criteria.map((g, i) => {
          const isWaived = waivedIndices.has(i);
          const isInFlight = inFlightIndices.has(i);
          const isUnmet = !g.met;
          const canWaive = isUnmet && !isWaived;
          const approvalRecord = approvedMap.get(i);
          const isApproved = approvalRecord?.action === 'approve';
          const isRejected = approvalRecord?.action === 'reject';
          const isExpanded = expandedApproval === i;
          // Pending approval action for this row.
          const pendingAction: ApprovalAction = g.met ? 'approve' : 'reject';

          // Resolve row colours.
          // approved-met → mint, approved-rejected → rust, waived → gray, unmet → peach.
          const rowBg = isApproved
            ? SHELL.MINT_BG
            : isRejected
            ? SHELL.RUST_BG
            : g.met
            ? SHELL.MINT_BG
            : isWaived
            ? SHELL.GRAY_BG
            : SHELL.PEACH_BG;
          const rowBorder = isApproved
            ? SHELL.MINT_LINE
            : isRejected
            ? '#d4a898'
            : g.met
            ? SHELL.MINT_LINE
            : isWaived
            ? SHELL.GRAY_LINE
            : SHELL.PEACH_LINE;

          return (
            <div key={`gc-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 12px',
                  borderRadius: isExpanded ? '7px 7px 0 0' : 7,
                  background: rowBg,
                  border: `1px solid ${rowBorder}`,
                  borderBottom: isExpanded ? 'none' : undefined,
                }}
              >
                {/* Circle icon */}
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isApproved
                      ? SHELL.MINT_TEXT
                      : isRejected
                      ? SHELL.RUST_TEXT
                      : g.met
                      ? SHELL.MINT_TEXT
                      : isWaived
                      ? SHELL.GRAY_TEXT
                      : 'transparent',
                    border:
                      isApproved || isRejected || g.met || isWaived
                        ? 'none'
                        : `1.5px solid ${SHELL.INK}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(isApproved || g.met || isWaived) && (
                    <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>
                  )}
                  {isRejected && (
                    <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✗</span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    color: isApproved
                      ? SHELL.MINT_TEXT
                      : isRejected
                      ? SHELL.RUST_TEXT
                      : g.met
                      ? SHELL.MINT_TEXT
                      : isWaived
                      ? SHELL.GRAY_TEXT
                      : SHELL.INK,
                    lineHeight: 1.4,
                    textDecoration: isWaived ? 'line-through' : undefined,
                  }}
                >
                  {g.criterion}
                </span>
                {/* Right-side: approval chip / approval button / waive button / status label */}
                <div
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {/* Settled approval chip */}
                  {isApproved && (
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: SHELL.MINT_TEXT,
                        background: SHELL.MINT_LINE,
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      Approved · demo-user
                    </span>
                  )}
                  {isRejected && (
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: SHELL.RUST_TEXT,
                        background: '#e8c4b4',
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      Rejected · demo-user
                    </span>
                  )}
                  {/* Waived chip (unmet rows that have been waived) */}
                  {isWaived && !isApproved && !isRejected && (
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: SHELL.GRAY_TEXT,
                        background: SHELL.GRAY_LINE,
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      Waived
                    </span>
                  )}
                  {/* Approval/rejection button — shown when not yet settled and not expanded */}
                  {!isApproved && !isRejected && !isExpanded && (
                    <button
                      onClick={() => openApprovalInput(i)}
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: g.met ? SHELL.MINT_TEXT : SHELL.RUST_TEXT,
                        background: 'none',
                        border: `1px solid ${g.met ? SHELL.MINT_LINE : '#d4a898'}`,
                        borderRadius: 4,
                        padding: '2px 8px',
                        cursor: 'pointer',
                        lineHeight: 1.6,
                      }}
                    >
                      {g.met ? '✓ Approve' : '✗ Reject'}
                    </button>
                  )}
                  {/* Waive button — only for unmet, un-waived, unsettled rows */}
                  {canWaive && !isApproved && !isRejected && !isExpanded && (
                    <button
                      disabled={isInFlight}
                      onClick={() => handleWaive(i, g.criterion)}
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: isInFlight ? SHELL.INK_MUTED : SHELL.PEACH_TEXT,
                        background: 'none',
                        border: `1px solid ${isInFlight ? SHELL.GRAY_LINE : SHELL.PEACH_LINE}`,
                        borderRadius: 4,
                        padding: '2px 8px',
                        cursor: isInFlight ? 'not-allowed' : 'pointer',
                        lineHeight: 1.6,
                      }}
                    >
                      {isInFlight ? '…' : 'Waive'}
                    </button>
                  )}
                  {/* Plain status label for met rows that have neither been actioned nor expanded */}
                  {g.met && !isApproved && !isExpanded && (
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: SHELL.MINT_TEXT,
                      }}
                    >
                      Met
                    </span>
                  )}
                  {/* Plain status label for unmet rows that are not waived, not settled, not expanded */}
                  {isUnmet && !isWaived && !isRejected && !isExpanded && (
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: SHELL.PEACH_TEXT,
                      }}
                    >
                      Open
                    </span>
                  )}
                </div>
              </div>
              {/* Inline justification input — shown when this row's approval button was clicked */}
              {isExpanded && (
                <div
                  style={{
                    padding: '8px 12px 10px',
                    background: rowBg,
                    border: `1px solid ${rowBorder}`,
                    borderTop: `1px solid ${rowBorder}`,
                    borderRadius: '0 0 7px 7px',
                  }}
                >
                  <textarea
                    autoFocus
                    maxLength={200}
                    rows={2}
                    placeholder="Justification (required, max 200 chars)"
                    value={justificationText}
                    onChange={(e) => setJustificationText(e.target.value)}
                    style={{
                      width: '100%',
                      fontFamily: SHELL.SANS,
                      fontSize: 11,
                      color: SHELL.INK,
                      background: SHELL.CARD_WHITE,
                      border: `1px solid ${SHELL.CARD_LINE}`,
                      borderRadius: 4,
                      padding: '5px 8px',
                      resize: 'none',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    <button
                      onClick={cancelApproval}
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: SHELL.INK_MUTED,
                        background: 'none',
                        border: `1px solid ${SHELL.GRAY_LINE}`,
                        borderRadius: 4,
                        padding: '2px 8px',
                        cursor: 'pointer',
                        lineHeight: 1.6,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={approvalInFlight || justificationText.trim().length === 0}
                      onClick={() => confirmApproval(i, pendingAction)}
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color:
                          approvalInFlight || justificationText.trim().length === 0
                            ? SHELL.INK_MUTED
                            : pendingAction === 'approve'
                            ? SHELL.MINT_TEXT
                            : SHELL.RUST_TEXT,
                        background: 'none',
                        border: `1px solid ${
                          approvalInFlight || justificationText.trim().length === 0
                            ? SHELL.GRAY_LINE
                            : pendingAction === 'approve'
                            ? SHELL.MINT_LINE
                            : '#d4a898'
                        }`,
                        borderRadius: 4,
                        padding: '2px 8px',
                        cursor:
                          approvalInFlight || justificationText.trim().length === 0
                            ? 'not-allowed'
                            : 'pointer',
                        lineHeight: 1.6,
                      }}
                    >
                      {approvalInFlight ? '…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Reset waivers link — only shown when at least one criterion is waived */}
      {hasWaivers && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <button
            onClick={handleResetWaivers}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.08em',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Reset waivers
          </button>
        </div>
      )}
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
        {items.map((item) => {
          // Score this evidence item for the quality chip. Map program-side
          // fields onto the scorer's EvidenceLikeItem shape.
          const itemScore = scoreEvidenceItem({
            text: item.excerpt,
            citation: item.citation,
            uploadedBy: item.source,
            uploadedAt: item.uploadedAt ?? undefined,
          });
          const itemQualitySummary = {
            mean: itemScore.score,
            weakCount: itemScore.grade === 'weak' ? 1 : 0,
            fairCount: itemScore.grade === 'fair' ? 1 : 0,
            strongCount: itemScore.grade === 'strong' ? 1 : 0,
            total: 1,
          };
          return (
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
              {/* Evidence quality chip */}
              <EvidenceQualityChip
                summary={itemQualitySummary}
                grade={itemScore.grade}
                reasons={itemScore.reasons}
              />
              {/* Staleness chip — shown when evidence is older than 90 days */}
              <StaleEvidenceChip date={item.uploadedAt ?? null} />
              {/* Tag chips — shown when tags are present */}
              {item.tags && item.tags.length > 0 && (
                <EvidenceTagChips tags={item.tags} />
              )}
              {/* Failure mode warning chip — shown when a contradiction is
                  recorded against this evidence item */}
              {item.hasContradiction && (
                <FailureModeWarningChip
                  topLabel="contradiction detected"
                  topConfidence={0.8}
                  highCount={1}
                />
              )}
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
          );
        })}
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

export function ProgramDetailPage({
  view,
  timelineFilters,
  preservedSearchParams,
  phase0Primer,
  hasTenantKey = false,
}: ProgramDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const gateSectionRef = useRef<HTMLDivElement>(null);
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateApproveError, setGateApproveError] = useState<string | null>(null);
  const [isApprovingGate, setIsApprovingGate] = useState(false);
  // REASON-32 — opt-in deeper LLM-streamed per-stage synthesis. `null` = closed.
  const [openStageId, setOpenStageId] = useState<string | null>(null);
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

  // Surface 2 PR2 — reactive Nexus artifacts dispatched by AtlasDrawer.
  // The NexusReactivePanel renders these as live cards above the
  // existing static phase/gate/evidence regions. Subsequent PRs
  // progressively replace the static regions with reactive equivalents
  // driven by the same channel.
  const [nexusArtifacts, setNexusArtifacts] = useState<NexusArtifact[]>([]);
  const handleNexusArtifact = useCallback(
    (artifact: NexusArtifact) => {
      setNexusArtifacts((prev) => {
        const key = JSON.stringify(artifact);
        if (prev.some((a) => JSON.stringify(a) === key)) return prev;
        return [...prev, artifact];
      });

      // PR-L · in-place phase advance. When advance_phase succeeds it
      // emits this artifact via ctx.writer; we refresh server data
      // without unmounting the React tree, so the chat thread and
      // reactive panel survive the P3 → P4 transition.
      if (artifact.type === 'program-phase-changed') {
        router.refresh();
      }
    },
    [router],
  );

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

  // Compare-with-deeplink — resolve the canonical instance id for the
  // current program (matches the same lookup used by the failure-mode chip
  // and provenance ribbon) so the dropdown in the header can deep-link to
  // `/source/compare?a={current}&b={selected}`.
  const compareInstanceId = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    return instance?.id ?? null;
  })();

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

  // Header-level instance-health badge — single-glance verdict aggregating
  // pending hard gates, blocked criteria, high-severity contradictions /
  // failure modes / cascade impacts into green/amber/red.
  const headerHealth = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    const ctx = buildProgramSynthesisContext(instance);
    return computeInstanceHealth(ctx);
  })();

  // Evidence-quality aggregate — `ProgramEvidenceItem` already carries
  // `citation/uploadedAt/uploadedBy`, so the scorer's expected shape lines
  // up directly. The chip is a visibility hint for "evidence is weak"
  // alongside the gate pill.
  const evidenceQualityHeader = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance || instance.evidence.length === 0) return null;
    const summary = summarizeEvidenceQuality(
      instance.evidence.map((ev) => ({
        citation: ev.citation,
        uploadedAt: ev.uploadedAt,
        uploadedBy: ev.uploadedBy,
      })),
    );
    return { summary, grade: summaryGrade(summary) };
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

  // Risk register: joins active contradictions + failure modes for this
  // program into a single prioritised list. Sits below the contradiction
  // detail card so users see a unified risk view alongside per-detector cards.
  const riskRegisterInfo = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    const ctx = buildProgramSynthesisContext(instance);
    return {
      risks: buildRiskRegisterForInstance(ctx, instance.displayId),
    };
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
      canonicalInstanceId: instance.id,
      impacts: ctx.cascadeContext,
      upstream: computeReverseCascade(instance),
    };
  })();

  // REASON-30 — Lifecycle mini-graph data: resolve the program's lifecycle
  // pattern, count gate criteria per stage (keyed by stage id), and translate
  // PhaseStrip slot states into StageStatus keyed by stage label.
  const lifecycleMiniGraph = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    const pattern = findLifecyclePattern(instance.patternId);
    if (!pattern || pattern.stages.length === 0) return null;

    const counts: Record<string, number> = {};
    for (const c of pattern.gateCriteria) {
      counts[c.stageId] = (counts[c.stageId] ?? 0) + 1;
    }

    const states: Record<string, StageStatus> = {};
    const sortedStages = [...pattern.stages].sort((a, b) => a.order - b.order);
    for (const stage of sortedStages) {
      // Match phase-strip slots by their position in the lifecycle pattern.
      // Pattern stages declare an `order` (0-indexed for programs, 1-indexed
      // for sourcing); the program PhaseStrip uses 0-indexed phase ids so we
      // align by ordinal position rather than raw `order` value.
      const idx = sortedStages.findIndex((s) => s.id === stage.id);
      const slot = stripPhases[idx];
      if (!slot) {
        states[stage.label] = 'upcoming';
        continue;
      }
      switch (slot.state) {
        case 'done':
          states[stage.label] = 'passed';
          break;
        case 'current':
          states[stage.label] = view.gateStatus === 'pending'
            ? 'blocked'
            : 'current';
          break;
        case 'pending':
          states[stage.label] = 'upcoming';
          break;
        case 'locked':
        default:
          states[stage.label] = 'upcoming';
          break;
      }
    }

    // Per-stage micro-synthesis — pure rule-based 1-2 sentence advisory text
    // surfaced as an SVG <title> tooltip on each lifecycle node. No LLM call.
    const evidenceMap = buildProgramEvidenceMap(instance);
    const evaluator = createGateEvaluator(pattern);
    // Programs use stage ids of the form `P{N}-{Label}`. Pick the stage whose
    // ordinal position matches `currentPhase` so `evaluateAllStages` can
    // distinguish passed/current/blocked/upcoming buckets.
    const orderedStages = [...pattern.stages].sort((a, b) => a.order - b.order);
    const currentStageId = orderedStages[instance.currentPhase]?.id
      ?? orderedStages[0]?.id
      ?? '';
    const evaluations = evaluator.evaluateAllStages(currentStageId, evidenceMap);
    const microSynthesis = buildStageMicroSynthesisMap(evaluations, pattern);

    // REASON-31 — Stage handoff narratives describing the evidence handoff
    // between each consecutive pair of stages.
    const handoffNarratives = buildStageHandoffNarratives(pattern);

    return {
      instanceId: instance.id,
      stages: pattern.stages,
      counts,
      states,
      microSynthesis,
      handoffNarratives,
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

  // REASON-35 — Evidence coverage heatmap: resolve instance + lifecycle
  // pattern for the viewing program so the heatmap can match evidence to
  // gate criteria across all stages.
  const heatmapInfo = (() => {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
      (i) =>
        i.displayId === view.displayId ||
        i.id.toLowerCase() === view.programId.toLowerCase(),
    );
    if (!instance) return null;
    const pattern = findLifecyclePattern(instance.patternId);
    if (!pattern || pattern.stages.length === 0) return null;
    return { instance, pattern };
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
        tenantName: view.tenant,
        showLocked: true,
        context: `${view.displayId} · P${view.viewingPhase} ${phaseLabel}`,
      }}
      hasTenantKey={hasTenantKey}
      middleStrip={
        <PhaseStrip phases={stripPhases} onPhaseSelect={handlePhaseSelect} />
      }
      // PR-L · the shared AtlasPageState chat path goes through
      // AppShell → AtlasPageStateProvider, so onArtifact has to flow
      // through here too. Without this, only AgentCanvas's local
      // stream dispatched artifacts and program-phase-changed
      // signals from advance_phase landed nowhere.
      onArtifact={handleNexusArtifact}
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
        <div style={{ marginTop: 4 }}>
          <DownloadContextButton instanceId={view.programId} surface="program" />
        </div>

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
            {headerHealth && <InstanceHealthBadge health={headerHealth} />}
            {failureModeHeaderInfo && (
              <FailureModeWarningChip
                topLabel={failureModeHeaderInfo.topLabel}
                topConfidence={failureModeHeaderInfo.topConfidence}
                highCount={failureModeHeaderInfo.highCount}
                mitigations={failureModeHeaderInfo.mitigations}
              />
            )}
            {evidenceQualityHeader && (
              <EvidenceQualityChip
                summary={evidenceQualityHeader.summary}
                grade={evidenceQualityHeader.grade}
              />
            )}
            {compareInstanceId && (
              <CompareWithDropdown
                currentInstanceId={compareInstanceId}
                allOtherIds={getAllInstanceIds()}
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
            {/* Phase advance demo affordance */}
            <PhaseAdvanceButton
              programId={view.programId}
              currentPhase={view.currentPhase}
              disabledReason={
                view.lifecycleState === 'submitted_for_approval'
                  ? 'Setup approval is required before Phase 0 can start.'
                  : null
              }
            />
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
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.06em',
            }}
          >
            <span data-honest-disclaimer="programs-detail">
              {view.displayId} · Deterministic seed
            </span>
            <a
              href={`/programs/${view.programId}/report`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                textDecoration: 'none',
                borderBottom: `1px dashed ${SHELL.INK_MUTED}`,
                paddingBottom: 1,
              }}
            >
              Full report →
            </a>
          </div>
          <LifecycleStateBanner view={view} />
        </div>

        {/* REASON-30 — Inline lifecycle mini-graph (sits below the PhaseStrip
            in the AppShell middleStrip; complements but does not replace it) */}
        {lifecycleMiniGraph && (
          <div
            data-testid="program-lifecycle-mini-graph"
            style={{
              padding: '4px 0 12px',
              marginBottom: 4,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            <LifecycleMiniGraph
              stages={lifecycleMiniGraph.stages}
              stageStates={lifecycleMiniGraph.states}
              gateCriteriaCount={lifecycleMiniGraph.counts}
              microSynthesis={lifecycleMiniGraph.microSynthesis}
              onStageClick={setOpenStageId}
            />
          </div>
        )}

        {/* REASON-31 — Stage handoff narrative panel: describes the
            evidence/gate handoff between consecutive phases. Sits directly
            below the lifecycle mini-graph. */}
        {lifecycleMiniGraph && (
          <div
            data-testid="program-handoff-narrative"
            style={{
              padding: '4px 0 12px',
              marginBottom: 4,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            <HandoffNarrativePanel narratives={lifecycleMiniGraph.handoffNarratives} />
          </div>
        )}

        {/* REASON-32 — ProgramJourneyRail with "View synthesis →" per phase.
            Complements the LifecycleMiniGraph by surfacing the phase-level
            navigator with per-chip synthesis triggers. Only rendered when the
            lifecycle pattern resolves to a full phase set. */}
        {lifecycleMiniGraph && view.phases.length > 0 && (() => {
          // Build sorted stage list to map phase ordinal (1-6) → pattern stageId
          const sortedPatternStages = [...lifecycleMiniGraph.stages].sort(
            (a, b) => a.order - b.order,
          );
          const handleSynthesisClick = (phaseId: 1 | 2 | 3 | 4 | 5 | 6) => {
            // phase ids are 1-indexed; sortedPatternStages is 0-indexed
            const stageId = sortedPatternStages[phaseId - 1]?.id;
            if (stageId) setOpenStageId(stageId);
          };
          const railPhases: ProgramPhaseSlot[] = view.phases.map((s) => ({
            id: s.id as ProgramPhaseSlot['id'],
            label: s.label,
            state: s.state,
          }));
          return (
            <div
              data-testid="program-journey-rail"
              style={{
                padding: '4px 0 12px',
                marginBottom: 4,
                borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              }}
            >
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: SHELL.INK_MUTED,
                  marginBottom: 8,
                }}
              >
                Phase navigator
              </div>
              <ProgramJourneyRail
                phases={railPhases}
                viewingPhase={view.viewingPhase as ProgramPhaseSlot['id']}
                onPhaseSelect={handlePhaseSelect as (id: ProgramPhaseSlot['id']) => void}
                onSynthesisClick={handleSynthesisClick}
              />
            </div>
          );
        })()}

        {/* OV2-3b · Phase-0 archetype primer. Renders ABOVE the agent
            canvas when (a) the program is in P0 and (b) a primer is
            registered for the program's resolved patternId. Per design
            doc Section D.0.6 the primer is the platform's voice at the
            moment of approval — it should be visible by default, not
            hidden behind a tab. Silent fallback when no primer matches. */}
        {view.currentPhase === 0 && phase0Primer ? (
          <Phase0Primer
            primer={phase0Primer}
            // OV2-3c · downloadable HTML brief endpoint. Wires the prop
            // OV2-3b shipped behind, now that the renderer + API route
            // are live.
            downloadHref={`/api/programs/${encodeURIComponent(view.programId)}/primer-html`}
          />
        ) : null}

        {/* Surface 2 PR-F — agent-centric primary canvas. Chat with
            Nexus + reactive panel occupy the dominant viewport real
            estate. The static legacy content (storyline, missions,
            sub-nav, sections) collapses below in a details accordion. */}
        <AgentCanvas
          surface={`/programs/${view.programId}`}
          programId={view.programId}
          agent={{ initials: 'Nx', name: 'Nexus', role: 'Program Orchestrator' }}
          quote={view.workbench.prose}
          artifacts={nexusArtifacts}
          onArtifact={handleNexusArtifact}
        />

        <details
          data-testid="program-details-legacy"
          style={{
            marginBottom: 20,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            background: SHELL.PAPER,
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              padding: '12px 16px',
              fontFamily: SHELL.MONO,
              fontSize: 11,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: SHELL.GRAY_TEXT,
              fontWeight: 700,
              userSelect: 'none',
            }}
          >
            Program details · gate · evidence · deliverables · workshop
          </summary>
          <div style={{ padding: '8px 16px 16px' }}>

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
          // Use the first mission's `instanceId` to anchor the
          // "Recently completed" subsection — every mission for this
          // program shares the same resolved instance id, so the first
          // entry is a stable lookup key. Fall back to view.programId
          // when there are no active missions (recent list will simply
          // render nothing if no entries match).
          const recentInstanceId = missions[0]?.instanceId ?? view.programId;
          return (
            <div style={{ marginBottom: 20, display: 'grid', gap: 8 }}>
              {/* Legacy static mission queue — kept inside the
                  collapsed details so users who want the old view can
                  still get to it. The reactive equivalent runs in the
                  AgentCanvas reactive panel above. */}
              <MissionListInteractive
                missions={missions}
                title="Pending gates · this program"
                maxRows={6}
              />
              <RecentMissionStates instanceId={recentInstanceId} limit={3} />
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
                <GateCriteriaList criteria={view.phasePanel.gateCriteria} instanceId={view.programId} />
              </div>
            )}
            {!view.phasePanel.gateCriteria && (
              <div style={{ padding: '20px 0', fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED }}>
                Gate criteria not defined for P{view.viewingPhase}.
              </div>
            )}
            {/* REASON-38 — Gate history sidebar: session audit trail of waivers/approvals/rejections */}
            <GateHistorySidebar instanceId={view.programId} />
            {/* REASON-35 — Evidence coverage heatmap: visual grid of which gate
                criteria have supporting evidence across all lifecycle stages. */}
            {heatmapInfo && (
              <ReasoningErrorBoundary section="Coverage Heatmap">
                <EvidenceCoverageHeatmap
                  instance={heatmapInfo.instance}
                  pattern={heatmapInfo.pattern}
                />
              </ReasoningErrorBoundary>
            )}
            {/* REASON-30 — Contradiction detail card sits below gate criteria */}
            {contradictionInfo && contradictionInfo.contradictions.length > 0 && (
              <ContradictionDetailCardClient
                contradictions={contradictionInfo.contradictions}
                instanceId={contradictionInfo.instanceId}
              />
            )}
            {/* Risk register — unified view of contradictions + failure modes. */}
            {riskRegisterInfo && riskRegisterInfo.risks.length > 0 && (
              <ReasoningErrorBoundary section="Risk Register">
                <RiskRegisterPanel
                  risks={riskRegisterInfo.risks}
                  title="Risk register · this program"
                />
              </ReasoningErrorBoundary>
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
                {/* Cross-instance linked tiles — compact summary of every
                    instance this one cascades to or from, deduped across
                    both directions. */}
                <LinkedInstanceTilesGrid
                  currentInstanceId={cascadeInfo.canonicalInstanceId}
                />
              </>
            )}
            {/* REASON-32 — Per-instance reasoning event timeline + filter bar.
                Filters are URL-driven (`?tlKind=…&tlSince=…&tlSearch=…`) so
                the filter survives a hard reload and works without JS. */}
            {timelineEntries && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InstanceEventTimelineFilterBar
                  filters={timelineFilters ?? {}}
                  preserveParams={preservedSearchParams}
                />
                <InstanceEventTimeline
                  entries={timelineEntries.entries}
                  filters={timelineFilters}
                />
              </div>
            )}
            {/* PRG-EVIDENCE-INGEST — demo form to POST evidence and watch
                gates flip on next render via buildProgramEvidenceMapWithIngestions. */}
            {evidenceIngestionInfo && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <BulkEvidenceImportButton instanceId={evidenceIngestionInfo.instanceId} />
                </div>
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
            {/* REASON-34 — Cascade impact graph for this program instance */}
            <ReasoningErrorBoundary section="Cascade Impact">
              <CascadeImpactSection
                instanceId={evidenceIngestionInfo?.instanceId ?? view.programId}
              />
            </ReasoningErrorBoundary>
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
                {/* REASON-36 — Evidence network graph: SVG bipartite graph
                    linking evidence items to the gate criteria they support. */}
                {heatmapInfo && (
                  <ReasoningErrorBoundary section="Evidence Network">
                    <EvidenceNetworkGraph
                      instance={heatmapInfo.instance}
                      pattern={heatmapInfo.pattern}
                    />
                  </ReasoningErrorBoundary>
                )}
                {/* REASON-37 — Evidence suggestions panel: context-sensitive
                    hints for what documents to upload to satisfy each unmet
                    gate criterion. Only shown when heatmapInfo is available
                    (i.e., the instance has a recognised lifecycle pattern). */}
                {heatmapInfo && (
                  <EvidenceSuggestionsPanel
                    suggestions={buildEvidenceSuggestions(
                      heatmapInfo.instance,
                      heatmapInfo.pattern,
                    )}
                  />
                )}
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

          {/* close: details > div (legacy collapsible content from
              Surface 2 PR-F agent-centric reshape) */}
          </div>
        </details>

        </div>
      </WorkingPaneContainer>
      </div>

      {/* Surface 2 PR-F — agent-centric layout reshape.
          Chat now lives EMBEDDED in <AgentCanvas> at the top of the
          page, not as a fixed-position overlay drawer. The drawer-mode
          AtlasDrawer that used to render here has been removed; the
          drawerOpen state survives only because RibbonSynthesis still
          references it (the toggle is a no-op on this surface). */}

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

      {/* REASON-32 — Per-stage LLM-streamed deeper synthesis drawer */}
      {openStageId && lifecycleMiniGraph && (
        <StageSynthesisDrawer
          open
          instanceId={lifecycleMiniGraph.instanceId}
          stageId={openStageId}
          stageLabel={
            lifecycleMiniGraph.stages.find((s) => s.id === openStageId)?.label
            ?? openStageId
          }
          onClose={() => setOpenStageId(null)}
        />
      )}
    </AppShell>
  );
}
