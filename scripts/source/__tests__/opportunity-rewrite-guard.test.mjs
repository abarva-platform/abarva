import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { assertOpportunityRewriteSafe } from "../opportunity-rewrite-guard.mjs";

const scope = {
  tenantKey: "tenant-a",
  datasetVersion: "writer-v1",
  opportunityIds: ["OPP-1"],
  caseIds: ["CASE-1"],
  calculationRunIds: ["RUN-1"],
  contractIds: ["CONTRACT-1"],
  requirementIds: ["REQ-1"],
};

function fakeClient({ reason, unfiltered = true, rowSecurity = "off", malformed = false, failQuery = false } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });
      if (failQuery && sql.includes("FROM source.approval_request")) throw new Error("read failed");
      if (sql.includes("current_setting('row_security')")) {
        return { rows: [{ row_security: rowSecurity, unfiltered }] };
      }
      if (sql === "SET LOCAL row_security = off") return { rows: [] };
      if (malformed) return { rows: [] };
      return { rows: [{ found: sql.includes(`source.${reason}`) }] };
    },
  };
}

test("requires exact nonempty scope before inspecting or deleting anything", async () => {
  for (const bad of [
    { ...scope, tenantKey: "" },
    { ...scope, datasetVersion: "" },
    { ...scope, opportunityIds: [] },
    { ...scope, caseIds: [] },
    { ...scope, calculationRunIds: [] },
    { ...scope, contractIds: [] },
    { ...scope, requirementIds: [] },
    { ...scope, opportunityIds: ["OPP-1", "OPP-1"] },
    { ...scope, opportunityIds: [" OPP-1"] },
  ]) {
    const client = fakeClient();
    await assert.rejects(assertOpportunityRewriteSafe(client, bad), /Opportunity rewrite guard requires/);
    assert.equal(client.calls.length, 0);
  }
});

test("rejects RLS-filtered and non-transactional reads before action queries", async () => {
  for (const config of [{ unfiltered: false }, { rowSecurity: "on" }]) {
    const client = fakeClient(config);
    await assert.rejects(assertOpportunityRewriteSafe(client, scope), /unfiltered database role/);
    assert.equal(client.calls.length, 2);
  }
});

test("checks all action families with the same exact tenant, dataset and IDs", async () => {
  const client = fakeClient();
  await assertOpportunityRewriteSafe(client, scope);
  const actionCalls = client.calls.slice(2);
  assert.equal(actionCalls.length, 20);
  assert.ok(actionCalls.every(({ sql, params }) =>
    sql.includes("tenant_key = $1") && sql.includes("dataset_version = $2") &&
    JSON.stringify(params) === JSON.stringify([
      "tenant-a", "writer-v1", ["OPP-1"], ["CASE-1"], ["RUN-1"], ["CONTRACT-1"], ["REQ-1"],
    ])
  ));
  for (const table of ["approval_request", "approval_decision", "negotiated_outcome", "finance_realization",
    "opportunity_claim", "opportunity_evidence", "opportunity_stage_event", "case_opportunity",
    "optimization_case", "optimization_opportunity", "opportunity_valuation", "calculation_run",
    "calculation_input", "calculation_output", "optimization_baseline", "evidence_requirement",
    "evidence_request", "opportunity_requirement_status", "opportunity_overlap",
    "contract_optimization_decision_record"]) {
    assert.ok(actionCalls.some(({ sql }) => sql.includes(`source.${table}`)), `${table} not inspected`);
  }
});

test("refuses action rows and failed or incomplete database readback", async () => {
  for (const reason of ["approval_request", "negotiated_outcome", "finance_realization", "opportunity_claim",
    "opportunity_stage_event", "case_opportunity", "evidence_request", "contract_optimization_decision_record"]) {
    await assert.rejects(assertOpportunityRewriteSafe(fakeClient({ reason }), scope), /Opportunity rewrite refused/);
  }
  await assert.rejects(assertOpportunityRewriteSafe(fakeClient({ malformed: true }), scope), /could not verify/);
  await assert.rejects(assertOpportunityRewriteSafe(fakeClient({ failQuery: true }), scope), /read failed/);
});

