/**
 * POST /api/context/demo · CB-4 unit tests
 *
 * Verifies request validation, mode parsing, single-mode and
 * mode='all' branching, MissingTenantKeyError handling, and
 * payload shape (bundle + summary).
 */

import { POST } from '../route';

function makeRequest(body: unknown): import('next/server').NextRequest {
  return new Request('http://test/api/context/demo', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as import('next/server').NextRequest;
}

async function readJson(res: Awaited<ReturnType<typeof POST>>): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

describe('POST /api/context/demo — request validation', () => {
  it('rejects invalid JSON with 400', async () => {
    const bad = new Request('http://test/api/context/demo', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    }) as unknown as import('next/server').NextRequest;
    const res = await POST(bad);
    expect(res.status).toBe(400);
    const json = await readJson(res);
    expect(json.error).toMatch(/Invalid JSON/);
  });

  it('rejects empty query with 400', async () => {
    const res = await POST(makeRequest({ query: '', mode: 'corpus' }));
    expect(res.status).toBe(400);
    const json = await readJson(res);
    expect(json.error).toMatch(/query/);
  });

  it('rejects missing query with 400', async () => {
    const res = await POST(makeRequest({ mode: 'corpus' }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid mode with 400', async () => {
    const res = await POST(makeRequest({ query: 'hi', mode: 'banana' }));
    expect(res.status).toBe(400);
    const json = await readJson(res);
    expect(json.error).toMatch(/mode/);
  });

  it("rejects missing mode with 400", async () => {
    const res = await POST(makeRequest({ query: 'hi' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/context/demo — single-mode response shape', () => {
  it('returns a generic-mode bundle with a summary', async () => {
    const res = await POST(
      makeRequest({ query: 'why do AI pilots fail?', mode: 'generic' }),
    );
    expect(res.status).toBe(200);
    const json = await readJson(res);
    expect(json.bundle).toBeDefined();
    expect((json.bundle as { mode: string }).mode).toBe('generic');
    expect(json.summary).toBeDefined();
    const summary = json.summary as Record<string, number>;
    expect(summary.factCount).toBe(0);
    expect(summary.semanticChunkCount).toBe(0);
    expect(summary.corpusPatternCount).toBe(0);
  });

  it('returns a corpus-mode bundle (corpus retrieval pending CB-6 → empty + warning)', async () => {
    const res = await POST(
      makeRequest({ query: 'patterns for CDP rollouts', mode: 'corpus' }),
    );
    expect(res.status).toBe(200);
    const json = await readJson(res);
    const bundle = json.bundle as { mode: string; warnings: string[]; corpusPatterns: unknown[] };
    expect(bundle.mode).toBe('corpus');
    expect(bundle.corpusPatterns).toEqual([]);
    expect(bundle.warnings.join('|').toLowerCase()).toContain('corpus');
  });

  it('returns 400 when tenant mode is requested without tenantKey', async () => {
    const res = await POST(
      makeRequest({ query: 'why is apex CDP at risk?', mode: 'tenant' }),
    );
    expect(res.status).toBe(400);
    const json = await readJson(res);
    expect(json.code).toBe('CONTEXT_BROKER_TENANT_KEY_REQUIRED');
  });

  it('returns 400 when full mode is requested without tenantKey', async () => {
    const res = await POST(
      makeRequest({ query: 'compare apex vs corpus', mode: 'full' }),
    );
    expect(res.status).toBe(400);
    const json = await readJson(res);
    expect(json.code).toBe('CONTEXT_BROKER_TENANT_KEY_REQUIRED');
  });

  it('accepts a tenant-mode request with tenantKey', async () => {
    const res = await POST(
      makeRequest({
        query: 'apex CDP risk profile',
        mode: 'tenant',
        tenantKey: 'apex-retail',
      }),
    );
    expect(res.status).toBe(200);
    const json = await readJson(res);
    const bundle = json.bundle as { mode: string; tenantKey: string };
    expect(bundle.mode).toBe('tenant');
    expect(bundle.tenantKey).toBe('apex-retail');
  });
});

describe("POST /api/context/demo — mode='all' branching", () => {
  it('returns four bundles (generic + corpus + tenant + full) when tenantKey is supplied', async () => {
    const res = await POST(
      makeRequest({
        query: 'apex CDP risk profile',
        mode: 'all',
        tenantKey: 'apex-retail',
      }),
    );
    expect(res.status).toBe(200);
    const json = await readJson(res);
    const bundles = json.bundles as Record<string, { mode: string } | null>;
    expect(bundles.generic?.mode).toBe('generic');
    expect(bundles.corpus?.mode).toBe('corpus');
    expect(bundles.tenant?.mode).toBe('tenant');
    expect(bundles.full?.mode).toBe('full');
  });

  it("returns null tenant + full bundles when tenantKey is missing in mode='all'", async () => {
    const res = await POST(
      makeRequest({ query: 'why do AI pilots fail?', mode: 'all' }),
    );
    expect(res.status).toBe(200);
    const json = await readJson(res);
    const bundles = json.bundles as Record<string, unknown>;
    expect(bundles.generic).not.toBeNull();
    expect(bundles.corpus).not.toBeNull();
    expect(bundles.tenant).toBeNull();
    expect(bundles.full).toBeNull();
  });

  it('summaries match the bundles', async () => {
    const res = await POST(
      makeRequest({ query: 'hi', mode: 'all', tenantKey: 'apex-retail' }),
    );
    expect(res.status).toBe(200);
    const json = await readJson(res);
    const summaries = json.summaries as Record<string, { mode: string } | null>;
    expect(summaries.generic?.mode).toBe('generic');
    expect(summaries.corpus?.mode).toBe('corpus');
    expect(summaries.tenant?.mode).toBe('tenant');
    expect(summaries.full?.mode).toBe('full');
  });
});

describe('POST /api/context/demo — limits passthrough', () => {
  it('forwards maxFacts / maxChunks / graphTraversalDepth to the broker', async () => {
    // Smoke: the broker accepts these without throwing. Real
    // limit enforcement is tested in the broker's own unit
    // tests.
    const res = await POST(
      makeRequest({
        query: 'apex',
        mode: 'tenant',
        tenantKey: 'apex-retail',
        maxFacts: 3,
        maxChunks: 2,
        graphTraversalDepth: 1,
      }),
    );
    expect(res.status).toBe(200);
  });
});
