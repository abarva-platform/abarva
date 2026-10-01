/**
 * Guard for the seventeenth stale-suite triage draw, recorded under P3 item 26.
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
 *  - each red row's cause is re-asked of the tree: a deleted dataset root
 *    against the filesystem, a retired tenant key against the canonical
 *    tenant declarations, a retired alias against the alias table. When the
 *    cause goes away this control goes red and says the row must be
 *    superseded by a later record;
 *  - the committed census must resolve every drawn path still held to this
 *    record;
 *  - second half: every `wire_into_ci` row must be named in an item 26 draw
 *    17 unit-suites step AND be counted as run by the census, and no held row
 *    may be named in such a step.
 *
 * It imports no `src` module on purpose: the behaviour coverage floor is a
 * directory aggregate, and a control that drags product modules into it moves
 * that floor for reasons unrelated to what it guards.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = process.cwd();
const RECORD_PATH = "docs/architecture/item26-draw17-stale-suite-triage.json";
const UNREACHABLE_COMPONENTS = "docs/architecture/unreachable-components.json";
const ORPHANED_LIB_MODULES = "docs/architecture/orphaned-lib-modules.json";
const CANONICAL_TENANTS = "src/config/tenants/CANONICAL_TENANTS.ts";
const TENANT_ALIASES = "src/lib/tenant/aliases.ts";

type RedCause =
  | {
      kind: "deleted_dataset_root";
      missingPath: string;
      namedIn: string;
      namedLiteral: string;
    }
  | {
      kind: "canonical_tenant_retired";
      registry: string;
      retiredTenantKey: string;
      pinnedLiteral: string;
    }
  | {
      kind: "alias_retired";
      resolver: string;
      expectedCanonicalKey: string;
      retiredBy: string;
    };

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
  wiredInThisItem?: boolean;
  unreachableSubject?: { path: string; registry: string; list: string };
  redCause?: RedCause;
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

/** Tenant keys declared in CANONICAL_TENANTS, by its `key: "..."` entries. */
function declaredCanonicalTenantKeys(): Set<string> {
  return new Set(
    [...readText(CANONICAL_TENANTS).matchAll(/^\s+key:\s*"([a-z0-9-]+)",?\s*$/gm)].map(
      (match) => match[1],
    ),
  );
}

/** Every double-quoted string in the alias table, lower-cased. */
function quotedAliasStrings(): Set<string> {
  return new Set(
    [...readText(TENANT_ALIASES).matchAll(/"([^"\n]+)"/g)].map((match) =>
      match[1].toLowerCase(),
    ),
  );
}

function importedSubjects(testPath: string): string[] {
  return [
    ...readText(testPath).matchAll(/from\s+["'](\.\.?(?:\/[^"']*)?|@\/[^"']+)["']/g),
  ]
    .map((match) => resolveSubject(testPath, match[1]))
    .filter((subject): subject is string => subject !== null);
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

describe("item 26 draw 17 stale suite triage record", () => {
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
      const subjects = importedSubjects(suite.path).filter(
        (subject) => !TEST_SUPPORT.test(subject),
      );
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
        testImportsIt: importedSubjects(suite.path).includes(subject.path),
      }).toEqual({ subject: subject.path, stillListed: true, testImportsIt: true });
    }
  });

  it("holds each red row only while the tree still shows the cause it names", () => {
    const red = record.suites.filter((suite) => !suite.green);
    expect(red.length).toBe(record.scope.redOnRun);
    for (const suite of red) {
      expect(suite.verdict).not.toBe("wire_into_ci");
      const cause = suite.redCause;
      expect({ path: suite.path, hasCause: cause !== undefined }).toEqual({
        path: suite.path,
        hasCause: true,
      });
      const testText = readText(suite.path);
      switch (cause!.kind) {
        case "deleted_dataset_root":
          expect(suite.verdict).toBe("repair");
          expect({
            path: suite.path,
            missingPathExists: existsSync(path.join(ROOT, cause!.missingPath)),
            stillNamed: readText(cause!.namedIn).includes(cause!.namedLiteral),
            literalNamesTheMissingPath: cause!.missingPath.endsWith(cause!.namedLiteral),
          }).toEqual({
            path: suite.path,
            missingPathExists: false,
            stillNamed: true,
            literalNamesTheMissingPath: true,
          });
          break;
        case "canonical_tenant_retired": {
          expect(cause!.registry).toBe(CANONICAL_TENANTS);
          const declared = declaredCanonicalTenantKeys();
          // Calibration: the reader must find the declarations it reads, or
          // "not declared" would be true of every key.
          expect(declared.size).toBeGreaterThan(0);
          expect({
            path: suite.path,
            testStillPins: testText.includes(cause!.pinnedLiteral),
            pinNamesTheKey: cause!.pinnedLiteral.includes(`"${cause!.retiredTenantKey}"`),
            stillDeclared: declared.has(cause!.retiredTenantKey),
          }).toEqual({
            path: suite.path,
            testStillPins: true,
            pinNamesTheKey: true,
            stillDeclared: false,
          });
          break;
        }
        case "alias_retired": {
          expect(cause!.resolver).toBe(TENANT_ALIASES);
          const aliases = quotedAliasStrings();
          // Every input the test expects to resolve to the named canonical key.
          const inputs = [
            ...testText.matchAll(
              /\(\s*"([^"]+)"\s*\)\s*\)\s*\.toBe\(\s*"([^"]+)"\s*,?\s*\)/g,
            ),
          ]
            .filter((match) => match[2] === cause!.expectedCanonicalKey)
            .map((match) => match[1].toLowerCase());
          const retired = inputs.filter((input) => !aliases.has(input));
          const declared = inputs.filter((input) => aliases.has(input));
          // Both directions: one expected input the table still declares
          // (so the reader can see a declaration), and at least one it no
          // longer does (the cause).
          expect({
            path: suite.path,
            someDeclared: declared.length > 0,
            someRetired: retired.length > 0,
          }).toEqual({ path: suite.path, someDeclared: true, someRetired: true });
          break;
        }
        default:
          throw new Error(`unknown red cause on ${suite.path}`);
      }
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
    const stillHeld = record.suites.filter((suite) => suite.verdict !== "wire_into_ci");
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
  it("runs every wire_into_ci row in an item 26 draw 17 unit-suites step, and the census agrees", () => {
    const workflow = yaml.load(readText(".github/workflows/unit-suites.yml")) as {
      jobs: Record<string, { steps?: { name?: string; run?: string }[] }>;
    };
    const commands = Object.values(workflow.jobs)
      .flatMap((job) => job.steps ?? [])
      .filter((step) => (step.name ?? "").includes("item 26 draw 17") && step.run)
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

    const wiring = record.suites.filter((suite) => suite.verdict === "wire_into_ci");
    expect(wiring.length).toBeGreaterThan(0);
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
    // Held rows must NOT have been wired by an item 26 draw 17 step.
    for (const suite of record.suites.filter((s) => s.verdict !== "wire_into_ci")) {
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
