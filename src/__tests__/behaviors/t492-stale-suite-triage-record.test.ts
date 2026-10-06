/**
 * Guard for the T-492 triage record.
 *
 * T-492 is the seventh draw of stale suites, after T-472, T-475, T-479, T-509,
 * T-550, T-556 and T-742, and the first from the widened ranking: 84 files
 * across ten directories, where the largest previous draw was 20. The controls
 * below are T-742's, carried forward in full, with three changes this draw
 * forced rather than three that seemed tidy.
 *
 *  1. THE RECORD WIRES SOME OF ITS OWN ROWS, SO `ownerItem` CANNOT SIMPLY BE
 *     "NOT THIS ITEM". Every prior draw handed all of its wiring to a successor
 *     item, and its guard could therefore assert `ownerItem !== record.item` for
 *     every row. This draw wires 35 suites itself, and a row wired here has no
 *     honest successor to name. Blanket deferral would have been the easy way to
 *     keep the old assertion and would have left 35 green suites dark for
 *     another cycle. So the rule is split: a row is EITHER wired in this item --
 *     and then it must say so, and the directory it names must be proven to run
 *     in a pull-request workflow by the sibling control -- OR it is handed to a
 *     named follow-on that this record also describes. Neither branch is
 *     optional and neither can be satisfied by silence, which is strictly more
 *     than the assertion it replaces.
 *
 *  2. THE CASE-LEVEL CLASSIFIER HAS NO ANSWER FOR 22 OF THE 84, AND THAT IS
 *     PUBLISHED RATHER THAN ROUNDED OFF. Byte-matching cases are attributed
 *     mechanically, by finding identifiers bound to a file's text and seeing
 *     which case bodies name one. A suite whose cases are generated in a loop or
 *     by `.each` has more runtime cases than static openers, and then the
 *     attribution has no denominator. The record publishes which suites those
 *     are and the cases below assert the consistency the instrument CAN carry:
 *     a row may not claim attribution it does not have, and the unattributable
 *     list must equal the rows whose static and runtime counts disagree. The
 *     failure this closes is the one this repository keeps paying for -- a
 *     number invented to fill a column a reader will later treat as measured.
 *
 *  3. `sourceTextScanner` IS CONSTRAINED IN BOTH DIRECTIONS. T-550's rule says a
 *     scanner is never wired. That rule is worth nothing if a row can call
 *     itself "not a scanner" freely, and it is worth nothing in the other
 *     direction either if a row can claim to be one without reading a file. So:
 *     a row may not be a scanner unless the mechanical classifier found it reads
 *     repository file text, and a row that reads file text and is NOT called a
 *     scanner must carry either a named set of byte-matching cases or a written
 *     reason. Four rows in this draw take the second branch, which is why it
 *     exists.
 *
 * These are not shape assertions. Each is a claim the record cannot make
 * falsely, and each was broken against a scratch copy of the record to confirm
 * it fails -- including two that survived their first mutation and needed a
 * sharper case.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const RECORD_PATH = "docs/architecture/t492-stale-suite-triage.json";

/*
 * All seven prior stale-suite records, plus the two triage records that are not
 * stale-suite draws. The item's own text names five to reconcile against; using
 * the full set is the stronger claim and it costs nothing, because disjointness
 * is asserted rather than asked for.
 */
const PRIOR_RECORD_PATHS = [
  "docs/architecture/t472-stale-suite-triage.json",
  "docs/architecture/t475-stale-suite-triage.json",
  "docs/architecture/t479-stale-suite-triage.json",
  "docs/architecture/t509-stale-suite-triage.json",
  "docs/architecture/t550-stale-suite-triage.json",
  "docs/architecture/t556-stale-suite-triage.json",
  "docs/architecture/t742-stale-suite-triage.json",
];

