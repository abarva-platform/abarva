import {
  buildHomeReviewBundleFromEclProjectionRows,
  buildTechnologyEstateFromHomeProjectionRows,
  getHomeEclProjectionBundle,
  getHomeEclProjectionBundleOrReviewedSnapshot,
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
  type HomeProjectionRow,
  type HomeSourceFileReviewRow,
} from "../ecl-projection-bundle";
import { resolveEvidence } from "@/components/home/preview/evidence-resolver";
import { azureRead } from "@/lib/data-plane/azureRead";
import { denseAssessmentIdForTenant } from "@/lib/ecl/denseAssessment";
import { selectHomeAssessment } from "../home-assessment-selection";
import { getHomeReviewBundle } from "../golden-snapshot";
import {
  createHomeNarrativePacketArtifact,
  hashHomeNarrativeValue,
  type HomeNarrativeSignalPacket,
} from "../home-narrative-packet";
import { homeRecordSourceToken } from "../record-source-token";
import {
  homeSourceDateCoverageLabel,
  homeSourceFileReviewLabel,
} from "../record-source";
import type { HomeReviewBundle } from "../types";

jest.mock("../home-assessment-selection", () => ({
  selectHomeAssessment: jest.fn(async () => ({
    assessmentId: "assessment-dense-source-room-20260823",
    declared: null,
  })),
}));

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

/** An approval as a load records it on the file it loaded. */
const RECORDED_APPROVAL = {
  approved_by: "A named approver",
  approved_at: "2026-10-01",
  release_record: "docs/releases/records/example-load-approval.md",
};

/**
 * The packet a narrative build writes, hashes and stores.
 *
 * Written out key by key, the way that build assembles it, and from nothing the Home reader
 * returns. A fixture copied from the reader's own packet agrees with the reader about whatever
 * the reader adds, so it cannot show that the reader and the build hash the same object. Typed as
 * the build's packet: a key only the reader knows does not belong here.
 */
function writerShapedPacket(base: HomeReviewBundle): HomeNarrativeSignalPacket {
  const packet = {
    enterpriseIdentity: {
      businessModel: null,
      industry: null,
      revenue: null,
      employeeCount: null,
    },
    businessEconomics: {
      operatingSegments: [],
      customerSegments: [],
      technologyBudget: 0,
      technologyBudgetShareOfRevenue: null,
    },
    strategicPriorities: [],
    signals: [
      {
        id: "sig_ecl_contract_value_005",
        kind: "portfolio",
        statement: "One contract carries annualized-value evidence.",
        domains: ["vendor_contract"],
        evidenceRefs: ["serving.home_vendor_contracts"],
      },
    ],
    contextItems: [
      {
        id: "ctx_ecl_scope_business_economics_001",
        statement: "Customer and channel economics require their own evidence.",
        domains: ["enterprise_profile"],
      },
      {
        id: "ctx_ecl_vendor_contracts_contract_CTR_005",
        statement: "A contract is recorded as a contract.",
        domains: ["vendor_contract"],
      },
    ],
    visualDatasets: {},
    categorySummaries: [],
    pagePromptContracts: [],
    sourceSummaries: [],
    analyticalLenses: [],
    coverageManifest: base.thesis.signalPacket.coverageManifest,
  };
  return packet as unknown as HomeNarrativeSignalPacket;
}

