import { createHash, webcrypto } from "node:crypto";
import registry from "../../../datasets/tenant-inputs/tenant-input-registry.json";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { buildIntegratedInsightPlan, insightHash, insightUuid } from "@/lib/ecl/insights/engine";
import type { InsightInput } from "@/lib/ecl/insights/types";
import type { DelegatedApproval } from "@/lib/governance/delegated-approval";
import type { JobDatabase, ProofStore } from "../../../scripts/ecl/synthetic_enterprise_home_job";

const hash = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const tenant = registry.activeTenants.find((row) =>
  row.packets.length > 0 && row.packets.every((packet) => packet.classification === "synthetic-demo") &&
  CANONICAL_TENANT_KEYS.includes(row.tenantKey as (typeof CANONICAL_TENANT_KEYS)[number]))!.tenantKey as (typeof CANONICAL_TENANT_KEYS)[number];
const releaseRecord = "docs/releases/records/test-insight-load.md";
const datasetId = "test-insight-load";
const prefix = "https://testproof.blob.core.windows.net/ecl-synthetic-intake/";

function populatedInput(): InsightInput {
  const sourceId = insightUuid("source");
  const row = (key: string) => ({ id: insightUuid(key), tenant_key: tenant, assessment_id: "test-assessment",
    source_record_id: sourceId, basis: "source_recorded", value_state: "known", review_state: "confirmed" });
  const object = (key: string, object_type: string, attributes_json = {}) => ({ ...row(key),
    object_type, canonical_semantic_type: object_type, display_name: key, lifecycle_state: "current", attributes_json });
  const measure = (key: string, subject: string, metric_key: string, value_number: number, scenario: string,
    attributes_json = {}) => ({ ...row(key), subject_object_id: insightUuid(subject), metric_key, value_number,
    unit: "USD", period_start: "2026-01-01", period_end: "2026-09-30", scenario, quality_state: "usable", attributes_json });
  const comparison = { metric_definition: "Recorded comparable cost", industry: "test-sector",
    cohort: "test-cohort", geography: "test-region", period_basis: "annual" };
  return { tenantKey: tenant, assessmentId: "test-assessment", asOf: "2026-10-12",
    objects: [object("Priority", "strategic_priority"), object("Program", "program"), object("Case", "ai_use_case"),
      object("Risk", "risk", { severity: "high" }), object("App", "application", { criticality: "critical" }),
      object("Platform", "infrastructure"), object("Benchmark", "external_benchmark", { metric_key: "comparable_cost",
        unit: "USD", range_low: 10, range_high: 20, comparison_contract: comparison,
        period_start: "2026-01-01", period_end: "2026-09-30", source_uri: "https://example.org/reference", valid_until: "2026-12-31" })],
    relationships: [{ ...row("risk applies"), from_object_id: insightUuid("Risk"), to_object_id: insightUuid("App"), relationship_type: "APPLIES_TO" },
      { ...row("app hosting"), from_object_id: insightUuid("App"), to_object_id: insightUuid("Platform"), relationship_type: "HOSTED_ON" }],
    measures: [measure("budget", "Program", "approved_budget_usd", 100, "planned", { budget_approval_status: "approved" }),
      measure("forecast", "Program", "forecast_usd", 120, "forecast"), measure("target", "Case", "outcome", 5, "target"),
      measure("actual cost", "App", "comparable_cost", 30, "actual", { comparison_contract: comparison })],
    sources: [{ id: sourceId, tenant_key: tenant, assessment_id: "test-assessment", source_file_id: insightUuid("file"),
      file_hash: "a".repeat(64), record_hash: insightHash({ fixture: true }), origin: "client_intake",
      quality_state: "accepted", parse_state: "parsed", access_class: "internal" }],
    metricDefinitions: ["approved_budget_usd", "forecast_usd", "outcome", "comparable_cost"].map((metric_key) => ({
      metric_key, unit: "USD", definition: metric_key === "comparable_cost" ? comparison.metric_definition : metric_key })),
    cubeMeasureLinks: [{ measure_id: insightUuid("budget"), metric_key: "approved_budget_usd", cube_slice_id: insightUuid("cube") }],
    cubeManifests: [{ id: insightUuid("cube manifest"), admission_status: "admitted" }],
  };
}

