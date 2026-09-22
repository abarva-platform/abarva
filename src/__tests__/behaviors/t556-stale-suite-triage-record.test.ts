/**
 * Guard for the T-556 triage record.
 *
 * T-556 is the fourth draw of stale suites (after T-472, T-509 and T-550), and
 * the controls below are T-550's, kept, plus two the earlier guards did not
 * have. Both additions come from something this draw actually hit rather than
 * from a wish to add controls:
 *
 *  1. DISJOINTNESS IS ASSERTED, NOT CLAIMED. T-550 stated in prose that its
 *     draw was disjoint from T-472 and T-509. Nothing checked it. Two records
 *     judging the same file is how a verdict is quietly replaced by a later,
 *     less-informed one, and neither record would show a mark. This reads the
 *     sibling records off disk and fails if a path is judged twice.
 *
 *  2. A SUITE WHOSE SUBJECT *IS* SOURCE TEXT IS NOT THE SAME AS A SUITE THAT
 *     USES SOURCE TEXT AS A PROXY FOR BEHAVIOUR. T-550's rule — a source-text
 *     scanner may never be wired into CI — is right about the second and wrong
 *     about the first. This draw contains one suite that walks the tree and
 *     asserts a declared string floor holds across it; there is no behaviour to
 *     execute instead, because the bytes are the subject. Rather than quietly
 *     mark it "not a scanner" to escape the rule, the record declares the
 *     distinction and this guard makes the escape hatch expensive: it may only
 *     be taken with a written reason, and it may never be used to wire a suite
 *     into CI.
 *
 * These are not shape assertions. Each is a claim the record cannot make
 * falsely, and each was broken against a scratch copy to confirm it fails.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const RECORD_PATH = "docs/architecture/t556-stale-suite-triage.json";

const PRIOR_RECORD_PATHS = [
  "docs/architecture/t472-stale-suite-triage.json",
  "docs/architecture/t509-stale-suite-triage.json",
  "docs/architecture/t550-stale-suite-triage.json",
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
  pendingTests: number;
  sourceTextScanner: boolean;
  textIsTheSubject?: boolean;
  textIsTheSubjectReason?: string;
  partialSourceTextCases?: number;
  partialSourceTextCaseNames?: string[];
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
  scope: { disjointFrom: string[] };
};

const read = (relative: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), relative), "utf8"));

const record = read(RECORD_PATH) as Record_;

describe("T-556 stale suite triage record", () => {
  it("draws twenty suites and names each one only once", () => {
    expect(record.suites).toHaveLength(20);
    const paths = record.suites.map((s) => s.path);
    expect(new Set(paths).size).toBe(20);
  });

  /*
   * As T-550: a row is a snapshot at a base commit, so paths are history and
   * are never restamped. What may not happen is a row pointing at nothing.
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

  // NEW. The claim every draw makes in prose and none has ever proved.
  it("judges no file an earlier triage record already judged", () => {
    const mine = new Set(record.suites.map((s) => s.path));
    expect(record.scope.disjointFrom.sort()).toEqual(
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

  // T-550's control, kept, and narrowed by the distinction below rather than
  // weakened: a scanner that stands in for behaviour still may not be wired.
  it("cannot wire a source-text scanner into CI", () => {
    for (const suite of record.suites) {
      if (!suite.sourceTextScanner) continue;
      expect(suite.verdict).not.toBe("wire_into_ci");
      if (!suite.textIsTheSubject) {
        expect(suite.verdict).toBe("rewrite_as_behavior");
      }
    }
    expect(record.suites.some((s) => s.sourceTextScanner)).toBe(true);
  });

  // NEW. The escape hatch, made expensive. `textIsTheSubject` is a judgement an
  // agent writes, not a measurement, so the guard cannot check that it is true;
  // what it can do is refuse a bare flag, refuse it on a non-scanner where it
  // would mean nothing, and refuse it as a route to a CI wiring.
  it("lets a suite claim its subject is the text only with a written reason, and never to get wired", () => {
    for (const suite of record.suites) {
      if (!suite.textIsTheSubject) continue;
      expect(suite.sourceTextScanner).toBe(true);
      expect(suite.verdict).not.toBe("wire_into_ci");
      expect((suite.textIsTheSubjectReason ?? "").length).toBeGreaterThan(120);
    }
  });

  // NEW. A suite that mostly executes but carries a few byte-matching cases is
  // neither a scanner nor clean. Wiring it is allowed; hiding the cases is not.
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
    expect(
      record.suites.some((s) => (s.partialSourceTextCases ?? 0) > 0),
    ).toBe(true);
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

  // A suite called stale is a suite whose expectation the product moved past.
  // Saying so without naming what moved it is an assumption wearing a verdict.
  it("makes an update_with_reason_recorded verdict cite the change that made it stale", () => {
    for (const suite of record.suites) {
      if (suite.verdict !== "update_with_reason_recorded") continue;
      expect(suite.rationale).toMatch(/#\d{3,}|\b[0-9a-f]{7,40}\b/);
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

  it("did not edit any file it passed judgement on", () => {
    for (const suite of record.suites) {
      expect(record.claimedWriteFiles).not.toContain(suite.path);
    }
  });

  it("hands every suite to a named follow-on item rather than acting on it", () => {
    for (const suite of record.suites) {
      expect(suite.ownerItem).toMatch(/^T-\d{3}$/);
      expect(suite.ownerItem).not.toBe(record.item);
    }
  });
});
