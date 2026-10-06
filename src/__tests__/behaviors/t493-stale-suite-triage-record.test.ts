/**
 * Guard for the T-493 triage record.
 *
 * T-493 is the eighth draw of stale suites, after T-472, T-475, T-479, T-509,
 * T-550, T-556, T-742 and T-492: 50 files across ten directories, five each.
 * The controls below are T-492's, carried forward, with three changes this draw
 * forced rather than three that seemed tidy.
 *
 *  1. A ROW MAY BE HANDED TO NOBODY, AND THEN IT HAS TO SAY WHY IN A FORM THAT
 *     IS NOT SILENCE. T-492 could assert that every unwired row names a
 *     follow-on item, because ids were available to file one. They are not: both
 *     T-lane bands an agent may draw from report 0 of 100 free on this base, so
 *     the successor that would wire the held directory cannot be filed at all.
 *     Naming an unfiled id in a permanent record is worse than naming none — an
 *     id that looks filed is one a sibling run can spend on something else,
 *     which is the collision the band rule exists to prevent. So the rule is
 *     split: an unwired row EITHER names a follow-on this record also describes,
 *     OR carries `ownerItem: null` with an `ownerItemUnfiled` block, and then
 *     the record must carry an `unfiledSuccessor` section as well. The second
 *     branch is also restricted: a row whose verdict is `rewrite_as_behavior` or
 *     `update_with_reason_recorded` may NOT take it, because those verdicts name
 *     work someone has to do and an existing item already owns each class here.
 *
 *  2. THE RANK IN THE FILING WAS WRONG AND THE RECORD CARRIES BOTH NUMBERS. The
 *     item names ranks 19-28; on this base the same ten directories are 14-23,
 *     because T-492 wired five directories out of the untriaged set an hour
 *     earlier. Every row stores `governedRiskRankAsFiled` and
 *     `governedRiskRankOnThisBase`, and the case below asserts they differ by
 *     exactly the same amount for all fifty. A uniform offset is evidence of one
 *     event moving the whole list; a scattered one would mean the draw itself had
 *     changed and the directory set would need re-deriving rather than
 *     explaining.
 *
 *  3. THE MECHANICAL CLASSIFIER WAS WRONG FIRST, AND THE RECORD PUBLISHES THE
 *     CORRECTION. Its first pass bound identifiers assigned from `readFileSync`
 *     by NAME and counted any case body containing that token: it reported 32 of
 *     43 cases in `run-migrations.test.ts` as byte-matching, because the
 *     identifier was `sql` in a suite about a SQL migration runner. The second
 *     pass asks whether a case body holds a read call whose own argument
 *     expression is anchored to the repository root, which is a question a regex
 *     can answer, and reports 1. A case below asserts that correction is still
 *     described, because the number a later reader will quote is the corrected
 *     one and the reason it is trustworthy is that the first one is on the
 *     record.
 *
 * These are not shape assertions. Each is a claim the record cannot make
 * falsely, and each was broken against a scratch copy of the record to confirm
 * it fails.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const RECORD_PATH = "docs/architecture/t493-stale-suite-triage.json";

/*
 * All eight prior stale-suite records, plus the three triage records under
 * docs/architecture that are not stale-suite draws. The item's own text names
 * five to reconcile against; using the full set is the stronger claim and it
 * costs nothing, because disjointness is asserted rather than asked for.
 */
const PRIOR_STALE_RECORD_PATHS = [
  "docs/architecture/t472-stale-suite-triage.json",
  "docs/architecture/t475-stale-suite-triage.json",
  "docs/architecture/t479-stale-suite-triage.json",
  "docs/architecture/t492-stale-suite-triage.json",
  "docs/architecture/t509-stale-suite-triage.json",
  "docs/architecture/t550-stale-suite-triage.json",
  "docs/architecture/t556-stale-suite-triage.json",
  "docs/architecture/t742-stale-suite-triage.json",
];
const PRIOR_OTHER_TRIAGE_PATHS = [
  "docs/architecture/programs-governance-integration-triage.json",
  "docs/architecture/t478-source-workspace-wiring-triage.json",
  "docs/architecture/t758-zero-product-source-triage.json",
];

