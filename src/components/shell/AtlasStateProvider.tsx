'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  appendAtlasAgentTurn,
  appendAtlasUserTurn,
  buildAtlasContextualReply,
  clearAtlasResponse,
  createAtlasPageState,
  resetAtlasPageState,
  type AtlasPageContextValue,
  type AtlasPageStateProviderProps,
} from '@/lib/shell/atlas-page-state';
import type { BrokerMode } from '@/lib/knowledge/context-broker';
import { writeStoredContextMode } from '@/lib/shell/context-mode-storage';

interface AtlasStateProviderProps extends AtlasPageStateProviderProps {
  children: ReactNode;
}

export const AtlasPageStateContext = createContext<AtlasPageContextValue | null>(null);

function stableKey(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function AtlasStateProvider({
  children,
  tenantName,
  surface,
  stage = null,
  surfaceContext = {},
  agentName = 'Atlas',
  synthesisText,
  suggestedActions = [],
}: AtlasStateProviderProps) {
  const surfaceContextKey = stableKey(surfaceContext);
  const suggestedActionsKey = stableKey(suggestedActions);

  const seed = useMemo(
    () => ({
      tenantName,
      surface,
      stage,
      surfaceContext,
      agentName,
      synthesisText,
      suggestedActions,
    }),
    [
      tenantName,
      surface,
      stage,
      surfaceContextKey,
      agentName,
      synthesisText,
      suggestedActionsKey,
    ],
  );

  const [state, setState] = useState(() => createAtlasPageState(seed));

  useEffect(() => {
    setState(resetAtlasPageState(seed));
  }, [seed]);

  const ask = useCallback((text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setState((previous) => {
      const withUserTurn = appendAtlasUserTurn(previous, cleanText);
      return appendAtlasAgentTurn(withUserTurn, buildAtlasContextualReply(withUserTurn, cleanText));
    });
  }, []);

  const clearResponse = useCallback(() => {
    setState((previous) => clearAtlasResponse(previous));
  }, []);

  const reset = useCallback(() => {
    setState(resetAtlasPageState(seed));
  }, [seed]);

  // CB-6 · 4-mode toggle setter for the legacy provider. The non-stream
  // path doesn't actually re-run assembly (this provider builds replies
  // in-memory via `buildAtlasContextualReply`), but we must satisfy the
  // `AtlasPageContextValue` contract and keep the localStorage write so
  // the preference persists across navigations into the streaming
  // provider.
  const setContextBundleMode = useCallback(
    (mode: BrokerMode) => {
      setState((previous) => ({ ...previous, contextBundleMode: mode }));
      writeStoredContextMode(surface, mode);
    },
    [surface],
  );

  const value = useMemo<AtlasPageContextValue>(
    () => ({
      ...state,
      ask,
      clearResponse,
      reset,
      setContextBundleMode,
    }),
    [state, ask, clearResponse, reset, setContextBundleMode],
  );

  return (
    <AtlasPageStateContext.Provider value={value}>
      {children}
    </AtlasPageStateContext.Provider>
  );
}

export function useAtlasPageState() {
  return useContext(AtlasPageStateContext);
}
