import { createHash, randomUUID } from "crypto";
import { readFileSync } from "fs";
import path from "path";

import JSZip from "jszip";
import Papa from "papaparse";
import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const EXPECTED_PACKAGE_SHA256 =
  "7a8a992b91ee5b436679d9590adae015c642b6c26db9b89792a825819b345ff6";
const EXPECTED_DATASET_ID = "skyharbor_global_synthetic_current_state_v3";
const DEFAULT_TENANT_KEY = "skyharbor_global";
const EXPECTED_RAW_TABLES = 28;
const EXPECTED_RAW_ROWS = 9656;
const EXPECTED_FY2027_BUDGET = 2_350_000_000;
const EXPECTED_FY2026_ACTUAL = 2_180_000_000;
const EXPECTED_CONTRACT_VALUE = 1_480_500_000;

const DEFAULT_PACKAGE_PATH = path.resolve(
  process.cwd(),
  "scripts/source/fixtures/skyharbor-global-v3/SkyHarbor_Global_Synthetic_Current_State_v3.zip",
);

const SCHEMA_BY_WORKBOOK_KEY: Record<string, string> = {
  enterprise_it: "raw_enterprise_it",
  data_analytics: "raw_data_analytics",
  cloud_hybrid: "raw_cloud_hybrid",
};

const SQL_FILES = [
  "scripts/source/skyharbor-v3/source_six_table_design.sql",
  "scripts/source/skyharbor-v3/tower_measurement_layer.sql",
  "scripts/source/skyharbor-v3/load_source_tower_measurements.sql",
];

interface ManifestSheet {
  sheet: string;
  csv: string;
  row_count: number;
  source_workbook: string;
}

interface ManifestWorkbook {
  key: string;
  sheets: ManifestSheet[];
}

interface DatasetManifest {
  dataset_id: string;
  version: string;
  seed: number;
  workbooks: ManifestWorkbook[];
}

interface RawPlanItem {
  schema: string;
  table: string;
  sourceFile: string;
  sourceWorkbook: string;
  sourceSheet: string;
  originalHeaders: string[];
  normalizedHeaders: string[];
  rows: Record<string, string>[];
  sourceCsvSha256: string;
  expectedRows: number;
}

interface CliArgs {
  apply: boolean;
  packageZip: string;
  tenantKey: string;
  loadRunId: string;
}

interface Reconciliation {
  raw_tables: number;
  raw_rows: number;
  fy2027_budget: number;
  fy2026_actual: number;
  contract_value: number;
  contract_vendor_360_rows: number;
  contract_360_rows: number;
  ai_seat_violations: number;
  passed: boolean;
  failures: string[];
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const value = (name: string): string | undefined => {
    const idx = args.indexOf(name);
    if (idx >= 0) return args[idx + 1];
    const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
    return prefixed?.slice(name.length + 1);
  };

  return {
    apply: args.includes("--apply"),
    packageZip:
      value("--package-zip") ??
      process.env.SKYHARBOR_V3_PACKAGE_ZIP ??
      DEFAULT_PACKAGE_PATH,
    tenantKey: value("--tenant-key") ?? process.env.TENANT_KEY ?? DEFAULT_TENANT_KEY,
    loadRunId: value("--load-run-id") ?? process.env.LOAD_RUN_ID ?? randomUUID(),
  };
}

