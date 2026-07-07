import {
  ANNUAL_BILLABLE_HOURS_V2,
  VENDOR_GOVERNANCE_OVERHEAD_DEFAULT,
  buildRoleConstantSourcingComparison,
  computeInternalPlanningRate,
  computeVendorPlanningRate,
  validateGeoModifierRows,
  validateInternalRateRows,
  validateVendorRateRows,
  type GeoModifierRow,
  type InternalRateCardRow,
  type VendorRateCardRow,
} from "../rate-card-ingestion";

const INTERNAL_ROW: InternalRateCardRow = {
  functionGroup: "Data/Analytics",
  specialization: "Data Engineer (Spark/Python)",
  roleLevel: "Senior",
  baseAnnualLowUsd: 140_000,
  baseAnnualHighUsd: 180_000,
  benefitsOverheadPct: 0.3,
  source: "BLS OEWS May 2025 + BLS ECEC December 2025 method",
  asOf: "2026-05-15",
  confidence: "medium",
};

const GEO_ROW: GeoModifierRow = {
  region: "NYC Metro",
  geoIndex: 1.22,
  source: "BLS OEWS metro wage ratio method",
  asOf: "2026-05-15",
  confidence: "medium",
};

const ONSHORE_VENDOR: VendorRateCardRow = {
  vendorTier: "SI Tier-1 (Onshore)",
  namedVendor: "Public GSA benchmark blend",
  functionalTower: "Data/Analytics",
  roleLevel: "Senior",
  sourcingLocation: "Onshore",
  hourlyLowUsd: 165,
  hourlyHighUsd: 205,
  source: "GSA MAS public labor schedules",
  asOf: "2026-04-01",
  confidence: "medium",
};

const OFFSHORE_VENDOR: VendorRateCardRow = {
  vendorTier: "SI Tier-1 (Offshore)",
  namedVendor: "Public offshore benchmark blend",
  functionalTower: "Data/Analytics",
  roleLevel: "Senior",
  sourcingLocation: "Offshore",
  hourlyLowUsd: 55,
  hourlyHighUsd: 85,
  source: "Public SI benchmark reconciliation",
  asOf: "2026-04-01",
  confidence: "low",
};

describe("rate-card ingestion — validation", () => {
  it("accepts valid internal/vendor/geo rows from the spec vocab", () => {
    expect(validateInternalRateRows([INTERNAL_ROW]).valid).toBe(true);
    expect(
      validateVendorRateRows([ONSHORE_VENDOR, OFFSHORE_VENDOR]).valid,
    ).toBe(true);
    expect(validateGeoModifierRows([GEO_ROW]).valid).toBe(true);
  });

  it("rejects invalid ranges and off-list enums", () => {
    const validation = validateInternalRateRows([
      {
        ...INTERNAL_ROW,
        functionGroup: "Made Up" as InternalRateCardRow["functionGroup"],
        baseAnnualLowUsd: 200_000,
        baseAnnualHighUsd: 100_000,
        benefitsOverheadPct: 1.2,
      },
    ]);

    expect(validation.valid).toBe(false);
    expect(validation.errors.map((e) => e.field)).toEqual(
      expect.arrayContaining([
        "functionGroup",
        "baseAnnualHighUsd",
        "benefitsOverheadPct",
      ]),
    );
  });

  it("keeps unsourced rows reviewable as warnings instead of silently dropping them", () => {
    const validation = validateVendorRateRows([
      {
        ...ONSHORE_VENDOR,
        source: "",
        asOf: "not-a-date",
      },
    ]);

    expect(validation.valid).toBe(true);
    expect(validation.warnings.map((w) => w.field)).toEqual(
      expect.arrayContaining(["source", "asOf"]),
    );
  });

  it("rejects non-positive geo modifiers", () => {
    const validation = validateGeoModifierRows([{ ...GEO_ROW, geoIndex: 0 }]);
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]?.field).toBe("geoIndex");
  });
});

describe("rate-card ingestion — server-side compute", () => {
  it("recomputes internal loaded/localized rates without trusting workbook formulas", () => {
    const computed = computeInternalPlanningRate(INTERNAL_ROW, GEO_ROW);

    expect(computed.nationalMidpointUsd).toBe(160_000);
    expect(computed.loadedNationalMidpointUsd).toBe(208_000);
    expect(computed.localizedAnnualUsd).toEqual({
      low: 222_040,
      point: 253_760,
      high: 285_480,
    });
    expect(computed.provenance).toHaveLength(2);
  });

  it("annualizes vendor hourly midpoint using the spec v2 billable-hour constant", () => {
    const computed = computeVendorPlanningRate(ONSHORE_VENDOR);

    expect(ANNUAL_BILLABLE_HOURS_V2).toBe(1880);
    expect(computed.hourlyMidpointUsd).toBe(185);
    expect(computed.annualEquivalentUsd.point).toBe(347_800);
    expect(computed.costToClientUsd.point).toBe(
      Math.round(347_800 * (1 + VENDOR_GOVERNANCE_OVERHEAD_DEFAULT)),
    );
  });

  it("rejects invalid governance overhead percentages", () => {
    expect(() => computeVendorPlanningRate(ONSHORE_VENDOR, 1.2)).toThrow(
      /governanceOverheadPct/,
    );
  });
});

describe("rate-card ingestion — role-constant sourcing comparison", () => {
  it("holds the role constant and varies only sourcing mode", () => {
    const comparison = buildRoleConstantSourcingComparison({
      internal: INTERNAL_ROW,
      geo: GEO_ROW,
      onshoreVendor: ONSHORE_VENDOR,
      offshoreVendor: OFFSHORE_VENDOR,
      hybridLocalPct: 0.6,
    });

    expect(comparison.map((option) => option.option)).toEqual([
      "insource",
      "outsource_onshore",
      "outsource_offshore",
      "hybrid",
    ]);
    expect(comparison[0]?.annualUsd.point).toBe(253_760);
    expect(comparison[1]?.annualUsd.point).toBe(389_536);
    expect(comparison[2]?.annualUsd.point).toBe(147_392);
    expect(comparison[3]?.annualUsd.point).toBe(211_212.8);
    expect(
      comparison.every((option) => option.note.includes("not a quote")),
    ).toBe(true);
  });

  it("throws when vendor rows are not role-constant with the internal row", () => {
    expect(() =>
      buildRoleConstantSourcingComparison({
        internal: INTERNAL_ROW,
        geo: GEO_ROW,
        onshoreVendor: { ...ONSHORE_VENDOR, roleLevel: "Junior" },
        offshoreVendor: OFFSHORE_VENDOR,
        hybridLocalPct: 0.5,
      }),
    ).toThrow(/Role-constant/);
  });

  it("throws when onshore/offshore rows are mislabeled", () => {
    expect(() =>
      buildRoleConstantSourcingComparison({
        internal: INTERNAL_ROW,
        geo: GEO_ROW,
        onshoreVendor: { ...ONSHORE_VENDOR, sourcingLocation: "Nearshore" },
        offshoreVendor: OFFSHORE_VENDOR,
        hybridLocalPct: 0.5,
      }),
    ).toThrow(/Onshore/);
  });
});