test("the loader checks the writer scope before its first opportunity-spine delete", () => {
  const loader = fs.readFileSync(new URL("../load-cloud-consumption-package.mjs", import.meta.url), "utf8");
  const start = loader.indexOf("async function upsertOptimizationSpine(");
  const guard = loader.indexOf("await assertOpportunityRewriteSafe(client, {", start);
  const firstDelete = loader.indexOf("DELETE FROM source.calculation_output", start);
  assert.ok(start >= 0 && guard > start && firstDelete > guard);
});

const TABLES = ["approval_request", "approval_decision", "negotiated_outcome", "finance_realization",
  "opportunity_claim", "opportunity_evidence", "opportunity_stage_event", "case_opportunity",
  "optimization_case", "optimization_opportunity", "opportunity_valuation", "calculation_run",
  "calculation_input", "calculation_output", "optimization_baseline", "evidence_requirement",
  "evidence_request", "opportunity_requirement_status", "opportunity_overlap",
  "contract_optimization_decision_record"];

test("disposable PostgreSQL rejects scoped actions and an RLS-filtered role", async (t) => {
  if (spawnSync("initdb", ["--version"]).status !== 0 || spawnSync("pg_ctl", ["--version"]).status !== 0) {
    t.skip("Local PostgreSQL tools unavailable");
    return;
  }
  const require = createRequire(import.meta.url);
  let Client;
  try { ({ Client } = require("pg")); } catch { t.skip("pg dependency unavailable"); return; }
  const root = fs.mkdtempSync(path.join("/tmp", "source-opportunity-guard-"));
  const data = path.join(root, "data");
  const socket = path.join(root, "socket");
  fs.mkdirSync(socket);
  const port = 20000 + Math.floor(Math.random() * 20000);
  const init = spawnSync("initdb", ["-A", "trust", "-U", "guard_admin", "-D", data], { encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr);
  const logFile = path.join(root, "postgres.log");
  const start = spawnSync("pg_ctl", ["-D", data, "-l", logFile, "-o", `-F -h '' -k ${socket} -p ${port}`, "-w", "start"], { stdio: "ignore" });
  assert.equal(start.status, 0, fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "PostgreSQL did not start");
  const client = new Client({ host: socket, port, user: "guard_admin", database: "postgres", connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query("CREATE SCHEMA source");
    const columns = `tenant_key text, dataset_version text, opportunity_id text,
      optimization_case_id text, contract_id text, calculation_run_id text, approval_request_id text,
      requirement_id text, baseline_state text,
      reviewer_ref text, reviewed_at timestamptz, review_status text, produced_by text,
      review_state text, selected_for_action boolean, payload jsonb, case_state text,
      door1_event_id text, stage text, approval_state text, valuation_type text,
      valuation_state text, amount_usd numeric, amount_low_usd numeric, amount_high_usd numeric,
      run_state text, rule_id text, inclusion_state text, request_state text, status text,
      overlaps_opportunity_id text, optimization_state text, realized_value numeric`;
    for (const table of TABLES) await client.query(`CREATE TABLE source.${table} (${columns})`);

    await client.query("BEGIN");
    await assertOpportunityRewriteSafe(client, scope);
    await client.query("ROLLBACK");
    await client.query(`INSERT INTO source.approval_request
      (tenant_key, dataset_version, opportunity_id, optimization_case_id, approval_request_id)
      VALUES ('tenant-b', 'writer-v1', 'OPP-1', 'CASE-1', 'APR-OTHER'),
             ('tenant-a', 'other-version', 'OPP-1', 'CASE-1', 'APR-OTHER-VERSION')`);
    await client.query("BEGIN");
    await assertOpportunityRewriteSafe(client, scope);
    await client.query("ROLLBACK");

    await client.query(`INSERT INTO source.approval_request
      (tenant_key, dataset_version, opportunity_id, optimization_case_id, approval_request_id)
      VALUES ('tenant-a', 'writer-v1', 'OPP-1', 'CASE-1', 'APR-TARGET')`);
    await client.query("BEGIN");
    await assert.rejects(assertOpportunityRewriteSafe(client, scope), /approval_request exists/);
    await client.query("ROLLBACK");
    await client.query("DELETE FROM source.approval_request WHERE approval_request_id = 'APR-TARGET'");

    await client.query(`INSERT INTO source.opportunity_claim
      (tenant_key, dataset_version, opportunity_id, review_status, produced_by)
      VALUES ('tenant-a', 'writer-v1', 'OPP-1', 'approved', 'human_reviewer')`);
    await client.query("BEGIN");
    await assert.rejects(assertOpportunityRewriteSafe(client, scope), /reviewed_claim exists/);
    await client.query("ROLLBACK");
    await client.query("DELETE FROM source.opportunity_claim");

    for (const action of [
      { table: "negotiated_outcome", columns: "opportunity_id, optimization_case_id", values: "'OPP-1', 'CASE-1'", reason: "negotiated_outcome" },
      { table: "finance_realization", columns: "opportunity_id, optimization_case_id", values: "'OPP-1', 'CASE-1'", reason: "finance_realization" },
      { table: "opportunity_stage_event", columns: "opportunity_id", values: "'OPP-1'", reason: "stage_history" },
      { table: "case_opportunity", columns: "opportunity_id, optimization_case_id, selected_for_action", values: "'OPP-1', 'CASE-1', true", reason: "selected_action" },
      { table: "optimization_case", columns: "optimization_case_id, case_state", values: "'CASE-1', 'outcome_recorded'", reason: "case_progress" },
      { table: "opportunity_valuation", columns: "opportunity_id, valuation_type, valuation_state", values: "'OPP-1', 'agreed', 'confirmed'", reason: "valuation_progress" },
      { table: "calculation_output", columns: "calculation_run_id, amount_usd", values: "'RUN-1', 100", reason: "calculation_output_value" },
      { table: "optimization_baseline", columns: "contract_id, baseline_state", values: "'CONTRACT-1', 'conflict'", reason: "baseline_review" },
      { table: "evidence_requirement", columns: "requirement_id, payload", values: "'REQ-1', '{\"review_note\":\"hold\"}'::jsonb", reason: "requirement_annotation" },
      { table: "evidence_request", columns: "opportunity_id, request_state", values: "'OPP-1', 'received'", reason: "evidence_request_progress" },
      { table: "contract_optimization_decision_record", columns: "contract_id, door1_event_id", values: "'CONTRACT-1', 'EVENT-1'", reason: "contract_decision" },
    ]) {
      await client.query(`INSERT INTO source.${action.table} (tenant_key, dataset_version, ${action.columns})
        VALUES ('tenant-a', 'writer-v1', ${action.values})`);
      await client.query("BEGIN");
      await assert.rejects(assertOpportunityRewriteSafe(client, scope), new RegExp(`${action.reason} exists`));
      await client.query("ROLLBACK");
      await client.query(`DELETE FROM source.${action.table}`);
    }

    await client.query("CREATE ROLE guard_filtered LOGIN");
    await client.query("GRANT USAGE ON SCHEMA source TO guard_filtered");
    await client.query("GRANT SELECT ON ALL TABLES IN SCHEMA source TO guard_filtered");
    await client.query("ALTER TABLE source.approval_request ENABLE ROW LEVEL SECURITY");
    await client.query(`CREATE POLICY hide_actions ON source.approval_request
      FOR SELECT TO guard_filtered USING (tenant_key = 'tenant-b')`);
    await client.query(`INSERT INTO source.approval_request
      (tenant_key, dataset_version, opportunity_id, optimization_case_id, approval_request_id)
      VALUES ('tenant-a', 'writer-v1', 'OPP-1', 'CASE-1', 'APR-HIDDEN')`);
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE guard_filtered");
    const hidden = await client.query(`SELECT count(*)::int AS visible_count FROM source.approval_request
      WHERE tenant_key = 'tenant-a' AND dataset_version = 'writer-v1'`);
    assert.equal(hidden.rows[0].visible_count, 0);
    await assert.rejects(assertOpportunityRewriteSafe(client, scope), /unfiltered database role/);
    await client.query("ROLLBACK");
  } finally {
    await client.end().catch(() => undefined);
    spawnSync("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"], { stdio: "ignore" });
    fs.rmSync(root, { recursive: true, force: true });
  }
});
