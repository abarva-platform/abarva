"use client";

import { useCallback, useMemo, useState } from "react";

import {
  AtlasChatPanel,
  type AtlasMessage,
} from "@/components/atlas/AtlasChatPanel";
import type { AttachmentRef } from "@/components/agent/AgentDock";
import { buildTowerChatAvaAnswerPacket } from "@/lib/cio-tower/tower-chat-artifacts";
import type { TowerChatVisibleAnswer } from "@/lib/cio-tower/tower-chat-artifacts";
import type { AtlasSuggestion } from "@/lib/atlas/types";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { recordedAdoptionRate } from "@/lib/tower/command-center/adoption-rate";
import type { CioTowerPageContext } from "@/lib/tower/current-layer-answer-contract";

import { TowerCommandCenter } from "./TowerCommandCenter";
import { approvedAiCaseFunding } from "./views/portfolio-kind";

interface CioTowerChatResponse {
  response?: string;
  modelOutput?: TowerChatVisibleAnswer;
  traceKey?: string;
  validationStatus?: "passed" | "failed";
  metricCards?: Array<{ label: string; value: string }>;
  gaps?: string[];
}

type TowerChatStreamEvent =
  | {
      type: "status";
      phase?: string;
      label?: string;
    }
  | ({
      type: "tower-answer";
    } & Partial<CioTowerChatResponse>)
  | {
      type: "error";
      response?: string;
      modelOutput?: TowerChatVisibleAnswer;
      detail?: string;
    }
  | {
      type: "done";
      traceKey?: string;
      latencyMs?: number;
    };