function fixture(input?: InsightInput) {
  jest.resetModules();
  const plan = buildIntegratedInsightPlan(input ?? { tenantKey: tenant, assessmentId: "test-assessment",
    asOf: "2026-10-12", objects: [], relationships: [], measures: [], sources: [],
    metricDefinitions: [], cubeManifests: [], cubeMeasureLinks: [] });
  const actor = { kind: "delegated_agent" as const, identity: "Test delegated manager",
    session_id: "11111111-1111-4111-8111-111111111111" };
  const text = "Delegate the declared synthetic workstream.\n";
  const reference = { thread_id: actor.session_id, message_id: actor.session_id, text_sha256: hash(text) };
  const authority = { contract_version: "nexus-delegated-approval-authority/v1", authority_id: "test-authority",
    status: "active", authorizer: "Alex Example", actor, human_authorization_reference: reference,
    human_authorization_text: text, source_message_independently_read: true,
    valid_from: "2026-10-12T10:00:00Z", expires_at: null, independent_human_attestation: false,
    independent_finance_attestation: false,
    scope: { allowed_operations: ["load"], allowed_serving_surfaces: ["home"] } };
  const scope = { operation: "load" as const, dataset_id: datasetId, tenant_key: tenant,
    assessment_id: plan.assessmentId, source_set_hash: plan.loadVersionHash, object_count: plan.findings.length,
    ingestion_method: "operator_aca_job" as const, release_record: releaseRecord,
    extra_bindings: { build_version: "integrated-insights-v1", release_id: plan.releaseId, as_of: plan.asOf,
      load_version_hash: plan.loadVersionHash, canonical_source_set_hash: plan.sourceSetHash,
      rule_set_hash: plan.ruleSetHash, result_hash: plan.resultHash,
      target_agent_ready: 0, target_review_state: "not_reviewed", target_state: "candidate" } };
  const fields = { contract_version: "nexus-delegated-approval-decision/v1" as const,
    authority_id: authority.authority_id, decision_id: "test-load-decision", authorizer: authority.authorizer,
    actor, human_authorization_reference: reference, scope, decided_at: "2026-10-12T12:00:00Z",
    expires_at: null, independent_human_attestation: false as const, independent_finance_attestation: false as const };
  const authorityBytes = Buffer.from(JSON.stringify(authority));
  const decisionBytes = Buffer.from(JSON.stringify({ ...fields, status: "approved_with_execution_conditions",
    evidence_hashes: {}, execution_conditions: ["Exact canonical replan before write"] }));
  const declaration: DelegatedApproval = { ...fields,
    authority_proof: { uri: `${prefix}operator-proof/delegated-approvals/test-authority/${hash(authorityBytes)}/authority.json`, sha256: hash(authorityBytes) },
    decision_proof: { uri: `${prefix}operator-proof/delegated-approvals/test-authority/${hash(decisionBytes)}/decision.json`, sha256: hash(decisionBytes) } };
  jest.doMock("@/lib/governance/delegation-authority-roots.json", () => ({ roots: [{
    authority_id: authority.authority_id, status: "active", authorizer: authority.authorizer, actor,
    human_authorization_reference: reference, authority_sha256: hash(authorityBytes),
    allowed_operations: ["load"], allowed_serving_surfaces: ["home"], tenant_scope: "declared_synthetic", expires_at: null }] }));
  jest.doMock("@/lib/governance/delegation-trusted-decisions.json", () => ({ decisions: [{
    authority_id: authority.authority_id, decision_id: fields.decision_id,
    decision_sha256: hash(decisionBytes), status: "active" }] }));
  const manifest = { dataset_id: datasetId, title: "Test candidates", client_key: tenant,
    source_layer: "signal", classification: "internal", owner: "Test steward", source_basis: "Test canonical records",
    ingestion_method: "operator_aca_job", retrieval_plan: "postgres_fts", retrieval_proof_required: true,
    expected_object_count: plan.findings.length, approved_by: "Alex Example", approved_at: "2026-10-12",
    load_approval: { approved_by: actor.identity, approved_at: "2026-10-12", assessment_id: plan.assessmentId,
      source_set_hash: plan.loadVersionHash, release_record: releaseRecord, delegated_decision: declaration } };
  const store: ProofStore = { uriFor: (path) => prefix + path, writeOnce: jest.fn(),
    read: jest.fn(async (uri) => uri === declaration.authority_proof.uri ? authorityBytes : decisionBytes) };
  const api = jest.requireActual<typeof import("@/lib/ecl/insights/load-approval")>("@/lib/ecl/insights/load-approval");
  const resolver = jest.requireActual<typeof import("@/lib/governance/dataset-manifest")>("@/lib/governance/dataset-manifest");
  return { plan, declaration, manifest, store, api, resolver };
}

