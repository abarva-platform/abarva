const queryMock = jest.fn();

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: (...args: unknown[]) => queryMock(...args),
  },
}));

import { loadV7TowerProjection } from '@/lib/tower/v7-tower-projection';

describe('V7 Tower projection', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('maps Lakeshore V7 records into visible Tower initiatives, vendors, and metrics', async () => {
    queryMock.mockResolvedValue([
      {
        dimension_key: 'V7_09_programs_initiatives_business_priorities',
        record_key: 'LAK-INIT-001',
        record_name: 'Kyriba global cash and payments rollout',
        source_file: 'lakeshore_programs.csv',
        source_row_number: 2,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'Programs and initiatives',
        source_validation_status: 'validated',
        values_json: {
          program_id: 'LAK-INIT-001',
          program_name: 'Kyriba global cash and payments rollout',
          business_function: 'Treasury',
          business_owner: 'Treasurer',
          phase: 'build',
          budget_usd: 42_000_000,
          expected_value_usd: 86_000_000,
          realized_value_usd: 18_900_000,
          value_basis: 'cash visibility and payment control',
        },
      },
      {
        dimension_key: 'V7_07_vendors_contracts',
        record_key: 'LAK-VEN-002',
        record_name: 'SAP finance platform renewal',
        source_file: 'lakeshore_vendors.csv',
        source_row_number: 3,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'Vendors and contracts',
        source_validation_status: 'validated',
        values_json: {
          vendor_id: 'LAK-VEN-002',
          vendor_name: 'SAP',
          contract_id: 'SAP-2026',
          service: 'finance_treasury',
          annual_cost_usd: 12_500_000,
          renewal_date: '2026-08-07',
        },
      },
      {
        dimension_key: 'V7_08_spend_value',
        record_key: 'LAK-SPEND-003',
        record_name: 'Treasury spend row',
        source_file: 'lakeshore_spend_value.csv',
        source_row_number: 4,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'Spend and value',
        source_validation_status: 'validated',
        values_json: {
          amount_usd: 7_500_000,
          amount_type: 'run_rate',
          spend_category: 'software',
          service_tower_or_function: 'Corporate Treasury',
          run_change: 'run',
          capex_opex: 'opex',
          spend_owner: 'Treasurer',
          vendor_ref: 'Kyriba',
          system_ref: 'Kyriba Treasury',
          program_ref: 'modernization portfolio',
          value_linkage: 'cash visibility and payment control',
          finance_validation_status: 'pending',
        },
      },
      {
        dimension_key: 'SA08_AI_Benefits_Realization_Usage_Ledger',
        record_key: 'LAK-SA08-004',
        record_name: 'M365 Copilot benefits posture',
        source_file: 'SA08_AI_Benefits_Realization_Usage_Ledger.csv',
        source_row_number: 5,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'AI benefits realization usage ledger',
        source_validation_status: 'validated',
        values_json: {
          ai_program_id: 'LAK-AI-004',
          program_name: 'M365 Copilot adoption',
          tool_name: 'Microsoft 365 Copilot',
          business_function: 'Shared Services',
          funded_spend_usd: 3_000_000,
          promised_value_usd: 12_000_000,
          usage_actual: 420,
          kpi_actual: 'Partial movement observed',
          finance_validated_value_usd: 2_400_000,
          finance_validation_status: 'finance_validated_partial',
          value_claim_status: 'usage_measured',
          tower_claim_allowed: 'partial',
          realized_value_allowed: 'false',
          decision_action: 'scale',
          caveat: 'Partial validation only; not realized value.',
        },
      },
    ]);

    const projection = await loadV7TowerProjection({
      tenantKeyCandidates: ['lakeshore-holdings', 'Lakeshore Holdings'],
    });

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('lower(r.dimension_key) = any($2::text[])'),
      expect.arrayContaining(['lakeshore-holdings']),
      { missingTable: 'empty' },
    );
    expect(queryMock.mock.calls[0][0]).toContain('join intelligence_v7.tenant_pack_runs run');
    expect(queryMock.mock.calls[0][0]).toContain('join intelligence_v7.active_tenant_contract_versions active');
    expect(queryMock.mock.calls[0][0]).not.toContain('join intelligence_v7.current_tenant_pack_runs run');
    expect(queryMock.mock.calls[0][0]).toContain("coalesce(r.fact_status, 'active') = 'active'");
    expect(queryMock.mock.calls[0][0]).not.toContain('latest_run');
    expect(queryMock.mock.calls[0][0]).toContain('r.source_as_of_date as as_of_date');
    expect(queryMock.mock.calls[0][0]).toContain('null::date as period_end');
    expect(queryMock.mock.calls[0][0]).not.toContain('r.as_of_date');
    expect(queryMock.mock.calls[0][0]).not.toContain('r.period_end');
    expect(projection.source).toBe('intelligence_v7');
    expect(projection.initiatives).toHaveLength(3);
    expect(projection.initiatives[0]).toMatchObject({
      name: 'Kyriba global cash and payments rollout',
      committedAnnualUsd: 42_000_000,
      committedTotalUsd: 86_000_000,
      measuredValueUsd: null,
      ownerFunction: 'Treasury',
    });
    expect(projection.initiatives.find((row) => row.initiativeId === 'LAK-AI-004')).toMatchObject({
      name: 'M365 Copilot adoption',
      committedAnnualUsd: 3_000_000,
      committedTotalUsd: 12_000_000,
      measuredValueUsd: null,
      loadedViaTemplate: 'sa08_ai_benefits_realization_usage_ledger',
      statusSummary: expect.stringContaining('claim gate partial'),
    });
    expect(projection.initiatives.find((row) => row.initiativeId === 'LAK-SPEND-003')).toMatchObject({
      name: 'modernization portfolio · Corporate Treasury · Kyriba',
      committedAnnualUsd: 7_500_000,
      ownerFunction: 'Corporate Treasury',
      loadedViaTemplate: 'intelligence_v7_spend_value',
    });
    expect(projection.vendors[0]).toMatchObject({
      vendorName: 'SAP',
      contractValueUsd: 12_500_000,
      renewalDate: '2026-08-07',
    });
    expect(projection.vendors.some((row) => row.vendorName === 'Kyriba' && row.contractValueUsd === 7_500_000)).toBe(true);
    expect(projection.metricPackets.find((packet) => packet.measureKey === 'initiative_budget_fy26')?.displayValue).toBe('$52.5M');
    expect(projection.metricPackets.find((packet) => packet.measureKey === 'measured_value_ytd')?.displayValue).toBe('not loaded');
    expect(projection.metricPackets.find((packet) => packet.measureKey === 'partial_finance_validated_value_ytd')?.displayValue).toBe('$2.4M');
  });
});
