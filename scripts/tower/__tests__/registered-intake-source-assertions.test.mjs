import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildRegisteredIntakeCandidate, csvRows } from "../build-registered-intake-reload-candidate.mjs";
import { buildPhysicalPlan, validatePhysicalPlan, OUTCOME_MEASURE_PARITY_SQL } from "../stage-registered-intake-partial.mjs";
import { adaptRegisteredSyntheticFinanceBudget } from "../adapters/registered-synthetic-finance-budget.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const tenantKey = registry.activeTenants.find((tenant) => tenant.packets?.some((packet) => packet.classification === "synthetic-demo"))?.tenantKey;
const build = (variant) => buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey, variant });

test("selected synthetic Finance source requires exact bytes, six amounts, and run/change parity", () => {
  const tenant = registry.activeTenants.find((item) => item.tenantKey === tenantKey);
  const file = "SA02_IT_Finance_Budget_Spend_Extract.csv";
  const bytes = fs.readFileSync(path.join(ROOT, tenant.canonicalInputRoot, file));
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  const rows = csvRows(bytes.toString("utf8")).map((row, index) => ({ ...row, __source_row: index + 2 }));
  const selection = tenant.syntheticDemoBudgetSelection;
  assert.equal(sha256, selection.sourceSha256);
  assert.equal(rows.length, 70);
  const adapted = adaptRegisteredSyntheticFinanceBudget({ rows, selection, metadata: { sha256 } });
  assert.equal(adapted.line_items.length, 70);
  assert.equal(new Set(adapted.line_items.map((item) => item.source_record_id)).size, 70);
  assert.deepEqual(adapted.line_items.map((item) => item.run_change_flag).reduce((counts, flag) =>
    ({ ...counts, [flag]: (counts[flag] || 0) + 1 }), {}), { run: 31, change: 39 });
  assert.equal(adapted.run_change_split.run.amount_usd + adapted.run_change_split.change.amount_usd,
    adapted.amount_usd);
  assert.ok(adapted.line_items.every((item) => item.variance_usd ===
    item.forecast_spend_usd - item.budget_amount_usd &&
    ["budget_amount_usd", "actual_spend_usd", "forecast_spend_usd", "committed_spend_usd",
      "invoice_amount_usd", "variance_usd"].every((field) =>
      Number.isFinite(item[field]) && item.value_source_by_field[field]?.endsWith(`:${field}`))));
  assert.throws(() => adaptRegisteredSyntheticFinanceBudget({ rows, selection,
    metadata: { sha256: "modified-source" } }), /exact registered file/);
  assert.throws(() => adaptRegisteredSyntheticFinanceBudget({ rows: rows.map((row, index) =>
    index === 0 ? { ...row, variance_usd: "0" } : row), selection, metadata: { sha256 } }),
  /amounts or variance changed/);
  assert.throws(() => adaptRegisteredSyntheticFinanceBudget({ rows: rows.map((row, index) =>
    index === 0 ? { ...row, run_change_flag: "other" } : row), selection, metadata: { sha256 } }),
  /identity, period, or source status changed/);
});

