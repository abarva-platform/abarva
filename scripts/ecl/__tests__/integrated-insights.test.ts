import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import { evaluateGovernedObject } from "../../../src/lib/governance/context-corpus-policy";
import { buildIntegratedInsightPlan, insightHash, insightUuid } from "../../../src/lib/ecl/insights/engine";
import { candidateGovernance, persistInsightCandidates } from "../../../src/lib/ecl/insights/store";
import type { InsightInput, InsightMeasure, InsightObject, InsightRelationship } from "../../../src/lib/ecl/insights/types";
import type { JobDatabase } from "../synthetic_enterprise_home_job";

const tenantKey = CANONICAL_TENANT_KEYS[0];
const assessmentId = "test-integrated-insights";
const sourceId = insightUuid("source");
const row = (key: string) => ({ id: insightUuid(key), tenant_key: tenantKey, assessment_id: assessmentId,
  source_record_id: sourceId, basis: "source_recorded", value_state: "known", review_state: "confirmed" });
const object = (key: string, objectType: string, attrs = {}): InsightObject => ({ ...row(key),
  object_type: objectType, canonical_semantic_type: objectType, display_name: key,
  lifecycle_state: "current", attributes_json: attrs });
const edge = (key: string, from: string, verb: string, to: string): InsightRelationship => ({ ...row(key),
  from_object_id: insightUuid(from), to_object_id: insightUuid(to), relationship_type: verb });
const measure = (key: string, subject: string, metric: string, value: number | null, scenario: string,
  attrs = {}): InsightMeasure => ({ ...row(key), subject_object_id: insightUuid(subject), metric_key: metric,
  value_number: value, unit: "USD", period_start: "2026-01-01", period_end: "2026-09-30",
  scenario, quality_state: "usable", attributes_json: attrs });
const comparison = { metric_definition: "Recorded comparable cost", industry: "test-sector",
  cohort: "test-cohort", geography: "test-region", period_basis: "annual" };

export function input(): InsightInput {
  return { tenantKey, assessmentId, asOf: "2026-10-11",
    objects: [object("Priority A", "strategic_priority"), object("Program A", "program"),
      object("Case A", "ai_use_case"), object("Risk A", "risk", { severity: "high" }),
      object("App A", "application", { criticality: "critical" }), object("Platform A", "infrastructure"),
      object("Benchmark A", "external_benchmark", { metric_key: "comparable_cost", unit: "USD", range_low: 10,
        range_high: 20, comparison_contract: { ...comparison }, period_start: "2026-01-01", period_end: "2026-09-30",
        source_uri: "https://example.org/reference", valid_until: "2026-12-31" })],
    relationships: [edge("risk applies", "Risk A", "APPLIES_TO", "App A"),
      edge("hosted on", "App A", "HOSTED_ON", "Platform A")],
    measures: [measure("budget", "Program A", "approved_budget_usd", 100, "planned", { budget_approval_status: "approved" }),
      measure("forecast", "Program A", "forecast_usd", 120, "forecast"),
      measure("target", "Case A", "outcome", 5, "target"),
      measure("actual cost", "App A", "comparable_cost", 30, "actual", { comparison_contract: { ...comparison } })],
    sources: [{ id: sourceId, tenant_key: tenantKey, assessment_id: assessmentId, source_file_id: insightUuid("file"),
      file_hash: "a".repeat(64), record_hash: insightHash({ fixture: true }), origin: "client_intake", quality_state: "accepted", parse_state: "parsed", access_class: "internal" }],
    metricDefinitions: ["approved_budget_usd", "forecast_usd", "outcome", "comparable_cost"].map((metric_key) =>
      ({ metric_key, unit: "USD", definition: metric_key === "comparable_cost" ? comparison.metric_definition : metric_key })),
    cubeMeasureLinks: [{ measure_id: insightUuid("budget"), metric_key: "approved_budget_usd", cube_slice_id: insightUuid("cube") }],
    cubeManifests: [{ id: insightUuid("cube manifest"), admission_status: "admitted" }],
  };
}
const finding = (data: InsightInput, rule: string) => buildIntegratedInsightPlan(data).findings.filter((row) => row.ruleKey === rule);

