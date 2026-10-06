import {
  ARCHETYPE_PACKS,
  ArchetypePackSchema,
  ArchetypePackCatalogSchema,
  UNKNOWN_EVIDENCE_FAMILY_MESSAGE,
  loadArchetypePackCatalog,
  validateBuiltInArchetypePackCatalog,
} from "../briefs/archetype-packs";
import {
  PACK_EVIDENCE_FAMILY_VOCABULARY,
  evidenceFamilyVocabularyOverlap,
  isDeclaredPackEvidenceFamily,
  nearestDeclaredPackEvidenceFamily,
  unknownPackEvidenceFamilies,
} from "../briefs/evidence-family-vocabulary";

const VALID_CONFIG_PACK = {
  archetype: "MANUFACTURING_QUALITY_OPS",
  label: "manufacturing quality operations",
  keyEvidenceFamilies: ["line_quality_data", "scrap_rework_cost"],
  // Neither family is in the shipped vocabulary, because this archetype is not
  // one AbarVa ships. Declaring them is how a configured archetype brings
  // evidence of its own — and the reason a typo is now distinguishable from it.
  declaresEvidenceFamilies: ["line_quality_data", "scrap_rework_cost"],
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
    expect(ArchetypePackCatalogSchema.safeParse(duplicated).success).toBe(
      false,
    );
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
      exhibits: [
        { ...VALID_CONFIG_PACK.exhibits[0], preferredFormat: "keynote" },
      ],
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

const seedPackFamilies = () => {
  const named = new Set<string>();
  for (const pack of Object.values(ARCHETYPE_PACKS)) {
    for (const familyId of pack.keyEvidenceFamilies) named.add(familyId);
  }
  return [...named].sort();
};

describe("the pack half's declared evidence-family vocabulary", () => {
  it("declares exactly the families the built-in packs name", () => {
    // Both directions on purpose. A seed family missing from the vocabulary
    // would make the shipped catalog fail its own contract; a vocabulary entry
    // no pack names would be a family nothing can ask for, and neither is
    // visible from one direction alone.
    expect(Object.keys(PACK_EVIDENCE_FAMILY_VOCABULARY).sort()).toEqual(
      seedPackFamilies(),
    );
  });

  it("files every family under the id it declares, in lower_snake", () => {
    for (const [key, family] of Object.entries(
      PACK_EVIDENCE_FAMILY_VOCABULARY,
    )) {
      expect(family.id).toBe(key);
      expect(key).toMatch(/^[a-z0-9_]+$/);
      expect(family.label.length).toBeGreaterThan(0);
      expect(family.grounds.length).toBeGreaterThan(0);
    }
  });

  it("gives the pack half the label it never had", () => {
    // A pack names its families as bare ids; nothing in that catalog says what
    // one IS. These labels are the only place that now lives.
    const labels = Object.values(PACK_EVIDENCE_FAMILY_VOCABULARY).map(
      (family) => family.label,
    );
    expect(new Set(labels).size).toBe(labels.length);
    for (const family of Object.values(PACK_EVIDENCE_FAMILY_VOCABULARY)) {
      expect(family.label).not.toBe(family.id);
    }
  });

  it("answers only ids it declares, not inherited object members", () => {
    expect(isDeclaredPackEvidenceFamily("application_inventory")).toBe(true);
    // The vocabulary is an object literal, so `"constructor" in vocab` is true.
    // A pack naming `constructor` must still be refused.
    expect(isDeclaredPackEvidenceFamily("constructor")).toBe(false);
    expect(isDeclaredPackEvidenceFamily("toString")).toBe(false);
    expect(isDeclaredPackEvidenceFamily("__proto__")).toBe(false);
  });

  it("names the unknown families in the order they were named, once each", () => {
    expect(
      unknownPackEvidenceFamilies([
        "application_inventory",
        "zz_unheard_of",
        "sla_baseline",
        "aa_also_unheard_of",
        "zz_unheard_of",
      ]),
    ).toEqual(["zz_unheard_of", "aa_also_unheard_of"]);
  });

  it("treats a family the caller declares as known", () => {
    expect(
      unknownPackEvidenceFamilies(["line_quality_data"], ["line_quality_data"]),
    ).toEqual([]);
    // ...and only that one: the hatch is per id, not a blanket.
    expect(
      unknownPackEvidenceFamilies(
        ["line_quality_data", "scrap_rework_cost"],
        ["line_quality_data"],
      ),
    ).toEqual(["scrap_rework_cost"]);
  });

  it("suggests the near-miss and stays quiet about a genuinely new family", () => {
    expect(nearestDeclaredPackEvidenceFamily("aplication_inventory")).toBe(
      "application_inventory",
    );
    expect(nearestDeclaredPackEvidenceFamily("sla_baselin")).toBe(
      "sla_baseline",
    );
    // A family that is simply not in this vocabulary is not a misspelling of
    // anything, and guessing at one would send the author to the wrong family.
    expect(
      nearestDeclaredPackEvidenceFamily("line_quality_data"),
    ).toBeUndefined();
    expect(
      nearestDeclaredPackEvidenceFamily("scrap_rework_cost"),
    ).toBeUndefined();
  });
});

describe("a pack may only name an evidence family something declares", () => {
  it("refuses a misspelled family and names what it probably meant", () => {
    const pack = {
      ...VALID_CONFIG_PACK,
      keyEvidenceFamilies: ["aplication_inventory"],
      declaresEvidenceFamilies: undefined,
    };
    const parsed = ArchetypePackSchema.safeParse(pack);
    expect(parsed.success).toBe(false);
    const issue = parsed.error!.issues[0];
    expect(issue.message).toContain(UNKNOWN_EVIDENCE_FAMILY_MESSAGE);
    expect(issue.message).toContain("aplication_inventory");
    expect(issue.message).toContain("did you mean application_inventory");
    // the path points at the offending entry, not at the array
    expect(issue.path).toEqual(["keyEvidenceFamilies", 0]);
  });

  it("points at the right entry when a later family is the unknown one", () => {
    const parsed = ArchetypePackSchema.safeParse({
      ...VALID_CONFIG_PACK,
      keyEvidenceFamilies: ["application_inventory", "sla_baselin"],
      declaresEvidenceFamilies: undefined,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error!.issues[0].path).toEqual(["keyEvidenceFamilies", 1]);
  });

  it("accepts a configured archetype that declares the families it brings", () => {
    expect(ArchetypePackSchema.safeParse(VALID_CONFIG_PACK).success).toBe(true);
  });

  it("still refuses the families the pack did NOT declare", () => {
    const parsed = ArchetypePackSchema.safeParse({
      ...VALID_CONFIG_PACK,
      keyEvidenceFamilies: ["line_quality_data", "scrap_rework_cost"],
      declaresEvidenceFamilies: ["line_quality_data"],
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error!.issues[0].message).toContain("scrap_rework_cost");
    expect(parsed.error!.issues).toHaveLength(1);
  });

  it("refuses a declared family id that is not lower_snake", () => {
    // The declared list is the one place an id is vouched for by nothing else,
    // so its spelling is checked here rather than where a pack merely names it.
    for (const badId of [
      "Line Quality Data",
      "lineQualityData",
      "LINE_QUALITY",
    ]) {
      const parsed = ArchetypePackSchema.safeParse({
        ...VALID_CONFIG_PACK,
        keyEvidenceFamilies: [badId],
        declaresEvidenceFamilies: [badId],
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("accepts an override that keeps the shipped archetype's families", () => {
    // The vocabulary is built from the built-in packs, so overriding a shipped
    // archetype never requires declaring anything.
    const shipped = ARCHETYPE_PACKS.AMS_IT_OUTSOURCING;
    const parsed = ArchetypePackSchema.safeParse({
      ...VALID_CONFIG_PACK,
      archetype: "AMS_IT_OUTSOURCING",
      keyEvidenceFamilies: [...shipped.keyEvidenceFamilies],
      declaresEvidenceFamilies: undefined,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects the whole configured source when one family is unknown", () => {
    const { catalog, applied, errors } = loadArchetypePackCatalog([
      VALID_CONFIG_PACK,
      {
        ...VALID_CONFIG_PACK,
        archetype: "FIELD_SERVICE_OPS",
        keyEvidenceFamilies: ["aplication_inventory"],
        declaresEvidenceFamilies: undefined,
      },
    ]);
    expect(applied).toEqual([]);
    expect(errors.join(" ")).toContain(UNKNOWN_EVIDENCE_FAMILY_MESSAGE);
    // including the valid entry — a config is applied whole or not at all
    expect(catalog.MANUFACTURING_QUALITY_OPS).toBeUndefined();
    expect(catalog.FIELD_SERVICE_OPS).toBeUndefined();
    expect(Object.keys(catalog).sort()).toEqual(seedIds());
  });

  it("refuses an inherited object member named as a family", () => {
    const parsed = ArchetypePackSchema.safeParse({
      ...VALID_CONFIG_PACK,
      keyEvidenceFamilies: ["constructor"],
      declaresEvidenceFamilies: undefined,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("the two halves' evidence-family id spaces, as measured", () => {
  it("partitions the pack vocabulary into shared and pack-only", () => {
    const { packOnly, shared, discoveryOnly } =
      evidenceFamilyVocabularyOverlap();
    expect([...packOnly, ...shared].sort()).toEqual(
      Object.keys(PACK_EVIDENCE_FAMILY_VOCABULARY).sort(),
    );
    for (const list of [packOnly, shared, discoveryOnly]) {
      expect(list).toEqual([...list].sort());
    }
    expect(packOnly.filter((id) => shared.includes(id))).toEqual([]);
    expect(discoveryOnly.filter((id) => shared.includes(id))).toEqual([]);
  });

  it("finds the two halves fully disjoint today", () => {
    // A deliberate tripwire, not an invariant. A Move resolves BOTH catalogs
    // off one declared archetype, and today they ask for evidence under two
    // vocabularies with nothing in common — so the same underlying evidence is
    // requested twice under two names, and neither half can tell. Which
    // families the halves should share is a product decision; when it is taken
    // this case should fail and be updated to the new number, rather than the
    // disjointness quietly persisting as a sentence in a gap list.
    const { shared, packOnly, discoveryOnly } =
      evidenceFamilyVocabularyOverlap();
    expect(shared).toEqual([]);
    expect(packOnly.length).toBe(
      Object.keys(PACK_EVIDENCE_FAMILY_VOCABULARY).length,
    );
    expect(discoveryOnly.length).toBeGreaterThan(packOnly.length);
  });
});
