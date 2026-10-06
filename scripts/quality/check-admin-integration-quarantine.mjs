#!/usr/bin/env node
/**
 * Keep the Admin integration quarantine list honest.
 *
 * `src/__tests__/integration/admin/` holds 51 suites that one workflow reached
 * by naming one file. The "Changed integration suites have a CI owner" gate
 * only fires on a suite a PR *changes*, so the rest sat unexecuted — and
 * running the directory for the first time found 12 red suites and 24 failing
 * assertions. Backlog item T-032 triaged all 24 and repaired 22.
 *
 * The two that remain are NOT stale contracts. Each one found something real in
 * shipping code and each needs a product decision, which is exactly the kind of
 * exclusion that becomes permanent because nobody ever re-measures it.
 *
 * A list of names in a file is not a control. This checks the five ways it
 * rots, and the fifth is the one that matters:
 *
 *   1. A named suite no longer exists — a stale exclusion that excludes nothing
 *      while hiding that the list was never revisited.
 *   2. A suite is named twice.
 *   3. An entry carries no reason or no owning backlog item. A bare filename is
 *      how an exclusion loses the argument for its own existence.
 *   4. The list has grown past the size it was created at. Appending to a
 *      quarantine is how a temporary carve-out becomes the standard, and the
 *      ceiling is a RATCHET: being UNDER it fails too, so clearing an entry
 *      cannot leave silent headroom for the next one.
 *   5. THE REASON EXPIRED. Every quarantined suite is re-run here, and this
 *      fails if one PASSES. The sibling Intelligence list approximates this by
 *      watching retired paths for return, because its reasons are absences.
 *      These reasons are not absences — they are live defects — so the honest
 *      re-measurement is to run the thing. It is also a check that can actually
 *      fail in the direction that matters: fix the palette drift or settle the
 *      vocabulary record, and this exits 1 until the entry is deleted.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const SUITE_DIR = path.join(REPO, "src/__tests__/integration", "admin");
const LIST = path.join(HERE, "admin-integration-quarantine.json");

/**
 * The list length when the directory was first wired on 2026-09-19 (T-032).
 * Two, and both are decisions rather than code. See the ratchet note above:
 * this fails when the list is shorter than this number as well as longer.
 */
const CEILING = 2;

const { quarantined } = JSON.parse(readFileSync(LIST, "utf8"));
const problems = [];

for (const entry of quarantined) {
  if (
    typeof entry?.suite !== "string" ||
    typeof entry?.reason !== "string" ||
    typeof entry?.owner !== "string" ||
    typeof entry?.failingCase !== "string" ||
    entry.reason.trim() === "" ||
    entry.owner.trim() === "" ||
    entry.failingCase.trim() === ""
  ) {
    problems.push(
      `Malformed entry ${JSON.stringify(entry)}. Every entry needs a "suite" ` +
        'filename, the "failingCase" it is excluded for, a "reason" in plain ' +
        'English, and an "owner" backlog item that gets it back in.',
    );
    continue;
  }

  if (!existsSync(path.join(SUITE_DIR, entry.suite))) {
    problems.push(
      `${entry.suite} is quarantined but no longer exists. Remove it from the ` +
        "list — a stale exclusion hides that the list was never revisited.",
    );
  }
}

const seen = new Set();
for (const { suite } of quarantined) {
  if (seen.has(suite)) problems.push(`${suite} appears more than once in the quarantine list.`);
  seen.add(suite);
}

if (quarantined.length > CEILING) {
  problems.push(
    `The quarantine holds ${quarantined.length} suites; the ceiling is ${CEILING}. ` +
      "Repair the suite or decide the item that owns it instead of excluding it, " +
      "or raise CEILING in this file with a reason — so growing the carve-out is " +
      "a visible decision.",
  );
} else if (quarantined.length < CEILING) {
  problems.push(
    `The quarantine holds ${quarantined.length} suites but CEILING is still ` +
      `${CEILING}, so ${CEILING - quarantined.length} slot(s) of headroom were ` +
      "just created by clearing entries. A ceiling that stays above the list is " +
      `not a ratchet: the next ${CEILING - quarantined.length} exclusion(s) would ` +
      `pass this check silently. Lower CEILING to ${quarantined.length} in the ` +
      "same change that removes the entries.",
  );
}

// 5 — re-measure the reason. Skippable only for the malformed/missing entries
// already reported above, because jest would fail on a path that is not there
// and say something less useful than the message this already produced.
const runnable = quarantined.filter(
  (e) => typeof e?.suite === "string" && existsSync(path.join(SUITE_DIR, e.suite)),
);

for (const entry of runnable) {
  const relative = `src/__tests__/integration/admin/${entry.suite}`;
  const run = spawnSync(
    process.execPath,
    [
      path.join(REPO, "node_modules/jest/bin/jest.js"),
      "--runTestsByPath",
      relative,
      "--no-coverage",
      "--ci",
      "--silent",
    ],
    { cwd: REPO, encoding: "utf8", env: { ...process.env, CI: "true" } },
  );

  if (run.error) {
    problems.push(
      `${entry.suite} could not be re-run (${run.error.message}). This check is ` +
        "the only thing that expires this entry, so a run that cannot happen is " +
        "treated as a failure rather than a pass.",
    );
    continue;
  }

  if (run.status === 0) {
    problems.push(
      `${entry.suite} PASSES now. It is excluded because "${entry.failingCase}" ` +
        `fails — owner ${entry.owner}. Its reason has expired: delete the entry, ` +
        "re-run the directory, and confirm the workflow stays green.",
    );
  }
}

if (problems.length > 0) {
  console.error("Admin integration quarantine list needs attention:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

// Counted recursively: admin/ holds a `data/` subdirectory of 5 suites that the
// directory pattern in the workflow runs too, and a non-recursive count here
// would report the directory as smaller than what the command actually covers.
function countSuites(dir) {
  return readdirSync(dir, { withFileTypes: true }).reduce((n, e) => {
    if (e.isDirectory()) return n + countSuites(path.join(dir, e.name));
    return n + (/\.(test|spec)\.[cm]?[jt]sx?$/.test(e.name) ? 1 : 0);
  }, 0);
}

const total = countSuites(SUITE_DIR);
console.log(
  `Admin integration quarantine is clean: ${quarantined.length} excluded of ` +
    `${total} suites in the directory; ${total - quarantined.length} run on every PR. ` +
    `Each excluded suite was re-run here and still fails for the reason recorded ` +
    `against it (${quarantined.map((e) => e.owner).join(", ")}).`,
);
