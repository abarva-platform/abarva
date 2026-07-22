import {
  buildToolProgramCrosswalk,
  type ToolIdentityAlias,
} from "../tool-identity-crosswalk";

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
