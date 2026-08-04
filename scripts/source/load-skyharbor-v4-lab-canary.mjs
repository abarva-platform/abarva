import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import Papa from "papaparse";
import { Client } from "pg";

const EXPECTED_DATASET_ID = "skyharbor-source-v4-202608";
const EXPECTED_DATASET_VERSION = "v4";
const EXPECTED_TENANT_KEY = "skyharbor_global";
const EXPECTED_ROWS = 195_960;
const EXPECTED_CONTRACTS = 100;
const EXPECTED_VENDORS = 60;
const EXPECTED_CONTRACT_VALUE = 1_480_500_000;
const RAW_SCHEMA = "raw_source_v4";
const CANARY_SCHEMA = "consumption_v4_canary";

const DEFAULT_PACKAGE_PATH =
  "/Users/anand/Downloads/SkyHarbor_Source_V4_Synthetic_System_Extracts_20260804T012431Z.zip";

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
    return args
      .find((arg) => arg.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  };
  return {
    apply:
      args.includes("--apply") || process.env.SOURCE_V4_CANARY_APPLY === "true",
    packageZip:
      value("--package-zip") ||
      process.env.SOURCE_V4_PACKAGE_ZIP ||
      DEFAULT_PACKAGE_PATH,
    tenantKey:
      value("--tenant-key") ||
      process.env.SOURCE_V4_TENANT_KEY ||
      EXPECTED_TENANT_KEY,
    datasetId:
      value("--dataset-id") ||
      process.env.SOURCE_V4_DATASET_ID ||
      EXPECTED_DATASET_ID,
    loadRunId:
      value("--load-run-id") ||
      process.env.LOAD_RUN_ID ||
      `source-v4-canary-${stamp()}`,
  };
}

function databaseUrl() {
  return (
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL
  );
}

function postgresClientOptions(connectionString, applicationName) {
  return {
    connectionString,
    application_name: applicationName,
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 120000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 120000),
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: true },
  };
}

function stamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/gu, "")
    .replace(/\.\d{3}Z$/u, "Z");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function snake(value) {
  return (
    String(value || "column")
      .replace(/[^A-Za-z0-9]+/gu, "_")
      .replace(/^_+|_+$/gu, "")
      .replace(/_+/gu, "_")
      .toLowerCase() || "column"
  );
}

function tableName(file) {
  return snake(path.basename(file, ".csv"));
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/gu, '""')}"`;
}

function normalizeHeaders(headers) {
  const seen = new Map();
  return headers.map((header, index) => {
    const base = snake(header || `blank_header_${index + 1}`);
    const next = (seen.get(base) || 0) + 1;
    seen.set(base, next);
    return next === 1 ? base : `${base}_${next}`;
  });
}

function rowHash(row, headers) {
  return sha256(
    headers
      .map((header) => `${header}=${String(row[header] ?? "").trim()}`)
      .join("\n"),
  );
}

async function zipText(zip, name) {
  const entry = zip.file(name);
  if (!entry) throw new Error(`Missing ZIP entry: ${name}`);
  return entry.async("string");
}

async function buildPlan(packageZip, tenantKey, datasetId) {
  const buffer = fs.readFileSync(packageZip);
  const zip = await JSZip.loadAsync(buffer);
  const manifest = JSON.parse(
    await zipText(zip, "csv/source_v4_package_manifest.json"),
  );
  if (manifest.dataset_id !== datasetId)
    throw new Error(`dataset_id mismatch: ${manifest.dataset_id}`);
  if (manifest.dataset_version !== EXPECTED_DATASET_VERSION)
    throw new Error(`dataset_version mismatch: ${manifest.dataset_version}`);
  if (manifest.tenant_key !== tenantKey)
    throw new Error(`tenant_key mismatch: ${manifest.tenant_key}`);

  const items = [];
  for (const fileDecl of manifest.files) {
    const zipPath = `csv/${fileDecl.file}`;
    const csvText = await zipText(zip, zipPath);
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) {
      throw new Error(
        `${fileDecl.file} parse failed: ${parsed.errors.map((error) => error.message).join("; ")}`,
      );
    }
    const originalHeaders = parsed.meta.fields || [];
    const normalizedHeaders = normalizeHeaders(originalHeaders);
    const rows = parsed.data.map((row) =>
      Object.fromEntries(
        originalHeaders.map((header) => [header, row[header] ?? ""]),
      ),
    );
    if (rows.length !== Number(fileDecl.expected_rows)) {
      throw new Error(
        `${fileDecl.file} expected ${fileDecl.expected_rows} rows, got ${rows.length}`,
      );
    }
    if (sha256(csvText) !== fileDecl.sha256)
      throw new Error(`${fileDecl.file} SHA mismatch`);
    items.push({
      file: fileDecl.file,
      table: tableName(fileDecl.file),
      domain: fileDecl.domain_contract,
      grain: fileDecl.grain,
      originalHeaders,
      normalizedHeaders,
      rows,
      csvSha256: sha256(csvText),
    });
  }

  return { packageSha256: sha256(buffer), manifest, items };
}

