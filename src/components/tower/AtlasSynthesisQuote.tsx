'use client';

import { useEffect, useState, useRef } from 'react';

interface AtlasSynthesisQuoteProps {
  fallback: string; // shown while streaming or on error
  onLoaded?: (text: string) => void;
}

/**
 * Streams the Atlas portfolio synthesis from /api/tower/synthesis.
 * Renders the streamed text progressively. Falls back to static text on error.
 *
 * Atlas reasons across the whole portfolio (no per-instance body params).
 */
export function AtlasSynthesisQuote({ fallback, onLoaded }: AtlasSynthesisQuoteProps) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let accumulated = '';

    fetch('/api/tower/synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
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
  }, [onLoaded]);

  if (error || (!text && done)) return <span>{fallback}</span>;
  if (!text) return <span className="animate-pulse opacity-60">{fallback}</span>;
  return <span>{text}</span>;
}
