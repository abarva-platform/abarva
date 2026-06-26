#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";

const TENANT_KEY = "lakeshore-holdings";
const DEFAULT_DATASET_ROOT = "datasets/lakeshore-holdings-synthetic-v4";

interface Args {
  datasetRoot: string;
  apply: boolean;
}

type CsvRow = Record<string, string>;

function parseArgs(argv: readonly string[]): Args {
  const out: Args = { datasetRoot: DEFAULT_DATASET_ROOT, apply: false };
  for (const arg of argv) {
    if (arg === "--apply") out.apply = true;
    else if (arg.startsWith("--dataset-root="))
      out.datasetRoot = arg.slice("--dataset-root=".length);
  }
  return out;
}

function loadEnvFiles(): void {
  for (const envPath of [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
  ]) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] ??= value;
    }
  }
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length === 0) return [];
  const headers = rows[0]!.map((header) => header.trim());
  return rows
    .slice(1)
    .filter((values) => values.some((value) => value.trim()))
    .map((values) => {
      const record: CsvRow = {};
      headers.forEach((header, idx) => {
        record[header] = (values[idx] ?? "").trim();
      });
      return record;
    });
}

function readCsv(datasetRoot: string, relPath: string): CsvRow[] {
  const fullPath = path.resolve(process.cwd(), datasetRoot, relPath);
  return parseCsv(fs.readFileSync(fullPath, "utf8"));
}

function num(value: unknown): number | null {
  const parsed = Number(
    String(value ?? "")
      .replace(/[$,%]/g, "")
      .replace(/,/g, "")
      .trim(),
  );
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

async function resolveClientId(db: PostgresCompatClient): Promise<string> {
  const aliases = [TENANT_KEY, "lakeshore", "lakeshore-industries"];
  const { data, error } = await db
    .from("clients")
    .select("id, tenant_key, slug, name")
    .or(aliases.map((alias) => `tenant_key.eq.${alias}`).join(","));
  if (error) throw new Error(`clients lookup failed: ${error.message}`);
  const rows = (data ?? []) as Array<{
    id: string;
    tenant_key?: string | null;
    slug?: string | null;
    name?: string | null;
  }>;
  const row = rows.find((item) => item.tenant_key === TENANT_KEY) ?? rows[0];
  if (!row?.id) throw new Error(`No clients row found for ${TENANT_KEY}`);
  return row.id;
}

async function deleteScoped(
  db: PostgresCompatClient,
  table: string,
): Promise<number> {
  const { error, count } = await db
    .from(table)
    .delete({ count: "exact" })
    .eq("tenant_key", TENANT_KEY);
  if (error) throw new Error(`${table} delete failed: ${error.message}`);
  return count ?? 0;
}

async function upsertRows(
  db: PostgresCompatClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  onConflict: string,
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error, count } = await db
    .from(table)
    .upsert(rows, { onConflict })
    .select("id");
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return count ?? rows.length;
}

function addMoney(current: number, value: unknown): number {
  return current + (num(value) ?? 0);
}

