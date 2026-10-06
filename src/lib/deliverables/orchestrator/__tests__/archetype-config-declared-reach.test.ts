// A configured source could ADD an archetype — the loader validated it, the
// effective catalog held it, `applied` named it — and nothing could ever select
// it, because every resolver was bound to the built-in seed. These pin the two
// halves of the fix: the declaration resolves against the EFFECTIVE catalog, and
// an id that no declaration can pick out unambiguously is refused rather than
// admitted and shadowed.
//
// Both halves are needed. Resolving against the effective catalog only helps the
// DECLARED branches, so the override still has to apply when inference chose a
// shipped archetype the source replaces; and reaching an added id by declaration
// is what makes an ambiguous id harmful in the first place.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getArtifactBrief } from "../artifact-brief-registry";
import {
  ARCHETYPE_CONFIG_PATH_ENV,
  type ArchetypeConfigEnv,
  loadEffectiveDiscoveryBlueprintCatalog,
  resolveConfiguredDiscoveryBlueprint,
  resolveDiscoveryBlueprintFromConfiguredCatalog,
} from "../briefs/archetype-config-source";
import {
  DISCOVERY_BLUEPRINT_CATALOG,
  getDiscoveryBlueprint,
  loadDiscoveryBlueprintCatalog,
  resolveDeclaredDiscoveryBlueprint,
  resolveDiscoveryBlueprintWithBasis,
} from "../briefs/discovery-blueprint";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";

const ADDED_ID = "configured_practice_archetype";
const OVERRIDDEN_ID = "governed_data_foundation";
const ADDED_FAMILY_LABEL = "Configured practice exception ledger";
const ADDED_ROLE = "Configured practice operations lead";
const INFERENCE_BLOB = "irops recovery disruption operations";
// The archetype `INFERENCE_BLOB` infers, written out rather than read back from
// resolution: an expectation taken from the code under test cannot see a rename.
const INFERRED_ID = "ai_operations_customer_digital";

function blueprintSource(blueprintId: string): Record<string, unknown> {
  return {
    blueprintId,
    blueprintVersion: "configured-1",
    archetypeLabel: `Configured ${blueprintId}`,
    evidenceFamilies: [
      {
        id: "configured_family",
        label: ADDED_FAMILY_LABEL,
        grounds: "Current-State Assessment",
        required: true,
        likelySource: "Practice owner",
        format: "Doc",
      },
    ],
    interviewRoster: [
      {
        role: ADDED_ROLE,
        side: "business",
        objectives: "Confirm the configured scope.",
        questions: ["Which exceptions are still worked by hand today?"],
      },
    ],
  };
}

let tmpDir: string;

function writeSource(value: unknown): string {
  const file = path.join(
    tmpDir,
    `source-${Math.random().toString(36).slice(2)}.json`,
  );
  fs.writeFileSync(file, JSON.stringify(value), "utf8");
  return file;
}

function envWith(value: unknown): ArchetypeConfigEnv {
  return { [ARCHETYPE_CONFIG_PATH_ENV]: writeSource(value) };
}

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "archetype-declared-reach-"));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("resolution runs against the catalog it is handed", () => {
  it("answers a declaration of an id only the effective catalog holds", () => {
    const effective = loadEffectiveDiscoveryBlueprintCatalog(
      envWith([blueprintSource(ADDED_ID)]),
    );
    expect(effective.applied).toEqual([ADDED_ID]);

    expect(resolveDeclaredDiscoveryBlueprint(ADDED_ID)).toBeNull();
    expect(
      resolveDeclaredDiscoveryBlueprint(ADDED_ID, effective.catalog)
        ?.blueprintId,
    ).toBe(ADDED_ID);
  });

  it("defaults to the seed, so a caller that passes no catalog is unchanged", () => {
    expect(resolveDeclaredDiscoveryBlueprint(OVERRIDDEN_ID)).toBe(
      DISCOVERY_BLUEPRINT_CATALOG[OVERRIDDEN_ID],
    );
    expect(resolveDiscoveryBlueprintWithBasis("", OVERRIDDEN_ID)).toMatchObject({
      basis: "declared",
      unknownDeclaration: null,
    });
  });

  it("reports an added archetype as declared, not as an unknown declaration", () => {
    const effective = loadEffectiveDiscoveryBlueprintCatalog(
      envWith([blueprintSource(ADDED_ID)]),
    );
    const seedResolution = resolveDiscoveryBlueprintWithBasis("", ADDED_ID);
    expect(seedResolution.unknownDeclaration).toBe(ADDED_ID);
    expect(seedResolution.basis).toBe("default");

    const configured = resolveDiscoveryBlueprintWithBasis(
      "",
      ADDED_ID,
      effective.catalog,
    );
    expect(configured.basis).toBe("declared");
    expect(configured.unknownDeclaration).toBeNull();
    expect(configured.blueprint.blueprintId).toBe(ADDED_ID);
  });

  it("still never INFERS a configured archetype — inference reads shipped keywords", () => {
    const keywordy = blueprintSource(ADDED_ID);
    keywordy.suggestionKeywords = ["irops", "recovery", "disruption"];
    const effective = loadEffectiveDiscoveryBlueprintCatalog(envWith([keywordy]));

    const inferred = resolveDiscoveryBlueprintWithBasis(
      INFERENCE_BLOB,
      null,
      effective.catalog,
    );
    expect(inferred.basis).toBe("inferred");
    expect(inferred.blueprint.blueprintId).not.toBe(ADDED_ID);
  });
});

