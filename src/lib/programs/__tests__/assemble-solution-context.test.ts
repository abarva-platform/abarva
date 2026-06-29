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

  it("promotes concrete P2 evidence metrics and taxonomy from broker text", async () => {
    const out = await assembleMoveSolutionContext(
      { moveId: "m1", tenantKey: "lakeshore", targetPhase: 2 },
      sources({
        retrieveCurrentState: async () => `
          Average monthly invoice exceptions, 1872
          Manual touch hours per month, 2345
          Average resolution days, 7.4
          Finance validation required before funding approval
          "exception_category","monthly_volume","percent_of_exceptions","average_resolution_days","manual_touch_hours_estimate","risk_level","primary_owner"
          "Missing PO","420","22.4","6.8","510","Medium","Accounts Payable"
          "Payment hold / control review","27","1.4","12.5","58","High","Finance Control"
          Systems landscape missing. Case-level ERP/AP exception export with timestamps needed.
        `,
      }),
    );
    expect(out.context.metricsThatMatter).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Monthly invoice exceptions", value: "1,872" }),
        expect.objectContaining({ label: "Manual touch hours per month", value: "2,345" }),
        expect.objectContaining({ label: "Average resolution days", value: "7.4" }),
        expect.objectContaining({ label: "Finance validation status", value: "Required before funding approval" }),
      ]),
    );
    expect(out.context.evidenceTaxonomy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "Missing PO", owner: "Accounts Payable", riskLevel: "Medium" }),
        expect.objectContaining({ category: "Payment hold / control review", owner: "Finance Control", riskLevel: "High" }),
      ]),
    );
    expect(out.context.clientActionableMissingInputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ needed: "AP/procurement systems landscape" }),
        expect.objectContaining({ needed: "Case-level ERP/AP exception export with timestamps" }),
      ]),
    );
  });

  it("carries concrete P2 evidence specificity forward into P3 draft shaping", async () => {
    const out = await assembleMoveSolutionContext(
      { moveId: "m1", tenantKey: "lakeshore", targetPhase: 3 },
      sources({
        loadPriorDigests: async () => [
          {
            useCase: "AP exception redesign",
            kpis: [{ name: "manual touch reduction", domain: "financial" }],
            gaps: ["payment hold governance inconsistent"],
          },
        ],
        retrieveCurrentState: async () => `
          Average monthly invoice exceptions, 1872
          Manual touch hours per month, 2345
          Average resolution days, 7.4
          "exception_category","monthly_volume","percent_of_exceptions","average_resolution_days","manual_touch_hours_estimate","risk_level","primary_owner"
          "Payment hold / control review","27","1.4","12.5","58","High","Finance Control"
        `,
      }),
    );

    expect(out.readiness.ready).toBe(true);
    expect(out.context.metricsThatMatter).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Monthly invoice exceptions", value: "1,872" }),
        expect.objectContaining({ label: "Manual touch hours per month", value: "2,345" }),
        expect.objectContaining({ label: "Average resolution days", value: "7.4" }),
      ]),
    );
    expect(out.context.evidenceTaxonomy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "Payment hold / control review", riskLevel: "High" }),
      ]),
    );
  });
});
