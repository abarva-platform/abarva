#!/usr/bin/env node
/**
 * Keep the Source integration quarantine list honest.
 *
 * `src/__tests__/integration/source/` held 92 suites that no GitHub workflow
 * ran. The "Changed integration suites have a CI owner" gate only fires on a
 * suite a PR *changes*, so the rest sat unexecuted indefinitely — 591 passing
 * assertions nobody was collecting, and 68 failures nobody could see until the
 * directory was run for the first time.
 *
 * Running all 92 would have turned every PR red on arrival, and a workflow that
 * is red on arrival gets switched off. So the workflow runs the directory with
 * the suites in source-integration-quarantine.json excluded. Default is
 * INCLUDE: a new suite runs the day it lands, which is the property that makes
 * this cover work nobody has written yet.
 *
 * The risk with any exclusion list is that it quietly becomes permanent. This
 * checks the two ways it rots:
 *
 *   1. A named suite no longer exists — a stale exclusion that keeps excluding
 *      nothing while hiding that the list was never revisited.
 *   2. The list has grown past the size it was created at. Appending to a
 *      quarantine is how a temporary carve-out becomes the standard; growing it
 *      should take a deliberate edit here, in a diff a reviewer sees.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const SUITE_DIR = path.join(REPO, "src/__tests__/integration", "source");
const LIST = path.join(HERE, "source-integration-quarantine.json");

/**
 * The count when the directory was first wired, on 2026-09-19. This only ever
 * goes down. Lowering it as suites are repaired is the point; raising it is a
 * decision someone has to make here, visibly.
 */
const CEILING = 18;

const { quarantined } = JSON.parse(readFileSync(LIST, "utf8"));
const problems = [];

for (const name of quarantined.filter((n) => !existsSync(path.join(SUITE_DIR, n)))) {
  problems.push(
    `${name} is quarantined but no longer exists. Remove it from the list — a ` +
      "stale exclusion hides that the list was never revisited.",
  );
}

const duplicates = new Set(
  quarantined.filter((name, i) => quarantined.indexOf(name) !== i),
);
for (const name of duplicates) {
  problems.push(`${name} appears more than once in the quarantine list.`);
}

if (quarantined.length > CEILING) {
  problems.push(
    `The quarantine holds ${quarantined.length} suites; the ceiling is ${CEILING}. ` +
      "Repair the suite instead of excluding it, or raise CEILING in this file " +
      "with a reason — so growing the carve-out is a visible decision.",
  );
}

if (problems.length > 0) {
  console.error("Source integration quarantine list needs attention:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const total = readdirSync(SUITE_DIR).filter((n) =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(n),
).length;
console.log(
  `Source integration quarantine is clean: ${quarantined.length} excluded of ` +
    `${total} suites in the directory; ${total - quarantined.length} run on every PR.`,
);
