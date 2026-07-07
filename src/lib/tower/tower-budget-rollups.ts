import { azureRead, type AzureReadClient } from "@/lib/data-plane/azureRead";
import type { AIInitiative } from "@/lib/admin/ai-initiatives/queries";
import { canonicalCioTowerTenantKey } from "@/lib/cio-tower/metric-packet";

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

interface ContextBudgetRecordRow {
  id: string;
  source_file: string | null;
  source_row_number: number | null;
  payload: Record<string, unknown> | null;
}

interface CioTowerBudgetFactRollupRow {
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

function firstValue(
  payload: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function firstText(
  payload: Record<string, unknown>,
  keys: readonly string[],
  fallback = "",
): string {
  return text(firstValue(payload, keys), fallback);
}

function firstNum(
  payload: Record<string, unknown>,
  keys: readonly string[],
): number {
  for (const key of keys) {
    const parsed = num(payload[key]);
    if (parsed !== 0 || payload[key] === 0 || payload[key] === "0") return parsed;
  }
  return 0;
}

function addRollupValue(
  target: TowerBudgetRollupRow,
  key: keyof Pick<
    TowerBudgetRollupRow,
    | "total_it_budget_usd"
    | "actual_spend_ytd_usd"
    | "forecast_spend_usd"
    | "opex_amount_usd"
    | "capex_amount_usd"
    | "run_amount_usd"
    | "change_amount_usd"
    | "vendor_amount_usd"
    | "labor_amount_usd"
  >,
  value: number,
): void {
  target[key] = num(target[key]) + value;
}

function shapeBudgetRollupsFromContextRecords(
  records: readonly ContextBudgetRecordRow[],
): TowerBudgetRollup[] {
  const byKey = new Map<string, TowerBudgetRollupRow>();

  for (const record of records) {
    const payload = record.payload ?? {};
    const total = firstNum(payload, [
      "total_it_budget_usd",
      "fy26_budget_usd",
      "annual_budget_usd",
      "budget_usd",
      "spend_amount_usd",
    ]);
    if (total <= 0) continue;

    const fiscalYear = firstText(payload, ["fiscal_year", "period"], "FY2026");
    const portfolioCompany = firstText(
      payload,
      ["portfolio_company", "budget_area", "business_function", "owner_team_id"],
      "Enterprise IT portfolio",
    );
    const mapKey = `${portfolioCompany}::${fiscalYear}`;
    const row = byKey.get(mapKey) ?? {
      portfolio_company: portfolioCompany,
      fiscal_year: fiscalYear,
      total_it_budget_usd: 0,
      actual_spend_ytd_usd: 0,
      forecast_spend_usd: null,
      opex_amount_usd: 0,
      capex_amount_usd: 0,
      run_amount_usd: 0,
      change_amount_usd: 0,
      vendor_amount_usd: 0,
      labor_amount_usd: 0,
      revenue_usd: null,
      employees: null,
      it_spend_as_pct_revenue: null,
    };

    addRollupValue(row, "total_it_budget_usd", total);
    addRollupValue(
      row,
      "actual_spend_ytd_usd",
      firstNum(payload, ["actual_spend_ytd_usd", "actual_ytd_usd", "ytd_spend_usd"]),
    );
    addRollupValue(row, "forecast_spend_usd", firstNum(payload, ["forecast_spend_usd"]));
    addRollupValue(row, "opex_amount_usd", firstNum(payload, ["opex_amount_usd"]));
    addRollupValue(row, "capex_amount_usd", firstNum(payload, ["capex_amount_usd"]));
    addRollupValue(row, "run_amount_usd", firstNum(payload, ["run_amount_usd"]));
    addRollupValue(row, "change_amount_usd", firstNum(payload, ["change_amount_usd"]));
    addRollupValue(row, "vendor_amount_usd", firstNum(payload, ["vendor_amount_usd"]));
    addRollupValue(row, "labor_amount_usd", firstNum(payload, ["labor_amount_usd"]));

    const spendType = `${firstText(payload, ["spend_type"])} ${firstText(payload, ["spend_posture"])}`.toLowerCase();
    const accountingTreatment = firstText(payload, ["accounting_treatment"]).toLowerCase();
    if (!num(row.run_amount_usd) && /\brun\b/.test(spendType) && !/change/.test(spendType)) {
      addRollupValue(row, "run_amount_usd", total);
    }
    if (!num(row.change_amount_usd) && /\bchange\b/.test(spendType) && !/run/.test(spendType)) {
      addRollupValue(row, "change_amount_usd", total);
    }
    if (!num(row.opex_amount_usd) && accountingTreatment === "opex") {
      addRollupValue(row, "opex_amount_usd", total);
    }
    if (!num(row.capex_amount_usd) && accountingTreatment === "capex") {
      addRollupValue(row, "capex_amount_usd", total);
    }

    row.revenue_usd = row.revenue_usd ?? firstValue(payload, ["revenue_usd"]) as string | number | null;
    row.employees = row.employees ?? firstValue(payload, ["employees"]) as string | number | null;
    row.it_spend_as_pct_revenue = row.it_spend_as_pct_revenue ?? firstValue(payload, ["it_spend_as_pct_revenue"]) as string | number | null;
    byKey.set(mapKey, row);
  }

  return shapeTowerBudgetRollups([...byKey.values()]);
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

export function shapeTowerBudgetRollupsFromInitiatives(
  initiatives: ReadonlyArray<AIInitiative>,
): TowerBudgetRollup[] {
  const rows = new Map<string, TowerBudgetRollupRow>();

  for (const initiative of initiatives) {
    const committed = initiative.committedAnnualUsd ?? 0;
    if (committed <= 0) continue;
    const portfolioCompany =
      initiative.portfolioCompany ||
      initiative.operatingCompany ||
      initiative.businessFunction ||
      initiative.ownerFunction ||
      initiative.primaryCategoryName ||
      "Enterprise IT portfolio";
    const fiscalYear = "FY2026";
    const key = `${portfolioCompany}::${fiscalYear}`;
    const row =
      rows.get(key) ??
      ({
        portfolio_company: portfolioCompany,
        fiscal_year: fiscalYear,
        total_it_budget_usd: 0,
        actual_spend_ytd_usd: 0,
        forecast_spend_usd: null,
        opex_amount_usd: 0,
        capex_amount_usd: 0,
        run_amount_usd: 0,
        change_amount_usd: 0,
        vendor_amount_usd: 0,
        labor_amount_usd: 0,
        revenue_usd: null,
        employees: null,
        it_spend_as_pct_revenue: null,
      } satisfies TowerBudgetRollupRow);

    addRollupValue(row, "total_it_budget_usd", committed);
    rows.set(key, row);
  }

  return shapeTowerBudgetRollups([...rows.values()]).sort(
    (a, b) => b.totalItBudgetUsd - a.totalItBudgetUsd,
  );
}

export async function listTowerBudgetRollupsForClient(args: {
  clientId: string;
  tenantKey: string | null;
  db?: AzureReadClient;
}): Promise<TowerBudgetRollup[]> {
  const db = args.db ?? azureRead;
  const canonicalTenantKey = canonicalCioTowerTenantKey(
    args.tenantKey ?? args.clientId,
  );
  const cioTowerRows = await db.query<CioTowerBudgetFactRollupRow>(
    `select
        coalesce(e.display_name, f.entity_key, 'Unassigned Tower budget slice') as portfolio_company,
        case
          when lower(f.period) = 'fy26' then 'FY2026'
          when lower(f.period) = 'fy25' then 'FY2025'
          else upper(coalesce(f.period, 'FY2026'))
        end as fiscal_year,
        sum(case when f.view = 'it_budget' and f.amount_type = 'none' and f.basis = 'committed' and f.period = 'fy26' then f.value_numeric else 0 end) as total_it_budget_usd,
        0 as actual_spend_ytd_usd,
        null as forecast_spend_usd,
        sum(case when f.view = 'it_budget' and f.amount_type = 'opex' and f.basis = 'committed' and f.period = 'fy26' then f.value_numeric else 0 end) as opex_amount_usd,
        sum(case when f.view = 'it_budget' and f.amount_type = 'capex' and f.basis = 'committed' and f.period = 'fy26' then f.value_numeric else 0 end) as capex_amount_usd,
        sum(case when f.view = 'it_budget' and f.amount_type = 'run' and f.basis = 'committed' and f.period = 'fy26' then f.value_numeric else 0 end) as run_amount_usd,
        sum(case when f.view = 'it_budget' and f.amount_type = 'change' and f.basis = 'committed' and f.period = 'fy26' then f.value_numeric else 0 end) as change_amount_usd,
        0 as vendor_amount_usd,
        0 as labor_amount_usd,
        null as revenue_usd,
        null as employees,
        null as it_spend_as_pct_revenue
       from cio_tower.facts f
       left join cio_tower.entities e on e.entity_key = f.entity_key
      where f.tenant_key = $1
        and f.view = 'it_budget'
        and f.period = 'fy26'
        and f.basis = 'committed'
      group by coalesce(e.display_name, f.entity_key, 'Unassigned Tower budget slice'), f.period
     having sum(case when f.view = 'it_budget' and f.amount_type = 'none' and f.basis = 'committed' and f.period = 'fy26' then f.value_numeric else 0 end) > 0
      order by total_it_budget_usd desc
      limit 100`,
    [canonicalTenantKey],
    { missingTable: "empty" },
  );
  const cioTowerRollups = shapeTowerBudgetRollups(cioTowerRows);
  if (cioTowerRollups.length > 0) return cioTowerRollups;

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
  if (rows.length > 0) return shapeTowerBudgetRollups(rows);

  const tenantAliases = [
    args.tenantKey,
    args.tenantKey?.replace(/-/g, ""),
    args.tenantKey === "lakeshore" ? "lakeshore-holdings" : null,
  ].filter((value): value is string => Boolean(value));

  const sourceRows = await db.query<ContextBudgetRecordRow>(
    `SELECT id, source_file, source_row_number, payload
       FROM enterprise_context_records
      WHERE (client_id = $1 OR lower(tenant_key) = ANY($2::text[]))
        AND (record_type = 'it_budget_financials'
          OR record_subtype = 'it-budget-financials'
          OR source_file ILIKE '%F12_it-budget-financials%')
      ORDER BY source_row_number NULLS LAST
      LIMIT 500`,
    [args.clientId, tenantAliases.map((alias) => alias.toLowerCase())],
    { missingTable: "empty" },
  );

  return shapeBudgetRollupsFromContextRecords(sourceRows);
}
