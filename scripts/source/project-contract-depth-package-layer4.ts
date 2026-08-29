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
const DEFAULT_LOAD_RUN_ID =
  "source-contract-depth-package-meridian-contract-depth-v1-20260828-a7061fcf";
const AS_OF_DATE = "2027-06-30";

const TARGET_VIEWS = [
  ["source", "contract_application_scope"],
  ["source", "contract_financial_exposure"],
  ["source", "contract_operational_performance"],
  ["source", "contract_vendor_360"],
  ["source", "vendor_contract_portfolio"],
  ["source", "contract_360"],
  ["source", "contract_evidence_coverage_v1"],
  ["source", "contract_action_candidate_v1"],
  ["source", "contract_claim_card_v1"],
  ["source", "vendor_position_v1"],
  ["source", "source_page_storyline_v1"],
  ["source", "ava_grounding_bundle_v1"],
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
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

function parseArgs(): Args {
  const mode = (argValue("mode") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_L4_MODE ??
    "plan") as Mode;
  if (!["plan", "apply", "verify"].includes(mode)) {
    throw new Error(
      `Unsupported SOURCE_CONTRACT_DEPTH_PACKAGE_L4_MODE: ${mode}`,
    );
  }
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const tenantKey =
    argValue("tenant-key") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_TENANT_KEY ??
    DEFAULT_TENANT_KEY;
  const datasetVersion =
    argValue("dataset-version") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_DATASET_VERSION ??
    DEFAULT_DATASET_VERSION;
  const loadRunId =
    argValue("load-run-id") ??
    process.env.SOURCE_CONTRACT_DEPTH_PACKAGE_LOAD_RUN_ID ??
    DEFAULT_LOAD_RUN_ID;
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
  await client.query("SELECT set_config('app.tenant_key', $1, false)", [
    tenantKey,
  ]);
}

async function tableScalar(
  client: Client,
  sql: string,
  params: unknown[],
): Promise<number> {
  const result = await client.query(sql, params);
  return num(result.rows[0]?.value);
}

async function objectKinds(client: Client) {
  const result = await client.query<{
    schema_name: string;
    relation_name: string;
    relkind: string;
  }>(
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
  const nonViews = (await objectKinds(client)).filter(
    (row) => row.relkind !== "v",
  );
  if (nonViews.length > 0) {
    throw new Error(
      `schema_change_required: L4 projection targets must be views before replacement: ${nonViews
        .map((row) => `${row.schema_name}.${row.relation_name}:${row.relkind}`)
        .join(", ")}`,
    );
  }
}

async function layer3Readback(
  client: Client,
  args: Args,
): Promise<Record<string, number>> {
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
  return Object.fromEntries(
    Object.entries(result.rows[0] ?? {}).map(([key, value]) => [
      key,
      num(value),
    ]),
  );
}

async function l4Readback(
  client: Client,
  args: Args,
  beforeContractCount = 0,
): Promise<Record<string, number>> {
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
    source_contract_evidence_coverage_v1_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.contract_evidence_coverage_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_contract_action_candidate_v1_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.contract_action_candidate_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_contract_claim_card_v1_package: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.contract_claim_card_v1 WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_vendor_position_v1_package: await tableScalar(
      client,
      `SELECT count(DISTINCT vp.vendor_ref) AS value
         FROM source.vendor_position_v1 vp
         JOIN source.contract c
           ON c.tenant_key = vp.tenant_key
          AND c.vendor_id = vp.vendor_ref
        WHERE vp.tenant_key = $1 AND c.contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    source_page_storyline_v1_rows: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.source_page_storyline_v1 WHERE tenant_key = $1`,
      [args.tenantKey],
    ),
    source_ava_grounding_bundle_v1_rows: await tableScalar(
      client,
      `SELECT count(*) AS value FROM source.ava_grounding_bundle_v1 WHERE tenant_key = $1`,
      [args.tenantKey],
    ),
    deterministic_layer_unclaimed_credit_usd: await tableScalar(
      client,
      `SELECT COALESCE(SUM(unclaimed_credit_usd), 0) AS value
         FROM source.contract_evidence_coverage_v1
        WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
      [args.tenantKey, contractIds],
    ),
    deterministic_layer_candidate_amount_usd: await tableScalar(
      client,
      `SELECT COALESCE(SUM(candidate_amount_usd), 0) AS value
         FROM source.contract_action_candidate_v1
        WHERE tenant_key = $1 AND contract_id = ANY($2::text[])`,
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
    .map(
      ([key, expectedValue]) =>
        `${key} expected ${expectedValue}, got ${rows[key] ?? "<missing>"}`,
    );
  if (failures.length > 0) {
    throw new Error(
      `Layer 3 is not ready for Layer 4 projection: ${failures.join("; ")}`,
    );
  }
}

function assertL4Ready(
  rows: Record<string, number>,
  beforeContractCount: number,
): void {
  const expected: Record<string, number> = {
    source_contract_360_package: 5,
    source_contract_financial_exposure_package: 5,
    source_contract_operational_performance_package: 5,
    source_contract_application_scope_package: 18,
    consumption_sourcing_spend_monthly_v1_package: 60,
    consumption_sourcing_performance_v1_package: 36,
    consumption_sourcing_opportunity_v1_package: 6,
    source_contract_evidence_coverage_v1_package: 5,
    source_contract_action_candidate_v1_package: 6,
    source_contract_claim_card_v1_package: 6,
    source_vendor_position_v1_package: 5,
    source_page_storyline_v1_rows: 5,
    source_ava_grounding_bundle_v1_rows: 6,
    source_contract_360_page_text_rows_package: 30,
    source_contract_360_change_order_rows_package: 8,
    package_contracts_with_assessed_alternatives: 0,
    skyharbor_strings_in_scope: 0,
  };
  const failures = Object.entries(expected)
    .filter(([key, expectedValue]) => rows[key] !== expectedValue)
    .map(
      ([key, expectedValue]) =>
        `${key} expected ${expectedValue}, got ${rows[key] ?? "<missing>"}`,
    );
  if (
    beforeContractCount > 0 &&
    rows.source_contract_360_total < beforeContractCount
  ) {
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
  if (rows.deterministic_layer_unclaimed_credit_usd <= 0) {
    failures.push("deterministic_layer_unclaimed_credit_usd expected > 0");
  }
  if (rows.deterministic_layer_candidate_amount_usd <= 0) {
    failures.push("deterministic_layer_candidate_amount_usd expected > 0");
  }
  if (failures.length > 0) {
    throw new Error(`Layer 4 readback failed: ${failures.join("; ")}`);
  }
}

async function applyLayer4(
  client: Client,
  args: Args,
): Promise<Record<string, number>> {
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
    CREATE OR REPLACE VIEW source.contract_evidence_coverage_v1 AS
    WITH spend AS (
      SELECT
        tenant_key,
        contract_id,
        count(*)::bigint AS spend_rows,
        COALESCE(sum(actual_spend), 0)::numeric AS actual_spend_usd,
        COALESCE(sum(committed_amount), 0)::numeric AS committed_spend_usd
      FROM consumption.sourcing_spend_monthly_v1
      GROUP BY tenant_key, contract_id
    ),
    performance AS (
      SELECT
        tenant_key,
        contract_id,
        count(*)::bigint AS performance_rows,
        count(*) FILTER (WHERE performance_state = 'breached')::bigint AS breach_rows,
        COALESCE(sum(credit_calculated), 0)::numeric AS credit_calculated_usd,
        COALESCE(sum(credit_claimed), 0)::numeric AS credit_claimed_usd,
        COALESCE(sum(credit_recovered), 0)::numeric AS credit_recovered_usd
      FROM consumption.sourcing_performance_v1
      GROUP BY tenant_key, contract_id
    ),
    opportunities AS (
      SELECT
        tenant_key,
        contract_id,
        count(*)::bigint AS opportunity_rows,
        COALESCE(sum(annual_value_exposed), 0)::numeric AS candidate_amount_usd,
        count(*) FILTER (WHERE readiness_state = 'finance_confirmation_required')::bigint AS finance_confirmation_required_rows,
        count(*) FILTER (WHERE evidence_state = 'present')::bigint AS opportunities_with_evidence
      FROM consumption.sourcing_opportunity_v1
      GROUP BY tenant_key, contract_id
    ),
    scope AS (
      SELECT
        tenant_key,
        contract_id,
        count(*)::bigint AS scope_rows,
        count(*) FILTER (WHERE critical_application_flag)::bigint AS critical_scope_rows
      FROM consumption.sourcing_contract_scope_v1
      GROUP BY tenant_key, contract_id
    )
    SELECT
      c.tenant_key,
      c.contract_id,
      c.vendor_ref,
      c.vendor_name,
      c.contract_name,
      COALESCE(spend.spend_rows, 0)::bigint AS spend_rows,
      COALESCE(spend.actual_spend_usd, 0)::numeric AS actual_spend_usd,
      COALESCE(spend.committed_spend_usd, 0)::numeric AS committed_spend_usd,
      COALESCE(performance.performance_rows, 0)::bigint AS performance_rows,
      COALESCE(performance.breach_rows, 0)::bigint AS breach_rows,
      COALESCE(performance.credit_calculated_usd, 0)::numeric AS credit_calculated_usd,
      COALESCE(performance.credit_claimed_usd, 0)::numeric AS credit_claimed_usd,
      COALESCE(performance.credit_recovered_usd, 0)::numeric AS credit_recovered_usd,
      GREATEST(
        COALESCE(performance.credit_calculated_usd, 0)
          - COALESCE(performance.credit_claimed_usd, 0),
        0
      )::numeric AS unclaimed_credit_usd,
      COALESCE(opportunities.opportunity_rows, 0)::bigint AS opportunity_rows,
      COALESCE(opportunities.candidate_amount_usd, 0)::numeric AS candidate_amount_usd,
      COALESCE(opportunities.finance_confirmation_required_rows, 0)::bigint AS finance_confirmation_required_rows,
      COALESCE(opportunities.opportunities_with_evidence, 0)::bigint AS opportunities_with_evidence,
      COALESCE(scope.scope_rows, 0)::bigint AS scope_rows,
      COALESCE(scope.critical_scope_rows, 0)::bigint AS critical_scope_rows,
      COALESCE(c.document_page_text_count, 0)::bigint AS document_page_text_rows,
      COALESCE(c.change_order_count, 0)::bigint AS change_order_rows,
      CASE
        WHEN COALESCE(opportunities.opportunity_rows, 0) > 0
         AND COALESCE(opportunities.opportunities_with_evidence, 0) = 0 THEN 'blocked'
        WHEN COALESCE(spend.spend_rows, 0) > 0
         AND COALESCE(performance.performance_rows, 0) > 0
         AND COALESCE(c.document_page_text_count, 0) > 0 THEN 'decision_ready'
        WHEN COALESCE(spend.spend_rows, 0) > 0
          OR COALESCE(performance.performance_rows, 0) > 0
          OR COALESCE(c.document_page_text_count, 0) > 0 THEN 'partial'
        ELSE 'not_loaded'
      END AS coverage_state,
      concat_ws(
        '; ',
        CASE WHEN COALESCE(spend.spend_rows, 0) = 0 THEN 'monthly spend missing' END,
        CASE WHEN COALESCE(performance.performance_rows, 0) = 0 THEN 'performance rows missing' END,
        CASE WHEN COALESCE(c.document_page_text_count, 0) = 0 THEN 'document page text missing' END,
        CASE
          WHEN COALESCE(opportunities.opportunity_rows, 0) > 0
           AND COALESCE(opportunities.finance_confirmation_required_rows, 0) > 0
            THEN 'finance confirmation required before realized-value claim'
        END
      ) AS blocker_if_missing,
      jsonb_build_object(
        'source.contract_360', jsonb_build_object(
          'document_page_text_rows', COALESCE(c.document_page_text_count, 0),
          'change_order_rows', COALESCE(c.change_order_count, 0)
        ),
        'consumption.sourcing_spend_monthly_v1', COALESCE(spend.spend_rows, 0),
        'consumption.sourcing_performance_v1', COALESCE(performance.performance_rows, 0),
        'consumption.sourcing_opportunity_v1', COALESCE(opportunities.opportunity_rows, 0),
        'consumption.sourcing_contract_scope_v1', COALESCE(scope.scope_rows, 0)
      ) AS evidence_basis_json,
      c.load_run_id
    FROM source.contract_360 c
    LEFT JOIN spend
      ON spend.tenant_key = c.tenant_key
     AND spend.contract_id = c.contract_id
    LEFT JOIN performance
      ON performance.tenant_key = c.tenant_key
     AND performance.contract_id = c.contract_id
    LEFT JOIN opportunities
      ON opportunities.tenant_key = c.tenant_key
     AND opportunities.contract_id = c.contract_id
    LEFT JOIN scope
      ON scope.tenant_key = c.tenant_key
     AND scope.contract_id = c.contract_id
    WHERE source.can_read_sourcing_tenant(c.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.contract_action_candidate_v1 AS
    SELECT
      o.tenant_key,
      o.opportunity_id AS action_candidate_id,
      o.opportunity_id,
      o.contract_id,
      o.vendor_ref,
      COALESCE(cov.vendor_name, o.vendor_ref, 'Unknown vendor') AS vendor_name,
      o.title,
      o.action_type,
      o.opportunity_type,
      o.finding_summary,
      o.deterministic_basis,
      o.annual_value_exposed::numeric AS candidate_amount_usd,
      o.priority,
      o.readiness_state,
      o.evidence_state,
      o.authority_state,
      CASE
        WHEN o.readiness_state = 'finance_confirmation_required' THEN 'not_confirmed'
        WHEN o.authority_state IN ('accepted', 'approved') THEN 'confirmed'
        ELSE 'not_confirmed'
      END AS finance_confirmation_state,
      o.recommended_action AS next_action,
      o.accountable_role,
      o.decision_due_date,
      cov.coverage_state,
      cov.blocker_if_missing,
      jsonb_build_object(
        'opportunity_ref', o.opportunity_id,
        'contract_ref', o.contract_id,
        'contract_360', o.contract_id,
        'evidence_coverage', cov.evidence_basis_json,
        'finance_confirmation_state',
          CASE
            WHEN o.readiness_state = 'finance_confirmation_required' THEN 'not_confirmed'
            WHEN o.authority_state IN ('accepted', 'approved') THEN 'confirmed'
            ELSE 'not_confirmed'
          END
      ) AS citation_basis_json,
      o.load_run_id
    FROM consumption.sourcing_opportunity_v1 o
    LEFT JOIN source.contract_evidence_coverage_v1 cov
      ON cov.tenant_key = o.tenant_key
     AND cov.contract_id = o.contract_id
    WHERE source.can_read_sourcing_tenant(o.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.contract_claim_card_v1 AS
    SELECT
      a.tenant_key,
      concat(a.action_candidate_id, ':claim-card') AS claim_card_id,
      a.action_candidate_id,
      a.opportunity_id,
      a.contract_id,
      a.vendor_ref,
      a.vendor_name,
      a.title AS claim_title,
      CASE
        WHEN a.finance_confirmation_state = 'confirmed'
          THEN concat(a.vendor_name, ' has a finance-confirmed opportunity backed by Source evidence.')
        ELSE concat(a.vendor_name, ' has a candidate opportunity backed by Source evidence; do not label it realized value.')
      END AS allowed_executive_statement,
      CASE
        WHEN a.finance_confirmation_state <> 'confirmed'
          THEN 'Never present this candidate as realized savings until finance confirms it.'
        WHEN a.evidence_state <> 'present'
          THEN 'Do not present without evidence rows.'
        ELSE NULL::text
      END AS blocker_if_missing,
      a.candidate_amount_usd,
      a.finance_confirmation_state,
      a.readiness_state,
      a.evidence_state,
      a.citation_basis_json,
      a.load_run_id
    FROM source.contract_action_candidate_v1 a
    WHERE source.can_read_sourcing_tenant(a.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.vendor_position_v1 AS
    WITH opportunity AS (
      SELECT
        tenant_key,
        vendor_ref,
        count(*)::bigint AS action_candidate_count,
        COALESCE(sum(candidate_amount_usd), 0)::numeric AS candidate_amount_usd,
        count(*) FILTER (WHERE finance_confirmation_state = 'not_confirmed')::bigint AS not_confirmed_count
      FROM source.contract_action_candidate_v1
      GROUP BY tenant_key, vendor_ref
    ),
    coverage AS (
      SELECT
        tenant_key,
        vendor_ref,
        count(*) FILTER (WHERE coverage_state = 'decision_ready')::bigint AS decision_ready_contracts,
        COALESCE(sum(unclaimed_credit_usd), 0)::numeric AS unclaimed_credit_usd,
        COALESCE(sum(spend_rows), 0)::bigint AS spend_rows,
        COALESCE(sum(performance_rows), 0)::bigint AS performance_rows
      FROM source.contract_evidence_coverage_v1
      GROUP BY tenant_key, vendor_ref
    )
    SELECT
      v.tenant_key,
      v.vendor_ref,
      v.vendor_name,
      v.vendor_category,
      v.contract_count,
      v.annual_value,
      v.total_committed_value,
      v.auto_renew_contracts,
      v.next_end_date,
      v.contract_refs,
      COALESCE(opportunity.action_candidate_count, 0)::bigint AS action_candidate_count,
      COALESCE(opportunity.candidate_amount_usd, 0)::numeric AS candidate_amount_usd,
      COALESCE(opportunity.not_confirmed_count, 0)::bigint AS not_confirmed_count,
      COALESCE(coverage.decision_ready_contracts, 0)::bigint AS decision_ready_contracts,
      COALESCE(coverage.unclaimed_credit_usd, 0)::numeric AS unclaimed_credit_usd,
      COALESCE(coverage.spend_rows, 0)::bigint AS spend_rows,
      COALESCE(coverage.performance_rows, 0)::bigint AS performance_rows,
      CASE
        WHEN COALESCE(opportunity.action_candidate_count, 0) > 0 THEN 'act_on_evidence'
        WHEN COALESCE(coverage.decision_ready_contracts, 0) > 0 THEN 'monitor_evidence'
        ELSE 'header_only'
      END AS vendor_position_state,
      v.load_run_id
    FROM source.vendor_contract_portfolio v
    LEFT JOIN opportunity
      ON opportunity.tenant_key = v.tenant_key
     AND opportunity.vendor_ref = v.vendor_ref
    LEFT JOIN coverage
      ON coverage.tenant_key = v.tenant_key
     AND coverage.vendor_ref = v.vendor_ref
    WHERE source.can_read_sourcing_tenant(v.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.source_page_storyline_v1 AS
    WITH totals AS (
      SELECT
        c.tenant_key,
        count(*)::bigint AS contract_count,
        count(DISTINCT c.vendor_ref)::bigint AS vendor_count,
        COALESCE(sum(c.annual_value), 0)::numeric AS annual_value_usd,
        COALESCE(sum(c.actual_annual_spend), 0)::numeric AS actual_annual_spend_usd
      FROM source.contract_360 c
      GROUP BY c.tenant_key
    ),
    opportunity AS (
      SELECT
        tenant_key,
        count(*)::bigint AS candidate_count,
        COALESCE(sum(candidate_amount_usd), 0)::numeric AS candidate_amount_usd,
        COALESCE(sum(candidate_amount_usd) FILTER (WHERE finance_confirmation_state = 'confirmed'), 0)::numeric AS confirmed_amount_usd
      FROM source.contract_action_candidate_v1
      GROUP BY tenant_key
    ),
    coverage AS (
      SELECT
        tenant_key,
        COALESCE(sum(spend_rows), 0)::bigint AS spend_rows,
        COALESCE(sum(performance_rows), 0)::bigint AS performance_rows,
        COALESCE(sum(unclaimed_credit_usd), 0)::numeric AS unclaimed_credit_usd,
        count(*) FILTER (WHERE coverage_state = 'decision_ready')::bigint AS decision_ready_contracts
      FROM source.contract_evidence_coverage_v1
      GROUP BY tenant_key
    )
    SELECT
      totals.tenant_key,
      story.page_key,
      story.section_key,
      story.sort_order,
      story.headline,
      story.allowed_executive_statement,
      story.primary_metric_label,
      story.primary_metric_value,
      story.blocker_if_missing,
      story.citation_basis_json
    FROM totals
    LEFT JOIN opportunity ON opportunity.tenant_key = totals.tenant_key
    LEFT JOIN coverage ON coverage.tenant_key = totals.tenant_key
    CROSS JOIN LATERAL (
      VALUES
        (
          'overview'::text,
          'portfolio_posture'::text,
          10::int,
          'Governed contract book'::text,
          concat(totals.contract_count, ' contracts and ', totals.vendor_count, ' vendors are loaded. Claims stay limited to populated evidence rows.')::text,
          'Contracts'::text,
          totals.contract_count::text,
          NULL::text,
          jsonb_build_object('source.contract_360', totals.contract_count, 'source.vendor_contract_portfolio', totals.vendor_count)
        ),
        (
          'overview',
          'actual_spend',
          20,
          'Spend evidence',
          'Actual spend is shown only where monthly spend rows are loaded.',
          'Monthly spend rows',
          COALESCE(coverage.spend_rows, 0)::text,
          CASE WHEN COALESCE(coverage.spend_rows, 0) = 0 THEN 'Do not show actual annual spend trend.' ELSE NULL END,
          jsonb_build_object('consumption.sourcing_spend_monthly_v1', COALESCE(coverage.spend_rows, 0))
        ),
        (
          'overview',
          'performance_credits',
          30,
          'Performance-credit recovery',
          'Unclaimed credits are candidate recovery only; they are not finance-confirmed savings.',
          'Unclaimed credits',
          round(COALESCE(coverage.unclaimed_credit_usd, 0), 2)::text,
          CASE WHEN COALESCE(coverage.performance_rows, 0) = 0 THEN 'No performance rows loaded.' ELSE 'Finance confirmation required before savings claim.' END,
          jsonb_build_object('consumption.sourcing_performance_v1', COALESCE(coverage.performance_rows, 0))
        ),
        (
          'optimize',
          'candidate_actions',
          40,
          'Action queue',
          'Optimize shows candidate actions with evidence and explicit blockers.',
          'Candidate amount',
          round(COALESCE(opportunity.candidate_amount_usd, 0), 2)::text,
          CASE WHEN COALESCE(opportunity.confirmed_amount_usd, 0) = 0 THEN 'Do not call candidate amount realized savings.' ELSE NULL END,
          jsonb_build_object('source.contract_action_candidate_v1', COALESCE(opportunity.candidate_count, 0))
        ),
        (
          'ava',
          'grounding',
          50,
          'aVa grounding',
          'aVa may answer with these deterministic facts and must refuse unsupported value claims.',
          'Grounding bundles',
          'portfolio, contract, opportunity',
          'Reject raw savings, vendor pricing, or unsupported cross-tenant prompts.',
          jsonb_build_object('source.ava_grounding_bundle_v1', 1)
        )
    ) AS story(page_key, section_key, sort_order, headline, allowed_executive_statement, primary_metric_label, primary_metric_value, blocker_if_missing, citation_basis_json)
    WHERE source.can_read_sourcing_tenant(totals.tenant_key)`);

  await client.query(`
    CREATE OR REPLACE VIEW source.ava_grounding_bundle_v1 AS
    SELECT
      s.tenant_key,
      concat(s.page_key, ':', s.section_key) AS grounding_bundle_id,
      s.page_key,
      s.section_key,
      CASE
        WHEN s.page_key = 'ava' THEN 'refusal_and_citation_policy'
        WHEN s.section_key = 'performance_credits' THEN 'value_claim_guardrail'
        ELSE 'source_workspace_claim'
      END AS question_family,
      jsonb_build_array(
        jsonb_build_object(
          'claim', s.allowed_executive_statement,
          'metric_label', s.primary_metric_label,
          'metric_value', s.primary_metric_value,
          'basis', s.citation_basis_json
        )
      ) AS allowed_claims_json,
      jsonb_build_array(
        'Do not present candidate opportunity as realized value unless finance_confirmation_state is confirmed.',
        'Do not answer cross-tenant vendor pricing prompts.',
        'Do not cite a document unless source rows or document page text exist.',
        'When evidence is missing, name the missing substrate instead of guessing.'
      ) AS refusal_rules_json,
      s.citation_basis_json AS citation_sources_json,
      NULL::text AS load_run_id
    FROM source.source_page_storyline_v1 s
    WHERE source.can_read_sourcing_tenant(s.tenant_key)
    UNION ALL
    SELECT
      c.tenant_key,
      concat('contract:', c.contract_id) AS grounding_bundle_id,
      'contract_360'::text AS page_key,
      c.contract_id AS section_key,
      'contract_action_grounding'::text AS question_family,
      jsonb_build_array(
        jsonb_build_object(
          'contract_id', c.contract_id,
          'vendor_name', c.vendor_name,
          'candidate_amount_usd', c.candidate_amount_usd,
          'unclaimed_credit_usd', c.unclaimed_credit_usd,
          'coverage_state', c.coverage_state,
          'blocker', c.blocker_if_missing
        )
      ) AS allowed_claims_json,
      jsonb_build_array(
        CASE
          WHEN c.finance_confirmation_required_rows > 0
            THEN 'Finance confirmation is required before claiming realized savings.'
          ELSE 'Stay within loaded contract evidence.'
        END,
        CASE
          WHEN c.document_page_text_rows = 0 THEN 'Document citation is not available for this contract.'
          ELSE 'Cite loaded document page text only.'
        END
      ) AS refusal_rules_json,
      c.evidence_basis_json AS citation_sources_json,
      c.load_run_id
    FROM source.contract_evidence_coverage_v1 c
    WHERE source.can_read_sourcing_tenant(c.tenant_key)`);

  await client.query(`
    GRANT SELECT ON
      source.contract_application_scope,
      source.contract_financial_exposure,
      source.contract_operational_performance,
      source.contract_vendor_360,
      source.vendor_contract_portfolio,
      source.contract_360,
      source.contract_evidence_coverage_v1,
      source.contract_action_candidate_v1,
      source.contract_claim_card_v1,
      source.vendor_position_v1,
      source.source_page_storyline_v1,
      source.ava_grounding_bundle_v1
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

  const client = new Client(
    postgresClientOptions(
      databaseUrl(),
      "source-contract-depth-package-layer4",
    ),
  );
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
        throw new Error(
          "Refusing to mutate Azure without SOURCE_CONTRACT_DEPTH_PACKAGE_L4_APPLY_APPROVED=true.",
        );
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
