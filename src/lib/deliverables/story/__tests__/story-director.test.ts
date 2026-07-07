import { buildStory, validateStory } from "../story-director";
import {
  ARCHETYPE_BLUEPRINTS,
  archetypeForDeliverableKey,
  getArchetypeBlueprint,
} from "../archetype-blueprints";
import type { ArchetypeKey } from "../types";
import type { MoveDecisionModel } from "@/lib/deliverables/decision-model/types";

// A fully-populated model so no archetype reports a content gap.
function richModel(): MoveDecisionModel {
  return {
    moveId: "move-1",
    clientDisplayName: "First Capital Financial",
    initiativeDisplayName: "AI Trade Finance L/C Automation",
    governingDecision: "Automate L/C examination — build, buy, or partner?",
    answerFirstRecommendation: "Fund an AI-native build; it cuts cost 58% and pays back in 3.6 months.",
    evidenceBundle: [1, 2, 3].map((n) => ({
      citationNumber: n,
      label: `fact ${n}`,
      statement: `statement ${n}`,
      evidenceFamily: "run_cost_baseline",
      confidence: "high" as const,
      disclosureTier: "internal_only" as const,
      provenanceRef: `prov-${n}`,
    })),
    missingEvidence: [{ evidenceFamily: "x", label: "missing", whyItMatters: "w", blocksSections: [], completionPath: "c" } as never],
    approvedAssumptions: [],
    claims: [
      { id: "c1", statement: "Examination effort is the cost driver.", supportingEvidence: [1, 2], contradictingEvidence: [3], confidence: "high" },
    ],
    contradictoryEvidence: [3],
    risks: [{ id: "r1", statement: "Keep a human checkpoint.", severity: "high", likelihood: "medium", evidence: [2] }],
    dependencies: [{ id: "d1", statement: "Identity resolution first.", blocks: ["build"], evidence: [1] }],
    openQuestions: [{ id: "q1", question: "Who signs off adverse decisions?", whyItMatters: "regulatory" }],
    architectureModel: {
      layers: ["business", "systems_of_record", "ai_solution_zone"],
      nodes: [{ id: "n1", label: "Examiner agent", layer: "ai_solution_zone", evidence: [1] }],
      edges: [{ from: "n1", to: "n1", kind: "control" }],
      controls: [{ id: "ctl1", label: "Human gate", coverage: "native", evidence: [2] }],
    },
    operatingModel: {
      roles: [{ id: "ro1", label: "Examiner", accountableFor: ["adverse decision"], humanOrAgent: "hybrid" }],
      decisionRights: [{ decision: "approve adverse", responsible: "examiner", accountable: "head", consulted: [], informed: [] }],
      governanceForums: [{ name: "Model Risk Committee", cadence: "monthly", mandate: "SR 11-7" }],
    },
    valueModel: {
      valueThesis: "AI-native examination removes manual reconciliation while preserving control.",
      valuePools: [{ lever: "examination", annualValueUsd: 990000, evidence: [1] }],
      estimateTwice: {
        traditional: { scenario: "traditional", costUsd: 1_710_000, durationMonths: 14, humanFte: 18 },
        aiNative: { scenario: "ai_native", costUsd: 720_000, durationMonths: 9, humanFte: 8, productivityMultiplier: 2.4 },
      },
    },
    requiredDecisions: [
      {
        id: "rd1",
        decision: "Approve the AI-native build",
        options: [{ id: "build", label: "Build", pros: ["cheapest"], cons: ["risk"] }],
        recommendedOptionId: "build",
        rationale: "robust value case",
      },
    ],
    meta: { builtAtIso: "2026-06-19T00:00:00.000Z", source: "deterministic_assembly", weEstimateBound: true },
  };
}

describe("buildStory", () => {
  it("binds the answer-first recommendation onto the target-architecture page 1", () => {
    const story = buildStory(richModel(), "target_architecture");
    expect(story.pages[0].roleInStory).toBe("recommendation");
    expect(story.pages[0].headline).toContain("AI-native");
    expect(story.pages[0].headlineIsConclusion).toBe(true);
    expect(story.governingQuestion).toContain("Automate");
  });

  it("binds claim evidence onto a claims-sourced page", () => {
    const story = buildStory(richModel(), "discover_and_diagnose");
    const issueTreePage = story.pages.find((p) => p.roleInStory === "issue_tree")!;
    expect(issueTreePage.sourceFromModel).toBe("claims");
    expect(issueTreePage.supportingEvidence).toEqual([1, 2]);
  });

  it("routes the Workforce Economics estimate-twice to a ValueWaterfall page (the convergence)", () => {
    const story = buildStory(richModel(), "value_model");
    const benefit = story.pages.find((p) => p.roleInStory === "benefit_decomposition")!;
    expect(benefit.exhibitType).toBe("ValueWaterfall");
    expect(benefit.sourceFromModel).toBe("valueModel");
  });
});

describe("every archetype blueprint produces a valid story", () => {
  const keys = Object.keys(ARCHETYPE_BLUEPRINTS) as ArchetypeKey[];
  it.each(keys)("archetype %s: no validation errors, mandatory exhibits present, has a decision page", (key) => {
    const model = richModel();
    const story = buildStory(model, key);
    const blueprint = getArchetypeBlueprint(key)!;
    const issues = validateStory(story, blueprint, model);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toEqual([]);
    // exhibit plan covers every mandatory exhibit
    for (const ex of blueprint.mandatoryExhibits) {
      expect(story.exhibitPlan).toContain(ex);
    }
    expect(story.pages.some((p) => p.roleInStory === "decision")).toBe(true);
  });
});

describe("answer-first discipline (spec §6/§17)", () => {
  it("warns on the Initiative Charter (the §9 problem-first sequence) but does not error", () => {
    const model = richModel();
    const story = buildStory(model, "initiative_charter");
    const issues = validateStory(story, getArchetypeBlueprint("initiative_charter")!, model);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(issues.some((i) => i.code === "no_answer_first_in_first_two_pages" && i.severity === "warning")).toBe(true);
  });

  it("does NOT warn for archetypes that open answer-first (e.g. target architecture)", () => {
    const model = richModel();
    const story = buildStory(model, "target_architecture");
    const issues = validateStory(story, getArchetypeBlueprint("target_architecture")!, model);
    expect(issues.some((i) => i.code === "no_answer_first_in_first_two_pages")).toBe(false);
  });
});

describe("archetypeForDeliverableKey", () => {
  it("maps registry keys to archetypes", () => {
    expect(archetypeForDeliverableKey("charter")).toBe("initiative_charter");
    expect(archetypeForDeliverableKey("target_state_architecture")).toBe("target_architecture");
    expect(archetypeForDeliverableKey("solution_design")).toBe("target_architecture");
    expect(archetypeForDeliverableKey("business_case")).toBe("value_model");
    expect(archetypeForDeliverableKey("financial_model")).toBe("value_model");
    expect(archetypeForDeliverableKey("handoff_package")).toBe("handoff");
    expect(archetypeForDeliverableKey("nope")).toBeUndefined();
  });
});
