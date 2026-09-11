#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildDryRunReviewPackage, buildLedgerPackage, dbConnectionConfig, setTenantContext, validateDbApplyApproval } from "../build-review-decision-ledger.mjs";
import {
  InMemoryKnowledgeExecutionStore,
  KnowledgeProcessError,
  PostgresKnowledgeExecutionStore,
  checkpointFor,
  createProcessResult,
  runKnowledgeProcess,
} from "../processing/executor-framework.mjs";
import { DEFAULT_PROCESS_HANDLERS, SOURCE_IDENTITY_MAP, assertTerminalSourceState } from "../processing/process-handlers.mjs";
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

await test("postgres candidate hash repair updates stale stored hashes before review guards", async () => {
  const candidate = {
    candidateRef: "entcand-stale-hash",
    sourceVersionRef: "source-v1",
    entityType: "organization",
    displayName: "SkyHarbor Air",
    candidatePayload: { canonical_key: "skyharbor-air" },
    evidenceRefs: ["ev-1"],
    confidence: 0.95,
    reviewState: "not_reviewed",
    candidateContentHash: "stale",
  };
  const calls = [];
  const client = {
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      if (String(sql).includes("FROM working.entity_candidate")) {
        return { rows: [candidate] };
      }
      return { rows: [] };
    },
  };
  const store = new PostgresKnowledgeExecutionStore(client);
  const summary = await store.backfillMissingCandidateContentHashes(baseContext());
  const expectedHash = candidateContentHash({ ...candidate, candidateType: "entity_candidate" });
  const update = calls.find((call) => call.sql.includes("UPDATE working.entity_candidate"));

  assert.deepEqual(summary, { entity_candidate: 1, fact_candidate: 0, relationship_candidate: 0 });
  assert.ok(update?.sql.includes("IS DISTINCT FROM v.candidate_content_hash"));
  assert.deepEqual(update?.params[1], [candidate.candidateRef]);
  assert.deepEqual(update?.params[2], [expectedHash]);
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

await test("promotion SQL casts enum-backed state columns explicitly", async () => {
  const source = await readFile(new URL("../processing/executor-framework.mjs", import.meta.url), "utf8");
  assert.ok(source.includes("'accepted'::abarva_authority_state AS authority_state"));
  assert.ok(source.includes("'accepted'::abarva_availability_state AS availability_state"));
  assert.ok(source.includes("'unknown'::abarva_freshness_state AS freshness_state"));
  assert.ok(source.includes("r.current_target_state::abarva_current_target_state"));
  assert.ok(source.includes("coalesce(nullif(f.fact_value->>'availability_state','')::abarva_availability_state, 'accepted'::abarva_availability_state)"));
});

await test("promotion upsert can revive retired canonical rows from fresh accepted decisions", async () => {
  const source = await readFile(new URL("../processing/executor-framework.mjs", import.meta.url), "utf8");
  assert.ok(source.includes("authority_state=EXCLUDED.authority_state"));
  assert.ok(source.includes("availability_state=EXCLUDED.availability_state"));
  assert.ok(source.includes("freshness_state=EXCLUDED.freshness_state"));
  assert.ok(source.includes("effective_to=NULL"));
  assert.ok(source.includes("entity_ref=EXCLUDED.entity_ref"));
  assert.ok(source.includes("from_entity_ref=EXCLUDED.from_entity_ref"));
  assert.ok(source.includes("to_entity_ref=EXCLUDED.to_entity_ref"));
});

await test("baseline activation gate blocks empty validation and requires absence assertions", async () => {
  const source = await readFile(
    new URL("../../../supabase/migrations/20260801194500_foundation_v3_baseline_activation_gate.sql", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes("CREATE TABLE IF NOT EXISTS publication.projection_absence_assertion"));
  assert.ok(source.includes("knowledge_baseline_passed_requires_projection_validation_chk"));
  assert.ok(source.includes("projection_validation_hash"));
  assert.ok(source.includes("NOT VALID"));
  assert.ok(source.includes("CREATE OR REPLACE FUNCTION publication.validate_knowledge_baseline_activation_gate"));
  assert.ok(source.includes("missingProjectionAbsenceAssertionCount"));
  assert.ok(source.includes("Knowledge Baseline % has zero-row projections without absence assertions"));
  assert.ok(source.includes("PERFORM publication.validate_knowledge_baseline_activation_gate"));
  assert.ok(source.includes("ALTER TABLE publication.projection_absence_assertion ENABLE ROW LEVEL SECURITY"));
  assert.ok(source.includes("governance.can_access_tenant(tenant_key)"));
});

await test("source-register expectation counts authored data sources, not operational files", async () => {
  const offlineReport = await readFile(
    new URL("../build-foundation-v3-day-one-breach-report.mjs", import.meta.url),
    "utf8",
  );
  const liveReadback = await readFile(
    new URL("../../qa/skyharbor-day-one-breach-readback.mjs", import.meta.url),
    "utf8",
  );
  const correctionMigration = await readFile(
    new URL("../../../supabase/migrations/20260801231000_foundation_v3_source_expectation_correction.sql", import.meta.url),
    "utf8",
  );

  for (const source of [offlineReport, liveReadback]) {
    assert.ok(source.includes("EXPECTED_DECLARED_INTAKE_DATA_SOURCES = 33"));
    assert.ok(source.includes("declared intake data sources excluding workbook lineage companions"));
    assert.ok(!source.includes('"all declared intake sources", 48'));
  }
  assert.ok(correctionMigration.includes("'exp-source-register-file-count-v1'"));
  assert.ok(correctionMigration.includes("expected_count = EXCLUDED.expected_count"));
  assert.ok(correctionMigration.includes("'corrected_expected_count', 33"));
  assert.ok(correctionMigration.includes("'excluded_workbook_lineage_companions', 5"));
  assert.ok(correctionMigration.includes("prior_snapshot_counted_operational_files_not_intake_data_sources"));
});

await test("relationship promotion resolves endpoints from an indexed accepted entity map", async () => {
  const source = await readFile(new URL("../processing/executor-framework.mjs", import.meta.url), "utf8");
  assert.ok(source.includes("CREATE TEMP TABLE tmp_promoted_entity_map ON COMMIT DROP AS"));
  assert.ok(source.includes("CREATE UNIQUE INDEX tmp_promoted_entity_map_lookup_idx"));
  assert.ok(source.includes("CREATE TEMP TABLE tmp_accepted_relationship_candidate ON COMMIT DROP AS"));
  assert.ok(source.includes("CREATE INDEX tmp_accepted_relationship_candidate_endpoint_idx"));
  assert.ok(source.includes("JOIN tmp_promoted_entity_map f"));
  assert.ok(source.includes("JOIN tmp_promoted_entity_map t"));
  assert.ok(source.includes("AND ed.candidate_type = 'entity_candidate'"));
  assert.ok(source.includes("LEFT JOIN LATERAL ("));
  assert.ok(source.includes("jsonb_object_agg(e.evidence_ref, e.evidence_text ORDER BY e.evidence_ref)"));
  assert.ok(source.includes("source_evidence_text_by_ref"));
  assert.ok(!source.includes("e.evidence_text::jsonb"));
});

await test("projection build materializes analytics consumption tables from accepted knowledge", async () => {
  const source = await readFile(new URL("../processing/executor-framework.mjs", import.meta.url), "utf8");
  for (const projection of [
    "enterprise_brief_v1",
    "domain_summary_v1",
    "application_inventory_v1",
    "technology_estate_v1",
    "data_product_inventory_v1",
    "vendor_contract_inventory_v1",
    "metric_observation_v1",
    "evidence_gap_v1",
    "module_knowledge_packet_v1",
  ]) {
    assert.ok(source.includes(`consumption.${projection}`), `projection build must mention ${projection}`);
  }
  assert.ok(source.includes("DELETE FROM consumption.${tableName}"), "projection build must clear stale rows before rebuild");
  assert.ok(source.includes("projectionCleanupTables"), "projection cleanup must be table allowlist-driven");
  assert.ok(
    source.includes("for (const tableName of projectionCleanupTables)"),
    "projection cleanup must issue one prepared statement per table",
  );
  assert.ok(source.includes("entity_type ILIKE $6"), "entity projections must be sourced by accepted entity type filters");
  assert.ok(source.includes("WHERE tenant_key=$1 AND authority_state='accepted'"), "projection build must read accepted canonical entities only");
  assert.ok(source.includes("FROM metrics.metric_observation o"), "metric projection must read governed metric observations");
  assert.ok(source.includes("FROM governance.evidence_gap"), "gap projection must read governed evidence gaps");
  assert.ok(source.includes("await this.promoteSourceEvidenceGaps(context);"), "projection rebuild must promote source-authored gaps without replaying review decisions");
  assert.ok(source.includes("registerConsumptionProjectionVersions"), "projection build must register each consumption table as a governed projection");
  assert.ok(source.includes("projectionName = `consumption.${projection}`"), "projection registry names must match consumption table names");
  assert.ok(source.includes("CORE_CONSUMPTION_PROJECTIONS"), "projection registry must use the closed core projection list");
});

await test("search projection preserves entity identity, domain, snippet, and evidence refs", async () => {
  const source = await readFile(new URL("../processing/executor-framework.mjs", import.meta.url), "utf8");
  assert.ok(source.includes("INSERT INTO consumption.search_document_v1"), "search projection must be materialized");
  assert.ok(source.includes("FROM knowledge.fact_assertion f"), "search projection must source accepted facts with a stable fact document id");
  assert.ok(source.includes("JOIN knowledge.entity e"), "search projection must join the linked accepted entity");
  assert.ok(source.includes("AND e.entity_ref = f.entity_ref"), "search projection must preserve canonical entity identity");
  assert.ok(source.includes("'entityRef', f.entity_ref"), "search payload must expose entityRef for UI certification");
  assert.ok(source.includes("'domainKey', coalesce("), "search payload must expose a domain key from governed entity metadata");
  assert.ok(source.includes("'snippet', coalesce(nullif(e.display_name, ''), f.fact_type)"), "search payload must include a useful governed snippet");
  assert.ok(source.includes("'evidenceRefs',"), "search payload must include source evidence references");
  assert.ok(source.includes("to_jsonb(f.evidence_refs)"), "search payload must preserve fact evidence references");
  assert.ok(source.includes("to_jsonb(e.accepted_evidence_refs)"), "search payload may fall back only to accepted entity evidence references");
  assert.ok(source.includes("display_name=EXCLUDED.display_name"), "search rebuild must refresh display metadata on existing rows");
  assert.ok(source.includes("executive_summary=EXCLUDED.executive_summary"), "search rebuild must refresh snippet metadata on existing rows");
  assert.ok(source.includes("evidence_coverage=EXCLUDED.evidence_coverage"), "search rebuild must refresh evidence coverage on existing rows");
});

await test("module knowledge packet builds deterministic suggested questions from completed projections", async () => {
  const source = await readFile(new URL("../processing/executor-framework.mjs", import.meta.url), "utf8");
  assert.ok(source.includes('"module_knowledge_packet_v1"'), "core projection list must include the module packet table");
  assert.ok(source.includes('"module_knowledge_packet_v1",\n      "relationship_evidence_v1"'), "packet cleanup must run before stale relationship cleanup completes");
  assert.ok(source.includes("INSERT INTO consumption.module_knowledge_packet_v1"), "packet projection must be materialized");
  assert.ok(source.includes("'packetType', 'suggested_questions'"), "packet payload must identify suggested question content");
  assert.ok(source.includes("'projectionCounts', jsonb_build_object("), "packet payload must expose built projection counts");
  assert.ok(source.includes("'home-brief-loaded-vs-missing-v1'"), "packet must include a deterministic brief question");
  assert.ok(source.includes("'home-evidence-open-gaps-v1'"), "packet must include a deterministic evidence question");
  assert.ok(source.includes("FROM packet\n        WHERE brief > 0"), "packet must not be inserted when governed projections are absent");
  assert.ok(source.includes("SELECT count(*)::int FROM consumption.module_knowledge_packet_v1"), "packet row count must be read back");
  assert.ok(source.includes("module_knowledge_packet_v1: counts.packets"), "packet projection version must be registered independently");
});

await test("live reconciliation readback traces source rows and fields through governed lineage keys", async () => {
  const source = await readFile(new URL("../../qa/airline-e2e-live-reconciliation-readback.mjs", import.meta.url), "utf8");
  assert.ok(source.includes("record.source_visibility === \"client_visible\""), "readback must exclude non-client-visible reference materials");
  assert.ok(source.includes("record.source_basis !== \"restricted_evaluator\""), "readback must exclude evaluator-only files");
  assert.ok(source.includes("record.parser_contract_ref"), "readback must require parser-bound sources");
  assert.ok(source.includes("sourceRecord?.source_ref"), "row lineage must include source_ref-backed evidence identities");
  assert.ok(source.includes("sourceRecord?.live_source_ref"), "row lineage must include live source refs from file reconciliation rows");
  assert.ok(source.includes("sourceRecord?.live_source_version_ref"), "row lineage must include live source version refs from file reconciliation rows");
  assert.ok(source.includes("`${prefix}:row:${rowNumber}`"), "row lineage must include canonical source_ref:row:n evidence keys");
  assert.ok(source.includes("FIELD_PRESERVED_IN_CANONICAL_FACT"), "field reconciliation must account for accepted raw_row fact preservation");
  assert.ok(source.includes("FIELD_PRESERVED_IN_CANONICAL_RELATIONSHIP"), "field reconciliation must account for accepted relationship payload preservation");
  assert.ok(source.includes("evidence_text"), "field reconciliation must read source evidence text for evidence-preserved fields");
  assert.ok(source.includes("PRESERVED_AS_EVIDENCE"), "field reconciliation must account for fields preserved as live evidence without forcing canonical promotion");
  assert.ok(source.includes("CORE_CONSUMPTION_PROJECTION_TABLES"), "projection authority readback must validate the closed set of core consumption projections");
  assert.ok(source.includes("projectionAuthorityStatus"), "projection authority readback must validate each registered projection rather than a stale aggregate hash");
  assert.ok(source.includes("stableJson({ projectionName, rowCount, baseline: BASELINE_ID })"), "projection authority readback must recompute per-projection hashes using the executor contract");
  assert.ok(source.includes("process.env.AIRLINE_E2E_EXPECTED_BASELINE_HASH || \"\""), "baseline hash readback must not pin a stale compile-time hash");
  assert.ok(source.includes("packets: countByTable.get(\"consumption.module_knowledge_packet_v1\") || 0"), "core projection authority readback must include module packet rows in the executor aggregate hash");
  assert.ok(source.includes("INACCESSIBLE_RELATION"), "readback must record permission-denied relations without aborting projection proof");
  assert.ok(source.includes("SAVEPOINT readback_relation_probe"), "permission-denied relation probes must not poison the read-only transaction");
  assert.ok(source.includes("live-inaccessible-relation-readback.csv"), "readback must emit inaccessible relation evidence");
  assert.ok(source.includes("JSON.parse(value)"), "relationship field readback must parse evidence text safely in JS");
  assert.ok(source.includes("evidenceTextByRef[evidenceRef]"), "relationship field readback must only credit the matching evidence ref payload");
  assert.ok(source.includes("FIELD_DEFERRED_BY_REVIEW"), "field reconciliation must distinguish deferred review decisions from lost data");
});

await test("runtime DB proof reads all core consumption projections and projection authority", async () => {
  const source = await readFile(new URL("../../qa/airline-module-runtime-db-proof.mjs", import.meta.url), "utf8");
  for (const projection of [
    "consumption.enterprise_brief_v1",
    "consumption.enterprise_identity_v1",
    "consumption.domain_summary_v1",
    "consumption.application_inventory_v1",
    "consumption.technology_estate_v1",
    "consumption.data_product_inventory_v1",
    "consumption.vendor_contract_inventory_v1",
    "consumption.evidence_gap_v1",
    "consumption.search_document_v1",
    "consumption.module_knowledge_packet_v1",
    "consumption.metric_observation_v1",
    "consumption.relationship_node_v1",
    "consumption.relationship_edge_v1",
    "consumption.relationship_evidence_v1",
  ]) {
    assert.ok(source.includes(`"${projection}"`), `runtime DB proof must count ${projection}`);
  }
  assert.ok(source.includes("FROM publication.projection_version"), "runtime DB proof must read projection authority rows");
  assert.ok(source.includes("projectionVersions"), "runtime DB proof must include projection authority in emitted proof");
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

await test("candidate extraction replaces stale working candidates for replayed source versions", async () => {
  const store = new InMemoryKnowledgeExecutionStore({
    entityCandidates: [
      { candidateRef: "entcand:src-app-v1:old", sourceVersionRef: "src-app-v1", displayName: "airline-demo-new" },
      { candidateRef: "entcand:src-other-v1:keep", sourceVersionRef: "src-other-v1", displayName: "Keep Me" },
    ],
    factCandidates: [
      { candidateRef: "factcand:src-app-v1:old", sourceVersionRef: "src-app-v1" },
      { candidateRef: "factcand:src-other-v1:keep", sourceVersionRef: "src-other-v1" },
    ],
    relationshipCandidates: [
      { candidateRef: "relcand:src-app-v1:old", sourceVersionRef: "src-app-v1" },
      { candidateRef: "relcand:src-other-v1:keep", sourceVersionRef: "src-other-v1" },
    ],
  });
  await store.writeEvidenceAndCandidates(baseContext(), {
    evidenceRecords: [{ evidenceRef: "ev:src-app-v1:1", sourceVersionRef: "src-app-v1" }],
    entityCandidates: [{ candidateRef: "entcand:src-app-v1:new", sourceVersionRef: "src-app-v1", displayName: "Crew Scheduling" }],
    factCandidates: [{ candidateRef: "factcand:src-app-v1:new", sourceVersionRef: "src-app-v1" }],
    relationshipCandidates: [{ candidateRef: "relcand:src-app-v1:new", sourceVersionRef: "src-app-v1" }],
  });
  assert.deepEqual(store.entityCandidates.map((row) => row.candidateRef).sort(), ["entcand:src-app-v1:new", "entcand:src-other-v1:keep"]);
  assert.deepEqual(store.factCandidates.map((row) => row.candidateRef).sort(), ["factcand:src-app-v1:new", "factcand:src-other-v1:keep"]);
  assert.deepEqual(store.relationshipCandidates.map((row) => row.candidateRef).sort(), ["relcand:src-app-v1:new", "relcand:src-other-v1:keep"]);
});

await test("postgres candidate extraction deletes stale rows before inserting regenerated candidates", async () => {
  const calls = [];
  const client = {
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      return { rows: [] };
    },
  };
  const store = new PostgresKnowledgeExecutionStore(client);
  await store.writeEvidenceAndCandidates(baseContext(), {
    evidenceRecords: [
      {
        evidenceRef: "ev:src-app-v1:1",
        sourceVersionRef: "src-app-v1",
        citationLabel: "source.csv row 1",
        sourceRowRef: "src-app:row:1",
        sourceObjectRef: "APP-1",
        evidenceText: "Crew Scheduling",
        evidenceHash: "hash",
      },
    ],
    entityCandidates: [
      {
        candidateRef: "entcand:src-app-v1:APP-1",
        sourceVersionRef: "src-app-v1",
        entityType: "application_platform",
        displayName: "Crew Scheduling",
        naturalKey: "application_platform:app_1",
        candidatePayload: {},
        evidenceRefs: ["ev:src-app-v1:1"],
      },
    ],
    factCandidates: [
      {
        candidateRef: "factcand:src-app-v1:APP-1",
        sourceVersionRef: "src-app-v1",
        subjectCandidateRef: "entcand:src-app-v1:APP-1",
        factType: "source_row",
        factValue: {},
        evidenceRefs: ["ev:src-app-v1:1"],
      },
    ],
  });
  const sqlText = calls.map((call) => call.sql);
  const firstDelete = sqlText.findIndex((sql) => sql.includes("DELETE FROM working.relationship_candidate"));
  const firstInsert = sqlText.findIndex((sql) => sql.includes("INSERT INTO evidence.evidence_item"));
  assert.equal(sqlText[0], "BEGIN");
  assert.ok(firstDelete > 0, "relationship stale-delete should run");
  assert.ok(firstInsert > firstDelete, "stale-delete should precede inserts");
  assert.ok(sqlText.some((sql) => sql.includes("DELETE FROM working.fact_candidate")), "fact stale-delete should run");
  assert.ok(sqlText.some((sql) => sql.includes("DELETE FROM working.entity_candidate")), "entity stale-delete should run");
  assert.equal(sqlText.at(-1), "COMMIT");
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
        sourceRef: "src-app",
        sourceVersionRef: "src-app-v1",
        sourceName: "04_applications_systems.csv",
        sourceFamily: "parser_visible_source_sample",
        parserContractRef: "airline-source-parser-visible-v1",
        contentText:
          "original_row_id,tenant_key,system_name,vendor,business_function\nAPP-1,airline-demo-new,Crew Scheduling,Vendor A,Crew Operations\n",
      },
      {
        sourceRef: "src-rel",
        sourceVersionRef: "src-rel-v1",
        sourceName: "12_relationships.csv",
        sourceFamily: "parser_visible_source_sample",
        parserContractRef: "airline-source-parser-visible-v1",
        contentText:
          "record_id,from_object_type,from_object_name,from_source_native_id,relationship_type,to_object_type,to_object_name,to_source_native_id,current_target_state\nREL-1,application,Crew Scheduling,APP-1,depends_on,data_product,Crew Data Mart,DATA-1,current\n",
      },
    ],
  });
  const result = await runKnowledgeProcess({
    context,
    handler: DEFAULT_PROCESS_HANDLERS["evidence-extract-v1"],
    store,
  });
  assert.equal(result.status, "passed");
  assert.equal(store.evidenceRecords.length, 2);
  assert.equal(store.entityCandidates.length, 2);
  assert.equal(store.factCandidates.length, 2);
  assert.equal(store.relationshipCandidates.length, 1);
  assert.equal(store.knowledgeEntities.length, 0);
  const appCandidate = store.entityCandidates.find((candidate) => candidate.sourceVersionRef === "src-app-v1");
  assert.equal(appCandidate.displayName, "Crew Scheduling");
  assert.equal(appCandidate.naturalKey, "application_platform:app_1");
  assert.deepEqual(appCandidate.evidenceRefs, ["ev:src-app-v1:1"]);
  assert.equal(appCandidate.candidatePayload.source_row_ref, "src-app:row:1");
  assert.equal(appCandidate.candidatePayload.original_row_id, "APP-1");
});

