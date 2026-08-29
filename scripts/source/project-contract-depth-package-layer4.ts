#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

type Mode = "plan" | "apply" | "verify";

interface Args {
  readonly mode: Mode;
  readonly tenantKey: string;
  readonly datasetVersion: string;
  readonly loadRunId: string;
  readonly idempotencyKey: string;
  readonly proofDir: string;
  readonly applyApproved: boolean;
}

const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_DATASET_VERSION = "meridian-contract-depth-v1-20260828";
const DEFAULT_LOAD_RUN_ID = "source-contract-depth-package-meridian-contract-depth-v1-20260828-a7061fcf";
const AS_OF_DATE = "2027-06-30";

const TARGET_VIEWS = [
  ["source", "contract_application_scope"],
  ["source", "contract_financial_exposure"],
  ["source", "contract_operational_performance"],
  ["source", "contract_vendor_360"],
  ["source", "vendor_contract_portfolio"],
  ["source", "contract_360"],
  ["consumption", "sourcing_vendor_v1"],
  ["consumption", "sourcing_vendor_semantic_v1"],
  ["consumption", "sourcing_contract_v1"],
  ["consumption", "sourcing_contract_scope_v1"],
  ["consumption", "sourcing_spend_monthly_v1"],
  ["consumption", "sourcing_performance_v1"],
  ["consumption", "sourcing_opportunity_v1"],
  ["consumption", "sourcing_context_coverage_v1"],
] as const;

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseArgs(): Args {
  const mode = (argValue("mode") ?? process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_L4_MODE ?? "plan") as Mode;
  if (!["plan", "apply", "verify"].includes(mode)) {
    throw new Error(`Unsupported SOURCE_CONTRACT_DEPTH_PACKAGE_L4_MODE: ${mode}`);
  }
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const tenantKey =
    argValue("tenant-key") ?? process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_TENANT_KEY ?? DEFAULT_TENANT_KEY;
  const datasetVersion =
    argValue("dataset-version") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_DATASET_VERSION ??
    DEFAULT_DATASET_VERSION;
  const loadRunId =
    argValue("load-run-id") ?? process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_LOAD_RUN_ID ?? DEFAULT_LOAD_RUN_ID;
  return {
    mode,
    tenantKey,
    datasetVersion,
    loadRunId,
    idempotencyKey:
      argValue("idempotency-key") ??
      process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_IDEMPOTENCY_KEY ??
      `${tenantKey}:${datasetVersion}:layer4-overlay`,
    proofDir: path.resolve(
      process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_L4_PROOF_DIR ??
        `/tmp/source-contract-depth-package-layer4-${mode}-${stamp}`,
    ),
    applyApproved:
      process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_L4_APPLY_APPROVED === "true" ||
      process.argv.includes("--apply-approved"),
  };
}

