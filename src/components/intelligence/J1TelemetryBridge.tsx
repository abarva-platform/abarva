'use client';

// J1TelemetryBridge · INT-2.6
//
// Client island that listens for J1 CustomEvents dispatched by
// J1TopicGrid + J1TopicCard (and topic deep-dive / failure-mode
// pages once they wire click telemetry) and forwards each to
// PostHog via posthog-js. Mirrors the J0TelemetryBridge pattern.
//
// Per docs/build/intelligence/INT-2_DETAILED_DESIGN.md §2.6
// FR-050..056.
//
// PostHog payloads are PII-free — no user email, no synthesis text.
// Tenant key is included only when authenticated.

import { useEffect } from 'react';
import posthog from 'posthog-js';

interface J1TopicsLoadedDetail {
  topic_count: number;
  loaded_at: number;
}

interface J1TopicClickedDetail {
  topic_id: string;
  topic_title: string;
  rank_in_grid: number;
  time_to_click_ms: number;
}

interface J1TopicDeepDiveLoadedDetail {
  topic_id: string;
  loaded_at: number;
}

interface J1TopicPatternClickedDetail {
  topic_id: string;
  pattern_id: string;
}

interface J1TopicFailureModeClickedDetail {
  topic_id: string;
  failure_mode_id: number;
}

interface J1TopicOpenSentinelClickedDetail {
  topic_id: string;
  time_to_click_ms: number;
}

interface J1FailureModeRelatedTopicClickedDetail {
  failure_mode_id: number;
  topic_id: string;
}

export interface J1TelemetryBridgeProps {
  tenantKey: string | null;
  visitorType: 'cold' | 'authenticated';
  /**
   * Surface key for the page hosting the bridge. Used in event
   * properties so PostHog can segment "topics grid loaded" vs
   * "topic deep-dive loaded".
   */
  surface: 'topics_grid' | 'topic_deep_dive' | 'failure_mode_page';
}

export function J1TelemetryBridge({
  tenantKey,
  visitorType,
  surface,
}: J1TelemetryBridgeProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onTopicsLoaded = (e: Event) => {
      const detail = (e as CustomEvent<J1TopicsLoadedDetail>).detail;
      posthog.capture('j1_topics_loaded', {
        visitor_type: visitorType,
        tenant_key: tenantKey,
        surface,
        topic_count: detail?.topic_count,
      });
    };

    const onTopicClicked = (e: Event) => {
      const detail = (e as CustomEvent<J1TopicClickedDetail>).detail;
      if (!detail) return;
      posthog.capture('j1_topic_clicked', {
        topic_id: detail.topic_id,
        topic_title: detail.topic_title,
        rank_in_grid: detail.rank_in_grid,
        time_to_click_ms: detail.time_to_click_ms,
        tenant_key: tenantKey,
        surface,
      });
    };

    const onDeepDiveLoaded = (e: Event) => {
      const detail = (e as CustomEvent<J1TopicDeepDiveLoadedDetail>).detail;
      if (!detail) return;
      posthog.capture('j1_topic_deep_dive_loaded', {
        topic_id: detail.topic_id,
        visitor_type: visitorType,
        tenant_key: tenantKey,
      });
    };

    const onPatternClicked = (e: Event) => {
      const detail = (e as CustomEvent<J1TopicPatternClickedDetail>).detail;
      if (!detail) return;
      posthog.capture('j1_topic_pattern_clicked', {
        topic_id: detail.topic_id,
        pattern_id: detail.pattern_id,
        tenant_key: tenantKey,
      });
    };

    const onFailureModeClicked = (e: Event) => {
      const detail = (e as CustomEvent<J1TopicFailureModeClickedDetail>).detail;
      if (!detail) return;
      posthog.capture('j1_topic_failure_mode_clicked', {
        topic_id: detail.topic_id,
        failure_mode_id: detail.failure_mode_id,
        tenant_key: tenantKey,
      });
    };

    const onOpenSentinel = (e: Event) => {
      const detail = (e as CustomEvent<J1TopicOpenSentinelClickedDetail>)
        .detail;
      if (!detail) return;
      posthog.capture('j1_topic_open_sentinel_clicked', {
        topic_id: detail.topic_id,
        time_to_click_ms: detail.time_to_click_ms,
        tenant_key: tenantKey,
      });
    };

    const onRelatedTopic = (e: Event) => {
      const detail = (e as CustomEvent<J1FailureModeRelatedTopicClickedDetail>)
        .detail;
      if (!detail) return;
      posthog.capture('j1_failure_mode_topic_clicked', {
        failure_mode_id: detail.failure_mode_id,
        topic_id: detail.topic_id,
        tenant_key: tenantKey,
      });
    };

    window.addEventListener('j1_topics_loaded', onTopicsLoaded);
    window.addEventListener('j1_topic_clicked', onTopicClicked);
    window.addEventListener('j1_topic_deep_dive_loaded', onDeepDiveLoaded);
    window.addEventListener('j1_topic_pattern_clicked', onPatternClicked);
    window.addEventListener(
      'j1_topic_failure_mode_clicked',
      onFailureModeClicked,
    );
    window.addEventListener(
      'j1_topic_open_sentinel_clicked',
      onOpenSentinel,
    );
    window.addEventListener(
      'j1_failure_mode_topic_clicked',
      onRelatedTopic,
    );
    return () => {
      window.removeEventListener('j1_topics_loaded', onTopicsLoaded);
      window.removeEventListener('j1_topic_clicked', onTopicClicked);
      window.removeEventListener('j1_topic_deep_dive_loaded', onDeepDiveLoaded);
      window.removeEventListener('j1_topic_pattern_clicked', onPatternClicked);
      window.removeEventListener(
        'j1_topic_failure_mode_clicked',
        onFailureModeClicked,
      );
      window.removeEventListener(
        'j1_topic_open_sentinel_clicked',
        onOpenSentinel,
      );
      window.removeEventListener(
        'j1_failure_mode_topic_clicked',
        onRelatedTopic,
      );
    };
  }, [tenantKey, visitorType, surface]);

  return null;
}
