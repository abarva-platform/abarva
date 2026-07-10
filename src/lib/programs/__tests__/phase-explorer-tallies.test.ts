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

  it("uses the move's real, evaluated gateCriteria for the current phase — never a fabricated count", () => {
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
    expect(current?.met).toBe(2);
    expect(current?.total).toBe(3);
  });

  it("shows 0 met for phases not yet reached, with the total from the canonical gate-rule catalog", () => {
    const rows = getMovePhaseTallies({
      currentPhase: 1,
      gateCriteria: [],
    });
    for (const row of rows.filter((r) => r.phase > 1)) {
      expect(row.state).toBe("upcoming");
      expect(row.met).toBe(0);
      expect(row.total).toBe(gateCriteriaForPhase(row.phase)?.length ?? 0);
    }
  });

  it("returns one row per phase in the canonical journey, in order", () => {
    const rows = getMovePhaseTallies({ currentPhase: 0, gateCriteria: [] });
    expect(rows).toHaveLength(TOTAL_PHASES);
    expect(rows.map((r) => r.phase)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
