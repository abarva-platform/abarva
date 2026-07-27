/**
 * Canonical governance state enums for the Home / Knowledge vNext consumption layer.
 *
 * SOURCE OF TRUTH: the merged Phase 3C-2D contract package
 *   clients/shared/20-phase3c2d-consumption-contracts/
 *     - PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md   (availability states)
 *     - CONSUMPTION_OBJECT_AND_FIELD_CONTRACT.xlsx  (authority/freshness/availability enums)
 *
 * These enums are transcribed from those artifacts and must not be extended,
 * renamed, or reordered without a corresponding contract amendment. UI-only
 * states are forbidden — a value the contract does not define must never render.
 *
 * DELIBERATE RECONCILIATION: the front-end brief's example envelope used
 * `freshnessState: "current" | "aging" | "stale"`. The merged
 * CONSUMPTION_OBJECT_AND_FIELD_CONTRACT enumerates `freshness_state` as
 * `fresh | stale | not_loaded | not_applicable`, and the contract governs data
 * shape. We therefore use the contract enum. See docs/knowledge-vnext gap register.
 */

/** Allowed availability states — PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md */
export const AVAILABILITY_STATES = [
  "available",
  "not_loaded",
  "not_measured",
  "withheld",
  "conflicting",
  "stale",
  "candidate",
  "accepted",
  "superseded",
  "not_applicable",
] as const;
export type AvailabilityState = (typeof AVAILABILITY_STATES)[number];

/** Allowed authority states — CONSUMPTION_OBJECT_AND_FIELD_CONTRACT (authority_state enum) */
export const AUTHORITY_STATES = [
  "candidate",
  "accepted",
  "published",
  "retired",
  "superseded",
] as const;
export type AuthorityState = (typeof AUTHORITY_STATES)[number];

/** Allowed freshness states — CONSUMPTION_OBJECT_AND_FIELD_CONTRACT (freshness_state enum) */
export const FRESHNESS_STATES = [
  "fresh",
  "stale",
  "not_loaded",
  "not_applicable",
] as const;
export type FreshnessState = (typeof FRESHNESS_STATES)[number];

/**
 * Content classes the prototype deliberately distinguishes. A leadership quote
 * must never render as an accepted fact; a candidate must never render as
 * published; a target must never render as a current-state value.
 *
 * SOURCE: AbarVa Knowledge HTML design contract (content-class treatment).
 */
export const CONTENT_CLASSES = [
  "accepted_fact",
  "leadership_perspective",
  "abarva_interpretation",
  "industry_benchmark",
  "industry_pattern",
  "candidate_insight",
  "evidence_gap",
  "approved_target",
  "proposed_target",
] as const;
export type ContentClass = (typeof CONTENT_CLASSES)[number];

const AVAILABILITY_SET = new Set<string>(AVAILABILITY_STATES);
const AUTHORITY_SET = new Set<string>(AUTHORITY_STATES);
const FRESHNESS_SET = new Set<string>(FRESHNESS_STATES);
const CONTENT_CLASS_SET = new Set<string>(CONTENT_CLASSES);

export const isAvailabilityState = (v: unknown): v is AvailabilityState =>
  typeof v === "string" && AVAILABILITY_SET.has(v);
export const isAuthorityState = (v: unknown): v is AuthorityState =>
  typeof v === "string" && AUTHORITY_SET.has(v);
export const isFreshnessState = (v: unknown): v is FreshnessState =>
  typeof v === "string" && FRESHNESS_SET.has(v);
export const isContentClass = (v: unknown): v is ContentClass =>
  typeof v === "string" && CONTENT_CLASS_SET.has(v);

/**
 * States whose payload value must NOT be treated as a real, displayable number
 * or accepted fact. Consumers use this to guarantee the non-negotiable
 * conversions in PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md:
 *   missing/withheld/not_measured must never become 0;
 *   candidate must never become accepted.
 */
export const NON_VALUE_AVAILABILITY_STATES: ReadonlySet<AvailabilityState> = new Set([
  "not_loaded",
  "not_measured",
  "withheld",
  "conflicting",
  "not_applicable",
]);

/** True when a metric/number value must be rendered as "no value", never as 0. */
export const availabilityHasDisplayableValue = (
  state: AvailabilityState,
): boolean => !NON_VALUE_AVAILABILITY_STATES.has(state);

/** True when content at this authority is safe to present as established knowledge. */
export const authorityIsPublishedGrade = (state: AuthorityState): boolean =>
  state === "accepted" || state === "published";