describe("buildTechnologyEstateFromHomeProjectionRows", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("retains declared join IDs for segment and priority drill-through", () => {
    const estate = buildTechnologyEstateFromHomeProjectionRows([
      row({
        page_key: "applications_systems",
        row_key: "APP-1",
        row_type: "application",
        title: "Example application",
        admission_status: "admitted",
        display_payload_json: {
          application_id: "APP-1",
          segment_id: "SEG-1",
          business_function_id: "FUNC-1",
        },
      }),
      row({
        page_key: "programs_initiatives",
        row_key: "PROG-1",
        row_type: "program",
        title: "Example program",
        admission_status: "admitted",
        display_payload_json: {
          program_id: "PROG-1",
          priority_id: "PRI-1",
          sponsor_function_id: "FUNC-1",
        },
      }),
    ]);
    const apps = estate.recordTypes.find(
      (type) => type.objectType === "application_system",
    );
    const programs = estate.recordTypes.find(
      (type) => type.objectType === "program_initiative",
    );
    expect(apps?.rows[0]).toMatchObject({
      segmentId: "SEG-1",
      businessFunctionId: "FUNC-1",
    });
    expect(programs?.rows[0]).toMatchObject({
      priorityId: "PRI-1",
      sponsorFunctionId: "FUNC-1",
    });
    expect(apps?.columns).toContain("segmentId");
    expect(programs?.columns).toContain("priorityId");
  });

  it("reads identified enterprise families without inventing missing or refused rows", () => {
    const rows: HomeProjectionRow[] = [
      row({
        page_key: "business_unit_profile",
        row_key: "segment-a",
        row_type: "business_segment",
        title: "Operating Segment",
        admission_status: "admitted",
        display_payload_json: {
          segment_key: "segment-a",
          segment_name: "Operating Segment",
          revenue_share_pct: "40",
          pnl_owner_role: "Operating Executive",
        },
      }),
      row({
        page_key: "business_unit_profile",
        row_key: "function-a",
        row_type: "business_function",
        title: "Service Operations",
        admission_status: "admitted",
        display_payload_json: {
          function_name: "Service Operations",
          business_segment_key: "segment-a",
          business_segment: "Operating Segment",
        },
      }),
      row({
        page_key: "business_unit_profile",
        row_key: "role-a",
        row_type: "workforce_role",
        title: "Service Lead",
        admission_status: "admitted",
        display_payload_json: {
          persona_or_role: "Service Lead",
          function_name: "Service Operations",
          role_count: 12,
        },
      }),
      row({
        page_key: "business_unit_profile",
        row_key: "process-a",
        row_type: "operational_process",
        title: "Service Review",
        admission_status: "admitted",
        display_payload_json: {
          process_name: "Service Review",
          business_function: "Service Operations",
          process_owner: "Service Lead",
        },
      }),
      row({
        page_key: "business_unit_profile",
        row_key: "missing-id",
        row_type: "business_segment",
        title: "Unnamed segment",
        admission_status: "admitted",
        display_payload_json: { segment_name: "Unnamed segment" },
      }),
      row({
        page_key: "business_unit_profile",
        row_key: "refused-segment",
        row_type: "business_segment",
        title: "Refused segment",
        admission_status: "refused",
        display_payload_json: {
          segment_key: "refused-segment",
          segment_name: "Refused segment",
        },
      }),
      row({
        page_key: "business_unit_profile",
        row_key: "pending-segment",
        row_type: "business_segment",
        title: "Pending segment",
        admission_status: "pending_review",
        display_payload_json: {
          segment_key: "pending-segment",
          segment_name: "Pending segment",
        },
      }),
    ];
    const estate = buildTechnologyEstateFromHomeProjectionRows(rows);

    expect(estate.recordTypes.map((type) => type.objectType)).toEqual([
      "business_segment",
      "business_function",
      "workforce_role",
      "operational_process",
    ]);
    expect(estate.recordTypes.map((type) => type.rows.length)).toEqual([
      1, 1, 1, 1,
    ]);
    expect(estate.recordTypes[0]?.rows[0]).toMatchObject({
      segmentName: "Operating Segment",
      segmentKey: "segment-a",
      revenueSharePct: 40,
    });

    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const bundle = buildHomeReviewBundleFromEclProjectionRows(base, rows);
    expect(bundle.thesis.signalPacket.contextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ctx_ecl_business_unit_profile_business_segment_segment_a",
          domains: ["business_segment"],
        }),
        expect.objectContaining({
          id: "ctx_ecl_gap_withheld_rows_001",
          statement: expect.stringContaining("3 records were excluded"),
        }),
      ]),
    );
    expect(
      bundle.thesis.signalPacket.contextItems.some(
        (item) =>
          item.id.includes("refused_segment") ||
          item.id.includes("missing_id") ||
          item.id.includes("pending_segment"),
      ),
    ).toBe(false);
    expect(
      bundle.thesis.signalPacket.sourceSummaries.find(
        (summary) => summary.domain === "business_segment",
      )?.exampleRecords,
    ).toEqual(["Operating Segment"]);
  });

  it("keeps every served intake family in its own context domain", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const families = [
      ["metrics_outcomes", "metric_outcome"],
      ["risks_controls", "risk_control"],
      ["programs_initiatives", "program_initiative"],
      ["org_ownership", "organization_ownership"],
      ["ai_use_cases", "ai_use_case"],
      ["executive_interviews", "executive_interview"],
      ["relationships", "relationship_edge"],
    ] as const;
    const bundle = buildHomeReviewBundleFromEclProjectionRows(
      base,
      families.map(([pageKey], index) =>
        row({
          page_key: pageKey,
          row_key: `row-${index}`,
          row_type: "record",
          title: `Family ${index}`,
          admission_status: "admitted",
        }),
      ),
    );

    for (const [pageKey, domain] of families) {
      expect(
        bundle.thesis.signalPacket.contextItems.find((item) =>
          item.id.startsWith(`ctx_ecl_${pageKey}_record_`),
        )?.domains,
      ).toEqual([domain]);
    }
    expect(bundle.thesis.signalPacket.contextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ctx_ecl_gap_enterprise_families_001",
          statement: expect.stringContaining("Business Segments"),
        }),
      ]),
    );
  });

  it("reads source lineage columns from the serving projection", async () => {
    const query = jest
      .spyOn(azureRead, "query")
      .mockResolvedValueOnce([
        { full_name: "serving.home_applications_systems" },
      ])
      .mockResolvedValueOnce([
        row({
          page_key: "applications_systems",
          row_key: "APP-001",
          row_type: "application",
          title: "A sourced application",
          projection_entry_id: "projection-entry-001",
          source_hash: "source-hash-001",
          source_refs_json: ["source-row-001"],
          admission_status: "admitted",
        }),
      ])
      .mockResolvedValueOnce([
        {
          projection_entry_id: "projection-entry-001",
          source_record_id: "source-row-001",
          source_hash: "source-hash-001",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "source-file-001",
          file_name: "applications.csv",
          file_hash: "a".repeat(64),
          source_date: "2026-09-30",
          quality_state: "partial",
        },
      ]);
    jest.spyOn(console, "warn").mockImplementation(() => {});

    const bundle = await getHomeEclProjectionBundle("meridian-health");

    expect(query.mock.calls[1]?.[0]).toEqual(
      expect.stringContaining("source_hash"),
    );
    expect(query.mock.calls[1]?.[0]).toEqual(
      expect.stringContaining("source_refs_json"),
    );
    expect(query.mock.calls[1]?.[0]).toEqual(
      expect.stringContaining("admission_status"),
    );
    expect(query.mock.calls[1]?.[0]).toEqual(
      expect.stringContaining("projection_entry_id"),
    );
    expect(query.mock.calls[2]?.[0]).toEqual(
      expect.stringContaining("projection_entry_source_record_ref"),
    );
    expect(query.mock.calls[2]?.[0]).toEqual(
      expect.stringContaining("entry.source_hash = link.source_hash"),
    );
    expect(query.mock.calls[2]?.[0]).toEqual(
      expect.stringContaining("join ecl_source.source_record source"),
    );
    expect(query.mock.calls[2]?.[1]).toEqual([
      "meridian-health",
      "assessment-dense-source-room-20260823",
    ]);
    expect(query.mock.calls[3]?.[0]).toEqual(
      expect.stringContaining("ecl_source.source_file"),
    );
    expect(query.mock.calls[3]?.[0]).toEqual(
      expect.stringContaining(
        "metadata_json->'load_approval' as load_approval",
      ),
    );
    expect(bundle.contextVersion?.sourceFileReview).toEqual({
      totalFiles: 1,
      acceptedFiles: 0,
      notReviewedFiles: 0,
      partialFiles: 1,
      blockedFiles: 0,
      supersededFiles: 0,
    });
    expect(bundle.contextVersion?.sourceDateCoverage).toEqual({
      earliest: "2026-09-30",
      latest: "2026-09-30",
      datedFiles: 1,
      totalFiles: 1,
    });
    expect(bundle.thesis.signalPacket.contextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ evidenceRefs: ["source-row-001"] }),
      ]),
    );
  });

  it("reads the declared Home assessment as the projection its declaration names", async () => {
    jest.mocked(selectHomeAssessment).mockResolvedValueOnce({
      assessmentId: "assessment-synthetic-enterprise-v2",
      declared: {
        manifestId: "11111111-1111-4111-8111-111111111111",
        projectionVersion: 3,
        projectionHash: "a".repeat(64),
        sourceSetHash: "b".repeat(64),
        rowCount: 1,
      },
    });
    const query = jest
      .spyOn(azureRead, "query")
      .mockResolvedValueOnce([{ full_name: "serving.home_applications_systems" }])
      .mockResolvedValueOnce([
        row({
          page_key: "applications_systems",
          row_key: "APP-001",
          row_type: "application",
          title: "Selected application",
          admission_status: "admitted",
        }),
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    jest.spyOn(console, "warn").mockImplementation(() => {});

    await getHomeEclProjectionBundle("meridian-health");

    expect(selectHomeAssessment).toHaveBeenLastCalledWith("meridian-health");
    expect(query.mock.calls[1]?.[0]).toEqual(
      expect.stringContaining(
        "projection_manifest_id = $3::uuid and projection_version = $4",
      ),
    );
    expect(query.mock.calls[1]?.[1]).toEqual([
      "meridian-health",
      "assessment-synthetic-enterprise-v2",
      "11111111-1111-4111-8111-111111111111",
      3,
    ]);
  });

  it("reads an undeclared assessment by tenant and assessment, as before", async () => {
    const query = jest
      .spyOn(azureRead, "query")
      .mockResolvedValueOnce([{ full_name: "serving.home_applications_systems" }])
      .mockResolvedValueOnce([
        row({
          page_key: "applications_systems",
          row_key: "APP-001",
          row_type: "application",
          title: "Default application",
          admission_status: "admitted",
        }),
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    jest.spyOn(console, "warn").mockImplementation(() => {});

    await getHomeEclProjectionBundle("meridian-health");

    expect(query.mock.calls[1]?.[0]).not.toEqual(
      expect.stringContaining("projection_manifest_id"),
    );
    expect(query.mock.calls[1]?.[1]).toEqual([
      "meridian-health",
      "assessment-dense-source-room-20260823",
    ]);
  });

  it("keeps served rows visible but unlinked when source resolution fails", async () => {
    jest
      .spyOn(azureRead, "query")
      .mockResolvedValueOnce([
        { full_name: "serving.home_applications_systems" },
      ])
      .mockResolvedValueOnce([
        row({
          page_key: "applications_systems",
          row_key: "APP-001",
          row_type: "application",
          title: "A sourced application",
          projection_entry_id: "projection-entry-001",
          source_hash: "source-hash-001",
          source_refs_json: ["source-row-001"],
          admission_status: "admitted",
        }),
      ])
      .mockRejectedValueOnce(new Error("bridge unavailable"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const bundle = await getHomeEclProjectionBundle("meridian-health");

    expect(bundle.technologyEstate?.recordTypes[0]?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ systemName: "A sourced application" }),
      ]),
    );
    expect(bundle.contextVersion?.sourceSetHash).toBeNull();
    expect(bundle.thesis.signalPacket.contextItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ evidenceRefs: [] })]),
    );
    expect(warn).toHaveBeenCalledWith(
      "[home] source-reference resolution unavailable",
      expect.any(Error),
    );
  });

  it("keeps served rows but marks source review unavailable when its catalog read fails", async () => {
    jest
      .spyOn(azureRead, "query")
      .mockResolvedValueOnce([
        { full_name: "serving.home_applications_systems" },
      ])
      .mockResolvedValueOnce([
        row({
          page_key: "applications_systems",
          row_key: "APP-001",
          row_type: "application",
          title: "A sourced application",
          projection_entry_id: "projection-entry-001",
          source_hash: "source-hash-001",
          source_refs_json: ["source-row-001"],
          admission_status: "admitted",
        }),
      ])
      .mockResolvedValueOnce([
        {
          projection_entry_id: "projection-entry-001",
          source_record_id: "source-row-001",
          source_hash: "source-hash-001",
        },
      ])
      .mockRejectedValueOnce(new Error("source catalog unavailable"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const bundle = await getHomeEclProjectionBundle("meridian-health");

    expect(bundle.technologyEstate?.recordTypes[0]?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ systemName: "A sourced application" }),
      ]),
    );
    expect(bundle.contextVersion?.sourceFileReview).toBeNull();
    expect(bundle.contextVersion?.sourceCatalogHash).toBeNull();
    expect(bundle.contextVersion?.coherence).toBe("stored_narrative");
    expect(warn).toHaveBeenCalledWith(
      "[home] source-file review state unavailable",
      expect.any(Error),
    );
  });

  it("falls back to the reviewed Home bundle when the Meridian ECL serving projection is empty", async () => {
    jest.spyOn(azureRead, "query").mockResolvedValueOnce([]);
    const error = jest.spyOn(console, "error").mockImplementation(() => {});

    const base = getHomeReviewBundle("meridian-health");
    const bundle =
      await getHomeEclProjectionBundleOrReviewedSnapshot("meridian-health");

    expect(bundle).toBe(base);
    expect(bundle.technologyEstate?.recordTypes[0]?.rows.length).toBe(306);
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.parse(error.mock.calls[0]?.[0] as string)).toMatchObject({
      level: "error",
      event: "home_projection_fault",
      metadata: {
        tenantKey: "meridian-health",
        reason: "default_assessment_has_no_rows",
        served: "reviewed_snapshot",
      },
    });
  });

  it("reports fallback provenance when the Meridian ECL serving projection is empty", async () => {
    jest.spyOn(azureRead, "query").mockResolvedValueOnce([]);
    jest.spyOn(console, "error").mockImplementation(() => {});

    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const result =
      await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(
        "meridian-health",
      );

    expect(result.bundle).toBe(base);
    expect(result.recordSource).toEqual({
      kind: "reviewed_snapshot_fallback",
      canonicalSnapshotHash: base.provenance.canonical_snapshot_hash,
    });
  });

  it("does not label an entirely refused projection as live", async () => {
    jest
      .spyOn(azureRead, "query")
      .mockResolvedValueOnce([
        { full_name: "serving.home_business_unit_profile" },
      ])
      .mockResolvedValueOnce([
        row({
          page_key: "business_unit_profile",
          row_key: "refused-segment",
          row_type: "business_segment",
          title: "Refused segment",
          admission_status: "refused",
          display_payload_json: {
            segment_key: "refused-segment",
            segment_name: "Refused segment",
          },
        }),
      ]);
    jest.spyOn(console, "error").mockImplementation(() => {});

    const result =
      await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(
        "meridian-health",
      );

    expect(result.recordSource.kind).toBe("reviewed_snapshot_fallback");
    expect(result.bundle).toBe(getHomeReviewBundle("meridian-health"));
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
    expect(bundle.contextVersion?.coherence).toBe("unverified");
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

  it("does not tell Home that leadership interviews are absent when the served record carries them", () => {
    const base = getHomeReviewBundle("meridian-health");
    expect(base).toBeTruthy();

    const bundle = buildHomeReviewBundleFromEclProjectionRows(base!, [
      row({
        page_key: "executive_interviews",
        row_key: "INT-001",
        row_type: "interview",
        title: "CFO interview response",
        display_payload_json: {
          interview_id: "INT-001",
          executive_area: "CFO / Finance",
          stakeholder_role: "Chief Financial Officer",
          priority_theme: "value realization",
          synthetic_answer: "The value story needs clearer proof.",
        },
      }),
    ]);

    const leadershipScope = bundle.thesis.signalPacket.contextItems.find(
      (item) => item.id === "ctx_ecl_scope_leadership_001",
    );
    expect(leadershipScope?.statement).toContain(
      "Leadership interview records are supplied",
    );
    expect(leadershipScope?.statement).toContain("1 responses");
    expect(leadershipScope?.statement).not.toMatch(/not supplied/i);
    expect(leadershipScope?.domains).toContain("executive_interview");
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

  it("preserves the reviewed executive narrative when served ECL rows have no published chapter claims", () => {
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
      row({
        page_key: "applications_systems",
        row_key: "APP-001",
        row_type: "application",
        title: "Claims Administration Platform",
        display_payload_json: {
          application_id: "APP-001",
          application_name: "Claims Administration Platform",
          business_function: "Health Plan Operations",
        },
      }),
    ]);

    expect(bundle.thesis.publishedGeneration.enterprise_story).toBe(
      base!.thesis.publishedGeneration.enterprise_story,
    );
    expect(
      bundle.thesis.publishedGeneration.things_a_new_cxo_should_know,
    ).toEqual(base!.thesis.publishedGeneration.things_a_new_cxo_should_know);
    expect(bundle.chapters).toHaveLength(8);
    expect(bundle.chapters[0]?.headline).toBe(base!.chapters[0]?.headline);
    expect(bundle.chapters[0]?.executive_synthesis).toBe(
      base!.chapters[0]?.executive_synthesis,
    );
    expect(bundle.executiveStoryPlan).toEqual(base!.executiveStoryPlan);
    expect(bundle.provenance.canonical_snapshot_hash).toBe(
      "ecl:assessment-dense-source-room-20260823:serving.home_*:2",
    );
    expect(bundle.provenance.model).toBe("deterministic-ecl-projection");
    expect(bundle.contextVersion).toEqual(
      expect.objectContaining({
        assessmentId: "assessment-dense-source-room-20260823",
        coherence: "stored_narrative",
        narrativePacketHash: null,
        narrativeGeneratedAt: base!.provenance.generated_at,
        dataAsOf: null,
        projectionContentHash: expect.any(String),
        deterministicPacketHash: expect.any(String),
      }),
    );
    expect(
      bundle.technologyEstate?.recordTypes.find(
        (recordType) => recordType.objectType === "application_system",
      )?.rows,
    ).toEqual([
      expect.objectContaining({
        systemName: "Claims Administration Platform",
      }),
    ]);
    expect(bundle.thesis.signalPacket.contextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ctx_ecl_applications_systems_application_APP_001",
          statement: expect.stringContaining(
            "Claims Administration Platform is loaded as an application",
          ),
        }),
      ]),
    );
  });

  it("carries admitted source references into a citable served context item", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const bundle = buildHomeReviewBundleFromEclProjectionRows(
      base,
      [
        row({
          page_key: "applications_systems",
          row_key: "APP-001",
          row_type: "application",
          title: "Claims Administration Platform",
          projection_entry_id: "projection-entry-001",
          source_hash: "source-hash-001",
          source_refs_json: [
            { source_record_id: "source-row-001" },
            { source_record_id: "source-row-001" },
          ],
          primary_object_id: "canonical-app-001",
          admission_status: "admitted",
        }),
      ],
      undefined,
      new Map([
        [
          "projection-entry-001",
          new Map([["source-hash-001", new Set(["source-row-001"])]]),
        ],
      ]),
    );

    const contextId = "ctx_ecl_applications_systems_application_APP_001";
    expect(
      bundle.thesis.signalPacket.contextItems.find(
        (item) => item.id === contextId,
      )?.evidenceRefs,
    ).toEqual(["source-row-001"]);
    expect(resolveEvidence([contextId], bundle.thesis.signalPacket)[0]).toEqual(
      expect.objectContaining({ evidenceRefs: ["source-row-001"] }),
    );
    const applications = bundle.technologyEstate?.recordTypes.find(
      (type) => type.objectType === "application_system",
    );
    expect(applications?.rowSourceRefs).toEqual([["source-row-001"]]);
    expect(applications?.columns).not.toContain("rowSourceRefs");
    expect(bundle.contextVersion?.sourceSetHash).toEqual(expect.any(String));
  });

  it("does not treat a refused or unlinked serving row as source-backed", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const bundle = buildHomeReviewBundleFromEclProjectionRows(base, [
      row({
        page_key: "applications_systems",
        row_key: "APP-002",
        row_type: "application",
        title: "Unlinked application",
        source_hash: "source-hash-002",
        source_refs_json: ["source-row-002"],
        admission_status: "refused",
      }),
    ]);

    expect(
      bundle.technologyEstate?.recordTypes.some(
        (type) => type.objectType === "application_system",
      ),
    ).toBe(false);
    expect(
      bundle.thesis.signalPacket.contextItems.some(
        (item) =>
          item.id === "ctx_ecl_applications_systems_application_APP_002",
      ),
    ).toBe(false);
    expect(bundle.thesis.signalPacket.contextItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "ctx_ecl_gap_withheld_rows_001" }),
      ]),
    );
    expect(bundle.contextVersion?.sourceSetHash).toBeNull();
    expect(bundle.contextVersion?.coherence).toBe("stored_narrative");
  });

  it("does not verify a declared source ref missing from the canonical bridge", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const bundle = buildHomeReviewBundleFromEclProjectionRows(
      base,
      [
        row({
          page_key: "applications_systems",
          row_key: "APP-003",
          row_type: "application",
          title: "Unverified application",
          projection_entry_id: "projection-entry-003",
          source_hash: "source-hash-003",
          source_refs_json: [{ source_record_id: "missing-source-row" }],
          admission_status: "admitted",
        }),
      ],
      undefined,
      new Map([
        [
          "projection-entry-003",
          new Map([["source-hash-003", new Set(["different-source-row"])]]),
        ],
      ]),
    );

    expect(
      bundle.thesis.signalPacket.contextItems.find(
        (item) =>
          item.id === "ctx_ecl_applications_systems_application_APP_003",
      )?.evidenceRefs,
    ).toEqual([]);
    expect(
      bundle.technologyEstate?.recordTypes.find(
        (type) => type.objectType === "application_system",
      )?.rowSourceRefs,
    ).toEqual([[]]);
    expect(bundle.contextVersion?.sourceSetHash).toBeNull();
  });

  it("does not reuse a source link from an older version of the served row", () => {
    const estate = buildTechnologyEstateFromHomeProjectionRows(
      [
        row({
          page_key: "applications_systems",
          row_key: "APP-004",
          row_type: "application",
          title: "Updated application",
          projection_entry_id: "projection-entry-004",
          source_hash: "current-hash",
          source_refs_json: ["source-row-004"],
          admission_status: "admitted",
        }),
      ],
      new Map([
        [
          "projection-entry-004",
          new Map([["prior-hash", new Set(["source-row-004"])]]),
        ],
      ]),
    );

    expect(estate.recordTypes[0]?.rowSourceRefs).toEqual([[]]);
  });

  it("keeps verified references aligned when data flows and workloads share one browser", () => {
    const rows = [
      row({
        page_key: "data_assets_integrations",
        row_key: "WORKLOAD-1",
        row_type: "data_analytics_workload",
        title: "Reporting workload",
        projection_entry_id: "workload-entry",
        source_hash: "workload-hash",
        source_refs_json: ["workload-source"],
        admission_status: "admitted",
      }),
      row({
        page_key: "current_state_data_flow",
        row_key: "FLOW-1",
        row_type: "data_flow",
        title: "Claims flow",
        projection_entry_id: "flow-entry",
        source_hash: "flow-hash",
        source_refs_json: ["flow-source"],
        admission_status: "admitted",
      }),
    ];
    const estate = buildTechnologyEstateFromHomeProjectionRows(
      rows,
      new Map([
        [
          "workload-entry",
          new Map([["workload-hash", new Set(["workload-source"])]]),
        ],
        ["flow-entry", new Map([["flow-hash", new Set(["flow-source"])]])],
      ]),
    );
    const data = estate.recordTypes.find(
      (type) => type.objectType === "data_asset_or_integration",
    );

    expect(data?.rows).toHaveLength(2);
    expect(data?.rowSourceRefs).toEqual([["flow-source"], ["workload-source"]]);
  });

  it("versions partial source lineage when only a verified link changes", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const rows = [
      row({
        page_key: "applications_systems",
        row_key: "APP-004",
        row_type: "application",
        title: "Linked application",
        projection_entry_id: "projection-entry-004",
        source_hash: "source-hash-004",
        source_refs_json: [{ source_record_id: "source-row-004" }],
        admission_status: "admitted",
      }),
      row({
        page_key: "metrics_outcomes",
        row_key: "MET-001",
        row_type: "metric",
        title: "Unlinked metric",
        source_hash: "source-hash-005",
        admission_status: "admitted",
      }),
    ];
    const before = buildHomeReviewBundleFromEclProjectionRows(base, rows);
    const after = buildHomeReviewBundleFromEclProjectionRows(
      base,
      rows,
      undefined,
      new Map([
        [
          "projection-entry-004",
          new Map([["source-hash-004", new Set(["source-row-004"])]]),
        ],
      ]),
    );

    expect(before.contextVersion?.projectionContentHash).toBe(
      after.contextVersion?.projectionContentHash,
    );
    expect(before.contextVersion?.sourceSetHash).toBeNull();
    expect(after.contextVersion?.sourceSetHash).toBeNull();
    expect(before.contextVersion?.sourceLineageHash).not.toBe(
      after.contextVersion?.sourceLineageHash,
    );
    expect(before.contextVersion?.sourceCoverage).toEqual({
      totalRecordRows: 2,
      linkedRecordRows: 0,
      families: [
        { pageKey: "applications_systems", totalRows: 1, linkedRows: 0 },
        { pageKey: "metrics_outcomes", totalRows: 1, linkedRows: 0 },
      ],
    });
    expect(after.contextVersion?.sourceCoverage.linkedRecordRows).toBe(1);
  });

  it("versions source review changes even when projection rows and links do not change", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const rows = [
      row({
        page_key: "applications_systems",
        row_key: "APP-005",
        row_type: "application",
        title: "One application",
        projection_entry_id: "projection-entry-005",
        source_hash: "row-hash",
        source_refs_json: [{ source_record_id: "source-row-005" }],
        admission_status: "admitted",
      }),
    ];
    const links = new Map([
      [
        "projection-entry-005",
        new Map([["row-hash", new Set(["source-row-005"])]]),
      ],
    ]);
    const sourceFile: HomeSourceFileReviewRow = {
      id: "source-file-005",
      file_name: "applications.csv",
      file_hash: "a".repeat(64),
      source_date: "2026-09-30",
      quality_state: "partial",
    };
    const partial = buildHomeReviewBundleFromEclProjectionRows(
      base,
      rows,
      undefined,
      links,
      [sourceFile],
    );
    const accepted = buildHomeReviewBundleFromEclProjectionRows(
      base,
      rows,
      undefined,
      links,
      [
        {
          ...sourceFile,
          quality_state: "accepted",
          load_approval: RECORDED_APPROVAL,
        },
      ],
    );
    const acceptedStateOnly = buildHomeReviewBundleFromEclProjectionRows(
      base,
      rows,
      undefined,
      links,
      [{ ...sourceFile, quality_state: "accepted" }],
    );
    expect(partial.contextVersion?.projectionContentHash).toBe(
      accepted.contextVersion?.projectionContentHash,
    );
    expect(partial.contextVersion?.sourceLineageHash).toBe(
      accepted.contextVersion?.sourceLineageHash,
    );
    expect(partial.contextVersion?.sourceCatalogHash).not.toBe(
      accepted.contextVersion?.sourceCatalogHash,
    );
    const sourceFor = (bundle: HomeReviewBundle) => ({
      kind: "ecl_serving_projection" as const,
      canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
      contextVersion: bundle.contextVersion,
    });
    expect(
      homeRecordSourceToken("meridian-health", sourceFor(partial)),
    ).not.toBe(homeRecordSourceToken("meridian-health", sourceFor(accepted)));
    expect(homeSourceFileReviewLabel(sourceFor(partial))).toBe(
      "Source-file quality: 0 of 1 accepted; 1 partial",
    );
    expect(homeSourceFileReviewLabel(sourceFor(accepted))).toBe(
      "Source-file quality: 1 of 1 accepted",
    );
    // The accepted state with no approval recorded beside it is not acceptance, and recording
    // the approval is a new version of the record even though no file changed.
    expect(homeSourceFileReviewLabel(sourceFor(acceptedStateOnly))).toBe(
      "Source-file quality: 0 of 1 accepted; 1 not reviewed",
    );
    expect(acceptedStateOnly.contextVersion?.sourceCatalogHash).not.toBe(
      accepted.contextVersion?.sourceCatalogHash,
    );
    expect(
      homeRecordSourceToken("meridian-health", sourceFor(acceptedStateOnly)),
    ).not.toBe(homeRecordSourceToken("meridian-health", sourceFor(accepted)));
    const redated = buildHomeReviewBundleFromEclProjectionRows(
      base,
      rows,
      undefined,
      links,
      [{ ...sourceFile, source_date: "2026-10-01" }],
    );
    expect(redated.contextVersion?.sourceCatalogHash).not.toBe(
      partial.contextVersion?.sourceCatalogHash,
    );
    expect(
      homeRecordSourceToken("meridian-health", sourceFor(redated)),
    ).not.toBe(homeRecordSourceToken("meridian-health", sourceFor(partial)));
    expect(homeSourceDateCoverageLabel(sourceFor(redated))).toBe(
      "Registered source dates: 2026-10-01 (1 of 1 files); data currency not attested",
    );
    const incompletelyDated = buildHomeReviewBundleFromEclProjectionRows(
      base,
      rows,
      undefined,
      links,
      [
        sourceFile,
        {
          ...sourceFile,
          id: "source-file-006",
          file_name: "undated.csv",
          source_date: null,
        },
      ],
    );
    expect(homeSourceDateCoverageLabel(sourceFor(incompletelyDated))).toBe(
      "Registered source dates: 2026-09-30 (1 of 2 files); data currency not attested",
    );
  });

  it("withholds a coherent narrative label until the source files are accepted", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const rows = [
      ...chapterSummaryFixtures(),
      storyPlanFixture(),
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_writer_claim_001",
        row_type: "chapter_claim",
        title: "Published scope claim",
        summary: "The contract record supplies a scoped business fact.",
        display_payload_json: {
          evidence_ids: ["ctx_ecl_vendor_contracts_contract_CTR_005"],
          claim_type: "FACT",
          confidence: "high",
        },
      }),
      row({
        page_key: "vendor_contracts",
        row_key: "CTR-005",
        row_type: "contract",
        title: "A contract",
        projection_entry_id: "projection-entry-005",
        source_hash: "row-hash",
        source_refs_json: [{ source_record_id: "source-row-005" }],
        admission_status: "admitted",
      }),
    ];
    const links = new Map([
      [
        "projection-entry-005",
        new Map([["row-hash", new Set(["source-row-005"])]]),
      ],
    ]);
    const packet = writerShapedPacket(base);
    expect(packet).not.toHaveProperty("homeEnterpriseContext");
    const narrativePacketArtifact = createHomeNarrativePacketArtifact({
      tenantKey: base.tenantKey,
      assessmentId: denseAssessmentIdForTenant(base.tenantKey),
      rows,
      verifiedSourceRefs: links,
      packet,
    });
    expect(narrativePacketArtifact.packetHash).toBe(
      hashHomeNarrativeValue(packet),
    );
    const withWriters = rows.map((item) =>
      item.row_type === "summary"
        ? {
            ...item,
            display_payload_json: {
              writer: {
                signal_packet_hash: narrativePacketArtifact.packetHash,
                generated_at: "2026-09-30T00:00:00.000Z",
              },
            },
          }
        : item.row_type === "story_plan"
        ? {
            ...item,
            display_payload_json: {
              ...item.display_payload_json,
              narrative_packet_artifact: narrativePacketArtifact,
            },
          }
        : item,
    );
    const sourceFile: HomeSourceFileReviewRow = {
      id: "source-file-005",
      file_name: "contracts.csv",
      file_hash: "a".repeat(64),
      source_date: "2026-09-30",
      quality_state: "accepted",
      load_approval: RECORDED_APPROVAL,
    };
    const accepted = buildHomeReviewBundleFromEclProjectionRows(
      base,
      withWriters,
      undefined,
      links,
      [sourceFile],
    );
    const partial = buildHomeReviewBundleFromEclProjectionRows(
      base,
      withWriters,
      undefined,
      links,
      [{ ...sourceFile, quality_state: "partial" }],
    );
    // The reader's hash is the build's hash of the build's packet -- not a hash of whatever the
    // reader goes on to hand the page.
    expect(accepted.contextVersion?.deterministicPacketHash).toBe(
      narrativePacketArtifact.packetHash,
    );
    expect(accepted.contextVersion?.narrativePacketHash).toBe(
      narrativePacketArtifact.packetHash,
    );
    expect(accepted.contextVersion?.sourceSetHash).toEqual(expect.any(String));
    expect(accepted.contextVersion?.coherence).toBe("coherent");
    expect(partial.contextVersion?.coherence).toBe("unverified");
    // The page reads the written packet plus what the reader derived for it, and nothing else.
    expect(accepted.thesis.signalPacket).toEqual({
      ...packet,
      homeEnterpriseContext: null,
    });
    // A file in the accepted state is not accepted until an approval is recorded for its load.
    for (const load_approval of [
      undefined,
      null,
      {},
      { ...RECORDED_APPROVAL, approved_by: "" },
      { ...RECORDED_APPROVAL, approved_at: undefined },
      { ...RECORDED_APPROVAL, release_record: " " },
    ]) {
      expect(
        buildHomeReviewBundleFromEclProjectionRows(
          base,
          withWriters,
          undefined,
          links,
          [{ ...sourceFile, load_approval }],
        ).contextVersion?.coherence,
      ).toBe("unverified");
    }
    expect(buildHomeReviewBundleFromEclProjectionRows(base, withWriters.map((item) =>
      item.row_type === "story_plan" ? { ...item, display_payload_json: { story_plan: storyPlanFixture().display_payload_json?.story_plan } } : item,
    ), undefined, links, [sourceFile]).contextVersion?.coherence).toBe("unverified");
    expect(buildHomeReviewBundleFromEclProjectionRows(base, withWriters.map((item) =>
      item.row_key === "CTR-005" ? { ...item, title: "Changed contract" } : item,
    ), undefined, links, [sourceFile]).contextVersion?.coherence).toBe("unverified");
    expect(buildHomeReviewBundleFromEclProjectionRows(base, withWriters, undefined, new Map(), [sourceFile]).contextVersion?.coherence).toBe("unverified");
    expect(buildHomeReviewBundleFromEclProjectionRows(base, withWriters.map((item) =>
      item.row_type === "story_plan" ? { ...item, display_payload_json: {
        ...item.display_payload_json,
        narrative_packet_artifact: { ...narrativePacketArtifact, packetHash: "tampered" },
      } } : item,
    ), undefined, links, [sourceFile]).contextVersion?.coherence).toBe("unverified");

    const withScopeAndRowEvidence = buildHomeReviewBundleFromEclProjectionRows(
      base,
      withWriters.map((item) =>
        item.row_type === "chapter_claim"
          ? {
              ...item,
              display_payload_json: {
                ...item.display_payload_json,
                evidence_ids: [
                  "ctx_ecl_scope_business_economics_001",
                  "ctx_ecl_vendor_contracts_contract_CTR_005",
                ],
              },
            }
          : item,
      ),
      undefined,
      links,
      [sourceFile],
    );
    expect(withScopeAndRowEvidence.contextVersion?.coherence).toBe("coherent");

    for (const evidenceId of [
      "ctx_ecl_scope_business_economics_001",
      "sig_ecl_contract_value_005",
    ]) {
      const withoutRowEvidence = buildHomeReviewBundleFromEclProjectionRows(
        base,
        withWriters.map((item) =>
          item.row_type === "chapter_claim"
            ? {
                ...item,
                display_payload_json: {
                  ...item.display_payload_json,
                  evidence_ids: [evidenceId],
                },
              }
            : item,
        ),
        undefined,
        links,
        [sourceFile],
      );
      expect(withoutRowEvidence.contextVersion?.sourceSetHash).toEqual(
        expect.any(String),
      );
      expect(withoutRowEvidence.contextVersion?.narrativePacketHash).toBe(
        withoutRowEvidence.contextVersion?.deterministicPacketHash,
      );
      expect(withoutRowEvidence.contextVersion?.coherence).toBe("unverified");
    }
  });

  it("keeps a published narrative coherent when the reader attaches an enterprise context", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const sourced = (
      input: Parameters<typeof row>[0],
      index: number,
    ): HomeProjectionRow =>
      row({
        ...input,
        projection_entry_id: `projection-entry-10${index}`,
        source_hash: "row-hash",
        source_refs_json: [{ source_record_id: `source-row-10${index}` }],
        admission_status: "admitted",
      });
    const recordRows = [
      {
        page_key: "vendor_contracts",
        row_key: "CTR-005",
        row_type: "contract",
        title: "A contract",
      },
      {
        page_key: "business_unit_profile",
        row_key: "ENT-1",
        row_type: "enterprise_profile",
        title: "Reference enterprise",
        display_payload_json: {
          business_model: "Reference business model",
          business_model_basis: "synthetic_reference_not_client_attested",
        },
      },
      {
        page_key: "business_unit_profile",
        row_key: "SEG-1",
        row_type: "business_segment",
        title: "Segment one",
        display_payload_json: {
          segment_key: "SEG-1",
          segment_name: "Segment one",
        },
      },
      {
        page_key: "business_unit_profile",
        row_key: "FUNC-1",
        row_type: "business_function",
        title: "Function one",
        display_payload_json: {
          function_id: "FUNC-1",
          function_name: "Function one",
          business_segment_key: "SEG-1",
        },
      },
    ].map(sourced);
    const rows = [
      ...chapterSummaryFixtures(),
      storyPlanFixture(),
      row({
        page_key: "executive_brief",
        row_key: "executive_brief_writer_claim_001",
        row_type: "chapter_claim",
        title: "Published scope claim",
        summary: "The contract record supplies a scoped business fact.",
        display_payload_json: {
          evidence_ids: ["ctx_ecl_vendor_contracts_contract_CTR_005"],
          claim_type: "FACT",
          confidence: "high",
        },
      }),
      ...recordRows,
    ];
    const links = new Map(
      recordRows.map((item) => [
        item.projection_entry_id as string,
        new Map([
          [
            "row-hash",
            new Set([
              (item.source_refs_json as Array<{ source_record_id: string }>)[0]
                .source_record_id,
            ]),
          ],
        ]),
      ]),
    );
    const packet = writerShapedPacket(base);
    const narrativePacketArtifact = createHomeNarrativePacketArtifact({
      tenantKey: base.tenantKey,
      assessmentId: denseAssessmentIdForTenant(base.tenantKey),
      rows,
      verifiedSourceRefs: links,
      packet,
    });
    const served = buildHomeReviewBundleFromEclProjectionRows(
      base,
      rows.map((item) =>
        item.row_type === "summary"
          ? {
              ...item,
              display_payload_json: {
                writer: {
                  signal_packet_hash: narrativePacketArtifact.packetHash,
                  generated_at: "2026-09-30T00:00:00.000Z",
                },
              },
            }
          : item.row_type === "story_plan"
            ? {
                ...item,
                display_payload_json: {
                  ...item.display_payload_json,
                  narrative_packet_artifact: narrativePacketArtifact,
                },
              }
            : item,
      ),
      undefined,
      links,
      [
        {
          id: "source-file-100",
          file_name: "record.csv",
          file_hash: "a".repeat(64),
          source_date: "2026-09-30",
          quality_state: "accepted",
          load_approval: RECORDED_APPROVAL,
        },
      ],
    );

    // The context is on the packet the page reads...
    expect(
      served.thesis.signalPacket.homeEnterpriseContext?.segmentSpine.segments,
    ).toHaveLength(1);
    // ...and outside the packet that was hashed, so the narrative written against this record
    // still reads as aligned with it.
    expect(served.contextVersion?.deterministicPacketHash).toBe(
      narrativePacketArtifact.packetHash,
    );
    expect(served.contextVersion?.coherence).toBe("coherent");
    // The narrative build's own row is not a record row, so nothing is reported as left out.
    expect(
      served.thesis.signalPacket.homeEnterpriseContext?.excludedUncitedRows,
    ).toBe(0);
  });

  it("carries the tenant's declared classification from the stored bundle to the served one", () => {
    const base = getHomeReviewBundle("meridian-health");
    if (!base) throw new Error("stored copy missing");
    const rows = [
      row({
        page_key: "applications_systems",
        row_key: "APP-1",
        row_type: "application",
        title: "One application",
      }),
    ];
    for (const declaredSyntheticDemo of [true, false, undefined]) {
      expect(
        buildHomeReviewBundleFromEclProjectionRows(
          { ...base, declaredSyntheticDemo },
          rows,
        ).declaredSyntheticDemo,
      ).toBe(declaredSyntheticDemo);
    }
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
