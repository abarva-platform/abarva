import fs from "node:fs";
import path from "node:path";

import { presentOverlapTreatment } from "@/lib/source/data-model/overlap-treatment-narrative";

/**
 * The question was whether `overlap_treatment` is a vocabulary or a
 * narrative, because the column has no CHECK and a bare word sat where a
 * sentence sat elsewhere.
 *
 * Measured against the canonical set, it is a narrative: every production
 * value names what the amount is kept separate from and under what
 * condition, and an enum can carry neither. The bare tokens were fixtures.
 *
 * So these cases pin the decision — a token is not an explanation, and an
 * absent explanation is not an explanation of something else. The last case
 * is the one that would have caught the live defect: the surface filled a
 * missing overlap note with a true sentence about approval.
 */

describe("overlap treatment is a narrative", () => {
  it("passes a real explanation through unchanged", () => {
    const explanation =
      "Separated from AP invoice-line rate variance. VMS labor rate-card rows " +
      "are included once as their own recoverable-leakage opportunity.";

    expect(presentOverlapTreatment(explanation)).toEqual({
      state: "explained",
      text: explanation,
    });
  });

  it("refuses to present a bare token as an explanation", () => {
    // "Overlap: none" under a heading a client reads is builder shorthand
    // on a client surface. It also says nothing: none of what?
    for (const token of ["none", "included", "n/a", "not_applicable"]) {
      const result = presentOverlapTreatment(token);
      expect(result.state).toBe("unexplained");
      expect(result.text).toContain("does not say what this overlaps");
    }
  });

  it("does not mistake a short sentence for a token", () => {
    // The rule is shape, not length, and a real one-clause treatment must
    // survive it — otherwise the check would quietly suppress valid notes.
    const result = presentOverlapTreatment("Included once.");
    expect(result.state).toBe("explained");
    expect(result.text).toBe("Included once.");
  });

  it("says an absent explanation is absent, not something about approval", () => {
    // The live defect. The surface filled a missing overlap note with
    // "No opportunity value is approved until evidence is resolved." — true,
    // and an answer to a different question, shown under "Overlap".
    for (const empty of [null, undefined, "", "   "]) {
      const result = presentOverlapTreatment(empty);
      expect(result.state).toBe("unrecorded");
      expect(result.text).toContain("has not been recorded");
      expect(result.text).not.toContain("approved");
    }
  });

  it("finds every canonical value already carries an explanation", () => {
    // The measurement the decision rests on, kept as a case so the answer
    // stops being true the moment somebody writes a token into the real set.
    //
    // The values are read out of the canonical module's own source rather
    // than from a fixture assembled here. The builders need inputs, and a
    // fixture written for this test would only prove the rule agrees with
    // what I chose to put in it.
    const source = fs.readFileSync(
      path.resolve(
        __dirname,
        "../../lib/source/data-model/contract-optimization-opportunity.ts",
      ),
      "utf8",
    );

    const values = [
      ...source.matchAll(/overlapTreatment:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g),
    ].map((match) => match[1]);

    // The negative control for the extraction itself: if the regex stopped
    // matching, the loop below would pass over an empty list.
    expect(values.length).toBeGreaterThanOrEqual(7);

    const unexplained = values.filter(
      (value) => presentOverlapTreatment(value).state !== "explained",
    );
    expect(unexplained).toEqual([]);
  });
});
