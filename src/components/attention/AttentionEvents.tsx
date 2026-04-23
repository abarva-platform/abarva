'use client';

// Attention-events protocol · §1 of page-agent-coherence-work-order.md.
//
// React context that emits typed attention events from significant UI
// elements. Agent rails subscribe and silently update their active
// context; they surface a new prompt only on `idle`, `complete`, or
// explicit re-engagement. No narration of focus changes.
//
// Pre-decided taxonomy (don't re-ask per §1.6):
//   - element kinds: pressure-card, deliverable-row, kpi-card, chart-point,
//     table-row, evidence-citation, pattern-card, program-card,
//     phase-timeline-node, nav-link, sidebar-item
//   - idle threshold: 5 seconds
//   - focus events: click + 1s hover dwell (not hover alone — noisy)
//   - complete always triggers evaluation; focus triggers only if no
//     proactive prompt surfaced in the last 10 seconds

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type ElementKind =
  | 'pressure-card'
  | 'deliverable-row'
  | 'kpi-card'
  | 'chart-point'
  | 'table-row'
  | 'evidence-citation'
  | 'pattern-card'
  | 'program-card'
  | 'phase-timeline-node'
  | 'nav-link'
  | 'sidebar-item';

export type ActionKind = 'guided-choice' | 'free-text' | 'form-submit' | 'navigate';

export type AttentionEvent =
  | { type: 'focus'; kind: ElementKind; id: string; surface: string | null; tenant: string | null; ts: number }
  | { type: 'select'; kind: ElementKind; id: string; action: string; surface: string | null; tenant: string | null; ts: number }
  | { type: 'complete'; kind: ActionKind; result: string; surface: string | null; tenant: string | null; ts: number }
  | { type: 'idle'; duration: number; lastEvent: AttentionEvent | null; ts: number };

interface AttentionContextValue {
  emit: (event: Omit<AttentionEvent, 'ts'>) => void;
  currentFocus: AttentionEvent | null;
  lastComplete: AttentionEvent | null;
  idle: boolean;
}

const AttentionContext = createContext<AttentionContextValue | null>(null);

const IDLE_MS = 5_000;

export function AttentionProvider({
  surface = null,
  tenant = null,
  children,
}: {
  surface?: string | null;
  tenant?: string | null;
  children: ReactNode;
}) {
  const [currentFocus, setCurrentFocus] = useState<AttentionEvent | null>(null);
  const [lastComplete, setLastComplete] = useState<AttentionEvent | null>(null);
  const [idle, setIdle] = useState(false);
  const lastEventRef = useRef<AttentionEvent | null>(null);
  const idleTimer = useRef<number | null>(null);

  const scheduleIdle = useCallback(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    setIdle(false);
    idleTimer.current = window.setTimeout(() => {
      setIdle(true);
    }, IDLE_MS);
  }, []);

  const emit = useCallback(
    (partial: Omit<AttentionEvent, 'ts'>) => {
      const ts = Date.now();
      const event = { ...partial, ts } as AttentionEvent;
      lastEventRef.current = event;
      scheduleIdle();
      if (event.type === 'focus' || event.type === 'select') {
        // Silent state update per §1.4 — don't narrate, just track.
        setCurrentFocus(event);
      }
      if (event.type === 'complete') {
        setLastComplete(event);
      }
      if (process.env.NODE_ENV === 'development') {
        // Dev-only trace for debugging agent rail consumers.
        console.debug('[attention]', event);
      }
    },
    [scheduleIdle],
  );

  // Surface/tenant defaults applied at emit time.
  const emitWithContext = useCallback(
    (partial: Omit<AttentionEvent, 'ts'>) => {
      if (partial.type === 'focus' || partial.type === 'select' || partial.type === 'complete') {
        emit({
          ...partial,
          surface: 'surface' in partial && partial.surface ? partial.surface : surface,
          tenant: 'tenant' in partial && partial.tenant ? partial.tenant : tenant,
        } as Omit<AttentionEvent, 'ts'>);
      } else {
        emit(partial);
      }
    },
    [emit, surface, tenant],
  );

  useEffect(() => {
    scheduleIdle();
    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
  }, [scheduleIdle]);

  const value = useMemo<AttentionContextValue>(
    () => ({ emit: emitWithContext, currentFocus, lastComplete, idle }),
    [emitWithContext, currentFocus, lastComplete, idle],
  );

  return <AttentionContext.Provider value={value}>{children}</AttentionContext.Provider>;
}

// Null-safe hook — callers outside a provider get an emit that no-ops.
export function useAttention(): AttentionContextValue {
  const ctx = useContext(AttentionContext);
  if (!ctx) {
    return {
      emit: () => {},
      currentFocus: null,
      lastComplete: null,
      idle: false,
    };
  }
  return ctx;
}
