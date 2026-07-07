// ─────────────────────────────────────────────────────────────────────────────
// Door 1 · evaluators adapter — the integration seam.
//
// Door 1 declares its own `ValueLeverResult` (types.ts) and, until now, produced
// it with a self-contained reference evaluator (evaluate.ts). A parallel slice has
// MERGED the deterministic value-lever evaluators
// (src/lib/source/facts/evaluators/*): those own the canonical math and emit a
// SIBLING `ValueLeverResult` with DIFFERENT field names. The two do not unify by
// structural typing.
//
// This module is the small ADAPTER the RECONCILIATION CONTRACT note (top of
// door1/types.ts) describes: a PURE function that maps one merged
// `evaluators.ValueLeverResult` onto one Door 1 `ValueLeverResult`, field by field,
// so Door 1 can consume the canonical evaluators as a drop-in producer of its own
// result shape. The fact/citation lookups are PASSED IN (never fetched here) — the
// adapter stays pure: inputs → output.
//
// Honesty invariants preserved across the seam:
//   • An insufficient-evidence result NEVER emits a number — `low`/`high` are
//     nulled and its missing keys route to `missingFactKeys`.
//   • A consumed fact with no citation in the map is surfaced honestly (an empty
//     locator, flagged), NEVER fabricated.
// ─────────────────────────────────────────────────────────────────────────────

import type { ValueLeverResult as EvaluatorValueLeverResult } from '../facts/evaluators/types';
import type { ValueLeverRule } from '../archetypes/types';
import type { ValueLeverCitation, ValueLeverResult } from './types';

/**
 * The citation for one consumed fact, as recovered from `source_event_facts`. The
 * adapter joins each `evidenceRef.factKey` back to this by key. Not on the
 * evaluator result — the evaluator carries only `{ factKey, value }`.
 */
export interface FactCitation {
  /** The evidence source (document/template/system-of-record). */
  doc: string;
  /** Where within the source (page, cell, clause, column). */
  locator: string;
}

/** factKey → its resolved citation. Missing key ⇒ no citation for that fact. */
export type CitationLookup = Record<string, FactCitation>;

/**
 * The Door-1 band unit. The merged evaluators emit USD-over-term bands (see
 * facts/evaluators/types.ts: "`low`/`high` are USD (over the term)"), and Door 1's
 * own reference evaluator hardcodes the same. The reconciliation note points at the
 * fact `FactSpec` for `unit`, but that describes the units of the lever's INPUTS
 * (usd_per_year / pct / fte / …), not the unit of the output band — the band is
 * always USD. So the adapter fixes the band unit to 'usd', consistent with both
 * sibling producers, and does not re-derive it from a per-input FactSpec.
 */
const BAND_UNIT = 'usd' as const;

/**
 * Resolve the citation for a consumed fact HONESTLY. When the citation map has no
 * entry for the fact the lever read, we do NOT drop the fact and we do NOT
 * fabricate a source: the citation is surfaced with an empty `locator` and a `doc`
 * that flags the gap, so the audit trail shows a fact was consumed without a
 * recoverable citation rather than silently hiding it.
 */
function resolveCitation(
  factKey: string,
  citations: CitationLookup,
): ValueLeverCitation {
  const found = citations[factKey];
  if (found) {
    return { factKey, doc: found.doc, locator: found.locator };
  }
  // Consumed fact with no citation in the map — flag it, never invent one.
  return { factKey, doc: 'citation unavailable', locator: '' };
}

/**
 * Map ONE merged `evaluators.ValueLeverResult` onto ONE Door 1 `ValueLeverResult`.
 *
 * Pure: the `rule` (for `category`, recovered by key) and the `citations` lookup
 * (factKey → {doc,locator}, recovered from `source_event_facts`) are passed in;
 * nothing is fetched here.
 *
 * Field map (per the RECONCILIATION CONTRACT in door1/types.ts):
 *   key → ruleKey · name → name · valueType → valueType · confidence → confidence
 *   basis → basis · insufficientEvidence → status · low/high → low/high
 *   (nulled when insufficient) · missingEvidence → missingFactKeys
 *   evidenceRefs[] → citations[] (joined via `citations`) · category ← rule · unit = usd
 */
export function adaptEvaluatorResult(
  evaluatorResult: EvaluatorValueLeverResult,
  rule: ValueLeverRule,
  citations: CitationLookup,
): ValueLeverResult {
  const insufficient = evaluatorResult.insufficientEvidence;

  // A lever MUST NOT emit a number without evidence — null the band when
  // insufficient, and only then. `category` is not on the evaluator result; it is
  // recovered from the archetype rule (by key). `unit` is the USD band unit.
  const resolvedCitations: ValueLeverCitation[] = evaluatorResult.evidenceRefs.map(
    (ref) => resolveCitation(ref.factKey, citations),
  );

  return {
    ruleKey: evaluatorResult.key,
    name: evaluatorResult.name,
    category: rule.category,
    valueType: evaluatorResult.valueType,
    status: insufficient ? 'insufficient_evidence' : 'computed',
    low: insufficient ? null : evaluatorResult.low,
    high: insufficient ? null : evaluatorResult.high,
    unit: BAND_UNIT,
    confidence: evaluatorResult.confidence,
    basis: evaluatorResult.basis,
    citations: resolvedCitations,
    missingFactKeys: insufficient ? evaluatorResult.missingEvidence : [],
  };
}
