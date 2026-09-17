import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import pg from "pg";
import { resolveScope, runJob, SPINE } from "../opportunity-ownership-cutover-job.mjs";
import { readOpportunityOwnershipManifest } from "../opportunity-ownership.mjs";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const ARCHIVE_MIGRATION = process.env.SOURCE_CUTOVER_ARCHIVE_MIGRATION ??
  path.join(ROOT, "supabase/migrations/20260917060000_source_opportunity_cutover_archive.sql");

function command(bin, args) {
  const result = spawnSync(bin, args, { encoding: "utf8", timeout: 60_000 });
  assert.equal(result.status, 0, `${bin} failed: ${result.stderr || result.stdout}`);
}

async function startLocalPostgres() {
  assert(fs.existsSync(ARCHIVE_MIGRATION), `Archive migration missing: ${ARCHIVE_MIGRATION}`);
  const temp = fs.mkdtempSync(path.join("/tmp", "source-cutover-pg-"));
  const data = path.join(temp, "data");
  const socket = path.join(temp, "socket");
  fs.mkdirSync(socket);
  const port = 25000 + Math.floor(Math.random() * 25000);
  try {
    command("initdb", ["-D", data, "-A", "trust", "-U", "cutover_test", "--no-instructions"]);
    command("pg_ctl", ["-D", data, "-l", path.join(temp, "postgres.log"), "-o",
      `-F -p ${port} -k ${socket} -c listen_addresses=''`, "-w", "start"]);
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }
  const pool = new pg.Pool({ host: socket, port, user: "cutover_test", database: "postgres", max: 2 });
  return { pool, socket, port, stop: async () => {
    await pool.end();
    command("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"]);
    fs.rmSync(temp, { recursive: true, force: true });
  } };
}

