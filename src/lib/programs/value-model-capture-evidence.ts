/** Deterministic P4 value evidence handed to generation. No model arithmetic. */
import type { CostBasis } from "./value-engine/cost-basis";
import type { BlockedInput } from "./value-engine/value-case-view";
import type {
  Scenario,
  ValueCaseResult,
  ValueFormulaTerm,
} from "./value-engine/types";

export interface ValueEngineFigure {
  sourceId: string;
  label: string;
  scenario: Scenario;
  cents: number;
}

export interface ValueEngineQuantity {
  sourceId: string;
  label: string;
  value: number;
  unit: "month" | "driver_delta" | "non_cash" | "year";
  scenario?: Scenario;
}

export interface ValueGenerationSnapshot {
  /** Hash of the saved value/estimate captures, referenced register rows, and resolved cost. */
  inputHash: string;
  result: ValueCaseResult;
  costBasis: CostBasis;
  blockedInputs: BlockedInput[];
  figures: ValueEngineFigure[];
  quantities: ValueEngineQuantity[];
  prompt: string;
}

const SCENARIOS: readonly Scenario[] = ["low", "base", "high"];

export function valueCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function valueEngineFigures(result: ValueCaseResult): ValueEngineFigure[] {
  const economics = result.economics;
  if (!economics) return [];
  const figures: ValueEngineFigure[] = [];
  for (const lever of result.levers) {
    if (!lever.annualCents) continue;
    for (const scenario of SCENARIOS) {
      figures.push({
        sourceId: lever.leverId,
        label: `${lever.name} annual ${scenario}`,
        scenario,
        cents: lever.annualCents[scenario],
      });
    }
  }
  for (const scenario of SCENARIOS) {
    figures.push(
      {
        sourceId: "TOTAL",
        label: `Counted annual cash ${scenario}`,
        scenario,
        cents: economics.annualCashCents[scenario],
      },
      {
        sourceId: "NPV",
        label: `NPV ${scenario}`,
        scenario,
        cents: economics.npvCents[scenario],
      },
      {
        sourceId: "COST",
        label: `Investment ${scenario}`,
        scenario,
        cents: economics.costCents[scenario],
      },
    );
  }
  return figures;
}

export function valueEngineQuantities(result: ValueCaseResult): ValueEngineQuantity[] {
  const quantities: ValueEngineQuantity[] = [
    { sourceId: "HORIZON", label: "Horizon years", value: result.horizonYears, unit: "year" },
  ];
  for (const lever of result.levers) {
    if (lever.nonMoneyMetric) {
      quantities.push({
        sourceId: lever.leverId,
        label: `${lever.name} non-cash metric`,
        value: lever.nonMoneyMetric.value.base,
        unit: "non_cash",
      });
    }
  }
  if (result.economics) {
    for (const scenario of SCENARIOS) {
      const month = result.economics.paybackMonth[scenario];
      if (month !== null) {
        quantities.push({ sourceId: "PAYBACK", label: `${scenario} payback month`, value: month, unit: "month", scenario });
      }
    }
  }
  for (const row of result.breakeven) {
    if (row.breakevenDelta !== null) {
      quantities.push({
        sourceId: `BREAKEVEN-${row.leverId}`,
        label: `${row.leverId} breakeven driver delta`,
        value: row.breakevenDelta,
        unit: "driver_delta",
      });
    }
  }
  return quantities;
}

function termFormula(terms: readonly ValueFormulaTerm[]): string {
  return terms
    .map((term) => `${term.label}=${term.value} (${term.source})`)
    .join(" × ");
}

function termSources(terms: readonly ValueFormulaTerm[]): string {
  const sources = new Set(
    terms.map((term) =>
      term.source.startsWith("register:")
        ? `[A:${term.source.slice("register:".length)}]`
        : term.source,
    ),
  );
  return [...sources].join(", ");
}

