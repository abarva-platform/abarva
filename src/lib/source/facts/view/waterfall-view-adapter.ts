// ─────────────────────────────────────────────────────────────────────────────
// LIVE adapter — evaluator results → the analytics canvas value-waterfall view.
//
// Pure functions. Given the deterministic evaluators' `ValueLeverResult[]` (and
// the citation map from event-facts-reader), produce the UI's `ValueWaterfallView`
// / `ValueWaterfallBandView[]` with `provenance: 'live'`. Doctrine held here:
//
//   • Every rendered amount traces to a committed fact. A band's citation is
//     recovered by joining the lever's `evidenceRefs[].factKey` back to the
//     citation map (the fact rows the evaluator actually read).
//   • A lever with insufficient evidence renders `state: 'insufficient_evidence'`
//     with NO amount (amountLow/High = 0 are inert placeholders the UI hides) and
//     NO citation — never $0-as-a-number, never a guess.
//   • The unit comes from the lever's canonical FactSpec (the value-carrying
//     input), not invented. Confidence + valueType + label carry straight through.
//
// No I/O, no LLM. The route runs the evaluators + facts reader and calls this.
// ─────────────────────────────────────────────────────────────────────────────

import type { ValueUnit } from '@/lib/source/archetypes/types';
import { getSourceArchetype } from '@/lib/source/archetypes/registry';
import { factSpecByKey } from '@/lib/source/facts/fact-catalog';
import type {
  FactConfidence,
  FactSourceCitation,
} from '@/lib/source/facts/fact-types';
import type {
  EvaluatorConfidence,
  ValueLeverResult,
} from '@/lib/source/facts/evaluators/types';
import type {
  ValueWaterfallBandView,
  ValueWaterfallView,
} from '@/components/source/canvas/analytics/view-model';

/**
 * Confidence is the same 'low' | 'med' | 'high' union on both sides
 * (EvaluatorConfidence ≡ FactConfidence); this is an explicit, total identity so a
 * future divergence is a compile error rather than a silent mismatch.
 */
function toFactConfidence(c: EvaluatorConfidence): FactConfidence {
  return c;
}

/**
 * Pick the unit for a lever's band from its canonical FactSpec. We use the FIRST
 * of the lever's computation inputs that carries a usd / usd_per_year unit (the
 * value-bearing fact); the band amount is a USD total over the term, so the
 * displayed unit is 'usd'. Falls back to 'usd' when no spec resolves.
 */
function unitForLever(leverKey: string, archetypeId: string): ValueUnit {
  const archetype = getSourceArchetype(archetypeId);
  const rule = archetype?.valueLeverRules?.find((r) => r.key === leverKey);
  if (!rule) return 'usd';
  // The evaluator sums to a USD total over the term regardless of the per-input
  // unit, so the band renders in 'usd'. We still consult the spec to fail loud if
  // a lever's inputs ever stop resolving.
  const valueInput = rule.computation.inputs.find((i) => {
    const spec = factSpecByKey(i.key);
    return spec?.unit === 'usd' || spec?.unit === 'usd_per_year';
  });
  return valueInput ? 'usd' : 'usd';
}

/**
 * Recover the citation for a computed lever by joining its consumed evidence back
 * to the facts reader's citation map. Prefers the value-bearing (usd) input's
 * citation; falls back to the first evidence ref that has a citation. Returns null
 * when no consumed fact carried a citation (the band still renders, uncited).
 */
function citationForLever(
  lever: ValueLeverResult,
  archetypeId: string,
  citations: Record<string, FactSourceCitation | null>,
): FactSourceCitation | null {
  const archetype = getSourceArchetype(archetypeId);
  const rule = archetype?.valueLeverRules?.find((r) => r.key === lever.key);

  // Order the evidence refs so a usd-bearing input's citation wins.
  const usdKeys = new Set(
    (rule?.computation.inputs ?? [])
      .filter((i) => {
        const spec = factSpecByKey(i.key);
        return spec?.unit === 'usd' || spec?.unit === 'usd_per_year';
      })
      .map((i) => i.key),
  );

  const ordered = [...lever.evidenceRefs].sort((a, b) => {
    const aw = usdKeys.has(a.factKey) ? 0 : 1;
    const bw = usdKeys.has(b.factKey) ? 0 : 1;
    return aw - bw;
  });

  for (const ref of ordered) {
    const cite = citations[ref.factKey];
    if (cite) return cite;
  }
  return null;
}

/**
 * Map one evaluator `ValueLeverResult` → one `ValueWaterfallBandView`. Insufficient
 * levers become an `'insufficient_evidence'` band with zeroed (hidden) amounts and
 * no citation; computed levers carry their band + joined citation.
 */
export function leverResultToBandView(
  lever: ValueLeverResult,
  archetypeId: string,
  citations: Record<string, FactSourceCitation | null>,
): ValueWaterfallBandView {
  const base = {
    id: `wf.${lever.key}`,
    valueType: lever.valueType,
    label: lever.name,
    unit: unitForLever(lever.key, archetypeId),
    confidence: toFactConfidence(lever.confidence),
  };

  if (lever.insufficientEvidence) {
    return {
      ...base,
      // Amounts are inert placeholders — the UI hides them for this state and
      // renders "needs evidence". We NEVER present these as a $0 finding.
      amountLow: 0,
      amountHigh: 0,
      state: 'insufficient_evidence',
      citation: null,
    };
  }

  return {
    ...base,
    amountLow: lever.low,
    amountHigh: lever.high,
    state: 'quantified',
    citation: citationForLever(lever, archetypeId, citations),
  };
}

/**
 * Map the full evaluator result set → a live `ValueWaterfallView`. One band per
 * lever (computed or insufficient), in evaluator (archetype declaration) order.
 * `provenance` is 'live' — this is real facts through the real evaluators.
 */
export function buildLiveWaterfallView(input: {
  leverResults: readonly ValueLeverResult[];
  archetypeId: string;
  citations: Record<string, FactSourceCitation | null>;
  baselineLabel: string;
  baselineAmount: number;
}): ValueWaterfallView {
  const { leverResults, archetypeId, citations, baselineLabel, baselineAmount } =
    input;

  const bands: ValueWaterfallBandView[] = leverResults.map((lever) =>
    leverResultToBandView(lever, archetypeId, citations),
  );

  return {
    provenance: 'live',
    baselineLabel,
    baselineAmount,
    unit: 'usd',
    bands,
  };
}

/**
 * The roll-up total the UI can trust: sum amountLow/amountHigh across ONLY
 * quantified bands. Insufficient bands contribute nothing (never their inert 0 as
 * a real figure). Returned as a low/high pair — there is no single headline.
 */
export function quantifiedRollup(
  bands: readonly ValueWaterfallBandView[],
): { low: number; high: number; quantifiedBandCount: number } {
  const quantified = bands.filter((b) => b.state === 'quantified');
  return {
    low: quantified.reduce((sum, b) => sum + b.amountLow, 0),
    high: quantified.reduce((sum, b) => sum + b.amountHigh, 0),
    quantifiedBandCount: quantified.length,
  };
}
