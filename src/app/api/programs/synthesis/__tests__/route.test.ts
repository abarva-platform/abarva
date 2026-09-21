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

  /**
   * These two cases expected 200 from a V6 Moves pack and now assert 404,
   * because the packs they read were retired on purpose.
   *
   * `buildV6ProgramInstanceForTenant` resolves a dataset root from
   * TENANT_DATASET_BY_KEY, whose only two entries are
   * `skyharbor-air-synthetic-v6` and `lakeshore-holdings-synthetic-v6`.
   * Neither directory is in the repository: both were deleted by
   * `4a7ebcd85` — "Establish canonical tenant input standard" (#4767) — which
   * replaced the synthetic V6 packs with the canonical tenant input standard.
   *
   * So the 404 is the route being honest: "No V6 Moves program is loaded for
   * the active tenant" is exactly true. This is an expectation refresh
   * against a deliberate product change, NOT a deleted control.
   *
   * Recorded so the next reader does not re-derive it: because both dataset
   * roots are gone, `buildV6ProgramInstanceForTenant` cannot return non-null
   * for any tenant it knows, and the route's v6Instance branch is currently
   * unreachable. Whether that branch should be removed is a product decision
   * and is not taken here.
   */
  it('reports no V6 Moves pack for Lakeshore Holdings, whose synthetic pack was retired', async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-lakeshore',
      name: 'Lakeshore Holdings',
      industry_code: 'industrial',
      key: 'lakeshore-holdings',
    });
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://test/api/programs/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(404);
    expect(res.headers.get('x-abarva-moves-layer')).toBe('moves-current');
    await expect(res.json()).resolves.toEqual({
      error: 'program_synthesis_not_available',
      detail: 'No V6 Moves program is loaded for the active tenant.',
    });
    // The half that still matters from the original case: a tenant with no
    // pack of its own must not be served the Apex fixture instead.
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });

  it('reports no V6 Moves pack for the airline tenant, and does not fall back to Apex', async () => {
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

    expect(res.status).toBe(404);
    expect(res.headers.get('x-abarva-moves-layer')).toBe('moves-current');
    await expect(res.json()).resolves.toEqual({
      error: 'program_synthesis_not_available',
      detail: 'No V6 Moves program is loaded for the active tenant.',
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });

  it('blocks explicit Apex program access for a different active tenant', async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: 'client-lakeshore',
      name: 'Lakeshore Holdings',
      industry_code: 'industrial',
      key: 'lakeshore-holdings',
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
    expect(res.headers.get('x-abarva-moves-layer')).toBe('moves-current');
    await expect(res.json()).resolves.toEqual({
      error: 'wrong_client',
      detail: 'Requested Moves program does not belong to the active tenant.',
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });
});

export {};
