import { decisionModelFromRenderable, buildDeckHtmlFromDocument } from "../deck-from-result";
import type { RenderableDeliverable } from "../orchestrator/types";

function doc(): RenderableDeliverable {
  return {
    title: "AI Trade Finance L/C Automation — Business Case",
    clientDisplayName: "First Capital Financial",
    initiativeDisplayName: "AI Trade Finance L/C Automation",
    generatedSections: [
      { key: "es", title: "Executive Summary", bodyMarkdown: "…", groundingMode: "governed_facts", citationsUsed: [1] },
      { key: "cs", title: "Current-State Baseline", bodyMarkdown: "…", groundingMode: "governed_facts", citationsUsed: [1, 2] },
      { key: "val", title: "Value Pools", bodyMarkdown: "…", groundingMode: "governed_facts", citationsUsed: [2] },
      { key: "rec", title: "Recommendation & Next Actions", bodyMarkdown: "…", groundingMode: "assumption_driven", citationsUsed: [] },
    ],
    tables: [],
    exhibits: [],
    sourceRegister: [
      { citationNumber: 1, label: "FY26 run cost", evidenceFamily: "run_cost_baseline", confidence: "high", asOf: "FY2026" },
      { citationNumber: 2, label: "Examination volume", evidenceFamily: "ops_baseline", confidence: "medium" },
    ],
    assumptions: [],
    clientCompleteChecklist: [],
    recommendation: "Fund an AI-native build; it cuts cost and pays back quickly.",
    nextActions: ["Approve the build"],
  };
}

describe("decisionModelFromRenderable", () => {
  it("maps recommendation, evidence, and non-summary sections into the model", () => {
    const m = decisionModelFromRenderable({ doc: doc(), moveId: "m1", nowIso: "2026-06-19T00:00:00Z" });
    expect(m.answerFirstRecommendation).toContain("AI-native build");
    expect(m.evidenceBundle.map((e) => e.citationNumber)).toEqual([1, 2]);
    // Executive Summary + Recommendation are filtered; Current-State + Value Pools become claims.
    expect(m.claims.map((c) => c.statement)).toEqual(["Current-State Baseline", "Value Pools"]);
    expect(m.claims[0].supportingEvidence).toEqual([1, 2]);
    expect(m.requiredDecisions).toHaveLength(1);
  });
});

describe("buildDeckHtmlFromDocument", () => {
  it("produces an exhibit-led HTML deck for a known deliverable type", () => {
    const html = buildDeckHtmlFromDocument({
      doc: doc(),
      deliverableType: "business_case",
      moveId: "m1",
      nowIso: "2026-06-19",
      tenantLabel: "First Capital Financial",
      tenantKey: "first-capital",
    });
    expect(html).not.toBeNull();
    expect(html!.startsWith("<!doctype html")).toBe(true);
    expect(html!).toContain("AI Trade Finance L/C Automation");
    expect(html!).toContain("Fund an AI-native build");
    expect(html!).toContain("<svg"); // at least the decision scorecard renders
  });

  it("returns null for a deliverable type with no archetype (caller falls back to prose)", () => {
    expect(
      buildDeckHtmlFromDocument({ doc: doc(), deliverableType: "rfp_package", moveId: "m1", nowIso: "2026-06-19" }),
    ).toBeNull();
  });

  it("is deterministic given a fixed date", () => {
    const a = buildDeckHtmlFromDocument({ doc: doc(), deliverableType: "business_case", moveId: "m1", nowIso: "2026-06-19" });
    const b = buildDeckHtmlFromDocument({ doc: doc(), deliverableType: "business_case", moveId: "m1", nowIso: "2026-06-19" });
    expect(a).toBe(b);
  });
});
