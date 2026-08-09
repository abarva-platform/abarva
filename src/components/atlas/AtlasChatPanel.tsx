"use client";

// AtlasChatPanel · Tower-flavored AgentDock preset.
//
// Migrated from a custom chat panel (with maxHeight: 360 thread + non-sticky
// composer) to the shared `<AgentDock>` foundation. Tower aVa surfaces now
// inherit:
//   - resizable side-rail (chat left, workspace right) with width persisted
//   - 5-mode picker (side-rail / pin-bottom / pin-top / expand / collapsed)
//   - sticky composer that doesn't scroll away
//   - paperclip uploads via /api/v1/agent/attachments
//   - Enter submits, Shift+Enter inserts newline, drag-drop files anywhere
//
// Back-compat: callers continue to pass `messages`, `suggestions`, and a
// submit handler. We translate to AgentDock's `thread` / `suggestedActions` /
// `onMessage` shape internally. The pending flag synthesizes a transient
// "aVa is thinking…" agent turn at the tail of the thread so the user gets
// the same affordance as before.
//
// Surface key defaults to "tower" — drives localStorage persistence
// (mode + side-rail split width) and acts as the telemetry key for upload
// rows in `agent_attachment`.

import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  AgentDock,
  type AgentProfile,
  type AttachmentRef,
  type ChatMessage,
  type DockMode,
  type RestorableDockMode,
} from "@/components/agent/AgentDock";
import type { AtlasSuggestion } from "@/lib/atlas/types";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

export interface AtlasMessage {
  id: string;
  role: "atlas" | "user";
  content: string;
  agentAnswer?: AvaAnswerPacket | null;
}

export const ATLAS_AGENT: AgentProfile = {
  initials: "aV",
  mark: "ava",
  name: "aVa",
  role: "Tower advisor.",
};

export const ATLAS_DECISION_SUPPORT_DISCLOSURE =
  "Review citations, assumptions, and missing data before acting on aVa output.";

export interface AtlasChatPanelProps {
  /** Conversation thread. Atlas turns + user turns. */
  messages: AtlasMessage[];
  /** When true a transient "aVa is thinking…" turn appears at thread tail. */
  pending: boolean;
  /** Optional live progress label for streamed responses. */
  pendingMessage?: string;
  /**
   * Caller's send handler. AgentDock owns composer state and forwards both
   * the trimmed text and any successfully uploaded attachment refs. Tower can
   * also call the same handler directly with a metric-context patch.
   */
  onSubmit: (
    text: string,
    attachments: AttachmentRef[],
    surfaceContextPatch?: Record<string, unknown>,
  ) => void | Promise<void>;
  /** Atlas-suggested follow-ups rendered above the composer. */
  suggestions: AtlasSuggestion[];
  /** Caller decides whether to navigate, open a drawer, or send a message. */
  onSuggestion: (suggestion: AtlasSuggestion) => void;
  /**
   * Right-pane content. For Tower this is typically the portfolio body
   * (masthead + KPI band + pressure cards + handoff strips).
   */
  workspace: ReactNode;
  /** Optional surface override (default "tower"). */
  surface?: string;
  /** Optional surface context round-tripped to upload metadata. */
  surfaceContext?: Record<string, unknown>;
  /** Optional agent override (default ATLAS_AGENT). */
  agent?: AgentProfile;
  /** Optional eyebrow above the thread. */
  initialQuote?: string;
  /** Visual density. Tower uses focused to keep the chat rail quiet. */
  variant?: "standard" | "focused";
  /** Side-rail splitter overrides. */
  defaultLeftPercent?: number;
  minLeftPx?: number;
  /** Default mode for first-time visitors (default "side-rail"). */
  defaultMode?: DockMode;
  /** When false, the surface opens with defaultMode even if localStorage has an older dock mode. */
  respectStoredMode?: boolean;
  /** Current AgentDock API: when true, starts from defaultMode instead of localStorage. */
  disableStoredMode?: boolean;
  /** Mode restored from the collapsed aVa chip. */
  collapsedRestoreMode?: RestorableDockMode;
  /** Expanded overlay sizing for artifact-heavy answer sessions. */
  expandedWidth?: CSSProperties["width"];
  expandedMaxWidth?: CSSProperties["maxWidth"];
  /** Collapsed chip copy. */
  collapsedSummary?: {
    label: string;
    detail?: string;
  };
  /** Optional style override for the collapsed aVa launcher. */
  collapsedChipStyle?: CSSProperties;
  /** Composer placeholder override. */
  placeholder?: string;
  /** Preserve already-governed real tenant labels instead of applying demo-safe aliases. */
  preserveVisibleText?: boolean;
  /** Keep suggested questions visible when the surface has an opening advisor turn. */
  keepSuggestedActionsVisible?: boolean;
}

