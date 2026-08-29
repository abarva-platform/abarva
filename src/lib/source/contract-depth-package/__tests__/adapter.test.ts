import { adaptContractDepthPackage, type ContractDepthSourceFileInput } from '../adapter';

function validPackage(): ContractDepthSourceFileInput {
  const contract = {
    tenant_key: 'meridian-health',
    dataset_version: 'meridian-contract-depth-v1-20260828',
    source_row_id: 'contract:MER-TECH-AMS-001',
    contract_id: 'MER-TECH-AMS-001',
    vendor_ref: 'VEN-AMS',
    vendor_name: 'Managed Services Vendor',
    contract_name: 'Application Managed Services SOW',
    category: 'Managed Services',
    annual_value_usd: '7600000',
    committed_annual_spend_usd: '7400000',
    actual_annual_spend_usd: '7780000',
    end_date: '2026-09-30',
    notice_period_days: '90',
    auto_renew: 'true',
    benchmarking_clause: 'present',
    source_confidence: '0.93',
  };

  return {
    contracts: [contract],
    applications: [
      {
        tenant_key: 'meridian-health',
        application_ref: 'APP-001',
        application_name: 'Clinical Integration Hub',
      },
    ],
    applicationScope: [
      {
        tenant_key: 'meridian-health',
        dataset_version: 'meridian-contract-depth-v1-20260828',
        source_row_id: 'scope:MER-TECH-AMS-001:APP-001',
        contract_id: 'MER-TECH-AMS-001',
        vendor_ref: 'VEN-AMS',
        vendor_name: 'Managed Services Vendor',
        application_ref: 'APP-001',
        application_name: 'Clinical Integration Hub',
      },
    ],
    changeOrders: [
      {
        tenant_key: 'meridian-health',
        dataset_version: 'meridian-contract-depth-v1-20260828',
        source_row_id: 'change:MER-TECH-AMS-001:01',
        contract_id: 'MER-TECH-AMS-001',
        vendor_ref: 'VEN-AMS',
        source_file_id: 'DOC-AMS-1',
        approval_owner: 'VP Clinical Applications',
        linked_application_ref: 'APP-001',
        recurring: 'true',
        annualized_spend_usd: '288000',
        one_time_spend_usd: '0',
        synthetic_policy: 'synthetic_demo_only_not_client_truth',
      },
    ],
    contractPageText: Array.from({ length: 5 }, (_, index) => ({
      tenant_key: 'meridian-health',
      dataset_version: 'meridian-contract-depth-v1-20260828',
      source_row_id: `page:DOC-AMS-${index + 1}:p1`,
      source_file_id: `DOC-AMS-${index + 1}`,
      contract_id: 'MER-TECH-AMS-001',
      vendor_ref: 'VEN-AMS',
      vendor_name: 'Managed Services Vendor',
      source_page: '1',
      page_text: `Synthetic page text for evidence document ${index + 1}.`,
      synthetic_policy: 'synthetic_demo_only_not_client_truth',
    })),
    monthlySpend: Array.from({ length: 12 }, (_, index) => ({
      tenant_key: 'meridian-health',
      dataset_version: 'meridian-contract-depth-v1-20260828',
      source_row_id: `spend:MER-TECH-AMS-001:${index + 1}`,
      contract_id: 'MER-TECH-AMS-001',
      vendor_ref: 'VEN-AMS',
      vendor_name: 'Managed Services Vendor',
      month: `2026-${String(index + 1).padStart(2, '0')}`,
      actual_spend_usd: '650000',
    })),
    saasUsage: [],
    slaPerformance: [
      {
        tenant_key: 'meridian-health',
        dataset_version: 'meridian-contract-depth-v1-20260828',
        source_row_id: 'sla:MER-TECH-AMS-001:2026-01',
        contract_id: 'MER-TECH-AMS-001',
        vendor_ref: 'VEN-AMS',
        vendor_name: 'Managed Services Vendor',
        breach_state: 'breached',
        credit_claimed: 'false',
        credit_owed_usd: '12333.33',
      },
    ],
    ticketVolumetrics: [
      {
        tenant_key: 'meridian-health',
        dataset_version: 'meridian-contract-depth-v1-20260828',
        source_row_id: 'ticket:MER-TECH-AMS-001:P1',
        contract_id: 'MER-TECH-AMS-001',
        severity: 'P1',
        ticket_count: '12',
      },
    ],
    contractClauses: [
      {
        tenant_key: 'meridian-health',
        dataset_version: 'meridian-contract-depth-v1-20260828',
        extraction_id: 'clause:MER-TECH-AMS-001:credit',
        contract_id: 'MER-TECH-AMS-001',
        value_text: 'Monthly credit applies to breached SLA periods.',
      },
    ],
    evidenceManifest: Array.from({ length: 5 }, (_, index) => ({
      tenant_key: 'meridian-health',
      dataset_version: 'meridian-contract-depth-v1-20260828',
      source_file_id: `DOC-AMS-${index + 1}`,
      contract_id: 'MER-TECH-AMS-001',
      vendor_ref: 'VEN-AMS',
      vendor_name: 'Managed Services Vendor',
      synthetic_policy: 'synthetic_demo_only_not_client_truth',
    })),
    optimizationOpportunities: [
      {
        tenant_key: 'meridian-health',
        dataset_version: 'meridian-contract-depth-v1-20260828',
        opportunity_id: 'OPT-AMS-CREDITS-001',
        contract_id: 'MER-TECH-AMS-001',
        finance_confirmation_state: 'not_confirmed',
        evidence_rows: 'sla:MER-TECH-AMS-001:2026-01',
      },
    ],
  };
}

