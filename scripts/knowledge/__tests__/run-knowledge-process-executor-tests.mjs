#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  InMemoryKnowledgeExecutionStore,
  KnowledgeProcessError,
  PostgresKnowledgeExecutionStore,
  checkpointFor,
  createProcessResult,
  runKnowledgeProcess,
} from "../processing/executor-framework.mjs";
import { DEFAULT_PROCESS_HANDLERS, assertTerminalSourceState } from "../processing/process-handlers.mjs";
import { evaluateSemanticGateRecords } from "../processing/semantic-gates.mjs";

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

function baseContext(overrides = {}) {
  return {
    tenantKey: "airline-demo-new",
    releaseId: "airline-demo-new-source-corpus-v1.0.0",
    manifestHash: "manifest-hash",
    runId: "executor-test-run",
    idempotencyKey: "executor-test-idempotency",
    processName: "airline-demo-new-source-register-v1",
    canonicalProcess: "source-register-v1",
    stageNames: ["01_register_source", "02_store_immutable_source_version"],
    sourceRunRef: "airdn-operational-source-landing-20260727",
    scope: "operational",
    domain: null,
    env: {},
    ...overrides,
  };
}

await test("source-register handler passes only after verified counts and checkpoints", async () => {
  const context = baseContext();
  const store = new InMemoryKnowledgeExecutionStore({
    sourceSummary: {
      source_count: 48,
      parser_visible_count: 25,
      evaluator_visible_count: 0,
      non_blob_uri_count: 0,
      release_scoped_count: 48,
    },
  });
  const result = await runKnowledgeProcess({
    context,
    handler: DEFAULT_PROCESS_HANDLERS["source-register-v1"],
    store,
  });
  assert.equal(result.status, "passed");
  assert.equal(result.inputCount, 48);
  assert.equal(result.outputCount, 48);
  assert.equal(result.acceptedCount, 25);
  assert.equal(result.checkpoints.length, 4);
});

await test("idempotent replay returns a passed replay result without duplicate business output", async () => {
  const context = baseContext();
  const store = new InMemoryKnowledgeExecutionStore({
    sourceSummary: {
      source_count: 48,
      parser_visible_count: 25,
      evaluator_visible_count: 0,
      non_blob_uri_count: 0,
      release_scoped_count: 48,
    },
  });
  await runKnowledgeProcess({ context, handler: DEFAULT_PROCESS_HANDLERS["source-register-v1"], store });
  const replay = await runKnowledgeProcess({ context, handler: DEFAULT_PROCESS_HANDLERS["source-register-v1"], store });
  assert.equal(replay.status, "passed");
  assert.deepEqual(replay.warnings, ["idempotent_replay_existing_passed_run"]);
  assert.equal(store.outputs.length, 1);
});

await test("concurrent run lock blocks a second worker for the same scope", async () => {
  const context = baseContext();
  const lockKey = `${context.tenantKey}:${context.processName}:${context.idempotencyKey}`;
  const store = new InMemoryKnowledgeExecutionStore({ locked: [lockKey] });
  await assert.rejects(
    () => runKnowledgeProcess({ context, handler: DEFAULT_PROCESS_HANDLERS["source-register-v1"], store }),
    (error) => error instanceof KnowledgeProcessError && error.code === "run_lock_busy",
  );
});

await test("postgres retry updates failed idempotency rows to the current run ref", async () => {
  const context = baseContext({
    actorRef: "aca-job:ingest",
    imageDigest: "sha256:test",
    canonicalProcess: "knowledge-validate-v1",
    processName: "airline-demo-new-knowledge-validate-v1",
    runId: "executor-test-run-retry",
    idempotencyKey: "same-idempotency-after-failed-run",
  });
  const calls = [];
  const client = {
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      if (String(sql).includes("SELECT run_state, metadata FROM operations.run")) {
        return { rows: [{ run_state: "failed", metadata: {} }] };
      }
      return { rows: [] };
    },
  };
  const store = new PostgresKnowledgeExecutionStore(client);
  const lock = await store.acquireRunLock(context);
  assert.equal(lock.replayed, false);
  const upsert = calls.find((call) => call.sql.includes("ON CONFLICT (tenant_key, idempotency_key)"));
  assert.ok(upsert?.sql.includes("run_ref=EXCLUDED.run_ref"));
  assert.ok(upsert?.sql.includes("completed_at=null"));
});

