// A QUEUED Moves phase build must generate against the archetype the Move
// declared, not against the coarse legacy column the client happens to post.
//
// The oracle for every "names an archetype" assertion is the shipped catalogs
// themselves, read through the same resolver the product uses, so this suite
// cannot drift into asserting a hand-maintained list of ids. The pack-only and
// blueprint-only sets are DERIVED and their non-emptiness asserted, because the
// two catalogs overlap in exactly one id — a suite that exercised only that id
// would pass with either catalog arm of the reused oracle removed.

import { resolvePhaseBuildUseCaseArchetype } from "../phase-build-use-case-archetype";
import { namesCatalogArchetype } from "../use-case-archetype-precedence";
import {
  loadEffectiveArchetypePackCatalog,
  loadEffectiveDiscoveryBlueprintCatalog,
} from "@/lib/deliverables/orchestrator/briefs/archetype-config-source";
import { normalizeArchetypeId } from "@/lib/deliverables/orchestrator/briefs/archetype-identity";
import type { ArchetypeKey } from "@/lib/programs/types.ui";

const PACK_IDS = Object.keys(loadEffectiveArchetypePackCatalog({}).catalog);
const BLUEPRINT_IDS = Object.keys(
  loadEffectiveDiscoveryBlueprintCatalog({}).catalog,
);
const norm = (ids: string[]) => ids.map(normalizeArchetypeId);
const PACK_ONLY_IDS = PACK_IDS.filter(
  (id) => !norm(BLUEPRINT_IDS).includes(normalizeArchetypeId(id)),
);
const BLUEPRINT_ONLY_IDS = BLUEPRINT_IDS.filter(
  (id) => !norm(PACK_IDS).includes(normalizeArchetypeId(id)),
);

// Exhaustive over the union on purpose: adding a label to `ArchetypeKey`
// without deciding whether it names an archetype breaks COMPILATION here
// rather than silently widening what the client may post unchallenged.
const LEGACY_PROGRAM_ARCHETYPES: Record<ArchetypeKey, true> = {
  strategic_transformation: true,
  workflow_automation: true,
  platform_modernization: true,
  ai_product_enablement: true,
  operational_optimization: true,
};
const LEGACY_KEYS = Object.keys(LEGACY_PROGRAM_ARCHETYPES) as ArchetypeKey[];

describe("the suite's own fixtures are non-vacuous", () => {
  it("has at least one pack-only and one blueprint-only archetype", () => {
    expect(PACK_ONLY_IDS.length).toBeGreaterThan(0);
    expect(BLUEPRINT_ONLY_IDS.length).toBeGreaterThan(0);
  });
});

describe("the defect's premise: what the client posts names nothing", () => {
  it.each(LEGACY_KEYS)(
    "legacy program archetype %s names no catalog archetype",
    (label) => {
      expect(namesCatalogArchetype(label)).toBe(false);
    },
  );
});

