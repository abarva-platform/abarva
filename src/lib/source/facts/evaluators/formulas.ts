// ─────────────────────────────────────────────────────────────────────────────
// The 6 AMS value-lever formula evaluators.
//
// Each is a pure function `(inputs) => EvaluatorBand | EvaluatorInsufficient`.
// The math mirrors the `computation.method` on the corresponding registry rule;
// the low/high band mirrors its `rangeMethod`. Percentages arrive as whole
// numbers (e.g. 12 for 12%) per the catalog `pct` unit and are divided by 100
// here. A `term_years` input, when present, multiplies annual levers; when the
// rule marks it citationRequired:false it defaults to 1 (a single-year floor)
// rather than blocking the computation.
//
// Band convention: the point estimate uses the observed/committed value; the
// conservative bound discounts the sensitivity driver by CONSERVATIVE_HAIRCUT.
// `low <= high` is always enforced. A required input that is absent or non-finite
// yields insufficient-evidence naming exactly the missing keys.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Evaluator,
  EvaluatorBand,
  EvaluatorConfidence,
  EvaluatorInputs,
  EvaluatorResult,
} from './types';

/**
 * The conservative multiplier applied to the sensitivity driver to derive the
 * LOW bound from the observed/expected point. 0.7 = a 30% haircut. Deterministic
 * constant — the range is a defensibility band, not a forecast.
 */
export const CONSERVATIVE_HAIRCUT = 0.7 as const;

/** Term defaults to a single year when term_years is absent (citationRequired:false). */
const DEFAULT_TERM_YEARS = 1;

// ── Small pure helpers ───────────────────────────────────────────────────────

/** A usable numeric input: present, a number, and finite. */
function has(inputs: EvaluatorInputs, key: string): boolean {
  const v = inputs[key];
  return typeof v === 'number' && Number.isFinite(v);
}

/** Collect the required keys that are absent/non-finite. */
function missingOf(inputs: EvaluatorInputs, required: readonly string[]): string[] {
  return required.filter((k) => !has(inputs, k));
}

/** Whole-number percent (12) → fraction (0.12). */
function pct(value: number): number {
  return value / 100;
}

/** Resolve term_years to a positive integer-ish multiplier, defaulting to 1. */
function termYears(inputs: EvaluatorInputs): number {
  if (!has(inputs, 'term_years')) return DEFAULT_TERM_YEARS;
  const t = inputs.term_years;
  return t > 0 ? t : DEFAULT_TERM_YEARS;
}

/**
 * Build a band from a computed point estimate and the conservative-bound
 * fraction. Orders low/high defensively (negative or inverted inputs never
 * produce low > high). Confidence is passed through from the rule default.
 */
function band(
  point: number,
  conservative: number,
  confidence: EvaluatorConfidence,
): EvaluatorBand {
  const low = Math.min(conservative, point);
  const high = Math.max(conservative, point);
  return { low, high, confidence };
}

// ── AVOIDABLE_SPEND_OVER_TERM (AMS.ENHANCEMENT_LEAKAGE) ──────────────────────
// method: recurring_avoidable_pct × annual_change_order_spend × term_years
// range:  conservative vs observed recurring_avoidable_pct band.
export const avoidableSpendOverTerm: Evaluator = (inputs) => {
  const required = ['annual_change_order_spend', 'recurring_avoidable_pct'] as const;
  const missing = missingOf(inputs, required);
  if (missing.length > 0) return { insufficientEvidence: true, missing };

  const spend = inputs.annual_change_order_spend;
  const avoidable = pct(inputs.recurring_avoidable_pct);
  const term = termYears(inputs);

  const observed = spend * avoidable * term;
  const conservative = spend * avoidable * CONSERVATIVE_HAIRCUT * term;
  return band(observed, conservative, 'med');
};

// ── BAND_STEPDOWN_SAVINGS (AMS.VOLUME_BAND_PRICING) ──────────────────────────
// method: annual_run_cost × variable_cost_share_pct × projected_volume_decline_pct,
//         summed over term_years
// range:  conservative vs expected volume-decline band.
export const bandStepdownSavings: Evaluator = (inputs) => {
  const required = [
    'annual_run_cost',
    'variable_cost_share_pct',
    'projected_volume_decline_pct',
  ] as const;
  const missing = missingOf(inputs, required);
  if (missing.length > 0) return { insufficientEvidence: true, missing };

  const runCost = inputs.annual_run_cost;
  const variableShare = pct(inputs.variable_cost_share_pct);
  const decline = pct(inputs.projected_volume_decline_pct);
  const term = termYears(inputs);

  const observed = runCost * variableShare * decline * term;
  const conservative = runCost * variableShare * decline * CONSERVATIVE_HAIRCUT * term;
  return band(observed, conservative, 'med');
};

