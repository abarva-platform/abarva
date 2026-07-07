// ─────────────────────────────────────────────────────────────────────────────
// Door 1 · Step 2 — DIAGNOSE.
//
// Given an event's facts (a factKey→value map read out of source_event_facts) and
// its resolved archetype, run the LEAKAGE-oriented value levers and classify each
// result into a Door-1 recovery bucket. The output is a `LeakageDiagnosis`: the
// findings that produced a defensible, cited band, plus the levers that fired but
// lacked evidence (surfaced as "provide this to quantify", never guessed).
//
// "Leakage-oriented" = the levers a diagnosis of an EXISTING contract can run
// without vendor competition: change-order / scope leakage, volume-band price
// drift, retained-cost normalization, SLA credit economics, transition-fee risk,
// and productivity credits. These are exactly the archetype `valueLeverRules`
// whose value types are protected / risk_adjusted / incremental_negotiated —
// i.e. recoverable from the incumbent, not dependent on a rebid.
// ─────────────────────────────────────────────────────────────────────────────

import type { SourceEventArchetype, ValueLeverRule, ValueType } from '../archetypes/types';
import { evaluateLeverRule } from './evaluate';
import type {
  Door1FactMap,
  LeakageDiagnosis,
  LeakageFinding,
  RecoveryBucket,
} from './types';

/**
 * The value types a Door-1 diagnosis can recover from the incumbent, mapped to the
 * recovery bucket they roll into. `expected_concession` and `solution_tightening`
 * are Door-2 (competitive-event) constructs and are excluded — a diagnosis of a
 * signed contract does not run a competitive round, so it never claims them here.
 */
const VALUE_TYPE_TO_BUCKET: Partial<Record<ValueType, RecoveryBucket>> = {
  protected: 'protected',
  risk_adjusted: 'risk_adjusted',
  incremental_negotiated: 'incremental',
  // solution_tightening lands under productivity-style credits — treat as
  // incremental value recoverable by folding the credit into the incumbent deal.
  solution_tightening: 'incremental',
};

/** Is this rule one a Door-1 (no-RFP) diagnosis can run? */
export function isLeakageLever(rule: ValueLeverRule): boolean {
  return VALUE_TYPE_TO_BUCKET[rule.valueType] !== undefined;
}

/** The leakage-oriented levers of an archetype, stable-ordered by rule key. */
export function leakageLeversFor(
  archetype: SourceEventArchetype,
): ValueLeverRule[] {
  return (archetype.valueLeverRules ?? [])
    .filter(isLeakageLever)
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Run the diagnose step. Deterministic: same archetype + same facts → same
 * diagnosis.
 */
export function diagnoseLeakage(input: {
  eventId: string;
  archetype: SourceEventArchetype;
  facts: Door1FactMap;
}): LeakageDiagnosis {
  const { eventId, archetype, facts } = input;
  const levers = leakageLeversFor(archetype);

  const findings: LeakageFinding[] = [];
  const needsEvidence: LeakageFinding[] = [];

  for (const rule of levers) {
    const result = evaluateLeverRule(rule, facts);
    const recoveryBucket = VALUE_TYPE_TO_BUCKET[rule.valueType] ?? 'risk_adjusted';
    const finding: LeakageFinding = { ...result, recoveryBucket };
    if (finding.status === 'computed') {
      findings.push(finding);
    } else {
      needsEvidence.push(finding);
    }
  }

  // Highest-value findings first — the diagnosis leads with the biggest leak.
  findings.sort((a, b) => (b.high ?? 0) - (a.high ?? 0));

  const unlockFactKeys = Array.from(
    new Set(needsEvidence.flatMap((f) => f.missingFactKeys)),
  ).sort();

  return {
    eventId,
    archetypeId: archetype.id,
    findings,
    needsEvidence,
    unlockFactKeys,
  };
}
