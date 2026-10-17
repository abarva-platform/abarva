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
import { InMemoryKnowledgeExecutionStore } from "../processing/executor-framework.mjs";

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
const rollingRuntimeDigest = "sha256:a6007ebb55e5b7a64048377da52260f71efa1dcd5d27ec222de079a379675181";
const rollingRuntimeImage = `acrabarvalab001.azurecr.io/abarva/web@${rollingRuntimeDigest}`;

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

await test("exactly fifteen tenant-neutral process contracts are registered", () => {
  assert.equal(PROCESS_CONTRACTS.length, 15);
  assert.equal(new Set(PROCESS_CONTRACTS.map((contract) => contract.suffix)).size, 15);
});

await test("narrative generation runs after projection build and before Home read model", () => {
  const order = PROCESS_CONTRACTS.map((contract) => contract.suffix);
  assert.ok(order.indexOf("projection-build-v1") < order.indexOf("knowledge-narrative-generate-v1"));
  assert.ok(order.indexOf("knowledge-narrative-generate-v1") < order.indexOf("home-readmodel-v1"));
});

await test("all fifteen process contracts pass preflight and write a standard audit envelope", async () => {
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

await test("all fifteen process contracts pass no-op dispatch without network access", async () => {
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
  assert.equal(envelope.status, "process_passed");
  assert.equal(envelope.networkAccessAttempted, true);
  assert.equal(envelope.processExecution.status, "passed");
  assert.equal(networkCalls, 1);
});

await test("execute mode cannot report dispatch-only success when network is disabled", async () => {
  const contract = PROCESS_CONTRACTS[0];
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute", ["--no-network"]),
    env: { ...envFor(contract), ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
  });
  assert.equal(envelope.status, "failed_process");
  assert.equal(envelope.error.code, "execute_network_disabled");
  assert.equal(envelope.networkAccessAttempted, false);
});

await test("source-register execute verifies landed source registry counts", async () => {
  const contract = PROCESS_CONTRACTS.find((item) => item.suffix === "source-register-v1");
  const store = new InMemoryKnowledgeExecutionStore({
    sourceSummary: {
      source_count: 48,
      parser_visible_count: 25,
      evaluator_visible_count: 0,
      non_blob_uri_count: 0,
      release_scoped_count: 48,
    },
  });
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute", ["--release-id", "airline-demo-new-source-corpus-v1.0.0"]),
    env: {
      ...envFor(contract),
      ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB",
      ABARVA_RELEASE_ID: "airline-demo-new-source-corpus-v1.0.0",
    },
    stdout: false,
    store,
  });
  assert.equal(envelope.status, "process_passed");
  assert.equal(envelope.processExecution.inputCount, 48);
  assert.equal(envelope.processExecution.outputCount, 48);
  assert.equal(envelope.processExecution.acceptedCount, 25);
  assert.equal(envelope.processExecution.blockers.length, 0);
});

await test("source-register execute blocks evaluator leakage before success", async () => {
  const contract = PROCESS_CONTRACTS.find((item) => item.suffix === "source-register-v1");
  const store = new InMemoryKnowledgeExecutionStore({
    sourceSummary: {
      source_count: 48,
      parser_visible_count: 25,
      evaluator_visible_count: 2,
      non_blob_uri_count: 0,
      release_scoped_count: 48,
    },
  });
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute", ["--release-id", "airline-demo-new-source-corpus-v1.0.0"]),
    env: {
      ...envFor(contract),
      ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB",
      ABARVA_RELEASE_ID: "airline-demo-new-source-corpus-v1.0.0",
    },
    stdout: false,
    store,
  });
  assert.equal(envelope.status, "failed_process");
  assert.equal(envelope.error.code, "process_verification_failed");
  assert.ok(envelope.error.details.blockers.includes("evaluator_source_registry_leakage"));
});

await test("source-parse execute parses structured rows without dispatch-only success", async () => {
  const contract = PROCESS_CONTRACTS.find((item) => item.suffix === "source-parse-v1");
  const store = new InMemoryKnowledgeExecutionStore({
    parserVisibleSources: [
      {
        sourceRef: "src-apps",
        sourceVersionRef: "src-apps-v1",
        sourceName: "application-platform-inventory.csv",
        sourceFamily: "parser_visible_source_sample",
        parserContractRef: "airline-source-parser-visible-v1",
        contentText: "application_id,application_name\nAPP-1,Ops Control\n",
      },
    ],
  });
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: { ...envFor(contract), ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    store,
  });
  assert.equal(envelope.status, "process_passed");
  assert.equal(envelope.processExecution.inputCount, 1);
  assert.equal(envelope.processExecution.outputCount, 1);
  assert.equal(store.parsedRecords.length, 1);
});

await test("review execute fails closed without explicit review decisions", async () => {
  const contract = PROCESS_CONTRACTS.find((item) => item.suffix === "knowledge-review-v1");
  const store = new InMemoryKnowledgeExecutionStore({
    entityCandidates: [{ candidateRef: "entcand-1", entityType: "application", displayName: "Ops Control" }],
    resolvedCandidates: [{ candidateRef: "entcand-1", entityRef: "application:ops-control", entityType: "application", displayName: "Ops Control" }],
  });
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: { ...envFor(contract), ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    store,
  });
  assert.equal(envelope.status, "failed_process");
  assert.equal(envelope.error.code, "process_verification_failed");
  assert.ok(envelope.error.details.blockers.includes("no_explicit_accepted_review_decisions"));
});

