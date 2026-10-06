import {
  gateCriteriaNoun,
  phaseStepperStateLabel,
} from "@/lib/programs/phase-stepper-state-label";

const tally = (met: number, total: number) => ({ met, total });

describe("phaseStepperStateLabel", () => {
  it("states what the figure counts, so it cannot be read as capture questions", () => {
    // The defect: the stepper rendered a bare "3 of 3" directly above a capture
    // strip row reading "11 questions" for the same phase, with nothing on
    // screen distinguishing the two measures.
    const label = phaseStepperStateLabel(tally(3, 3), "done");
    expect(label).toBe("3 of 3 gate criteria");
    expect(label).not.toBe("3 of 3");
  });

  it("never renders a figure without a noun, on any tally", () => {
    for (const [met, total] of [
      [0, 0],
      [0, 6],
      [1, 1],
      [1, 2],
      [3, 3],
      [5, 11],
    ] as const) {
      const label = phaseStepperStateLabel(tally(met, total), "current");
      expect(label).toMatch(/^\d+ of \d+ gate criteri(on|a)$/);
      expect(label).not.toBe(`${met} of ${total}`);
    }
  });

  it("agrees the noun with the count instead of joining it to a fixed plural", () => {
    // A single hard-scoped criterion is reachable both from the rule catalog
    // and from the current phase's live `scoped.length`; "1 of 1 gate criteria"
    // is the same defect as a count joined to a hard-coded plural noun.
    expect(phaseStepperStateLabel(tally(1, 1), "current")).toBe(
      "1 of 1 gate criterion",
    );
    expect(phaseStepperStateLabel(tally(0, 1), "up")).toBe(
      "0 of 1 gate criterion",
    );
    expect(phaseStepperStateLabel(tally(2, 2), "done")).toBe(
      "2 of 2 gate criteria",
    );
  });

  it("keeps a measured zero as a figure rather than a state word", () => {
    // 0 of N is a measurement, not an absence — an upcoming phase with a known
    // rule set still states its total.
    expect(phaseStepperStateLabel(tally(0, 6), "up")).toBe(
      "0 of 6 gate criteria",
    );
    expect(phaseStepperStateLabel(tally(0, 0), "up")).toBe(
      "0 of 0 gate criteria",
    );
  });

  it("falls back to the state word only when no tally is supplied", () => {
    // Defensive: unreachable from the product today, because
    // getMovePhaseTallies emits a row for every phase the stepper walks.
    expect(phaseStepperStateLabel(undefined, "done")).toBe("Complete");
    expect(phaseStepperStateLabel(undefined, "current")).toBe("In progress");
    expect(phaseStepperStateLabel(undefined, "up")).toBe("Upcoming");
  });

  it("lets a tally win over the state word", () => {
    expect(phaseStepperStateLabel(tally(1, 2), "done")).toBe(
      "1 of 2 gate criteria",
    );
  });
});

describe("gateCriteriaNoun", () => {
  it("is singular only at exactly one", () => {
    expect(gateCriteriaNoun(1)).toBe("gate criterion");
    for (const n of [0, 2, 3, 6, 11]) {
      expect(gateCriteriaNoun(n)).toBe("gate criteria");
    }
  });
});
