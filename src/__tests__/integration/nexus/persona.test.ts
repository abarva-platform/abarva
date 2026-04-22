import type { NextRequest } from 'next/server';

const runPipeline = jest.fn();
const appendTurn = jest.fn();
const getTurn = jest.fn();
const listTurns = jest.fn();
const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();

jest.mock('@/lib/nexus/orchestrator', () => ({
  runPipeline,
}));

jest.mock('@/lib/intelligence/db/turnRepository', () => ({
  appendTurn,
  getTurn,
  listTurns,
}));

jest.mock('@/app/api/v1/_intel-auth', () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

function makeRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/v1/nexus/persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/v1/nexus/persona', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({ clientId: 'client_1', userId: 'user_1' });
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
    getTurn.mockResolvedValue({
      id: 'turn_original',
      threadId: 'thread_1',
      payload: { hero: 'Original answer' },
      format: 'matrix',
    });
    listTurns.mockResolvedValue([{ id: 'prior_turn', role: 'user', payload: { answer: 'prior' } }]);
    runPipeline.mockResolvedValue({
      mode: 'research',
      format: 'matrix',
      payload: {
        hero: 'CFO lens answer',
        dimensions: [{ name: 'Risk', values: [{ option: 'Delay', value: 'high' }] }],
        confidence: 'high',
      },
      bundle: { sources: [{ id: 'src_1', type: 'benchmark', name: 'Benchmark', detail: 'detail' }] },
      latencyMs: { parse: 1, plan: 1, retrieve: 1, assemble: 1, compose: 1, total: 5 },
      strippedCount: 0,
      gateSignals: [],
    });
    appendTurn.mockResolvedValue({ id: 'turn_persona_new', threadId: 'thread_1' });
  });

  it('returns 400 when turnId or personaKey is missing', async () => {
    const { POST } = await import('@/app/api/v1/nexus/persona/route');
    const res = await POST(makeRequest({ turnId: 'turn_original' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'bad_request',
      detail: 'turnId + personaKey required',
    });
  });

  it('returns 400 for invalid personaKey', async () => {
    const { POST } = await import('@/app/api/v1/nexus/persona/route');
    const res = await POST(makeRequest({ turnId: 'turn_original', personaKey: 'Janitor' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('bad_request');
    expect(String(body.detail)).toContain('personaKey must be one of');
  });

  it('returns 404 when the original turn is missing', async () => {
    getTurn.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/v1/nexus/persona/route');
    const res = await POST(makeRequest({ turnId: 'turn_missing', personaKey: 'CFO' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not_found' });
  });

  it('threads persona capability through the orchestrator and persists sibling turn', async () => {
    const { POST } = await import('@/app/api/v1/nexus/persona/route');
    const res = await POST(makeRequest({ turnId: 'turn_original', personaKey: 'CFO' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(runPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        capability: { persona: 'CFO' },
        formatOverride: 'matrix',
        query: expect.stringContaining('through CFO lens'),
      }),
    );
    expect(appendTurn).toHaveBeenCalledWith(
      { clientId: 'client_1', userId: 'user_1' },
      expect.objectContaining({
        threadId: 'thread_1',
        capabilitiesActive: ['persona'],
        personaKey: 'CFO',
      }),
    );
    expect(body.turn).toEqual({ id: 'turn_persona_new', threadId: 'thread_1' });
    expect(body.latencyMs.total).toBe(5);
  });
});

export {};
