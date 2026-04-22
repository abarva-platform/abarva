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
  return new Request('http://localhost/api/v1/nexus/counter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/v1/nexus/counter', () => {
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
      payload: { hero: 'Use a central AI platform' },
      format: 'one_sentence',
    });
    listTurns.mockResolvedValue([{ id: 'prior', role: 'user', payload: { answer: 'prior' } }]);
    runPipeline.mockResolvedValue({
      mode: 'research',
      format: 'counter_pair',
      payload: {
        answer: 'Counterpoint',
        confidence: 'medium',
        counter_card: { answer: 'Counter' },
        tiebreaker: { question: 'What is reversible?', resolver: 'Run a 2-week pilot' },
      },
      bundle: { sources: [{ id: 'src_counter', type: 'pattern', name: 'Pattern', detail: 'detail' }] },
      latencyMs: { parse: 1, plan: 1, retrieve: 1, assemble: 1, compose: 1, total: 5 },
      strippedCount: 0,
      gateSignals: [],
    });
    appendTurn.mockResolvedValue({ id: 'turn_counter_new', threadId: 'thread_1' });
  });

  it('returns 400 when turnId is missing', async () => {
    const { POST } = await import('@/app/api/v1/nexus/counter/route');
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'bad_request', detail: 'turnId required' });
  });

  it('returns 404 when the source turn does not exist', async () => {
    getTurn.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/v1/nexus/counter/route');
    const res = await POST(makeRequest({ turnId: 'missing' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'not_found' });
  });

  it('returns 403 when tenancyErrorResponse handles a tenancy failure', async () => {
    requireTenancy.mockRejectedValueOnce(new Error('forbidden'));
    tenancyErrorResponse.mockReturnValueOnce(Response.json({ error: 'forbidden' }, { status: 403 }));
    const { POST } = await import('@/app/api/v1/nexus/counter/route');
    const res = await POST(makeRequest({ turnId: 'turn_original' }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'forbidden' });
  });

  it('invokes the counter capability and returns the new turn payload', async () => {
    const { POST } = await import('@/app/api/v1/nexus/counter/route');
    const res = await POST(makeRequest({ turnId: 'turn_original' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(runPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        capability: 'counter',
        formatOverride: 'counter_pair',
        query: expect.stringContaining('Steelman the counter'),
      }),
    );
    expect(appendTurn).toHaveBeenCalledWith(
      { clientId: 'client_1', userId: 'user_1' },
      expect.objectContaining({
        threadId: 'thread_1',
        format: 'counter_pair',
        capabilitiesActive: ['counter'],
        counterOfTurnId: 'turn_original',
      }),
    );
    expect(body.turn).toEqual({ id: 'turn_counter_new', threadId: 'thread_1' });
    expect(body.latencyMs.total).toBe(5);
  });
});

export {};
