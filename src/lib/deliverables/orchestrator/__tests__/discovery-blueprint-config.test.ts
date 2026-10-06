import { resolveArchetypeCatalogEntry } from "../briefs/archetype-identity";
import {
  loadDiscoveryBlueprintCatalog,
  validateBuiltInDiscoveryBlueprintCatalog,
  DiscoveryBlueprintSchema,
  DISCOVERY_BLUEPRINT_CATALOG,
  SHARED_EVIDENCE_FAMILIES,
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
      expect((catalog as Record<string, unknown>)[inherited]).toBeUndefined();
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

describe("a configured archetype may reference a library family", () => {
  const withFamilies = (evidenceFamilies: unknown[]) => ({
    ...VALID_CONFIG_BLUEPRINT,
    evidenceFamilies,
  });

  const seedIds = () => Object.keys(DISCOVERY_BLUEPRINT_CATALOG).sort();

  it("resolves a bare reference to the library's canonical family", () => {
    const { catalog, applied, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ ref: "kpi_baseline" }]),
    ]);

    expect(errors).toEqual([]);
    expect(applied).toEqual(["manufacturing_quality_ops"]);
    expect(catalog.manufacturing_quality_ops.evidenceFamilies).toEqual([
      SHARED_EVIDENCE_FAMILIES.kpi_baseline,
    ]);
  });

  it("applies the fields a reference restates, and keeps the referenced id", () => {
    const { catalog, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([
        {
          ref: "kpi_baseline",
          likelySource: "Plant analytics",
          required: false,
        },
      ]),
    ]);

    expect(errors).toEqual([]);
    const [family] = catalog.manufacturing_quality_ops.evidenceFamilies;
    expect(family.id).toBe("kpi_baseline");
    expect(family.likelySource).toBe("Plant analytics");
    expect(family.required).toBe(false);
    // untouched fields still come from the library
    expect(family.label).toBe(SHARED_EVIDENCE_FAMILIES.kpi_baseline.label);
    expect(family.grounds).toBe(SHARED_EVIDENCE_FAMILIES.kpi_baseline.grounds);
  });

  it("composes references and fully-written families in declared order", () => {
    const own = VALID_CONFIG_BLUEPRINT.evidenceFamilies[0];
    const { catalog, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ ref: "cost_baseline" }, own, { ref: "kpi_baseline" }]),
    ]);

    expect(errors).toEqual([]);
    expect(
      catalog.manufacturing_quality_ops.evidenceFamilies.map((f) => f.id),
    ).toEqual(["cost_baseline", "line_quality_data", "kpi_baseline"]);
  });

  it("stores concrete families, so no consumer sees a reference", () => {
    const { catalog } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ ref: "kpi_baseline" }]),
    ]);

    for (const family of catalog.manufacturing_quality_ops.evidenceFamilies) {
      expect(Object.keys(family).sort()).toEqual([
        "format",
        "grounds",
        "id",
        "label",
        "likelySource",
        "required",
      ]);
    }
  });

  it("rejects the source WHOLE when a reference names no library family", () => {
    const { catalog, applied, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ ref: "kpi_basline" }]),
    ]);

    expect(applied).toEqual([]);
    expect(errors).toEqual([
      '0.evidenceFamilies[0]: unknown shared family "kpi_basline"',
    ]);
    expect(Object.keys(catalog).sort()).toEqual(seedIds());
  });

  it("rejects the whole source when one archetype of several fails to compose", () => {
    const { catalog, applied, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ ref: "kpi_baseline" }]),
      {
        ...VALID_CONFIG_BLUEPRINT,
        blueprintId: "port_turnaround",
        evidenceFamilies: [{ ref: "no_such_family" }],
      },
    ]);

    expect(applied).toEqual([]);
    expect(errors).toEqual([
      '1.evidenceFamilies[0]: unknown shared family "no_such_family"',
    ]);
    expect(catalog.manufacturing_quality_ops).toBeUndefined();
    expect(Object.keys(catalog).sort()).toEqual(seedIds());
  });

  // A `ref` is an identity the same way a declared `id` is, so it carries the
  // same refusal: these index an inherited `Object.prototype` member, which is
  // truthy and is not a family.
  for (const unusable of ["__proto__", "constructor", "prototype"]) {
    it(`rejects a reference to \`${unusable}\``, () => {
      const { applied, errors } = loadDiscoveryBlueprintCatalog([
        withFamilies([{ ref: unusable }]),
      ]);

      expect(applied).toEqual([]);
      expect(errors.join(" ")).toContain("__proto__, constructor, prototype");
    });
  }

  it("refuses a spec that names both a reference and an id", () => {
    // Without the refusal this parses as a fully-written family under the
    // declared id and the `ref` is stripped in silence: the author's overrides
    // land on a family that borrows nothing from the library they named.
    const { applied, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([
        {
          ref: "kpi_baseline",
          id: "plant_kpi_baseline",
          label: "Plant KPI baseline",
          grounds: "Value Model",
          required: true,
          likelySource: "Plant analytics",
          format: "XLSX",
        },
      ]),
    ]);

    expect(applied).toEqual([]);
    expect(errors.join(" ")).toContain("not both");
  });

  it("refuses an override a reference spells wrong, rather than dropping it", () => {
    const { applied, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ ref: "kpi_baseline", liklySource: "Plant analytics" }]),
    ]);

    expect(applied).toEqual([]);
    expect(errors.join(" ")).toContain("liklySource");
  });

  it("counts a reference as the identity it declares, for uniqueness", () => {
    const { applied, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ ref: "kpi_baseline" }, { ref: "kpi_baseline" }]),
    ]);

    expect(applied).toEqual([]);
    expect(errors.join(" ")).toContain("unique within a blueprint");
  });

  it("still reports a malformed written-out family at its own field", () => {
    // The guard on dispatching instead of parsing a union: a union reports
    // `invalid_union: Invalid input` with no field and no reason whenever both
    // branches fail with more than one issue, which is the case an operator
    // most needs the message for.
    const { applied, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ id: "Line Quality Data", label: "" }]),
    ]);

    expect(applied).toEqual([]);
    expect(errors.join(" ")).toContain("family id must be snake_case");
    // Every issue is attributed to a FIELD of the family, never to the family
    // as a whole. A union reports one issue at `0.evidenceFamilies.0` reading
    // `Invalid input`, which names neither.
    for (const error of errors) {
      expect(error).toMatch(/^0\.evidenceFamilies\.0\.[a-zA-Z]+: /);
    }
  });

  it("refuses an evidence family that is not an object at all", () => {
    const { applied, errors } = loadDiscoveryBlueprintCatalog([
      withFamilies(["kpi_baseline"]),
    ]);

    expect(applied).toEqual([]);
    expect(errors.join(" ")).toContain("must be an object");
  });

  it("a referencing archetype is reachable by declaration like any other", () => {
    // The point of composing here rather than downstream: once the catalog is
    // built, nothing distinguishes a referenced family from a written one, so
    // a configured archetype resolves through the one identity rule both
    // archetype catalogs share.
    const { catalog } = loadDiscoveryBlueprintCatalog([
      withFamilies([{ ref: "kpi_baseline" }, { ref: "cost_baseline" }]),
    ]);

    for (const declared of [
      "manufacturing_quality_ops",
      "Manufacturing Quality Ops",
      "manufacturing-quality-ops",
    ]) {
      expect(
        resolveArchetypeCatalogEntry(catalog, declared)?.evidenceFamilies.map(
          (family) => family.id,
        ),
      ).toEqual(["kpi_baseline", "cost_baseline"]);
    }
  });
});
