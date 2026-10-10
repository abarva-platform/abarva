/**
 * Moves value engine — types (increment 1, core engine).
 *
 * The engine turns a Move's value case (levers, each a driver and an ordered
 * product of terms) into deterministic money: annual low/base/high per lever
 * and in total, a monthly cash curve after start, ramp, payment lag and
 * phase-down, NPV, payback month, breakeven per lever driver and
 * one-at-a-time sensitivity. Every money figure is integer cents and carries
 * the formula terms that reproduce it exactly.
 *
 * Engines compute, narrative explains: nothing here calls a model, and no
 * figure is ever guessed. An input that cannot be resolved blocks its lever
 * (`blocked_unresolved_input`) and the case; it is never defaulted.
 *
 * UNITS. Money-valued terms (`base` spend, `unit_value`, `margin`, a release
 * path's `releasedCost`) are in dollars; the engine multiplies by an explicit
 * `unit_conversion` term of 100 and rounds ONCE to whole cents. The case cost
 * is already in cents. Fractions (`share`, `refill_share`, `attribution`,
 * `probability`) are 0..1.
 *
 * Pure, no I/O.
 */

/** Integer cents. */
export type Cents = number;

/** Explicit low/high band for an input, in the input's own unit. */
export interface InputRange {
  low: number;
  high: number;
}

/** A value typed with its source — used in tests and hand-built cases. */
export interface LiteralInputRef {
  kind: "literal";
  value: number;
  /** Who/what stated the number. Required, non-blank. */
  source: string;
  range?: InputRange;
}

/** A value read from approved evidence, carried with its unit and date. */
export interface EvidenceInputRef {
  kind: "evidence";
  evidenceId: string;
  value: number;
  unit: string;
  /** ISO date the evidence value is as of. */
  asOf: string;
  range?: InputRange;
}

/** A row in the Move's assumption register. Resolved by an injected resolver. */
export interface RegisterInputRef {
  kind: "register";
  registerId: string;
  range?: InputRange;
}

/** A ROM pricing snapshot figure. Resolved by an injected resolver. */
export interface RomInputRef {
  kind: "rom";
  snapshotId: string;
  range?: InputRange;
}

export type InputRef =
  | LiteralInputRef
  | EvidenceInputRef
  | RegisterInputRef
  | RomInputRef;

/** The refs this increment cannot read itself; a caller injects how. */
export type ResolvableInputRef = RegisterInputRef | RomInputRef;

/** Register row statuses. Only open/confirmed/corrected rows are counted. */
export type RegisterRowStatus =
  | "proposed"
  | "open"
  | "confirmed"
  | "corrected"
  | "rejected"
  | "superseded";

/** What an injected resolver returns for a register or ROM ref. */
export interface ResolvedInput {
  value: number;
  /** Provenance written into formula terms, e.g. `register:V3`, `rom:snap-1`. */
  source: string;
  range?: InputRange;
  /** Register confidence 1..5; drives the default band when no range is given. */
  confidence?: number;
  /** Register status. Absent means counted (e.g. a ROM snapshot figure). */
  status?: RegisterRowStatus;
}

/** Returns null when the ref cannot be resolved — the engine then blocks, never guesses. */
export type ValueInputResolver = (
  ref: ResolvableInputRef,
) => ResolvedInput | null;

export type LeverConversion =
  | "cost_reduction"
  | "volume_added"
  | "revenue"
  | "risk_avoided"
  | "non_cash";

export type LeverTermRole =
  | "driver_delta"
  | "base"
  | "unit_value"
  | "margin"
  | "refill_share"
  | "share";

/** The driver's delta: taken from the lever's driver (baseline → target). */
export interface DriverDeltaTerm {
  role: "driver_delta";
  label?: string;
}

export interface InputTerm {
  role: Exclude<LeverTermRole, "driver_delta">;
  label: string;
  ref: InputRef;
}

export type LeverTerm = DriverDeltaTerm | InputTerm;

export interface LeverDriver {
  name: string;
  unit: string;
  /** `decrease`: delta = baseline − target (e.g. length of stay). `increase`: delta = target − baseline. */
  direction: "decrease" | "increase";
  baseline: InputRef;
  target: InputRef;
  /**
   * Bounds on the delta, for breakeven. Defaults: decrease → [0, baseline]
   * (a driver cannot fall below zero); increase → [0, planned delta ×
   * DEFAULT_INCREASE_BOUND_MULTIPLE].
   */
  deltaBounds?: { min: number; max: number };
}

