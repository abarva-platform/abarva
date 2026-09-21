import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * T-471 asked for "the next 20 stale suites to triage", drawn in rank order
 * from the coverage census's `governedRiskRanking` critical band. Eleven of
 * the twenty came back already triaged:
 *
 *   - seven named in `scripts/quality/source-integration-quarantine.json`,
 *   - one more in that file's `alsoIgnored`,
 *   - two named in the auth step's `--testPathIgnorePatterns` in
 *     `.github/workflows/unit-suites.yml`,
 *   - one recorded as carrying four triaged-red cases in a workflow comment.
 *
 * All twenty were measured red on `d8300efdc` — 20 loaded, 20 collected, 20
 * run, 0 green — so none could be wired, and more than half of the draw was
 * work somebody had already done. The cause is not the draw. It is that the
 * census called every unrun file "uncovered" and stopped there: a file a
 * command names and then deliberately excludes has been looked at, and a file
 * no command names has not, and the ranking that says "triage this next" could
 * not tell them apart. Ranks 2 and 3 of the critical band were directories
 * whose entire unrun set was declared quarantine.
 *
 * These cases hold the repaired distinction against the real repository. The
 * fixture proof that the classification can fail lives beside the census's own
 * cases in `test-ci-coverage-census.test.ts`; what is held here is that the
 * finding is real and stays repaired.
 */

const repoRoot = path.resolve(__dirname, "../../..");

type DirectoryRow = {
  directory: string;
  testFiles: number;
  coveredTestFiles?: number;
  declaredQuarantineTestFiles: number;
  untriagedUnrunTestFiles: number;
};

type Census = {
  counts: {
    uncoveredTestFiles: number;
    declaredQuarantineTestFiles: number;
    untriagedUnrunTestFiles: number;
  };
  partiallyCoveredDirectories: DirectoryRow[];
  uncoveredDirectories: DirectoryRow[];
  governedRiskRanking: { directory: string; untriagedUnrunTestFiles: number }[];
  unrunTestPathsByDirectory?: {
    directory: string;
    unrunTestPaths: string[];
  }[];
};

function runCensus(explain = false): Census {
  const output = execFileSync(
    process.execPath,
    [
      path.join(repoRoot, "scripts/quality/test-ci-coverage-census.mjs"),
      explain ? "--explain" : "--json",
      ...(explain ? ["--json"] : []),
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(output.slice(output.indexOf("{"))) as Census;
}

let census: Census;
let rows: Map<string, DirectoryRow>;

beforeAll(() => {
  census = runCensus();
  rows = new Map(
    [...census.partiallyCoveredDirectories, ...census.uncoveredDirectories].map(
      (row) => [row.directory, row],
    ),
  );
});

/**
 * The two directories the T-471 draw took eleven of its twenty files from.
 * Both were ranked as triage work; neither had an untriaged file in it.
 */
const FULLY_TRIAGED = [
  "src/__tests__/integration/source",
  "src/lib/auth/__tests__",
] as const;

describe("declared quarantines are not offered as work to triage", () => {
  it("splits the uncovered set into triaged and untriaged, and loses nothing", () => {
    // An identity, not a threshold: every uncovered file is in exactly one of
    // the two classes. A classifier that double-counts or drops a file breaks
    // this before it breaks anything anyone would notice.
    expect(
      census.counts.declaredQuarantineTestFiles +
        census.counts.untriagedUnrunTestFiles,
    ).toBe(census.counts.uncoveredTestFiles);
    expect(census.counts.declaredQuarantineTestFiles).toBeGreaterThan(0);
  });

  it.each(FULLY_TRIAGED)(
    "%s holds unrun files and none of them are untriaged",
    (directory) => {
      const row = rows.get(directory);
      expect(row).toBeDefined();
      expect(row!.declaredQuarantineTestFiles).toBeGreaterThan(0);
      // The ratchet: a NEW dark file dropped into either directory fails here,
      // because it would be unrun and named by nothing.
      expect(row!.untriagedUnrunTestFiles).toBe(0);
    },
  );

  it.each(FULLY_TRIAGED)("%s is not ranked as triage work", (directory) => {
    expect(
      census.governedRiskRanking.map((row) => row.directory),
    ).not.toContain(directory);
  });

  it("ranks nothing whose unrun set is entirely declared quarantine", () => {
    for (const row of census.governedRiskRanking) {
      expect(row.untriagedUnrunTestFiles).toBeGreaterThan(0);
    }
  });

  /**
   * The limit of the mechanism, held explicitly so it is not mistaken for
   * coverage of something it does not measure.
   *
   * `MovesPhaseStandaloneClient.test.tsx` was also triaged — a comment in
   * `ai-surface-control-catalog.yml` records its four red cases and the
   * workflow names its 13 green siblings instead of the directory. That is
   * exclusion by OMISSION, and it leaves nothing in any command for the census
   * to read, so the file stays untriaged here and keeps its directory in the
   * ranking. Only an exclusion written as `--testPathIgnorePatterns` against a
   * command that names the path is machine-readable as triage.
   */
  it("does not credit an exclusion by omission as a declared quarantine", () => {
    const row = rows.get("src/components/strategic-moves/__tests__");
    expect(row).toBeDefined();
    expect(row!.declaredQuarantineTestFiles).toBe(0);
    expect(row!.untriagedUnrunTestFiles).toBeGreaterThan(0);
    expect(
      census.governedRiskRanking.map((entry) => entry.directory),
    ).toContain("src/components/strategic-moves/__tests__");
  });
});
