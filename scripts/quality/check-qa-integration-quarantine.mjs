#!/usr/bin/env node
/**
 * Keep the QA integration quarantine list honest.
 *
 * `src/__tests__/integration/qa/` held 37 suites and 915 assertions that no
 * workflow ran. The "Changed integration suites have a CI owner" gate only
 * fires on a suite a PR *changes*, so a directory that was never wired is
 * invisible to it by construction — running this one for the first time found
 * 6 red suites and 9 failing assertions, every one dating from work that
 * shipped without re-measuring a QA artifact.
 *
 * A list of names in a file is not a control. This checks the same five ways
 * it rots that the sibling Admin list checks, and the fifth is the one that
 * matters:
 *
 *   1. A named suite no longer exists — a stale exclusion that excludes
 *      nothing while hiding that the list was never revisited.
 *   2. A suite is named twice.
 *   3. An entry carries no reason, failing case, or owning backlog item. A
 *      bare filename is how an exclusion loses the argument for its own
 *      existence.
 *   4. The list has grown past the size it was created at. The ceiling is a
 *      RATCHET: being UNDER it fails too, so clearing an entry cannot leave
 *      silent headroom for the next one.
 *   5. THE REASON EXPIRED. Every quarantined suite is re-run here, and this
 *      fails if one PASSES. These reasons are measurable states of the
 *      repository, so the honest re-measurement is to run the thing.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const SUITE_DIR = path.join(REPO, "src/__tests__/integration", "qa");
const LIST = path.join(HERE, "qa-integration-quarantine.json");

/**
 * The list length when the directory was first wired on 2026-09-19 (T-500) was
 * six. Lowered to five on 2026-09-20 by T-521, which cleared
 * intelligence-tower-blueprint-verification.test.ts by repairing the artifact:
 * the three absent paths it reads are now declared retirements naming the
 * commits that removed them, rather than absences reported as "not yet
 * present". See the ratchet note above: this fails when the list is shorter
 * than this number as well as longer, so a cleared entry cannot leave silent
 * headroom for the next one. Lowered to three by T-503 when the retired route
 * target was resolved, then to one by T-504 when the canonical brand aliases
 * were retired and the exact TopBar matcher repaired both owned suites.
 */
const CEILING = 1;

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
      "Repair the artifact or decide the item that owns it instead of excluding it, " +
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

// 5 — re-measure the reason.
const runnable = quarantined.filter(
  (e) => typeof e?.suite === "string" && existsSync(path.join(SUITE_DIR, e.suite)),
);

for (const entry of runnable) {
  const relative = `src/__tests__/integration/qa/${entry.suite}`;
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
  console.error("QA integration quarantine list needs attention:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

function countSuites(dir) {
  return readdirSync(dir, { withFileTypes: true }).reduce((n, e) => {
    if (e.isDirectory()) return n + countSuites(path.join(dir, e.name));
    return n + (/\.(test|spec)\.[cm]?[jt]sx?$/.test(e.name) ? 1 : 0);
  }, 0);
}

const total = countSuites(SUITE_DIR);
console.log(
  `QA integration quarantine is clean: ${quarantined.length} excluded of ` +
    `${total} suites in the directory; ${total - quarantined.length} run on every PR. ` +
    `Each excluded suite was re-run here and still fails for the reason recorded ` +
    `against it (${[...new Set(quarantined.map((e) => e.owner))].join(", ")}).`,
);
