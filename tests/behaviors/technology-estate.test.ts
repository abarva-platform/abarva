import { buildTechnologyEstateBundle } from "../../scripts/data-build/technology-estate";
import type { CanonicalIngestionRecord } from "../../src/lib/enterprise-data/contracts/canonical-ingestion";

function record(objectType: string, attributes: Record<string, unknown>): CanonicalIngestionRecord {
  const wrapped: Record<string, { value: unknown; valueType: string }> = {};
  for (const [k, v] of Object.entries(attributes)) {
    wrapped[k] = { value: v, valueType: typeof v === "number" ? "number" : "string" };
  }
  return {
    tenantKey: "test-tenant",
    packetVersion: "v1",
    domain: "technology_estate",
    objectType,
    sourceObjectId: `${objectType}:test`,
    attributes: wrapped,
    relationships: [],
    evidenceReferences: [],
    sourceAuthority: { sourceSystem: "test", sourceType: "test", authority: "authoritative" },
    sensitivity: "internal",
    dataStatus: "synthetic",
    qualityStatus: "valid",
    lineage: [],
  } as CanonicalIngestionRecord;
}

describe("buildTechnologyEstateBundle", () => {
  it("groups records by the four known tech object types with a real label", () => {
    const records = [
      record("application_system", { systemName: "Epic", vendor: "Epic Systems" }),
      record("vendor_contract", { vendorName: "SITA", annualSpendUsd: 285_000_000 }),
    ];
    const bundle = buildTechnologyEstateBundle(records);
    expect(bundle.recordTypes.map((t) => t.objectType)).toEqual(["application_system", "vendor_contract"]);
    expect(bundle.recordTypes[0].label).toBe("Applications & Systems");
    expect(bundle.recordTypes[0].rows).toHaveLength(1);
  });

  it("excludes metadata and narrative fields from columns", () => {
    const records = [
      record("application_system", {
        systemName: "Epic",
        tenantKey: "test-tenant",
        sourceFile: "some.csv",
        sourceDate: "2026-01-01",
        confidence: "high",
        knownChallengesNarrative: "a long story",
        dataQualityNotes: "another long story",
      }),
    ];
    const bundle = buildTechnologyEstateBundle(records);
    expect(bundle.recordTypes[0].columns).toEqual(["systemName"]);
  });

  it("ignores object types outside the tech scope entirely", () => {
    const records = [record("risk_or_control", { riskName: "Something" })];
    expect(buildTechnologyEstateBundle(records).recordTypes).toHaveLength(0);
  });

  it("formats an array-valued attribute as a joined string rather than [object Object]", () => {
    const records = [record("infrastructure_platform", { constraints: ["capacity", "DR tier"] })];
    const bundle = buildTechnologyEstateBundle(records);
    expect(bundle.recordTypes[0].rows[0].constraints).toBe("capacity; DR tier");
  });

  it("returns null for a missing attribute rather than throwing or dropping the row", () => {
    const records = [
      record("vendor_contract", { vendorName: "A", riskRating: "high" }),
      record("vendor_contract", { vendorName: "B" }),
    ];
    const bundle = buildTechnologyEstateBundle(records);
    expect(bundle.recordTypes[0].rows).toHaveLength(2);
    expect(bundle.recordTypes[0].rows[1].riskRating).toBeNull();
  });

  it("precomputes real dimension counts for businessFunction on applications -- the finance/clinical/population-health tagging the request named directly", () => {
    const records = [
      record("application_system", { systemName: "Epic", businessFunction: "Clinical Informatics" }),
      record("application_system", { systemName: "Cerner", businessFunction: "Clinical Informatics" }),
      record("application_system", { systemName: "Workday", businessFunction: "Finance & Accounting" }),
    ];
    const bundle = buildTechnologyEstateBundle(records);
    const apps = bundle.recordTypes.find((t) => t.objectType === "application_system")!;
    expect(apps.primaryDimension).toBe("businessFunction");
    expect(apps.dimensionCounts).toEqual([
      { value: "Clinical Informatics", count: 2 },
      { value: "Finance & Accounting", count: 1 },
    ]);
  });

  it("sets primaryDimension to null, not a fabricated guess, when the expected dimension attribute isn't present", () => {
    const records = [record("application_system", { systemName: "Epic" })];
    const bundle = buildTechnologyEstateBundle(records);
    const apps = bundle.recordTypes.find((t) => t.objectType === "application_system")!;
    expect(apps.primaryDimension).toBeNull();
    expect(apps.dimensionCounts).toEqual([]);
  });

  it("groups a missing dimension value under an honest '(not specified)' bucket rather than dropping the row from the count", () => {
    const records = [
      record("vendor_contract", { vendorName: "A", serviceCategory: "Cloud Hosting" }),
      record("vendor_contract", { vendorName: "B", serviceCategory: null }),
    ];
    const bundle = buildTechnologyEstateBundle(records);
    const vendors = bundle.recordTypes.find((t) => t.objectType === "vendor_contract")!;
    expect(vendors.dimensionCounts).toContainEqual({ value: "(not specified)", count: 1 });
  });
});
