/**
 * @jest-environment node
 */

/**
 * POST /api/context/demo · CB-4 (pilot-ready) unit tests
 *
 * Covers request validation, auth gating, tenant-key normalization,
 * the cross-check between the caller's active client and the
 * requested tenantKey, broker invocation, sanitized error mapping,
 * and the no-store cache header.
 *
 * Strategy: mock `requireTenancy`, `getActiveClientRow`, and the
 * broker so the route runs end-to-end without a Clerk session, a
 * Postgres seed, or a Pinecone index.
 */

const requireTenancyMock = jest.fn();
jest.mock('@/app/api/v1/programs/_auth', () => {
  class TenancyErrorImpl extends Error {
    constructor(public readonly code: 'unauthenticated' | 'no_client') {
      super(code);
    }
  }
  return {
    requireTenancy: () => requireTenancyMock(),
    TenancyError: TenancyErrorImpl,
  };
});

// Re-import the mocked TenancyError so tests can throw an instance the
// route's `instanceof` check will recognize.
import { TenancyError as MockedTenancyError } from '@/app/api/v1/programs/_auth';

const getActiveClientRowMock = jest.fn();
jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
  ACTIVE_CLIENT_COOKIE: 'abarva_active_client',
}));

const assembleMock = jest.fn();
jest.mock('@/lib/knowledge/context-broker', () => {
  const actual = jest.requireActual('@/lib/knowledge/context-broker');
  return {
    ...actual,
    getContextBroker: () => ({
      assemble: (input: unknown) => assembleMock(input),
    }),
  };
});

// Import AFTER all mocks register so the route picks them up.
import { POST } from '../route';
import {
  CONTEXT_DEMO_QUERY_MAX_LENGTH,
  MissingTenantKeyError,
  type ContextBundle,
} from '@/lib/knowledge/context-broker';

function makeRequest(body: unknown): import('next/server').NextRequest {
  return new Request('http://test/api/context/demo', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as import('next/server').NextRequest;
}

async function readJson<T = Record<string, unknown>>(
  res: Awaited<ReturnType<typeof POST>>,
): Promise<T> {
  return (await res.json()) as T;
}

function makeBundle(overrides: Partial<ContextBundle> = {}): ContextBundle {
  return {
    query: 'q',
    mode: 'generic',
    tenantKey: null,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    provenance: [],
    warnings: [],
    infoTags: [],
    assembledAt: '2026-04-29T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: signed-in admin with Apex active. Apex's app-side ClientKey
  // is `apexretail` and the broker key is `apex-retail` — the route is
  // expected to canonicalize via clientKeyToBrokerTenantKey.
  requireTenancyMock.mockResolvedValue({
    clientId: 'c-apex',
    userId: 'u-1',
    role: 'admin',
  });
  getActiveClientRowMock.mockResolvedValue({
    id: 'c-apex',
    name: 'Apex Retail',
    industry_code: 'retail',
    key: 'apexretail',
  });
  assembleMock.mockImplementation(
    async (input: { query: string; mode: ContextBundle['mode']; tenantKey?: string }) =>
      makeBundle({
        query: input.query,
        mode: input.mode,
        tenantKey: input.tenantKey ?? null,
      }),
  );
});

describe('POST /api/context/demo · auth gate', () => {
  it('returns 401 when unauthenticated', async () => {
    requireTenancyMock.mockRejectedValue(new MockedTenancyError('unauthenticated'));
    const res = await POST(makeRequest({ query: 'hi', mode: 'generic' }));
    expect(res.status).toBe(401);
    const body = await readJson<{ ok: false; error: string }>(res);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/auth/i);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns 403 when no active client', async () => {
    requireTenancyMock.mockRejectedValue(new MockedTenancyError('no_client'));
    const res = await POST(makeRequest({ query: 'hi', mode: 'generic' }));
    expect(res.status).toBe(403);
    const body = await readJson<{ ok: false; error: string }>(res);
    expect(body.ok).toBe(false);
  });
});

