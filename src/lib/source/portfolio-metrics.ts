// Canonical Source portfolio metrics — ONE computation, consumed everywhere.
//
// Why this module exists (audit 2026-06-03, Tier 0):
// The same Apex tenant reported different headline numbers on different
// surfaces — the Events surface showed 3 events / $74.0M, while the Portfolio
// surface showed 2 events / $39.0M. Root cause: each surface filtered and
// summed the raw `SourcingEventSummary[]` its own way. The Portfolio page ran
// `dedupeByEventCode(filterOutTestArtifacts(events))` and excluded completed
// events from value; the Events page summed *all* raw events with no dedupe and
// no test-artifact filter.
//
// A CXO who sees two different portfolio values one click apart stops trusting
// both. So every surface that shows a portfolio count or value MUST go through
// this module: it selects the canonical visible set once, then computes the
// canonical KPIs once. There is no second way to count Source events.
//
// Pure — no React, no data plane. See reports/2026-06-03-source-simplicity-audit/.

import type { SourcingEventSummary } from './types';
import {
  computePortfolioKpis,
  dedupeByEventCode,
  filterOutTestArtifacts,
  type PortfolioKpis,
} from './portfolio-filtering';

/**
 * The canonical, de-duplicated, test-artifact-free set of events a tenant's
 * Source surfaces are allowed to show. Every count, table, and scorecard reads
 * from this — never from the raw `listSourcingEvents()` array directly.
 *
 * Idempotent: `selectVisibleSourceEvents(selectVisibleSourceEvents(x))` equals
 * `selectVisibleSourceEvents(x)`.
 */
export function selectVisibleSourceEvents(
  raw: SourcingEventSummary[],
): SourcingEventSummary[] {
  return dedupeByEventCode(filterOutTestArtifacts(raw));
}

/**
 * The canonical portfolio metric set surfaced to executives. Field names match
 * the CXO Bible's scorecard: Open value · At-risk · Active · Waiting · Oldest
 * stage age. Extends {@link PortfolioKpis} (the shared math core) with the two
 * fields the headline scorecards also need.
 */
export interface SourcePortfolioMetrics extends PortfolioKpis {
  /** Alias of `valueAtStakeUsd` — the executive-facing "Open value" label. */
  openValueUsd: number;
  /** Oldest stage age in days across the visible, non-completed events. */
  oldestStageAgeDays: number;
}

export interface SourcePortfolioSnapshot {
  /** The canonical visible event set (filtered + deduped). */
  visibleEvents: SourcingEventSummary[];
  /** The canonical metrics computed from `visibleEvents`. */
  metrics: SourcePortfolioMetrics;
}

/**
 * THE Source portfolio computation. Pass the raw events from
 * `listSourcingEvents()`; receive the canonical visible set and the canonical
 * metrics. Use this on the Decision Queue, the Portfolio table, the Events
 * surface, and the event-canvas context strip so they can never disagree.
 */
export function computeSourcePortfolioMetrics(
  raw: SourcingEventSummary[],
): SourcePortfolioSnapshot {
  const visibleEvents = selectVisibleSourceEvents(raw);
  const kpis = computePortfolioKpis(visibleEvents);

  let oldestStageAgeDays = 0;
  for (const event of visibleEvents) {
    if (event.status === 'completed' || event.status === 'archived') continue;
    const aging = Math.max(0, event.agingDays | 0);
    if (aging > oldestStageAgeDays) oldestStageAgeDays = aging;
  }

  return {
    visibleEvents,
    metrics: {
      ...kpis,
      openValueUsd: kpis.valueAtStakeUsd,
      oldestStageAgeDays,
    },
  };
}