async function ensureRawTable(client, item) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(RAW_SCHEMA)}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent(RAW_SCHEMA)}._column_map (
      tenant_key text not null,
      dataset_id text not null,
      load_run_id text not null,
      source_table text not null,
      source_file text not null,
      ordinal integer not null,
      original_header text not null,
      snake_name text not null,
      domain_contract text,
      grain text,
      created_at timestamptz not null default now()
    )
  `);
  await client.query(
    `CREATE TABLE IF NOT EXISTS ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(item.table)} (_tenant_key text not null)`,
  );
  for (const column of item.normalizedHeaders) {
    await client.query(
      `ALTER TABLE ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(item.table)} ADD COLUMN IF NOT EXISTS ${quoteIdent(column)} text`,
    );
  }
  for (const [column, type] of [
    ["_dataset_id", "text"],
    ["_load_run_id", "text"],
    ["_source_file", "text"],
    ["_source_row_number", "bigint"],
    ["_source_csv_sha256", "text"],
    ["_row_sha256", "text"],
    ["_loaded_at", "timestamptz"],
  ]) {
    await client.query(
      `ALTER TABLE ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(item.table)} ADD COLUMN IF NOT EXISTS ${quoteIdent(column)} ${type}`,
    );
  }
  for (const column of [
    "_tenant_key",
    "_dataset_id",
    "_load_run_id",
    "_source_file",
    "contract_id",
    "vendor_id",
    "supplier_id",
    "period_start",
  ]) {
    if (column.startsWith("_") || item.normalizedHeaders.includes(column)) {
      await client.query(
        `CREATE INDEX IF NOT EXISTS ${quoteIdent(`${item.table}_${column.replace(/^_/u, "")}_idx`)}
         ON ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(item.table)} (${quoteIdent(column)})`,
      );
    }
  }
}

async function insertRows(client, item, args) {
  await client.query(
    `DELETE FROM ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(item.table)} WHERE _tenant_key = $1 AND _dataset_id = $2`,
    [args.tenantKey, args.datasetId],
  );
  await client.query(
    `DELETE FROM ${quoteIdent(RAW_SCHEMA)}._column_map WHERE tenant_key = $1 AND dataset_id = $2 AND source_table = $3`,
    [args.tenantKey, args.datasetId, item.table],
  );
  for (let index = 0; index < item.originalHeaders.length; index += 1) {
    await client.query(
      `INSERT INTO ${quoteIdent(RAW_SCHEMA)}._column_map
       (tenant_key, dataset_id, load_run_id, source_table, source_file, ordinal, original_header, snake_name, domain_contract, grain)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        args.tenantKey,
        args.datasetId,
        args.loadRunId,
        item.table,
        item.file,
        index + 1,
        item.originalHeaders[index],
        item.normalizedHeaders[index],
        item.domain,
        item.grain,
      ],
    );
  }

  const columns = [
    ...item.normalizedHeaders,
    "_tenant_key",
    "_dataset_id",
    "_load_run_id",
    "_source_file",
    "_source_row_number",
    "_source_csv_sha256",
    "_row_sha256",
    "_loaded_at",
  ];
  const loadedAt = new Date();
  const maxParams = 30000;
  const batchSize = Math.max(1, Math.floor(maxParams / columns.length));
  for (let start = 0; start < item.rows.length; start += batchSize) {
    const batch = item.rows.slice(start, start + batchSize);
    const values = [];
    const placeholders = [];
    for (let rowIndex = 0; rowIndex < batch.length; rowIndex += 1) {
      const row = batch[rowIndex];
      const rowValues = [
        ...item.originalHeaders.map((header) => row[header] ?? ""),
        args.tenantKey,
        args.datasetId,
        args.loadRunId,
        item.file,
        start + rowIndex + 2,
        item.csvSha256,
        rowHash(row, item.originalHeaders),
        loadedAt,
      ];
      const offset = values.length;
      values.push(...rowValues);
      placeholders.push(
        `(${rowValues.map((_, index) => `$${offset + index + 1}`).join(", ")})`,
      );
    }
    await client.query(
      `INSERT INTO ${quoteIdent(RAW_SCHEMA)}.${quoteIdent(item.table)} (${columns.map(quoteIdent).join(", ")}) VALUES ${placeholders.join(", ")}`,
      values,
    );
  }
}

