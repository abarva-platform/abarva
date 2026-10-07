// A configured archetype source that validates is not therefore a source that
// does what its author meant. These pin the three cases the loader reports
// identically — an override, an addition nothing can declare, and the same id
// twice — and, for the addition, they pin the preflight's reachability claim
// against the REAL resolver rather than restating it. If a later slice makes an
// added archetype reachable by declaration, the resolver cases here fail and
// force this report to be corrected with it.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  archetypeConfigPreflightPasses,
  formatArchetypeConfigPreflight,
  nearestShippedArchetypeId,
  preflightArchetypeConfig,
} from "../briefs/archetype-config-preflight";
import {
  ARCHETYPE_CONFIG_PATH_ENV,
  resolveConfiguredDiscoveryBlueprint,
  type ArchetypeConfigEnv,
} from "../briefs/archetype-config-source";
import {
  DISCOVERY_BLUEPRINT_CATALOG,
  getDiscoveryBlueprint,
} from "../briefs/discovery-blueprint";

const SHIPPED_ID = "governed_data_foundation";
const ADDED_ID = "manufacturing_quality_ops";

let tmpDir: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "archetype-preflight-"));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function blueprint(blueprintId: string, label: string) {
  return {
    blueprintId,
    blueprintVersion: "configured-1",
    archetypeLabel: label,
    evidenceFamilies: [
      {
        id: "configured_family",
        label: "Configured evidence family",
        grounds: "Current-State Assessment",
        required: true,
        likelySource: "Practice owner",
        format: "Doc",
      },
    ],
    interviewRoster: [
      {
        role: "Configured practice lead",
        side: "business",
        objectives: "Confirm the configured scope.",
        questions: ["What does this practice always ask first?"],
      },
    ],
  };
}

function envFor(name: string, source: unknown): ArchetypeConfigEnv {
  const file = path.join(tmpDir, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(source), "utf8");
  return { [ARCHETYPE_CONFIG_PATH_ENV]: file };
}

describe("an undeclared source", () => {
  it("is reported as not configured, with no entries", () => {
    const report = preflightArchetypeConfig({});
    expect(report.state).toBe("not_configured");
    expect(report.entries).toEqual([]);
    expect(report.sourcePath).toBeNull();
    expect(report.inertArchetypeIds).toEqual([]);
    expect(report.collidingArchetypeIds).toEqual([]);
  });

  it("says the built-in archetypes are in force rather than printing nothing", () => {
    const text = formatArchetypeConfigPreflight(preflightArchetypeConfig({}));
    expect(text).toMatch(/No archetype source is declared/i);
    expect(text).toMatch(/built-in archetypes are in force/i);
  });
});

describe("an entry that names a shipped archetype id", () => {
  const env = () =>
    envFor("override", [blueprint(SHIPPED_ID, "Configured override")]);

  it("is classified as an override, and as reachable", () => {
    const report = preflightArchetypeConfig(env());
    expect(report.state).toBe("in_effect");
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0]).toMatchObject({
      index: 0,
      blueprintId: SHIPPED_ID,
      outcome: "overrides_shipped",
      reachableByDeclaration: true,
      nearestShippedId: null,
    });
    expect(report.inertArchetypeIds).toEqual([]);
  });

  it("is reachable BY THE REAL RESOLVER, which is what the claim means", () => {
    const resolution = resolveConfiguredDiscoveryBlueprint(
      getDiscoveryBlueprint(SHIPPED_ID, SHIPPED_ID),
      env(),
    );
    expect(resolution.overrodeSeed).toBe(true);
    expect(resolution.blueprint.archetypeLabel).toBe("Configured override");
  });

  it("reads as taking effect, naming the id", () => {
    const text = formatArchetypeConfigPreflight(preflightArchetypeConfig(env()));
    expect(text).toContain(SHIPPED_ID);
    expect(text).toMatch(/overrides the built-in archetype/i);
    expect(text).not.toMatch(/NOTHING CAN DECLARE/);
  });
});

