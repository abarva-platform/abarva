import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  describeDrift,
  describeShapeDrift,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

/**
 * The committed coverage census is a derived file refreshed by hand, by a
 * recorded decision: it is a measurement with no failure path, and `--write`
 * belongs to whoever is re-measuring rather than to a PR check.
 *
 * The cost of that choice was invisible. The committed file is the input to
 * which directory gets wired next, so a stale one mis-ranks that queue, and
 * nobody sees the staleness until someone regenerates and finds the rank-1
 * entry inside an 800-line diff. So the census prints how far the committed
 * file has drifted. It reports; it does not gate.
 *
 * **The first version of the drift report was vacuous and printed the
 * opposite of the truth.** It compared `committed.coveredTestFiles` against
 * the same name on the measured object. The counts live under `counts`, so
 * both sides were `undefined`, no difference was found, and it printed
 * "committed census matches this run" against a file that was 43 covered
 * files stale. A report that cannot fail is worse than none, because it is
 * read as assurance.
 *
 * **And the guard written against that bug had the same shape as the bug.**
 * It read this script's source text and asserted that certain strings
 * appeared in it — `expect(body).toContain("committed?.counts")`, and that a
 * sentence about reporting rather than gating was present. That checks the
 * prose, not the comparison. The original bug would have passed it: it was a
 * real comparison of the wrong two fields, saying all the right things while
 * doing it, and every string those cases looked for could sit in a file whose
 * arithmetic was wrong.
 *
 * The comparison is now driven directly, with a committed census written to
 * a temp file, so each case can fail for the reason it names.
 */

type Counts = Record<string, number>;

const tmpRoot = mkdtempSync(path.join(tmpdir(), "census-drift-"));
let fixtureSeq = 0;

/** Write a committed-census fixture and return its path. */
function committedCensus(body: unknown): string {
  fixtureSeq += 1;
  const file = path.join(tmpRoot, `committed-${fixtureSeq}.json`);
  writeFileSync(file, typeof body === "string" ? body : JSON.stringify(body));
  return file;
}

function measured(counts: Counts): { counts: Counts } {
  return { counts };
}

/**
 * The fields `describeDrift` compares, which is the whole of what this suite is
 * about. The last two arrived with the unclassified split (T-758): the census
 * gained two counts saying how many of its unclassified directories resolved no
 * product module at all, and a count this report does not name is a count that
 * goes stale under a line reading "matches this run". They are in the baseline
 * rather than in a case of their own so that every case below — the fall, the
 * one-field move, the partial shape — is exercised over the real field list.
 */
const BASELINE: Counts = {
  testFiles: 2300,
  coveredTestFiles: 890,
  uncoveredTestFiles: 1410,
  unclassifiedRiskDirectoriesWithResolvedProductSources: 174,
  unclassifiedRiskDirectoriesWithNoResolvedProductSource: 6,
};