export interface LeverPhaseDown {
  /** 1-based horizon month from which the factor applies. */
  fromMonth: number;
  /** 0..1 multiplier on the lever's earned value from that month on. */
  factor: number;
}

export interface LeverTiming {
  /** 1-based horizon month in which the lever first earns value. */
  startMonth: number;
  /** Linear ramp: earned fraction in the k-th earning month is min(1, k / rampMonths). 0 = full at start. */
  rampMonths: number;
  /** Months between value being earned and cash arriving. */
  paymentLagMonths: number;
  phaseDown?: LeverPhaseDown[];
}

/**
 * Hours saved (and other non-cash value) count $0 until a role or contract
 * release is recorded; then the lever converts to a cost reduction on the
 * released cost only.
 */
export interface LeverReleasePath {
  kind: "role_released" | "contract_released";
  /** Annual released cost, in dollars. Must resolve to a COUNTED input. */
  releasedCost: InputRef;
}

export interface Lever {
  /** Stable id, e.g. `L1`. Unique within the case. */
  id: string;
  name: string;
  conversion: LeverConversion;
  driver: LeverDriver;
  /** Ordered; their product × attribution × probability is the annual figure. */
  terms: LeverTerm[];
  /** Levers in the same group overlap and are counted once. */
  overlapGroup?: string;
  /** Declared counted member of its overlap group (otherwise the largest counts). */
  overlapPrimary?: boolean;
  attribution: InputRef;
  probability: InputRef;
  timing: LeverTiming;
  releasePath?: LeverReleasePath;
  /** Unit of the non-money metric for a non_cash lever. Defaults to the driver unit. */
  metricUnit?: string;
}

export type ValueCaseCost =
  | {
      kind: "estimate";
      baseCents: Cents;
      lowCents?: Cents;
      highCents?: Cents;
    }
  | { kind: "rom"; snapshotId: string };

