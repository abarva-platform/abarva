import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * T-773: the governed-risk ranking is what a stale-suite draw is taken from,
 * and until this item it counted a file as untriaged whether or not a repo-owned
 * `docs/architecture/*triage*.json` record had already judged it and named an
 * owner. The ninth draw (T-771) spent eleven of its twenty rows re-judging files
 * that already carried a verdict.
 *
 * The census now resolves each file's LATEST verdict (by `recordedAt`, across
 * every triage record) and splits the untriaged pool in two:
 *
 *   held      — the latest verdict names residual work with an owner, so a draw
 *               must not offer the file again. Published with its verdict, record
 *               and owner, so the owed work stays visible rather than vanishing.
 *   drawable  — no verdict, a verdict the census contradicts (it says the file
 *               runs and it does not), or a verdict word the census does not
 *               recognise. Only these admit a directory to the ranking.
 *
 * `untriagedUnrunTestFiles` is unchanged: a verdict is a judgement, not a
 * workflow that runs the file, and the uncovered/quarantine arithmetic other
 * gates read must not move because somebody wrote a JSON file.
 *
 * The real-tree cases resolve verdicts HERE, independently of the census, and
 * require the two readings to agree file for file.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const SIBLING_SCRIPT = "scripts/quality/check-integration-ci-visibility.mjs";
const TRIAGE_DIRECTORY = "docs/architecture";

/**
 * The verdicts that hold a file out of the draw. Duplicated from the census on
 * purpose: this list is the decision T-773 asked to be written down, and a test
 * that imported it could not notice the census changing it.
 */
const HOLDING_VERDICTS = new Set([
  "wire_into_ci",
  "repair",
  "rewrite_as_behavior",
  "update_with_reason_recorded",
  "real",
  "vacuous_control_proof",
  "held_unwired",
  "already_verdicted_elsewhere",
]);

type TriageVerdict = {
  verdict: string | null;
  record: string;
  recordedAt: string | null;
  ownerItem: string | null;
};

type RankingRow = {
  directory: string;
  untriagedUnrunTestFiles: number;
  verdictHeldUntriagedUnrunTestFiles: number;
  drawableUnrunTestFiles: number;
  drawableTestPaths: string[];
};

type Census = {
  counts: { untriagedUnrunTestFiles: number };
  governedRiskRanking: RankingRow[];
  unclassifiedRiskDirectories: { directory: string }[];
  triageVerdicts: {
    heldUntriagedUnrunTestFiles: number;
    drawableUntriagedUnrunTestFiles: number;
    heldByVerdict: Record<string, number>;
    heldTestPaths: ({ testPath: string } & TriageVerdict)[];
    contradictedVerdicts: ({ testPath: string } & TriageVerdict)[];
    unrecognisedVerdicts: ({ testPath: string } & TriageVerdict)[];
    verdictsNamingNoFile: { testPath: string; records: string[] }[];
    unreadableRecords: string[];
  };
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
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "t773-census-")));
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

const TEST_FILE = "it('x', () => { expect(1).toBe(1); });\n";
const WORKFLOW = [
  "name: gate",
  "on:",
  "  pull_request:",
  "jobs:",
  "  verify:",
  "    steps:",
  "      - run: npx jest src/lib/covered",
].join("\n");

function record(recordedAt: string | undefined, suites: Record<string, unknown>[]): string {
  return JSON.stringify({ item: "T-FIX", ...(recordedAt ? { recordedAt } : {}), suites });
}

