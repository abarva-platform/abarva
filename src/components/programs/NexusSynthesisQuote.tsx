'use client';

import { useEffect, useState, useRef } from 'react';
import { SynthesisFeedbackControl } from '@/components/reasoning/SynthesisFeedbackControl';
import { ExplainQuotePill } from '@/components/_shared/ExplainQuotePill';

interface NexusSynthesisQuoteProps {
  programId: string;
  fallback: string; // shown while streaming or on error
  onLoaded?: (text: string) => void;
}

/**
 * Streams the Nexus synthesis for a program instance from /api/programs/synthesis.
 * Renders the streamed text progressively. Falls back to static text on error.
 */
export function NexusSynthesisQuote({ programId, fallback, onLoaded }: NexusSynthesisQuoteProps) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let accumulated = '';

    fetch('/api/programs/synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`synthesis ${res.status}`);
        setEventId(res.headers.get('X-Synthesis-Event-Id'));
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
  }, [programId, onLoaded]);

  if (error || (!text && done)) return <span>{fallback}</span>;
  if (!text) return <span className="animate-pulse opacity-60">{fallback}</span>;
  return (
    <span>
      {text}
      {done && <SynthesisFeedbackControl eventId={eventId} />}
      {done && <ExplainQuotePill surface="programs" instanceId={programId} />}
    </span>
  );
}
