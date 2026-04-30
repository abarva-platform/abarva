'use client';

// J0FailureModeCard · INT-1.3
//
// One card in the J0 cold-landing grid on /intelligence. Renders the
// editorial name, oneLineHook, depth signal (pattern + research-anchor
// counts), and an expandable preview on hover/keyboard focus.
//
// Per docs/build/intelligence/INT-1_DETAILED_DESIGN.md §2 + §4.2-4.3.

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  type FailureModeNarrativeCard,
  slugifyEditorialName,
} from '@/lib/intelligence/j0-failure-mode-cards';
import { getCanonicalFailureMode } from '@/lib/intelligence/j0-failure-mode-cards';

export interface J0FailureModeCardProps {
  card: FailureModeNarrativeCard;
  /** Visual position 1..10 — used in click telemetry. */
  rankInGrid: number;
  /** Page-load timestamp; click telemetry computes time-to-click. */
  pageLoadedAt: number;
}

// First two sentences of expandedNarrative — derived for the preview.
function previewFromNarrative(narrative: string): string {
  // Match up to two sentence-enders followed by space or end.
  const match = narrative.match(/^([^.!?]+[.!?])\s+([^.!?]+[.!?])/);
  if (match) return `${match[1]} ${match[2]}`;
  // Fallback to first sentence.
  const single = narrative.match(/^([^.!?]+[.!?])/);
  return single ? single[1] : narrative.slice(0, 200);
}

export function J0FailureModeCard({
  card,
  rankInGrid,
  pageLoadedAt,
}: J0FailureModeCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const hoverStartRef = useRef<number | null>(null);
  const canonical = getCanonicalFailureMode(card);
  const slug = slugifyEditorialName(card.editorialName);
  const preview = previewFromNarrative(card.expandedNarrative);

  const onHoverStart = useCallback(() => {
    hoverStartRef.current = Date.now();
    setPreviewOpen(true);
  }, []);

  const onHoverEnd = useCallback(() => {
    if (hoverStartRef.current !== null) {
      const dwellMs = Date.now() - hoverStartRef.current;
      hoverStartRef.current = null;
      // Telemetry — see INT-1.5 for full PostHog wiring; this is the
      // hook the next sub-slice will tap into.
      if (typeof window !== 'undefined') {
        const detail = {
          failure_mode_id: card.failureModeId,
          editorial_name: card.editorialName,
          dwell_ms: dwellMs,
        };
        window.dispatchEvent(
          new CustomEvent('j0_card_hovered', { detail }),
        );
      }
    }
    setPreviewOpen(false);
  }, [card.failureModeId, card.editorialName]);

  const onClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      const detail = {
        failure_mode_id: card.failureModeId,
        editorial_name: card.editorialName,
        rank_in_grid: rankInGrid,
        time_to_click_ms: Date.now() - pageLoadedAt,
      };
      window.dispatchEvent(new CustomEvent('j0_card_clicked', { detail }));
    }
  }, [card.failureModeId, card.editorialName, rankInGrid, pageLoadedAt]);

  // Honor prefers-reduced-motion via media query. Read the initial
  // value lazily during state init so we don't have to setState
  // inside useEffect (which lint forbids); useEffect only subscribes
  // to subsequent changes.
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (typeof mq.addEventListener !== 'function') return;
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <Link
      href={`/intelligence/failure-modes/${slug}`}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      data-testid={`intelligence-j0-card-${card.failureModeId}`}
      data-state={previewOpen ? 'preview' : 'collapsed'}
      role="listitem"
      aria-label={`${card.editorialName}: ${card.oneLineHook}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: SHELL.CARD_WHITE,
        border: `1px solid ${previewOpen ? SHELL.INK : SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: 16,
        textDecoration: 'none',
        color: SHELL.INK,
        minHeight: 220,
        boxShadow: previewOpen ? '0 2px 6px rgba(12,26,58,0.08)' : 'none',
        transition: reducedMotion
          ? 'none'
          : 'border-color 120ms ease, box-shadow 120ms ease',
        outline: 'none',
      }}
    >
      {/* Canonical name — small mono uppercase */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
          minHeight: 12,
        }}
      >
        #{card.failureModeId} · {canonical.name}
      </div>

      {/* Editorial name — Georgia serif, prominent */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 18,
          fontWeight: 400,
          color: SHELL.INK,
          marginBottom: 8,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}
      >
        {card.editorialName}
      </div>

      {/* One-line hook */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          lineHeight: 1.5,
          marginBottom: 12,
          flex: previewOpen ? '0 0 auto' : '1 1 auto',
        }}
      >
        {card.oneLineHook}
      </div>

      {/* Preview — visible on hover/focus only (or always if no JS) */}
      {previewOpen && (
        <>
          <div
            style={{
              borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              marginBottom: 10,
            }}
            aria-hidden
          />
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_SOFT,
              lineHeight: 1.55,
              margin: 0,
              marginBottom: 12,
              flex: '1 1 auto',
            }}
          >
            {preview}
          </p>
        </>
      )}

      {/* Depth signal + read-more affordance */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.GRAY_TEXT,
          marginTop: 'auto',
        }}
      >
        <span>
          {card.citedPatternIds.length} pattern
          {card.citedPatternIds.length === 1 ? '' : 's'} ·{' '}
          {card.citedResearch.length} anchor
          {card.citedResearch.length === 1 ? '' : 's'}
        </span>
        {previewOpen && (
          <span style={{ color: SHELL.INK }}>Read more →</span>
        )}
      </div>
    </Link>
  );
}
