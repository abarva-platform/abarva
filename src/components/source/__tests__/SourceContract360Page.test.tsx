/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { SourceContract360Page } from "../SourceContract360Page";
import { buildContract360View } from "@/lib/source/data-model/contract-360-view";
import type {
  SourceContract360Row,
  SourceContractFinancialExposureRow,
  SourceContractOperationalPerformanceRow,
  SourceContractInitiativeDependencyRow,
  TowerValueClaimRow,
  DocExtractionRow,
} from "@/lib/source/data-model/types";

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => null,
}));

/**
 * node-postgres returns NUMERIC/DECIMAL columns as strings, not numbers, even
 * though the row types declare them `number | null`. Cast strings through
 * `unknown` here to reproduce exactly what the live driver returns — this is
 * the regression that made Contract 360 show "Not available" for real dollar
 * figures the Vendor & Contract Portfolio list page rendered correctly.
 */
function asDbNumber(value: string): number {
  return value as unknown as number;
}

function baseContract(
  overrides: Partial<SourceContract360Row> = {},
): SourceContract360Row {
  return {
    tenant_key: "skyharbor_global",
    contract_id: "c1",
    vendor_ref: "v1",
    vendor_name: "Salesforce",
    vendor_category: "application managed services",
    contract_name: "Salesforce Data Platform Agreement 3",
    scope_summary: null,
    annual_value: asDbNumber("43476437.00"),
    total_committed_value: asDbNumber("173905748.00"),
    committed_annual_spend: asDbNumber("43000000.00"),
    actual_annual_spend: asDbNumber("41000000.00"),
    end_date: "2031-06-27",
    notice_period_days: 120,
    auto_renew: false,
    renewal_decision_state: "Renewal approved",
    renewal_owner_ref: null,
    benchmarking_clause: "Limited",
    exit_rights_summary: "limited exit rights",
    alternatives_available: "Yes",
    concentration_note: "regional dependency",
    source_confidence: asDbNumber("0.82"),
    resolved_annual_value: null,
    annual_value_conflict_flag: false,
    resolved_total_committed_value: null,
    total_committed_value_conflict_flag: false,
    scoped_application_count: 75,
    critical_application_count: 0,
    linked_budget_amount: null,
    linked_actual_amount: null,
    linked_budget_lines: null,
    cloud_sev1_sev2_incidents: 4590,
    operational_evidence_gap: null,
    initiative_dependency_count: 16,
    ...overrides,
  };
}

