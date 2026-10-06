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
 * checks the ways it rots:
 *
 *   1. A named suite no longer exists — a stale exclusion that keeps excluding
 *      nothing while hiding that the list was never revisited.
 *   2. THE REASON EXPIRED. Every entry names the failure evidence that still
 *      justifies the exclusion. If the suite passes, or if it fails for a
 *      different reason, this exits 1 and forces the list to be re-measured.
 *   3. BOTH ceilings are ratchets in both directions. Being UNDER one fails
 *      as surely as being over it, because clearing an entry without lowering
 *      the ceiling leaves silent headroom, and the next exclusion then passes
 *      unexamined. This was the fourth list in the repository found turning
 *      one way only — the dark-directory list, the npm-script reconciliation
 *      baseline, and the quarantine comparison were the others — which makes
 *      it a habit rather than an oversight.
 *   4. Swept-in sibling files in `alsoIgnored` need the same shape. A bare
 *      path fragment is not a control.
 *   4. The list has grown past the size it was created at. Appending to a
 *      quarantine is how a temporary carve-out becomes the standard; growing it
 *      should take a deliberate edit here, in a diff a reviewer sees.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveQuarantineListPath } from "./quarantine-list-path.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const SUITE_DIR = path.join(REPO, "src/__tests__/integration", "source");
/**
 * The committed list this check exists to guard. `--list <path>` reads a
 * different file instead, which is how the ratchet suite exercises the checker
 * without writing the working tree that ~31 other readers parse. The DEFAULT is
 * asserted by that suite against every configured invocation, so the override
 * cannot become a way to point the gate at a friendlier file.
 */
const DEFAULT_LIST = path.join(HERE, "source-integration-quarantine.json");
const LIST = resolveQuarantineListPath(process.argv.slice(2), DEFAULT_LIST);
const JEST_BIN = path.join(
  REPO,
  "node_modules/.bin",
  process.platform === "win32" ? "jest.cmd" : "jest",
);

/**
 * The count after the T-045/T-047 expiry pass on 2026-09-19. This only ever
 * goes down. Lowering it as suites are repaired is the point; raising it is a
 * decision someone has to make here, visibly.
 */
const CEILING = 8;

const {
  quarantined,
  alsoIgnored = [],
  alsoIgnoredCeiling = 0,
} = JSON.parse(readFileSync(LIST, "utf8"));
const problems = [];
const validationTargets = [];

function hasText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function validateFailurePatterns(entry, label) {
  if (!Array.isArray(entry.expectedFailurePatterns) || entry.expectedFailurePatterns.length === 0) {
    problems.push(
      `${label} names no expectedFailurePatterns, so nothing can expire its ` +
        "exclusion. Name stable text from the failure that still justifies it.",
    );
    return;
  }

  for (const pattern of entry.expectedFailurePatterns) {
    if (!hasText(pattern)) {
      problems.push(`${label} has a blank expectedFailurePatterns entry.`);
    }
  }
}

for (const entry of quarantined) {
  if (
    typeof entry?.suite !== "string" ||
    !hasText(entry.reason) ||
    !hasText(entry.owner)
  ) {
    problems.push(
      `Malformed quarantine entry ${JSON.stringify(entry)}. Every entry needs ` +
        'a "suite" filename, a "reason", an "owner" backlog item, and expected failure evidence.',
    );
    continue;
  }

  const suitePath = path.join(SUITE_DIR, entry.suite);
  if (!existsSync(suitePath)) {
    problems.push(
      `${entry.suite} is quarantined but no longer exists. Remove it from the ` +
        "list — a stale exclusion hides that the list was never revisited.",
    );
  }

  validateFailurePatterns(entry, entry.suite);
  validationTargets.push({
    id: entry.suite,
    path: suitePath,
    expectedFailurePatterns: entry.expectedFailurePatterns ?? [],
  });
}

const seen = new Set();
for (const entry of quarantined) {
  const suite = entry?.suite;
  if (typeof suite !== "string") continue;
  if (seen.has(suite)) problems.push(`${suite} appears more than once in the quarantine list.`);
  seen.add(suite);
}

for (const entry of alsoIgnored) {
  if (
    typeof entry?.path !== "string" ||
    !hasText(entry.reason) ||
    !hasText(entry.owner)
  ) {
    problems.push(
      `Malformed alsoIgnored entry ${JSON.stringify(entry)}. Every entry needs ` +
        'a repo-relative "path", a "reason", an "owner" backlog item, and expected failure evidence.',
    );
    continue;
  }

  const ignoredPath = path.join(REPO, entry.path);
  if (!existsSync(ignoredPath)) {
    problems.push(
      `alsoIgnored names ${entry.path}, which does not exist. Remove it — an ` +
        "exclusion that excludes nothing still reads like a known problem.",
    );
  }

  validateFailurePatterns(entry, entry.path);
  validationTargets.push({
    id: entry.path,
    path: ignoredPath,
    expectedFailurePatterns: entry.expectedFailurePatterns ?? [],
  });
}

