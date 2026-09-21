const mockAnthropicStream = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockBuildV6ProgramInstanceForTenant = jest.fn();

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

// The two cases above assert what the route returns when no pack resolves,
// which is the whole of what it returns today. That left the route's v6Instance
// branch asserted-unreachable and tested by nothing: the packet contract it
// builds, the domain phrase it injects, and its no-Apex-fallback guard all
// stopped being proved anywhere. Whether that branch should exist at all is a
// product decision, filed as D-511 and not taken here — but an unreachable
// branch that is still in the tree must not also be an untested one, so the
// pack reader is mocked below and the branch's contract is proved again. This
// mirrors the mock the Source synthesis suite next door already carries.
//
// Note what is NOT claimed: this says nothing about whether the dataset's
// deletion was intended for THIS reader. `4a7ebcd85` deleted 43 dataset files
// and left the reader untouched; reading that as a deliberate retirement of the
// reader is an inference, and D-511 exists to have it decided rather than
// assumed.
jest.mock('@/lib/module-v6/demo-tenant-packs', () => {
  const actual = jest.requireActual('@/lib/module-v6/demo-tenant-packs');

  return {
    ...actual,
    // Default: behave exactly as the real reader does today — null for every
    // tenant, because the dataset root it resolves is not in the tree. The two
    // not-loaded cases above therefore keep testing the real current behavior,
    // and only the cases that opt in below see a pack.
    buildV6ProgramInstanceForTenant: mockBuildV6ProgramInstanceForTenant.mockImplementation(
      () => null,
    ),
  };
});

function v6PackFor(tenantKey: string) {
  const programInstances = jest.requireActual('@/lib/programs/program-instances');
  return {
    ...programInstances.APX_CDP_2026_INSTANCE,
    id: `${tenantKey}-v6-execution-sequence`,
    displayId: tenantKey === 'skyharbor-air' ? 'PRG-AIR-V6-2026' : 'PRG-IND-V6-2026',
    tenantSlug: tenantKey,
    tenantId: tenantKey,
    name:
      tenantKey === 'skyharbor-air'
        ? 'OCC Modernization execution sequence'
        : 'Corporate ERP and HCM controls modernization execution sequence',
  };
}

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

  // Restored from the two cases that became not-loaded assertions. Each keeps
  // the prompt guards that were dropped with them and re-homed nowhere: the
  // packet type the route must build, and — for the industrial tenant — that a
  // tenant with a pack of its own is never served the Apex fixture's id.
  it('builds the execution-sequence packet from the active tenant pack, not the Apex fixture', async () => {
    mockBuildV6ProgramInstanceForTenant.mockReturnValueOnce(
      v6PackFor('lakeshore-holdings'),
    );
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

    expect(res.status).toBe(200);
    expect(res.headers.get('x-abarva-moves-layer')).toBe('moves-current');
    await expect(res.text()).resolves.toBe('Moves V6 answer.');
    expect(mockAnthropicStream).toHaveBeenCalledTimes(1);
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain(
      'Corporate ERP and HCM controls modernization',
    );
    expect(streamArgs.messages[0].content).toContain('execution-sequence-packet');
    expect(streamArgs.messages[0].content).not.toContain('APX-CDP-2026');
  });

  it('injects the airline tenant domain phrase when its pack resolves', async () => {
    mockAnthropicStream.mockReturnValue(claudeTextStream('Airline Moves V6 answer.'));
    mockBuildV6ProgramInstanceForTenant.mockReturnValueOnce(
      v6PackFor('skyharbor-air'),
    );
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
    expect(res.headers.get('x-abarva-moves-layer')).toBe('moves-current');
    await expect(res.text()).resolves.toBe('Airline Moves V6 answer.');
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain('OCC Modernization');
    expect(streamArgs.messages[0].content).toContain('execution-sequence-packet');
    // The route picks the domain phrase off the tenant key, so this is the one
    // assertion that fails if the airline branch of that lookup is lost.
    expect(streamArgs.messages[0].content).toContain('IROPS');
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
