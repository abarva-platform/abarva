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
          criticality_tier: "tier1",
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
        title: "APP-001 to PLATFORM-001",
        display_payload_json: {
          flow_id: "FLOW-001",
          data_asset_name: "Claims adjudication facts",
          data_domain: "Claims",
          source_system: "Epic Tapestry",
          target_system: "Claims Data Mart",
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
          platform_id: "INF-001",
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
    });

    const flows = estate.recordTypes.find((recordType) => recordType.objectType === "data_asset_or_integration");
    expect(flows?.rows[0]).toMatchObject({
      sourceSystem: "Epic Tapestry",
      targetSystem: "Claims Data Mart",
      landingLayer: "raw",
      consumptionLayer: "mart",
      regulatedDataFlag: true,
    });
  });

  it("builds an ECL-native Home bundle instead of wrapping dense estate rows in golden-snapshot prose", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_summary",
        row_type: "summary",
        title: "Dense ECL estate loaded",
        summary: "750 applications and 230 contracts are available from the ECL projection.",
        display_payload_json: {
          applications: 750,
          contracts: 230,
          vendors: 101,
          data_flows: 1350,
        },
      }),
      row({
        page_key: "technology_data",
        row_key: "technology_data_summary",
        row_type: "summary",
        title: "Technology and data estate represented",
        summary: "750 applications, 220 infrastructure rows, and 1350 data flows are loaded.",
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
        display_payload_json: { platform_id: "INF-001", platform_name: "AWS Epic Hosting Estate" },
      }),
      row({
        page_key: "current_state_data_flow",
        row_key: "FLOW-001",
        row_type: "data_flow",
        title: "APP-001 to PLATFORM-001",
        display_payload_json: {
          flow_id: "FLOW-001",
          source_system: "Epic Tapestry",
          target_system: "Claims Data Mart",
        },
      }),
    ]);

    expect(bundle.provenance.canonical_snapshot_hash).toBe("ecl:assessment-dense-source-room-20260823:home_enterprise_landscape:6");
    expect(bundle.provenance.model).toBe("deterministic-ecl-projection");
    expect(bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief")?.headline).toBe("Dense ECL estate loaded");
    expect(bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief")?.headline).not.toBe(
      base?.chapters.find((chapter) => chapter.chapterId === "executive_brief")?.headline,
    );
    expect(bundle.thesis.signalPacket.signals[0]?.statement).toContain("1 applications");
    expect(bundle.technologyEstate?.recordTypes.find((recordType) => recordType.objectType === "application_system")?.rows).toHaveLength(1);
  });
});
