// Source Decision Queue — typed contracts (Practitioner-Fit §3.2).
//
// The Decision Queue re-fronts the Source surface as a triggered decision OS:
// instead of "start a workflow", it shows "here is what needs your decision
// today". Each item is a `SourceDecisionItem` produced by a pure detector
// over already-shipped substrate (`vendor_contracts`, `it_financials`, the
// freshness model). No fabrication — a detector emits an item only when it
// has real grounding.
//
// Pure types only: no DB, no network, no React.

/**
 * The Phase-1 detector kinds — the triggers computable from existing data
 * per the spec's §3.1 table. Phase-2 kinds (vendor escalation, fast-track
 * request) arrive with the connector roadmap and are intentionally absent.
 */
export type DecisionTriggerKind =
  /** A contract term-end is bearing down. */
  | 'renewal'
  /** The notice-to-cancel window for an auto-renewing contract is closing. */
  | 'notice_window'
  /** Two contracts cover overlapping capability — consolidation candidate. */
  | 'overlap_shelfware'
  /** A contract's spend materially exceeds a defensible benchmark. */
  | 'savings_opportunity'
  /** A decision is blocked because backing context is stale / missing. */
  | 'blocked_missing_evidence';

/**
 * Urgency band. Drives the primary queue sort; within a band, items sort by
 * value-at-stake. `watch` items are surfaced but not pressing.
 */
export type DecisionUrgency = 'today' | 'this_week' | 'this_month' | 'watch';

/** Numeric ordering for urgency — lower is more urgent. */
export const URGENCY_ORDER: Record<DecisionUrgency, number> = {
  today: 0,
  this_week: 1,
  this_month: 2,
  watch: 3,
};

/**
 * One typed decision card. Mirrors the `DecisionTrigger` contract in §3.2 of
 * `docs/strategy/PRACTITIONER-FIT-DESIGN.md`, with the field names aligned to
 * the AbarVa house style (`itemId`, `clientKey`).
 */
export interface SourceDecisionItem {
  /** Stable, deterministic id — derived from kind + the evidence anchor. */
  itemId: string;
  /** Tenant client key (e.g. `apexretail`). */
  clientKey: string;
  kind: DecisionTriggerKind;
  urgency: DecisionUrgency;
  /** The single-line headline — "Adobe contract auto-renews in 11 days". */
  headline: string;
  /** One line of expert framing — why this is worth the VP's attention. */
  whyItMatters: string;
  /** The recommended next move, phrased as an imperative. */
  recommendedAction: string;
  /** Deep-link into the pre-loaded workflow (the Renewal Cockpit etc.). */
  deepLink: string;
  /** Provenance — contract ids, segment ids, financial record ids. */
  evidenceRefs: string[];
  /**
   * Value at stake in USD, used as the secondary sort key. `null` when the
   * detector cannot quantify it — such items sort last within their band.
   */
  valueAtStakeUsd: number | null;
  /** ISO timestamp the detector surfaced this item. */
  surfacedAt: string;
}

/**
 * The assembled queue. `items` are pre-sorted (urgency, then value-at-stake).
 * When `items` is empty the queue is *never silent* — `emptyState` carries a
 * plain-language explanation the surface renders instead of a blank.
 */
export interface SourceDecisionQueue {
  clientKey: string;
  generatedAt: string;
  items: SourceDecisionItem[];
  /** Count by urgency band — drives the queue header summary. */
  bandCounts: Record<DecisionUrgency, number>;
  /**
   * Present only when `items` is empty. A founder-readable line such as
   * "No renewals, notice windows or spend flags in the next 90 days."
   */
  emptyState: string | null;
}
