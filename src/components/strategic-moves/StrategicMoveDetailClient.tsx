"use client";

// StrategicMoveDetailClient · Move detail page chat shell.
//
// Migrates the Move detail page (/strategic-moves/[id]) from the bespoke
// Nexus chat panel + MoveDetailSplitter to the shared <AgentDock> with
// Nexus as the agent and the existing Move detail view rendered as the
// `workspace` (right pane).
//
// Design:
//   - AgentDock surface key: 'moves/detail' (matches AGENT_DOCK.md
//     migration playbook; doubles as the localStorage namespace).
//   - Default mode: side-rail. Mode picker switches to pin-bottom /
//     pin-top / expand / collapsed and persists per surface.
//   - surfaceContext carries moveId + moveCode + currentPhase + sponsor
//     so the upload route can stamp `linked_move_id` and the chat route
//     can canonicalize the surface to '/programs/<id>' for tool
//     resolution.
//   - The chat handler streams /api/chat/agent the same way the phase
//     workspace does — surface 'programs-detail' + surfaceContext with
//     programId, so `canonicalizeFromBody` reshapes it to URL-shaped
//     '/programs/<id>' for tool registry + artifact-channel matching.
//   - Suggested chips mirror the live mock: phase-readiness questions.

import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
  type SuggestedAction,
} from "@/components/agent/AgentDock";
import {
  extractArtifacts,
  visibleArtifactPendingText,
} from "@/lib/agent/artifacts";
import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from "@/lib/agent/response-shape";
import type { StrategicMove } from "@/lib/programs/types.ui";

interface Props {
  move: StrategicMove;
  workspace: ReactNode;
  decisionThreadId?: string | null;
  originatingIntelligenceSessionId?: string | null;
  presentationMode?: boolean;
  presentationMoveTitle?: string;
  presentationMoveCode?: string;
  presentationTenantName?: string;
}

function generateTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SUGGESTED_ACTIONS: SuggestedAction[] = [
  {
    id: "gate-missing",
    label: "Show me what is still missing.",
    body: "Show me what is still missing for this phase.",
  },
  {
    id: "gate-blocking",
    label: "What's blocking progress?",
    body: "What's blocking progress for this phase?",
  },
];

