/**
 * Moves value engine — what the value-case read answers (increment 2).
 *
 * `GET /api/v1/programs/<moveId>/value-case` evaluates the Move's saved
 * structured value model against its register inputs and cost basis. This
 * module shapes that answer and its refusals; the route only reads.
 *
 * Figures follow the register's rule (`seesRegisterFigures`): anyone who can
 * change the register, and anyone with financial visibility, sees every
 * figure — levers, formula terms, the cash curve, NPV, payback, breakeven and
 * sensitivity. A read-only viewer without financial visibility sees the
 * case's SHAPE — which levers count, which are blocked and by which input and
 * row status — and no number. Every sentence here is figure-free so it can
 * reach either viewer.
 *
 * Every refusal carries an authored `detail`, so a reader rendering
 * `detail ?? error` never shows a bare code.
 *
 * Pure, no I/O.
 */
import { COST_KEY } from "./case-model";
import type { CostBasis } from "./cost-basis";
import type { RegisterInputResolution } from "./register-inputs";
import type {
  BreakevenStatus,
  InputIssue,
  InputIssueReason,
  LeverResult,
  ValueCaseResult,
} from "./types";

export const VALUE_ENGINE_FLAG = "moves_value_engine_v1";

/** The `?delivery=` values the read accepts. */
export const VALUE_CASE_DELIVERY_PARAM = "delivery";

export type ValueCaseRefusalCode =
  | "value_engine_not_enabled"
  | "value_model_absent"
  | "value_model_not_structured"
  | "value_model_invalid"
  | "bad_delivery_model"
  | "value_case_read_failed";

export const VALUE_CASE_REFUSAL: Readonly<
  Record<ValueCaseRefusalCode, { status: number; detail: string }>
> = {
  value_engine_not_enabled: {
    status: 404,
    detail:
      "The value engine is not turned on for this workspace, so no value case was evaluated.",
  },
  value_model_absent: {
    status: 404,
    detail:
      "This Move has no P4 value plan yet. Build the value model in Value plan & business case, then open the value case again.",
  },
  value_model_not_structured: {
    status: 409,
    detail:
      "This Move's P4 value plan is written as free text, not a structured value model, so the engine has nothing to evaluate. Rebuild it as levers in the value model.",
  },
  value_model_invalid: {
    status: 409,
    detail:
      "This Move's P4 value model could not be read: some of its fields do not match the model. Open the value model and correct the fields listed in issues.",
  },
  bad_delivery_model: {
    status: 400,
    detail:
      "The delivery model must be internal or vendor. Nothing was evaluated.",
  },
  value_case_read_failed: {
    status: 500,
    detail:
      "The value case could not be read just now, so nothing was evaluated. Nothing was changed; try again in a moment.",
  },
};

export function valueCaseRefusalResponse(
  code: ValueCaseRefusalCode,
  extra: Record<string, unknown> = {},
): Response {
  const refusal = VALUE_CASE_REFUSAL[code];
  return Response.json(
    { ok: false, error: code, detail: refusal.detail, ...extra },
    { status: refusal.status },
  );
}

const INPUT_ISSUE_SENTENCE: Readonly<Record<InputIssueReason, string>> = {
  unresolved: "the input could not be resolved, so it gives no figure",
  not_counted: "the input reads a row that does not count",
  non_finite: "the value is not a finite number",
  negative: "the value is negative where only zero or more is allowed",
  fraction_out_of_bounds: "the value must be a fraction from 0 to 1",
  range_out_of_order: "its range must run low, then base, then high",
  rate_out_of_bounds: "the discount rate must be at least 0 and below 1",
};

export interface BlockedInput {
  key: string;
  reason: InputIssueReason;
  /** The register row the input reads, when it reads one. */
  registerId: string | null;
  detail: string;
}

