'use client';

// J0FailureModeGrid · INT-1.3
//
// Grid of 10 failure-mode narrative cards rendered on /intelligence's
// J0 cold landing. Mobile collapses to single-column with "Show all 10"
// toggle on the 5 most-cited cards (INT-1.4 hardens the responsive
// behavior; this slice ships the desktop + basic responsive layout).
//
// Per docs/build/intelligence/INT-1_DETAILED_DESIGN.md §4.

import { useEffect, useState } from 'react';
import { J0FailureModeCard } from '@/components/intelligence/J0FailureModeCard';
import {
  J0_FAILURE_MODE_CARDS,
  type FailureModeNarrativeCard,
} from '@/lib/intelligence/j0-failure-mode-cards';

export interface J0FailureModeGridProps {
  /**
   * Cards in canonical order (failureModeId ascending) — defaults to
   * J0_FAILURE_MODE_CARDS but accepting via prop keeps the component
   * pure and testable.
   */
  cards?: ReadonlyArray<FailureModeNarrativeCard>;
}

export function J0FailureModeGrid({
  cards = J0_FAILURE_MODE_CARDS,
}: J0FailureModeGridProps) {
  // Snapshot the page-load timestamp on first render so card click
  // telemetry can compute time-to-click. State (not ref) so the
  // value is safe to read during render and pass down as a prop.
  const [pageLoadedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detail = {
        total_cards: cards.length,
        loaded_at: pageLoadedAt,
      };
      window.dispatchEvent(new CustomEvent('j0_loaded', { detail }));
    }
  }, [cards.length, pageLoadedAt]);

  return (
    <section
      aria-label="Why enterprise AI transformation fails — 10 failure modes"
      data-testid="intelligence-j0-card-grid"
      role="list"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}
    >
      {cards.map((card, idx) => (
        <J0FailureModeCard
          key={card.failureModeId}
          card={card}
          rankInGrid={idx + 1}
          pageLoadedAt={pageLoadedAt}
        />
      ))}
    </section>
  );
}
