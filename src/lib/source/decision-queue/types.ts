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
 *
 * The bands are truthful, calendar-anchored windows — the usability review
 * found the old `this_week` label firing on 26-day-out renewals, which eroded
 * trust. The thresholds (see `urgencyFromDays`) match these labels exactly:
 *   due_now      — overdue or within 0 days
 *   next_14_days — 1..14 days out
 *   next_45_days — 15..45 days out
 *   next_90_days — 46..90 days out
 *   watch        — beyond 90 days (still surfaced, not pressing)
 */
export type DecisionUrgency =
  | 'due_now'
  | 'next_14_days'
  | 'next_45_days'
  | 'next_90_days'
  | 'watch';

/** Numeric ordering for urgency — lower is more urgent. */
export const URGENCY_ORDER: Record<DecisionUrgency, number> = {
  due_now: 0,
  next_14_days: 1,
  next_45_days: 2,
  next_90_days: 3,
  watch: 4,
};

/** Human-readable band labels — truthful, calendar-anchored. */
export const URGENCY_LABEL: Record<DecisionUrgency, string> = {
  due_now: 'Due now',
  next_14_days: 'Next 14 days',
  next_45_days: 'Next 45 days',
  next_90_days: 'Next 90 days',
  watch: 'Watch',
};

/** Band order, most urgent first — shared by the assembler and the surface. */
export const BAND_ORDER: DecisionUrgency[] = [
  'due_now',
  'next_14_days',
  'next_45_days',
  'next_90_days',
  'watch',
];

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
 * One sub-issue inside a bundled decision card. A `SourceDecisionItem` (a raw
 * detector hit) becomes a sub-issue when it is folded into the contract's
 * bundle — the usability review asked for ONE decision per contract, not a
 * renewal card + a notice-window card + a savings card competing for the same
 * VP attention. Detectors stay; they become contributors, not separate cards.
 */
export interface DecisionSubIssue {
  /** The detector kind that produced this sub-issue. */
  kind: DecisionTriggerKind;
  /** Short, grounded label — "Notice window closing", "12% above benchmark". */
  label: string;
  /** One line of expert framing for this specific contributor. */
  detail: string;
  /** Value at stake for this sub-issue alone. `null` when unquantified. */
  valueAtStakeUsd: number | null;
  /** Provenance for this sub-issue. */
  evidenceRefs: string[];
}

/** A coarse posture hint surfaced in the bundle headline. */
export type DecisionPosture =
  | 'renegotiate'
  | 'consolidate'
  | 'right_size'
  | 'review'
  | 'unblock';

/**
 * One bundled decision card — the unit the VP acts on. All sub-issues that
 * concern the SAME contract/vendor decision live inside one card. The headline
 * reads like "ServiceNow renewal · notice due in 13 days · $690K · posture:
 * renegotiate". Non-contract bundles (a blocked-evidence gap) carry `null`
 * `contractId` and bundle on the gap itself.
 */
export interface SourceDecisionBundle {
  /** Stable, deterministic id — `bundle:<contractId>` or the gap anchor. */
  bundleId: string;
  clientKey: string;
  /** The contract this bundle decides on. `null` for non-contract bundles. */
  contractId: string | null;
  /** Vendor / subject name for the headline. */
  vendorName: string;
  /** The most-urgent band across all sub-issues — drives sort + grouping. */
  urgency: DecisionUrgency;
  /** The composed headline line. */
  headline: string;
  /** One-line expert summary spanning the whole bundle. */
  summary: string;
  /** Coarse posture hint for the headline chip. */
  posture: DecisionPosture;
  /** The recommended next move, phrased as an imperative. */
  recommendedAction: string;
  /** Deep-link into the pre-loaded workflow (the Renewal Cockpit etc.). */
  deepLink: string;
  /** The grounded sub-issues — never fabricated, only real detector hits. */
  subIssues: DecisionSubIssue[];
  /** Union of every sub-issue's evidence refs, de-duplicated. */
  evidenceRefs: string[];
  /** Total value at stake — the max of quantified sub-issues, not a sum. */
  valueAtStakeUsd: number | null;
  /** ISO timestamp the bundle was assembled. */
  surfacedAt: string;
}

/**
 * The assembled queue. `bundles` are pre-sorted (urgency, then value-at-stake).
 * When `bundles` is empty the queue is *never silent* — `emptyState` carries a
 * plain-language explanation the surface renders instead of a blank.
 */
export interface SourceDecisionQueue {
  clientKey: string;
  generatedAt: string;
  /** One bundled card per contract/vendor decision (Practitioner-Fit FIX 2). */
  bundles: SourceDecisionBundle[];
  /** Count by urgency band — drives the queue header summary. */
  bandCounts: Record<DecisionUrgency, number>;
  /**
   * Present only when `bundles` is empty. A founder-readable line such as
   * "No renewals, notice windows or spend flags in the next 90 days."
   */
  emptyState: string | null;
}