describe("the coverage census reports its own drift", () => {
  it("says the file is current when the counts agree", () => {
    const result = describeDrift(
      measured(BASELINE),
      committedCensus({ counts: { ...BASELINE } }),
    );

    expect(result.state).toBe("current");
    expect(result.line).toContain("matches this run");
  });

  it("names every field that moved, with its direction", () => {
    const result = describeDrift(
      measured({ ...BASELINE, testFiles: 2320, coveredTestFiles: 910 }),
      committedCensus({ counts: { ...BASELINE } }),
    );

    expect(result.state).toBe("drifted");
    expect(result.line).toContain("STALE");
    expect(result.line).toContain("testFiles 2300 -> 2320 (+20)");
    expect(result.line).toContain("coveredTestFiles 890 -> 910 (+20)");
    // uncoveredTestFiles did not move, so it must not be listed.
    expect(result.line).not.toContain("uncoveredTestFiles");
  });

  it("reports a fall as well as a rise", () => {
    // Drift is not one-directional: deleting test files moves the counts down,
    // and a report that only notices increases would call that current.
    const result = describeDrift(
      measured({ ...BASELINE, testFiles: 2280 }),
      committedCensus({ counts: { ...BASELINE } }),
    );

    expect(result.state).toBe("drifted");
    expect(result.line).toContain("testFiles 2300 -> 2280 (-20)");
  });

  it("catches a single field moving by one", () => {
    // The smallest drift there is. A comparison that rounded, sampled, or
    // required more than one field to move would call this current.
    const result = describeDrift(
      measured({ ...BASELINE, coveredTestFiles: BASELINE.coveredTestFiles + 1 }),
      committedCensus({ counts: { ...BASELINE } }),
    );

    expect(result.state).toBe("drifted");
  });

  it("refuses to say 'matches' when the counts are not where it looked", () => {
    // This is the original bug, reproduced. The committed file carries the
    // right numbers at the TOP level instead of under `counts`, so a reader
    // looking at the top level finds undefined on one side and undefined on
    // the other, finds no difference, and reports agreement.
    //
    // The correct answer is not "current" and not "drifted" — it is that the
    // comparison could not be made.
    const result = describeDrift(
      measured(BASELINE),
      committedCensus({ ...BASELINE }),
    );

    expect(result.state).toBe("unreadable");
    expect(result.state).not.toBe("current");
    expect(result.line).toMatch(/cannot compare/);
    expect(result.line).toContain("testFiles");
  });

  it("refuses when any one of the compared fields is missing", () => {
    // A partial shape change is the easy one to skip over: the rest compare
    // fine and one is quietly dropped, so the report speaks with authority
    // about most of the question. Driven over every field rather than over a
    // chosen one, so a field added to the comparison and forgotten here cannot
    // sit outside the case that exists to protect it.
    for (const field of Object.keys(BASELINE)) {
      const partial = { ...BASELINE };
      delete partial[field];

      const result = describeDrift(measured(BASELINE), committedCensus({ counts: partial }));

      expect(result.state).toBe("unreadable");
      expect(result.line).toContain(field);
    }
  });

  it("catches drift in the unclassified split, in both directions", () => {
    // The split is the number that says which half of `unclassified` a
    // directory is in, and it is read by whoever is choosing what to triage
    // next. Asserted in both directions because a comparison that only noticed
    // the resolver getting worse would call an improvement agreement (T-758).
    const worse = describeDrift(
      measured({
        ...BASELINE,
        unclassifiedRiskDirectoriesWithResolvedProductSources: 170,
        unclassifiedRiskDirectoriesWithNoResolvedProductSource: 10,
      }),
      committedCensus({ counts: { ...BASELINE } }),
    );
    expect(worse.state).toBe("drifted");
    expect(worse.line).toContain(
      "unclassifiedRiskDirectoriesWithNoResolvedProductSource 6 -> 10 (+4)",
    );

    const better = describeDrift(
      measured({
        ...BASELINE,
        unclassifiedRiskDirectoriesWithResolvedProductSources: 179,
        unclassifiedRiskDirectoriesWithNoResolvedProductSource: 1,
      }),
      committedCensus({ counts: { ...BASELINE } }),
    );
    expect(better.state).toBe("drifted");
    expect(better.line).toContain(
      "unclassifiedRiskDirectoriesWithNoResolvedProductSource 6 -> 1 (-5)",
    );
  });

  it("reports an absent committed census as absent, not as agreement", () => {
    const result = describeDrift(
      measured(BASELINE),
      path.join(tmpRoot, "no-such-census.json"),
    );

    expect(result.state).toBe("absent");
    expect(result.state).not.toBe("current");
  });

  it("reports an unparseable committed census rather than throwing", () => {
    const result = describeDrift(measured(BASELINE), committedCensus("{ not json"));

    expect(result.state).toBe("unreadable");
    expect(result.state).not.toBe("current");
  });

  it("never reports 'current' for anything but real agreement", () => {
    // The summary of all of the above, stated as the property that matters:
    // of every shape this can be handed, exactly one earns "current".
    const cases: Array<[string, ReturnType<typeof describeDrift>]> = [
      ["agreeing", describeDrift(measured(BASELINE), committedCensus({ counts: { ...BASELINE } }))],
      ["drifted", describeDrift(measured({ ...BASELINE, testFiles: 1 }), committedCensus({ counts: { ...BASELINE } }))],
      ["top-level counts", describeDrift(measured(BASELINE), committedCensus({ ...BASELINE }))],
      ["empty object", describeDrift(measured(BASELINE), committedCensus({}))],
      ["unparseable", describeDrift(measured(BASELINE), committedCensus("{"))],
      ["absent", describeDrift(measured(BASELINE), path.join(tmpRoot, "gone.json"))],
    ];

    const current = cases.filter(([, r]) => r.state === "current").map(([name]) => name);
    expect(current).toEqual(["agreeing"]);
  });

  /**
   * The counts above are a report. `describeShapeDrift` is the gate, and it
   * compares SETS of directories rather than counts, because a set moves when a
   * directory changes state and not on every pull request that adds a test.
   *
   * The unmeasured set joined it with the unclassified split (T-758). A
   * directory that stops resolving its imports slides from "measured, matched
   * no signal" to "the census followed nothing out of here" while every other
   * published field stays identical — which is how one word came to cover 180
   * directories without anyone noticing. Gated in both directions: a directory
   * that starts resolving has to move the gate too, or the census can only ever
   * be refreshed into a worse state.
   */
  describe("and gates the unmeasured set", () => {
    const directoryRow = (directory: string, productSourceCount: number) => ({
      directory,
      governedRisk: { score: 0, band: "unclassified", signals: [], productSourceCount },
    });
    const withUnmeasured = (rows: ReturnType<typeof directoryRow>[]) => ({
      uncoveredDirectories: [],
      partiallyCoveredDirectories: [],
      unclassifiedRiskDirectories: rows,
    });

    it("says current when the unmeasured directories are the same set", () => {
      const both = withUnmeasured([
        directoryRow("src/lib/a/__tests__", 0),
        directoryRow("src/lib/b/__tests__", 3),
      ]);
      const result = describeShapeDrift(both, committedCensus(both));
      expect(result.state).toBe("current");
    });

    it("names a directory that stopped resolving its imports", () => {
      const was = withUnmeasured([directoryRow("src/lib/a/__tests__", 3)]);
      const now = withUnmeasured([directoryRow("src/lib/a/__tests__", 0)]);
      const result = describeShapeDrift(now, committedCensus(was));
      expect(result.state).toBe("drifted");
      expect(result.changes).toContain("+unmeasured src/lib/a/__tests__");
    });

    it("names a directory that started resolving them again", () => {
      const was = withUnmeasured([directoryRow("src/lib/a/__tests__", 0)]);
      const now = withUnmeasured([directoryRow("src/lib/a/__tests__", 2)]);
      const result = describeShapeDrift(now, committedCensus(was));
      expect(result.state).toBe("drifted");
      expect(result.changes).toContain("-unmeasured src/lib/a/__tests__");
    });
  });

  it("still reports rather than gates", () => {
    // The one thing that genuinely is a property of the source: the drift
    // block must not exit non-zero. Kept as a source read because there is no
    // return value that expresses "did not call process.exit", and narrowed
    // to the drift block rather than the whole file.
    const repoRoot = path.resolve(__dirname, "../../..");
    const body = readFileSync(
      path.join(repoRoot, "scripts/quality/test-ci-coverage-census.mjs"),
      "utf8",
    );
    const driftBlock = body.slice(body.indexOf("export function describeDrift"));

    expect(driftBlock).not.toMatch(/process\.exit\(\s*1\s*\)/);
  });
});
