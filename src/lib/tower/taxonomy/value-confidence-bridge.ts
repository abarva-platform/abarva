// Tower value-confidence bridge — the single conversion between the two
// value-confidence models the Tower track maintains.
//
// The Tower track models value confidence at two deliberately different
// granularities:
//
// 1. The 7-state operational ladder `VALUE_READINESS_STATES`, owned by
//    the canonical value LEDGER / data model
//    (`src/lib/tower/ai-value-outcome-ledger.ts`). This is the
//    fine-grained, instrumentation-aware state a value claim moves
//    through as it is baselined, piloted, measured, and either promoted
//    to production or declined.
//
// 2. The 3-rung executive summary `VALUE_RUNGS`, owned by the canonical
//    outcome CLASSIFICATION layer
//    (`src/lib/tower/taxonomy/outcome-taxonomy.ts`). This is the coarse
//    confidence band a CXO reads at a glance: `projected`, `tracked`,
//    `verified`.
//
// These are NOT competing models — they are the same concept at two
// zoom levels. This module is the one place that projects the
// operational ladder onto the executive summary, so every consumer that
// needs the rollup performs exactly one documented conversion rather
// than re-deriving an ad-hoc `switch` of its own.
//
// Pure, deterministic, dependency-free beyond the two taxonomy modules
// it bridges. No clock, no randomness, no I/O.

import { VALUE_READINESS_STATES } from '@/lib/tower/ai-value-outcome-ledger';
import type { ValueReadinessState } from '@/lib/tower/ai-value-outcome-ledger';
import { VALUE_RUNGS } from '@/lib/tower/taxonomy/outcome-taxonomy';
import type { ValueRung } from '@/lib/tower/taxonomy/outcome-taxonomy';

/**
 * The canonical rollup: every 7-state readiness value maps to exactly
 * one 3-rung confidence band. The mapping is total (every readiness
 * state is a key) and the keying is exhaustive at the type level via
 * `Record<ValueReadinessState, ValueRung>`.
 *
 * Rationale for each grouping:
 *
 * - `projected` — nothing has been measured yet, or the claim has been
 *   abandoned. `projected_only` is the pre-measurement state.
 *   `declined` is grouped here deliberately: a declined claim has no
 *   defensible measured value, so it must never read as `tracked` or
 *   `verified` to a CXO. It rolls up to the *weakest* rung.
 * - `tracked` — measurement is in motion but not yet complete. A
 *   baseline is being established (`baseline_pending`), has been set
 *   (`baseline_set`), or pilot instrumentation is actively collecting
 *   (`in_pilot_measurement`). There is signal, but no audited result.
 * - `verified` — a measured result exists, in a pilot
 *   (`measured_in_pilot`) or in production (`measured_in_production`).
 *   These are exactly the two states the ledger permits Atlas to
 *   defend a dollar number for.
 */
export const READINESS_STATE_TO_RUNG: Readonly<
  Record<ValueReadinessState, ValueRung>
> = {
  projected_only: 'projected',
  declined: 'projected',
  baseline_pending: 'tracked',
  baseline_set: 'tracked',
  in_pilot_measurement: 'tracked',
  measured_in_pilot: 'verified',
  measured_in_production: 'verified',
};

/**
 * Projects a fine-grained 7-state readiness value onto the coarse
 * 3-rung executive confidence band.
 *
 * This is the canonical, single conversion — operational detail rolled
 * up into the executive summary. Consumers that need the rollup MUST
 * call this rather than maintaining their own `switch`.
 */
export function readinessStateToRung(state: ValueReadinessState): ValueRung {
  return READINESS_STATE_TO_RUNG[state];
}

/**
 * The inverse note: a rung does not identify a single readiness state,
 * but it does imply a *minimum* readiness state — the weakest
 * (earliest) readiness state that rolls up to that rung. Useful when a
 * caller only has an executive rung and needs the floor of operational
 * progress it guarantees.
 *
 * - `projected` => `projected_only` (the floor; `declined` also rolls
 *   up here but is a terminal off-ladder state, not a progress floor).
 * - `tracked`   => `baseline_pending` (the first measurement-in-motion
 *   state).
 * - `verified`  => `measured_in_pilot` (the first state with a measured
 *   result).
 */
export const RUNG_TO_MINIMUM_READINESS_STATE: Readonly<
  Record<ValueRung, ValueReadinessState>
> = {
  projected: 'projected_only',
  tracked: 'baseline_pending',
  verified: 'measured_in_pilot',
};

/**
 * Returns the minimum (weakest) readiness state implied by a rung. See
 * `RUNG_TO_MINIMUM_READINESS_STATE` for the rationale and caveats.
 */
export function rungToMinimumReadinessState(
  rung: ValueRung,
): ValueReadinessState {
  return RUNG_TO_MINIMUM_READINESS_STATE[rung];
}

/**
 * Sanity invariant for tests and callers: every canonical readiness
 * state has a rung mapping and every rung has a minimum-state mapping.
 * Total and deterministic.
 */
export function isBridgeTotal(): boolean {
  return (
    VALUE_READINESS_STATES.every(
      (state) => READINESS_STATE_TO_RUNG[state] !== undefined,
    ) &&
    VALUE_RUNGS.every(
      (rung) => RUNG_TO_MINIMUM_READINESS_STATE[rung] !== undefined,
    )
  );
}
