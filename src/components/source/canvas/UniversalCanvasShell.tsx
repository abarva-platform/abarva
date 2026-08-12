"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SourceOnboardingTour } from "@/components/source/onboarding/SourceOnboardingTour";
import { listSupportedGenerationCodes } from "@/lib/source/agent-generation";

// xlsx-generatable codes — surfaced to the canvas so the artifact card
// shows a "Download xlsx template" anchor on the right rows. Hardcoded
// here to keep the canvas client-bundle free of `'server-only'` imports
// — the Source-side xlsx renderer set is small and slow-changing.
const XLSX_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
  "d04_app_inv",
  "d11_response_checklist",
  "d16_scorecard",
  "d19_pricing_workbook",
  "d20_trap_log",
  "d22_bafo_question_pack",
  // Lifecycle-coverage wave — 4 structured artifacts with xlsx working
  // surface (mirrors the server-side XLSX_GENERATABLE_CODES set).
  "dx2_market_scan",
  "dx4_tco_iceberg",
  "dx6a_ai_clause_gap",
  "dx7_renewal_decision",
]);
// Comparison-mode codes — show a second "Download comparison xlsx"
// anchor alongside the standard template. Today only d19 (pricing).
const XLSX_COMPARISON_CODES_CLIENT: ReadonlySet<string> = new Set([
  "d19_pricing_workbook",
]);
// Codes for which Source has a docx renderer. Slice 3.x shipped
// narrative artifacts; Slice 5 added the structured-data artifacts
// (d04/d11/d16); Slice G7 closes the parity gap so every structured
// artifact (d19 pricing, d20 trap log, d22 BAFO) has a readable docx
// alongside its xlsx working surface.
const DOCX_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
  "d01_strategy_memo",
  "d04_app_inv",
  "d05_scope_memo",
  "d09_rfp_pack",
  "d11_response_checklist",
  "d16_scorecard",
  "d19_pricing_workbook",
  "d20_trap_log",
  "d22_bafo_question_pack",
  "d24_decision_brief",
  "d27_selection_memo",
  // Lifecycle-coverage wave — all 7 new artifacts produce docx.
  "dx0_demand_challenge",
  "dx1_sourcing_approach",
  "dx2_market_scan",
  "dx4_tco_iceberg",
  "dx6a_ai_clause_gap",
  "dx6b_vendor_risk_pack",
  "dx7_renewal_decision",
]);
// Codes for which Source has an HTML renderer. Slice 4.1 — narrative
// artifacts only; HTML is a long-form share surface, not a structured-
// grid surface (structured artifacts use xlsx / docx / pdf).
const HTML_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
  "d01_strategy_memo",
  "d05_scope_memo",
  "d09_rfp_pack",
  "d24_decision_brief",
  "d27_selection_memo",
  // Lifecycle-coverage wave — AI Clause Gap also has an HTML render
  // for shareable legal-counsel review.
  "dx6a_ai_clause_gap",
]);
// Codes for which Source has a PDF renderer. Slice 4.2 shipped the
// narrative artifacts; Slice G7 adds every structured artifact so a
// board pack never has to embed a spreadsheet.
const PDF_GENERATABLE_CODES_CLIENT: ReadonlySet<string> = new Set([
  "d01_strategy_memo",
  "d04_app_inv",
  "d05_scope_memo",
  "d09_rfp_pack",
  "d11_response_checklist",
  "d16_scorecard",
  "d19_pricing_workbook",
  "d20_trap_log",
  "d22_bafo_question_pack",
  "d24_decision_brief",
  "d27_selection_memo",
  // Lifecycle-coverage wave — every new artifact has a PDF surface.
  "dx0_demand_challenge",
  "dx1_sourcing_approach",
  "dx2_market_scan",
  "dx4_tco_iceberg",
  "dx6a_ai_clause_gap",
  "dx6b_vendor_risk_pack",
  "dx7_renewal_decision",
]);
import type {
  SourceEventArtifactState,
  SourceEventArtifactStatus,
  SourceEventEvidence,
  SourceEventGateCriterion,
  SourceEventGateCriterionState,
} from "@/lib/source/canvas-substrate";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "@/lib/source/constants";
import { canvasDockAgentForStage } from "@/lib/source/portfolio-derivations";
import type { SourceStageKey, SourcingEventSummary } from "@/lib/source/types";
import type {
  AttachmentRef,
  ChatMessage,
  SuggestedAction,
} from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { EventIdStrip } from "./EventIdStrip";
import { EventStepRail } from "./EventStepRail";
import { EventWorkspace, type WorkspaceTabKey } from "./EventWorkspace";
import { CANVAS } from "./canvas-tokens";
import { CanvasGateSidebar } from "./CanvasGateSidebar";
import { AvaBottomBar } from "./AvaBottomBar";
import { DocumentTab } from "./workspace-tabs/DocumentTab";
import { EvidenceTab } from "./workspace-tabs/EvidenceTab";
import { LogTab, type ActivityEntry } from "./workspace-tabs/LogTab";
import { threeChoicesForStage } from "./canvas-three-choices";
import { StrategyStageView } from "./strategy/StrategyStageView";
import { ScopeStageView } from "./scope/ScopeStageView";
import { RfpStageView } from "./rfp/RfpStageView";
import { ResponsesStageView } from "./responses/ResponsesStageView";
import { EvaluationStageView } from "./evaluation/EvaluationStageView";
import { PricingStageView } from "./pricing/PricingStageView";
import { BafoStageView } from "./bafo/BafoStageView";
import { BafoScenarioComparePanel } from "./bafo/BafoScenarioComparePanel";
import { ExecutiveDecisionStageView } from "./executive-decision/ExecutiveDecisionStageView";
import { TransitionStageView } from "./transition/TransitionStageView";
import { CommunicationDraftsPanel } from "./workspace-tabs/CommunicationDraftsPanel";
import { StageDecisionLensPanel } from "./workspace-tabs/StageDecisionLensPanel";
import { GateTab } from "./workspace-tabs/GateTab";
import { SimpleFrontErrorBoundary } from "./SimpleFrontErrorBoundary";
import { SimpleStageFront } from "./SimpleStageFront";
import { ContractOptimizationProfilePanel } from "./contract-optimization/ContractOptimizationProfilePanel";
import { VendorResponseProfilesPanel } from "./responses/VendorResponseProfilesPanel";
import { VendorChallengeLeveragePanel } from "./responses/VendorChallengeLeveragePanel";
import { VendorBafoInstructionPackPanel } from "./responses/VendorBafoInstructionPackPanel";
import { VendorEvaluationScorecardPanel } from "./responses/VendorEvaluationScorecardPanel";
import { StageNextMoveCard } from "./StageNextMoveCard";
import { approvalViewForCriterion } from "@/lib/source/approval-routing";
import { criterionById } from "@/lib/source/canonical-specs";
import { computeStageRequirementCoverage } from "@/lib/source/requirement-coverage";
import {
  assessStageGate,
  buildStageRecommendation,
  isAssessmentMet,
} from "@/lib/source/gate-auto-assessment";
import {
  resolveStageNextMove,
  type StageNextMoveActionTarget,
} from "@/lib/source/stage-next-move";
import { resolveSimpleStageScreen } from "@/lib/source/simple-front";
import { buildBafoScenarioCompareView } from "@/lib/source/bafo-scenario-compare-view";
import { nextStepNeeds } from "@/lib/source/next-step-needs";
import { confirmationKeysForStage } from "@/lib/source/stage-gate-confirmations";
import type { SourceStageConfirmations } from "@/lib/source/approval-decision";
import type { AgentResponsePart } from "@/lib/agent/response-parts";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import type {
  VendorChallengeIntelligence,
  VendorBafoInstructionPack,
  VendorEvaluationDecisionView,
} from "@/lib/source/proposal-intelligence/types";
import type { VendorResponseProfileSet } from "@/lib/source/proposal-intelligence/mve-profile";
import type { ContractOptimizationMveProfile } from "@/lib/source/contract-optimization/types";
import {
  normalizeArtifactBlockers,
  type ArtifactBlockerLike,
} from "@/lib/source/contracts/blocker-copy";

