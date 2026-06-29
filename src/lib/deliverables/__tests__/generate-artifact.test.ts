import { generateArtifact, type GenerateArtifactDeps } from "../generate-artifact";

const ENOUGH_WORDS = Array.from({ length: 2600 }, (_, i) => `future${i}`).join(" ");

const GOOD_ARCH_HTML = `<html><body>
<h1>P3 Draft — based on approved P2 diagnostic for design shaping</h1>
<p>The blueprint uses 1,872 monthly exceptions, 2,345 manual touch hours per month, 7.4 average resolution days, and Payment hold / control review evidence as draft shaping inputs.</p>
<div class="diagram"><svg>conceptual architecture</svg></div>
<div class="diagram"><svg>logical architecture</svg></div>
<div class="diagram"><svg>physical deployment</svg></div>
<div class="flow"><svg>data-flow</svg></div>
<div class="diagram">native vs non-native pattern</div>
<div class="diagram"><svg>current-to-future operating concept</svg></div>
<div class="diagram"><svg>human + AI role model</svg></div>
<div class="diagram"><svg>governance / control model</svg></div>
<table>decision record / tradeoff</table>
<table>KPI traceability</table>
<table>current-to-future logic table</table>
<table>human + AI role model table</table>
<table>workflow option matrix</table>
<table>control / governance matrix</table>
<table>implementation work package table</table>
<table>open decision log</table>
<table>P4 readiness checklist</table>
<p>${ENOUGH_WORDS}</p>
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

  it("allows a P3 future-state blueprint draft after P2 draft approval without inventing a chosen option", async () => {
    const r = await generateArtifact(
      {
        moveId: "m",
        tenantKey: "lakeshore",
        phase: 3,
        artifact: "target_state_architecture",
        generationMode: "draft",
      },
      deps({
        gateSources: {
          captureComplete: async () => ({ complete: true, missing: [] }),
          gateApproved: async () => false,
          priorPhaseDraftApproval: async () => ({
            approved: true,
            sourcePhase: 2,
            decision: "approve_for_p3_draft",
            caveats: ["P2 approved for P3 draft shaping only."],
          }),
        },
        contextSources: {
          retrieveCurrentState: async () => `
            Average monthly invoice exceptions, 1872
            Manual touch hours per month, 2345
            Average resolution days, 7.4
            Payment hold / control review creates duplicate-payment risk.
          `,
          loadPriorDigests: async () => [
            { useCase: "AP exception redesign", kpis: [{ name: "cycle time", domain: "financial" }], gaps: ["payment hold governance inconsistent"] },
          ],
          loadDecisions: async () => [],
        },
      }),
    );
    expect(r.status).toBe("generated");
    if (r.status === "generated") {
      expect(r.generationMode).toBe("draft");
      expect(r.draftOnly).toBe(true);
      expect(r.contextCaveats.join(" ")).toMatch(/No final P3 option has been selected/);
      expect(r.html).toContain("P3 Draft");
    }
  });

  it("blocks_quality when the model returns prose (fails the golden bar) — saved as draft", async () => {
    const r = await generateArtifact(
      { moveId: "m", tenantKey: "t", phase: 3, artifact: "target_state_architecture" },
      deps({ callModel: async () => "<html><body><p>just prose, no diagrams</p></body></html>" }),
    );
    expect(r.status).toBe("blocked_quality");
    if (r.status === "blocked_quality") expect(r.goldenBar.pass).toBe(false);
  });

  it("completes mandatory architecture tables when Claude returns diagrams but omits the table exhibit", async () => {
    const missingTableHtml = `<html><body>
      <h1>P3 Draft — based on approved P2 diagnostic for design shaping</h1>
      <div class="diagram"><svg>conceptual architecture diagram</svg></div>
      <div class="diagram"><svg>logical architecture diagram</svg></div>
      <div class="diagram"><svg>physical deployment diagram</svg></div>
      <div class="flow"><svg>integration data flow diagram</svg></div>
      <div class="diagram">native vs non-native service pattern</div>
      <div class="diagram"><svg>current-to-future operating concept</svg></div>
      <div class="diagram"><svg>human + AI role model</svg></div>
      <div class="diagram"><svg>governance / control model</svg></div>
      <p>${ENOUGH_WORDS}</p>
    </body></html>`;

    const r = await generateArtifact(
      { moveId: "m", tenantKey: "meridian", phase: 3, artifact: "target_state_architecture" },
      deps({ callModel: async () => missingTableHtml }),
    );

    expect(r.status).toBe("generated");
    if (r.status === "generated") {
      expect(r.goldenBar.pass).toBe(true);
      expect(r.html).toContain("Architecture Decision Records / Tradeoff Table");
      expect(r.html).toContain("KPI-to-Capability Traceability");
      expect(r.html).toContain("Current-to-Future Logic Table");
      expect(r.html).toContain("Human + AI Role Model");
      expect(r.html).toContain("Workflow Option Matrix");
      expect(r.html).toContain("Control / Governance Matrix");
      expect(r.html).toContain("Implementation Work Package Table");
      expect(r.html).toContain("Open Decision Log");
      expect(r.html).toContain("P4 Readiness Checklist");
      expect(r.html.match(/<table/g)?.length).toBeGreaterThanOrEqual(9);
    }
  });

  it("completes P2 evidence baseline when Claude omits first-class metrics and taxonomy", async () => {
    const enoughWords = Array.from({ length: 2600 }, (_, i) => `word${i}`).join(" ");
    const p2HtmlWithoutEvidence = `<html><body>
      <h1>Discovery & Diagnostic Readout</h1>
      <svg><text>Current-state architecture diagram</text></svg>
      <svg><text>Current-state data-flow diagram</text></svg>
      <svg><text>Current-state process map</text></svg>
      <svg><text>Root-cause map</text></svg>
      <h2>Gap Matrix</h2><table><tr><td>gap</td></tr></table>
      <h2>KPI Baseline Table</h2><table><tr><td>baseline pending</td></tr></table>
      <h2>Evidence Source Table</h2><table><tr><td>evidence</td></tr></table>
      <p>The process has exception volume and manual effort, but this draft fails to use the exact evidence.</p>
      <p>${enoughWords}</p>
    </body></html>`;

    const r = await generateArtifact(
      {
        moveId: "m",
        tenantKey: "lakeshore",
        phase: 2,
        artifact: "discovery_report",
        generationMode: "draft",
      },
      deps({
        contextSources: {
          retrieveCurrentState: async () => `
            Average monthly invoice exceptions, 1872
            Manual touch hours per month, 2345
            Average resolution days, 7.4
            "Missing PO","420","22.4","6.8","510","Medium","Accounts Payable"
            "Payment hold / control review","27","1.4","12.5","58","High","Finance Control"
          `,
          loadPriorDigests: async () => [
            {
              useCase: "Vendor Invoice Exception Handling Redesign",
              valueHypothesis: "Reduce manual touch, cycle time, and control risk.",
            },
          ],
          loadDecisions: async () => [],
        },
        callModel: async () => p2HtmlWithoutEvidence,
      }),
    );

    expect(r.status).toBe("generated");
    if (r.status === "generated") {
      expect(r.goldenBar.pass).toBe(true);
      expect(r.html).toContain("Evidence Baseline Completion Exhibit");
      expect(r.html).toContain("1,872");
      expect(r.html).toContain("2,345");
      expect(r.html).toContain("7.4");
      expect(r.html).toContain("Missing PO");
      expect(r.html).toContain("Payment hold / control review");
    }
  });

  it("sanitizes internal implementation language before the golden bar and persistence", async () => {
    const enoughWords = Array.from({ length: 2550 }, (_, i) => `word${i}`).join(" ");
    const p2HtmlWithInternalTerms = `<html><body>
      <h1>Discovery & Diagnostic Readout</h1>
      <p>This request uses 1,872 monthly exceptions, 2,345 manual touch hours, and 7.4 average resolution days.</p>
      <svg><text>Current-state architecture diagram</text></svg>
      <svg><text>Current-state data-flow diagram</text></svg>
      <svg><text>Current-state process map</text></svg>
      <svg><text>Root-cause map</text></svg>
      <h2>Gap Matrix</h2><table><tr><td>gap</td></tr></table>
      <h2>KPI Baseline Table</h2><table><tr><td>baseline</td></tr></table>
      <h2>Evidence Source Table</h2><table><tr><td>Missing PO</td><td>Price mismatch</td><td>Payment hold / control review</td></tr></table>
      <p>The source row confirms the control-risk branch, and the prompt should never be visible to a client.</p>
      <p>Prompt-injection controls should be rendered as client-facing security language.</p>
      <p>${enoughWords}</p>
    </body></html>`;

    const r = await generateArtifact(
      {
        moveId: "m",
        tenantKey: "lakeshore",
        phase: 2,
        artifact: "discovery_report",
        generationMode: "draft",
      },
      deps({
        contextSources: {
          retrieveCurrentState: async () => `
            Average monthly invoice exceptions, 1872
            Manual touch hours per month, 2345
            Average resolution days, 7.4
            "Missing PO","420","22.4","6.8","510","Medium","Accounts Payable"
            "Payment hold / control review","27","1.4","12.5","58","High","Finance Control"
          `,
          loadPriorDigests: async () => [
            {
              useCase: "Vendor Invoice Exception Handling Redesign",
              valueHypothesis: "Reduce manual touch, cycle time, and control risk.",
            },
          ],
          loadDecisions: async () => [],
        },
        callModel: async () => p2HtmlWithInternalTerms,
      }),
    );

    expect(r.status).toBe("generated");
    if (r.status === "generated") {
      expect(r.goldenBar.pass).toBe(true);
      expect(r.goldenBar.forbiddenLanguageHits).toEqual([]);
      expect(r.html.toLowerCase()).not.toContain("source row");
      expect(r.html.toLowerCase()).not.toContain("prompt");
      expect(r.html).toContain("adversarial input attack");
      expect(r.html).toContain("1,872");
      expect(r.html).toContain("2,345");
      expect(r.html).toContain("7.4");
      expect(r.html).toContain("Payment hold / control review");
    }
  });
});
