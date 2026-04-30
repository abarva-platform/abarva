'use client';

// J0TelemetryBridge · INT-1.5
//
// Client island that listens for J0 CustomEvents dispatched by
// J0FailureModeGrid + J0FailureModeCard + J0AffordanceLink and
// forwards each to PostHog via posthog-js. Keeps the J0 components
// PostHog-free (they just dispatch DOM CustomEvents); the bridge
// owns the analytics integration and can be removed in tests by
// not mounting it.
//
// Per docs/build/intelligence/INT-1_DETAILED_DESIGN.md §2.6
// FR-050..054 + §7.5 (j0_show_all_clicked).
//
// PostHog payloads are PII-free — no user email, no synthesis text.
// Tenant key is included only when authenticated (tenant resolution
// is server-side; the page-load event passes it via prop here).

import { useEffect } from 'react';
import posthog from 'posthog-js';

interface J0LoadedDetail {
  total_cards: number;
  loaded_at: number;
}

interface J0CardHoveredDetail {
  failure_mode_id: number;
  editorial_name: string;
  dwell_ms: number;
}

interface J0CardClickedDetail {
  failure_mode_id: number;
  editorial_name: string;
  rank_in_grid: number;
  time_to_click_ms: number;
}

interface J0ShowAllClickedDetail {
  time_to_click_ms: number;
  viewport_width: number;
}

interface J0AffordanceClickedDetail {
  affordance: 'browse_topics' | 'open_sentinel';
  time_to_click_ms: number;
}

export interface J0TelemetryBridgeProps {
  /**
   * Tenant key when authenticated; null for cold visitors. Page-load
   * event includes this so PostHog can segment by tenant. No other
   * tenant fields are forwarded.
   */
  tenantKey: string | null;
  /** Visitor type — cold or authenticated. */
  visitorType: 'cold' | 'authenticated';
  /** Stamp from the registry, included in j0_loaded. */
  corpusVersion: string;
  /** Total pattern count, included in j0_loaded. */
  totalPatterns: number;
  /** Total research-anchor count, included in j0_loaded. */
  totalResearchAnchors: number;
}

export function J0TelemetryBridge({
  tenantKey,
  visitorType,
  corpusVersion,
  totalPatterns,
  totalResearchAnchors,
}: J0TelemetryBridgeProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Hover dwell debouncing — PostHog ingest cost is real; flickering
    // hovers can spam events. We only forward hovers with dwell ≥ 250ms,
    // matching the design doc §7.2 step 8.
    const HOVER_MIN_DWELL_MS = 250;

    const onLoaded = (e: Event) => {
      const detail = (e as CustomEvent<J0LoadedDetail>).detail;
      posthog.capture('j0_loaded', {
        visitor_type: visitorType,
        tenant_key: tenantKey,
        corpus_version: corpusVersion,
        total_cards: detail?.total_cards,
        total_patterns: totalPatterns,
        total_research_anchors: totalResearchAnchors,
      });
    };

    const onCardHovered = (e: Event) => {
      const detail = (e as CustomEvent<J0CardHoveredDetail>).detail;
      if (!detail || detail.dwell_ms < HOVER_MIN_DWELL_MS) return;
      posthog.capture('j0_card_hovered', {
        failure_mode_id: detail.failure_mode_id,
        editorial_name: detail.editorial_name,
        dwell_ms: detail.dwell_ms,
        tenant_key: tenantKey,
      });
    };

    const onCardClicked = (e: Event) => {
      const detail = (e as CustomEvent<J0CardClickedDetail>).detail;
      if (!detail) return;
      posthog.capture('j0_card_clicked', {
        failure_mode_id: detail.failure_mode_id,
        editorial_name: detail.editorial_name,
        rank_in_grid: detail.rank_in_grid,
        time_to_click_ms: detail.time_to_click_ms,
        tenant_key: tenantKey,
      });
    };

    const onShowAllClicked = (e: Event) => {
      const detail = (e as CustomEvent<J0ShowAllClickedDetail>).detail;
      if (!detail) return;
      posthog.capture('j0_show_all_clicked', {
        time_to_click_ms: detail.time_to_click_ms,
        viewport_width: detail.viewport_width,
        tenant_key: tenantKey,
      });
    };

    const onAffordanceClicked = (e: Event) => {
      const detail = (e as CustomEvent<J0AffordanceClickedDetail>).detail;
      if (!detail) return;
      const eventName =
        detail.affordance === 'browse_topics'
          ? 'j0_browse_topics_clicked'
          : 'j0_open_sentinel_clicked';
      posthog.capture(eventName, {
        time_to_click_ms: detail.time_to_click_ms,
        tenant_key: tenantKey,
      });
    };

    window.addEventListener('j0_loaded', onLoaded);
    window.addEventListener('j0_card_hovered', onCardHovered);
    window.addEventListener('j0_card_clicked', onCardClicked);
    window.addEventListener('j0_show_all_clicked', onShowAllClicked);
    window.addEventListener('j0_affordance_clicked', onAffordanceClicked);
    return () => {
      window.removeEventListener('j0_loaded', onLoaded);
      window.removeEventListener('j0_card_hovered', onCardHovered);
      window.removeEventListener('j0_card_clicked', onCardClicked);
      window.removeEventListener('j0_show_all_clicked', onShowAllClicked);
      window.removeEventListener('j0_affordance_clicked', onAffordanceClicked);
    };
  }, [tenantKey, visitorType, corpusVersion, totalPatterns, totalResearchAnchors]);

  return null;
}
