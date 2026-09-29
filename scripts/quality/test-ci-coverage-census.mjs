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

import { execFileSync } from "node:child_process";
import {
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TestPathPatterns } from "@jest/pattern";
import ts from "typescript";
import { isDirectInvocation } from "../exec/cli-entry.mjs";

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

function scriptKindFor(fileName) {
  const lowerFileName = fileName.toLowerCase();
  return lowerFileName.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : lowerFileName.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : /\.[cm]?ts$/.test(lowerFileName)
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS;
}

function parseScript(source, fileName) {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(fileName),
  );
}

function sourceWithoutNonExecutableSignalText(source, fileName) {
  const sourceFile = parseScript(source, fileName);
  const spans = [];

  const addCommentsAt = (position) => {
    for (const range of ts.getLeadingCommentRanges(source, position) ?? []) {
      spans.push([range.pos, range.end]);
    }
    for (const range of ts.getTrailingCommentRanges(source, position) ?? []) {
      spans.push([range.pos, range.end]);
    }
  };

  const visit = (node) => {
    addCommentsAt(node.getFullStart());
    addCommentsAt(node.getEnd());
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateLiteralToken(node) ||
      ts.isRegularExpressionLiteral(node) ||
      ts.isJsxText(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node)
    ) {
      spans.push([node.getStart(sourceFile), node.getEnd()]);
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isPromiseReject =
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === "Promise" &&
        callee.name.text === "reject";
      let isRejectCallback = false;
      if (ts.isIdentifier(callee) && callee.text === "reject") {
        for (let parent = node.parent; parent; parent = parent.parent) {
          if (ts.isFunctionLike(parent)) {
            isRejectCallback = parent.parameters.some(
              (parameter) =>
                ts.isIdentifier(parameter.name) && parameter.name.text === "reject",
            );
            if (isRejectCallback) break;
          }
        }
      }
      if (isPromiseReject || isRejectCallback) {
        spans.push([callee.getStart(sourceFile), callee.getEnd()]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const characters = [...source];
  for (const [start, end] of spans) {
    for (let index = start; index < end; index += 1) {
      if (characters[index] !== "\n" && characters[index] !== "\r") {
        characters[index] = " ";
      }
    }
  }
  return characters.join("");
}

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

/**
 * `scripts/audit/ai-surface-control-cases.mjs` has the same shape for the same
 * reason (item C-554): it spawns Jest with `...suites` spread from the AI
 * surface control catalog, so the suites are in that catalog and not in any
 * command line. Without this hop its invocation lands in
 * `indeterminateInvocations`, which twenty-eight behaviour suites assert is
 * zero — and, worse in the direction that matters, the 23 suites it genuinely
 * runs on every pull request would be credited to nobody.
 *
 * Named explicitly, on the same rule as the ratchet above: a general rule that
 * read test paths out of any JSON a script happens to mention would claim
 * coverage from files that have nothing to do with a test run. The paths are
 * read from the catalog's own `behavioralTest.path` fields rather than from a
 * second copy of that list kept here.
 */
const CONTROL_CASE_SCRIPT = "scripts/audit/ai-surface-control-cases.mjs";
const CONTROL_CASE_SPREAD = "...suites";
const CONTROL_CASE_CATALOG = "docs/security/ai-surface-control-catalog.json";

/**
 * A command that names a directory and then excludes a file inside it by name
 * does not run that file. Reading the directory and stopping there counts the
 * exclusion as covered — the over-stating direction, which is the one that
 * matters here: a quarantined suite then reads as run, and the queue this
 * census orders sends nobody to it.
 *
 * Every quarantine in this repository is held in JSON and turned into flags by
 * a small script the workflow calls inside `$( )`, so the patterns are never in
 * the command text. Re-deriving them from the JSON here would put a second copy
 * of that derivation in a second file, which is precisely how one contract ends
 * up with two readings that drift; the script is executed instead, which is the
 * same hop the shell takes when the workflow runs.
 *
 * Executing anything at all is a capability this file did not have, so it is
 * fenced: only a `$(node <path>)` substitution, only a path under `scripts/`,
 * only with no arguments of its own, only from a command a workflow already
 * reaches — the exact set a CI runner would execute anyway — and never through
 * a shell.
 */
const IGNORE_FLAG = "--testPathIgnorePatterns";
const IGNORE_SUBSTITUTION_RE =
  /\$\(\s*node\s+((?:src\/)?scripts\/[\w./-]+\.[cm]?js)\s*\)/g;
const IGNORE_SCRIPT_TIMEOUT_MS = 30_000;

/**
 * Whitespace only. `normalize` also rewrites `\` to `/`, which is right for a
 * path and destroys a regular expression: `excluded\.test\.ts$` becomes
 * `excluded/.test/.ts$`, matches nothing, and the subtraction silently does not
 * happen. Ignore patterns are therefore read from the raw command text.
 */
function collapseWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * The patterns a command passes to `--testPathIgnorePatterns`, with any
 * `$(node scripts/…)` substitution resolved by running it.
 *
 * A substitution that cannot be resolved is recorded rather than guessed at, on
 * the same rule as `indeterminateInvocations`: the command keeps the reading it
 * had before — covered — so a missing or failing script cannot quietly delete a
 * suite from the run set, and the recorded entry is what makes that
 * over-statement visible instead of silent.
 */
function ignorePatternsFor(root, command, unresolved) {
  let expanded = collapseWhitespace(command);
  for (const match of command.matchAll(IGNORE_SUBSTITUTION_RE)) {
    const [substitution, scriptPath] = match;
    const absolute = path.join(root, scriptPath);
    let output = null;
    let reason = "script not found";
    if (existsSync(absolute)) {
      try {
        output = execFileSync(process.execPath, [absolute], {
          cwd: root,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          timeout: IGNORE_SCRIPT_TIMEOUT_MS,
        });
      } catch (error) {
        reason = `script failed: ${error?.message ?? "unknown error"}`;
      }
    }
    if (output === null) {
      unresolved.push({ script: scriptPath, source: command, reason });
      continue;
    }
    expanded = expanded.replace(substitution, collapseWhitespace(output));
  }

  const tokens = expanded.split(" ");
  const patterns = [];
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index] !== IGNORE_FLAG) continue;
    // Jest reads every following token as a pattern until the next flag.
    for (let next = index + 1; next < tokens.length; next += 1) {
      if (tokens[next].startsWith("-")) break;
      const pattern = unquote(tokens[next]);
      if (pattern.length > 0) patterns.push(pattern);
    }
  }
  return patterns;
}

/**
 * Shell quoting removed, because this file reads command TEXT where the shell
 * reads command ARGUMENTS. `--testPathIgnorePatterns "foo$"` excludes `foo` at
 * run time — the shell strips the quotes before jest ever sees them — so a
 * census that keeps them compares a pattern that cannot match and reports the
 * excluded file as covered. That is the over-stating direction: a quarantined
 * suite reads as run, and the directory holding it drops out of the queue of
 * work this file exists to rank.
 *
 * Only a matched pair wrapping the WHOLE token is shell quoting. A quote in
 * the middle belongs to the regex, and stripping that would break patterns
 * that work today.
 */
function unquote(token) {
  if (token.length < 2) return token;
  const first = token[0];
  if (first !== '"' && first !== "'") return token;
  return token.endsWith(first) ? token.slice(1, -1) : token;
}

/**
 * Jest matches these patterns against an absolute test path. The patterns this
 * repository generates are suffix-anchored on a repo-relative fragment, so
 * matching them against the repo-relative path is the same decision; a pattern
 * that is not a valid regular expression is skipped rather than thrown on,
 * because the census is a measurement and a malformed quarantine entry is its
 * sibling checker's finding to report, not this one's to crash on.
 */
function ignoreMatches(pattern, testPath) {
  try {
    return new RegExp(pattern).test(testPath);
  } catch {
    return false;
  }
}

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
 * Every module specifier a test file loads at runtime.
 *
 * This was three regular expressions over source text, grown one branch at a
 * time as somebody noticed a form the previous branches missed. T-075 asked
 * for the gap to be bounded rather than enumerated, so the whole tree was
 * parsed with TypeScript's own scanner and the two readers compared over
 * 2,321 test files and 5,705 runtime edges.
 *
 * The result inverted the worry. The regexes missed **zero** runtime edges.
 * What they did instead was credit **608** specifiers that are not edges at
 * all, because a quoted module path inside an assertion looks exactly like a
 * quoted module path inside an import:
 *
 *     expect(pageSource).not.toContain('from "@/lib/active-client"');
 *
 * The census read that as the test importing `@/lib/active-client` -- from a
 * line asserting that the page must NOT import it. Over-crediting is the
 * dangerous direction here: this file ranks which directory to wire next, and
 * a directory looks covered when nothing actually imports the module. It also
 * contradicts this file's own rule, recorded in its header, that a path a
 * script merely mentions is not an edge.
 *
 * So the reader is the parser. An assertion string is not an import node, and
 * no fourth branch has to be invented the next time somebody writes a form
 * nobody anticipated.
 *
 * What is deliberately NOT counted:
 *
 *   type-only imports        erased at compile time, so nothing is loaded --
 *                            the same rule the regexes implemented, now
 *                            decided by the parser's own isTypeOnly flags
 *                            rather than by matching `type` in a brace list.
 *   jest.mock("m") targets   a mock loads nothing. It does name a module the
 *                            suite is exercising, and whether that should
 *                            count is a real question with 1,199 instances --
 *                            but it is a change in what the census MEANS, not
 *                            a reader fix, so it is left as it was and filed
 *                            rather than decided here.
 */
