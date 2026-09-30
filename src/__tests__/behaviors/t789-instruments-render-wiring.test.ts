import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * Item T-789, the claimable half. T-788 held `src/lib/instruments/__tests__`
 * whole because `instrument-data-layer-migration.test.ts` asserts literals over
 * the bytes of an applied migration. This item wires its green, behavioural
 * sibling `render.test.ts` BY NAMED FILE; the migration suite stays held, and
 * whether to keep, rewrite or retire it is the gated half, not taken here.
 * `docs/architecture/t789-instruments-render-triage.json` is the record, and
 * every partition below is read out of it.
 *
 * Wiring one file makes the directory PARTIAL, so the dark-directory ratchet
 * stops seeing it. These cases stand in for it, in T-786's shape:
 *
 * 1. **Judged whole, and pinned.** The directory's on-disk test files equal
 *    the record's rows, so a third file added beside them fails here.
 * 2. **Wired rows are reached** by an invocation that can block a merge,
 *    answered through the census's own resolver.
 * 3. **Wired rows read no repository bytes**, recomputed from the file.
 * 4. **Held rows are reached by nothing** — which fails if anyone replaces the
 *    named file with the directory — and each is held for a reason recomputed
 *    from the file: it still imports `node:fs` and still carries its scanner
 *    case. When the gated half retires or rewrites it, this goes red and says
 *    the hold lost its reason.
 * 5. **Wired subjects are live:** imported by a non-test module outside the
 *    test directory.
 * 6. **Supersedes T-788, and wins** by `recordedAt`, the rule T-788's control
 *    already resolves a later record by.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const RECORD = "docs/architecture/t789-instruments-render-triage.json";
const PRIOR_RECORD = "docs/architecture/t788-stale-suite-triage.json";
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
  subject?: string;
  scannerCase?: string;
  ownerItem?: string;
};

type TriageRecord = {
  item: string;
  recordedAt: string;
  verdictVocabulary: string[];
  scope: { directories: string[]; testFiles: number };
  wiring: { namedFiles: string[]; suitesWired: number; casesWired: number };
  suites: SuiteRow[];
};

const readJson = <T,>(relative: string): T =>
  JSON.parse(readFileSync(path.join(repoRoot, relative), "utf8")) as T;
const readText = (relative: string): string =>
  readFileSync(path.join(repoRoot, relative), "utf8");

const record = readJson<TriageRecord>(RECORD);
const prior = readJson<TriageRecord>(PRIOR_RECORD);

const wiredRows = record.suites.filter((row) => row.wiredInThisItem);
const heldRows = record.suites.filter((row) => !row.wiredInThisItem);

const packageScripts = readJson<{ scripts: Record<string, string> }>("package.json").scripts;
const resolved = collectReachableCommands(repoRoot, packageScripts) as {
  reachable: Record<string, unknown>[];
  indeterminate: unknown[];
};

function mergeBlockingSelectors(suitePath: string): Record<string, unknown>[] {
  return resolved.reachable.filter(
    (entry) =>
      entry.pullRequest === true && reachableEntrySelects(repoRoot, entry, suitePath),
  );
}

function listSource(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(path.join(repoRoot, dir))) {
    const relative = `${dir}/${entry}`;
    if (entry === "node_modules") continue;
    if (statSync(path.join(repoRoot, relative)).isDirectory()) out.push(...listSource(relative));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(relative);
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

const importsOf = (file: string): string[] =>
  [...readText(file).matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)].flatMap((match) => {
    const target = resolveSpecifier(file, match[1]);
    return target ? [target] : [];
  });

