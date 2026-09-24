#!/usr/bin/env node
/**
 * Keep the integration ROOT carve-out honest.
 *
 * Every sibling list in this directory guards a directory a workflow NAMES, so
 * the default there is INCLUDED and a new suite runs the day it lands. The
 * root of `src/__tests__/integration` is different, for a reason recorded in
 * `integration-suites.yml`: naming that path as a directory would also run
 * every red subdirectory under it, so its root-level files are enumerated one
 * by one, by exact path.
 *
 * That inverts the default to EXCLUDED, and an inverted default needs a
 * control the sibling lists never needed. Until this file existed, the only
 * record of the carve-out was a workflow comment reading "10 are still red and
 * stay out of the green job" — a count, with no per-file reason, no owner, and
 * nothing that could fail. Five root files were still unrun and untriaged when
 * this landed, and one of them was red because a governed Source answer had
 * started dropping two of three recommended vendors. Nobody saw it, because
 * nothing ran it, because nothing checked that everything ran.
 *
 * Four ways the carve-out rots, and the first is the one the enumeration
 * cannot notice by itself:
 *
 *   1. A root file is unrun and UNDECLARED. With the default inverted, that is
 *      what silence looks like: no failure, no mention, no coverage.
 *   2. A declared file is RUN again. The exclusion no longer excludes anything
 *      but still reads as live to the next person who counts the list.
 *   3. A declared file no longer exists, is named twice, or carries no reason,
 *      owner or triage verdict.
 *   4. THE REASON EXPIRED — `--rerun` runs every quarantined suite and fails if
 *      one PASSES. That is the direction that matters: repair the suite and
 *      this exits 1 until the entry is deleted and the file is wired back into
 *      the workflow.
 *
 * "Is this test file run by any workflow" is NOT re-implemented here. It is
 * asked of `test-ci-coverage-census.mjs`, which already resolves package
 * scripts, jest invocations, ignore arguments and directory-regex collisions —
 * and gets the collisions right, which a naive read of the workflow would not:
 * `npx jest src/__tests__/integration/programs` is a regex that also selects
 * root files beginning `programs-`. Two audits asking the same question must
 * not be able to disagree about the answer.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectInvocation } from "../exec/cli-entry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const ROOT_DIR = "src/__tests__/integration";
const LIST = path.join(HERE, "integration-root-quarantine.json");

/**
 * The list length when the root carve-out was first declared (backlog item 26,
 * 2026-09-23): the five root files the census reported unrun and untriaged.
 * A RATCHET — being under this fails too, so clearing an entry cannot leave
 * silent headroom for the next one. Lower it in the same change that wires a
 * suite back in.
 */
// 5 -> 4 (C-502). `source-chat-shape.test.ts` was the one entry on this
// list whose verdict was `real` rather than `update`: the suite was correct
// and the product was wrong. C-502 fixed the shaper, so the entry is gone
// and the file is named by exact path in the Source integration workflow.
// Lowered in the SAME change that removed the entry, which is what this
// file's own ratchet requires — a ceiling left above the list is headroom
// the next exclusion would pass through unexamined.
//
// 4 -> 3 (item 26). `deliverable-render-contract.test.ts`, verdict `update`.
// Its one failing case opened by pinning the seed path count at 457 against a
// tree that emits 363, so it threw on its first line and the two assertions
// after it — no legacy `/deliverables/phase-` folder, and the canonical d-code
// path is present — had never executed. The magnitude was dropped rather than
// re-pinned, because re-pinning 363 rebuilds the same trap; the population is
// now asserted non-empty, which is what keeps the filter assertions from
// passing over an empty array. Lowered in the SAME change that removed the
// entry and named the file in the integration-suites jest command.
const CEILING = 3;

/** The only triage verdicts item 26 recognises. */
const VERDICTS = ["update", "delete", "real"];

const REQUIRED = ["suite", "failingCase", "reason", "owner", "verdict"];

