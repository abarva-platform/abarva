import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import pg from "pg";
import { packageScope, runJob } from "../opportunity-unsize-job.mjs";
import { readOpportunityOwnershipManifest } from "../opportunity-ownership.mjs";

const root = path.resolve(import.meta.dirname, "../../..");
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

function command(bin, args) {
  const result = spawnSync(bin, args, { encoding: "utf8", timeout: 60_000 });
  assert.equal(result.status, 0, `${bin}: ${result.stderr || result.stdout}`);
}

async function postgres() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "source-unsize-pg-"));
  const data = path.join(dir, "data");
  const socket = path.join(dir, "socket");
  fs.mkdirSync(socket);
  const port = 25000 + Math.floor(Math.random() * 25000);
  command("initdb", ["-D", data, "-A", "trust", "-U", "unsize_test", "--no-instructions"]);
  command("pg_ctl", ["-D", data, "-l", path.join(dir, "postgres.log"), "-o",
    `-F -p ${port} -k ${socket} -c listen_addresses=''`, "-w", "start"]);
  const admin = new pg.Pool({ host: socket, port, user: "unsize_test", database: "postgres", max: 2 });
  const operator = new pg.Pool({ host: socket, port, user: "service_role", database: "postgres", max: 1 });
  return { admin, operator, async stop() {
    await operator.end();
    await admin.end();
    command("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"]);
    fs.rmSync(dir, { recursive: true, force: true });
  } };
}

async function schema(db) {
  await db.admin.query(`CREATE ROLE authenticated; CREATE ROLE service_role LOGIN BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA source; CREATE SCHEMA consumption;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT 'service_role'::text $$;
    CREATE FUNCTION source.can_read_sourcing_tenant(text) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;`);
  await db.admin.query(fs.readFileSync(path.join(root,
    "supabase/migrations/20260809143000_source_contract_optimization_opportunity_spine.sql"), "utf8"));
  const provenance = fs.readFileSync(path.join(root,
    "supabase/migrations/20260914150000_source_contract_intelligence_provenance.sql"), "utf8");
  await db.admin.query(provenance.slice(provenance.indexOf("CREATE TABLE IF NOT EXISTS source.opportunity_claim"),
    provenance.indexOf("CREATE INDEX IF NOT EXISTS opportunity_claim_contract_idx")));
  await db.admin.query(fs.readFileSync(path.join(root,
    "supabase/migrations/20260917120000_source_opportunity_unsize_archive.sql"), "utf8"));
  await db.admin.query(`CREATE VIEW consumption.sourcing_opportunity_v1 AS
    SELECT tenant_key, contract_id, opportunity_id, amount_usd AS annual_value_exposed
    FROM source.optimization_opportunity;
    CREATE VIEW source.contract_action_candidate_v1 AS
    SELECT tenant_key,contract_id,opportunity_id,opportunity_id AS action_candidate_id,
      annual_value_exposed AS candidate_amount_usd
    FROM consumption.sourcing_opportunity_v1;
    GRANT USAGE ON SCHEMA source,consumption TO service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA source TO service_role;
    GRANT SELECT ON ALL TABLES IN SCHEMA consumption TO service_role;`);
}

function files() {
  const manifest = readOpportunityOwnershipManifest("plan", path.join(root,
    "datasets/source/opportunity-ownership-manifest.json"));
  const csv = fs.readFileSync(path.join(root,
    "datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908/source-files/optimization_opportunities.csv"), "utf8");
  return { scope: packageScope(manifest, csv), manifestHash: sha(JSON.stringify(manifest)), packageHash: sha(csv) };
}

async function insert(db, table, fields) {
  const names = Object.keys(fields);
  const values = Object.values(fields);
  await db.admin.query(`INSERT INTO source."${table}" (${names.map((name) => `"${name}"`).join(",")})
    VALUES (${values.map((_, i) => `$${i + 1}`).join(",")})`, values);
}

