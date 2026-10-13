import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";

type SyntheticProjectSpend = {
  amountUsd: number;
  projectCount: number;
  asOfDate: string;
};

/** A YTD project total is safe only when every case names a distinct, period-bound source project. */
export function syntheticProjectSpendYtd(view: TowerCommandCenterView): SyntheticProjectSpend | null {
  const cases = view.allInitiatives.filter((item) => item.populationKind === "ai_case");
  if (cases.length === 0) return null;
  const ids = new Set<string>();
  const dates = new Set<string>();
  const files = new Set<string>();
  let amountUsd = 0;
  for (const item of cases) {
    const id = item.projectId;
    const date = item.projectSpendAsOfDate;
    const parsedDate = date ? new Date(`${date}T00:00:00Z`) : null;
    const file = item.projectSpendSourceFile;
    const spend = item.actualSpendYtdUsd;
    if (!item.sourcePlan || !item.projectSpendSourceLinked || !id || ids.has(id) ||
        item.projectBudgetFiscalYear !== "FY26" || !date || !/^2026-\d{2}-\d{2}$/.test(date) ||
        !parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || !file || spend === null ||
        !Number.isFinite(spend) || spend < 0) return null;
    ids.add(id);
    dates.add(date);
    files.add(file);
    amountUsd += spend;
  }
  if (dates.size !== 1 || files.size !== 1 || !Number.isFinite(amountUsd)) return null;
  return { amountUsd, projectCount: ids.size, asOfDate: [...dates][0] };
}

export function sourceSpendDate(date: string | null | undefined): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "date not stated";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return "date not stated";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
