// A configured archetype source has to REACH generation, or "configure an
// archetype without shipping code" is only authorable, not true. These pin the
// supply end (what the environment declares, and what happens when it is
// wrong), the one override rule, and BOTH host call sites — the generic
// Discovery Plan builder and the Moves one, which resolve a blueprint
// separately and so can each go un-wired on its own.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getArtifactBrief } from "../artifact-brief-registry";
import {
  ARCHETYPE_CONFIG_PATH_ENV,
  ARCHETYPE_PACK_CONFIG_PATH_ENV,
  type ArchetypeConfigEnv,
  applyConfiguredBlueprintOverride,
  loadEffectiveArchetypePackCatalog,
  loadEffectiveDiscoveryBlueprintCatalog,
  readConfiguredArchetypePackSource,
  readConfiguredArchetypeSource,
  resolveConfiguredArchetypePack,
  resolveConfiguredDiscoveryBlueprint,
} from "../briefs/archetype-config-source";
import {
  ARCHETYPE_PACKS,
  getArchetypePack,
} from "../briefs/archetype-packs";
import {
  DISCOVERY_BLUEPRINT_CATALOG,
  getDiscoveryBlueprint,
  type DiscoveryBlueprint,
} from "../briefs/discovery-blueprint";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";

const OVERRIDDEN_ID = "governed_data_foundation";
const CONFIGURED_FAMILY_LABEL = "Configured evidence family for this practice";
const CONFIGURED_ROLE = "Configured practice lead";

function configuredOverride(): Record<string, unknown> {
  return {
    blueprintId: OVERRIDDEN_ID,
    blueprintVersion: "configured-1",
    archetypeLabel: "Configured Governed Data Foundation",
    evidenceFamilies: [
      {
        id: "configured_family",
        label: CONFIGURED_FAMILY_LABEL,
        grounds: "Current-State Assessment",
        required: true,
        likelySource: "Practice owner",
        format: "Doc",
      },
    ],
    interviewRoster: [
      {
        role: CONFIGURED_ROLE,
        side: "business",
        objectives: "Confirm the configured scope.",
        questions: ["What does this practice always ask first?"],
      },
    ],
  };
}

let tmpDir: string;

