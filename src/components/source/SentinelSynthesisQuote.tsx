'use client';

import { useEffect, useState, useRef } from 'react';

interface SentinelSynthesisQuoteProps {
  instanceId: string;
  fallback: string; // shown while streaming or on error
  onLoaded?: (text: string) => void;
}

/**
 * Streams the Sentinel synthesis for a source event instance from /api/source/synthesis.
 * Renders the streamed text progressively. Falls back to static text on error.
 */
export function SentinelSynthesisQuote({ instanceId, fallback, onLoaded }: SentinelSynthesisQuoteProps) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let accumulated = '';

    fetch('/api/source/synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`synthesis ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error('no body');
        const decoder = new TextDecoder();
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          accumulated += decoder.decode(value, { stream: true });
          setText(accumulated);
        }
        setDone(true);
        onLoaded?.(accumulated);
      })
      .catch(() => {
        setError(true);
      });
  }, [instanceId, onLoaded]);

  if (error || (!text && done)) return <span>{fallback}</span>;
  if (!text) return <span className="animate-pulse opacity-60">{fallback}</span>;
  return <span>{text}</span>;
}
