#!/usr/bin/env node
/**
 * How many of the repository's Jest suites under `src/` does CI actually run?
 *
 * Six separate times, a directory of tests was discovered to run in no CI job —
 * each time by accident, while someone was working on something else, and each
 * time at the cost of a round trip. The directories were found one at a time and
 * wired one at a time. Nothing ever measured the whole gap, so the next instance
 * was always going to be found the same way.
 *
 * This enumerates every Jest test file under `src/` and asks, per file, whether a
 * GitHub workflow reaches a command that names it. It is a measurement, not a
 * gate: it always exits 0, and it decides nothing about what the scope policy
 * should be. The number is the input to that decision.
 *
 *   node scripts/quality/test-ci-coverage-census.mjs            # print the summary
 *   node scripts/quality/test-ci-coverage-census.mjs --json     # print the census
 *   node scripts/quality/test-ci-coverage-census.mjs --write    # refresh the committed census
 *
 * WHY THE ANSWER TAKES FOUR HOPS. A workflow rarely names a test path directly.
 * It runs an npm script, which may run another npm script, which may run a Node
 * script that spawns Jest, which may take its path list from a JSON baseline
 * file. Every hop is followed explicitly and every resolved path records which
 * hop found it, so any entry in the census can be audited back to the line that
 * justifies it. A census that stopped at the first hop reported
 * `src/__tests__/behaviors` — the one directory everybody knows is gated — as
 * uncovered, because its Jest call lives inside `scripts/ci/check-behavior-coverage.mjs`.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not guess. A Jest invocation whose
 * paths cannot be resolved to literals is reported in `indeterminateInvocations`
 * rather than assumed either way, and while that list is non-empty the uncovered
 * count is an upper bound and says so. Scanning a script file's whole text for a
 * path would be worse than not scanning it: this file mentions `jest` and names
 * `src/` paths in prose, and so does its sibling
 * `check-integration-ci-visibility.mjs`, which would then vouch for every suite
 * in the tree it guards.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  extractWorkflowRunCommands,
  expandWorkflowCommands,
} from "./check-integration-ci-visibility.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const CENSUS_RELATIVE_PATH = "docs/architecture/test-ci-coverage-census.json";

const TEST_FILE_RE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const SKIP_DIRECTORIES = new Set(["node_modules", "__snapshots__", "fixtures"]);

/** A test runner token, as it appears in a command line. */
const RUNNER_RE = /\b(?:npx\s+)?(?:jest|vitest)\b/;

/**
 * A repo script a workflow-reachable command executes. Shell scripts are
 * included because one of them runs Jest on a line of its own.
 */
const SCRIPT_REFERENCE_RE =
  /\b(?:node|bash|sh|npx\s+tsx|tsx|npx\s+ts-node|ts-node)\s+((?:src\/)?scripts\/[\w./-]+\.(?:[cm]?[jt]s|sh))/g;

/**
 * `scripts/ci/test-ratchet.mjs <baseline.json>` spawns Jest with `...paths`
 * spread from the baseline it is given, so the paths are in the JSON and not in
 * any command line. Named explicitly rather than inferred: a general rule that
 * read `paths` out of any JSON argument would claim coverage from files that
 * have nothing to do with a test run.
 */
const RATCHET_SCRIPT = "scripts/ci/test-ratchet.mjs";
const RATCHET_SPREAD = "...paths";

function normalize(value) {
  return value.replaceAll("\\", "/").replace(/\s+/g, " ").trim();
}

/**
 * Deliberately a separate matcher from the one in
 * `check-integration-ci-visibility.mjs`: that one walks ancestors only inside
 * `src/__tests__/integration`, because it answers a different question (did a
 * changed integration suite get registered). The command extraction, which is
 * the part that would be costly to have two copies of, is imported from it.
 */
function commandNamesPath(command, candidate) {
  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|[\\s"'\\x60=,(\\[])${escaped}(?=$|[\\s"'\\x60,)\\]])`,
  ).test(command);
}

