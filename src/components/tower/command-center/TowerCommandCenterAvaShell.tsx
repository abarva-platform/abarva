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

import { TowerCommandCenter } from "./TowerCommandCenter";

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
  const blockedPrograms = view.gaps.filter(
    (gap) => gap.primaryBlockingGap,
  ).length;
  return `Which ${blockedPrograms || "open"} Tower proof gaps should I close first?`;
}

function buildSuggestions(
  view: TowerCommandCenterView | null,
): AtlasSuggestion[] {
  const labels = view
    ? [
        "What value is claimable today, and what is blocked?",
        "Explain the finance-validated value that is still held.",
        "Which owner has the next Tower action?",
        "What does the AI portfolio prove versus only suggest?",
        towerSummaryPrompt(view),
      ]
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
  const suggestions = useMemo(() => buildSuggestions(view), [view]);

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
    [clientId, clientKey, tenantName, threadId],
  );

  const handleSuggestion = useCallback(
    (suggestion: AtlasSuggestion) => {
      void sendToAva(suggestion.value, []);
    },
    [sendToAva],
  );

  const workspace = <TowerCommandCenter view={view} tenantName={tenantName} />;

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
              {
                measureKey: "total_it_budget_fy26",
                label: "Total IT budget",
                value: view.summary.budgetUsd,
              },
              {
                measureKey: "ai_tagged_spend_fy26_non_additive",
                label: "AI-tagged spend",
                value: view.summary.aiTaggedUsd,
              },
              {
                measureKey: "promised_value_fy26",
                label: "Promised value",
                value: view.summary.promisedUsd,
              },
              {
                measureKey: "realized_value_ytd_allowed",
                label: "Claimable value",
                value: view.summary.claimableUsd,
              },
            ]
          : [],
        towerKnownGaps: view?.gaps.map((gap) => gap.missing).slice(0, 12) ?? [],
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
