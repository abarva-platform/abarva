const mockEqCalls: Array<[string, unknown]> = [];
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn((column: string, value: unknown) => {
  mockEqCalls.push([column, value]);
  return mockQuery;
});
const mockQuery = {
  select: jest.fn(() => mockQuery),
  eq: mockEq,
  maybeSingle: mockMaybeSingle,
};
const mockFrom = jest.fn(() => mockQuery);

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({ from: mockFrom }),
}));

describe('engagement tenant-scoped lookups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEqCalls.length = 0;
  });

  it('scopes graph id lookups by client_id', async () => {
    const { getEngagementByGraphIdForClient } = await import('../engagement');
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'engagement-1', graph_node_id: 'eng_apex', client_id: 'client_apex' },
      error: null,
    });

    const row = await getEngagementByGraphIdForClient('eng_apex', 'client_apex');

    expect(row?.id).toBe('engagement-1');
    expect(mockFrom).toHaveBeenCalledWith('engagements');
    expect(mockEqCalls).toEqual([
      ['graph_node_id', 'eng_apex'],
      ['client_id', 'client_apex'],
    ]);
  });

  it('scopes UUID fallback lookups by client_id', async () => {
    const { getEngagementByAnyIdForClient } = await import('../engagement');
    const engagementId = '892a57af-1111-4222-8333-123456789abc';
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { id: engagementId, graph_node_id: 'eng_meridian', client_id: 'client_meridian' },
        error: null,
      });

    const row = await getEngagementByAnyIdForClient(engagementId, 'client_meridian');

    expect(row?.id).toBe(engagementId);
    expect(mockFrom).toHaveBeenCalledTimes(2);
    expect(mockEqCalls).toEqual([
      ['graph_node_id', engagementId],
      ['client_id', 'client_meridian'],
      ['id', engagementId],
      ['client_id', 'client_meridian'],
    ]);
  });

  it('does not run an unscoped UUID lookup for non-UUID graph misses', async () => {
    const { getEngagementByAnyIdForClient } = await import('../engagement');
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const row = await getEngagementByAnyIdForClient('eng_missing', 'client_apex');

    expect(row).toBeNull();
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockEqCalls).toEqual([
      ['graph_node_id', 'eng_missing'],
      ['client_id', 'client_apex'],
    ]);
  });
});
