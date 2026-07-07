// ─────────────────────────────────────────────────────────────────────────────
// The value-lever orchestrator.
//
// Given an archetype's `valueLeverRules` and an event's resolved facts
// (factKey → value, sourced from source_event_facts), run every applicable lever
// through its deterministic evaluator and produce a ValueLeverResult[]. A lever
// whose required inputs are absent yields insufficient-evidence — never a guess.
//
// Pure: no I/O, no LLM. The value engine wires the fact map in; this decides,
// per rule, whether the math can run and packages the audited result.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  SourceEventArchetype,
  ValueLeverRule,
} from '../../archetypes/types';
import { getSourceArchetype } from '../../archetypes/registry';
import { runFormula } from './formulas';
import {
  isInsufficient,
  type EvaluatorInputs,
  type EvidenceRef,
  type ValueLeverResult,
} from './types';

/** A resolved fact map for one event: fact key → numeric value. */
export type EventFactMap = Record<string, number>;

/**
 * Substitute the fact values into the rule's human method string, producing an
 * audit-friendly derivation line. Unknown keys are left as their token so the
 * trace still reads. Deterministic — same inputs, same trace.
 */
function buildDerivationTrace(
  rule: ValueLeverRule,
  inputs: EvaluatorInputs,
): string {
  let trace = rule.computation.method;
  for (const input of rule.computation.inputs) {
    const value = inputs[input.key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      // Word-bounded replace so 'term_years' never clobbers a substring.
      trace = trace.replace(
        new RegExp(`\\b${escapeRegExp(input.key)}\\b`, 'g'),
        String(value),
      );
    }
  }
  return trace;
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The evidence refs actually consumed by a rule (present, finite inputs only). */
function evidenceRefsFor(
  rule: ValueLeverRule,
  facts: EventFactMap,
): EvidenceRef[] {
  const refs: EvidenceRef[] = [];
  for (const input of rule.computation.inputs) {
    const value = facts[input.key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      refs.push({ factKey: input.key, value });
    }
  }
  return refs;
}

/**
 * Evaluate a single value-lever rule against an event's facts. Always returns a
 * ValueLeverResult: either a computed band or an insufficient-evidence row that
 * names exactly which facts are missing.
 */
export function evaluateValueLever(
  rule: ValueLeverRule,
  facts: EventFactMap,
): ValueLeverResult {
  // Only pass the inputs this rule declares — the evaluator is scoped to its keys.
  const inputs: EvaluatorInputs = {};
  for (const input of rule.computation.inputs) {
    const value = facts[input.key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      inputs[input.key] = value;
    }
  }

  const result = runFormula(rule.computation.formulaId, inputs);

  const base = {
    key: rule.key,
    name: rule.name,
    valueType: rule.valueType,
    basis: rule.valueBasis,
    evidenceRefs: evidenceRefsFor(rule, facts),
  };

  if (isInsufficient(result)) {
    return {
      ...base,
      low: 0,
      high: 0,
      confidence: rule.defaultConfidence,
      derivationTrace: `Insufficient evidence — missing: ${result.missing.join(', ')}`,
      insufficientEvidence: true,
      missingEvidence: result.missing,
    };
  }

  return {
    ...base,
    low: result.low,
    high: result.high,
    confidence: result.confidence,
    derivationTrace: buildDerivationTrace(rule, inputs),
    insufficientEvidence: false,
    missingEvidence: [],
  };
}

/**
 * Run every value-lever rule on an archetype against an event's facts. Rules
 * without a `computation.formulaId` evaluator produce insufficient-evidence.
 * Order follows the archetype's rule declaration order (stable for the UI).
 */
export function evaluateValueLevers(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
): ValueLeverResult[] {
  const rules = archetype.valueLeverRules ?? [];
  return rules.map((rule) => evaluateValueLever(rule, facts));
}

/**
 * Convenience: resolve the archetype by id, then evaluate. Returns an empty
 * array for an unknown archetype (the caller decides how to surface that).
 */
export function evaluateValueLeversForArchetype(
  archetypeId: string,
  facts: EventFactMap,
): ValueLeverResult[] {
  const archetype = getSourceArchetype(archetypeId);
  if (!archetype) return [];
  return evaluateValueLevers(archetype, facts);
}
