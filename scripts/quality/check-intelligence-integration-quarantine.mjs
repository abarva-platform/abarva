#!/usr/bin/env node
/**
 * Keep the Intelligence integration quarantine list honest.
 *
 * `src/__tests__/integration/intelligence/` held 33 suites that no GitHub
 * workflow ran. The "Changed integration suites have a CI owner" gate only
 * fires on a suite a PR *changes*, so the rest sat unexecuted — and running the
 * directory for the first time found 26 red suites and 133 failing assertions.
 *
 * The triage found one cause, not 133 problems: 131 of those 133 are a source
 * file read as TEXT that does not exist. So the 25 excluded suites are stale
 * contracts for a component and route tree that was replaced, not defects in
 * shipping code — which is exactly the kind of exclusion that becomes permanent
 * because nobody ever re-measures it.
 *
 * A list of names in a file is not a control. This checks the four ways it
 * rots, and the third one is the one that matters:
 *
 *   1. A named suite no longer exists — a stale exclusion that excludes nothing
 *      while hiding that the list was never revisited.
 *   2. A suite is named twice.
 *   3. THE REASON EXPIRED. Every entry names the paths whose absence is why it
 *      is quarantined. If one of those files comes back, the suite may well
 *      pass again and must be re-measured — so this fails and says so. That
 *      makes the list self-clearing rather than self-perpetuating, and it is a
 *      check that can actually fail: create any named file and this exits 1.
 *   4. The list has grown past the size it was created at. Appending to a
 *      quarantine is how a temporary carve-out becomes the standard.
 *
 * `alsoIgnored` is a second, separate list: full path fragments for red files
 * that the workflow command's path regex sweeps in from OUTSIDE the suite
 * directory. Until backlog item T-044 it was read by the ignore-args generator
 * and by nothing else — no shape, no reason, no owner, and no check that the
 * file it named still existed. Two bare strings sat in it untriaged. It is
 * empty now, and the rules below are what has to be true of anything added to
 * it: an object naming the repo-relative path, why it is out, and the item that
 * owns getting it back in.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const SUITE_DIR = path.join(REPO, "src/__tests__/integration", "intelligence");
const LIST = path.join(HERE, "intelligence-integration-quarantine.json");

/**
 * The list length. 25 when the directory was first wired on 2026-09-19; 16 once
 * backlog item T-043 batch 1 cleared the nine IntelligenceLensTabs suites the
 * same day.
 *
 * This is a RATCHET, not headroom: the check below fails when the list is
 * shorter than this number as well as when it is longer. A ceiling left above
 * the list after entries are cleared hands the next nine exclusions a silent
 * pass, which is the same carve-out-by-drift the reason-expiry control exists
 * to stop — the size would then only be re-measured by whoever happened to
 * exceed the old high-water mark. Moving it is the visible decision in both
 * directions.
 */
const CEILING = 16;

const {
  quarantined,
  alsoIgnored = [],
  alsoIgnoredCeiling = 0,
} = JSON.parse(readFileSync(LIST, "utf8"));
const problems = [];

for (const entry of quarantined) {
  if (typeof entry?.suite !== "string" || !Array.isArray(entry?.missing)) {
    problems.push(
      `Malformed entry ${JSON.stringify(entry)}. Every entry needs a "suite" ` +
        'filename and a "missing" list of the paths whose absence is its reason.',
    );
    continue;
  }

  if (!existsSync(path.join(SUITE_DIR, entry.suite))) {
    problems.push(
      `${entry.suite} is quarantined but no longer exists. Remove it from the ` +
        "list — a stale exclusion hides that the list was never revisited.",
    );
  }

  if (entry.missing.length === 0) {
    problems.push(
      `${entry.suite} names no missing path, so nothing can ever expire its ` +
        "exclusion. Name the paths it reads that do not exist.",
    );
  }

  const returned = entry.missing.filter((rel) => existsSync(path.join(REPO, rel)));
  if (returned.length > 0) {
    problems.push(
      `${entry.suite} is excluded because ${entry.missing.join(", ")} do not ` +
        `exist, but ${returned.join(", ")} now does. Re-run the suite: if it ` +
        "passes, delete its entry here; if it still fails, it fails for a new " +
        "reason that has to be written down.",
    );
  }
}

const seen = new Set();
for (const { suite } of quarantined) {
  if (seen.has(suite)) problems.push(`${suite} appears more than once in the quarantine list.`);
  seen.add(suite);
}

for (const entry of alsoIgnored) {
  if (
    typeof entry?.path !== "string" ||
    typeof entry?.reason !== "string" ||
    typeof entry?.owner !== "string" ||
    entry.reason.trim() === "" ||
    entry.owner.trim() === ""
  ) {
    problems.push(
      `Malformed alsoIgnored entry ${JSON.stringify(entry)}. Every entry needs ` +
        'a repo-relative "path", a "reason" it is excluded, and an "owner" backlog ' +
        "item that gets it back in. A bare string is how an exclusion loses " +
        "the argument for its own existence.",
    );
    continue;
  }

  if (!existsSync(path.join(REPO, entry.path))) {
    problems.push(
      `alsoIgnored names ${entry.path}, which does not exist. Remove it — an ` +
        "exclusion that excludes nothing still reads like a known problem.",
    );
  }
}

if (alsoIgnored.length > alsoIgnoredCeiling) {
  problems.push(
    `alsoIgnored holds ${alsoIgnored.length} paths; the ceiling is ` +
      `${alsoIgnoredCeiling}. These are files OUTSIDE the suite directory that ` +
      "the command's path regex sweeps in. Triage the file or narrow the " +
      "command, and raise alsoIgnoredCeiling in the list with a reason if " +
      "neither is possible — so growing this is a visible decision too.",
  );
}

if (quarantined.length > CEILING) {
  problems.push(
    `The quarantine holds ${quarantined.length} suites; the ceiling is ${CEILING}. ` +
      "Rewrite the suite against the surface that ships instead of excluding it, " +
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

if (problems.length > 0) {
  console.error("Intelligence integration quarantine list needs attention:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const total = readdirSync(SUITE_DIR).filter((n) =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(n),
).length;
const watched = new Set(quarantined.flatMap((e) => e.missing));
console.log(
  `Intelligence integration quarantine is clean: ${quarantined.length} excluded of ` +
    `${total} suites in the directory; ${total - quarantined.length} run on every PR. ` +
    `${watched.size} retired paths are watched for return. ` +
    `${alsoIgnored.length} swept-in sibling paths are excluded (ceiling ${alsoIgnoredCeiling}).`,
);
