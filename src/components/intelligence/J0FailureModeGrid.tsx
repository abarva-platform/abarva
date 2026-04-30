'use client';

// J0FailureModeGrid · INT-1.3 (initial) → INT-1.4 (mobile + a11y)
//
// Grid of 10 failure-mode narrative cards rendered on /intelligence's
// J0 cold landing.
//
// INT-1.4 hardening:
//   - Mobile viewport (<768px) shows the 5 most-cited cards by default
//     with a "Show all 10 →" toggle that reveals the remaining 5.
//   - Cards 6-10 are hydrated server-side AND in the DOM at all times
//     so users without JS see all 10 (FR-006). The toggle is
//     JS-driven; CSS hides cards 6-10 only when JS has applied the
//     `data-show-all="false"` attribute.
//   - Toggle is keyboard-focusable, has aria-expanded + aria-controls,
//     and respects prefers-reduced-motion (no slide-down transition).
//
// Per docs/build/intelligence/INT-1_DETAILED_DESIGN.md §2.5 + §4.

import { useEffect, useMemo, useState } from 'react';
import { J0FailureModeCard } from '@/components/intelligence/J0FailureModeCard';
import {
  J0_FAILURE_MODE_CARDS,
  getCardsByMostCited,
  type FailureModeNarrativeCard,
} from '@/lib/intelligence/j0-failure-mode-cards';
import { SHELL } from '@/lib/shell/shell-tokens';

const MOBILE_BREAKPOINT_PX = 767;
const MOBILE_TOP_N = 5;
const HIDDEN_CARDS_CONTAINER_ID = 'intelligence-j0-cards-overflow';

export interface J0FailureModeGridProps {
  /** Cards in canonical order (failureModeId ascending). */
  cards?: ReadonlyArray<FailureModeNarrativeCard>;
}

export function J0FailureModeGrid({
  cards = J0_FAILURE_MODE_CARDS,
}: J0FailureModeGridProps) {
  const [pageLoadedAt] = useState<number>(() => Date.now());
  const [showAll, setShowAll] = useState<boolean>(false);

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    if (typeof mq.addEventListener !== 'function') return;
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Snapshot top-N for the mobile collapsed state. Memoized because
  // `getCardsByMostCited` allocates a new array.
  const mobileTopFiveIds = useMemo(
    () =>
      new Set(
        getCardsByMostCited(cards, MOBILE_TOP_N).map((c) => c.failureModeId),
      ),
    [cards],
  );

  // Telemetry — page-load event.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detail = {
      total_cards: cards.length,
      loaded_at: pageLoadedAt,
    };
    window.dispatchEvent(new CustomEvent('j0_loaded', { detail }));
  }, [cards.length, pageLoadedAt]);

  function handleShowAllClick() {
    setShowAll(true);
    if (typeof window !== 'undefined') {
      const detail = {
        time_to_click_ms: Date.now() - pageLoadedAt,
        viewport_width: window.innerWidth,
      };
      window.dispatchEvent(
        new CustomEvent('j0_show_all_clicked', { detail }),
      );
    }
  }

  // When JS is unavailable, isMobile is `false` and showAll is `false`,
  // so all cards render via the normal path. The mobile-collapse
  // behavior only kicks in once JS has hydrated AND viewport is
  // mobile-width.
  const collapsedOnMobile = isMobile && !showAll;

  return (
    <>
      <section
        aria-label="Why enterprise AI transformation fails — 10 failure modes"
        data-testid="intelligence-j0-card-grid"
        data-show-all={showAll || !isMobile ? 'true' : 'false'}
        role="list"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: collapsedOnMobile ? 16 : 24,
        }}
      >
        {cards.map((card, idx) => {
          const isInTopFive = mobileTopFiveIds.has(card.failureModeId);
          const hidden = collapsedOnMobile && !isInTopFive;
          return (
            <div
              key={card.failureModeId}
              role="presentation"
              style={{
                display: hidden ? 'none' : 'contents',
              }}
              {...(hidden ? { 'aria-hidden': true } : {})}
            >
              <J0FailureModeCard
                card={card}
                rankInGrid={idx + 1}
                pageLoadedAt={pageLoadedAt}
              />
            </div>
          );
        })}
      </section>

      {/* Mobile-only "Show all 10 →" affordance. Hidden via display
          when not on mobile or when already expanded. The container
          ID is referenced from aria-controls on the button. */}
      {collapsedOnMobile && (
        <div
          id={HIDDEN_CARDS_CONTAINER_ID}
          data-testid="intelligence-j0-show-all-wrap"
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            data-testid="intelligence-j0-show-all"
            onClick={handleShowAllClick}
            aria-expanded={showAll}
            aria-controls={HIDDEN_CARDS_CONTAINER_ID}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: SHELL.INK,
              background: 'transparent',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 6,
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            Show all {cards.length} →
          </button>
        </div>
      )}
    </>
  );
}