interface UniversalCanvasShellProps {
  event: Pick<
    SourcingEventSummary,
    | "id"
    | "code"
    | "name"
    | "accountName"
    | "status"
    | "statusLabel"
    | "archetype"
    | "rigor"
    | "owner"
    | "decisionOwner"
    | "createdByUserId"
    | "currentStageKey"
    | "valueAtStakeUsd"
  >;
  /** Stage being viewed in the workspace; defaults to event.currentStageKey. */
  viewStage: SourceStageKey;
  artifactStates: SourceEventArtifactState[];
  gateCriterionStates: SourceEventGateCriterion[];
  evidenceStates: SourceEventEvidence[];
  registryArtifacts?: SourceArtifactRegistryRecord[];
  /** Map of artifact code → markdown body. Server-loaded. */
  templateByCode: Record<string, string | null>;
  /** Activity log entries (most recent first). */
  activityEntries: ActivityEntry[];
  tenantName: string;
  decisionThreadId?: string | null;
  vendorResponseReadiness?: SourceVendorResponseCompleteness;
  vendorResponseProfiles?: VendorResponseProfileSet | null;
  vendorChallengeIntelligence?: VendorChallengeIntelligence | null;
  vendorBafoInstructionPack?: VendorBafoInstructionPack | null;
  vendorEvaluationDecisionView?: VendorEvaluationDecisionView | null;
  contractOptimizationProfile?: ContractOptimizationMveProfile | null;
  workspaceExplorerEnabled?: boolean;
  strategyAutoDraftEnabled?: boolean;
  simpleFrontEnabled?: boolean;
}

function renderStageDocumentContent({
  viewStage,
  event,
  stageArtifacts,
  selectedDocCode,
  onSelectCode,
  documentTabContent,
  vendorResponseReadiness,
  vendorResponseProfiles,
  vendorChallengeIntelligence,
  vendorBafoInstructionPack,
  vendorEvaluationDecisionView,
  contractOptimizationProfile,
  decisionBriefDocxHref,
  decisionBriefPdfHref,
  eventDisplayName,
  registryArtifacts,
  criteria,
  evidence,
  activityEntries,
}: {
  viewStage: SourceStageKey;
  event: Pick<
    SourcingEventSummary,
    "id" | "name" | "currentStageKey" | "owner" | "valueAtStakeUsd"
  >;
  stageArtifacts: SourceEventArtifactState[];
  criteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
  activityEntries: ActivityEntry[];
  selectedDocCode?: string;
  onSelectCode: (code: string) => void;
  documentTabContent: ReactNode;
  vendorResponseReadiness?: SourceVendorResponseCompleteness;
  vendorResponseProfiles?: VendorResponseProfileSet | null;
  vendorChallengeIntelligence?: VendorChallengeIntelligence | null;
  vendorBafoInstructionPack?: VendorBafoInstructionPack | null;
  vendorEvaluationDecisionView?: VendorEvaluationDecisionView | null;
  contractOptimizationProfile?: ContractOptimizationMveProfile | null;
  decisionBriefDocxHref?: string;
  decisionBriefPdfHref?: string;
  eventDisplayName?: string;
  registryArtifacts?: SourceArtifactRegistryRecord[];
}) {
  if (viewStage === "strategy") {
    return (
      <StrategyStageView
        artifacts={stageArtifacts}
        registryArtifacts={registryArtifacts}
        selectedCode={selectedDocCode}
        onSelectCode={onSelectCode}
        documentWorkspace={documentTabContent}
      />
    );
  }

  if (viewStage === "scope") {
    return <ScopeStageView documentWorkspace={documentTabContent} />;
  }

  if (viewStage === "rfp" || viewStage === "rfp_rfi_package") {
    return <RfpStageView documentWorkspace={documentTabContent} />;
  }

  if (viewStage === "responses" || viewStage === "vendor_responses") {
    return (
      <ResponsesStageView
        readiness={vendorResponseReadiness}
        profileSet={vendorResponseProfiles}
        challengeIntelligence={vendorChallengeIntelligence}
        bafoInstructionPack={vendorBafoInstructionPack}
        evaluationDecisionView={vendorEvaluationDecisionView}
        contractOptimizationProfile={contractOptimizationProfile}
        decisionBriefDocxHref={decisionBriefDocxHref}
        decisionBriefPdfHref={decisionBriefPdfHref}
        eventDisplayName={eventDisplayName}
        documentWorkspace={documentTabContent}
      />
    );
  }

  if (viewStage === "evaluation") {
    return (
      <EvaluationStageView
        evaluationDecisionView={vendorEvaluationDecisionView}
        decisionBriefDocxHref={decisionBriefDocxHref}
        decisionBriefPdfHref={decisionBriefPdfHref}
        eventDisplayName={eventDisplayName}
        documentWorkspace={documentTabContent}
      />
    );
  }

  if (viewStage === "pricing") {
    return (
      <PricingStageView event={event} documentWorkspace={documentTabContent} />
    );
  }

  if (viewStage === "bafo" || viewStage === "orals_bafo") {
    return (
      <BafoStageView event={event} documentWorkspace={documentTabContent} />
    );
  }

  if (viewStage === "executive_decision") {
    return (
      <ExecutiveDecisionStageView
        event={event}
        artifacts={stageArtifacts}
        criteria={criteria}
        evidence={evidence}
        activityEntries={activityEntries}
        documentWorkspace={documentTabContent}
      />
    );
  }

  if (viewStage === "transition") {
    return (
      <TransitionStageView
        event={event}
        documentWorkspace={documentTabContent}
      />
    );
  }

  return documentTabContent;
}

/**
 * Top-level universal sourcing canvas. Three-column layout:
 *   Left  (276px)  — CanvasGateSidebar: always-visible gate criteria checklist
 *   Center (flex)  — EventWorkspace: Document / Evidence / Log tabs
 *   Bottom         — AvaBottomBar: aVa composer + expandable thread panel
 *
 * Reads real data from the canvas substrate — pre-filtered to the stage being
 * viewed. Chat goes through the source Sentinel/Atlas runtime at
 * `/api/v1/source/[eventId]/nexus/ask`. The runtime itself is unchanged.
 *
 * Stage→agent mapping is binary internally:
 *   stages 1–9 (Strategy → Selection)  → Sentinel, presented as aVa Source
 *   stages 10–11 (Transition, Value)   → Atlas
 * (`canvasDockAgentForStage`).
 */
