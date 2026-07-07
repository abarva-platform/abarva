// ─────────────────────────────────────────────────────────────────────────────
// Value-lever evaluator contract — the deterministic math layer.
//
// The archetype `valueLeverRules` DECLARE what to compute (method + formulaId +
// inputs); the evaluators here COMPUTE it. Every evaluator is a pure function:
// same inputs → same { low, high, confidence } band, or an explicit
// `insufficientEvidence` verdict naming the missing inputs. No LLM, no
// randomness, no point estimates. This is the module the value engine dispatches
// into by `formulaId`.
// ─────────────────────────────────────────────────────────────────────────────

import type { ValueType } from '../../archetypes/types';

/** Confidence emitted by an evaluator (mirrors ValueLeverRule.defaultConfidence). */
export type EvaluatorConfidence = 'low' | 'med' | 'high';

/**
 * A resolved input bag for one evaluator run: fact key → numeric value. Values
 * come from `source_event_facts` (or a test fixture) — never model-invented. A
 * key that is absent from the map is treated as "no evidence" for that input.
 */
export type EvaluatorInputs = Record<string, number>;

/** A successful, banded computation. `low`/`high` are USD (over the term). */
export interface EvaluatorBand {
  low: number;
  high: number;
  confidence: EvaluatorConfidence;
}

/**
 * The evaluator could not compute because one or more required inputs were
 * missing (or non-finite). `missing` names the offending fact keys so the UI can
 * request exactly the evidence needed. The lever renders insufficient-evidence,
 * never a guess.
 */
export interface EvaluatorInsufficient {
  insufficientEvidence: true;
  missing: string[];
}

export type EvaluatorResult = EvaluatorBand | EvaluatorInsufficient;

/** A pure evaluator: the `formulaId` implementation. */
export type Evaluator = (inputs: EvaluatorInputs) => EvaluatorResult;

/** Narrowing helper — true when the evaluator produced a band. */
export function isBand(result: EvaluatorResult): result is EvaluatorBand {
  return (result as EvaluatorInsufficient).insufficientEvidence !== true;
}

/** Narrowing helper — true when the evaluator lacked required evidence. */
export function isInsufficient(
  result: EvaluatorResult,
): result is EvaluatorInsufficient {
  return (result as EvaluatorInsufficient).insufficientEvidence === true;
}

// ── Orchestrator output: a fully-resolved value-lever instance ───────────────

/** Where a lever's inputs came from — one provenance line per consumed fact. */
export interface EvidenceRef {
  /** The fact key that fed the computation. */
  factKey: string;
  /** The numeric value used. */
  value: number;
}

/**
 * A single computed value-lever result — the orchestrator's output row and the
 * shape the persistence layer and UI consume. Carries the banded number, the
 * value TYPE it contributes to, and a plain-English derivation trace so the math
 * is auditable end-to-end.
 */
export interface ValueLeverResult {
  /** The archetype rule key, e.g. 'AMS.ENHANCEMENT_LEAKAGE'. */
  key: string;
  /** Human name from the rule. */
  name: string;
  /** Which of the five value types this lever contributes to. */
  valueType: ValueType;
  /** Low bound of the estimate (USD over term). */
  low: number;
  /** High bound of the estimate (USD over term). */
  high: number;
  /** Confidence in the estimate. */
  confidence: EvaluatorConfidence;
  /** The plain-English basis (from the rule's valueBasis). */
  basis: string;
  /** The facts that fed the computation (audit trail). */
  evidenceRefs: EvidenceRef[];
  /** Human-readable derivation, e.g. the method string with values substituted. */
  derivationTrace: string;
  /** True when the lever could not be computed for lack of evidence. */
  insufficientEvidence: boolean;
  /** When insufficient, the fact keys that were missing. */
  missingEvidence: string[];
}

// ── The value-type waterfall (roll-up) ───────────────────────────────────────

/** One value-type band in the waterfall: summed low/high across its levers. */
export interface ValueTypeBand {
  valueType: ValueType;
  low: number;
  high: number;
  /** The rolled-up confidence (weakest-link across contributing levers). */
  confidence: EvaluatorConfidence;
  /** Keys of the levers that contributed a computed band to this type. */
  leverKeys: string[];
}

/**
 * The value-type waterfall — the honest roll-up. Levers are grouped by their
 * five value types; each type carries a summed low/high band. There is NO single
 * headline number: `protected` and `risk_adjusted` are stated separately and
 * never folded into a savings total. Levers that lacked evidence are surfaced,
 * not silently dropped.
 */
export interface ValueWaterfall {
  /** One band per value type that has at least one computed lever, in type order. */
  bands: ValueTypeBand[];
  /** Levers that could not be computed (insufficient evidence), by key. */
  insufficientLevers: string[];
  /**
   * The count of levers that produced a computed band. Cross-check for the UI:
   * bands' leverKeys should sum to this.
   */
  computedLeverCount: number;
}
