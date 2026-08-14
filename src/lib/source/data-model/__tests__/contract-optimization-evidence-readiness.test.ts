import {
  buildContractOptimizationEvidencePack,
  buildGoldenContractEvidenceCanary,
  type ContractOptimizationEvidenceItem,
} from "../contract-optimization-evidence";
import { buildContractOptimizationEvidenceReadiness } from "../contract-optimization-evidence-readiness";

function rowFor(
  readiness: ReturnType<typeof buildContractOptimizationEvidenceReadiness>,
  family: string,
) {
  const row = readiness.rows.find((candidate) => candidate.family === family);
  if (!row) throw new Error(`No readiness row for family ${family}`);
  return row;
}

function item(
  overrides: Partial<ContractOptimizationEvidenceItem> = {},
): ContractOptimizationEvidenceItem {
  return {
    ledger_item_id: "recoverable:test",
    contract_id: "CTR-TEST",
    ledger_type: "recoverable_leakage",
    amount: 1000,
    amount_state: "quantified",
    evidence_class: "system_evidenced",
    evidence_refs: ["source.golden_contract_invoice_lines"],
    source_systems: ["ERP / AP"],
    source_record_ids: ["record-1"],
    document_refs: [],
    page_spans: [],
    calculation_rule: null,
    confidence: 0.9,
    review_state: "procurement_reviewed",
    decision_state: "candidate",
    workflow_event_id: null,
    tower_claim_id: null,
    ...overrides,
  };
}