await test("postgres failure recording rolls back aborted transactions before writing failure state", async () => {
  const context = baseContext({
    actorRef: "aca-job:ingest",
    imageDigest: "sha256:test",
    canonicalProcess: "knowledge-validate-v1",
    processName: "airline-demo-new-knowledge-validate-v1",
    runId: "executor-test-run-failure",
    idempotencyKey: "failure-recording-after-aborted-transaction",
  });
  const calls = [];
  const client = {
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      return { rows: [] };
    },
  };
  const store = new PostgresKnowledgeExecutionStore(client);
  store.inTransaction = true;
  await store.failProcessResult(context, new Error("simulated root error"));
  assert.equal(calls[0].sql, "ROLLBACK");
  assert.ok(calls.some((call) => call.sql === "BEGIN"));
  const failureUpsert = calls.find((call) => call.sql.includes("VALUES ($1,$2,$3,$4,$5,'failed'"));
  assert.ok(failureUpsert?.sql.includes("ON CONFLICT (tenant_key, idempotency_key)"));
  assert.ok(failureUpsert?.sql.includes("run_ref=EXCLUDED.run_ref"));
  assert.equal(store.inTransaction, false);
});

await test("missing handler is a hard failure, not a dispatch success", async () => {
  const context = baseContext({ canonicalProcess: "unknown-process-v1" });
  const store = new InMemoryKnowledgeExecutionStore();
  await assert.rejects(
    () => runKnowledgeProcess({ context, handler: null, store }),
    (error) => error instanceof KnowledgeProcessError && error.code === "handler_not_available",
  );
});

await test("terminal source states are a closed vocabulary", () => {
  for (const state of ["parsed", "parsed_with_warnings", "quarantined", "failed", "not_applicable"]) {
    assert.doesNotThrow(() => assertTerminalSourceState(state));
  }
  assert.throws(() => assertTerminalSourceState("silently_skipped"), /Invalid terminal source state/);
});

await test("semantic gates block missing-as-zero, withheld drift, candidate acceptance, target/current drift and broken endpoints", () => {
  const gate = evaluateSemanticGateRecords({
    entities: [{ entity_ref: "app-1" }],
    facts: [
      { fact_ref: "fact-missing-zero", availability_state: "not_loaded", fact_value: 0, source_value: null },
      { fact_ref: "fact-withheld", disclosure_mode: "withheld", availability_state: "available" },
      { candidate_ref: "candidate-promoted", review_state: "not_reviewed", authority_state: "accepted" },
    ],
    relationships: [
      { relationship_ref: "target-now-current", from_entity_ref: "app-1", to_entity_ref: "app-2", current_target_state: "target", relationship_payload: { current: true } },
    ],
  });
  assert.equal(gate.passed, false);
  assert.deepEqual(
    gate.blockers.map((blocker) => blocker.code).sort(),
    [
      "broken_relationship_endpoint",
      "candidate_marked_accepted",
      "missing_coerced_to_zero",
      "target_reinterpreted_as_current",
      "withheld_not_marked_withheld",
    ].sort(),
  );
});

await test("custom handler must verify before commit", async () => {
  const context = baseContext({ canonicalProcess: "source-parse-v1", processName: "airline-demo-new-source-parse-v1" });
  const store = new InMemoryKnowledgeExecutionStore();
  const badHandler = {
    processName: "source-parse-v1",
    async plan() {
      return { inputContentHash: "input-hash" };
    },
    async execute(ctx, plan) {
      return createProcessResult({
        context: ctx,
        plan,
        status: "passed",
        counts: { input: 1, output: 1 },
        checkpoints: [checkpointFor(ctx, "parser invoked", "passed", 1, 1)],
        blockers: ["parser_silent_skip"],
      });
    },
    async verify() {
      return { passed: true, blockers: [] };
    },
  };
  await assert.rejects(
    () => runKnowledgeProcess({ context, handler: badHandler, store }),
    (error) => error instanceof KnowledgeProcessError && error.code === "process_invariant_failed",
  );
});