function filled(value) {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * The whole judgement, over plain data, so the cases can drive it without a
 * repository, a workflow file or a jest run.
 *
 * @param unrunPaths repo-relative root-level test files no workflow runs
 * @param entries    the declared quarantine
 * @param exists     (repo-relative path) => boolean
 * @param ceiling    the ratchet
 */
export function evaluateRootQuarantine({ unrunPaths, entries, exists, ceiling }) {
  const problems = [];
  const unrun = new Set(unrunPaths);

  for (const entry of entries) {
    if (!REQUIRED.every((field) => filled(entry?.[field]))) {
      problems.push(
        `Malformed entry ${JSON.stringify(entry)}. Every entry needs a "suite" ` +
          'filename, the "failingCase" it is excluded for, a "reason" in plain ' +
          'English, an "owner" that gets it back in, and a "verdict" of ' +
          `${VERDICTS.join(", ")}.`,
      );
      continue;
    }

    if (!VERDICTS.includes(entry.verdict)) {
      problems.push(
        `${entry.suite} carries verdict "${entry.verdict}". Item 26 records a ` +
          `stale suite as one of ${VERDICTS.join(", ")} — a free-text verdict ` +
          "lets a triage that never happened read as one that did.",
      );
      continue;
    }

    const relative = `${ROOT_DIR}/${entry.suite}`;

    if (!exists(relative)) {
      problems.push(
        `${entry.suite} is quarantined but no longer exists. Remove it from the ` +
          "list — a stale exclusion hides that the list was never revisited.",
      );
      continue;
    }

    if (!unrun.has(relative)) {
      problems.push(
        `${entry.suite} is quarantined but is run by a workflow now. The ` +
          "exclusion no longer excludes anything, and a carve-out that carves " +
          `nothing out still counts as live to whoever reads this list next. ` +
          `Delete the entry and lower CEILING in the same change.`,
      );
    }
  }

  const seen = new Set();
  for (const { suite } of entries) {
    if (seen.has(suite)) {
      problems.push(`${suite} appears more than once in the quarantine list.`);
    }
    seen.add(suite);
  }

  // 1 — the control the enumeration cannot supply. Named, not counted.
  const declared = new Set(entries.map((e) => `${ROOT_DIR}/${e.suite}`));
  for (const relative of unrunPaths) {
    if (declared.has(relative)) continue;
    problems.push(
      `${relative} exists and no workflow runs it. Root-level files here are ` +
        "enumerated by exact path, so the default is EXCLUDED and a file " +
        "nobody wired is silently unrun. Add it to the workflow command, or " +
        "declare it here with a failing case, a reason, an owner and a triage " +
        "verdict.",
    );
  }

  if (entries.length > ceiling) {
    problems.push(
      `The quarantine holds ${entries.length} suites; the ceiling is ${ceiling}. ` +
        "Repair the suite or decide the item that owns it instead of excluding " +
        "it, or raise CEILING in this file with a reason — so growing the " +
        "carve-out is a visible decision.",
    );
  } else if (entries.length < ceiling) {
    problems.push(
      `The quarantine holds ${entries.length} suites but CEILING is still ` +
        `${ceiling}, so ${ceiling - entries.length} slot(s) of headroom were ` +
        "just created by clearing entries. A ceiling that stays above the list " +
        `is not a ratchet: the next ${ceiling - entries.length} exclusion(s) ` +
        `would pass this check silently. Lower CEILING to ${entries.length} in ` +
        "the same change that removes the entries.",
    );
  }

  return { problems };
}

/** Root-level test files under the integration root that no workflow runs. */
export async function unrunRootPaths(repo) {
  const { buildCensus } = await import("./test-ci-coverage-census.mjs");
  const census = buildCensus(repo, { includeUnrunPaths: true });
  const entry = (census.unrunTestPathsByDirectory ?? []).find(
    (row) => row.directory === ROOT_DIR,
  );
  return entry?.unrunTestPaths ?? [];
}

/**
 * 4 — re-measure the reason. A quarantined suite that PASSES has outlived the
 * reason recorded against it, and saying so is the only thing that expires an
 * entry. A run that cannot happen is treated as a failure rather than a pass:
 * a check that errors into silence is the shape this file exists to refuse.
 */
function rerunProblems(entries) {
  const problems = [];
  for (const entry of entries) {
    const relative = `${ROOT_DIR}/${entry.suite}`;
    if (!existsSync(path.join(REPO, relative))) continue;

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
        `${entry.suite} could not be re-run (${run.error.message}). This check ` +
          "is the only thing that expires this entry, so a run that cannot " +
          "happen is treated as a failure rather than a pass.",
      );
      continue;
    }

    if (run.status === 0) {
      problems.push(
        `${entry.suite} PASSES now. It is excluded because "${entry.failingCase}" ` +
          `fails — owner ${entry.owner}, verdict ${entry.verdict}. Its reason ` +
          "has expired: delete the entry, add the file to the workflow command, " +
          "and lower CEILING in the same change.",
      );
    }
  }
  return problems;
}

async function main() {
  const { quarantined } = JSON.parse(readFileSync(LIST, "utf8"));
  const unrunPaths = await unrunRootPaths(REPO);

  const { problems } = evaluateRootQuarantine({
    unrunPaths,
    entries: quarantined,
    exists: (relative) => existsSync(path.join(REPO, relative)),
    ceiling: CEILING,
  });

  if (process.argv.includes("--rerun")) problems.push(...rerunProblems(quarantined));

  if (problems.length > 0) {
    console.error("Integration root quarantine list needs attention:\n");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const verdicts = VERDICTS.map(
    (v) => `${quarantined.filter((e) => e.verdict === v).length} ${v}`,
  ).join(", ");
  console.log(
    `Integration root quarantine is clean: ${quarantined.length} root-level ` +
      `suites excluded (${verdicts}); every other root-level file is run by a ` +
      "workflow. No root file is unrun without an entry here.",
  );
}

if (isDirectInvocation(import.meta.url)) {
  await main();
}
