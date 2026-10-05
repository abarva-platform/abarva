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
  type ArchetypeConfigEnv,
  applyConfiguredBlueprintOverride,
  loadEffectiveDiscoveryBlueprintCatalog,
  readConfiguredArchetypeSource,
  resolveConfiguredDiscoveryBlueprint,
} from "../briefs/archetype-config-source";
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