describe("resolveDiscoveryBlueprintFromConfiguredCatalog", () => {
  it("reaches a newly ADDED archetype by declaration", () => {
    const resolution = resolveDiscoveryBlueprintFromConfiguredCatalog(
      ADDED_ID,
      null,
      envWith([blueprintSource(ADDED_ID)]),
    );
    expect(resolution.blueprint.blueprintId).toBe(ADDED_ID);
    expect(resolution.basis).toBe("declared_via_use_case");
    expect(resolution.origin).toBe("configured_addition");
    expect(resolution.state).toBe("in_effect");
    expect(resolution.blueprint.evidenceFamilies[0].label).toBe(
      ADDED_FAMILY_LABEL,
    );
  });

  // The narrow seam takes a blueprint, not a declaration, so it has no token to
  // match against an added id. That is a property of its signature, not a gap to
  // close — the two entry points exist for different callers.
  it("is the reach the already-resolved seam cannot have", () => {
    const env = envWith([blueprintSource(ADDED_ID)]);
    const viaResolved = resolveConfiguredDiscoveryBlueprint(
      getDiscoveryBlueprint(ADDED_ID),
      env,
    );
    expect(viaResolved.blueprint.blueprintId).not.toBe(ADDED_ID);

    const viaDeclaration = resolveDiscoveryBlueprintFromConfiguredCatalog(
      ADDED_ID,
      null,
      env,
    );
    expect(viaDeclaration.blueprint.blueprintId).toBe(ADDED_ID);
  });

  it("calls an override of a shipped archetype an override, not an addition", () => {
    const resolution = resolveDiscoveryBlueprintFromConfiguredCatalog(
      OVERRIDDEN_ID,
      null,
      envWith([blueprintSource(OVERRIDDEN_ID)]),
    );
    expect(resolution.blueprint.blueprintId).toBe(OVERRIDDEN_ID);
    expect(resolution.origin).toBe("configured_override");
    expect(resolution.blueprint.interviewRoster[0].role).toBe(ADDED_ROLE);
  });

  // Resolving against the effective catalog only helps the DECLARED branches.
  // An inferred archetype answers with a shipped constant, so without the
  // override step a configured source stops reaching every Move that declared
  // nothing — the majority of them.
  it("applies the override when INFERENCE chose the overridden archetype", () => {
    const overriddenInferable = blueprintSource(INFERRED_ID);
    const resolution = resolveDiscoveryBlueprintFromConfiguredCatalog(
      INFERENCE_BLOB,
      null,
      envWith([overriddenInferable]),
    );
    expect(resolution.basis).toBe("inferred");
    expect(resolution.blueprint.blueprintId).toBe(INFERRED_ID);
    expect(resolution.origin).toBe("configured_override");
    expect(resolution.blueprint.interviewRoster[0].role).toBe(ADDED_ROLE);
  });

  it("reads as the seed on every deployment that configures nothing", () => {
    const resolution = resolveDiscoveryBlueprintFromConfiguredCatalog(
      OVERRIDDEN_ID,
      null,
      {},
    );
    expect(resolution.origin).toBe("seed");
    expect(resolution.state).toBe("not_configured");
    expect(resolution.blueprint).toBe(DISCOVERY_BLUEPRINT_CATALOG[OVERRIDDEN_ID]);
  });

  // A configured entry that restates a shipped archetype field-for-field is
  // indistinguishable from the seed BY VALUE, so origin has to come from
  // `applied`. Keyed on a value comparison this case reads `seed` and an
  // operator cannot tell a live override from an inert file.
  it("names an override that restates the shipped archetype verbatim", () => {
    const verbatim = JSON.parse(
      JSON.stringify(DISCOVERY_BLUEPRINT_CATALOG[OVERRIDDEN_ID]),
    );
    const resolution = resolveDiscoveryBlueprintFromConfiguredCatalog(
      OVERRIDDEN_ID,
      null,
      envWith([verbatim]),
    );
    expect(resolution.blueprint).toEqual(
      DISCOVERY_BLUEPRINT_CATALOG[OVERRIDDEN_ID],
    );
    expect(resolution.origin).toBe("configured_override");
  });

  it("leaves a rejected source reported and the seed in force", () => {
    const resolution = resolveDiscoveryBlueprintFromConfiguredCatalog(
      OVERRIDDEN_ID,
      null,
      envWith([{ ...blueprintSource(ADDED_ID), interviewRoster: [] }]),
    );
    expect(resolution.state).toBe("rejected");
    expect(resolution.errors.length).toBeGreaterThan(0);
    expect(resolution.origin).toBe("seed");
    expect(resolution.blueprint).toBe(DISCOVERY_BLUEPRINT_CATALOG[OVERRIDDEN_ID]);
  });
});

