/**
 * Guard for the T-479 triage record.
 *
 * T-479 is the sixth draw of stale suites, after T-472, T-475, T-509, T-550,
 * T-556 and T-742. The controls below are T-742's, carried forward, with three
 * changes this draw forced rather than three that seemed tidy:
 *
 *  1. THE DISJOINTNESS CHECK READS ALL SIX PRIOR RECORDS, NOT FOUR.
 *     T-742's guard listed t472, t509, t550 and t556 — it did not read t475,
 *     which existed. A path already judged there could have been re-judged by
 *     that draw and no control would have said so. The acceptance for this item
 *     asks for a guard over SEVEN records, so the list here is derived from the
 *     record's own `scope.disjointFrom` and cross-checked against a literal
 *     list, and the two must agree.
 *
 *  2. T-742's TWO "VACUOUS" DECLARATIONS ARE GENERALISED TO POPULATIONS.
 *     T-742's draw held zero scanners and zero red suites, so its guard
 *     required the record to declare each control VACUOUS. This draw holds four
 *     scanners and three red suites — the opposite case — and a guard that only
 *     accepts the word VACUOUS would fail a draw for being unhealthy. So the
 *     rule is stated once for both directions: the record must DECLARE each
 *     population, saying FIRED with the count or VACUOUS, and this guard
 *     recomputes the count from the rows and fails on any disagreement. The
 *     declaration is falsifiable whether the population is empty or not, which
 *     is what a control has to be.
 *
 *  3. MUTATION EVIDENCE IS PART OF THE RECORD, AND A SURVIVING MUTATION IS A
 *     RESULT RATHER THAN AN ABSENCE. The item asks the two boundary suites to
 *     be shown capable of failing, because an unrun fence and a vacuous fence
 *     are indistinguishable from outside. Two of this draw's five mutations
 *     SURVIVED — each destroying the exact property its case is named for and
 *     leaving the suite green. Recording only kills would let a blind detector
 *     read as a healthy one, so this guard requires every declared boundary
 *     suite to carry a `kills` proof whose failure count actually rose, and
 *     requires every `survives` proof to be a claim the record cannot make
 *     idly: the count must be unchanged, and it must name the case it proves
 *     vacuous.
 *
 * These are not shape assertions. Each is a claim the record cannot make
 * falsely, and each was broken against a scratch copy to confirm it fails.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const RECORD_PATH = "docs/architecture/t479-stale-suite-triage.json";

const PRIOR_RECORD_PATHS = [
  "docs/architecture/t472-stale-suite-triage.json",
  "docs/architecture/t475-stale-suite-triage.json",
  "docs/architecture/t509-stale-suite-triage.json",
  "docs/architecture/t550-stale-suite-triage.json",
  "docs/architecture/t556-stale-suite-triage.json",
  "docs/architecture/t742-stale-suite-triage.json",
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
  failingCaseNames?: string[];
  verdict: string;
  ownerItem: string;
  rationale: string;
};

type MutationProof = {
  id: string;
  suitePath: string;
  kind: "kills" | "survives";
  mutatedFile: string;
  mutation: string;
  failedBefore: number;
  failedAfter: number;
  totalTestsBefore: number;
  totalTestsAfter: number;
  failingCasesAfter: string[];
  proves: string;
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
    boundarySuitesRequiringInversion: string[];
    poolReconciliationNotDone: string;
  };
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
    how: string;
    whyBothKindsAreRecorded: string;
    proofs: MutationProof[];
  };
  drawConcentration: {
    byDirectory: Record<string, number>;
    dominantDirectory: string;
    dominantDirectoryCount: number;
    whyItMatters: string;
  };
  populationsDeclared: {
    sourceTextScanner: string;
    redSuites: string;
    vacuousCasesFound: string;
  };
  followOnItems: Record<string, string>;
};

const read = (relative: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), relative), "utf8"));

const record = read(RECORD_PATH) as Record_;

/**
 * A declaration of the form "FIRED -- 4 of 20 rows ..." or "VACUOUS -- ...".
 * Returned so the controls below can compare the declared count with the
 * recomputed one instead of trusting prose.
 */
