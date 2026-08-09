import { buildContractOptimizationFactLayer } from "@/lib/source/data-model/contract-optimization-facts";
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

describe("buildContractOptimizationFactLayer", () => {
  it("creates source snapshots, entity links, and invoice-line fact assertions for CTR-090 rate variance", () => {
    const layer = buildContractOptimizationFactLayer({
      tenantKey: "skyharbor_global",
      datasetVersion: "source-v1-1-canary",
      contract: contract(),
      overview: {
        tenant_key: "skyharbor_global",
        dataset_version: "source-v1-1-canary",
        contract_id: "CTR-090",
        vendor_id: "salesforce",
        annual_value_usd: 100_000,
        actual_annual_spend_usd: 92_000,
        total_committed_value_usd: 400_000,
      },
      pricingRows: [
        {
          contract_id: "CTR-090",
          line_item_id: "PS-1",
          sku_or_service_code: "SKU-A",
          annual_value_usd: 60_000,
        },
        {
          contract_id: "CTR-090",
          line_item_id: "PS-2",
          sku_or_service_code: "SKU-B",
          annual_value_usd: 40_000,
        },
      ],
      invoiceRows: [
        {
          contract_id: "CTR-090",
          invoice_id: "INV-CTR090-001",
          invoice_line_id: "INV-CTR090-001-L1",
          source_record_id: "INV-CTR090-001",
          service_period_start: "2026-01-01",
          service_period_end: "2026-01-31",
          sku_or_service_code: "SKU-A",
          quantity: 100,
          unit_of_measure: "user-month",
          matched_contract_rate_usd: 100,
          billed_rate_usd: 110,
          exception_type: "rate_variance",
          exception_amount_usd: 1_000,
          source_system: "SAP/AP",
        },
      ],
      slaRows: [],
      financeRow: null,
      pdfClauseRows: [
        {
          contract_id: "CTR-090",
          extraction_id: "EXT-CTR090-PRICING-001",
          source_file_id: "FILE-CTR090-MSA",
          source_file_name: "CTR-090 executed agreement.pdf",
          source_page: "42",
          source_section: "Schedule 4.1 Pricing",
          concept_ref: "contract.pricing_schedule",
          value_text:
            "Rates are governed by Schedule 4.1 and attached order forms.",
          confidence: 0.91,
          method: "document_extraction",
          review_state: "legal_reviewed",
        },
      ],
    });

    expect(layer.snapshots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tenantKey: "skyharbor_global",
          datasetVersion: "source-v1-1-canary",
          sourceTable: "source.golden_contract_pricing_schedule",
          sourceRecordId: "PS-1",
          contractId: "CTR-090",
        }),
        expect.objectContaining({
          tenantKey: "skyharbor_global",
          datasetVersion: "source-v1-1-canary",
          sourceTable: "source.golden_contract_invoice_lines",
          sourceRecordId: "INV-CTR090-001",
          contractId: "CTR-090",
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
        }),
        expect.objectContaining({
          sourceTable: "source.contract_pdf_clause_extractions",
          sourceRecordId: "EXT-CTR090-PRICING-001",
          contractId: "CTR-090",
        }),
      ]),
    );
    expect(
      layer.snapshots.every((snapshot) =>
        /^sha256:[0-9a-f]{64}$/.test(snapshot.sourceRecordHash),
      ),
    ).toBe(true);
    expect(layer.entityLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityKind: "invoice_line",
          entityId: "INV-CTR090-001",
          contractId: "CTR-090",
        }),
        expect.objectContaining({
          entityKind: "contract",
          entityId: "CTR-090",
          contractId: "CTR-090",
        }),
        expect.objectContaining({
          entityKind: "contract_clause",
          entityId: "EXT-CTR090-PRICING-001",
          contractId: "CTR-090",
          reviewState: "legal_reviewed",
        }),
      ]),
    );
    expect(layer.entityLinks.every((link) => link.confidence >= 0.8)).toBe(
      true,
    );
    expect(layer.assertions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityKind: "invoice_line",
          entityId: "INV-CTR090-001-L1",
          factKey: "invoice_line_quantity",
          valueNumeric: 100,
          unit: "user-month",
        }),
        expect.objectContaining({
          entityKind: "invoice_line",
          factKey: "invoice_line_billed_rate_usd",
          valueNumeric: 110,
        }),
        expect.objectContaining({
          entityKind: "invoice_line",
          factKey: "invoice_line_contract_rate_usd",
          valueNumeric: 100,
        }),
        expect.objectContaining({
          entityKind: "contract",
          factKey: "contract_annual_value_usd",
          valueNumeric: 100_000,
          sourceTable: "source.golden_contract_pricing_schedule",
        }),
        expect.objectContaining({
          entityKind: "contract_clause",
          entityId: "EXT-CTR090-PRICING-001",
          factKey: "contract.pricing_schedule",
          valueText:
            "Rates are governed by Schedule 4.1 and attached order forms.",
          sourceDocumentId: "FILE-CTR090-MSA",
          sourcePage: "42",
          sourceSpan: "Schedule 4.1 Pricing",
        }),
      ]),
    );
    expect(layer.conflicts).toHaveLength(0);
  });

  it("creates a blocking fact conflict when the pricing schedule contradicts annual contract value", () => {
    const layer = buildContractOptimizationFactLayer({
      tenantKey: "skyharbor_global",
      datasetVersion: "source-v1-1-canary",
      contract: contract({
        contract_id: "CTR-061",
        vendor_ref: "microsoft",
        vendor_name: "Microsoft",
        contract_name: "Microsoft Cloud Platform Agreement 2",
        annual_value: 35_800_000,
      }),
      overview: {
        tenant_key: "skyharbor_global",
        dataset_version: "source-v1-1-canary",
        contract_id: "CTR-061",
        vendor_id: "microsoft",
        annual_value_usd: 35_800_000,
        actual_annual_spend_usd: 28_300_000,
      },
      pricingRows: [
        { contract_id: "CTR-061", annual_value_usd: 25_800_000 },
        { contract_id: "CTR-061", annual_value_usd: 20_000_000 },
      ],
      invoiceRows: [],
      slaRows: [],
      financeRow: { contract_id: "CTR-061", realized_value_usd: 100_000 },
    });

    expect(layer.conflicts).toHaveLength(1);
    expect(layer.conflicts[0]).toMatchObject({
      entityKind: "contract",
      entityId: "CTR-061",
      factKey: "contract_annual_value_usd",
      conflictType: "numeric_mismatch",
      severity: "blocker",
      resolutionState: "unresolved",
      numericDelta: 10_000_000,
    });
    expect(layer.conflicts[0].assertionIds).toEqual(
      expect.arrayContaining([
        expect.stringContaining("golden_contract_overview"),
        expect.stringContaining("golden_contract_pricing_schedule"),
      ]),
    );
  });

  it("coerces non-numeric Contract 360 confidence descriptors before writing fact assertions", () => {
    const layer = buildContractOptimizationFactLayer({
      tenantKey: "skyharbor_global",
      datasetVersion: "source-v1-1-canary",
      contract: contract({
        source_confidence: "system-derived" as unknown as number,
      }),
      overview: {
        tenant_key: "skyharbor_global",
        dataset_version: "source-v1-1-canary",
        contract_id: "CTR-090",
        vendor_id: "salesforce",
        annual_value_usd: 100_000,
      },
      pricingRows: [],
      invoiceRows: [],
      slaRows: [],
      financeRow: null,
    });

    expect(
      layer.assertions.find(
        (assertion) =>
          assertion.sourceTable === "source.contract_360" &&
          assertion.factKey === "contract_annual_value_usd",
      ),
    ).toMatchObject({ confidence: 0.82 });
    expect(
      layer.assertions.every((assertion) =>
        Number.isFinite(assertion.confidence),
      ),
    ).toBe(true);
  });
});
