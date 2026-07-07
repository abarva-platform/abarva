// Deterministic math + insufficient-evidence path for each of the 6 AMS formulas.
// The formulas are pure: same inputs → same band. Percentages are whole numbers.

import {
  CONSERVATIVE_HAIRCUT,
  avoidableSpendOverTerm,
  bandStepdownSavings,
  productivityCreditPool,
  retainedEffortDelta,
  slaCreditProtection,
  transitionRiskExposure,
  runFormula,
  evaluatorFor,
  registeredFormulaIds,
} from '../evaluators/formulas';
import { isBand, isInsufficient } from '../evaluators/types';

describe('AVOIDABLE_SPEND_OVER_TERM', () => {
  it('computes recurring_avoidable_pct × annual_change_order_spend × term_years', () => {
    // 20% of $1,000,000 over 3 years = $600,000 observed.
    const r = avoidableSpendOverTerm({
      annual_change_order_spend: 1_000_000,
      recurring_avoidable_pct: 20,
      term_years: 3,
    });
    expect(isBand(r)).toBe(true);
    if (!isBand(r)) return;
    expect(r.high).toBeCloseTo(600_000, 6);
    expect(r.low).toBeCloseTo(600_000 * CONSERVATIVE_HAIRCUT, 6);
    expect(r.low).toBeLessThanOrEqual(r.high);
    expect(r.confidence).toBe('med');
  });

  it('defaults term_years to 1 when absent (citationRequired:false)', () => {
    const r = avoidableSpendOverTerm({
      annual_change_order_spend: 1_000_000,
      recurring_avoidable_pct: 20,
    });
    expect(isBand(r)).toBe(true);
    if (!isBand(r)) return;
    expect(r.high).toBeCloseTo(200_000, 6);
  });

  it('is deterministic across runs', () => {
    const inputs = { annual_change_order_spend: 500_000, recurring_avoidable_pct: 15 };
    expect(avoidableSpendOverTerm(inputs)).toEqual(avoidableSpendOverTerm(inputs));
  });

  it('yields insufficient-evidence naming the missing required inputs', () => {
    const r = avoidableSpendOverTerm({ annual_change_order_spend: 1_000_000 });
    expect(isInsufficient(r)).toBe(true);
    if (!isInsufficient(r)) return;
    expect(r.missing).toEqual(['recurring_avoidable_pct']);
  });

  it('treats a non-finite input as missing', () => {
    const r = avoidableSpendOverTerm({
      annual_change_order_spend: Number.NaN,
      recurring_avoidable_pct: 20,
    });
    expect(isInsufficient(r)).toBe(true);
    if (!isInsufficient(r)) return;
    expect(r.missing).toContain('annual_change_order_spend');
  });
});

describe('BAND_STEPDOWN_SAVINGS', () => {
  it('computes run_cost × variable_share × decline over term', () => {
    // $2,000,000 × 50% variable × 30% decline × 2 yrs = $600,000.
    const r = bandStepdownSavings({
      annual_run_cost: 2_000_000,
      variable_cost_share_pct: 50,
      projected_volume_decline_pct: 30,
      term_years: 2,
    });
    expect(isBand(r)).toBe(true);
    if (!isBand(r)) return;
    expect(r.high).toBeCloseTo(600_000, 6);
    expect(r.low).toBeCloseTo(600_000 * CONSERVATIVE_HAIRCUT, 6);
  });

  it('needs all three required inputs', () => {
    const r = bandStepdownSavings({
      annual_run_cost: 2_000_000,
      variable_cost_share_pct: 50,
    });
    expect(isInsufficient(r)).toBe(true);
    if (!isInsufficient(r)) return;
    expect(r.missing).toEqual(['projected_volume_decline_pct']);
  });
});

describe('PRODUCTIVITY_CREDIT_POOL', () => {
  it('computes committed_credit_pct × automatable_effort_pool over term', () => {
    // 10% × $3,000,000 × 3 yrs = $900,000.
    const r = productivityCreditPool({
      automatable_effort_pool: 3_000_000,
      committed_credit_pct: 10,
      term_years: 3,
    });
    expect(isBand(r)).toBe(true);
    if (!isBand(r)) return;
    expect(r.high).toBeCloseTo(900_000, 6);
    expect(r.low).toBeCloseTo(900_000 * CONSERVATIVE_HAIRCUT, 6);
  });

  it('missing committed_credit_pct → insufficient', () => {
    const r = productivityCreditPool({ automatable_effort_pool: 3_000_000 });
    expect(isInsufficient(r)).toBe(true);
    if (!isInsufficient(r)) return;
    expect(r.missing).toEqual(['committed_credit_pct']);
  });
});

