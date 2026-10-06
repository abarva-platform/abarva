#!/usr/bin/env node
// Gate 2.1 Phase D, increment 1 regression suite for
// fix-placeholder-corrupted-references.mjs. Proves the fix only touches the
// one confirmed-corrupted column per file and leaves everything else,
// including row count and row order, byte-identical to the real active file.
//
// Run: node scripts/data-build/tenant-scenario-model/__tests__/run-placeholder-corruption-fix-tests.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

/**
 * Everything below is a data build, not a suite.
 *
 * This file carries no `describe`/`it`, so Jest collects it (next/jest's
 * default testMatch takes every file under `__tests__`), runs its module body
 * for the side effects, then fails it for having no tests. Running that body
 * executes `fixTenant` against the real repository: measured with an fs probe,
 * a parallel run wrote SEVEN tracked files across FOUR tenants under
 * `datasets/tenant-inputs/candidates/`. Six rewrote to identical bytes and were
 * invisible to `git status`; one did not, and left a -125/+27 diff in committed
 * tenant input data for whoever committed next.
 *
 * The guard is the fix: importing this module must do nothing. Invoking it the
 * documented way is unchanged.
 *
 * Deliberately NOT fixed by redirecting the output to a temp directory. That
 * hides the diff while Jest still executes a data build, and the
 * `process.exit()` at the end still runs inside a worker. The write is the
 * defect; the diff was only the symptom that happened to be visible.
 *
 * A DIRECT run is a different case (D-512): the suite still has to execute the
 * fix to check it, and until 2026-10-01 that wrote the tracked candidate tree,
 * exiting 0 with a -125/+27 diff left behind. It now writes only under a temp
 * directory it creates and removes. Pinned by
 * `src/__tests__/behaviors/d512-placeholder-runner-writes-no-tracked-path.test.ts`.
 */
function main() {
  const candidatesRoot = fs.mkdtempSync(path.join(os.tmpdir(), "placeholder-corruption-fix-"));
  try {
    run(candidatesRoot);
  } finally {
    fs.rmSync(candidatesRoot, { recursive: true, force: true });
  }
  console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

function run(candidatesRoot) {
  for (const [tenantKey, targets] of Object.entries(TARGETS)) {
    const results = fixTenant(tenantKey, targets, { candidatesRoot });
    for (const result of results) {
      const inputFile = targets.find((t) => t.file.includes(result.domain))?.file;
      const inputPath = path.join(repoRoot, "datasets/tenant-inputs/active", tenantKey, "current", inputFile);
      const inputRows = Papa.parse(fs.readFileSync(inputPath, "utf8"), { header: true, skipEmptyLines: true }).data;
      const candidatePath = path.resolve(repoRoot, result.candidate_output);
      assert(!path.relative(candidatesRoot, candidatePath).startsWith(".."), `${tenantKey}/${result.domain}: the candidate was written under the run's temp directory, not the repository`);
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
    fixTenant(tenantKey, TARGETS[tenantKey], { candidatesRoot });
    const after = fs.readdirSync(activeDir).sort();
    assert(JSON.stringify(before) === JSON.stringify(after), `${tenantKey}: running the fix does not add, remove, or modify any file under active/current (file listing unchanged)`);
  }
}

// Only when invoked as a script. `import.meta.url` and argv[1] agree only for a
// direct `node scripts/.../run-placeholder-corruption-fix-tests.mjs`.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
