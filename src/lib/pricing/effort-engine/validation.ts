/**
 * Nexus Pricing Engine — PR4 validation helpers.
 *
 * Batch/whole-pack checks (useful before a pack is committed, and as the
 * literal mechanism this PR's determinism proof uses) — pure, no I/O.
 */
import { parseEffortOperation, UnknownEffortOperationError, InvalidEffortRuleParametersError } from "./rule-interpreter";
import type { EffortEnginePack, RangeResult } from "./types";

export interface PackValidationIssue {
  code: string;
  message: string;
}

/** Every effort rule in the pack must parse under the closed operation set — collects every failure rather than throwing on the first. */
export function validateClosedOperationSet(pack: EffortEnginePack): PackValidationIssue[] {
  const issues: PackValidationIssue[] = [];
  for (const rule of pack.effortRules) {
    try {
      parseEffortOperation({
        operation: rule.operation,
        driver_code: rule.driver_code,
        parameters: rule.parameters,
        rule_code: rule.rule_code,
      });
    } catch (err) {
      if (err instanceof UnknownEffortOperationError || err instanceof InvalidEffortRuleParametersError) {
        issues.push({ code: err.name, message: err.message });
      } else {
        throw err;
      }
    }
  }
  return issues;
}

/** Every activity pack's role-mix allocation should sum to ~100% (95-105 tolerance band, matching the generator script's own check). */
export function validateRoleMixAllocations(pack: EffortEnginePack): PackValidationIssue[] {
  const totals = new Map<string, number>();
  for (const rm of pack.roleMix) {
    totals.set(rm.activity_pack_code, (totals.get(rm.activity_pack_code) ?? 0) + rm.allocation_pct);
  }
  const issues: PackValidationIssue[] = [];
  for (const [packCode, total] of totals) {
    if (total < 95 || total > 105) {
      issues.push({
        code: "role_mix_allocation_out_of_range",
        message: `activity pack '${packCode}' role-mix allocation sums to ${total}%, expected ~100%`,
      });
    }
  }
  return issues;
}

/** Every activity pack mapped to an archetype (required/conditional) must have at least one effort rule. */
export function validateEveryMappedPackHasRules(pack: EffortEnginePack): PackValidationIssue[] {
  const packCodesWithRules = new Set(pack.effortRules.map((r) => r.activity_pack_code));
  const issues: PackValidationIssue[] = [];
  for (const mapRow of pack.archetypeActivityMap) {
    if (mapRow.applicability === "excluded") continue;
    if (!packCodesWithRules.has(mapRow.activity_pack_code)) {
      issues.push({
        code: "mapped_pack_has_no_rules",
        message: `archetype '${mapRow.archetype_code}' maps to activity pack '${mapRow.activity_pack_code}', which has no pricing_effort_rules rows`,
      });
    }
  }
  return issues;
}

export function validatePack(pack: EffortEnginePack): PackValidationIssue[] {
  return [
    ...validateClosedOperationSet(pack),
    ...validateRoleMixAllocations(pack),
    ...validateEveryMappedPackHasRules(pack),
  ];
}

// ---------------------------------------------------------------------------
// Range invariant
// ---------------------------------------------------------------------------

export class RangeInvariantViolationError extends Error {
  constructor(range: RangeResult) {
    super(`range_invariant_violation: low ${range.lowCents} > expected ${range.expectedCents} or expected > high ${range.highCents}`);
    this.name = "RangeInvariantViolationError";
  }
}

export function assertLowExpectedHighInvariant(range: RangeResult): RangeResult {
  if (!(range.lowCents <= range.expectedCents && range.expectedCents <= range.highCents)) {
    throw new RangeInvariantViolationError(range);
  }
  return range;
}

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

/**
 * Runs `compute` twice and deep-compares the two results via their
 * normalized JSON serialization (stable — `EffortEngineOutput` and its line
 * items are plain data with no `Date`/`Map`/`Set`/function values, so a
 * structural JSON comparison is exact here). Throws if the two runs differ
 * in ANY way — this is the literal mechanism brief §12's "run the
 * calculation twice, assert deep equality" requirement uses, reusable
 * outside tests too (e.g. a future snapshot-service could call this before
 * persisting).
 */
export function assertDeterministicRecomputation<T>(compute: () => T): T {
  const first = compute();
  const second = compute();
  const firstJson = JSON.stringify(first);
  const secondJson = JSON.stringify(second);
  if (firstJson !== secondJson) {
    throw new Error("non_deterministic_recomputation: two runs of the same computation with the same inputs produced different output");
  }
  return first;
}
