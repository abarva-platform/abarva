"use client";

// Intelligence v3 · Sentinel chat shell — migrated to the shared
// <AgentDock> foundation (PR #1764).
//
// Position change · 2026-05-08:
//   The Sentinel rail moves from the RIGHT side to the LEFT. Per founder
//   direction ("the chat window has to be on top like the source"), all
//   product surfaces standardize on chat-LEFT / workspace-RIGHT now —
//   Source / Moves were already there; Intelligence was the outlier.
//
// Modes · the dock exposes 5 layouts. We migrate the legacy 3-mode
// preference (side-rail / dock-expanded / dock-collapsed) to the new
// keys on first mount so existing users land where they expect:
//
//   side-rail       → side-rail
//   dock-expanded   → pin-bottom
//   dock-collapsed  → collapsed
//
// surfaceContext is round-tripped to the upload route so future
// per-tab attachment scoping (e.g. tag a peer-comparison PDF as
// belonging to the Vendors tab) is one server-side filter away.
//
// The runtime (LLM call · evidence binding · brief composition) is
// unchanged — this is a surface-widget swap only, per AGENT_DOCK.md.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AgentDock,
  modeStorageKey,
  type AttachmentRef,
  type ChatMessage as DockMessage,
  type DockMode,
} from "@/components/agent/AgentDock";
import type { ChatMessage } from "./types";
import type { AskSource } from "@/lib/intelligence/ask/types";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

const LEGACY_STORAGE_KEY = "abarva.intelligence.chat-mode";
const LEGACY_MIGRATED_FLAG = "abarva.intelligence.chat-mode.migrated";

// AgentDock surface · the same string is the localStorage namespace
// AND the telemetry key sent to /api/v1/agent/attachments.
const SURFACE = "intelligence";

interface Props {
  /** Display name shown in the dock header. */
  agentName?: string;
  /** Eyebrow line ("Meridian · The Brief") — also surfaced in role copy. */
  scopeLabel: string;
  /** First Sentinel turn — composed server-side or by the host canvas. */
  opener: string;
  /** Existing conversation. Renders below the opener in chronological order. */
  conversation: ReadonlyArray<ChatMessage>;
  /**
   * The right pane in the side-rail layout (chat is LEFT). When omitted,
   * the dock renders the chat alone — used by older call-sites that
   * still own their own grid. New code should always pass this.
   */
  workspace?: ReactNode;
  /**
   * Sub-tab key (Brief / Map / Today / etc.) plus tenant key, sent to
   * the upload route as form metadata. Lets future server-side
   * filtering per-tab attachment scoping work.
   */
  surfaceContext?: Record<string, unknown>;
}

/**
 * Adapter from the legacy SentinelChat API onto the shared <AgentDock>.
 *
 * - chat is always on the LEFT of the workspace (matches Source/Moves)
 * - 5 dock modes (side-rail · pin-bottom · pin-top · expand · collapsed)
 * - paperclip uploads to /api/v1/agent/attachments
 * - localStorage migrates legacy 3-mode pref onto new dock keys once.
 */
