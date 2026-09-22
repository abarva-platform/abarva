import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const PACKAGE_PATH = "package.json";
const JOB_SCRIPT = "scripts/source/load-servicenow-sourcing-requests-job.ts";
const WORKFLOW_PATH = ".github/workflows/source-servicenow-request-import-job.yml";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function baseEnv(outDir) {
  return {
    ...process.env,
    SOURCE_SERVICENOW_REQUEST_IMPORT_TENANT_KEY: "corpus_global",
    SOURCE_SERVICENOW_REQUEST_IMPORT_LOAD_RUN_ID: "job-test-run",
    SOURCE_SERVICENOW_REQUEST_IMPORT_IDEMPOTENCY_KEY: "job-test-idempotency",
    SOURCE_SERVICENOW_REQUEST_IMPORT_OUT_DIR: outDir,
    SOURCE_SERVICENOW_REQUEST_IMPORT_EMIT_PROOF_BUNDLE: "true",
  };
}

test("ServiceNow request import job is exposed as an npm script", () => {
  const pkg = JSON.parse(read(PACKAGE_PATH));
  const command = pkg.scripts["source:servicenow-requests:proof-job"];
  assert.equal(typeof command, "string");
  assert.match(command, /load-servicenow-sourcing-requests-job\.ts/);
});

test("operator wrapper extracts the ServiceNow proof-bundle marker", () => {
  const wrapper = read("scripts/ops/submit-aca-operator-job.mjs");
  assert.match(wrapper, /__SOURCE_SERVICENOW_REQUEST_IMPORT_PROOF_TGZ_BEGIN__/);
  assert.match(wrapper, /source_servicenow_request_import/);
});

test("job dry-run writes proof artifacts without database access", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "sn-request-job-"));
  const result = spawnSync(
    "npm",
    ["run", "source:servicenow-requests:proof-job"],
    {
      cwd: process.cwd(),
      env: baseEnv(outDir),
      encoding: "utf8",
      timeout: 30_000,
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /__SOURCE_SERVICENOW_REQUEST_IMPORT_PROOF_TGZ_BEGIN__/);
  const contract = JSON.parse(read(path.join(outDir, "00-job-contract.json")));
  const validation = JSON.parse(read(path.join(outDir, "02-validation-output.json")));
  const qualityGate = JSON.parse(read(path.join(outDir, "03-quality-gate.json")));
  const summary = JSON.parse(read(path.join(outDir, "04-summary.json")));

  assert.equal(contract.tenantScope, "corpus_global");
  assert.equal(contract.idempotencyKey, "job-test-idempotency");
  assert.equal(validation.rowCount, 10);
  assert.deepEqual(validation.missingArchetypes, []);
  assert.equal(qualityGate.status, "PASS");
  assert.equal(qualityGate.dryRunDefault, true);
  assert.equal(qualityGate.migrationsApplied, false);
  assert.equal(summary.committed, false);
});

test("job apply mode fails closed before database access without exact approval", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "sn-request-job-apply-"));
  const result = spawnSync(
    "npm",
    ["run", "source:servicenow-requests:proof-job"],
    {
      cwd: process.cwd(),
      env: {
        ...baseEnv(outDir),
        SOURCE_SERVICENOW_REQUEST_IMPORT_MODE: "apply",
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:1/postgres",
      },
      encoding: "utf8",
      timeout: 30_000,
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /APPLY_APPROVED=true/);
  assert.doesNotMatch(result.stderr, /ECONNREFUSED|connection/i);
});

test("workflow defaults to dry-run and requires exact apply confirmation", () => {
  const workflow = read(WORKFLOW_PATH);
  assert.match(workflow, /default:\s+dry_run/);
  assert.match(workflow, /confirm_apply/);
  assert.match(workflow, /APPLY_SERVICENOW_REQUESTS/);
  assert.match(workflow, /source:servicenow-requests:proof-job/);
  assert.doesNotMatch(workflow, /run-migrations/);
  assert.doesNotMatch(read(JOB_SCRIPT), /run-migrations/);
});
