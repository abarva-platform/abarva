/**
 * Moves value engine — evaluate a value case.
 *
 * Deterministic: the same case and resolver give the same result. A case
 * with any blocked lever or unresolved case input is `blocked`: every lever
 * reports its status and the inputs/rules that block it, and NO figure is
 * given (a total missing a lever would understate the case). A ready case
 * reports per-lever and total figures for low/base/high with formula terms,
 * the monthly cash curve, NPV, payback month, breakeven per lever and
 * one-at-a-time sensitivity.
 *
 * Pure, no I/O.
 */
import { caseBreakeven } from "./breakeven";
import {
  isReadyCase,
  overlapExclusions,
  prepareCase,
  runScenario,
  type ScenarioRun,
} from "./case-model";
import { nonMoneyMetric, type LeverPreparation } from "./lever-eval";
import { oneAtATimeSensitivity } from "./sensitivity";
import type {
  LeverResult,
  Scenario,
  ScenarioValues,
  ValueCase,
  ValueCaseResult,
  ThreeYearBasis,
  ThreeYearValueBases,
  ValueInputResolver,
} from "./types";

function emptyScenarioTerms(): LeverResult["terms"] {
  return { low: [], base: [], high: [] };
}

function scenarioValues<T>(read: (scenario: Scenario) => T): ScenarioValues<T> {
  return { low: read("low"), base: read("base"), high: read("high") };
}

function threeYearBasis(monthly: readonly number[], costCents: number): ThreeYearBasis {
  const annualCents = [0, 1, 2].map((year) =>
    monthly.slice(year * 12, (year + 1) * 12).reduce((sum, value) => sum + value, 0),
  ) as [number, number, number];
  const totalCents = annualCents.reduce((sum, value) => sum + value, 0);
  return {
    annualCents,
    totalCents,
    roi: costCents === 0 ? null : (totalCents - costCents) / costCents,
  };
}

function threeYearBases(run: ScenarioRun): ThreeYearValueBases {
  const basis = (monthly: readonly number[]) => threeYearBasis(monthly, run.costCents);
  return {
    creditedEarned: basis(run.monthlyCreditedEarned),
    creditedPaid: basis(run.monthlyCash),
    programEarned: basis(run.monthlyProgramEarned),
    programPaid: basis(run.monthlyProgramPaid),
  };
}

function blockedLeverResult(lever: LeverPreparation): LeverResult {
  const prepared = lever.kind === "prepared";
  return {
    leverId: lever.lever.id,
    name: lever.lever.name,
    conversion: lever.lever.conversion,
    status: lever.status,
    inCash: false,
    annualCents: null,
    terms: emptyScenarioTerms(),
    driverDelta: null,
    nonMoneyMetric: null,
    countedInsteadBy: null,
    monthlyCashCents: { low: [], base: [], high: [] },
    mustValidate: prepared ? lever.mustValidate : [],
    inputIssues: prepared ? [] : lever.inputIssues,
    ruleViolations: prepared ? [] : lever.ruleViolations,
  };
}

export function evaluateValueCase(
  model: ValueCase,
  options: { resolver?: ValueInputResolver } = {},
): ValueCaseResult {
  const prepared = prepareCase(model, options.resolver);
  const caseMustValidate = [prepared.discountRate, prepared.cost]
    .filter((value) => value?.mustValidate)
    .map((value) => value!.key);

  if (!isReadyCase(prepared)) {
    const levers = prepared.levers.map(blockedLeverResult);
    return {
      status: "blocked",
      readyForApproval: false,
      horizonYears: model.horizonYears,
      levers,
      economics: null,
      breakeven: [],
      sensitivity: [],
      caseInputIssues: prepared.caseInputIssues,
      caseRuleViolations: prepared.caseRuleViolations,
      mustValidate: [
        ...levers.flatMap((lever) => lever.mustValidate),
        ...caseMustValidate,
      ],
    };
  }

  const none = new Map<string, number>();
  const exclusions = overlapExclusions(prepared, none);
  const runs = scenarioValues<ScenarioRun>((scenario) =>
    runScenario(prepared, scenario, none, exclusions),
  );

  const levers: LeverResult[] = prepared.levers.map((lever, index) => {
    const at = (scenario: Scenario) => runs[scenario].levers[index];
    const excludedBy = at("base").excludedBy;
    return {
      leverId: lever.lever.id,
      name: lever.lever.name,
      conversion: lever.lever.conversion,
      status: excludedBy ? "overlap_excluded" : lever.status,
      inCash: at("base").inCash,
      annualCents: scenarioValues((s) => at(s).cents),
      terms: scenarioValues((s) => at(s).terms),
      driverDelta: scenarioValues((s) => lever.delta[s]),
      nonMoneyMetric:
        lever.lever.conversion === "non_cash"
          ? {
              unit: lever.lever.metricUnit ?? lever.lever.driver.unit,
              value: scenarioValues((s) => nonMoneyMetric(lever, s)),
            }
          : null,
      countedInsteadBy: excludedBy,
      monthlyCashCents: scenarioValues((s) => at(s).monthlyCash),
      mustValidate: lever.mustValidate,
      inputIssues: [],
      ruleViolations: [],
    };
  });

  return {
    status: "evaluated",
    readyForApproval: true,
    horizonYears: model.horizonYears,
    levers,
    economics: {
      annualCashCents: scenarioValues((s) => runs[s].annualCash.figure),
      annualCashTerms: scenarioValues((s) => runs[s].annualCash.terms),
      riskAvoidedAnnualCents: scenarioValues((s) => runs[s].riskAvoidedCents),
      monthlyCashCents: scenarioValues((s) => runs[s].monthlyCash),
      threeYearBases:
        model.horizonYears >= 3
          ? scenarioValues((s) => threeYearBases(runs[s]))
          : null,
      costCents: scenarioValues((s) => runs[s].costCents),
      discountRate: runs.base.discountRate,
      npvCents: scenarioValues((s) => runs[s].npv.figure),
      npvTerms: scenarioValues((s) => runs[s].npv.terms),
      paybackMonth: scenarioValues((s) => runs[s].paybackMonth),
    },
    breakeven: caseBreakeven(prepared, none),
    sensitivity: oneAtATimeSensitivity(prepared),
    caseInputIssues: [],
    caseRuleViolations: [],
    mustValidate: [
      ...levers.flatMap((lever) => lever.mustValidate),
      ...caseMustValidate,
    ],
  };
}
