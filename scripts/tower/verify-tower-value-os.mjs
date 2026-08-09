#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import JSZip from "jszip";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

const SEALED_BASE_MIGRATION_NAME = "20260809150000_tower_value_operating_system_v1.sql";
const MIGRATION_NAME = "20260809193000_tower_value_os_semantic_remediation_v1.sql";
const MIGRATION_PATH = path.join(process.cwd(), "supabase", "migrations", MIGRATION_NAME);
const SEALED_BASE_MIGRATION_PATH = path.join(process.cwd(), "supabase", "migrations", SEALED_BASE_MIGRATION_NAME);
const READER_PATH = path.join(process.cwd(), "src", "lib", "tower", "readTowerCommandCenter.ts");
const DEFAULT_TENANTS = ["skyharbor_global", "meridian_health_global"];
const TABLES = [
  "tower.value_case",
  "tower.value_case_period",
  "tower.subject_link",
  "tower.economic_conversion",
  "tower.attestation_event",
  "tower.proof_action",
  "tower.value_case_claim_link",
  "tower.ai_identity_crosswalk",
];
const VIEWS = [
  "consumption.tower_board_posture_v1",
  "consumption.tower_value_trajectory_v1",
  "consumption.tower_portfolio_decision_v1",
  "consumption.tower_tool_productivity_v1",
  "consumption.tower_agent_outcome_v1",
  "consumption.tower_action_queue_v1",
  "consumption.tower_source_trust_v1",
];
const LIVE_BASELINE = {
  tenant_key: "skyharbor_global",
  tracked_program_subjects: 151,
  board_portfolio_programs: 40,
  ai_initiative_count: 12,
  prior_live_material_programs: 40,
  prior_live_promised_value: 1070600000,
  prior_live_finance_validated_blocked_value: 6471000,
  claimable_value: 0,
};

function parseArgs(argv) {
  const args = {
    mode: "verify",
    tenants: [],
    outDir: process.env.TOWER_VALUE_OS_OUT_DIR || "",
    emitProofBundle: process.env.TOWER_VALUE_OS_EMIT_PROOF_BUNDLE === "true",
    requireDb: process.env.TOWER_VALUE_OS_REQUIRE_DB === "true",
    skipQueryPlans: process.env.TOWER_VALUE_OS_SKIP_QUERY_PLANS === "true",
    zipPath: process.env.TOWER_VALUE_OS_ZIP_PATH || "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === "--mode") args.mode = next();
    else if (arg === "--tenant") args.tenants.push(next());
    else if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--zip-path") args.zipPath = next();
    else if (arg === "--emit-proof-bundle") args.emitProofBundle = true;
    else if (arg === "--require-db") args.requireDb = true;
    else if (arg === "--skip-query-plans") args.skipQueryPlans = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  node scripts/tower/verify-tower-value-os.mjs [--mode preflight|verify] [--tenant <tenant_key>] [options]

Options:
  --out-dir <path>         Evidence output folder.
  --zip-path <path>        Optional ZIP output path.
  --emit-proof-bundle      Emit ACA wrapper proof tarball markers.
  --require-db             Fail if no DB URL is configured or DB verification fails.
  --skip-query-plans       Skip EXPLAIN (ANALYZE, BUFFERS) readback.

Environment:
  ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!["preflight", "verify"].includes(args.mode)) {
    throw new Error(`Unsupported --mode ${args.mode}`);
  }
  if (args.tenants.length === 0) args.tenants = DEFAULT_TENANTS;
  if (!args.outDir) {
    args.outDir = path.join(os.tmpdir(), `tower-value-os-proof-${stamp()}`);
  }
  return args;
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function stripSqlComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");
}

