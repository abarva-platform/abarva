'use client';

// J1TopicCard · INT-2.3
//
// One topic card on the /intelligence/topics grid. Renders the
// title (Cormorant Garamond serif), thesis (DM Sans body, 2-4
// sentences shown in full — no hover-expand), and depth signal
// (pattern + failure-mode + archetype counts). Clicking navigates
// to /intelligence/topics/<topicId> and emits a `j1_topic_clicked`
// CustomEvent for the J1 telemetry bridge.

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { TopicEntry } from '@/lib/intelligence/j1-topics';

export interface J1TopicCardProps {
  topic: TopicEntry;
  /** Visual position 1..10 — used in click telemetry. */
  rankInGrid: number;
  /** Page-load timestamp; click telemetry computes time-to-click. */
  pageLoadedAt: number;
}

export function J1TopicCard({
  topic,
  rankInGrid,
  pageLoadedAt,
}: J1TopicCardProps) {
  // Honor prefers-reduced-motion via media query — initial value
  // only; subscription omitted because the card has no
  // animated transitions other than the border/shadow on hover.
  // The initial snapshot is sufficient for static styling.
  const [reducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const onClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      const detail = {
        topic_id: topic.topicId,
        topic_title: topic.title,
        rank_in_grid: rankInGrid,
        time_to_click_ms: Date.now() - pageLoadedAt,
      };
      window.dispatchEvent(new CustomEvent('j1_topic_clicked', { detail }));
    }
  }, [topic.topicId, topic.title, rankInGrid, pageLoadedAt]);

  return (
    <Link
      href={`/intelligence/topics/${topic.topicId}`}
      onClick={onClick}
      data-testid={`intelligence-j1-topic-card-${topic.topicId}`}
      role="listitem"
      aria-label={`${topic.title}: ${topic.thesis}`}
      className="j1-topic-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: 18,
        textDecoration: 'none',
        color: SHELL.INK,
        minHeight: 240,
        transition: reducedMotion
          ? 'none'
          : 'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
        outline: 'none',
      }}
    >
      {/* Title — Cormorant Garamond serif */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 21,
          fontWeight: 400,
          color: SHELL.INK,
          marginBottom: 12,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}
      >
        {topic.title}
      </div>

      {/* Thesis — sans body, full text */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          lineHeight: 1.55,
          margin: 0,
          marginBottom: 16,
          flex: '1 1 auto',
        }}
      >
        {topic.thesis}
      </p>

      {/* Depth signal — pattern + FM + archetype counts */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.GRAY_TEXT,
          marginTop: 'auto',
          flexWrap: 'wrap',
          letterSpacing: '0.04em',
        }}
      >
        <span>
          {topic.associatedPatternIds.length} pattern
          {topic.associatedPatternIds.length === 1 ? '' : 's'}
        </span>
        {topic.associatedFailureModeIds.length > 0 && (
          <>
            <span>·</span>
            <span>
              {topic.associatedFailureModeIds.length} failure mode
              {topic.associatedFailureModeIds.length === 1 ? '' : 's'}
            </span>
          </>
        )}
        <span>·</span>
        <span>
          {topic.exampleProgramArchetypes.length} archetype
          {topic.exampleProgramArchetypes.length === 1 ? '' : 's'}
        </span>
      </div>
    </Link>
  );
}
