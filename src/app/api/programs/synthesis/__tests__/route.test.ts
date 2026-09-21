import { MODULE_V6_ANSWER_CONTRACT_VERSION } from '@/lib/agent/module-v6-answer-contract';

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

// T-517: this suite reached the REAL `buildV6ProgramInstanceForTenant`, which
// resolves a per-tenant dataset directory and reads CSV rows off disk. Those 43
// files were deleted on 2026-07-13 by commit 4a7ebcd85, and the builder was not
// changed with them, so it now returns null for every tenant and both 200 cases
// below became 404s. That is a product defect in its own right — the route
// serves 404 to these tenants in the deployed image too, because the Dockerfile
// copies `datasets/` straight from the repo tree — and it is filed separately
// rather than repaired here. What this suite exists to prove is the ROUTE's
// contract: tenant fencing, surface attribution, and not falling back to the
// Apex fixture. So the pack builder is mocked, exactly as the Source synthesis
// suite next door already mocks its twin, and the dataset's absence is asserted
// as its own case below instead of being left to break unrelated assertions.
jest.mock('@/lib/module-v6/demo-tenant-packs', () => {
  const actual = jest.requireActual('@/lib/module-v6/demo-tenant-packs');
  const programInstances = jest.requireActual('@/lib/programs/program-instances');
  const baseInstance = programInstances.APX_CDP_2026_INSTANCE;

  return {
    ...actual,
    buildV6ProgramInstanceForTenant: mockBuildV6ProgramInstanceForTenant.mockImplementation(
      (tenantKeyInput: string, requestedProgramId?: string | null) => {
        const tenantKey = actual.canonicalV6DemoTenantKey(tenantKeyInput);
        if (!['skyharbor-air', 'lakeshore-holdings'].includes(tenantKey)) {
          return null;
        }

        const programId = `${tenantKey}-v6-execution-sequence`;
        if (
          requestedProgramId &&
          ![programId, 'v6-execution-sequence'].includes(requestedProgramId)
        ) {
          return null;
        }

        return {
          ...baseInstance,
          id: programId,
          displayId:
            tenantKey === 'skyharbor-air' ? 'PRG-AIR-V6-2026' : 'PRG-IND-V6-2026',
          tenantSlug: tenantKey,
          tenantId: tenantKey,
          name:
            tenantKey === 'skyharbor-air'
              ? 'OCC Modernization execution sequence'
              : 'Corporate ERP and HCM controls modernization execution sequence',
        };
      },
    ),
  };
});

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

// T-517: this suite asserted a single surface-attribution header that the route
// has never emitted — it occurred nowhere in `src` outside these tests, at every
// commit that ever touched them, so the expectation was wrong the day it was
// written. Its name is deliberately not repeated here; a dead header name left
// lying in a comment is how the next scanner concludes the control exists. The
// route does emit surface attribution, under the names below, on success AND on
// every error response via `movesJsonError`. The layer and policy values are
// asserted as literals because they are the surface attribution this suite
// exists to prove; the contract header is compared with the exported constant so
// a route that stops sourcing it from the canonical version fails here.
function expectMovesV6Headers(res: Response) {
  expect(res.headers.get('X-AbarVa-Moves-Layer')).toBe('moves-current');
  expect(res.headers.get('X-AbarVa-Renderer-Policy')).toBe('placement-only');
  expect(res.headers.get('X-AbarVa-V6-Contract')).toBe(
    MODULE_V6_ANSWER_CONTRACT_VERSION,
  );
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

  it('uses the active Lakeshore Holdings V6 Moves pack instead of defaulting to the Apex CDP fixture', async () => {
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
    expectMovesV6Headers(res);
    await expect(res.text()).resolves.toBe('Moves V6 answer.');
    expect(mockAnthropicStream).toHaveBeenCalledTimes(1);
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain('Corporate ERP and HCM controls modernization');
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
    expectMovesV6Headers(res);
    await expect(res.text()).resolves.toBe('Airline Moves V6 answer.');
    const streamArgs = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamArgs.messages[0].content).toContain('OCC Modernization');
    expect(streamArgs.messages[0].content).toContain('execution-sequence-packet');
  });

  // T-517: added with the pack mock above. With the V6 dataset gone from the
  // tree, a null pack is what these tenants actually get in the deployed image,
  // and nothing asserted the route's behavior in that state — the old suite hit
  // it by accident and reported it as two unrelated failed 200s. This is the
  // 404 the route is written to return, distinct from the unknown-program-id
  // 404 above: it carries a detail naming the tenant, and no model call is made.
  it('returns the not-loaded 404 when no V6 Moves pack resolves for the active tenant', async () => {
    mockBuildV6ProgramInstanceForTenant.mockReturnValueOnce(null);
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
    expectMovesV6Headers(res);
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
    expectMovesV6Headers(res);
    await expect(res.json()).resolves.toEqual({
      error: 'wrong_client',
      detail: 'Requested Moves program does not belong to the active tenant.',
    });
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });
});

export {};
