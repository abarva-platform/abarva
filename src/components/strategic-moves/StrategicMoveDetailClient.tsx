'use client';

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
//   - Suggested chips mirror the live mock: gate-blocking questions.

import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
  type SuggestedAction,
} from '@/components/agent/AgentDock';
import { extractArtifacts, visibleArtifactPendingText } from '@/lib/agent/artifacts';
import type { StrategicMove } from '@/lib/programs/types.ui';

interface Props {
  move: StrategicMove;
  workspace: ReactNode;
}

function generateTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SUGGESTED_ACTIONS: SuggestedAction[] = [
  {
    id: 'gate-missing',
    label: 'Show me what is still missing for this gate.',
    body: 'Show me what is still missing for this gate.',
  },
  {
    id: 'gate-blocking',
    label: "What's blocking the gate?",
    body: "What's blocking the gate?",
  },
];

export function StrategicMoveDetailClient({ move, workspace }: Props) {
  const initialThread: ChatMessage[] = [
    {
      id: 'nexus-open-detail',
      role: 'agent',
      body: `I'm scoped to ${move.displayCode} — ${move.name}. Currently in ${move.phaseLabel}. Status: ${move.status.text.toLowerCase()}.`,
    },
    {
      id: 'nexus-open-detail-2',
      role: 'agent',
      body: `${move.status.description}. Want me to walk through what's needed to advance?`,
    },
  ];

  const [thread, setThread] = useState<ChatMessage[]>(initialThread);
  const threadRef = useRef<ChatMessage[]>(initialThread);
  threadRef.current = thread;

  const updateThread = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      const next = typeof updater === 'function' ? updater(threadRef.current) : updater;
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
          ? `\n\n[Attached: ${attachments.map((a) => a.file_name).join(', ')}]`
          : '';
      const fullMessage = trimmed + attachmentSuffix;

      const assistantTurnId = generateTurnId();
      updateThread((prev) => [
        ...prev,
        { id: generateTurnId(), role: 'user', body: fullMessage },
        { id: assistantTurnId, role: 'agent', body: '' },
      ]);

      try {
        const conversationHistory = threadRef.current
          .filter((t) => t.body.trim().length > 0)
          .map((t) => ({
            role: t.role === 'agent' ? 'assistant' : 'user',
            content: t.body,
          }));

        const res = await fetch('/api/chat/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fullMessage,
            tenantName: move.tenant.name,
            agentName: 'Nexus',
            // 'programs-detail' is the existing semantic surface key for
            // /strategic-moves/[id] — canonicalizeFromBody reshapes it to
            // '/programs/<id>' when programId is present. Tool registry
            // and the artifact-channel gate both expect the URL form.
            surface: 'programs-detail',
            conversationHistory,
            surfaceContext: {
              programId: move.id,
              moveId: move.id,
              moveCode: move.displayCode,
              moveTitle: move.name,
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
        let pendingBuffer = '';
        let committedVisible = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingBuffer += decoder.decode(value, { stream: true });
          const { visibleText, remaining } = extractArtifacts(pendingBuffer);
          committedVisible += visibleText;
          pendingBuffer = remaining;

          const display = (committedVisible + visibleArtifactPendingText(pendingBuffer)).trimEnd();
          updateThread((prev) =>
            prev.map((t) => (t.id === assistantTurnId ? { ...t, body: display } : t)),
          );
        }

        if (pendingBuffer.length > 0) {
          const final = extractArtifacts(pendingBuffer);
          committedVisible +=
            final.visibleText +
            (final.remaining.length > 0 ? visibleArtifactPendingText(final.remaining) : '');
        }

        updateThread((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId ? { ...t, body: committedVisible.trimEnd() } : t,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Agent error';
        updateThread((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId
              ? { ...t, body: `I encountered an issue: ${msg}. Please try again.` }
              : t,
          ),
        );
      }
    },
    [move, updateThread],
  );

  return (
    <AgentDock
      agent={{
        initials: 'N',
        name: 'Nexus',
        role: 'Strategic Moves Conductor',
      }}
      surface="moves/detail"
      defaultMode="side-rail"
      defaultLeftPercent={35}
      minLeftPx={320}
      surfaceContext={{
        moveId: move.id,
        moveCode: move.displayCode,
        moveTitle: move.name,
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
