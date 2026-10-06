import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * Item T-777. T-776 held `src/lib/security/__tests__` behind one suite that
 * had never passed — it mocked a client module its subject does not import —
 * and that carried a migration-text case, declared `sourceTextScanner: true`.
 * The suite is repaired and the directory is wired.
 * `docs/architecture/t777-security-suite-repair-triage.json` is the record, and
 * every partition below is read out of it rather than copied here.
 *
 * 1. **Judged whole.** Every test file in the directory is a row, so no
 *    unjudged sibling rides along with the wiring step.
 * 2. **Reached.** Every row is selected by an invocation that can block a
 *    merge, answered through the census's own resolver.
 * 3. **Out of the dark baseline.**
 * 4. **Still worth running.** The subject has a non-test importer.
 * 5. **Supersedes, and wins.** The T-776 scanner row for the repaired suite
 *    is superseded by a LATER record, which is how
 *    `t770-scanner-wiring-refusal.test.ts` resolves classification. Asserted
 *    here with both halves — the older row still says scanner, and this record
 *    is newer — so the case cannot pass by the older row having been edited.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const RECORD = "docs/architecture/t777-security-suite-repair-triage.json";
const PRIOR_RECORD = "docs/architecture/t776-stale-suite-triage.json";
const DIRECTORY = "src/lib/security/__tests__";
const REPAIRED = `${DIRECTORY}/quarantine-audit-supabase.test.ts`;
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
  recordedAt: string;
  wiring: { directories: string[]; suitesWired: number; casesWired: number };
  suites: SuiteRow[];
};

const readJson = <T,>(relative: string): T =>
  JSON.parse(readFileSync(path.join(repoRoot, relative), "utf8")) as T;

const record = readJson<TriageRecord>(RECORD);
const prior = readJson<TriageRecord>(PRIOR_RECORD);

const packageScripts = readJson<{ scripts: Record<string, string> }>("package.json").scripts;
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

describe("T-777 — security suite repaired and its directory wired", () => {
  it("judges every test file in the directory, each green and reading no repository file", () => {
    const onDisk = readdirSync(path.join(repoRoot, DIRECTORY))
      .filter((name) => /\.(test|spec)\.tsx?$/.test(name))
      .map((name) => `${DIRECTORY}/${name}`)
      .sort();
    expect(record.suites.map((row) => row.path).sort()).toEqual(onDisk);
    expect({
      notRunOrRed: record.suites.filter((row) => !row.run || !row.green).map((row) => row.path),
      readsText: record.suites
        .filter((row) => row.readsRepositoryFileText || row.sourceTextScanner)
        .map((row) => row.path),
      notWired: record.suites
        .filter((row) => !row.wiredInThisItem || row.verdict !== "wire_into_ci")
        .map((row) => row.path),
      directories: [...new Set(record.suites.map((row) => row.directory))],
      suitesWired: record.suites.length,
      casesWired: record.suites.reduce((sum, row) => sum + row.totalTests, 0),
    }).toEqual({
      notRunOrRed: [],
      readsText: [],
      notWired: [],
      directories: record.wiring.directories,
      suitesWired: record.wiring.suitesWired,
      casesWired: record.wiring.casesWired,
    });
  });

  it("reaches every suite in the directory from an invocation that can block a merge", () => {
    // While any invocation is unresolved, "not reached" is a guess.
    expect(resolved.indeterminate).toEqual([]);
    const unreached = record.suites
      .map((row) => row.path)
      .filter((suitePath) => !reachedByAMergeBlockingInvocation(suitePath));
    expect(unreached).toEqual([]);
  });

  it("removes the directory from the dark-directory baseline", () => {
    expect(readJson<string[]>(DARK_BASELINE)).not.toContain(DIRECTORY);
  });

  it("wires a directory whose subject a non-test module still imports", () => {
    const subject = DIRECTORY.slice(0, -"/__tests__".length);
    const importers = listSource("src").filter((file) => {
      if (isTestFile(file) || file.startsWith(`${subject}/`)) return false;
      const text = readFileSync(path.join(repoRoot, file), "utf8");
      return [...text.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)].some((match) => {
        const target = resolveSpecifier(file, match[1]);
        return target !== null && target.startsWith(`${subject}/`) && !isTestFile(target);
      });
    });
    expect(importers.length).toBeGreaterThan(0);
  });

  it("supersedes the T-776 scanner row for the repaired suite with a later record", () => {
    const olderRow = prior.suites.find((row) => row.path === REPAIRED);
    const newerRow = record.suites.find((row) => row.path === REPAIRED);
    expect({
      olderSaidScanner: olderRow?.sourceTextScanner,
      newerSaysScanner: newerRow?.sourceTextScanner,
      newerIsLater: record.recordedAt > prior.recordedAt,
    }).toEqual({ olderSaidScanner: true, newerSaysScanner: false, newerIsLater: true });
  });
});