/** The test path itself, then every directory above it up to `src`. */
export function registrationCandidates(testPath) {
  const candidates = [testPath];
  let directory = path.posix.dirname(testPath);
  while (directory && directory !== "." && directory !== "/") {
    candidates.push(directory);
    if (directory === "src") break;
    directory = path.posix.dirname(directory);
  }
  return candidates;
}

export function collectTestFiles(root, relativeDirectory = "src") {
  const absolute = path.join(root, relativeDirectory);
  if (!existsSync(absolute)) return [];
  const found = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const relative = `${relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      found.push(...collectTestFiles(root, relative));
    } else if (TEST_FILE_RE.test(entry.name)) {
      found.push(relative);
    }
  }
  return found.sort();
}

/**
 * A workflow's `on:` block, which is everything before the first top-level
 * `jobs:` key. A workflow with neither `pull_request` nor `merge_group` runs on
 * a schedule or by hand, so a red suite there does not block a merge — worth
 * counting separately rather than lumping in with the gating set.
 */
function isPullRequestTriggered(source) {
  const trigger = source.split(/\n(?=jobs:)/)[0];
  return /^\s{0,4}(?:pull_request|merge_group):/m.test(trigger);
}

/**
 * `- run: …` is a legal one-line step and the imported extractor only matches
 * `run:` at the start of a line, so the sequence marker is folded away first.
 * One such step exists in this repository today and it runs `npm ci`, so the
 * number does not move — but a Jest step written that way would have been
 * invisible, which is the failure mode being measured.
 */
function foldCompactRunSteps(source) {
  return source.replace(/^(\s*)-\s+run:/gm, "$1  run:");
}

function readWorkflows(root) {
  const directory = path.join(root, ".github", "workflows");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort()
    .map((name) => {
      const source = readFileSync(path.join(directory, name), "utf8");
      return {
        workflow: `.github/workflows/${name}`,
        pullRequest: isPullRequestTriggered(source),
        commands: extractWorkflowRunCommands(foldCompactRunSteps(source)),
      };
    });
}

/**
 * Jest invocations inside a script file, as narrowly as they can be identified.
 * Three shapes, and nothing else:
 *
 *   1. a bracketed argument list carrying `jest` as an element —
 *      `spawnSync("npx", ["jest", "src/…"])`, and the ECL gate's `command:` arrays;
 *   2. a quoted string that *begins* with the runner and has an argument —
 *      `execSync("npx jest src/…")`;
 *   3. in a shell script only, a line where the runner sits in command position.
 *
 * Each exclusion is there because something in this repository would otherwise
 * be misread. A bare line scan over JavaScript reports `jest.status !== 0` and
 * `// jest reads a bare pattern as a regex` as invocations. An unanchored string
 * match credits `"Pass: \`npx jest src/…\`"` — a release-record snippet a
 * verifier asserts on — as a run of that suite, which would *under*-state the
 * gap. And a literal of `'npx jest'` with no argument, which one audit compares
 * workflow lines against, cannot run anything.
 */
function jestInvocationsInScript(source, scriptPath) {
  const invocations = [];

  for (const match of source.matchAll(/\[([^[\]]*)\]/g)) {
    const inner = normalize(match[1]);
    if (/(?:^|[\s"'`,])jest(?:$|[\s"'`,])/.test(inner)) invocations.push(inner);
  }

  for (const match of source.matchAll(/(["'`])([^"'`\n]*)\1/g)) {
    const literal = normalize(match[2]);
    if (/^(?:npx\s+)?jest\s+\S/.test(literal)) invocations.push(literal);
  }

  if (scriptPath.endsWith(".sh")) {
    for (const line of source.split(/\r?\n/)) {
      const normalized = normalize(line);
      if (
        /(?:^|[;&|(]|\bif\s|\bthen\s|\belif\s|\bdo\s|&&|\|\|)\s*(?:npx\s+)?jest\s+\S/.test(
          normalized,
        )
      ) {
        invocations.push(normalized);
      }
    }
  }

  return [...new Set(invocations)];
}

function jsonPathArguments(root, command) {
  const paths = [];
  for (const match of command.matchAll(/\b((?:docs|config)\/[\w./-]+\.json)\b/g)) {
    const absolute = path.join(root, match[1]);
    if (!existsSync(absolute)) continue;
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(absolute, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(parsed?.paths)) continue;
    for (const candidate of parsed.paths) {
      if (typeof candidate === "string" && candidate.startsWith("src/")) {
        paths.push({ source: match[1], declared: candidate });
      }
    }
  }
  return paths;
}

/**
 * Every command a workflow reaches, each tagged with the workflow it came from
 * and whether that workflow gates a pull request. Hops: workflow run step →
 * npm script (recursive) → repo script file → ratchet baseline JSON.
 */
export function collectReachableCommands(root, packageScripts) {
  const reachable = [];
  const indeterminate = [];
  const scriptsSeen = new Set();

  for (const { workflow, pullRequest, commands } of readWorkflows(root)) {
    const expanded = expandWorkflowCommands(commands, packageScripts).map(normalize);

    for (const command of expanded) {
      if (RUNNER_RE.test(command)) {
        reachable.push({ via: "command", source: workflow, pullRequest, command });
      }

      for (const reference of command.matchAll(SCRIPT_REFERENCE_RE)) {
        const scriptPath = reference[1];
        const absolute = path.join(root, scriptPath);
        if (!existsSync(absolute)) continue;

        const ratchetPaths =
          scriptPath === RATCHET_SCRIPT ? jsonPathArguments(root, command) : [];
        for (const { source, declared } of ratchetPaths) {
          reachable.push({
            via: "ratchet-baseline",
            source: `${scriptPath} ← ${source}`,
            pullRequest,
            command: declared,
          });
        }

        // A script's Jest calls are the same whichever workflow reaches it, but
        // whether they gate a pull request is not, so the scan is repeated per
        // trigger class rather than once per file.
        const key = `${scriptPath}::${pullRequest}::${ratchetPaths.length > 0}`;
        if (scriptsSeen.has(key)) continue;
        scriptsSeen.add(key);

        const source = readFileSync(absolute, "utf8");
        for (const invocation of jestInvocationsInScript(source, scriptPath)) {
          const namesAPath = /(?:^|[\s"'`,[(])src\//.test(invocation);
          if (namesAPath) {
            reachable.push({
              via: "script-file",
              source: scriptPath,
              pullRequest,
              command: invocation,
            });
            continue;
          }
          // The ratchet's own spawn line is `["jest", ...paths, …]`; its paths
          // were just resolved from the baseline, so it is not unresolved.
          if (
            scriptPath === RATCHET_SCRIPT &&
            invocation.includes(RATCHET_SPREAD) &&
            ratchetPaths.length > 0
          ) {
            continue;
          }
          indeterminate.push({ source: scriptPath, invocation });
        }
      }
    }
  }

  return {
    reachable,
    indeterminate: [
      ...new Map(
        indeterminate.map((entry) => [
          `${entry.source}::${entry.invocation}`,
          entry,
        ]),
      ).values(),
    ].sort((a, b) =>
      `${a.source}${a.invocation}`.localeCompare(`${b.source}${b.invocation}`),
    ),
  };
}

function coverageFor(testPath, reachable) {
  const candidates = registrationCandidates(testPath);
  const hits = reachable.filter((entry) =>
    candidates.some((candidate) => commandNamesPath(entry.command, candidate)),
  );
  return {
    covered: hits.length > 0,
    pullRequestCovered: hits.some((entry) => entry.pullRequest),
    via: [...new Set(hits.map((entry) => entry.via))].sort(),
  };
}

export function buildCensus(root) {
  const packageScripts =
    JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).scripts ??
    {};
  const { reachable, indeterminate } = collectReachableCommands(
    root,
    packageScripts,
  );
  const testFiles = collectTestFiles(root);

  const directories = new Map();
  let covered = 0;
  let pullRequestCovered = 0;

  for (const testFile of testFiles) {
    const result = coverageFor(testFile, reachable);
    if (result.covered) covered += 1;
    if (result.pullRequestCovered) pullRequestCovered += 1;

    const directory = path.posix.dirname(testFile);
    if (!directories.has(directory)) {
      directories.set(directory, { testFiles: 0, covered: 0, via: new Set() });
    }
    const entry = directories.get(directory);
    entry.testFiles += 1;
    if (result.covered) entry.covered += 1;
    for (const via of result.via) entry.via.add(via);
  }

  const rows = [...directories.entries()]
    .map(([directory, entry]) => ({
      directory,
      testFiles: entry.testFiles,
      coveredTestFiles: entry.covered,
      via: [...entry.via].sort(),
    }))
    .sort(
      (a, b) =>
        b.testFiles - a.testFiles || a.directory.localeCompare(b.directory),
    );

  const uncoveredDirectories = rows.filter((row) => row.coveredTestFiles === 0);
  const partialDirectories = rows.filter(
    (row) => row.coveredTestFiles > 0 && row.coveredTestFiles < row.testFiles,
  );

  return {
    subject:
      "every Jest test file under src/, against the commands GitHub workflows reach",
    method: [
      "A test file counts as covered when a workflow reaches a command naming it or a directory above it.",
      "Four hops are followed: workflow run step, npm script (recursively), repo script file, test-ratchet baseline JSON.",
      "pullRequestCovered counts only workflows triggered by pull_request or merge_group, i.e. the set that can block a merge.",
      "While indeterminateInvocations is non-empty, uncoveredTestFiles is an upper bound.",
      "No timestamp is recorded, so refreshing this file on an unchanged tree is a no-op.",
    ],
    counts: {
      testFiles: testFiles.length,
      coveredTestFiles: covered,
      pullRequestCoveredTestFiles: pullRequestCovered,
      uncoveredTestFiles: testFiles.length - covered,
      directoriesWithTests: rows.length,
      directoriesFullyCovered: rows.filter(
        (row) => row.coveredTestFiles === row.testFiles,
      ).length,
      directoriesPartiallyCovered: partialDirectories.length,
      directoriesUncovered: uncoveredDirectories.length,
      indeterminateInvocations: indeterminate.length,
    },
    indeterminateInvocations: indeterminate,
    partiallyCoveredDirectories: partialDirectories,
    uncoveredDirectories,
  };
}

function summarize(census) {
  const c = census.counts;
  const lines = [
    `test-ci-coverage-census: ${c.testFiles} Jest test files under src/`,
    `  run by a workflow:              ${c.coveredTestFiles}`,
    `  run by a pull-request workflow: ${c.pullRequestCoveredTestFiles}`,
    `  run by no workflow:             ${c.uncoveredTestFiles}`,
    `  directories with tests:         ${c.directoriesWithTests} (${c.directoriesFullyCovered} fully covered, ${c.directoriesPartiallyCovered} partial, ${c.directoriesUncovered} uncovered)`,
  ];
  if (c.indeterminateInvocations > 0) {
    lines.push(
      `  unresolved Jest invocations:    ${c.indeterminateInvocations} — uncovered count is an upper bound`,
    );
    for (const entry of census.indeterminateInvocations) {
      lines.push(`    ${entry.source}: ${entry.invocation}`);
    }
  }
  return lines.join("\n");
}

/**
 * Write only when the content differs. A verification command that dirties the
 * tree it is verifying sends unrelated churn into whatever PR is open, which is
 * a defect this repository has already paid for twice.
 */
function writeIfChanged(absolutePath, contents) {
  if (existsSync(absolutePath) && readFileSync(absolutePath, "utf8") === contents) {
    return false;
  }
  writeFileSync(absolutePath, contents);
  return true;
}

function main() {
  const argv = process.argv.slice(2);
  const census = buildCensus(REPO_ROOT);

  if (argv.includes("--write")) {
    const target = path.join(REPO_ROOT, CENSUS_RELATIVE_PATH);
    const changed = writeIfChanged(target, `${JSON.stringify(census, null, 2)}\n`);
    console.log(
      changed
        ? `test-ci-coverage-census: updated ${CENSUS_RELATIVE_PATH}`
        : `test-ci-coverage-census: ${CENSUS_RELATIVE_PATH} already current`,
    );
  }

  console.log(argv.includes("--json") ? JSON.stringify(census, null, 2) : summarize(census));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
