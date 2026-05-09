'use client';

// AtlasChatPanel · Tower-flavored AgentDock preset.
//
// Migrated from a custom chat panel (with maxHeight: 360 thread + non-sticky
// composer) to the shared `<AgentDock>` foundation. Tower Atlas surfaces now
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
// "Atlas is thinking…" agent turn at the tail of the thread so the user gets
// the same affordance as before.
//
// Surface key defaults to "tower" — drives localStorage persistence
// (mode + side-rail split width) and acts as the telemetry key for upload
// rows in `agent_attachment`.

import { useMemo, type ReactNode } from 'react';
import {
  AgentDock,
  type AgentProfile,
  type AttachmentRef,
  type ChatMessage,
  type DockMode,
} from '@/components/agent/AgentDock';
import type { AtlasSuggestion } from '@/lib/atlas/types';

export interface AtlasMessage {
  id: string;
  role: 'atlas' | 'user';
  content: string;
}

export const ATLAS_AGENT: AgentProfile = {
  initials: 'A',
  name: 'Atlas',
  role: 'Tower Conductor — observes portfolio pressure, drift, and signals.',
};

export interface AtlasChatPanelProps {
  /** Conversation thread. Atlas turns + user turns. */
  messages: AtlasMessage[];
  /** When true a transient "Atlas is thinking…" turn appears at thread tail. */
  pending: boolean;
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
  /** Side-rail splitter overrides. */
  defaultLeftPercent?: number;
  minLeftPx?: number;
  /** Default mode for first-time visitors (default "side-rail"). */
  defaultMode?: DockMode;
}

const ATLAS_THINKING_ID = 'atlas-thinking-transient';

export function AtlasChatPanel({
  messages,
  pending,
  onSubmit,
  suggestions,
  onSuggestion,
  workspace,
  surface = 'tower',
  surfaceContext,
  agent = ATLAS_AGENT,
  initialQuote,
  defaultLeftPercent = 35,
  minLeftPx = 320,
  defaultMode = 'side-rail',
}: AtlasChatPanelProps) {
  // Translate legacy AtlasMessage[] → AgentDock ChatMessage[].
  // Append a transient "thinking" turn while the caller is awaiting the
  // /atlas/chat response — preserves the previous affordance.
  const thread: ChatMessage[] = useMemo(() => {
    const base: ChatMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role === 'atlas' ? 'agent' : 'user',
      body: m.content,
    }));
    if (pending) {
      base.push({
        id: ATLAS_THINKING_ID,
        role: 'agent',
        body: 'Atlas is thinking…',
      });
    }
    return base;
  }, [messages, pending]);

  // Suggestions → AgentDock SuggestedAction[]. We do NOT pre-fill the
  // composer; the caller's onSuggestion routes signal/link/message kinds
  // (open detail drawer, navigate, or fire a message). To honour that we
  // bind onClick on each suggestion and supply a no-op body.
  const suggestedActions = useMemo(
    () =>
      suggestions.map((s, i) => ({
        id: `${s.kind ?? 'message'}-${i}`,
        label: s.label,
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
      defaultLeftPercent={defaultLeftPercent}
      minLeftPx={minLeftPx}
      surfaceContext={surfaceContext}
      initialQuote={initialQuote}
      thread={thread}
      suggestedActions={suggestedActions}
      onMessage={(text, attachments) => onSubmit(text, attachments)}
      workspace={workspace}
    />
  );
}
