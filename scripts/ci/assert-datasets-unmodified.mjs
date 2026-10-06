#!/usr/bin/env node
/**
 * A test run must not modify committed input data.
 *
 * `datasets/tenant-inputs/**` is declared client input, not test scratch. The
 * identity rule in AGENTS.md is that tenancy is declared and never inferred; a
 * suite that edits the declared inputs breaks that one layer down, and every
 * assertion downstream of the write is then checking a file the run itself
 * produced.
 *
 * This existed because a suite did exactly that. Measured with an fs probe: a
 * parallel `npx jest` executed a data build and wrote SEVEN tracked files
 * across FOUR tenants under `datasets/tenant-inputs/candidates/`. Six rewrote
 * to identical bytes and were invisible to `git status`; the seventh left a
 * -125/+27 diff in a committed tenant input file, which the next `git add -A`
 * would have carried into an unrelated pull request as a silent 125-row
 * deletion of client data.
 *
 * Run it AFTER the suites:
 *   node scripts/ci/assert-datasets-unmodified.mjs
 *
 * It reports the paths and exits non-zero. It deliberately does NOT revert
 * them: reverting would make the failure disappear on a re-run and turn a real
 * defect into a flake, and the file is committed input data — the defect is
 * the write, not the diff.
 */

import { execFileSync } from "node:child_process";

const WATCHED = "datasets/";

function modifiedUnderDatasets() {
  // --porcelain keeps the format stable across git versions; -- limits the
  // walk to the watched tree so an unrelated dirty file cannot fail this.
  const out = execFileSync(
    "git",
    ["status", "--porcelain", "--", WATCHED],
    { encoding: "utf8" },
  );
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    // Untracked output (`??`) is not the failure this guards: a run that
    // drops a new report under datasets/ has not rewritten client input.
    .filter((line) => !line.startsWith("??"));
}

const changed = modifiedUnderDatasets();

if (changed.length === 0) {
  console.log(
    `assert-datasets-unmodified: clean — the run modified no tracked file under ${WATCHED}`,
  );
  process.exit(0);
}

console.error(
  `assert-datasets-unmodified: a test run modified ${changed.length} tracked file(s) under ${WATCHED}.`,
);
for (const line of changed) console.error(`  ${line}`);
console.error(
  [
    "",
    "These are committed client input files. A suite wrote to them during the run.",
    "Find the writer and stop it writing — do not revert the files in CI and do",
    "not add them to .gitignore. An fs probe loaded through",
    "NODE_OPTIONS=--require names the writer with a stack, and covers child",
    "processes that a probe inside the Jest worker would miss.",
  ].join("\n"),
);
process.exit(1);
