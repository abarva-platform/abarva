import {
  capturePhaseAnsweredCount,
  capturePhaseProgress,
} from "@/lib/programs/capture-phase-progress";

/**
 * The six phases with the question counts the capture contract gives them.
 * P0 has eleven inputs and P1 has seven, which is the pair that made the first
 * defect visible: a count borrowed from P0 and rendered against P1's total
 * read "11 of 7".
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
    // P1 is NOT on screen, so this screen cannot see its answers. Before the
    // first fix this row received P0's eleven and rendered "11 of 7".
    expect(capturePhaseAnsweredCount({ phase: 1, total: 7 }, context)).toBeNull();
  });

  it("never reports more answers than a phase has questions, on any measured row", () => {
    for (let viewedPhase = 0; viewedPhase <= 5; viewedPhase += 1) {
      for (let currentPhase = 0; currentPhase <= 5; currentPhase += 1) {
        const viewedTotal =
          STRIP.find((row) => row.phase === viewedPhase)?.total ?? 0;
        const rows = capturePhaseProgress(STRIP, {
          viewedPhase,
          currentPhase,
          viewedAnsweredCount: viewedTotal,
        });
        // Exactly one row per screen is measurable: the one on screen.
        expect(rows.filter((row) => row.answered !== null)).toHaveLength(1);
        for (const row of rows) {
          if (row.answered === null) continue;
          expect(row.answered).toBeGreaterThanOrEqual(0);
          expect(row.answered).toBeLessThanOrEqual(row.total);
        }
      }
    }
  });

  it("does not claim a phase is answered just because the Move advanced past it", () => {
    // The Move sits at P3. P0 and P2 are behind it, but this screen holds no
    // capture values for either, so neither may report a count. The earlier
    // rule filled both with their own totals, which is how a Move that was
    // originated before the capture flow existed — every P0 question blank —
    // still reported "11 of 11 answered" on every screen but P0's own.
    const context = { viewedPhase: 3, currentPhase: 3, viewedAnsweredCount: 2 };

    expect(capturePhaseAnsweredCount({ phase: 0, total: 11 }, context)).toBeNull();
    expect(capturePhaseAnsweredCount({ phase: 2, total: 8 }, context)).toBeNull();
    expect(capturePhaseAnsweredCount({ phase: 3, total: 7 }, context)).toBe(2);
  });

  it("reads the same for a passed phase and an unreached one — both are unmeasured", () => {
    // The distinction the old rule drew between these two rows was not one it
    // could observe. Whichever side of the Move's position a row sits on, this
    // screen has no values for it.
    const context = { viewedPhase: 1, currentPhase: 1, viewedAnsweredCount: 4 };

    expect(capturePhaseAnsweredCount({ phase: 0, total: 11 }, context)).toBeNull();
    expect(capturePhaseAnsweredCount({ phase: 5, total: 7 }, context)).toBeNull();
  });

  it("gives one row the same answer from whichever screen you ask", () => {
    // The live walk's diagnosis: the Originate row read "0 of 11" when P0 was
    // on screen and "11 of 11" when P1 was. A row that changes value with the
    // observer is reporting something it did not measure. Asked about P0 from
    // the P1 and P2 screens, the answer is now the same — unmeasured — and the
    // only screen that states a count for P0 is P0's own.
    const fromP1 = capturePhaseAnsweredCount(
      { phase: 0, total: 11 },
      { viewedPhase: 1, currentPhase: 1, viewedAnsweredCount: 0 },
    );
    const fromP2 = capturePhaseAnsweredCount(
      { phase: 0, total: 11 },
      { viewedPhase: 2, currentPhase: 1, viewedAnsweredCount: 0 },
    );
    const fromP0 = capturePhaseAnsweredCount(
      { phase: 0, total: 11 },
      { viewedPhase: 0, currentPhase: 1, viewedAnsweredCount: 0 },
    );

    expect(fromP1).toBeNull();
    expect(fromP2).toBeNull();
    expect(fromP1).toBe(fromP2);
    expect(fromP0).toBe(0);
  });

  it("shows what an already-passed phase holds now when you reopen it", () => {
    // The Move is at P2, but P1 is on screen and only four of its seven
    // sections still hold an answer. A measured count is reported as measured,
    // including when it contradicts how far the Move has travelled.
    const context = { viewedPhase: 1, currentPhase: 2, viewedAnsweredCount: 4 };

    expect(capturePhaseAnsweredCount({ phase: 1, total: 7 }, context)).toBe(4);
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
