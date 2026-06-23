import {
  emptySolutionContext,
  applyPhaseDigest,
  contextReadyForPhase,
  architectureMayProceed,
} from "../solution-context";

describe("SolutionContext — cumulative phase memory", () => {
  it("merges a phase digest: overwrites fields, appends decisions/notes", () => {
    let ctx = emptySolutionContext("m1", "skyharbor");
    ctx = applyPhaseDigest(ctx, {
      useCase: "unify clinical + claims",
      kpis: [{ name: "readmissions", domain: "clinical" }],
      decisions: [{ phase: 1, decision: "charter approved", rationale: "sponsor signed" }],
    });
    ctx = applyPhaseDigest(ctx, {
      currentState: "Epic + SQL Server",
      decisions: [{ phase: 2, decision: "diagnosis validated", rationale: "human review" }],
      humanApprovalNotes: ["sponsor wants denial focus"],
    });
    expect(ctx.useCase).toBe("unify clinical + claims");
    expect(ctx.currentState).toBe("Epic + SQL Server");
    expect(ctx.decisions).toHaveLength(2);
    expect(ctx.humanApprovalNotes).toEqual(["sponsor wants denial focus"]);
  });

  it("blocks a phase whose required context is missing", () => {
    const ctx = emptySolutionContext("m1", "t");
    expect(contextReadyForPhase(ctx, 2).ready).toBe(false); // needs useCase + kpis
    expect(contextReadyForPhase(ctx, 2).missing).toEqual(
      expect.arrayContaining(["useCase", "kpis"]),
    );
  });

  it("lets a phase proceed once its required context is present", () => {
    let ctx = emptySolutionContext("m1", "t");
    ctx = applyPhaseDigest(ctx, { useCase: "x", kpis: [{ name: "k", domain: "other" }] });
    expect(contextReadyForPhase(ctx, 2).ready).toBe(true);
  });

  it("blocks architecture (P3b) until an option is chosen + approved (P3a)", () => {
    let ctx = emptySolutionContext("m1", "t");
    expect(architectureMayProceed(ctx).ready).toBe(false);
    ctx = applyPhaseDigest(ctx, { chosenOption: "Option C — Databricks" });
    expect(architectureMayProceed(ctx).ready).toBe(true);
  });
});
