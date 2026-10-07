jest.mock("server-only", () => ({}));

import { classifyFunctionKey } from "@/lib/programs/function-identity";
import {
  buildMoveFunctionBriefText,
  declaredArchetypeForBinding,
  resolvePhaseIntelligenceFunctionBinding,
  type PhaseIntelligenceBindingInput,
} from "@/lib/programs/phase-intelligence-function-binding";

/**
 * The five values `engagements.program_archetype` can actually hold, per the
 * CHECK in `supabase/migrations/041_programs_foundation.sql`. Written out as a
 * literal: a per-value happy-path test cannot catch a declared-identity arm
 * keyed to a column that can never carry a registry id.
 */
const STORABLE_PROGRAM_ARCHETYPES = [
  "strategic_transformation",
  "workflow_automation",
  "platform_modernization",
  "ai_product_enablement",
  "operational_optimization",
] as const;

function move(
  overrides: Partial<PhaseIntelligenceBindingInput> = {},
): PhaseIntelligenceBindingInput {
  return {
    displayCode: "MOVE-1",
    name: "Governed Data Foundation",
    archetype: "ai_product_enablement",
    phaseLabel: "Discover & Diagnose",
    functionPackKey: null,
    charter: null,
    status: { text: "In progress", description: "Move is in progress." },
    tenant: { name: "Demo Health", industryCode: "healthcare_idn" },
    ...overrides,
  };
}

const DECLARED_CHARTER = {
  classification: { archetype: "governed_data_foundation" },
};

describe("resolvePhaseIntelligenceFunctionBinding", () => {
  it("binds the pack a persisted functionPackKey names", () => {
    const result = resolvePhaseIntelligenceFunctionBinding(
      move({ functionPackKey: "member_service_agent_assist" }),
    );
    expect(result.kind).toBe("bound");
    if (result.kind !== "bound") throw new Error("expected bound");
    expect(result.identity.functionKey).toBe("member_service_agent_assist");
    expect(result.source).toBe("persisted functionPackKey");
    expect(result.confidence).toBeNull();
  });

  it("reports the DECLARED archetype instead of guessing a function pack", () => {
    const result = resolvePhaseIntelligenceFunctionBinding(
      move({ charter: DECLARED_CHARTER }),
    );
    expect(result).toEqual({
      kind: "declared_archetype",
      archetypeId: "GOVERNED_DATA_FOUNDATION",
      archetypeName: "Governed Data Foundation",
    });
  });

  it("does not bind a function pack for a charter carrying only the declaration", () => {
    // Measured on the pre-fix resolver: this exact input scored
    // `health_information_interoperability` at 0.188 — just over the 0.18
    // confidence floor — and the panel then spoke that pack's benchmark for a
    // data-foundation Move.
    const result = resolvePhaseIntelligenceFunctionBinding(
      move({ charter: DECLARED_CHARTER }),
    );
    expect(result.kind).not.toBe("bound");
  });

  it("stays declared even when the charter text reads like member service", () => {
    const result = resolvePhaseIntelligenceFunctionBinding(
      move({
        charter: {
          ...DECLARED_CHARTER,
          problem_statement:
            "Member and patient data is fragmented across service lines, so AI initiatives cannot be trusted.",
          value_hypothesis:
            "A governed data foundation unlocks AI use cases across the health system.",
        },
      }),
    );
    // The legacy healthcare alias fires on this text (member + service, AI +
    // member) and would otherwise bind the contact-centre pack.
    expect(result.kind).toBe("declared_archetype");
  });

  it("lets a persisted functionPackKey outrank an archetype declaration", () => {
    const result = resolvePhaseIntelligenceFunctionBinding(
      move({
        charter: DECLARED_CHARTER,
        functionPackKey: "member_service_agent_assist",
      }),
    );
    expect(result.kind).toBe("bound");
  });

  it("treats no storable program_archetype value as a declaration", () => {
    for (const archetype of STORABLE_PROGRAM_ARCHETYPES) {
      expect(declaredArchetypeForBinding(move({ archetype }))).toBeNull();
    }
  });

  it("still classifies a legacy Move that declares nothing recognisable", () => {
    const result = resolvePhaseIntelligenceFunctionBinding(
      move({
        name: "Member Service Agent Assist",
        charter: {
          problem_statement:
            "Member contact centre agents hunt across systems on every call.",
          value_hypothesis: "AI agent assist cuts handle time.",
        },
      }),
    );
    expect(result.kind).toBe("bound");
    if (result.kind !== "bound") throw new Error("expected bound");
    expect(result.identity.functionKey).toBe("member_service_agent_assist");
    expect(result.source).toBe("deterministic classifier fallback");
  });

  it("still falls back to the legacy healthcare alias when the classifier abstains", () => {
    const legacy: PhaseIntelligenceBindingInput = {
      displayCode: null,
      name: "Contact experience",
      archetype: null,
      phaseLabel: null,
      functionPackKey: null,
      charter: null,
      status: undefined,
      tenant: { name: null, industryCode: "healthcare_idn" },
    };
    // Proven, not assumed: the deterministic classifier abstains on this exact
    // brief, so only the legacy healthcare alias can bind it. This is the case
    // that fails if the alias arm is dropped — every longer legacy name is
    // already covered by the classifier.
    expect(
      classifyFunctionKey(
        "healthcare-provider",
        buildMoveFunctionBriefText(legacy),
      ),
    ).toBeNull();

    const result = resolvePhaseIntelligenceFunctionBinding(legacy);
    expect(result.kind).toBe("bound");
    if (result.kind !== "bound") throw new Error("expected bound");
    expect(result.identity.functionKey).toBe("member_service_agent_assist");
    expect(result.confidence).toBe(0.95);
  });

  it("is unbound when the tenant industry maps to no pack coverage", () => {
    const result = resolvePhaseIntelligenceFunctionBinding(
      move({ tenant: { name: "Demo Air", industryCode: "not_an_industry" } }),
    );
    expect(result.kind).toBe("unbound");
  });
});
