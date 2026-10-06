import {
  normalizeDiscoveryArchetypeDeclaration,
  withDeclaredDiscoveryArchetype,
} from "../discovery/discovery-archetype-declaration";
import {
  listDiscoveryArchetypeOptions,
  suggestDiscoveryArchetypes,
} from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import { resolveDeclaredProgramArchetypeId } from "@/lib/programs/discovery/evidence-readiness";

describe("discovery archetype declaration", () => {
  it("offers catalog options and only suggests from matching reference keywords", () => {
    expect(listDiscoveryArchetypeOptions()).toContainEqual({
      blueprintId: "governed_data_foundation",
      archetypeLabel: "Governed Data Foundation for AI / LLM Automation",
    });
    expect(
      suggestDiscoveryArchetypes(
        "Build a governed data foundation with a certified semantic layer and data lineage.",
      )[0],
    ).toMatchObject({ blueprintId: "governed_data_foundation" });
  });

  it("keeps the legacy Move classification unchanged when no choice is made", () => {
    const legacyClassification = {
      function_code: "data_platform",
      objective_code: "modernize",
      topic_code: "governance",
    };

    expect(withDeclaredDiscoveryArchetype(legacyClassification, null)).toEqual(
      legacyClassification,
    );
    expect(normalizeDiscoveryArchetypeDeclaration(undefined)).toBeNull();
  });

  it("stores a validated human declaration without replacing existing identity", () => {
    const legacyClassification = {
      function_code: "data_platform",
      objective_code: "modernize",
      topic_code: "governance",
    };

    expect(
      withDeclaredDiscoveryArchetype(
        legacyClassification,
        "governed_data_foundation",
      ),
    ).toEqual({
      ...legacyClassification,
      archetype: "governed_data_foundation",
      archetype_source: "human_declared_at_origination",
    });
    expect(() =>
      normalizeDiscoveryArchetypeDeclaration("not-a-catalog-entry"),
    ).toThrow("unknown_discovery_archetype");
  });

  it("feeds the separate declaration to the resolver without replacing phase identity", () => {
    const classification = withDeclaredDiscoveryArchetype(
      { function_code: "data_platform" },
      "governed_data_foundation",
    );

    expect(
      resolveDeclaredProgramArchetypeId({
        archetype: "ai_operations_customer_digital",
        functionPackKey: "data_platform_function_pack",
        charter: { classification },
      }),
    ).toBe("governed_data_foundation");
  });
});
