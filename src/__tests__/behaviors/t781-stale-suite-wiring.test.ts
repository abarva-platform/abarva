import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * Item T-781, the tenth stale-suite triage draw: ranks 1-5 of the
 * verdict-aware governed-risk ranking, five directories, fifteen drawn files
 * plus one covered sibling, each executed on its own. Two directories are
 * wired; three are held. `docs/architecture/t781-stale-suite-triage.json` is
 * the record, and every partition below is read out of it.
 *
 * The wiring cases are T-779's: reached through the census's own resolver,
 * out of the dark baseline, judged whole, subject still imported by a
 * non-test module.
 *
 * Two things are new in this draw. Three wired suites read repository files —
 * JSONL answer fixtures, which are test data, not the subject — so a wired row
 * may read files only when every read is declared, exists, and is a `.jsonl`
 * under a `fixtures/` directory beside the subject; no wired row may be a
 * source-text scanner. And the holds are of three kinds, each recomputed from
 * something other than the record: a scanner case whose title must still sit
 * in a file that imports `node:fs`; a red case whose disagreement is asked of
 * the live `normalizeCanonicalIndustry`; and a test-only subject that must
 * still be listed `testOnly` in `docs/architecture/orphaned-lib-modules.json`.
 * When the reason goes away, the hold goes red and says so.
 *
 * The live function is called in a `tsx` child process, not imported. This
 * directory runs under the behavior coverage floor, which thresholds an
 * aggregate over every module its suites load; importing `canonical-grounding`
 * loads the pattern-index modules behind it and measured the floor at 89.92
 * lines against 90. The child process asks the same exported function and is
 * not instrumented, so the floor measures what it measured before.
 *
 * A held row can be superseded, by T-779's rule: a triage record beside this
 * one with a later `recordedAt` that wires the row takes it out of the holds.
 * A directory whose every row is superseded must be reached by a merge-blocking
 * invocation and be out of the dark baseline; a partly superseded one keeps its
 * remaining rows held. T-782 supersedes the whole initiative-deep directory.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD = "docs/architecture/t781-stale-suite-triage.json";
const ORPHAN_REGISTER = "docs/architecture/orphaned-lib-modules.json";
const DARK_BASELINE =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

type HoldKind = "red" | "test_only_subject" | "source_text_scanner";

type SuiteRow = {
  path: string;
  directory: string;
  run: boolean;
  green: boolean;
  totalTests: number;
  readsRepositoryFileText: boolean;
  sourceTextScanner: boolean;
  fixtureReads?: string[];
  verdict: string;
  wiredInThisItem: boolean;
  scannerCase?: string;
  testOnlySubject?: string;
  redProbe?: { input: string; expectedByTest: string; returnedByCode: string };
};

type TriageRecord = {
  item: string;
  recordedAt: string;
  verdictVocabulary: string[];
  scope: { drawSize: number };
  wiring: { directories: string[]; suitesWired: number; casesWired: number };
  heldDirectories: Record<string, { successorFiledAs: string; holdKinds: HoldKind[] }>;
  suites: SuiteRow[];
};

const record = JSON.parse(
  readFileSync(path.join(repoRoot, TRIAGE_RECORD), "utf8"),
) as TriageRecord;

const wiredRows = record.suites.filter((suite) => suite.wiredInThisItem);
const wiredDirectories = [...new Set(wiredRows.map((row) => row.directory))].sort();
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

/** Ask the live `normalizeCanonicalIndustry` for each input, out of process. */
function normalizeOutOfProcess(inputs: string[]): Record<string, string | null> {
  const script = [
    'import { normalizeCanonicalIndustry } from "./src/lib/sentinel/canonical-grounding";',
    "const inputs = JSON.parse(process.env.T781_INPUTS ?? '[]');",
    "process.stdout.write(JSON.stringify(Object.fromEntries(",
    "  inputs.map((input) => [input, normalizeCanonicalIndustry(input) ?? null]))));",
  ].join("\n");
  const out = execFileSync(path.join(repoRoot, "node_modules/.bin/tsx"), ["-e", script], {
    cwd: repoRoot,
    env: { ...process.env, T781_INPUTS: JSON.stringify(inputs) },
    encoding: "utf8",
  });
  return JSON.parse(out) as Record<string, string | null>;
}

