// ─────────────────────────────────────────────────────────────────────────────
// Door 1 — reference value-lever evaluator.
//
// RECONCILIATION NOTE: a parallel slice owns the production value-lever evaluator.
// Door 1 declares the `ValueLeverResult` output contract (see types.ts) and, until
// that slice lands, ships this SELF-CONTAINED reference evaluator so the
// diagnose→bridge→play flow is deterministic and testable today. When the real
// evaluator arrives, swap `evaluateLeverRule` for it — Door 1 reads only the
// declared `ValueLeverResult` fields, so anything emitting that shape reconciles.
//
// The evaluator is DETERMINISTIC and DEFENSIBLE by construction:
//   • the number is derived from typed facts by `formulaId` — never authored.
//   • a `citationRequired` input with no cited fact yields
//     `insufficient_evidence`, never a guess (mirrors `onMissingEvidence`).
//   • the output is always a low/high BAND, never a bare point — the low/high
//     spread is a fixed conservatism band around the point (rangeMethod gloss).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ValueComputationInput,
  ValueLeverRule,
} from '../archetypes/types';
import type {
  Door1FactMap,
  Door1FactValue,
  ValueLeverCitation,
  ValueLeverResult,
} from './types';

/** Fixed conservatism band (±) applied around a lever's point estimate. */
const BAND_SPREAD = 0.15;

/** A fact value normalized to a number + optional citation. */
interface ResolvedFact {
  value: number;
  citation: ValueLeverCitation | null;
}

/** Read a fact from the map, normalizing the bare-number vs Door1FactValue forms. */
function resolveFact(
  factMap: Door1FactMap,
  key: string,
): ResolvedFact | undefined {
  const raw = factMap[key];
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return undefined;
    return { value: raw, citation: null };
  }
  const fv = raw as Door1FactValue;
  if (typeof fv.value !== 'number' || !Number.isFinite(fv.value)) return undefined;
  return {
    value: fv.value,
    citation: fv.citation
      ? { factKey: key, doc: fv.citation.doc, locator: fv.citation.locator }
      : null,
  };
}

/** A pct fact may be stored as 14 (percent) or 0.14 (ratio); normalize to a ratio. */
function asRatio(value: number): number {
  return value > 1 ? value / 100 : value;
}

/**
 * The deterministic formula table. Each entry is a pure fn: given the resolved
 * fact values (keyed), return the POINT estimate. The band is derived from the
 * point by BAND_SPREAD. Keys mirror `ValueComputation.formulaId` in the registry.
 * A formula reads only keys the rule declares as inputs — never invents one.
 */
const FORMULAS: Record<string, (f: Record<string, number>) => number> = {
  // avoidable share × annual change-order spend × term
  AVOIDABLE_SPEND_OVER_TERM: (f) =>
    asRatio(f.recurring_avoidable_pct ?? 0) *
    (f.annual_change_order_spend ?? 0) *
    Math.max(1, f.term_years ?? 1),
  // run cost × variable share × projected volume decline, over term
  BAND_STEPDOWN_SAVINGS: (f) =>
    (f.annual_run_cost ?? 0) *
    asRatio(f.variable_cost_share_pct ?? 0) *
    asRatio(f.projected_volume_decline_pct ?? 0) *
    Math.max(1, f.term_years ?? 1),
  // committed credit % × automatable effort pool, ramped over term (half-ramp)
  PRODUCTIVITY_CREDIT_POOL: (f) =>
    asRatio(f.committed_credit_pct ?? 0) *
    (f.automatable_effort_pool ?? 0) *
    Math.max(1, (f.term_years ?? 1) / 2),
  // retained FTE delta × loaded FTE cost × term (a normalization debit)
  RETAINED_EFFORT_DELTA: (f) =>
    (f.retained_fte_delta ?? 0) *
    (f.loaded_fte_cost ?? 0) *
    Math.max(1, f.term_years ?? 1),
  // at-risk fee pool × credit cap × chronic-miss rate (protected value)
  SLA_CREDIT_PROTECTION: (f) =>
    (f.at_risk_fee_pool ?? 0) *
    asRatio(f.credit_cap_pct ?? 0) *
    asRatio(f.chronic_miss_rate ?? 0),
  // transition fee × overrun cost multiple × overrun probability
  TRANSITION_RISK_EXPOSURE: (f) =>
    (f.transition_fee ?? 0) *
    (f.overrun_cost_multiple ?? 1) *
    asRatio(f.overrun_probability ?? 0),
};

/**
 * Evaluate one value-lever rule against a fact map → a `ValueLeverResult`.
 *
 * Deterministic: same rule + same facts → same result. Returns
 * `insufficient_evidence` (never a guess) when any `citationRequired` input has no
 * cited fact value, or when the rule's `formulaId` has no reference formula.
 */
export function evaluateLeverRule(
  rule: ValueLeverRule,
  factMap: Door1FactMap,
): ValueLeverResult {
  const { computation } = rule;
  const inputs: ValueComputationInput[] = computation.inputs;

  const values: Record<string, number> = {};
  const citations: ValueLeverCitation[] = [];
  const missingFactKeys: string[] = [];

  for (const input of inputs) {
    const resolved = resolveFact(factMap, input.key);
    if (!resolved) {
      // A required-citation input that is absent blocks the whole lever.
      if (input.citationRequired) missingFactKeys.push(input.key);
      continue;
    }
    values[input.key] = resolved.value;
    if (resolved.citation) citations.push(resolved.citation);
  }

  const formula = FORMULAS[computation.formulaId];

  const insufficient =
    missingFactKeys.length > 0 || !formula;

  if (insufficient) {
    return {
      ruleKey: rule.key,
      name: rule.name,
      category: rule.category,
      valueType: rule.valueType,
      status: 'insufficient_evidence',
      low: null,
      high: null,
      unit: 'usd',
      confidence: rule.defaultConfidence,
      basis: rule.valueBasis,
      citations,
      missingFactKeys: !formula && missingFactKeys.length === 0
        ? // No reference formula for this rule yet — surface every required key
          // so the integrator knows the evaluator, not the evidence, is the gap.
          inputs.filter((i) => i.citationRequired).map((i) => i.key)
        : missingFactKeys,
    };
  }

  const point = formula(values);
  const low = round(point * (1 - BAND_SPREAD));
  const high = round(point * (1 + BAND_SPREAD));

  return {
    ruleKey: rule.key,
    name: rule.name,
    category: rule.category,
    valueType: rule.valueType,
    status: 'computed',
    low: Math.max(0, low),
    high: Math.max(0, high),
    unit: 'usd',
    confidence: rule.defaultConfidence,
    basis: rule.valueBasis,
    citations,
    missingFactKeys: [],
  };
}

function round(n: number): number {
  return Math.round(n);
}