function writeSource(value: unknown): string {
  const file = path.join(tmpDir, `source-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(value), "utf8");
  return file;
}

function envWith(sourcePath: string): ArchetypeConfigEnv {
  return { [ARCHETYPE_CONFIG_PATH_ENV]: sourcePath };
}

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "archetype-config-"));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("the declared configured-archetype source", () => {
  it("is absent, not an error, when the environment declares nothing", () => {
    const source = readConfiguredArchetypeSource({});
    expect(source).toEqual({ sourcePath: null, raw: null, errors: [] });
  });

  it("treats a blank declaration as no declaration", () => {
    const source = readConfiguredArchetypeSource({
      [ARCHETYPE_CONFIG_PATH_ENV]: "   ",
    });
    expect(source.sourcePath).toBeNull();
    expect(source.errors).toEqual([]);
  });

  it("reads no file at all when nothing is declared", () => {
    const readFileSync = jest.spyOn(fs, "readFileSync");
    try {
      loadEffectiveDiscoveryBlueprintCatalog({});
      expect(readFileSync).not.toHaveBeenCalled();
    } finally {
      readFileSync.mockRestore();
    }
  });

  it("reports the declared path when it cannot be read", () => {
    const missing = path.join(tmpDir, "does-not-exist.json");
    const source = readConfiguredArchetypeSource(envWith(missing));
    expect(source.sourcePath).toBe(missing);
    expect(source.raw).toBeNull();
    expect(source.errors).toHaveLength(1);
    expect(source.errors[0]).toContain(ARCHETYPE_CONFIG_PATH_ENV);
    expect(source.errors[0]).toContain(missing);
  });

  it("reports the declared path when it is not JSON", () => {
    const file = path.join(tmpDir, "not-json.json");
    fs.writeFileSync(file, "{ not json", "utf8");
    const source = readConfiguredArchetypeSource(envWith(file));
    expect(source.raw).toBeNull();
    expect(source.errors[0]).toMatch(/not valid JSON/);
  });
});

describe("the effective catalog's reported state", () => {
  it("is not_configured, with the seed in force, when nothing is declared", () => {
    const effective = loadEffectiveDiscoveryBlueprintCatalog(
      {},
    );
    expect(effective.state).toBe("not_configured");
    expect(effective.sourcePath).toBeNull();
    expect(effective.applied).toEqual([]);
    expect(effective.catalog).toEqual({ ...DISCOVERY_BLUEPRINT_CATALOG });
  });

  it("is in_effect, and names what it applied, for a valid source", () => {
    const effective = loadEffectiveDiscoveryBlueprintCatalog(
      envWith(writeSource([configuredOverride()])),
    );
    expect(effective.state).toBe("in_effect");
    expect(effective.applied).toEqual([OVERRIDDEN_ID]);
    expect(effective.errors).toEqual([]);
    expect(effective.catalog[OVERRIDDEN_ID].archetypeLabel).toBe(
      "Configured Governed Data Foundation",
    );
  });

  // An unreadable source and an undeclared one both leave the seed in force, so
  // they are indistinguishable in generated output. Separating them is the only
  // way an operator can read a typo as a typo.
  it("is rejected, not not_configured, when a declared source is unreadable", () => {
    const effective = loadEffectiveDiscoveryBlueprintCatalog(
      envWith(path.join(tmpDir, "absent.json")),
    );
    expect(effective.state).toBe("rejected");
    expect(effective.sourcePath).not.toBeNull();
    expect(effective.errors).toHaveLength(1);
    expect(effective.catalog).toEqual({ ...DISCOVERY_BLUEPRINT_CATALOG });
  });

  it("is rejected, whole, when a declared source fails the contract", () => {
    const invalid = configuredOverride();
    delete invalid.interviewRoster;
    const effective = loadEffectiveDiscoveryBlueprintCatalog(
      envWith(writeSource([invalid])),
    );
    expect(effective.state).toBe("rejected");
    expect(effective.applied).toEqual([]);
    expect(effective.errors.length).toBeGreaterThan(0);
    expect(effective.catalog[OVERRIDDEN_ID]).toBe(
      DISCOVERY_BLUEPRINT_CATALOG[OVERRIDDEN_ID],
    );
  });
});

describe("the override rule", () => {
  it("replaces the blueprint resolution chose when the source names its id", () => {
    const seedResolved = getDiscoveryBlueprint(OVERRIDDEN_ID);
    expect(seedResolved.blueprintId).toBe(OVERRIDDEN_ID);

    const resolution = resolveConfiguredDiscoveryBlueprint(
      seedResolved,
      envWith(writeSource([configuredOverride()])),
    );
    expect(resolution.overrodeSeed).toBe(true);
    expect(resolution.state).toBe("in_effect");
    expect(resolution.blueprint.archetypeLabel).toBe(
      "Configured Governed Data Foundation",
    );
    expect(resolution.blueprint.evidenceFamilies.map((f) => f.label)).toEqual([
      CONFIGURED_FAMILY_LABEL,
    ]);
  });

  it("leaves a resolution the source does not name untouched", () => {
    const seedResolved = getDiscoveryBlueprint("AI_OPERATIONS_DECISION_SUPPORT");
    const resolution = resolveConfiguredDiscoveryBlueprint(
      seedResolved,
      envWith(writeSource([configuredOverride()])),
    );
    expect(resolution.overrodeSeed).toBe(false);
    expect(resolution.blueprint).toBe(seedResolved);
  });

  // Catalog membership is NOT the test. While the argument is one of the
  // catalog's own objects the two look equivalent, so the scenario has to be
  // the one that separates them: a blueprint assembled elsewhere that carries a
  // seed id. Keyed on membership, an unconfigured deployment silently replaces
  // it with the seed.
  it("leaves a non-seed blueprint carrying a seed id alone when nothing was applied", () => {
    const composed: DiscoveryBlueprint = {
      ...getDiscoveryBlueprint(OVERRIDDEN_ID),
      blueprintVersion: "composed-elsewhere",
    };
    expect(composed).not.toBe(DISCOVERY_BLUEPRINT_CATALOG[OVERRIDDEN_ID]);

    const overridden = applyConfiguredBlueprintOverride(composed, {
      catalog: { ...DISCOVERY_BLUEPRINT_CATALOG },
      applied: [],
      errors: [],
      sourcePath: null,
      state: "not_configured",
    });
    expect(overridden).toBe(composed);
    expect(overridden.blueprintVersion).toBe("composed-elsewhere");
  });

  it("falls back to the resolution when an applied id is absent from the catalog", () => {
    const seedResolved = getDiscoveryBlueprint(OVERRIDDEN_ID);
    const overridden = applyConfiguredBlueprintOverride(seedResolved, {
      catalog: {} as Record<string, DiscoveryBlueprint>,
      applied: [OVERRIDDEN_ID],
      errors: [],
      sourcePath: "/declared.json",
      state: "in_effect",
    });
    expect(overridden).toBe(seedResolved);
  });

  // The configured source may ADD an id, and the loader lists it as applied —
  // but reaching it BY DECLARATION needs resolution to run against the effective
  // catalog rather than the seed. This pins today's behaviour so the gap cannot
  // be mistaken for a working path.
  it("does not yet reach a newly ADDED archetype by declaration", () => {
    const added = { ...configuredOverride(), blueprintId: "configured_only" };
    const env = envWith(writeSource([added]));
    const effective = loadEffectiveDiscoveryBlueprintCatalog(env);
    expect(effective.applied).toEqual(["configured_only"]);

    const resolution = resolveConfiguredDiscoveryBlueprint(
      getDiscoveryBlueprint("configured_only"),
      env,
    );
    expect(resolution.blueprint.blueprintId).not.toBe("configured_only");
    expect(resolution.overrodeSeed).toBe(false);
  });
});

describe("both Discovery Plan hosts honour a configured source", () => {
  function req(
    deliverableModule: DeliverableIntelligenceRequest["module"],
  ): DeliverableIntelligenceRequest {
    return {
      ...amsRfpRequest(),
      module: deliverableModule,
      useCaseArchetype: OVERRIDDEN_ID,
      deliverableType: "discovery_plan",
    };
  }

  function briefText(brief: ReturnType<typeof getArtifactBrief>): string {
    return JSON.stringify(brief);
  }

  const originalEnvValue = process.env[ARCHETYPE_CONFIG_PATH_ENV];

  afterEach(() => {
    if (originalEnvValue === undefined) {
      delete process.env[ARCHETYPE_CONFIG_PATH_ENV];
    } else {
      process.env[ARCHETYPE_CONFIG_PATH_ENV] = originalEnvValue;
    }
  });

  // Hand-rebuilding the call sequence would test the callee and never the
  // caller: these go through the registry's own entry point with the
  // environment set, so deleting either wiring line fails a test.
  for (const deliverableModule of ["moves", "source"] as const) {
    it(`carries a configured override into the ${deliverableModule} Discovery Plan brief`, () => {
      const seedBrief = briefText(getArtifactBrief(req(deliverableModule)));
      expect(seedBrief).not.toContain(CONFIGURED_FAMILY_LABEL);
      expect(seedBrief).not.toContain(CONFIGURED_ROLE);

      process.env[ARCHETYPE_CONFIG_PATH_ENV] = writeSource([
        configuredOverride(),
      ]);
      const configuredBrief = briefText(
        getArtifactBrief(req(deliverableModule)),
      );
      expect(configuredBrief).toContain(CONFIGURED_FAMILY_LABEL);
      expect(configuredBrief).toContain(CONFIGURED_ROLE);
    });
  }
});

// ---------------------------------------------------------------------------
// The ARTIFACT-PACK half: exhibits, tables and the governance note.
//
// It shipped a contract and an overlay loader with neither end of the seam
// wired, so a valid configured pack validated and was then ignored — the live
// path resolved the frozen seed. These pin the supply end against the pack's
// OWN declared variable, both outcomes a configured entry can have, and the
// host, so the composed brief is what proves a configured pack reached
// generation.

const CONFIGURED_PACK_ARCHETYPE = "MANUFACTURING_QUALITY_OPS";
const CONFIGURED_EXHIBIT_TITLE = "Where Configured Defects Concentrate";
const CONFIGURED_TABLE_TITLE = "Configured Line Quality Baseline";
const CONFIGURED_PACK_FAMILY = "configured_line_quality_data";
const OVERRIDDEN_PACK_ARCHETYPE = "CLOUD_MODERNIZATION";

function configuredPack(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    archetype: CONFIGURED_PACK_ARCHETYPE,
    label: "configured quality operations",
    keyEvidenceFamilies: [CONFIGURED_PACK_FAMILY],
    // The family is this pack's own, so the pack has to declare it: a pack may
    // only NAME a family something declares. Omitting this is what the
    // "fails validation" case below leans on for a different field.
    declaresEvidenceFamilies: [CONFIGURED_PACK_FAMILY],
    exhibits: [
      {
        key: "configured_defect_pareto",
        title: CONFIGURED_EXHIBIT_TITLE,
        kind: "chart",
        purpose: "Show which lines carry the defect cost",
        preferredFormat: "pptx",
      },
    ],
    tables: [
      {
        key: "configured_line_quality_baseline",
        title: CONFIGURED_TABLE_TITLE,
        columns: ["Line", "Units", "Defect rate"],
        groundingMode: "governed_facts",
        moveToExcelIfWide: true,
      },
    ],
    ...overrides,
  };
}

function packEnvWith(sourcePath: string): ArchetypeConfigEnv {
  return { [ARCHETYPE_PACK_CONFIG_PATH_ENV]: sourcePath };
}

describe("the declared configured-pack source", () => {
  it("is absent, not an error, when the environment declares nothing", () => {
    expect(readConfiguredArchetypePackSource({})).toEqual({
      sourcePath: null,
      raw: null,
      errors: [],
    });
  });

  it("reads no file at all when nothing is declared", () => {
    const readFileSync = jest.spyOn(fs, "readFileSync");
    try {
      loadEffectiveArchetypePackCatalog({});
      expect(readFileSync).not.toHaveBeenCalled();
    } finally {
      readFileSync.mockRestore();
    }
  });

  // The two halves declare SEPARATE variables, and an operator holding both
  // paths needs the message to say which one was wrong. A reader wired to the
  // blueprint key would read the wrong path and report the wrong name.
  it("names its own variable, not the blueprint one, when the path is unreadable", () => {
    const missing = path.join(tmpDir, "no-pack-source.json");
    const source = readConfiguredArchetypePackSource(packEnvWith(missing));
    expect(source.sourcePath).toBe(missing);
    expect(source.errors).toHaveLength(1);
    expect(source.errors[0]).toContain(ARCHETYPE_PACK_CONFIG_PATH_ENV);
    expect(source.errors[0]).not.toContain(ARCHETYPE_CONFIG_PATH_ENV);
  });

  it("ignores a blueprint source declared at the blueprint variable", () => {
    const source = readConfiguredArchetypePackSource(
      envWith(writeSource([configuredOverride()])),
    );
    expect(source.sourcePath).toBeNull();
    expect(source.errors).toEqual([]);
  });

  it("reports the declared path when it is not JSON", () => {
    const file = path.join(tmpDir, "pack-not-json.json");
    fs.writeFileSync(file, "{ not json", "utf8");
    const effective = loadEffectiveArchetypePackCatalog(packEnvWith(file));
    expect(effective.state).toBe("rejected");
    expect(effective.errors[0]).toMatch(/not valid JSON/);
    expect(Object.keys(effective.catalog).sort()).toEqual(
      Object.keys(ARCHETYPE_PACKS).sort(),
    );
  });
});

describe("the effective pack catalog", () => {
  it("is not_configured, with the seed in force, when nothing is declared", () => {
    const effective = loadEffectiveArchetypePackCatalog({});
    expect(effective.state).toBe("not_configured");
    expect(effective.sourcePath).toBeNull();
    expect(effective.applied).toEqual([]);
    expect(Object.keys(effective.catalog).sort()).toEqual(
      Object.keys(ARCHETYPE_PACKS).sort(),
    );
  });

  it("reports an ADDED archetype as added", () => {
    const effective = loadEffectiveArchetypePackCatalog(
      packEnvWith(writeSource([configuredPack()])),
    );
    expect(effective.state).toBe("in_effect");
    expect(effective.applied).toEqual([
      { archetype: CONFIGURED_PACK_ARCHETYPE, outcome: "added" },
    ]);
    expect(effective.catalog[CONFIGURED_PACK_ARCHETYPE].exhibits[0].title).toBe(
      CONFIGURED_EXHIBIT_TITLE,
    );
  });

  it("reports a REPLACED shipped archetype as overrode", () => {
    const effective = loadEffectiveArchetypePackCatalog(
      packEnvWith(
        writeSource([
          configuredPack({ archetype: OVERRIDDEN_PACK_ARCHETYPE }),
        ]),
      ),
    );
    expect(effective.applied).toEqual([
      { archetype: OVERRIDDEN_PACK_ARCHETYPE, outcome: "overrode" },
    ]);
    expect(effective.catalog[OVERRIDDEN_PACK_ARCHETYPE].exhibits).toHaveLength(
      1,
    );
  });

  it("leaves the seed in force when the source fails validation", () => {
    const effective = loadEffectiveArchetypePackCatalog(
      packEnvWith(writeSource([configuredPack({ exhibits: [] })])),
    );
    expect(effective.state).toBe("rejected");
    expect(effective.errors.length).toBeGreaterThan(0);
    expect(effective.applied).toEqual([]);
    expect(effective.catalog[CONFIGURED_PACK_ARCHETYPE]).toBeUndefined();
  });
});

describe("resolving a declared archetype against the effective pack catalog", () => {
  it("answers what the built-in accessor answers when nothing is declared", () => {
    for (const archetype of Object.keys(ARCHETYPE_PACKS)) {
      const resolution = resolveConfiguredArchetypePack(archetype, {});
      expect(resolution.pack).toEqual(getArchetypePack(archetype));
      expect(resolution.origin).toBe("built_in");
      expect(resolution.appliedOutcome).toBeNull();
      expect(resolution.archetypeId).toBe(archetype);
    }
  });

  // This is the widening over the blueprint half, which can only override what
  // its own resolution already chose. Resolution here walks whichever catalog
  // it is handed, so a brand-new configured archetype is reachable BY
  // DECLARATION with no change to the resolver.
  it("reaches a newly ADDED archetype by declaration", () => {
    const resolution = resolveConfiguredArchetypePack(
      CONFIGURED_PACK_ARCHETYPE,
      packEnvWith(writeSource([configuredPack()])),
    );
    expect(resolution.origin).toBe("configured");
    expect(resolution.appliedOutcome).toBe("added");
    expect(resolution.pack?.exhibits[0].title).toBe(CONFIGURED_EXHIBIT_TITLE);
  });

  it("matches a declaration spelled any way the catalog's id normalizes to", () => {
    const env = packEnvWith(writeSource([configuredPack()]));
    for (const spelling of [
      "manufacturing_quality_ops",
      "manufacturing-quality-ops",
      "Manufacturing Quality Ops",
      CONFIGURED_PACK_ARCHETYPE,
    ]) {
      const resolution = resolveConfiguredArchetypePack(spelling, env);
      expect(resolution.archetypeId).toBe(CONFIGURED_PACK_ARCHETYPE);
      expect(resolution.origin).toBe("configured");
    }
  });

  // Origin is read off what the source reported APPLYING, not off comparing
  // the resolved pack with the seed. A configured entry that restates a
  // shipped pack field-for-field is indistinguishable by value, and an
  // operator told `built_in` for an archetype they configured cannot tell
  // whether their source was read at all.
  it("reports configured even when the entry restates the shipped pack", () => {
    const shipped = ARCHETYPE_PACKS[OVERRIDDEN_PACK_ARCHETYPE];
    const resolution = resolveConfiguredArchetypePack(
      OVERRIDDEN_PACK_ARCHETYPE,
      packEnvWith(writeSource([shipped])),
    );
    expect(resolution.pack).toEqual(shipped);
    expect(resolution.origin).toBe("configured");
    expect(resolution.appliedOutcome).toBe("overrode");
  });

  it("reports unresolved, with no pack, for a declaration nothing holds", () => {
    const resolution = resolveConfiguredArchetypePack(
      "NOT_AN_ARCHETYPE_ANYWHERE",
      {},
    );
    expect(resolution.pack).toBeUndefined();
    expect(resolution.archetypeId).toBeNull();
    expect(resolution.origin).toBe("unresolved");
  });

  it("never answers an inherited object member", () => {
    for (const key of ["constructor", "toString", "__proto__"]) {
      const resolution = resolveConfiguredArchetypePack(key, {});
      expect(resolution.pack).toBeUndefined();
      expect(resolution.origin).toBe("unresolved");
    }
  });

  it("carries the rejection state through to the caller", () => {
    const resolution = resolveConfiguredArchetypePack(
      OVERRIDDEN_PACK_ARCHETYPE,
      packEnvWith(writeSource([configuredPack({ tables: [] })])),
    );
    expect(resolution.state).toBe("rejected");
    expect(resolution.errors.length).toBeGreaterThan(0);
    // The seed still answers, so the Move still generates.
    expect(resolution.origin).toBe("built_in");
  });
});

describe("the composed brief honours a configured pack", () => {
  const originalPackEnvValue = process.env[ARCHETYPE_PACK_CONFIG_PATH_ENV];

  afterEach(() => {
    if (originalPackEnvValue === undefined) {
      delete process.env[ARCHETYPE_PACK_CONFIG_PATH_ENV];
    } else {
      process.env[ARCHETYPE_PACK_CONFIG_PATH_ENV] = originalPackEnvValue;
    }
  });

  function packReq(): DeliverableIntelligenceRequest {
    return {
      ...amsRfpRequest(),
      module: "moves",
      useCaseArchetype: OVERRIDDEN_PACK_ARCHETYPE,
      deliverableType: "discovery_report",
    };
  }

  // Through the registry's own entry point with the environment set, so
  // removing the wiring line in `composeBrief` fails this rather than passing
  // on a hand-rebuilt call sequence.
  it("carries a configured archetype's exhibits and tables into the brief", () => {
    const seedBrief = JSON.stringify(getArtifactBrief(packReq()));
    expect(seedBrief).not.toContain(CONFIGURED_EXHIBIT_TITLE);
    expect(seedBrief).not.toContain(CONFIGURED_TABLE_TITLE);

    process.env[ARCHETYPE_PACK_CONFIG_PATH_ENV] = writeSource([
      configuredPack({ archetype: OVERRIDDEN_PACK_ARCHETYPE }),
    ]);
    const configuredBrief = JSON.stringify(getArtifactBrief(packReq()));
    expect(configuredBrief).toContain(CONFIGURED_EXHIBIT_TITLE);
    expect(configuredBrief).toContain(CONFIGURED_TABLE_TITLE);
  });

  // Per SECTION, not merely "somewhere in the brief": the landing rule picks
  // the fact-asserting sections, and a configured pack's families reaching
  // every section would be a different defect that a presence check passes.
  it("carries a configured pack's evidence families to their landing sites", () => {
    const landingSites = (archetype: string): string[] => {
      process.env[ARCHETYPE_PACK_CONFIG_PATH_ENV] = writeSource([
        configuredPack({ archetype }),
      ]);
      return (getArtifactBrief(packReq())?.recommendedStructure ?? [])
        .filter((section) =>
          section.expectedEvidenceFamilies.includes(CONFIGURED_PACK_FAMILY),
        )
        .map((section) => section.key);
    };

    // Two sites, by the two different routes a landing site is reached:
    // `current_state` matches the inferred key-spelling rule, and
    // `maturity_gaps` is a site this structure DECLARES. Written out rather
    // than derived from the structure so a declaration going missing fails
    // here instead of quietly shrinking the expectation.
    expect(landingSites(OVERRIDDEN_PACK_ARCHETYPE)).toEqual([
      "current_state",
      "maturity_gaps",
    ]);
    // A configured pack the Move does not declare lands nothing.
    expect(landingSites(CONFIGURED_PACK_ARCHETYPE)).toEqual([]);
  });

  it("leaves the brief unchanged when the configured source is rejected", () => {
    const seedBrief = JSON.stringify(getArtifactBrief(packReq()));
    process.env[ARCHETYPE_PACK_CONFIG_PATH_ENV] = writeSource([
      configuredPack({ archetype: OVERRIDDEN_PACK_ARCHETYPE, label: "" }),
    ]);
    expect(JSON.stringify(getArtifactBrief(packReq()))).toBe(seedBrief);
  });
});
