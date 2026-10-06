import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * T-805: the census publishes two views of its untriaged pool, and until this
 * item a directory could fall between them — so giving a directory a
 * governed-risk signal could make it LESS visible rather than more.
 *
 *   `governedRiskRanking`          admits a row while `drawableUnrunTestFiles > 0`
 *   `unclassifiedRiskDirectories`  carried only rows whose score is zero
 *
 * A directory that scores above zero and whose every untriaged file is held by
 * a triage verdict satisfies neither test, and appeared in nothing. Measured on
 * `fbfd62b50c`: 59 directories hold an untriaged unrun test file, 49 were
 * published in `unclassifiedRiskDirectories`, 0 in `governedRiskRanking`, so 10
 * were in neither. Four of them were the four most governed directories the
 * `T-793` signal change had just correctly reclassified, and the committed
 * artifact stopped naming them anywhere.
 *
 * The hazard is the direction: every future widening of any signal moves more
 * directories out of sight, and this census is the input to what gets wired
 * next. So `unclassifiedRiskDirectories` now carries every row the ranking does
 * not, and the two lists together are exhaustive of the pool.
 *
 * The forbidden alternative is admitting held directories to the ranking.
 * Admission is what a draw offers and holding is a triage verdict about a file;
 * conflating them would undo T-773 and hand a draw work somebody has taken.
 * The cases below assert that direction too, so the exhaustiveness above cannot
 * be bought that way.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const SIBLING_SCRIPT = "scripts/quality/check-integration-ci-visibility.mjs";

type RankingRow = {
  directory: string;
  untriagedUnrunTestFiles: number;
  drawableUnrunTestFiles: number;
  drawableTestPaths: string[];
  admittedBy: string;
  governedRisk: { score: number; band: string; rank: number };
};

type UnclassifiedRow = {
  directory: string;
  untriagedUnrunTestFiles: number;
  governedRisk: {
    score: number;
    band: string;
    signals: string[];
    productSourceCount: number;
  };
};

type Census = {
  counts: {
    untriagedUnrunTestFiles: number;
    directoriesWithUntriagedUnrunTestFiles: number;
    unclassifiedRiskDirectories: number;
    unclassifiedRiskDirectoriesWithResolvedProductSources: number;
    unclassifiedRiskDirectoriesWithNoResolvedProductSource: number;
    rankedDirectories: number;
  };
  governedRiskRanking: RankingRow[];
  unclassifiedRiskDirectories: UnclassifiedRow[];
  governedRiskEvidence: { directory: string }[];
  governedRiskFiles: { directory: string }[];
  triageVerdicts: { heldTestPaths: { testPath: string }[] };
};

function runCensus(cwd: string): Census {
  const stdout = execFileSync(process.execPath, [path.join(cwd, CENSUS_SCRIPT), "--json"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 256 * 1024 * 1024,
  });
  return JSON.parse(stdout.slice(stdout.indexOf("{"))) as Census;
}

function runSummary(cwd: string): string {
  return execFileSync(process.execPath, [path.join(cwd, CENSUS_SCRIPT)], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 256 * 1024 * 1024,
  });
}

/** The directories holding an untriaged unrun file, derived WITHOUT either published view. */
function directoriesHoldingUntriagedUnrunFiles(census: Census): Set<string> {
  const pool = [
    ...census.triageVerdicts.heldTestPaths.map((entry) => entry.testPath),
    ...census.governedRiskRanking.flatMap((row) => row.drawableTestPaths),
  ];
  return new Set(pool.map((testPath) => path.posix.dirname(testPath)));
}

// ---------------------------------------------------------------------------
// Fixture repositories: the real script, a synthetic tree.
// ---------------------------------------------------------------------------

function relativeImportClosure(seeds: readonly string[]): string[] {
  const seen = new Set<string>();
  const queue = [...seeds];
  while (queue.length > 0) {
    const relativePath = queue.shift() as string;
    if (seen.has(relativePath)) continue;
    seen.add(relativePath);
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
    for (const match of source.matchAll(/\bfrom\s+["'](\.[^"']*)["']/g)) {
      queue.push(
        path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), match[1])),
      );
    }
  }
  return [...seen].sort();
}

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

function fixture(files: Record<string, string>): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "t805-census-")));
  fixtures.push(dir);
  for (const script of relativeImportClosure([CENSUS_SCRIPT, SIBLING_SCRIPT])) {
    mkdirSync(path.dirname(path.join(dir, script)), { recursive: true });
    copyFileSync(path.join(repoRoot, script), path.join(dir, script));
  }
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "fixture", scripts: {} }));
  symlinkSync(path.join(repoRoot, "node_modules"), path.join(dir, "node_modules"), "dir");
  for (const [relative, contents] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, relative)), { recursive: true });
    writeFileSync(path.join(dir, relative), contents);
  }
  return dir;
}