/** Prompt text is generated from engine output; the author only explains it. */
export function formatValueModelForPrompt(
  result: ValueCaseResult,
  costBasis: CostBasis,
): string {
  const lines = [
    "VALUE ENGINE RESULT — deterministic P4 figures; explain, never recalculate",
    "Every client value amount must copy an engine figure with its [VE:source] marker or cite a matching [A:ID] register row. Do not combine, sum, discount, or monetize amounts yourself.",
  ];
  if (!result.economics || costBasis.status !== "resolved") {
    return [...lines, "The case is blocked; no monetary total, NPV, or payback may be asserted."].join("\n");
  }
  lines.push(`Investment basis: ${costBasis.source}; delivery=${costBasis.deliveryModel ?? "approved ROM"}.`);
  for (const lever of result.levers) {
    lines.push(`Lever ${lever.leverId} — ${lever.name}: ${lever.status}; conversion=${lever.conversion}.`);
    if (lever.status === "zero_no_release_path") {
      lines.push(`  $0: no counted role or contract release path. Hours are a non-cash metric only. [VE:${lever.leverId}]`);
    }
    if (lever.status === "zero_release_unconfirmed") {
      lines.push(`  $0: release path is unconfirmed; do not monetize hours. [VE:${lever.leverId}]`);
    }
    if (lever.nonMoneyMetric) {
      lines.push(`  Non-cash metric: ${lever.nonMoneyMetric.value.base} ${lever.nonMoneyMetric.unit}; not money [VE:${lever.leverId}].`);
    }
    if (!lever.annualCents) continue;
    for (const scenario of SCENARIOS) {
      const terms = lever.terms[scenario];
      lines.push(
        `  ${scenario} annual ${valueCurrency(lever.annualCents[scenario])} [VE:${lever.leverId}]; formula: ${termFormula(terms)}; sources: ${termSources(terms)}.`,
      );
    }
  }
  for (const scenario of SCENARIOS) {
    const economics = result.economics;
    lines.push(
      `${scenario} counted annual cash ${valueCurrency(economics.annualCashCents[scenario])} [VE:TOTAL]; formula: ${termFormula(economics.annualCashTerms[scenario])}; sources: ${termSources(economics.annualCashTerms[scenario])}.`,
      `${scenario} NPV ${valueCurrency(economics.npvCents[scenario])} [VE:NPV]; formula: ${termFormula(economics.npvTerms[scenario])}; sources: ${termSources(economics.npvTerms[scenario])}.`,
      `${scenario} investment ${valueCurrency(economics.costCents[scenario])} [VE:COST]; formula: copied ${scenario} total from the approved cost basis; source: ${costBasis.source}.`,
      `${scenario} payback ${economics.paybackMonth[scenario] === null ? "not reached in horizon" : `month ${economics.paybackMonth[scenario]}`} [VE:PAYBACK]; formula: first month cumulative cash reaches ${scenario} investment; sources: [VE:TOTAL], [VE:COST].`,
    );
  }
  for (const row of result.breakeven) {
    lines.push(
      `Breakeven ${row.leverId}: ${row.status}${row.breakevenDelta === null ? "" : `; driver delta ${row.breakevenDelta}`}; formula: counted steady-state annual cash × horizon equals investment, with other inputs held; basis=${row.basis}; sources: [VE:BREAKEVEN-${row.leverId}], [VE:COST].`,
    );
  }
  lines.push("The expert-kernel haircut is a cross-check only. Attribution and probability have already priced risk in the engine; never apply a second haircut.");
  return lines.join("\n");
}

/** The refusal names the levers and register rows that a reviewer can resolve. */
export function valueModelReviewDetail(
  result: ValueCaseResult,
  blockedInputs: readonly BlockedInput[],
  costBasis: CostBasis,
): string | null {
  if (result.readyForApproval && result.economics) return null;
  const blockedLevers = result.levers
    .filter((lever) => lever.status.startsWith("blocked_"))
    .map((lever) => `${lever.leverId} (${lever.name})`);
  const rows = [...new Set(blockedInputs.map((input) => input.registerId).filter((id): id is string => !!id))];
  const parts = [
    "Review the structured value model before building P4 documents.",
    blockedLevers.length ? `Blocked levers: ${blockedLevers.join(", ")}.` : "",
    rows.length ? `Resolve assumption-register row(s) ${rows.map((id) => `[A:${id}]`).join(", ")}.` : "",
    blockedInputs.length ? `Blocked inputs: ${blockedInputs.map((input) => input.detail).join(" ")}` : "",
    costBasis.status === "blocked" ? `Cost basis: ${costBasis.detail}` : "",
    result.caseRuleViolations.length ? `Case rules: ${result.caseRuleViolations.map((rule) => rule.detail).join(" ")}` : "",
  ];
  return parts.filter(Boolean).join(" ");
}

export function valueGenerationSnapshot(
  result: ValueCaseResult,
  costBasis: CostBasis,
  blockedInputs: BlockedInput[],
  inputHash: string,
): ValueGenerationSnapshot {
  return {
    inputHash,
    result,
    costBasis,
    blockedInputs,
    figures: valueEngineFigures(result),
    quantities: valueEngineQuantities(result),
    prompt: formatValueModelForPrompt(result, costBasis),
  };
}
