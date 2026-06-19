import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';

import { getEnterpriseContextOverviewForTenant, summarizeEnterpriseContextRows } from '../intelligence-read-model';
import type {
  EnterpriseContextQualityRow,
  EnterpriseContextRecordRow,
  EnterpriseContextSourceRow,
} from '../intelligence-read-model';

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const mockGetAzureReadFluentClient = jest.mocked(getAzureReadFluentClient);

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
  afterEach(() => {
    jest.clearAllMocks();
  });

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
      'Platform and service reliability',
      'Contract renewal exposure',
      'Spend baseline confidence',
    ]));
    expect(overview.sentinelFacts.join('\n')).toContain('Enterprise Context: 12 records');
    expect(overview.sentinelFacts.join('\n')).toContain('Operational posture');
    expect(overview.sentinelFacts.join('\n')).toContain('$55.2M estimated renewal exposure');
  });

  it('loads overview tables sequentially to avoid session-mode pool bursts', async () => {
    let activeQueries = 0;
    let maxActiveQueries = 0;
    const queryOrder: string[] = [];
    const countByTable: Record<string, number> = {
      enterprise_context_sources: 1,
      enterprise_context_records: 1,
      enterprise_context_facts: 2,
      enterprise_context_relationships: 3,
      enterprise_context_evidence: 1,
      enterprise_context_quality_issues: 1,
      enterprise_context_stewardship_tasks: 1,
      enterprise_context_chunk_queue: 1,
    };
    const rowsByTable: Record<string, unknown[]> = {
      enterprise_context_records: [record({ payload: { criticality: 'Tier 1' } })],
      enterprise_context_sources: [
        { source_system: 'ServiceNow', display_name: 'ServiceNow', system_of_record: true, source_owner: 'ITSM', last_synced_at: '2026-05-11T00:00:00Z' },
      ],
      enterprise_context_quality_issues: [
        { issue_type: 'low_confidence', severity: 'medium', status: 'open', source_file: 'spend.csv', owner: 'Finance Operations' },
      ],
      enterprise_context_evidence: [{ evidence_usable: true }],
    };

    mockGetAzureReadFluentClient.mockReturnValue({
      from: (table: string) => ({
        select: (_columns: string, options?: { count?: 'exact'; head?: boolean }) => ({
          eq: () => ({
            range: () => runQuery(table, options),
            then: (onfulfilled: (value: unknown) => unknown, onrejected?: (error: unknown) => unknown) =>
              runQuery(table, options).then(onfulfilled, onrejected),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getAzureReadFluentClient>);

    const overview = await getEnterpriseContextOverviewForTenant('meridian-health', 'Meridian Health');

    expect(overview?.counts.records).toBe(1);
    expect(maxActiveQueries).toBe(1);
    expect(queryOrder).toEqual([
      'enterprise_context_sources:count',
      'enterprise_context_records:count',
      'enterprise_context_facts:count',
      'enterprise_context_relationships:count',
      'enterprise_context_evidence:count',
      'enterprise_context_quality_issues:count',
      'enterprise_context_stewardship_tasks:count',
      'enterprise_context_chunk_queue:count',
      'enterprise_context_records:rows',
      'enterprise_context_sources:rows',
      'enterprise_context_quality_issues:rows',
      'enterprise_context_evidence:rows',
      'context_insights:rows',
    ]);

    async function runQuery(table: string, options?: { count?: 'exact'; head?: boolean }) {
      activeQueries += 1;
      maxActiveQueries = Math.max(maxActiveQueries, activeQueries);
      const isCount = options?.head === true;
      queryOrder.push(`${table}:${isCount ? 'count' : 'rows'}`);
      await new Promise((resolve) => setTimeout(resolve, 0));
      activeQueries -= 1;
      if (isCount) return { data: null, error: null, count: countByTable[table] ?? 0 };
      return { data: rowsByTable[table] ?? [], error: null, count: null };
    }
  });
});
