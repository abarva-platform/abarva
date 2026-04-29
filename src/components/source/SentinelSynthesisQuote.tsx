'use client';

import { useEffect, useState, useRef } from 'react';
import { SynthesisFeedbackControl } from '@/components/reasoning/SynthesisFeedbackControl';
import { ExplainQuotePill } from '@/components/_shared/ExplainQuotePill';
import {
  readSynthesisCache,
  writeSynthesisCache,
} from '@/lib/reasoning/synthesis-client-cache';

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
  const [eventId, setEventId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let accumulated = '';
    const clientCacheKey = `source:${instanceId}`;
    const cached = readSynthesisCache(clientCacheKey);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cached) headers['If-None-Match'] = cached.etag;

    fetch('/api/source/synthesis', {
      method: 'POST',
      headers,
      body: JSON.stringify({ instanceId }),
    })
      .then(async (res) => {
        // 304 Not Modified — server confirms our cached body still matches.
        if (res.status === 304 && cached) {
          setEventId(res.headers.get('X-Synthesis-Event-Id'));
          setText(cached.text);
          setDone(true);
          onLoaded?.(cached.text);
          return;
        }
        if (!res.ok) throw new Error(`synthesis ${res.status}`);
        setEventId(res.headers.get('X-Synthesis-Event-Id'));
        const etag = res.headers.get('ETag');
        const reader = res.body?.getReader();
        if (!reader) throw new Error('no body');
        const decoder = new TextDecoder();
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          accumulated += decoder.decode(value, { stream: true });
          setText(accumulated);
        }
        if (etag && accumulated) {
          writeSynthesisCache(clientCacheKey, etag, accumulated);
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
  return (
    <span>
      {text}
      {done && <SynthesisFeedbackControl eventId={eventId} />}
      {done && <ExplainQuotePill surface="source" instanceId={instanceId} />}
    </span>
  );
}