type Suite = {
  path: string;
  draw: string;
  directory: string;
  governedRiskBand: string;
  governedRiskScore: number;
  governedRiskRankAsFiled: number;
  governedRiskRankOnThisBase: number;
  admittedBy: string;
  movedTo?: { path: string; byItem: string; reason: string };
  loaded: boolean;
  collected: boolean;
  run: boolean;
  green: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  pendingTests: number;
  readsRepositoryFileText: boolean;
  repoAnchoredReadCalls: number;
  staticCaseOpeners: number;
  caseAttributionReliable: boolean;
  byteMatchingCaseNames: string[];
  sourceTextScanner: boolean;
  textIsTheSubject?: boolean;
  textIsTheSubjectReason?: string;
  notAScannerReason?: string;
  partialSourceTextCases?: number;
  verdict: string;
  ownerItem: string | null;
  ownerItemUnfiled?: { blocker: string; reason: string };
  deferredReason?: string;
  wiredInThisItem: boolean;
  rationale: string;
};

type Record_ = {
  item: string;
  base: string;
  verdictVocabulary: string[];
  counts: Record<string, number>;
  suites: Suite[];
  claimedWriteFiles: string[];
  scope: {
    disjointFrom: string[];
    drawSize: number;
    directories: string[];
    ranksMovedUnderTheFiling: string;
    nonTestsDirectories: string;
  };
  jestEvidence: {
    alsoRunTogether: string;
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
  caseAttribution: {
    unattributableSuites: string[];
    unattributableCount: number;
    whyPublishedRatherThanGuessed: string;
  };
  classifierCorrection: {
    whatTheFirstPassReported: string;
    whyItWasWrong: string;
    whatTheSecondPassAsks: string;
    theLimitOfTheInstrument: string;
  };
  wiring: {
    workflow: string;
    directories: string[];
    suitesWired: number;
    casesWired: number;
  };
  heldDirectories: Record<string, string>;
  drawConcentration: {
    byDirectory: Record<string, number>;
    dominantDirectory: string;
    dominantDirectoryCount: number;
    whyItMatters: string;
  };
  vacuousControlsDeclared: {
    sourceTextScanner: string;
    redSuites: string;
    partialSourceTextCases: string;
    caseAttribution: string;
  };
  followOnItems: Record<string, string>;
  unfiledSuccessor: {
    whatIsOwed: string;
    whyItIsNotFiled: string;
    howItIsKeptVisible: string;
  };
};

const read = (relative: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), relative), "utf8"));

const record = read(RECORD_PATH) as Record_;

