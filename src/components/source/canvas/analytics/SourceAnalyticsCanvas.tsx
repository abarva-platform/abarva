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
import { AcceptClientFinalButton } from "@/components/source/canvas/workspace-tabs/AcceptClientFinalButton";
import { ContractOptimizationProfilePanel } from "@/components/source/canvas/contract-optimization/ContractOptimizationProfilePanel";
import { ResponsesStageView } from "@/components/source/canvas/responses/ResponsesStageView";
import { SourceVendorSelectionReadinessPanel } from "@/components/source/SourceVendorSelectionReadinessPanel";
import type { ContractOptimizationMveProfile } from "@/lib/source/contract-optimization";
import type {
  VendorBafoInstructionPack,
  VendorChallengeIntelligence,
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
  type SourceShellStepGroup,
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
  adaptStageViewToSourceJourney,
  sourceJourneyLabelForStage,
  type SourceJourneyDefinition,
} from "@/lib/source/sourcing-motion-journeys";
import type { SourceStageKey, SourcingEventSummary } from "@/lib/source/types";
import type { SourceStageGuidebookRecord } from "@/lib/source/stage-guidebooks/types";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";
import type { SourceArtifactFamily } from "@/lib/source/artifact-registry/types";
import type { SourceVendorSelectionReadiness } from "@/lib/source/vendor-selection-readiness-types";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import { ArtifactAcceptancePanel } from "./ArtifactAcceptancePanel";
import { ANALYTICS } from "./analytics-tokens";
import { IntelPanel } from "./IntelPanel";
import { TaskProvideUpload, TemplateDownloadLink } from "./TaskChecklist";
import {
  evidenceRequirementIdForTask,
  factTemplateCodeForTask,
} from "@/lib/source/facts/task-evidence-requirements";
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
  viewStage: SourceStageKey;
  tenantName: string;
  stageView?: StageAnalyticsView;
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
  /** Server-built Source selection readiness projection for Selection / Executive Decision stages. */
  selectionReadiness?: SourceVendorSelectionReadiness | null;
  /** Server-built vendor response package readiness for the live Responses stage. */
  vendorResponseReadiness?: SourceVendorResponseCompleteness | null;
  /** Server-built proposal profile chain used by the live Responses cockpit. */
  vendorResponseProfiles?: VendorResponseProfileSet | null;
  vendorChallengeIntelligence?: VendorChallengeIntelligence | null;
  vendorBafoInstructionPack?: VendorBafoInstructionPack | null;
  vendorEvaluationDecisionView?: VendorEvaluationDecisionView | null;
  vendorResponseParseReports?: VendorResponseParseReport[];
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

const CANVAS_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "264px minmax(0, 1fr)",
  gap: 0,
  minHeight: "100%",
  alignItems: "stretch",
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
  requirement: string;
  sourceSystem: string;
  owner: string;
  formats: string;
  parseTarget: string;
  status: string;
  tone: "good" | "warn";
  nextAction: string;
};