describe("an id no declaration can pick out is refused", () => {
  it("refuses a configured id that reads as a SHIPPED archetype", () => {
    const loaded = loadDiscoveryBlueprintCatalog([
      blueprintSource("governed__data__foundation"),
    ]);
    expect(loaded.applied).toEqual([]);
    expect(loaded.errors).toHaveLength(1);
    expect(loaded.errors[0]).toContain("governed__data__foundation");
    expect(loaded.errors[0]).toContain(OVERRIDDEN_ID);
    expect(loaded.catalog[OVERRIDDEN_ID]).toBe(
      DISCOVERY_BLUEPRINT_CATALOG[OVERRIDDEN_ID],
    );
  });

  it("refuses two configured ids that read as each other", () => {
    const loaded = loadDiscoveryBlueprintCatalog([
      blueprintSource(ADDED_ID),
      blueprintSource(`${ADDED_ID}_`),
    ]);
    expect(loaded.applied).toEqual([]);
    expect(loaded.errors).toHaveLength(1);
    expect(loaded.errors[0]).toContain(`1.blueprintId`);
    expect(loaded.catalog[ADDED_ID]).toBeUndefined();
  });

  it("admits an id that EQUALS a shipped one — that is the override rule", () => {
    const loaded = loadDiscoveryBlueprintCatalog([
      blueprintSource(OVERRIDDEN_ID),
    ]);
    expect(loaded.errors).toEqual([]);
    expect(loaded.applied).toEqual([OVERRIDDEN_ID]);
  });

  it("admits the same source twice over — the refusal is not a dedupe", () => {
    const loaded = loadDiscoveryBlueprintCatalog([
      blueprintSource(OVERRIDDEN_ID),
      blueprintSource(OVERRIDDEN_ID),
    ]);
    expect(loaded.errors).toEqual([]);
    expect(loaded.applied).toEqual([OVERRIDDEN_ID, OVERRIDDEN_ID]);
  });
});

describe("both Discovery Plan hosts reach an ADDED archetype", () => {
  const originalEnvValue = process.env[ARCHETYPE_CONFIG_PATH_ENV];

  afterEach(() => {
    if (originalEnvValue === undefined) {
      delete process.env[ARCHETYPE_CONFIG_PATH_ENV];
    } else {
      process.env[ARCHETYPE_CONFIG_PATH_ENV] = originalEnvValue;
    }
  });

  function req(
    deliverableModule: DeliverableIntelligenceRequest["module"],
  ): DeliverableIntelligenceRequest {
    return {
      ...amsRfpRequest(),
      module: deliverableModule,
      useCaseArchetype: ADDED_ID,
      deliverableType: "discovery_plan",
    };
  }

  // Two hosts resolve a blueprint separately — the generic Discovery Plan
  // builder and the Moves one — so either can go un-wired on its own.
  it.each(["moves", "source"] as const)(
    "the %s Discovery Plan asks for the added archetype's evidence",
    (deliverableModule) => {
      const before = JSON.stringify(getArtifactBrief(req(deliverableModule)));
      expect(before).not.toContain(ADDED_FAMILY_LABEL);

      process.env[ARCHETYPE_CONFIG_PATH_ENV] = writeSource([
        blueprintSource(ADDED_ID),
      ]);
      const after = JSON.stringify(getArtifactBrief(req(deliverableModule)));
      expect(after).toContain(ADDED_FAMILY_LABEL);
      expect(after).toContain(ADDED_ROLE);
    },
  );
});
