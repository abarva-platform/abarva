import { describe, expect, it } from "@jest/globals";
import {
  validateClientProfileRowsWithinUpload,
  validateRateCardRowsAgainstReference,
  validateRoleAliasRowsAgainstReference,
  validateTechnologyCostRowsWithinUpload,
  type RateCardReferenceSnapshot,
} from "../semantic-validation";
import type {
  ClientPricingProfileCsvRow,
  ClientRateCardCsvRow,
  ClientRoleAliasCsvRow,
  ClientTechnologyCostCsvRow,
} from "../types";

const REFS: RateCardReferenceSnapshot = {
  taxonomyVersion: 1,
  roleCodes: new Set(["ROL-037", "ROL-038"]),
  rateBandCodes: new Set(["ROL-037-LVL-04"]),
  levelCodes: new Set(["LVL-04", "LVL-05"]),
};

function rateCardRow(overrides: Partial<ClientRateCardCsvRow>): ClientRateCardCsvRow {
  return {
    rowNumber: 1,
    roleOrBandRef: "ROL-037",
    level: "LVL-04",
    providerRef: null,
    locationRef: null,
    rateBasis: "client_negotiated",
    unit: "hour",
    rateValue: 400,
    currency: "USD",
    validFrom: "2026-08-01",
    validTo: null,
    ...overrides,
  };
}

describe("validateRateCardRowsAgainstReference", () => {
  it("accepts a role_or_band_ref that resolves via pricing_roles.role_code", () => {
    const { validRows, errors } = validateRateCardRowsAgainstReference([rateCardRow({})], REFS);
    expect(errors).toEqual([]);
    expect(validRows).toHaveLength(1);
  });

  it("accepts a role_or_band_ref that resolves via pricing_rate_bands.rate_band_code", () => {
    const { validRows, errors } = validateRateCardRowsAgainstReference(
      [rateCardRow({ roleOrBandRef: "ROL-037-LVL-04", level: null })],
      REFS,
    );
    expect(errors).toEqual([]);
    expect(validRows).toHaveLength(1);
  });

  it("rejects a role_or_band_ref that resolves to neither", () => {
    const { validRows, errors } = validateRateCardRowsAgainstReference(
      [rateCardRow({ rowNumber: 2, roleOrBandRef: "ROL-999" })],
      REFS,
    );
    expect(validRows).toHaveLength(0);
    expect(errors).toEqual([
      expect.objectContaining({
        rowNumber: 2,
        field: "role_or_band_ref",
        code: "unresolved_role_or_band_ref",
      }),
    ]);
  });

  it("rejects an unresolved level even when role_or_band_ref is valid", () => {
    const { validRows, errors } = validateRateCardRowsAgainstReference(
      [rateCardRow({ rowNumber: 3, level: "LVL-99" })],
      REFS,
    );
    expect(validRows).toHaveLength(0);
    expect(errors).toEqual([
      expect.objectContaining({ rowNumber: 3, field: "level", code: "unresolved_level" }),
    ]);
  });

  it("flags the second occurrence of a duplicate identity key, keeping the first", () => {
    const rows = [
      rateCardRow({ rowNumber: 1 }),
      rateCardRow({ rowNumber: 2 }), // identical identity key to row 1
    ];
    const { validRows, errors } = validateRateCardRowsAgainstReference(rows, REFS);
    expect(validRows).toHaveLength(1);
    expect(validRows[0].rowNumber).toBe(1);
    expect(errors).toEqual([
      expect.objectContaining({ rowNumber: 2, code: "duplicate_row" }),
    ]);
  });

  it("does not treat rows differing only by location_ref as duplicates", () => {
    const rows = [
      rateCardRow({ rowNumber: 1, locationRef: "LOC-A" }),
      rateCardRow({ rowNumber: 2, locationRef: "LOC-B" }),
    ];
    const { validRows, errors } = validateRateCardRowsAgainstReference(rows, REFS);
    expect(errors).toEqual([]);
    expect(validRows).toHaveLength(2);
  });
});

describe("validateClientProfileRowsWithinUpload", () => {
  function profileRow(overrides: Partial<ClientPricingProfileCsvRow>): ClientPricingProfileCsvRow {
    return {
      rowNumber: 1,
      assumptionKey: "offshore_ratio_default",
      assumptionValue: 0.35,
      unitHint: null,
      notes: null,
      ...overrides,
    };
  }

  it("flags a duplicate assumption_key within the same upload", () => {
    const rows = [profileRow({ rowNumber: 1 }), profileRow({ rowNumber: 2, assumptionValue: 0.5 })];
    const { validRows, errors } = validateClientProfileRowsWithinUpload(rows);
    expect(validRows).toHaveLength(1);
    expect(errors).toEqual([
      expect.objectContaining({ rowNumber: 2, field: "assumption_key", code: "duplicate_row" }),
    ]);
  });
});

describe("validateRoleAliasRowsAgainstReference", () => {
  function aliasRow(overrides: Partial<ClientRoleAliasCsvRow>): ClientRoleAliasCsvRow {
    return {
      rowNumber: 1,
      aliasLabel: "Senior Data Engineer",
      roleCode: "ROL-037",
      aliasType: "client_naming",
      notes: null,
      ...overrides,
    };
  }

  it("rejects an alias whose role_code does not resolve", () => {
    const { validRows, errors } = validateRoleAliasRowsAgainstReference(
      [aliasRow({ roleCode: "ROL-999" })],
      REFS,
    );
    expect(validRows).toHaveLength(0);
    expect(errors[0]).toMatchObject({ field: "role_code", code: "unresolved_role_code" });
  });

  it("flags a case/whitespace-equivalent duplicate alias label", () => {
    const rows = [
      aliasRow({ rowNumber: 1, aliasLabel: "Senior Data Engineer" }),
      aliasRow({ rowNumber: 2, aliasLabel: "  senior data engineer  " }),
    ];
    const { validRows, errors } = validateRoleAliasRowsAgainstReference(rows, REFS);
    expect(validRows).toHaveLength(1);
    expect(errors[0]).toMatchObject({ rowNumber: 2, code: "duplicate_row" });
  });
});

describe("validateTechnologyCostRowsWithinUpload", () => {
  function costRow(overrides: Partial<ClientTechnologyCostCsvRow>): ClientTechnologyCostCsvRow {
    return {
      rowNumber: 1,
      costKey: "ai_platform_license_annual_usd",
      costValue: 180000,
      unit: "usd_per_year",
      notes: null,
      ...overrides,
    };
  }

  it("flags a duplicate cost_key within the same upload", () => {
    const rows = [costRow({ rowNumber: 1 }), costRow({ rowNumber: 2, costValue: 200000 })];
    const { validRows, errors } = validateTechnologyCostRowsWithinUpload(rows);
    expect(validRows).toHaveLength(1);
    expect(errors[0]).toMatchObject({ rowNumber: 2, field: "cost_key", code: "duplicate_row" });
  });
});
