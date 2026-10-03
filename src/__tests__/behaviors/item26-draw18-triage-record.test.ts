/**
 * Guard for the eighteenth stale-suite triage draw, recorded under P3 item 26.
 *
 * The draw judged the nineteen unrun files the ranking still held; its second
 * half applies and wires rows one claim at a time. Every case recomputes a
 * claim from the tree rather than trusting the record's own words:
 *
 *  - whether a file reads repository text is re-derived from its bytes, so a
 *    file that reads the tree cannot be declared behavioural and then wired;
 *  - a hold on an unreachable subject is re-asked of the registry that names
 *    it, so the hold loses its reason once the subject is mounted or retired;
 *  - a wiring row's imported subjects are checked against BOTH registries;
 *  - the red row's cause is re-asked of the tree: the product resolves a
 *    tenant key by matching a display name, and no declared display name
 *    matches it while the intended key is still declared. Once the record
 *    says the repair is applied, the resolver must no longer match by name,
 *    must resolve the intended declared key, and the test must still expect
 *    rows in the tenant section;
 *  - every row the record says this item has run (an applied repair, or a
 *    wired row) must be named in an item 26 draw 18 unit-suites step AND be
 *    counted as run by the census, and no other row may be named in one;
 *  - the committed census must resolve every drawn path still held to this
 *    record.
 *
 * It imports no `src` module on purpose: the behaviour coverage floor is a
 * directory aggregate, and a control that drags product modules into it moves
 * that floor for reasons unrelated to what it guards.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = process.cwd();
const RECORD_PATH = "docs/architecture/item26-draw18-stale-suite-triage.json";
const UNREACHABLE_COMPONENTS = "docs/architecture/unreachable-components.json";
const ORPHANED_LIB_MODULES = "docs/architecture/orphaned-lib-modules.json";
const CANONICAL_TENANTS = "src/config/tenants/CANONICAL_TENANTS.ts";

type RedCause = {
  kind: "display_name_derived_key_unresolved";
  resolver: string;
  nameMatcherLiteral: string;
  registry: string;
  intendedTenantKey: string;
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
  repaired?: {
    repairedInThisItem: boolean;
    reExecutedOn: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    resolvesByDeclaredKey: string;
  };
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

// A row is RUN by an item 26 draw 18 step once this item has applied its repair
// or wired it. Every other row is still a hold and must stay unwired.
const isRunRow = (suite: Suite) =>
  suite.repaired?.repairedInThisItem === true || suite.wiredInThisItem === true;

const reExecutedGreen = (suite: Suite) =>
  suite.repaired !== undefined &&
  suite.repaired.failedTests === 0 &&
  suite.repaired.passedTests === suite.repaired.totalTests &&
  suite.repaired.totalTests > 0;

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

/** Display names declared in CANONICAL_TENANTS, by its `name: "..."` entries. */
function declaredCanonicalTenantNames(): string[] {
  return [...readText(CANONICAL_TENANTS).matchAll(/^\s+name:\s*"([^"\n]+)",?\s*$/gm)].map(
    (match) => match[1],
  );
}