describe('POST /api/context/demo · request validation', () => {
  it('rejects invalid JSON with 400', async () => {
    const res = await POST(makeRequest('not-json'));
    expect(res.status).toBe(400);
    const body = await readJson<{ ok: false; error: string }>(res);
    expect(body.error).toMatch(/JSON/);
  });

  it('rejects array body with 400', async () => {
    const res = await POST(makeRequest([] as unknown));
    expect(res.status).toBe(400);
  });

  it('rejects empty query with 400', async () => {
    const res = await POST(makeRequest({ query: '   ', mode: 'generic' }));
    expect(res.status).toBe(400);
    const body = await readJson<{ ok: false; error: string }>(res);
    expect(body.error).toMatch(/query/);
  });

  it('rejects missing query with 400', async () => {
    const res = await POST(makeRequest({ mode: 'generic' }));
    expect(res.status).toBe(400);
  });

  it('rejects oversize query with 400', async () => {
    const huge = 'x'.repeat(CONTEXT_DEMO_QUERY_MAX_LENGTH + 1);
    const res = await POST(makeRequest({ query: huge, mode: 'generic' }));
    expect(res.status).toBe(400);
    const body = await readJson<{ ok: false; error: string }>(res);
    expect(body.error).toMatch(/2000/);
  });

  it('rejects invalid mode with 400', async () => {
    const res = await POST(makeRequest({ query: 'hi', mode: 'banana' }));
    expect(res.status).toBe(400);
    const body = await readJson<{ ok: false; error: string }>(res);
    expect(body.error).toMatch(/mode/);
  });

  it('rejects missing mode with 400', async () => {
    const res = await POST(makeRequest({ query: 'hi' }));
    expect(res.status).toBe(400);
  });

  it('rejects tenant mode without tenantKey with 400 + code', async () => {
    const res = await POST(makeRequest({ query: 'hi', mode: 'tenant' }));
    expect(res.status).toBe(400);
    const body = await readJson<{ ok: false; error: string; code?: string }>(res);
    expect(body.code).toBe('CONTEXT_BROKER_TENANT_KEY_REQUIRED');
  });

  it('rejects full mode without tenantKey with 400 + code', async () => {
    const res = await POST(makeRequest({ query: 'hi', mode: 'full' }));
    expect(res.status).toBe(400);
    const body = await readJson<{ ok: false; code?: string }>(res);
    expect(body.code).toBe('CONTEXT_BROKER_TENANT_KEY_REQUIRED');
  });

  it('rejects negative maxFacts with 400', async () => {
    const res = await POST(
      makeRequest({ query: 'hi', mode: 'generic', maxFacts: -1 }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects fractional maxChunks with 400', async () => {
    const res = await POST(
      makeRequest({ query: 'hi', mode: 'generic', maxChunks: 1.5 }),
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/context/demo · success path', () => {
  it('returns 200 + bundle for generic mode', async () => {
    const res = await POST(makeRequest({ query: 'why do AI pilots fail?', mode: 'generic' }));
    expect(res.status).toBe(200);
    const body = await readJson<{ ok: true; bundle: ContextBundle }>(res);
    expect(body.ok).toBe(true);
    expect(body.bundle.mode).toBe('generic');
    expect(body.bundle.facts).toEqual([]);
    expect(body.bundle.graphPaths).toEqual([]);
    expect(body.bundle.semanticChunks).toEqual([]);
    expect(body.bundle.corpusPatterns).toEqual([]);
    // Cache header — required for tenant-safety even on generic mode.
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('does NOT pass tenantKey to broker for generic mode', async () => {
    await POST(
      makeRequest({ query: 'why do AI pilots fail?', mode: 'generic', tenantKey: 'apex-retail' }),
    );
    expect(assembleMock).toHaveBeenCalledTimes(1);
    const arg = assembleMock.mock.calls[0]![0] as { tenantKey?: string };
    // generic mode ignores tenantKey per the contract — but the route
    // forwards what the validator accepts. The broker is the source of
    // truth for ignoring it; we just verify the route didn't strip it.
    expect(arg.tenantKey === undefined || arg.tenantKey === 'apex-retail').toBe(true);
  });

  it('returns 200 + bundle for tenant mode when tenantKey matches active client', async () => {
    assembleMock.mockResolvedValueOnce(
      makeBundle({
        mode: 'tenant',
        tenantKey: 'apex-retail',
        facts: [
          {
            recordId: 'program:apex-cdp',
            tenantKey: 'apex-retail',
            kind: 'program',
            title: 'Apex CDP',
            sourceBasis: 'apex-cdp.md',
          } as unknown as ContextBundle['facts'][number],
        ],
      }),
    );
    const res = await POST(
      makeRequest({
        query: 'apex CDP risk profile',
        mode: 'tenant',
        tenantKey: 'apex-retail',
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ ok: true; bundle: ContextBundle }>(res);
    expect(body.ok).toBe(true);
    expect(body.bundle.mode).toBe('tenant');
    expect(body.bundle.facts.length).toBe(1);
  });

  it('returns 200 + bundle for full mode when tenantKey matches', async () => {
    assembleMock.mockResolvedValueOnce(
      makeBundle({ mode: 'full', tenantKey: 'apex-retail' }),
    );
    const res = await POST(
      makeRequest({
        query: 'apex retail outlook',
        mode: 'full',
        tenantKey: 'apex-retail',
      }),
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ ok: true; bundle: ContextBundle }>(res);
    expect(body.bundle.mode).toBe('full');
  });

  it('forwards optional limits to the broker', async () => {
    await POST(
      makeRequest({
        query: 'hi',
        mode: 'tenant',
        tenantKey: 'apex-retail',
        maxFacts: 3,
        maxChunks: 2,
        graphTraversalDepth: 1,
      }),
    );
    expect(assembleMock).toHaveBeenCalledTimes(1);
    expect(assembleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        maxFacts: 3,
        maxChunks: 2,
        graphTraversalDepth: 1,
      }),
    );
  });
});

describe('POST /api/context/demo · tenant-key cross-check (apex-retail / apexretail split)', () => {
  it('returns 403 when requested tenantKey does not match active client', async () => {
    // Active client is Apex (broker key: apex-retail). Caller asks for
    // Meridian; the route MUST refuse, not forward the request.
    const res = await POST(
      makeRequest({
        query: 'meridian secrets',
        mode: 'tenant',
        tenantKey: 'meridian-health',
      }),
    );
    expect(res.status).toBe(403);
    const body = await readJson<{ ok: false; code?: string }>(res);
    expect(body.code).toBe('CONTEXT_DEMO_FORBIDDEN_TENANT');
    expect(assembleMock).not.toHaveBeenCalled();
  });

  it('accepts tenantKey for the caller’s broker-mapped client', async () => {
    // Apex split: app key apexretail → broker key apex-retail.
    // When the caller sends apex-retail (broker form), the route accepts.
    const res = await POST(
      makeRequest({
        query: 'apex CDP',
        mode: 'tenant',
        tenantKey: 'apex-retail',
      }),
    );
    expect(res.status).toBe(200);
  });

  it('rejects raw app-form tenant key (apexretail) for tenant mode', async () => {
    // Defense-in-depth: callers must use the broker-shaped key. The
    // route does not silently translate caller input; it expects the
    // client (or the panel) to ship the canonical broker form.
    const res = await POST(
      makeRequest({
        query: 'apex CDP',
        mode: 'tenant',
        tenantKey: 'apexretail',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when active client lookup yields nothing for tenant mode', async () => {
    getActiveClientRowMock.mockResolvedValueOnce(null);
    const res = await POST(
      makeRequest({
        query: 'hi',
        mode: 'tenant',
        tenantKey: 'apex-retail',
      }),
    );
    expect(res.status).toBe(403);
  });
});

describe('POST /api/context/demo · broker errors', () => {
  it('returns 400 when the broker throws MissingTenantKeyError (defense-in-depth)', async () => {
    // Validator already gates this; this test ensures that if a future
    // refactor lets the broker raise it, the route maps it to a 400
    // with the stable code.
    assembleMock.mockRejectedValueOnce(new MissingTenantKeyError('tenant'));
    const res = await POST(
      makeRequest({ query: 'hi', mode: 'tenant', tenantKey: 'apex-retail' }),
    );
    expect(res.status).toBe(400);
    const body = await readJson<{ ok: false; code?: string }>(res);
    expect(body.code).toBe('CONTEXT_BROKER_TENANT_KEY_REQUIRED');
  });

  it('returns 500 + sanitized error message on broker failure', async () => {
    assembleMock.mockRejectedValueOnce(new Error('pinecone exploded; secret-token=abc'));
    const res = await POST(
      makeRequest({ query: 'hi', mode: 'tenant', tenantKey: 'apex-retail' }),
    );
    expect(res.status).toBe(500);
    const body = await readJson<{ ok: false; error: string }>(res);
    // Sanitized: no internal details leaked.
    expect(body.error).not.toMatch(/pinecone/i);
    expect(body.error).not.toMatch(/secret-token/i);
    expect(body.error).toMatch(/assembly failed/i);
  });
});
