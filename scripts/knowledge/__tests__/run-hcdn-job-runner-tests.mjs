#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROCESS_CONTRACTS,
  loadBoundarySnapshot,
  processNameForTenant,
  resolveDefaultBoundarySnapshot,
  runJobRunner,
  validateTenantKey,
} from "../hcdn-job-runner.mjs";

const __filename = fileURLToPath(import.meta.url);
const scriptPath = path.resolve(path.dirname(__filename), "..", "hcdn-job-runner.mjs");
const tenantKey = "hc-demo-new";
const manifestPath = resolveDefaultBoundarySnapshot(tenantKey);
const { manifest } = loadBoundarySnapshot(manifestPath);

const baseEnv = Object.freeze({
  ABARVA_TENANT_KEY: tenantKey,
  ABARVA_HCDN_ENVIRONMENT: "lab",
  ABARVA_HCDN_DATABASE: "abarva_hc_demo_new_knowledge_lab",
  ABARVA_HCDN_STORAGE_ACCOUNT: "stabhcdemonewlab001",
  ABARVA_HCDN_SUBSCRIPTION_ID: "701a8554-a166-46e9-bf13-743bc50e3b20",
  ABARVA_HCDN_IMAGE: manifest.container_image.image,
  ABARVA_HCDN_IMAGE_DIGEST: manifest.container_image.image_digest,
});

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

function envFor(contract, overrides = {}) {
  const processName = processNameForTenant(tenantKey, contract);
  return {
    ...baseEnv,
    ABARVA_HCDN_PROCESS: processName,
    ABARVA_HCDN_STAGE: contract.stages[0],
    ...overrides,
  };
}

function argvFor(contract, mode = "preflight", extra = []) {
  return [
    "--tenant",
    tenantKey,
    "--process",
    processNameForTenant(tenantKey, contract),
    "--stage",
    contract.stages[0],
    "--mode",
    mode,
    "--manifest",
    manifestPath,
    ...extra,
  ];
}

await test("exactly thirteen tenant-neutral process contracts are registered", () => {
  assert.equal(PROCESS_CONTRACTS.length, 13);
  assert.equal(new Set(PROCESS_CONTRACTS.map((contract) => contract.suffix)).size, 13);
});

await test("all thirteen process contracts pass preflight and write a standard audit envelope", async () => {
  for (const contract of PROCESS_CONTRACTS) {
    const envelope = await runJobRunner({
      argv: argvFor(contract, "preflight"),
      env: envFor(contract),
      stdout: false,
    });
    assert.equal(envelope.status, "preflight_passed");
    assert.equal(envelope.schemaVersion, "hcdn-job-runner-envelope/v1");
    assert.equal(envelope.tenantKey, tenantKey);
    assert.equal(envelope.processName, processNameForTenant(tenantKey, contract));
    assert.deepEqual(envelope.stageNames, contract.stages);
    assert.equal(envelope.networkAccessAttempted, false);
    assert.equal(envelope.checkpoints.length, contract.stages.length);
    assert.ok(envelope.guardResults.every((guard) => guard.status === "passed"));
  }
});

await test("all thirteen process contracts pass no-op dispatch without network access", async () => {
  for (const contract of PROCESS_CONTRACTS) {
    let networkCalls = 0;
    const envelope = await runJobRunner({
      argv: argvFor(contract, "noop"),
      env: envFor(contract),
      stdout: false,
      networkProbe: async () => {
        networkCalls += 1;
      },
    });
    assert.equal(envelope.status, "noop_completed");
    assert.equal(envelope.networkAccessAttempted, false);
    assert.equal(networkCalls, 0);
  }
});

await test("multi-stage process contracts preserve all approved stages", async () => {
  const sourceRegister = PROCESS_CONTRACTS.find((contract) => contract.suffix === "source-register-v1");
  const envelope = await runJobRunner({
    argv: argvFor(sourceRegister, "preflight"),
    env: envFor(sourceRegister),
    stdout: false,
  });
  assert.deepEqual(envelope.stageNames, ["01_register_source", "02_store_immutable_source_version"]);
  assert.equal(envelope.checkpoints.length, 2);
});

