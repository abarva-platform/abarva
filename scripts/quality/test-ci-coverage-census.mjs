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

import {
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
  writeFileSync,
} from "node:fs";
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
const CONTROL_CATALOG_RELATIVE_PATH =
  "docs/security/ai-surface-control-catalog.json";

const TEST_FILE_RE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const SKIP_DIRECTORIES = new Set(["node_modules", "__snapshots__", "fixtures"]);
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

const APPROVAL_OR_LIFECYCLE_PATH_RE =
  /(?:approval|approve|reject|send[-_]?back|lifecycle|phase[-_]?gate|advance|award|submit|transition|external[-_]?action)/i;
const APPROVAL_OR_LIFECYCLE_SOURCE_RE =
  /\b(?:approve|reject|sendBack|advancePhase|transition|award|submitForApproval|requestApproval|createDecision|recordDecision)\s*\(/;
const TENANT_RESOLVER_SOURCE_RE =
  /\b(?:requireTenancy|resolveTenant|canAccessTenant|getActiveClient|assertTenant)\s*\(/;
const TENANT_KEY_SOURCE_RE =
  /\b(?:tenantKey|clientKey|requestedClientKey|tenant_key|client_key)\b/;
const TENANT_READ_PATH_RE =
  /(?:read|query|queries|adapter|route|repository|lookup|search|fetch)/i;

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

function resolveSourceModule(root, importer, specifier) {
  let base;
  if (specifier.startsWith("@/")) {
    base = path.join(root, "src", specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(path.join(root, importer)), specifier);
  } else {
    return null;
  }

  const candidates = [base];
  for (const extension of SOURCE_EXTENSIONS) candidates.push(`${base}${extension}`);
  for (const extension of SOURCE_EXTENSIONS) {
    candidates.push(path.join(base, `index${extension}`));
  }

  for (const candidate of candidates) {
    if (!existsSync(candidate) || !statSync(candidate).isFile()) continue;
    const relative = normalize(path.relative(root, candidate));
    if (!relative.startsWith("src/")) continue;
    if (TEST_FILE_RE.test(relative)) continue;
    return relative;
  }
  return null;
}

/**
 * A type-only import is erased before the test runs, so the test never loads the
 * module and never exercises anything declared on it. Counting one as a product
 * edge is how `src/components/source/canvas/__tests__` came to carry the control
 * id `agent-dock-chat-turns`: the only thing joining it to `AgentDock.tsx` was
 * `import type { ChatMessage }`. The conclusion happened to be right there, but
 * a risk ranking that a borrowed type name can inflate will eventually send
 * someone to the wrong directory first.
 *
 * Three forms are erasable and are stripped before specifiers are read:
 * `import type … from "m"`, `export type … from "m"`, and a brace list whose
 * every specifier carries the inline `type` keyword. A brace list with one value
 * specifier among the types is NOT erasable — the module is loaded for that one
 * binding — so it is left in place.
 */
const TYPE_ONLY_STATEMENT_RE =
  /\b(?:import|export)\s+type\s[^;'"]*?\bfrom\s*["'][^"']+["']/g;
/**
 * A bare side-effect import — `import "../route";` — loads the module and runs
 * it, so it is a product edge in exactly the way a named import is. It carries
 * no `from`, so the specifier pattern below never saw it: a directory whose
 * only edge to a governed module took that form scored zero and banded
 * `unclassified`. That under-states governed risk, which is the dangerous
 * direction for a ranking whose job is to say where to look first.
 *
 * Anchored to the start of a line deliberately. This file's own header records
 * why the census refuses to credit a path a reachable script merely mentions,
 * and an unanchored `import\s*["']` would credit the word `import` followed by
 * a quoted path anywhere in the file — prose in a comment included. A statement
 * that does not begin its line is missed instead, which is the safe direction.
 */
const SIDE_EFFECT_IMPORT_RE = /^[ \t]*import\s*["']([^"']+)["']/gm;

const BRACED_IMPORT_RE =
  /\b(?:import|export)\s*\{([^}]*)\}\s*from\s*["'][^"']+["']/g;

function stripErasableImports(source) {
  return source
    .replace(TYPE_ONLY_STATEMENT_RE, " ")
    .replace(BRACED_IMPORT_RE, (statement, specifierList) => {
      const specifiers = specifierList
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      if (specifiers.length === 0) return statement;
      return specifiers.every((entry) => /^type\s+\S/.test(entry)) ? " " : statement;
    });
}

function importedProductSources(root, testFile) {
  const source = stripErasableImports(readFileSync(path.join(root, testFile), "utf8"));
  const specifiers = [];
  for (const match of source.matchAll(
    /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["']([^"']+)["']/g,
  )) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(SIDE_EFFECT_IMPORT_RE)) {
    specifiers.push(match[1]);
  }

  const inferred = testFile
    .replace("/__tests__/", "/")
    .replace(/\.(?:test|spec)\.[cm]?[jt]sx?$/, "");
  const sources = new Set();
  for (const specifier of specifiers) {
    const resolved = resolveSourceModule(root, testFile, specifier);
    if (resolved) sources.add(resolved);
  }
  for (const extension of SOURCE_EXTENSIONS) {
    const candidate = `${inferred}${extension}`;
    if (existsSync(path.join(root, candidate))) sources.add(candidate);
  }
  return [...sources].sort();
}

function controlPaths(root) {
  const absolute = path.join(root, CONTROL_CATALOG_RELATIVE_PATH);
  if (!existsSync(absolute)) return new Map();
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(absolute, "utf8"));
  } catch {
    return new Map();
  }
  const byPath = new Map();
  for (const control of parsed?.controls ?? []) {
    if (typeof control?.path !== "string" || typeof control?.id !== "string") {
      continue;
    }
    const ids = byPath.get(control.path) ?? [];
    ids.push(control.id);
    byPath.set(control.path, ids.sort());
  }
  return byPath;
}