export interface ValueCase {
  levers: Lever[];
  /** Whole years, 1..MAX_HORIZON_YEARS. */
  horizonYears: number;
  /** Annual discount rate, 0..1 exclusive. */
  discountRate: InputRef;
  /** One-time investment, incurred at month 0. */
  cost: ValueCaseCost;
  /** Default false: avoided risk is reported separately and not counted as cash. */
  includeRiskAvoidedInCash?: boolean;
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

export type Scenario = "low" | "base" | "high";

export interface ScenarioValues<T> {
  low: T;
  base: T;
  high: T;
}

export type LeverCountedStatus =
  | "counted"
  | "zero_no_release_path"
  | "zero_release_unconfirmed"
  | "overlap_excluded"
  | "blocked_unresolved_input"
  | "blocked_conversion_rule";

/** Where a formula term sits in a workbook and how it combines. */
export type ValueFormulaCellRole =
  | LeverTermRole
  | "attribution"
  | "probability"
  /** Dollars → cents (100). Multiplied. */
  | "unit_conversion"
  /** 0 when an overlapping lever is counted instead. Multiplied. */
  | "overlap_exclusion"
  /** 0 when a non-cash lever has no counted release path. Multiplied. */
  | "release_gate"
  /** Summed (a total, or one year of discounted cash). */
  | "addend"
  /** The figure itself. */
  | "result";

export interface ValueFormulaTerm {
  label: string;
  value: number;
  /** `literal:<source>`, `evidence:<id>`, `register:<id>`, `rom:<id>` (or the resolver's source), or `engine`. */
  source: string;
  cellRole: ValueFormulaCellRole;
}

export type InputIssueReason =
  | "unresolved"
  | "not_counted"
  | "non_finite"
  | "negative"
  | "fraction_out_of_bounds"
  | "range_out_of_order"
  | "rate_out_of_bounds";

export interface InputIssue {
  /** Stable input key, e.g. `L1.attribution`, `L2.term[1]`, `case.discount_rate`. */
  key: string;
  reason: InputIssueReason;
}

export type RuleViolationCode =
  | "no_levers"
  | "duplicate_lever_id"
  | "invalid_horizon"
  | "invalid_timing"
  | "invalid_delta_bounds"
  | "multiple_driver_delta_terms"
  | "driver_direction_mismatch"
  | "cost_reduction_requires_base"
  | "cost_reduction_requires_bought_less"
  | "volume_added_requires_refill_share"
  | "volume_added_requires_margin"
  | "revenue_requires_margin"
  | "release_path_only_for_non_cash";

export interface RuleViolation {
  code: RuleViolationCode;
  /** Null for a case-level violation. */
  leverId: string | null;
  detail: string;
}

export interface LeverResult {
  leverId: string;
  name: string;
  conversion: LeverConversion;
  status: LeverCountedStatus;
  /** Whether this lever's figure enters the cash curve, NPV and payback. */
  inCash: boolean;
  /** Annual figure in cents. Null when blocked. */
  annualCents: ScenarioValues<Cents> | null;
  /** Formula terms per scenario; empty when blocked. */
  terms: ScenarioValues<ValueFormulaTerm[]>;
  /** The driver delta per scenario (null when blocked). */
  driverDelta: ScenarioValues<number> | null;
  /** Non-money metric (hours, for a non_cash lever), always reported when resolvable. */
  nonMoneyMetric: { unit: string; value: ScenarioValues<number> } | null;
  /** For an overlap-excluded lever: the lever counted instead. */
  countedInsteadBy: string | null;
  /** Monthly cash in cents per scenario (after lag); empty when not in cash or blocked. */
  monthlyCashCents: ScenarioValues<Cents[]>;
  /** Inputs resolved from an OPEN register row — counted, but must be validated. */
  mustValidate: string[];
  inputIssues: InputIssue[];
  ruleViolations: RuleViolation[];
}

export type BreakevenStatus =
  | "solved"
  | "met_without_lever"
  | "never_within_bounds"
  | "not_applicable";

export interface LeverBreakeven {
  leverId: string;
  status: BreakevenStatus;
  method: "closed_form" | "bisection" | null;
  /** Driver delta at which steady-state annual cash × horizon equals cost. */
  breakevenDelta: number | null;
  /** The driver target that delta implies. */
  breakevenTarget: number | null;
  bounds: { min: number; max: number } | null;
  /** Always the documented basis: steady-state counted annual cash × horizon years vs cost. */
  basis: "steady_state_annual_x_horizon";
}

export interface SensitivityRow {
  /** Input key, e.g. `L1.term[0]`. */
  key: string;
  label: string;
  side: "low" | "high";
  inputValue: number;
  annualCashCents: Cents;
  npvCents: Cents;
  paybackMonth: number | null;
  breakeven: Record<string, LeverBreakeven>;
}

export interface CaseEconomics {
  annualCashCents: ScenarioValues<Cents>;
  annualCashTerms: ScenarioValues<ValueFormulaTerm[]>;
  riskAvoidedAnnualCents: ScenarioValues<Cents>;
  monthlyCashCents: ScenarioValues<Cents[]>;
  /** Three-year edition bases. Null when the case horizon is shorter than 3 years. */
  threeYearBases: ScenarioValues<ThreeYearValueBases> | null;
  costCents: ScenarioValues<Cents>;
  discountRate: number;
  npvCents: ScenarioValues<Cents>;
  npvTerms: ScenarioValues<ValueFormulaTerm[]>;
  /** First 1-based month whose cumulative cash ≥ cost; null if not within the horizon. */
  paybackMonth: ScenarioValues<number | null>;
}

export interface ThreeYearBasis {
  /** Year 1, 2 and 3, summed from the engine's monthly curves. */
  annualCents: [Cents, Cents, Cents];
  totalCents: Cents;
  /** (value - one-time investment) / investment; null for zero investment. */
  roi: number | null;
}

export interface ThreeYearValueBases {
  /** Attributed, probability-adjusted value when earned or received. */
  creditedEarned: ThreeYearBasis;
  creditedPaid: ThreeYearBasis;
  /** Probability-adjusted value before the declared attribution share. */
  programEarned: ThreeYearBasis;
  programPaid: ThreeYearBasis;
}

export interface ValueCaseResult {
  status: "evaluated" | "blocked";
  readyForApproval: boolean;
  horizonYears: number;
  levers: LeverResult[];
  /** Null when blocked: a total missing a lever would understate, so none is given. */
  economics: CaseEconomics | null;
  breakeven: LeverBreakeven[];
  sensitivity: SensitivityRow[];
  caseInputIssues: InputIssue[];
  caseRuleViolations: RuleViolation[];
  mustValidate: string[];
}