describe('RETAINED_EFFORT_DELTA', () => {
  it('computes retained_fte_delta × loaded_fte_cost × term, widening upward', () => {
    // 4 FTE × $180,000 × 2 yrs = $1,440,000 stated; likely = /haircut (higher).
    const r = retainedEffortDelta({
      retained_fte_delta: 4,
      loaded_fte_cost: 180_000,
      term_years: 2,
    });
    expect(isBand(r)).toBe(true);
    if (!isBand(r)) return;
    const stated = 4 * 180_000 * 2;
    expect(r.low).toBeCloseTo(stated, 6);
    expect(r.high).toBeCloseTo(stated / CONSERVATIVE_HAIRCUT, 6);
    expect(r.confidence).toBe('low');
  });

  it('missing loaded_fte_cost → insufficient', () => {
    const r = retainedEffortDelta({ retained_fte_delta: 4 });
    expect(isInsufficient(r)).toBe(true);
    if (!isInsufficient(r)) return;
    expect(r.missing).toEqual(['loaded_fte_cost']);
  });
});

describe('SLA_CREDIT_PROTECTION', () => {
  it('computes at_risk_fee_pool × credit_cap_pct × chronic_miss_rate', () => {
    // $5,000,000 × 10% × 8% = $40,000.
    const r = slaCreditProtection({
      at_risk_fee_pool: 5_000_000,
      credit_cap_pct: 10,
      chronic_miss_rate: 8,
    });
    expect(isBand(r)).toBe(true);
    if (!isBand(r)) return;
    expect(r.high).toBeCloseTo(40_000, 6);
    expect(r.low).toBeCloseTo(40_000 * CONSERVATIVE_HAIRCUT, 6);
  });

  it('needs all three required inputs', () => {
    const r = slaCreditProtection({ at_risk_fee_pool: 5_000_000, credit_cap_pct: 10 });
    expect(isInsufficient(r)).toBe(true);
    if (!isInsufficient(r)) return;
    expect(r.missing).toEqual(['chronic_miss_rate']);
  });
});

describe('TRANSITION_RISK_EXPOSURE', () => {
  it('computes transition_fee × overrun_cost_multiple × overrun_probability', () => {
    // $800,000 × 1.5 × 40% = $480,000.
    const r = transitionRiskExposure({
      transition_fee: 800_000,
      overrun_probability: 40,
      overrun_cost_multiple: 1.5,
    });
    expect(isBand(r)).toBe(true);
    if (!isBand(r)) return;
    expect(r.high).toBeCloseTo(480_000, 6);
    expect(r.low).toBeCloseTo(480_000 * CONSERVATIVE_HAIRCUT, 6);
  });

  it('defaults overrun_cost_multiple to 1.0 when absent (citationRequired:false)', () => {
    const r = transitionRiskExposure({ transition_fee: 800_000, overrun_probability: 40 });
    expect(isBand(r)).toBe(true);
    if (!isBand(r)) return;
    expect(r.high).toBeCloseTo(320_000, 6); // 800k × 1.0 × 0.40
  });

  it('missing overrun_probability → insufficient', () => {
    const r = transitionRiskExposure({ transition_fee: 800_000 });
    expect(isInsufficient(r)).toBe(true);
    if (!isInsufficient(r)) return;
    expect(r.missing).toEqual(['overrun_probability']);
  });
});

describe('formula dispatch registry', () => {
  it('registers all 6 AMS formulaIds', () => {
    expect(registeredFormulaIds().sort()).toEqual(
      [
        'AVOIDABLE_SPEND_OVER_TERM',
        'BAND_STEPDOWN_SAVINGS',
        'PRODUCTIVITY_CREDIT_POOL',
        'RETAINED_EFFORT_DELTA',
        'SLA_CREDIT_PROTECTION',
        'TRANSITION_RISK_EXPOSURE',
      ].sort(),
    );
  });

  it('evaluatorFor resolves a known id and returns undefined for unknown', () => {
    expect(evaluatorFor('AVOIDABLE_SPEND_OVER_TERM')).toBe(avoidableSpendOverTerm);
    expect(evaluatorFor('NOT_A_FORMULA')).toBeUndefined();
  });

  it('runFormula dispatches to the right evaluator', () => {
    const direct = avoidableSpendOverTerm({
      annual_change_order_spend: 1_000_000,
      recurring_avoidable_pct: 20,
    });
    const viaDispatch = runFormula('AVOIDABLE_SPEND_OVER_TERM', {
      annual_change_order_spend: 1_000_000,
      recurring_avoidable_pct: 20,
    });
    expect(viaDispatch).toEqual(direct);
  });

  it('runFormula on an unknown id yields insufficient-evidence naming the formula', () => {
    const r = runFormula('MADE_UP', {});
    expect(isInsufficient(r)).toBe(true);
    if (!isInsufficient(r)) return;
    expect(r.missing).toEqual(['formula:MADE_UP']);
  });
});