type Suite = {
  path: string;
  directory: string;
  movedTo?: { path: string; byItem: string; reason: string };
  loaded: boolean;
  collected: boolean;
  run: boolean;
  green: boolean;
  totalTests: number;
  failedTests: number;
  passedTests: number;
  pendingTests: number;
  readsRepositoryFileText: boolean;
  staticCaseOpeners: number;
  caseAttributionReliable: boolean;
  byteMatchingCaseNames: string[];
  sourceTextScanner: boolean;
  textIsTheSubject?: boolean;
  textIsTheSubjectReason?: string;
  notAScannerReason?: string;
  partialSourceTextCases?: number;
  verdict: string;
  ownerItem: string;
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
  scope: { disjointFrom: string[]; drawSize: number; directories: string[] };
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
  caseAttribution: {
    unattributableSuites: string[];
    unattributableCount: number;
    whyPublishedRatherThanGuessed: string;
  };
  wiring: {
    workflow: string;
    directories: string[];
    suitesWired: number;
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
};

const read = (relative: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), relative), "utf8"));

const record = read(RECORD_PATH) as Record_;

describe("T-492 stale suite triage record", () => {
  it("draws 84 suites and names each one only once", () => {
    expect(record.suites).toHaveLength(84);
    expect(record.scope.drawSize).toBe(84);
    const paths = record.suites.map((s) => s.path);
    expect(new Set(paths).size).toBe(84);
  });

  it("covers exactly the ten directories it says it drew from", () => {
    // The draw is ten directories, and a row that slipped in from an eleventh
    // would be work nobody chose. Set equality in both directions.
    expect([...new Set(record.suites.map((s) => s.directory))].sort()).toEqual(
      [...record.scope.directories].sort(),
    );
  });

  /*
   * As T-550, T-556 and T-742: a row is a snapshot at a base commit, so paths
   * are history and are never restamped. What may not happen is a row pointing
   * at nothing.
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
        // Reported as an object so a failure prints WHICH record and WHICH path
        // rather than just `false`.
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
   * non-empty precondition T-556 attached to it is not kept — see the header of
   * T-742, which removed it for inverting the gate on a clean draw.
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

  /*
   * NEW, and the second half of the scanner rule. Refusing to wire a scanner is
   * worth nothing if a row can call itself "not a scanner" for free, and worth
   * nothing in the other direction if a row can claim to be one without reading
   * a file at all. The mechanical classifier answers "does this suite read
   * repository file text" reliably for all 84, so it is the floor under both.
   */
  it("constrains the scanner verdict in both directions against the mechanical signal", () => {
    for (const suite of record.suites) {
      if (suite.sourceTextScanner) {
        // A scanner that reads no file text is a mislabel, not a judgement.
        expect({
          path: suite.path,
          readsRepositoryFileText: suite.readsRepositoryFileText,
        }).toEqual({ path: suite.path, readsRepositoryFileText: true });
        continue;
      }
      if (!suite.readsRepositoryFileText) continue;
      // Reads file text and is NOT called a scanner: that departure from the
      // mechanical signal has to be argued, either by naming the cases or in
      // prose. Silence is what this refuses.
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

  /*
   * NEW. The case-level instrument cannot answer for a suite whose cases are
   * generated, and 22 of these 84 are such suites. This asserts the limit is
   * published honestly in both directions rather than quietly filled in.
   */
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
   * NEW, and the change this draw forced. Every prior draw deferred all of its
   * wiring, so its guard could assert `ownerItem !== record.item` outright.
   * This draw wires 35 rows itself. Splitting the rule keeps both halves
   * mandatory instead of dropping the one that no longer fits.
   */
  it("hands every suite either to this item's own wiring or to a named follow-on", () => {
    for (const suite of record.suites) {
      expect(suite.ownerItem).toMatch(/^T-\d{3}$/);
      if (suite.wiredInThisItem) {
        expect(suite.ownerItem).toBe(record.item);
        expect(suite.verdict).toBe("wire_into_ci");
        // The wiring is only real if the directory is one this item wires, and
        // the sibling control is what proves that directory runs in CI.
        expect(record.wiring.directories).toContain(suite.directory);
        continue;
      }
      expect(suite.ownerItem).not.toBe(record.item);
      expect(Object.keys(record.followOnItems)).toContain(suite.ownerItem);
      expect(record.followOnItems[suite.ownerItem].length).toBeGreaterThan(60);
    }
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
      expect({ directory, holdsDeferredRow: deferredDirectories.has(directory) }).toEqual(
        { directory, holdsDeferredRow: false },
      );
    }
    expect(record.wiring.suitesWired).toBe(
      record.suites.filter((s) => s.wiredInThisItem).length,
    );
    // And every directory NOT wired has to be accounted for in writing, so a
    // reader is told why five of ten are dark rather than left to count.
    for (const directory of deferredDirectories) {
      expect(Object.keys(record.heldDirectories)).toContain(directory);
      expect(record.heldDirectories[directory].length).toBeGreaterThan(40);
    }
  });

  /*
   * T-742's control, kept. 23 of 84 in one directory is a 27% concentration a
   * reader would not guess from "ten directories, highest governed risk first".
   */
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
      { green: 0, red: 0, testsRun: 0, testsPassed: 0, testsFailed: 0, testsPending: 0 },
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

  it("keeps the published counts equal to the rows they summarise", () => {
    for (const verdict of record.verdictVocabulary) {
      const actual = record.suites.filter((s) => s.verdict === verdict).length;
      expect(record.counts[verdict]).toBe(actual);
    }
    const summed = Object.values(record.counts).reduce((a, b) => a + b, 0);
    expect(summed).toBe(record.suites.length);
  });

  /*
   * NEW, and the control this record's own numbers most need. Four declarations
   * assert a population is non-empty in prose. Prose is not measured, so each is
   * recomputed here from the rows. A record edited after the fact could
   * otherwise keep saying "NOT VACUOUS" over a set that had emptied.
   */
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

    // Each declaration must name the number the rows give. A count that drifts
    // takes the sentence with it.
    expect(record.vacuousControlsDeclared.sourceTextScanner).toContain(
      `${readers.length} of the 84 read repository file text and ${scanners.length} carry sourceTextScanner true`,
    );
    expect(record.vacuousControlsDeclared.redSuites).toContain(
      `${red.length} of the 84 are red -- ${record.jestEvidence.totals.testsFailed} failing cases`,
    );
    expect(record.vacuousControlsDeclared.partialSourceTextCases).toContain(
      `${partial.length} rows carry partialSourceTextCases above zero`,
    );
    expect(record.vacuousControlsDeclared.caseAttribution).toContain(
      `${unattributable.length} of the 84`,
    );

    // And each population this draw declares non-vacuous really is non-empty,
    // so the word is doing work. This is the T-556 precondition, applied only
    // where the record itself claims the control fired — which is the form that
    // does not invert the gate on a future clean draw.
    for (const [key, declaration] of Object.entries(
      record.vacuousControlsDeclared,
    )) {
      if (!/NOT VACUOUS/.test(declaration)) {
        expect(declaration).toMatch(/VACUOUS/);
        continue;
      }
      const population =
        key === "sourceTextScanner"
          ? scanners
          : key === "redSuites"
            ? red
            : key === "partialSourceTextCases"
              ? partial
              : unattributable;
      expect({ key, empty: population.length === 0 }).toEqual({
        key,
        empty: false,
      });
      expect(declaration.length).toBeGreaterThan(160);
    }
  });

  it("did not edit any file it passed judgement on", () => {
    for (const suite of record.suites) {
      expect(record.claimedWriteFiles).not.toContain(suite.path);
    }
    // The record's own guard and the record itself are among the files it wrote,
    // and the wiring workflow must be too — a record that wires 35 suites
    // without touching a workflow is describing something that did not happen.
    expect(record.claimedWriteFiles).toContain(RECORD_PATH);
    expect(record.claimedWriteFiles).toContain(record.wiring.workflow);
  });
});
