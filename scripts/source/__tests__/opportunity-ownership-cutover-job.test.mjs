import assert from "node:assert/strict";
import test from "node:test";
import {
  SPINE, DELETE_ORDER, assertNoLegacy, canonicalInventory, expected, inspectLegacy, metadata, proofTarget, reconstructedInventoryHash, resolveScope, selectRows,
} from "../opportunity-ownership-cutover-job.mjs";

const scope = { tenantKey: "synthetic-tenant", datasetVersion: "evidence-v1", contractId: "C-1", writerDatasetVersion: "writer-v1" };
const manifest = { schema_version: 1, packages: [
  { tenant_key: scope.tenantKey, dataset_version: scope.datasetVersion, contracts: [
    { contract_id: scope.contractId, role: "evidence_only", canonical_writer_dataset_version: scope.writerDatasetVersion },
  ] },
  { tenant_key: scope.tenantKey, dataset_version: scope.writerDatasetVersion, contracts: [
    { contract_id: scope.contractId, role: "canonical_writer", evidence_only_dataset_versions: [scope.datasetVersion] },
  ] },
] };
const row = (id, fields) => ({ id, ...fields, raw: JSON.stringify({ id, ...fields }) });
const base = () => ({
  optimization_opportunity: [row("1", { opportunity_id: "O-1", contract_id: "C-1" })],
  optimization_case: [row("2", { optimization_case_id: "CASE-1", contract_id: "C-1", baseline_id: "BASE-1" })],
  optimization_baseline: [row("3", { baseline_id: "BASE-1", contract_id: "C-1" })],
  calculation_run: [row("4", { calculation_run_id: "RUN-1", opportunity_id: "O-1", rule_id: "R-1", rule_version: "1" })],
  calculation_rule: [row("5", { rule_id: "R-1", rule_version: "1" })],
  opportunity_requirement_status: [row("6", { opportunity_id: "O-1", requirement_id: "REQ-1" })],
  evidence_requirement: [row("7", { requirement_id: "REQ-1" })],
  opportunity_claim: [row("8", { opportunity_id: "O-1", calculation_run_id: "RUN-1" })],
  approval_request: [row("9", { approval_request_id: "APP-1", optimization_case_id: "CASE-1", opportunity_id: "O-1" })],
  approval_decision: [row("10", { approval_request_id: "APP-1" })],
  finance_realization: [row("11", { realization_id: "FIN-1", optimization_case_id: "CASE-1", opportunity_id: "O-1" })],
  finance_realization_evidence: [row("12", { realization_id: "FIN-1" })],
  case_opportunity: [row("13", { optimization_case_id: "CASE-1", opportunity_id: "O-1" })],
});

test("reciprocal manifest selects exactly one evidence-only tuple", () => {
  assert.deepEqual(resolveScope(manifest), scope);
  assert.throws(() => resolveScope({ ...manifest, packages: manifest.packages.slice(0, 1) }), /reciprocal/);
});

test("scope includes all governed dependent rows and no unrelated rows", () => {
  const rows = base();
  rows.optimization_opportunity.push(row("99", { opportunity_id: "O-99", contract_id: "C-99" }));
  const result = selectRows(rows, scope, ["O-1"]);
  assert.equal(result.selected.optimization_opportunity.length, 1);
  for (const table of ["optimization_case", "optimization_baseline", "calculation_run", "calculation_rule",
    "evidence_requirement", "opportunity_claim", "approval_decision", "finance_realization_evidence"]) {
    assert.equal(result.selected[table].length, 1, `${table} must be archived`);
  }
  const hashes = canonicalInventory(rows, result.selectedIds);
  assert.equal(hashes.archiveCount, 13);
  assert.match(hashes.inventoryHash, /^[a-f0-9]{64}$/);
  assert.equal(SPINE.length, 21);
  assert.equal(new Set(DELETE_ORDER).size, 21);
});

test("wrong IDs, foreign links, and shared definitions fail closed", () => {
  assert.throws(() => selectRows(base(), scope, ["O-2"]), /ID set/);
  const cross = base();
  cross.case_opportunity.push(row("14", { optimization_case_id: "CASE-1", opportunity_id: "O-99" }));
  assert.throws(() => selectRows(cross, scope, ["O-1"]), /Unselected/);
  const shared = base();
  shared.calculation_run.push(row("15", { calculation_run_id: "RUN-2", opportunity_id: "O-99", rule_id: "R-1", rule_version: "1" }));
  assert.throws(() => selectRows(shared, scope, ["O-1"]), /shared/);
  const other = base();
  other.optimization_case[0].contract_id = "C-2";
  assert.throws(() => selectRows(other, scope, ["O-1"]), /Unselected/);
  const payload = base();
  payload.opportunity_evidence = [row("17", { opportunity_id: "O-99", payload: { reference: "O-1" } })];
  assert.throws(() => selectRows(payload, scope, ["O-1"]), /payload references/);
});