async function createCanaryViews(client) {
  await client.query(
    `CREATE SCHEMA IF NOT EXISTS ${quoteIdent(CANARY_SCHEMA)}`,
  );
  await client.query(`
    CREATE OR REPLACE VIEW ${quoteIdent(CANARY_SCHEMA)}.sourcing_contract_v1 AS
    SELECT
      _tenant_key AS tenant_key,
      contract_id,
      vendor_id,
      supplier_name AS vendor_name,
      agreement_type,
      renewal_type,
      (auto_renew_flag = 'true') AS auto_renew,
      quality_state,
      effective_date::date AS effective_date,
      expiration_date::date AS expiration_date,
      notice_deadline::date AS notice_deadline,
      annual_value::numeric AS annual_value,
      committed_value::numeric AS total_committed_value,
      CASE WHEN commercial_confidence IN ('reviewed','system_record') THEN 0.92 ELSE 0.61 END::numeric AS confidence
    FROM ${quoteIdent(RAW_SCHEMA)}.ariba_contract_workspaces
  `);
  await client.query(`
    CREATE OR REPLACE VIEW ${quoteIdent(CANARY_SCHEMA)}.sourcing_vendor_v1 AS
    SELECT
      s._tenant_key AS tenant_key,
      s.vendor_id,
      s.legal_name,
      s.supplier_category,
      s.vendor_management_segment AS strategic_status,
      s.risk_tier,
      s.relationship_owner_role,
      s.quality_state,
      count(c.contract_id)::int AS contract_count,
      coalesce(sum(c.annual_value::numeric), 0)::numeric AS annual_value
    FROM ${quoteIdent(RAW_SCHEMA)}.ariba_suppliers s
    LEFT JOIN ${quoteIdent(RAW_SCHEMA)}.ariba_contract_workspaces c
      ON c._tenant_key = s._tenant_key AND c.vendor_id = s.vendor_id
    GROUP BY s._tenant_key, s.vendor_id, s.legal_name, s.supplier_category, s.vendor_management_segment, s.risk_tier, s.relationship_owner_role, s.quality_state
  `);
  await client.query(`
    CREATE OR REPLACE VIEW ${quoteIdent(CANARY_SCHEMA)}.sourcing_contract_scope_v1 AS
    SELECT
      _tenant_key AS tenant_key,
      source_record_id AS contract_scope_id,
      contract_id,
      'application_platform_service' AS scope_type,
      application_name AS scope_name,
      criticality,
      relationship_method,
      relationship_confidence::numeric AS relationship_confidence,
      quality_state
    FROM ${quoteIdent(RAW_SCHEMA)}.leanix_contract_scope
  `);
  await client.query(`
    CREATE OR REPLACE VIEW ${quoteIdent(CANARY_SCHEMA)}.sourcing_spend_monthly_v1 AS
    SELECT
      _tenant_key AS tenant_key,
      contract_id,
      vendor_id,
      date_trunc('month', service_period_start::date)::date AS month,
      business_unit,
      cost_center,
      matching_state,
      count(*)::int AS invoice_lines,
      coalesce(sum(actual_spend::numeric), 0)::numeric AS actual_spend,
      coalesce(sum(commitment_amount::numeric), 0)::numeric AS committed_amount
    FROM ${quoteIdent(RAW_SCHEMA)}.s4_vendor_invoice_lines
    GROUP BY _tenant_key, contract_id, vendor_id, date_trunc('month', service_period_start::date)::date, business_unit, cost_center, matching_state
  `);
  await client.query(`
    CREATE OR REPLACE VIEW ${quoteIdent(CANARY_SCHEMA)}.sourcing_performance_v1 AS
    SELECT
      _tenant_key AS tenant_key,
      contract_id,
      service_id,
      metric_name,
      period_start::date AS period_start,
      period_end::date AS period_end,
      target::numeric AS target,
      actual::numeric AS actual,
      breach_count::int AS breach_count,
      credit_calculated::numeric AS credit_calculated,
      credit_claimed::numeric AS credit_claimed,
      credit_recovered::numeric AS credit_recovered,
      claim_state,
      dispute_status,
      quality_state
    FROM ${quoteIdent(RAW_SCHEMA)}.servicenow_sla_monthly
  `);
  await client.query(`
    CREATE OR REPLACE VIEW ${quoteIdent(CANARY_SCHEMA)}.sourcing_context_coverage_v1 AS
    SELECT
      c._tenant_key AS tenant_key,
      (SELECT count(*) FROM ${quoteIdent(RAW_SCHEMA)}.ariba_suppliers s WHERE s._tenant_key = c._tenant_key)::int AS vendors,
      count(*)::int AS contracts,
      coalesce(sum(c.annual_value::numeric), 0)::numeric AS annual_value,
      (SELECT count(*) FROM ${quoteIdent(RAW_SCHEMA)}.leanix_contract_scope s WHERE s._tenant_key = c._tenant_key)::int AS scope_rows,
      (SELECT count(*) FROM ${quoteIdent(RAW_SCHEMA)}.s4_vendor_invoice_lines f WHERE f._tenant_key = c._tenant_key)::int AS invoice_lines,
      (SELECT count(*) FROM ${quoteIdent(RAW_SCHEMA)}.entra_saas_usage_monthly u WHERE u._tenant_key = c._tenant_key)::int AS saas_usage_rows,
      (SELECT count(*) FROM ${quoteIdent(RAW_SCHEMA)}.azure_cost_monthly a WHERE a._tenant_key = c._tenant_key)::int AS cloud_rows,
      (SELECT count(*) FROM ${quoteIdent(RAW_SCHEMA)}.servicenow_sla_monthly p WHERE p._tenant_key = c._tenant_key)::int AS performance_rows
    FROM ${quoteIdent(RAW_SCHEMA)}.ariba_contract_workspaces c
    GROUP BY c._tenant_key
  `);
}

