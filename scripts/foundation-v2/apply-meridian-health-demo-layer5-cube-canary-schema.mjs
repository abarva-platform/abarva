#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  sha256,
  stableJson,
  writeCsv,
  writeJson,
} from "./golden-slice-support.mjs";

const SOURCE_SCHEMA = "foundation_v2_meridian_health_demo";
const CANARY_SCHEMA = "foundation_v2_meridian_health_cube_canary";
const TENANT_KEY = "meridian_health_global";
const TEST_NAMESPACE = "meridian-health-source-volume-v1";
const SOURCE_RELEASE_ID = "meridian-health-source-v1-202608:source-volume-v1:05889e763f88";
const FOUNDATION_RELEASE_ALIAS = "meridian-health-demo-phase-a-source-volume-v1";
const PROJECTION_VERSION = "meridian-health-layer4-consumption-projections-v1";
const CUBE_CANARY_VERSION = "meridian-health-layer5-cube-canary-v1";
const WRITER_JOB_ID = `${SOURCE_RELEASE_ID}:${CUBE_CANARY_VERSION}`;
const SYSTEM_COLUMNS = new Set([
  "projection_row_id",
  "tenant_key",
  "test_namespace",
  "source_release_id",
  "business_key",
  "business_grain",
  "event_context_snapshot_id",
  "source_record_count",
  "canonical_entity_count",
  "canonical_relationship_count",
  "row_hash",
  "projection_payload",
  "cube_canary_version",
  "writer_job_id",
  "loaded_at",
]);