type WorkflowStepRequirement = {
  item: string;
  requirement: string;
  sourceSystem: string;
  ownerRole: string;
  acceptedFormats: string;
  parseTarget: string;
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
    parseTarget: "Mandate, sponsor, value thesis",
    missingAction: "Review the mandate and confirm the sponsor.",
  },
  "scope.volumetrics": {
    item: "Volumetrics file",
    requirement: "1 required file",
    sourceSystem: "ITSM / finance baseline",
    ownerRole: "IT Ops / Finance",
    acceptedFormats: "CSV or XLSX",
    parseTarget: "Tickets, SLA misses, change orders, run volumes",
    missingAction:
      "Download the template, fill one row per tower, then upload.",
  },
  "scope.app-inventory": {
    item: "Application inventory file",
    requirement: "1 required file",
    sourceSystem: "CMDB / finance export",
    ownerRole: "IT Ops / application owner",
    acceptedFormats: "CSV or XLSX",
    parseTarget: "Apps, owners, run cost, retained-FTE cost",
    missingAction: "Download the template, fill one row per app, then upload.",
  },
  "scope.vendor-commercials": {
    item: "Vendor commercials file",
    requirement: "1 required file",
    sourceSystem: "Commercial workbook / proposal",
    ownerRole: "Procurement lead",
    acceptedFormats: "CSV or XLSX",
    parseTarget: "Transition fee, credits, term, productivity, SLA caps",
    missingAction: "Upload the required vendor-commercials workbook.",
  },
  "scope.sponsor": {
    item: "Sponsor commitment letter",
    requirement: "1 required signed file",
    sourceSystem: "Scope readiness pack",
    ownerRole: "Executive sponsor",
    acceptedFormats: "PDF or DOCX",
    parseTarget: "Sponsor commitment evidence",
    missingAction: "Upload the signed sponsor commitment.",
  },
  "rfp.clause-coverage": {
    item: "RFP clause coverage file",
    requirement: "1 required checklist",
    sourceSystem: "RFP draft / clause checklist",
    ownerRole: "Sourcing lead",
    acceptedFormats: "CSV or XLSX",
    parseTarget: "Protected vs exposed value levers",
    missingAction: "Upload the clause checklist before issuing the RFP.",
  },
  "responses.coverage": {
    item: "Vendor response package",
    requirement: "1 required package per vendor",
    sourceSystem: "Vendor proposals / response matrix",
    ownerRole: "Sourcing lead",
    acceptedFormats: "PDF, DOCX, XLSX, or CSV",
    parseTarget: "Per-vendor answer coverage and missing responses",
    missingAction:
      "Upload each vendor proposal or the response matrix before scoring.",
  },
  "evaluation.vendor-bids": {
    item: "Vendor bid file",
    requirement: "1 required row per vendor",
    sourceSystem: "Vendor proposals / bid tabulation",
    ownerRole: "Evaluation lead",
    acceptedFormats: "CSV or XLSX",
    parseTarget: "Headline bid, retained FTE delta, SLA credit cap",
    missingAction: "Upload the bid table before score normalization.",
  },
  "pricing.normalized-supplier-pricing": {
    item: "Normalized pricing package",
    requirement: "1 required workbook",
    sourceSystem: "Pricing submissions / normalization workbook",
    ownerRole: "Commercial lead",
    acceptedFormats: "XLSX or CSV",
    parseTarget: "Comparable TCO, assumptions, escalators, exclusions",
    missingAction: "Upload normalized pricing before BAFO asks are prepared.",
  },
  "bafo.concession-actuals": {
    item: "BAFO concession file",
    requirement: "1 required concession log",
    sourceSystem: "BAFO round / concession log",
    ownerRole: "Sourcing lead",
    acceptedFormats: "CSV or XLSX",
    parseTarget: "Captured concession by value lever",
    missingAction: "Upload BAFO actuals before the round closes.",
  },
  "executive-decision.recommendation-packet": {
    item: "Executive recommendation decision",
    requirement: "1 required decision review",
    sourceSystem: "Decision brief / risk register / value ledger",
    ownerRole: "Executive sponsor",
    acceptedFormats: "No upload required",
    parseTarget: "Recommendation, value case, risks, approval conditions",
    missingAction: "Review the packet and confirm the decision conditions.",
  },
  "selection.committed-value": {
    item: "Award commitment file",
    requirement: "1 required award record",
    sourceSystem: "Executed contract / award record",
    ownerRole: "Sourcing lead",
    acceptedFormats: "CSV or XLSX",
    parseTarget: "Committed value by lever",
    missingAction: "Upload award commitments before transition starts.",
  },
  "transition.go-live-readiness": {
    item: "Transition readiness packet",
    requirement: "1 required readiness packet",
    sourceSystem: "Transition tracker / go-live checklist",
    ownerRole: "Transition owner",
    acceptedFormats: "PDF, DOCX, XLSX, or CSV",
    parseTarget: "Milestones, blockers, cutover, rollback, handoff evidence",
    missingAction: "Upload readiness evidence before value tracking starts.",
  },
  "value.realized-actuals": {
    item: "Realized value file",
    requirement: "1 required value snapshot",
    sourceSystem: "Run-cost / SLA-credit / productivity actuals",
    ownerRole: "Value realization lead",
    acceptedFormats: "CSV or XLSX",
    parseTarget: "Realized value to date by committed lever",
    missingAction: "Upload realized actuals to prove value, not promise it.",
  },
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
  viewStage,
  tenantName,
  stageView,
  stepInsight,
  artifacts = [],
  approvalItems = [],
  approvalLedger = [],
  guidebook = null,
  latestArtifactAcceptances = [],
  initialWorkspace,
  contractOptimizationProfile = null,
  journey,
  selectionReadiness = null,
  vendorResponseReadiness = null,
  vendorResponseProfiles = null,
  vendorChallengeIntelligence = null,
  vendorBafoInstructionPack = null,
  vendorEvaluationDecisionView = null,
  vendorResponseParseReports = [],
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
    () =>
      adaptStageViewToSourceJourney(
        stageView ?? sampleStageViewFor(viewStage, journey),
        journey,
      ),
    [journey, stageView, viewStage],
  );
  const resolvedStageView: StageAnalyticsView = useMemo(
    () => (stepInsight ? { ...baseStageView, stepInsight } : baseStageView),
    [baseStageView, stepInsight],
  );

  const shellView = useMemo(
    () =>
      buildSourceEventShellView({
        event,
        tenantName,
        viewedStageKey: viewStage,
        stageView: resolvedStageView,
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
      stepInsight,
      tenantName,
      viewStage,
      workspace,
    ],
  );

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
          <div style={CANVAS_STYLE}>
            <SourceShellRail
              view={shellView}
              workspace={workspace}
              onWorkspaceChange={setWorkspace}
            />
            <div style={{ minWidth: 0, padding: "28px 28px 150px" }}>
              {contractOptimizationProfile ? (
                <div style={{ marginBottom: 28 }}>
                  <ContractOptimizationProfilePanel
                    profile={contractOptimizationProfile}
                  />
                </div>
              ) : null}
              {selectionReadiness && workspace === "steps" ? (
                <div
                  data-testid="source-shell-selection-readiness-bridge"
                  style={{ maxWidth: 1040, marginBottom: 12 }}
                >
                  <SourceVendorSelectionReadinessPanel
                    readiness={selectionReadiness}
                  />
                </div>
              ) : null}
              <SourceWorkspace
                view={shellView}
                stageView={resolvedStageView}
                workspace={workspace}
                vendorResponseReadiness={vendorResponseReadiness}
                vendorResponseProfiles={vendorResponseProfiles}
                vendorChallengeIntelligence={vendorChallengeIntelligence}
                vendorBafoInstructionPack={vendorBafoInstructionPack}
                vendorEvaluationDecisionView={vendorEvaluationDecisionView}
                vendorResponseParseReports={vendorResponseParseReports}
                eventDisplayName={event.name}
                contractOptimizationProfile={contractOptimizationProfile}
                onWorkspaceChange={setWorkspace}
                onClientFinalAccepted={() => router.refresh()}
              />
            </div>
          </div>
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

function SourceShellRail({
  view,
  workspace,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
  workspace: SourceShellWorkspace;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
}) {
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
        href="/source/portfolio"
        style={{
          color: ANALYTICS.MUTED,
          fontSize: 12,
          textDecoration: "none",
        }}
      >
        ← All Source events
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
        {view.journey.map((stage) => (
          <Link
            key={stage.key}
            href={`/source/events/${view.event.id}?stage=${stage.key}`}
            style={{
              display: "grid",
              gridTemplateColumns: "22px 1fr auto",
              gap: 9,
              alignItems: "center",
              padding: "8px 9px",
              borderRadius: 8,
              border: stage.viewed
                ? `1px solid ${ANALYTICS.LINE}`
                : "1px solid transparent",
              background: stage.viewed ? ANALYTICS.CARD : "transparent",
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
                  stage.state === "past"
                    ? ANALYTICS.INK
                    : stage.current
                      ? ANALYTICS.BLUE
                      : ANALYTICS.CARD,
                color:
                  stage.state === "past" || stage.current
                    ? "#fff"
                    : ANALYTICS.FAINT,
                border:
                  stage.state === "past" || stage.current
                    ? "none"
                    : `1px solid ${ANALYTICS.LINE_STRONG}`,
                fontFamily: ANALYTICS.MONO,
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {stage.state === "past"
                ? "✓"
                : String(stage.index).padStart(2, "0")}
            </span>
            <span
              style={{
                color:
                  stage.viewed || stage.current || stage.state === "past"
                    ? ANALYTICS.INK
                    : ANALYTICS.MUTED,
                fontSize: 13,
                fontWeight: stage.viewed ? 700 : 600,
              }}
            >
              {stage.label}
            </span>
            <span
              style={{
                color: ANALYTICS.FAINT,
                fontFamily: ANALYTICS.MONO,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {stage.viewed ? `${stage.done}/${stage.total}` : ""}
            </span>
          </Link>
        ))}
      </div>

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

function SourceWorkspace({
  view,
  stageView,
  workspace,
  vendorResponseReadiness,
  vendorResponseProfiles,
  vendorChallengeIntelligence,
  vendorBafoInstructionPack,
  vendorEvaluationDecisionView,
  vendorResponseParseReports,
  eventDisplayName,
  contractOptimizationProfile,
  onWorkspaceChange,
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
  stageView: StageAnalyticsView;
  workspace: SourceShellWorkspace;
  vendorResponseReadiness?: SourceVendorResponseCompleteness | null;
  vendorResponseProfiles?: VendorResponseProfileSet | null;
  vendorChallengeIntelligence?: VendorChallengeIntelligence | null;
  vendorBafoInstructionPack?: VendorBafoInstructionPack | null;
  vendorEvaluationDecisionView?: VendorEvaluationDecisionView | null;
  vendorResponseParseReports?: VendorResponseParseReport[];
  eventDisplayName?: string;
  contractOptimizationProfile?: ContractOptimizationMveProfile | null;
  onWorkspaceChange: (workspace: SourceShellWorkspace) => void;
  onClientFinalAccepted: () => void;
}) {
  if (workspace === "files") {
    return (
      <FilesWorkspace
        view={view}
        onClientFinalAccepted={onClientFinalAccepted}
      />
    );
  }
  if (workspace === "intelligence") {
    return <IntelligenceWorkspace view={view} stageView={stageView} />;
  }
  if (workspace === "approvals")
    return (
      <ApprovalsWorkspace
        view={view}
        gateAction={stageView.gate.action}
        onGoToSteps={() => onWorkspaceChange("steps")}
      />
    );
  if (workspace === "guidebook") return <GuidebookWorkspace view={view} />;

  return (
    <section data-testid="source-shell-v2-steps">
      <StageHeader view={view} />
      <FocusedWorkPanel view={view} onWorkspaceChange={onWorkspaceChange} />
      {view.stage.key === "responses" ? (
        <div style={{ marginTop: 16, maxWidth: 1040 }}>
          <ResponsesStageView
            readiness={vendorResponseReadiness ?? undefined}
            profileSet={vendorResponseProfiles}
            challengeIntelligence={vendorChallengeIntelligence}
            bafoInstructionPack={vendorBafoInstructionPack}
            evaluationDecisionView={vendorEvaluationDecisionView}
            parseReports={vendorResponseParseReports}
            contractOptimizationProfile={contractOptimizationProfile}
            eventDisplayName={eventDisplayName}
            documentWorkspace={null}
          />
        </div>
      ) : null}
    </section>
  );
}

function StageHeader({ view }: { view: SourceEventShellView }) {
  const stageIndex =
    view.journey.find((stage) => stage.key === view.stage.key)?.index ?? 1;
  // Keep the headline owner simple; richer agent handoffs live in the stage
  // work model and the journey-specific rail note.
  const leadAgentLabel =
    view.stage.key === "transition" || view.stage.key === "value"
      ? "Atlas"
      : "aVa";

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
              fontSize: 26,
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
                background: ANALYTICS.GREEN,
              }}
            />
          </div>
          <span style={{ color: ANALYTICS.FAINT, fontSize: 12 }}>ready</span>
        </div>
      </div>
    </header>
  );
}

function FocusedWorkPanel({
  view,
  onWorkspaceChange,
}: {
  view: SourceEventShellView;
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
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        flatSteps
          .filter((step) => step.status === "captured")
          .map((step) => step.id),
      ),
  );
  const [activeStepId, setActiveStepId] = useState<string | null>(
    () =>
      flatSteps.find((step) => step.status !== "captured")?.id ??
      flatSteps[0]?.id ??
      null,
  );

  useEffect(() => {
    setCompletedIds(
      new Set(
        flatSteps
          .filter((step) => step.status === "captured")
          .map((step) => step.id),
      ),
    );
    setActiveStepId(
      flatSteps.find((step) => step.status !== "captured")?.id ??
        flatSteps[0]?.id ??
        null,
    );
  }, [flatSteps, view.event.id, view.stage.key]);

  const isComplete = (step: SourceShellStep) =>
    step.status === "captured" || completedIds.has(step.id);
  const doneCount = flatSteps.filter(isComplete).length;
  const allReady = flatSteps.length > 0 && doneCount === flatSteps.length;
  const activeStep =
    flatSteps.find((step) => step.id === activeStepId) ??
    flatSteps.find((step) => step.status !== "captured") ??
    flatSteps[0] ??
    null;
  const activeIndex = activeStep
    ? flatSteps.findIndex((step) => step.id === activeStep.id)
    : -1;
  const activeComplete = activeStep ? isComplete(activeStep) : false;
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

  const markComplete = (stepId: string) => {
    setCompletedIds((prev) => new Set(prev).add(stepId));
  };

  const openApprovalPage = () => {
    if (view.stage.approvalHref) {
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
      style={{
        ...CARD_STYLE,
        display: "grid",
        gridTemplateColumns: "286px minmax(0, 1fr)",
        maxWidth: 1120,
        overflow: "hidden",
        boxShadow: ANALYTICS.SHADOW_SM,
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
            ? `All required work is complete for ${view.stage.label}. Open the approval gate when the owner is ready.`
            : `${flatSteps.length - doneCount} step${flatSteps.length - doneCount === 1 ? "" : "s"} left before ${view.stage.label} can move to approval.`}
        </div>
      </div>

      <div>
        {allReady ? (
          <StageReadyPanel
            view={view}
            onOpenApprovalPage={openApprovalPage}
            onReviewApprovals={() => onWorkspaceChange("approvals")}
            onOpenFiles={() => onWorkspaceChange("files")}
          />
        ) : activeStep ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
              <button
                type="button"
                disabled={!activeComplete}
                onClick={goNext}
                style={{
                  border: `1px solid ${activeComplete ? ANALYTICS.INK : ANALYTICS.LINE_STRONG}`,
                  borderRadius: 8,
                  background: activeComplete ? ANALYTICS.INK : "#e8e0d4",
                  color: activeComplete ? "#fff" : "#81786a",
                  cursor: activeComplete ? "pointer" : "not-allowed",
                  fontFamily: ANALYTICS.SANS,
                  fontSize: 13,
                  fontWeight: 900,
                  minHeight: 42,
                  minWidth: activeIndex >= flatSteps.length - 1 ? 176 : 128,
                  padding: "0 16px",
                  whiteSpace: "nowrap",
                }}
              >
                {activeIndex >= flatSteps.length - 1
                  ? `Open ${view.stage.label} gate →`
                  : "Continue →"}
              </button>
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

              <ActiveStepNeedsPanel
                step={activeStep}
                isComplete={activeComplete}
              />

              <ActiveStepGuidePanel
                step={activeStep}
                stageLabel={view.stage.label}
                isComplete={activeComplete}
                guidebook={view.guidebook.record}
                onOpenGuidebook={() => onWorkspaceChange("guidebook")}
              />

              {activeGroup ? (
                <EvidenceAskTable
                  group={activeGroup}
                  activeStepId={activeStep.id}
                />
              ) : null}

              <StepDetail
                step={activeStep}
                eventId={view.event.id}
                stageKey={view.stage.key}
                stepInsight={view.intelligence.stepInsight}
                isComplete={activeComplete}
                onComplete={() => markComplete(activeStep.id)}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
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
  onOpenApprovalPage,
  onReviewApprovals,
  onOpenFiles,
}: {
  view: SourceEventShellView;
  onOpenApprovalPage: () => void;
  onReviewApprovals: () => void;
  onOpenFiles: () => void;
}) {
  const hasArtifactGaps = view.stage.artifactReadiness.blockerCount > 0;
  return (
    <div
      data-testid="source-shell-stage-ready-panel"
      style={{
        display: "grid",
        gap: 18,
        maxWidth: 760,
      }}
    >
      <div>
        <div
          style={{
            color: hasArtifactGaps
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
          {hasArtifactGaps
            ? "Inputs ready - artifact review open"
            : "Stage ready"}
        </div>
        <h2 style={{ fontSize: 20, lineHeight: 1.25, margin: 0 }}>
          {hasArtifactGaps
            ? `Required inputs are complete, but ${view.stage.artifactReadiness.blockerCount} artifact review item${view.stage.artifactReadiness.blockerCount === 1 ? "" : "s"} remain.`
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
          {hasArtifactGaps
            ? "Open the approval page to decide with a clear rationale, or return to Files to accept client-final artifacts and close quality gates before the stage advances."
            : "The next step is the approval page. Review the captured evidence, record the decision, and advance the event from there."}
        </p>
      </div>
      {hasArtifactGaps ? (
        <div
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
      <div style={{ display: "grid", gap: 12 }}>
        {view.stage.groups.map((group) => (
          <EvidenceAskTable key={group.id} group={group} inset={false} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button
          type="button"
          data-testid="source-stage-ready-open-approval"
          onClick={onOpenApprovalPage}
          style={{
            ...BUTTON_STYLE,
            background: ANALYTICS.INK,
            color: "#fff",
            display: "inline-flex",
            justifyContent: "center",
            padding: "12px 16px",
            width: "fit-content",
          }}
        >
          {view.stage.approvalCtaLabel}
        </button>
        <button
          type="button"
          data-testid="source-stage-ready-review-approval"
          onClick={onReviewApprovals}
          style={{
            ...BUTTON_STYLE,
            display: "inline-flex",
            justifyContent: "center",
            padding: "12px 16px",
            width: "fit-content",
          }}
        >
          Review readiness here
        </button>
        {hasArtifactGaps ? (
          <button
            type="button"
            data-testid="source-stage-ready-open-files"
            onClick={onOpenFiles}
            style={{
              ...BUTTON_STYLE,
              display: "inline-flex",
              justifyContent: "center",
              padding: "12px 16px",
              width: "fit-content",
            }}
          >
            Review file blockers
          </button>
        ) : null}
      </div>
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
        Copy/share approval URL
      </Link>
    </div>
  );
}

function EvidenceAskTable({
  group,
  activeStepId,
  inset = true,
}: {
  group?: SourceShellStepGroup;
  activeStepId?: string;
  inset?: boolean;
}) {
  if (!group) return null;
  return (
    <div
      data-testid="source-shell-evidence-ask-table"
      style={{
        border: `1px solid ${ANALYTICS.LINE}`,
        borderRadius: 8,
        margin: inset ? "0 0 16px 42px" : 0,
        maxWidth: 760,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          borderBottom: `1px solid ${ANALYTICS.LINE_SOFT}`,
          color: ANALYTICS.INK,
          fontSize: 13,
          fontWeight: 800,
          padding: "10px 12px",
        }}
      >
        {group.label}
      </div>
      <div
        style={{
          background: ANALYTICS.PAGE_BG,
          color: ANALYTICS.MUTED,
          display: "grid",
          fontFamily: ANALYTICS.MONO,
          fontSize: 9,
          fontWeight: 800,
          gridTemplateColumns: "1.05fr 96px 1.25fr 108px 112px",
          letterSpacing: "0.06em",
          padding: "9px 12px",
          textTransform: "uppercase",
        }}
      >
        <span>What is needed</span>
        <span>Required</span>
        <span>Source</span>
        <span>Status</span>
        <span>Action</span>
      </div>
      {group.steps.map((step, index) => {
        const active = step.id === activeStepId;
        const captured = step.status === "captured";
        const need = activeStepNeed(step, captured);
        return (
          <div
            key={step.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 96px 1.25fr 108px 112px",
              gap: 12,
              padding: "11px 12px",
              borderTop:
                index === 0 ? "none" : `1px solid ${ANALYTICS.LINE_SOFT}`,
              background: active ? "#fbfaf6" : ANALYTICS.CARD,
              color: active || captured ? ANALYTICS.INK : ANALYTICS.MUTED,
              fontSize: 12.5,
              lineHeight: 1.35,
            }}
          >
            <b>{step.title}</b>
            <span
              style={{
                color: captured
                  ? ANALYTICS.GREEN_TEXT
                  : active
                    ? ANALYTICS.AMBER_TEXT
                    : ANALYTICS.FAINT,
                fontWeight: 800,
              }}
            >
              {need.requirement}
            </span>
            <span style={{ color: active ? ANALYTICS.INK_2 : ANALYTICS.MUTED }}>
              {need.sourceSystem} · {need.formats}
            </span>
            <span
              style={{
                color: captured
                  ? ANALYTICS.GREEN_TEXT
                  : active
                    ? ANALYTICS.AMBER_TEXT
                    : ANALYTICS.FAINT,
                fontWeight: 800,
              }}
            >
              {captured ? "Reviewed" : active ? "Now" : "Pending"}
            </span>
            <span
              style={{
                border: `1px solid ${captured ? "rgba(17, 120, 84, 0.24)" : ANALYTICS.LINE}`,
                borderRadius: 999,
                color: captured
                  ? ANALYTICS.GREEN_TEXT
                  : active
                    ? ANALYTICS.INK
                    : ANALYTICS.FAINT,
                fontSize: 11,
                fontWeight: 800,
                padding: "5px 8px",
                textAlign: "center",
              }}
            >
              {captured
                ? "Done"
                : active
                  ? step.type === "provide"
                    ? "Upload below"
                    : step.cta
                  : "Select when ready"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ActiveStepNeedsPanel({
  step,
  isComplete,
}: {
  step: SourceShellStep;
  isComplete: boolean;
}) {
  const need = activeStepNeed(step, isComplete);
  return (
    <div
      data-testid="source-shell-active-step-needs"
      style={{
        border: `1px solid ${ANALYTICS.LINE}`,
        borderRadius: 8,
        background: ANALYTICS.CARD,
        margin: "0 0 16px 42px",
        maxWidth: 760,
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
          gridTemplateColumns: "repeat(auto-fit, minmax(142px, 1fr))",
          gap: 12,
          padding: "11px 12px 8px",
        }}
      >
        <StepNeedDatum label="Needed" value={need.item} />
        <StepNeedDatum label="Required" value={need.requirement} />
        <StepNeedDatum label="Source system" value={need.sourceSystem} />
        <StepNeedDatum label="Owner role" value={need.owner} />
      </div>
      <div
        style={{
          borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(142px, 1fr))",
          gap: 12,
          padding: "9px 12px 11px",
        }}
      >
        <StepNeedDatum label="Formats" value={need.formats} />
        <StepNeedDatum label="Parse target" value={need.parseTarget} />
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
        maxWidth: 760,
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
  const uploaded = Boolean(step.file);
  const status = isComplete
    ? "Complete"
    : step.type === "provide"
      ? uploaded
        ? "Uploaded"
        : "Missing"
      : "Needs review";
  const tone: "good" | "warn" = isComplete || uploaded ? "good" : "warn";
  return {
    item: requirement.item,
    requirement: requirement.requirement,
    sourceSystem: step.provenance?.source ?? requirement.sourceSystem,
    owner: step.provenance?.owner ?? requirement.ownerRole,
    formats: requirement.acceptedFormats,
    parseTarget: requirement.parseTarget,
    status,
    tone,
    nextAction: activeStepNextAction(step, isComplete, uploaded, requirement),
  };
}

function stepRequirementFor(step: SourceShellStep): WorkflowStepRequirement {
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
    requirement:
      step.type === "provide"
        ? "1 required file"
        : step.type === "decide"
          ? "1 required decision"
          : "1 required confirmation",
    sourceSystem,
    ownerRole,
    acceptedFormats,
    parseTarget,
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
  if (isComplete) return requirement.completeAction ?? "Continue is enabled.";
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
  onComplete,
}: {
  step: SourceEventShellView["stage"]["activeStep"];
  eventId: string;
  stageKey: SourceStageKey;
  stepInsight: SourceEventShellView["intelligence"]["stepInsight"];
  isComplete: boolean;
  onComplete: () => void;
}) {
  const router = useRouter();
  const [actionState, setActionState] = useState<
    | { phase: "idle" }
    | { phase: "saving" }
    | { phase: "error"; message: string }
  >({ phase: "idle" });
  if (!step) return null;
  const activeStep = step;
  const evidenceRequirementId = evidenceRequirementIdForTask({
    id: activeStep.id,
    factTemplateCode: activeStep.factTemplateCode ?? undefined,
  });
  const canPersistAction =
    activeStep.type !== "provide" && Boolean(evidenceRequirementId);
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
      response = await fetch(
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

    onComplete();
    setActionState({ phase: "idle" });
    router.refresh();
  }

  const actionButton = canPersistAction ? (
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
      <div style={{ marginLeft: 42, maxWidth: 760 }}>
        {evidenceRow}
        <div
          style={{
            border: `1px solid ${ANALYTICS.LINE}`,
            borderRadius: 8,
            overflow: "hidden",
            maxWidth: 680,
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
      <div style={{ marginLeft: 42, maxWidth: 680 }}>
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
          onUploaded={onComplete}
        />
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

function ActiveStepRequirementRow({
  step,
  isComplete,
  factTemplateCode,
}: {
  step: SourceShellStep;
  isComplete: boolean;
  factTemplateCode?: string;
}) {
  const ownerSource = step.provenance
    ? `${step.provenance.owner} / ${step.provenance.source}`
    : step.file
      ? step.file.name
      : "Review on this page";
  const format = factTemplateCode
    ? "CSV/XLSX template"
    : step.file
      ? step.file.format
      : step.type === "provide"
        ? "Upload file"
        : step.type === "decide"
          ? "Decision"
          : "Review";
  const action =
    step.type === "provide"
      ? "Download template, fill it, upload here"
      : step.type === "decide"
        ? "Review, record decision, save"
        : "Review and confirm";
  return (
    <div
      data-testid="source-active-requirement-row"
      style={{
        border: `1px solid ${ANALYTICS.LINE}`,
        borderRadius: 8,
        marginBottom: 14,
        maxWidth: 760,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: ANALYTICS.PAGE_BG,
          color: ANALYTICS.MUTED,
          display: "grid",
          fontFamily: ANALYTICS.MONO,
          fontSize: 9,
          fontWeight: 850,
          gridTemplateColumns: "1.2fr 1.5fr 120px 116px",
          letterSpacing: "0.06em",
          padding: "8px 12px",
          textTransform: "uppercase",
        }}
      >
        <span>Required input</span>
        <span>Owner / source</span>
        <span>Format</span>
        <span>Status</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.5fr 120px 116px",
          gap: 12,
          padding: "11px 12px",
          color: ANALYTICS.INK,
          fontSize: 12.5,
          lineHeight: 1.35,
        }}
      >
        <span>
          <b>{step.title}</b>
          <span
            style={{
              color: ANALYTICS.MUTED,
              display: "block",
              fontSize: 11.5,
              marginTop: 2,
            }}
          >
            {action}
          </span>
        </span>
        <span style={{ color: ANALYTICS.INK_2 }}>{ownerSource}</span>
        <span style={{ color: ANALYTICS.MUTED }}>{format}</span>
        <span
          style={{
            color: isComplete ? ANALYTICS.GREEN_TEXT : ANALYTICS.AMBER_TEXT,
            fontWeight: 850,
          }}
        >
          {isComplete ? "Done" : "Needed"}
        </span>
      </div>
    </div>
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
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
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
      <SessionEvidenceCapturePanel
        eventId={view.event.id}
        stageKey={view.event.viewedStageKey}
        stageLabel={view.event.viewedStageLabel}
        onUploaded={onClientFinalAccepted}
      />
      <EvidenceReadinessPanel files={view.files.items} />
      <ArtifactLifecyclePanel
        view={view}
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

function EvidenceReadinessPanel({
  files,
}: {
  files: readonly SourceShellFileItem[];
}) {
  const summary = summarizeEvidenceReadiness(files);
  const registeredOnly = files
    .filter((file) => file.parseStatus !== "parsed")
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
            Files are persisted in Source as soon as upload succeeds. Parsed
            files can support Source evidence now; search indexing and
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
            ["Stored", summary.storedCount],
            ["Parsed", summary.parsedCount],
            ["Needs parser", summary.registeredOnlyCount],
            ["Parser failed", summary.failedCount],
            ["Search-ready", summary.searchReadyCount],
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
      if (a.file.artifactRole !== b.file.artifactRole) {
        return a.file.artifactRole === "authoritative" ? -1 : 1;
      }
      if (a.readyForUse !== b.readyForUse) return a.readyForUse ? 1 : -1;
      return a.file.name.localeCompare(b.file.name);
    })
    .slice(0, 6);

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
            next action.
          </p>
        </div>
        <span style={SMALL_STATUS_PILL}>
          {rows.filter((row) => row.readyForUse).length}/{rows.length} ready
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
                        file.artifactRole === "authoritative"
                          ? "Gate"
                          : "Evidence"
                      }
                      tone={
                        file.artifactRole === "authoritative"
                          ? "good"
                          : "neutral"
                      }
                    />
                  </td>
                  <td style={FILE_TD_CENTER}>
                    <ReadinessChip
                      label={fileParseReadinessLabel(file)}
                      tone={file.parseStatus === "parsed" ? "good" : "warn"}
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
  const storedCount = files.length;
  const parsedCount = files.filter(
    (file) => file.parseStatus === "parsed",
  ).length;
  const failedCount = files.filter(
    (file) => file.parseStatus === "failed",
  ).length;
  const registeredOnlyCount = files.filter(
    (file) => file.parseStatus !== "parsed",
  ).length;
  const searchReadyCount = files.filter(
    (file) => file.embeddingStatus === "embedded",
  ).length;

  return {
    storedCount,
    parsedCount,
    failedCount,
    registeredOnlyCount,
    searchReadyCount,
  };
}

function fileReadyForUse(file: SourceShellFileItem): boolean {
  return (
    file.parseStatus === "parsed" &&
    !file.needsComplianceReview &&
    (file.artifactRole === "evidence" || Boolean(file.latestAcceptance))
  );
}

function fileParseReadinessLabel(file: SourceShellFileItem): string {
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
  if (file.needsComplianceReview) {
    return "Resolve compliance review before this file influences scoring or approval.";
  }
  if (file.parseStatus !== "parsed") {
    return "Run or retry parser before using this file as evidence.";
  }
  if (file.artifactRole === "authoritative" && !file.latestAcceptance) {
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
  onClientFinalAccepted,
}: {
  view: SourceEventShellView;
  onClientFinalAccepted: () => void;
}) {
  const lifecycle = view.files.lifecycle;
  // Default to the stage the user is actually viewing — a wall of every
  // artifact standard across all 11 stages (most of them not reached yet)
  // is exactly the "lines and lines of content" this panel should avoid.
  // One click still reaches every stage when that's genuinely needed.
  const [showAllStages, setShowAllStages] = useState(false);
  const visibleLifecycleRows = showAllStages
    ? lifecycle.rows
    : lifecycle.rows.filter((row) => row.stageLabel === view.stage.label);
  const rowsByStage = groupLifecycleRows(visibleLifecycleRows);
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
              onClientFinalAccepted={onClientFinalAccepted}
            />
          ))
        )}
      </div>
    </section>
  );
}

function LifecycleStageRows({
  eventId,
  group,
  onClientFinalAccepted,
}: {
  eventId: string;
  group: { stageLabel: string; rows: SourceArtifactLifecycleRow[] };
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
            {row.lifecycleState === "ai_draft" ? (
              <div style={{ marginTop: 10 }}>
                <AcceptClientFinalButton
                  eventId={eventId}
                  artifactCode={row.code}
                  artifactName={row.name}
                  hasGeneratedDraft
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
}: {
  view: SourceEventShellView;
  stageView: StageAnalyticsView;
}) {
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
          <IntelligenceReadinessBrief view={view} />
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

function IntelligenceReadinessBrief({ view }: { view: SourceEventShellView }) {
  const currentStageFiles =
    view.files.byStage.find((stage) => stage.stageKey === view.stage.key)
      ?.items ?? [];
  const missing = intelligenceMissingLine(view);
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
  const nextAction =
    view.stage.ready < view.stage.total
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
  gateAction,
  onGoToSteps,
}: {
  view: SourceEventShellView;
  gateAction?: StageGateActionView;
  onGoToSteps: () => void;
}) {
  return (
    <section data-testid="source-shell-v2-approvals">
      <WorkspaceTitle
        eyebrow="Approvals"
        title="Stage decisions"
        subtitle="The workflow prepares the evidence; this page records the approval decision."
      />
      <ApprovalReadinessBrief view={view} />
      {view.approvals.currentStageItem ? (
        <ApprovalCard
          item={view.approvals.currentStageItem}
          gateAction={gateAction}
          featured
          onGoToSteps={onGoToSteps}
        />
      ) : (
        <EmptyCard text={view.approvals.readinessLine} />
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
    </section>
  );
}

function ApprovalReadinessBrief({ view }: { view: SourceEventShellView }) {
  const workflowComplete = view.stage.ready >= view.stage.total;
  const filesReady = view.stage.artifactReadiness.ready;
  const ready = workflowComplete && filesReady;
  const decision =
    view.approvals.currentStageItem != null
      ? `${view.stage.label} gate decision routed.`
      : `No approval item is currently routed for ${view.stage.label}.`;
  const nextAction = !workflowComplete
    ? "Return to steps."
    : !filesReady
      ? "Review Files gaps."
      : (view.approvals.currentStageItem?.actionLabel ?? "No approval action.");

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
            {ready ? "Ready to decide" : "Not ready to decide"}
          </h3>
        </div>
        <span
          style={{
            ...SMALL_STATUS_PILL,
            color: ready ? ANALYTICS.GREEN_TEXT : ANALYTICS.AMBER_TEXT,
          }}
        >
          {ready ? "Ready" : "Blocked"}
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
          label="Workflow"
          value={`${view.stage.ready}/${view.stage.total} steps complete`}
          tone={workflowComplete ? "good" : "warn"}
        />
        <StepNeedDatum
          label="Files"
          value={
            filesReady
              ? "No file blockers"
              : `${view.stage.artifactReadiness.blockerCount} review gap${view.stage.artifactReadiness.blockerCount === 1 ? "" : "s"}`
          }
          tone={filesReady ? "good" : "warn"}
        />
        <StepNeedDatum label="Decision" value={decision} />
        <StepNeedDatum
          label="Next action"
          value={nextAction}
          tone={ready ? "good" : "warn"}
        />
      </div>
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
        <span>{view.stage.readyPct}% ready</span>
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
          value={view.stage.approvalCtaLabel}
          body={
            view.stage.readyPct === 100
              ? "Required evidence is complete. Open the approval gate and record the rationale before advancing."
              : view.stage.gateReadinessLine
          }
        />
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
  featured = false,
  onGoToSteps,
}: {
  item: ApprovalsInboxItem;
  gateAction?: StageGateActionView;
  featured?: boolean;
  onGoToSteps?: () => void;
}) {
  // The featured card's stage-gate href always points at the page the user
  // is already viewing (this event, this stage) — a <Link> there is a
  // same-URL nav that visibly does nothing. The real decision controls for a
  // stage gate live in the Steps workspace, so switch tabs there instead.
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
        {gateAction ? (
          <StageGateApprovalButton
            action={gateAction}
            status={item.status}
            stageLabel={item.stageLabel}
          />
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
}: {
  action: StageGateActionView;
  status: ApprovalsInboxItem["status"];
  stageLabel: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rationale, setRationale] = useState(action.rationale);
  const requiresRationale = status === "ready_with_gaps";
  const buttonLabel =
    status === "ready_with_gaps" ? "Approve with gaps" : "Approve now";
  const trimmedRationale = rationale.trim();
  const disabled =
    submitting || (requiresRationale && trimmedRationale.length === 0);

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
        aria-label={`${stageLabel ?? "Stage"} approval rationale`}
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
      <button
        type="button"
        data-testid="source-stage-gate-approve"
        disabled={disabled}
        onClick={() => void approve()}
        style={{
          ...BUTTON_STYLE,
          padding: "10px 12px",
          background: disabled ? "rgba(10,10,11,0.14)" : ANALYTICS.INK,
          color: disabled ? ANALYTICS.FAINT : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Approving..." : `${buttonLabel} →`}
      </button>
      {requiresRationale ? (
        <span style={{ color: ANALYTICS.FAINT, fontSize: 11.5 }}>
          Rationale is required when approving with gaps.
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