function buildBudgetRows(
  clientId: string,
  f12Rows: CsvRow[],
  portfolioRows: CsvRow[],
): Array<Record<string, unknown>> {
  const profileByPortfolio = new Map(
    portfolioRows.map((row) => [text(row.portfolio_company), row]),
  );
  const grouped = new Map<string, Record<string, number | string | null>>();

  for (const row of f12Rows) {
    const portfolio = text(
      row.portfolio_company,
      "Unassigned portfolio company",
    );
    const current =
      grouped.get(portfolio) ??
      ({
        fiscal_year: text(row.fiscal_year, "FY2026"),
        total_it_budget_usd: 0,
        actual_spend_ytd_usd: 0,
        forecast_spend_usd: 0,
        opex_amount_usd: 0,
        capex_amount_usd: 0,
        run_amount_usd: 0,
        change_amount_usd: 0,
        vendor_amount_usd: 0,
        labor_amount_usd: 0,
      } satisfies Record<string, number | string | null>);

    current.total_it_budget_usd = addMoney(
      Number(current.total_it_budget_usd ?? 0),
      row.total_it_budget_usd,
    );
    current.actual_spend_ytd_usd = addMoney(
      Number(current.actual_spend_ytd_usd ?? 0),
      row.actual_spend_ytd_usd,
    );
    current.forecast_spend_usd = addMoney(
      Number(current.forecast_spend_usd ?? 0),
      row.forecast_spend_usd,
    );
    current.opex_amount_usd = addMoney(
      Number(current.opex_amount_usd ?? 0),
      row.opex_amount_usd,
    );
    current.capex_amount_usd = addMoney(
      Number(current.capex_amount_usd ?? 0),
      row.capex_amount_usd,
    );
    current.run_amount_usd = addMoney(
      Number(current.run_amount_usd ?? 0),
      row.run_amount_usd,
    );
    current.change_amount_usd = addMoney(
      Number(current.change_amount_usd ?? 0),
      row.change_amount_usd,
    );
    current.vendor_amount_usd = addMoney(
      Number(current.vendor_amount_usd ?? 0),
      row.vendor_amount_usd,
    );
    current.labor_amount_usd = addMoney(
      Number(current.labor_amount_usd ?? 0),
      row.labor_amount_usd,
    );
    grouped.set(portfolio, current);
  }

  return [...grouped.entries()].map(([portfolio, amounts]) => {
    const profile = profileByPortfolio.get(portfolio);
    return {
      client_id: clientId,
      tenant_key: TENANT_KEY,
      period_label: "current",
      fiscal_year: text(amounts.fiscal_year, "FY2026"),
      portfolio_company: portfolio,
      total_it_budget_usd: amounts.total_it_budget_usd ?? 0,
      actual_spend_ytd_usd: amounts.actual_spend_ytd_usd ?? 0,
      forecast_spend_usd: amounts.forecast_spend_usd ?? null,
      opex_amount_usd: amounts.opex_amount_usd ?? 0,
      capex_amount_usd: amounts.capex_amount_usd ?? 0,
      run_amount_usd: amounts.run_amount_usd ?? 0,
      change_amount_usd: amounts.change_amount_usd ?? 0,
      vendor_amount_usd: amounts.vendor_amount_usd ?? 0,
      labor_amount_usd: amounts.labor_amount_usd ?? 0,
      revenue_usd: num(profile?.revenue_usd),
      employees: num(profile?.employees),
      it_spend_as_pct_revenue: num(profile?.it_spend_as_pct_revenue),
      source_file: "family-4-financial-commercial/F12_it-budget-financials.csv",
      lineage: JSON.stringify({
        source: "lakeshore_enriched_tower_package",
        profile_source: "derived-tower-read-model/portfolio-company-spend.csv",
      }),
    };
  });
}

