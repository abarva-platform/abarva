import {
  getRateCardTemplateByObjectType,
  RATE_CARD_TEMPLATE_DEFINITIONS,
} from "../rate-card-templates";
import {
  parseGeoModifierRows,
  parseInternalRateCardRows,
  parseVendorRateCardRows,
} from "../rate-card-row-parser";
import { validateInternalRateRows } from "../rate-card-ingestion";

const STRUCTURED_FORMATS = ["csv", "xlsx", "json"] as const;

describe("rate-card templates", () => {
  it("registers the three governed rate-card intake objects", () => {
    expect(
      RATE_CARD_TEMPLATE_DEFINITIONS.map((template) => template.objectType),
    ).toEqual(["rate_card_internal", "rate_card_vendor", "geo_modifier"]);

    expect(
      RATE_CARD_TEMPLATE_DEFINITIONS.every((template) =>
        STRUCTURED_FORMATS.every((format) =>
          template.acceptedFormats.includes(format),
        ),
      ),
    ).toBe(true);
  });

  it("keeps rate-card object ownership explicit", () => {
    expect(getRateCardTemplateByObjectType("rate_card_internal")).toMatchObject(
      {
        tenantScoped: true,
        segmentFamily: "resource_rate_card",
        ownerRole: "CFO / IT finance",
      },
    );
    expect(getRateCardTemplateByObjectType("geo_modifier")).toMatchObject({
      tenantScoped: false,
      segmentFamily: "geo_modifier",
    });
  });
});

describe("rate-card row parser", () => {
  it("normalizes internal rate-card rows from human workbook headers", () => {
    const parsed = parseInternalRateCardRows([
      {
        "Function Group": "data/analytics",
        Specialization: "Data Engineer (Spark/Python)",
        Level: "senior",
        "Base Annual Low USD": "$140,000",
        "Base Annual High USD": "$180,000",
        "Benefits Overhead Pct": "42.65%",
        Source: "BLS OEWS + ECEC",
        "As Of": "2026-06-03",
        Confidence: "medium",
      },
    ]);

    expect(parsed.validation.valid).toBe(true);
    expect(parsed.rows[0]).toMatchObject({
      functionGroup: "Data/Analytics",
      roleLevel: "Senior",
      baseAnnualLowUsd: 140_000,
      baseAnnualHighUsd: 180_000,
      benefitsOverheadPct: 0.4265,
    });
  });

  it("normalizes vendor rows and leaves optional vendor names empty when absent", () => {
    const parsed = parseVendorRateCardRows([
      {
        vendor_tier: "si tier-1 (onshore)",
        functional_tower: "security",
        role_level: "lead/architect",
        sourcing_location: "onshore",
        hourly_low_usd: "$225.88",
        hourly_high_usd: "$271.06",
        source_url: "TCS GSA MAS price list",
        as_of: "2026-06-03",
        confidence: "medium",
      },
    ]);

    expect(parsed.validation.valid).toBe(true);
    expect(parsed.rows[0]).toMatchObject({
      vendorTier: "SI Tier-1 (Onshore)",
      namedVendor: undefined,
      functionalTower: "Security",
      roleLevel: "Lead/Architect",
      sourcingLocation: "Onshore",
      hourlyLowUsd: 225.88,
      hourlyHighUsd: 271.06,
    });
  });

  it("parses geo modifiers and validates positive indexes", () => {
    const parsed = parseGeoModifierRows([
      {
        Region: "National Baseline",
        "Geo Index": "1.00",
        Source: "BEA RPP / BLS OEWS method",
        "As Of": "2026-06-03",
        Confidence: "high",
      },
    ]);

    expect(parsed.validation.valid).toBe(true);
    expect(parsed.rows[0]?.geoIndex).toBe(1);
  });

  it("rejects malformed numeric cells instead of letting NaN pass", () => {
    const parsed = parseInternalRateCardRows([
      {
        function_group: "Data/Analytics",
        specialization: "Data Engineer",
        role_level: "Senior",
        base_annual_low_usd: "not-a-number",
        base_annual_high_usd: "$180,000",
        benefits_overhead_pct: "30%",
        source: "BLS OEWS + ECEC",
        as_of: "2026-06-03",
        confidence: "medium",
      },
    ]);

    expect(parsed.validation.valid).toBe(false);
    expect(parsed.validation.errors.map((error) => error.field)).toContain(
      "baseAnnualLowUsd",
    );
  });

  it("keeps direct validation honest for NaN values from non-CSV callers", () => {
    const validation = validateInternalRateRows([
      {
        functionGroup: "Data/Analytics",
        specialization: "Data Engineer",
        roleLevel: "Senior",
        baseAnnualLowUsd: Number.NaN,
        baseAnnualHighUsd: 180_000,
        benefitsOverheadPct: 0.3,
        source: "BLS OEWS + ECEC",
        asOf: "2026-06-03",
        confidence: "medium",
      },
    ]);

    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toMatchObject({
      field: "baseAnnualLowUsd",
    });
  });
});
