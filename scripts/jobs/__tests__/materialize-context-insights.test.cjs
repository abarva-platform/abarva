const {
  RULE_IDS,
  deriveInsightsFromRows,
  formatUsd,
} = require('../materialize-context-insights.cjs');

function record(id, recordType, title, payload) {
  return {
    id,
    client_id: 'client-1',
    tenant_key: 'lakeshore',
    canonical_record_id: `lakeshore:${recordType}:${id}`,
    record_type: recordType,
    title,
    source_file: `${recordType}.csv`,
    source_row_number: 2,
    confidence: 0.86,
    freshness_status: 'fresh',
    payload,
  };
}

function factsByRecord(records) {
  return new Map(records.map((row) => [
    row.id,
    Object.entries(row.payload).map(([key, value], index) => ({
      id: `${row.id}-fact-${index + 1}`,
      record_id: row.id,
      fact_key: key,
      fact_text: `${key}: ${value}`,
    })),
  ]));
}

describe('materialize-context-insights deriveInsightsFromRows', () => {
  it('fires deterministic cross-dimension rules with fact and record citations', () => {
    const records = [
      record('vendor-1', 'vendors_contracts_licenses', 'Kyriba', {
        vendor_name: 'Kyriba',
        category: 'Treasury management',
        annual_contract_value_usd: '4200000',
        renewal_date: '2026-09-30',
        commercial_risk: 'High - pricing benchmark not complete',
      }),
      record('initiative-1', 'initiatives_portfolio', 'Treasury transformation', {
        initiative_name: 'Treasury transformation',
        budget_usd: '12000000',
        promised_benefit_usd: '18000000',
        target_date: '2026-12-31',
        risk_status: 'High',
      }),
      record('app-1', 'applications_systems', 'Legacy Treasury Workbench', {
        application_name: 'Legacy Treasury Workbench',
        criticality: 'Tier 1',
        platform_type: 'Custom legacy',
        annual_run_cost_usd: '8400000',
        integration_count: '36',
        modernization_state: 'Legacy modernization required',
      }),
      record('data-1', 'data_analytics_estate', 'Cash Position Data Mart', {
        data_asset_name: 'Cash Position Data Mart',
        freshness: 'Weekly batch',
        quality_score: '67',
        semantic_layer_status: 'Missing',
      }),
      record('ai-1', 'ai_automation_footprint', 'Treasury forecast assistant', {
        ai_asset_name: 'Treasury forecast assistant',
        stage: 'Pilot',
        risk_tier: 'High',
        evidence_status: 'Review required',
        next_gate: 'CFO approval pending',
      }),
      record('ops-1', 'operations_service_management', 'Cash reconciliation breaks', {
        service_or_process: 'Cash reconciliation breaks',
        monthly_volume: '42000',
        mttr_hours: '19',
        backlog_count: '780',
        automation_candidate: 'Yes',
      }),
    ];

    const insights = deriveInsightsFromRows({
      tenantKey: 'lakeshore',
      clientId: 'client-1',
      records,
      factsByRecord: factsByRecord(records),
    });

    expect(insights).toHaveLength(6);
    expect(new Set(insights.map((row) => row.rule_id))).toEqual(new Set(RULE_IDS));
    expect(insights.every((row) => row.derived_from_record_ids.length > 0)).toBe(true);
    expect(insights.every((row) => row.derived_from_fact_ids.length > 0)).toBe(true);
    expect(insights.find((row) => row.rule_id === 'renewal-window-no-benchmark')?.headline).toContain('Kyriba renewal');
    expect(insights.find((row) => row.rule_id === 'critical-platform-drag')?.materiality).toBe('high');
  });

  it('formats executive-scale dollars compactly', () => {
    expect(formatUsd(4200000)).toBe('$4.2M');
    expect(formatUsd(2000000000)).toBe('$2B');
  });
});
