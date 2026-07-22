import {
  buildToolProgramCrosswalk,
  type ToolIdentityAlias,
} from "../tool-identity-crosswalk";
import { programKeyFromCode } from "../facts-from-v3";

const ALIASES: ToolIdentityAlias[] = [
  {
    tenant_key: "meridian-health",
    canonical_tool_key: "tool::github-copilot",
    alias: "GitHub Copilot",
    vendor_name: "GitHub",
    system_name: "GitHub Copilot",
    program_code: "PROG-COPILOT",
    canonical_program_key: "program::copilot-productivity",
    active: true,
  },
  {
    tenant_key: "meridian-health",
    canonical_tool_key: "tool::github-copilot",
    alias: "Copilot Enterprise",
    vendor_name: "GitHub",
    system_name: "GitHub Copilot",
    program_code: "PROG-COPILOT",
    canonical_program_key: "program::copilot-productivity",
    active: true,
  },
  {
    tenant_key: "other-tenant",
    canonical_tool_key: "tool::github-copilot",
    alias: "GitHub Copilot",
    vendor_name: "GitHub",
    system_name: "GitHub Copilot",
    program_code: "OTHER-PROG",
    canonical_program_key: "program::other",
    active: true,
  },
];

describe("buildToolProgramCrosswalk", () => {
  it("resolves a canonical tool key to its funded program for the tenant", () => {
    const { crosswalk } = buildToolProgramCrosswalk(ALIASES, "meridian-health");
    const link = crosswalk.resolve("tool::github-copilot");
    expect(link?.programKey).toBe("program::copilot-productivity");
    expect(link?.programCode).toBe("PROG-COPILOT");
  });

  it("scopes strictly by tenant — another tenant's alias never leaks", () => {
    const { crosswalk } = buildToolProgramCrosswalk(ALIASES, "meridian-health");
    expect(crosswalk.size).toBe(1); // both meridian rows collapse to one tool key
    const other = buildToolProgramCrosswalk(ALIASES, "other-tenant");
    expect(other.crosswalk.resolve("tool::github-copilot")?.programKey).toBe(
      "program::other",
    );
  });

  it("returns null for an unmapped tool and for null input", () => {
    const { crosswalk } = buildToolProgramCrosswalk(ALIASES, "meridian-health");
    expect(crosswalk.resolve("tool::unknown")).toBeNull();
    expect(crosswalk.resolve(null)).toBeNull();
  });

  it("ignores inactive rows and rows with no program link", () => {
    const rows: ToolIdentityAlias[] = [
      { ...ALIASES[0], active: false },
      {
        ...ALIASES[0],
        canonical_tool_key: "tool::cursor",
        canonical_program_key: null,
        program_code: null,
      },
    ];
    const { crosswalk } = buildToolProgramCrosswalk(rows, "meridian-health");
    expect(crosswalk.size).toBe(0);
  });

  it("reports a conflict when one tool maps to two different programs", () => {
    const rows: ToolIdentityAlias[] = [
      ALIASES[0],
      {
        ...ALIASES[0],
        alias: "x",
        canonical_program_key: "program::different",
        program_code: "PROG-DIFF",
      },
    ];
    const { crosswalk, conflicts } = buildToolProgramCrosswalk(
      rows,
      "meridian-health",
    );
    // first wins, conflict surfaced (not silently merged)
    expect(crosswalk.resolve("tool::github-copilot")?.programKey).toBe(
      "program::copilot-productivity",
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toContain("program::different");
  });
});

// Guards the seed migration 20260721161000_cio_tower_meridian_tool_aliases_seed.sql
// against the deterministic program-key slug: if programKeyFromCode() ever
// changes, the hardcoded canonical_program_key values in the SQL seed would
// silently stop resolving. This test fails loudly instead.
describe("Meridian alias seed ↔ programKeyFromCode agreement", () => {
  const SEED: Array<[string, string]> = [
    ["tool::github-copilot", "PROG-DEV-PRODUCTIVITY"],
    ["tool::claude-code", "PROG-DEV-PRODUCTIVITY"],
    ["tool::cursor", "PROG-DEV-PRODUCTIVITY"],
    ["tool::m365-copilot", "PROG-COPILOT-ADOPT"],
    ["tool::servicenow-ai", "PROG-SNOW-AI"],
    ["tool::workday-ai", "PROG-WORKDAY-AI"],
  ];
  const SEED_PROGRAM_KEYS: Record<string, string> = {
    "PROG-DEV-PRODUCTIVITY": "program::prog-dev-productivity",
    "PROG-COPILOT-ADOPT": "program::prog-copilot-adopt",
    "PROG-SNOW-AI": "program::prog-snow-ai",
    "PROG-WORKDAY-AI": "program::prog-workday-ai",
  };

  it("the seed's canonical_program_key values match programKeyFromCode()", () => {
    for (const code of Object.keys(SEED_PROGRAM_KEYS)) {
      expect(programKeyFromCode(code)).toBe(SEED_PROGRAM_KEYS[code]);
    }
  });

  it("the seeded aliases build a crosswalk that resolves each tool to its program", () => {
    const rows: ToolIdentityAlias[] = SEED.map(([toolKey, code]) => ({
      tenant_key: "meridian-health",
      canonical_tool_key: toolKey,
      alias: toolKey,
      vendor_name: null,
      system_name: null,
      program_code: code,
      canonical_program_key: programKeyFromCode(code),
      active: true,
    }));
    const { crosswalk, conflicts } = buildToolProgramCrosswalk(
      rows,
      "meridian-health",
    );
    expect(conflicts).toHaveLength(0);
    expect(crosswalk.resolve("tool::github-copilot")?.programKey).toBe(
      "program::prog-dev-productivity",
    );
    expect(crosswalk.resolve("tool::servicenow-ai")?.programCode).toBe(
      "PROG-SNOW-AI",
    );
  });
});
