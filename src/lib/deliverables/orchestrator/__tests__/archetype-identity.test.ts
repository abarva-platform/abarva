// One identity rule for two archetype catalogs.
//
// `program.archetype` reaches the discovery blueprint catalog AND the artifact
// archetype packs from the same request field. The two catalogs are keyed in
// different conventions (lower_snake vs UPPER_SNAKE), so they must resolve a
// declaration the same way or a Move silently gets only half of what its
// archetype promises. Both read through `resolveArchetypeCatalogEntry`.
import { getArtifactBrief } from "../artifact-brief-registry";
import {
  normalizeArchetypeId,
  resolveArchetypeCatalogEntry,
} from "../briefs/archetype-identity";
import { ARCHETYPE_PACKS, getArchetypePack } from "../briefs/archetype-packs";
import {
  DISCOVERY_BLUEPRINT_CATALOG,
  getDiscoveryBlueprint,
  resolveDeclaredDiscoveryBlueprint,
} from "../briefs/discovery-blueprint";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";

/** Spellings of the same declaration a deployer may plausibly store. */
function spellings(id: string): string[] {
  const words = normalizeArchetypeId(id).split("_");
  return [
    id,
    id.toUpperCase(),
    id.toLowerCase(),
    words.join("_"),
    words.join("-"),
    words.join(" "),
    `  ${words.join(" ")}  `,
  ];
}

/** Keys inherited from Object.prototype — never catalog entries. */
const INHERITED_KEYS = [
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
];

describe("declared archetype identity resolves the same way in both catalogs", () => {
  it("resolves every archetype pack from every plausible spelling of its id", () => {
    for (const key of Object.keys(ARCHETYPE_PACKS)) {
      for (const spelling of spellings(key)) {
        const pack = getArchetypePack(spelling);
        expect(pack).toBeDefined();
        // the spelling must select THAT pack, not merely some pack
        expect(pack!.archetype).toBe(ARCHETYPE_PACKS[key].archetype);
      }
    }
  });

  it("resolves every discovery blueprint from every plausible spelling of its id", () => {
    for (const key of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
      for (const spelling of spellings(key)) {
        const blueprint = resolveDeclaredDiscoveryBlueprint(spelling);
        expect(blueprint).not.toBeNull();
        expect(blueprint!.blueprintId).toBe(
          DISCOVERY_BLUEPRINT_CATALOG[key].blueprintId,
        );
      }
    }
  });

  it("a lower_snake declaration reaches the UPPER_SNAKE-keyed pack catalog", () => {
    // The regression this file exists for: the pack catalog used a raw,
    // case-sensitive index, so the spelling convention the blueprint catalog
    // uses resolved nothing here and the Move lost its archetype exhibits.
    expect(getArchetypePack("cloud_modernization")?.archetype).toBe(
      "CLOUD_MODERNIZATION",
    );
    expect(getArchetypePack("cloud-modernization")?.archetype).toBe(
      "CLOUD_MODERNIZATION",
    );
    expect(getArchetypePack("Cloud Modernization")?.archetype).toBe(
      "CLOUD_MODERNIZATION",
    );
    // and the exact declared key keeps working
    expect(getArchetypePack("CLOUD_MODERNIZATION")?.archetype).toBe(
      "CLOUD_MODERNIZATION",
    );
  });
});

describe("an inherited Object.prototype key is not a catalog entry", () => {
  it.each(INHERITED_KEYS)("pack lookup of %s resolves nothing", (key) => {
    expect(getArchetypePack(key)).toBeUndefined();
  });

  it.each(INHERITED_KEYS)("blueprint lookup of %s resolves nothing", (key) => {
    expect(resolveDeclaredDiscoveryBlueprint(key)).toBeNull();
  });

  it("a declared 'constructor' falls through to inference, not to Object", () => {
    // Before the own-property guard this returned `Object` itself: truthy, so
    // declaration "won", and the caller read `.evidenceFamilies` off a
    // constructor function.
    const blueprint = getDiscoveryBlueprint("", "constructor");
    expect(typeof blueprint).toBe("object");
    expect(Object.keys(DISCOVERY_BLUEPRINT_CATALOG)).toContain(
      blueprint.blueprintId,
    );
    expect(Array.isArray(blueprint.evidenceFamilies)).toBe(true);
  });

  it("a brief still composes when the declared archetype is an inherited key", () => {
    // The live consequence: `composeBrief` spreads `pack.keyEvidenceFamilies`,
    // which threw on the non-pack a raw index returned.
    const brief = getArtifactBrief(
      amsRfpRequest({
        deliverableType: "current_state_assessment",
        useCaseArchetype: "constructor",
      }),
    );
    expect(brief).not.toBeNull();
    for (const section of brief!.recommendedStructure) {
      expect(Array.isArray(section.expectedEvidenceFamilies)).toBe(true);
    }
  });
});

