import { azureRead } from "@/lib/data-plane/azureRead";
import {
  getContract360,
  getContractEvidenceOverview,
  getContractEvidencePerformanceSummary,
  getContractOptimizationEvidencePack,
  listContract360,
  listContractEvidencePricing,
  listContractEvidenceScope,
  listContractPerformancePeriods,
  listContractSpendMonthly,
  listContractFinancialExposure,
  listContractOperationalPerformance,
  listContractVendor360,
  listSourceAvaGroundingBundles,
  listSourceContractClaimCards,
} from "../read-adapter";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: jest.fn(), withSession: jest.fn() },
}));

const mockedQuery = azureRead.query as jest.Mock;
const mockedWithSession = azureRead.withSession as jest.Mock;
const run = jest.fn();

describe("listContractVendor360 tenant-key resolution", () => {
  beforeEach(() => {
    mockedQuery.mockReset();
    run.mockReset();
    mockedWithSession.mockReset();
    mockedWithSession.mockImplementation(async (fn) => fn(run));
    mockedQuery.mockResolvedValue([]);
    run.mockResolvedValue([]);
  });

  it("reads refreshed SkyHarbor Source rows by canonical tenant key before alias fallback", async () => {
    await listContractVendor360("skyharbor-air");
    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["skyharbor-air"],
    ]);
    const [, params] = run.mock.calls[1];
    expect(params[0]).toEqual(["skyharbor-air"]);
    const [, fallbackParams] = run.mock.calls[3];
    expect(fallbackParams[0]).toEqual(
      expect.arrayContaining([
        "skyharbor",
        "skyharbor-air",
        "skyharbor_global",
      ]),
    );
  });

  it("resolves the audit-verified SkyHarbor spelling to canonical before alias fallback", async () => {
    await listContractVendor360("skyharbor_global");
    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["skyharbor-air"],
    ]);
    const [, params] = run.mock.calls[1];
    expect(params[0]).toEqual(["skyharbor-air"]);
    const [, fallbackParams] = run.mock.calls[3];
    expect(fallbackParams[0]).toEqual(
      expect.arrayContaining([
        "skyharbor",
        "skyharbor-air",
        "skyharbor_global",
      ]),
    );
  });

  it("resolves a different tenant through canonical Source first, then its shared alias service", async () => {
    await listContractVendor360("meridian");
    expect(run.mock.calls[0][0]).toBe(
      "SELECT set_config('app.tenant_key', $1, false)",
    );
    expect(run.mock.calls[0][1]).toEqual(["meridian-health"]);
    const [, params] = run.mock.calls[1];
    expect(params[0]).toEqual(["meridian-health"]);
    const [, fallbackParams] = run.mock.calls[3];
    expect(fallbackParams[0]).toEqual(
      expect.arrayContaining([
        "meridian",
        "meridian-health",
        "healthcare demo",
      ]),
    );
    expect(fallbackParams[0]).not.toContain("skyharbor_global");
  });

  it("resolves another known tenant through canonical Source first without defaulting to SkyHarbor", async () => {
    await listContractVendor360("apex-retail");
    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["apex-retail"],
    ]);
    const [, params] = run.mock.calls[1];
    expect(params[0]).toEqual(["apex-retail"]);
    const [, fallbackParams] = run.mock.calls[3];
    expect(fallbackParams[0]).toEqual(
      expect.arrayContaining(["apexretail", "apex-retail", "retail demo"]),
    );
    expect(fallbackParams[0]).not.toContain("skyharbor_global");
  });

  it("reads Meridian contract detail through the same canary projection as the portfolio", async () => {
    mockedQuery.mockImplementation(async (sql: string, params: unknown[]) => {
      expect(params[0]).toBe("meridian_health_global");
      if (sql.includes("source.meridian_vendor360_contract")) return [];
      expect(sql).toContain("meridian_health_contract_family_v1");
      expect(sql).not.toContain("source.contract_360");
      return [
        {
          tenant_key: "meridian_health_global",
          contract_id: "CF-001",
          vendor_ref: "VEND-001",
          vendor_name: "Crestline Analytics Services LLC",
          vendor_category: "managed_services",
          contract_name: "Data and Analytics Managed Services",
          annual_value: "84900000",
          total_committed_value: "35000000",
          actual_annual_spend: "84900000",
          auto_renew: false,
          annual_value_conflict_flag: false,
          total_committed_value_conflict_flag: false,
          scoped_application_count: "4",
          critical_application_count: "2",
          operational_evidence_gap: false,
          initiative_dependency_count: "0",
        },
      ];
    });

    const row = await getContract360("meridian-health", "CF-001");

    expect(row?.contract_id).toBe("CF-001");
    expect(row?.vendor_name).toBe("Crestline Analytics Services LLC");
    expect(run.mock.calls[1]).toEqual([
      expect.stringContaining("source.contract_360"),
      [["meridian-health"], "CF-001"],
    ]);
    expect(mockedQuery.mock.calls[0][0]).toContain(
      "source.meridian_vendor360_contract",
    );
  });

  it("prefers the loaded Meridian five-contract Vendor 360 candidate before the older canary", async () => {
    mockedQuery.mockImplementation(async (sql: string, params: unknown[]) => {
      expect(params[0]).toBe("meridian_health_global");
      if (sql.includes("source.meridian_vendor360_contract")) {
        return [
          {
            tenant_key: "meridian_health_global",
            contract_id: "MER-CTR-RCM-001",
            vendor_ref: "MER-VEN-RCM-NORTHBRIDGE",
            vendor_name: "NorthBridge RCM Services LLC",
            vendor_category: "Revenue cycle managed services",
            contract_name: "Revenue Cycle Managed Services",
            annual_value: "18600000",
            total_committed_value: "55800000",
            actual_annual_spend: "3128675",
            auto_renew: false,
            annual_value_conflict_flag: false,
            total_committed_value_conflict_flag: false,
            scoped_application_count: "4",
            critical_application_count: "1",
            operational_evidence_gap: "false",
            initiative_dependency_count: "5",
          },
        ];
      }
      throw new Error(`Unexpected query after candidate hit: ${sql}`);
    });

    const row = await getContract360("meridian-health", "MER-CTR-RCM-001");

    expect(row?.contract_id).toBe("MER-CTR-RCM-001");
    expect(row?.vendor_name).toBe("NorthBridge RCM Services LLC");
    expect(mockedQuery).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[1]).toEqual([
      expect.stringContaining("source.contract_360"),
      [["meridian-health"], "MER-CTR-RCM-001"],
    ]);
  });

  it("keeps Meridian golden evidence contracts discoverable when base Contract 360 rows already exist", async () => {
    run.mockImplementation(async (sql: string) => {
      if (sql.startsWith("SELECT set_config")) return [];
      if (
        sql.includes("source.contract_360") &&
        sql.includes("AND contract_id = $2")
      ) {
        return [];
      }
      if (sql.includes("source.contract_360")) {
        return [
          {
            tenant_key: "meridian-health",
            contract_id: "CTR-9C1F237BBC",
            vendor_ref: "VND-EPIC",
            vendor_name: "Epic Systems Corporation",
            vendor_category: "EHR",
            contract_name: "Epic Systems Corporation Rate Card Agreement",
            annual_value: "86200000",
            total_committed_value: "258600000",
            actual_annual_spend: "86200000",
            auto_renew: false,
            annual_value_conflict_flag: false,
            total_committed_value_conflict_flag: false,
            scoped_application_count: "12",
            critical_application_count: "8",
            operational_evidence_gap: false,
            initiative_dependency_count: "0",
          },
        ];
      }
      if (sql.includes("source.golden_contract_overview")) {
        return [
          {
            tenant_key: "meridian_health_global",
            contract_id: "CF-001",
            vendor_ref: "VND-001",
            vendor_name: "Crestline Analytics Services LLC",
            vendor_category: "data analytics managed services",
            contract_name: "Data and Analytics Managed Services",
            scope_summary:
              "Crestline operates Meridian's enterprise analytics managed-services tower.",
            annual_value: "35000000",
            total_committed_value: "140000000",
            committed_annual_spend: "35000000",
            actual_annual_spend: "31820000",
            end_date: "2028-07-31",
            notice_period_days: "92",
            auto_renew: false,
            renewal_owner_ref: "LDR-MER-SOURCE-011",
            source_confidence: "0.86",
            resolved_annual_value: "35000000",
            resolved_total_committed_value: "140000000",
            annual_value_conflict_flag: false,
            total_committed_value_conflict_flag: false,
            scoped_application_count: "9",
            critical_application_count: "4",
            linked_budget_amount: "35000000",
            linked_actual_amount: "31820000",
            linked_budget_lines: null,
            cloud_sev1_sev2_incidents: "120",
            operational_evidence_gap: false,
            initiative_dependency_count: "0",
          },
        ];
      }
      return [];
    });

    const rows = await listContract360("meridian");
    const contract = await getContract360("meridian", "CF-001");

    expect(rows.map((row) => row.contract_id)).toEqual([
      "CTR-9C1F237BBC",
      "CF-001",
    ]);
    expect(contract?.contract_id).toBe("CF-001");
    expect(contract?.vendor_name).toBe("Crestline Analytics Services LLC");
  });

  it("reads canonical Source impact and contract-depth rows with the canonical RLS key before global alias fallback", async () => {
    run.mockImplementation(async (sql: string) => {
      if (sql.startsWith("SELECT set_config")) return [];
      if (sql.includes("source.contract_claim_card_v1")) {
        return [
          {
            tenant_key: "meridian-health",
            claim_card_id: "CLAIM-M365-SHELFWARE-001",
            action_candidate_id: "OPT-M365-SHELFWARE-001",
            opportunity_id: "OPT-M365-SHELFWARE-001",
            contract_id: "MER-TECH-M365-001",
            vendor_ref: "vendor-microsoft",
            vendor_name: "Microsoft Corporation",
            claim_title: "Unused license reduction candidate",
            allowed_executive_statement:
              "Candidate action is backed by Source evidence; do not call it realized value.",
            blocker_if_missing:
              "Never present this candidate as realized savings until finance confirms it.",
            candidate_amount_usd: "1960000",
            finance_confirmation_state: "not_confirmed",
            readiness_state: "finance_confirmation_required",
            evidence_state: "present",
            citation_basis_json: { rows: ["USAGE-001"] },
            load_run_id: "source-contract-depth-package-test",
          },
        ];
      }
      if (sql.includes("source.ava_grounding_bundle_v1")) {
        return [
          {
            tenant_key: "meridian-health",
            grounding_bundle_id: "action:OPT-M365-SHELFWARE-001",
            page_key: "contract_action",
            section_key: "OPT-M365-SHELFWARE-001",
            question_family: "contract_action_grounding",
            allowed_claims_json: [{ claim: "candidate action only" }],
            refusal_rules_json: ["Do not claim realized savings."],
            citation_sources_json: { rows: ["USAGE-001"] },
            load_run_id: "source-contract-depth-package-test",
          },
        ];
      }
      if (sql.includes("source.contract_consumption_observation")) {
        return [
          {
            tenant_key: "meridian-health",
            observation_id: "SPEND-M365-2026-01",
            contract_id: "MER-TECH-M365-001",
            service_id: "m365-e5",
            business_unit: "Enterprise IT",
            cost_center: "IT-001",
            month: "2026-01-01",
            period_start: "2026-01-01",
            period_end: "2026-01-31",
            committed_amount: "123333.33",
            invoice_amount: "121000.00",
            paid_amount: "121000.00",
            actual_spend: "121000.00",
            currency: "USD",
            source_system: "AP",
            source_record_id: "AP-001",
            as_of_date: "2026-08-29",
            quality_state: "synthetic_demo_evidence",
            evidence_reference: "monthly_spend.csv",
            load_run_id: "source-contract-depth-package-test",
          },
        ];
      }
      if (sql.includes("source.contract_performance_observation")) {
        return [
          {
            tenant_key: "meridian-health",
            observation_id: "SLA-M365-2026-01",
            contract_id: "MER-TECH-M365-001",
            service_id: "m365-e5",
            metric_name: "availability",
            period_start: "2026-01-01",
            period_end: "2026-01-31",
            contracted_target: "99.9%",
            actual_value: "99.95%",
            value_num: "99.95",
            unit: "%",
            performance_state: "met_or_unclassified",
            credit_state: "none",
            breach_count: "0",
            credit_eligible: false,
            credit_calculated: "0",
            credit_claimed: "0",
            credit_recovered: "0",
            currency: "USD",
            source_system: "ITSM",
            source_record_id: "SLA-001",
            as_of_date: "2026-08-29",
            quality_state: "synthetic_demo_evidence",
            evidence_reference: "sla.csv",
            load_run_id: "source-contract-depth-package-test",
          },
        ];
      }
      return [];
    });

    const claimCards = await listSourceContractClaimCards("meridian");
    const avaBundles = await listSourceAvaGroundingBundles("meridian");
    const spendRows = await listContractSpendMonthly(
      "meridian",
      "MER-TECH-M365-001",
    );
    const performanceRows = await listContractPerformancePeriods(
      "meridian",
      "MER-TECH-M365-001",
    );

    expect(claimCards).toHaveLength(1);
    expect(avaBundles).toHaveLength(1);
    expect(spendRows).toHaveLength(1);
    expect(performanceRows).toHaveLength(1);
    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["meridian-health"],
    ]);
    expect(run.mock.calls[1][1][0]).toEqual(["meridian-health"]);
    expect(
      run.mock.calls
        .filter(
          ([sql]) => sql === "SELECT set_config('app.tenant_key', $1, false)",
        )
        .map(([, params]) => params),
    ).toEqual([
      ["meridian-health"],
      ["meridian-health"],
      ["meridian-health"],
      ["meridian-health"],
    ]);
  });

  it("quantifies unapproved rate-card variance inside recoverable leakage evidence", async () => {
    const observedSql: string[] = [];
    run.mockImplementation(async (sql: string) => {
      observedSql.push(sql);
      if (sql.startsWith("SELECT set_config")) return [];
      if (sql.includes("sourcing_performance_v1")) {
        return [
          {
            row_count: 12,
            credit_calculated: "620000",
            credit_claimed: "0",
            credit_recovered: "0",
            unclaimed_credit: "620000",
          },
        ];
      }
      if (sql.includes("sourcing_spend_monthly_v1")) {
        return [
          {
            row_count: 2,
            invoice_lines: "2",
            off_contract_spend: "185000",
            duplicate_spend: "90000",
          },
        ];
      }
      if (sql.includes("fieldglass_rate_card")) {
        return [
          {
            row_count: 2,
            unapproved_variance_count: "2",
            rate_variance_amount: "410000",
            hours: "20500",
          },
        ];
      }
      return [
        {
          row_count: 0,
          claimable_cost: "0",
          normalized_cost: "0",
          line_item_cost: "0",
        },
      ];
    });

    const pack = await getContractOptimizationEvidencePack(
      "skyharbor",
      "CTR-061",
    );
    const invoiceRate = pack.ledger_items.find(
      (item) => item.ledger_item_id === "recoverable:invoice-rate-card",
    );

    expect(invoiceRate?.amount).toBe(685000);
    expect(invoiceRate?.calculation_rule).toContain(
      "unapproved rate-card variance",
    );
    expect(observedSql.join("\n")).toContain(
      "consumption.sourcing_performance_v1",
    );
    expect(observedSql.join("\n")).toContain(
      "consumption.sourcing_spend_monthly_v1",
    );
    expect(observedSql.join("\n")).not.toContain("consumption_v4_canary");
  });

  it("merges governed Meridian financial and performance rows over legacy candidate rows", async () => {
    run.mockImplementation(async (sql: string) => {
      if (sql.startsWith("SELECT set_config")) return [];
      if (sql.includes("source.contract_financial_exposure")) {
        return [
          {
            tenant_key: "meridian-health",
            contract_id: "MER-TECH-AMS-001",
            vendor_ref: "VND-AMS",
            vendor_name: "Cognizant Technology Solutions",
            contracted_annual_value: "12400000",
            total_committed_value: "37200000",
            committed_annual_spend: "12400000",
            actual_annual_spend: "12320000",
            linked_budget_amount: "12400000",
            linked_forecast_amount: "12400000",
            linked_actual_amount: "12320000",
            linked_committed_amount: "12400000",
            linked_budget_lines: "12",
          },
          {
            tenant_key: "meridian-health",
            contract_id: "CTR-LEGACY-001",
            vendor_ref: "VND-LEGACY",
            vendor_name: "Governed Override Vendor",
            contracted_annual_value: "1100000",
          },
        ];
      }
      if (sql.includes("source.contract_operational_performance")) {
        return [
          {
            tenant_key: "meridian-health",
            contract_id: "MER-TECH-AMS-001",
            vendor_ref: "VND-AMS",
            vendor_name: "Cognizant Technology Solutions",
            sla_summary: "3 breached SLA periods across 12 periods.",
            service_credits_earned: "37000",
            service_credits_claimed: "0",
            evidence_gap: "false",
          },
        ];
      }
      return [];
    });
    mockedQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("source.meridian_vendor360_financial_exposure")) {
        return [
          {
            tenant_key: "meridian_health_global",
            contract_id: "CTR-LEGACY-001",
            vendor_ref: "VND-LEGACY",
            vendor_name: "Legacy Candidate Vendor",
            contracted_annual_value: "1000000",
          },
        ];
      }
      if (sql.includes("source.meridian_vendor360_operational_performance")) {
        return [
          {
            tenant_key: "meridian_health_global",
            contract_id: "CTR-LEGACY-001",
            vendor_ref: "VND-LEGACY",
            vendor_name: "Legacy Candidate Vendor",
            sla_summary: "legacy row",
          },
        ];
      }
      return [];
    });

    const financial = await listContractFinancialExposure("meridian");
    const performance = await listContractOperationalPerformance("meridian");

    expect(financial.map((row) => row.contract_id)).toEqual([
      "CTR-LEGACY-001",
      "MER-TECH-AMS-001",
    ]);
    expect(
      financial.find((row) => row.contract_id === "CTR-LEGACY-001")
        ?.vendor_name,
    ).toBe("Governed Override Vendor");
    expect(performance.map((row) => row.contract_id)).toEqual([
      "CTR-LEGACY-001",
      "MER-TECH-AMS-001",
    ]);
    expect(
      performance.find((row) => row.contract_id === "MER-TECH-AMS-001")
        ?.service_credits_earned,
    ).toBe("37000");
  });

  it("reads contract evidence detail rows from the loaded evidence package", async () => {
    run.mockImplementation(async (sql: string) => {
      if (sql.startsWith("SELECT set_config")) return [];
      if (sql.includes("golden_contract_overview")) {
        return [
          {
            contract_id: "CTR-090",
            contract_english_overview:
              "This agreement covers the customer data platform.",
          },
        ];
      }
      if (sql.includes("golden_contract_application_scope")) {
        return [
          {
            contract_id: "CTR-090",
            application_name: "Passenger Service",
            service_or_platform_component: "Salesforce Data Cloud",
            annual_run_cost_usd: "10900000",
          },
        ];
      }
      if (sql.includes("golden_contract_pricing_schedule")) {
        return [
          {
            contract_id: "CTR-090",
            line_item_description: "Data Cloud Enterprise",
            annual_value_usd: "29548800",
          },
        ];
      }
      if (sql.includes("golden_contract_sla_incident_service_credit_monthly")) {
        return [
          {
            contract_id: "CTR-090",
            sla_months: 24,
            service_credits_earned_usd: "890000",
            service_credits_claimed_usd: "135280",
            invoice_line_count: 48,
            invoice_exception_amount_usd: "2376372",
            realized_value_usd: "940000",
            source_systems: ["ITSM/SLA management", "ERP/AP"],
          },
        ];
      }
      return [];
    });

    const [overview, scope, pricing, performance] = await Promise.all([
      getContractEvidenceOverview("skyharbor", "CTR-090"),
      listContractEvidenceScope("skyharbor", "CTR-090"),
      listContractEvidencePricing("skyharbor", "CTR-090"),
      getContractEvidencePerformanceSummary("skyharbor", "CTR-090"),
    ]);

    expect(overview?.contract_english_overview).toContain(
      "customer data platform",
    );
    expect(scope).toHaveLength(1);
    expect(pricing[0]?.line_item_description).toBe("Data Cloud Enterprise");
    expect(performance?.sla_months).toBe(24);
    expect(performance?.invoice_exception_amount_usd).toBe(2376372);
    expect(performance?.realized_value_usd).toBe(940000);
  });
});