await test("source identity map covers every loaded source without tenant-name fallback", async () => {
  const tenantKey = "airline-demo-new";
  const sources = Object.entries(SOURCE_IDENTITY_MAP).map(([sourceName, identity], index) => {
    const sourceRef = `src-identity-${index + 1}`;
    const idColumn = identity.idColumns?.[0] || "original_row_id";
    const nameColumns = identity.nameColumns ?? [identity.nameColumn];
    const idCompositeColumns = identity.idCompositeColumns ?? [];
    const headers = Array.from(new Set(["tenant_key", idColumn, ...idCompositeColumns, ...nameColumns]));
    const valueForHeader = (header) => {
      if (header === "tenant_key") return tenantKey;
      if (nameColumns.includes(header)) return `Declared ${header} ${index + 1}`;
      if (idCompositeColumns.includes(header)) return `ID ${header} ${index + 1}`;
      return `SRC-${String(index + 1).padStart(2, "0")}`;
    };
    const values = headers.map(valueForHeader);
    const expectedDisplayName = nameColumns.map((column) => `Declared ${column} ${index + 1}`).join(" | ");
    const expectedObjectId = idCompositeColumns.length
      ? idCompositeColumns.map(valueForHeader).join("|")
      : `SRC-${String(index + 1).padStart(2, "0")}`;
    return {
      sourceRef,
      sourceVersionRef: `${sourceRef}-v1`,
      sourceName,
      sourceFamily: "parser_visible_source_sample",
      parserContractRef: "airline-source-parser-visible-v1",
      contentText: `${headers.join(",")}\n${values.join(",")}\n`,
      expectedEntityType: identity.entityType,
      expectedDisplayName,
      expectedObjectId,
    };
  });
  const context = baseContext({
    canonicalProcess: "evidence-extract-v1",
    processName: "airline-demo-new-evidence-extract-v1",
    idempotencyKey: "identity-map-all-sources-test",
  });
  const store = new InMemoryKnowledgeExecutionStore({ parserVisibleSources: sources });
  const result = await runKnowledgeProcess({
    context,
    handler: DEFAULT_PROCESS_HANDLERS["evidence-extract-v1"],
    store,
  });
  assert.equal(result.status, "passed");
  assert.equal(store.entityCandidates.length, Object.keys(SOURCE_IDENTITY_MAP).length);
  for (const source of sources) {
    const candidate = store.entityCandidates.find((row) => row.sourceVersionRef === source.sourceVersionRef);
    assert.ok(candidate, `missing candidate for ${source.sourceName}`);
    assert.equal(candidate.entityType, source.expectedEntityType, source.sourceName);
    assert.equal(candidate.displayName, source.expectedDisplayName, source.sourceName);
    assert.notEqual(candidate.displayName, tenantKey, source.sourceName);
    assert.equal(candidate.sourceObjectRef, source.expectedObjectId, source.sourceName);
    assert.deepEqual(candidate.evidenceRefs, [`ev:${source.sourceVersionRef}:1`], source.sourceName);
  }
  assert.equal(new Set(store.entityCandidates.map((candidate) => candidate.displayName)).size, store.entityCandidates.length);
});