describe('adaptContractDepthPackage', () => {
  it('preserves every Layer 1 source family as a named Layer 2 adapter output', () => {
    const adapted = adaptContractDepthPackage(validPackage());

    expect(adapted.qualityGate.status).toBe('PASS');
    expect(adapted.qualityGate.failures).toEqual([]);
    expect(adapted.qualityGate.rowCounts).toMatchObject({
      contractRegisterAdapter: 1,
      contractClauseAdapter: 1,
      changeOrderAdapter: 1,
      contractPageTextAdapter: 5,
      cmdbApplicationAdapter: 1,
      contractScopeAdapter: 1,
      spendAdapter: 12,
      ticketVolumeAdapter: 1,
      performanceAdapter: 1,
      optimizationAdapter: 1,
      evidenceDocumentAdapter: 5,
    });
    expect(adapted.spendAdapter[0]).toMatchObject({
      adapter_name: 'contract_consumption_adapter',
      adapter_version: 'source-contract-depth-v1',
    });
    expect(adapted.qualityGate.richness).toMatchObject({
      contractsWithTwelveSpendMonths: 1,
      contractsWithDocuments: 1,
      contractsWithScope: 1,
      contractsWithOpportunities: 1,
      contractsWithChangeOrders: 1,
      contractsWithPageText: 1,
      contractsWithRecurringChangeOrders: 1,
      managedServiceContractsWithSlaEvidence: 1,
    });
  });

  it('fails the adapter gate when richness is too thin for cutover', () => {
    const thin = validPackage();
    const adapted = adaptContractDepthPackage({
      ...thin,
      monthlySpend: thin.monthlySpend.slice(0, 11),
      evidenceManifest: thin.evidenceManifest.slice(0, 4),
      contractPageText: thin.contractPageText.slice(0, 4),
      optimizationOpportunities: [
        {
          ...thin.optimizationOpportunities[0],
          finance_confirmation_state: 'confirmed',
          evidence_rows: '',
        },
      ],
    });

    expect(adapted.qualityGate.status).toBe('FAIL');
    expect(adapted.qualityGate.failures).toEqual(
      expect.arrayContaining([
        'MER-TECH-AMS-001 must carry 12 monthly spend rows, found 11',
        'MER-TECH-AMS-001 must carry at least 5 evidence documents',
        'opportunity OPT-AMS-CREDITS-001 must remain not_confirmed',
        'opportunity OPT-AMS-CREDITS-001 missing evidence_rows',
      ]),
    );
  });
});
