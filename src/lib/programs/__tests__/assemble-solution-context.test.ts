import { assembleMoveSolutionContext, type SolutionContextSources } from "../assemble-solution-context";

const sources = (over: Partial<SolutionContextSources> = {}): SolutionContextSources => ({
  retrieveCurrentState: async () => "Epic Clarity/Caboodle on SQL Server, Tableau, DataStage",
  loadPriorDigests: async () => [
    { useCase: "unify clinical + claims", kpis: [{ name: "readmissions", domain: "clinical" }] },
  ],
  loadDecisions: async () => [
    { phase: 1, decision: "charter approved", rationale: "sponsor signed" },
  ],
  ...over,
});

describe("assembleMoveSolutionContext (Slice 1)", () => {
  it("binds the REAL current state from the broker (not [DATA GAP])", async () => {
    const out = await assembleMoveSolutionContext(
      { moveId: "m1", tenantKey: "meridian", targetPhase: 3 },
      sources(),
    );
    expect(out.currentStateBound).toBe(true);
    expect(out.context.currentState).toMatch(/Epic Clarity/);
    expect(out.context.currentState).not.toMatch(/DATA GAP/);
  });

  it("folds prior approved phase digests cumulatively (full, not clipped)", async () => {
    const out = await assembleMoveSolutionContext(
      { moveId: "m1", tenantKey: "t", targetPhase: 2 },
      sources(),
    );
    expect(out.context.useCase).toBe("unify clinical + claims");
    expect(out.context.kpis?.[0].name).toBe("readmissions");
    expect(out.context.decisions).toHaveLength(1);
    expect(out.readiness.ready).toBe(true); // P2 needs useCase + kpis — present
  });

  it("NEVER fabricates: empty broker result leaves currentState unset + flags it missing", async () => {
    const out = await assembleMoveSolutionContext(
      { moveId: "m1", tenantKey: "t", targetPhase: 3 },
      sources({ retrieveCurrentState: async () => "   " }),
    );
    expect(out.currentStateBound).toBe(false);
    expect(out.context.currentState).toBeUndefined();
    expect(out.readiness.ready).toBe(false); // P3 needs currentState + gaps
    expect(out.readiness.missing).toContain("currentState");
  });

  it("uses the SolutionContext use case as the retrieval query when none is passed", async () => {
    let seenQuery = "";
    await assembleMoveSolutionContext(
      { moveId: "m1", tenantKey: "t", targetPhase: 3 },
      sources({
        retrieveCurrentState: async (_t, q) => {
          seenQuery = q;
          return "x";
        },
      }),
    );
    expect(seenQuery).toBe("unify clinical + claims");
  });
});
