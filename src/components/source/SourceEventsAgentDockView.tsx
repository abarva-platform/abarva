'use client';

// Source events portfolio · AgentDock chip (sibling of the AgentDock
// foundation PR #1764). Replaces the deferred-stub SentinelAgentColumn
// with the shared <AgentDock /> side-rail so portfolio chat, paperclip
// uploads, and resize / pin / expand modes all work consistently with
// every other agent surface.
//
// Why this lives in its own client component:
//   - The /source/events page is server-rendered (auth + tenancy +
//     pending-event approval queue need server data).
//   - <AgentDock /> is `'use client'` — it manages localStorage, drag-
//     drop, fetch, and a streaming chat runtime hook.
//   - The portfolio body itself (`SourceEventsPortfolio`) is also a
//     server-renderable React tree, but inside this view it becomes
//     the AgentDock `workspace` slot. We pass it as a ReactNode so the
//     server tree renders normally and the client tree mounts the dock
//     around it.
//
// Suggested actions:
//   1. "Show me events at risk"      → /source/events?status=at_risk
//   2. "What's stalled in Strategy?" → /source/events?stage=Strategy
//   3. "Compare BAFO finalists"      → /source/compare?stage=bafo
//
// Spec source: feat(source) · migrate /source/events portfolio to
// shared AgentDock — closes the layout-overlap bug on /source/events
// and unifies the chat surface with the rest of the platform.

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AgentDock,
  type AttachmentRef,
  type ChatMessage,
  type SuggestedAction,
} from '@/components/agent/AgentDock';

interface Props {
  /** Server-rendered portfolio body — becomes the AgentDock workspace. */
  workspace: ReactNode;
  /** Active filters (forwarded to surfaceContext so Sentinel can reason about them). */
  filterStage?: string | null;
  filterStatus?: string | null;
}

const SENTINEL_AGENT = {
  initials: 'Sn',
  name: 'Sentinel',
  role: 'Source Portfolio Conductor',
};

/** Keep the suggestion ids stable for telemetry. */
const SUGGESTION_IDS = {
  AT_RISK: 'at-risk',
  STALLED_STRATEGY: 'stalled-strategy',
  COMPARE_BAFO: 'compare-bafo',
} as const;

const SOURCE_AGENT_API_URL = '/api/chat/agent';

export function SourceEventsAgentDockView({ workspace, filterStage, filterStatus }: Props) {
  const router = useRouter();
  const [thread, setThread] = useState<ChatMessage[]>([]);

  // Translate AgentDock onMessage into a streamed Sentinel runtime call,
  // accumulating the response locally so we can commit a single agent
  // turn when streaming finishes. We use the same /api/chat/agent
  // endpoint every other Source agent surface uses; surfaceContext
  // (filterStage, filterStatus) is forwarded so the prompt is grounded
  // in the portfolio posture the user is currently looking at.
  const onMessage = useCallback(
    async (text: string, attachments: AttachmentRef[]) => {
      if (!text && attachments.length === 0) return;
      const userBody =
        attachments.length > 0
          ? `${text}\n\n[attached: ${attachments.map((a) => a.file_name).join(', ')}]`
          : text;
      setThread((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', body: userBody },
      ]);

      // Inline the extracted attachment text so Sentinel has the file
      // contents as context even before a long-form retrieval pipeline
      // is wired up. The dock route already trims preview to ~4000
      // chars per attachment which is safe to stitch into the prompt.
      const attachmentContext = attachments
        .filter((a) => a.extracted_text_preview && a.extracted_text_preview.trim().length > 0)
        .map(
          (a) =>
            `--- attachment: ${a.file_name} (${a.mime}) ---\n${a.extracted_text_preview}\n--- end attachment ---`,
        )
        .join('\n\n');
      const messageForRuntime = attachmentContext ? `${text}\n\n${attachmentContext}` : text;

      const filterSummary: string[] = [];
      if (filterStage) filterSummary.push(`stage=${filterStage}`);
      if (filterStatus) filterSummary.push(`status=${filterStatus}`);
      const portfolioContextLine =
        filterSummary.length > 0
          ? ` Portfolio filters: ${filterSummary.join(', ')}.`
          : ' Portfolio filters: none.';
      const context = `Surface: source/events. Agent: ${SENTINEL_AGENT.name}.${portfolioContextLine} The user is asking within the AbarVa platform.`;

      let acc = '';
      try {
        const res = await fetch(SOURCE_AGENT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageForRuntime,
            context,
            surface: 'source/events',
            agentName: SENTINEL_AGENT.name,
          }),
        });
        if (!res.ok) {
          throw new Error(`Sentinel returned ${res.status}`);
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');
        const decoder = new TextDecoder();
        let streaming = true;
        while (streaming) {
          const { done, value } = await reader.read();
          if (done) {
            streaming = false;
            break;
          }
          acc += decoder.decode(value, { stream: true });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection error';
        acc = `I hit an error: ${message}`;
      }

      const trimmed = acc.trim();
      const finalBody = trimmed.length > 0 ? trimmed : 'Sentinel did not return a response.';
      setThread((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'agent', body: finalBody },
      ]);
    },
    [filterStage, filterStatus],
  );

  // Suggested actions. The first two are filter-shortcuts (rewrite the
  // /source/events query string); the third routes to /source/compare.
  const suggestedActions: SuggestedAction[] = [
    {
      id: SUGGESTION_IDS.AT_RISK,
      label: 'Show me events at risk',
      body: 'Show me the events that are currently at risk and tell me what is blocking each one.',
      onClick: () => {
        const params = new URLSearchParams();
        if (filterStage) params.set('stage', filterStage);
        params.set('status', 'at_risk');
        router.push(`/source/events?${params.toString()}`);
      },
    },
    {
      id: SUGGESTION_IDS.STALLED_STRATEGY,
      label: "What's stalled in Strategy?",
      body: 'What sourcing events are stalled in the Strategy stage and why?',
      onClick: () => {
        const params = new URLSearchParams();
        params.set('stage', 'Strategy');
        if (filterStatus) params.set('status', filterStatus);
        router.push(`/source/events?${params.toString()}`);
      },
    },
    {
      id: SUGGESTION_IDS.COMPARE_BAFO,
      label: 'Compare BAFO finalists',
      body: 'Compare the BAFO finalists across the portfolio.',
      onClick: () => {
        router.push('/source/compare?stage=bafo');
      },
    },
  ];

  return (
    <AgentDock
      agent={SENTINEL_AGENT}
      surface="source/events"
      defaultMode="side-rail"
      defaultLeftPercent={30}
      minLeftPx={300}
      surfaceContext={{
        context: 'Source events portfolio',
        filterStage: filterStage ?? null,
        filterStatus: filterStatus ?? null,
      }}
      thread={thread}
      onMessage={onMessage}
      suggestedActions={suggestedActions}
      workspace={workspace}
    />
  );
}
