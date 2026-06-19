import { renderExecutiveDeck } from "../deck-renderer";
import { renderStoryExhibits } from "../visual-director";
import { buildStory } from "../story/story-director";
import type { MoveDecisionModel } from "../decision-model/types";

function model(): MoveDecisionModel {
  return {
    moveId: "move-1",
    clientDisplayName: "First Capital Financial",
    initiativeDisplayName: "AI Trade Finance L/C Automation",
    governingDecision: "Automate L/C examination — build, buy, or partner?",
    answerFirstRecommendation: "Fund an AI-native build; it cuts cost 58% and pays back in 3.6 months.",
    evidenceBundle: [1, 2].map((n) => ({
      citationNumber: n, label: `fact ${n}`, statement: `s${n}`,
      evidenceFamily: "run_cost_baseline", confidence: "high" as const,
      disclosureTier: "internal_only" as const, provenanceRef: `p${n}`,
    })),
    missingEvidence: [], approvedAssumptions: [],
    claims: [{ id: "c1", statement: "Examination effort is the cost driver.", supportingEvidence: [1], contradictingEvidence: [], confidence: "high" }],
    contradictoryEvidence: [], risks: [], dependencies: [], openQuestions: [],
    valueModel: {
      valueThesis: "AI-native examination removes manual reconciliation while preserving control.",
      valuePools: [{ lever: "Examination labour", annualValueUsd: 740000, evidence: [1] }],
      estimateTwice: {
        traditional: { scenario: "traditional", costUsd: 1_710_000, durationMonths: 14, humanFte: 18 },
        aiNative: { scenario: "ai_native", costUsd: 720_000, durationMonths: 9, humanFte: 8, paybackMonths: 3.6, productivityMultiplier: 2.4 },
        costReductionPct: 58, productivityMultiplier: 2.4,
      },
    },
    requiredDecisions: [{
      id: "rd1", decision: "Approve the AI-native build",
      options: [{ id: "build", label: "Build AI-native", pros: ["cheapest"], cons: ["risk"] }],
      recommendedOptionId: "build", rationale: "Cheapest with the strongest control posture.",
    }],
    meta: { builtAtIso: "2026-06-19T00:00:00.000Z", source: "deterministic_assembly", weEstimateBound: true },
  };
}

describe("renderExecutiveDeck — Value Model archetype", () => {
  const m = model();
  const story = buildStory(m, "value_model");
  const exhibits = renderStoryExhibits(story, m);
  const opts = { generatedOnIso: "2026-06-19", tenantLabel: "First Capital Financial", tenantKey: "first-capital" };
  const html = renderExecutiveDeck(story, m, exhibits, opts);

  it("produces a complete HTML deck document", () => {
    expect(html.startsWith("<!doctype html")).toBe(true);
    expect(html).toContain("</html>");
    expect(html).toContain("<style>"); // deck styles embedded
  });

  it("leads with the Move title and the answer-first recommendation on the cover", () => {
    expect(html).toContain("AI Trade Finance L/C Automation");
    expect(html).toContain("Fund an AI-native build");
  });

  it("embeds real rendered exhibits (SVG) on the slides", () => {
    expect(html).toContain("<svg");
    // the estimate-twice waterfall + value tree render for real; a gap exhibit shows the honest card
    expect(html).toContain("EXHIBIT PENDING"); // MeasurementArchitecture is not built yet
  });

  it("carries every page's conclusion headline as a slide takeaway", () => {
    for (const page of story.pages) {
      expect(html).toContain(page.headline.slice(0, 24));
    }
  });

  it("is deterministic given a fixed generated-on date", () => {
    const again = renderExecutiveDeck(story, m, exhibits, opts);
    expect(again).toBe(html);
  });
});