const importsNodeFs = (file: string): boolean =>
  /(?:from|import\(|require\()\s*["'](?:node:)?fs(?:\/promises)?["']/.test(readText(file));

/** Non-test files outside `outside` that import `subject`. */
function nonTestImporters(subject: string, outside: string, sourceFiles: string[]): string[] {
  return sourceFiles.filter(
    (file) =>
      !isTestFile(file) && !file.startsWith(`${outside}/`) && importsOf(file).includes(subject),
  );
}

const sourceFiles = listSource("src");

describe("T-789 — instruments render suite wired by named file, migration byte-scan held", () => {
  it("judges every file in the directory once, executed, from the vocabulary", () => {
    const onDisk = record.scope.directories
      .flatMap((dir) =>
        readdirSync(path.join(repoRoot, dir))
          .filter((name) => /\.(test|spec)\.tsx?$/.test(name))
          .map((name) => `${dir}/${name}`),
      )
      .sort();
    expect({
      files: onDisk,
      count: onDisk.length,
      notRun: record.suites.filter((row) => !row.run).map((row) => row.path),
      offVocabulary: record.suites
        .filter((row) => !record.verdictVocabulary.includes(row.verdict))
        .map((row) => row.path),
    }).toEqual({
      files: record.suites.map((row) => row.path).sort(),
      count: record.scope.testFiles,
      notRun: [],
      offVocabulary: [],
    });
  });

  it("wires only green rows, states its own totals, and names the same files as the record", () => {
    expect(wiredRows.length).toBeGreaterThan(0);
    expect({
      notGreen: wiredRows.filter((row) => !row.green).map((row) => row.path),
      scanners: wiredRows.filter((row) => row.sourceTextScanner).map((row) => row.path),
      wrongVerdict: wiredRows.filter((row) => row.verdict !== "wire_into_ci").map((row) => row.path),
      suitesWired: wiredRows.length,
      casesWired: wiredRows.reduce((sum, row) => sum + row.totalTests, 0),
      files: wiredRows.map((row) => row.path).sort(),
    }).toEqual({
      notGreen: [],
      scanners: [],
      wrongVerdict: [],
      suitesWired: record.wiring.suitesWired,
      casesWired: record.wiring.casesWired,
      files: [...record.wiring.namedFiles].sort(),
    });
  });

  it("wires no row that reads repository file bytes, recomputed from the file", () => {
    expect(
      wiredRows
        .map((row) => ({ path: row.path, declared: row.readsRepositoryFileText, fs: importsNodeFs(row.path) }))
        .filter((row) => row.declared || row.fs),
    ).toEqual([]);
  });

  it("reaches every wired file from an invocation that can block a merge", () => {
    // While any invocation is unresolved, "not reached" is a guess.
    expect(resolved.indeterminate).toEqual([]);
    expect(
      wiredRows.map((row) => row.path).filter((p) => mergeBlockingSelectors(p).length === 0),
    ).toEqual([]);
  });

  it("reaches no held file, so the directory is not wired whole", () => {
    expect(heldRows.length).toBeGreaterThan(0);
    expect(
      heldRows
        .map((row) => ({ path: row.path, selectedBy: mergeBlockingSelectors(row.path).length }))
        .filter((row) => row.selectedBy > 0),
    ).toEqual([]);
  });

  it("holds each file for a reason recomputed from the file itself", () => {
    for (const row of heldRows) {
      expect({
        path: row.path,
        declaredScanner: row.sourceTextScanner,
        importsNodeFs: importsNodeFs(row.path),
        carriesScannerCase:
          row.scannerCase !== undefined && readText(row.path).includes(row.scannerCase),
        owner: row.ownerItem,
      }).toEqual({
        path: row.path,
        declaredScanner: true,
        importsNodeFs: true,
        carriesScannerCase: true,
        owner: record.item,
      });
    }
  });

  it("wires only subjects that a live module outside the test directory imports", () => {
    const dead = wiredRows
      .map((row) => {
        const subject = row.subject ?? "";
        return {
          path: row.path,
          exists: existsSync(path.join(repoRoot, subject)),
          suiteImportsIt: importsOf(row.path).includes(subject),
          importers: nonTestImporters(subject, row.directory, sourceFiles).length,
        };
      })
      .filter((row) => !row.exists || !row.suiteImportsIt || row.importers === 0);
    expect(dead).toEqual([]);
  });

  it("leaves the directory out of the dark baseline, because it is now partial", () => {
    const baseline = readJson<string[]>(DARK_BASELINE);
    expect(record.scope.directories.filter((dir) => baseline.includes(dir))).toEqual([]);
  });

  it("supersedes T-788's held rows for the wired files with a later record", () => {
    expect(record.recordedAt > prior.recordedAt).toBe(true);
    for (const row of wiredRows) {
      const older = prior.suites.find((suite) => suite.path === row.path);
      expect({ path: row.path, olderWired: older?.wiredInThisItem, olderOwner: older?.ownerItem })
        .toEqual({ path: row.path, olderWired: false, olderOwner: record.item });
    }
  });
});
