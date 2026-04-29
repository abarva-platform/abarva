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
import type {
  AtlasPageContextValue,
  AtlasPageStateProviderProps,
  ChatTurn,
} from '@/lib/shell/atlas-page-state';
import { ATLAS_SYNTHESIS_TURN_ID } from '@/lib/shell/atlas-page-state';
import { consumeOriginationHandoff } from '@/lib/shell/origination-handoff';

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
  surface,
  stage = null,
  surfaceContext = {},
  agentName,
  children,
}: AtlasPageStateProviderProps & { children: ReactNode }) {
  const resolvedAgentName = agentName ?? DEFAULT_AGENT[surface] ?? 'Atlas';

  const [conversation, setConversation] = useState<ChatTurn[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const ask = useCallback(
    async (text: string) => {
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
      };

      setConversation(prev => [...prev, userTurn]);
      setCurrentResponse('');
      setError(null);
      setIsStreaming(true);

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

        const res = await fetch('/api/chat/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            message: text.trim(),
            surface,
            tenantName,
            stage: stage ?? undefined,
            surfaceContext,
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
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setCurrentResponse(accumulated);
        }

        // Flush streaming text into conversation
        const agentTurn: ChatTurn = {
          id: `agt-${Date.now()}`,
          role: 'agent',
          text: accumulated,
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
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [surface, tenantName, stage, resolvedAgentName, isStreaming, conversation],
  );

  const clearResponse = useCallback(() => {
    setCurrentResponse('');
    setError(null);
  }, []);

  const value: AtlasPageContextValue = {
    tenantName,
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
