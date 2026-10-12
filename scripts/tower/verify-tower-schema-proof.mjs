#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const [logPath, expectedMode, expectedState] = process.argv.slice(2);
assert(logPath && ["status", "apply", "verify"].includes(expectedMode) &&
  ["ready", "applied", "any"].includes(expectedState), "Usage: verify-tower-schema-proof <log> <mode> <state>");
const lines = fs.readFileSync(logPath, "utf8").split("\n").filter((line) => line.includes("TOWER_ONLY_SCHEMA_PROOF\t"));
assert.equal(lines.length, 1, "Expected one Tower schema proof marker");
const proof = JSON.parse(lines[0].slice(lines[0].indexOf("TOWER_ONLY_SCHEMA_PROOF\t") + "TOWER_ONLY_SCHEMA_PROOF\t".length));
assert.equal(proof.mode, expectedMode);
if (expectedState === "any") expectedState = proof.state;
assert(["ready", "applied"].includes(expectedState));
assert.equal(proof.state, expectedState);
assert.deepEqual(proof.targets, [
  { name: "20261011210000_tower_active_lifecycle_fail_closed.sql",
    sha256: "b8dd9e6fd0f7bc941e3b908ad07db0c5779528c28f3efda7efca7e2b0ef0ce21" },
  { name: "20261012133000_tower_foundations_page_key.sql",
    sha256: "d17d7b84ef94ebd1fa0dce5a00b01fab27d8169570ec41fed256c973756d5857" },
]);
assert.equal(proof.private_readback_verified, true, "Private Blob proof readback did not pass");
assert.match(proof.private_proof_sha256, /^[a-f0-9]{64}$/);
assert.match(proof.private_proof_uri, /^https:\/\/[^/]+\.blob\.core\.windows\.net\//);
assert.equal(proof.active_selector_unchanged, true, "Active assessment changed");
assert.equal(proof.active_page_fingerprints_unchanged, true, "Active Tower page data changed");
assert.equal(proof.active_page_count, 9, "Prior Tower pages are incomplete");
assert.equal(proof.candidate_rows_absent, true, "Candidate rows already exist");
assert.equal(proof.unrelated_ledger_rows_changed, 0);
const ledgerAfter = new Map(proof.target_ledger_after);
assert.equal(ledgerAfter.size, expectedState === "ready" ? 0 : 2, "Target ledger row count differs");
for (const target of proof.targets) {
  if (expectedState === "applied") assert.equal(ledgerAfter.get(target.name), target.sha256);
}
console.log(`TOWER_ONLY_SCHEMA_PROOF_VERIFIED\t${JSON.stringify({ mode: expectedMode, state: expectedState,
  target_count: proof.targets.length, page_count: proof.active_page_count,
  private_proof_sha256: proof.private_proof_sha256, private_proof_uri: proof.private_proof_uri })}`);