test("v6 expands the registered source set and distinguishes unverified assertions from claimable value", () => {
  const prior = build("source-fields-v1");
  const report = build("source-assertions-v1");
  assert.equal(crypto.createHash("sha256").update(`${JSON.stringify(prior, null, 2)}\n`).digest("hex"),
    "bc04b5bbd56115272c41973bafea26bf5e76834467f76f934fc48272d9889c14");
  assert.notEqual(report.input_fingerprint_sha256, prior.input_fingerprint_sha256);
  assert.equal(Object.entries(report.source_manifest).filter(([file, entry]) =>
    !file.startsWith("extracts/") && entry.content_disposition !== "hash_count_only").length, 23);
  assert.equal(report.canonical.budget.status, "no_independent_finance_attestation");
  assert.equal(report.canonical.budget.approved_fy_budget_usd, null);
  assert.equal(report.canonical.synthetic_demo_fy26_budget.amount_usd, 650000000);
  assert.equal(report.canonical.synthetic_demo_fy26_budget.run_change_split.run.amount_usd, 487500000);
  assert.equal(report.canonical.synthetic_demo_fy26_budget.run_change_split.change.amount_usd, 162500000);
  assert.equal(report.canonical.synthetic_demo_fy26_budget.run_change_split.run.line_item_count, 31);
  assert.equal(report.canonical.synthetic_demo_fy26_budget.run_change_split.change.line_item_count, 39);
  for (const file of ["00_enterprise_profile.csv", "01_business_functions.csv", "01b_business_segments.csv",
    "03_workforce_roles.csv", "17_service_scope_managed_services.csv"]) assert.ok(report.source_manifest[file]);
  assert.equal(report.source_manifest["SA10_AI_Value_Interview_Evidence.csv"].content_disposition, "hash_count_only");
  assert.equal(report.source_manifest["SA10_AI_Value_Interview_Evidence.csv"].row_count, 996);
  assert.equal(report.source_manifest["SA10_AI_Value_Interview_Evidence.csv"].content_loaded, false);
  assert.equal(report.source_manifest["extracts/ms365-copilot-usage-user-detail.csv"].content_disposition, "hash_count_only");
  assert.equal(report.source_manifest["extracts/ms365-copilot-usage-user-detail.csv"].content_loaded, false);
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
  assert.equal(report.canonical.foundations.source_objects.length, 1242);
  assert.equal(report.canonical.foundations.segment_source_rows_mapping_pending, 4);
  assert.equal(report.canonical.foundations.function_segment_keys_unresolved, 0);
  assert.equal(report.views.foundations.length, 1242);
  assert.equal(report.gates.find((gate) => gate.id === "segment_mapping_not_inferred")?.status, "pass");
  const executive = report.views.command_center.find((row) => row.row_key === "executive_summary");
  assert.equal(executive.foundations.source_objects, undefined);
  assert.equal(executive.foundations.application_rows, report.canonical.foundations.application_rows);
  assert.deepEqual(executive.foundations.relationship_census, report.canonical.foundations.relationship_census);
  assert.ok(Buffer.byteLength(JSON.stringify(executive)) < 32_000);
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
  assert.equal(plan.sourceFiles.length, 23);
  assert.equal(plan.sourceRecords.length, 3934);
  assert.equal(plan.objects.length, 1480);
  assert.equal(plan.measures.length, 1991);
  assert.equal(plan.projectionMeasureRefs.length, 1498);
  assert.equal(Object.values(viewCounts).reduce((sum, count) => sum + count, 0), 1595);
  const budgetMeasures = plan.measures.filter((row) => row.metric_key.startsWith("synthetic_demo_"));
  assert.equal(budgetMeasures.length, 423);
  assert.equal(budgetMeasures.find((row) => row.metric_key === "synthetic_demo_fy26_run_budget_usd")?.value_number, 487500000);
  assert.equal(budgetMeasures.find((row) => row.metric_key === "synthetic_demo_fy26_change_budget_usd")?.value_number, 162500000);
  assert.equal(budgetMeasures.filter((row) => row.metric_key === "synthetic_demo_fy26_budget_line_usd").length, 70);
  assert.ok(budgetMeasures.filter((row) => row.metric_key === "synthetic_demo_fy26_budget_line_usd")
    .every((row) => row.attributes_json.do_not_add_to_aggregate === true));
  assert.equal(viewCounts.foundations, 1242);
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
  assert.equal(plan.sourceRecords.filter((row) => row.record_type === "segment_source_record_mapping_pending").length, 4);
  assert.equal(plan.sourceFiles.filter((row) => row.file_name === "SA10_AI_Value_Interview_Evidence.csv").length, 0);
  assert.equal(plan.objects.filter((row) => row.attributes_json.source_population === "registered_foundation_intake").length, 1242);
  assert.equal(plan.commandRows.filter((row) => row.page_key === "foundations").length, 1242);
  assert.equal(plan.sourceFiles.filter((row) => row.file_name.startsWith("extracts/")).length, 0);
});

