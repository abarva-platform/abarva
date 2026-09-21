/**
 * Guard for the T-550 triage record.
 *
 * The draw this record describes is only worth what its verdicts are worth, and
 * the two ways a triage draw goes wrong are both cheap to make and invisible
 * afterwards: writing a verdict for a file nobody executed, and wiring a suite
 * into CI that asserts a file's bytes rather than its behaviour. The first is
 * how "green" gets asserted about an unrun file; the second is how the 1,223-file
 * deletion stayed green for ten weeks, because a control whose evidence is a
 * string can be satisfied by a comment containing that string.
 *
 * So these are not shape assertions. Each one below is a claim the record is
 * structurally unable to make falsely, and each was broken deliberately against
 * a scratch copy to confirm it fails.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const RECORD_PATH = "docs/architecture/t550-stale-suite-triage.json";

type Suite = {
  path: string;
  loaded: boolean;
  collected: boolean;
  run: boolean;
  green: boolean;
  totalTests: number;
  failedTests: number;
  pendingTests: number;
  sourceTextScanner: boolean;
  verdict: string;
  ownerItem: string;
  rationale: string;
};

const record = JSON.parse(
  readFileSync(path.join(process.cwd(), RECORD_PATH), "utf8"),
) as {
  item: string;
  verdictVocabulary: string[];
  counts: Record<string, number>;
  suites: Suite[];
  claimedWriteFiles: string[];
};

describe("T-550 stale suite triage record", () => {
  it("draws twenty suites and names each one only once", () => {
    expect(record.suites).toHaveLength(20);
    const paths = record.suites.map((s) => s.path);
    expect(new Set(paths).size).toBe(20);
  });

  it("names only files that exist in the tree", () => {
    for (const suite of record.suites) {
      expect(existsSync(path.join(process.cwd(), suite.path))).toBe(true);
    }
  });

  it("uses only the four declared verdicts", () => {
    for (const suite of record.suites) {
      expect(record.verdictVocabulary).toContain(suite.verdict);
    }
  });

  // The control T-587 asked for in its own words: a file that was never
  // executed must not appear as green. The record's green is written from a
  // jest run's per-file result, so a row claiming green while reporting no
  // executed tests, a failure, or run:false is a row nobody ran.
  it("cannot call a suite green unless the record shows it executed and passed", () => {
    for (const suite of record.suites) {
      if (!suite.green) continue;
      expect(suite.run).toBe(true);
      expect(suite.totalTests).toBeGreaterThan(0);
      expect(suite.failedTests).toBe(0);
    }
  });

  // A verdict of wire_into_ci turns a suite on in CI. It must rest on an
  // execution, not on the census's coverage flag -- which, as T-551 records,
  // assigns run, green and covered the same value and therefore cannot report
  // a covered-but-failing file.
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

  // The one that matters most. Wiring a byte-matching suite into CI buys a
  // green check and no protection, and it is the exact shape the control audit
  // found: a gate that proves a control exists by finding its name in a file.
  it("cannot wire a source-text scanner into CI", () => {
    for (const suite of record.suites) {
      if (suite.sourceTextScanner) {
        expect(suite.verdict).not.toBe("wire_into_ci");
        expect(suite.verdict).toBe("rewrite_as_behavior");
      }
    }
    expect(record.suites.some((s) => s.sourceTextScanner)).toBe(true);
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

  it("keeps the published counts equal to the rows they summarise", () => {
    for (const verdict of record.verdictVocabulary) {
      const actual = record.suites.filter((s) => s.verdict === verdict).length;
      expect(record.counts[verdict]).toBe(actual);
    }
    const summed = Object.values(record.counts).reduce((a, b) => a + b, 0);
    expect(summed).toBe(record.suites.length);
  });

  // T-472's control, kept: a triage item that edited what it judged would be
  // grading its own homework.
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
