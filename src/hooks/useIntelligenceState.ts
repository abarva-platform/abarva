import { useState } from 'react';
import type { NexusTurnData } from '@/lib/intelligence/types';

export type IntelligenceUiState = 'A' | 'B' | 'C';

export function deriveIntelligenceState(
  turns: NexusTurnData[],
  opts: { forceState?: IntelligenceUiState | null; isStreaming?: boolean } = {},
): IntelligenceUiState {
  if (opts.forceState) return opts.forceState;
  const nexusTurns = turns.filter((turn) => turn.role === 'nexus').length;
  if (nexusTurns >= 3) return 'C';
  if (nexusTurns >= 1 || opts.isStreaming) return 'B';
  return 'A';
}

export function useIntelligenceState(
  turns: NexusTurnData[],
  opts: { forceState?: IntelligenceUiState | null; isStreaming?: boolean } = {},
) {
  const [manualState, setManualState] = useState<IntelligenceUiState | null>(opts.forceState ?? null);

  const state = deriveIntelligenceState(turns, {
    forceState: manualState ?? opts.forceState ?? null,
    isStreaming: opts.isStreaming,
  });

  return {
    state,
    setState: setManualState,
    enterDeepDive: () => setManualState('C'),
    reset: () => setManualState(null),
  };
}
