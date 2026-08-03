import {
  buildContract360View,
  collectContractSubjectRefs,
} from "@/lib/source/data-model/contract-360-view";
import type {
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractFinancialExposureRow,
  SourceContractInitiativeDependencyRow,
  SourceContractOperationalPerformanceRow,
  TowerMetricObservationRow,
  TowerValueClaimRow,
} from "@/lib/source/data-model/types";

function contract(
  overrides: Partial<SourceContract360Row> = {},
): SourceContract360Row {
  return {
    tenant_key: "skyharbor_global",
    contract_id: "c1",
    vendor_ref: "v1",
    vendor_name: "Vendor One",
    vendor_category: null,
    contract_name: "Contract One",
    scope_summary: null,
    annual_value: 100,
    total_committed_value: 300,
    committed_annual_spend: 100,
    actual_annual_spend: 95,
    end_date: null,
    notice_period_days: null,
    auto_renew: false,
    renewal_decision_state: null,
    renewal_owner_ref: null,
    benchmarking_clause: null,
    exit_rights_summary: null,
    alternatives_available: null,
    concentration_note: null,
    source_confidence: null,
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

function scopeRow(
  overrides: Partial<SourceContractApplicationScopeRow> = {},
): SourceContractApplicationScopeRow {
  return {
    tenant_key: "skyharbor_global",
    contract_id: "c1",
    vendor_ref: "v1",
    vendor_name: "Vendor One",
    application_ref: "a1",
    application_name: "App One",
    business_function: null,
    function_ref: null,
    criticality: null,
    lifecycle_state: null,
    hosting_model: null,
    annual_run_cost: null,
    modernization_plan: null,
    sla_tier: null,
    known_pain_risk: null,
    it_portfolio_ref: null,
    ...overrides,
  };
}

const NO_FINANCIAL: readonly SourceContractFinancialExposureRow[] = [];
const NO_OPERATIONAL: readonly SourceContractOperationalPerformanceRow[] = [];
const NO_INITIATIVES: readonly SourceContractInitiativeDependencyRow[] = [];
const NO_OBSERVATIONS: readonly TowerMetricObservationRow[] = [];
const NO_CLAIMS: readonly TowerValueClaimRow[] = [];

describe("buildContract360View", () => {
  it("looks up financial exposure, operational performance, and initiative dependencies by contract_id", () => {
    const c = contract({ contract_id: "c1" });
    const financialExposure: SourceContractFinancialExposureRow[] = [
      {
        tenant_key: "skyharbor_global",
        contract_id: "c1",
        vendor_ref: "v1",
        vendor_name: "Vendor One",
        contracted_annual_value: 100,
        total_committed_value: 300,
        committed_annual_spend: 100,
        actual_annual_spend: 95,
        linked_budget_amount: 90,
        linked_forecast_amount: null,
        linked_actual_amount: 92,
        linked_committed_amount: null,
        linked_budget_lines: 3,
      },
      // A different contract's row must not leak into c1's view.
      {
        tenant_key: "skyharbor_global",
        contract_id: "c2",
        vendor_ref: "v2",
        vendor_name: "Vendor Two",
        contracted_annual_value: null,
        total_committed_value: null,
        committed_annual_spend: null,
        actual_annual_spend: null,
        linked_budget_amount: null,
        linked_forecast_amount: null,
        linked_actual_amount: null,
        linked_committed_amount: null,
        linked_budget_lines: null,
      },
    ];
    const initiativeDependencies: SourceContractInitiativeDependencyRow[] = [
      {
        tenant_key: "skyharbor_global",
        contract_id: "c1",
        vendor_ref: "v1",
        vendor_name: "Vendor One",
        initiative_ref: "i1",
        initiative_project_name: "Init One",
        status: "active",
        target_end_date: null,
        approved_budget: null,
        expected_business_technology_value: null,
        major_risk_constraint: null,
        decision_needed: null,
      },
      {
        tenant_key: "skyharbor_global",
        contract_id: "c2",
        vendor_ref: "v2",
        vendor_name: "Vendor Two",
        initiative_ref: "i2",
        initiative_project_name: "Init Two",
        status: "active",
        target_end_date: null,
        approved_budget: null,
        expected_business_technology_value: null,
        major_risk_constraint: null,
        decision_needed: null,
      },
    ];

    const view = buildContract360View({
      contract: c,
      applicationScope: [],
      financialExposure,
      operationalPerformance: NO_OPERATIONAL,
      initiativeDependencies,
      towerObservations: NO_OBSERVATIONS,
      towerValueClaims: NO_CLAIMS,
    });

    expect(view.financialExposure?.linked_budget_lines).toBe(3);
    expect(view.initiativeDependencies).toHaveLength(1);
    expect(view.initiativeDependencies[0].initiative_ref).toBe("i1");
    expect(view.operationalPerformance).toBeNull();
  });

  it("tiers application scope using the confidence rule (unresolved by default)", () => {
    const view = buildContract360View({
      contract: contract(),
      applicationScope: [
        scopeRow({ application_ref: "a1" }),
        scopeRow({ application_ref: "a2" }),
      ],
      financialExposure: NO_FINANCIAL,
      operationalPerformance: NO_OPERATIONAL,
      initiativeDependencies: NO_INITIATIVES,
      towerObservations: NO_OBSERVATIONS,
      towerValueClaims: NO_CLAIMS,
    });
    expect(view.scopeTiers.totalCount).toBe(2);
    expect(view.scopeTiers.unresolved).toHaveLength(2);
    expect(view.scopeTiers.explicit).toHaveLength(0);
  });

  it("honors an explicit-pairs set when supplied", () => {
    const view = buildContract360View({
      contract: contract(),
      applicationScope: [
        scopeRow({ application_ref: "a1" }),
        scopeRow({ application_ref: "a2" }),
      ],
      financialExposure: NO_FINANCIAL,
      operationalPerformance: NO_OPERATIONAL,
      initiativeDependencies: NO_INITIATIVES,
      towerObservations: NO_OBSERVATIONS,
      towerValueClaims: NO_CLAIMS,
      explicitApplicationPairs: new Set(["c1::a1"]),
    });
    expect(view.scopeTiers.explicit.map((r) => r.application_ref)).toEqual([
      "a1",
    ]);
    expect(
      view.scopeTiers.vendorInferred.map((r) => r.application_ref),
    ).toEqual(["a2"]);
  });

  it("sets hasTowerOverlay false when neither observations nor claims are present", () => {
    const view = buildContract360View({
      contract: contract(),
      applicationScope: [],
      financialExposure: NO_FINANCIAL,
      operationalPerformance: NO_OPERATIONAL,
      initiativeDependencies: NO_INITIATIVES,
      towerObservations: NO_OBSERVATIONS,
      towerValueClaims: NO_CLAIMS,
    });
    expect(view.hasTowerOverlay).toBe(false);
  });

  it("sets hasTowerOverlay true when at least one observation is present", () => {
    const view = buildContract360View({
      contract: contract(),
      applicationScope: [],
      financialExposure: NO_FINANCIAL,
      operationalPerformance: NO_OPERATIONAL,
      initiativeDependencies: NO_INITIATIVES,
      towerObservations: [
        {
          observation_id: "o1",
          tenant_key: "skyharbor_global",
          subject_ref: "c1",
          metric_ref: "availability",
          period_start: "2027-01-01",
          period_end: "2027-01-31",
          scenario: null,
          value_num: 99.9,
          value_text: null,
          unit: "pct",
          currency: null,
          numerator: null,
          denominator: null,
          sample_size: null,
          cohort_ref: null,
          dimension_json: null,
          provenance_id: null,
          source_result_hash: null,
          quality_state: "available",
          evidence_state: "accepted",
          observed_at: "2027-02-01",
          stale_at: null,
        },
      ],
      towerValueClaims: NO_CLAIMS,
    });
    expect(view.hasTowerOverlay).toBe(true);
  });
});

describe("buildContract360View docExtractions", () => {
  it("defaults to an empty array when no extractions are supplied", () => {
    const view = buildContract360View({
      contract: contract(),
      applicationScope: [],
      financialExposure: NO_FINANCIAL,
      operationalPerformance: NO_OPERATIONAL,
      initiativeDependencies: NO_INITIATIVES,
      towerObservations: NO_OBSERVATIONS,
      towerValueClaims: NO_CLAIMS,
    });
    expect(view.docExtractions).toEqual([]);
  });

  it("passes through supplied extractions verbatim", () => {
    const extraction = {
      extraction_id: "e1",
      tenant_key: "skyharbor_global",
      concept_ref: "annual_value",
      subject_kind: "contract",
      subject_ref: "c1",
      value_text: "$1.2M",
      value_num: 1_200_000,
      confidence: 0.92,
      method: "llm_extraction",
      review_state: "reviewed",
      source_file_id: "doc-42",
      source_page: 7,
      source_section: "Pricing Schedule",
      extracted_at: "2027-01-01T00:00:00Z",
    };
    const view = buildContract360View({
      contract: contract(),
      applicationScope: [],
      financialExposure: NO_FINANCIAL,
      operationalPerformance: NO_OPERATIONAL,
      initiativeDependencies: NO_INITIATIVES,
      towerObservations: NO_OBSERVATIONS,
      towerValueClaims: NO_CLAIMS,
      docExtractions: [extraction],
    });
    expect(view.docExtractions).toEqual([extraction]);
  });
});

describe("collectContractSubjectRefs", () => {
  it("collects contract_id, vendor_ref, and every distinct application_ref, deduplicated", () => {
    const refs = collectContractSubjectRefs(
      contract({ contract_id: "c1", vendor_ref: "v1" }),
      [
        scopeRow({ application_ref: "a1" }),
        scopeRow({ application_ref: "a2" }),
        scopeRow({ application_ref: "a1" }),
      ],
    );
    expect(refs).toEqual(["c1", "v1", "a1", "a2"]);
  });
});
