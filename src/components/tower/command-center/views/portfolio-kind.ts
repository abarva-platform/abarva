import type { TowerAiView } from "@/lib/tower/command-center/types";

/** Temporary source-template-scoped split until the mart exposes a canonical row type. */
export function isToolRollout(item: TowerAiView): boolean {
  return item.sourceFile === "23_ai_tool_rollout.csv";
}

export function isBusinessCase(item: TowerAiView): boolean {
  return item.sourceFile === "22_ai_business_cases.csv";
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