function buildInitiativeRows(
  clientId: string,
  datasetRoot: string,
): Array<Record<string, unknown>> {
  const initiatives = readCsv(
    datasetRoot,
    "ai-control-tower/T01_initiative-registry.csv",
  );
  const spendById = new Map(
    readCsv(datasetRoot, "ai-control-tower/T08_spend-contracts.csv").map(
      (row) => [row.initiative_id, row],
    ),
  );
  const benefitById = new Map(
    readCsv(datasetRoot, "ai-control-tower/T07_benefit-realization.csv").map(
      (row) => [row.initiative_id, row],
    ),
  );
  const riskById = new Map(
    readCsv(datasetRoot, "ai-control-tower/T09_risk-governance.csv").map(
      (row) => [row.initiative_id, row],
    ),
  );

  return initiatives.map((row) => {
    const id = text(row.initiative_id);
    const spend = spendById.get(id);
    const benefit = benefitById.get(id);
    const risk = riskById.get(id);
    const status = text(row.status).toLowerCase();
    const statusFlag =
      text(risk?.severity).toLowerCase() === "high" || status === "at_risk"
        ? "value_lag"
        : status === "mobilize"
          ? "foundation_phase"
          : "healthy";
    return {
      client_id: clientId,
      tenant_key: TENANT_KEY,
      period_label: "current",
      initiative_id: id,
      display_id: id,
      name: text(row.initiative_name, id),
      description: `${text(row.portfolio_company)} · ${text(row.business_function)} · ${text(row.scope_type)}`,
      category_id: text(row.business_function, "it_portfolio"),
      category_name: text(row.business_function, "IT portfolio").replace(
        /_/g,
        " ",
      ),
      goal_id: "tower_it_portfolio",
      goal_name: "IT portfolio value and control",
      stage: text(row.stage, "pilot"),
      stage_detail: text(row.stage),
      owner_name: text(row.owner, "Loaded owner role"),
      owner_title: text(row.owner, "Loaded owner role"),
      owner_function: text(row.business_function),
      committed_annual_usd: num(spend?.annual_budget_usd),
      committed_total_usd: num(benefit?.committed_value_usd),
      measured_value_usd: num(benefit?.realized_value_usd),
      status_flag: statusFlag,
      status_summary: text(
        risk?.exception_or_gap,
        text(row.status, "Loaded from Tower package."),
      ),
      confidence_level: text(benefit?.confidence, "medium")
        .toUpperCase()
        .startsWith("HIGH")
        ? "HIGH"
        : "MED",
      aligned_callout: statusFlag === "healthy",
      aligned_rationale: null,
      loaded_via_template: "lakeshore-holdings-v4-tower-enriched-ready",
      amount_type: "annual_run_rate",
      accounting_treatment: "mixed",
      spend_posture: "change",
      scope_type:
        text(row.scope_type) === "enterprise_shared_platform"
          ? "enterprise_shared_platform"
          : "portfolio_company_specific",
      allocation_method: "manual_allocation",
      portfolio_company: text(row.portfolio_company),
      operating_company: text(row.portfolio_company),
      legal_entity: null,
      business_unit: text(row.portfolio_company),
      business_function: text(row.business_function),
      is_synthetic: true,
      is_outlier: false,
      evidence_ids: [text(row.evidence_id, id)],
      citations: JSON.stringify([
        {
          source_file: "ai-control-tower/T01_initiative-registry.csv",
          source_row: id,
        },
      ]),
      lineage: JSON.stringify({ source: "lakeshore_enriched_tower_package" }),
      gaps: JSON.stringify([]),
      freshness_status: "FY2026 synthetic reference",
    };
  });
}

