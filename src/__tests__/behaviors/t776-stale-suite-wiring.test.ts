import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * Item T-776, the eighth stale-suite triage draw: ranks 1-5 of the
 * verdict-aware governed-risk ranking, five fully-unrun directories, twenty
 * files, each executed on its own. Three directories are wired; two are held.
 * `docs/architecture/t776-stale-suite-triage.json` is the record, and every
 * partition below is read out of it rather than copied here.
 *
 * Four kinds of claim, each a separate case:
 *
 * 1. **Reached.** Every suite the record says it wired is selected by an
 *    invocation that can block a merge, answered through the census's own
 *    resolver — workflow step, npm script, repo script, ratchet baseline —
 *    never by grepping `.github/workflows` for a string.
 * 2. **Out of the dark baseline.** A wired directory that stays listed in the
 *    ratchet baseline is a second record of the same fact disagreeing.
 * 3. **Still worth running.** Each wired directory's subject has a non-test
 *    importer. If it ever loses them, the reason to spend CI on it is gone and
 *    this case says so rather than leaving the step unexamined.
 * 4. **Held for a reason the refusal control can read.** Both held directories
 *    carry a declared source-text scanner row, which is what puts them behind
 *    `t770-scanner-wiring-refusal.test.ts`. Without that row the hold would be
 *    prose.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD = "docs/architecture/t776-stale-suite-triage.json";
const DARK_BASELINE =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

type SuiteRow = {
  path: string;
  directory: string;
  run: boolean;
  green: boolean;
  totalTests: number;
  readsRepositoryFileText: boolean;
  sourceTextScanner: boolean;
  verdict: string;
  wiredInThisItem: boolean;
};

type TriageRecord = {
  item: string;
  verdictVocabulary: string[];
  scope: { drawSize: number };
  wiring: { directories: string[]; suitesWired: number; casesWired: number };
  heldDirectories: Record<string, { successorFiledAs: string }>;
  suites: SuiteRow[];
};

const record = JSON.parse(
  readFileSync(path.join(repoRoot, TRIAGE_RECORD), "utf8"),
) as TriageRecord;

const wiredRows = record.suites.filter((suite) => suite.wiredInThisItem);
const wiredDirectories = [...new Set(wiredRows.map((row) => row.directory))].sort();
const heldDirectories = Object.keys(record.heldDirectories).sort();

const packageScripts = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
).scripts as Record<string, string>;
const resolved = collectReachableCommands(repoRoot, packageScripts) as {
  reachable: Record<string, unknown>[];
  indeterminate: unknown[];
};

function reachedByAMergeBlockingInvocation(suitePath: string): boolean {
  return resolved.reachable.some(
    (entry) =>
      entry.pullRequest === true &&
      reachableEntrySelects(repoRoot, entry, suitePath),
  );
}

function listSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(path.join(repoRoot, dir))) {
    const relative = `${dir}/${entry}`;
    if (entry === "node_modules") continue;
    if (statSync(path.join(repoRoot, relative)).isDirectory()) {
      out.push(...listSource(relative));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(relative);
    }
  }
  return out;
}

const isTestFile = (file: string) =>
  /(^|\/)__tests__\//.test(file) || /\.(test|spec)\.tsx?$/.test(file);

/** The subject of a wired directory: the module directory its tests import. */
function subjectDirectory(testDirectory: string): string {
  return testDirectory.endsWith("/__tests__")
    ? testDirectory.slice(0, -"/__tests__".length)
    : testDirectory;
}

function resolveSpecifier(fromFile: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = `src/${specifier.slice(2)}`;
  else if (specifier.startsWith(".")) base = path.posix.join(path.posix.dirname(fromFile), specifier);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    const absolute = path.join(repoRoot, candidate);
    if (existsSync(absolute) && statSync(absolute).isFile()) return candidate;
  }
  return null;
}

/** Non-test files outside `subject` that import a non-test module inside it. */
function nonTestImporters(subject: string, sourceFiles: string[]): string[] {
  const importers = new Set<string>();
  for (const file of sourceFiles) {
    if (isTestFile(file) || file.startsWith(`${subject}/`)) continue;
    const text = readFileSync(path.join(repoRoot, file), "utf8");
    for (const match of text.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)) {
      const target = resolveSpecifier(file, match[1]);
      if (target && target.startsWith(`${subject}/`) && !isTestFile(target)) {
        importers.add(file);
      }
    }
  }
  return [...importers].sort();
}

