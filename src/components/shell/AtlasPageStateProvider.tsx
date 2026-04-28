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
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AtlasPageContextValue,
  AtlasPageStateProviderProps,
  ChatTurn,
} from '@/lib/shell/atlas-page-state';

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
    [surface, tenantName, stage, resolvedAgentName, isStreaming],
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
