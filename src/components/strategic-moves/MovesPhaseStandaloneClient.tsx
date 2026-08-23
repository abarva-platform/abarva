"use client";

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
import {
  reconcileDraftWithAcknowledged,
  resolvePhaseCaptureStatus,
  type PhaseCaptureSaveStatus,
  type PhaseCaptureStatusView,
} from "@/lib/programs/phase-capture-status";
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
import {
  artifactStatusLabel,
  FileCabinetPanel,
} from "@/components/strategic-moves/FileCabinetPanel";
import { PhaseApproveAndBuild } from "@/components/strategic-moves/PhaseApproveAndBuild";
import { PhaseRoleApprovalsSummary } from "@/components/strategic-moves/PhaseRoleApprovalsSummary";
import { GateApprovalConfirmDialog } from "@/components/strategic-moves/GateApprovalConfirmDialog";
import { PhaseIntelligencePanel } from "@/components/strategic-moves/PhaseIntelligencePanel";
import { CostEffortWizard } from "@/components/strategic-moves/cost-effort";
import { RiskAssessmentPanel } from "@/components/strategic-moves/risk-assessment";
import { SolutioningPanel } from "@/components/strategic-moves/solutioning";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { PhaseNavigationStatus } from "@/lib/programs/phase-navigation-status";
import {
  getPhaseCaptureSections,
  type PhaseCaptureSection,
} from "@/lib/programs/phase-capture-contract";
import type { AvaPhaseInputProposal } from "@/lib/programs/phase-input-draft-proposals";
import { parseDiagnosisFacts } from "@/lib/programs/diagnosis-facts";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
import {
  assembleP3SolutionOptions,
  buildP3DesignInputsPackFromSignals,
  type P3OptionSet,
} from "@/lib/programs/phase-templates/p3-option-assembler";
import { buildingBlockLabel } from "@/lib/programs/phase-templates/building-blocks";
import {
  buildNextPhaseReadinessPack,
  type NextPhaseReadinessPack,
} from "@/lib/programs/phase-templates/next-phase-readiness-pack";
import { buildMovesChatAvaAnswerPacket } from "@/lib/programs/moves-chat-answer-packet";
import { demoSafeClientText } from "@/lib/client-config";
import { PHASE_CANONICAL_KEYS } from "@/lib/programs/deliverable-registry";
import {
  APPROVAL_ROLE_LABELS,
  type ApprovalRole,
  requiredApprovalRolesFor,
} from "@/lib/programs/deliverable-role-approval-policy";
import type { StrategicMove } from "@/lib/programs/types.ui";

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
  /**
   * Authoritative phase-capture values, preloaded server-side. Passed as a prop
   * rather than fetched after mount so the page never renders a synthesized or
   * empty-then-corrected state — the window in which the previous defect
   * displayed boilerplate as if it were the client's own answers.
   */
  initialPhaseCaptureValues?: Record<string, string>;
  /** Revision of those values; echoed on save so a stale write is rejected. */
  initialPhaseCaptureRevision?: string;
  move: StrategicMove;
  phaseNum: number;
  phaseTallies: PhaseTallyRow[];
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
  carriesForwardContent: DeliverableContentSignal[];
  phaseNavigationStatus?: PhaseNavigationStatus;
  currentStateReadiness?: ReadinessReport | null;
  initialSubstepKey?: SubstepKey;
  /** `moves_pricing_engine` feature flag, resolved server-side (tenant-gated, default OFF) — see the phase page. Gates the "Cost & Effort" rail entry point entirely; when false the button does not render at all. */
  pricingEngineEnabled?: boolean;
  /** `moves_risk_tier_scoring_v1` feature flag, resolved server-side (tenant-gated, default OFF) — see the phase page. Gates the "Risk Assessment" rail entry point on P2 AND P3 (starts at P2, finalized at P3); when false the button does not render at all. Same pattern as pricingEngineEnabled. */
  riskAssessmentEnabled?: boolean;
  /** `moves_solution_pattern_gate_v1` feature flag, resolved server-side (tenant-gated, default OFF) — see the phase page. Gates the "Solutioning" rail entry point entirely (P3 only); when false the button does not render at all. Same pattern as pricingEngineEnabled. */
  solutionPatternGateEnabled?: boolean;
  /** The signed-in session's identity, resolved server-side (never client-supplied)
   *  — shown in the gate-approval confirmation dialog so an approver sees who
   *  they're approving as before committing. Absent (null) degrades gracefully:
   *  the confirmation still shows, just without the approver-identity line. */
  currentUser?: { email: string | null; role: string | null } | null;
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

