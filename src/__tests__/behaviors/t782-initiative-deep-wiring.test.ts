import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * Item T-782. T-781 held `src/lib/atlas/initiative-deep/__tests__` for one case
 * that asserted over the bytes of nine source files. That case is replaced by
 * behavioural probes and the directory is wired whole.
 * `docs/architecture/t782-initiative-deep-triage.json` is the record, and each
 * case below reads its partition out of it.
 *
 * 1. **Judged whole.** The directory's on-disk test files equal the record's
 *    rows, so a file added beside them is judged before it rides along.
 * 2. **Reached** by an invocation that can block a merge, answered through the
 *    census's own resolver rather than by reading the workflow text.
 * 3. **Out of the dark baseline**, in the same change that wires it.
 * 4. **No row reads repository files.** Recomputed from the suites' imports,
 *    not from the record's flags: the rewrite removed the only `node:fs` import.
 * 5. **The subject is live:** the Atlas composer imports the entry point the
 *    suites test by value, not only its types.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const TRIAGE_RECORD = "docs/architecture/t782-initiative-deep-triage.json";
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

const record = JSON.parse(
  readFileSync(path.join(repoRoot, TRIAGE_RECORD), "utf8"),
) as {
  item: string;
  wiring: { directories: string[]; suitesWired: number; casesWired: number };
  suites: SuiteRow[];
};

const [directory] = record.wiring.directories;
const subject = directory.slice(0, -"/__tests__".length);

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

describe("T-782 — initiative-deep wired whole after the byte case is rewritten", () => {
  it("names exactly one directory and states its own totals", () => {
    expect({
      directories: record.wiring.directories.length,
      suitesWired: record.suites.filter((row) => row.wiredInThisItem).length,
      casesWired: record.suites.reduce((sum, row) => sum + row.totalTests, 0),
      notGreenOrNotRun: record.suites
        .filter((row) => !row.run || !row.green)
        .map((row) => row.path),
      wrongVerdict: record.suites
        .filter((row) => row.verdict !== "wire_into_ci")
        .map((row) => row.path),
    }).toEqual({
      directories: 1,
      suitesWired: record.wiring.suitesWired,
      casesWired: record.wiring.casesWired,
      notGreenOrNotRun: [],
      wrongVerdict: [],
    });
  });

  it("judges the directory whole", () => {
    const onDisk = readdirSync(path.join(repoRoot, directory))
      .filter((name) => /\.(test|spec)\.tsx?$/.test(name))
      .map((name) => `${directory}/${name}`)
      .sort();
    expect(onDisk).toEqual(record.suites.map((row) => row.path).sort());
  });

  it("reaches every suite from an invocation that can block a merge", () => {
    expect(resolved.indeterminate).toEqual([]);
    expect(
      record.suites
        .map((row) => row.path)
        .filter((suitePath) => !reachedByAMergeBlockingInvocation(suitePath)),
    ).toEqual([]);
  });

  it("takes the directory out of the dark baseline", () => {
    const darkBaseline = JSON.parse(
      readFileSync(path.join(repoRoot, DARK_BASELINE), "utf8"),
    ) as string[];
    expect(darkBaseline).not.toContain(directory);
  });

  it("wires no suite that reads repository files", () => {
    const readers = record.suites
      .map((row) => row.path)
      .filter((suitePath) =>
        /from\s+["'](node:)?fs(\/promises)?["']|require\(\s*["'](node:)?fs["']\s*\)/.test(
          readFileSync(path.join(repoRoot, suitePath), "utf8"),
        ),
      );
    expect(readers).toEqual([]);
  });

  it("wires a subject that a non-test module still imports by value", () => {
    // `src/lib/agent/retrieval.ts` imports only types from the subject, which
    // erase at build; the composer is the value importer the product reaches.
    const valueImport = new RegExp(
      `^import\\s+\\{[^}]*\\bgetInitiativeDeepView\\b[^}]*\\}\\s+from\\s+["']@/${subject.slice(4)}/retrieve["']`,
      "m",
    );
    expect(
      valueImport.test(
        readFileSync(path.join(repoRoot, "src/lib/atlas/composition/compose.ts"), "utf8"),
      ),
    ).toBe(true);
  });
});
