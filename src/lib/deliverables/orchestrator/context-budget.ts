import type { GovernedEvidenceItem } from "./types";

export interface ContextBudget {
  /** Total model context window. */
  windowTokens: number;
  /** Reserved for the completion. */
  outputReserveTokens: number;
  /** Measured size of system, contract, structure, adaptive depth, and safety margin. */
  fixedOverheadTokens: number;
  /** What remains for evidence. */
  evidenceTokens: number;
}

export interface ResolveContextBudgetInput {
  windowTokens?: number;
  outputReserveTokens?: number;
  fixedOverheadTokens?: number;
  fixedOverheadText?: string;
  safetyMarginTokens?: number;
}

const DEFAULT_WINDOW_TOKENS = 200_000;
const DEFAULT_OUTPUT_RESERVE_TOKENS = 32_000;
const DEFAULT_FIXED_OVERHEAD_TOKENS = 18_000;
const DEFAULT_SAFETY_MARGIN_TOKENS = 8_000;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function estimateEvidenceItemTokens(item: GovernedEvidenceItem): number {
  return estimateTokens(
    [
      `[${item.citationNumber}]`,
      item.label,
      item.evidenceFamily,
      item.confidence,
      item.asOf,
      item.statement,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function resolveContextBudget(
  input: ResolveContextBudgetInput = {},
): ContextBudget {
  const windowTokens = Math.max(
    0,
    Math.floor(input.windowTokens ?? DEFAULT_WINDOW_TOKENS),
  );
  const outputReserveTokens = Math.max(
    0,
    Math.floor(input.outputReserveTokens ?? DEFAULT_OUTPUT_RESERVE_TOKENS),
  );
  const measuredFixed =
    input.fixedOverheadTokens ??
    (input.fixedOverheadText
      ? estimateTokens(input.fixedOverheadText)
      : DEFAULT_FIXED_OVERHEAD_TOKENS);
  const safetyMarginTokens = Math.max(
    0,
    Math.floor(input.safetyMarginTokens ?? DEFAULT_SAFETY_MARGIN_TOKENS),
  );
  const fixedOverheadTokens = Math.max(
    0,
    Math.floor(measuredFixed) + safetyMarginTokens,
  );
  return {
    windowTokens,
    outputReserveTokens,
    fixedOverheadTokens,
    evidenceTokens: Math.max(
      0,
      windowTokens - outputReserveTokens - fixedOverheadTokens,
    ),
  };
}

/** Pack in priority order until the budget is spent. Never split an item. */
export function packEvidence(
  items: GovernedEvidenceItem[],
  budget: ContextBudget,
): {
  packed: GovernedEvidenceItem[];
  droppedCount: number;
  usedTokens: number;
} {
  const packed: GovernedEvidenceItem[] = [];
  let usedTokens = 0;
  let droppedCount = 0;

  for (const item of items) {
    const itemTokens = estimateEvidenceItemTokens(item);
    if (itemTokens <= budget.evidenceTokens - usedTokens) {
      packed.push(item);
      usedTokens += itemTokens;
    } else {
      droppedCount += 1;
    }
  }

  return { packed, droppedCount, usedTokens };
}
