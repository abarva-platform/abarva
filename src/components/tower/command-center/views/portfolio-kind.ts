import type { TowerAiView } from "@/lib/tower/command-center/types";

/** Declared page and canonical object identity are classified by the reader. */
export function isToolRollout(item: TowerAiView): boolean {
  return item.populationKind === "tool_rollout";
}

export function isBusinessCase(item: TowerAiView): boolean {
  return item.populationKind === "ai_case";
}

/** A funding headline is complete only when every classified case has an amount. */
export function approvedAiCaseFunding(items: readonly TowerAiView[]): number | null {
  const cases = items.filter(isBusinessCase);
  if (cases.length === 0 || cases.some((item) => item.aiAmountBasis !== "approved_funding")) return null;
  return cases.reduce((total, item) => total + item.aiSpendUsd, 0);
}

export function unclassifiedPortfolioCount(items: readonly TowerAiView[]): number {
  return items.filter((item) => !isBusinessCase(item) && !isToolRollout(item)).length;
}
