import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import { readCsv } from "../csv-utils";
import {
  type AliasRow,
  type CapabilityRow,
  type CoverageInput,
  type RateBandRow,
  type RoleRow,
  type SeniorityLevelRow,
  type TowerRow,
  validateCoverage,
} from "../validate-pricing-role-coverage";

const REFERENCE_PACK_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "datasets",
  "reference",
  "pricing-engine-v1",
);

function loadRealPack(): CoverageInput {
  return {
    towers: readCsv(path.join(REFERENCE_PACK_DIR, "pricing_towers.csv")) as unknown as TowerRow[],
    capabilities: readCsv(
      path.join(REFERENCE_PACK_DIR, "pricing_capabilities.csv"),
    ) as unknown as CapabilityRow[],
    roles: readCsv(path.join(REFERENCE_PACK_DIR, "pricing_roles.csv")) as unknown as RoleRow[],
    aliases: readCsv(
      path.join(REFERENCE_PACK_DIR, "pricing_role_aliases.csv"),
    ) as unknown as AliasRow[],
    levels: readCsv(
      path.join(REFERENCE_PACK_DIR, "pricing_seniority_levels.csv"),
    ) as unknown as SeniorityLevelRow[],
    rateBands: readCsv(
      path.join(REFERENCE_PACK_DIR, "pricing_rate_bands.csv"),
    ) as unknown as RateBandRow[],
  };
}

// ---------------------------------------------------------------------------
// A minimal, valid synthetic fixture that satisfies every check on its own
// (10 levels, 1 tower, 1 capability, 1 role with a rate band) — individual
// tests below mutate a copy of this baseline to trigger exactly one failure
// mode at a time, proving each check actually fires.
// ---------------------------------------------------------------------------
const LEVELS: SeniorityLevelRow[] = [
  { level_name: "Partner", rank: "1", status: "active" },
  { level_name: "Managing Director", rank: "2", status: "active" },
  { level_name: "Principal", rank: "3", status: "active" },
  { level_name: "Director", rank: "4", status: "active" },
  { level_name: "Senior Manager", rank: "5", status: "active" },
  { level_name: "Manager", rank: "6", status: "active" },
  { level_name: "Lead", rank: "7", status: "active" },
  { level_name: "Senior", rank: "8", status: "active" },
  { level_name: "Intermediate", rank: "9", status: "active" },
  { level_name: "Junior", rank: "10", status: "active" },
];

function baselineFixture(): CoverageInput {
  return {
    towers: [{ tower_code: "TWR-01", status: "active" }],
    capabilities: [{ capability_code: "CAP-001", tower_code: "TWR-01", status: "active" }],
    roles: [
      {
        role_code: "ROL-001",
        tower_code: "TWR-01",
        capability_code: "CAP-001",
        allowed_level_min: "Senior",
        allowed_level_max: "Lead",
        status: "active",
      },
    ],
    aliases: [{ alias_code: "ALIAS-0001", role_code: "ROL-001", alias_label: "Test Alias", status: "active" }],
    levels: LEVELS.map((l) => ({ ...l })),
    rateBands: [{ role_code: "ROL-001", status: "active" }],
  };
}

describe("validateCoverage — real committed reference pack", () => {
  it("passes with zero errors against the actual PR1 CSVs", () => {
    const input = loadRealPack();
    const result = validateCoverage(input);
    if (result.errors.length > 0) {
      console.error(result.errors);
    }
    expect(result.errors).toEqual([]);
  });

  it("clears the brief §4.3 numeric floors (>=220 roles, >=18 towers, >=65 capabilities)", () => {
    const input = loadRealPack();
    const result = validateCoverage(input);
    expect(result.summary.roleCount).toBeGreaterThanOrEqual(220);
    expect(result.summary.towerCount).toBeGreaterThanOrEqual(18);
    expect(result.summary.capabilityCount).toBeGreaterThanOrEqual(65);
  });
});

