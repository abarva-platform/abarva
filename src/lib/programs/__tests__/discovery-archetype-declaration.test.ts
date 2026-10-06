import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  normalizeDiscoveryArchetypeDeclaration,
  withDeclaredDiscoveryArchetype,
} from "../discovery/discovery-archetype-declaration";
import {
  listDiscoveryArchetypeOptions,
  suggestDiscoveryArchetypes,
} from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import {
  listEffectiveDiscoveryArchetypeOptions,
  resolveEffectiveDeclaredDiscoveryBlueprint,
} from "@/lib/deliverables/orchestrator/briefs/archetype-declaration-surface";
import { ARCHETYPE_CONFIG_PATH_ENV } from "@/lib/deliverables/orchestrator/briefs/archetype-config-source";
import { resolveDeclaredProgramArchetypeId } from "@/lib/programs/discovery/evidence-readiness";

describe("discovery archetype declaration", () => {
  it("offers catalog options and only suggests from matching reference keywords", () => {
    expect(listDiscoveryArchetypeOptions()).toContainEqual({
      blueprintId: "governed_data_foundation",
      archetypeLabel: "Governed Data Foundation for AI / LLM Automation",
    });
    expect(
      suggestDiscoveryArchetypes(
        "Build a governed data foundation with a certified semantic layer and data lineage.",
      )[0],
    ).toMatchObject({ blueprintId: "governed_data_foundation" });
  });

  it("keeps the legacy Move classification unchanged when no choice is made", () => {
    const legacyClassification = {
      function_code: "data_platform",
      objective_code: "modernize",
      topic_code: "governance",
    };

    expect(withDeclaredDiscoveryArchetype(legacyClassification, null)).toEqual(
      legacyClassification,
    );
    expect(normalizeDiscoveryArchetypeDeclaration(undefined)).toBeNull();
  });

  it("stores a validated human declaration without replacing existing identity", () => {
    const legacyClassification = {
      function_code: "data_platform",
      objective_code: "modernize",
      topic_code: "governance",
    };

    expect(
      withDeclaredDiscoveryArchetype(
        legacyClassification,
        "governed_data_foundation",
      ),
    ).toEqual({
      ...legacyClassification,
      archetype: "governed_data_foundation",
      archetype_source: "human_declared_at_origination",
    });
    expect(() =>
      normalizeDiscoveryArchetypeDeclaration("not-a-catalog-entry"),
    ).toThrow("unknown_discovery_archetype");
  });

  it("feeds the separate declaration to the resolver without replacing phase identity", () => {
    const classification = withDeclaredDiscoveryArchetype(
      { function_code: "data_platform" },
      "governed_data_foundation",
    );

    expect(
      resolveDeclaredProgramArchetypeId({
        archetype: "ai_operations_customer_digital",
        functionPackKey: "data_platform_function_pack",
        charter: { classification },
      }),
    ).toBe("governed_data_foundation");
  });
});

// ── A configured archetype can be offered and declared ──────────────────────
// The engine validates a firm's configured archetype source and resolution
// honours a Move that declares one of its archetypes. Until the declaration
// surface read the effective catalog, nothing could get such a declaration INTO
// a Move: the picker enumerated the shipped seed, and the validator below threw
// on any id the seed did not hold. These cases pin both ends.

const CONFIGURED_ADDITION_ID = "regulated_claims_automation";
const CONFIGURED_ADDITION_LABEL = "Regulated Claims Automation";

function configuredBlueprint(
  blueprintId: string,
  archetypeLabel: string,
): Record<string, unknown> {
  return {
    blueprintId,
    blueprintVersion: "firm-1",
    archetypeLabel,
    evidenceFamilies: [
      {
        id: "intake_volumes",
        label: "Intake volumes",
        grounds: "Demand baseline",
        required: true,
        likelySource: "Case management export",
        format: "CSV by month",
      },
    ],
    interviewRoster: [
      {
        role: "Operations lead",
        side: "business",
        objectives: "Current intake handling",
        questions: ["How is an exception routed today?"],
      },
    ],
  };
}