async function readTowerChatStream(
  response: Response,
  onStatus: (label: string) => void,
): Promise<Partial<CioTowerChatResponse>> {
  if (!response.body) {
    return (await response
      .json()
      .catch(() => ({}))) as Partial<CioTowerChatResponse>;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: Partial<CioTowerChatResponse> | null = null;
  let errorPayload: Partial<CioTowerChatResponse> | null = null;

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const event = JSON.parse(trimmed) as TowerChatStreamEvent;
    if (event.type === "status" && event.label) {
      onStatus(event.label);
      return;
    }
    if (event.type === "tower-answer") {
      finalPayload = event;
      return;
    }
    if (event.type === "error") {
      errorPayload = event;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
  }
  buffer += decoder.decode();
  if (buffer.trim()) handleLine(buffer);

  if (errorPayload) return errorPayload;
  return finalPayload ?? {};
}

function towerSummaryPrompt(view: TowerCommandCenterView | null): string {
  if (!view) return "What Tower evidence is loaded for this tenant?";
  return "Which primary Tower proof gaps should I close first, and which records support them?";
}

/**
 * Suggestions for the surface the reader is actually on.
 *
 * The answers were made page-aware before these were: aVa would open on Tools / Rollouts, answer
 * from the rollout table, and offer four prompts about claimable value and portfolio posture —
 * none of which the visible table can answer. The prompts are what a reader clicks, so a generic
 * prompt on a specific surface sends them somewhere the page did not.
 *
 * Counts are derived from the loaded view rather than written into the text, so a prompt never
 * promises a population the tenant does not have. A surface with nothing to say about falls back
 * to the portfolio-wide set instead of offering an empty question.
 */
export function surfaceSuggestions(
  view: TowerCommandCenterView,
  tab: string | null | undefined,
  subTab: string | null | undefined,
): string[] {
  const rollouts = view.allInitiatives.filter(
    (item) => item.populationKind === "tool_rollout",
  );
  const belowTarget = rollouts.filter((item) => {
    const adoption = recordedAdoptionRate(item);
    return (
      adoption !== null &&
      item.adoptionTargetPct !== null &&
      adoption < item.adoptionTargetPct
    );
  }).length;
  const blockedRollouts = rollouts.filter(
    (item) => item.controlBlocker !== null,
  ).length;
  const cases = view.allInitiatives.filter(
    (item) => item.populationKind === "ai_case",
  );
  const unvalidated = cases.filter(
    (item) => item.financeStatus !== null && item.financeStatus !== "finance_validated_actual",
  ).length;
  const statusMissing = cases.filter((item) => item.financeStatus === null).length;
  const noBenefit = cases.filter((item) => !item.promisedBenefitLoaded).length;

  if (tab === "tools" && subTab === "vendor") {
    return rollouts.length === 0 ? [
      view.usageObservations.length > 0
        ? `Why do ${view.usageObservations.length} use-case usage observations not establish vendor exposure?`
        : "What vendor usage evidence is loaded?",
      "What source evidence is needed to identify tool rollouts and vendors?",
    ] : [
      "Which vendors carry the most active users, and which of them are blocked?",
      "Where is tool spend concentrated across vendors?",
    ];
  }
  if (tab === "tools" && subTab === "portfolio") {
    return [
      "Which initiatives carry spend but no benefit claim?",
      "What separates a funded programme here from a candidate?",
    ];
  }
  if (tab === "tools") {
    if (rollouts.length === 0) return [
      view.usageObservations.length > 0
        ? `What do the ${view.usageObservations.length} use-case usage observations show?`
        : "What usage evidence is loaded for AI use cases?",
      "What is missing before these can be assessed as tool rollouts?",
    ];
    return [
      belowTarget > 0
        ? `Which of the ${belowTarget} rollouts below target should move first?`
        : "Which rollouts have a recorded adoption rate and target?",
      blockedRollouts > 0
        ? `Which ${blockedRollouts} rollouts carry a named control blocker?`
        : "Which rollouts have no control blocker recorded?",
      "Which rollouts support no business case?",
    ];
  }
  if (tab === "initiatives" && subTab === "proof") {
    return [
      "Which cases have readiness but no validated value?",
      "What is at stake behind the least ready cases?",
    ];
  }
  if (tab === "initiatives") {
    return [
      "Which constraint blocks the most value?",
      statusMissing > 0
        ? `Which ${statusMissing} AI use cases have no Finance status loaded?`
        : unvalidated > 0
        ? `What would it take to validate the ${unvalidated} cases that are not yet finance-validated?`
        : "What is the finance status spread across the cases?",
      noBenefit > 0
        ? `Why do ${noBenefit} cases carry no benefit claim?`
        : "Which cases assert the largest benefit?",
    ];
  }
  if (tab === "budget") {
    return [
      "Which domains hold the most Tower-reviewed budget?",
      "What part of the budget shape is not loaded, and why does that matter?",
    ];
  }
  if (tab === "decisions" && subTab === "owner") {
    return [
      "Which owner carries the largest open proof queue?",
      "Where is proof work concentrated by sponsor?",
    ];
  }
  if (tab === "decisions") {
    return [
      "What must happen first, and what depends on it?",
      "Which claims are still outside the board number?",
    ];
  }
  if (tab === "foundations") {
    return [
      "What do the foundation rows enable that they do not claim themselves?",
      "Which foundations carry investment but no direct value?",
    ];
  }
  return [
    "What value is claimable today, and what is blocked?",
    "Explain the finance-validated value that is still held.",
    "Which owner has the next Tower action?",
    "What does the AI portfolio prove versus only suggest?",
  ];
}

function buildSuggestions(
  view: TowerCommandCenterView | null,
  tab: string | null | undefined,
  subTab: string | null | undefined,
): AtlasSuggestion[] {
  const labels = view
    ? [...surfaceSuggestions(view, tab, subTab), towerSummaryPrompt(view)]
    : [
        "What Tower evidence is loaded for this tenant?",
        "Which Tower metrics are missing source evidence?",
        "What can Tower answer today without assumptions?",
      ];

  return labels.map((label) => ({
    label,
    value: label,
    kind: "message" as const,
  }));
}

export function TowerCommandCenterAvaShell({
  view,
  tenantName,
  clientId,
  clientKey,
}: {
  view: TowerCommandCenterView | null;
  tenantName: string;
  clientId: string | null;
  clientKey?: string | null;
}) {
  const initialOpener = useMemo<AtlasMessage>(
    () => ({
      id: "tower-command-center-ava-opener",
      role: "atlas",
      content: view
        ? `${tenantName} Tower Command Center is loaded. aVa can explain the visible value proof, blocked claims, evidence actions, and AI portfolio posture without approving anything on its own.`
        : "aVa is waiting for tenant-bound Tower mart rows before it can answer portfolio questions.",
    }),
    [tenantName, view],
  );
  const [messages, setMessages] = useState<AtlasMessage[]>([initialOpener]);
  const [pending, setPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [pageContext, setPageContext] = useState<CioTowerPageContext>({
    activeTab: "verdict",
    activeTabLabel: "Today's verdict",
    activeView: null,
    activeViewLabel: null,
    selectedEntity: null,
    visibleRows: [],
    filters: {},
  });
  // Follows the surface the reader is on. `pageContext` is already maintained for the answer
  // path; the prompts read the same source, so a prompt can never describe a different surface
  // from the one an answer would use.
  const suggestions = useMemo(
    () => buildSuggestions(view, pageContext.activeTab, pageContext.activeView),
    [view, pageContext.activeTab, pageContext.activeView],
  );

  const sendToAva = useCallback(
    async (text: string, attachments: AttachmentRef[]) => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content:
            trimmed.length > 0
              ? trimmed
              : `Attached ${attachments.length} file${attachments.length === 1 ? "" : "s"}.`,
        },
      ]);

      if (!clientId) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ava-no-tenant-${Date.now()}`,
            role: "atlas",
            content:
              "aVa needs an active tenant to answer. Sign in or pick a tenant from the top bar to wake up the live Tower response path.",
          },
        ]);
        return;
      }

      setPending(true);
      setPendingMessage("Loading Tower measures...");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 90_000);

      try {
        const res = await fetch("/api/tower/chat", {
          method: "POST",
          headers: {
            Accept: "application/x-ndjson",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            clientKey,
            stream: true,
            pageContext,
            visibleContextCriteria: {
              renderingPolicy: "exact-visible-output",
              preferredCharts: [
                "recharts",
                "svg-compatible",
                "quadrant-matrix",
                "value-bridge",
                "ranked-table",
              ],
              exportTargets: ["pdf", "html"],
            },
          }),
          signal: controller.signal,
        });
        const json = res.headers
          .get("content-type")
          ?.includes("application/x-ndjson")
          ? await readTowerChatStream(res, setPendingMessage)
          : ((await res
              .json()
              .catch(() => ({}))) as Partial<CioTowerChatResponse>);
        const modelOutput = json.modelOutput;
        if (!res.ok || !modelOutput?.answer) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ava-error-${Date.now()}`,
              role: "atlas",
              content:
                json.modelOutput?.answer ??
                json.response ??
                "aVa could not complete the advisory synthesis. Use the visible Tower measures as the governed read and try the question again.",
            },
          ]);
          return;
        }

        const agentAnswer = buildTowerChatAvaAnswerPacket({
          tenantKey: clientId,
          tenantName,
          question: trimmed,
          modelOutput,
          response: json.response ?? null,
          metricCards: json.metricCards,
          gaps: json.gaps,
          validationStatus: json.validationStatus,
          traceKey: json.traceKey ?? null,
        });

        setThreadId(json.traceKey ?? threadId);
        setMessages((prev) => [
          ...prev,
          {
            id: `ava-${Date.now()}`,
            role: "atlas",
            content: modelOutput.answer,
            agentAnswer,
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ava-error-${Date.now()}`,
            role: "atlas",
            content:
              err instanceof DOMException && err.name === "AbortError"
                ? "aVa did not finish the Tower answer within the response window. Use the visible dashboard measures as the governed read and try again."
                : "aVa could not complete the Tower advisory synthesis. Use the visible dashboard measures as the governed read and try again.",
          },
        ]);
      } finally {
        window.clearTimeout(timeout);
        setPending(false);
        setPendingMessage(null);
      }
    },
    [clientId, clientKey, pageContext, tenantName, threadId],
  );

  const handleSuggestion = useCallback(
    (suggestion: AtlasSuggestion) => {
      void sendToAva(suggestion.value, []);
    },
    [sendToAva],
  );

  const workspace = (
    <TowerCommandCenter
      view={view}
      tenantName={tenantName}
      onAvaContextChange={setPageContext}
    />
  );
  const caseFunding = view ? approvedAiCaseFunding(view.allInitiatives) : null;

  return (
    <AtlasChatPanel
      messages={messages}
      pending={pending}
      pendingMessage={pendingMessage ?? undefined}
      onSubmit={sendToAva}
      suggestions={suggestions}
      onSuggestion={handleSuggestion}
      workspace={workspace}
      surface="tower-value-realization"
      variant="focused"
      preserveVisibleText
      keepSuggestedActionsVisible
      surfaceContext={{
        clientId,
        clientKey,
        tenantName,
        context: `Command Center · ${tenantName}`,
        towerExperience: "outcome_proof_cockpit",
        towerContextSource: "cio_tower_mart_command_center",
        activeTowerContext: pageContext,
        answerRenderingPolicy: {
          visibleOutputOwner: "claude",
          rendererPolicy: "exact_visible_strings",
          constraintsLocation: "input_context_criteria",
          preferredVisuals: [
            "recharts",
            "svg",
            "tables",
            "quadrant_matrix",
            "value_bridge",
          ],
          exportTargets: ["pdf", "html"],
        },
        towerMeasures: view
          ? [
              ...(caseFunding === null ? [] : [{
                measureKey: "approved_ai_business_case_funding_usd",
                label: "Approved AI business-case funding, not actual spend",
                value: caseFunding,
              }]),
              ...(view.summary.promisedBenefitLoaded ? [{
                measureKey: "promised_value_fy26",
                label: "Projected yearly benefit, not proven savings",
                value: view.summary.promisedUsd,
              }] : []),
              ...(view.summary.claimableAmountLoaded === false ? [] : [{
                measureKey: "realized_value_ytd_allowed",
                label: "Value cleared for reporting in loaded months",
                value: view.summary.claimableUsd,
              }]),
            ]
          : [],
        towerKnownGaps: view
          ? [
              "Total IT budget is omitted from assistant measures because the Tower projection amount has no reconciled active-intake lineage status. Treat it as unverified until that status is available.",
              ...(view.summary.claimableAmountLoaded === false ? ["Cleared value is not verified because no approved claim amount with a valid reporting period is loaded."] : []),
              ...view.gaps.map((gap) => gap.missing).slice(0, 12),
            ]
          : [],
      }}
      defaultMode="collapsed"
      respectStoredMode={false}
      collapsedRestoreMode="expand"
      collapsedSummary={{
        label: "Ask aVa",
        detail: "Outcome insights",
      }}
      placeholder="Ask aVa to explain proof, blocked value, or the next executive action..."
      defaultLeftPercent={52}
      minLeftPx={560}
      expandedWidth="96vw"
      expandedMaxWidth={1720}
    />
  );
}