const ATLAS_THINKING_ID = "atlas-thinking-transient";

function visibleAvaCopy(value: string): string {
  return value;
}

export function AtlasChatPanel({
  messages,
  pending,
  pendingMessage,
  onSubmit,
  suggestions,
  onSuggestion,
  workspace,
  surface = "tower",
  surfaceContext,
  agent = ATLAS_AGENT,
  initialQuote,
  variant = "standard",
  defaultLeftPercent = 35,
  minLeftPx = 320,
  defaultMode = "side-rail",
  respectStoredMode = true,
  disableStoredMode,
  collapsedRestoreMode,
  expandedWidth,
  expandedMaxWidth,
  collapsedSummary,
  collapsedChipStyle,
  placeholder,
  preserveVisibleText = false,
  keepSuggestedActionsVisible = false,
}: AtlasChatPanelProps) {
  // Translate legacy AtlasMessage[] → AgentDock ChatMessage[].
  // Append a transient "thinking" turn while the caller is awaiting the
  // /atlas/chat response — preserves the previous affordance.
  const thread: ChatMessage[] = useMemo(() => {
    const base: ChatMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role === "atlas" ? "agent" : "user",
      body: visibleAvaCopy(m.content),
      agentAnswer: m.agentAnswer ?? undefined,
    }));
    if (pending) {
      base.push({
        id: ATLAS_THINKING_ID,
        role: "agent",
        body: pendingMessage?.trim() || "aVa is thinking…",
      });
    }
    return base;
  }, [messages, pending, pendingMessage]);

  // Suggestions → AgentDock SuggestedAction[]. We do NOT pre-fill the
  // composer; the caller's onSuggestion routes signal/link/message kinds
  // (open detail drawer, navigate, or fire a message). To honour that we
  // bind onClick on each suggestion and supply a no-op body.
  const suggestedActions = useMemo(
    () =>
      suggestions.map((s, i) => ({
        id: `${s.kind ?? "message"}-${i}`,
        label: visibleAvaCopy(s.label),
        body: s.value,
        onClick: () => onSuggestion(s),
      })),
    [suggestions, onSuggestion],
  );

  return (
    <AgentDock
      agent={agent}
      surface={surface}
      defaultMode={defaultMode}
      disableStoredMode={disableStoredMode ?? !respectStoredMode}
      collapsedRestoreMode={collapsedRestoreMode}
      defaultLeftPercent={defaultLeftPercent}
      minLeftPx={minLeftPx}
      expandedWidth={expandedWidth}
      expandedMaxWidth={expandedMaxWidth}
      surfaceContext={surfaceContext}
      variant={variant}
      initialQuote={initialQuote}
      placeholder={placeholder}
      preserveVisibleText={preserveVisibleText}
      collapsedSummary={collapsedSummary}
      collapsedChipStyle={collapsedChipStyle}
      thread={thread}
      suggestedActions={suggestedActions}
      keepSuggestedActionsVisible={keepSuggestedActionsVisible}
      onMessage={(text, attachments) => onSubmit(text, attachments)}
      workspace={workspace}
    />
  );
}
