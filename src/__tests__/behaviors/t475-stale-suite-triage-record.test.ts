/**
 * Guard for the T-475 triage record.
 *
 * T-475 is the sixth and last draw the governed-risk ranking can supply, after
 * T-472, T-509, T-550, T-556 and T-742. The controls below are T-742's, carried
 * forward, with three changes this draw forced rather than three that seemed
 * tidy:
 *
 *  1. THE RED-SUITE CONTROL FIRES HERE. T-742 declared it vacuous because that
 *     draw was twenty green suites. This draw is nine green and three red, so
 *     the rule that a non-green suite may never carry a pass-assuming verdict
 *     does real work, and the declaration says NOT VACUOUS rather than VACUOUS.
 *     The scanner control is the one that is vacuous this time, and it is
 *     declared in writing and recomputed from the rows, exactly as T-742 did,
 *     so a reader cannot mistake silence for a control that fired.
 *
 *  2. NEW, AND THE REASON THIS DRAW IS NOT JUST A LIST: `wire_into_ci` NOW
 *     REQUIRES A CAUGHT MUTATION. The acceptance says a green suite is
 *     mutation-checked before it is credited, because green is not the same as
 *     load-bearing. Nine green suites each had one behaviour-changing edit
 *     applied to the product module they import; eight caught it and one did
 *     not. Without a control, "we mutation-checked them" is a sentence in a
 *     record. With it, a row cannot be credited for CI unless its recorded
 *     mutation names a subject file that exists and reports at least one case
 *     failing under it — and the one escape is forced to carry `repair`.
 *
 *  3. NEW: THE RECORD'S VERDICTS ARE PINNED TO THE FILE THEY JUDGE. The item
 *     asks for a control that fails when a recorded verdict no longer matches
 *     the file. Every case title this draw executed and found literally in the
 *     suite is recorded, and this guard reads the live file and fails when one
 *     is gone. A suite rewritten under a stale verdict then turns this red
 *     instead of sitting unnoticed, which is the state all six draws exist to
 *     end. Titles an `it.each` table interpolates are counted, not pinned, and
 *     the record says which are which — a pinned title that cannot exist would
 *     be a gate that can only fail.
 *
 * These are not shape assertions. Each is a claim the record cannot make
 * falsely, and each was broken against a scratch copy to confirm it fails.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const RECORD_PATH = "docs/architecture/t475-stale-suite-triage.json";

const PRIOR_RECORD_PATHS = [
  "docs/architecture/t472-stale-suite-triage.json",
  "docs/architecture/t509-stale-suite-triage.json",
  "docs/architecture/t550-stale-suite-triage.json",
  "docs/architecture/t556-stale-suite-triage.json",
  "docs/architecture/t742-stale-suite-triage.json",
];

type MutationCheck = {
  applied?: string;
  subject?: string;
  caught?: boolean;
  failedCasesUnderMutation?: number;
  escape?: string;
  notApplicable?: string;
};

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
  verdict: string;
  ownerItem: string;
  rationale: string;
  mutationCheck: MutationCheck;
  literalCaseTitles: string[];
  generatedCaseTitles: number;
  generatedCaseTitlesReason: string | null;
  governedRiskSignalsAsRanked: string[];
  governedRiskSignalsFromItsOwnImports: string[];
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
  mutationEvidence: {
    greenSuitesMutated: number;
    caught: number;
    escaped: number;
    escapeIsNotCreditedAsProof: string;
    noOpMutationsRuledOut: string;
  };
  riskAttribution: {
    filesCarryingTheSignalOnTheirOwnImports: number;
    filesInheritingItFromADirectorySibling: number;
    theAnswer: string;
  };
  drawConcentration: {
    byDirectory: Record<string, number>;
    dominantDirectory: string;
    dominantDirectoryCount: number;
    whyItMatters: string;
  };
  vacuousControlsDeclared: { sourceTextScanner: string; redSuites: string };
  followOnItems: Record<string, string>;
};

const read = (relative: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), relative), "utf8"));

const record = read(RECORD_PATH) as Record_;

describe("T-475 stale suite triage record", () => {
  it("draws twelve suites and names each one only once", () => {
    expect(record.suites).toHaveLength(12);
    expect(record.scope.drawSize).toBe(12);
    expect(new Set(record.suites.map((s) => s.path)).size).toBe(12);
  });

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
      expect(existsSync(path.join(process.cwd(), suite.movedTo?.path ?? ""))).toBe(true);
    }
  });

  it("judges no file an earlier triage record already judged", () => {
    const mine = new Set(record.suites.map((s) => s.path));
    expect(record.scope.disjointFrom.slice().sort()).toEqual([...PRIOR_RECORD_PATHS].sort());
    for (const priorPath of PRIOR_RECORD_PATHS) {
      const prior = read(priorPath) as { item: string; suites: { path: string }[] };
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
   * NEW. Green is not load-bearing. A row may only be credited for CI if a
   * behaviour-changing edit to the module it imports was applied and at least
   * one of its cases failed under it — and the subject has to be a file that
   * exists, so a mutation cannot be recorded against a module that is gone.
   */
  it("cannot wire a suite into CI unless a mutation of its subject was caught", () => {
    for (const suite of record.suites) {
      if (suite.verdict !== "wire_into_ci") continue;
      const check = suite.mutationCheck;
      expect(check.notApplicable).toBeUndefined();
      expect(check.caught).toBe(true);
      expect(check.failedCasesUnderMutation ?? 0).toBeGreaterThan(0);
      expect((check.applied ?? "").length).toBeGreaterThan(30);
      expect(existsSync(path.join(process.cwd(), check.subject ?? ""))).toBe(true);
    }
  });

  /*
   * NEW, the other half: a green suite whose mutation SURVIVED may not be
   * credited, and has to say what escaped. This is the control that keeps one
   * row from being quietly promoted later.
   */
  it("refuses to credit a green suite whose mutation escaped, and makes it say what escaped", () => {
    const escapes = record.suites.filter(
      (s) => s.mutationCheck.notApplicable === undefined && s.mutationCheck.caught === false,
    );
    expect(escapes).toHaveLength(record.mutationEvidence.escaped);
    for (const suite of escapes) {
      expect(suite.green).toBe(true);
      expect(suite.verdict).toBe("repair");
      expect(suite.mutationCheck.failedCasesUnderMutation).toBe(0);
      expect((suite.mutationCheck.escape ?? "").length).toBeGreaterThan(120);
    }
    expect(record.mutationEvidence.noOpMutationsRuledOut.length).toBeGreaterThan(120);
    expect(record.mutationEvidence.escapeIsNotCreditedAsProof.length).toBeGreaterThan(60);
  });

  it("keeps the published mutation tally equal to the rows it summarises", () => {
    const mutated = record.suites.filter((s) => s.mutationCheck.notApplicable === undefined);
    const caught = mutated.filter((s) => s.mutationCheck.caught === true);
    expect(record.mutationEvidence.greenSuitesMutated).toBe(mutated.length);
    expect(record.mutationEvidence.caught).toBe(caught.length);
    expect(record.mutationEvidence.escaped).toBe(mutated.length - caught.length);
    // Only a green suite is mutated; a red one's failure is already the measurement.
    for (const suite of mutated) expect(suite.green).toBe(true);
    for (const suite of record.suites) {
      if (suite.green) continue;
      expect((suite.mutationCheck.notApplicable ?? "").length).toBeGreaterThan(20);
    }
  });

  /*
   * NEW. The item asks for a control that fails when a recorded verdict no
   * longer matches the file it judges. A verdict is about the cases that ran,
   * so the cases are pinned: every title this draw executed and found
   * literally in the suite must still be there.
   */
  it("fails when a suite no longer contains the cases its verdict was written about", () => {
    let pinned = 0;
    for (const suite of record.suites) {
      if (!existsSync(path.join(process.cwd(), suite.path))) continue;
      const source = readFileSync(path.join(process.cwd(), suite.path), "utf8");
      expect(suite.literalCaseTitles.length + suite.generatedCaseTitles).toBe(suite.totalTests);
      for (const title of suite.literalCaseTitles) {
        expect({ suite: suite.path, title, present: source.includes(title) }).toEqual({
          suite: suite.path,
          title,
          present: true,
        });
        pinned += 1;
      }
      if (suite.generatedCaseTitles > 0) {
        expect((suite.generatedCaseTitlesReason ?? "").length).toBeGreaterThan(60);
      } else {
        expect(suite.generatedCaseTitlesReason).toBeNull();
      }
    }
    // A control that pinned nothing would pass on an empty record.
    expect(pinned).toBeGreaterThan(40);
  });

  it("cannot wire a source-text scanner into CI", () => {
    for (const suite of record.suites) {
      if (!suite.sourceTextScanner) continue;
      expect(suite.verdict).not.toBe("wire_into_ci");
    }
  });

  it("gives every non-green suite a verdict that does not assume it passes", () => {
    for (const suite of record.suites) {
      if (suite.green) continue;
      expect(["repair", "rewrite_as_behavior", "update_with_reason_recorded"]).toContain(
        suite.verdict,
      );
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

  it("declares in writing that the scanner control did not fire, and the rows agree", () => {
    expect(record.suites.filter((s) => s.sourceTextScanner)).toHaveLength(0);
    expect(record.vacuousControlsDeclared.sourceTextScanner).toMatch(/VACUOUS/);
    expect(record.vacuousControlsDeclared.sourceTextScanner.length).toBeGreaterThan(160);
  });

  it("declares in writing that the red-suite control DID fire, and the published red count equals the rows", () => {
    const red = record.suites.filter((s) => !s.green);
    expect(record.jestEvidence.totals.red).toBe(red.length);
    expect(record.jestEvidence.totals.green).toBe(record.suites.length - red.length);
    expect(red.length).toBeGreaterThan(0);
    expect(record.vacuousControlsDeclared.redSuites).toMatch(/NOT VACUOUS/);
    expect(record.vacuousControlsDeclared.redSuites.length).toBeGreaterThan(160);
  });

  /*
   * NEW. The ranking is directory-grained: governedRiskForDirectory is computed
   * over every test file in a directory, so a file inherits its neighbours'
   * band. The record publishes both numbers per row; this rebuilds the split
   * from the rows so the summary cannot understate it.
   */
  it("derives how much of the draw was ranked on its own imports rather than a neighbour's", () => {
    const own = record.suites.filter((s) =>
      s.governedRiskSignalsFromItsOwnImports.includes("tenant_scoped_read"),
    );
    const inherited = record.suites.filter(
      (s) =>
        !s.governedRiskSignalsFromItsOwnImports.includes("tenant_scoped_read") &&
        s.governedRiskSignalsAsRanked.includes("tenant_scoped_read"),
    );
    expect(record.riskAttribution.filesCarryingTheSignalOnTheirOwnImports).toBe(own.length);
    expect(record.riskAttribution.filesInheritingItFromADirectorySibling).toBe(inherited.length);
    expect(own.length + inherited.length).toBe(record.suites.length);
    expect(record.riskAttribution.theAnswer.length).toBeGreaterThan(200);
    // Directory grain can only inflate a file's band, never deflate it.
    for (const suite of record.suites) {
      for (const signal of suite.governedRiskSignalsFromItsOwnImports) {
        expect(suite.governedRiskSignalsAsRanked).toContain(signal);
      }
    }
  });

  it("derives the draw's directory concentration rather than narrating it", () => {
    const byDirectory: Record<string, number> = {};
    for (const suite of record.suites) {
      const dir = path.posix.dirname(suite.path);
      byDirectory[dir] = (byDirectory[dir] ?? 0) + 1;
    }
    expect(record.drawConcentration.byDirectory).toEqual(byDirectory);
    const [topDir, topCount] = Object.entries(byDirectory).sort((a, b) => b[1] - a[1])[0];
    expect(record.drawConcentration.dominantDirectory).toBe(topDir);
    expect(record.drawConcentration.dominantDirectoryCount).toBe(topCount);
    expect(Object.values(byDirectory).reduce((a, b) => a + b, 0)).toBe(record.suites.length);
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
    expect(record.jestEvidence.totals.suitesExecuted).toBe(record.suites.length);
    expect(record.jestEvidence.totals.testsRun).toBe(summed.testsRun);
    expect(record.jestEvidence.totals.testsPassed).toBe(summed.testsPassed);
    expect(record.jestEvidence.totals.testsFailed).toBe(summed.testsFailed);
    expect(record.jestEvidence.totals.testsPending).toBe(summed.testsPending);
  });

  it("keeps the published counts equal to the rows they summarise", () => {
    for (const verdict of record.verdictVocabulary) {
      expect(record.counts[verdict]).toBe(
        record.suites.filter((s) => s.verdict === verdict).length,
      );
    }
    expect(Object.values(record.counts).reduce((a, b) => a + b, 0)).toBe(record.suites.length);
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
