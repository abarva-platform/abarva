"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { AvaChatShell } from "@/components/ava-chat/AvaChatShell";
import type { ChatMessage } from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type { AskSource } from "@/lib/intelligence/ask/types";
import type { HomeRecordRenderSource } from "@/lib/home/preview/types";
import type { HomeConversationTurn } from "@/lib/home/preview/conversation";

let messageCounter = 0;
function nextMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

const UNREACHABLE_MESSAGE =
  "I couldn't reach the advisor engine just now -- please try again in a moment.";
const CONTEXT_CHANGED_MESSAGE =
  "Home's record changed since this page opened. Refresh Home before asking aVa again.";

/** Ask aVa, wrapping the existing Home preview app (nav + active view) as the canvas pane. Starts
 * collapsed (a small floating chip) rather than claiming layout space by default -- additive to
 * the verified menu-driven chapter experience, never a replacement for it. Owns the fetch loop to
 * /api/home/preview/ask itself; AvaChatShell/AgentDock are transport-agnostic. */
export function HomeAvaChat({
  tenantKey,
  activeChapterId,
  recordSource,
  requestedProvider,
  onQuestion,
  children,
}: {
  tenantKey: string;
  activeChapterId?: string;
  recordSource: HomeRecordRenderSource;
  requestedProvider?: string;
  onQuestion?: (question: string) => void;
  children: ReactNode;
}) {
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const requestRef = useRef<AbortController | null>(null);
  const recordIdentity = JSON.stringify([
    tenantKey,
    requestedProvider,
    recordSource,
  ]);

  useEffect(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setThread([]);
    setFollowUpQuestions([]);
    setIsBusy(false);
    return () => requestRef.current?.abort();
  }, [recordIdentity]);

  const handleMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || requestRef.current) return;
      const controller = new AbortController();
      requestRef.current = controller;
      onQuestion?.(trimmed);
      const conversation: HomeConversationTurn[] = [];
      for (let index = 0; index < thread.length - 1; index += 1) {
        const turn = thread[index];
        const reply = thread[index + 1];
        if (
          turn.role === "user" &&
          reply.role === "agent" &&
          reply.agentAnswer
        ) {
          conversation.push({
            question: turn.body.slice(0, 1200),
            citedClaimTags: (reply.agentAnswer.citations ?? [])
              .map((citation) => citation.id)
              .filter((id) => typeof id === "string" && id.length <= 80)
              .slice(0, 12),
          });
        }
      }
      setFollowUpQuestions([]);

      setThread((prev) => [
        ...prev,
        {
          id: nextMessageId("home-ava-user"),
          role: "user",
          body: trimmed,
          at: new Date().toISOString(),
        },
      ]);
      setIsBusy(true);

      try {
        const res = await fetch("/api/home/preview/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            tenantKey,
            question: trimmed,
            activeChapterId,
            requestedProvider,
            expectedRecordSource: recordSource,
            conversation: conversation.slice(-4),
          }),
        });
        if (requestRef.current !== controller || controller.signal.aborted)
          return;
        if (res.status === 409) {
          setThread((prev) => [
            ...prev,
            {
              id: nextMessageId("home-ava-agent"),
              role: "agent",
              body: CONTEXT_CHANGED_MESSAGE,
              at: new Date().toISOString(),
            },
          ]);
          return;
        }
        if (!res.ok) {
          setThread((prev) => [
            ...prev,
            {
              id: nextMessageId("home-ava-agent"),
              role: "agent",
              body: UNREACHABLE_MESSAGE,
              at: new Date().toISOString(),
            },
          ]);
          return;
        }
        const data = (await res.json()) as {
          answer: AvaAnswerPacket;
          followUpQuestions?: string[];
        };
        if (requestRef.current !== controller || controller.signal.aborted)
          return;
        const answer = data.answer;
        setFollowUpQuestions(
          (data.followUpQuestions ?? [])
            .filter((item) => typeof item === "string" && item.trim())
            .slice(0, 3),
        );
        const sourceDate =
          recordSource.contextVersion?.sourceDateCoverage?.latest;
        const citations: AskSource[] = (answer.citations ?? []).map(
          (citation) => ({
            type: "SURFACE",
            name: citation.label,
            id: citation.recordId ?? null,
            detail:
              citation.excerpt ??
              (citation.id === "home-current-record"
                ? `Current Home record; ${sourceDate ? `registered source files dated through ${sourceDate}` : "source date not established"}. Data currency is not attested.`
                : "Source-linked governed row."),
          }),
        );
        setThread((prev) => [
          ...prev,
          {
            id: nextMessageId("home-ava-agent"),
            role: "agent",
            body: answer.prose?.trim() || answer.directAnswer,
            citations,
            agentAnswer: answer,
            at: new Date().toISOString(),
          },
        ]);
      } catch {
        if (controller.signal.aborted || requestRef.current !== controller)
          return;
        setThread((prev) => [
          ...prev,
          {
            id: nextMessageId("home-ava-agent"),
            role: "agent",
            body: UNREACHABLE_MESSAGE,
            at: new Date().toISOString(),
          },
        ]);
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setIsBusy(false);
        }
      }
    },
    [
      tenantKey,
      activeChapterId,
      recordSource,
      requestedProvider,
      onQuestion,
      thread,
    ],
  );

  return (
    <AvaChatShell
      surface="home-preview"
      agent={{
        initials: "aVa",
        mark: "ava",
        name: "aVa",
        role: "Home advisor",
      }}
      placeholder="Ask aVa about this enterprise..."
      layout="dock"
      // Collapsed by default, matching the approved v4 design's own resting state: the panel is an
      // edge tab until asked for, and the chapter takes the full canvas. The canvas does not go
      // slack at that width because the design's header runs two columns across it -- the panel is
      // not what fills the page.
      defaultMode="collapsed"
      collapsedRestoreMode="side-rail"
      defaultLeftPercent={34}
      minLeftPx={340}
      thread={thread}
      onMessage={handleMessage}
      canvas={children}
      isBusy={isBusy}
      suggestedActions={followUpQuestions.map((question, index) => ({
        id: `home-follow-up-${index + 1}`,
        label: question,
        body: question,
      }))}
      keepSuggestedActionsVisible
      transcriptScroll="answer-start"
    />
  );
}