await test("parser extracts structured CSV rows into terminal parsed records", async () => {
  const context = baseContext({
    canonicalProcess: "source-parse-v1",
    processName: "airline-demo-new-source-parse-v1",
    idempotencyKey: "parse-test",
  });
  const store = new InMemoryKnowledgeExecutionStore({
    parserVisibleSources: [
      {
        sourceRef: "src-apps",
        sourceVersionRef: "src-apps-v1",
        sourceName: "application-platform-inventory.csv",
        sourceFamily: "parser_visible_source_sample",
        parserContractRef: "airline-source-parser-visible-v1",
        contentText: "application_id,application_name,business_function\nAPP-1,Ops Control,Operations\nAPP-2,Crew Portal,Crew\n",
      },
    ],
  });
  const result = await runKnowledgeProcess({
    context,
    handler: DEFAULT_PROCESS_HANDLERS["source-parse-v1"],
    store,
  });
  assert.equal(result.status, "passed");
  assert.equal(result.inputCount, 1);
  assert.equal(result.outputCount, 2);
  assert.equal(store.parsedRecords[0].terminalState, "parsed");
});

await test("evidence extraction creates lineage-backed candidates without accepting knowledge", async () => {
  const context = baseContext({
    canonicalProcess: "evidence-extract-v1",
    processName: "airline-demo-new-evidence-extract-v1",
    idempotencyKey: "evidence-test",
  });
  const store = new InMemoryKnowledgeExecutionStore({
    parserVisibleSources: [
      {
        sourceRef: "src-rel",
        sourceVersionRef: "src-rel-v1",
        sourceName: "relationship-load-template.csv",
        sourceFamily: "parser_visible_source_sample",
        parserContractRef: "airline-source-parser-visible-v1",
        contentText:
          "relationship_id,from_object_type,from_source_native_id,relationship_type,to_object_type,to_source_native_id,current_target_state\nREL-1,application,APP-1,depends_on,data_product,DATA-1,current\n",
      },
    ],
  });
  const result = await runKnowledgeProcess({
    context,
    handler: DEFAULT_PROCESS_HANDLERS["evidence-extract-v1"],
    store,
  });
  assert.equal(result.status, "passed");
  assert.equal(store.evidenceRecords.length, 1);
  assert.equal(store.entityCandidates.length, 1);
  assert.equal(store.factCandidates.length, 1);
  assert.equal(store.relationshipCandidates.length, 1);
  assert.equal(store.knowledgeEntities.length, 0);
});

await test("review apply blocks without explicit accepted review decisions", async () => {
  const context = baseContext({
    canonicalProcess: "knowledge-review-v1",
    processName: "airline-demo-new-knowledge-review-v1",
    idempotencyKey: "review-no-decisions-test",
  });
  const store = new InMemoryKnowledgeExecutionStore({
    entityCandidates: [{ candidateRef: "entcand-1", entityType: "application", displayName: "Ops Control" }],
    resolvedCandidates: [{ candidateRef: "entcand-1", entityRef: "application:ops-control", entityType: "application", displayName: "Ops Control" }],
  });
  await assert.rejects(
    () => runKnowledgeProcess({ context, handler: DEFAULT_PROCESS_HANDLERS["knowledge-review-v1"], store }),
    (error) => error instanceof KnowledgeProcessError && error.code === "process_verification_failed",
  );
  assert.equal(store.knowledgeEntities.length, 0);
});

