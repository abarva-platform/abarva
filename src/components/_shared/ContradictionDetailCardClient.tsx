'use client';

/**
 * ContradictionDetailCardClient — REASON-30
 *
 * Thin `'use client'` wrapper around `ContradictionDetailCard` that holds
 * local state for ids the user has dismissed during this session. Once
 * "Mark resolved" is clicked the card disappears from view immediately, and
 * the click is forwarded to the in-memory resolution state via the
 * `/api/reasoning/contradictions/resolve` route so subsequent server-side
 * filtering on this same instance also drops the card.
 *
 * Page reload may bring a previously dismissed card back: the in-memory ring
 * buffer does not survive a server restart, and there is no client-side
 * persistence. That tradeoff is intentional for the first iteration.
 */

import { useState, useTransition } from 'react';
import type { ContradictionDetection } from '@/lib/reasoning/types';
import { ContradictionDetailCard } from './ContradictionDetailCard';

export interface ContradictionDetailCardClientProps {
  contradictions: ContradictionDetection[];
  /** Used to scope the resolution id (`{instanceId}::{templateId}`). */
  instanceId: string;
}

export function ContradictionDetailCardClient({
  contradictions,
  instanceId,
}: ContradictionDetailCardClientProps) {
  const [resolvedLocal, setResolvedLocal] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const visible = contradictions.filter(
    (c) => !resolvedLocal.has(`${instanceId}::${c.templateId}`),
  );

  function handleMarkResolved(id: string): void {
    setResolvedLocal((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    startTransition(() => {
      void fetch('/api/reasoning/contradictions/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contradictionId: id }),
      }).catch(() => {
        // Swallow network errors — local state already hides the card.
        // The server-side ring buffer is best-effort for this iteration.
      });
    });
  }

  return (
    <ContradictionDetailCard
      contradictions={visible}
      instanceId={instanceId}
      onMarkResolved={handleMarkResolved}
    />
  );
}
