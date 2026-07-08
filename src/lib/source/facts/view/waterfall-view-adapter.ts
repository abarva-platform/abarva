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
 * The unit a lever's band renders in. Every evaluator sums its inputs to a USD
 * total over the term, so the band is always 'usd' — regardless of the per-input
 * unit (pct / fte / count feed the math but are not the band's unit). Kept as a
 * function so a future non-USD lever family can override here in one place.
 */
function unitForLever(): ValueUnit {
  return 'usd';
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
    unit: unitForLever(),
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
 * The largest defensible ratio of classified value to its stated baseline. Above
 * this, the "baseline" is not a credible denominator — it is garbage (e.g. a
 * percentage mis-parsed to a bare `15`), so the "% of baseline" figure would be a
 * nonsense number in the millions of percent.
 *
 * Why 50, and why it cleanly separates the two live cases:
 *   • A LEGITIMATE baseline can be smaller than the classified value — a seeded
 *     event shows baseline $15,000,000 against $30M–$43M classified value, a ratio
 *     of ~2.9 ("199–285% of baseline"). That is intended and must keep rendering.
 *   • The BUG is a positive-but-garbage baseline of $15 against ~$65M classified
 *     value — a ratio of ~4,300,000. That is not a baseline; it must be suppressed.
 *   • 50 sits safely between the two by three-plus orders of magnitude. No genuine
 *     "value at stake" estimate is 50×+ smaller than the classified value it is
 *     measured against: a real baseline is the spend/scope the value is carved out
 *     of, so the value it yields is a fraction (or a small multiple) of it, not
 *     tens of times larger. 50× is a generous ceiling for that small multiple; a
 *     denominator that fails it is definitionally not the thing being measured.
 */
export const MAX_VALUE_TO_BASELINE_RATIO = 50;

/**
 * Is the stated baseline a CREDIBLE denominator for the classified value? A
 * baseline is credible only when it is positive AND not orders of magnitude
 * smaller than the value measured against it. This is the single predicate both
 * render sites (the ValueWaterfall header and the step-insight headline) use to
 * decide whether to print the "Value at stake: $X" line and the "% of baseline"
 * fragment — an incredible baseline is suppressed rather than shown as a nonsense
 * percentage. It never fabricates or derives a replacement baseline.
 */
export function isCredibleBaseline(
  baselineAmount: number,
  classifiedTotalHigh: number,
): boolean {
  if (!(baselineAmount > 0)) return false;
  return classifiedTotalHigh / baselineAmount <= MAX_VALUE_TO_BASELINE_RATIO;
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
