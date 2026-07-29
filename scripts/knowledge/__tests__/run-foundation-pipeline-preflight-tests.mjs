#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildSummary, readCsvRecords, validateJob } from "../foundation-pipeline-preflight.mjs";

let failures = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`[FAIL] ${name}`);
    console.error(error?.stack ?? error);
  }
}

const row = Object.freeze({
  stage: "17_cube_metric_parity",
  approved_process_name: "airline-demo-new-metric-parity-v1",
  reserved_aca_job_name: "job-airdn-metric-parity-lab",
  managed_identity: "mi-airdn-evaluator-lab-001",
  database_role: "airline_demo_new_evaluator",
  status: "plan_only_ready",
});

const options = Object.freeze({
  tenant: "airline-demo-new",
  resourceGroup: "rg-abarva-airdn-lab-eus2-001",
  expectedImage: "acrabarvalab001.azurecr.io/abarva/web@sha256:58cd9f0b8636d17fd823297ba45daca6ef3839d8a455de42ed55b4bf2b379e4e",
});

function mutableImageReference() {
  return ["acrabarvalab001.azurecr.io/abarva/web", "latest"].join(":");
}

function goodJob(overrides = {}) {
  const env = [
    { name: "ABARVA_TENANT_KEY", value: "airline-demo-new" },
    { name: "ABARVA_HCDN_STAGE", value: row.stage },
    { name: "PGHOST", value: "pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com" },
    { name: "PGDATABASE", value: "abarva_airline_demo_new_knowledge_lab" },
    { name: "PGUSER", value: row.managed_identity },
    { name: "ABARVA_POSTGRES_AAD_CLIENT_ID", value: "00000000-0000-0000-0000-000000000001" },
    { name: "MANAGED_IDENTITY_CLIENT_ID", value: "00000000-0000-0000-0000-000000000001" },
    ...(overrides.env ?? []),
  ];
  return {
    name: row.reserved_aca_job_name,
    identity: {
      type: "UserAssigned",
      userAssignedIdentities: {
        [`/subscriptions/000/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/${overrides.identityName ?? row.managed_identity}`]: {},
      },
    },
    properties: {
      configuration: {
        triggerType: overrides.triggerType ?? "Manual",
        replicaTimeout: 3600,
        replicaRetryLimit: 1,
      },
      template: {
        containers: [
          {
            name: "airdn-job",
            image: overrides.image ?? options.expectedImage,
            command: ["/bin/sh"],
            args: [
              "-lc",
              overrides.command ??
                `node scripts/knowledge/hcdn-job-runner.mjs --tenant airline-demo-new --process ${row.approved_process_name} --stage ${row.stage}`,
            ],
            env,
          },
        ],
      },
    },
  };
}

function failingCheckIds(result) {
  return result.checks.filter((check) => check.status !== "pass").map((check) => check.id);
}

await test("CSV reader preserves the stage map contract columns", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "foundation-preflight-"));
  const file = path.join(dir, "JOB_STAGE_MAP.csv");
  fs.writeFileSync(file, "stage,approved_process_name,reserved_aca_job_name,managed_identity,database_role,status\n01,a,b,c,d,e\n");
  assert.deepEqual(readCsvRecords(file), [
    {
      stage: "01",
      approved_process_name: "a",
      reserved_aca_job_name: "b",
      managed_identity: "c",
      database_role: "d",
      status: "e",
    },
  ]);
});

await test("valid digest-pinned managed-identity job passes", () => {
  const result = validateJob(row, goodJob(), options);
  assert.equal(result.status, "pass");
  assert.equal(failingCheckIds(result).length, 0);
});

await test("mutable images are rejected", () => {
  const result = validateJob(row, goodJob({ image: mutableImageReference() }), {
    ...options,
    expectedImage: "",
  });
  assert.equal(result.status, "fail");
  assert.ok(failingCheckIds(result).includes("digest_pinned_image"));
});

await test("unexpected runtime digest is rejected when an expected image is supplied", () => {
  const result = validateJob(
    row,
    goodJob({ image: "acrabarvalab001.azurecr.io/abarva/web@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }),
    options,
  );
  assert.equal(result.status, "fail");
  assert.ok(failingCheckIds(result).includes("expected_image"));
});

await test("wrong managed identity is rejected", () => {
  const result = validateJob(row, goodJob({ identityName: "mi-airdn-ingest-lab-001" }), options);
  assert.equal(result.status, "fail");
  assert.ok(failingCheckIds(result).includes("managed_identity_bound"));
});

await test("static PostgreSQL password env is rejected", () => {
  const result = validateJob(row, goodJob({ env: [{ name: "PGPASSWORD", value: "secret-ref-or-value" }] }), options);
  assert.equal(result.status, "fail");
  assert.ok(failingCheckIds(result).includes("no_pgpassword"));
});

await test("old AIRDN-only stage env is rejected until converted to standard HCDN binding", () => {
  const job = goodJob({
    command: `node scripts/knowledge/hcdn-job-runner.mjs --tenant airline-demo-new --process ${row.approved_process_name}`,
    env: [{ name: "ABARVA_AIRDN_STAGE", value: row.stage }],
  });
  job.properties.template.containers[0].env = job.properties.template.containers[0].env.filter((item) => item.name !== "ABARVA_HCDN_STAGE");
  const result = validateJob(row, job, options);
  assert.equal(result.status, "fail");
  assert.ok(failingCheckIds(result).includes("stage_binding"));
});

await test("summary fails when any job fails", () => {
  const pass = validateJob(row, goodJob(), options);
  const fail = validateJob(
    { ...row, reserved_aca_job_name: "job-airdn-source-parse-lab" },
    goodJob({ image: mutableImageReference() }),
    { ...options, expectedImage: "" },
  );
  const summary = buildSummary({
    rows: [row, { ...row, reserved_aca_job_name: "job-airdn-source-parse-lab" }],
    jobResults: [pass, fail],
    options: { ...options, stageMap: "JOB_STAGE_MAP.csv" },
  });
  assert.equal(summary.status, "fail");
  assert.equal(summary.expectedJobs, 2);
  assert.equal(summary.passedJobs, 1);
  assert.equal(summary.failedJobs, 1);
  assert.ok(summary.failedChecks >= 1);
});

if (failures > 0) {
  console.error(`\n${failures} foundation pipeline preflight test(s) failed.`);
  process.exit(1);
}

console.log("\nAll foundation pipeline preflight tests passed.");
