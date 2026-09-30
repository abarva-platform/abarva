/**
 * Guard for the T-799 triage record — the fourteenth stale-suite draw.
 *
 * The draw is READ-ONLY: it judges twenty unrun files and wires none of them.
 * A record like that is only worth keeping if it cannot say something false,
 * so every case below recomputes a claim from the tree rather than trusting
 * the record's own words:
 *
 *  - whether a file reads repository text is re-derived from the test file's
 *    bytes, so a byte scan cannot be declared behavioural and then wired;
 *  - a hold on an unreachable component is re-asked of
 *    `unreachable-components.json`, so the hold loses its reason the moment
 *    the component is mounted or retired;
 *  - each red row's cause is re-asked of the file that caused it, so when the
 *    label or the literal is fixed this control goes red and says the row must
 *    be superseded by a later record — the hold may not outlive its defect;
 *  - the committed census must resolve every drawn path to THIS record, so the
 *    twenty are held out of the next draw by a verdict the census actually
 *    read, not by a document nothing consults.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = process.cwd();
const RECORD_PATH = "docs/architecture/t799-stale-suite-triage.json";

type Suite = {
  path: string;
  directory: string;
  run: boolean;
  green: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  readsRepositoryFileText: boolean;
  sourceTextScanner: boolean;
  verdict: string;
  ownerItem: string;
  rationale: string;
  wiredInThisItem?: boolean;
  unreachableComponent?: string;
  redCause?: {
    kind: "stale_label" | "formatting_reflow";
    labelSource?: string;
    expectedLabel?: string;
    currentLabel?: string;
    expectedLiteralFile?: string;
    presentForm?: string;
  };
};

type TriageRecord = {
  item: string;
  recordedAt: string;
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

describe("T-799 stale suite triage record", () => {
  it("draws twenty existing files, each named once", () => {
    expect(record.item).toBe("T-799");
    expect(record.base).toMatch(/^[0-9a-f]{40}$/);
    expect(record.suites).toHaveLength(20);
    expect(record.scope.drawSize).toBe(20);
    const paths = record.suites.map((suite) => suite.path);
    expect(new Set(paths).size).toBe(20);
    for (const testPath of paths) {
      expect({ testPath, exists: existsSync(path.join(ROOT, testPath)) }).toEqual(
        { testPath, exists: true },
      );
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
  });

  it("offers for wiring only green, behavioural suites over a reachable subject", () => {
    const unreachable = new Set(
      readJson<{ orphans: string[] }>("docs/architecture/unreachable-components.json")
        .orphans,
    );
    const wiring = record.suites.filter((suite) => suite.verdict === "wire_into_ci");
    expect(wiring.length).toBeGreaterThan(0);
    for (const suite of wiring) {
      expect({ path: suite.path, green: suite.green }).toEqual({
        path: suite.path,
        green: true,
      });
      expect(suite.readsRepositoryFileText).toBe(false);
      const imported = [
        ...readText(suite.path).matchAll(/from ["'](\.\.?\/[^"']+|@\/[^"']+)["']/g),
      ].map((match) =>
        match[1].startsWith("@/")
          ? `src/${match[1].slice(2)}`
          : path.posix.join(path.posix.dirname(suite.path), match[1]),
      );
      for (const subject of imported) {
        expect({ path: suite.path, unreachable: unreachable.has(`${subject}.tsx`) }).toEqual({
          path: suite.path,
          unreachable: false,
        });
      }
    }
  });

  it("holds an unreachable render only while the component is still unreachable", () => {
    const unreachable = new Set(
      readJson<{ orphans: string[] }>("docs/architecture/unreachable-components.json")
        .orphans,
    );
    const held = record.suites.filter((suite) => suite.unreachableComponent);
    expect(held.length).toBeGreaterThan(0);
    for (const suite of held) {
      expect(suite.verdict).toBe("already_verdicted_elsewhere");
      expect(suite.ownerItem).toBe("T-775");
      expect({
        component: suite.unreachableComponent,
        stillUnreachable: unreachable.has(suite.unreachableComponent ?? ""),
      }).toEqual({ component: suite.unreachableComponent, stillUnreachable: true });
    }
  });

  it("holds each red row only while the cause it names is still in the tree", () => {
    const red = record.suites.filter((suite) => !suite.green);
    expect(red.length).toBe(record.scope.redOnRun);
    for (const suite of red) {
      expect(suite.verdict).not.toBe("wire_into_ci");
      const cause = suite.redCause;
      expect(cause).toBeDefined();
      const testText = readText(suite.path);
      if (cause?.kind === "stale_label") {
        const source = readText(cause.labelSource ?? "");
        expect({
          path: suite.path,
          testStillExpectsOldLabel: testText.includes(cause.expectedLabel ?? "\u0000"),
          sourceStillLacksOldLabel: !source.includes(cause.expectedLabel ?? ""),
          sourceHasCurrentLabel: source.includes(cause.currentLabel ?? "\u0000"),
        }).toEqual({
          path: suite.path,
          testStillExpectsOldLabel: true,
          sourceStillLacksOldLabel: true,
          sourceHasCurrentLabel: true,
        });
      } else if (cause?.kind === "formatting_reflow") {
        const subject = readText(cause.expectedLiteralFile ?? "");
        expect(suite.readsRepositoryFileText).toBe(true);
        expect(suite.verdict).toBe("rewrite_as_behavior");
        expect({
          path: suite.path,
          subjectHoldsOneLineForm: subject.includes(cause.presentForm ?? "\u0000"),
          subjectLacksMultiLineForm: !subject.includes("const requestedClient =\n"),
          testStillExpectsMultiLineForm: testText.includes(
            '"const requestedClient =\\n"',
          ),
        }).toEqual({
          path: suite.path,
          subjectHoldsOneLineForm: true,
          subjectLacksMultiLineForm: true,
          testStillExpectsMultiLineForm: true,
        });
      } else {
        throw new Error(`${suite.path}: red row with no recognised cause`);
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
  it("runs every wire_into_ci row in a T-799 unit-suites step, and the census agrees", () => {
    const workflow = yaml.load(readText(".github/workflows/unit-suites.yml")) as {
      jobs: Record<string, { steps?: { name?: string; run?: string }[] }>;
    };
    const commands = Object.values(workflow.jobs)
      .flatMap((job) => job.steps ?? [])
      .filter((step) => (step.name ?? "").includes("T-799") && step.run)
      .map((step) => {
        const words = (step.run ?? "").split(/\s+/).map((w) => w.replace(/^"|"$/g, ""));
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
    // Held rows must NOT have been wired by a T-799 step.
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