/** A `/source/flags` literal as written in the product file, as a RegExp. */
function regExpFromLiteral(literal: string): RegExp {
  const parsed = /^\/(.+)\/([a-z]*)$/.exec(literal);
  if (!parsed) throw new Error(`not a regular-expression literal: ${literal}`);
  return new RegExp(parsed[1], parsed[2]);
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

describe("item 26 draw 18 stale suite triage record", () => {
  it("draws nineteen existing files, each named once", () => {
    expect(record.item).toBe("26");
    expect(record.base).toMatch(/^[0-9a-f]{40}$/);
    expect(record.suites).toHaveLength(19);
    expect(record.scope.drawSize).toBe(19);
    const paths = record.suites.map((suite) => suite.path);
    expect(new Set(paths).size).toBe(19);
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
        case "display_name_derived_key_unresolved": {
          expect(suite.verdict).toBe("repair");
          expect(cause!.registry).toBe(CANONICAL_TENANTS);
          const names = declaredCanonicalTenantNames();
          const keys = declaredCanonicalTenantKeys();
          // Calibration: the reader must find the declarations it reads, or
          // "no name matches" would be true of an unreadable registry.
          expect(names.length).toBeGreaterThan(0);
          expect(names.length).toBe(keys.size);
          const matcher = regExpFromLiteral(cause!.nameMatcherLiteral);
          const resolverText = readText(cause!.resolver);
          if (suite.repaired?.repairedInThisItem) {
            // Applied: the resolver no longer matches a display name, it
            // looks the tenant up by key and names the intended declared key,
            // and the test still expects rows counted into the section.
            const repaired = suite.repaired;
            expect({
              path: suite.path,
              resolverStillMatchesByName: resolverText.includes(
                `${cause!.nameMatcherLiteral}.test(t.name)`,
              ),
              resolverMatchesByKey: /\bt\.key\s*===/.test(resolverText),
              resolverNamesKey: resolverText.includes(`"${repaired.resolvesByDeclaredKey}"`),
              resolvesIntendedKey: repaired.resolvesByDeclaredKey === cause!.intendedTenantKey,
              intendedKeyDeclared: keys.has(cause!.intendedTenantKey),
              testExpectsTheSection: /\.skyharbor\.total\)\.toBe\(\s*[1-9]/.test(testText),
              reExecutedGreen: reExecutedGreen(suite),
              wiredInThisItem: suite.wiredInThisItem,
            }).toEqual({
              path: suite.path,
              resolverStillMatchesByName: false,
              resolverMatchesByKey: true,
              resolverNamesKey: true,
              resolvesIntendedKey: true,
              intendedKeyDeclared: true,
              testExpectsTheSection: true,
              reExecutedGreen: true,
              wiredInThisItem: true,
            });
            break;
          }
          expect({
            path: suite.path,
            resolverStillMatchesByName: resolverText.includes(
              `${cause!.nameMatcherLiteral}.test(t.name)`,
            ),
            namesMatched: names.filter((name) => matcher.test(name)),
            intendedKeyDeclared: keys.has(cause!.intendedTenantKey),
            testExpectsTheSection: /\.skyharbor\.total\)\.toBe\(\s*[1-9]/.test(testText),
          }).toEqual({
            path: suite.path,
            resolverStillMatchesByName: true,
            namesMatched: [],
            intendedKeyDeclared: true,
            testExpectsTheSection: true,
          });
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

  // A row the record says this item has run must actually be RUN: asked of
  // the workflow a pull request executes and of the census computed from it,
  // so neither the record's own flag nor a comment in the YAML satisfies it.
  it("runs every applied repair and wired row in an item 26 draw 18 unit-suites step, and the census agrees", () => {
    const workflow = yaml.load(readText(".github/workflows/unit-suites.yml")) as {
      jobs: Record<string, { steps?: { name?: string; run?: string }[] }>;
    };
    const commands = Object.values(workflow.jobs)
      .flatMap((job) => job.steps ?? [])
      .filter((step) => (step.name ?? "").includes("item 26 draw 18") && step.run)
      .map((step) => {
        // A `>-` block folds to ONE shell line, so a `#` inside it is a shell
        // comment: every word after it is never passed to jest.
        const all = (step.run ?? "").split(/\s+/);
        const comment = all.findIndex((w) => w.startsWith("#"));
        const words = (comment === -1 ? all : all.slice(0, comment)).map((w) =>
          w.replace(/^"|"$/g, ""),
        );
        return { byPath: words.includes("--runTestsByPath"), words };
      });

    const census = readJson<{
      triageVerdicts: { heldTestPaths: { testPath: string }[] };
      uncoveredDirectories: { directory: string }[];
    }>("docs/architecture/test-ci-coverage-census.json");
    const held = new Set(census.triageVerdicts.heldTestPaths.map((row) => row.testPath));
    const dark = new Set(census.uncoveredDirectories.map((row) => row.directory));

    const run = record.suites.filter(isRunRow);
    expect(run.length).toBeGreaterThan(0);
    expect(commands.length).toBeGreaterThan(0);
    for (const suite of run) {
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
    // Rows still held must NOT have been wired by an item 26 draw 18 step.
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
