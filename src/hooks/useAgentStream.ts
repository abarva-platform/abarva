'use client';

// Stateless fallback — no history. Use AtlasPageStateProvider for multi-turn.

import { useState, useCallback } from 'react';
import {
  extractArtifacts,
  sanitizeArtifactDebugText,
  visibleArtifactPendingText,
  type Artifact,
} from '@/lib/agent/artifacts';

interface UseAgentStreamOptions {
  surface: string; // 'programs' | 'intelligence' | 'tower' | 'source' | 'setup' | 'home'
  programId?: string;
  agentName: string;
  /**
   * Surface 2 PR2 — when provided, the hook parses artifacts from the
   * streamed text and dispatches each one. The exposed `response` is
   * the visible text with artifact tuples stripped, so the caller can
   * render it through AgentMarkdown without leaking sentinel grammar.
   */
  onArtifact?: (artifact: Artifact) => void;
}

export function useAgentStream({
  surface,
  programId,
  agentName,
  onArtifact,
}: UseAgentStreamOptions) {
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
        // Two buffers when artifact extraction is enabled:
        //   - `pending` holds raw streamed text that may contain a
        //     partial artifact sentinel; carried across chunks.
        //   - `committedVisible` holds the artifact-stripped text.
        // When onArtifact isn't provided we just accumulate raw and
        // expose it directly (preserves the prior behaviour for
        // surfaces that haven't opted into the channel).
        let pending = '';
        let committedVisible = '';
        const seenArtifacts = new Set<string>();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!onArtifact) {
            // Raw passthrough — no artifact parsing.
            committedVisible += chunk;
            setResponse(committedVisible);
            continue;
          }
          pending += chunk;
          const { visibleText, artifacts, remaining } = extractArtifacts(pending);
          committedVisible += visibleText;
          pending = remaining;
          for (const a of artifacts) {
            const key = JSON.stringify(a);
            if (seenArtifacts.has(key)) continue;
            seenArtifacts.add(key);
            onArtifact(a);
          }
          setResponse(sanitizeArtifactDebugText(committedVisible) + visibleArtifactPendingText(pending));
        }

        // Flush any unclosed artifact tail when streaming ends.
        if (onArtifact && pending.length > 0) {
          const final = extractArtifacts(pending);
          committedVisible += final.visibleText;
          if (final.remaining.length > 0) committedVisible += visibleArtifactPendingText(final.remaining);
          for (const a of final.artifacts) {
            const key = JSON.stringify(a);
            if (seenArtifacts.has(key)) continue;
            seenArtifacts.add(key);
            onArtifact(a);
          }
          setResponse(sanitizeArtifactDebugText(committedVisible));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connection error');
      } finally {
        setIsStreaming(false);
      }
    },
    [surface, programId, agentName, onArtifact],
  );

  const clear = useCallback(() => {
    setResponse('');
    setError(null);
  }, []);

  return { ask, response, isStreaming, error, clear };
}