const seenIgnored = new Set();
for (const entry of alsoIgnored) {
  const ignoredPath = entry?.path;
  if (typeof ignoredPath !== "string") continue;
  if (seenIgnored.has(ignoredPath)) problems.push(`${ignoredPath} appears more than once in alsoIgnored.`);
  seenIgnored.add(ignoredPath);
}

if (alsoIgnored.length > alsoIgnoredCeiling) {
  problems.push(
    `alsoIgnored holds ${alsoIgnored.length} paths; the ceiling is ${alsoIgnoredCeiling}. ` +
      "These are files OUTSIDE the suite directory that the command's path regex sweeps in. " +
      "Triage the file or narrow the command, and raise alsoIgnoredCeiling with a reason if " +
      "neither is possible.",
  );
} else if (alsoIgnored.length < alsoIgnoredCeiling) {
  problems.push(
    `alsoIgnored holds ${alsoIgnored.length} path(s) but alsoIgnoredCeiling is still ` +
      `${alsoIgnoredCeiling}, so ${alsoIgnoredCeiling - alsoIgnored.length} slot(s) of ` +
      "headroom were created by clearing entries. A ceiling that stays above the list is " +
      `not a ratchet: the next ${alsoIgnoredCeiling - alsoIgnored.length} exclusion(s) would ` +
      `pass silently. Lower alsoIgnoredCeiling to ${alsoIgnored.length} in the same change ` +
      "that removed them.",
  );
}

if (quarantined.length > CEILING) {
  problems.push(
    `The quarantine holds ${quarantined.length} suites; the ceiling is ${CEILING}. ` +
      "Repair the suite instead of excluding it, or raise CEILING in this file " +
      "with a reason — so growing the carve-out is a visible decision.",
  );
} else if (quarantined.length < CEILING) {
  problems.push(
    `The quarantine holds ${quarantined.length} suites but CEILING is still ${CEILING}, ` +
      `so ${CEILING - quarantined.length} slot(s) of headroom were created by clearing ` +
      "entries. A ceiling that stays above the list is not a ratchet: the next " +
      `${CEILING - quarantined.length} exclusion(s) would pass silently. Lower CEILING to ` +
      `${quarantined.length} in the same change that removed them.`,
  );
}

if (problems.length === 0 && validationTargets.length > 0) {
  if (!existsSync(JEST_BIN)) {
    problems.push(`Cannot validate quarantine causes because ${JEST_BIN} does not exist.`);
  } else {
    const tmp = mkdtempSync(path.join(tmpdir(), "source-integration-quarantine-"));
    const outputFile = path.join(tmp, "jest-results.json");
    try {
      const result = spawnSync(
        JEST_BIN,
        [
          ...validationTargets.map((target) => target.path),
          "--runInBand",
          "--no-coverage",
          "--json",
          `--outputFile=${outputFile}`,
        ],
        {
          cwd: REPO,
          encoding: "utf8",
          maxBuffer: 1024 * 1024 * 50,
        },
      );

      if (!existsSync(outputFile)) {
        problems.push(
          "Jest did not write quarantine validation results. " +
            `Exit ${result.status}; stderr: ${(result.stderr ?? "").slice(0, 800)}`,
        );
      } else {
        const parsed = JSON.parse(readFileSync(outputFile, "utf8"));
        const byPath = new Map(parsed.testResults.map((suite) => [path.resolve(suite.name), suite]));

        for (const target of validationTargets) {
          const resultForTarget = byPath.get(path.resolve(target.path));
          if (!resultForTarget) {
            problems.push(`${target.id} did not appear in the quarantine validation results.`);
            continue;
          }

          const failedAssertions = resultForTarget.assertionResults.filter(
            (assertion) => assertion.status === "failed",
          );
          const failureText = [
            resultForTarget.message,
            ...failedAssertions.flatMap((assertion) => assertion.failureMessages ?? []),
          ]
            .filter(Boolean)
            .join("\n");

          if (failedAssertions.length === 0 && resultForTarget.status !== "failed") {
            problems.push(
              `${target.id} is excluded but now passes. Remove it from the quarantine and ` +
                "the ignore-args list.",
            );
            continue;
          }

          const missingPatterns = target.expectedFailurePatterns.filter(
            (pattern) => !failureText.includes(pattern),
          );
          if (missingPatterns.length > 0) {
            problems.push(
              `${target.id} no longer shows its stated failure evidence: ` +
                missingPatterns.map((pattern) => JSON.stringify(pattern)).join(", ") +
                ". Re-run the suite: if it passes, remove the entry; if it still fails, " +
                "update the reason and evidence.",
            );
          }
        }
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
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
    `${total} suites in the directory; ${total - quarantined.length} run on every PR. ` +
    `${validationTargets.length} exclusions were re-measured for their stated failure evidence. ` +
    `${alsoIgnored.length} swept-in sibling paths are excluded (ceiling ${alsoIgnoredCeiling}).`,
);
