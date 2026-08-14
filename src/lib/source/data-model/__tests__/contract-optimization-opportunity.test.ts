import { buildContractOptimizationOpportunitySet } from "@/lib/source/data-model/contract-optimization-opportunity";
import type { SourceContract360Row } from "@/lib/source/data-model/types";

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
    annual_value: 100_000,
    total_committed_value: 400_000,
    committed_annual_spend: 100_000,
    actual_annual_spend: 92_000,
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

describe("buildContractOptimizationOpportunitySet", () => {
  it("creates a governed rate-variance opportunity with reproducible included, pending, and excluded line evidence", () => {
    const set = buildContractOptimizationOpportunitySet({
      tenantKey: "skyharbor_global",
      contract: contract(),
      overview: {
        tenant_key: "skyharbor_global",
        dataset_version: "test-v1",
        contract_id: "CTR-090",
        vendor_id: "salesforce",
        vendor_name: "Salesforce",
        contract_name: "Salesforce Data Platform Agreement 3",
        annual_value_usd: 100_000,
        actual_annual_spend_usd: 92_000,
        total_committed_value_usd: 400_000,
        notice_deadline: "2031-02-28",
        decision_owner_role_ref: "LDR-032",
      },
      pricingRows: [
        {
          contract_id: "CTR-090",
          line_item_id: "PS-1",
          sku_or_service_code: "SKU-A",
          annual_value_usd: 60_000,
          unit_of_measure: "user-month",
          source_record_id: "pricing-1",
        },
        {
          contract_id: "CTR-090",
          line_item_id: "PS-2",
          sku_or_service_code: "SKU-B",
          annual_value_usd: 40_000,
          unit_of_measure: "api-call",
          source_record_id: "pricing-2",
        },
      ],
      invoiceRows: [
        {
          contract_id: "CTR-090",
          invoice_id: "INV-1",
          invoice_line_id: "INV-1-A",
          service_period_start: "2026-01-01",
          service_period_end: "2026-01-31",
          sku_or_service_code: "SKU-A",
          matched_contract_rate_usd: 100,
          billed_rate_usd: 110,
          exception_type: "rate_variance",
          exception_amount_usd: 1_000,
          source_record_id: "invoice-1-a",
          source_system: "AP ERP",
        },
        {
          contract_id: "CTR-090",
          invoice_id: "INV-2",
          invoice_line_id: "INV-2-A",
          service_period_start: "2026-02-01",
          service_period_end: "2026-02-28",
          sku_or_service_code: "SKU-B",
          matched_contract_rate_usd: 50,
          billed_rate_usd: 55,
          exception_type: "rate_variance",
          exception_amount_usd: 500,
          source_record_id: "invoice-2-a",
          source_system: "AP ERP",
        },
        {
          contract_id: "CTR-090",
          invoice_id: "INV-3",
          invoice_line_id: "INV-3-A",
          service_period_start: "2026-03-01",
          service_period_end: "2026-03-31",
          sku_or_service_code: "SKU-C",
          matched_contract_rate_usd: null,
          billed_rate_usd: 250,
          exception_type: "off_contract_billing",
          exception_amount_usd: 2_000,
          source_record_id: "invoice-3-a",
          source_system: "AP ERP",
        },
        {
          contract_id: "CTR-090",
          invoice_id: "INV-4",
          invoice_line_id: "INV-4-A",
          service_period_start: "2026-04-01",
          service_period_end: "2026-04-30",
          sku_or_service_code: "SKU-A",
          matched_contract_rate_usd: 100,
          billed_rate_usd: 100,
          exception_type: "",
          exception_amount_usd: 0,
          source_record_id: "invoice-4-a",
          source_system: "AP ERP",
        },
      ],
      poRows: [],
      rateRows: [
        {
          contract_id: "CTR-090",
          rate_card_line_id: "RATE-1",
          labor_or_service_role: "Salesforce data engineer",
          contract_rate_usd_per_hour: 172,
          billed_rate_usd_per_hour: 190,
          hours_last_12_months: 25,
          rate_variance_usd: 450,
          amendment_reference: "No rate-card amendment found",
          source_record_id: "rate-1",
          source_system: "VMS / rate card",
        },
      ],
      slaRows: [
        {
          contract_id: "CTR-090",
          period_month: "2026-01",
          service_credits_earned_usd: 300,
          service_credits_claimed_usd: 100,
          service_credits_received_usd: 50,
          source_record_id: "sla-1",
        },
        {
          contract_id: "CTR-090",
          period_month: "2026-02",
          service_credits_earned_usd: 250,
          service_credits_claimed_usd: 0,
          service_credits_received_usd: 0,
          source_record_id: "sla-2",
        },
      ],
      usageRows: [{ contract_id: "CTR-090", source_record_id: "usage-1" }],
      renewalRows: [
        {
          contract_id: "CTR-090",
          event_type: "license_true_up",
          finding_or_offer_summary: "Unused seats support rationalization.",
          estimated_value_usd: 3_000,
          owner_role_ref: "LDR-032",
          source_record_id: "renewal-1",
        },
        {
          contract_id: "CTR-090",
          event_type: "benchmark",
          finding_or_offer_summary:
            "Benchmark clause supports price challenge.",
          estimated_value_usd: 1_200,
          owner_role_ref: "LDR-032",
          source_record_id: "renewal-2",
        },
      ],
      financeRow: {
        contract_id: "CTR-090",
        realized_value_usd: 700,
        avoided_cost_usd: 3_000,
        negotiated_improvement_usd: 1_200,
        realized_value_basis:
          "Finance confirmed realized value for approved prior recovery.",
        value_claim_id: "claim-090",
        tower_claim_refs: "tower-claim-1",
        confirmation_date: "2026-03-31",
      },
      pdfClauseRows: [
        {
          extraction_id: "extract-pricing",
          source_file_name: "CTR-090.pdf",
          source_file_id: "file-090",
          source_page: 12,
          concept_ref: "contract.pricing_schedule",
          review_state: "reviewed",
        },
        {
          extraction_id: "extract-credit",
          source_file_name: "CTR-090.pdf",
          source_file_id: "file-090",
          source_page: 22,
          concept_ref: "contract.service_credit",
          review_state: "reviewed",
        },
      ],
    });

    expect(set).not.toBeNull();
    expect(set?.baseline.status).toBe("ready");
    expect(set?.selectedOpportunityId).toBe("CTR-090:rate-variance");
    expect(set?.potentialRecoverableUsd).toBe(4_400);
    expect(set?.potentialAvoidableUsd).toBe(3_000);
    expect(set?.potentialNegotiableUsd).toBe(1_200);
    expect(set?.financeConfirmedUsd).toBe(700);

    const rateVariance = set?.opportunities.find(
      (item) => item.opportunityId === "CTR-090:rate-variance",
    );
    expect(rateVariance).toMatchObject({
      amountUsd: 1_500,
      stage: "quantified",
      evidenceGrade: "system_evidenced",
      valueType: "recoverable_leakage",
      approvalState: "requires_amendment_exception_review",
    });
    expect(rateVariance?.calculation).toMatchObject({
      ruleId: "source.contract_optimization.rate_variance.v1",
      calculatedAmountUsd: 1_500,
      includedLineCount: 2,
      pendingLineCount: 1,
      excludedLineCount: 1,
    });
    expect(
      rateVariance?.calculation?.lines.map((line) => line.inclusion),
    ).toEqual(["included", "included", "pending_review", "excluded"]);
    expect(rateVariance?.calculation?.lines[0]).toMatchObject({
      invoiceId: "INV-1",
      invoiceLineId: "INV-1-A",
      skuOrService: "SKU-A",
      quantity: 100,
      unitOfMeasure: "user-month",
      billedRateUsd: 110,
      contractRateUsd: 100,
      amountUsd: 1_000,
    });
    expect(
      rateVariance?.calculation?.lines[0].sourceRefs.map(
        (ref) => ref.tableName,
      ),
    ).toEqual(
      expect.arrayContaining([
        "source.golden_contract_invoice_lines",
        "source.golden_contract_pricing_schedule",
        "source.contract_pdf_clause_extractions",
      ]),
    );
    const vmsRateCard = set?.opportunities.find(
      (item) => item.opportunityId === "CTR-090:vms-rate-card-variance",
    );
    expect(vmsRateCard).toMatchObject({
      label: "VMS labor rate-card variance",
      amountUsd: 450,
      stage: "quantified",
      valueType: "recoverable_leakage",
      approvalState: "requires_vms_rate_exception_review",
    });
    expect(vmsRateCard?.calculation).toMatchObject({
      ruleId: "source.contract_optimization.vms_rate_card_variance.v1",
      calculatedAmountUsd: 450,
      eligibleQuantity: 25,
      includedLineCount: 1,
    });
    const offContract = set?.opportunities.find(
      (item) => item.opportunityId === "CTR-090:off-contract-billing",
    );
    expect(offContract?.calculation).toMatchObject({
      ruleId: "source.contract_optimization.off_contract_billing.v1",
      calculatedAmountUsd: 2_000,
      includedLineCount: 1,
    });
    const slaCredits = set?.opportunities.find(
      (item) => item.opportunityId === "CTR-090:sla-credit-recovery",
    );
    expect(slaCredits?.calculation).toMatchObject({
      ruleId: "source.contract_optimization.sla_credit_recovery.v1",
      calculatedAmountUsd: 450,
      includedLineCount: 2,
    });
    const scopeReduction = set?.opportunities.find(
      (item) => item.opportunityId === "CTR-090:scope-rationalization",
    );
    expect(scopeReduction?.calculation).toMatchObject({
      ruleId: "source.contract_optimization.scope_rationalization.v1",
      calculatedAmountUsd: 3_000,
      includedLineCount: 1,
    });
    const negotiatedImprovement = set?.opportunities.find(
      (item) => item.opportunityId === "CTR-090:negotiated-improvement",
    );
    expect(negotiatedImprovement?.calculation).toMatchObject({
      ruleId: "source.contract_optimization.negotiated_improvement.v1",
      calculatedAmountUsd: 1_200,
      includedLineCount: 1,
    });
    for (const opportunity of set?.opportunities ?? []) {
      if (opportunity.amountUsd == null) continue;
      expect(opportunity.calculation?.calculatedAmountUsd).toBe(
        opportunity.amountUsd,
      );
    }
    expect(set?.financeRealizations[0]).toMatchObject({
      realizationId: "claim-090",
      amountUsd: 700,
      linkedOpportunityIds: expect.arrayContaining(["CTR-090:rate-variance"]),
      confirmationDate: "2026-02-28",
    });
  });

  it("blocks opportunity sizing when the annual value and pricing schedule conflict", () => {
    const set = buildContractOptimizationOpportunitySet({
      tenantKey: "skyharbor_global",
      contract: contract({
        contract_id: "CTR-061",
        vendor_ref: "microsoft",
        vendor_name: "Microsoft",
        contract_name: "Microsoft Cloud Platform Agreement 2",
        annual_value: 35_800_000,
      }),
      overview: {
        tenant_key: "skyharbor_global",
        dataset_version: "test-v1",
        contract_id: "CTR-061",
        vendor_id: "microsoft",
        vendor_name: "Microsoft",
        contract_name: "Microsoft Cloud Platform Agreement 2",
        annual_value_usd: 35_800_000,
        actual_annual_spend_usd: 28_300_000,
        total_committed_value_usd: 143_100_000,
      },
      pricingRows: [
        {
          contract_id: "CTR-061",
          line_item_id: "MS-1",
          sku_or_service_code: "AZURE",
          annual_value_usd: 25_800_000,
        },
        {
          contract_id: "CTR-061",
          line_item_id: "MS-2",
          sku_or_service_code: "M365",
          annual_value_usd: 20_000_000,
        },
      ],
      invoiceRows: [
        {
          contract_id: "CTR-061",
          exception_type: "rate_variance",
          exception_amount_usd: 1_000,
          matched_contract_rate_usd: 10,
          billed_rate_usd: 11,
        },
      ],
      poRows: [],
      rateRows: [],
      slaRows: [],
      usageRows: [],
      renewalRows: [],
      financeRow: { contract_id: "CTR-061", realized_value_usd: 100_000 },
      pdfClauseRows: [],
    });

    expect(set).not.toBeNull();
    expect(set?.baseline.status).toBe("conflict");
    expect(set?.baseline.conflictAmountUsd).toBe(10_000_000);
    expect(set?.recommendation).toBe("Build evidence before optimizing.");
    expect(set?.potentialRecoverableUsd).toBe(0);
    expect(set?.financeConfirmedUsd).toBe(0);
    expect(set?.opportunities).toHaveLength(1);
    expect(set?.opportunities[0]).toMatchObject({
      opportunityId: "CTR-061:baseline-conflict",
      amountUsd: null,
      stage: "baseline_conflict",
      evidenceGrade: "conflicted",
      approvalState: "blocked_by_baseline_conflict",
    });
  });
});