describe("T-493 stale suite triage record", () => {
  it("draws 50 suites and names each one only once", () => {
    expect(record.suites).toHaveLength(50);
    expect(record.scope.drawSize).toBe(50);
    const paths = record.suites.map((s) => s.path);
    expect(new Set(paths).size).toBe(50);
  });

  it("covers exactly the ten directories it says it drew from, five files each", () => {
    // The draw is ten directories, and a row that slipped in from an eleventh
    // would be work nobody chose. Set equality in both directions.
    expect([...new Set(record.suites.map((s) => s.directory))].sort()).toEqual(
      [...record.scope.directories].sort(),
    );
    // This draw is flat: every directory holds exactly five drawn files. That is
    // what makes the path ordering meaningless and is asserted so a future
    // reader cannot take row order for risk order.
    for (const directory of record.scope.directories) {
      expect({
        directory,
        drawn: record.suites.filter((s) => s.directory === directory).length,
      }).toEqual({ directory, drawn: 5 });
    }
  });

  /*
   * As T-550, T-556, T-742 and T-492: a row is a snapshot at a base commit, so
   * paths are history and are never restamped. What may not happen is a row
   * pointing at nothing.
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
      [...PRIOR_STALE_RECORD_PATHS].sort(),
    );
    for (const priorPath of [
      ...PRIOR_STALE_RECORD_PATHS,
      ...PRIOR_OTHER_TRIAGE_PATHS,
    ]) {
      const prior = read(priorPath) as { item?: string; suites?: Suite[] };
      for (const suite of prior.suites ?? []) {
        // Reported as an object so a failure prints WHICH record and WHICH path
        // rather than just `false`.
        expect({ path: suite.path, alreadyJudgedBy: prior.item ?? priorPath }).toEqual({
          path: mine.has(suite.path) ? "__RE_JUDGED__" : suite.path,
          alreadyJudgedBy: prior.item ?? priorPath,
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
    const wiring = record.suites.filter((s) => s.wiredInThisItem);
    expect(wiring.length).toBeGreaterThan(0);
    for (const suite of wiring) {
      expect(suite.verdict).toBe("wire_into_ci");
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
   * non-empty precondition T-556 attached to it is not kept — see T-742, which
   * removed it for inverting the gate on a clean draw.
   */
  it("cannot wire a source-text scanner into CI", () => {
    for (const suite of record.suites) {
      if (!suite.sourceTextScanner) continue;
      expect(suite.verdict).not.toBe("wire_into_ci");
      expect(suite.wiredInThisItem).toBe(false);
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

  it("constrains the scanner verdict in both directions against the mechanical signal", () => {
    for (const suite of record.suites) {
      if (suite.sourceTextScanner) {
        // A scanner that reads no repository file is a mislabel, not a
        // judgement, and the read count has to back the boolean.
        expect({
          path: suite.path,
          readsRepositoryFileText: suite.readsRepositoryFileText,
          repoAnchoredReadCalls: suite.repoAnchoredReadCalls > 0,
        }).toEqual({
          path: suite.path,
          readsRepositoryFileText: true,
          repoAnchoredReadCalls: true,
        });
        continue;
      }
      if (!suite.readsRepositoryFileText) {
        // And the boolean has to agree with the count in this direction too, so
        // a row cannot be quietly excused from the case below by flipping it.
        expect({ path: suite.path, reads: suite.repoAnchoredReadCalls }).toEqual({
          path: suite.path,
          reads: 0,
        });
        continue;
      }
      // Reads repository file text and is NOT called a scanner: that departure
      // from the mechanical signal has to be argued, either by naming the cases
      // or in prose. Silence is what this refuses.
      const named = (suite.partialSourceTextCases ?? 0) > 0;
      const argued = (suite.notAScannerReason ?? "").length > 120;
      expect({ path: suite.path, named: named || argued }).toEqual({
        path: suite.path,
        named: true,
      });
    }
  });

  it("names every byte-matching case it counts, and counts fewer than the suite has", () => {
    for (const suite of record.suites) {
      const count = suite.partialSourceTextCases ?? 0;
      if (count === 0) continue;
      expect(suite.sourceTextScanner).toBe(false);
      expect(count).toBeLessThan(suite.totalTests);
      // The names come from the mechanical pass, so the declared count cannot
      // drift from the set the classifier actually found.
      expect(suite.byteMatchingCaseNames).toHaveLength(count);
    }
  });

  it("publishes exactly the suites its case-level attribution cannot answer for", () => {
    const unattributable = record.suites
      .filter((s) => !s.caseAttributionReliable)
      .map((s) => s.path);
    expect(record.caseAttribution.unattributableSuites.slice().sort()).toEqual(
      unattributable.slice().sort(),
    );
    expect(record.caseAttribution.unattributableCount).toBe(
      unattributable.length,
    );
    expect(
      record.caseAttribution.whyPublishedRatherThanGuessed.length,
    ).toBeGreaterThan(200);

    for (const suite of record.suites) {
      // `caseAttributionReliable` is not a free-standing boolean: it is the
      // static opener count agreeing with the runtime case count, and this
      // recomputes it so a row cannot claim reliability it does not have.
      expect({
        path: suite.path,
        reliable: suite.caseAttributionReliable,
      }).toEqual({
        path: suite.path,
        reliable: suite.staticCaseOpeners === suite.totalTests,
      });
      // A count may only be declared where the attribution holds.
      if ((suite.partialSourceTextCases ?? 0) > 0) {
        expect(suite.caseAttributionReliable).toBe(true);
      }
    }
  });

  /*
   * NEW. The classifier's first pass was wrong by a factor of 32, and the number
   * a reader will quote is the second pass's. This keeps the correction attached
   * to it: the reason the corrected figure can be trusted is that the wrong one
   * is on the record with the reason it was wrong.
   */
  it("keeps the classifier's own correction on the record, naming both numbers", () => {
    const c = record.classifierCorrection;
    expect(c.whatTheFirstPassReported).toMatch(/\b32 of 43\b/);
    expect(c.whyItWasWrong.length).toBeGreaterThan(120);
    expect(c.whatTheSecondPassAsks.length).toBeGreaterThan(120);
    expect(c.theLimitOfTheInstrument.length).toBeGreaterThan(120);
    // And the corrected figure is what the rows actually carry: no row may
    // report more byte-matching cases than the first pass's discredited count
    // without the record saying so, and in this draw every count is 1.
    const counted = record.suites
      .filter((s) => (s.partialSourceTextCases ?? 0) > 0)
      .map((s) => s.partialSourceTextCases);
    expect(counted.length).toBeGreaterThan(0);
    for (const n of counted) expect(n).toBe(1);
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
      // And it may not be wired by this item, whatever its verdict says.
      expect(suite.wiredInThisItem).toBe(false);
    }
  });

  it("makes an update_with_reason_recorded verdict cite the change that made it stale", () => {
    const stale = record.suites.filter(
      (s) => s.verdict === "update_with_reason_recorded",
    );
    expect(stale.length).toBeGreaterThan(0);
    for (const suite of stale) {
      expect(suite.rationale).toMatch(/#\d{3,}|\b[0-9a-f]{7,40}\b/);
    }
  });

  /*
   * NEW, and the change this draw forced. T-492 could require every unwired row
   * to name a follow-on item. This draw cannot file one, so the rule is split
   * rather than dropped — and the unfiled branch is fenced so it cannot become
   * the cheap answer for a row that names real work.
   */
  it("hands every suite either to this item's wiring, to a named follow-on, or to a declared unfiled successor", () => {
    for (const suite of record.suites) {
      if (suite.wiredInThisItem) {
        expect(suite.ownerItem).toBe(record.item);
        expect(suite.verdict).toBe("wire_into_ci");
        expect(record.wiring.directories).toContain(suite.directory);
        continue;
      }
      if (suite.ownerItem === null) {
        // The unfiled branch. It exists because no id can be drawn, and it may
        // not be used by a row whose verdict names work for somebody.
        expect(suite.verdict).toBe("wire_into_ci");
        expect(suite.green).toBe(true);
        expect(suite.ownerItemUnfiled?.blocker).toBe("id-band-exhausted");
        expect(
          (suite.ownerItemUnfiled?.reason ?? "").length,
        ).toBeGreaterThan(200);
        expect(record.unfiledSuccessor.whatIsOwed.length).toBeGreaterThan(80);
        expect(record.unfiledSuccessor.whyItIsNotFiled.length).toBeGreaterThan(
          200,
        );
        expect(
          record.unfiledSuccessor.howItIsKeptVisible.length,
        ).toBeGreaterThan(80);
        continue;
      }
      expect(suite.ownerItem).toMatch(/^T-\d{3}$/);
      expect(suite.ownerItem).not.toBe(record.item);
      expect(Object.keys(record.followOnItems)).toContain(suite.ownerItem);
      expect(
        record.followOnItems[suite.ownerItem as string].length,
      ).toBeGreaterThan(60);
      // A row handed to a named item is one this record refused to do itself,
      // so it states the refusal rather than leaving it to be inferred.
      expect((suite.deferredReason ?? "").length).toBeGreaterThan(40);
    }
    // Both branches are exercised in this draw, so neither is decoration.
    expect(record.suites.filter((s) => s.ownerItem === null).length).toBeGreaterThan(0);
    expect(
      record.suites.filter((s) => s.ownerItem !== null && !s.wiredInThisItem)
        .length,
    ).toBeGreaterThan(0);
  });

  it("wires no directory that also holds a row it hands to another item", () => {
    // The rule the wiring workflow's header states: a directory is wired by
    // fixing it, never by adding it to a green command. A directory holding a
    // deferred row is half-wired, and half-wired is how a red suite ends up
    // inside a step that is supposed to pass on main.
    const deferredDirectories = new Set(
      record.suites.filter((s) => !s.wiredInThisItem).map((s) => s.directory),
    );
    for (const directory of record.wiring.directories) {
      expect({
        directory,
        holdsDeferredRow: deferredDirectories.has(directory),
      }).toEqual({ directory, holdsDeferredRow: false });
    }
    expect(record.wiring.suitesWired).toBe(
      record.suites.filter((s) => s.wiredInThisItem).length,
    );
    expect(record.wiring.casesWired).toBe(
      record.suites
        .filter((s) => s.wiredInThisItem)
        .reduce((sum, s) => sum + s.totalTests, 0),
    );
    // And every directory NOT wired has to be accounted for in writing, so a
    // reader is told why the tenth is dark rather than left to count.
    for (const directory of deferredDirectories) {
      expect(Object.keys(record.heldDirectories)).toContain(directory);
      expect(record.heldDirectories[directory].length).toBeGreaterThan(40);
    }
  });

  /*
   * NEW. The filing's ranks were stale and the record explains it with one
   * event. A uniform offset is what that explanation predicts; a scattered one
   * would mean the draw itself had changed under the filing and the directory
   * set would need re-deriving rather than explaining.
   */
  it("shows the filed ranks moved by one uniform offset, not by the draw changing", () => {
    const offsets = new Set(
      record.suites.map(
        (s) => s.governedRiskRankAsFiled - s.governedRiskRankOnThisBase,
      ),
    );
    expect(offsets.size).toBe(1);
    expect([...offsets][0]).toBeGreaterThan(0);
    expect(record.scope.ranksMovedUnderTheFiling.length).toBeGreaterThan(400);
    // And the admission that put every one of these rows in the draw is the
    // recorded absence of a signal, not a finding of low risk.
    for (const suite of record.suites) {
      expect({
        path: suite.path,
        band: suite.governedRiskBand,
        score: suite.governedRiskScore,
        admittedBy: suite.admittedBy,
      }).toEqual({
        path: suite.path,
        band: "unclassified",
        score: 0,
        admittedBy: "untriaged_unrun_work",
      });
    }
  });

  it("derives the draw's directory concentration rather than narrating it", () => {
    const byDirectory: Record<string, number> = {};
    for (const suite of record.suites) {
      byDirectory[suite.directory] = (byDirectory[suite.directory] ?? 0) + 1;
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
        green: acc.green + (s.green ? 1 : 0),
        red: acc.red + (s.green ? 0 : 1),
        testsRun: acc.testsRun + s.totalTests,
        testsPassed: acc.testsPassed + s.passedTests,
        testsFailed: acc.testsFailed + s.failedTests,
        testsPending: acc.testsPending + s.pendingTests,
      }),
      {
        green: 0,
        red: 0,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        testsPending: 0,
      },
    );
    expect(record.jestEvidence.totals.suitesExecuted).toBe(
      record.suites.length,
    );
    expect(record.jestEvidence.totals.green).toBe(summed.green);
    expect(record.jestEvidence.totals.red).toBe(summed.red);
    expect(record.jestEvidence.totals.testsRun).toBe(summed.testsRun);
    expect(record.jestEvidence.totals.testsPassed).toBe(summed.testsPassed);
    expect(record.jestEvidence.totals.testsFailed).toBe(summed.testsFailed);
    expect(record.jestEvidence.totals.testsPending).toBe(summed.testsPending);
    // Per-row arithmetic too: passed + failed + pending has to be the total, or
    // a row's counts were typed rather than read out of the run.
    for (const suite of record.suites) {
      expect({
        path: suite.path,
        sum: suite.passedTests + suite.failedTests + suite.pendingTests,
      }).toEqual({ path: suite.path, sum: suite.totalTests });
    }
  });

  /*
   * NEW. The record claims the wired directories were also run TOGETHER, which
   * is a different claim from fifty isolated runs and the one that would catch a
   * suite that only passes alone. The two numbers in that sentence have to
   * reconcile with the rows: the case count of the wired rows, plus the one
   * already-owned suite the ninth directory also holds.
   */
  it("reconciles the together-run figures with the per-file rows", () => {
    const wired = record.suites.filter((s) => s.wiredInThisItem);
    const cases = wired.reduce((sum, s) => sum + s.totalTests, 0);
    expect(record.jestEvidence.alsoRunTogether).toContain(
      `${wired.length + 1} suites / ${cases + 1} tests`,
    );
    expect(record.jestEvidence.alsoRunTogether).toContain(`${cases} of those`);
  });

  it("recomputes every vacuity declaration from the rows rather than trusting the prose", () => {
    const scanners = record.suites.filter((s) => s.sourceTextScanner);
    const readers = record.suites.filter((s) => s.readsRepositoryFileText);
    const red = record.suites.filter((s) => !s.green);
    const partial = record.suites.filter(
      (s) => (s.partialSourceTextCases ?? 0) > 0,
    );
    const unattributable = record.suites.filter(
      (s) => !s.caseAttributionReliable,
    );

    expect(record.vacuousControlsDeclared.sourceTextScanner).toContain(
      `${readers.length} of the 50 read repository file text and ${scanners.length} carries sourceTextScanner true`,
    );
    expect(record.vacuousControlsDeclared.redSuites).toContain(
      `${red.length} of the 50 is red -- ${record.jestEvidence.totals.testsFailed} failing cases`,
    );
    expect(record.vacuousControlsDeclared.partialSourceTextCases).toContain(
      `${partial.length} rows carry partialSourceTextCases above zero`,
    );
    expect(record.vacuousControlsDeclared.caseAttribution).toContain(
      `${unattributable.length} of the 50`,
    );

    /*
     * And each declaration's own verdict is checked against its population. This
     * draw is where that matters more than in T-492: the scanner control is
     * declared PARTLY VACUOUS, because 47 of 50 read no repository file at all,
     * and a record that said NOT VACUOUS over three rows would be overselling a
     * control that barely fired. The declaration a record may not make is the
     * one its rows contradict, in either direction.
     */
    for (const [key, declaration] of Object.entries(
      record.vacuousControlsDeclared,
    )) {
      const population =
        key === "sourceTextScanner"
          ? scanners
          : key === "redSuites"
            ? red
            : key === "partialSourceTextCases"
              ? partial
              : unattributable;
      expect(declaration).toMatch(/VACUOUS/);
      expect(declaration.length).toBeGreaterThan(160);
      if (/NOT VACUOUS/.test(declaration)) {
        expect({ key, empty: population.length === 0 }).toEqual({
          key,
          empty: false,
        });
      }
      if (/PARTLY VACUOUS/.test(declaration)) {
        // A "partly" declaration has to be honest about which way: the
        // population fired at least once and covers a minority of the draw.
        expect({
          key,
          fired: population.length > 0,
          minority: population.length * 2 < record.suites.length,
        }).toEqual({ key, fired: true, minority: true });
      }
    }
  });

  it("keeps the published counts equal to the rows they summarise", () => {
    for (const verdict of record.verdictVocabulary) {
      const actual = record.suites.filter((s) => s.verdict === verdict).length;
      expect(record.counts[verdict] ?? 0).toBe(actual);
    }
    const summed = Object.values(record.counts).reduce((a, b) => a + b, 0);
    expect(summed).toBe(record.suites.length);
  });

  it("did not edit any file it passed judgement on", () => {
    for (const suite of record.suites) {
      expect(record.claimedWriteFiles).not.toContain(suite.path);
    }
    // The record's own guard and the record itself are among the files it wrote,
    // and the wiring workflow must be too — a record that wires 45 suites
    // without touching a workflow is describing something that did not happen.
    expect(record.claimedWriteFiles).toContain(RECORD_PATH);
    expect(record.claimedWriteFiles).toContain(record.wiring.workflow);
    expect(record.claimedWriteFiles).toContain(
      "src/__tests__/behaviors/t493-wired-directory-ci-coverage.test.ts",
    );
  });
});
