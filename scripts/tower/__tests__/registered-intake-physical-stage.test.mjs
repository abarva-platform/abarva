import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildRegisteredIntakeCandidate } from "../build-registered-intake-reload-candidate.mjs";
import { buildPhysicalPlan, insertRows, validatePhysicalPlan, viewFingerprints } from "../stage-registered-intake-partial.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
const tenantKey = registry.activeTenants.find((tenant) => tenant.packets?.some((packet) => packet.classification === "synthetic-demo"))?.tenantKey;

test("physical plan preserves source identity and unknown amounts", () => {
  assert.ok(tenantKey);
  const report = buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey });
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "pass");
  assert.equal(plan.sourceFiles.length, 17);
  assert.equal(plan.sourceRecords.length, 299);
  assert.equal(plan.objects.length, 237);
  assert.equal(plan.measures.length, 308);
  assert.equal(plan.sourceRecords.filter((row) => row.record_type === "13_evidence_sources").length, 0);
  assert.equal(plan.sourceFiles.filter((row) => row.file_name.startsWith("extracts/")).length, 0);
  assert.ok(plan.commandRows.every((row) => row.funded_amount_usd === null && row.claimable_value_usd === null));
  assert.ok(plan.valueRows.every((row) => row.claimable_value_usd === null && row.blocked_value_usd === null));
  assert.ok(plan.evidenceRows.every((row) => row.priority_score === null));
  assert.equal(plan.objects.filter((row) => row.object_type === "metric" && row.object_key === "modeled_annual_it_spend_usd").length, 1);
  assert.equal(plan.objects.find((row) => row.object_key === "modeled_annual_it_spend_usd").attributes_json.source_refs.length, 27);
  assert.equal(plan.objects.filter((row) => row.object_type === "ai_use_case").length, 36);
  assert.ok(plan.objects.filter((row) => row.attributes_json.source_population === "separate_benefit_usage_feed")
    .every((row) => row.attributes_json.evidence_reference_registered === false &&
      row.attributes_json.program_budget_linked === false));
  assert.ok(plan.measures.filter((row) => row.metric_key === "usage_feed_active_users")
    .every((row) => row.attributes_json.reported_usage_rate_denominator === "active_over_licensed_users" &&
      row.attributes_json.benefit_feed_usage_rate_denominator === "active_over_enabled_users" &&
      row.attributes_json.raw_detail_validates_usage === false));
  assert.ok(plan.valueRows.filter((row) => row.page_key === "cost_lens").every((row) => row.measure_id));
  assert.equal(plan.projectionMeasureRefs.length, 234);
  const categoryMeasures = plan.measures.filter((row) => row.metric_key === "modeled_annual_spend_category_usd");
  const aggregate = plan.measures.find((row) => row.metric_key === "modeled_annual_it_spend_usd");
  assert.equal(categoryMeasures.length, 27);
  assert.equal(categoryMeasures.reduce((sum, row) => sum + row.value_number, 0), aggregate.value_number);
  assert.ok(categoryMeasures.every((row) => row.source_record_id &&
    row.attributes_json.category_business_id === null &&
    row.attributes_json.do_not_add_to_aggregate === true));
  assert.equal(plan.valueRows.filter((row) => row.page_key === "cost_lens" && row.row_key.startsWith("spend:")).length, 27);
  assert.ok(plan.measures.filter((row) => row.metric_key === "outcome_source_value" && row.scenario === "actual")
    .every((row) => row.period_start === null && row.period_end === null &&
      Object.hasOwn(row.attributes_json, "source_period_text")));
  assert.equal(plan.measures.filter((row) => row.metric_key === "outcome_source_value").length, 134);
  assert.equal(plan.projectionManifests.length, 9);
  assert.ok(Object.values(viewCounts).every((count) => count > 0));
  assert.ok(Object.values(viewFingerprints(plan)).every((digest) => /^[a-f0-9]{64}$/.test(digest)));
  const evidence = plan.evidenceRows.find((row) => row.page_key === "evidence");
  assert.equal(evidence.source_refs_json[0].scope, "register_coverage_only");
  assert.equal(evidence.source_refs_json[0].source_row, null);
});

test("physical gate refuses category drift that would misstate the spend breakdown", () => {
  const report = buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey });
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const category = plan.measures.find((row) => row.metric_key === "modeled_annual_spend_category_usd");
  category.value_number += 1;
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "fail");
  assert.ok(gate.errors.some((error) => error.includes("spend categories do not reconcile")));
});