export function UniversalCanvasShell({
  event,
  viewStage,
  artifactStates,
  gateCriterionStates,
  evidenceStates,
  registryArtifacts = [],
  templateByCode,
  activityEntries,
  tenantName,
  decisionThreadId = null,
  vendorResponseReadiness,
  vendorResponseProfiles,
  vendorChallengeIntelligence,
  vendorBafoInstructionPack,
  vendorEvaluationDecisionView,
  contractOptimizationProfile,
  workspaceExplorerEnabled = false,
  strategyAutoDraftEnabled = false,
  simpleFrontEnabled = false,
}: UniversalCanvasShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeClientParam = searchParams?.get("client")?.trim() || null;
  const displayEvent = normalizeSourceEventDisplay(event);
  const sourceArtifactRenderHref = (
    code: string,
    format: "xlsx" | "docx" | "html" | "pdf",
    variant?: "comparison",
  ) => {
    const params = new URLSearchParams({ format });
    if (variant) params.set("variant", variant);
    if (activeClientParam) params.set("client", activeClientParam);
    return `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/render?${params.toString()}`;
  };
  const decisionBriefDocxHref = sourceArtifactRenderHref(
    "d24_decision_brief",
    "docx",
  );
  const decisionBriefPdfHref = sourceArtifactRenderHref(
    "d24_decision_brief",
    "pdf",
  );
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const messageSequenceRef = useRef(0);

  // Persist aVa chat history for this event across stage navigation.
  // Key is event-scoped so switching events always starts fresh.
  const chatStorageKey = `source-chat-${event.id}`;
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(chatStorageKey);
      if (raw) {
        const parsed: ChatMessage[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setThread(parsed);
      }
    } catch {
      // sessionStorage unavailable or corrupt — start fresh
    }
  }, [chatStorageKey]);
  useEffect(() => {
    if (thread.length === 0) return;
    try {
      sessionStorage.setItem(chatStorageKey, JSON.stringify(thread));
    } catch {
      // quota exceeded or unavailable — ignore
    }
  }, [chatStorageKey, thread]);
  const [selectedDocCode, setSelectedDocCode] = useState<string | undefined>(
    undefined,
  );
  const [promotePending, setPromotePending] = useState(false);
  const isLakeshoreDemoCaseStudy = isLakeshoreSharedServicesDemoEvent(event);

  // Per-event artifact state lives in client state so "Mark complete"
  // can update optimistically. Server-loaded props are the source of
  // truth on first render; the PATCH endpoint returns the canonical
  // post-update row to reconcile.
  const [artifactStateMap, setArtifactStateMap] = useState<
    Record<string, SourceEventArtifactState>
  >(() => indexByCode(artifactStates));
  const [pendingStatusByCode, setPendingStatusByCode] = useState<
    Record<string, boolean>
  >({});
  const [pendingBodyByCode, setPendingBodyByCode] = useState<
    Record<string, boolean>
  >({});
  const [pendingGenerationByCode, setPendingGenerationByCode] = useState<
    Record<string, boolean>
  >({});
  // Reasoning envelope captured from the generate route (Slice 1.6b). Only
  // populated when the source_reasoning_spine flag is ON for this tenant.
  const [reasoningByCode, setReasoningByCode] = useState<
    Record<string, { status: string; envelope?: unknown }>
  >({});
  // Stored-documents shelf is server-seeded but mutates client-side when
  // "Generate with Sentinel" succeeds — the generate route now
  // also writes to the source_artifacts registry and returns the new row.
  // Keeping this in state lets the shelf reflect the persisted document
  // without a full page revalidate.
  const [registryArtifactsState, setRegistryArtifactsState] =
    useState<SourceArtifactRegistryRecord[]>(registryArtifacts);
  // Server re-renders (e.g. router.refresh() after an Upload-document POST) pass a
  // fresh registryArtifacts prop, but useState ignores prop updates — the shelf
  // looked frozen after a successful upload (pre-flight finding, 2026-06-11).
  useEffect(() => {
    setRegistryArtifactsState(registryArtifacts);
  }, [registryArtifacts]);
  const generatableCodes = useMemo(
    () => new Set(listSupportedGenerationCodes()),
    [],
  );
  // Same pattern for gate criteria — Mark met / Reopen flips
  // criterion state without round-tripping through the server props.
  const [criterionStateMap, setCriterionStateMap] = useState<
    Record<string, SourceEventGateCriterion>
  >(() => indexByCriterionId(gateCriterionStates));
  const [pendingCriterionByCriterionId, setPendingCriterionByCriterionId] =
    useState<Record<string, boolean>>({});

  const liveArtifactStates = useMemo(
    () => artifactStates.map((a) => artifactStateMap[a.artifactCode] ?? a),
    [artifactStates, artifactStateMap],
  );
  const liveGateCriterionStates = useMemo(
    () => gateCriterionStates.map((c) => criterionStateMap[c.criterionId] ?? c),
    [gateCriterionStates, criterionStateMap],
  );

  // Filter substrate to the stage being viewed.
  const stageArtifacts = useMemo(
    () => liveArtifactStates.filter((a) => a.stage === viewStage),
    [liveArtifactStates, viewStage],
  );
  const stageCriteria = useMemo(
    () => liveGateCriterionStates.filter((c) => c.fromStage === viewStage),
    [liveGateCriterionStates, viewStage],
  );
  const stageEvidence = useMemo(
    () => evidenceStates.filter((e) => e.stage === viewStage),
    [evidenceStates, viewStage],
  );
  const stageGateAssessment = useMemo(
    () =>
      assessStageGate({
        fromStage: viewStage,
        criteria: stageCriteria,
        artifacts: stageArtifacts,
        evidence: stageEvidence,
      }),
    [stageArtifacts, stageCriteria, stageEvidence, viewStage],
  );
  const stageRecommendation = useMemo(
    () => buildStageRecommendation(stageGateAssessment),
    [stageGateAssessment],
  );
  const approvalEvent = useMemo(
    () => ({
      id: event.id,
      decisionOwner: event.decisionOwner ?? null,
      createdByUserId: event.createdByUserId ?? null,
    }),
    [event.id, event.decisionOwner, event.createdByUserId],
  );
  const approvalViewByCriterionId = useMemo(() => {
    const result: Record<
      string,
      ReturnType<typeof approvalViewForCriterion>
    > = {};
    for (const criterion of stageCriteria) {
      const def = criterionById(criterion.criterionId);
      if (!def?.ownerRole) continue;
      result[criterion.criterionId] = approvalViewForCriterion({
        event: approvalEvent,
        ownerRole: def.ownerRole,
        criterionState: criterion.state,
      });
    }
    return result;
  }, [approvalEvent, stageCriteria]);
  const nextMove = useMemo(
    () =>
      resolveStageNextMove({
        stage: viewStage,
        artifacts: stageArtifacts,
        criteria: stageCriteria,
      }),
    [stageArtifacts, stageCriteria, viewStage],
  );
  const simpleStageScreen = useMemo(() => {
    try {
      return resolveSimpleStageScreen(
        {
          artifactStates: liveArtifactStates,
          gateCriterionStates: liveGateCriterionStates,
          evidenceStates,
        },
        viewStage,
      );
    } catch (error) {
      console.error(
        "[Source simple front] failed to resolve view model",
        error,
      );
      return null;
    }
  }, [evidenceStates, liveArtifactStates, liveGateCriterionStates, viewStage]);

  // Context-bundle counts for the chat header.
  const contextBundle = useMemo(() => {
    const usable = stageEvidence.filter(
      (e) =>
        e.currentState === "Usable Evidence" || e.currentState === "Available",
    ).length;
    const totalEvidence = stageEvidence.length;
    const liveArtifacts = stageArtifacts.filter(
      (a) => a.tier !== "stub",
    ).length;
    const totalArtifacts = stageArtifacts.length;
    const assessmentById = new Map(
      stageGateAssessment.criteria.map((criterion) => [
        criterion.criterionId,
        criterion,
      ]),
    );
    const metCriteria = stageCriteria.filter((c) => {
      const assessed = assessmentById.get(c.criterionId);
      return assessed
        ? isAssessmentMet(assessed)
        : c.state === "met" || c.state === "waived";
    }).length;
    return {
      readiness: `${usable} / ${totalEvidence}`,
      artifacts: `${liveArtifacts} / ${totalArtifacts}`,
      evidence: `${stageEvidence.length} sources`,
      requirementCoverage: computeStageRequirementCoverage({
        stageKey: viewStage,
        artifactStates: stageArtifacts,
        evidenceStates: stageEvidence,
      }).displayValue,
      vendors: undefined,
      metCriteria,
      totalCriteria: stageCriteria.length,
    };
  }, [
    stageArtifacts,
    stageCriteria,
    stageEvidence,
    stageGateAssessment,
    viewStage,
  ]);
  const workspaceItemCount = useMemo(() => {
    const registryIds = new Set(
      registryArtifactsState.map((artifact) => artifact.id),
    );
    const unlinkedArtifactCount = liveArtifactStates.filter(
      (artifact) =>
        !artifact.linkedArtifactId ||
        !registryIds.has(artifact.linkedArtifactId),
    ).length;
    return (
      registryArtifactsState.length +
      unlinkedArtifactCount +
      evidenceStates.length +
      liveGateCriterionStates.length
    );
  }, [
    evidenceStates.length,
    liveArtifactStates,
    liveGateCriterionStates.length,
    registryArtifactsState,
  ]);
  const workspaceHref = `/source/events/${event.id}/workspace`;

  const handlePromoteStage = async (
    toStage: SourceStageKey,
    reason: string,
  ): Promise<void> => {
    if (promotePending) return;
    setPromotePending(true);
    try {
      const res = await fetch(`/api/v1/source/${event.id}/stage`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stageKey: toStage,
          reason,
          confirmations: confirmationsForStage(viewStage),
        }),
      });
      if (!res.ok) return;
      // Re-fetch the SSR data with the new stage in view, so artifacts +
      // criteria + evidence + chat-lane all switch to the new stage.
      router.push(`/source/events/${event.id}?stage=${toStage}`);
      router.refresh();
    } finally {
      setPromotePending(false);
    }
  };

  const handleNextMoveAdvance = () => {
    const nextStage = nextMove.nextStage;
    if (!nextStage) return;
    const confirmed =
      typeof window === "undefined"
        ? false
        : window.confirm(
            `Advance this event to ${nextMove.primaryLabel.replace(/^Advance to /, "")}?`,
          );
    if (!confirmed) return;
    void handlePromoteStage(
      nextStage,
      `Advanced from Next Move card: ${nextMove.title}`,
    );
  };

  const handleCriterionStateChange = async (
    criterionId: string,
    next: SourceEventGateCriterionState,
    reason: string,
  ): Promise<void> => {
    const previous = criterionStateMap[criterionId];
    if (!previous) return;

    setCriterionStateMap((prev) => ({
      ...prev,
      [criterionId]: {
        ...previous,
        state: next,
        updatedAt: new Date().toISOString(),
      },
    }));
    setPendingCriterionByCriterionId((prev) => ({
      ...prev,
      [criterionId]: true,
    }));

    try {
      const res = await fetch(
        `/api/v1/source/${event.id}/gate-criteria/${encodeURIComponent(criterionId)}/state`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: next, reason }),
        },
      );
      if (!res.ok) {
        setCriterionStateMap((prev) => ({ ...prev, [criterionId]: previous }));
        return;
      }
      const payload = (await res.json()) as {
        criterion?: SourceEventGateCriterion;
      };
      if (payload.criterion) {
        setCriterionStateMap((prev) => ({
          ...prev,
          [criterionId]: payload.criterion!,
        }));
      }
    } catch {
      setCriterionStateMap((prev) => ({ ...prev, [criterionId]: previous }));
    } finally {
      setPendingCriterionByCriterionId((prev) => {
        const next = { ...prev };
        delete next[criterionId];
        return next;
      });
    }
  };

  const handleArtifactGenerate = async (
    code: string,
  ): Promise<
    | { ok: true }
    | {
        ok: false;
        error: string;
        detail: string;
        missingUpstream?: string[];
        blockers?: ArtifactBlockerLike[];
      }
  > => {
    setPendingGenerationByCode((prev) => ({ ...prev, [code]: true }));
    try {
      const res = await fetch(
        `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/generate`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const payload = (await res.json().catch(() => null)) as {
        artifact?: SourceEventArtifactState;
        registryArtifact?: SourceArtifactRegistryRecord | null;
        generation?: { reasoningStatus?: string; reasoningEnvelope?: unknown };
        error?: string;
        detail?: string;
        missingUpstream?: string[];
      } | null;
      if (!res.ok || !payload || payload.error) {
        const detail =
          payload?.detail ?? `Generation failed (HTTP ${res.status}).`;
        return {
          ok: false,
          error: payload?.error ?? "unknown",
          detail,
          missingUpstream: payload?.missingUpstream,
          blockers: normalizeArtifactBlockers(payload, detail),
        };
      }
      if (payload.artifact) {
        setArtifactStateMap((prev) => ({
          ...prev,
          [code]: payload.artifact!,
        }));
      }
      if (payload.registryArtifact) {
        const newRow = payload.registryArtifact;
        setRegistryArtifactsState((prev) => {
          const without = prev.filter((doc) => doc.id !== newRow.id);
          return [newRow, ...without];
        });
      }
      if (
        payload.generation?.reasoningStatus &&
        payload.generation.reasoningStatus !== "disabled"
      ) {
        setReasoningByCode((prev) => ({
          ...prev,
          [code]: {
            status: payload.generation!.reasoningStatus!,
            envelope: payload.generation!.reasoningEnvelope,
          },
        }));
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: "network",
        detail: err instanceof Error ? err.message : "Network error",
      };
    } finally {
      setPendingGenerationByCode((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  };
  const handleDraftWithSentinel = (code: string) => {
    void handleArtifactGenerate(code);
  };

  // Auto-draft the strategy-stage artifacts. The strategy memo, value target,
  // and archetype record are produced at event creation, not via a manual
  // "Draft with aVa" click — when the creator lands on the freshly-created
  // event at the strategy stage and a generatable artifact's body is still
  // empty, generation fires once per artifact. (Browser-initiated so it runs
  // on the full request budget rather than being killed as a post-response
  // background task.) Once a body exists it never re-fires.
  const autoDraftFiredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (viewStage !== "strategy") return;
    for (const artifact of liveArtifactStates) {
      const code = artifact.artifactCode;
      if (artifact.stage !== "strategy") continue;
      if (!generatableCodes.has(code)) continue;
      if ((artifact.body ?? "").trim().length > 0) continue;
      if (pendingGenerationByCode[code]) continue;
      if (autoDraftFiredRef.current.has(code)) continue;
      autoDraftFiredRef.current.add(code);
      void handleArtifactGenerate(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewStage,
    liveArtifactStates,
    generatableCodes,
    pendingGenerationByCode,
  ]);

  const handleArtifactBodySave = async (
    code: string,
    body: string,
  ): Promise<void> => {
    const previous = artifactStateMap[code];
    if (!previous) return;
    setPendingBodyByCode((prev) => ({ ...prev, [code]: true }));
    setArtifactStateMap((prev) => ({
      ...prev,
      [code]: {
        ...previous,
        body: body.trim().length === 0 ? null : body,
        bodyUpdatedAt: new Date().toISOString(),
      },
    }));
    try {
      const res = await fetch(
        `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/body`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      if (!res.ok) {
        setArtifactStateMap((prev) => ({ ...prev, [code]: previous }));
        return;
      }
      const payload = (await res.json()) as {
        artifact?: SourceEventArtifactState;
      };
      if (payload.artifact) {
        setArtifactStateMap((prev) => ({ ...prev, [code]: payload.artifact! }));
      }
    } catch {
      setArtifactStateMap((prev) => ({ ...prev, [code]: previous }));
    } finally {
      setPendingBodyByCode((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  };

  const handleArtifactStatusChange = async (
    code: string,
    next: SourceEventArtifactStatus,
  ): Promise<void> => {
    const previous = artifactStateMap[code];
    if (!previous) return;

    // Optimistic update.
    setArtifactStateMap((prev) => ({
      ...prev,
      [code]: {
        ...previous,
        status: next,
        updatedAt: new Date().toISOString(),
      },
    }));
    setPendingStatusByCode((prev) => ({ ...prev, [code]: true }));

    try {
      const res = await fetch(
        `/api/v1/source/${event.id}/artifacts/${encodeURIComponent(code)}/status`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: next }),
        },
      );
      if (!res.ok) {
        // Revert.
        setArtifactStateMap((prev) => ({ ...prev, [code]: previous }));
        return;
      }
      const payload = (await res.json()) as {
        artifact?: SourceEventArtifactState;
      };
      if (payload.artifact) {
        setArtifactStateMap((prev) => ({ ...prev, [code]: payload.artifact! }));
      }
    } catch {
      setArtifactStateMap((prev) => ({ ...prev, [code]: previous }));
    } finally {
      setPendingStatusByCode((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  };

  const dockAgent = canvasDockAgentForStage(viewStage);

  // POSTs the message + attachment ids to the Source agent runtime.
  // The route handler links the attachments to this event (via
  // linked_event_id) before invoking the deterministic stub. The runtime
  // itself is unchanged — we just feed it the canvas-scoped attachment refs.
  const handleAgentMessage = async (
    text: string,
    attachments: AttachmentRef[],
  ): Promise<void> => {
    const nextMessageId = (prefix: "u" | "a") => {
      messageSequenceRef.current += 1;
      return `${prefix}-${messageSequenceRef.current}`;
    };
    const trimmed = text.trim();
    const attachmentIds = attachments.map((a) => a.id);
    if (!trimmed && attachmentIds.length === 0) return;

    const userTurn: ChatMessage = {
      id: nextMessageId("u"),
      role: "user",
      body:
        trimmed.length > 0
          ? trimmed
          : `Attached ${attachmentIds.length} file${attachmentIds.length === 1 ? "" : "s"}.`,
    };
    setThread((t) => [...t, userTurn]);

    try {
      const res = await fetch(`/api/v1/source/${event.id}/nexus/ask`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/x-ndjson",
        },
        body: JSON.stringify({
          prompt: trimmed,
          mode: "event",
          stageKey: viewStage,
          selectedAttachmentIds: attachmentIds,
        }),
      });

      type SourceAskSummaryLine = {
        type: "summary";
        summary?: string;
        agentResponseParts?: AgentResponsePart[];
        nexusSummary?: { summary?: string } | null;
        error?: { message?: string };
      };
      type SourceAskAgentAnswerLine = {
        type: "agent-answer";
        answer?: AvaAnswerPacket;
      };

      let summaryLine: SourceAskSummaryLine | null = null;
      let agentAnswer: AvaAnswerPacket | undefined;

      const reader = res.body?.getReader();
      if (reader) {
        const dec = new TextDecoder();
        let buf = "";
        const applyLine = (raw: string) => {
          const s = raw.trim();
          if (!s) return;
          let evt: SourceAskSummaryLine | SourceAskAgentAnswerLine;
          try {
            evt = JSON.parse(s);
          } catch {
            return;
          }
          if (evt.type === "summary") {
            summaryLine = evt;
          } else if (evt.type === "agent-answer" && evt.answer) {
            agentAnswer = evt.answer;
          }
        };
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            applyLine(buf.slice(0, nl));
            buf = buf.slice(nl + 1);
          }
        }
        applyLine(buf);
      } else {
        summaryLine = (await res
          .json()
          .catch(() => null)) as SourceAskSummaryLine | null;
      }

      const body =
        summaryLine?.summary ??
        summaryLine?.nexusSummary?.summary ??
        summaryLine?.error?.message ??
        `${displayAgentName(dockAgent)} could not produce a response right now.`;
      const agentTurn: ChatMessage = {
        id: nextMessageId("a"),
        role: "agent",
        body,
        parts: summaryLine?.agentResponseParts,
        agentAnswer,
      };
      setThread((t) => [...t, agentTurn]);
    } catch (err) {
      const agentTurn: ChatMessage = {
        id: nextMessageId("a"),
        role: "agent",
        body:
          err instanceof Error
            ? `Network error: ${err.message}`
            : "Network error reaching the agent runtime.",
      };
      setThread((t) => [...t, agentTurn]);
    }
  };

  // Three-choice catalog mapped to AvaBottomBar chips. Click pre-fills
  // the composer rather than auto-submitting so the user can edit first
  // (B4 semantics preserved from the prior chat lane).
  const suggestedActions: SuggestedAction[] = useMemo(
    () =>
      (isLakeshoreDemoCaseStudy
        ? LAKESHORE_CASE_STUDY_CHOICES
        : threeChoicesForStage(viewStage)
      ).map((choice, i) => ({
        id: `c${i}`,
        label: choice,
        body: choice,
      })),
    [isLakeshoreDemoCaseStudy, viewStage],
  );

  const initialTab: WorkspaceTabKey = "document";
  const documentTabContent = (
    <DocumentTab
      stage={viewStage}
      artifacts={stageArtifacts}
      registryArtifacts={registryArtifactsState}
      templateByCode={templateByCode}
      selectedCode={selectedDocCode}
      onSelectCode={setSelectedDocCode}
      onChangeStatus={handleArtifactStatusChange}
      pendingByCode={pendingStatusByCode}
      onSaveBody={handleArtifactBodySave}
      bodyPendingByCode={pendingBodyByCode}
      onGenerateArtifact={handleArtifactGenerate}
      generatableCodes={generatableCodes}
      generationPendingByCode={pendingGenerationByCode}
      reasoningByCode={reasoningByCode}
      xlsxGeneratableCodes={XLSX_GENERATABLE_CODES_CLIENT}
      xlsxDownloadHref={(code) => sourceArtifactRenderHref(code, "xlsx")}
      xlsxComparisonCodes={XLSX_COMPARISON_CODES_CLIENT}
      xlsxComparisonDownloadHref={(code) =>
        sourceArtifactRenderHref(code, "xlsx", "comparison")
      }
      docxGeneratableCodes={DOCX_GENERATABLE_CODES_CLIENT}
      docxDownloadHref={(code) => sourceArtifactRenderHref(code, "docx")}
      htmlGeneratableCodes={HTML_GENERATABLE_CODES_CLIENT}
      htmlViewHref={(code) => sourceArtifactRenderHref(code, "html")}
      pdfGeneratableCodes={PDF_GENERATABLE_CODES_CLIENT}
      pdfDownloadHref={(code) => sourceArtifactRenderHref(code, "pdf")}
      eventId={event.id}
      onRegistryUploaded={() => router.refresh()}
      supplementalPanel={
        <>
          <CommunicationDraftsPanel eventId={event.id} stage={viewStage} />
          <StageDecisionLensPanel stage={viewStage} />
        </>
      }
    />
  );
  const tabs = [
    {
      key: "document" as WorkspaceTabKey,
      label: "Document",
      badge:
        stageArtifacts.length > 0 ? String(stageArtifacts.length) : undefined,
      content: renderStageDocumentContent({
        viewStage,
        event,
        stageArtifacts,
        selectedDocCode,
        onSelectCode: setSelectedDocCode,
        documentTabContent,
        vendorResponseReadiness,
        vendorResponseProfiles,
        vendorChallengeIntelligence,
        vendorBafoInstructionPack,
        vendorEvaluationDecisionView,
        contractOptimizationProfile,
        decisionBriefDocxHref,
        decisionBriefPdfHref,
        eventDisplayName: displayEvent.name,
        criteria: stageCriteria,
        evidence: stageEvidence,
        activityEntries,
        registryArtifacts: registryArtifactsState,
      }),
    },
    {
      key: "evidence" as WorkspaceTabKey,
      label: "Evidence",
      badge: contextBundle.readiness,
      content: (
        <EvidenceTab
          stage={viewStage}
          states={stageEvidence}
          eventId={event.id}
          onRequestSaved={() => router.refresh()}
        />
      ),
    },
    {
      key: "log" as WorkspaceTabKey,
      label: "Log",
      content: <LogTab entries={activityEntries} />,
    },
  ];

  const decisionBriefState = artifactStateMap.d24_decision_brief;
  const hasDecisionBriefDraft = isArtifactDraftVisible(decisionBriefState);
  const hasAdvisoryExportReadiness =
    isLakeshoreDemoCaseStudy ||
    hasDecisionBriefDraft ||
    isStageAtOrAfter(event.currentStageKey, "executive_decision");
  const hasValueExportReadiness =
    isLakeshoreDemoCaseStudy ||
    isStageAtOrAfter(event.currentStageKey, "value");

  const exportItems = [
    ...(hasAdvisoryExportReadiness
      ? [
          {
            key: "decision-brief-docx",
            label: "Decision Brief DOCX",
            href: decisionBriefDocxHref,
            testId: "source-canvas-decision-brief-docx",
            download: true,
          },
          {
            key: "decision-brief-pdf",
            label: "Decision Brief PDF",
            href: decisionBriefPdfHref,
            testId: "source-canvas-decision-brief-pdf",
            download: true,
          },
          {
            key: "cxo-report-html",
            label: "CXO Report",
            href: `/api/v1/source/${encodeURIComponent(event.id)}/cxo-report?format=html`,
            testId: "source-canvas-cxo-report-html",
            external: true,
          },
          {
            key: "cxo-report-pptx",
            label: "Download PPTX",
            href: `/api/v1/source/${encodeURIComponent(event.id)}/cxo-report?format=pptx`,
            testId: "source-canvas-cxo-report-pptx",
            download: true,
          },
          {
            key: "deal-pack",
            label: "Download Deal Pack",
            href: `/api/v1/source/${encodeURIComponent(event.id)}/deal-pack?format=html`,
            testId: "source-canvas-deal-pack-download",
          },
        ]
      : []),
    ...(hasValueExportReadiness
      ? [
          {
            key: "value-proof",
            label: "Value Proof",
            href: `/source/events/${event.id}/value`,
            testId: "source-canvas-value-proof-link",
          },
        ]
      : []),
    ...(decisionThreadId
      ? [
          {
            key: "dossier",
            label: "View in Dossier",
            href: `/dossier/${decisionThreadId}`,
            testId: "source-canvas-dossier-link",
          },
        ]
      : []),
  ];

  const advancedWorkspace = workspaceExplorerEnabled ? (
    <SourceDeclutteredWorkspace
      nextMove={nextMove}
      draftPending={Boolean(
        nextMove.draftArtifactCode &&
        pendingGenerationByCode[nextMove.draftArtifactCode],
      )}
      onNextMoveAdvance={handleNextMoveAdvance}
      onDraftWithSentinel={handleDraftWithSentinel}
      fromStage={viewStage}
      criteria={stageCriteria}
      assessment={stageGateAssessment}
      recommendation={stageRecommendation}
      approvalViewByCriterionId={approvalViewByCriterionId}
      onChangeCriterionState={handleCriterionStateChange}
      pendingByCriterionId={pendingCriterionByCriterionId}
      onPromoteStage={handlePromoteStage}
      promotePending={promotePending}
      workspaceHref={workspaceHref}
    />
  ) : (
    <EventWorkspace
      tabs={tabs}
      defaultTab={initialTab}
      nextMove={nextMove}
      onNextMoveAdvance={handleNextMoveAdvance}
      onDraftWithSentinel={handleDraftWithSentinel}
      workspaceHref={workspaceHref}
    />
  );

  const simpleFrontSpotlight =
    viewStage === "bafo" || viewStage === "orals_bafo" ? (
      <BafoScenarioComparePanel view={buildBafoScenarioCompareView()} />
    ) : null;

  const simpleFrontWorkspace =
    simpleFrontEnabled && simpleStageScreen ? (
      <SimpleFrontErrorBoundary
        key={`${event.id}:${viewStage}:${simpleStageScreen.deliverable.artifactCode}`}
        fallback={
          <SimpleFrontUnavailable>{advancedWorkspace}</SimpleFrontUnavailable>
        }
      >
        <>
          <SimpleStageFront
            eventId={event.id}
            stage={viewStage}
            view={simpleStageScreen}
            generating={Boolean(
              pendingGenerationByCode[
                simpleStageScreen.deliverable.artifactCode
              ],
            )}
            registryArtifacts={registryArtifactsState}
            onGenerateArtifact={handleArtifactGenerate}
            onAdvanceStage={(stage) =>
              void handlePromoteStage(
                stage,
                `Advanced from Start here: ${simpleStageScreen.stageLabel}`,
              )
            }
            onRefresh={() => router.refresh()}
            advanced={advancedWorkspace}
            spotlight={simpleFrontSpotlight}
          />
          {(viewStage === "responses" ||
            viewStage === "vendor_responses" ||
            viewStage === "evaluation") &&
          contractOptimizationProfile ? (
            <div style={{ marginTop: 12 }}>
              <ContractOptimizationProfilePanel
                profile={contractOptimizationProfile}
              />
            </div>
          ) : null}
          {(viewStage === "responses" || viewStage === "vendor_responses") &&
          !contractOptimizationProfile &&
          vendorResponseProfiles?.profiles?.length ? (
            <div style={{ marginTop: 12 }}>
              <VendorResponseProfilesPanel
                profileSet={vendorResponseProfiles}
              />
            </div>
          ) : null}
          {(viewStage === "responses" || viewStage === "vendor_responses") &&
          !contractOptimizationProfile &&
          vendorChallengeIntelligence ? (
            <div style={{ marginTop: 12 }}>
              <VendorChallengeLeveragePanel
                intelligence={vendorChallengeIntelligence}
              />
            </div>
          ) : null}
          {(viewStage === "responses" || viewStage === "vendor_responses") &&
          !contractOptimizationProfile &&
          vendorBafoInstructionPack ? (
            <div style={{ marginTop: 12 }}>
              <VendorBafoInstructionPackPanel
                pack={vendorBafoInstructionPack}
              />
            </div>
          ) : null}
          {(viewStage === "responses" ||
            viewStage === "vendor_responses" ||
            viewStage === "evaluation") &&
          !contractOptimizationProfile &&
          vendorEvaluationDecisionView ? (
            <div style={{ marginTop: 12 }}>
              <VendorEvaluationScorecardPanel
                decisionView={vendorEvaluationDecisionView}
                decisionBriefDocxHref={decisionBriefDocxHref}
                decisionBriefPdfHref={decisionBriefPdfHref}
                eventDisplayName={displayEvent.name}
              />
            </div>
          ) : null}
        </>
      </SimpleFrontErrorBoundary>
    ) : simpleFrontEnabled ? (
      <SimpleFrontUnavailable reason="Simple Start here view is unavailable for this event state. Showing the full workspace instead.">
        {advancedWorkspace}
      </SimpleFrontUnavailable>
    ) : null;

  return (
    <AppShell
      surface="source-detail"
      agentName={displayAgentName(dockAgent)}
      surfaceContext={{
        sourceEventId: event.id,
        sourceEventCode: event.code,
        viewStage,
      }}
      topBarProps={{
        tenantName: displayEvent.accountName || tenantName,
        preserveTenantName: Boolean(contractOptimizationProfile),
        showLocked: true,
        context: `${displayEvent.code} · ${displayEvent.name}`,
      }}
      subNav={<SourceSubNav />}
    >
      <main
        data-testid="source-event-canvas"
        data-workspace-explorer={
          workspaceExplorerEnabled ? "source" : undefined
        }
        style={MAIN_STYLE}
      >
        <div style={CONTAINER_STYLE}>
          <EventIdStrip event={event} exportItems={exportItems} />
          <EventStepRail
            eventId={event.id}
            currentStage={event.currentStageKey}
            viewStage={viewStage}
          />
          {workspaceExplorerEnabled ? (
            <WorkspaceExplorerChips
              workspaceHref={workspaceHref}
              count={workspaceItemCount}
              viewStage={viewStage}
            />
          ) : null}
        </div>
        <div style={CANVAS_BODY_STYLE}>
          <CanvasGateSidebar
            fromStage={viewStage}
            states={stageCriteria}
            allCriteria={liveGateCriterionStates}
            onChangeCriterionState={(criterionId, next) =>
              handleCriterionStateChange(
                criterionId,
                next,
                "Changed from canvas gate sidebar",
              )
            }
            pendingByCriterionId={pendingCriterionByCriterionId}
            onPromoteStage={(toStage) =>
              handlePromoteStage(toStage, "Promoted from canvas gate sidebar")
            }
            promotePending={promotePending}
          />
          <div style={WORKSPACE_COLUMN_STYLE}>
            <CanvasContextStrip
              stageKey={viewStage}
              contextBundle={contextBundle}
            >
              {simpleFrontWorkspace ?? advancedWorkspace}
            </CanvasContextStrip>
            <AvaBottomBar
              agentName={displayAgentName()}
              thread={thread}
              onMessage={(text) => handleAgentMessage(text, [])}
              suggestedActions={suggestedActions}
            />
          </div>
        </div>
        <CanvasTour />
      </main>
    </AppShell>
  );
}

// Unified voice: the user always talks to "aVa", regardless of which internal
// specialist (Sentinel on stages 1–9, Atlas on the executive stages) leads the
// stage. The stage-appropriate role copy still differs (see AGENT_DOCK_ROLE_COPY);
// only the displayed agent NAME is always aVa.
function displayAgentName(_agent?: "Sentinel" | "Atlas"): string {
  void _agent;
  return "aVa";
}

function confirmationsForStage(
  stage: SourceStageKey,
): SourceStageConfirmations {
  return Object.fromEntries(
    confirmationKeysForStage(stage).map((key) => [key, true]),
  );
}

function isStageAtOrAfter(current: SourceStageKey, target: SourceStageKey) {
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(current);
  const targetIndex = SOURCE_STAGE_ORDER.indexOf(target);
  return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
}

// Stage label + readiness/artifact counts shown above the EventWorkspace tabs.
function CanvasContextStrip({
  stageKey,
  contextBundle,
  children,
}: {
  stageKey: SourceStageKey;
  contextBundle: {
    readiness: string;
    artifacts: string;
    evidence: string;
    requirementCoverage: string;
    vendors?: string;
    metCriteria: number;
    totalCriteria: number;
  };
  children: ReactNode;
}) {
  const stageLabel = SOURCE_STAGE_LABELS[stageKey];
  return (
    <section
      data-testid="source-canvas-context-strip"
      aria-label="Source canvas context"
      style={CONTEXT_STRIP_STYLE}
    >
      <div style={CONTEXT_STRIP_META_STYLE}>
        <span style={CONTEXT_STRIP_STAGE_STYLE}>{stageLabel}</span>
        <span>Readiness {contextBundle.readiness}</span>
        <span>Artifacts {contextBundle.artifacts}</span>
        <span>Evidence {contextBundle.evidence}</span>
        <span>Requirement coverage {contextBundle.requirementCoverage}</span>
        <span>
          Gates {contextBundle.metCriteria} / {contextBundle.totalCriteria}
        </span>
        {contextBundle.vendors ? <span>{contextBundle.vendors}</span> : null}
      </div>
      {children}
    </section>
  );
}

function SimpleFrontUnavailable({
  children,
  reason = "Simple Start here view is unavailable. Showing the full workspace instead.",
}: {
  children: ReactNode;
  reason?: string;
}) {
  return (
    <section
      data-testid="source-simple-front-fallback"
      aria-label="Start here unavailable"
      style={SIMPLE_FRONT_FALLBACK_STYLE}
    >
      <div style={SIMPLE_FRONT_FALLBACK_NOTE_STYLE}>{reason}</div>
      {children}
    </section>
  );
}

function WorkspaceExplorerChips({
  workspaceHref,
  count,
  viewStage,
}: {
  workspaceHref: string;
  count: number;
  viewStage: SourceStageKey;
}) {
  return (
    <div
      data-testid="source-workspace-explorer-chips"
      aria-label="Source workspace shortcuts"
      style={WORKSPACE_CHIPS_ROW_STYLE}
    >
      <Link
        data-testid="source-workspace-chip"
        href={workspaceHref}
        style={WORKSPACE_CHIP_PRIMARY_STYLE}
      >
        Workspace · {count} ↗
      </Link>
      <Link
        data-testid="source-generate-chip"
        href={`${workspaceHref}?intent=generate&stage=${viewStage}`}
        style={WORKSPACE_CHIP_SECONDARY_STYLE}
      >
        Generate
      </Link>
      <Link
        data-testid="source-upload-chip"
        href={`${workspaceHref}?intent=upload&stage=${viewStage}`}
        style={WORKSPACE_CHIP_SECONDARY_STYLE}
      >
        Upload
      </Link>
    </div>
  );
}

function SourceDeclutteredWorkspace({
  nextMove,
  draftPending,
  onNextMoveAdvance,
  onDraftWithSentinel,
  fromStage,
  criteria,
  assessment,
  recommendation,
  approvalViewByCriterionId,
  onChangeCriterionState,
  pendingByCriterionId,
  onPromoteStage,
  promotePending,
  workspaceHref,
}: {
  nextMove: ReturnType<typeof resolveStageNextMove>;
  draftPending: boolean;
  onNextMoveAdvance: () => void;
  onDraftWithSentinel: (code: string) => void;
  fromStage: SourceStageKey;
  criteria: SourceEventGateCriterion[];
  assessment: ReturnType<typeof assessStageGate>;
  recommendation: ReturnType<typeof buildStageRecommendation>;
  approvalViewByCriterionId: Record<
    string,
    ReturnType<typeof approvalViewForCriterion>
  >;
  onChangeCriterionState: (
    criterionId: string,
    next: SourceEventGateCriterionState,
    reason: string,
  ) => Promise<void>;
  pendingByCriterionId: Record<string, boolean>;
  onPromoteStage: (toStage: SourceStageKey, reason: string) => Promise<void>;
  promotePending: boolean;
  workspaceHref: string;
}) {
  // The full gate checklist starts collapsed — the default rail is the calm
  // "what we still need" view. "Open gate checklist" / the toggle expand it.
  const [gateOpen, setGateOpen] = useState(false);
  // Route a next-move action by its target. advance → advance; gate → expand +
  // scroll to the inline gate; document/evidence → the Document Explorer. The
  // draft move ("Draft with Ava") is handled separately at the call site: it
  // runs governed generation IN PLACE via onDraftWithSentinel, not here.
  const runNextMoveTarget = (target: StageNextMoveActionTarget) => {
    if (target === "advance") {
      onNextMoveAdvance();
      return;
    }
    if (target === "gate") {
      // The full gate is collapsed by default (the decluttered Screen-1 view).
      // Opening the checklist means: expand it, then scroll it into view.
      setGateOpen(true);
      requestAnimationFrame(() => {
        document
          .getElementById("stage-gate-checklist")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    // "document" (author / open) / "evidence" → the Document Explorer (Workspace)
    window.location.assign(workspaceHref);
  };

  // The Next-move card already names the outstanding items in plain language
  // (e.g. "clear sponsor sign-off, value target, archetype") with its own
  // "N of M cleared" line — that IS the calm "what to gather" view the operator
  // asked for. The right rail's remaining job is to keep the full gate
  // machinery (mark-met, promote, approve-with-gaps) collapsed until asked.
  const assessmentById = new Map(
    assessment.criteria.map((criterion) => [criterion.criterionId, criterion]),
  );
  const metCount = criteria.filter((criterion) => {
    const assessed = assessmentById.get(criterion.criterionId);
    return assessed
      ? isAssessmentMet(assessed)
      : criterion.state === "met" || criterion.state === "waived";
  }).length;

  return (
    <section
      data-testid="source-canvas-workspace"
      data-active-tab="workspace-explorer"
      aria-label="Source decision workspace"
      style={DECLUTTERED_WORKSPACE_STYLE}
    >
      <div style={NEXT_MOVE_WRAP_STYLE}>
        <StageNextMoveCard
          nextMove={nextMove}
          pending={draftPending}
          onPrimary={() =>
            nextMove.draftArtifactCode
              ? onDraftWithSentinel(nextMove.draftArtifactCode)
              : runNextMoveTarget(nextMove.primaryTarget)
          }
          onSecondary={
            nextMove.secondaryTarget
              ? () => runNextMoveTarget(nextMove.secondaryTarget!)
              : undefined
          }
        />
      </div>

      <div id="stage-gate-checklist">
        <button
          type="button"
          data-testid="source-canvas-gate-toggle"
          aria-expanded={gateOpen}
          onClick={() => setGateOpen((open) => !open)}
          style={GATE_TOGGLE_STYLE}
        >
          <span>
            {gateOpen ? "Hide the gate checklist" : "Review & approve the gate"}
          </span>
          <span style={GATE_TOGGLE_META_STYLE}>
            {metCount} / {criteria.length} cleared {gateOpen ? "▾" : "▸"}
          </span>
        </button>
        {gateOpen ? (
          <GateTab
            fromStage={fromStage}
            states={criteria}
            assessment={assessment}
            recommendation={recommendation}
            approvalViewByCriterionId={approvalViewByCriterionId}
            onChangeCriterionState={onChangeCriterionState}
            pendingByCriterionId={pendingByCriterionId}
            onPromoteStage={onPromoteStage}
            promotePending={promotePending}
          />
        ) : null}
      </div>

      <NextStepLookahead fromStage={fromStage} workspaceHref={workspaceHref} />

      <p style={DECLUTTERED_FOOTER_STYLE}>
        Everything else — documents, evidence, vendor responses and generated
        drafts — lives in the Workspace.
      </p>
    </section>
  );
}

/**
 * Calm look-ahead: what the *next* stage will need, so you can start gathering
 * before you advance. Spec-driven (the next stage's required evidence) and
 * therefore identical on every stage — the universal step previews the next.
 */
function NextStepLookahead({
  fromStage,
  workspaceHref,
}: {
  fromStage: SourceStageKey;
  workspaceHref: string;
}) {
  const { nextStage, nextStageLabel, needs } = nextStepNeeds(fromStage);
  if (!nextStage || needs.length === 0) return null;
  return (
    <div
      data-testid="source-canvas-next-step-lookahead"
      style={LOOKAHEAD_STYLE}
    >
      <div style={LOOKAHEAD_HEAD_STYLE}>
        Next: {nextStageLabel} will need — start gathering
      </div>
      <ul style={LOOKAHEAD_LIST_STYLE}>
        {needs.slice(0, 5).map((requirement) => (
          <li key={requirement.requirementId} style={LOOKAHEAD_ITEM_STYLE}>
            <span style={LOOKAHEAD_DOT_STYLE} aria-hidden />
            <span>{requirement.label}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`${workspaceHref}?intent=upload&stage=${nextStage}`}
        style={LOOKAHEAD_LINK_STYLE}
      >
        Open {nextStageLabel} in the Workspace ↗
      </Link>
    </div>
  );
}

// Eyebrow copy under the agent name in the dock header. Action verbs the
// user can ask for, not abstract role descriptions. Mirrors the previous
// EventChatLane.AGENT_DESCRIPTION map (Sentinel + Atlas only — the canvas
// dock is a binary surface; see `canvasDockAgentForStage`).
const AGENT_DOCK_ROLE_COPY: Record<"Sentinel" | "Atlas", string> = {
  Sentinel:
    "Drafts artifacts, surfaces evidence, flags gaps before they cost you.",
  Atlas: "Frames the executive brief, ranks finalists, locks the decision.",
};

const LAKESHORE_CASE_STUDY_CHOICES = [
  "Show the governance gates still open for this sourcing decision.",
  "Summarize the RFP, evaluation, BAFO, and decision evidence for the executive review.",
  "What would you validate before approving the Lakeshore shared-services case study?",
];

function isLakeshoreSharedServicesDemoEvent(
  event: Pick<SourcingEventSummary, "code" | "name" | "accountName">,
): boolean {
  return /lakeshore/i.test(`${event.accountName} ${event.name} ${event.code}`);
}

function isArtifactDraftVisible(
  artifact: SourceEventArtifactState | undefined,
): boolean {
  if (!artifact) return false;
  return Boolean(artifact.body?.trim() || artifact.linkedArtifactId);
}

function normalizeSourceEventDisplay(
  event: Pick<SourcingEventSummary, "code" | "name" | "accountName">,
): Pick<SourcingEventSummary, "code" | "name" | "accountName"> {
  const isSkyHarborDemo =
    event.code.toUpperCase().startsWith("SKYH-") ||
    /skyharbor|airline demo/i.test(`${event.accountName} ${event.name}`);
  if (!isSkyHarborDemo) return event;
  const isContractOptimization =
    /contract[- ]?opt|contract optimization|renewal decision/i.test(
      `${event.code} ${event.name}`,
    );
  if (isContractOptimization) {
    return {
      ...event,
      accountName: "Airline Demo",
      code: "SKYH-AMS-CONTRACT-OPT-2026",
      name: "Airline Demo AMS Contract Optimization",
    };
  }
  return {
    ...event,
    accountName: "Airline Demo",
    code: "SKYH-AMS-RFP-2026",
    name: "Airline Demo AMS Outsourcing RFP",
  };
}

function CanvasTour() {
  const searchParams = useSearchParams();
  const tourActive = searchParams?.get("tour") === "1";
  if (!tourActive) return null;
  return (
    <SourceOnboardingTour
      active={tourActive}
      config={{
        step: 3,
        title: "This is the universal canvas.",
        body: (
          <>
            Each artifact has a <strong>Mark complete</strong> button — flip
            them as the work lands. Switch to the <strong>Gate</strong> tab to
            see what&rsquo;s blocking promotion; once everything&rsquo;s green,{" "}
            <strong>Promote stage</strong> moves the event forward. The agent
            dock on the left can draft any artifact for you — drag a vendor
            response onto it to bring those documents into the conversation.
          </>
        ),
        nextLabel: "Got it",
      }}
    />
  );
}

function indexByCode(
  rows: SourceEventArtifactState[],
): Record<string, SourceEventArtifactState> {
  const out: Record<string, SourceEventArtifactState> = {};
  for (const row of rows) out[row.artifactCode] = row;
  return out;
}

function indexByCriterionId(
  rows: SourceEventGateCriterion[],
): Record<string, SourceEventGateCriterion> {
  const out: Record<string, SourceEventGateCriterion> = {};
  for (const row of rows) out[row.criterionId] = row;
  return out;
}

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  // Belt-and-suspenders height pin: AppShell sets minHeight: 100vh + overflow
  // hidden upstream, but explicit height here guarantees the splitter pane
  // (and the chat lane inside it) cannot grow beyond the viewport, so the
  // chat input stays sticky at the bottom without scrolling.
  height: "calc(100vh - 64px)",
  overflow: "hidden",
  background: CANVAS.PAGE_BG,
};

const CONTAINER_STYLE: CSSProperties = {
  padding: `0 ${CANVAS.S_PAGE}px`,
  flexShrink: 0,
};

const DOSSIER_LINK_WRAP_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  paddingTop: 10,
};

const DOSSIER_LINK_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 6,
  background: "#fff",
  color: CANVAS.INK,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.08em",
  padding: "7px 10px",
  textDecoration: "none",
  textTransform: "uppercase",
};

const CANVAS_BODY_STYLE: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "row",
  minHeight: 0,
  overflow: "hidden",
};

const WORKSPACE_COLUMN_STYLE: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
};

const WORKSPACE_WRAPPER_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  background: CANVAS.PAGE_BG,
};

const WORKSPACE_INNER_STYLE: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

const CONTEXT_STRIP_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minHeight: 0,
};

const CONTEXT_STRIP_META_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderBottom: `1px solid ${CANVAS.RULE}`,
  color: CANVAS.TAB_INACTIVE_INK,
  fontSize: 12,
};