function inspectStaticContract() {
  const migration = readText(MIGRATION_PATH);
  const sealedBaseMigration = readText(SEALED_BASE_MIGRATION_PATH);
  const reader = readText(READER_PATH);
  const stripped = stripSqlComments(migration);
  const destructivePatterns = [
    ["DROP TABLE", /\bdrop\s+table\b/i],
    ["DROP COLUMN", /\bdrop\s+column\b/i],
    ["DROP SCHEMA", /\bdrop\s+schema\b/i],
    ["ALTER TABLE DROP", /\balter\s+table\b[^;]*\bdrop\b/i],
    ["TRUNCATE", /\btruncate\b/i],
    ["DELETE", /\bdelete\s+from\b/i],
  ];
  const destructiveFindings = [];
  stripped.split(/\r?\n/).forEach((line, index) => {
    for (const [name, regex] of destructivePatterns) {
      if (name === "ALTER TABLE DROP" && /\bdrop\s+not\s+null\b/i.test(line)) continue;
      if (regex.test(line)) {
        destructiveFindings.push({ pattern: name, line: index + 1, snippet: line.trim().slice(0, 220) });
      }
    }
  });

  return {
    checked_at: new Date().toISOString(),
    migration_name: MIGRATION_NAME,
    migration_sha256: sha256(migration),
    migration_bytes: Buffer.byteLength(migration, "utf8"),
    sealed_base_migration_name: SEALED_BASE_MIGRATION_NAME,
    sealed_base_migration_sha256: sha256(sealedBaseMigration),
    contract_tables_present: TABLES.map((object_name) => ({ object_name, present: migration.includes(object_name) })),
    contract_views_present: VIEWS.map((object_name) => ({ object_name, present: migration.includes(object_name) })),
    additive_safety: {
      status: destructiveFindings.length === 0 ? "PASS" : "FAIL",
      destructive_findings: destructiveFindings,
    },
    reader_contract: {
      reads_consumption_views_only: VIEWS.every((view) => reader.includes(view)),
      retired_cio_mart_sql_dependency: /(?:from|join)\s+cio_tower\.mart/i.test(reader),
      meridian_canary_dependency: /foundation_v2_meridian_health_cube_canary/i.test(reader),
    },
    required_semantic_columns: [
      "semantic_remediation_v1",
      "value_case_claim_link",
      "ai_identity_crosswalk",
      "source_count",
      "economic_classification",
      "board_scope_state",
      "material_scope_state",
      "total_program_subject_count",
      "remaining_commitment_usd",
      "risk_adjusted_forecast_usd",
      "finance_validated_run_rate_usd",
      "realized_p_and_l_usd",
      "realized_cash_usd",
      "forecast_at_completion_usd",
      "reported_usage_rate_pct",
      "calculated_usage_rate_pct",
      "usage_rate_variance_pct",
      "usage_rate_quality_state",
      "effective_usage_rate_pct",
    ].map((column) => ({ column, present: migration.includes(column) })),
  };
}

function resolveDatabaseUrl() {
  return process.env.ABARVA_AZURE_DATABASE_URL || process.env.AZURE_DATABASE_URL || process.env.DATABASE_URL || "";
}

function clientOptions(connectionString) {
  return {
    connectionString,
    application_name: "tower-value-os-readonly-verifier",
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 30000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 30000),
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  };
}

function normalizeValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]));
  }
  return value;
}

function normalizeRows(rows) {
  return rows.map((row) => normalizeValue(row));
}

