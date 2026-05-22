// Move → Function Pack binding — the first production caller of the §5 contract.
//
// AbarVa carries 36 curated Domain Function Packs and a pure §5 binding
// contract, `bindFunctionPackForArtifact`. Until now that contract had ZERO
// production callers — the packs were reachable in principle but never bound to
// a real Move.
//
// `bindMoveFunctionPack` closes that gap. Given a real Move (`engagements` row)
// and the phase artifact about to be produced, it walks the full path:
//
//   1. resolve the Move to its `(industryKey, functionKey)` identity
//      (`resolveMoveFunctionIdentity`) — `null` ⇒ honest unbound result;
//   2. resolve the curated Function Pack for that identity
//      (`resolveFunctionPack`) — `null` ⇒ honest unbound result;
//   3. reconcile the Move's recorded baseline metrics against the pack
//      (`resolveTenantMetricKeys`);
//   4. bind the pack for the artifact (`bindFunctionPackForArtifact`),
//      yielding the inherited outline and the precise seed gaps.
//
// HONESTY: at every step where the path cannot continue, this returns the
// honest unbound `FunctionPackBinding` (`bound: false`, with a `fallbackNote`).
// It NEVER fabricates an identity, a pack, or an outline — an unbound Move
// falling back to general reasoning is a known, surfaced gap (spec §5).
//
// Pure module: deterministic, no I/O. Its data source for v1 is the Move's own
// `engagements.baseline_metrics` JSONB — no broker, vector, or graph access.

import {
  bindFunctionPackForArtifact,
  type FunctionPackBinding,
} from './expert-kernel/domain/function-pack-context-binding';
import { resolveFunctionPack } from './expert-kernel/domain/function-pack-registry';
import type { MovesPhaseArtifact } from './expert-kernel/domain/function-pack-types';
import { resolveMoveFunctionIdentity } from './function-identity';
import {
  resolveTenantMetricKeys,
  type BaselineMetricEntry,
} from './tenant-metric-inventory';

/**
 * The minimal slice of a Move (`engagements` row) this binding path needs.
 *
 * Deliberately NOT coupled to a heavy program/engagement type — it accepts only
 * the three columns the binding actually reads, so any caller holding a Move in
 * any shape (DB row, view model, partial) can pass it. `industry_code` and its
 * `industryCode` camelCase alias are both accepted so a snake_case DB row and a
 * camelCase view model both work without a transform.
 */
export interface MoveFunctionBindingInput {
  /** The `engagements.industry_code` column (snake_case DB row form). */
  industry_code?: string | null;
  /** The `industryCode` alias (camelCase view-model form). */
  industryCode?: string | null;
  /** The `engagements.charter` JSONB — origination writes the function key here. */
  charter?: unknown;
  /** The `engagements.baseline_metrics` JSONB array — the v1 metric source. */
  baseline_metrics?: readonly BaselineMetricEntry[] | null;
}

/**
 * The honest unbound result — `bound: false` with the fallback note the agent
 * must surface. Produced when the Move cannot resolve a function identity at
 * all (no industry code, or no `functionPackKey` in the charter), so there is
 * no `(industryKey, functionKey)` to even attempt a pack bind with.
 */
function unboundForUnresolvedIdentity(): FunctionPackBinding {
  return {
    bound: false,
    deliverableOutline: [],
    expectedMetrics: [],
    seedGaps: [],
    fallbackNote:
      'This Move does not resolve to a curated Domain Function Pack — its ' +
      'industry code or charter carries no function identity. The agent ' +
      'falls back to general reasoning for this task; this is a known ' +
      'curated-depth gap, surfaced honestly, not fabricated depth.',
  };
}

/**
 * Bind a real Move to its curated Domain Function Pack for a phase artifact.
 *
 * The first production consumption of the §5 binding contract. It resolves the
 * Move's `(industryKey, functionKey)` identity, resolves the pack, reconciles
 * the Move's recorded baseline metrics against the pack's expected operating
 * metrics, and returns the bound `FunctionPackBinding` — the inherited
 * deliverable outline plus the precise seed gaps for every expected metric the
 * tenant does not record.
 *
 * Returns the honest unbound `FunctionPackBinding` (`bound: false`, with a
 * `fallbackNote`) when the Move cannot resolve a function identity. When the
 * identity resolves but no pack is catalogued, the unbound result is the one
 * `bindFunctionPackForArtifact` itself produces — a precise, key-naming
 * fallback note. It NEVER fabricates an identity, a pack, or an outline.
 *
 * Pure and deterministic — same Move + artifact → same binding.
 *
 * @param move     The minimal Move slice — industry code, charter, baseline
 *                 metrics. See `MoveFunctionBindingInput`.
 * @param artifact The Moves phase artifact about to be produced.
 */
export function bindMoveFunctionPack(
  move: MoveFunctionBindingInput,
  artifact: MovesPhaseArtifact,
): FunctionPackBinding {
  // (1) Resolve the Move to its (industryKey, functionKey) identity. A `null`
  // here means there is no identity to bind — return the honest unbound result
  // rather than fabricating one.
  const identity = resolveMoveFunctionIdentity({
    industryCode: move.industry_code ?? move.industryCode,
    charter: move.charter,
  });
  if (!identity) {
    return unboundForUnresolvedIdentity();
  }

  // (2) Resolve the curated pack. A `null` is an honest "no curated pack" — we
  // hand it to `bindFunctionPackForArtifact` anyway, which produces the precise
  // key-naming fallback note for exactly this case (spec §5).
  const pack = resolveFunctionPack(identity.industryKey, identity.functionKey);
  if (!pack) {
    return bindFunctionPackForArtifact(
      identity.industryKey,
      identity.functionKey,
      artifact,
      [],
    );
  }

  // (3) Reconcile the Move's recorded baseline metrics against the pack — the
  // conservative subset of pack metric keys the tenant demonstrably records.
  const tenantMetricKeys = resolveTenantMetricKeys(
    move.baseline_metrics,
    pack,
  );

  // (4) Bind the pack for the artifact — the inherited outline and the precise
  // seed gaps for every expected metric the tenant does not record.
  return bindFunctionPackForArtifact(
    identity.industryKey,
    identity.functionKey,
    artifact,
    tenantMetricKeys,
  );
}