const darkBaseline = JSON.parse(
  readFileSync(path.join(repoRoot, DARK_BASELINE), "utf8"),
) as string[];

describe("T-776 — eighth stale-suite draw, wiring and holds", () => {
  it("judges every drawn file once, executed, with a verdict from the vocabulary", () => {
    const paths = record.suites.map((suite) => suite.path);
    expect({
      rows: paths.length,
      unique: new Set(paths).size,
      notRun: record.suites.filter((suite) => !suite.run).map((s) => s.path),
      offVocabulary: record.suites
        .filter((suite) => !record.verdictVocabulary.includes(suite.verdict))
        .map((s) => s.path),
    }).toEqual({
      rows: record.scope.drawSize,
      unique: record.scope.drawSize,
      notRun: [],
      offVocabulary: [],
    });
  });

  it("wires only green suites that read no repository file, and states its own totals", () => {
    expect(wiredRows.length).toBeGreaterThan(0);
    expect({
      notGreen: wiredRows.filter((row) => !row.green).map((row) => row.path),
      readsText: wiredRows
        .filter((row) => row.readsRepositoryFileText || row.sourceTextScanner)
        .map((row) => row.path),
      wrongVerdict: wiredRows
        .filter((row) => row.verdict !== "wire_into_ci")
        .map((row) => row.path),
      suitesWired: wiredRows.length,
      casesWired: wiredRows.reduce((sum, row) => sum + row.totalTests, 0),
      directories: wiredDirectories,
    }).toEqual({
      notGreen: [],
      readsText: [],
      wrongVerdict: [],
      suitesWired: record.wiring.suitesWired,
      casesWired: record.wiring.casesWired,
      directories: [...record.wiring.directories].sort(),
    });
  });

  it("judges each wired directory whole, so no unjudged sibling rides along", () => {
    for (const directory of wiredDirectories) {
      const onDisk = readdirSync(path.join(repoRoot, directory))
        .filter((name) => /\.(test|spec)\.tsx?$/.test(name))
        .map((name) => `${directory}/${name}`)
        .sort();
      const wiredHere = wiredRows
        .filter((row) => row.directory === directory)
        .map((row) => row.path)
        .sort();
      expect({ directory, files: onDisk }).toEqual({ directory, files: wiredHere });
    }
  });

  it("reaches every wired suite from an invocation that can block a merge", () => {
    // While any invocation is unresolved, "not reached" is a guess.
    expect(resolved.indeterminate).toEqual([]);
    const unreached = wiredRows
      .map((row) => row.path)
      .filter((suitePath) => !reachedByAMergeBlockingInvocation(suitePath));
    expect(unreached).toEqual([]);
  });

  it("removes every wired directory from the dark-directory baseline", () => {
    expect(wiredDirectories.filter((dir) => darkBaseline.includes(dir))).toEqual([]);
  });

  it("wires only directories whose subject a non-test module still imports", () => {
    const sourceFiles = listSource("src");
    const orphaned = wiredDirectories
      .map((dir) => ({ dir, importers: nonTestImporters(subjectDirectory(dir), sourceFiles) }))
      .filter(({ importers }) => importers.length === 0)
      .map(({ dir }) => dir);
    expect(orphaned).toEqual([]);
  });

  it("holds each unwired directory behind a declared scanner row the refusal control reads", () => {
    expect(heldDirectories.length).toBeGreaterThan(0);
    for (const directory of heldDirectories) {
      const rows = record.suites.filter((suite) => suite.directory === directory);
      expect({
        directory,
        wiredHere: rows.filter((row) => row.wiredInThisItem).length,
        declaredScanner: rows.some((row) => row.sourceTextScanner),
        successor: /^T-\d+$/.test(record.heldDirectories[directory].successorFiledAs),
      }).toEqual({ directory, wiredHere: 0, declaredScanner: true, successor: true });
    }
  });
});
