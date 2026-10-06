import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * Item T-788, the twelfth stale-suite triage draw: ranks 1-5 of the
 * verdict-aware governed-risk ranking, five directories, ten files, each
 * executed on its own. Two `__tests__` directories are wired whole, two files
 * in `src/lib/atlas` are wired by name, and two directories are held.
 * `docs/architecture/t788-stale-suite-triage.json` is the record, and every
 * partition below is read out of it.
 *
 * The wiring cases are T-785's: reached through the census's own resolver,
 * out of the dark baseline, no wired row reading a repository file, subject
 * still imported by a non-test module — checked per row against the row's
 * own `subject`, because two of the rows sit in a product directory where
 * "anything outside the directory imports something inside it" is too weak.
 *
 * Named-file wiring leaves `src/lib/atlas` partial, and the dark-directory
 * ratchet only sees directories with nothing covered, so it says nothing
 * about that one from here on. T-780's pin stands in for it: the direct test
 * files on disk must equal the drawn rows plus the sibling the record names
 * as already covered, and that sibling must still be reached.
 *
 * The holds are of two kinds, each recomputed from something other than the
 * record, per row: a scanner case whose title must still sit in a file that
 * imports `node:fs`, and a red case whose disagreement is asked of the live
 * code OUT OF PROCESS — importing the product modules here would put them in
 * the behaviour gate's coverage denominator (T-781's floor finding). When a
 * reason goes away the hold goes red and says so. A held row can be
 * superseded by a triage record beside this one with a later `recordedAt`
 * that wires it.
 *
 * T-796: a red hold also asks the TEST, not only the code — the held file's
 * failing case is run out of process and must still fail. A row whose case a
 * later item fixed is marked `redResolved`, is held beside its sibling, and
 * that case must now pass.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD = "docs/architecture/t788-stale-suite-triage.json";
const DARK_BASELINE =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

type HoldKind = "red" | "source_text_scanner";

type RedProbe = {
  kind: "lakeshore_persona_count" | "lakeshore_dry_run_error";
  expectedByTest: number | string | null;
  returnedByCode: number | string | null;
};

type SuiteRow = {
  path: string;
  directory: string;
  subject?: string;
  run: boolean;
  green: boolean;
  totalTests: number;
  failedTests: number;
  readsRepositoryFileText: boolean;
  sourceTextScanner: boolean;
  verdict: string;
  wiredInThisItem: boolean;
  scannerCase?: string;
  failingCase?: string;
  redProbe?: RedProbe;
  heldWithSibling?: boolean;
  redResolved?: { item: string; pullRequest: number; mergeSha: string };
};

type TriageRecord = {
  item: string;
  recordedAt: string;
  verdictVocabulary: string[];
  scope: { drawSize: number; greenOnRun: number; redOnRun: number };
  wiring: {
    directories: string[];
    namedFiles: string[];
    suitesWired: number;
    casesWired: number;
  };
  pinnedDirectories: Record<string, { alreadyCovered: string[] }>;
  heldDirectories: Record<string, { successorFiledAs: string; holdKinds: HoldKind[] }>;
  suites: SuiteRow[];
};

const record = JSON.parse(
  readFileSync(path.join(repoRoot, TRIAGE_RECORD), "utf8"),
) as TriageRecord;

const wiredRows = record.suites.filter((suite) => suite.wiredInThisItem);
const wiredDirectories = [...record.wiring.directories].sort();
const namedFiles = [...record.wiring.namedFiles].sort();
const heldDirectories = Object.keys(record.heldDirectories).sort();

/**
 * Paths a triage record dated AFTER this one wires. Read from every
 * `*triage*.json` beside this record, not from a named successor, so a later
 * record cannot be missed by being filed under a different item.
 */
function wiredByALaterRecord(): Set<string> {
  const dir = path.dirname(TRIAGE_RECORD);
  const wired = new Set<string>();
  for (const name of readdirSync(path.join(repoRoot, dir))) {
    if (!/triage.*\.json$/.test(name)) continue;
    const later = JSON.parse(
      readFileSync(path.join(repoRoot, dir, name), "utf8"),
    ) as { recordedAt?: string; suites?: { path: string; wiredInThisItem?: boolean }[] };
    if (!later.recordedAt || later.recordedAt <= record.recordedAt) continue;
    for (const row of later.suites ?? []) {
      if (row.wiredInThisItem === true) wired.add(row.path);
    }
  }
  return wired;
}