async function fixture(db, scope) {
  const common = { tenant_key: scope.tenantKey, dataset_version: scope.datasetVersion };
  await insert(db, "calculation_rule", { ...common, rule_id: "source.cloud_consumption_package.opportunity.v1",
    rule_version: "1.0.0", formula: "Native cloud recommendations become candidate value only after CLM terms, AP-paid spend, CMDB ownership, and evidence rows reconcile." });
  for (const [i, opportunity] of scope.ids.entries()) {
    await insert(db, "optimization_opportunity", { ...common, opportunity_id: opportunity,
      contract_id: scope.contractId, vendor_id: "V-1", value_type: "negotiated_improvement",
      stage: i < 4 ? "quantified" : "signal", amount_usd: i < 4 ? 100 + i : 50 + i,
      amount_state: i < 4 ? "exact" : "range", next_action: "Review", overlap_treatment: "none",
      approval_state: "requires_review", narrative: "Synthetic fixture",
      payload: { finance_confirmation_state: "not_confirmed" } });
    await insert(db, "opportunity_evidence", { ...common, opportunity_id: opportunity,
      evidence_class: "document", source_system: "fixture", review_state: "system_evidenced" });
    await insert(db, "optimization_case", { ...common, optimization_case_id: `CASE-${i}`,
      contract_id: scope.contractId, vendor_id: "V-1", case_state: "evidence_review", next_action: "Review" });
    await insert(db, "case_opportunity", { ...common, optimization_case_id: `CASE-${i}`,
      opportunity_id: opportunity });
    await insert(db, "calculation_run", { ...common, calculation_run_id: `RUN-${i}`,
      opportunity_id: opportunity, rule_id: "source.cloud_consumption_package.opportunity.v1",
      rule_version: "1.0.0", run_state: "blocked" });
    await insert(db, "calculation_input", { ...common, calculation_run_id: `RUN-${i}`,
      input_key: "evidence-row", source_table: "source.cloud_consumption_adapter_row",
      source_record_id: `ROW-${i}`, inclusion_state: i === 0 ? "included" : "pending_review",
      inclusion_reason: i === 0 ? "Cloud package opportunity cites this evidence row." : "missing method" });
    await insert(db, "calculation_output", { ...common, calculation_run_id: `RUN-${i}`,
      output_key: "candidate_amount", amount_usd: 100 + i });
    await insert(db, "opportunity_valuation", { ...common, opportunity_id: opportunity,
      valuation_type: "potential", valuation_state: "candidate", amount_usd: 100 + i,
      amount_low_usd: 50, amount_high_usd: 150, basis: "unreviewed" });
    for (const role of ["problem", "proposed_ask"]) {
      await insert(db, "opportunity_claim", { ...common, claim_id: `${opportunity}:${role}`,
        opportunity_id: opportunity, contract_id: scope.contractId, claim_role: role,
        statement: "Synthetic fixture", basis: "not_recorded", produced_by: "package_author" });
    }
  }
  await insert(db, "optimization_opportunity", { tenant_key: "other-tenant", dataset_version: scope.datasetVersion,
    opportunity_id: scope.ids[0], contract_id: scope.contractId, vendor_id: "V-2",
    value_type: "negotiated_improvement", stage: "quantified", amount_usd: 999,
    amount_state: "exact", next_action: "Other", overlap_treatment: "none",
    approval_state: "requires_review", narrative: "Other tenant" });
}

function blob() {
  const objects = new Map();
  const state = { failPrepared: false };
  return { state, target: { prefix: "private/test", client: { getBlockBlobClient(name) {
    return { url: `https://private.invalid/${name}`,
      async uploadData(body) {
        if (state.failPrepared && name.endsWith("-prepared.json")) throw new Error("Blob unavailable");
        objects.set(name, Buffer.from(body));
      },
      async download() { return { readableStreamBody: (async function* () { yield objects.get(name); })() }; } };
  } } } };
}

function env(scope, runId) {
  return { SOURCE_UNSIZE_RUN_ID: runId, SOURCE_UNSIZE_OPERATOR: "local-operator",
    SOURCE_UNSIZE_JOB_NAME: "local-operator-job", ACA_JOB_NAME: "local-operator-job",
    SOURCE_UNSIZE_BUILD_VERSION: "local", SOURCE_UNSIZE_INPUT_VERSION: scope.datasetVersion,
    SOURCE_UNSIZE_IDEMPOTENCY_KEY: runId, SOURCE_UNSIZE_GIT_SHA: "a".repeat(40),
    SOURCE_UNSIZE_IMAGE_DIGEST: `sha256:${"b".repeat(64)}` };
}