test("archive plus surviving rows reconstructs the approved inventory", () => {
  const rows = base();
  rows.optimization_opportunity.push(row("99", { opportunity_id: "O-99", contract_id: "C-99" }));
  const selected = selectRows(rows, scope, ["O-1"]);
  const original = canonicalInventory(rows, selected.selectedIds).inventoryHash;
  const survivors = Object.fromEntries(SPINE.map((table) =>
    [table, (rows[table] ?? []).filter((item) => !selected.selectedIds.has(`${table}/${item.id}`))]));
  const archive = Object.entries(selected.selected).flatMap(([table, values]) => values.map((item) => ({
    source_table: `source.${table}`, source_row_id: item.id, raw: item.raw,
  })));
  assert.equal(reconstructedInventoryHash(survivors, archive), original);
  survivors.optimization_opportunity[0].raw = '{"changed":true}';
  assert.notEqual(reconstructedInventoryHash(survivors, archive), original);
});

test("legacy preflight catches rows that a UNION projection could resurrect", async () => {
  const queries = [];
  const fake = { query: async (sql, params) => {
    queries.push({ sql, params });
    if (sql.includes("pg_get_viewdef")) return { rows: [{ definition: "UNION ALL legacy and canonical" }] };
    return { rows: [{ id: "1", contract_id: "C-1", opportunity_id: "O-1", raw: '{"opportunity_id":"O-1"}' }] };
  } };
  const legacy = await inspectLegacy(fake, scope, ["O-1"]);
  assert.equal(legacy.count, 1);
  assert.equal(legacy.rows[0].opportunity_id, "O-1");
  assert.deepEqual(queries[1].params, ["synthetic-tenant", "C-1", ["O-1"]]);
  assert.throws(() => assertNoLegacy(legacy), /could reappear/);
  assert.doesNotThrow(() => assertNoLegacy({ count: 0 }));
});

test("apply and restore require exact approval, hash, run metadata, and pinned digest", () => {
  const env = { SOURCE_CUTOVER_RUN_ID: "run-1", SOURCE_CUTOVER_OPERATOR: "operator-1",
    SOURCE_CUTOVER_JOB_NAME: "job-1", SOURCE_CUTOVER_BUILD_VERSION: "build-1",
    SOURCE_CUTOVER_INPUT_VERSION: "evidence-v1", SOURCE_CUTOVER_IDEMPOTENCY_KEY: "idempotency-1",
    SOURCE_CUTOVER_GIT_SHA: "a".repeat(40), SOURCE_CUTOVER_IMAGE_DIGEST: `sha256:${"b".repeat(64)}`,
    ACA_JOB_NAME: "job-1",
    SOURCE_CUTOVER_EXPECTED_HASH: "c".repeat(64), SOURCE_CUTOVER_EXPECTED_OPPORTUNITY_IDS: '["O-1"]',
    SOURCE_CUTOVER_EXPECTED_MANIFEST_HASH: "d".repeat(64),
    SOURCE_CUTOVER_EXPECTED_WRITER_HASH: "e".repeat(64) };
  assert.throws(() => metadata(env, "apply"), /approval/);
  assert.throws(() => metadata(env, "restore"), /approval/);
  assert.equal(metadata({ ...env, SOURCE_CUTOVER_APPROVED: "APPLY" }, "apply").runId, "run-1");
  assert.equal(metadata(env, "plan").executionId, null);
  assert.throws(() => metadata({ ...env, SOURCE_CUTOVER_APPROVED: "APPLY", ACA_JOB_NAME: "wrong" }, "apply"), /identity mismatch/);
  assert.throws(() => metadata({ ...env, SOURCE_CUTOVER_ACA_EXECUTION_ID: "run-1" }, "plan"), /must not be the run ID/);
  assert.deepEqual(expected(env, "apply"), { ids: ["O-1"], hash: "c".repeat(64), writerHash: "e".repeat(64) });
  assert.deepEqual(expected(env, "plan"), { ids: null, hash: null, writerHash: null });
  assert.throws(() => metadata({ ...env, SOURCE_CUTOVER_IMAGE_DIGEST: "latest", SOURCE_CUTOVER_APPROVED: "APPLY" }, "apply"), /Digest/);
});

test("private Blob target pins a user-assigned identity without credential fallback", async () => {
  const env = { SOURCE_CUTOVER_BLOB_ACCOUNT_URL: "https://privateproof.blob.core.windows.net",
    SOURCE_CUTOVER_BLOB_CONTAINER: "source-cutover-proof", SOURCE_CUTOVER_BLOB_PREFIX: "runs/local" };
  await assert.rejects(proofTarget(env, "apply"), /AZURE_CLIENT_ID is required/);
  await assert.rejects(proofTarget({ ...env, AZURE_CLIENT_ID: "not-a-uuid" }, "apply"), /approved user-assigned identity/);
  const target = await proofTarget({ ...env, AZURE_CLIENT_ID: "00000000-0000-4000-8000-000000000001" }, "apply");
  assert.equal(target.prefix, "runs/local");
  assert.equal(target.client.url, "https://privateproof.blob.core.windows.net/source-cutover-proof");
});