const supersededByWiring = wiredByALaterRecord();
const stillHeldRows = (directory: string) =>
  record.suites.filter(
    (suite) => suite.directory === directory && !supersededByWiring.has(suite.path),
  );

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

/** Every non-test source file mapped to the repository files it imports. */
function importGraph(sourceFiles: string[]): Map<string, Set<string>> {
  const importersOf = new Map<string, Set<string>>();
  for (const file of sourceFiles) {
    if (isTestFile(file)) continue;
    const text = readFileSync(path.join(repoRoot, file), "utf8");
    for (const match of text.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)) {
      const target = resolveSpecifier(file, match[1]);
      if (!target || target === file) continue;
      if (!importersOf.has(target)) importersOf.set(target, new Set());
      importersOf.get(target)!.add(file);
    }
  }
  return importersOf;
}

/**
 * The first non-test importer OUTSIDE the subject's directory, reached by
 * walking importers inside that directory — `classifier.ts` is live only
 * through `orchestrator.ts` beside it, and the routes import the latter.
 * Null when nothing outside the directory reaches the subject at all.
 */
function reachedFromOutside(
  subject: string,
  importersOf: Map<string, Set<string>>,
): string | null {
  const subjectDir = path.posix.dirname(subject);
  const queue = [subject];
  const seen = new Set(queue);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const importer of [...(importersOf.get(current) ?? [])].sort()) {
      if (path.posix.dirname(importer) !== subjectDir) return importer;
      if (!seen.has(importer)) {
        seen.add(importer);
        queue.push(importer);
      }
    }
  }
  return null;
}

const directTestFiles = (directory: string) =>
  readdirSync(path.join(repoRoot, directory))
    .filter(
      (name) =>
        /\.(test|spec)\.tsx?$/.test(name) &&
        statSync(path.join(repoRoot, directory, name)).isFile(),
    )
    .map((name) => `${directory}/${name}`)
    .sort();

const darkBaseline = JSON.parse(
  readFileSync(path.join(repoRoot, DARK_BASELINE), "utf8"),
) as string[];

/**
 * Ask the live code each red row's question, out of process. `server-only`
 * throws unless resolved under the `react-server` condition, which is the
 * condition the application's server code runs under.
 */
function askTheLiveCode(): Record<RedProbe["kind"], number | string | null> {
  const script = [
    'import { CXO_PERSONAS } from "./src/lib/auth/cxo-personas";',
    'import { rehearseLakeshoreLoad } from "./src/lib/lakeshore/load-rehearsal";',
    "(async () => {",
    "  const personas = CXO_PERSONAS as ReadonlyArray<{ clientKey: string }>;",
    '  const count = personas.filter((p) => p.clientKey === "lakeshore").length;',
    "  let error: string | null = null;",
    "  try {",
    "    await rehearseLakeshoreLoad({",
    '      rootDir: "docs/build/lakeshore/loaded", mode: "dry-run",',
    '      clientId: "t788-probe", includeDocuments: false,',
    '      generatedAt: "2026-06-04T00:00:00.000Z",',
    "    });",
    "  } catch (caught) { error = (caught as Error).message; }",
    "  process.stdout.write(JSON.stringify({",
    "    lakeshore_persona_count: count, lakeshore_dry_run_error: error }));",
    "})();",
  ].join("\n");
  const out = execFileSync(
    path.join(repoRoot, "node_modules/.bin/tsx"),
    ["--conditions=react-server", "-e", script],
    { cwd: repoRoot, encoding: "utf8" },
  );
  return JSON.parse(out) as Record<RedProbe["kind"], number | string | null>;
}

/**
 * Ask the held TEST what it says, out of process: run the file with jest,
 * filtered to the one named case, and read that case's own status from the
 * JSON report. T-796: asking only the code let a row stay "red" after its
 * test was updated to agree with the code. "missing" means the filter reached
 * no case of that exact title, which proves nothing either way.
 */