export function StrategicMoveDetailClient({
  move,
  workspace,
  decisionThreadId = null,
  originatingIntelligenceSessionId = null,
  presentationMode = false,
  presentationMoveTitle,
  presentationMoveCode,
  presentationTenantName,
}: Props) {
  const moveTitle = presentationMoveTitle ?? move.name;
  const moveCode = presentationMoveCode ?? move.displayCode;
  const tenantName = presentationTenantName ?? move.tenant.name;
  const initialThread: ChatMessage[] = presentationMode
    ? [
        {
          id: "nexus-open-detail",
          role: "agent",
          body: `${moveTitle} is open. I can summarize the story, explain the phase journey, or find the right artifact for review.`,
        },
      ]
    : [
        {
          id: "nexus-open-detail",
          role: "agent",
          body: `I'm scoped to ${moveCode} — ${moveTitle}. Currently in ${move.phaseLabel}. Status: ${move.status.text.toLowerCase()}.`,
        },
        {
          id: "nexus-open-detail-2",
          role: "agent",
          body: `${move.status.description}. ${decisionThreadId ? `This Move is bound to Decision Dossier ${decisionThreadId}; pronouns like "this Move" refer to ${moveCode}. ` : ""}Want me to walk through what's needed to advance?`,
        },
      ];
  if (originatingIntelligenceSessionId) {
    initialThread.push({
      id: "nexus-open-detail-intelligence-origin",
      role: "agent",
      body: "I also have the originating Intelligence Ask session attached, so pre-mortem and pronoun questions inherit the rationale that shaped this Move.",
    });
  }

  const [thread, setThread] = useState<ChatMessage[]>(initialThread);
  const threadRef = useRef<ChatMessage[]>(initialThread);
  threadRef.current = thread;

  const updateThread = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      const next =
        typeof updater === "function" ? updater(threadRef.current) : updater;
      threadRef.current = next;
      setThread(next);
    },
    [],
  );

  const onMessage = useCallback(
    async (text: string, attachments: AttachmentRef[]) => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;

      const attachmentSuffix =
        attachments.length > 0
          ? `\n\n[Attached: ${attachments.map((a) => a.file_name).join(", ")}]`
          : "";
      const fullMessage = trimmed + attachmentSuffix;

      const assistantTurnId = generateTurnId();
      updateThread((prev) => [
        ...prev,
        { id: generateTurnId(), role: "user", body: fullMessage },
        { id: assistantTurnId, role: "agent", body: "" },
      ]);

      try {
        const conversationHistory = threadRef.current
          .filter((t) => t.body.trim().length > 0)
          .map((t) => ({
            role: t.role === "agent" ? "assistant" : "user",
            content: t.body,
          }));

        const res = await fetch("/api/chat/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: fullMessage,
            tenantName,
            agentName: "Nexus",
            // 'programs-detail' is the existing semantic surface key for
            // /strategic-moves/[id] — canonicalizeFromBody reshapes it to
            // '/programs/<id>' when programId is present. Tool registry
            // and the artifact-channel gate both expect the URL form.
            surface: "programs-detail",
            conversationHistory,
            surfaceContext: {
              programId: move.id,
              moveId: move.id,
              moveCode,
              moveTitle,
              decisionThreadId,
              originatingIntelligenceSessionId,
              currentPhase: move.currentPhase,
              phaseLabel: move.phaseLabel,
              sponsorName: move.sponsor?.name ?? null,
              sponsorRole: move.sponsor?.role ?? null,
              attachments: attachments.map((a) => ({
                id: a.id,
                originalName: a.file_name,
                mimeType: a.mime,
                sizeBytes: a.bytes,
                programId: move.id,
              })),
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingBuffer += decoder.decode(value, { stream: true });
          const { visibleText, remaining } = extractArtifacts(pendingBuffer);
          committedVisible += visibleText;
          pendingBuffer = remaining;

          const display = shapeStreamingAgentTextForSurface(
            "programs-detail",
            committedVisible + visibleArtifactPendingText(pendingBuffer),
          ).trimEnd();
          updateThread((prev) =>
            prev.map((t) =>
              t.id === assistantTurnId ? { ...t, body: display } : t,
            ),
          );
        }

        if (pendingBuffer.length > 0) {
          const final = extractArtifacts(pendingBuffer);
          committedVisible +=
            final.visibleText +
            (final.remaining.length > 0
              ? visibleArtifactPendingText(final.remaining)
              : "");
        }

        updateThread((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId
              ? {
                  ...t,
                  body: shapeAgentResponseForSurface(
                    "programs-detail",
                    committedVisible,
                  ),
                }
              : t,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Agent error";
        updateThread((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId
              ? {
                  ...t,
                  body: `I encountered an issue: ${msg}. Please try again.`,
                }
              : t,
          ),
        );
      }
    },
    [
      decisionThreadId,
      move,
      moveCode,
      moveTitle,
      originatingIntelligenceSessionId,
      tenantName,
      updateThread,
    ],
  );

  return (
    <AgentDock
      agent={{
        initials: "aVa",
        mark: "ava",
        name: "aVa",
        role: "Move advisor",
      }}
      surface={presentationMode ? "moves/detail/presentation" : "moves/detail"}
      quietReviewChrome
      defaultMode="collapsed"
      collapsedRestoreMode="expand"
      defaultLeftPercent={35}
      minLeftPx={320}
      collapsedSummary={{ label: "aVa", detail: "Open the Move advisor" }}
      surfaceContext={{
        moveId: move.id,
        moveCode,
        moveTitle,
        decisionThreadId,
        originatingIntelligenceSessionId,
        currentPhase: move.currentPhase,
        phaseLabel: move.phaseLabel,
        sponsorName: move.sponsor?.name ?? null,
        sponsorRole: move.sponsor?.role ?? null,
      }}
      suggestedActions={SUGGESTED_ACTIONS}
      thread={thread}
      onMessage={onMessage}
      workspace={workspace}
    />
  );
}
