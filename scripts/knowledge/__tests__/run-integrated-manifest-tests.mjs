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
  // + evidence_status: not_evidenced) must NOT be treated as the silent
  // omission insight_without_evidence normally catches.
  { fixture: "honest-not-evidenced", expectStatus: "pass", expectRuleIds: [] },
];

let failed = 0;
for (const testCase of cases) {
  const candidate = loadCandidate(testCase.fixture);
  const result = validateIntegratedManifest(candidate, packet, { bindings });
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
