import type { NextRequest } from 'next/server';

class TenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const getProgramsRouteSupabase = jest.fn();
const getProgramById = jest.fn();

const getActiveClientRow = jest.fn();
const runProgramsNexusTurn = jest.fn();
const assembleContext = jest.fn();
const describePendingComposerCall = jest.fn();
const createThread = jest.fn();
const touchThread = jest.fn();
const draftModuleDeliverable = jest.fn();
const startCxoTakeover = jest.fn();
const commitCxoTranscript = jest.fn();

const streamAgentTurn = jest.fn();
const runQualityGates = jest.fn();
const raiseMaestroFlag = jest.fn();

jest.mock('@/app/api/v1/programs/_auth', () => ({
  TenancyError,
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock('@/lib/programs/programs-auth-mode-server', () => ({
  getProgramsRouteSupabase,
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramById,
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow,
}));

jest.mock('@/lib/programs/nexus-free-text', () => ({
  runProgramsNexusTurn,
}));

jest.mock('@/lib/programs/nexus', () => ({
  assembleContext,
  describePendingComposerCall,
  createThread,
  touchThread,
  draftModuleDeliverable,
  startCxoTakeover,
  commitCxoTranscript,
}));

jest.mock('@/lib/agent/stream', () => ({
  streamAgentTurn,
}));

jest.mock('@/lib/programs/quality-gates', () => ({
  runQualityGates,
}));

jest.mock('@/lib/programs/governance', () => ({
  raiseMaestroFlag,
}));

const CTX = { clientId: 'client_meridian', userId: 'person_1', role: 'client_admin' };
const OWN_PROGRAM = 'eng_own';
const FOREIGN_PROGRAM = 'eng_foreign';

function makePost(body: unknown): NextRequest {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makeThreadLookupSupabase(thread: { id: string; engagement_id: string; user_id: string } | null) {
  return {
    from: (table: string) => {
      if (table !== 'program_threads') throw new Error(`unexpected table: ${table}`);
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: thread, error: null }),
          }),
        }),
      };
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
  getProgramsRouteSupabase.mockResolvedValue({ mode: 'service_role', supabase: { mocked: true } });
  getProgramById.mockImplementation((_ctx, programId) =>
    programId === OWN_PROGRAM ? Promise.resolve({ id: OWN_PROGRAM, name: 'Move 1', currentPhase: 1 }) : Promise.resolve(null),
  );

  getActiveClientRow.mockResolvedValue({
    key: 'meridian-health',
    name: 'Meridian Health System',
    industry_code: 'HC',
  });
  createThread.mockResolvedValue({ id: 'thread_1' });
  assembleContext.mockResolvedValue({
    programId: OWN_PROGRAM,
    program: { name: 'Move 1', archetype: 'healthcare', currentPhase: 1 },
    modules: [],
    patternPreload: null,
    deliverables: [],
    flags: [],
  });
  runProgramsNexusTurn.mockResolvedValue({
    response: 'Use a phased modernization roadmap.',
    sources: [],
    citations: [],
    suggestions: [],
    routeType: 'strategy',
    confidence: 0.82,
    sparseEvidence: false,
    activePatternSlug: null,
  });
  touchThread.mockResolvedValue(undefined);
  describePendingComposerCall.mockReturnValue({
    model: 'claude-sonnet-4-5-20250929',
    systemPromptHint: 'Use provided context and patterns.',
  });

  streamAgentTurn.mockImplementation(async function* () {
    yield 'Draft content';
  });
  runQualityGates.mockReturnValue({
    pass: true,
    cleanedContent: 'Draft content',
    issues: [],
    metadata: { wordCount: 2, provenanceHints: [] },
  });
  draftModuleDeliverable.mockResolvedValue({ deliverableId: 'del_1', versionId: 'ver_1' });
  raiseMaestroFlag.mockResolvedValue('flag_1');
  startCxoTakeover.mockResolvedValue({
    threadId: 'thread_1',
    programId: OWN_PROGRAM,
    phase: 3,
    structure: 'phase_3_interview',
    startedAt: new Date().toISOString(),
  });
  commitCxoTranscript.mockResolvedValue({ target: 'phase_findings', targetId: 'mod_1' });
});