const testOnlyModules = new Set(
  (
    JSON.parse(readFileSync(path.join(repoRoot, ORPHAN_REGISTER), "utf8")) as {
      testOnly: string[];
    }
  ).testOnly,
);

describe("T-781 — tenth stale-suite draw, wiring and holds", () => {
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

  it("wires only green, non-scanning suites, and states its own totals", () => {
    expect(wiredRows.length).toBeGreaterThan(0);
    expect({
      notGreen: wiredRows.filter((row) => !row.green).map((row) => row.path),
      scanners: wiredRows.filter((row) => row.sourceTextScanner).map((row) => row.path),
      undeclaredReads: wiredRows
        .filter((row) => row.readsRepositoryFileText && !(row.fixtureReads?.length))
        .map((row) => row.path),
      wrongVerdict: wiredRows
        .filter((row) => row.verdict !== "wire_into_ci")
        .map((row) => row.path),
      suitesWired: wiredRows.length,
      casesWired: wiredRows.reduce((sum, row) => sum + row.totalTests, 0),
      directories: wiredDirectories,
    }).toEqual({
      notGreen: [],
      scanners: [],
      undeclaredReads: [],
      wrongVerdict: [],
      suitesWired: record.wiring.suitesWired,
      casesWired: record.wiring.casesWired,
      directories: [...record.wiring.directories].sort(),
    });
  });

  it("lets a wired suite read only JSONL fixture data beside its subject", () => {
    const readers = wiredRows.filter((row) => row.readsRepositoryFileText);
    expect(readers.length).toBeGreaterThan(0);
    for (const row of readers) {
      const fixtureDir = `${subjectDirectory(row.directory)}/fixtures/`;
      const bad = (row.fixtureReads ?? []).filter(
        (file) =>
          !file.startsWith(fixtureDir) ||
          !file.endsWith(".jsonl") ||
          !existsSync(path.join(repoRoot, file)),
      );
      expect({ suite: row.path, bad }).toEqual({ suite: row.path, bad: [] });
    }
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
    expect(resolved.indeterminate).toEqual([]);
    const unreached = wiredRows
      .map((row) => row.path)
      .filter((suitePath) => !reachedByAMergeBlockingInvocation(suitePath));
    expect(unreached).toEqual([]);
  });

  it("keeps every wired directory out of the dark-directory baseline", () => {
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
    const probed = normalizeOutOfProcess(
      record.suites.flatMap((row) => (row.redProbe ? [row.redProbe.input] : [])),
    );
    const reasonHolds: Record<HoldKind, (row: SuiteRow) => boolean> = {
      red: (row) =>
        !row.green &&
        row.redProbe !== undefined &&
        probed[row.redProbe.input] === row.redProbe.returnedByCode &&
        probed[row.redProbe.input] !== row.redProbe.expectedByTest,
      test_only_subject: (row) =>
        row.testOnlySubject !== undefined && testOnlyModules.has(row.testOnlySubject),
      source_text_scanner: (row) => {
        if (!row.sourceTextScanner || !row.scannerCase) return false;
        const text = readFileSync(path.join(repoRoot, row.path), "utf8");
        return /from\s+["']node:fs["']/.test(text) && text.includes(row.scannerCase);
      },
    };
    for (const directory of heldDirectories) {
      const rows = stillHeldRows(directory);
      // Wholly superseded: the case above proves it is reached instead.
      if (rows.length === 0) continue;
      const { holdKinds, successorFiledAs } = record.heldDirectories[directory];
      expect(holdKinds.length).toBeGreaterThan(0);
      expect({
        directory,
        unsupported: holdKinds.filter((kind) => !rows.some(reasonHolds[kind])),
        successor: /^T-\d+$/.test(successorFiledAs),
      }).toEqual({ directory, unsupported: [], successor: true });
    }
  });
});
