"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SourceOnboardingTour } from "@/components/source/onboarding/SourceOnboardingTour";
import { listSupportedGenerationCodes } from "@/lib/source/agent-generation";
import {
  resolveStageNextMove,
  type StageNextMoveActionTarget,
} from "@/lib/source/stage-next-move";

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
import { canvasDockAgentForStage } from "@/lib/source/portfolio-derivations";
import type { SourceStageKey, SourcingEventSummary } from "@/lib/source/types";
import {
  type AttachmentRef,
  type ChatMessage,
  type SuggestedAction,
} from "@/components/agent/AgentDock";
import { SentinelChatProportional } from "./SentinelChatProportional";
import { EventIdStrip } from "./EventIdStrip";
import { EventStepRail } from "./EventStepRail";
import { EventWorkspace, type WorkspaceTabKey } from "./EventWorkspace";
import { StageNextMoveCard } from "./StageNextMoveCard";
import { CANVAS } from "./canvas-tokens";
import { DocumentTab } from "./workspace-tabs/DocumentTab";
import { GateTab } from "./workspace-tabs/GateTab";
import { EvidenceTab } from "./workspace-tabs/EvidenceTab";
import { LogTab, type ActivityEntry } from "./workspace-tabs/LogTab";
import { StageDecisionLensPanel } from "./workspace-tabs/StageDecisionLensPanel";
import { CommunicationDraftsPanel } from "./workspace-tabs/CommunicationDraftsPanel";
import { threeChoicesForStage } from "./canvas-three-choices";
import { StrategyStageView } from "./strategy/StrategyStageView";
import { ScopeStageView } from "./scope/ScopeStageView";
import { RfpStageView } from "./rfp/RfpStageView";
import { ResponsesStageView } from "./responses/ResponsesStageView";
import { EvaluationStageView } from "./evaluation/EvaluationStageView";
import { PricingStageView } from "./pricing/PricingStageView";
import { BafoStageView } from "./bafo/BafoStageView";
import { ExecutiveDecisionStageView } from "./executive-decision/ExecutiveDecisionStageView";
import { TransitionStageView } from "./transition/TransitionStageView";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";

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
  workspaceExplorerEnabled?: boolean;
}

