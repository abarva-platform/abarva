import { azureRead } from "@/lib/data-plane/azureRead";
import { getContractOptimizationOpportunitySet } from "@/lib/source/data-model/read-adapter";
import type { SourceContract360Row } from "@/lib/source/data-model/types";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    withSession: jest.fn(),
  },
}));

const withSessionMock = azureRead.withSession as jest.MockedFunction<
  typeof azureRead.withSession
>;

function contract(
  overrides: Partial<SourceContract360Row> = {},
): SourceContract360Row {
  return {
    tenant_key: "skyharbor_global",
    contract_id: "CTR-090",
    vendor_ref: "salesforce",
    vendor_name: "Salesforce",
    vendor_category: "SaaS",
    contract_name: "Salesforce Data Platform Agreement 3",
    scope_summary: null,
    annual_value: 43_500_000,
    total_committed_value: 173_900_000,
    committed_annual_spend: 43_500_000,
    actual_annual_spend: 37_400_000,
    end_date: "2031-06-28",
    notice_period_days: 120,
    auto_renew: false,
    renewal_decision_state: null,
    renewal_owner_ref: "LDR-032",
    benchmarking_clause: "Limited",
    exit_rights_summary: "Limited exit rights",
    alternatives_available: "Market scan needed",
    concentration_note: null,
    source_confidence: 0.86,
    resolved_annual_value: null,
    annual_value_conflict_flag: false,
    resolved_total_committed_value: null,
    total_committed_value_conflict_flag: false,
    scoped_application_count: null,
    critical_application_count: null,
    linked_budget_amount: null,
    linked_actual_amount: null,
    linked_budget_lines: null,
    cloud_sev1_sev2_incidents: null,
    operational_evidence_gap: null,
    initiative_dependency_count: null,
    ...overrides,
  };
}

describe("getContractOptimizationOpportunitySet", () => {
  beforeEach(() => {
    withSessionMock.mockReset();
  });

  it("does not include evidence requirements from another contract in the same dataset", async () => {
    const baselineSql: string[] = [];
    withSessionMock.mockImplementation(async (callback) => {
      const run = async <R>(sql: string): Promise<R[]> => {
        let rows: unknown[] = [];
        if (sql.includes("set_config")) return [];
        if (
          sql.includes("FROM source.optimization_opportunity") &&
          sql.includes("GROUP BY dataset_version")
        ) {
          rows = [{ dataset_version: "source-v1-1-canary" }];
        } else if (
          sql.includes("FROM source.optimization_opportunity") &&
          sql.includes("ORDER BY amount_usd")
        ) {
          rows = [
            {
              tenant_key: "skyharbor_global",
              dataset_version: "source-v1-1-canary",
              opportunity_id: "CTR-090:rate-variance",
              contract_id: "CTR-090",
              vendor_id: "salesforce",
              value_type: "recoverable_leakage",
              stage: "quantified",
              amount_usd: 365_000,
              amount_state: "exact",
              evidence_grade: "system_evidenced",
              confidence: 0.86,
              next_action:
                "Review included invoice lines and complete the amendment search.",
              overlap_treatment: "Distinct from off-contract billing.",
              approval_state: "requires_amendment_exception_review",
              narrative:
                "Rate variance rows are visible for this selected contract.",
              payload: {
                label: "Rate variance",
                source_systems: [
                  "AP / ERP invoice line extract",
                  "CLM pricing schedule",
                ],
              },
            },
          ];
        } else if (sql.includes("FROM source.optimization_baseline")) {
          baselineSql.push(sql);
          rows = [
            {
              tenant_key: "skyharbor_global",
              dataset_version: "source-v1-1-canary",
              contract_id: "CTR-090",
              baseline_state: "ready",
              detail:
                "The pricing schedule ties to the selected contract baseline.",
              annual_value_usd: 43_500_000,
              pricing_schedule_annual_value_usd: 43_500_000,
              actual_annual_spend_usd: 37_400_000,
              total_committed_value_usd: 173_900_000,
              conflict_amount_usd: 0,
              source_refs: [],
              payload: { headline: "Commercial baseline reconciles." },
            },
          ];
        } else if (sql.includes("FROM source.opportunity_requirement_status")) {
          rows = [
            {
              opportunity_id: "CTR-090:rate-variance",
              requirement_id: "REQ-CTR090-RATE",
              status: "missing",
              status_detail:
                "Review included invoice lines and complete the amendment search.",
            },
            {
              opportunity_id: "CTR-061:baseline-conflict",
              requirement_id: "REQ-CTR061-BASELINE",
              status: "conflicted",
              status_detail:
                "Pricing schedule totals $45.8M while the stated annual value is $35.8M.",
            },
          ];
        }
        return rows as R[];
      };
      return callback(run);
    });

    const set = await getContractOptimizationOpportunitySet(
      "skyharbor_global",
      "CTR-090",
      contract(),
    );

    expect(set?.contractId).toBe("CTR-090");
    expect(set?.baseline.status).toBe("ready");
    expect(set?.evidenceRequirements).toEqual([
      "Review included invoice lines and complete the amendment search.",
    ]);
    expect(baselineSql).toHaveLength(1);
    expect(baselineSql[0]).not.toContain("created_at");
    expect(JSON.stringify(set)).not.toContain("CTR-061");
    expect(JSON.stringify(set)).not.toContain("stated annual value is $35.8M");
  });

  it("uses selected Contract 360 values when the persisted baseline row is missing", async () => {
    withSessionMock.mockImplementation(async (callback) => {
      const run = async <R>(sql: string): Promise<R[]> => {
        let rows: unknown[] = [];
        if (sql.includes("set_config")) return [];
        if (
          sql.includes("FROM source.optimization_opportunity") &&
          sql.includes("GROUP BY dataset_version")
        ) {
          rows = [{ dataset_version: "source-v1-1-canary" }];
        } else if (
          sql.includes("FROM source.optimization_opportunity") &&
          sql.includes("ORDER BY amount_usd")
        ) {
          rows = [
            {
              tenant_key: "skyharbor_global",
              dataset_version: "source-v1-1-canary",
              opportunity_id: "CTR-090:rate-variance",
              contract_id: "CTR-090",
              vendor_id: "salesforce",
              value_type: "recoverable_leakage",
              stage: "quantified",
              amount_usd: 365_000,
              amount_state: "exact",
              evidence_grade: "system_evidenced",
              confidence: 0.86,
              next_action:
                "Review included invoice lines and complete the amendment search.",
              overlap_treatment: "Distinct from off-contract billing.",
              approval_state: "requires_amendment_exception_review",
              narrative:
                "Rate variance rows are visible for this selected contract.",
              payload: { label: "Rate variance" },
            },
          ];
        } else if (sql.includes("FROM source.optimization_baseline")) {
          rows = [];
        }
        return rows as R[];
      };
      return callback(run);
    });

    const set = await getContractOptimizationOpportunitySet(
      "skyharbor_global",
      "CTR-090",
      contract(),
    );

    expect(set?.baseline.status).toBe("missing");
    expect(set?.baseline.headline).toBe(
      "Commercial baseline needs pricing schedule tie-out.",
    );
    expect(set?.baseline.detail).toContain(
      "Contract register values are loaded from Contract 360",
    );
    expect(set?.baseline.annualValueUsd).toBe(43_500_000);
    expect(set?.baseline.actualAnnualSpendUsd).toBe(37_400_000);
    expect(set?.baseline.totalCommittedValueUsd).toBe(173_900_000);
    expect(set?.baseline.pricingScheduleAnnualValueUsd).toBeNull();
  });
});