test("scoped unsize archives, rolls back, verifies, and restores with CAS", { timeout: 120_000 }, async () => {
  const db = await postgres();
  try {
    await schema(db);
    const source = files();
    await fixture(db, source.scope);
    const storage = blob();
    const base = env(source.scope, "unsize-local-1");
    await insert(db, "opportunity_stage_event", { tenant_key: source.scope.tenantKey,
      dataset_version: source.scope.datasetVersion, opportunity_id: source.scope.ids[0],
      to_stage: "quantified", reason: "human action" });
    await assert.rejects(runJob({ mode: "plan", env: base, pool: db.operator,
      targetOverride: storage.target, filesOverride: source }), /Human action exists/);
    await db.admin.query("DELETE FROM source.opportunity_stage_event");
    await db.admin.query(`UPDATE source.opportunity_claim SET review_status='reviewed',
      reviewer_ref='person-1',reviewed_at=now() WHERE claim_id=$1`, [`${source.scope.ids[0]}:problem`]);
    await assert.rejects(runJob({ mode: "plan", env: base, pool: db.operator,
      targetOverride: storage.target, filesOverride: source }), /Claim reviewed or priced/);
    await db.admin.query(`UPDATE source.opportunity_claim SET review_status='draft',
      reviewer_ref=NULL,reviewed_at=NULL WHERE claim_id=$1`, [`${source.scope.ids[0]}:problem`]);
    const actionRows = [
      ["approval_request", { approval_request_id: "A-1", optimization_case_id: "CASE-0",
        opportunity_id: source.scope.ids[0], approval_type: "value" }],
      ["negotiated_outcome", { outcome_id: "O-1", optimization_case_id: "CASE-0",
        opportunity_id: source.scope.ids[0], outcome_state: "proposed" }],
      ["finance_realization", { realization_id: "F-1", opportunity_id: source.scope.ids[0],
        amount_usd: 1, basis: "human" }],
    ];
    for (const [table, row] of actionRows) {
      await insert(db, table, { tenant_key: source.scope.tenantKey,
        dataset_version: source.scope.datasetVersion, ...row });
      await assert.rejects(runJob({ mode: "plan", env: base, pool: db.operator,
        targetOverride: storage.target, filesOverride: source }), /Human action exists/);
      await db.admin.query(`DELETE FROM source."${table}"`);
    }
    await db.admin.query(`UPDATE source.calculation_input SET inclusion_reason='Human selected this row'
      WHERE calculation_run_id='RUN-0'`);
    await assert.rejects(runJob({ mode: "plan", env: base, pool: db.operator,
      targetOverride: storage.target, filesOverride: source }), /Calculation input/);
    await db.admin.query(`UPDATE source.calculation_input
      SET inclusion_reason='Cloud package opportunity cites this evidence row.'
      WHERE calculation_run_id='RUN-0'`);
    const plan = await runJob({ mode: "plan", env: base, pool: db.operator,
      targetOverride: storage.target, filesOverride: source });
    assert.equal(plan.table_counts.optimization_opportunity, 6);
    assert.equal(plan.table_counts.opportunity_claim, 12);
    const approved = { ...base, SOURCE_UNSIZE_EXPECTED_MANIFEST_SHA256: plan.manifest_sha256,
      SOURCE_UNSIZE_EXPECTED_PACKAGE_SHA256: plan.package_sha256,
      SOURCE_UNSIZE_EXPECTED_BEFORE_SHA256: plan.before_sha256,
      SOURCE_UNSIZE_EXPECTED_LAYER4_SHA256: plan.layer4_definition_sha256,
      SOURCE_UNSIZE_EXPECTED_LAYER4_STATE: plan.layer4_state,
      SOURCE_UNSIZE_EXPECTED_IDS: JSON.stringify(source.scope.ids),
      SOURCE_UNSIZE_MODE_TOKEN: "SOURCE_UNSIZE_APPLY" };
    await assert.rejects(runJob({ mode: "apply", env: { ...approved, SOURCE_UNSIZE_MODE_TOKEN: "" },
      pool: db.operator, targetOverride: storage.target, filesOverride: source }), /mode token/);
    storage.state.failPrepared = true;
    await assert.rejects(runJob({ mode: "apply", env: approved,
      pool: db.operator, targetOverride: storage.target, filesOverride: source }), /Blob unavailable/);
    storage.state.failPrepared = false;
    const none = await db.admin.query("SELECT count(*)::int AS count FROM source.opportunity_unsize_run");
    assert.equal(none.rows[0].count, 0);
    await db.admin.query(`CREATE FUNCTION source.fail_unsize_test() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced update failure'; END $$;
      CREATE TRIGGER fail_unsize_test BEFORE UPDATE ON source.calculation_output
      FOR EACH ROW EXECUTE FUNCTION source.fail_unsize_test()`);
    await assert.rejects(runJob({ mode: "apply", env: { ...approved, SOURCE_UNSIZE_RUN_ID: "unsize-local-fail" },
      pool: db.operator, targetOverride: storage.target, filesOverride: source }), /forced update failure/);
    await db.admin.query("DROP TRIGGER fail_unsize_test ON source.calculation_output");
    await db.admin.query("DROP FUNCTION source.fail_unsize_test()");
    const rolledBack = await db.admin.query(`SELECT count(*)::int AS count FROM source.optimization_opportunity
      WHERE tenant_key=$1 AND dataset_version=$2 AND contract_id=$3 AND amount_usd IS NOT NULL`,
    [source.scope.tenantKey, source.scope.datasetVersion, source.scope.contractId]);
    assert.equal(rolledBack.rows[0].count, 6);
    const noRun = await db.admin.query("SELECT count(*)::int AS count FROM source.opportunity_unsize_run");
    assert.equal(noRun.rows[0].count, 0);
    const applied = await runJob({ mode: "apply", env: approved,
      pool: db.operator, targetOverride: storage.target, filesOverride: source });
    assert.equal(applied.status, "applied");
    const active = await db.admin.query(`SELECT count(*)::int AS count FROM source.optimization_opportunity
      WHERE tenant_key=$1 AND dataset_version=$2 AND contract_id=$3
        AND amount_usd IS NULL AND amount_state='not_sized' AND stage='signal'`,
    [source.scope.tenantKey, source.scope.datasetVersion, source.scope.contractId]);
    assert.equal(active.rows[0].count, 6);
    const inputs = await db.admin.query(`SELECT inclusion_state,inclusion_reason FROM source.calculation_input
      WHERE tenant_key=$1 AND dataset_version=$2 AND calculation_run_id='RUN-0'`,
    [source.scope.tenantKey, source.scope.datasetVersion]);
    assert.deepEqual(inputs.rows, [{ inclusion_state: "pending_review",
      inclusion_reason: "Evidence reference only; numeric formula input is not mapped." }]);
    const untouched = await db.admin.query(`SELECT amount_usd FROM source.optimization_opportunity
      WHERE tenant_key='other-tenant'`);
    assert.equal(Number(untouched.rows[0].amount_usd), 999);
    const verified = await runJob({ mode: "verify", env: approved,
      pool: db.operator, targetOverride: storage.target, filesOverride: source });
    assert.equal(verified.status, "verified");
    const original = await db.admin.query(`SELECT source_row_id,row_payload,row_sha256
      FROM source.opportunity_unsize_archive WHERE run_id=$1 AND source_table='opportunity_claim'
      ORDER BY source_row_id LIMIT 1`, [base.SOURCE_UNSIZE_RUN_ID]);
    await db.admin.query(`UPDATE source.opportunity_unsize_archive SET row_payload='{}'::jsonb
      WHERE run_id=$1 AND source_table='opportunity_claim' AND source_row_id=$2`,
    [base.SOURCE_UNSIZE_RUN_ID, original.rows[0].source_row_id]);
    const restoreEnv = { ...approved, SOURCE_UNSIZE_MODE_TOKEN: "SOURCE_UNSIZE_RESTORE",
      SOURCE_UNSIZE_EXPECTED_AFTER_SHA256: applied.after_sha256 };
    await assert.rejects(runJob({ mode: "restore", env: restoreEnv,
      pool: db.operator, targetOverride: storage.target, filesOverride: source }), /Archive row tampered/);
    await db.admin.query(`UPDATE source.opportunity_unsize_archive SET row_payload=$3::jsonb
      WHERE run_id=$1 AND source_table='opportunity_claim' AND source_row_id=$2`,
    [base.SOURCE_UNSIZE_RUN_ID, original.rows[0].source_row_id,
      JSON.stringify(original.rows[0].row_payload)]);
    await db.admin.query(`UPDATE source.optimization_opportunity SET narrative='Changed after apply'
      WHERE tenant_key=$1 AND dataset_version=$2 AND opportunity_id=$3`,
    [source.scope.tenantKey, source.scope.datasetVersion, source.scope.ids[0]]);
    await assert.rejects(runJob({ mode: "restore", env: restoreEnv,
      pool: db.operator, targetOverride: storage.target, filesOverride: source }), /After-image changed/);
    await db.admin.query(`UPDATE source.optimization_opportunity SET narrative='Synthetic fixture'
      WHERE tenant_key=$1 AND dataset_version=$2 AND opportunity_id=$3`,
    [source.scope.tenantKey, source.scope.datasetVersion, source.scope.ids[0]]);
    const restored = await runJob({ mode: "restore", env: restoreEnv,
      pool: db.operator, targetOverride: storage.target, filesOverride: source });
    assert.equal(restored.status, "restored");
    assert.equal(restored.restored_sha256, plan.before_sha256);
    const restoredInputs = await db.admin.query(`SELECT inclusion_state,inclusion_reason FROM source.calculation_input
      WHERE tenant_key=$1 AND dataset_version=$2 AND calculation_run_id='RUN-0'`,
    [source.scope.tenantKey, source.scope.datasetVersion]);
    assert.deepEqual(restoredInputs.rows, [{ inclusion_state: "included",
      inclusion_reason: "Cloud package opportunity cites this evidence row." }]);
    const claimCount = await db.admin.query(`SELECT count(*)::int AS count FROM source.opportunity_claim
      WHERE tenant_key=$1 AND dataset_version=$2`, [source.scope.tenantKey, source.scope.datasetVersion]);
    assert.equal(claimCount.rows[0].count, 12);
  } finally { await db.stop(); }
});

