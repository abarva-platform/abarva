"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ArrowDown } from "lucide-react";

import { AvaChatShell } from "@/components/ava-chat/AvaChatShell";
import { CANVAS } from "@/components/source/canvas/canvas-tokens";
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
  const [followUpPacket, setFollowUpPacket] = useState<{
    answerId: string;
    questions: string[];
  } | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const transcriptRef = useRef<HTMLElement | null>(null);
  const [composer, setComposer] = useState<HTMLElement | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
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
    setFollowUpPacket(null);
    setIsBusy(false);
    return () => requestRef.current?.abort();
  }, [recordIdentity]);

  useEffect(() => {
    const shell = shellRef.current?.querySelector(
      '[data-testid="ava-chat-shell"]',
    );
    if (!shell) return;
    // The dock mounts a new transcript and composer when its display mode changes.
    const syncControls = () => {
      transcriptRef.current = shell.querySelector<HTMLElement>(
        '[data-testid="agent-dock-thread"]',
      );
      setComposer(
        shell.querySelector<HTMLElement>('[data-testid="agent-dock-form"]'),
      );
      const transcript = transcriptRef.current;
      setShowJumpToLatest(
        Boolean(
          transcript &&
          transcript.scrollHeight -
            transcript.scrollTop -
            transcript.clientHeight >
            80,
        ),
      );
    };
    syncControls();
    const observer = new MutationObserver(syncControls);
    observer.observe(shell, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      transcriptRef.current = null;
    };
  }, []);

  const jumpToLatest = useCallback(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    transcript.scrollTop = transcript.scrollHeight;
    // Resume the shared dock's follow policy before another answer can arrive.
    transcript.dispatchEvent(new Event("scroll"));
    transcript.focus({ preventScroll: true });
    setShowJumpToLatest(false);
  }, []);

  const latestTurn = thread[thread.length - 1];
  const followUpQuestions =
    !isBusy && latestTurn?.id === followUpPacket?.answerId
      ? (followUpPacket?.questions ?? [])
      : [];

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
      setFollowUpPacket(null);

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
        const answerId = nextMessageId("home-ava-agent");
        setFollowUpPacket({
          answerId,
          questions: [
            ...new Set(
              (Array.isArray(data.followUpQuestions)
                ? data.followUpQuestions
                : []
              )
                .filter((item) => typeof item === "string" && item.trim())
                .map((item) => item.trim()),
            ),
          ].slice(0, 3),
        });
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
            id: answerId,
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
    <div
      ref={shellRef}
      data-home-ava-chat
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
      onScrollCapture={(event) => {
        const transcript = transcriptRef.current;
        if (!transcript || event.target !== transcript) return;
        setShowJumpToLatest(
          transcript.scrollHeight -
            transcript.scrollTop -
            transcript.clientHeight >
            80,
        );
      }}
    >
      <style>{`
        [data-home-ava-chat] > [data-testid="ava-chat-shell"] {
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100%;
          min-height: 0;
          min-width: 0;
          overflow: hidden;
        }
        [data-home-ava-chat] [aria-label="Suggested actions"] {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          gap: 4px !important;
          padding: 6px 12px !important;
          max-height: min(18vh, 112px) !important;
          width: auto !important;
          margin-top: 8px !important;
          overflow-y: auto;
          overscroll-behavior: contain;
          box-sizing: border-box;
          align-content: start;
          min-width: 0;
        }
        [data-home-ava-chat] [aria-label="Suggested actions"] > div {
          grid-column: 1 / -1;
          letter-spacing: 0 !important;
        }
        [data-home-ava-chat] [aria-label="Suggested actions"] button {
          min-width: 0;
          padding: 6px 8px !important;
          font-size: 12px !important;
          letter-spacing: 0 !important;
          overflow-wrap: anywhere;
        }
        [data-home-ava-chat] [data-testid="agent-dock-form"] {
          gap: 6px !important;
        }
        [data-home-ava-chat] [data-agent-action-approval-notice] {
          letter-spacing: 0 !important;
          text-transform: none !important;
        }
        [data-home-ava-chat] [data-testid="ai-responsibility-footer"] {
          padding: 3px 6px !important;
          border: 0 !important;
          background: transparent !important;
        }
        [data-home-ava-chat] .home-ava-jump:focus-visible {
          outline: 2px solid ${CANVAS.INK};
          outline-offset: 2px;
        }
      `}</style>
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
          id: `${followUpPacket?.answerId}-follow-up-${index + 1}`,
          label: question,
          body: question,
        }))}
        keepSuggestedActionsVisible
        transcriptScroll="follow-end"
      />
      {composer
        ? createPortal(
            <button
              type="button"
              className="home-ava-jump"
              title="Jump to latest"
              aria-label="Jump to latest"
              disabled={!showJumpToLatest}
              onClick={jumpToLatest}
              style={{
                visibility: showJumpToLatest ? "visible" : "hidden",
                flex: "0 0 32px",
                width: 32,
                height: 32,
                padding: 0,
                borderRadius: 8,
                border: `1px solid ${CANVAS.RULE}`,
                background: CANVAS.CARD,
                color: CANVAS.INK,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <ArrowDown size={18} aria-hidden="true" />
            </button>,
            composer,
          )
        : null}
    </div>
  );
}