const WORKFLOW = [
  "name: gate",
  "on:",
  "  pull_request:",
  "jobs:",
  "  verify:",
  "    steps:",
  "      - run: npx jest src/lib/covered",
].join("\n");

/**
 * Four directories, one per cell of the (scores / does not) x (held / drawable)
 * grid this item is about. Before the fix, `SCORED_HELD` was published nowhere.
 */
const SCORED_HELD = "src/lib/approval-held/__tests__";
const SCORED_DRAWABLE = "src/lib/approval-open/__tests__";
const ZERO_HELD = "src/lib/plain-held/__tests__";
const ZERO_DRAWABLE = "src/lib/plain-open/__tests__";

const APPROVING_SOURCE = (name: string) =>
  [
    `export function approve(value: { ok: boolean }) { return value; }`,
    `export function ${name}() { return approve({ ok: true }); }`,
  ].join("\n");

const TEST_IMPORTING = (module: string, name: string) =>
  [
    `import { ${name} } from "../${module}";`,
    `it("runs", () => expect(typeof ${name}).toBe("function"));`,
  ].join("\n");

const PLAIN_SOURCE = "export function plain() { return 1; }\n";

describe("T-805 · fixture: every untriaged directory reaches a published view", () => {
  let census: Census;
  let fixtureRoot: string;

  beforeAll(() => {
    fixtureRoot = fixture({
      ".github/workflows/gate.yml": WORKFLOW,
      "src/lib/covered/__tests__/covered.test.ts": "it('x', () => expect(1).toBe(1));\n",

      // Scores (the path carries `approval`, so APPROVAL_OR_LIFECYCLE_PATH_RE
      // matches) and its only untriaged file is held. The defect's own cell.
      "src/lib/approval-held/approval-route.ts": APPROVING_SOURCE("held"),
      [`${SCORED_HELD}/approval-route.test.ts`]: TEST_IMPORTING("approval-route", "held"),

      // Scores and is drawable: ranked, and must stay OUT of the unclassified list.
      "src/lib/approval-open/approval-route.ts": APPROVING_SOURCE("open"),
      [`${SCORED_DRAWABLE}/approval-route.test.ts`]: TEST_IMPORTING("approval-route", "open"),

      // Zero score, held: already published before this change. Pinned so the
      // widened filter is proven to ADD a cell rather than swap one for another.
      "src/lib/plain-held/plain.ts": PLAIN_SOURCE,
      [`${ZERO_HELD}/plain.test.ts`]: TEST_IMPORTING("plain", "plain"),

      // Zero score, drawable: the C-555 "view ON the ranking" case, in both.
      "src/lib/plain-open/plain.ts": PLAIN_SOURCE,
      [`${ZERO_DRAWABLE}/plain.test.ts`]: TEST_IMPORTING("plain", "plain"),

      "docs/architecture/t805-fixture-triage.json": JSON.stringify({
        item: "T-FIX",
        recordedAt: "2026-10-05T00:00:00Z",
        suites: [
          {
            path: `${SCORED_HELD}/approval-route.test.ts`,
            verdict: "wire_into_ci",
            ownerItem: "T-FIX1",
          },
          { path: `${ZERO_HELD}/plain.test.ts`, verdict: "repair", ownerItem: "T-FIX2" },
        ],
      }),
    });
    census = runCensus(fixtureRoot);
  });

  const unclassified = () =>
    new Map(census.unclassifiedRiskDirectories.map((row) => [row.directory, row]));
  const ranked = () => new Map(census.governedRiskRanking.map((row) => [row.directory, row]));

  it("publishes a scored directory whose every untriaged file is held", () => {
    // The case that fails before the fix: scored out of the zero list, held out
    // of the ranking, and therefore in nothing at all.
    const row = unclassified().get(SCORED_HELD);
    expect(row).toBeDefined();
    expect(row).toMatchObject({
      untriagedUnrunTestFiles: 1,
      governedRisk: {
        band: "critical",
        signals: ["approval_or_lifecycle_write"],
      },
    });
    expect(row!.governedRisk.score).toBeGreaterThan(0);
  });

  it("leaves no directory holding an untriaged file outside both views", () => {
    const published = new Set([...unclassified().keys(), ...ranked().keys()]);
    const invisible = [...directoriesHoldingUntriagedUnrunFiles(census)]
      .filter((directory) => !published.has(directory))
      .sort();
    expect(invisible).toEqual([]);
    expect(published.size).toBe(census.counts.directoriesWithUntriagedUnrunTestFiles);
  });

  it("does not buy that exhaustiveness by ranking a directory with no drawable file", () => {
    // The forbidden remedy. T-773 holds here unchanged: a draw must not be
    // offered a file a triage verdict has already assigned to an owner.
    expect(ranked().has(SCORED_HELD)).toBe(false);
    expect(ranked().has(ZERO_HELD)).toBe(false);
    for (const row of census.governedRiskRanking) {
      expect(row.drawableUnrunTestFiles).toBeGreaterThan(0);
    }
    expect(census.counts.rankedDirectories).toBe(2);
  });

  it("keeps a scored, drawable directory in the ranking and out of the zero list", () => {
    // The other direction of the split, which is what would break if the new
    // filter were written as "every directory" rather than "every row the
    // ranking does not carry".
    expect(unclassified().has(SCORED_DRAWABLE)).toBe(false);
    expect(ranked().get(SCORED_DRAWABLE)).toMatchObject({
      admittedBy: "governed_risk_signal",
    });
  });

  it("keeps the zero-score rows it already carried, both held and drawable", () => {
    expect([...unclassified().keys()].sort()).toEqual(
      [SCORED_HELD, ZERO_HELD, ZERO_DRAWABLE].sort(),
    );
    expect(unclassified().get(ZERO_DRAWABLE)!.governedRisk.score).toBe(0);
    expect(ranked().get(ZERO_DRAWABLE)).toMatchObject({
      admittedBy: "untriaged_unrun_work",
    });
  });

  it("keeps the two split counts summing to the widened total", () => {
    expect(census.unclassifiedRiskDirectories.length).toBe(
      census.counts.unclassifiedRiskDirectories,
    );
    expect(
      census.counts.unclassifiedRiskDirectoriesWithResolvedProductSources +
        census.counts.unclassifiedRiskDirectoriesWithNoResolvedProductSource,
    ).toBe(census.counts.unclassifiedRiskDirectories);
    expect(census.counts.unclassifiedRiskDirectories).toBe(3);
  });

  it("leaves governed-risk evidence bound to the directories that signalled", () => {
    // Widening the published view must not widen what "governed-risk evidence"
    // means: these two lists are what four workflow comments cite.
    expect(census.governedRiskEvidence.map((row) => row.directory)).toEqual([
      SCORED_DRAWABLE,
    ]);
    expect([...new Set(census.governedRiskFiles.map((row) => row.directory))]).toEqual([
      SCORED_DRAWABLE,
    ]);
  });

  it("says the widened number in the summary a person reads", () => {
    expect(runSummary(fixtureRoot)).toContain("unclassified: 3 (");
  });
});

