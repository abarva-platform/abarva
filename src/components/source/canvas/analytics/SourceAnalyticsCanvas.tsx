"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { AskAnythingBar } from "@/components/agent/AskAnythingBar";
import { AppShell } from "@/components/shell/AppShell";
import { EventRetirementControl } from "@/components/source/approval/EventRetirementControl";
import { AcceptClientFinalButton } from "@/components/source/canvas/workspace-tabs/AcceptClientFinalButton";
import { ContractOptimizationProfilePanel } from "@/components/source/canvas/contract-optimization/ContractOptimizationProfilePanel";
import { ResponsesStageView } from "@/components/source/canvas/responses/ResponsesStageView";
import { VendorBafoInstructionPackPanel } from "@/components/source/canvas/responses/VendorBafoInstructionPackPanel";
import { VendorChallengeLeveragePanel } from "@/components/source/canvas/responses/VendorChallengeLeveragePanel";
import { EvaluationBafoReadinessPanel } from "@/components/source/canvas/responses/EvaluationBafoReadinessPanel";
import { VendorEvaluationScorecardPanel } from "@/components/source/canvas/responses/VendorEvaluationScorecardPanel";
import { StageDecisionLensPanel } from "@/components/source/canvas/workspace-tabs/StageDecisionLensPanel";
import { SourceWorkflowFrame } from "@/components/source/SourceWorkflowFrame";
import { SourceAwardSowHandoffReadinessPanel } from "@/components/source/SourceAwardSowHandoffReadinessPanel";
import { buildSourceAwardSowHandoffReadiness } from "@/lib/source/award-sow-handoff-readiness";
import { applySourceApprovalPolicyToStageView } from "@/lib/source/approval-policy-stage-view";
import { criterionForSourceApprovalPolicy, sourceEvidenceAppliesToApprovalPolicy } from "@/lib/source/approval-policy";
import { evidenceMeetsRequirement, hasAuditedAbsence, hasRecordedSource, permitsAbsenceDeclaration, requiresRecordedSource } from "@/lib/source/evidence-authority";
import { evaluateStagePromotionReadiness, isArtifactGateReady, SOURCE_APPROVAL_REASON_MIN_LENGTH } from "@/lib/source/source-governance-enforcement";
import {
  buildSourceStage08AcceptanceSpine,
  type SourceStage08AcceptanceSpine,
} from "@/lib/source/stage08-acceptance-spine";
import type {
  SourceAwardSowArtifactInput,
  SourceAwardSowHandoffReadiness,
  SourceAwardSowStageInput,
} from "@/lib/source/award-sow-handoff-readiness-types";
import type { ContractOptimizationMveProfile } from "@/lib/source/contract-optimization";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";
import type {
  VendorBafoInstructionPack,
  VendorChallengeIntelligence,
  EvaluationBafoReadinessView,
  Stage07NegotiationBriefCandidate,
  VendorEvaluationDecisionView,
  VendorResponseParseReport,
  VendorResponseProfileSet,
} from "@/lib/source/proposal-intelligence";
import {
  buildSourceEventShellView,
  type SourceEventShellView,
  type SourceShellArtifactLike,
  type SourceShellEvidenceBasis,
  type SourceShellFileItem,
  type SourceShellStep,
  type SourceShellWorkspace,
} from "@/lib/source/source-event-shell-v2";
import {
  buildSourceArtifactStandardsCsv,
  type SourceArtifactLifecycleRow,
} from "@/lib/source/artifact-lifecycle-matrix";
import {
  listSourceArtifactOperations,
  type SourceArtifactOperation,
} from "@/lib/source/artifact-operations";
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import type { ApprovalLedgerRow } from "@/lib/source/approval-ledger-model";
import {
  SOURCE_STAGE_LABELS,
  normalizeSourceStageKey,
} from "@/lib/source/constants";
import {
  SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER,
  SOURCE_NEW_PHASE_DISPLAY_LABELS,
  sourceNewFilePhase,
  sourceNewPhaseState,
  type SourceNewExternalCheckpointKey,
  type SourceNewPhaseEvidence,
} from "@/lib/source/new-workspace/phase-state";
import {
  criteriaForStage,
  evidenceForStage,
  requiredEvidenceForStage,
  requiredSpecsForStage,
  type SourceEvidenceRequirement,
} from "@/lib/source/canonical-specs";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventEvidenceCurrentState,
  SourceEventGateCriterion,
  SourceEventGateCriterionState,
} from "@/lib/source/canvas-substrate";
import {
  deriveSourceEvidenceLifecycle,
  type SourceEvidenceLifecycleResult,
} from "@/lib/source/evidence-lifecycle";
import {
  assessStageGate,
  buildStageRecommendation,
} from "@/lib/source/gate-auto-assessment";
import { computeStageRequirementCoverage } from "@/lib/source/requirement-coverage";
import {
  buildGovernedStageEvidenceReadinessBrief,
  type GovernedStageEvidenceReadinessBrief,
} from "@/lib/source/stage-evidence-readiness-brief";
import {
  resolveSimpleStageScreen,
  type SimpleStageScreenView,
} from "@/lib/source/simple-front";
import {
  adaptStageViewToSourceJourney,
  sourceJourneyLabelForStage,
  type SourceJourneyDefinition,
} from "@/lib/source/sourcing-motion-journeys";
import type {
  SourceArtifactStatus,
  SourceStageKey,
  SourcingEventSummary,
  WorkflowStage,
} from "@/lib/source/types";
import type { SourceStageGuidebookRecord } from "@/lib/source/stage-guidebooks/types";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";
import type {
  SourceArtifactFamily,
  SourceEmbeddingStatus,
  SourceParseStatus,
} from "@/lib/source/artifact-registry/types";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import { ArtifactAcceptancePanel } from "./ArtifactAcceptancePanel";
import { ANALYTICS } from "./analytics-tokens";
import { CommercialActiveCanvasStrip } from "./CommercialActiveCanvasStrip";
import { IntelPanel } from "./IntelPanel";
import {
  SponsorDelegationControl,
  SponsorReviewRequest,
  TaskProvideUpload,
  TemplateDownloadLink,
  type TaskProvideUploadReadback,
} from "./TaskChecklist";
import {
  evidenceRequirementIdForTask,
  factTemplateCodeForTask,
  requiredEvidenceRequirementIdsForTask,
} from "@/lib/source/facts/task-evidence-requirements";
import { templateFactMapByCode } from "@/lib/source/facts/template-fact-map";
import {
  hydrateTaskEvidenceState,
} from "@/lib/source/facts/view/task-evidence-hydration";
import { ValueWaterfall } from "./ValueWaterfall";
import { StepInsightPanel } from "./insights";
import {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_RESPONSES_STAGE,
  SAMPLE_EVALUATION_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_BAFO_STAGE,
  SAMPLE_EXECUTIVE_DECISION_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_TRANSITION_STAGE,
  SAMPLE_VALUE_STAGE,
} from "./sample-view-model";
import { SAMPLE_STRATEGY_STAGE } from "./strategy-sample-view-model";
import type {
  AvaLauncherView,
  StageAnalyticsView,
  StageGateActionView,
  StepInsightView,
  VendorCoverageView,
} from "./view-model";

type SessionEvidenceFamily = Extract<
  SourceArtifactFamily,
  "meeting_notes" | "workshop_output"
>;

type SessionEvidenceLane = {
  family: SessionEvidenceFamily;
  kind: "source_session_notes" | "source_workshop_output";
  title: string;
  detail: string;
  evidenceUse: string;
};

type SessionEvidenceUploadState =
  | { phase: "idle" }
  | { phase: "uploading"; fileName: string }
  | {
      phase: "uploaded";
      fileName: string;
      parseStatus: string | null;
      substrateSummary: string;
    }
  | { phase: "error"; message: string };

const SESSION_EVIDENCE_LANES: readonly SessionEvidenceLane[] = [
  {
    family: "meeting_notes",
    kind: "source_session_notes",
    title: "Meeting notes",
    detail:
      "Vendor calls, evaluation meetings, sponsor reviews, and follow-ups.",
    evidenceUse:
      "Low-authority context until a human promotes decisions or actions.",
  },
  {
    family: "workshop_output",
    kind: "source_workshop_output",
    title: "Workshop output",
    detail:
      "Facilitated sessions, risk reviews, scope workshops, and action logs.",
    evidenceUse:
      "Parsed into outcomes when text is available; unresolved items stay open.",
  },
] as const;

interface SourceAnalyticsCanvasProps {
  event: SourcingEventSummary;
  canRetireEvent?: boolean;
  /**
   * U-520 — pass-through to `VendorResponseDecisionProofPanel`, the one
   * descendant of this canvas that prints an exact financial magnitude. The
   * canvas does not read it.
   *
   * Optional, and defaulted to `false` at the destructure below. The LEAF that
   * consumes it takes it as required, because that is where a silent caller
   * would become a granted reader. Here the safe default is available and the
   * cost of requiring it is not: this canvas is mounted at 78 call sites across
   * twelve suites that have nothing to do with financial entitlement, and a
   * mechanical prop added to all of them is the large-diff-nobody-reads shape
   * this backlog exists against.
   *
   * `false` is the fail-CLOSED direction, and the distinction matters: U-508's
   * defect was eight components defaulting to `true`, and its record notes that
   * the one reader already defaulting to `false` "has no fail-open default to
   * remove". A route that forgets this prop restricts, which a reader can see
   * and report; the opposite silently discloses.
   */
  canViewFinancialValues?: boolean;
  viewStage: SourceStageKey;
  tenantName: string;
  stageView?: StageAnalyticsView;
  /** A server-verified delegation receipt, never a raw fact or artifact payload. */
  verifiedFallbackSponsorAcknowledgement?: boolean;
  stepInsight?: StepInsightView;
  artifacts?: readonly SourceShellArtifactLike[];
  approvalItems?: readonly ApprovalsInboxItem[];
  approvalLedger?: readonly ApprovalLedgerRow[];
  /** Facilitator guidebook for the viewed stage; null when none has been authored yet. */
  guidebook?: SourceStageGuidebookRecord | null;
  /** Legacy prop retained for route compatibility; the duplicate launcher is no longer rendered. */
  avaLauncher?: AvaLauncherView;
  /** Latest "accept as authoritative" record per artifact (SOURCE-SHELL-004), plain array — a server->client prop must be JSON-serializable, so this is built into a Map only once it's in the client component. */
  latestArtifactAcceptances?: readonly ArtifactAcceptanceRecord[];
  /** Durable per-requirement evidence readiness rows already read by the route. */
  evidenceStates?: readonly SourceEventEvidence[];
  gateCriterionStates?: readonly SourceEventGateCriterion[];
  stageArtifactStates?: readonly SourceEventArtifactState[];
  /** Initial workspace selected by the route, e.g. from ?workspace=approvals. */
  initialWorkspace?: SourceShellWorkspace;
  /**
   * Persisted contract-optimization profile (findings, levers, recommended
   * path) for this exact event, if one exists — null for every event that
   * isn't a guarded contract-optimization event. Presence of this prop is
   * the render gate for ContractOptimizationProfilePanel, not a name/keyword
   * heuristic, so it can never appear on an unrelated event by mistake.
   */
  contractOptimizationProfile?: ContractOptimizationMveProfile | null;
  /** Event-specific journey: competitive RFP by default, contract optimization for incumbent-renegotiation work. */
  journey?: SourceJourneyDefinition;
  /** Server-built vendor response package readiness for the live Responses stage. */
  vendorResponseReadiness?: SourceVendorResponseCompleteness | null;
  /** Server-built proposal profile chain used by the live Responses cockpit. */
  vendorResponseProfiles?: VendorResponseProfileSet | null;
  vendorChallengeIntelligence?: VendorChallengeIntelligence | null;
  vendorBafoInstructionPack?: VendorBafoInstructionPack | null;
  vendorEvaluationDecisionView?: VendorEvaluationDecisionView | null;
  evaluationBafoReadinessView?: EvaluationBafoReadinessView | null;
  negotiationBriefCandidate?: Stage07NegotiationBriefCandidate | null;
  vendorResponseParseReports?: VendorResponseParseReport[];
  normalizedResponsePackages?: readonly NormalizedVendorResponsePackage[];
  /** Optional deterministic Stage 08 readiness override for tests or server-built callers. */
  awardSowHandoffReadiness?: SourceAwardSowHandoffReadiness | null;
}

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  fontFamily: ANALYTICS.SANS,
  color: ANALYTICS.INK,
  background: ANALYTICS.PAGE_BG,
};

const WORK_PANE_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
};

const CARD_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 10,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
};

const BUTTON_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: 8,
  background: ANALYTICS.CARD,
  color: ANALYTICS.INK,
  cursor: "pointer",
  fontFamily: ANALYTICS.SANS,
  fontSize: 12,
  fontWeight: 700,
};

const WORKSPACE_EYEBROW: CSSProperties = {
  color: ANALYTICS.BLUE,
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.05,
  textTransform: "uppercase",
};

const SMALL_STATUS_PILL: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE_SOFT}`,
  borderRadius: 999,
  background: ANALYTICS.SOFT,
  color: ANALYTICS.INK_2,
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  fontWeight: 900,
  padding: "6px 9px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const FILE_USE_TABLE: CSSProperties = {
  width: "100%",
  minWidth: 920,
  borderCollapse: "collapse",
};

const FILE_TH: CSSProperties = {
  borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
  padding: "8px 8px",
  color: ANALYTICS.MUTED,
  fontFamily: ANALYTICS.MONO,
  fontSize: 9.5,
  fontWeight: 900,
  letterSpacing: 0.8,
  textAlign: "center",
  textTransform: "uppercase",
};

const FILE_TD_LABEL: CSSProperties = {
  borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
  padding: "9px 8px",
  color: ANALYTICS.INK,
  display: "grid",
  gap: 3,
  minWidth: 240,
};

const FILE_TD_CENTER: CSSProperties = {
  borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
  padding: "9px 7px",
  textAlign: "center",
  verticalAlign: "top",
};

const FILE_TD_ACTION: CSSProperties = {
  borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
  padding: "9px 8px",
  color: ANALYTICS.INK,
  display: "grid",
  gap: 3,
  fontSize: 12.5,
  lineHeight: 1.38,
  minWidth: 260,
};

const TABLE_LINK_STYLE: CSSProperties = {
  color: ANALYTICS.BLUE,
  fontSize: 12,
  fontWeight: 800,
  textDecoration: "none",
};

const TABLE_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_STYLE,
  background: ANALYTICS.INK,
  color: "#fff",
  padding: "8px 10px",
};

const FILE_CHIP: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  display: "inline-flex",
  justifyContent: "center",
  minWidth: 78,
  padding: "3px 7px",
  fontFamily: ANALYTICS.MONO,
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: 0.65,
  textTransform: "uppercase",
};

const FILE_CHIP_GOOD: CSSProperties = {
  borderColor: ANALYTICS.GREEN,
  background: ANALYTICS.GREEN_TINT,
  color: ANALYTICS.GREEN_TEXT,
};

const FILE_CHIP_WARN: CSSProperties = {
  borderColor: ANALYTICS.AMBER,
  background: "rgba(186,117,23,0.07)",
  color: ANALYTICS.AMBER,
};

const FILE_CHIP_NEUTRAL: CSSProperties = {
  borderColor: ANALYTICS.LINE_SOFT,
  background: ANALYTICS.SOFT,
  color: ANALYTICS.MUTED,
};

type ActiveStepNeedView = {
  item: string;
  requiredness: string;
  requirement: string;
  sourceSystem: string;
  owner: string;
  formats: string;
  grainHistory: string;
  template: string;
  parseTarget: string;
  artifactImpact: string;
  status: string;
  readback: string;
  tone: "good" | "warn";
  nextAction: string;
};

type WorkflowStepRequirement = {
  item: string;
  requiredness?: "Required" | "Optional";
  requirement: string;
  sourceSystem: string;
  ownerRole: string;
  acceptedFormats: string;
  grainHistory: string;
  templateLabel: string;
  parseTarget: string;
  artifactImpact: string;
  missingAction: string;
  uploadedAction?: string;
  completeAction?: string;
};

const STEP_REQUIREMENTS: Record<string, WorkflowStepRequirement> = {
  "strategy.confirm": {
    item: "Strategy and sponsor decision",
    requirement: "1 required confirmation",
    sourceSystem: "Intake record / sponsor note",
    ownerRole: "Accountable sponsor",
    acceptedFormats: "No upload required",
    grainHistory: "One sponsor-backed trigger per event",
    templateLabel: "Strategy intake fields",
    parseTarget: "Mandate, sponsor, value thesis",
    artifactImpact: "Strategy memo and Scope collection guide",
    missingAction: "Review the mandate and confirm the sponsor.",
  },
  "scope.volumetrics": {
    item: "Ticket-history file",
    requirement: "1 required file",
    sourceSystem: "ITSM ticket export",
    ownerRole: "ITSM owner",
    acceptedFormats: "CSV or XLSX",
    grainHistory: "By service tower, L2/L3 tier, month, and time window",
    templateLabel: "ITSM ticket history by tier and time window",
    parseTarget: "Ticket counts and SLA breach counts",
    artifactImpact: "Scope memo and service-volume baseline",
    missingAction:
      "Download the template, fill one row per tower, tier, month, and time window, then upload.",
  },
  "scope.app-inventory": {
    item: "Application inventory file",
    requirement: "1 required file",
    sourceSystem: "CMDB / finance export",
    ownerRole: "IT Ops / application owner",
    acceptedFormats: "CSV or XLSX",
    grainHistory: "One row per app/service in the current scope",
    templateLabel: "Application inventory template",
    parseTarget: "Apps, owners, run cost, retained-FTE cost",
    artifactImpact: "Scope boundaries, transition risk, RFP exhibits",
    missingAction: "Download the template, fill one row per app, then upload.",
  },
  "scope.prior-baseline": {
    item: "Prior commercial baseline",
    requirement: "Recorded prior baseline or audited absence",
    sourceSystem: "Prior contract or finance baseline",
    ownerRole: "Procurement and finance owners",
    acceptedFormats: "CSV, XLSX, PDF or DOCX",
    grainHistory: "Prior agreement, fiscal period or run-cost line",
    templateLabel: "Prior baseline template",
    parseTarget: "Contract and run-cost basis, if present",
    artifactImpact: "Scope economics and future pricing assumptions",
    missingAction: "Upload a recorded prior baseline or declare its absence with a reason.",
  },
  "scope.sponsor": {
    item: "Sponsor commitment",
    requirement: "Verified signer proof or delegated acknowledgement with provider-accepted sponsor notice",
    sourceSystem: "Scope readiness pack",
    ownerRole: "Executive sponsor",
    acceptedFormats: "PDF or DOCX",
    grainHistory: "One commitment bound to the current Scope memo",
    templateLabel: "Sponsor sign-off checklist",
    parseTarget: "Sponsor commitment evidence",
    artifactImpact: "Scope approval and governance record",
    missingAction: "Submit signed commitment evidence for verification or acknowledge as an authorized delegate and notify the sponsor.",
  },
  "rfp.clause-coverage": {
    item: "RFP clause coverage file",
    requirement: "1 required checklist",
    sourceSystem: "RFP draft / clause checklist",
    ownerRole: "Sourcing lead",
    acceptedFormats: "CSV or XLSX",
    grainHistory: "One row per value lever and RFP clause in current draft",
    templateLabel: "RFP clause coverage checklist",
    parseTarget: "Protected vs exposed value levers",
    artifactImpact: "RFP repair tasks and supplier response rules",
    missingAction: "Upload the clause checklist before issuing the RFP.",
  },
  "responses.coverage": {
    item: "Vendor response package",
    requirement: "1 required package per vendor",
    sourceSystem: "Vendor proposals / response matrix",
    ownerRole: "Sourcing lead",
    acceptedFormats: "PDF, DOCX, XLSX, or CSV",
    grainHistory: "One proposal package per vendor/version/response round",
    templateLabel: "Vendor response dossier intake",
    parseTarget: "Per-vendor answer coverage and missing responses",
    artifactImpact: "Proposal dossier, scorecard, pricing normalization",
    missingAction:
      "Upload each vendor proposal or the response matrix before scoring.",
  },
  "evaluation.vendor-bids": {
    item: "Vendor bid file",
    requirement: "1 required row per vendor",
    sourceSystem: "Vendor proposals / bid tabulation",
    ownerRole: "Evaluation lead",
    acceptedFormats: "CSV or XLSX",
    grainHistory: "One bid row per vendor, scenario, and evaluation round",
    templateLabel: "Evaluation bid table",
    parseTarget: "Headline bid, retained FTE delta, SLA credit cap",
    artifactImpact: "Scorecard, shortlist, finalist conditions",
    missingAction: "Upload the bid table before score normalization.",
  },
  "pricing.normalized-supplier-pricing": {
    item: "Normalized pricing package",
    requirement: "1 required workbook",
    sourceSystem: "Pricing submissions / normalization workbook",
    ownerRole: "Commercial lead",
    acceptedFormats: "XLSX or CSV",
    grainHistory: "Line-item cost by vendor, year, component, and scenario",
    templateLabel: "Normalized pricing workbook",
    parseTarget: "Comparable TCO, assumptions, escalators, exclusions",
    artifactImpact: "TCO comparison, trap log, BAFO price asks",
    missingAction: "Upload normalized pricing before BAFO asks are prepared.",
  },
  "bafo.concession-actuals": {
    item: "BAFO concession file",
    requirement: "1 required concession log",
    sourceSystem: "BAFO round / concession log",
    ownerRole: "Sourcing lead",
    acceptedFormats: "CSV or XLSX",
    grainHistory: "One row per concession, value lever, vendor, and round",
    templateLabel: "BAFO concession log",
    parseTarget: "Captured concession by value lever",
    artifactImpact: "Final ask tracker and executive decision brief",
    missingAction: "Upload BAFO actuals before the round closes.",
  },
  "executive-decision.recommendation-packet": {
    item: "Executive recommendation decision",
    requirement: "1 required decision review",
    sourceSystem: "Decision brief / risk register / value ledger",
    ownerRole: "Executive sponsor",
    acceptedFormats: "No upload required",
    grainHistory: "One reviewed decision packet for the current gate",
    templateLabel: "Executive decision checklist",
    parseTarget: "Recommendation, value case, risks, approval conditions",
    artifactImpact: "Approval record and selection conditions",
    missingAction: "Review the packet and confirm the decision conditions.",
  },
  "selection.committed-value": {
    item: "Award commitment file",
    requirement: "1 required award record",
    sourceSystem: "Executed contract / award record",
    ownerRole: "Sourcing lead",
    acceptedFormats: "CSV or XLSX",
    grainHistory: "One row per awarded value lever and committed baseline",
    templateLabel: "Award commitment template",
    parseTarget: "Committed value by lever",
    artifactImpact: "Award record, transition plan, value proof baseline",
    missingAction: "Upload award commitments before transition starts.",
  },
  "transition.go-live-readiness": {
    item: "Transition readiness packet",
    requirement: "1 required readiness packet",
    sourceSystem: "Transition tracker / go-live checklist",
    ownerRole: "Transition owner",
    acceptedFormats: "PDF, DOCX, XLSX, or CSV",
    grainHistory: "One row per workstream, milestone, risk, and exit criterion",
    templateLabel: "Transition readiness packet",
    parseTarget: "Milestones, blockers, cutover, rollback, handoff evidence",
    artifactImpact: "Transition readiness, obligation tracker, value start",
    missingAction: "Upload readiness evidence before value tracking starts.",
  },
  "value.realized-actuals": {
    item: "Realized value file",
    requirement: "1 required value snapshot",
    sourceSystem: "Run-cost / SLA-credit / productivity actuals",
    ownerRole: "Value realization lead",
    acceptedFormats: "CSV or XLSX",
    grainHistory: "Monthly actuals by value lever after go-live",
    templateLabel: "Realized value actuals template",
    parseTarget: "Realized value to date by committed lever",
    artifactImpact: "Value proof pack and Tower realization handoff",
    missingAction: "Upload realized actuals to prove value, not promise it.",
  },
};

const SELF_STRATEGY_REQUIREMENT: WorkflowStepRequirement = {
  item: "Event Owner strategy confirmation",
  requirement: "1 required confirmation",
  sourceSystem: "Sourcing intake record",
  ownerRole: "Event Owner or client admin",
  acceptedFormats: "No upload required",
  grainHistory: "One version-bound decision per event",
  templateLabel: "Strategy intake fields",
  parseTarget: "Mandate, decision owner, value thesis",
  artifactImpact: "Strategy memo and Scope collection guide",
  missingAction: "Review the mandate and value thesis, then confirm as Event Owner.",
};

function sampleStageViewFor(
  stageKey: SourceStageKey,
  journey?: SourceJourneyDefinition,
): StageAnalyticsView {
  const canonicalStageKey = normalizeSourceStageKey(stageKey) ?? stageKey;

  const sample = (() => {
    switch (canonicalStageKey) {
      case "strategy":
        return SAMPLE_STRATEGY_STAGE;
      case "scope":
        return SAMPLE_SCOPE_STAGE;
      case "rfp":
        return SAMPLE_RFP_STAGE;
      case "responses":
        return SAMPLE_RESPONSES_STAGE;
      case "evaluation":
        return SAMPLE_EVALUATION_STAGE;
      case "pricing":
        return SAMPLE_PRICING_STAGE;
      case "bafo":
        return SAMPLE_BAFO_STAGE;
      case "executive_decision":
        return SAMPLE_EXECUTIVE_DECISION_STAGE;
      case "selection":
        return SAMPLE_SELECTION_STAGE;
      case "transition":
        return SAMPLE_TRANSITION_STAGE;
      case "value":
        return SAMPLE_VALUE_STAGE;
      default:
        return placeholderStageViewFor(canonicalStageKey, journey);
    }
  })();
  return adaptStageViewToSourceJourney(sample, journey);
}

export function liveFallbackStageViewFor(
  stageKey: SourceStageKey,
  journey?: SourceJourneyDefinition,
): StageAnalyticsView {
  const exemplar = sampleStageViewFor(stageKey, journey);
  if (normalizeSourceStageKey(stageKey) !== "scope") return exemplar;

  return {
    ...exemplar,
    intel: {
      provenance: "sample",
      lead: "Scope analytics await governed event facts; review the evidence ledger for current coverage.",
      points: [],
    },
    tasks: exemplar.tasks
      .filter((task) => task.id !== "scope.apps")
      .map((task) => ({
        ...task,
        state: "todo" as const,
        subtitle:
          task.id === "scope.exclusions"
            ? "Exclusions and retained work"
            : task.subtitle,
        guide:
          task.id === "scope.exclusions"
            ? "Record excluded work, its owner, and the supporting current-scope evidence."
            : task.guide,
        rows: undefined,
        file: undefined,
        template: undefined,
        provenance: undefined,
      })),
  };
}

function placeholderStageViewFor(
  stageKey: string,
  journey?: SourceJourneyDefinition,
): StageAnalyticsView {
  const stageLabel = sourceJourneyLabelForStage(journey, stageKey);
  return {
    stageKey,
    stageName: stageLabel,
    purpose: `No illustrative preview has been built for ${stageLabel} yet. Live Source facts will render here when available; this placeholder is intentionally empty rather than showing another stage's work.`,
    intel: {
      provenance: "sample",
      lead: `No ${stageLabel} sample preview is available yet.`,
      points: [
        {
          tone: "muted",
          tag: "Not built",
          text: `A ${stageLabel} illustrative preview has not been authored yet. This prevents Scope content from appearing under the ${stageLabel} label.`,
        },
      ],
    },
    tasks: [],
    gate: {
      approver: "Stage owner",
      confirms: [],
      generates: [],
      nextStageName: null,
    },
  };
}

function isContractOptimizationJourney(view: SourceEventShellView): boolean {
  const labels = new Set(view.journey.map((stage) => stage.label));
  return (
    labels.has("Commercial Baseline") &&
    labels.has("Negotiation Plan") &&
    labels.has("Agreement")
  );
}

function SourceRailAdvisorNote({
  view,
}: {
  view: SourceEventShellView;
}): ReactNode {
  if (isContractOptimizationJourney(view)) {
    return (
      <>
        <b style={{ color: ANALYTICS.INK_2 }}>aVa</b> guides Strategy through
        Agreement · <b style={{ color: ANALYTICS.INK_2 }}>Atlas</b> carries
        Value proof.
      </>
    );
  }

  return (
    <>
      <b style={{ color: ANALYTICS.INK_2 }}>aVa</b> guides sourcing gates ·{" "}
      <b style={{ color: ANALYTICS.INK_2 }}>Atlas</b> supports transition and
      value proof.
    </>
  );
}