describe("T-773 · fixture: the ranking reads triage verdicts", () => {
  const DIR = "src/lib/mixed/__tests__";
  const ONLY_HELD_DIR = "src/lib/held/__tests__";
  let census: Census;

  beforeAll(() => {
    const dir = fixture({
      ".github/workflows/gate.yml": WORKFLOW,
      "src/lib/covered/__tests__/covered.test.ts": TEST_FILE,
      [`${DIR}/verdicted.test.ts`]: TEST_FILE,
      [`${DIR}/unjudged.test.ts`]: TEST_FILE,
      [`${DIR}/claims-wired.test.ts`]: TEST_FILE,
      [`${DIR}/reheld.test.ts`]: TEST_FILE,
      [`${DIR}/odd-word.test.ts`]: TEST_FILE,
      [`${DIR}/undated.test.ts`]: TEST_FILE,
      [`${ONLY_HELD_DIR}/only.test.ts`]: TEST_FILE,
      "docs/architecture/t001-stale-suite-triage.json": record("2026-09-01T00:00:00Z", [
        { path: `${DIR}/verdicted.test.ts`, verdict: "wire_into_ci", ownerItem: "T-002" },
        { path: `${DIR}/claims-wired.test.ts`, verdict: "repair", ownerItem: "T-003" },
        { path: `${DIR}/reheld.test.ts`, verdict: "wired", wiredBy: "T-001" },
        { path: `${DIR}/odd-word.test.ts`, verdict: "looks_fine" },
        { path: `${ONLY_HELD_DIR}/only.test.ts`, verdict: "rewrite_as_behavior", ownerItem: "T-004" },
        { path: "src/lib/gone/__tests__/deleted.test.ts", verdict: "wire_into_ci" },
      ]),
      // Later: supersedes two verdicts above in opposite directions.
      "docs/architecture/t005-stale-suite-triage.json": record("2026-09-10T00:00:00Z", [
        { path: `${DIR}/claims-wired.test.ts`, verdict: "wired", wiredBy: "T-005" },
        { path: `${DIR}/reheld.test.ts`, verdict: "repair", ownerItem: "T-006" },
      ]),
      // No recordedAt: sorts before every dated record, so it cannot override
      // the dated `wire_into_ci` on the same path, and holds its own path.
      "docs/architecture/t007-stale-suite-triage.json": record(undefined, [
        { path: `${DIR}/verdicted.test.ts`, verdict: "wired" },
        { path: `${DIR}/undated.test.ts`, verdict: "held_unwired", ownerItem: "T-007" },
      ]),
      "docs/architecture/t008-broken-triage.json": "{ not json",
    });
    census = runCensus(dir);
  });

  const row = (directory: string) =>
    census.governedRiskRanking.find((entry) => entry.directory === directory);

  it("holds a file whose latest verdict names owned work out of the drawable set", () => {
    const held = census.triageVerdicts.heldTestPaths.map((entry) => entry.testPath);
    expect(held).toEqual(
      [
        `${DIR}/reheld.test.ts`,
        `${DIR}/undated.test.ts`,
        `${DIR}/verdicted.test.ts`,
        `${ONLY_HELD_DIR}/only.test.ts`,
      ].sort(),
    );
    expect(row(DIR)!.drawableTestPaths).not.toContain(`${DIR}/verdicted.test.ts`);
  });

  it("keeps a file nobody has judged drawable, and its directory ranked", () => {
    expect(row(DIR)).toBeDefined();
    expect(row(DIR)!.drawableTestPaths).toContain(`${DIR}/unjudged.test.ts`);
  });

  it("drops a directory whose every untriaged file is held from the ranking", () => {
    expect(row(ONLY_HELD_DIR)).toBeUndefined();
    // Still visible, with its owner, rather than gone.
    expect(census.triageVerdicts.heldTestPaths).toContainEqual(
      expect.objectContaining({
        testPath: `${ONLY_HELD_DIR}/only.test.ts`,
        verdict: "rewrite_as_behavior",
        ownerItem: "T-004",
      }),
    );
  });

  it("resolves by the LATEST recordedAt, in both directions", () => {
    // A later `wired` on a file still unrun is contradicted, so it is drawable.
    expect(row(DIR)!.drawableTestPaths).toContain(`${DIR}/claims-wired.test.ts`);
    expect(census.triageVerdicts.contradictedVerdicts).toEqual([
      expect.objectContaining({
        testPath: `${DIR}/claims-wired.test.ts`,
        verdict: "wired",
        record: "docs/architecture/t005-stale-suite-triage.json",
      }),
    ]);
    // A later holding verdict over an earlier `wired` holds.
    expect(census.triageVerdicts.heldTestPaths).toContainEqual(
      expect.objectContaining({ testPath: `${DIR}/reheld.test.ts`, ownerItem: "T-006" }),
    );
  });

  it("does not let an undated record override a dated one", () => {
    expect(census.triageVerdicts.heldTestPaths).toContainEqual(
      expect.objectContaining({ testPath: `${DIR}/verdicted.test.ts`, verdict: "wire_into_ci" }),
    );
  });

  it("does not hold a file on a verdict word it does not recognise", () => {
    expect(row(DIR)!.drawableTestPaths).toContain(`${DIR}/odd-word.test.ts`);
    expect(census.triageVerdicts.unrecognisedVerdicts.map((entry) => entry.testPath)).toEqual([
      `${DIR}/odd-word.test.ts`,
    ]);
  });

  it("reports a verdict naming no walked file, and an unreadable record, as rows", () => {
    expect(census.triageVerdicts.verdictsNamingNoFile).toEqual([
      {
        testPath: "src/lib/gone/__tests__/deleted.test.ts",
        records: ["docs/architecture/t001-stale-suite-triage.json"],
      },
    ]);
    expect(census.triageVerdicts.unreadableRecords).toEqual([
      "docs/architecture/t008-broken-triage.json",
    ]);
  });

  it("partitions the untriaged pool exactly, and leaves the untriaged count alone", () => {
    // 8 test files, 1 covered, 7 untriaged; 4 held, 3 drawable.
    expect(census.counts.untriagedUnrunTestFiles).toBe(7);
    expect(census.triageVerdicts.heldUntriagedUnrunTestFiles).toBe(4);
    expect(census.triageVerdicts.drawableUntriagedUnrunTestFiles).toBe(3);
    expect(row(DIR)).toMatchObject({
      untriagedUnrunTestFiles: 6,
      verdictHeldUntriagedUnrunTestFiles: 3,
      drawableUnrunTestFiles: 3,
    });
    expect(census.triageVerdicts.heldByVerdict).toEqual({
      held_unwired: 1,
      repair: 1,
      rewrite_as_behavior: 1,
      wire_into_ci: 1,
    });
  });
});

