// Door 1 · evaluators adapter — the integration seam.
//
// Proves the pure mapping from a MERGED `evaluators.ValueLeverResult` onto a Door 1
// `ValueLeverResult`, per the RECONCILIATION CONTRACT in door1/types.ts:
//   (a) a computed evaluator result → Door 1 'computed' with mapped low/high and
//       citations JOINED from the citation map;
//   (b) an insufficient result → Door 1 'insufficient_evidence' with low/high NULL
//       and missingFactKeys populated — NO number;
//   (c) category (and unit) correctly recovered from the archetype rule;
//   (d) a consumed fact with no citation in the map is surfaced HONESTLY, not
//       fabricated.

import { AMS_MANAGED_SERVICES } from '../../archetypes/registry';
import type { ValueLeverRule } from '../../archetypes/types';
import type { ValueLeverResult as EvaluatorValueLeverResult } from '../../facts/evaluators/types';
import {
  adaptEvaluatorResult,
  type CitationLookup,
} from '../evaluators-adapter';

/** The AMS change-order-leakage rule — category 'scope_leakage', valueType 'protected'. */
function leakageRule(): ValueLeverRule {
  const rule = (AMS_MANAGED_SERVICES.valueLeverRules ?? []).find(
    (r) => r.key === 'AMS.ENHANCEMENT_LEAKAGE',
  );
  if (!rule) throw new Error('fixture rule AMS.ENHANCEMENT_LEAKAGE missing');
  return rule;
}

/** A computed evaluator result over two consumed facts. */
function computedEvaluatorResult(): EvaluatorValueLeverResult {
  const rule = leakageRule();
  return {
    key: rule.key,
    name: rule.name,
    valueType: rule.valueType,
    low: 350_000,
    high: 475_000,
    confidence: 'med',
    basis: rule.valueBasis,
    evidenceRefs: [
      { factKey: 'annual_change_order_spend', value: 1_400_000 },
      { factKey: 'recurring_avoidable_pct', value: 50 },
    ],
    derivationTrace: '0.5 × 1400000 × 1',
    insufficientEvidence: false,
    missingEvidence: [],
  };
}

/** An insufficient evaluator result — required evidence absent, no band. */
function insufficientEvaluatorResult(): EvaluatorValueLeverResult {
  const rule = leakageRule();
  return {
    key: rule.key,
    name: rule.name,
    valueType: rule.valueType,
    low: 0,
    high: 0,
    confidence: rule.defaultConfidence,
    basis: rule.valueBasis,
    evidenceRefs: [],
    derivationTrace:
      'Insufficient evidence — missing: annual_change_order_spend, recurring_avoidable_pct',
    insufficientEvidence: true,
    missingEvidence: ['annual_change_order_spend', 'recurring_avoidable_pct'],
  };
}

describe('Door 1 · adaptEvaluatorResult', () => {
  it('(a) maps a computed evaluator result to a Door 1 computed result with joined citations', () => {
    const rule = leakageRule();
    const citations: CitationLookup = {
      annual_change_order_spend: { doc: 'contract.pdf', locator: 'change-order log' },
      recurring_avoidable_pct: { doc: 'ticket-export.csv', locator: 'recurring class' },
    };

    const result = adaptEvaluatorResult(computedEvaluatorResult(), rule, citations);

    expect(result.status).toBe('computed');
    expect(result.ruleKey).toBe('AMS.ENHANCEMENT_LEAKAGE');
    expect(result.name).toBe(rule.name);
    expect(result.valueType).toBe('protected');
    expect(result.confidence).toBe('med');
    expect(result.basis).toBe(rule.valueBasis);

    // low/high carried through, not nulled.
    expect(result.low).toBe(350_000);
    expect(result.high).toBe(475_000);

    // citations JOINED from the map, one per evidence ref.
    expect(result.citations).toEqual([
      { factKey: 'annual_change_order_spend', doc: 'contract.pdf', locator: 'change-order log' },
      { factKey: 'recurring_avoidable_pct', doc: 'ticket-export.csv', locator: 'recurring class' },
    ]);
    // A computed result carries no missing keys.
    expect(result.missingFactKeys).toEqual([]);
  });

  it('(b) maps an insufficient evaluator result to insufficient_evidence with NULL band and missing keys — no number', () => {
    const rule = leakageRule();
    const result = adaptEvaluatorResult(insufficientEvaluatorResult(), rule, {});

    expect(result.status).toBe('insufficient_evidence');
    // Never emit a number without evidence.
    expect(result.low).toBeNull();
    expect(result.high).toBeNull();
    // The missing keys route to "provide this to unlock the number".
    expect(result.missingFactKeys).toEqual([
      'annual_change_order_spend',
      'recurring_avoidable_pct',
    ]);
    // No evidence consumed ⇒ no citations invented.
    expect(result.citations).toEqual([]);
  });

  it('(c) recovers category from the archetype rule (not on the evaluator result) and fixes the USD band unit', () => {
    const rule = leakageRule();
    const result = adaptEvaluatorResult(computedEvaluatorResult(), rule, {
      annual_change_order_spend: { doc: 'contract.pdf', locator: 'change-order log' },
      recurring_avoidable_pct: { doc: 'ticket-export.csv', locator: 'recurring class' },
    });

    // category is NOT on the evaluator result — recovered from the rule.
    expect(result.category).toBe('scope_leakage');
    expect(result.category).toBe(rule.category);
    // band unit is USD (evaluator emits USD-over-term bands).
    expect(result.unit).toBe('usd');
  });

  it('(d) surfaces a consumed fact with no citation in the map honestly — flagged, never fabricated', () => {
    const rule = leakageRule();
    // Only ONE of the two consumed facts has a citation in the map.
    const citations: CitationLookup = {
      annual_change_order_spend: { doc: 'contract.pdf', locator: 'change-order log' },
    };

    const result = adaptEvaluatorResult(computedEvaluatorResult(), rule, citations);

    // Both consumed facts still appear — the missing one is not dropped.
    expect(result.citations).toHaveLength(2);

    const cited = result.citations.find((c) => c.factKey === 'annual_change_order_spend');
    expect(cited).toEqual({
      factKey: 'annual_change_order_spend',
      doc: 'contract.pdf',
      locator: 'change-order log',
    });

    // The uncited fact is flagged with an empty locator — NOT fabricated.
    const uncited = result.citations.find((c) => c.factKey === 'recurring_avoidable_pct');
    expect(uncited).toBeDefined();
    expect(uncited?.locator).toBe('');
    expect(uncited?.doc).toBe('citation unavailable');
    // Crucially: the flagged doc is not a made-up real-looking source.
    expect(uncited?.doc).not.toMatch(/\.(pdf|csv|xlsx|docx)/i);
  });
});
