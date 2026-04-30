import {
  getTenantDataAdapter,
  TENANT_DATA_STUB,
} from '@/lib/knowledge/tenant-data';

const TENANT = 'apex-retail';

describe('TenantDataAdapter — TD-1 stub', () => {
  const adapter = getTenantDataAdapter();

  it('getTenantDataAdapter() returns the exported stub instance', () => {
    expect(adapter).toBe(TENANT_DATA_STUB);
  });

  it('listSegments returns []', async () => {
    await expect(adapter.listSegments(TENANT)).resolves.toEqual([]);
  });

  it('listRecords returns []', async () => {
    await expect(adapter.listRecords(TENANT, 'enterprise_profile')).resolves.toEqual([]);
    await expect(
      adapter.listRecords(TENANT, 'it_landscape', { limit: 10, recordKind: 'systems_inventory' }),
    ).resolves.toEqual([]);
  });

  it('getRecord returns null', async () => {
    await expect(
      adapter.getRecord(TENANT, 'it_landscape:sys:apex:sap-s4'),
    ).resolves.toBeNull();
  });

  it('listGraphNodes returns []', async () => {
    await expect(adapter.listGraphNodes(TENANT)).resolves.toEqual([]);
    await expect(adapter.listGraphNodes(TENANT, 'person')).resolves.toEqual([]);
  });

  it('listGraphEdgesForNode returns []', async () => {
    await expect(
      adapter.listGraphEdgesForNode(TENANT, 'person:apex:diana-lopez'),
    ).resolves.toEqual([]);
    await expect(
      adapter.listGraphEdgesForNode(TENANT, 'person:apex:diana-lopez', 'outgoing'),
    ).resolves.toEqual([]);
  });

  it('getGraphNeighborhood returns an empty neighborhood with depth honored', async () => {
    const neighborhood = await adapter.getGraphNeighborhood(
      TENANT,
      'person:apex:diana-lopez',
      { maxDepth: 2 },
    );
    expect(neighborhood).toEqual({
      rootId: 'person:apex:diana-lopez',
      nodes: [],
      edges: [],
      depth: 2,
    });
  });

  it('getGraphNeighborhood defaults depth to 0 when not specified', async () => {
    const neighborhood = await adapter.getGraphNeighborhood(
      TENANT,
      'enterprise:apex-retail',
    );
    expect(neighborhood.depth).toBe(0);
    expect(neighborhood.nodes).toEqual([]);
    expect(neighborhood.edges).toEqual([]);
  });

  it('pathBetween returns null', async () => {
    await expect(
      adapter.pathBetween(TENANT, 'kpi:apex:001', 'person:apex:diana-lopez'),
    ).resolves.toBeNull();
  });

  it('listContextChunks returns []', async () => {
    await expect(adapter.listContextChunks(TENANT)).resolves.toEqual([]);
    await expect(
      adapter.listContextChunks(TENANT, { embeddingStatus: 'pending' }),
    ).resolves.toEqual([]);
  });

  it('chunksByRecord returns []', async () => {
    await expect(
      adapter.chunksByRecord(TENANT, 'program_inventory:apex-cdp-2026'),
    ).resolves.toEqual([]);
  });

  it('chunksByKeyword returns []', async () => {
    await expect(
      adapter.chunksByKeyword(TENANT, ['customer', 'data', 'quality']),
    ).resolves.toEqual([]);
  });

  it('chunksByVector throws with a clear TD-9 message', async () => {
    await expect(adapter.chunksByVector(TENANT, [0.1, 0.2, 0.3])).rejects.toThrow(
      'Vector retrieval not yet enabled (TD-9 follow-on).',
    );
  });

  it('getEvidence returns null', async () => {
    await expect(
      adapter.getEvidence(TENANT, 'evidence_ledger:ev:apex:001'),
    ).resolves.toBeNull();
  });

  it('hasPersistedData returns false', async () => {
    await expect(adapter.hasPersistedData(TENANT)).resolves.toBe(false);
  });
});
