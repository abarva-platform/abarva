import {
  FRAMEWORK_REGISTRY,
  listWiredFrameworks,
  runFramework,
} from "@/lib/source/reasoning/framework-registry";
import {
  toClassifierInput,
  toRigorLevel,
} from "@/lib/source/reasoning/context-adapter";
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
      scopeDescription:
        "Run/maintain and enhancement for the FIS Profile core-banking AMS towers.",
      estimatedValueUsd: 14_000_000,
      ...overrides,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
  } as unknown as SourceGenerationContext;
}

describe("framework registry (Slice 1.2)", () => {
  it("lists exactly the classifier framework as wired", () => {
    expect(listWiredFrameworks()).toEqual(["archetype_method_set"]);
  });

  it("runs the classifier framework into a well-formed AnalysisResult", () => {
    const result = runFramework("archetype_method_set", ctxFixture());
    expect(result).not.toBeNull();
    expect(result!.framework).toBe("archetype_method_set");
    expect(typeof (result!.finding as { categoryId: string }).categoryId).toBe(
      "string",
    );
    expect(["low", "moderate", "high"]).toContain(result!.confidence.label);
    expect(result!.confidence.score).toBeGreaterThan(0);
    // The classifier cites no evidence states (deterministic over attributes).
    expect(result!.evidence).toEqual([]);
  });

  it("surfaces evidence gaps honestly when no segments are loaded", () => {
    const result = runFramework("archetype_method_set", ctxFixture());
    const gaps = (result!.finding as { evidenceGaps: string[] }).evidenceGaps;
    expect(Array.isArray(gaps)).toBe(true);
  });

  it("returns null for a pending framework (caller skips it)", () => {
    expect(runFramework("should_cost_baseline", ctxFixture())).toBeNull();
    expect(runFramework("delivery_model_gate", ctxFixture())).toBeNull();
    expect(runFramework("proposal_normalization", ctxFixture())).toBeNull();
  });

  it("every pending framework documents the exact input it still needs", () => {
    for (const key of Object.keys(FRAMEWORK_REGISTRY) as Array<
      keyof typeof FRAMEWORK_REGISTRY
    >) {
      const e = FRAMEWORK_REGISTRY[key];
      if (e.status === "pending") {
        expect(e.pendingInput && e.pendingInput.length).toBeTruthy();
        expect(e.run).toBeUndefined();
      } else {
        expect(typeof e.run).toBe("function");
      }
    }
  });
});

describe("context adapter (Slice 1.2)", () => {
  it("maps event fields to classifier attributes (null archetype → undefined)", () => {
    const { attributes } = toClassifierInput(ctxFixture({ archetype: null }));
    expect(attributes.name).toContain("Core Banking");
    expect(attributes.archetype).toBeUndefined();
    expect(attributes.description).toContain("FIS Profile");
  });

  it("coerces unknown rigor to standard", () => {
    expect(toRigorLevel(ctxFixture({ rigor: "strategic" }))).toBe("strategic");
    expect(toRigorLevel(ctxFixture({ rigor: "nonsense" }))).toBe("standard");
    expect(toRigorLevel(ctxFixture({ rigor: null }))).toBe("standard");
  });
});