async function reconcile(client, args, itemCount) {
  const row = (
    await client.query(
      `
    SELECT
      (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = $2 AND table_type = 'BASE TABLE' AND table_name <> '_column_map') AS raw_tables,
      (SELECT coalesce(sum((xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I WHERE _tenant_key = %L AND _dataset_id = %L', table_schema, table_name, $1, $3), false, true, '')))[1]::text::int), 0)
         FROM information_schema.tables
        WHERE table_schema = $2 AND table_type = 'BASE TABLE' AND table_name <> '_column_map') AS raw_rows,
      (SELECT count(*)::int FROM ${quoteIdent(CANARY_SCHEMA)}.sourcing_contract_v1 WHERE tenant_key = $1) AS contracts,
      (SELECT count(*)::int FROM ${quoteIdent(CANARY_SCHEMA)}.sourcing_vendor_v1 WHERE tenant_key = $1) AS vendors,
      (SELECT coalesce(sum(annual_value), 0)::numeric FROM ${quoteIdent(CANARY_SCHEMA)}.sourcing_contract_v1 WHERE tenant_key = $1) AS annual_value
    `,
      [args.tenantKey, RAW_SCHEMA, args.datasetId],
    )
  ).rows[0];
  const failures = [];
  if (Number(row.raw_tables) !== itemCount) failures.push("raw table count");
  if (Number(row.raw_rows) !== EXPECTED_ROWS) failures.push("raw row count");
  if (Number(row.contracts) !== EXPECTED_CONTRACTS)
    failures.push("contract count");
  if (Number(row.vendors) !== EXPECTED_VENDORS) failures.push("vendor count");
  if (Number(row.annual_value) !== EXPECTED_CONTRACT_VALUE)
    failures.push("contract annual value");
  return { ...row, passed: failures.length === 0, failures };
}

async function main() {
  const args = parseArgs();
  const plan = await buildPlan(args.packageZip, args.tenantKey, args.datasetId);
  const totalRows = plan.items.reduce((sum, item) => sum + item.rows.length, 0);
  const dryRun = {
    event: "skyharbor_v4_lab_canary_load_plan",
    apply: false,
    packageSha256: plan.packageSha256,
    tenantKey: args.tenantKey,
    datasetId: args.datasetId,
    loadRunId: args.loadRunId,
    rawSchema: RAW_SCHEMA,
    canarySchema: CANARY_SCHEMA,
    rawTables: plan.items.length,
    rawRows: totalRows,
    files: plan.items.map((item) => ({
      file: item.file,
      table: item.table,
      domain: item.domain,
      rows: item.rows.length,
    })),
  };
  if (!args.apply) {
    console.log(JSON.stringify(dryRun, null, 2));
    return;
  }
  const url = databaseUrl();
  if (!url)
    throw new Error(
      "Missing lab database URL. Set SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  const client = new Client(
    postgresClientOptions(url, "skyharbor-v4-lab-canary-load"),
  );
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    for (const item of plan.items) {
      await ensureRawTable(client, item);
      await insertRows(client, item, args);
    }
    await createCanaryViews(client);
    const reconciliation = await reconcile(client, args, plan.items.length);
    if (!reconciliation.passed)
      throw new Error(
        `Source v4 canary reconciliation failed: ${JSON.stringify(reconciliation)}`,
      );
    await client.query("commit");
    console.log(
      JSON.stringify(
        {
          ...dryRun,
          event: "skyharbor_v4_lab_canary_loaded",
          apply: true,
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
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
