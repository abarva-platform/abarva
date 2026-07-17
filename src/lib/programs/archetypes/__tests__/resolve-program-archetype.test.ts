import {
  resolveProgramArchetype,
  getArchetype,
  DEFAULT_ARCHETYPE_ID,
  AI_OPERATIONS_DECISION_SUPPORT,
  AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
  IT_SOURCING_EVENT,
} from "../registry";

describe("resolveProgramArchetype — per-Move archetype resolution", () => {
  it("routes an IROPS move name to the operations decision-support archetype", () => {
    const a = resolveProgramArchetype({
      archetype: "operational_optimization",
      classification: null,
      name: "IROPS Recovery Decision Support",
    });
    expect(a.id).toBe("AI_OPERATIONS_DECISION_SUPPORT");
  });

  it("routes operations/disruption language to the operations archetype", () => {
    expect(
      resolveProgramArchetype({ name: "Claims operations exception handling" })
        .id,
    ).toBe("AI_OPERATIONS_DECISION_SUPPORT");
    expect(
      resolveProgramArchetype({
        classification: "disruption recovery and re-accommodation",
      }).id,
    ).toBe("AI_OPERATIONS_DECISION_SUPPORT");
  });

  it("routes healthcare agent-assist origination text to operations even when the row archetype is product enablement", () => {
    expect(
      resolveProgramArchetype({
        archetype: "ai_product_enablement",
        classification:
          "Contact Center Agent Assist - AI-assisted member-service workflow for claims, benefits, eligibility, prior authorization, CRM, and knowledge lookup.",
        name: "Member Service Agent Assist",
      }).id,
    ).toBe("AI_OPERATIONS_DECISION_SUPPORT");
  });

  it("routes pdlc/sdlc/software language to AI-PDLC", () => {
    expect(resolveProgramArchetype({ name: "AI-led SDLC uplift" }).id).toBe(
      "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    );
    expect(
      resolveProgramArchetype({
        classification: "ai across product development",
      }).id,
    ).toBe("AI_PRODUCT_DEVELOPMENT_LIFECYCLE");
  });

  it("routes sourcing/vendor language to IT_SOURCING_EVENT", () => {
    expect(
      resolveProgramArchetype({ name: "AMS vendor renegotiation" }).id,
    ).toBe("IT_SOURCING_EVENT");
    expect(resolveProgramArchetype({ archetype: "it sourcing event" }).id).toBe(
      "IT_SOURCING_EVENT",
    );
  });

  it("sourcing signals win over operations signals (declared precedence)", () => {
    expect(
      resolveProgramArchetype({ name: "Sourcing event for operations tools" })
        .id,
    ).toBe("IT_SOURCING_EVENT");
  });

  it("an exact registry id resolves directly", () => {
    expect(
      resolveProgramArchetype({ archetype: "AI_OPERATIONS_DECISION_SUPPORT" })
        .id,
    ).toBe(AI_OPERATIONS_DECISION_SUPPORT.id);
    expect(
      resolveProgramArchetype({
        archetype: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
        name: "IROPS recovery", // exact id wins over heuristics
      }).id,
    ).toBe(AI_PRODUCT_DEVELOPMENT_LIFECYCLE.id);
  });

  it("unknown/empty input falls back to the AI-PDLC default (back-compat)", () => {
    expect(resolveProgramArchetype({}).id).toBe(DEFAULT_ARCHETYPE_ID);
    expect(
      resolveProgramArchetype({
        archetype: "strategic_transformation",
        classification: null,
        name: "Enterprise data platform",
      }).id,
    ).toBe(DEFAULT_ARCHETYPE_ID);
    expect(resolveProgramArchetype({ archetype: null, name: null }).id).toBe(
      DEFAULT_ARCHETYPE_ID,
    );
  });
});

describe("AI_OPERATIONS_DECISION_SUPPORT — registry shape", () => {
  it("is registered and resolvable by id", () => {
    expect(getArchetype("AI_OPERATIONS_DECISION_SUPPORT")?.name).toBe(
      "AI Operations Decision Support",
    );
  });

  it("does NOT require DORA or product/platform operating model", () => {
    const familyKeys = AI_OPERATIONS_DECISION_SUPPORT.evidenceFamilies.map(
      (f) => f.key,
    );
    expect(familyKeys).not.toContain("eng_performance_dora");
    expect(familyKeys).not.toContain("product_platform_operating_model");
    for (const phase of AI_OPERATIONS_DECISION_SUPPORT.phaseModel) {
      const required = phase.requiredEvidence.map((r) => r.family);
      expect(required).not.toContain("eng_performance_dora");
      expect(required).not.toContain("product_platform_operating_model");
    }
  });

  it("requires the operations baselines hard at charter", () => {
    const charter = AI_OPERATIONS_DECISION_SUPPORT.phaseModel.find(
      (p) => p.phase === "charter",
    )!;
    const bySeverity = Object.fromEntries(
      charter.requiredEvidence.map((r) => [r.family, r.severity]),
    );
    expect(bySeverity["ops_process_baseline"]).toBe("hard");
    expect(bySeverity["ops_event_cost_baseline"]).toBe("hard");
    expect(bySeverity["ops_change_readiness"]).toBe("soft");
  });

  it("every required family at every phase is declared in evidenceFamilies", () => {
    const declared = new Set(
      AI_OPERATIONS_DECISION_SUPPORT.evidenceFamilies.map((f) => f.key),
    );
    for (const phase of AI_OPERATIONS_DECISION_SUPPORT.phaseModel) {
      for (const r of phase.requiredEvidence) {
        expect(declared.has(r.family)).toBe(true);
      }
    }
  });

  it("reuses the AI-PDLC deliverable keys (routes look up by key)", () => {
    const pdlcKeys = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.deliverablePack
      .map((d) => d.key)
      .sort();
    const opsKeys = AI_OPERATIONS_DECISION_SUPPORT.deliverablePack
      .map((d) => d.key)
      .sort();
    expect(opsKeys).toEqual(pdlcKeys);
  });

  it("the sourcing archetype remains intact", () => {
    expect(IT_SOURCING_EVENT.id).toBe("IT_SOURCING_EVENT");
  });
});
