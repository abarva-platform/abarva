import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildRegisteredIntakeCandidate } from "../build-registered-intake-reload-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const registry = JSON.parse(
  (await import("node:fs")).readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"),
);
const tenantKey = registry.activeTenants.find((tenant) => tenant.packets?.some((packet) => packet.classification === "synthetic-demo"))?.tenantKey;

test("registered intake candidate keeps unsupported money unknown and maps all views", () => {
  assert.ok(tenantKey);
  const report = buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey });
  assert.equal(report.build_state, "dry_run_only");
  assert.equal(report.runtime_eligible, false);
  assert.equal(report.quality_gate_status, "pass");
  assert.equal(report.canonical.budget.approved_fy_budget_usd, null);
  assert.equal(report.views.command_center[0].approved_fy_budget_usd, null);
  assert.equal(report.views.command_center[0].claimable_ai_value_usd, null);
  assert.equal(report.canonical.modeled_annual_spend.row_sum_difference_usd, 800000);
  assert.equal(report.coverage_gaps.find((gap) => gap.id === "modeled_spend_rounding_reconciled")?.status, "gap");
  assert.deepEqual(Object.values(report.view_counts).every((count) => count > 0), true);
  assert.equal(report.coverage_gaps.find((gap) => gap.id === "source_evidence_approved")?.status, "gap");
  assert.equal(report.coverage_gaps.find((gap) => gap.id === "ai_money_usage_reconciled")?.status, "gap");
  assert.equal(report.coverage_gaps.find((gap) => gap.id === "declared_case_claim_crosswalk")?.status, "gap");
  assert.ok(report.canonical.ai_claims.every((claim) => claim.claimable_value_usd === null));
  assert.ok(report.canonical.ai_use_cases.every((useCase) => useCase.planning_promise_usd === null));
  assert.equal(report.views.command_center[0].use_case_to_benefit_ids_joined, false);
  assert.ok(report.views.adoption_lens.every((row) => row.source_refs.length === 1 && row.source_refs[0].source_file === "SA09_AI_Tool_Usage_Feed.csv"));
  assert.ok(report.views.cost_lens.some((row) => row.additive_to_it_spend === false));
  assert.equal(report.source_manifest["extracts/ms365-copilot-usage-user-detail.csv"].detail_suppressed, true);
  assert.ok(!JSON.stringify(report).includes("userPrincipalName"));
});

test("registry identity rejects an inactive tenant", () => {
  const retired = registry.retiredTenants[0]?.tenantKey;
  assert.ok(retired);
  assert.throws(() => buildRegisteredIntakeCandidate({ repoRoot: ROOT, tenantKey: retired }), /not active/);
});
