import { buildContractOptimizationLedger } from "@/lib/source/data-model/contract-optimization-ledger";
import {
  CONTRACT_OPTIMIZATION_SOURCE_CONNECTIONS,
  buildContractOptimizationSpine,
} from "@/lib/source/data-model/contract-optimization-spine";
import type { SourceContract360Row } from "@/lib/source/data-model/types";
import type { ContractLeverageEntry } from "@/lib/source/data-model/vendor-contract-portfolio";

function row(
  overrides: Partial<SourceContract360Row> = {},
): SourceContract360Row {
  return {
    tenant_key: "tenant-b",
    contract_id: "MER-CTR-001",
    vendor_ref: "vendor-a",
    vendor_name: "Vendor A",
    vendor_category: "SaaS",
    contract_name: "Vendor A Renewal Agreement",
    scope_summary: null,
    annual_value: 12_000_000,
    total_committed_value: 36_000_000,
    committed_annual_spend: 12_000_000,
    actual_annual_spend: 10_900_000,
    end_date: "2027-12-31",
    notice_period_days: 90,
    auto_renew: false,
    renewal_decision_state: null,
    renewal_owner_ref: "role-vendor-management",
    benchmarking_clause: null,
    exit_rights_summary: null,
    alternatives_available: null,
    concentration_note: null,
    source_confidence: 0.77,
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

function leverage(
  overrides: Partial<ContractLeverageEntry> = {},
): ContractLeverageEntry {
  return {
    contractId: "MER-CTR-001",
    vendorRef: "vendor-a",
    vendorName: "Vendor A",
    annualValue: 12_000_000,
    weakSignals: {
      benchmarking: true,
      alternatives: false,
      skill_dependency: false,
      regional_dependency: false,
    },
    weakSignalCount: 1,
    isHighPriority: false,
    ...overrides,
  };
}

describe("contract optimization portability contract", () => {
  it("exposes the shared decision-record fields without tenant-specific logic", () => {
    const ledger = buildContractOptimizationLedger({
      view: null,
      contract: row(),
      leverage: leverage(),
      datasetVersion: "v-test",
      door1EventId: "event-123",
    });

    expect(Object.keys(ledger.decisionRecord).sort()).toEqual(
      [
        "tenant_key",
        "dataset_version",
        "contract_id",
        "vendor_id",
        "optimization_state",
        "recoverable_leakage",
        "avoided_cost",
        "negotiated_improvement",
        "realized_value",
        "evidence_status",
        "evidence_classes",
        "evidence_refs",
        "confidence",
        "owner",
        "next_action",
        "door1_event_id",
        "tower_claim_refs",
      ].sort(),
    );
    expect(ledger.decisionRecord).toMatchObject({
      tenant_key: "tenant-b",
      dataset_version: "v-test",
      contract_id: "MER-CTR-001",
      vendor_id: "vendor-a",
      door1_event_id: "event-123",
      recoverable_leakage: null,
      avoided_cost: null,
      negotiated_improvement: null,
      realized_value: null,
    });
  });

  it("keeps absent value as evidence/workflow state rather than zero", () => {
    const ledger = buildContractOptimizationLedger({
      view: null,
      contract: row({
        annual_value: 12_000_000,
        actual_annual_spend: 10_900_000,
      }),
      leverage: leverage(),
    });

    expect(ledger.quantifiedLeakageUsd).toBe(0);
    expect(ledger.realizedValueUsd).toBe(0);
    expect(ledger.decisionRecord.recoverable_leakage).toBeNull();
    expect(ledger.decisionRecord.realized_value).toBeNull();
    expect(ledger.decisionRecord.evidence_status).toEqual(
      expect.objectContaining({
        recoverable_leakage: "EVIDENCE_MISSING",
        avoided_cost: "WORKFLOW_REQUIRED",
        negotiated_improvement: "WORKFLOW_REQUIRED",
        realized_value: "NOT_ESTABLISHED",
      }),
    );
  });

  it("covers the required source evidence classes through shared source-system connections", () => {
    const classes = new Set(
      CONTRACT_OPTIMIZATION_SOURCE_CONNECTIONS.flatMap(
        (connection) => connection.evidenceClasses,
      ),
    );

    expect(Array.from(classes)).toEqual(
      expect.arrayContaining([
        "invoice",
        "payment",
        "rate_card",
        "sla",
        "service_credit",
        "contract_term",
        "renewal",
        "usage",
        "cloud_consumption",
        "workforce",
        "change_order",
        "scope",
        "benchmark",
        "supplier_offer",
        "approved_agreement",
        "finance_value_confirmation",
      ]),
    );
  });

  it("runs the same candidate story for a second tenant without defaulting to the canary tenant", () => {
    const contract = row();
    const spine = buildContractOptimizationSpine({
      contract,
      contracts: [contract],
      leverageEntries: [leverage()],
      ledger: buildContractOptimizationLedger({
        view: null,
        contract,
        leverage: leverage(),
      }),
      asOfDateIso: "2027-06-30",
    });

    expect(spine.selected?.contractId).toBe("MER-CTR-001");
    expect(spine.contractStory.join(" ")).toMatch(/Vendor A/);
    expect(JSON.stringify(spine)).not.toMatch(/skyharbor/i);
  });
});
