import type { NextRequest } from 'next/server';
import type { GateSignal } from '@/lib/nexus/orchestrator';

const runPipeline = jest.fn();
const createThread = jest.fn();
const touchThread = jest.fn();
const appendTurn = jest.fn();
const listTurns = jest.fn();
const requireTenancy = jest.fn();

jest.mock('@/lib/nexus/orchestrator', () => ({
  runPipeline,
}));

jest.mock('@/lib/intelligence/db/threadRepository', () => ({
  createThread,
  touchThread,
}));

jest.mock('@/lib/intelligence/db/turnRepository', () => ({
  appendTurn,
  listTurns,
}));

jest.mock('@/app/api/v1/_intel-auth', () => {
  class MockTenancyError extends Error {
    constructor(public readonly code: 'unauthenticated' | 'no_client') {
      super(code);
    }
  }
  return {
    requireTenancy,
    TenancyError: MockTenancyError,
  };
});

function makeRequest(body: unknown | string): NextRequest {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('http://localhost/api/v1/nexus/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }) as NextRequest;
}

async function readEvents(res: Response): Promise<Array<{ event: string; data: Record<string, unknown> }>> {
  const text = await res.text();
  return text
    .trim()
    .split('\n\n')
    .filter(Boolean)
    .map((chunk) => {
      const [eventLine, dataLine] = chunk.split('\n');
      return {
        event: eventLine.replace(/^event:\s*/, ''),
        data: JSON.parse(dataLine.replace(/^data:\s*/, '')) as Record<string, unknown>,
      };
    });
}

describe('POST /api/v1/nexus/query', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    requireTenancy.mockResolvedValue({ clientId: 'client_1', userId: 'user_1' });
    createThread.mockResolvedValue({ id: 'thread_new' });
    touchThread.mockResolvedValue(undefined);
    appendTurn
      .mockResolvedValueOnce({ id: 'turn_user_1' })
      .mockResolvedValueOnce({ id: 'turn_nexus_1' });
    listTurns.mockResolvedValue([
      { id: 'user_turn_prior', role: 'user', threadId: 'thread_new', payload: { answer: 'previous' } },
      { id: 'nexus_turn_prior', role: 'nexus', threadId: 'thread_new', payload: { answer: 'prior answer' } },
      { id: 'nexus_turn_prior_2', role: 'nexus', threadId: 'thread_new', payload: { answer: 'prior answer 2' } },
    ]);
    runPipeline.mockImplementation(async (input: {
      onProgress?: (p: { phase: string; status: string; latencyMs?: number }) => void;
      onTextDelta?: (text: string) => void;
      onGateSignal?: (signal: GateSignal) => void;
    }) => {
      input.onProgress?.({ phase: 'retrieve', status: 'start', latencyMs: 3 });
      input.onTextDelta?.('Delta one');
      input.onTextDelta?.('Delta two');
      input.onGateSignal?.({ type: 'gate_approval', fromPhase: 0, toPhase: 1, payload: { approved: true } });
      return {
        mode: 'research',
        format: 'one_sentence',
        payload: { answer: 'Final answer', confidence: 'high' },
        bundle: {
          sources: [
            {
              id: 'src_1',
              type: 'pattern',
              name: 'Pattern one',
              detail: 'Detail one',
            },
          ],
        },
        latencyMs: { parse: 1, plan: 2, retrieve: 3, assemble: 4, compose: 5, total: 15 },
        strippedCount: 2,
        clarifying: { fires: false },
        gateSignals: [{ type: 'gate_approval', fromPhase: 0, toPhase: 1, payload: { approved: true } }],
      };
    });
  });

  it('returns 400 on malformed JSON', async () => {
    const { POST } = await import('@/app/api/v1/nexus/query/route');
    const res = await POST(makeRequest('{bad json'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'bad_request', detail: 'malformed JSON' });
  });

  it('returns 400 when query is missing', async () => {
    const { POST } = await import('@/app/api/v1/nexus/query/route');
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'bad_request', detail: 'query required' });
  });

  it('returns 401 when tenancy is unauthenticated', async () => {
    const { TenancyError } = await import('@/app/api/v1/_intel-auth');
    requireTenancy.mockRejectedValueOnce(new TenancyError('unauthenticated'));
    const { POST } = await import('@/app/api/v1/nexus/query/route');
    const res = await POST(makeRequest({ query: 'hello' }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'unauthenticated' });
  });

  it('returns 403 when tenancy has no active client', async () => {
    const { TenancyError } = await import('@/app/api/v1/_intel-auth');
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const { POST } = await import('@/app/api/v1/nexus/query/route');
    const res = await POST(makeRequest({ query: 'hello' }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });

  it('emits SSE events in order and persists turns', async () => {
    const { POST } = await import('@/app/api/v1/nexus/query/route');
    const res = await POST(makeRequest({ query: 'What changed?', format_override: 'one_sentence' }));

    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await readEvents(res);
    expect(events.map((e) => e.event)).toEqual([
      'turn_started',
      'retrieval_progress',
      'content_delta',
      'content_delta',
      'source_attached',
      'turn_complete',
    ]);

    expect(events[0].data).toMatchObject({
      type: 'turn_started',
      mode: 'research',
      format: 'one_sentence',
    });
    expect(events[5].data).toMatchObject({
      type: 'turn_complete',
      payload: {
        threadId: 'thread_new',
        mode: 'research',
        format: 'one_sentence',
        strippedCount: 2,
      },
    });

    expect(createThread).toHaveBeenCalledWith(
      { clientId: 'client_1', userId: 'user_1' },
      { title: 'What changed?', conversationId: undefined },
    );
    expect(appendTurn).toHaveBeenNthCalledWith(
      1,
      { clientId: 'client_1', userId: 'user_1' },
      expect.objectContaining({
        threadId: 'thread_new',
        role: 'user',
        payload: { answer: 'What changed?' },
      }),
    );
    expect(runPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'What changed?',
        tenancy: { clientId: 'client_1', userId: 'user_1' },
        formatOverride: 'one_sentence',
        priorTurns: expect.any(Array),
      }),
    );
    expect(touchThread).toHaveBeenCalledWith({ clientId: 'client_1', userId: 'user_1' }, 'thread_new');
  });
});

export {};