function declaredPopulation(text: string): { fired: boolean; count: number | null } {
  if (/^VACUOUS\b/.test(text)) return { fired: false, count: 0 };
  const match = /^FIRED\s*--\s*(\d+)\b/.exec(text);
  if (!match) return { fired: true, count: null };
  return { fired: true, count: Number(match[1]) };
}

describe("T-479 stale suite triage record", () => {
  it("draws twenty suites and names each one only once", () => {
    expect(record.suites).toHaveLength(20);
    expect(record.scope.drawSize).toBe(20);
    const paths = record.suites.map((s) => s.path);
    expect(new Set(paths).size).toBe(20);
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

  /*
   * The acceptance asks for a guard over SEVEN records. T-742's read four and
   * silently omitted t475, so the literal list and the record's own declaration
   * are both asserted and must agree — a list that drifts from the record is
   * the way this control goes quiet.
   */
  it("judges no file any of the six earlier triage records already judged", () => {
    const mine = new Set(record.suites.map((s) => s.path));
    expect(record.scope.disjointFrom.slice().sort()).toEqual(
      [...PRIOR_RECORD_PATHS].sort(),
    );
    expect(PRIOR_RECORD_PATHS).toHaveLength(6);
    for (const priorPath of PRIOR_RECORD_PATHS) {
      const prior = read(priorPath) as { item: string; suites: Suite[] };
      expect(prior.suites.length).toBeGreaterThan(0);
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
      expect(suite.failingCaseNames ?? []).toHaveLength(0);
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

  /* T-550's rule, kept in full and narrowed by T-556's distinction. */
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

  it("gives every non-green suite a verdict that does not assume it passes", () => {
    for (const suite of record.suites) {
      if (suite.green) continue;
      expect([
        "repair",
        "rewrite_as_behavior",
        "update_with_reason_recorded",
      ]).toContain(suite.verdict);
      expect(suite.failedTests).toBeGreaterThan(0);
      expect(suite.failingCaseNames).toHaveLength(suite.failedTests);
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
   * Generalised from T-742's two "declare the emptiness" controls. The record
   * declares each population; this recomputes it. A draw with none and a draw
   * with four are both expressible, and neither can be declared wrongly.
   */
  it("declares each population in writing, and the rows agree with the declaration", () => {
    const scanners = record.suites.filter((s) => s.sourceTextScanner).length;
    const scannerDeclaration = declaredPopulation(
      record.populationsDeclared.sourceTextScanner,
    );
    expect(scannerDeclaration.fired).toBe(scanners > 0);
    expect(scannerDeclaration.count).toBe(scanners);
    expect(record.populationsDeclared.sourceTextScanner.length).toBeGreaterThan(
      160,
    );

    const red = record.suites.filter((s) => !s.green).length;
    const redDeclaration = declaredPopulation(record.populationsDeclared.redSuites);
    expect(redDeclaration.fired).toBe(red > 0);
    expect(redDeclaration.count).toBe(red);
    expect(record.populationsDeclared.redSuites.length).toBeGreaterThan(160);

    expect(record.jestEvidence.totals.red).toBe(red);
    expect(record.jestEvidence.totals.green).toBe(record.suites.length - red);
  });

  it("declares how many mutations survived, and the proofs agree", () => {
    const survivors = record.mutationEvidence.proofs.filter(
      (p) => p.kind === "survives",
    ).length;
    const declaration = declaredPopulation(
      record.populationsDeclared.vacuousCasesFound,
    );
    expect(declaration.fired).toBe(survivors > 0);
    expect(declaration.count).toBe(survivors);
    expect(
      record.populationsDeclared.vacuousCasesFound.length,
    ).toBeGreaterThan(160);
  });

  /*
   * The item asks the two boundary suites to be shown capable of failing. A
   * declared boundary suite with no killing mutation is the case this catches:
   * it reads exactly like a suite nobody inverted.
   */
  it("proves every declared boundary suite can fail, with a mutation that raised its failure count", () => {
    expect(record.scope.boundarySuitesRequiringInversion.length).toBeGreaterThan(
      0,
    );
    for (const boundary of record.scope.boundarySuitesRequiringInversion) {
      expect(record.suites.map((s) => s.path)).toContain(boundary);
      const kills = record.mutationEvidence.proofs.filter(
        (p) => p.suitePath === boundary && p.kind === "kills",
      );
      expect(kills.length).toBeGreaterThan(0);
      for (const proof of kills) {
        expect(proof.failedAfter).toBeGreaterThan(proof.failedBefore);
      }
    }
  });

  it("holds every mutation proof to the arithmetic it claims", () => {
    expect(record.mutationEvidence.proofs.length).toBeGreaterThan(0);
    const ids = record.mutationEvidence.proofs.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const proof of record.mutationEvidence.proofs) {
      // It must name a suite this draw actually judged, and a file that is not
      // that suite — a mutation applied to the suite proves nothing about it.
      const row = record.suites.find((s) => s.path === proof.suitePath);
      expect(row).toBeDefined();
      expect(proof.mutatedFile).not.toBe(proof.suitePath);
      expect(proof.mutation.length).toBeGreaterThan(60);
      expect(proof.proves.length).toBeGreaterThan(80);

      // The "before" run is the same run the row was built from.
      expect(proof.failedBefore).toBe(row!.failedTests);
      expect(proof.totalTestsBefore).toBe(row!.totalTests);

      if (proof.kind === "kills") {
        expect(proof.failedAfter).toBeGreaterThan(proof.failedBefore);
        expect(proof.failingCasesAfter.length).toBe(proof.failedAfter);
      } else {
        // A surviving mutation is a finding, so it may not be recorded idly:
        // the count must be unchanged and the prose must say what it proves
        // vacuous.
        expect(proof.kind).toBe("survives");
        expect(proof.failedAfter).toBe(proof.failedBefore);
        expect(proof.totalTestsAfter).toBe(proof.totalTestsBefore);
        expect(proof.proves).toMatch(/VACUOUS/);
      }
    }
  });

  /*
   * A surviving mutation on a suite this record would otherwise wire into CI is
   * the finding that must not be swallowed by a green run. Either the row is
   * not wired, or the row names the byte-matching cases responsible.
   */
  it("does not wire a suite whose mutation survived without naming the cases that let it", () => {
    for (const proof of record.mutationEvidence.proofs) {
      if (proof.kind !== "survives") continue;
      const row = record.suites.find((s) => s.path === proof.suitePath)!;
      if (row.verdict !== "wire_into_ci") continue;
      expect(row.partialSourceTextCases ?? 0).toBeGreaterThan(0);
    }
  });

  it("derives the draw's directory concentration rather than narrating it", () => {
    const byDirectory: Record<string, number> = {};
    for (const suite of record.suites) {
      const dir = path.posix.dirname(suite.path);
      byDirectory[dir] = (byDirectory[dir] ?? 0) + 1;
    }
    expect(record.drawConcentration.byDirectory).toEqual(byDirectory);

    // Two directories tie at the top of this draw, so the record may name
    // either. What it may not do is name one that is not AT the maximum, or
    // publish a count that is not the maximum -- which is the direction an
    // understated concentration would come from.
    const topCount = Math.max(...Object.values(byDirectory));
    expect(record.drawConcentration.dominantDirectoryCount).toBe(topCount);
    expect(byDirectory[record.drawConcentration.dominantDirectory]).toBe(
      topCount,
    );

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
    for (const proof of record.mutationEvidence.proofs) {
      expect(record.claimedWriteFiles).not.toContain(proof.mutatedFile);
    }
  });

  /*
   * The acceptance's precondition governs the SEVENTH draw, not this one, and
   * the honest thing is to say so in the record rather than to leave a reader
   * assuming it was discharged. The record must therefore state it is not done,
   * and must not publish a "remaining pool" figure that would inherit the
   * unsettled answer.
   */
  it("says in writing that T-742's pool reconciliation is still owed, and publishes no figure that depends on it", () => {
    expect(record.scope.poolReconciliationNotDone).toMatch(/NOT discharged|still owed/);
    expect(record.scope.poolReconciliationNotDone.length).toBeGreaterThan(200);
    expect(Object.keys(record.scope)).not.toContain("remainingAfterThisDraw");
    expect(Object.keys(record.scope)).not.toContain(
      "poolAfterExcludingPriorRecords",
    );
    expect(Object.keys(record.scope)).not.toContain(
      "poolUntriagedAndUncovered",
    );
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