export function SourceAnalyticsCanvas({
  event,
  canRetireEvent = false,
  viewStage,
  tenantName,
  stageView,
  verifiedFallbackSponsorAcknowledgement = false,
  stepInsight,
  artifacts = [],
  approvalItems = [],
  approvalLedger = [],
  guidebook = null,
  latestArtifactAcceptances = [],
  evidenceStates = [],
  gateCriterionStates = [],
  stageArtifactStates = [],
  initialWorkspace,
  contractOptimizationProfile = null,
  journey,
  vendorResponseReadiness = null,
  vendorResponseProfiles = null,
  vendorChallengeIntelligence = null,
  vendorBafoInstructionPack = null,
  vendorEvaluationDecisionView = null,
  evaluationBafoReadinessView = null,
  negotiationBriefCandidate = null,
  vendorResponseParseReports = [],
  normalizedResponsePackages = [],
  awardSowHandoffReadiness = null,
  canViewFinancialValues = false,
}: SourceAnalyticsCanvasProps) {
  const router = useRouter();
  const resolvedInitialWorkspace = initialWorkspace ?? "steps";
  const [workspace, setWorkspace] = useState<SourceShellWorkspace>(
    resolvedInitialWorkspace,
  );
  const [avaOpen, setAvaOpen] = useState(false);

  useEffect(() => {
    setWorkspace(resolvedInitialWorkspace);
  }, [event.id, resolvedInitialWorkspace, viewStage]);

  const latestArtifactAcceptancesById = useMemo(
    () =>
      new Map(latestArtifactAcceptances.map((rec) => [rec.artifactId, rec])),
    [latestArtifactAcceptances],
  );

  const baseStageView = useMemo(
    () => {
      const journeyStageView = adaptStageViewToSourceJourney(
        stageView ?? liveFallbackStageViewFor(viewStage, journey),
        journey,
      );
      const hydratedStageView = stageView
        ? journeyStageView
        : {
            ...journeyStageView,
            tasks: hydrateTaskEvidenceState({
              tasks: journeyStageView.tasks,
              factInputs: {},
              evidenceStates,
              stageKey: journeyStageView.stageKey,
              verifiedDelegatedSponsorAcknowledgement: verifiedFallbackSponsorAcknowledgement,
            }),
          };
      return applySourceApprovalPolicyToStageView(
        hydratedStageView,
        event.approvalPolicyCode,
      );
    },
    [event.approvalPolicyCode, evidenceStates, verifiedFallbackSponsorAcknowledgement, journey, stageView, viewStage],
  );
  const resolvedStageView: StageAnalyticsView = useMemo(
    () => (stepInsight ? { ...baseStageView, stepInsight } : baseStageView),
    [baseStageView, stepInsight],
  );
  const gateCriteriaReady = useMemo(
    () => viewStage !== "strategy" || event.currentStageKey !== "strategy" || event.status !== "active" ||
      strategyGateReady(gateCriterionStates, stageArtifactStates, evidenceStates, event.approvalPolicyCode),
    [viewStage, event.currentStageKey, event.status, event.approvalPolicyCode, gateCriterionStates, stageArtifactStates, evidenceStates],
  );

  const shellView = useMemo(
    () =>
      buildSourceEventShellView({
        event,
        tenantName,
        viewedStageKey: viewStage,
        stageView: resolvedStageView,
        gateCriteriaReady,
        stepInsight,
        artifacts,
        approvalItems,
        approvalLedger,
        activeWorkspace: workspace,
        intelligenceOpen: workspace === "intelligence",
        guidebook,
        latestArtifactAcceptancesById,
        journey,
      }),
    [
      approvalItems,
      approvalLedger,
      artifacts,
      event,
      guidebook,
      latestArtifactAcceptancesById,
      journey,
      resolvedStageView,
      gateCriteriaReady,
      stepInsight,
      tenantName,
      viewStage,
      workspace,
    ],
  );
  const computedAwardSowHandoffReadiness = useMemo(
    () => buildAwardSowHandoffReadinessForCanvas(event, shellView),
    [event, shellView],
  );
  const computedStage08AcceptanceSpine = useMemo(
    () =>
      buildStage08AcceptanceSpineForCanvas(event, shellView, {
        profileSet: vendorResponseProfiles,
        challengeIntelligence: vendorChallengeIntelligence,
        bafoInstructionPack: vendorBafoInstructionPack,
        decisionView: vendorEvaluationDecisionView,
      }),
    [
      event,
      shellView,
      vendorBafoInstructionPack,
      vendorChallengeIntelligence,
      vendorEvaluationDecisionView,
      vendorResponseProfiles,
    ],
  );
  const resolvedAwardSowHandoffReadiness =
    awardSowHandoffReadiness ?? computedAwardSowHandoffReadiness;

  const stageLabel =
    sourceJourneyLabelForStage(journey, viewStage) ??
    resolvedStageView.stageName;

  return (
    <AppShell
      surface="source-detail"
      agentName="aVa"
      surfaceContext={{
        sourceEventId: event.id,
        sourceEventCode: event.code,
        viewStage,
        surfaceVariant: "source_analytics_v2",
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `${event.code} · ${event.name}`,
      }}
    >
      <main data-testid="source-analytics-canvas" style={MAIN_STYLE}>
        <div style={WORK_PANE_STYLE}>
          <SourceWorkflowFrame
            testId="source-workflow-frame"
            rail={
              <SourceShellRail
                view={shellView}
                journey={journey}
                workspace={workspace}
                onWorkspaceChange={setWorkspace}
              />
            }
            minHeight="100%"
            alignItems="stretch"
            paneStyle={{ padding: "28px 28px 150px" }}
          >
            {/* Above the workspace, not inside StageHeader: the header renders
                only on the "steps" pane, and off-stage work happens just as
                readily on files, approvals and intelligence. */}
            <OffStageNotice view={shellView} />
            {contractOptimizationProfile ? (
              <div style={{ marginBottom: 28 }}>
                <ContractOptimizationProfilePanel
                  profile={contractOptimizationProfile}
                />
              </div>
            ) : null}
            <SourceWorkspace
              view={shellView}
              canRetireEvent={canRetireEvent}
              stageView={resolvedStageView}
              workspace={workspace}
              canViewFinancialValues={canViewFinancialValues}
              vendorResponseReadiness={vendorResponseReadiness}
              vendorResponseProfiles={vendorResponseProfiles}
              vendorChallengeIntelligence={vendorChallengeIntelligence}
              vendorBafoInstructionPack={vendorBafoInstructionPack}
              vendorEvaluationDecisionView={vendorEvaluationDecisionView}
              evaluationBafoReadinessView={evaluationBafoReadinessView}
              negotiationBriefCandidate={negotiationBriefCandidate}
              vendorResponseParseReports={vendorResponseParseReports}
              normalizedResponsePackages={normalizedResponsePackages}
              artifacts={artifacts}
              awardSowHandoffReadiness={resolvedAwardSowHandoffReadiness}
              stage08AcceptanceSpine={computedStage08AcceptanceSpine}
              evidenceStates={evidenceStates}
              gateCriterionStates={gateCriterionStates}
              stageArtifactStates={stageArtifactStates}
              eventDisplayName={event.name}
              contractOptimizationProfile={contractOptimizationProfile}
              onWorkspaceChange={setWorkspace}
              onClientFinalAccepted={() => router.refresh()}
            />
          </SourceWorkflowFrame>
        </div>
      </main>
      <AskAvaLauncher
        open={avaOpen}
        onClick={() => setAvaOpen((value) => !value)}
      />
      {avaOpen ? (
        <AskAnythingBar
          agent="sentinel"
          scopeLabel={`${event.code} · ${stageLabel}`}
          surface="source-detail"
          placeholder={`Ask aVa about ${stageLabel}...`}
        />
      ) : null}
    </AppShell>
  );
}

function strategyGateReady(
  states: readonly SourceEventGateCriterion[],
  artifacts: readonly SourceEventArtifactState[],
  evidence: readonly SourceEventEvidence[],
  approvalPolicyCode: SourcingEventSummary["approvalPolicyCode"],
): boolean {
  const definitions = criteriaForStage("strategy");
  if (!definitions.length || !definitions.every((definition) =>
    states.some((state) => state.criterionId === definition.criterionId && state.fromStage === "strategy")
  )) return false;
  return evaluateStagePromotionReadiness({
    currentStage: "strategy",
    targetStage: "scope",
    criteria: [...states],
    artifacts: [...artifacts],
    evidence: evidence.filter((row) => row.stage === "strategy"),
    reason: "Review of the current Strategy gate is ready.",
    approvalPolicyCode,
  }).ok;
}

