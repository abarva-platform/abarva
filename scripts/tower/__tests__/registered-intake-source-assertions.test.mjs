import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildRegisteredIntakeCandidate } from "../build-registered-intake-reload-candidate.mjs";
import { buildPhysicalPlan, validatePhysicalPlan } from "../stage-registered-intake-partial.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const tenantKey = registry.activeTenants.find((tenant) => tenant.packets?.some((packet) => packet.classification === "synthetic-demo"))?.tenantKey;
const build = (variant) => buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey, variant });

test("v6 keeps the exact source set and distinguishes unverified assertions from claimable value", () => {
  const prior = build("source-fields-v1");
  const report = build("source-assertions-v1");
  assert.equal(crypto.createHash("sha256").update(`${JSON.stringify(prior, null, 2)}\n`).digest("hex"),
    "bc04b5bbd56115272c41973bafea26bf5e76834467f76f934fc48272d9889c14");
  assert.equal(report.input_fingerprint_sha256, prior.input_fingerprint_sha256);
  assert.notEqual(report.assessment_id, prior.assessment_id);
  assert.equal(report.quality_gate_status, "pass");
  assert.deepEqual(report.source_assertion_coverage, {
    program_expected_value_rows: 38, outcome_finance_amount_rows: 7, benefit_finance_amount_rows: 18,
    benefit_funded_spend_rows: 18, benefit_actual_spend_ytd_rows: 18,
    usage_promise_rows: 18, usage_finance_amount_rows: 18, outcome_feed_finance_amount_rows: 18,
  });
  assert.equal(report.gates.find((gate) => gate.id === "source_assertion_field_coverage")?.status, "pass");
  assert.equal(report.gates.find((gate) => gate.id === "foundation_declared_identity")?.status, "pass");
  assert.equal(report.gates.find((gate) => gate.id === "relationship_source_census")?.status, "pass");
  assert.equal(report.canonical.foundations.source_objects.length, 1157);
  assert.deepEqual(report.canonical.foundations.relationship_census,
    { source_rows: 2302, complete_declared_endpoint_ids: 2123, missing_from_id: 173,
      missing_to_id: 6, unique_declared_edge_keys: 2027, repeated_declared_edge_rows: 96,
      workshop_certified_rows: 0, canonical_edges_admitted: 0,
      rule: "Raw rows may be staged in Layer 2; no new graph edge passes independent evidence and physical dictionary review." });
  assert.ok(report.canonical.programs.every((row) => row.source_stated_expected_value_usd !== null &&
    row.approved_fy_budget_usd === null));
  assert.equal(report.canonical.outcome_metrics.filter((row) => row.source_asserted_finance_value_usd !== null).length, 7);
  assert.equal(report.canonical.ai_claims.filter((row) => row.source_asserted_finance_value_usd !== null).length, 18);
  assert.ok(report.canonical.ai_claims.every((row) => row.claimable_value_usd === null &&
    row.source_evidence_id && row.evidence_reference_registered === false));
  assert.ok(report.canonical.ai_use_cases.every((row) => row.claimable_value_usd === null &&
    row.planning_promise_usd === null && row.active_users === null));
});

test("v6 physical plan ties each asserted amount to one exact source record and canonical measure", () => {
  const report = build("source-assertions-v1");
  const { plan, viewCounts } = buildPhysicalPlan(report);
  assert.equal(validatePhysicalPlan(report, plan, viewCounts).status, "pass");
  assert.equal(plan.sourceFiles.length, 17);
  assert.equal(plan.sourceRecords.length, 3775);
  assert.equal(plan.objects.length, 1394);
  assert.equal(plan.measures.length, 1410);
  assert.equal(plan.projectionMeasureRefs.length, 558);
  assert.equal(Object.values(viewCounts).reduce((sum, count) => sum + count, 0), 352);
  assert.ok(plan.projectionManifests.every((row) => row.projection_version === 6));
  assert.equal(plan.measures.filter((row) => row.metric_key === "program_source_expected_value_usd").length, 38);
  assert.equal(plan.measures.filter((row) => row.metric_key === "outcome_source_finance_assertion_usd").length, 7);
  assert.equal(plan.measures.filter((row) => row.metric_key === "benefit_feed_source_finance_assertion_usd").length, 18);
  assert.equal(plan.measures.filter((row) => row.metric_key.startsWith("spend_source_")).length, 81);
  assert.equal(plan.measures.filter((row) => row.metric_key.startsWith("ai_outcome_feed_")).length, 72);
  assert.equal(plan.measures.filter((row) => ["usage_feed_power_users", "usage_feed_usage_events"].includes(row.metric_key)).length, 36);
  assert.equal(plan.measures.filter((row) => ["benefit_feed_source_funded_spend_usd", "benefit_feed_source_actual_spend_ytd_usd",
    "usage_feed_source_promised_value_usd", "usage_feed_source_finance_assertion_usd"].includes(row.metric_key)).length, 72);
  assert.ok(plan.measures.filter((row) => row.metric_key.endsWith("finance_assertion_usd"))
    .every((row) => row.source_record_id && row.attributes_json.source_assertion_only === true &&
      row.attributes_json.claimable_value_usd === null));
  assert.ok(plan.commandRows.every((row) => row.funded_amount_usd === null && row.claimable_value_usd === null));
  assert.ok(plan.valueRows.every((row) => row.claimable_value_usd === null && row.blocked_value_usd === null));
  assert.equal(plan.sourceRecords.filter((row) => row.record_type === "13_evidence_sources").length, 0);
  assert.equal(plan.sourceRecords.filter((row) => row.record_type === "12_relationships").length, 2302);
  assert.equal(plan.sourceRecords.filter((row) => row.record_type === "maturity_source_record_identity_unresolved").length, 17);
  assert.equal(plan.objects.filter((row) => row.attributes_json.source_population === "registered_foundation_intake").length, 1157);
  assert.equal(plan.sourceFiles.filter((row) => row.file_name.startsWith("extracts/")).length, 0);
});

