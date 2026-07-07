import {
  assembleMoveDecisionModel,
  validateMoveDecisionModel,
  valueModelFromEstimate,
  type AssembleDecisionModelInput,
  type DecisionModelDraft,
} from "../build-decision-model";
import type { EstimateTwice } from "../types";
import type { GovernedEvidenceItem } from "@/lib/deliverables/orchestrator/types";

const evidence = (n: number): GovernedEvidenceItem => ({
  citationNumber: n,
  label: `fact ${n}`,
  statement: `statement ${n}`,
  evidenceFamily: "run_cost_baseline",
  confidence: "high",
  disclosureTier: "internal_only",
  provenanceRef: `prov-${n}`,
});

// The WE worked example: $1.71M → $0.72M, 18 → 8 humans, 2.4× productivity.
const weEstimate: EstimateTwice = {
  traditional: {
    scenario: "traditional",
    costUsd: 1_710_000,
    durationMonths: 14,
    humanFte: 18,
    roiPct: 322,
    paybackMonths: 8.5,
    npvUsd: 4_260_000,
  },
  aiNative: {
    scenario: "ai_native",
    costUsd: 720_000,
    durationMonths: 9,
    humanFte: 8,
    agentFte: 6,
    productivityMultiplier: 2.4,
    roiPct: 895,
    paybackMonths: 3.6,
    npvUsd: 5_240_000,
  },
  costReductionPct: 58,
  productivityMultiplier: 2.4,
};

const baseDraft = (): DecisionModelDraft => ({
  governingDecision: "Automate Trade Finance L/C examination — build, buy, or partner?",
  answerFirstRecommendation:
    "Fund an AI-native L/C automation build; it cuts cost 58% and pays back in 3.6 months.",
  claims: [
    {
      id: "c1",
      statement: "Examination effort, not headcount, is the cost driver.",
      supportingEvidence: [1, 2],
      contradictingEvidence: [],
      confidence: "high",
    },
  ],
  contradictoryEvidence: [3],
  risks: [
    {
      id: "r1",
      statement: "Regulated decisions must keep a human checkpoint.",
      severity: "high",
      likelihood: "medium",
      mitigation: "Human-in-the-loop gate on every adverse decision.",
      evidence: [2],
    },
  ],
  dependencies: [],
  openQuestions: [],
  requiredDecisions: [
    {
      id: "d1",
      decision: "Approve the AI-native build",
      options: [
        { id: "build", label: "Build AI-native", pros: ["lowest cost"], cons: ["delivery risk"] },
        { id: "buy", label: "Buy a vendor suite", pros: ["faster"], cons: ["higher run cost"] },
      ],
      recommendedOptionId: "build",
      rationale: "Build is cheapest and the value case is robust.",
    },
  ],
  valueThesis: "AI-native examination removes manual reconciliation while preserving control.",
});

const baseInput = (overrides: Partial<AssembleDecisionModelInput> = {}): AssembleDecisionModelInput => ({
  moveId: "move-1",
  clientDisplayName: "First Capital Financial",
  initiativeDisplayName: "AI Trade Finance L/C Automation",
  draft: baseDraft(),
  governedEvidence: [evidence(1), evidence(2), evidence(3)],
  nowIso: "2026-06-19T00:00:00.000Z",
  ...overrides,
});

describe("assembleMoveDecisionModel", () => {
  it("assembles a structurally valid model and wires the shared evidence bundle", () => {
    const model = assembleMoveDecisionModel(baseInput());
    expect(validateMoveDecisionModel(model)).toEqual([]);
    expect(model.evidenceBundle).toHaveLength(3);
    expect(model.meta.source).toBe("deterministic_assembly");
    expect(model.meta.weEstimateBound).toBe(false);
    expect(model.valueModel?.estimateTwice).toBeUndefined();
  });

  it("binds a Workforce Economics estimate into ValueModel.estimateTwice (the convergence seam)", () => {
    const model = assembleMoveDecisionModel(baseInput({ weEstimate }));
    expect(model.meta.weEstimateBound).toBe(true);
    expect(model.valueModel?.estimateTwice?.aiNative.costUsd).toBe(720_000);
    expect(model.valueModel?.estimateTwice?.traditional.costUsd).toBe(1_710_000);
    expect(model.valueModel?.valueThesis).toContain("AI-native");
    expect(validateMoveDecisionModel(model)).toEqual([]);
  });
});

describe("validateMoveDecisionModel", () => {
  it("flags a claim that cites evidence not in the bundle", () => {
    const draft = baseDraft();
    draft.claims[0].supportingEvidence = [1, 99];
    const issues = validateMoveDecisionModel(assembleMoveDecisionModel(baseInput({ draft })));
    expect(issues.some((i) => i.code === "claim_cites_unknown_evidence")).toBe(true);
  });

  it("flags a recommended option that does not exist", () => {
    const draft = baseDraft();
    draft.requiredDecisions[0].recommendedOptionId = "nope";
    const issues = validateMoveDecisionModel(assembleMoveDecisionModel(baseInput({ draft })));
    expect(issues.some((i) => i.code === "recommended_option_missing")).toBe(true);
  });

  it("flags a required decision with no options", () => {
    const draft = baseDraft();
    draft.requiredDecisions[0].options = [];
    const issues = validateMoveDecisionModel(assembleMoveDecisionModel(baseInput({ draft })));
    expect(issues.some((i) => i.code === "required_decision_without_options")).toBe(true);
  });

  it("enforces the estimate-twice promise: AI-native must be cheaper and not slower", () => {
    const broken: EstimateTwice = {
      ...weEstimate,
      aiNative: { ...weEstimate.aiNative, costUsd: 2_000_000, durationMonths: 20 },
    };
    const issues = validateMoveDecisionModel(assembleMoveDecisionModel(baseInput({ weEstimate: broken })));
    const details = issues.filter((i) => i.code === "value_model_estimate_inconsistent");
    expect(details).toHaveLength(2); // cheaper-violation + not-slower-violation
  });
});

describe("valueModelFromEstimate", () => {
  it("returns undefined when there is nothing to model", () => {
    expect(valueModelFromEstimate(undefined, undefined, undefined)).toBeUndefined();
  });

  it("carries the estimate through when present", () => {
    const vm = valueModelFromEstimate("thesis", undefined, weEstimate);
    expect(vm?.estimateTwice?.productivityMultiplier).toBe(2.4);
  });
});
