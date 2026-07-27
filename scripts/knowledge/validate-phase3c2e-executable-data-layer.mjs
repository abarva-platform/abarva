#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const PACKAGE_ROOT = "clients/shared/21-phase3c2e-executable-data-layer";
const SQL_PATH = `${PACKAGE_ROOT}/sql/001_shared_knowledge_publication_consumption.sql`;
const CUBE_PATH = `${PACKAGE_ROOT}/cube/knowledge_consumption_model.yml`;
const JOB_PATH = `${PACKAGE_ROOT}/jobs/publication_projection_job_contract.json`;
const CONTRACT_PATH = `${PACKAGE_ROOT}/validation/expected-contract.json`;

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

const sql = read(SQL_PATH);
const cube = read(CUBE_PATH);
const job = readJson(JOB_PATH);
const contract = readJson(CONTRACT_PATH);

for (const schema of contract.required_schemas) {
  assert.match(sql, new RegExp(`CREATE SCHEMA IF NOT EXISTS ${schema};`), `missing schema ${schema}`);
}

for (const table of contract.required_tables) {
  assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table.replace(".", "\\.")}\\b`), `missing table ${table}`);
}

for (const fn of contract.required_functions) {
  assert.match(sql, new RegExp(`CREATE OR REPLACE FUNCTION ${fn.replace(".", "\\.")}\\b`), `missing function ${fn}`);
}

for (const measure of contract.required_cube_measures) {
  assert.match(cube, new RegExp(`name: ${measure}\\b`), `missing Cube measure ${measure}`);
}

for (const forbidden of contract.forbidden_terms) {
  assert.doesNotMatch(sql, new RegExp(forbidden, "i"), `SQL includes forbidden term ${forbidden}`);
}

assert.match(sql, /CHECK \(tenant_key <> 'all'\)/, "operations.run must reject TENANT=all");
assert.match(sql, /p_tenant_key = 'all'/, "activation function must reject wildcard tenant");
assert.match(sql, /LEAST\(GREATEST\(p_max_hops, 1\), 4\)/, "relationship traversal must cap hops at 4");
assert.match(sql, /LIMIT LEAST\(GREATEST\(p_result_limit, 1\), 1000\)/, "relationship traversal must cap result count");
assert.match(sql, /FOREIGN KEY \(tenant_key, knowledge_baseline_ref, from_node_ref\)/, "edge from endpoint must be constrained");
assert.match(sql, /FOREIGN KEY \(tenant_key, knowledge_baseline_ref, to_node_ref\)/, "edge to endpoint must be constrained");
assert.match(sql, /knowledge_baseline_one_active_per_tenant_idx/, "must enforce one active baseline per tenant");
assert.match(sql, /projection_version_one_active_idx/, "must enforce one active projection version");
assert.match(sql, /publication\.activate_knowledge_baseline/, "must include atomic activation helper");
assert.match(sql, /publication\.knowledge_baseline b/, "graph traversal must filter through active baseline");
assert.match(sql, /authority_state = 'accepted'/, "graph traversal must filter accepted relationships");

assert.equal(job.tenant_scope, "single_tenant_only");
assert.equal(job.wildcard_tenant_allowed, false);
assert.deepEqual(
  Object.keys(job.requires).sort(),
  ["approval_manifest_sha", "idempotency_key", "image_digest", "release_id", "tenant_key"].sort(),
);
assert.ok(job.stages.some((stage) => stage.stage === "atomic_activation" && stage.function === "publication.activate_knowledge_baseline"));
assert.ok(job.stages.some((stage) => stage.stage === "projection_reconciliation"));

assert.match(cube, /source_boundary: consumption_only/);
assert.match(cube, /forbidden_sources:/);
assert.doesNotMatch(cube, /sql_table: (source_registry|working|knowledge|publication|metrics|audit|operations)\./);

const existingContract = readJson("clients/shared/20-phase3c2d-consumption-contracts/CONSUMPTION_PROJECTION_REGISTRY.json");
const approvedProjectionNames = new Set(existingContract.projections.map((projection) => projection.projection_name));
const implementedProjectionNames = contract.required_tables
  .filter((table) => table.startsWith("consumption.") && table.endsWith("_v1"))
  .map((table) => table);

for (const projectionName of approvedProjectionNames) {
  assert.ok(
    implementedProjectionNames.includes(projectionName),
    `approved projection missing from executable SQL contract: ${projectionName}`,
  );
}

console.log("Phase 3C-2E executable data-layer contract validation passed.");