test("operator image carries the release binding and migration commands select only the named schema", () => {
  const releaseRecord = "docs/releases/records/2026-10-11-enterprise-integrated-insight-candidates.md";
  const dockerfile = readFileSync(new URL("../../../Dockerfile", import.meta.url), "utf8");
  assert.ok(dockerfile.split("\n").includes(`COPY --from=build --chown=node:node /app/${releaseRecord} ./${releaseRecord}`));
  const exclusions = readFileSync(new URL("../../../.dockerignore", import.meta.url), "utf8").split(/\r?\n/);
  let position = exclusions.indexOf("docs/*");
  for (const rule of ["!docs/releases/", "docs/releases/*", "!docs/releases/records/", "docs/releases/records/*", `!${releaseRecord}`]) {
    const next = exclusions.indexOf(rule);
    assert.ok(next > position, `Required build-context rule absent or out of order: ${rule}`);
    position = next;
  }
  const scripts = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8")).scripts;
  const migration = "20261011210000_enterprise_integrated_insight_candidates.sql";
  for (const [mode, flag] of [["dry", "--dry"], ["apply", "--ci"]]) {
    assert.equal(scripts[`ecl:integrated-insights:migrate:${mode}`], `npx tsx src/scripts/run-migrations.ts ${flag} --force ${migration}`);
  }
});

