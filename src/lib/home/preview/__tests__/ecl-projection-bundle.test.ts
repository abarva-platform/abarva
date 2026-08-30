import {
  buildHomeReviewBundleFromEclProjectionRows,
  buildTechnologyEstateFromHomeProjectionRows,
  type HomeProjectionRow,
} from "../ecl-projection-bundle";
import { getHomeReviewBundle } from "../golden-snapshot";

function row(input: Partial<HomeProjectionRow> & Pick<HomeProjectionRow, "page_key" | "row_key" | "row_type" | "title">): HomeProjectionRow {
  return {
    summary: null,
    display_payload_json: {},
    ...input,
  };
}

const CHAPTER_IDS = [
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "leadership_perspective",
  "what_needs_attention",
] as const;

function chapterSummaryFixtures(overrides: Partial<Record<(typeof CHAPTER_IDS)[number], Partial<HomeProjectionRow>>> = {}): HomeProjectionRow[] {
  return CHAPTER_IDS.map((chapterId) =>
    row({
      page_key: chapterId,
      row_key: `${chapterId}_summary`,
      row_type: "summary",
      title: `${chapterId} published headline`,
      summary: `${chapterId} published summary.`,
      ...overrides[chapterId],
    }),
  );
}

describe("buildTechnologyEstateFromHomeProjectionRows", () => {
  it("maps ECL Home projection rows into the Home v4 technology estate contract", () => {
    const estate = buildTechnologyEstateFromHomeProjectionRows([
      row({
        page_key: "applications_systems",
        row_key: "APP-001",
        row_type: "application",
        title: "Epic Tapestry",
        display_payload_json: {
          application_id: "APP-001",
          application_name: "Epic Tapestry",
          business_function: "Health Plan & Payer Operations",
          application_category: "Core administration",
          criticality_tier: "tier-1",
          lifecycle_state: "current",
          vendor_name: "Epic Systems Corporation",
          interface_count: "18",
          annual_cost_usd: "2400000",
          environment_count: "3",
        },
      }),
      row({
        page_key: "current_state_data_flow",
        row_key: "FLOW-001",
        row_type: "data_flow",
        title: "APP-001 to PLAT-DATA-HUB-001",
        display_payload_json: {
          flow_id: "FLOW-001",
          data_asset_name: "Claims adjudication facts",
          source_system: "integration and data-flow synthetic export",
          source_object_ref: "APP-001",
          target_object_ref: "PLAT-DATA-HUB-001",
          source_function: "Revenue Cycle",
          target_function: "Revenue Cycle",
          integration_pattern: "batch_file",
          landing_layer: "raw",
          consumption_layer: "mart",
          cadence: "daily",
          regulated_data_flag: "true",
        },
      }),
      row({
        page_key: "vendor_contracts",
        row_key: "CTR-001",
        row_type: "contract",
        title: "Epic Systems Corporation · Core platform",
        display_payload_json: {
          contract_id: "CTR-001",
          supplier_name: "Epic Systems Corporation",
          contract_name: "Core platform agreement",
          service_tower: "Clinical and payer platform",
          annualized_value_usd: "9600000",
          notice_window_days: "180",
          benchmarking_right: "present_annual_third_party",
        },
      }),
      row({
        page_key: "infrastructure_platforms",
        row_key: "INF-001",
        row_type: "infrastructure",
        title: "AWS Epic Hosting Estate",
        display_payload_json: {
          platform_id: "PLAT-DATA-HUB-001",
          platform_name: "AWS Epic Hosting Estate",
          platform_type: "Private cloud landing zone",
          hosting_model: "aws_hosted",
          utilization_percent: "72",
          capacity_headroom_percent: "28",
        },
      }),
    ]);

    expect(estate.recordTypes.map((recordType) => [recordType.objectType, recordType.rows.length])).toEqual([
      ["application_system", 1],
      ["vendor_contract", 1],
      ["infrastructure_platform", 1],
      ["data_asset_or_integration", 1],
    ]);

    const applications = estate.recordTypes.find((recordType) => recordType.objectType === "application_system");
    expect(applications?.primaryDimension).toBe("businessFunction");
    expect(applications?.rows[0]).toMatchObject({
      systemName: "Epic Tapestry",
      vendor: "Epic Systems Corporation",
      interfacesCount: 18,
      annualCostUsd: 2400000,
      environmentCount: 3,
      criticality: "tier1",
    });

    const flows = estate.recordTypes.find((recordType) => recordType.objectType === "data_asset_or_integration");
    expect(flows?.rows[0]).toMatchObject({
      sourceSystem: "Epic Tapestry",
      targetSystem: "AWS Epic Hosting Estate",
      dataDomain: "Revenue Cycle",
      landingLayer: "raw",
      consumptionLayer: "mart",
      regulatedDataFlag: true,
    });
  });

  it("builds an ECL-native Home bundle instead of wrapping dense estate rows in golden-snapshot prose", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      ...chapterSummaryFixtures({
        executive_brief: {
          title: "Dense ECL estate loaded",
          summary: "750 applications and 230 contracts are available from the ECL projection.",
          display_payload_json: {
            applications: 750,
            contracts: 230,
            vendors: 101,
            data_flows: 1350,
          },
        },
        technology_data: {
          title: "Technology and data estate represented",
          summary: "750 applications, 220 infrastructure rows, and 1350 data flows are loaded.",
        },
      }),
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_writer_claim_001",
        row_type: "chapter_claim",
        title: "Published ECL writer claim",
        summary: "The published writer claim is rendered from a chapter_claim row.",
        display_payload_json: {
          evidence_ids: ["sig_ecl_estate_001"],
          claim_type: "FACT",
          confidence: "high",
        },
      }),
      row({
        page_key: "applications_systems",
        row_key: "APP-001",
        row_type: "application",
        title: "Epic Tapestry",
        display_payload_json: {
          application_id: "APP-001",
          application_name: "Epic Tapestry",
          business_function: "Health Plan & Payer Operations",
          vendor_name: "Epic Systems Corporation",
          annual_cost_usd: "2400000",
        },
      }),
      row({
        page_key: "vendor_contracts",
        row_key: "CTR-001",
        row_type: "contract",
        title: "Epic Systems Corporation · Core platform",
        display_payload_json: {
          contract_id: "CTR-001",
          supplier_name: "Epic Systems Corporation",
          contract_name: "Core platform agreement",
          annualized_value_usd: "9600000",
        },
      }),
      row({
        page_key: "infrastructure_platforms",
        row_key: "INF-001",
        row_type: "infrastructure",
        title: "AWS Epic Hosting Estate",
        display_payload_json: { platform_id: "PLAT-DATA-HUB-001", platform_name: "AWS Epic Hosting Estate" },
      }),
      row({
        page_key: "current_state_data_flow",
        row_key: "FLOW-001",
        row_type: "data_flow",
        title: "APP-001 to PLAT-DATA-HUB-001",
        display_payload_json: {
          flow_id: "FLOW-001",
          source_system: "integration and data-flow synthetic export",
          source_object_ref: "APP-001",
          target_object_ref: "PLAT-DATA-HUB-001",
        },
      }),
    ]);

    expect(bundle.provenance.canonical_snapshot_hash).toBe("ecl:assessment-dense-source-room-20260823:home_enterprise_landscape:13");
    expect(bundle.provenance.model).toBe("deterministic-ecl-projection");
    expect(bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief")?.headline).toBe("Dense ECL estate loaded");
    expect(bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief")?.headline).not.toBe(
      base?.chapters.find((chapter) => chapter.chapterId === "executive_brief")?.headline,
    );
    expect(bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief")?.key_insights).toEqual([
      {
        statement: "The published writer claim is rendered from a chapter_claim row.",
        evidence_ids: ["sig_ecl_estate_001"],
        claim_type: "FACT",
        confidence: "high",
      },
    ]);
    expect(bundle.thesis.publishedGeneration.things_a_new_cxo_should_know).toEqual([
      {
        statement: "The published writer claim is rendered from a chapter_claim row.",
        evidence_ids: ["sig_ecl_estate_001"],
        claim_type: "FACT",
        confidence: "high",
      },
    ]);
    expect(bundle.thesis.signalPacket.signals[0]?.statement).toContain("1 applications");
    expect(bundle.thesis.signalPacket.contextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ctx_ecl_applications_systems_application_APP_001",
          statement: expect.stringContaining("Epic Tapestry is loaded as an application"),
          domains: ["application_system"],
        }),
        expect.objectContaining({
          id: "ctx_ecl_current_state_data_flow_data_flow_FLOW_001",
          statement: expect.stringContaining("is loaded as a data movement from Epic Tapestry to AWS Epic Hosting Estate"),
          domains: ["data_asset_or_integration", "application_system"],
        }),
      ]),
    );
    expect(bundle.thesis.signalPacket.contextItems).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          statement: "The published writer claim is rendered from a chapter_claim row.",
        }),
      ]),
    );
    expect(bundle.technologyEstate?.recordTypes.find((recordType) => recordType.objectType === "application_system")?.rows).toHaveLength(1);
  });

  it("unwraps serving-view payloads before computing Home contract value signals", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      ...chapterSummaryFixtures({
        executive_brief: {
          title: "Dense ECL estate loaded",
          summary: "750 applications and 230 contracts are available from the ECL projection.",
        },
      }),
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_writer_claim_001",
        row_type: "chapter_claim",
        title: "Contract value claim",
        summary: "Contract value remains traceable to published ECL writer claims.",
        display_payload_json: {
          evidence_ids: ["sig_ecl_vendor_002"],
          claim_type: "OBSERVATION",
          confidence: "medium",
        },
      }),
      row({
        page_key: "vendor_contracts",
        row_key: "CTR-001",
        row_type: "contract",
        title: "Epic Systems Corporation · Core platform",
        display_payload_json: {
          id: "projection-row-wrapper",
          page_key: "vendor_contracts",
          row_key: "CTR-001",
          display_payload_json: {
            contract_id: "CTR-001",
            supplier_name: "Epic Systems Corporation",
            contract_name: "Core platform agreement",
            service_tower: "Clinical and payer platform",
            annualized_value_usd: "9600000",
          },
        },
      }),
    ]);

    expect(bundle.technologyEstate?.recordTypes.find((recordType) => recordType.objectType === "vendor_contract")?.rows[0]).toMatchObject({
      vendorName: "Epic Systems Corporation",
      annualSpendUsd: 9600000,
    });
    expect(bundle.thesis.signalPacket.signals.find((signal) => signal.id === "sig_ecl_vendor_002")?.statement).toContain(
      "$9.6M annualized value",
    );
    expect(bundle.thesis.signalPacket.signals.find((signal) => signal.id === "sig_ecl_vendor_002")?.statement).not.toContain("$0.0M");
  });

  it("uses the SkyHarbor dense assessment id for SkyHarbor ECL bundles", () => {
    const base = getHomeReviewBundle("skyharbor-air");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      ...chapterSummaryFixtures({
        executive_brief: {
          title: "SkyHarbor ECL estate loaded",
          summary: "750 applications and 230 contracts are available from the SkyHarbor ECL projection.",
        },
      }),
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_writer_claim_001",
        row_type: "chapter_claim",
        title: "SkyHarbor published claim",
        summary: "SkyHarbor published claims use the SkyHarbor dense assessment id.",
        display_payload_json: {
          evidence_ids: ["sig_ecl_estate_001"],
          claim_type: "FACT",
          confidence: "high",
        },
      }),
    ]);

    expect(bundle.provenance.canonical_snapshot_hash).toBe(
      "ecl:assessment-dense-skyharbor-20260827:home_enterprise_landscape:9",
    );
    expect(bundle.thesis.signalPacket.contextItems[0]?.statement).toContain(
      "assessment-dense-skyharbor-20260827",
    );
  });

  it("refuses to synthesize a Home ECL narrative when no published chapter claims exist", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    expect(() =>
      buildHomeReviewBundleFromEclProjectionRows(base!, [
        row({
          page_key: "executive_brief",
          row_key: "executive_brief_summary",
          row_type: "summary",
          title: "Dense ECL estate loaded",
          summary: "750 applications and 230 contracts are available from the ECL projection.",
        }),
      ]),
    ).toThrow("no published chapter_claim rows");
  });
});