describe("an entry that adds a new archetype id", () => {
  const env = () => envFor("added", [blueprint(ADDED_ID, "Configured addition")]);

  it("is classified as an inert addition, not as an override", () => {
    const report = preflightArchetypeConfig(env());
    expect(report.state).toBe("in_effect");
    expect(report.entries[0]).toMatchObject({
      blueprintId: ADDED_ID,
      outcome: "adds_inert",
      reachableByDeclaration: false,
    });
    expect(report.inertArchetypeIds).toEqual([ADDED_ID]);
  });

  it("is in fact unreachable by declaration — the resolver proves the claim", () => {
    const resolution = resolveConfiguredDiscoveryBlueprint(
      getDiscoveryBlueprint(ADDED_ID, ADDED_ID),
      env(),
    );
    expect(resolution.overrodeSeed).toBe(false);
    expect(resolution.blueprint.archetypeLabel).not.toBe("Configured addition");
    expect(
      Object.keys(DISCOVERY_BLUEPRINT_CATALOG).includes(
        resolution.blueprint.blueprintId,
      ),
    ).toBe(true);
  });

  it("states the consequence, not only the mechanism", () => {
    const text = formatArchetypeConfigPreflight(preflightArchetypeConfig(env()));
    expect(text).toMatch(/NOTHING CAN DECLARE/);
    expect(text).toContain(ADDED_ID);
  });

  it("carries no near-miss when nothing shipped resembles it", () => {
    expect(preflightArchetypeConfig(env()).entries[0].nearestShippedId).toBeNull();
    expect(
      formatArchetypeConfigPreflight(preflightArchetypeConfig(env())),
    ).not.toMatch(/Did you mean/);
  });
});

describe("a one-character typo in an intended override", () => {
  const typo = `${SHIPPED_ID.slice(0, -1)}s`;
  const env = () => envFor("typo", [blueprint(typo, "Meant to override")]);

  it("is an addition, which is the whole defect this report exists for", () => {
    const report = preflightArchetypeConfig(env());
    expect(report.entries[0].outcome).toBe("adds_inert");
    expect(report.entries[0].reachableByDeclaration).toBe(false);
  });

  it("names the shipped id it nearly matched", () => {
    const report = preflightArchetypeConfig(env());
    expect(report.entries[0].nearestShippedId).toBe(SHIPPED_ID);
    expect(formatArchetypeConfigPreflight(report)).toContain(
      `Did you mean ${SHIPPED_ID}?`,
    );
  });

  it("leaves the shipped archetype itself untouched", () => {
    const resolution = resolveConfiguredDiscoveryBlueprint(
      getDiscoveryBlueprint(SHIPPED_ID, SHIPPED_ID),
      env(),
    );
    expect(resolution.overrodeSeed).toBe(false);
    expect(resolution.blueprint.archetypeLabel).toBe(
      DISCOVERY_BLUEPRINT_CATALOG[SHIPPED_ID].archetypeLabel,
    );
  });
});

describe("the same id declared twice in one source", () => {
  const env = () =>
    envFor("duplicate", [
      blueprint(SHIPPED_ID, "First entry"),
      blueprint(SHIPPED_ID, "Second entry"),
    ]);

  it("reports the earlier entry as replaced, and the later one as the override", () => {
    const report = preflightArchetypeConfig(env());
    expect(report.entries.map((entry) => entry.outcome)).toEqual([
      "replaced_by_later_entry",
      "overrides_shipped",
    ]);
    expect(report.entries[0].reachableByDeclaration).toBe(false);
    expect(report.entries[1].reachableByDeclaration).toBe(true);
    expect(report.collidingArchetypeIds).toEqual([SHIPPED_ID]);
  });

  it("the later entry is the one the resolver hands back", () => {
    const resolution = resolveConfiguredDiscoveryBlueprint(
      getDiscoveryBlueprint(SHIPPED_ID, SHIPPED_ID),
      env(),
    );
    expect(resolution.blueprint.archetypeLabel).toBe("Second entry");
  });

  it("says which entry is ignored", () => {
    const text = formatArchetypeConfigPreflight(preflightArchetypeConfig(env()));
    expect(text).toMatch(/\[0\] .* IGNORED: a later entry/);
    expect(text).toMatch(/declared more than once/i);
  });
});

