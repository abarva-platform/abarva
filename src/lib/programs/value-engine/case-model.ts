/**
 * Moves value engine — case preparation and one scenario run.
 *
 * `prepareCase` resolves the case inputs (discount rate, cost) and prepares
 * every lever. Only a case with no blocked lever and no case-level issue is
 * READY; anything else shows no total, because a total missing a lever would
 * understate the case and look like a number.
 *
 * `runScenario` computes one scenario of a ready case under optional input
 * overrides (used by breakeven and sensitivity). Scenario `low` is the
 * pessimistic case — every value input at its low end and the cost at its
 * HIGH end; `high` is the reverse. The discount rate stays at its base in
 * every scenario; its range is explored by sensitivity.
 *
 * Pure, no I/O.
 */
import { caseRuleViolations } from "./conversion-rules";
import {
  annualTotalWithTerms,
  npvWithTerms,
  paybackMonth,
  sumCurves,
} from "./economics";
import { closeProductTerms, productOfTerms } from "./formula-terms";
import {
  leverInputTerms,
  pick,
  prepareLever,
  type LeverPreparation,
  type PreparedLever,
} from "./lever-eval";
import { resolveOverlapExclusions } from "./overlap";
import { resolveInput, type ResolvedNumber } from "./resolve-inputs";
import { monthlyCashCents, monthlyEarnedCents } from "./timing";
import type {
  Cents,
  InputIssue,
  RuleViolation,
  Scenario,
  ValueCase,
  ValueFormulaTerm,
  ValueInputResolver,
} from "./types";

export const COST_KEY = "case.cost";
export const DISCOUNT_RATE_KEY = "case.discount_rate";

/** Which end of the cost range each scenario uses (low value pairs with high cost). */
export const COST_SIDE_FOR_SCENARIO: Readonly<Record<Scenario, Scenario>> = {
  low: "high",
  base: "base",
  high: "low",
};

export interface PreparedCase {
  model: ValueCase;
  horizonYears: number;
  horizonMonths: number;
  levers: LeverPreparation[];
  discountRate: ResolvedNumber | null;
  cost: ResolvedNumber | null;
  caseInputIssues: InputIssue[];
  caseRuleViolations: RuleViolation[];
}

export interface ReadyCase extends PreparedCase {
  levers: PreparedLever[];
  discountRate: ResolvedNumber;
  cost: ResolvedNumber;
}

function resolveCost(
  model: ValueCase,
  resolver: ValueInputResolver | undefined,
): { value: ResolvedNumber } | { issue: InputIssue } {
  const cost = model.cost;
  if (cost.kind === "rom") {
    const outcome = resolveInput(
      { kind: "rom", snapshotId: cost.snapshotId },
      COST_KEY,
      "non_negative",
      resolver,
    );
    if (!outcome.ok) return { issue: outcome.issue };
    const v = outcome.value;
    return {
      value: {
        ...v,
        low: Math.round(v.low),
        base: Math.round(v.base),
        high: Math.round(v.high),
      },
    };
  }
  const base = cost.baseCents;
  const low = cost.lowCents ?? base;
  const high = cost.highCents ?? base;
  for (const v of [low, base, high]) {
    if (!Number.isInteger(v))
      return { issue: { key: COST_KEY, reason: "non_finite" } };
    if (v < 0) return { issue: { key: COST_KEY, reason: "negative" } };
  }
  if (!(low <= base && base <= high)) {
    return { issue: { key: COST_KEY, reason: "range_out_of_order" } };
  }
  return {
    value: {
      key: COST_KEY,
      low,
      base,
      high,
      source: "estimate",
      mustValidate: false,
    },
  };
}

export function prepareCase(
  model: ValueCase,
  resolver: ValueInputResolver | undefined,
): PreparedCase {
  const violations = caseRuleViolations(model);
  const horizonYears = model.horizonYears;
  const horizonMonths = violations.some((v) => v.code === "invalid_horizon")
    ? 0
    : horizonYears * 12;
  const caseInputIssues: InputIssue[] = [];
  const discount = resolveInput(
    model.discountRate,
    DISCOUNT_RATE_KEY,
    "rate",
    resolver,
  );
  if (!discount.ok) caseInputIssues.push(discount.issue);
  const cost = resolveCost(model, resolver);
  if ("issue" in cost) caseInputIssues.push(cost.issue);
  const levers = model.levers.map((lever) =>
    prepareLever(lever, {
      horizonMonths: Math.max(horizonMonths, 1),
      includeRiskAvoidedInCash: model.includeRiskAvoidedInCash === true,
      resolver,
    }),
  );
  return {
    model,
    horizonYears,
    horizonMonths,
    levers,
    discountRate: discount.ok ? discount.value : null,
    cost: "value" in cost ? cost.value : null,
    caseInputIssues,
    caseRuleViolations: violations,
  };
}

export function isReadyCase(prepared: PreparedCase): prepared is ReadyCase {
  return (
    prepared.caseRuleViolations.length === 0 &&
    // An unresolved discount rate or cost is null here; its issue is listed.
    prepared.discountRate !== null &&
    prepared.cost !== null &&
    prepared.levers.every((lever) => lever.kind === "prepared")
  );
}

