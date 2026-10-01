/**
 * Guard for the fifteenth stale-suite triage draw, recorded under P3 item 26.
 *
 * The draw is READ-ONLY: it judges twenty unrun files and wires none of them.
 * Every case recomputes a claim from the tree rather than trusting the
 * record's own words:
 *
 *  - whether a file reads repository text is re-derived from its bytes, so a
 *    byte scan cannot be declared behavioural and then wired;
 *  - a hold on an unreachable subject is re-asked of the registry that names
 *    it (`unreachable-components.json` orphans or `orphaned-lib-modules.json`
 *    testOnly), so the hold loses its reason once the subject is mounted or
 *    retired;
 *  - a wiring row's imported subjects are checked against BOTH registries;
 *  - each red row's stale literal is re-asked of the test and of the source
 *    that changed, so when either is fixed this control goes red and says the
 *    row must be superseded by a later record;
 *  - the committed census must resolve every drawn path still held to THIS
 *    record;
 *  - second half: every `wire_into_ci` row must be named in an item 26 draw
 *    15 unit-suites step AND be counted as run by the census, and no held row
 *    may be named in such a step.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = process.cwd();
const RECORD_PATH = "docs/architecture/item26-draw15-stale-suite-triage.json";
const UNREACHABLE_COMPONENTS = "docs/architecture/unreachable-components.json";
const ORPHANED_LIB_MODULES = "docs/architecture/orphaned-lib-modules.json";

type Suite = {
  path: string;
  run: boolean;
  green: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  readsRepositoryFileText: boolean;
  sourceTextScanner: boolean;
  verdict: string;
  ownerItem: string;
  wiredInThisItem?: boolean;
  updated?: {
    updatedInThisItem: boolean;
    reExecutedOn: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
  rewritten?: {
    rewrittenInThisItem: boolean;
    reExecutedOn: string;
    drawnReadsRepositoryFileText: boolean;
    drawnSourceTextScanner: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
  unreachableSubject?: { path: string; registry: string; list: string };
  redCause?: {
    kind: "stale_label";
    labelSource: string;
    expectedLiteral: string;
    currentLiteral: string;
  };
};

type TriageRecord = {
  item: string;
  base: string;
  verdictVocabulary: string[];
  scope: { drawSize: number; greenOnRun: number; redOnRun: number };
  counts: Record<string, number>;
  suites: Suite[];
};

const readText = (relative: string) =>
  readFileSync(path.join(ROOT, relative), "utf8");
const readJson = <T>(relative: string) => JSON.parse(readText(relative)) as T;

const record = readJson<TriageRecord>(RECORD_PATH);

// A row is RUN by an item 26 draw 15 step when its verdict was wire_into_ci, or
// when it was a stale-label update or a behaviour rewrite that this item has
// since applied. Every other row is a hold and must stay unwired.
const isRunRow = (suite: Suite) =>
  suite.verdict === "wire_into_ci" ||
  suite.updated?.updatedInThisItem === true ||
  suite.rewritten?.rewrittenInThisItem === true;

const READS_REPOSITORY_TEXT =
  /readFileSync|from ["'](?:node:)?fs(?:\/promises)?["']|process\.cwd\(\)|__dirname/;

const TEST_SUPPORT = /\/_test-[^/]+\.tsx?$|\/__fixtures__\/|\/test-support\//;

function registryList(registry: string, list: string): Set<string> {
  const payload = readJson<Record<string, unknown>>(registry);
  const entries = payload[list];
  if (!Array.isArray(entries)) {
    throw new Error(`${registry} has no list named ${list}`);
  }
  return new Set(entries as string[]);
}

function resolveSubject(testPath: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? `src/${specifier.slice(2)}`
    : path.posix.join(path.posix.dirname(testPath), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (/\.tsx?$/.test(candidate) && existsSync(path.join(ROOT, candidate))) {
      return candidate;
    }
  }
  return null;
}

describe("item 26 draw 15 stale suite triage record", () => {
  it("draws twenty existing files, each named once", () => {
    expect(record.item).toBe("26");
    expect(record.base).toMatch(/^[0-9a-f]{40}$/);
    expect(record.suites).toHaveLength(20);
    expect(record.scope.drawSize).toBe(20);
    const paths = record.suites.map((suite) => suite.path);
    expect(new Set(paths).size).toBe(20);
    for (const testPath of paths) {
      expect({ testPath, exists: existsSync(path.join(ROOT, testPath)) }).toEqual({
        testPath,
        exists: true,
      });
    }
  });

  it("judges no file another triage record already judged", () => {
    const mine = new Set(record.suites.map((suite) => suite.path));
    const others = readdirSync(path.join(ROOT, "docs/architecture")).filter(
      (file) =>
        /triage.*\.json$/.test(file) && `docs/architecture/${file}` !== RECORD_PATH,
    );
    expect(others.length).toBeGreaterThan(0);
    const reJudged: string[] = [];
    for (const file of others) {
      let payload: { suites?: { path?: unknown }[] };
      try {
        payload = readJson(`docs/architecture/${file}`);
      } catch {
        continue;
      }
      for (const suite of payload.suites ?? []) {
        if (typeof suite.path === "string" && mine.has(suite.path)) {
          reJudged.push(`${suite.path} in ${file}`);
        }
      }
    }
    expect(reJudged).toEqual([]);
  });

  it("publishes counts that the rows themselves add up to", () => {
    const counts: Record<string, number> = {};
    for (const suite of record.suites) {
      expect(record.verdictVocabulary).toContain(suite.verdict);
      counts[suite.verdict] = (counts[suite.verdict] ?? 0) + 1;
    }
    expect(counts).toEqual(record.counts);
    expect(record.suites.filter((suite) => suite.green)).toHaveLength(
      record.scope.greenOnRun,
    );
    expect(record.suites.filter((suite) => !suite.green)).toHaveLength(
      record.scope.redOnRun,
    );
  });

  it("calls a row green only when it ran with every case passing", () => {
    for (const suite of record.suites) {
      expect(suite.run).toBe(true);
      expect(suite.totalTests).toBeGreaterThan(0);
      expect(suite.passedTests + suite.failedTests).toBe(suite.totalTests);
      expect({ path: suite.path, green: suite.green }).toEqual({
        path: suite.path,
        green: suite.failedTests === 0,
      });
    }
  });

  it("re-derives from each file's bytes whether it reads repository text", () => {
    for (const suite of record.suites) {
      const reads = READS_REPOSITORY_TEXT.test(readText(suite.path));
      expect({ path: suite.path, reads: suite.readsRepositoryFileText }).toEqual({
        path: suite.path,
        reads,
      });
    }
    for (const suite of record.suites.filter((row) => row.sourceTextScanner)) {
      expect({ path: suite.path, verdict: suite.verdict }).toEqual({
        path: suite.path,
        verdict: "rewrite_as_behavior",
      });
    }
  });

  it("offers for wiring only green, behavioural suites whose subjects both registries call reachable", () => {
    const unreachable = new Set([
      ...registryList(UNREACHABLE_COMPONENTS, "orphans"),
      ...registryList(ORPHANED_LIB_MODULES, "testOnly"),
      ...registryList(ORPHANED_LIB_MODULES, "unreferenced"),
    ]);
    const wiring = record.suites.filter((suite) => suite.verdict === "wire_into_ci");
    expect(wiring.length).toBeGreaterThan(0);
    for (const suite of wiring) {
      expect({ path: suite.path, green: suite.green, reads: suite.readsRepositoryFileText }).toEqual({
        path: suite.path,
        green: true,
        reads: false,
      });
      const subjects = [
        ...readText(suite.path).matchAll(/from\s+["'](\.\.?\/[^"']+|@\/[^"']+)["']/g),
      ]
        .map((match) => resolveSubject(suite.path, match[1]))
        .filter((subject): subject is string => subject !== null)
        // A test helper is testOnly by construction; it is not the subject.
        .filter((subject) => !TEST_SUPPORT.test(subject));
      const held = subjects.filter((subject) => unreachable.has(subject));
      expect({ path: suite.path, unreachableSubjects: held }).toEqual({
        path: suite.path,
        unreachableSubjects: [],
      });
    }
  });

  it("holds an unreachable subject only while its registry still lists it", () => {
    const held = record.suites.filter((suite) => suite.unreachableSubject);
    expect(held.length).toBe(record.counts.already_verdicted_elsewhere);
    for (const suite of held) {
      expect(suite.verdict).toBe("already_verdicted_elsewhere");
      expect(suite.ownerItem).toBe("T-775");
      const subject = suite.unreachableSubject!;
      expect([UNREACHABLE_COMPONENTS, ORPHANED_LIB_MODULES]).toContain(subject.registry);
      expect({
        subject: subject.path,
        stillListed: registryList(subject.registry, subject.list).has(subject.path),
        testImportsIt: readText(suite.path).includes(
          path.posix.basename(subject.path).replace(/\.tsx?$/, ""),
        ),
      }).toEqual({ subject: subject.path, stillListed: true, testImportsIt: true });
    }
  });

  it("holds each red row only while the stale literal is still in the test and gone from the source, unless its update was applied", () => {
    const red = record.suites.filter((suite) => !suite.green);
    expect(red.length).toBe(record.scope.redOnRun);
    for (const suite of red) {
      expect(suite.verdict).not.toBe("wire_into_ci");
      const cause = suite.redCause;
      expect(cause?.kind).toBe("stale_label");
      const source = readText(cause!.labelSource);
      if (suite.updated?.updatedInThisItem) {
        // Applied: the old literal is gone from the test, the source still
        // carries the current label, and the test reads the label from that
        // source module instead of re-typing it. The re-execution must be green.
        const labelModule = cause!.labelSource.replace(/^src\//, "@/").replace(/\.tsx?$/, "");
        const testText = readText(suite.path);
        expect({
          path: suite.path,
          testStillExpectsOldLiteral: testText.includes(cause!.expectedLiteral),
          testRetypesCurrentLiteral: testText.includes(cause!.currentLiteral),
          sourceHasCurrentLiteral: source.includes(cause!.currentLiteral),
          testImportsLabelSource: testText.includes(`from "${labelModule}"`),
          reExecutedGreen:
            suite.updated.failedTests === 0 &&
            suite.updated.passedTests === suite.updated.totalTests &&
            suite.updated.totalTests > 0,
          wiredInThisItem: suite.wiredInThisItem,
        }).toEqual({
          path: suite.path,
          testStillExpectsOldLiteral: false,
          testRetypesCurrentLiteral: false,
          sourceHasCurrentLiteral: true,
          testImportsLabelSource: true,
          reExecutedGreen: true,
          wiredInThisItem: true,
        });
        continue;
      }
      expect({
        path: suite.path,
        testStillExpectsOldLiteral: readText(suite.path).includes(cause!.expectedLiteral),
        sourceLacksOldLiteral: !source.includes(cause!.expectedLiteral),
        sourceHasCurrentLiteral: source.includes(cause!.currentLiteral),
      }).toEqual({
        path: suite.path,
        testStillExpectsOldLiteral: true,
        sourceLacksOldLiteral: true,
        sourceHasCurrentLiteral: true,
      });
    }
  });

  // A rewrite_as_behavior row is held while it is still a byte scan. Once the
  // rewrite is applied the row must say so, and the file must prove it: no
  // repository text (re-derived from its bytes), not one of the literals the
  // scan matched, an import of the subject it now CALLS, and a green
  // re-execution. The draw-time classification survives in `rewritten.drawn*`.
  it("holds a rewrite_as_behavior row while it still scans bytes, and accepts it only once the file calls its subject", () => {
    const rewrites = record.suites.filter((suite) => suite.verdict === "rewrite_as_behavior");
    expect(rewrites).toHaveLength(record.counts.rewrite_as_behavior);
    for (const suite of rewrites) {
      const testText = readText(suite.path);
      if (!suite.rewritten?.rewrittenInThisItem) {
        expect({ path: suite.path, scansBytes: READS_REPOSITORY_TEXT.test(testText) }).toEqual({
          path: suite.path,
          scansBytes: true,
        });
        continue;
      }
      expect({
        path: suite.path,
        classifiedNow: [suite.readsRepositoryFileText, suite.sourceTextScanner],
        classifiedAtDraw: [
          suite.rewritten.drawnReadsRepositoryFileText,
          suite.rewritten.drawnSourceTextScanner,
        ],
        readsRepositoryText: READS_REPOSITORY_TEXT.test(testText),
        stillMatchesParameterLiteral: testText.includes(
          "initialToolChoice?: AnthropicMessageStreamParams['tool_choice']",
        ),
        stillMatchesSpreadLiteral: testText.includes("turn === 1 && args.initialToolChoice"),
        importsSubject: testText.includes("from './toolUseLoop'"),
        reExecutedGreen:
          suite.rewritten.failedTests === 0 &&
          suite.rewritten.passedTests === suite.rewritten.totalTests &&
          suite.rewritten.totalTests > 0,
        wiredInThisItem: suite.wiredInThisItem,
      }).toEqual({
        path: suite.path,
        classifiedNow: [false, false],
        classifiedAtDraw: [true, true],
        readsRepositoryText: false,
        stillMatchesParameterLiteral: false,
        stillMatchesSpreadLiteral: false,
        importsSubject: true,
        reExecutedGreen: true,
        wiredInThisItem: true,
      });
    }
  });

  it("is the verdict the committed census resolves for every drawn path still held", () => {
    const census = readJson<{
      triageVerdicts: {
        heldTestPaths: { testPath: string; verdict: string; record: string }[];
      };
    }>("docs/architecture/test-ci-coverage-census.json");
    const held = new Map(
      census.triageVerdicts.heldTestPaths.map((row) => [row.testPath, row]),
    );
    const stillHeld = record.suites.filter((suite) => !isRunRow(suite));
    expect(stillHeld.length).toBeGreaterThan(0);
    for (const suite of stillHeld) {
      const row = held.get(suite.path);
      expect({ path: suite.path, record: row?.record, verdict: row?.verdict }).toEqual({
        path: suite.path,
        record: RECORD_PATH,
        verdict: suite.verdict,
      });
    }
  });

  // Second half (wiring). A `wire_into_ci` row is no longer a hold: it must be
  // RUN. That is asked of two independent places — the workflow a pull request
  // executes, and the census computed from it — so neither the record's own
  // `wiredInThisItem` flag nor a comment in the YAML can satisfy it.
  it("runs every wire_into_ci row and every applied update in an item 26 draw 15 unit-suites step, and the census agrees", () => {
    const workflow = yaml.load(readText(".github/workflows/unit-suites.yml")) as {
      jobs: Record<string, { steps?: { name?: string; run?: string }[] }>;
    };
    const commands = Object.values(workflow.jobs)
      .flatMap((job) => job.steps ?? [])
      .filter((step) => (step.name ?? "").includes("item 26 draw 15") && step.run)
      .map((step) => {
        // A `>-` block folds to ONE shell line, so a `#` inside it is not a
        // YAML comment but a shell one: every word after it is never passed
        // to jest. Cut there, as the shell does.
        const all = (step.run ?? "").split(/\s+/);
        const comment = all.findIndex((w) => w.startsWith("#"));
        const words = (comment === -1 ? all : all.slice(0, comment)).map((w) =>
          w.replace(/^"|"$/g, ""),
        );
        return { byPath: words.includes("--runTestsByPath"), words };
      });
    expect(commands.length).toBeGreaterThan(0);

    const census = readJson<{
      triageVerdicts: { heldTestPaths: { testPath: string }[] };
      uncoveredDirectories: { directory: string }[];
    }>("docs/architecture/test-ci-coverage-census.json");
    const held = new Set(census.triageVerdicts.heldTestPaths.map((row) => row.testPath));
    const dark = new Set(census.uncoveredDirectories.map((row) => row.directory));

    const wiring = record.suites.filter(isRunRow);
    for (const suite of wiring) {
      const named = commands.some(({ byPath, words }) =>
        byPath
          ? words.includes(suite.path)
          : words.includes(path.posix.dirname(suite.path)),
      );
      expect({
        path: suite.path,
        wiredInThisItem: suite.wiredInThisItem,
        namedInStep: named,
        stillHeldByCensus: held.has(suite.path),
        directoryDark: dark.has(path.posix.dirname(suite.path)),
      }).toEqual({
        path: suite.path,
        wiredInThisItem: true,
        namedInStep: true,
        stillHeldByCensus: false,
        directoryDark: false,
      });
    }
    // Held rows must NOT have been wired by an item 26 draw 15 step.
    for (const suite of record.suites.filter((s) => !isRunRow(s))) {
      const named = commands.some(({ words }) =>
        words.includes(suite.path) || words.includes(path.posix.dirname(suite.path)),
      );
      expect({ path: suite.path, namedInStep: named }).toEqual({
        path: suite.path,
        namedInStep: false,
      });
    }
  });
});