test("five supported rule classes fire with stable evidence and candidate-only governance", () => {
  const plan = buildIntegratedInsightPlan(input());
  assert.equal(plan.findings.length, 5);
  for (const item of plan.findings) {
    assert.ok(item.sourceRecordIds.length);
    assert.ok(item.objectIds.length);
    assert.equal(item.agentReady, false);
    assert.equal(item.reviewState, "not_reviewed");
    assert.equal(evaluateGovernedObject(candidateGovernance(plan, item, "test-run")).agentReady, false);
  }
});
test("ordering and JSON property order cannot change source, rules or results", () => {
  const a = input(); const b = structuredClone(a);
  b.objects.reverse(); b.relationships.reverse(); b.measures.reverse(); b.metricDefinitions.reverse();
  b.objects.find((row) => row.object_type === "risk")!.attributes_json = { severity: "high" };
  assert.deepEqual(buildIntegratedInsightPlan(a), buildIntegratedInsightPlan(b));
});
test("findings from synthetic files remain explicitly not client-attested", () => {
  const data = input(); data.sources[0].origin = "synthetic_generator";
  const plan = buildIntegratedInsightPlan(data);
  assert.ok(plan.findings.length > 0);
  assert.ok(plan.findings.every((finding) => finding.caveats.includes("Includes synthetic source records; not client-attested.")));
});
test("unhashed source records cannot establish a finding", () => {
  const data = input(); data.sources[0].record_hash = "unknown";
  assert.equal(buildIntegratedInsightPlan(data).findings.length,0);
});
test("as-of and canonical input changes bind a new exact load version", () => {
  const a = input(); const b = structuredClone(a); b.measures[1].value_number = 121;
  assert.notEqual(buildIntegratedInsightPlan(a).loadVersionHash, buildIntegratedInsightPlan(b).loadVersionHash);
  b.asOf = "2026-10-12";
  assert.notEqual(buildIntegratedInsightPlan(a).releaseId, buildIntegratedInsightPlan(b).releaseId);
});
test("invalid dates and undeclared tenants are refused", () => {
  for (const asOf of ["2026-02-30", "tomorrow", "2026-13-01"]) assert.throws(() => buildIntegratedInsightPlan({ ...input(), asOf }));
  assert.throws(() => buildIntegratedInsightPlan({ ...input(), tenantKey: "undeclared" }));
});
for (const family of ["objects", "relationships", "measures", "sources"] as const) {
  test(`${family}: cross-tenant and cross-assessment rows are refused`, () => {
    const data = input(); data[family][0].tenant_key = "other";
    assert.throws(() => buildIntegratedInsightPlan(data), /Cross-tenant/);
    data[family][0].tenant_key = tenantKey; data[family][0].assessment_id = "other-assessment";
    assert.throws(() => buildIntegratedInsightPlan(data), /cross-assessment/);
  });
  test(`${family}: duplicate canonical IDs are refused`, () => {
    const data = input(); data[family].push(structuredClone(data[family][0]) as never);
    assert.throws(() => buildIntegratedInsightPlan(data), /Duplicate/);
  });
}
for (const state of ["blocked", "rejected", "superseded"]) {
  test(`a ${state} record does not establish a finding`, () => {
    const data = input(); data.objects.find((row) => row.object_type === "strategic_priority")!.review_state = state;
    assert.equal(finding(data, "priority-delivery-links").length, 0);
  });
}
for (const property of ["origin", "quality_state", "access_class", "parse_state"] as const) {
  test(`source ${property} boundary is enforced`, () => {
    const data = input();
    data.sources[0][property] = property === "origin" ? "synthetic_generator" : property === "access_class" ? "restricted" : "blocked";
    const plan = buildIntegratedInsightPlan(data);
    assert.equal(plan.findings.filter((row) => row.kind === "benchmark_comparison").length, 0);
    if (property !== "origin") assert.equal(plan.findings.length, 0);
  });
}
test("inferred relationships and name-only similarity cannot establish a dependency", () => {
  const data = input(); data.relationships[0].basis = "model_inferred";
  assert.equal(finding(data, "risk-critical-dependency").length, 0);
});
test("reversed edge direction cannot establish a dependency", () => {
  const data = input(); const edge = data.relationships[0];
  [edge.from_object_id, edge.to_object_id] = [edge.to_object_id, edge.from_object_id];
  assert.equal(finding(data, "risk-critical-dependency").length, 0);
});
test("canonical criticality_tier establishes criticality without an invented attribute", () => {
  const data = input();
  data.objects.find((row) => row.object_type === "application")!.attributes_json = { criticality_tier: "tier_1" };
  assert.equal(finding(data, "risk-critical-dependency").length, 1);
});
test("conflicting or unknown criticality declarations cannot establish a critical path", () => {
  for (const criticality of ["low", "unknown"]) {
    const data = input();
    data.objects.find((row) => row.object_type === "application")!.attributes_json = { criticality, criticality_tier: "tier_1" };
    assert.equal(finding(data, "risk-critical-dependency").length, 0);
  }
});
function deploymentInput() {
  const data = input();
  data.objects.push(object("Deployment A", "application_deployment"));
  data.relationships = [data.relationships[0], edge("deployment of", "Deployment A", "DEPLOYMENT_OF", "App A"),
    edge("deployment hosted", "Deployment A", "HOSTED_ON", "Platform A")];
  return data;
}
test("declared deployment hosting preserves all four objects and three edges", () => {
  const data = deploymentInput();
  const rows = finding(data, "risk-critical-dependency");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].objectIds.length, 4);
  assert.deepEqual(rows[0].relationshipIds, data.relationships.map((row) => row.id).sort());
  assert.match(rows[0].detail, /declared deployment Deployment A is hosted on Platform A/);
});
test("a reversed deployment-of edge does not establish application hosting", () => {
  const data = deploymentInput(); const link = data.relationships[1];
  [link.from_object_id, link.to_object_id] = [link.to_object_id, link.from_object_id];
  assert.equal(finding(data, "risk-critical-dependency").length, 0);
});
test("inferred hosting and a non-deployment intermediary cannot establish the path", () => {
  for (const mutation of ["inferred", "wrong-type"]) {
    const data = deploymentInput();
    if (mutation === "inferred") data.relationships[2].basis = "model_inferred";
    else data.objects.find((row) => row.object_type === "application_deployment")!.object_type = "application";
    if (mutation === "wrong-type") data.objects.find((row) => row.display_name === "Deployment A")!.canonical_semantic_type = "application";
    assert.equal(finding(data, "risk-critical-dependency").length, 0);
  }
});
test("declared program link resolves the bounded priority mapping gap", () => {
  const data = input(); data.relationships.push(edge("advances", "Program A", "ADVANCES_PRIORITY", "Priority A"));
  assert.equal(finding(data, "priority-delivery-links").length, 0);
});
test("an unavailable program family is not proof priorities have no programs", () => {
  const data = input(); data.objects = data.objects.filter((row) => row.object_type !== "program");
  const plan = buildIntegratedInsightPlan(data);
  assert.equal(plan.evaluations[0].state, "not_assessable");
});
for (const mutation of ["period", "unit", "duplicate", "unknown", "not-a-forecast"] as const) {
  test(`financial comparison abstains for ${mutation}`, () => {
    const data = input(); const forecast = data.measures[1];
    if (mutation === "period") forecast.period_end = "2026-12-31";
    if (mutation === "unit") forecast.unit = "EUR";
    if (mutation === "duplicate") data.measures.push({ ...forecast, id: insightUuid("duplicate forecast") });
    if (mutation === "unknown") { forecast.value_state = "unknown"; forecast.value_number = null; }
    if (mutation === "not-a-forecast") forecast.scenario = "actual";
    assert.equal(finding(data, "program-forecast-budget").length, 0);
  });
}
test("a zero actual is recorded, not a missing AI outcome", () => {
  const data = input(); data.measures.push(measure("actual", "Case A", "outcome", 0, "actual"));
  assert.equal(finding(data, "ai-target-actual-gap").length, 0);
});
test("a future target period is not yet a measurement gap", () => {
  const data = input(); data.measures[2].period_end = "2027-01-01";
  assert.equal(finding(data, "ai-target-actual-gap").length, 0);
});
for (const dimension of ["industry", "cohort", "geography", "period_basis", "metric_definition"]) {
  test(`benchmark abstains when ${dimension} differs`, () => {
    const data = input(); const contract = data.measures[3].attributes_json.comparison_contract as Record<string, string>;
    contract[dimension] = "incompatible";
    assert.equal(finding(data, "compatible-benchmark").length, 0);
  });
}
test("unreviewed, expired, uncited and malformed benchmarks abstain", () => {
  for (const mutation of ["review", "expiry", "citation", "range"]) {
    const data = input(); const benchmark = data.objects.find((row) => row.object_type === "external_benchmark")!;
    if (mutation === "review") benchmark.review_state = "not_reviewed";
    if (mutation === "expiry") benchmark.attributes_json.valid_until = "2026-01-01";
    if (mutation === "citation") benchmark.attributes_json.source_uri = "";
    if (mutation === "range") benchmark.attributes_json.range_high = 1;
    assert.equal(finding(data, "compatible-benchmark").length, 0);
  }
});
test("benchmark references with a different or unspecified dated period abstain", () => {
  for (const period of ["2025-09-30", undefined]) {
    const data = input(); data.objects.find((row) => row.object_type === "external_benchmark")!.attributes_json.period_end = period;
    assert.equal(finding(data, "compatible-benchmark").length,0);
  }
});
test("Cube links preserve matching measure lineage without supplying invented values", () => {
  const data = input(); data.cubeMeasureLinks.push({ measure_id: insightUuid("forecast"), metric_key: "wrong", cube_slice_id: insightUuid("wrong cube") });
  const item = finding(data, "program-forecast-budget")[0];
  assert.deepEqual(item.cubeSliceIds, [insightUuid("cube")]);
});