test("physical gate checks every category against its original source amount", () => {
  const report = buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey });
  const { plan, viewCounts } = buildPhysicalPlan(report);
  const [first, second] = plan.valueRows.filter((row) => row.page_key === "cost_lens" &&
    row.row_key.startsWith("spend:"));
  const measures = new Map(plan.measures.map((measure) => [measure.id, measure]));
  first.display_payload_json.value += 1000;
  second.display_payload_json.value -= 1000;
  measures.get(first.measure_id).value_number += 1000;
  measures.get(second.measure_id).value_number -= 1000;
  const gate = validatePhysicalPlan(report, plan, viewCounts);
  assert.equal(gate.status, "fail");
  assert.equal(gate.errors.filter((error) => error.includes("differs from its source row")).length, 2);
});

test("stage binds JSON arrays as JSONB values for the admission constraint and source lineage", async () => {
  const report = buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey });
  const { plan } = buildPhysicalPlan(report);
  const calls = [];
  const client = { query: async (sql, values) => { calls.push({ sql, values }); } };
  await insertRows(client, "ecl_projection.projection_manifest", [plan.projectionManifests[0]]);
  await insertRows(client, "ecl_projection.tower_command_center", [plan.commandRows[0]]);
  const bound = (call, column) => {
    const columns = [...call.sql.matchAll(/"([a-z_]+)"/g)].map((match) => match[1]);
    return call.values[columns.indexOf(column)];
  };
  assert.equal(bound(calls[0], "admission_gate_results_json"), "[]");
  assert.equal(bound(calls[1], "evidence_needed_json"), "[]");
  assert.deepEqual(JSON.parse(bound(calls[1], "source_refs_json")), plan.commandRows[0].source_refs_json);
  assert.deepEqual(JSON.parse(bound(calls[1], "display_payload_json")), plan.commandRows[0].display_payload_json);
});

test("write preflight recognizes exact approval and requires private job identity", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-stage-refusal-"));
  try {
    const result = spawnSync(process.execPath, [
      "--import", "tsx", path.join(ROOT, "scripts/tower/stage-registered-intake-partial.mjs"),
      "--tenant-key", tenantKey, "--out-dir", outDir, "--write", "--job-run-id", "test-refusal",
    ], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATABASE_URL: "" } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ACA job identity, build\/input version/);
    assert.equal(fs.existsSync(path.join(outDir, "stage-receipt.json")), false);
    const preflight = JSON.parse(fs.readFileSync(path.join(outDir, "stage-preflight.json"), "utf8"));
    assert.equal(preflight.stage_status, "not_written");
    assert.equal(preflight.load_approval_status, "approved");
    assert.equal(preflight.physical_quality_gate_status, "pass");
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test("read-only proof preflight recognizes exact approval and requires private job identity", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-reattest-refusal-"));
  try {
    const result = spawnSync(process.execPath, [
      "--import", "tsx", path.join(ROOT, "scripts/tower/stage-registered-intake-partial.mjs"),
      "--tenant-key", tenantKey, "--out-dir", outDir, "--reattest",
      "--job-run-id", "test-reattest", "--stage-job-run-id", "test-stage",
    ], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATABASE_URL: "" } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ACA job identity, build\/input version/);
    assert.equal(fs.existsSync(path.join(outDir, "stage-receipt.json")), false);
    const preflight = JSON.parse(fs.readFileSync(path.join(outDir, "stage-preflight.json"), "utf8"));
    assert.equal(preflight.load_approval_status, "approved");
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test("ACA wrapper independently binds the stage image digest", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-stage-aca-plan-"));
  const digest = `sha256:${"a".repeat(64)}`;
  const wrapper = path.join(ROOT, "scripts/ops/submit-aca-operator-job.mjs");
  const base = [wrapper, "--image", `example.azurecr.io/web@${digest}`,
    "--script", "tower:registered-intake:stage-job", "--plan-only", "--out-dir", outDir,
    "--env", "TOWER_RELOAD_JOB_NAME=job-abarva-private-operator-eus",
    "--env", "TOWER_RELOAD_TIMEOUT_SECONDS=7200",
    "--env", "TOWER_RELOAD_EXECUTION_LANE=aca_operator_job"];
  try {
    const mismatch = spawnSync(process.execPath, [...base,
      "--env", `TOWER_RELOAD_IMAGE_DIGEST=sha256:${"b".repeat(64)}`], { cwd: ROOT, encoding: "utf8" });
    assert.notEqual(mismatch.status, 0);
    assert.match(mismatch.stderr, /must match the ACA wrapper request/);
    const matching = spawnSync(process.execPath, [...base, "--env", `TOWER_RELOAD_IMAGE_DIGEST=${digest}`],
      { cwd: ROOT, encoding: "utf8" });
    assert.equal(matching.status, 0, matching.stderr);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
