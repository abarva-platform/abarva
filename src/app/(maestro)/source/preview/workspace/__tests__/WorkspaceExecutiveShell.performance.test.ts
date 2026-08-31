import {
  displayBenchmarkingClause,
  optimizeTypeRows,
  performanceActual,
  source360RecoverableCreditCoverageRows,
  source360RecoverableCreditFinding,
  topVendors,
} from "../WorkspaceExecutiveShell";

describe("WorkspaceExecutiveShell performance formatting", () => {
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
    ).toEqual([
      "MER-TECH-SFDC-001",
      "MER-TECH-AMS-001",
      "MER-TECH-SD-001",
    ]);
    expect(
      source360RecoverableCreditFinding(
        portfolio as unknown as Parameters<
          typeof source360RecoverableCreditFinding
        >[0],
      ),
    ).toBeCloseTo(102_666.65, 2);

    const recoverableType = optimizeTypeRows(
      portfolio as unknown as Parameters<typeof optimizeTypeRows>[0],
    ).find((row) => row.type === "service credit");

    expect(recoverableType).toMatchObject({
      count: 3,
      amount: 102_666.65,
    });
  });
});
