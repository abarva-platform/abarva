import { projectContractDepthPackage } from '../projection';

describe('projectContractDepthPackage', () => {
  it('projects dense source files into Source read-model rows without upgrading synthetic values', () => {
    const projection = projectContractDepthPackage({
      contracts: [
        {
          tenant_key: 'meridian-health',
          dataset_version: 'contract-depth-v1',
          contract_id: 'MER-TECH-AMS-001',
          vendor_ref: 'VEN-AMS',
          vendor_name: 'Managed Services Vendor',
          contract_name: 'Application Managed Services SOW',
          category: 'Managed Services',
          archetype: 'application_managed_services',
          annual_value_usd: '7600000',
          committed_annual_spend_usd: '7400000',
          actual_annual_spend_usd: '7780000',
          end_date: '2026-09-30',
          notice_period_days: '90',
          auto_renew: 'true',
          benchmarking_clause: 'present',
          termination_rights: 'termination for convenience with transition assistance fees',
          business_owner: 'Chief Clinical Operations Officer',
          source_confidence: '0.93',
        },
      ],
      applicationScope: [
        {
          tenant_key: 'meridian-health',
          contract_id: 'MER-TECH-AMS-001',
          vendor_ref: 'VEN-AMS',
          vendor_name: 'Managed Services Vendor',
          application_ref: 'APP-001',
          application_name: 'Clinical Integration Hub',
          business_function: 'Clinical Operations',
          criticality: 'Tier 1',
          hosting_model: 'Hybrid',
          relationship_method: 'explicit_sow_scope',
          relationship_confidence: '0.94',
        },
      ],
      monthlySpend: [
        {
          tenant_key: 'meridian-health',
          contract_id: 'MER-TECH-AMS-001',
          vendor_ref: 'VEN-AMS',
          vendor_name: 'Managed Services Vendor',
          actual_spend_usd: '650000',
          committed_base_amount_usd: '616666.67',
        },
      ],
      slaPerformance: [
        {
          tenant_key: 'meridian-health',
          contract_id: 'MER-TECH-AMS-001',
          vendor_ref: 'VEN-AMS',
          vendor_name: 'Managed Services Vendor',
          breach_state: 'breached',
          credit_owed_usd: '12333.33',
          credit_recovered_usd: '0',
        },
      ],
      ticketVolumetrics: [
        {
          tenant_key: 'meridian-health',
          contract_id: 'MER-TECH-AMS-001',
          severity: 'P1',
          ticket_count: '12',
        },
        {
          tenant_key: 'meridian-health',
          contract_id: 'MER-TECH-AMS-001',
          severity: 'P3',
          ticket_count: '88',
        },
      ],
      contractClauses: [
        {
          tenant_key: 'meridian-health',
          dataset_version: 'contract-depth-v1',
          extraction_id: 'clause-1',
          contract_id: 'MER-TECH-AMS-001',
          vendor_ref: 'VEN-AMS',
          vendor_name: 'Managed Services Vendor',
          concept_ref: 'service_credit',
          value_text: 'Monthly credit applies to missed SLA periods.',
          source_file_id: 'DOC-AMS-SLA',
          source_page: '1',
          confidence: '0.91',
          review_state: 'synthetic_demo_reviewed',
        },
      ],
      evidenceManifest: [
        {
          tenant_key: 'meridian-health',
          dataset_version: 'contract-depth-v1',
          source_file_id: 'DOC-AMS-SLA',
          contract_id: 'MER-TECH-AMS-001',
          vendor_ref: 'VEN-AMS',
          vendor_name: 'Managed Services Vendor',
          document_type: 'SLA or support terms',
          file_name: 'MER-TECH-AMS-001_SLA.docx',
          synthetic_policy: 'synthetic_demo_only_not_client_truth',
        },
      ],
      optimizationOpportunities: [
        {
          tenant_key: 'meridian-health',
          dataset_version: 'contract-depth-v1',
          opportunity_id: 'OPT-AMS-CREDITS-001',
          contract_id: 'MER-TECH-AMS-001',
          opportunity_type: 'recoverable_leakage',
          title: 'Claim unclaimed SLA service credits',
          annual_value_usd: '12333.33',
          finance_confirmation_state: 'not_confirmed',
          evidence_rows: 'sla:MER-TECH-AMS-001:2026-01',
        },
      ],
    });

    expect(projection.qualityGate).toEqual({
      status: 'PASS',
      failures: [],
      rowCounts: {
        contract360: 1,
        contractVendor360: 1,
        vendorContractPortfolio: 1,
        contractApplicationScope: 1,
        contractFinancialExposure: 1,
        contractOperationalPerformance: 1,
        contractPdfDocumentInventory: 1,
        contractPdfClauseExtractions: 1,
        optimizationOpportunities: 1,
      },
    });
    expect(projection.contract360[0]).toMatchObject({
      contract_id: 'MER-TECH-AMS-001',
      actual_annual_spend: '650000',
      service_credits_earned: '12333.33',
      service_credits_claimed: '0',
      operational_evidence_gap: 'false',
    });
    expect(projection.contractOperationalPerformance[0]).toMatchObject({
      cloud_sev1_sev2_incidents: '12',
      evidence_gap: 'false',
    });
    expect(projection.contractPdfDocumentInventory[0]).toMatchObject({
      loaded_policy: 'synthetic_demo_only_not_client_truth',
      mapping_status: 'mapped_to_register_contract',
    });
  });

  it('fails when an opportunity is presented as finance-confirmed', () => {
    const projection = projectContractDepthPackage({
      contracts: [],
      applicationScope: [],
      monthlySpend: [],
      slaPerformance: [],
      ticketVolumetrics: [],
      contractClauses: [],
      evidenceManifest: [],
      optimizationOpportunities: [
        {
          opportunity_id: 'OPT-1',
          contract_id: 'UNKNOWN',
          finance_confirmation_state: 'confirmed',
          evidence_rows: '',
        },
      ],
    });

    expect(projection.qualityGate.status).toBe('FAIL');
    expect(projection.qualityGate.failures).toEqual(
      expect.arrayContaining([
        'opportunity OPT-1 must remain not_confirmed',
        'opportunity OPT-1 missing evidence rows',
        'opportunity OPT-1 points to unknown contract',
      ]),
    );
  });
});