await test("relationship source identity stays row-grain when record ids repeat", async () => {
  const context = baseContext({
    canonicalProcess: "evidence-extract-v1",
    processName: "airline-demo-new-evidence-extract-v1",
    idempotencyKey: "relationship-duplicate-record-id-test",
  });
  const store = new InMemoryKnowledgeExecutionStore({
    parserVisibleSources: [{
      sourceRef: "src-rel-dup",
      sourceVersionRef: "src-rel-dup-v1",
      sourceName: "12_relationships.csv",
      sourceFamily: "parser_visible_source_sample",
      parserContractRef: "airline-source-parser-visible-v1",
      contentText: [
        "record_id,from_object_name,relationship_type,to_object_name",
        "REL-1,Crew Scheduling,depends_on,Crew Data Mart",
        "REL-1,Crew Scheduling,owned_by,Flight Operations",
      ].join("\n"),
    }],
  });
  const result = await runKnowledgeProcess({
    context,
    handler: DEFAULT_PROCESS_HANDLERS["evidence-extract-v1"],
    store,
  });
  assert.equal(result.status, "passed");
  assert.equal(store.evidenceRecords.length, 2);
  assert.equal(store.entityCandidates.length, 2);
  assert.equal(store.factCandidates.length, 2);
  assert.equal(new Set(store.entityCandidates.map((candidate) => candidate.candidateRef)).size, 2);
  assert.deepEqual(
    store.entityCandidates.map((candidate) => candidate.sourceObjectRef),
    [
      "Crew Scheduling|depends_on|Crew Data Mart",
      "Crew Scheduling|owned_by|Flight Operations",
    ],
  );
});