test("v6 physical gate rejects altered program, outcome and benefit assertions", () => {
  const report = build("source-assertions-v1");
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const program = plan.commandRows.find((row) => row.page_key === "decision_lanes");
  const metric = plan.valueRows.find((row) => row.row_key.startsWith("metric:") &&
    row.display_payload_json.source_asserted_finance_value_usd !== null);
  const claim = plan.valueRows.find((row) => row.page_key === "value_proof" &&
    !row.row_key.startsWith("metric:"));
  program.display_payload_json.source_stated_expected_value_usd += 1;
  metric.display_payload_json.source_claim_readiness = "approved";
  claim.display_payload_json.source_tower_claim_allowed = "forged";
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "fail");
  assert.equal(gate.errors.filter((error) => error.includes("source assertion differs")).length, 3);
});

test("v6 physical gate rejects altered spend, usage and separate outcome-feed fields", () => {
  const report = build("source-assertions-v1");
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const spend = plan.valueRows.find((row) => row.row_key.startsWith("spend:"));
  const usage = plan.aiRows.find((row) => row.display_payload_json.page_key === "adoption_lens");
  const claim = plan.valueRows.find((row) => row.display_payload_json.page_key === "value_proof" &&
    !row.row_key.startsWith("metric:"));
  spend.display_payload_json.source_forecast_next_year_usd += 1;
  usage.display_payload_json.usage_events += 1;
  claim.display_payload_json.outcome_feed_actual += 1;
  claim.display_payload_json.usage_feed_source_finance_assertion_usd += 1;
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "fail");
  assert.ok(gate.errors.some((error) => error.includes("spend source field differs")));
  assert.ok(gate.errors.some((error) => error.includes("usage source field differs")));
  assert.ok(gate.errors.some((error) => error.includes("outcome feed field differs")));
  assert.ok(gate.errors.some((error) => error.includes("separate money source field differs")));
});

test("v6 physical gate rejects changed Foundation facts and raw relationship source records", () => {
  const report = build("source-assertions-v1");
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const foundation = plan.objects.find((row) => row.attributes_json.source_population === "registered_foundation_intake");
  const relationshipFile = plan.sourceFiles.find((row) => row.file_name === "12_relationships.csv");
  const relationship = plan.sourceRecords.find((row) => row.source_file_id === relationshipFile.id);
  foundation.attributes_json.decision_rights = "forged";
  relationship.payload_json.relationship_type = "forged";
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "fail");
  assert.ok(gate.errors.some((error) => error.includes("Foundation object differs")));
  assert.ok(gate.errors.some((error) => error.includes("source record differs from exact intake")));
});

test("v6 write refuses absent exact approval before opening a database", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-source-assertions-refusal-"));
  try {
    const result = spawnSync(process.execPath, ["--import", "tsx",
      path.join(ROOT, "scripts/tower/stage-registered-intake-partial.mjs"),
      "--tenant-key", tenantKey, "--candidate-variant", "source-assertions-v1",
      "--out-dir", outDir, "--write", "--job-run-id", "test-refusal",
    ], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATABASE_URL: "" } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Refusing stage\/proof/);
    assert.equal(fs.existsSync(path.join(outDir, "stage-receipt.json")), false);
    const preflight = JSON.parse(fs.readFileSync(path.join(outDir, "stage-preflight.json"), "utf8"));
    assert.equal(preflight.load_approval_status, "missing_or_mismatched");
    assert.equal(preflight.physical_quality_gate_status, "pass");
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
