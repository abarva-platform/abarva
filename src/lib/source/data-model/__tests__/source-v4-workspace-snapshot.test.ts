import { azureRead } from "@/lib/data-plane/azureRead";
import { loadSourceV4WorkspaceSnapshot } from "../source-v4-workspace-snapshot";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: jest.fn() },
}));

const mockedWithSession = azureRead.withSession as jest.Mock;
const run = jest.fn();

describe("loadSourceV4WorkspaceSnapshot", () => {
  beforeEach(() => {
    run.mockReset();
    mockedWithSession.mockReset();
    mockedWithSession.mockImplementation(async (fn) => fn(run));
    run.mockImplementation(async (sql: string) => {
      if (sql.startsWith("SELECT set_config")) return [];
      if (sql.includes("MAX(load_run_id)")) {
        return [{ active_load_run_id: "source-v4-load-20260803" }];
      }
      if (
        sql.includes("consumption.sourcing_context_coverage_v1") &&
        sql.includes("context_area")
      ) {
        return [
          {
            context_area: "contracts",
            row_count: "100",
            populated_count: "100",
          },
          {
            context_area: "contract_scope",
            row_count: "15840",
            populated_count: "15840",
          },
          {
            context_area: "monthly_spend_consumption",
            row_count: "7200",
            populated_count: "7200",
          },
          {
            context_area: "performance_sla",
            row_count: "21600",
            populated_count: "21600",
          },
          {
            context_area: "opportunities",
            row_count: "3600",
            populated_count: "3600",
          },
        ];
      }
      if (sql.includes("sourcing_context_coverage_v1")) {
        return [
          {
            vendors: "60",
            contracts: "100",
            annual_value: "1480500000.00",
            scope_rows: "15840",
            invoice_lines: "72000",
            saas_usage_rows: "24480",
            cloud_rows: "36000",
            performance_rows: "21600",
          },
        ];
      }
      if (sql.includes("COUNT(*) AS vendor_count")) {
        return [{ vendor_count: "60" }];
      }
      if (sql.includes("sourcing_contract_v1")) {
        return [
          {
            contract_count: "100",
            annual_value: "1480500000.00",
            total_committed_value: "5151000000.00",
            auto_renew_count: "12",
            notice_90_day_count: "74",
          },
        ];
      }
      if (sql.includes("sourcing_vendor_v1")) {
        return [
          {
            vendor_id: "vend-001",
            legal_name: "Northstar Cloud Services",
            supplier_category: "Cloud",
            strategic_status: "strategic",
            risk_tier: "tier_1",
            annual_value: "210000000.00",
            contract_count: "5",
          },
        ];
      }
      if (sql.includes("sourcing_spend_monthly_v1")) {
        return [
          {
            row_count: "7200",
            invoice_lines: "72000",
            actual_spend: "1450000000.00",
            committed_amount: "1480500000.00",
            off_contract_spend: "42000000.00",
          },
        ];
      }
      if (sql.includes("sourcing_performance_v1")) {
        return [
          {
            row_count: "21600",
            breach_count: "850",
            credit_calculated: "925000.00",
            credit_claimed: "580000.00",
            credit_recovered: "510000.00",
            unclaimed_credit: "345000.00",
          },
        ];
      }
      if (
        sql.includes("entra_saas_usage_monthly") &&
        sql.includes("GROUP BY")
      ) {
        return [{ name: "Claude Code", count: "960", amount: "8700000.00" }];
      }
      if (sql.includes("entra_saas_usage_monthly")) {
        return [
          {
            row_count: "24480",
            assigned_seats: "705878",
            active_users: "481200",
            actual_cost: "170200000.00",
            claimable_rows: "0",
          },
        ];
      }
      if (sql.includes("azure_cost_monthly") && sql.includes("GROUP BY")) {
        return [{ name: "Compute", count: "1440", amount: "232000000.00" }];
      }
      if (sql.includes("azure_cost_monthly")) {
        return [
          {
            row_count: "36000",
            actual_cost: "680000000.00",
            amortized_cost: "660000000.00",
            overage_amount: "31000000.00",
          },
        ];
      }
      if (sql.includes("fieldglass_rate_card")) {
        return [
          {
            row_count: "9600",
            hours: "1440000",
            average_bill_rate: "118.50",
            unapproved_variance_count: "42",
          },
        ];
      }
      if (sql.includes("ariba_sourcing_events")) {
        return [
          {
            row_count: "3600",
            normalized_cost: "1120000000.00",
            line_item_cost: "1170000000.00",
            average_weighted_score: "83.25",
          },
        ];
      }
      if (sql.includes("sourcing_contract_scope_v1")) {
        return [
          {
            row_count: "15840",
            explicit_scope_count: "6400",
            inferred_scope_count: "9440",
          },
        ];
      }
      return [];
    });
  });

  it("builds a compact Source v4 snapshot from aggregate queries", async () => {
    const snapshot = await loadSourceV4WorkspaceSnapshot(
      "skyharbor-air",
      "2027-06-30T00:00:00Z",
    );

    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["skyharbor_global"],
    ]);
    const firstDataQuery = run.mock.calls.find((call) =>
      String(call[0]).includes("sourcing_context_coverage_v1"),
    );
    expect(firstDataQuery?.[1][0]).toEqual(["skyharbor_global", "skyharbor-air"]);
    expect(snapshot.datasetId).toBe("skyharbor-source-v4-202608");
    expect(snapshot.datasetVersion).toBe("v4");
    expect(snapshot.datasetLabel).toBe("SkyHarbor Source v4");
    expect(snapshot.analyticsProvider).toBe("CubeSourceProvider");
    expect(snapshot.activeLoadRunId).toBe("source-v4-load-20260803");
    expect(snapshot.contextCoverage.vendors).toBe(60);
    expect(snapshot.contextCoverage.contracts).toBe(100);
    expect(snapshot.executivePortfolio.annualValue).toBe(1480500000);
    expect(snapshot.scopeConfidence.rowCount).toBe(15840);
    expect(snapshot.scopeConfidence.explicitScopeCount).toBe(6400);
    expect(snapshot.scopeConfidence.inferredScopeCount).toBe(9440);
    expect(snapshot.performanceCredits.unclaimedCredit).toBe(345000);
    expect(snapshot.aiUsageValueProof.rowCount).toBe(0);
    expect(snapshot.topVendors[0]?.legalName).toBe("Northstar Cloud Services");
    expect(snapshot.availability).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lensId: "executive_portfolio",
          state: "available",
        }),
        expect.objectContaining({
          lensId: "ai_usage_value_proof",
          state: "missing",
        }),
        expect.objectContaining({
          lensId: "cloud_optimization",
          state: "missing",
        }),
      ]),
    );
  });

  it("marks a missing table family as an error without failing the whole workspace", async () => {
    run.mockImplementation(async (sql: string) => {
      if (sql.startsWith("SELECT set_config")) return [];
      if (sql.includes("entra_saas_usage_monthly")) {
        throw new Error("relation does not exist");
      }
      return [{ row_count: "1", count: "1", contracts: "1" }];
    });

    const snapshot = await loadSourceV4WorkspaceSnapshot("skyharbor_global");
    const aiSlice = snapshot.availability.find(
      (slice) => slice.lensId === "ai_usage_value_proof",
    );

    expect(aiSlice?.state).toBe("error");
    expect(snapshot.aiUsageValueProof.rowCount).toBe(0);
  });
});
