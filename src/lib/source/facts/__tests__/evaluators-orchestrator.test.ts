// The orchestrator runs every applicable lever against an event's fact map and
// packages ValueLeverResult[]; a missing required input yields insufficient-
// evidence (never a guess). Uses the live AMS archetype's real value-lever rules.

import {
  evaluateValueLever,
  evaluateValueLevers,
  evaluateValueLeversForArchetype,
  type EventFactMap,
} from '../evaluators/orchestrator';
import { getSourceArchetype } from '../../archetypes/registry';

const AMS = getSourceArchetype('AMS_MANAGED_SERVICES')!;

/** A full fact map that satisfies every AMS lever. */
const FULL_FACTS: EventFactMap = {
  // ENHANCEMENT_LEAKAGE
  annual_change_order_spend: 1_000_000,
  recurring_avoidable_pct: 20,
  // VOLUME_BAND_PRICING
  annual_run_cost: 2_000_000,
  variable_cost_share_pct: 50,
  projected_volume_decline_pct: 30,
  // PRODUCTIVITY_CREDITS
  automatable_effort_pool: 3_000_000,
  committed_credit_pct: 10,
  // RETAINED_COST
  retained_fte_delta: 4,
  loaded_fte_cost: 180_000,
  // SLA_ECONOMICS
  at_risk_fee_pool: 5_000_000,
  credit_cap_pct: 10,
  chronic_miss_rate: 8,
  // TRANSITION_RISK
  transition_fee: 800_000,
  overrun_probability: 40,
  overrun_cost_multiple: 1.5,
  // shared
  term_years: 3,
};

describe('evaluateValueLever (single rule)', () => {
  const rule = AMS.valueLeverRules!.find((r) => r.key === 'AMS.ENHANCEMENT_LEAKAGE')!;

  it('produces a computed, typed result with a band and evidence refs', () => {
    const r = evaluateValueLever(rule, FULL_FACTS);
    expect(r.insufficientEvidence).toBe(false);
    expect(r.key).toBe('AMS.ENHANCEMENT_LEAKAGE');
    expect(r.valueType).toBe('protected');
    expect(r.high).toBeCloseTo(600_000, 6);
    expect(r.low).toBeLessThanOrEqual(r.high);
    expect(r.basis).toBe(rule.valueBasis);
    // evidence refs cover the inputs actually present.
    const refKeys = r.evidenceRefs.map((e) => e.factKey).sort();
    expect(refKeys).toEqual(
      ['annual_change_order_spend', 'recurring_avoidable_pct', 'term_years'].sort(),
    );
  });

  it('substitutes values into the derivation trace', () => {
    const r = evaluateValueLever(rule, FULL_FACTS);
    expect(r.derivationTrace).toContain('1000000');
    expect(r.derivationTrace).toContain('20');
    expect(r.derivationTrace).not.toContain('annual_change_order_spend');
  });

  it('missing a required input → insufficient-evidence naming the fact, no band', () => {
    const r = evaluateValueLever(rule, { annual_change_order_spend: 1_000_000 });
    expect(r.insufficientEvidence).toBe(true);
    expect(r.missingEvidence).toEqual(['recurring_avoidable_pct']);
    expect(r.low).toBe(0);
    expect(r.high).toBe(0);
    expect(r.derivationTrace).toContain('Insufficient evidence');
  });
});

describe('evaluateValueLevers (whole archetype)', () => {
  it('runs all 6 AMS levers and computes each with full facts', () => {
    const results = evaluateValueLevers(AMS, FULL_FACTS);
    expect(results).toHaveLength(6);
    expect(results.every((r) => !r.insufficientEvidence)).toBe(true);
    // preserves declaration order
    expect(results.map((r) => r.key)).toEqual([
      'AMS.ENHANCEMENT_LEAKAGE',
      'AMS.VOLUME_BAND_PRICING',
      'AMS.PRODUCTIVITY_CREDITS',
      'AMS.RETAINED_COST',
      'AMS.SLA_ECONOMICS',
      'AMS.TRANSITION_RISK',
    ]);
  });

  it('with no facts, every lever is insufficient-evidence (never a guess)', () => {
    const results = evaluateValueLevers(AMS, {});
    expect(results).toHaveLength(6);
    expect(results.every((r) => r.insufficientEvidence)).toBe(true);
    expect(results.every((r) => r.low === 0 && r.high === 0)).toBe(true);
    expect(results.every((r) => r.missingEvidence.length > 0)).toBe(true);
  });

  it('partial facts compute some levers and flag others', () => {
    const results = evaluateValueLevers(AMS, {
      annual_change_order_spend: 1_000_000,
      recurring_avoidable_pct: 20,
    });
    const leakage = results.find((r) => r.key === 'AMS.ENHANCEMENT_LEAKAGE')!;
    const sla = results.find((r) => r.key === 'AMS.SLA_ECONOMICS')!;
    expect(leakage.insufficientEvidence).toBe(false);
    expect(sla.insufficientEvidence).toBe(true);
  });
});

describe('evaluateValueLeversForArchetype', () => {
  it('resolves the archetype by id', () => {
    const results = evaluateValueLeversForArchetype('AMS_MANAGED_SERVICES', FULL_FACTS);
    expect(results).toHaveLength(6);
  });

  it('returns [] for an unknown archetype', () => {
    expect(evaluateValueLeversForArchetype('NO_SUCH_ARCHETYPE', FULL_FACTS)).toEqual([]);
  });
});
