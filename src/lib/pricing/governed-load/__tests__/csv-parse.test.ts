import { describe, expect, it } from "@jest/globals";
import {
  parseClientPricingProfileCsv,
  parseClientRateCardCsv,
  parseClientRoleAliasesCsv,
  parseClientTechnologyCostsCsv,
} from "../csv-parse";

const HEADER =
  "role_or_band_ref,level,provider_ref,location_ref,rate_basis,unit,rate_value,currency,valid_from,valid_to";

describe("parseClientRateCardCsv", () => {
  it("parses a fully valid row", () => {
    const csv = [
      HEADER,
      "ROL-037,LVL-04,,LOC-US-EAST,client_negotiated,hour,410.00,USD,2026-08-01,",
    ].join("\n");
    const result = parseClientRateCardCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      rowNumber: 1,
      roleOrBandRef: "ROL-037",
      level: "LVL-04",
      providerRef: null,
      locationRef: "LOC-US-EAST",
      rateBasis: "client_negotiated",
      unit: "hour",
      rateValue: 410,
      currency: "USD",
      validFrom: "2026-08-01",
      validTo: null,
    });
  });

  it("defaults currency to USD when omitted", () => {
    const csv = [HEADER, "ROL-037,,,,client_negotiated,hour,410,,2026-08-01,"].join("\n");
    const result = parseClientRateCardCsv(csv);
    expect(result.rows[0]?.currency).toBe("USD");
  });

  it("collects ALL row-level errors rather than stopping at the first bad row", () => {
    const csv = [
      HEADER,
      "ROL-037,LVL-04,,,client_negotiated,hour,410,USD,2026-08-01,", // valid
      ",LVL-04,,,client_negotiated,hour,410,USD,2026-08-01,", // missing role_or_band_ref
      "ROL-038,LVL-04,,,client_negotiated,hour,not-a-number,USD,2026-08-01,", // bad rate_value
      "ROL-039,LVL-04,,,client_negotiated,hour,410,USD,not-a-date,", // bad valid_from
    ].join("\n");
    const result = parseClientRateCardCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(3);
    expect(result.errors.map((e) => e.rowNumber)).toEqual([2, 3, 4]);
    expect(result.errors[0]).toMatchObject({ field: "role_or_band_ref", code: "required_field_missing" });
    expect(result.errors[1]).toMatchObject({ field: "rate_value", code: "invalid_number" });
    expect(result.errors[2]).toMatchObject({ field: "valid_from", code: "invalid_date" });
  });

  it("rejects a negative rate_value", () => {
    const csv = [HEADER, "ROL-037,,,,client_negotiated,hour,-5,USD,2026-08-01,"].join("\n");
    const result = parseClientRateCardCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toMatchObject({ field: "rate_value", code: "invalid_number" });
  });
});

describe("parseClientPricingProfileCsv", () => {
  it("parses assumption_value as JSON when it looks numeric/boolean", () => {
    const csv = [
      "assumption_key,assumption_value,unit_hint,notes",
      "offshore_ratio_default,0.35,ratio_0_to_1,default blend",
      "auto_renew_enabled,true,,",
    ].join("\n");
    const result = parseClientPricingProfileCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        rowNumber: 1,
        assumptionKey: "offshore_ratio_default",
        assumptionValue: 0.35,
        unitHint: "ratio_0_to_1",
        notes: "default blend",
      },
      {
        rowNumber: 2,
        assumptionKey: "auto_renew_enabled",
        assumptionValue: true,
        unitHint: null,
        notes: null,
      },
    ]);
  });

  it("keeps a non-JSON assumption_value as a plain string", () => {
    const csv = ["assumption_key,assumption_value,unit_hint,notes", "discount_tier,gold,,"].join("\n");
    const result = parseClientPricingProfileCsv(csv);
    expect(result.rows[0]?.assumptionValue).toBe("gold");
  });

  it("flags a missing required field", () => {
    const csv = ["assumption_key,assumption_value,unit_hint,notes", ",0.35,,"].join("\n");
    const result = parseClientPricingProfileCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toMatchObject({ field: "assumption_key", code: "required_field_missing" });
  });
});

describe("parseClientRoleAliasesCsv", () => {
  it("parses valid rows and defaults alias_type", () => {
    const csv = ["alias_label,role_code,alias_type,notes", "Senior Data Engineer,ROL-037,,client naming"].join(
      "\n",
    );
    const result = parseClientRoleAliasesCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      aliasLabel: "Senior Data Engineer",
      roleCode: "ROL-037",
      aliasType: "client_naming",
      notes: "client naming",
    });
  });
});

describe("parseClientTechnologyCostsCsv", () => {
  it("parses valid rows", () => {
    const csv = [
      "cost_key,cost_value,unit,notes",
      "ai_platform_license_annual_usd,180000,usd_per_year,negotiated",
    ].join("\n");
    const result = parseClientTechnologyCostsCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      costKey: "ai_platform_license_annual_usd",
      costValue: 180000,
      unit: "usd_per_year",
      notes: "negotiated",
    });
  });

  it("flags an invalid cost_value", () => {
    const csv = ["cost_key,cost_value,unit,notes", "ai_platform_license_annual_usd,abc,usd_per_year,"].join(
      "\n",
    );
    const result = parseClientTechnologyCostsCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toMatchObject({ field: "cost_value", code: "invalid_number" });
  });
});
