import type {
  ContractOptimizationOpportunity,
  OptimizationOpportunityValueType,
} from "./contract-optimization-opportunity";

/**
 * Whether a stated amount can be reproduced from a persisted calculation run.
 *
 * `traced`   — a calculation run exists and its calculated amount agrees with the
 *              stated amount, so the figure can be rebuilt from its input lines.
 * `restated` — a calculation run exists but its calculated amount disagrees with
 *              the stated amount. The figure is not reproducible as shown.
 * `untraced` — an amount is stated with no calculation run behind it.
 * `not_sized`— no amount is stated. This is the honest empty state, not a zero.
 */
export type OpportunityTraceState =
  | "traced"
  | "restated"
  | "untraced"
  | "not_sized";

export interface OpportunityTraceability {
  readonly opportunityId: string;
  readonly state: OpportunityTraceState;
  readonly amountUsd: number | null;
  readonly valueType: OptimizationOpportunityValueType;
  /** Short, user-facing reason. Always populated. */
  readonly label: string;
}

export interface OpportunityTraceabilitySummary {
  readonly rows: readonly OpportunityTraceability[];
  readonly tracedCount: number;
  readonly untracedCount: number;
  readonly restatedCount: number;
  readonly notSizedCount: number;
  /** Sum of amounts that a calculation run can reproduce. Safe to quote. */
  readonly tracedAmountUsd: number;
  /**
   * Sum of stated amounts with no reproducible calculation run behind them,
   * including restated ones. Must never be presented as validated value.
   */
  readonly untracedAmountUsd: number;
  readonly tracedByValueType: Readonly<
    Record<OptimizationOpportunityValueType, number>
  >;
  readonly untracedByValueType: Readonly<
    Record<OptimizationOpportunityValueType, number>
  >;
  /** True when any stated amount cannot be reproduced from a calculation run. */
  readonly hasUntracedAmounts: boolean;
  readonly summary: string;
}

/** Amounts within this many dollars are treated as agreeing (rounding tolerance). */
const RECONCILIATION_TOLERANCE_USD = 1;

export function classifyOpportunityTrace(
  opportunity: ContractOptimizationOpportunity,
): OpportunityTraceability {
  const base = {
    opportunityId: opportunity.opportunityId,
    amountUsd: opportunity.amountUsd,
    valueType: opportunity.valueType,
  };

  if (opportunity.amountUsd == null) {
    return {
      ...base,
      state: "not_sized",
      label: "Not sized — no amount is claimed",
    };
  }

  const calculation = opportunity.calculation;
  if (!calculation) {
    return {
      ...base,
      state: "untraced",
      label: "No calculation run — amount cannot be reproduced",
    };
  }

  const drift = Math.abs(
    calculation.calculatedAmountUsd - opportunity.amountUsd,
  );
  if (drift > RECONCILIATION_TOLERANCE_USD) {
    return {
      ...base,
      state: "restated",
      label: "Calculation run disagrees with the stated amount",
    };
  }

  return {
    ...base,
    state: "traced",
    label: `Reproducible from ${calculation.includedLineCount} included line${
      calculation.includedLineCount === 1 ? "" : "s"
    }`,
  };
}

/**
 * Separate opportunity value that a calculation run can reproduce from value
 * that cannot.
 *
 * Headline "potential" totals sum every stated amount of a value type whether or
 * not anything can rebuild it, so an untraceable figure can otherwise reach an
 * executive as though it were validated. Nothing here is netted across value
 * types: recoverable leakage, avoided cost, negotiated improvement, and realized
 * value stay separate so they cannot be double counted.
 */
export function summarizeOpportunityTraceability(
  opportunities: readonly ContractOptimizationOpportunity[],
): OpportunityTraceabilitySummary {
  const rows = opportunities.map(classifyOpportunityTrace);

  const tracedByValueType: Record<string, number> = {};
  const untracedByValueType: Record<string, number> = {};
  let tracedAmountUsd = 0;
  let untracedAmountUsd = 0;

  for (const row of rows) {
    if (row.amountUsd == null) continue;
    if (row.state === "traced") {
      tracedAmountUsd += row.amountUsd;
      tracedByValueType[row.valueType] =
        (tracedByValueType[row.valueType] ?? 0) + row.amountUsd;
    } else if (row.state === "untraced" || row.state === "restated") {
      untracedAmountUsd += row.amountUsd;
      untracedByValueType[row.valueType] =
        (untracedByValueType[row.valueType] ?? 0) + row.amountUsd;
    }
  }

  const tracedCount = rows.filter((row) => row.state === "traced").length;
  const untracedCount = rows.filter((row) => row.state === "untraced").length;
  const restatedCount = rows.filter((row) => row.state === "restated").length;
  const notSizedCount = rows.filter((row) => row.state === "not_sized").length;

  return {
    rows,
    tracedCount,
    untracedCount,
    restatedCount,
    notSizedCount,
    tracedAmountUsd,
    untracedAmountUsd,
    tracedByValueType: tracedByValueType as Readonly<
      Record<OptimizationOpportunityValueType, number>
    >,
    untracedByValueType: untracedByValueType as Readonly<
      Record<OptimizationOpportunityValueType, number>
    >,
    hasUntracedAmounts: untracedCount + restatedCount > 0,
    summary: summarize({
      total: rows.length,
      tracedCount,
      untracedCount,
      restatedCount,
      notSizedCount,
    }),
  };
}

function summarize(input: {
  total: number;
  tracedCount: number;
  untracedCount: number;
  restatedCount: number;
  notSizedCount: number;
}): string {
  if (input.total === 0) {
    return "No opportunity rows are loaded, so no value is claimed for this contract.";
  }
  const parts: string[] = [
    `${input.tracedCount} of ${input.total} opportunity rows can be reproduced from a calculation run.`,
  ];
  if (input.untracedCount > 0) {
    parts.push(
      `${input.untracedCount} state an amount with no calculation run behind it.`,
    );
  }
  if (input.restatedCount > 0) {
    parts.push(
      `${input.restatedCount} disagree with their own calculation run.`,
    );
  }
  if (input.notSizedCount > 0) {
    parts.push(`${input.notSizedCount} are not sized.`);
  }
  if (input.untracedCount + input.restatedCount > 0) {
    parts.push(
      "Only the reproducible total may be used outside this workspace.",
    );
  }
  return parts.join(" ");
}