const SPECS = [
  {
    table: "meridian_health_vendor_portfolio_v1",
    namespace: "enterprise_context",
    name: "vendor_portfolio",
    grain: "vendor",
    columns: [
      ["vendor_id", "text", "text"],
      ["legal_name", "text", "text"],
      ["supplier_category", "text", "text"],
      ["risk_tier", "text", "text"],
      ["status", "text", "text"],
      ["contract_family_count", "integer", "int"],
      ["supported_service_count", "integer", "int"],
      ["invoice_line_count", "integer", "int"],
      ["invoice_line_amount", "numeric", "numeric"],
    ],
  },
  {
    table: "meridian_health_contract_family_v1",
    namespace: "doc",
    name: "contract_families_and_instruments",
    grain: "contract_family",
    columns: [
      ["contract_family_id", "text", "text"],
      ["contract_name", "text", "text"],
      ["vendor_id", "text", "text"],
      ["synthetic_midpoint_total_contract_value", "numeric", "numeric"],
      ["evidence_tier", "text", "text"],
      ["renewal_window", "text", "text"],
      ["amendment_count", "integer", "int"],
      ["sla_term_count", "integer", "int"],
    ],
  },
  {
    table: "meridian_health_contract_scope_v1",
    namespace: "source",
    name: "contract_scope",
    grain: "contract_scope_edge",
    columns: [
      ["scope_relationship_id", "text", "text"],
      ["vendor_id", "text", "text"],
      ["contract_family_id", "text", "text"],
      ["legal_instrument_id", "text", "text"],
      ["contracted_service_id", "text", "text"],
      ["business_service_ref", "text", "text"],
      ["application_ref", "text", "text"],
      ["ci_ref", "text", "text"],
      ["relationship_confidence", "numeric", "numeric"],
    ],
  },
  {
    table: "meridian_health_spend_invoice_history_v1",
    namespace: "tower",
    name: "spend_invoice_history",
    grain: "vendor_contract_month",
    columns: [
      ["vendor_id", "text", "text"],
      ["contract_family_id", "text", "text"],
      ["invoice_month", "date", "date"],
      ["invoice_line_count", "integer", "int"],
      ["line_amount", "numeric", "numeric"],
      ["rate_card_matched_lines", "integer", "int"],
      ["cost_center_count", "integer", "int"],
      ["spend_category_count", "integer", "int"],
    ],
  },
  {
    table: "meridian_health_workforce_rate_card_economics_v1",
    namespace: "tower",
    name: "workforce_rate_card_economics",
    grain: "contract_role_location",
    columns: [
      ["contract_family_id", "text", "text"],
      ["role_title", "text", "text"],
      ["location_model", "text", "text"],
      ["workforce_month_count", "integer", "int"],
      ["billed_fte", "numeric", "numeric"],
      ["average_contracted_mix_pct", "numeric", "numeric"],
      ["average_billed_mix_pct", "numeric", "numeric"],
    ],
  },
  {
    table: "meridian_health_sla_itsm_performance_v1",
    namespace: "source",
    name: "sla_itsm_performance",
    grain: "service_performance",
    columns: [
      ["vendor_id", "text", "text"],
      ["contract_id", "text", "text"],
      ["service_ref", "text", "text"],
      ["business_service_ref", "text", "text"],
      ["application_ref", "text", "text"],
      ["service_tower", "text", "text"],
      ["period_count", "integer", "int"],
      ["tickets_opened", "integer", "int"],
      ["p1_count", "integer", "int"],
      ["p2_count", "integer", "int"],
      ["sla_breach_count", "integer", "int"],
      ["average_response_sla_pct", "numeric", "numeric"],
      ["average_resolution_sla_pct", "numeric", "numeric"],
      ["average_availability_pct", "numeric", "numeric"],
      ["service_credit_eligible_amount", "numeric", "numeric"],
      ["service_credit_claimed_amount", "numeric", "numeric"],
    ],
  },
  {
    table: "meridian_health_service_credit_v1",
    namespace: "source",
    name: "service_credits",
    grain: "service_credit",
    columns: [
      ["service_credit_id", "text", "text"],
      ["contract_id", "text", "text"],
      ["service_ref", "text", "text"],
      ["eligible_amount", "numeric", "numeric"],
      ["claimed_amount", "numeric", "numeric"],
      ["claim_state", "text", "text"],
    ],
  },
  {
    table: "meridian_health_application_dependency_v1",
    namespace: "enterprise_context",
    name: "applications_services_dependencies",
    grain: "application",
    columns: [
      ["application_id", "text", "text"],
      ["application_name", "text", "text"],
      ["owner_function", "text", "text"],
      ["lifecycle", "text", "text"],
      ["criticality", "text", "text"],
      ["epic_interface_count", "integer", "int"],
      ["analytics_dependency_count", "integer", "int"],
    ],
  },
  {
    table: "meridian_health_renewal_exit_term_v1",
    namespace: "governance",
    name: "renewal_exit_terms",
    grain: "contract_family",
    columns: [
      ["contract_family_id", "text", "text"],
      ["renewal_window", "text", "text"],
    ],
  },
  {
    table: "meridian_health_program_dependency_v1",
    namespace: "enterprise_context",
    name: "programs_modernization_dependencies",
    grain: "program",
    columns: [
      ["program_ref", "text", "text"],
      ["source_dependency_rows", "integer", "int"],
      ["canonical_initiative_concept_count", "integer", "jsonb_array_length:canonical_initiative_concepts"],
      ["target_quarter_count", "integer", "jsonb_array_length:target_quarters"],
    ],
  },
  {
    table: "meridian_health_enterprise_outcome_v1",
    namespace: "tower",
    name: "enterprise_outcomes",
    grain: "enterprise_outcome",
    columns: [
      ["health_plan_outcome_snapshot_id", "text", "text"],
      ["outcome_name", "text", "text"],
      ["outcome_category", "text", "text"],
      ["trend_state", "text", "text"],
      ["measurement_period", "text", "text"],
      ["evidence_status", "text", "text"],
      ["attestation_status", "text", "text"],
    ],
  },
  {
    table: "meridian_health_bpo_baseline_v1",
    namespace: "sourcing_event",
    name: "bpo_baseline",
    grain: "function_process",
    columns: [
      ["event_id", "text", "text"],
      ["function_ref", "text", "text"],
      ["process_name", "text", "text"],
      ["monthly_volume", "numeric", "numeric"],
      ["automation_opportunity", "text", "text"],
      ["baseline_cost_time_horizon", "text", "text"],
      ["baseline_cost_horizon_years", "integer", "int"],
      ["baseline_labor_cost", "numeric", "numeric"],
      ["baseline_technology_cost", "numeric", "numeric"],
      ["baseline_controls_cost", "numeric", "numeric"],
      ["five_year_current_state_baseline_cost", "numeric", "numeric"],
      ["annualized_current_state_cost", "numeric", "numeric"],
      ["five_year_labor_cost", "numeric", "numeric"],
      ["five_year_technology_platform_cost", "numeric", "numeric"],
      ["five_year_controls_or_other_cost", "numeric", "numeric"],
      ["current_resource_count", "numeric", "numeric"],
    ],
  },
  {
    table: "meridian_health_supplier_proposal_bafo_v1",
    namespace: "sourcing_event",
    name: "supplier_proposals_bafo",
    grain: "supplier",
    columns: [
      ["event_id", "text", "text"],
      ["supplier_id", "text", "text"],
      ["invitation_state", "text", "text"],
      ["headline_price_rank", "integer", "int"],
      ["normalized_recommendation_rank", "integer", "int"],
      ["response_count", "integer", "int"],
      ["bafo_count", "integer", "int"],
      ["evaluation_weighted_score", "numeric", "numeric"],
      ["five_year_service_fee", "numeric", "numeric"],
      ["transition_cost", "numeric", "numeric"],
      ["risk_adjustment", "numeric", "numeric"],
    ],
  },
  {
    table: "meridian_health_rebadge_transition_commitment_v1",
    namespace: "sourcing_event",
    name: "rebadge_transition_commitments",
    grain: "supplier_transition_commitment",
    columns: [
      ["event_id", "text", "text"],
      ["supplier_id", "text", "text"],
      ["function_ref", "text", "text"],
      ["process_name", "text", "text"],
      ["employee_cohort", "text", "text"],
      ["source_proposed_rebadge_count", "numeric", "numeric"],
      ["eligible_unique_current_workforce_count", "numeric", "numeric"],
      ["rebadge_denominator_policy", "text", "text"],
      ["rebadge_strategy", "text", "text"],
      ["number_proposed_for_rebadge", "numeric", "numeric"],
      ["normalized_supplier_proposed_rebadge_count", "numeric", "numeric"],
      ["retention_commitment_months", "numeric", "numeric"],
      ["knowledge_critical_designation", "text", "text"],
      ["contractual_or_proposed_status", "text", "text"],
      ["kt_plan_count", "integer", "int"],
    ],
  },
  {
    table: "meridian_health_ai_automation_commitment_v1",
    namespace: "sourcing_event",
    name: "ai_automation_commitments",
    grain: "automation_commitment",
    columns: [
      ["event_id", "text", "text"],
      ["automation_commitment_id", "text", "text"],
      ["supplier_id", "text", "text"],
      ["process_name", "text", "text"],
      ["ai_rpa_use_case", "text", "text"],
      ["current_manual_volume", "numeric", "numeric"],
      ["current_manual_effort_hours", "numeric", "numeric"],
      ["target_automation_percentage", "numeric", "numeric"],
      ["productivity_commitment_pct", "numeric", "numeric"],
      ["contracted_benefit_amount", "numeric", "numeric"],
      ["counted_in_normalized_tco", "text", "text"],
      ["commitment_state", "text", "text"],
      ["automation_basis", "text", "text"],
    ],
  },
  {
    table: "meridian_health_retained_org_scenario_v1",
    namespace: "sourcing_event",
    name: "retained_org_scenarios",
    grain: "retained_org_scenario",
    columns: [
      ["event_id", "text", "text"],
      ["retained_org_scenario_id", "text", "text"],
      ["supplier_id", "text", "text"],
      ["sourcing_model", "text", "text"],
      ["meridian_health_retained_function", "text", "text"],
      ["retained_role", "text", "text"],
      ["transition_fte", "numeric", "numeric"],
      ["steady_state_fte", "numeric", "numeric"],
      ["location", "text", "text"],
      ["annual_cost", "numeric", "numeric"],
      ["dependency_on_supplier_transformation", "text", "text"],
    ],
  },
  {
    table: "meridian_health_normalized_tco_recommendation_input_v1",
    namespace: "consumption",
    name: "normalized_tco_recommendation_inputs",
    grain: "supplier_scenario",
    columns: [
      ["event_id", "text", "text"],
      ["supplier_id", "text", "text"],
      ["scenario", "text", "text"],
      ["year", "integer", "int"],
      ["headline_price", "numeric", "numeric"],
      ["normalized_five_year_tco", "numeric", "numeric"],
      ["recommendation_state", "text", "text"],
      ["commercial_service_fee", "numeric", "numeric"],
      ["transition_cost", "numeric", "numeric"],
      ["retained_org_cost", "numeric", "numeric"],
      ["risk_adjustment", "numeric", "numeric"],
      ["recommendation_basis", "text", "text"],
    ],
  },
  {
    table: "meridian_health_event_context_snapshot_v1",
    namespace: "governance",
    name: "event_context_snapshot",
    grain: "sourcing_event_context",
    columns: [
      ["event_id", "text", "text"],
      ["event_context_snapshot_id", "text", "text"],
      ["snapshot_version", "text", "text"],
      ["snapshot_hash", "text", "text"],
      ["selected_source_record_count", "integer", "int"],
      ["selected_canonical_entity_count", "integer", "int"],
      ["selected_canonical_relationship_count", "integer", "int"],
    ],
  },
];

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({ status: "MERIDIAN_HEALTH_DEMO_LAYER5_CUBE_CANARY_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  if (args.mode === "self-test") {
    const result = manifest("MERIDIAN_HEALTH_DEMO_LAYER5_CUBE_CANARY_SELF_TEST_PASSED", {
      mutation_executed: false,
      canary_schema: CANARY_SCHEMA,
      typed_cube_table_count: SPECS.length,
      required_projection_count: SPECS.length,
      rule: "Layer 5 Cube canary reads typed Layer 4 projections only; generic observations remain hidden from product semantics.",
    });
    writeProofSet(result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("meridian-health-demo-layer5-cube-canary"));
  await client.connect();
  try {
    await setMeridianContext(client);
    if (args.mode === "preflight") {
      const result = await verify(client, { mode: "preflight" });
      writeProofSet(result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (!result.preflight_ready) process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const beforeSkyHarbor = await readSkyHarborCounts(client);
      const result = await verify(client, { mode: "readback", beforeSkyHarbor });
      writeProofSet(result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "MERIDIAN_HEALTH_DEMO_LAYER5_CUBE_CANARY_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const beforeSkyHarbor = await readSkyHarborCounts(client);
    await client.query("BEGIN");
    try {
      await createSchema(client);
      for (const spec of SPECS) {
        await createTable(client, spec);
        await loadTable(client, spec);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    const result = await verify(client, { mode: "apply", beforeSkyHarbor });
    writeProofSet(result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
    if (result.status !== "MERIDIAN_HEALTH_DEMO_LAYER5_CUBE_CANARY_VERIFIED") process.exitCode = 1;
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.MERIDIAN_HEALTH_LAYER5_CUBE_CANARY_MODE || "preflight",
    outDir:
      process.env.MERIDIAN_HEALTH_LAYER5_CUBE_CANARY_OUT_DIR ||
      path.join(os.tmpdir(), `meridian-health-layer5-cube-canary-${new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z")}`),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(process.cwd(), next());
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

async function setMeridianContext(client) {
  await client.query("SELECT set_config('app.tenant_key', $1, false)", [TENANT_KEY]);
  await client.query("SELECT set_config('app.foundation_v2_test_namespace', $1, false)", [TEST_NAMESPACE]);
  await client.query("SELECT set_config('app.foundation_v2_source_release_id', $1, false)", [SOURCE_RELEASE_ID]);
  await client.query("SELECT set_config('app.foundation_v2_release_alias', $1, false)", [FOUNDATION_RELEASE_ALIAS]);
}

async function createSchema(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(CANARY_SCHEMA)}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent(CANARY_SCHEMA)}.cube_canary_authority (
      canary_version text PRIMARY KEY,
      tenant_key text NOT NULL CHECK (tenant_key = '${TENANT_KEY}'),
      test_namespace text NOT NULL CHECK (test_namespace = '${TEST_NAMESPACE}'),
      source_release_id text NOT NULL CHECK (source_release_id = '${SOURCE_RELEASE_ID}'),
      source_projection_version text NOT NULL,
      typed_table_count integer NOT NULL,
      writer_job_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(
    `INSERT INTO ${quoteIdent(CANARY_SCHEMA)}.cube_canary_authority
      (canary_version, tenant_key, test_namespace, source_release_id, source_projection_version, typed_table_count, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (canary_version) DO UPDATE
       SET typed_table_count = excluded.typed_table_count,
           writer_job_id = excluded.writer_job_id,
           created_at = now()`,
    [CUBE_CANARY_VERSION, TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, PROJECTION_VERSION, SPECS.length, WRITER_JOB_ID],
  );
}

async function createTable(client, spec) {
  const typedColumns = typedProjectionColumns(spec).map(([name, type]) => `${quoteIdent(name)} ${type}`).join(",\n      ");
  const typedColumnSql = typedColumns ? `,\n      ${typedColumns}` : "";
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent(CANARY_SCHEMA)}.${quoteIdent(spec.table)} (
      projection_row_id text PRIMARY KEY,
      tenant_key text NOT NULL CHECK (tenant_key = '${TENANT_KEY}'),
      test_namespace text NOT NULL CHECK (test_namespace = '${TEST_NAMESPACE}'),
      source_release_id text NOT NULL CHECK (source_release_id = '${SOURCE_RELEASE_ID}'),
      business_key text NOT NULL,
      business_grain text NOT NULL CHECK (business_grain = '${spec.grain}'),
      event_context_snapshot_id text,
      source_record_count integer NOT NULL,
      canonical_entity_count integer NOT NULL,
      canonical_relationship_count integer NOT NULL,
      row_hash text NOT NULL,
      projection_payload jsonb NOT NULL${typedColumnSql},
      cube_canary_version text NOT NULL,
      writer_job_id text NOT NULL,
      loaded_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`DELETE FROM ${quoteIdent(CANARY_SCHEMA)}.${quoteIdent(spec.table)} WHERE tenant_key = $1`, [TENANT_KEY]);
}

async function loadTable(client, spec) {
  const typedColumns = typedProjectionColumns(spec);
  const columnNames = typedColumns.map(([name]) => quoteIdent(name));
  const expressions = typedColumns.map(([name, , cast]) => valueExpression(name, cast));
  const typedColumnSql = columnNames.length ? `, ${columnNames.join(", ")}` : "";
  const typedExpressionSql = expressions.length ? `,\n      ${expressions.join(",\n      ")}` : "";
  await client.query(
    `
    INSERT INTO ${quoteIdent(CANARY_SCHEMA)}.${quoteIdent(spec.table)} (
      projection_row_id, tenant_key, test_namespace, source_release_id, business_key, business_grain,
      event_context_snapshot_id, source_record_count, canonical_entity_count, canonical_relationship_count,
      row_hash, projection_payload${typedColumnSql}, cube_canary_version, writer_job_id
    )
    SELECT
      projection_row_id,
      tenant_key,
      test_namespace,
      source_release_id,
      business_key,
      business_grain,
      event_context_snapshot_id,
      jsonb_array_length(source_record_ids),
      jsonb_array_length(canonical_entity_ids),
      jsonb_array_length(canonical_relationship_ids),
      row_hash,
      projection_payload${typedExpressionSql},
      $4,
      $5
    FROM ${quoteIdent(SOURCE_SCHEMA)}.projection_rows
    WHERE tenant_key = $1
      AND test_namespace = $2
      AND source_release_id = $3
      AND projection_namespace = '${spec.namespace}'
      AND projection_name = '${spec.name}'
    ORDER BY projection_row_id
    `,
    [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, CUBE_CANARY_VERSION, WRITER_JOB_ID],
  );
}

function typedProjectionColumns(spec) {
  return spec.columns.filter(([name]) => !SYSTEM_COLUMNS.has(name));
}

function valueExpression(name, cast) {
  if (cast.startsWith("jsonb_array_length:")) {
    const payloadField = cast.split(":")[1];
    return `coalesce(jsonb_array_length(coalesce(projection_payload -> '${payloadField}', '[]'::jsonb)), 0) AS ${quoteIdent(name)}`;
  }
  if (cast === "text") return `(projection_payload ->> '${name}') AS ${quoteIdent(name)}`;
  if (cast === "date") {
    return `CASE WHEN NULLIF(projection_payload ->> '${name}', '') ~ '^\\d{4}-\\d{2}$' THEN ((projection_payload ->> '${name}') || '-01')::date ELSE NULLIF(projection_payload ->> '${name}', '')::date END AS ${quoteIdent(name)}`;
  }
  if (cast === "int") return `NULLIF(projection_payload ->> '${name}', '')::integer AS ${quoteIdent(name)}`;
  if (cast === "numeric") return `NULLIF(projection_payload ->> '${name}', '')::numeric AS ${quoteIdent(name)}`;
  throw new Error(`Unsupported cast ${cast}`);
}

async function verify(client, options = {}) {
  const mode = options.mode || "preflight";
  const mutationExecuted = mode === "apply";
  const readbackVerificationExecuted = mode === "readback";
  const requireCanaryExactMatch = mutationExecuted || readbackVerificationExecuted;
  const beforeSkyHarbor = options.beforeSkyHarbor || null;
  const authority = await maybeOne(
    client,
    `SELECT canary_version, typed_table_count FROM ${quoteIdent(CANARY_SCHEMA)}.cube_canary_authority WHERE canary_version = $1`,
    [CUBE_CANARY_VERSION],
  );
  const rows = [];
  const defects = [];
  for (const spec of SPECS) {
    const source = await one(
      client,
      `SELECT count(*)::int AS rows
       FROM ${quoteIdent(SOURCE_SCHEMA)}.projection_rows
       WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3
         AND projection_namespace=$4 AND projection_name=$5`,
      [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, spec.namespace, spec.name],
    );
    const target = await tableExists(client, spec.table)
      ? await one(client, `SELECT count(*)::int AS rows FROM ${quoteIdent(CANARY_SCHEMA)}.${quoteIdent(spec.table)} WHERE tenant_key=$1`, [TENANT_KEY])
      : { rows: 0 };
    const skyharborRows = await tableExists(client, spec.table)
      ? await one(client, `SELECT count(*)::int AS rows FROM ${quoteIdent(CANARY_SCHEMA)}.${quoteIdent(spec.table)} WHERE tenant_key LIKE 'skyharbor%'`, [])
      : { rows: 0 };
    if (Number(source.rows) <= 0) defects.push(`source_projection_empty:${spec.namespace}.${spec.name}`);
    if (requireCanaryExactMatch && Number(source.rows) !== Number(target.rows)) defects.push(`canary_row_count_mismatch:${spec.table}:${source.rows}:${target.rows}`);
    if (Number(skyharborRows.rows) !== 0) defects.push(`skyharbor_rows_present:${spec.table}:${skyharborRows.rows}`);
    rows.push({
      table: spec.table,
      projection_namespace: spec.namespace,
      projection_name: spec.name,
      business_grain: spec.grain,
      source_projection_rows: Number(source.rows),
      canary_rows: Number(target.rows),
      skyharbor_rows: Number(skyharborRows.rows),
    });
  }
  const afterSkyHarbor = await readSkyHarborCounts(client);
  if (beforeSkyHarbor && stableJson(beforeSkyHarbor) !== stableJson(afterSkyHarbor)) {
    defects.push("skyharbor_v4_counts_changed_during_meridian_health_layer5_apply");
  }
  if (requireCanaryExactMatch && (!authority || Number(authority.typed_table_count) !== SPECS.length)) {
    defects.push("cube_canary_authority_missing_or_incomplete");
  }

  const preflightReady = rows.every((row) => row.source_projection_rows > 0);
  const exactMatch = requireCanaryExactMatch
    ? defects.length === 0 && rows.every((row) => row.source_projection_rows === row.canary_rows)
    : false;
  return manifest(
    requireCanaryExactMatch && exactMatch
      ? "MERIDIAN_HEALTH_DEMO_LAYER5_CUBE_CANARY_VERIFIED"
      : preflightReady && !requireCanaryExactMatch
        ? "MERIDIAN_HEALTH_DEMO_LAYER5_CUBE_CANARY_PREFLIGHT_PASSED"
        : "MERIDIAN_HEALTH_DEMO_LAYER5_CUBE_CANARY_BLOCKED",
    {
      verification_mode: mode,
      mutation_executed: mutationExecuted,
      readback_verification_executed: readbackVerificationExecuted,
      preflight_ready: preflightReady,
      canary_schema: CANARY_SCHEMA,
      canary_version: CUBE_CANARY_VERSION,
      typed_table_count: SPECS.length,
      typed_table_summaries: rows,
      skyharbor_v4_counts_before: beforeSkyHarbor,
      skyharbor_v4_counts_after: afterSkyHarbor,
      exact_match: exactMatch,
      defects,
      traffic_shift_executed: false,
    },
  );
}

async function readSkyHarborCounts(client) {
  const exists = await schemaExists(client, "consumption_v4_canary");
  if (!exists) return { available: false };
  const contracts = await one(client, "SELECT count(*)::int AS rows, coalesce(sum(annual_value),0)::numeric AS annual_value FROM consumption_v4_canary.sourcing_contract_v1 WHERE tenant_key = 'skyharbor_global'");
  const vendors = await one(client, "SELECT count(*)::int AS rows, coalesce(sum(contract_count),0)::int AS contract_count FROM consumption_v4_canary.sourcing_vendor_v1 WHERE tenant_key = 'skyharbor_global'");
  const scope = await one(client, "SELECT count(*)::int AS rows FROM consumption_v4_canary.sourcing_contract_scope_v1 WHERE tenant_key = 'skyharbor_global'");
  const spend = await one(client, "SELECT coalesce(sum(invoice_lines),0)::int AS invoice_lines, coalesce(sum(actual_spend),0)::numeric AS actual_spend FROM consumption_v4_canary.sourcing_spend_monthly_v1 WHERE tenant_key = 'skyharbor_global'");
  const performance = await one(client, "SELECT count(*)::int AS rows, coalesce(sum(credit_calculated),0)::numeric AS credit_calculated FROM consumption_v4_canary.sourcing_performance_v1 WHERE tenant_key = 'skyharbor_global'");
  return { available: true, contracts, vendors, scope, spend, performance };
}

async function schemaExists(client, schema) {
  const result = await one(client, "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name=$1) AS exists", [schema]);
  return result.exists === true;
}

async function tableExists(client, table) {
  const result = await one(
    client,
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2) AS exists",
    [CANARY_SCHEMA, table],
  );
  return result.exists === true;
}

async function one(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0] || {};
}

async function maybeOne(client, sql, params = []) {
  const result = await client.query(sql, params).catch(() => ({ rows: [] }));
  return result.rows[0] || null;
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/gu, '""')}"`;
}

function manifest(status, extra = {}) {
  return {
    status,
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    source_projection_version: PROJECTION_VERSION,
    ...extra,
  };
}

function writeProofSet(result) {
  writeJson(proofRef(args.outDir, "MERIDIAN_HEALTH_LAYER5_CUBE_CANARY.json"), result);
  writeCsv(
    proofRef(args.outDir, "MERIDIAN_HEALTH_LAYER5_CUBE_CANARY_TABLES.csv"),
    ["table", "projection_namespace", "projection_name", "business_grain", "source_projection_rows", "canary_rows", "skyharbor_rows"],
    result.typed_table_summaries || [],
  );
  writeJson(proofRef(args.outDir, "MERIDIAN_HEALTH_LAYER5_CUBE_CANARY_SIGNATURE.json"), {
    status: result.status,
    result_sha256: sha256(stableJson(result)),
    generated_at: result.generated_at,
  });
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle || process.env.MERIDIAN_HEALTH_LAYER5_CUBE_CANARY_EMIT_PROOF_BUNDLE === "true") {
    emitProofBundle(args.outDir, {
      status: "MERIDIAN_HEALTH_DEMO_LAYER5_CUBE_CANARY_PROOF_BUNDLE",
      generated_at: new Date().toISOString(),
      proof_root: path.join(args.outDir, "proof"),
    });
  }
}
