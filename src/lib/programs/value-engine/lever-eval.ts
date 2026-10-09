/**
 * Moves value engine — lever preparation and per-scenario evaluation.
 *
 * `prepareLever` resolves every input a lever names (driver, terms,
 * attribution, probability, release cost) and checks its conversion and
 * timing rules. A lever with any unresolved input or broken rule is BLOCKED
 * and carries no number. `leverInputTerms` then builds, for one scenario,
 * the ordered multiplied terms whose rounded product is the lever's annual
 * cents:
 *
 *     terms (in the lever's order) × attribution × probability
 *       [× release_gate 0 | × overlap_exclusion 0] × 100 (dollars → cents)
 *
 * A non-cash lever with a counted release path is instead
 *
 *     released cost × attribution × probability × 100
 *
 * Pure, no I/O.
 */
import { conversionIsCash, leverRuleViolations } from "./conversion-rules";
import {
  resolveInput,
  type InputDomain,
  type ResolvedNumber,
} from "./resolve-inputs";
import { timingViolation } from "./timing";
import type {
  InputIssue,
  InputRef,
  Lever,
  LeverCountedStatus,
  LeverTermRole,
  RuleViolation,
  Scenario,
  ValueFormulaTerm,
  ValueInputResolver,
} from "./types";

/** Dollars → cents. */
export const CENTS_PER_DOLLAR = 100;

/** Default breakeven headroom for an `increase` driver: up to this multiple of the planned delta. */
export const DEFAULT_INCREASE_BOUND_MULTIPLE = 2;

/** Driver deltas are rounded to this many decimals so float noise never reaches a term. */
export const DELTA_DECIMALS = 10;

function roundDelta(value: number): number {
  const factor = 10 ** DELTA_DECIMALS;
  return Math.round(value * factor) / factor;
}

export interface PreparedTerm {
  role: LeverTermRole;
  label: string;
  value: ResolvedNumber;
}

export interface PreparedLever {
  kind: "prepared";
  lever: Lever;
  baseline: ResolvedNumber;
  /** The driver's delta (key `<id>.driver`). */
  delta: ResolvedNumber;
  terms: PreparedTerm[];
  attribution: ResolvedNumber;
  probability: ResolvedNumber;
  /** Present only for a non_cash lever with a release path. */
  release: { counted: boolean; cost: ResolvedNumber | null } | null;
  /** Status before overlap: counted, or one of the two non-cash zeros. */
  status: Extract<
    LeverCountedStatus,
    "counted" | "zero_no_release_path" | "zero_release_unconfirmed"
  >;
  inCash: boolean;
  bounds: { min: number; max: number };
  mustValidate: string[];
}

export interface BlockedLever {
  kind: "blocked";
  lever: Lever;
  status: Extract<
    LeverCountedStatus,
    "blocked_unresolved_input" | "blocked_conversion_rule"
  >;
  inputIssues: InputIssue[];
  ruleViolations: RuleViolation[];
}

export type LeverPreparation = PreparedLever | BlockedLever;

const TERM_DOMAIN: Record<
  Exclude<LeverTermRole, "driver_delta">,
  InputDomain
> = {
  base: "non_negative",
  unit_value: "non_negative",
  margin: "non_negative",
  refill_share: "fraction",
  share: "fraction",
};

