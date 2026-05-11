import { summarizeEnterpriseContextRows } from '../intelligence-read-model';
import type {
  EnterpriseContextQualityRow,
  EnterpriseContextRecordRow,
  EnterpriseContextSourceRow,
} from '../intelligence-read-model';

function record(overrides: Partial<EnterpriseContextRecordRow>): EnterpriseContextRecordRow {
  return {
    record_type: 'cmdb_applications_services',
    title: 'Epic Hyperspace',
    source_system: 'ServiceNow',
    owner: 'CMDB Stewardship',
    freshness_status: 'fresh',
    confidence: 0.88,
    payload: {},
    ...overrides,
  };
}

describe('enterprise context Intelligence read model', () => {
  it('summarizes internal context into CXO-readable cards and Sentinel facts', () => {
    const records: EnterpriseContextRecordRow[] = [
      record({ payload: { criticality: 'Tier 1' } }),
      record({ record_type: 'incidents', title: 'Queue latency', payload: { breach_sla: 'true' }, confidence: 0.81 }),
      record({ record_type: 'problems', title: 'Integration backlog', payload: {}, confidence: 0.82 }),
      record({ record_type: 'changes', title: 'Release window', payload: {}, confidence: 0.84 }),
      record({ record_type: 'vendors_contract_inventory', title: 'Epic contract', source_system: 'Legal CLM', owner: 'IT Sourcing', payload: {}, confidence: 0.83 }),
      record({ record_type: 'renewal_calendar', title: 'Epic renewal', source_system: 'Legal CLM', owner: 'IT Sourcing', payload: { renewal_risk: 'High', estimated_value_usd: '55200000' }, confidence: 0.83 }),
      record({ record_type: 'spend_baseline', title: 'Epic spend', source_system: 'Finance ERP', owner: 'Finance Operations', payload: { run_rate_usd: '17295996', category: 'Clinical Systems' }, confidence: 0.9 }),
      record({ record_type: 'policies_procedures', title: 'AI Use Policy', source_system: 'GRC', owner: 'GRC', payload: {}, confidence: 0.86 }),
      record({ record_type: 'risk_compliance_register', title: 'Model risk', source_system: 'GRC', owner: 'GRC', payload: {}, confidence: 0.8 }),
      record({ record_type: 'initiative_portfolio', title: 'Contact Center AI', source_system: 'Enterprise PMO', owner: 'Enterprise PMO', payload: {}, confidence: 0.8 }),
      record({ record_type: 'data_domains_stewardship', title: 'Contact Center', source_system: 'Data catalog', owner: 'Data Governance', payload: {}, confidence: 0.82 }),
      record({ record_type: 'org_decision_rights', title: 'Anita', source_system: 'Workday', owner: 'People Operations', payload: {}, confidence: 0.92 }),
    ];
    const sources: EnterpriseContextSourceRow[] = [
      { source_system: 'ServiceNow', display_name: 'ServiceNow', system_of_record: true, source_owner: 'ITSM', last_synced_at: '2026-05-11T00:00:00Z' },
      { source_system: 'Finance ERP', display_name: 'Finance ERP', system_of_record: true, source_owner: 'Finance', last_synced_at: '2026-05-11T00:00:00Z' },
    ];
    const qualityRows: EnterpriseContextQualityRow[] = [
      { issue_type: 'low_confidence', severity: 'medium', status: 'open', source_file: 'spend.csv', owner: 'Finance Operations' },
    ];

    const overview = summarizeEnterpriseContextRows({
      tenantKey: 'meridian',
      tenantName: 'Meridian Health',
      counts: {
        sources: 2,
        records: records.length,
        facts: 100,
        relationships: 5,
        evidence: 12,
        qualityIssues: 1,
        stewardshipTasks: 1,
        chunkQueue: 12,
      },
      records,
      sources,
      qualityRows,
      evidenceRows: [{ evidence_usable: true }, { evidence_usable: false }],
    });

    expect(overview.recordTypeCounts.incidents).toBe(1);
    expect(overview.evidenceUsableCount).toBe(1);
    expect(overview.cards.map((card) => card.title)).toEqual(expect.arrayContaining([
      'Clinical platform reliability',
      'Contract renewal exposure',
      'Spend baseline confidence',
    ]));
    expect(overview.sentinelFacts.join('\n')).toContain('Enterprise Context: 12 records');
    expect(overview.sentinelFacts.join('\n')).toContain('Operational posture');
    expect(overview.sentinelFacts.join('\n')).toContain('$55.2M estimated renewal exposure');
  });
});