function databaseUrl(): string {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function sha256(input: Buffer | string): string {
  return createHash("sha256").update(input).digest("hex");
}

function snake(value: string): string {
  return (
    value
      .replace(/\*/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_")
      .toLowerCase() || "column"
  );
}

function tableName(csvPath: string): string {
  const stem = path.basename(csvPath, ".csv");
  return snake(stem).replace(/^\d+[a-z]?_/, "");
}

function normalizedHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const base = snake(header || `blank_header_${index + 1}`);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function quoteIdent(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function rowHash(row: Record<string, string>, headers: string[]): string {
  const payload: Record<string, string> = {};
  for (const header of headers) payload[header] = row[header] ?? "";
  return sha256(JSON.stringify(payload, Object.keys(payload).sort()));
}

async function zipText(zip: JSZip, fileName: string): Promise<string> {
  const entry = zip.file(fileName);
  if (!entry) throw new Error(`Package entry missing: ${fileName}`);
  return entry.async("string");
}

async function buildRawPlan(zip: JSZip): Promise<{
  manifest: DatasetManifest;
  items: RawPlanItem[];
}> {
  const manifest = JSON.parse(
    await zipText(zip, "metadata/dataset_manifest.json"),
  ) as DatasetManifest;
  if (manifest.dataset_id !== EXPECTED_DATASET_ID) {
    throw new Error(
      `Unexpected dataset_id ${manifest.dataset_id}; expected ${EXPECTED_DATASET_ID}`,
    );
  }
  if (manifest.version !== "v3") {
    throw new Error(`Unexpected dataset version ${manifest.version}; expected v3`);
  }

  const items: RawPlanItem[] = [];
  for (const workbook of manifest.workbooks) {
    const schema = SCHEMA_BY_WORKBOOK_KEY[workbook.key];
    if (!schema) throw new Error(`No raw schema mapping for ${workbook.key}`);

    for (const sheet of workbook.sheets) {
      const csvText = await zipText(zip, sheet.csv);
      const parsed = Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => value,
      });
      if (parsed.errors.length > 0) {
        throw new Error(
          `CSV parse failed for ${sheet.csv}: ${parsed.errors
            .map((err) => err.message)
            .join("; ")}`,
        );
      }

      const originalHeaders = parsed.meta.fields ?? [];
      const rows = parsed.data.map((row) => {
        const cleaned: Record<string, string> = {};
        for (const header of originalHeaders) cleaned[header] = row[header] ?? "";
        return cleaned;
      });
      if (rows.length !== sheet.row_count) {
        throw new Error(
          `${sheet.csv} row count ${rows.length} did not match manifest ${sheet.row_count}`,
        );
      }

      items.push({
        schema,
        table: tableName(sheet.csv),
        sourceFile: sheet.csv,
        sourceWorkbook: sheet.source_workbook,
        sourceSheet: sheet.sheet,
        originalHeaders,
        normalizedHeaders: normalizedHeaders(originalHeaders),
        rows,
        sourceCsvSha256: sha256(csvText),
        expectedRows: sheet.row_count,
      });
    }
  }
  return { manifest, items };
}

async function ensureRawTable(client: Client, item: RawPlanItem): Promise<void> {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(item.schema)}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent(item.schema)}._column_map (
      tenant_key text not null,
      dataset_id text not null,
      load_run_id text not null,
      source_table text not null,
      source_file text not null,
      source_workbook text,
      source_sheet text,
      ordinal integer not null,
      original_header text not null,
      snake_name text not null,
      required_flag boolean not null default false,
      created_at timestamptz not null default now()
    )
  `);

  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(item.schema)}.${quoteIdent(item.table)} (
      _tenant_key text not null
    )`,
  );

  for (const column of item.normalizedHeaders) {
    await client.query(
      `ALTER TABLE ${quoteIdent(item.schema)}.${quoteIdent(item.table)}
       ADD COLUMN IF NOT EXISTS ${quoteIdent(column)} text`,
    );
  }

  const technicalColumns = [
    ["_tenant_key", "text"],
    ["_dataset_id", "text"],
    ["_load_run_id", "text"],
    ["_source_file", "text"],
    ["_source_workbook", "text"],
    ["_source_sheet", "text"],
    ["_source_row_number", "bigint"],
    ["_source_csv_sha256", "text"],
    ["_row_sha256", "text"],
    ["_loaded_at", "timestamptz"],
  ] as const;
  for (const [column, type] of technicalColumns) {
    await client.query(
      `ALTER TABLE ${quoteIdent(item.schema)}.${quoteIdent(item.table)}
       ADD COLUMN IF NOT EXISTS ${quoteIdent(column)} ${type}`,
    );
  }

  const indexTargets = [
    "_load_run_id",
    "_source_file",
    "_source_sheet",
    "_source_row_number",
    "_row_sha256",
    ...item.normalizedHeaders.filter(
      (column) =>
        column.endsWith("_id") ||
        column.endsWith("_ref") ||
        column.includes("period") ||
        column.includes("date"),
    ),
  ];
  for (const column of indexTargets) {
    await client.query(
      `CREATE INDEX IF NOT EXISTS ${quoteIdent(`${item.table}_${column.replace(/^_/, "")}_idx`)}
       ON ${quoteIdent(item.schema)}.${quoteIdent(item.table)} (${quoteIdent(column)})`,
    );
  }

  await client.query(
    `CREATE OR REPLACE VIEW ${quoteIdent(item.schema)}.${quoteIdent(`current_${item.table}`)} AS
     SELECT *
       FROM ${quoteIdent(item.schema)}.${quoteIdent(item.table)}
      WHERE _loaded_at = (
        SELECT max(_loaded_at)
          FROM ${quoteIdent(item.schema)}.${quoteIdent(item.table)}
         WHERE _tenant_key = ${quoteIdent(item.table)}._tenant_key
           AND _dataset_id = ${quoteIdent(item.table)}._dataset_id
      )`,
  );
}