// ---------------------------------------------------------------------------
// The real tree: an independent reading of every triage record.
// ---------------------------------------------------------------------------

function latestVerdicts(root: string): Map<string, { verdict: string | null; recordedAt: string; record: string }> {
  const latest = new Map<string, { verdict: string | null; recordedAt: string; record: string }>();
  const directory = path.join(root, TRIAGE_DIRECTORY);
  for (const file of readdirSync(directory).sort()) {
    if (!/triage.*\.json$/.test(file)) continue;
    let payload: { recordedAt?: string; suites?: { path?: unknown; verdict?: string; recordedAt?: string }[] };
    try {
      payload = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
    } catch {
      continue;
    }
    for (const suite of payload.suites ?? []) {
      if (typeof suite.path !== "string") continue;
      const recordedAt = String(suite.recordedAt ?? payload.recordedAt ?? "");
      const held = latest.get(suite.path);
      if (!held || recordedAt >= held.recordedAt) {
        latest.set(suite.path, {
          verdict: suite.verdict ?? null,
          recordedAt,
          record: `${TRIAGE_DIRECTORY}/${file}`,
        });
      }
    }
  }
  return latest;
}

describe("T-773 · the real tree", () => {
  let census: Census;
  let latest: ReturnType<typeof latestVerdicts>;
  let drawable: Set<string>;
  let held: Set<string>;

  beforeAll(() => {
    census = runCensus(repoRoot);
    latest = latestVerdicts(repoRoot);
    drawable = new Set(census.governedRiskRanking.flatMap((row) => row.drawableTestPaths));
    held = new Set(census.triageVerdicts.heldTestPaths.map((entry) => entry.testPath));
  });

  it("splits every untriaged file into exactly one of held or drawable", () => {
    for (const testPath of held) expect(drawable.has(testPath)).toBe(false);
    expect(held.size + drawable.size).toBe(census.counts.untriagedUnrunTestFiles);
    expect(census.triageVerdicts.heldUntriagedUnrunTestFiles).toBe(held.size);
    expect(census.triageVerdicts.drawableUntriagedUnrunTestFiles).toBe(drawable.size);
  });

  it("agrees with an independent reading of the records, file for file", () => {
    const wronglyHeld = [...held].filter(
      (testPath) => !HOLDING_VERDICTS.has(latest.get(testPath)?.verdict ?? ""),
    );
    const wronglyDrawable = [...drawable].filter((testPath) =>
      HOLDING_VERDICTS.has(latest.get(testPath)?.verdict ?? ""),
    );
    expect({ wronglyHeld, wronglyDrawable }).toEqual({ wronglyHeld: [], wronglyDrawable: [] });
  });

  it("is not vacuous: real verdicted files are held, and real unjudged files stay drawable", () => {
    // Measured at 69 held of 277 untriaged on 6290814f71. The floor is not that
    // number — wiring a held file lowers it, and a floor that goes red when the
    // work gets done is a gate pointed the wrong way. The agreement case above
    // is what pins the count; this pins that neither side is empty.
    expect(held.size).toBeGreaterThan(0);
    const unjudged = [...drawable].filter((testPath) => !latest.has(testPath));
    expect(unjudged.length).toBeGreaterThan(0);
  });

  it("holds the T-771 known positives out of the ranking", () => {
    // The eleven files T-771 found already verdicted. Those still unrun must be
    // held; the one T-771 wired (the NDA repository suite) is no longer
    // untriaged at all.
    const t771 = JSON.parse(
      readFileSync(path.join(repoRoot, TRIAGE_DIRECTORY, "t771-stale-suite-triage.json"), "utf8"),
    ) as { suites: { path: string; verdict: string }[] };
    const knownPositives = t771.suites
      .filter((suite) => suite.verdict === "already_verdicted_elsewhere")
      .map((suite) => suite.path);
    expect(knownPositives.length).toBe(10);
    const stillUntriaged = knownPositives.filter(
      (testPath) => held.has(testPath) || drawable.has(testPath),
    );
    expect(stillUntriaged.length).toBeGreaterThan(0);
    for (const testPath of stillUntriaged) {
      expect({ testPath, drawable: drawable.has(testPath) }).toEqual({ testPath, drawable: false });
    }
  });

  it("ranks no directory without a drawable file", () => {
    for (const row of census.governedRiskRanking) {
      expect(row.drawableUnrunTestFiles).toBeGreaterThan(0);
      expect(row.drawableTestPaths).toHaveLength(row.drawableUnrunTestFiles);
    }
  });

  it("names every verdict path the census does not walk", () => {
    const walked = new Set([...held, ...drawable]);
    for (const entry of census.triageVerdicts.verdictsNamingNoFile) {
      expect(walked.has(entry.testPath)).toBe(false);
      expect(existsSync(path.join(repoRoot, entry.testPath))).toBe(false);
    }
  });
});