const CONTEXT_STRIP_STAGE_STYLE: CSSProperties = {
  color: CANVAS.INK,
  fontWeight: 700,
};

const CASE_STUDY_BANNER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  margin: "0 0 12px",
  padding: "14px 16px",
  border: "1px solid rgba(29,78,216,0.18)",
  borderRadius: 10,
  background: "rgba(29,78,216,0.045)",
  color: CANVAS.INK,
  fontFamily: CANVAS.SANS,
};

const CASE_STUDY_BANNER_TEXT_STYLE: CSSProperties = {
  maxWidth: 880,
  margin: "5px 0 0",
  fontSize: 13,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};

const CASE_STUDY_BANNER_LINK_STYLE: CSSProperties = {
  flex: "0 0 auto",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 700,
  textDecoration: "none",
};

const WORKSPACE_CHIPS_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 0 18px",
};

const WORKSPACE_CHIP_BASE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 34,
  borderRadius: 6,
  padding: "0 12px",
  textDecoration: "none",
  fontFamily: CANVAS.MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const WORKSPACE_CHIP_PRIMARY_STYLE: CSSProperties = {
  ...WORKSPACE_CHIP_BASE_STYLE,
  color: "#ffffff",
  background: CANVAS.INK,
  border: `1px solid ${CANVAS.INK}`,
};

