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
 *  - the committed census must resolve every drawn path to THIS record.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

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

  it("holds each red row only while the stale literal is still in the test and gone from the source", () => {
    const red = record.suites.filter((suite) => !suite.green);
    expect(red.length).toBe(record.scope.redOnRun);
    for (const suite of red) {
      expect(suite.verdict).not.toBe("wire_into_ci");
      const cause = suite.redCause;
      expect(cause?.kind).toBe("stale_label");
      const source = readText(cause!.labelSource);
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

  it("is the verdict the committed census resolves for every drawn path", () => {
    const census = readJson<{
      triageVerdicts: {
        heldTestPaths: { testPath: string; verdict: string; record: string }[];
      };
    }>("docs/architecture/test-ci-coverage-census.json");
    const held = new Map(
      census.triageVerdicts.heldTestPaths.map((row) => [row.testPath, row]),
    );
    for (const suite of record.suites) {
      const row = held.get(suite.path);
      expect({ path: suite.path, record: row?.record, verdict: row?.verdict }).toEqual({
        path: suite.path,
        record: RECORD_PATH,
        verdict: suite.verdict,
      });
    }
  });
});
