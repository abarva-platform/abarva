import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * Item T-780. T-779 held `src/components/agent-answer/__tests__` and
 * `src/components/context-broker/__tests__` whole, because one suite in each
 * renders a component the unreachable register lists. This item wires the
 * other four suites BY NAMED FILE and leaves those two renders out.
 * `docs/architecture/t780-named-file-triage.json` is the record, and every
 * partition below is read out of it rather than copied here.
 *
 * Wiring one file makes a directory PARTIAL, and the dark-directory ratchet
 * only sees directories with nothing covered — so from this change on it says
 * nothing about these two. These cases stand in for it:
 *
 * 1. **Judged whole, and pinned.** Each directory's on-disk test files equal
 *    the record's rows, so a seventh file added beside them fails here instead
 *    of running nowhere unseen.
 * 2. **Wired rows are reached** by an invocation that can block a merge,
 *    answered through the census's own resolver.
 * 3. **Held rows are reached by nothing** — which is what fails if anyone
 *    replaces the named files with the directory, or adds a held file to the
 *    step — and each still renders a component the register lists. When T-775
 *    mounts or retires one, this goes red and says the hold lost its reason.
 * 4. **Wired subjects are live:** not on the register, and imported by a
 *    non-test module outside the directory.
 * 5. **The asset case is recomputed.** It reads files instead of rendering, so
 *    it is allowed only while every file it reads is under `public/` and the
 *    component serves each by URL.
 * 6. **Supersedes T-779, and wins** by `recordedAt`, the rule
 *    `t770-scanner-wiring-refusal.test.ts` resolves classification by.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const RECORD = "docs/architecture/t780-named-file-triage.json";
const PRIOR_RECORD = "docs/architecture/t779-stale-suite-triage.json";
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
  textIsTheSubject: boolean;
  verdict: string;
  wiredInThisItem: boolean;
  subject?: string;
  unreachableSubject?: string;
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
const prior = readJson<TriageRecord & { suites: SuiteRow[] }>(PRIOR_RECORD);
const unreachable = new Set(readJson<{ orphans: string[] }>(UNREACHABLE_REGISTER).orphans);

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

/** Non-test files outside `outside` that import `subject`. */
function nonTestImporters(subject: string, outside: string, sourceFiles: string[]): string[] {
  return sourceFiles.filter((file) => {
    if (isTestFile(file) || file.startsWith(`${outside}/`)) return false;
    return [...readText(file).matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)].some(
      (match) => resolveSpecifier(file, match[1]) === subject,
    );
  });
}

describe("T-780 — agent-answer and context-broker wired by named file", () => {
  it("judges every file in both directories once, executed, from the vocabulary", () => {
    const onDisk = record.scope.directories
      .flatMap((dir) =>
        readdirSync(path.join(repoRoot, dir))
          .filter((name) => /\.(test|spec)\.tsx?$/.test(name))
          .map((name) => `${dir}/${name}`),
      )
      .sort();
    const rows = record.suites.map((row) => row.path).sort();
    expect({
      files: onDisk,
      count: onDisk.length,
      notRun: record.suites.filter((row) => !row.run).map((row) => row.path),
      offVocabulary: record.suites
        .filter((row) => !record.verdictVocabulary.includes(row.verdict))
        .map((row) => row.path),
    }).toEqual({ files: rows, count: record.scope.testFiles, notRun: [], offVocabulary: [] });
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

  it("reaches every wired file from an invocation that can block a merge", () => {
    // While any invocation is unresolved, "not reached" is a guess.
    expect(resolved.indeterminate).toEqual([]);
    expect(
      wiredRows.map((row) => row.path).filter((p) => mergeBlockingSelectors(p).length === 0),
    ).toEqual([]);
  });

  it("reaches no held file, so neither directory is wired whole", () => {
    expect(heldRows.length).toBeGreaterThan(0);
    expect(
      heldRows
        .map((row) => ({ path: row.path, selectedBy: mergeBlockingSelectors(row.path).length }))
        .filter((row) => row.selectedBy > 0),
    ).toEqual([]);
  });

  it("holds each file for a reason recomputed from the register and the file", () => {
    for (const row of heldRows) {
      const component = row.unreachableSubject
        ? path.basename(row.unreachableSubject, ".tsx")
        : "";
      expect({
        path: row.path,
        onRegister: !!row.unreachableSubject && unreachable.has(row.unreachableSubject),
        rendersIt:
          component !== "" &&
          new RegExp(`import[^;]*\\b${component}\\b[^;]*from`).test(readText(row.path)),
        owner: row.ownerItem,
      }).toEqual({ path: row.path, onRegister: true, rendersIt: true, owner: "T-775" });
    }
  });

  it("wires only subjects that are off the register and imported by a live module", () => {
    const sourceFiles = listSource("src");
    const dead = wiredRows
      .map((row) => {
        const subject = row.subject ?? "";
        const outside = path.posix.dirname(row.directory);
        return {
          path: row.path,
          exists: existsSync(path.join(repoRoot, subject)),
          onRegister: unreachable.has(subject),
          importers: nonTestImporters(subject, outside, sourceFiles).length,
        };
      })
      .filter((row) => !row.exists || row.onRegister || row.importers === 0);
    expect(dead).toEqual([]);
  });

  it("wires a file-reading row only when every file it reads is an asset its subject serves", () => {
    const readers = wiredRows.filter((row) => row.readsRepositoryFileText);
    expect(readers.map((row) => row.path)).toEqual([
      "src/components/agent-answer/__tests__/AvaAskMark.assets.test.ts",
    ]);
    for (const row of readers) {
      const read = [...readText(row.path).matchAll(/["'`]([\w./-]+\.\w+)["'`]/g)]
        .map((match) => match[1])
        .filter((literal) => literal.includes("/"));
      const subjectText = readText(row.subject ?? "");
      expect(read.length).toBeGreaterThan(0);
      expect({
        path: row.path,
        textIsTheSubject: row.textIsTheSubject,
        outsidePublic: read.filter((file) => !file.startsWith("public/")),
        missing: read.filter((file) => !existsSync(path.join(repoRoot, file))),
        notServedBySubject: read.filter(
          (file) => !subjectText.includes(`"${file.slice("public".length)}"`),
        ),
      }).toEqual({
        path: row.path,
        textIsTheSubject: true,
        outsidePublic: [],
        missing: [],
        notServedBySubject: [],
      });
    }
  });

  it("leaves both directories out of the dark baseline, because each is now partial", () => {
    const baseline = readJson<string[]>(DARK_BASELINE);
    expect(record.scope.directories.filter((dir) => baseline.includes(dir))).toEqual([]);
  });

  it("supersedes T-779's held rows for the four wired files with a later record", () => {
    expect(record.recordedAt > prior.recordedAt).toBe(true);
    for (const row of wiredRows) {
      const older = prior.suites.find((suite) => suite.path === row.path);
      expect({ path: row.path, olderWired: older?.wiredInThisItem, olderOwner: older?.ownerItem })
        .toEqual({ path: row.path, olderWired: false, olderOwner: "T-780" });
    }
  });
});