function governedRiskForDirectory(root, testFiles, catalogPaths) {
  const productSources = [
    ...new Set(testFiles.flatMap((testFile) => importedProductSources(root, testFile))),
  ].sort();
  const controlIds = [
    ...new Set(productSources.flatMap((sourcePath) => catalogPaths.get(sourcePath) ?? [])),
  ].sort();
  const approvalSources = [];
  const tenantReadSources = [];

  for (const sourcePath of productSources) {
    const source = readFileSync(path.join(root, sourcePath), "utf8");
    if (
      APPROVAL_OR_LIFECYCLE_PATH_RE.test(sourcePath) ||
      APPROVAL_OR_LIFECYCLE_SOURCE_RE.test(source)
    ) {
      approvalSources.push(sourcePath);
    }
    if (
      TENANT_RESOLVER_SOURCE_RE.test(source) ||
      (TENANT_READ_PATH_RE.test(sourcePath) && TENANT_KEY_SOURCE_RE.test(source))
    ) {
      tenantReadSources.push(sourcePath);
    }
  }

  const signals = [];
  if (controlIds.length > 0) signals.push("declared_ai_surface_control");
  if (approvalSources.length > 0) signals.push("approval_or_lifecycle_write");
  if (tenantReadSources.length > 0) signals.push("tenant_scoped_read");

  const score =
    (controlIds.length > 0 ? 1000 : 0) +
    (approvalSources.length > 0 ? 100 : 0) +
    (tenantReadSources.length > 0 ? 10 : 0);
  const band =
    controlIds.length > 0 || approvalSources.length > 0
      ? "critical"
      : tenantReadSources.length > 0
        ? "high"
        : "unclassified";

  return {
    score,
    band,
    signals,
    ...(controlIds.length > 0 ? { controlIds } : {}),
    ...(approvalSources.length > 0
      ? {
          approvalOrLifecycleSourceCount: approvalSources.length,
          approvalOrLifecycleSources: approvalSources.slice(0, 5),
        }
      : {}),
    ...(tenantReadSources.length > 0
      ? {
          tenantScopedReadSourceCount: tenantReadSources.length,
          tenantScopedReadSources: tenantReadSources.slice(0, 5),
        }
      : {}),
  };
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
        commands: extractWorkflowRunCommands(source),
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
  const catalogPaths = controlPaths(root);

  const directories = new Map();
  let covered = 0;
  let pullRequestCovered = 0;

  for (const testFile of testFiles) {
    const result = coverageFor(testFile, reachable);
    if (result.covered) covered += 1;
    if (result.pullRequestCovered) pullRequestCovered += 1;

    const directory = path.posix.dirname(testFile);
    if (!directories.has(directory)) {
      directories.set(directory, {
        testFiles: 0,
        covered: 0,
        via: new Set(),
        testPaths: [],
      });
    }
    const entry = directories.get(directory);
    entry.testFiles += 1;
    entry.testPaths.push(testFile);
    if (result.covered) entry.covered += 1;
    for (const via of result.via) entry.via.add(via);
  }

  const rows = [...directories.entries()]
    .map(([directory, entry]) => ({
      directory,
      testFiles: entry.testFiles,
      coveredTestFiles: entry.covered,
      unrunTestFiles: entry.testFiles - entry.covered,
      via: [...entry.via].sort(),
      governedRisk: governedRiskForDirectory(
        root,
        entry.testPaths,
        catalogPaths,
      ),
    }))
    .sort(
      (a, b) =>
        b.testFiles - a.testFiles || a.directory.localeCompare(b.directory),
    );

  // Rank on files no workflow runs, not on whether the directory has any
  // covered file at all. Filtering on `coveredTestFiles === 0` made a
  // directory with one covered file of eighty rank below an empty one with
  // two, and in practice excluded every partially covered directory from the
  // queue this ranking exists to order — 257 unrun files across 22
  // directories, none of them visible here, at the time this changed.
  const governedRiskRows = rows
    .filter((row) => row.unrunTestFiles > 0)
    .filter((row) => row.governedRisk.score > 0)
    .sort(
      (a, b) =>
        b.governedRisk.score - a.governedRisk.score ||
        b.unrunTestFiles - a.unrunTestFiles ||
        a.directory.localeCompare(b.directory),
    )
    .map((row, index) => ({
      ...row,
      governedRisk: { ...row.governedRisk, rank: index + 1 },
    }));
  const governedRiskRanking = governedRiskRows.map((row) => ({
    directory: row.directory,
    testFiles: row.testFiles,
    unrunTestFiles: row.unrunTestFiles,
    governedRisk: {
      score: row.governedRisk.score,
      band: row.governedRisk.band,
      signals: row.governedRisk.signals,
      rank: row.governedRisk.rank,
    },
  }));
  const governedRiskEvidence = governedRiskRows
    .slice(0, 25)
    .map((row) => ({
      directory: row.directory,
      testFiles: row.testFiles,
      unrunTestFiles: row.unrunTestFiles,
      governedRisk: row.governedRisk,
    }));
  const uncoveredDirectories = rows
    .filter((row) => row.coveredTestFiles === 0)
    .map(({ governedRisk: _governedRisk, unrunTestFiles: _unrun, ...row }) => row);
  const partialDirectories = rows.filter(
    (row) => row.coveredTestFiles > 0 && row.coveredTestFiles < row.testFiles,
  );
  // The ranking's denominator: every directory holding a file no workflow
  // runs, partial and uncovered alike. Without it `unclassifiedRiskDirectories`
  // is a subtraction with an unprinted minuend.
  const directoriesWithUnrunTestFiles = rows.filter(
    (row) => row.unrunTestFiles > 0,
  );

  return {
    subject:
      "every Jest test file under src/, against the commands GitHub workflows reach",
    method: [
      "A test file counts as covered when a workflow reaches a command naming it or a directory above it.",
      "Four hops are followed: workflow run step, npm script (recursively), repo script file, test-ratchet baseline JSON.",
      "pullRequestCovered counts only workflows triggered by pull_request or merge_group, i.e. the set that can block a merge.",
      "While indeterminateInvocations is non-empty, uncoveredTestFiles is an upper bound.",
      "Every directory holding a file no workflow runs is ranked by governed-surface risk: declared AI controls, approval or lifecycle writes, then tenant-scoped reads; the count of unrun files is only a tie-breaker.",
      "Governed-risk signals come from product modules a test loads at runtime, not from directory names alone; type-only imports are erased before the test runs and are not counted as edges.",
      "Evidence source lists for the top 25 governed-risk directories are sorted and capped at five paths per signal; companion counts preserve the full match cardinality.",
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
      directoriesWithUnrunTestFiles: directoriesWithUnrunTestFiles.length,
      indeterminateInvocations: indeterminate.length,
      criticalGovernedRiskDirectories: governedRiskRanking.filter(
        (row) => row.governedRisk.band === "critical",
      ).length,
      highGovernedRiskDirectories: governedRiskRanking.filter(
        (row) => row.governedRisk.band === "high",
      ).length,
      unclassifiedRiskDirectories:
        directoriesWithUnrunTestFiles.length - governedRiskRanking.length,
    },
    indeterminateInvocations: indeterminate,
    partiallyCoveredDirectories: partialDirectories.map(
      ({ governedRisk: _governedRisk, unrunTestFiles: _unrun, ...row }) => row,
    ),
    governedRiskRanking,
    governedRiskEvidence,
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
    `  directories with unrun tests:   ${c.directoriesWithUnrunTestFiles}`,
    `  governed risk among them:       ${c.criticalGovernedRiskDirectories} critical, ${c.highGovernedRiskDirectories} high`,
  ];
  if (c.indeterminateInvocations > 0) {
    lines.push(
      `  unresolved Jest invocations:    ${c.indeterminateInvocations} — uncovered count is an upper bound`,
    );
    for (const entry of census.indeterminateInvocations) {
      lines.push(`    ${entry.source}: ${entry.invocation}`);
    }
  }
  const governedHead = census.governedRiskRanking.slice(0, 5);
  if (governedHead.length > 0) {
    lines.push("  top governed-risk directories by unrun tests:");
    for (const row of governedHead) {
      lines.push(
        `    ${row.governedRisk.rank}. ${row.directory} (${row.governedRisk.band}; ${row.unrunTestFiles} unrun of ${row.testFiles} tests; ${row.governedRisk.signals.join(", ")})`,
      );
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

/**
 * How far the committed census has drifted from what this run measures.
 *
 * Refreshing the census is manual by a recorded decision: it is a measurement
 * with no failure path, and `--write` belongs to whoever is re-measuring
 * rather than to a PR check. The cost of that choice was invisible, and it
 * compounds — the committed file is the input to which directory gets wired
 * next, so a lag mis-ranks that queue, and nobody sees the lag until someone
 * regenerates and finds the rank-1 entry inside an 800-line diff.
 *
 * Printing the drift costs nothing and does not enforce anything. It also
 * answers the question that has to come before enforcement: whether a check
 * that fails on disagreement would fire on every unrelated PR that adds a
 * test, or only when the file is genuinely stale. Enforce first and you learn
 * that by being wrong in public.
 */
function describeDrift(measured, committedPath) {
  if (!existsSync(committedPath)) {
    return { state: "absent", line: `no committed census at ${CENSUS_RELATIVE_PATH}` };
  }

  let committed;
  try {
    committed = JSON.parse(readFileSync(committedPath, "utf8"));
  } catch (error) {
    return {
      state: "unreadable",
      line: `committed census could not be parsed: ${error.message}`,
    };
  }

  // The counts live under `counts`, not at the top level. The first draft of
  // this compared `committed.coveredTestFiles` against the same name on the
  // measured object — both `undefined` — found no difference, and printed
  // "committed census matches this run" against a file that was 75 files
  // stale. A drift report that cannot fail is worse than none, because it is
  // read as assurance. So the fields are resolved explicitly and a missing one
  // is reported rather than skipped.
  const FIELDS = ["testFiles", "coveredTestFiles", "uncoveredTestFiles"];
  const before = committed?.counts ?? {};
  const after = measured?.counts ?? {};

  const unreadable = FIELDS.filter(
    (f) => typeof before[f] !== "number" || typeof after[f] !== "number",
  );
  if (unreadable.length > 0) {
    return {
      state: "unreadable",
      line:
        `cannot compare ${unreadable.join(", ")} — the census shape changed, so this report ` +
        "is not telling you whether the file is stale. Fix describeDrift before trusting it.",
    };
  }

  const deltas = [];
  for (const field of FIELDS) {
    if (before[field] !== after[field]) {
      const d = after[field] - before[field];
      deltas.push(`${field} ${before[field]} -> ${after[field]} (${d >= 0 ? "+" : ""}${d})`);
    }
  }

  if (deltas.length === 0) {
    return { state: "current", line: "committed census matches this run" };
  }
  return {
    state: "drifted",
    line: `committed census is STALE: ${deltas.join("; ")}`,
  };
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

  // Always reported, never enforced. `--write` has just made them agree, so
  // after a write this says so rather than repeating a stale number.
  const drift = describeDrift(census, path.join(REPO_ROOT, CENSUS_RELATIVE_PATH));
  if (!argv.includes("--json")) {
    console.log(`\ncensus drift: ${drift.line}`);
    if (drift.state === "drifted") {
      console.log(
        "  Refresh with: npm run audit:test-ci-coverage:write\n" +
          "  This is a report, not a gate. The committed file is the input to which\n" +
          "  directory gets wired next, so a stale one mis-ranks that queue.",
      );
    }
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();
