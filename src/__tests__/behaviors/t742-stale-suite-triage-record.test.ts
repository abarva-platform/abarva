/**
 * Guard for the T-742 triage record.
 *
 * T-742 is the fifth draw of stale suites, after T-472, T-509, T-550 and
 * T-556. The controls below are T-556's, carried forward, with two changes
 * that this draw forced rather than two that seemed tidy:
 *
 *  1. TWO OF T-556's CONTROLS ARE VACUOUS HERE, AND THE RECORD SAYS SO.
 *     T-556's draw contained one source-text scanner and two red suites, so
 *     its guard asserted both populations were non-empty. This draw contains
 *     zero of each — which is the HEALTHY state — and carrying those
 *     preconditions forward would turn a clean draw red for being clean. That
 *     is the shape this repo keeps finding: a precondition that inverts the
 *     gate. So the RULES are kept in full (a scanner may never be wired; a
 *     non-green suite may never carry a pass-assuming verdict) and the
 *     non-empty preconditions are replaced by a control that cannot be
 *     satisfied by silence: the record must DECLARE that each population is
 *     empty, and this guard recomputes both from the rows and fails if the
 *     declaration and the rows disagree. A vacuous control is fine; a vacuous
 *     control a reader mistakes for one that fired is not.
 *
 *  2. THE DRAW'S CONCENTRATION IS DERIVED, NOT NARRATED. The pool at this base
 *     is one band and one score, so ranking collapses to path order and the
 *     draw becomes an alphabetical sweep of a single directory — nineteen of
 *     twenty. A reader told "twenty suites, highest governed risk first"
 *     pictures a spread across the tree. The record therefore publishes a
 *     per-directory breakdown, and this guard rebuilds it from suites[] and
 *     fails on any disagreement, so the concentration can never be understated
 *     by a record that was edited after the fact.
 *
 * These are not shape assertions. Each is a claim the record cannot make
 * falsely, and each was broken against a scratch copy to confirm it fails.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const RECORD_PATH = "docs/architecture/t742-stale-suite-triage.json";

const PRIOR_RECORD_PATHS = [
  "docs/architecture/t472-stale-suite-triage.json",
  "docs/architecture/t509-stale-suite-triage.json",
  "docs/architecture/t550-stale-suite-triage.json",
  "docs/architecture/t556-stale-suite-triage.json",
];

type Suite = {
  path: string;
  movedTo?: { path: string; byItem: string; reason: string };
  loaded: boolean;
  collected: boolean;
  run: boolean;
  green: boolean;
  totalTests: number;
  failedTests: number;
  passedTests: number;
  pendingTests: number;
  sourceTextScanner: boolean;
  textIsTheSubject?: boolean;
  textIsTheSubjectReason?: string;
  partialSourceTextCases?: number;
  partialSourceTextCaseNames?: string[];
  partialSourceTextCasesResolved?: {
    byItem: string;
    recordedAt: string;
    clearedCaseNames: string[];
    replacedWith: string[];
    how: string;
    provenMutations: string;
  };
  verdict: string;
  ownerItem: string;
  rationale: string;
};

type Record_ = {
  item: string;
  verdictVocabulary: string[];
  counts: Record<string, number>;
  suites: Suite[];
  claimedWriteFiles: string[];
  scope: { disjointFrom: string[]; drawSize: number };
  jestEvidence: {
    totals: {
      suitesExecuted: number;
      green: number;
      red: number;
      testsRun: number;
      testsPassed: number;
      testsFailed: number;
      testsPending: number;
    };
  };
  drawConcentration: {
    byDirectory: Record<string, number>;
    dominantDirectory: string;
    dominantDirectoryCount: number;
    whyItMatters: string;
  };
  vacuousControlsDeclared: { sourceTextScanner: string; redSuites: string };
  followOnItems: Record<string, string>;
  followUps?: {
    item: string;
    recordedAt: string;
    appliesTo: string;
    what: string;
    whyAppendedNotRestamped: string;
  }[];
};

const read = (relative: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), relative), "utf8"));

const record = read(RECORD_PATH) as Record_;

describe("T-742 stale suite triage record", () => {
  it("draws twenty suites and names each one only once", () => {
    expect(record.suites).toHaveLength(20);
    expect(record.scope.drawSize).toBe(20);
    const paths = record.suites.map((s) => s.path);
    expect(new Set(paths).size).toBe(20);
  });

  /*
   * As T-550 and T-556: a row is a snapshot at a base commit, so paths are
   * history and are never restamped. What may not happen is a row pointing at
   * nothing.
   */
  it("names files that exist, or records which later item moved them and where", () => {
    for (const suite of record.suites) {
      if (existsSync(path.join(process.cwd(), suite.path))) {
        expect(suite.movedTo).toBeUndefined();
        continue;
      }
      expect(typeof suite.movedTo?.path).toBe("string");
      expect(suite.movedTo?.byItem).toMatch(/^[A-Z]-\d{3}$/);
      expect(suite.movedTo?.byItem).not.toBe(record.item);
      expect(suite.movedTo?.reason.length).toBeGreaterThan(40);
      expect(
        existsSync(path.join(process.cwd(), suite.movedTo?.path ?? "")),
      ).toBe(true);
    }
  });

  it("judges no file an earlier triage record already judged", () => {
    const mine = new Set(record.suites.map((s) => s.path));
    expect(record.scope.disjointFrom.slice().sort()).toEqual(
      [...PRIOR_RECORD_PATHS].sort(),
    );
    for (const priorPath of PRIOR_RECORD_PATHS) {
      const prior = read(priorPath) as { item: string; suites: Suite[] };
      for (const suite of prior.suites) {
        expect({ path: suite.path, alreadyJudgedBy: prior.item }).toEqual({
          path: mine.has(suite.path) ? "__RE_JUDGED__" : suite.path,
          alreadyJudgedBy: prior.item,
        });
      }
    }
  });

  it("uses only the four declared verdicts", () => {
    for (const suite of record.suites) {
      expect(record.verdictVocabulary).toContain(suite.verdict);
    }
  });

  it("cannot call a suite green unless the record shows it executed and passed", () => {
    for (const suite of record.suites) {
      if (!suite.green) continue;
      expect(suite.run).toBe(true);
      expect(suite.totalTests).toBeGreaterThan(0);
      expect(suite.failedTests).toBe(0);
    }
  });

  it("cannot wire a suite into CI unless it ran green with nothing skipped", () => {
    const wiring = record.suites.filter((s) => s.verdict === "wire_into_ci");
    expect(wiring.length).toBeGreaterThan(0);
    for (const suite of wiring) {
      expect(suite.loaded).toBe(true);
      expect(suite.collected).toBe(true);
      expect(suite.run).toBe(true);
      expect(suite.green).toBe(true);
      expect(suite.totalTests).toBeGreaterThan(0);
      expect(suite.failedTests).toBe(0);
      expect(suite.pendingTests).toBe(0);
    }
  });

  /*
   * T-550's rule, kept in full and narrowed by T-556's distinction. The
   * non-empty precondition T-556 attached to it is NOT kept — see the header.
   */
  it("cannot wire a source-text scanner into CI", () => {
    for (const suite of record.suites) {
      if (!suite.sourceTextScanner) continue;
      expect(suite.verdict).not.toBe("wire_into_ci");
      if (!suite.textIsTheSubject) {
        expect(suite.verdict).toBe("rewrite_as_behavior");
      }
    }
  });

  it("lets a suite claim its subject is the text only with a written reason, and never to get wired", () => {
    for (const suite of record.suites) {
      if (!suite.textIsTheSubject) continue;
      expect(suite.sourceTextScanner).toBe(true);
      expect(suite.verdict).not.toBe("wire_into_ci");
      expect((suite.textIsTheSubjectReason ?? "").length).toBeGreaterThan(120);
    }
  });

  it("names every byte-matching case inside a suite it wires into CI", () => {
    for (const suite of record.suites) {
      const count = suite.partialSourceTextCases ?? 0;
      if (count === 0) {
        expect(suite.partialSourceTextCaseNames ?? []).toHaveLength(0);
        continue;
      }
      expect(suite.sourceTextScanner).toBe(false);
      expect(suite.partialSourceTextCaseNames).toHaveLength(count);
      expect(count).toBeLessThan(suite.totalTests);
      expect(suite.ownerItem).not.toBe(record.item);
    }
    expect(record.suites.some((s) => (s.partialSourceTextCases ?? 0) > 0)).toBe(
      true,
    );
  });

  /*
   * Item T-744. A follow-on item clears a byte-matching case by REWRITING it,
   * and it records that by appending beside the snapshot rather than by
   * editing the snapshot's counts. Two reasons, and the second is the one
   * that bites: the row is true of base `2e4960904` and stays true of it, and
   * `jestEvidence.totals` is recomputed from these rows by the control below,
   * so a row edited after the fact moves a total that nothing else moved.
   *
   * The note is not taken on trust. A resolution asserts a defect is GONE --
   * the mirror of the rule that an exemption must assert its defect still
   * exists -- so this reads the live suite and fails if the cleared case is
   * still there, or if the cases named as its replacements are not. A note
   * claiming a rewrite that never happened is the failure this is for.
   */
  it("verifies a cleared byte-matching case against the live suite, not against its own note", () => {
    const resolved = record.suites.filter(
      (s) => s.partialSourceTextCasesResolved,
    );
    for (const suite of resolved) {
      const note = suite.partialSourceTextCasesResolved!;
      expect(note.byItem).toMatch(/^[A-Z]-\d{3}$/);
      expect(note.byItem).not.toBe(record.item);
      expect(note.clearedCaseNames.length).toBeGreaterThan(0);
      expect(note.replacedWith.length).toBeGreaterThan(0);
      expect(note.how.length).toBeGreaterThan(120);
      expect(note.provenMutations.length).toBeGreaterThan(120);

      // It may only clear cases this draw actually named.
      for (const cleared of note.clearedCaseNames) {
        expect(suite.partialSourceTextCaseNames ?? []).toContain(cleared);
      }

      const file = path.join(process.cwd(), suite.path);
      expect(existsSync(file)).toBe(true);
      const source = readFileSync(file, "utf8");
      const titleOf = (name: string) => name.split(" :: ").pop() ?? name;

      for (const cleared of note.clearedCaseNames) {
        expect(source).not.toContain(titleOf(cleared));
      }
      for (const added of note.replacedWith) {
        expect(source).toContain(titleOf(added));
      }
    }

    // Every follow-up the record publishes has to point at a row, and say why
    // it appended instead of restamping.
    for (const followUp of record.followUps ?? []) {
      expect(followUp.item).toMatch(/^[A-Z]-\d{3}$/);
      expect(followUp.item).not.toBe(record.item);
      expect(record.suites.map((s) => s.path)).toContain(followUp.appliesTo);
      expect(followUp.whyAppendedNotRestamped.length).toBeGreaterThan(120);
    }
  });

  it("gives every non-green suite a verdict that does not assume it passes", () => {
    for (const suite of record.suites) {
      if (suite.green) continue;
      expect([
        "repair",
        "rewrite_as_behavior",
        "update_with_reason_recorded",
      ]).toContain(suite.verdict);
      expect(suite.failedTests).toBeGreaterThan(0);
      expect(suite.rationale.length).toBeGreaterThan(80);
    }
  });

  it("makes an update_with_reason_recorded verdict cite the change that made it stale", () => {
    for (const suite of record.suites) {
      if (suite.verdict !== "update_with_reason_recorded") continue;
      expect(suite.rationale).toMatch(/#\d{3,}|\b[0-9a-f]{7,40}\b/);
    }
  });

  /*
   * NEW. The two controls above are vacuous for this draw. A reader cannot see
   * that from a green run, and the previous guard's answer — assert the
   * population is non-empty — turns a clean draw red. So the record declares
   * each emptiness in writing and this recomputes it from the rows.
   */
  it("declares in writing that the scanner control did not fire, and the rows agree", () => {
    const scanners = record.suites.filter((s) => s.sourceTextScanner);
    expect(scanners).toHaveLength(0);
    expect(record.vacuousControlsDeclared.sourceTextScanner).toMatch(
      /VACUOUS/,
    );
    expect(
      record.vacuousControlsDeclared.sourceTextScanner.length,
    ).toBeGreaterThan(160);
  });

  it("declares in writing that the red-suite control did not fire, and the published red count equals the rows", () => {
    const red = record.suites.filter((s) => !s.green);
    expect(record.jestEvidence.totals.red).toBe(red.length);
    expect(record.jestEvidence.totals.green).toBe(
      record.suites.length - red.length,
    );
    expect(red).toHaveLength(0);
    expect(record.vacuousControlsDeclared.redSuites).toMatch(/VACUOUS/);
    expect(record.vacuousControlsDeclared.redSuites.length).toBeGreaterThan(
      160,
    );
  });

  /*
   * NEW. Nineteen of twenty land in one directory because the pool is one band
   * and one score. Derived here so the record cannot understate it.
   */
  it("derives the draw's directory concentration rather than narrating it", () => {
    const byDirectory: Record<string, number> = {};
    for (const suite of record.suites) {
      const dir = path.posix.dirname(suite.path);
      byDirectory[dir] = (byDirectory[dir] ?? 0) + 1;
    }
    expect(record.drawConcentration.byDirectory).toEqual(byDirectory);

    const [topDir, topCount] = Object.entries(byDirectory).sort(
      (a, b) => b[1] - a[1],
    )[0];
    expect(record.drawConcentration.dominantDirectory).toBe(topDir);
    expect(record.drawConcentration.dominantDirectoryCount).toBe(topCount);

    const summed = Object.values(byDirectory).reduce((a, b) => a + b, 0);
    expect(summed).toBe(record.suites.length);
    expect(record.drawConcentration.whyItMatters.length).toBeGreaterThan(200);
  });

  it("keeps the published per-suite test totals equal to the rows they summarise", () => {
    const summed = record.suites.reduce(
      (acc, s) => ({
        testsRun: acc.testsRun + s.totalTests,
        testsPassed: acc.testsPassed + s.passedTests,
        testsFailed: acc.testsFailed + s.failedTests,
        testsPending: acc.testsPending + s.pendingTests,
      }),
      { testsRun: 0, testsPassed: 0, testsFailed: 0, testsPending: 0 },
    );
    expect(record.jestEvidence.totals.suitesExecuted).toBe(
      record.suites.length,
    );
    expect(record.jestEvidence.totals.testsRun).toBe(summed.testsRun);
    expect(record.jestEvidence.totals.testsPassed).toBe(summed.testsPassed);
    expect(record.jestEvidence.totals.testsFailed).toBe(summed.testsFailed);
    expect(record.jestEvidence.totals.testsPending).toBe(summed.testsPending);
  });

  it("keeps the published counts equal to the rows they summarise", () => {
    for (const verdict of record.verdictVocabulary) {
      const actual = record.suites.filter((s) => s.verdict === verdict).length;
      expect(record.counts[verdict]).toBe(actual);
    }
    const summed = Object.values(record.counts).reduce((a, b) => a + b, 0);
    expect(summed).toBe(record.suites.length);
  });

  it("did not edit any file it passed judgement on", () => {
    for (const suite of record.suites) {
      expect(record.claimedWriteFiles).not.toContain(suite.path);
    }
  });

  it("hands every suite to a named follow-on item that this record also describes", () => {
    for (const suite of record.suites) {
      expect(suite.ownerItem).toMatch(/^T-\d{3}$/);
      expect(suite.ownerItem).not.toBe(record.item);
      expect(Object.keys(record.followOnItems)).toContain(suite.ownerItem);
      expect(record.followOnItems[suite.ownerItem].length).toBeGreaterThan(60);
    }
  });
});
