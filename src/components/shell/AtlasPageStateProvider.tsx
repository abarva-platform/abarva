'use client';

// AtlasPageStateProvider · Shell Layout Spec v2 §6
//
// React Context provider that creates exactly ONE AtlasPageState per page.
// Every Atlas surface (AgentColumn, AskAnythingBar, and the future AtlasDrawer
// for Mode B) reads from this context — same tenant, same conversation,
// same streaming state.
//
// Placement: AppShell wraps its body children in this provider, passing
// tenantName + surface down. Pages can also mount it directly for finer
// control (e.g. a programs-detail page passing stage + surfaceContext).
//
// No visual change in Wave 1 — the provider is architectural infrastructure.
// Waves 2 and 3 will change which presentational components render from it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type {
  AtlasPageContextValue,
  AtlasPageStateProviderProps,
  ChatTurn,
} from '@/lib/shell/atlas-page-state';
import { ATLAS_SYNTHESIS_TURN_ID } from '@/lib/shell/atlas-page-state';
import { consumeOriginationHandoff } from '@/lib/shell/origination-handoff';
// PR-L · provider now parses artifacts from streamed chunks. Without
// this, the structured-artifact channel landed by PR-B/PR-C never
// fired on /programs/<id> because AtlasPageStateProvider's ask() just
// accumulated raw text — sentinels would surface as visible noise in
// the chat thread, AND the reactive panel never received any
// dispatches.
import {
  extractArtifacts,
  sanitizeArtifactDebugText,
  visibleArtifactPendingText,
  type Artifact,
} from '@/lib/agent/artifacts';
// CB-6 · type-only — server-only directive on the broker module is
// preserved because TS strips this at compile time.
import type { BrokerMode, ContextBundle } from '@/lib/knowledge/context-broker';
import {
  readStoredContextMode,
  writeStoredContextMode,
} from '@/lib/shell/context-mode-storage';
// OV2-FM-TELEMETRY · failure-mode events fire from this dispatch site
// because the artifact only becomes user-visible AFTER it lands in the
// reactive panel. Dedupe by failureModeId via firedFlagsRef below
// matches the panel's own dedupe key (NexusReactivePanel.selectVisibleArtifacts)
// so re-emissions of the same flag don't inflate rollup counts.
// Server-side capture is OV2-FM-TELEMETRY-SERVER follow-on; the
// `cleared` event is wired in the helper but not yet fired here
// because agent doctrine for retraction has not landed.
import {
  trackFailureModeFlagged,
  type FailureModeContext,
} from '@/lib/programs/failure-mode-telemetry';
// OV2-4b · attachment refs that ride along with the user turn for
// chip rendering and pass through surfaceContext for the agent.
import type { AttachmentChipRef } from '@/lib/programs/attachments/types';

// ── Default surface-to-agent mapping ─────────────────────────────────────────

const DEFAULT_AGENT: Record<string, string> = {
  tower:         'Atlas',
  programs:      'Nexus',
  'programs-detail': 'Nexus',
  source:        'Sentinel',
  'source-detail': 'Sentinel',
  intelligence:  'Sentinel',
  home:          'Atlas',
  setup:         'Steward',
  'setup-detail': 'Steward',
};

// ── Context ───────────────────────────────────────────────────────────────────

