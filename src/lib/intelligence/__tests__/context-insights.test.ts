import { listContextInsights, normalizeContextInsightLimit } from '../context-insights';
import type { AzureReadClient } from '@/lib/data-plane/azureRead';

function fakeDb(rows: Array<Record<string, unknown>>, seen: Array<{ sql: string; params: readonly unknown[] }>): AzureReadClient {
  return {
    query: async (sql: string, params: readonly unknown[] = []) => {
      seen.push({ sql, params });
      return rows as never[];
    },
    select: jest.fn(),
    maybeSingle: jest.fn(),
    count: jest.fn(),
    withSession: jest.fn(),
  } as unknown as AzureReadClient;
}

describe('context insights read model', () => {
  it('normalizes limits for the public API route', () => {
    expect(normalizeContextInsightLimit(undefined)).toBe(50);
    expect(normalizeContextInsightLimit(0)).toBe(1);
    expect(normalizeContextInsightLimit(500)).toBe(100);
    expect(normalizeContextInsightLimit(12.9)).toBe(12);
  });

  it('pins reads to one tenant and preserves citation ids', async () => {
    const seen: Array<{ sql: string; params: readonly unknown[] }> = [];
    const rows = [{
      id: 'ins-1',
      tenant_key: 'meridian-health',
      headline: 'Claims data foundation is blocking automation',
      so_what: 'Prior auth cannot be trusted without governed claims and EMR joins.',
      domain: 'Data quality',
      materiality: 'high',
      derived_from_record_ids: ['rec-1'],
      derived_from_fact_ids: ['fact-1', 'fact-2'],
      rule_id: 'data-foundation-readiness-gap',
      evidence: 'context facts',
      confidence: 'high',
      freshness_status: 'fresh',
      lifecycle_state: 'active',
      action: 'See the facts',
      entity_name: 'Unified clinical + claims lakehouse',
      entity_type: 'data_asset',
      insight_payload: { source: 'unit' },
      updated_at: '2026-06-18T09:24:41.000Z',
    }];

    const insights = await listContextInsights({
      tenantKey: 'meridian-health',
      domain: 'Data quality',
      materiality: 'high',
      limit: 10,
    }, fakeDb(rows, seen));

    expect(seen).toHaveLength(1);
    expect(seen[0].sql).toContain('FROM context_insights');
    expect(seen[0].sql).toContain('tenant_key = $1');
    expect(seen[0].sql).toContain("lifecycle_state <> 'superseded'");
    expect(seen[0].params).toEqual(['meridian-health', 'Data quality', 'high', 10]);
    expect(insights[0]).toMatchObject({
      tenantKey: 'meridian-health',
      headline: 'Claims data foundation is blocking automation',
      derivedFromRecordIds: ['rec-1'],
      derivedFromFactIds: ['fact-1', 'fact-2'],
      ruleId: 'data-foundation-readiness-gap',
    });
  });
});