const testVerdicts = new Map<string, "passed" | "failed" | "missing">();
function askTheTest(suitePath: string, caseTitle: string) {
  const key = `${suitePath}\u0000${caseTitle}`;
  const cached = testVerdicts.get(key);
  if (cached) return cached;
  const dir = mkdtempSync(path.join(os.tmpdir(), "t796-"));
  const report = path.join(dir, "report.json");
  try {
    spawnSync(
      path.join(repoRoot, "node_modules/.bin/jest"),
      [
        "--ci",
        "--runTestsByPath",
        suitePath,
        "-t",
        caseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "--json",
        `--outputFile=${report}`,
      ],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, CI: "true" } },
    );
    const assertions = existsSync(report)
      ? (JSON.parse(readFileSync(report, "utf8")) as {
          testResults: { assertionResults: { title: string; status: string }[] }[];
        }).testResults.flatMap((result) => result.assertionResults)
      : [];
    const named = assertions.filter((a) => a.title === caseTitle);
    const verdict =
      named.length === 0
        ? "missing"
        : named.every((a) => a.status === "passed")
          ? "passed"
          : named.some((a) => a.status === "failed")
            ? "failed"
            : "missing";
    testVerdicts.set(key, verdict);
    return verdict;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("T-788 — twelfth stale-suite draw, wiring and holds", () => {
  it("judges every drawn file once, executed, with a verdict from the vocabulary", () => {
    const paths = record.suites.map((suite) => suite.path);
    expect({
      rows: paths.length,
      unique: new Set(paths).size,
      notRun: record.suites.filter((suite) => !suite.run).map((s) => s.path),
      offVocabulary: record.suites
        .filter((suite) => !record.verdictVocabulary.includes(suite.verdict))
        .map((s) => s.path),
      green: record.suites.filter((suite) => suite.green).length,
      red: record.suites.filter((suite) => !suite.green).length,
    }).toEqual({
      rows: record.scope.drawSize,
      unique: record.scope.drawSize,
      notRun: [],
      offVocabulary: [],
      green: record.scope.greenOnRun,
      red: record.scope.redOnRun,
    });
  });

  it("wires only green, non-reading suites, and states its own totals", () => {
    expect(wiredRows.length).toBeGreaterThan(0);
    const wiredPaths = wiredRows.map((row) => row.path).sort();
    expect({
      notGreen: wiredRows.filter((row) => !row.green).map((row) => row.path),
      scanners: wiredRows.filter((row) => row.sourceTextScanner).map((row) => row.path),
      readers: wiredRows
        .filter((row) => row.readsRepositoryFileText)
        .map((row) => row.path),
      wrongVerdict: wiredRows
        .filter((row) => row.verdict !== "wire_into_ci")
        .map((row) => row.path),
      suitesWired: wiredRows.length,
      casesWired: wiredRows.reduce((sum, row) => sum + row.totalTests, 0),
      wiredPaths,
    }).toEqual({
      notGreen: [],
      scanners: [],
      readers: [],
      wrongVerdict: [],
      suitesWired: record.wiring.suitesWired,
      casesWired: record.wiring.casesWired,
      wiredPaths: [
        ...wiredDirectories.flatMap((dir) => directTestFiles(dir)),
        ...namedFiles,
      ].sort(),
    });
  });

  it("judges each wired directory whole, so no unjudged sibling rides along", () => {
    for (const directory of wiredDirectories) {
      const wiredHere = wiredRows
        .filter((row) => row.directory === directory)
        .map((row) => row.path)
        .sort();
      expect({ directory, files: directTestFiles(directory) }).toEqual({
        directory,
        files: wiredHere,
      });
    }
  });

  it("pins each partly wired directory, and its already-covered sibling stays reached", () => {
    const partlyWired = [...new Set(
      wiredRows
        .filter((row) => namedFiles.includes(row.path))
        .map((row) => row.directory),
    )].sort();
    expect(Object.keys(record.pinnedDirectories).sort()).toEqual(partlyWired);
    for (const directory of partlyWired) {
      const { alreadyCovered } = record.pinnedDirectories[directory];
      const drawnHere = record.suites
        .filter((row) => row.directory === directory)
        .map((row) => row.path);
      expect({
        directory,
        files: directTestFiles(directory),
        siblingUnreached: alreadyCovered.filter(
          (suitePath) => !reachedByAMergeBlockingInvocation(suitePath),
        ),
      }).toEqual({
        directory,
        files: [...drawnHere, ...alreadyCovered].sort(),
        siblingUnreached: [],
      });
    }
  });

  it("reaches every wired suite from an invocation that can block a merge", () => {
    expect(resolved.indeterminate).toEqual([]);
    const unreached = wiredRows
      .map((row) => row.path)
      .filter((suitePath) => !reachedByAMergeBlockingInvocation(suitePath));
    expect(unreached).toEqual([]);
  });

  it("keeps every wired directory out of the dark-directory baseline", () => {
    const touched = [...new Set(wiredRows.map((row) => row.directory))];
    expect(touched.filter((dir) => darkBaseline.includes(dir))).toEqual([]);
  });

  it("wires only rows whose own subject a non-test module still imports", () => {
    const importersOf = importGraph(listSource("src"));
    const unimported = wiredRows
      .filter(
        (row) =>
          row.subject === undefined ||
          reachedFromOutside(row.subject, importersOf) === null,
      )
      .map((row) => row.path);
    expect(unimported).toEqual([]);
  });

  it("keeps every held directory out of CI and in the dark baseline", () => {
    expect(heldDirectories.length).toBeGreaterThan(0);
    for (const directory of heldDirectories) {
      const rows = record.suites.filter((suite) => suite.directory === directory);
      const stillHeld = stillHeldRows(directory);
      const superseded = rows.filter((row) => supersededByWiring.has(row.path));
      // A directory is dark only while every row in it is still held.
      expect({
        directory,
        wiredHere: rows.filter((row) => row.wiredInThisItem).length,
        reached: stillHeld
          .map((row) => row.path)
          .filter((suitePath) => reachedByAMergeBlockingInvocation(suitePath)),
        supersededButUnreached: superseded
          .map((row) => row.path)
          .filter((suitePath) => !reachedByAMergeBlockingInvocation(suitePath)),
        inDarkBaseline: darkBaseline.includes(directory),
      }).toEqual({
        directory,
        wiredHere: 0,
        reached: [],
        supersededButUnreached: [],
        inDarkBaseline: superseded.length === 0,
      });
    }
  });

  it("holds each directory for reasons this suite recomputes, not ones it is told", () => {
    const live = askTheLiveCode();
    const reasonHolds: Record<HoldKind, (row: SuiteRow) => boolean> = {
      red: (row) => {
        if (row.green || !row.failingCase || !row.redProbe) return false;
        const text = readFileSync(path.join(repoRoot, row.path), "utf8");
        const answer = live[row.redProbe.kind];
        return (
          text.includes(row.failingCase) &&
          answer === row.redProbe.returnedByCode &&
          answer !== row.redProbe.expectedByTest &&
          askTheTest(row.path, row.failingCase) === "failed"
        );
      },
      source_text_scanner: (row) => {
        if (!row.sourceTextScanner || !row.scannerCase) return false;
        const text = readFileSync(path.join(repoRoot, row.path), "utf8");
        return /from\s+["']node:fs["']/.test(text) && text.includes(row.scannerCase);
      },
    };
    // A held row carries its own reason, or is held beside one that does and
    // says so; a row with neither has no reason to be dark. A red row whose
    // failing case a later item fixed (`redResolved`) carries no reason any
    // more, and must now PASS when asked, so the annotation is checked too.
    const kindOf = (row: SuiteRow): HoldKind | null =>
      row.sourceTextScanner
        ? "source_text_scanner"
        : row.redProbe && !row.redResolved
          ? "red"
          : null;
    for (const directory of heldDirectories) {
      const rows = stillHeldRows(directory);
      // Wholly superseded: the case above proves it is reached instead.
      if (rows.length === 0) continue;
      const { holdKinds, successorFiledAs } = record.heldDirectories[directory];
      expect(holdKinds.length).toBeGreaterThan(0);
      const carriers = rows.filter((row) => kindOf(row) !== null);
      expect({
        directory,
        carriers: carriers.length > 0,
        unexplained: rows
          .filter((row) => kindOf(row) === null && row.heldWithSibling !== true)
          .map((row) => row.path),
        undeclaredKind: carriers
          .filter((row) => !holdKinds.includes(kindOf(row) as HoldKind))
          .map((row) => row.path),
        reasonGone: carriers
          .filter((row) => !reasonHolds[kindOf(row) as HoldKind](row))
          .map((row) => row.path),
        resolvedButNotPassing: rows
          .filter(
            (row) =>
              row.redResolved !== undefined &&
              (!row.failingCase || askTheTest(row.path, row.failingCase) !== "passed"),
          )
          .map((row) => row.path),
        successor: /^T-\d+$/.test(successorFiledAs),
      }).toEqual({
        directory,
        carriers: true,
        unexplained: [],
        undeclaredKind: [],
        reasonGone: [],
        resolvedButNotPassing: [],
        successor: true,
      });
    }
  }, 180_000);
});