export function runtimeModuleSpecifiers(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );
  const specifiers = [];

  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      // No clause at all is a bare side-effect import: it loads and runs.
      const named = clause?.namedBindings;
      const erased =
        clause?.isTypeOnly === true ||
        (named !== undefined &&
          ts.isNamedImports(named) &&
          named.elements.length > 0 &&
          named.elements.every((element) => element.isTypeOnly));
      if (!erased && ts.isStringLiteral(node.moduleSpecifier)) {
        specifiers.push(node.moduleSpecifier.text);
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (!node.isTypeOnly && ts.isStringLiteral(node.moduleSpecifier)) {
        specifiers.push(node.moduleSpecifier.text);
      }
    } else if (ts.isCallExpression(node)) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteral(argument)) {
        const callee = node.expression;
        const isDynamicImport = callee.kind === ts.SyntaxKind.ImportKeyword;
        const isRequire =
          ts.isIdentifier(callee) && callee.escapedText === "require";
        if (isDynamicImport || isRequire) specifiers.push(argument.text);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

function importedProductSources(root, testFile) {
  const source = readFileSync(path.join(root, testFile), "utf8");
  const specifiers = runtimeModuleSpecifiers(source, testFile);

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

export function controlPaths(root) {
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

export function governedRiskForDirectory(root, testFiles, catalogPaths) {
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
    const executableSource = sourceWithoutNonExecutableSignalText(source, sourcePath);
    if (
      APPROVAL_OR_LIFECYCLE_PATH_RE.test(sourcePath) ||
      APPROVAL_OR_LIFECYCLE_SOURCE_RE.test(executableSource)
    ) {
      approvalSources.push(sourcePath);
    }
    if (
      TENANT_RESOLVER_SOURCE_RE.test(executableSource) ||
      (TENANT_READ_PATH_RE.test(sourcePath) &&
        TENANT_KEY_SOURCE_RE.test(executableSource))
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
    // Always present, including on a zero score, because a zero score means two
    // different things and this is the only field that separates them: a
    // directory whose product modules resolved and matched no signal is as
    // measured as this census gets, and a directory where nothing resolved is
    // not measured at all. Both used to print an identical `unclassified`
    // (T-758). Counted before the signal loop, so it reports what the resolver
    // reached rather than what the regexes then made of it.
    productSourceCount: productSources.length,
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

/**
 * A bare Jest path argument is a REGULAR EXPRESSION matched against the whole
 * path, not a directory prefix — so the reading above is wrong for one class of
 * command, and wrong in both directions.
 *
 * `src/app/(maestro)/home` is a capture group around `maestro`: Jest looks for
 * `src/app/maestro/home`, which is not in this tree, and selects nothing while
 * the literal reading credits every suite in the directory whose name is
 * spelled right there in the baseline. `src/__tests__/integration/tower` is
 * unanchored, so Jest also selects `…/tower-p6-handoff-panel.test.ts`, which
 * the literal reading called uncovered because the parent directory is not an
 * exact match. Item T-487; the over-crediting half is the one that matters,
 * because this census is the instrument the triage ranking is drawn from.
 *
 * Jest's own class does the matching rather than a second copy of its rules.
 * `TestPathPatterns` carries the case-insensitive flag, the `./foo` → `^foo`
 * rewrite, the path-separator substitution and the relative-then-absolute pair
 * of tests, and a re-implementation here would be a second reading of one
 * contract, free to drift from the runner it is supposed to describe. It is a
 * bare specifier, resolved from `node_modules` exactly as `@jest/globals` is in
 * `scripts/**` today.
 */
const jestPatternExecutors = new Map();
function jestPathPatternSelects(root, pattern, testPath) {
  const key = `${root}\u0000${pattern}`;
  let executor = jestPatternExecutors.get(key);
  if (executor === undefined) {
    executor = new TestPathPatterns([pattern]).toExecutor({ rootDir: root });
    jestPatternExecutors.set(key, executor);
  }
  // A pattern that is not a valid regex selects EVERYTHING, which is not the
  // guess it looks like: Jest prints "Invalid testPattern <p> supplied. Running
  // all tests instead." and does exactly that. Measured, because `false` was
  // written here first on the reasoning that a broken pattern runs nothing, and
  // a mutation of this line changed no count on a corpus where the branch is
  // unreachable — so the wrong answer would have shipped unopposed.
  //
  // Jest discards the whole pattern SET, so a baseline with one bad path runs
  // the repository. Reading one pattern at a time still lands on that answer,
  // because the bad pattern alone credits every file and the union cannot say
  // less; there is no arrangement of paths where the two readings differ.
  if (!executor.isValid()) return true;
  return executor.isMatch(path.join(root, testPath));
}

/**
 * Whether one reachable command runs one test file.
 *
 * Exported so a caller can ask the question the census asks, of the code the
 * census asks it with. Two readings live here and the entry says which one it
 * is: a command line names a path as a literal token, and a path spread into
 * Jest's argv is a pattern Jest matches.
 */
export function reachableEntrySelects(root, entry, testPath) {
  if (entry.jestPathPattern !== undefined) {
    return jestPathPatternSelects(root, entry.jestPathPattern, testPath);
  }
  return registrationCandidates(testPath).some((candidate) =>
    commandNamesPath(entry.command, candidate),
  );
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
        // Escapes intact: a `--testPathIgnorePatterns foo\.test\.ts$`
        // argument is a regular expression, and the path-normalising form turns
        // it into `foo/.test/.ts$`. Every path comparison below still runs on
        // the normalised form; only the ignore reader sees the raw text.
        commands: extractWorkflowRunCommands(source, { preserveEscapes: true }),
      };
    });
}

/**
 * Child-process functions. A runner token inside one of these calls is being
 * executed; the same token anywhere else is being talked about.
 */
const SPAWN_FUNCTIONS = new Set([
  "exec",
  "execFile",
  "execFileSync",
  "execSync",
  "fork",
  "spawn",
  "spawnSync",
]);

/**
 * Object properties that hold a command for something else to spawn. The
 * predeploy gate declares its checks as `{ key, command }` data and maps a
 * spawn over them, so its invocations are never written at a call site; a rule
 * that read only call arguments would lose every suite that gate runs.
 */
const COMMAND_PROPERTIES = new Set(["args", "argv", "cmd", "command", "commandLine"]);

/** The runner as an element of an argument array — `["jest", "src/…"]`. */
const RUNNER_ELEMENT_RE = /(?:^|[\s"'`,])jest(?:$|[\s"'`,])/;
/** The runner at the head of a whole command line — `npx jest src/…`. */
const RUNNER_COMMAND_LINE_RE = /^(?:npx\s+)?jest\s+\S/;
/** The runner with an argument, wherever it sits — used for mentions only. */
const RUNNER_ANYWHERE_RE = /(?:^|[\s"'`([{,])(?:npx\s+)?jest\s+\S/;
/** The runner in command position on a shell line. */
const RUNNER_SHELL_LINE_RE =
  /(?:^|[;&|(]|\bif\s|\bthen\s|\belif\s|\bdo\s|&&|\|\|)\s*(?:npx\s+)?jest\s+\S/;
/** A `src/` path, in the form the census credits coverage from. */
const NAMES_A_SOURCE_PATH_RE = /(?:^|[\s"'`,[(])src\//;

/** The callee's own name, whether it is bare or a property access. */
function calleeName(expression) {
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  if (ts.isIdentifier(expression)) return expression.text;
  return null;
}

function isSpawnCall(node) {
  if (!ts.isCallExpression(node)) return false;
  const name = calleeName(node.expression);
  return name !== null && SPAWN_FUNCTIONS.has(name);
}

/**
 * Nodes a command can be wrapped in without ceasing to be that command: array
 * nesting, a spread, parentheses, a type assertion, a ternary, a concatenation
 * or a template. Anything else ends the walk.
 */
function isTransparentWrapper(node) {
  return (
    ts.isArrayLiteralExpression(node) ||
    ts.isSpreadElement(node) ||
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isConditionalExpression(node) ||
    ts.isBinaryExpression(node) ||
    ts.isTemplateExpression(node) ||
    ts.isTemplateSpan(node)
  );
}

function propertyKeyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  return null;
}

/**
 * Whether this node is where a command gets handed to the operating system.
 * Three accepting positions, and the walk stops at the first node that is
 * neither one of them nor a transparent wrapper — so a command quoted in an
 * assertion, stored in a `reason` field, or written in a comment reaches none
 * of them.
 */
function isCommandPosition(node, spawnArgumentNames) {
  let current = node;
  for (let parent = current.parent; parent; parent = parent.parent) {
    if (ts.isCallExpression(parent)) {
      return parent.arguments.includes(current) && isSpawnCall(parent);
    }
    if (ts.isPropertyAssignment(parent)) {
      if (parent.initializer !== current) return false;
      const key = propertyKeyName(parent.name);
      return key !== null && COMMAND_PROPERTIES.has(key);
    }
    if (ts.isVariableDeclaration(parent)) {
      if (parent.initializer !== current) return false;
      return (
        ts.isIdentifier(parent.name) && spawnArgumentNames.has(parent.name.text)
      );
    }
    if (!isTransparentWrapper(parent)) return false;
    current = parent;
  }
  return false;
}

/** Every comment in a parsed file, as text. */
function commentTexts(source, sourceFile) {
  const seen = new Set();
  const texts = [];
  const add = (ranges) => {
    for (const range of ranges ?? []) {
      const key = `${range.pos}:${range.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      texts.push(source.slice(range.pos, range.end));
    }
  };
  const visit = (node) => {
    add(ts.getLeadingCommentRanges(source, node.getFullStart()));
    add(ts.getTrailingCommentRanges(source, node.getEnd()));
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return texts;
}

/**
 * Jest invocations inside a script file, separated from Jest invocations the
 * file merely talks about.
 *
 * T-727. This read source TEXT, and text cannot tell a command being run from
 * a command being quoted. One runner invocation written as data in a test
 * fixture was counted as real, could not be resolved to a directory, landed in
 * `indeterminateInvocations` — and twenty-five behaviour suites that assert
 * that count is zero went red on a census they do not own, with a message
 * naming none of them.
 *
 * The over-crediting direction was already live and masked.
 * `check-integration-root-quarantine.mjs` explains in a JSDoc paragraph that
 * naming a directory selects root files sharing its prefix, and spells an
 * invocation out to say so. That sentence was read as a run of that suite. It
 * did no damage only because a workflow line genuinely names the same
 * directory — which is the state in which a false credit is never found.
 *
 * So the cue is POSITION, not text. In JavaScript and TypeScript the file is
 * parsed and a runner token counts only from `isCommandPosition`; in a shell
 * script, which has no tree to walk, it counts only from command position on a
 * line, and a `#` comment is a comment.
 *
 * MENTIONS ARE RETURNED, NOT DROPPED. A position rule that wrongly demoted a
 * real invocation would take a suite out of the covered set and print the same
 * shape as before, so every declined match that names a `src/` path is carried
 * out of here and reported by the census. Silence would make the reverse
 * failure — the one that stops a suite being counted at all — invisible.
 *
 * Extraction collapses whitespace but preserves backslashes. Path matching is
 * normalized later; regex ignore arguments are read from this raw command text.
 */
export function jestInvocationsInScript(source, scriptPath) {
  if (scriptPath.endsWith(".sh")) return shellInvocations(source);

  const sourceFile = parseScript(source, scriptPath);

  // Pass one: names handed straight to a spawn, so that an argument array
  // bound to a `const` first is still recognised as one.
  const spawnArgumentNames = new Set();
  const collectSpawnArguments = (node) => {
    if (isSpawnCall(node)) {
      for (const argument of node.arguments) {
        if (ts.isIdentifier(argument)) spawnArgumentNames.add(argument.text);
      }
    }
    ts.forEachChild(node, collectSpawnArguments);
  };
  collectSpawnArguments(sourceFile);

  // Pass two: every node whose text carries the runner, with its span, so that
  // an outer array wrapping a matching inner one can be dropped.
  const candidates = [];
  const collectCandidates = (node) => {
    if (ts.isArrayLiteralExpression(node)) {
      const inner = collapseWhitespace(
        node.elements.map((element) => element.getText(sourceFile)).join(", "),
      );
      if (RUNNER_ELEMENT_RE.test(inner)) {
        candidates.push({
          node,
          text: inner,
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          array: true,
        });
      }
    } else if (ts.isStringLiteralLike(node)) {
      const literal = collapseWhitespace(node.text);
      if (RUNNER_COMMAND_LINE_RE.test(literal)) {
        candidates.push({
          node,
          text: literal,
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          array: false,
        });
      }
    } else if (ts.isTemplateExpression(node)) {
      const raw = node.getText(sourceFile);
      const literal = collapseWhitespace(raw.replace(/^`/, "").replace(/`$/, ""));
      if (RUNNER_COMMAND_LINE_RE.test(literal)) {
        candidates.push({
          node,
          text: literal,
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          array: false,
        });
      }
    }
    ts.forEachChild(node, collectCandidates);
  };
  collectCandidates(sourceFile);

  // An array of `{ command: [...] }` objects matches on the runner inside its
  // own element, so the outer array would be counted as a second invocation of
  // the same suites. Only the innermost matching array is read — the reading
  // the previous text scan arrived at by accident, its bracket class being
  // unable to span a nested pair.
  const innermost = candidates.filter(
    (candidate) =>
      !candidate.array ||
      !candidates.some(
        (other) =>
          other !== candidate &&
          other.array &&
          other.start >= candidate.start &&
          other.end <= candidate.end,
      ),
  );

  const commands = [];
  const mentions = [];
  for (const candidate of innermost) {
    if (isCommandPosition(candidate.node, spawnArgumentNames)) {
      commands.push(candidate.text);
    } else if (NAMES_A_SOURCE_PATH_RE.test(candidate.text)) {
      mentions.push(candidate.text);
    }
  }

  for (const comment of commentTexts(source, sourceFile)) {
    const text = collapseWhitespace(comment);
    if (!RUNNER_ANYWHERE_RE.test(text)) continue;
    if (!NAMES_A_SOURCE_PATH_RE.test(text)) continue;
    mentions.push(text);
  }

  return { commands: [...new Set(commands)], mentions: [...new Set(mentions)] };
}

/**
 * A shell script has no tree, so position is the line: the runner has to sit
 * where the shell would execute it. A `#` comment is a comment — one of them
 * carrying `&& jest src/…` matched the command-position rule through the `&&`.
 */
function shellInvocations(source) {
  const commands = [];
  const mentions = [];
  for (const line of source.split(/\r?\n/)) {
    const normalized = collapseWhitespace(line);
    if (!RUNNER_SHELL_LINE_RE.test(normalized)) continue;
    if (normalized.startsWith("#")) {
      if (NAMES_A_SOURCE_PATH_RE.test(normalized)) mentions.push(normalized);
      continue;
    }
    commands.push(normalized);
  }
  return { commands: [...new Set(commands)], mentions: [...new Set(mentions)] };
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
 * The suites `scripts/audit/ai-surface-control-cases.mjs` runs, read from the
 * control catalog it reads them from.
 *
 * Every credited control names the behavioral test that proves it; the script
 * spreads the distinct set of those paths into Jest. Reading the same field
 * here keeps one list, so a suite added to or removed from the catalog moves
 * this census in the same commit.
 */
function controlCaseSuites(root) {
  const absolute = path.join(root, CONTROL_CASE_CATALOG);
  if (!existsSync(absolute)) return [];
  let catalog;
  try {
    catalog = JSON.parse(readFileSync(absolute, "utf8"));
  } catch {
    return [];
  }
  const suites = new Set();
  for (const surface of catalog?.controls ?? []) {
    for (const control of surface?.requiredControls ?? []) {
      const declared = control?.behavioralTest?.path;
      if (typeof declared === "string" && declared.startsWith("src/")) suites.add(declared);
    }
  }
  return [...suites].sort().map((declared) => ({ source: CONTROL_CASE_CATALOG, declared }));
}

/**
 * Every command a workflow reaches, each tagged with the workflow it came from
 * and whether that workflow gates a pull request. Hops: workflow run step →
 * npm script (recursive) → repo script file → ratchet baseline JSON, or AI
 * surface control catalog.
 */
export function collectReachableCommands(root, packageScripts) {
  const reachable = [];
  const indeterminate = [];
  const mentioned = [];
  const unresolvedIgnoreArguments = [];
  const scriptsSeen = new Set();
  const ignoreCache = new Map();

  // One command can be reached from several workflows; its ignore scripts are
  // the same each time, so they are run once per distinct command line.
  const ignorePatterns = (command) => {
    if (!ignoreCache.has(command)) {
      ignoreCache.set(
        command,
        ignorePatternsFor(root, command, unresolvedIgnoreArguments),
      );
    }
    return ignoreCache.get(command);
  };

  for (const { workflow, pullRequest, commands } of readWorkflows(root)) {
    const expanded = expandWorkflowCommands(commands, packageScripts, {
      preserveEscapes: true,
    });

    for (const raw of expanded) {
      const command = normalize(raw);
      if (RUNNER_RE.test(command)) {
        reachable.push({
          via: "command",
          source: workflow,
          pullRequest,
          command,
          ignorePatterns: ignorePatterns(raw),
        });
      }

      for (const reference of command.matchAll(SCRIPT_REFERENCE_RE)) {
        const scriptPath = reference[1];
        const absolute = path.join(root, scriptPath);
        if (!existsSync(absolute)) continue;

        const ratchetPaths =
          scriptPath === RATCHET_SCRIPT
            ? jsonPathArguments(root, command)
            : scriptPath === CONTROL_CASE_SCRIPT
              ? controlCaseSuites(root)
              : [];
        const spreadVia =
          scriptPath === CONTROL_CASE_SCRIPT ? "control-case-catalog" : "ratchet-baseline";
        for (const { source, declared } of ratchetPaths) {
          reachable.push({
            via: spreadVia,
            source: `${scriptPath} ← ${source}`,
            pullRequest,
            command: declared,
            // The same string twice, deliberately. `command` is what the
            // census reports; `jestPathPattern` is the flag that says how it
            // must be READ — spread into Jest's argv, so a regex and not a
            // literal prefix. Carrying the reading on the entry keeps the
            // decision in one place instead of re-deriving `via` downstream.
            jestPathPattern: declared,
          });
        }

        // A script's Jest calls are the same whichever workflow reaches it, but
        // whether they gate a pull request is not, so the scan is repeated per
        // trigger class rather than once per file.
        const key = `${scriptPath}::${pullRequest}::${ratchetPaths.length > 0}`;
        if (scriptsSeen.has(key)) continue;
        scriptsSeen.add(key);

        const source = readFileSync(absolute, "utf8");
        const scanned = jestInvocationsInScript(source, scriptPath);
        for (const text of scanned.mentions) {
          mentioned.push({ source: scriptPath, mention: normalize(text) });
        }
        for (const rawInvocation of scanned.commands) {
          const invocation = normalize(rawInvocation);
          const namesAPath = /(?:^|[\s"'`,[(])src\//.test(invocation);
          if (namesAPath) {
            const scriptIgnorePatterns = ignorePatterns(rawInvocation);
            if (
              rawInvocation.includes(IGNORE_FLAG) &&
              scriptIgnorePatterns.length === 0
            ) {
              unresolvedIgnoreArguments.push({
                script: scriptPath,
                source: rawInvocation,
                reason: "ignore patterns inside this script invocation could not be parsed",
              });
            }
            reachable.push({
              via: "script-file",
              source: scriptPath,
              pullRequest,
              command: invocation,
              // Paths use the normalized command; regular expressions must
              // retain their escapes, so the ignore reader receives raw text.
              ignorePatterns: scriptIgnorePatterns,
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
          // Same reading for the control-case checker: its spawn line is
          // `["jest", "--runTestsByPath", ...suites, …]` and those suites were
          // just resolved from the catalog above, so it is not unresolved.
          if (
            scriptPath === CONTROL_CASE_SCRIPT &&
            invocation.includes(CONTROL_CASE_SPREAD) &&
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
    mentioned: [
      ...new Map(
        mentioned.map((entry) => [`${entry.source}::${entry.mention}`, entry]),
      ).values(),
    ].sort((a, b) =>
      `${a.source}${a.mention}`.localeCompare(`${b.source}${b.mention}`),
    ),
    unresolvedIgnoreArguments: [
      ...new Map(
        unresolvedIgnoreArguments.map((entry) => [
          `${entry.script}::${entry.source}`,
          entry,
        ]),
      ).values(),
    ].sort((a, b) => `${a.script}${a.source}`.localeCompare(`${b.script}${b.source}`)),
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

// T-551. The census EXECUTES NOTHING. It reads workflows and answers a
// reachability question over the whole tree in about four seconds, and that
// runtime is the proof rather than a claim about it.
//
// Two of the per-file fields name an execution, and both were assigned
// `result.covered` — three field names carrying one fact. `green: true`
// therefore meant "a workflow command reaches this file", and 78 files were
// published green having never been run. A run-status field that cannot report
// a covered-but-failing file cannot report the one thing such a field exists
// for, and the next drawer instructed to take work from these rows would skip
// the running step because the field already said green.
//
// So `green` is `"unknown"` for every file, with no exception: the census holds
// an execution outcome for none of them. `run` keeps the single execution fact
// the census does know — a file no reachable command selects cannot have
// executed in CI, so `false` there is true — and refuses the other direction,
// because selection is not execution. Neither field can ever claim a run or a
// pass, which is the fail-closed direction.
const EXECUTION_UNKNOWN = "unknown";

/**
 * A quarantine expressed by ENUMERATION, which the reading above cannot see.
 *
 * `excludedByNamingCommand` recognises exactly one shape: a command names a
 * directory and then subtracts a file inside it through its own
 * `--testPathIgnorePatterns`. That shape needs the command to NAME the file
 * before there is anything to subtract, so it can only ever be true where the
 * directory's default is INCLUDED.
 *
 * `src/__tests__/integration` inverts that default deliberately: its root files
 * are enumerated by exact path, because naming the directory would also select
 * every red subdirectory under it. A file left out of that enumeration is named
 * by nothing at all, so `named.length` is 0 and the file falls through to
 * `untriaged` — including a file that WAS triaged, declared in a repo-owned
 * list with a reason, an owner and a verdict, and re-run by a sibling checker
 * that fails if it passes. `untriagedUnrunTestFiles` is the sole input to
 * `governedRiskRanking`, so three such files were the entire reason one
 * directory sat at rank 1 of the critical band, and two backlog items drew work
 * from that rank before the mislabelling was measured (T-615).
 *
 * So the second shape is read here: a file DECLARED in a quarantine list,
 * whether or not any command names it.
 *
 * DISCOVERY IS A GLOB, NOT A LIST OF LISTS. A hardcoded set of list files is the
 * same blind spot one directory over — the item that found this named five lists
 * and `scripts/quality` holds seven. Every `*-quarantine.json` there is read,
 * and a list this function cannot resolve THROWS rather than being skipped: an
 * unreadable or unscoped quarantine would otherwise under-state triage in
 * silence, which is the failure mode this whole file exists against.
 *
 * SCOPE IS DECLARED, NEVER INFERRED. An entry names its suite by BASENAME and
 * the directory it belongs to lives in the sibling checker, not in the list. Two
 * cheaper bridges were measured and both are wrong. Resolving a basename against
 * the walked tree is ambiguous on this repository TODAY —
 * `ai-program-failure-modes.test.ts` exists under both
 * `src/lib/intelligence/__tests__` and `src/__tests__/integration/intelligence`
 * while one list declares it, and 40 basenames in the tree are non-unique — and
 * crediting the wrong file is the over-stating direction. Reading the checker's
 * own directory constant would be a text scan answering a syntax question. So
 * each list declares its scope, and a list that does not is a hard failure
 * rather than a quiet miss.
 */
const QUARANTINE_LIST_DIRECTORY = "scripts/quality";
const QUARANTINE_LIST_RE = /-quarantine\.json$/;
const QUARANTINE_ENTRY_KEY = "quarantined";
const QUARANTINE_SCOPE_KEY = "scope";

/**
 * The key that carries the scope for a given array of declarations. The primary
 * array is `quarantined` and its scope is plain `scope`; any sibling array of
 * suite names — `alsoIgnored` is the one in the tree today — carries its own,
 * because those entries are swept in from a DIFFERENT directory than the one the
 * list guards and a single scope would silently misplace them.
 */
function quarantineScopeKeyFor(arrayKey) {
  return arrayKey === QUARANTINE_ENTRY_KEY
    ? QUARANTINE_SCOPE_KEY
    : `${arrayKey}Scope`;
}

function quarantineSuiteOf(entry) {
  if (typeof entry === "string") return entry;
  if (entry !== null && typeof entry === "object" && typeof entry.suite === "string") {
    return entry.suite;
  }
  return null;
}

/**
 * Every quarantine declaration in the tree, as `{ list, key, scope, suite }`.
 *
 * Only an array whose entries carry suite names is a declaration: a list may
 * hold other arrays that describe clusters or batches, and demanding a scope
 * from those would be a false requirement. A MIXED array — some entries with a
 * suite name and some without — throws, because crediting the ones it can read
 * and dropping the rest is the silent under-statement again, one entry down.
 */
export function quarantineDeclarations(root) {
  const directory = path.join(root, QUARANTINE_LIST_DIRECTORY);
  if (!existsSync(directory)) return { lists: [], declarations: [] };
  const lists = [];
  const declarations = [];
  for (const name of readdirSync(directory).filter((entry) =>
    QUARANTINE_LIST_RE.test(entry),
  ).sort()) {
    const relative = `${QUARANTINE_LIST_DIRECTORY}/${name}`;
    lists.push(relative);
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(path.join(directory, name), "utf8"));
    } catch (error) {
      throw new Error(
        `${relative} is not readable JSON (${error?.message ?? "unknown error"}). ` +
          "The census cannot tell a triaged unrun file from an untriaged one while " +
          "a quarantine list is unreadable, so it reports neither.",
      );
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${relative} is not a JSON object.`);
    }
    for (const [key, value] of Object.entries(parsed)) {
      if (!Array.isArray(value) || value.length === 0) continue;
      const suites = value.map(quarantineSuiteOf);
      const named = suites.filter((suite) => suite !== null && suite.length > 0);
      if (named.length === 0) continue;
      if (named.length !== value.length) {
        throw new Error(
          `${relative} has ${value.length - named.length} of ${value.length} ` +
            `entries in "${key}" with no suite name. A mixed array would be ` +
            "credited in part and dropped in part, which is the silent " +
            "under-statement this reading exists to remove.",
        );
      }
      const scopeKey = quarantineScopeKeyFor(key);
      const scope = parsed[scopeKey];
      if (typeof scope !== "string" || scope.trim().length === 0) {
        throw new Error(
          `${relative} declares ${value.length} quarantined suite` +
            `${value.length === 1 ? "" : "s"} in "${key}" but no "${scopeKey}": ` +
            "the repository-relative directory those suite names belong to. Add " +
            "it. Basenames are not unique in this tree, so the census will not " +
            "guess which file an entry means.",
        );
      }
      for (const suite of named) {
        declarations.push({ list: relative, key, scope: normalize(scope), suite });
      }
    }
  }
  return { lists, declarations };
}

/**
 * The declared paths, resolved against the walked tree.
 *
 * An entry is read as an exact path under its scope first, which is what the
 * sibling checkers do. When no such file exists the entry is read as the regex
 * fragment the `*-ignore-args.mjs` scripts turn it into, matched ONLY against
 * files inside the declared scope — the same fence, so a fragment cannot reach
 * out of the directory its list guards.
 *
 * A declaration that resolves to nothing is recorded and credited to nobody. It
 * is a stale entry, and every one of these lists has a checker that re-runs its
 * entries and fails on a name that no longer exists; that finding belongs there
 * rather than here, and a census that threw on it would stop measuring over
 * somebody else's bookkeeping.
 */
export function declaredQuarantinePaths(root, testFiles) {
  const { lists, declarations } = quarantineDeclarations(root);
  const inTree = new Set(testFiles);
  const paths = new Set();
  // Seeded from the INVENTORY, so a list that declares nothing still gets a row.
  // An empty quarantine list is the strongest state of an enumeration carve-out,
  // not a missing one, and a summary that only counted declarations would drop
  // the one list this reading was written for.
  const byList = new Map(
    lists.map((list) => [
      list,
      { list, declaredSuites: 0, resolvedTestFiles: new Set(), unresolved: [] },
    ]),
  );
  for (const { list, key, scope, suite } of declarations) {
    const summary = byList.get(list);
    summary.declaredSuites += 1;
    const exact = `${scope}/${suite}`;
    const resolved = [];
    if (inTree.has(exact)) resolved.push(exact);
    else {
      for (const testFile of testFiles) {
        if (testFile.startsWith(`${scope}/`) && ignoreMatches(suite, testFile)) {
          resolved.push(testFile);
        }
      }
    }
    if (resolved.length === 0) summary.unresolved.push(`${key}:${exact}`);
    for (const testFile of resolved) {
      summary.resolvedTestFiles.add(testFile);
      paths.add(testFile);
    }
  }
  return {
    paths,
    lists: [...byList.values()]
      .map((summary) => ({
        list: summary.list,
        declaredSuites: summary.declaredSuites,
        resolvedTestFiles: [...summary.resolvedTestFiles].sort(),
        unresolvedDeclarations: summary.unresolved.sort(),
      }))
      .sort((a, b) => a.list.localeCompare(b.list)),
  };
}

function coverageFor(root, testPath, reachable, declaredQuarantinePathSet) {
  const named = reachable.filter((entry) =>
    reachableEntrySelects(root, entry, testPath),
  );
  const hits = named.filter(
    (entry) =>
      // Scoped to the command that passes them. A file one workflow excludes
      // and another runs in full is covered, and subtracting globally would
      // under-state the run set — the error this change exists to remove,
      // pointing the other way.
      !(entry.ignorePatterns ?? []).some((pattern) =>
        ignoreMatches(pattern, testPath),
      ),
  );
  // A file some command names and that same command then excludes by name has
  // been looked at: somebody wrote it into a quarantine list with a reason. A
  // file no command names at all has not. Both are equally "uncovered", and
  // reporting only that conflates triaged work with untriaged work — which is
  // how a draw from this census's own risk ranking came back with eleven of
  // twenty files already quarantined.
  const excludedByNamingCommand = hits.length === 0 && named.length > 0;
  // The second shape, and the reason it is a separate term rather than a wider
  // predicate: a file no command names can still have been triaged. See
  // `declaredQuarantinePaths`.
  const declaredInQuarantineList =
    hits.length === 0 && declaredQuarantinePathSet.has(testPath);
  return {
    covered: hits.length > 0,
    pullRequestCovered: hits.some((entry) => entry.pullRequest),
    collected: named.length > 0,
    declaredQuarantine: excludedByNamingCommand || declaredInQuarantineList,
    // WHICH shape credited the file. A count cannot tell them apart, and the
    // two are triaged by different evidence: one by a command that subtracts
    // the file, one by a list entry carrying a reason and an owner.
    declaredQuarantineShape: excludedByNamingCommand
      ? "excluded-by-naming-command"
      : declaredInQuarantineList
        ? "declared-in-quarantine-list"
        : null,
    via: [...new Set(hits.map((entry) => entry.via))].sort(),
  };
}

/**
 * A TRIAGE VERDICT, the third way a file can have been looked at (T-773).
 *
 * The two quarantine shapes above are read because they are declarations in
 * something a workflow or a checker executes. A verdict in a repo-owned
 * `docs/architecture/*triage*.json` record is neither, so until T-773 a file
 * carrying one — with a written reason and a named owning item — still counted
 * as untriaged and still admitted its directory to `governedRiskRanking`. The
 * ninth stale-suite draw (T-771) spent eleven of its twenty rows re-judging
 * exactly those files.
 *
 * `untriagedUnrunTestFiles` does NOT change. A verdict is a judgement, not a
 * command that runs the file; the uncovered/quarantine arithmetic other gates
 * read must not move because somebody wrote a JSON file. What changes is the
 * ranking's ADMISSION: it now reads `drawableUnrunTestFiles`, the untriaged
 * files a draw may still offer, and the rest are published as held, each with
 * its verdict, record and owner — so the owed work is a row, not an absence.
 *
 * WHICH VERDICTS HOLD — the decision T-773 asked to be written down. A verdict
 * holds a file out of the draw when it names residual work somebody owns:
 * `repair` and `rewrite_as_behavior` included. An owned file is not a finished
 * file, but a draw's job is to find files nobody has JUDGED; re-offering a
 * judged one buys a second verdict, not the repair, and the repair is tracked by
 * the item the verdict names. Three things stay drawable:
 *   - no verdict;
 *   - a COMPLETION verdict (`wired`, `rewritten_as_behavior_and_wired`,
 *     `already_selected_no_action`, `deleted_and_replaced`) on a file the census
 *     measures as unrun — the record says the work is done and the tree says it
 *     is not, so the verdict is contradicted and is published as such;
 *   - a verdict word not in either list. An unrecognised word cannot subtract
 *     work from the queue; it is published so the vocabulary gap is visible.
 *
 * LATEST WINS. Per path, the verdict with the greatest `recordedAt` (the suite's
 * own, else its record's) decides, as T-770's control already resolves it. A
 * record with no `recordedAt` sorts before every dated one, and on equal stamps
 * the later record file name wins, so the resolution is deterministic. A newer
 * record is therefore how a held file is released, and nothing holds forever.
 *
 * A record that does not parse is reported, not skipped and not fatal: this is
 * a work-order input, not a gate, and one malformed document must not take the
 * whole census down with it. A verdict naming a path the census does not walk is
 * reported too — it can never expire, because nothing re-reads it.
 */
const TRIAGE_RECORD_DIRECTORY = "docs/architecture";
const TRIAGE_RECORD_RE = /triage.*\.json$/;
const HOLDING_TRIAGE_VERDICTS = new Set([
  "wire_into_ci",
  "repair",
  "rewrite_as_behavior",
  "update_with_reason_recorded",
  "real",
  "vacuous_control_proof",
  "held_unwired",
  "already_verdicted_elsewhere",
]);
const COMPLETION_TRIAGE_VERDICTS = new Set([
  "wired",
  "rewritten_as_behavior_and_wired",
  "already_selected_no_action",
  "deleted_and_replaced",
]);

export function triageVerdicts(root) {
  const directory = path.join(root, TRIAGE_RECORD_DIRECTORY);
  const latest = new Map();
  const recordsByPath = new Map();
  const unreadableRecords = [];
  if (!existsSync(directory)) return { latest, recordsByPath, unreadableRecords };
  for (const file of readdirSync(directory).sort()) {
    if (!TRIAGE_RECORD_RE.test(file)) continue;
    const record = `${TRIAGE_RECORD_DIRECTORY}/${file}`;
    let payload;
    try {
      payload = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
    } catch {
      unreadableRecords.push(record);
      continue;
    }
    for (const suite of Array.isArray(payload?.suites) ? payload.suites : []) {
      if (typeof suite?.path !== "string") continue;
      const recordedAt = suite.recordedAt ?? payload.recordedAt ?? null;
      const candidate = {
        verdict: typeof suite.verdict === "string" ? suite.verdict : null,
        record,
        recordedAt: typeof recordedAt === "string" ? recordedAt : null,
        ownerItem:
          suite.ownerItem ?? suite.owningItemThere ?? suite.wiredBy ?? payload.item ?? null,
      };
      const held = latest.get(suite.path);
      // Files are visited in name order, so `>=` lets the later file win a tie.
      if (!held || (candidate.recordedAt ?? "") >= (held.recordedAt ?? "")) {
        latest.set(suite.path, candidate);
      }
      const records = recordsByPath.get(suite.path) ?? [];
      if (!records.includes(record)) records.push(record);
      recordsByPath.set(suite.path, records);
    }
  }
  return { latest, recordsByPath, unreadableRecords };
}

/** `held`, `contradicted`, `unrecognised` or `none` for an untriaged file. */
function triageDisposition(verdict) {
  if (!verdict || verdict.verdict === null) return "none";
  if (HOLDING_TRIAGE_VERDICTS.has(verdict.verdict)) return "held";
  if (COMPLETION_TRIAGE_VERDICTS.has(verdict.verdict)) return "contradicted";
  return "unrecognised";
}

/**
 * `includeUnrunPaths` adds `unrunTestPathsByDirectory` to the returned object.
 * It is OFF by default and the CLI turns it on only for `--explain`, which
 * never writes: the committed artifact must stay byte-identical, or `--check`
 * and the drift line fire on a change that measured nothing.
 *
 * The same reason is why the per-directory rows below strip the field back out
 * before they are published. Those two maps spread `...row`, so a field added
 * to a row reaches the artifact whether or not anyone intended it to.
 */
export function buildCensus(
  root,
  { includeUnrunPaths = false, includeFileStatuses = false } = {},
) {
  const packageScripts =
    JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).scripts ??
    {};
  const { reachable, indeterminate, mentioned, unresolvedIgnoreArguments } =
    collectReachableCommands(root, packageScripts);
  const testFiles = collectTestFiles(root);
  const catalogPaths = controlPaths(root);
  const { paths: declaredQuarantinePathSet, lists: quarantineLists } =
    declaredQuarantinePaths(root, testFiles);
  const verdicts = triageVerdicts(root);
  const walkedTestFiles = new Set(testFiles);
  const heldTestPaths = [];
  const contradictedVerdicts = [];
  const unrecognisedVerdicts = [];

  const directories = new Map();
  let covered = 0;
  let pullRequestCovered = 0;
  let declaredQuarantine = 0;

  for (const testFile of testFiles) {
    const result = coverageFor(
      root,
      testFile,
      reachable,
      declaredQuarantinePathSet,
    );
    if (result.covered) covered += 1;
    if (result.pullRequestCovered) pullRequestCovered += 1;

    const directory = path.posix.dirname(testFile);
    if (!directories.has(directory)) {
      directories.set(directory, {
        testFiles: 0,
        covered: 0,
        declaredQuarantine: 0,
        via: new Set(),
        testPaths: [],
        unrunPaths: [],
        verdictHeld: 0,
        drawablePaths: [],
        fileStatuses: [],
      });
    }
    const entry = directories.get(directory);
    entry.testFiles += 1;
    entry.testPaths.push(testFile);
    if (result.covered) entry.covered += 1;
    else entry.unrunPaths.push(testFile);
    if (result.declaredQuarantine) {
      entry.declaredQuarantine += 1;
      declaredQuarantine += 1;
    }
    const untriaged = !result.covered && !result.declaredQuarantine;
    const verdict = verdicts.latest.get(testFile) ?? null;
    const disposition = untriaged ? triageDisposition(verdict) : null;
    if (disposition === "held") {
      entry.verdictHeld += 1;
      heldTestPaths.push({ testPath: testFile, ...verdict });
    } else if (untriaged) {
      entry.drawablePaths.push(testFile);
      if (disposition === "contradicted") {
        contradictedVerdicts.push({ testPath: testFile, ...verdict });
      } else if (disposition === "unrecognised") {
        unrecognisedVerdicts.push({ testPath: testFile, ...verdict });
      }
    }
    entry.fileStatuses.push({
      directory,
      testPath: testFile,
      // `enumerated`, not `loaded`: this says the census walked the tree and
      // found the file. It never imports it, and `loaded` named an import that
      // does not happen (T-551).
      enumerated: true,
      collected: result.collected,
      run: result.covered ? EXECUTION_UNKNOWN : false,
      green: EXECUTION_UNKNOWN,
      covered: result.covered,
      pullRequestCovered: result.pullRequestCovered,
      declaredQuarantine: result.declaredQuarantine,
      declaredQuarantineShape: result.declaredQuarantineShape,
      untriaged,
      triageVerdict: verdict,
      drawable: untriaged && disposition !== "held",
      via: result.via,
    });
    for (const via of result.via) entry.via.add(via);
  }

  const rows = [...directories.entries()]
    .map(([directory, entry]) => ({
      directory,
      testFiles: entry.testFiles,
      coveredTestFiles: entry.covered,
      unrunTestFiles: entry.testFiles - entry.covered,
      declaredQuarantineTestFiles: entry.declaredQuarantine,
      untriagedUnrunTestFiles:
        entry.testFiles - entry.covered - entry.declaredQuarantine,
      verdictHeldUntriagedUnrunTestFiles: entry.verdictHeld,
      drawableUnrunTestFiles: entry.drawablePaths.length,
      drawableTestPaths: [...entry.drawablePaths].sort(),
      unrunTestPaths: [...entry.unrunPaths].sort(),
      fileStatuses: entry.fileStatuses.sort((a, b) =>
        a.testPath.localeCompare(b.testPath),
      ),
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
  // Ranked on files that are unrun AND not already in a quarantine somebody
  // wrote with a reason. Before this filter, ranks 2 and 3 of the critical
  // band were directories whose entire unrun set was declared quarantine, so
  // the ordering that exists to say "triage this next" was offering work that
  // had already been triaged. The full `unrunTestFiles` stays on every row, so
  // nothing is hidden — only the ordering stops repeating itself.
  // Admitted on holding untriaged unrun work, NOT on having scored. Until
  // C-555 the second filter here was `row.governedRisk.score > 0`, so a
  // directory the classifier reached and matched no signal in was not ranked
  // low — it was absent from the only artifact that answers "which stale test
  // directory gets wired next". Measured on `cc2d13f2bc`: 7 directories ranked,
  // covering 11 of 385 untriaged unrun test files (2.9%), against 179
  // directories and 374 files in `unclassifiedRiskDirectories` with zero
  // overlap between the two lists. The queue therefore read as exhausted at
  // seven entries while 374 files sat in a list nothing ordered, and two
  // backlog items concluded from that the pool had run out.
  //
  // The classifier is untouched, and so is every score and band: this is the
  // ranking's denominator, nothing else. The comparator is the same comparator,
  // over a wider input — which is what keeps a scored directory's rank exactly
  // where it was, since score descending sorts every signalled row ahead of
  // every zero. Within the zeros the existing secondary keys apply, so the tier
  // is ordered by the amount of unrun work rather than alphabetically. No
  // directory's risk is raised to buy it a place; `admittedBy` names the path
  // instead, on the row, so the two populations stay separable by a reader and
  // by a test.
  //
  // Admitted on DRAWABLE work since T-773: an untriaged file whose latest
  // triage verdict names owned residual work no longer admits its directory.
  // See `triageVerdicts` for which verdicts hold and why.
  const rankedRows = rows
    .filter((row) => row.drawableUnrunTestFiles > 0)
    .sort(
      (a, b) =>
        b.governedRisk.score - a.governedRisk.score ||
        b.unrunTestFiles - a.unrunTestFiles ||
        a.directory.localeCompare(b.directory),
    )
    .map((row, index) => ({
      ...row,
      admittedBy:
        row.governedRisk.score > 0 ? "governed_risk_signal" : "untriaged_unrun_work",
      governedRisk: { ...row.governedRisk, rank: index + 1 },
    }));
  // `governedRiskFiles` and `governedRiskEvidence` below stay bound to the rows
  // that actually carry a governed-risk signal. Widening those two with the
  // ranking would have redefined "governed-risk evidence" as "every unrun
  // file", which is a different claim from the one their names make, and it is
  // the claim four workflow comments already cite this artifact for.
  const governedRiskRows = rankedRows.filter((row) => row.governedRisk.score > 0);
  const governedRiskRanking = rankedRows.map((row) => ({
    directory: row.directory,
    testFiles: row.testFiles,
    unrunTestFiles: row.unrunTestFiles,
    declaredQuarantineTestFiles: row.declaredQuarantineTestFiles,
    untriagedUnrunTestFiles: row.untriagedUnrunTestFiles,
    verdictHeldUntriagedUnrunTestFiles: row.verdictHeldUntriagedUnrunTestFiles,
    drawableUnrunTestFiles: row.drawableUnrunTestFiles,
    drawableTestPaths: row.drawableTestPaths,
    admittedBy: row.admittedBy,
    governedRisk: {
      score: row.governedRisk.score,
      band: row.governedRisk.band,
      signals: row.governedRisk.signals,
      productSourceCount: row.governedRisk.productSourceCount,
      rank: row.governedRisk.rank,
    },
  }));
  const governedRiskFiles = governedRiskRows.flatMap((row) =>
    row.fileStatuses.map((file) => ({
      directory: file.directory,
      testPath: file.testPath,
      enumerated: file.enumerated,
      collected: file.collected,
      run: file.run,
      green: file.green,
      covered: file.covered,
      pullRequestCovered: file.pullRequestCovered,
      declaredQuarantine: file.declaredQuarantine,
      declaredQuarantineShape: file.declaredQuarantineShape,
      untriaged: file.untriaged,
      triageVerdict: file.triageVerdict,
      drawable: file.drawable,
      via: file.via,
      governedRisk: {
        score: row.governedRisk.score,
        band: row.governedRisk.band,
        signals: row.governedRisk.signals,
        productSourceCount: row.governedRisk.productSourceCount,
        rank: row.governedRisk.rank,
      },
    })),
  );
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
    .map(
      ({
        governedRisk: _governedRisk,
        unrunTestFiles: _unrun,
        unrunTestPaths: _unrunPaths,
        fileStatuses: _fileStatuses,
        verdictHeldUntriagedUnrunTestFiles: _held,
        drawableUnrunTestFiles: _drawable,
        drawableTestPaths: _drawablePaths,
        ...row
      }) => row,
    );
  const partialDirectories = rows.filter(
    (row) => row.coveredTestFiles > 0 && row.coveredTestFiles < row.testFiles,
  );
  // The ranking's denominator: every directory holding a file no workflow
  // runs, partial and uncovered alike. Without it `unclassifiedRiskDirectories`
  // is a subtraction with an unprinted minuend.
  const directoriesWithUnrunTestFiles = rows.filter(
    (row) => row.unrunTestFiles > 0,
  );
  // The ranking's own denominator moved with its filter. Subtracting the
  // ranking from the wider set would have recounted every fully quarantined
  // governed directory as "unclassified", which is the opposite of what that
  // number means.
  const directoriesWithUntriagedUnrunTestFiles = rows.filter(
    (row) => row.untriagedUnrunTestFiles > 0,
  );
  // Kept as its own list after C-555 widened the ranking to hold these rows
  // too. It is no longer the ranking's complement; it is the answer to a
  // different question — which zeros the resolver reached and which it did not —
  // and that question is why `productSourceCount` is published at all. Dropping
  // it because the rows are now ranked would delete the only place the two kinds
  // of zero are separated.
  //
  // `unclassifiedRiskDirectories` was a subtraction and nothing else: the
  // directories it counted appeared in no list, so 180 of the 190 directories
  // holding untriaged unrun work were a number with no rows behind it. They are
  // published here, each carrying the count of product modules its tests
  // resolved, because that count is what separates "measured, and nothing
  // matched" from "the census followed no import out of this directory". The
  // filter is the exact complement of `governedRiskRows`, over the exact same
  // denominator, so the two partition that population rather than approximating
  // it (T-758).
  const unclassifiedRiskDirectories = directoriesWithUntriagedUnrunTestFiles
    .filter((row) => row.governedRisk.score === 0)
    .sort(
      (a, b) =>
        a.governedRisk.productSourceCount - b.governedRisk.productSourceCount ||
        b.untriagedUnrunTestFiles - a.untriagedUnrunTestFiles ||
        a.directory.localeCompare(b.directory),
    )
    .map((row) => ({
      directory: row.directory,
      testFiles: row.testFiles,
      unrunTestFiles: row.unrunTestFiles,
      declaredQuarantineTestFiles: row.declaredQuarantineTestFiles,
      untriagedUnrunTestFiles: row.untriagedUnrunTestFiles,
      governedRisk: {
        score: row.governedRisk.score,
        band: row.governedRisk.band,
        signals: row.governedRisk.signals,
        productSourceCount: row.governedRisk.productSourceCount,
      },
    }));
  const unclassifiedWithNoResolvedProductSource = unclassifiedRiskDirectories.filter(
    (row) => row.governedRisk.productSourceCount === 0,
  );

  return {
    subject:
      "every Jest test file under src/, against the commands GitHub workflows reach",
    method: [
      "A test file counts as covered when a workflow reaches a command naming it or a directory above it, and that same command does not exclude it through --testPathIgnorePatterns.",
      "Ignore patterns are scoped to the command that passes them, and a $(node scripts/…) substitution is resolved by running that script rather than by re-deriving its list here.",
      "Four hops are followed: workflow run step, npm script (recursively), repo script file, test-ratchet baseline JSON.",
      "pullRequestCovered counts only workflows triggered by pull_request or merge_group, i.e. the set that can block a merge.",
      "While indeterminateInvocations is non-empty, uncoveredTestFiles is an upper bound.",
      "An unrun file a naming command excludes through its own --testPathIgnorePatterns is a declared quarantine: triaged, with a reason recorded somewhere. An unrun file no command names is untriaged. Both stay in uncoveredTestFiles; only untriagedUnrunTestFiles separates them.",
      "A quarantine is also read where it is expressed by ENUMERATION: a directory whose default is EXCLUDED names its files one by one, so a file left out is named by nothing and no ignore pattern subtracts it. Such a file is a declared quarantine when a scoped entry in a scripts/quality/*-quarantine.json names it; declaredQuarantineShape says which of the two shapes credited each file. Discovery is a glob over that directory and scope is declared in the list, because basenames are not unique in this tree: a list the census cannot resolve fails the run rather than being skipped.",
      "governedRiskFiles reports each file in a ranked directory that carries a governed-risk signal — not every ranked directory, since C-555 admitted the unscored ones to the ranking and deliberately not to this list: enumerated means the census walked the tree and found the file, collected means a workflow-reachable command named it before ignore subtraction, covered means that command still reaches it after ignore subtraction, untriaged means no command reaches it and no quarantine declares it, and declaredQuarantineShape names which of the two quarantine shapes credited a file that is not untriaged.",
      "This census executes no test, so it publishes no pass or fail for any file: green is \"unknown\" for every row without exception, and run is false only where no reachable command selects the file — the one execution fact reachability settles — and \"unknown\" otherwise, because selection is not execution. A file that was never executed cannot appear as green.",
      "Every directory holding an UNTRIAGED unrun file is ranked, and admittedBy on each row says which path admitted it: governed_risk_signal for a non-zero governed-risk score, untriaged_unrun_work for a directory that matched no signal and would have been absent before C-555. Order is governed-surface risk first — declared AI controls, approval or lifecycle writes, then tenant-scoped reads — so every signalled directory precedes every zero and keeps the rank it had; the count of unrun files is a tie-breaker, and it is what orders the zero tier among itself. Admission raises no score and no band. A directory whose unrun set is entirely declared quarantine is still not ranked, because it has already been triaged.",
      "Governed-risk signals come from product modules a test loads at runtime, not from directory names alone; type-only imports are erased before the test runs and are not counted as edges.",
      "Evidence source lists for the top 25 governed-risk directories are sorted and capped at five paths per signal; companion counts preserve the full match cardinality.",
      "productSourceCount is the number of product modules the directory's tests resolved at run time, published on every directory including the unranked ones. An unclassified directory with a non-zero count was measured and matched no signal; one with zero resolved no import at all, so its band describes this census's reach rather than that directory's risk. unclassifiedRiskDirectories lists every such directory and the two counts beside it split them. Since C-555 it is a view ON the ranking rather than the ranking's complement: each of its rows is also a ranked row with admittedBy untriaged_unrun_work unless a triage verdict holds every untriaged file in it (T-773), and rankedDirectories against untriagedUnrunTestFiles is how far the work order reaches into its own pool.",
      "A triage verdict in a docs/architecture/*triage*.json record is read per file, the latest recordedAt winning (an undated record sorts first; on equal stamps the later record file wins). It never changes untriagedUnrunTestFiles, because a verdict runs nothing. It changes what the ranking ADMITS: an untriaged file whose latest verdict names owned residual work (wire_into_ci, repair, rewrite_as_behavior, update_with_reason_recorded, real, vacuous_control_proof, held_unwired, already_verdicted_elsewhere) is held out of the draw and listed in triageVerdicts.heldTestPaths with its verdict, record and owner, and a directory is ranked only while drawableUnrunTestFiles is above zero. drawableTestPaths on each ranked row names the files a draw may offer. A completion verdict (wired, rewritten_as_behavior_and_wired, already_selected_no_action, deleted_and_replaced) on a file the census measures as unrun is contradicted and stays drawable, as does a verdict word in neither list; both are listed. unclassifiedRiskDirectories is still drawn from the untriaged pool, so a directory whose every untriaged file is held can appear there without a ranked row.",
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
      directoriesWithUntriagedUnrunTestFiles:
        directoriesWithUntriagedUnrunTestFiles.length,
      declaredQuarantineTestFiles: declaredQuarantine,
      untriagedUnrunTestFiles: testFiles.length - covered - declaredQuarantine,
      indeterminateInvocations: indeterminate.length,
      unresolvedIgnoreArguments: unresolvedIgnoreArguments.length,
      criticalGovernedRiskDirectories: governedRiskRanking.filter(
        (row) => row.governedRisk.band === "critical",
      ).length,
      highGovernedRiskDirectories: governedRiskRanking.filter(
        (row) => row.governedRisk.band === "high",
      ).length,
      // Counted over the denominator by the zero-score rule, NOT as
      // `denominator - governedRiskRanking.length`. That subtraction was
      // correct only while the ranking held exactly the scored rows; C-555
      // widened the ranking to the whole untriaged pool, which would have driven
      // this number to zero while 179 rows sat in the list below it. A count
      // derived from the ranking's length cannot survive a change to what the
      // ranking admits, and this number is the one four backlog items read.
      unclassifiedRiskDirectories: directoriesWithUntriagedUnrunTestFiles.filter(
        (row) => row.governedRisk.score === 0,
      ).length,
      // The ranking's own two numbers. C-555's finding was that the ranking
      // covered 11 of 385 untriaged unrun files and nothing in this artifact
      // said so: the ranking's length was published nowhere, its file total was
      // published nowhere, and the pool was three lines up. Reading the coverage
      // of the work order meant summing a list by hand, so nobody did, and the
      // ranking sat at 2.9% of its own denominator across twelve censuses.
      rankedDirectories: governedRiskRanking.length,
      rankedUntriagedUnrunTestFiles: governedRiskRanking.reduce(
        (total, row) => total + row.untriagedUnrunTestFiles,
        0,
      ),
      // The two halves of that word, and they are counted from the rows rather
      // than derived from each other, so a disagreement between the pair and
      // the line above is visible instead of arithmetically impossible.
      unclassifiedRiskDirectoriesWithResolvedProductSources:
        unclassifiedRiskDirectories.length -
        unclassifiedWithNoResolvedProductSource.length,
      unclassifiedRiskDirectoriesWithNoResolvedProductSource:
        unclassifiedWithNoResolvedProductSource.length,
    },
    // Every quarantine list the glob found, what it declares and what that
    // resolved to. Published so an unregistered or stale list is a row somebody
    // can read rather than an absence nobody can: a declaration that resolves to
    // no file credits nothing, and the count alone cannot say so.
    quarantineLists,
    indeterminateInvocations: indeterminate,
    // Every runner invocation a workflow-reachable script TALKS ABOUT without
    // running: a comment, an assertion, a data field. Published because the
    // position rule that separates these could demote a real invocation, and a
    // demotion with nothing to read would look exactly like nothing happening.
    mentionedInvocations: mentioned,
    unresolvedIgnoreArguments,
    partiallyCoveredDirectories: partialDirectories.map(
      ({
        governedRisk: _governedRisk,
        unrunTestFiles: _unrun,
        unrunTestPaths: _unrunPaths,
        fileStatuses: _fileStatuses,
        verdictHeldUntriagedUnrunTestFiles: _held,
        drawableUnrunTestFiles: _drawable,
        drawableTestPaths: _drawablePaths,
        ...row
      }) => row,
    ),
    governedRiskFiles,
    governedRiskRanking,
    // The half of the untriaged pool the ranking no longer admits, named file by
    // file with the verdict that holds it (T-773). Deliberately NOT in `counts`:
    // the drift report and the committed-shape test read that object's keys, and
    // this is a work-order view, not a coverage measure.
    triageVerdicts: {
      heldUntriagedUnrunTestFiles: heldTestPaths.length,
      drawableUntriagedUnrunTestFiles: rows.reduce(
        (total, row) => total + row.drawableUnrunTestFiles,
        0,
      ),
      heldByVerdict: Object.fromEntries(
        [...new Set(heldTestPaths.map((entry) => entry.verdict))]
          .sort()
          .map((verdict) => [
            verdict,
            heldTestPaths.filter((entry) => entry.verdict === verdict).length,
          ]),
      ),
      heldTestPaths: heldTestPaths.sort((a, b) => a.testPath.localeCompare(b.testPath)),
      contradictedVerdicts: contradictedVerdicts.sort((a, b) =>
        a.testPath.localeCompare(b.testPath),
      ),
      unrecognisedVerdicts: unrecognisedVerdicts.sort((a, b) =>
        a.testPath.localeCompare(b.testPath),
      ),
      verdictsNamingNoFile: [...verdicts.recordsByPath.entries()]
        .filter(([testPath]) => !walkedTestFiles.has(testPath))
        .map(([testPath, records]) => ({ testPath, records: [...records].sort() }))
        .sort((a, b) => a.testPath.localeCompare(b.testPath)),
      unreadableRecords: verdicts.unreadableRecords,
    },
    unclassifiedRiskDirectories,
    governedRiskEvidence,
    uncoveredDirectories,
    ...(includeUnrunPaths
      ? {
          unrunTestPathsByDirectory: directoriesWithUnrunTestFiles.map(
            (row) => ({
              directory: row.directory,
              unrunTestFiles: row.unrunTestFiles,
              unrunTestPaths: row.unrunTestPaths,
            }),
          ),
        }
      : {}),
    // Every walked file with the three states this census decides, flat. OFF by
    // default for the same reason as `includeUnrunPaths`: the committed
    // artifact must stay byte-identical or `--check` fires on a reader.
    //
    // `untriaged` is already computed per file above and then dropped, so every
    // consumer that wanted it has had to subtract two published counts and
    // guess which files the difference names. That subtraction is how a
    // directory's triage state gets re-derived by hand — the round trip
    // `--explain` removed for the unrun set and this removes for the triaged
    // one.
    ...(includeFileStatuses
      ? {
          fileStatuses: rows.flatMap((row) => row.fileStatuses),
        }
      : {}),
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
    `  run by no workflow, untriaged: ${c.untriagedUnrunTestFiles} (${c.declaredQuarantineTestFiles} are declared quarantines)`,
    `  quarantine lists read:          ${census.quarantineLists.length} (${census.quarantineLists.reduce((total, row) => total + row.declaredSuites, 0)} declared suites, ${census.quarantineLists.reduce((total, row) => total + row.unresolvedDeclarations.length, 0)} naming no file in the tree)`,
    `  directories with unrun tests:   ${c.directoriesWithUnrunTestFiles} (${c.directoriesWithUntriagedUnrunTestFiles} hold an untriaged file)`,
    `  governed risk among them:       ${c.criticalGovernedRiskDirectories} critical, ${c.highGovernedRiskDirectories} high`,
    // The rest of that population, which the two lines above leave out. Worded
    // so the zero-source half cannot be read as an all-clear: the census did
    // not look at those directories and find nothing, it failed to look.
    `    unclassified: ${c.unclassifiedRiskDirectories} (${c.unclassifiedRiskDirectoriesWithNoResolvedProductSource} resolved no product source, so the band is the resolver's silence)`,
  ];
  if (c.indeterminateInvocations > 0) {
    lines.push(
      `  unresolved Jest invocations:    ${c.indeterminateInvocations} — uncovered count is an upper bound`,
    );
    for (const entry of census.indeterminateInvocations) {
      lines.push(`    ${entry.source}: ${entry.invocation}`);
    }
  }

  // Printed unconditionally when non-empty, and named as declined rather than
  // as a problem. It is the only place a wrongly demoted invocation would show
  // up: the coverage numbers above would simply be smaller and say nothing.
  const mentions = census.mentionedInvocations ?? [];
  if (mentions.length > 0) {
    lines.push(
      `  quoted, not run:                ${mentions.length} — named in a comment, assertion or data field; credited to nobody`,
    );
    for (const entry of mentions) {
      // A quoted invocation usually sits in a paragraph explaining why the
      // real one is shaped as it is, so the full text is in the JSON and the
      // summary gets the first clause of it.
      const shown =
        entry.mention.length > 120
          ? `${entry.mention.slice(0, 117)}...`
          : entry.mention;
      lines.push(`    ${entry.source}: ${shown}`);
    }
  }
  if (c.unresolvedIgnoreArguments > 0) {
    lines.push(
      `  unresolved ignore arguments:    ${c.unresolvedIgnoreArguments} — covered count is an upper bound for those commands`,
    );
    for (const entry of census.unresolvedIgnoreArguments) {
      lines.push(`    ${entry.script}: ${entry.reason}`);
    }
  }
  const governedHead = census.governedRiskRanking.slice(0, 5);
  if (governedHead.length > 0) {
    // The heading names what the list is ordered ON, and it has moved twice
    // before for the same reason. C-555 moved it again: the ranking is no
    // longer only governed-risk directories, so "top governed-risk
    // directories" would now name a list that mostly is not one. Governed risk
    // is still the primary key — every signalled row precedes every zero — and
    // the untriaged count orders the rest, so the heading says both in that
    // order. The count is the ranking's own, against the pool, because the head
    // of a 186-row list read exactly like the head of a 7-row one.
    lines.push(
      `  next to wire, by governed risk then untriaged unrun tests (${census.counts.rankedDirectories} ranked, ${census.counts.rankedUntriagedUnrunTestFiles} of ${census.counts.untriagedUnrunTestFiles} untriaged files):`,
    );
    for (const row of governedHead) {
      // An unscored row has no signals, and joining an empty list left a
      // dangling `; )` on it. It says which admission path placed it instead —
      // the same fact `admittedBy` carries in the JSON.
      const why =
        row.governedRisk.signals.length > 0
          ? row.governedRisk.signals.join(", ")
          : "no governed-risk signal matched; ranked as untriaged unrun work";
      lines.push(
        `    ${row.governedRisk.rank}. ${row.directory} (${row.governedRisk.band}; ${row.untriagedUnrunTestFiles} untriaged of ${row.unrunTestFiles} unrun of ${row.testFiles} tests; ${why})`,
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
 *
 * Exported so the report can be driven with a known-stale committed census
 * and a known-current one. Its guard could previously only read this file's
 * source text and assert that certain strings appeared in it, which is a
 * check on the prose rather than on the comparison. The bug described below
 * would have passed that guard: it was a real comparison of the wrong two
 * fields, and it said all the right things while doing it.
 */
/**
 * Drift in the COVERAGE SHAPE — which directories are uncovered or partially
 * covered — as distinct from drift in the counts.
 *
 * This exists because of the question the comment above `describeDrift` left
 * open: would a check that fails on disagreement fire on every unrelated pull
 * request that adds a test, or only when the file is genuinely stale? It was
 * measured rather than argued. Adding one ordinary test to an already-covered
 * directory moves three counts — `testFiles`, `coveredTestFiles` and
 * `pullRequestCoveredTestFiles` — and moves these sets by exactly zero.
 *
 * So a gate on the counts would fire on nearly every pull request and teach
 * people to regenerate a two-thousand-line file to get green. A gate on the
 * sets fires only when the wiring itself changed, which is the thing the
 * committed census is consulted for. That is what `--check` enforces; the
 * counts stay a report.
 */
export function describeShapeDrift(measured, committedPath) {
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

  // `unmeasured` is a set, not a count, for the same reason the other two are:
  // it moves when a directory changes what the census can resolve about it, and
  // not on every pull request that adds a test. A directory that silently stops
  // resolving its imports would otherwise slide from "measured, no signal" to
  // "unmeasured" with no output changing shape — which is how `unclassified`
  // came to cover 180 directories unnoticed in the first place (T-758).
  const shape = (census) => ({
    uncovered: new Set((census.uncoveredDirectories ?? []).map((r) => r.directory)),
    partial: new Set(
      (census.partiallyCoveredDirectories ?? []).map((r) => r.directory),
    ),
    unmeasured: new Set(
      (census.unclassifiedRiskDirectories ?? [])
        .filter((r) => r.governedRisk?.productSourceCount === 0)
        .map((r) => r.directory),
    ),
  });
  const was = shape(committed);
  const now = shape(measured);
  const missing = (a, b) => [...a].filter((d) => !b.has(d)).sort();

  const changes = [
    ...missing(now.uncovered, was.uncovered).map((d) => `+uncovered ${d}`),
    ...missing(was.uncovered, now.uncovered).map((d) => `-uncovered ${d}`),
    ...missing(now.partial, was.partial).map((d) => `+partial ${d}`),
    ...missing(was.partial, now.partial).map((d) => `-partial ${d}`),
    ...missing(now.unmeasured, was.unmeasured).map((d) => `+unmeasured ${d}`),
    ...missing(was.unmeasured, now.unmeasured).map((d) => `-unmeasured ${d}`),
  ];

  if (changes.length === 0) {
    return { state: "current", line: "coverage shape matches the committed census", changes };
  }
  return {
    state: "drifted",
    line: `coverage shape has drifted in ${changes.length} director${changes.length === 1 ? "y" : "ies"}`,
    changes,
  };
}

export function describeDrift(measured, committedPath) {
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
  // The two unclassified-split fields are here for the reason the comment above
  // gives: a field this report does not name is a field that can go stale with
  // the report printing "matches this run". They were added with the split
  // itself (T-758) rather than left for whoever next noticed the omission.
  const FIELDS = [
    "testFiles",
    "coveredTestFiles",
    "uncoveredTestFiles",
    "unclassifiedRiskDirectoriesWithResolvedProductSources",
    "unclassifiedRiskDirectoriesWithNoResolvedProductSource",
  ];
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

  // `--explain` answers the question the summary cannot: WHICH files are the
  // unrun ones. Every consumer that needed that has so far re-derived it with
  // a grep over the workflow file, which resolves one of the four hops and
  // silently disagrees with the census it is meant to be reading.
  //
  // It returns before the write and drift blocks on purpose. This is a query,
  // and a query that rewrites the artifact it is interrogating is the defect
  // `writeIfChanged` and the `--check` placement already exist to avoid.
  if (argv.includes("--explain")) {
    const detailed = buildCensus(REPO_ROOT, { includeUnrunPaths: true });
    const groups = detailed.unrunTestPathsByDirectory;
    if (argv.includes("--json")) {
      console.log(JSON.stringify(groups, null, 2));
      return;
    }
    // Derived from the paths themselves, not from `unrunTestFiles`. Those are
    // two independent computations, and a header that reads the count while
    // the body lists the paths can disagree with its own output without
    // anything failing.
    const files = groups.reduce((sum, row) => sum + row.unrunTestPaths.length, 0);
    console.log(
      `test-ci-coverage-census --explain: ${files} test files no workflow runs, ` +
        `across ${groups.length} directories`,
    );
    for (const row of groups) {
      console.log(`\n  ${row.directory}  (${row.unrunTestFiles} unrun)`);
      for (const testPath of row.unrunTestPaths) console.log(`    ${testPath}`);
    }
    return;
  }

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
  const committedPath = path.join(REPO_ROOT, CENSUS_RELATIVE_PATH);
  const drift = describeDrift(census, committedPath);
  if (!argv.includes("--json")) {
    console.log(`\ncensus drift: ${drift.line}`);
    if (drift.state === "drifted") {
      console.log(
        "  Refresh with: npm run audit:test-ci-coverage:write\n" +
          "  Counts alone are a report, not a gate. The committed file is the input\n" +
          "  to which directory gets wired next, so a stale one mis-ranks that queue.",
      );
    }
  }

  // `--check` gates the coverage SHAPE only. See describeShapeDrift for why
  // the counts are deliberately not gated: they move on any pull request that
  // adds a test, and the sets do not.
  if (argv.includes("--check")) {
    const shape = describeShapeDrift(census, committedPath);
    if (!argv.includes("--json")) {
      console.log(`census shape: ${shape.line}`);
      for (const change of shape.changes ?? []) console.log(`  ${change}`);
    }
    if (shape.state !== "current") {
      console.error(
        "\ncensus shape drift: a directory changed coverage state without the " +
          "committed census being refreshed.\n" +
          "Refresh with: npm run audit:test-ci-coverage:write",
      );
      process.exitCode = 1;
    }
  }
}

if (isDirectInvocation(import.meta.url)) main();
