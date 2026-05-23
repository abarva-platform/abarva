// Tenant substrate — the shared shape that grounds a function-aware surface.
//
// The function-aware surfaces (`buildVbcDecisionHome`, `buildVbcBetSelection`)
// are GENERIC over the Domain Function Pack: the pack is the frame (operating
// metrics, archetypes, value model, cadence) and a tenant's audited substrate
// fills it. This module defines the shape of that substrate so each tenant
// binding — Meridian × VBC, Apex × customer care, First Capital × fraud — can
// describe its audited evidence in the same vocabulary without reaching into
// the generic builders' internals.
//
// GROUNDING DISCIPLINE — every non-null value MUST trace to an audited tenant
// source. Where the bound Function Pack expects a metric the tenant has not
// measured, the observation carries `value: null` and a precise `seedGapReason`
// naming what is missing and what its absence blocks. That is the spec's §3
// honesty bar in data form: the surface shows what the tenant truly knows and
// is plainly honest about the rest.
//
// Pure, typed module — no runtime code, no I/O.

/**
 * One audited tenant observation against a Function-Pack operating metric, OR
 * a declared seed gap. A `value` of `null` with a `seedGapReason` is the
 * honest "the function expects this, the tenant has not measured it" state —
 * the no-fabrication discipline made visible (spec §3).
 *
 * The same shape grounds both the decision-home and bet-selection surfaces, so
 * the two cannot drift on what the tenant actually knows.
 */
export interface TenantMetricObservation {
  /** The Function-Pack operating-metric key this observation grounds. */
  metricKey: string;
  /**
   * The audited tenant value, in the metric's own unit — or `null` when the
   * metric is a declared seed gap.
   */
  value: number | null;
  /**
   * Where the value comes from — a citation into the tenant's audited
   * substrate, or the seed-gap statement.
   */
  source: string;
  /**
   * Optional one-line read of what the value means against the Function-Pack
   * benchmark. The decision-home view renders this as the "read" on an
   * off-benchmark vital.
   */
  read?: string;
  /**
   * Set when `value` is `null`: why the metric is a seed gap and what its
   * absence blocks. Rendered verbatim — an honest gap, never papered over.
   */
  seedGapReason?: string;
}

/**
 * The set of observations a tenant binding can ground its analysis against.
 * A binding with no audited substrate (the empty array) renders every metric
 * as a precise seed gap rather than fabricating numbers.
 */
export type TenantSubstrate = readonly TenantMetricObservation[];

/** The empty substrate — used when a binding carries no audited tenant data. */
export const EMPTY_TENANT_SUBSTRATE: TenantSubstrate = [] as const;
