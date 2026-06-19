import { resolveAnalysisPlan } from "@/lib/source/reasoning/archetype-resolver";
import { runAnalysisStage } from "@/lib/source/reasoning/analysis-stage";
import { runRecommendationStage } from "@/lib/source/reasoning/recommendation-stage";
import { validateEnvelope } from "@/lib/source/reasoning/envelope-gate";
import type { AnalysisResult } from "@/lib/source/reasoning/types";
import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";

function ctxFixture(
  overrides: Partial<SourceGenerationContext["event"]> = {},
): SourceGenerationContext {
  return {
    tenantKey: "arcturus",
    tenantName: "First Capital Financial",
    event: {
      id: "evt_1",
      code: "ARCT-AMS-SOURCING-EVENT-2026",
      name: "Core Banking Application Management Services",
      archetype: "managed_service",
      rigor: "strategic",
      currentStageKey: "strategy",
      statusLabel: "Waiting on client",
      owner: "CIO",
      triggerDescription: "Incumbent core-banking AMS contract approaches renewal.",
      scopeDescription: "Run/maintain and enhancement for the FIS Profile AMS towers.",
      estimatedValueUsd: 14_000_000,
      ...overrides,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
  } as unknown as SourceGenerationContext;
}

const band = {
  label: "high" as const,
  score: 0.85,
  interval: [0.75, 0.95] as [number, number],
  factors: {
    evidenceSufficiency: 0.85,
    evidenceRecency: 0.85,
    corroboration: 0.85,
    modelUncertainty: 0.15,
  },
};

describe("archetype resolver (Slice 1.4)", () => {
  it("returns the strategy framework set + strategic threshold", () => {
    const plan = resolveAnalysisPlan("managed_service", "strategic", "strategy");
    expect(plan.frameworks).toContain("archetype_method_set");
    expect(plan.frameworks).toContain("should_cost_baseline");
    expect(plan.gateEvidenceThreshold).toBe("Usable Evidence");
  });

  it("modulates the evidence threshold by rigor", () => {
    expect(resolveAnalysisPlan("x", "standard", "scope").gateEvidenceThreshold).toBe("Parsed");
    expect(resolveAnalysisPlan("x", "enhanced", "scope").gateEvidenceThreshold).toBe("Available");
  });

  it("defaults unknown stages to the classifier only", () => {
    const plan = resolveAnalysisPlan("x", "standard", "transition");
    expect(plan.frameworks).toEqual(["archetype_method_set"]);
  });
});

describe("analysis stage (Slice 1.3)", () => {
  it("runs the wired classifier and skips pending frameworks", () => {
    const out = runAnalysisStage(ctxFixture());
    expect(out.results.map((r) => r.framework)).toEqual(["archetype_method_set"]);
    // strategy plan wants should-cost + delivery-model too, which are pending.
    expect(out.skipped).toEqual(
      expect.arrayContaining(["should_cost_baseline", "delivery_model_gate"]),
    );
  });
});

describe("recommendation stage (Slice 1.5)", () => {
  const opts = { envelopeId: "env_1", now: "2026-06-19T12:00:00.000Z" };

  it("REFUSES when no gate-defining claim rests on usable evidence", () => {
    const analysis = runAnalysisStage(ctxFixture()).results; // classifier only, no evidence
    const env = runRecommendationStage(ctxFixture(), analysis, opts);
    expect(env.refusal).toBeDefined();
    expect(env.claims).toHaveLength(0);
    expect(env.refusal!.minimumDataRequest.length).toBeGreaterThan(0);
    // A refusal envelope is valid by the gate.
    expect(validateEnvelope(env).ok).toBe(true);
  });

  it("produces a gate-valid envelope with claims when evidence is usable", () => {
    const analysis: AnalysisResult[] = [
      {
        framework: "should_cost_baseline",
        finding: { baseUsd: 11_000_000 },
        confidence: band,
        evidence: [
          {
            id: "ev1",
            sourceArtifactCode: "d05_scope_memo",
            citation: "FY-Contract.pdf · run-rate",
            readinessState: "Usable Evidence",
          },
        ],
      },
    ];
    const env = runRecommendationStage(ctxFixture(), analysis, opts);
    expect(env.refusal).toBeUndefined();
    expect(env.claims.length).toBeGreaterThan(0);
    expect(env.claims[0]!.supportedBy).toContain("ev1");
    expect(env.claims[0]!.gateDefining).toBe(true);
    // The full pipeline output passes the 1.0 quality gate.
    expect(validateEnvelope(env).ok).toBe(true);
  });

  it("records the archetype classification as an assumption, not a claim", () => {
    const analysis = runAnalysisStage(ctxFixture()).results;
    const env = runRecommendationStage(ctxFixture(), analysis, opts);
    expect(env.assumptions.some((a) => a.id === "assume_archetype")).toBe(true);
    expect(env.decisionTrace.length).toBeGreaterThan(0);
  });
});