async function installSchema(pool) {
  await pool.query(`CREATE ROLE authenticated; CREATE ROLE service_role LOGIN;
    CREATE SCHEMA auth; CREATE SCHEMA source; CREATE SCHEMA consumption;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT 'service_role'::text $$;
    CREATE FUNCTION source.can_read_sourcing_tenant(text) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;`);
  await pool.query(fs.readFileSync(path.join(ROOT,
    "supabase/migrations/20260809143000_source_contract_optimization_opportunity_spine.sql"), "utf8"));
  const provenance = fs.readFileSync(path.join(ROOT,
    "supabase/migrations/20260914150000_source_contract_intelligence_provenance.sql"), "utf8");
  const claimDdl = provenance.slice(provenance.indexOf("CREATE TABLE IF NOT EXISTS source.opportunity_claim"),
    provenance.indexOf("CREATE INDEX IF NOT EXISTS opportunity_claim_contract_idx"));
  assert(claimDdl.includes("FOREIGN KEY"), "Opportunity claim FK missing from fixture DDL");
  await pool.query(claimDdl);
  await pool.query(fs.readFileSync(ARCHIVE_MIGRATION, "utf8"));
  await pool.query(`CREATE TABLE source.sourcing_opportunity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_key text NOT NULL,
    contract_id text, opportunity_id text NOT NULL, raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb);
    CREATE TABLE source.contract_insight (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_key text NOT NULL,
      dataset_version text NOT NULL, contract_id text NOT NULL, calculation_run_id text,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb);
    CREATE TABLE source.contract_depth_adapter_row (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_key text NOT NULL,
      dataset_version text NOT NULL, adapter_name text NOT NULL, source_row_id text NOT NULL,
      source_file_name text NOT NULL, source_hash text NOT NULL, payload jsonb NOT NULL,
      lineage jsonb NOT NULL, quality_state text NOT NULL);
    CREATE TABLE source.source_record_snapshot (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_key text NOT NULL,
      dataset_version text NOT NULL, snapshot_id text NOT NULL, source_table text NOT NULL,
      source_record_id text NOT NULL, source_record_hash text NOT NULL, contract_id text NOT NULL,
      payload jsonb NOT NULL);
    CREATE VIEW consumption.sourcing_opportunity_v1 AS
      SELECT legacy.tenant_key,legacy.opportunity_id FROM source.sourcing_opportunity legacy
      WHERE NOT EXISTS (SELECT 1 FROM source.optimization_opportunity canonical
        WHERE canonical.tenant_key=legacy.tenant_key AND canonical.opportunity_id=legacy.opportunity_id)
      UNION ALL SELECT tenant_key,opportunity_id FROM source.optimization_opportunity;`);
  for (const table of SPINE) {
    await pool.query(`ALTER TABLE source."${table}" ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "service_role_all_${table}" ON source."${table}";
      DROP POLICY IF EXISTS "authenticated_read_${table}" ON source."${table}";
      CREATE POLICY cutover_test_tenant ON source."${table}" FOR ALL TO service_role
        USING (tenant_key=current_setting('app.tenant_key',true))
        WITH CHECK (tenant_key=current_setting('app.tenant_key',true));`);
  }
  await pool.query(`GRANT USAGE ON SCHEMA source,consumption,auth TO service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA source TO service_role;
    GRANT SELECT ON ALL TABLES IN SCHEMA consumption TO service_role;`);
  const tables = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname='source' AND tablename=ANY($1::text[])`, [SPINE]);
  assert.equal(tables.rows.length, 21);
  const fks = await pool.query(`SELECT count(*)::int AS count FROM pg_constraint WHERE contype='f'
    AND conrelid IN (SELECT oid FROM pg_class WHERE relnamespace='source'::regnamespace AND relname=ANY($1::text[]))`, [SPINE]);
  assert(fks.rows[0].count >= 10, "Fixture must exercise real spine foreign keys");
}

async function insert(pool, table, fields) {
  const names = Object.keys(fields);
  const values = Object.values(fields);
  const result = await pool.query(`INSERT INTO source."${table}" (${names.map((name) => `"${name}"`).join(",")})
    VALUES (${values.map((_, index) => `$${index + 1}`).join(",")}) RETURNING id`, values);
  return result.rows[0].id;
}

async function seedFixture(pool, scope) {
  const common = { tenant_key: scope.tenantKey, dataset_version: scope.datasetVersion };
  const opportunity = "OPP-LOCAL-1";
  const contract = scope.contractId;
  const sourcePayload = { opportunity_id: opportunity, contract_id: contract };
  await insert(pool, "contract_depth_adapter_row", { ...common, adapter_name: "optimization_opportunity_adapter",
    source_row_id: opportunity, source_file_name: "optimization_opportunities.csv", source_hash: "source-hash-1",
    payload: sourcePayload, lineage: { layer: 2, package_sha256: "package-hash-1" }, quality_state: "adapter_validated" });
  await insert(pool, "source_record_snapshot", { ...common, snapshot_id: `optimization_opportunity_adapter:${opportunity}`,
    source_table: "source.contract_depth_adapter_row.optimization_opportunity_adapter",
    source_record_id: opportunity, source_record_hash: "source-hash-1", contract_id: contract, payload: sourcePayload });
  await insert(pool, "optimization_opportunity", { ...common, opportunity_id: opportunity, contract_id: contract,
    vendor_id: "V-1", value_type: "avoided_cost", stage: "signal", next_action: "Review",
    overlap_treatment: "none", approval_state: "requires_sizing", narrative: "Synthetic local test" });
  await insert(pool, "optimization_opportunity", { ...common, opportunity_id: "OPP-CONTROL", contract_id: "C-CONTROL",
    vendor_id: "V-CONTROL", value_type: "avoided_cost", stage: "signal", next_action: "Review",
    overlap_treatment: "none", approval_state: "requires_sizing", narrative: "Untouched control" });
  await insert(pool, "optimization_opportunity", { ...common, dataset_version: scope.writerDatasetVersion,
    opportunity_id: "OPP-WRITER", contract_id: contract, vendor_id: "V-1", value_type: "avoided_cost",
    stage: "signal", next_action: "Review", overlap_treatment: "none", approval_state: "requires_sizing",
    narrative: "Writer control" });
  await insert(pool, "opportunity_evidence", { ...common, opportunity_id: opportunity, evidence_class: "contract", source_system: "fixture" });
  await insert(pool, "calculation_rule", { ...common, rule_id: "RULE-1", rule_version: "1", formula: "blocked" });
  await insert(pool, "calculation_run", { ...common, calculation_run_id: "RUN-1", opportunity_id: opportunity,
    rule_id: "RULE-1", rule_version: "1", run_state: "blocked" });
  await insert(pool, "calculation_input", { ...common, calculation_run_id: "RUN-1", input_key: "input",
    inclusion_reason: "pending" });
  await insert(pool, "calculation_output", { ...common, calculation_run_id: "RUN-1", output_key: "count" });
  await insert(pool, "opportunity_valuation", { ...common, opportunity_id: opportunity, valuation_type: "potential",
    valuation_state: "not_sized", basis: "evidence_required" });
  await insert(pool, "evidence_requirement", { ...common, requirement_id: "REQ-1", evidence_class: "contract",
    requirement_text: "Provide document", grain: "contract" });
  await insert(pool, "opportunity_requirement_status", { ...common, opportunity_id: opportunity,
    requirement_id: "REQ-1", status: "missing", status_detail: "Pending" });
  await insert(pool, "evidence_request", { ...common, evidence_request_id: "EREQ-1", opportunity_id: opportunity,
    requirement_id: "REQ-1", request_text: "Provide document" });
  await insert(pool, "opportunity_stage_event", { ...common, opportunity_id: opportunity, to_stage: "signal", reason: "fixture" });
  await insert(pool, "opportunity_overlap", { ...common, opportunity_id: opportunity, overlaps_opportunity_id: opportunity,
    overlap_type: "self", treatment: "not_additive" });
  await insert(pool, "optimization_baseline", { ...common, baseline_id: "BASE-1", contract_id: contract,
    baseline_state: "missing", detail: "Pending" });
  await insert(pool, "optimization_case", { ...common, optimization_case_id: "CASE-1", contract_id: contract,
    vendor_id: "V-1", baseline_id: "BASE-1", next_action: "Review" });
  await insert(pool, "case_opportunity", { ...common, optimization_case_id: "CASE-1", opportunity_id: opportunity });
  await insert(pool, "approval_request", { ...common, approval_request_id: "APPROVAL-1", optimization_case_id: "CASE-1",
    opportunity_id: opportunity, approval_type: "review" });
  await insert(pool, "approval_decision", { ...common, approval_request_id: "APPROVAL-1", decision: "held", rationale: "Pending" });
  await insert(pool, "negotiated_outcome", { ...common, outcome_id: "OUTCOME-1", optimization_case_id: "CASE-1",
    opportunity_id: opportunity, outcome_state: "proposed" });
  await insert(pool, "finance_realization", { ...common, realization_id: "FIN-1", opportunity_id: opportunity,
    amount_usd: 0, basis: "fixture" });
  await insert(pool, "finance_realization_evidence", { ...common, realization_id: "FIN-1", evidence_class: "fixture" });
  await insert(pool, "opportunity_claim", { ...common, claim_id: "CLAIM-1", opportunity_id: opportunity,
    contract_id: contract, claim_role: "problem", statement: "Synthetic local test", basis: "not_recorded",
    produced_by: "package_author" });
  return opportunity;
}

function blobTarget() {
  const objects = new Map();
  const state = { failPrepared: false, failFinal: false };
  return { state, objects, target: { prefix: "private/local-test", client: {
    getBlockBlobClient(name) {
      return { url: `https://private.invalid/${name}`,
        async uploadData(body) {
          if (state.failPrepared && name.endsWith("-prepared.json")) throw new Error("prepared Blob unavailable");
          if (state.failFinal && name.includes("-apply-final.json")) throw new Error("final Blob unavailable");
          objects.set(name, Buffer.from(body));
        },
        async download() {
          const body = objects.get(name);
          assert(body, "Mock Blob readback missing");
          return { readableStreamBody: (async function* () { yield body; })() };
        } };
    },
  } } };
}

