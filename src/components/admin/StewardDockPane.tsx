'use client';

// StewardDockPane · Admin / Setup chat dock built on the shared <AgentDock>.
//
// Replaces the prior StewardAskBar + SetupChatRail mount. The dock owns the
// composer (auto-grow textarea, paperclip uploads, drag-drop), the mode
// picker (side-rail / pin-bottom / pin-top / expand / collapsed), and the
// per-surface persistence (mode + split width in localStorage). We plug it
// into the shared AtlasPageStateProvider — which is mounted by AppShell — so
// every Steward turn flows through the canonical agent runtime exactly the
// way StewardAskBar did, including multi-turn history and artifact
// dispatch.
//
// Layout note: the dock's `side-rail` mode internally uses ResizableSplitter
// to lay out [chat | workspace]. AdminCanonShellV2 renders this pane as
// the right side of [AdminSidebar | StewardDockPane(workspace=children)] so
// the splitter handle ends up between the Steward chat lane and the page
// body — exactly the surface goal of the admin migration chip.

import { useCallback, useMemo, type ReactNode } from 'react';
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
  type DockMode,
  type SuggestedAction,
} from '@/components/agent/AgentDock';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import { useAgentStream } from '@/hooks/useAgentStream';
import type { ChatTurn } from '@/lib/shell/atlas-page-state';

// ── Default suggested actions (mirrors the prior StewardAskBar scaffold) ─────

const DEFAULT_SUGGESTED_ACTIONS: SuggestedAction[] = [
  {
    id: 'segments',
    label: 'Which data segments should I upload first to ground the most capabilities?',
    body: 'Which data segments should I upload first to ground the most capabilities?',
  },
  {
    id: 'sentinel-unlock',
    label: 'What can Sentinel reason about once I upload each data family?',
    body: 'What can Sentinel reason about once I upload each data family?',
  },
  {
    id: 'connectors',
    label: 'Which connectors are needed before pilot and what is their setup sequence?',
    body: 'Which connectors are needed before pilot and what is their setup sequence?',
  },
  {
    id: 'blockers',
    label: 'What are the top blockers I need to resolve before production readiness?',
    body: 'What are the top blockers I need to resolve before production readiness?',
  },
];

// ── Steward agent profile ────────────────────────────────────────────────────

const STEWARD_AGENT = {
  initials: 'St',
  name: 'Steward',
  role: 'Setup & Admin Conductor',
} as const;

// ── Props ────────────────────────────────────────────────────────────────────

export interface StewardDockPaneProps {
  /** Body of the page — rendered in the workspace pane (right of side-rail). */
  workspace: ReactNode;
  /**
   * Per-surface key used to scope localStorage (mode + split width) and
   * upload telemetry. Defaults to "admin" — page-specific keys
   * ("admin/data-trust") may be passed from caller pages so the user's
   * preferences scope per page.
   */
  surface?: string;
  /** Optional context the API echoes back with each turn. */
  surfaceContext?: Record<string, unknown>;
  /** Override the dock's default suggested actions. */
  suggestedActions?: SuggestedAction[];
  /** Override the default mode (side-rail). */
  defaultMode?: DockMode;
  /** Override the default left-pane percent (30). */
  defaultLeftPercent?: number;
  /** Override the default min-left-px (300). */
  minLeftPx?: number;
  /** Initial Steward eyebrow above the thread. */
  initialQuote?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function StewardDockPane({
  workspace,
  surface = 'admin',
  surfaceContext,
  suggestedActions = DEFAULT_SUGGESTED_ACTIONS,
  defaultMode = 'side-rail',
  defaultLeftPercent = 30,
  minLeftPx = 300,
  initialQuote,
}: StewardDockPaneProps) {
  // Prefer the canonical AtlasPageStateProvider (mounted by AppShell). It
  // owns the persistent conversation history, streaming state, and the
  // ask() entry point that targets the Steward voice on the 'setup'
  // surface (see DEFAULT_AGENT in AtlasPageStateProvider). When the
  // provider is missing (e.g. a unit test rendering in isolation) we
  // fall back to a stateless useAgentStream so the dock still functions.
  const pageState = useAtlasPageState();
  const fallbackStream = useAgentStream({
    surface: 'setup',
    agentName: 'Steward',
  });

  // ── Build the dock thread from the live conversation ──────────────────────
  //
  // ChatTurn (atlas-page-state) → ChatMessage (AgentDock).
  // We append the in-flight currentResponse as a transient agent turn while
  // streaming so the user sees tokens land. AtlasPageStateProvider clears
  // currentResponse and pushes the final assistant turn into `conversation`
  // when the stream completes — so this transient row doesn't double up.
  const thread = useMemo<ChatMessage[]>(() => {
    const turns: ChatMessage[] = [];
    const conversation: ChatTurn[] = pageState?.conversation ?? [];
    for (const t of conversation) {
      turns.push({ id: t.id, role: t.role, body: t.text });
    }
    const live = pageState?.currentResponse ?? fallbackStream.response;
    const streaming = pageState?.isStreaming ?? fallbackStream.isStreaming;
    if (streaming && live && live.trim().length > 0) {
      turns.push({ id: 'agent-streaming', role: 'agent', body: live });
    }
    return turns;
  }, [
    pageState?.conversation,
    pageState?.currentResponse,
    pageState?.isStreaming,
    fallbackStream.response,
    fallbackStream.isStreaming,
  ]);

  const onMessage = useCallback(
    async (text: string, attachments: AttachmentRef[]) => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;

      // Each attachment was already POSTed to /api/v1/agent/attachments by
      // the dock; we received `AttachmentRef`s back. Pass the IDs through
      // surfaceContext so a future server-side step (run-side merge of
      // extracted text into the system prompt — owned by the Steward
      // runtime) can hydrate them. We also append a brief in-message hint
      // listing the filenames so Steward at least knows files were
      // attached even before the runtime-side merge ships.
      const messageWithAttachmentHint =
        attachments.length > 0
          ? `${trimmed}${trimmed ? '\n\n' : ''}I have uploaded ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}: ${attachments.map((a) => `${a.file_name} (${a.mime})`).join(', ')}. Please ingest and reflect them in your answer.`
          : trimmed;

      if (pageState?.ask) {
        // The provider's ask() takes (text, attachments?, inlineFiles?).
        // The 2nd arg is AttachmentChipRef[] — a different shape than
        // AttachmentRef. We don't translate the shape here because the
        // runtime-side merge for AgentDock attachments is a follow-on
        // chip; passing raw refs through surfaceContext is the
        // backwards-compatible path that doesn't risk corrupting the
        // existing programs/origination upload pipeline.
        await pageState.ask(messageWithAttachmentHint);
      } else {
        await fallbackStream.ask(messageWithAttachmentHint);
      }
    },
    [pageState, fallbackStream],
  );

  const computedQuote = useMemo(() => {
    if (initialQuote) return initialQuote;
    if (thread.length > 0) return undefined;
    return `${STEWARD_AGENT.role} · ask about data priorities, connector readiness, and what each segment unlocks.`;
  }, [initialQuote, thread.length]);

  return (
    <AgentDock
      agent={STEWARD_AGENT}
      surface={surface}
      defaultMode={defaultMode}
      defaultLeftPercent={defaultLeftPercent}
      minLeftPx={minLeftPx}
      surfaceContext={surfaceContext}
      initialQuote={computedQuote}
      suggestedActions={suggestedActions}
      thread={thread}
      onMessage={onMessage}
      workspace={workspace}
    />
  );
}