function inferP3SelectedOptionIdFromRecommendation(
  recommendation: unknown,
  options: P3OptionSet["options"],
): string {
  const normalized = String(recommendation ?? "").toLowerCase();
  if (!normalized.trim()) return "";
  const direct = options.find((option) => {
    const id = option.id.toLowerCase();
    const label = option.label.toLowerCase();
    return (
      normalized.includes(`option ${id}`) ||
      normalized.includes(`${id}:`) ||
      normalized.includes(label)
    );
  });
  if (direct) return direct.id;
  const recommended = options.find((option) => option.recommended);
  return recommended && normalized.includes("recommended")
    ? recommended.id
    : "";
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
    status?: string;
    proposalCount?: number;
    pendingCount?: number;
    proposals?: Array<{
      proposalId?: string;
      questionId?: string;
      dimensionId?: string;
      requirement?: "required" | "recommended";
      question?: string;
      response?: string;
      answerState?: string;
      disposition?: string;
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
    sessions: ["Problem framing", "Sponsor alignment", "Evidence inventory"],
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
      "Sponsor charter review",
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
    navLabel: "Understand Current State",
    title: "Understand Current State",
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
    navLabel: "Choose the Approach",
    title: "Choose the Approach",
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
    navLabel: "Build the Plan",
    title: "Build the Plan",
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
    navLabel: "Prepare to Execute",
    title: "Prepare to Execute",
    question: "Is the organization ready to execute and track outcomes?",
    lede: "Prepare ownership, controls, adoption, value tracking, and Tower handoff. Make approved value measurable after launch.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "workstreams", label: "Execution Readiness" },
      { key: "approve", label: "Approve & Build" },
    ],
    sessions: [
      "Mobilization readiness",
      "Controls and adoption review",
      "Tower metric handoff",
    ],
    templates: [
      { name: "Mobilization Handoff", type: "DOCX" },
      { name: "Adoption & Controls Plan", type: "XLSX" },
      { name: "Tower Outcome Ledger", type: "XLSX" },
    ],
    avaRole: "Execution-readiness partner",
    avaContext:
      "I help make the handoff explicit: owners, controls, adoption evidence, and Tower metrics.",
    avaQuestions: [
      "What is not ready for execution?",
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

function phaseFor(phaseNum: number): PhaseContract {
  return PHASES.find((phase) => phase.phase === phaseNum) ?? PHASES[0];
}

function nextPhaseFor(phase: PhaseContract): PhaseContract | null {
  return PHASES.find((item) => item.phase === phase.phase + 1) ?? null;
}

function phaseWorkspaceLabel(phase: PhaseContract): string {
  return `${phase.code} · ${phase.title}`;
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

export function MovesPhaseStandaloneClient({
  initialPhaseCaptureValues,
  initialPhaseCaptureRevision,
  move,
  phaseNum,
  phaseTallies,
  evidenceNeedPackets,
  carriesForwardContent,
  phaseNavigationStatus,
  currentStateReadiness = null,
  initialSubstepKey,
  pricingEngineEnabled = false,
  riskAssessmentEnabled = false,
  solutionPatternGateEnabled = false,
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
  const [substepIndex, setSubstepIndex] = useState(initialSubstepIndex);
  // Rail collapse/expand is part of the universal Moves shell.
  const [railCollapsed, setRailCollapsed] = useState(false);
  // Which left-menu row is showing in the right detail pane: a real
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
  const avaThreadRef = useRef<AvaChatMessage[]>([]);
  avaThreadRef.current = avaThread;
  // P3 recommendations may be highlighted, but no option is selected until the
  // human explicitly clicks it. A recommendation is not an approval.
  const [selectedOption, setSelectedOption] = useState(
    phase.phase === 3 ? "" : "B",
  );
  const [gateApproved, setGateApproved] = useState(isHistoricalPhase);
  const [gateApprovalStatus, setGateApprovalStatus] = useState<
    "idle" | "approving" | "approved" | "blocked"
  >(isHistoricalPhase ? "approved" : "idle");
  const [gateApprovalMessage, setGateApprovalMessage] = useState<string | null>(
    null,
  );
  const substep = phase.substeps[substepIndex] ?? phase.substeps[0];
  const topLevelHardGateCriteria = move.gateCriteria.filter(
    (criterion) => criterion.severity === "hard",
  );
  const topLevelHardGateMet = topLevelHardGateCriteria.filter(
    (criterion) => criterion.completed,
  ).length;
  const topLevelHardGateTotal =
    topLevelHardGateCriteria.length || move.gateCriteria.length;
  const hardGateProgressLabel =
    topLevelHardGateTotal > 0
      ? `${topLevelHardGateMet}/${topLevelHardGateTotal} hard met`
      : "no hard gates";
  const progressPct = Math.round(
    ((substepIndex + 1) / phase.substeps.length) * 100,
  );
  const phaseReadinessLabel =
    isHistoricalPhase || gateApproved
      ? "Complete"
      : substep.key === "approve" && topLevelHardGateTotal > 0
        ? topLevelHardGateMet >= topLevelHardGateTotal
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
        carriesForwardContent,
        charter: move.charter,
        evidenceNeedPackets,
        gateCriteria: move.gateCriteria,
        linkedEvidence: move.linkedEvidence,
        moveId: move.id,
        moveName: displayMoveName,
        readiness: currentStateReadiness,
      }),
    [
      carriesForwardContent,
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
    () => getPhaseCaptureSections(phase.phase),
    [phase.phase],
  );
  const inferredSelectedOption = useMemo(
    () =>
      phase.phase === 3
        ? inferP3SelectedOptionIdFromRecommendation(
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
  const effectiveSelectedOption = selectedOption || inferredSelectedOption;
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
  const phaseCaptureCompleteCount = useMemo(
    () =>
      phaseCaptureSections.filter((section) =>
        String(persistedPhaseCaptureValues[section.key] ?? "").trim(),
      ).length,
    [phaseCaptureSections, persistedPhaseCaptureValues],
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
  const blockedPhaseRequest = phaseNavigationStatus?.blockedRequest ?? null;
  const phaseStoryNextAction =
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
  const phaseStoryArtifactStatus =
    blockedPhaseRequest && phase.phase === 1
      ? "Workbook uploaded/previewed is not acceptance"
      : phase.phase < 5
        ? "Workbook available · acceptance required before next phase"
        : "Tower handoff artifacts";
  const phaseStoryRemaining = blockedPhaseRequest
    ? blockedPhaseRequest.reason
    : phaseCaptureMissingCount > 0
      ? `${phaseCaptureMissingCount} phase input${
          phaseCaptureMissingCount === 1 ? "" : "s"
        } still missing from persisted server state.`
      : substep.key === "approve" && topLevelHardGateMet < topLevelHardGateTotal
        ? `${topLevelHardGateTotal - topLevelHardGateMet} hard gate blocker${
            topLevelHardGateTotal - topLevelHardGateMet === 1 ? "" : "s"
          } remain.`
        : "No required input blockers for the current step.";
  const phaseProgressSignals = [
    {
      label: "Inputs",
      value: `${phaseCaptureCompleteCount}/${phaseCaptureSections.length}`,
      tone:
        phaseCaptureMissingCount === 0 && phaseCaptureDirtyCount === 0
          ? "ready"
          : "open",
    },
    {
      label: "Gate",
      value: phaseReadinessLabel,
      tone:
        isHistoricalPhase ||
        gateApproved ||
        topLevelHardGateMet >= topLevelHardGateTotal
          ? "ready"
          : "blocked",
    },
    {
      label: "Next",
      value: phaseStoryNextAction,
      tone: phaseCaptureMissingCount > 0 ? "open" : "neutral",
    },
  ];
  const phaseCaptureBlocker =
    phase.phase === 3 && !selectedP3Option
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
                ? `Complete ${phaseCaptureMissingCount} phase input${
                    phaseCaptureMissingCount === 1 ? "" : "s"
                  } before Approve & Build.`
                : null;
  // MOVES-UI-001 Steps two-column "Coming up" card. Same real inputs and same
  // function (`buildNextPhaseReadinessPack`) the Approve substep already uses
  // for its "Next phase readiness" section below — computed once here so the
  // two-column view (which renders outside that substep) can show it without
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
    if (phase.phase < 1 || avaDraftStatus === "loading") return;
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
                `Effort: ${selectedP3Option.effort}`,
                `Time to value: ${selectedP3Option.timeToValue}`,
                ...selectedP3Option.risks.map(
                  (risk) => `Risk accepted for design: ${risk}`,
                ),
              ],
              options: p3OptionSet.options.map((option) => ({
                id: option.id,
                name: option.label,
                summary: option.summary,
                scores: option.scores,
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

  async function approvePhaseGateAfterBuild(result: {
    succeededKeys: string[];
    failedKeys: string[];
    total: number;
  }) {
    // This only ever runs once every queued deliverable in the batch has
    // reached a terminal status (see PhaseApproveAndBuild's onBuildSettled) —
    // never while generation is still queued or running, and never when a
    // required deliverable failed or was held below gate.
    if (result.failedKeys.length > 0) {
      setGateApprovalStatus("blocked");
      throw new Error(
        `${result.failedKeys.length} required output${result.failedKeys.length === 1 ? "" : "s"} ` +
          `failed to generate or were held below gate (${result.failedKeys.join(", ")}). ` +
          "Fix the underlying issue and re-run Approve & Build before requesting gate approval.",
      );
    }
    if (result.succeededKeys.length === 0) {
      setGateApprovalStatus("blocked");
      throw new Error(
        "No required deliverables completed generation for this phase.",
      );
    }
    setGateApprovalStatus("approving");
    setGateApprovalMessage(
      `${result.succeededKeys.length} required output${result.succeededKeys.length === 1 ? "" : "s"} built. Submitting gate approval...`,
    );

    const approvalRes = await fetch(
      `/api/v1/programs/${move.id}/phase-gate-approval`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: phase.phase,
          rationale: `P${phase.phase} reviewed, required phase outputs reached terminal build status, and gate approval submitted through the standalone Moves workspace.`,
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
    };
    if (!approvalRes.ok || !approval.ok) {
      const hard = approval.gate?.failedChecks
        ?.filter((check) => check.severity === "hard")
        .map((check) => check.reason || check.check)
        .join("; ");
      const blockedMessage =
        hard ||
        (approval.missing?.length
          ? `P${phase.phase} capture is incomplete - missing: ${approval.missing.join(", ")}`
          : "") ||
        approval.detail ||
        approval.error ||
        `Gate approval failed (HTTP ${approvalRes.status})`;
      setGateApprovalStatus("blocked");
      setGateApprovalMessage(
        `Build completed, but the phase gate is blocked: ${blockedMessage}. Review the open gate item, approve or upload the client-approved deliverable in Files & Evidence, then re-run Approve & Build.`,
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
      await approvePhaseGateAfterBuild({
        succeededKeys: ["origination_brief"],
        failedKeys: [],
        total: 1,
      });
    } catch (err) {
      setGateApproved(false);
      setGateApprovalStatus("blocked");
      setGateApprovalMessage(
        err instanceof Error ? err.message : "Gate approval failed.",
      );
    }
  }

  return (
    <main
      className="mxw mxw-finder-on"
      data-testid="moves-phase-standalone"
      data-finder-shell="on"
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
      />
      {(() => {
        const collapsedRail = railCollapsed;
        return (
          <div
            className={`mxw-surface${collapsedRail ? " mxw-surface-rail-collapsed" : ""}`}
          >
            <aside
              className={`mxw-side${collapsedRail ? " mxw-side-collapsed" : ""}`}
              aria-label="Move phases"
            >
              <button
                type="button"
                className="mxw-rail-toggle"
                onClick={() => setRailCollapsed((prev) => !prev)}
                aria-expanded={!railCollapsed}
                aria-label={
                  railCollapsed ? "Expand phase rail" : "Collapse phase rail"
                }
                title={railCollapsed ? "Expand" : "Collapse"}
              >
                {railCollapsed ? "»" : "«"}
              </button>
              {!collapsedRail && (
                <div className="mxw-move">
                  <Link className="mxw-back" href="/strategic-moves">
                    ← All Moves
                  </Link>
                  <h2>{displayMoveName}</h2>
                  <p>{supportLine}</p>
                </div>
              )}
              {!collapsedRail && <div className="mxw-side-label">Phases</div>}
              <nav className="mxw-phase-list">
                {PHASES.map((item) => {
                  const tally = phaseTallies.find(
                    (row) => row.phase === item.phase,
                  );
                  const state =
                    tally?.state === "done"
                      ? "done"
                      : item.phase < move.currentPhase
                        ? "done"
                        : item.phase === move.currentPhase
                          ? "current"
                          : "up";
                  const viewing = item.phase === phase.phase;
                  const stateLabel = tally
                    ? `${tally.met} of ${tally.total}`
                    : state === "done"
                      ? "Complete"
                      : state === "current"
                        ? "In progress"
                        : "Upcoming";
                  const phaseBody = (
                    <>
                      <span className="mxw-phase-dot">
                        {state === "done" ? "✓" : item.code}
                      </span>
                      {!collapsedRail && (
                        <span className="mxw-phase-name">{item.navLabel}</span>
                      )}
                      {!collapsedRail && (
                        <span className="mxw-phase-state">{stateLabel}</span>
                      )}
                    </>
                  );
                  const rowTitle = collapsedRail
                    ? `${item.navLabel} · ${stateLabel}`
                    : tally
                      ? `${tally.met} of ${tally.total} gate criteria met`
                      : undefined;
                  return (
                    <div className="mxw-phase-row" key={item.code}>
                      {item.phase <= move.currentPhase ? (
                        <Link
                          className={`mxw-phase ${state} ${viewing ? "viewing" : ""}`}
                          href={`/strategic-moves/${move.id}/phase/${item.phase}`}
                          title={rowTitle}
                        >
                          {phaseBody}
                        </Link>
                      ) : (
                        <button
                          className={`mxw-phase ${state} ${viewing ? "viewing" : ""}`}
                          disabled
                          title={rowTitle}
                        >
                          {phaseBody}
                        </button>
                      )}
                      {item.phase < 5 && !collapsedRail ? (
                        <span className="mxw-connector" />
                      ) : null}
                    </div>
                  );
                })}
              </nav>
              {!collapsedRail && (
                <div className="mxw-side-label mxw-workspace-label">
                  Workspace
                </div>
              )}
              <div className="mxw-rail-extra">
                <button
                  className={`mxw-lib-link ${workspaceView === "phase" ? "viewing" : ""}`}
                  onClick={() => {
                    setWorkspaceView("phase");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  title={collapsedRail ? "Stage workspace" : undefined}
                  type="button"
                >
                  <span>▦</span>
                  {!collapsedRail && "Stage workspace"}
                </button>
                <button
                  className={`mxw-lib-link ${workspaceView === "files" ? "viewing" : ""}`}
                  onClick={() => {
                    setWorkspaceView("files");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  title={collapsedRail ? "Files & Evidence" : undefined}
                  type="button"
                >
                  <span>▣</span>
                  {!collapsedRail && "Files & Evidence"}
                </button>
                <button
                  className={`mxw-lib-link ${workspaceView === "intelligence" ? "viewing" : ""}`}
                  onClick={() => {
                    setWorkspaceView("intelligence");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  title={collapsedRail ? "Phase Intelligence" : undefined}
                  type="button"
                >
                  <span>◈</span>
                  {!collapsedRail && "Phase Intelligence"}
                </button>
                <button
                  className={`mxw-lib-link ${
                    workspaceView === "approvals" ? "viewing" : ""
                  }`}
                  onClick={() => {
                    setWorkspaceView("approvals");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  title={collapsedRail ? "Approvals" : undefined}
                  type="button"
                >
                  <span>✓</span>
                  {!collapsedRail && "Approvals"}
                </button>
                {phase.phase === 4 && pricingEngineEnabled ? (
                  <button
                    className={`mxw-lib-link ${workspaceView === "pricing" ? "viewing" : ""}`}
                    onClick={() => {
                      setWorkspaceView("pricing");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    title={collapsedRail ? "Cost & Effort" : undefined}
                    type="button"
                  >
                    <span>$</span>
                    {!collapsedRail && "Cost & Effort"}
                  </button>
                ) : null}
                {(phase.phase === 2 || phase.phase === 3) &&
                riskAssessmentEnabled ? (
                  <button
                    className={`mxw-lib-link ${workspaceView === "risk" ? "viewing" : ""}`}
                    onClick={() => {
                      setWorkspaceView("risk");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    title={collapsedRail ? "Risk Assessment" : undefined}
                    type="button"
                  >
                    <span>!</span>
                    {!collapsedRail && "Risk Assessment"}
                  </button>
                ) : null}
                {phase.phase === 3 && solutionPatternGateEnabled ? (
                  <button
                    className={`mxw-lib-link ${workspaceView === "solutioning" ? "viewing" : ""}`}
                    onClick={() => {
                      setWorkspaceView("solutioning");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    title={collapsedRail ? "Solutioning" : undefined}
                    type="button"
                  >
                    <span>◆</span>
                    {!collapsedRail && "Solutioning"}
                  </button>
                ) : null}
              </div>
              {!collapsedRail && (
                <p className="mxw-foot">
                  <b>aVa</b> guides P0-P4 · Atlas takes over P5 Execute.
                </p>
              )}
            </aside>

            <section
              className="mxw-shell"
              aria-label={`${phase.code} phase workspace`}
            >
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
                  <WorkspaceSurfaceTabs
                    activeView={workspaceView}
                    onSelect={setWorkspaceView}
                  />
                  <FileCabinetPanel moveId={move.id} phase={phase.phase} />
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
                  <WorkspaceSurfaceTabs
                    activeView={workspaceView}
                    onSelect={setWorkspaceView}
                  />
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

                  <div className="mxw-stage-head">
                    <div className="mxw-agent-chip">
                      <span />
                      AVA · MOVES
                    </div>
                    <h1>{phase.title}</h1>
                    <div className="mxw-question">{phase.question}</div>
                    <p>{phase.lede}</p>
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
                            setSubstepIndex(1);
                            setFinderSelectedSectionKey(null);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          type="button"
                        >
                          {blockedPhaseRequest.nextActionLabel}
                        </button>
                      </div>
                    ) : null}
                    {readinessWorkbookHref ? (
                      <div className="mxw-stage-actions">
                        <a
                          className="mxw-stage-download"
                          download
                          href={readinessWorkbookHref}
                        >
                          Download P{phase.phase + 1} readiness workbook
                        </a>
                        <StageReadinessWorkbookPreviewControl
                          apiPath={readinessWorkbookHref}
                        />
                      </div>
                    ) : null}
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
                  </div>

                  <WorkspaceSurfaceTabs
                    activeView={workspaceView}
                    onSelect={setWorkspaceView}
                  />

                  {phase.phase >= 1 && phase.phase <= 5 ? (
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
                      phaseCaptureSections={phaseCaptureSections}
                      phaseCaptureValues={displayPhaseCaptureValues}
                      persistedPhaseCaptureValues={persistedPhaseCaptureValues}
                      phaseCaptureSaveErrors={displayPhaseCaptureSaveErrors}
                      phaseCaptureSaveStatus={displayPhaseCaptureSaveStatus}
                      readinessPack={finderReadinessPack}
                      selectedSectionKey={finderSelectedSectionKey}
                      substepBody={
                        <PhaseBody
                          carriesForwardContent={carriesForwardContent}
                          currentStateReadiness={currentStateReadiness}
                          evidenceCount={evidenceCount}
                          findingsEvidenceLabel={findingsEvidenceLabel}
                          evidenceNeedPackets={evidenceNeedPackets}
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
                          onFinalizePhaseCapture={finalizePhaseCapture}
                          onOpenFiles={openFilesWorkspace}
                          onPhaseCaptureValueChange={setPhaseCaptureValue}
                          onRefreshPhase={refreshPhase}
                          onSelectOption={selectP3Option}
                          nextOpenPhaseContract={nextOpenPhaseContract}
                          p3OptionSet={p3OptionSet}
                          phase={phase}
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
                  ) : (
                    <FinderStepsColumns
                      comingUpExpanded={finderComingUpExpanded}
                      onPhaseCaptureValueChange={setPhaseCaptureValue}
                      onSelectSection={setFinderSelectedSectionKey}
                      onSelectSubstep={setSubstepIndex}
                      onToggleComingUp={() =>
                        setFinderComingUpOpen(
                          (open) => !(open ?? finderComingUpExpanded),
                        )
                      }
                      phase={phase}
                      phaseCaptureSections={phaseCaptureSections}
                      phaseCaptureValues={phaseCaptureValues}
                      persistedPhaseCaptureValues={persistedPhaseCaptureValues}
                      phaseCaptureSaveErrors={phaseCaptureSaveErrors}
                      phaseCaptureSaveStatus={phaseCaptureSaveStatus}
                      readinessPack={finderReadinessPack}
                      selectedSectionKey={finderSelectedSectionKey}
                      substepBody={
                        <PhaseBody
                          carriesForwardContent={carriesForwardContent}
                          currentStateReadiness={currentStateReadiness}
                          evidenceCount={evidenceCount}
                          findingsEvidenceLabel={findingsEvidenceLabel}
                          evidenceNeedPackets={evidenceNeedPackets}
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
                          onFinalizePhaseCapture={finalizePhaseCapture}
                          onOpenFiles={openFilesWorkspace}
                          onPhaseCaptureValueChange={setPhaseCaptureValue}
                          onRefreshPhase={refreshPhase}
                          onSelectOption={selectP3Option}
                          nextOpenPhaseContract={nextOpenPhaseContract}
                          p3OptionSet={p3OptionSet}
                          phase={phase}
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
              {phase.phase >= 1 ? (
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

function WorkspaceSurfaceTabs({
  activeView,
  onSelect,
}: {
  activeView: WorkspaceView;
  onSelect: (view: WorkspaceView) => void;
}) {
  const tabs: Array<{ label: string; view: WorkspaceView }> = [
    { label: "Steps", view: "phase" },
    { label: "Files", view: "files" },
    { label: "Intelligence", view: "intelligence" },
  ];

  return (
    <div
      className="mxw-surface-tabs"
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
// Approver is always the static "Sponsor" label: every GATE_RULES entry in
// governance.ts uses the single constant `approverRole: "sponsor"` today —
// this does not imply a multi-role approval model exists.
//
// "Review & approve" reuses the same two navigation mechanisms already used
// elsewhere in this file: a real Link to the phase's own route for any other
// reachable phase (the exact href pattern the rail's phase-list already
// uses), or a local workspaceView/substep jump when the row is the phase
// already open on this page (the exact behavior the rail's Approvals link
// already used before this flag existed).
// ---------------------------------------------------------------------------

function approvalStatusText(row: PhaseTallyRow): string {
  if (row.state === "done") return "Approved";
  if (row.state === "current") {
    return row.met === row.total
      ? "Ready to submit"
      : `${row.met}/${row.total} met — not yet submitted`;
  }
  return "Not reached";
}

function approvalStatusClass(row: PhaseTallyRow): string {
  if (row.state === "done") return "approved";
  if (row.state === "current") {
    return row.met === row.total ? "ready" : "pending";
  }
  return "upcoming";
}

function approvalRoleLabelForPhase(phase: number): string {
  const roleOrder: ApprovalRole[] = [
    "business",
    "technology",
    "finance",
    "risk_security",
  ];
  const roles = new Set(
    (PHASE_CANONICAL_KEYS[phase] ?? []).flatMap((key) =>
      requiredApprovalRolesFor(key),
    ),
  );

  if (roles.size === 0) {
    return "Not yet assigned";
  }

  return roleOrder
    .filter((role) => roles.has(role))
    .map((role) => APPROVAL_ROLE_LABELS[role])
    .join(" · ");
}

function ApprovalsOverview({
  currentMoveId,
  phaseTallies,
  reachablePhase,
  viewingPhase,
  onReviewCurrentPhase,
}: {
  currentMoveId: string;
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
        const approverLabel = approvalRoleLabelForPhase(row.phase);
        return (
          <div className="mxw-approvals-row" key={row.phase}>
            <span className="mxw-approvals-phase">{row.label}</span>
            <span className="mxw-approvals-tally">
              {row.met} of {row.total} met
            </span>
            <span
              className={`mxw-approvals-status ${approvalStatusClass(row)}`}
            >
              {approvalStatusText(row)}
            </span>
            <span
              className={`mxw-approvals-approver ${
                approverLabel === "Not yet assigned" ? "unassigned" : ""
              }`}
            >
              {approverLabel}
            </span>
            <span className="mxw-approvals-action">
              {isViewingRow ? (
                <button onClick={onReviewCurrentPhase} type="button">
                  Review &amp; approve →
                </button>
              ) : isReachable ? (
                <Link
                  href={`/strategic-moves/${currentMoveId}/phase/${row.phase}`}
                >
                  Review &amp; approve →
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
}: {
  currentMoveId: string;
  maxReachablePhase: number;
  onSelectWorkspaceView: (view: WorkspaceView) => void;
  viewingPhase: number;
  workspaceView: WorkspaceView;
}) {
  const router = useRouter();
  const views: Array<{ label: string; value: WorkspaceView }> = [
    { label: "Stage", value: "phase" },
    { label: "Files", value: "files" },
    { label: "Intel", value: "intelligence" },
    { label: "Approvals", value: "approvals" },
  ];

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
        {views.map((view) => (
          <button
            aria-selected={workspaceView === view.value}
            className={workspaceView === view.value ? "viewing" : ""}
            key={view.value}
            onClick={() => {
              onSelectWorkspaceView(view.value);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            role="tab"
            type="button"
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Moves universal Steps view.
//
// Replaces the horizontal substep tab strip with a macOS-Finder-style
// left sub-menu + right detail pane, per the owner-approved reference. Real
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
): PhaseCaptureStatusView {
  // Delegates to the shared, unit-tested state machine so the badge's meaning
  // is asserted somewhere other than a browser run. See phase-capture-status.ts
  // for the invariant: Done means the visible value is reproducible from the
  // server after a no-store reload.
  return resolvePhaseCaptureStatus({
    draft: String(draftValues[section.key] ?? ""),
    persisted: String(persistedValues[section.key] ?? ""),
    saveStatus: saveStatus[section.key],
  });
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
  phaseCaptureSections,
  phaseCaptureValues,
  persistedPhaseCaptureValues,
  phaseCaptureSaveErrors,
  phaseCaptureSaveStatus,
  readinessPack,
  selectedSectionKey,
  substepBody,
  substepIndex,
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
  phaseCaptureSections: ReturnType<typeof getPhaseCaptureSections>;
  phaseCaptureValues: PhaseCaptureValues;
  persistedPhaseCaptureValues: PhaseCaptureValues;
  phaseCaptureSaveErrors: Record<string, string>;
  phaseCaptureSaveStatus: Record<string, PhaseCaptureSaveStatus>;
  readinessPack: NextPhaseReadinessPack;
  selectedSectionKey: string | null;
  substepBody: ReactNode;
  substepIndex: number;
}) {
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
  const detailComplete = selectedSection
    ? phaseCaptureStatusForSection(
        selectedSection,
        phaseCaptureValues,
        persistedPhaseCaptureValues,
        phaseCaptureSaveStatus,
      ).complete
    : substepIndex < phase.substeps.length - 1
      ? true
      : false;
  const detailStatus = selectedSection
    ? phaseCaptureStatusForSection(
        selectedSection,
        phaseCaptureValues,
        persistedPhaseCaptureValues,
        phaseCaptureSaveStatus,
      )
    : null;
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
      document
        .querySelector(".mxw-contract-detail, .mxw-finder-detail")
        ?.scrollIntoView({
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

  return (
    <section
      className="mxw-contract-card"
      aria-label={`${phase.code} phase shell`}
      data-testid="mxw-contract-card"
    >
      <aside className="mxw-contract-nav" aria-label={`${phase.code} steps`}>
        <div className="mxw-contract-group">
          <div className="mxw-contract-group-label">Inputs</div>
          {phaseCaptureSections.map((section) => {
            const status = phaseCaptureStatusForSection(
              section,
              phaseCaptureValues,
              persistedPhaseCaptureValues,
              phaseCaptureSaveStatus,
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
            const complete = index < substepIndex;
            return (
              <button
                className={`mxw-contract-step ${active ? "active" : ""}`}
                key={item.key}
                onClick={() => {
                  onSelectSubstep(index);
                  onSelectSection(null);
                  scrollContractDetailIntoView();
                }}
                type="button"
              >
                <span className={complete ? "done" : ""} aria-hidden>
                  {complete ? "✓" : ""}
                </span>
                <strong>{item.label}</strong>
              </button>
            );
          })}
        </div>
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
        <div className="mxw-contract-nav-foot">
          Use the left steps in order. Approve &amp; Build remains the governed
          close; it is not a visual-only button.
        </div>
      </aside>

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
          <b>{detailStatus?.label ?? (detailComplete ? "Done" : "Open")}</b>
        </div>

        {selectedSection ? (
          <div className="mxw-contract-form">
            <p>{selectedSection.description}</p>
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
            <textarea
              aria-label={selectedSection.label}
              className="mxw-contract-input"
              onChange={(event) =>
                onPhaseCaptureValueChange(
                  selectedSection.key,
                  event.target.value,
                )
              }
              placeholder={selectedSection.description}
              rows={selectedSection.structured === "facts" ? 4 : 6}
              value={phaseCaptureValues[selectedSection.key] ?? ""}
            />
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
  onPhaseCaptureValueChange,
  onSelectSection,
  onSelectSubstep,
  onToggleComingUp,
  phase,
  phaseCaptureSections,
  phaseCaptureValues,
  persistedPhaseCaptureValues,
  phaseCaptureSaveErrors,
  phaseCaptureSaveStatus,
  readinessPack,
  selectedSectionKey,
  substepBody,
  substepIndex,
}: {
  comingUpExpanded: boolean;
  onPhaseCaptureValueChange: (key: string, value: string) => void;
  onSelectSection: (key: string | null) => void;
  onSelectSubstep: (index: number) => void;
  onToggleComingUp: () => void;
  phase: PhaseContract;
  phaseCaptureSections: ReturnType<typeof getPhaseCaptureSections>;
  phaseCaptureValues: PhaseCaptureValues;
  persistedPhaseCaptureValues: PhaseCaptureValues;
  phaseCaptureSaveErrors: Record<string, string>;
  phaseCaptureSaveStatus: Record<string, PhaseCaptureSaveStatus>;
  readinessPack: NextPhaseReadinessPack;
  selectedSectionKey: string | null;
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
    ? phaseCaptureStatusForSection(
        selectedSection,
        phaseCaptureValues,
        persistedPhaseCaptureValues,
        phaseCaptureSaveStatus,
      )
    : null;

  return (
    <div className="mxw-finder-steps" data-testid="mxw-finder-steps">
      <nav aria-label="Phase steps" className="mxw-finder-steps-menu">
        <div className="mxw-finder-step-group">
          <h3>{phase.code} inputs</h3>
          <ul>
            {phaseCaptureSections.map((section) => {
              const status = phaseCaptureStatusForSection(
                section,
                phaseCaptureValues,
                persistedPhaseCaptureValues,
                phaseCaptureSaveStatus,
              );
              const blocked = section.required && !status.complete;
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
                    {blocked ? (
                      <span className="mxw-finder-step-subtitle">
                        {status.label === "Open" ? "Needs input" : status.label}
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
        <div className="mxw-finder-comingup" data-testid="mxw-finder-comingup">
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
      </nav>
      <div
        aria-label={
          selectedSection
            ? `${selectedSection.label} detail`
            : `${phase.substeps[substepIndex]?.label ?? phase.substeps[0]?.label ?? phase.code} detail`
        }
        className="mxw-finder-detail"
      >
        {selectedSection ? (
          <section className="mxw-finder-detail-panel">
            <header>
              <h2>{selectedSection.label}</h2>
              <p>{selectedSection.description}</p>
            </header>
            {selectedSection.structured === "facts" ? (
              <FinderFactsTable
                rawValue={phaseCaptureValues[selectedSection.key] ?? ""}
              />
            ) : null}
            <textarea
              aria-label={selectedSection.label}
              className="mxw-finder-detail-input"
              onChange={(event) =>
                onPhaseCaptureValueChange(
                  selectedSection.key,
                  event.target.value,
                )
              }
              rows={selectedSection.structured === "facts" ? 3 : 6}
              value={phaseCaptureValues[selectedSection.key] ?? ""}
            />
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
  carriesForwardContent,
  currentStateReadiness,
  displayMoveName,
  evidenceCount,
  findingsEvidenceLabel,
  evidenceNeedPackets,
  gateApproved,
  gateApprovalMessage,
  gateApprovalStatus,
  isHistoricalPhase,
  move,
  onApproveAfterBuild,
  onContinueCurrentPhase,
  onApproveP0Gate,
  approverLabel,
  onFinalizePhaseCapture,
  onOpenFiles,
  onPhaseCaptureValueChange,
  onRefreshPhase,
  onSelectOption,
  nextOpenPhaseContract,
  p3OptionSet,
  phase,
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
  carriesForwardContent: DeliverableContentSignal[];
  currentStateReadiness: ReadinessReport | null;
  displayMoveName: string;
  evidenceCount: number;
  findingsEvidenceLabel: string;
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
  gateApproved: boolean;
  gateApprovalMessage: string | null;
  gateApprovalStatus: "idle" | "approving" | "approved" | "blocked";
  isHistoricalPhase: boolean;
  move: StrategicMove;
  onApproveAfterBuild: (result: {
    succeededKeys: string[];
    failedKeys: string[];
    total: number;
  }) => Promise<void>;
  onContinueCurrentPhase: () => void;
  onApproveP0Gate: () => void | Promise<void>;
  approverLabel: string | null;
  onFinalizePhaseCapture: () => Promise<void>;
  onOpenFiles: () => void;
  onPhaseCaptureValueChange: (key: string, value: string) => void;
  onRefreshPhase: () => void;
  onSelectOption: (value: string) => void;
  nextOpenPhaseContract: PhaseContract;
  p3OptionSet: P3OptionSet;
  phase: PhaseContract;
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
  if (phase.phase === 0 && substep !== "approve") {
    return <P0OriginationHandoff move={move} />;
  }

  if (substep === "prepare") {
    if (phase.phase === 1) {
      return (
        <>
          <PhaseCaptureEditor
            completeCount={phaseCaptureCompleteCount}
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
              selected solution approach; P3 will choose the approach after
              current-state evidence, constraints, and readiness are proven.
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
      const nextPhase = nextPhaseFor(phase);

      return (
        <PhasePreparePanel
          evidenceNeedPackets={evidenceNeedPackets}
          move={move}
          nextPhaseLabel={
            nextPhase ? phaseWorkspaceLabel(nextPhase) : "Tower handoff"
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
        <DecisionEvidenceActionPanel
          buttonLabel={`Upload ${phase.code} files`}
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
            heading="Upload evidence for P1"
            moveId={move.id}
            onOpenFiles={onOpenFiles}
            phase={phase.phase}
            title="Charter Decision Notes"
          />
          <section className="mxw-zone">
            <h2>Files to upload</h2>
            <p>
              Upload sponsor review notes, scope workshop notes, success metric
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
          <h2>Decide the approach</h2>
          <p>
            Use the SME session to confirm, deviate, or define a new option.
            Deviations are allowed; the rationale must be captured.
          </p>
          <P3OptionSummary optionSet={p3OptionSet} />
          <OptionCards
            optionSet={p3OptionSet}
            selectedOption={selectedOption}
            onSelectOption={onSelectOption}
          />
        </section>
        <DecisionEvidenceActionPanel
          buttonLabel="Upload decision files"
          heading="Upload evidence for approach decision"
          moveId={move.id}
          onOpenFiles={onOpenFiles}
          phase={phase.phase}
          title="Solution Approach Decision Summary"
        />
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
    return (
      <section className="mxw-zone">
        <h2>
          {substep === "canvas" ? "The Building-Blocks Canvas" : "Workstreams"}
        </h2>
        <p>
          Design fidelity is strategy-grade: each lane is defined just far
          enough to estimate effort, sequence the roadmap, and price the risk.
        </p>
        <div className="mxw-lanes">
          {[
            [
              "Process",
              "Workflow changes, decision rights, and handoff model.",
            ],
            ["Data", "Evidence, semantic layer, quality rules, and lineage."],
            [
              "Technology",
              "Integration, automation, platform, and control posture.",
            ],
            [
              "People",
              "Human + AI work split, adoption, and operating ownership.",
            ],
          ].map(([lane, detail], index) => (
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
            <button
              type="button"
              className="mxw-evidence-count-link"
              onClick={onOpenFiles}
              aria-label={`${evidenceCount} evidence items — open Files & Evidence`}
            >
              {evidenceCount} items
            </button>
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
  const hardGateCriteria = move.gateCriteria.filter(
    (criterion) => criterion.severity === "hard",
  );
  const softGateCriteria = move.gateCriteria.filter(
    (criterion) => criterion.severity === "soft",
  );
  const openHardCriteria = hardGateCriteria.filter(
    (criterion) => !criterion.completed,
  );
  const hardMetCount = hardGateCriteria.filter(
    (criterion) => criterion.completed,
  ).length;
  const hardTotal = hardGateCriteria.length || move.gateCriteria.length;
  const openSoftCriteria = softGateCriteria.filter(
    (criterion) => !criterion.completed,
  );
  const isGateBlocked = openHardCriteria.length > 0;
  const approvalDecisionTitle = isHistoricalPhase
    ? terminalComplete
      ? "Move handed off to Tower"
      : `${phase.code} is already approved`
    : gateApproved
      ? `${phase.code} approved`
      : isGateBlocked
        ? `${phase.code} cannot advance yet`
        : `${phase.code} is ready for Approve & Build`;
  const approvalDecisionText = isHistoricalPhase
    ? terminalComplete
      ? "Tower is now the execution and value-tracking surface for this Move."
      : `The approved output is carrying forward into ${nextOpenPhaseContract.code} ${nextOpenPhaseContract.title}.`
    : gateApproved
      ? "The governed build and gate record are on file. Review artifacts in Files & Evidence before using them externally."
      : isGateBlocked
        ? `Resolve ${openHardCriteria.length} hard gate blocker${openHardCriteria.length === 1 ? "" : "s"} before advancing. Soft items can carry as caveats.`
        : "Inputs, evidence posture, and hard gates are aligned. Run Approve & Build to create the governed package and submit the gate.";
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
      : isGateBlocked
        ? "Clear hard blockers"
        : "Run Approve & Build";
  const p0ApprovalGeneratedCriteria = new Set([
    "program_seed_recorded",
    "value_hypothesis_seed",
  ]);
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
  const evidenceReady = evidenceCount > 0 || isHistoricalPhase || gateApproved;
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
      item: "Evidence attached or carried as gap",
      meaning:
        "Reviewed/approved evidence or explicit caveats are visible before approval. Uploaded files do not become authoritative until reviewed.",
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
    !phaseCaptureBlocker;
  const gateOnlyConfirmTitle =
    phase.phase >= 5
      ? "Complete P5 and hand off to Tower?"
      : `Approve the ${phase.code} gate?`;
  const gateOnlyConfirmSummary =
    phase.phase >= 5
      ? "This submits the already-satisfied P5 gate, records the terminal Tower handoff, and marks the Move complete. It does not regenerate artifacts."
      : `This submits the already-satisfied ${phase.code} gate and opens ${nextOpenPhaseContract.code} ${nextOpenPhaseContract.title}. It does not regenerate artifacts.`;
  const primaryHardBlocker = openHardCriteria[0]?.label ?? null;
  const primarySoftCaveat = openSoftCriteria[0]?.label ?? null;
  const gateSummaryLine = isGateBlocked
    ? primaryHardBlocker
      ? `Blocked by: ${primaryHardBlocker}.`
      : "Blocked by an open hard gate."
    : openSoftCriteria.length > 0
      ? primarySoftCaveat
        ? `Ready with caveat: ${primarySoftCaveat}.`
        : "Ready with caveats."
      : "No hard blockers are open.";
  const nextPhaseSummaryLine = readinessPack.isFullyReady
    ? `${readinessPack.nextPhaseLabel} can start from the approved record.`
    : `${readinessPack.openNeeds.length} prep item${
        readinessPack.openNeeds.length === 1 ? "" : "s"
      } will carry into ${readinessPack.nextPhaseLabel}.`;

  return (
    <>
      {phase.phase === 0 ? <P0CapturedBriefReview move={move} /> : null}
      {phase.phase >= 1 && !isHistoricalPhase ? (
        <PhaseCaptureEditor
          compact
          completeCount={phaseCaptureCompleteCount}
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
        <h2>Gate approval</h2>
        {isHistoricalPhase ? (
          terminalComplete ? (
            <p>
              This Move has completed P5 and handed off to Tower. The approved
              output is carrying forward into the execution and value-tracking
              surface.
            </p>
          ) : (
            <p>
              This phase is already approved and read-only. The approved output
              is carrying forward into {nextOpenPhaseContract.code}{" "}
              {nextOpenPhaseContract.title}.
            </p>
          )
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
                aria-label={`${evidenceCount} evidence items — open Files & Evidence`}
              >
                {evidenceCount} evidence item{evidenceCount === 1 ? "" : "s"}
              </button>
              <span>{nextActionLabel}</span>
            </div>
          </article>
          <details className="mxw-decision-details">
            <summary>
              <span>Why</span>
              <strong>
                {gateSummaryLine} {nextPhaseSummaryLine}
              </strong>
            </summary>
            <div className="mxw-decision-detail-grid">
              <article>
                <span className="mxw-exec-label">Evidence state</span>
                <button
                  type="button"
                  className="mxw-evidence-count-link mxw-evidence-count-link-strong"
                  onClick={onOpenFiles}
                  aria-label={`${evidenceCount} approved or agent-ready items — open Files & Evidence`}
                >
                  {evidenceCount} approved or agent-ready item
                  {evidenceCount === 1 ? "" : "s"}
                </button>
                <p>
                  Uploaded files only influence the gate after review. Gaps stay
                  visible.
                </p>
              </article>
              <article>
                <span className="mxw-exec-label">What is blocking</span>
                {isGateBlocked || openSoftCriteria.length > 0 ? (
                  <ul>
                    {openHardCriteria.slice(0, 3).map((criterion) => (
                      <li key={criterion.id}>
                        <strong>Hard:</strong> {criterion.label}
                      </li>
                    ))}
                    {openHardCriteria.length > 3 ? (
                      <li>
                        <strong>Hard:</strong> {openHardCriteria.length - 3}{" "}
                        more
                      </li>
                    ) : null}
                    {openSoftCriteria.slice(0, 2).map((criterion) => (
                      <li key={criterion.id}>
                        <strong>Caveat:</strong> {criterion.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No open gate criteria are blocking this phase.</p>
                )}
              </article>
              <article>
                <span className="mxw-exec-label">After approval</span>
                <strong>{readinessPack.nextPhaseLabel}</strong>
                <p>{nextPhaseSummaryLine}</p>
              </article>
            </div>
          </details>
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
        <details className="mxw-gate-detail">
          <summary>
            <span>Role approvals</span>
            <strong>Open review record</strong>
          </summary>
          <PhaseRoleApprovalsSummary
            moveId={move.id}
            phase={phase.phase}
            deliverables={move.deliverables}
          />
        </details>
        {gateApprovalMessage ? (
          <div className={`mxw-gate-message ${gateApprovalStatus}`}>
            {gateApprovalMessage}
          </div>
        ) : null}
        {phase.phase === 0 &&
        !isHistoricalPhase &&
        openHardCriteria.length > 0 ? (
          <div className="mxw-gate-note">
            <strong>Why some checks are still open</strong>
            <span>
              P0 approval itself signs the origination brief, so the seed and
              value checks turn green during approval. If anything remains
              blocked after approval, the exact failed check will appear here.
            </span>
          </div>
        ) : null}
        <div className="mxw-approve-build" id="mxw-approve-build-action">
          {isHistoricalPhase ? (
            <button
              className="mxw-gate-button"
              onClick={onContinueCurrentPhase}
              type="button"
            >
              {terminalComplete
                ? "Open Tower →"
                : `Continue to ${nextOpenPhaseContract.code} ${nextOpenPhaseContract.title} →`}
            </button>
          ) : phase.phase >= 1 && canSubmitSatisfiedGate ? (
            <>
              <button
                className="mxw-gate-button"
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
              <GateApprovalConfirmDialog
                open={p0ConfirmOpen}
                title={gateOnlyConfirmTitle}
                summary={gateOnlyConfirmSummary}
                approverLabel={approverLabel}
                confirmLabel={
                  phase.phase >= 5 ? "Complete and hand off" : "Approve gate"
                }
                onCancel={() => setP0ConfirmOpen(false)}
                onConfirm={() => {
                  setP0ConfirmOpen(false);
                  void onApproveAfterBuild({
                    succeededKeys: ["prebuilt_gate_outputs"],
                    failedKeys: [],
                    total: 1,
                  });
                }}
              />
            </>
          ) : phase.phase >= 1 ? (
            <PhaseApproveAndBuild
              archetype={move.archetype}
              approverLabel={approverLabel}
              clientDisplayName={move.tenant.name}
              disabledReason={phaseCaptureBlocker}
              evidenceNeedPackets={evidenceNeedPackets}
              inputCount={phaseCaptureCompleteCount}
              moveId={move.id}
              moveName={displayMoveName}
              onBeforeBuild={onFinalizePhaseCapture}
              onBuildSettled={onApproveAfterBuild}
              phaseLabel={`${phase.code} ${phase.title}`}
              phaseNum={phase.phase}
            />
          ) : (
            <>
              <button
                className="mxw-gate-button"
                disabled={gateApprovalStatus === "approving"}
                onClick={() => setP0ConfirmOpen(true)}
                type="button"
              >
                {gateApprovalStatus === "approving"
                  ? "Approving..."
                  : "Approve gate →"}
              </button>
              <GateApprovalConfirmDialog
                open={p0ConfirmOpen}
                title="Approve the P0 gate?"
                summary="This approves the origination brief and unlocks P1 Charter. The approved brief is what carries forward — review it before confirming."
                approverLabel={approverLabel}
                confirmLabel="Approve gate"
                onCancel={() => setP0ConfirmOpen(false)}
                onConfirm={() => {
                  setP0ConfirmOpen(false);
                  void onApproveP0Gate();
                }}
              />
            </>
          )}
        </div>
        {isHistoricalPhase ? (
          <div className="mxw-approved">
            <strong>
              ✓ {phase.code} is already approved
              {terminalComplete ? " and handed off to Tower" : ""}.
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
              {
                hardGateCriteria.filter((criterion) => criterion.completed)
                  .length
              }{" "}
              of {hardGateCriteria.length || move.gateCriteria.length}
            </strong>
          </header>
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
                      p0ApprovalGeneratedCriteria.has(criterion.id)
                        ? "approval-generated"
                        : ""
                    }`}
                    key={criterion.id}
                  >
                    {criterion.completed ? "✓" : "○"} {criterion.label}
                    {phase.phase === 0 &&
                    !criterion.completed &&
                    p0ApprovalGeneratedCriteria.has(criterion.id) ? (
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
                  {
                    hardGateCriteria.filter((criterion) => criterion.completed)
                      .length
                  }{" "}
                  of {hardGateCriteria.length || move.gateCriteria.length} hard
                  met
                </strong>
              </summary>
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
  const capturedCount = rows.filter((row) => row.value).length;

  return (
    <section className="mxw-p0-brief-review" aria-label="Captured P0 brief">
      <header>
        <div>
          <span>P0 brief captured</span>
          <h2>Review your seven Originate answers</h2>
          <p>
            These are the answers saved from Start a Move. Gate criteria below
            are a separate governance checklist.
          </p>
        </div>
        <strong>{capturedCount} of 7</strong>
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
  nextPhaseLabel,
  phase,
  terminalComplete,
}: {
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
  move: StrategicMove;
  nextPhaseLabel: string;
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
              : "Use this as the phase briefing. The step tabs above are the workflow: prepare, upload or decide, review, then approve and build."}
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
            below before uploading files or approving anything.
          </p>
          <b>Prepare</b>
        </div>
        <div>
          <span>Done when</span>
          <p>
            The team knows exactly which outputs to upload, which gaps can
            carry, and what Approve & Build will generate.
          </p>
          <b>Ready for next tab</b>
        </div>
        <div>
          <span>Live state</span>
          <p>
            {missingEvidenceCount} missing or partial evidence item
            {missingEvidenceCount === 1 ? "" : "s"} · {openHardGateCount} hard
            gate{openHardGateCount === 1 ? "" : "s"} open.
          </p>
          <b>{nextPhaseLabel}</b>
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
            <li>Next phase: {nextPhaseLabel}</li>
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
          "Highest readiness burden and sponsor commitment required.",
      },
    ],
    [],
  );
  const [title, setTitle] = useState(
    `${moveName} P${phase} key design decision`,
  );
  const [ownerRole, setOwnerRole] = useState("Move sponsor");
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
              className="mxw-btn mxw-primary"
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
  heading,
  onOpenFiles,
  moveId,
  phase,
  title,
}: {
  buttonLabel: string;
  heading: string;
  onOpenFiles?: () => void;
  moveId: string;
  phase: number;
  title: string;
}) {
  return (
    <section className="mxw-action-panel" aria-label={heading}>
      <div>
        <span>Action required</span>
        <h2>{heading}</h2>
        <p>
          Upload the working-session files here. Then continue to Gate approval,
          where AbarVa runs the governed phase build and advances only from the
          approved record.
        </p>
      </div>
      <EvidenceUploadControl
        buttonLabel={buttonLabel}
        moveId={moveId}
        onOpenFiles={onOpenFiles}
        phase={phase}
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

function normalizeUploadName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function inferCurrentStateFamilies(
  fileName: string,
  instruments: CurrentStateInstrument[],
): CurrentStateInstrument[] {
  const normalized = normalizeUploadName(fileName);
  const semanticMatches = instruments.filter((instrument) => {
    const family = normalizeUploadName(
      `${instrument.key} ${instrument.label} ${instrument.documentFamily ?? ""}`,
    );
    if (
      /\bsla\b|\bservice level\b/.test(family) &&
      /\bsla\b|\bservice level\b|\bbaseline\b|\btarget\b|\bvendor handler\b/.test(
        normalized,
      )
    ) {
      return true;
    }
    if (
      /\bvendor\b.*\bspend\b|\bspend\b.*\bvendor\b|\bcost\b/.test(family) &&
      /\bvendor\b|\bspend\b|\bcost\b|\bexpense\b|\bcompensation\b|\bexpedite\b/.test(
        normalized,
      )
    ) {
      return true;
    }
    if (
      /\bincumbent\b|\bperformance\b/.test(family) &&
      /\bincumbent\b|\bperformance\b|\bcase\b|\bscan\b|\bevent\b|\bcontact\b|\bqueue\b|\bmetric\b/.test(
        normalized,
      )
    ) {
      return true;
    }
    const familyTokens = family
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 4 &&
          !/^(current|state|evidence|family|baseline)$/.test(token),
      );
    return familyTokens.some((token) => normalized.includes(token));
  });
  if (semanticMatches.length > 0) return semanticMatches;

  const candidateKeys = new Set<string>();

  if (
    /\b(workshop|process|handoff|workflow|current state|sop|walkthrough)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("commercial_lending_process_map");
  }
  if (
    /\b(metric|metrics|baseline|kpi|cycle|volume|queue|aging|onboarding)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("commercial_lending_metrics_baseline");
  }
  if (/\b(kyc|defect|exception|audit|document)\b/.test(normalized)) {
    candidateKeys.add("kyc_document_defect_log");
  }
  if (
    /\b(system|systems|application|apps|data|inventory|integration|architecture|core|crm|los)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("lending_systems_data_landscape");
  }
  if (
    /\b(policy|knowledge|checklist|covenant|content|procedure|guidance)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("credit_policy_knowledge_inventory");
  }
  if (
    /\b(control|controls|approval|authority|risk|compliance|guardrail|privacy)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("banking_controls_human_approval");
  }
  if (
    /\b(org|organization|stakeholder|change|training|adoption|readiness|role|owner)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("lending_org_change_readiness");
  }
  if (
    /\b(delivery|estimate|estimation|implementation|capacity|release|sdlc|itsm|roadmap)\b/.test(
      normalized,
    )
  ) {
    candidateKeys.add("solution_delivery_estimation_context");
  }

  const directMatches = instruments.filter((instrument) =>
    candidateKeys.has(instrument.key),
  );
  if (directMatches.length > 0) return directMatches;

  const firstMissingHard = instruments.find(
    (instrument) =>
      instrument.documentFamily &&
      instrument.severity === "hard" &&
      instrument.status !== "committed",
  );
  if (firstMissingHard) return [firstMissingHard];

  const firstMissing = instruments.find(
    (instrument) =>
      instrument.documentFamily && instrument.status !== "committed",
  );
  return firstMissing ? [firstMissing] : [];
}

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
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<FamilyUploadResult[]>([]);
  const documentFamilies = readiness.instruments.filter(
    (instrument) => instrument.documentFamily,
  );
  const openFamilies = documentFamilies.filter(
    (instrument) => instrument.status !== "committed",
  );
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
    return {
      familyKey: instrument.key,
      familyLabel: instrument.label,
      fileName: file.name,
      status: "uploaded",
      detail:
        payload.reviewState === "committed"
          ? "Committed to readiness"
          : "Uploaded for review",
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
        const mappedFamilies = inferCurrentStateFamilies(
          file.name,
          openFamilies,
        );
        if (mappedFamilies.length === 0) {
          nextResults.push({
            familyKey: "unmapped",
            familyLabel: "No open current-state family",
            fileName: file.name,
            status: "error",
            detail:
              "No open document evidence family was available for this file.",
          });
          continue;
        }
        setMessage(
          `Uploading ${file.name} to ${mappedFamilies
            .map((family) => family.label)
            .join(", ")}...`,
        );
        for (const family of mappedFamilies) {
          nextResults.push(await uploadFileForFamily(file, family));
        }
      }
      setResults(nextResults);
      const succeeded = nextResults.filter(
        (row) => row.status === "uploaded",
      ).length;
      const failed = nextResults.length - succeeded;
      setMessage(
        `${succeeded} mapped upload${succeeded === 1 ? "" : "s"} created${failed ? `; ${failed} failed` : ""}. Review-required items must still be accepted before they become gate-ready.`,
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
        {documentFamilies.map((instrument) => (
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
  moveId,
  onOpenFiles,
  phase,
  title,
}: {
  buttonLabel: string;
  moveId: string;
  onOpenFiles?: () => void;
  phase: number;
  title: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<UploadWorkStatus>("idle");
  const [message, setMessage] = useState("");
  const [phaseArtifacts, setPhaseArtifacts] = useState<PhaseEvidenceArtifact[]>(
    [],
  );

  const loadPhaseArtifacts = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/programs/${moveId}/artifacts?family=uploaded_evidence`,
        {
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json().catch(() => ({}))) as {
        artifacts?: PhaseEvidenceArtifact[];
      };
      const rows = Array.isArray(payload.artifacts) ? payload.artifacts : [];
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
    form.append("family", "uploaded_evidence");
    form.append("title", uploadTitle);
    const res = await fetch(`/api/v1/programs/${moveId}/artifacts/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      detail?: string;
      error?: string;
    };
    if (!res.ok || !payload.ok) {
      throw new Error(
        payload.detail || payload.error || `Upload failed (HTTP ${res.status})`,
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
      setMessage(
        selectedFiles.length === 1
          ? `Uploaded ${selectedFiles[0]?.name ?? "file"}`
          : `Uploaded ${selectedFiles.length} files`,
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
        <input
          aria-label={buttonLabel}
          className="mxw-hidden-file"
          multiple
          onChange={(event) => void upload(event.currentTarget.files)}
          ref={inputRef}
          type="file"
        />
        <button
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
                v{artifact.version} · {artifactStatusLabel(artifact.status)}
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
}: {
  apiPath: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "parsed" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [preview, setPreview] =
    useState<StageReadinessWorkbookParsePreview | null>(null);
  const [selectedProposalIds, setSelectedProposalIds] = useState<Set<string>>(
    () => new Set(),
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
      const proposalIds =
        payload.proposalSet?.proposals
          ?.map((proposal) => proposal.proposalId)
          .filter((proposalId): proposalId is string => Boolean(proposalId)) ??
        [];
      setSelectedProposalIds(new Set(proposalIds));
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
    const proposalSet = preview?.proposalSet;
    const artifactId = proposalSet?.artifactId;
    const selectedIds = Array.from(selectedProposalIds);
    if (!artifactId || selectedIds.length === 0) return;
    setReviewStatus("saving");
    setReviewMessage(
      disposition === "accepted"
        ? "Accepting selected responses..."
        : disposition === "needs_validation"
          ? "Marking selected responses for validation..."
          : "Rejecting selected responses...",
    );
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proposalSetArtifactId: artifactId,
          proposalSetArtifactVersion: proposalSet.artifactVersion,
          decisions: selectedIds.map((proposalId) => ({
            proposalId,
            disposition,
          })),
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
      setReviewStatus("saved");
      setReviewMessage(
        `Review saved · ${review.acceptedCount ?? 0} accepted · ${review.needsValidationCount ?? 0} needs validation · ${review.rejectedCount ?? 0} rejected`,
      );
      if (review.readiness) {
        setMessage(
          `${message} · readiness ${review.readiness.ready ?? 0} ready / ${review.readiness.insufficientEvidence ?? 0} insufficient / ${review.readiness.unknown ?? 0} unknown`,
        );
      }
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
      {message ? (
        <span className={`mxw-workbook-preview-status ${status}`}>
          {message}
          {required ? <em>{required}</em> : null}
          {firstIssue ? <small>{firstIssue}</small> : null}
        </span>
      ) : null}
      {preview?.proposalSet?.artifactId &&
      preview.proposalSet.proposals?.length ? (
        <div className="mxw-workbook-review">
          <div className="mxw-workbook-review-summary">
            <strong>Workbook responses awaiting review</strong>
            <span>
              {selectedProposalIds.size}/{preview.proposalSet.proposals.length}{" "}
              selected · upload is not acceptance
            </span>
          </div>
          <div className="mxw-workbook-review-list">
            {preview.proposalSet.proposals.slice(0, 6).map((proposal) => {
              const proposalId = proposal.proposalId ?? "";
              return (
                <label key={proposalId || proposal.questionId}>
                  <input
                    checked={selectedProposalIds.has(proposalId)}
                    disabled={!proposalId || reviewStatus === "saving"}
                    onChange={(event) => {
                      setSelectedProposalIds((current) => {
                        const next = new Set(current);
                        if (event.currentTarget.checked) {
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
                      {proposal.answerState ?? "answered"}
                    </em>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="mxw-workbook-review-actions">
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
          </div>
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

function PhaseCaptureEditor({
  compact = false,
  completeCount,
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
            These are the fields the gate saves and approves. Edit them here
            before running Approve &amp; Build.
          </p>
        </div>
        <strong>
          {completeCount} / {sections.length}
        </strong>
      </header>
      <div className="mxw-capture-grid">
        {sections.map((section, index) => {
          const value = values[section.key] ?? "";
          const status = phaseCaptureStatusForSection(
            section,
            values,
            persistedValues,
            saveStatus,
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
              <textarea
                aria-label={section.label}
                onChange={(event) => onChange(section.key, event.target.value)}
                placeholder={section.description}
                rows={compact ? 2 : 3}
                value={value}
              />
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

  return (
    <div className="mxw-option-summary">
      <div>
        <span>Source</span>
        <strong>P2 design inputs pack</strong>
        <small>
          {optionSet.evidenceBasis.length} evidence signal
          {optionSet.evidenceBasis.length === 1 ? "" : "s"}
        </small>
      </div>
      <div>
        <span>Recommendation</span>
        <strong>
          {recommendation ? recommendation.label : "Provisional only"}
        </strong>
        <small>
          {recommendation
            ? `${recommendation.confidence} confidence - human decision still required`
            : "More evidence needed before a recommendation is safe"}
        </small>
      </div>
      <div>
        <span>Open gaps</span>
        <strong>{optionSet.missingEvidence.length}</strong>
        <small>
          {optionSet.missingEvidence[0] ?? "No required gap listed"}
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
.mxw-surface{display:grid;grid-template-columns:248px minmax(0,1fr);min-height:calc(100% - 44px)}
.mxw-side{border-right:1px solid var(--line);background:#faf9f7;padding:20px 16px 28px;position:sticky;top:44px;height:calc(100vh - 108px);overflow-y:auto;display:flex;flex-direction:column}
.mxw-move{padding:0 8px 15px;border-bottom:1px solid var(--line);margin-bottom:14px}
.mxw-back{font-size:12px;color:var(--muted);display:inline-flex;margin-bottom:12px}
.mxw-back:hover{color:var(--ink)}
.mxw-move h2{font-family:Fraunces, Georgia, serif;font-size:16px;font-weight:650;letter-spacing:-.3px;line-height:1.18;margin:0;color:var(--ink)}
.mxw-move p{font-size:11.5px;color:var(--muted);margin:4px 0 0;line-height:1.4}
.mxw-side-label{font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:var(--faint);font-weight:600;padding:0 8px;margin-bottom:6px}
.mxw-phase-list{display:flex;flex-direction:column}
.mxw-phase-row{display:flex;flex-direction:column}
.mxw-phase{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:8px;text-align:left;background:none;border:0;width:100%;position:relative;color:inherit;cursor:pointer}
.mxw-phase:hover{background:rgba(20,20,19,.04)}
.mxw-phase.viewing{background:var(--card);box-shadow:0 1px 2px rgba(20,20,19,.05)}
.mxw-phase.viewing:before{content:"";position:absolute;left:-16px;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--blue)}
.mxw-phase-dot{width:20px;height:20px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:9px;font-weight:700}
.mxw-phase.done .mxw-phase-dot{background:var(--ink);color:#fff}
.mxw-phase.current .mxw-phase-dot{background:var(--blue);color:#fff}
.mxw-phase.up .mxw-phase-dot{background:var(--card);border:1.5px solid var(--line-2);color:var(--faint)}
.mxw-phase-name{font-size:13px;font-weight:500;color:var(--ink-2);flex:1;line-height:1.3}
.mxw-phase.current .mxw-phase-name{font-weight:600;color:var(--ink)}
.mxw-phase.up .mxw-phase-name{color:var(--muted)}
.mxw-phase-state{font-size:10.5px;color:var(--faint);font-weight:500}
.mxw-phase.current .mxw-phase-state{color:var(--blue);font-weight:600}
.mxw-phase.done .mxw-phase-state{color:var(--green)}
.mxw-connector{width:1.5px;height:7px;background:var(--line-2);margin-left:18px}
.mxw-rail-extra{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
.mxw-workspace-label{margin-top:14px}
.mxw-lib-link{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;color:var(--ink-2);font-size:13px;font-weight:500;background:none;border:0;width:100%;text-align:left;cursor:pointer}
.mxw-lib-link:hover{background:rgba(20,20,19,.04)}
.mxw-lib-link.viewing{background:var(--card);box-shadow:0 1px 2px rgba(20,20,19,.05)}
.mxw-lib-link span{width:22px;height:22px;border-radius:6px;background:var(--card);border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted)}
.mxw-foot{margin-top:auto;padding:14px 8px 0;border-top:1px solid var(--line);font-size:11.5px;color:var(--faint);line-height:1.6}
.mxw-foot b{color:var(--muted);font-weight:600}
.mxw-shell{width:100%;max-width:none;margin:0;padding:24px clamp(24px,2.6vw,44px) 60px}
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
.mxw-workbook-review-list{display:grid;gap:6px}
.mxw-workbook-review-list label{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--ink-2)}
.mxw-workbook-review-list input{margin-top:3px}
.mxw-workbook-review-list b{display:block;font-size:12px;color:var(--ink);font-weight:750}
.mxw-workbook-review-list em{display:block;font-style:normal;font-size:11px;color:var(--muted);font-weight:700;text-transform:capitalize}
.mxw-workbook-review-actions{display:flex;gap:7px;flex-wrap:wrap}
.mxw-workbook-review-actions button{border:1px solid rgba(0,87,184,.2);background:#fff;color:var(--blue);border-radius:8px;padding:7px 10px;font-size:12px;font-weight:800;cursor:pointer}
.mxw-workbook-review-actions button:first-child{background:var(--blue);color:#fff;border-color:var(--blue)}
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
.mxw-progress{display:flex;align-items:center;gap:14px;flex:1}
.mxw-track{flex:1;height:6px;border-radius:3px;background:rgba(20,20,19,.07);overflow:hidden;max-width:260px}
.mxw-track span{display:block;height:100%;background:var(--green);border-radius:3px;transition:width .35s ease}
.mxw-step-label{font-size:13px;color:var(--muted);font-weight:500;white-space:nowrap}
.mxw-step-label b{color:var(--ink);font-weight:600}
.mxw-btn{padding:10px 18px;border-radius:9px;font-size:14px;font-weight:600;border:1px solid transparent;cursor:pointer}
.mxw-primary{background:var(--ink);color:#fff}
.mxw-primary:hover{background:#000}
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
.mxw-action-panel span{display:block;font-size:10px;letter-spacing:.9px;text-transform:uppercase;color:var(--green);font-weight:900;margin-bottom:4px}
.mxw-action-panel h2{font-family:Georgia,serif;font-size:20px;font-weight:700;letter-spacing:-.35px;line-height:1.15;margin:0;color:var(--ink)}
.mxw-action-panel p{font-size:13px;color:var(--ink-2);line-height:1.45;margin:5px 0 0;max-width:72ch}
.mxw-family-upload{border:1px solid rgba(29,143,104,.28);border-radius:14px;background:linear-gradient(180deg,var(--green-tint),var(--card) 68%);box-shadow:var(--shadow);padding:18px;display:grid;gap:14px}
.mxw-family-upload>header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;border-bottom:1px solid rgba(29,143,104,.18);padding-bottom:13px}
.mxw-family-upload>header span{display:block;font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:var(--green);font-weight:900;margin-bottom:4px}
.mxw-family-upload>header h2{font-family:Georgia,serif;font-size:21px;font-weight:700;letter-spacing:-.35px;line-height:1.15;margin:0;color:var(--ink)}
.mxw-family-upload>header p{font-size:13px;color:var(--ink-2);line-height:1.45;margin:5px 0 0;max-width:74ch}
.mxw-family-upload-strip{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
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
.mxw-upload-control{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.mxw-hidden-file{position:absolute;inline-size:1px;block-size:1px;opacity:0;pointer-events:none}
.mxw-upload-control button{padding:10px 16px;border-radius:9px;background:var(--ink);color:#fff;border:0;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}
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
.mxw-decision-surface{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin:16px 0 14px;align-items:stretch}
.mxw-decision-surface article{border:1px solid var(--line);border-radius:12px;background:var(--soft);padding:14px 16px;min-width:0}
.mxw-decision-surface.blocked{border-left:3px solid var(--amber);padding-left:12px}
.mxw-decision-surface.ready{border-left:3px solid var(--green);padding-left:12px}
.mxw-decision-surface.complete{border-left:3px solid var(--blue);padding-left:12px}
.mxw-decision-primary{background:linear-gradient(180deg,#fff,var(--soft) 90%)!important}
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
.mxw-role-approvals-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:#fff}
.mxw-role-approvals-row{display:flex;flex-direction:column;gap:5px}
.mxw-role-approvals-title{font-size:12px;font-weight:800;color:var(--ink)}
.mxw-role-approvals-pills{display:flex;flex-wrap:wrap;gap:6px}
.mxw-role-pill{display:inline-flex;align-items:center;font-size:10.5px;font-weight:700;letter-spacing:.02em;padding:3px 8px;border-radius:999px;white-space:nowrap}
.mxw-role-pill-pending{border:1px solid var(--line-2);background:var(--soft);color:var(--muted)}
.mxw-role-pill-reviewed{border:1px solid rgba(176,115,15,.32);background:var(--amber-tint);color:var(--amber)}
.mxw-role-pill-approved{border:1px solid rgba(29,143,104,.35);background:var(--green-tint);color:var(--green)}
.mxw-role-pill-rejected{border:1px solid rgba(200,60,60,.35);background:rgba(200,60,60,.08);color:#B4513C}
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
.mxw-ava-fab{position:fixed;right:24px;bottom:24px;z-index:70;display:flex;align-items:center;gap:9px;background:var(--ink);color:#fff;border:0;border-radius:999px;padding:11px 16px 11px 12px;box-shadow:0 6px 20px rgba(20,20,19,.22);cursor:pointer}
.mxw-ava-pop{position:fixed;right:24px;bottom:78px;z-index:71;width:348px;max-width:calc(100vw - 48px);background:var(--card);border:1px solid var(--line-2);border-radius:16px;box-shadow:0 16px 44px rgba(20,20,19,.2);overflow:hidden;display:none}
.mxw-ava-pop.open{display:block}
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
@media (max-width:980px){.mxw-lanes,.mxw-value-grid,.mxw-exec-readout,.mxw-decision-surface,.mxw-decision-detail-grid,.mxw-intel-grid{grid-template-columns:1fr}.mxw-decision-details summary{grid-template-columns:1fr}}
@media (max-width:900px){
  .mxw-mobile-rail{position:sticky;top:44px;z-index:55;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(12,26,58,.10);background:#fff;padding:10px 14px;box-shadow:0 6px 14px rgba(12,26,58,.06)}
  .mxw-surface{grid-template-columns:1fr}
  .mxw-side{display:none}
  .mxw-shell{width:100%;max-width:none}
  .mxw-shell{padding:30px 18px 80px}
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
.mxw-finder-on .mxw-phase-name{color:#0c1a3a}
.mxw-finder-on .mxw-phase.up .mxw-phase-name{color:#0c1a3a}
.mxw-finder-on .mxw-phase.viewing{background:#e4ecf9}
.mxw-finder-on .mxw-phase.viewing:before{content:none}
.mxw-finder-on .mxw-surface-tabs button.active::before{content:"";position:absolute;left:12px;right:12px;bottom:-1px;height:2px;border-radius:999px;background:#2a5aa8}
/*
 * Rail collapse/expand. Width/padding reuse the reference collapsed-state
 * values from MovePhaseExplorer.module.css's .finderShellCollapsed
 * (58px / 6px) and .finderCollapseToggle (22x22).
 */
.mxw-surface-rail-collapsed{grid-template-columns:58px minmax(0,1fr)}
.mxw-side-collapsed{padding:20px 6px 28px;align-items:center}
.mxw-rail-toggle{display:flex;align-items:center;justify-content:center;width:22px;height:22px;margin:0 0 10px auto;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--muted);font-size:11px;cursor:pointer}
.mxw-rail-toggle:hover{border-color:var(--blue);color:var(--blue)}
.mxw-side-collapsed .mxw-rail-toggle{margin:0 0 10px}
.mxw-side-collapsed .mxw-phase-list{align-items:center}
.mxw-side-collapsed .mxw-phase-row{align-items:center}
.mxw-side-collapsed .mxw-phase{justify-content:center;padding:7px;width:auto}
.mxw-side-collapsed .mxw-connector{display:none}
.mxw-side-collapsed .mxw-rail-extra{width:100%;display:flex;flex-direction:column;align-items:center}
.mxw-side-collapsed .mxw-lib-link{justify-content:center;padding:8px;width:auto}
/*
 * Steps two-column view. Same token set as the finder-shell polish rules above
 * (navy/blue/teal/amber); no new colors introduced.
 */
.mxw-finder-steps{display:flex;gap:24px;align-items:flex-start}
.mxw-finder-steps-menu{width:280px;flex:0 0 280px;display:flex;flex-direction:column;gap:18px}
.mxw-finder-step-group h3{margin:0 0 8px;font-size:11px;letter-spacing:.7px;text-transform:uppercase;color:#5b6c8a;font-weight:800}
.mxw-finder-step-group ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.mxw-finder-step-row{width:100%;display:flex;align-items:center;gap:8px;flex-wrap:wrap;text-align:left;background:none;border:none;border-radius:8px;padding:7px 8px;cursor:pointer;font-size:13px;color:#28364f}
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
.mxw-finder-comingup{border-top:1px solid rgba(12,26,58,.10);padding-top:12px}
.mxw-finder-comingup-toggle{width:100%;text-align:left;background:none;border:none;padding:0;font-size:12px;font-weight:700;color:#0c1a3a;cursor:pointer}
.mxw-finder-comingup-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.mxw-finder-chip{font-size:11px;border-radius:999px;padding:4px 10px;background:#e4ecf9;color:#2a5aa8}
.mxw-finder-chip.req{background:#fbf1df;color:#ba7517}
.mxw-finder-comingup-empty{margin-top:10px;font-size:12px;color:#5b6c8a}
.mxw-finder-detail{flex:1;min-width:0;scroll-margin-top:96px}
.mxw-finder-detail-panel header h2{margin:0 0 4px;font-family:Fraunces,Georgia,serif;color:#0c1a3a}
.mxw-finder-detail-panel header p{margin:0 0 14px;color:#5b6c8a;font-size:13px}
.mxw-finder-detail-input{width:100%;border:1px solid rgba(12,26,58,.16);border-radius:10px;padding:12px;font-size:13.5px;color:#28364f;font-family:inherit}
.mxw-finder-facts-table{width:100%;border-collapse:collapse}
.mxw-finder-facts-table th{text-align:left;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#5b6c8a;padding:6px 10px;border-bottom:1px solid rgba(12,26,58,.14)}
.mxw-finder-facts-table td{padding:8px 10px;border-bottom:1px solid rgba(12,26,58,.08);font-size:13px;color:#28364f;vertical-align:top}
.mxw-finder-fact-value{margin-right:6px}
.mxw-finder-citation-toggle{border:none;background:#e4ecf9;color:#2a5aa8;border-radius:999px;width:20px;height:20px;line-height:20px;font-size:11px;cursor:pointer;padding:0}
.mxw-finder-citation-caption{display:block;margin-top:4px;font-size:11.5px;color:#5b6c8a}
.mxw-contract-card{display:grid;grid-template-columns:272px minmax(0,1fr);min-height:458px;border:1px solid rgba(12,26,58,.12);border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 12px 32px rgba(12,26,58,.05)}
.mxw-contract-nav{border-right:1px solid rgba(12,26,58,.09);background:#fbfbfc;padding:24px 12px 16px;display:flex;flex-direction:column;gap:16px}
.mxw-contract-group{display:grid;gap:5px}
.mxw-contract-group-label{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#a7adb8;padding:0 8px 5px}
.mxw-contract-step{appearance:none;border:1px solid transparent;border-radius:8px;background:transparent;color:#7b8aa5;cursor:pointer;display:grid;grid-template-columns:20px minmax(0,1fr);align-items:center;gap:10px;min-height:34px;padding:7px 8px;text-align:left;width:100%}
.mxw-contract-step:hover{background:rgba(42,90,168,.06)}
.mxw-contract-step.active{border-color:rgba(42,90,168,.14);background:#fff;color:#0c1a3a;box-shadow:inset 3px 0 0 #2a5aa8}
.mxw-contract-step>span{width:18px;height:18px;border-radius:999px;border:1px solid rgba(12,26,58,.18);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}
.mxw-contract-step>span.done{border-color:#1d9e75;background:#1d9e75}
.mxw-contract-step strong{min-width:0;font-size:13px;font-weight:700;line-height:1.2;color:inherit}
.mxw-contract-comingup{border-top:1px solid rgba(12,26,58,.12);padding:16px 8px 2px}
.mxw-contract-comingup button{appearance:none;border:1px solid rgba(42,90,168,.14);border-radius:8px;background:#fff;color:#0c1a3a;cursor:pointer;font-size:12px;font-weight:850;line-height:1.35;padding:8px 10px;text-align:left;width:100%;box-shadow:0 1px 2px rgba(12,26,58,.04)}
.mxw-contract-comingup div{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.mxw-contract-comingup span{border:1px solid rgba(42,90,168,.14);border-radius:999px;background:#e4ecf9;color:#2a5aa8;font-size:10.5px;font-weight:800;line-height:1.2;padding:5px 8px}
.mxw-contract-comingup span.req{border-color:rgba(186,117,23,.18);background:#fbf1df;color:#8a5a12}
.mxw-contract-comingup p{color:#8b95a8;font-size:11.5px;line-height:1.35;margin:10px 0 0}
.mxw-contract-nav-foot{margin-top:4px;border-top:1px solid rgba(12,26,58,.14);padding:14px 8px 0;color:#8b95a8;font-size:11.5px;line-height:1.35}
.mxw-contract-detail{padding:28px 30px 24px;min-width:0;scroll-margin-top:96px}
.mxw-contract-detail-top{display:grid;grid-template-columns:22px auto minmax(0,auto) auto;align-items:center;gap:10px;margin-bottom:18px}
.mxw-contract-detail-top>span{width:18px;height:18px;border-radius:999px;border:1px solid rgba(12,26,58,.18);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}
.mxw-contract-detail-top>span.done{border-color:#1d9e75;background:#1d9e75}
.mxw-contract-detail-top small{color:#8b95a8;font-size:12px;font-weight:700;white-space:nowrap}
.mxw-contract-detail-top h2{margin:0;color:#0c1a3a;font-size:16px;font-weight:800;line-height:1.2;min-width:0}
.mxw-contract-detail-top b{border-radius:8px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9px;font-style:normal;font-weight:800;letter-spacing:.12em;padding:4px 7px;text-transform:uppercase}
.mxw-contract-detail-top b{background:rgba(12,26,58,.06);color:#8b95a8}
.mxw-contract-detail-top>span.done~b{background:rgba(29,158,117,.13);color:#147c5b}
.mxw-contract-form{display:grid;gap:13px}
.mxw-contract-form p{margin:0;color:#4d5d79;font-size:14px;line-height:1.5}
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
  .mxw-finder-steps{flex-direction:column}
  .mxw-finder-steps-menu{width:100%;flex-basis:auto}
  .mxw-contract-card{grid-template-columns:1fr}
  .mxw-contract-nav{border-right:0;border-bottom:1px solid rgba(12,26,58,.09)}
  .mxw-contract-detail-top{grid-template-columns:22px auto minmax(0,1fr)}
  .mxw-contract-detail-top b{justify-self:start}
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
.mxw-approvals-status.approved{background:#e1f5ec;color:#1f7a55}
.mxw-approvals-status.ready{background:#e4ecf9;color:#2a5aa8}
.mxw-approvals-status.pending{background:#fbf1df;color:#ba7517}
.mxw-approvals-status.upcoming{background:rgba(12,26,58,.06);color:#5b6c8a}
.mxw-approvals-approver{font-size:13px;color:#5b6c8a}
.mxw-approvals-approver.unassigned{font-style:italic;color:#7b8798}
.mxw-approvals-action{justify-self:end}
.mxw-approvals-action button,.mxw-approvals-action a{border:0;background:none;color:#2a5aa8;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none}
.mxw-approvals-action button:hover,.mxw-approvals-action a:hover{text-decoration:underline}
.mxw-approvals-noaction{font-size:12.5px;color:#9aa4b5;font-weight:600}
      `}</style>
  );
}