export function SentinelChat({
  agentName = "Ava Intel",
  scopeLabel,
  opener,
  conversation,
  workspace,
  surfaceContext,
}: Props) {
  // Run the legacy → new key migration once per browser. Idempotent —
  // the migrated flag prevents repeated overwrites if the user later
  // changes mode and we don't want to clobber their new preference.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const alreadyMigrated = window.localStorage.getItem(LEGACY_MIGRATED_FLAG);
      if (alreadyMigrated === "1") return;
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      const newKey = modeStorageKey(SURFACE);
      const newCurrent = window.localStorage.getItem(newKey);
      // Only seed the new key if it hasn't been written yet — respect
      // any explicit choice already made through the new dock UI.
      if (!newCurrent && legacy) {
        const mapped = mapLegacyMode(legacy);
        if (mapped) window.localStorage.setItem(newKey, mapped);
      }
      window.localStorage.setItem(LEGACY_MIGRATED_FLAG, "1");
    } catch {
      /* localStorage unavailable — non-fatal. */
    }
  }, []);

  // Translate the legacy ChatMessage shape (role+text+optional refs)
  // into the dock's ChatMessage shape (id+role+body). Stable IDs via
  // index — this list is read-only and never re-orders mid-render.
  const dockThread = useMemo<DockMessage[]>(() => {
    const turns: DockMessage[] = [];
    if (opener) {
      turns.push({
        id: "sentinel-opener",
        role: "agent",
        body: opener,
      });
    }
    conversation.forEach((m, i) => {
      const refsSuffix =
        m.refs && m.refs.length > 0 ? `\n\nrefs: ${m.refs.join(" · ")}` : "";
      turns.push({
        id: `sentinel-${i}`,
        role: m.role,
        body: m.text + refsSuffix,
      });
    });
    return turns;
  }, [opener, conversation]);

  // Append the user turn locally, then stream the Intelligence answer
  // from the existing NDJSON endpoint into the dock thread.
  const [localTurns, setLocalTurns] = useState<DockMessage[]>([]);
  const fullThread = useMemo(
    () => [...dockThread, ...localTurns],
    [dockThread, localTurns],
  );

  const handleMessage = async (text: string, attachments: AttachmentRef[]) => {
    if (text.trim().length === 0 && attachments.length === 0) return;
    const body =
      attachments.length > 0
        ? text
          ? `${text}\n\n[attached: ${attachments.map((a) => a.file_name).join(", ")}]`
          : `[attached: ${attachments.map((a) => a.file_name).join(", ")}]`
        : text;
    setLocalTurns((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", body },
    ]);

    const agentTurnId = `local-agent-${Date.now()}`;
    setLocalTurns((prev) => [
      ...prev,
      {
        id: agentTurnId,
        role: "agent",
        body: "Reading the Intelligence substrate...",
      },
    ]);

    try {
      const clientKey =
        typeof surfaceContext?.clientKey === "string"
          ? surfaceContext.clientKey
          : null;
      const response = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text || body,
          client: clientKey,
          surfaceContext,
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Ava request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      let sawDelta = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type?: string;
            delta?: string;
            text?: string;
            error?: string;
            telemetryEventId?: string;
            sources?: AskSource[];
            answer?: AvaAnswerPacket;
          };
          const delta = event.delta ?? event.text;
          if (
            event.type === "sources" &&
            Array.isArray(event.sources) &&
            event.sources.length > 0
          ) {
            // Evidence basis the server already retrieved (tenant-scoped). Bind it
            // to the in-flight agent turn so the UI can show citations and suppress
            // the citation-gap warning. We never synthesize sources here.
            const sources = event.sources;
            setLocalTurns((prev) =>
              prev.map((turn) =>
                turn.id === agentTurnId
                  ? { ...turn, citations: sources }
                  : turn,
              ),
            );
          }
          if (event.type === "delta" && delta) {
            sawDelta = true;
            answer += delta;
            setLocalTurns((prev) =>
              prev.map((turn) =>
                turn.id === agentTurnId ? { ...turn, body: answer } : turn,
              ),
            );
          }
          if (event.type === "agent-answer" && event.answer) {
            setLocalTurns((prev) =>
              prev.map((turn) =>
                turn.id === agentTurnId
                  ? { ...turn, agentAnswer: event.answer }
                  : turn,
              ),
            );
          }
          if (event.type === "error")
            throw new Error(event.error ?? "Ava stream error");
          if (event.type === "done" && event.telemetryEventId) {
            setLocalTurns((prev) =>
              prev.map((turn) =>
                turn.id === agentTurnId
                  ? { ...turn, feedbackEventId: event.telemetryEventId }
                  : turn,
              ),
            );
          }
        }
      }

      if (!sawDelta) {
        setLocalTurns((prev) =>
          prev.map((turn) =>
            turn.id === agentTurnId
              ? {
                  ...turn,
                  body: "I did not find enough indexed Intelligence evidence to answer that yet.",
                }
              : turn,
          ),
        );
      }
    } catch (error) {
      setLocalTurns((prev) =>
        prev.map((turn) =>
          turn.id === agentTurnId
            ? {
                ...turn,
                body:
                  error instanceof Error
                    ? `Ava could not complete that request: ${error.message}`
                    : "Ava could not complete that request.",
              }
            : turn,
        ),
      );
    }
  };

  const role = `Intelligence Conductor · ${scopeLabel}`;

  // Without a workspace, the dock has nothing to dock against — render
  // it alone in side-rail mode (back-compat for any caller still on
  // the old API). New code should always pass workspace.
  const safeWorkspace = workspace ?? (
    <div
      style={{
        padding: 32,
        color: "#5b6c8a",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
      aria-hidden="true"
    />
  );

  return (
    <AgentDock
      agent={{ initials: "Av", name: agentName, role }}
      surface={SURFACE}
      defaultMode="side-rail"
      defaultLeftPercent={30}
      minLeftPx={300}
      surfaceContext={surfaceContext}
      thread={fullThread}
      onMessage={handleMessage}
      workspace={safeWorkspace}
    />
  );
}

// ── helpers ──────────────────────────────────────────────────────────────

function mapLegacyMode(value: string): DockMode | null {
  switch (value) {
    case "side-rail":
      return "side-rail";
    case "dock-expanded":
      return "pin-bottom";
    case "dock-collapsed":
      return "collapsed";
    default:
      return null;
  }
}