function environment(scope, runId) {
  return { SOURCE_CUTOVER_RUN_ID: runId, SOURCE_CUTOVER_OPERATOR: "local-operator",
    SOURCE_CUTOVER_JOB_NAME: "local-cutover-job", ACA_JOB_NAME: "local-cutover-job",
    SOURCE_CUTOVER_BUILD_VERSION: "local-build", SOURCE_CUTOVER_INPUT_VERSION: scope.datasetVersion,
    SOURCE_CUTOVER_IDEMPOTENCY_KEY: `local-${runId}`, SOURCE_CUTOVER_GIT_SHA: "a".repeat(40),
    SOURCE_CUTOVER_IMAGE_DIGEST: `sha256:${"b".repeat(64)}` };
}

test("local PostgreSQL plan/apply/verify/restore preserves every spine row and durable proof", { timeout: 120_000 }, async () => {
  const local = await startLocalPostgres();
  let jobPool;
  try {
    await installSchema(local.pool);
    const scope = resolveScope(readOpportunityOwnershipManifest("plan"));
    const opportunity = await seedFixture(local.pool, scope);
    jobPool = new pg.Pool({ host: local.socket, port: local.port, user: "service_role", database: "postgres", max: 1 });
    const hidden = await jobPool.query("SELECT count(*)::int AS count FROM source.optimization_opportunity WHERE tenant_key=$1", [scope.tenantKey]);
    assert.equal(hidden.rows[0].count, 0, "RLS fixture must hide rows without app.tenant_key");
    const blob = blobTarget();
    const env = environment(scope, "cutover-local-1");
    const held = await runJob({ mode: "plan", env, pool: jobPool, targetOverride: blob.target });
    assert.equal(held.quality_gate, "BLOCKED_HUMAN_DECISION_ROWS");
    await assert.rejects(runJob({ mode: "apply", env: { ...env, SOURCE_CUTOVER_APPROVED: "APPLY",
      SOURCE_CUTOVER_EXPECTED_OPPORTUNITY_IDS: JSON.stringify([opportunity]),
      SOURCE_CUTOVER_EXPECTED_HASH: held.inventory_sha256,
      SOURCE_CUTOVER_EXPECTED_WRITER_HASH: held.canonical_writer_sha256,
      SOURCE_CUTOVER_EXPECTED_PROVENANCE_HASH: held.historical_provenance_sha256,
      SOURCE_CUTOVER_EXPECTED_MANIFEST_HASH: held.ownership_manifest_sha256 },
    pool: jobPool, targetOverride: blob.target }), /Human decision rows/);
    for (const table of ["approval_decision", "finance_realization_evidence", "finance_realization",
      "negotiated_outcome", "approval_request"]) {
      await local.pool.query(`DELETE FROM source."${table}" WHERE tenant_key=$1 AND dataset_version=$2`,
        [scope.tenantKey, scope.datasetVersion]);
    }
    const plan = await runJob({ mode: "plan", env, pool: jobPool, targetOverride: blob.target });
    assert.equal(plan.archive_row_count, 16);
    assert.equal(plan.canonical_writer_root_count, 1);
    assert(SPINE.every((table) => plan.table_counts[table] ===
      (["approval_decision", "finance_realization_evidence", "finance_realization",
        "negotiated_outcome", "approval_request"].includes(table) ? 0 : 1)),
    "Only unreviewed opportunity rows may be retired");
    assert.equal(plan.quality_gate, "inventory_pass");
    assert.equal(plan.aca_execution_id, null);
    const approved = { ...env, SOURCE_CUTOVER_EXPECTED_OPPORTUNITY_IDS: JSON.stringify([opportunity]),
      SOURCE_CUTOVER_EXPECTED_HASH: plan.inventory_sha256,
      SOURCE_CUTOVER_EXPECTED_WRITER_HASH: plan.canonical_writer_sha256,
      SOURCE_CUTOVER_EXPECTED_PROVENANCE_HASH: plan.historical_provenance_sha256,
      SOURCE_CUTOVER_EXPECTED_MANIFEST_HASH: plan.ownership_manifest_sha256 };

    await local.pool.query(`UPDATE source.source_record_snapshot SET source_record_hash='altered'
      WHERE tenant_key=$1 AND dataset_version=$2`, [scope.tenantKey, scope.datasetVersion]);
    await assert.rejects(runJob({ mode: "plan", env, pool: jobPool, targetOverride: blob.target }),
      /Historical snapshot does not match/);
    await local.pool.query(`UPDATE source.source_record_snapshot SET source_record_hash='source-hash-1'
      WHERE tenant_key=$1 AND dataset_version=$2`, [scope.tenantKey, scope.datasetVersion]);
    await local.pool.query(`UPDATE source.contract_depth_adapter_row
      SET lineage=jsonb_set(lineage,'{package_sha256}','"changed"'::jsonb)
      WHERE tenant_key=$1 AND dataset_version=$2`, [scope.tenantKey, scope.datasetVersion]);
    await assert.rejects(runJob({ mode: "apply", env: { ...approved, SOURCE_CUTOVER_APPROVED: "APPLY" },
      pool: jobPool, targetOverride: blob.target }), /Historical provenance changed since approval/);
    await local.pool.query(`UPDATE source.contract_depth_adapter_row
      SET lineage=jsonb_set(lineage,'{package_sha256}','"package-hash-1"'::jsonb)
      WHERE tenant_key=$1 AND dataset_version=$2`, [scope.tenantKey, scope.datasetVersion]);

    await insert(local.pool, "contract_insight", { tenant_key: scope.tenantKey,
      dataset_version: scope.datasetVersion, contract_id: scope.contractId,
      payload: { active_reference: opportunity } });
    await assert.rejects(runJob({ mode: "plan", env, pool: jobPool, targetOverride: blob.target }),
      /External JSON reference contract_insight.payload/);
    await local.pool.query(`DELETE FROM source.contract_insight WHERE tenant_key=$1 AND dataset_version=$2`,
      [scope.tenantKey, scope.datasetVersion]);

    await insert(local.pool, "sourcing_opportunity", { tenant_key: scope.tenantKey, contract_id: scope.contractId,
      opportunity_id: opportunity });
    const blocked = await runJob({ mode: "plan", env, pool: jobPool, targetOverride: blob.target });
    assert.equal(blocked.legacy_opportunity_blockers.count, 1);
    assert.equal(blocked.quality_gate, "BLOCKED_LEGACY_PROJECTION_ROWS");
    await assert.rejects(runJob({ mode: "apply", env: { ...approved, SOURCE_CUTOVER_APPROVED: "APPLY" },
      pool: jobPool, targetOverride: blob.target }), /Legacy opportunity rows/);
    await local.pool.query("DELETE FROM source.sourcing_opportunity WHERE tenant_key=$1 AND contract_id=$2", [scope.tenantKey, scope.contractId]);

    blob.state.failPrepared = true;
    await assert.rejects(runJob({ mode: "apply", env: { ...approved, SOURCE_CUTOVER_APPROVED: "APPLY" },
      pool: jobPool, targetOverride: blob.target }), /prepared Blob unavailable/);
    assert.equal((await local.pool.query("SELECT count(*)::int AS count FROM source.opportunity_cutover_run")).rows[0].count, 0);
    blob.state.failPrepared = false;
    blob.state.failFinal = true;
    await assert.rejects(runJob({ mode: "apply", env: { ...approved, SOURCE_CUTOVER_APPROVED: "APPLY" },
      pool: jobPool, targetOverride: blob.target }), /transaction committed but final Blob proof failed/);
    assert.equal((await local.pool.query("SELECT count(*)::int AS count FROM source.opportunity_cutover_archive")).rows[0].count, 16);
    assert.equal((await local.pool.query("SELECT count(*)::int AS count FROM source.optimization_opportunity WHERE opportunity_id=$1", [opportunity])).rows[0].count, 0);
    assert.equal((await local.pool.query("SELECT state FROM source.opportunity_cutover_run WHERE run_id=$1", [env.SOURCE_CUTOVER_RUN_ID])).rows[0].state, "retired");
    assert([...blob.objects.keys()].some((name) => name.endsWith("-prepared.json")));

    blob.state.failFinal = false;
    const archived = (await local.pool.query(`SELECT source_table,source_row_id,row_payload::text AS payload
      FROM source.opportunity_cutover_archive WHERE run_id=$1 AND source_table='source.optimization_opportunity'`,
    [env.SOURCE_CUTOVER_RUN_ID])).rows[0];
    await local.pool.query(`UPDATE source.opportunity_cutover_archive
      SET row_payload=jsonb_set(row_payload,'{narrative}','"tampered"'::jsonb)
      WHERE run_id=$1 AND source_table=$2 AND source_row_id=$3`,
    [env.SOURCE_CUTOVER_RUN_ID, archived.source_table, archived.source_row_id]);
    await assert.rejects(runJob({ mode: "verify", env: approved, pool: jobPool, targetOverride: blob.target }), /Archived row hash mismatch/);
    await local.pool.query(`UPDATE source.opportunity_cutover_archive SET row_payload=$4::jsonb
      WHERE run_id=$1 AND source_table=$2 AND source_row_id=$3`,
    [env.SOURCE_CUTOVER_RUN_ID, archived.source_table, archived.source_row_id, archived.payload]);

    await local.pool.query(`UPDATE source.optimization_opportunity SET narrative='changed'
      WHERE tenant_key=$1 AND dataset_version=$2 AND opportunity_id='OPP-CONTROL'`,
    [scope.tenantKey, scope.datasetVersion]);
    await assert.rejects(runJob({ mode: "verify", env: approved, pool: jobPool, targetOverride: blob.target }),
      /Unrelated or canonical writer rows changed/);
    await local.pool.query(`UPDATE source.optimization_opportunity SET narrative='Untouched control'
      WHERE tenant_key=$1 AND dataset_version=$2 AND opportunity_id='OPP-CONTROL'`,
    [scope.tenantKey, scope.datasetVersion]);

    const verify = await runJob({ mode: "verify", env: approved, pool: jobPool, targetOverride: blob.target });
    assert.equal(verify.quality_gate, "PASS");
    assert.equal(verify.residual_rows, 0);
    assert([...blob.objects.keys()].some((name) => name.endsWith("-verify-final.json")));
    const restore = await runJob({ mode: "restore", env: { ...approved, SOURCE_CUTOVER_APPROVED: "RESTORE" },
      pool: jobPool, targetOverride: blob.target });
    assert.equal(restore.quality_gate, "PASS");
    assert.equal((await local.pool.query("SELECT count(*)::int AS count FROM source.optimization_opportunity WHERE opportunity_id=$1", [opportunity])).rows[0].count, 1);
    assert.equal((await local.pool.query("SELECT state FROM source.opportunity_cutover_run WHERE run_id=$1", [env.SOURCE_CUTOVER_RUN_ID])).rows[0].state, "restored");
    const afterRestore = await runJob({ mode: "plan", env, pool: jobPool, targetOverride: blob.target });
    assert.equal(afterRestore.inventory_sha256, plan.inventory_sha256);
    assert.equal(afterRestore.canonical_writer_sha256, plan.canonical_writer_sha256);
    for (const table of SPINE) {
      await local.pool.query(`ALTER POLICY cutover_test_tenant ON source."${table}"
        USING (false) WITH CHECK (false)`);
    }
    await assert.rejects(runJob({ mode: "plan", env, pool: jobPool, targetOverride: blob.target }),
      /No evidence-only opportunity roots visible/);
  } finally { if (jobPool) await jobPool.end(); await local.stop(); }
});
