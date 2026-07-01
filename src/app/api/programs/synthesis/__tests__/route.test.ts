const mockAnthropicStream = jest.fn();
const mockGetActiveClientRow = jest.fn();

jest.mock('@/lib/integrations/ai-egress', () => ({
  preflightAnthropicDirectClient: jest.fn(() => ({
    ok: true,
    client: {
      messages: { stream: mockAnthropicStream },
    },
  })),
  getAnthropicDirectClient: jest.fn(() => ({
    messages: { stream: mockAnthropicStream },
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

function claudeTextStream(text: string) {
  return (async function* stream() {
    yield {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text },
    };
  })();
}

describe('POST /api/programs/synthesis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnthropicStream.mockReturnValue(claudeTextStream('Moves V6 answer.'));
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-apex',
      name: 'Retail Demo',
      industry_code: 'retail',
      key: 'apexretail',
    });
  });

  it('does not fall back to the Apex CDP fixture for unknown live program ids', async () => {
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://test/api/programs/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: 'f9fc92e8-3bbc-45d2-8e78-59671bb4feb3' }),
      }),
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: 'program_synthesis_not_available',
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });

  it('uses the active Industrial Demo V6 Moves pack instead of defaulting to the Apex CDP fixture', async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-lakeshore',
      name: 'Industrial Demo',
      industry_code: 'industrial',
      key: 'lakeshore-industries',
    });
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://test/api/programs/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('x-abarva-v6-surface')).toBe('moves');
    await expect(res.text()).resolves.toBe('Moves V6 answer.');
    expect(mockAnthropicStream).toHaveBeenCalledTimes(1);
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain('Kyriba global cash and payments rollout');
    expect(streamArgs.messages[0].content).toContain('execution-sequence-packet');
    expect(streamArgs.messages[0].content).not.toContain('APX-CDP-2026');
  });

  it('uses the active Airline Demo V6 Moves pack for airline programs', async () => {
    mockAnthropicStream.mockReturnValue(claudeTextStream('Airline Moves V6 answer.'));
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-skyharbor',
      name: 'Airline Demo',
      industry_code: 'airline',
      key: 'skyharbor-air',
    });
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://test/api/programs/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('x-abarva-v6-surface')).toBe('moves');
    await expect(res.text()).resolves.toBe('Airline Moves V6 answer.');
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain('OCC Modernization');
    expect(streamArgs.messages[0].content).toContain('execution-sequence-packet');
  });

  it('blocks explicit Apex program access for a different active tenant', async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-lakeshore',
      name: 'Industrial Demo',
      industry_code: 'industrial',
      key: 'lakeshore-industries',
    });
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://test/api/programs/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: 'APX-CDP-2026' }),
      }),
    );

    expect(res.status).toBe(403);
    expect(res.headers.get('x-abarva-v6-surface')).toBe('moves');
    await expect(res.json()).resolves.toEqual({
      error: 'wrong_client',
      detail: 'Requested Moves program does not belong to the active tenant.',
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });
});

export {};
