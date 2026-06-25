import {
  projectAiControlRowsToTowerReadModel,
  projectContextRecordsToTowerReadModel,
} from '@/lib/tower/tower-semantic-projection';

describe('tower semantic projection', () => {
  it('projects V4 IT initiatives and vendor rows into the Tower read model', () => {
    const projected = projectContextRecordsToTowerReadModel({
      initiativeRows: [
        {
          id: 'record-init-1',
          canonical_record_id: 'lakeshore:initiatives:LAK-INIT-001',
          record_type: 'initiatives_portfolio',
          record_subtype: 'initiatives-portfolio',
          title: 'Kyriba global cash and payments rollout',
          source_record_id: 'LAK-INIT-001',
          source_row_number: 2,
          payload: {
            initiative_id: 'LAK-INIT-001',
            initiative_name: 'Kyriba global cash and payments rollout',
            business_area: 'Treasury',
            owner_role: 'Treasurer',
            stage: 'build',
            budget_usd: '42000000',
            promised_benefit_usd: '86000000',
            dependency: 'bank connectivity and SAP mapping',
            risk_status: 'critical',
            move_relevance: 'Kyriba rollout',
          },
        },
      ],
      vendorRows: [
        {
          id: 'record-vendor-1',
          canonical_record_id: 'lakeshore:vendors:LAK-VEN-001',
          record_type: 'vendors_contracts_licenses',
          record_subtype: 'vendors-contracts-licenses',
          title: 'Kyriba',
          source_record_id: 'LAK-VEN-001',
          source_row_number: 2,
          payload: {
            vendor_id: 'LAK-VEN-001',
            vendor_name: 'Kyriba',
            annual_contract_value_usd: '950000',
            renewal_date: '2026-07-06',
            commercial_risk: 'implementation spend before control evidence gate',
          },
        },
      ],
    });

    expect(projected.source).toBe('enterprise_context_records');
    expect(projected.initiatives).toHaveLength(1);
    expect(projected.initiatives[0]).toMatchObject({
      displayId: 'LAK-INIT-001',
      name: 'Kyriba global cash and payments rollout',
      primaryCategoryName: 'Treasury',
      committedAnnualUsd: 42_000_000,
      measuredValueUsd: null,
      statusFlag: 'stalled',
      loadedViaTemplate: 'enterprise_context_initiatives_portfolio',
    });
    expect(projected.vendors).toHaveLength(1);
    expect(projected.vendors[0]).toMatchObject({
      vendorName: 'Kyriba',
      contractValueUsd: 950_000,
      renewalDate: '2026-07-06',
      initiativeDisplayId: 'LAK-INIT-001',
    });
  });

  it('projects AI-control rows when legacy ai_initiatives is empty', () => {
    const projected = projectAiControlRowsToTowerReadModel({
      initiativeRows: [
        {
          id: 'ai-control-init-1',
          initiative_key: 'TWR-001',
          initiative_name: 'Close automation',
          category: 'Finance',
          stage: 'pilot',
          business_owner_role: 'Controller',
          executive_sponsor_role: 'CFO',
          promised_benefit: 'Reduce manual close effort',
          status_flag: 'review_required',
          payload: {},
        },
      ],
      benefitRows: [
        {
          initiative_key: 'TWR-001',
          promised_annual_value_usd: '46000000',
          realized_annual_value_usd: '12000000',
          readiness_state: 'measured',
          evidence_state: 'usable',
        },
      ],
      spendRows: [
        {
          id: 'spend-1',
          initiative_key: 'TWR-001',
          vendor: 'BlackLine',
          product_or_service: 'Close automation',
          annualized_spend_usd: '2400000',
          renewal_date: '2026-09-08',
          evidence_state: 'usable',
        },
      ],
      riskRows: [
        {
          initiative_key: 'TWR-001',
          dimension: 'finance_control',
          severity: 'high',
          status: 'open',
          risk_description: 'GL reconciliation lineage remains incomplete',
          owner_role: 'Controller',
          governance_gate: 'partial',
        },
      ],
    });

    expect(projected.source).toBe('ai_control_tower');
    expect(projected.initiatives[0]).toMatchObject({
      displayId: 'TWR-001',
      name: 'Close automation',
      committedAnnualUsd: 2_400_000,
      measuredValueUsd: 12_000_000,
      statusFlag: 'value_lag',
      confidenceLevel: 'HIGH',
    });
    expect(projected.vendors[0]).toMatchObject({
      vendorName: 'BlackLine',
      initiativeDisplayId: 'TWR-001',
      contractValueUsd: 2_400_000,
    });
  });
});