// ── PRODUCTIVITY_CREDIT_POOL (AMS.PRODUCTIVITY_CREDITS) ──────────────────────
// method: committed_credit_pct × automatable_effort_pool, ramped over term_years
// range:  vendor-committed vs benchmark credit % (conservative haircut).
export const productivityCreditPool: Evaluator = (inputs) => {
  const required = ['automatable_effort_pool', 'committed_credit_pct'] as const;
  const missing = missingOf(inputs, required);
  if (missing.length > 0) return { insufficientEvidence: true, missing };

  const pool = inputs.automatable_effort_pool;
  const credit = pct(inputs.committed_credit_pct);
  const term = termYears(inputs);

  const observed = credit * pool * term;
  const conservative = credit * pool * CONSERVATIVE_HAIRCUT * term;
  return band(observed, conservative, 'med');
};

// ── RETAINED_EFFORT_DELTA (AMS.RETAINED_COST) ────────────────────────────────
// method: retained_fte_delta × loaded_fte_cost × term_years
//         (a TCO normalization, applied as a debit to over-cheap bids)
// range:  stated vs likely retained-effort delta.
export const retainedEffortDelta: Evaluator = (inputs) => {
  const required = ['retained_fte_delta', 'loaded_fte_cost'] as const;
  const missing = missingOf(inputs, required);
  if (missing.length > 0) return { insufficientEvidence: true, missing };

  const fteDelta = inputs.retained_fte_delta;
  const loadedCost = inputs.loaded_fte_cost;
  const term = termYears(inputs);

  const stated = fteDelta * loadedCost * term;
  // The "likely" delta runs HIGHER than the stated (hidden effort tends to grow),
  // so the conservative bound divides the point by the haircut, widening upward.
  const likely = (fteDelta * loadedCost * term) / CONSERVATIVE_HAIRCUT;
  return band(stated, likely, 'low');
};

// ── SLA_CREDIT_PROTECTION (AMS.SLA_ECONOMICS) ────────────────────────────────
// method: at_risk_fee_pool × credit_cap_pct × chronic_miss_rate
//         (protected value, not a discount)
// range:  historical vs stressed miss rate.
export const slaCreditProtection: Evaluator = (inputs) => {
  const required = ['at_risk_fee_pool', 'credit_cap_pct', 'chronic_miss_rate'] as const;
  const missing = missingOf(inputs, required);
  if (missing.length > 0) return { insufficientEvidence: true, missing };

  const feePool = inputs.at_risk_fee_pool;
  const cap = pct(inputs.credit_cap_pct);
  const missRate = pct(inputs.chronic_miss_rate);

  const historical = feePool * cap * missRate;
  const conservative = feePool * cap * missRate * CONSERVATIVE_HAIRCUT;
  return band(historical, conservative, 'low');
};

// ── TRANSITION_RISK_EXPOSURE (AMS.TRANSITION_RISK) ───────────────────────────
// method: transition_fee × overrun_cost_multiple × overrun_probability
//         (expected avoided overrun)
// range:  benchmark overrun-probability band.
// overrun_cost_multiple is citationRequired:false — defaults to 1.0 (fee-at-risk)
// when absent so the lever still computes rather than blocking.
const DEFAULT_OVERRUN_MULTIPLE = 1.0;
export const transitionRiskExposure: Evaluator = (inputs) => {
  const required = ['transition_fee', 'overrun_probability'] as const;
  const missing = missingOf(inputs, required);
  if (missing.length > 0) return { insufficientEvidence: true, missing };

  const fee = inputs.transition_fee;
  const probability = pct(inputs.overrun_probability);
  const multiple = has(inputs, 'overrun_cost_multiple')
    ? inputs.overrun_cost_multiple
    : DEFAULT_OVERRUN_MULTIPLE;

  const expected = fee * multiple * probability;
  const conservative = fee * multiple * probability * CONSERVATIVE_HAIRCUT;
  return band(expected, conservative, 'low');
};

// ── Registry-keyed dispatch: formulaId → evaluator ───────────────────────────

/**
 * The formula registry. New rules plug in by adding their `formulaId` here; the
 * orchestrator dispatches purely through this map, so the value engine never
 * grows a switch statement.
 */
export const FORMULA_EVALUATORS: Readonly<Record<string, Evaluator>> = Object.freeze({
  AVOIDABLE_SPEND_OVER_TERM: avoidableSpendOverTerm,
  BAND_STEPDOWN_SAVINGS: bandStepdownSavings,
  PRODUCTIVITY_CREDIT_POOL: productivityCreditPool,
  RETAINED_EFFORT_DELTA: retainedEffortDelta,
  SLA_CREDIT_PROTECTION: slaCreditProtection,
  TRANSITION_RISK_EXPOSURE: transitionRiskExposure,
});

/** Look up the evaluator for a formulaId. Returns undefined for unknown ids. */
export function evaluatorFor(formulaId: string): Evaluator | undefined {
  return FORMULA_EVALUATORS[formulaId];
}

/** Every formulaId with a registered evaluator. */
export function registeredFormulaIds(): string[] {
  return Object.keys(FORMULA_EVALUATORS);
}

/** Run a formula by id. Unknown ids yield insufficient-evidence naming the id. */
export function runFormula(
  formulaId: string,
  inputs: EvaluatorInputs,
): EvaluatorResult {
  const fn = evaluatorFor(formulaId);
  if (!fn) {
    return { insufficientEvidence: true, missing: [`formula:${formulaId}`] };
  }
  return fn(inputs);
}