function renderStageDocumentContent({
  viewStage,
  event,
  stageArtifacts,
  selectedDocCode,
  onSelectCode,
  documentTabContent,
  vendorResponseReadiness,
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
}) {
  if (viewStage === "strategy") {
    return (
      <StrategyStageView
        artifacts={stageArtifacts}
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
        documentWorkspace={documentTabContent}
      />
    );
  }

  if (viewStage === "evaluation") {
    return <EvaluationStageView documentWorkspace={documentTabContent} />;
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
 * Top-level universal sourcing canvas. Renders the id strip, step rail, and
 * the shared `<AgentDock>` (chat lane on the left, workspace on the right
 * by default — five toggleable dock modes per surface).
 *
 * Reads real data from the canvas substrate — pre-filtered to the stage being
 * viewed. Chat goes through the existing source Sentinel/Atlas runtime at
 * `/api/v1/source/[eventId]/nexus/ask`; AgentDock paperclip uploads carry
 * the event id so the route can stamp `agent_attachment.linked_event_id`
 * before invoking the deterministic stub. The runtime itself is unchanged.
 *
 * Stage→agent mapping is binary at the dock surface:
 *   stages 1–9 (Strategy → Selection)  → Sentinel
 *   stages 10–11 (Transition, Value)   → Atlas
 * (`canvasDockAgentForStage`). Specialist agents (Nexus, Steward) still
 * lead their respective workflows via tool calls invoked by the front
 * agent — they don't host the chat surface here.
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
  workspaceExplorerEnabled = false,
}: UniversalCanvasShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeClientParam = searchParams?.get("client")?.trim() || null;
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
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [selectedDocCode, setSelectedDocCode] = useState<string | undefined>(
    undefined,
  );
  const [promotePending, setPromotePending] = useState(false);

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
  const nextMove = useMemo(
    () =>
      resolveStageNextMove({
        stage: viewStage,
        artifacts: stageArtifacts,
        criteria: stageCriteria,
      }),
    [stageArtifacts, stageCriteria, viewStage],
  );

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
    const metCriteria = stageCriteria.filter(
      (c) => c.state === "met" || c.state === "waived",
    ).length;
    return {
      readiness: `${usable} / ${totalEvidence}`,
      artifacts: `${liveArtifacts} / ${totalArtifacts}`,
      evidence: `${stageEvidence.length} sources`,
      vendors: undefined,
      metCriteria,
      totalCriteria: stageCriteria.length,
    };
  }, [stageArtifacts, stageCriteria, stageEvidence]);
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
        body: JSON.stringify({ stageKey: toStage, reason }),
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
    | { ok: false; error: string; detail: string; missingUpstream?: string[] }
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
        error?: string;
        detail?: string;
        missingUpstream?: string[];
      } | null;
      if (!res.ok || !payload) {
        return {
          ok: false,
          error: payload?.error ?? "unknown",
          detail: payload?.detail ?? `Generation failed (HTTP ${res.status}).`,
          missingUpstream: payload?.missingUpstream,
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

  // POSTs the message + attachment ids to the source Sentinel/Atlas runtime.
  // The route handler links the attachments to this event (via
  // linked_event_id) before invoking the deterministic stub. The runtime
  // itself is unchanged — we just feed it the canvas-scoped attachment refs.
  const handleAgentMessage = async (
    text: string,
    attachments: AttachmentRef[],
  ): Promise<void> => {
    const trimmed = text.trim();
    const attachmentIds = attachments.map((a) => a.id);
    if (!trimmed && attachmentIds.length === 0) return;

    const userTurn: ChatMessage = {
      id: `u-${Date.now()}`,
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          mode: "event",
          stageKey: viewStage,
          selectedAttachmentIds: attachmentIds,
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        summary?: string;
        nexusSummary?: { summary?: string } | null;
        error?: { message?: string };
      } | null;
      const body =
        payload?.summary ??
        payload?.nexusSummary?.summary ??
        payload?.error?.message ??
        `${dockAgent} could not produce a response right now.`;
      const agentTurn: ChatMessage = {
        id: `a-${Date.now() + 1}`,
        role: "agent",
        body,
      };
      setThread((t) => [...t, agentTurn]);
    } catch (err) {
      const agentTurn: ChatMessage = {
        id: `a-${Date.now() + 1}`,
        role: "agent",
        body:
          err instanceof Error
            ? `Network error: ${err.message}`
            : "Network error reaching the agent runtime.",
      };
      setThread((t) => [...t, agentTurn]);
    }
  };

  // Three-choice catalog mapped to AgentDock SuggestedActions. Click pre-fills
  // the composer rather than auto-submitting so the user can edit first
  // (B4 semantics preserved from the prior chat lane).
  const suggestedActions: SuggestedAction[] = useMemo(
    () =>
      threeChoicesForStage(viewStage).map((choice, i) => ({
        id: `c${i}`,
        label: choice,
        body: choice,
      })),
    [viewStage],
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
        criteria: stageCriteria,
        evidence: stageEvidence,
        activityEntries,
      }),
    },
    {
      key: "gate" as WorkspaceTabKey,
      label: "Gate",
      badge: `${contextBundle.metCriteria}/${contextBundle.totalCriteria}`,
      content: (
        <GateTab
          fromStage={viewStage}
          states={stageCriteria}
          onChangeCriterionState={handleCriterionStateChange}
          pendingByCriterionId={pendingCriterionByCriterionId}
          onPromoteStage={handlePromoteStage}
          promotePending={promotePending}
        />
      ),
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

  const exportItems = [
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
    {
      key: "value-proof",
      label: "Value Proof",
      href: `/source/events/${event.id}/value`,
      testId: "source-canvas-value-proof-link",
    },
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

  return (
    <AppShell
      surface="source-detail"
      agentName={dockAgent}
      surfaceContext={{
        sourceEventId: event.id,
        sourceEventCode: event.code,
        viewStage,
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `${event.code} · ${event.name}`,
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
        <div style={SPLITTER_WRAPPER_STYLE}>
          <SentinelChatProportional
            agent={{
              initials: displayAgentInitials(dockAgent),
              name: displayAgentName(dockAgent),
              role: AGENT_DOCK_ROLE_COPY[dockAgent],
            }}
            stage={viewStage}
            artifacts={stageArtifacts}
            surface="source/events/canvas"
            surfaceContext={{
              sourceEventId: event.id,
              sourceEventCode: event.code,
              viewStage,
            }}
            suggestedActions={suggestedActions}
            thread={thread}
            onMessage={handleAgentMessage}
            workspace={
              // Audit M2: CanvasContextStrip removed — it restated Readiness,
              // Artifacts, and Evidence counts already shown in the tab badges
              // (Gate N/M, Document N, Evidence N/M). One status conveyor.
              // The wrapper div keeps data-testid for E2E probes.
              <div
                data-testid="source-canvas-context-strip"
                style={WORKSPACE_WRAPPER_STYLE}
              >
                <div style={WORKSPACE_INNER_STYLE}>
                  {workspaceExplorerEnabled ? (
                    <SourceDeclutteredWorkspace
                      nextMove={nextMove}
                      onNextMoveAdvance={handleNextMoveAdvance}
                      fromStage={viewStage}
                      criteria={stageCriteria}
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
                    />
                  )}
                </div>
              </div>
            }
            minLeftPx={280}
          />
        </div>
        <CanvasTour />
      </main>
    </AppShell>
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
  onNextMoveAdvance,
  fromStage,
  criteria,
  onChangeCriterionState,
  pendingByCriterionId,
  onPromoteStage,
  promotePending,
  workspaceHref,
}: {
  nextMove: ReturnType<typeof resolveStageNextMove>;
  onNextMoveAdvance: () => void;
  fromStage: SourceStageKey;
  criteria: SourceEventGateCriterion[];
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
  // Route a next-move action by its target. Previously the primary button was
  // hardwired to advance (so "Open gate checklist" wrongly fired the advance
  // confirm) and the secondary only handled gate/evidence (so "Open document
  // workspace" was a no-op). Now: advance → advance; gate → scroll to the
  // gate checklist that lives inline on this canvas; everything else → the
  // full Document Explorer.
  const runNextMoveTarget = (target: StageNextMoveActionTarget) => {
    if (target === "advance") {
      onNextMoveAdvance();
      return;
    }
    if (target === "gate") {
      document
        .getElementById("stage-gate-checklist")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    // "document" / "evidence" → the Document Explorer (Workspace)
    window.location.assign(workspaceHref);
  };
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
          onPrimary={() => runNextMoveTarget(nextMove.primaryTarget)}
          onSecondary={
            nextMove.secondaryTarget
              ? () => runNextMoveTarget(nextMove.secondaryTarget!)
              : undefined
          }
        />
      </div>
      <div style={DECLUTTERED_HELP_STYLE}>
        Documents, evidence, log history, vendor responses, and generated drafts
        now live in the Workspace. This canvas stays focused on the next move
        and the gate.
      </div>
      <div id="stage-gate-checklist">
        <GateTab
          fromStage={fromStage}
          states={criteria}
          onChangeCriterionState={onChangeCriterionState}
          pendingByCriterionId={pendingByCriterionId}
          onPromoteStage={onPromoteStage}
          promotePending={promotePending}
        />
      </div>
    </section>
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

function displayAgentName(agent: "Sentinel" | "Atlas"): string {
  return agent === "Sentinel" ? "Sentinel Source" : agent;
}

function displayAgentInitials(agent: "Sentinel" | "Atlas"): string {
  return agent === "Sentinel" ? "SS" : agent[0];
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

const SPLITTER_WRAPPER_STYLE: CSSProperties = {
  flex: 1,
  display: "flex",
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

const DECLUTTERED_HELP_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#ffffff",
  padding: "12px 14px",
  marginBottom: 18,
  color: CANVAS.TAB_INACTIVE_INK,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
};
