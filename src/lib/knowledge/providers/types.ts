/**
 * Provider contract types for the airline-demo-new Knowledge UI.
 *
 * Shapes here follow KNOWLEDGE_TARGET_READ_MODEL_CONTRACTS.md
 * (reports/airline-knowledge-ui-binding-2026-07-29/), which documents the target
 * consumption-projection contract this codebase's real
 * CONSUMPTION_PROJECTION_REGISTRY.json does not yet expose on this branch — that
 * registry lives on an unmerged worktree (see the binding package's Phase 0 note).
 * When the branches merge, reconcile these against the real registry rather than
 * assuming this file is authoritative.
 *
 * Every governed read goes through ConsumptionEnvelope<T> so a component can never
 * receive a bare value without also receiving whether it's trustworthy to render.
 */

/** GAP-05: the 5-value readiness taxonomy the prototype uses throughout. Not yet a
 * ratified canonical enum -- this is the target shape, derivation TBD pending
 * GAP-01/GAP-02 (risk/evidence-gap and metric pipelines) closing. */
export const READINESS_STATES = [
  "decision_ready",
  "directional",
  "blocked_missing_input",
  "blocked_sources_disagree",
  "not_assessed",
] as const;
export type ReadinessState = (typeof READINESS_STATES)[number];

/** Per-value availability state. Never silently coerced to 0/null/false -- a
 * component must branch on this before rendering a number, chart, or claim. */
export const AVAILABILITY_STATES = [
  "available",
  "not_loaded",
  "not_measured",
  "withheld",
  "conflicting",
  "stale",
  "not_applicable",
] as const;
export type AvailabilityState = (typeof AVAILABILITY_STATES)[number];

export const AUTHORITY_STATES = [
  "accepted",
  "deferred",
  "candidate",
  "disputed",
  "proposed",
] as const;
export type AuthorityState = (typeof AUTHORITY_STATES)[number];

export const FRESHNESS_STATES = ["current", "stale", "unknown"] as const;
export type FreshnessState = (typeof FRESHNESS_STATES)[number];

/** current vs. target scope (GAP-07) -- the single highest-leverage fix the gap
 * register identifies, since one field pair unblocks 4+ matrix rows at once. */
export const STATE_SCOPES = ["current", "target"] as const;
export type StateScope = (typeof STATE_SCOPES)[number];

export const TARGET_APPROVAL_STATES = ["proposed", "approved"] as const;
export type TargetApprovalState = (typeof TARGET_APPROVAL_STATES)[number];

/** required_metadata, per every target read-model contract in the binding package. */
export interface BaselineMetadata {
  readonly tenantKey: string;
  readonly knowledgeBaselineRef: string;
  readonly domainPublicationRef: string | null;
  readonly projectionContractVersion: string;
  readonly asOfDate: string;
  readonly authorityState: AuthorityState;
  readonly freshnessState: FreshnessState;
  readonly availabilityState: AvailabilityState;
  readonly evidenceCoverage: number | null;
  readonly contentHash: string | null;
}

export interface EvidenceRef {
  readonly sourceName: string;
  readonly sourceDate: string | null;
  readonly citation: string | null;
  readonly reviewState: AuthorityState;
  readonly confidence: "high" | "partial" | "unknown";
  readonly effectivePeriod: {
    readonly from: string | null;
    readonly to: string | null;
  } | null;
  readonly lineage: readonly string[];
  readonly conflicts: readonly string[];
  readonly accessRestricted: boolean;
}

export interface KnownGapRef {
  readonly gapId: string;
  readonly gapType: AvailabilityState;
  readonly summary: string;
  readonly owner: string | null;
  readonly dueDate: string | null;
  readonly blocks: readonly string[];
}

/**
 * Every governed read returns this envelope. A component MUST check
 * `availabilityState` (and, where relevant, `authorityState`) before rendering
 * `data` as fact -- per feedback_governed_ui_provider_render_gate: missing is
 * never rendered as zero, uncertified is never rendered as clean, proposed is
 * never rendered as accepted.
 */
export interface ConsumptionEnvelope<T> {
  readonly data: T | null;
  readonly availabilityState: AvailabilityState;
  readonly authorityState: AuthorityState | null;
  readonly freshnessState: FreshnessState;
  readonly evidence: readonly EvidenceRef[];
  readonly knownGaps: readonly KnownGapRef[];
  readonly warnings: readonly string[];
  readonly meta: BaselineMetadata;
}

/** Build a withheld envelope -- the only way to represent "not ready yet" so every
 * caller gets the same shape whether the projection is missing, the tenant isn't
 * wired, or a live call failed. Never construct ConsumptionEnvelope by hand for
 * an unavailable case; use this. */
export function withheldEnvelope<T>(
  meta: BaselineMetadata,
  reason: AvailabilityState,
  warnings: readonly string[] = [],
): ConsumptionEnvelope<T> {
  return {
    data: null,
    availabilityState: reason,
    authorityState: null,
    freshnessState: meta.freshnessState,
    evidence: [],
    knownGaps: [],
    warnings,
    meta,
  };
}
