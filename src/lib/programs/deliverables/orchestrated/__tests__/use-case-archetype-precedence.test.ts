// A declared archetype must not lose to a function-pack key that names none.
//
// The oracle for every "names an archetype" assertion here is the shipped
// catalogs themselves, read through the same resolver the product uses, so the
// suite cannot drift into asserting a hand-maintained list of ids.

import {
  charterDeclaredUseCaseArchetype,
  namesCatalogArchetype,
  resolveMoveUseCaseArchetype,
} from "../use-case-archetype-precedence";
import { buildMoveDeliverableRequest } from "../build-request";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { listFunctionPackCoverage } from "@/lib/programs/expert-kernel/domain/function-pack-registry";
import {
  loadEffectiveArchetypePackCatalog,
  loadEffectiveDiscoveryBlueprintCatalog,
  resolveConfiguredArchetypePack,
  resolveDiscoveryBlueprintFromConfiguredCatalog,
} from "@/lib/deliverables/orchestrator/briefs/archetype-config-source";
import { normalizeArchetypeId } from "@/lib/deliverables/orchestrator/briefs/archetype-identity";
import type { MoveBusinessCaseInput } from "../../../move-business-case";

/** A declared archetype that names entries in BOTH catalogs. */
const DECLARED = "governed_data_foundation";

const FUNCTION_PACK_KEYS = listFunctionPackCoverage().map((p) => p.functionKey);

// Read from the catalogs, so a shipped archetype added to either one is swept
// without editing this suite.
const PACK_IDS = Object.keys(loadEffectiveArchetypePackCatalog({}).catalog);
const BLUEPRINT_IDS = Object.keys(
  loadEffectiveDiscoveryBlueprintCatalog({}).catalog,
);
const norm = (ids: string[]) => ids.map(normalizeArchetypeId);
/** Declared in the pack catalog and NOT in the blueprint catalog. */
const PACK_ONLY_IDS = PACK_IDS.filter(
  (id) => !norm(BLUEPRINT_IDS).includes(normalizeArchetypeId(id)),
);
/** Declared in the blueprint catalog and NOT in the pack catalog. */
const BLUEPRINT_ONLY_IDS = BLUEPRINT_IDS.filter(
  (id) => !norm(PACK_IDS).includes(normalizeArchetypeId(id)),
);

const MOVE: MoveBusinessCaseInput = {
  industry_code: "cross_industry",
  name: "Governed Data Foundation",
  charter: {
    sponsor: "CDO, accountable for the governed data foundation.",
    scope: "Enterprise data platform in scope.",
    classification: { archetype: DECLARED },
  },
  baseline_metrics: null,
  tenant_key: "fixture-tenant",
  tenant_name: "Fixture Tenant",
};

const OPTIONS = {
  deliverableType: "discovery_plan",
  phaseOrStage: "P2_discovery",
  artifactStandard: "moves.board_grade.discovery_plan",
  decisionContext: "Approve the P2 discovery plan.",
} as const;

const BUSINESS_CASE_OPTIONS = {
  deliverableType: "business_case",
  phaseOrStage: "P4_business_case",
  artifactStandard: "moves.board_grade.costed_business_case",
  decisionContext: "Fund, shape, or kill the Move.",
} as const;

describe("the measurement this rule exists for", () => {
  it("declares at least one function pack key, and none of them names an archetype", () => {
    expect(FUNCTION_PACK_KEYS.length).toBeGreaterThan(0);
    const naming = FUNCTION_PACK_KEYS.filter((key) =>
      namesCatalogArchetype(key),
    );
    expect(naming).toEqual([]);
  });

  it("recognises the declared archetype in both catalogs", () => {
    expect(namesCatalogArchetype(DECLARED)).toBe(true);
    expect(resolveConfiguredArchetypePack(DECLARED).pack).toBeTruthy();
    expect(
      resolveDiscoveryBlueprintFromConfiguredCatalog(DECLARED).blueprint
        .blueprintId,
    ).toBe(DECLARED);
  });

  it("does not count keyword inference as naming an archetype", () => {
    // Six pack keys resolve a NON-default blueprint purely because their own
    // words match the inference rule. Were inference accepted as naming, those
    // keys would go on shadowing a real declaration.
    const inferring = FUNCTION_PACK_KEYS.filter(
      (key) =>
        resolveDiscoveryBlueprintFromConfiguredCatalog(key).basis ===
        "inferred",
    );
    expect(inferring.length).toBeGreaterThan(0);
    for (const key of inferring) {
      expect(namesCatalogArchetype(key)).toBe(false);
      expect(
        resolveMoveUseCaseArchetype({
          functionPackKey: key,
          charterClassificationArchetype: DECLARED,
          fallback: "STRATEGIC_MOVE",
        }),
      ).toBe(DECLARED);
    }
  });
});