const WORKSPACE_CHIP_SECONDARY_STYLE: CSSProperties = {
  ...WORKSPACE_CHIP_BASE_STYLE,
  color: CANVAS.INK,
  background: "#ffffff",
  border: `1px solid ${CANVAS.HAIRLINE}`,
};

const SIMPLE_FRONT_FALLBACK_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const SIMPLE_FRONT_FALLBACK_NOTE_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  padding: "10px 12px",
  background: "rgba(180,83,9,0.08)",
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
};

const DECLUTTERED_WORKSPACE_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  overflowY: "auto",
  background: CANVAS.PAGE_BG,
  padding: "0 24px 32px",
};

const NEXT_MOVE_WRAP_STYLE: CSSProperties = {
  padding: "20px 0 16px",
  background: CANVAS.PAGE_BG,
};

const GATE_TOGGLE_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  appearance: "none",
  cursor: "pointer",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 600,
  color: CANVAS.INK,
  background: CANVAS.CARD,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  padding: "12px 14px",
  marginBottom: 12,
};

const GATE_TOGGLE_META_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 11,
  fontWeight: 400,
  color: CANVAS.INK_SOFT,
  letterSpacing: "0.04em",
};

const DECLUTTERED_FOOTER_STYLE: CSSProperties = {
  marginTop: 16,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_MUTED,
  lineHeight: 1.45,
};

const LOOKAHEAD_STYLE: CSSProperties = {
  marginTop: 16,
  padding: "14px 16px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 10,
  background: CANVAS.CARD,
};

const LOOKAHEAD_HEAD_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  fontWeight: 600,
  color: CANVAS.INK,
  marginBottom: 10,
};

const LOOKAHEAD_LIST_STYLE: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 7,
};

const LOOKAHEAD_ITEM_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
};

const LOOKAHEAD_DOT_STYLE: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: CANVAS.INK_MUTED,
  flexShrink: 0,
};

const LOOKAHEAD_LINK_STYLE: CSSProperties = {
  display: "inline-block",
  marginTop: 12,
  fontFamily: CANVAS.MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: CANVAS.INK,
  textDecoration: "none",
};