function blockedInput(
  issue: InputIssue,
  resolutions: ReadonlyMap<string, RegisterInputResolution>,
  costBasis: CostBasis,
): BlockedInput {
  const resolution = resolutions.get(issue.key) ?? null;
  const registerId = resolution?.registerId ?? null;
  let detail: string;
  if (issue.key === COST_KEY && costBasis.status === "blocked") {
    detail = costBasis.detail;
  } else if (
    resolution &&
    (issue.reason === "unresolved" || issue.reason === "not_counted")
  ) {
    detail = resolution.detail;
  } else {
    const row = registerId ? ` (register row ${registerId})` : "";
    detail = `${issue.key}${row}: ${INPUT_ISSUE_SENTENCE[issue.reason]}.`;
  }
  return { key: issue.key, reason: issue.reason, registerId, detail };
}

/** Every input that blocks the case, each with the sentence that names why. */
export function blockedInputs(
  result: ValueCaseResult,
  resolutions: readonly RegisterInputResolution[],
  costBasis: CostBasis,
): BlockedInput[] {
  const byKey = new Map(resolutions.map((r) => [r.key, r]));
  return [
    ...result.levers.flatMap((lever) => lever.inputIssues),
    ...result.caseInputIssues,
  ].map((issue) => blockedInput(issue, byKey, costBasis));
}

export interface ValueCaseReadInput {
  programId: string;
  result: ValueCaseResult;
  costBasis: CostBasis;
  registerInputs: readonly RegisterInputResolution[];
}

/** A lever with every figure removed. */
export interface RedactedLever {
  leverId: string;
  name: string;
  conversion: LeverResult["conversion"];
  status: LeverResult["status"];
  inCash: boolean;
  countedInsteadBy: string | null;
  mustValidate: string[];
  inputIssues: InputIssue[];
  ruleViolations: LeverResult["ruleViolations"];
}

function redactedCase(result: ValueCaseResult) {
  return {
    status: result.status,
    readyForApproval: result.readyForApproval,
    horizonYears: result.horizonYears,
    levers: result.levers.map(
      (lever): RedactedLever => ({
        leverId: lever.leverId,
        name: lever.name,
        conversion: lever.conversion,
        status: lever.status,
        inCash: lever.inCash,
        countedInsteadBy: lever.countedInsteadBy,
        mustValidate: lever.mustValidate,
        inputIssues: lever.inputIssues,
        ruleViolations: lever.ruleViolations,
      }),
    ),
    breakeven: result.breakeven.map(
      (row): { leverId: string; status: BreakevenStatus } => ({
        leverId: row.leverId,
        status: row.status,
      }),
    ),
    caseInputIssues: result.caseInputIssues,
    caseRuleViolations: result.caseRuleViolations,
    mustValidate: result.mustValidate,
  };
}

function redactedCostBasis(basis: CostBasis) {
  return basis.status === "blocked"
    ? { status: basis.status, reason: basis.reason, detail: basis.detail }
    : {
        status: basis.status,
        basis: basis.basis,
        source: basis.source,
        deliveryModel: basis.deliveryModel,
      };
}

export const FIGURES_WITHHELD_DETAIL =
  "Figures are withheld for your access level: you can see which levers count and what blocks the case, but not the amounts.";

/** The 200 body, projected for the viewer. */
export function valueCaseForViewer(
  input: ValueCaseReadInput,
  viewer: { seesFigures: boolean },
): Record<string, unknown> {
  const blocked = blockedInputs(
    input.result,
    input.registerInputs,
    input.costBasis,
  );
  const shared = {
    ok: true,
    programId: input.programId,
    status: input.result.status,
    readyForApproval: input.result.readyForApproval,
    registerInputs: input.registerInputs,
    blockedInputs: blocked,
  };
  if (viewer.seesFigures) {
    return {
      ...shared,
      figuresRedacted: false,
      case: input.result,
      costBasis: input.costBasis,
    };
  }
  return {
    ...shared,
    figuresRedacted: true,
    figuresRedactedDetail: FIGURES_WITHHELD_DETAIL,
    case: redactedCase(input.result),
    costBasis: redactedCostBasis(input.costBasis),
  };
}