await test("source identity extraction fails closed when mapping or name column is absent", async () => {
  const context = baseContext({
    canonicalProcess: "evidence-extract-v1",
    processName: "airline-demo-new-evidence-extract-v1",
    idempotencyKey: "identity-map-fail-closed-test",
  });
  await assert.rejects(
    () => runKnowledgeProcess({
      context,
      handler: DEFAULT_PROCESS_HANDLERS["evidence-extract-v1"],
      store: new InMemoryKnowledgeExecutionStore({
        parserVisibleSources: [{
          sourceRef: "src-unmapped",
          sourceVersionRef: "src-unmapped-v1",
          sourceName: "unmapped_source.csv",
          sourceFamily: "parser_visible_source_sample",
          contentText: "tenant_key,value\nairline-demo-new,Looks valid\n",
        }],
      }),
    }),
    (error) => error instanceof KnowledgeProcessError && error.code === "source_identity_mapping_missing",
  );
  await assert.rejects(
    () => runKnowledgeProcess({
      context: { ...context, idempotencyKey: "identity-name-column-fail-test" },
      handler: DEFAULT_PROCESS_HANDLERS["evidence-extract-v1"],
      store: new InMemoryKnowledgeExecutionStore({
        parserVisibleSources: [{
          sourceRef: "src-missing-name",
          sourceVersionRef: "src-missing-name-v1",
          sourceName: "07_vendors_contracts.csv",
          sourceFamily: "parser_visible_source_sample",
          contentText: "tenant_key,original_row_id,contract_name\nairline-demo-new,VEND-1,Contract Only\n",
        }],
      }),
    }),
    (error) => error instanceof KnowledgeProcessError && error.code === "source_name_column_missing",
  );
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

await test("reconciliation blocks source application rows that never reach consumption", async () => {
  const context = baseContext({
    canonicalProcess: "reconciliation-audit-v1",
    processName: "airline-demo-new-reconciliation-audit-v1",
    idempotencyKey: "source-domain-coverage-block-test",
  });
  const store = new InMemoryKnowledgeExecutionStore({
    baselines: [
      {
        knowledgeBaselineRef: "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1",
        isActive: true,
      },
    ],
    sourceDomainCoverage: [
      {
        domainKey: "applications",
        sourceRows: 125,
        sourceVersions: 1,
        candidateRows: 125,
        decisionRows: 125,
        acceptedRows: 0,
        deferredRows: 125,
        rejectedRows: 0,
        consumptionRows: 0,
        requiresProjection: true,
      },
    ],
  });

  await assert.rejects(
    () =>
      runKnowledgeProcess({
        context,
        handler: DEFAULT_PROCESS_HANDLERS["reconciliation-audit-v1"],
        store,
      }),
    (error) =>
      error instanceof KnowledgeProcessError &&
      error.code === "process_verification_failed" &&
      error.details.blockers.includes("source_to_consumption_unpublished:applications"),
  );
});

await test("reconciliation passes source application rows only when consumption projection exists", async () => {
  const context = baseContext({
    canonicalProcess: "reconciliation-audit-v1",
    processName: "airline-demo-new-reconciliation-audit-v1",
    idempotencyKey: "source-domain-coverage-pass-test",
  });
  const store = new InMemoryKnowledgeExecutionStore({
    baselines: [
      {
        knowledgeBaselineRef: "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1",
        isActive: true,
      },
    ],
    sourceDomainCoverage: [
      {
        domainKey: "applications",
        sourceRows: 125,
        sourceVersions: 1,
        candidateRows: 125,
        decisionRows: 125,
        acceptedRows: 125,
        deferredRows: 0,
        rejectedRows: 0,
        consumptionRows: 125,
        requiresProjection: true,
      },
    ],
  });

  const result = await runKnowledgeProcess({
    context,
    handler: DEFAULT_PROCESS_HANDLERS["reconciliation-audit-v1"],
    store,
  });

  assert.equal(result.status, "passed");
  assert.equal(store.reconciliationLedger[0].sourceCoverage[0].status, "passed");
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
    ["knowledge-narrative-generate-v1", "airline-demo-new-knowledge-narrative-generate-v1", "knowledge-narrative-generate-test"],
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
  assert.ok(
    store.projections.some((row) => row.projectionName === "module_knowledge_packet_v1" && row.objectRef === "home:suggested-questions"),
    "projection build must expose the Home module packet as its own data-plane projection",
  );
  assert.ok(
    store.projections.some((row) => row.projectionName === "enterprise_brief_v1" && row.objectRef === "enterprise:risk_resilience"),
    "narrative generation must create lens-specific enterprise brief rows after the deterministic base projection",
  );
  assert.equal(store.reconciliationLedger.length, 1);
});

await test("narrative generation blocks when accepted evidence is missing", async () => {
  const store = new InMemoryKnowledgeExecutionStore({
    baselines: [{ knowledgeBaselineRef: "baseline:test", releaseId: "airline-demo-new-source-corpus-v1.0.0", isActive: true }],
    knowledgeFacts: [{ candidateRef: "fact-no-evidence", factType: "operational_observation", evidenceRefs: [] }],
  });
  await assert.rejects(
    () =>
      runKnowledgeProcess({
        context: baseContext({
          canonicalProcess: "knowledge-narrative-generate-v1",
          processName: "airline-demo-new-knowledge-narrative-generate-v1",
          idempotencyKey: "knowledge-narrative-missing-evidence-test",
        }),
        handler: DEFAULT_PROCESS_HANDLERS["knowledge-narrative-generate-v1"],
        store,
      }),
    (error) => error instanceof KnowledgeProcessError && error.details.blockers.includes("accepted_evidence_missing_for_narrative"),
  );
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

await test("DB tenant context is explicit and rejects wildcard tenants", async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
    },
  };
  await setTenantContext(client, "airline-demo-new");
  assert.deepEqual(calls, [{ sql: "SELECT set_config('app.tenant_key', $1, false)", params: ["airline-demo-new"] }]);
  await assert.rejects(() => setTenantContext(client, "all"), /Unsafe tenant context/);
  await assert.rejects(() => setTenantContext(client, "airline-*"), /Unsafe tenant context/);
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
