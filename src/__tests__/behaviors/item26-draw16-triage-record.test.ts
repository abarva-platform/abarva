/**
 * Guard for the sixteenth stale-suite triage draw, recorded under P3 item 26.
 *
 * The draw is READ-ONLY: it judges twenty unrun files and wires none of them.
 * Every case recomputes a claim from the tree rather than trusting the
 * record's own words:
 *
 *  - whether a file reads repository text is re-derived from its bytes, so a
 *    file that reads the tree cannot be declared behavioural and then wired;
 *  - a hold on an unreachable subject is re-asked of the registry that names
 *    it, so the hold loses its reason once the subject is mounted or retired;
 *  - a wiring row's imported subjects are checked against BOTH registries;
 *  - each red row's cause is re-asked of the tree: a pinned tenant count or a
 *    retired tenant key against the tenant registry, a deleted dataset file
 *    against the filesystem. When the cause goes away this control goes red
 *    and says the row must be superseded by a later record;
 *  - a live-corpus hold is re-asked: the corpus root must still exist and
 *    still be named where the row says;
 *  - the committed census must resolve every drawn path to THIS record.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RECORD_PATH = "docs/architecture/item26-draw16-stale-suite-triage.json";
const UNREACHABLE_COMPONENTS = "docs/architecture/unreachable-components.json";
const ORPHANED_LIB_MODULES = "docs/architecture/orphaned-lib-modules.json";
const TENANT_REGISTRY = "datasets/tenant-inputs/tenant-input-registry.json";

type RedCause =
  | {
      kind: "registry_narrowed";
      registry: string;
      pinnedLiteral: string;
      pinnedActiveCount?: number;
      retiredTenantKey?: string;
    }
  | {
      kind: "deleted_dataset_root";
      missingPath: string;
      namedIn: string;
      namedLiteral: string;
    }
  | { kind: "assertion_drift"; assertionLiteral: string };

type Suite = {
  path: string;
  run: boolean;
  green: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  readsRepositoryFileText: boolean;
  sourceTextScanner: boolean;
  textIsTheSubject: boolean;
  verdict: string;
  ownerItem: string;
  unreachableSubject?: { path: string; registry: string; list: string };
  redCause?: RedCause;
  liveCorpusRoot?: string;
  liveCorpusNamedIn?: string;
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

function tenantKeys(list: "activeTenants" | "retiredTenants"): Set<string> {
  const payload = readJson<Record<string, unknown>>(TENANT_REGISTRY);
  const entries = payload[list];
  if (!Array.isArray(entries)) {
    throw new Error(`${TENANT_REGISTRY} has no list named ${list}`);
  }
  return new Set(
    entries.map((entry) =>
      typeof entry === "string" ? entry : (entry as { tenantKey: string }).tenantKey,
    ),
  );
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

describe("item 26 draw 16 stale suite triage record", () => {
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
    // A byte scan, or a file whose subject is text, is never offered for
    // wiring as it stands.
    for (const suite of record.suites.filter(
      (row) => row.sourceTextScanner || row.textIsTheSubject,
    )) {
      expect({ path: suite.path, reads: suite.readsRepositoryFileText }).toEqual({
        path: suite.path,
        reads: true,
      });
      expect(suite.verdict).not.toBe("wire_into_ci");
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
      expect({ path: suite.path, hasSubject: subjects.length > 0 }).toEqual({
        path: suite.path,
        hasSubject: true,
      });
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

  it("holds each red row only while the tree still shows the cause it names", () => {
    const red = record.suites.filter((suite) => !suite.green);
    expect(red.length).toBe(record.scope.redOnRun);
    const active = tenantKeys("activeTenants");
    const retired = tenantKeys("retiredTenants");
    for (const suite of red) {
      expect(suite.verdict).not.toBe("wire_into_ci");
      const cause = suite.redCause;
      expect({ path: suite.path, hasCause: cause !== undefined }).toEqual({
        path: suite.path,
        hasCause: true,
      });
      const testText = readText(suite.path);
      switch (cause!.kind) {
        case "registry_narrowed": {
          expect(cause!.registry).toBe(TENANT_REGISTRY);
          // Exactly one of the two shapes, so a row cannot name neither.
          expect(
            [cause!.pinnedActiveCount, cause!.retiredTenantKey].filter((v) => v !== undefined),
          ).toHaveLength(1);
          expect({
            path: suite.path,
            testStillPins: testText.includes(cause!.pinnedLiteral),
            registryDisagrees:
              cause!.pinnedActiveCount !== undefined
                ? active.size !== cause!.pinnedActiveCount
                : retired.has(cause!.retiredTenantKey!) &&
                  !active.has(cause!.retiredTenantKey!),
          }).toEqual({ path: suite.path, testStillPins: true, registryDisagrees: true });
          break;
        }
        case "deleted_dataset_root":
          expect({
            path: suite.path,
            missingPathExists: existsSync(path.join(ROOT, cause!.missingPath)),
            stillNamed: readText(cause!.namedIn).includes(cause!.namedLiteral),
            literalNamesTheMissingFile: cause!.missingPath.endsWith(cause!.namedLiteral),
          }).toEqual({
            path: suite.path,
            missingPathExists: false,
            stillNamed: true,
            literalNamesTheMissingFile: true,
          });
          break;
        case "assertion_drift":
          // Only allowed on a row already held for another reason.
          expect(suite.verdict).toBe("already_verdicted_elsewhere");
          expect(testText.includes(cause!.assertionLiteral)).toBe(true);
          break;
        default:
          throw new Error(`unknown red cause on ${suite.path}`);
      }
    }
  });

  it("holds a green live-corpus row only while it still reads that corpus", () => {
    const holds = record.suites.filter((suite) => suite.liveCorpusRoot !== undefined);
    expect(holds).toHaveLength(2);
    for (const suite of holds) {
      expect({
        path: suite.path,
        verdict: suite.verdict,
        green: suite.green,
        reads: suite.readsRepositoryFileText,
        corpusExists:
          suite.liveCorpusRoot !== undefined &&
          existsSync(path.join(ROOT, suite.liveCorpusRoot)),
        corpusIsLiveIntake: (suite.liveCorpusRoot ?? "").startsWith(
          "datasets/tenant-inputs/active/",
        ),
        stillNamed:
          suite.liveCorpusNamedIn !== undefined &&
          readText(suite.liveCorpusNamedIn).includes(suite.liveCorpusRoot!),
      }).toEqual({
        path: suite.path,
        verdict: "update_with_reason_recorded",
        green: true,
        reads: true,
        corpusExists: true,
        corpusIsLiveIntake: true,
        stillNamed: true,
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