function databaseUrl(): string {
  const value =
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!value) {
    throw new Error(
      "Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return value;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function shouldEmitProofBundle(): boolean {
  return (
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_L4_EMIT_PROOF_BUNDLE === "true" ||
    process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
    process.argv.includes("--emit-proof-bundle")
  );
}

function emitProofBundle(proofDir: string): void {
  const parent = path.dirname(proofDir);
  const base = path.basename(proofDir);
  const tarPath = path.join(parent, `${base}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", parent, base], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(tar.stderr || tar.stdout || "Failed to build proof bundle");
  }
  const encoded = fs.readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let index = 0; index < encoded.length; index += 7600) {
    console.log(encoded.slice(index, index + 7600));
  }
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function setTenant(client: Client, tenantKey: string): Promise<void> {
  await client.query("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);
}

async function tableScalar(client: Client, sql: string, params: unknown[]): Promise<number> {
  const result = await client.query(sql, params);
  return num(result.rows[0]?.value);
}

async function objectKinds(client: Client) {
  const result = await client.query<{ schema_name: string; relation_name: string; relkind: string }>(
    `SELECT n.nspname AS schema_name, c.relname AS relation_name, c.relkind
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE (n.nspname, c.relname) IN (${TARGET_VIEWS.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(", ")})
      ORDER BY n.nspname, c.relname`,
    TARGET_VIEWS.flat(),
  );
  return result.rows;
}

async function assertReplaceableViews(client: Client): Promise<void> {
  const nonViews = (await objectKinds(client)).filter((row) => row.relkind !== "v");
  if (nonViews.length > 0) {
    throw new Error(
      `schema_change_required: L4 projection targets must be views before replacement: ${nonViews
        .map((row) => `${row.schema_name}.${row.relation_name}:${row.relkind}`)
        .join(", ")}`,
    );
  }
}

async function layer3Readback(client: Client, args: Args): Promise<Record<string, number>> {
  const result = await client.query<Record<string, string>>(
    `SELECT
       (SELECT count(*)::text FROM source.contract WHERE tenant_key = $1 AND load_run_id = $3) AS source_contract,
       (SELECT count(*)::text FROM source.contract_scope WHERE tenant_key = $1 AND load_run_id = $3) AS source_contract_scope,
       (SELECT count(*)::text FROM source.contract_consumption_observation WHERE tenant_key = $1 AND load_run_id = $3) AS source_contract_consumption_observation,
       (SELECT count(*)::text FROM source.contract_performance_observation WHERE tenant_key = $1 AND load_run_id = $3) AS source_contract_performance_observation,
       (SELECT count(*)::text FROM source.contract_service_credit WHERE tenant_key = $1 AND load_run_id = $3) AS source_contract_service_credit,
       (SELECT count(*)::text FROM source.contract_term WHERE tenant_key = $1 AND load_run_id = $3) AS source_contract_term,
       (SELECT count(*)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2) AS source_optimization_opportunity,
       (SELECT count(*)::text FROM source.optimization_opportunity WHERE tenant_key = $1 AND dataset_version = $2 AND payload->>'finance_confirmation_state' = 'not_confirmed') AS opportunities_not_finance_confirmed,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND fact_key = 'document.page_text_char_count') AS source_page_text_fact_assertion,
       (SELECT count(*)::text FROM source.canonical_fact_assertion WHERE tenant_key = $1 AND dataset_version = $2 AND (fact_key LIKE 'change_order%' OR fact_key IN ('annual_change_order_spend', 'recurring_change_order_spend', 'recurring_avoidable_pct'))) AS source_change_order_fact_assertion,
       (SELECT count(*)::text FROM source.contract WHERE tenant_key = $1 AND load_run_id = $3 AND COALESCE(raw_payload->>'alternatives_available', '') <> '') AS contracts_with_assessed_alternatives`,
    [args.tenantKey, args.datasetVersion, args.loadRunId],
  );
  return Object.fromEntries(Object.entries(result.rows[0] ?? {}).map(([key, value]) => [key, num(value)]));
}

async function l4Readback(client: Client, args: Args, beforeContractCount = 0): Promise<Record<string, number>> {
  await setTenant(client, args.tenantKey);
  const contractIdsResult = await client.query<{ contract_id: string }>(
    `SELECT contract_id FROM source.contract WHERE tenant_key = $1 AND load_run_id = $2 ORDER BY contract_id`,
    [args.tenantKey, args.loadRunId],
  );
  const contractIds = contractIdsResult.rows.map((row) => row.contract_id);
  const result: Record<string, number> = {
    source_contract_360_total: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.contract_360 WHERE tenant_key = $1`,
      [args.tenantKey],
    ),
    source_contract_360_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.contract_360 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_contract_financial_exposure_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.contract_financial_exposure WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_contract_operational_performance_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.contract_operational_performance WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_contract_application_scope_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.contract_application_scope WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    consumption_sourcing_spend_monthly_v1_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM consumption.sourcing_spend_monthly_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    consumption_sourcing_performance_v1_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM consumption.sourcing_performance_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    consumption_sourcing_opportunity_v1_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM consumption.sourcing_opportunity_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_contract_360_page_text_rows_package: await tableScalar(
      client,
      `SELECT COALESCE(SUM(COALESCE(document_page_text_count, 0)), 0) AS value
         FROM source.contract_360
        WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_contract_360_change_order_rows_package: await tableScalar(
      client,
      `SELECT COALESCE(SUM(COALESCE(change_order_count, 0)), 0) AS value
         FROM source.contract_360
        WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    package_unclaimed_credit_usd: await tableScalar(
      client,
      `SELECT COALESCE(SUM(COALESCE(credit_calculated, 0) - COALESCE(credit_claimed, 0)), 0) AS value
         FROM consumption.sourcing_performance_v1
        WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    package_opportunity_amount_usd: await tableScalar(
      client,
      `SELECT COALESCE(SUM(annual_value_exposed), 0) AS value
         FROM consumption.sourcing_opportunity_v1
        WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    package_contracts_with_assessed_alternatives: await tableScalar(
      client,
      `SELECT count(*) AS value
         FROM source.contract_360
        WHERE tenant_key = $1 AND contract_id = ANY($2::text[]) AND COALESCE(alternatives_available, '') <> ''`,
      [args.tenantKey, contractIds],
    ),
    skyharbor_strings_in_scope: await tableScalar(
      client,
      `SELECT count(*) AS value
         FROM source.contract_360
        WHERE tenant_key = $1
          AND (
            COALESCE(vendor_name, '') ILIKE '%SkyHarbor%'
            OR COALESCE(contract_name, '') ILIKE '%SkyHarbor%'
            OR COALESCE(scope_summary, '') ILIKE '%SkyHarbor%'
          )`,
      [args.tenantKey],
    ),
  };
  await client.query("SELECT set_config('app.tenant_key', '', false)");
  if (beforeContractCount > 0) {
    result.source_contract_360_before = beforeContractCount;
  }
  return result;
}

function assertLayer3Ready(rows: Record<string, number>): void {
  const expected: Record<string, number> = {
    source_contract: 5,
    source_contract_scope: 18,
    source_contract_consumption_observation: 60,
    source_contract_performance_observation: 36,
    source_contract_service_credit: 7,
    source_contract_term: 35,
    source_optimization_opportunity: 6,
    opportunities_not_finance_confirmed: 6,
    source_page_text_fact_assertion: 30,
    source_change_order_fact_assertion: 36,
    contracts_with_assessed_alternatives: 0,
  };
  const failures = Object.entries(expected)
    .filter(([key, expectedValue]) => rows[key] !== expectedValue)
    .map(([key, expectedValue]) => `${key} expected ${expectedValue}, got ${rows[key] ?? "<missing>"}`);
  if (failures.length > 0) {
    throw new Error(`Layer 3 is not ready for Layer 4 projection: ${failures.join("; ")}`);
  }
}

function assertL4Ready(rows: Record<string, number>, beforeContractCount: number): void {
  const expected: Record<string, number> = {
    source_contract_360_package: 5,
    source_contract_financial_exposure_package: 5,
    source_contract_operational_performance_package: 5,
    source_contract_application_scope_package: 18,
    consumption_sourcing_spend_monthly_v1_package: 60,
    consumption_sourcing_performance_v1_package: 36,
    consumption_sourcing_opportunity_v1_package: 6,
    source_contract_360_page_text_rows_package: 30,
    source_contract_360_change_order_rows_package: 8,
    package_contracts_with_assessed_alternatives: 0,
    skyharbor_strings_in_scope: 0,
  };
  const failures = Object.entries(expected)
    .filter(([key, expectedValue]) => rows[key] !== expectedValue)
    .map(([key, expectedValue]) => `${key} expected ${expectedValue}, got ${rows[key] ?? "<missing>"}`);
  if (beforeContractCount > 0 && rows.source_contract_360_total < beforeContractCount) {
    failures.push(
      `source_contract_360_total regressed from ${beforeContractCount} to ${rows.source_contract_360_total}`,
    );
  }
  if (rows.package_unclaimed_credit_usd <= 0) {
    failures.push("package_unclaimed_credit_usd expected > 0");
  }
  if (rows.package_opportunity_amount_usd <= 0) {
    failures.push("package_opportunity_amount_usd expected > 0");
  }
  if (failures.length > 0) {
    throw new Error(`Layer 4 readback failed: ${failures.join("; ")}`);
  }
}

async function applyLayer4(client: Client, args: Args): Promise<Record<string, number>> {
  await assertReplaceableViews(client);
  const layer3 = await layer3Readback(client, args);
  assertLayer3Ready(layer3);
  await setTenant(client, args.tenantKey);
  const beforeContractCount = await tableScalar(
    client,
    `SELECT count(*) AS value FROM source.contract_360 WHERE tenant_key = $1`,
    [args.tenantKey],
  );
  await client.query("BEGIN");
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS source.l4_cube_active_load_run_overlay (
        tenant_key TEXT NOT NULL,
        load_run_id TEXT NOT NULL,
        dataset_version TEXT NOT NULL,
        input_source_version TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        overlay_role TEXT NOT NULL,
        activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        PRIMARY KEY (tenant_key, load_run_id)
      )`);

    await client.query(
      `INSERT INTO source.l4_cube_active_load_run_overlay
         (tenant_key, load_run_id, dataset_version, input_source_version, idempotency_key, overlay_role, raw_payload)
       VALUES ($1, $2, $3, $3, $4, 'contract_depth_package', $5::jsonb)
       ON CONFLICT (tenant_key, load_run_id)
       DO UPDATE SET dataset_version = EXCLUDED.dataset_version,
                     input_source_version = EXCLUDED.input_source_version,
                     idempotency_key = EXCLUDED.idempotency_key,
                     overlay_role = EXCLUDED.overlay_role,
                     activated_at = now(),
                     raw_payload = EXCLUDED.raw_payload`,
      [
        args.tenantKey,
        args.loadRunId,
        args.datasetVersion,
        args.idempotencyKey,
        JSON.stringify({
          projection: "source-contract-depth-layer4-overlay",
          synthetic_policy: "synthetic_demo_only_not_client_truth",
        }),
      ],
    );

    await rebuildViews(client);
    const readback = await l4Readback(client, args, beforeContractCount);
    assertL4Ready(readback, beforeContractCount);
    await client.query("COMMIT");
    return readback;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.query("SELECT set_config('app.tenant_key', '', false)");
  }
}

async function rebuildViews(client: Client): Promise<void> {
  const activeRuns = `
    SELECT tenant_key, load_run_id FROM source.l4_cube_active_load_run
    UNION
    SELECT tenant_key, load_run_id FROM source.l4_cube_active_load_run_overlay
  `;

  await client.query(`
    CREATE OR REPLACE VIEW source.contract_application_scope AS
    WITH active_runs AS (${activeRuns})
    SELECT
      cs.tenant_key,
      cs.contract_id,
      c.vendor_id AS vendor_ref,
      COALESCE(v.legal_name, c.vendor_id) AS vendor_name,
      COALESCE(cs.scope_ref, cs.scope_name) AS application_ref,
      cs.scope_name AS application_name,
      cs.raw_payload->>'business_function' AS business_function,
      NULL::text AS function_ref,
      cs.criticality,
      cs.raw_payload->>'lifecycle_state' AS lifecycle_state,
      cs.raw_payload->>'hosting_model' AS hosting_model,
      NULLIF(cs.raw_payload->>'annual_run_cost', '')::numeric AS annual_run_cost,
      cs.raw_payload->>'modernization_plan' AS modernization_plan,
      NULL::text AS sla_tier,
      cs.raw_payload->>'known_pain_risk' AS known_pain_risk,
      cs.scope_ref AS it_portfolio_ref,
      cs.load_run_id
    FROM source.contract_scope cs
    JOIN active_runs active
      ON active.tenant_key = cs.tenant_key
     AND active.load_run_id = cs.load_run_id
    LEFT JOIN source.contract c
      ON c.tenant_key = cs.tenant_key
     AND c.contract_id = cs.contract_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id
    WHERE source.can_read_sourcing_tenant(cs.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.contract_financial_exposure AS
    WITH active_runs AS (${activeRuns}),
    consumption AS (
      SELECT
        o.tenant_key,
        o.contract_id,
        o.load_run_id,
        sum(o.committed_amount)::numeric AS committed_annual_spend,
        sum(o.actual_spend)::numeric AS actual_annual_spend,
        sum(o.committed_amount)::numeric AS linked_budget_amount,
        sum(o.committed_amount)::numeric AS linked_forecast_amount,
        sum(o.actual_spend)::numeric AS linked_actual_amount,
        sum(o.committed_amount)::numeric AS linked_committed_amount,
        count(*)::bigint AS linked_budget_lines
      FROM source.contract_consumption_observation o
      JOIN active_runs active
        ON active.tenant_key = o.tenant_key
       AND active.load_run_id = o.load_run_id
      GROUP BY o.tenant_key, o.contract_id, o.load_run_id
    )
    SELECT
      c.tenant_key,
      c.contract_id,
      c.vendor_id AS vendor_ref,
      COALESCE(v.legal_name, c.vendor_id) AS vendor_name,
      c.annual_value::numeric AS contracted_annual_value,
      c.total_committed_value::numeric AS total_committed_value,
      COALESCE(consumption.committed_annual_spend, c.annual_value)::numeric AS committed_annual_spend,
      COALESCE(consumption.actual_annual_spend, c.annual_value)::numeric AS actual_annual_spend,
      COALESCE(consumption.linked_budget_amount, c.annual_value, 0)::numeric AS linked_budget_amount,
      COALESCE(consumption.linked_forecast_amount, c.annual_value, 0)::numeric AS linked_forecast_amount,
      COALESCE(consumption.linked_actual_amount, c.annual_value, 0)::numeric AS linked_actual_amount,
      COALESCE(consumption.linked_committed_amount, c.total_committed_value, c.annual_value, 0)::numeric AS linked_committed_amount,
      COALESCE(consumption.linked_budget_lines, 0)::bigint AS linked_budget_lines,
      c.load_run_id
    FROM source.contract c
    JOIN active_runs active
      ON active.tenant_key = c.tenant_key
     AND active.load_run_id = c.load_run_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id
    LEFT JOIN consumption
      ON consumption.tenant_key = c.tenant_key
     AND consumption.contract_id = c.contract_id
     AND consumption.load_run_id = c.load_run_id
    WHERE source.can_read_sourcing_tenant(c.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.contract_operational_performance AS
    WITH active_runs AS (${activeRuns}),
    scope AS (
      SELECT
        tenant_key,
        contract_id,
        load_run_id,
        count(DISTINCT scope_ref)::bigint AS scoped_application_count,
        count(DISTINCT scope_ref) FILTER (
          WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')
        )::bigint AS critical_application_count
      FROM source.contract_scope
      GROUP BY tenant_key, contract_id, load_run_id
    ),
    perf AS (
      SELECT
        p.tenant_key,
        p.contract_id,
        p.load_run_id,
        count(*)::bigint AS period_count,
        COALESCE(sum(p.breach_count), 0)::bigint AS breach_count,
        COALESCE(sum(p.credit_calculated), 0)::numeric AS credit_earned,
        COALESCE(sum(p.credit_claimed), 0)::numeric AS credit_claimed,
        COALESCE(sum(p.credit_recovered), 0)::numeric AS credit_recovered
      FROM source.contract_performance_observation p
      JOIN active_runs active
        ON active.tenant_key = p.tenant_key
       AND active.load_run_id = p.load_run_id
      GROUP BY p.tenant_key, p.contract_id, p.load_run_id
    )
    SELECT
      c.tenant_key,
      c.contract_id,
      c.vendor_id AS vendor_ref,
      COALESCE(v.legal_name, c.vendor_id) AS vendor_name,
      CASE
        WHEN perf.period_count IS NULL THEN 'No SLA performance rows loaded.'
        ELSE concat(perf.breach_count, ' breached SLA periods across ', perf.period_count, ' periods; $', round(perf.credit_earned, 2), ' credits earned; $', round(perf.credit_claimed, 2), ' claimed.')
      END AS sla_summary,
      COALESCE(scope.scoped_application_count, 0)::bigint AS scoped_application_count,
      COALESCE(scope.critical_application_count, 0)::bigint AS critical_application_count,
      0::numeric AS cloud_sev1_sev2_incidents,
      NULL::numeric AS avg_cloud_change_failure_rate,
      COALESCE(perf.credit_earned, 0)::numeric AS service_credits_earned,
      COALESCE(perf.credit_claimed, 0)::numeric AS service_credits_claimed,
      CASE WHEN perf.period_count IS NULL THEN 'true' ELSE 'false' END AS evidence_gap,
      c.load_run_id
    FROM source.contract c
    JOIN active_runs active
      ON active.tenant_key = c.tenant_key
     AND active.load_run_id = c.load_run_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id
    LEFT JOIN scope
      ON scope.tenant_key = c.tenant_key
     AND scope.contract_id = c.contract_id
     AND scope.load_run_id = c.load_run_id
    LEFT JOIN perf
      ON perf.tenant_key = c.tenant_key
     AND perf.contract_id = c.contract_id
     AND perf.load_run_id = c.load_run_id
    WHERE source.can_read_sourcing_tenant(c.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.contract_vendor_360 AS
    WITH active_runs AS (${activeRuns}),
    consumption AS (
      SELECT
        tenant_key,
        contract_id,
        load_run_id,
        sum(committed_amount)::numeric AS committed_annual_spend,
        sum(actual_spend)::numeric AS actual_annual_spend
      FROM source.contract_consumption_observation
      GROUP BY tenant_key, contract_id, load_run_id
    )
    SELECT
      c.tenant_key,
      c.contract_id,
      c.vendor_id AS vendor_ref,
      COALESCE(v.legal_name, c.vendor_id, 'Unknown vendor') AS vendor_name,
      v.supplier_category AS vendor_category,
      c.contract_name,
      concat_ws(' - ', NULLIF(c.agreement_type, ''), NULLIF(c.payment_terms, ''), NULLIF(c.benchmark_rights, ''), NULLIF(c.termination_rights, '')) AS scope_summary,
      c.annual_value::numeric AS annual_value,
      c.total_committed_value::numeric AS total_committed_value,
      COALESCE(consumption.committed_annual_spend, c.annual_value)::numeric AS committed_annual_spend,
      COALESCE(consumption.actual_annual_spend, c.annual_value)::numeric AS actual_annual_spend,
      c.expiration_date AS end_date,
      CASE
        WHEN c.expiration_date IS NOT NULL AND c.notice_deadline IS NOT NULL
          THEN (c.expiration_date - c.notice_deadline)::numeric
        ELSE NULL::numeric
      END AS notice_period_days,
      COALESCE(c.auto_renew, false) AS auto_renew,
      c.renewal_type AS renewal_decision_state,
      c.renewal_owner_role AS renewal_owner_ref,
      c.benchmark_rights AS benchmarking_clause,
      concat_ws(' - ', NULLIF(c.termination_rights, ''), NULLIF(c.exit_assistance_terms, '')) AS exit_rights_summary,
      NULLIF(c.raw_payload ->> 'alternatives_available', '') AS alternatives_available,
      COALESCE(v.risk_tier, v.strategic_status) AS concentration_note,
      c.confidence::text AS source_confidence,
      c.annual_value::numeric AS resolved_annual_value,
      false AS annual_value_conflict_flag,
      c.total_committed_value::numeric AS resolved_total_committed_value,
      false AS total_committed_value_conflict_flag,
      c.load_run_id
    FROM source.contract c
    JOIN active_runs active
      ON active.tenant_key = c.tenant_key
     AND active.load_run_id = c.load_run_id
    LEFT JOIN source.vendor v
      ON v.tenant_key = c.tenant_key
     AND v.vendor_id = c.vendor_id
    LEFT JOIN consumption
      ON consumption.tenant_key = c.tenant_key
     AND consumption.contract_id = c.contract_id
     AND consumption.load_run_id = c.load_run_id
    WHERE source.can_read_sourcing_tenant(c.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.vendor_contract_portfolio AS
    SELECT
      tenant_key,
      vendor_ref,
      vendor_name,
      vendor_category,
      count(*)::bigint AS contract_count,
      sum(annual_value)::numeric AS annual_value,
      sum(total_committed_value)::numeric AS total_committed_value,
      count(*) FILTER (WHERE auto_renew)::bigint AS auto_renew_contracts,
      min(end_date) AS next_end_date,
      array_agg(DISTINCT contract_id ORDER BY contract_id) AS contract_refs,
      CASE WHEN count(DISTINCT load_run_id) = 1 THEN min(load_run_id) ELSE 'multiple' END AS load_run_id
    FROM source.contract_vendor_360
    GROUP BY tenant_key, vendor_ref, vendor_name, vendor_category`);

  await client.query(`
    CREATE OR REPLACE VIEW source.contract_360 AS
    WITH depth AS (
      SELECT
        tenant_key,
        contract_id,
        count(*) FILTER (WHERE fact_key = 'document.page_text_char_count')::bigint AS document_page_text_count,
        COALESCE(max(value_numeric) FILTER (WHERE fact_key = 'change_order_count'), 0)::bigint AS change_order_count,
        COALESCE(max(value_numeric) FILTER (WHERE fact_key = 'annual_change_order_spend'), 0)::numeric AS annual_change_order_spend,
        COALESCE(max(value_numeric) FILTER (WHERE fact_key = 'recurring_change_order_spend'), 0)::numeric AS recurring_change_order_exposure_usd,
        COALESCE(max(value_numeric) FILTER (WHERE fact_key = 'recurring_avoidable_pct'), 0)::numeric AS recurring_avoidable_pct
      FROM source.canonical_fact_assertion
      WHERE fact_key = 'document.page_text_char_count'
         OR fact_key LIKE 'change_order%'
         OR fact_key IN ('annual_change_order_spend', 'recurring_change_order_spend', 'recurring_avoidable_pct')
      GROUP BY tenant_key, contract_id
    )
    SELECT
      c.*,
      COALESCE(app.scoped_application_count, 0)::bigint AS scoped_application_count,
      COALESCE(app.critical_application_count, 0)::bigint AS critical_application_count,
      COALESCE(fin.linked_budget_amount, 0)::numeric AS linked_budget_amount,
      COALESCE(fin.linked_actual_amount, 0)::numeric AS linked_actual_amount,
      COALESCE(fin.linked_budget_lines, 0)::bigint AS linked_budget_lines,
      COALESCE(op.cloud_sev1_sev2_incidents, 0)::int AS cloud_sev1_sev2_incidents,
      op.evidence_gap AS operational_evidence_gap,
      0::bigint AS initiative_dependency_count,
      COALESCE(depth.document_page_text_count, 0)::bigint AS document_page_text_count,
      COALESCE(depth.change_order_count, 0)::bigint AS change_order_count,
      COALESCE(depth.annual_change_order_spend, 0)::numeric AS annual_change_order_spend,
      COALESCE(depth.recurring_change_order_exposure_usd, 0)::numeric AS recurring_change_order_exposure_usd,
      COALESCE(depth.recurring_avoidable_pct, 0)::numeric AS recurring_avoidable_pct
    FROM source.contract_vendor_360 c
    LEFT JOIN (
      SELECT
        tenant_key,
        contract_id,
        load_run_id,
        count(DISTINCT application_ref)::bigint AS scoped_application_count,
        count(DISTINCT application_ref) FILTER (
          WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')
        )::bigint AS critical_application_count
      FROM source.contract_application_scope
      GROUP BY tenant_key, contract_id, load_run_id
    ) app
      ON app.tenant_key = c.tenant_key
     AND app.contract_id = c.contract_id
     AND app.load_run_id = c.load_run_id
    LEFT JOIN source.contract_financial_exposure fin
      ON fin.tenant_key = c.tenant_key
     AND fin.contract_id = c.contract_id
     AND fin.load_run_id = c.load_run_id
    LEFT JOIN source.contract_operational_performance op
      ON op.tenant_key = c.tenant_key
     AND op.contract_id = c.contract_id
     AND op.load_run_id = c.load_run_id
    LEFT JOIN depth
      ON depth.tenant_key = c.tenant_key
     AND depth.contract_id = c.contract_id`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_contract_v1 AS
    SELECT
      c.tenant_key,
      c.contract_id AS contract_ref,
      c.contract_id,
      c.contract_name,
      c.vendor_ref,
      c.vendor_ref AS vendor_id,
      c.vendor_name,
      c.vendor_category AS contract_category,
      c.vendor_category AS agreement_type,
      c.renewal_decision_state AS renewal_type,
      CASE WHEN c.end_date IS NOT NULL AND c.end_date < DATE '${AS_OF_DATE}' THEN 'expired' ELSE 'active' END AS contract_state,
      c.renewal_decision_state AS renewal_state,
      c.auto_renew,
      c.annual_value::numeric(18,2) AS annual_contract_value,
      c.annual_value::numeric(18,2) AS annual_value,
      c.actual_annual_spend::numeric AS actual_annual_spend,
      c.committed_annual_spend::numeric AS committed_annual_spend,
      c.total_committed_value::numeric(18,2) AS total_committed_value,
      NULL::date AS effective_date,
      c.end_date AS expiration_date,
      CASE WHEN c.end_date IS NULL OR c.notice_period_days IS NULL THEN NULL ELSE c.end_date - c.notice_period_days::int END AS notice_deadline,
      CASE WHEN c.end_date IS NULL OR c.notice_period_days IS NULL THEN NULL ELSE (c.end_date - c.notice_period_days::int) - DATE '${AS_OF_DATE}' END AS days_to_notice_deadline,
      CASE WHEN c.end_date IS NULL THEN NULL ELSE c.end_date - DATE '${AS_OF_DATE}' END AS days_to_contract_expiry,
      CASE
        WHEN c.end_date IS NULL OR c.notice_period_days IS NULL THEN 'unknown'
        WHEN (c.end_date - c.notice_period_days::int) < DATE '${AS_OF_DATE}' THEN 'passed_active'
        WHEN (c.end_date - c.notice_period_days::int) <= DATE '${AS_OF_DATE}' + 90 THEN 'within_90_days'
        WHEN (c.end_date - c.notice_period_days::int) <= DATE '${AS_OF_DATE}' + 180 THEN 'within_180_days'
        ELSE 'future'
      END AS notice_deadline_state,
      CASE
        WHEN c.end_date IS NULL THEN 'unknown'
        WHEN c.end_date <= DATE '${AS_OF_DATE}' + 90 THEN 'within_90_days'
        WHEN c.end_date <= DATE '${AS_OF_DATE}' + 180 THEN 'within_180_days'
        ELSE 'beyond_180_days'
      END AS renewal_urgency_state,
      COALESCE(c.benchmarking_clause, '') <> '' AS benchmark_rights_present,
      CASE
        WHEN COALESCE(c.benchmarking_clause, '') = '' THEN 'not_loaded'
        WHEN c.benchmarking_clause ILIKE '%weak%' OR c.benchmarking_clause ILIKE '%limited%' THEN 'weak'
        ELSE 'present'
      END AS benchmark_status,
      CASE
        WHEN COALESCE(c.alternatives_available, '') = '' THEN 'not_assessed'
        WHEN c.alternatives_available ILIKE '%limited%' OR c.alternatives_available ILIKE '%none%' THEN 'limited'
        ELSE 'available'
      END AS alternatives_status,
      COALESCE(c.benchmarking_clause, '') = ''
        OR c.benchmarking_clause ILIKE '%weak%'
        OR c.benchmarking_clause ILIKE '%limited%' AS weak_benchmark_flag,
      CASE
        WHEN COALESCE(c.alternatives_available, '') = '' THEN false
        ELSE c.alternatives_available ILIKE '%limited%' OR c.alternatives_available ILIKE '%none%'
      END AS limited_alternatives_flag,
      COALESCE(c.scoped_application_count, 0)::bigint AS scoped_application_count,
      COALESCE(c.critical_application_count, 0)::bigint AS critical_application_count,
      0::bigint AS modernization_dependency_count,
      COALESCE(c.critical_application_count, 0)::bigint AS lock_in_signal_count,
      true AS portfolio_rollup_eligible,
      CASE
        WHEN c.source_confidence ~ '^[0-9]+(\\.[0-9]+)?$' THEN c.source_confidence::numeric
        ELSE 0.9::numeric
      END AS confidence,
      'USD'::text AS currency,
      DATE '${AS_OF_DATE}' AS as_of_date,
      c.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      'reviewed'::text AS quality_state,
      'current'::text AS freshness_state,
      CASE WHEN c.annual_value IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
      c.load_run_id,
      COALESCE(c.document_page_text_count, 0)::bigint AS document_page_text_count,
      COALESCE(c.change_order_count, 0)::bigint AS change_order_count,
      COALESCE(c.annual_change_order_spend, 0)::numeric AS annual_change_order_spend,
      COALESCE(c.recurring_change_order_exposure_usd, 0)::numeric AS recurring_change_order_exposure_usd,
      COALESCE(c.recurring_avoidable_pct, 0)::numeric AS recurring_avoidable_pct
    FROM source.contract_360 c`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_vendor_v1 AS
    WITH portfolio AS (
      SELECT
        p.*,
        row_number() OVER (PARTITION BY p.tenant_key ORDER BY p.annual_value DESC NULLS LAST, p.vendor_name) AS vendor_rank,
        CASE
          WHEN sum(p.annual_value) OVER (PARTITION BY p.tenant_key) > 0
            THEN p.annual_value / sum(p.annual_value) OVER (PARTITION BY p.tenant_key)
          ELSE NULL
        END AS portfolio_share_pct,
        CASE
          WHEN sum(p.annual_value) OVER (PARTITION BY p.tenant_key) > 0
            THEN sum(p.annual_value) OVER (
              PARTITION BY p.tenant_key
              ORDER BY p.annual_value DESC NULLS LAST, p.vendor_name
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) / sum(p.annual_value) OVER (PARTITION BY p.tenant_key)
          ELSE NULL
        END AS cumulative_portfolio_share_pct
      FROM source.vendor_contract_portfolio p
    )
    SELECT
      p.tenant_key,
      p.vendor_ref,
      p.vendor_ref AS vendor_id,
      p.vendor_name,
      p.vendor_name AS legal_name,
      p.vendor_name AS parent_vendor,
      p.vendor_category AS category,
      p.vendor_category AS supplier_category,
      NULL::text AS strategic_status,
      NULL::text AS country,
      NULL::text AS region,
      NULL::text AS diversity_status,
      NULL::text AS risk_tier,
      NULL::text AS financial_health_status,
      NULL::text AS security_risk_status,
      NULL::text AS relationship_owner_role,
      p.contract_count,
      p.annual_value AS annual_contract_value,
      p.annual_value,
      p.total_committed_value,
      p.auto_renew_contracts,
      p.next_end_date,
      p.contract_refs,
      p.vendor_rank,
      p.portfolio_share_pct,
      p.cumulative_portfolio_share_pct,
      p.vendor_rank <= 5 AS top_5_flag,
      p.vendor_rank <= 10 AS top_10_flag,
      COALESCE(scope.critical_application_count, 0)::bigint AS critical_application_count,
      0::bigint AS lock_in_signal_count,
      DATE '${AS_OF_DATE}' AS as_of_date,
      p.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      'reviewed'::text AS quality_state,
      'current'::text AS freshness_state,
      'available'::text AS availability_state,
      p.load_run_id
    FROM portfolio p
    LEFT JOIN (
      SELECT tenant_key, vendor_ref, count(DISTINCT application_ref) FILTER (
        WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')
      ) AS critical_application_count
      FROM source.contract_application_scope
      GROUP BY tenant_key, vendor_ref
    ) scope
      ON scope.tenant_key = p.tenant_key
     AND scope.vendor_ref = p.vendor_ref`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_vendor_semantic_v1 AS
    SELECT * FROM consumption.sourcing_vendor_v1`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_contract_scope_v1 AS
    SELECT
      cs.tenant_key,
      concat(cs.contract_id, ':', cs.application_ref) AS scope_relationship_ref,
      concat(cs.contract_id, ':', cs.application_ref) AS contract_scope_id,
      cs.contract_id AS contract_ref,
      cs.contract_id,
      cs.vendor_ref,
      cs.vendor_ref AS vendor_id,
      cs.vendor_name,
      'application'::text AS scope_type,
      cs.application_ref AS scope_ref,
      cs.application_name AS scope_name,
      cs.business_function,
      cs.function_ref,
      cs.criticality,
      cs.lifecycle_state,
      cs.modernization_plan,
      'reviewed_mapping'::text AS relationship_method,
      0.8::numeric(5,4) AS relationship_confidence,
      cs.criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical') AS critical_application_flag,
      COALESCE(cs.lifecycle_state, '') ILIKE '%retire%' AS retire_application_flag,
      COALESCE(cs.modernization_plan, '') ILIKE '%replace%' AS replace_application_flag,
      DATE '${AS_OF_DATE}' AS as_of_date,
      cs.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      'reviewed'::text AS quality_state,
      'current'::text AS freshness_state,
      'available'::text AS availability_state,
      cs.load_run_id
    FROM source.contract_application_scope cs`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_spend_monthly_v1 AS
    WITH active_runs AS (${activeRuns})
    SELECT
      o.tenant_key,
      o.observation_id,
      o.contract_id AS contract_ref,
      o.contract_id,
      o.service_id AS service_ref,
      o.service_id,
      o.business_unit,
      o.cost_center,
      NULL::text AS service_category,
      o.period_start AS month,
      o.committed_amount,
      o.invoice_amount,
      o.paid_amount,
      o.actual_spend,
      NULL::numeric(18,4) AS consumed_amount,
      NULL::numeric(18,2) AS overage_amount,
      o.service_credit_amount AS credit_eligible_amount,
      o.service_credit_amount AS credit_recovered_amount,
      o.service_credit_amount AS service_credit_amount,
      CASE WHEN o.committed_amount IS NOT NULL AND o.actual_spend IS NOT NULL THEN o.committed_amount - o.actual_spend ELSE NULL END AS unused_commitment_amount,
      CASE WHEN o.committed_amount IS NOT NULL AND o.committed_amount <> 0 AND o.actual_spend IS NOT NULL THEN o.actual_spend / o.committed_amount ELSE NULL END AS consumption_rate,
      CASE WHEN o.service_credit_amount IS NOT NULL AND o.service_credit_amount <> 0 THEN 0 ELSE NULL END AS credit_recovery_rate,
      1::int AS invoice_lines,
      'contract_matched'::text AS matching_state,
      o.currency,
      COALESCE(o.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      o.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      'current'::text AS freshness_state,
      CASE WHEN o.actual_spend IS NULL AND o.invoice_amount IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
      o.load_run_id
    FROM source.contract_consumption_observation o
    JOIN active_runs active
      ON active.tenant_key = o.tenant_key
     AND active.load_run_id = o.load_run_id
    WHERE source.can_read_sourcing_tenant(o.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_performance_v1 AS
    WITH active_runs AS (${activeRuns})
    SELECT
      o.tenant_key,
      o.observation_id,
      o.contract_id AS contract_ref,
      o.contract_id,
      o.service_id AS service_ref,
      o.service_id,
      o.metric_name AS metric_ref,
      o.metric_name,
      o.period_start AS period,
      o.period_start,
      o.period_end,
      o.unit,
      CASE WHEN COALESCE(o.breach_count, 0) > 0 THEN 'breached' WHEN o.actual_value IS NULL AND o.value_num IS NULL THEN 'not_loaded' ELSE 'met_or_unclassified' END AS performance_state,
      CASE WHEN COALESCE(o.credit_recovered, 0) > 0 THEN 'recovered' WHEN COALESCE(o.credit_claimed, 0) > 0 THEN 'claimed' WHEN COALESCE(o.credit_calculated, 0) > 0 THEN 'earned_unclaimed' ELSE 'none' END AS credit_state,
      CASE WHEN o.evidence_reference IS NULL OR o.evidence_reference = '' THEN 'missing' ELSE 'present' END AS evidence_state,
      o.breach_count,
      o.credit_eligible,
      o.credit_calculated AS credit_eligible_amount,
      o.credit_calculated AS credit_calculated_amount,
      o.credit_calculated,
      o.credit_claimed AS credit_claimed_amount,
      o.credit_claimed,
      o.credit_recovered AS credit_recovered_amount,
      o.credit_recovered,
      o.currency,
      COALESCE(o.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
      o.load_run_id AS knowledge_baseline_ref,
      'sourcing-consumption-v1'::text AS projection_contract_version,
      'accepted'::text AS authority_state,
      'current'::text AS freshness_state,
      CASE WHEN o.actual_value IS NULL AND o.value_num IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
      o.load_run_id
    FROM source.contract_performance_observation o
    JOIN active_runs active
      ON active.tenant_key = o.tenant_key
     AND active.load_run_id = o.load_run_id
    WHERE source.can_read_sourcing_tenant(o.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_opportunity_v1 AS
    WITH active_runs AS (${activeRuns}),
    sourcing AS (
      SELECT
        o.tenant_key,
        o.opportunity_id AS opportunity_ref,
        o.opportunity_id,
        o.vendor_id AS vendor_ref,
        o.vendor_id,
        o.contract_id AS contract_ref,
        o.contract_id,
        o.event_id AS event_ref,
        o.event_id,
        o.opportunity_type AS action_type,
        o.opportunity_type,
        o.title,
        o.finding_summary,
        o.deterministic_basis,
        o.value_low,
        o.value_high,
        o.timing_window,
        COALESCE(o.value_high, o.value_low) AS annual_value_exposed,
        COALESCE(o.value_low, 0) AS addressable_spend,
        CASE WHEN COALESCE(o.value_high, o.value_low, 0) >= 10000000 THEN 'high' WHEN COALESCE(o.value_high, o.value_low, 0) >= 1000000 THEN 'medium' ELSE 'low' END AS priority,
        o.confidence,
        CASE WHEN o.quality_state = 'accepted' AND o.confidence >= 0.75 THEN 'ready_to_act' WHEN o.quality_state IN ('missing_evidence', 'blocked') THEN 'evidence_blocked' ELSE 'review_required' END AS readiness_state,
        CASE WHEN o.evidence_reference IS NULL OR o.evidence_reference = '' THEN 'missing' ELSE 'present' END AS evidence_state,
        o.recommended_action,
        o.accountable_role,
        o.quality_state,
        NULL::date AS decision_due_date,
        o.opportunity_type AS finding_rule_ref,
        COALESCE(o.as_of_date, DATE '${AS_OF_DATE}') AS as_of_date,
        o.load_run_id AS knowledge_baseline_ref,
        'sourcing-consumption-v1'::text AS projection_contract_version,
        o.quality_state AS authority_state,
        'current'::text AS freshness_state,
        'available'::text AS availability_state,
        o.load_run_id
      FROM source.sourcing_opportunity o
      JOIN active_runs active
        ON active.tenant_key = o.tenant_key
       AND active.load_run_id = o.load_run_id
    ),
    optimization AS (
      SELECT
        o.tenant_key,
        o.opportunity_id AS opportunity_ref,
        o.opportunity_id,
        o.vendor_id AS vendor_ref,
        o.vendor_id,
        o.contract_id AS contract_ref,
        o.contract_id,
        NULL::text AS event_ref,
        NULL::text AS event_id,
        o.value_type AS action_type,
        o.value_type AS opportunity_type,
        COALESCE(o.payload->>'title', o.narrative) AS title,
        COALESCE(o.payload->>'finding_summary', o.narrative) AS finding_summary,
        COALESCE(o.payload->>'deterministic_basis', o.blocking_gap) AS deterministic_basis,
        o.amount_usd AS value_low,
        o.amount_usd AS value_high,
        COALESCE(o.payload->>'timing_window', o.deadline::text) AS timing_window,
        o.amount_usd AS annual_value_exposed,
        o.amount_usd AS addressable_spend,
        CASE WHEN COALESCE(o.amount_usd, 0) >= 10000000 THEN 'high' WHEN COALESCE(o.amount_usd, 0) >= 1000000 THEN 'medium' ELSE 'low' END AS priority,
        o.confidence,
        CASE
          WHEN o.payload->>'finance_confirmation_state' = 'not_confirmed' THEN 'finance_confirmation_required'
          WHEN o.stage IN ('validated', 'approval_required') THEN 'review_required'
          ELSE 'review_required'
        END AS readiness_state,
        CASE WHEN o.evidence_grade IN ('missing', 'not_loaded') THEN 'missing' ELSE 'present' END AS evidence_state,
        o.next_action AS recommended_action,
        o.owner AS accountable_role,
        o.evidence_grade AS quality_state,
        o.deadline AS decision_due_date,
        o.value_type AS finding_rule_ref,
        CURRENT_DATE AS as_of_date,
        concat(o.dataset_version, ':', o.opportunity_id) AS knowledge_baseline_ref,
        'sourcing-consumption-v1'::text AS projection_contract_version,
        o.approval_state AS authority_state,
        'current'::text AS freshness_state,
        'available'::text AS availability_state,
        c.load_run_id
      FROM source.optimization_opportunity o
      JOIN source.contract c
        ON c.tenant_key = o.tenant_key
       AND c.contract_id = o.contract_id
      JOIN active_runs active
        ON active.tenant_key = c.tenant_key
       AND active.load_run_id = c.load_run_id
    )
    SELECT * FROM sourcing
    WHERE source.can_read_sourcing_tenant(tenant_key)
    UNION ALL
    SELECT * FROM optimization
    WHERE source.can_read_sourcing_tenant(tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW consumption.sourcing_context_coverage_v1 AS
    SELECT tenant_key, 'vendors'::text AS context_area, count(*)::bigint AS row_count, count(*)::bigint AS populated_count
    FROM consumption.sourcing_vendor_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'contracts', count(*)::bigint, count(*) FILTER (WHERE annual_value IS NOT NULL)::bigint
    FROM consumption.sourcing_contract_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'contract_scope', count(*)::bigint, count(*) FILTER (WHERE relationship_confidence >= 0.75)::bigint
    FROM consumption.sourcing_contract_scope_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'spend_months', count(*)::bigint, count(*) FILTER (WHERE actual_spend IS NOT NULL)::bigint
    FROM consumption.sourcing_spend_monthly_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'performance', count(*)::bigint, count(*) FILTER (WHERE evidence_state = 'present')::bigint
    FROM consumption.sourcing_performance_v1
    GROUP BY tenant_key
    UNION ALL
    SELECT tenant_key, 'opportunities', count(*)::bigint, count(*) FILTER (WHERE evidence_state = 'present')::bigint
    FROM consumption.sourcing_opportunity_v1
    GROUP BY tenant_key`);

  await client.query(`
    GRANT SELECT ON
      source.contract_application_scope,
      source.contract_financial_exposure,
      source.contract_operational_performance,
      source.contract_vendor_360,
      source.vendor_contract_portfolio,
      source.contract_360
    TO authenticated, service_role`);

  await client.query(`
    GRANT SELECT ON
      consumption.sourcing_vendor_v1,
      consumption.sourcing_vendor_semantic_v1,
      consumption.sourcing_contract_v1,
      consumption.sourcing_contract_scope_v1,
      consumption.sourcing_spend_monthly_v1,
      consumption.sourcing_performance_v1,
      consumption.sourcing_opportunity_v1,
      consumption.sourcing_context_coverage_v1
    TO authenticated, service_role`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  fs.mkdirSync(args.proofDir, { recursive: true });

  const client = new Client(postgresClientOptions(databaseUrl(), "source-contract-depth-package-layer4"));
  await client.connect();
  try {
    const layer3 = await layer3Readback(client, args);
    const kinds = await objectKinds(client);
    let layer4: Record<string, number> | null = null;
    const qualityGate = {
      status: layer4 ? "PASS" : "PLAN",
      failures: [] as string[],
    };
    if (args.mode === "apply") {
      if (!args.applyApproved) {
        throw new Error("Refusing to mutate Azure without SOURCE_CONTRACT_DEPTH_PACKAGE_L4_APPLY_APPROVED=true.");
      }
      layer4 = await applyLayer4(client, args);
    } else if (args.mode === "verify") {
      assertLayer3Ready(layer3);
      layer4 = await l4Readback(client, args);
      assertL4Ready(layer4, 0);
    }

    const event = {
      event:
        args.mode === "apply"
          ? "source_contract_depth_package_layer4_applied"
          : args.mode === "verify"
            ? "source_contract_depth_package_layer4_verified"
            : "source_contract_depth_package_layer4_plan",
      mode: args.mode,
      tenant_key: args.tenantKey,
      dataset_version: args.datasetVersion,
      load_run_id: args.loadRunId,
      idempotency_key: args.idempotencyKey,
      proof_dir: args.proofDir,
      target_object_kinds: kinds,
      layer3_readback: layer3,
      layer4_readback: layer4,
      quality_gate: layer4 ? { ...qualityGate, status: "PASS" } : qualityGate,
    };
    writeJson(path.join(args.proofDir, "summary.json"), event);
    console.log(JSON.stringify(event, null, 2));
    if (shouldEmitProofBundle()) {
      emitProofBundle(args.proofDir);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