describe("a rejected source", () => {
  it("reports the errors and claims no entries at all", () => {
    const report = preflightArchetypeConfig(
      envFor("rejected", [{ blueprintId: "no_families_here" }]),
    );
    expect(report.state).toBe("rejected");
    expect(report.entries).toEqual([]);
    expect(report.errors.length).toBeGreaterThan(0);
    const text = formatArchetypeConfigPreflight(report);
    expect(text).toMatch(/REJECTED/);
    expect(text).toMatch(/built-in archetypes are in force, unchanged/i);
  });

  it("is distinguishable in the output from declaring nothing", () => {
    const rejected = formatArchetypeConfigPreflight(
      preflightArchetypeConfig(envFor("rejected2", { not: "an array" })),
    );
    const absent = formatArchetypeConfigPreflight(preflightArchetypeConfig({}));
    expect(rejected).not.toBe(absent);
    expect(rejected).toMatch(/REJECTED/);
  });
});

describe("the deploy verdict", () => {
  it("passes when nothing is declared", () => {
    expect(archetypeConfigPreflightPasses(preflightArchetypeConfig({}))).toBe(
      true,
    );
  });

  it("passes when every entry overrides a shipped archetype", () => {
    const report = preflightArchetypeConfig(
      envFor("verdict-override", [blueprint(SHIPPED_ID, "Configured override")]),
    );
    expect(archetypeConfigPreflightPasses(report)).toBe(true);
  });

  it("fails on an unreachable addition", () => {
    const report = preflightArchetypeConfig(
      envFor("verdict-added", [blueprint(ADDED_ID, "Configured addition")]),
    );
    expect(archetypeConfigPreflightPasses(report)).toBe(false);
  });

  it("fails on an id declared twice, even though both entries validate", () => {
    const report = preflightArchetypeConfig(
      envFor("verdict-dup", [
        blueprint(SHIPPED_ID, "First"),
        blueprint(SHIPPED_ID, "Second"),
      ]),
    );
    expect(report.state).toBe("in_effect");
    expect(archetypeConfigPreflightPasses(report)).toBe(false);
  });

  it("fails on a rejected source", () => {
    const report = preflightArchetypeConfig(
      envFor("verdict-rejected", [{ blueprintId: "nothing_else" }]),
    );
    expect(archetypeConfigPreflightPasses(report)).toBe(false);
  });
});

describe("the near-miss threshold, measured against the real shipped ids", () => {
  const shippedIds = Object.keys(DISCOVERY_BLUEPRINT_CATALOG);

  it("holds five shipped ids, so the threshold is measured and not assumed", () => {
    expect(shippedIds).toHaveLength(5);
  });

  it("fires on every single-character mutation of every shipped id", () => {
    for (const shippedId of shippedIds) {
      const dropped = shippedId.slice(1);
      const doubled = `${shippedId}${shippedId.slice(-1)}`;
      expect(nearestShippedArchetypeId(dropped, shippedIds)).toBe(shippedId);
      expect(nearestShippedArchetypeId(doubled, shippedIds)).toBe(shippedId);
    }
  });

  it("does NOT fire between two shipped ids — no shipped pair is a near-miss", () => {
    for (const shippedId of shippedIds) {
      const others = shippedIds.filter((other) => other !== shippedId);
      expect(nearestShippedArchetypeId(shippedId, others)).toBeNull();
    }
  });

  it("stops firing one edit past the threshold, which is where the bar is", () => {
    // Two is a typo; three is a different word. Without this the threshold
    // could be loosened to any value below the shipped ids' own separation and
    // no case would notice.
    for (const shippedId of shippedIds) {
      const twoEdits = shippedId.slice(2);
      const threeEdits = shippedId.slice(3);
      expect(nearestShippedArchetypeId(twoEdits, shippedIds)).toBe(shippedId);
      expect(nearestShippedArchetypeId(threeEdits, shippedIds)).toBeNull();
    }
  });

  it("does not fire on a plausible new archetype name", () => {
    for (const candidate of [
      "manufacturing_quality_ops",
      "retail_merchandising_assist",
      "public_sector_case_triage",
    ]) {
      expect(nearestShippedArchetypeId(candidate, shippedIds)).toBeNull();
    }
  });
});
