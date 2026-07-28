#!/usr/bin/env node
import assert from "node:assert/strict";

import { buildDryRunReviewPackage, buildLedgerPackage, dbConnectionConfig, validateDbApplyApproval } from "../build-review-decision-ledger.mjs";
import {
  InMemoryKnowledgeExecutionStore,
  KnowledgeProcessError,
  PostgresKnowledgeExecutionStore,
  checkpointFor,
  createProcessResult,
  runKnowledgeProcess,
} from "../processing/executor-framework.mjs";
import { DEFAULT_PROCESS_HANDLERS, assertTerminalSourceState } from "../processing/process-handlers.mjs";
import {
  buildDecisionRowsForBatch,
  buildReviewBatches,
  candidateContentHash,
  classifyCandidateForReview,
  validateAcceptedDecision,
} from "../processing/review-decision-policy.mjs";
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
  const candidateRows = [
    {
      candidateRef: "entcand-1",
      candidateType: "entity_candidate",
      sourceVersionRef: "src-apps-v1",
      entityType: "application",
      displayName: "Ops Control",
      payload: { source_native_id: "APP-1" },
      evidenceRefs: ["ev-app-1"],
      confidence: 0.91,
    },
    {
      candidateRef: "factcand-1",
      candidateType: "fact_candidate",
      sourceVersionRef: "src-apps-v1",
      subjectCandidateRef: "entcand-1",
      factType: "application_source_row",
      factValue: { current: true },
      evidenceRefs: ["ev-fact-1"],
      confidence: 0.88,
    },
  ];
  const batches = buildReviewBatches({
    tenantKey: "airline-demo-new",
    candidates: candidateRows,
    policyVersion: "knowledge-review-decision-policy-v1",
    validationRunRef: "validate-run-1",
    sourceVersionRef: "src-apps-v1",
    options: { semanticValidationPassed: true, sourceReleaseFrozen: true, tenantFencePassed: true },
  });
  const reviewDecisions = batches.flatMap((batch) =>
    buildDecisionRowsForBatch({
      batch,
      reviewerIdentity: "aca-job:review",
      decision: "accepted",
    }),
  );
  const store = new InMemoryKnowledgeExecutionStore({
    entityCandidates: [candidateRows[0]],
    resolvedCandidates: [{ candidateRef: "entcand-1", entityRef: "application:ops-control", entityType: "application", displayName: "Ops Control", payload: { source_native_id: "APP-1" } }],
    factCandidates: [candidateRows[1]],
    reviewDecisions,
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
      context: baseContext({
        canonicalProcess,
        processName,
        idempotencyKey,
        domain: "enterprise",
        validationRunRef: "validate-run-1",
        actorRef: "aca-job:review",
      }),
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

await test("review decision guard blocks stale hashes and unauthorized reviewers", async () => {
  const candidate = {
    candidateRef: "factcand-stale",
    candidateType: "fact_candidate",
    sourceVersionRef: "src-facts-v1",
    subjectCandidateRef: "entcand-1",
    factType: "kpi_snapshot",
    factValue: { value: "current" },
    evidenceRefs: ["ev-fact-stale"],
    confidence: 0.82,
  };
  const batch = buildReviewBatches({
    tenantKey: "airline-demo-new",
    candidates: [candidate],
    validationRunRef: "validate-run-1",
    sourceVersionRef: "src-facts-v1",
    options: { semanticValidationPassed: true, sourceReleaseFrozen: true, tenantFencePassed: true },
  })[0];
  const [decision] = buildDecisionRowsForBatch({ batch, reviewerIdentity: "reviewer-a", decision: "accepted" });
  const staleStore = new InMemoryKnowledgeExecutionStore({
    factCandidates: [{ ...candidate, factValue: { value: "changed" } }],
    reviewDecisions: [decision],
  });
  await assert.rejects(
    () =>
      staleStore.applyReviewDecisions({
        validationRunRef: "validate-run-1",
        env: { ABARVA_REVIEW_AUTHORIZED_REVIEWERS: "reviewer-a" },
      }),
    (error) => error instanceof KnowledgeProcessError && error.code === "review_decision_guard_failed",
  );

  const unauthorizedStore = new InMemoryKnowledgeExecutionStore({
    factCandidates: [candidate],
    reviewDecisions: [decision],
  });
  await assert.rejects(
    () =>
      unauthorizedStore.applyReviewDecisions({
        validationRunRef: "validate-run-1",
        env: { ABARVA_REVIEW_AUTHORIZED_REVIEWERS: "reviewer-b" },
      }),
    (error) => error instanceof KnowledgeProcessError && error.details.blockers[0].blockers.includes("unauthorized_reviewer"),
  );
});

await test("review policy routes model-derived and commercial candidates to individual review", () => {
  const modelDerived = classifyCandidateForReview({
    candidateRef: "fact-model",
    candidateType: "fact_candidate",
    sourceVersionRef: "src-v1",
    factType: "strategic_inference",
    factValue: { generated_model: "claude", statement: "candidate interpretation" },
    evidenceRefs: ["ev-1"],
    confidence: 0.9,
  });
  assert.equal(modelDerived.candidateClass, "individual_review_required");
  assert.ok(modelDerived.reasons.includes("model_derived_candidate"));

  const commercial = classifyCandidateForReview({
    candidateRef: "fact-commercial",
    candidateType: "fact_candidate",
    sourceVersionRef: "src-v1",
    factType: "commercial_term",
    factValue: { rate_card: "proposal term" },
    evidenceRefs: ["ev-2"],
    confidence: 0.9,
  });
  assert.equal(commercial.candidateClass, "individual_review_required");
  assert.ok(commercial.reasons.includes("commercial_or_sourcing_term"));
});

await test("review policy batches deterministic source records without weakening sensitive review gates", () => {
  const directEntity = classifyCandidateForReview({
    candidateRef: "entity-source-row",
    candidateType: "entity_candidate",
    sourceVersionRef: "src-app-inventory-v1",
    entityType: "application_platform",
    displayName: "Crew Scheduling",
    sourceFamily: "parser_visible_source_sample",
    evidenceRefs: [],
    confidence: 0.68,
  });
  assert.equal(directEntity.candidateClass, "batch_review_required");
  assert.ok(directEntity.reasons.includes("deterministic_source_record_batch_review"));

  const directFact = classifyCandidateForReview({
    candidateRef: "fact-source-row",
    candidateType: "fact_candidate",
    sourceVersionRef: "src-app-inventory-v1",
    subjectCandidateRef: "entity-source-row",
    factType: "application_platform_source_row",
    factValue: { application_id: "APP-1", business_owner: "Operations", lifecycle: "active" },
    sourceFamily: "parser_visible_source_sample",
    evidenceRefs: ["ev-app-1"],
    confidence: 0.68,
  });
  assert.equal(directFact.candidateClass, "auto_accept_eligible");
  assert.ok(directFact.reasons.includes("deterministic_high_confidence_evidence_backed"));

  const kpiFact = classifyCandidateForReview({
    candidateRef: "fact-kpi-row",
    candidateType: "fact_candidate",
    sourceVersionRef: "src-kpi-v1",
    subjectCandidateRef: "entity-source-row",
    factType: "kpi_source_row",
    factValue: { metric_name: "On-time departure", target_value: "withheld" },
    sourceFamily: "parser_visible_source_sample",
    evidenceRefs: ["ev-kpi-1"],
    confidence: 0.76,
  });
  assert.equal(kpiFact.candidateClass, "individual_review_required");
  assert.ok(kpiFact.reasons.includes("kpi_or_target_assertion"));

  const neutralRelationship = classifyCandidateForReview({
    candidateRef: "rel-neutral",
    candidateType: "relationship_candidate",
    sourceVersionRef: "src-rel-v1",
    fromCandidateRef: "entity-source-row",
    toCandidateRef: "entity-data-product",
    relationshipTypeRef: "integrates_with",
    currentTargetState: "current",
    evidenceRefs: ["ev-rel-1"],
    confidence: 0.72,
  });
  assert.equal(neutralRelationship.candidateClass, "batch_review_required");

  const targetRelationship = classifyCandidateForReview({
    candidateRef: "rel-target",
    candidateType: "relationship_candidate",
    sourceVersionRef: "src-rel-v1",
    fromCandidateRef: "entity-source-row",
    toCandidateRef: "entity-program",
    relationshipTypeRef: "integrates_with",
    currentTargetState: "target",
    evidenceRefs: ["ev-rel-2"],
    confidence: 0.74,
  });
  assert.equal(targetRelationship.candidateClass, "individual_review_required");
  assert.ok(targetRelationship.reasons.includes("target_state_claim"));
});

await test("review batch generation is deterministic and duplicate-safe by candidate hash", () => {
  const candidates = [
    { candidateRef: "b", candidateType: "entity_candidate", sourceVersionRef: "src-v1", entityType: "vendor", displayName: "Vendor B", evidenceRefs: ["ev-b"], confidence: 0.9 },
    { candidateRef: "a", candidateType: "entity_candidate", sourceVersionRef: "src-v1", entityType: "vendor", displayName: "Vendor A", evidenceRefs: ["ev-a"], confidence: 0.9 },
  ];
  const left = buildReviewBatches({
    tenantKey: "airline-demo-new",
    candidates,
    validationRunRef: "validate-run-1",
    sourceVersionRef: "src-v1",
    options: { semanticValidationPassed: true, sourceReleaseFrozen: true, tenantFencePassed: true },
  });
  const right = buildReviewBatches({
    tenantKey: "airline-demo-new",
    candidates: [...candidates].reverse(),
    validationRunRef: "validate-run-1",
    sourceVersionRef: "src-v1",
    options: { semanticValidationPassed: true, sourceReleaseFrozen: true, tenantFencePassed: true },
  });
  assert.deepEqual(left.map((batch) => batch.reviewBatchRef), right.map((batch) => batch.reviewBatchRef));
  assert.equal(candidateContentHash(candidates[0]), candidateContentHash({ ...candidates[0] }));
});

await test("review decision guard blocks candidates outside the approved batch manifest", () => {
  const approvedCandidate = {
    candidateRef: "entity-approved",
    candidateType: "entity_candidate",
    sourceVersionRef: "src-v1",
    entityType: "application",
    displayName: "Approved Application",
    evidenceRefs: ["ev-approved"],
    confidence: 0.93,
  };
  const outsideCandidate = {
    candidateRef: "entity-outside",
    candidateType: "entity_candidate",
    sourceVersionRef: "src-v1",
    entityType: "application",
    displayName: "Outside Application",
    evidenceRefs: ["ev-outside"],
    confidence: 0.93,
  };
  const [approvedBatch] = buildReviewBatches({
    tenantKey: "airline-demo-new",
    candidates: [approvedCandidate],
    validationRunRef: "validate-run-1",
    sourceVersionRef: "src-v1",
    options: { semanticValidationPassed: true, sourceReleaseFrozen: true, tenantFencePassed: true },
  });
  const borrowedDecision = {
    ...buildDecisionRowsForBatch({ batch: approvedBatch, reviewerIdentity: "reviewer-a", decision: "accepted" })[0],
    candidateRef: outsideCandidate.candidateRef,
    reviewedObjectRef: outsideCandidate.candidateRef,
    candidateContentHash: candidateContentHash(outsideCandidate),
  };
  const blockers = validateAcceptedDecision(outsideCandidate, borrowedDecision, {
    authorizedReviewers: ["reviewer-a"],
    validationRunRef: "validate-run-1",
    approvedBatchManifests: new Map([
      [
        approvedBatch.reviewBatchRef,
        approvedBatch.candidates.map((candidate) => ({
          candidateRef: candidate.candidateRef,
          candidateContentHash: candidate.candidateContentHash,
        })),
      ],
    ]),
  });
  assert.ok(blockers.includes("candidate_not_in_approved_batch_manifest"));
});

await test("dry-run review package never proposes accepted decisions without human approval", () => {
  const candidates = [
    {
      candidateRef: "entity-auto",
      candidateType: "entity_candidate",
      sourceVersionRef: "src-v1",
      entityType: "application",
      displayName: "Deterministic Application",
      evidenceRefs: ["ev-1"],
      confidence: 0.94,
      sourceFamily: "application_inventory",
    },
    {
      candidateRef: "fact-commercial",
      candidateType: "fact_candidate",
      sourceVersionRef: "src-v2",
      subjectCandidateRef: "entity-auto",
      factType: "commercial_term",
      factValue: { pricing: "proposal rate" },
      evidenceRefs: ["ev-2"],
      confidence: 0.91,
      sourceFamily: "vendor_contracts",
    },
    {
      candidateRef: "rel-high-impact",
      candidateType: "relationship_candidate",
      sourceVersionRef: "src-v3",
      fromCandidateRef: "entity-auto",
      toCandidateRef: "entity-risk",
      relationshipTypeRef: "blocks",
      currentTargetState: "current",
      evidenceRefs: ["ev-3"],
      confidence: 0.88,
      sourceFamily: "relationship_map",
    },
  ];
  const pkg = buildDryRunReviewPackage(
    {
      tenant: "airline-demo-new",
      releaseId: "airline-demo-new-source-corpus-v1.0.0",
      policyVersion: "knowledge-review-decision-policy-v1",
      validationRunRef: "validate-run-1",
      sourceVersionRef: "src-v1",
      samplesPerBatch: 2,
    },
    candidates,
  );
  assert.equal(pkg.candidateCounts.total, 3);
  assert.equal(pkg.candidateCounts.proposedDecisions.accept, 0);
  assert.equal(pkg.candidateCounts.proposedDecisions.defer + pkg.candidateCounts.proposedDecisions.reject, 3);
  assert.equal(pkg.humanApprovalRequired, true);
  assert.equal(pkg.applyAuthorized, false);
  assert.equal(pkg.hardStop, "dry_run_only_no_review_decisions_written");
  assert.equal(pkg.candidateManifest.length, 3);
  assert.ok(pkg.candidateManifestHash);
  assert.ok(pkg.packageContentHash);
  assert.ok(pkg.exceptionQueues.individual_review_required.some((queue) => queue.candidateCount >= 1));
  assert.equal(pkg.candidateCounts.commercialAndDecisionSensitive >= 1, true);
  assert.equal(pkg.candidateCounts.highImpactRelationships, 1);
});

await test("DB connection config accepts injected Azure Postgres Entra token without PGPASSWORD", async () => {
  const config = await dbConnectionConfig({
    PGHOST: "pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com",
    PGUSER: "mi-airdn-review-lab-001",
    PGDATABASE: "abarva_airline_demo_new_knowledge_lab",
    PGSSLMODE: "require",
    ABARVA_POSTGRES_AAD_ACCESS_TOKEN: "aad-token",
  });
  assert.equal(config.host, "pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com");
  assert.equal(config.user, "mi-airdn-review-lab-001");
  assert.equal(config.password, "aad-token");
  assert.deepEqual(config.ssl, { rejectUnauthorized: false });
});

await test("DB apply approval binding requires the reviewed package hashes to match", () => {
  const args = {
    tenant: "airline-demo-new",
    releaseId: "airline-demo-new-source-corpus-v1.0.0",
    policyVersion: "knowledge-review-decision-policy-v1",
    validationRunRef: "validate-run-1",
    sourceVersionRef: "src-v1",
    samplesPerBatch: 2,
    approveBatchClass: "auto_accept_eligible,batch_review_required",
  };
  const candidates = [
    {
      candidateRef: "entity-auto",
      candidateType: "entity_candidate",
      sourceVersionRef: "src-v1",
      entityType: "application",
      displayName: "Deterministic Application",
      evidenceRefs: ["ev-1"],
      confidence: 0.94,
      sourceFamily: "application_inventory",
    },
  ];
  const dryRunPackage = buildDryRunReviewPackage(args, candidates);
  const binding = validateDbApplyApproval(
    {
      ...args,
      approvedPackageContentHash: dryRunPackage.packageContentHash,
      approvedCandidateManifestHash: dryRunPackage.candidateManifestHash,
    },
    candidates,
  );
  assert.equal(binding.dryRunPackageContentHash, dryRunPackage.packageContentHash);
  assert.equal(binding.dryRunCandidateManifestHash, dryRunPackage.candidateManifestHash);
  assert.throws(
    () =>
      validateDbApplyApproval(
        {
          ...args,
          approvedPackageContentHash: "wrong",
          approvedCandidateManifestHash: dryRunPackage.candidateManifestHash,
        },
        candidates,
      ),
    /Approved review package hash mismatch/,
  );
});

await test("bulk ledger apply accepts only approved routine classes and defers sensitive candidates", () => {
  const pkg = buildLedgerPackage(
    {
      tenant: "airline-demo-new",
      releaseId: "airline-demo-new-source-corpus-v1.0.0",
      policyVersion: "knowledge-review-decision-policy-v1",
      validationRunRef: "validate-run-1",
      sourceVersionRef: "src-v1",
      reviewer: "reviewer:test",
      approveBatchClass: "auto_accept_eligible,batch_review_required",
    },
    [
      {
        candidateRef: "entity-auto",
        candidateType: "entity_candidate",
        sourceVersionRef: "src-v1",
        entityType: "application",
        displayName: "Deterministic Application",
        evidenceRefs: ["ev-1"],
        confidence: 0.94,
        sourceFamily: "application_inventory",
      },
      {
        candidateRef: "entity-routine-batch",
        candidateType: "entity_candidate",
        sourceVersionRef: "src-v1",
        entityType: "application",
        displayName: "Routine Source Row",
        evidenceRefs: [],
        confidence: 0.68,
        sourceFamily: "parser_visible_source_sample",
      },
      {
        candidateRef: "fact-commercial",
        candidateType: "fact_candidate",
        sourceVersionRef: "src-v2",
        subjectCandidateRef: "entity-auto",
        factType: "commercial_term",
        factValue: { pricing: "proposal rate" },
        evidenceRefs: ["ev-2"],
        confidence: 0.91,
        sourceFamily: "vendor_contracts",
      },
      {
        candidateRef: "rel-high-impact",
        candidateType: "relationship_candidate",
        sourceVersionRef: "src-v3",
        fromCandidateRef: "entity-auto",
        toCandidateRef: "entity-risk",
        relationshipTypeRef: "blocks",
        currentTargetState: "current",
        evidenceRefs: ["ev-3"],
        confidence: 0.88,
        sourceFamily: "relationship_map",
      },
    ],
  );
  const decisionCounts = pkg.decisionRows.reduce((counts, row) => {
    counts[row.decision] = (counts[row.decision] ?? 0) + 1;
    return counts;
  }, {});
  assert.equal(decisionCounts.accepted, 2);
  assert.equal(decisionCounts.deferred, 2);
  assert.throws(
    () =>
      buildLedgerPackage(
        {
          tenant: "airline-demo-new",
          releaseId: "airline-demo-new-source-corpus-v1.0.0",
          policyVersion: "knowledge-review-decision-policy-v1",
          validationRunRef: "validate-run-1",
          sourceVersionRef: "src-v1",
          reviewer: "reviewer:test",
          approveBatchClass: "individual_review_required",
        },
        [],
      ),
    /Bulk apply cannot approve/,
  );
});

if (failures > 0) {
  console.error(`\n${failures} knowledge-process-executor test(s) failed.`);
  process.exit(1);
}

console.log("\nAll knowledge-process-executor tests passed.");
