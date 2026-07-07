// ─────────────────────────────────────────────────────────────────────────────
// The value-type waterfall — the honest roll-up.
//
// Groups computed ValueLeverResult[] by their five value types and sums each
// type's low/high band. There is NEVER a single headline number: `protected`
// (leakage avoided) and `risk_adjusted` (defensible-after-discount) are stated
// separately and never folded into a savings total. Levers that lacked evidence
// are surfaced by key, not silently dropped.
//
// Pure roll-up: no I/O. The UI slice consumes ValueWaterfall directly.
// ─────────────────────────────────────────────────────────────────────────────

import type { ValueType } from '../../archetypes/types';
import type {
  EvaluatorConfidence,
  ValueLeverResult,
  ValueTypeBand,
  ValueWaterfall,
} from './types';

/**
 * Canonical value-type display order. The waterfall emits bands in this order so
 * the five types read consistently: earned value first, then the additive
 * protected / risk-adjusted framings stated apart.
 */
export const VALUE_TYPE_ORDER: readonly ValueType[] = [
  'expected_concession',
  'incremental_negotiated',
  'solution_tightening',
  'protected',
  'risk_adjusted',
] as const;

/** Confidence is ordinal; the roll-up takes the weakest link. */
const CONFIDENCE_RANK: Record<EvaluatorConfidence, number> = {
  low: 0,
  med: 1,
  high: 2,
};

function weakest(
  a: EvaluatorConfidence,
  b: EvaluatorConfidence,
): EvaluatorConfidence {
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}

/**
 * Roll up value-lever results into a value-type waterfall. Only levers that
 * produced a computed band contribute to a type's summed low/high; insufficient
 * levers are collected separately. Bands are emitted in VALUE_TYPE_ORDER, and a
 * value type with no computed lever produces no band (it is not shown as $0).
 */
export function buildValueWaterfall(
  results: readonly ValueLeverResult[],
): ValueWaterfall {
  const computed = results.filter((r) => !r.insufficientEvidence);
  const insufficientLevers = results
    .filter((r) => r.insufficientEvidence)
    .map((r) => r.key);

  const byType = new Map<ValueType, ValueTypeBand>();
  for (const result of computed) {
    const existing = byType.get(result.valueType);
    if (!existing) {
      byType.set(result.valueType, {
        valueType: result.valueType,
        low: result.low,
        high: result.high,
        confidence: result.confidence,
        leverKeys: [result.key],
      });
      continue;
    }
    existing.low += result.low;
    existing.high += result.high;
    existing.confidence = weakest(existing.confidence, result.confidence);
    existing.leverKeys.push(result.key);
  }

  const bands: ValueTypeBand[] = VALUE_TYPE_ORDER.filter((t) =>
    byType.has(t),
  ).map((t) => byType.get(t)!);

  return {
    bands,
    insufficientLevers,
    computedLeverCount: computed.length,
  };
}
