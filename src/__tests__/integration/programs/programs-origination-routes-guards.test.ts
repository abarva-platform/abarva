import type { NextRequest } from 'next/server';

class TenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const classifyOrigination = jest.fn();
const classifierMatchToViewModel = jest.fn();

jest.mock('@/app/api/v1/programs/_auth', () => ({
  TenancyError,
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock('@/lib/programs/programs-auth-mode-server', () => ({
  getProgramsRouteSupabase,
}));

jest.mock('@/lib/programs/classifier', () => ({
  classifyOrigination,
}));

jest.mock('@/lib/programs/transformers', () => ({
  classifierMatchToViewModel,
}));

const CTX = { clientId: 'client_meridian', userId: 'person_1', role: 'client_admin' };

function makePost(body: unknown): NextRequest {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makeEngagementTopicsSupabase(topics: Array<Record<string, unknown>> = []) {
  return {
    from: (table: string) => {
      if (table !== 'engagement_topics') throw new Error(`unexpected table: ${table}`);
      return {
        select: () => ({
          in: async () => ({ data: topics, error: null }),
          order: () => ({
            in: () => ({
              contains: () => ({
                limit: async () => ({ data: topics, error: null }),
              }),
              limit: async () => ({ data: topics, error: null }),
            }),
            contains: () => ({
              limit: async () => ({ data: topics, error: null }),
            }),
            limit: async () => ({ data: topics, error: null }),
          }),
        }),
      };
    },
  };
}

function makeFromThreadSupabase(args: {
  thread: Record<string, unknown> | null;
  turns?: Array<Record<string, unknown>>;
  topics?: Array<Record<string, unknown>>;
}) {
  return {
    from: (table: string) => {
      if (table === 'intelligence_threads') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: args.thread, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'intelligence_thread_turns') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: args.turns ?? [], error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'engagement_topics') {
        return {
          select: () => ({
            in: async () => ({ data: args.topics ?? [], error: null }),
          }),
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancy.mockResolvedValue(CTX);
  tenancyErrorResponse.mockImplementation((err: unknown) => {
    if (err instanceof TenancyError) {
      return Response.json({ error: err.code }, { status: err.code === 'unauthenticated' ? 401 : 403 });
    }
    throw err;
  });
  getProgramsRouteSupabase.mockResolvedValue({ mode: 'service_role', supabase: makeEngagementTopicsSupabase([]) });
  classifyOrigination.mockResolvedValue({
    extracted: {
      archetype: 'strategic_transformation',
      industry: 'healthcare',
      objectives: ['speed'],
      entities: ['epic'],
    },
    matches: [{ patternKey: 'PAT-1', score: 0.9 }],
    latencyMs: { stage1: 1, stage2: 2, total: 3 },
  });
  classifierMatchToViewModel.mockReturnValue({
    key: 'PAT-1',
    name: 'Pattern One',
    archetype: 'strategic_transformation',
    promotionState: 'proven',
    summary: 'summary',
    typicalDurationMonths: 6,
    deploymentCount: 1,
    preloadDepthPct: 60,
  });
});

describe('POST /api/v1/programs/originate', () => {
  const routePath = '@/app/api/v1/programs/originate/route';

  async function invoke(body: Record<string, unknown>) {
    const mod = await import(routePath);
    return mod.POST(makePost(body));
  }

  it('allows own-tenant origination classification and uses origination auth family', async () => {
    getProgramsRouteSupabase.mockResolvedValueOnce({
      mode: 'service_role',
      supabase: makeEngagementTopicsSupabase([{ topic_key: 'PAT-1', title: 'Pattern One' }]),
    });
    const res = await invoke({
      originationForm: { name: 'Move', useCase: 'Modernize analytics' },
    });
    expect(res.status).toBe(200);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('origination');
  });

  it('returns 400 for malformed payload', async () => {
    const res = await invoke({ wrong: true });
    expect(res.status).toBe(400);
  });

  it('denies cross-tenant injection attempts by honoring tenancy context', async () => {
    await invoke({
      originationForm: {
        name: 'Move',
        useCase: 'Modernize analytics',
        clientId: 'client_apex',
      },
    });
    expect(classifyOrigination).toHaveBeenCalledWith(
      expect.objectContaining({
        tenancy: expect.objectContaining({ clientId: CTX.clientId }),
      }),
    );
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke({
      originationForm: { name: 'Move', useCase: 'Modernize analytics' },
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});

describe('POST /api/v1/programs/originate/from-thread', () => {
  const routePath = '@/app/api/v1/programs/originate/from-thread/route';

  async function invoke(body: Record<string, unknown>) {
    const mod = await import(routePath);
    return mod.POST(makePost(body));
  }

  it('allows own-tenant intelligence-thread handoff', async () => {
    getProgramsRouteSupabase.mockResolvedValueOnce({
      mode: 'service_role',
      supabase: makeFromThreadSupabase({
        thread: { id: 'th_1', user_id: CTX.userId, client_id: CTX.clientId, title: 'Thread Title' },
        turns: [{ role: 'user', payload_jsonb: { answer: 'Need data modernization' } }],
        topics: [{ topic_key: 'PAT-1', title: 'Pattern One' }],
      }),
    });
    const res = await invoke({ threadId: 'th_1' });
    expect(res.status).toBe(200);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('origination');
  });

  it('returns 404 for thread outside tenant scope', async () => {
    getProgramsRouteSupabase.mockResolvedValueOnce({
      mode: 'service_role',
      supabase: makeFromThreadSupabase({ thread: null }),
    });
    const res = await invoke({ threadId: 'th_foreign' });
    expect(res.status).toBe(404);
  });

  it('denies cross-tenant crafted thread payloads', async () => {
    getProgramsRouteSupabase.mockResolvedValueOnce({
      mode: 'service_role',
      supabase: makeFromThreadSupabase({ thread: null }),
    });
    const res = await invoke({ threadId: 'th_foreign', clientId: 'client_apex' });
    expect(res.status).toBe(404);
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke({ threadId: 'th_1' });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});

describe('GET /api/v1/programs/patterns', () => {
  const routePath = '@/app/api/v1/programs/patterns/route';

  async function invoke(url = 'http://localhost/api/v1/programs/patterns') {
    const mod = await import(routePath);
    return mod.GET(new Request(url) as unknown as NextRequest);
  }

  it('allows tenant-authenticated pattern browse and uses origination auth family', async () => {
    getProgramsRouteSupabase.mockResolvedValueOnce({
      mode: 'service_role',
      supabase: makeEngagementTopicsSupabase([
        {
          topic_key: 'PAT-1',
          title: 'Pattern One',
          tagline: 'tag',
          industries: ['healthcare'],
          deployment_count: 2,
          successful_deployment_count: 1,
          promotion_state: 'pilot',
          canonical_shape_json: { archetype: 'strategic_transformation' },
          maturity_version: 1,
        },
      ]),
    });
    const res = await invoke();
    expect(res.status).toBe(200);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('origination');
  });

  it('returns filtered results without exposing cross-tenant data controls', async () => {
    const res = await invoke('http://localhost/api/v1/programs/patterns?industry=healthcare');
    expect(res.status).toBe(200);
  });

  it('ignores client-side tenant injection attempts', async () => {
    await invoke('http://localhost/api/v1/programs/patterns?client_id=client_apex');
    expect(requireTenancy).toHaveBeenCalled();
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});
