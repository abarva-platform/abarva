import {
  capturePhaseAnsweredCount,
  capturePhaseProgress,
} from "@/lib/programs/capture-phase-progress";

/**
 * The six phases with the question counts the capture contract gives them.
 * P0 has eleven inputs and P1 has seven, which is the pair that made the defect
 * visible: a count borrowed from P0 and rendered against P1's total read
 * "11 of 7".
 */
const STRIP = [
  { phase: 0, total: 11 },
  { phase: 1, total: 7 },
  { phase: 2, total: 8 },
  { phase: 3, total: 7 },
  { phase: 4, total: 7 },
  { phase: 5, total: 7 },
];

describe("capturePhaseAnsweredCount", () => {
  it("gives the live count to the phase on screen, not to the phase the Move sits on", () => {
    // Viewing P0 of a Move that has advanced to P1: eleven P0 answers.
    const context = { viewedPhase: 0, currentPhase: 1, viewedAnsweredCount: 11 };

    expect(capturePhaseAnsweredCount({ phase: 0, total: 11 }, context)).toBe(11);
    // P1 is NOT on screen and has not been passed, so it has no live count.
    // Before the fix this row received P0's eleven and rendered "11 of 7".
    expect(capturePhaseAnsweredCount({ phase: 1, total: 7 }, context)).toBe(0);
  });

  it("never reports more answers than a phase has questions, on any row", () => {
    for (let viewedPhase = 0; viewedPhase <= 5; viewedPhase += 1) {
      for (let currentPhase = 0; currentPhase <= 5; currentPhase += 1) {
        const viewedTotal =
          STRIP.find((row) => row.phase === viewedPhase)?.total ?? 0;
        const rows = capturePhaseProgress(STRIP, {
          viewedPhase,
          currentPhase,
          viewedAnsweredCount: viewedTotal,
        });
        for (const row of rows) {
          expect(row.answered).toBeGreaterThanOrEqual(0);
          expect(row.answered).toBeLessThanOrEqual(row.total);
        }
      }
    }
  });

  it("treats a phase the Move has advanced past as complete", () => {
    const context = { viewedPhase: 3, currentPhase: 3, viewedAnsweredCount: 2 };

    expect(capturePhaseAnsweredCount({ phase: 0, total: 11 }, context)).toBe(11);
    expect(capturePhaseAnsweredCount({ phase: 2, total: 8 }, context)).toBe(8);
  });

  it("leaves a phase the Move has not reached at zero", () => {
    const context = { viewedPhase: 1, currentPhase: 1, viewedAnsweredCount: 4 };

    expect(capturePhaseAnsweredCount({ phase: 2, total: 8 }, context)).toBe(0);
    expect(capturePhaseAnsweredCount({ phase: 5, total: 7 }, context)).toBe(0);
  });

  it("shows what an already-passed phase holds now when you reopen it", () => {
    // The Move is at P2, but P1 is on screen and only four of its seven
    // sections still hold an answer. The live count wins over "passed ⇒ full"
    // so the strip cannot claim a completeness a later edit removed.
    const context = { viewedPhase: 1, currentPhase: 2, viewedAnsweredCount: 4 };

    expect(capturePhaseAnsweredCount({ phase: 1, total: 7 }, context)).toBe(4);
    // Its neighbour, also passed but not on screen, still reads as complete.
    expect(capturePhaseAnsweredCount({ phase: 0, total: 11 }, context)).toBe(11);
  });

  it("keeps the rest of each row untouched", () => {
    const rows = capturePhaseProgress(
      [{ phase: 1, total: 7, code: "P1", name: "Charter", reachable: true }],
      { viewedPhase: 1, currentPhase: 1, viewedAnsweredCount: 3 },
    );

    expect(rows[0]).toEqual({
      phase: 1,
      total: 7,
      code: "P1",
      name: "Charter",
      reachable: true,
      answered: 3,
    });
  });
});
