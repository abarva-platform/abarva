import {
  buildHomeReviewBundleFromEclProjectionRows,
  buildTechnologyEstateFromHomeProjectionRows,
  getHomeEclProjectionBundleOrReviewedSnapshot,
  type HomeProjectionRow,
} from "../ecl-projection-bundle";
import { resolveEvidence } from "@/components/home/preview/evidence-resolver";
import { azureRead } from "@/lib/data-plane/azureRead";
import { getHomeReviewBundle } from "../golden-snapshot";
import type { HomeReviewBundle } from "../types";

type PacketWithCategorySummaries = ReturnType<
  typeof buildHomeReviewBundleFromEclProjectionRows
>["thesis"]["signalPacket"] & {
  categorySummaries?: Array<{
    key: string;
    recordCount: number;
    denominator: string;
    measures: Record<string, number>;
  }>;
};

function row(
  input: Partial<HomeProjectionRow> &
    Pick<HomeProjectionRow, "page_key" | "row_key" | "row_type" | "title">,
): HomeProjectionRow {
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

function chapterSummaryFixtures(
  overrides: Partial<
    Record<(typeof CHAPTER_IDS)[number], Partial<HomeProjectionRow>>
  > = {},
): HomeProjectionRow[] {
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

function storyPlanFixture(
  overrides: Partial<NonNullable<HomeReviewBundle["executiveStoryPlan"]>> = {},
): HomeProjectionRow {
  const storyPlan: NonNullable<HomeReviewBundle["executiveStoryPlan"]> = {
    contractVersion: "home-executive-story-plan/v1",
    tenantKey: "meridian-health",
    assessmentId: "assessment-dense-source-room-20260823",
    snapshotId: null,
    openingThesisClaimRef: "executive_brief_writer_claim_001",
    openingSupportingClaimRefs: [],
    scaleFactRef: null,
    decisions: [],
    sectionOrder: [
      "enterprise",
      "bets",
      "runs-on",
      "costs-returns",
      "exposed",
      "attention",
    ],
    sections: [
      {
        sectionId: "enterprise",
        state: "published",
        leadClaimRef: "executive_brief_writer_claim_001",
        supportingClaimRefs: [],
        reasonCode: null,
      },
      ...(
        ["bets", "runs-on", "costs-returns", "exposed", "attention"] as const
      ).map((sectionId) => ({
        sectionId,
        state: "deferred" as const,
        leadClaimRef: null,
        supportingClaimRefs: [],
        reasonCode: "no_verified_claim_for_section",
      })),
    ],
    chapterStates: Object.fromEntries(
      CHAPTER_IDS.map((chapterId) => [
        chapterId,
        {
          state: chapterId === "executive_brief" ? "published" : "deferred",
          reasonCode:
            chapterId === "executive_brief" ? null : "no_verified_claims",
        },
      ]),
    ) as NonNullable<HomeReviewBundle["executiveStoryPlan"]>["chapterStates"],
    heroVisualDatasetRef: null,
    overallEvidenceBoundary:
      "Fixture story plan uses only published claim refs.",
    sourceClaimRefs: ["executive_brief_writer_claim_001"],
    storyPlanHash: "fixture-story-plan",
    ...overrides,
  };
  return row({
    page_key: "executive_story",
    row_key: "executive_story_plan_v1",
    row_type: "story_plan",
    title: "Home executive story plan",
    summary: storyPlan.overallEvidenceBoundary,
    display_payload_json: { story_plan: storyPlan },
  });
}

describe("buildTechnologyEstateFromHomeProjectionRows", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("falls back to the reviewed Home bundle when the Meridian ECL serving projection is empty", async () => {
    jest.spyOn(azureRead, "query").mockResolvedValueOnce([]);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const base = getHomeReviewBundle("meridian-health");
    const bundle =
      await getHomeEclProjectionBundleOrReviewedSnapshot("meridian-health");

    expect(bundle).toBe(base);
    expect(bundle.technologyEstate?.recordTypes[0]?.rows.length).toBe(306);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("ECL projection unavailable for meridian-health"),
      expect.any(Error),
    );
  });

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
      row({
        page_key: "data_assets_integrations",
        row_key: "SP04-001",
        row_type: "data_analytics_workload",
        title: "Finance · Power BI · report",
        display_payload_json: {
          source_row_id: "SP04-001",
          function: "Finance & Accounting",
          platform_name: "Enterprise Power BI Tenant",
          technology_name: "Power BI",
          workload_type: "report",
          workload_count: "420",
          active_user_count: "1800",
          data_volume_tb: "18.5",
          governance_state: "developing",
        },
      }),
    ]);

    expect(
      estate.recordTypes.map((recordType) => [
        recordType.objectType,
        recordType.rows.length,
      ]),
    ).toEqual([
      ["application_system", 1],
      ["vendor_contract", 1],
      ["infrastructure_platform", 1],
      ["data_asset_or_integration", 2],
    ]);

    const applications = estate.recordTypes.find(
      (recordType) => recordType.objectType === "application_system",
    );
    expect(applications?.primaryDimension).toBe("businessFunction");
    expect(applications?.rows[0]).toMatchObject({
      systemName: "Epic Tapestry",
      vendor: "Epic Systems Corporation",
      interfacesCount: 18,
      annualCostUsd: 2400000,
      environmentCount: 3,
      criticality: "tier1",
    });

    const flows = estate.recordTypes.find(
      (recordType) => recordType.objectType === "data_asset_or_integration",
    );
    expect(flows?.rows[0]).toMatchObject({
      recordKind: "data_movement",
      sourceSystem: "Epic Tapestry",
      targetSystem: "AWS Epic Hosting Estate",
      dataDomain: "Revenue Cycle",
      landingLayer: "raw",
      consumptionLayer: "mart",
      regulatedDataFlag: true,
    });
    expect(flows?.rows[1]).toMatchObject({
      recordKind: "data_analytics_workload",
      dataAssetName: "Enterprise Power BI Tenant",
      dataDomain: "Finance & Accounting",
      workloadType: "report",
      platformName: "Enterprise Power BI Tenant",
      technologyName: "Power BI",
      workloadCount: 420,
      activeUserCount: 1800,
      dataVolumeTb: 18.5,
      governanceState: "developing",
    });
  });

  it("builds an ECL-native Home bundle instead of wrapping dense estate rows in golden-snapshot prose", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      ...chapterSummaryFixtures({
        executive_brief: {
          title: "Dense ECL estate loaded",
          summary:
            "750 applications and 230 contracts are available from the ECL projection.",
          display_payload_json: {
            applications: 750,
            contracts: 230,
            vendors: 101,
            data_flows: 1350,
          },
        },
        technology_data: {
          title: "Technology and data estate represented",
          summary:
            "750 applications, 220 infrastructure rows, and 1350 data flows are loaded.",
        },
      }),
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_writer_claim_001",
        row_type: "chapter_claim",
        title: "Published ECL writer claim",
        summary:
          "The published writer claim is rendered from a chapter_claim row.",
        display_payload_json: {
          evidence_ids: ["sig_ecl_estate_001"],
          claim_type: "FACT",
          confidence: "high",
        },
      }),
      storyPlanFixture(),
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
        display_payload_json: {
          platform_id: "PLAT-DATA-HUB-001",
          platform_name: "AWS Epic Hosting Estate",
        },
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
      row({
        page_key: "data_assets_integrations",
        row_key: "SP04-001",
        row_type: "data_analytics_workload",
        title: "Finance · Power BI · report",
        display_payload_json: {
          source_row_id: "SP04-001",
          function: "Finance & Accounting",
          platform_name: "Enterprise Power BI Tenant",
          technology_name: "Power BI",
          workload_type: "report",
          workload_count: "420",
          active_user_count: "1800",
          data_volume_tb: "18.5",
          governance_state: "developing",
        },
      }),
    ]);

    expect(bundle.provenance.canonical_snapshot_hash).toBe(
      "ecl:assessment-dense-source-room-20260823:serving.home_*:15",
    );
    expect(bundle.provenance.model).toBe("deterministic-ecl-projection");
    expect(
      bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief")
        ?.headline,
    ).toBe("Dense ECL estate loaded");
    expect(
      bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief")
        ?.headline,
    ).not.toBe(
      base?.chapters.find((chapter) => chapter.chapterId === "executive_brief")
        ?.headline,
    );
    expect(
      bundle.chapters.find((chapter) => chapter.chapterId === "executive_brief")
        ?.key_insights,
    ).toEqual([
      {
        claim_ref: "executive_brief_writer_claim_001",
        statement:
          "The published writer claim is rendered from a chapter_claim row.",
        evidence_ids: ["sig_ecl_estate_001"],
        claim_type: "FACT",
        confidence: "high",
      },
    ]);
    expect(
      bundle.thesis.publishedGeneration.things_a_new_cxo_should_know,
    ).toEqual([
      {
        claim_ref: "executive_brief_writer_claim_001",
        statement:
          "The published writer claim is rendered from a chapter_claim row.",
        evidence_ids: ["sig_ecl_estate_001"],
        claim_type: "FACT",
        confidence: "high",
      },
    ]);
    expect(bundle.thesis.signalPacket.signals[0]?.statement).toContain(
      "1 applications",
    );
    expect(bundle.thesis.signalPacket.signals[0]?.statement).toContain(
      "1 data/BI/ETL workload segments",
    );
    expect(bundle.thesis.signalPacket.contextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ctx_ecl_applications_systems_application_APP_001",
          statement: expect.stringContaining(
            "Epic Tapestry is loaded as an application",
          ),
          domains: ["application_system"],
        }),
        expect.objectContaining({
          id: "ctx_ecl_current_state_data_flow_data_flow_FLOW_001",
          statement: expect.stringContaining(
            "is loaded as a data movement from Epic Tapestry to AWS Epic Hosting Estate",
          ),
          domains: ["data_asset_or_integration", "application_system"],
        }),
      ]),
    );
    expect(bundle.thesis.signalPacket.contextItems).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          statement:
            "The published writer claim is rendered from a chapter_claim row.",
        }),
      ]),
    );
    expect(bundle.thesis.signalPacket.sourceSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourcePath: "serving.home_applications_systems",
          sourceKind: "serving_projection",
          recordCount: 1,
          canonicalRecordCount: 1,
          authority: ["serving.home_applications_systems"],
        }),
        expect.objectContaining({
          sourcePath:
            "serving.home_current_state_data_flow + serving.home_data_assets_integrations",
          sourceKind: "serving_projection",
          recordCount: 2,
          authority: [
            "serving.home_current_state_data_flow",
            "serving.home_data_assets_integrations",
          ],
        }),
      ]),
    );
    const packet = bundle.thesis.signalPacket as PacketWithCategorySummaries;
    expect(packet.categorySummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "data_bi_etl_workloads_by_function_and_technology",
          recordCount: 1,
          denominator:
            "segment-level workload rows; not one row per report, job, script, or user",
          measures: expect.objectContaining({
            workloadSegments: 1,
            workloadItems: 420,
            activeUsers: 1800,
            dataVolumeTb: 18.5,
          }),
        }),
      ]),
    );
    expect(
      bundle.thesis.signalPacket.visualDatasets.data_workload_by_function,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Finance & Accounting",
          workloadItems: 420,
          activeUsers: 1800,
          dataVolumeTb: 18.5,
        }),
      ]),
    );
    expect(
      bundle.technologyEstate?.recordTypes.find(
        (recordType) => recordType.objectType === "application_system",
      )?.rows,
    ).toHaveLength(1);
    expect(bundle.executiveStoryPlan).toMatchObject({
      contractVersion: "home-executive-story-plan/v1",
      openingThesisClaimRef: "executive_brief_writer_claim_001",
      sections: expect.arrayContaining([
        expect.objectContaining({
          sectionId: "enterprise",
          leadClaimRef: "executive_brief_writer_claim_001",
        }),
      ]),
    });
  });

  it("rejects a story plan that references a dropped or missing chapter claim", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    expect(() =>
      buildHomeReviewBundleFromEclProjectionRows(base!, [
        ...chapterSummaryFixtures(),
        row({
          page_key: "executive_brief",
          row_key: "executive_brief_writer_claim_001",
          row_type: "chapter_claim",
          title: "Published claim",
          summary: "The published claim exists.",
          display_payload_json: {
            evidence_ids: ["sig_ecl_estate_001"],
            claim_type: "FACT",
            confidence: "high",
          },
        }),
        storyPlanFixture({
          openingThesisClaimRef: "executive_brief_writer_claim_999",
        }),
      ]),
    ).toThrow(
      /references missing chapter_claim executive_brief_writer_claim_999/,
    );
  });

  it("unwraps serving-view payloads before computing Home contract value signals", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      ...chapterSummaryFixtures({
        executive_brief: {
          title: "Dense ECL estate loaded",
          summary:
            "750 applications and 230 contracts are available from the ECL projection.",
        },
      }),
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_writer_claim_001",
        row_type: "chapter_claim",
        title: "Contract value claim",
        summary:
          "Contract value remains traceable to published ECL writer claims.",
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

    expect(
      bundle.technologyEstate?.recordTypes.find(
        (recordType) => recordType.objectType === "vendor_contract",
      )?.rows[0],
    ).toMatchObject({
      vendorName: "Epic Systems Corporation",
      annualSpendUsd: 9600000,
    });
    expect(
      bundle.thesis.signalPacket.signals.find(
        (signal) => signal.id === "sig_ecl_vendor_002",
      )?.statement,
    ).toContain("$9.6M annualized value");
    expect(
      bundle.thesis.signalPacket.signals.find(
        (signal) => signal.id === "sig_ecl_vendor_002",
      )?.statement,
    ).not.toContain("$0.0M");
  });

  it("uses the SkyHarbor dense assessment id for SkyHarbor ECL bundles", () => {
    const base = getHomeReviewBundle("skyharbor-air");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      ...chapterSummaryFixtures({
        executive_brief: {
          title: "SkyHarbor ECL estate loaded",
          summary:
            "750 applications and 230 contracts are available from the SkyHarbor ECL projection.",
        },
      }),
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_writer_claim_001",
        row_type: "chapter_claim",
        title: "SkyHarbor published claim",
        summary:
          "SkyHarbor published claims use the SkyHarbor dense assessment id.",
        display_payload_json: {
          evidence_ids: ["sig_ecl_estate_001"],
          claim_type: "FACT",
          confidence: "high",
        },
      }),
      storyPlanFixture({
        tenantKey: "skyharbor-air",
        assessmentId: "assessment-dense-skyharbor-20260827",
        overallEvidenceBoundary:
          "SkyHarbor fixture story plan uses published claim refs.",
      }),
    ]);

    expect(bundle.provenance.canonical_snapshot_hash).toBe(
      "ecl:assessment-dense-skyharbor-20260827:serving.home_*:10",
    );
    expect(bundle.thesis.signalPacket.contextItems[0]?.statement).toContain(
      "assessment-dense-skyharbor-20260827",
    );
  });

  it("renders a deferred Home ECL narrative instead of throwing when no published chapter claims exist", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_summary",
        row_type: "summary",
        title: "Dense ECL estate loaded",
        summary:
          "750 applications and 230 contracts are available from the ECL projection.",
      }),
    ]);

    expect(bundle.thesis.publishedGeneration.enterprise_story).toBe(
      "The Home narrative is deferred until verified chapter claims are available.",
    );
    expect(
      bundle.thesis.publishedGeneration.things_a_new_cxo_should_know,
    ).toEqual([]);
    expect(bundle.chapters).toHaveLength(8);
    expect(bundle.chapters[0]).toMatchObject({
      headline: "Executive Brief is deferred pending verified claims",
      key_insights: [],
      tensions: [],
      what_to_watch: [],
    });
    // The limitation states what is true of the record. It used to instruct the reader not to draw a
    // narrative from counts, in our words rather than theirs, and named an internal artefact.
    expect(bundle.chapters[0]?.limitations[0]).toContain(
      "Counts alone do not carry a conclusion",
    );
    expect(bundle.chapters[0]?.limitations[0]).not.toMatch(
      /projection|CXO readout/i,
    );
  });

  it("resolves deterministic writer evidence ids on the Home runtime signal packet", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      ...chapterSummaryFixtures(),
      row({
        page_key: "our_business",
        row_key: "our_business_writer_claim_001",
        row_type: "chapter_claim",
        title: "Published commercial basis claim",
        summary:
          "The published business claim cites writer signal and scope context ids.",
        display_payload_json: {
          evidence_ids: [
            "sig_ecl_contract_value_005",
            "ctx_ecl_scope_business_economics_001",
          ],
          claim_type: "FACT",
          confidence: "high",
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
    ]);

    const resolved = resolveEvidence(
      ["sig_ecl_contract_value_005", "ctx_ecl_scope_business_economics_001"],
      bundle.thesis.signalPacket,
    );
    expect(resolved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "sig_ecl_contract_value_005" }),
        expect.objectContaining({ id: "ctx_ecl_scope_business_economics_001" }),
      ]),
    );
    expect(resolved.some((item) => item.unresolved)).toBe(false);
  });
});