await test("hidden truth validation allows ordinary evaluator notes but blocks restricted markers", async () => {
  const allowedStore = new InMemoryKnowledgeExecutionStore({
    entityCandidates: [
      {
        candidateRef: "entcand-eval-note",
        entityType: "procurement_event",
        displayName: "Evaluation Scorecard",
        payload: { evaluator_note: "synthetic scorecard; final decision requires signoff" },
      },
    ],
  });
  const allowed = await runKnowledgeProcess({
    context: baseContext({
      canonicalProcess: "knowledge-validate-v1",
      processName: "airline-demo-new-knowledge-validate-v1",
      idempotencyKey: "hidden-truth-marker-allowed-test",
    }),
    handler: DEFAULT_PROCESS_HANDLERS["knowledge-validate-v1"],
    store: allowedStore,
  });
  assert.equal(allowed.status, "passed");
  assert.equal(allowedStore.validationLedger[0].hiddenTruthReferences, 0);

  const blockedStore = new InMemoryKnowledgeExecutionStore({
    entityCandidates: [
      {
        candidateRef: "entcand-hidden-truth",
        entityType: "evaluator_fixture",
        displayName: "Restricted Boundary",
        payload: { boundary: "restricted_evaluator_only_not_parser_visible" },
      },
    ],
  });
  await assert.rejects(
    () =>
      runKnowledgeProcess({
        context: baseContext({
          canonicalProcess: "knowledge-validate-v1",
          processName: "airline-demo-new-knowledge-validate-v1",
          idempotencyKey: "hidden-truth-marker-blocked-test",
        }),
        handler: DEFAULT_PROCESS_HANDLERS["knowledge-validate-v1"],
        store: blockedStore,
      }),
    (error) => error instanceof KnowledgeProcessError && error.details.blockers.includes("hidden_truth_references"),
  );
});

await test("explicit review decisions promote accepted candidates and projections build from active baseline", async () => {
  const store = new InMemoryKnowledgeExecutionStore({
    entityCandidates: [{ candidateRef: "entcand-1", entityType: "application", displayName: "Ops Control", payload: { source_native_id: "APP-1" } }],
    resolvedCandidates: [{ candidateRef: "entcand-1", entityRef: "application:ops-control", entityType: "application", displayName: "Ops Control", payload: { source_native_id: "APP-1" } }],
    factCandidates: [{ candidateRef: "factcand-1", subjectCandidateRef: "entcand-1", factType: "application_source_row", factValue: { current: true } }],
    reviewDecisions: [
      { reviewedObjectRef: "entcand-1", reviewState: "accepted" },
      { reviewedObjectRef: "factcand-1", reviewState: "accepted" },
    ],
  });
  for (const [canonicalProcess, processName, idempotencyKey] of [
    ["knowledge-review-v1", "airline-demo-new-knowledge-review-v1", "review-accepted-test"],
    ["domain-publish-v1", "airline-demo-new-domain-publish-v1", "domain-publish-test"],
    ["baseline-publish-v1", "airline-demo-new-baseline-publish-v1", "baseline-publish-test"],
    ["projection-build-v1", "airline-demo-new-projection-build-v1", "projection-build-test"],
    ["home-readmodel-v1", "airline-demo-new-home-readmodel-v1", "home-readmodel-test"],
    ["reconciliation-audit-v1", "airline-demo-new-reconciliation-audit-v1", "reconciliation-test"],
  ]) {
    const result = await runKnowledgeProcess({
      context: baseContext({ canonicalProcess, processName, idempotencyKey, domain: "enterprise" }),
      handler: DEFAULT_PROCESS_HANDLERS[canonicalProcess],
      store,
    });
    assert.equal(result.status, "passed", canonicalProcess);
  }
  assert.equal(store.knowledgeEntities.length, 1);
  assert.equal(store.baselines.find((row) => row.isActive)?.knowledgeBaselineRef, "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1");
  assert.ok(store.projections.length > 0);
  assert.equal(store.reconciliationLedger.length, 1);
});

if (failures > 0) {
  console.error(`\n${failures} knowledge-process-executor test(s) failed.`);
  process.exit(1);
}

console.log("\nAll knowledge-process-executor tests passed.");