export function prepareLever(
  lever: Lever,
  options: {
    horizonMonths: number;
    includeRiskAvoidedInCash: boolean;
    resolver: ValueInputResolver | undefined;
  },
): LeverPreparation {
  const { resolver } = options;
  const ruleViolations = leverRuleViolations(lever);
  const timingProblem = timingViolation(lever.timing, options.horizonMonths);
  if (timingProblem) {
    ruleViolations.push({
      code: "invalid_timing",
      leverId: lever.id,
      detail: timingProblem,
    });
  }

  const inputIssues: InputIssue[] = [];
  const resolve = (
    ref: InputRef,
    key: string,
    domain: InputDomain,
  ): ResolvedNumber | null => {
    const outcome = resolveInput(ref, key, domain, resolver);
    if (outcome.ok) return outcome.value;
    inputIssues.push(outcome.issue);
    return null;
  };

  const baseline = resolve(
    lever.driver.baseline,
    `${lever.id}.driver.baseline`,
    "non_negative",
  );
  const target = resolve(
    lever.driver.target,
    `${lever.id}.driver.target`,
    "non_negative",
  );
  const terms: (PreparedTerm | "driver_delta" | null)[] = lever.terms.map(
    (term, index) => {
      if (term.role === "driver_delta") return "driver_delta";
      const value = resolve(
        term.ref,
        `${lever.id}.term[${index}]`,
        TERM_DOMAIN[term.role],
      );
      return value ? { role: term.role, label: term.label, value } : null;
    },
  );
  const attribution = resolve(
    lever.attribution,
    `${lever.id}.attribution`,
    "fraction",
  );
  const probability = resolve(
    lever.probability,
    `${lever.id}.probability`,
    "fraction",
  );

  let release: PreparedLever["release"] = null;
  if (lever.releasePath && lever.conversion === "non_cash") {
    const outcome = resolveInput(
      lever.releasePath.releasedCost,
      `${lever.id}.release_cost`,
      "non_negative",
      resolver,
    );
    if (outcome.ok) release = { counted: true, cost: outcome.value };
    else if (outcome.issue.reason === "not_counted") {
      release = { counted: false, cost: null };
    } else inputIssues.push(outcome.issue);
  }

  let delta: ResolvedNumber | null = null;
  if (baseline && target) {
    const directed = (b: number, t: number) =>
      roundDelta(lever.driver.direction === "decrease" ? b - t : t - b);
    const base = directed(baseline.base, target.base);
    if (base < 0) {
      ruleViolations.push({
        code: "driver_direction_mismatch",
        leverId: lever.id,
        detail: `The target ${lever.driver.direction === "decrease" ? "exceeds" : "is below"} the baseline for a driver declared to ${lever.driver.direction}.`,
      });
    } else {
      const candidates = [
        directed(baseline.low, target.low),
        directed(baseline.low, target.high),
        directed(baseline.high, target.low),
        directed(baseline.high, target.high),
      ];
      delta = {
        key: `${lever.id}.driver`,
        low: Math.max(0, Math.min(...candidates)),
        base,
        high: Math.max(...candidates),
        source: `${baseline.source} → ${target.source}`,
        mustValidate: baseline.mustValidate || target.mustValidate,
      };
    }
  }

  if (ruleViolations.length > 0) {
    return {
      kind: "blocked",
      lever,
      status: "blocked_conversion_rule",
      inputIssues,
      ruleViolations,
    };
  }
  if (
    inputIssues.length > 0 ||
    !baseline ||
    !delta ||
    !attribution ||
    !probability ||
    terms.some((term) => term === null)
  ) {
    return {
      kind: "blocked",
      lever,
      status: "blocked_unresolved_input",
      inputIssues,
      ruleViolations,
    };
  }

  const preparedTerms: PreparedTerm[] = terms.map((term) =>
    term === "driver_delta"
      ? {
          role: "driver_delta",
          label:
            lever.terms.find((t) => t.role === "driver_delta")?.label ??
            `${lever.driver.name} change (${lever.driver.unit})`,
          value: delta,
        }
      : (term as PreparedTerm),
  );

  const status: PreparedLever["status"] =
    lever.conversion !== "non_cash"
      ? "counted"
      : release === null
        ? "zero_no_release_path"
        : release.counted
          ? "counted"
          : "zero_release_unconfirmed";

  const declared = lever.driver.deltaBounds;
  const bounds = declared
    ? { min: declared.min, max: declared.max }
    : lever.driver.direction === "decrease"
      ? { min: 0, max: baseline.base }
      : { min: 0, max: delta.base * DEFAULT_INCREASE_BOUND_MULTIPLE };

  const mustValidate = [
    baseline,
    target,
    ...preparedTerms.map((term) => term.value),
    attribution,
    probability,
    ...(release?.cost ? [release.cost] : []),
  ]
    .filter((value): value is ResolvedNumber => !!value && value.mustValidate)
    .map((value) => value.key);

  return {
    kind: "prepared",
    lever,
    baseline,
    delta,
    terms: preparedTerms,
    attribution,
    probability,
    release,
    status,
    inCash:
      status === "counted" &&
      conversionIsCash(lever.conversion, options.includeRiskAvoidedInCash),
    bounds,
    mustValidate,
  };
}

/** The value of a resolved input in a scenario, unless an override replaces it. */
export function pick(
  value: ResolvedNumber,
  scenario: Scenario,
  overrides: ReadonlyMap<string, number>,
): number {
  const override = overrides.get(value.key);
  return override === undefined ? value[scenario] : override;
}

function inputTerm(
  label: string,
  value: ResolvedNumber,
  cellRole: ValueFormulaTerm["cellRole"],
  scenario: Scenario,
  overrides: ReadonlyMap<string, number>,
): ValueFormulaTerm {
  return {
    label,
    value: pick(value, scenario, overrides),
    source: value.source,
    cellRole,
  };
}

/**
 * The multiplied input terms of a prepared lever for one scenario (no
 * `result` yet). `excludedBy` names the lever counted instead when this one
 * is excluded from its overlap group.
 */
export function leverInputTerms(
  prepared: PreparedLever,
  scenario: Scenario,
  overrides: ReadonlyMap<string, number>,
  excludedBy: string | null,
): ValueFormulaTerm[] {
  const { lever } = prepared;
  const out: ValueFormulaTerm[] = [];
  if (prepared.release?.counted && prepared.release.cost) {
    out.push(
      inputTerm(
        `released cost (${lever.releasePath?.kind ?? "release"}, $/yr)`,
        prepared.release.cost,
        "base",
        scenario,
        overrides,
      ),
    );
  } else {
    for (const term of prepared.terms) {
      out.push(
        inputTerm(term.label, term.value, term.role, scenario, overrides),
      );
    }
  }
  out.push(
    inputTerm(
      "attribution",
      prepared.attribution,
      "attribution",
      scenario,
      overrides,
    ),
    inputTerm(
      "probability",
      prepared.probability,
      "probability",
      scenario,
      overrides,
    ),
  );
  if (prepared.status !== "counted") {
    out.push({
      label:
        prepared.status === "zero_no_release_path"
          ? "no role or contract release path recorded — counts $0"
          : "release path not counted (unconfirmed) — counts $0",
      value: 0,
      source: "engine",
      cellRole: "release_gate",
    });
  }
  if (excludedBy) {
    out.push({
      label: `counted once in its overlap group, via ${excludedBy}`,
      value: 0,
      source: "engine",
      cellRole: "overlap_exclusion",
    });
  }
  out.push({
    label: "dollars → cents",
    value: CENTS_PER_DOLLAR,
    source: "engine",
    cellRole: "unit_conversion",
  });
  return out;
}

/** Π of the lever's own terms × attribution × probability, for a non_cash lever's hours metric (4 dp). */
export function nonMoneyMetric(
  prepared: PreparedLever,
  scenario: Scenario,
): number {
  let product = 1;
  for (const term of prepared.terms) product *= term.value[scenario];
  product *= prepared.attribution[scenario] * prepared.probability[scenario];
  return Math.round(product * 10_000) / 10_000;
}
