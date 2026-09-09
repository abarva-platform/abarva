import { readFileSync } from "node:fs";

import {
  SOURCE_CHART_PALETTE,
  contractSearchRank,
  displayBenchmarkingClause,
  focusedContractSet,
  focusedVendorSet,
  optimizeTypeRows,
  performanceActual,
  resolveSelectedVendor,
  sourceImpactCoverageRowTotal,
  source360RecoverableCreditCoverageRows,
  source360RecoverableCreditFinding,
  topVendors,
  vendorArchetypeCoverage,
  vendorArchetypeRows,
  vendorCoverageRows,
  vendorLinkedContracts,
} from "../WorkspaceExecutiveShell";
import { focusableContractRows } from "../contractDiscovery";
import { INITIAL_STATE, WorkspaceViewModel } from "../viewModel";

describe("WorkspaceExecutiveShell performance formatting", () => {
  it("keeps Source charts on semantic palette tokens instead of hard-black slabs", () => {
    expect(Object.values(SOURCE_CHART_PALETTE)).not.toContain("#0a0a0b");

    const source = readFileSync(
      `${__dirname}/../WorkspaceExecutiveShell.tsx`,
      "utf8",
    );

    expect(source).not.toContain('fill="#0a0a0b"');
    expect(source).not.toContain('stroke="#0a0a0b"');
    expect(source).not.toContain("<b>black</b>");
    expect(source).not.toContain('? "#0a0a0b"');
  });

  it("keeps Source navigation singular and avoids duplicate toolbar actions", () => {
    const source = readFileSync(
      `${__dirname}/../WorkspaceExecutiveShell.tsx`,
      "utf8",
    );
    const css = readFileSync(`${__dirname}/../workspace.css`, "utf8");

    expect(source).toContain('aria-label="Source workspace navigation"');
    expect(source).not.toContain('aria-label="Source workspace header"');
    expect(source).not.toContain(
      'aria-label="Persistent Source workspace toolbar"',
    );
    expect(source).toContain("sw-v2-impact-load-badge");
    expect(css).toContain(".sw-v2-horizontal-tabs");
    expect(css).not.toContain(".sw-v2-frame-bar");
    expect(css).not.toContain(".sw-v2-sticky-context");
    expect(css).not.toContain(".sw-v2-compact-action-button");
    expect(source).not.toContain("<span>Evidence</span></button>");
    expect(source).not.toContain("<span>Graph</span></button>");
  });

  it("renders commercial posture on the product-shell Contract 360 page", () => {
    const source = readFileSync(
      `${__dirname}/../WorkspaceExecutiveShell.tsx`,
      "utf8",
    );

    expect(source).toContain("<ProductShellCommercialPostureStrip vm={vm} />");
    expect(source).toContain('aria-label="Commercial posture"');
    expect(source).toContain('PanelHead eyebrow="Commercial posture"');
    expect(source).toContain("posture.items.map");
  });

  it("renders the Optimize executive lever summary in the product shell", () => {
    const source = readFileSync(
      `${__dirname}/../WorkspaceExecutiveShell.tsx`,
      "utf8",
    );

    expect(source).toContain(
      "<ProductShellOptimizationExecutiveStrip vm={vm} />",
    );
    expect(source).toContain('tab === "Optimize"');
    expect(source).toContain('aria-label="Executive lever summary"');
    expect(source).toContain("Signal-stage");
    expect(source).toContain("requires more evidence before upgrade");
    expect(source).toContain("no outcome claimed");
  });

  it("promotes supplemental depth/action contracts into the focused contract list", () => {
    const action = (
      contractId: string,
      vendorName: string,
      amount: number,
      index: number,
    ) => ({
      tenant_key: "meridian-health",
      action_candidate_id: `${contractId}:action:${index}`,
      opportunity_id: `${contractId}:opportunity:${index}`,
      contract_id: contractId,
      vendor_ref: vendorName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
      vendor_name: vendorName,
      title: "Loaded optimization action",
      action_type: "commercial_opportunity",
      opportunity_type: "negotiated_improvement",
      finding_summary: "Loaded governed opportunity evidence",
      deterministic_basis: "source opportunity projection",
      candidate_amount_usd: amount,
      priority: "high",
      readiness_state: "candidate",
      evidence_state: "present",
      authority_state: "not_confirmed",
      finance_confirmation_state: "not_confirmed",
      next_action: "Open Optimize",
      accountable_role: "Finance",
      decision_due_date: null,
      coverage_state: "decision_ready",
      blocker_if_missing: null,
      citation_basis_json: null,
      load_run_id: "test-run",
    });
    const portfolio = {
      contracts: [
        {
          tenant_key: "meridian-health",
          contract_id: "CTR-REGISTRY-001",
          vendor_ref: "vendor-register",
          vendor_name: "Large Registry Vendor",
          vendor_category: "platform",
          contract_name: "Large header-only registry agreement",
          annual_value: 50_000_000,
          actual_annual_spend: null,
          total_committed_value: null,
          committed_annual_spend: null,
          auto_renew: false,
        },
      ],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "meridian-health",
            contract_id: "MER-TECH-DBX-001",
            vendor_ref: "vendor-databricks",
            vendor_name: "Databricks, Inc.",
            vendor_category: "cloud_data_platform",
            contract_archetype: "cloud_consumption",
            contract_name: "Databricks Enterprise Agreement",
            spend_rows: 12,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 12,
            unclaimed_credit_usd: 0,
            opportunity_rows: 6,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
          {
            tenant_key: "meridian-health",
            contract_id: "MER-CLOUD-AWS-001",
            vendor_ref: "vendor-aws",
            vendor_name: "Amazon Web Services, Inc.",
            vendor_category: "cloud",
            contract_archetype: "cloud_consumption",
            contract_name: "AWS Enterprise Discount Program",
            spend_rows: 12,
            actual_spend_usd: 24_300_000,
            committed_spend_usd: 23_400_000,
            performance_rows: 12,
            unclaimed_credit_usd: 0,
            opportunity_rows: 5,
            scope_rows: 5,
            critical_scope_rows: 3,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [
          ...Array.from({ length: 6 }, (_, index) =>
            action("MER-TECH-DBX-001", "Databricks, Inc.", 620_000, index),
          ),
          ...Array.from({ length: 5 }, (_, index) =>
            action(
              "MER-CLOUD-AWS-001",
              "Amazon Web Services, Inc.",
              620_000,
              index,
            ),
          ),
        ],
        claimCards: [],
      },
    };

    const focus = focusedContractSet(portfolio as never, 3);

    expect(focus.rows.map((row) => row.contract.contract_id)).toEqual([
      "MER-TECH-DBX-001",
      "MER-CLOUD-AWS-001",
      "CTR-REGISTRY-001",
    ]);
    expect(focus.rows[0]).toMatchObject({
      actionRows: 6,
      reason: "6 action rows",
    });
    expect(focus.rows[1]).toMatchObject({
      actionRows: 5,
      reason: "5 action rows",
    });
    expect(focus.rows[0]?.contract.contract_name).toContain("Databricks");
    expect(focus.rows[1]?.contract.vendor_name).toBe(
      "Amazon Web Services, Inc.",
    );
  });

  it("sorts searched supplemental vendor contracts ahead of old register-only rows", () => {
    const oldRegisterRow = {
      contractId: "CTR-OLD-DATABRICKS-001",
      contractName: "Older Databricks register agreement",
      vendorName: "Databricks, Inc.",
      sourceLabel: "Governed register",
      sourceDetail: "$250K",
      isSupplemental: false,
      sortValue: 250_000,
      evidenceScore: 0,
      searchText: ["ctr-old-databricks-001", "databricks, inc."],
    };
    const loadedDepthRow = {
      contractId: "MER-TECH-DBX-001",
      contractName: "Databricks Enterprise Agreement",
      vendorName: "Databricks, Inc.",
      sourceLabel: "Supplemental depth",
      sourceDetail: "decision ready",
      isSupplemental: true,
      sortValue: 1_900_000,
      evidenceScore: 760,
      searchText: ["mer-tech-dbx-001", "databricks, inc."],
    };

    const rows = [oldRegisterRow, loadedDepthRow].sort(
      (a, b) =>
        contractSearchRank(a, "databricks") -
          contractSearchRank(b, "databricks") ||
        b.evidenceScore - a.evidenceScore ||
        (b.sortValue ?? 0) - (a.sortValue ?? 0) ||
        a.contractId.localeCompare(b.contractId),
    );

    expect(rows[0]?.contractId).toBe("MER-TECH-DBX-001");
  });

  it("groups supplemental depth contracts under a selected vendor even when vendor refs differ", () => {
    const portfolio = {
      contracts: [
        {
          tenant_key: "meridian-health",
          contract_id: "CTR-OLD-DATABRICKS-001",
          vendor_ref: "legacy-dbx-vendor-ref",
          vendor_name: "Databricks, Inc.",
          vendor_category: "cloud_data_platform",
          contract_name: "Older Databricks register agreement",
          annual_value: 250_000,
          actual_annual_spend: null,
          total_committed_value: null,
          committed_annual_spend: null,
          auto_renew: false,
        },
      ],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "meridian-health",
            contract_id: "MER-TECH-DBX-001",
            vendor_ref: "MER-VEN-DATABRICKS",
            vendor_name: "Databricks, Inc.",
            vendor_category: "cloud_data_platform",
            contract_archetype: "cloud_consumption",
            contract_name: "Databricks Enterprise Agreement",
            spend_rows: 12,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 12,
            unclaimed_credit_usd: 0,
            opportunity_rows: 6,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [],
        claimCards: [],
      },
    };
    const selectedVendor = {
      tenant_key: "meridian-health",
      vendor_ref: "legacy-dbx-vendor-ref",
      vendor_refs: ["legacy-dbx-vendor-ref"],
      vendor_name: "Databricks, Inc.",
      vendor_category: "cloud_data_platform",
      contract_count: 1,
      annual_value: 250_000,
      total_committed_value: null,
      auto_renew_contracts: 0,
      next_end_date: null,
      contract_refs: ["CTR-OLD-DATABRICKS-001"],
    };

    const contracts = vendorLinkedContracts(
      focusableContractRows(portfolio as never),
      selectedVendor,
    );

    expect(contracts.map((contract) => contract.contract_id)).toEqual([
      "MER-TECH-DBX-001",
      "CTR-OLD-DATABRICKS-001",
    ]);
  });

  it("resolves a selected evidence-only vendor into the vendor detail panel", () => {
    const portfolio = {
      tenantKey: "tenant-a",
      contracts: [],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "tenant-a",
            contract_id: "CONTRACT-EVIDENCE-001",
            vendor_ref: "VEN-EVIDENCE-ONLY",
            vendor_name: "Evidence Cloud Vendor, Inc.",
            vendor_category: "cloud_platform",
            contract_archetype: "cloud_services",
            contract_name: "Evidence-backed cloud services agreement",
            spend_rows: 13,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 0,
            unclaimed_credit_usd: 0,
            opportunity_rows: 7,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [],
        claimCards: [],
      },
    };

    const selectedVendor = resolveSelectedVendor(
      portfolio as never,
      [],
      "VEN-EVIDENCE-ONLY",
    );

    expect(selectedVendor).toMatchObject({
      vendor_ref: "VEN-EVIDENCE-ONLY",
      vendor_name: "Evidence Cloud Vendor, Inc.",
      contract_count: 1,
      contract_refs: ["CONTRACT-EVIDENCE-001"],
      vendor_refs: ["VEN-EVIDENCE-ONLY"],
    });
  });

  it("keeps portfolio summary and concentration on the governed register rows", () => {
    const portfolio = {
      tenantKey: "meridian-health",
      asOfDateIso: "2027-06-30",
      contracts: [
        {
          tenant_key: "meridian-health",
          contract_id: "CTR-REGISTER-001",
          vendor_ref: "vendor-register",
          vendor_name: "Register Vendor",
          vendor_category: "platform",
          contract_name: "Register agreement",
          annual_value: 10_000_000,
          actual_annual_spend: null,
          total_committed_value: null,
          committed_annual_spend: null,
          auto_renew: false,
        },
      ],
      vendors: [],
      impact: {
        evidenceCoverage: [
          {
            tenant_key: "meridian-health",
            contract_id: "MER-TECH-DBX-001",
            vendor_ref: "MER-VEN-DATABRICKS",
            vendor_name: "Databricks, Inc.",
            vendor_category: "cloud_data_platform",
            contract_archetype: "cloud_consumption",
            contract_name: "Databricks Enterprise Agreement",
            spend_rows: 12,
            actual_spend_usd: 66_000,
            committed_spend_usd: 1_900_000,
            performance_rows: 12,
            unclaimed_credit_usd: 0,
            opportunity_rows: 6,
            scope_rows: 4,
            critical_scope_rows: 2,
            document_page_text_rows: 6,
            coverage_state: "decision_ready",
          },
        ],
        actionCandidates: [],
        claimCards: [],
      },
      categoryQuality: { semanticRows: [] },
      applicationScope: [],
      initiativeDependencies: [],
    };
    const vm = new WorkspaceViewModel(
      INITIAL_STATE,
      () => undefined,
      portfolio as never,
      "Meridian Health",
      () => undefined,
    );

    expect(focusableContractRows(portfolio as never)).toHaveLength(2);
    expect(vm.contracts().map((contract) => contract.contract_id)).toEqual([
      "CTR-REGISTER-001",
    ]);
    expect(vm.summary()).toMatchObject({
      contractCount: 1,
      vendorCount: 1,
      totalAnnualValue: 10_000_000,
    });
    expect(
      vm.concentration().byVendor.map((vendor) => vendor.vendorRef),
    ).toEqual(["vendor-register"]);
  });

  it("keeps the contract graph tab as a real lineage visual with drill-down subtabs", () => {
    const source = readFileSync(
      `${__dirname}/../WorkspaceExecutiveShell.tsx`,
      "utf8",
    );
    const css = readFileSync(`${__dirname}/../workspace.css`, "utf8");

    expect(source).toContain(
      'const GRAPH_SUBTABS = ["Flow", "Volume", "Mapping spine"]',
    );
    expect(source).toContain('aria-label="Source contract graph flow"');
    expect(source).toContain('className="sw-v2-graph-links"');
    expect(source).toContain("GraphVolumeTable");
    expect(source).toContain("GraphSpineTable");
    expect(source).toContain("GraphVolumeBars");
    expect(source).toContain("GraphMappingFlow");
    expect(source).toContain('aria-label="Source graph row volume"');
    expect(source).toContain('aria-label="Source mapping flow"');
    expect(css).toContain(".sw-v2-graph");
    expect(css).toContain(".sw-v2-graph-node");
    expect(css).toContain(".sw-v2-graph-volume-visual");
    expect(css).toContain(".sw-v2-mapping-flow");
  });

  it("derives graph row volumes from loaded impact coverage before old snapshots", () => {
    const coverage = [
      {
        spend_rows: 24,
        performance_rows: 12,
        document_page_text_rows: 8,
        change_order_rows: 3,
      },
      {
        spend_rows: "180",
        performance_rows: "132",
        document_page_text_rows: "79",
        change_order_rows: "22",
      },
    ] as unknown as Parameters<typeof sourceImpactCoverageRowTotal>[0];

    expect(sourceImpactCoverageRowTotal(coverage, "spend_rows")).toBe(204);
    expect(sourceImpactCoverageRowTotal(coverage, "performance_rows")).toBe(
      144,
    );
    expect(
      sourceImpactCoverageRowTotal(coverage, "document_page_text_rows"),
    ).toBe(87);
    expect(sourceImpactCoverageRowTotal(coverage, "change_order_rows")).toBe(
      25,
    );
  });

  it("keeps the Evidence page visual before the row-detail tables", () => {
    const source = readFileSync(
      `${__dirname}/../WorkspaceExecutiveShell.tsx`,
      "utf8",
    );
    const css = readFileSync(`${__dirname}/../workspace.css`, "utf8");

    expect(source).toContain("EvidenceLaneBarChart");
    expect(source).toContain('aria-label="Evidence lane row counts"');
    expect(css).toContain(".sw-v2-visual-bars");
    expect(css).toContain(".sw-v2-visual-bar-row");
  });

  it("does not print raw vendor names in executive-facing labels", () => {
    const source = readFileSync(
      `${__dirname}/../WorkspaceExecutiveShell.tsx`,
      "utf8",
    );

    expect(source).not.toContain("<b>{vendor.vendor_name}</b>");
    expect(source).not.toContain("<span>{contract.vendor_name}</span>");
    expect(source).not.toContain("<small>{contract.vendor_name}</small>");
    expect(source).not.toContain("value={contract.vendor_name}");
    expect(source).not.toContain("title={selectedVendor?.vendor_name");
    expect(source).not.toContain("? selectedVendor.vendor_name");
    expect(source).not.toContain("return vendor?.vendor_name");
    expect(source).not.toContain("return contract?.vendor_name");
    expect(source).toContain("safeVendorDisplayName(vendor.vendor_name");
    expect(source).toContain("vendor.vendor_ref");
    expect(source).toContain("safeContractVendorDisplayName(contract)");
  });

  it("renders numeric performance actuals from governed rows without throwing", () => {
    expect(performanceActual(89, null)).toBe("89.0%");
    expect(performanceActual(null, 0.91)).toBe("91.0%");
    expect(performanceActual(null, 96)).toBe("96.0%");
    expect(performanceActual("89%", null)).toBe("89%");
  });

  it("collapses duplicate supplier display names before ranking concentration", () => {
    const vendors = topVendors({
      vendors: [
        {
          tenant_key: "meridian-health",
          vendor_ref: "vendor-platform",
          vendor_name: "Epic Systems Corporation",
          vendor_category: "EHR",
          contract_count: 1,
          annual_value: 86_200_000,
          total_committed_value: 86_200_000,
          auto_renew_contracts: 1,
          next_end_date: "2028-12-31",
          contract_refs: ["CTR-PLATFORM"],
        },
        {
          tenant_key: "meridian-health",
          vendor_ref: "vendor-modules",
          vendor_name: "Epic Systems Corp.",
          vendor_category: "EHR",
          contract_count: 14,
          annual_value: 50_900_000,
          total_committed_value: 50_900_000,
          auto_renew_contracts: 2,
          next_end_date: "2027-12-31",
          contract_refs: [
            "CTR-0005",
            "CTR-0006",
            "CTR-0007",
            "CTR-0008",
            "CTR-0009",
            "CTR-0005",
          ],
        },
        {
          tenant_key: "meridian-health",
          vendor_ref: "vendor-cloud",
          vendor_name: "Amazon Web Services",
          vendor_category: "Cloud",
          contract_count: 7,
          annual_value: 55_200_000,
          total_committed_value: 55_200_000,
          auto_renew_contracts: 0,
          next_end_date: "2029-12-31",
          contract_refs: ["CTR-AWS"],
        },
      ],
      contracts: [
        {
          contract_id: "CTR-PLATFORM",
          vendor_ref: "vendor-platform",
          vendor_name: "Epic Systems Corporation",
          annual_value: 86_200_000,
          resolved_annual_value: null,
          total_committed_value: 86_200_000,
          resolved_total_committed_value: null,
          end_date: "2028-12-31",
          auto_renew: true,
        },
        ...["CTR-0005", "CTR-0006", "CTR-0007", "CTR-0008", "CTR-0009"].map(
          (contract_id) => ({
            contract_id,
            vendor_ref: "vendor-modules",
            vendor_name: "Epic Systems Corp.",
            annual_value: 10_180_000,
            resolved_annual_value: null,
            total_committed_value: 10_180_000,
            resolved_total_committed_value: null,
            end_date: "2027-12-31",
            auto_renew: false,
          }),
        ),
        {
          contract_id: "CTR-AWS",
          vendor_ref: "vendor-cloud",
          vendor_name: "Amazon Web Services",
          annual_value: 55_200_000,
          resolved_annual_value: null,
          total_committed_value: 55_200_000,
          resolved_total_committed_value: null,
          end_date: "2029-12-31",
          auto_renew: false,
        },
      ],
    } as unknown as Parameters<typeof topVendors>[0]);

    expect(vendors).toHaveLength(2);
    expect(vendors[0]?.vendor_name).toBe("Epic Systems Corporation");
    expect(vendors[0]?.annual_value).toBe(137_100_000);
    expect(vendors[0]?.contract_count).toBe(6);
    expect(vendors[0]?.contract_refs).toEqual([
      "CTR-PLATFORM",
      "CTR-0005",
      "CTR-0006",
      "CTR-0007",
      "CTR-0008",
      "CTR-0009",
    ]);
    expect(vendors[1]?.vendor_name).toBe("Amazon Web Services");
  });

  it("does not render opaque vendor identifiers as supplier names", () => {
    const vendors = topVendors({
      vendors: [
        {
          tenant_key: "meridian-health",
          vendor_ref: "24fc65af-8223-4884-9241-ef5736960a1b",
          vendor_name: "24fc65af-8223-4884-9241-ef5736960a1b",
          vendor_category: null,
          contract_count: 1,
          annual_value: 86_000,
          total_committed_value: 86_000,
          auto_renew_contracts: 0,
          next_end_date: null,
          contract_refs: ["CTR-0002"],
        },
      ],
      contracts: [],
    } as unknown as Parameters<typeof topVendors>[0]);

    expect(vendors[0]?.vendor_name).toBe("Vendor name not resolved");
  });

  it("withholds unresolved supplier rows from evidence-focused vendor lists", () => {
    const portfolio = {
      vendors: [
        {
          tenant_key: "meridian-health",
          vendor_ref: "24fc65af-8223-4884-9241-ef5736960a1b",
          vendor_name: "24fc65af-8223-4884-9241-ef5736960a1b",
          vendor_category: null,
          contract_count: 1,
          annual_value: 86_000,
          total_committed_value: 86_000,
          auto_renew_contracts: 0,
          next_end_date: null,
          contract_refs: ["CTR-0002"],
        },
        {
          tenant_key: "meridian-health",
          vendor_ref: "vendor-salesforce",
          vendor_name: "Salesforce, Inc.",
          vendor_category: "crm_saas",
          contract_count: 1,
          annual_value: 9_200_000,
          total_committed_value: 9_200_000,
          auto_renew_contracts: 0,
          next_end_date: null,
          contract_refs: ["MER-TECH-SFDC-001"],
        },
      ],
      contracts: [],
      impact: {
        evidenceCoverage: [
          {
            contract_id: "CTR-0002",
            vendor_ref: "24fc65af-8223-4884-9241-ef5736960a1b",
            vendor_name: "24fc65af-8223-4884-9241-ef5736960a1b",
            spend_rows: 24,
            performance_rows: 24,
            opportunity_rows: 2,
            unclaimed_credit_usd: 86_000,
          },
          {
            contract_id: "MER-TECH-SFDC-001",
            vendor_ref: "vendor-salesforce",
            vendor_name: "Salesforce, Inc.",
            spend_rows: 12,
            performance_rows: 0,
            opportunity_rows: 1,
            unclaimed_credit_usd: 0,
          },
        ],
      },
    } as unknown as Parameters<typeof topVendors>[0];

    const vendors = topVendors(portfolio);
    const focus = focusedVendorSet(
      portfolio as Parameters<typeof focusedVendorSet>[0],
      vendors,
      "evidence",
      7,
    );

    expect(focus.rows.map(({ vendor }) => vendor.vendor_name)).toEqual([
      "Salesforce, Inc.",
    ]);
    expect(focus.unresolvedCount).toBe(1);
    expect(
      focus.rows.some(
        ({ vendor }) => vendor.vendor_name === "Vendor name not resolved",
      ),
    ).toBe(false);
  });

  it("does not render action narrative as a benchmarking clause", () => {
    expect(displayBenchmarkingClause("benchmarking clause present")).toBe(
      "benchmarking clause present",
    );
    expect(
      displayBenchmarkingClause(
        "(1) Right-size the 8% unused entitlements at renewal -- approximately $4.14M annually at current unit pricing.",
      ),
    ).toBe("Not established");
    expect(displayBenchmarkingClause(null)).toBe("Not established");
  });

  it("prefers deterministic impact-layer credits over broader snapshot credits", () => {
    const portfolio = {
      impact: {
        evidenceCoverage: [
          {
            load_run_id: "active-load",
            unclaimed_credit_usd: 102_666.65,
          },
          {
            load_run_id: "active-load",
            unclaimed_credit_usd: 0,
          },
        ],
      },
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "active-load",
      },
    };

    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBe(102_666.65);
  });

  it("keeps the credit headline scoped to the active deterministic load run", () => {
    const portfolio = {
      impact: {
        actionCandidates: [],
        evidenceCoverage: [
          {
            contract_id: "OLD-001",
            load_run_id: "older-load",
            unclaimed_credit_usd: 86_333.35,
          },
          {
            contract_id: "MER-TECH-AMS-001",
            load_run_id: "active-load",
            unclaimed_credit_usd: 37_466.66,
          },
          {
            contract_id: "MER-TECH-SD-001",
            load_run_id: "active-load",
            unclaimed_credit_usd: 50_866.66,
          },
          {
            contract_id: "CTR-0002",
            load_run_id: "active-load",
            unclaimed_credit_usd: 14_333.33,
          },
        ],
      },
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "active-load",
      },
    };

    expect(
      source360RecoverableCreditCoverageRows(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditCoverageRows
        >[0],
      ).map((row) => row.contract_id),
    ).toEqual(["MER-TECH-AMS-001", "MER-TECH-SD-001", "CTR-0002"]);
    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBeCloseTo(102_666.65, 2);
  });

  it("falls back to snapshot credits when no deterministic impact credit is loaded", () => {
    const portfolio = {
      impact: {
        actionCandidates: [],
        evidenceCoverage: [
          {
            load_run_id: "active-load",
            unclaimed_credit_usd: 0,
          },
        ],
      },
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 43_000.02,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "active-load",
      },
    };

    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBe(43_000.02);
  });

  it("does not blend historical credit coverage into the current action headline", () => {
    const portfolio = {
      impact: {
        actionCandidates: [
          {
            contract_id: "MER-TECH-SD-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
          },
        ],
        evidenceCoverage: [
          {
            contract_id: "OLD-001",
            load_run_id: "older-load",
            unclaimed_credit_usd: 86_333.35,
            opportunity_rows: 1,
          },
          {
            contract_id: "MER-TECH-SD-001",
            load_run_id: "current-package",
            unclaimed_credit_usd: 50_866.66,
            opportunity_rows: 1,
          },
        ],
      },
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: null,
      },
    };

    expect(
      source360RecoverableCreditCoverageRows(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditCoverageRows
        >[0],
      ).map((row) => row.contract_id),
    ).toEqual(["MER-TECH-SD-001"]);
    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBeCloseTo(50_866.66, 2);
  });

  it("uses the richest deterministic impact package when workspace diagnostics name a broad projection", () => {
    const portfolio = {
      contracts: [],
      vendors: [],
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "ecl-dense-source-room-projection",
      },
      impact: {
        actionCandidates: [
          {
            contract_id: "OLD-CTR-0002",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 72_000,
            finance_confirmation_state: "not_confirmed",
          },
          {
            contract_id: "MER-TECH-SFDC-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 15_166.67,
            finance_confirmation_state: "not_confirmed",
          },
          {
            contract_id: "MER-TECH-AMS-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 188_199.99,
            finance_confirmation_state: "not_confirmed",
          },
          {
            contract_id: "MER-TECH-SD-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 50_499.99,
            finance_confirmation_state: "not_confirmed",
          },
        ],
        evidenceCoverage: [
          {
            contract_id: "OLD-CTR-0002",
            load_run_id: "recorded-data-refresh-6a94e1cf-runtime-l3",
            unclaimed_credit_usd: 72_000,
            document_page_text_rows: 0,
            change_order_rows: 0,
            opportunity_rows: 2,
            scope_rows: 0,
            spend_rows: 24,
            performance_rows: 24,
          },
          {
            contract_id: "MER-TECH-SFDC-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 15_166.67,
            document_page_text_rows: 6,
            change_order_rows: 1,
            opportunity_rows: 1,
            scope_rows: 3,
            spend_rows: 12,
            performance_rows: 12,
          },
          {
            contract_id: "MER-TECH-AMS-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 36_999.99,
            document_page_text_rows: 6,
            change_order_rows: 2,
            opportunity_rows: 2,
            scope_rows: 4,
            spend_rows: 12,
            performance_rows: 12,
          },
          {
            contract_id: "MER-TECH-SD-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 50_499.99,
            document_page_text_rows: 6,
            change_order_rows: 2,
            opportunity_rows: 1,
            scope_rows: 4,
            spend_rows: 12,
            performance_rows: 12,
          },
        ],
      },
    };

    expect(
      source360RecoverableCreditCoverageRows(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditCoverageRows
        >[0],
      ).map((row) => row.contract_id),
    ).toEqual(["MER-TECH-SFDC-001", "MER-TECH-AMS-001", "MER-TECH-SD-001"]);
    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBeCloseTo(102_666.65, 2);

    const recoverableType = optimizeTypeRows(
      portfolio as unknown as Parameters<typeof optimizeTypeRows>[0],
    ).find((row) => row.type === "recoverable leakage");

    expect(recoverableType).toMatchObject({
      count: 3,
      amount: 102_666.65,
    });
  });

  it("keeps recoverable leakage type mix aligned to credit coverage when an action card is missing", () => {
    const portfolio = {
      contracts: [],
      vendors: [],
      v4Snapshot: {
        performanceCredits: {
          unclaimedCredit: 189_000,
        },
      },
      workspaceDiagnostics: {
        activeLoadRunId: "ecl-dense-source-room-projection",
      },
      impact: {
        actionCandidates: [
          {
            contract_id: "MER-TECH-AMS-001",
            action_type: "avoid_future_spend",
            opportunity_type: "change_order_control",
            title:
              "Convert recurring AMS change orders into base service catalog",
            finding_summary:
              "Recurring change orders should be moved into run catalog.",
            deterministic_basis: "change order rows",
            candidate_amount_usd: 151_000,
            finance_confirmation_state: "not_confirmed",
          },
          {
            contract_id: "MER-TECH-SD-001",
            action_type: "recoverable_leakage",
            opportunity_type: "service_credit",
            title: "Claim unclaimed SLA service credits",
            finding_summary: "Calculated credits exceed claimed credits.",
            deterministic_basis: "service credit rows",
            candidate_amount_usd: 50_499.99,
            finance_confirmation_state: "not_confirmed",
          },
        ],
        evidenceCoverage: [
          {
            contract_id: "MER-TECH-SFDC-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 15_166.67,
            document_page_text_rows: 6,
            change_order_rows: 1,
            opportunity_rows: 1,
            scope_rows: 3,
            spend_rows: 12,
            performance_rows: 12,
          },
          {
            contract_id: "MER-TECH-AMS-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 36_999.99,
            document_page_text_rows: 6,
            change_order_rows: 2,
            opportunity_rows: 2,
            scope_rows: 4,
            spend_rows: 12,
            performance_rows: 12,
          },
          {
            contract_id: "MER-TECH-SD-001",
            load_run_id: "source-contract-depth-doc-gap-20260831T0645Z",
            unclaimed_credit_usd: 50_499.99,
            document_page_text_rows: 6,
            change_order_rows: 2,
            opportunity_rows: 1,
            scope_rows: 4,
            spend_rows: 12,
            performance_rows: 12,
          },
        ],
      },
    };

    const rows = optimizeTypeRows(
      portfolio as unknown as Parameters<typeof optimizeTypeRows>[0],
    );

    expect(
      rows.find((row) => row.type === "recoverable leakage"),
    ).toMatchObject({
      count: 3,
      amount: 102_666.65,
    });
    expect(
      rows.find((row) => row.type === "change order control"),
    ).toMatchObject({
      count: 1,
      amount: 151_000,
    });
  });

  it("aggregates vendor evidence depth rows for charting without inventing coverage", () => {
    const portfolio = {
      contracts: [
        {
          contract_id: "MER-TECH-AMS-001",
          vendor_ref: "vendor-cognizant",
          vendor_name: "Cognizant Technology Solutions",
        },
        {
          contract_id: "MER-TECH-SD-001",
          vendor_ref: "vendor-kyndryl",
          vendor_name: "Kyndryl, Inc.",
        },
      ],
      impact: {
        evidenceCoverage: [
          {
            contract_id: "MER-TECH-AMS-001",
            vendor_ref: "vendor-cognizant",
            spend_rows: 12,
            performance_rows: 12,
            opportunity_rows: 2,
            unclaimed_credit_usd: 36_999.99,
          },
          {
            contract_id: "MER-TECH-SD-001",
            vendor_ref: null,
            spend_rows: 12,
            performance_rows: 12,
            opportunity_rows: 1,
            unclaimed_credit_usd: 50_499.99,
          },
        ],
      },
    };

    const rows = vendorCoverageRows(
      portfolio as unknown as Parameters<typeof vendorCoverageRows>[0],
    );

    expect(rows.get("vendor-cognizant")).toMatchObject({
      spendRows: 12,
      performanceRows: 12,
      actionRows: 2,
      unclaimedCredit: 36_999.99,
    });
    expect(rows.get("vendor-kyndryl")).toMatchObject({
      spendRows: 12,
      performanceRows: 12,
      actionRows: 1,
      unclaimedCredit: 50_499.99,
    });
  });

  it("rolls vendor archetype charts from declared contract categories", () => {
    const rows = vendorArchetypeRows({
      contracts: [
        {
          contract_id: "MER-TECH-M365-001",
          vendor_ref: "vendor-msft",
          vendor_name: "Microsoft Corporation",
          vendor_category: "SaaS",
          annual_value: 14_800_000,
        },
        {
          contract_id: "MER-TECH-SFDC-001",
          vendor_ref: "vendor-sfdc",
          vendor_name: "Salesforce, Inc.",
          vendor_category: "SaaS",
          annual_value: 9_200_000,
        },
        {
          contract_id: "MER-TECH-AWS-001",
          vendor_ref: "vendor-aws",
          vendor_name: "Amazon Web Services, Inc.",
          vendor_category: "Cloud",
          annual_value: 11_800_000,
        },
      ],
    } as unknown as Parameters<typeof vendorArchetypeRows>[0]);

    expect(rows[0]).toMatchObject({
      category: "SaaS",
      vendorCount: 2,
      contractCount: 2,
      annualValue: 24_000_000,
      vendorRef: "vendor-msft",
      vendorName: "Microsoft Corporation",
    });
    expect(rows[1]).toMatchObject({
      category: "Cloud",
      vendorCount: 1,
      contractCount: 1,
      annualValue: 11_800_000,
      vendorRef: "vendor-aws",
      vendorName: "Amazon Web Services, Inc.",
    });
  });

  it("excludes unmapped contract categories from archetype chart rows", () => {
    const portfolio = {
      contracts: [
        {
          contract_id: "CTR-0001",
          vendor_ref: "vendor-register",
          vendor_name: "Register Vendor",
          vendor_category: "Not established",
          annual_value: 549_000_000,
        },
        {
          contract_id: "MER-TECH-M365-001",
          vendor_ref: "vendor-msft",
          vendor_name: "Microsoft Corporation",
          vendor_category: "productivity_platform",
          annual_value: 14_800_000,
        },
      ],
    } as unknown as Parameters<typeof vendorArchetypeRows>[0];

    expect(vendorArchetypeRows(portfolio)).toEqual([
      {
        category: "productivity_platform",
        vendorCount: 1,
        contractCount: 1,
        annualValue: 14_800_000,
        vendorRef: "vendor-msft",
        vendorName: "Microsoft Corporation",
      },
    ]);
    expect(vendorArchetypeCoverage(portfolio)).toEqual({
      totalContracts: 2,
      declaredContracts: 1,
      unmappedCount: 1,
      supplementalDeclaredCount: 0,
    });
  });

  it("uses declared archetypes from supplemental impact coverage without charting the unmapped register", () => {
    const portfolio = {
      contracts: [
        {
          contract_id: "CTR-0001",
          vendor_ref: "vendor-register",
          vendor_name: "Register Vendor",
          vendor_category: "Not established",
          annual_value: 549_000_000,
        },
      ],
      impact: {
        evidenceCoverage: [
          {
            contract_id: "MER-TECH-M365-001",
            vendor_ref: "vendor-msft",
            vendor_name: "Microsoft Corporation",
            vendor_category: "productivity_platform",
            committed_spend_usd: 14_800_000,
          },
          {
            contract_id: "MER-TECH-SFDC-001",
            vendor_ref: "vendor-sfdc",
            vendor_name: "Salesforce, Inc.",
            contract_archetype: "crm_saas",
            actual_spend_usd: 9_200_000,
          },
        ],
      },
    } as unknown as Parameters<typeof vendorArchetypeRows>[0];

    expect(vendorArchetypeRows(portfolio)).toEqual([
      {
        category: "productivity_platform",
        vendorCount: 1,
        contractCount: 1,
        annualValue: 14_800_000,
        vendorRef: "vendor-msft",
        vendorName: "Microsoft Corporation",
      },
      {
        category: "crm_saas",
        vendorCount: 1,
        contractCount: 1,
        annualValue: 9_200_000,
        vendorRef: "vendor-sfdc",
        vendorName: "Salesforce, Inc.",
      },
    ]);
    expect(vendorArchetypeCoverage(portfolio)).toEqual({
      totalContracts: 3,
      declaredContracts: 2,
      unmappedCount: 1,
      supplementalDeclaredCount: 2,
    });
  });
});