function buildVendorRows(
  clientId: string,
  rows: CsvRow[],
): Array<Record<string, unknown>> {
  return rows.map((row, index) => {
    const vendor = text(row.vendor, `Vendor ${index + 1}`);
    return {
      client_id: clientId,
      tenant_key: TENANT_KEY,
      period_label: "current",
      vendor_id: `lak-vendor-${slug(text(row.portfolio_company))}-${slug(vendor)}`,
      vendor_name: vendor,
      logical_vendor_key: slug(vendor),
      initiative_id: null,
      initiative_display_id: text(row.portfolio_company),
      initiative_name: text(row.portfolio_company),
      contract_value_usd: num(row.annual_spend_usd),
      renewal_date: null,
      financial_health:
        text(row.max_criticality).toLowerCase() === "high"
          ? "watch"
          : "moderate",
      amount_type: "annual_run_rate",
      accounting_treatment: "opex",
      spend_posture: "run",
      scope_type:
        text(row.portfolio_company) === "Lakeshore Shared Services"
          ? "enterprise_shared_platform"
          : "portfolio_company_specific",
      allocation_method: "manual_allocation",
      is_duplicate_rollup: false,
      duplicate_group_key: null,
      duplicate_raw_row_count: Math.max(1, num(row.contract_count) ?? 1),
      is_synthetic: true,
      is_outlier: false,
      evidence_ids: [`vendor-exposure:${vendor}`],
      citations: JSON.stringify([
        { source_file: "derived-tower-read-model/vendor-exposure.csv", vendor },
      ]),
      lineage: JSON.stringify({ source: "lakeshore_enriched_tower_package" }),
      gaps: JSON.stringify([]),
    };
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const datasetRoot = path.resolve(process.cwd(), args.datasetRoot);
  if (!fs.existsSync(datasetRoot))
    throw new Error(`Dataset root not found: ${datasetRoot}`);

  loadEnvFiles();
  const db = args.apply ? getAzureWriteFluentClient() : null;
  const clientId = db ? await resolveClientId(db) : "dry-run-client-id";

  const f12BudgetRows = readCsv(
    args.datasetRoot,
    "family-4-financial-commercial/F12_it-budget-financials.csv",
  );
  const portfolioSourceRows = readCsv(
    args.datasetRoot,
    "derived-tower-read-model/portfolio-company-spend.csv",
  );
  const vendorSourceRows = readCsv(
    args.datasetRoot,
    "derived-tower-read-model/vendor-exposure.csv",
  );
  const initiativeRows = buildInitiativeRows(clientId, args.datasetRoot);
  const budgetRows = buildBudgetRows(
    clientId,
    f12BudgetRows,
    portfolioSourceRows,
  );
  const vendorRows = buildVendorRows(clientId, vendorSourceRows);

  const summary = {
    tenantKey: TENANT_KEY,
    clientId,
    mode: args.apply ? "apply" : "dry-run",
    input: {
      budgetRollups: budgetRows.length,
      initiatives: initiativeRows.length,
      vendors: vendorRows.length,
    },
    totals: {
      totalItBudgetUsd: budgetRows.reduce(
        (sum, row) => sum + Number(row.total_it_budget_usd ?? 0),
        0,
      ),
      spendYtdUsd: budgetRows.reduce(
        (sum, row) => sum + Number(row.actual_spend_ytd_usd ?? 0),
        0,
      ),
      vendorBudgetUsd: budgetRows.reduce(
        (sum, row) => sum + Number(row.vendor_amount_usd ?? 0),
        0,
      ),
      namedVendorExposureUsd: vendorRows.reduce(
        (sum, row) => sum + Number(row.contract_value_usd ?? 0),
        0,
      ),
      initiativeBudgetUsd: initiativeRows.reduce(
        (sum, row) => sum + Number(row.committed_annual_usd ?? 0),
        0,
      ),
    },
  };

  if (!args.apply || !db) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const deleted = {
    budgetRollups: await deleteScoped(db, "tower_budget_rollups"),
    initiatives: await deleteScoped(db, "tower_read_model_initiatives"),
    vendors: await deleteScoped(db, "tower_read_model_vendors"),
    gaps: await deleteScoped(db, "tower_gap_register"),
    spendAudit: await deleteScoped(db, "tower_spend_realism_audit"),
    forbidden: await deleteScoped(db, "tower_forbidden_identifiers"),
  };
  const written = {
    budgetRollups: await upsertRows(
      db,
      "tower_budget_rollups",
      budgetRows,
      "client_id,period_label,fiscal_year,portfolio_company",
    ),
    initiatives: await upsertRows(
      db,
      "tower_read_model_initiatives",
      initiativeRows,
      "client_id,initiative_id,period_label",
    ),
    vendors: await upsertRows(
      db,
      "tower_read_model_vendors",
      vendorRows,
      "client_id,logical_vendor_key,period_label",
    ),
  };
  console.log(JSON.stringify({ ...summary, deleted, written }, null, 2));
}

const isCli =
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module;
const isEsmCli =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli || isEsmCli) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
