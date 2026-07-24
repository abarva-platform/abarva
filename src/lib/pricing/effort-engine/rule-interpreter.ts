/**
 * Nexus Pricing Engine — PR4 rule interpreter.
 *
 * A typed, closed-operation-set evaluator (brief §7.3) — a switch/
 * discriminated-union, NOT `eval`, NOT a formula-string parser, NOT dynamic
 * SQL (brief §2.7's explicit prohibition). `parseEffortOperation` is the
 * ONLY place a raw DB row's `(operation, driver_code, parameters)` triple is
 * turned into the typed `EffortOperation` union from `types.ts`; every other
 * module in this engine works with the typed union, never the raw JSONB
 * shape.
 */
import type { EffortOperation } from "./types";

/** The raw, untyped shape a `pricing_effort_rules` row (or a hand-built test fixture) presents before parsing — `operation` is a plain string here deliberately, since validating/narrowing an untrusted string into the typed union is this function's entire job. */
export interface RawEffortRuleRowInput {
  operation: string;
  driver_code: string | null;
  parameters: Record<string, unknown>;
  rule_code: string;
}

export class UnknownEffortOperationError extends Error {
  constructor(operation: string) {
    super(`unknown_effort_operation: '${operation}' is not one of the 11 closed operations`);
    this.name = "UnknownEffortOperationError";
  }
}

export class InvalidEffortRuleParametersError extends Error {
  constructor(ruleCode: string, reason: string) {
    super(`invalid_effort_rule_parameters: rule '${ruleCode}' — ${reason}`);
    this.name = "InvalidEffortRuleParametersError";
  }
}

function num(params: Record<string, unknown>, key: string, ruleCode: string): number {
  const v = params[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new InvalidEffortRuleParametersError(ruleCode, `expected numeric '${key}'`);
  }
  return v;
}

function str(params: Record<string, unknown>, key: string, ruleCode: string): string {
  const v = params[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new InvalidEffortRuleParametersError(ruleCode, `expected non-empty string '${key}'`);
  }
  return v;
}

function requireDriverCode(driverCode: string | null, ruleCode: string, operation: string): string {
  if (!driverCode) {
    throw new InvalidEffortRuleParametersError(ruleCode, `operation '${operation}' requires a driver_code`);
  }
  return driverCode;
}

/**
 * Parse one raw `pricing_effort_rules` row's `(operation, driver_code,
 * parameters)` triple into a typed `EffortOperation`. Throws
 * `UnknownEffortOperationError` / `InvalidEffortRuleParametersError` rather
 * than silently coercing malformed content — a bad reference-pack row must
 * fail loudly, not compute a wrong number quietly.
 */
export function parseEffortOperation(row: RawEffortRuleRowInput): EffortOperation {
  const { operation, driver_code: driverCode, parameters, rule_code: ruleCode } = row;
  const p = parameters ?? {};

  switch (operation) {
    case "fixed_hours":
      return { op: "fixed_hours", hours: num(p, "hours", ruleCode) };

    case "per_unit_hours":
      return {
        op: "per_unit_hours",
        driverCode: requireDriverCode(driverCode, ruleCode, operation),
        unitHours: num(p, "unitHours", ruleCode),
      };

    case "tiered_unit_hours": {
      const tiersRaw = p.tiers;
      if (!Array.isArray(tiersRaw) || tiersRaw.length === 0) {
        throw new InvalidEffortRuleParametersError(ruleCode, "expected non-empty 'tiers' array");
      }
      const tiers = tiersRaw.map((t, i) => {
        if (typeof t !== "object" || t === null) {
          throw new InvalidEffortRuleParametersError(ruleCode, `tiers[${i}] is not an object`);
        }
        const rec = t as Record<string, unknown>;
        const uptoQuantity = rec.uptoQuantity === null || rec.uptoQuantity === undefined ? null : Number(rec.uptoQuantity);
        if (uptoQuantity !== null && !Number.isFinite(uptoQuantity)) {
          throw new InvalidEffortRuleParametersError(ruleCode, `tiers[${i}].uptoQuantity must be a number or null`);
        }
        return { uptoQuantity, unitHours: num(rec, "unitHours", ruleCode) };
      });
      const lastIsUnbounded = tiers[tiers.length - 1]?.uptoQuantity === null;
      if (!lastIsUnbounded) {
        throw new InvalidEffortRuleParametersError(ruleCode, "the last tier must have uptoQuantity: null (an unbounded top tier)");
      }
      return {
        op: "tiered_unit_hours",
        driverCode: requireDriverCode(driverCode, ruleCode, operation),
        tiers,
      };
    }

    case "percentage_of_selected_labor": {
      const percentage = num(p, "percentage", ruleCode);
      const selectionScope = p.selectionScope as "technical_packs_in_archetype" | undefined;
      const selectedActivityPackCodes = p.selectedActivityPackCodes as readonly string[] | undefined;
      if (!selectionScope && (!selectedActivityPackCodes || selectedActivityPackCodes.length === 0)) {
        throw new InvalidEffortRuleParametersError(
          ruleCode,
          "requires exactly one of 'selectionScope' or a non-empty 'selectedActivityPackCodes'",
        );
      }
      if (selectionScope && selectionScope !== "technical_packs_in_archetype") {
        throw new InvalidEffortRuleParametersError(ruleCode, `unknown selectionScope '${selectionScope}'`);
      }
      return { op: "percentage_of_selected_labor", percentage, selectionScope, selectedActivityPackCodes };
    }

    case "hours_per_week":
      return { op: "hours_per_week", driverCode: requireDriverCode(driverCode, ruleCode, operation), hoursPerWeek: num(p, "hoursPerWeek", ruleCode) };

    case "hours_per_wave":
      return { op: "hours_per_wave", driverCode: requireDriverCode(driverCode, ruleCode, operation), hoursPerWave: num(p, "hoursPerWave", ruleCode) };

    case "hours_per_stakeholder_group":
      return {
        op: "hours_per_stakeholder_group",
        driverCode: requireDriverCode(driverCode, ruleCode, operation),
        hoursPerGroup: num(p, "hoursPerGroup", ruleCode),
      };

    case "hours_per_course":
      return { op: "hours_per_course", driverCode: requireDriverCode(driverCode, ruleCode, operation), hoursPerCourse: num(p, "hoursPerCourse", ruleCode) };

    case "hours_per_training_session":
      return {
        op: "hours_per_training_session",
        driverCode: requireDriverCode(driverCode, ruleCode, operation),
        hoursPerSession: num(p, "hoursPerSession", ruleCode),
      };

    case "hours_per_supplier_month":
      return {
        op: "hours_per_supplier_month",
        driverCode: requireDriverCode(driverCode, ruleCode, operation),
        hoursPerSupplierMonth: num(p, "hoursPerSupplierMonth", ruleCode),
      };

    case "manual_cost_line":
      return { op: "manual_cost_line", costCents: num(p, "costCents", ruleCode), rationale: str(p, "rationale", ruleCode) };

    default:
      throw new UnknownEffortOperationError(operation);
  }
}

