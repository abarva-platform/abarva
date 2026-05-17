// Source Decision Queue assembler (Practitioner-Fit §3.3 + FIX 2).
//
// Takes the detector input bundle, runs every Phase-1 detector, folds the raw
// hits into ONE bundled card per contract/vendor decision, and assembles the
// deterministically-ordered queue:
//   - primary sort: urgency band (due_now → watch)
//   - secondary sort: value-at-stake, descending; unquantified bundles last
//   - tie-break: bundleId, ascending — so the order is fully deterministic
// Never empty-and-silent: an empty queue carries a plain `emptyState` line.
//
// Pure: no DB, no clock — `asOf` arrives inside the input bundle.

import { bundleDecisionItems } from './bundle';
import type { DecisionQueueInput } from './detector-inputs';
import { runAllDetectors } from './detectors';
import {
  URGENCY_ORDER,
  type DecisionUrgency,
  type SourceDecisionBundle,
  type SourceDecisionQueue,
} from './types';

/**
 * Deterministic comparator: urgency band, then value-at-stake descending,
 * then bundleId ascending. Unquantified value sorts after quantified value.
 */
export function compareDecisionBundles(
  a: SourceDecisionBundle,
  b: SourceDecisionBundle,
): number {
  const byUrgency = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
  if (byUrgency !== 0) return byUrgency;

  const aVal = a.valueAtStakeUsd;
  const bVal = b.valueAtStakeUsd;
  if (aVal !== null && bVal !== null && aVal !== bVal) return bVal - aVal;
  if (aVal !== null && bVal === null) return -1;
  if (aVal === null && bVal !== null) return 1;

  return a.bundleId.localeCompare(b.bundleId);
}

function emptyBandCounts(): Record<DecisionUrgency, number> {
  return {
    due_now: 0,
    next_14_days: 0,
    next_45_days: 0,
    next_90_days: 0,
    watch: 0,
  };
}

/**
 * Build the assembled, sorted Decision Queue for one tenant.
 *
 * Deterministic: identical input always yields an identical queue. No
 * fabrication: every bundle traces to a detector with real grounding.
 */
export function buildSourceDecisionQueue(
  input: DecisionQueueInput,
): SourceDecisionQueue {
  const surfacedAt = input.asOf.toISOString();
  const rawItems = runAllDetectors(input);
  const bundles = bundleDecisionItems(input.clientKey, rawItems, surfacedAt).sort(
    compareDecisionBundles,
  );

  const bandCounts = emptyBandCounts();
  for (const bundle of bundles) {
    bandCounts[bundle.urgency] += 1;
  }

  const emptyState =
    bundles.length === 0
      ? input.contracts.length === 0
        ? 'No vendor contracts are loaded for this tenant yet — load the vendor_contracts segment to populate the queue.'
        : 'No renewals, notice windows, overlap or spend flags in the decision horizon. Nothing needs a decision today.'
      : null;

  return {
    clientKey: input.clientKey,
    generatedAt: surfacedAt,
    bundles,
    bandCounts,
    emptyState,
  };
}