await test("metric parity is a first-class governed process", async () => {
  const contract = PROCESS_CONTRACTS.find((item) => item.suffix === "metric-parity-v1");
  const store = new InMemoryKnowledgeExecutionStore({
    baselines: [{ tenantKey, knowledgeBaselineRef: "baseline:current", isActive: true }],
    metricParity: {
      knowledgeBaselineRef: "baseline:current",
      passedCount: 4,
      failedCount: 0,
      notApplicableCount: 4,
      measures: [{ measure: "application_count", cube: 10, canonical: 10, state: "passed" }],
    },
  });
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: { ...envFor(contract), ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    store,
  });
  assert.equal(envelope.status, "process_passed");
  assert.equal(envelope.processExecution.outputCount, 8);
  assert.equal(envelope.processExecution.conflictCount, 0);
});

await test("metric parity fails closed on mismatched measures", async () => {
  const contract = PROCESS_CONTRACTS.find((item) => item.suffix === "metric-parity-v1");
  const store = new InMemoryKnowledgeExecutionStore({
    baselines: [{ tenantKey, knowledgeBaselineRef: "baseline:current", isActive: true }],
    metricParity: {
      knowledgeBaselineRef: "baseline:current",
      passedCount: 3,
      failedCount: 1,
      notApplicableCount: 4,
      measures: [{ measure: "vendor_count", cube: 4, canonical: 5, state: "failed" }],
    },
  });
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: { ...envFor(contract), ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB" },
    stdout: false,
    store,
  });
  assert.equal(envelope.status, "failed_process");
  assert.ok(envelope.error.details.blockers.includes("metric_parity_failed"));
});

await test("execute mode blocks in-memory default store fallback", async () => {
  const contract = PROCESS_CONTRACTS.find((item) => item.suffix === "metric-parity-v1");
  const envelope = await runJobRunner({
    argv: argvFor(contract, "execute"),
    env: {
      ...envFor(contract),
      ABARVA_HCDN_EXECUTE_ACK: "EXECUTE_SHARED_TENANT_JOB",
      ABARVA_HCDN_USE_IN_MEMORY_STORE: "true",
    },
    stdout: false,
  });
  assert.equal(envelope.status, "failed_guard");
  assert.equal(envelope.error.code, "in_memory_store_execute_blocked");
  assert.equal(envelope.networkAccessAttempted, true);
});

await test("rolling digest-pinned runtime images pass without strict image lock", async () => {
  const contract = PROCESS_CONTRACTS[0];
  const envelope = await runJobRunner({
    argv: argvFor(contract, "preflight"),
    env: envFor(contract, {
      ABARVA_HCDN_IMAGE: rollingRuntimeImage,
      ABARVA_HCDN_IMAGE_DIGEST: rollingRuntimeDigest,
    }),
    stdout: false,
  });
  assert.equal(envelope.status, "preflight_passed");
  assert.equal(envelope.networkAccessAttempted, false);
  assert.ok(envelope.guardResults.find((guard) => guard.name === "manifest_image_digest_pin" && guard.status === "passed"));
  assert.ok(envelope.guardResults.find((guard) => guard.name === "runtime_image_digest_pin" && guard.status === "passed"));
  assert.ok(envelope.guardResults.find((guard) => guard.name === "runtime_image_digest" && guard.status === "passed"));
});

await test("strict image lock rejects a digest-pinned runtime image that differs from the boundary snapshot", async () => {
  const contract = PROCESS_CONTRACTS[0];
  const envelope = await runJobRunner({
    argv: argvFor(contract, "preflight"),
    env: envFor(contract, {
      ABARVA_HCDN_IMAGE: rollingRuntimeImage,
      ABARVA_HCDN_IMAGE_DIGEST: rollingRuntimeDigest,
      ABARVA_HCDN_STRICT_IMAGE_LOCK: "true",
    }),
    stdout: false,
  });
  assert.equal(envelope.status, "failed_guard");
  assert.equal(envelope.error.code, "strict_image_lock_mismatch");
  assert.equal(envelope.networkAccessAttempted, false);
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

await test("default manifest resolution prefers packaged runtime boundary snapshots when present", () => {
  const previousBoundaryDir = process.env.ABARVA_TENANT_BOUNDARY_DIR;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hcdn-boundaries-"));
  const packagedTenantDir = path.join(tmpDir, tenantKey);
  fs.mkdirSync(packagedTenantDir, { recursive: true });
  const packagedSnapshot = path.join(packagedTenantDir, "APPROVED_BOUNDARY_SNAPSHOT.json");
  fs.writeFileSync(packagedSnapshot, "{}\n");
  process.env.ABARVA_TENANT_BOUNDARY_DIR = tmpDir;
  try {
    assert.equal(resolveDefaultBoundarySnapshot(tenantKey), packagedSnapshot);
  } finally {
    if (previousBoundaryDir === undefined) {
      delete process.env.ABARVA_TENANT_BOUNDARY_DIR;
    } else {
      process.env.ABARVA_TENANT_BOUNDARY_DIR = previousBoundaryDir;
    }
  }
});

await test("validateTenantKey returns only a single canonical slug", () => {
  assert.equal(validateTenantKey("airline-demo-new"), "airline-demo-new");
});

if (failures > 0) {
  console.error(`\n${failures} hcdn-job-runner test(s) failed.`);
  process.exit(1);
}

console.log(`\nAll hcdn-job-runner tests passed across ${PROCESS_CONTRACTS.length} process contracts.`);
