import { renderStoryExhibits, visualCoverage } from "../visual-director";
import { buildStory } from "../story/story-director";
import type { MoveDecisionModel } from "../decision-model/types";

function richModel(): MoveDecisionModel {
  return {
    moveId: "move-1",
    clientDisplayName: "First Capital Financial",
    initiativeDisplayName: "AI Trade Finance L/C Automation",
    governingDecision: "Automate L/C examination — build, buy, or partner?",
    answerFirstRecommendation: "Fund an AI-native build; it cuts cost 58% and pays back in 3.6 months.",
    evidenceBundle: [1, 2, 3].map((n) => ({
      citationNumber: n, label: `fact ${n}`, statement: `s${n}`,
      evidenceFamily: "run_cost_baseline", confidence: "high" as const,
      disclosureTier: "internal_only" as const, provenanceRef: `p${n}`,
    })),
    missingEvidence: [],
    approvedAssumptions: [],
    claims: [
      { id: "c1", statement: "Examination effort is the cost driver.", supportingEvidence: [1, 2], contradictingEvidence: [3], confidence: "high" },
      { id: "c2", statement: "Reconciliation is manual end-to-end.", supportingEvidence: [], contradictingEvidence: [], confidence: "medium" },
    ],
    contradictoryEvidence: [3],
    risks: [{ id: "r1", statement: "Keep a human checkpoint.", severity: "high", likelihood: "medium", evidence: [2] }],
    dependencies: [],
    openQuestions: [{ id: "q1", question: "Who signs off?", whyItMatters: "regulatory" }],
    operatingModel: {
      roles: [{ id: "ro1", label: "Examiner", accountableFor: ["x"], humanOrAgent: "hybrid" }],
      decisionRights: [], governanceForums: [],
    },
    valueModel: {
      valueThesis: "AI-native examination removes manual reconciliation while preserving control.",
      valuePools: [
        { lever: "Examination labour", annualValueUsd: 740000, evidence: [1] },
        { lever: "Error rework", annualValueUsd: 250000, evidence: [2] },
      ],
      estimateTwice: {
        traditional: { scenario: "traditional", costUsd: 1_710_000, durationMonths: 14, humanFte: 18, npvUsd: 4_260_000 },
        aiNative: { scenario: "ai_native", costUsd: 720_000, durationMonths: 9, humanFte: 8, paybackMonths: 3.6, npvUsd: 5_240_000, productivityMultiplier: 2.4 },
        costReductionPct: 58, productivityMultiplier: 2.4,
      },
    },
    requiredDecisions: [
      {
        id: "rd1", decision: "Approve the AI-native build",
        options: [
          { id: "build", label: "Build AI-native", pros: ["cheapest"], cons: ["delivery risk"] },
          { id: "buy", label: "Buy a suite", pros: ["faster"], cons: ["higher run cost"] },
        ],
        recommendedOptionId: "build", rationale: "Cheapest with the strongest control posture.",
      },
    ],
    meta: { builtAtIso: "2026-06-19T00:00:00.000Z", source: "deterministic_assembly", weEstimateBound: true },
  };
}

describe("Visual Director — Value Model archetype end-to-end (the WE convergence)", () => {
  const model = richModel();
  const story = buildStory(model, "value_model");
  const exhibits = renderStoryExhibits(story, model);

  it("renders the estimate-twice waterfall, value tree, economics strip, and decision scorecard for real", () => {
    const byType = (t: string) => exhibits.filter((e) => e.exhibitType === t);
    expect(byType("ValueWaterfall")[0].status).toBe("rendered");
    expect(byType("ValueTree")[0].status).toBe("rendered");
    expect(byType("KeyMessageCard")[0].status).toBe("rendered");
    expect(byType("DecisionScorecard")[0].status).toBe("rendered");
  });

  it("degrades the not-yet-built exhibit (MeasurementArchitecture) to an honest gap-card", () => {
    const meas = exhibits.filter((e) => e.exhibitType === "MeasurementArchitecture");
    expect(meas.length).toBeGreaterThan(0);
    for (const e of meas) {
      expect(e.status).toBe("gap");
      expect(e.svg).toContain("EXHIBIT PENDING");
      expect(e.gapReason).toBeTruthy();
    }
  });

  it("every exhibit is a well-formed inline SVG and carries the page's evidence", () => {
    for (const e of exhibits) {
      expect(e.svg.startsWith("<svg")).toBe(true);
      expect(Array.isArray(e.evidence)).toBe(true);
    }
  });

  it("a majority of the Value Model deck renders real visuals", () => {
    const cov = visualCoverage(exhibits);
    expect(cov.rendered).toBeGreaterThan(cov.gap);
  });
});

describe("Visual Director — Discover & Diagnose renders the tree family", () => {
  const model = richModel();
  const exhibits = renderStoryExhibits(buildStory(model, "discover_and_diagnose"), model);

  it("renders IssueTree and RootCauseTree via the new tree renderer", () => {
    expect(exhibits.find((e) => e.exhibitType === "IssueTree")?.status).toBe("rendered");
    expect(exhibits.find((e) => e.exhibitType === "RootCauseTree")?.status).toBe("rendered");
  });
});

describe("Visual Director never throws", () => {
  it("an empty model degrades every exhibit to a gap-card, no throw", () => {
    const empty: MoveDecisionModel = {
      ...richModel(),
      claims: [], valueModel: undefined, requiredDecisions: [],
    };
    const exhibits = renderStoryExhibits(buildStory(empty, "value_model"), empty);
    expect(exhibits.every((e) => e.svg.startsWith("<svg"))).toBe(true);
    expect(exhibits.every((e) => e.status === "gap")).toBe(true);
  });
});
