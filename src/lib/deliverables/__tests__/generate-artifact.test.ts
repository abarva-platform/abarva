import { generateArtifact, type GenerateArtifactDeps } from "../generate-artifact";

const GOOD_ARCH_HTML = `<html><body>
<div class="diagram"><svg>conceptual architecture</svg></div>
<div class="diagram"><svg>logical architecture</svg></div>
<div class="diagram"><svg>physical deployment</svg></div>
<div class="flow"><svg>data-flow</svg></div>
<div class="diagram">native vs non-native pattern</div>
<table>decision record / tradeoff</table>
<table>KPI traceability</table>
</body></html>`;

function deps(over: Partial<GenerateArtifactDeps> = {}): GenerateArtifactDeps {
  return {
    gateSources: {
      captureComplete: async () => ({ complete: true, missing: [] }),
      gateApproved: async () => true,
    },
    contextSources: {
      retrieveCurrentState: async () => "Epic Clarity/Caboodle on SQL Server, Tableau",
      loadPriorDigests: async () => [
        {
          useCase: "unify clinical + claims",
          kpis: [{ name: "readmissions", domain: "clinical" }],
          gaps: ["no unified member spine"],
          chosenOption: "Option C — Databricks Lakehouse",
        },
      ],
      loadDecisions: async () => [],
    },
    callModel: async () => GOOD_ARCH_HTML,
    ...over,
  };
}

describe("generateArtifact — the integration keystone", () => {
  it("generates a client-ready architecture when gate+context+bar all pass", async () => {
    const r = await generateArtifact(
      { moveId: "m", tenantKey: "meridian", phase: 3, artifact: "target_state_architecture" },
      deps(),
    );
    expect(r.status).toBe("generated");
  });

  it("blocks_gate (409) when the gate is not approved — no generation", async () => {
    let modelCalled = false;
    const r = await generateArtifact(
      { moveId: "m", tenantKey: "t", phase: 3, artifact: "target_state_architecture" },
      deps({
        gateSources: { captureComplete: async () => ({ complete: true, missing: [] }), gateApproved: async () => false },
        callModel: async () => { modelCalled = true; return GOOD_ARCH_HTML; },
      }),
    );
    expect(r.status).toBe("blocked_gate");
    expect(modelCalled).toBe(false); // never even called the model
  });

  it("blocks_context for architecture when no option was approved (P3a)", async () => {
    const r = await generateArtifact(
      { moveId: "m", tenantKey: "t", phase: 3, artifact: "target_state_architecture" },
      deps({
        contextSources: {
          retrieveCurrentState: async () => "Epic...",
          loadPriorDigests: async () => [
            { useCase: "x", kpis: [{ name: "k", domain: "clinical" }], gaps: ["g"] }, // no chosenOption
          ],
          loadDecisions: async () => [],
        },
      }),
    );
    expect(r.status).toBe("blocked_context");
    if (r.status === "blocked_context") expect(r.missing.join(" ")).toMatch(/chosenOption/);
  });

  it("blocks_quality when the model returns prose (fails the golden bar) — saved as draft", async () => {
    const r = await generateArtifact(
      { moveId: "m", tenantKey: "t", phase: 3, artifact: "target_state_architecture" },
      deps({ callModel: async () => "<html><body><p>just prose, no diagrams</p></body></html>" }),
    );
    expect(r.status).toBe("blocked_quality");
    if (r.status === "blocked_quality") expect(r.goldenBar.pass).toBe(false);
  });
});
