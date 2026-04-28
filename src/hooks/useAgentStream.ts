'use client';

// Stateless fallback — no history. Use AtlasPageStateProvider for multi-turn.

import { useState, useCallback } from 'react';

interface UseAgentStreamOptions {
  surface: string; // 'programs' | 'intelligence' | 'tower' | 'source' | 'setup' | 'home'
  programId?: string;
  agentName: string;
}

export function useAgentStream({ surface, programId, agentName }: UseAgentStreamOptions) {
  const [response, setResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsStreaming(true);
      setResponse('');
      setError(null);

      try {
        const context = `Surface: ${surface}. Agent: ${agentName}.${programId ? ` Active program: ${programId}.` : ''} The user is asking within the AbarVa platform.`;

        const res = await fetch('/api/chat/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // agentName passed as a top-level field so the API uses the correct
          // agent voice (Sentinel/Nexus/etc.) rather than defaulting to Atlas.
          body: JSON.stringify({ message, context, programId, surface, agentName }),
        });

        if (!res.ok) {
          throw new Error(`Chat API returned ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // API streams plain text — just accumulate chunks directly
          accumulated += decoder.decode(value, { stream: true });
          setResponse(accumulated);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connection error');
      } finally {
        setIsStreaming(false);
      }
    },
    [surface, programId, agentName],
  );

  const clear = useCallback(() => {
    setResponse('');
    setError(null);
  }, []);

  return { ask, response, isStreaming, error, clear };
}
