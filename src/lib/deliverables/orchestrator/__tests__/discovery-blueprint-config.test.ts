import {
  loadDiscoveryBlueprintCatalog,
  validateBuiltInDiscoveryBlueprintCatalog,
  DiscoveryBlueprintSchema,
  DISCOVERY_BLUEPRINT_CATALOG,
} from "../briefs/discovery-blueprint";

const VALID_CONFIG_BLUEPRINT = {
  blueprintId: "manufacturing_quality_ops",
  blueprintVersion: "2026-10-05",
  archetypeLabel: "Manufacturing Quality Operations",
  suggestionKeywords: ["manufacturing", "quality", "defect"],
  evidenceFamilies: [
    {
      id: "line_quality_data",
      label: "Line quality data",
      grounds: "Current-State",
      required: true,
      likelySource: "Operations",
      format: "CSV",
    },
  ],
  interviewRoster: [
    {
      role: "Plant manager",
      side: "business",
      objectives: "Throughput + quality",
      questions: ["Where do defects cluster?"],
    },
  ],
};

describe("discovery blueprint config contract (Phase 2)", () => {
  it("the built-in seed satisfies the schema", () => {
    expect(validateBuiltInDiscoveryBlueprintCatalog()).toEqual([]);
    for (const bp of Object.values(DISCOVERY_BLUEPRINT_CATALOG)) {
      expect(DiscoveryBlueprintSchema.safeParse(bp).success).toBe(true);
    }
  });

  it("returns the seed unchanged when no config is supplied", () => {
    const { catalog, applied, errors } = loadDiscoveryBlueprintCatalog();
    expect(errors).toEqual([]);
    expect(applied).toEqual([]);
    expect(Object.keys(catalog).sort()).toEqual(
      Object.keys(DISCOVERY_BLUEPRINT_CATALOG).sort(),
    );
  });

  it("overlays a valid configured archetype onto the seed", () => {
    const { catalog, applied, errors } = loadDiscoveryBlueprintCatalog([
      VALID_CONFIG_BLUEPRINT,
    ]);
    expect(errors).toEqual([]);
    expect(applied).toEqual(["manufacturing_quality_ops"]);
    expect(catalog.manufacturing_quality_ops?.archetypeLabel).toBe(
      "Manufacturing Quality Operations",
    );
    // seed archetypes still present
    expect(catalog.governed_data_foundation).toBeDefined();
  });

  it("lets a configured entry override a seed archetype by id", () => {
    const override = {
      ...VALID_CONFIG_BLUEPRINT,
      blueprintId: "governed_data_foundation",
      archetypeLabel: "Governed Data Foundation (client override)",
    };
    const { catalog } = loadDiscoveryBlueprintCatalog([override]);
    expect(catalog.governed_data_foundation.archetypeLabel).toBe(
      "Governed Data Foundation (client override)",
    );
  });

  it("rejects an invalid configured source WHOLE and preserves the seed", () => {
    const bad = [{ ...VALID_CONFIG_BLUEPRINT, blueprintId: "Not Snake Case" }];
    const { catalog, applied, errors } = loadDiscoveryBlueprintCatalog(bad);
    expect(errors.length).toBeGreaterThan(0);
    expect(applied).toEqual([]);
    // seed intact, bad entry not applied
    expect(catalog["Not Snake Case"]).toBeUndefined();
    expect(Object.keys(catalog).sort()).toEqual(
      Object.keys(DISCOVERY_BLUEPRINT_CATALOG).sort(),
    );
  });

  it("enforces unique family ids within a blueprint", () => {
    const dupFamilies = {
      ...VALID_CONFIG_BLUEPRINT,
      evidenceFamilies: [
        VALID_CONFIG_BLUEPRINT.evidenceFamilies[0],
        VALID_CONFIG_BLUEPRINT.evidenceFamilies[0],
      ],
    };
    expect(DiscoveryBlueprintSchema.safeParse(dupFamilies).success).toBe(false);
  });
});