describe("resolveArchetypeCatalogEntry declines rather than guessing", () => {
  const catalog = { known_thing: "hit", OTHER_THING: "other" } as const;

  it("returns null for nothing declared", () => {
    for (const declared of [null, undefined, "", "   "]) {
      expect(resolveArchetypeCatalogEntry(catalog, declared)).toBeNull();
    }
  });

  it("returns null for a declaration that names no entry", () => {
    expect(resolveArchetypeCatalogEntry(catalog, "unknown_thing")).toBeNull();
    expect(resolveArchetypeCatalogEntry(catalog, "known")).toBeNull();
    expect(resolveArchetypeCatalogEntry(catalog, "known thing extra")).toBeNull();
  });

  it("does not let a multi-word inference blob match a pack", () => {
    // What makes normalizing safe: inference text is a sentence, not an id.
    for (const blob of [
      "healthcare member service agent assist",
      "cloud modernization and application rationalization programme",
      "AMS IT outsourcing transition with analytics repatriation",
    ]) {
      expect(getArchetypePack(blob)).toBeUndefined();
      expect(resolveDeclaredDiscoveryBlueprint(blob)).toBeNull();
    }
  });

  it("answers a key in whatever convention the catalog chose", () => {
    // `OTHER_THING` and `other-thing` are the same declaration; both answer it.
    expect(resolveArchetypeCatalogEntry(catalog, "OTHER_THING")).toBe("other");
    expect(resolveArchetypeCatalogEntry(catalog, "other-thing")).toBe("other");
    expect(resolveArchetypeCatalogEntry(catalog, "known_thing")).toBe("hit");
    expect(resolveArchetypeCatalogEntry(catalog, "KNOWN THING")).toBe("hit");
  });

  it("declines a declaration that normalizes to nothing", () => {
    // Separators alone are not a declaration, even for a catalog that happens
    // to carry an empty key.
    const withEmptyKey = { "": "empty", real_thing: "real" };
    for (const declared of ["---", "  //  ", "..", "_"]) {
      expect(resolveArchetypeCatalogEntry(withEmptyKey, declared)).toBeNull();
    }
    expect(resolveArchetypeCatalogEntry(withEmptyKey, "real-thing")).toBe("real");
  });
});

describe("neither catalog can be ambiguous about a declaration", () => {
  // Resolution walks the catalog's keys, so two keys that normalize alike would
  // make the winner depend on declaration order rather than on the declaration.
  it.each([
    ["archetype packs", ARCHETYPE_PACKS],
    ["discovery blueprints", DISCOVERY_BLUEPRINT_CATALOG],
  ])("%s declare no two keys that normalize alike", (_label, catalog) => {
    const seen = new Map<string, string>();
    for (const key of Object.keys(catalog)) {
      const normalized = normalizeArchetypeId(key);
      expect(normalized).not.toBe("");
      expect(seen.get(normalized)).toBeUndefined();
      seen.set(normalized, key);
    }
    expect(seen.size).toBe(Object.keys(catalog).length);
  });
});

describe("normalizeArchetypeId", () => {
  it("collapses separators, case and padding to one token", () => {
    expect(normalizeArchetypeId("  Cloud / Modernization  ")).toBe(
      "cloud_modernization",
    );
    expect(normalizeArchetypeId("AI-PDLC")).toBe("ai_pdlc");
    expect(normalizeArchetypeId("a..b--c  d")).toBe("a_b_c_d");
    expect(normalizeArchetypeId("_leading_and_trailing_")).toBe(
      "leading_and_trailing",
    );
  });

  it("is a fixed point on every catalog key it must match", () => {
    for (const key of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
      expect(normalizeArchetypeId(key)).toBe(key);
    }
  });
});
