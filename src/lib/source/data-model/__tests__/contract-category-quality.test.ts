import {
  NEEDS_CLASSIFICATION_CATEGORY,
  evaluateContractCategoryQuality,
  inferContractCategorySignal,
  normalizeContractCategory,
} from "../contract-category-quality";
import type { SourceContract360Row } from "../types";

function contractRow(
  overrides: Partial<SourceContract360Row> & { contract_id: string },
): SourceContract360Row {
  const { contract_id, ...rest } = overrides;
  return {
    tenant_key: "skyharbor_global",
    contract_id,
    vendor_ref: "vendor-default",
    vendor_name: "Microsoft",
    vendor_category: "application managed services",
    contract_name: "Application support agreement",
    scope_summary: null,
    annual_value: 10_000_000,
    total_committed_value: 30_000_000,
    committed_annual_spend: 10_000_000,
    actual_annual_spend: 9_000_000,
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
    ...rest,
  };
}

describe("contract category semantic quality", () => {
  it("normalizes known category aliases", () => {
    expect(normalizeContractCategory("AMS")).toBe("Application managed services");
    expect(normalizeContractCategory("cybersecurity")).toBe("Cybersecurity");
  });

  it("strips vendor names before inferring evidence signals", () => {
    expect(
      inferContractCategorySignal(
        contractRow({
          contract_id: "c-cloud",
          vendor_name: "Oracle",
          vendor_category: "application managed services",
          contract_name: "Oracle Azure cloud platform agreement",
        }),
      ),
    ).toBe("Cloud platform");
  });

  it("withholds effective_category when the source category conflicts with contract evidence", () => {
    const summary = evaluateContractCategoryQuality([
      contractRow({
        contract_id: "c-1",
        vendor_category: "application managed services",
        contract_name: "Cybersecurity agreement",
        scope_summary: "Endpoint threat monitoring and SIEM coverage.",
      }),
    ]);

    expect(summary.qualityState).toBe("blocked");
    expect(summary.conflictedRows).toBe(1);
    expect(summary.semanticRows[0]).toEqual(
      expect.objectContaining({
        source_category: "Application managed services",
        suggested_category: "Cybersecurity",
        effective_category: NEEDS_CLASSIFICATION_CATEGORY,
        category_quality_state: "conflicted",
        category_review_status: "not_reviewed",
      }),
    );
  });

  it("keeps clean categories usable for grouping", () => {
    const summary = evaluateContractCategoryQuality([
      contractRow({
        contract_id: "c-1",
        vendor_category: "data platform",
        contract_name: "Data platform agreement",
        scope_summary: "Analytics warehouse and lakehouse services.",
      }),
    ]);

    expect(summary.qualityState).toBe("available");
    expect(summary.semanticRows[0]?.effective_category).toBe("Data platform");
  });
});