const AtlasPageStateContext = createContext<AtlasPageContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AtlasPageStateProvider({
  tenantName,
  hasTenantKey = false,
  surface,
  stage = null,
  surfaceContext = {},
  agentName,
  onArtifact,
  children,
}: AtlasPageStateProviderProps & { children: ReactNode }) {
  const resolvedAgentName = agentName ?? DEFAULT_AGENT[surface] ?? 'Atlas';

  const [conversation, setConversation] = useState<ChatTurn[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CB-6 · context-bundle state. The agent route emits a
  // `context-bundle` artifact at the start of each response; we
  // catch it in the dispatch loop, store the bundle here, and
  // unset the assembling flag.
  const [latestContextBundle, setLatestContextBundle] =
    useState<ContextBundle | null>(null);
  const [isAssemblingContextBundle, setIsAssemblingContextBundle] =
    useState(false);

  // CB-6 · per-surface mode preference (4-mode toggle). Hydrated from
  // localStorage on mount via `readStoredContextMode`; updates persist
  // back through `writeStoredContextMode`.
  const [contextBundleMode, setContextBundleModeState] =
    useState<BrokerMode | null>(null);

  useEffect(() => {
    // `readStoredContextMode` itself guards `typeof window`, so this is
    // safe to call on the client mount path. The hydration runs once
    // per surface — on surface change, we re-read so the toggle's
    // active state matches the new surface's stored preference.
    const stored = readStoredContextMode(surface);
    setContextBundleModeState(stored);
  }, [surface]);

  const setContextBundleMode = useCallback(
    (mode: BrokerMode) => {
      setContextBundleModeState(mode);
      writeStoredContextMode(surface, mode);
    },
    [surface],
  );

  // PR-K · hydrate from origination handoff if present. When the user
  // just completed commit_program on /programs/new, StewardChat
  // persisted the conversation turns + a handoff marker to
  // sessionStorage before navigation. We pick that up on mount so
  // /programs/<id> doesn't start with a blank Nexus thread — the
  // origination conversation continues as the same canvas.
  useEffect(() => {
    if (surface !== 'programs-detail') return;
    const programId =
      typeof surfaceContext.programId === 'string' ? surfaceContext.programId : null;
    if (!programId) return;
    const handoffTurns = consumeOriginationHandoff(programId);
    if (handoffTurns && handoffTurns.length > 0) {
      setConversation(handoffTurns);
    }
    // Run only on first mount per surface/program. surfaceContext is
    // referenced via lookup; we don't depend on its identity changing.
  }, [surface, surfaceContext]);

  // Stable ref so ask() can cancel an in-flight request
  const abortRef = useRef<AbortController | null>(null);

  // PR-Q · navigate-to artifact handling. The agent emits a
  // `navigate-to` artifact via the navigate_to tool to take the user
  // to a different page (e.g. /programs/new for new-program intent
  // when on /programs). We queue the request during streaming and
  // fire router.push (or router.replace) once the stream completes
  // — same pattern as advance_phase's program-phase-changed (PR-L)
  // where we wait for the close-of-turn before mutating routing.
  const router = useRouter();
  const pendingNavRef = useRef<{ target: string; replace: boolean } | null>(null);

  // OV2-FM-TELEMETRY · session-scoped dedupe set for failure-mode-flagged
  // events. Same key (failureModeId) the reactive panel uses so the
  // PostHog rollup counts each catalog mode at most once per session
  // even when Nexus re-emits the same flag across turns.
  const firedFlagsRef = useRef<Set<number>>(new Set());

  const ask = useCallback(
    async (text: string, attachments?: AttachmentChipRef[]) => {
      if (!text.trim() || isStreaming) return;

      // Cancel any previous in-flight request
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const userTurn: ChatTurn = {
        id: `usr-${Date.now()}`,
        role: 'user',
        text: text.trim(),
        agentName: resolvedAgentName,
        timestamp: Date.now(),
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      };

      setConversation(prev => [...prev, userTurn]);
      setCurrentResponse('');
      setError(null);
      setIsStreaming(true);
      // CB-6 · the broker assembles the bundle BEFORE streaming starts,
      // and emits it as the first artifact. Show the skeleton in the
      // panel during the round-trip so the user sees that retrieval
      // is happening.
      setIsAssemblingContextBundle(true);

      try {
        // Build prior-turn history to give the model multi-turn context.
        // Exclude the synthesis turn (it's in the system prompt already) and
        // cap at the last 10 turns so the context window stays bounded.
        const conversationHistory = conversation
          .filter(t => t.id !== ATLAS_SYNTHESIS_TURN_ID)
          .slice(-10)
          .map(t => ({
            role: t.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: t.text,
          }));

        // CB-6 · thread the user's chosen mode (4-mode toggle) into
        // `surfaceContext.contextBundleMode`. The route prefers this
        // when present and valid for the auth state; otherwise it falls
        // back to `inferModeForSurface(surface, tenantKey)`.
        const mergedSurfaceContext: Record<string, unknown> = {
          ...surfaceContext,
          ...(attachments && attachments.length > 0 ? { attachments } : {}),
          ...(contextBundleMode ? { contextBundleMode } : {}),
        };
        const res = await fetch('/api/chat/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            message: text.trim(),
            surface,
            tenantName,
            stage: stage ?? undefined,
            surfaceContext: mergedSurfaceContext,
            agentName: resolvedAgentName,
            conversationHistory,
            // Legacy compat — context string is built server-side from the
            // richer fields above, but we keep the field for API consumers
            // that haven't migrated.
            context: `Tenant: ${tenantName}. Surface: ${surface}. Agent: ${resolvedAgentName}${stage ? `. Stage: ${stage}` : ''}.`,
          }),
        });

        if (!res.ok) throw new Error(`Agent API ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        // PR-L streaming loop — parse artifacts incrementally and
        // strip the sentinels from what the user sees. `pendingBuffer`
        // carries any partial sentinel across chunk boundaries (the
        // same pattern StewardChat uses for /programs/new).
        let pendingBuffer = '';
        let committedVisible = '';
        const seenArtifactKeys = new Set<string>();

        const dispatchNew = (artifacts: Artifact[]) => {
          for (const a of artifacts) {
            const key = JSON.stringify(a);
            if (seenArtifactKeys.has(key)) continue;
            seenArtifactKeys.add(key);
            // CB-6 · context-bundle is consumed by the chat surface to
            // render the "Context Assembled" panel beside the answer.
            // Store the bundle, clear the assembling flag, and continue
            // — we deliberately do NOT forward it to onArtifact since
            // it's not reactive-panel content.
            if (a.type === 'context-bundle') {
              setLatestContextBundle(a.bundle);
              setIsAssemblingContextBundle(false);
              continue;
            }
            // PR-Q · navigate-to is handled centrally — queue it for
            // the post-stream finally block. We deliberately do NOT
            // forward it to onArtifact, since reactive-panel consumers
            // would treat it as panel content. If a future surface
            // wants to observe navigations it can subscribe to
            // router events directly.
            if (a.type === 'navigate-to') {
              pendingNavRef.current = { target: a.target, replace: a.replace === true };
              continue;
            }
            // OV2-FM-TELEMETRY · fire posthog event the FIRST time we
            // see a given failureModeId in this session, so the
            // cross-program rollup (design doc Part E.5) has events
            // to aggregate. Tracking happens BEFORE onArtifact so the
            // event reflects what the platform produced even if the
            // panel render throws downstream.
            if (a.type === 'failure-mode-flagged') {
              if (!firedFlagsRef.current.has(a.failureModeId)) {
                firedFlagsRef.current.add(a.failureModeId);
                const programId =
                  typeof surfaceContext.programId === 'string'
                    ? surfaceContext.programId
                    : null;
                // Note: tenantName is the display name (e.g. "Apex Retail Group");
                // the broker tenant key (e.g. "apex-retail") is server-side and
                // not available in this client context. PostHog rollups can
                // bucket on display name; if a broker-key dimension becomes
                // necessary the API route can mirror via OV2-FM-TELEMETRY-SERVER.
                const ctx: FailureModeContext = {
                  programId,
                  tenantKey: tenantName,
                  surface,
                  agentName: resolvedAgentName,
                };
                trackFailureModeFlagged(a, ctx);
              }
            }
            onArtifact?.(a);
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingBuffer += decoder.decode(value, { stream: true });
          const { visibleText, artifacts, remaining } = extractArtifacts(pendingBuffer);
          committedVisible += visibleText;
          pendingBuffer = remaining;
          dispatchNew(artifacts);
          // Display the committed visible plus any in-flight buffer
          // (with sentinels still mid-stream); extractArtifacts will
          // re-clean on the next chunk.
          setCurrentResponse(sanitizeArtifactDebugText(committedVisible) + visibleArtifactPendingText(pendingBuffer));
        }

        // Final flush — any closed artifact whose close arrived in the
        // last chunk dispatches now; any genuinely malformed open
        // sentinel falls through as visible text so the bug is
        // observable rather than silently lost.
        if (pendingBuffer.length > 0) {
          const final = extractArtifacts(pendingBuffer);
          committedVisible += final.visibleText;
          if (final.remaining.length > 0) committedVisible += visibleArtifactPendingText(final.remaining);
          dispatchNew(final.artifacts);
          pendingBuffer = '';
        }

        // Flush streaming text into conversation
        const agentTurn: ChatTurn = {
          id: `agt-${Date.now()}`,
          role: 'agent',
          text: sanitizeArtifactDebugText(committedVisible),
          agentName: resolvedAgentName,
          timestamp: Date.now(),
        };
        setConversation(prev => [...prev, agentTurn]);
        setCurrentResponse('');
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // intentional cancel
        setError(e instanceof Error ? e.message : 'Connection error');
      } finally {
        setIsStreaming(false);
        // CB-6 · if the bundle artifact never arrived (broker errored,
        // stream aborted) clear the assembling flag so the panel stops
        // showing the skeleton and falls back to its prior bundle (if
        // any) or the cold-start state.
        setIsAssemblingContextBundle(false);
        // PR-Q · fire any queued navigation now that the turn has
        // settled. Pushing during the stream would unmount the
        // provider and throw away the in-flight reader.
        const nav = pendingNavRef.current;
        pendingNavRef.current = null;
        if (nav) {
          if (nav.replace) router.replace(nav.target);
          else router.push(nav.target);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [surface, tenantName, stage, resolvedAgentName, isStreaming, conversation, onArtifact, router, contextBundleMode],
  );

  const clearResponse = useCallback(() => {
    setCurrentResponse('');
    setError(null);
  }, []);

  const value: AtlasPageContextValue = {
    tenantName,
    hasTenantKey,
    surface,
    stage,
    surfaceContext,
    agentName: resolvedAgentName,
    conversation,
    currentResponse,
    isStreaming,
    error,
    suggestedActions: [],
    ask,
    clearResponse,
    latestContextBundle,
    isAssemblingContextBundle,
    contextBundleMode,
    setContextBundleMode,
  };

  return (
    <AtlasPageStateContext.Provider value={value}>
      {children}
    </AtlasPageStateContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

/**
 * Returns the per-page Atlas state. Must be called inside AtlasPageStateProvider.
 * Returns null if called outside the provider — callers should gracefully fall
 * back to local useAgentStream for backward compat during the migration.
 */
export function useAtlasPageState(): AtlasPageContextValue | null {
  return useContext(AtlasPageStateContext);
}
