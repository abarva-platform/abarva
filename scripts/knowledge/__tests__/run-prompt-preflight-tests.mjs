#!/usr/bin/env node
// Zero-cost, zero-network regression suite for
// assert-integrated-prompt-preflight.mjs. real-current-prompt.json is the
// ACTUAL prompt makePrompt() assembles for skyharbor-air today (captured via
// `--preflight`, not hand-written) -- it must pass. Each regress-*.json is
// that same real prompt with exactly one field of the hardened contract
// broken, proving the preflight module catches the specific defect it
// claims to catch, not just "some" failure.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertIntegratedPromptPreflight } from "../assert-integrated-prompt-preflight.mjs";

const __filename = fileURLToPath(import.meta.url);
const fixturesDir = path.join(path.dirname(__filename), "..", "__fixtures__", "prompt-preflight");

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, `${name}.json`), "utf8"));
}

const packet = load("real-current-packet");

const cases = [
  { fixture: "real-current-prompt", expectStatus: "pass", expectRuleIds: [] },
  { fixture: "regress-stale-visual-contract", expectStatus: "fail", expectRuleIds: ["preflight.stale_visual_contract_rules_present"] },
  { fixture: "regress-orphan-binding", expectStatus: "fail", expectRuleIds: ["preflight.binding_unreachable_dimension"] },
  { fixture: "regress-empty-dataset-dims", expectStatus: "fail", expectRuleIds: ["preflight.dataset_missing_dimensions"] },
  { fixture: "regress-truncated-evidence", expectStatus: "fail", expectRuleIds: ["preflight.evidence_index_incomplete"] },
  { fixture: "regress-missing-dimension", expectStatus: "fail", expectRuleIds: ["preflight.dimension_count_mismatch"] },
];

let failed = 0;
for (const testCase of cases) {
  const prompt = load(testCase.fixture);
  const result = assertIntegratedPromptPreflight(prompt, packet);
  const foundRuleIds = new Set(result.failures.map((f) => f.rule_id));
  const statusOk = result.status === testCase.expectStatus;
  const missingRuleIds = testCase.expectRuleIds.filter((id) => !foundRuleIds.has(id));
  const ok = statusOk && missingRuleIds.length === 0;
  if (ok) {
    console.log(`[PASS] ${testCase.fixture}: status=${result.status}, failures=${result.failure_count}`);
  } else {
    failed += 1;
    console.log(`[FAIL] ${testCase.fixture}: expected status=${testCase.expectStatus} got=${result.status}; expected rule ids [${testCase.expectRuleIds.join(", ")}] missing [${missingRuleIds.join(", ")}]; actual rule ids found: [${Array.from(foundRuleIds).join(", ")}]`);
  }
}

console.log();
if (failed === 0) {
  console.log(`All ${cases.length} prompt-preflight fixture cases behaved as expected.`);
  process.exit(0);
} else {
  console.log(`${failed} of ${cases.length} fixture cases did not behave as expected.`);
  process.exit(1);
}
