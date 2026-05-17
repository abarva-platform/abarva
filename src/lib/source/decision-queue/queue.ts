// Source Decision Queue assembler (Practitioner-Fit §3.3).
//
// Takes the detector input bundle, runs every Phase-1 detector, and assembles
// the deterministically-ordered queue:
//   - primary sort: urgency band (today → watch)
//   - secondary sort: value-at-stake, descending; unquantified items last
//   - tie-break: itemId, ascending — so the order is fully deterministic
// Never empty-and-silent: an empty queue carries a plain `emptyState` line.
//
// Pure: no DB, no clock — `asOf` arrives inside the input bundle.

import type { DecisionQueueInput } from './detector-inputs';
import { runAllDetectors } from './detectors';
import {
  URGENCY_ORDER,
  type DecisionUrgency,
  type SourceDecisionItem,
  type SourceDecisionQueue,
} from './types';

/**
 * Deterministic comparator: urgency band, then value-at-stake descending,
 * then itemId ascending. Unquantified value sorts after quantified value.
 */
export function compareDecisionItems(
  a: SourceDecisionItem,
  b: SourceDecisionItem,
): number {
  const byUrgency = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
  if (byUrgency !== 0) return byUrgency;

  const aVal = a.valueAtStakeUsd;
  const bVal = b.valueAtStakeUsd;
  if (aVal !== null && bVal !== null && aVal !== bVal) return bVal - aVal;
  if (aVal !== null && bVal === null) return -1;
  if (aVal === null && bVal !== null) return 1;

  return a.itemId.localeCompare(b.itemId);
}

function emptyBandCounts(): Record<DecisionUrgency, number> {
  return { today: 0, this_week: 0, this_month: 0, watch: 0 };
}

/**
 * Build the assembled, sorted Decision Queue for one tenant.
 *
 * Deterministic: identical input always yields an identical queue. No
 * fabrication: every item traces to a detector with real grounding.
 */
export function buildSourceDecisionQueue(
  input: DecisionQueueInput,
): SourceDecisionQueue {
  const items = runAllDetectors(input).sort(compareDecisionItems);

  const bandCounts = emptyBandCounts();
  for (const item of items) {
    bandCounts[item.urgency] += 1;
  }

  const emptyState =
    items.length === 0
      ? input.contracts.length === 0
        ? 'No vendor contracts are loaded for this tenant yet — load the vendor_contracts segment to populate the queue.'
        : 'No renewals, notice windows, overlap or spend flags in the decision horizon. Nothing needs a decision today.'
      : null;

  return {
    clientKey: input.clientKey,
    generatedAt: input.asOf.toISOString(),
    items,
    bandCounts,
    emptyState,
  };
}