describe("declaring an archetype a deploying firm configured", () => {
  let sourceDir: string;
  const originalConfigPath = process.env[ARCHETYPE_CONFIG_PATH_ENV];

  function declareSource(contents: string): string {
    const sourcePath = path.join(sourceDir, "archetypes.json");
    fs.writeFileSync(sourcePath, contents, "utf8");
    process.env[ARCHETYPE_CONFIG_PATH_ENV] = sourcePath;
    return sourcePath;
  }

  beforeEach(() => {
    sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "archetype-config-"));
    delete process.env[ARCHETYPE_CONFIG_PATH_ENV];
  });

  afterEach(() => {
    if (originalConfigPath === undefined) {
      delete process.env[ARCHETYPE_CONFIG_PATH_ENV];
    } else {
      process.env[ARCHETYPE_CONFIG_PATH_ENV] = originalConfigPath;
    }
    fs.rmSync(sourceDir, { recursive: true, force: true });
  });

  it("offers exactly the shipped archetypes, as shipped, when no source is declared", () => {
    const options = listEffectiveDiscoveryArchetypeOptions();

    expect(
      options.map(({ blueprintId, archetypeLabel }) => ({
        blueprintId,
        archetypeLabel,
      })),
    ).toEqual(listDiscoveryArchetypeOptions());
    expect(options.every((option) => option.origin === "seed")).toBe(true);
  });

  it("refuses a configured archetype's id while no source declares it — the pre-fix state for every id", () => {
    expect(() =>
      normalizeDiscoveryArchetypeDeclaration(CONFIGURED_ADDITION_ID),
    ).toThrow("unknown_discovery_archetype");
    expect(
      listEffectiveDiscoveryArchetypeOptions().some(
        (option) => option.blueprintId === CONFIGURED_ADDITION_ID,
      ),
    ).toBe(false);
  });

  it("offers an archetype the firm added, marked as the firm's own", () => {
    declareSource(
      JSON.stringify([
        configuredBlueprint(CONFIGURED_ADDITION_ID, CONFIGURED_ADDITION_LABEL),
      ]),
    );

    const options = listEffectiveDiscoveryArchetypeOptions();
    expect(options).toContainEqual({
      blueprintId: CONFIGURED_ADDITION_ID,
      archetypeLabel: CONFIGURED_ADDITION_LABEL,
      origin: "configured_addition",
    });
    // Adding an archetype does not reclassify the shipped ones.
    expect(
      options.find(
        (option) => option.blueprintId === "governed_data_foundation",
      ),
    ).toEqual({
      blueprintId: "governed_data_foundation",
      archetypeLabel: "Governed Data Foundation for AI / LLM Automation",
      origin: "seed",
    });
  });

  it("accepts a declaration of an archetype the firm added, at both validation gates", () => {
    declareSource(
      JSON.stringify([
        configuredBlueprint(CONFIGURED_ADDITION_ID, CONFIGURED_ADDITION_LABEL),
      ]),
    );

    expect(
      normalizeDiscoveryArchetypeDeclaration(CONFIGURED_ADDITION_ID),
    ).toBe(CONFIGURED_ADDITION_ID);
    expect(
      withDeclaredDiscoveryArchetype(
        { function_code: "claims" },
        CONFIGURED_ADDITION_ID,
      ),
    ).toEqual({
      function_code: "claims",
      archetype: CONFIGURED_ADDITION_ID,
      archetype_source: "human_declared_at_origination",
    });
    expect(
      resolveEffectiveDeclaredDiscoveryBlueprint(CONFIGURED_ADDITION_ID)
        ?.archetypeLabel,
    ).toBe(CONFIGURED_ADDITION_LABEL);
  });

  it("calls a replaced shipped archetype the firm's own, because the entry in force is theirs", () => {
    declareSource(
      JSON.stringify([
        configuredBlueprint("governed_data_foundation", "Our Data Foundation"),
      ]),
    );

    // The id is shipped; the definition behind it is not. A picker that reads
    // the id cannot tell, which is why origin is read off what was applied.
    expect(
      listEffectiveDiscoveryArchetypeOptions().find(
        (option) => option.blueprintId === "governed_data_foundation",
      ),
    ).toEqual({
      blueprintId: "governed_data_foundation",
      archetypeLabel: "Our Data Foundation",
      origin: "configured_override",
    });
    expect(
      normalizeDiscoveryArchetypeDeclaration("governed_data_foundation"),
    ).toBe("governed_data_foundation");
  });

  it("falls back to the shipped archetypes whole when the declared source is rejected", () => {
    // Valid JSON, invalid blueprint: the loader refuses the source rather than
    // applying the part of it that parsed.
    declareSource(
      JSON.stringify([
        { blueprintId: CONFIGURED_ADDITION_ID, archetypeLabel: "Half an entry" },
      ]),
    );

    const options = listEffectiveDiscoveryArchetypeOptions();
    expect(
      options.map(({ blueprintId, archetypeLabel }) => ({
        blueprintId,
        archetypeLabel,
      })),
    ).toEqual(listDiscoveryArchetypeOptions());
    expect(options.every((option) => option.origin === "seed")).toBe(true);
    expect(() =>
      normalizeDiscoveryArchetypeDeclaration(CONFIGURED_ADDITION_ID),
    ).toThrow("unknown_discovery_archetype");
  });

  it("falls back to the shipped archetypes when the declared path is unreadable", () => {
    process.env[ARCHETYPE_CONFIG_PATH_ENV] = path.join(
      sourceDir,
      "no-such-file.json",
    );

    expect(
      listEffectiveDiscoveryArchetypeOptions().every(
        (option) => option.origin === "seed",
      ),
    ).toBe(true);
    expect(() =>
      normalizeDiscoveryArchetypeDeclaration(CONFIGURED_ADDITION_ID),
    ).toThrow("unknown_discovery_archetype");
  });
});

// The origination screen is a server component behind Clerk and tenancy, so
// the one line that decides which catalog the picker is offered cannot be
// reached by rendering it. Asserted against the source instead — the same way
// this directory already pins `origination-submit.ts`'s insert contract — so
// that reverting the host to the shipped-only list fails a test rather than
// quietly un-wiring the whole feature. Both directions are asserted: naming the
// effective list is not enough if the seed-only list is still being called.
describe("the Move origination screen offers the effective catalog", () => {
  const source = fs.readFileSync(
    path.join(
      process.cwd(),
      "src/app/(maestro)/strategic-moves/new/page.tsx",
    ),
    "utf8",
  );

  it("passes the effective archetype options to the originate client", () => {
    expect(source).toContain(
      "discoveryArchetypeOptions={listEffectiveDiscoveryArchetypeOptions()}",
    );
    expect(source).toContain(
      'from "@/lib/deliverables/orchestrator/briefs/archetype-declaration-surface"',
    );
  });

  it("no longer offers the shipped-only archetype list", () => {
    expect(source).not.toContain("listDiscoveryArchetypeOptions");
  });
});