function SourceShellRail({
  view,
  journey,
  workspace,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
  journey?: SourceJourneyDefinition;
  workspace: SourceShellWorkspace;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
  const readerJourney = sourceReaderJourneyCheckpoints(view, journey);

  return (
    <aside
      data-testid="source-shell-v2-rail"
      style={{
        minWidth: 0,
        padding: "24px 16px 18px",
        borderRight: `1px solid ${ANALYTICS.LINE}`,
        background: ANALYTICS.PAGE_BG,
      }}
    >
      <Link
        href="/source/new"
        style={{
          color: ANALYTICS.MUTED,
          fontSize: 12,
          textDecoration: "none",
        }}
      >
        ← Source New
      </Link>
      <div style={{ marginTop: 16, marginBottom: 22 }}>
        <div
          style={{
            fontFamily: ANALYTICS.SERIF,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            lineHeight: 1.12,
          }}
        >
          {view.event.name}
        </div>
        <div style={{ color: ANALYTICS.MUTED, fontSize: 12, marginTop: 6 }}>
          {view.event.accountName} · {view.event.tenantName}
        </div>
        <div style={{ color: ANALYTICS.MUTED, fontSize: 12, marginTop: 3 }}>
          {view.event.valueAtStakeLabel} · {view.event.statusLabel}
        </div>
      </div>

      <RailLabel>Journey</RailLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {readerJourney.map((checkpoint, index) => {
          const checkpointState = checkpoint.state;
          return (
            <Link
              key={checkpoint.key}
              href={checkpoint.href}
              data-testid="source-reader-journey-checkpoint"
              style={{
                display: "grid",
                gridTemplateColumns: "22px 1fr",
                gap: 9,
                alignItems: "center",
                padding: "8px 9px",
                borderRadius: 8,
                border: checkpointState === "current"
                  ? `1px solid ${ANALYTICS.LINE}`
                  : "1px solid transparent",
                background:
                  checkpointState === "current" ? ANALYTICS.CARD : "transparent",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background:
                    checkpointState === "past" ||
                    checkpointState === "complete" ||
                    checkpointState === "recorded"
                      ? ANALYTICS.INK
                      : checkpointState === "historical_gap"
                        ? ANALYTICS.AMBER_TINT
                      : checkpointState === "current"
                        ? ANALYTICS.BLUE
                        : ANALYTICS.CARD,
                  color:
                    checkpointState === "past" ||
                    checkpointState === "complete" ||
                    checkpointState === "recorded" ||
                    checkpointState === "current"
                      ? "#fff"
                      : checkpointState === "historical_gap"
                        ? ANALYTICS.AMBER_TEXT
                      : ANALYTICS.FAINT,
                  border:
                    checkpointState === "past" ||
                    checkpointState === "complete" ||
                    checkpointState === "recorded" ||
                    checkpointState === "current"
                      ? "none"
                      : `1px solid ${ANALYTICS.LINE_STRONG}`,
                  fontFamily: ANALYTICS.MONO,
                  fontSize: 9,
                  fontWeight: 800,
                }}
              >
                {checkpointState === "past" ||
                checkpointState === "complete" ||
                checkpointState === "recorded"
                  ? "✓"
                  : checkpointState === "historical_gap"
                    ? "!"
                    : checkpointState === "no_record"
                      ? "–"
                  : String(index + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  display: "grid",
                  gap: 2,
                  color:
                    checkpointState === "current" ||
                    checkpointState === "past" ||
                    checkpointState === "complete" ||
                    checkpointState === "recorded"
                      ? ANALYTICS.INK
                      : ANALYTICS.MUTED,
                  fontSize: 13,
                  fontWeight: checkpointState === "current" ? 700 : 600,
                }}
              >
                <span>{checkpoint.label}</span>
                {checkpointState === "historical_gap" ? (
                  <span
                    style={{
                      color: ANALYTICS.AMBER_TEXT,
                      fontFamily: ANALYTICS.MONO,
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: "uppercase",
                    }}
                  >
                    Historical gap
                  </span>
                ) : checkpointState === "no_record" ? (
                  <span
                    style={{
                      color: ANALYTICS.MUTED,
                      fontFamily: ANALYTICS.MONO,
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: "uppercase",
                    }}
                  >
                    No record
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>

      {journey?.id !== "contract_optimization" ? (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          }}
        >
          <RailLabel>Stage detail</RailLabel>
          <Link
            href={`/source/events/${view.event.id}?stage=${view.stage.key}`}
            data-testid="source-reader-journey-deep-stage-link"
            style={{
              display: "grid",
              gridTemplateColumns: "22px 1fr auto",
              gap: 9,
              alignItems: "center",
              padding: "8px 9px",
              borderRadius: 8,
              border: `1px solid ${ANALYTICS.LINE}`,
              background: ANALYTICS.CARD,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: ANALYTICS.BLUE,
                color: "#fff",
                fontFamily: ANALYTICS.MONO,
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              ↗
            </span>
            <span
              style={{
                color: ANALYTICS.INK,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {view.stage.label}
            </span>
            <span
              data-testid={
                view.event.viewedStageKey === view.event.currentStageKey
                  ? "source-journey-current-stage-status"
                  : undefined
              }
              style={{
                color:
                  view.stage.ready >= view.stage.total &&
                  view.stage.artifactReadiness.blockerCount > 0
                    ? ANALYTICS.AMBER_TEXT
                    : ANALYTICS.FAINT,
                fontFamily: ANALYTICS.MONO,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {view.stage.ready >= view.stage.total &&
              view.stage.artifactReadiness.blockerCount > 0
                ? "review files"
                : `${view.stage.ready}/${view.stage.total}`}
            </span>
          </Link>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
        }}
      >
        <RailLabel>Workspace</RailLabel>
        <WorkspaceButton
          workspaceKey="files"
          label="Files & deliverables"
          active={workspace === "files"}
          onClick={() => onWorkspaceChange("files")}
        />
        <WorkspaceButton
          workspaceKey="intelligence"
          label="Intelligence Explorer"
          badge={workspace === "intelligence" ? "open" : undefined}
          active={workspace === "intelligence"}
          onClick={() => onWorkspaceChange("intelligence")}
        />
        <WorkspaceButton
          workspaceKey="approvals"
          label="Approvals"
          active={workspace === "approvals"}
          onClick={() => onWorkspaceChange("approvals")}
        />
        <WorkspaceButton
          workspaceKey="guidebook"
          label="Guidebook"
          badge={view.guidebook.available ? undefined : "default"}
          active={workspace === "guidebook"}
          onClick={() => onWorkspaceChange("guidebook")}
        />
      </div>
      <div
        style={{
          marginTop: 26,
          paddingTop: 18,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          color: ANALYTICS.MUTED,
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        <Link
          href="/source"
          style={{ color: ANALYTICS.MUTED, textDecoration: "none" }}
        >
          Design contract →
        </Link>
        <div style={{ marginTop: 14 }}>
          <SourceRailAdvisorNote view={view} />
        </div>
      </div>
    </aside>
  );
}

type SourceReaderCheckpointState =
  | "complete"
  | "past"
  | "recorded"
  | "current"
  | "future"
  | "historical_gap"
  | "no_record";

interface SourceReaderJourneyCheckpoint {
  key: string;
  href: string;
  label: string;
  state: SourceReaderCheckpointState;
}

function sourceReaderJourneyCheckpoints(
  view: SourceEventShellView,
  journey?: SourceJourneyDefinition,
): SourceReaderJourneyCheckpoint[] {
  if (journey?.id === "contract_optimization") {
    return view.journey.map((stage) => ({
      key: stage.key,
      href: `/source/events/${encodeURIComponent(view.event.id)}?stage=${stage.key}`,
      label: stage.label,
      state: stage.state,
    }));
  }

  const evidence = sourceReaderPhaseEvidence(view);

  return SOURCE_NEW_EXTERNAL_CHECKPOINT_ORDER.map((checkpoint) => ({
    key: checkpoint,
    href: sourceReaderCheckpointHref(view, checkpoint),
    label: sourceReaderCheckpointLabel(checkpoint),
    state: sourceReaderCheckpointState(view, checkpoint, evidence),
  }));
}

function sourceReaderPhaseEvidence(
  view: SourceEventShellView,
): SourceNewPhaseEvidence {
  const recordedFilePhases = new Set(
    view.files.items.map((item) =>
      sourceNewFilePhase({
        sourcingStage: item.stageKey,
        artifactType: `${item.artifactCode} ${item.name}`,
      }),
    ),
  );
  const approvedStages = new Set(
    view.approvals.ledger
      .filter((row) => row.state === "approved")
      .map((row) => row.stageKey),
  );

  return {
    request:
      recordedFilePhases.has("request") || approvedStages.has("strategy"),
    define:
      recordedFilePhases.has("define") || approvedStages.has("scope"),
    suppliers: recordedFilePhases.has("suppliers"),
    rfi: recordedFilePhases.has("rfi") || approvedStages.has("rfp"),
  };
}

function sourceReaderCheckpointLabel(
  checkpoint: SourceNewExternalCheckpointKey,
): string {
  if (checkpoint === "request_intake") return "Request intake";
  return SOURCE_NEW_PHASE_DISPLAY_LABELS[checkpoint];
}

function sourceReaderCheckpointHref(
  view: SourceEventShellView,
  checkpoint: SourceNewExternalCheckpointKey,
): string {
  const eventId = encodeURIComponent(view.event.id);
  switch (checkpoint) {
    case "request_intake":
      return "/source/new";
    case "request":
      return `/source/events/${eventId}?stage=strategy`;
    case "define":
      return `/source/events/${eventId}?stage=scope`;
    case "suppliers":
      return `/source/events/${eventId}?stage=scope&workspace=files`;
    case "rfi":
      return `/source/events/${eventId}?stage=rfp`;
  }
}

function sourceReaderCheckpointState(
  view: SourceEventShellView,
  checkpoint: SourceNewExternalCheckpointKey,
  evidence: SourceNewPhaseEvidence,
): SourceReaderCheckpointState {
  if (checkpoint === "request_intake") return "complete";
  const event = {
    currentStage: view.event.currentStageKey,
    lifecycle: view.event.lifecycle,
  };
  const state = sourceNewPhaseState(checkpoint, event, evidence);
  if (state === "current" || state === "review_needed") return "current";
  if (state === "recorded") return "recorded";
  if (state === "historical_gap") return "historical_gap";
  if (state === "no_record") return "no_record";
  return "future";
}

function SourceWorkspace({
  view,
  canRetireEvent,
  stageView,
  workspace,
  vendorResponseReadiness,
  vendorResponseProfiles,
  vendorChallengeIntelligence,
  vendorBafoInstructionPack,
  vendorEvaluationDecisionView,
  evaluationBafoReadinessView,
  negotiationBriefCandidate,
  vendorResponseParseReports,
  normalizedResponsePackages,
  artifacts,
  awardSowHandoffReadiness,
  canViewFinancialValues = false,
  stage08AcceptanceSpine,
  evidenceStates,
  gateCriterionStates,
  stageArtifactStates,
  eventDisplayName,
  contractOptimizationProfile,
  onWorkspaceChange,
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
  canRetireEvent: boolean;
  stageView: StageAnalyticsView;
  workspace: SourceShellWorkspace;
  vendorResponseReadiness?: SourceVendorResponseCompleteness | null;
  vendorResponseProfiles?: VendorResponseProfileSet | null;
  vendorChallengeIntelligence?: VendorChallengeIntelligence | null;
  vendorBafoInstructionPack?: VendorBafoInstructionPack | null;
  vendorEvaluationDecisionView?: VendorEvaluationDecisionView | null;
  evaluationBafoReadinessView?: EvaluationBafoReadinessView | null;
  negotiationBriefCandidate?: Stage07NegotiationBriefCandidate | null;
  vendorResponseParseReports?: VendorResponseParseReport[];
  normalizedResponsePackages?: readonly NormalizedVendorResponsePackage[];
  artifacts: readonly SourceShellArtifactLike[];
  awardSowHandoffReadiness?: SourceAwardSowHandoffReadiness | null;
  /** U-520 — pass-through only; see the canvas's own prop for the reasoning. */
  canViewFinancialValues?: boolean;
  stage08AcceptanceSpine?: SourceStage08AcceptanceSpine | null;
  evidenceStates?: readonly SourceEventEvidence[];
  gateCriterionStates?: readonly SourceEventGateCriterion[];
  stageArtifactStates?: readonly SourceEventArtifactState[];
  eventDisplayName?: string;
  contractOptimizationProfile?: ContractOptimizationMveProfile | null;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
  onClientFinalAccepted: () => void;
}) {
  if (workspace === "files") {
    return (
      <FilesWorkspace
        view={view}
        artifacts={artifacts}
        evidenceStates={evidenceStates ?? []}
        onClientFinalAccepted={onClientFinalAccepted}
      />
    );
  }
  if (workspace === "intelligence") {
    return (
      <IntelligenceWorkspace
        view={view}
        stageView={stageView}
        evidenceStates={evidenceStates ?? []}
      />
    );
  }
  if (workspace === "approvals")
    return (
      <ApprovalsWorkspace
        view={view}
        canRetireEvent={canRetireEvent}
        gateAction={stageView.gate.action}
        evidenceStates={evidenceStates ?? []}
        gateCriterionStates={gateCriterionStates ?? []}
        stageArtifactStates={stageArtifactStates ?? []}
        canReviewCriteria={canRetireEvent}
        onCriterionSaved={onClientFinalAccepted}
        onGoToFiles={() => onWorkspaceChange("files")}
        onGoToSteps={() => onWorkspaceChange("steps")}
      />
    );
  if (workspace === "guidebook") return <GuidebookWorkspace view={view} />;

  return (
    <section data-testid="source-shell-v2-steps">
      <StageHeader view={view} evidenceStates={evidenceStates ?? []} />
      <CommercialActiveCanvasStrip
        view={view}
        onWorkspaceChange={onWorkspaceChange}
      />
      {["pricing", "executive_decision", "selection", "transition"].includes(
        view.stage.key,
      ) ? (
        <div style={{ maxWidth: 1120, marginBottom: 16 }}>
          <StageDecisionLensPanel
            stage={view.stage.key}
            profileSet={vendorResponseProfiles}
            decisionView={vendorEvaluationDecisionView}
          />
        </div>
      ) : null}
      <FocusedWorkPanel
        view={view}
        evidenceStates={evidenceStates ?? []}
        awardSowHandoffReadiness={awardSowHandoffReadiness}
        onWorkspaceChange={onWorkspaceChange}
      />
      {view.stage.key === "transition" && awardSowHandoffReadiness ? (
        <div style={{ marginTop: 16, maxWidth: 1120 }}>
          <SourceAwardSowHandoffReadinessPanel
            readiness={awardSowHandoffReadiness}
            acceptanceSpine={stage08AcceptanceSpine ?? undefined}
          />
        </div>
      ) : null}
      {view.stage.key === "responses" ? (
        <div style={{ marginTop: 16, maxWidth: 1040 }}>
          <ResponsesStageView
            readiness={vendorResponseReadiness ?? undefined}
            profileSet={vendorResponseProfiles}
            challengeIntelligence={vendorChallengeIntelligence}
            bafoInstructionPack={vendorBafoInstructionPack}
            evaluationDecisionView={vendorEvaluationDecisionView}
            parseReports={vendorResponseParseReports}
            canViewFinancialValues={canViewFinancialValues}
            normalizedResponsePackages={normalizedResponsePackages}
            artifacts={artifacts}
            responseProposalAvailabilityState={
              evidenceStates?.find(
                (state) =>
                  state.requirementId === "EVID-SRC-RESP-PROPOSALS",
              )?.currentState ?? null
            }
            onResponseUploaded={onClientFinalAccepted}
            contractOptimizationProfile={contractOptimizationProfile}
            eventDisplayName={eventDisplayName}
            documentWorkspace={null}
          />
        </div>
      ) : null}
      {view.stage.key === "evaluation" ? (
        <div style={{ marginTop: 16, maxWidth: 1120 }}>
          <EvaluationBafoReadinessPanel
            view={evaluationBafoReadinessView}
            negotiationBriefCandidate={negotiationBriefCandidate}
          />
        </div>
      ) : null}
      {view.stage.key === "evaluation" ? (
        <div style={{ marginTop: 16, maxWidth: 1120 }}>
          <VendorEvaluationScorecardPanel
            decisionView={vendorEvaluationDecisionView}
            eventDisplayName={eventDisplayName}
          />
        </div>
      ) : null}
      {view.stage.key === "bafo" ? (
        <div
          style={{ display: "grid", gap: 16, marginTop: 16, maxWidth: 1120 }}
        >
          <EvaluationBafoReadinessPanel
            view={evaluationBafoReadinessView}
            negotiationBriefCandidate={negotiationBriefCandidate}
          />
          <VendorChallengeLeveragePanel
            intelligence={vendorChallengeIntelligence}
          />
          <VendorBafoInstructionPackPanel pack={vendorBafoInstructionPack} />
        </div>
      ) : null}
    </section>
  );
}

type SourceAnalyticsEventWithDetail = SourcingEventSummary & {
  stages?: readonly WorkflowStage[];
  artifacts?: readonly SourceAwardSowArtifactInput[];
};

const SOURCE_ARTIFACT_STATUSES: readonly SourceArtifactStatus[] = [
  "not_started",
  "draft",
  "needs_inputs",
  "needs_review",
  "approved",
  "locked",
  "superseded",
  "archived",
];

function buildAwardSowHandoffReadinessForCanvas(
  event: SourcingEventSummary,
  view: SourceEventShellView,
): SourceAwardSowHandoffReadiness | null {
  if (
    view.stage.key !== "transition" &&
    view.stage.key !== "contract_mobilization"
  ) {
    return null;
  }

  return buildSourceAwardSowHandoffReadiness({
    event: {
      id: event.id,
      name: event.name,
      currentStageKey: event.currentStageKey,
      currentStageLabel: event.currentStageLabel,
      stages: stageInputsForAwardSow(event, view),
      artifacts: artifactInputsForAwardSow(event, view),
    },
  });
}

function buildStage08AcceptanceSpineForCanvas(
  event: SourcingEventSummary,
  view: SourceEventShellView,
  evaluation: {
    profileSet?: VendorResponseProfileSet | null;
    challengeIntelligence?: VendorChallengeIntelligence | null;
    bafoInstructionPack?: VendorBafoInstructionPack | null;
    decisionView?: VendorEvaluationDecisionView | null;
  },
): SourceStage08AcceptanceSpine | null {
  if (
    view.stage.key !== "transition" &&
    view.stage.key !== "contract_mobilization"
  ) {
    return null;
  }

  return buildSourceStage08AcceptanceSpine({
    evaluation,
    handoff: {
      event: {
        id: event.id,
        name: event.name,
        currentStageKey: event.currentStageKey,
        currentStageLabel: event.currentStageLabel,
        stages: stageInputsForAwardSow(event, view),
        artifacts: artifactInputsForAwardSow(event, view),
      },
    },
  });
}

function stageInputsForAwardSow(
  event: SourcingEventSummary,
  view: SourceEventShellView,
): SourceAwardSowStageInput[] {
  const detailedEvent = event as SourceAnalyticsEventWithDetail;
  if (Array.isArray(detailedEvent.stages) && detailedEvent.stages.length > 0) {
    return detailedEvent.stages.map((stage) => ({
      key: stage.key,
      label: stage.label,
      status: stage.status,
      gate: {
        status: stage.gate.status,
        requiredArtifacts: stage.gate.requiredArtifacts,
        blocker: stage.gate.blocker,
      },
    }));
  }

  return view.journey.map((stage) => ({
    key: stage.key,
    label: stage.label,
    status:
      stage.approvalEvidenced === true || stage.state === "complete"
        ? "complete"
        : stage.current
          ? "active"
          : "not_started",
    gate: {
      status: stage.approvalEvidenced === true ? "approved" : "not_started",
      requiredArtifacts: [],
      blocker: null,
    },
  }));
}

function artifactInputsForAwardSow(
  event: SourcingEventSummary,
  view: SourceEventShellView,
): SourceAwardSowArtifactInput[] {
  const detailedEvent = event as SourceAnalyticsEventWithDetail;
  const eventArtifacts = Array.isArray(detailedEvent.artifacts)
    ? detailedEvent.artifacts
    : [];
  const shellArtifacts = view.files.items.map((file) => ({
    id: file.artifactCode || file.id,
    title: file.name || file.artifactCode,
    status:
      file.latestAcceptance || file.state === "locked"
        ? ("locked" as const)
        : sourceArtifactStatusFromString(file.state),
    summary: [file.artifactCode, file.stageLabel, file.governanceLabel]
      .filter(Boolean)
      .join(" · "),
    sourceCount: 1,
  }));

  const byId = new Map<string, SourceAwardSowArtifactInput>();
  for (const artifact of [...eventArtifacts, ...shellArtifacts]) {
    byId.set(artifact.id, artifact);
  }
  return [...byId.values()];
}

function sourceArtifactStatusFromString(value: string): SourceArtifactStatus {
  return SOURCE_ARTIFACT_STATUSES.includes(value as SourceArtifactStatus)
    ? (value as SourceArtifactStatus)
    : "draft";
}

/**
 * A reader can open any stage of an event by URL (`?stage=`), including one the
 * event has not reached and one it has already left. Nothing saved there moves
 * the event, so the canvas has to say so — an unlabelled future stage reads
 * exactly like the live one.
 *
 * Direction comes from the journey's own order rather than the canonical stage
 * order, so an event on a motion that hides stages is described in the order
 * its reader sees. When either stage is outside that journey the notice still
 * renders and simply drops the direction, rather than guessing one.
 */
function OffStageNotice({ view }: { view: SourceEventShellView }) {
  const viewedStageKey = view.event.viewedStageKey;
  const currentStageKey = view.event.currentStageKey;
  if (viewedStageKey === currentStageKey) return null;

  const viewedEntry = view.journey.find(
    (stage) => stage.key === viewedStageKey,
  );
  const currentEntry = view.journey.find(
    (stage) => stage.key === currentStageKey,
  );
  const viewedLabel =
    view.stage.label || SOURCE_STAGE_LABELS[viewedStageKey] || viewedStageKey;
  const currentLabel =
    currentEntry?.label ||
    SOURCE_STAGE_LABELS[currentStageKey] ||
    currentStageKey;
  const ahead =
    viewedEntry && currentEntry ? viewedEntry.index > currentEntry.index : null;

  const eyebrow =
    ahead === null
      ? "Off-stage"
      : ahead
        ? "Off-stage · not reached"
        : "Off-stage · already passed";
  const body =
    ahead === null
      ? `This event is in ${currentLabel}, not ${viewedLabel}. Nothing saved here advances it.`
      : ahead
        ? `Previewing ${viewedLabel}. This event is in ${currentLabel} and has not reached ${viewedLabel} — nothing saved here advances it. Clear the ${currentLabel} gate first.`
        : `Reviewing ${viewedLabel}. This event has moved on to ${currentLabel} — nothing saved here advances it.`;

  return (
    <div
      data-testid="source-canvas-off-stage-notice"
      data-off-stage-direction={
        ahead === null ? "unknown" : ahead ? "ahead" : "behind"
      }
      role="status"
      style={{
        maxWidth: 1040,
        marginBottom: 18,
        padding: "10px 14px",
        background: ANALYTICS.AMBER_TINT,
        border: `1px solid ${ANALYTICS.AMBER}`,
        borderRadius: 8,
        color: ANALYTICS.AMBER_TEXT,
      }}
    >
      <div
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

function StageHeader({
  view,
  evidenceStates,
}: {
  view: SourceEventShellView;
  evidenceStates: readonly SourceEventEvidence[];
}) {
  const stageIndex =
    view.journey.find((stage) => stage.key === view.stage.key)?.index ?? 1;
  // Keep the headline owner simple; richer agent handoffs live in the stage
  // work model and the journey-specific rail note.
  const leadAgentLabel =
    view.stage.key === "transition" || view.stage.key === "value"
      ? "Atlas"
      : "aVa";
  const inputsComplete =
    view.stage.total > 0 && view.stage.ready >= view.stage.total;
  const requiredEvidenceOpen = buildStageEvidenceRequirementRows(view, evidenceStates)
    .filter((row) => row.requirement.level === "required" && !row.ready).length;
  const hasArtifactReviewBlockers =
    inputsComplete && view.stage.artifactReadiness.blockerCount > 0;
  const readinessLabel = requiredEvidenceOpen > 0
    ? "inputs captured"
    : hasArtifactReviewBlockers ? "inputs ready" : "ready";
  const readinessAriaLabel = requiredEvidenceOpen > 0
    ? `${view.stage.ready} of ${view.stage.total} inputs captured; ${requiredEvidenceOpen} required evidence items open`
    : hasArtifactReviewBlockers
      ? `${view.stage.ready} of ${view.stage.total} inputs ready; ${view.stage.artifactReadiness.blockerCount} file review gap${view.stage.artifactReadiness.blockerCount === 1 ? "" : "s"} remain`
    : `${view.stage.ready} of ${view.stage.total} ready`;

  return (
    <header style={{ marginBottom: 22, maxWidth: 1040 }}>
      <div
        style={{
          color: ANALYTICS.FAINT,
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        Source › {view.event.code} › {view.stage.label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 22,
        }}
      >
        <div>
          <div
            style={{
              color: ANALYTICS.FAINT,
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Stage {String(stageIndex).padStart(2, "0")} · {leadAgentLabel}
          </div>
          <h1
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 24,
              lineHeight: 1.12,
              margin: 0,
              letterSpacing: 0,
            }}
          >
            {view.stage.label}
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: ANALYTICS.INK_2,
              fontSize: 14,
              lineHeight: 1.42,
              maxWidth: 700,
            }}
          >
            {view.stage.purpose}
          </p>
        </div>
        <div
          data-testid="source-stage-header-readiness"
          aria-label={readinessAriaLabel}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              color: ANALYTICS.INK,
              fontFamily: ANALYTICS.SERIF,
              fontSize: 24,
              lineHeight: 1,
            }}
          >
            {view.stage.ready} / {view.stage.total}
          </span>
          <div
            aria-hidden
            style={{
              width: 76,
              height: 5,
              background: ANALYTICS.LINE_SOFT,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${view.stage.readyPct}%`,
                height: "100%",
                background: requiredEvidenceOpen > 0 ? ANALYTICS.FAINT : ANALYTICS.GREEN,
              }}
            />
          </div>
          <span
            data-testid="source-stage-header-readiness-label"
            style={{
              color: requiredEvidenceOpen > 0 || hasArtifactReviewBlockers
                ? ANALYTICS.AMBER_TEXT
                : ANALYTICS.FAINT,
              fontSize: 12,
            }}
          >
            {readinessLabel}
          </span>
        </div>
      </div>
    </header>
  );
}

type StageEvidenceRequirementRow = {
  requirement: SourceEvidenceRequirement;
  evidence: SourceEventEvidence | undefined;
  file: SourceShellFileItem | null;
  lifecycle: SourceEvidenceLifecycleResult;
  ready: boolean;
  uploaded: boolean;
};

type StageOperatingStatus = {
  stageKey: SourceStageKey;
  stageLabel: string;
  simpleScreen: SimpleStageScreenView;
  requiredReady: number;
  requiredTotal: number;
  optionalTotal: number;
  coverageValue: string;
  canonicalRequiredTotal: number;
  gateReady: number;
  gateTotal: number;
  blockedCount: number;
  approvalRecorded: boolean;
  historicalApproval: boolean;
  nextActionLabel: string;
};

function buildStageOperatingStatus(
  view: SourceEventShellView,
  evidenceStates: readonly SourceEventEvidence[],
): StageOperatingStatus | null {
  const rows = buildStageEvidenceRequirementRows(view, evidenceStates);
  if (rows.length === 0) return null;

  const stageEvidence = evidenceStates.filter(
    (row) => row.stage === view.stage.key,
  );
  const artifactStates = sourceArtifactStatesFromFiles(
    view.files.items.filter((file) => file.stageKey === view.stage.key),
    view,
  );
  const gateCriterionStates = virtualGateCriteriaForStage(view);
  const simpleScreen = resolveSimpleStageScreen(
    {
      artifactStates,
      gateCriterionStates,
      evidenceStates: stageEvidence,
    },
    view.stage.key,
  );
  const coverage = computeStageRequirementCoverage({
    stageKey: view.stage.key,
    artifactStates,
    evidenceStates: stageEvidence,
    approvalPolicyCode: view.event.approvalPolicyCode,
  });
  const recommendation = buildStageRecommendation(
    assessStageGate({
      fromStage: view.stage.key,
      criteria: gateCriterionStates,
      artifacts: artifactStates,
      evidence: stageEvidence,
      approvalPolicyCode: view.event.approvalPolicyCode,
    }),
  );
  const requiredRows = rows.filter(
    (row) => row.requirement.level === "required",
  );
  const requiredReady = requiredRows.filter((row) => row.ready).length;
  const allRequiredReady =
    requiredRows.length > 0 && requiredReady === requiredRows.length;

  return {
    stageKey: view.stage.key,
    stageLabel: view.stage.label,
    simpleScreen,
    requiredReady,
    requiredTotal: requiredRows.length,
    optionalTotal: rows.length - requiredRows.length,
    coverageValue: coverage.displayValue,
    canonicalRequiredTotal:
      requiredEvidenceForStage(view.stage.key).filter((row) =>
        sourceEvidenceAppliesToApprovalPolicy(row.requirementId, view.event.approvalPolicyCode)).length +
      requiredSpecsForStage(view.stage.key).length,
    gateReady: recommendation.requiredMet,
    gateTotal: recommendation.requiredTotal,
    blockedCount: recommendation.blockers.length,
    approvalRecorded: view.stage.approvalRecorded,
    historicalApproval: view.stage.approvalTraceState === "historical",
    nextActionLabel: view.stage.approvalRecorded
      ? recommendation.blockers.length > 0
        ? "Remediate current gaps"
        : "Approval recorded"
      : allRequiredReady
        ? "Open approval gate"
        : "Load required evidence",
  };
}

function StageOperatingStatusPanel({
  status,
  embedded = false,
}: {
  status: StageOperatingStatus;
  embedded?: boolean;
}) {
  const allRequiredReady =
    status.requiredTotal > 0 && status.requiredReady === status.requiredTotal;
  return (
    <div
      data-testid={
        status.stageKey === "scope"
          ? "source-scope-operating-status"
          : "source-stage-operating-status"
      }
      data-stage-key={status.stageKey}
      style={{
        border: `1px solid ${allRequiredReady ? "rgba(17, 120, 84, 0.28)" : ANALYTICS.LINE}`,
        borderRadius: 8,
        background: allRequiredReady
          ? "rgba(24, 151, 108, 0.045)"
          : ANALYTICS.CARD,
        margin: embedded ? 0 : "0 0 16px 42px",
        maxWidth: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          padding: "10px 12px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <strong style={{ color: ANALYTICS.INK, fontSize: 13 }}>
            {status.approvalRecorded
              ? `${status.stageLabel} decision status`
              : `${status.stageLabel} gate readiness`}
          </strong>
          <div
            style={{
              color: ANALYTICS.MUTED,
              fontSize: 12,
              lineHeight: 1.35,
              marginTop: 3,
            }}
          >
            {status.approvalRecorded
              ? status.blockedCount > 0
                ? status.historicalApproval
                  ? "The event advanced under an earlier control state; today's open controls remain visible for remediation."
                  : "Approval is recorded; today's open controls remain visible for remediation."
                : "Approval is recorded and current controls are clear."
              : `${status.simpleScreen.deliverable.name} unlocks ${status.simpleScreen.nextStep.label}.`}
          </div>
        </div>
        <ReadinessChip
          label={status.nextActionLabel}
          tone={allRequiredReady ? "good" : "warn"}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
          padding: "11px 12px",
        }}
      >
        <StepNeedDatum
          label="Required"
          value={`${status.requiredReady}/${status.requiredTotal} ready`}
          tone={allRequiredReady ? "good" : "warn"}
        />
        <StepNeedDatum
          label="Optional"
          value={`${status.optionalTotal} listed`}
        />
        <StepNeedDatum
          label="Coverage"
          value={`${status.coverageValue} total`}
        />
        <StepNeedDatum
          label={status.approvalRecorded ? "Current controls" : "Gate"}
          value={`${status.gateReady}/${status.gateTotal || 0} criteria`}
          tone={status.blockedCount > 0 ? "warn" : "good"}
        />
        <StepNeedDatum
          label="Controls"
          value={`${status.canonicalRequiredTotal} canonical asks`}
        />
      </div>
    </div>
  );
}

function FocusedWorkPanel({
  view,
  evidenceStates,
  awardSowHandoffReadiness,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
  evidenceStates: readonly SourceEventEvidence[];
  awardSowHandoffReadiness?: SourceAwardSowHandoffReadiness | null;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
  const router = useRouter();
  const flatSteps = useMemo(
    () =>
      view.stage.groups
        .flatMap((group) => group.steps)
        .slice()
        .sort((a, b) => a.order - b.order),
    [view.stage.groups],
  );
  const requiredEvidenceRows = buildStageEvidenceRequirementRows(view, evidenceStates)
    .filter((row) => row.requirement.level === "required");
  const requiredEvidenceById = new Map(
    requiredEvidenceRows.map((row) => [row.requirement.requirementId, row]),
  );
  const requiredRowsForStep = (step: SourceShellStep) =>
    requiredEvidenceRequirementIdsForTask({
      id: step.id,
      factTemplateCode: step.factTemplateCode ?? undefined,
    }, view.stage.key)
      .filter((id) => sourceEvidenceAppliesToApprovalPolicy(id, view.event.approvalPolicyCode))
      .map((id) => requiredEvidenceById.get(id));
  const evidenceReadyForStep = (step: SourceShellStep) => {
    const rows = requiredRowsForStep(step);
    return rows.every((row) => row?.ready === true);
  };
  const firstUnreadyStepId = flatSteps.find((step) =>
    step.status !== "captured" || !evidenceReadyForStep(step))?.id ??
    flatSteps[0]?.id ?? null;
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        flatSteps
          .filter((step) => step.status === "captured")
          .map((step) => step.id),
      ),
  );
  const [activeStepId, setActiveStepId] = useState<string | null>(
    () => firstUnreadyStepId,
  );

  useEffect(() => {
    setCompletedIds(
      new Set(
        flatSteps
          .filter((step) => step.status === "captured")
          .map((step) => step.id),
      ),
    );
    setActiveStepId(firstUnreadyStepId);
  }, [flatSteps, firstUnreadyStepId, view.event.id, view.stage.key]);

  const isComplete = (step: SourceShellStep) =>
    (step.status === "captured" || completedIds.has(step.id)) &&
    evidenceReadyForStep(step);
  const doneCount = flatSteps.filter(isComplete).length;
  const allReady = flatSteps.length > 0 && doneCount === flatSteps.length;
  const hasArtifactGaps = view.stage.artifactReadiness.blockerCount > 0;
  const requiredEvidenceOpen = requiredEvidenceRows.filter((row) => !row.ready).length;
  const stageInputsReady = !hasArtifactGaps && requiredEvidenceOpen === 0;
  // An approval record exists for the stage being viewed. `approvalEvidenced` is
  // null when no approval ledger was supplied, which is not the same as "not
  // approved" — only an explicit true means a record backs it.
  const viewedStageApproved =
    view.journey.find((stage) => stage.key === view.stage.key)
      ?.approvalEvidenced === true;
  const activeStep =
    flatSteps.find((step) => step.id === activeStepId) ??
    flatSteps.find((step) => step.status !== "captured") ??
    flatSteps[0] ??
    null;
  const activeIndex = activeStep
    ? flatSteps.findIndex((step) => step.id === activeStep.id)
    : -1;
  const activeComplete = activeStep ? isComplete(activeStep) : false;
  const activeMissingEvidence = activeStep
    ? requiredRowsForStep(activeStep).find((row) => row?.ready !== true)
    : null;
  const canShowNext =
    activeComplete &&
    (activeIndex < flatSteps.length - 1 || stageInputsReady);
  const activeGroup =
    (activeStep
      ? view.stage.groups.find((group) =>
          group.steps.some((step) => step.id === activeStep.id),
        )
      : view.stage.groups.find((group) =>
          group.steps.some((step) => step.status === "captured"),
        )) ??
    view.stage.groups[0] ??
    null;
  const continueGuidance =
    activeComplete && activeIndex === flatSteps.length - 1 && !stageInputsReady
      ? "Required evidence or file review is still open. Review Files."
      : activeStep
        ? activeStepContinueGuidance(
            activeStep,
            activeComplete,
            activeIndex,
            flatSteps.length,
            view.stage.label,
          )
        : null;
  const stageOperatingStatus =
    view.stage.key === "strategy" ||
    view.stage.key === "scope" ||
    view.stage.key === "rfp"
      ? buildStageOperatingStatus(view, evidenceStates)
      : null;

  const markComplete = (stepId: string) => {
    setCompletedIds((prev) => new Set(prev).add(stepId));
  };

  const openApprovalPage = () => {
    if (view.stage.approvalHref) {
      onWorkspaceChange("approvals");
      router.push(view.stage.approvalHref);
    }
  };

  const goNext = () => {
    if (!activeStep || !activeComplete) return;
    if (activeIndex >= flatSteps.length - 1) {
      openApprovalPage();
      return;
    }
    setActiveStepId(flatSteps[activeIndex + 1]?.id ?? activeStep.id);
  };

  if (flatSteps.length === 0) {
    return (
      <EmptyCard text="No required steps are defined for this stage yet." />
    );
  }

  return (
    <section
      data-testid="source-shell-focused-work-panel"
      style={{
        ...CARD_STYLE,
        display: "grid",
        gridTemplateColumns: "286px minmax(0, 1fr)",
        maxWidth: "none",
        boxShadow: ANALYTICS.SHADOW_SM,
        width: "100%",
      }}
    >
      <div
        style={{
          borderRight: `1px solid ${ANALYTICS.LINE}`,
          padding: "18px 14px",
          background: ANALYTICS.PAGE_BG,
        }}
      >
        {view.stage.groups.map((group) => {
          const groupActive = activeGroup?.id === group.id;
          const groupDone = group.steps.filter(isComplete).length;
          return (
            <div
              key={group.id}
              style={{
                marginBottom: 16,
                opacity: groupActive || allReady ? 1 : 0.68,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <RailLabel>{plainStageStepGroupLabel(group.label)}</RailLabel>
                <span
                  style={{
                    color: ANALYTICS.FAINT,
                    fontFamily: ANALYTICS.MONO,
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {groupDone}/{group.steps.length}
                </span>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {group.steps.map((step) => {
                  const active = step.id === activeStep?.id;
                  const done = isComplete(step);
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStepId(step.id)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "20px minmax(0, 1fr) auto",
                        gap: 8,
                        alignItems: "center",
                        border: active
                          ? `1px solid ${ANALYTICS.LINE}`
                          : "1px solid transparent",
                        borderLeft: active
                          ? `2px solid ${ANALYTICS.BLUE}`
                          : "2px solid transparent",
                        borderRadius: 8,
                        background: active ? ANALYTICS.CARD : "transparent",
                        padding: "8px 7px",
                        boxShadow: active ? ANALYTICS.SHADOW_SM : "none",
                        cursor: "pointer",
                        fontFamily: ANALYTICS.SANS,
                        textAlign: "left",
                      }}
                    >
                      <StepDot done={done} active={active} />
                      <span
                        style={{
                          color: done
                            ? ANALYTICS.FAINT
                            : active
                              ? ANALYTICS.INK
                              : ANALYTICS.INK_2,
                          fontSize: 13,
                          fontWeight: active ? 800 : 650,
                          lineHeight: 1.25,
                        }}
                      >
                        {step.title}
                      </span>
                      {active ? (
                        <span
                          style={{
                            color: done ? ANALYTICS.GREEN_TEXT : ANALYTICS.BLUE,
                            fontFamily: ANALYTICS.MONO,
                            fontSize: 8,
                            fontWeight: 800,
                            textTransform: "uppercase",
                          }}
                        >
                          {done ? "done" : "now"}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div
          style={{
            color: ANALYTICS.FAINT,
            fontSize: 12,
            lineHeight: 1.45,
            marginTop: 12,
            paddingTop: 14,
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          }}
        >
          {allReady
            ? !stageInputsReady
              ? `Workflow inputs are complete for ${view.stage.label}. Review required evidence and Files before the approval action appears.`
              : `All required work is complete for ${view.stage.label}. Open the approval gate when the owner is ready.`
            : viewedStageApproved
              ? // Approve-with-gaps is a supported decision, but it must be
                // visible afterwards. Saying "N steps left before this can move
                // to approval" about a stage that was already approved hides the
                // gap and misdescribes the state — live-found on a stage reading
                // 0/1 whose approval record was already in the ledger.
                `${view.stage.label} was approved with ${flatSteps.length - doneCount} required input${flatSteps.length - doneCount === 1 ? "" : "s"} still open. The approval stands; the gap is recorded here so it is not mistaken for completed work.`
              : `${flatSteps.length - doneCount} required workflow step${flatSteps.length - doneCount === 1 ? " remains" : "s remain"} for ${view.stage.label}. Review evidence, artifact status, and gate criteria separately in Approvals.`}
        </div>
      </div>

      <div
        data-testid="source-shell-active-workflow-pane"
        style={{ minWidth: 0, paddingBottom: 88 }}
      >
        {allReady || viewedStageApproved ? (
          <StageReadyPanel
            view={view}
            stageOperatingStatus={stageOperatingStatus}
            requiredEvidenceOpen={requiredEvidenceOpen}
            awardSowHandoffReadiness={awardSowHandoffReadiness}
            onOpenApprovalPage={openApprovalPage}
            onOpenFiles={() => onWorkspaceChange("files")}
          />
        ) : activeStep ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "20px 24px",
                borderBottom: `1px solid ${ANALYTICS.LINE}`,
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: ANALYTICS.SERIF,
                    fontSize: 25,
                    lineHeight: 1.12,
                    margin: 0,
                  }}
                >
                  {activeStep.title}
                </h2>
                <div
                  style={{
                    color: ANALYTICS.MUTED,
                    fontFamily: ANALYTICS.MONO,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    marginTop: 7,
                  }}
                >
                  Step {activeIndex + 1} of {flatSteps.length}
                </div>
              </div>
            </div>

            <div
              style={{
                minHeight: 450,
                padding: "24px",
                background:
                  "linear-gradient(90deg, rgba(248,247,244,.88), rgba(255,255,255,0) 34%)",
              }}
            >
              <div
                style={{
                  color: ANALYTICS.FAINT,
                  fontFamily: ANALYTICS.MONO,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Current step
              </div>
              <div
                style={{
                  color: activeComplete
                    ? ANALYTICS.GREEN_TEXT
                    : ANALYTICS.AMBER_TEXT,
                  fontFamily: ANALYTICS.MONO,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  marginTop: 8,
                  textTransform: "uppercase",
                }}
              >
                {activeComplete ? "Complete" : "Required before Continue"}
              </div>
              <p
                style={{
                  color: ANALYTICS.INK_2,
                  fontSize: 14,
                  lineHeight: 1.55,
                  margin: "10px 0 16px",
                  maxWidth: 720,
                }}
              >
                {activeStep.help}
              </p>

              {stageOperatingStatus ? (
                <StageOperatingStatusPanel status={stageOperatingStatus} />
              ) : null}

              <ActiveStepNeedsPanel
                step={activeStep}
                isComplete={activeComplete}
                missingEvidence={activeMissingEvidence}
                eventId={view.event.id}
                onOpenFiles={() => onWorkspaceChange("files")}
                onEvidenceReviewed={() => router.refresh()}
              />

              <ActiveStepGuidePanel
                step={activeStep}
                stageLabel={view.stage.label}
                isComplete={activeComplete}
                guidebook={view.guidebook.record}
                onOpenGuidebook={() => onWorkspaceChange("guidebook")}
              />

              <StepDetail
                key={activeStep.id}
                step={activeStep}
                eventId={view.event.id}
                stageKey={view.stage.key}
                stepInsight={view.intelligence.stepInsight}
                isComplete={activeComplete}
                missingEvidence={activeMissingEvidence}
                onComplete={() => {
                  if (activeStep.id !== "strategy.confirm" || view.event.approvalPolicyCode !== "self_v1") {
                    markComplete(activeStep.id);
                  }
                }}
              />
            </div>
            <div data-testid="source-shell-continue-guidance">
              <ProgressActionDock
                action={canShowNext ? {
                  label: activeIndex >= flatSteps.length - 1
                    ? `Open ${view.stage.label} gate →`
                    : "Continue →",
                  onClick: goNext,
                  testId: "source-shell-progress-action",
                } : null}
                status={activeIndex >= flatSteps.length - 1
                  ? "Approval locked"
                  : "Continue locked"}
                detail={continueGuidance}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function ProgressActionDock({
  action,
  status,
  detail,
}: {
  action: { label: string; onClick: () => void; testId: string } | null;
  status: string;
  detail?: string | null;
}) {
  return (
    <div
      data-testid="source-shell-progress-dock"
      style={{
        background: ANALYTICS.CARD,
        border: `1px solid ${ANALYTICS.LINE_STRONG}`,
        borderRadius: 8,
        bottom: 16,
        boxShadow: "0 8px 28px rgba(12, 26, 58, 0.18)",
        boxSizing: "border-box",
        fontFamily: ANALYTICS.SANS,
        left: "max(16px, calc(50% - 250px))",
        padding: 6,
        position: "fixed",
        width: "min(500px, calc(100vw - 112px))",
        zIndex: 80,
      }}
    >
      {action ? (
        <button
          type="button"
          data-testid={action.testId}
          onClick={action.onClick}
          style={{
            background: ANALYTICS.GREEN_TEXT,
            border: `1px solid ${ANALYTICS.GREEN_TEXT}`,
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer",
            fontFamily: ANALYTICS.SANS,
            fontSize: 15,
            fontWeight: 800,
            minHeight: 48,
            padding: "10px 14px",
            textAlign: "center",
            width: "100%",
          }}
        >
          {action.label}
        </button>
      ) : (
        <div
          data-testid="source-shell-progress-status"
          role="status"
          style={{
            background: "#e8ebee",
            borderRadius: 6,
            color: ANALYTICS.INK_2,
            display: "grid",
            gap: 2,
            minHeight: 48,
            padding: "9px 12px",
          }}
        >
          <strong style={{ fontSize: 13 }}>{status}</strong>
          {detail ? <span style={{ fontSize: 12, lineHeight: 1.35 }}>{detail}</span> : null}
        </div>
      )}
    </div>
  );
}

function plainStageStepGroupLabel(label: string) {
  if (/inclusion|exclusion|scope/i.test(label)) return "What are we sourcing?";
  if (/baseline|evidence|data/i.test(label)) return "What evidence proves it?";
  if (/boundary|owner|approval/i.test(label)) return "Who signs off?";
  return label;
}

function StageReadyPanel({
  view,
  stageOperatingStatus,
  requiredEvidenceOpen,
  awardSowHandoffReadiness,
  onOpenApprovalPage,
  onOpenFiles,
}: {
  view: SourceEventShellView;
  stageOperatingStatus: StageOperatingStatus | null;
  requiredEvidenceOpen: number;
  awardSowHandoffReadiness?: SourceAwardSowHandoffReadiness | null;
  onOpenApprovalPage: () => void;
  onOpenFiles: () => void;
}) {
  const approvalRecorded = view.stage.approvalRecorded;
  const hasArtifactGaps = view.stage.artifactReadiness.blockerCount > 0;
  const hasReadinessGaps = hasArtifactGaps || requiredEvidenceOpen > 0;
  const gapSummary = [
    requiredEvidenceOpen > 0
      ? `${requiredEvidenceOpen} required evidence item${requiredEvidenceOpen === 1 ? "" : "s"}`
      : null,
    hasArtifactGaps
      ? `${view.stage.artifactReadiness.blockerCount} artifact review item${view.stage.artifactReadiness.blockerCount === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean).join(" and ");
  const stage08HandoffBlocked =
    awardSowHandoffReadiness !== null &&
    awardSowHandoffReadiness !== undefined &&
    !awardSowHandoffReadiness.readyForContract360Handoff;
  const primaryActionLabel = approvalRecorded
    ? "View approval record"
    : hasReadinessGaps
      ? "Review evidence"
      : view.stage.approvalCtaLabel;
  const primaryAction = approvalRecorded
    ? onOpenApprovalPage
    : hasReadinessGaps
      ? onOpenFiles
      : onOpenApprovalPage;
  const fileStatus = approvalRecorded
    ? hasArtifactGaps
      ? `${view.stage.artifactReadiness.blockerCount} file review gap${view.stage.artifactReadiness.blockerCount === 1 ? "" : "s"}`
      : "No blockers"
    : hasArtifactGaps
      ? `${view.stage.artifactReadiness.blockerCount} file review gap${view.stage.artifactReadiness.blockerCount === 1 ? "" : "s"}`
      : requiredEvidenceOpen > 0
        ? "No file review gaps"
        : "Ready for approval";
  return (
    <div
      data-testid="source-shell-stage-ready-panel"
      style={{
        display: "grid",
        gap: 18,
        maxWidth: "none",
        width: "100%",
      }}
    >
      <div>
        <div
          style={{
            color: hasReadinessGaps || stage08HandoffBlocked
              ? ANALYTICS.AMBER_TEXT
              : ANALYTICS.GREEN_TEXT,
            fontFamily: ANALYTICS.MONO,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          {approvalRecorded
            ? stage08HandoffBlocked
              ? "Stage approval recorded"
              : "Stage approved"
            : hasReadinessGaps
              ? "Inputs ready - evidence review open"
              : "Stage ready"}
        </div>
        <h2 style={{ fontSize: 20, lineHeight: 1.25, margin: 0 }}>
          {approvalRecorded
            ? `${view.stage.label} approval is recorded.`
            : hasReadinessGaps
              ? `Required inputs are complete, but ${gapSummary} remain.`
              : `All required evidence is ready for ${view.stage.label}.`}
        </h2>
        <p
          style={{
            color: ANALYTICS.INK_2,
            fontSize: 14,
            lineHeight: 1.5,
            margin: "8px 0 0",
            maxWidth: 650,
          }}
        >
          {approvalRecorded
            ? stage08HandoffBlocked
              ? "The stage approval remains recorded. Stage 08 handoff remains blocked until the contract-formation evidence gaps are resolved; this does not reopen or replace the approval."
              : hasArtifactGaps
              ? view.stage.approvalTraceState === "historical"
                ? "The event advanced before stage-level approval tracking captured a complete decision record. Current artifact gaps are follow-up remediation under today's controls; no duplicate approval is required."
                : "The stage decision is complete. Current artifact-review gaps remain visible for remediation; no duplicate approval is required."
              : "The stage decision is complete and no further approval is required. Open the approval record to review its rationale and audit trail."
            : hasReadinessGaps
              ? `${requiredEvidenceOpen > 0 ? `Required evidence remains open: ${requiredEvidenceOpen}. ` : ""}Review Files and accept client-final artifacts. The approval action appears only after the required evidence and artifact checks are complete.`
              : "The next step is the approval workspace. Review the captured evidence, record the decision, and advance the event from there."}
        </p>
      </div>
      {stageOperatingStatus ? (
        <StageOperatingStatusPanel status={stageOperatingStatus} embedded />
      ) : null}
      <div
        data-testid="source-stage-ready-status"
        style={{
          border: `1px solid ${ANALYTICS.LINE}`,
          borderRadius: 8,
          display: "grid",
          gap: 0,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          overflow: "hidden",
        }}
      >
        <StageReadyStatusDatum
          label="Stage inputs"
          value={`${view.stage.ready}/${view.stage.total} complete`}
          tone="good"
        />
        <StageReadyStatusDatum
          label="Files"
          value={fileStatus}
          tone={hasArtifactGaps ? "warn" : "good"}
        />
        <StageReadyStatusDatum
          label="Next"
          value={
            approvalRecorded
              ? stage08HandoffBlocked
                ? "Resolve Stage 08 handoff blockers"
                : hasArtifactGaps
                ? "Remediate current review gaps"
                : "No further approval required"
              : hasReadinessGaps
                ? "Review required evidence in Files"
                : "Open approval gate"
          }
          tone={hasReadinessGaps || stage08HandoffBlocked ? "warn" : "good"}
        />
      </div>
      {hasReadinessGaps && !approvalRecorded ? (
        <div
          data-testid="source-stage-ready-approval-blocker"
          style={{
            background: ANALYTICS.AMBER_TINT,
            border: `1px solid ${ANALYTICS.AMBER}`,
            borderRadius: 8,
            color: ANALYTICS.AMBER_TEXT,
            display: "grid",
            fontSize: 12,
            gap: 6,
            lineHeight: 1.45,
            padding: "10px 12px",
          }}
        >
          <strong
            style={{
              color: ANALYTICS.AMBER_TEXT,
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Approval gate blocker
          </strong>
          <span>
            Continue to approval is blocked until required evidence and
            client-final artifact review are complete.
          </span>
          {view.stage.artifactReadiness.blockers.slice(0, 3).map((blocker) => (
            <span key={blocker}>{blocker}</span>
          ))}
          {view.stage.artifactReadiness.blockerCount > 3 ? (
            <span>
              +{view.stage.artifactReadiness.blockerCount - 3} more in Files
            </span>
          ) : null}
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {approvalRecorded || hasReadinessGaps ? <button
          type="button"
          data-testid={
            approvalRecorded
              ? "source-stage-ready-view-approval"
              : hasReadinessGaps
                ? "source-stage-ready-primary-files"
                : "source-stage-ready-open-approval"
          }
          onClick={primaryAction}
          style={{
            ...BUTTON_STYLE,
            background: approvalRecorded ? ANALYTICS.INK : "#e8ebee",
            color: approvalRecorded ? "#fff" : ANALYTICS.INK_2,
            display: "inline-flex",
            justifyContent: "center",
            padding: "12px 16px",
            width: "fit-content",
          }}
        >
          {primaryActionLabel}
        </button> : null}
      </div>
      <ProgressActionDock
        action={!approvalRecorded && !hasReadinessGaps ? {
          label: `${view.stage.approvalCtaLabel} →`,
          onClick: onOpenApprovalPage,
          testId: "source-stage-ready-open-approval",
        } : null}
        status={approvalRecorded ? "Approval recorded" : "Approval locked"}
        detail={approvalRecorded
          ? "The decision is already recorded."
          : `${gapSummary} remain. Review evidence before approval.`}
      />
      <Link
        href={view.stage.approvalHref}
        style={{
          color: ANALYTICS.FAINT,
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 800,
          textDecoration: "none",
          textTransform: "uppercase",
          width: "max-content",
        }}
      >
        Copy/share approval workspace URL
      </Link>
    </div>
  );
}

function StageReadyStatusDatum({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn";
}) {
  return (
    <div
      style={{
        background:
          tone === "good" ? "rgba(17, 120, 84, 0.055)" : ANALYTICS.AMBER_TINT,
        borderRight: `1px solid ${ANALYTICS.LINE_SOFT}`,
        display: "grid",
        gap: 4,
        minWidth: 0,
        padding: "11px 12px",
      }}
    >
      <span
        style={{
          color: ANALYTICS.FAINT,
          fontFamily: ANALYTICS.MONO,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <strong
        style={{
          color: tone === "good" ? ANALYTICS.GREEN_TEXT : ANALYTICS.AMBER_TEXT,
          fontSize: 12.5,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/** Keep guide and upload readback names aligned with the published template map. */
function clientTemplateName(
  templateCode: string | null | undefined,
): string | null {
  if (!templateCode) return null;
  return templateFactMapByCode(templateCode)?.label ?? templateCode;
}

function ActiveStepNeedsPanel({
  step,
  isComplete,
  missingEvidence,
  eventId,
  onOpenFiles,
  onEvidenceReviewed,
}: {
  step: SourceShellStep;
  isComplete: boolean;
  missingEvidence?: StageEvidenceRequirementRow | null;
  eventId: string;
  onOpenFiles: () => void;
  onEvidenceReviewed: () => void;
}) {
  if (missingEvidence) {
    const { requirement, lifecycle, evidence, file } = missingEvidence;
    const currentEvidenceState =
      requiresRecordedSource(requirement) && !hasRecordedSource(evidence)
        ? "Not loaded"
        : evidence?.currentState ?? "Not Requested";
    const requiresHumanReview =
      lifecycle.parsed &&
      EVIDENCE_STATE_RANK[requirement.minimumState] > EVIDENCE_STATE_RANK.Parsed;
    return (
      <div
        data-testid="source-shell-active-step-needs"
        style={{
          border: `1px solid ${ANALYTICS.LINE}`,
          borderRadius: 8,
          background: ANALYTICS.CARD,
          margin: "0 0 16px 42px",
          padding: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <strong style={{ color: ANALYTICS.INK, fontSize: 13 }}>What Continue needs</strong>
          <span style={{ color: ANALYTICS.AMBER_TEXT, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
            Required evidence
          </span>
        </div>
        <div style={{ color: ANALYTICS.INK, fontSize: 14, fontWeight: 750, marginTop: 8 }}>
          {requirement.label}
        </div>
        <div style={{ color: ANALYTICS.MUTED, fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>
          {requirement.description}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
          <span>Source: {requirement.sourceSystems[0]}</span>
          <span>Needed: {requirement.minimumState}</span>
          <span>Now: {currentEvidenceState}</span>
        </div>
        {step.file && evidenceRequirementIdForTask({
          id: step.id,
          factTemplateCode: step.factTemplateCode ?? undefined,
        }) === requirement.requirementId ? (
          <div style={{ color: ANALYTICS.MUTED, fontSize: 12, marginTop: 8 }}>
            Stored: {step.file.name} · {step.file.meta}
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 10 }}>
          <a
            href={`/api/v1/source/${encodeURIComponent(eventId)}/evidence/${encodeURIComponent(requirement.requirementId)}/template`}
            style={TABLE_LINK_STYLE}
          >
            Download template
          </a>
          <button type="button" onClick={onOpenFiles} style={TABLE_BUTTON_STYLE}>
            Open Files to upload
          </button>
          {evidence?.applicabilityStatus !== undefined &&
            permitsAbsenceDeclaration(requirement.requirementId) &&
            (!file || hasAuditedAbsence(requirement, evidence)) ? (
              <EvidenceAbsenceControl
                eventId={eventId}
                requirement={requirement}
                declaredAbsent={hasAuditedAbsence(requirement, evidence)}
                onDecided={onEvidenceReviewed}
              />
            ) : null}
          {requiresHumanReview ? (
            <EvidenceReviewControl
              eventId={eventId}
              requirement={requirement}
              fileName={file?.name ?? requirement.label}
              onReviewed={onEvidenceReviewed}
            />
          ) : null}
        </div>
      </div>
    );
  }
  const need = activeStepNeed(step, isComplete);
  return (
    <div
      data-testid="source-shell-active-step-needs"
      style={{
        border: `1px solid ${ANALYTICS.LINE}`,
        borderRadius: 8,
        background: ANALYTICS.CARD,
        margin: "0 0 16px 42px",
        maxWidth: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "flex",
          gap: 10,
          justifyContent: "space-between",
          padding: "10px 12px",
        }}
      >
        <strong style={{ color: ANALYTICS.INK, fontSize: 13 }}>
          What Continue needs
        </strong>
        <span
          style={{
            border: `1px solid ${isComplete ? "rgba(17, 120, 84, 0.24)" : ANALYTICS.LINE}`,
            borderRadius: 999,
            color: isComplete ? ANALYTICS.GREEN_TEXT : ANALYTICS.AMBER_TEXT,
            fontFamily: ANALYTICS.MONO,
            fontSize: 10,
            fontWeight: 900,
            padding: "5px 8px",
            textTransform: "uppercase",
          }}
        >
          {isComplete ? "Done" : "Required"}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          padding: "11px 12px 8px",
        }}
      >
        <StepNeedDatum label="Needed" value={need.item} />
        <StepNeedDatum
          label={need.requiredness}
          value={need.requirement}
          tone={need.requiredness === "Required" ? "warn" : "default"}
        />
        <StepNeedDatum label="Source system" value={need.sourceSystem} />
        <StepNeedDatum label="Owner role" value={need.owner} />
      </div>
      <div
        style={{
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          padding: "9px 12px 11px",
        }}
      >
        <StepNeedDatum label="Grain / history" value={need.grainHistory} />
        <StepNeedDatum label="Formats" value={need.formats} />
        <StepNeedDatum label="Template" value={need.template} />
        <StepNeedDatum label="Parse target" value={need.parseTarget} />
      </div>
      <div
        style={{
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          padding: "9px 12px 11px",
        }}
      >
        <StepNeedDatum label="Artifact impact" value={need.artifactImpact} />
        <StepNeedDatum label="Readback" value={need.readback} />
        <StepNeedDatum label="Status" value={need.status} tone={need.tone} />
        <StepNeedDatum label="Next" value={need.nextAction} />
      </div>
      {step.template ? (
        <div
          style={{
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
            color: ANALYTICS.MUTED,
            fontSize: 12,
            lineHeight: 1.4,
            padding: "9px 12px",
          }}
        >
          Template: <strong>{step.template.name}</strong> · {step.template.meta}
        </div>
      ) : null}
      {step.file ? (
        <div
          style={{
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
            color: ANALYTICS.GREEN_TEXT,
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.4,
            padding: "9px 12px",
          }}
        >
          Uploaded: {step.file.name} · {step.file.meta}
        </div>
      ) : null}
    </div>
  );
}

function ActiveStepGuidePanel({
  step,
  stageLabel,
  isComplete,
  guidebook,
  onOpenGuidebook,
}: {
  step: SourceShellStep;
  stageLabel: string;
  isComplete: boolean;
  guidebook: SourceStageGuidebookRecord | null;
  onOpenGuidebook: () => void;
}) {
  const guide = activeStepGuide(step, stageLabel, isComplete, guidebook);
  return (
    <div
      data-testid="source-shell-active-step-guide"
      style={{
        border: `1px solid ${ANALYTICS.LINE}`,
        borderRadius: 8,
        background: ANALYTICS.CARD,
        margin: "0 0 16px 42px",
        maxWidth: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          padding: "10px 12px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <strong style={{ color: ANALYTICS.INK, fontSize: 13 }}>
            Run this step
          </strong>
          <div
            style={{
              color: ANALYTICS.MUTED,
              fontSize: 12,
              lineHeight: 1.35,
              marginTop: 3,
              overflowWrap: "anywhere",
            }}
          >
            {guide.session}
          </div>
        </div>
        <button
          type="button"
          aria-label="Open full guidebook"
          onClick={onOpenGuidebook}
          style={{
            ...BUTTON_STYLE,
            fontSize: 11,
            minHeight: 32,
            padding: "0 10px",
            whiteSpace: "nowrap",
          }}
        >
          Guidebook
        </button>
      </div>
      <p
        style={{
          color: ANALYTICS.INK_2,
          fontSize: 12.5,
          lineHeight: 1.45,
          margin: 0,
          padding: "10px 12px 0",
        }}
      >
        {guide.brief}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          padding: "11px 12px 12px",
        }}
      >
        <StepNeedDatum label="Invite" value={guide.invite} />
        <StepNeedDatum label="Collect" value={guide.collect} />
        <StepNeedDatum label="Template" value={guide.template} />
        <StepNeedDatum
          label="Unlock"
          value={guide.unlock}
          tone={isComplete ? "good" : "warn"}
        />
      </div>
    </div>
  );
}

function StepNeedDatum({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? ANALYTICS.GREEN_TEXT
      : tone === "warn"
        ? ANALYTICS.AMBER_TEXT
        : ANALYTICS.INK;
  return (
    <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
      <span
        style={{
          color: ANALYTICS.FAINT,
          fontFamily: ANALYTICS.MONO,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <strong
        style={{
          color,
          fontSize: 12.5,
          lineHeight: 1.32,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function activeStepNeed(
  step: SourceShellStep,
  isComplete: boolean,
): ActiveStepNeedView {
  const requirement = stepRequirementFor(step);
  const isSelfStrategy = step.id === "strategy.confirm" &&
    step.approvalPolicyCode === "self_v1";
  const uploaded = Boolean(step.file);
  const status = isComplete
    ? "Complete"
    : step.type === "provide"
      ? uploaded
        ? "Uploaded"
        : "Missing"
      : "Needs review";
  const tone: "good" | "warn" = isComplete || uploaded ? "good" : "warn";
  const readback = stepReadbackLabel(step, isComplete, uploaded);
  return {
    item: requirement.item,
    requiredness: requirement.requiredness ?? "Required",
    requirement: requirement.requirement,
    sourceSystem: isSelfStrategy ? requirement.sourceSystem : step.provenance?.source ?? requirement.sourceSystem,
    owner: isSelfStrategy ? requirement.ownerRole : step.provenance?.owner ?? requirement.ownerRole,
    formats: requirement.acceptedFormats,
    grainHistory: requirement.grainHistory,
    template: step.template?.name ?? requirement.templateLabel,
    parseTarget: requirement.parseTarget,
    artifactImpact: requirement.artifactImpact,
    status,
    readback,
    tone,
    nextAction: activeStepNextAction(step, isComplete, uploaded, requirement),
  };
}

function stepReadbackLabel(
  step: SourceShellStep,
  isComplete: boolean,
  uploaded: boolean,
): string {
  if (isComplete && step.id === "scope.prior-baseline") {
    return "Readback: baseline requirement resolved from governed evidence.";
  }
  if (isComplete) {
    switch (step.sourceBasis) {
      case "live_fact":
        return "Readback: typed facts available.";
      case "live_artifact":
        return "Readback: file stored in Source.";
      case "computed":
        return "Readback: workflow confirmation captured.";
      case "archetype":
        return "Readback: archetype support only.";
      case "sample":
        return "Readback: sample support only.";
      case "missing":
        return "Readback: captured, evidence state unclear.";
    }
  }
  if (uploaded) {
    return step.factTemplateCode
      ? "Readback: file stored; typed facts still pending."
      : "Readback: file stored; review still pending.";
  }
  if (step.type === "provide") {
    return step.factTemplateCode
      ? "Readback: no typed facts yet."
      : "Readback: no file yet.";
  }
  return "Readback: waiting for review.";
}

function stepRequirementFor(step: SourceShellStep): WorkflowStepRequirement {
  if (step.id === "strategy.confirm" && step.approvalPolicyCode === "self_v1") {
    return SELF_STRATEGY_REQUIREMENT;
  }
  const catalogRequirement = STEP_REQUIREMENTS[step.id];
  if (catalogRequirement) return catalogRequirement;

  const templateCode = factTemplateCodeForTask(step);
  const sourceSystem =
    step.provenance?.source ??
    (step.type === "provide" ? "Client upload" : "Current stage evidence");
  const ownerRole = step.provenance?.owner ?? "Stage owner";
  const acceptedFormats =
    step.type === "provide"
      ? "CSV or XLSX"
      : step.template
        ? `${step.template.format} template`
        : "No upload required";
  const parseTarget = templateCode
    ? `${templateCode} parsed facts`
    : step.type === "provide"
      ? "Registered Source artifact"
      : "Approval-ready decision evidence";

  return {
    item: activeStepNeedItem(step),
    requiredness: "Required",
    requirement:
      step.type === "provide"
        ? "1 required file"
        : step.type === "decide"
          ? "1 required decision"
          : "1 required confirmation",
    sourceSystem,
    ownerRole,
    acceptedFormats,
    grainHistory:
      step.type === "provide"
        ? "Use the template grain for this stage"
        : "One reviewed decision for this stage",
    templateLabel:
      step.template?.name ??
      (step.type === "provide"
        ? "Stage evidence template"
        : "No upload template"),
    parseTarget,
    artifactImpact:
      step.type === "provide"
        ? "Updates stage evidence, intelligence, and generated artifacts"
        : "Updates stage gate readiness and audit evidence",
    missingAction:
      step.type === "provide"
        ? "Upload the required file below."
        : step.type === "decide"
          ? "Record the decision, then Continue."
          : "Review the evidence, then confirm.",
  };
}

function activeStepNeedItem(step: SourceShellStep): string {
  const cleanTitle = step.title.replace(
    /^(provide|upload|confirm|decide|review)\s+(the\s+)?/i,
    "",
  );
  const label = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  if (step.type === "provide") return `${label} file`;
  if (step.type === "decide") return `${label} decision`;
  return `${label} review`;
}

function activeStepNextAction(
  step: SourceShellStep,
  isComplete: boolean,
  uploaded: boolean,
  requirement: WorkflowStepRequirement,
): string {
  if (isComplete) {
    if (requirement.completeAction) return requirement.completeAction;
    switch (step.sourceBasis) {
      case "live_fact":
        return "Facts available; Continue.";
      case "live_artifact":
        return "File stored; verify Files.";
      case "computed":
        return "Input captured; Continue.";
      default:
        return "Continue is enabled.";
    }
  }
  if (step.type === "provide") {
    if (uploaded) {
      return (
        requirement.uploadedAction ?? "Review the parsed result, then Continue."
      );
    }
    return requirement.missingAction;
  }
  return requirement.missingAction;
}

function activeStepContinueGuidance(
  step: SourceShellStep,
  isComplete: boolean,
  activeIndex: number,
  stepCount: number,
  stageLabel: string,
): string {
  const requirement = stepRequirementFor(step);
  const uploaded = Boolean(step.file);
  if (!isComplete) {
    return `Locked: ${activeStepNextAction(step, false, uploaded, requirement)}`;
  }
  if (activeIndex >= stepCount - 1) {
    return `Ready: open the ${stageLabel} approval gate.`;
  }
  return "Ready: continue to the next step.";
}

function activeStepGuide(
  step: SourceShellStep,
  stageLabel: string,
  isComplete: boolean,
  guidebook: SourceStageGuidebookRecord | null,
) {
  const need = activeStepNeed(step, isComplete);
  const session = guidebook
    ? `${guidebook.title} · ${guidebook.durationMinutes} min`
    : `${stageLabel} working session`;
  const brief = firstSentence(
    guidebook?.purpose ||
      guidebook?.sections.find((section) => section.type === "purpose")?.body ||
      step.help,
  );
  const collect =
    step.type === "provide" ? need.item : firstSentence(step.help);
  const template = step.template
    ? `${step.template.name} (${step.template.format})`
    : step.id === "scope.prior-baseline"
      ? "Prior record or absence decision"
    : step.type === "provide"
      ? "Upload file"
      : "No template";
  return {
    session,
    brief,
    invite: `${need.owner} + stage approver`,
    collect,
    template,
    unlock: isComplete ? "Continue is enabled" : need.nextAction,
  };
}

function firstSentence(value: string): string {
  const cleaned = value
    .replace(/[`*_>#]/g, "")
    .replace(/^\s*[-\d.]+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = cleaned.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? cleaned).trim();
}

function StepDetail({
  step,
  eventId,
  stageKey,
  stepInsight,
  isComplete,
  missingEvidence,
  onComplete,
}: {
  step: SourceEventShellView["stage"]["activeStep"];
  eventId: string;
  stageKey: SourceStageKey;
  stepInsight: SourceEventShellView["intelligence"]["stepInsight"];
  isComplete: boolean;
  missingEvidence?: StageEvidenceRequirementRow | null;
  onComplete: () => void;
}) {
  const router = useRouter();
  const [actionState, setActionState] = useState<
    | { phase: "idle" }
    | { phase: "saving" }
    | { phase: "error"; message: string }
  >({ phase: "idle" });
  const [uploadReadback, setUploadReadback] =
    useState<TaskProvideUploadReadback | null>(null);
  const activeStepId = step?.id;
  useEffect(() => {
    setUploadReadback(null);
  }, [activeStepId]);
  if (!step) return null;
  const activeStep = step;
  const evidenceRequirementId = evidenceRequirementIdForTask({
    id: activeStep.id,
    factTemplateCode: activeStep.factTemplateCode ?? undefined,
  });
  if (missingEvidence && (
    activeStep.type !== "provide" ||
    evidenceRequirementId !== missingEvidence.requirement.requirementId
  )) {
    return null;
  }
  const isStrategyConfirmation =
    stageKey === "strategy" && activeStep.id === "strategy.confirm" &&
    activeStep.approvalPolicyCode === "self_v1";
  const canPersistAction = isStrategyConfirmation
    ? Boolean(activeStep.confirmationVersion)
    : activeStep.type !== "provide" && Boolean(evidenceRequirementId);
  const evidenceRow = (
    <ActiveStepRequirementRow
      step={activeStep}
      isComplete={isComplete}
      factTemplateCode={factTemplateCodeForTask(activeStep)}
    />
  );

  async function completeStepAction(): Promise<void> {
    if (!canPersistAction) return;
    setActionState({ phase: "saving" });
    let response: Response;
    try {
      response = isStrategyConfirmation
        ? await fetch(`/api/v1/source/${encodeURIComponent(eventId)}/strategy-confirmation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ version: activeStep.confirmationVersion, confirmed: true }),
          })
        : await fetch(
            `/api/v1/source/${encodeURIComponent(eventId)}/evidence/${encodeURIComponent(
              evidenceRequirementId!,
            )}/answer`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                stage: stageKey,
                answer: `${activeStep.title}: ${activeStep.help}`,
              }),
            },
          );
    } catch (error) {
      setActionState({
        phase: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not save this step action.",
      });
      return;
    }

    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      detail?: string;
      error?: string;
    } | null;
    if (!response.ok || !payload?.ok) {
      setActionState({
        phase: "error",
        message:
          payload?.detail ??
          payload?.error ??
          `Could not save this step action (${response.status}).`,
      });
      return;
    }

    if (!isStrategyConfirmation) onComplete();
    setActionState({ phase: "idle" });
    router.refresh();
  }

  const actionButton = isStrategyConfirmation && !activeStep.confirmationVersion ? (
    <span style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>
      A governed Event Owner confirmation is required for this step.
    </span>
  ) : canPersistAction ? (
    <StepActionButton
      saving={actionState.phase === "saving"}
      onClick={completeStepAction}
    >
      {step.cta}
    </StepActionButton>
  ) : (
    <ActionButton onClick={onComplete}>{step.cta}</ActionButton>
  );
  const actionError =
    actionState.phase === "error" ? (
      <div
        role="alert"
        style={{
          marginTop: 10,
          padding: "9px 12px",
          borderRadius: 8,
          border: `1px solid ${ANALYTICS.AMBER}`,
          background: "rgba(180,120,10,0.06)",
          color: ANALYTICS.AMBER_TEXT,
          fontSize: 12.5,
          lineHeight: 1.45,
          maxWidth: 680,
        }}
      >
        {actionState.message}
      </div>
    ) : null;

  if (activeStep.rows.length > 0) {
    return (
      <div style={{ marginLeft: 42, maxWidth: "none" }}>
        {evidenceRow}
        <div
          style={{
            border: `1px solid ${ANALYTICS.LINE}`,
            borderRadius: 8,
            overflow: "hidden",
            maxWidth: "none",
          }}
        >
          {activeStep.rows.map((row, index) => (
            <div
              key={`${row.key}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                padding: "10px 12px",
                borderTop:
                  index === 0 ? "none" : `1px solid ${ANALYTICS.LINE_SOFT}`,
                color: ANALYTICS.INK_2,
                fontSize: 13,
              }}
            >
              <span>{row.key}</span>
              <b
                style={{
                  color: row.flag ? ANALYTICS.AMBER_TEXT : ANALYTICS.INK,
                }}
              >
                {row.value}
              </b>
            </div>
          ))}
          <div
            style={{
              padding: "12px",
              borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
            }}
          >
            {actionButton}
            {actionError}
          </div>
        </div>
      </div>
    );
  }

  if (activeStep.type === "provide") {
    const factTemplateCode = factTemplateCodeForTask(activeStep);
    // Real per-vendor lever-coverage data, when it exists — never a
    // fabricated file/requirements-completeness table. Gated on the exact
    // factTemplateCode this step's upload parses into (not a title guess)
    // and on the insight being genuinely live (real response_addressed
    // facts exist), matching this codebase's own model-vs-live discipline.
    const vendorCoverage =
      factTemplateCode === "RESPONSE_COVERAGE_V1" &&
      stepInsight?.kind === "response_coverage" &&
      !stepInsight.isModel &&
      stepInsight.vendors &&
      stepInsight.vendors.length > 0
        ? stepInsight.vendors
        : null;
    return (
      <div style={{ marginLeft: 42, maxWidth: "none" }}>
        {evidenceRow}
        {factTemplateCode ? (
          <TemplateDownloadLink
            eventId={eventId}
            factTemplateCode={factTemplateCode}
          />
        ) : null}
        <TaskProvideUpload
          signed={/letter|commit/i.test(activeStep.title)}
          eventId={eventId}
          stageKey={stageKey}
          factTemplateCode={factTemplateCode}
          evidenceRequirementId={activeStep.id === "scope.app-inventory" ? "EVID-SRC-SCOPE-APP-INV" : activeStep.id === "scope.prior-baseline" ? "EVID-SRC-SCOPE-FY-CONTRACT" : undefined}
          onUploaded={activeStep.id === "scope.sponsor" || activeStep.id === "scope.app-inventory" || activeStep.id === "scope.prior-baseline" ? () => router.refresh() : onComplete}
          onUploadReadback={setUploadReadback}
        />
        <ActiveStepUploadReadback
          readback={uploadReadback}
          factTemplateCode={factTemplateCode}
        />
        {stageKey === "scope" && activeStep.id === "scope.sponsor" && !isComplete ? (
          <>
            <SponsorDelegationControl eventId={eventId} />
            <SponsorReviewRequest eventId={eventId} />
          </>
        ) : null}
        {vendorCoverage ? (
          <VendorResponseCoverageList vendors={vendorCoverage} />
        ) : null}
      </div>
    );
  }

  if (isComplete) {
    return (
      <div
        style={{
          color: ANALYTICS.GREEN_TEXT,
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        Complete
      </div>
    );
  }

  return (
    <div style={{ marginLeft: 42 }}>
      {evidenceRow}
      {actionButton}
      {actionError}
    </div>
  );
}

function ActiveStepUploadReadback({
  readback,
  factTemplateCode,
}: {
  readback: TaskProvideUploadReadback | null;
  factTemplateCode?: string;
}) {
  if (!readback) return null;
  const factStatus =
    readback.factsWritten === null
      ? "Registry-only upload; no typed fact template on this step."
      : `${readback.factsWritten} typed fact${
          readback.factsWritten === 1 ? "" : "s"
        } written${
          factTemplateCode ? ` through ${clientTemplateName(factTemplateCode)}` : ""
        }.`;
  const issues: string[] = [];
  if (readback.unmappedColumns.length > 0) {
    issues.push(
      `${readback.unmappedColumns.length} unmapped column${
        readback.unmappedColumns.length === 1 ? "" : "s"
      }`,
    );
  }
  if ((readback.rejectedRowCount ?? 0) > 0) {
    issues.push(
      `${readback.rejectedRowCount} rejected cell${
        readback.rejectedRowCount === 1 ? "" : "s"
      }`,
    );
  }
  return (
    <div
      data-testid="source-active-upload-readback"
      role="status"
      style={{
        border: `1px solid rgba(17, 120, 84, 0.24)`,
        borderRadius: 8,
        background: "rgba(20,140,90,0.055)",
        color: ANALYTICS.INK_2,
        display: "grid",
        gap: 8,
        marginTop: 10,
        padding: "11px 12px",
        fontSize: 12.5,
        lineHeight: 1.4,
      }}
    >
      <strong style={{ color: ANALYTICS.GREEN_TEXT, fontSize: 13 }}>
        Upload readback
      </strong>
      <span>
        <b style={{ color: ANALYTICS.INK }}>File stored:</b>{" "}
        {readback.originalName} ({readback.format}
        {readback.parseStatus ? `, ${readback.parseStatus}` : ""})
      </span>
      <span>
        <b style={{ color: ANALYTICS.INK }}>Typed facts:</b> {factStatus}
      </span>
      <span>
        <b style={{ color: ANALYTICS.INK }}>Issues:</b>{" "}
        {issues.length > 0 ? issues.join(" · ") : "None reported by parser."}
      </span>
      <span>
        <b style={{ color: ANALYTICS.INK }}>Refresh impact:</b>{" "}
        {readback.refreshed
          ? "Stage evidence, Files, Intelligence, and generated artifacts can reread this source."
          : "File is stored; update the template before facts can refresh."}
      </span>
    </div>
  );
}

function ActiveStepRequirementRow({
  step,
  isComplete,
  factTemplateCode,
}: {
  step: SourceShellStep;
  isComplete: boolean;
  factTemplateCode?: string;
}) {
  const need = activeStepNeed(step, isComplete);
  const requirement = stepRequirementFor(step);
  const format =
    factTemplateCode && step.type === "provide"
      ? requirement.acceptedFormats
      : step.file
        ? step.file.format
        : requirement.acceptedFormats;
  return (
    <div
      data-testid="source-active-requirement-row"
      style={{
        border: `1px solid ${ANALYTICS.LINE}`,
        borderRadius: 8,
        marginBottom: 14,
        maxWidth: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: ANALYTICS.PAGE_BG,
          borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          padding: "9px 12px",
        }}
      >
        <strong
          style={{
            color: ANALYTICS.INK,
            fontSize: 13,
            lineHeight: 1.25,
          }}
        >
          Evidence request
        </strong>
        <span
          style={{
            border: `1px solid ${
              isComplete ? "rgba(17, 120, 84, 0.24)" : ANALYTICS.AMBER
            }`,
            borderRadius: 999,
            color: isComplete ? ANALYTICS.GREEN_TEXT : ANALYTICS.AMBER_TEXT,
            fontFamily: ANALYTICS.MONO,
            fontSize: 9,
            fontWeight: 900,
            padding: "4px 8px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {isComplete ? "Accepted" : "Action needed"}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(190px, 1.15fr) minmax(160px, 0.9fr) minmax(130px, 0.75fr) minmax(105px, 0.55fr)",
          gap: 12,
          padding: "11px 12px",
        }}
      >
        <RequirementCell label="What to load" value={need.item} />
        <RequirementCell label="Source system" value={need.sourceSystem} />
        <RequirementCell label="Owner" value={need.owner} />
        <RequirementCell label="Format" value={format} />
      </div>
      <div
        style={{
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "grid",
          gridTemplateColumns:
            "minmax(170px, 1fr) minmax(155px, 0.85fr) minmax(150px, 0.85fr) minmax(115px, 0.55fr)",
          gap: 12,
          padding: "10px 12px 12px",
        }}
      >
        <RequirementCell label="Parse/writeback" value={need.parseTarget} />
        <RequirementCell label="Readback" value={need.readback} />
        <RequirementCell label="Next action" value={need.nextAction} />
        <RequirementCell label="Status" value={need.status} tone={need.tone} />
      </div>
    </div>
  );
}

function RequirementCell({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? ANALYTICS.GREEN_TEXT
      : tone === "warn"
        ? ANALYTICS.AMBER_TEXT
        : ANALYTICS.INK_2;
  return (
    <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
      <span
        style={{
          color: ANALYTICS.FAINT,
          fontFamily: ANALYTICS.MONO,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <b
        style={{
          color,
          fontSize: 12.5,
          lineHeight: 1.32,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </b>
    </span>
  );
}

/**
 * Real per-vendor value-lever coverage, inline in the Responses "ingest"
 * step body — reuses the same computed data the Intelligence tab's
 * response-coverage insight already shows, so there is one source of
 * truth for "which vendor addressed what," not two. Status is derived
 * from real addressed/partial/dodged/notYetAnswered counts, never from a
 * separate, unverified file-upload record.
 */
function VendorResponseCoverageList({
  vendors,
}: {
  vendors: readonly VendorCoverageView[];
}) {
  return (
    <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
      <div
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: ANALYTICS.FAINT,
        }}
      >
        Vendor coverage
      </div>
      {vendors.map((vendor) => {
        const engaged = vendor.addressed + vendor.partial;
        const status: "complete" | "partial" | "awaiting" =
          vendor.addressed === vendor.totalLevers
            ? "complete"
            : engaged > 0
              ? "partial"
              : "awaiting";
        const tone =
          status === "complete"
            ? { bg: ANALYTICS.GREEN_TINT, fg: ANALYTICS.GREEN_TEXT }
            : status === "partial"
              ? { bg: ANALYTICS.AMBER_TINT, fg: ANALYTICS.AMBER_TEXT }
              : { bg: "rgba(10,10,11,0.06)", fg: ANALYTICS.MUTED };
        return (
          <div
            key={vendor.vendorId}
            data-testid={`source-shell-vendor-coverage-${vendor.vendorId}`}
            style={{
              ...CARD_STYLE,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              {vendor.vendorId}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>
                {engaged} of {vendor.totalLevers} levers addressed
              </span>
              <span
                style={{
                  display: "inline-flex",
                  borderRadius: 999,
                  background: tone.bg,
                  color: tone.fg,
                  padding: "3px 8px",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                }}
              >
                {status === "complete"
                  ? "Complete"
                  : status === "partial"
                    ? "Partial"
                    : "Awaiting"}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StepDot({
  done = false,
  active = false,
}: {
  done?: boolean;
  active?: boolean;
}) {
  return (
    <span
      style={{
        width: active ? 26 : 18,
        height: active ? 26 : 18,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: done
          ? ANALYTICS.GREEN
          : active
            ? ANALYTICS.BLUE
            : ANALYTICS.CARD,
        color: done || active ? "#fff" : "transparent",
        border:
          done || active ? "none" : `1.5px solid ${ANALYTICS.LINE_STRONG}`,
        fontSize: 11,
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      {done ? "✓" : active ? "" : ""}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 8,
        background: ANALYTICS.INK,
        color: "#fff",
        cursor: "pointer",
        fontFamily: ANALYTICS.SANS,
        fontSize: 13,
        fontWeight: 800,
        padding: "11px 16px",
      }}
    >
      {children}
    </button>
  );
}

function StepActionButton({
  children,
  saving,
  onClick,
}: {
  children: ReactNode;
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      style={{
        border: "none",
        borderRadius: 8,
        background: saving ? ANALYTICS.FAINT : ANALYTICS.INK,
        color: "#fff",
        cursor: saving ? "wait" : "pointer",
        fontFamily: ANALYTICS.SANS,
        fontSize: 13,
        fontWeight: 800,
        padding: "11px 16px",
      }}
    >
      {saving ? "Saving..." : children}
    </button>
  );
}

function FilesWorkspace({
  view,
  artifacts,
  evidenceStates,
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
  artifacts: readonly SourceShellArtifactLike[];
  evidenceStates: readonly SourceEventEvidence[];
  onClientFinalAccepted: () => void;
}) {
  const operationByCode = useMemo(
    () =>
      new Map(
        listSourceArtifactOperations().map((operation) => [
          operation.artifactCode,
          operation,
        ]),
      ),
    [],
  );

  return (
    <section data-testid="source-shell-v2-files">
      <WorkspaceTitle
        eyebrow="Files & deliverables"
        title="Evidence ledger"
        subtitle="Every file stays tied to its event, stage, state, and source basis."
      />
      <StageEvidenceChecklistPanel
        view={view}
        evidenceStates={evidenceStates}
        onEvidenceReviewed={onClientFinalAccepted}
        onUploaded={onClientFinalAccepted}
      />
      <SessionEvidenceCapturePanel
        eventId={view.event.id}
        stageKey={view.event.viewedStageKey}
        stageLabel={view.event.viewedStageLabel}
        onUploaded={onClientFinalAccepted}
      />
      <EvidenceReadinessPanel files={view.files.items} />
      <ArtifactLifecyclePanel
        view={view}
        artifacts={artifacts}
        onClientFinalAccepted={onClientFinalAccepted}
      />
      {view.files.byStage.length === 0 ? (
        <EmptyCard text="No Source artifacts are registered for this event yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {view.files.byStage.map((group) => (
            <section
              key={group.stageKey}
              style={{ ...CARD_STYLE, padding: 18 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h2
                  style={{
                    fontFamily: ANALYTICS.SERIF,
                    fontSize: 21,
                    margin: 0,
                  }}
                >
                  {group.stageLabel}
                </h2>
                <span style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>
                  {group.items.length} item{group.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 10,
                }}
              >
                {group.items.map((item) => (
                  <FileCard
                    key={item.id}
                    item={item}
                    eventId={view.event.id}
                    operation={operationByCode.get(item.artifactCode) ?? null}
                    onAccepted={onClientFinalAccepted}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function buildStageEvidenceRequirementRows(
  view: SourceEventShellView,
  evidenceStates: readonly SourceEventEvidence[],
): StageEvidenceRequirementRow[] {
  const requirements = evidenceForStage(view.stage.key).filter((row) =>
    sourceEvidenceAppliesToApprovalPolicy(row.requirementId, view.event.approvalPolicyCode)).sort((a, b) => {
    if (a.level !== b.level) return a.level === "required" ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
  const statesByRequirementId = new Map(
    evidenceStates.map((state) => [state.requirementId, state]),
  );

  return requirements.map((requirement) => {
    const evidence = statesByRequirementId.get(requirement.requirementId);
    const file = matchRequirementFile(requirement, evidence, view.files.items);
    const lifecycle = deriveSourceEvidenceLifecycle({
      requirement,
      evidence,
      artifact: file
        ? {
            parseStatus: file.parseStatus as SourceParseStatus | null,
            embeddingStatus:
              file.embeddingStatus as SourceEmbeddingStatus | null,
            approvalState: file.latestAcceptance ? "approved" : null,
          }
        : null,
    });
    const ready = requirementMeetsMinimum(requirement, evidence, lifecycle);
    const uploaded = requirementHasUploadedEvidence(requirement, lifecycle, evidence, file);
    return { requirement, evidence, file, lifecycle, ready, uploaded };
  });
}

function sourceArtifactStatesFromFiles(
  files: readonly SourceShellFileItem[],
  view: SourceEventShellView,
): SourceEventArtifactState[] {
  return files.flatMap((file) => {
    const stage = normalizeSourceStageKey(file.stageKey);
    if (!stage) return [];
    const accepted = Boolean(file.latestAcceptance);
    const locked = /locked/i.test(file.state);
    const approved = accepted || /approved|client_final/i.test(file.state);
    const status: SourceEventArtifactState["status"] = locked
      ? "locked"
      : approved
        ? "approved"
        : "not_started";

    return [
      {
        id: file.id,
        sourceEventId: view.event.id,
        tenantKey: view.event.accountName,
        artifactCode: file.artifactCode,
        stage,
        family: "scope_document",
        tier: "stub",
        status,
        requirementLevel:
          file.artifactRole === "authoritative" ? "required" : "optional",
        gateDefining: file.artifactRole === "authoritative",
        linkedArtifactId: null,
        notes: null,
        body: null,
        bodyFormat: "markdown",
        bodyAuthoredBy: null,
        bodyUpdatedAt: null,
        bodyGenerationMetadata: null,
        createdAt: "",
        updatedAt: "",
      } satisfies SourceEventArtifactState,
    ];
  });
}

function virtualGateCriteriaForStage(
  view: SourceEventShellView,
): SourceEventGateCriterion[] {
  return criteriaForStage(view.stage.key).map((criterion, index) => ({
    id: `${view.event.id}:${criterion.criterionId}`,
    sourceEventId: view.event.id,
    tenantKey: view.event.accountName,
    criterionId: criterion.criterionId,
    fromStage: criterion.fromStage,
    toStage: criterion.toStage,
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: `virtual-${index}`,
    updatedAt: `virtual-${index}`,
  }));
}

function StageEvidenceChecklistPanel({
  view,
  evidenceStates,
  onEvidenceReviewed,
  onUploaded,
}: {
  view: SourceEventShellView;
  evidenceStates: readonly SourceEventEvidence[];
  onEvidenceReviewed: () => void;
  onUploaded: () => void;
}) {
  const rows = buildStageEvidenceRequirementRows(view, evidenceStates);
  const supportsApplicability = evidenceStates.some(
    (state) => state.applicabilityStatus !== undefined);
  const requiredRows = rows.filter(
    (row) => row.requirement.level === "required",
  );
  const requiredReady = requiredRows.filter((row) => row.ready).length;
  const hasDeclaredAbsence = requiredRows.some((row) =>
    hasAuditedAbsence(row.requirement, row.evidence));
  const allRequiredReady =
    requiredRows.length > 0 && requiredReady === requiredRows.length;

  return (
    <section
      data-testid="source-stage-evidence-checklist"
      style={{
        ...CARD_STYLE,
        padding: 16,
        marginBottom: 16,
        boxShadow: "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 16,
          alignItems: "start",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={WORKSPACE_EYEBROW}>What this stage needs</div>
          <h2
            style={{
              margin: "5px 0 0",
              fontFamily: ANALYTICS.SERIF,
              fontSize: 21,
              letterSpacing: 0,
            }}
          >
            {requiredReady} of {requiredRows.length} required {hasDeclaredAbsence
              ? "items resolved"
              : "evidence items ready"}
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: ANALYTICS.MUTED,
              fontSize: 13,
              lineHeight: 1.45,
              maxWidth: 760,
            }}
          >
            Required rows unlock the Continue and approval path. Optional rows
            improve confidence, scoring, and negotiation leverage.
          </p>
        </div>
        <ReadinessChip
          label={allRequiredReady ? "approval ready" : "evidence open"}
          tone={allRequiredReady ? "good" : "warn"}
        />
      </div>

      {rows.length === 0 ? (
        <div style={{ color: ANALYTICS.MUTED, fontSize: 13 }}>
          No evidence checklist has been registered for this stage.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            aria-label={`${view.stage.label} evidence checklist`}
            style={{ ...FILE_USE_TABLE, minWidth: 1180 }}
          >
            <thead>
              <tr>
                <th style={{ ...FILE_TH, textAlign: "left" }}>Evidence</th>
                <th style={FILE_TH}>Need</th>
                <th style={{ ...FILE_TH, textAlign: "left" }}>Source</th>
                <th style={{ ...FILE_TH, textAlign: "left" }}>Owner</th>
                <th style={FILE_TH}>Formats</th>
                <th style={{ ...FILE_TH, textAlign: "left" }}>
                  Expected upload
                </th>
                <th style={FILE_TH}>Template</th>
                <th style={FILE_TH}>Upload</th>
                <th style={FILE_TH}>Parse</th>
                <th style={FILE_TH}>Done</th>
                <th style={{ ...FILE_TH, textAlign: "left" }}>Next</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(
                ({
                  requirement,
                  evidence,
                  file,
                  lifecycle,
                  ready,
                  uploaded,
                }) => {
                  const missingRecordedSource =
                    requiresRecordedSource(requirement) &&
                    !hasRecordedSource(evidence);
                  const requiresHumanReview =
                    lifecycle.parsed &&
                    !ready &&
                    EVIDENCE_STATE_RANK[requirement.minimumState] >
                      EVIDENCE_STATE_RANK.Parsed;
                  const declaredAbsent = hasAuditedAbsence(requirement, evidence);
                  return (
                    <tr
                      key={requirement.requirementId}
                      data-testid={`source-stage-evidence-checklist-row-${requirement.requirementId}`}
                    >
                      <td style={FILE_TD_LABEL}>
                        <strong>{requirement.label}</strong>
                        <span>{requirement.description}</span>
                      </td>
                      <td style={FILE_TD_CENTER}>
                        <ReadinessChip
                          label={
                            requirement.level === "required"
                              ? "required"
                              : "optional"
                          }
                          tone={
                            requirement.level === "required"
                              ? "warn"
                              : "neutral"
                          }
                        />
                      </td>
                      <td style={FILE_TD_ACTION}>
                        <strong>{requirement.sourceSystems[0]}</strong>
                        <span>
                          {requirement.sourceSystems.slice(1, 3).join(", ")}
                        </span>
                      </td>
                      <td style={FILE_TD_ACTION}>
                        <strong>{ownerRoleForRequirement(requirement)}</strong>
                        <span>{requirement.sourceLabel}</span>
                      </td>
                      <td style={FILE_TD_CENTER}>
                        {requirement.acceptedFileTypes
                          .map((type) => type.toUpperCase())
                          .join(", ")}
                      </td>
                      <td style={FILE_TD_ACTION}>
                        <span>{expectedUploadForRequirement(requirement)}</span>
                      </td>
                      <td style={FILE_TD_CENTER}>
                        <a
                          href={`/api/v1/source/${encodeURIComponent(view.event.id)}/evidence/${encodeURIComponent(requirement.requirementId)}/template`}
                          style={TABLE_LINK_STYLE}
                        >
                          Template
                        </a>
                      </td>
                      <td style={FILE_TD_CENTER}>
                        <div
                          style={{
                            display: "grid",
                            justifyItems: "center",
                            gap: 6,
                          }}
                        >
                          {uploaded ? (
                            <span
                              aria-label="File uploaded"
                              title="File uploaded"
                              style={{
                                display: "inline-grid",
                                gridTemplateColumns: "16px auto",
                                alignItems: "center",
                                gap: 5,
                                color: ANALYTICS.GREEN_TEXT,
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: "uppercase",
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  display: "inline-grid",
                                  placeItems: "center",
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  background: ANALYTICS.GREEN_TEXT,
                                  color: "#fff",
                                  fontSize: 10,
                                }}
                              >
                                ✓
                              </span>
                              Uploaded
                            </span>
                          ) : null}
                          <EvidenceRequirementUploadControl
                            eventId={view.event.id}
                            requirement={requirement}
                            uploaded={uploaded}
                            onUploaded={onUploaded}
                          />
                        </div>
                      </td>
                      <td style={FILE_TD_CENTER}>
                        <ReadinessChip
                          label={declaredAbsent ? "not applicable" : parseLabelForRequirement(requirement, lifecycle, evidence)}
                          tone={
                            declaredAbsent ||
                            (!missingRecordedSource &&
                              (lifecycle.parsed ||
                                evidence?.currentState === "Available" ||
                                evidence?.currentState === "Usable Evidence"))
                              ? "good"
                              : lifecycle.uploaded
                                ? "warn"
                                : "neutral"
                          }
                        />
                      </td>
                      <td style={FILE_TD_CENTER}>
                        <span
                          aria-label={ready ? "Done" : "Open"}
                          title={ready ? "Done" : "Open"}
                          style={{
                            display: "inline-grid",
                            placeItems: "center",
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            background: ready
                              ? ANALYTICS.GREEN_TEXT
                              : ANALYTICS.CARD,
                            color: ready ? "#fff" : ANALYTICS.FAINT,
                            border: ready
                              ? "none"
                              : `1px solid ${ANALYTICS.LINE_STRONG}`,
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {ready ? "✓" : ""}
                        </span>
                      </td>
                      <td style={FILE_TD_ACTION}>
                        <strong>{declaredAbsent ? "Not applicable" : ready ? "Ready" : "Open"}</strong>
                        <span>
                          {declaredAbsent
                            ? evidence?.applicabilityReason
                            : ready
                            ? "Use in stage review and approval."
                            : nextActionForRequirement(requirement, lifecycle)}
                        </span>
                        {supportsApplicability && permitsAbsenceDeclaration(requirement.requirementId) &&
                          (!uploaded || declaredAbsent) ? (
                            <EvidenceAbsenceControl
                              eventId={view.event.id}
                              requirement={requirement}
                              declaredAbsent={declaredAbsent}
                              onDecided={onEvidenceReviewed}
                            />
                          ) : null}
                        {requiresHumanReview ? (
                          <EvidenceReviewControl
                            eventId={view.event.id}
                            requirement={requirement}
                            fileName={file?.name ?? requirement.label}
                            onReviewed={onEvidenceReviewed}
                          />
                        ) : null}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EvidenceRequirementUploadControl({
  eventId,
  requirement,
  uploaded,
  onUploaded,
}: {
  eventId: string;
  requirement: SourceEvidenceRequirement;
  uploaded: boolean;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  const upload = async (file: File) => {
    setPending(true);
    setError(null);
    setReceipt(null);
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("stageKey", requirement.stage);
    formData.append("evidenceRequirementId", requirement.requirementId);
    formData.append("dataClassification", "Internal");
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/upload`,
        { method: "POST", body: formData, credentials: "include" },
      );
      const payload = (await response.json().catch(() => null)) as
        | SourceSessionEvidenceUploadPayload
        | null;
      if (!response.ok || payload?.ok !== true || !payload.artifact?.id) {
        throw new Error(payload?.detail ?? payload?.error ?? `Upload failed with HTTP ${response.status}.`);
      }
      setReceipt(`Captured ${payload.artifact.originalName ?? file.name} · ${summarizeSubstrateSync(payload.substrateSync)}`);
      onUploaded();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={requirement.acceptedFileTypes.map((type) => `.${type}`).join(",")}
        aria-label={`${requirement.label} source file`}
        data-testid={`source-required-evidence-input-${requirement.requirementId}`}
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        style={TABLE_BUTTON_STYLE}
      >
        {pending ? "Uploading..." : uploaded ? "Upload more" : "Upload"}
      </button>
      {receipt ? (
        <span data-testid={`source-required-evidence-status-${requirement.requirementId}`} style={{ color: ANALYTICS.GREEN_TEXT, fontSize: 11 }}>
          {receipt}
        </span>
      ) : null}
      {error ? <span role="alert" style={{ color: ANALYTICS.RUST, fontSize: 11 }}>{error}</span> : null}
    </>
  );
}

function EvidenceAbsenceControl({
  eventId,
  requirement,
  declaredAbsent,
  onDecided,
}: {
  eventId: string;
  requirement: SourceEvidenceRequirement;
  declaredAbsent: boolean;
  onDecided: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subject = requirement.requirementId === "EVID-SRC-STR-INCUMBENT"
    ? "incumbent"
    : requirement.requirementId === "EVID-SRC-SCOPE-FY-CONTRACT"
      ? "prior contract or run-cost baseline"
      : requirement.requirementId === "EVID-SRC-SCOPE-CURRENT-SOW"
        ? "current SOW or change-order history"
      : "historical spend";
  const decision = declaredAbsent ? "applicable" : "not_applicable";

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/evidence/${encodeURIComponent(requirement.requirementId)}/applicability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, reason: reason.trim(), confirmsAbsence: confirmed }),
        },
      );
      const result = (await response.json()) as { detail?: string };
      if (!response.ok) throw new Error(result.detail ?? "The decision was not recorded.");
      setOpen(false);
      setReason("");
      setConfirmed(false);
      onDecided();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The decision was not recorded.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 7, marginTop: 6 }}>
      <button type="button" style={TABLE_BUTTON_STYLE} onClick={() => setOpen(!open)}>
        {declaredAbsent ? "Restore requirement" : `Declare no ${subject}`}
      </button>
      {open ? (
        <div style={{ display: "grid", gap: 8, maxWidth: 300 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span>{declaredAbsent ? "Reason to restore requirement" : `Reason no ${subject} exists`}</span>
            <textarea
              aria-label={declaredAbsent ? "Reason to restore requirement" : `Reason no ${subject} exists`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={2_000}
              style={{ width: "100%", border: `1px solid ${ANALYTICS.LINE_STRONG}`, padding: 7 }}
            />
          </label>
          {!declaredAbsent ? (
            <label style={{ display: "flex", gap: 7, alignItems: "start" }}>
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>I confirm no {subject} exists for this event. This is my accountable decision, not an uploaded record.</span>
            </label>
          ) : null}
          {reason.trim().length >= 24 && (declaredAbsent || confirmed) ? (
            <button type="button" style={TABLE_BUTTON_STYLE} onClick={submit} disabled={pending}>
              {pending ? "Recording..." : "Record applicability"}
            </button>
          ) : null}
          {error ? <span role="alert" style={{ color: ANALYTICS.AMBER_TEXT }}>{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function EvidenceReviewControl({
  eventId,
  requirement,
  fileName,
  onReviewed,
}: {
  eventId: string;
  requirement: SourceEvidenceRequirement;
  fileName: string;
  onReviewed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<{
    actionLabel: string;
    reviewer: {
      displayName: string;
      email: string;
      role: string;
    };
    targetState: string;
    disclaimer: string;
    sourceArtifactId?: string;
    sourceSha256?: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewUrl = `/api/v1/source/${encodeURIComponent(eventId)}/evidence/${encodeURIComponent(requirement.requirementId)}/availability-review`;

  const beginReview = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      const response = await fetch(reviewUrl, { credentials: "include" });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        detail?: string;
        error?: string;
        review?: typeof preview;
      } | null;
      if (!response.ok || payload?.ok !== true || !payload.review) {
        throw new Error(
          payload?.detail ??
            payload?.error ??
            `Evidence review preview failed with HTTP ${response.status}.`,
        );
      }
      setPreview(payload.review);
      setNote(requirement.requirementId === "EVID-SRC-SCOPE-APP-INV"
        ? `Reviewed ${fileName} as the operational service inventory for this Scope boundary. This does not validate costs or approve contractual terms.`
        : `Reviewed ${fileName} for evidence availability and confirmed that its parsed content is relevant to this workflow requirement. This is not legal, security, commercial, supplier, or finance approval.`);
      setOpen(true);
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Evidence review preview failed.",
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const submitReview = async () => {
    if (note.trim().length < 8) {
      setError("Record a short review rationale before confirming.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(reviewUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rationale: note.trim(),
          stage: requirement.stage,
          ...(requirement.requirementId === "EVID-SRC-SCOPE-APP-INV" ? {
            sourceArtifactId: preview?.sourceArtifactId,
            sourceSha256: preview?.sourceSha256,
          } : {}),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        detail?: string;
        error?: string;
      } | null;
      if (!response.ok || payload?.ok !== true) {
        throw new Error(
          payload?.detail ??
            payload?.error ??
            `Evidence review failed with HTTP ${response.status}.`,
        );
      }
      setOpen(false);
      setPreview(null);
      onReviewed();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Evidence review failed.",
      );
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <div style={{ display: "grid", gap: 6, marginTop: 7 }}>
        <button
          type="button"
          data-testid={`source-evidence-review-open-${requirement.requirementId}`}
          disabled={loadingPreview}
          onClick={() => void beginReview()}
          style={TABLE_BUTTON_STYLE}
        >
          {loadingPreview ? "Resolving reviewer..." : "Review parsed evidence"}
        </button>
        {error ? (
          <span role="alert" style={{ color: ANALYTICS.AMBER_TEXT }}>
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <form
      data-testid={`source-evidence-review-form-${requirement.requirementId}`}
      onSubmit={(event) => {
        event.preventDefault();
        void submitReview();
      }}
      style={{ display: "grid", gap: 6, marginTop: 7 }}
    >
      {preview ? (
        <div
          data-testid={`source-evidence-review-preview-${requirement.requirementId}`}
          style={{
            background: ANALYTICS.CARD,
            border: `1px solid ${ANALYTICS.LINE_STRONG}`,
            borderRadius: 6,
            color: ANALYTICS.MUTED,
            display: "grid",
            gap: 3,
            padding: 8,
          }}
        >
          <strong style={{ color: ANALYTICS.INK }}>
            {preview.actionLabel}
          </strong>
          <span>
            Reviewer: {preview.reviewer.displayName} ({preview.reviewer.email})
            · {preview.reviewer.role}
          </span>
          <span>Evidence state after review: {preview.targetState}</span>
          <span>{preview.disclaimer}</span>
        </div>
      ) : null}
      <textarea
        aria-label={`Review rationale for ${requirement.label}`}
        value={note}
        onChange={(event) => setNote(event.currentTarget.value)}
        rows={3}
        style={{
          border: `1px solid ${ANALYTICS.LINE_STRONG}`,
          borderRadius: 6,
          color: ANALYTICS.INK,
          font: "inherit",
          minWidth: 260,
          padding: 8,
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="submit" disabled={pending} style={TABLE_BUTTON_STYLE}>
          {pending ? "Recording..." : "Record evidence review"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setPreview(null);
            setError(null);
          }}
          style={{
            ...TABLE_BUTTON_STYLE,
            background: ANALYTICS.CARD,
            color: ANALYTICS.INK,
          }}
        >
          Cancel
        </button>
      </div>
      {error ? (
        <span role="alert" style={{ color: ANALYTICS.AMBER_TEXT }}>
          {error}
        </span>
      ) : null}
    </form>
  );
}

function matchRequirementFile(
  requirement: SourceEvidenceRequirement,
  evidence: SourceEventEvidence | undefined,
  files: readonly SourceShellFileItem[],
): SourceShellFileItem | null {
  if (evidence?.sourceArtifactId) {
    const linked = files.find((file) => file.id === evidence.sourceArtifactId);
    if (linked) return linked;
  }

  const stageFiles = files.filter(
    (file) => file.stageKey === requirement.stage,
  );
  return (
    stageFiles.find((file) =>
      fileMatchesRequirementTokens(file, requirement),
    ) ?? null
  );
}

function fileMatchesRequirementTokens(
  file: SourceShellFileItem,
  requirement: SourceEvidenceRequirement,
): boolean {
  const haystack =
    `${file.name} ${file.artifactCode} ${file.group}`.toLowerCase();
  return requirement.filenameTokens.some((token) =>
    haystack.includes(token.toLowerCase()),
  );
}

const EVIDENCE_STATE_RANK: Record<SourceEventEvidenceCurrentState, number> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

function requirementMeetsMinimum(
  requirement: SourceEvidenceRequirement,
  evidence: SourceEventEvidence | undefined,
  lifecycle: SourceEvidenceLifecycleResult,
): boolean {
  if (hasAuditedAbsence(requirement, evidence)) return true;
  if (requiresRecordedSource(requirement) && !hasRecordedSource(evidence)) return false;
  if (lifecycle.stageReady || lifecycle.meetsMinimumState) return true;
  return evidenceMeetsRequirement(requirement, evidence);
}

function requirementHasUploadedEvidence(
  requirement: SourceEvidenceRequirement,
  lifecycle: SourceEvidenceLifecycleResult,
  evidence: SourceEventEvidence | undefined,
  file: SourceShellFileItem | null,
): boolean {
  if (requiresRecordedSource(requirement) && !hasRecordedSource(evidence)) return false;
  if (file || lifecycle.uploaded || lifecycle.parsed) return true;
  if (!evidence) return false;
  return (
    (EVIDENCE_STATE_RANK[evidence.currentState] ?? -1) >=
    EVIDENCE_STATE_RANK.Loaded
  );
}

function parseLabelForRequirement(
  requirement: SourceEvidenceRequirement,
  lifecycle: SourceEvidenceLifecycleResult,
  evidence: SourceEventEvidence | undefined,
): string {
  if (requiresRecordedSource(requirement) && !hasRecordedSource(evidence)) {
    return "not loaded";
  }
  if (evidence?.currentState === "Usable Evidence") return "usable";
  if (evidence?.currentState === "Available") return "available";
  if (lifecycle.parsed) return "parsed";
  if (lifecycle.uploaded) return "loaded";
  return "not loaded";
}

function nextActionForRequirement(
  requirement: SourceEvidenceRequirement,
  lifecycle: SourceEvidenceLifecycleResult,
): string {
  if (!lifecycle.uploaded) return `Upload ${requirement.label}.`;
  return lifecycle.nextAction;
}

function expectedUploadForRequirement(
  requirement: SourceEvidenceRequirement,
): string {
  if (
    requirement.stage === "responses" &&
    requirement.evidenceClass === "supplier_offer"
  ) {
    return "One package per vendor; large PDFs are expected.";
  }
  if (requirement.stage === "pricing") {
    return "One workbook per vendor, or one consolidated model.";
  }
  if (requirement.stage === "evaluation") {
    return "One score export covering all vendors and criteria.";
  }
  if (requirement.stage === "scope" && requirement.evidenceClass === "usage") {
    return "One to three exports: ticket volumes, SLA misses, backlog.";
  }
  if (requirement.stage === "scope") {
    return "One controlled workbook/export for the full scope boundary.";
  }
  if (requirement.stage === "rfp") {
    return "One approved template, workbook, or policy pack.";
  }
  if (requirement.stage === "bafo") {
    return "One negotiation log for all finalist vendors.";
  }
  if (requirement.stage === "executive_decision") {
    return "One finalist pack or consolidated executive evidence pack.";
  }
  if (requirement.stage === "selection") {
    return "One signed contract package with exhibits.";
  }
  if (requirement.stage === "transition") {
    return "One project export or KT evidence pack.";
  }
  if (requirement.stage === "value") {
    return "One measurement workbook or evidence pack per value cycle.";
  }
  return "One source file or export; rows should match the listed grain.";
}

function ownerRoleForRequirement(
  requirement: SourceEvidenceRequirement,
): string {
  if (
    requirement.stage === "rfp" &&
    requirement.sourceSystems.some((system) =>
      /Coupa Sourcing|Ariba Sourcing|Jaggaer|procurement/i.test(system),
    )
  ) {
    return "Procurement / sourcing owner";
  }
  if (requirement.evidenceClass === "risk_control") {
    return "Risk / security owner";
  }
  if (
    requirement.sourceSystems.some((system) =>
      /ServiceNow|Jira|BMC/i.test(system),
    )
  ) {
    return "IT operations owner";
  }
  if (
    requirement.sourceSystems.some((system) =>
      /SAP|Oracle|Apptio|Anaplan|Adaptive/i.test(system),
    )
  ) {
    return "Finance owner";
  }
  if (
    requirement.sourceSystems.some((system) =>
      /Icertis|DocuSign|Ironclad|Agiloft/i.test(system),
    )
  ) {
    return "Legal / procurement owner";
  }
  if (requirement.evidenceClass === "supplier_offer") {
    return "Sourcing lead";
  }
  if (requirement.evidenceClass === "workforce") {
    return "HR / workforce owner";
  }
  return "Stage owner";
}

function EvidenceReadinessPanel({
  files,
}: {
  files: readonly SourceShellFileItem[];
}) {
  const summary = summarizeEvidenceReadiness(files);
  const registeredOnly = files
    .filter(
      (file) => !isUnreviewedGeneratedDraft(file) && file.parseStatus !== "parsed",
    )
    .slice(0, 3);

  return (
    <section
      data-testid="source-evidence-readiness-panel"
      style={{
        ...CARD_STYLE,
        padding: 16,
        marginBottom: 16,
        boxShadow: "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              color: ANALYTICS.BLUE,
              fontFamily: ANALYTICS.MONO,
              fontSize: 10.5,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
            }}
          >
            Evidence readiness
          </div>
          <h2
            style={{
              margin: "5px 0 0",
              fontFamily: ANALYTICS.SERIF,
              fontSize: 21,
            }}
          >
            Stored, parsed, and ready for promotion
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: ANALYTICS.MUTED,
              fontSize: 13,
              lineHeight: 1.45,
              maxWidth: 780,
            }}
          >
            Uploaded files are persisted in Source as soon as capture succeeds.
            Parsed evidence can support Source review; unreviewed AI drafts are
            separate from evidence readiness. Search indexing and
            enterprise-context promotion remain separate governed steps.
          </p>
          {registeredOnly.length > 0 ? (
            <p
              data-testid="source-evidence-readiness-registered-only"
              style={{
                margin: "8px 0 0",
                color: ANALYTICS.INK_2,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              Registered only:{" "}
              {registeredOnly.map((file) => file.name).join(", ")}
              {summary.registeredOnlyCount > registeredOnly.length
                ? `, +${summary.registeredOnlyCount - registeredOnly.length} more`
                : ""}
              .
            </p>
          ) : null}
        </div>
        <div
          data-testid="source-evidence-readiness-summary"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(104px, 1fr))",
            gap: 8,
            minWidth: 246,
          }}
        >
          {[
            ["Stored evidence", summary.storedCount],
            ["Parsed", summary.parsedCount],
            ["Needs parser", summary.registeredOnlyCount],
            ["Parser failed", summary.failedCount],
            ["Search-ready", summary.searchReadyCount],
            ["Generated drafts", summary.generatedDraftCount],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                borderRadius: 8,
                background: ANALYTICS.SOFT,
                padding: "8px 9px",
              }}
            >
              <div
                style={{
                  color: ANALYTICS.MUTED,
                  fontFamily: ANALYTICS.MONO,
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 4,
                  color: ANALYTICS.INK,
                  fontSize: 17,
                  fontWeight: 900,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <FileUseReadinessMap files={files} />
    </section>
  );
}

function FileUseReadinessMap({
  files,
}: {
  files: readonly SourceShellFileItem[];
}) {
  const rows = files
    .map((file) => ({
      file,
      nextAction: fileNextAction(file),
      readyForUse: fileReadyForUse(file),
    }))
    .sort((a, b) => {
      if (
        isUnreviewedGeneratedDraft(a.file) !==
        isUnreviewedGeneratedDraft(b.file)
      ) {
        return isUnreviewedGeneratedDraft(a.file) ? 1 : -1;
      }
      if (a.file.artifactRole !== b.file.artifactRole) {
        return a.file.artifactRole === "authoritative" ? -1 : 1;
      }
      if (a.readyForUse !== b.readyForUse) return a.readyForUse ? 1 : -1;
      return a.file.name.localeCompare(b.file.name);
    })
    .slice(0, 6);
  const evidenceRows = rows.filter(
    (row) => !isUnreviewedGeneratedDraft(row.file),
  );

  return (
    <div
      data-testid="source-file-use-readiness-map"
      style={{
        borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
        marginTop: 12,
        paddingTop: 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 12,
          alignItems: "start",
          marginBottom: 9,
        }}
      >
        <div>
          <div style={WORKSPACE_EYEBROW}>File use map</div>
          <p
            style={{
              margin: "4px 0 0",
              color: ANALYTICS.MUTED,
              fontSize: 12.5,
              lineHeight: 1.45,
            }}
          >
            Shows what each file can do next: gate-defining artifact, supporting
            evidence, parser state, search readiness, graph projection, and the
            next action. Availability review and workflow usability are separate
            checks.
          </p>
        </div>
        <span style={SMALL_STATUS_PILL}>
          {evidenceRows.length === 0
            ? "No evidence files eligible"
            : `${evidenceRows.filter((row) => row.readyForUse).length}/${evidenceRows.length} workflow-usable`}
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{ color: ANALYTICS.MUTED, fontSize: 12.5 }}>
          No files are registered yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={FILE_USE_TABLE}>
            <thead>
              <tr>
                <th style={{ ...FILE_TH, textAlign: "left" }}>File</th>
                <th style={FILE_TH}>Role</th>
                <th style={FILE_TH}>Parse</th>
                <th style={FILE_TH}>Search</th>
                <th style={FILE_TH}>Graph</th>
                <th style={{ ...FILE_TH, textAlign: "left" }}>Next action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ file, nextAction, readyForUse }) => (
                <tr key={file.id}>
                  <td style={FILE_TD_LABEL}>
                    <strong>{file.name}</strong>
                    <span>
                      {file.stageLabel} · {file.format}
                    </span>
                  </td>
                  <td style={FILE_TD_CENTER}>
                    <ReadinessChip
                      label={
                        isUnreviewedGeneratedDraft(file)
                          ? "AI draft"
                          : file.artifactRole === "authoritative"
                            ? "Gate"
                            : "Evidence"
                      }
                      tone={
                        isUnreviewedGeneratedDraft(file)
                          ? "warn"
                          : file.artifactRole === "authoritative"
                            ? "good"
                            : "neutral"
                      }
                    />
                  </td>
                  <td style={FILE_TD_CENTER}>
                    <ReadinessChip
                      label={fileParseReadinessLabel(file)}
                      tone={isUnreviewedGeneratedDraft(file)
                        ? "neutral"
                        : file.parseStatus === "parsed"
                          ? "good"
                          : "warn"}
                    />
                  </td>
                  <td style={FILE_TD_CENTER}>
                    <ReadinessChip
                      label={fileSearchReadinessLabel(file)}
                      tone={
                        file.embeddingStatus === "embedded" ? "good" : "neutral"
                      }
                    />
                  </td>
                  <td style={FILE_TD_CENTER}>
                    <ReadinessChip
                      label={fileGraphReadinessLabel(file)}
                      tone={
                        file.graphStatus === "projected" ? "good" : "neutral"
                      }
                    />
                  </td>
                  <td style={FILE_TD_ACTION}>
                    <strong>
                      {readyForUse ? "Ready for workflow use" : "Open"}
                    </strong>
                    <span>{nextAction}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function summarizeEvidenceReadiness(files: readonly SourceShellFileItem[]) {
  const evidenceFiles = files.filter((file) => !isUnreviewedGeneratedDraft(file));
  const storedCount = evidenceFiles.length;
  const parsedCount = evidenceFiles.filter(
    (file) => file.parseStatus === "parsed",
  ).length;
  const failedCount = evidenceFiles.filter(
    (file) => file.parseStatus === "failed",
  ).length;
  const registeredOnlyCount = evidenceFiles.filter(
    (file) => file.parseStatus !== "parsed",
  ).length;
  const searchReadyCount = evidenceFiles.filter(
    (file) => file.embeddingStatus === "embedded",
  ).length;

  return {
    storedCount,
    parsedCount,
    failedCount,
    registeredOnlyCount,
    searchReadyCount,
    generatedDraftCount: files.length - evidenceFiles.length,
  };
}

function isUnreviewedGeneratedDraft(file: SourceShellFileItem): boolean {
  return file.sourceOrigin === "generated" && !file.acceptedAsAuthoritative;
}

function fileReadyForUse(file: SourceShellFileItem): boolean {
  return (
    !isUnreviewedGeneratedDraft(file) &&
    file.parseStatus === "parsed" &&
    !file.needsComplianceReview &&
    (file.artifactRole === "evidence" || file.acceptedAsAuthoritative)
  );
}

function fileParseReadinessLabel(file: SourceShellFileItem): string {
  if (isUnreviewedGeneratedDraft(file)) return "draft only";
  if (file.parseStatus === "parsed") return "parsed";
  if (file.parseStatus === "failed") return "failed";
  return "not parsed";
}

function fileSearchReadinessLabel(file: SourceShellFileItem): string {
  return file.embeddingStatus === "embedded" ? "embedded" : "not indexed";
}

function fileGraphReadinessLabel(file: SourceShellFileItem): string {
  return file.graphStatus === "projected" ? "projected" : "not projected";
}

function fileNextAction(file: SourceShellFileItem): string {
  if (isUnreviewedGeneratedDraft(file)) {
    return "Review the AI draft and accept a separately reviewed client-final version; do not parse this draft as evidence.";
  }
  if (file.needsComplianceReview) {
    return "Resolve compliance review before this file influences scoring or approval.";
  }
  if (file.parseStatus !== "parsed") {
    return "Run or retry parser before using this file as evidence.";
  }
  if (file.artifactRole === "authoritative" && !file.acceptedAsAuthoritative) {
    return "Accept as client-final before it gates the stage.";
  }
  if (file.embeddingStatus !== "embedded") {
    return "Usable locally; index before enterprise search or aVa citation.";
  }
  return "Ready for artifacts, scoring context, and approval review.";
}

function ReadinessChip({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "warn" | "neutral";
}) {
  return (
    <span
      style={{
        ...FILE_CHIP,
        ...(tone === "good"
          ? FILE_CHIP_GOOD
          : tone === "warn"
            ? FILE_CHIP_WARN
            : FILE_CHIP_NEUTRAL),
      }}
    >
      {label}
    </span>
  );
}

function SessionEvidenceCapturePanel({
  eventId,
  stageKey,
  stageLabel,
  onUploaded,
}: {
  eventId: string;
  stageKey: SourceStageKey;
  stageLabel: string;
  onUploaded: () => void;
}) {
  const [states, setStates] = useState<
    Record<SessionEvidenceFamily, SessionEvidenceUploadState>
  >({
    meeting_notes: { phase: "idle" },
    workshop_output: { phase: "idle" },
  });

  const setLaneState = (
    family: SessionEvidenceFamily,
    next: SessionEvidenceUploadState,
  ) => {
    setStates((previous) => ({ ...previous, [family]: next }));
  };

  const upload = async (lane: SessionEvidenceLane, file: File) => {
    setLaneState(lane.family, { phase: "uploading", fileName: file.name });
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("stageKey", stageKey);
    formData.append("artifactFamily", lane.family);
    formData.append("artifactKind", lane.kind);
    formData.append("dataClassification", "Internal");
    formData.append("dataProtectionClassification", "Internal");

    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/upload`,
        { method: "POST", body: formData, credentials: "include" },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as SourceSessionEvidenceUploadPayload | null;
      if (!response.ok || payload?.ok !== true || !payload.artifact?.id) {
        throw new Error(
          payload?.detail ??
            payload?.error ??
            `Upload failed with HTTP ${response.status}.`,
        );
      }
      setLaneState(lane.family, {
        phase: "uploaded",
        fileName: payload.artifact.originalName ?? file.name,
        parseStatus: payload.artifact.parseStatus ?? null,
        substrateSummary: summarizeSubstrateSync(payload.substrateSync),
      });
      onUploaded();
    } catch (error) {
      setLaneState(lane.family, {
        phase: "error",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
    }
  };

  return (
    <section
      id="source-session-evidence-capture"
      data-testid="source-session-evidence-capture"
      style={{
        ...CARD_STYLE,
        padding: 18,
        marginBottom: 16,
        boxShadow: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: ANALYTICS.BLUE,
              fontFamily: ANALYTICS.MONO,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Session evidence
          </div>
          <h2
            style={{
              margin: "6px 0 0",
              fontFamily: ANALYTICS.SERIF,
              fontSize: 22,
            }}
          >
            Capture notes for {stageLabel}
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: ANALYTICS.MUTED,
              fontSize: 13,
              lineHeight: 1.5,
              maxWidth: 740,
            }}
          >
            Upload session files into the governed Source evidence layer. Text,
            Markdown, CSV, and readable documents are parsed now; opaque media
            stays registered until the async parser is available.
          </p>
        </div>
        <span
          style={{
            border: `1px solid ${ANALYTICS.LINE_SOFT}`,
            borderRadius: 999,
            background: ANALYTICS.SOFT,
            color: ANALYTICS.MUTED,
            fontFamily: ANALYTICS.MONO,
            fontSize: 10,
            fontWeight: 900,
            padding: "6px 9px",
            textTransform: "uppercase",
          }}
        >
          Azure/Postgres persisted
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        {SESSION_EVIDENCE_LANES.map((lane) => (
          <SessionEvidenceLaneCard
            key={lane.family}
            lane={lane}
            state={states[lane.family]}
            onUpload={(file) => void upload(lane, file)}
          />
        ))}
      </div>
    </section>
  );
}

function SessionEvidenceLaneCard({
  lane,
  state,
  onUpload,
}: {
  lane: SessionEvidenceLane;
  state: SessionEvidenceUploadState;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const busy = state.phase === "uploading";
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (file) onUpload(file);
  };

  return (
    <div
      style={{
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: 8,
        background: ANALYTICS.SOFT,
        padding: 12,
      }}
    >
      <div style={{ color: ANALYTICS.INK, fontSize: 14, fontWeight: 850 }}>
        {lane.title}
      </div>
      <p
        style={{
          margin: "5px 0 0",
          color: ANALYTICS.INK_2,
          fontSize: 12.5,
          lineHeight: 1.45,
        }}
      >
        {lane.detail}
      </p>
      <p
        style={{
          margin: "7px 0 0",
          color: ANALYTICS.MUTED,
          fontSize: 12,
          lineHeight: 1.4,
        }}
      >
        {lane.evidenceUse}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.pptx,.md,.txt,.csv,.xlsx,.mp3,.mp4"
        style={{ display: "none" }}
        aria-label={`${lane.title} file`}
        data-testid={`source-session-evidence-input-${lane.family}`}
        onChange={onChange}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 12,
        }}
      >
        <button
          type="button"
          disabled={busy}
          data-testid={`source-session-evidence-upload-${lane.family}`}
          onClick={() => inputRef.current?.click()}
          style={{
            ...BUTTON_STYLE,
            background: ANALYTICS.INK,
            color: "#fff",
            padding: "9px 12px",
            opacity: busy ? 0.65 : 1,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Uploading..." : "Upload"}
        </button>
        <SessionEvidenceStatus state={state} />
      </div>
    </div>
  );
}

function SessionEvidenceStatus({
  state,
}: {
  state: SessionEvidenceUploadState;
}) {
  if (state.phase === "idle") {
    return (
      <span style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>
        PDF, DOCX, PPTX, MD, TXT, CSV, XLSX, audio/video.
      </span>
    );
  }
  if (state.phase === "uploading") {
    return (
      <span style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>
        Uploading {state.fileName}...
      </span>
    );
  }
  if (state.phase === "error") {
    return (
      <span style={{ color: ANALYTICS.RUST, fontSize: 12 }}>
        {state.message}
      </span>
    );
  }
  return (
    <span
      style={{ color: ANALYTICS.GREEN_TEXT, fontSize: 12, fontWeight: 750 }}
    >
      Captured {state.fileName} · {state.parseStatus ?? "pending"} ·{" "}
      {state.substrateSummary}
    </span>
  );
}

type SourceSessionEvidenceUploadPayload = {
  ok?: boolean;
  detail?: string;
  error?: string;
  artifact?: {
    id?: string;
    originalName?: string;
    parseStatus?: string | null;
  };
  substrateSync?:
    | {
        evidence?: { requirementId?: string; newState?: string } | null;
        criteria?: { linked?: boolean; autoMet?: boolean }[];
        skippedReason?: string;
      }
    | { skippedReason?: string }
    | { error?: string };
};

function summarizeSubstrateSync(
  sync: SourceSessionEvidenceUploadPayload["substrateSync"],
): string {
  if (!sync) return "registry receipt returned";
  if ("error" in sync && sync.error)
    return `evidence sync warning: ${sync.error}`;
  if ("skippedReason" in sync && sync.skippedReason) {
    return `registry only: ${sync.skippedReason}`;
  }
  const criteria =
    "criteria" in sync && Array.isArray(sync.criteria)
      ? sync.criteria.filter((item) => item.linked).length
      : 0;
  if ("evidence" in sync && sync.evidence?.requirementId) {
    return `${sync.evidence.requirementId} ${sync.evidence.newState ?? "linked"}`;
  }
  if (criteria > 0) return `${criteria} gate link${criteria === 1 ? "" : "s"}`;
  return "registry evidence captured";
}

function ArtifactLifecyclePanel({
  view,
  artifacts,
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
  artifacts: readonly SourceShellArtifactLike[];
  onClientFinalAccepted: () => void;
}) {
  const lifecycle = view.files.lifecycle;
  const driftedFinalCodes = new Set(
    artifacts
      .filter((artifact) => {
        const acceptedAt: unknown = artifact.clientFinalAcceptedAt;
        const hasAcceptedAt =
          (typeof acceptedAt === "string" && acceptedAt.trim().length > 0) ||
          (acceptedAt instanceof Date && !Number.isNaN(acceptedAt.getTime()));
        return artifact.recordKind === "registry_artifact" &&
          artifact.isClientFinal === true &&
          artifact.isCurrentAuthoritative === true &&
          typeof artifact.clientFinalAcceptedBy === "string" &&
          artifact.clientFinalAcceptedBy.trim().length > 0 &&
          hasAcceptedAt;
      })
      .filter((final) => {
        const code = final.artifactCode ?? final.artifactType ?? final.artifactKind;
        const state = artifacts.find((artifact) =>
          artifact.recordKind === "canvas_state" && artifact.artifactCode === code,
        );
        return Boolean(state && state.linkedArtifactId !== final.id);
      })
      .map((artifact) => artifact.artifactCode ?? artifact.artifactType ?? artifact.artifactKind)
      .filter((code): code is string => Boolean(code)),
  );
  // Default to the stage the user is actually viewing — a wall of every
  // artifact standard across all 11 stages (most of them not reached yet)
  // is exactly the "lines and lines of content" this panel should avoid.
  // One click still reaches every stage when that's genuinely needed.
  const [showAllStages, setShowAllStages] = useState(false);
  const visibleLifecycleRows = showAllStages
    ? lifecycle.rows
    : lifecycle.rows.filter((row) => row.stageLabel === view.stage.label);
  const rowsByStage = groupLifecycleRows(visibleLifecycleRows);
  const currentStageRows = lifecycle.rows.filter(
    (row) => row.stageLabel === view.stage.label,
  );
  const currentStageActionRows = currentStageRows.filter(
    (row) =>
      row.lifecycleState === "evidence_only" ||
      ((row.requirementLabel === "Required" || row.gateLabel === "Gate-defining") &&
        (row.lifecycleState !== "client_final" ||
          row.consultingGate.state === "required_not_run" ||
          row.consultingGate.state === "failed" ||
          row.contentQuality.state === "blocked")),
  );
  const standardsCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    buildSourceArtifactStandardsCsv(lifecycle.rows),
  )}`;
  const standardsCsvFilename = `${view.event.code || "source-event"}-artifact-standards.csv`;
  // The raw quality score is scored against the FULL 11-stage artifact set,
  // so it's mechanically low for any event that hasn't finished yet — "2/100"
  // reads as "broken," not "on track," for an event 3 steps into its second
  // stage. Lead with what's actually due so far instead.
  const reachedStageLabels = new Set(
    view.journey
      .filter((stage) => stage.state !== "future")
      .map((stage) => stage.label),
  );
  const rowsDueSoFar = lifecycle.rows.filter((row) =>
    reachedStageLabels.has(row.stageLabel),
  );
  const rowsRegisteredSoFar = rowsDueSoFar.filter(
    (row) => row.lifecycleState !== "not_registered",
  );
  const currentStageLabel =
    SOURCE_STAGE_LABELS[view.event.currentStageKey] ?? "the current stage";
  const stageRelativeProgressLabel =
    rowsDueSoFar.length > 0
      ? `${rowsRegisteredSoFar.length} of ${rowsDueSoFar.length} artifacts due through ${currentStageLabel} are registered`
      : null;
  const [showAuditMetrics, setShowAuditMetrics] = useState(false);
  const toplineItems = [
    ["Due so far", String(rowsDueSoFar.length)],
    ["Registered", String(rowsRegisteredSoFar.length)],
    ["Missing required", String(lifecycle.quality.missingRequiredCount)],
    ["Client finals", String(lifecycle.clientFinalCount)],
  ];
  const auditItems = [
    ["Quality score", `${lifecycle.quality.score}/100`],
    ["Hard fails", String(lifecycle.quality.hardFailCount)],
    ["Missing required", String(lifecycle.quality.missingRequiredCount)],
    ["Review-required", String(lifecycle.quality.reviewRequiredCount)],
    ["Content scored", String(lifecycle.quality.contentScoredCount)],
    ["Content blockers", String(lifecycle.quality.contentBlockerCount)],
    ["Content warnings", String(lifecycle.quality.contentWarningCount)],
    ["Gate B required", String(lifecycle.quality.consultingGateRequiredCount)],
    ["Gate B passed", String(lifecycle.quality.consultingGatePassedCount)],
    ["Gate B pending", String(lifecycle.quality.consultingGatePendingCount)],
    ["Expected artifacts", String(lifecycle.expectedCount)],
    ["Required", String(lifecycle.requiredCount)],
    ["Gate-defining", String(lifecycle.gateDefiningCount)],
    ["Prompt-backed", String(lifecycle.promptBackedCount)],
    ["Export-routed", String(lifecycle.renderableCount)],
    ["AI drafts", String(lifecycle.aiDraftCount)],
    ["Client finals", String(lifecycle.clientFinalCount)],
    ["Evidence-only", String(lifecycle.evidenceOnlyCount)],
  ];

  return (
    <section
      data-testid="source-artifact-lifecycle-matrix"
      style={{ ...CARD_STYLE, padding: 18, marginBottom: 16 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: ANALYTICS.BLUE,
              fontFamily: ANALYTICS.MONO,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Artifact lifecycle
          </div>
          <h2
            style={{
              margin: "6px 0 0",
              fontFamily: ANALYTICS.SERIF,
              fontSize: 22,
            }}
          >
            Draft, evidence, and final record
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: ANALYTICS.MUTED,
              fontSize: 13,
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            Generated documents stay as AI-prepared drafts until a reviewed
            client-final version is accepted back into Source as the
            authoritative artifact of record.
          </p>
          {stageRelativeProgressLabel ? (
            <p
              data-testid="source-artifact-stage-relative-progress"
              style={{
                margin: "8px 0 0",
                color: ANALYTICS.INK,
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.4,
              }}
            >
              {stageRelativeProgressLabel}. Start with the current-stage list;
              the full 11-stage audit stays one click away.
            </p>
          ) : null}
          <p
            data-testid="source-artifact-quality-scope-summary"
            style={{
              margin: "8px 0 0",
              color: ANALYTICS.MUTED,
              fontSize: 12,
              lineHeight: 1.45,
              maxWidth: 760,
            }}
          >
            Detailed quality rubric, Gate B checks, and export coverage are
            available in audit metrics; they are not required for routine file
            capture.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            <a
              href={standardsCsvHref}
              download={standardsCsvFilename}
              data-testid="source-artifact-standards-export"
              style={{
                ...BUTTON_STYLE,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 12px",
                textDecoration: "none",
              }}
            >
              Export standards CSV
            </a>
            <button
              type="button"
              data-testid="source-artifact-lifecycle-scope-toggle"
              onClick={() => setShowAllStages((value) => !value)}
              style={{
                border: "none",
                background: "none",
                color: ANALYTICS.BLUE,
                fontFamily: ANALYTICS.SANS,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                padding: "9px 4px",
              }}
            >
              {showAllStages
                ? `Show ${view.stage.label} only`
                : `Show all 11 stages`}
            </button>
            <button
              type="button"
              data-testid="source-artifact-audit-metrics-toggle"
              onClick={() => setShowAuditMetrics((value) => !value)}
              style={{
                border: "none",
                background: "none",
                color: ANALYTICS.BLUE,
                fontFamily: ANALYTICS.SANS,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                padding: "9px 4px",
              }}
            >
              {showAuditMetrics ? "Hide audit metrics" : "Show audit metrics"}
            </button>
          </div>
        </div>
        <div
          data-testid="source-artifact-execution-summary"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(112px, 1fr))",
            gap: 8,
            minWidth: 260,
            maxWidth: 330,
          }}
        >
          {toplineItems.map(([label, value]) => (
            <div
              key={label}
              style={{
                border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                borderRadius: 8,
                padding: "9px 10px",
                background: ANALYTICS.SOFT,
              }}
            >
              <div
                style={{
                  fontFamily: ANALYTICS.MONO,
                  color: ANALYTICS.MUTED,
                  fontSize: 9.5,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 4,
                  color: ANALYTICS.INK,
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <CurrentStageArtifactReviewQueue
        eventId={view.event.id}
        stageLabel={view.stage.label}
        rows={currentStageActionRows}
        canReviseFinal={view.event.lifecycle === "active" && view.event.currentStageKey === view.stage.key}
        onClientFinalAccepted={onClientFinalAccepted}
      />
      {showAuditMetrics ? (
        <section
          data-testid="source-artifact-audit-metrics"
          style={{
            marginTop: 16,
            border: `1px solid ${ANALYTICS.LINE_SOFT}`,
            borderRadius: 8,
            background: ANALYTICS.SOFT,
            padding: 12,
          }}
        >
          <p
            data-testid="source-artifact-quality-scope"
            style={{
              margin: "0 0 10px",
              color: ANALYTICS.MUTED,
              fontSize: 12,
              lineHeight: 1.45,
            }}
          >
            Quality rubric: {lifecycle.quality.label}.{" "}
            {lifecycle.quality.scopeLabel}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
              gap: 8,
            }}
          >
            {auditItems.map(([label, value]) => (
              <div
                key={label}
                style={{
                  border: `1px solid ${ANALYTICS.LINE_SOFT}`,
                  borderRadius: 8,
                  padding: "8px 9px",
                  background: ANALYTICS.CARD,
                }}
              >
                <div
                  style={{
                    fontFamily: ANALYTICS.MONO,
                    color: ANALYTICS.MUTED,
                    fontSize: 9.5,
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    color: ANALYTICS.INK,
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <div
        style={{
          marginTop: 16,
          border: `1px solid ${ANALYTICS.LINE_SOFT}`,
          borderRadius: 8,
          overflow: "visible",
        }}
      >
        {rowsByStage.length === 0 ? (
          <div style={{ padding: 16 }}>
            <EmptyCard
              text={`No artifact standards are defined for ${view.stage.label} yet.`}
            />
          </div>
        ) : (
          rowsByStage.map((group) => (
            <LifecycleStageRows
              key={group.stageLabel}
              eventId={view.event.id}
              group={group}
              activeStageKey={view.event.lifecycle === "active" ? view.event.currentStageKey : null}
              queuedArtifactCodes={new Set(currentStageActionRows.map((row) => row.code))}
              driftedFinalCodes={driftedFinalCodes}
              onClientFinalAccepted={onClientFinalAccepted}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CurrentStageArtifactReviewQueue({
  eventId,
  stageLabel,
  rows,
  canReviseFinal,
  onClientFinalAccepted,
}: {
  eventId: string;
  stageLabel: string;
  rows: SourceArtifactLifecycleRow[];
  canReviseFinal: boolean;
  onClientFinalAccepted: () => void;
}) {
  const blockers = rows.filter(
    (row) =>
      ["ai_draft", "not_registered"].includes(row.lifecycleState) ||
      row.consultingGate.state === "required_not_run" ||
      row.consultingGate.state === "failed" ||
      row.contentQuality.state === "blocked",
  );
  const evidenceOnly = rows.filter(
    (row) => row.lifecycleState === "evidence_only",
  );
  const queueLabel =
    blockers.length > 0
      ? `${blockers.length} blocker${blockers.length === 1 ? "" : "s"}${
          evidenceOnly.length > 0
            ? ` · ${evidenceOnly.length} evidence item${evidenceOnly.length === 1 ? "" : "s"}`
            : ""
        }`
      : evidenceOnly.length > 0
        ? `${evidenceOnly.length} evidence item${evidenceOnly.length === 1 ? "" : "s"} to review`
        : "Ready for approval";

  return (
    <section
      data-testid="source-artifact-review-queue"
      style={{
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: 8,
        background: ANALYTICS.SOFT,
        marginTop: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 14,
          alignItems: "start",
          padding: "12px 14px",
          borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
        }}
      >
        <div>
          <div style={WORKSPACE_EYEBROW}>{stageLabel} approval queue</div>
          <h3
            style={{
              margin: "4px 0 0",
              color: ANALYTICS.INK,
              fontSize: 17,
              lineHeight: 1.2,
            }}
          >
            Clear these artifact actions before opening the gate.
          </h3>
          <p
            style={{
              margin: "5px 0 0",
              color: ANALYTICS.MUTED,
              fontSize: 12.5,
              lineHeight: 1.45,
            }}
          >
            The full lifecycle matrix remains below for audit detail; this queue
            shows only what affects the current stage approval.
          </p>
        </div>
        <span style={SMALL_STATUS_PILL}>{queueLabel}</span>
      </div>
      {rows.length === 0 ? (
        <div
          data-testid="source-artifact-review-queue-ready"
          style={{
            padding: "12px 14px",
            color: ANALYTICS.GREEN_TEXT,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          No artifact review blockers remain for {stageLabel}. Open the approval
          gate when the owner is ready.
        </div>
      ) : (
        <div style={{ display: "grid" }}>
          {rows.map((row) => (
            <CurrentStageArtifactReviewRow
              key={row.code}
              eventId={eventId}
              row={row}
              canReviseFinal={canReviseFinal}
              onClientFinalAccepted={onClientFinalAccepted}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CurrentStageArtifactReviewRow({
  eventId,
  row,
  canReviseFinal,
  onClientFinalAccepted,
}: {
  eventId: string;
  row: SourceArtifactLifecycleRow;
  canReviseFinal: boolean;
  onClientFinalAccepted: () => void;
}) {
  const action = artifactReviewAction(row);
  const [draftRevision, setDraftRevision] = useState(0);
  const canGenerateFromEvidence =
    row.lifecycleState === "evidence_only" &&
    (row.requirementLabel === "Required" || row.gateLabel === "Gate-defining");

  return (
    <div
      data-testid={`source-artifact-review-queue-row-${row.code}`}
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(190px, 1fr) 150px minmax(220px, 1.3fr) 210px",
        gap: 12,
        alignItems: "start",
        padding: "12px 14px",
        borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
        background: ANALYTICS.CARD,
      }}
    >
      <div>
        <div style={{ color: ANALYTICS.INK, fontSize: 13, fontWeight: 850 }}>
          {row.name}
        </div>
        <div
          style={{
            marginTop: 3,
            color: ANALYTICS.MUTED,
            fontFamily: ANALYTICS.MONO,
            fontSize: 10,
          }}
        >
          {row.code} · {row.requirementLabel} · {row.gateLabel}
        </div>
      </div>
      <div>
        <EvidenceBadge
          basis={
            row.lifecycleState === "not_registered"
              ? "missing"
              : "live_artifact"
          }
          label={row.lifecycleLabel}
        />
      </div>
      <div
        style={{
          color: ANALYTICS.INK_2,
          fontSize: 12.5,
          lineHeight: 1.45,
        }}
      >
        <strong>{action.title}</strong>
        <div style={{ marginTop: 3, color: ANALYTICS.MUTED }}>
          {action.detail}
        </div>
      </div>
      <div>
        {row.lifecycleState === "client_final" &&
        row.consultingGate.required &&
        row.consultingGate.state !== "passed" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <ReviewArtifactQualityButton
              eventId={eventId}
              artifactCode={row.code}
              artifactName={row.name}
              onReviewed={onClientFinalAccepted}
            />
            {canReviseFinal && row.consultingGate.state === "failed" ? (
              <AcceptClientFinalButton
                eventId={eventId}
                artifactCode={row.code}
                artifactName={row.name}
                buttonLabel="Replace Client Final"
                onAccepted={onClientFinalAccepted}
              />
            ) : null}
          </div>
        ) : row.lifecycleState === "client_final" &&
          row.contentQuality.state === "blocked" ? (
          <AcceptClientFinalButton
            eventId={eventId}
            artifactCode={row.code}
            artifactName={row.name}
            hasGeneratedDraft
            buttonLabel="Replace Client Final"
            onAccepted={onClientFinalAccepted}
          />
        ) : row.lifecycleState === "ai_draft" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <GenerateArtifactButton
              eventId={eventId}
              artifactCode={row.code}
              artifactName={row.name}
              buttonLabel="Regenerate draft"
              onGenerated={() => {
                setDraftRevision((revision) => revision + 1);
                onClientFinalAccepted();
              }}
            />
            <AcceptClientFinalButton
              eventId={eventId}
              artifactCode={row.code}
              artifactName={row.name}
              hasGeneratedDraft
              onAccepted={onClientFinalAccepted}
            />
          </div>
        ) : row.lifecycleState === "not_registered" ||
          canGenerateFromEvidence ? (
          <GenerateArtifactButton
            eventId={eventId}
            artifactCode={row.code}
            artifactName={row.name}
            onGenerated={onClientFinalAccepted}
          />
        ) : (
          <span style={SMALL_STATUS_PILL}>{action.cta}</span>
        )}
      </div>
      {row.lifecycleState === "ai_draft" ? (
        <SourceDraftBodyPreview
          key={`${eventId}:${row.code}:${draftRevision}`}
          eventId={eventId}
          artifactCode={row.code}
        />
      ) : null}
    </div>
  );
}

function SourceDraftBodyPreview({
  eventId,
  artifactCode,
}: {
  eventId: string;
  artifactCode: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [body, setBody] = useState<string | null>(null);

  async function loadBody() {
    setStatus("loading");
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(artifactCode)}/body`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("draft_body_unavailable");
      const payload = (await response.json()) as {
        artifactCode?: unknown;
        body?: unknown;
      };
      if (
        payload.artifactCode !== artifactCode ||
        typeof payload.body !== "string" ||
        !payload.body.trim()
      ) {
        throw new Error("draft_body_unavailable");
      }
      setBody(payload.body);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }

  return (
    <details
      data-testid={`source-draft-preview-${artifactCode}`}
      onToggle={(event) => {
        if (event.currentTarget.open && status === "idle") void loadBody();
      }}
      style={{
        gridColumn: "1 / -1",
        borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
        paddingTop: 10,
      }}
    >
      <summary
        style={{
          color: ANALYTICS.INK,
          cursor: "pointer",
          fontSize: 12.5,
          fontWeight: 800,
        }}
      >
        Preview AI draft
      </summary>
      <p style={{ color: ANALYTICS.MUTED, fontSize: 12, margin: "8px 0" }}>
        Not a client-final artifact. Review source claims and quality findings
        before accepting a separately reviewed final.
      </p>
      {status === "loading" ? <p>Loading draft...</p> : null}
      {status === "error" ? (
        <p role="alert">
          Draft content is unavailable. No review is recorded.{" "}
          <button
            type="button"
            style={TABLE_BUTTON_STYLE}
            onClick={() => void loadBody()}
          >
            Retry
          </button>
        </p>
      ) : null}
      {status === "loaded" ? (
        <pre
          style={{
            maxHeight: 520,
            overflow: "auto",
            overflowWrap: "anywhere",
            whiteSpace: "pre-wrap",
            fontFamily: ANALYTICS.MONO,
            fontSize: 11.5,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {body}
        </pre>
      ) : null}
    </details>
  );
}

function GenerateArtifactButton({
  eventId,
  artifactCode,
  artifactName,
  buttonLabel = "Generate with aVa",
  onGenerated,
}: {
  eventId: string;
  artifactCode: string;
  artifactName: string;
  buttonLabel?: string;
  onGenerated: () => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    | { phase: "idle" }
    | { phase: "generating" }
    | { phase: "error"; message: string }
  >({ phase: "idle" });

  const generate = async () => {
    setState({ phase: "generating" });
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(artifactCode)}/generate`,
        { method: "POST", credentials: "include" },
      );
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        blockers?: Array<{ detail?: string }>;
      } | null;
      if (!response.ok || payload?.ok !== true) {
        const blocker = payload?.blockers?.find((item) => item.detail)?.detail;
        throw new Error(
          blocker ??
            payload?.detail ??
            payload?.error ??
            `Generation failed with HTTP ${response.status}.`,
        );
      }
      setState({ phase: "idle" });
      onGenerated();
      router.refresh();
    } catch (error) {
      setState({
        phase: "error",
        message:
          error instanceof Error
            ? error.message
            : `Could not generate ${artifactName}.`,
      });
    }
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <button
        type="button"
        data-testid={`source-generate-artifact-${artifactCode}`}
        disabled={state.phase === "generating"}
        onClick={() => void generate()}
        style={{
          ...BUTTON_STYLE,
          background: ANALYTICS.INK,
          color: "#fff",
          cursor: state.phase === "generating" ? "wait" : "pointer",
          opacity: state.phase === "generating" ? 0.65 : 1,
          padding: "9px 12px",
        }}
      >
        {state.phase === "generating" ? "Generating..." : buttonLabel}
      </button>
      {state.phase === "error" ? (
        <span
          role="alert"
          style={{ color: ANALYTICS.RUST, fontSize: 11.5, lineHeight: 1.35 }}
        >
          {state.message}
        </span>
      ) : null}
    </div>
  );
}

function ReviewArtifactQualityButton({
  eventId,
  artifactCode,
  artifactName,
  onReviewed,
}: {
  eventId: string;
  artifactCode: string;
  artifactName: string;
  onReviewed: () => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    | { phase: "idle" }
    | { phase: "reviewing" }
    | { phase: "error"; message: string }
  >({ phase: "idle" });

  const review = async () => {
    setState({ phase: "reviewing" });
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(artifactCode)}/generate`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewExistingBody: true }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        detail?: string;
      } | null;
      if (!response.ok || payload?.ok !== true) {
        throw new Error(
          payload?.detail ??
            payload?.error ??
            `Quality review failed with HTTP ${response.status}.`,
        );
      }
      setState({ phase: "idle" });
      onReviewed();
      router.refresh();
    } catch (error) {
      setState({
        phase: "error",
        message:
          error instanceof Error
            ? error.message
            : `Could not review ${artifactName}.`,
      });
    }
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <button
        type="button"
        data-testid={`source-review-artifact-quality-${artifactCode}`}
        disabled={state.phase === "reviewing"}
        onClick={() => void review()}
        style={{
          ...BUTTON_STYLE,
          background: ANALYTICS.INK,
          color: "#fff",
          cursor: state.phase === "reviewing" ? "wait" : "pointer",
          opacity: state.phase === "reviewing" ? 0.65 : 1,
          padding: "9px 12px",
        }}
      >
        {state.phase === "reviewing" ? "Reviewing..." : "Run quality review"}
      </button>
      {state.phase === "error" ? (
        <span
          role="alert"
          style={{ color: ANALYTICS.RUST, fontSize: 11.5, lineHeight: 1.35 }}
        >
          {state.message}
        </span>
      ) : null}
    </div>
  );
}

function artifactReviewAction(row: SourceArtifactLifecycleRow): {
  title: string;
  detail: string;
  cta: string;
} {
  if (
    row.lifecycleState === "client_final" &&
    row.consultingGate.required &&
    row.consultingGate.state !== "passed"
  ) {
    return {
      title: "Run the consulting-grade review on the accepted package.",
      detail:
        "The accepted body is preserved; Source records a separate quality receipt and fails closed if the package does not pass.",
      cta: "Run review",
    };
  }
  if (
    row.lifecycleState === "client_final" &&
    row.contentQuality.state === "blocked"
  ) {
    return {
      title: "Repair the accepted final before relying on it.",
      detail:
        row.contentQuality.blockers[0] ??
        "Content QA found a blocking issue in the accepted version. Upload the corrected client-approved final to replace it.",
      cta: "Replace final",
    };
  }
  if (row.lifecycleState === "ai_draft") {
    return {
      title: "Review the draft and accept the client-final version.",
      detail:
        "The draft exists, but it cannot clear the approval gate until a reviewed final is uploaded and accepted.",
      cta: "Accept final",
    };
  }
  if (row.lifecycleState === "not_registered") {
    return {
      title: "Generate or upload the missing artifact.",
      detail:
        row.quality.nextAction ||
        "No artifact is registered for this required slot yet.",
      cta: "Missing",
    };
  }
  if (
    row.lifecycleState === "evidence_only" &&
    (row.requirementLabel === "Required" || row.gateLabel === "Gate-defining")
  ) {
    return {
      title: "Create a governed draft from the available evidence.",
      detail:
        "Registered evidence is not a client-final deliverable. Generate a draft, then review and accept a final separately.",
      cta: "Generate draft",
    };
  }
  return {
    title: "Review supporting evidence before relying on it.",
    detail:
      "Evidence is registered, but it is not a client-final deliverable by itself.",
    cta: "Review evidence",
  };
}

function RestoreCurrentFinalButton({
  eventId,
  artifactCode,
  onRestored,
}: {
  eventId: string;
  artifactCode: string;
  onRestored: () => void;
}) {
  const [state, setState] = useState<"idle" | "restoring" | "error">("idle");
  const [message, setMessage] = useState("");
  const restore = async () => {
    setState("restoring");
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(artifactCode)}/restore-current-final`,
        { method: "POST", credentials: "include" },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Restore failed with HTTP ${response.status}.`);
      }
      setState("idle");
      onRestored();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not restore the accepted final.");
      setState("error");
    }
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <button
        type="button"
        data-testid={`source-restore-client-final-${artifactCode}`}
        title="Restore the already accepted file after its stage link drifted"
        disabled={state === "restoring"}
        onClick={() => void restore()}
        style={{ ...BUTTON_STYLE, padding: "9px 12px", cursor: state === "restoring" ? "wait" : "pointer" }}
      >
        {state === "restoring" ? "Restoring..." : "Restore accepted final"}
      </button>
      {state === "error" ? <span role="alert" style={{ color: ANALYTICS.RUST, fontSize: 11.5 }}>{message}</span> : null}
    </div>
  );
}

function LifecycleStageRows({
  eventId,
  group,
  activeStageKey,
  queuedArtifactCodes,
  driftedFinalCodes,
  onClientFinalAccepted,
}: {
  eventId: string;
  group: { stageLabel: string; rows: SourceArtifactLifecycleRow[] };
  activeStageKey: SourceStageKey | null;
  queuedArtifactCodes: ReadonlySet<string>;
  driftedFinalCodes: ReadonlySet<string>;
  onClientFinalAccepted: () => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px minmax(220px, 1fr) 180px 190px 180px",
          gap: 12,
          padding: "10px 12px",
          background: ANALYTICS.SOFT,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          color: ANALYTICS.MUTED,
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 900,
          textTransform: "uppercase",
        }}
      >
        <div>{group.stageLabel}</div>
        <div>Guideline / standard</div>
        <div>State</div>
        <div>Prompt / export</div>
        <div>Approval</div>
      </div>
      {group.rows.map((row) => (
        <div
          key={row.code}
          data-testid={`source-artifact-lifecycle-row-${row.code}`}
          style={{
            display: "grid",
            gridTemplateColumns: "180px minmax(220px, 1fr) 180px 190px 180px",
            gap: 12,
            padding: "12px",
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ fontWeight: 850, fontSize: 13 }}>{row.name}</div>
            <div
              style={{
                marginTop: 4,
                color: ANALYTICS.MUTED,
                fontFamily: ANALYTICS.MONO,
                fontSize: 10,
              }}
            >
              {row.code} · {row.requirementLabel} · {row.gateLabel}
            </div>
          </div>
          <div
            style={{ color: ANALYTICS.INK_2, fontSize: 12, lineHeight: 1.45 }}
          >
            <strong>{row.guidelineLabel}</strong>
            <div style={{ marginTop: 6, color: ANALYTICS.MUTED }}>
              {row.audienceLabel}
            </div>
            <div style={{ marginTop: 6 }}>{row.structureLabel}</div>
            <div style={{ marginTop: 6, color: ANALYTICS.MUTED }}>
              {row.pageGuidanceLabel}
            </div>
            <div style={{ marginTop: 6, color: ANALYTICS.MUTED }}>
              {row.controlsLabel}
            </div>
          </div>
          <div>
            <EvidenceBadge
              basis={
                row.lifecycleState === "not_registered"
                  ? "missing"
                  : "live_artifact"
              }
              label={row.lifecycleLabel}
            />
            <div
              style={{
                marginTop: 8,
                color: ANALYTICS.INK_2,
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              Quality {row.quality.score}/100
            </div>
            <div style={{ marginTop: 3, color: ANALYTICS.MUTED, fontSize: 11 }}>
              {row.quality.label}
            </div>
            <div
              data-testid={`source-artifact-content-quality-${row.code}`}
              style={{
                marginTop: 8,
                color:
                  row.contentQuality.state === "blocked"
                    ? "#8A3A12"
                    : ANALYTICS.INK_2,
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              Content QA{" "}
              {row.contentQuality.score === null
                ? "not scored"
                : `${row.contentQuality.score}/100`}
            </div>
            <div style={{ marginTop: 3, color: ANALYTICS.MUTED, fontSize: 11 }}>
              {row.contentQuality.label}
            </div>
            {row.consultingGate.required ? (
              <>
                <div
                  data-testid={`source-artifact-consulting-gate-${row.code}`}
                  style={{
                    marginTop: 8,
                    color:
                      row.consultingGate.state === "failed"
                        ? "#8A3A12"
                        : ANALYTICS.INK_2,
                    fontSize: 11.5,
                    fontWeight: 800,
                  }}
                >
                  {row.consultingGate.label}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    color: ANALYTICS.MUTED,
                    fontSize: 11,
                  }}
                >
                  {row.consultingGate.scoreLabel}
                </div>
              </>
            ) : null}
            <div style={{ marginTop: 6, color: ANALYTICS.MUTED, fontSize: 11 }}>
              {row.familyLabel}
            </div>
          </div>
          <div
            style={{ color: ANALYTICS.MUTED, fontSize: 11.5, lineHeight: 1.45 }}
          >
            <strong style={{ color: ANALYTICS.INK_2 }}>
              {row.prompt.modelLabel}
            </strong>
            <br />
            {row.prompt.maxTokensLabel}
            <br />
            {row.exportFormatsLabel}
          </div>
          <div
            style={{ color: ANALYTICS.INK_2, fontSize: 12, lineHeight: 1.45 }}
          >
            <strong>{row.approvalLabel}</strong>
            <br />
            {row.governanceMessage}
            {row.quality.hardFails.length > 0 ||
            row.quality.warnings.length > 0 ? (
              <div
                style={{
                  marginTop: 8,
                  color:
                    row.quality.hardFails.length > 0
                      ? "#8A3A12"
                      : ANALYTICS.MUTED,
                  fontSize: 11.5,
                }}
              >
                {row.quality.hardFails[0] ?? row.quality.warnings[0]}
              </div>
            ) : null}
            {(row.contentQuality.blockers[0] ??
            row.contentQuality.warnings[0] ??
            null) ? (
              // Real per-row blockers/warnings only. The not-scored case's
              // explanation is already shown once, for the whole panel, in
              // the "Quality rubric" scope line above — repeating the exact
              // same sentence on every not-yet-registered row (often 25+ of
              // them) was pure scroll-noise with zero new information.
              <div
                style={{
                  marginTop: 8,
                  color:
                    row.contentQuality.state === "blocked"
                      ? "#8A3A12"
                      : ANALYTICS.MUTED,
                  fontSize: 11.5,
                }}
              >
                {row.contentQuality.blockers[0] ??
                  row.contentQuality.warnings[0]}
              </div>
            ) : null}
            {row.consultingGate.required &&
            row.consultingGate.state !== "passed" ? (
              <div
                style={{
                  marginTop: 8,
                  color:
                    row.consultingGate.state === "failed"
                      ? "#8A3A12"
                      : ANALYTICS.MUTED,
                  fontSize: 11.5,
                }}
              >
                {row.consultingGate.findings[0] ??
                  row.consultingGate.nextAction}
              </div>
            ) : null}
            {driftedFinalCodes.has(row.code) ? (
              <div style={{ marginTop: 10 }}>
                <RestoreCurrentFinalButton
                  eventId={eventId}
                  artifactCode={row.code}
                  onRestored={onClientFinalAccepted}
                />
              </div>
            ) : row.lifecycleState === "ai_draft" ? (
              <div style={{ marginTop: 10 }}>
                <AcceptClientFinalButton
                  eventId={eventId}
                  artifactCode={row.code}
                  artifactName={row.name}
                  hasGeneratedDraft
                  onAccepted={onClientFinalAccepted}
                />
              </div>
            ) : row.lifecycleState === "not_registered" && row.stageKey === activeStageKey && !queuedArtifactCodes.has(row.code) ? (
              <div style={{ marginTop: 10 }}>
                <GenerateArtifactButton
                  eventId={eventId}
                  artifactCode={row.code}
                  artifactName={row.name}
                  onGenerated={onClientFinalAccepted}
                />
              </div>
            ) : row.lifecycleState === "client_final" &&
              row.consultingGate.required &&
              row.consultingGate.state !== "passed" ? (
              <div style={{ marginTop: 10 }}>
                <ReviewArtifactQualityButton
                  eventId={eventId}
                  artifactCode={row.code}
                  artifactName={row.name}
                  onReviewed={onClientFinalAccepted}
                />
              </div>
            ) : row.lifecycleState === "client_final" && row.stageKey === activeStageKey && !queuedArtifactCodes.has(row.code) ? (
              <div style={{ marginTop: 10 }}>
                <AcceptClientFinalButton
                  eventId={eventId}
                  artifactCode={row.code}
                  artifactName={row.name}
                  buttonLabel="Replace Client Final"
                  onAccepted={onClientFinalAccepted}
                />
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupLifecycleRows(rows: SourceArtifactLifecycleRow[]) {
  const groups = new Map<string, SourceArtifactLifecycleRow[]>();
  for (const row of rows) {
    const list = groups.get(row.stageLabel) ?? [];
    list.push(row);
    groups.set(row.stageLabel, list);
  }
  return Array.from(groups.entries()).map(([stageLabel, groupRows]) => ({
    stageLabel,
    rows: groupRows,
  }));
}

function IntelligenceWorkspace({
  view,
  stageView,
  evidenceStates,
}: {
  view: SourceEventShellView;
  stageView: StageAnalyticsView;
  evidenceStates: readonly SourceEventEvidence[];
}) {
  const evidenceReadiness = buildGovernedStageEvidenceReadinessBrief(
    buildStageEvidenceRequirementRows(view, evidenceStates).map((row) => ({
      label: row.requirement.label,
      required: row.requirement.level === "required",
      ready: row.ready,
    })),
  );

  return (
    <section data-testid="source-shell-v2-intelligence">
      <WorkspaceTitle
        eyebrow="Intelligence Explorer"
        title={`${view.stage.label} intelligence`}
        subtitle="Dynamic stage intelligence reads the same governed facts, artifacts, and model-state boundaries the workflow uses."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <IntelligenceReadinessBrief
            view={view}
            evidenceReadiness={evidenceReadiness}
          />
          {view.intelligence.stepInsight ? (
            <StepInsightPanel insight={view.intelligence.stepInsight} />
          ) : null}
          {stageView.waterfall ? (
            <ValueWaterfall waterfall={stageView.waterfall} />
          ) : null}
          <IntelPanel intel={stageView.intel} stageName={view.stage.label} />
        </div>
        <IntelligenceExplorerCard view={view} />
      </div>
    </section>
  );
}

function IntelligenceReadinessBrief({
  view,
  evidenceReadiness,
}: {
  view: SourceEventShellView;
  evidenceReadiness: GovernedStageEvidenceReadinessBrief | null;
}) {
  const currentStageFiles =
    view.files.byStage.find((stage) => stage.stageKey === view.stage.key)
      ?.items ?? [];
  const workflowOpen = view.stage.ready < view.stage.total;
  const governedEvidenceOpen = Boolean(
    evidenceReadiness && evidenceReadiness.missingLabels.length > 0,
  );
  const missing = governedEvidenceOpen
    ? workflowOpen
      ? `${intelligenceMissingLine(view)}. ${evidenceReadiness!.missingLine}`
      : evidenceReadiness!.missingLine
    : intelligenceMissingLine(view);
  const produced = view.intelligence.stepInsight
    ? "Stage insight produced"
    : `${view.intelligence.findings.length} finding${view.intelligence.findings.length === 1 ? "" : "s"} produced`;
  const evidenceUsed =
    currentStageFiles.length > 0
      ? currentStageFiles
          .slice(0, 2)
          .map((file) => file.name)
          .join(", ")
      : intelligenceBasisLabel(view.intelligence.sourceBasis);
  const nextAction = governedEvidenceOpen && !workflowOpen
    ? evidenceReadiness!.nextAction
    : view.stage.approvalRecorded
    ? view.stage.artifactReadiness.blockerCount > 0
      ? "Remediate current artifact gaps; approval remains recorded."
      : "No further approval required."
    : view.stage.ready < view.stage.total
      ? "Complete the active step before approval."
      : view.stage.artifactReadiness.blockerCount > 0
        ? "Resolve Files blockers before approval."
        : "Open the approval gate.";

  return (
    <section
      data-testid="source-shell-intelligence-readiness"
      style={{ ...CARD_STYLE, padding: 16 }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={WORKSPACE_EYEBROW}>Intelligence brief</div>
          <h3
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 18,
              lineHeight: 1.2,
              margin: "5px 0 0",
            }}
          >
            What Source knows right now
          </h3>
        </div>
        <span style={SMALL_STATUS_PILL}>
          {view.intelligence.sourceBasis === "sample"
            ? "Sample"
            : "Evidence-bound"}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 14,
        }}
      >
        <StepNeedDatum label="Produced" value={produced} />
        <StepNeedDatum label="Evidence used" value={evidenceUsed} />
        <StepNeedDatum
          label="Missing"
          value={missing}
          tone={missing === "No visible gaps" ? "good" : "warn"}
        />
        <StepNeedDatum label="Next action" value={nextAction} />
      </div>
    </section>
  );
}

function intelligenceMissingLine(view: SourceEventShellView): string {
  if (view.stage.ready < view.stage.total) {
    const openCount = view.stage.total - view.stage.ready;
    return `${openCount} workflow step${openCount === 1 ? "" : "s"} open`;
  }
  if (view.stage.artifactReadiness.blockerCount > 0) {
    return view.stage.artifactReadiness.blockers[0] ?? "Files review blocker";
  }
  return "No visible gaps";
}

function intelligenceBasisLabel(basis: SourceShellEvidenceBasis): string {
  switch (basis) {
    case "live_fact":
      return "Live facts";
    case "live_artifact":
      return "Live artifacts";
    case "computed":
      return "Computed read";
    case "archetype":
      return "Archetype knowledge";
    case "sample":
      return "Sample intelligence";
    case "missing":
      return "No evidence yet";
  }
}

function ApprovalsWorkspace({
  view,
  canRetireEvent,
  gateAction,
  evidenceStates,
  gateCriterionStates,
  stageArtifactStates,
  canReviewCriteria,
  onCriterionSaved,
  onGoToFiles,
  onGoToSteps,
}: {
  view: SourceEventShellView;
  canRetireEvent: boolean;
  gateAction?: StageGateActionView;
  evidenceStates: readonly SourceEventEvidence[];
  gateCriterionStates: readonly SourceEventGateCriterion[];
  stageArtifactStates: readonly SourceEventArtifactState[];
  canReviewCriteria: boolean;
  onCriterionSaved: () => void;
  onGoToFiles: () => void;
  onGoToSteps: () => void;
}) {
  const requiredEvidenceOpen = buildStageEvidenceRequirementRows(view, evidenceStates)
    .filter((row) => row.requirement.level === "required" && !row.ready).length;
  return (
    <section data-testid="source-shell-v2-approvals">
      <WorkspaceTitle
        eyebrow="Approvals"
        title="Stage decisions"
        subtitle="The workflow prepares the evidence; this page records the approval decision."
      />
      <ApprovalReadinessBrief view={view} requiredEvidenceOpen={requiredEvidenceOpen} />
      {view.stage.key === "strategy" && view.event.currentStageKey === "strategy" && view.event.lifecycle === "active" ? (
        <StrategyCriterionReview
          view={view}
          states={gateCriterionStates}
          artifacts={stageArtifactStates}
          canReview={canReviewCriteria}
          onSaved={onCriterionSaved}
          onGoToFiles={onGoToFiles}
        />
      ) : null}
      <PendingDecisionGroups view={view} />
      {view.approvals.currentStageItem ? (
        <ApprovalCard
          item={view.approvals.currentStageItem}
          gateAction={gateAction}
          decision={currentApprovalDecision(view)}
          requiredEvidenceOpen={requiredEvidenceOpen}
          approvalPolicyCode={view.event.approvalPolicyCode}
          featured
          onGoToSteps={onGoToSteps}
        />
      ) : (
        <>
          <EmptyCard text={view.approvals.readinessLine} />
          <ProgressActionDock
            action={null}
            status="Approval locked"
            detail={view.stage.ready < view.stage.total
              ? "No approval item is routed. Complete the current steps and evidence review."
              : "No approval item is routed for this stage; no decision can be recorded yet."}
          />
        </>
      )}
      {view.approvals.items.length > 0 ? (
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {view.approvals.items.map((item) => (
            <ApprovalCard
              key={`${item.eventId}-${item.kind}-${item.stageKey ?? "intake"}`}
              item={item}
            />
          ))}
        </div>
      ) : null}
      {view.approvals.ledger.length > 0 ? (
        <ApprovalLedgerTable ledger={view.approvals.ledger} />
      ) : null}
      {canRetireEvent && view.event.lifecycle === "active" ? (
        <EventRetirementControl eventId={view.event.id} eventCode={view.event.code} />
      ) : null}
    </section>
  );
}

function StrategyCriterionReview({
  view,
  states,
  artifacts,
  canReview,
  onSaved,
  onGoToFiles,
}: {
  view: SourceEventShellView;
  states: readonly SourceEventGateCriterion[];
  artifacts: readonly SourceEventArtifactState[];
  canReview: boolean;
  onSaved: () => void;
  onGoToFiles: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const definitions = criteriaForStage("strategy");
  const recorded = definitions.filter((definition) =>
    states.some((state) => state.criterionId === definition.criterionId &&
      (state.state === "met" || state.state === "waived")),
  ).length;

  async function changeState(criterionId: string, state: SourceEventGateCriterionState, rationale: string) {
    setPendingId(criterionId);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(view.event.id)}/gate-criteria/${encodeURIComponent(criterionId)}/state`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, reason: rationale }),
        },
      );
      const result = await response.json().catch(() => null) as { detail?: string } | null;
      if (!response.ok) throw new Error(result?.detail ?? "Criterion review could not be recorded.");
      setOpenId(null);
      setReason("");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Criterion review could not be recorded.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section data-testid="source-stage-criterion-review" style={{ margin: "18px 0", borderTop: `1px solid ${ANALYTICS.LINE}` }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "14px 0 8px" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Strategy gate criteria</h3>
        <span style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>{recorded} of {definitions.length} recorded</span>
      </div>
      {definitions.map((definition) => {
        const current = states.find((state) => state.criterionId === definition.criterionId);
        const title = criterionForSourceApprovalPolicy(definition, view.event.approvalPolicyCode)?.title ?? definition.title;
        const missingArtifacts = definition.linkedArtifactCodes.filter((code) =>
          !isArtifactGateReady(artifacts.find((artifact) => artifact.artifactCode === code)),
        );
        const isRecorded = current?.state === "met" || current?.state === "waived";
        return (
          <div key={definition.criterionId} style={{ borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`, padding: "12px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ fontSize: 13 }}>{title}</strong>
                <span style={{ color: isRecorded ? ANALYTICS.GREEN_TEXT : ANALYTICS.MUTED, fontSize: 12 }}>
                  {isRecorded ? "Recorded" : missingArtifacts.length
                    ? `Client Final required for ${missingArtifacts.join(", ")}`
                    : current ? "Ready for Event Owner review" : "Criterion state unavailable"}
                </span>
              </div>
              {canReview && current && isRecorded ? (
                <button type="button" style={BUTTON_STYLE} disabled={pendingId !== null}
                  onClick={() => void changeState(definition.criterionId, "pending", "")}>Reopen</button>
              ) : canReview && current && missingArtifacts.length === 0 ? (
                <button type="button" style={BUTTON_STYLE} disabled={pendingId !== null}
                  onClick={() => { setOpenId(definition.criterionId); setReason(""); setError(null); }}>
                  Review {title}
                </button>
              ) : missingArtifacts.length > 0 ? (
                <button type="button" style={BUTTON_STYLE} onClick={onGoToFiles}>Open files</button>
              ) : null}
            </div>
            {openId === definition.criterionId ? (
              <div style={{ display: "grid", gap: 8, maxWidth: 560, paddingTop: 12 }}>
                <label htmlFor="source-criterion-rationale" style={{ fontSize: 12, fontWeight: 700 }}>Criterion rationale</label>
                <textarea id="source-criterion-rationale" value={reason} rows={3}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Record what you reviewed and why this criterion is met."
                  style={{ width: "100%", border: `1px solid ${ANALYTICS.LINE}`, borderRadius: 6, padding: 9 }} />
                <div>
                  <button type="button" style={{ ...BUTTON_STYLE, padding: "8px 12px", background: reason.trim().length >= SOURCE_APPROVAL_REASON_MIN_LENGTH ? ANALYTICS.GREEN : ANALYTICS.SOFT, color: reason.trim().length >= SOURCE_APPROVAL_REASON_MIN_LENGTH ? "#fff" : ANALYTICS.MUTED }}
                    disabled={reason.trim().length < SOURCE_APPROVAL_REASON_MIN_LENGTH || pendingId !== null}
                    onClick={() => void changeState(definition.criterionId, "met", reason.trim())}>Mark criterion met</button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {error ? <p role="alert" style={{ color: ANALYTICS.RUST, fontSize: 12 }}>{error}</p> : null}
    </section>
  );
}

type ApprovalDecisionForCard =
  SourceEventShellView["approvals"]["pendingDecisionGroups"][number]["decisions"][number];

function currentApprovalDecision(
  view: SourceEventShellView,
): ApprovalDecisionForCard | null {
  return view.approvals.pendingDecisionGroups[0]?.decisions[0] ?? null;
}

function recordedApprovalAuditBlockers(
  decision: ApprovalDecisionForCard | null,
): ApprovalDecisionForCard["blockers"] {
  if (!decision || decision.status !== "recorded") return [];
  return decision.blockers.filter((blocker) =>
    ["approval_item_missing", "stale_version", "reviewer_role_missing"].includes(
      blocker.code,
    ),
  );
}

function PendingDecisionGroups({ view }: { view: SourceEventShellView }) {
  if (view.approvals.pendingDecisionGroups.length === 0) return null;

  return (
    <section
      data-testid="source-approval-pending-decisions"
      style={{ display: "grid", gap: 10, marginBottom: 14 }}
    >
      {view.approvals.pendingDecisionGroups.map((group) => (
        <div key={group.key} style={{ ...CARD_STYLE, padding: 16 }}>
          <div style={WORKSPACE_EYEBROW}>Pending decision</div>
          <h3
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 18,
              lineHeight: 1.2,
              margin: "5px 0 10px",
            }}
          >
            {group.eventCode} · {group.versionLabel}
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            {group.decisions.map((decision) => (
              <div
                key={decision.id}
                data-testid="source-approval-pending-decision"
                style={{
                  borderTop: `1px solid ${ANALYTICS.LINE}`,
                  display: "grid",
                  gap: 8,
                  paddingTop: 10,
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: 10,
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>
                    {decision.stageLabel} gate ·{" "}
                    {decision.reviewerRole ?? "reviewer role missing"}
                  </div>
                  <span
                    style={{
                      ...SMALL_STATUS_PILL,
                      color:
                        decision.status === "ready"
                          ? ANALYTICS.GREEN_TEXT
                          : decision.status === "recorded"
                            ? ANALYTICS.BLUE
                            : ANALYTICS.AMBER_TEXT,
                    }}
                  >
                    {decision.status === "ready"
                      ? "Ready"
                      : decision.status === "recorded"
                        ? "Recorded"
                        : "Blocked"}
                  </span>
                </div>
                {decision.blockers.length > 0 ? (
                  <ul
                    style={{
                      color: ANALYTICS.MUTED,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      margin: 0,
                      paddingLeft: 18,
                    }}
                  >
                    {decision.blockers.map((blocker) => (
                      <li key={blocker.code}>{blocker.detail}</li>
                    ))}
                  </ul>
                ) : (
                  <p
                    style={{
                      color: ANALYTICS.GREEN_TEXT,
                      fontSize: 12.5,
                      margin: 0,
                    }}
                  >
                    Version binding, reviewer role, readiness, entitlement, and
                    rationale are satisfied.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ApprovalReadinessBrief({
  view,
  requiredEvidenceOpen,
}: {
  view: SourceEventShellView;
  requiredEvidenceOpen: number;
}) {
  const stageApproved = view.stage.approvalRecorded;
  const approvalDecision = currentApprovalDecision(view);
  const gateCriteriaOpen = approvalDecision?.blockers.some((blocker) => blocker.code === "gate_criteria_open") ?? false;
  const approvalAuditBlockers = recordedApprovalAuditBlockers(approvalDecision);
  const approvalAuditGapsOpen =
    stageApproved && approvalAuditBlockers.length > 0;
  const workflowComplete = view.stage.ready >= view.stage.total;
  const filesReady = view.stage.artifactReadiness.ready;
  const approvalRouted = view.approvals.currentStageItem != null;
  const ready =
    !stageApproved && approvalRouted && workflowComplete && filesReady && requiredEvidenceOpen === 0 && !gateCriteriaOpen;
  const stageHref = `/source/events/${encodeURIComponent(
    view.event.id,
  )}?stage=${encodeURIComponent(view.stage.key)}`;
  const filesHref = `${stageHref}&workspace=files`;
  const decision = stageApproved
    ? approvalAuditGapsOpen
      ? `${view.stage.label} approval is recorded, but ${approvalAuditBlockers.length} audit metadata gap${approvalAuditBlockers.length === 1 ? " remains" : "s remain"}.`
      : `${view.stage.label} approval is recorded.`
    : view.approvals.currentStageItem != null
      ? `${view.stage.label} gate decision routed.`
      : `No approval item is currently routed for ${view.stage.label}.`;
  const nextAction = stageApproved
    ? approvalAuditGapsOpen
      ? "Resolve approval record gaps."
      : "No further approval required."
    : !workflowComplete
      ? "Return to steps."
      : requiredEvidenceOpen > 0
        ? "Review required evidence in the owning steps."
        : !filesReady
          ? "Clear artifact queue."
          : gateCriteriaOpen
            ? "Review required gate criteria."
          : (view.approvals.currentStageItem?.actionLabel ??
            "Approval routing unavailable.");
  const readinessTitle = stageApproved
    ? approvalAuditGapsOpen
      ? "Approval recorded; audit gaps open"
      : !filesReady && view.stage.approvalTraceState === "historical"
      ? "Historically approved; remediation open"
      : "Stage approved"
    : ready
      ? "Ready to decide"
      : !workflowComplete
        ? "Workflow inputs still open"
        : requiredEvidenceOpen > 0
          ? "Required evidence still open"
          : !filesReady
            ? "Artifact queue blocks the gate"
            : gateCriteriaOpen
              ? "Gate criteria still open"
            : "Approval routing unavailable";
  const readinessStatus = stageApproved
    ? approvalAuditGapsOpen
      ? "Recorded with gaps"
      : "Approved"
    : ready
      ? "Ready"
      : !workflowComplete
        ? "Inputs open"
        : requiredEvidenceOpen > 0
          ? "Evidence open"
          : !filesReady
            ? "Not gate-ready"
            : gateCriteriaOpen
              ? "Criteria open"
            : "Routing open";

  return (
    <section
      data-testid="source-shell-approval-readiness"
      style={{ ...CARD_STYLE, marginBottom: 14, padding: 16 }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={WORKSPACE_EYEBROW}>Approval readiness</div>
          <h3
            style={{
              fontFamily: ANALYTICS.SERIF,
              fontSize: 18,
              lineHeight: 1.2,
              margin: "5px 0 0",
            }}
          >
            {readinessTitle}
          </h3>
        </div>
        <span
          style={{
            ...SMALL_STATUS_PILL,
            color:
              ready || (stageApproved && !approvalAuditGapsOpen)
                ? ANALYTICS.GREEN_TEXT
                : ANALYTICS.AMBER_TEXT,
          }}
        >
          {readinessStatus}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 14,
        }}
      >
        <StepNeedDatum
          label="Workflow inputs"
          value={`${view.stage.ready}/${view.stage.total} inputs captured`}
          tone={workflowComplete && requiredEvidenceOpen === 0 ? "good" : "warn"}
        />
        <StepNeedDatum
          label="Artifact queue"
          value={
            filesReady
              ? "No blockers"
              : `${view.stage.artifactReadiness.blockerCount} review gap${view.stage.artifactReadiness.blockerCount === 1 ? "" : "s"}`
          }
          tone={filesReady ? "good" : "warn"}
        />
        <StepNeedDatum label="Decision" value={decision} />
        <StepNeedDatum
          label="Next action"
          value={nextAction}
          tone={ready || stageApproved ? "good" : "warn"}
        />
      </div>
      {!filesReady && !stageApproved ? (
        <div
          data-testid="source-shell-approval-review-gaps"
          style={{
            background: ANALYTICS.AMBER_TINT,
            border: `1px solid ${ANALYTICS.AMBER}`,
            borderRadius: 8,
            color: ANALYTICS.AMBER_TEXT,
            display: "grid",
            fontSize: 12,
            gap: 6,
            lineHeight: 1.45,
            marginTop: 14,
            padding: "10px 12px",
          }}
        >
          <strong style={{ color: ANALYTICS.INK }}>
            Clear these artifact actions before approval
          </strong>
          <span>
            {workflowComplete
              ? requiredEvidenceOpen > 0
                ? `Task inputs are captured, but ${requiredEvidenceOpen} required evidence item${requiredEvidenceOpen === 1 ? " remains" : "s remain"} open and the artifact queue is not cleared.`
                : "Stage inputs are complete, but the approval gate is not decision-ready until the current-stage artifact queue is cleared or an owner records an explicit exception."
              : `Stage inputs are still open (${view.stage.ready} of ${view.stage.total} captured) and the current-stage artifact queue is not cleared. Close both, or record an explicit owner exception, before the approval gate is decision-ready.`}
          </span>
          {view.stage.artifactReadiness.blockers.slice(0, 4).map((blocker) => (
            <span key={blocker}>{blocker}</span>
          ))}
          {view.stage.artifactReadiness.blockerCount > 4 ? (
            <span>
              +{view.stage.artifactReadiness.blockerCount - 4} more in Files
            </span>
          ) : null}
        </div>
      ) : null}
      {!ready && !stageApproved ? (
        <div
          data-testid="source-shell-approval-next-actions"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 14,
          }}
        >
          {!workflowComplete || requiredEvidenceOpen > 0 ? (
            <Link
              data-testid="source-shell-approval-return-steps"
              href={stageHref}
              style={{
                ...BUTTON_STYLE,
                display: "inline-flex",
                padding: "10px 12px",
                textDecoration: "none",
              }}
            >
              Return to steps
            </Link>
          ) : null}
          {!filesReady ? (
            <Link
              data-testid="source-shell-approval-open-files"
              href={filesHref}
              style={{
                ...BUTTON_STYLE,
                background: ANALYTICS.INK,
                color: "#fff",
                display: "inline-flex",
                padding: "10px 12px",
                textDecoration: "none",
              }}
            >
              Clear artifact queue
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ApprovalLedgerTable({ ledger }: { ledger: ApprovalLedgerRow[] }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: ANALYTICS.FAINT,
          marginBottom: 8,
        }}
      >
        Approval ledger
      </div>
      <div style={{ ...CARD_STYLE, overflow: "hidden" }}>
        <table
          data-testid="source-shell-approval-ledger"
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${ANALYTICS.LINE}` }}>
              {["Stage", "Status", "Approval"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    color: ANALYTICS.MUTED,
                    fontFamily: ANALYTICS.MONO,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ledger.map((row) => (
              <tr
                key={row.stageKey}
                data-testid={`source-shell-approval-ledger-row-${row.stageKey}`}
                style={{ borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}` }}
              >
                <td style={{ padding: "10px 14px", fontWeight: 700 }}>
                  {String(row.index).padStart(2, "0")} · {row.stageLabel}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      borderRadius: 999,
                      padding: "3px 8px",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      background:
                        row.state === "approved"
                          ? ANALYTICS.GREEN_TINT
                          : row.state === "current"
                            ? ANALYTICS.BLUE_TINT
                            : "rgba(10,10,11,0.06)",
                      color:
                        row.state === "approved"
                          ? ANALYTICS.GREEN_TEXT
                          : row.state === "current"
                            ? ANALYTICS.BLUE
                            : ANALYTICS.MUTED,
                    }}
                  >
                    {row.state === "approved"
                      ? "Approved"
                      : row.state === "current"
                        ? "In progress"
                        : "Locked"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: ANALYTICS.INK_2 }}>
                  <span>{row.authorizationNote}</span>
                  {row.approvedAtIso ? (
                    <span style={{ color: ANALYTICS.MUTED }}>
                      {" "}
                      · {new Date(row.approvedAtIso).toLocaleDateString()}
                    </span>
                  ) : null}
                  {row.approverRationale ? (
                    <div
                      style={{
                        marginTop: 4,
                        color: ANALYTICS.MUTED,
                        fontSize: 12,
                        lineHeight: 1.35,
                      }}
                    >
                      Rationale: {row.approverRationale}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Guidebook section bodies are authored Markdown (see
// SourceStageGuidebookSection.body's own type comment) — reuses the same
// react-markdown/remark-gfm/rehype-sanitize dependencies already bundled
// for AgentMarkdown (src/lib/agent/markdownRenderer.tsx), styled with this
// file's own ANALYTICS tokens rather than AgentMarkdown's chat-specific
// chart/citation overrides, which don't apply to facilitator content.
type GuidebookMarkdownComponents = NonNullable<
  ComponentPropsWithoutRef<typeof ReactMarkdown>["components"]
>;

const GUIDEBOOK_MARKDOWN_COMPONENTS: GuidebookMarkdownComponents = {
  p: ({ children }) => (
    <p
      style={{
        margin: "0 0 0.6em",
        fontSize: 14,
        lineHeight: 1.6,
        color: ANALYTICS.INK_2,
      }}
    >
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul
      style={{
        margin: "0 0 0.6em",
        paddingLeft: "1.3em",
        fontSize: 14,
        lineHeight: 1.6,
        color: ANALYTICS.INK_2,
      }}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      style={{
        margin: "0 0 0.6em",
        paddingLeft: "1.3em",
        fontSize: 14,
        lineHeight: 1.6,
        color: ANALYTICS.INK_2,
      }}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => <li style={{ margin: "0.15em 0" }}>{children}</li>,
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: ANALYTICS.INK }}>
      {children}
    </strong>
  ),
  em: ({ children }) => <em>{children}</em>,
  h1: ({ children }) => (
    <h4
      style={{
        fontFamily: ANALYTICS.SERIF,
        fontSize: 16,
        margin: "0.6em 0 0.3em",
        color: ANALYTICS.INK,
      }}
    >
      {children}
    </h4>
  ),
  h2: ({ children }) => (
    <h4
      style={{
        fontFamily: ANALYTICS.SERIF,
        fontSize: 15,
        margin: "0.6em 0 0.3em",
        color: ANALYTICS.INK,
      }}
    >
      {children}
    </h4>
  ),
  h3: ({ children }) => (
    <h4
      style={{
        fontFamily: ANALYTICS.SERIF,
        fontSize: 14,
        margin: "0.6em 0 0.3em",
        color: ANALYTICS.INK,
      }}
    >
      {children}
    </h4>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      style={{ color: ANALYTICS.BLUE, textDecoration: "underline" }}
    >
      {children}
    </a>
  ),
};

function GuidebookSectionBody({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={GUIDEBOOK_MARKDOWN_COMPONENTS}
    >
      {body}
    </ReactMarkdown>
  );
}

function GuidebookWorkspace({ view }: { view: SourceEventShellView }) {
  const record = view.guidebook.record;
  const requiredSteps = view.stage.groups.flatMap((group) => group.steps);
  return (
    <section data-testid="source-shell-v2-guidebook">
      <WorkspaceTitle
        eyebrow="Guidebook"
        title={record?.title ?? `${view.stage.label} facilitator guide`}
        subtitle={
          record?.purpose ??
          "Agenda and talking points for the working session that moves this stage to its gate."
        }
      />
      {!record ? (
        <DefaultStageGuidebook view={view} />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontFamily: ANALYTICS.MONO,
              fontSize: 11,
              color: ANALYTICS.FAINT,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <span>{record.durationMinutes} min</span>
            <span>
              {record.clientKey ? "Tenant guidebook" : "Global default"}
            </span>
          </div>
          <StageGuideEvidencePrepTable
            steps={requiredSteps}
            activeStepId={view.stage.activeStep?.id}
          />
          {record.sections.map((section, index) => (
            <article
              key={`${section.type}-${index}`}
              style={{ ...CARD_STYLE, padding: 18 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <h3
                  style={{
                    fontFamily: ANALYTICS.SERIF,
                    margin: 0,
                    fontSize: 18,
                  }}
                >
                  {section.title}
                </h3>
                {section.timeBoxMinutes != null ? (
                  <span
                    style={{
                      fontFamily: ANALYTICS.MONO,
                      fontSize: 11,
                      color: ANALYTICS.FAINT,
                    }}
                  >
                    {section.timeBoxMinutes} min
                  </span>
                ) : null}
              </div>
              <GuidebookSectionBody body={section.body} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DefaultStageGuidebook({ view }: { view: SourceEventShellView }) {
  const activeStep = view.stage.activeStep;
  const requiredSteps = view.stage.groups.flatMap((group) => group.steps);
  const openSteps = requiredSteps.filter((step) => step.status !== "captured");
  const templateSteps = requiredSteps.filter((step) => step.template);
  const nextStep = activeStep ?? openSteps[0] ?? requiredSteps[0] ?? null;
  const nextNeed = nextStep
    ? activeStepNeed(nextStep, nextStep.status === "captured")
    : null;
  const workflowComplete = view.stage.ready >= view.stage.total;
  const artifactQueueReady = view.stage.artifactReadiness.ready;
  const stageGateReady = workflowComplete && artifactQueueReady;
  const readinessLabel = stageGateReady
    ? `${view.stage.readyPct}% gate-ready`
    : workflowComplete
      ? "artifact review open"
      : `${view.stage.readyPct}% inputs-ready`;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          fontFamily: ANALYTICS.MONO,
          fontSize: 11,
          color: ANALYTICS.FAINT,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <span>Default playbook</span>
        <span>{readinessLabel}</span>
      </div>
      <article style={{ ...CARD_STYLE, padding: 18 }}>
        <h3
          style={{
            fontFamily: ANALYTICS.SERIF,
            fontSize: 18,
            margin: 0,
          }}
        >
          Run the {view.stage.label} working session
        </h3>
        <p
          style={{
            color: ANALYTICS.INK_2,
            fontSize: 13,
            lineHeight: 1.55,
            margin: "8px 0 0",
            maxWidth: 760,
          }}
        >
          {view.guidebook.emptyMessage} Use this default playbook to align the
          team on the next input, the source owner, and the approval condition
          without inventing tailored content.
        </p>
      </article>
      <StageGuideEvidencePrepTable
        steps={requiredSteps}
        activeStepId={view.stage.activeStep?.id}
        artifactReviewOpen={workflowComplete && !artifactQueueReady}
      />
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <DefaultGuideCard
          title="Next input"
          value={nextStep?.title ?? "No active input"}
          body={
            nextNeed
              ? `${nextNeed.item}. ${nextNeed.nextAction}`
              : "This stage has no input rows loaded yet. Check the Evidence workspace for source requirements."
          }
        />
        <DefaultGuideCard
          title="Who to invite"
          value={
            nextNeed
              ? `${nextNeed.owner} + stage approver`
              : "Stage owner + approver"
          }
          body="Keep business, procurement, finance, and the data owner in the same review when evidence changes the decision."
        />
        <DefaultGuideCard
          title="Templates to prepare"
          value={
            templateSteps.length
              ? `${templateSteps.length} template${templateSteps.length === 1 ? "" : "s"} available`
              : "No template required"
          }
          body={
            templateSteps.length
              ? templateSteps
                  .slice(0, 3)
                  .map((step) => step.template?.name)
                  .filter(Boolean)
                  .join(" · ")
              : "Capture the decision directly, or use the Files workspace for supporting evidence."
          }
        />
        <DefaultGuideCard
          title="Gate condition"
          value={
            stageGateReady
              ? view.stage.approvalCtaLabel
              : workflowComplete
                ? "Clear artifact queue"
                : view.stage.approvalCtaLabel
          }
          body={
            stageGateReady
              ? "Required evidence and gate artifacts are ready. Open the approval workspace and record the rationale before advancing."
              : workflowComplete
                ? view.stage.artifactReadiness.line
                : view.stage.gateReadinessLine
          }
        />
      </div>
    </div>
  );
}

function StageGuideEvidencePrepTable({
  steps,
  activeStepId,
  artifactReviewOpen = false,
}: {
  steps: readonly SourceShellStep[];
  activeStepId?: string;
  artifactReviewOpen?: boolean;
}) {
  if (!steps.length) return null;
  return (
    <article
      data-testid="source-shell-guidebook-prep-table"
      style={{
        ...CARD_STYLE,
        overflow: "hidden",
        padding: 0,
      }}
    >
      <div
        style={{
          alignItems: "baseline",
          borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          padding: "12px 14px",
        }}
      >
        <div>
          <div
            style={{
              color: ANALYTICS.BLUE,
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Evidence prep checklist
          </div>
          <p
            style={{
              color: ANALYTICS.MUTED,
              fontSize: 12.5,
              lineHeight: 1.4,
              margin: "5px 0 0",
            }}
          >
            Use this before the workshop: each row names what to collect, who
            owns it, the upload format, and what parser/writeback it supports.
          </p>
        </div>
        <span
          style={{
            color: ANALYTICS.FAINT,
            fontFamily: ANALYTICS.MONO,
            fontSize: 10,
            fontWeight: 900,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {steps.length} input{steps.length === 1 ? "" : "s"}
        </span>
      </div>
      <div
        style={{
          overflowX: "auto",
        }}
      >
        <div style={{ minWidth: 840 }}>
          <div
            style={{
              background: ANALYTICS.PAGE_BG,
              color: ANALYTICS.MUTED,
              display: "grid",
              fontFamily: ANALYTICS.MONO,
              fontSize: 9,
              fontWeight: 900,
              gridTemplateColumns:
                "minmax(170px, 1fr) minmax(155px, 0.9fr) minmax(145px, 0.75fr) minmax(170px, 0.95fr) minmax(140px, 0.75fr)",
              letterSpacing: "0.06em",
              padding: "8px 14px",
              textTransform: "uppercase",
            }}
          >
            <span>Collect</span>
            <span>Source / owner</span>
            <span>Format / template</span>
            <span>Parser writeback</span>
            <span>Next</span>
          </div>
          {steps.map((step, index) => {
            const captured = step.status === "captured";
            const active = step.id === activeStepId;
            const need = activeStepNeed(step, captured);
            const template = step.template
              ? `${step.template.name} · ${step.template.format}`
              : need.formats;
            return (
              <div
                key={step.id}
                data-testid={`source-shell-guidebook-prep-row-${step.id}`}
                style={{
                  background: active ? "#fbfaf6" : ANALYTICS.CARD,
                  borderTop:
                    index === 0 ? "none" : `1px solid ${ANALYTICS.LINE_SOFT}`,
                  color: active || captured ? ANALYTICS.INK : ANALYTICS.MUTED,
                  display: "grid",
                  fontSize: 12,
                  gap: 12,
                  gridTemplateColumns:
                    "minmax(170px, 1fr) minmax(155px, 0.9fr) minmax(145px, 0.75fr) minmax(170px, 0.95fr) minmax(140px, 0.75fr)",
                  lineHeight: 1.35,
                  padding: "10px 14px",
                }}
              >
                <GuidePrepCell
                  label={step.title}
                  detail={`${need.item} · ${need.requirement}`}
                />
                <GuidePrepCell label={need.sourceSystem} detail={need.owner} />
                <GuidePrepCell
                  label={template}
                  detail={
                    clientTemplateName(step.factTemplateCode) ??
                    "No intake template"
                  }
                />
                <GuidePrepCell label={need.parseTarget} detail={need.status} />
                <GuidePrepStatusCell
                  label={
                    captured
                      ? artifactReviewOpen
                        ? "Review"
                        : "Done"
                      : active
                        ? "Now"
                        : "Next"
                  }
                  detail={
                    captured
                      ? artifactReviewOpen
                        ? "Artifact queue open"
                        : "Ready for gate"
                      : active
                        ? need.nextAction
                        : "Select when ready"
                  }
                  captured={captured}
                  active={active}
                />
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function GuidePrepCell({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          color: "inherit",
          fontWeight: 800,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={label}
      >
        {label}
      </div>
      <div
        style={{
          color: ANALYTICS.MUTED,
          marginTop: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={detail}
      >
        {detail}
      </div>
    </div>
  );
}

function GuidePrepStatusCell({
  label,
  detail,
  captured,
  active,
}: {
  label: string;
  detail: string;
  captured: boolean;
  active: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <span
        style={{
          border: `1px solid ${
            captured
              ? "rgba(17, 120, 84, 0.24)"
              : active
                ? ANALYTICS.AMBER
                : ANALYTICS.LINE
          }`,
          borderRadius: 999,
          color: captured
            ? ANALYTICS.GREEN_TEXT
            : active
              ? ANALYTICS.AMBER_TEXT
              : ANALYTICS.MUTED,
          display: "inline-block",
          fontFamily: ANALYTICS.MONO,
          fontSize: 9,
          fontWeight: 900,
          padding: "3px 7px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div
        style={{
          color: ANALYTICS.MUTED,
          marginTop: 5,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={detail}
      >
        {detail}
      </div>
    </div>
  );
}

function DefaultGuideCard({
  title,
  value,
  body,
}: {
  title: string;
  value: string;
  body: string;
}) {
  return (
    <article style={{ ...CARD_STYLE, padding: 16 }}>
      <div
        style={{
          color: ANALYTICS.BLUE,
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <h3
        style={{
          fontFamily: ANALYTICS.SANS,
          fontSize: 15,
          lineHeight: 1.25,
          margin: "8px 0 6px",
        }}
      >
        {value}
      </h3>
      <p
        style={{
          color: ANALYTICS.MUTED,
          fontSize: 12.5,
          lineHeight: 1.45,
          margin: 0,
        }}
      >
        {body}
      </p>
    </article>
  );
}

function IntelligenceExplorerCard({ view }: { view: SourceEventShellView }) {
  return (
    <aside style={{ ...CARD_STYLE, padding: 18, position: "sticky", top: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: ANALYTICS.TEAL_DEEP,
            color: ANALYTICS.TEAL_BRIGHT,
            fontFamily: ANALYTICS.SERIF,
            fontWeight: 900,
          }}
        >
          a
        </div>
        <div>
          <div style={{ fontWeight: 800 }}>aVa</div>
          <div style={{ color: ANALYTICS.MUTED, fontSize: 12 }}>
            Analyst · {view.stage.label}
          </div>
        </div>
      </div>
      <p style={{ color: ANALYTICS.INK_2, fontSize: 13, lineHeight: 1.55 }}>
        {view.intelligence.lead}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {view.intelligence.contextChips.map((chip) => (
          <span
            key={chip}
            style={{
              borderRadius: 999,
              background: "rgba(10,10,11,0.06)",
              color: ANALYTICS.MUTED,
              padding: "4px 8px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {chip}
          </span>
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "grid",
          gap: 10,
        }}
      >
        {view.intelligence.findings.slice(0, 4).map((finding) => (
          <div key={finding.id}>
            <EvidenceBadge basis={finding.sourceBasis} label={finding.tag} />
            <div
              style={{
                color: ANALYTICS.INK_2,
                fontSize: 12.5,
                lineHeight: 1.45,
                marginTop: 5,
              }}
            >
              {finding.text}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: ANALYTICS.SOFT,
          color: ANALYTICS.MUTED,
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {view.intelligence.captureSemantics.conversationOnlyLabel}
      </div>
      <button
        type="button"
        disabled
        style={{
          ...BUTTON_STYLE,
          width: "100%",
          marginTop: 10,
          padding: "10px 12px",
          color: ANALYTICS.FAINT,
          cursor: "not-allowed",
        }}
      >
        {view.intelligence.captureSemantics.saveActionLabel}
      </button>
    </aside>
  );
}

function AskAvaLauncher({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="source-ask-ava-launcher"
      aria-expanded={open}
      onClick={onClick}
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 90,
        border: "none",
        borderRadius: 999,
        background: ANALYTICS.TEAL_DEEP,
        color: "#fff",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 16px 11px 12px",
        boxShadow: "0 16px 36px rgba(10,10,11,0.22)",
        fontFamily: ANALYTICS.SANS,
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: ANALYTICS.TEAL_BRIGHT,
          color: ANALYTICS.TEAL_DEEP,
          display: "grid",
          placeItems: "center",
          fontFamily: ANALYTICS.SERIF,
          fontWeight: 900,
        }}
      >
        a
      </span>
      <span>{open ? "Close aVa" : "Ask aVa"}</span>
    </button>
  );
}

function FileCard({
  item,
  eventId,
  operation,
  onAccepted,
}: {
  item: SourceShellFileItem;
  eventId: string;
  operation: SourceArtifactOperation | null;
  onAccepted: () => void;
}) {
  return (
    <div
      data-testid={`source-shell-file-card-${item.id}`}
      style={{
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: 8,
        padding: 12,
        background: ANALYTICS.SOFT,
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
      >
        <span style={{ fontWeight: 800, fontSize: 13 }}>{item.name}</span>
        <span
          style={{
            fontFamily: ANALYTICS.MONO,
            fontSize: 10,
            fontWeight: 800,
            color: ANALYTICS.MUTED,
          }}
        >
          {item.format}
        </span>
      </div>
      <div style={{ color: ANALYTICS.MUTED, fontSize: 12, marginTop: 8 }}>
        {item.group} ·{" "}
        <span
          data-testid={`source-shell-file-status-${item.id}`}
          style={{
            display: "inline-flex",
            borderRadius: 999,
            background: "rgba(10,10,11,0.06)",
            color: ANALYTICS.INK_2,
            padding: "1px 7px",
            fontSize: 10.5,
            fontWeight: 700,
          }}
        >
          {item.state}
        </span>
      </div>
      <div style={{ marginTop: 9, display: "flex", flexWrap: "wrap", gap: 6 }}>
        <ArtifactRoleBadge role={item.artifactRole} />
        <EvidenceBadge basis={item.sourceBasis} label={item.governanceLabel} />
        <ProcessingReadinessBadge item={item} />
        {item.needsComplianceReview ? (
          <span
            data-testid={`source-shell-file-compliance-flag-${item.id}`}
            style={{
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              fontWeight: 800,
              padding: "3px 8px",
              borderRadius: 999,
              background: ANALYTICS.AMBER_TINT,
              color: ANALYTICS.AMBER_TEXT,
            }}
          >
            {item.complianceReviewLabel}
          </span>
        ) : null}
      </div>
      {item.governanceMessage ? (
        <div
          data-testid={`source-shell-file-governance-${item.id}`}
          style={{
            marginTop: 8,
            color: ANALYTICS.INK_2,
            fontSize: 11.5,
            lineHeight: 1.4,
          }}
        >
          {item.governanceMessage}
        </div>
      ) : null}
      {item.needsComplianceReview && item.complianceReviewMessage ? (
        <div
          data-testid={`source-shell-file-compliance-message-${item.id}`}
          style={{
            marginTop: 6,
            color: ANALYTICS.AMBER_TEXT,
            fontSize: 11.5,
            lineHeight: 1.4,
          }}
        >
          {item.complianceReviewMessage}
        </div>
      ) : null}
      <ArtifactAcceptancePanel
        eventId={eventId}
        artifactCode={item.artifactCode}
        artifactName={item.name}
        latestAcceptance={item.latestAcceptance}
        operation={operation}
        artifactRole={item.artifactRole}
        parseStatus={item.parseStatus}
        sourceOrigin={item.sourceOrigin}
        embeddingStatus={item.embeddingStatus}
        graphStatus={item.graphStatus}
        needsComplianceReview={item.needsComplianceReview}
        onAccepted={onAccepted}
      />
    </div>
  );
}

function ProcessingReadinessBadge({ item }: { item: SourceShellFileItem }) {
  const parsed = item.parseStatus === "parsed";
  const failed = item.parseStatus === "failed";
  const searchReady = item.embeddingStatus === "embedded";
  const label = searchReady
    ? "SEARCH READY"
    : parsed
      ? "PARSED"
      : failed
        ? "PARSER FAILED"
        : "REGISTERED ONLY";
  const color =
    searchReady || parsed
      ? ANALYTICS.GREEN_TEXT
      : failed
        ? ANALYTICS.RUST
        : ANALYTICS.MUTED;
  const background =
    searchReady || parsed
      ? "rgba(17, 120, 84, 0.1)"
      : failed
        ? "rgba(166, 71, 43, 0.1)"
        : "rgba(10,10,11,0.05)";

  return (
    <span
      data-testid={`source-shell-file-processing-${item.id}`}
      title={`Parse: ${item.parseStatus ?? "pending"} · Search: ${item.embeddingStatus ?? "pending"} · Graph: ${item.graphStatus ?? "pending"}`}
      style={{
        fontFamily: ANALYTICS.MONO,
        fontSize: 10,
        fontWeight: 800,
        padding: "3px 8px",
        borderRadius: 999,
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}

function ApprovalCard({
  item,
  gateAction,
  decision,
  requiredEvidenceOpen = 0,
  approvalPolicyCode,
  featured = false,
  onGoToSteps,
}: {
  item: ApprovalsInboxItem;
  gateAction?: StageGateActionView;
  decision?: ApprovalDecisionForCard | null;
  requiredEvidenceOpen?: number;
  approvalPolicyCode?: string | null;
  featured?: boolean;
  onGoToSteps?: () => void;
}) {
  // The featured card's stage-gate href always points at the page the user
  // is already viewing (this event, this stage) — a <Link> there is a
  // same-URL nav that visibly does nothing. If the route did not arm a real
  // approve action, send the user back to Steps so they can finish the gate
  // prerequisites instead of pretending the approval is available.
  // Intake approvals keep their real, distinct /approval decision page.
  const goToStepsInstead =
    featured &&
    item.kind === "stage_gate" &&
    !gateAction &&
    Boolean(onGoToSteps);
  const buttonStyle = {
    ...BUTTON_STYLE,
    padding: "10px 12px",
    textDecoration: "none",
    flexShrink: 0,
  } as const;
  const onlyRationaleOpen = decision?.blockers.length === 1 &&
    decision.blockers[0]?.code === "approval_reason_required";
  const canOfferGateAction = requiredEvidenceOpen === 0 &&
    ((decision?.primaryAction.enabled ?? true) || onlyRationaleOpen);

  return (
    <section
      style={{
        ...CARD_STYLE,
        padding: 16,
        borderColor: featured ? ANALYTICS.BLUE : ANALYTICS.LINE,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontWeight: 800 }}>{item.ask}</div>
          <div style={{ color: ANALYTICS.MUTED, fontSize: 13, marginTop: 5 }}>
            {item.eventCode} · {item.stageLabel ?? "Intake"}
          </div>
          <div style={{ color: ANALYTICS.INK_2, fontSize: 13, marginTop: 8 }}>
            {item.readiness}
          </div>
        </div>
        {gateAction && canOfferGateAction ? (
          <StageGateApprovalButton
            action={gateAction}
            status={item.status}
            stageLabel={item.stageLabel}
            requiresSponsorContext={approvalPolicyCode === "self_v1" && item.stageKey === "scope"}
          />
        ) : gateAction && decision ? (
          <>
            <span
              data-testid="source-stage-gate-blocked"
              role="status"
              style={{
                ...buttonStyle,
                color: ANALYTICS.FAINT,
              }}
            >
              {requiredEvidenceOpen > 0
                ? `${requiredEvidenceOpen} required evidence item${requiredEvidenceOpen === 1 ? "" : "s"} remain open. `
                : null}
              {decision.primaryAction.disabledReason}
            </span>
            {featured ? <ProgressActionDock
              action={null}
              status="Approval locked"
              detail={requiredEvidenceOpen > 0
                ? `${requiredEvidenceOpen} required evidence item${requiredEvidenceOpen === 1 ? "" : "s"} remain open.`
                : decision.primaryAction.disabledReason}
            /> : null}
          </>
        ) : goToStepsInstead ? (
          <button
            type="button"
            data-testid="source-approval-card-go-to-steps"
            onClick={onGoToSteps}
            style={buttonStyle}
          >
            Go to steps to decide
          </button>
        ) : (
          <Link href={item.href} style={buttonStyle}>
            {item.actionLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

function StageGateApprovalButton({
  action,
  status,
  stageLabel,
  requiresSponsorContext,
}: {
  action: StageGateActionView;
  status: ApprovalsInboxItem["status"];
  stageLabel: string | null;
  requiresSponsorContext: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rationale, setRationale] = useState(action.rationale);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorTitle, setSponsorTitle] = useState("");
  const [sponsorRole, setSponsorRole] = useState("");
  const [sponsorEmail, setSponsorEmail] = useState("");
  const [ownerAcknowledged, setOwnerAcknowledged] = useState(false);
  const requiresRationale = status === "ready_with_gaps";
  const buttonLabel = requiresRationale
    ? "Approve exception and advance"
    : "Approve now";
  const rationaleLabel = requiresRationale
    ? `${stageLabel ?? "Stage"} exception rationale`
    : `${stageLabel ?? "Stage"} approval rationale`;
  const trimmedRationale = rationale.trim();
  const sponsorInputStyle: CSSProperties = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${ANALYTICS.LINE}`,
    borderRadius: 6,
    background: ANALYTICS.SOFT,
    color: ANALYTICS.INK,
    fontSize: 12.5,
    padding: "7px 9px",
  };
  const disabled =
    submitting || trimmedRationale.length < SOURCE_APPROVAL_REASON_MIN_LENGTH ||
    (requiresSponsorContext && (!ownerAcknowledged ||
      [sponsorName, sponsorTitle, sponsorRole].some((value) => value.trim().length < 2) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorEmail.trim())));

  const approve = async () => {
    if (disabled) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/source/events/${encodeURIComponent(action.eventId)}/approve`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            notes: trimmedRationale || action.rationale,
            confirmations: Object.fromEntries(
              action.confirmationKeys.map((key) => [key, true]),
            ),
            selfApproveIfAuthorized: true,
            ...(requiresSponsorContext ? {
              sponsorContext: {
                name: sponsorName.trim(),
                title: sponsorTitle.trim(),
                role: sponsorRole.trim(),
                email: sponsorEmail.trim(),
                ownerAcknowledged,
              },
            } : {}),
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        stageAdvancedTo?: string | null;
      } | null;
      if (!response.ok || payload?.ok !== true) {
        throw new Error(
          payload?.detail ??
            payload?.error ??
            `Approval failed with HTTP ${response.status}.`,
        );
      }
      const nextStage = payload.stageAdvancedTo ?? undefined;
      if (nextStage) {
        router.push(
          `/source/events/${action.eventId}?stage=${encodeURIComponent(nextStage)}`,
        );
      } else {
        router.push(`/source/events/${action.eventId}?workspace=approvals`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="source-stage-gate-approval-control"
      style={{
        display: "grid",
        gap: 8,
        minWidth: 260,
        maxWidth: 360,
        flexShrink: 0,
      }}
    >
      <textarea
        aria-label={rationaleLabel}
        placeholder={
          requiresRationale
            ? "Name the review gaps accepted, why advancing is still appropriate, and who owns closure."
            : "Record what evidence was reviewed and why this stage can advance."
        }
        value={rationale}
        onChange={(event) => setRationale(event.currentTarget.value)}
        rows={3}
        style={{
          border: `1px solid ${ANALYTICS.LINE}`,
          borderRadius: 8,
          background: ANALYTICS.SOFT,
          color: ANALYTICS.INK,
          fontFamily: ANALYTICS.SANS,
          fontSize: 12.5,
          lineHeight: 1.4,
          padding: "9px 10px",
          resize: "vertical",
        }}
      />
      {requiresSponsorContext ? (
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 12.5, color: ANALYTICS.INK }}>Sponsor reference</span>
          <label style={{ fontSize: 12, color: ANALYTICS.INK_2 }}>
            Sponsor name
            <input value={sponsorName} onChange={(event) => setSponsorName(event.currentTarget.value)}
              maxLength={120} style={{ ...sponsorInputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: ANALYTICS.INK_2 }}>
            Sponsor title
            <input value={sponsorTitle} onChange={(event) => setSponsorTitle(event.currentTarget.value)}
              maxLength={120} style={{ ...sponsorInputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: ANALYTICS.INK_2 }}>
            Sponsor role
            <input value={sponsorRole} onChange={(event) => setSponsorRole(event.currentTarget.value)}
              maxLength={120} style={{ ...sponsorInputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: ANALYTICS.INK_2 }}>
            Sponsor notification email
            <input type="email" value={sponsorEmail} onChange={(event) => setSponsorEmail(event.currentTarget.value)}
              maxLength={254} style={{ ...sponsorInputStyle, marginTop: 4 }} />
          </label>
          <label style={{ display: "flex", gap: 8, fontSize: 12, color: ANALYTICS.INK_2 }}>
            <input type="checkbox" checked={ownerAcknowledged}
              onChange={(event) => setOwnerAcknowledged(event.currentTarget.checked)} />
            I am approving this stage, not the sponsor. A notification will be attempted after the decision; delivery is audited separately.
          </label>
        </div>
      ) : null}
      <ProgressActionDock
        action={!disabled ? {
          label: `${buttonLabel} →`,
          onClick: () => void approve(),
          testId: "source-stage-gate-approve",
        } : null}
        status={submitting ? "Recording approval" : "Approval locked"}
        detail={submitting
          ? "Submitting the recorded decision."
          : trimmedRationale.length < SOURCE_APPROVAL_REASON_MIN_LENGTH
            ? `Enter an approval rationale of at least ${SOURCE_APPROVAL_REASON_MIN_LENGTH} characters.`
            : requiresSponsorContext
              ? "Complete the sponsor reference and acknowledge this decision."
              : null}
      />
      {requiresRationale ? (
        <span style={{ color: ANALYTICS.AMBER_TEXT, fontSize: 11.5 }}>
          Exception approval is audited. Name the open review gaps and the owner
          for closure before advancing.
        </span>
      ) : null}
      {error ? (
        <span role="alert" style={{ color: ANALYTICS.RUST, fontSize: 12 }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function WorkspaceTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header style={{ marginBottom: 14 }}>
      <div
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: ANALYTICS.FAINT,
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <h1
        style={{
          fontFamily: ANALYTICS.SERIF,
          margin: 0,
          fontSize: 26,
          lineHeight: 1.08,
          letterSpacing: 0,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          color: ANALYTICS.INK_2,
          margin: "7px 0 0",
          fontSize: 13.5,
          maxWidth: 720,
          lineHeight: 1.42,
        }}
      >
        {subtitle}
      </p>
    </header>
  );
}

function WorkspaceButton({
  workspaceKey,
  label,
  badge,
  active,
  onClick,
}: {
  workspaceKey: SourceShellWorkspace;
  label: string;
  badge?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={`source-shell-workspace-${workspaceKey}`}
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: active
          ? `1px solid ${ANALYTICS.LINE}`
          : "1px solid transparent",
        borderRadius: 8,
        background: active ? ANALYTICS.CARD : "transparent",
        padding: "9px 10px",
        cursor: "pointer",
        fontFamily: ANALYTICS.SANS,
        fontSize: 13,
        fontWeight: active ? 800 : 650,
        color: active ? ANALYTICS.INK : ANALYTICS.INK_2,
        textAlign: "left",
      }}
    >
      <span>{label}</span>
      {badge ? <span style={{ color: ANALYTICS.FAINT }}>{badge}</span> : null}
    </button>
  );
}

function RailLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        color: ANALYTICS.FAINT,
        fontFamily: ANALYTICS.MONO,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.14em",
        margin: "0 0 8px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: 18,
        color: ANALYTICS.MUTED,
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

function ArtifactRoleBadge({ role }: { role: "authoritative" | "evidence" }) {
  const tone =
    role === "authoritative"
      ? { bg: ANALYTICS.BLUE_TINT, fg: ANALYTICS.BLUE }
      : { bg: "rgba(10,10,11,0.06)", fg: ANALYTICS.MUTED };
  return (
    <span
      data-testid="source-shell-file-role-badge"
      style={{
        display: "inline-flex",
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
        padding: "3px 8px",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      }}
    >
      {role === "authoritative" ? "Authoritative" : "Evidence"}
    </span>
  );
}

function EvidenceBadge({
  basis,
  label,
}: {
  basis: SourceShellEvidenceBasis;
  label?: string;
}) {
  const tone =
    basis === "live_fact" || basis === "live_artifact"
      ? { bg: ANALYTICS.GREEN_TINT, fg: ANALYTICS.GREEN_TEXT }
      : basis === "sample"
        ? { bg: "rgba(10,10,11,0.06)", fg: ANALYTICS.MUTED }
        : basis === "missing"
          ? { bg: ANALYTICS.AMBER_TINT, fg: ANALYTICS.AMBER_TEXT }
          : { bg: ANALYTICS.BLUE_TINT, fg: ANALYTICS.BLUE };
  return (
    <span
      style={{
        display: "inline-flex",
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
        padding: "3px 8px",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      }}
    >
      {label ?? basis.replaceAll("_", " ")}
    </span>
  );
}