describe("buildContractOptimizationEvidenceReadiness", () => {
  it("reports every family as missing — never zero — when no evidence pack exists", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: null,
    });

    expect(readiness.rows.length).toBeGreaterThan(0);
    for (const row of readiness.rows) {
      expect(row.evidenceClass).toBe("missing");
      expect(row.loadState).toBe("not_loaded");
      expect(row.parserState).toBe("not_run");
      expect(row.factObjectCount).toBe(0);
      expect(row.nextAction).not.toBe("");
    }
    expect(readiness.status).toBe("blocked");
    expect(readiness.sizingBlocked).toBe(true);
    expect(readiness.requiredEvidenced).toBe(0);
    expect(readiness.summary).toContain("before sizing");
  });

  it("always states an owner, template, grain, and artifact impact for a missing row", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: null,
    });
    const row = rowFor(readiness, "sla_performance");

    expect(row.obligation).toBe("required");
    expect(row.ownerRole).toContain("Service delivery manager");
    expect(row.templateFileName).toBe("sla-performance.csv");
    expect(row.sourceSystems.length).toBeGreaterThan(0);
    expect(row.grainHistory).toContain("Monthly");
    expect(row.artifactImpact).toContain("Recoverable Leakage");
    expect(row.blocks).toContain("Service-credit recovery");
  });

  it("marks families evidenced by the governed database pack vocabulary", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildContractOptimizationEvidencePack({
        tenantKey: "tenant-a",
        contractId: "CTR-TEST",
        ledgerItems: [
          item({
            ledger_item_id: "recoverable:sla-credit-gap",
            evidence_refs: [
              "source.golden_contract_sla_incident_service_credit_monthly",
              "doc.extraction:contract.sla_credit_terms",
            ],
            source_systems: ["ServiceNow", "CLM / contract repository"],
            source_record_ids: ["contract:CTR-TEST:monthly-sla-credit-history"],
          }),
        ],
      }),
    });

    const sla = rowFor(readiness, "sla_performance");
    expect(sla.evidenceClass).toBe("system_evidenced");
    expect(sla.loadState).toBe("system_loaded");
    expect(sla.parserState).toBe("reviewed");
    expect(sla.factObjectCount).toBe(1);
    expect(sla.sourceSystems).toContain("ServiceNow");

    // A family the pack says nothing about stays explicitly missing.
    expect(rowFor(readiness, "ticket_volume").evidenceClass).toBe("missing");
    expect(readiness.status).toBe("partial");
    expect(readiness.sizingBlocked).toBe(true);
  });

  it("also matches the canary evidence-ref vocabulary", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildGoldenContractEvidenceCanary({
        tenantKey: "tenant-a",
        contractId: "CTR-TEST",
      }),
    });

    expect(rowFor(readiness, "sla_performance").evidenceClass).not.toBe(
      "missing",
    );
    expect(rowFor(readiness, "invoice_summary").evidenceClass).not.toBe(
      "missing",
    );
    expect(rowFor(readiness, "contract_baseline").evidenceClass).not.toBe(
      "missing",
    );
  });

  it("reports the weakest evidence class and parser state when a family has several inputs", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildContractOptimizationEvidencePack({
        tenantKey: "tenant-a",
        contractId: "CTR-TEST",
        ledgerItems: [
          item({
            ledger_item_id: "a",
            evidence_class: "system_evidenced",
            review_state: "finance_validated",
            evidence_refs: ["source.golden_contract_invoice_lines"],
            source_record_ids: ["record-1"],
          }),
          item({
            ledger_item_id: "b",
            evidence_class: "inferred",
            review_state: "needs_review",
            evidence_refs: ["source.golden_contract_po_contract_match"],
            source_record_ids: ["record-2"],
          }),
        ],
      }),
    });

    const invoice = rowFor(readiness, "invoice_summary");
    expect(invoice.evidenceClass).toBe("inferred");
    expect(invoice.parserState).toBe("needs_review");
    expect(invoice.factObjectCount).toBe(2);
  });

  it("does not let an optional family block readiness", () => {
    const withEveryRequiredFamily = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildContractOptimizationEvidencePack({
        tenantKey: "tenant-a",
        contractId: "CTR-TEST",
        ledgerItems: [
          item({
            ledger_item_id: "everything",
            evidence_refs: [
              "pricing_schedule",
              "source.golden_contract_invoice_lines",
              "source.golden_contract_rate_card_variance",
              "source.golden_contract_sla_incident_service_credit_monthly",
              "source.golden_contract_renewal_negotiation_history",
              "doc.extraction:contract.benchmarking_clause",
            ],
          }),
        ],
      }),
    });

    // For the default AMS pack, demand volume and staffing remain required until
    // actual ticket/usage and staffing evidence lands.
    expect(withEveryRequiredFamily.blockingFamilies).toEqual(
      expect.arrayContaining(["ticket_volume", "staffing_model"]),
    );
    expect(withEveryRequiredFamily.blockingFamilies).not.toContain(
      "evidence_reference",
    );
    expect(rowFor(withEveryRequiredFamily, "evidence_reference").obligation).toBe(
      "optional",
    );
  });

  it("deduplicates fact object references across matched items", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildContractOptimizationEvidencePack({
        tenantKey: "tenant-a",
        contractId: "CTR-TEST",
        ledgerItems: [
          item({
            ledger_item_id: "a",
            source_record_ids: ["shared-record"],
            document_refs: ["Pricing Schedule 2.1"],
          }),
          item({
            ledger_item_id: "b",
            evidence_refs: ["source.golden_contract_po_contract_match"],
            source_record_ids: ["shared-record"],
            document_refs: ["Pricing Schedule 2.1"],
          }),
        ],
      }),
    });

    expect(rowFor(readiness, "invoice_summary").factObjectRefs).toEqual([
      "shared-record",
      "Pricing Schedule 2.1",
    ]);
  });

  it("differs between two contracts because of their evidence, not their id", () => {
    const evidenced = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildGoldenContractEvidenceCanary({
        contractId: "CTR-001",
      }),
    });
    const bare = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildContractOptimizationEvidencePack({
        tenantKey: "tenant-a",
        contractId: "CTR-002",
        ledgerItems: [],
      }),
    });

    expect(evidenced.requiredEvidenced).toBeGreaterThan(bare.requiredEvidenced);
    expect(bare.status).toBe("blocked");

    // Same evidence under a different contract id gives the same readiness.
    const sameEvidenceOtherContract =
      buildContractOptimizationEvidenceReadiness({
        evidencePack: buildGoldenContractEvidenceCanary({
          contractId: "CTR-999",
        }),
      });
    expect(sameEvidenceOtherContract.requiredEvidenced).toBe(
      evidenced.requiredEvidenced,
    );
    expect(sameEvidenceOtherContract.status).toBe(evidenced.status);
  });

  it("honours an archetype pack that drops a family", () => {
    const saas = buildContractOptimizationEvidenceReadiness({
      evidencePack: null,
      archetypeKey: "saas_renewal_optimization",
    });

    expect(saas.rows.some((row) => row.family === "staffing_model")).toBe(false);
    expect(saas.rows.some((row) => row.family === "sla_performance")).toBe(true);
  });

  it("infers SaaS/platform evidence readiness from usage entitlement rows", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildContractOptimizationEvidencePack({
        tenantKey: "tenant-a",
        contractId: "CTR-TEST",
        ledgerItems: [
          item({
            ledger_item_id: "everything",
            evidence_refs: [
              "pricing_schedule",
              "source.golden_contract_invoice_lines",
              "source.golden_contract_rate_card_variance",
              "source.golden_contract_sla_incident_service_credit_monthly",
              "source.golden_contract_usage_entitlement_monthly",
              "source.golden_contract_renewal_negotiation_history",
              "doc.extraction:contract.benchmarking_clause",
            ],
            source_systems: ["SaaS / cloud admin"],
          }),
        ],
      }),
    });

    expect(readiness.rows.some((row) => row.family === "staffing_model")).toBe(
      false,
    );
    expect(rowFor(readiness, "ticket_volume").label).toBe(
      "Usage / Demand Volumes",
    );
    expect(rowFor(readiness, "ticket_volume").evidenceClass).not.toBe(
      "missing",
    );
    expect(readiness.blockingFamilies).toEqual([]);
    expect(readiness.sizingBlocked).toBe(false);
  });

  it("recognizes governed change-order and renewal-term aliases", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: buildContractOptimizationEvidencePack({
        tenantKey: "tenant-a",
        contractId: "CTR-TEST",
        ledgerItems: [
          item({
            ledger_item_id: "change-order",
            evidence_refs: ["source.golden_contract_change_order_register"],
          }),
          item({
            ledger_item_id: "renewal-terms",
            evidence_refs: ["doc.extraction:contract.renewal_terms"],
          }),
        ],
      }),
    });

    expect(rowFor(readiness, "change_order").evidenceClass).not.toBe(
      "missing",
    );
    expect(rowFor(readiness, "renewal_terms").evidenceClass).not.toBe(
      "missing",
    );
  });
});
