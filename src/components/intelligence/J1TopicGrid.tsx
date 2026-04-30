'use client';

// J1TopicGrid · INT-2.3
//
// Grid of 10 thesis-led topic cards rendered on /intelligence/topics.
// Mirrors the J0FailureModeGrid pattern (responsive auto-fit grid +
// page-load telemetry + role="list" semantics) but without the
// mobile collapse — topics are larger and reading 10 single-column
// on mobile is acceptable (each card is ~240px tall).
//
// Per docs/build/intelligence/INT-2_DETAILED_DESIGN.md §4.1.

import { useEffect, useState } from 'react';
import { J1TopicCard } from '@/components/intelligence/J1TopicCard';
import {
  J1_TOPICS,
  type TopicEntry,
} from '@/lib/intelligence/j1-topics';

export interface J1TopicGridProps {
  /** Topics in canonical registry order. */
  topics?: ReadonlyArray<TopicEntry>;
}

export function J1TopicGrid({ topics = J1_TOPICS }: J1TopicGridProps) {
  const [pageLoadedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detail = {
      topic_count: topics.length,
      loaded_at: pageLoadedAt,
    };
    window.dispatchEvent(new CustomEvent('j1_topics_loaded', { detail }));
  }, [topics.length, pageLoadedAt]);

  return (
    <section
      aria-label="AI transformation topics"
      data-testid="intelligence-j1-topics-grid"
      role="list"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}
    >
      {topics.map((topic, idx) => (
        <J1TopicCard
          key={topic.topicId}
          topic={topic}
          rankInGrid={idx + 1}
          pageLoadedAt={pageLoadedAt}
        />
      ))}
    </section>
  );
}