// ---------------------------------------------------------------------------
// The real tree: the invariant on the artifact the triage draw is taken from.
// ---------------------------------------------------------------------------

describe("T-805 · the real tree", () => {
  let census: Census;

  beforeAll(() => {
    census = runCensus(repoRoot);
  });

  it("publishes every directory holding an untriaged unrun test file", () => {
    const published = new Set([
      ...census.unclassifiedRiskDirectories.map((row) => row.directory),
      ...census.governedRiskRanking.map((row) => row.directory),
    ]);
    const invisible = [...directoriesHoldingUntriagedUnrunFiles(census)]
      .filter((directory) => !published.has(directory))
      .sort();
    // 10 before this change, and the four `T-793` reclassified were among them.
    expect(invisible).toEqual([]);
  });

  it("is not vacuous: the pool, and both views, have rows in them", () => {
    // Not a floor on any count — wiring a directory lowers all three, and a
    // gate that reddens when the work gets done points the wrong way. This
    // asserts only that the invariant above is being checked against something.
    expect(census.counts.untriagedUnrunTestFiles).toBeGreaterThan(0);
    expect(directoriesHoldingUntriagedUnrunFiles(census).size).toBe(
      census.counts.directoriesWithUntriagedUnrunTestFiles,
    );
    expect(
      census.unclassifiedRiskDirectories.length + census.governedRiskRanking.length,
    ).toBeGreaterThan(0);
  });

  it("agrees with its own counts, and keeps the ranking drawable-only", () => {
    expect(census.unclassifiedRiskDirectories.length).toBe(
      census.counts.unclassifiedRiskDirectories,
    );
    expect(census.governedRiskRanking.length).toBe(census.counts.rankedDirectories);
    for (const row of census.governedRiskRanking) {
      expect(row.drawableUnrunTestFiles).toBeGreaterThan(0);
    }
    // Every row the ranking does not carry is in the published view, and every
    // row in it either scores zero or has nothing drawable. Both directions, so
    // the filter cannot become "every directory" unnoticed.
    const ranked = new Map(census.governedRiskRanking.map((row) => [row.directory, row]));
    for (const row of census.unclassifiedRiskDirectories) {
      const rankedRow = ranked.get(row.directory);
      expect(row.governedRisk.score === 0 || rankedRow === undefined).toBe(true);
    }
  });
});