function squeezeSql(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

async function safeQuery(client, queryLog, label, sql, params = []) {
  const started = Date.now();
  const entry = { label, sql: squeezeSql(sql), params, status: "pending", duration_ms: 0 };
  queryLog.push(entry);
  try {
    const result = await client.query(sql, params);
    entry.status = "ok";
    entry.row_count = result.rowCount;
    entry.duration_ms = Date.now() - started;
    return { ok: true, rows: normalizeRows(result.rows), rowCount: result.rowCount };
  } catch (error) {
    entry.status = "error";
    entry.error = error.message;
    entry.duration_ms = Date.now() - started;
    return { ok: false, error: error.message, rows: [] };
  }
}

function relationRegclassList(objects) {
  return objects.map((objectName) => `('${objectName}')`).join(",");
}

async function inspectRuntime(client, tenants, skipQueryPlans) {
  const queryLog = [];
  const runtime = {};

  runtime.identity = await safeQuery(
    client,
    queryLog,
    "runtime_identity",
    `
      SELECT
        current_database() AS database_name,
        current_user AS user_name,
        session_user AS session_user_name,
        inet_server_addr()::text AS server_addr,
        inet_server_port()::text AS server_port,
        current_setting('app.tenant_key', true) AS tenant_setting,
        version() AS postgres_version
    `,
  );

  runtime.migrationLedger = await safeQuery(
    client,
    queryLog,
    "migration_ledger",
    `
      SELECT name, sha256, applied_at::text
      FROM schema_migrations
      WHERE name = $1
      ORDER BY applied_at DESC
    `,
    [MIGRATION_NAME],
  );

  runtime.objects = await safeQuery(
    client,
    queryLog,
    "runtime_objects",
    `
      WITH expected(object_name) AS (
        VALUES ${relationRegclassList([...TABLES, ...VIEWS, "consumption.tower_metric_observation_deduped_v1"])}
      )
      SELECT object_name, to_regclass(object_name) IS NOT NULL AS exists
      FROM expected
      ORDER BY object_name
    `,
  );

  runtime.viewCounts = {};
  runtime.tenantReads = {};
  runtime.rlsIsolation = {};
  runtime.queryPlans = {};
  runtime.dataQuality = {};

  for (const tenant of tenants) {
    await safeQuery(client, queryLog, `set_tenant_${tenant}`, "SELECT set_config('app.tenant_key', $1, false)", [tenant]);
    runtime.viewCounts[tenant] = {};
    for (const view of VIEWS) {
      runtime.viewCounts[tenant][view] = await safeQuery(
        client,
        queryLog,
        `count_${tenant}_${view}`,
        `SELECT count(*)::int AS row_count FROM ${view} WHERE tenant_key = $1`,
        [tenant],
      );
    }

    runtime.tenantReads[tenant] = await tenantReadback(client, queryLog, tenant);
    runtime.rlsIsolation[tenant] = await isolationProbe(client, queryLog, tenant);
    runtime.dataQuality[tenant] = await dataQualityControls(client, queryLog, tenant);

    if (!skipQueryPlans) {
      runtime.queryPlans[tenant] = {};
      for (const view of VIEWS) {
        runtime.queryPlans[tenant][view] = await safeQuery(
          client,
          queryLog,
          `explain_${tenant}_${view}`,
          `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT * FROM ${view} WHERE tenant_key = $1 LIMIT 100`,
          [tenant],
        );
      }
    }
  }

  runtime.queryLog = queryLog;
  return runtime;
}

async function tenantReadback(client, queryLog, tenant) {
  const readback = {};
  readback.boardPosture = await safeQuery(client, queryLog, `board_posture_${tenant}`, "SELECT * FROM consumption.tower_board_posture_v1 WHERE tenant_key = $1 LIMIT 1", [tenant]);
  readback.valueCases = await safeQuery(
    client,
    queryLog,
    `value_cases_${tenant}`,
    `
      SELECT
        tenant_key,
        value_case_id,
        semantic_version,
        value_case_group_key,
        primary_claim_id,
        initiative_id,
        program_id,
        business_process_ref,
        business_unit,
        owner_role,
        finance_owner_role,
        value_archetype,
        benefit_category,
        economic_classification,
        economic_classification_state,
        active_scope_state,
        material_scope_state,
        board_scope_state,
        approved_funding_usd,
        actual_spend_usd,
        business_case_value_usd AS promised_value_usd,
        value_period_start::text,
        value_period_end::text,
        known_calculated_value_usd,
        finance_validated_value_usd,
        claimable_value_usd,
        claim_state,
        investment_evidence_state,
        usage_evidence_state,
        operational_outcome_evidence_state,
        financial_conversion_evidence_state,
        finance_attestation_state,
        source_trust_state,
        source_count,
        lineage_state,
        dataset_version,
        source_run_id,
        source_refs,
        claim_ids,
        claim_count,
        next_required_extract
      FROM tower.value_case
      WHERE tenant_key = $1
        AND semantic_version = 'semantic_remediation_v1'
      ORDER BY value_case_id
    `,
    [tenant],
  );
  readback.portfolioDecision = await safeQuery(client, queryLog, `portfolio_decision_${tenant}`, "SELECT * FROM consumption.tower_portfolio_decision_v1 WHERE tenant_key = $1 ORDER BY promised_value_usd DESC NULLS LAST, decision_ref LIMIT 500", [tenant]);
  readback.toolProductivity = await safeQuery(client, queryLog, `tool_productivity_${tenant}`, "SELECT * FROM consumption.tower_tool_productivity_v1 WHERE tenant_key = $1 ORDER BY ai_tagged_spend_usd DESC NULLS LAST, item_name LIMIT 500", [tenant]);
  readback.agentOutcome = await safeQuery(client, queryLog, `agent_outcome_${tenant}`, "SELECT * FROM consumption.tower_agent_outcome_v1 WHERE tenant_key = $1 ORDER BY promised_value_usd DESC NULLS LAST, item_name LIMIT 500", [tenant]);
  readback.actionQueue = await safeQuery(client, queryLog, `action_queue_${tenant}`, "SELECT * FROM consumption.tower_action_queue_v1 WHERE tenant_key = $1 ORDER BY sequence LIMIT 500", [tenant]);
  readback.sourceTrust = await safeQuery(client, queryLog, `source_trust_${tenant}`, "SELECT * FROM consumption.tower_source_trust_v1 WHERE tenant_key = $1 ORDER BY lineage_key LIMIT 500", [tenant]);
  readback.identityCrosswalk = await safeQuery(
    client,
    queryLog,
    `identity_crosswalk_${tenant}`,
    `
      SELECT
        sl.tenant_key,
        sl.link_type,
        sl.from_subject_kind,
        sl.from_subject_ref,
        sl.to_subject_kind,
        sl.to_subject_ref,
        sl.to_value_case_id AS value_case_id,
        vc.initiative_id,
        vc.program_id,
        vc.cost_center_ref,
        vc.value_archetype,
        vc.benefit_category,
        sl.source_trust_state,
        sl.confidence,
        sl.review_state
      FROM tower.subject_link sl
      LEFT JOIN tower.value_case vc
        ON vc.tenant_key = sl.tenant_key
       AND vc.value_case_id = sl.to_value_case_id
      WHERE sl.tenant_key = $1
        AND sl.semantic_version = 'semantic_remediation_v1'
      ORDER BY sl.link_type, sl.from_subject_ref, sl.subject_link_id
    `,
    [tenant],
  );
  readback.aiIdentityCrosswalk = await safeQuery(
    client,
    queryLog,
    `ai_identity_crosswalk_${tenant}`,
    `
      SELECT
        tenant_key,
        ai_subject_ref,
        ai_subject_kind,
        tool_ref,
        agent_ref,
        target_initiative_ref,
        target_program_ref,
        business_process_ref,
        cohort_ref,
        cost_center_ref,
        project_code_ref,
        value_case_id,
        identity_state,
        issue,
        source_refs
      FROM tower.ai_identity_crosswalk
      WHERE tenant_key = $1
        AND semantic_version = 'semantic_remediation_v1'
      ORDER BY identity_state, ai_subject_ref
    `,
    [tenant],
  );
  return readback;
}

async function isolationProbe(client, queryLog, tenant) {
  const currentRoleProbe = {};
  for (const view of VIEWS) {
    currentRoleProbe[view] = await safeQuery(
      client,
      queryLog,
      `isolation_current_role_${tenant}_${view}`,
      `
        SELECT
          count(*)::int AS visible_rows,
          count(*) FILTER (WHERE tenant_key <> $1)::int AS cross_tenant_rows
        FROM ${view}
      `,
      [tenant],
    );
  }

  const authenticatedRoleProbe = {};
  let authenticatedRoleState = "not_attempted";
  for (const view of VIEWS) {
    await client.query("BEGIN READ ONLY");
    try {
      await client.query("SET LOCAL ROLE authenticated");
      await client.query("SELECT set_config('app.tenant_key', $1, true)", [tenant]);
      const result = await safeQuery(
        client,
        queryLog,
        `isolation_authenticated_role_${tenant}_${view}`,
        `
          SELECT
            current_user AS effective_user,
            count(*)::int AS visible_rows,
            count(*) FILTER (WHERE tenant_key <> $1)::int AS cross_tenant_rows
          FROM ${view}
        `,
        [tenant],
      );
      authenticatedRoleProbe[view] = result;
      authenticatedRoleState = "attempted";
      await client.query("ROLLBACK");
    } catch (error) {
      authenticatedRoleProbe[view] = { ok: false, error: error.message, rows: [] };
      authenticatedRoleState = "blocked_by_role_permissions";
      await client.query("ROLLBACK").catch(() => {});
      break;
    }
  }

  return {
    tenant_key: tenant,
    current_role_probe: currentRoleProbe,
    authenticated_role_state: authenticatedRoleState,
    authenticated_role_probe: authenticatedRoleProbe,
    caveat:
      authenticatedRoleState === "attempted"
        ? "Authenticated role tenant isolation was probed with app.tenant_key."
        : "Current connection could not SET ROLE authenticated; service/admin readback cannot by itself prove runtime RLS.",
  };
}

async function dataQualityControls(client, queryLog, tenant) {
  const controls = {};
  controls.activeUsersOverLicensed = await safeQuery(
    client,
    queryLog,
    `dq_active_gt_licensed_${tenant}`,
    `
      SELECT *
      FROM consumption.tower_tool_productivity_v1
      WHERE tenant_key = $1
        AND usage_rate_quality_state = 'active_exceeds_licensed'
      ORDER BY item_name
    `,
    [tenant],
  );
  controls.usageRateVariance = await safeQuery(
    client,
    queryLog,
    `dq_usage_variance_${tenant}`,
    `
      SELECT
        ai_portfolio_key,
        item_name,
        reported_usage_rate_pct,
        calculated_usage_rate_pct,
        usage_rate_variance_pct,
        usage_rate_quality_state
      FROM consumption.tower_tool_productivity_v1
      WHERE tenant_key = $1
        AND usage_rate_quality_state <> 'reconciled'
      ORDER BY usage_rate_variance_pct DESC NULLS LAST, item_name
    `,
    [tenant],
  );
  controls.duplicateDeclaredObservationGrain = await safeQuery(
    client,
    queryLog,
    `dq_duplicate_observation_grain_${tenant}`,
    `
      SELECT
        tenant_key,
        subject_ref,
        metric_ref,
        scenario,
        period_start::text,
        period_end::text,
        coalesce(cohort_ref, '') AS cohort_ref,
        count(*)::int AS raw_record_count
      FROM tower.metric_observation
      WHERE tenant_key = $1
      GROUP BY tenant_key, subject_ref, metric_ref, scenario, period_start, period_end, coalesce(cohort_ref, ''), coalesce(dimension_json::text, '{}')
      HAVING count(*) > 1
      ORDER BY raw_record_count DESC, subject_ref, metric_ref
      LIMIT 500
    `,
    [tenant],
  );
  controls.dedupedProjectionResidualDuplicates = await safeQuery(
    client,
    queryLog,
    `dq_deduped_projection_residual_${tenant}`,
    `
      SELECT count(*)::int AS residual_duplicate_groups
      FROM (
        SELECT tenant_key, subject_ref, metric_ref, scenario, period_start, period_end, coalesce(cohort_ref, '') AS cohort_ref, coalesce(dimension_json::text, '{}') AS dimension_key
        FROM consumption.tower_metric_observation_deduped_v1
        WHERE tenant_key = $1
        GROUP BY tenant_key, subject_ref, metric_ref, scenario, period_start, period_end, coalesce(cohort_ref, ''), coalesce(dimension_json::text, '{}')
        HAVING count(*) > 1
      ) residual
    `,
    [tenant],
  );
  controls.missingInitiativeIds = await safeQuery(client, queryLog, `dq_missing_initiative_${tenant}`, "SELECT value_case_id, value_case_name, program_id FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND nullif(initiative_id, '') IS NULL ORDER BY value_case_id", [tenant]);
  controls.economicClassificationReview = await safeQuery(client, queryLog, `dq_economic_classification_${tenant}`, "SELECT value_case_id, value_case_name, initiative_id, program_id, approved_funding_usd, business_case_value_usd FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND board_scope_state = 'board_portfolio' AND economic_classification IS NULL ORDER BY approved_funding_usd DESC NULLS LAST, value_case_id", [tenant]);
  controls.missingBenefitValueCaseIds = await safeQuery(client, queryLog, `dq_missing_benefit_${tenant}`, "SELECT value_case_id, value_case_name, initiative_id, program_id, source_trust_state, source_count FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND board_scope_state = 'board_portfolio' AND business_case_value_usd IS NULL ORDER BY approved_funding_usd DESC NULLS LAST, value_case_id", [tenant]);
  controls.missingBaselineTargetActual = await safeQuery(client, queryLog, `dq_missing_bta_${tenant}`, "SELECT value_case_id, value_case_name, initiative_id, program_id, operational_outcome_evidence_state FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND operational_outcome_evidence_state <> 'present' ORDER BY approved_funding_usd DESC NULLS LAST, value_case_id", [tenant]);
  controls.measuredValueWithoutEvidence = await safeQuery(client, queryLog, `dq_measured_without_evidence_${tenant}`, "SELECT value_case_id, value_case_name, known_calculated_value_usd, financial_conversion_evidence_state FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND known_calculated_value_usd IS NOT NULL AND financial_conversion_evidence_state <> 'present' ORDER BY known_calculated_value_usd DESC NULLS LAST", [tenant]);
  controls.financeValidationWithoutAttestation = await safeQuery(client, queryLog, `dq_finance_without_attestation_${tenant}`, "SELECT value_case_id, value_case_name, finance_validated_value_usd, finance_attestation_state FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND finance_validated_value_usd > 0 AND finance_attestation_state <> 'present' ORDER BY finance_validated_value_usd DESC", [tenant]);
  controls.conflictingPromisedValue = await safeQuery(client, queryLog, `dq_conflicting_promised_${tenant}`, "SELECT value_case_id, value_case_name, business_case_value_usd, source_trust_state, source_count, source_refs, source_assertion_values FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND source_trust_state = 'CONFLICT' ORDER BY business_case_value_usd DESC NULLS LAST", [tenant]);
  controls.invalidConflictSourceCount = await safeQuery(client, queryLog, `dq_invalid_conflict_source_count_${tenant}`, "SELECT value_case_id, value_case_name, source_trust_state, source_count FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND source_trust_state = 'CONFLICT' AND source_count < 2 ORDER BY value_case_id", [tenant]);
  controls.valueCaseGrouping = await safeQuery(client, queryLog, `dq_value_case_grouping_${tenant}`, "SELECT value_case_group_key, count(*)::int AS value_case_rows, sum(claim_count)::int AS linked_claims FROM tower.value_case WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' GROUP BY value_case_group_key HAVING count(*) > 1 ORDER BY value_case_rows DESC, value_case_group_key", [tenant]);
  controls.aiIdentityTargets = await safeQuery(client, queryLog, `dq_ai_identity_targets_${tenant}`, "SELECT * FROM tower.ai_identity_crosswalk WHERE tenant_key = $1 AND semantic_version = 'semantic_remediation_v1' AND identity_state <> 'ready' ORDER BY identity_state, ai_subject_ref", [tenant]);
  controls.actionsMissingOwnerDueEvidence = await safeQuery(
    client,
    queryLog,
    `dq_actions_missing_owner_due_evidence_${tenant}`,
    `
      SELECT action_key, title, owner_role, due_date, evidence_package_id, blocked_decision
      FROM consumption.tower_action_queue_v1
      WHERE tenant_key = $1
        AND (
          nullif(owner_role, '') IS NULL
          OR due_date IS NULL
          OR nullif(evidence_package_id, '') IS NULL
          OR nullif(blocked_decision, '') IS NULL
        )
      ORDER BY sequence
    `,
    [tenant],
  );
  controls.proofActionDeduplication = await safeQuery(
    client,
    queryLog,
    `dq_proof_action_dedupe_${tenant}`,
    `
      SELECT value_case_id, proof_stage, blocked_decision, evidence_requirement, count(*)::int AS action_count
      FROM tower.proof_action
      WHERE tenant_key = $1
        AND semantic_version = 'semantic_remediation_v1'
      GROUP BY value_case_id, proof_stage, blocked_decision, evidence_requirement
      HAVING count(*) > 1
      ORDER BY action_count DESC, value_case_id, proof_stage
    `,
    [tenant],
  );
  controls.eightQuarterCoverage = await safeQuery(
    client,
    queryLog,
    `dq_eight_quarter_coverage_${tenant}`,
    `
      SELECT
        vc.value_case_id,
        vc.value_case_name,
        count(p.*)::int AS period_count,
        min(p.period_start)::text AS first_period_start,
        max(p.period_end)::text AS last_period_end
      FROM tower.value_case vc
      LEFT JOIN tower.value_case_period p
        ON p.tenant_key = vc.tenant_key
       AND p.value_case_id = vc.value_case_id
       AND p.semantic_version = 'semantic_remediation_v1'
      WHERE vc.tenant_key = $1
        AND vc.semantic_version = 'semantic_remediation_v1'
      GROUP BY vc.value_case_id, vc.value_case_name
      HAVING count(p.*) <> 8
      ORDER BY period_count, vc.value_case_id
    `,
    [tenant],
  );
  controls.sourceTrustTrail = await safeQuery(
    client,
    queryLog,
    `dq_source_trust_trail_${tenant}`,
    `
      SELECT lineage_state, resolution_state, count(*)::int AS row_count
      FROM consumption.tower_source_trust_v1
      WHERE tenant_key = $1
      GROUP BY lineage_state, resolution_state
      ORDER BY lineage_state, resolution_state
    `,
    [tenant],
  );
  return controls;
}

function firstRow(result) {
  return result?.ok ? result.rows[0] || null : null;
}

function numberish(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeReconciliation(runtime) {
  const tenants = {};
  for (const [tenant, readback] of Object.entries(runtime.tenantReads || {})) {
    const board = firstRow(readback.boardPosture);
    tenants[tenant] = {
      board_posture: board,
      observed_counts: {
        board_portfolio_programs: numberish(board?.board_scope_program_count ?? board?.program_count),
        material_programs: numberish(board?.material_program_count),
        tracked_program_subjects: numberish(board?.total_program_subject_count),
        active_program_subjects: numberish(board?.active_program_subject_count),
        ai_initiatives: numberish(board?.ai_initiative_count),
        grouped_value_cases: numberish(board?.value_claim_count),
        known_value_cases: numberish(board?.known_value_claim_count),
        unknown_value_cases: numberish(board?.unknown_value_claim_count),
        economic_review_queue: numberish(board?.economic_review_queue_count),
        approved_investment: numberish(board?.approved_program_budget_fy26),
        promised_benefit: board?.promised_value_fy26 === null || board?.promised_value_fy26 === undefined ? null : numberish(board?.promised_value_fy26),
        finance_validated_blocked_value: numberish(board?.finance_validated_blocked_value),
        claimable_value: numberish(board?.realized_value_ytd_allowed),
        tool_productivity_rows: readback.toolProductivity?.rows?.length ?? 0,
        agent_outcome_rows: readback.agentOutcome?.rows?.length ?? 0,
        ai_identity_rows: readback.aiIdentityCrosswalk?.rows?.length ?? 0,
        open_proof_actions: readback.actionQueue?.rows?.length ?? 0,
      },
      live_baseline_reconciliation:
        tenant === LIVE_BASELINE.tenant_key
          ? Object.fromEntries(
              Object.entries(LIVE_BASELINE)
                .filter(([key]) => key !== "tenant_key")
                .map(([key, expected]) => {
                  const observed = {
                    tracked_program_subjects: numberish(board?.total_program_subject_count),
                    board_portfolio_programs: numberish(board?.board_scope_program_count ?? board?.program_count),
                    ai_initiative_count: numberish(board?.ai_initiative_count),
                    prior_live_material_programs: numberish(board?.material_program_count),
                    prior_live_promised_value: numberish(board?.promised_value_fy26),
                    prior_live_finance_validated_blocked_value: numberish(board?.finance_validated_blocked_value),
                    claimable_value: numberish(board?.realized_value_ytd_allowed),
                  }[key];
                  return [key, { expected, observed, delta: numberish(observed) - numberish(expected) }];
                }),
            )
          : null,
    };
  }
  return {
    generated_at: new Date().toISOString(),
    basis: "Read-only verifier over tower.value_case and consumption.tower_*_v1. No data mutation.",
    tenants,
    dry_run_package_difference_hypotheses: [
      "dataset_version_or_source_release_mismatch",
      "scope_difference_between_live_board_projection_and_dry_run_package",
      "time_horizon_difference",
      "value_definition_difference_between_promised_exposure_and_measured_or_finance_validated_value",
      "duplicate_observation_grain_in_raw_sources",
      "source_authority_conflicts_or_stale_projection_code",
    ],
  };
}

function buildCoverageRows(runtime) {
  const rows = [];
  for (const readback of Object.values(runtime.tenantReads || {})) {
    for (const row of readback.valueCases?.rows || []) {
      rows.push({
        initiative_id: row.initiative_id,
        value_case_id: row.value_case_id,
        value_archetype: row.value_archetype,
        economic_classification: row.economic_classification,
        board_scope_state: row.board_scope_state,
        investment_evidence: row.investment_evidence_state,
        usage_evidence: row.usage_evidence_state,
        operational_outcome_evidence: row.operational_outcome_evidence_state,
        financial_conversion_evidence: row.financial_conversion_evidence_state,
        finance_attestation: row.finance_attestation_state,
        time_series_coverage: "eight_quarter_schedule_required",
        source_trust_state: row.source_trust_state,
        source_count: row.source_count,
        next_required_extract: row.next_required_extract,
      });
    }
  }
  return rows;
}

function collectSemanticGateFailures(runtime) {
  const failures = [];
  for (const [tenant, controls] of Object.entries(runtime?.dataQuality || {})) {
    const invalidConflicts = controls.invalidConflictSourceCount?.rows || [];
    if (invalidConflicts.length > 0) {
      failures.push({
        tenant,
        gate: "source_trust_conflict_requires_two_sources",
        row_count: invalidConflicts.length,
      });
    }
    const duplicateActions = controls.proofActionDeduplication?.rows || [];
    if (duplicateActions.length > 0) {
      failures.push({
        tenant,
        gate: "proof_actions_deduped_by_value_case_stage_decision_evidence",
        row_count: duplicateActions.length,
      });
    }
    const badReadyIdentity = (controls.aiIdentityTargets?.rows || []).filter(
      (row) => row.identity_state === "ready",
    );
    if (badReadyIdentity.length > 0) {
      failures.push({
        tenant,
        gate: "ai_identity_ready_rows_target_governed_entities",
        row_count: badReadyIdentity.length,
      });
    }
  }
  return failures;
}

function toCsv(rows) {
  if (!rows.length) return "initiative_id,value_case_id,value_archetype,investment_evidence,usage_evidence,operational_outcome_evidence,financial_conversion_evidence,finance_attestation,time_series_coverage,source_trust_state,next_required_extract\n";
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n")}\n`;
}

function buildMarkdown(staticContract, runtime, reconciliation) {
  const identity = firstRow(runtime?.identity);
  const ledger = firstRow(runtime?.migrationLedger);
  const sky = reconciliation.tenants?.skyharbor_global;
  const meridian = reconciliation.tenants?.meridian_health_global;
  const status = staticContract.additive_safety.status === "PASS" && ledger ? "READBACK AVAILABLE" : "PREFLIGHT ONLY OR BLOCKED";
  return `# Tower Live Value Reconciliation

Generated: ${new Date().toISOString()}

Status: ${status}

## Runtime Path

- Migration: ${staticContract.migration_name}
- Migration SHA-256: ${staticContract.migration_sha256}
- Database: ${identity?.database_name ?? "not connected"}
- User: ${identity?.user_name ?? "not connected"}
- Server: ${identity?.server_addr ?? "not connected"}
- Ledger row: ${ledger ? `${ledger.name} / ${ledger.sha256}` : "not found"}
- Runtime authority: tower.value_case -> consumption.tower_*_v1 -> thin Tower reader

## Static Gate

- Additive safety: ${staticContract.additive_safety.status}
- Retired cio_tower mart SQL dependency: ${staticContract.reader_contract.retired_cio_mart_sql_dependency ? "present" : "absent"}
- Meridian canary dependency: ${staticContract.reader_contract.meridian_canary_dependency ? "present" : "absent"}
- Seven governed consumption views required by the reader: ${staticContract.reader_contract.reads_consumption_views_only ? "present" : "missing"}

## SkyHarbor Reconciliation

${sky ? renderTenantSummary("skyharbor_global", sky) : "No SkyHarbor readback rows were available."}

## Meridian Isolation / Missing Evidence

${meridian ? renderTenantSummary("meridian_health_global", meridian) : "No Meridian readback rows were available."}

## CFO Interpretation

Tower is now designed to be a value operating system, not a chart layer. The board story should unfold from approved investment, to explicit promised benefit, to adoption, to operating outcomes, to economic classification, to explicit financial conversion, to Finance attestation. Approved funding is investment; it is not promised benefit. Missing benefit and outcome values remain null, and source trust follows source-count rules instead of claim state.

## Remaining Acceptance Gates

- Private operator migration apply must pass before this branch's web reader is deployed anywhere.
- Independent reader verification must show all seven consumption views populated for SkyHarbor.
- Authenticated-role RLS proof must show no cross-tenant rows for SkyHarbor or Meridian.
- Signed-in CFO canary screenshots must be captured after DB verification and before shared traffic movement.
`;
}

function renderTenantSummary(tenant, summary) {
  const counts = summary.observed_counts || {};
  const baseline = summary.live_baseline_reconciliation;
  const lines = [
    `Tenant: ${tenant}`,
    "",
    `- Tracked program subjects: ${counts.tracked_program_subjects}`,
    `- Active program subjects: ${counts.active_program_subjects}`,
    `- Material programs: ${counts.material_programs}`,
    `- Board portfolio programs: ${counts.board_portfolio_programs}`,
    `- AI initiatives: ${counts.ai_initiatives}`,
    `- Grouped value cases: ${counts.grouped_value_cases}`,
    `- Known value cases: ${counts.known_value_cases}`,
    `- Unknown value cases: ${counts.unknown_value_cases}`,
    `- Economic review queue: ${counts.economic_review_queue}`,
    `- Approved investment: ${counts.approved_investment}`,
    `- Promised benefit: ${counts.promised_benefit === null ? "null" : counts.promised_benefit}`,
    `- Finance validated blocked value: ${counts.finance_validated_blocked_value}`,
    `- Claimable value: ${counts.claimable_value}`,
    `- Tool productivity rows: ${counts.tool_productivity_rows}`,
    `- Agent outcome rows: ${counts.agent_outcome_rows}`,
    `- AI identity rows: ${counts.ai_identity_rows}`,
    `- Open proof actions: ${counts.open_proof_actions}`,
  ];
  if (baseline) {
    lines.push("", "Baseline deltas:");
    for (const [key, value] of Object.entries(baseline)) {
      lines.push(`- ${key}: observed ${value.observed}, expected ${value.expected}, delta ${value.delta}`);
    }
  }
  return lines.join("\n");
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function zipDirectory(sourceDir, zipPath) {
  const zip = new JSZip();
  function addDir(dir, prefix = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(prefix, entry.name);
      if (fullPath === zipPath) continue;
      if (entry.isDirectory()) addDir(fullPath, relPath);
      else zip.file(relPath, fs.readFileSync(fullPath));
    }
  }
  addDir(sourceDir);
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(zipPath, buffer);
}

function emitProofBundle(outDir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tower-value-os-proof-"));
  const tarPath = path.join(tmp, "proof.tgz");
  const result = spawnSync("tar", ["-czf", tarPath, "-C", outDir, "."], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`tar proof bundle failed: ${result.stderr || result.stdout || result.status}`);
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.outDir, { recursive: true });

  const staticContract = inspectStaticContract();
  let runtime = { skipped: true, reason: "mode=preflight" };
  let dbError = null;
  const dbUrl = resolveDatabaseUrl();

  if (args.mode === "verify" || args.requireDb) {
    if (!dbUrl) {
      dbError = "No ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL configured.";
    } else {
      const client = new Client(clientOptions(dbUrl));
      try {
        await client.connect();
        runtime = await inspectRuntime(client, args.tenants, args.skipQueryPlans);
      } catch (error) {
        dbError = error.message;
        runtime = { skipped: false, error: error.message };
      } finally {
        await client.end().catch(() => {});
      }
    }
  }

  const reconciliation = runtime.error || runtime.skipped ? { generated_at: new Date().toISOString(), tenants: {}, error: runtime.error, skipped: runtime.skipped, reason: runtime.reason } : summarizeReconciliation(runtime);
  const coverageRows = runtime.error || runtime.skipped ? [] : buildCoverageRows(runtime);
  const semanticGateFailures = runtime.error || runtime.skipped ? [] : collectSemanticGateFailures(runtime);
  const markdown = buildMarkdown(staticContract, runtime.skipped ? {} : runtime, reconciliation);
  const summary = {
    event: "tower_value_os_reconciliation",
    status: runtime.skipped ? "PREFLIGHT_COMPLETE" : dbError && args.requireDb ? "FAIL" : dbError ? "BLOCKED_DB_UNAVAILABLE" : semanticGateFailures.length > 0 ? "FAIL" : "COMPLETE",
    generated_at: new Date().toISOString(),
    mutation_scope: "none",
    tenants: args.tenants,
    static_contract: staticContract,
    runtime,
    reconciliation,
    semantic_gate_failures: semanticGateFailures,
    db_error: dbError,
  };

  writeJson(path.join(args.outDir, "TOWER_LIVE_VALUE_RECONCILIATION.json"), summary);
  fs.writeFileSync(path.join(args.outDir, "TOWER_LIVE_VALUE_RECONCILIATION.md"), markdown);
  fs.writeFileSync(path.join(args.outDir, "TOWER_VALUE_CASE_COVERAGE.csv"), toCsv(coverageRows));
  writeJson(path.join(args.outDir, "SANITIZED_QUERY_READBACK_LOG.json"), runtime.queryLog || []);
  writeJson(path.join(args.outDir, "MIGRATION_PREFLIGHT.json"), staticContract);

  const zipPath = args.zipPath || path.join(args.outDir, `TOWER_VALUE_OS_PRIVATE_LAB_PROOF_${stamp()}.zip`);
  await zipDirectory(args.outDir, zipPath);
  console.log(JSON.stringify({ status: summary.status, outDir: args.outDir, zipPath, dbError }, null, 2));

  if (args.emitProofBundle) emitProofBundle(args.outDir);
  if (dbError && args.requireDb) process.exit(1);
  if (semanticGateFailures.length > 0 && args.requireDb) process.exit(1);
  if (staticContract.additive_safety.status !== "PASS") process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