test("synthetic demo budget gate rejects component, line, and scenario drift", () => {
  const report = build("source-assertions-v1");
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const component = plan.measures.find((row) => row.metric_key === "synthetic_demo_fy26_run_budget_usd");
  const line = plan.measures.find((row) => row.metric_key === "synthetic_demo_fy26_budget_line_usd");
  const summary = plan.commandRows.find((row) => row.page_key === "command_center");
  component.value_number += 1;
  line.attributes_json.do_not_add_to_aggregate = false;
  line.scenario = "actual";
  summary.display_payload_json.synthetic_demo_fy26_change_usd += 1;
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "fail");
  assert.ok(gate.errors.some((error) => error.includes("synthetic demo budget source")));
  assert.ok(gate.errors.some((error) => error.includes("executive synthetic demo budget")));
  assert.ok(gate.errors.some((error) => error.includes("synthetic demo Finance line item")));
});

test("v6 outcome readback distinguishes text observations from source-only Finance amounts", () => {
  const report = build("source-assertions-v1");
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const metricRows = plan.valueRows.filter((row) => row.row_key.startsWith("metric:") &&
    row.display_payload_json.source_asserted_finance_value_usd !== null);
  assert.equal(metricRows.length, 7);
  for (const row of metricRows) {
    const assertion = plan.measures.find((measure) =>
      measure.id === row.display_payload_json.source_finance_assertion_measure_id);
    assert.equal(assertion?.metric_key, "outcome_source_finance_assertion_usd");
    assert.equal(assertion.value_number, row.display_payload_json.source_asserted_finance_value_usd);
    assert.equal(assertion.source_record_id, row.source_record_id);
    assert.equal(assertion.scenario, "candidate");
    assert.equal(row.claimable_value_usd, null);
    assert.ok(plan.projectionMeasureRefs.some((ref) =>
      ref.projection_entry_id === row.projection_entry_id && ref.measure_id === assertion.id));
  }
  assert.match(OUTCOME_MEASURE_PARITY_SQL, /when 'outcome_source_value' then/);
  assert.match(OUTCOME_MEASURE_PARITY_SQL, /when 'outcome_source_finance_assertion_usd' then/);
  assert.match(OUTCOME_MEASURE_PARITY_SQL, /m\.value_number is distinct from \(p\.display_payload_json ->> 'source_asserted_finance_value_usd'\)::numeric/);
  assert.equal(validatePhysicalPlan(report, plan, viewCounts).status, "pass");
  metricRows[0].display_payload_json.source_finance_assertion_measure_id = plan.measures.find((measure) =>
    measure.metric_key === "outcome_source_value")?.id;
  const failed = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(failed.status, "fail");
  assert.ok(failed.errors.some((error) => error.includes("outcome finance assertion is not tied")));
});

test("v6 source scenario follows reported meaning while review and claim gates stay closed", () => {
  const report = build("source-assertions-v1");
  const { plan, viewCounts } = buildPhysicalPlan(report);
  for (const [metric, scenario] of Object.entries({
    spend_source_prior_year_actual_usd: "actual",
    spend_source_forecast_next_year_usd: "forecast",
    benefit_feed_source_actual_spend_ytd_usd: "actual",
    ai_outcome_feed_baseline: "baseline",
    ai_outcome_feed_target: "target",
    ai_outcome_feed_actual: "actual",
    outcome_source_finance_assertion_usd: "candidate",
  })) {
    const measures = plan.measures.filter((row) => row.metric_key === metric);
    assert.ok(measures.length > 0, `${metric} has source rows`);
    assert.ok(measures.every((row) => row.scenario === scenario &&
      row.review_state === "not_reviewed" && row.attributes_json.claimable_value_usd === null), metric);
  }
  plan.measures.find((row) => row.metric_key === "spend_source_prior_year_actual_usd").scenario = "planned";
  plan.measures.find((row) => row.metric_key === "ai_outcome_feed_actual").scenario = "planned";
  const failed = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(failed.status, "fail");
  assert.ok(failed.errors.filter((error) => error.includes("source assertion scenario or review state differs")).length >= 2);
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
  const foundation = plan.objects.find((row) => row.object_type === "organization" &&
    row.attributes_json.source_population === "registered_foundation_intake");
  const relationshipFile = plan.sourceFiles.find((row) => row.file_name === "12_relationships.csv");
  const relationship = plan.sourceRecords.find((row) => row.source_file_id === relationshipFile.id);
  foundation.attributes_json.decision_rights = "forged";
  relationship.payload_json.relationship_type = "forged";
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "fail");
  assert.ok(gate.errors.some((error) => error.includes("Foundation object differs")));
  assert.ok(gate.errors.some((error) => error.includes("source record differs from exact intake")));
});

