const mockAnthropicStream = jest.fn();
const mockGetActiveClientRow = jest.fn();

jest.mock('@/lib/integrations/ai-egress', () => ({
  preflightAnthropicDirectClient: jest.fn(() => ({
    ok: true,
    client: {
      messages: { stream: mockAnthropicStream },
    },
  })),
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: mockGetActiveClientRow,
}));

jest.mock('@/lib/agent/userContext', () => ({
  getUserContextPromptBlock: jest.fn().mockResolvedValue('USER CONTEXT'),
}));

jest.mock('@/lib/reasoning/synthesis-telemetry', () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: 'evt-1' })),
}));

describe('POST /api/source/synthesis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-apex',
      name: 'Retail Demo',
      industry_code: 'retail',
      key: 'apexretail',
    });
  });

  it('does not default non-Apex tenants to the Apex AMS fixture', async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-skyharbor',
      name: 'Airline Demo',
      industry_code: 'airline',
      key: 'skyharbor-air',
    });
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://test/api/source/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(404);
    expect(res.headers.get('x-abarva-v6-surface')).toBe('source');
    await expect(res.json()).resolves.toEqual({
      error: 'source_synthesis_not_available',
      detail: 'No V6 Source event is loaded for the active tenant.',
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });

  it('blocks explicit Apex Source event access for a different active tenant', async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-lakeshore',
      name: 'Industrial Demo',
      industry_code: 'industrial',
      key: 'lakeshore-industries',
    });
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://test/api/source/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: 'ams-vendor-consolidation-2026' }),
      }),
    );

    expect(res.status).toBe(403);
    expect(res.headers.get('x-abarva-v6-surface')).toBe('source');
    await expect(res.json()).resolves.toEqual({
      error: 'wrong_client',
      detail: 'Requested Source event does not belong to the active tenant.',
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });
});

export {};