describe('POST /api/v1/programs/[programId]/nexus/ask', () => {
  const routePath = '@/app/api/v1/programs/[programId]/nexus/ask/route';
  const payload = { query: 'How do we modernize analytics?' };

  async function invoke(programId: string, body: Record<string, unknown> = payload) {
    const mod = await import(routePath);
    return mod.POST(makePost(body), { params: Promise.resolve({ programId }) });
  }

  it('allows own-tenant ask turns', async () => {
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(200);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
  });

  it('returns 404 for foreign-tenant program id', async () => {
    const res = await invoke(FOREIGN_PROGRAM);
    expect(res.status).toBe(404);
  });

  it('denies cross-tenant thread writes for foreign thread ownership', async () => {
    getProgramsRouteSupabase.mockResolvedValueOnce({
      mode: 'service_role',
      supabase: makeThreadLookupSupabase({ id: 'thread_x', engagement_id: 'eng_other', user_id: CTX.userId }),
    });
    const res = await invoke(OWN_PROGRAM, { query: 'continue', threadId: 'thread_x' });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'thread_not_found' });
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});

describe('POST /api/v1/programs/[programId]/nexus/draft', () => {
  const routePath = '@/app/api/v1/programs/[programId]/nexus/draft/route';
  const payload = {
    moduleKey: 'design',
    deliverableTypeKey: 'design_spec',
    title: 'Design Spec',
    prompt: 'Draft a design spec',
  };

  async function invoke(programId: string, body: Record<string, unknown> = payload) {
    const mod = await import(routePath);
    return mod.POST(makePost(body), { params: Promise.resolve({ programId }) });
  }

  it('allows own-tenant draft generation', async () => {
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(200);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
    expect(draftModuleDeliverable).toHaveBeenCalled();
  });

  it('returns 404 for foreign-tenant program id', async () => {
    const res = await invoke(FOREIGN_PROGRAM);
    expect(res.status).toBe(404);
  });

  it('denies cross-tenant write attempts with crafted payloads', async () => {
    const res = await invoke(FOREIGN_PROGRAM, {
      ...payload,
      engagementId: OWN_PROGRAM,
      clientId: 'client_apex',
    });
    expect(res.status).toBe(404);
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});

describe('POST /api/v1/programs/[programId]/nexus/cxo-takeover', () => {
  const routePath = '@/app/api/v1/programs/[programId]/nexus/cxo-takeover/route';
  const payload = { action: 'start' as const, phase: 3 as const };

  async function invoke(programId: string, body: Record<string, unknown> = payload) {
    const mod = await import(routePath);
    return mod.POST(makePost(body), { params: Promise.resolve({ programId }) });
  }

  it('allows own-tenant cxo takeover sessions', async () => {
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(201);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
    expect(startCxoTakeover).toHaveBeenCalled();
  });

  it('returns 404 for foreign-tenant program id', async () => {
    const res = await invoke(FOREIGN_PROGRAM);
    expect(res.status).toBe(404);
  });

  it('denies cross-tenant commit attempts with crafted payloads', async () => {
    const res = await invoke(FOREIGN_PROGRAM, {
      action: 'commit',
      phase: 3,
      threadId: 'thread_1',
      transcript: [{ speaker: 'lead', text: 'hello' }],
      synthesis: { headline: 'x', bullets: ['y'] },
      engagementId: OWN_PROGRAM,
    });
    expect(res.status).toBe(404);
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});

describe('POST /api/v1/programs/[programId]/nexus/threads', () => {
  const routePath = '@/app/api/v1/programs/[programId]/nexus/threads/route';
  const payload = { mode: 'side_panel' as const, title: 'thread' };

  async function invoke(programId: string, body: Record<string, unknown> = payload) {
    const mod = await import(routePath);
    return mod.POST(makePost(body), { params: Promise.resolve({ programId }) });
  }

  it('allows own-tenant thread creation', async () => {
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(201);
    expect(getProgramsRouteSupabase).toHaveBeenCalledWith('mutation');
    expect(createThread).toHaveBeenCalled();
  });

  it('returns 404 for foreign-tenant program id', async () => {
    const res = await invoke(FOREIGN_PROGRAM);
    expect(res.status).toBe(404);
  });

  it('denies cross-tenant write attempts with crafted payloads', async () => {
    const res = await invoke(FOREIGN_PROGRAM, {
      ...payload,
      engagementId: OWN_PROGRAM,
      clientId: 'client_apex',
    });
    expect(res.status).toBe(404);
  });

  it('denies users without tenant membership', async () => {
    requireTenancy.mockRejectedValueOnce(new TenancyError('no_client'));
    const res = await invoke(OWN_PROGRAM);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'no_client' });
  });
});