describe("resolvePhaseBuildUseCaseArchetype", () => {
  it.each(BLUEPRINT_ONLY_IDS)(
    "substitutes a declaration naming blueprint-only %s for a legacy request",
    (declared) => {
      const resolved = resolvePhaseBuildUseCaseArchetype({
        requestedArchetype: "platform_modernization",
        declaredArchetypeId: declared,
      });
      expect(resolved.useCaseArchetype).toBe(declared);
      expect(resolved.basis).toBe("declared_substituted");
      expect(resolved.unusedDeclaration).toBeNull();
    },
  );

  it.each(PACK_ONLY_IDS)(
    "substitutes a declaration naming pack-only %s for a legacy request",
    (declared) => {
      const resolved = resolvePhaseBuildUseCaseArchetype({
        requestedArchetype: "platform_modernization",
        declaredArchetypeId: declared,
      });
      expect(resolved.useCaseArchetype).toBe(declared);
      expect(resolved.basis).toBe("declared_substituted");
    },
  );

  it("keeps a request that already names an archetype, and reports the unused declaration", () => {
    const requested = BLUEPRINT_ONLY_IDS[0]!;
    const declared = PACK_ONLY_IDS[0]!;
    const resolved = resolvePhaseBuildUseCaseArchetype({
      requestedArchetype: requested,
      declaredArchetypeId: declared,
    });
    expect(resolved.useCaseArchetype).toBe(requested);
    expect(resolved.basis).toBe("requested_names_archetype");
    expect(resolved.unusedDeclaration).toBe(declared);
  });

  it("reports no unused declaration when both candidates are the same id", () => {
    const id = BLUEPRINT_ONLY_IDS[0]!;
    const resolved = resolvePhaseBuildUseCaseArchetype({
      requestedArchetype: id,
      declaredArchetypeId: id,
    });
    expect(resolved.useCaseArchetype).toBe(id);
    expect(resolved.unusedDeclaration).toBeNull();
  });

  it("keeps the request UNCHANGED as the inference seed when neither names an archetype", () => {
    const resolved = resolvePhaseBuildUseCaseArchetype({
      requestedArchetype: "platform_modernization",
      declaredArchetypeId: "operational_optimization",
    });
    // The seed still feeds the prompt's use-case description and the
    // brief-registry lookup key; replacing it would discard a real signal.
    expect(resolved.useCaseArchetype).toBe("platform_modernization");
    expect(resolved.basis).toBe("unnamed_seed");
    expect(resolved.unusedDeclaration).toBe("operational_optimization");
  });

  it("keeps the request when the Move declares nothing at all", () => {
    for (const declared of [null, undefined, "", "   "]) {
      const resolved = resolvePhaseBuildUseCaseArchetype({
        requestedArchetype: "platform_modernization",
        declaredArchetypeId: declared,
      });
      expect(resolved.useCaseArchetype).toBe("platform_modernization");
      expect(resolved.basis).toBe("unnamed_seed");
      expect(resolved.unusedDeclaration).toBeNull();
    }
  });

  it("does NOT accept keyword inference as naming an archetype", () => {
    // `resolveDiscoveryBlueprintWithBasis` can INFER a blueprint from a key's
    // own words. Were inference accepted here, such a request would go on
    // shadowing a real declaration — the exact defect this rule exists for.
    const inferring = "platform_modernization";
    expect(namesCatalogArchetype(inferring)).toBe(false);
    const declared = BLUEPRINT_ONLY_IDS[0]!;
    expect(
      resolvePhaseBuildUseCaseArchetype({
        requestedArchetype: inferring,
        declaredArchetypeId: declared,
      }).useCaseArchetype,
    ).toBe(declared);
  });

  it("trims surrounding whitespace on both candidates", () => {
    const declared = BLUEPRINT_ONLY_IDS[0]!;
    expect(
      resolvePhaseBuildUseCaseArchetype({
        requestedArchetype: "  platform_modernization  ",
        declaredArchetypeId: `  ${declared}  `,
      }).useCaseArchetype,
    ).toBe(declared);
  });

  it("ignores non-string candidates", () => {
    const declared = BLUEPRINT_ONLY_IDS[0]!;
    expect(
      resolvePhaseBuildUseCaseArchetype({
        requestedArchetype: 42,
        declaredArchetypeId: declared,
      }).useCaseArchetype,
    ).toBe(declared);
    const bothBad = resolvePhaseBuildUseCaseArchetype({
      requestedArchetype: { archetype: declared },
      declaredArchetypeId: ["nope"],
    });
    expect(bothBad.useCaseArchetype).toBe("");
    expect(bothBad.basis).toBe("unnamed_seed");
  });

  it("uses the declaration when the request is absent entirely", () => {
    const declared = PACK_ONLY_IDS[0]!;
    const resolved = resolvePhaseBuildUseCaseArchetype({
      requestedArchetype: null,
      declaredArchetypeId: declared,
    });
    expect(resolved.useCaseArchetype).toBe(declared);
    expect(resolved.basis).toBe("declared_substituted");
  });
});
