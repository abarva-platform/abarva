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

describe("a configured id must be an id the catalog can hold", () => {
  const withBlueprintId = (blueprintId: string) => ({
    ...VALID_CONFIG_BLUEPRINT,
    blueprintId,
  });

  // `__proto__` is the dangerous one: on an ordinary object it is a setter, so
  // `catalog[id] = blueprint` would change the catalog's prototype and add no
  // entry, while `applied` still named it. `constructor` and `prototype` read
  // back as inherited built-ins. All three match the snake_case id regex.
  for (const unusable of ["__proto__", "constructor", "prototype"]) {
    it(`rejects a configured source whose blueprintId is \`${unusable}\``, () => {
      const seedIds = Object.keys(DISCOVERY_BLUEPRINT_CATALOG).sort();
      const { catalog, applied, errors } = loadDiscoveryBlueprintCatalog([
        withBlueprintId(unusable),
      ]);

      expect(applied).toEqual([]);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join(" ")).toContain("__proto__, constructor, prototype");
      // rejected whole: the seed is returned untouched
      expect(Object.keys(catalog).sort()).toEqual(seedIds);
    });

    it(`rejects a configured evidence family id of \`${unusable}\``, () => {
      const { applied, errors } = loadDiscoveryBlueprintCatalog([
        {
          ...VALID_CONFIG_BLUEPRINT,
          evidenceFamilies: [
            { ...VALID_CONFIG_BLUEPRINT.evidenceFamilies[0], id: unusable },
          ],
        },
      ]);

      expect(applied).toEqual([]);
      expect(errors.join(" ")).toContain("__proto__, constructor, prototype");
    });
  }

  it("still accepts a snake_case id that merely contains a reserved word", () => {
    const { applied, errors } = loadDiscoveryBlueprintCatalog([
      withBlueprintId("constructor_handover"),
    ]);

    expect(errors).toEqual([]);
    expect(applied).toEqual(["constructor_handover"]);
  });

  it("the effective catalog answers nothing it was not given", () => {
    const { catalog } = loadDiscoveryBlueprintCatalog([VALID_CONFIG_BLUEPRINT]);

    // An archetype lookup for an inherited member must come back empty rather
    // than handing a caller an Object.prototype member it would then spread as
    // if it were a blueprint.
    for (const inherited of [
      "constructor",
      "toString",
      "valueOf",
      "hasOwnProperty",
      "__proto__",
    ]) {
      expect(
        (catalog as Record<string, unknown>)[inherited],
      ).toBeUndefined();
    }
  });

  it("every applied id is an own key of the effective catalog", () => {
    const { catalog, applied } = loadDiscoveryBlueprintCatalog([
      VALID_CONFIG_BLUEPRINT,
    ]);

    expect(applied.length).toBeGreaterThan(0);
    for (const id of applied) {
      expect(Object.keys(catalog)).toContain(id);
    }
  });
});
