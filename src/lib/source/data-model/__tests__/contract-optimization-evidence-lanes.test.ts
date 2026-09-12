import { buildContractOptimizationEvidenceReadiness } from "../contract-optimization-evidence-readiness";

/**
 * The defect this guards, observed live:
 *
 * A managed-services contract carried 24 loaded spend months, 72 performance
 * periods, 64 document extractions and 54 document files — 214 governed
 * evidence rows — and the Optimize tab said "Collect 8 missing evidence
 * families. No required evidence family has governed evidence yet", naming SLA
 * Performance and Invoice Summary among them.
 *
 * Readiness scored the contract only from `ledger_items`, a curation surface
 * that nothing populates at load time. Days of loading could not move that
 * number, because nothing was reading the lanes the loads filled.
 */

describe("evidence readiness against the contract's own lanes", () => {
  it("reports every required family missing when nothing is loaded", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: null,
      archetypeKey: "ams_contract_optimization",
    });

    expect(readiness.sizingBlocked).toBe(true);
    expect(readiness.requiredEvidenced).toBe(0);
    expect(readiness.blockingFamilies.length).toBeGreaterThan(0);
  });

  it("does not call a family missing when the contract holds that lane", () => {
    // The live shape: an empty curation ledger beside a well-loaded contract.
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: {
        tenant_key: "meridian_health",
        dataset_version: "v1",
        contract_id: "MER-TECH-LAAMS-001",
        ledger_items: [],
      } as never,
      archetypeKey: "ams_contract_optimization",
      lanes: {
        scopeRows: 48,
        spendMonths: 24,
        invoicedMonths: 24,
        performancePeriods: 72,
        documentRows: 118,
        changeOrderRows: 3,
        contractTermsLoaded: true,
        renewalTermsLoaded: true,
      },
    });

    const byFamily = new Map(readiness.rows.map((row) => [row.family, row]));

    // Each of these has a loaded lane, so none may read as missing.
    for (const family of [
      "sla_performance",
      "invoice_summary",
      "application_inventory",
      "change_order",
      "renewal_terms",
      "contract_baseline",
      "evidence_reference",
    ] as const) {
      const row = byFamily.get(family);
      if (!row) continue;
      expect(row.evidenceClass).not.toBe("missing");
      expect(row.loadState).not.toBe("not_loaded");
    }

    expect(readiness.requiredEvidenced).toBeGreaterThan(0);
  });

  it("keeps a family missing when no lane speaks to it", () => {
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: null,
      archetypeKey: "ams_contract_optimization",
      lanes: {
        spendMonths: 24,
        performancePeriods: 72,
        // No staffing or ticket rows exist on any lane.
        staffingRows: 0,
        ticketRows: 0,
      },
    });

    const byFamily = new Map(readiness.rows.map((row) => [row.family, row]));
    for (const family of ["staffing_model", "ticket_volume"] as const) {
      const row = byFamily.get(family);
      if (!row) continue;
      expect(row.evidenceClass).toBe("missing");
    }
  });

  it("never promotes a lane-evidenced family above system-evidenced", () => {
    // A projection row is not a reviewed document, and must not claim to be.
    const readiness = buildContractOptimizationEvidenceReadiness({
      evidencePack: null,
      archetypeKey: "ams_contract_optimization",
      lanes: { performancePeriods: 72, documentRows: 118 },
    });

    for (const row of readiness.rows) {
      if (row.evidenceClass === "missing") continue;
      expect(["system_evidenced", "inferred"]).toContain(row.evidenceClass);
    }
  });
});