describe("SourceContract360Page", () => {
  it("formats string-typed Postgres numerics instead of showing 'Not available'", () => {
    const view = buildContract360View({
      contract: baseContract(),
      applicationScope: [],
      financialExposure: [
        {
          tenant_key: "skyharbor_global",
          contract_id: "c1",
          vendor_ref: "v1",
          vendor_name: "Salesforce",
          contracted_annual_value: asDbNumber("43476437.00"),
          total_committed_value: asDbNumber("173905748.00"),
          committed_annual_spend: asDbNumber("43476437.00"),
          actual_annual_spend: asDbNumber("41000000.00"),
          linked_budget_amount: asDbNumber("45000000.00"),
          linked_forecast_amount: null,
          linked_actual_amount: asDbNumber("41000000.00"),
          linked_committed_amount: null,
          linked_budget_lines: 24,
        } satisfies SourceContractFinancialExposureRow,
      ],
      operationalPerformance: [
        {
          tenant_key: "skyharbor_global",
          contract_id: "c1",
          vendor_ref: "v1",
          vendor_name: "Salesforce",
          sla_summary: "24x7 managed service",
          scoped_application_count: null,
          critical_application_count: null,
          cloud_sev1_sev2_incidents: 4590,
          avg_cloud_change_failure_rate: asDbNumber("0.041"),
          service_credits_earned: asDbNumber("120000.00"),
          service_credits_claimed: asDbNumber("80000.00"),
          evidence_gap: null,
        } satisfies SourceContractOperationalPerformanceRow,
      ],
      initiativeDependencies: [
        {
          tenant_key: "skyharbor_global",
          contract_id: "c1",
          vendor_ref: "v1",
          vendor_name: "Salesforce",
          initiative_ref: "i1",
          initiative_project_name: "ETL Modernization Wave 1",
          status: "In flight",
          target_end_date: "2028-07-01",
          approved_budget: asDbNumber("2500000.00"),
          expected_business_technology_value: null,
          major_risk_constraint: null,
          decision_needed: "Confirm funding",
        } satisfies SourceContractInitiativeDependencyRow,
      ],
      towerObservations: [],
      towerValueClaims: [
        {
          tenant_key: "skyharbor_global",
          claim_id: "claim1",
          subject_ref: "c1",
          outcome_metric_ref: "cost_savings",
          baseline_observation_id: null,
          target_observation_id: null,
          actual_observation_id: null,
          promised_value: asDbNumber("5000000.00"),
          calculated_value: asDbNumber("4200000.00"),
          currency: "USD",
          attribution_basis: null,
          quality_guardrail_state: null,
          risk_guardrail_state: null,
          claim_state: "measured",
          claim_rule_version: null,
          claim_input_hash: null,
          caveat: null,
          blocked_reason: null,
          next_gate: null,
          next_gate_owner_role: null,
          evaluated_at: null,
          stale_at: null,
          stale_reason: null,
        } satisfies TowerValueClaimRow,
      ],
      docExtractions: [
        {
          tenant_key: "skyharbor_global",
          extraction_id: "e1",
          subject_kind: "contract",
          subject_ref: "c1",
          concept_ref: "contract.annual_value",
          value_text: null,
          value_num: asDbNumber("43476437.00"),
          source_file_id: "rawfile-957279ace80bd94718e5a3189d6369da",
          source_page: null,
          source_section: null,
          method: "deterministic_rule",
          review_state: "unreviewed",
          confidence: asDbNumber("0.9"),
          extracted_at: "2026-08-02T00:00:00.000Z",
        } satisfies DocExtractionRow,
      ],
    });

    render(<SourceContract360Page view={view} tenantName="Airline Demo" />);

    // Commercial terms — must render real currency, never "Not available".
    expect(screen.getByText("$43.5M")).toBeInTheDocument();
    expect(screen.queryAllByText("Not available")).toHaveLength(0);

    // Financial exposure.
    expect(screen.getByText("$45.0M")).toBeInTheDocument();

    // Operational performance.
    expect(screen.getByText("$120K")).toBeInTheDocument();

    // Initiative dependency approved budget.
    expect(screen.getByText("$2.5M")).toBeInTheDocument();

    // Tower value claim promised/calculated.
    expect(screen.getByText("$5.0M")).toBeInTheDocument();
    expect(screen.getByText("$4.2M")).toBeInTheDocument();

    // Extraction confidence percentage renders instead of being swallowed.
    expect(screen.getByText(/Extraction confidence/)).toBeInTheDocument();

    expect(screen.getByTestId("contract-360-optimize")).toHaveAttribute(
      "href",
      "/source/optimize?contractId=c1",
    );
    expect(screen.getByTestId("contract-360-optimize")).not.toHaveAttribute(
      "href",
      expect.stringContaining("contractName="),
    );
    expect(screen.getByTestId("contract-360-optimize")).not.toHaveAttribute(
      "href",
      expect.stringContaining("annualValueUsd="),
    );
  });

  it("shows a dash rather than 'Not available' when a value is genuinely absent", () => {
    const view = buildContract360View({
      contract: baseContract({
        annual_value: null,
        total_committed_value: null,
        committed_annual_spend: null,
        actual_annual_spend: null,
        source_confidence: null,
      }),
      applicationScope: [],
      financialExposure: [],
      operationalPerformance: [],
      initiativeDependencies: [],
      towerObservations: [],
      towerValueClaims: [],
      docExtractions: [],
    });

    render(<SourceContract360Page view={view} tenantName="Airline Demo" />);

    expect(screen.queryAllByText("Not available")).toHaveLength(0);
  });

  it("does not serialize synthetic fallback scope into the optimize link", () => {
    const view = buildContract360View({
      contract: baseContract({
        scope_summary:
          "Fictional contract supporting airline technology services for Salesforce; annual value covers only the contract-backed portion of FY2027 vendor spend.",
      }),
      applicationScope: [],
      financialExposure: [],
      operationalPerformance: [],
      initiativeDependencies: [],
      towerObservations: [],
      towerValueClaims: [],
      docExtractions: [],
    });

    render(<SourceContract360Page view={view} tenantName="Airline Demo" />);

    const optimize = screen.getByTestId("contract-360-optimize");
    expect(optimize).toHaveAttribute("href", "/source/optimize?contractId=c1");
    expect(optimize).not.toHaveAttribute(
      "href",
      expect.stringContaining("scopeSummary="),
    );
    expect(
      screen.queryByText(/Fictional contract supporting/),
    ).not.toBeInTheDocument();
  });
});
