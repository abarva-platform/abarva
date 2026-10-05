#!/usr/bin/env node
/**
 * A suite reachable ONLY by a non-pull-request trigger cannot stop the merge
 * that breaks it. This fails when any test file is in that state. (item T-792)
 *
 * The census already measures it. `coveredTestFiles` counts files some
 * workflow reaches; `pullRequestCoveredTestFiles` counts the subset reached by
 * a `pull_request` or `merge_group` workflow — the census's own method note
 * calls that "the set that can block a merge". The difference between those two
 * numbers is a population of suites that run green AFTER the deploy they might
 * have stopped, and green-and-unwired is the same as absent to a reviewer.
 *
 * Until this gate, that difference was published as two numbers side by side in
 * the census summary and read by nothing:
 *
 *   run by a workflow:              2543
 *   run by a pull-request workflow: 2542
 *
 * No script, no workflow step and no gate consumed `pullRequestCovered`; the
 * only mention outside the census generator was a COMMENT in
 * `unit-suites.yml`. The committed census carries the two aggregates and no
 * per-file list, so the identity of the file in that gap was recoverable from
 * no committed artifact — it had to be recomputed from the generator's
 * unexported internals. That is the shape this backlog was opened against: a
 * gate you cannot fail is not a gate, and a count with no list behind it is not
 * a finding anyone can act on.
 *
 * It also closes the way the two known instances were FOUND. Both surfaced from
 * the governed-risk directory ranking while someone worked that directory
 * (T-478, then T-764) — so the detector was a directory being drawn, and a file
 * in a FULLY COVERED directory was invisible to it. `src/lib/ecl/__tests__` is
 * fully covered; its gap file was reached by no draw in the eleven triage
 * rounds since. This check is a function of the whole tree, so it does not
 * depend on the next accident.
 *
 * NO EXEMPTION LIST, ON PURPOSE. A pre-deploy-only invocation is not wrong — it
 * is incomplete. Both precedents kept the pre-deploy gate's own invocation and
 * ADDED the merge-blocking one, which is what makes the remedy additive and an
 * allowlist unnecessary. An enumeration of tolerated files is the exemption
 * branch this backlog exists against: the one entry that outlives its reason is
 * unobservable when it happens.
 *
 * Usage:
 *   node scripts/quality/check-pull-request-coverage-gap.mjs
 *   node scripts/quality/check-pull-request-coverage-gap.mjs --json
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { isDirectInvocation } from "../exec/cli-entry.mjs";
import { buildCensus } from "./test-ci-coverage-census.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/**
 * The predicate, over the census's own per-file rows.
 *
 * Kept separate from the census run so the behavioural test drives it with
 * fixtures: a test that had to build the real census would be asserting the
 * census, and would take seven seconds to tell us whether an `if` is inverted.
 *
 * `covered === true` is deliberate rather than `!== false`. An uncovered file
 * is a different and already-reported defect (`uncoveredTestFiles`,
 * `untriagedUnrunTestFiles`), and claiming it here would double-report it under
 * a name that does not describe it.
 */
export function pullRequestCoverageGap(fileStatuses) {
  return fileStatuses
    .filter((file) => file.covered === true && file.pullRequestCovered !== true)
    .map((file) => ({
      testPath: file.testPath,
      directory: file.directory,
      via: file.via ?? [],
    }));
}

export function formatVerdict(gap) {
  if (gap.length === 0) {
    return [
      "pull-request coverage gap: none.",
      "Every test file a workflow reaches is reached by a pull-request or merge_group workflow.",
    ].join("\n");
  }
  const lines = [
    `pull-request coverage gap: ${gap.length} test file(s) are run by a workflow, and by NO pull-request or merge_group workflow.`,
    "",
    "Each one runs green after the deploy it might have stopped, and can fail no merge:",
    "",
  ];
  for (const file of gap) {
    lines.push(`  ${file.testPath}`);
    lines.push(
      `    reached via: ${file.via.length > 0 ? file.via.join(", ") : "(nothing the census could name)"}`,
    );
  }
  lines.push("");
  lines.push(
    "Remedy, as T-478 and T-764 took it: ADD a pull-request-triggered invocation by exact path",
    "(`.github/workflows/unit-suites.yml` holds the precedent steps) and leave the existing",
    "pre-deploy invocation in place. Then refresh `docs/architecture/test-ci-coverage-census.json`.",
    "",
    "Do not silence this by deleting the suite or by removing its pre-deploy invocation: both",
    "lower the gap count while lowering the protection with it.",
  );
  return lines.join("\n");
}

function main() {
  const json = process.argv.includes("--json");
  const census = buildCensus(REPO_ROOT, { includeFileStatuses: true });
  const gap = pullRequestCoverageGap(census.fileStatuses);

  if (json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          coveredTestFiles: census.counts.coveredTestFiles,
          pullRequestCoveredTestFiles:
            census.counts.pullRequestCoveredTestFiles,
          gap,
        },
        null,
        2,
      )}\n`,
    );
  } else {
    process.stdout.write(`${formatVerdict(gap)}\n`);
  }

  process.exitCode = gap.length === 0 ? 0 : 1;
}

if (isDirectInvocation(import.meta.url)) main();
