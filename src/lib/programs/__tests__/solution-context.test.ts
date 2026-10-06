import {
  emptySolutionContext,
  applyPhaseDigest,
  contextReadyForPhase,
  architectureMayProceed,
  countSolutionContextEvidenceSignals,
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

  it("counts governed context evidence signals without counting presentation artifacts", () => {
    const ctx = applyPhaseDigest(emptySolutionContext("m1", "t"), {
      baselineMetrics: {
        "Manual hours": "2,345",
      },
      metricsThatMatter: [
        { label: "Manual hours", value: "2,345" },
        { label: "Resolution days", value: "7.4" },
      ],
      evidenceTaxonomy: [
        { category: "Payment hold / control review", riskLevel: "High" },
      ],
      evidenceMap: [{ claim: "Control risk is concentrated", source: "P2 diagnostic" }],
      evidencePackets: [
        {
          evidenceId: "evid-1",
          title: "P2 workshop readout",
          evidenceType: "workshop",
          phase: 2,
          summary: "Workshop confirmed the control path.",
          observations: [],
          assumptions: [],
          openQuestions: [],
          citations: [],
          approvedAt: "2026-09-27T00:00:00.000Z",
        },
      ],
    });

    expect(countSolutionContextEvidenceSignals(ctx)).toBe(6);
  });
});