/**
 * Evaluate one HOURS-producing operation given the scope-driver-quantity
 * lookup and (for percentage_of_selected_labor only) the pre-computed sum of
 * expected hours from the referenced scope. Returns `null` for
 * `manual_cost_line`, which produces a direct cost, not hours — callers
 * must handle that operation separately (see effort-engine.ts).
 *
 * Throws if a `per_unit_hours`-family operation's driver has no quantity
 * supplied — an effort rule that names a driver but receives no scope input
 * for it is a configuration error the caller must fix, not a silent zero.
 */
export function evaluateHours(
  operation: EffortOperation,
  scopeDrivers: Readonly<Record<string, number>>,
  selectedLaborHours?: number,
): number | null {
  const driverQuantity = (driverCode: string): number => {
    const q = scopeDrivers[driverCode];
    if (q === undefined) {
      throw new InvalidEffortRuleParametersError(
        `driver:${driverCode}`,
        `no scope-driver quantity supplied for '${driverCode}'`,
      );
    }
    return q;
  };

  switch (operation.op) {
    case "fixed_hours":
      return operation.hours;
    case "per_unit_hours":
      return driverQuantity(operation.driverCode) * operation.unitHours;
    case "tiered_unit_hours": {
      const quantity = driverQuantity(operation.driverCode);
      let remaining = quantity;
      let lowerBound = 0;
      let hours = 0;
      for (const tier of operation.tiers) {
        const tierCeiling = tier.uptoQuantity === null ? Infinity : tier.uptoQuantity;
        const tierWidth = Math.max(0, Math.min(remaining, tierCeiling - lowerBound));
        hours += tierWidth * tier.unitHours;
        remaining -= tierWidth;
        lowerBound = tierCeiling;
        if (remaining <= 0) break;
      }
      return hours;
    }
    case "percentage_of_selected_labor":
      if (selectedLaborHours === undefined) {
        throw new InvalidEffortRuleParametersError(
          "percentage_of_selected_labor",
          "evaluateHours called without the pre-computed selectedLaborHours pass",
        );
      }
      return operation.percentage * selectedLaborHours;
    case "hours_per_week":
      return driverQuantity(operation.driverCode) * operation.hoursPerWeek;
    case "hours_per_wave":
      return driverQuantity(operation.driverCode) * operation.hoursPerWave;
    case "hours_per_stakeholder_group":
      return driverQuantity(operation.driverCode) * operation.hoursPerGroup;
    case "hours_per_course":
      return driverQuantity(operation.driverCode) * operation.hoursPerCourse;
    case "hours_per_training_session":
      return driverQuantity(operation.driverCode) * operation.hoursPerSession;
    case "hours_per_supplier_month":
      return driverQuantity(operation.driverCode) * operation.hoursPerSupplierMonth;
    case "manual_cost_line":
      return null;
    default: {
      const exhaustive: never = operation;
      throw new UnknownEffortOperationError((exhaustive as { op: string }).op);
    }
  }
}