describe("validateCoverage — synthetic failure-mode fixtures", () => {
  it("passes on the untouched baseline fixture (sanity check for the fixtures below)", () => {
    // The baseline is below the numeric floors by design (it's a minimal
    // fixture, not a full pack) — floor violations are tested separately,
    // so here we only assert the *other* checks are clean.
    const result = validateCoverage(baselineFixture());
    const nonFloorErrors = result.errors.filter((e) => !e.includes("floor violated"));
    expect(nonFloorErrors).toEqual([]);
  });

  it("fails on a duplicate role code", () => {
    const input = baselineFixture();
    input.roles.push({ ...input.roles[0] });
    const result = validateCoverage(input);
    expect(result.errors.some((e) => /Duplicate role_code "ROL-001"/.test(e))).toBe(true);
  });

  it("fails on an invalid tower reference", () => {
    const input = baselineFixture();
    input.roles[0].tower_code = "TWR-999";
    const result = validateCoverage(input);
    expect(
      result.errors.some((e) => /Role "ROL-001" references unknown tower_code "TWR-999"/.test(e)),
    ).toBe(true);
  });

  it("fails on an invalid capability reference", () => {
    const input = baselineFixture();
    input.roles[0].capability_code = "CAP-999";
    const result = validateCoverage(input);
    expect(
      result.errors.some((e) =>
        /Role "ROL-001" references unknown capability_code "CAP-999"/.test(e),
      ),
    ).toBe(true);
  });

  it("fails on an inverted allowed-level range (min more senior than max)", () => {
    const input = baselineFixture();
    // Director (rank 4, more senior) as the "min" (least-senior) bound, with
    // Senior (rank 8, less senior) as "max" (most-senior bound) — inverted.
    input.roles[0].allowed_level_min = "Director";
    input.roles[0].allowed_level_max = "Senior";
    const result = validateCoverage(input);
    expect(result.errors.some((e) => /inverted allowed-level range/.test(e))).toBe(true);
  });

  it("fails when an allowed level references a level not in pricing_seniority_levels.csv", () => {
    const input = baselineFixture();
    input.roles[0].allowed_level_max = "Apprentice";
    const result = validateCoverage(input);
    expect(
      result.errors.some((e) =>
        /allowed_level_max "Apprentice" not present in pricing_seniority_levels.csv/.test(e),
      ),
    ).toBe(true);
  });

  it("fails when an active role has no rate band and is not flagged no_default_rate", () => {
    const input = baselineFixture();
    input.rateBands = [];
    const result = validateCoverage(input);
    expect(
      result.errors.some((e) => /Role "ROL-001".*has no pricing_rate_bands\.csv row/.test(e)),
    ).toBe(true);
  });

  it("does NOT fail on a missing rate band when the role is explicitly flagged no_default_rate", () => {
    const input = baselineFixture();
    input.rateBands = [];
    input.roles[0].status = "no_default_rate";
    const result = validateCoverage(input);
    expect(result.errors.some((e) => /has no pricing_rate_bands\.csv row/.test(e))).toBe(false);
  });

  it("fails on an ambiguous alias mapping to more than one active role", () => {
    const input = baselineFixture();
    input.towers.push({ tower_code: "TWR-02", status: "active" });
    input.capabilities.push({ capability_code: "CAP-002", tower_code: "TWR-02", status: "active" });
    input.roles.push({
      role_code: "ROL-002",
      tower_code: "TWR-02",
      capability_code: "CAP-002",
      allowed_level_min: "Senior",
      allowed_level_max: "Lead",
      status: "active",
    });
    input.rateBands.push({ role_code: "ROL-002", status: "active" });
    // Same alias label as ROL-001's alias, now also pointing at ROL-002.
    input.aliases.push({
      alias_code: "ALIAS-0002",
      role_code: "ROL-002",
      alias_label: "Test Alias",
      status: "active",
    });
    const result = validateCoverage(input);
    expect(result.errors.some((e) => /Ambiguous alias "test alias"/.test(e))).toBe(true);
  });

  it("fails below the role/tower/capability numeric floors", () => {
    const input = baselineFixture();
    const result = validateCoverage(input);
    expect(result.errors.some((e) => /Role count floor violated/.test(e))).toBe(true);
    expect(result.errors.some((e) => /Tower count floor violated/.test(e))).toBe(true);
    expect(result.errors.some((e) => /Capability count floor violated/.test(e))).toBe(true);
  });
});