function manifest(plan = buildIntegratedInsightPlan(input())) {
  return { dataset_id: "test-integrated", client_key: tenantKey, tenant_scope: "canonical_tenant", title: "Test candidates",
    source_layer: "signal", classification: "confidential", owner: "test", source_basis: "test fixture",
    ingestion_method: "operator_aca_job", retrieval_plan: "postgres_fts", retrieval_proof_required: true,
    expected_object_count: plan.findings.length, approved_by: "Morgan Example", approved_at: "2026-10-11",
    load_approval: { approved_by: "Morgan Example", approved_at: "2026-10-11", assessment_id: assessmentId,
      source_set_hash: plan.loadVersionHash, release_record: "docs/releases/records/test.md" } };
}
const options = (manifests: unknown[]) => ({ datasetId: "test-integrated", manifests, recordExists: () => true,
  runId: "test-run", releaseRecord: "docs/releases/records/test.md", jobRecord: {} });
test("no manifest, no approval or wrong version refuses before the first write", async () => {
  const plan = buildIntegratedInsightPlan(input());
  for (const manifests of [[], [{ ...manifest(), load_approval: null }],
    [{ ...manifest(), load_approval: { ...manifest().load_approval, source_set_hash: "b".repeat(64) } }]]) {
    let writes = 0;
    const db = { query: async () => { writes++; return { rows: [] }; } } as unknown as JobDatabase;
    await assert.rejects(persistInsightCandidates(db, plan, options(manifests)), /approval refused/i);
    assert.equal(writes, 0);
  }
});
test("approved source hash alone cannot authorize changed rules or result", async () => {
  const plan = buildIntegratedInsightPlan(input()); const declaration = manifest(plan);
  declaration.load_approval.source_set_hash = plan.sourceSetHash;
  const db = { query: async () => { throw new Error("unexpected write"); } } as unknown as JobDatabase;
  await assert.rejects(persistInsightCandidates(db, plan, options([declaration])), /different source-set hash/);
});
test("approval count and release-record bindings are exact", async () => {
  const plan = buildIntegratedInsightPlan(input());
  const db = { query: async () => { throw new Error("unexpected write"); } } as unknown as JobDatabase;
  await assert.rejects(persistInsightCandidates(db, plan, options([{ ...manifest(), expected_object_count: 1 }])), /expects/);
  await assert.rejects(persistInsightCandidates(db, plan, { ...options([manifest()]), releaseRecord: "docs/releases/records/other.md" }), /record mismatch/);
});
test("idempotent content readback detects altered stored payload", async () => {
  const plan = buildIntegratedInsightPlan(input());
  const db = { query: async (sql: string) => {
    if (sql.startsWith("select result_hash")) return { rows: [{ result_hash: plan.resultHash,
      source_set_hash: plan.sourceSetHash, rule_set_hash: plan.ruleSetHash, first_run_id: "earlier-run", dataset_id: "test-integrated", load_version_hash: plan.loadVersionHash }] };
    if (sql.startsWith("select id::text")) return { rows: plan.findings.map((item) => ({ id: item.id,
      finding_hash: insightHash(item), payload_json: { ...item, headline: "tampered" } })) };
    return { rows: [] };
  } } as unknown as JobDatabase;
  await assert.rejects(persistInsightCandidates(db, plan, options([manifest()])), /readback failed/);
});