describe("resolveMoveUseCaseArchetype", () => {
  it("prefers the charter declaration over EVERY function pack key", () => {
    for (const key of FUNCTION_PACK_KEYS) {
      expect(
        resolveMoveUseCaseArchetype({
          functionPackKey: key,
          charterClassificationArchetype: DECLARED,
          fallback: "STRATEGIC_MOVE",
        }),
      ).toBe(DECLARED);
    }
  });

  it("honours an archetype only the PACK catalog declares", () => {
    // The two catalogs overlap in exactly one id today, so an oracle that
    // consulted only the blueprint catalog would drop every one of these.
    expect(PACK_ONLY_IDS.length).toBeGreaterThan(0);
    for (const id of PACK_ONLY_IDS) {
      expect(namesCatalogArchetype(id)).toBe(true);
      expect(
        resolveMoveUseCaseArchetype({
          functionPackKey: "revenue_cycle",
          charterClassificationArchetype: id,
          fallback: "STRATEGIC_MOVE",
        }),
      ).toBe(id);
    }
  });

  it("honours an archetype only the BLUEPRINT catalog declares", () => {
    expect(BLUEPRINT_ONLY_IDS.length).toBeGreaterThan(0);
    for (const id of BLUEPRINT_ONLY_IDS) {
      expect(namesCatalogArchetype(id)).toBe(true);
      expect(
        resolveMoveUseCaseArchetype({
          functionPackKey: "revenue_cycle",
          charterClassificationArchetype: id,
          fallback: "STRATEGIC_MOVE",
        }),
      ).toBe(id);
    }
  });

  it("keeps the function pack key when it is the only candidate", () => {
    expect(
      resolveMoveUseCaseArchetype({
        functionPackKey: "revenue_cycle",
        fallback: "STRATEGIC_MOVE",
      }),
    ).toBe("revenue_cycle");
  });

  it("keeps the function pack key when NEITHER candidate names an archetype", () => {
    expect(
      resolveMoveUseCaseArchetype({
        functionPackKey: "revenue_cycle",
        charterClassificationArchetype: "not_an_archetype_at_all",
        fallback: "STRATEGIC_MOVE",
      }),
    ).toBe("revenue_cycle");
  });

  it("keeps the function pack key when BOTH name an archetype", () => {
    expect(namesCatalogArchetype(DECLARED)).toBe(true);
    expect(
      resolveMoveUseCaseArchetype({
        functionPackKey: DECLARED,
        charterClassificationArchetype: "ams_it_outsourcing",
        fallback: "STRATEGIC_MOVE",
      }),
    ).toBe(DECLARED);
  });

  it("resolves a declaration spelled in the other catalog's case", () => {
    // The pack catalog is UPPER_SNAKE and the blueprint catalog lower_snake;
    // one identity rule answers both, so either spelling counts as named.
    expect(
      resolveMoveUseCaseArchetype({
        functionPackKey: "revenue_cycle",
        charterClassificationArchetype: "GOVERNED-DATA-FOUNDATION",
        fallback: "STRATEGIC_MOVE",
      }),
    ).toBe("GOVERNED-DATA-FOUNDATION");
  });

  it("falls back only when no field carries a value", () => {
    expect(
      resolveMoveUseCaseArchetype({ fallback: "STRATEGIC_MOVE" }),
    ).toBe("STRATEGIC_MOVE");
    expect(
      resolveMoveUseCaseArchetype({
        functionPackKey: "   ",
        charterClassificationArchetype: null,
        fallback: "STRATEGIC_MOVE",
      }),
    ).toBe("STRATEGIC_MOVE");
  });

  it("ignores non-string declaration values", () => {
    expect(
      resolveMoveUseCaseArchetype({
        functionPackKey: 42,
        charterClassificationArchetype: { archetype: DECLARED },
        fallback: "STRATEGIC_MOVE",
      }),
    ).toBe("STRATEGIC_MOVE");
  });

  it("never answers an inherited Object.prototype member as an archetype", () => {
    expect(namesCatalogArchetype("constructor")).toBe(false);
    expect(namesCatalogArchetype("toString")).toBe(false);
  });
});

describe("charterDeclaredUseCaseArchetype", () => {
  it("reads the declaration the charter carries", () => {
    expect(
      charterDeclaredUseCaseArchetype({ classification: { archetype: DECLARED } }),
    ).toBe(DECLARED);
  });

  it("answers null for a charter that declares nothing", () => {
    expect(charterDeclaredUseCaseArchetype(null)).toBeNull();
    expect(charterDeclaredUseCaseArchetype(undefined)).toBeNull();
    expect(charterDeclaredUseCaseArchetype({})).toBeNull();
    expect(charterDeclaredUseCaseArchetype({ classification: {} })).toBeNull();
    expect(
      charterDeclaredUseCaseArchetype({ classification: { archetype: "  " } }),
    ).toBeNull();
  });

  it("does not throw on the older bare-string classification", () => {
    expect(
      charterDeclaredUseCaseArchetype({ classification: "platform work" }),
    ).toBeNull();
  });
});

