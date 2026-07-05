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
    ]);

    const projection = await loadV7TowerProjection({
      tenantKeyCandidates: ['lakeshore-holdings', 'Lakeshore Holdings'],
    });

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('lower(r.dimension_key) = any($2::text[])'),
      expect.arrayContaining(['lakeshore-industries']),
      { missingTable: 'empty' },
    );
    expect(queryMock.mock.calls[0][0]).not.toContain('latest_run');
    expect(projection.source).toBe('intelligence_v7');
    expect(projection.initiatives).toHaveLength(2);
    expect(projection.initiatives[0]).toMatchObject({
      name: 'Kyriba global cash and payments rollout',
      committedAnnualUsd: 42_000_000,
      committedTotalUsd: 86_000_000,
      measuredValueUsd: 18_900_000,
      ownerFunction: 'Treasury',
    });
    expect(projection.initiatives[1]).toMatchObject({
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
    expect(projection.metricPackets.find((packet) => packet.measureKey === 'initiative_budget_fy26')?.displayValue).toBe('$49.5M');
    expect(projection.metricPackets.find((packet) => packet.measureKey === 'measured_value_ytd')?.displayValue).toBe('$18.9M');
  });
});
