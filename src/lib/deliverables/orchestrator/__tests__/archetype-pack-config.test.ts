import {
  ARCHETYPE_PACKS,
  ArchetypePackSchema,
  ArchetypePackCatalogSchema,
  loadArchetypePackCatalog,
  validateBuiltInArchetypePackCatalog,
} from "../briefs/archetype-packs";

const VALID_CONFIG_PACK = {
  archetype: "MANUFACTURING_QUALITY_OPS",
  label: "manufacturing quality operations",
  keyEvidenceFamilies: ["line_quality_data", "scrap_rework_cost"],
  exhibits: [
    {
      key: "defect_pareto",
      title: "Where Defects Concentrate",
      kind: "chart",
      purpose: "Show which lines and part families carry the defect cost",
      preferredFormat: "pptx",
    },
  ],
  tables: [
    {
      key: "line_quality_baseline",
      title: "Line Quality Baseline",
      columns: ["Line", "Units", "Defect rate", "Scrap cost"],
      groundingMode: "governed_facts",
      moveToExcelIfWide: true,
    },
  ],
};

const seedIds = () => Object.keys(ARCHETYPE_PACKS).sort();

describe("archetype pack config contract (Phase 4)", () => {
  it("the built-in seed satisfies the schema", () => {
    expect(validateBuiltInArchetypePackCatalog()).toEqual([]);
    for (const pack of Object.values(ARCHETYPE_PACKS)) {
      expect(ArchetypePackSchema.safeParse(pack).success).toBe(true);
    }
  });

  it("every seed pack is keyed by the archetype it declares", () => {
    // The loader decides added-vs-overrode by looking up the declared id in the
    // seed. A pack filed under a key other than its own `archetype` would make
    // an override read as an add.
    for (const [key, pack] of Object.entries(ARCHETYPE_PACKS)) {
      expect(pack.archetype).toBe(key);
    }
  });

  it("returns the seed unchanged when no config is supplied", () => {
    const { catalog, applied, errors } = loadArchetypePackCatalog();
    expect(errors).toEqual([]);
    expect(applied).toEqual([]);
    expect(Object.keys(catalog).sort()).toEqual(seedIds());
  });

  it("answers only ids it holds, not inherited object members", () => {
    const { catalog } = loadArchetypePackCatalog();
    // A spread copy of the seed would answer these with Object.prototype
    // members, which read as truthy entries to a caller treating a lookup as
    // "this archetype is configured".
    expect(catalog.constructor).toBeUndefined();
    expect(catalog.toString).toBeUndefined();
    expect("constructor" in catalog).toBe(false);
    // ...while the ids it really holds still resolve.
    expect(catalog.AMS_IT_OUTSOURCING?.archetype).toBe("AMS_IT_OUTSOURCING");
  });

  it("reports a new archetype as added", () => {
    const { catalog, applied, errors } = loadArchetypePackCatalog([
      VALID_CONFIG_PACK,
    ]);
    expect(errors).toEqual([]);
    expect(applied).toEqual([
      { archetype: "MANUFACTURING_QUALITY_OPS", outcome: "added" },
    ]);
    expect(catalog.MANUFACTURING_QUALITY_OPS?.label).toBe(
      "manufacturing quality operations",
    );
    expect(catalog.AMS_IT_OUTSOURCING).toBeDefined();
  });

  it("reports replacing a built-in archetype as overrode, not added", () => {
    const override = {
      ...VALID_CONFIG_PACK,
      archetype: "AMS_IT_OUTSOURCING",
      label: "application management services (client override)",
    };
    const { catalog, applied, errors } = loadArchetypePackCatalog([override]);
    expect(errors).toEqual([]);
    expect(applied).toEqual([
      { archetype: "AMS_IT_OUTSOURCING", outcome: "overrode" },
    ]);
    expect(catalog.AMS_IT_OUTSOURCING.label).toBe(
      "application management services (client override)",
    );
    // the shipped pack is gone, which is exactly why the outcome must say so
    expect(catalog.AMS_IT_OUTSOURCING.exhibits).toHaveLength(1);
  });

  it("names the outcome per entry, in source order", () => {
    const { applied, errors } = loadArchetypePackCatalog([
      VALID_CONFIG_PACK,
      {
        ...VALID_CONFIG_PACK,
        archetype: "ERP_SI_SELECTION",
        label: "ERP selection (client override)",
      },
      { ...VALID_CONFIG_PACK, archetype: "FIELD_SERVICE_OPS" },
    ]);
    expect(errors).toEqual([]);
    expect(applied).toEqual([
      { archetype: "MANUFACTURING_QUALITY_OPS", outcome: "added" },
      { archetype: "ERP_SI_SELECTION", outcome: "overrode" },
      { archetype: "FIELD_SERVICE_OPS", outcome: "added" },
    ]);
  });

  it("rejects an invalid configured source WHOLE and preserves the seed", () => {
    const { catalog, applied, errors } = loadArchetypePackCatalog([
      VALID_CONFIG_PACK,
      { ...VALID_CONFIG_PACK, archetype: "lower_snake_is_not_this_catalog" },
    ]);
    expect(errors.length).toBeGreaterThan(0);
    expect(applied).toEqual([]);
    // neither entry applied — including the valid one
    expect(catalog.MANUFACTURING_QUALITY_OPS).toBeUndefined();
    expect(catalog.lower_snake_is_not_this_catalog).toBeUndefined();
    expect(Object.keys(catalog).sort()).toEqual(seedIds());
  });

  it("rejects a source that declares the same archetype twice", () => {
    const duplicated = [
      { ...VALID_CONFIG_PACK, label: "first definition" },
      { ...VALID_CONFIG_PACK, label: "second definition" },
    ];
    expect(ArchetypePackCatalogSchema.safeParse(duplicated).success).toBe(false);
    const { catalog, applied, errors } = loadArchetypePackCatalog(duplicated);
    expect(applied).toEqual([]);
    expect(errors.join(" ")).toContain("same archetype twice");
    // not "the later one quietly won"
    expect(catalog.MANUFACTURING_QUALITY_OPS).toBeUndefined();
  });

  it("accepts the same two definitions once the ids differ", () => {
    // Pins that the rule above is about the id collision, not about two
    // entries sharing every other field.
    const { applied, errors } = loadArchetypePackCatalog([
      { ...VALID_CONFIG_PACK, label: "first definition" },
      {
        ...VALID_CONFIG_PACK,
        archetype: "FIELD_SERVICE_OPS",
        label: "second definition",
      },
    ]);
    expect(errors).toEqual([]);
    expect(applied.map((entry) => entry.archetype)).toEqual([
      "MANUFACTURING_QUALITY_OPS",
      "FIELD_SERVICE_OPS",
    ]);
  });

  it("rejects a repeated exhibit key within one pack", () => {
    const pack = {
      ...VALID_CONFIG_PACK,
      exhibits: [VALID_CONFIG_PACK.exhibits[0], VALID_CONFIG_PACK.exhibits[0]],
    };
    expect(ArchetypePackSchema.safeParse(pack).success).toBe(false);
  });

  it("accepts two exhibits that differ only by key", () => {
    const pack = {
      ...VALID_CONFIG_PACK,
      exhibits: [
        VALID_CONFIG_PACK.exhibits[0],
        { ...VALID_CONFIG_PACK.exhibits[0], key: "defect_trend" },
      ],
    };
    expect(ArchetypePackSchema.safeParse(pack).success).toBe(true);
  });

  it("rejects a repeated table key within one pack", () => {
    const pack = {
      ...VALID_CONFIG_PACK,
      tables: [VALID_CONFIG_PACK.tables[0], VALID_CONFIG_PACK.tables[0]],
    };
    expect(ArchetypePackSchema.safeParse(pack).success).toBe(false);
  });

  it("rejects a repeated evidence family within one pack", () => {
    const pack = {
      ...VALID_CONFIG_PACK,
      keyEvidenceFamilies: ["line_quality_data", "line_quality_data"],
    };
    expect(ArchetypePackSchema.safeParse(pack).success).toBe(false);
  });

  it("rejects an exhibit kind and an output format outside the union", () => {
    const badKind = {
      ...VALID_CONFIG_PACK,
      exhibits: [{ ...VALID_CONFIG_PACK.exhibits[0], kind: "infographic" }],
    };
    expect(ArchetypePackSchema.safeParse(badKind).success).toBe(false);
    const badFormat = {
      ...VALID_CONFIG_PACK,
      exhibits: [{ ...VALID_CONFIG_PACK.exhibits[0], preferredFormat: "keynote" }],
    };
    expect(ArchetypePackSchema.safeParse(badFormat).success).toBe(false);
  });

  it("requires a pack to carry at least one exhibit and one table", () => {
    expect(
      ArchetypePackSchema.safeParse({ ...VALID_CONFIG_PACK, exhibits: [] })
        .success,
    ).toBe(false);
    expect(
      ArchetypePackSchema.safeParse({ ...VALID_CONFIG_PACK, tables: [] })
        .success,
    ).toBe(false);
  });
});
