import {
  ENTERPRISE_SIGNAL_PACKET_LIMITS,
  buildContextQualityManifest,
  buildDecisionContext,
  buildEnterpriseSignalPacket,
} from "../enterprise-signal-packet";

const value = (raw: unknown) => ({ value: raw, valueType: typeof raw === "number" ? "number" : "string" });

function record(
  objectType: string,
  sourcePath: string,
  attributes: Record<string, unknown>,
  domain = "technology_estate",
) {
  return {
    domain,
    objectType,
    attributes: {
      sourcePath: value(sourcePath),
      ...Object.fromEntries(Object.entries(attributes).map(([key, raw]) => [key, value(raw)])),
    },
    sourceAuthority: { authority: "authoritative", basis: "declared", sourceSystem: "synthetic test", sourceType: "csv" },
    qualityStatus: "valid",
  };
}

describe("enterprise signal packet breadth", () => {
  it("preserves source-family summaries and uses named packet limits", () => {
    const records = [
      record("tenant_profile", "00_profile.csv", {
        businessModel: "integrated payer-provider",
        revenueUsd: 20_000_000_000,
        employeeCount: 55_000,
        strategicPriorities: ["raise stars", "modernize data estate"],
      }, "enterprise_structure"),
      ...Array.from({ length: 7 }, (_, index) =>
        record("program_initiative", "06_programs.csv", {
          programName: `Program ${index + 1}`,
          expectedValueUsd: (index + 1) * 1_000_000,
          budgetUsd: 500_000,
        }, "transformation_ai_portfolio"),
      ),
      ...Array.from({ length: ENTERPRISE_SIGNAL_PACKET_LIMITS.topVendorsByShare + 3 }, (_, index) =>
        record("vendor_contract", "08_vendors.csv", {
          vendorName: `Vendor ${index + 1}`,
          annualSpendUsd: (index + 1) * 100_000,
          supportedFunctions: ["Finance", "Clinical"],
        }, "vendor_commercial_estate"),
      ),
    ];

    const dc = buildDecisionContext(records, [], [
      {
        sourcePath: "07_contract_terms.csv",
        domain: "vendor_commercial_estate",
        objectTypes: ["client_intake_file"],
        recordCount: 0,
        rawRowCount: 12,
        canonicalRecordCount: 0,
        sourceKind: "client_intake_file",
        basis: ["coverage_context_not_citable"],
        authority: ["client_intake_inventory"],
        qualityStates: ["raw_intake_file"],
        materialFields: ["contract_id", "vendor_name", "renewal_notice_days"],
        exampleRecords: ["CTR-001 · Example Vendor"],
      },
    ]);
    const quality = buildContextQualityManifest(records, []);
    const packet = buildEnterpriseSignalPacket(dc, quality);

    expect(packet.sourceSummaries.map((summary) => summary.sourcePath)).toEqual(
      expect.arrayContaining(["00_profile.csv", "06_programs.csv", "08_vendors.csv"]),
    );
    expect(packet.sourceSummaries.find((summary) => summary.sourcePath === "08_vendors.csv")).toMatchObject({
      domain: "vendor_commercial_estate",
      objectTypes: ["vendor_contract"],
      recordCount: ENTERPRISE_SIGNAL_PACKET_LIMITS.topVendorsByShare + 3,
    });
    expect(packet.sourceSummaries.find((summary) => summary.sourcePath === "07_contract_terms.csv")).toMatchObject({
      recordCount: 0,
      rawRowCount: 12,
      sourceKind: "client_intake_file",
      basis: ["coverage_context_not_citable"],
    });
    expect(packet.visualDatasets.program_investment_distribution).toHaveLength(7);
    expect(packet.visualDatasets.vendor_spend_concentration).toHaveLength(
      ENTERPRISE_SIGNAL_PACKET_LIMITS.topVendorsByShare,
    );
  });
});
