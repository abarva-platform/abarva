"use client";

import { GateReadinessStep } from "@/components/strategic-moves/step-page/GateReadinessStep";
import { rootCauseCaptureText } from "@/lib/programs/root-cause-register";
import { RootCausesStep } from "@/components/strategic-moves/step-page/RootCausesStep";
import { StepPageTabs } from "@/components/strategic-moves/step-page/MovesStepPage";
import { resolvePhaseWorkflow } from "@/lib/programs/phase-workflow-registry";
import { describeGateSignOffReadback } from "@/lib/programs/gate-sign-off-readback";
import { resolvePhaseBuildBlock } from "@/lib/programs/phase-build-action-state";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  reconcileDraftWithAcknowledged,
  resolvePhaseCaptureStatus,
  type PhaseCaptureSaveStatus,
  type PhaseCaptureStatusView,
} from "@/lib/programs/phase-capture-status";
import { resolvePhaseCaptureHold } from "@/lib/programs/phase-capture-hold";
import { gateCriteriaVerification } from "@/lib/programs/gate-criteria-verification";
import { CaptureEvidenceHoldNotice } from "@/components/strategic-moves/CaptureEvidenceHoldNotice";
import {
  CaptureGateMetNotice,
  isGateMetWithCaptureUnfinished,
} from "@/components/strategic-moves/CaptureGateMetNotice";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import {
  extractArtifacts,
  type Artifact,
  type CaptureFieldArtifact,
} from "@/lib/agent/artifacts";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type { DeliverableContentSignal } from "@/lib/deliverables/deliverable-content-signals";
import { CurrentStateReadinessPanel } from "@/components/strategic-moves/CurrentStateReadinessPanel";
import { describeMoveUploadRefusal } from "@/lib/programs/move-upload-refusal";
import {
  artifactStatusLabel,
  FileCabinetPanel,
} from "@/components/strategic-moves/FileCabinetPanel";
import {
  PhaseApproveAndBuild,
  type BuildSettledResult,
  type PhaseBuildArtifact,
} from "@/components/strategic-moves/PhaseApproveAndBuild";
import { classifyPhaseBuildSettlement } from "@/lib/programs/phase-build-settlement";
import { GateApprovalConfirmDialog } from "@/components/strategic-moves/GateApprovalConfirmDialog";
import { charterGateAssumptionDisclosure } from "@/lib/programs/charter-gate-assumption-disclosure";
import { PhaseIntelligencePanel } from "@/components/strategic-moves/PhaseIntelligencePanel";
import { CostEffortWizard } from "@/components/strategic-moves/cost-effort";
import { EstimateModelEditor } from "@/components/strategic-moves/EstimateModelEditor";
import { DiagnosisFactsEditor } from "@/components/strategic-moves/DiagnosisFactsEditor";
import { SolutionOptionChooser } from "@/components/strategic-moves/SolutionOptionChooser";
import {
  MovesCaptureFlow,
  type MovesCaptureFlowPhase,
  type MovesCaptureFlowProps,
} from "@/components/strategic-moves/MovesCaptureFlow";
import { captureSectionSpan } from "@/lib/programs/moves-capture-section-width";
import { CharterAssumptionsCarryForward } from "@/components/strategic-moves/CharterAssumptionsCarryForward";
import { CharterStandingAfterDiscover } from "@/components/strategic-moves/CharterStandingAfterDiscover";
import type { CarriedCharterAssumption } from "@/lib/programs/charter-assumptions-carry-forward";
import type { PostDiscoverCharterAnswer } from "@/lib/programs/charter-standing-after-discover";
import { MovesCaptureWorkspace } from "@/components/strategic-moves/MovesCaptureWorkspace";
import type { SuggestedAction } from "@/components/agent/AgentDock";
import {
  MovesPhaseFindings,
  FindingsReviewGateSummary,
} from "@/components/strategic-moves/MovesPhaseFindings";
import {
  buildPhaseFindings,
  isFindingsPhase,
  summarizePhaseFindingsReview,
  type FindingReviewState,
} from "@/lib/programs/moves-phase-findings";
import { buildPhaseCharts } from "@/lib/programs/moves-phase-charts";
import {
  CharterAssumptionBadge,
  CharterBasisField,
  CharterBasisMark,
  CharterBasisRollup,
  CharterGateAssumptionNotice,
  isCharterAssumption,
  summarizeCharterBasis,
  type CharterBasisValue,
} from "@/components/strategic-moves/CharterBasisField";
import {
  charterBasisRollupSections,
  charterBasisSectionKeys as resolveCharterBasisSectionKeys,
  charterBasisSurfaceActive,
  charterBasisSurfaceForSection,
} from "@/lib/programs/charter-basis-host-join";
import { CaptureNotesFill } from "@/components/strategic-moves/CaptureNotesFill";
import {
  basisForNotesInsert,
  notesInsertBasisRecordingKeys,
} from "@/lib/programs/capture-notes-basis-link";
import { charterBasisEditNotice } from "@/lib/programs/charter-basis-edit-notice";
import { capturePhaseProgress } from "@/lib/programs/capture-phase-progress";
import {
  isWorkbookProposalAcceptable,
  isWorkbookProposalOpenForReview,
  isWorkbookProposalReviewable,
  selectableWorkbookProposalIds,
} from "@/lib/programs/stage-readiness-workbooks/review-selection";
import {
  isRestoredDisposition,
  keptDecisionsToRecord,
} from "@/lib/programs/stage-readiness-workbooks/review-provenance";
import { shouldOfferStageReadinessWorkbook } from "@/lib/programs/stage-readiness-workbook-offer";
import {
  approvalsRowStatusBasis,
  approvalsRowStatusClass,
  approvalsRowStatusText,
  formatApproverCell,
  formatGateCriteriaCell,
  formatGateCriteriaTitle,
} from "@/lib/programs/approvals-overview-labels";
import { phaseStepperStateLabel } from "@/lib/programs/phase-stepper-state-label";
import type { PhaseApprovalStanding } from "@/lib/programs/phase-approval-standing";
import {
  phaseApprovalCompletionHeadline,
  phaseApprovalDecisionText,
  phaseApprovalDecisionTitle,
  phaseApprovalGateNote,
  phaseApprovalHeaderBasis,
  phaseApprovalHeaderLabel,
  resolvePhaseApprovalStanding,
} from "@/lib/programs/phase-approval-standing";
import { RiskAssessmentPanel } from "@/components/strategic-moves/risk-assessment";
import { SolutioningPanel } from "@/components/strategic-moves/solutioning";
import { capturePhaseSectionTotal } from "@/lib/programs/capture-phase-section-totals";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { describeRequiredEvidenceRefusal } from "@/lib/programs/evidence-readiness/required-evidence-refusal";
import { declarableEvidenceUploadFamilies } from "@/lib/programs/evidence-readiness/upload-family-declaration";
import { gateRefusalAllowsResubmission } from "@/lib/programs/gate-refusal-resubmission";
import { readUnexpectedWalkStepFailure } from "@/lib/programs/walk-step-unexpected-failure";
import {
  declarableCurrentStateFamilies,
  resolveCurrentStateUploadFamilies,
} from "@/lib/programs/evidence-readiness/current-state-upload-routing";
import {
  currentPhaseRequiredEvidenceGaps,
  phaseProgressReadiness,
} from "@/lib/programs/phase-progress-readiness";
import {
  isP0ApprovalGeneratedCriterion,
  partitionOpenHardGateCriteria,
} from "@/lib/programs/p0-approval-generated-gate-criteria";
import {
  digestOpenGateCriteria,
  readyWithCaveatsSentence,
} from "@/lib/programs/gate-criterion-digest";
import { resolveGateBlockedCause } from "@/lib/programs/gate-blocked-cause";
import type { PhaseNavigationStatus } from "@/lib/programs/phase-navigation-status";
import type { ApprovedPhaseEvidenceReference } from "@/lib/programs/approved-phase-evidence";
import {
  getPhaseCaptureSections,
  type PhaseCaptureSection,
} from "@/lib/programs/phase-capture-contract";
import {
  isP1CharterBasisValidForSection,
  p1CharterEvidenceFamilyForSection,
} from "@/lib/programs/p1-charter-evidence";
import {
  SOLUTION_OUTPUT_TYPES,
  SOLUTION_ROUTE_LABELS,
  isBusinessChangeAssessmentComplete,
  parseBusinessChangeAssessment,
  parseSolutionRouteValidation,
  recommendSolutionRoute,
  resolveConfirmedSolutionRoute,
  type BusinessChangeAssessment,
  type ConfirmedSolutionRoute,
  type SolutionOutputType,
} from "@/lib/programs/solution-route-assessment";
import {
  solutionRouteConfirmUnavailableReason,
  solutionRouteDecisionChoices,
} from "@/lib/programs/solution-route-decision";
import type { AvaPhaseInputProposal } from "@/lib/programs/phase-input-draft-proposals";
import {
  avaPhaseInputDraftAvailability,
  avaPhaseInputDraftLeadingActions,
} from "./ava-dock-adapter";
import { parseDiagnosisFacts } from "@/lib/programs/diagnosis-facts";
import { evaluateEstimateModel } from "@/lib/programs/estimate-model";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import { summariseCapturedBrief } from "./originate-figure-labels";
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
import {
  assembleP3SolutionOptions,
  buildP3DesignInputsPackFromSignals,
  p2SourceEvidenceTitle,
  type P3OptionSet,
} from "@/lib/programs/phase-templates/p3-option-assembler";
import {
  inferSelectedOptionId,
  restoreApprovedOptionId,
  type UploadedSolutionOptionSet,
} from "@/lib/programs/phase-templates/uploaded-solution-options";
import { buildingBlockLabel } from "@/lib/programs/phase-templates/building-blocks";
import {
  buildNextPhaseReadinessPack,
  type NextPhaseReadinessPack,
} from "@/lib/programs/phase-templates/next-phase-readiness-pack";
import { buildMovesChatAvaAnswerPacket } from "@/lib/programs/moves-chat-answer-packet";
import { demoSafeClientText } from "@/lib/client-config";
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import type { StrategicMove } from "@/lib/programs/types.ui";
import { PHASE_LABELS_SHORT, getPhaseName } from "@/lib/programs/phase-labels";
import { requiredEvidenceCompletionNotice } from "@/lib/programs/evidence-readiness/evidence-waiver-availability";

interface AvaChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  agentAnswer?: AvaAnswerPacket | null;
}

let avaTurnCounter = 0;
function nextAvaTurnId(): string {
  avaTurnCounter += 1;
  return `ava-turn-${avaTurnCounter}`;
}

type SubstepKey =
  | "prepare"
  | "current"
  | "findings"
  | "options"
  | "decide"
  | "canvas"
  | "value"
  | "workstreams"
  | "approve";

interface Substep {
  key: SubstepKey;
  label: string;
}

interface PhaseProgressHeaderState {
  label: string;
  tone: "ready" | "open" | "complete";
  openEvidenceCount: number;
  /**
   * Why the label says what it says, when the label rests on an inference
   * rather than a read decision. Rendered as the status element's `title`.
   */
  basis?: string;
}

interface PhaseContract {
  phase: number;
  code: string;
  navLabel: string;
  title: string;
  question: string;
  lede: string;
  substeps: Substep[];
  sessions: string[];
  templates: Array<{ name: string; type: string }>;
  avaRole: string;
  avaContext: string;
  avaQuestions: string[];
}

interface MovesPhaseStandaloneClientProps {
  /** Server-resolved permission for evidence and phase approval actions. */
  canApproveGates?: boolean;
  /**
   * Authoritative phase-capture values, preloaded server-side. Passed as a prop
   * rather than fetched after mount so the page never renders a synthesized or
   * empty-then-corrected state — the window in which the previous defect
   * displayed boilerplate as if it were the client's own answers.
   */
  initialPhaseCaptureValues?: Record<string, string>;
  /** Synthetic proposals stay separate from client-captured values and never count as complete. */
  initialReferenceDraftValues?: Record<string, string>;
  /** Revision of those values; echoed on save so a stale write is rejected. */
  initialPhaseCaptureRevision?: string;
  initialBusinessChangeAssessment?: string;
  initialApprovedEvidenceReferences?: ApprovedPhaseEvidenceReference[];
  initialApprovedP1CaptureEvidenceReferences?: ApprovedPhaseEvidenceReference[];
  initialConfirmedSolutionRoute?: ConfirmedSolutionRoute | null;
  /** The option set declared in the Move's approved design-phase evidence. */
  uploadedSolutionOptionSet?: UploadedSolutionOptionSet | null;
  /** The design decision already recorded for this Move, if any — restored as
   *  the selected option after a reload. */
  approvedSolutionOption?: {
    selectedOptionId: string;
    chosenOption: string;
  } | null;
  move: StrategicMove;
  phaseNum: number;
  phaseTallies: PhaseTallyRow[];
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
  evidenceReadinessAvailable?: boolean;
  carriesForwardContent: DeliverableContentSignal[];
  p3PriorPhaseContent?: DeliverableContentSignal[];
  phaseBuildArtifacts?: PhaseBuildArtifact[];
  phaseNavigationStatus?: PhaseNavigationStatus;
  initialStageReadinessPreview?: StageReadinessWorkbookParsePreview | null;
  syntheticEvidencePackHref?: string | null;
  currentStateReadiness?: ReadinessReport | null;
  initialSubstepKey?: SubstepKey;
  /** `moves_pricing_engine` feature flag, resolved server-side (tenant-gated, default OFF) — see the phase page. Gates the "Cost & Effort" workspace tab entirely; when false the button does not render at all. */
  pricingEngineEnabled?: boolean;
  /** `moves_risk_tier_scoring_v1` feature flag, resolved server-side (tenant-gated, default OFF) — see the phase page. Gates the "Risk Assessment" workspace tab on P2 AND P3 (starts at P2, finalized at P3); when false the button does not render at all. Same pattern as pricingEngineEnabled. */
  riskAssessmentEnabled?: boolean;
  /** `moves_solution_pattern_gate_v1` feature flag, resolved server-side (tenant-gated, default OFF) — see the phase page. Gates the "Solutioning" workspace tab entirely (P3 only); when false the button does not render at all. Same pattern as pricingEngineEnabled. */
  solutionPatternGateEnabled?: boolean;
  /** `moves_capture_v2` feature flag, resolved server-side (tenant-gated, default OFF). When true, phases 1–5 render the redesigned 3-step capture flow (`MovesCaptureFlow`) in place of the contract-steps canvas. Same canonical sections/keys, saves, and structured inputs; only the capture presentation changes. */
  captureV2Enabled?: boolean;
  /**
   * `moves_step_pages_v3`: render phase steps as the finalized step page
   * template. Today that is P3 Gate readiness, opened with `?step=gate`.
   */
  stepPagesV3Enabled?: boolean;
  /**
   * The step page the URL asked for, when the flag is on: `gate` (P3 Gate
   * readiness) or `root-causes` (P2 Step 3).
   */
  initialStepView?: "gate" | "root-causes" | null;
  /** `moves_capture_p0_v1` feature flag, resolved server-side (tenant-gated, default OFF). When true AND `captureV2Enabled` is true, P0 Originate also renders the redesigned 3-step capture flow instead of the legacy finder-columns canvas. P0's eleven canonical sections/keys, saves, structured inputs, authorization check and required-evidence gate are unchanged; only which phases render the flow differs. */
  captureP0Enabled?: boolean;
  /** `moves_charter_basis_v1` feature flag, resolved server-side (tenant-gated, default OFF). When true, each P1 Charter field carries a "How do you know this?" basis control (approved evidence / an assertion / an owned assumption) and an assumption is badged at the question. When false NOTHING here renders and the legacy approved-evidence lock is unchanged. */
  charterBasisEnabled?: boolean;
  /** `moves_capture_composition_v1` feature flag, already conjoined server-side with `moves_capture_v2` (tenant-gated, default OFF). When true the workspace surface tabs render inside the agent dock's workspace column instead of above it, and the legacy stage head drops the phase title, question, lede and progress card that the capture flow's own phase strip and step bar already state. Blocked-phase notice and readiness-workbook actions are unaffected, and no capture field, save, gate or evidence behaviour changes. */
  captureCompositionEnabled?: boolean;
  /** `moves_workspace_v2` feature flag, already conjoined server-side with `moves_capture_v2` (tenant-gated, default OFF). Increment 1 of the phase-workspace redesign: the capture flow presents ONE slim phase rail (P0–P5 + a non-interactive hand-off marker) and a four-stage sub-step spine (CAPTURE · GENERATE · OUTCOME · GATE) in the v3 locked-light palette; the host drops the stacked legacy gate stepper and the repeated stage head on the phase view (it subsumes the composition polish), de-emphasises the workspace-view row to a secondary control, and moves the readiness-workbook actions off the per-step stage head onto the capture flow's gate step. Presentation and arrangement only — no capture field, structured input, save, gate, evidence, approval or workbook-accept behaviour changes. */
  workspaceV2Enabled?: boolean;
  /** The basis already recorded per P1 Charter section key, preloaded server-side. Seeds the basis control so a reload shows what was declared rather than an empty choice. */
  initialP1CharterBasisBySection?: Record<string, CharterBasisValue>;
  /**
   * `moves_capture_phase_rollup_v1` (flag, default OFF): per-phase SAVED-ANSWER
   * counts for the capture flow's phase strip, derived server-side from the
   * capture-module rows the route already loads for the whole Move.
   *
   * Only the rows this screen cannot measure use it, and only under the word
   * "saved" — never "answered", and never a completion tick. Absent (the
   * default, and whenever the flag is off) ⇒ the strip renders exactly as it
   * does without this prop.
   */
  capturePhaseSavedAnswerCounts?: Readonly<Record<number, number>>;
  /** `moves_capture_handoff_recap_v1` feature flag, already conjoined server-side with `moves_capture_v2` (tenant-gated, default OFF). When true the capture flow's last step offers "Review what you captured", which opens the hand-off recap WITHOUT submitting — the recap carries the charter-basis rollup and the per-question basis marks, and is otherwise unreachable because the footer's one forward control is spent on the governed approve slot. The approve control travels onto the recap, so submission still runs through the existing gate pipeline. When false the flow behaves exactly as today. */
  captureHandoffRecapEnabled?: boolean;
  /** `moves_capture_notes_v1` feature flag, resolved server-side (tenant-gated, default OFF). When true, the capture dock offers the governed fill-from-notes panel: paste your own notes from a client conversation, review the verbatim passage proposed for each unanswered question, and insert it field by field. Nothing is written until you insert, and a note-derived fill is your assertion, never approved evidence. When false the dock renders exactly as today. */
  captureNotesEnabled?: boolean;
  /**
   * The charter answers P1 left standing on an assumption, folded server-side
   * by `carriedCharterAssumptions` and already gated there on P2 +
   * `moves_charter_assumptions_discover_v1`. `null` means the surface is not
   * active and nothing renders — the client re-checks no flag of its own.
   */
  carriedCharterAssumptions?: readonly CarriedCharterAssumption[] | null;
  /**
   * The charter answers a phase AFTER Discover should carry a caveat on,
   * folded server-side by `charterStandingAfterDiscover` and already gated
   * there on P3+ and `moves_charter_standing_after_discover_v1`. `null` means
   * the surface is not active and nothing renders — the client re-checks no
   * flag of its own, exactly as with `carriedCharterAssumptions`. The two are
   * phase-exclusive by construction: the carry-forward owns P2, this owns P3+.
   */
  charterStandingAfterDiscover?: readonly PostDiscoverCharterAnswer[] | null;
  /** The signed-in session's identity, resolved server-side (never client-supplied)
   *  — shown in the gate-approval confirmation dialog so an approver sees who
   *  they're approving as before committing. Absent (null) degrades gracefully:
   *  the confirmation still shows, just without the approver-identity line. */
  currentUser?: { email: string | null; role: string | null } | null;
}

interface MoveArtifactApiRow {
  artifactId: string;
  artifactType: string;
  deliverableTypeKey?: string | null;
  family: string;
  title: string;
  phase: number | null;
  status: string;
  lifecycleState: string;
  version: number;
  downloadUrl: string;
  deliverableId?: string | null;
  signedOffVersion?: number | null;
  currentVersion?: number | null;
}

type WorkspaceView =
  | "phase"
  | "files"
  | "intelligence"
  | "approvals"
  | "pricing"
  | "risk"
  | "solutioning";

type UploadWorkStatus = "idle" | "uploading" | "uploaded" | "error";
type DecisionOptionSaveStatus = "idle" | "saving" | "saved" | "error";
interface PhaseEvidenceArtifact {
  artifactId: string;
  family?: string;
  fileName: string | null;
  title: string;
  phase: number | null;
  version: number;
  status: string;
  lifecycleState?: string | null;
  qualityScore: number | null;
  createdAt: string;
  downloadUrl: string;
}

function P1CaptureEvidenceStep({
  approvedEvidenceReferences,
  moveId,
  onOpenFiles,
  section,
}: {
  approvedEvidenceReferences: ApprovedPhaseEvidenceReference[];
  moveId: string;
  onOpenFiles: () => void;
  section: PhaseCaptureSection;
}) {
  const router = useRouter();
  const family = p1CharterEvidenceFamilyForSection(section.key);
  if (!family || family.id !== section.evidenceFamily) return null;

  const approvedSources = approvedEvidenceReferences.filter(
    (reference) => reference.familyKey === family.id,
  );

  return (
    <section
      aria-label={`${family.label} evidence`}
      className="mxw-capture-evidence"
      data-testid={`p1-evidence-${family.id}`}
    >
      <header>
        <div>
          <span>Required source</span>
          <h3>Evidence for this step</h3>
        </div>
        <strong>{approvedSources.length > 0 ? "Approved" : "Open"}</strong>
      </header>
      {approvedSources.length > 0 ? (
        <ul>
          {approvedSources.map((source) => (
            <li key={source.evidenceId}>{source.title}</li>
          ))}
        </ul>
      ) : (
        <p>
          Add a source and have a reviewer approve it in Files &amp; Evidence.
          This step stays locked until that evidence is approved.
        </p>
      )}
      <EvidenceUploadControl
        buttonLabel="Add evidence for this step"
        evidenceFamilies={[family]}
        fixedEvidenceFamily={family}
        moveId={moveId}
        onOpenFiles={onOpenFiles}
        phase={1}
        title={`${family.label} source`}
      />
      <button
        className="mxw-capture-evidence-refresh"
        onClick={() => router.refresh()}
        type="button"
      >
        Refresh approved evidence
      </button>
    </section>
  );
}

type PhaseCaptureValues = Record<string, string>;
type AvaDraftRequestStatus = "idle" | "loading" | "ready" | "error";
type AvaDraftSaveStatus = "editing" | "saving" | "saved" | "error";

const P3_OPTION_APPROVAL_TIMEOUT_MS = 45_000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<Response> {
  const controller = new AbortController();
  let timeoutId: number | null = null;
  try {
    return await Promise.race([
      fetch(input, { ...init, signal: controller.signal }),
      new Promise<Response>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          controller.abort();
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(timeoutMessage);
    }
    throw err;
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  }
}

function captureFieldMateriality(args: {
  key: string;
  label: string;
}): "ordinary" | "governed_material" {
  const text = `${args.key} ${args.label}`.toLowerCase();
  return [
    "money",
    "percentage",
    "date",
    "deadline",
    "scope",
    "sponsor",
    "owner",
    "commitment",
    "risk",
    "decision",
    "option",
    "approval",
    "funding",
    "value",
  ].some((term) => text.includes(term))
    ? "governed_material"
    : "ordinary";
}

function captureFieldArtifactToProposal(args: {
  artifact: CaptureFieldArtifact;
  currentValues: PhaseCaptureValues;
  phase: number;
  sections: readonly PhaseCaptureSection[];
}): AvaPhaseInputProposal | null {
  if (args.artifact.phase !== args.phase) return null;
  const section = args.sections.find(
    (candidate) => candidate.key === args.artifact.key,
  );
  if (!section) return null;
  const value = args.artifact.value.trim();
  const evidenceRefs = args.artifact.citations
    .map((citation) => citation.trim())
    .filter(Boolean);
  if (!value || evidenceRefs.length === 0) return null;
  return {
    fieldKey: section.key,
    currentValue: String(args.currentValues[section.key] ?? "").trim() || null,
    proposedValue: value,
    rationale:
      "Drafted by aVa from cited upstream phase state. Review and edit before saving.",
    evidenceRefs,
    sourceClasses: ["approved_phase_input"],
    confidence: args.artifact.confidence ?? "medium",
    materiality: captureFieldMateriality({
      key: section.key,
      label: section.label,
    }),
    unresolvedGaps: [],
  };
}

function mergeAvaDraftProposals(
  existing: AvaPhaseInputProposal[],
  incoming: AvaPhaseInputProposal[],
): AvaPhaseInputProposal[] {
  if (incoming.length === 0) return existing;
  const byKey = new Map(
    existing.map((proposal) => [proposal.fieldKey, proposal]),
  );
  for (const proposal of incoming) byKey.set(proposal.fieldKey, proposal);
  return [...byKey.values()];
}

interface StageReadinessWorkbookParsePreview {
  ok: boolean;
  issues?: Array<{ severity?: string; code?: string; message?: string }>;
  responses?: Array<{ questionId?: string; response?: string }>;
  summary?: {
    totalQuestions?: number;
    answeredQuestions?: number;
    requiredAnswered?: number;
    requiredTotal?: number;
    warningCount?: number;
    errorCount?: number;
  };
  proposalSet?: {
    artifactId?: string;
    artifactVersion?: number;
    proposalSetId?: string;
    transition?: { fromPhase?: number; toPhase?: number };
    status?: string;
    proposalCount?: number;
    pendingCount?: number;
    review?: {
      status?: string;
      acceptedCount?: number;
      rejectedCount?: number;
      needsValidationCount?: number;
      pendingCount?: number;
      /** Decisions restored from an earlier upload of the same workbook,
       * matched on the answer rather than the file it arrived in. */
      carriedForwardFromPriorUpload?: number;
      readiness?: {
        ready?: number;
        partial?: number;
        insufficientEvidence?: number;
        unknown?: number;
      };
    };
    proposals?: Array<{
      proposalId?: string;
      questionId?: string;
      dimensionId?: string;
      requirement?: "required" | "recommended";
      question?: string;
      response?: string;
      answerState?: string;
      disposition?: string;
      /** Restored from an earlier upload and not yet recorded for this set. */
      dispositionRestoredFromPriorUpload?: boolean;
    }>;
    message?: string;
  } | null;
}

interface StageReadinessWorkbookReviewResult {
  ok?: boolean;
  proposalReview?: {
    artifactId?: string;
    status?: string;
    acceptedCount?: number;
    rejectedCount?: number;
    needsValidationCount?: number;
    pendingCount?: number;
    acceptedResponses?: number;
    readiness?: {
      ready?: number;
      partial?: number;
      insufficientEvidence?: number;
      unknown?: number;
    };
    message?: string;
  };
  detail?: string;
  error?: string;
}

function normalizePhaseCaptureValues(
  values: Record<string, string> | null | undefined,
): PhaseCaptureValues {
  return buildPhaseCaptureItems({
    persistedCaptureValues: values ?? {},
  });
}

const PHASES: PhaseContract[] = [
  {
    phase: 0,
    code: "P0",
    navLabel: "Originate",
    title: "Originate",
    question: "What business bet should become a governed Move?",
    lede: "Capture intent, sponsor, value hypothesis, and the first evidence family. Do this before the work becomes a program.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "decide", label: "Frame" },
      { key: "approve", label: "Gate approval" },
    ],
    sessions: ["Problem framing", "Stakeholder context", "Evidence inventory"],
    templates: [
      { name: "Move Origination Brief", type: "DOCX" },
      { name: "Value Hypothesis Canvas", type: "XLSX" },
      { name: "Evidence Inventory", type: "XLSX" },
    ],
    avaRole: "Origination guide",
    avaContext:
      "I help frame the Move from sponsor intent, value hypotheses, and the evidence needed to prove it.",
    avaQuestions: [
      "What would make this worth funding?",
      "What evidence is missing before charter?",
      "Who should sponsor the decision?",
    ],
  },
  {
    phase: 1,
    code: "P1",
    navLabel: "Charter",
    title: "Charter",
    question: "What exactly are we committing to investigate?",
    lede: "Turn the idea into a bounded charter. Define scope, owner, success measures, assumptions, and the next gate.",
    substeps: [
      { key: "prepare", label: "Charter Inputs" },
      { key: "decide", label: "Upload Evidence" },
      { key: "approve", label: "Approve & Build" },
    ],
    sessions: [
      "Authorized workspace-user charter review",
      "Scope boundary workshop",
      "Success metric review",
    ],
    templates: [
      { name: "Strategic Move Charter", type: "DOCX" },
      { name: "Scope Boundary Matrix", type: "XLSX" },
      { name: "Stakeholder Map", type: "PPTX" },
    ],
    avaRole: "Charter partner",
    avaContext:
      "I keep scope, success measures, and decision rights visible so the Move does not become a loose AI pilot.",
    avaQuestions: [
      "What is in and out of scope?",
      "Which success metric is weakest?",
      "What assumption should be challenged first?",
    ],
  },
  {
    phase: 2,
    code: "P2",
    navLabel: getPhaseName(2),
    title: getPhaseName(2),
    question: "What is true now, before we design the future state?",
    lede: "Diagnose the current state before choosing a path. Use operational evidence, metrics, systems, workforce signals, and constraints.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "current", label: "Upload & Review" },
      { key: "findings", label: "Review Findings" },
      { key: "approve", label: "Approve & Build" },
    ],
    sessions: [
      "Current-state walkthrough",
      "KPI and baseline review",
      "Systems and handoff review",
      "Root-cause review",
    ],
    templates: [
      { name: "Current-State Process Map", type: "DOCX" },
      { name: "Operational Baseline", type: "XLSX" },
      { name: "Systems Landscape", type: "XLSX" },
      { name: "Root-Cause Findings Summary", type: "DOCX" },
    ],
    avaRole: "Current-state analyst",
    avaContext:
      "I map uploaded evidence to process, data, systems, controls, workforce, and value lanes before the design work starts.",
    avaQuestions: [
      "What does the evidence prove?",
      "Which blocker is structural?",
      "What cannot be claimed yet?",
    ],
  },
  {
    phase: 3,
    code: "P3",
    navLabel: getPhaseName(3),
    title: getPhaseName(3),
    question: "Which solution approach should we use?",
    lede: "Design each lane enough to estimate effort, sequence the roadmap, and map risk. aVa recommends; your SMEs decide and approve.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "options", label: "Compare Options" },
      { key: "decide", label: "Record Decision" },
      { key: "canvas", label: "Design Canvas" },
      { key: "approve", label: "Approve & Build" },
    ],
    sessions: [
      "Solution options workshop",
      "Architecture constraints review",
      "Human + AI work-split review",
      "Controls & guardrails review",
    ],
    templates: [
      { name: "Solution Options Canvas", type: "DOCX" },
      { name: "Pros / Cons & Tradeoff Matrix", type: "XLSX" },
      { name: "Human + AI Work Split", type: "DOCX" },
      { name: "Controls & Guardrails Review", type: "DOCX" },
      { name: "Solution Approach Decision Summary", type: "DOCX" },
      { name: "Design-Lane Risk Register", type: "XLSX" },
    ],
    avaRole: "Solution-design partner",
    avaContext:
      "I use the prior phase evidence to compare approaches, flag readiness risk, and keep the decision traceable.",
    avaQuestions: [
      "Which option best fits the evidence?",
      "Where are we over-designing?",
      "What must be true before P4?",
    ],
  },
  {
    phase: 4,
    code: "P4",
    navLabel: getPhaseName(4),
    title: getPhaseName(4),
    question:
      "What plan, value case, and sequencing should leadership approve?",
    lede: "Convert the chosen approach into workstreams, delivery scenarios, economics, and dependencies. Shape the executive commit package.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "value", label: "Value Case" },
      { key: "workstreams", label: "Plan Workstreams" },
      { key: "approve", label: "Approve & Build" },
    ],
    sessions: [
      "Value case workshop",
      "Delivery scenario review",
      "Roadmap sequencing",
      "Executive commit review",
    ],
    templates: [
      { name: "Roadmap & Business Case", type: "PPTX" },
      { name: "Delivery Scenario Model", type: "XLSX" },
      { name: "Workstream Plan", type: "XLSX" },
      { name: "Executive Commit Packet", type: "DOCX" },
    ],
    avaRole: "Business-case partner",
    avaContext:
      "I convert the approved approach into a value-backed plan with explicit dependencies and risk controls.",
    avaQuestions: [
      "Which value lever carries the case?",
      "What is the riskiest dependency?",
      "What should leadership approve?",
    ],
  },
  {
    phase: 5,
    code: "P5",
    navLabel: getPhaseName(5),
    title: getPhaseName(5),
    question: "Is the approved roadmap ready for handoff?",
    lede: "Confirm receiving owners, open conditions, and Tower measurement acceptance. Moves ends at handoff; project execution happens outside the product.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "workstreams", label: "Handoff Readiness" },
      { key: "approve", label: "Approve & Build" },
    ],
    sessions: [
      "Receiving-owner handoff review",
      "Open conditions and adoption ownership",
      "Tower metric handoff",
    ],
    templates: [
      { name: "Mobilization Handoff", type: "DOCX" },
      { name: "Open Conditions & Ownership", type: "XLSX" },
      { name: "Tower Outcome Ledger", type: "XLSX" },
    ],
    avaRole: "Handoff partner",
    avaContext:
      "I confirm the approved roadmap, receiving owners, open conditions, adoption responsibility, and Tower measurement handoff. I do not execute the project.",
    avaQuestions: [
      "Which handoff conditions remain open?",
      "Which metric goes to Tower?",
      "Who owns value leakage?",
    ],
  },
];

export function movesPhaseCopyAuditBlocks(): string[] {
  return PHASES.flatMap((phase) => [
    phase.lede,
    phase.question,
    phase.avaContext,
  ]);
}

export const MOVES_STANDALONE_SUGGESTED_QUESTIONS = PHASES.map((phase) => ({
  phase: phase.phase,
  suggestedPrompts: phase.avaQuestions,
}));

/**
 * What approving a satisfied gate does, in the confirmation dialog.
 *
 * `currentOpenPhase` is the phase the Move is in. Approving that phase's own
 * gate opens the NEXT phase — the dialog used to name the current one ("opens
 * P2" while approving the P2 gate). Re-approving an earlier gate opens
 * nothing: the Move stays where it is.
 */
export function gateOnlyConfirmSummaryFor(
  phase: Pick<PhaseContract, "phase" | "code">,
  currentOpenPhase: Pick<PhaseContract, "phase" | "code" | "title">,
): string {
  if (currentOpenPhase.phase > phase.phase) {
    return `This re-submits the already-satisfied ${phase.code} gate against current evidence. The Move stays in ${currentOpenPhase.code} ${currentOpenPhase.title}. It does not regenerate artifacts.`;
  }
  const opens = phaseFor(Math.min(phase.phase + 1, 5));
  return `This submits the already-satisfied ${phase.code} gate and opens ${opens.code} ${opens.title}. It does not regenerate artifacts.`;
}

function phaseFor(phaseNum: number): PhaseContract {
  return PHASES.find((phase) => phase.phase === phaseNum) ?? PHASES[0];
}

function nextPhaseFor(phase: PhaseContract): PhaseContract | null {
  return PHASES.find((item) => item.phase === phase.phase + 1) ?? null;
}

function formatArchetype(value: string | null | undefined): string {
  if (!value) return "Strategic Move";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function moneyRange(valueAtStake: StrategicMove["valueAtStake"]): string {
  const projected = valueAtStake.projected;
  if (!projected) return "Value at stake to be quantified";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: projected.currency || "USD",
    maximumFractionDigits: 0,
    notation: "compact",
  });
  return `${formatter.format(projected.low)}-${formatter.format(projected.high)}`;
}

function mapArtifactApiRowToBuildArtifact(
  artifact: MoveArtifactApiRow,
): PhaseBuildArtifact {
  return {
    artifactId: artifact.artifactId,
    deliverableTypeKey: artifact.deliverableTypeKey ?? artifact.artifactType,
    documentTitle: artifact.title,
    phase: artifact.phase,
    status: artifact.status,
    version: artifact.version,
    downloadUrl: artifact.downloadUrl,
    deliverableId: artifact.deliverableId ?? null,
    signedOffVersion: artifact.signedOffVersion ?? null,
    currentVersion: artifact.currentVersion ?? null,
  };
}

function mergePhaseBuildArtifacts(
  artifacts: PhaseBuildArtifact[],
): PhaseBuildArtifact[] {
  const byId = new Map<string, PhaseBuildArtifact>();
  for (const artifact of artifacts) {
    byId.set(artifact.artifactId, artifact);
  }
  return Array.from(byId.values());
}

function samePhaseBuildArtifactIds(
  left: PhaseBuildArtifact[],
  right: PhaseBuildArtifact[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every(
    (artifact, index) => artifact.artifactId === right[index]?.artifactId,
  );
}

export function MovesPhaseStandaloneClient({
  stepPagesV3Enabled = false,
  initialStepView = null,
  canApproveGates = false,
  initialPhaseCaptureValues,
  initialReferenceDraftValues = {},
  initialPhaseCaptureRevision,
  initialBusinessChangeAssessment = "",
  initialApprovedEvidenceReferences = [],
  initialApprovedP1CaptureEvidenceReferences = [],
  initialConfirmedSolutionRoute = null,
  uploadedSolutionOptionSet = null,
  approvedSolutionOption = null,
  move,
  phaseNum,
  phaseTallies,
  evidenceNeedPackets,
  evidenceReadinessAvailable = true,
  carriesForwardContent,
  p3PriorPhaseContent = [],
  phaseBuildArtifacts = [],
  phaseNavigationStatus,
  initialStageReadinessPreview = null,
  syntheticEvidencePackHref = null,
  currentStateReadiness = null,
  initialSubstepKey,
  pricingEngineEnabled = false,
  riskAssessmentEnabled = false,
  solutionPatternGateEnabled = false,
  captureV2Enabled = false,
  captureP0Enabled = false,
  charterBasisEnabled = false,
  captureCompositionEnabled = false,
  workspaceV2Enabled = false,
  initialP1CharterBasisBySection = {},
  capturePhaseSavedAnswerCounts,
  captureNotesEnabled = false,
  captureHandoffRecapEnabled = false,
  carriedCharterAssumptions: carriedCharterAssumptionRows = null,
  charterStandingAfterDiscover: charterStandingAfterDiscoverRows = null,
  currentUser = null,
}: MovesPhaseStandaloneClientProps) {
  const router = useRouter();
  const approverLabel =
    currentUser?.email && currentUser?.role
      ? `${currentUser.email} · ${currentUser.role}`
      : (currentUser?.email ?? null);
  const phase = phaseFor(phaseNum);
  const readinessWorkbookHref =
    phase.phase < 5
      ? `/api/v1/programs/${encodeURIComponent(move.id)}/stage-readiness-workbook?phase=${phase.phase}`
      : null;
  const phaseScopedStageReadinessPreview =
    initialStageReadinessPreview?.proposalSet?.transition?.fromPhase ===
      phase.phase &&
    initialStageReadinessPreview.proposalSet.transition?.toPhase ===
      phase.phase + 1
      ? initialStageReadinessPreview
      : null;
  const currentPhase = move.currentPhase ?? 0;
  const terminalComplete = Boolean(move.terminalComplete);
  const isHistoricalPhase = terminalComplete || phase.phase < currentPhase;
  const nextOpenPhase = Math.min(currentPhase, 5);
  const nextOpenPhaseContract = phaseFor(nextOpenPhase);
  const initialSubstepIndex = getInitialSubstepIndex(
    phase,
    initialSubstepKey,
    terminalComplete,
  );
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("phase");
  // The finalized step page for P3 Gate readiness, behind `moves_step_pages_v3`
  // and only with the redesigned capture on. Opened with `?step=gate`.
  const gateStepPageActive =
    stepPagesV3Enabled &&
    Boolean(captureV2Enabled) &&
    phaseNum === 3 &&
    initialStepView === "gate";
  // P2 Step 3, "Rank what's causing the gap", behind the same flag. Opened
  // with `?step=root-causes`; it edits the `gaps_root_causes` answer through
  // the capture autosave.
  const rootCauseStepPageActive =
    stepPagesV3Enabled &&
    Boolean(captureV2Enabled) &&
    phaseNum === 2 &&
    initialStepView === "root-causes";
  const [substepIndex, setSubstepIndex] = useState(initialSubstepIndex);
  // Which step is showing in the detail pane: a real
  // phase-capture section key, or null for the current workflow step.
  // Independent of substepIndex so browsing a capture section never disturbs
  // the real substep/gate state.
  const [finderSelectedSectionKey, setFinderSelectedSectionKey] = useState<
    string | null
  >(() =>
    getInitialFinderSectionKey(
      phase.phase,
      initialSubstepKey,
      isHistoricalPhase,
    ),
  );
  const [finderComingUpOpen, setFinderComingUpOpen] = useState<boolean | null>(
    null,
  );
  const workbookReviewRef = useRef<HTMLDivElement | null>(null);
  const [avaOpen, setAvaOpen] = useState(false);
  const [avaThread, setAvaThread] = useState<AvaChatMessage[]>([]);
  const [avaInput, setAvaInput] = useState("");
  const [avaStreaming, setAvaStreaming] = useState(false);
  const [avaDraftStatus, setAvaDraftStatus] =
    useState<AvaDraftRequestStatus>("idle");
  const [avaDraftError, setAvaDraftError] = useState<string | null>(null);
  const [avaDraftProposals, setAvaDraftProposals] = useState<
    AvaPhaseInputProposal[]
  >([]);
  const [avaDraftValues, setAvaDraftValues] = useState<PhaseCaptureValues>({});
  const [avaDraftSaveStatus, setAvaDraftSaveStatus] = useState<
    Record<string, AvaDraftSaveStatus>
  >({});
  const [avaDraftSaveErrors, setAvaDraftSaveErrors] = useState<
    Record<string, string>
  >({});
  const [clientLoadedPhaseBuildArtifacts, setClientLoadedPhaseBuildArtifacts] =
    useState<PhaseBuildArtifact[]>([]);
  const clientLoadedPhaseBuildArtifactsRef = useRef<PhaseBuildArtifact[]>([]);
  const avaThreadRef = useRef<AvaChatMessage[]>([]);
  avaThreadRef.current = avaThread;
  // P3 recommendations may be highlighted, but no option is selected until the
  // human explicitly clicks it. A recommendation is not an approval.
  const [selectedOption, setSelectedOption] = useState(
    phase.phase === 3 ? "" : "B",
  );
  // An approval THIS SESSION performed and the server accepted. Seeded false:
  // it is a record of a decision, and advancing past a phase is not one. The
  // permissive `gateApproved` below keeps the old seeded meaning so every gate
  // control behaves exactly as before; only the words the screen renders tell
  // the two apart. See `phase-approval-standing`.
  const [gateApprovedThisSession, setGateApproved] = useState(false);
  const gateApproved = isHistoricalPhase || gateApprovedThisSession;
  const approvalStanding = resolvePhaseApprovalStanding({
    terminalComplete,
    phaseNumber: phase.phase,
    currentPhase,
    approvalRecordedThisSession: gateApprovedThisSession,
  });
  // Non-null exactly when `isHistoricalPhase || gateApproved` holds, so it is
  // the header's condition as well as its word — there is no fallback branch
  // to leave untested.
  const approvalHeaderLabel = phaseApprovalHeaderLabel(approvalStanding);
  const [gateApprovalStatus, setGateApprovalStatus] = useState<
    "idle" | "approving" | "approved" | "blocked"
  >(isHistoricalPhase ? "approved" : "idle");
  const [gateApprovalMessage, setGateApprovalMessage] = useState<string | null>(
    null,
  );
  // Confirmation state for the P0 gate control rendered INLINE in the capture
  // flow's hand-off step. The legacy canvas puts its P0 button through
  // `StepHeaderActionPortal`, whose target (`#mxw-step-progress-action`) does
  // not exist in the capture flow, so the capture flow needs its own trigger.
  const [captureP0ConfirmOpen, setCaptureP0ConfirmOpen] = useState(false);
  const substep = phase.substeps[substepIndex] ?? phase.substeps[0];
  const topLevelRequiredEvidenceGaps = currentPhaseRequiredEvidenceGaps(
    evidenceNeedPackets,
    phase.phase,
  );
  const phaseEvidenceChecklistConfigured =
    phase.phase < 2 ||
    (phase.phase === 2
      ? currentStateReadiness !== null
      : evidenceNeedPackets.some((packet) => packet.phase === phase.phase));
  const topLevelEvidenceCheckAvailable =
    evidenceReadinessAvailable &&
    phaseEvidenceChecklistConfigured &&
    (phase.phase !== 2 || currentStateReadiness !== null);
  const p0EvidencePacket = evidenceNeedPackets.find(
    (packet) =>
      packet.phase === 0 && packet.familyId === "p0_origination_source",
  );
  const p0EvidenceGateCriterion = {
    id: "p0_source_evidence",
    label: "One uploaded P0 source file reviewed",
    severity: "hard" as const,
    completed:
      topLevelEvidenceCheckAvailable && p0EvidencePacket?.status === "covered",
  };
  const topLevelHardGateCriteria = [
    ...move.gateCriteria.filter((criterion) => criterion.severity === "hard"),
    ...(phase.phase === 0 ? [p0EvidenceGateCriterion] : []),
  ];
  const topLevelHardGateMet = topLevelHardGateCriteria.filter(
    (criterion) => criterion.completed,
  ).length;
  const topLevelHardGateOpenCount =
    topLevelHardGateCriteria.length - topLevelHardGateMet;
  const phaseHardGatesPassed =
    isHistoricalPhase || gateApproved || topLevelHardGateOpenCount === 0;
  const topLevelHardGateTotal = topLevelHardGateCriteria.length;
  const hardGateProgressLabel =
    topLevelHardGateTotal > 0
      ? `${topLevelHardGateMet}/${topLevelHardGateTotal} hard met`
      : "no hard gates";
  const topLevelEvidenceReady =
    topLevelEvidenceCheckAvailable &&
    topLevelRequiredEvidenceGaps.length === 0 &&
    (phase.phase !== 2 || currentStateReadiness?.hardGaps.length === 0);
  const progressPct = Math.round(
    ((substepIndex + 1) / phase.substeps.length) * 100,
  );
  const phaseReadinessLabel =
    isHistoricalPhase || gateApproved
      ? "Complete"
      : substep.key === "approve" && topLevelHardGateTotal > 0
        ? phaseHardGatesPassed && topLevelEvidenceReady
          ? `Ready · ${hardGateProgressLabel}`
          : `Blocked · ${hardGateProgressLabel}`
        : hardGateProgressLabel;
  const workspaceSurfaceLabel =
    workspaceView === "phase"
      ? `${phase.code} workflow`
      : workspaceView === "files"
        ? "Files & Evidence"
        : workspaceView === "approvals"
          ? "Approvals overview"
          : workspaceView === "pricing"
            ? "Cost & Effort"
            : workspaceView === "risk"
              ? "Risk Assessment"
              : workspaceView === "solutioning"
                ? "Solutioning"
                : "Phase Intelligence";
  const workspaceTabs: Array<{ label: string; view: WorkspaceView }> = [
    { label: "Steps", view: "phase" },
    { label: "Files & Evidence", view: "files" },
    { label: "Intelligence", view: "intelligence" },
    { label: "Approvals", view: "approvals" },
    ...(phase.phase === 4 && pricingEngineEnabled
      ? [{ label: "Cost & Effort", view: "pricing" as const }]
      : []),
    ...((phase.phase === 2 || phase.phase === 3) && riskAssessmentEnabled
      ? [{ label: "Risk Assessment", view: "risk" as const }]
      : []),
    ...(phase.phase === 3 && solutionPatternGateEnabled
      ? [{ label: "Solutioning", view: "solutioning" as const }]
      : []),
  ];
  const supportLine = useMemo(() => {
    const industry = move.tenant.industryCode
      ? move.tenant.industryCode.toUpperCase()
      : "enterprise";
    return `${move.tenant.name} · ${formatArchetype(move.archetype)} · ${industry}`;
  }, [move.archetype, move.tenant.industryCode, move.tenant.name]);

  const committedReadinessCount =
    currentStateReadiness?.instruments.filter(
      (instrument) => instrument.status === "committed",
    ).length ?? 0;
  const reviewRequiredReadinessCount =
    currentStateReadiness?.instruments.reduce(
      (count, instrument) => count + instrument.pendingReviews.length,
      0,
    ) ?? 0;
  const visibleCurrentStateEvidenceCount =
    committedReadinessCount + reviewRequiredReadinessCount;
  const findingsEvidenceLabel = currentStateReadiness
    ? reviewRequiredReadinessCount > 0
      ? `${reviewRequiredReadinessCount} awaiting review · ${committedReadinessCount} approved`
      : `${visibleCurrentStateEvidenceCount || committedReadinessCount} approved evidence item${(visibleCurrentStateEvidenceCount || committedReadinessCount) === 1 ? "" : "s"}`
    : `${move.linkedEvidence.length} evidence item${move.linkedEvidence.length === 1 ? "" : "s"}`;
  const evidenceCount = committedReadinessCount || move.linkedEvidence.length;
  const moveValueRange = useMemo(
    () => moneyRange(move.valueAtStake),
    [move.valueAtStake],
  );
  const displayMoveName = useMemo(
    () => demoSafeClientText(move.name),
    [move.name],
  );
  const p3DesignInputsPack = useMemo(
    () =>
      buildP3DesignInputsPackFromSignals({
        archetype: move.archetype,
        priorPhaseContent: p3PriorPhaseContent,
        charter: move.charter,
        evidenceNeedPackets,
        gateCriteria: move.gateCriteria,
        linkedEvidence: move.linkedEvidence,
        moveId: move.id,
        moveName: displayMoveName,
        readiness: currentStateReadiness,
      }),
    [
      p3PriorPhaseContent,
      currentStateReadiness,
      evidenceNeedPackets,
      move.archetype,
      move.charter,
      move.gateCriteria,
      move.id,
      move.linkedEvidence,
      displayMoveName,
    ],
  );
  // Increment 2: the v2 OUTCOME findings surface for an intelligence phase
  // (P2 Discover, P4 Business case), DERIVED from the phase's real governed
  // content — the archetype-driven current-state readiness report and the
  // latest generated deliverable's content signals. No finding is invented; a
  // phase with no governed content yet yields a pending model and a designed
  // empty state. Null for every capture-heavy phase, where the OUTCOME step
  // keeps the hand-off recap.
  const phaseFindingsModel = useMemo(
    () =>
      buildPhaseFindings({
        phase: phase.phase,
        readiness: currentStateReadiness,
        contentSignals: carriesForwardContent,
      }),
    [phase.phase, currentStateReadiness, carriesForwardContent],
  );
  // Accept/Challenge review state. Presentation only (Increment 2 introduces no
  // new findings-attestation store): the toggle feeds the gate's honesty line
  // and nothing else. A real review store can later own this without the
  // surface or the gate summary changing.
  const [findingsReview, setFindingsReview] = useState<
    Record<string, FindingReviewState>
  >({});
  const onFindingReview = useCallback(
    (id: string, state: FindingReviewState) => {
      setFindingsReview((prev) => ({ ...prev, [id]: state }));
    },
    [],
  );
  const findingsReviewSummary = useMemo(
    () =>
      phaseFindingsModel
        ? summarizePhaseFindingsReview(phaseFindingsModel, findingsReview)
        : null,
    [phaseFindingsModel, findingsReview],
  );
  // Increment 3: the OUTCOME charts / intelligence layer for the same
  // intelligence phases. P2 charts (governed share, root-cause Pareto) are
  // DERIVED from the real readiness report; P4 charts (cost / value /
  // sensitivity) have no governed baseline and are rendered as labelled
  // illustrative placeholders. Null for every non-intelligence phase.
  const phaseChartsModel = useMemo(
    () =>
      buildPhaseCharts({
        phase: phase.phase,
        readiness: currentStateReadiness,
        contentSignals: carriesForwardContent,
      }),
    [phase.phase, currentStateReadiness, carriesForwardContent],
  );

  const visiblePhaseBuildArtifacts = useMemo(
    () =>
      mergePhaseBuildArtifacts([
        ...phaseBuildArtifacts,
        ...clientLoadedPhaseBuildArtifacts,
      ]),
    [clientLoadedPhaseBuildArtifacts, phaseBuildArtifacts],
  );
  // Health of the one read that carries per-deliverable sign-off state. The
  // server-rendered `phaseBuildArtifacts` declare no sign-off columns at all,
  // so until this read lands the gate ledger has nothing to report — and must
  // say so rather than report zero sign-offs.
  const [signOffReadback, setSignOffReadback] = useState<{
    completed: boolean;
    loadFailed: boolean;
    deliverableSignOffStatus?: unknown;
  }>({ completed: false, loadFailed: false });

  useEffect(() => {
    let cancelled = false;
    async function loadGeneratedArtifacts() {
      try {
        const response = await fetch(
          `/api/v1/programs/${encodeURIComponent(move.id)}/artifacts`,
          { credentials: "include" },
        );
        if (!response.ok) {
          // The sign-off columns on these rows come only from this read, so a
          // refused or failed read leaves the gate ledger with no sign-off
          // state. Record that it is UNKNOWN rather than leaving the ledger to
          // report every gate document as having none.
          if (!cancelled) {
            setSignOffReadback({ completed: true, loadFailed: true });
          }
          return;
        }
        const payload = (await response.json().catch(() => ({}))) as {
          artifacts?: MoveArtifactApiRow[];
          deliverableSignOffStatus?: unknown;
        };
        if (cancelled) return;
        if (!Array.isArray(payload.artifacts)) {
          setSignOffReadback({ completed: true, loadFailed: true });
          return;
        }
        // Set BEFORE the dedupe short-circuit below: an unchanged artifact set
        // is still a completed read, and its reported projection health is the
        // whole point of this state. Bail out when the health has not moved, so
        // a repeat read of the same state costs no render.
        const reportedStatus = payload.deliverableSignOffStatus;
        setSignOffReadback((prev) =>
          prev.completed &&
          !prev.loadFailed &&
          prev.deliverableSignOffStatus === reportedStatus
            ? prev
            : {
                completed: true,
                loadFailed: false,
                deliverableSignOffStatus: reportedStatus,
              },
        );
        const nextArtifacts = payload.artifacts
          .filter(
            (artifact) =>
              artifact.family === "generated_deliverable" &&
              artifact.lifecycleState === "current" &&
              artifact.phase === phase.phase,
          )
          .map(mapArtifactApiRowToBuildArtifact);
        if (
          samePhaseBuildArtifactIds(
            clientLoadedPhaseBuildArtifactsRef.current,
            nextArtifacts,
          )
        ) {
          return;
        }
        clientLoadedPhaseBuildArtifactsRef.current = nextArtifacts;
        setClientLoadedPhaseBuildArtifacts(nextArtifacts);
      } catch {
        if (!cancelled) {
          setSignOffReadback({ completed: true, loadFailed: true });
        }
        if (
          !cancelled &&
          clientLoadedPhaseBuildArtifactsRef.current.length > 0
        ) {
          clientLoadedPhaseBuildArtifactsRef.current = [];
          setClientLoadedPhaseBuildArtifacts([]);
        }
      }
    }
    void loadGeneratedArtifacts();
    return () => {
      cancelled = true;
    };
  }, [move.id, phase.phase]);
  // What an uploader can declare a file as covering: the evidence families
  // this Move's discovery requires, once each. Every upload surface that asks
  // for these families is handed the same list, so none of them can instruct
  // the user to supply a family it gives no way to declare.
  const declarableEvidenceFamilies = useMemo(
    () => declarableEvidenceUploadFamilies(evidenceNeedPackets),
    [evidenceNeedPackets],
  );
  const p3OptionSet = useMemo(
    () =>
      assembleP3SolutionOptions({
        archetype: move.archetype,
        designInputs: p3DesignInputsPack,
        evidenceNeedPackets,
        industryCode: move.tenant.industryCode,
        moveId: move.id,
        moveName: displayMoveName,
        readiness: currentStateReadiness,
        tenantName: move.tenant.name,
        uploadedOptionSet: uploadedSolutionOptionSet,
        valueAtStake: moveValueRange,
      }),
    [
      currentStateReadiness,
      evidenceNeedPackets,
      move.archetype,
      move.id,
      displayMoveName,
      move.tenant.industryCode,
      move.tenant.name,
      moveValueRange,
      p3DesignInputsPack,
      uploadedSolutionOptionSet,
    ],
  );
  const [persistedPhaseCaptureValues, setPersistedPhaseCaptureValues] =
    useState<PhaseCaptureValues>(() =>
      normalizePhaseCaptureValues(initialPhaseCaptureValues),
    );
  const [phaseCaptureValues, setPhaseCaptureValues] =
    useState<PhaseCaptureValues>(() =>
      normalizePhaseCaptureValues(initialPhaseCaptureValues),
    );
  const [confirmedSolutionRoute, setConfirmedSolutionRoute] =
    useState<ConfirmedSolutionRoute | null>(initialConfirmedSolutionRoute);
  const businessChangeAssessment =
    phase.phase === 1
      ? (phaseCaptureValues.business_change_assessment ??
        initialBusinessChangeAssessment)
      : initialBusinessChangeAssessment;
  const [phaseCaptureRevision, setPhaseCaptureRevision] = useState(
    initialPhaseCaptureRevision ?? "",
  );
  const [phaseCaptureSaveStatus, setPhaseCaptureSaveStatus] = useState<
    Record<string, PhaseCaptureSaveStatus>
  >({});
  const [phaseCaptureSaveErrors, setPhaseCaptureSaveErrors] = useState<
    Record<string, string>
  >({});
  const phaseCaptureSections = useMemo(
    () => getPhaseCaptureSections(phase.phase, confirmedSolutionRoute),
    [confirmedSolutionRoute, phase.phase],
  );
  // ─── moves_charter_basis_v1 (flag, default OFF): the per-field basis ───
  // The capture stepper uses these persisted declarations as P1's minimum
  // viable evidence alternative. Assertions and owned assumptions can complete
  // a saved answer without being relabelled as approved evidence.
  const charterBasisActive = charterBasisSurfaceActive({
    flagEnabled: charterBasisEnabled,
    phaseNumber: phase.phase,
  });
  const charterBasisSectionKeys = useMemo(
    () =>
      resolveCharterBasisSectionKeys({
        active: charterBasisActive,
        sections: phaseCaptureSections,
      }),
    [charterBasisActive, phaseCaptureSections],
  );
  const [charterBasisBySection, setCharterBasisBySection] = useState<
    Record<string, CharterBasisValue>
  >(() => ({ ...initialP1CharterBasisBySection }));
  const [charterBasisSaveError, setCharterBasisSaveError] = useState<
    Record<string, string>
  >({});
  const [
    charterBasisSavePendingBySection,
    setCharterBasisSavePendingBySection,
  ] = useState<Record<string, boolean>>({});

  const captureBasisForSection = useCallback(
    (sectionKey: string) => {
      if (!charterBasisActive || !charterBasisSectionKeys.has(sectionKey)) {
        return undefined;
      }
      return {
        value: charterBasisBySection[sectionKey] ?? null,
        savePending: charterBasisSavePendingBySection[sectionKey] === true,
        saveFailed: Boolean(charterBasisSaveError[sectionKey]),
        approvedEvidence: initialApprovedP1CaptureEvidenceReferences,
      };
    },
    [
      charterBasisActive,
      charterBasisBySection,
      charterBasisSaveError,
      charterBasisSavePendingBySection,
      charterBasisSectionKeys,
      initialApprovedP1CaptureEvidenceReferences,
    ],
  );
  const inferredSelectedOption = useMemo(
    () =>
      phase.phase === 3
        ? inferSelectedOptionId(
            persistedPhaseCaptureValues.recommendation,
            p3OptionSet.options,
          )
        : "",
    [
      phase.phase,
      persistedPhaseCaptureValues.recommendation,
      p3OptionSet.options,
    ],
  );
  const approvedOptionId = useMemo(
    () =>
      phase.phase === 3
        ? restoreApprovedOptionId(approvedSolutionOption, p3OptionSet.options)
        : "",
    [approvedSolutionOption, p3OptionSet.options, phase.phase],
  );
  const effectiveSelectedOption =
    selectedOption || approvedOptionId || inferredSelectedOption;
  const selectedP3Option = useMemo(
    () =>
      p3OptionSet.options.find(
        (option) => option.id === effectiveSelectedOption,
      ),
    [effectiveSelectedOption, p3OptionSet.options],
  );
  const avaDraftProposalsByKey = useMemo(
    () =>
      new Map(
        avaDraftProposals
          .filter(
            (proposal) =>
              proposal.proposedValue.trim() && proposal.evidenceRefs.length > 0,
          )
          .map((proposal) => [proposal.fieldKey, proposal]),
      ),
    [avaDraftProposals],
  );
  const displayPhaseCaptureValues = useMemo(
    () => ({ ...phaseCaptureValues, ...avaDraftValues }),
    [avaDraftValues, phaseCaptureValues],
  );
  const displayPhaseCaptureSaveStatus = useMemo(() => {
    const next: Record<string, PhaseCaptureSaveStatus> = {
      ...phaseCaptureSaveStatus,
    };
    for (const key of Object.keys(avaDraftValues)) {
      const status = avaDraftSaveStatus[key];
      next[key] =
        status === "saving"
          ? "saving"
          : status === "error"
            ? "error"
            : "editing";
    }
    return next;
  }, [avaDraftSaveStatus, avaDraftValues, phaseCaptureSaveStatus]);
  const displayPhaseCaptureSaveErrors = useMemo(
    () => ({ ...phaseCaptureSaveErrors, ...avaDraftSaveErrors }),
    [avaDraftSaveErrors, phaseCaptureSaveErrors],
  );
  const avaLocalDraftKeys = useMemo(
    () =>
      Object.keys(avaDraftValues).filter(
        (key) =>
          String(avaDraftValues[key] ?? "") !==
          String(persistedPhaseCaptureValues[key] ?? ""),
      ),
    [avaDraftValues, persistedPhaseCaptureValues],
  );
  const avaLocalDraftCount = avaLocalDraftKeys.length;
  const selectP3Option = useCallback((optionId: string) => {
    setSelectedOption(optionId);
  }, []);
  useEffect(() => {
    setFinderSelectedSectionKey(
      getInitialFinderSectionKey(
        phase.phase,
        initialSubstepKey,
        isHistoricalPhase,
      ),
    );
  }, [initialSubstepKey, isHistoricalPhase, phase.phase]);
  const requiredEvidenceGaps = currentPhaseRequiredEvidenceGaps(
    evidenceNeedPackets,
    phase.phase,
  );
  const currentStateEvidenceGapCount =
    phase.phase === 2 && currentStateReadiness
      ? currentStateReadiness.hardGaps.length
      : null;
  const phaseEvidenceCheckAvailable = topLevelEvidenceCheckAvailable;
  const phaseEvidenceCheckBlocker = !evidenceReadinessAvailable
    ? "Evidence readiness could not be verified. Refresh this phase before continuing."
    : !phaseEvidenceChecklistConfigured
      ? "Required evidence checklist is not configured for this phase. Configure it before continuing."
      : phase.phase === 2 && currentStateReadiness === null
        ? "Current-state evidence readiness could not be checked. Refresh this phase before continuing."
        : null;
  const phaseEvidenceGapCount =
    requiredEvidenceGaps.length + (currentStateEvidenceGapCount ?? 0);
  // The transition workbook is reviewed at the Gate step. It must hold the
  // phase gate, but cannot hold Capture's Continue: the workbook control is
  // only reachable after Capture and its answers depend on the design written
  // there. Other required evidence still holds the capture inputs.
  const captureEvidenceGapCount =
    requiredEvidenceGaps.filter(
      (gap) => !gap.familyId.startsWith("stage_readiness_"),
    ).length + (currentStateEvidenceGapCount ?? 0);
  const phaseEvidencePassed =
    phaseEvidenceCheckAvailable && captureEvidenceGapCount === 0;
  const phaseCaptureCompleteCount = useMemo(
    () =>
      phaseCaptureSections.filter(
        (section) =>
          phaseCaptureStatusForSection(
            section,
            persistedPhaseCaptureValues,
            persistedPhaseCaptureValues,
            phaseCaptureSaveStatus,
            businessChangeAssessment,
            initialApprovedEvidenceReferences.map((item) => item.evidenceId),
            phaseEvidencePassed,
            evidenceReadinessAvailable,
            initialApprovedP1CaptureEvidenceReferences,
            captureBasisForSection(section.key),
          ).complete,
      ).length,
    [
      businessChangeAssessment,
      captureBasisForSection,
      initialApprovedEvidenceReferences,
      initialApprovedP1CaptureEvidenceReferences,
      phaseCaptureSections,
      persistedPhaseCaptureValues,
      phaseCaptureSaveStatus,
      phaseEvidencePassed,
      evidenceReadinessAvailable,
    ],
  );
  const phaseCaptureDirtyKeys = useMemo(
    () =>
      phaseCaptureSections
        .filter(
          (section) =>
            String(phaseCaptureValues[section.key] ?? "") !==
            String(persistedPhaseCaptureValues[section.key] ?? ""),
        )
        .map((section) => section.key),
    [phaseCaptureSections, phaseCaptureValues, persistedPhaseCaptureValues],
  );
  const phaseCaptureDirtyCount = phaseCaptureDirtyKeys.length;
  const phaseCaptureSavingCount = phaseCaptureSections.filter(
    (section) => phaseCaptureSaveStatus[section.key] === "saving",
  ).length;
  const phaseCaptureFailedCount = phaseCaptureSections.filter(
    (section) => phaseCaptureSaveStatus[section.key] === "error",
  ).length;
  const phaseCaptureMissingCount =
    phaseCaptureSections.length - phaseCaptureCompleteCount;
  // Sections that are answered, saved, and structurally valid and are held
  // incomplete ONLY by this phase's evidence verdict. Measured by asking the
  // status machine the same question twice — once with the real verdict and
  // once with it forced to passed — so the distinction never re-implements
  // `phaseCaptureStatusForSection`. From P3 on, the evidence behind that
  // verdict is the discovery set re-stamped onto the active phase, which is
  // closed in Files & Evidence and not on this screen. See
  // `resolvePhaseCaptureHold`.
  const phaseCaptureEvidenceHeldCount = useMemo(
    () =>
      phaseCaptureSections.filter((section) => {
        const completeWith = (evidencePassed: boolean) =>
          phaseCaptureStatusForSection(
            section,
            persistedPhaseCaptureValues,
            persistedPhaseCaptureValues,
            phaseCaptureSaveStatus,
            businessChangeAssessment,
            initialApprovedEvidenceReferences.map((item) => item.evidenceId),
            evidencePassed,
            evidenceReadinessAvailable,
            initialApprovedP1CaptureEvidenceReferences,
            captureBasisForSection(section.key),
          ).complete;
        return !completeWith(phaseEvidencePassed) && completeWith(true);
      }).length,
    [
      businessChangeAssessment,
      captureBasisForSection,
      initialApprovedEvidenceReferences,
      initialApprovedP1CaptureEvidenceReferences,
      phaseCaptureSections,
      persistedPhaseCaptureValues,
      phaseCaptureSaveStatus,
      phaseEvidencePassed,
      evidenceReadinessAvailable,
    ],
  );
  const phaseCaptureHold = resolvePhaseCaptureHold({
    unansweredCount: phaseCaptureMissingCount - phaseCaptureEvidenceHeldCount,
    evidenceHeldCount: phaseCaptureEvidenceHeldCount,
    openRequiredEvidenceSlots: requiredEvidenceGaps.map(
      (gap) => gap.evidenceSlot,
    ),
  });
  const blockedPhaseRequest = phaseNavigationStatus?.blockedRequest ?? null;
  const terminalP5Complete = terminalComplete && phase.phase === 5;
  const nextOpenAction =
    blockedPhaseRequest?.nextActionLabel ??
    (phaseCaptureMissingCount > 0
      ? `Complete ${phaseCaptureMissingCount} required input${
          phaseCaptureMissingCount === 1 ? "" : "s"
        }`
      : substep.key === "approve" && topLevelHardGateTotal > 0
        ? topLevelHardGateMet >= topLevelHardGateTotal
          ? "Run Approve & Build"
          : "Resolve hard gate blockers"
        : substep.label);
  const phaseStoryNextAction = terminalP5Complete
    ? "Open Tower"
    : nextOpenAction;
  const phaseStoryArtifactStatus = terminalP5Complete
    ? "Tower handoff complete"
    : blockedPhaseRequest && phase.phase === 1
      ? "Workbook uploaded/previewed is not acceptance"
      : phase.phase < 5
        ? "Workbook available · acceptance required before next phase"
        : "Tower handoff artifacts";
  const phaseStoryRemaining = blockedPhaseRequest
    ? blockedPhaseRequest.reason
    : terminalP5Complete
      ? "Move handed off to Tower."
      : !phaseEvidenceCheckAvailable
        ? (phaseEvidenceCheckBlocker ??
          "Evidence readiness could not be checked. Refresh this phase before continuing.")
        : phaseEvidenceGapCount > 0
          ? `${phaseEvidenceGapCount} required evidence item${
              phaseEvidenceGapCount === 1 ? "" : "s"
            } still need approval or coverage.`
          : phaseCaptureMissingCount > 0
            ? `${phaseCaptureMissingCount} phase input${
                phaseCaptureMissingCount === 1 ? "" : "s"
              } still missing from persisted server state.`
            : !phaseHardGatesPassed
              ? `${topLevelHardGateOpenCount} hard gate blocker${
                  topLevelHardGateOpenCount === 1 ? "" : "s"
                } remain before this phase can advance.`
              : "No required input blockers for the current step.";
  const phaseProgressSignals = [
    {
      label: "Inputs",
      value: `${phaseCaptureCompleteCount}/${phaseCaptureSections.length}`,
      tone:
        phaseCaptureMissingCount === 0 && phaseCaptureDirtyCount === 0
          ? phaseEvidencePassed && phaseHardGatesPassed
            ? "ready"
            : "neutral"
          : "open",
    },
    {
      label: "Evidence",
      value: !phaseEvidenceCheckAvailable
        ? "Not checked"
        : phaseEvidenceGapCount === 0
          ? "Covered"
          : `${phaseEvidenceGapCount} open`,
      tone:
        !phaseEvidenceCheckAvailable || phaseEvidenceGapCount > 0
          ? "blocked"
          : "ready",
    },
    {
      label: "Gate",
      value: phaseReadinessLabel,
      tone:
        isHistoricalPhase || gateApproved || phaseHardGatesPassed
          ? "ready"
          : "blocked",
    },
    {
      label: "Next",
      value: phaseStoryNextAction,
      tone: phaseCaptureMissingCount > 0 ? "open" : "neutral",
    },
  ];
  const phaseCaptureBlocker = !phaseEvidenceCheckAvailable
    ? (phaseEvidenceCheckBlocker ??
      "Evidence readiness could not be verified. Refresh this phase before Approve & Build.")
    : currentStateEvidenceGapCount !== null && currentStateEvidenceGapCount > 0
      ? `${currentStateEvidenceGapCount} current-state evidence famil${
          currentStateEvidenceGapCount === 1 ? "y" : "ies"
        } still need approval or coverage before Approve & Build.`
      : phase.phase === 3 && !selectedP3Option
        ? "Select the solution option that architecture should implement before Approve & Build."
        : phase.phase >= 1 && avaLocalDraftCount > 0
          ? `Save ${avaLocalDraftCount} aVa draft${
              avaLocalDraftCount === 1 ? "" : "s"
            } before Approve & Build.`
          : phase.phase >= 1 && phaseCaptureFailedCount > 0
            ? `Resolve ${phaseCaptureFailedCount} unsaved phase input${
                phaseCaptureFailedCount === 1 ? "" : "s"
              } before Approve & Build.`
            : phase.phase >= 1 && phaseCaptureSavingCount > 0
              ? `Wait for ${phaseCaptureSavingCount} phase input${
                  phaseCaptureSavingCount === 1 ? "" : "s"
                } to save before Approve & Build.`
              : phase.phase >= 1 && phaseCaptureDirtyCount > 0
                ? `Save ${phaseCaptureDirtyCount} phase input${
                    phaseCaptureDirtyCount === 1 ? "" : "s"
                  } before Approve & Build.`
                : phase.phase >= 1 && phaseCaptureMissingCount > 0
                  ? (phaseCaptureHold?.message ??
                    `Complete ${phaseCaptureMissingCount} phase input${
                      phaseCaptureMissingCount === 1 ? "" : "s"
                    } before Approve & Build.`)
                  : null;
  const phaseProgress = phaseProgressReadiness({
    phase: phase.phase,
    phaseCaptureBlocker,
    evidenceNeedPackets,
  });
  const phaseProgressHeaderState: PhaseProgressHeaderState | null =
    finderSelectedSectionKey === null && substep.key === "approve"
      ? approvalHeaderLabel !== null
        ? {
            label: approvalHeaderLabel,
            tone: "complete",
            openEvidenceCount: 0,
            basis: phaseApprovalHeaderBasis(approvalStanding) ?? undefined,
          }
        : !phaseEvidenceCheckAvailable
          ? {
              label: phaseEvidenceChecklistConfigured
                ? "Evidence check unavailable"
                : "Evidence checklist missing",
              tone: "open",
              openEvidenceCount: 0,
            }
          : phaseEvidenceGapCount > 0
            ? {
                label: "Review required evidence",
                tone: "open",
                openEvidenceCount: phaseEvidenceGapCount,
              }
            : !phaseHardGatesPassed
              ? {
                  label: "Resolve hard gate blockers",
                  tone: "open",
                  openEvidenceCount: 0,
                }
              : phaseProgress.blocker
                ? {
                    label: "Inputs not ready",
                    tone: "open",
                    openEvidenceCount: 0,
                  }
                : {
                    label: "Ready to build",
                    tone: "ready",
                    openEvidenceCount: 0,
                  }
      : null;
  // MOVES-UI-001 Steps "Coming up" card. Same real inputs and same
  // function (`buildNextPhaseReadinessPack`) the Approve substep already uses
  // for its "Next phase readiness" section below — computed once here so the
  // steps view (which renders outside that substep) can show it without
  // a second data source. Pure/sync, no new fetch.
  const finderNextPhaseContract = nextPhaseFor(phase);
  const finderReadinessPack: NextPhaseReadinessPack = useMemo(
    () =>
      buildNextPhaseReadinessPack({
        nextPhaseLabel: finderNextPhaseContract
          ? `${finderNextPhaseContract.code} ${finderNextPhaseContract.title}`
          : "Tower handoff",
        nextPhaseNum: phase.phase + 1,
        isTerminalHandoff: !finderNextPhaseContract,
        evidenceNeedPackets,
        suggestedSessions: finderNextPhaseContract?.sessions ?? [],
        suggestedTemplates: finderNextPhaseContract?.templates ?? [],
        carriesForwardContent,
      }),
    [
      carriesForwardContent,
      evidenceNeedPackets,
      finderNextPhaseContract,
      phase.phase,
    ],
  );
  const finderComingUpExpanded =
    finderComingUpOpen ?? finderReadinessPack.openNeeds.length > 0;
  const setPhaseCaptureValue = useCallback((key: string, value: string) => {
    setPhaseCaptureValues((prev) => ({ ...prev, [key]: value }));
    setPhaseCaptureSaveStatus((prev) => ({ ...prev, [key]: "editing" }));
    setPhaseCaptureSaveErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);
  const setVisiblePhaseCaptureValue = useCallback(
    (key: string, value: string) => {
      if (key in avaDraftValues) {
        setAvaDraftValues((prev) => ({ ...prev, [key]: value }));
        setAvaDraftSaveStatus((prev) => ({ ...prev, [key]: "editing" }));
        setAvaDraftSaveErrors((prev) => {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
        return;
      }
      setPhaseCaptureValue(key, value);
    },
    [avaDraftValues, setPhaseCaptureValue],
  );
  const requestAvaPhaseInputDrafts = useCallback(async () => {
    if (avaDraftStatus === "loading") return;
    // A phase outside aVa's drafting window used to return here silently, which
    // on P0 — where the dock offered the control anyway — made an enabled
    // button do nothing at all. The control is no longer offered there; a click
    // that still reaches this handler is answered with the reason.
    const draftAvailability = avaPhaseInputDraftAvailability(phase.phase);
    if (!draftAvailability.available) {
      setAvaOpen(true);
      setAvaDraftStatus("error");
      setAvaDraftError(draftAvailability.unavailableReason);
      return;
    }
    setAvaOpen(true);
    setAvaDraftStatus("loading");
    setAvaDraftError(null);
    try {
      const res = await fetch(`/api/v1/programs/${move.id}/phase-input-draft`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: phase.phase }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        proposals?: AvaPhaseInputProposal[];
        refusal?: string | null;
        detail?: string;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        throw new Error(
          body.detail ||
            body.error ||
            `Draft request failed (HTTP ${res.status})`,
        );
      }
      const citedProposals = (body.proposals ?? []).filter(
        (proposal) =>
          proposal.proposedValue.trim() && proposal.evidenceRefs.length > 0,
      );
      setAvaDraftProposals(citedProposals);
      setAvaDraftStatus("ready");
      setAvaDraftError(
        citedProposals.length === 0
          ? body.refusal ||
              "No cited draft is available from approved upstream state."
          : null,
      );
    } catch (err) {
      setAvaDraftStatus("error");
      setAvaDraftError(
        err instanceof Error
          ? err.message
          : "aVa could not prepare cited drafts.",
      );
    }
  }, [avaDraftStatus, move.id, phase.phase]);
  // The dock's leading actions. aVa's drafting offer is phase-conditional, so
  // the list is DERIVED rather than literal: the capture-flow dock renders every
  // leading action it is handed as an enabled button, and P0 Originate cannot be
  // drafted at all. An empty list is the correct answer there, not an action.
  const avaDraftLeadingActions = useMemo(
    () =>
      avaPhaseInputDraftLeadingActions(phase.phase, () => {
        void requestAvaPhaseInputDrafts();
      }),
    [phase.phase, requestAvaPhaseInputDrafts],
  );
  const avaDraftAvailable = avaPhaseInputDraftAvailability(
    phase.phase,
  ).available;
  const applyAvaDraftProposal = useCallback(
    (proposal: AvaPhaseInputProposal) => {
      if (
        !proposal.proposedValue.trim() ||
        proposal.evidenceRefs.length === 0
      ) {
        setAvaDraftError("aVa drafts require at least one cited source.");
        return;
      }
      setFinderSelectedSectionKey(proposal.fieldKey);
      setWorkspaceView("phase");
      setAvaDraftValues((prev) => ({
        ...prev,
        [proposal.fieldKey]: proposal.proposedValue,
      }));
      setAvaDraftSaveStatus((prev) => ({
        ...prev,
        [proposal.fieldKey]: "editing",
      }));
      setAvaDraftSaveErrors((prev) => {
        if (!(proposal.fieldKey in prev)) return prev;
        const next = { ...prev };
        delete next[proposal.fieldKey];
        return next;
      });
    },
    [],
  );
  const dismissAvaDraftProposal = useCallback((fieldKey: string) => {
    setAvaDraftProposals((prev) =>
      prev.filter((proposal) => proposal.fieldKey !== fieldKey),
    );
    setAvaDraftValues((prev) => {
      if (!(fieldKey in prev)) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setAvaDraftSaveStatus((prev) => {
      if (!(fieldKey in prev)) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setAvaDraftSaveErrors((prev) => {
      if (!(fieldKey in prev)) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);
  const saveAvaDraft = useCallback(
    async (fieldKey: string) => {
      const value = String(avaDraftValues[fieldKey] ?? "");
      if (!value.trim()) {
        setAvaDraftSaveStatus((prev) => ({ ...prev, [fieldKey]: "error" }));
        setAvaDraftSaveErrors((prev) => ({
          ...prev,
          [fieldKey]: "This draft is empty. Edit it before saving.",
        }));
        return;
      }
      setAvaDraftSaveStatus((prev) => ({ ...prev, [fieldKey]: "saving" }));
      setAvaDraftSaveErrors((prev) => {
        if (!(fieldKey in prev)) return prev;
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });

      try {
        const res = await fetch(`/api/v1/programs/${move.id}/phase-capture`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: phase.phase,
            sections: { [fieldKey]: value },
            ...(phaseCaptureRevision
              ? { expectedRevision: phaseCaptureRevision }
              : {}),
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          values?: Record<string, string>;
          revision?: string;
          detail?: string;
          error?: string;
          confirmedSolutionRoute?: ConfirmedSolutionRoute | null;
        };
        if (
          res.status === 409 &&
          body.error === "stale_revision" &&
          body.values &&
          body.revision
        ) {
          setPersistedPhaseCaptureValues(
            normalizePhaseCaptureValues(body.values),
          );
          setPhaseCaptureRevision(body.revision);
          throw new Error(
            body.detail ||
              "This page was loaded before the capture state changed. Reload and re-apply the draft.",
          );
        }
        if (!res.ok || !body.ok || !body.values) {
          throw new Error(
            body.detail ||
              body.error ||
              `Draft save failed (HTTP ${res.status})`,
          );
        }
        const savedValues = normalizePhaseCaptureValues(body.values);
        setPersistedPhaseCaptureValues(savedValues);
        setPhaseCaptureValues((prev) => ({
          ...prev,
          [fieldKey]: savedValues[fieldKey] ?? "",
        }));
        if (body.revision) setPhaseCaptureRevision(body.revision);
        setConfirmedSolutionRoute(body.confirmedSolutionRoute ?? null);
        setAvaDraftValues((prev) => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
        setAvaDraftSaveStatus((prev) => ({ ...prev, [fieldKey]: "saved" }));
        setAvaDraftSaveErrors((prev) => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Draft save failed.";
        setAvaDraftSaveStatus((prev) => ({ ...prev, [fieldKey]: "error" }));
        setAvaDraftSaveErrors((prev) => ({ ...prev, [fieldKey]: message }));
      }
    },
    [avaDraftValues, move.id, phase.phase, phaseCaptureRevision],
  );
  const visibleAvaQuestions =
    phase.phase === 1 ? phase.avaQuestions.slice(0, 2) : phase.avaQuestions;
  useEffect(() => {
    if (phase.phase === 0 || phaseCaptureDirtyKeys.length === 0) return;

    let cancelled = false;
    const keysToSave = [...phaseCaptureDirtyKeys];

    const timer = window.setTimeout(async () => {
      // "Saving" is set HERE, inside the timeout, not in the effect body. This
      // is load-bearing, not cosmetic.
      //
      // React 19 throws #185 ("Maximum update depth exceeded") when a run of
      // consecutive SyncLane commits each leave a DefaultLane update pending.
      // An input event commits on SyncLane, which makes React flush passive
      // effects synchronously inside that commit — so a setState in this
      // effect's BODY left DefaultLane work pending on every keystroke and
      // `nestedUpdateCount` never reset. React 18 tested
      // `remainingLanes === SyncLane`; React 19 widened it to include
      // DefaultLane, which is what made this reachable at all.
      //
      // The throw surfaced inside the textarea's own onChange, and React's
      // controlled-input restore runs in a `finally` — so it wrote the stale
      // committed value back onto the DOM and the keystroke was destroyed.
      // Measured on the live app: one throw and one lost character per ~53
      // characters typed. 480 characters lost exactly 9.
      //
      // Scheduling this inside the timeout means a keystroke commit leaves NO
      // React lane pending — only a `window.setTimeout`, which React does not
      // track. The counter resets every keystroke and the defect is
      // structurally unreachable at any typing speed, rather than merely made
      // less likely by slowing input down.
      if (cancelled) return;
      setPhaseCaptureSaveStatus((prev) => {
        const next = { ...prev };
        for (const key of keysToSave) next[key] = "saving";
        return next;
      });

      const sectionsToSave: Record<string, string> = {};
      for (const key of keysToSave) {
        sectionsToSave[key] = phaseCaptureValues[key] ?? "";
      }

      try {
        const res = await fetch(`/api/v1/programs/${move.id}/phase-capture`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: phase.phase,
            sections: sectionsToSave,
            ...(phaseCaptureRevision
              ? { expectedRevision: phaseCaptureRevision }
              : {}),
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          values?: Record<string, string>;
          revision?: string;
          detail?: string;
          error?: string;
          confirmedSolutionRoute?: ConfirmedSolutionRoute | null;
        };
        if (
          res.status === 409 &&
          body.error === "stale_revision" &&
          body.values &&
          body.revision
        ) {
          if (cancelled) return;
          setPersistedPhaseCaptureValues(
            normalizePhaseCaptureValues(body.values),
          );
          setPhaseCaptureRevision(body.revision);
          setPhaseCaptureSaveStatus((prev) => {
            const next = { ...prev };
            for (const key of keysToSave) next[key] = "editing";
            return next;
          });
          return;
        }
        if (!res.ok || !body.ok || !body.values) {
          throw new Error(
            body.detail ||
              body.error ||
              `Phase capture save failed (HTTP ${res.status})`,
          );
        }
        if (cancelled) return;
        const savedValues = normalizePhaseCaptureValues(body.values);
        setPersistedPhaseCaptureValues(savedValues);
        // Adopt what the server actually stored, not what we sent it.
        //
        // The server normalises on write (evaluatePhaseCapture trims each
        // value), so a value ending in a space comes back one character
        // shorter than the draft that produced it. Leaving the draft alone
        // meant the section stayed permanently dirty: the badge could not
        // reach Done, every autosave pass re-sent the same value, and the
        // control displayed text that a reload would not reproduce — a direct
        // breach of the invariant this surface is supposed to guarantee.
        //
        // Only reconcile keys whose draft is still exactly what we sent. If
        // the user typed while the request was in flight, their newer text
        // wins; overwriting it here would lose input, which is the very class
        // of defect this autosave path already had once.
        setPhaseCaptureValues((prev) =>
          reconcileDraftWithAcknowledged(
            prev,
            sectionsToSave,
            savedValues,
            keysToSave,
          ),
        );
        if (body.revision) setPhaseCaptureRevision(body.revision);
        setConfirmedSolutionRoute(body.confirmedSolutionRoute ?? null);
        setPhaseCaptureSaveStatus((prev) => {
          const next = { ...prev };
          for (const key of keysToSave) next[key] = "saved";
          return next;
        });
        setPhaseCaptureSaveErrors((prev) => {
          const next = { ...prev };
          for (const key of keysToSave) delete next[key];
          return next;
        });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Phase capture save failed.";
        setPhaseCaptureSaveStatus((prev) => {
          const next = { ...prev };
          for (const key of keysToSave) next[key] = "error";
          return next;
        });
        setPhaseCaptureSaveErrors((prev) => {
          const next = { ...prev };
          for (const key of keysToSave) next[key] = message;
          return next;
        });
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    move.id,
    phase.phase,
    phaseCaptureDirtyKeys,
    phaseCaptureRevision,
    phaseCaptureValues,
  ]);
  const phaseCaptureHasUnsavedWork =
    phaseCaptureDirtyCount > 0 ||
    avaLocalDraftCount > 0 ||
    phaseCaptureSavingCount > 0 ||
    phaseCaptureFailedCount > 0;
  useEffect(() => {
    if (!phaseCaptureHasUnsavedWork) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [phaseCaptureHasUnsavedWork]);
  const refreshPhase = useCallback(() => {
    router.refresh();
  }, [router]);

  // aVa chat send. Ported from the retired StrategicMovePhaseClient's `send`
  // — same endpoint, same surfaceContext shape. Critically keeps
  // `programId` at the top level AND inside surfaceContext: canonicalizeSurface
  // (src/lib/agent/surface.ts) reads surfaceContext.programId specifically,
  // not moveId — sending only moveId here previously made aVa answer "No
  // active Move session is visible" (confirmed live, fixed, do not regress).
  const sendAvaMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || avaStreaming) return;
      setAvaInput("");

      const assistantId = nextAvaTurnId();
      setAvaThread((prev) => [
        ...prev,
        { id: nextAvaTurnId(), role: "user", text: trimmed },
        { id: assistantId, role: "assistant", text: "" },
      ]);
      setAvaStreaming(true);

      const abort = new AbortController();
      const hangTimer = setTimeout(() => abort.abort(), 180_000);

      try {
        const conversationHistory = avaThreadRef.current
          .filter((m) => m.text.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.text }));

        const res = await fetch("/api/chat/agent", {
          method: "POST",
          signal: abort.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            tenantName: move.tenant.name,
            agentName: "Nexus",
            surface: `/strategic-moves/${move.id}/phase/${phaseNum}`,
            programId: move.id,
            conversationHistory,
            surfaceContext: {
              programId: move.id,
              moveId: move.id,
              phase: phaseNum,
              moveDisplayCode: move.displayCode,
              moveName: displayMoveName,
              phaseLabel: phase.title,
            },
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let pendingBuffer = "";
        let committedVisible = "";
        const streamArtifacts: Artifact[] = [];
        const ingestCaptureFieldArtifacts = (artifacts: Artifact[]) => {
          const proposals = artifacts
            .filter(
              (artifact): artifact is CaptureFieldArtifact =>
                artifact.type === "capture-field",
            )
            .map((artifact) =>
              captureFieldArtifactToProposal({
                artifact,
                currentValues: phaseCaptureValues,
                phase: phase.phase,
                sections: phaseCaptureSections,
              }),
            )
            .filter(
              (proposal): proposal is AvaPhaseInputProposal =>
                proposal !== null,
            );
          if (proposals.length === 0) return;
          setAvaDraftProposals((prev) =>
            mergeAvaDraftProposals(prev, proposals),
          );
          setAvaDraftStatus("ready");
          setAvaDraftError(null);
        };
        const buildVisibleAnswer = (visibleText: string) =>
          buildMovesChatAvaAnswerPacket({
            move,
            phase,
            question: trimmed,
            visibleText,
            phaseTallies,
            readinessPack: finderReadinessPack,
            streamArtifacts,
          });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingBuffer += decoder.decode(value, { stream: true });
          const { visibleText, artifacts, remaining } =
            extractArtifacts(pendingBuffer);
          streamArtifacts.push(...artifacts);
          ingestCaptureFieldArtifacts(artifacts);
          committedVisible += visibleText;
          pendingBuffer = remaining;
          const display = committedVisible.trimEnd();
          const agentAnswer = buildVisibleAnswer(display);
          setAvaThread((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: display, agentAnswer } : m,
            ),
          );
        }

        if (pendingBuffer.length > 0) {
          const final = extractArtifacts(pendingBuffer);
          streamArtifacts.push(...final.artifacts);
          ingestCaptureFieldArtifacts(final.artifacts);
          committedVisible += final.visibleText;
        }

        const finalText = committedVisible.trimEnd();
        const agentAnswer = buildVisibleAnswer(finalText);
        setAvaThread((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, text: finalText, agentAnswer } : m,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error && err.name === "AbortError"
            ? "This is taking longer than expected. Try again in a moment."
            : "Something went wrong reaching aVa. Try again in a moment.";
        setAvaThread((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: message } : m)),
        );
      } finally {
        clearTimeout(hangTimer);
        setAvaStreaming(false);
      }
    },
    [
      avaStreaming,
      displayMoveName,
      move,
      phase,
      phaseCaptureSections,
      phaseCaptureValues,
      phaseTallies,
      phaseNum,
      finderReadinessPack,
    ],
  );

  function openFilesWorkspace() {
    setWorkspaceView("files");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueToCurrentPhase() {
    if (terminalComplete || (move.currentPhase ?? 0) > 5) {
      window.location.assign("/tower");
      return;
    }
    window.location.assign(
      `/strategic-moves/${move.id}/phase/${nextOpenPhase}`,
    );
  }

  async function finalizePhaseCapture() {
    setGateApproved(false);
    setGateApprovalStatus("approving");
    setGateApprovalMessage(
      "Finalizing phase capture before starting the governed build...",
    );
    const finalizeBody: Record<string, unknown> = {
      phase: phase.phase,
      complete: true,
      sections: persistedPhaseCaptureValues,
      // Fence the write against the revision this page loaded. If the server
      // has moved on, it rejects with 409 rather than applying a stale payload
      // over newer data. The server also performs the no-op diff, so a finalize
      // with no edits writes nothing at all.
      ...(phaseCaptureRevision
        ? { expectedRevision: phaseCaptureRevision }
        : {}),
    };
    const finalizeRes = await fetch(
      `/api/v1/programs/${move.id}/phase-capture`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalizeBody),
      },
    );
    const finalize = (await finalizeRes.json().catch(() => ({}))) as {
      ok?: boolean;
      missing?: string[];
      error?: string;
      detail?: string;
    };
    if (!finalizeRes.ok || !finalize.ok) {
      setGateApprovalStatus("blocked");
      throw new Error(
        finalize.missing?.length
          ? `Capture incomplete - still missing: ${finalize.missing.join(", ")}`
          : finalize.detail ||
              finalize.error ||
              `Finalize failed (HTTP ${finalizeRes.status})`,
      );
    }

    if (phase.phase === 3) {
      if (!selectedP3Option) {
        setGateApprovalStatus("blocked");
        throw new Error(
          "Select a solution option before building the P3 architecture package.",
        );
      }
      setGateApprovalMessage(
        "Recording the approved solution option before architecture assembly...",
      );
      let optionApprovalRes: Response;
      try {
        optionApprovalRes = await fetchWithTimeout(
          `/api/v1/programs/${move.id}/solution-options/approve`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chosenOption: selectedP3Option.label,
              approach: `${selectedP3Option.label}. ${selectedP3Option.summary}`,
              rationale:
                String(
                  persistedPhaseCaptureValues.recommendation ?? "",
                ).trim() ||
                `${selectedP3Option.recommendationLabel}. ${selectedP3Option.evidenceBasis.join(" ")}`,
              tradeoffsAccepted: [
                // A client-supplied option carries no effort or time-to-value
                // estimate of ours; record what the client stated instead.
                ...(selectedP3Option.clientSupplied
                  ? [
                      selectedP3Option.clientSupplied.condition
                        ? `Condition: ${selectedP3Option.clientSupplied.condition}`
                        : "",
                      selectedP3Option.clientSupplied.scope
                        ? `Scope: ${selectedP3Option.clientSupplied.scope}`
                        : "",
                    ].filter(Boolean)
                  : [
                      `Effort: ${selectedP3Option.effort}`,
                      `Time to value: ${selectedP3Option.timeToValue}`,
                    ]),
                ...selectedP3Option.risks.map(
                  (risk) => `Risk accepted for design: ${risk}`,
                ),
              ],
              options: p3OptionSet.options.map((option) => ({
                id: option.id,
                name: option.label,
                summary: option.summary,
                // Template scores are not an assessment of a client option.
                ...(option.clientSupplied ? {} : { scores: option.scores }),
                recommended: option.recommended,
              })),
            }),
          },
          P3_OPTION_APPROVAL_TIMEOUT_MS,
          "Solution option approval did not finish within 45 seconds. The build was not enqueued; refresh the phase and retry once the approval service is responsive.",
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Solution option approval failed before the build could start.";
        setGateApprovalStatus("blocked");
        setGateApprovalMessage(message);
        throw new Error(message);
      }
      const optionApproval = (await optionApprovalRes
        .json()
        .catch(() => ({}))) as {
        ok?: boolean;
        detail?: string;
        error?: string;
      };
      if (!optionApprovalRes.ok || !optionApproval.ok) {
        setGateApprovalStatus("blocked");
        throw new Error(
          optionApproval.detail ||
            optionApproval.error ||
            `Solution option approval failed (HTTP ${optionApprovalRes.status})`,
        );
      }
    }
  }

  async function approvePhaseGateAfterBuild(result: BuildSettledResult) {
    // This only ever runs once every queued deliverable in the batch has
    // reached a terminal status (see PhaseApproveAndBuild's onBuildSettled) —
    // never while generation is still queued or running.
    //
    // A failure refuses the submission only when the document that failed is
    // one a phase gate check actually reads. A working document beside it
    // (`gateArtifact: false`) is named rather than blocking, because no gate
    // check reads it and refusing here used to dead-end the phase on a document
    // the gate never asked for. `classifyPhaseBuildSettlement` owns that split.
    const settlement = classifyPhaseBuildSettlement({
      phase: phase.phase,
      succeeded: result.succeeded,
      failed: result.failed,
    });
    if (settlement.refusal) {
      setGateApprovalStatus("blocked");
      throw new Error(settlement.refusal);
    }
    setGateApprovalStatus("approving");
    // A re-submission of documents already on the record did not just build
    // them, and saying it did would misreport what the reader authorized.
    const builtSentence =
      result.source === "existing_documents"
        ? `${result.succeededKeys.length} required output${result.succeededKeys.length === 1 ? "" : "s"} already on the record. `
        : `${result.succeededKeys.length} required output${result.succeededKeys.length === 1 ? "" : "s"} built. `;
    setGateApprovalMessage(
      builtSentence +
        (settlement.workingDocumentCaveat
          ? `${settlement.workingDocumentCaveat} Submitting gate approval...`
          : "Submitting gate approval..."),
    );

    const approvalRes = await fetch(
      `/api/v1/programs/${move.id}/phase-gate-approval`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: phase.phase,
          rationale:
            (result.humanRationale?.trim() ||
              `P${phase.phase} reviewed, required phase outputs reached terminal build status, and gate approval submitted through the standalone Moves workspace.`) +
            (settlement.workingDocumentCaveat
              ? ` ${settlement.workingDocumentCaveat}`
              : ""),
        }),
      },
    );
    const approval = (await approvalRes.json().catch(() => ({}))) as {
      ok?: boolean;
      missing?: string[];
      blockedBy?: string[];
      alreadyApproved?: boolean;
      newPhase?: number | null;
      gate?: {
        failedChecks?: Array<{
          severity: string;
          reason?: string;
          check: string;
        }>;
      };
      detail?: string;
      error?: string;
      requiredEvidenceGaps?: unknown;
      // The route classifies three transition-evidence refusals and says per
      // cause whether submitting again can answer them. `false` means it
      // cannot, so the standing remedy below must not be offered.
      resubmitCanSatisfy?: boolean;
    };
    if (!approvalRes.ok || !approval.ok) {
      // An unanticipated failure in the route is not a gate refusal, and the
      // framing below would report it as one. Answer it on its own terms: no
      // "the phase gate is blocked" wrapper, and none of the document remedy,
      // which cannot clear a failure that never reached the gate.
      const unexpected = readUnexpectedWalkStepFailure(
        approvalRes.status,
        approval,
      );
      if (unexpected) {
        setGateApprovalStatus("blocked");
        setGateApprovalMessage(unexpected);
        throw new Error(unexpected);
      }
      const hard = approval.gate?.failedChecks
        ?.filter((check) => check.severity === "hard")
        .map((check) => check.reason || check.check)
        .join("; ");
      // `transition_evidence_incomplete` carries no `gate` and no `missing`, so
      // it used to land on `detail`, which states the category of what is open
      // and never which slot. The payload names them; read it above `detail`.
      const namedEvidenceSlots = describeRequiredEvidenceRefusal(approval);
      const blockedMessage =
        hard ||
        (approval.missing?.length
          ? `P${phase.phase} capture is incomplete - missing: ${approval.missing.join(", ")}`
          : "") ||
        namedEvidenceSlots ||
        approval.detail ||
        approval.error ||
        `Gate approval failed (HTTP ${approvalRes.status})`;
      setGateApprovalStatus("blocked");
      // Do NOT send the reader back to Approve & Build here. Two HARD gate
      // checks read a sign-off recorded after the build, and re-running the
      // build regenerates the document as a fresh unapproved draft — which
      // clears the very sign-off the gate is waiting for. The no-rebuild
      // submission is the control that can actually close this.
      // Offered only where a re-submission can actually answer the refusal.
      // The route rules one out for `gap_assessment_failed` (422) and says so
      // in its own `detail`; appending this there contradicted the sentence
      // directly above it and sent the reader round a loop that cannot close.
      const resubmissionRemedy = gateRefusalAllowsResubmission(approval)
        ? ` Review the open gate item, then approve the draft or upload an edited version in the gate step's sign-off ledger above and use "Submit ${phase.code} ${phase.title} gate approval" — re-running Approve & Build would replace the document you just approved with a new unapproved draft.`
        : "";
      setGateApprovalMessage(
        `${result.source === "existing_documents" ? "Submitted" : "Build completed"}, but the phase gate is blocked: ${blockedMessage}.${resubmissionRemedy}`,
      );
      throw new Error(blockedMessage);
    }

    setGateApproved(true);
    setGateApprovalStatus("approved");
    setGateApprovalMessage(
      approval.newPhase != null || approval.alreadyApproved
        ? approval.newPhase != null && approval.newPhase > 5
          ? "Gate approved. Opening Tower..."
          : `Gate approved. Opening P${approval.newPhase ?? phase.phase + 1}...`
        : "Gate approved. The run status below is now the source of truth for which documents built, failed, or were held below gate.",
    );
    const nextPhase =
      typeof approval.newPhase === "number"
        ? approval.newPhase
        : approval.alreadyApproved
          ? phase.phase + 1
          : null;
    if (nextPhase !== null) {
      window.setTimeout(() => {
        window.location.assign(
          nextPhase > 5
            ? "/tower"
            : `/strategic-moves/${move.id}/phase/${nextPhase}`,
        );
      }, 250);
    }
  }

  async function approveP0Gate() {
    try {
      setGateApproved(false);
      setGateApprovalStatus("approving");
      setGateApprovalMessage("Submitting P0 gate approval...");
      // P0 has no deliverable build: its gate evidence IS the origination
      // brief, so it settles as one succeeded gate artifact.
      await approvePhaseGateAfterBuild({
        succeededKeys: ["origination_brief"],
        failedKeys: [],
        total: 1,
        succeeded: [
          { deliverableTypeKey: "origination_brief", gateArtifact: true },
        ],
        failed: [],
      });
    } catch (err) {
      setGateApproved(false);
      setGateApprovalStatus("blocked");
      setGateApprovalMessage(
        err instanceof Error ? err.message : "Gate approval failed.",
      );
    }
  }

  // ─── moves_capture_v2 (flag, default OFF): the redesigned 3-step capture ───
  // Reuses the canonical sections/keys, saves, and the existing structured
  // editors; only the presentation (3 steps + hand-off) differs. No input
  // logic is reimplemented here — the structured forms are rendered via the
  // slot below so they keep working unchanged.
  const captureSectionInput = (section: PhaseCaptureSection): ReactNode => {
    const value = displayPhaseCaptureValues[section.key] ?? "";
    // Under `moves_step_pages_v3` P2's root causes are ranked on their own
    // step page; the capture shows what is there and opens it.
    if (
      stepPagesV3Enabled &&
      phase.phase === 2 &&
      section.key === "gaps_root_causes"
    ) {
      return (
        <div className="mcf-root-causes-entry">
          {value.trim() ? (
            <pre style={{ whiteSpace: "pre-wrap", font: "inherit", margin: "0 0 12px" }}>
              {rootCauseCaptureText(value)}
            </pre>
          ) : null}
          <a
            className="mcf-btn-primary"
            style={{ display: "inline-block", textDecoration: "none" }}
            data-testid="open-root-causes"
            href={`/strategic-moves/${move.id}/phase/2?step=root-causes`}
          >
            Rank the root causes →
          </a>
        </div>
      );
    }
    // P3's build blocker asks for the solution option architecture should
    // implement. The legacy canvas offers that choice as option cards; the
    // redesigned flow rendered none, so the blocker named a control that was
    // not on the page and a fully answered P3 could not be approved. The
    // chooser belongs with "the one you'd back" — the recommendation question —
    // and reports through the SAME `selectP3Option` the cards use.
    const routeChoice =
      phase.phase === 3 && section.key === "recommendation" ? (
        <SolutionOptionChooser
          options={p3OptionSet.options}
          selectedOptionId={effectiveSelectedOption}
          onSelect={selectP3Option}
        />
      ) : null;
    const input =
      section.structured === "facts" ? (
        <DiagnosisFactsEditor
          label={section.label}
          value={value}
          onChange={(v) => setVisiblePhaseCaptureValue(section.key, v)}
        />
      ) : section.structured === "business-change" ? (
        <BusinessChangeAssessmentForm
          value={value}
          onChange={(v) => setVisiblePhaseCaptureValue(section.key, v)}
        />
      ) : section.structured === "solution-route" ? (
        <SolutionRouteValidationForm
          assessment={businessChangeAssessment}
          approvedEvidenceReferences={initialApprovedEvidenceReferences}
          reviewerIdentity={currentUser?.email ?? "signed-in reviewer"}
          value={value}
          onChange={(v) => setVisiblePhaseCaptureValue(section.key, v)}
        />
      ) : section.structured === "estimate-model" ? (
        <EstimateModelEditor
          value={value}
          onChange={(v) => setVisiblePhaseCaptureValue(section.key, v)}
        />
      ) : (
        <textarea
          aria-label={section.label}
          className="mcf-input"
          placeholder={section.example ?? "Write your answer here."}
          rows={4}
          value={value}
          onChange={(event) =>
            setVisiblePhaseCaptureValue(section.key, event.target.value)
          }
        />
      );

    // aVa's governed draft for this field, surfaced for review (design's
    // "Filled by aVa · review"). Propose → human inserts/dismisses; nothing
    // is written until the person acts.
    const proposal = avaDraftProposalsByKey.get(section.key);
    if (!proposal) {
      return routeChoice ? (
        <>
          {routeChoice}
          {input}
        </>
      ) : (
        input
      );
    }
    return (
      <>
        {routeChoice}
        <div className="mcf-ava-draft" data-testid={`ava-draft-${section.key}`}>
          <div className="mcf-ava-draft-head">
            <span className="mcf-ava-badge">aVa draft · review</span>
            <span className="mcf-ava-conf">
              {proposal.confidence} confidence
            </span>
          </div>
          <blockquote className="mcf-ava-proposed">
            {proposal.proposedValue}
          </blockquote>
          {proposal.rationale ? (
            <p className="mcf-ava-rationale">{proposal.rationale}</p>
          ) : null}
          <div className="mcf-ava-draft-actions">
            <button
              type="button"
              className="mcf-ava-insert"
              onClick={() => applyAvaDraftProposal(proposal)}
            >
              Insert as draft
            </button>
            <button
              type="button"
              className="mcf-ava-dismiss"
              onClick={() => dismissAvaDraftProposal(section.key)}
            >
              Dismiss
            </button>
          </div>
        </div>
        {input}
      </>
    );
  };

  const saveCharterBasis = useCallback(
    async (sectionKey: string, next: CharterBasisValue | null) => {
      // An assumption is only a recordable basis once it names an owner AND how
      // Discover validates it. Until both are typed we keep the choice in local
      // state (so the inputs stay usable) and send nothing — the server would
      // 422 a half-filled assumption, and a save-per-keystroke would thrash.
      if (
        next?.kind === "assumption" &&
        (!next.owner.trim() || !next.p2ValidationPlan.trim())
      ) {
        setCharterBasisSavePendingBySection((prev) => ({
          ...prev,
          [sectionKey]: false,
        }));
        return;
      }
      setCharterBasisSavePendingBySection((prev) => ({
        ...prev,
        [sectionKey]: true,
      }));
      try {
        const res = await fetch(`/api/v1/programs/${move.id}/phase-capture`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: phase.phase,
            sections: {
              [sectionKey]: persistedPhaseCaptureValues[sectionKey] ?? "",
            },
            p1BasisBySection: { [sectionKey]: next },
            ...(phaseCaptureRevision
              ? { expectedRevision: phaseCaptureRevision }
              : {}),
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          revision?: string;
          detail?: string;
          error?: string;
          p1BasisBySection?: Record<string, CharterBasisValue>;
        };
        if (!res.ok || !body.ok) {
          throw new Error(
            body.detail ||
              body.error ||
              `Basis save failed (HTTP ${res.status})`,
          );
        }
        if (body.revision) setPhaseCaptureRevision(body.revision);
        if (body.p1BasisBySection) {
          setCharterBasisBySection({ ...body.p1BasisBySection });
        }
        setCharterBasisSaveError((prev) => {
          if (!(sectionKey in prev)) return prev;
          const rest = { ...prev };
          delete rest[sectionKey];
          return rest;
        });
      } catch (error) {
        setCharterBasisSaveError((prev) => ({
          ...prev,
          [sectionKey]:
            error instanceof Error
              ? error.message
              : "Could not record how you know this. Try again.",
        }));
      } finally {
        setCharterBasisSavePendingBySection((prev) => ({
          ...prev,
          [sectionKey]: false,
        }));
      }
    },
    [move.id, phase.phase, persistedPhaseCaptureValues, phaseCaptureRevision],
  );

  const captureSectionBasis = (section: PhaseCaptureSection): ReactNode => {
    if (!charterBasisSurfaceForSection(section.key, charterBasisSectionKeys))
      return null;
    const approvedSources = initialApprovedP1CaptureEvidenceReferences
      .filter((reference) => reference.familyKey === section.evidenceFamily)
      .map((reference) => ({
        evidenceId: reference.evidenceId,
        label: reference.title,
      }));
    return (
      <CharterBasisField
        sectionKey={section.key}
        value={charterBasisBySection[section.key] ?? null}
        approvedSources={approvedSources}
        emptyValue={!(displayPhaseCaptureValues[section.key] ?? "").trim()}
        saveError={charterBasisSaveError[section.key] ?? null}
        // Why the basis is tied to the answer as SAVED, and — once the answer
        // has been edited away from it — that saving will clear it. The route
        // already behaves this way for both an edit and a notes insert (which
        // stamps a basis before the answer is saved); this is the field
        // finally saying so.
        editNotice={charterBasisEditNotice({
          sectionKey: section.key,
          basisSurfaceActive: charterBasisActive,
          charterBasisSectionKeys,
          recordedBasis: charterBasisBySection[section.key] ?? null,
          persistedAnswer: persistedPhaseCaptureValues[section.key] ?? "",
          visibleAnswer: displayPhaseCaptureValues[section.key] ?? "",
        })}
        onChange={(next) => {
          setCharterBasisBySection((prev) => {
            if (!next) {
              const rest = { ...prev };
              delete rest[section.key];
              return rest;
            }
            return { ...prev, [section.key]: next };
          });
          void saveCharterBasis(section.key, next);
        }}
      />
    );
  };

  const captureSectionBadge = (section: PhaseCaptureSection): ReactNode => {
    if (!charterBasisSurfaceForSection(section.key, charterBasisSectionKeys))
      return null;
    return isCharterAssumption(charterBasisBySection[section.key]) ? (
      <CharterAssumptionBadge />
    ) : null;
  };

  // The recap marks EVERY declared basis, not just the amber case: in the
  // hand-off read-back an unmarked row is indistinguishable from a backed one,
  // which is the failure the basis control exists to prevent.
  const captureSectionRecapMark = (section: PhaseCaptureSection): ReactNode => {
    if (!charterBasisSurfaceForSection(section.key, charterBasisSectionKeys))
      return null;
    return <CharterBasisMark value={charterBasisBySection[section.key]} />;
  };

  // ─── the link: an insert from notes records its own basis ───
  // Reachable only when BOTH `moves_capture_notes_v1` (which renders the panel
  // at all) and `moves_charter_basis_v1` (which makes the basis declarable) are
  // on for the tenant, so with either off this is byte-for-byte today's insert.
  //
  // The answer itself still follows the ordinary typed-answer path — insert
  // fills the field and the person saves it. Only the basis is written here,
  // because where the text came from is known at insert time and is not
  // recoverable from the text afterwards.
  const notesBasisRecordingKeys = useMemo(
    () =>
      notesInsertBasisRecordingKeys({
        basisSurfaceActive: charterBasisActive,
        charterBasisSectionKeys,
        basisBySection: charterBasisBySection,
      }),
    [charterBasisActive, charterBasisSectionKeys, charterBasisBySection],
  );

  const insertPhaseCaptureValueFromNotes = useCallback(
    (sectionKey: string, value: string) => {
      setVisiblePhaseCaptureValue(sectionKey, value);
      const decision = basisForNotesInsert({
        sectionKey,
        basisSurfaceActive: charterBasisActive,
        charterBasisSectionKeys,
        existingBasis: charterBasisBySection[sectionKey] ?? null,
      });
      if (!decision.basis) return;
      const basis = decision.basis;
      setCharterBasisBySection((prev) => ({ ...prev, [sectionKey]: basis }));
      void saveCharterBasis(sectionKey, basis);
    },
    [
      setVisiblePhaseCaptureValue,
      charterBasisActive,
      charterBasisSectionKeys,
      charterBasisBySection,
      saveCharterBasis,
    ],
  );

  const isCaptureSectionComplete = (sectionKey: string): boolean => {
    const section = phaseCaptureSections.find((s) => s.key === sectionKey);
    if (!section) return false;
    return phaseCaptureStatusForSection(
      section,
      displayPhaseCaptureValues,
      persistedPhaseCaptureValues,
      phaseCaptureSaveStatus,
      businessChangeAssessment,
      initialApprovedEvidenceReferences.map((r) => r.evidenceId),
      phaseEvidencePassed,
      phaseEvidenceCheckAvailable,
      initialApprovedP1CaptureEvidenceReferences,
      captureBasisForSection(sectionKey),
    ).complete;
  };

  // The charter-level rollup on the hand-off screen. Counts only — the gate
  // (`src/lib/programs/p1-charter-evidence.ts`) reads the persisted basis and
  // is unaffected by anything here. Empty set (flag off, or any phase but P1)
  // ⇒ null, and the hand-off reads exactly as it does without it.
  // One computation, two surfaces. The hand-off rollup and the gate dialog's
  // disclosure have to agree — two independent folds of the same bases would be
  // free to drift, and a gate that disagreed with the read-back the author just
  // saw is worse than a gate that says nothing.
  const charterBasisRollupRows = charterBasisRollupSections({
    sections: phaseCaptureSections,
    sectionKeys: charterBasisSectionKeys,
  });

  const charterBasisSummary =
    charterBasisRollupRows === null
      ? null
      : summarizeCharterBasis(
          charterBasisRollupRows,
          charterBasisBySection,
          isCaptureSectionComplete,
        );

  const charterBasisRollup: ReactNode =
    charterBasisSummary === null ? null : (
      <CharterBasisRollup summary={charterBasisSummary} />
    );

  // The gate is the consequential surface: the rollup informs the author, this
  // informs the approver inside the confirm dialog. `charterBasisActive` is
  // already the resolved conjunction of the `moves_charter_basis_v1` flag and
  // P1, so with the flag off this is null and the dialog is untouched.
  const charterGateDisclosure: ReactNode = (
    <CharterGateAssumptionNotice
      disclosure={charterGateAssumptionDisclosure({
        active: charterBasisActive,
        counts: charterBasisSummary,
      })}
    />
  );

  // Every row states its own phase's total, and P3's question set depends on
  // the Move's confirmed solution route — so the total has to be derived with
  // the route, exactly as the capture surface derives its own sections. Omitting
  // it reported the default set's size for a Move whose P3 asks a narrower or a
  // wider set, which both misstates a completed phase and lets the viewed row's
  // answered count sit above or permanently below its total.
  //
  // The answered count is a second, independent attribution:
  // `phaseCaptureCompleteCount` counts the sections of the phase ON SCREEN, so
  // it belongs to `phase.phase` and not to `currentPhase`. The two differ
  // whenever you open a phase other than the one the Move sits on, and the row
  // then showed a count borrowed from a different phase's question set — which
  // could exceed its own total. `capturePhaseProgress` owns the "N";
  // `capturePhaseSectionTotal` owns the "M".
  const capturePhases: MovesCaptureFlowPhase[] = capturePhaseProgress(
    PHASES.map((p) => ({
      phase: p.phase,
      code: p.code,
      name: p.navLabel,
      total: capturePhaseSectionTotal(p.phase, confirmedSolutionRoute),
      reachable: p.phase <= currentPhase,
    })),
    {
      viewedPhase: phase.phase,
      currentPhase,
      viewedAnsweredCount: phaseCaptureCompleteCount,
      // Already route-aware and already loaded; the route passes it only when
      // `moves_capture_phase_rollup_v1` is on, so an absent value is the
      // pre-flag behaviour rather than a missing read.
      savedAnswerCountByPhase: capturePhaseSavedAnswerCounts,
    },
  );

  const nextCapturePhase = phase.phase < 5 ? PHASES[phase.phase + 1] : null;

  // Gate vs. capture: a phase the Move has already advanced past (`state:
  // done`) can show a met gate and an unfinished capture strip at the same
  // time — a gate is met from existing or migrated origination data (or
  // approved evidence), not necessarily from working the guided capture
  // questions here. Surface that so the empty strip does not read as a
  // contradiction. Informational only; it changes no gate, save, or Continue.
  const viewedGateTally = phaseTallies.find((row) => row.phase === phase.phase);
  const viewedCaptureRow = capturePhases.find((p) => p.phase === phase.phase);
  const gateMetWithCaptureUnfinished = isGateMetWithCaptureUnfinished(
    viewedGateTally,
    viewedCaptureRow,
  );

  // P0 Originate renders the redesigned capture flow only when BOTH flags are
  // on: the flow itself (`moves_capture_v2`) and the P0 extension
  // (`moves_capture_p0_v1`). Either off ⇒ P0 keeps the legacy canvas exactly.
  const captureP0Active =
    captureV2Enabled && captureP0Enabled && phase.phase === 0;

  // Whether the redesigned 3-step capture — rather than the legacy
  // contract-steps canvas — is what this phase renders. Named once because the
  // composition polish has to agree with the mount: a polish that assumed the
  // flow was present on a phase where it is not would, for instance, move the
  // surface tabs into a dock that never renders and lose them. Reading the one
  // constant is also why the polish follows P0 for free now that P0 mounts.
  const captureFlowMounted =
    (captureV2Enabled && phase.phase >= 1 && phase.phase <= 5) ||
    captureP0Active;

  // `moves_capture_composition_v1` (flag, default OFF, already conjoined with
  // moves_capture_v2 server-side). Composition only: where the surface tabs sit
  // and what the stage head stops repeating. It applies only on the phase view
  // and only where the redesigned capture is what renders — the other surface
  // views keep their own heads and their tab row exactly as they are.
  // `moves_workspace_v2` (flag, default OFF, already conjoined with
  // moves_capture_v2 server-side). Increment 1 of the phase-workspace redesign.
  // It only reshapes the redesigned capture flow, so like the composition
  // polish it applies only where that flow is what renders.
  const workspaceV2Active = workspaceV2Enabled && captureFlowMounted;

  // The v2 shell subsumes the composition polish — one slim rail means the
  // legacy gate stepper and the repeated stage head come off the phase view —
  // so turning on `moves_workspace_v2` implies the composition behaviour
  // without the operator also having to enable `moves_capture_composition_v1`.
  const captureCompositionActive =
    (captureCompositionEnabled && captureFlowMounted) || workspaceV2Active;

  // The accepted stage-readiness workbook review is a HARD precondition for
  // closing P1 through P4 — the gate refuses `transition_evidence_incomplete`
  // and the build refuses `required_evidence_open` without it — and the control
  // below is its only producer. Which screens offer it is therefore a governed
  // decision, not a layout preference; `shouldOfferStageReadinessWorkbook` owns
  // it so the legacy canvas's substep rule and the redesigned flow's cannot
  // drift apart. Under the 3-step flow nothing moves `substepIndex`, so a
  // substep-keyed rule would hide it for the whole phase.
  const offerReadinessWorkbook = shouldOfferStageReadinessWorkbook({
    phase: phase.phase,
    substepKey: substep.key,
    captureFlowMounted,
    hasWorkbookTransition: readinessWorkbookHref !== null,
  });

  const surfaceTabRow: ReactNode = (
    <WorkspaceSurfaceTabs
      activeView={workspaceView}
      onSelect={setWorkspaceView}
      tabs={workspaceTabs}
      // v2 makes the slim phase rail the primary navigator, so the
      // workspace-view row drops out of the primary phase-flow chrome to a
      // quieter secondary control. The views themselves stay reachable.
      variant={workspaceV2Active ? "secondary" : "default"}
    />
  );

  // The readiness-workbook download / upload / preview actions. Built once so
  // they sit in exactly one place: on the legacy/composition path they stay on
  // the stage head; under `moves_workspace_v2` they move off that per-step head
  // (where they read as "across all steps") onto the capture flow's GATE step,
  // beside the governed approve control — one consistent location per phase.
  const readinessWorkbookActions: ReactNode =
    readinessWorkbookHref && offerReadinessWorkbook ? (
      <div className="mxw-stage-actions">
        <a className="mxw-stage-download" download href={readinessWorkbookHref}>
          Download P{phase.phase + 1} readiness workbook
        </a>
        {syntheticEvidencePackHref ? (
          <a
            className="mxw-stage-download"
            download
            href={syntheticEvidencePackHref}
          >
            Download sample upload files
          </a>
        ) : null}
        <div ref={workbookReviewRef}>
          <StageReadinessWorkbookPreviewControl
            key={
              phaseScopedStageReadinessPreview?.proposalSet
                ? `${phaseScopedStageReadinessPreview.proposalSet.artifactId ?? ""}:${phaseScopedStageReadinessPreview.proposalSet.artifactVersion ?? ""}:${phaseScopedStageReadinessPreview.proposalSet.review?.status ?? "unreviewed"}:${phaseScopedStageReadinessPreview.proposalSet.review?.pendingCount ?? ""}`
                : "no-stored-proposal-set"
            }
            apiPath={readinessWorkbookHref}
            initialPreview={phaseScopedStageReadinessPreview}
            onReviewSaved={() => router.refresh()}
          />
        </div>
      </div>
    ) : null;

  // The governed submit control for the capture flow's final step: the SAME
  // PhaseApproveAndBuild the canvas uses, so generation + the gate run through
  // the existing pipeline (rendered inline — no portal target in this flow).
  //
  // P0 is the exception: it has no deliverable build: its gate is approval of
  // the origination brief. So the P0 arm renders P0's own gate control, using
  // the SAME authorization check (`canApproveGates`) and the SAME required-
  // evidence gate (`topLevelRequiredEvidenceGaps`, identical to the legacy
  // canvas's `openRequiredEvidence`) and the same `approveP0Gate` action. P0
  // still cannot advance on intake answers alone.
  const captureApproveSlot: ReactNode = captureP0Active ? (
    !canApproveGates ? (
      <span className="mcf-gate-note">
        Approval is available to an authorized workspace user.
      </span>
    ) : topLevelRequiredEvidenceGaps.length > 0 ? (
      <span className="mcf-gate-note">
        P0 cannot advance on these answers alone. Upload one source file for
        this Move in Files &amp; Evidence and review its extracted content, then
        return here to approve.
      </span>
    ) : (
      <>
        <button
          className="mxw-gate-button"
          disabled={gateApprovalStatus === "approving"}
          onClick={() => setCaptureP0ConfirmOpen(true)}
          type="button"
        >
          {gateApprovalStatus === "approving"
            ? "Approving..."
            : "Approve gate →"}
        </button>
        <GateApprovalConfirmDialog
          open={captureP0ConfirmOpen}
          title="Approve the P0 gate?"
          summary="This records your approval of the origination brief and unlocks P1 Charter. Your signed-in account must have Move approval permission. At least one uploaded P0 source file must already have a human-approved extraction."
          approverLabel={approverLabel}
          confirmLabel="Approve gate"
          onCancel={() => setCaptureP0ConfirmOpen(false)}
          onConfirm={() => {
            setCaptureP0ConfirmOpen(false);
            void approveP0Gate();
          }}
        />
      </>
    )
  ) : stepPagesV3Enabled && captureV2Enabled && phase.phase === 3 ? (
    // Gate readiness is its own step page under `moves_step_pages_v3`: build,
    // sign-off and approve-and-submit all happen there, once.
    <a
      className="mcf-btn-primary"
      style={{ display: "inline-block", textDecoration: "none" }}
      data-testid="open-gate-readiness"
      href={`/strategic-moves/${move.id}/phase/${phase.phase}?step=gate`}
    >
      Open Gate readiness →
    </a>
  ) : phase.phase >= 1 && phase.phase <= 5 ? (
    canApproveGates ? (
      <>
        {/* P3's build blocker is "select the solution option ..." and it is
            stated right here, on the final step. The chooser is rendered
            beside it so the stated blocker is actionable without navigating
            back to the recommendation question. Only one step renders at a
            time, so this and the step-1 copy are never both on screen; they
            share the radio-group name and read the same standing choice. */}
        {phase.phase === 3 ? (
          <SolutionOptionChooser
            options={p3OptionSet.options}
            selectedOptionId={effectiveSelectedOption}
            onSelect={selectP3Option}
          />
        ) : null}
        <PhaseApproveAndBuild
          archetype={move.archetype}
          approverLabel={approverLabel}
          canApproveGates={canApproveGates}
          clientDisplayName={move.tenant.name}
          disabledReason={phaseCaptureBlocker}
          deliverableKeys={phaseCanonicalKeysForRoute(
            phase.phase,
            confirmedSolutionRoute,
          )}
          evidenceNeedPackets={evidenceNeedPackets}
          inputCount={phaseCaptureCompleteCount}
          initialArtifacts={visiblePhaseBuildArtifacts}
          signOffReadback={signOffReadback}
          moveId={move.id}
          moveName={displayMoveName}
          onBeforeBuild={finalizePhaseCapture}
          onBuildSettled={approvePhaseGateAfterBuild}
          blockOnEvidenceGaps
          phaseLabel={`${phase.code} ${phase.title}`}
          phaseNum={phase.phase}
        />
      </>
    ) : (
      <span className="mcf-gate-note">
        Approval is available to an authorized workspace user.
      </span>
    )
  ) : null;

  // aVa's one dock mount for every Steps view. The capture flow and the step
  // pages hand it their content; the streaming flag, thread and send handler
  // are wired here once, so no view can mount aVa without them.
  const renderAvaDock = (dock: {
    captureProps?: MovesCaptureFlowProps;
    content?: ReactNode;
    notesFill?: ReactNode;
    openingBriefing?: string;
    leadingActions?: readonly SuggestedAction[];
  }) => (
    <MovesCaptureWorkspace
      moveId={move.id}
      moveName={displayMoveName}
      phase={phase.phase}
      avaRole={phase.avaRole}
      avaThread={avaThread}
      avaQuestions={visibleAvaQuestions}
      avaStreaming={avaStreaming}
      notesFill={dock.notesFill}
      avaLeadingActions={[
        ...(dock.leadingActions ?? []),
        ...avaDraftLeadingActions,
      ]}
      onAvaMessage={(text) => {
        void sendAvaMessage(text);
      }}
      openingBriefing={dock.openingBriefing}
      content={dock.content}
      captureProps={dock.captureProps}
    />
  );

  if (rootCauseStepPageActive) {
    const workflow = resolvePhaseWorkflow(phase.phase, confirmedSolutionRoute);
    const stepIndex = Math.max(
      0,
      workflow.findIndex((step) => step.id === "P2.3"),
    );
    const phaseHref = (n: number) => `/strategic-moves/${move.id}/phase/${n}`;
    return (
      <RootCausesStep
        moveId={move.id}
        // The same authority the Files library uses to approve an extraction.
        canReviewEvidence={canApproveGates}
        // An approved upload is new approved evidence; re-read the page so the
        // cause form can cite it.
        onEvidenceChanged={() => window.location.reload()}
        moveName={displayMoveName}
        tabs={
          <StepPageTabs
            current="steps"
            hrefs={{
              steps: `${phaseHref(phase.phase)}?step=root-causes`,
              files: phaseHref(phase.phase),
              record: phaseHref(phase.phase),
            }}
          />
        }
        phases={PHASES.map((p) => {
          const tally = phaseTallies.find((t) => t.phase === p.phase);
          return {
            code: p.code,
            name: PHASE_LABELS_SHORT[p.phase] ?? p.navLabel,
            status: tally?.state === "done" ? "Done" : "Not started",
            current: p.phase === phase.phase,
            href:
              tally && tally.state !== "upcoming" ? phaseHref(p.phase) : undefined,
          };
        })}
        steps={workflow.map((step, index) => ({
          title: step.title,
          depth: step.depth,
          href: index === stepIndex ? undefined : phaseHref(phase.phase),
          // Ticked only when every capture key the step owns is answered.
          done:
            index === stepIndex
              ? undefined
              : step.sectionKeys.length > 0 &&
                step.sectionKeys.every(
                  (key) => (phaseCaptureValues[key] ?? "").trim().length > 0,
                ),
        }))}
        stepIndex={stepIndex}
        value={displayPhaseCaptureValues.gaps_root_causes ?? ""}
        onChange={(value) =>
          setVisiblePhaseCaptureValue("gaps_root_causes", value)
        }
        baselineValue={displayPhaseCaptureValues.baseline_metrics ?? ""}
        approvedEvidence={initialApprovedEvidenceReferences.map((item) => ({
          id: item.evidenceId,
          title: item.title,
        }))}
        decidedBy={currentUser?.email ?? "signed-in reviewer"}
        today={new Date().toISOString().slice(0, 10)}
        onBack={() => window.location.assign(phaseHref(phase.phase))}
        onContinue={() => window.location.assign(phaseHref(phase.phase))}
        frame={(page, dock) =>
          renderAvaDock({
            content: page,
            openingBriefing: dock.briefing,
            notesFill: dock.notesPanel,
            leadingActions: dock.actions.map((action) => ({
              id: action.id,
              label: action.label,
              body: action.label,
              onClick: action.onClick,
            })),
          })
        }
      />
    );
  }

  // `moves_step_pages_v3`: P3 Gate readiness as the finalized step page. The
  // build, sign-off and submission run through the same governed paths as the
  // ledger above; only where and how the consultant acts changes.
  if (gateStepPageActive) {
    const workflow = resolvePhaseWorkflow(phase.phase, confirmedSolutionRoute);
    const routeKeys = phaseCanonicalKeysForRoute(phase.phase, confirmedSolutionRoute);
    const notBuilt = (PHASE_CANONICAL_KEYS[phase.phase] ?? [])
      .filter((key) => !routeKeys.includes(key))
      .map((key) => ({
        title:
          DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key)
            ?.documentTitle ?? key,
        reason:
          "Not built for this Move's change profile, set by the solution route confirmed in P2.",
      }));
    const requiredGaps = currentPhaseRequiredEvidenceGaps(
      evidenceNeedPackets,
      phase.phase,
    );
    const buildHold = resolvePhaseBuildBlock({
      building: false,
      anyRunning: false,
      parentBlockerText: phaseCaptureBlocker,
      requiredEvidenceGapCount: requiredGaps.length,
      phaseLabel: `${phase.code} ${phase.title}`,
    });
    const phaseHref = (n: number) => `/strategic-moves/${move.id}/phase/${n}`;
    const next = PHASES.find((p) => p.phase === phase.phase + 1);
    return (
      <GateReadinessStep
        moveId={move.id}
        moveName={displayMoveName}
        archetype={move.archetype}
        clientDisplayName={move.tenant.name}
        phaseNum={phase.phase}
        phaseCode={phase.code}
        phaseName={PHASE_LABELS_SHORT[phase.phase] ?? phase.navLabel}
        nextPhaseLabel={
          next
            ? `${next.code} ${PHASE_LABELS_SHORT[next.phase] ?? next.navLabel}`
            : "Tower"
        }
        tabs={
          <StepPageTabs
            current="steps"
            hrefs={{
              steps: `${phaseHref(phase.phase)}?step=gate`,
              files: phaseHref(phase.phase),
              record: phaseHref(phase.phase),
            }}
          />
        }
        phases={PHASES.map((p) => {
          const tally = phaseTallies.find((t) => t.phase === p.phase);
          return {
            code: p.code,
            name: PHASE_LABELS_SHORT[p.phase] ?? p.navLabel,
            status: tally?.state === "done" ? "Done" : "Not started",
            current: p.phase === phase.phase,
            href:
              tally && tally.state !== "upcoming" ? phaseHref(p.phase) : undefined,
          };
        })}
        steps={workflow.map((step, index) => ({
          title: step.title,
          depth: step.depth,
          href: index < workflow.length - 1 ? phaseHref(phase.phase) : undefined,
          // Ticked only when every capture key the step owns is answered; a
          // step with no capture key cannot be proven done, so it is not.
          done:
            index === workflow.length - 1
              ? undefined
              : step.sectionKeys.length > 0 &&
                step.sectionKeys.every(
                  (key) => (phaseCaptureValues[key] ?? "").trim().length > 0,
                ),
        }))}
        stepIndex={Math.max(0, workflow.length - 1)}
        criteria={move.gateCriteria}
        routeDocumentKeys={routeKeys}
        notBuilt={notBuilt}
        initialArtifacts={visiblePhaseBuildArtifacts}
        signOffReadable={
          describeGateSignOffReadback(signOffReadback).state === "available"
        }
        canApprove={canApproveGates}
        approverName="a gate approver"
        buildHeldReason={buildHold?.statusLine ?? null}
        depthDetail="Full. The gate step is always Full, whatever the change profile."
        onBeforeBuild={finalizePhaseCapture}
        onSubmit={approvePhaseGateAfterBuild}
        onBack={() => window.location.assign(phaseHref(phase.phase))}
        // aVa is the product's one dock — the same collapse, hide, expand and
        // full-screen behaviour and the same thread as the capture flow.
        frame={(page, briefing) =>
          renderAvaDock({ content: page, openingBriefing: briefing })
        }
      />
    );
  }

  return (
    <main
      className="mxw mxw-finder-on"
      data-testid="moves-phase-standalone"
      data-finder-shell="on"
      data-capture-v2={captureV2Enabled ? "on" : "off"}
      data-capture-p0={captureP0Active ? "on" : "off"}
    >
      <MovesStandaloneStyles />
      <div className="mxw-contextbar" aria-label="Move context">
        <div>
          <span>MOVES</span>
          <strong>
            {demoSafeClientText(move.displayCode || displayMoveName)}
          </strong>
          <em>{supportLine}</em>
        </div>
        <div>
          <span>{workspaceSurfaceLabel}</span>
          <strong>
            Phase {phase.phase + 1} of {PHASES.length} · {phase.title}
          </strong>
        </div>
      </div>
      <MobileMovesRailControls
        currentMoveId={move.id}
        maxReachablePhase={move.currentPhase ?? 0}
        onSelectWorkspaceView={setWorkspaceView}
        viewingPhase={phase.phase}
        workspaceView={workspaceView}
        tabs={workspaceTabs}
      />
      {(() => {
        return (
          <div className="mxw-surface">
            <section
              className="mxw-shell"
              aria-label={`${phase.code} phase workspace`}
            >
              <Link className="mxw-back" href="/strategic-moves">
                ← All Moves
              </Link>
              {/* On the Steps view with the composition polish on, the
                  capture flow renders its OWN phase bar (phase name, tick, and
                  answered count), so this gate-criteria stepper would be a
                  second phase navigator stacked right above it in the older
                  style. Drop it there — the same reason the duplicate stage
                  head is dropped — and keep it on Files / Intelligence /
                  Approvals, where the capture bar does not render and this is
                  the only phase navigator. Gate-criteria status still lives in
                  the Approvals tab (and the CaptureGateMetNotice). */}
              {captureCompositionActive && workspaceView === "phase" ? null : (
                <MovePhaseTopStepper
                  currentPhase={move.currentPhase}
                  moveId={move.id}
                  phaseTallies={phaseTallies}
                  viewingPhase={phase.phase}
                />
              )}
              {/* One tab row, one place: always rendered here in the shell,
                  above the workspace, so its position is identical across the
                  Steps, Files & Evidence, Intelligence and Approvals views.
                  (The composition polish used to move it into the dock
                  workspace on the Steps view only, which shifted and clipped it
                  relative to the other views — see the capture-workspace call,
                  which no longer receives a tab row.) */}
              {surfaceTabRow}
              {workspaceView === "files" ? (
                <>
                  <div className="mxw-crumb">
                    <button
                      onClick={() => setWorkspaceView("phase")}
                      type="button"
                    >
                      {displayMoveName}
                    </button>
                    <span>/</span>
                    Files & Evidence
                  </div>
                  <div className="mxw-stage-head">
                    <div className="mxw-agent-chip">
                      <span />
                      AVA · MOVES
                    </div>
                    <h1>Files & Evidence</h1>
                    <p>
                      Every input template, client-loaded evidence file, and
                      AbarVa-generated deliverable — the real Artifact Vault for
                      this Move, not a preview.
                    </p>
                  </div>
                  <FileCabinetPanel
                    moveId={move.id}
                    phase={phase.phase}
                    canApproveGates={canApproveGates}
                    onEvidenceChanged={refreshPhase}
                    evidenceFamilies={declarableEvidenceFamilies}
                  />
                </>
              ) : workspaceView === "intelligence" ? (
                <>
                  <div className="mxw-crumb">
                    <button
                      onClick={() => setWorkspaceView("phase")}
                      type="button"
                    >
                      {displayMoveName}
                    </button>
                    <span>/</span>
                    Phase Intelligence
                  </div>
                  <div className="mxw-stage-head">
                    <div className="mxw-agent-chip">
                      <span />
                      AVA · MOVES
                    </div>
                    <h1>Phase Intelligence</h1>
                    <p>
                      The short readout for this phase: key decision,
                      function-pack signal, and governed gate/evidence truth.
                    </p>
                  </div>
                  <PhaseIntelligencePanel
                    moveId={move.id}
                    phase={phase.phase}
                  />
                </>
              ) : workspaceView === "pricing" ? (
                <>
                  <div className="mxw-crumb">
                    <button
                      onClick={() => setWorkspaceView("phase")}
                      type="button"
                    >
                      {displayMoveName}
                    </button>
                    <span>/</span>
                    Cost & Effort
                  </div>
                  <div className="mxw-stage-head">
                    <div className="mxw-agent-chip">
                      <span />
                      AVA · MOVES
                    </div>
                    <h1>Cost & Effort</h1>
                    <p>
                      Build a deterministic, evidence-grounded cost and effort
                      estimate for this Move — the Nexus Pricing Engine&apos;s
                      five-step wizard.
                    </p>
                  </div>
                  <CostEffortWizard
                    moveId={move.id}
                    defaultCurrency={
                      move.valueAtStake.projected?.currency ?? null
                    }
                  />
                </>
              ) : workspaceView === "risk" ? (
                <>
                  <div className="mxw-crumb">
                    <button
                      onClick={() => setWorkspaceView("phase")}
                      type="button"
                    >
                      {displayMoveName}
                    </button>
                    <span>/</span>
                    Risk Assessment
                  </div>
                  <div className="mxw-stage-head">
                    <div className="mxw-agent-chip">
                      <span />
                      AVA · MOVES
                    </div>
                    <h1>Risk Assessment</h1>
                    <p>
                      Score this Move&apos;s structural risk and usage
                      escalators — the same discovery answers you&apos;re
                      already capturing on this phase.
                    </p>
                  </div>
                  <RiskAssessmentPanel moveId={move.id} />
                </>
              ) : workspaceView === "solutioning" ? (
                <>
                  <div className="mxw-crumb">
                    <button
                      onClick={() => setWorkspaceView("phase")}
                      type="button"
                    >
                      {displayMoveName}
                    </button>
                    <span>/</span>
                    Solutioning
                  </div>
                  <div className="mxw-stage-head">
                    <div className="mxw-agent-chip">
                      <span />
                      AVA · MOVES
                    </div>
                    <h1>Solutioning</h1>
                    <p>
                      Classify which of the five platform-fit patterns this Move
                      actually is — only one pattern needs the platform.
                    </p>
                  </div>
                  <SolutioningPanel moveId={move.id} />
                </>
              ) : workspaceView === "approvals" ? (
                <>
                  <div className="mxw-crumb">
                    <button
                      onClick={() => setWorkspaceView("phase")}
                      type="button"
                    >
                      {displayMoveName}
                    </button>
                    <span>/</span>
                    Approvals overview
                  </div>
                  <div className="mxw-stage-head">
                    <div className="mxw-agent-chip">
                      <span />
                      AVA · MOVES
                    </div>
                    <h1>Approvals overview</h1>
                    <p>
                      Gate-approval status across every phase of this Move, one
                      row per phase — the same gate criteria the Approve &amp;
                      Build flow evaluates against.
                    </p>
                  </div>
                  <ApprovalsOverview
                    currentMoveId={move.id}
                    canApproveGates={canApproveGates}
                    phaseTallies={phaseTallies}
                    reachablePhase={move.currentPhase ?? 0}
                    viewingPhase={phase.phase}
                    onReviewCurrentPhase={() => {
                      setWorkspaceView("phase");
                      setSubstepIndex(phase.substeps.length - 1);
                      setFinderSelectedSectionKey(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </>
              ) : (
                <>
                  <div className="mxw-crumb">
                    <Link
                      href={`/strategic-moves/${move.id}/phase/${move.currentPhase ?? 0}`}
                    >
                      {displayMoveName}
                    </Link>
                    <span>/</span>
                    {phase.code} · {phase.title}
                  </div>

                  {/* With the composition polish on, the capture flow's own
                      phase strip and step bar already name the phase, its
                      question and how many of its inputs are answered, and the
                      dock carries the aVa identity — so the head keeps only
                      what the flow does NOT state: a blocked-phase notice and
                      the readiness-workbook actions. */}
                  <div
                    className={
                      captureCompositionActive
                        ? "mxw-stage-head mxw-stage-head-compact"
                        : "mxw-stage-head"
                    }
                  >
                    {captureCompositionActive ? null : (
                      <>
                        <div className="mxw-agent-chip">
                          <span />
                          AVA · MOVES
                        </div>
                        <h1>{phase.title}</h1>
                        <div className="mxw-question">{phase.question}</div>
                        <p>{phase.lede}</p>
                      </>
                    )}
                    {blockedPhaseRequest ? (
                      <div
                        className="mxw-phase-blocker"
                        aria-label="Blocked phase request"
                      >
                        <span>
                          P{blockedPhaseRequest.requestedPhase} blocked
                        </span>
                        <h2>{blockedPhaseRequest.title}</h2>
                        <p>{blockedPhaseRequest.reason}</p>
                        <ul>
                          {blockedPhaseRequest.remaining.map((item) => (
                            <li key={`${item.label}-${item.status}`}>
                              <b>{item.required ? "Required" : "Optional"}</b>
                              <span>{item.label}</span>
                              <em>{item.status}</em>
                            </li>
                          ))}
                        </ul>
                        <button
                          className="mxw-primary-action"
                          onClick={() => {
                            setWorkspaceView("phase");
                            setFinderSelectedSectionKey(null);
                            (
                              workbookReviewRef.current ??
                              document.documentElement
                            ).scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }}
                          type="button"
                        >
                          {blockedPhaseRequest.nextActionLabel}
                        </button>
                      </div>
                    ) : null}
                    {/* Under `moves_workspace_v2` these actions move onto the
                        capture flow's GATE step (passed as `gateExtras`), so
                        they leave the stage head here; otherwise they stay on
                        the head exactly as before. */}
                    {workspaceV2Active ? null : readinessWorkbookActions}
                    {captureCompositionActive ? null : (
                      <div
                        className="mxw-progress-card"
                        aria-label="Phase progress"
                      >
                        <strong>{phase.code}</strong>
                        <span className="mxw-track">
                          <span style={{ width: `${progressPct}%` }} />
                        </span>
                        <div className="mxw-progress-meta">
                          {phaseProgressSignals.map((item) => (
                            <span
                              className={`mxw-progress-signal ${item.tone}`}
                              key={item.label}
                            >
                              <b>{item.label}</b>
                              {item.value}
                            </span>
                          ))}
                        </div>
                        <em>
                          {phaseStoryRemaining} {phaseStoryArtifactStatus}
                        </em>
                      </div>
                    )}
                  </div>

                  {captureFlowMounted ? (
                    renderAvaDock({
                      notesFill: captureNotesEnabled ? (
                          <CaptureNotesFill
                            targets={phaseCaptureSections.map((section) => ({
                              section,
                              value:
                                displayPhaseCaptureValues[section.key] ?? "",
                            }))}
                            onInsert={insertPhaseCaptureValueFromNotes}
                            recordsBasisFor={notesBasisRecordingKeys}
                          />
                        ) : null,
                      captureProps: {
                        phases: capturePhases,
                        phase: phase.phase,
                        sections: phaseCaptureSections,
                        isSectionComplete: isCaptureSectionComplete,
                        sectionSaveLabel: (section) =>
                          phaseCaptureStatusForSection(
                            section,
                            displayPhaseCaptureValues,
                            persistedPhaseCaptureValues,
                            phaseCaptureSaveStatus,
                            businessChangeAssessment,
                            initialApprovedEvidenceReferences.map(
                              (item) => item.evidenceId,
                            ),
                            phaseEvidencePassed,
                            phaseEvidenceCheckAvailable,
                            initialApprovedP1CaptureEvidenceReferences,
                            captureBasisForSection(section.key),
                          ).label,
                        sectionBasisLabel: (section) => {
                          if (
                            !charterBasisActive ||
                            !charterBasisSectionKeys.has(section.key)
                          )
                            return null;
                          const basis = charterBasisBySection[section.key];
                          if (!basis) return null;
                          return basis.kind === "approved_evidence"
                            ? "Approved evidence"
                            : basis.kind === "assumption"
                              ? "Assumption to validate in Discover"
                              : "Workspace assertion";
                        },
                        requireAnswers: true,
                        renderSectionInput: captureSectionInput,
                        renderSectionBasis: captureSectionBasis,
                        renderSectionBadge: captureSectionBadge,
                        // Width per Claude Design's P3-P5 grid review; a
                        // structured editor stays wide regardless. See
                        // moves-capture-section-width.ts.
                        sectionSpan: (section) =>
                          captureSectionSpan(phase.phase, section),
                        renderSectionRecapMark: captureSectionRecapMark,
                        handoffSummary: charterBasisRollup,
                        openingBand: (
                          <>
                            {gateMetWithCaptureUnfinished && viewedGateTally ? (
                              <CaptureGateMetNotice
                                met={viewedGateTally.met}
                                total={viewedGateTally.total}
                              />
                            ) : null}
                            <CharterAssumptionsCarryForward
                              assumptions={carriedCharterAssumptionRows}
                            />
                            <CharterStandingAfterDiscover
                              rows={charterStandingAfterDiscoverRows}
                            />
                            {/* A step whose questions are all answered can
                                still hold Continue, because an open phase
                                evidence check marks every section "Evidence
                                open". Say which evidence, and where it is
                                closed — the step itself cannot close it. */}
                            <CaptureEvidenceHoldNotice
                              hold={phaseCaptureHold}
                              onOpenFiles={openFilesWorkspace}
                            />
                          </>
                        ),
                        sectionRecap: (s) =>
                          displayPhaseCaptureValues[s.key] ?? "",
                        onSelectPhase: (p) =>
                          router.push(`/strategic-moves/${move.id}/phase/${p}`),
                        onSubmitPhase: () => {
                          /* S5: wire to gate approval + next-phase generation */
                        },
                        onAdvanceToNextPhase: continueToCurrentPhase,
                        nextPhase: nextCapturePhase
                          ? {
                              code: nextCapturePhase.code,
                              name: nextCapturePhase.navLabel,
                            }
                          : null,
                        initialStep: initialSubstepKey
                          ? (Math.min(substepIndex, 2) as 0 | 1 | 2)
                          : undefined,
                        approveSlot: captureApproveSlot,
                        allowReviewBeforeSubmit: captureHandoffRecapEnabled,
                        workspaceV2: workspaceV2Active,
                        // The GATE step carries the readiness-workbook actions
                        // and — for an intelligence phase — the findings review
                        // honesty line, so the gate names accepted/challenged/
                        // awaiting counts and the specific open finding.
                        gateExtras: workspaceV2Active ? (
                          <>
                            {readinessWorkbookActions}
                            {workspaceV2Active &&
                            isFindingsPhase(phase.phase) &&
                            phaseFindingsModel &&
                            !phaseFindingsModel.pending &&
                            findingsReviewSummary ? (
                              <FindingsReviewGateSummary
                                summary={findingsReviewSummary}
                              />
                            ) : null}
                          </>
                        ) : null,
                        // The OUTCOME step becomes the findings surface for an
                        // intelligence phase; capture-heavy phases keep the
                        // hand-off recap (slot left null).
                        outcomeFindings:
                          workspaceV2Active &&
                          isFindingsPhase(phase.phase) &&
                          phaseFindingsModel ? (
                            <MovesPhaseFindings
                              model={phaseFindingsModel}
                              review={findingsReview}
                              onReview={onFindingReview}
                              canReview={canApproveGates}
                              charts={phaseChartsModel}
                            />
                          ) : null,
                      },
                    })
                  ) : phase.phase >= 1 && phase.phase <= 5 ? (
                    <PhaseContractStepsCanvas
                      avaDraftProposalsByKey={avaDraftProposalsByKey}
                      avaDraftSaveStatus={avaDraftSaveStatus}
                      avaDraftValues={avaDraftValues}
                      comingUpExpanded={finderComingUpExpanded}
                      onApplyAvaDraftProposal={applyAvaDraftProposal}
                      onDismissAvaDraftProposal={dismissAvaDraftProposal}
                      onPhaseCaptureValueChange={setVisiblePhaseCaptureValue}
                      onSaveAvaDraft={saveAvaDraft}
                      onSelectSection={setFinderSelectedSectionKey}
                      onSelectSubstep={setSubstepIndex}
                      onToggleComingUp={() =>
                        setFinderComingUpOpen(
                          (open) => !(open ?? finderComingUpExpanded),
                        )
                      }
                      phase={phase}
                      gateApproved={gateApproved}
                      phaseEvidencePassed={phaseEvidencePassed}
                      phaseHardGatesPassed={phaseHardGatesPassed}
                      evidenceReadinessAvailable={phaseEvidenceCheckAvailable}
                      progressHeaderState={phaseProgressHeaderState}
                      onOpenFiles={openFilesWorkspace}
                      businessChangeAssessment={businessChangeAssessment}
                      approvedEvidenceReferences={
                        initialApprovedEvidenceReferences
                      }
                      approvedCaptureEvidenceReferences={
                        initialApprovedP1CaptureEvidenceReferences
                      }
                      moveId={move.id}
                      reviewerIdentity={
                        currentUser?.email ?? "signed-in reviewer"
                      }
                      phaseCaptureSections={phaseCaptureSections}
                      phaseCaptureValues={displayPhaseCaptureValues}
                      referenceDraftValues={initialReferenceDraftValues}
                      persistedPhaseCaptureValues={persistedPhaseCaptureValues}
                      phaseCaptureSaveErrors={displayPhaseCaptureSaveErrors}
                      phaseCaptureSaveStatus={displayPhaseCaptureSaveStatus}
                      readinessPack={finderReadinessPack}
                      selectedSectionKey={finderSelectedSectionKey}
                      substepBody={
                        <PhaseBody
                          approvalStanding={approvalStanding}
                          charterGateDisclosure={charterGateDisclosure}
                          canApproveGates={canApproveGates}
                          carriesForwardContent={carriesForwardContent}
                          currentStateReadiness={currentStateReadiness}
                          evidenceCount={evidenceCount}
                          findingsEvidenceLabel={findingsEvidenceLabel}
                          evidenceNeedPackets={evidenceNeedPackets}
                          declarableEvidenceFamilies={
                            declarableEvidenceFamilies
                          }
                          phaseEvidencePassed={phaseEvidencePassed}
                          phaseHardGatesPassed={phaseHardGatesPassed}
                          evidenceReadinessAvailable={
                            phaseEvidenceCheckAvailable
                          }
                          gateApproved={gateApproved}
                          gateApprovalMessage={gateApprovalMessage}
                          gateApprovalStatus={gateApprovalStatus}
                          isHistoricalPhase={isHistoricalPhase}
                          move={move}
                          displayMoveName={displayMoveName}
                          onApproveAfterBuild={approvePhaseGateAfterBuild}
                          onContinueCurrentPhase={continueToCurrentPhase}
                          onApproveP0Gate={approveP0Gate}
                          approverLabel={approverLabel}
                          businessChangeAssessment={businessChangeAssessment}
                          confirmedSolutionRoute={confirmedSolutionRoute}
                          approvedEvidenceReferences={
                            initialApprovedEvidenceReferences
                          }
                          approvedCaptureEvidenceReferences={
                            initialApprovedP1CaptureEvidenceReferences
                          }
                          reviewerIdentity={
                            currentUser?.email ?? "signed-in reviewer"
                          }
                          onFinalizePhaseCapture={finalizePhaseCapture}
                          onOpenFiles={openFilesWorkspace}
                          onPhaseCaptureValueChange={setPhaseCaptureValue}
                          onRefreshPhase={refreshPhase}
                          onSelectOption={selectP3Option}
                          nextOpenPhaseContract={nextOpenPhaseContract}
                          p3OptionSet={p3OptionSet}
                          phase={phase}
                          phaseBuildArtifacts={visiblePhaseBuildArtifacts}
                          phaseCaptureBlocker={phaseCaptureBlocker}
                          phaseCaptureCompleteCount={phaseCaptureCompleteCount}
                          persistedPhaseCaptureValues={
                            persistedPhaseCaptureValues
                          }
                          phaseCaptureSaveErrors={phaseCaptureSaveErrors}
                          phaseCaptureSaveStatus={phaseCaptureSaveStatus}
                          phaseCaptureSections={phaseCaptureSections}
                          phaseCaptureValues={phaseCaptureValues}
                          selectedOption={effectiveSelectedOption}
                          substep={substep.key}
                          terminalComplete={terminalComplete}
                        />
                      }
                      substepIndex={substepIndex}
                      terminalComplete={terminalComplete}
                    />
                  ) : (
                    <FinderStepsColumns
                      comingUpExpanded={finderComingUpExpanded}
                      gateApproved={gateApproved}
                      onPhaseCaptureValueChange={setPhaseCaptureValue}
                      onSelectSection={setFinderSelectedSectionKey}
                      onSelectSubstep={setSubstepIndex}
                      onToggleComingUp={() =>
                        setFinderComingUpOpen(
                          (open) => !(open ?? finderComingUpExpanded),
                        )
                      }
                      phase={phase}
                      phaseEvidencePassed={phaseEvidencePassed}
                      phaseHardGatesPassed={phaseHardGatesPassed}
                      evidenceReadinessAvailable={phaseEvidenceCheckAvailable}
                      progressHeaderState={phaseProgressHeaderState}
                      onOpenFiles={openFilesWorkspace}
                      businessChangeAssessment={businessChangeAssessment}
                      approvedEvidenceReferences={
                        initialApprovedEvidenceReferences
                      }
                      approvedCaptureEvidenceReferences={
                        initialApprovedP1CaptureEvidenceReferences
                      }
                      moveId={move.id}
                      reviewerIdentity={
                        currentUser?.email ?? "signed-in reviewer"
                      }
                      phaseCaptureSections={phaseCaptureSections}
                      phaseCaptureValues={phaseCaptureValues}
                      referenceDraftValues={initialReferenceDraftValues}
                      persistedPhaseCaptureValues={persistedPhaseCaptureValues}
                      phaseCaptureSaveErrors={phaseCaptureSaveErrors}
                      phaseCaptureSaveStatus={phaseCaptureSaveStatus}
                      readinessPack={finderReadinessPack}
                      selectedSectionKey={finderSelectedSectionKey}
                      substepBody={
                        <PhaseBody
                          approvalStanding={approvalStanding}
                          charterGateDisclosure={charterGateDisclosure}
                          canApproveGates={canApproveGates}
                          carriesForwardContent={carriesForwardContent}
                          currentStateReadiness={currentStateReadiness}
                          evidenceCount={evidenceCount}
                          findingsEvidenceLabel={findingsEvidenceLabel}
                          evidenceNeedPackets={evidenceNeedPackets}
                          declarableEvidenceFamilies={
                            declarableEvidenceFamilies
                          }
                          phaseEvidencePassed={phaseEvidencePassed}
                          phaseHardGatesPassed={phaseHardGatesPassed}
                          evidenceReadinessAvailable={
                            phaseEvidenceCheckAvailable
                          }
                          gateApproved={gateApproved}
                          gateApprovalMessage={gateApprovalMessage}
                          gateApprovalStatus={gateApprovalStatus}
                          isHistoricalPhase={isHistoricalPhase}
                          move={move}
                          displayMoveName={displayMoveName}
                          onApproveAfterBuild={approvePhaseGateAfterBuild}
                          onContinueCurrentPhase={continueToCurrentPhase}
                          onApproveP0Gate={approveP0Gate}
                          approverLabel={approverLabel}
                          businessChangeAssessment={businessChangeAssessment}
                          confirmedSolutionRoute={confirmedSolutionRoute}
                          approvedEvidenceReferences={
                            initialApprovedEvidenceReferences
                          }
                          approvedCaptureEvidenceReferences={
                            initialApprovedP1CaptureEvidenceReferences
                          }
                          reviewerIdentity={
                            currentUser?.email ?? "signed-in reviewer"
                          }
                          onFinalizePhaseCapture={finalizePhaseCapture}
                          onOpenFiles={openFilesWorkspace}
                          onPhaseCaptureValueChange={setPhaseCaptureValue}
                          onRefreshPhase={refreshPhase}
                          onSelectOption={selectP3Option}
                          nextOpenPhaseContract={nextOpenPhaseContract}
                          p3OptionSet={p3OptionSet}
                          phase={phase}
                          phaseBuildArtifacts={visiblePhaseBuildArtifacts}
                          phaseCaptureBlocker={phaseCaptureBlocker}
                          phaseCaptureCompleteCount={phaseCaptureCompleteCount}
                          persistedPhaseCaptureValues={
                            persistedPhaseCaptureValues
                          }
                          phaseCaptureSaveErrors={phaseCaptureSaveErrors}
                          phaseCaptureSaveStatus={phaseCaptureSaveStatus}
                          phaseCaptureSections={phaseCaptureSections}
                          phaseCaptureValues={phaseCaptureValues}
                          selectedOption={effectiveSelectedOption}
                          substep={substep.key}
                          terminalComplete={terminalComplete}
                        />
                      }
                      substepIndex={substepIndex}
                    />
                  )}
                </>
              )}
            </section>
          </div>
        );
      })()}

      <button
        aria-label="Ask aVa"
        aria-expanded={avaOpen}
        className="mxw-ava-fab"
        onClick={() => setAvaOpen((open) => !open)}
        type="button"
      >
        <AvaAskMark
          variant="avatar-dark"
          style={{ maxWidth: 28, minWidth: 28, width: 28 }}
        />
        Ask aVa
      </button>
      <aside
        className={`mxw-ava-pop ${avaOpen ? "open" : ""}`}
        aria-label="Ask aVa"
      >
        <div className="mxw-ava-head">
          <AvaAskMark
            variant="avatar-dark"
            style={{ maxWidth: 30, minWidth: 30, width: 30 }}
          />
          <div>
            <strong>aVa</strong>
            <small>{phase.avaRole}</small>
          </div>
          <button onClick={() => setAvaOpen(false)} type="button">
            ×
          </button>
        </div>
        <div className="mxw-ava-body">
          {avaThread.length === 0 ? (
            <>
              <p>{phase.avaContext}</p>
              <div className="mxw-suggested">
                {workspaceView !== "phase"
                  ? "Ask about this workspace"
                  : "Ask about this phase"}
              </div>
              {avaDraftAvailable ? (
                <div className="mxw-ava-assist">
                  {phaseCaptureMissingCount > 0 ? (
                    <>
                      <span>aVa can draft. You review and save.</span>
                      <button
                        type="button"
                        onClick={() => void requestAvaPhaseInputDrafts()}
                        disabled={avaStreaming || avaDraftStatus === "loading"}
                      >
                        {avaDraftStatus === "loading"
                          ? "Drafting..."
                          : "Draft proposed inputs"}
                      </button>
                    </>
                  ) : (
                    <span>
                      Inputs complete. Ask aVa to refine or check blockers.
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      void sendAvaMessage(
                        `Check what is blocking ${phase.code} gate approval and separate hard blockers from optional caveats.`,
                      )
                    }
                    disabled={avaStreaming}
                  >
                    Check blockers
                  </button>
                </div>
              ) : null}
              <AvaDraftSummary
                draftError={avaDraftError}
                draftProposals={avaDraftProposals}
                draftStatus={avaDraftStatus}
                phaseCaptureSections={phaseCaptureSections}
                phaseNum={phase.phase}
                onSelectField={(fieldKey) => {
                  setFinderSelectedSectionKey(fieldKey);
                  setWorkspaceView("phase");
                }}
              />
              {visibleAvaQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendAvaMessage(question)}
                  disabled={avaStreaming}
                >
                  {question}
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="mxw-ava-thread">
                {avaThread.map((turn) => (
                  <div
                    key={turn.id}
                    className={`mxw-ava-turn mxw-ava-turn-${turn.role}`}
                  >
                    <span className="mxw-ava-turn-who">
                      {turn.role === "user" ? "You" : "aVa"}
                    </span>
                    {turn.role === "assistant" ? (
                      <>
                        <div className="mxw-ava-turn-text">
                          {turn.text ? (
                            <AgentMarkdown text={turn.text} />
                          ) : avaStreaming ? (
                            "…"
                          ) : null}
                        </div>
                        {turn.agentAnswer ? (
                          <div className="mxw-ava-rich-answer">
                            <AgentAnswerRenderer
                              answer={turn.agentAnswer}
                              showChrome={false}
                              showExport={false}
                              showProse={false}
                            />
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p>{turn.text}</p>
                    )}
                  </div>
                ))}
              </div>
              <AvaDraftSummary
                draftError={avaDraftError}
                draftProposals={avaDraftProposals}
                draftStatus={avaDraftStatus}
                phaseCaptureSections={phaseCaptureSections}
                phaseNum={phase.phase}
                onSelectField={(fieldKey) => {
                  setFinderSelectedSectionKey(fieldKey);
                  setWorkspaceView("phase");
                }}
              />
            </>
          )}
        </div>
        <form
          className="mxw-ava-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void sendAvaMessage(avaInput);
          }}
        >
          <textarea
            value={avaInput}
            onChange={(event) => setAvaInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendAvaMessage(avaInput);
              }
            }}
            placeholder={`Ask aVa about ${phase.title.toLowerCase()}…`}
            rows={2}
            disabled={avaStreaming}
          />
          <button type="submit" disabled={avaStreaming || !avaInput.trim()}>
            Send
          </button>
        </form>
      </aside>
    </main>
  );
}

function AvaDraftSummary({
  draftError,
  draftProposals,
  draftStatus,
  onSelectField,
  phaseCaptureSections,
  phaseNum,
}: {
  draftError: string | null;
  draftProposals: AvaPhaseInputProposal[];
  draftStatus: AvaDraftRequestStatus;
  onSelectField: (fieldKey: string) => void;
  phaseCaptureSections: ReturnType<typeof getPhaseCaptureSections>;
  phaseNum: number;
}) {
  if (phaseNum < 1 || draftStatus === "idle") return null;

  return (
    <div className="mxw-ava-draft-list">
      {draftError ? (
        <p role={draftStatus === "error" ? "alert" : undefined}>{draftError}</p>
      ) : null}
      {draftStatus === "ready" && draftProposals.length > 0 ? (
        <>
          <span>
            {draftProposals.length} cited draft
            {draftProposals.length === 1 ? "" : "s"} ready. Review a field;
            inserting does not save.
          </span>
          {draftProposals.slice(0, 4).map((proposal) => {
            const label =
              phaseCaptureSections.find(
                (section) => section.key === proposal.fieldKey,
              )?.label ?? proposal.fieldKey;
            return (
              <button
                key={proposal.fieldKey}
                type="button"
                onClick={() => onSelectField(proposal.fieldKey)}
              >
                {label}
              </button>
            );
          })}
        </>
      ) : null}
    </div>
  );
}

// Horizontal phase stepper across the top of the phase workspace, mirroring the
// Source New event workflow (SourceNewWorkspace's `snw-phases`): the six Move
// phases as top tabs with done/current/upcoming state, the viewed one
// underlined, each a link to that phase (future phases are disabled until the
// Move reaches them). The top stepper keeps the existing reachability logic.
function MovePhaseTopStepper({
  moveId,
  currentPhase,
  viewingPhase,
  phaseTallies,
}: {
  moveId: string;
  currentPhase: number;
  viewingPhase: number;
  phaseTallies: PhaseTallyRow[];
}) {
  return (
    <nav className="mxw-phase-stepper" aria-label="Phase steps">
      {PHASES.map((item) => {
        const tally = phaseTallies.find((row) => row.phase === item.phase);
        const state =
          tally?.state === "done"
            ? "done"
            : item.phase < currentPhase
              ? "done"
              : item.phase === currentPhase
                ? "current"
                : "up";
        const viewing = item.phase === viewingPhase;
        // The figure states what it counts. A bare "3 of 3" sits ~200px above
        // the capture strip's "11 questions" for the same phase and cannot be
        // told apart from it; these are gate criteria, not capture questions.
        const stateLabel = phaseStepperStateLabel(tally, state);
        const reachable = item.phase <= currentPhase;
        const inner = (
          <>
            <span className="mxw-phase-stepper-num" aria-hidden>
              {state === "done" ? "✓" : item.code}
            </span>
            <span className="mxw-phase-stepper-copy">
              <strong>{item.navLabel}</strong>
              <small>{stateLabel}</small>
            </span>
          </>
        );
        const className = `mxw-phase-stepper-step ${state}${viewing ? " viewing" : ""}`;
        return reachable ? (
          <Link
            aria-current={viewing ? "step" : undefined}
            className={className}
            href={`/strategic-moves/${moveId}/phase/${item.phase}`}
            key={item.code}
            title={`${item.navLabel} · ${stateLabel}`}
          >
            {inner}
          </Link>
        ) : (
          <button
            className={className}
            disabled
            key={item.code}
            title={`${item.navLabel} · ${stateLabel}`}
            type="button"
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}

function WorkspaceSurfaceTabs({
  activeView,
  onSelect,
  tabs,
  variant = "default",
}: {
  activeView: WorkspaceView;
  onSelect: (view: WorkspaceView) => void;
  tabs: Array<{ label: string; view: WorkspaceView }>;
  /** `secondary` de-emphasises the row (v2 shell), keeping the views reachable. */
  variant?: "default" | "secondary";
}) {
  return (
    <div
      className={
        variant === "secondary"
          ? "mxw-surface-tabs mxw-surface-tabs--secondary"
          : "mxw-surface-tabs"
      }
      role="tablist"
      aria-label="Move workspace views"
    >
      {tabs.map((tab) => (
        <button
          aria-selected={activeView === tab.view}
          className={activeView === tab.view ? "active" : ""}
          key={tab.view}
          onClick={() => {
            onSelect(tab.view);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MOVES-UI-002 Approvals overview.
//
// Entirely derived from `phaseTallies` (getMovePhaseTallies(move) — already
// computed server-side and threaded through as a prop, no new fetch here).
// Product approvals are recorded by the authenticated workspace user with
// gate-approval permission. Sponsor identity is contact metadata only.
//
// "Review & approve" reuses the same two navigation mechanisms already used
// elsewhere in this file: a real Link to the phase's own route for any other
// reachable phase (the exact href pattern the rail's phase-list already
// uses), or a local workspaceView/substep jump when the row is the phase
// already open on this page (the exact behavior the rail's Approvals link
// already used before this flag existed).
// ---------------------------------------------------------------------------

// The status, tally and approver cells are decided in
// `@/lib/programs/approvals-overview-labels` so that no cell of this table can
// state more than something on the screen measured. In particular there is no
// `approvalRoleLabelForPhase` any more: the approver column used to be a
// constant string returned for every phase, and the replacement takes the
// recorded approver as its argument, so this host cannot name one while no
// approval record reaches it.

function ApprovalsOverview({
  currentMoveId,
  canApproveGates,
  phaseTallies,
  reachablePhase,
  viewingPhase,
  onReviewCurrentPhase,
}: {
  currentMoveId: string;
  canApproveGates: boolean;
  phaseTallies: PhaseTallyRow[];
  reachablePhase: number;
  viewingPhase: number;
  onReviewCurrentPhase: () => void;
}) {
  return (
    <div className="mxw-approvals-overview" aria-label="Approvals overview">
      <div className="mxw-approvals-row mxw-approvals-row--head">
        <span>Phase</span>
        <span>Gate criteria</span>
        <span>Status</span>
        <span>Approver</span>
        <span />
      </div>
      {phaseTallies.map((row) => {
        const isViewingRow = row.phase === viewingPhase;
        const isReachable = row.phase <= reachablePhase;
        // No gate-approval record reaches this client surface, so the cell
        // is built from `null` and renders an explicit absence.
        const approver = formatApproverCell(null);
        return (
          <div className="mxw-approvals-row" key={row.phase}>
            <span className="mxw-approvals-phase">{row.label}</span>
            <span
              className="mxw-approvals-tally"
              title={formatGateCriteriaTitle(row)}
            >
              {formatGateCriteriaCell(row)}
            </span>
            <span
              className={`mxw-approvals-status ${approvalsRowStatusClass(row)}`}
              title={approvalsRowStatusBasis(row)}
            >
              {approvalsRowStatusText(row)}
            </span>
            <span
              className={`mxw-approvals-approver ${
                approver.recorded ? "" : "unassigned"
              }`}
            >
              {approver.text}
            </span>
            <span className="mxw-approvals-action">
              {isViewingRow ? (
                <button onClick={onReviewCurrentPhase} type="button">
                  {canApproveGates ? "Review & approve →" : "View gate →"}
                </button>
              ) : isReachable ? (
                <Link
                  href={`/strategic-moves/${currentMoveId}/phase/${row.phase}`}
                >
                  {canApproveGates ? "Review & approve →" : "View gate →"}
                </Link>
              ) : (
                <span className="mxw-approvals-noaction">
                  Not yet reachable
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MobileMovesRailControls({
  currentMoveId,
  maxReachablePhase,
  onSelectWorkspaceView,
  viewingPhase,
  workspaceView,
  tabs,
}: {
  currentMoveId: string;
  maxReachablePhase: number;
  onSelectWorkspaceView: (view: WorkspaceView) => void;
  viewingPhase: number;
  workspaceView: WorkspaceView;
  tabs: Array<{ label: string; view: WorkspaceView }>;
}) {
  const router = useRouter();

  return (
    <div className="mxw-mobile-rail" aria-label="Compact move navigation">
      <label>
        <span>Phase</span>
        <select
          aria-label="Switch move phase"
          onChange={(event) => {
            const nextPhase = Number(event.currentTarget.value);
            router.push(`/strategic-moves/${currentMoveId}/phase/${nextPhase}`);
          }}
          value={viewingPhase}
        >
          {PHASES.map((phase) => (
            <option
              disabled={phase.phase > maxReachablePhase}
              key={phase.code}
              value={phase.phase}
            >
              {phase.code} · {phase.navLabel}
            </option>
          ))}
        </select>
      </label>
      <div role="tablist" aria-label="Compact workspace views">
        {tabs.map((view) => (
          <button
            aria-selected={workspaceView === view.view}
            className={workspaceView === view.view ? "viewing" : ""}
            key={view.view}
            onClick={() => {
              onSelectWorkspaceView(view.view);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            role="tab"
            type="button"
          >
            {view.view === "phase"
              ? "Stage"
              : view.view === "files"
                ? "Files"
                : view.view === "intelligence"
                  ? "Intel"
                  : view.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Moves universal Steps view.
//
// Keeps the original phase inputs and workflow controls in a horizontal step
// selector above the detail pane. Real
// data only:
//   - "{phase.code} inputs" rows = `getPhaseCaptureSections(phase.phase)`,
//     the SAME contract the legacy PhaseCaptureEditor already renders — no
//     fabricated categories. Complete/blocked status reuses the identical
//     `String(value ?? "").trim()` check the legacy stepper's completeness
//     count already uses.
//   - "Workflow" rows = `phase.substeps`, the SAME array driving the legacy
//     stepper's done/current/upcoming state (`substepIndex`) — one source of
//     truth, not a second one. Selecting a workflow row renders `substepBody`,
//     which the caller builds from the existing <PhaseBody> element/props, so
//     every substep-specific real control (upload inputs, decision panels,
//     gate approval) keeps working unmodified.
//   - "What {phase} will need" = `buildNextPhaseReadinessPack` output,
//     already computed from real evidence-need packets — no new fetch.
// ---------------------------------------------------------------------------

function getInitialFinderSectionKey(
  phaseNum: number,
  initialSubstepKey?: SubstepKey,
  isHistoricalPhase = false,
): string | null {
  if (phaseNum < 1 || phaseNum > 5) {
    return null;
  }
  if (initialSubstepKey || isHistoricalPhase) {
    return null;
  }
  return getPhaseCaptureSections(phaseNum)[0]?.key ?? null;
}

function getInitialSubstepIndex(
  phase: PhaseContract,
  initialSubstepKey: SubstepKey | undefined,
  terminalComplete: boolean,
): number {
  const requestedIndex = phase.substeps.findIndex(
    (item) => item.key === initialSubstepKey,
  );
  if (requestedIndex >= 0) {
    return requestedIndex;
  }
  if (terminalComplete && phase.phase === 5) {
    return Math.max(phase.substeps.length - 1, 0);
  }
  return 0;
}

function phaseCaptureStatusForSection(
  section: PhaseCaptureSection,
  draftValues: PhaseCaptureValues,
  persistedValues: PhaseCaptureValues,
  saveStatus: Record<string, PhaseCaptureSaveStatus>,
  businessChangeAssessment = "",
  approvedEvidenceReferences: readonly string[] = [],
  evidencePassed = true,
  evidenceReadinessAvailable = true,
  approvedCaptureEvidenceReferences: readonly ApprovedPhaseEvidenceReference[] = [],
  p1Basis?: {
    value: CharterBasisValue | null;
    savePending: boolean;
    saveFailed: boolean;
    approvedEvidence: readonly ApprovedPhaseEvidenceReference[];
  },
): PhaseCaptureStatusView {
  // Delegates to the shared, unit-tested state machine so the badge's meaning
  // is asserted somewhere other than a browser run. See phase-capture-status.ts
  // for the invariant: Done means the visible value is reproducible from the
  // server after a no-store reload.
  const status = resolvePhaseCaptureStatus({
    draft: String(draftValues[section.key] ?? ""),
    persisted: String(persistedValues[section.key] ?? ""),
    saveStatus: saveStatus[section.key],
  });
  if (!status.complete) return status;

  const persisted = String(persistedValues[section.key] ?? "");
  const structuredValid =
    section.structured === "business-change"
      ? isBusinessChangeAssessmentComplete(persisted)
      : section.structured === "solution-route"
        ? Boolean(
            resolveConfirmedSolutionRoute({
              businessChangeAssessment:
                businessChangeAssessment ||
                parseSolutionRouteValidation(persisted)
                  ?.businessChangeAssessmentSnapshot,
              routeValidation: persisted,
              approvedEvidenceReferences,
            }),
          )
        : section.structured === "estimate-model"
          ? evaluateEstimateModel(persisted).readyForApproval
          : section.structured === "facts"
            ? parseDiagnosisFacts(persisted).length > 0
            : true;
  if (!structuredValid) {
    return { label: "Needs valid details", complete: false, tone: "open" };
  }
  if (!evidenceReadinessAvailable) {
    return {
      label: "Evidence check unavailable",
      complete: false,
      tone: "open",
    };
  }
  const basisSatisfied = Boolean(
    p1Basis &&
    !p1Basis.savePending &&
    !p1Basis.saveFailed &&
    (p1Basis.value?.kind !== "assumption" ||
      (p1Basis.value.owner.trim() && p1Basis.value.p2ValidationPlan.trim())) &&
    isP1CharterBasisValidForSection({
      sectionKey: section.key,
      basis: p1Basis.value,
      approvedEvidence: p1Basis.approvedEvidence,
    }),
  );
  if (p1Basis && !basisSatisfied) {
    return { label: "Basis open", complete: false, tone: "open" };
  }
  if (
    section.evidenceFamily &&
    !approvedCaptureEvidenceReferences.some(
      (reference) => reference.familyKey === section.evidenceFamily,
    ) &&
    !basisSatisfied
  ) {
    return { label: "Evidence open", complete: false, tone: "open" };
  }
  if (!section.evidenceFamily && !evidencePassed) {
    return { label: "Evidence open", complete: false, tone: "open" };
  }
  return status;
}

function phaseCaptureStatusForDisplay(
  status: PhaseCaptureStatusView,
  phase: number,
  phaseHardGatesPassed: boolean,
): PhaseCaptureStatusView {
  return phase >= 1 && status.complete && !phaseHardGatesPassed
    ? { label: "Captured · gate open", complete: false, tone: "open" }
    : status;
}

function workflowIndexForSelectedSection(
  phase: PhaseContract,
  phaseCaptureSections: readonly PhaseCaptureSection[],
  selectedSection: PhaseCaptureSection | null,
  fallbackSubstepIndex: number,
): number {
  if (!selectedSection) {
    return fallbackSubstepIndex;
  }

  const key = selectedSection.key;
  const exactSubstepIndex = phase.substeps.findIndex(
    (substep) => substep.key === key,
  );
  if (exactSubstepIndex >= 0) {
    return exactSubstepIndex;
  }

  const uploadIndex = phase.substeps.findIndex((substep) =>
    ["current", "decide"].includes(substep.key),
  );
  const findingsIndex = phase.substeps.findIndex((substep) =>
    ["findings", "options", "value", "workstreams"].includes(substep.key),
  );
  const approveIndex = phase.substeps.findIndex(
    (substep) => substep.key === "approve",
  );

  if (
    ["evidence_plan", "baseline_metrics", "process_handoffs"].includes(key) &&
    uploadIndex >= 0
  ) {
    return uploadIndex;
  }
  if (
    [
      "gaps_root_causes",
      "data_quality_governance",
      "evidence_confidence",
      "solution_approach",
      "operating_model",
      "process_design",
      "controls_governance",
      "architecture_integration",
      "roadmap_sequencing",
      "estimates_capacity",
      "value_plan",
      "risks_dependencies",
    ].includes(key) &&
    findingsIndex >= 0
  ) {
    return findingsIndex;
  }
  if (
    ["recommendation", "approval_rationale"].includes(key) &&
    approveIndex >= 0
  ) {
    return approveIndex;
  }

  const selectedIndex = phaseCaptureSections.findIndex(
    (section) => section.key === key,
  );
  if (selectedIndex < 0) {
    return fallbackSubstepIndex;
  }
  const inputSlotCount = Math.max(phase.substeps.length - 1, 1);
  return Math.min(
    Math.floor(
      (selectedIndex / Math.max(phaseCaptureSections.length, 1)) *
        inputSlotCount,
    ),
    phase.substeps.length - 1,
  );
}

function ReferenceDraftCallout({ value }: { value: string | undefined }) {
  if (!value?.trim()) return null;
  return (
    <aside
      aria-label="Synthetic reference draft"
      className="mxw-reference-draft"
    >
      <div className="mxw-reference-draft-head">
        <strong>AbarVa reference draft</strong>
        <span>Synthetic · review before use</span>
      </div>
      <p>{value}</p>
      <small>
        Not client-provided, captured, approved, or evidence. This does not
        complete the input or clear a gate.
      </small>
    </aside>
  );
}

function PhaseContractStepsCanvas({
  avaDraftProposalsByKey,
  avaDraftSaveStatus,
  avaDraftValues,
  comingUpExpanded,
  onApplyAvaDraftProposal,
  onDismissAvaDraftProposal,
  onPhaseCaptureValueChange,
  onSaveAvaDraft,
  onSelectSection,
  onSelectSubstep,
  onToggleComingUp,
  phase,
  gateApproved,
  phaseEvidencePassed,
  phaseHardGatesPassed,
  evidenceReadinessAvailable,
  progressHeaderState,
  onOpenFiles,
  businessChangeAssessment,
  approvedEvidenceReferences,
  approvedCaptureEvidenceReferences,
  moveId,
  reviewerIdentity,
  phaseCaptureSections,
  phaseCaptureValues,
  referenceDraftValues,
  persistedPhaseCaptureValues,
  phaseCaptureSaveErrors,
  phaseCaptureSaveStatus,
  readinessPack,
  selectedSectionKey,
  substepBody,
  substepIndex,
  terminalComplete,
}: {
  avaDraftProposalsByKey: Map<string, AvaPhaseInputProposal>;
  avaDraftSaveStatus: Record<string, AvaDraftSaveStatus>;
  avaDraftValues: PhaseCaptureValues;
  comingUpExpanded: boolean;
  onApplyAvaDraftProposal: (proposal: AvaPhaseInputProposal) => void;
  onDismissAvaDraftProposal: (fieldKey: string) => void;
  onPhaseCaptureValueChange: (key: string, value: string) => void;
  onSaveAvaDraft: (fieldKey: string) => void;
  onSelectSection: (key: string | null) => void;
  onSelectSubstep: (index: number) => void;
  onToggleComingUp: () => void;
  phase: PhaseContract;
  gateApproved: boolean;
  phaseEvidencePassed: boolean;
  phaseHardGatesPassed: boolean;
  evidenceReadinessAvailable: boolean;
  progressHeaderState: PhaseProgressHeaderState | null;
  onOpenFiles: () => void;
  businessChangeAssessment: string;
  approvedEvidenceReferences: ApprovedPhaseEvidenceReference[];
  approvedCaptureEvidenceReferences: ApprovedPhaseEvidenceReference[];
  moveId: string;
  reviewerIdentity: string;
  phaseCaptureSections: ReturnType<typeof getPhaseCaptureSections>;
  phaseCaptureValues: PhaseCaptureValues;
  referenceDraftValues: PhaseCaptureValues;
  persistedPhaseCaptureValues: PhaseCaptureValues;
  phaseCaptureSaveErrors: Record<string, string>;
  phaseCaptureSaveStatus: Record<string, PhaseCaptureSaveStatus>;
  readinessPack: NextPhaseReadinessPack;
  selectedSectionKey: string | null;
  substepBody: ReactNode;
  substepIndex: number;
  terminalComplete: boolean;
}) {
  const terminalP5Complete = terminalComplete && phase.phase === 5;
  const selectedSection = selectedSectionKey
    ? (phaseCaptureSections.find(
        (section) => section.key === selectedSectionKey,
      ) ?? null)
    : null;
  const selectedWorkflow = selectedSectionKey === null;
  const activeWorkflowIndex = workflowIndexForSelectedSection(
    phase,
    phaseCaptureSections,
    selectedSection,
    substepIndex,
  );
  const detailStepNumber =
    selectedSection != null
      ? phaseCaptureSections.findIndex(
          (section) => section.key === selectedSection.key,
        ) + 1
      : phaseCaptureSections.length + substepIndex + 1;
  const totalStepCount = phaseCaptureSections.length + phase.substeps.length;
  const detailStatus = selectedSection
    ? phaseCaptureStatusForDisplay(
        phaseCaptureStatusForSection(
          selectedSection,
          phaseCaptureValues,
          persistedPhaseCaptureValues,
          phaseCaptureSaveStatus,
          businessChangeAssessment,
          approvedEvidenceReferences.map((item) => item.evidenceId),
          phaseEvidencePassed,
          evidenceReadinessAvailable,
          approvedCaptureEvidenceReferences,
        ),
        phase.phase,
        phaseHardGatesPassed,
      )
    : null;
  const detailComplete = selectedSection
    ? Boolean(detailStatus?.complete)
    : terminalP5Complete ||
      (gateApproved && phase.substeps[substepIndex]?.key === "approve");
  const selectedAvaProposal = selectedSection
    ? (avaDraftProposalsByKey.get(selectedSection.key) ?? null)
    : null;
  const selectedAvaDraftValue = selectedSection
    ? (avaDraftValues[selectedSection.key] ?? null)
    : null;
  const selectedAvaDraftApplied = selectedAvaDraftValue !== null;
  const selectedAvaDraftStatus = selectedSection
    ? avaDraftSaveStatus[selectedSection.key]
    : undefined;
  const detailTitle =
    selectedSection?.label ??
    phase.substeps[substepIndex]?.label ??
    phase.title;
  const scrollContractDetailIntoView = () => {
    const scrollDetail = () => {
      const detail = document.querySelector(
        ".mxw-contract-detail, .mxw-finder-detail",
      );
      if (typeof detail?.scrollIntoView !== "function") return;
      detail.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    };
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(scrollDetail);
    } else {
      window.setTimeout(scrollDetail, 0);
    }
  };

  // Progressive step flow. On an input step, one primary "Continue" advances to
  // the next input, or — after the last input — into the first workflow substep
  // after Charter capture. The user stays on a single step with a single clear
  // next action.
  const selectedSectionIndex = selectedSection
    ? phaseCaptureSections.findIndex(
        (section) => section.key === selectedSection.key,
      )
    : -1;
  const isLastInputSection =
    selectedSectionIndex === phaseCaptureSections.length - 1;
  const prepareSubstepIndex = Math.max(
    phase.substeps.findIndex((item) => item.key === "prepare"),
    0,
  );
  const afterInputsSubstepIndex = Math.min(
    prepareSubstepIndex + 1,
    phase.substeps.length - 1,
  );
  const continueTargetLabel = isLastInputSection
    ? (phase.substeps[afterInputsSubstepIndex]?.label ?? "the next step")
    : (phaseCaptureSections[selectedSectionIndex + 1]?.label ??
      "the next step");
  // Required inputs must be captured (and saved) before advancing; optional
  // inputs may be skipped. Advancing between steps keys off capture-level
  // completeness — the value is filled and persisted — NOT the phase-gate
  // display status, which only turns complete once the gate is approved on the
  // final step. A value mid-save is not yet complete, so the button stays
  // disabled until the save lands.
  const selectedCaptureStatus = selectedSection
    ? phaseCaptureStatusForSection(
        selectedSection,
        phaseCaptureValues,
        persistedPhaseCaptureValues,
        phaseCaptureSaveStatus,
        businessChangeAssessment,
        approvedEvidenceReferences.map((item) => item.evidenceId),
        phaseEvidencePassed,
        evidenceReadinessAvailable,
        approvedCaptureEvidenceReferences,
      )
    : null;
  const canAdvanceFromSection = selectedSection
    ? selectedSection.required
      ? Boolean(selectedCaptureStatus?.complete)
      : true
    : false;
  const advanceFromSection = () => {
    if (!selectedSection) return;
    if (isLastInputSection) {
      onSelectSubstep(afterInputsSubstepIndex);
      onSelectSection(null);
    } else {
      const next = phaseCaptureSections[selectedSectionIndex + 1];
      if (next) onSelectSection(next.key);
    }
    scrollContractDetailIntoView();
  };
  // "Coming up" lists what the NEXT phase will need — preparation that only
  // makes sense once this phase's work is done. It surfaces on the final
  // Approve & Build step and stays hidden on every earlier step.
  const onApproveStep =
    selectedWorkflow && phase.substeps[substepIndex]?.key === "approve";

  return (
    <section
      className="mxw-contract-card"
      aria-label={`${phase.code} phase shell`}
      data-testid="mxw-contract-card"
    >
      <label className="mxw-compact-steps">
        <span>Step</span>
        <select
          aria-label={`${phase.code} step`}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (value.startsWith("input:")) {
              onSelectSection(value.slice("input:".length));
            } else {
              onSelectSubstep(Number(value.slice("workflow:".length)));
              onSelectSection(null);
            }
            scrollContractDetailIntoView();
          }}
          value={
            selectedSection
              ? `input:${selectedSection.key}`
              : `workflow:${substepIndex}`
          }
        >
          <optgroup label="Inputs">
            {phaseCaptureSections.map((section) => (
              <option key={section.key} value={`input:${section.key}`}>
                {section.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Workflow">
            {phase.substeps.map((step, index) => (
              <option key={step.key} value={`workflow:${index}`}>
                {step.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <nav className="mxw-contract-nav" aria-label={`${phase.code} steps`}>
        <div className="mxw-contract-group">
          <div className="mxw-contract-group-label">Inputs</div>
          {phaseCaptureSections.map((section) => {
            const captureStatus = phaseCaptureStatusForSection(
              section,
              phaseCaptureValues,
              persistedPhaseCaptureValues,
              phaseCaptureSaveStatus,
              businessChangeAssessment,
              approvedEvidenceReferences.map((item) => item.evidenceId),
              phaseEvidencePassed,
              evidenceReadinessAvailable,
              approvedCaptureEvidenceReferences,
            );
            const status = phaseCaptureStatusForDisplay(
              captureStatus,
              phase.phase,
              phaseHardGatesPassed,
            );
            const selected = selectedSectionKey === section.key;
            return (
              <button
                className={`mxw-contract-step ${selected ? "active" : ""}`}
                key={section.key}
                onClick={() => {
                  onSelectSection(section.key);
                  scrollContractDetailIntoView();
                }}
                type="button"
              >
                <span className={status.complete ? "done" : ""} aria-hidden>
                  {status.complete ? "✓" : ""}
                </span>
                <strong>{section.label}</strong>
                {captureStatus.complete && !status.complete ? (
                  <small>Captured · gate open</small>
                ) : null}
                {!captureStatus.complete &&
                (status.label === "Evidence open" ||
                  status.label === "Evidence check unavailable") ? (
                  <small>
                    {status.label === "Evidence open"
                      ? "Needs approved evidence"
                      : "Evidence check unavailable"}
                  </small>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="mxw-contract-group">
          <div className="mxw-contract-group-label">Workflow</div>
          {phase.substeps.map((item, index) => {
            const active = selectedWorkflow
              ? index === substepIndex
              : index === activeWorkflowIndex;
            const complete =
              terminalP5Complete || (gateApproved && item.key === "approve");
            const visited = index < substepIndex && !complete;
            return (
              <button
                className={`mxw-contract-step ${active ? "active" : ""} ${visited ? "visited" : ""} ${complete ? "complete" : ""}`}
                key={item.key}
                onClick={() => {
                  onSelectSubstep(index);
                  onSelectSection(null);
                  scrollContractDetailIntoView();
                }}
                type="button"
              >
                <span
                  className={complete ? "done" : visited ? "visited" : ""}
                  aria-hidden
                >
                  {complete ? "✓" : visited ? "·" : ""}
                </span>
                <strong>{item.label}</strong>
                {visited ? <small>Viewed</small> : null}
              </button>
            );
          })}
        </div>
      </nav>

      <section
        className="mxw-contract-detail"
        aria-label={`${detailTitle} detail`}
      >
        <div className="mxw-contract-detail-top">
          <span className={detailComplete ? "done" : ""} aria-hidden>
            {detailComplete ? "✓" : ""}
          </span>
          <small>
            Step {Math.max(detailStepNumber, 1)} of {totalStepCount}
          </small>
          <h2>{detailTitle}</h2>
          <b>
            {detailStatus?.label ??
              progressHeaderState?.label ??
              (detailComplete ? "Done" : "Open")}
          </b>
          <div className="mxw-step-progress-actions">
            {progressHeaderState ? (
              progressHeaderState.openEvidenceCount > 0 ? (
                <button
                  className="mxw-step-progress-status open"
                  onClick={onOpenFiles}
                  type="button"
                >
                  {progressHeaderState.label} ·{" "}
                  {progressHeaderState.openEvidenceCount}
                </button>
              ) : (
                <span
                  className={`mxw-step-progress-status ${progressHeaderState.tone}`}
                  title={progressHeaderState.basis}
                >
                  {progressHeaderState.label}
                </span>
              )
            ) : null}
            <div id="mxw-step-progress-action" />
          </div>
        </div>

        <WorkflowContinueAction
          gateApproved={gateApproved}
          onSelectSection={onSelectSection}
          onSelectSubstep={onSelectSubstep}
          phase={phase}
          selectedWorkflow={selectedWorkflow}
          substepIndex={substepIndex}
        />

        {onApproveStep ? (
          <div
            className="mxw-contract-comingup"
            data-testid="mxw-contract-comingup"
          >
            <button
              aria-expanded={comingUpExpanded}
              onClick={onToggleComingUp}
              type="button"
            >
              What {readinessPack.nextPhaseLabel} will need
            </button>
            {comingUpExpanded ? (
              readinessPack.openNeeds.length > 0 ? (
                <div data-testid="mxw-contract-comingup-chips">
                  {readinessPack.openNeeds.slice(0, 6).map((need) => (
                    <span
                      className={need.priority === "required" ? "req" : ""}
                      key={need.evidenceSlot}
                    >
                      {need.evidenceSlot}
                    </span>
                  ))}
                </div>
              ) : (
                <p>No open evidence needs for the next phase yet.</p>
              )
            ) : null}
          </div>
        ) : null}
        {selectedSection ? (
          <div className="mxw-contract-form">
            <p>{selectedSection.description}</p>
            {selectedSection.evidenceFamily ? (
              <P1CaptureEvidenceStep
                approvedEvidenceReferences={approvedCaptureEvidenceReferences}
                moveId={moveId}
                onOpenFiles={onOpenFiles}
                section={selectedSection}
              />
            ) : null}
            <ReferenceDraftCallout
              value={referenceDraftValues[selectedSection.key]}
            />
            {selectedAvaProposal ? (
              <div className="mxw-ava-draft-card">
                <div className="mxw-ava-draft-card-head">
                  <span>aVa proposal</span>
                  <b>
                    {selectedAvaProposal.materiality === "governed_material"
                      ? "Review required"
                      : "Draft available"}
                  </b>
                </div>
                <dl>
                  <div>
                    <dt>Current</dt>
                    <dd>{selectedAvaProposal.currentValue || "Missing"}</dd>
                  </div>
                  <div>
                    <dt>Basis</dt>
                    <dd>{selectedAvaProposal.evidenceRefs.join(" · ")}</dd>
                  </div>
                </dl>
                <p>{selectedAvaProposal.rationale}</p>
                <blockquote>{selectedAvaProposal.proposedValue}</blockquote>
                {selectedAvaProposal.unresolvedGaps.length > 0 ? (
                  <ul>
                    {selectedAvaProposal.unresolvedGaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mxw-ava-draft-actions">
                  <button
                    type="button"
                    onClick={() => onApplyAvaDraftProposal(selectedAvaProposal)}
                  >
                    Insert as draft
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onDismissAvaDraftProposal(selectedAvaProposal.fieldKey)
                    }
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
            {selectedSection.structured === "facts" ? (
              <FinderFactsTable
                rawValue={phaseCaptureValues[selectedSection.key] ?? ""}
              />
            ) : null}
            {selectedSection.structured === "business-change" ? (
              <BusinessChangeAssessmentForm
                value={phaseCaptureValues[selectedSection.key] ?? ""}
                onChange={(value) =>
                  onPhaseCaptureValueChange(selectedSection.key, value)
                }
              />
            ) : selectedSection.structured === "solution-route" ? (
              <SolutionRouteValidationForm
                assessment={businessChangeAssessment}
                approvedEvidenceReferences={approvedEvidenceReferences}
                reviewerIdentity={reviewerIdentity}
                value={phaseCaptureValues[selectedSection.key] ?? ""}
                onChange={(value) =>
                  onPhaseCaptureValueChange(selectedSection.key, value)
                }
              />
            ) : selectedSection.structured === "estimate-model" ? (
              <EstimateModelEditor
                onChange={(value) =>
                  onPhaseCaptureValueChange(selectedSection.key, value)
                }
                value={phaseCaptureValues[selectedSection.key] ?? ""}
              />
            ) : (
              <textarea
                aria-label={selectedSection.label}
                className="mxw-contract-input"
                onChange={(event) =>
                  onPhaseCaptureValueChange(
                    selectedSection.key,
                    event.target.value,
                  )
                }
                placeholder={
                  selectedSection.example ?? "Write your answer here."
                }
                rows={selectedSection.structured === "facts" ? 4 : 6}
                value={phaseCaptureValues[selectedSection.key] ?? ""}
              />
            )}
            {selectedAvaDraftApplied ? (
              <div className="mxw-ava-local-draft">
                <span>
                  aVa draft is local. Save changes to persist this field.
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => onSaveAvaDraft(selectedSection.key)}
                    disabled={selectedAvaDraftStatus === "saving"}
                  >
                    {selectedAvaDraftStatus === "saving"
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onDismissAvaDraftProposal(selectedSection.key)
                    }
                    disabled={selectedAvaDraftStatus === "saving"}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
            {detailStatus?.tone === "error" ? (
              <p className="mxw-capture-save-error" role="alert">
                {phaseCaptureSaveErrors[selectedSection.key] ||
                  "This edit is not saved. Try again before continuing."}
              </p>
            ) : detailStatus?.tone === "saving" ||
              detailStatus?.tone === "editing" ? (
              <p className="mxw-capture-save-note">
                {detailStatus.label} - Approve &amp; Build will stay blocked
                until this value is saved.
              </p>
            ) : null}
            <div className="mxw-contract-advance">
              <button
                className="mxw-contract-continue"
                disabled={!canAdvanceFromSection}
                onClick={advanceFromSection}
                type="button"
              >
                {isLastInputSection
                  ? `Continue to ${continueTargetLabel}`
                  : "Save & continue"}
              </button>
              {!canAdvanceFromSection ? (
                <span className="mxw-contract-advance-hint">
                  Fill this in to continue.
                </span>
              ) : (
                <span className="mxw-contract-advance-next">
                  Next: {continueTargetLabel}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mxw-contract-legacy-body">{substepBody}</div>
        )}
      </section>
    </section>
  );
}

function FinderStepsColumns({
  comingUpExpanded,
  gateApproved,
  onPhaseCaptureValueChange,
  onSelectSection,
  onSelectSubstep,
  onToggleComingUp,
  phase,
  phaseEvidencePassed,
  phaseHardGatesPassed,
  evidenceReadinessAvailable,
  businessChangeAssessment,
  approvedEvidenceReferences,
  approvedCaptureEvidenceReferences,
  moveId,
  reviewerIdentity,
  phaseCaptureSections,
  phaseCaptureValues,
  referenceDraftValues,
  persistedPhaseCaptureValues,
  phaseCaptureSaveErrors,
  phaseCaptureSaveStatus,
  readinessPack,
  selectedSectionKey,
  progressHeaderState,
  onOpenFiles,
  substepBody,
  substepIndex,
}: {
  comingUpExpanded: boolean;
  gateApproved: boolean;
  onPhaseCaptureValueChange: (key: string, value: string) => void;
  onSelectSection: (key: string | null) => void;
  onSelectSubstep: (index: number) => void;
  onToggleComingUp: () => void;
  phase: PhaseContract;
  phaseEvidencePassed: boolean;
  phaseHardGatesPassed: boolean;
  evidenceReadinessAvailable: boolean;
  businessChangeAssessment: string;
  approvedEvidenceReferences: ApprovedPhaseEvidenceReference[];
  approvedCaptureEvidenceReferences: ApprovedPhaseEvidenceReference[];
  moveId: string;
  reviewerIdentity: string;
  phaseCaptureSections: ReturnType<typeof getPhaseCaptureSections>;
  phaseCaptureValues: PhaseCaptureValues;
  referenceDraftValues: PhaseCaptureValues;
  persistedPhaseCaptureValues: PhaseCaptureValues;
  phaseCaptureSaveErrors: Record<string, string>;
  phaseCaptureSaveStatus: Record<string, PhaseCaptureSaveStatus>;
  readinessPack: NextPhaseReadinessPack;
  selectedSectionKey: string | null;
  progressHeaderState: PhaseProgressHeaderState | null;
  onOpenFiles: () => void;
  substepBody: ReactNode;
  substepIndex: number;
}) {
  const selectedSection = selectedSectionKey
    ? (phaseCaptureSections.find(
        (section) => section.key === selectedSectionKey,
      ) ?? null)
    : null;

  // Both the step badge and this note come from resolvePhaseCaptureStatus, so
  // an unsaved edit cannot show "Done" in one place and nothing in the other.
  // Reading the raw save-status map here used to miss the case that matters
  // most: a value that diverges from the server with no in-flight save.
  const selectedDetailStatus = selectedSection
    ? phaseCaptureStatusForDisplay(
        phaseCaptureStatusForSection(
          selectedSection,
          phaseCaptureValues,
          persistedPhaseCaptureValues,
          phaseCaptureSaveStatus,
          businessChangeAssessment,
          approvedEvidenceReferences.map((item) => item.evidenceId),
          phaseEvidencePassed,
          evidenceReadinessAvailable,
          approvedCaptureEvidenceReferences,
        ),
        phase.phase,
        phaseHardGatesPassed,
      )
    : null;

  return (
    <div className="mxw-finder-steps" data-testid="mxw-finder-steps">
      <label className="mxw-compact-steps">
        <span>Step</span>
        <select
          aria-label={`${phase.code} step`}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (value.startsWith("input:")) {
              onSelectSection(value.slice("input:".length));
            } else {
              onSelectSubstep(Number(value.slice("workflow:".length)));
              onSelectSection(null);
            }
          }}
          value={
            selectedSection
              ? `input:${selectedSection.key}`
              : `workflow:${substepIndex}`
          }
        >
          <optgroup label="Inputs">
            {phaseCaptureSections.map((section) => (
              <option key={section.key} value={`input:${section.key}`}>
                {section.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Workflow">
            {phase.substeps.map((step, index) => (
              <option key={step.key} value={`workflow:${index}`}>
                {step.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <nav aria-label="Phase steps" className="mxw-finder-steps-menu">
        <div className="mxw-finder-step-group">
          <h3>{phase.code} inputs</h3>
          <ul>
            {phaseCaptureSections.map((section) => {
              const captureStatus = phaseCaptureStatusForSection(
                section,
                phaseCaptureValues,
                persistedPhaseCaptureValues,
                phaseCaptureSaveStatus,
                businessChangeAssessment,
                approvedEvidenceReferences.map((item) => item.evidenceId),
                phaseEvidencePassed,
                evidenceReadinessAvailable,
                approvedCaptureEvidenceReferences,
              );
              const status = phaseCaptureStatusForDisplay(
                captureStatus,
                phase.phase,
                phaseHardGatesPassed,
              );
              const blocked = section.required && !captureStatus.complete;
              const capturedGateOpen =
                captureStatus.complete && !status.complete;
              const selected = selectedSectionKey === section.key;
              return (
                <li key={section.key}>
                  <button
                    aria-current={selected ? "true" : undefined}
                    className={`mxw-finder-step-row input-row${selected ? " selected" : ""}${blocked ? " blocked" : ""}${status.complete ? " captured" : ""}`}
                    onClick={() => onSelectSection(section.key)}
                    type="button"
                  >
                    <span aria-hidden="true" className="mxw-finder-step-dot" />
                    <span className="mxw-finder-step-title">
                      {section.label}
                    </span>
                    {capturedGateOpen ? (
                      <span className="mxw-finder-step-subtitle">
                        Captured · gate open
                      </span>
                    ) : blocked ? (
                      <span className="mxw-finder-step-subtitle">
                        {captureStatus.label === "Open"
                          ? "Needs input"
                          : captureStatus.label === "Evidence open"
                            ? "Needs approved evidence"
                            : captureStatus.label ===
                                "Evidence check unavailable"
                              ? "Evidence check unavailable"
                              : captureStatus.label}
                      </span>
                    ) : status.complete ? (
                      <span className="mxw-finder-step-state">Captured</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mxw-finder-step-group">
          <h3>Workflow</h3>
          <ul>
            {phase.substeps.map((item, index) => {
              const isCurrent = index === substepIndex;
              const selected = selectedSectionKey === null && isCurrent;
              const done = index < substepIndex;
              return (
                <li key={item.key}>
                  <button
                    aria-current={selected ? "true" : undefined}
                    className={`mxw-finder-step-row workflow-row${selected ? " selected" : ""}${done ? " visited" : ""}`}
                    onClick={() => {
                      onSelectSubstep(index);
                      onSelectSection(null);
                      const scrollDetailIntoView = () => {
                        document
                          .querySelector(
                            ".mxw-contract-detail, .mxw-finder-detail",
                          )
                          ?.scrollIntoView({
                            block: "start",
                            behavior: "smooth",
                          });
                      };
                      if (typeof requestAnimationFrame === "function") {
                        requestAnimationFrame(scrollDetailIntoView);
                      } else {
                        window.setTimeout(scrollDetailIntoView, 0);
                      }
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className="mxw-finder-step-dot" />
                    <span className="mxw-finder-step-title">{item.label}</span>
                    {isCurrent ? (
                      <span className="mxw-finder-step-now">now</span>
                    ) : done ? (
                      <span className="mxw-finder-step-state">Viewed</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <div
        aria-label={
          selectedSection
            ? `${selectedSection.label} detail`
            : `${phase.substeps[substepIndex]?.label ?? phase.substeps[0]?.label ?? phase.code} detail`
        }
        className="mxw-finder-detail"
      >
        <header className="mxw-contract-detail-top">
          <small>
            Step{" "}
            {selectedSection
              ? phaseCaptureSections.findIndex(
                  (section) => section.key === selectedSection.key,
                ) + 1
              : phaseCaptureSections.length + substepIndex + 1}{" "}
            of {phaseCaptureSections.length + phase.substeps.length}
          </small>
          <h2>
            {selectedSection?.label ??
              phase.substeps[substepIndex]?.label ??
              phase.title}
          </h2>
          <div className="mxw-step-progress-actions">
            {progressHeaderState ? (
              progressHeaderState.openEvidenceCount > 0 ? (
                <button
                  className="mxw-step-progress-status open"
                  onClick={onOpenFiles}
                  type="button"
                >
                  {progressHeaderState.label} ·{" "}
                  {progressHeaderState.openEvidenceCount}
                </button>
              ) : (
                <span
                  className={`mxw-step-progress-status ${progressHeaderState.tone}`}
                  title={progressHeaderState.basis}
                >
                  {progressHeaderState.label}
                </span>
              )
            ) : null}
            <div id="mxw-step-progress-action" />
          </div>
        </header>
        <WorkflowContinueAction
          gateApproved={gateApproved}
          onSelectSection={onSelectSection}
          onSelectSubstep={onSelectSubstep}
          phase={phase}
          selectedWorkflow={selectedSectionKey === null}
          substepIndex={substepIndex}
        />
        {selectedSectionKey === null &&
        phase.substeps[substepIndex]?.key === "approve" ? (
          <div
            className="mxw-finder-comingup"
            data-testid="mxw-finder-comingup"
          >
            <button
              aria-expanded={comingUpExpanded}
              className="mxw-finder-comingup-toggle"
              onClick={onToggleComingUp}
              type="button"
            >
              What {readinessPack.nextPhaseLabel} will need
            </button>
            {comingUpExpanded ? (
              readinessPack.openNeeds.length > 0 ? (
                <div
                  className="mxw-finder-comingup-chips"
                  data-testid="mxw-finder-comingup-chips"
                >
                  {readinessPack.openNeeds.map((need) => (
                    <span
                      className={`mxw-finder-chip ${
                        need.priority === "required" ? "req" : "opt"
                      }`}
                      key={need.evidenceSlot}
                    >
                      {need.evidenceSlot}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mxw-finder-comingup-empty">
                  No open evidence needs for {readinessPack.nextPhaseLabel} yet.
                </p>
              )
            ) : null}
          </div>
        ) : null}
        {selectedSection ? (
          <section className="mxw-finder-detail-panel">
            <header>
              <p>{selectedSection.description}</p>
            </header>
            {selectedSection.evidenceFamily ? (
              <P1CaptureEvidenceStep
                approvedEvidenceReferences={approvedCaptureEvidenceReferences}
                moveId={moveId}
                onOpenFiles={onOpenFiles}
                section={selectedSection}
              />
            ) : null}
            <ReferenceDraftCallout
              value={referenceDraftValues[selectedSection.key]}
            />
            {selectedSection.structured === "facts" ? (
              <FinderFactsTable
                rawValue={phaseCaptureValues[selectedSection.key] ?? ""}
              />
            ) : null}
            {selectedSection.structured === "business-change" ? (
              <BusinessChangeAssessmentForm
                value={phaseCaptureValues[selectedSection.key] ?? ""}
                onChange={(value) =>
                  onPhaseCaptureValueChange(selectedSection.key, value)
                }
              />
            ) : selectedSection.structured === "solution-route" ? (
              <SolutionRouteValidationForm
                assessment={businessChangeAssessment}
                approvedEvidenceReferences={approvedEvidenceReferences}
                reviewerIdentity={reviewerIdentity}
                value={phaseCaptureValues[selectedSection.key] ?? ""}
                onChange={(value) =>
                  onPhaseCaptureValueChange(selectedSection.key, value)
                }
              />
            ) : selectedSection.structured === "estimate-model" ? (
              <EstimateModelEditor
                onChange={(value) =>
                  onPhaseCaptureValueChange(selectedSection.key, value)
                }
                value={phaseCaptureValues[selectedSection.key] ?? ""}
              />
            ) : (
              <textarea
                aria-label={selectedSection.label}
                className="mxw-finder-detail-input"
                onChange={(event) =>
                  onPhaseCaptureValueChange(
                    selectedSection.key,
                    event.target.value,
                  )
                }
                placeholder={
                  selectedSection.example ?? "Write your answer here."
                }
                rows={selectedSection.structured === "facts" ? 3 : 6}
                value={phaseCaptureValues[selectedSection.key] ?? ""}
              />
            )}
            {selectedDetailStatus?.tone === "error" ? (
              <p className="mxw-capture-save-error" role="alert">
                {phaseCaptureSaveErrors[selectedSection.key] ||
                  "This edit is not saved. Try again before continuing."}
              </p>
            ) : selectedDetailStatus?.tone === "saving" ||
              selectedDetailStatus?.tone === "editing" ? (
              <p className="mxw-capture-save-note">
                {selectedDetailStatus.label} - Approve &amp; Build will stay
                blocked until this value is saved.
              </p>
            ) : null}
          </section>
        ) : (
          substepBody
        )}
      </div>
    </div>
  );
}

function StepHeaderActionPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(
      document.getElementById("mxw-step-progress-action") as HTMLElement | null,
    );
  }, []);

  return target ? createPortal(children, target) : null;
}

function WorkflowContinueAction({
  gateApproved,
  onSelectSection,
  onSelectSubstep,
  phase,
  selectedWorkflow,
  substepIndex,
}: {
  gateApproved: boolean;
  onSelectSection: (key: string | null) => void;
  onSelectSubstep: (index: number) => void;
  phase: PhaseContract;
  selectedWorkflow: boolean;
  substepIndex: number;
}) {
  const nextStep = phase.substeps[substepIndex + 1];
  const currentStep = phase.substeps[substepIndex];
  if (
    phase.phase < 3 ||
    !selectedWorkflow ||
    gateApproved ||
    !nextStep ||
    currentStep?.key === "approve"
  ) {
    return null;
  }

  return (
    <StepHeaderActionPortal>
      <button
        className="mxw-contract-continue"
        data-testid="mxw-workflow-next-action"
        onClick={() => {
          onSelectSubstep(substepIndex + 1);
          onSelectSection(null);
          const scrollDetail = () => {
            const detail = document.querySelector(
              ".mxw-contract-detail, .mxw-finder-detail",
            );
            if (typeof detail?.scrollIntoView !== "function") return;
            detail.scrollIntoView({ block: "start", behavior: "smooth" });
          };
          if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(scrollDetail);
          } else {
            window.setTimeout(scrollDetail, 0);
          }
        }}
        type="button"
      >
        Continue to {nextStep.label}
      </button>
    </StepHeaderActionPortal>
  );
}

// Structured "facts" review table (metric · value, with an inline citation
// toggle) for phase-capture sections marked `structured: "facts"` — today
// only P2's `baseline_metrics`. Facts and their `source` field are real,
// already-shipped data (`diagnosis-facts.ts`, used by phase generation) — not
// invented for this view. The "◈" citation toggle only ever renders for a
// fact whose `source` is non-empty; most legacy/free-text captures parse to a
// source-less fact, so the toggle legitimately does not appear for them.
function FinderFactsTable({ rawValue }: { rawValue: string }) {
  const facts = useMemo(() => parseDiagnosisFacts(rawValue), [rawValue]);
  const [openSourceIndex, setOpenSourceIndex] = useState<number | null>(null);

  if (facts.length === 0) {
    return (
      <p className="mxw-finder-facts-empty">
        No baseline metrics captured yet.
      </p>
    );
  }

  return (
    <table className="mxw-finder-facts-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {facts.map((fact, index) => (
          <tr key={`${fact.metric}-${index}`}>
            <td>{fact.metric}</td>
            <td>
              <span className="mxw-finder-fact-value">{fact.value}</span>
              {fact.source ? (
                <>
                  <button
                    aria-expanded={openSourceIndex === index}
                    aria-label={`Show source for ${fact.metric}`}
                    className="mxw-finder-citation-toggle"
                    onClick={() =>
                      setOpenSourceIndex((current) =>
                        current === index ? null : index,
                      )
                    }
                    type="button"
                  >
                    {"◈"}
                  </button>
                  {openSourceIndex === index ? (
                    <span className="mxw-finder-citation-caption">
                      {fact.source}
                    </span>
                  ) : null}
                </>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PhaseBody({
  approvalStanding,
  canApproveGates,
  charterGateDisclosure,
  carriesForwardContent,
  currentStateReadiness,
  displayMoveName,
  evidenceCount,
  findingsEvidenceLabel,
  evidenceNeedPackets,
  declarableEvidenceFamilies,
  phaseEvidencePassed,
  phaseHardGatesPassed,
  evidenceReadinessAvailable,
  gateApproved,
  gateApprovalMessage,
  gateApprovalStatus,
  isHistoricalPhase,
  move,
  onApproveAfterBuild,
  onContinueCurrentPhase,
  onApproveP0Gate,
  approverLabel,
  businessChangeAssessment,
  confirmedSolutionRoute,
  approvedEvidenceReferences,
  approvedCaptureEvidenceReferences,
  reviewerIdentity,
  onFinalizePhaseCapture,
  onOpenFiles,
  onPhaseCaptureValueChange,
  onRefreshPhase,
  onSelectOption,
  nextOpenPhaseContract,
  p3OptionSet,
  phase,
  phaseBuildArtifacts,
  phaseCaptureBlocker,
  phaseCaptureCompleteCount,
  phaseCaptureSections,
  phaseCaptureValues,
  persistedPhaseCaptureValues,
  phaseCaptureSaveErrors,
  phaseCaptureSaveStatus,
  selectedOption,
  substep,
  terminalComplete,
}: {
  /**
   * What this screen may claim about the phase's approval — decided once by
   * the host so the header word and the decision copy cannot disagree.
   */
  approvalStanding: PhaseApprovalStanding;
  canApproveGates: boolean;
  /** Advisory basis disclosure for the gate confirm dialog; null-rendering when the basis surface is inactive. */
  charterGateDisclosure: ReactNode;
  carriesForwardContent: DeliverableContentSignal[];
  currentStateReadiness: ReadinessReport | null;
  displayMoveName: string;
  evidenceCount: number;
  findingsEvidenceLabel: string;
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
  declarableEvidenceFamilies: Array<{ id: string; label: string }>;
  phaseEvidencePassed: boolean;
  phaseHardGatesPassed: boolean;
  evidenceReadinessAvailable: boolean;
  gateApproved: boolean;
  gateApprovalMessage: string | null;
  gateApprovalStatus: "idle" | "approving" | "approved" | "blocked";
  isHistoricalPhase: boolean;
  move: StrategicMove;
  onApproveAfterBuild: (result: BuildSettledResult) => Promise<void>;
  onContinueCurrentPhase: () => void;
  onApproveP0Gate: () => void | Promise<void>;
  approverLabel: string | null;
  businessChangeAssessment: string;
  confirmedSolutionRoute: ConfirmedSolutionRoute | null;
  approvedEvidenceReferences: ApprovedPhaseEvidenceReference[];
  approvedCaptureEvidenceReferences: ApprovedPhaseEvidenceReference[];
  reviewerIdentity: string;
  onFinalizePhaseCapture: () => Promise<void>;
  onOpenFiles: () => void;
  onPhaseCaptureValueChange: (key: string, value: string) => void;
  onRefreshPhase: () => void;
  onSelectOption: (value: string) => void;
  nextOpenPhaseContract: PhaseContract;
  p3OptionSet: P3OptionSet;
  phase: PhaseContract;
  phaseBuildArtifacts: PhaseBuildArtifact[];
  phaseCaptureBlocker: string | null;
  phaseCaptureCompleteCount: number;
  phaseCaptureSections: ReturnType<typeof getPhaseCaptureSections>;
  phaseCaptureValues: PhaseCaptureValues;
  persistedPhaseCaptureValues: PhaseCaptureValues;
  phaseCaptureSaveErrors: Record<string, string>;
  phaseCaptureSaveStatus: Record<string, PhaseCaptureSaveStatus>;
  selectedOption: string;
  substep: SubstepKey;
  terminalComplete: boolean;
}) {
  const [p0ConfirmOpen, setP0ConfirmOpen] = useState(false);
  const selectedP3Option = p3OptionSet.options.find(
    (option) => option.id === selectedOption,
  );
  if (phase.phase === 0 && substep !== "approve") {
    return <P0OriginationHandoff move={move} />;
  }

  if (substep === "prepare") {
    if (phase.phase === 1) {
      return (
        <>
          <PhaseCaptureEditor
            completeCount={phaseCaptureCompleteCount}
            evidencePassed={phaseEvidencePassed}
            phaseHardGatesPassed={phaseHardGatesPassed}
            evidenceReadinessAvailable={evidenceReadinessAvailable}
            businessChangeAssessment={businessChangeAssessment}
            approvedEvidenceReferences={approvedEvidenceReferences}
            approvedCaptureEvidenceReferences={
              approvedCaptureEvidenceReferences
            }
            reviewerIdentity={reviewerIdentity}
            onChange={onPhaseCaptureValueChange}
            phase={phase}
            persistedValues={persistedPhaseCaptureValues}
            saveErrors={phaseCaptureSaveErrors}
            saveStatus={phaseCaptureSaveStatus}
            sections={phaseCaptureSections}
            values={phaseCaptureValues}
          />
          <section className="mxw-zone">
            <h2>Initial transformation posture</h2>
            <p>
              Capture the starting hypothesis for P2 discovery. This is not the
              selected solution approach; P3 will validate the approach and
              right-size the design after current-state evidence and constraints
              are reviewed.
            </p>
            <PostureCards
              selectedOption={selectedOption}
              onSelectOption={onSelectOption}
            />
          </section>
        </>
      );
    }

    if (phase.phase >= 2 && phase.phase <= 5) {
      return (
        <PhasePreparePanel
          evidenceNeedPackets={evidenceNeedPackets.filter(
            (packet) => packet.phase === phase.phase,
          )}
          move={move}
          nextWorkflowLabel={
            phase.substeps[
              Math.max(
                phase.substeps.findIndex((item) => item.key === "prepare") + 1,
                0,
              )
            ]?.label ?? "the next workflow step"
          }
          phase={phase}
          terminalComplete={terminalComplete}
        />
      );
    }

    return null;
  }

  if (substep === "current") {
    if (phase.phase === 2 && currentStateReadiness) {
      return (
        <CurrentStateFamilyUploadPanel
          moveId={move.id}
          onOpenFiles={onOpenFiles}
          onRefreshPhase={onRefreshPhase}
          phase={phase.phase}
          readiness={currentStateReadiness}
        />
      );
    }

    return (
      <>
        {/* The evidence checklist below names the families this phase needs,
            so this uploader is handed them too — without the list it rendered
            no picker and every file it took was left for inference to place. */}
        <DecisionEvidenceActionPanel
          buttonLabel={`Upload ${phase.code} files`}
          evidenceFamilies={declarableEvidenceFamilies}
          heading={`Upload and review evidence for ${phase.code}`}
          moveId={move.id}
          onOpenFiles={onOpenFiles}
          phase={phase.phase}
          title={`${phase.code} Evidence`}
        />
        <section className="mxw-zone">
          <h2>Evidence checklist</h2>
          <p>
            Upload the completed workshop outputs, extracts, and source files
            listed below. The File Cabinet is the source of truth for reviewing
            and approving them.
          </p>
          <EvidenceNeedTable evidenceNeedPackets={evidenceNeedPackets} />
        </section>
      </>
    );
  }

  if (substep === "findings") {
    return (
      <>
        <section className="mxw-assembly">
          <div>
            <span>a</span>
            <strong>What we found this phase</strong>
            <em>{findingsEvidenceLabel}</em>
          </div>
          <p>
            aVa groups current-state evidence into process, data, systems,
            controls, workforce, and value lanes. Claims that are not in the
            uploaded evidence stay marked as gaps.
          </p>
        </section>
        <CurrentStateReadinessPanel
          programId={move.id}
          readiness={currentStateReadiness}
          canApproveGates={canApproveGates}
        />
        <section className="mxw-zone">
          <h2>Findings to review</h2>
          <p>
            Review the evidence source or move to Approve &amp; Build. The gate
            will show remaining blockers and will not let unsupported claims
            become approved deliverables.
          </p>
          <div className="mxw-findings">
            {[
              [
                "Process",
                "Current handoffs, delays, rework, and decision points.",
              ],
              [
                "Systems",
                "Applications, data stores, integrations, and constraints.",
              ],
              [
                "Value",
                "Baseline metrics, run cost, leakage, and impact measures.",
              ],
            ].map(([lane, detail]) => (
              <article className="mxw-finding" key={lane}>
                <span>{lane}</span>
                <strong>{detail}</strong>
                <small>
                  Evidence-backed when cited; otherwise held as a gap.
                </small>
              </article>
            ))}
          </div>
          <div className="mxw-findings-actions">
            <button className="mxw-btn" onClick={onOpenFiles} type="button">
              Open Files &amp; Evidence
            </button>
          </div>
        </section>
      </>
    );
  }

  if (substep === "decide") {
    if (phase.phase === 1) {
      return (
        <>
          <DecisionEvidenceActionPanel
            buttonLabel="Upload decision files"
            evidenceFamilies={declarableEvidenceFamilies}
            heading="Upload evidence for P1"
            moveId={move.id}
            onOpenFiles={onOpenFiles}
            phase={phase.phase}
            title="Charter Decision Notes"
          />
          <section className="mxw-zone">
            <h2>Files to upload</h2>
            <p>
              Upload stakeholder input, scope workshop notes, success metric
              decisions, stakeholder map updates, or completed charter
              templates. Multiple files are allowed; uploaded files stay as Move
              evidence until reviewed.
            </p>
            <TemplatesAndSessions phase={phase} />
          </section>
        </>
      );
    }

    return (
      <>
        <section className="mxw-zone">
          <h2>Confirm the selected approach</h2>
          <p>
            Review the option selected in Compare Options. Return to that step
            if the team needs to change its choice.
          </p>
          <div className="mxw-decision-selected-option">
            <span>Selected option</span>
            <strong>
              {selectedP3Option
                ? `${selectedP3Option.id} · ${selectedP3Option.label}`
                : "No option selected yet"}
            </strong>
          </div>
        </section>
        <p className="mxw-muted-note">
          Supporting files can be added in Files &amp; Evidence and are reviewed
          before they count toward this phase.
        </p>
      </>
    );
  }

  if (substep === "options") {
    return (
      <>
        <section className="mxw-approach">
          <div>
            Assembled from your evidence + readiness - not a blank prompt
          </div>
          <h2>Recommended strategy path</h2>
          <p>
            The options are scored from the P2 design inputs, readiness gaps,
            controls, evidence constraints, and solution building blocks. aVa
            can improve narrative, but the option scores are deterministic.
          </p>
        </section>
        <section className="mxw-zone">
          <h2>Options & recommendation</h2>
          <P3OptionSummary optionSet={p3OptionSet} />
          <OptionCards
            optionSet={p3OptionSet}
            selectedOption={selectedOption}
            onSelectOption={onSelectOption}
          />
        </section>
      </>
    );
  }

  if (substep === "canvas" || substep === "workstreams") {
    const isHandoff = phase.phase === 5;
    const lanes = isHandoff
      ? [
          [
            "Receiving owners",
            "Name the business, delivery, and service owners who accept the approved roadmap handoff.",
          ],
          [
            "Open conditions",
            "Carry unresolved assumptions, dependencies, and decisions with accountable owners.",
          ],
          [
            "Adoption ownership",
            "Confirm who owns training, adoption, and operational change after handoff.",
          ],
          [
            "Tower measures",
            "Pass approved metric definitions, baselines, targets, and proof rules to Tower.",
          ],
        ]
      : [
          ["Process", "Workflow changes, decision rights, and handoff model."],
          ["Data", "Evidence, semantic layer, quality rules, and lineage."],
          [
            "Technology",
            "Integration, automation, platform, and control posture.",
          ],
          [
            "People",
            "Human + AI work split, adoption, and operating ownership.",
          ],
        ];
    return (
      <section className="mxw-zone">
        <h2>
          {substep === "canvas"
            ? "The Building-Blocks Canvas"
            : isHandoff
              ? "Handoff readiness"
              : "Plan workstreams"}
        </h2>
        <p>
          {substep === "canvas"
            ? "Define each lane only far enough to estimate effort, sequence the roadmap, and map risk."
            : isHandoff
              ? "Prepare the approved roadmap and its open conditions for Tower. Project execution happens after handoff, outside Moves."
              : "Define work packages, owners, dependencies, and sequence only to the level needed to estimate and approve the roadmap. Detailed execution planning follows approval."}
        </p>
        <div className="mxw-lanes">
          {lanes.map(([lane, detail], index) => (
            <article className="mxw-lane" key={lane}>
              <header>
                <span>{index + 1}</span>
                <strong>{lane}</strong>
              </header>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (substep === "value") {
    return (
      <section className="mxw-zone">
        <h2>The value case</h2>
        <p>
          Value stays explicit: projected impact, delivery cost, sensitivity,
          and assumptions.
        </p>
        <div className="mxw-value-grid">
          <div>
            <span>Projected</span>
            <strong>{moneyRange(move.valueAtStake)}</strong>
          </div>
          <div>
            <span>Evidence posture</span>
            <strong>{evidenceCount} items</strong>
          </div>
          <div>
            <span>Decision state</span>
            <strong>{move.status.text}</strong>
          </div>
        </div>
      </section>
    );
  }

  const nextPhaseContract =
    PHASES.find((item) => item.phase === phase.phase + 1) ?? null;
  const openRequiredEvidence = currentPhaseRequiredEvidenceGaps(
    evidenceNeedPackets,
    phase.phase,
  );
  const p0EvidenceGateCriterion = {
    id: "p0_source_evidence",
    label: "One uploaded P0 source file reviewed",
    completed:
      evidenceReadinessAvailable &&
      evidenceNeedPackets.some(
        (packet) =>
          packet.phase === 0 &&
          packet.familyId === "p0_origination_source" &&
          packet.status === "covered",
      ),
    severity: "hard" as const,
  };
  const hardGateCriteria = [
    ...move.gateCriteria.filter((criterion) => criterion.severity === "hard"),
    ...(phase.phase === 0 ? [p0EvidenceGateCriterion] : []),
  ];
  const softGateCriteria = move.gateCriteria.filter(
    (criterion) => criterion.severity === "soft",
  );
  // Whether the evaluator ran at all. `completed: false` on an UNEVALUATED
  // criterion is the correct open-gate direction and is left alone; only the
  // ledger's claims below change, so the tally stops asserting a count nobody
  // measured. Derived from `move.gateCriteria` alone — the synthesized P0
  // evidence criterion is this surface's own and is always evaluated.
  const gateCriteriaState = gateCriteriaVerification(move.gateCriteria);
  const openHardCriteria = hardGateCriteria.filter(
    (criterion) => !criterion.completed,
  );
  // Two of P0's three hard checks read the signed origination brief, and the
  // P0 gate approval is what signs it — so no control can clear them first.
  // Blocked-state reckoning below uses only the criteria a reader can act on;
  // `partitionOpenHardGateCriteria` is a no-op at P1+.
  const { actionable: actionableOpenHardCriteria } =
    partitionOpenHardGateCriteria({
      phase: phase.phase,
      openHardCriteria,
    });
  const hardMetCount = hardGateCriteria.filter(
    (criterion) => criterion.completed,
  ).length;
  const hardTotal = hardGateCriteria.length || move.gateCriteria.length;
  const openSoftCriteria = softGateCriteria.filter(
    (criterion) => !criterion.completed,
  );
  // One digest per half of the blocker list below, and the caveat sentence is
  // derived from the same open set. The hard half already counted what it left
  // out; the soft half did not, so up to four open caveats disappeared off the
  // end of a P4 list while the decision line called them a single caveat. See
  // `gate-criterion-digest`.
  const openHardCriteriaDigest = digestOpenGateCriteria(
    openHardCriteria,
    "hard",
  );
  const openSoftCriteriaDigest = digestOpenGateCriteria(
    openSoftCriteria,
    "soft",
  );
  // One resolution of the four causes, for every slot below that reports one.
  // `isGateBlocked` IS "a cause was found", so the reckoning and the sentences
  // cannot disagree about whether the gate is blocked or about why.
  const gateBlockedCause = resolveGateBlockedCause({
    gateClosed: isHistoricalPhase || gateApproved,
    evidenceReadinessAvailable,
    openRequiredEvidenceCount: openRequiredEvidence.length,
    phaseInputsBlocker: phaseCaptureBlocker,
    actionableOpenHardCount: actionableOpenHardCriteria.length,
    firstActionableHardLabel: actionableOpenHardCriteria[0]?.label ?? null,
  });
  const isGateBlocked = gateBlockedCause !== null;
  const approvalDecisionTitle =
    phaseApprovalDecisionTitle(approvalStanding, phase.code) ??
    (isGateBlocked
      ? `${phase.code} cannot advance yet`
      : `${phase.code} is ready for Approve & Build`);
  const approvalDecisionText =
    phaseApprovalDecisionText(
      approvalStanding,
      `${nextOpenPhaseContract.code} ${nextOpenPhaseContract.title}`,
    ) ??
    gateBlockedCause?.decisionText ??
    "Inputs, evidence posture, and hard gates are aligned. Run Approve & Build to create the governed package and submit the gate.";
  const approvalDecisionState =
    isHistoricalPhase || gateApproved
      ? "complete"
      : isGateBlocked
        ? "blocked"
        : "ready";
  const nextActionLabel = isHistoricalPhase
    ? terminalComplete
      ? "Open Tower"
      : `Continue to ${nextOpenPhaseContract.code}`
    : gateApproved
      ? "Review generated artifacts"
      : (gateBlockedCause?.nextActionLabel ?? "Run Approve & Build");
  const readinessPack = buildNextPhaseReadinessPack({
    nextPhaseLabel: nextPhaseContract
      ? `${nextPhaseContract.code} ${nextPhaseContract.title}`
      : "Tower handoff",
    nextPhaseNum: phase.phase + 1,
    isTerminalHandoff: !nextPhaseContract,
    evidenceNeedPackets,
    suggestedSessions: nextPhaseContract?.sessions ?? [],
    suggestedTemplates: nextPhaseContract?.templates ?? [],
    carriesForwardContent,
  });
  const phaseInputsReady = phase.phase === 0 || !phaseCaptureBlocker;
  const evidenceReady =
    phaseEvidencePassed || isHistoricalPhase || gateApproved;
  const generatedArtifactCount = phaseBuildArtifacts.length;
  const gateProofCount = evidenceCount || generatedArtifactCount;
  const gateProofNoun =
    evidenceCount > 0
      ? "evidence item"
      : generatedArtifactCount > 0
        ? "generated artifact"
        : "evidence item";
  const gateProofLabel = `${gateProofCount} ${gateProofNoun}${
    gateProofCount === 1 ? "" : "s"
  }`;
  const gateAttestationRows = [
    {
      item:
        phase.phase === 0
          ? "P0 brief reviewed for promotion."
          : `${phase.code} inputs complete`,
      meaning:
        phase.phase === 0
          ? "The seven origination answers are ready to become the P1 seed."
          : "Required phase fields are filled before Approve & Build runs.",
      met: isHistoricalPhase || gateApproved || phaseInputsReady,
    },
    {
      item: "Required evidence approved or waived",
      meaning:
        "Every required evidence need is covered by approved evidence or a recorded waiver. Uploaded or unreviewed files do not make this check green.",
      met: evidenceReady,
    },
    {
      item:
        phase.phase >= 1
          ? "Full phase close executed"
          : "Gate approval advances to P1",
      meaning:
        phase.phase >= 1
          ? "Approve & Build runs context extract, deliverable queue, gate approval, and next-phase handoff."
          : "P0 approval promotes the Move into P1 Charter.",
      met: isHistoricalPhase || gateApproved,
    },
  ];
  const canSubmitSatisfiedGate =
    !isHistoricalPhase &&
    phase.phase >= 1 &&
    openHardCriteria.length === 0 &&
    !phaseCaptureBlocker &&
    openRequiredEvidence.length === 0;
  const gateOnlyConfirmTitle =
    phase.phase >= 5
      ? "Complete P5 and hand off to Tower?"
      : `Approve the ${phase.code} gate?`;
  const gateOnlyConfirmSummary =
    phase.phase >= 5
      ? "This submits the already-satisfied P5 gate, records the terminal Tower handoff, and marks the Move complete. It does not regenerate artifacts."
      : gateOnlyConfirmSummaryFor(phase, nextOpenPhaseContract);
  // The cause's own `summaryLine` is read only on the EVALUATED arm below,
  // which is what stops a criterion being named as the blocker on the strength
  // of an answer the evaluator did not compute. A second `evaluated` guard
  // inside the resolver would be unkillable: no input reaches that line in the
  // unevaluated case.
  //
  // The READY arm is derived too: it used to name the first open caveat in the
  // singular however many were open. See `gate-criterion-digest`.
  const gateSummaryLine = gateBlockedCause
    ? !gateCriteriaState.evaluated
      ? gateCriteriaState.summaryLabel
      : gateBlockedCause.summaryLine
    : (readyWithCaveatsSentence(openSoftCriteria) ??
      "No hard blockers are open.");
  // "the approved record" named a decision this screen does not read, on a
  // line keyed to READINESS — `isFullyReady` is a statement about open prep
  // items, and says nothing about an approval at all. Say what the branch
  // measured. Same class as the standing claims above; see
  // `phase-approval-standing`.
  const nextPhaseSummaryLine = readinessPack.isFullyReady
    ? `${readinessPack.nextPhaseLabel} can start from this phase's record.`
    : `${readinessPack.openNeeds.length} prep item${
        readinessPack.openNeeds.length === 1 ? "" : "s"
      } will carry into ${readinessPack.nextPhaseLabel}.`;
  const gateWhyLabel = isGateBlocked
    ? "Why blocked"
    : gateApproved || isHistoricalPhase
      ? "What changed"
      : "Why ready";
  const gateWhyPrimary = gateSummaryLine;
  const gateWhyNext = isGateBlocked
    ? nextActionLabel
    : gateApproved || isHistoricalPhase
      ? nextPhaseSummaryLine
      : nextActionLabel;

  return (
    <>
      {phase.phase === 0 ? <P0CapturedBriefReview move={move} /> : null}
      {phase.phase >= 1 && phase.phase <= 2 && !isHistoricalPhase ? (
        <PhaseCaptureEditor
          compact
          completeCount={phaseCaptureCompleteCount}
          evidencePassed={phaseEvidencePassed}
          phaseHardGatesPassed={phaseHardGatesPassed}
          evidenceReadinessAvailable={evidenceReadinessAvailable}
          businessChangeAssessment={businessChangeAssessment}
          approvedEvidenceReferences={approvedEvidenceReferences}
          approvedCaptureEvidenceReferences={approvedCaptureEvidenceReferences}
          reviewerIdentity={reviewerIdentity}
          onChange={onPhaseCaptureValueChange}
          phase={phase}
          persistedValues={persistedPhaseCaptureValues}
          saveErrors={phaseCaptureSaveErrors}
          saveStatus={phaseCaptureSaveStatus}
          sections={phaseCaptureSections}
          values={phaseCaptureValues}
        />
      ) : null}
      <section className="mxw-review">
        <h2>{phase.phase === 0 ? "Decision checks" : "Gate approval"}</h2>
        {isHistoricalPhase ? (
          <p>
            {phaseApprovalGateNote(
              approvalStanding,
              `${nextOpenPhaseContract.code} ${nextOpenPhaseContract.title}`,
            )}
          </p>
        ) : (
          <p>
            Left-side checks mean the step inputs are captured. This gate
            advances only after required evidence, outputs, and approvals pass.
          </p>
        )}
        <div
          className={`mxw-decision-surface ${approvalDecisionState}`}
          data-testid="mxw-decision-surface"
        >
          <article className="mxw-decision-primary">
            <span className="mxw-exec-label">Decision</span>
            <h3>{approvalDecisionTitle}</h3>
            <p>{approvalDecisionText}</p>
            <div className="mxw-decision-chips">
              <span>
                {hardMetCount}/{hardTotal} hard gates met
              </span>
              <button
                type="button"
                className="mxw-evidence-count-link"
                onClick={onOpenFiles}
                aria-label={`${gateProofLabel} — open Files & Evidence`}
              >
                {gateProofLabel}
              </button>
              <span>{nextActionLabel}</span>
            </div>
          </article>
          <div
            className="mxw-gate-why-panel"
            aria-label="Gate blocker explanation"
          >
            <div className="mxw-gate-why-copy">
              <span className="mxw-exec-label">{gateWhyLabel}</span>
              <strong>{gateWhyPrimary}</strong>
              <p>{gateWhyNext}</p>
            </div>
            <div className="mxw-gate-why-proof">
              <button
                type="button"
                className="mxw-evidence-count-link mxw-evidence-count-link-strong"
                onClick={onOpenFiles}
                aria-label={`${gateProofLabel} — open Files & Evidence`}
              >
                {gateProofLabel}
              </button>
              <span>{readinessPack.nextPhaseLabel}</span>
            </div>
            {isGateBlocked || openSoftCriteria.length > 0 ? (
              <ul className="mxw-gate-blocker-list">
                {openHardCriteriaDigest.shown.map((criterion) => (
                  <li key={criterion.id}>
                    <strong>Hard:</strong> {criterion.label}
                  </li>
                ))}
                {openHardCriteriaDigest.remainderLabel ? (
                  <li data-testid="mxw-gate-hard-remainder">
                    <strong>Hard:</strong>{" "}
                    {openHardCriteriaDigest.remainderLabel}
                  </li>
                ) : null}
                {openSoftCriteriaDigest.shown.map((criterion) => (
                  <li key={criterion.id}>
                    <strong>Caveat:</strong> {criterion.label}
                  </li>
                ))}
                {openSoftCriteriaDigest.remainderLabel ? (
                  <li data-testid="mxw-gate-soft-remainder">
                    <strong>Caveat:</strong>{" "}
                    {openSoftCriteriaDigest.remainderLabel}
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </div>
        {!isHistoricalPhase && phase.phase >= 3 ? (
          <DecisionOptionsActionPanel
            moveId={move.id}
            moveName={displayMoveName}
            phase={phase.phase}
          />
        ) : null}
        <details className="mxw-gate-detail">
          <summary>
            <span>Gate execution checklist</span>
            <strong>
              {gateAttestationRows.filter((item) => item.met).length}/
              {gateAttestationRows.length} complete
            </strong>
          </summary>
          <ul className="mxw-gate-mini-list">
            {gateAttestationRows.map((item) => (
              <li className={item.met ? "met" : "pending"} key={item.item}>
                <span aria-hidden>{item.met ? "✓" : "○"}</span>
                <div>
                  <strong>{item.item}</strong>
                  <p>{item.meaning}</p>
                </div>
                <em>{item.met ? "Done" : "Open"}</em>
              </li>
            ))}
          </ul>
        </details>
        {gateApprovalMessage ? (
          <div className={`mxw-gate-message ${gateApprovalStatus}`}>
            {gateApprovalMessage}
          </div>
        ) : null}
        {phase.phase === 0 &&
        !isHistoricalPhase &&
        actionableOpenHardCriteria.length > 0 ? (
          <div className="mxw-gate-note">
            <strong>Why some checks are still open</strong>
            <span>
              P0 cannot advance on intake answers alone. Upload one source file
              for this Move in Files &amp; Evidence, review its extracted
              content, then return here for authorized user approval. The brief
              is signed and P1 opens only after the evidence requirement and
              other hard checks pass.
            </span>
          </div>
        ) : null}
        <div className="mxw-approve-build" id="mxw-approve-build-action">
          {isHistoricalPhase ? (
            <StepHeaderActionPortal>
              <button
                className="mxw-gate-button mxw-step-gate-button"
                onClick={onContinueCurrentPhase}
                type="button"
              >
                {terminalComplete
                  ? "Open Tower →"
                  : `Continue to ${nextOpenPhaseContract.code} ${nextOpenPhaseContract.title} →`}
              </button>
            </StepHeaderActionPortal>
          ) : phase.phase >= 1 && canApproveGates && canSubmitSatisfiedGate ? (
            <>
              <StepHeaderActionPortal>
                <button
                  className="mxw-gate-button mxw-step-gate-button"
                  disabled={gateApprovalStatus === "approving"}
                  onClick={() => setP0ConfirmOpen(true)}
                  type="button"
                >
                  {gateApprovalStatus === "approving"
                    ? "Approving..."
                    : phase.phase >= 5
                      ? "Complete P5 and open Tower →"
                      : `Approve ${phase.code} gate →`}
                </button>
              </StepHeaderActionPortal>
              <GateApprovalConfirmDialog
                open={p0ConfirmOpen}
                title={gateOnlyConfirmTitle}
                summary={gateOnlyConfirmSummary}
                disclosure={charterGateDisclosure}
                approverLabel={approverLabel}
                confirmLabel={
                  phase.phase >= 5 ? "Complete and hand off" : "Approve gate"
                }
                onCancel={() => setP0ConfirmOpen(false)}
                onConfirm={() => {
                  setP0ConfirmOpen(false);
                  // Gate-only path: this phase's outputs were already built,
                  // so it settles as one succeeded gate artifact and nothing
                  // failed.
                  void onApproveAfterBuild({
                    succeededKeys: ["prebuilt_gate_outputs"],
                    failedKeys: [],
                    total: 1,
                    succeeded: [
                      {
                        deliverableTypeKey: "prebuilt_gate_outputs",
                        gateArtifact: true,
                      },
                    ],
                    failed: [],
                  });
                }}
              />
            </>
          ) : phase.phase >= 1 && canApproveGates ? (
            <PhaseApproveAndBuild
              archetype={move.archetype}
              approverLabel={approverLabel}
              canApproveGates={canApproveGates}
              clientDisplayName={move.tenant.name}
              disabledReason={phaseCaptureBlocker}
              deliverableKeys={phaseCanonicalKeysForRoute(
                phase.phase,
                confirmedSolutionRoute,
              )}
              evidenceNeedPackets={evidenceNeedPackets}
              inputCount={phaseCaptureCompleteCount}
              initialArtifacts={phaseBuildArtifacts}
              moveId={move.id}
              moveName={displayMoveName}
              onBeforeBuild={onFinalizePhaseCapture}
              onBuildSettled={onApproveAfterBuild}
              blockOnEvidenceGaps
              actionPortalTargetId="mxw-step-progress-action"
              phaseLabel={`${phase.code} ${phase.title}`}
              phaseNum={phase.phase}
            />
          ) : phase.phase >= 1 ? (
            <StepHeaderActionPortal>
              <span className="mxw-gate-note">
                Approval is available to an authorized workspace user.
              </span>
            </StepHeaderActionPortal>
          ) : canApproveGates ? (
            <>
              {openRequiredEvidence.length === 0 ? (
                <StepHeaderActionPortal>
                  <button
                    className="mxw-gate-button mxw-step-gate-button"
                    disabled={gateApprovalStatus === "approving"}
                    onClick={() => setP0ConfirmOpen(true)}
                    type="button"
                  >
                    {gateApprovalStatus === "approving"
                      ? "Approving..."
                      : "Approve gate →"}
                  </button>
                </StepHeaderActionPortal>
              ) : null}
              <GateApprovalConfirmDialog
                open={p0ConfirmOpen}
                title="Approve the P0 gate?"
                summary="This records your approval of the origination brief and unlocks P1 Charter. Your signed-in account must have Move approval permission. At least one uploaded P0 source file must already have a human-approved extraction."
                approverLabel={approverLabel}
                confirmLabel="Approve gate"
                onCancel={() => setP0ConfirmOpen(false)}
                onConfirm={() => {
                  setP0ConfirmOpen(false);
                  void onApproveP0Gate();
                }}
              />
            </>
          ) : (
            <StepHeaderActionPortal>
              <span className="mxw-gate-note">
                Approval is available to an authorized workspace user.
              </span>
            </StepHeaderActionPortal>
          )}
        </div>
        {isHistoricalPhase ? (
          <div className="mxw-approved">
            <strong>
              ✓ {phaseApprovalCompletionHeadline(approvalStanding, phase.code)}
            </strong>
            <span>
              {terminalComplete
                ? "Tower is now the execution and value-tracking surface for this Move."
                : `Continue to ${nextOpenPhaseContract.code} ${nextOpenPhaseContract.title} to keep working from the current phase.`}
            </span>
          </div>
        ) : gateApproved ? (
          <div className="mxw-approved">
            <strong>✓ Gate approved.</strong>
            <span>
              Use the run rows above for build proof, then open Files & Evidence
              to inspect the completed artifacts.
            </span>
          </div>
        ) : null}
      </section>
      {phase.phase === 0 && !isHistoricalPhase ? (
        <section className="mxw-gate">
          <header>
            <div>
              <h2>Gate criteria</h2>
              <p>
                Hard criteria block the next phase. Soft criteria can carry
                forward as explicit caveats in the gate record.
              </p>
            </div>
            <strong>
              {gateCriteriaState.evaluated ? (
                <>
                  {
                    hardGateCriteria.filter((criterion) => criterion.completed)
                      .length
                  }{" "}
                  of {hardGateCriteria.length || move.gateCriteria.length}
                </>
              ) : (
                gateCriteriaState.countLabel
              )}
            </strong>
          </header>
          {gateCriteriaState.evaluated ? null : (
            <p className="mxw-gate-unevaluated">{gateCriteriaState.notice}</p>
          )}
          {move.gateCriteria.length > 0 ? (
            <>
              <div className="mxw-gate-group">
                <span className="mxw-gate-group-label">Blocking hard gate</span>
                {(hardGateCriteria.length
                  ? hardGateCriteria
                  : move.gateCriteria
                ).map((criterion) => (
                  <span
                    className={`${criterion.completed ? "met" : ""} ${
                      phase.phase === 0 &&
                      isP0ApprovalGeneratedCriterion(criterion.id)
                        ? "approval-generated"
                        : ""
                    }`}
                    key={criterion.id}
                  >
                    {criterion.completed ? "✓" : "○"} {criterion.label}
                    {gateCriteriaState.evaluated ? null : (
                      <em>{gateCriteriaState.markLabel}</em>
                    )}
                    {gateCriteriaState.evaluated &&
                    phase.phase === 0 &&
                    !criterion.completed &&
                    isP0ApprovalGeneratedCriterion(criterion.id) ? (
                      <em>Completed by approving this gate</em>
                    ) : null}
                  </span>
                ))}
              </div>
              {softGateCriteria.length > 0 ? (
                <div className="mxw-gate-group">
                  <span className="mxw-gate-group-label">
                    Carry-forward soft criteria
                  </span>
                  {softGateCriteria.map((criterion) => (
                    <span
                      className={criterion.completed ? "met" : "soft-open"}
                      key={criterion.id}
                    >
                      {criterion.completed ? "✓" : "○"} {criterion.label}
                      {!criterion.completed ? (
                        <em>Can carry as a caveat</em>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div>
              <span>No gate criteria are configured for this transition.</span>
            </div>
          )}
        </section>
      ) : null}
      {phase.phase >= 1 ? (
        <div
          className="mxw-approval-disclosures"
          aria-label={`${phase.code} approval supporting detail`}
        >
          {!isHistoricalPhase ? (
            <details>
              <summary>
                <span>Gate criteria</span>
                <strong>
                  {gateCriteriaState.evaluated ? (
                    <>
                      {
                        hardGateCriteria.filter(
                          (criterion) => criterion.completed,
                        ).length
                      }{" "}
                      of {hardGateCriteria.length || move.gateCriteria.length}{" "}
                      hard met
                    </>
                  ) : (
                    gateCriteriaState.countLabel
                  )}
                </strong>
              </summary>
              {gateCriteriaState.evaluated ? null : (
                <p className="mxw-gate-unevaluated">
                  {gateCriteriaState.notice}
                </p>
              )}
              {move.gateCriteria.length > 0 ? (
                <>
                  <div className="mxw-gate-group compact">
                    <span className="mxw-gate-group-label">
                      Blocking hard gate
                    </span>
                    {(hardGateCriteria.length
                      ? hardGateCriteria
                      : move.gateCriteria
                    ).map((criterion) => (
                      <span
                        className={criterion.completed ? "met" : ""}
                        key={criterion.id}
                      >
                        {criterion.completed ? "✓" : "○"} {criterion.label}
                        {gateCriteriaState.evaluated ? null : (
                          <em>{gateCriteriaState.markLabel}</em>
                        )}
                      </span>
                    ))}
                  </div>
                  {softGateCriteria.length > 0 ? (
                    <div className="mxw-gate-group compact">
                      <span className="mxw-gate-group-label">
                        Carry-forward soft criteria
                      </span>
                      {softGateCriteria.map((criterion) => (
                        <span
                          className={criterion.completed ? "met" : "soft-open"}
                          key={criterion.id}
                        >
                          {criterion.completed ? "✓" : "○"} {criterion.label}
                          {!criterion.completed ? (
                            <em>Can carry as a caveat</em>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p>No gate criteria are configured for this transition.</p>
              )}
            </details>
          ) : null}
          <details>
            <summary>
              <span>Next: {readinessPack.nextPhaseLabel} readiness</span>
              <strong>
                {readinessPack.openNeeds.length === 0
                  ? "No required gaps"
                  : `${readinessPack.openNeeds.length} prep item${
                      readinessPack.openNeeds.length === 1 ? "" : "s"
                    }`}
              </strong>
            </summary>
            <p>
              {readinessPack.isFullyReady
                ? "No required evidence gaps are open for the next phase. It can start with what's already on file."
                : "Bring these before the next phase starts, so it never opens cold."}
            </p>
            {readinessPack.openNeeds.length > 0 ? (
              <div className="mxw-readiness-needs compact">
                {readinessPack.openNeeds.map((need) => (
                  <article
                    className={`mxw-readiness-need ${need.priority}`}
                    key={need.evidenceSlot}
                  >
                    <header>
                      <strong>{need.evidenceSlot}</strong>
                      <span>{need.priority}</span>
                    </header>
                    <p>{need.whyItMatters}</p>
                    <div className="mxw-rn-meta">
                      <span>Format: {need.acceptedFormats.join(", ")}</span>
                      <span>Template: {need.exampleTemplate}</span>
                    </div>
                    <em>{need.nextAction}</em>
                  </article>
                ))}
              </div>
            ) : null}
            {readinessPack.carriesForwardContent.length > 0 ? (
              <div className="mxw-readiness-carries">
                <h3>Carries forward from this phase&apos;s generated work</h3>
                {readinessPack.carriesForwardContent.map((signal) => (
                  <article className="mxw-readiness-carry" key={signal.key}>
                    <strong>{signal.heading}</strong>
                    <p>{signal.snippet}</p>
                  </article>
                ))}
              </div>
            ) : null}
            {readinessPack.suggestedSessions.length > 0 ? (
              <div className="mxw-readiness-sessions">
                <h3>
                  Suggested working sessions for {readinessPack.nextPhaseLabel}
                </h3>
                <div>
                  {readinessPack.suggestedSessions.map((session) => (
                    <span key={session}>{session}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </details>
        </div>
      ) : (
        <section className="mxw-readiness">
          <h2>Next: {readinessPack.nextPhaseLabel} readiness</h2>
          <p>
            {readinessPack.isFullyReady
              ? "No required evidence gaps are open for the next phase. It can start with what's already on file."
              : "Bring these before the next phase starts, so it never opens cold."}
          </p>
          {readinessPack.openNeeds.length > 0 ? (
            <div className="mxw-readiness-needs">
              {readinessPack.openNeeds.map((need) => (
                <article
                  className={`mxw-readiness-need ${need.priority}`}
                  key={need.evidenceSlot}
                >
                  <header>
                    <strong>{need.evidenceSlot}</strong>
                    <span>{need.priority}</span>
                  </header>
                  <p>{need.whyItMatters}</p>
                  <div className="mxw-rn-meta">
                    <span>Format: {need.acceptedFormats.join(", ")}</span>
                    <span>Template: {need.exampleTemplate}</span>
                  </div>
                  <em>{need.nextAction}</em>
                </article>
              ))}
            </div>
          ) : null}
          {readinessPack.suggestedSessions.length > 0 ? (
            <div className="mxw-readiness-sessions">
              <h3>
                Suggested working sessions for {readinessPack.nextPhaseLabel}
              </h3>
              <div>
                {readinessPack.suggestedSessions.map((session) => (
                  <span key={session}>{session}</span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </>
  );
}

function charterText(
  charter: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const scaffold = charter?.scaffold;
  if (scaffold && typeof scaffold === "object") {
    const value = (scaffold as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  const value = charter?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function P0CapturedBriefReview({ move }: { move: StrategicMove }) {
  const displayMoveName = demoSafeClientText(move.name);
  const rows = [
    {
      label: "Business problem / opportunity",
      value: charterText(move.charter, "problem_statement"),
    },
    {
      label: "Archetype classification",
      value:
        charterText(move.charter, "archetype") ||
        charterText(move.charter, "classification") ||
        move.archetype,
    },
    {
      label: "Sponsor / title",
      value: charterText(move.charter, "sponsor_candidate"),
    },
    {
      label: "Scope / boundary",
      value: charterText(move.charter, "scope_boundary"),
    },
    {
      label: "Evidence families",
      value: charterText(move.charter, "evidence_family"),
    },
    {
      label: "Value hypothesis",
      value: charterText(move.charter, "value_hypothesis"),
    },
    {
      label: "Foundation readiness",
      value: charterText(move.charter, "foundation_readiness"),
    },
  ];
  // Both sides of the figure come from the row set above — the denominator was
  // a literal `7`, a third copy of a fact already stated by the array and by
  // the heading, so any row added or removed made two of the three lie.
  const briefReview = summariseCapturedBrief(rows);

  return (
    <section className="mxw-p0-brief-review" aria-label="Captured P0 brief">
      <header>
        <div>
          <span>P0 brief captured</span>
          <h2>Review the Originate answers saved here</h2>
          <p>
            These are the answers saved from Start a Move. Gate criteria below
            are a separate governance checklist.
          </p>
        </div>
        <strong>{briefReview.tally}</strong>
      </header>
      <div className="mxw-p0-brief-name">
        <span>Move name</span>
        <strong>{displayMoveName}</strong>
      </div>
      <div className="mxw-p0-brief-grid">
        {rows.map((row, index) => (
          <article
            className={row.value ? "captured" : "missing"}
            key={row.label}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{row.label}</strong>
              <p>{row.value || "Not captured in the saved P0 brief."}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function P0OriginationHandoff({ move }: { move: StrategicMove }) {
  const displayMoveName = demoSafeClientText(move.name);
  return (
    <section className="mxw-zone mxw-p0-handoff">
      <div className="mxw-p0-handoff-kicker">P0 origination captured</div>
      <h2>Review the captured Move brief and approve the gate</h2>
      <p>
        The seven-question P0 origination flow now lives in the dedicated Start
        a Move workspace. This phase route is the governed shell for review,
        attestation, Files & Evidence, and gate approval.
      </p>
      <div className="mxw-p0-handoff-card">
        <span>Move</span>
        <strong>{displayMoveName}</strong>
        <em>
          Use the step navigation above to continue to Gate approval when the
          brief, sponsor role, scope, value hypothesis, evidence families, and
          readiness assumptions are ready to carry into P1 Charter.
        </em>
      </div>
    </section>
  );
}

function buildPhaseCaptureItems({
  persistedCaptureValues,
}: {
  /** Authoritative values already persisted server-side for this phase. */
  persistedCaptureValues: Record<string, string>;
}): Record<string, string> {
  // Authoritative values are the values already persisted server-side for this
  // phase. The client must not synthesize capture from charter fallbacks,
  // selected options, phase templates, or evidence summaries and then POST that
  // text back as if a human captured it. Empty means not captured.
  return { ...persistedCaptureValues };
}

function statusLabel(status: MoveEvidenceNeedPacket["status"]): string {
  if (status === "covered") return "Covered";
  if (status === "partial") return "Partial";
  if (status === "waived") return "Waived";
  if (status === "not_applicable") return "N/A";
  return "Missing";
}

function PhasePreparePanel({
  evidenceNeedPackets,
  move,
  nextWorkflowLabel,
  phase,
  terminalComplete,
}: {
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
  move: StrategicMove;
  nextWorkflowLabel: string;
  phase: PhaseContract;
  terminalComplete: boolean;
}) {
  const openHardGateCount = move.gateCriteria.filter(
    (criterion) => !criterion.completed && criterion.severity === "hard",
  ).length;
  const missingEvidenceCount = evidenceNeedPackets.filter(
    (packet) => packet.status === "missing" || packet.status === "partial",
  ).length;

  return (
    <section
      className="mxw-command"
      aria-label={`${phase.code} workflow command center`}
    >
      <header>
        <div>
          <span>{phase.code} stage plan</span>
          <h2>
            {terminalComplete
              ? "Tower handoff complete"
              : "Phase operating brief"}
          </h2>
          <p>
            {terminalComplete
              ? "This Move is complete. Tower is now the execution and value-tracking surface."
              : "Review this phase brief, then continue to the next workflow step. Evidence review and phase approval remain separate checks."}
          </p>
        </div>
        <strong>{phase.code}</strong>
      </header>
      <div className="mxw-command-table">
        <div>
          <span>Purpose</span>
          <p>
            Confirm what {phase.code} must prove before the next gate can carry
            the work forward.
          </p>
          <b>{phase.title}</b>
        </div>
        <div>
          <span>Do now</span>
          <p>
            Check the sessions, templates, evidence slots, and open blockers
            below before continuing to the next workflow step.
          </p>
          <b>Prepare</b>
        </div>
        <div>
          <span>Done when</span>
          <p>
            The team understands the phase purpose and current evidence needs.
          </p>
          <b>Continue to {nextWorkflowLabel}</b>
        </div>
        <div>
          <span>Live state</span>
          <p>
            {missingEvidenceCount} missing or partial evidence item
            {missingEvidenceCount === 1 ? "" : "s"} · {openHardGateCount} hard
            gate{openHardGateCount === 1 ? "" : "s"} open.
          </p>
          <b>Current phase</b>
        </div>
      </div>
      <div className="mxw-command-grid">
        <article>
          <span>Recommended sessions</span>
          <ul>
            {phase.sessions.map((session) => (
              <li key={session}>{session}</li>
            ))}
          </ul>
        </article>
        <article>
          <span>Templates to complete</span>
          <ul>
            {phase.templates.map((template) => (
              <li key={template.name}>
                {template.name} <em>{template.type}</em>
              </li>
            ))}
          </ul>
        </article>
        <article>
          <span>Current blockers</span>
          <ul>
            <li>
              {missingEvidenceCount} evidence item
              {missingEvidenceCount === 1 ? "" : "s"} missing or partial
            </li>
            <li>
              {openHardGateCount} hard gate{openHardGateCount === 1 ? "" : "s"}{" "}
              open
            </li>
            <li>Next workflow step: {nextWorkflowLabel}</li>
          </ul>
        </article>
      </div>
      <EvidenceNeedTable evidenceNeedPackets={evidenceNeedPackets} compact />
    </section>
  );
}

function EvidenceNeedTable({
  compact = false,
  evidenceNeedPackets,
}: {
  compact?: boolean;
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
}) {
  if (evidenceNeedPackets.length === 0) {
    return (
      <div className="mxw-evidence-table empty">
        No required evidence checklist has been generated for this phase.
      </div>
    );
  }

  return (
    <div className={`mxw-evidence-table ${compact ? "compact" : ""}`}>
      <div className="mxw-evidence-row head">
        <span>Evidence needed</span>
        <span>Why it matters</span>
        <span>Status</span>
      </div>
      {evidenceNeedPackets.slice(0, compact ? 5 : undefined).map((packet) => (
        <div
          className="mxw-evidence-row"
          key={`${packet.familyId}-${packet.evidenceSlot}`}
        >
          <strong>{packet.evidenceSlot}</strong>
          <p>{packet.whyItMatters}</p>
          <em className={packet.status}>{statusLabel(packet.status)}</em>
        </div>
      ))}
      {compact && evidenceNeedPackets.length > 5 ? (
        <div className="mxw-evidence-more">
          +{evidenceNeedPackets.length - 5} more in Upload &amp; review
        </div>
      ) : null}
    </div>
  );
}

function DecisionOptionsActionPanel({
  moveId,
  moveName,
  phase,
}: {
  moveId: string;
  moveName: string;
  phase: number;
}) {
  const defaultOptions = useMemo(
    () => [
      {
        label: "Continue with current approach",
        rationaleFor: "Lowest disruption and fastest validation path.",
        rationaleAgainst: "May leave structural gaps unresolved.",
      },
      {
        label: "Balanced transformation path",
        rationaleFor:
          "Balances value, control, feasibility, and change readiness.",
        rationaleAgainst:
          "Requires coordinated business, data, technology, and adoption work.",
      },
      {
        label: "Full redesign",
        rationaleFor:
          "Highest long-term value if evidence supports broader change.",
        rationaleAgainst:
          "Highest readiness burden; accountable business owner and adoption plan required.",
      },
    ],
    [],
  );
  const [title, setTitle] = useState(
    `${moveName} P${phase} key design decision`,
  );
  const [ownerRole, setOwnerRole] = useState("Authorized workspace user");
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [options, setOptions] = useState(defaultOptions);
  const [status, setStatus] = useState<DecisionOptionSaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [dossierPath, setDossierPath] = useState<string | null>(null);

  function updateOption(
    index: number,
    key: "label" | "rationaleFor" | "rationaleAgainst",
    value: string,
  ) {
    setOptions((prev) =>
      prev.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [key]: value } : option,
      ),
    );
  }

  async function recordDecision() {
    setStatus("saving");
    setMessage("Recording decision options...");
    setDossierPath(null);
    const res = await fetch(`/api/v1/programs/${moveId}/decision-options`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        ownerRole,
        options: options
          .filter((option) => option.label.trim())
          .map((option, index) => ({
            ...option,
            isSelected: index === selectedIndex,
          })),
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      detail?: string;
      error?: string;
      dossierPath?: string;
    };
    if (!res.ok || !payload.ok) {
      setStatus("error");
      setMessage(
        payload.detail ||
          payload.error ||
          `Decision record failed (HTTP ${res.status})`,
      );
      return;
    }
    setStatus("saved");
    setMessage("Decision options recorded on the dossier.");
    setDossierPath(payload.dossierPath ?? null);
  }

  return (
    <section className="mxw-kdd" aria-label="Record key design decision">
      <details>
        <summary>
          <span>Key design decision</span>
          <strong>Record selected and rejected options</strong>
          <em>{status === "saved" ? "Saved" : "Optional before approval"}</em>
        </summary>
        <div className="mxw-kdd-body">
          <div className="mxw-kdd-fields">
            <label>
              Decision title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Owner role
              <input
                value={ownerRole}
                onChange={(event) => setOwnerRole(event.target.value)}
              />
            </label>
          </div>
          <div className="mxw-kdd-options">
            {options.map((option, index) => (
              <article
                className={selectedIndex === index ? "selected" : ""}
                key={index}
              >
                <label className="mxw-kdd-radio">
                  <input
                    checked={selectedIndex === index}
                    name="mxw-kdd-selected"
                    onChange={() => setSelectedIndex(index)}
                    type="radio"
                  />
                  Selected option
                </label>
                <input
                  aria-label={`Option ${index + 1} label`}
                  onChange={(event) =>
                    updateOption(index, "label", event.target.value)
                  }
                  value={option.label}
                />
                <textarea
                  aria-label={`Option ${index + 1} rationale for`}
                  onChange={(event) =>
                    updateOption(index, "rationaleFor", event.target.value)
                  }
                  rows={2}
                  value={option.rationaleFor}
                />
                <textarea
                  aria-label={`Option ${index + 1} rationale against`}
                  onChange={(event) =>
                    updateOption(index, "rationaleAgainst", event.target.value)
                  }
                  rows={2}
                  value={option.rationaleAgainst}
                />
              </article>
            ))}
          </div>
          <div className="mxw-kdd-actions">
            <button
              className="mxw-btn mxw-secondary"
              disabled={status === "saving"}
              onClick={() => void recordDecision()}
              type="button"
            >
              {status === "saving" ? "Recording..." : "Record decision"}
            </button>
            {message ? <span className={status}>{message}</span> : null}
            {dossierPath ? <Link href={dossierPath}>Open dossier</Link> : null}
          </div>
        </div>
      </details>
    </section>
  );
}

function DecisionEvidenceActionPanel({
  buttonLabel,
  evidenceFamilies,
  heading,
  onOpenFiles,
  moveId,
  phase,
  secondaryAction = false,
  title,
}: {
  buttonLabel: string;
  evidenceFamilies?: Array<{ id: string; label: string }>;
  heading: string;
  onOpenFiles?: () => void;
  moveId: string;
  phase: number;
  secondaryAction?: boolean;
  title: string;
}) {
  return (
    <section
      className={`mxw-action-panel ${secondaryAction ? "supporting" : ""}`}
      aria-label={heading}
    >
      <div>
        <span>Action required</span>
        <h2>{heading}</h2>
        <p>
          Upload working-session files here. They remain evidence until a human
          reviews them; uploading alone does not clear the phase gate.
        </p>
      </div>
      <EvidenceUploadControl
        buttonLabel={buttonLabel}
        evidenceFamilies={evidenceFamilies}
        moveId={moveId}
        onOpenFiles={onOpenFiles}
        phase={phase}
        secondaryAction={secondaryAction}
        title={title}
      />
    </section>
  );
}

type CurrentStateInstrument = ReadinessReport["instruments"][number];

type FamilyUploadResult = {
  familyKey: string;
  familyLabel: string;
  fileName: string;
  status: "uploaded" | "error";
  detail: string;
};

function CurrentStateFamilyUploadPanel({
  moveId,
  onOpenFiles,
  onRefreshPhase,
  phase,
  readiness,
}: {
  moveId: string;
  onOpenFiles: () => void;
  onRefreshPhase: () => void;
  phase: number;
  readiness: ReadinessReport;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadMode, setUploadMode] = useState<
    "readiness_evidence" | "session_notes"
  >("readiness_evidence");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<FamilyUploadResult[]>([]);
  // What this batch of files is declared to cover. Empty means "decide from
  // the file name", which is what this surface used to do for every file with
  // no way to say otherwise.
  const [declaredFamilyKey, setDeclaredFamilyKey] = useState("");
  const documentFamilies = readiness.instruments.filter(
    (instrument) => instrument.documentFamily,
  );
  const openFamilies = readiness.instruments.filter(
    (instrument) => instrument.status !== "committed",
  );
  // Every open family on the readiness map is offered, so the table below and
  // the control above it ask for the same set: no family is named as needed
  // while being impossible to declare.
  const declarableFamilies = declarableCurrentStateFamilies(openFamilies);
  const reviewRequiredCount = documentFamilies.filter(
    (instrument) => instrument.status === "review_required",
  ).length;

  async function uploadFileForFamily(
    file: File,
    instrument: CurrentStateInstrument,
  ): Promise<FamilyUploadResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("phase", String(phase));
    form.append("family", instrument.key);
    form.append("archetypeId", readiness.archetypeId);
    const res = await fetch(
      `/api/v1/programs/${moveId}/current-state/ingest-doc`,
      {
        method: "POST",
        credentials: "include",
        body: form,
      },
    );
    const payload = (await res.json().catch(() => ({}))) as {
      reviewState?: string;
      sourceArtifactId?: string;
      sourceArtifactStored?: boolean;
      detail?: string;
      error?: string;
    };
    if (!res.ok) {
      return {
        familyKey: instrument.key,
        familyLabel: instrument.label,
        fileName: file.name,
        status: "error",
        detail:
          payload.detail ||
          payload.error ||
          `Upload failed (HTTP ${res.status})`,
      };
    }
    if (!payload.sourceArtifactId || payload.sourceArtifactStored !== true) {
      return {
        familyKey: instrument.key,
        familyLabel: instrument.label,
        fileName: file.name,
        status: "error",
        detail:
          "The original source was not retained in the Artifact Vault, so this upload is not available for review or generation.",
      };
    }
    return {
      familyKey: instrument.key,
      familyLabel: instrument.label,
      fileName: file.name,
      status: "uploaded",
      detail:
        payload.reviewState === "committed"
          ? "Original retained in the Artifact Vault; committed to readiness"
          : "Original retained in the Artifact Vault; awaiting human review",
    };
  }

  /**
   * Structured upload for a canonical-backed family.
   *
   * These families (DORA, CMDB, workforce) declare a `backing` tower table, so
   * `isDocumentFamily` is false for them and the document path can never map
   * them. The parse/commit handlers already exist in current-state-ingest.ts —
   * this dispatches to them instead of refusing the file.
   *
   * Before this, the readiness gap said "Upload CMDB export as CSV" while the
   * only uploader on the step routed to the document path and rejected it. The
   * guidance and the mechanism disagreed, and a user following the instruction
   * exactly could not succeed.
   *
   * Provenance is left to the route's default (`representative_synthetic`).
   * Understating trust is the safe direction: a file is never labelled a real
   * client export on the strength of where it was dropped.
   */
  async function ingestStructuredForFamily(
    file: File,
    instrument: CurrentStateInstrument,
  ): Promise<FamilyUploadResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("family", instrument.key);
    form.append("archetypeId", readiness.archetypeId);
    const res = await fetch(`/api/v1/programs/${moveId}/current-state/ingest`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const payload = (await res.json().catch(() => ({}))) as {
      parsedRows?: number;
      committedRows?: number;
      errors?: string[];
      error?: string;
      detail?: string;
    };
    const parsed = payload.parsedRows ?? 0;
    const committed = payload.committedRows ?? 0;

    // Parsed-but-not-committed is its own state, never reported as success.
    // The two counts are kept separate on purpose — a schema that parses is not
    // the same fact as rows that landed in the canonical table.
    if (!res.ok || committed === 0) {
      const reason =
        payload.errors?.slice(0, 2).join("; ") ||
        payload.detail ||
        payload.error ||
        `Structured load failed (HTTP ${res.status})`;
      return {
        familyKey: instrument.key,
        familyLabel: instrument.label,
        fileName: file.name,
        status: "error",
        detail: `${reason} (parsed ${parsed} row${parsed === 1 ? "" : "s"}, committed 0)`,
      };
    }
    return {
      familyKey: instrument.key,
      familyLabel: instrument.label,
      fileName: file.name,
      status: "uploaded",
      detail: `Committed ${committed} of ${parsed} parsed row${parsed === 1 ? "" : "s"} to readiness`,
    };
  }

  async function uploadSessionArtifact(
    file: File,
  ): Promise<FamilyUploadResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("phase", String(phase));
    form.append("family", "session_artifact");
    const res = await fetch(`/api/v1/programs/${moveId}/artifacts/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      detail?: string;
      error?: string;
      evidence?: {
        id?: string | null;
        reviewId?: string | null;
        status?: string;
        warning?: string;
      };
    };
    if (
      !res.ok ||
      !payload.ok ||
      !payload.evidence?.id ||
      !payload.evidence.reviewId ||
      payload.evidence.status === "not_captured"
    ) {
      // Two outcomes used to share one sentence ladder, and the refusal half
      // read `detail` first — which on this route is the raw MIME string for
      // `unsupported_type` and a byte count for `file_too_large`. A refusal
      // stored nothing and gets the product sentence for its code; a file
      // that WAS stored but did not register keeps the ingestion warning,
      // because "nothing was stored" would be false for it.
      const refused = !res.ok || !payload.ok;
      return {
        familyKey: "session_artifact",
        familyLabel: "Workshop / session notes",
        fileName: file.name,
        status: "error",
        detail: refused
          ? describeMoveUploadRefusal({
              code: payload.error,
              detail: payload.detail,
              fileName: file.name,
            })
          : payload.evidence?.warning ||
            "Parsing and review registration did not complete; this file cannot ground a build.",
      };
    }
    return {
      familyKey: "session_artifact",
      familyLabel: "Workshop / session notes",
      fileName: file.name,
      status: "uploaded",
      detail:
        "Parsed and awaiting human review; it cannot ground generation until approved.",
    };
  }

  async function uploadBulk(files: FileList | null | undefined) {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0 || busy) return;
    setBusy(true);
    setResults([]);
    setMessage(
      `Mapping ${selectedFiles.length} file${
        selectedFiles.length === 1 ? "" : "s"
      } to current-state evidence families...`,
    );
    const nextResults: FamilyUploadResult[] = [];
    try {
      for (const file of selectedFiles) {
        if (uploadMode === "session_notes") {
          setMessage(`Uploading ${file.name} as workshop/session notes...`);
          nextResults.push(await uploadSessionArtifact(file));
          continue;
        }
        // A declared family wins; the file name is the fallback for an
        // undeclared file only. Before the picker existed, a name the
        // heuristic could not place was refused here with no way through.
        const routing = resolveCurrentStateUploadFamilies({
          declaredFamilyKey,
          fileName: file.name,
          openFamilies,
        });
        const mappedFamilies = routing.families;
        if (routing.basis === null) {
          nextResults.push({
            familyKey: "unmapped",
            familyLabel: "No open current-state family",
            fileName: file.name,
            status: "error",
            detail:
              routing.refusal ??
              "No open current-state family matched this file.",
          });
          continue;
        }
        setMessage(
          `Uploading ${file.name} to ${mappedFamilies
            .map((family) => family.label)
            .join(", ")}...`,
        );
        for (const family of mappedFamilies) {
          // Canonical-backed families go to their tower loader; document
          // families go through parse → review → commit. Dispatching on
          // `documentFamily` is what makes the gap card's own instruction
          // ("Upload CMDB export as CSV") true on this step.
          const result = family.documentFamily
            ? await uploadFileForFamily(file, family)
            : await ingestStructuredForFamily(file, family);
          // Say which way the family was decided. A guessed family can place
          // one file under several families at once, and until this line said
          // so the only difference an uploader could see between a declared
          // placement and a guessed one was the number of rows that appeared.
          nextResults.push({
            ...result,
            detail:
              routing.basis === "declared"
                ? `Declared as this family. ${result.detail}`
                : `Family guessed from the file name (${mappedFamilies.length} matched). ${result.detail}`,
          });
        }
      }
      setResults(nextResults);
      const succeeded = nextResults.filter(
        (row) => row.status === "uploaded",
      ).length;
      const failed = nextResults.length - succeeded;
      setMessage(
        uploadMode === "session_notes"
          ? `${succeeded} session file${succeeded === 1 ? "" : "s"} parsed and awaiting human review${failed ? `; ${failed} failed` : ""}. Approved evidence is required before generation.`
          : `${succeeded} mapped upload${succeeded === 1 ? "" : "s"} created${failed ? `; ${failed} failed` : ""}. Review-required items must still be accepted before they become gate-ready.`,
      );
      onRefreshPhase();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section
      className="mxw-family-upload"
      aria-label="Current-state evidence upload"
    >
      <header>
        <div>
          <span>Family-aware upload</span>
          <h2>Upload evidence into the P2 readiness map</h2>
          <p>
            Files uploaded here are mapped to the evidence families the gate
            evaluates. They land as review-required evidence first; approved
            evidence is what can satisfy readiness and feed generation.
          </p>
        </div>
        <button className="mxw-btn" onClick={onOpenFiles} type="button">
          Open Files &amp; Evidence
        </button>
      </header>
      <div className="mxw-family-upload-strip">
        <label className="mxw-family-upload-mode">
          <span>Upload type</span>
          <select
            aria-label="P2 upload mode"
            onChange={(event) =>
              setUploadMode(event.target.value as typeof uploadMode)
            }
            value={uploadMode}
          >
            <option value="readiness_evidence">
              Evidence mapped to P2 readiness
            </option>
            <option value="session_notes">Workshop / session notes</option>
          </select>
        </label>
        {uploadMode === "readiness_evidence" ? (
          <label className="mxw-family-upload-mode">
            <span>These files cover</span>
            <select
              aria-label="Evidence family these files cover"
              onChange={(event) => setDeclaredFamilyKey(event.target.value)}
              value={declaredFamilyKey}
            >
              <option value="">Decide from the file name</option>
              {declarableFamilies.map((family) => (
                <option key={family.key} value={family.key}>
                  {family.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <input
          aria-label="Upload P2 current-state evidence files"
          className="mxw-hidden-file"
          multiple
          onChange={(event) => void uploadBulk(event.currentTarget.files)}
          ref={inputRef}
          type="file"
        />
        <button
          className="mxw-btn mxw-primary"
          disabled={busy || openFamilies.length === 0}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {busy ? "Uploading..." : "Upload P2 evidence files"}
        </button>
        <span>
          {readiness.coverageScore}% collected · {reviewRequiredCount} awaiting
          review · {readiness.hardGaps.length} hard gap
          {readiness.hardGaps.length === 1 ? "" : "s"}
        </span>
      </div>
      {message ? <p className="mxw-family-upload-message">{message}</p> : null}
      {results.length > 0 ? (
        <div className="mxw-family-results" aria-label="Mapped upload results">
          {results.map((row, index) => (
            <div
              className={row.status}
              key={`${row.fileName}-${row.familyKey}-${index}`}
            >
              <strong>{row.fileName}</strong>
              <span>{row.familyLabel}</span>
              <em>{row.detail}</em>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mxw-family-table">
        <div className="head">
          <span>Evidence family</span>
          <span>Why it matters</span>
          <span>Status</span>
        </div>
        {openFamilies.map((instrument) => (
          <div key={instrument.key}>
            <strong>{instrument.label}</strong>
            <p>{instrument.whyNeeded}</p>
            <em className={instrument.status}>
              {instrument.status.replace(/_/g, " ")}
            </em>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceUploadControl({
  buttonLabel,
  evidenceFamilies = [],
  fixedEvidenceFamily,
  moveId,
  onOpenFiles,
  phase,
  secondaryAction = false,
  title,
}: {
  buttonLabel: string;
  evidenceFamilies?: Array<{ id: string; label: string }>;
  fixedEvidenceFamily?: { id: string; label: string };
  moveId: string;
  onOpenFiles?: () => void;
  phase: number;
  secondaryAction?: boolean;
  title: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<UploadWorkStatus>("idle");
  const [uploadFamily, setUploadFamily] = useState<
    "uploaded_evidence" | "session_artifact"
  >("uploaded_evidence");
  const [declaredEvidenceFamily, setDeclaredEvidenceFamily] = useState("");
  const [message, setMessage] = useState("");
  const [phaseArtifacts, setPhaseArtifacts] = useState<PhaseEvidenceArtifact[]>(
    [],
  );

  const loadPhaseArtifacts = useCallback(async () => {
    try {
      const responses = await Promise.all(
        ["uploaded_evidence", "session_artifact"].map((family) =>
          fetch(`/api/v1/programs/${moveId}/artifacts?family=${family}`, {
            credentials: "include",
          }),
        ),
      );
      if (responses.some((res) => !res.ok))
        throw new Error("Artifact list unavailable");
      const payloads = (await Promise.all(
        responses.map((res) => res.json().catch(() => ({}))),
      )) as Array<{
        artifacts?: PhaseEvidenceArtifact[];
      }>;
      const rows = payloads.flatMap((payload) =>
        Array.isArray(payload.artifacts) ? payload.artifacts : [],
      );
      setPhaseArtifacts(
        rows.filter(
          (a) => a.phase === phase && a.lifecycleState !== "superseded",
        ),
      );
    } catch {
      // Leave the last-known list in place; the "Open Files & Evidence" link
      // still reaches the full, authoritative vault.
    }
  }, [moveId, phase]);

  useEffect(() => {
    void loadPhaseArtifacts();
  }, [loadPhaseArtifacts]);

  async function uploadOne(file: File, totalCount: number): Promise<void> {
    const uploadTitle =
      totalCount > 1 ? `${title} - ${file.name}` : title || file.name;
    const form = new FormData();
    form.append("file", file);
    form.append("phase", String(phase));
    form.append("family", uploadFamily);
    form.append("title", uploadTitle);
    const selectedFamilyKey = fixedEvidenceFamily?.id ?? declaredEvidenceFamily;
    if (uploadFamily === "uploaded_evidence" && selectedFamilyKey) {
      form.append("evidenceFamily", selectedFamilyKey);
    }
    const res = await fetch(`/api/v1/programs/${moveId}/artifacts/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      detail?: string;
      error?: string;
      evidence?: {
        id?: string | null;
        reviewId?: string | null;
        reviewStatus?: string;
        parseMethod?: string;
        status?: string;
        warning?: string;
      };
    };
    if (!res.ok || !payload.ok) {
      // `detail` is not prose on this route for three of its six codes, so
      // preferring it put a raw MIME string in front of the uploader.
      throw new Error(
        describeMoveUploadRefusal({
          code: payload.error,
          detail: payload.detail,
          fileName: file.name,
        }),
      );
    }
    if (
      payload.evidence?.status === "not_captured" ||
      !payload.evidence?.id ||
      !payload.evidence.reviewId
    ) {
      throw new Error(
        `Uploaded ${file.name}, but evidence parsing or review registration failed. This file is not available to generation. ${payload.evidence?.warning ?? "Retry ingestion or contact support."}`,
      );
    }
  }

  async function upload(files: FileList | null | undefined) {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;
    setStatus("uploading");
    setMessage(
      selectedFiles.length === 1
        ? `Uploading ${selectedFiles[0]?.name ?? "file"}...`
        : `Uploading ${selectedFiles.length} files...`,
    );
    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index];
        if (!file) continue;
        if (selectedFiles.length > 1) {
          setMessage(
            `Uploading ${index + 1} of ${selectedFiles.length}: ${file.name}`,
          );
        }
        await uploadOne(file, selectedFiles.length);
      }
      setStatus("uploaded");
      const selectedEvidenceFamily =
        fixedEvidenceFamily ??
        evidenceFamilies.find((family) => family.id === declaredEvidenceFamily);
      const routingNote = selectedEvidenceFamily
        ? `; routed to ${selectedEvidenceFamily.label} for review`
        : "; not assigned to a required evidence family";
      setMessage(
        selectedFiles.length === 1
          ? `Uploaded ${selectedFiles[0]?.name ?? "file"} as ${uploadFamily === "session_artifact" ? "a session file" : "evidence"}${uploadFamily === "uploaded_evidence" && phase === 1 ? routingNote : ""}; parsed and awaiting human review before generation.`
          : `Uploaded ${selectedFiles.length} files as ${uploadFamily === "session_artifact" ? "session files" : "evidence"}${uploadFamily === "uploaded_evidence" && phase === 1 ? routingNote : ""}; parsed and awaiting human review before generation.`,
      );
      await loadPhaseArtifacts();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mxw-upload-stack">
      <div className="mxw-upload-control">
        {!fixedEvidenceFamily ? (
          <label className="mxw-upload-family">
            <span>File type</span>
            <select
              aria-label="Evidence file type"
              onChange={(event) => {
                const nextFamily = event.target.value as typeof uploadFamily;
                setUploadFamily(nextFamily);
                if (nextFamily === "session_artifact") {
                  setDeclaredEvidenceFamily("");
                }
              }}
              value={uploadFamily}
            >
              <option value="uploaded_evidence">Evidence</option>
              <option value="session_artifact">Workshop / session notes</option>
            </select>
          </label>
        ) : null}
        {/* Offered on every phase that has families to declare, not only P1.
            The upload route already accepts any of this Move's discovery
            families at any phase; while this picker was P1-only, a discovery
            upload could not state what it covered and fell to keyword
            inference, which decides most families on an exact phrase match. */}
        {!fixedEvidenceFamily &&
        uploadFamily === "uploaded_evidence" &&
        evidenceFamilies.length > 0 ? (
          <label className="mxw-upload-family">
            <span>Required evidence family (optional)</span>
            <select
              aria-label="Required evidence family (optional)"
              onChange={(event) =>
                setDeclaredEvidenceFamily(event.target.value)
              }
              value={declaredEvidenceFamily}
            >
              <option value="">
                Not specified (unassigned to a required family)
              </option>
              {evidenceFamilies.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.label}
                </option>
              ))}
            </select>
            <small>
              Routes review only; it does not approve or clear evidence.
            </small>
          </label>
        ) : null}
        <input
          aria-label={buttonLabel}
          className="mxw-hidden-file"
          multiple
          onChange={(event) => void upload(event.currentTarget.files)}
          ref={inputRef}
          type="file"
        />
        <button
          className={secondaryAction ? "secondary" : undefined}
          disabled={status === "uploading"}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {status === "uploading" ? "Uploading..." : buttonLabel}
        </button>
        {message ? (
          <span className={`mxw-upload-status ${status}`}>{message}</span>
        ) : null}
      </div>
      {phaseArtifacts.length > 0 ? (
        <div
          className="mxw-uploaded-files"
          aria-label="Uploaded evidence for this phase"
        >
          <header>
            <strong>Uploaded for this phase</strong>
            {onOpenFiles ? (
              <button onClick={onOpenFiles} type="button">
                Open Files &amp; Evidence
              </button>
            ) : null}
          </header>
          {phaseArtifacts.map((artifact) => (
            <div key={artifact.artifactId}>
              <span>{artifact.fileName ?? artifact.title}</span>
              <em>
                {artifact.family === "session_artifact"
                  ? "Session file"
                  : "Evidence"}{" "}
                · v{artifact.version} · {artifactStatusLabel(artifact.status)}
                {artifact.qualityScore != null
                  ? ` · Automated quality signal ${artifact.qualityScore}/100`
                  : ""}
              </em>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StageReadinessWorkbookPreviewControl({
  apiPath,
  initialPreview = null,
  onReviewSaved,
}: {
  apiPath: string;
  initialPreview?: StageReadinessWorkbookParsePreview | null;
  onReviewSaved?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "parsed" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [preview, setPreview] =
    useState<StageReadinessWorkbookParsePreview | null>(initialPreview);
  const [selectedProposalIds, setSelectedProposalIds] = useState<Set<string>>(
    () => selectableWorkbookProposalIds(initialPreview?.proposalSet?.proposals),
  );
  const [reviewStatus, setReviewStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [reviewMessage, setReviewMessage] = useState("");

  async function parseWorkbook(file: File | null | undefined) {
    if (!file) return;
    setStatus("parsing");
    setMessage(`Parsing ${file.name}...`);
    setPreview(null);
    setReviewStatus("idle");
    setReviewMessage("");
    setSelectedProposalIds(new Set());
    const form = new FormData();
    form.set("file", file);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const payload = (await res.json().catch(() => ({}))) as
        | StageReadinessWorkbookParsePreview
        | { detail?: string; error?: string };
      if (!res.ok || !("summary" in payload)) {
        throw new Error(
          "detail" in payload
            ? (payload.detail ?? `Parse failed (HTTP ${res.status})`)
            : `Parse failed (HTTP ${res.status})`,
        );
      }
      setPreview(payload);
      setSelectedProposalIds(
        selectableWorkbookProposalIds(payload.proposalSet?.proposals),
      );
      const summary = payload.summary ?? {};
      const issueCount =
        (summary.errorCount ?? 0) + (summary.warningCount ?? 0);
      setStatus(payload.ok ? "parsed" : "error");
      const proposalSet = payload.proposalSet;
      const proposalText =
        proposalSet && typeof proposalSet.pendingCount === "number"
          ? ` · stored ${proposalSet.pendingCount}/${proposalSet.proposalCount ?? proposalSet.pendingCount} pending proposals`
          : "";
      setMessage(
        `Parsed ${summary.answeredQuestions ?? 0}/${summary.totalQuestions ?? 0} responses` +
          proposalText +
          (issueCount > 0
            ? ` · ${issueCount} issue${issueCount === 1 ? "" : "s"}`
            : ""),
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Parse failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function reviewSelectedProposals(
    disposition: "accepted" | "rejected" | "needs_validation",
  ) {
    await submitReviewDecisions(
      Array.from(selectedProposalIds).map((proposalId) => ({
        proposalId,
        disposition,
      })),
      disposition === "accepted"
        ? "Accepting selected responses..."
        : disposition === "needs_validation"
          ? "Marking selected responses for validation..."
          : "Rejecting selected responses...",
    );
  }

  /**
   * Put the decisions a re-upload kept on record, each as the disposition
   * already recorded for it.
   *
   * A re-upload that changed nothing leaves no response pending, so the
   * ordinary review controls have nothing to act on while the phase is still
   * held: the restored decisions are shown but belong to the previous upload,
   * and no gate may read them until a human submits them. This is that
   * submission. It re-decides nothing — a kept rejection is sent as a
   * rejection — and the server's own carry-forward covers any row this batch
   * does not name.
   */
  async function recordKeptDecisions() {
    await submitReviewDecisions(
      keptDecisionsToRecord(preview?.proposalSet?.proposals),
      "Recording the decisions kept from your previous upload...",
    );
  }

  async function submitReviewDecisions(
    decisions: readonly { proposalId: string; disposition: string }[],
    savingMessage: string,
  ) {
    const proposalSet = preview?.proposalSet;
    const artifactId = proposalSet?.artifactId;
    if (!artifactId || decisions.length === 0) return;
    setReviewStatus("saving");
    setReviewMessage(savingMessage);
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proposalSetArtifactId: artifactId,
          proposalSetArtifactVersion: proposalSet.artifactVersion,
          decisions,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as
        | StageReadinessWorkbookReviewResult
        | { detail?: string; error?: string };
      if (!res.ok || !("proposalReview" in payload)) {
        throw new Error(
          "detail" in payload
            ? (payload.detail ?? `Review failed (HTTP ${res.status})`)
            : `Review failed (HTTP ${res.status})`,
        );
      }
      const review = payload.proposalReview ?? {};
      const reviewSummary = {
        status:
          review.status ??
          (review.pendingCount === 0 && review.needsValidationCount === 0
            ? "accepted"
            : "review_required"),
        acceptedCount: review.acceptedCount ?? 0,
        rejectedCount: review.rejectedCount ?? 0,
        needsValidationCount: review.needsValidationCount ?? 0,
        pendingCount: review.pendingCount ?? 0,
        readiness: review.readiness,
      };
      // Every restored disposition is now on record, not only the ones this
      // batch named: the route carries the rest forward onto the same review.
      // Leaving the marks up would keep telling the reviewer that work is
      // still unrecorded, and would keep the gate projection discarding it.
      const submitted = new Map(
        decisions.map((decision) => [decision.proposalId, decision.disposition]),
      );
      const reviewedProposals = (proposalSet.proposals ?? []).map(
        (proposal) => {
          const recorded = { ...proposal };
          delete recorded.dispositionRestoredFromPriorUpload;
          const submittedDisposition = proposal.proposalId
            ? submitted.get(proposal.proposalId)
            : undefined;
          return submittedDisposition
            ? { ...recorded, disposition: submittedDisposition }
            : recorded;
        },
      );
      setPreview((current) =>
        current?.proposalSet
          ? {
              ...current,
              proposalSet: {
                ...current.proposalSet,
                status: reviewSummary.status,
                pendingCount: reviewSummary.pendingCount,
                review: reviewSummary,
                proposals: reviewedProposals,
              },
            }
          : current,
      );
      setSelectedProposalIds(selectableWorkbookProposalIds(reviewedProposals));
      setReviewStatus("saved");
      setReviewMessage(
        `Review saved · ${review.acceptedCount ?? 0} accepted · ${review.needsValidationCount ?? 0} needs validation · ${review.rejectedCount ?? 0} rejected`,
      );
      if (review.readiness) {
        setMessage(
          `${message} · readiness ${review.readiness.ready ?? 0} ready / ${review.readiness.insufficientEvidence ?? 0} insufficient / ${review.readiness.unknown ?? 0} unknown`,
        );
      }
      onReviewSaved?.();
    } catch (err) {
      setReviewStatus("error");
      setReviewMessage(
        err instanceof Error ? err.message : "Review failed. Reload and retry.",
      );
    }
  }

  const firstIssue = preview?.issues?.[0]?.message ?? null;
  const required =
    preview?.summary?.requiredTotal !== undefined
      ? `${preview.summary.requiredAnswered ?? 0}/${preview.summary.requiredTotal} required`
      : null;
  const pendingProposalCount = preview?.proposalSet?.pendingCount ?? 0;
  const blankProposalCount =
    preview?.proposalSet?.proposals?.filter(
      (proposal) => !isWorkbookProposalAcceptable(proposal),
    ).length ?? 0;
  const proposalReview = preview?.proposalSet?.review;
  const reviewActionCount =
    preview?.proposalSet?.proposals?.filter(isWorkbookProposalOpenForReview)
      .length ?? 0;
  // Required responses that are not accepted. Every one of these holds both
  // forward controls, whether it is still pending or was rejected: the P1
  // branch of `applyStageReadinessToEvidencePackets` requires every required
  // proposal accepted, and `assessStageReadinessGate` raises a
  // `review_required` blocker for any required proposal that is not. So the
  // phase gate keeps returning 409 and so does `generate-phase`.
  const requiredNotAcceptedCount =
    preview?.proposalSet?.proposals?.filter(
      (proposal) =>
        (proposal.requirement ?? "required") === "required" &&
        proposal.disposition !== "accepted",
    ).length ?? 0;
  // Whether any decision on this set still needs to be changeable.
  //
  // Open work is not the only reason. A review can leave NO open work and
  // still hold the phase, because rejecting a required response is not a
  // resting state for it. That combination used to close the review surface
  // completely: the action row rendered only while open work remained, and a
  // rejected row's checkbox was disabled, so not one control on the page could
  // revise the single decision that was holding the phase — while the gate's
  // blocker text went on saying to accept each required response. The server
  // never locked this; `mergeStageReadinessReviewDecisions` states that
  // incoming decisions always win.
  //
  // A review that holds nothing stays closed, which is what it means for a
  // review to be finished.
  // `isWorkbookProposalReviewable` is the per-row half: a blank response can
  // never be accepted, so a workbook of nothing but blanks must not be offered
  // an action row whose buttons could never enable. Completing the cells and
  // uploading again is that workbook's only path, which the blank tally says.
  const anyProposalReviewable =
    preview?.proposalSet?.proposals?.some(isWorkbookProposalReviewable) ??
    false;
  // Decisions shown on screen that no review of THIS set has recorded. They
  // are the reason the review surface must stay open on a re-upload that
  // changed nothing: every row reads decided, so neither count above is
  // positive, while the gate still holds the phase because nothing is on
  // record. Without this term the fix that stops the gate reading a preview
  // would leave the reviewer a blocker and no control.
  const keptDecisions = keptDecisionsToRecord(
    preview?.proposalSet?.proposals,
  );
  const reviewRevisable =
    anyProposalReviewable &&
    (reviewActionCount > 0 ||
      requiredNotAcceptedCount > 0 ||
      keptDecisions.length > 0);
  // A restored decision is reported as restored. The reviewer is looking at a
  // workbook they uploaded again, and the difference between "you already
  // judged these" and "the product decided for you" is the whole reason the
  // count is carried this far.
  const carriedForwardCount =
    proposalReview?.carriedForwardFromPriorUpload ?? 0;
  const proposalReviewMessage = proposalReview
    ? `Workbook review recorded · ${proposalReview.acceptedCount ?? 0} accepted · ${proposalReview.needsValidationCount ?? 0} needs validation · ${proposalReview.rejectedCount ?? 0} rejected · ${proposalReview.pendingCount ?? 0} pending` +
      (proposalReview.readiness
        ? ` · readiness ${proposalReview.readiness.ready ?? 0} ready / ${proposalReview.readiness.insufficientEvidence ?? 0} insufficient / ${proposalReview.readiness.unknown ?? 0} unknown`
        : "") +
      (carriedForwardCount > 0
        ? ` · ${carriedForwardCount} decision${carriedForwardCount === 1 ? "" : "s"} kept from your previous upload of this workbook — ` +
          // Whether those decisions are on record yet is the difference
          // between "nothing left to do here" and "the phase is still held".
          // `keptDecisions` is empty once they are recorded, which is why the
          // same sentence can answer both.
          (keptDecisions.length > 0
            ? "review what changed, then record the kept decisions"
            : "review only what changed")
        : "")
    : "";
  const storedProposalMessage =
    preview?.proposalSet?.artifactId &&
    status === "idle" &&
    preview.proposalSet.status !== "accepted" &&
    pendingProposalCount > 0
      ? `Stored workbook responses awaiting review · ${pendingProposalCount}/${preview.proposalSet.proposalCount ?? pendingProposalCount} pending proposals`
      : "";
  const statusMessage = [
    proposalReviewMessage || message || storedProposalMessage,
    blankProposalCount > 0
      ? `${blankProposalCount} blank response${blankProposalCount === 1 ? "" : "s"}. Complete the Response cells and upload the workbook again before review.`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mxw-workbook-preview">
      <input
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        aria-label="Upload completed readiness workbook"
        className="mxw-hidden-file"
        onChange={(event) =>
          void parseWorkbook(event.currentTarget.files?.[0] ?? null)
        }
        ref={inputRef}
        type="file"
      />
      <button
        className="mxw-stage-download"
        disabled={status === "parsing"}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {status === "parsing"
          ? "Parsing workbook..."
          : "Preview completed workbook"}
      </button>
      {statusMessage ? (
        <span className={`mxw-workbook-preview-status ${status}`}>
          {statusMessage}
          {required ? <em>{required}</em> : null}
          {firstIssue ? <small>{firstIssue}</small> : null}
        </span>
      ) : null}
      {preview?.proposalSet?.artifactId &&
      preview.proposalSet.proposals?.length ? (
        <div className="mxw-workbook-review">
          <div className="mxw-workbook-review-summary">
            <strong>
              {proposalReview?.status === "accepted"
                ? "Workbook responses reviewed"
                : proposalReview
                  ? "Workbook review recorded"
                  : "Workbook responses awaiting review"}
            </strong>
            <span>
              {proposalReview
                ? `${preview.proposalSet.proposals.length} responses reviewed · ${reviewActionCount} still open`
                : `${selectedProposalIds.size}/${preview.proposalSet.proposals.length} selected · upload is not acceptance`}
            </span>
            {requiredNotAcceptedCount > 0 && reviewRevisable ? (
              <small>
                {`${requiredNotAcceptedCount} required response${requiredNotAcceptedCount === 1 ? "" : "s"} not accepted. This phase stays held until each one is accepted; select the response below to change its decision.`}
              </small>
            ) : null}
          </div>
          {/*
            Every stored response is listed. Rendering only the first few
            capped what a reviewer could judge while the selection was still
            seeded from the whole set, so a 41-proposal workbook offered
            "41/41 selected" above six rows, and no row past the sixth could
            be rejected or flagged at all. The list scrolls instead.
          */}
          <div
            aria-label="Stored workbook responses"
            className="mxw-workbook-review-list"
            role="group"
          >
            {preview.proposalSet.proposals.map((proposal) => {
              const proposalId = proposal.proposalId ?? "";
              const restored = isRestoredDisposition(proposal);
              return (
                <label
                  data-restored-disposition={restored ? "true" : undefined}
                  key={proposalId || proposal.questionId}
                >
                  <input
                    checked={selectedProposalIds.has(proposalId)}
                    disabled={
                      !proposalId ||
                      !isWorkbookProposalReviewable(proposal) ||
                      !reviewRevisable ||
                      reviewStatus === "saving"
                    }
                    onChange={(event) => {
                      // Read the event BEFORE the updater: React can replay a
                      // state updater on a later render, and by then the
                      // event's currentTarget is null. Reading it inside threw
                      // a TypeError out of the whole phase workspace on a
                      // second tick in the same render pass.
                      const checked = event.currentTarget.checked;
                      setSelectedProposalIds((current) => {
                        const next = new Set(current);
                        if (checked) {
                          next.add(proposalId);
                        } else {
                          next.delete(proposalId);
                        }
                        return next;
                      });
                    }}
                    type="checkbox"
                  />
                  <span>
                    <b>{proposal.question ?? proposal.questionId}</b>
                    <em>
                      {proposal.requirement ?? "required"} ·{" "}
                      {isWorkbookProposalAcceptable(proposal)
                        ? `${proposal.answerState ?? "answered"} · ${proposal.disposition ?? "pending"}`
                        : "response required in workbook"}
                      {/*
                        Which rows the count in the status line refers to.
                        Reporting only the total left a reviewer unable to tell
                        a decision they had just made from one restored off an
                        earlier upload, which is the difference between a row
                        they can leave alone and one still to be put on record.
                      */}
                      {restored
                        ? " · kept from your previous upload, not yet recorded"
                        : ""}
                    </em>
                  </span>
                </label>
              );
            })}
          </div>
          {reviewRevisable ? (
            <div className="mxw-workbook-review-actions">
              {keptDecisions.length > 0 ? (
                <button
                  className="mxw-workbook-review-keep"
                  disabled={reviewStatus === "saving"}
                  onClick={() => void recordKeptDecisions()}
                  type="button"
                >
                  {`Record ${keptDecisions.length} kept decision${keptDecisions.length === 1 ? "" : "s"}`}
                </button>
              ) : null}
              <button
                disabled={
                  selectedProposalIds.size === 0 || reviewStatus === "saving"
                }
                onClick={() => void reviewSelectedProposals("accepted")}
                type="button"
              >
                Accept selected
              </button>
              <button
                disabled={
                  selectedProposalIds.size === 0 || reviewStatus === "saving"
                }
                onClick={() => void reviewSelectedProposals("needs_validation")}
                type="button"
              >
                Mark needs validation
              </button>
              <button
                disabled={
                  selectedProposalIds.size === 0 || reviewStatus === "saving"
                }
                onClick={() => void reviewSelectedProposals("rejected")}
                type="button"
              >
                Reject selected
              </button>
              {/*
                Accept-all is one click because every open response starts
                ticked. Without these two, singling out one response in a
                forty-row workbook meant unticking the other thirty-nine, so
                a reviewer holding one bad answer had no practical move but
                to accept it.
              */}
              <button
                className="mxw-workbook-review-select"
                disabled={
                  selectedProposalIds.size === reviewActionCount ||
                  reviewStatus === "saving"
                }
                onClick={() =>
                  setSelectedProposalIds(
                    selectableWorkbookProposalIds(
                      preview.proposalSet?.proposals,
                    ),
                  )
                }
                type="button"
              >
                Select all open responses
              </button>
              <button
                className="mxw-workbook-review-select"
                disabled={
                  selectedProposalIds.size === 0 || reviewStatus === "saving"
                }
                onClick={() => setSelectedProposalIds(new Set())}
                type="button"
              >
                Clear selection
              </button>
            </div>
          ) : null}
          {reviewMessage ? (
            <span className={`mxw-workbook-review-status ${reviewStatus}`}>
              {reviewMessage}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TemplatesAndSessions({ phase }: { phase: PhaseContract }) {
  return (
    <div className="mxw-ts-grid">
      <div className="mxw-ts-col">
        <header>
          <span>Recommended sessions</span>
          <b>{phase.sessions.length}</b>
        </header>
        {phase.sessions.map((session) => (
          <div className="mxw-session" key={session}>
            <span />
            {session}
          </div>
        ))}
      </div>
      <div className="mxw-ts-col">
        <header>
          <span>Templates to use</span>
          <b>{phase.templates.length}</b>
        </header>
        {phase.templates.map((template) => (
          <div className="mxw-template" key={template.name}>
            <em>{template.type}</em>
            <span>{template.name}</span>
            <small>Use in workspace</small>
          </div>
        ))}
      </div>
    </div>
  );
}

const ROUTE_IMPACT_CHOICES = ["none", "limited", "material"] as const;
const SOLUTION_OUTPUT_LABELS: Record<SolutionOutputType, string> = {
  reports_dashboards: "Reports / dashboards",
  data_product: "Data product",
  workflow_automation: "Workflow automation",
  service_operating_model: "Service / operating model",
  mixed: "Mixed solution",
};

function editableStructuredRecord(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function BusinessChangeAssessmentForm({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const record = editableStructuredRecord(value);
  const update = (key: string, next: string) =>
    onChange(JSON.stringify({ ...record, [key]: next }));

  return (
    <div className="mxw-structured-form">
      <label>
        Expected workflow change
        <select
          aria-label="Expected workflow change"
          onChange={(event) =>
            update("expectedWorkflowChange", event.target.value)
          }
          value={
            typeof record.expectedWorkflowChange === "string"
              ? record.expectedWorkflowChange
              : ""
          }
        >
          <option value="">Select impact</option>
          {ROUTE_IMPACT_CHOICES.map((impact) => (
            <option key={impact} value={impact}>
              {impact}
            </option>
          ))}
        </select>
      </label>
      <label>
        Expected role / accountability change
        <select
          aria-label="Expected role or accountability change"
          onChange={(event) =>
            update("expectedRoleAccountabilityChange", event.target.value)
          }
          value={
            typeof record.expectedRoleAccountabilityChange === "string"
              ? record.expectedRoleAccountabilityChange
              : ""
          }
        >
          <option value="">Select impact</option>
          {ROUTE_IMPACT_CHOICES.map((impact) => (
            <option key={impact} value={impact}>
              {impact}
            </option>
          ))}
        </select>
      </label>
      <label>
        Adoption owner
        <input
          aria-label="Adoption owner"
          onChange={(event) => update("adoptionOwner", event.target.value)}
          placeholder="Business owner or role"
          value={
            typeof record.adoptionOwner === "string" ? record.adoptionOwner : ""
          }
        />
      </label>
      <label>
        Adoption responsibility
        <select
          aria-label="Adoption responsibility"
          onChange={(event) =>
            update("adoptionResponsibility", event.target.value)
          }
          value={
            typeof record.adoptionResponsibility === "string"
              ? record.adoptionResponsibility
              : ""
          }
        >
          <option value="">Select owner</option>
          <option value="business">Business</option>
          <option value="delivery_team">Delivery team</option>
          <option value="shared">Shared</option>
        </select>
      </label>
      <label>
        Evidence reference for this hypothesis
        <input
          aria-label="Evidence reference for the business change hypothesis"
          onChange={(event) => update("evidenceReference", event.target.value)}
          placeholder="Interview, uploaded file, or source record"
          value={
            typeof record.evidenceReference === "string"
              ? record.evidenceReference
              : ""
          }
        />
      </label>
      <label>
        Sponsor / validator
        <input
          aria-label="Sponsor or validator"
          onChange={(event) => update("validatedBy", event.target.value)}
          placeholder="Name or accountable role"
          value={
            typeof record.validatedBy === "string" ? record.validatedBy : ""
          }
        />
      </label>
      <p className="mxw-structured-note">
        P1 records the hypothesis and adoption owner. P2 must validate or
        correct it against current-state evidence before P3 depth changes.
      </p>
    </div>
  );
}

function SolutionRouteValidationForm({
  assessment,
  approvedEvidenceReferences,
  onChange,
  reviewerIdentity,
  value,
}: {
  assessment: string;
  approvedEvidenceReferences: ApprovedPhaseEvidenceReference[];
  onChange: (value: string) => void;
  reviewerIdentity: string;
  value: string;
}) {
  const record = editableStructuredRecord(value);
  const p1Assessment: BusinessChangeAssessment | null =
    parseBusinessChangeAssessment(assessment);
  const output = record.solutionOutput;
  const workflowChange = record.workflowChange;
  const roleChange = record.roleAccountabilityChange;
  const recommendation =
    SOLUTION_OUTPUT_TYPES.includes(output as SolutionOutputType) &&
    ROUTE_IMPACT_CHOICES.includes(
      workflowChange as (typeof ROUTE_IMPACT_CHOICES)[number],
    ) &&
    ROUTE_IMPACT_CHOICES.includes(
      roleChange as (typeof ROUTE_IMPACT_CHOICES)[number],
    )
      ? recommendSolutionRoute({
          solutionOutput: output as SolutionOutputType,
          workflowChange:
            workflowChange as (typeof ROUTE_IMPACT_CHOICES)[number],
          roleAccountabilityChange:
            roleChange as (typeof ROUTE_IMPACT_CHOICES)[number],
        })
      : "unresolved";
  const decision = record.decision;
  const confirmUnavailableReason =
    solutionRouteConfirmUnavailableReason(recommendation);

  const update = (key: string, next: unknown) => {
    const routeImpactChanged = [
      "solutionOutput",
      "workflowChange",
      "roleAccountabilityChange",
      "evidenceReference",
    ].includes(key);
    onChange(
      JSON.stringify({
        ...record,
        businessChangeAssessmentSnapshot: p1Assessment,
        [key]: next,
        ...(routeImpactChanged
          ? { decision: "", selectedRoute: "", correctionRationale: "" }
          : {}),
        validatedBy: reviewerIdentity,
      }),
    );
  };
  const updateDecision = (nextDecision: string) => {
    onChange(
      JSON.stringify({
        ...record,
        businessChangeAssessmentSnapshot: p1Assessment,
        decision: nextDecision,
        selectedRoute:
          nextDecision === "confirm" && recommendation !== "unresolved"
            ? recommendation
            : nextDecision === "correct"
              ? (record.selectedRoute ?? "")
              : "",
        validatedBy: reviewerIdentity,
      }),
    );
  };

  return (
    <div className="mxw-structured-form">
      <div className="mxw-structured-context">
        <strong>P1 hypothesis</strong>
        {p1Assessment ? (
          <span>
            Workflow: {p1Assessment.expectedWorkflowChange}; roles:{" "}
            {p1Assessment.expectedRoleAccountabilityChange}; adoption:{" "}
            {p1Assessment.adoptionResponsibility} ({p1Assessment.adoptionOwner})
          </span>
        ) : (
          <span>
            Complete and save the P1 business-change assessment first.
          </span>
        )}
      </div>
      <label>
        Solution output
        <select
          aria-label="Solution output"
          onChange={(event) => update("solutionOutput", event.target.value)}
          value={typeof output === "string" ? output : ""}
        >
          <option value="">Select solution output</option>
          {SOLUTION_OUTPUT_TYPES.map((type) => (
            <option key={type} value={type}>
              {SOLUTION_OUTPUT_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Current-state workflow impact
        <select
          aria-label="Validated workflow impact"
          onChange={(event) => update("workflowChange", event.target.value)}
          value={typeof workflowChange === "string" ? workflowChange : ""}
        >
          <option value="">Select impact</option>
          {ROUTE_IMPACT_CHOICES.map((impact) => (
            <option key={impact} value={impact}>
              {impact}
            </option>
          ))}
        </select>
      </label>
      <label>
        Current-state role / accountability impact
        <select
          aria-label="Validated role or accountability impact"
          onChange={(event) =>
            update("roleAccountabilityChange", event.target.value)
          }
          value={typeof roleChange === "string" ? roleChange : ""}
        >
          <option value="">Select impact</option>
          {ROUTE_IMPACT_CHOICES.map((impact) => (
            <option key={impact} value={impact}>
              {impact}
            </option>
          ))}
        </select>
      </label>
      <label>
        Evidence reference
        <select
          aria-label="P2 evidence reference"
          onChange={(event) => update("evidenceReference", event.target.value)}
          value={
            typeof record.evidenceReference === "string"
              ? record.evidenceReference
              : ""
          }
          disabled={approvedEvidenceReferences.length === 0}
        >
          <option value="">
            {approvedEvidenceReferences.length === 0
              ? "No approved P2 evidence yet"
              : "Select approved P2 evidence"}
          </option>
          {approvedEvidenceReferences.map((evidence) => (
            <option key={evidence.evidenceId} value={evidence.evidenceId}>
              {evidence.title} · {evidence.familyKey}
            </option>
          ))}
        </select>
      </label>
      <div className="mxw-structured-recommendation" aria-live="polite">
        <span>System recommendation</span>
        <strong>{SOLUTION_ROUTE_LABELS[recommendation]}</strong>
      </div>
      <label>
        Human decision
        <select
          aria-label="Human route decision"
          onChange={(event) => updateDecision(event.target.value)}
          value={typeof decision === "string" ? decision : ""}
        >
          <option value="">Review before confirming</option>
          {solutionRouteDecisionChoices(recommendation).map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </label>
      {confirmUnavailableReason ? (
        <p className="mxw-structured-note" role="status">
          {confirmUnavailableReason}
        </p>
      ) : null}
      {decision === "correct" ? (
        <>
          <label>
            Selected route
            <select
              aria-label="Corrected solution route"
              onChange={(event) => update("selectedRoute", event.target.value)}
              value={
                typeof record.selectedRoute === "string"
                  ? record.selectedRoute
                  : ""
              }
            >
              <option value="">Select route</option>
              {Object.entries(SOLUTION_ROUTE_LABELS)
                .filter(([route]) => route !== "unresolved")
                .map(([route, label]) => (
                  <option key={route} value={route}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Correction rationale
            <textarea
              aria-label="Route correction rationale"
              onChange={(event) =>
                update("correctionRationale", event.target.value)
              }
              rows={3}
              value={
                typeof record.correctionRationale === "string"
                  ? record.correctionRationale
                  : ""
              }
            />
          </label>
        </>
      ) : null}
      <p className="mxw-structured-note">
        {approvedEvidenceReferences.length === 0
          ? "Upload and approve at least one P2 evidence item before confirming this route."
          : `Confirmation is saved with the authenticated reviewer identity (${reviewerIdentity}). P3 stays on the full contract until this decision matches the current P1 snapshot and an approved evidence item.`}
      </p>
    </div>
  );
}

function PhaseCaptureEditor({
  compact = false,
  completeCount,
  evidencePassed,
  phaseHardGatesPassed,
  evidenceReadinessAvailable,
  businessChangeAssessment,
  approvedEvidenceReferences,
  approvedCaptureEvidenceReferences,
  reviewerIdentity,
  onChange,
  phase,
  persistedValues,
  saveErrors,
  saveStatus,
  sections,
  values,
}: {
  compact?: boolean;
  completeCount: number;
  evidencePassed: boolean;
  phaseHardGatesPassed: boolean;
  evidenceReadinessAvailable: boolean;
  businessChangeAssessment: string;
  approvedEvidenceReferences: ApprovedPhaseEvidenceReference[];
  approvedCaptureEvidenceReferences: ApprovedPhaseEvidenceReference[];
  reviewerIdentity: string;
  onChange: (key: string, value: string) => void;
  phase: PhaseContract;
  persistedValues: PhaseCaptureValues;
  saveErrors: Record<string, string>;
  saveStatus: Record<string, PhaseCaptureSaveStatus>;
  sections: ReturnType<typeof getPhaseCaptureSections>;
  values: PhaseCaptureValues;
}) {
  if (phase.phase === 0 || sections.length === 0) return null;

  return (
    <section className={`mxw-zone mxw-capture ${compact ? "compact" : ""}`}>
      <header>
        <div>
          <span>{phase.code} source of truth</span>
          <h2>
            {phase.phase === 1 ? "Charter inputs" : `${phase.title} inputs`}
          </h2>
          <p>
            Saved inputs are not phase completion.{" "}
            {requiredEvidenceCompletionNotice()}
          </p>
        </div>
        <strong>
          {completeCount} / {sections.length} saved
        </strong>
      </header>
      <div className="mxw-capture-grid">
        {sections.map((section, index) => {
          const value = values[section.key] ?? "";
          const captureStatus = phaseCaptureStatusForSection(
            section,
            values,
            persistedValues,
            saveStatus,
            businessChangeAssessment,
            approvedEvidenceReferences.map((item) => item.evidenceId),
            evidencePassed,
            evidenceReadinessAvailable,
            approvedCaptureEvidenceReferences,
          );
          const status = phaseCaptureStatusForDisplay(
            captureStatus,
            phase.phase,
            phaseHardGatesPassed,
          );
          return (
            <label
              className={`mxw-capture-card ${status.complete ? "complete" : ""} ${status.tone}`}
              key={section.key}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{section.label}</strong>
              <small>{section.description}</small>
              <em>{status.label}</em>
              {captureStatus.complete && !status.complete ? (
                <small>Inputs are captured; the phase gate remains open.</small>
              ) : null}
              {section.structured === "business-change" ? (
                <BusinessChangeAssessmentForm
                  value={value}
                  onChange={(next) => onChange(section.key, next)}
                />
              ) : section.structured === "solution-route" ? (
                <SolutionRouteValidationForm
                  assessment={businessChangeAssessment}
                  approvedEvidenceReferences={approvedEvidenceReferences}
                  reviewerIdentity={reviewerIdentity}
                  value={value}
                  onChange={(next) => onChange(section.key, next)}
                />
              ) : (
                <textarea
                  aria-label={section.label}
                  onChange={(event) =>
                    onChange(section.key, event.target.value)
                  }
                  placeholder={section.example ?? "Write your answer here."}
                  rows={compact ? 2 : 3}
                  value={value}
                />
              )}
              {status.tone === "error" ? (
                <small className="mxw-capture-save-error" role="alert">
                  {saveErrors[section.key] ||
                    "This edit is not saved. Try again before continuing."}
                </small>
              ) : status.tone === "saving" || status.tone === "editing" ? (
                <small className="mxw-capture-save-note">
                  Approve &amp; Build will stay blocked until this value is
                  saved.
                </small>
              ) : null}
            </label>
          );
        })}
      </div>
    </section>
  );
}

function P3OptionSummary({ optionSet }: { optionSet: P3OptionSet }) {
  const recommendation = optionSet.recommendedOptionId
    ? optionSet.options.find(
        (option) => option.id === optionSet.recommendedOptionId,
      )
    : null;
  const clientOptions = optionSet.source === "move_uploaded_options";

  return (
    <div className="mxw-option-summary">
      <div>
        <span>Source</span>
        <strong>
          {clientOptions
            ? `Move evidence: ${optionSet.sourceTitle ?? "uploaded options"}`
            : optionSet.sourceEvidenceLabels?.length
              ? `P2 gate evidence: ${optionSet.sourceEvidenceLabels.map(p2SourceEvidenceTitle).join(", ")}`
              : "P2 source evidence unavailable"}
        </strong>
        <small>
          {clientOptions
            ? `${optionSet.options.length} options as supplied by the client`
            : `${optionSet.evidenceBasis.length} grounded signal${
                optionSet.evidenceBasis.length === 1 ? "" : "s"
              } in the design pack`}
        </small>
      </div>
      <div>
        <span>Recommendation</span>
        <strong>
          {clientOptions
            ? "Client decision"
            : recommendation
              ? recommendation.label
              : "Provisional only"}
        </strong>
        <small>
          {clientOptions
            ? "These are the client's options; they are not scored or ranked here"
            : recommendation
              ? `${recommendation.confidence} confidence - human decision still required`
              : "More evidence needed before a recommendation is safe"}
        </small>
      </div>
      <div>
        <span>Open gaps</span>
        <strong>{optionSet.missingEvidence.length}</strong>
        <small>
          {optionSet.missingEvidence[0] ??
            "No open gap was supplied to this comparison"}
        </small>
      </div>
    </div>
  );
}

function OptionCards({
  optionSet,
  selectedOption,
  onSelectOption,
}: {
  optionSet: P3OptionSet;
  selectedOption: string;
  onSelectOption: (value: string) => void;
}) {
  return (
    <div className="mxw-options">
      {optionSet.options.map((option) => (
        <button
          aria-label={`${option.label}${option.recommended ? " (recommended)" : ""}`}
          className={`${selectedOption === option.id ? "selected" : ""} ${
            option.recommended ? "recommended" : ""
          }`}
          key={option.id}
          onClick={() => onSelectOption(option.id)}
          type="button"
        >
          <span>{option.id}</span>
          <strong>{option.label}</strong>
          {option.recommended ? <em>✓ {option.recommendationLabel}</em> : null}
          {option.clientSupplied ? (
            // The client's option, as written. No score, confidence, effort or
            // building blocks: none of those were supplied, and none is ours
            // to add.
            <dl>
              {(
                [
                  ["Benefit", option.clientSupplied.benefit],
                  ["Trade-off", option.clientSupplied.tradeoff],
                  ["Condition", option.clientSupplied.condition],
                  ["Scope", option.clientSupplied.scope],
                ] as const
              )
                .filter(([, value]) => value)
                .map(([term, value]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <>
              <small>{option.summary}</small>
              <dl>
                <div>
                  <dt>Impact</dt>
                  <dd>{option.businessImpact}</dd>
                </div>
                <div>
                  <dt>Data/platform</dt>
                  <dd>{option.dataPlatformImplications}</dd>
                </div>
                <div>
                  <dt>Human + AI split</dt>
                  <dd>{option.humanAiSplit}</dd>
                </div>
                <div>
                  <dt>Controls</dt>
                  <dd>{option.controls}</dd>
                </div>
              </dl>
              <div className="mxw-option-meta">
                <b>{option.timeToValue}</b>
                <b>{option.effort}</b>
                <b>Score {option.totalScore}</b>
                <b>{option.confidence} confidence</b>
              </div>
              <div className="mxw-option-blocks">
                {option.requiredBuildingBlocks.slice(0, 6).map((block) => (
                  <i key={block}>{buildingBlockLabel(block)}</i>
                ))}
              </div>
            </>
          )}
          {option.notRecommendedYetReasons.length > 0 ? (
            <div className="mxw-option-caution">
              <b>Not recommended yet if:</b>
              <span>
                {option.notRecommendedYetReasons.slice(0, 3).join(" ")}
              </span>
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function PostureCards({
  selectedOption,
  onSelectOption,
}: {
  selectedOption: string;
  onSelectOption: (value: string) => void;
}) {
  const options = [
    [
      "A",
      "Improve the current process",
      "P2 validates whether focused workflow, knowledge, and metric fixes are enough before larger design work.",
    ],
    [
      "B",
      "Explore a balanced transformation",
      "P2 keeps process, platform, operating model, and controls in scope so P3 can compare viable paths.",
    ],
    [
      "C",
      "Evaluate major transformation potential",
      "P2 tests whether the value, readiness, and change appetite justify a broader redesign later.",
    ],
  ] as const;

  return (
    <div className="mxw-options mxw-posture-options">
      {options.map(([code, title, detail]) => (
        <button
          className={selectedOption === code ? "selected" : ""}
          key={code}
          onClick={() => onSelectOption(code)}
          type="button"
        >
          <span>{code}</span>
          <strong>{title}</strong>
          {selectedOption === code ? <em>Hypothesis to validate</em> : null}
          <small>{detail}</small>
        </button>
      ))}
    </div>
  );
}

function MovesStandaloneStyles() {
  return (
    <style>{`
.mxw {
  --bg:#f7f5f1; --card:#ffffff; --soft:#faf9f7;
  --line:rgba(12,26,58,0.10); --line-2:rgba(12,26,58,0.16);
  --ink:#0c1a3a; --ink-2:#28364f; --muted:#5b6c8a; --faint:#9aa4b5;
  --blue:#0057b8; --blue-tint:#eef4fb; --green:#1d8f68; --green-tint:#e8f5ef;
  --amber:#b0730f; --amber-tint:#fbf1df; --teal:#1f8578; --gold:#9c7b3f;
  --shadow:0 1px 2px rgba(20,20,19,.04),0 8px 24px rgba(20,20,19,.05);
  height:100%; min-height:0; overflow:auto; background:var(--bg); color:var(--ink);
  font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size:15px; line-height:1.55; -webkit-font-smoothing:antialiased;
}
.mxw *{box-sizing:border-box}
.mxw a{text-decoration:none}
.mxw button{font:inherit}
.mxw-contextbar{height:44px;border-bottom:1px solid rgba(12,26,58,.10);background:#faf9f7;color:var(--ink);display:flex;align-items:center;justify-content:space-between;padding:0 24px;gap:24px;box-shadow:none;position:sticky;top:0;z-index:60}
.mxw-contextbar>div{display:flex;align-items:center;gap:12px;min-width:0}
.mxw-contextbar span{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:var(--blue);font-weight:900}
.mxw-contextbar strong{font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:34vw}
.mxw-contextbar em{font-style:normal;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:42vw}
.mxw-mobile-rail{display:none}
.mxw-mobile-rail label{display:flex;align-items:center;gap:8px;min-width:0}
.mxw-mobile-rail label span{font-size:10.5px;letter-spacing:.7px;text-transform:uppercase;color:var(--faint);font-weight:900}
.mxw-mobile-rail select{min-width:140px;max-width:42vw;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink);font:inherit;font-size:12px;font-weight:750;padding:7px 9px}
.mxw-mobile-rail [role="tablist"]{display:flex;align-items:center;gap:4px;overflow-x:auto}
.mxw-mobile-rail [role="tab"]{border:1px solid transparent;background:transparent;color:var(--muted);font:inherit;font-size:12px;font-weight:800;border-radius:8px;padding:7px 9px;white-space:nowrap;cursor:pointer}
.mxw-mobile-rail [role="tab"].viewing{background:#e4ecf9;border-color:rgba(42,90,168,.24);color:var(--blue)}
.mxw-surface{display:block;min-height:calc(100% - 44px)}
.mxw-back{font-size:12px;color:var(--muted);display:inline-flex;margin-bottom:12px}
.mxw-back:hover{color:var(--ink)}
.mxw-phase-stepper{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px;border-bottom:1px solid rgba(12,26,58,.12);margin:0 0 18px}
.mxw-phase-stepper-step{appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:12px 8px;display:flex;align-items:center;gap:9px;min-width:0;text-align:left;color:#5b6c8a;cursor:pointer;text-decoration:none}
.mxw-phase-stepper-step:hover:not(:disabled){background:#f1f3f8}
.mxw-phase-stepper-step:disabled{color:#9aa4b5;cursor:not-allowed}
.mxw-phase-stepper-step.viewing{color:#0c1a3a;border-bottom-color:#0c1a3a}
.mxw-phase-stepper-num{flex:0 0 auto;width:22px;height:22px;border-radius:999px;border:1px solid rgba(12,26,58,.18);display:inline-flex;align-items:center;justify-content:center;font:700 10px "JetBrains Mono",ui-monospace,monospace}
.mxw-phase-stepper-step.done .mxw-phase-stepper-num{background:var(--green);color:#fff;border-color:var(--green)}
.mxw-phase-stepper-step.current .mxw-phase-stepper-num{background:#e4ecf9;color:#2a5aa8;border-color:rgba(42,90,168,.3)}
.mxw-phase-stepper-copy{min-width:0;display:flex;flex-direction:column;gap:2px}
.mxw-phase-stepper-copy strong{font-size:12.5px;font-weight:700;color:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxw-phase-stepper-copy small{font-size:10px;color:#8b95a8}
@media (max-width:900px){.mxw-phase-stepper{display:none}}
.mxw-shell{width:100%;max-width:none;margin:0;padding:24px clamp(24px,2.6vw,44px) max(128px,calc(96px + env(safe-area-inset-bottom)))}
.mxw-crumb{font-size:12px;color:var(--muted);margin-bottom:14px}
.mxw-crumb a,.mxw-crumb button{color:var(--muted);background:none;border:0;font:inherit;cursor:pointer}
.mxw-crumb a:hover,.mxw-crumb button:hover{color:var(--ink)}
.mxw-crumb span{margin:0 7px;color:var(--faint)}
.mxw-stage-head{display:grid;grid-template-columns:minmax(0,1fr) 230px;align-items:start;gap:24px;margin-bottom:20px}
.mxw-agent-chip{grid-column:1;display:inline-flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.5px;text-transform:uppercase;font-weight:600;color:var(--muted);margin-bottom:10px}
.mxw-agent-chip span{width:7px;height:7px;border-radius:50%;background:var(--teal)}
.mxw-stage-head h1{grid-column:1;font-family:Fraunces, Georgia, serif;font-size:34px;font-weight:600;letter-spacing:-.9px;line-height:1.08;margin:0 0 7px;color:var(--ink)}
.mxw-question{grid-column:1;font-size:14.5px;font-weight:700;color:var(--ink);margin-bottom:2px}
.mxw-stage-head p{grid-column:1;font-size:14.5px;color:var(--muted);line-height:1.5;max-width:82ch;margin:0}
.mxw-stage-actions{grid-column:1;display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.mxw-stage-head-compact{grid-template-columns:minmax(0,1fr);gap:0}
.mxw-stage-head-compact:empty{display:none;margin-bottom:0}
.mxw-stage-head-compact .mxw-stage-actions{margin-top:0}
.mxw-stage-download{display:inline-flex;align-items:center;min-height:34px;border:1px solid var(--line-2);border-radius:9px;background:#fff;color:#2a5aa8;padding:8px 12px;font-size:12.5px;font-weight:850;text-decoration:none;box-shadow:0 1px 2px rgba(12,26,58,.04)}
.mxw-stage-download:hover{border-color:rgba(42,90,168,.35);background:#f8fbff;color:#173f7a}
.mxw-stage-download:disabled{opacity:.55;cursor:default}
.mxw-workbook-preview{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.mxw-workbook-preview-status{display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap;color:#5b6c8a;font-size:12px;font-weight:700}
.mxw-workbook-preview-status.parsed{color:#147c5b}
.mxw-workbook-preview-status.error{color:#8a5a12}
.mxw-workbook-preview-status em{font-style:normal;border-radius:999px;background:#e4ecf9;color:#2a5aa8;padding:3px 7px;font-size:11px}
.mxw-workbook-preview-status small{width:100%;color:#8a5a12;font-size:11.5px;font-weight:650}
.mxw-workbook-review{width:100%;border:1px solid rgba(35,54,92,.14);border-radius:8px;background:#fff;padding:10px 11px;display:grid;gap:9px}
.mxw-workbook-review-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.mxw-workbook-review-summary strong{font-size:12.5px;color:var(--ink)}
.mxw-workbook-review-summary span{font-size:11.5px;color:var(--muted);font-weight:700}
.mxw-workbook-review-list{display:grid;gap:6px;max-height:280px;overflow-y:auto}
.mxw-workbook-review-list label{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--ink-2)}
.mxw-workbook-review-list input{margin-top:3px}
.mxw-workbook-review-list b{display:block;font-size:12px;color:var(--ink);font-weight:750}
.mxw-workbook-review-list em{display:block;font-style:normal;font-size:11px;color:var(--muted);font-weight:700;text-transform:capitalize}
.mxw-workbook-review-actions{display:flex;gap:7px;flex-wrap:wrap}
.mxw-workbook-review-actions button{border:1px solid rgba(0,87,184,.2);background:#fff;color:var(--blue);border-radius:8px;padding:7px 10px;font-size:12px;font-weight:800;cursor:pointer}
.mxw-workbook-review-actions button:first-child{background:var(--blue);color:#fff;border-color:var(--blue)}
.mxw-workbook-review-actions button.mxw-workbook-review-select{border-color:var(--line-2);color:var(--muted);font-weight:750}
.mxw-workbook-review-actions button:disabled{opacity:.5;cursor:not-allowed}
.mxw-workbook-review-status{font-size:11.5px;font-weight:800;color:var(--muted)}
.mxw-workbook-review-status.saved{color:#147c5b}
.mxw-workbook-review-status.error{color:#b3261e}
.mxw-phase-blocker{grid-column:1;border:1px solid rgba(196,98,51,.28);border-radius:12px;background:#fff8f3;padding:16px 18px;margin-top:12px;display:grid;gap:10px;box-shadow:0 10px 24px rgba(96,55,26,.08)}
.mxw-phase-blocker>span{display:inline-flex;width:max-content;border:1px solid rgba(196,98,51,.28);border-radius:999px;background:#fff;color:#a44d25;font-size:10px;letter-spacing:.11em;text-transform:uppercase;font-weight:900;padding:5px 8px}
.mxw-phase-blocker h2{font-family:Fraunces, Georgia, serif;font-size:22px;line-height:1.1;margin:0;color:var(--ink);letter-spacing:0}
.mxw-phase-blocker p{font-size:13px;line-height:1.45;margin:0;color:var(--ink-2);max-width:72ch}
.mxw-phase-blocker ul{display:grid;gap:7px;list-style:none;margin:0;padding:0}
.mxw-phase-blocker li{display:grid;grid-template-columns:82px minmax(0,1fr);gap:2px 10px;border:1px solid rgba(196,98,51,.16);border-radius:9px;background:#fff;padding:8px 10px}
.mxw-phase-blocker li b{grid-row:1 / span 2;color:#a44d25;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.mxw-phase-blocker li span{color:var(--ink);font-size:13px;font-weight:750}
.mxw-phase-blocker li em{grid-column:2;font-style:normal;color:var(--muted);font-size:11.5px;font-weight:650}
.mxw-primary-action{width:max-content;border:0;border-radius:9px;background:var(--ink);color:#fff;font-size:13px;font-weight:850;padding:10px 14px;cursor:pointer}
.mxw-primary-action:hover{background:#000}
.mxw-progress-card{grid-column:2;grid-row:1 / span 4;align-self:center;width:230px;border:1px solid var(--line-2);border-radius:12px;background:#fff;padding:14px 16px;box-shadow:none}
.mxw-progress-card strong{display:block;font-family:Fraunces, Georgia, serif;font-size:20px;font-weight:650;line-height:1.05;margin-bottom:9px;color:var(--ink)}
.mxw-progress-card>em{display:block;margin-top:10px;border-top:1px solid var(--line);padding-top:9px;color:var(--muted);font-size:11.5px;font-style:normal;font-weight:650;line-height:1.35}
.mxw-progress-meta{display:grid;gap:6px;margin-top:10px}
.mxw-progress-meta span{display:grid;grid-template-columns:52px minmax(0,1fr);gap:8px;align-items:start;color:var(--muted);font-size:11.5px;font-weight:750;line-height:1.25}
.mxw-progress-meta b{color:#8b95a8;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.mxw-progress-signal.ready{color:var(--green)}
.mxw-progress-signal.blocked{color:var(--amber)}
.mxw-progress-signal.open{color:#8a5a12}
.mxw-surface-tabs{display:inline-flex;align-items:center;gap:2px;background:rgba(12,26,58,.05);border-radius:10px;padding:3px;margin:0 0 20px;overflow-x:auto}
.mxw-surface-tabs button{position:relative;border:0;background:transparent;color:var(--muted);padding:7px 15px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.mxw-surface-tabs button:hover{color:var(--ink);background:rgba(255,255,255,.62)}
.mxw-surface-tabs button.active{color:var(--ink);background:#fff;box-shadow:0 1px 2px rgba(12,26,58,.08)}
.mxw-surface-tabs button.active::before{content:none}
.mxw-surface-tabs--secondary{background:transparent;padding:0;gap:4px;margin:0 0 14px;opacity:.9}
.mxw-surface-tabs--secondary button{font-size:12px;font-weight:500;color:var(--muted);padding:5px 10px;border-radius:7px}
.mxw-surface-tabs--secondary button.active{background:rgba(12,26,58,.06);color:var(--ink);box-shadow:none}
.mxw-finder-on .mxw-surface-tabs--secondary button.active::before{content:none}
.mxw-progress{display:flex;align-items:center;gap:14px;flex:1}
.mxw-track{flex:1;height:6px;border-radius:3px;background:rgba(20,20,19,.07);overflow:hidden;max-width:260px}
.mxw-track span{display:block;height:100%;background:var(--green);border-radius:3px;transition:width .35s ease}
.mxw-step-label{font-size:13px;color:var(--muted);font-weight:500;white-space:nowrap}
.mxw-step-label b{color:var(--ink);font-weight:600}
.mxw-btn{padding:10px 18px;border-radius:9px;font-size:14px;font-weight:600;border:1px solid transparent;cursor:pointer}
.mxw-primary{background:var(--ink);color:#fff}
.mxw-primary:hover{background:#000}
.mxw-secondary{border:1px solid var(--line-2);background:var(--card);color:var(--ink)}
.mxw-secondary:hover{background:var(--soft)}
.mxw-workflow-guide{border:1px solid var(--line-2);border-top:0;border-radius:0 0 13px 13px;background:var(--card);box-shadow:var(--shadow);padding:16px;margin:0 0 18px}
.mxw-guide-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}
.mxw-guide-head>div{display:flex;align-items:baseline;gap:10px;min-width:0;flex-wrap:wrap}
.mxw-guide-head span{font-size:10.5px;letter-spacing:.95px;text-transform:uppercase;color:var(--blue);font-weight:900}
.mxw-guide-head strong{font-size:15px;color:var(--ink)}
.mxw-guide-head em{font-style:normal;font-size:12px;color:var(--muted);font-weight:700;white-space:nowrap}
.mxw-guide-table{display:grid;grid-template-columns:1.05fr 1.45fr 1.25fr .9fr;border:1px solid var(--line);border-radius:11px;overflow:hidden}
.mxw-guide-table div{padding:11px 12px;border-right:1px solid var(--line);background:var(--soft);min-width:0}
.mxw-guide-table div:nth-child(2){background:#fff}
.mxw-guide-table div:last-child{border-right:0}
.mxw-guide-table span{display:block;font-size:9.5px;letter-spacing:.7px;text-transform:uppercase;color:var(--faint);font-weight:900;margin-bottom:5px}
.mxw-guide-table p{font-size:12.5px;line-height:1.42;color:var(--ink-2);margin:0}
.mxw-howto{border:1px solid var(--line-2);border-radius:13px;background:linear-gradient(180deg,#fbfaf7,var(--card) 60%);padding:18px 20px}
.mxw-howto header{display:flex;align-items:center;gap:10px;margin-bottom:15px}
.mxw-howto header span,.mxw-assembly span{width:26px;height:26px;border-radius:7px;background:#12332e;color:#5fd0c2;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:800;font-size:14px}
.mxw-ava-head .avaAskMark,.mxw-ava-fab .avaAskMark{border-radius:9px;overflow:hidden}
.mxw-howto h2,.mxw-zone h2,.mxw-review h2,.mxw-gate h2{font-family:Georgia,serif;font-size:19px;font-weight:700;letter-spacing:-.4px;margin:0}
.mxw-howflow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:stretch}
.mxw-how-step{position:relative;display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:start;border:1px solid rgba(20,20,19,.08);border-radius:11px;background:rgba(255,255,255,.62);padding:13px 14px;min-height:96px}
.mxw-how-step:not(:last-child)::after{content:"→";position:absolute;right:-13px;top:50%;transform:translateY(-50%);width:12px;text-align:center;color:var(--faint);font-size:14px;font-weight:700}
.mxw-how-step span{width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.mxw-how-step strong{display:block;font-size:14px;color:var(--ink);margin:1px 0 5px}
.mxw-how-step small{display:block;font-size:12.5px;color:var(--muted);line-height:1.42;max-width:24ch}
.mxw-zone{margin-top:24px}
.mxw-zone>p{font-size:13px;color:var(--muted);margin:5px 0 15px;line-height:1.5;max-width:70ch}
.mxw-capture{border:1px solid rgba(0,87,184,.16);border-radius:14px;background:linear-gradient(180deg,var(--blue-tint),var(--card) 58%);padding:16px 18px;box-shadow:var(--shadow)}
.mxw-capture.compact{padding:14px 16px}
.mxw-capture header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
.mxw-capture header span{display:block;font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase;color:var(--blue);font-weight:900;margin-bottom:4px}
.mxw-capture header h2{font-family:Georgia,serif;font-size:19px;font-weight:700;letter-spacing:-.4px;margin:0;color:var(--ink)}
.mxw-capture header p{font-size:13px;color:var(--ink-2);line-height:1.45;margin:4px 0 0;max-width:72ch}
.mxw-capture header strong{white-space:nowrap;border:1px solid rgba(0,87,184,.2);border-radius:999px;background:var(--card);color:var(--blue);font-size:12px;font-weight:900;padding:7px 10px}
.mxw-capture-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mxw-capture-card{display:grid;grid-template-columns:32px minmax(0,1fr);gap:3px 10px;border:1px solid var(--line);border-radius:11px;background:var(--card);padding:12px 13px}
.mxw-capture-card.complete{border-color:rgba(29,143,104,.28)}
.mxw-capture-card.saving{border-color:rgba(0,87,184,.34)}
.mxw-capture-card.editing{border-color:rgba(178,112,0,.36)}
.mxw-capture-card.error{border-color:rgba(183,43,43,.4)}
.mxw-capture-card>span{grid-row:1 / span 2;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--ink);color:#fff;font-size:10px;font-weight:900}
.mxw-capture-card.complete>span{background:var(--green)}
.mxw-capture-card strong{font-size:13.5px;color:var(--ink);line-height:1.25}
.mxw-capture-card small{font-size:12px;color:var(--muted);line-height:1.35}
.mxw-capture-card em{justify-self:start;border-radius:8px;background:rgba(12,26,58,.06);color:var(--muted);font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;font-style:normal;font-weight:800;letter-spacing:.12em;padding:4px 7px;text-transform:uppercase}
.mxw-capture-card.complete em{background:rgba(29,158,117,.13);color:#147c5b}
.mxw-capture-card.saving em{background:rgba(0,87,184,.12);color:var(--blue)}
.mxw-capture-card.editing em{background:rgba(178,112,0,.12);color:#8a5a00}
.mxw-capture-card.error em{background:rgba(183,43,43,.12);color:#9f2626}
.mxw-capture-card textarea{grid-column:1 / -1;width:100%;resize:vertical;border:1px solid var(--line-2);border-radius:9px;background:#fff;color:var(--ink);font:inherit;font-size:13px;line-height:1.45;padding:9px 10px;margin-top:7px;min-height:74px}
.mxw-capture-card textarea:focus{outline:2px solid rgba(0,87,184,.22);border-color:rgba(0,87,184,.5)}
.mxw-capture-save-note,.mxw-capture-save-error{grid-column:1 / -1;margin:8px 0 0;font-size:12px;line-height:1.4}
.mxw-capture-save-note{color:#6f5200}
.mxw-capture-save-error{color:#9f2626}
.mxw-ts-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,1fr);gap:16px}
.mxw-ts-col{border:1px solid var(--line);border-radius:12px;background:var(--card);overflow:hidden}
.mxw-ts-col header{padding:13px 16px;border-bottom:1px solid var(--line);background:var(--soft);display:flex;align-items:center;gap:9px}
.mxw-ts-col header span{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--faint);font-weight:700}
.mxw-ts-col header b{margin-left:auto;font-size:11px;color:var(--faint)}
.mxw-session{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--line);font-size:13.5px;color:var(--ink-2)}
.mxw-session:last-child,.mxw-template:last-child{border-bottom:0}
.mxw-session span{width:7px;height:7px;border-radius:50%;background:var(--teal);flex-shrink:0}
.mxw-template{display:grid;grid-template-columns:34px 1fr auto;gap:12px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line)}
.mxw-template em{width:34px;height:34px;border-radius:8px;background:var(--blue-tint);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:8.5px;font-style:normal;font-weight:700}
.mxw-template span{font-size:13.5px;font-weight:500;color:var(--ink)}
.mxw-template small{font-size:12px;font-weight:700;color:var(--muted);white-space:nowrap}
.mxw-command{border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:var(--shadow);padding:18px;margin-top:18px}
.mxw-command>header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.mxw-command>header span{display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--blue);font-weight:900;margin-bottom:4px}
.mxw-command>header h2{font-family:Georgia,serif;font-size:22px;line-height:1.15;letter-spacing:-.4px;margin:0;color:var(--ink)}
.mxw-command>header p{font-size:13px;color:var(--muted);line-height:1.45;margin:5px 0 0;max-width:74ch}
.mxw-command>header strong{width:44px;height:44px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px}
.mxw-command-table{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line);border-radius:11px;overflow:hidden;margin-top:14px}
.mxw-command-table div{padding:12px;border-right:1px solid var(--line);background:var(--soft);min-height:116px}
.mxw-command-table div:last-child{border-right:0}
.mxw-command-table span{display:block;font-size:12px;font-weight:900;color:var(--ink);margin-bottom:6px}
.mxw-command-table p{font-size:12px;color:var(--muted);line-height:1.4;margin:0 0 10px}
.mxw-command-table b{display:inline-flex;border-radius:999px;background:var(--blue-tint);color:var(--blue);padding:4px 8px;font-size:10px}
.mxw-command-table button{border:0;border-radius:8px;background:var(--ink);color:#fff;font-size:11px;font-weight:800;padding:7px 10px;cursor:pointer}
.mxw-command-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}
.mxw-command-grid article{border:1px solid var(--line);border-radius:11px;background:var(--soft);padding:12px}
.mxw-command-grid span{display:block;font-size:9.5px;letter-spacing:.9px;text-transform:uppercase;color:var(--faint);font-weight:900;margin-bottom:7px}
.mxw-command-grid ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}
.mxw-command-grid li{font-size:12.5px;color:var(--ink-2);line-height:1.35}
.mxw-command-grid em{font-style:normal;font-size:10px;color:var(--blue);font-weight:900;margin-left:5px}
.mxw-evidence-table{border:1px solid var(--line);border-radius:11px;overflow:hidden;background:var(--card);margin-top:14px}
.mxw-evidence-table.empty{padding:14px;font-size:13px;color:var(--muted)}
.mxw-evidence-row{display:grid;grid-template-columns:minmax(170px,.8fr) minmax(0,1.4fr) 96px;gap:12px;align-items:center;padding:11px 12px;border-bottom:1px solid var(--line)}
.mxw-evidence-row:last-child{border-bottom:0}
.mxw-evidence-row.head{background:var(--soft);font-size:9px;letter-spacing:.9px;text-transform:uppercase;color:var(--faint);font-weight:900}
.mxw-evidence-row strong{font-size:12.5px;color:var(--ink);line-height:1.3}
.mxw-evidence-row p{font-size:12px;color:var(--muted);line-height:1.35;margin:0}
.mxw-evidence-row em{justify-self:start;border-radius:999px;border:1px solid var(--line-2);padding:4px 8px;font-style:normal;font-size:10px;font-weight:900;color:var(--muted)}
.mxw-evidence-row em.covered,.mxw-evidence-row em.waived,.mxw-evidence-row em.not_applicable{border-color:rgba(29,143,104,.35);background:var(--green-tint);color:var(--green)}
.mxw-evidence-row em.partial{border-color:rgba(176,115,15,.35);background:var(--amber-tint);color:var(--amber)}
.mxw-evidence-more{padding:10px 12px;font-size:12px;color:var(--blue);font-weight:800;background:var(--blue-tint)}
.mxw-assembly,.mxw-approach,.mxw-review,.mxw-gate{border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:var(--shadow);padding:18px 20px;margin-top:20px}
.mxw-assembly{background:linear-gradient(180deg,#f4fbf9,var(--card) 60%)}
.mxw-assembly div{display:flex;align-items:center;gap:11px}
.mxw-assembly strong{font-family:Georgia,serif;font-size:17px}
.mxw-assembly em{margin-left:auto;font-size:11px;font-style:normal;color:var(--green);font-weight:700;text-transform:uppercase}
.mxw-assembly p,.mxw-approach p,.mxw-review p{font-size:14px;color:var(--ink-2);line-height:1.55;margin:11px 0 0}
.mxw-findings{display:grid;gap:10px}
.mxw-finding{border:1px solid var(--line);border-radius:12px;background:var(--card);padding:14px 16px}
.mxw-finding span{display:inline-block;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--teal);font-weight:700;margin-bottom:5px}
.mxw-finding strong{display:block;font-size:14px;color:var(--ink)}
.mxw-finding small{display:block;font-size:12px;color:var(--muted);margin-top:5px}
.mxw-findings-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:16px}
.mxw-approach{border-color:rgba(0,87,184,.25);background:linear-gradient(180deg,var(--blue-tint),var(--card) 60%)}
.mxw-approach div{font-size:9px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:var(--blue);margin-bottom:9px}
.mxw-approach h2{font-family:Georgia,serif;font-size:21px;margin:0}
.mxw-option-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 14px}
.mxw-option-summary div{border:1px solid var(--line);border-radius:11px;background:var(--soft);padding:12px 14px;min-width:0}
.mxw-option-summary span{display:block;font-size:9.5px;letter-spacing:.7px;text-transform:uppercase;color:var(--faint);font-weight:800;margin-bottom:4px}
.mxw-option-summary strong{display:block;font-size:13.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxw-option-summary small{display:block;font-size:12px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxw-decision-selected-option{display:grid;gap:4px;border:1px solid var(--line-2);border-radius:9px;background:var(--soft);padding:12px 14px;margin-top:12px}
.mxw-decision-selected-option span{font-size:10px;color:var(--muted);font-weight:800;text-transform:uppercase}
.mxw-decision-selected-option strong{font-size:14px;color:var(--ink)}
.mxw-options{display:grid;gap:10px}
.mxw-options button{border:1px solid var(--line);border-radius:12px;background:var(--card);padding:14px 16px;display:grid;grid-template-columns:28px 1fr auto;gap:10px;text-align:left;cursor:pointer;align-items:center}
.mxw-options button.selected{border-color:var(--green);background:var(--green-tint)}
.mxw-options button>span{width:24px;height:24px;border-radius:7px;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.mxw-options strong{font-size:14px;color:var(--ink)}
.mxw-options em{font-style:normal;font-size:11px;font-weight:700;color:var(--green)}
.mxw-options small{grid-column:2 / 4;font-size:12.5px;color:var(--muted)}
.mxw-options dl{grid-column:2 / 4;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:2px 0 0}
.mxw-options dl div{border:1px solid rgba(20,20,19,.07);border-radius:9px;background:rgba(255,255,255,.55);padding:9px 10px}
.mxw-options dt{font-size:9.5px;letter-spacing:.45px;text-transform:uppercase;color:var(--faint);font-weight:800;margin:0 0 3px}
.mxw-options dd{font-size:12px;line-height:1.4;color:var(--ink-2);margin:0}
.mxw-option-meta,.mxw-option-blocks,.mxw-option-caution{grid-column:2 / 4}
.mxw-option-meta{display:flex;flex-wrap:wrap;gap:7px}
.mxw-option-meta b{border:1px solid var(--line);border-radius:999px;background:var(--card);padding:5px 9px;font-size:10.8px;color:var(--muted);font-weight:800}
.mxw-option-blocks{display:flex;flex-wrap:wrap;gap:6px}
.mxw-option-blocks i{border:1px solid rgba(0,87,184,.16);border-radius:999px;background:var(--blue-tint);color:var(--blue);font-style:normal;font-size:10.5px;font-weight:800;padding:5px 8px}
.mxw-option-caution{border:1px solid rgba(176,115,15,.25);border-radius:10px;background:var(--amber-tint);padding:9px 10px;font-size:12px;color:var(--ink-2);line-height:1.4}
.mxw-option-caution b{display:block;color:var(--amber);font-size:10.5px;letter-spacing:.4px;text-transform:uppercase;margin-bottom:3px}
.mxw-action-panel{margin-top:18px;border:1px solid rgba(29,143,104,.28);border-radius:14px;background:linear-gradient(180deg,var(--green-tint),var(--card) 70%);box-shadow:var(--shadow);padding:16px 18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center}
.mxw-action-panel.supporting{border-color:var(--line-2);background:var(--soft);box-shadow:none}
.mxw-action-panel.supporting>div>span{color:var(--muted)}
.mxw-action-panel span{display:block;font-size:10px;letter-spacing:.9px;text-transform:uppercase;color:var(--green);font-weight:900;margin-bottom:4px}
.mxw-action-panel h2{font-family:Georgia,serif;font-size:20px;font-weight:700;letter-spacing:-.35px;line-height:1.15;margin:0;color:var(--ink)}
.mxw-action-panel p{font-size:13px;color:var(--ink-2);line-height:1.45;margin:5px 0 0;max-width:72ch}
.mxw-family-upload{border:1px solid rgba(29,143,104,.28);border-radius:14px;background:linear-gradient(180deg,var(--green-tint),var(--card) 68%);box-shadow:var(--shadow);padding:18px;display:grid;gap:14px}
.mxw-family-upload>header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;border-bottom:1px solid rgba(29,143,104,.18);padding-bottom:13px}
.mxw-family-upload>header span{display:block;font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:var(--green);font-weight:900;margin-bottom:4px}
.mxw-family-upload>header h2{font-family:Georgia,serif;font-size:21px;font-weight:700;letter-spacing:-.35px;line-height:1.15;margin:0;color:var(--ink)}
.mxw-family-upload>header p{font-size:13px;color:var(--ink-2);line-height:1.45;margin:5px 0 0;max-width:74ch}
.mxw-family-upload-strip{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.mxw-family-upload-mode,.mxw-upload-family{display:grid;gap:4px;color:var(--muted);font-size:10px;font-weight:800}
.mxw-family-upload-mode select,.mxw-upload-family select{min-height:36px;max-width:100%;border:1px solid var(--line-2);border-radius:6px;background:var(--card);color:var(--ink);font:inherit;font-size:12px;padding:7px 9px}
.mxw-family-upload-mode select:focus,.mxw-upload-family select:focus{outline:2px solid rgba(42,90,168,.18);border-color:var(--blue)}
.mxw-family-upload-strip>span{font-size:12.5px;color:var(--muted);font-weight:750}
.mxw-family-upload-message{border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink-2);font-size:12.5px;line-height:1.45;margin:0;padding:10px 12px}
.mxw-family-results{display:grid;gap:6px}
.mxw-family-results div{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;background:#fff;padding:9px 11px}
.mxw-family-results div.uploaded{border-color:rgba(29,143,104,.25);background:var(--green-tint)}
.mxw-family-results div.error{border-color:rgba(180,35,24,.25);background:#fff7f6}
.mxw-family-results strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;color:var(--ink)}
.mxw-family-results span{font-size:12px;color:var(--ink-2)}
.mxw-family-results em{font-style:normal;font-size:11px;font-weight:850;color:var(--muted);white-space:nowrap}
.mxw-family-results div.uploaded em{color:var(--green)}
.mxw-family-results div.error em{color:#b42318}
.mxw-family-table{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}
.mxw-family-table>div{display:grid;grid-template-columns:minmax(190px,.8fr) minmax(0,1.4fr) 116px;gap:12px;align-items:center;border-bottom:1px solid var(--line);padding:11px 12px}
.mxw-family-table>div:last-child{border-bottom:0}
.mxw-family-table>.head{background:var(--soft);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:900}
.mxw-family-table strong{font-size:12.5px;color:var(--ink);line-height:1.3}
.mxw-family-table p{font-size:12px;color:var(--muted);line-height:1.35;margin:0}
.mxw-family-table em{justify-self:start;border:1px solid var(--line-2);border-radius:999px;background:var(--soft);color:var(--muted);font-style:normal;font-size:10px;font-weight:900;padding:5px 8px;text-transform:capitalize}
.mxw-family-table em.committed{border-color:rgba(29,143,104,.35);background:var(--green-tint);color:var(--green)}
.mxw-family-table em.review_required{border-color:rgba(176,115,15,.35);background:var(--amber-tint);color:var(--amber)}
.mxw-upload{margin-top:20px;border:1px dashed var(--line-2);border-radius:13px;background:var(--soft);padding:18px;display:flex;align-items:center;justify-content:space-between;gap:14px}
.mxw-upload strong{display:block;font-size:14px}
.mxw-upload span{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}
.mxw-review-actions a{padding:10px 16px;border-radius:9px;background:var(--ink);color:#fff;font-size:13px;font-weight:700;white-space:nowrap}
.mxw-inline-upload{margin:18px 0 22px;border:1px dashed var(--line-2);border-radius:13px;background:var(--soft);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.mxw-inline-upload strong{display:block;font-size:14px}
.mxw-inline-upload span{display:block;font-size:12.5px;color:var(--muted);margin-top:2px;max-width:64ch}
.mxw-upload-stack{display:grid;gap:10px;justify-items:end;min-width:min(440px,100%)}
.mxw-upload-control{display:flex;align-items:end;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.mxw-hidden-file{position:absolute;inline-size:1px;block-size:1px;opacity:0;pointer-events:none}
.mxw-upload-control button{padding:10px 16px;border-radius:9px;background:var(--ink);color:#fff;border:0;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}
.mxw-upload-control button.secondary{border:1px solid var(--line-2);background:var(--card);color:var(--ink)}
.mxw-upload-control button:disabled{opacity:.6;cursor:wait}
.mxw-upload-status{font-size:12px;font-weight:700;color:var(--muted)}
.mxw-upload-status.uploaded{color:var(--green)}
.mxw-upload-status.error{color:#b84a31}
.mxw-uploaded-files{width:100%;border:1px solid rgba(29,143,104,.22);border-radius:11px;background:#fff;padding:10px 11px;display:grid;gap:7px}
.mxw-uploaded-files header{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mxw-uploaded-files header strong{font-size:12px;color:var(--ink)}
.mxw-uploaded-files header button{border:1px solid var(--line-2);background:var(--soft);color:var(--ink);border-radius:8px;padding:6px 8px;font-size:11px;font-weight:800;cursor:pointer}
.mxw-uploaded-files div{display:grid;gap:1px;border-top:1px solid var(--line);padding-top:7px}
.mxw-uploaded-files div:first-of-type{border-top:0;padding-top:0}
.mxw-uploaded-files span{font-size:12.5px;color:var(--ink);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.mxw-uploaded-files em{font-style:normal;font-size:11.5px;color:var(--muted);font-weight:700}
.mxw-lanes{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mxw-lane{border:1px solid var(--line);border-radius:13px;background:var(--card);overflow:hidden}
.mxw-lane header{display:flex;align-items:center;gap:10px;background:var(--soft);border-bottom:1px solid var(--line);padding:12px 14px}
.mxw-lane header span{width:24px;height:24px;border-radius:8px;background:var(--blue-tint);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px}
.mxw-lane header strong{font-size:14px}
.mxw-lane p{font-size:13px;color:var(--ink-2);line-height:1.45;margin:0;padding:14px}
.mxw-value-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.mxw-value-grid div{border:1px solid var(--line);border-radius:12px;background:var(--card);padding:14px 16px}
.mxw-value-grid span{display:block;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--faint);font-weight:700}
.mxw-value-grid strong{display:block;font-size:18px;margin-top:4px}
.mxw-evidence-count-link{display:inline-block;font:inherit;font-size:18px;margin-top:4px;background:none;border:0;padding:0;color:inherit;text-align:left;cursor:pointer;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:3px;transition:text-decoration-color .12s ease}
.mxw-evidence-count-link:hover,.mxw-evidence-count-link:focus-visible{text-decoration-color:currentColor}
.mxw-decision-chips .mxw-evidence-count-link{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted);font-size:10.5px;font-weight:900;padding:5px 8px;white-space:nowrap;margin-top:0;text-decoration:none}
.mxw-decision-chips .mxw-evidence-count-link:hover,.mxw-decision-chips .mxw-evidence-count-link:focus-visible{background:var(--soft)}
.mxw-evidence-count-link-strong{font-weight:600}
.mxw-review-flow{display:flex;gap:6px;flex-wrap:wrap;margin:15px 0}
.mxw-review-flow span{padding:7px 12px;border:1px solid var(--line-2);border-radius:999px;font-size:12px;font-weight:600;color:var(--muted)}
.mxw-review-flow span.done{background:var(--green-tint);color:var(--green);border-color:var(--green)}
.mxw-review-flow span.cur{background:var(--blue-tint);color:var(--blue);border-color:var(--blue)}
.mxw-review-actions{display:flex;gap:10px;flex-wrap:wrap}
.mxw-gate header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.mxw-gate header p{font-size:13px;color:var(--muted);line-height:1.45;margin:6px 0 0;max-width:660px}
.mxw-gate header>strong{border:1px solid var(--line-2);border-radius:999px;padding:7px 12px;font-size:13px;white-space:nowrap}
.mxw-gate div{display:grid;gap:8px;margin-top:12px}
.mxw-gate-group{display:grid;gap:8px;margin-top:14px}
.mxw-gate-unevaluated{margin:0 0 8px!important;font-size:12px!important;line-height:1.5;color:var(--muted)!important}
.mxw-gate-group-label{border:0!important;background:transparent!important;padding:0!important;font-size:10px!important;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)!important;font-weight:800}
.mxw-gate span{display:block;border:1px solid var(--line);border-radius:10px;background:var(--soft);padding:12px 14px;font-size:13px;color:var(--ink-2)}
.mxw-gate span.met{background:var(--green-tint);color:var(--green);border-color:rgba(29,143,104,.25)}
.mxw-gate span.soft-open{border-style:dashed;color:var(--muted)}
.mxw-gate span.approval-generated{background:#fffdf7;border-color:rgba(176,115,15,.24)}
.mxw-gate span em{display:block;margin-top:5px;font-style:normal;font-size:11px;color:var(--muted)}
.mxw-exec-readout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}
.mxw-exec-readout article{border:1px solid var(--line);border-radius:12px;background:var(--soft);padding:14px 16px}
.mxw-exec-readout p{font-size:12.8px;line-height:1.45;color:var(--ink-2);margin:0}
.mxw-exec-readout ul{margin:0;padding-left:16px;display:grid;gap:5px}
.mxw-exec-readout li{font-size:12.8px;line-height:1.4;color:var(--ink-2)}
.mxw-exec-label{display:block;font-size:10px;letter-spacing:.7px;text-transform:uppercase;color:var(--faint);font-weight:800;margin-bottom:8px}
.mxw-review{border:0;background:transparent;box-shadow:none;padding:0;margin-top:0}
.mxw-review>p{max-width:760px}
.mxw-decision-surface{display:grid;grid-template-columns:minmax(0,1fr);gap:0;margin:14px 0;align-items:stretch;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.06);overflow:hidden}
.mxw-decision-surface article{border:0;border-radius:0;background:#fff;padding:16px 18px;min-width:0}
.mxw-decision-surface.blocked{border-left:4px solid var(--amber)}
.mxw-decision-surface.ready{border-left:4px solid var(--green)}
.mxw-decision-surface.complete{border-left:4px solid var(--blue)}
.mxw-decision-primary{background:#fff!important}
.mxw-decision-primary h3{font-family:Fraunces, Georgia, serif;font-size:22px;line-height:1.1;letter-spacing:-.45px;margin:0;color:var(--ink)}
.mxw-decision-surface strong{display:block;font-size:14px;line-height:1.3;color:var(--ink);margin-bottom:6px}
.mxw-decision-surface p{font-size:12.8px;line-height:1.45;color:var(--ink-2);margin:7px 0 0}
.mxw-decision-surface ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.mxw-decision-surface li{font-size:12.5px;line-height:1.38;color:var(--ink-2)}
.mxw-decision-surface li strong{display:inline;font-size:inherit;margin:0;color:var(--ink)}
.mxw-decision-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.mxw-decision-chips span{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted);font-size:10.5px;font-weight:900;padding:5px 8px;white-space:nowrap}
.mxw-decision-surface.blocked .mxw-decision-chips span:first-child{border-color:rgba(176,115,15,.32);background:var(--amber-tint);color:var(--amber)}
.mxw-decision-surface.ready .mxw-decision-chips span:first-child,.mxw-decision-surface.complete .mxw-decision-chips span:first-child{border-color:rgba(29,143,104,.32);background:var(--green-tint);color:var(--green)}
.mxw-gate-why-panel{border-top:1px solid var(--line);background:var(--soft);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:14px 18px;align-items:start}
.mxw-gate-why-copy strong{font-size:14px;line-height:1.35;margin:0;color:var(--ink)}
.mxw-gate-why-copy p{font-size:12.8px;line-height:1.45;margin:5px 0 0;color:var(--ink-2)}
.mxw-gate-why-proof{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap;max-width:330px}
.mxw-gate-why-proof span{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted);font-size:10.5px;font-weight:900;padding:5px 8px;white-space:nowrap}
.mxw-gate-blocker-list{grid-column:1/-1;border-top:1px solid var(--line);padding-top:10px!important}
.mxw-gate-blocker-list li{display:block;color:var(--ink-2)}
.mxw-decision-details{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}
.mxw-decision-details summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:140px minmax(0,1fr);gap:12px;align-items:center;padding:11px 14px}
.mxw-decision-details summary::-webkit-details-marker{display:none}
.mxw-decision-details summary span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;color:var(--blue)}
.mxw-decision-details summary strong{font-size:12.5px;line-height:1.35;color:var(--ink-2);font-weight:750}
.mxw-decision-details[open] summary{border-bottom:1px solid var(--line);background:var(--soft)}
.mxw-decision-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:12px}
.mxw-decision-detail-grid article{background:#fff}
.mxw-gate-detail{border:1px solid var(--line);border-radius:12px;background:var(--soft);margin:14px 0;overflow:hidden}
.mxw-gate-detail summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px}
.mxw-gate-detail summary::-webkit-details-marker{display:none}
.mxw-gate-detail summary span{font-size:12.5px;color:var(--ink);font-weight:850}
.mxw-gate-detail summary strong{font-size:11.5px;color:var(--muted);font-weight:850;white-space:nowrap}
.mxw-gate-detail[open] summary{background:#fff;border-bottom:1px solid var(--line)}
.mxw-gate-detail .mxw-gate-table{border:0;border-radius:0;margin:0}
.mxw-gate-table{width:100%;border-collapse:separate;border-spacing:0;margin:15px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--card)}
.mxw-gate-table th{background:var(--soft);border-bottom:1px solid var(--line);color:var(--faint);font-size:10px;letter-spacing:.7px;text-transform:uppercase;text-align:left;padding:10px 12px}
.mxw-gate-table td{border-bottom:1px solid var(--line);font-size:12.8px;line-height:1.42;color:var(--ink-2);padding:11px 12px;vertical-align:top}
.mxw-gate-table tr:last-child td{border-bottom:0}
.mxw-gate-table td:first-child{font-weight:800;color:var(--ink);width:28%}
.mxw-gate-table td:last-child{width:110px}
.mxw-gate-table .met,.mxw-gate-table .pending{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;white-space:nowrap}
.mxw-gate-table .met{border:1px solid rgba(29,143,104,.35);background:var(--green-tint);color:var(--green)}
.mxw-gate-table .pending{border:1px solid var(--line-2);background:var(--soft);color:var(--muted)}
.mxw-gate-mini-list{list-style:none;margin:0;padding:10px 12px 12px;display:grid;gap:8px;background:#fff}
.mxw-gate-mini-list li{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:9px;align-items:start;border:1px solid var(--line);border-radius:10px;background:var(--soft);padding:10px 11px}
.mxw-gate-mini-list li>span{width:20px;height:20px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:#fff;color:var(--muted);font-size:11px;font-weight:900}
.mxw-gate-mini-list li.met{border-color:rgba(29,143,104,.28);background:var(--green-tint)}
.mxw-gate-mini-list li.met>span{background:var(--green);color:#fff}
.mxw-gate-mini-list strong{display:block;color:var(--ink);font-size:12.5px;line-height:1.25}
.mxw-gate-mini-list p{margin:3px 0 0;color:var(--muted);font-size:12px;line-height:1.35}
.mxw-gate-mini-list em{font-style:normal;border:1px solid var(--line-2);border-radius:999px;background:#fff;color:var(--muted);font-size:10.5px;font-weight:900;padding:4px 8px;white-space:nowrap}
.mxw-gate-mini-list li.met em{border-color:rgba(29,143,104,.28);color:var(--green)}
.mxw-approval-disclosures{display:grid;gap:9px;margin:14px 0 0}
.mxw-approval-disclosures details{border:1px solid var(--line);border-radius:12px;background:var(--soft);overflow:hidden}
.mxw-approval-disclosures summary{display:flex;align-items:center;justify-content:space-between;gap:14px;list-style:none;cursor:pointer;padding:11px 13px}
.mxw-approval-disclosures summary::-webkit-details-marker{display:none}
.mxw-approval-disclosures summary span{font-size:12.5px;color:var(--ink);font-weight:850}
.mxw-approval-disclosures summary strong{font-size:11.5px;color:var(--muted);font-weight:850;white-space:nowrap}
.mxw-approval-disclosures details[open] summary{border-bottom:1px solid var(--line);background:#fff}
.mxw-approval-disclosures details>p{font-size:12.8px;color:var(--ink-2);line-height:1.45;margin:12px 13px}
.mxw-gate-group.compact{margin:12px 13px}
.mxw-readiness-needs.compact{margin:12px 13px}
.mxw-readiness-needs.compact .mxw-readiness-need{background:#fff}
.mxw-kdd{margin:15px 0;border:1px solid var(--line);border-radius:12px;background:var(--card);overflow:hidden}
.mxw-kdd summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:160px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px;background:var(--soft)}
.mxw-kdd summary::-webkit-details-marker{display:none}
.mxw-kdd summary span{font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--blue);font-weight:900}
.mxw-kdd summary strong{font-size:13.5px;color:var(--ink)}
.mxw-kdd summary em{font-style:normal;border:1px solid var(--line-2);border-radius:999px;background:#fff;color:var(--muted);font-size:11px;font-weight:850;padding:4px 8px;white-space:nowrap}
.mxw-kdd-body{padding:14px;display:grid;gap:12px;border-top:1px solid var(--line)}
.mxw-kdd-fields{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:10px}
.mxw-kdd label{display:grid;gap:5px;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--faint);font-weight:900}
.mxw-kdd input,.mxw-kdd textarea{width:100%;border:1px solid var(--line-2);border-radius:9px;background:#fff;color:var(--ink);font:inherit;font-size:12.5px;line-height:1.4;padding:8px 9px;text-transform:none;letter-spacing:0;font-weight:500}
.mxw-kdd textarea{resize:vertical}
.mxw-kdd input:focus,.mxw-kdd textarea:focus{outline:2px solid rgba(0,87,184,.18);border-color:rgba(0,87,184,.45)}
.mxw-kdd-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.mxw-kdd-options article{display:grid;gap:8px;border:1px solid var(--line);border-radius:11px;background:var(--soft);padding:10px}
.mxw-kdd-options article.selected{border-color:rgba(29,143,104,.45);background:var(--green-tint)}
.mxw-kdd-radio{display:flex!important;align-items:center;gap:7px;color:var(--ink-2)!important;text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:800!important}
.mxw-kdd-radio input{width:auto}
.mxw-kdd-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.mxw-kdd-actions span{font-size:12px;font-weight:750;color:var(--muted)}
.mxw-kdd-actions span.saved{color:var(--green)}
.mxw-kdd-actions span.error{color:#b42318}
.mxw-kdd-actions a{font-size:12px;font-weight:850;color:var(--blue)}
.mxw-gate-note{display:grid;gap:4px;margin:12px 0 4px;border:1px solid rgba(176,115,15,.24);background:#fffdf7;border-radius:11px;padding:11px 13px}
.mxw-gate-note strong{font-size:12px}
.mxw-gate-note span{font-size:12.5px;color:var(--ink-2);line-height:1.45}
.mxw-gate-message{border-radius:10px;padding:11px 13px;margin:12px 0 0;font-size:13px;font-weight:650;border:1px solid var(--line-2);background:var(--soft);color:var(--ink-2)}
.mxw-gate-message.approved{border-color:rgba(29,143,104,.35);background:var(--green-tint);color:var(--green)}
.mxw-gate-message.blocked{border-color:rgba(176,115,15,.35);background:var(--amber-tint);color:#6d4300}
.mxw-gate-message.approving{border-color:rgba(0,87,184,.25);background:var(--blue-tint);color:var(--blue)}
.mxw-deliverables{display:grid;gap:8px;margin:15px 0}
.mxw-deliverables div{display:grid;grid-template-columns:40px 1fr auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:11px;background:var(--soft);padding:11px 13px}
.mxw-deliverables div.generated{background:var(--green-tint);border-color:rgba(29,143,104,.28)}
.mxw-deliverables span{width:36px;height:32px;border-radius:8px;background:var(--blue-tint);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800}
.mxw-deliverables strong{font-size:13.5px;color:var(--ink)}
.mxw-deliverables em{font-style:normal;font-size:12px;color:var(--muted);font-weight:700}
.mxw-deliverables a{font-size:12px;color:var(--green);font-weight:800}
.mxw-approve-build{margin:15px 0}
.mxw-gate-button{margin-top:2px;background:var(--ink);color:#fff;border:0;border-radius:9px;padding:10px 16px;font-size:13px;font-weight:800;cursor:pointer}
.mxw-approved{display:flex;gap:10px;align-items:flex-start;border:1px solid rgba(29,143,104,.35);background:var(--green-tint);border-radius:11px;padding:13px 15px;color:var(--green);font-size:13px}
.mxw-approved span{color:var(--ink-2)}
.mxw-readiness{border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:var(--shadow);padding:18px 20px;margin-top:20px}
.mxw-readiness h2{font-family:Georgia,serif;font-size:19px;font-weight:700;letter-spacing:-.4px;margin:0}
.mxw-readiness>p{font-size:13px;color:var(--muted);margin:5px 0 15px;line-height:1.5;max-width:70ch}
.mxw-readiness-needs{display:grid;gap:10px}
.mxw-readiness-need{border:1px solid var(--line);border-radius:11px;background:var(--soft);padding:13px 15px}
.mxw-readiness-need.required{border-color:rgba(176,115,15,.3);background:var(--amber-tint)}
.mxw-readiness-need header{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mxw-readiness-need header strong{font-size:13.5px;color:var(--ink)}
.mxw-readiness-need header span{font-size:10.5px;letter-spacing:.4px;text-transform:uppercase;font-weight:700;color:var(--muted)}
.mxw-readiness-need.required header span{color:var(--amber)}
.mxw-readiness-need p{font-size:13px;color:var(--ink-2);line-height:1.5;margin:8px 0}
.mxw-rn-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--muted);margin-bottom:6px}
.mxw-readiness-need em{font-style:normal;font-size:12.5px;color:var(--blue);font-weight:600}
.mxw-readiness-sessions{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
.mxw-readiness-sessions h3{font-size:13px;font-weight:700;color:var(--ink);margin:0 0 10px}
.mxw-readiness-sessions>div{display:flex;flex-wrap:wrap;gap:8px}
.mxw-readiness-sessions span{padding:6px 11px;border:1px solid var(--line-2);border-radius:999px;font-size:12px;font-weight:600;color:var(--muted)}
.mxw-readiness-carries{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
.mxw-readiness-carries h3{font-size:13px;font-weight:700;color:var(--ink);margin:0 0 10px}
.mxw-readiness-carry{border:1px solid rgba(0,87,184,.18);border-radius:11px;background:var(--blue-tint);padding:12px 14px;margin-top:8px}
.mxw-readiness-carry strong{display:block;font-size:12.5px;color:var(--blue);margin-bottom:5px}
.mxw-readiness-carry p{font-size:13px;color:var(--ink-2);line-height:1.5;margin:0}
.mxw-p0-brief-review{border:1px solid rgba(29,143,104,.24);border-radius:14px;background:linear-gradient(180deg,var(--green-tint),var(--card) 58%);box-shadow:var(--shadow);padding:18px 20px;margin-top:20px}
.mxw-p0-brief-review header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:1px solid rgba(29,143,104,.18);padding-bottom:14px;margin-bottom:14px}
.mxw-p0-brief-review header span{display:block;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--green);font-weight:900;margin-bottom:5px}
.mxw-p0-brief-review header h2{font-family:Georgia,serif;font-size:20px;font-weight:700;letter-spacing:-.4px;margin:0;color:var(--ink)}
.mxw-p0-brief-review header p{font-size:13px;color:var(--ink-2);line-height:1.45;margin:6px 0 0;max-width:72ch}
.mxw-p0-brief-review header>strong{white-space:nowrap;border:1px solid rgba(29,143,104,.34);border-radius:999px;background:var(--card);color:var(--green);font-size:12px;font-weight:900;padding:7px 11px}
.mxw-p0-brief-name{display:grid;gap:3px;border:1px solid var(--line);border-radius:11px;background:var(--card);padding:12px 14px;margin-bottom:12px}
.mxw-p0-brief-name span{font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;color:var(--faint);font-weight:900}
.mxw-p0-brief-name strong{font-size:16px;color:var(--ink)}
.mxw-p0-brief-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mxw-p0-brief-grid article{display:grid;grid-template-columns:32px 1fr;gap:10px;border:1px solid var(--line);border-radius:11px;background:var(--card);padding:12px 13px}
.mxw-p0-brief-grid article.captured{border-color:rgba(29,143,104,.28)}
.mxw-p0-brief-grid article.missing{background:var(--soft)}
.mxw-p0-brief-grid article>span{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--green);color:#fff;font-size:10px;font-weight:900}
.mxw-p0-brief-grid article.missing>span{background:var(--faint)}
.mxw-p0-brief-grid strong{display:block;font-size:13px;color:var(--ink);margin-bottom:5px}
.mxw-p0-brief-grid p{font-size:12.5px;color:var(--ink-2);line-height:1.45;margin:0;white-space:pre-wrap}
.mxw-p0-handoff{border-color:rgba(0,87,184,.2);background:linear-gradient(180deg,var(--blue-tint),var(--card) 64%)}
.mxw-p0-handoff-kicker{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--blue);font-weight:900;margin-bottom:8px}
.mxw-p0-handoff-card{display:grid;gap:6px;border:1px solid var(--line);border-radius:12px;background:var(--card);padding:14px 16px;margin:16px 0}
.mxw-p0-handoff-card span{font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:var(--faint);font-weight:800}
.mxw-p0-handoff-card strong{font-size:17px;color:var(--ink)}
.mxw-p0-handoff-card em{font-style:normal;font-size:13px;line-height:1.5;color:var(--ink-2)}
.mxw-p0-handoff-actions{display:flex;gap:10px;flex-wrap:wrap}
.mxw-files-legend{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 22px}
.mxw-files-legend span{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:999px;background:var(--card);padding:7px 11px;font-size:12px;color:var(--ink-2);font-weight:700}
.mxw-files-legend i,.mxw-file-col header i{width:8px;height:8px;border-radius:50%}
.mxw-files-legend i.tpl,.mxw-file-col header i.tpl{background:var(--blue)}
.mxw-files-legend i.evi,.mxw-file-col header i.evi{background:var(--gold)}
.mxw-files-legend i.del,.mxw-file-col header i.del{background:var(--green)}
.mxw-files-legend em{font-style:normal;color:var(--muted)}
.mxw-file-phases{display:flex;flex-direction:column;gap:16px}
.mxw-file-phase{border:1px solid var(--line);border-radius:15px;background:var(--card);box-shadow:var(--shadow);overflow:hidden}
.mxw-file-phase>header{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--soft);border-bottom:1px solid var(--line)}
.mxw-file-phase>header>span{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--card);border:1px solid var(--line-2);font-size:10px;font-weight:800;color:var(--faint)}
.mxw-file-phase>header>span.done{background:var(--ink);color:#fff;border-color:var(--ink)}
.mxw-file-phase>header>span.current{background:var(--blue);color:#fff;border-color:var(--blue)}
.mxw-file-phase header strong{font-size:14px;color:var(--ink)}
.mxw-file-phase header em{margin-left:auto;font-style:normal;font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase}
.mxw-file-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line)}
.mxw-file-col{background:var(--card);min-width:0}
.mxw-file-col header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line);font-size:11px;color:var(--faint);font-weight:800;text-transform:uppercase}
.mxw-file-col header span{margin-left:auto}
.mxw-file-col>p{padding:16px 14px;font-size:12px;color:var(--faint)}
.mxw-file-row{display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;padding:11px 14px;border-bottom:1px solid var(--line)}
.mxw-file-row:last-child{border-bottom:0}
.mxw-file-row b{width:34px;height:30px;border-radius:8px;background:var(--blue-tint);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:8px}
.mxw-file-row span{min-width:0}
.mxw-file-row strong{display:block;font-size:12.8px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxw-file-row small{display:block;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxw-file-row em{font-style:normal;color:var(--muted);font-size:11px;font-weight:800;text-align:right}
.mxw-intel-panel{border:1px solid var(--line);border-radius:15px;background:var(--card);box-shadow:var(--shadow);padding:20px}
.mxw-intel-kicker{font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--blue);font-weight:900;margin-bottom:6px}
.mxw-intel-panel h2{font-family:Georgia,serif;font-size:22px;line-height:1.15;letter-spacing:-.45px;margin:0;color:var(--ink)}
.mxw-intel-panel>p{font-size:13px;color:var(--muted);line-height:1.5;max-width:74ch;margin:7px 0 18px}
.mxw-intel-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.mxw-intel-item{display:flex;flex-direction:column;gap:10px;min-height:260px;border:1px solid var(--line);border-radius:13px;background:var(--soft);padding:15px}
.mxw-intel-item.success{border-color:rgba(29,143,104,.28);background:linear-gradient(180deg,var(--green-tint),var(--card))}
.mxw-intel-item.warning{border-color:rgba(176,115,15,.28);background:linear-gradient(180deg,var(--amber-tint),var(--card))}
.mxw-intel-item.danger{border-color:rgba(180,35,24,.28);background:linear-gradient(180deg,#fff0ed,var(--card))}
.mxw-intel-item-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.mxw-intel-item-top span{font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--teal);font-weight:900}
.mxw-intel-item-top em{font-style:normal;font-size:10px;line-height:1.3;color:var(--faint);font-weight:800;text-align:right;max-width:130px}
.mxw-intel-item h3{font-size:15px;line-height:1.25;color:var(--ink);margin:0}
.mxw-intel-item p{font-size:13px;line-height:1.5;color:var(--ink-2);margin:0}
.mxw-intel-item ul{display:grid;gap:5px;margin:2px 0 0;padding-left:17px;color:var(--muted);font-size:12px;line-height:1.35}
.mxw-intel-link{margin-top:auto;align-self:flex-start;border:1px solid var(--line-2);border-radius:999px;background:var(--card);color:var(--blue);font-size:12px;font-weight:850;padding:6px 10px}
.mxw-intel-empty{display:grid;gap:6px;border:1px solid var(--line);border-radius:12px;background:var(--soft);padding:16px;color:var(--muted);font-size:13px}
.mxw-intel-empty strong{color:var(--ink)}
.mxw-ava-fab{position:fixed;right:24px;bottom:calc(24px + env(safe-area-inset-bottom));z-index:70;display:flex;align-items:center;gap:9px;background:var(--ink);color:#fff;border:0;border-radius:999px;padding:11px 16px 11px 12px;box-shadow:0 6px 20px rgba(20,20,19,.22);cursor:pointer}
.mxw-ava-pop{position:fixed;right:24px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:71;width:348px;max-width:calc(100vw - 48px);background:var(--card);border:1px solid var(--line-2);border-radius:16px;box-shadow:0 16px 44px rgba(20,20,19,.2);overflow:hidden;display:none}
.mxw-ava-pop.open{display:block}
.mxw[data-capture-v2="on"] .mxw-ava-fab,.mxw[data-capture-v2="on"] .mxw-ava-pop{display:none!important}
.mxw-ava-head{display:flex;align-items:center;gap:10px;padding:15px 17px;border-bottom:1px solid var(--line)}
.mxw-ava-head strong{display:block;font-size:14.5px}
.mxw-ava-head small{display:block;font-size:11px;color:var(--muted)}
.mxw-ava-head button{margin-left:auto;background:none;border:0;color:var(--faint);font-size:18px;cursor:pointer}
.mxw-ava-body{padding:15px 17px;max-height:320px;overflow-y:auto}
.mxw-ava-body p{font-size:12.5px;color:var(--ink-2);line-height:1.5;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:11px 13px;margin:0}
.mxw-suggested{font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:var(--faint);font-weight:600;margin:14px 0 8px}
.mxw-ava-assist{display:grid;gap:7px;border:1px solid rgba(0,87,184,.14);background:var(--blue-tint);border-radius:11px;padding:10px;margin:0 0 10px}
.mxw-ava-assist span{font-size:11.5px;color:var(--blue);font-weight:850}
.mxw-ava-body .mxw-ava-assist button{background:#fff;border-color:rgba(0,87,184,.18);color:var(--blue);font-weight:850;margin-bottom:0}
.mxw-ava-draft-list{display:grid;gap:7px;border:1px solid rgba(29,158,117,.18);background:#f0fbf7;border-radius:11px;padding:10px;margin:0 0 10px}
.mxw-ava-draft-list span{font-size:11.5px;color:#147c5b;font-weight:850}
.mxw-ava-body .mxw-ava-draft-list button{background:#fff;border-color:rgba(29,158,117,.2);color:#147c5b;font-weight:850;margin-bottom:0}
.mxw-ava-body button{display:block;width:100%;text-align:left;border:1px solid var(--line);background:var(--card);border-radius:9px;padding:9px 12px;font-size:12.5px;color:var(--ink-2);cursor:pointer;margin-bottom:6px}
.mxw-ava-body button:disabled{opacity:.5;cursor:default}
.mxw-ava-thread{display:flex;flex-direction:column;gap:10px}
.mxw-ava-turn-who{display:block;font-size:10px;letter-spacing:.4px;text-transform:uppercase;color:var(--faint);font-weight:600;margin-bottom:3px}
.mxw-ava-turn p{font-size:12.5px;color:var(--ink-2);line-height:1.5;white-space:pre-wrap;margin:0;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:9px 12px}
.mxw-ava-turn-user p{background:var(--card);border-color:var(--line-2)}
.mxw-ava-turn-text{font-size:12.5px;color:var(--ink-2);line-height:1.5;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:9px 12px;white-space:normal}
.mxw-ava-turn-text p{background:transparent!important;border:0!important;border-radius:0!important;padding:0!important;margin:0 0 7px!important;white-space:normal!important}
.mxw-ava-turn-text p:last-child{margin-bottom:0!important}
.mxw-ava-rich-answer{margin-top:8px;max-width:100%;overflow-x:auto}
.mxw-ava-rich-answer .agentAnswer{min-width:300px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px}
.mxw-ava-rich-answer .aaSection{margin-top:8px}
.mxw-ava-rich-answer .aaTitle{font-size:10px}
.mxw-ava-rich-answer .aaChart,.mxw-ava-rich-answer .aaTableWrap{min-width:300px}
.mxw-ava-composer{display:flex;gap:8px;padding:12px 17px;border-top:1px solid var(--line);align-items:flex-end}
.mxw-ava-composer textarea{flex:1;resize:none;border:1px solid var(--line);border-radius:9px;padding:8px 10px;font:inherit;font-size:12.5px;color:var(--ink);background:#fff}
.mxw-ava-composer button{flex:none;border:0;background:var(--ink);color:#fff;border-radius:9px;padding:8px 14px;font-size:12.5px;font-weight:600;cursor:pointer}
.mxw-ava-composer button:disabled{opacity:.5;cursor:default}
@media (max-width:1280px){
  .mxw .mxw-ava-fab{width:52px;height:52px;padding:12px;gap:0;font-size:0;line-height:0;color:transparent;justify-content:center}
}
/*
 * Desktop: aVa is a persistent panel docked to the left edge (mirrors the
 * Source new-event workflow, where aVa is always on the left), instead of a
 * click-to-open floating bubble. The surface shifts right to clear it. Below
 * 1281px it reverts to the floating FAB + popover above.
 */
@media (min-width:1281px){
  .mxw .mxw-ava-fab{display:none}
  .mxw .mxw-ava-pop,
  .mxw .mxw-ava-pop.open{position:fixed;left:0;right:auto;top:44px;bottom:0;width:312px;max-width:312px;height:auto;display:flex;flex-direction:column;border:0;border-right:1px solid var(--line-2);border-radius:0;box-shadow:none;overflow:hidden;z-index:45}
  .mxw .mxw-ava-pop .mxw-ava-head button{display:none}
  .mxw .mxw-ava-body{max-height:none;flex:1 1 auto;min-height:0}
  .mxw .mxw-surface{margin-left:312px}
}
@media (max-width:980px){.mxw-lanes,.mxw-value-grid,.mxw-exec-readout,.mxw-decision-surface,.mxw-decision-detail-grid,.mxw-gate-why-panel,.mxw-intel-grid{grid-template-columns:1fr}.mxw-decision-details summary{grid-template-columns:1fr}.mxw-gate-why-proof{justify-content:flex-start;max-width:none}}
@media (max-width:900px){
  .mxw-mobile-rail{position:sticky;top:44px;z-index:55;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(12,26,58,.10);background:#fff;padding:10px 14px;box-shadow:0 6px 14px rgba(12,26,58,.06)}
  .mxw-surface-tabs{display:none}
  .mxw-shell{width:100%;max-width:none}
  .mxw-shell{padding:30px 18px max(128px,calc(96px + env(safe-area-inset-bottom)))}
  .mxw-guide-head{align-items:flex-start;flex-direction:column}
  .mxw-guide-head em{margin-left:0}
  .mxw-guide-table{grid-template-columns:1fr}
  .mxw-guide-table div{border-right:0;border-bottom:1px solid var(--line)}
  .mxw-guide-table div:last-child{border-bottom:0}
  .mxw-howflow{grid-template-columns:1fr}
  .mxw-how-step{min-height:auto}
  .mxw-how-step:not(:last-child)::after{content:"↓";right:auto;left:20px;top:auto;bottom:-17px;transform:none;background:var(--card);width:16px}
}
@media (max-width:720px){
  .mxw-mobile-rail{align-items:stretch;flex-direction:column}
  .mxw-mobile-rail label,.mxw-mobile-rail select{width:100%;max-width:none}
  .mxw-howflow,.mxw-ts-grid,.mxw-file-cols,.mxw-kdd-fields,.mxw-kdd-options{grid-template-columns:1fr}
  .mxw-kdd summary{grid-template-columns:1fr}
  .mxw-option-summary{grid-template-columns:1fr}
  .mxw-options dl{grid-template-columns:1fr}
  .mxw-p0-brief-grid{grid-template-columns:1fr}
  .mxw-p0-brief-review header{flex-direction:column}
  .mxw-action-panel{grid-template-columns:1fr;align-items:flex-start}
  .mxw-upload,.mxw-inline-upload{align-items:flex-start;flex-direction:column}
  .mxw-upload-control{justify-content:flex-start;width:100%}
  .mxw-options button{grid-template-columns:28px 1fr}
  .mxw-options em{grid-column:2}
  .mxw-options small{grid-column:2}
  .mxw-options dl,.mxw-option-meta,.mxw-option-blocks,.mxw-option-caution{grid-column:2}
}
/*
 * Finder-shell visual polish. Tokens match the merged
 * MovePhaseExplorer.module.css palette (navy/blue/teal/amber).
 */
.mxw-finder-on .mxw-surface-tabs button.active::before{content:"";position:absolute;left:12px;right:12px;bottom:-1px;height:2px;border-radius:999px;background:#2a5aa8}
/*
 * Steps selector. Same token set as the finder-shell polish rules above
 * (navy/blue/teal/amber); no new colors introduced.
 */
.mxw-compact-steps{display:none;gap:6px;padding:12px 16px;border-bottom:1px solid rgba(12,26,58,.10);background:#fbfbfc}
.mxw-compact-steps span{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#5b6c8a;font-weight:800}
.mxw-compact-steps select{width:100%;min-width:0;border:1px solid rgba(12,26,58,.16);border-radius:8px;background:#fff;color:#0c1a3a;font:inherit;font-size:13px;font-weight:700;padding:9px 10px}
@media (max-width:600px){
  .mxw .mxw-compact-steps{display:grid}
  .mxw .mxw-contract-nav,.mxw .mxw-finder-steps-menu{display:none}
}
.mxw-finder-steps{display:block}
.mxw-finder-steps-menu{display:grid;gap:10px;width:100%;padding:10px 2px 14px;margin-bottom:18px;border-bottom:1px solid rgba(12,26,58,.10)}
.mxw-finder-step-group{display:flex;align-items:flex-start;gap:8px;min-width:0}
.mxw-finder-step-group h3{margin:0 4px 0 0;white-space:nowrap;font-size:11px;letter-spacing:.7px;text-transform:uppercase;color:#5b6c8a;font-weight:800}
.mxw-finder-step-group ul{list-style:none;margin:0;padding:0;display:flex;align-items:center;flex-wrap:wrap;gap:4px;min-width:0}
.mxw-finder-step-row{width:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap;text-align:left;background:none;border:none;border-radius:8px;padding:7px 9px;cursor:pointer;font-size:13px;color:#28364f;white-space:nowrap}
.mxw-finder-step-row:hover{background:#f1f3f8}
.mxw-finder-step-row.selected{background:#e4ecf9;color:#0c1a3a}
.mxw-finder-step-dot{width:7px;height:7px;border-radius:999px;background:#8b95a8;flex:0 0 auto}
.mxw-finder-step-row.captured .mxw-finder-step-dot{background:#2a5aa8}
.mxw-finder-step-row.visited .mxw-finder-step-dot{background:#8b95a8}
.mxw-finder-step-row.blocked .mxw-finder-step-dot{background:#ba7517}
.mxw-finder-step-title{flex:1;font-weight:600;color:#0c1a3a}
.mxw-finder-step-subtitle{width:100%;padding-left:15px;font-size:11px;color:#8a5a12}
.mxw-finder-step-state{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#2a5aa8;background:#e4ecf9;border:1px solid rgba(42,90,168,.16);border-radius:999px;padding:2px 7px}
.mxw-finder-step-row.visited .mxw-finder-step-state{color:#5b6c8a;background:#f1f3f8;border-color:rgba(12,26,58,.1)}
.mxw-finder-step-now{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.4px;color:#2a5aa8;background:#e4ecf9;border-radius:999px;padding:2px 7px}
.mxw-finder-comingup{border:1px solid rgba(12,26,58,.10);border-radius:10px;background:#fbfbfc;padding:12px;margin:0 0 18px}
.mxw-finder-comingup-toggle{width:100%;text-align:left;background:none;border:none;padding:0;font-size:12px;font-weight:700;color:#0c1a3a;cursor:pointer}
.mxw-finder-comingup-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.mxw-finder-chip{font-size:11px;border-radius:999px;padding:4px 10px;background:#e4ecf9;color:#2a5aa8}
.mxw-finder-chip.req{background:#fbf1df;color:#ba7517}
.mxw-finder-comingup-empty{margin-top:10px;font-size:12px;color:#5b6c8a}
.mxw-finder-detail{flex:1;min-width:0;scroll-margin-top:96px}
.mxw-finder-detail-panel header h2{margin:0 0 4px;font-family:Fraunces,Georgia,serif;color:#0c1a3a}
.mxw-finder-detail-panel header p{margin:0 0 14px;color:#5b6c8a;font-size:13px}
.mxw-finder-detail-input{width:100%;border:1px solid rgba(12,26,58,.16);border-radius:10px;padding:12px;font-size:13.5px;color:#28364f;font-family:inherit}
.mxw-facts-editor{display:block;width:100%}
.mxw-facts-editor-table{width:100%;border-collapse:collapse;table-layout:fixed}
.mxw-facts-editor-table th{text-align:left;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#5b6c8a;padding:4px 6px 6px;border-bottom:1px solid rgba(12,26,58,.14);font-weight:800}
.mxw-facts-editor-table th:last-child{width:34px}
.mxw-facts-editor-table td{padding:5px 6px;vertical-align:top}
.mxw-facts-editor-table textarea{width:100%;min-width:0;box-sizing:border-box;border:1px solid rgba(12,26,58,.16);border-radius:6px;background:#fff;color:#0c1a3a;font:inherit;font-size:13px;line-height:1.35;padding:8px 9px;field-sizing:content;min-height:36px;max-height:calc(6 * 1.35em + 16px);resize:vertical;overflow-y:auto;overflow-x:hidden}
.mxw-facts-editor-table textarea:focus{outline:2px solid rgba(42,90,168,.18);border-color:rgba(42,90,168,.45)}
@container (max-width:559px){.mcf-v2 .mxw-facts-editor-table,.mcf-v2 .mxw-facts-editor-table tbody,.mcf-v2 .mxw-facts-editor-table tr,.mcf-v2 .mxw-facts-editor-table td{display:block;width:100%;box-sizing:border-box}.mcf-v2 .mxw-facts-editor-table thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.mcf-v2 .mxw-facts-editor-table tr{padding:10px 0;border-bottom:1px solid rgba(12,26,58,.14)}.mcf-v2 .mxw-facts-editor-table td{padding:4px 0}.mcf-v2 .mxw-facts-editor-table td::before{content:attr(data-label);display:block;font-size:11px;font-weight:800;color:#5b6c8a;margin:0 0 4px}.mcf-v2 .mxw-facts-editor-table textarea{width:100%}}
.mxw-facts-editor-remove{width:28px;height:32px;border:1px solid rgba(12,26,58,.16);border-radius:6px;background:#fff;color:#5b6c8a;font-size:15px;line-height:1;cursor:pointer}
.mxw-facts-editor-remove:hover:not(:disabled){background:#f1f3f8;color:#0c1a3a}
.mxw-facts-editor-remove:disabled{opacity:.4;cursor:default}
.mxw-route-choice{display:block;width:100%;margin:0 0 12px;padding:10px 12px 12px;border:1px solid rgba(12,26,58,.14);border-radius:10px;background:#f8fafd;min-width:0}
.mxw-route-choice-legend{padding:0 4px;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#5b6c8a;font-weight:800}
.mxw-route-choice-note{margin:2px 0 8px;font-size:12px;line-height:1.45;color:#5b6c8a}
.mxw-route-choice-empty{margin:2px 0 0;font-size:12px;line-height:1.45;color:#8a3b3b}
.mxw-route-choice-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.mxw-route-choice-option{display:flex;gap:9px;align-items:flex-start;padding:9px 10px;border:1px solid rgba(12,26,58,.16);border-radius:8px;background:#fff;cursor:pointer}
.mxw-route-choice-option:hover{border-color:rgba(42,90,168,.45)}
.mxw-route-choice-option.is-chosen{border-color:rgba(42,90,168,.65);box-shadow:inset 0 0 0 1px rgba(42,90,168,.35);background:#f3f7fe}
.mxw-route-choice-option input{margin:3px 0 0;flex:0 0 auto}
.mxw-route-choice-body{display:grid;gap:3px;min-width:0}
.mxw-route-choice-head{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline}
.mxw-route-choice-head b{font-size:13px;line-height:1.35;color:#0c1a3a;font-weight:800}
.mxw-route-choice-rec{font-size:11px;font-style:normal;font-weight:800;color:#1f6b45;background:rgba(31,107,69,.1);border-radius:999px;padding:1px 7px}
.mxw-route-choice-body small{font-size:12px;line-height:1.45;color:#44557a}
.mxw-route-choice-meta{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:1px}
.mxw-route-choice-meta i{font-style:normal;font-size:11px;color:#5b6c8a;font-weight:700}
.mxw-facts-editor-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.mxw-facts-editor-actions{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-top:8px}
.mxw-facts-editor-add{border:1px dashed rgba(12,26,58,.28);border-radius:8px;background:#fff;color:#2a5aa8;font:inherit;font-size:12px;font-weight:700;padding:7px 11px;cursor:pointer}
.mxw-facts-editor-add:hover{background:#f1f3f8}
.mxw-facts-editor-note{margin:0;flex:1;min-width:180px;font-size:11.5px;line-height:1.45;color:#5b6c8a}
.mxw-finder-facts-table{width:100%;border-collapse:collapse}
.mxw-finder-facts-table th{text-align:left;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#5b6c8a;padding:6px 10px;border-bottom:1px solid rgba(12,26,58,.14)}
.mxw-finder-facts-table td{padding:8px 10px;border-bottom:1px solid rgba(12,26,58,.08);font-size:13px;color:#28364f;vertical-align:top}
.mxw-finder-fact-value{margin-right:6px}
.mxw-finder-citation-toggle{border:none;background:#e4ecf9;color:#2a5aa8;border-radius:999px;width:20px;height:20px;line-height:20px;font-size:11px;cursor:pointer;padding:0}
.mxw-finder-citation-caption{display:block;margin-top:4px;font-size:11.5px;color:#5b6c8a}
.mxw-contract-card{display:block;min-height:458px;border:1px solid rgba(12,26,58,.12);border-radius:14px;background:#fff;overflow:visible;box-shadow:0 12px 32px rgba(12,26,58,.05)}
.mxw-contract-nav{border-bottom:1px solid rgba(12,26,58,.09);border-radius:14px 14px 0 0;background:#fbfbfc;padding:12px 16px;display:grid;gap:8px}
.mxw-contract-group{display:flex;align-items:center;flex-wrap:wrap;gap:5px;min-width:0}
.mxw-contract-group-label{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7b8798;padding:0 7px;white-space:nowrap}
.mxw-contract-step{appearance:none;border:1px solid transparent;border-radius:8px;background:transparent;color:#7b8aa5;cursor:pointer;display:flex;align-items:center;gap:8px;min-height:36px;padding:7px 9px;text-align:left;width:auto;white-space:nowrap;flex:none}
.mxw-contract-step:hover{background:rgba(42,90,168,.06)}
.mxw-contract-step.active{border-color:rgba(42,90,168,.14);background:#fff;color:#0c1a3a;box-shadow:inset 0 -3px 0 #2a5aa8}
.mxw-contract-step>span{width:18px;height:18px;border-radius:999px;border:1px solid rgba(12,26,58,.18);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}
.mxw-contract-step>span.done{border-color:#1d9e75;background:#1d9e75}
.mxw-contract-step.visited{color:#8b95a8}
.mxw-contract-step>span.visited{border-color:#d8dde5;background:#f1f3f6;color:#8b95a8}
.mxw-contract-step strong{min-width:0;font-size:13px;font-weight:700;line-height:1.2;color:inherit}
.mxw-contract-step small{color:#8b95a8;font-size:10px;font-weight:650}
.mxw-contract-comingup{border:1px solid rgba(12,26,58,.12);border-radius:10px;background:#fbfbfc;padding:12px;margin:0 0 18px}
.mxw-contract-comingup button{appearance:none;border:1px solid rgba(42,90,168,.14);border-radius:8px;background:#fff;color:#0c1a3a;cursor:pointer;font-size:12px;font-weight:850;line-height:1.35;padding:8px 10px;text-align:left;width:100%;box-shadow:0 1px 2px rgba(12,26,58,.04)}
.mxw-contract-comingup div{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.mxw-contract-comingup span{border:1px solid rgba(42,90,168,.14);border-radius:999px;background:#e4ecf9;color:#2a5aa8;font-size:10.5px;font-weight:800;line-height:1.2;padding:5px 8px}
.mxw-contract-comingup span.req{border-color:rgba(186,117,23,.18);background:#fbf1df;color:#8a5a12}
.mxw-contract-comingup p{color:#8b95a8;font-size:11.5px;line-height:1.35;margin:10px 0 0}
.mxw-contract-advance{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(12,26,58,.10)}
.mxw-contract-continue{appearance:none;border:0;border-radius:9px;background:var(--green);color:#fff;font-size:13px;font-weight:800;padding:10px 18px;cursor:pointer}
.mxw-contract-continue:hover:not(:disabled){background:#176f51}
.mxw-contract-continue:disabled{background:rgba(12,26,58,.12);color:#8b95a8;cursor:not-allowed}
.mxw-contract-advance-hint{font-size:12px;color:#8a5a12}
.mxw-contract-advance-next{font-size:12px;color:#5b6c8a}
.mxw-contract-detail{padding:28px 30px 24px;min-width:0;scroll-margin-top:96px}
.mxw-contract-detail-top{position:sticky;top:72px;z-index:24;display:grid;grid-template-columns:22px auto minmax(0,1fr) auto minmax(0,max-content);align-items:center;gap:10px;margin:-10px -12px 18px;padding:10px 12px;background:rgba(255,255,255,.97);border-bottom:1px solid rgba(12,26,58,.10);box-shadow:0 5px 14px rgba(12,26,58,.06);backdrop-filter:blur(8px)}
.mxw-contract-detail-top>span{width:18px;height:18px;border-radius:999px;border:1px solid rgba(12,26,58,.18);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}
.mxw-contract-detail-top>span.done{border-color:#1d9e75;background:#1d9e75}
.mxw-contract-detail-top small{color:#8b95a8;font-size:12px;font-weight:700;white-space:nowrap}
.mxw-contract-detail-top h2{margin:0;color:#0c1a3a;font-size:16px;font-weight:800;line-height:1.2;min-width:0}
.mxw-contract-detail-top b{border-radius:8px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;font-style:normal;font-weight:800;letter-spacing:.12em;padding:4px 7px;text-transform:uppercase}
.mxw-contract-detail-top b{background:rgba(12,26,58,.06);color:#8b95a8}
.mxw-contract-detail-top>span.done~b{background:rgba(29,158,117,.13);color:#147c5b}
.mxw-step-progress-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0}
.mxw-step-progress-status{border:1px solid #d8dde5;border-radius:8px;background:#f1f3f6;color:#667085;padding:6px 9px;font-size:10px;font-weight:800;white-space:nowrap}
button.mxw-step-progress-status{cursor:pointer}
.mxw-step-progress-status.ready,.mxw-step-progress-status.complete{border-color:rgba(20,124,91,.18);background:#e8f5ef;color:#147c5b}
.mxw-step-progress-status.open{border-color:#d8dde5;background:#f1f3f6;color:#667085}
.mxw-phase-progress-button,.mxw-step-gate-button{border:0!important;border-radius:8px!important;background:#147c5b!important;color:#fff!important;box-shadow:0 2px 8px rgba(20,124,91,.20);font-size:12.5px!important;font-weight:850!important;line-height:1.2!important;min-height:38px;cursor:pointer}
.mxw-phase-progress-button:hover,.mxw-step-gate-button:hover{background:#0f684c!important}
.mxw-phase-progress-button:disabled,.mxw-step-gate-button:disabled{background:#d8dde5!important;color:#667085!important;box-shadow:none;cursor:not-allowed}
.mxw-phase-progress-button:focus-visible,.mxw-step-gate-button:focus-visible{outline:3px solid rgba(42,90,168,.35);outline-offset:2px}
.mxw-contract-form{display:grid;gap:13px}
.mxw-contract-form p{margin:0;color:#4d5d79;font-size:14px;line-height:1.5}
.mxw-capture-evidence{display:grid;gap:10px;border:1px solid var(--line-2);border-left:3px solid var(--green);border-radius:8px;background:var(--soft);padding:12px 14px}
.mxw-capture-evidence header{display:flex;align-items:center;justify-content:space-between;gap:12px}
.mxw-capture-evidence header span{color:var(--muted);font-size:10px;font-weight:800;text-transform:uppercase}
.mxw-capture-evidence h3{margin:2px 0 0;color:var(--ink);font-size:14px}
.mxw-capture-evidence header strong{color:var(--ink-2);font-size:12px}
.mxw-capture-evidence p{margin:0;color:var(--ink-2);font-size:12.5px;line-height:1.45}
.mxw-capture-evidence ul{display:grid;gap:4px;margin:0;padding-left:18px;color:var(--ink);font-size:12.5px}
.mxw-capture-evidence .mxw-upload-stack{justify-items:start;min-width:0}
.mxw-capture-evidence-refresh{justify-self:start;border:0;background:transparent;color:var(--ink-2);font-size:12px;font-weight:700;text-decoration:underline;cursor:pointer}
.mxw-reference-draft{display:grid;gap:8px;border:1px solid #d8e0e8;border-left:3px solid #587a9f;border-radius:8px;background:#f7f9fb;padding:12px}
.mxw-reference-draft-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.mxw-reference-draft-head strong{color:#263b52;font-size:12px}
.mxw-reference-draft-head span{color:#5d6e80;font-size:11px;font-weight:700}
.mxw-reference-draft p{white-space:pre-wrap}
.mxw-reference-draft small{color:#59697a;font-size:11px;line-height:1.45}
.mxw-ava-draft-card{display:grid;gap:10px;border:1px solid rgba(29,158,117,.22);border-radius:11px;background:#f8fffc;padding:12px}
.mxw-ava-draft-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mxw-ava-draft-card-head span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#147c5b;font-weight:900}
.mxw-ava-draft-card-head b{border-radius:999px;background:#e1f5ec;color:#147c5b;font-size:11px;padding:4px 8px}
.mxw-ava-draft-card dl{display:grid;gap:8px;margin:0}
.mxw-ava-draft-card dt{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#708099;font-weight:850}
.mxw-ava-draft-card dd{margin:2px 0 0;color:#23324c;font-size:12.5px;line-height:1.4}
.mxw-ava-draft-card blockquote{margin:0;border-left:3px solid #1d9e75;padding:8px 10px;background:#fff;color:#0c1a3a;font-size:13px;line-height:1.45;white-space:pre-wrap}
.mxw-ava-draft-card ul{margin:0;padding-left:18px;color:#5b6c8a;font-size:12px;line-height:1.4}
.mxw-ava-draft-actions,.mxw-ava-local-draft{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.mxw-ava-draft-actions button,.mxw-ava-local-draft button{border:1px solid rgba(12,26,58,.16);border-radius:9px;background:#fff;color:#0c1a3a;font-size:12.5px;font-weight:800;padding:8px 10px;cursor:pointer}
.mxw-ava-draft-actions button:first-child,.mxw-ava-local-draft button:first-child{background:#0c1a3a;border-color:#0c1a3a;color:#fff}
.mxw-ava-local-draft{border:1px solid rgba(186,117,23,.22);border-radius:10px;background:#fffbf2;padding:10px}
.mxw-ava-local-draft span{color:#7a560d;font-size:12.5px;font-weight:750}
.mxw-ava-local-draft div{display:flex;gap:8px;flex-wrap:wrap}
.mxw-contract-input{width:100%;resize:vertical;border:1px solid rgba(12,26,58,.16);border-radius:10px;background:#fff;color:#0c1a3a;font:inherit;font-size:13.5px;line-height:1.45;padding:12px}
.mxw-contract-input:focus{outline:2px solid rgba(42,90,168,.18);border-color:rgba(42,90,168,.45)}
.mxw-contract-legacy-body>.mxw-zone:first-child,.mxw-contract-legacy-body>.mxw-review:first-child,.mxw-contract-legacy-body>.mxw-action-panel:first-child{margin-top:0}
.mxw-contract-legacy-body .mxw-capture.compact{display:none}
@media (max-width:960px){
  .mxw-contract-detail-top{top:60px;grid-template-columns:22px auto minmax(0,1fr)}
  .mxw-contract-detail-top b{grid-column:2;justify-self:start}
  .mxw-step-progress-actions{grid-column:1/-1;justify-content:flex-start;flex-wrap:wrap}
}
@media (max-width:900px){.mxw-contract-detail-top{top:100px}}
@media (max-width:600px){
  .mxw-stage-head{grid-template-columns:minmax(0,1fr);gap:10px}
  .mxw-stage-head .mxw-agent-chip,.mxw-stage-head h1,.mxw-stage-head p{grid-column:1}
  .mxw-stage-head .mxw-progress-card{grid-column:1;grid-row:auto;justify-self:stretch;width:100%}
  .mxw-contract-detail-top{top:144px;grid-template-columns:22px minmax(0,1fr)}
  .mxw-contract-detail-top h2,.mxw-contract-detail-top b{grid-column:1/-1;justify-self:start}
}
/*
 * Approvals overview. Rendered only when workspaceView === "approvals".
 * Tokens match the Finder-shell palette above (navy labels, blue accents,
 * teal approved, amber not-ready).
 */
.mxw-approvals-overview{border:1px solid rgba(12,26,58,.14);border-radius:12px;background:#fff;overflow:hidden}
.mxw-approvals-row{display:grid;grid-template-columns:1.1fr 1.1fr 1.6fr .9fr 1.3fr;gap:12px;align-items:center;padding:13px 16px;border-bottom:1px solid rgba(12,26,58,.10)}
.mxw-approvals-row:last-child{border-bottom:0}
.mxw-approvals-row--head{background:#faf9f7;font-size:10.5px;letter-spacing:.7px;text-transform:uppercase;color:#5b6c8a;font-weight:800}
.mxw-approvals-phase{font-size:13.5px;font-weight:700;color:#0c1a3a}
.mxw-approvals-tally{font-size:13px;color:#28364f}
.mxw-approvals-status{justify-self:start;border-radius:999px;padding:4px 10px;font-size:11.5px;font-weight:800}
.mxw-approvals-status.passed{background:#e1f5ec;color:#1f7a55}
.mxw-approvals-status.ready{background:#e4ecf9;color:#2a5aa8}
.mxw-approvals-status.pending{background:#fbf1df;color:#ba7517}
.mxw-approvals-status.upcoming{background:rgba(12,26,58,.06);color:#5b6c8a}
.mxw-approvals-approver{font-size:13px;color:#5b6c8a}
.mxw-approvals-approver.unassigned{font-style:italic;color:#7b8798}
.mxw-approvals-action{justify-self:end}
.mxw-approvals-action button,.mxw-approvals-action a{border:0;background:none;color:#2a5aa8;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none}
.mxw-approvals-action button:hover,.mxw-approvals-action a:hover{text-decoration:underline}
.mxw-approvals-noaction{font-size:12.5px;color:#9aa4b5;font-weight:600}
.mxw-structured-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.mxw-structured-form>label{display:grid;align-content:start;gap:5px;color:#5b6c8a;font-size:11px;font-weight:800}
.mxw-structured-form input,.mxw-structured-form select,.mxw-structured-form textarea{width:100%;min-width:0;border:1px solid rgba(12,26,58,.16);border-radius:8px;background:#fff;color:#0c1a3a;font:inherit;font-size:13px;font-weight:500;line-height:1.4;padding:9px 10px}
.mxw-structured-form input:focus,.mxw-structured-form select:focus,.mxw-structured-form textarea:focus{outline:2px solid rgba(42,90,168,.18);border-color:rgba(42,90,168,.45)}
.mxw-structured-context,.mxw-structured-recommendation,.mxw-structured-note{grid-column:1/-1;margin:0}
.mxw-structured-context{display:grid;gap:4px;border-left:3px solid #2a5aa8;border-radius:5px;background:#f3f6fc;padding:9px 11px;color:#28364f;font-size:12px;line-height:1.45}
.mxw-structured-context strong,.mxw-structured-recommendation span{color:#5b6c8a;font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
.mxw-structured-recommendation{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border:1px solid rgba(29,158,117,.18);border-radius:8px;background:#f7fcf9;padding:10px 12px}
.mxw-structured-recommendation strong{color:#147c5b;font-size:13px}
.mxw-structured-note{color:#6c7890;font-size:11.5px;line-height:1.45}
.mxw-estimate-model{display:grid;gap:12px;min-width:0}
.mxw-estimate-toolbar{display:flex;align-items:end;justify-content:space-between;gap:10px;flex-wrap:wrap}
.mxw-estimate-field{display:grid;align-content:start;gap:5px;min-width:0;color:#5b6c8a;font-size:11px;font-weight:800}
.mxw-estimate-field input,.mxw-estimate-field select{width:100%;min-width:0;border:1px solid rgba(12,26,58,.16);border-radius:6px;background:#fff;color:#0c1a3a;font:inherit;font-size:13px;font-weight:500;line-height:1.35;padding:8px 9px}
.mxw-estimate-field input:focus,.mxw-estimate-field select:focus{outline:2px solid rgba(42,90,168,.18);border-color:rgba(42,90,168,.45)}
.mxw-estimate-currency{width:142px}
.mxw-estimate-add,.mxw-estimate-legacy button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;border:1px solid rgba(42,90,168,.18);border-radius:6px;background:#fff;color:#2a5aa8;font-size:12px;font-weight:800;padding:7px 10px;cursor:pointer}
.mxw-estimate-add:hover,.mxw-estimate-legacy button:hover{background:#f3f6fc}
.mxw-estimate-pair{display:grid;gap:10px;border:1px solid rgba(12,26,58,.13);border-radius:8px;background:#fff;padding:12px}
.mxw-estimate-pair-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 34px;align-items:end;gap:9px}
.mxw-estimate-remove{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid rgba(12,26,58,.14);border-radius:6px;background:#fff;color:#5b6c8a;cursor:pointer}
.mxw-estimate-remove:hover{border-color:#a73535;color:#a73535}
.mxw-estimate-scenarios{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;min-width:0}
.mxw-estimate-scenario{display:grid;gap:9px;min-width:0;margin:0;border:1px solid rgba(12,26,58,.12);border-radius:6px;padding:10px}
.mxw-estimate-scenario legend{padding:0 5px;color:#0c1a3a;font-size:12px;font-weight:850}
.mxw-estimate-scenario:first-child{background:#f7f9fc}
.mxw-estimate-scenario:last-child{background:#fbfaf7}
.mxw-estimate-numbers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.mxw-estimate-inputs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.mxw-estimate-wide{grid-column:1/-1}
.mxw-estimate-empty,.mxw-estimate-legacy,.mxw-estimate-notes,.mxw-estimate-errors,.mxw-estimate-ready{margin:0;border:1px solid rgba(12,26,58,.12);border-radius:6px;padding:10px 12px;color:#5b6c8a;font-size:12px;line-height:1.45}
.mxw-estimate-empty{background:#f7f9fc}
.mxw-estimate-legacy{display:grid;gap:9px;background:#fbfaf7}
.mxw-estimate-legacy p,.mxw-estimate-notes p{margin:0}
.mxw-estimate-legacy pre{max-height:200px;overflow:auto;margin:0;white-space:pre-wrap;overflow-wrap:anywhere;color:#28364f;font:12px/1.45 ui-monospace,SFMono-Regular,monospace}
.mxw-estimate-notes summary{cursor:pointer;color:#28364f;font-size:12px;font-weight:800}
.mxw-estimate-notes p{margin-top:8px;white-space:pre-wrap}
.mxw-estimate-totals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;border:1px solid rgba(29,158,117,.18);border-left:3px solid #1d9e75;border-radius:6px;background:#f7fcf9;padding:11px}
.mxw-estimate-totals h3,.mxw-estimate-totals p{grid-column:1/-1;margin:0}
.mxw-estimate-totals h3{color:#0c1a3a;font-size:13px}
.mxw-estimate-totals>div{display:grid;gap:3px;border:1px solid rgba(12,26,58,.10);border-radius:6px;background:#fff;padding:8px}
.mxw-estimate-totals strong{color:#0c1a3a;font-size:12px}
.mxw-estimate-totals span{color:#147c5b;font-size:13px;font-weight:850;overflow-wrap:anywhere}
.mxw-estimate-totals small,.mxw-estimate-totals p{color:#5b6c8a;font-size:10.5px;line-height:1.4}
.mxw-estimate-review{display:grid;grid-template-columns:minmax(180px,.75fr) minmax(0,1.25fr);align-items:end;gap:10px}
.mxw-estimate-attestation{display:flex;align-items:flex-start;gap:8px;color:#28364f;font-size:12px;line-height:1.4}
.mxw-estimate-attestation input{flex:0 0 auto;margin:2px 0 0;accent-color:#147c5b}
.mxw-estimate-errors{border-color:rgba(186,117,23,.28);background:#fffbf2;color:#7a560d}
.mxw-estimate-errors ul{display:grid;gap:3px;margin:6px 0 0;padding-left:18px}
.mxw-estimate-ready{border-color:rgba(29,158,117,.2);background:#f0fbf7;color:#147c5b;font-weight:750}
@media (max-width:960px){.mxw-estimate-scenarios{grid-template-columns:1fr}}
@media (max-width:720px){.mxw-estimate-pair-head,.mxw-estimate-review{grid-template-columns:1fr}.mxw-estimate-remove{justify-self:start}.mxw-estimate-numbers{grid-template-columns:repeat(2,minmax(0,1fr))}.mxw-estimate-inputs,.mxw-estimate-totals{grid-template-columns:1fr}}
@media (max-width:720px){.mxw-structured-form{grid-template-columns:1fr}}
      `}</style>
  );
}
