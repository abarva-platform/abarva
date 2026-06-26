import { azureRead, type AzureReadClient } from "@/lib/data-plane/azureRead";

export interface TowerBudgetRollup {
  portfolioCompany: string;
  fiscalYear: string;
  totalItBudgetUsd: number;
  actualSpendYtdUsd: number;
  forecastSpendUsd: number | null;
  opexAmountUsd: number;
  capexAmountUsd: number;
  runAmountUsd: number;
  changeAmountUsd: number;
  vendorAmountUsd: number;
  laborAmountUsd: number;
  revenueUsd: number | null;
  employees: number | null;
  itSpendAsPctRevenue: number | null;
}

interface TowerBudgetRollupRow {
  portfolio_company: string;
  fiscal_year: string;
  total_it_budget_usd: string | number | null;
  actual_spend_ytd_usd: string | number | null;
  forecast_spend_usd: string | number | null;
  opex_amount_usd: string | number | null;
  capex_amount_usd: string | number | null;
  run_amount_usd: string | number | null;
  change_amount_usd: string | number | null;
  vendor_amount_usd: string | number | null;
  labor_amount_usd: string | number | null;
  revenue_usd: string | number | null;
  employees: string | number | null;
  it_spend_as_pct_revenue: string | number | null;
}

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%]/g, "").replace(/,/g, "").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function nullableNum(value: unknown): number | null {
  const parsed = num(value);
  return parsed === 0 && (value === null || value === undefined || value === "")
    ? null
    : parsed;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function shapeTowerBudgetRollups(
  rows: readonly TowerBudgetRollupRow[],
): TowerBudgetRollup[] {
  return rows.map((row) => ({
    portfolioCompany: text(
      row.portfolio_company,
      "Unassigned portfolio company",
    ),
    fiscalYear: text(row.fiscal_year, "FY2026"),
    totalItBudgetUsd: num(row.total_it_budget_usd),
    actualSpendYtdUsd: num(row.actual_spend_ytd_usd),
    forecastSpendUsd: nullableNum(row.forecast_spend_usd),
    opexAmountUsd: num(row.opex_amount_usd),
    capexAmountUsd: num(row.capex_amount_usd),
    runAmountUsd: num(row.run_amount_usd),
    changeAmountUsd: num(row.change_amount_usd),
    vendorAmountUsd: num(row.vendor_amount_usd),
    laborAmountUsd: num(row.labor_amount_usd),
    revenueUsd: nullableNum(row.revenue_usd),
    employees: nullableNum(row.employees),
    itSpendAsPctRevenue: nullableNum(row.it_spend_as_pct_revenue),
  }));
}

export async function listTowerBudgetRollupsForClient(args: {
  clientId: string;
  tenantKey: string | null;
  db?: AzureReadClient;
}): Promise<TowerBudgetRollup[]> {
  const db = args.db ?? azureRead;
  const rows = await db.select<TowerBudgetRollupRow>({
    table: "tower_budget_rollups",
    columns: [
      "portfolio_company",
      "fiscal_year",
      "total_it_budget_usd",
      "actual_spend_ytd_usd",
      "forecast_spend_usd",
      "opex_amount_usd",
      "capex_amount_usd",
      "run_amount_usd",
      "change_amount_usd",
      "vendor_amount_usd",
      "labor_amount_usd",
      "revenue_usd",
      "employees",
      "it_spend_as_pct_revenue",
    ],
    where: args.tenantKey
      ? { tenant_key: args.tenantKey }
      : { client_id: args.clientId },
    orderBy: { column: "total_it_budget_usd", direction: "desc" },
    missingTable: "empty",
    limit: 100,
  });
  return shapeTowerBudgetRollups(rows);
}