describe("the request the Move builder produces", () => {
  it("carries the declared archetype even when a pack key is set", () => {
    const { request } = buildMoveDeliverableRequest(
      { ...MOVE, function_pack_key: "revenue_cycle" },
      OPTIONS,
    );
    expect(request.useCaseArchetype).toBe(DECLARED);
  });

  it("still carries the pack key when the charter declares nothing", () => {
    const { request } = buildMoveDeliverableRequest(
      {
        ...MOVE,
        function_pack_key: "revenue_cycle",
        charter: { sponsor: "CDO, accountable for the platform." },
      },
      OPTIONS,
    );
    expect(request.useCaseArchetype).toBe("revenue_cycle");
  });

  it("falls back when neither field carries a value", () => {
    const { request } = buildMoveDeliverableRequest(
      { ...MOVE, charter: { sponsor: "CDO, accountable." } },
      OPTIONS,
    );
    expect(request.useCaseArchetype).toBe("STRATEGIC_MOVE");
  });
});

describe("what the declaration reaching the request changes in the brief", () => {
  const NO_DECLARATION = { sponsor: "CDO, accountable for the platform." };

  const briefFor = (
    charter: unknown,
    options: typeof OPTIONS | typeof BUSINESS_CASE_OPTIONS,
  ) =>
    getArtifactBrief(
      buildMoveDeliverableRequest(
        {
          ...MOVE,
          function_pack_key: "revenue_cycle",
          charter,
        } as MoveBusinessCaseInput,
        options,
      ).request,
    );

  it("prescribes the declared archetype's evidence framework, not the default", () => {
    // The P2 Discovery Plan is what tells the client WHAT evidence to gather,
    // so this is the assertion that matters most on the E2E path.
    const families = resolveConfiguredArchetypePack(DECLARED).pack
      ?.keyEvidenceFamilies;
    expect(families?.length).toBeGreaterThan(0);

    const carries = (brief: ReturnType<typeof getArtifactBrief>) =>
      brief.recommendedStructure.some((section) =>
        (families ?? []).every((family) =>
          section.expectedEvidenceFamilies.includes(family),
        ),
      );

    expect(carries(briefFor(MOVE.charter, OPTIONS))).toBe(true);
    expect(carries(briefFor(NO_DECLARATION, OPTIONS))).toBe(false);
  });

  it("names the declared archetype's evidence families in the discovery agenda", () => {
    const declaredPlan = briefFor(MOVE.charter, OPTIONS);
    const shadowedPlan = briefFor(NO_DECLARATION, OPTIONS);
    const declaredBlueprint =
      resolveDiscoveryBlueprintFromConfiguredCatalog(DECLARED).blueprint;
    const defaultBlueprint =
      resolveDiscoveryBlueprintFromConfiguredCatalog("revenue_cycle").blueprint;

    // The two family sets are disjoint, which is what makes the brief text a
    // discriminator between the frameworks rather than a subset check.
    const declaredLabels = declaredBlueprint.evidenceFamilies.map(
      (f) => f.label,
    );
    const defaultLabels = defaultBlueprint.evidenceFamilies.map((f) => f.label);
    expect(declaredLabels.length).toBeGreaterThan(0);
    expect(
      declaredLabels.filter((label) => defaultLabels.includes(label)),
    ).toEqual([]);

    const text = (brief: ReturnType<typeof getArtifactBrief>) =>
      JSON.stringify(brief.recommendedStructure);
    expect(text(declaredPlan)).toContain(declaredLabels[0]);
    expect(text(shadowedPlan)).not.toContain(declaredLabels[0]);
  });

  it("carries the declared archetype's exhibits or tables into a deck-grade brief", () => {
    // The Discovery Plan deliberately withholds nothing but has its own brief
    // builder, so the pack's exhibits are proven on a type that goes through
    // `composeBrief` — the half the pack catalog actually feeds.
    const pack = resolveConfiguredArchetypePack(DECLARED).pack;
    const packAssetKeys = new Set([
      ...(pack?.exhibits ?? []).map((e) => e.key),
      ...(pack?.tables ?? []).map((t) => t.key),
    ]);
    expect(packAssetKeys.size).toBeGreaterThan(0);

    const assets = (brief: ReturnType<typeof getArtifactBrief>) =>
      [...brief.expectedExhibits, ...brief.expectedTables].filter((asset) =>
        packAssetKeys.has(asset.key),
      );

    // Compared as a DELTA, not by presence: a structure's own exhibits and
    // tables are properties of the artifact type and some share a key with the
    // pack's (`risk_register` on the business case), so "the declared brief
    // holds a pack key" is true of the shadowed one too. What the declaration
    // changes is which of the pack's assets the brief gained.
    const declared = assets(briefFor(MOVE.charter, BUSINESS_CASE_OPTIONS));
    const shadowed = assets(briefFor(NO_DECLARATION, BUSINESS_CASE_OPTIONS));
    const gained = declared.filter(
      (asset) => !shadowed.some((own) => own.key === asset.key),
    );
    expect(gained.length).toBeGreaterThan(0);
    expect(shadowed.length).toBeLessThan(declared.length);
  });
});
