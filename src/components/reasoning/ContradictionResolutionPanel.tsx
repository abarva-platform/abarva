'use client';

/**
 * ContradictionResolutionPanel — inline view + mark-resolved flow
 *
 * Lists all active `ContradictionDetection` items. Each row renders via
 * `ContradictionDetailCard` with a per-row "Mark resolved" button wired to
 * POST /api/reasoning/contradictions/resolve.
 *
 * Interaction contract:
 * - Clicking "Mark resolved" POSTs `{ contradictionId }` to the resolve route.
 * - On success the item is removed from the local list (optimistic update) and
 *   `onResolved?.(id)` is called so parents can react (e.g. decrement a badge).
 * - On failure an inline "Failed to resolve" message appears for 3 s then clears.
 * - The button is disabled while that row's request is in-flight.
 *
 * Empty state: green check + "No active contradictions".
 */

import { useState, useCallback, useRef } from 'react';
import type { ContradictionDetection } from '@/lib/reasoning/types';
import { ContradictionDetailCard } from '@/components/_shared/ContradictionDetailCard';

export interface ContradictionResolutionPanelProps {
  /** Active (non-resolved) contradictions to display. */
  contradictions: ContradictionDetection[];
  /** Called after a successful resolve with the contradiction id that was resolved. */
  onResolved?: (id: string) => void;
}

type RowState = 'idle' | 'loading' | 'error';

export function ContradictionResolutionPanel({
  contradictions: initialContradictions,
  onResolved,
}: ContradictionResolutionPanelProps) {
  // Local list — items are removed on successful resolution (optimistic update).
  const [items, setItems] = useState<ContradictionDetection[]>(initialContradictions);
  // Per-templateId row state so only the clicked row shows loading / error.
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  // Per-templateId error auto-clear timers stored in a ref to avoid stale closure issues
  // and to prevent triggering re-renders on timer assignment.
  const errorTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const setRowState = useCallback((templateId: string, state: RowState) => {
    setRowStates((prev) => ({ ...prev, [templateId]: state }));
  }, []);

  const handleMarkResolved = useCallback(
    async (contradictionId: string) => {
      // Extract templateId from either `instanceId::templateId` or bare `templateId`
      const templateId = contradictionId.includes('::')
        ? contradictionId.split('::').slice(1).join('::')
        : contradictionId;

      // Clear any existing error timer for this row before starting a new request.
      const existingTimer = errorTimers.current[templateId];
      if (existingTimer !== undefined) {
        clearTimeout(existingTimer);
        delete errorTimers.current[templateId];
      }

      setRowState(templateId, 'loading');

      try {
        const res = await fetch('/api/reasoning/contradictions/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contradictionId }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // Optimistic: remove the resolved item from the list.
        setItems((prev) => prev.filter((c) => c.templateId !== templateId));
        setRowState(templateId, 'idle');
        onResolved?.(contradictionId);
      } catch {
        setRowState(templateId, 'error');
        // Auto-clear error after 3 s
        errorTimers.current[templateId] = setTimeout(() => {
          setRowState(templateId, 'idle');
          delete errorTimers.current[templateId];
        }, 3000);
      }
    },
    [setRowState, onResolved],
  );

  if (items.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '16px 20px',
          fontFamily: '"Inter", "Inter", system-ui, -apple-system, sans-serif',
          fontSize: 14,
          color: '#1B5E20',
          background: '#E8F5E8',
          border: '1px solid #c2d6bf',
          borderRadius: 8,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 18 }}>✅</span>
        No active contradictions
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((contradiction) => {
        const state: RowState = rowStates[contradiction.templateId] ?? 'idle';

        return (
          <div
            key={contradiction.templateId}
            style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            {/*
             * ContradictionDetailCard already renders the "Mark resolved" ghost button
             * when `onMarkResolved` is supplied. We pass a wrapper that also tracks
             * per-row loading / error state.
             *
             * The card's own button fires `onMarkResolved(resolutionId)` where
             * resolutionId = `${instanceId}::${templateId}` (or bare templateId when
             * instanceId is absent). We forward that directly to our handler.
             */}
            <div style={{ position: 'relative', opacity: state === 'loading' ? 0.6 : 1 }}>
              <ContradictionDetailCard
                contradictions={[contradiction]}
                onMarkResolved={state === 'loading' ? undefined : handleMarkResolved}
              />
            </div>
            {state === 'error' && (
              <div
                role="alert"
                style={{
                  fontFamily: '"Inter", "Inter", system-ui, -apple-system, sans-serif',
                  fontSize: 12,
                  color: '#8B1F0F',
                  background: '#FFE6E1',
                  border: '1px solid #f5c0b8',
                  borderRadius: 6,
                  padding: '6px 12px',
                  marginTop: -4,
                }}
              >
                Failed to resolve — please try again.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
