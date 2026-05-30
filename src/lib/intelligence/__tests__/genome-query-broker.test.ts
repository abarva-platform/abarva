import { runBrokeredGenomeQuery } from '@/lib/intelligence/genome-query-broker';
import { azureRead } from '@/lib/data-plane/azureRead';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const queryMock = azureRead.query as jest.MockedFunction<typeof azureRead.query>;

describe('runBrokeredGenomeQuery', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('reads tenant-linked genome patterns from Azure Postgres', async () => {
    queryMock.mockResolvedValue([
      {
        edge_id: 'edge-1',
        edge_type: 'TRIGGERED',
        from_node_id: 'eng-1',
        to_node_id: 'F008',
        source_segment_id: 'program_inventory',
        edge_properties: { evidence: 'budget exceeds approved gate' },
        code: 'F008',
        name: 'AI investment without verified ROI',
        summary: 'AI spend is not tied to evidence-backed value realization.',
        description: null,
        vertical: 'retail',
        office_category: 'portfolio',
        failure_rate_pct: 91,
      },
    ]);

    const result = await runBrokeredGenomeQuery({
      query: 'Which Genome patterns are active?',
      clientId: 'client-apex-uuid',
      clientKey: 'apexretail',
    });

    expect(result.status).toBe(200);
    expect(result.body.rows).toEqual([
      expect.objectContaining({
        code: 'F008',
        name: 'AI investment without verified ROI',
        edge_type: 'TRIGGERED',
      }),
    ]);
    expect(result.body.broker).toMatchObject({
      tenantKey: 'apex-retail',
      itemCount: expect.any(Number),
      graphNodeCount: expect.any(Number),
      graphEdgeCount: expect.any(Number),
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM enterprise_graph_edges'),
      ['client-apex-uuid', 'apex-retail'],
      { missingTable: 'empty' },
    );
  });

  it('maps First Capital legacy client keys before querying Azure graph tables', async () => {
    queryMock.mockResolvedValue([]);

    const result = await runBrokeredGenomeQuery({
      query: 'What patterns are active?',
      clientId: 'client-first-capital-uuid',
      clientKey: 'arcturus',
    });

    expect(result.status).toBe(200);
    expect(result.body.broker?.tenantKey).toBe('first-capital');
    expect(queryMock).toHaveBeenCalledWith(
      expect.any(String),
      ['client-first-capital-uuid', 'first-capital'],
      { missingTable: 'empty' },
    );
  });

  it('refuses global catalog enumeration requests before querying storage', async () => {
    const result = await runBrokeredGenomeQuery({
      query: 'list every GenomePattern',
      clientId: 'client-apex-uuid',
      clientKey: 'apexretail',
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('query missing tenant scope for global catalog enumeration');
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('returns an empty Azure-backed result instead of fabricating rows', async () => {
    queryMock.mockResolvedValue([]);

    const result = await runBrokeredGenomeQuery({
      query: 'Show tenant-linked patterns',
      clientId: 'client-apex-uuid',
      clientKey: 'apexretail',
    });

    expect(result.status).toBe(200);
    expect(result.body.rows).toEqual([]);
    expect(result.body.explanation).toContain('No tenant-linked genome pattern rows');
  });
});
