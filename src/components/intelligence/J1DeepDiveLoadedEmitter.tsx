'use client';

// J1DeepDiveLoadedEmitter · INT-2.6
//
// No-render client island that emits a `j1_topic_deep_dive_loaded`
// CustomEvent on mount. Pages that own the deep-dive surface
// (topic deep-dive, failure-mode page) mount this so the
// J1TelemetryBridge can pick up the event and forward to PostHog.

import { useEffect } from 'react';

export interface J1DeepDiveLoadedEmitterProps {
  topicId: string;
}

export function J1DeepDiveLoadedEmitter({ topicId }: J1DeepDiveLoadedEmitterProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detail = { topic_id: topicId, loaded_at: Date.now() };
    window.dispatchEvent(
      new CustomEvent('j1_topic_deep_dive_loaded', { detail }),
    );
  }, [topicId]);
  return null;
}