beforeAll(() => Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true }));
beforeEach(() => { jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] }); jest.setSystemTime(new Date("2026-10-12T15:00:00Z")); });
afterEach(() => { jest.useRealTimers(); jest.dontMock("@/lib/governance/delegation-authority-roots.json"); jest.dontMock("@/lib/governance/delegation-trusted-decisions.json"); });

test("native load uses verified private bytes and independently computed candidate bindings", async () => {
  const f = fixture();
  const evidence = await f.api.readInsightLoadEvidence([f.manifest], datasetId, f.store);
  expect(f.resolver.resolveLoadApproval([f.manifest], f.api.insightLoadBinding(f.plan, datasetId, releaseRecord), evidence).approved).toBe(true);
  expect(f.store.read).toHaveBeenCalledWith(f.declaration.authority_proof.uri, 1_000_000);
  expect(f.store.read).toHaveBeenCalledWith(f.declaration.decision_proof.uri, 1_000_000);
});

for (const field of ["releaseId", "asOf", "sourceSetHash", "ruleSetHash", "resultHash", "loadVersionHash"] as const) {
  test(`candidate ${field} drift refuses verified delegated approval`, async () => {
    const f = fixture();
    const evidence = await f.api.readInsightLoadEvidence([f.manifest], datasetId, f.store);
    const plan = { ...f.plan, [field]: field === "asOf" ? "2026-10-13" : "b".repeat(64) };
    expect(f.resolver.resolveLoadApproval([f.manifest], f.api.insightLoadBinding(plan, datasetId, releaseRecord), evidence).approved).toBe(false);
  });
}

test("native release record, missing proof and forged context cannot authorize a load", async () => {
  const f = fixture();
  const binding = f.api.insightLoadBinding(f.plan, datasetId, releaseRecord);
  expect(f.resolver.resolveLoadApproval([f.manifest], binding).approved).toBe(false);
  const evidence = await f.api.readInsightLoadEvidence([f.manifest], datasetId, f.store);
  expect(f.resolver.resolveLoadApproval([f.manifest], { ...binding, release_record: "docs/releases/records/other.md" }, evidence).approved).toBe(false);
  expect(f.resolver.resolveLoadApproval([f.manifest], binding, structuredClone(evidence)).approved).toBe(false);
});

test("the persistent loader validates proof before its first write and keeps candidates inactive", async () => {
  const f = fixture();
  const native = jest.requireActual<typeof import("@/lib/ecl/insights/store")>("@/lib/ecl/insights/store");
  const options = { datasetId, manifests: [f.manifest], recordExists: () => true,
    runId: "test-native-load", releaseRecord, jobRecord: {} };
  const db = { query: jest.fn(async (sql: string) => ({ rows: sql.startsWith("select result_hash") ? [{
    result_hash: f.plan.resultHash, source_set_hash: f.plan.sourceSetHash, rule_set_hash: f.plan.ruleSetHash,
    first_run_id: options.runId, dataset_id: datasetId, load_version_hash: f.plan.loadVersionHash }] : [] })) };
  const database = db as unknown as JobDatabase;
  await expect(native.persistInsightCandidates(database, f.plan, options)).rejects.toThrow(/approval refused/);
  expect(db.query).not.toHaveBeenCalled();
  const approvalEvidence = await f.api.readInsightLoadEvidence([f.manifest], datasetId, f.store);
  expect(await native.persistInsightCandidates(database, f.plan, { ...options, approvalEvidence }))
    .toEqual({ findings: 0, idempotentReplay: false });
  expect(db.query.mock.calls.some(([sql]) => /home_active|tower_active|agent_ready=true/.test(sql))).toBe(false);
});

