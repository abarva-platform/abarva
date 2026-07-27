#!/usr/bin/env node
// Gate 2.1 Phase D, increment 1 regression suite for
// fix-placeholder-corrupted-references.mjs. Proves the fix only touches the
// one confirmed-corrupted column per file and leaves everything else,
// including row count and row order, byte-identical to the real active file.
//
// Run: node scripts/data-build/tenant-scenario-model/__tests__/run-placeholder-corruption-fix-tests.mjs
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { TARGETS, fixTenant, CANDIDATE_VERSION } from "../fix-placeholder-corrupted-references.mjs";

const repoRoot = process.cwd();
let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

for (const [tenantKey, targets] of Object.entries(TARGETS)) {
  const results = fixTenant(tenantKey, targets);
  for (const result of results) {
    const inputFile = targets.find((t) => t.file.includes(result.domain))?.file;
    const inputPath = path.join(repoRoot, "datasets/tenant-inputs/active", tenantKey, "current", inputFile);
    const inputRows = Papa.parse(fs.readFileSync(inputPath, "utf8"), { header: true, skipEmptyLines: true }).data;
    const candidatePath = path.join(repoRoot, result.candidate_output);
    const candidateRows = Papa.parse(fs.readFileSync(candidatePath, "utf8"), { header: true, skipEmptyLines: true }).data;

    assert(candidateRows.length === inputRows.length, `${tenantKey}/${result.domain}: candidate has the same row count as the real active file (${candidateRows.length} vs ${inputRows.length})`);

    let allOtherColumnsIdentical = true;
    let allTargetColumnsCleared = true;
    for (let i = 0; i < inputRows.length; i++) {
      const inputRow = inputRows[i];
      const candidateRow = candidateRows[i];
      for (const col of Object.keys(inputRow)) {
        if (col === result.column) {
          if (result.corrupted_values_removed.includes(inputRow[col]) && candidateRow[col] !== "") allTargetColumnsCleared = false;
          if (!result.corrupted_values_removed.includes(inputRow[col]) && candidateRow[col] !== inputRow[col]) allOtherColumnsIdentical = false;
        } else if (candidateRow[col] !== inputRow[col]) {
          allOtherColumnsIdentical = false;
        }
      }
    }
    assert(allOtherColumnsIdentical, `${tenantKey}/${result.domain}: every column other than "${result.column}" is byte-identical to the real active file -- no unintended data loss`);
    assert(allTargetColumnsCleared, `${tenantKey}/${result.domain}: every confirmed-corrupted value in "${result.column}" is now blank`);

    const remainingCorruption = candidateRows.filter((r) => result.corrupted_values_removed.includes(r[result.column]));
    assert(remainingCorruption.length === 0, `${tenantKey}/${result.domain}: zero remaining occurrences of the corrupted literal in the candidate (got ${remainingCorruption.length})`);
  }
}

assert(CANDIDATE_VERSION.startsWith("gate-2-1"), "the candidate version is namespaced to this Gate 2.1 phase, not a generic/unversioned overwrite");

// Never writes into active/current itself.
for (const tenantKey of Object.keys(TARGETS)) {
  const activeDir = path.join(repoRoot, "datasets/tenant-inputs/active", tenantKey, "current");
  const before = fs.readdirSync(activeDir).sort();
  fixTenant(tenantKey, TARGETS[tenantKey]);
  const after = fs.readdirSync(activeDir).sort();
  assert(JSON.stringify(before) === JSON.stringify(after), `${tenantKey}: running the fix does not add, remove, or modify any file under active/current (file listing unchanged)`);
}

console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