await test("blank, wildcard and tenant-list scopes are rejected before network access", async () => {
  const invalidTenants = ["", "all", "*", "hc-demo-new,airline-demo-new", "hc-demo-new airline-demo-new", "../hc-demo-new", "hc_demo_new"];
  const contract = PROCESS_CONTRACTS[0];

  for (const invalidTenant of invalidTenants) {
    let networkCalls = 0;
    const envelope = await runJobRunner({
      argv: ["--tenant", invalidTenant, "--process", processNameForTenant(tenantKey, contract), "--mode", "execute"],
      env: { ...envFor(contract), ABARVA_TENANT_KEY: invalidTenant, ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
      stdout: false,
      networkProbe: async () => {
        networkCalls += 1;
      },
    });
    assert.equal(envelope.status, "failed_guard", invalidTenant);
    assert.equal(envelope.networkAccessAttempted, false, invalidTenant);
    assert.equal(networkCalls, 0, invalidTenant);
  }
});

await test("unknown process is rejected before network access", async () => {
  let networkCalls = 0;
  const envelope = await runJobRunner({
    argv: ["--tenant", tenantKey, "--process", `${tenantKey}-not-approved-v1`, "--mode", "execute", "--manifest", manifestPath],
    env: { ...envFor(PROCESS_CONTRACTS[0]), ABARVA_HCDN_PROCESS: `${tenantKey}-not-approved-v1`, ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    networkProbe: async () => {
      networkCalls += 1;
    },
  });
  assert.equal(envelope.status, "failed_guard");
  assert.equal(envelope.error.code, "unknown_process");
  assert.equal(networkCalls, 0);
});

await test("tenant mismatch with manifest is rejected before network access", async () => {
  const contract = PROCESS_CONTRACTS[0];
  const envelope = await runJobRunner({
    argv: ["--tenant", "airline-demo-new", "--process", "airline-demo-new-source-register-v1", "--mode", "preflight", "--manifest", manifestPath],
    env: { ...envFor(contract), ABARVA_TENANT_KEY: "airline-demo-new", ABARVA_HCDN_PROCESS: "airline-demo-new-source-register-v1" },
    stdout: false,
  });
  assert.equal(envelope.status, "failed_guard");
  assert.equal(envelope.error.code, "manifest_tenant_mismatch");
  assert.equal(envelope.networkAccessAttempted, false);
});

await test("database and storage mismatches fail before network access", async () => {
  const contract = PROCESS_CONTRACTS[0];
  const databaseEnvelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: { ...envFor(contract), ABARVA_HCDN_DATABASE: "wrong_database", ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    networkProbe: async () => {
      throw new Error("network must not run");
    },
  });
  assert.equal(databaseEnvelope.status, "failed_guard");
  assert.equal(databaseEnvelope.error.code, "database_mismatch");
  assert.equal(databaseEnvelope.networkAccessAttempted, false);

  const storageEnvelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: { ...envFor(contract), ABARVA_HCDN_STORAGE_ACCOUNT: "wrongstorage", ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    networkProbe: async () => {
      throw new Error("network must not run");
    },
  });
  assert.equal(storageEnvelope.status, "failed_guard");
  assert.equal(storageEnvelope.error.code, "storage_account_mismatch");
  assert.equal(storageEnvelope.networkAccessAttempted, false);
});

await test("env tenant mismatch fails before network access", async () => {
  const contract = PROCESS_CONTRACTS[0];
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: { ...envFor(contract), ABARVA_TENANT_KEY: "airline-demo-new", ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    networkProbe: async () => {
      throw new Error("network must not run");
    },
  });
  assert.equal(envelope.status, "failed_guard");
  assert.equal(envelope.error.code, "tenant_env_mismatch");
  assert.equal(envelope.networkAccessAttempted, false);
});

await test("execute mode calls the injected network probe only after all guards pass", async () => {
  const contract = PROCESS_CONTRACTS[0];
  let networkCalls = 0;
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: { ...envFor(contract), ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    networkProbe: async ({ validation }) => {
      networkCalls += 1;
      assert.equal(validation.processName, processNameForTenant(tenantKey, contract));
    },
  });
  assert.equal(envelope.status, "execute_dispatched");
  assert.equal(envelope.networkAccessAttempted, true);
  assert.equal(networkCalls, 1);
});

await test("CLI preflight writes an envelope file and exits successfully", async () => {
  const contract = PROCESS_CONTRACTS[0];
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hcdn-runner-"));
  const outPath = path.join(tmpDir, "envelope.json");
  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      ...argvFor(contract, "preflight"),
      "--out",
      outPath,
    ],
    {
      env: { ...process.env, ...envFor(contract) },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const envelope = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.equal(envelope.status, "preflight_passed");
  assert.equal(envelope.processName, processNameForTenant(tenantKey, contract));
});

await test("validateTenantKey returns only a single canonical slug", () => {
  assert.equal(validateTenantKey("airline-demo-new"), "airline-demo-new");
});

if (failures > 0) {
  console.error(`\n${failures} hcdn-job-runner test(s) failed.`);
  process.exit(1);
}

console.log(`\nAll hcdn-job-runner tests passed across ${PROCESS_CONTRACTS.length} process contracts.`);