test("a populated certified load persists five rule classes and verifies every lineage family without publication", async () => {
  const f = fixture(populatedInput());
  const native = jest.requireActual<typeof import("@/lib/ecl/insights/store")>("@/lib/ecl/insights/store");
  expect(new Set(f.plan.findings.map((finding) => finding.ruleKey)).size).toBe(5);
  const runId = "test-populated-native-load";
  const stored: Record<string, unknown>[] = [];
  const refs = new Map<string, { finding_id: unknown; ref_id: unknown }[]>();
  const db = { query: jest.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.startsWith("select result_hash")) return { rows: [{ result_hash: f.plan.resultHash,
      source_set_hash: f.plan.sourceSetHash, rule_set_hash: f.plan.ruleSetHash, first_run_id: runId,
      dataset_id: datasetId, load_version_hash: f.plan.loadVersionHash }] };
    if (sql.startsWith("insert into ecl_projection.enterprise_insight_finding")) stored.push({
      id: params[0], finding_hash: params[8], payload_json: JSON.parse(params[9] as string),
      governance_json: JSON.parse(params[10] as string) });
    const inserted = sql.match(/^insert into ecl_projection\.(enterprise_insight_\w+_ref)/)?.[1];
    if (inserted) refs.set(inserted, [...(refs.get(inserted) ?? []), { finding_id: params[2], ref_id: params[3] }]);
    if (sql.startsWith("select id::text, finding_hash")) return { rows: stored };
    const selected = sql.match(/from ecl_projection\.(enterprise_insight_\w+_ref) r/)?.[1];
    return { rows: selected ? refs.get(selected) ?? [] : [] };
  }) };
  const approvalEvidence = await f.api.readInsightLoadEvidence([f.manifest], datasetId, f.store);
  expect(await native.persistInsightCandidates(db as unknown as JobDatabase, f.plan, {
    datasetId, manifests: [f.manifest], recordExists: () => true, runId, releaseRecord, jobRecord: {}, approvalEvidence,
  })).toEqual({ findings: 5, idempotentReplay: false });
  expect(stored).toHaveLength(5);
  for (const item of stored) {
    expect(item.payload_json).toMatchObject({ reviewState: "not_reviewed", agentReady: false });
    expect(item.governance_json).toMatchObject({ agent_readiness_status: "not_reviewed", retrievability: "not_indexed" });
  }
  expect(refs.size).toBe(5);
  expect(db.query.mock.calls.some(([sql]) => /home_active|tower_active|agent_ready=true/.test(sql))).toBe(false);
});

for (const uri of ["https://other.blob.core.windows.net/ecl-synthetic-intake/operator-proof/delegated-approvals/a/" + "a".repeat(64) + "/authority.json",
  prefix + "other/" + "a".repeat(64) + "/authority.json",
  prefix + "operator-proof/delegated-approvals/a/" + "a".repeat(64) + "/authority.json?sig=private"]) {
  test("outside-store or credential-bearing proof refuses before any network read: " + uri, async () => {
    const f = fixture(); f.declaration.authority_proof.uri = uri;
    await expect(f.api.readInsightLoadEvidence([f.manifest], datasetId, f.store)).rejects.toThrow();
    expect(f.store.read).not.toHaveBeenCalled();
  });
}

test("byte drift and oversized custom-store documents refuse", async () => {
  const f = fixture();
  (f.store.read as jest.Mock).mockResolvedValue(Buffer.from("changed"));
  await expect(f.api.readInsightLoadEvidence([f.manifest], datasetId, f.store)).rejects.toThrow();
  (f.store.read as jest.Mock).mockResolvedValue(Buffer.alloc(1_000_001));
  await expect(f.api.readInsightLoadEvidence([f.manifest], datasetId, f.store)).rejects.toThrow(/size limit/);
});

test("human approvals, unrelated declarations and duplicate selected manifests do not read delegation proofs", async () => {
  const f = fixture();
  const human = { ...f.manifest, load_approval: { ...f.manifest.load_approval, approved_by: "Morgan Example", delegated_decision: undefined } };
  expect(await f.api.readInsightLoadEvidence([human], datasetId, f.store)).toBeUndefined();
  expect(await f.api.readInsightLoadEvidence([f.manifest], "other-dataset", f.store)).toBeUndefined();
  expect(await f.api.readInsightLoadEvidence([f.manifest, f.manifest], datasetId, f.store)).toBeUndefined();
  expect(f.store.read).not.toHaveBeenCalled();
  expect(f.resolver.resolveLoadApproval([human], f.api.insightLoadBinding(f.plan, datasetId, releaseRecord)).approved).toBe(true);
});
