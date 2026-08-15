import { buildContractOptimizationLedger } from '@/lib/source/data-model/contract-optimization-ledger';
import { buildContractOptimizationSpine } from '@/lib/source/data-model/contract-optimization-spine';
import type { SourceContract360Row } from '@/lib/source/data-model/types';
import type { ContractLeverageEntry } from '@/lib/source/data-model/vendor-contract-portfolio';

function row(overrides: Partial<SourceContract360Row> = {}): SourceContract360Row {
  return {
    tenant_key: 'tenant-a',
    contract_id: 'CTR-001',
    vendor_ref: 'vendor-a',
    vendor_name: 'Vendor A',
    vendor_category: 'SaaS',
    contract_name: 'Vendor A Platform Agreement',
    scope_summary: null,
    annual_value: 10_000_000,
    total_committed_value: 40_000_000,
    committed_annual_spend: 10_000_000,
    actual_annual_spend: 9_000_000,
    end_date: '2027-12-31',
    notice_period_days: 120,
    auto_renew: false,
    renewal_decision_state: null,
    renewal_owner_ref: 'role-vendor-management',
    benchmarking_clause: null,
    exit_rights_summary: null,
    alternatives_available: null,
    concentration_note: null,
    source_confidence: 0.82,
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

function leverage(overrides: Partial<ContractLeverageEntry> = {}): ContractLeverageEntry {
  return {
    contractId: 'CTR-001',
    vendorRef: 'vendor-a',
    vendorName: 'Vendor A',
    annualValue: 10_000_000,
    weakSignals: {
      benchmarking: true,
      alternatives: true,
      skill_dependency: false,
      regional_dependency: false,
    },
    weakSignalCount: 2,
    isHighPriority: true,
    ...overrides,
  };
}

describe('buildContractOptimizationSpine', () => {
  const asOfDateIso = '2027-06-30';

  it('omits the full candidate list from selected-contract payloads while preserving picker data', () => {
    const selected = row({
      contract_id: 'CTR-SELECTED',
      vendor_ref: 'vendor-selected',
      vendor_name: 'Selected Vendor',
      contract_name: 'Selected Platform Agreement',
      annual_value: 45_000_000,
    });
    const peers = Array.from({ length: 8 }, (_, index) =>
      row({
        contract_id: `CTR-PEER-${index + 1}`,
        vendor_ref: `vendor-peer-${index + 1}`,
        vendor_name: `Peer Vendor ${index + 1}`,
        contract_name: `Peer Agreement ${index + 1}`,
        annual_value: 30_000_000 - index * 1_000_000,
      }),
    );
    const contracts = [selected, ...peers];
    const leverageEntries = contracts.map((contract) =>
      leverage({
        contractId: contract.contract_id,
        vendorRef: contract.vendor_ref,
        vendorName: contract.vendor_name,
        annualValue: contract.annual_value ?? 0,
      }),
    );

    const selectedSpine = buildContractOptimizationSpine({
      contract: selected,
      contracts,
      leverageEntries,
      ledger: null,
      asOfDateIso,
    });
    const landingSpine = buildContractOptimizationSpine({
      contract: null,
      contracts,
      leverageEntries,
      ledger: null,
      asOfDateIso,
    });

    expect(selectedSpine.selected?.contractId).toBe('CTR-SELECTED');
    expect(selectedSpine.candidates).toHaveLength(0);
    expect(selectedSpine.topCandidates).toHaveLength(5);
    expect(landingSpine.selected).toBeNull();
    expect(landingSpine.candidates).toHaveLength(9);
    expect(landingSpine.topCandidates).toHaveLength(5);
  });

  it('ranks material weak-leverage contracts ahead of clean monitor contracts', () => {
    const material = row({
      contract_id: 'CTR-MATERIAL',
      vendor_ref: 'vendor-material',
      vendor_name: 'Material Vendor',
      contract_name: 'Material Platform Agreement',
      annual_value: 45_000_000,
      actual_annual_spend: 37_000_000,
      cloud_sev1_sev2_incidents: 42,
      critical_application_count: 3,
      initiative_dependency_count: 2,
    });
    const clean = row({
      contract_id: 'CTR-CLEAN',
      vendor_ref: 'vendor-clean',
      vendor_name: 'Clean Vendor',
      contract_name: 'Clean Agreement',
      annual_value: 2_000_000,
      actual_annual_spend: 2_000_000,
      end_date: '2032-12-31',
    });
    const spine = buildContractOptimizationSpine({
      contract: material,
      contracts: [clean, material],
      leverageEntries: [
        leverage({ contractId: 'CTR-MATERIAL', vendorRef: 'vendor-material', annualValue: 45_000_000 }),
        leverage({
          contractId: 'CTR-CLEAN',
          vendorRef: 'vendor-clean',
          annualValue: 2_000_000,
          weakSignals: { benchmarking: false, alternatives: false, skill_dependency: false, regional_dependency: false },
          weakSignalCount: 0,
          isHighPriority: false,
        }),
      ],
      ledger: null,
      asOfDateIso,
    });

    expect(spine.topCandidates[0]).toMatchObject({
      contractId: 'CTR-MATERIAL',
      rank: 1,
      band: expect.stringMatching(/candidate/i),
    });
    expect(spine.selected?.reasons.map((reason) => reason.kind)).toEqual(
      expect.arrayContaining(['material_exposure', 'weak_leverage', 'commercial_variance', 'operational_pressure', 'enterprise_dependency']),
    );
  });

  it('keeps missing evidence explicit instead of inventing recoverable or realized value', () => {
    const contract = row({ annual_value: 43_500_000, actual_annual_spend: 37_400_000 });
    const ledger = buildContractOptimizationLedger({
      view: null,
      contract,
      leverage: leverage({ annualValue: 43_500_000 }),
    });
    const spine = buildContractOptimizationSpine({
      contract,
      contracts: [contract],
      leverageEntries: [leverage({ annualValue: 43_500_000 })],
      ledger,
      asOfDateIso,
    });

    expect(ledger.decisionRecord.recoverable_leakage).toBeNull();
    expect(ledger.decisionRecord.realized_value).toBeNull();
    expect(spine.missingEvidenceStory.join(' ')).toMatch(/SLA credit register/i);
    expect(spine.missingEvidenceSources.map((requirement) => requirement.lineLabel)).toEqual(
      expect.arrayContaining([
        'SLA credits earned but not claimed',
        'Invoice, duplicate, off-contract, and rate-card variance',
        'Finance-confirmed realized value',
      ]),
    );
    expect(spine.missingEvidenceSources.flatMap((requirement) => requirement.connections.map((connection) => connection.id))).toEqual(
      expect.arrayContaining(['itsm', 'ap_erp', 'finance_tower']),
    );
    expect(spine.selected?.reasons).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'evidence_gap',
        }),
      ]),
    );
    expect(spine.missingEvidenceSources).toHaveLength(3);
  });

  it('uses shared source-system evidence classes without tenant-specific branching', () => {
    const contract = row({ tenant_key: 'tenant-b', contract_id: 'TENANT-B-CTR-001' });
    const spine = buildContractOptimizationSpine({
      contract,
      contracts: [contract],
      leverageEntries: [leverage({ contractId: 'TENANT-B-CTR-001' })],
      ledger: null,
      asOfDateIso,
    });

    expect(spine.sourceConnections.map((connection) => connection.id)).toEqual(
      expect.arrayContaining(['clm', 'procurement', 'ap_erp', 'itsm', 'usage', 'finance_tower']),
    );
    expect(JSON.stringify(spine.sourceConnections)).not.toMatch(/tenant-b/i);
    expect(spine.sourceConnections.flatMap((connection) => connection.evidenceClasses)).toEqual(
      expect.arrayContaining(['invoice', 'rate_card', 'sla', 'service_credit', 'usage', 'finance_value_confirmation']),
    );
  });

  it('does not source evidence lines that are already document evidenced or inferred', () => {
    const contract = row({ annual_value: 43_500_000, actual_annual_spend: 37_400_000 });
    const ledger = buildContractOptimizationLedger({
      view: null,
      contract,
      leverage: leverage({ annualValue: 43_500_000 }),
    });
    const spine = buildContractOptimizationSpine({
      contract,
      contracts: [contract],
      leverageEntries: [leverage({ annualValue: 43_500_000 })],
      ledger,
      asOfDateIso,
    });

    expect(spine.missingEvidenceSources.map((requirement) => requirement.lineLabel)).not.toContain(
      'Price, term, index cap, volume tier, and termination leverage',
    );
    expect(spine.missingEvidenceSources.map((requirement) => requirement.lineLabel)).not.toContain(
      'Renewal uplift avoided / shelfware removed / scope rationalized',
    );
  });
});