async function insertRawRows(
  client: Client,
  item: RawPlanItem,
  args: CliArgs,
  manifest: DatasetManifest,
): Promise<void> {
  await client.query(
    `DELETE FROM ${quoteIdent(item.schema)}.${quoteIdent(item.table)}
      WHERE _tenant_key = $1 AND _dataset_id = $2`,
    [args.tenantKey, manifest.dataset_id],
  );
  await client.query(
    `DELETE FROM ${quoteIdent(item.schema)}._column_map
      WHERE tenant_key = $1 AND dataset_id = $2 AND source_table = $3`,
    [args.tenantKey, manifest.dataset_id, item.table],
  );

  for (let i = 0; i < item.originalHeaders.length; i += 1) {
    await client.query(
      `INSERT INTO ${quoteIdent(item.schema)}._column_map (
        tenant_key, dataset_id, load_run_id, source_table, source_file,
        source_workbook, source_sheet, ordinal, original_header, snake_name,
        required_flag
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        args.tenantKey,
        manifest.dataset_id,
        args.loadRunId,
        item.table,
        item.sourceFile,
        item.sourceWorkbook,
        item.sourceSheet,
        i + 1,
        item.originalHeaders[i],
        item.normalizedHeaders[i],
        item.originalHeaders[i].includes("*"),
      ],
    );
  }

  const columns = [
    ...item.normalizedHeaders,
    "_tenant_key",
    "_dataset_id",
    "_load_run_id",
    "_source_file",
    "_source_workbook",
    "_source_sheet",
    "_source_row_number",
    "_source_csv_sha256",
    "_row_sha256",
    "_loaded_at",
  ];
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const insertSql = `INSERT INTO ${quoteIdent(item.schema)}.${quoteIdent(item.table)}
    (${columns.map(quoteIdent).join(", ")}) VALUES (${placeholders})`;
  const loadedAt = new Date();

  for (let i = 0; i < item.rows.length; i += 1) {
    const sourceRowNumber = i + 2;
    const row = item.rows[i];
    const sourceValues = item.originalHeaders.map((header) => row[header] ?? "");
    await client.query(insertSql, [
      ...sourceValues,
      args.tenantKey,
      manifest.dataset_id,
      args.loadRunId,
      item.sourceFile,
      item.sourceWorkbook,
      item.sourceSheet,
      sourceRowNumber,
      item.sourceCsvSha256,
      rowHash(row, item.originalHeaders),
      loadedAt,
    ]);
  }
}

async function executeSqlFile(client: Client, relativePath: string): Promise<void> {
  const sql = readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
  await client.query(sql);
}

async function reconcile(client: Client, tenantKey: string): Promise<Reconciliation> {
  const rawTables = await client.query<{ n: string }>(
    `select count(*)::text as n
       from information_schema.tables
      where table_schema in ('raw_enterprise_it','raw_data_analytics','raw_cloud_hybrid')
        and table_type = 'BASE TABLE'
        and table_name <> '_column_map'`,
  );
  const rawRows = await client.query<{ n: string }>(`
    select (
      (select count(*) from raw_enterprise_it.enterprise_context where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.business_functions where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.it_portfolios_organization where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.applications_portfolio where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.it_budget_allocations where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.projects_investments where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.kpis_outcomes where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.cxo_function_interviews where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.interview_statements where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.operational_usage_feeds where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.ai_adoption_usage where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.vendors_contracts where _tenant_key = $1) +
      (select count(*) from raw_enterprise_it.risks_controls where _tenant_key = $1) +
      (select count(*) from raw_data_analytics.function_analytics_profile where _tenant_key = $1) +
      (select count(*) from raw_data_analytics.platform_tech_stack where _tenant_key = $1) +
      (select count(*) from raw_data_analytics.function_platform_map where _tenant_key = $1) +
      (select count(*) from raw_data_analytics.source_to_consumption where _tenant_key = $1) +
      (select count(*) from raw_data_analytics.function_volumetrics where _tenant_key = $1) +
      (select count(*) from raw_data_analytics.findings_maturity where _tenant_key = $1) +
      (select count(*) from raw_data_analytics.initiatives_roadmap where _tenant_key = $1) +
      (select count(*) from raw_cloud_hybrid.cloud_strategy_placement where _tenant_key = $1) +
      (select count(*) from raw_cloud_hybrid.data_center_private_cloud where _tenant_key = $1) +
      (select count(*) from raw_cloud_hybrid.public_cloud_estates where _tenant_key = $1) +
      (select count(*) from raw_cloud_hybrid.workload_distribution where _tenant_key = $1) +
      (select count(*) from raw_cloud_hybrid.cloud_platform_capabilities where _tenant_key = $1) +
      (select count(*) from raw_cloud_hybrid.cloud_operations_economics where _tenant_key = $1) +
      (select count(*) from raw_cloud_hybrid.cloud_findings_maturity where _tenant_key = $1) +
      (select count(*) from raw_cloud_hybrid.cloud_initiatives_roadmap where _tenant_key = $1)
    )::text as n`,
    [tenantKey],
  );
  const measures = await client.query<{
    fy2027_budget: string;
    fy2026_actual: string;
    contract_value: string;
    contract_vendor_360_rows: string;
    contract_360_rows: string;
    ai_seat_violations: string;
  }>(
    `
    select
      (select coalesce(sum(budget_amount::numeric), 0)::text from raw_enterprise_it.it_budget_allocations where _tenant_key = $1 and fiscal_year = '2027') as fy2027_budget,
      (select coalesce(sum(actual_amount::numeric), 0)::text from raw_enterprise_it.it_budget_allocations where _tenant_key = $1 and fiscal_year = '2026') as fy2026_actual,
      (select coalesce(sum(annual_value::numeric), 0)::text from raw_enterprise_it.vendors_contracts where _tenant_key = $1) as contract_value,
      (select count(*)::text from source.contract_vendor_360 where tenant_key = $1) as contract_vendor_360_rows,
      (select count(*)::text from source.contract_360 where tenant_key = $1) as contract_360_rows,
      (select count(*)::text from raw_enterprise_it.ai_adoption_usage where _tenant_key = $1 and seats_assigned::numeric > seats_purchased::numeric) as ai_seat_violations
    `,
    [tenantKey],
  );

  const row = measures.rows[0];
  const result = {
    raw_tables: Number(rawTables.rows[0]?.n ?? 0),
    raw_rows: Number(rawRows.rows[0]?.n ?? 0),
    fy2027_budget: Number(row?.fy2027_budget ?? 0),
    fy2026_actual: Number(row?.fy2026_actual ?? 0),
    contract_value: Number(row?.contract_value ?? 0),
    contract_vendor_360_rows: Number(row?.contract_vendor_360_rows ?? 0),
    contract_360_rows: Number(row?.contract_360_rows ?? 0),
    ai_seat_violations: Number(row?.ai_seat_violations ?? 0),
  };

  const failures: string[] = [];
  if (result.raw_tables !== EXPECTED_RAW_TABLES) failures.push("raw table count");
  if (result.raw_rows !== EXPECTED_RAW_ROWS) failures.push("raw row count");
  if (result.fy2027_budget !== EXPECTED_FY2027_BUDGET) failures.push("FY2027 budget");
  if (result.fy2026_actual !== EXPECTED_FY2026_ACTUAL) failures.push("FY2026 actual");
  if (result.contract_value !== EXPECTED_CONTRACT_VALUE) failures.push("contract value");
  if (result.contract_vendor_360_rows !== 119) failures.push("source.contract_vendor_360 rows");
  if (result.contract_360_rows !== 119) failures.push("source.contract_360 rows");
  if (result.ai_seat_violations !== 0) failures.push("AI seat violations");

  return { ...result, passed: failures.length === 0, failures };
}

async function main() {
  const args = parseArgs();
  const zipBuffer = readFileSync(args.packageZip);
  const packageSha256 = sha256(zipBuffer);
  if (packageSha256 !== EXPECTED_PACKAGE_SHA256) {
    throw new Error(
      `Package SHA mismatch: ${packageSha256}; expected ${EXPECTED_PACKAGE_SHA256}`,
    );
  }

  const zip = await JSZip.loadAsync(zipBuffer);
  const { manifest, items } = await buildRawPlan(zip);
  const rawRows = items.reduce((sum, item) => sum + item.rows.length, 0);

  if (!args.apply) {
    console.log(
      JSON.stringify(
        {
          event: "skyharbor_v3_current_state_load_plan",
          apply: false,
          packageSha256,
          tenantKey: args.tenantKey,
          datasetId: manifest.dataset_id,
          loadRunId: args.loadRunId,
          rawTables: items.length,
          rawRows,
          tables: items.map((item) => ({
            schema: item.schema,
            table: item.table,
            sourceFile: item.sourceFile,
            rows: item.rows.length,
            columns: item.normalizedHeaders.length,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  const client = new Client(
    postgresClientOptions(databaseUrl(), "skyharbor-v3-current-state-load"),
  );
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    for (const item of items) {
      await ensureRawTable(client, item);
      await insertRawRows(client, item, args, manifest);
    }
    for (const sqlFile of SQL_FILES) await executeSqlFile(client, sqlFile);
    const reconciliation = await reconcile(client, args.tenantKey);
    if (!reconciliation.passed) {
      throw new Error(
        `SkyHarbor v3 reconciliation failed: ${JSON.stringify(reconciliation)}`,
      );
    }
    await client.query("commit");
    console.log(
      JSON.stringify(
        {
          event: "skyharbor_v3_current_state_loaded",
          apply: true,
          packageSha256,
          tenantKey: args.tenantKey,
          datasetId: manifest.dataset_id,
          loadRunId: args.loadRunId,
          reconciliation,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