test("v6 Foundation page links every declared object to one raw source record and rejects display drift", () => {
  const report = build("source-assertions-v1");
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const objectById = new Map(plan.objects.map((row) => [row.id, row]));
  const recordsById = new Map(plan.sourceRecords.map((row) => [row.id, row]));
  const foundationRows = plan.commandRows.filter((row) => row.page_key === "foundations");
  assert.equal(foundationRows.length, 1242);
  for (const row of foundationRows) {
    const object = objectById.get(row.primary_object_id);
    const source = recordsById.get(row.display_payload_json.canonical_source_record_id);
    assert.equal(row.row_key, `foundation:${object.object_type}:${object.object_key}`);
    assert.equal(object.source_record_id, source.id);
    assert.equal(row.source_refs_json.length, 1);
    assert.equal(source.row_number, row.source_refs_json[0].source_row);
    assert.equal(row.display_payload_json.approved_fy_budget_usd, null);
    assert.equal(row.display_payload_json.claimable_value_usd, null);
    assert.ok(Buffer.byteLength(JSON.stringify(row.display_payload_json)) <= 8192);
  }
  foundationRows[0].display_payload_json.source_fields = { invented: "fact" };
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "fail");
  assert.ok(gate.errors.some((error) => error.includes("Foundation projection differs")));
});

test("hash-count-only interview evidence cannot enter a source record or projection", () => {
  const report = build("source-assertions-v1");
  const file = "SA10_AI_Value_Interview_Evidence.csv";
  report.views.risk_lens[0].source_refs.push({ source_file: file,
    source_sha256: report.source_manifest[file].sha256, source_row: 2, source_record_id: null });
  assert.throws(() => buildPhysicalPlan(report), /Hash-count-only source content cannot be staged/);
});

test("segment fixture regeneration preserves corrected function and AI case rows byte for byte", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tower-segment-source-"));
  const sourceRoot = path.join(ROOT, registry.activeTenants.find((tenant) => tenant.tenantKey === tenantKey).canonicalInputRoot);
  const targetRoot = path.join(root, "datasets/tenant-inputs/active", tenantKey, "current");
  try {
    fs.mkdirSync(targetRoot, { recursive: true });
    for (const file of ["00_enterprise_profile.csv", "01_business_functions.csv", "01b_business_segments.csv",
      "02_org_ownership.csv", "10_ai_automation_use_cases.csv"]) {
      fs.copyFileSync(path.join(sourceRoot, file), path.join(targetRoot, file));
    }
    const run = spawnSync(process.execPath,
      [path.join(ROOT, "scripts/data/fixtures/add-segment-taxonomy.mjs"), "--write"],
      { cwd: root, encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    for (const file of ["01_business_functions.csv", "01b_business_segments.csv", "10_ai_automation_use_cases.csv"]) {
      assert.deepEqual(fs.readFileSync(path.join(targetRoot, file)), fs.readFileSync(path.join(sourceRoot, file)), file);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
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
    assert.match(result.stderr, /manifest carries no load_approval/);
    assert.equal(fs.existsSync(path.join(outDir, "stage-receipt.json")), false);
    const preflight = JSON.parse(fs.readFileSync(path.join(outDir, "stage-preflight.json"), "utf8"));
    assert.equal(preflight.load_approval_status, "missing_or_mismatched");
    assert.equal(preflight.stage_status, "not_written");
    assert.equal(preflight.physical_quality_gate_status, "pass");
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