/** Which levers each overlap group excludes, decided on the base scenario under `overrides`. */
export function overlapExclusions(
  ready: ReadyCase,
  overrides: ReadonlyMap<string, number>,
): Map<string, string> {
  return resolveOverlapExclusions(
    ready.levers.map((prepared) => ({
      leverId: prepared.lever.id,
      overlapGroup: prepared.lever.overlapGroup,
      overlapPrimary: prepared.lever.overlapPrimary === true,
      baseCents: Math.round(
        productOfTerms(leverInputTerms(prepared, "base", overrides, null)),
      ),
      eligible: prepared.status === "counted",
    })),
  );
}

export interface LeverRun {
  prepared: PreparedLever;
  excludedBy: string | null;
  inCash: boolean;
  /** The multiplied input terms (before the result). */
  inputs: ValueFormulaTerm[];
  terms: ValueFormulaTerm[];
  cents: Cents;
  monthlyCash: Cents[];
}

export interface ScenarioRun {
  scenario: Scenario;
  levers: LeverRun[];
  annualCash: { figure: Cents; terms: ValueFormulaTerm[] };
  riskAvoidedCents: Cents;
  monthlyCash: Cents[];
  monthlyCreditedEarned: Cents[];
  monthlyProgramEarned: Cents[];
  monthlyProgramPaid: Cents[];
  costCents: Cents;
  discountRate: number;
  npv: { figure: Cents; terms: ValueFormulaTerm[] };
  paybackMonth: number | null;
}

export function runScenario(
  ready: ReadyCase,
  scenario: Scenario,
  overrides: ReadonlyMap<string, number>,
  exclusions: ReadonlyMap<string, string>,
): ScenarioRun {
  const levers: LeverRun[] = ready.levers.map((prepared) => {
    const excludedBy = exclusions.get(prepared.lever.id) ?? null;
    const inputs = leverInputTerms(prepared, scenario, overrides, excludedBy);
    const { figure, terms } = closeProductTerms(
      inputs,
      `${prepared.lever.id} annual value (cents)`,
    );
    const inCash = prepared.inCash && excludedBy === null;
    return {
      prepared,
      excludedBy,
      inCash,
      inputs,
      terms,
      cents: figure,
      monthlyCash: inCash
        ? monthlyCashCents(figure, prepared.lever.timing, ready.horizonMonths)
        : [],
    };
  });
  const cashLevers = levers.filter((lever) => lever.inCash);
  // Program value retains the probability gate but removes only the declared
  // attribution share. This is computed from the same resolved formula terms;
  // a zero attribution never becomes division by zero.
  const programAnnual = (lever: LeverRun): Cents =>
    closeProductTerms(
      lever.inputs.map((term) =>
        term.cellRole === "attribution" ? { ...term, value: 1 } : term,
      ),
      `${lever.prepared.lever.id} program annual value (cents)`,
    ).figure;
  const monthlyCreditedEarned = sumCurves(
    cashLevers.map((lever) =>
      monthlyEarnedCents(
        lever.cents,
        lever.prepared.lever.timing,
        ready.horizonMonths,
      ),
    ),
    ready.horizonMonths,
  );
  const monthlyProgramEarned = sumCurves(
    cashLevers.map((lever) =>
      monthlyEarnedCents(
        programAnnual(lever),
        lever.prepared.lever.timing,
        ready.horizonMonths,
      ),
    ),
    ready.horizonMonths,
  );
  const monthlyProgramPaid = sumCurves(
    cashLevers.map((lever) =>
      monthlyCashCents(
        programAnnual(lever),
        lever.prepared.lever.timing,
        ready.horizonMonths,
      ),
    ),
    ready.horizonMonths,
  );
  const annualCash = annualTotalWithTerms(
    cashLevers.map((lever) => ({
      leverId: lever.prepared.lever.id,
      cents: lever.cents,
    })),
    "annual cash value (cents)",
  );
  // An overlap-excluded risk lever already carries 0 cents (its exclusion term).
  const riskAvoidedCents = levers
    .filter((lever) => lever.prepared.lever.conversion === "risk_avoided")
    .reduce((sum, lever) => sum + lever.cents, 0);
  const monthlyCash = sumCurves(
    cashLevers.map((lever) => lever.monthlyCash),
    ready.horizonMonths,
  );
  const costCents = pick(
    ready.cost,
    COST_SIDE_FOR_SCENARIO[scenario],
    overrides,
  );
  const discountRate = pick(ready.discountRate, "base", overrides);
  return {
    scenario,
    levers,
    annualCash,
    riskAvoidedCents,
    monthlyCash,
    monthlyCreditedEarned,
    monthlyProgramEarned,
    monthlyProgramPaid,
    costCents,
    discountRate,
    npv: npvWithTerms(monthlyCash, costCents, discountRate, ready.horizonYears),
    paybackMonth: paybackMonth(monthlyCash, costCents),
  };
}