test("preactivation clears candidate amounts before the writer becomes visible in Layer 4", { timeout: 120_000 }, async () => {
  const db = await postgres();
  try {
    await schema(db);
    const source = files();
    await fixture(db, source.scope);
    await db.admin.query(`CREATE OR REPLACE VIEW consumption.sourcing_opportunity_v1 AS
      SELECT tenant_key, contract_id, opportunity_id, amount_usd AS annual_value_exposed
      FROM source.optimization_opportunity WHERE false`);
    const storage = blob();
    const base = env(source.scope, "unsize-preactivation-local-1");
    await assert.rejects(runJob({ mode: "plan", env: base, pool: db.operator,
      targetOverride: storage.target, filesOverride: source }), /Layer 4 opportunity set mismatch/);
    const scoped = { ...base, SOURCE_UNSIZE_LAYER4_STATE: "PREACTIVATION" };
    const plan = await runJob({ mode: "plan", env: scoped, pool: db.operator,
      targetOverride: storage.target, filesOverride: source });
    assert.equal(plan.layer4_state, "preactivation");
    const approved = { ...scoped, SOURCE_UNSIZE_EXPECTED_MANIFEST_SHA256: plan.manifest_sha256,
      SOURCE_UNSIZE_EXPECTED_PACKAGE_SHA256: plan.package_sha256,
      SOURCE_UNSIZE_EXPECTED_BEFORE_SHA256: plan.before_sha256,
      SOURCE_UNSIZE_EXPECTED_LAYER4_SHA256: plan.layer4_definition_sha256,
      SOURCE_UNSIZE_EXPECTED_LAYER4_STATE: plan.layer4_state,
      SOURCE_UNSIZE_EXPECTED_IDS: JSON.stringify(source.scope.ids),
      SOURCE_UNSIZE_MODE_TOKEN: "SOURCE_UNSIZE_APPLY" };
    const applied = await runJob({ mode: "apply", env: approved, pool: db.operator,
      targetOverride: storage.target, filesOverride: source });
    assert.equal(applied.status, "applied");
    const verified = await runJob({ mode: "verify", env: approved, pool: db.operator,
      targetOverride: storage.target, filesOverride: source });
    assert.equal(verified.status, "verified");
    await db.admin.query(`CREATE OR REPLACE VIEW consumption.sourcing_opportunity_v1 AS
      SELECT tenant_key, contract_id, opportunity_id, amount_usd AS annual_value_exposed
      FROM source.optimization_opportunity`);
    const visible = await db.admin.query(`SELECT count(*)::int AS rows,
      count(*) FILTER (WHERE annual_value_exposed IS NOT NULL)::int AS priced
      FROM consumption.sourcing_opportunity_v1 WHERE tenant_key=$1 AND contract_id=$2`,
    [source.scope.tenantKey, source.scope.contractId]);
    assert.equal(visible.rows[0].rows, 6);
    assert.equal(visible.rows[0].priced, 0);
  } finally { await db.stop(); }
});
