import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";
import { isCanonicalClientKey } from "@/lib/governance/context-corpus-policy";

/**
 * Item T-779, the ninth stale-suite triage draw: ranks 1-5 of the
 * verdict-aware governed-risk ranking, five fully-unrun directories, eighteen
 * files, each executed on its own. Two directories are wired; three are held.
 * `docs/architecture/t779-stale-suite-triage.json` is the record, and every
 * partition below is read out of it rather than copied here.
 *
 * The wiring cases are T-776's, unchanged: reached through the census's own
 * resolver, out of the dark baseline, judged whole, subject still imported.
 *
 * The hold case differs, because none of this draw's holds is a source-text
 * scanner. A hold is only a claim if something can contradict it, so each held
 * directory must (a) be reached by NO merge-blocking invocation, (b) stay in
 * the dark baseline, and (c) carry a reason this suite can recompute: a row
 * whose rendered subject is listed in
 * `docs/architecture/unreachable-components.json` (read from that register),
 * or a red row whose cause is asked of the live gate: the governed policy's
 * `isCanonicalClientKey` must still refuse the tenant key the red case uses.
 * A row's own `green: false` is NOT accepted as the reason, because that is the
 * record vouching for itself. When item 51 widens the key list or the
 * component is mounted, (c) goes red and says the hold has lost its reason.
 *
 * A held row can be superseded. T-780 wires four rows of the two
 * unreachable-sibling directories by named file, in a LATER triage record —
 * the latest `recordedAt` wins, which is the rule
 * `t770-scanner-wiring-refusal.test.ts` resolves by. Only a row that later
 * record both names and marks `wiredInThisItem` is released from (a), and a
 * directory holding such a row leaves the dark baseline because it is PARTIAL
 * rather than dark. Every row nobody superseded is held exactly as before.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD = "docs/architecture/t779-stale-suite-triage.json";
const UNREACHABLE_REGISTER = "docs/architecture/unreachable-components.json";
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
  unreachableSubject?: string;
  blockedClientKey?: string;
};

type TriageRecord = {
  item: string;
  verdictVocabulary: string[];
  scope: { drawSize: number };
  wiring: { directories: string[]; suitesWired: number; casesWired: number };
  heldDirectories: Record<
    string,
    { successorFiledAs: string; holdKind: "red" | "unreachable_sibling" }
  >;
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

describe("T-779 — ninth stale-suite draw, wiring and holds", () => {
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

  it("keeps every held directory out of CI and in the dark baseline", () => {
    expect(heldDirectories.length).toBeGreaterThan(0);
    for (const directory of heldDirectories) {
      const rows = record.suites.filter((suite) => suite.directory === directory);
      const stillHeld = rows.filter((row) => !supersededByWiring.has(row.path));
      // A directory is dark only while every row in it is still held.
      const partial = stillHeld.length < rows.length;
      expect(stillHeld.length).toBeGreaterThan(0);
      expect({
        directory,
        wiredHere: rows.filter((row) => row.wiredInThisItem).length,
        reached: stillHeld
          .map((row) => row.path)
          .filter((suitePath) => reachedByAMergeBlockingInvocation(suitePath)),
        inDarkBaseline: darkBaseline.includes(directory),
      }).toEqual({ directory, wiredHere: 0, reached: [], inDarkBaseline: !partial });
    }
  });

  it("holds each directory for a reason this suite recomputes, not one it is told", () => {
    const unreachable = new Set(
      (
        JSON.parse(
          readFileSync(path.join(repoRoot, UNREACHABLE_REGISTER), "utf8"),
        ) as { orphans: string[] }
      ).orphans,
    );
    for (const directory of heldDirectories) {
      const rows = record.suites.filter((suite) => suite.directory === directory);
      const { holdKind, successorFiledAs } = record.heldDirectories[directory];
      const rendersUnreachable = rows.filter((row) => {
        if (!row.unreachableSubject || !unreachable.has(row.unreachableSubject)) {
          return false;
        }
        const text = readFileSync(path.join(repoRoot, row.path), "utf8");
        const component = path.basename(row.unreachableSubject, ".tsx");
        return new RegExp(`import[^;]*\\b${component}\\b[^;]*from`).test(text);
      });
      expect({
        directory,
        holdKind,
        reasonHolds:
          holdKind === "red"
            ? rows.some(
                (row) =>
                  !row.green &&
                  typeof row.blockedClientKey === "string" &&
                  !isCanonicalClientKey(row.blockedClientKey),
              )
            : rendersUnreachable.length > 0,
        successor: /^(T-\d+|item \d+)$/.test(successorFiledAs),
      }).toEqual({ directory, holdKind, reasonHolds: true, successor: true });
    }
  });
});
