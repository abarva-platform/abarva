import { getMovePhaseTallies } from "../phase-explorer-tallies";
import { gateCriteriaForPhase } from "../governance";
import { TOTAL_PHASES } from "../phase-labels";

describe("getMovePhaseTallies", () => {
  it("credits every phase before the current one as fully met (it could not have advanced otherwise)", () => {
    const rows = getMovePhaseTallies({
      currentPhase: 3,
      gateCriteria: [],
    });
    for (const row of rows.filter((r) => r.phase < 3)) {
      expect(row.state).toBe("done");
      expect(row.met).toBe(row.total);
    }
  });

  it("uses the move's real, evaluated gateCriteria for the current phase, scoped to hard criteria only — matching the on-screen gate-readiness tile so the two never disagree", () => {
    const rows = getMovePhaseTallies({
      currentPhase: 2,
      gateCriteria: [
        { id: "a", label: "A", completed: true, severity: "hard", verified: true },
        { id: "b", label: "B", completed: false, severity: "hard", verified: true },
        { id: "c", label: "C", completed: true, severity: "soft", verified: true },
      ],
    });
    const current = rows.find((r) => r.phase === 2);
    expect(current?.state).toBe("current");
    expect(current?.met).toBe(1);
    expect(current?.total).toBe(2);
  });

  it("falls back to the full criteria set for the current phase when none are hard-severity", () => {
    const rows = getMovePhaseTallies({
      currentPhase: 2,
      gateCriteria: [
        { id: "a", label: "A", completed: true, severity: "soft", verified: true },
        { id: "b", label: "B", completed: false, severity: "soft", verified: true },
      ],
    });
    const current = rows.find((r) => r.phase === 2);
    expect(current?.met).toBe(1);
    expect(current?.total).toBe(2);
  });

  it("shows 0 met for phases not yet reached, with the total from the canonical gate-rule catalog's hard-severity criteria (falling back to all criteria if a phase has no hard ones)", () => {
    const rows = getMovePhaseTallies({
      currentPhase: 1,
      gateCriteria: [],
    });
    for (const row of rows.filter((r) => r.phase > 1)) {
      const rule = gateCriteriaForPhase(row.phase) ?? [];
      const hard = rule.filter((c) => c.severity === "hard");
      const expectedTotal = (hard.length > 0 ? hard : rule).length;
      expect(row.state).toBe("upcoming");
      expect(row.met).toBe(0);
      expect(row.total).toBe(expectedTotal);
    }
  });

  it("returns one row per phase in the canonical journey, in order", () => {
    const rows = getMovePhaseTallies({ currentPhase: 0, gateCriteria: [] });
    expect(rows).toHaveLength(TOTAL_PHASES);
    expect(rows.map((r) => r.phase)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
