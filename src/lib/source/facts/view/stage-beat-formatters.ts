// ─────────────────────────────────────────────────────────────────────────────
// Item U-546 — the four formatters the stage-beat builders share.
//
// `bafo-`, `evaluation-`, `selection-` and `value-fact-beats.ts` each held a
// module-private, byte-similar copy of these. `responses-` and `rfp-fact-beats.ts`
// hold none of them, so the population was four, not six. `U-545` copied rather
// than extracted on purpose — the extraction touches three modules that item did
// not own — and recorded the choice rather than leaving it to be found.
//
// THE RISK IS NOT DUPLICATION AS SUCH. `citedDocFor` encodes a rule that four
// copies can drift from independently, and `usd` decides how a dollar figure
// reads on a client surface. One copy is one place to change and one place to
// mutate.
//
// NOTHING HERE GAINED A BRANCH IN THE MOVE. Where the four copies differed, they
// differed in exactly one way: `bafo` and `evaluation` typed `citedDocFor`'s
// first parameter as `ValueLeverResult`, while `selection` and `value` typed it
// `ValueLeverResult | undefined` and guarded with `?.evidenceRefs ?? []`. The
// union is the wider of the two existing signatures and its body is the
// `selection`/`value` copy verbatim; for a defined result the two are the same
// function, so the two callers that always pass a defined result see no change
// in behaviour and the `?? []` arm is simply unreachable from them. A formatter
// that gains a branch during an extraction is not an extraction, and none did.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  SourceEventArchetype,
  ValueLeverRule,
} from '@/lib/source/archetypes/types';
import type { ValueLeverResult } from '@/lib/source/facts/evaluators/types';
import type { FactSourceCitation } from '@/lib/source/facts/fact-types';

/** USD, as a reader reads it. */
export function usd(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * A lever key as a task id segment: lowercased, non-alphanumerics collapsed. The
 * rule keys are `AMS.ENHANCEMENT_LEAKAGE`-shaped, and a task id reaches the DOM
 * as a React key.
 */
export function idSegment(leverKey: string): string {
  return leverKey.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * The document a lever's number can be cited to, or null.
 *
 * Reads the FIRST CONSUMED fact that has a citation rather than the first
 * required input, because an input the evaluator did not consume says nothing
 * about where the number came from. A rule can declare an input the formula
 * tolerates the absence of — `term_years` is one — and a citation sitting on
 * that absent key describes a document that fed nothing.
 */
export function citedDocFor(
  result: ValueLeverResult | undefined,
  citations: Record<string, FactSourceCitation | null>,
): string | null {
  for (const ref of result?.evidenceRefs ?? []) {
    const citation = citations[ref.factKey];
    if (citation?.doc) {
      return citation.locator
        ? `${citation.doc} · ${citation.locator}`
        : citation.doc;
    }
  }
  return null;
}

/** The target band for a lever, or null when the lever did not compute. */
export function targetBandFor(
  result: ValueLeverResult | undefined,
): { low: number; high: number } | null {
  if (!result || result.insufficientEvidence) return null;
  return { low: result.low, high: result.high };
}

export function targetLabel(band: { low: number; high: number } | null): string {
  return band ? `${usd(band.low)}–${usd(band.high)}` : 'Not yet quantified';
}

// ─────────────────────────────────────────────────────────────────────────────
// Item U-547 — the fifth helper, and why it arrived separately.
//
// `bafo-` and `evaluation-fact-beats.ts` each held a module-private, BYTE-
// IDENTICAL `ruleIndex`. The other four beat modules resolve rules from the
// array or with `.find()` and build no map, so the population is two, not six —
// which is why `U-546` did not name it among the four formatters, and why
// folding it in would have widened a diff whose whole value was a checkable
// scope. It was filed rather than absorbed.
//
// NOTHING GAINED A BRANCH IN THE MOVE. Unlike the four, there was no signature
// to reconcile: both copies took `SourceEventArchetype`, returned
// `Map<string, ValueLeverRule>`, and had the same one-expression body including
// the `?? []` arm. This is that body verbatim.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The rule a lever result came from, by key.
 *
 * Both callers resolve per result with `.get(result.key)` and both tolerate a
 * miss, falling back to guide text that names no rule. So a wrong index does not
 * throw — it silently renders the generic sentence in place of the archetype's
 * own, which is why the suite asserts the rule-derived text per rule per stage
 * rather than asserting this function against itself.
 */
export function ruleIndex(
  archetype: SourceEventArchetype,
): Map<string, ValueLeverRule> {
  return new Map(
    (archetype.valueLeverRules ?? []).map((rule) => [rule.key, rule]),
  );
}
