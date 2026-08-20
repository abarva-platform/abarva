"use client";

import { type ReactNode, useCallback, useState } from "react";

import { AvaChatShell } from "@/components/ava-chat/AvaChatShell";
import type { ChatMessage } from "@/components/agent/AgentDock";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

let messageCounter = 0;
function nextMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

const UNREACHABLE_MESSAGE = "I couldn't reach the advisor engine just now -- please try again in a moment.";

/** Ask aVa, wrapping the existing Home preview app (nav + active view) as the canvas pane. Starts
 * collapsed (a small floating chip) rather than claiming layout space by default -- additive to
 * the verified menu-driven chapter experience, never a replacement for it. Owns the fetch loop to
 * /api/home/preview/ask itself; AvaChatShell/AgentDock are transport-agnostic. */
export function HomeAvaChat({
  tenantKey,
  activeChapterId,
  children,
}: {
  tenantKey: string;
  activeChapterId?: string;
  children: ReactNode;
}) {
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const handleMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setThread((prev) => [
        ...prev,
        { id: nextMessageId("home-ava-user"), role: "user", body: trimmed, at: new Date().toISOString() },
      ]);
      setIsBusy(true);

      try {
        const res = await fetch("/api/home/preview/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantKey, question: trimmed, activeChapterId }),
        });
        if (!res.ok) {
          setThread((prev) => [
            ...prev,
            { id: nextMessageId("home-ava-agent"), role: "agent", body: UNREACHABLE_MESSAGE, at: new Date().toISOString() },
          ]);
          return;
        }
        const data = (await res.json()) as { answer: AvaAnswerPacket };
        const answer = data.answer;
        setThread((prev) => [
          ...prev,
          {
            id: nextMessageId("home-ava-agent"),
            role: "agent",
            body: answer.prose?.trim() || answer.directAnswer,
            agentAnswer: answer,
            at: new Date().toISOString(),
          },
        ]);
      } catch {
        setThread((prev) => [
          ...prev,
          { id: nextMessageId("home-ava-agent"), role: "agent", body: UNREACHABLE_MESSAGE, at: new Date().toISOString() },
        ]);
      } finally {
        setIsBusy(false);
      }
    },
    [tenantKey, activeChapterId],
  );

  return (
    <AvaChatShell
      surface="home-preview"
      agent={{ initials: "aVa", mark: "ava", name: "aVa", role: "Home advisor" }}
      placeholder="Ask aVa about this enterprise..."
      layout="dock"
      defaultMode="collapsed"
      collapsedRestoreMode="side-rail"
      defaultLeftPercent={34}
      minLeftPx={340}
      thread={thread}
      onMessage={handleMessage}
      canvas={children}
      isBusy={isBusy}
    />
  );
}
