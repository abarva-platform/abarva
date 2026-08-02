import { computeSourcingOpportunities } from "@/lib/source/data-model/sourcing-opportunities";
import type { SourceContractVendor360Row } from "@/lib/source/data-model/types";

function row(
  overrides: Partial<SourceContractVendor360Row>,
): SourceContractVendor360Row {
  return {
    tenant_key: "skyharbor_global",
    contract_id: "c-default",
    vendor_ref: "v-default",
    vendor_name: "Default Vendor",
    vendor_category: null,
    contract_name: "Default Contract",
    scope_summary: null,
    annual_value: 0,
    total_committed_value: 0,
    committed_annual_spend: 0,
    actual_annual_spend: 0,
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
    ...overrides,
  };
}

describe("computeSourcingOpportunities", () => {
  const asOf = "2027-06-30";

  it("flags a high-spend, weak-leverage contract with a rationale line", () => {
    const rows = [
      row({
        contract_id: "c1",
        vendor_ref: "v1",
        annual_value: 100,
        benchmarking_clause: "none",
        alternatives_available: "no_alternatives",
        concentration_note: "specialized skill dependency",
      }),
      row({ contract_id: "c2", vendor_ref: "v2", annual_value: 1 }),
    ];
    const result = computeSourcingOpportunities(rows, asOf);
    const opp = result.opportunities.find((o) => o.contractId === "c1");
    expect(opp).toBeDefined();
    expect(opp?.reasons).toContain("high_priority_leverage");
    expect(opp?.rationale.length).toBeGreaterThan(0);
  });

  it("flags a contract whose notice deadline already passed", () => {
    const rows = [
      row({
        contract_id: "c1",
        vendor_ref: "v1",
        annual_value: 50,
        end_date: "2028-08-04",
        notice_period_days: 500,
        auto_renew: true,
      }),
    ];
    const result = computeSourcingOpportunities(rows, asOf);
    const opp = result.opportunities.find((o) => o.contractId === "c1");
    expect(opp?.reasons).toContain("notice_deadline_passed");
    expect(opp?.rationale.join(" ")).toMatch(/auto-renew/i);
  });

  it("flags contracts under the top-N concentration vendor", () => {
    const rows = [
      row({
        contract_id: "c1",
        vendor_ref: "big-vendor",
        vendor_name: "Big Vendor",
        annual_value: 900,
      }),
      row({
        contract_id: "c2",
        vendor_ref: "small-vendor",
        vendor_name: "Small Vendor",
        annual_value: 10,
      }),
    ];
    const result = computeSourcingOpportunities(rows, asOf, {
      topConcentrationCount: 1,
    });
    const big = result.opportunities.find((o) => o.contractId === "c1");
    const small = result.opportunities.find((o) => o.contractId === "c2");
    expect(big?.reasons).toContain("top_concentration_vendor");
    expect(small).toBeUndefined();
  });

  it("merges multiple reasons for the same contract instead of duplicating entries", () => {
    const rows = [
      row({
        contract_id: "c1",
        vendor_ref: "big-vendor",
        vendor_name: "Big Vendor",
        annual_value: 900,
        benchmarking_clause: "none",
        alternatives_available: "no_alternatives",
        concentration_note: "specialized skill dependency, regional dependency",
      }),
    ];
    const result = computeSourcingOpportunities(rows, asOf, {
      topConcentrationCount: 1,
    });
    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0].reasons).toContain("high_priority_leverage");
    expect(result.opportunities[0].reasons).toContain(
      "top_concentration_vendor",
    );
  });

  it("ranks opportunities by annual value descending", () => {
    const rows = [
      row({
        contract_id: "small",
        vendor_ref: "v1",
        annual_value: 10,
        benchmarking_clause: "none",
        alternatives_available: "no_alternatives",
        concentration_note: "specialized skill dependency, regional dependency",
      }),
      row({
        contract_id: "big",
        vendor_ref: "v2",
        annual_value: 500,
        benchmarking_clause: "none",
        alternatives_available: "no_alternatives",
        concentration_note: "specialized skill dependency, regional dependency",
      }),
    ];
    const result = computeSourcingOpportunities(rows, asOf);
    expect(result.opportunities.map((o) => o.contractId)).toEqual([
      "big",
      "small",
    ]);
  });

  it("produces no opportunities for a clean, low-concentration portfolio", () => {
    const rows = [
      row({
        contract_id: "c1",
        vendor_ref: "v1",
        annual_value: 100,
        benchmarking_clause: "explicit_right",
        alternatives_available: "multiple",
        end_date: "2030-01-01",
        notice_period_days: 30,
      }),
    ];
    // With only one vendor, it's still "top concentration" by definition (100% share) —
    // use topConcentrationCount: 0 to isolate the leverage/renewal-only case.
    const result = computeSourcingOpportunities(rows, asOf, {
      topConcentrationCount: 0,
    });
    expect(result.opportunities).toHaveLength(0);
  });
});
