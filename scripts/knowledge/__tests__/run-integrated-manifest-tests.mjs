#!/usr/bin/env node
// Zero-cost, zero-network regression suite for validate-integrated-manifest.mjs.
// Each fixture under __fixtures__/integrated-manifest/ is a deliberately
// broken (or, for the baseline, deliberately clean) candidate manifest;
// this proves the validator fires the RIGHT rule for each defect class,
// not just "some" failure. Run: node scripts/knowledge/__tests__/run-integrated-manifest-tests.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateIntegratedManifest } from "../validate-integrated-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const fixturesDir = path.join(path.dirname(__filename), "..", "__fixtures__", "integrated-manifest");

const packet = JSON.parse(fs.readFileSync(path.join(fixturesDir, "packet.json"), "utf8"));
const bindings = JSON.parse(fs.readFileSync(path.join(fixturesDir, "bindings.json"), "utf8"));
// Only exercised by fixtures whose candidate carries enterprise_book --
// harmless no-op for every other fixture, which has no enterprise_book key
// for checkIndustryComparison() to find.
const { industryFactBase, metricsFactBase } = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, "industry-factbase.json"), "utf8"),
);

function loadCandidate(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, `${name}.json`), "utf8"));
}

// { fixture, expectStatus, expectRuleIds: types that must appear at least once }
const cases = [
  { fixture: "valid-38-dimension", expectStatus: "pass", expectRuleIds: [] },
  { fixture: "fabricated-visual-values", expectStatus: "fail", expectRuleIds: ["forbidden_visual_field"] },
  { fixture: "missing-evidence", expectStatus: "fail", expectRuleIds: ["insight_without_evidence"] },
  { fixture: "unresolved-evidence-id", expectStatus: "fail", expectRuleIds: ["unresolved_evidence_id"] },
  { fixture: "unapproved-dataset-binding", expectStatus: "fail", expectRuleIds: ["unapproved_dataset_for_dimension"] },
  { fixture: "stale-context-hash", expectStatus: "fail", expectRuleIds: ["stale_source_context_hash"] },
  { fixture: "missing-dimension", expectStatus: "fail", expectRuleIds: ["dimension_count_mismatch"] },
  { fixture: "duplicated-dimension", expectStatus: "fail", expectRuleIds: ["duplicate_dimension_key"] },
  { fixture: "risks-unapproved-dataset", expectStatus: "fail", expectRuleIds: ["unresolved_dataset_binding"] },
  { fixture: "unknown-visual-dimension-or-measure", expectStatus: "fail", expectRuleIds: ["unknown_visual_field"] },
  // Enterprise Book review item 5: a technically-resolved evidence ID whose
  // only support is a low-specificity placeholder must still PASS (it is
  // not fabrication) but must produce a warning distinct from a hard fail.
  { fixture: "weak-evidence-specificity", expectStatus: "pass", expectRuleIds: ["weak_evidence_specificity"] },
  // An honest "no evidence exists for this" disclosure (empty evidence_refs
  // + evidence_status: not_evidenced + a real evidence_gap_note) must NOT be
  // treated as the silent omission insight_without_evidence normally
  // catches.
  { fixture: "honest-not-evidenced", expectStatus: "pass", expectRuleIds: [] },
  // Real production defect (first-capital, 2026-07-25): Claude wrote
  // evidence_status: "evidenced" with evidence_refs: [] -- claiming support
  // while citing none. These three fixtures reproduce the exact three
  // claim patterns from that failure (see docs/releases/records/
  // 2026-07-25-home-v4-evidence-contract-fix.md) to prove the fix holds
  // against the real defect shape, not just a synthetic one.
  { fixture: "franchise-breadth-false-evidenced", expectStatus: "fail", expectRuleIds: ["insight_without_evidence"] },
  { fixture: "relationship-sponsor-linkage-false-evidenced", expectStatus: "fail", expectRuleIds: ["insight_without_evidence"] },
  { fixture: "application-ownership-false-evidenced", expectStatus: "fail", expectRuleIds: ["insight_without_evidence"] },
  // The honest-disclosure marker itself must say what's missing -- an empty
  // gap note is the same silent omission the rule above exists to catch.
  { fixture: "not-evidenced-missing-gap-note", expectStatus: "fail", expectRuleIds: ["missing_evidence_gap_note"] },
  // Real production defect (Meridian/skyharbor-air/first-capital,
  // 2026-07-25): industry_comparison collapsed a genuinely mixed
  // dimensional record (e.g. at-parity on operational capability, behind
  // on governance) into one flat "behind" label, and contradicted
  // material_advantages in the process. These fixtures reproduce the exact
  // defect shape and the fix's boundaries -- see docs/releases/records/
  // 2026-07-25-home-v4-industry-comparison-fix.md.
  { fixture: "industry-comparison-flat-behind-despite-mixed", expectStatus: "fail", expectRuleIds: ["industry_comparison_overall_position_inconsistent"] },
  // Real production defect (first-capital/skyharbor-air, 2026-07-25, second
  // regeneration round): the inverse direction -- overall_position "mixed"
  // when every judged dimension actually agreed. "mixed" is not a safer
  // hedge; it must reflect genuine disagreement.
  { fixture: "industry-comparison-mixed-despite-uniform", expectStatus: "fail", expectRuleIds: ["industry_comparison_overall_position_inconsistent"] },
  { fixture: "industry-comparison-advantage-contradiction", expectStatus: "fail", expectRuleIds: ["industry_comparison_advantage_contradiction"] },
  { fixture: "industry-comparison-missing-benchmark-ref", expectStatus: "fail", expectRuleIds: ["industry_comparison_missing_benchmark_ref"] },
  { fixture: "industry-comparison-judgment-without-evidence", expectStatus: "fail", expectRuleIds: ["industry_comparison_judgment_without_evidence"] },
  { fixture: "industry-comparison-forbidden-metric-field", expectStatus: "fail", expectRuleIds: ["industry_comparison_forbidden_metric_field"] },
  { fixture: "industry-comparison-metric-fabricated-availability", expectStatus: "fail", expectRuleIds: ["industry_comparison_metric_fabricated_availability"] },
  // A genuinely mixed, internally-consistent, evidence-backed comparison
  // must PASS -- proves the fix does not just fail everything or force an
  // artificial spread.
  { fixture: "industry-comparison-valid-mixed", expectStatus: "pass", expectRuleIds: [] },
  // Templated phrasing across rows is a warning, not a hard failure.
  { fixture: "industry-comparison-repetitive-phrasing", expectStatus: "pass", expectRuleIds: ["repetitive_comparison_phrasing"] },
];

let failed = 0;
for (const testCase of cases) {
  const candidate = loadCandidate(testCase.fixture);
  const result = validateIntegratedManifest(candidate, packet, { bindings, industryFactBase, metricsFactBase });
  const foundTypes = new Set([...result.failures, ...result.warnings].map((f) => f.type));
  const statusOk = result.status === testCase.expectStatus;
  const missingRuleIds = testCase.expectRuleIds.filter((id) => !foundTypes.has(id));
  const ok = statusOk && missingRuleIds.length === 0;
  if (ok) {
    console.log(`[PASS] ${testCase.fixture}: status=${result.status}, hard_failures=${result.failure_count}`);
  } else {
    failed += 1;
    console.log(`[FAIL] ${testCase.fixture}: expected status=${testCase.expectStatus} got=${result.status}; expected rule ids [${testCase.expectRuleIds.join(", ")}] missing [${missingRuleIds.join(", ")}]; actual types found: [${Array.from(foundTypes).join(", ")}]`);
  }
}

console.log();
if (failed === 0) {
  console.log(`All ${cases.length} integrated-manifest fixture cases behaved as expected.`);
  process.exit(0);
} else {
  console.log(`${failed} of ${cases.length} fixture cases did not behave as expected.`);
  process.exit(1);
}
