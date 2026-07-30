#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "knowledge", "land-airline-source-corpus.mjs");
const TENANT = "airline-demo-new";
const RELEASE = "airline-demo-new-source-corpus-v1.0.0";

function run(args, env = {}) {
  return execFileSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

function parseJson(stdout) {
  return JSON.parse(stdout);
}

function testOperationalPlan() {
  const result = parseJson(
    run(["--tenant", TENANT, "--release-id", RELEASE, "--scope", "operational", "--mode", "plan"]),
  );
  assert.equal(result.status, "planned");
  assert.equal(result.tenantKey, TENANT);
  assert.equal(result.releaseId, RELEASE);
  assert.equal(result.scope, "operational");
  assert.equal(result.expectedCount, 48);
  assert.equal(result.evaluatorVisibleCount, 0);
  assert.equal(result.parserVisibleCount, 25);
  assert.equal(result.j0SyncManifest.manifestVersion, "airline-source-sync-manifest/v1");
  assert.equal(result.j0SyncManifest.deltaPlanState, "INITIAL_FULL_AIRLINE_V2_LOAD");
  assert.equal(result.j0SyncManifest.sourceVersionCount, 48);
  assert.equal(result.j0SyncManifest.parserVisibleSourceVersionCount, 25);
  assert.equal(result.j0SyncManifest.sourceRowCount, 99883);
  assert.equal(result.j0SyncManifest.classifications.NEW_FILE, 48);
  assert.equal(result.j0SyncManifest.syncModes.FULL_SNAPSHOT, 16);
  assert.equal(result.j0SyncManifest.syncModes.DELTA_UPSERT, 6);
  assert.equal(result.j0SyncManifest.syncModes.DELTA_APPEND, 3);
  assert.ok(result.files.every((file) => file.syncMode && file.businessKey && file.schemaHash));
  assert.ok(result.files.every((file) => Number.isInteger(file.rowCount) && Number.isInteger(file.fieldCount)));
  assert.equal(result.boundaries.evaluatorTruthInSourceRegistry, false);
  assert.equal(result.boundaries.productRuntimeClaimAllowed, false);
  assert.ok(result.files.every((file) => !file.path.startsWith("04-restricted-evaluator-design/")));
  assert.ok(result.files.every((file) => !file.path.startsWith("05-validation/")));
  assert.ok(result.files.every((file) => !file.path.startsWith("06-review-package/")));
}

function testEvaluatorPlan() {
  const result = parseJson(run(["--tenant", TENANT, "--release-id", RELEASE, "--scope", "evaluator", "--mode", "plan"]));
  assert.equal(result.status, "planned");
  assert.equal(result.scope, "evaluator");
  assert.equal(result.expectedCount, 2);
  assert.equal(result.evaluatorVisibleCount, 2);
  assert.equal(result.parserVisibleCount, 0);
  assert.ok(result.files.every((file) => file.path.startsWith("04-restricted-evaluator-design/")));
}

function testExecuteRequiresAck() {
  const failed = spawnSync(
    process.execPath,
    [SCRIPT, "--tenant", TENANT, "--release-id", RELEASE, "--scope", "operational", "--mode", "execute"],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, ABARVA_SOURCE_LANDING_EXECUTE_ACK: "" },
      encoding: "utf8",
    },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /execute_ack_missing/);
}

function testWrongTenantBlocked() {
  const failed = spawnSync(
    process.execPath,
    [SCRIPT, "--tenant", "all", "--release-id", RELEASE, "--scope", "operational", "--mode", "plan"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /tenant_not_authorized/);
}

function testOutFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "airdn-source-landing-"));
  const out = path.join(dir, "plan.json");
  run(["--tenant", TENANT, "--release-id", RELEASE, "--scope", "operational", "--mode", "plan", "--out", out]);
  const result = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.equal(result.expectedCount, 48);
}

function testOperationalPlanDoesNotRequireEvaluatorFiles() {
  const sourceRoot = path.join(REPO_ROOT, "clients", "airline-demo-new", "19-template-instantiation-source-corpus");
  const subsetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "airdn-operational-subset-"));
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "PACKAGE_MANIFEST.json"), "utf8"));
  fs.writeFileSync(path.join(subsetRoot, "PACKAGE_MANIFEST.json"), JSON.stringify(manifest, null, 2));

  for (const file of manifest.files) {
    const p = file.path;
    const evaluator = p.startsWith("04-restricted-evaluator-design/");
    const excluded = p.startsWith("05-validation/") || p.startsWith("06-review-package/");
    if (evaluator || excluded) continue;
    const from = path.join(sourceRoot, p);
    const to = path.join(subsetRoot, p);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }

  const result = parseJson(
    run([
      "--tenant",
      TENANT,
      "--release-id",
      RELEASE,
      "--scope",
      "operational",
      "--mode",
      "plan",
      "--package-root",
      subsetRoot,
    ]),
  );
  assert.equal(result.expectedCount, 48);
  assert.equal(result.evaluatorVisibleCount, 0);
}

function testOperationalLandingUsesEffectiveRunRefForRetries() {
  const source = fs.readFileSync(SCRIPT, "utf8");
  assert.match(source, /let effectiveRunRef = result\.runId/);
  assert.match(source, /RETURNING run_ref/);
  assert.match(source, /result\.effectiveRunRef = effectiveRunRef/);
  assert.match(source, /registered_run_ref = EXCLUDED\.registered_run_ref/);
  assert.match(source, /file\.parserVisible \? "client_visible" : "internal_ops",\s+effectiveRunRef,/);
  assert.match(source, /created_run_ref = EXCLUDED\.created_run_ref/);
  assert.match(source, /result\.manifestRef, effectiveRunRef/);
}

const tests = [
  testOperationalPlan,
  testEvaluatorPlan,
  testExecuteRequiresAck,
  testWrongTenantBlocked,
  testOutFile,
  testOperationalPlanDoesNotRequireEvaluatorFiles,
  testOperationalLandingUsesEffectiveRunRefForRetries,
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}
