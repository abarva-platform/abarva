const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();

jest.mock('@/app/api/v1/_intel-auth', () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

describe('pattern-deliverable query layer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({ clientId: 'client_1', userId: 'user_1' });
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
  });

  it('returns Morrison deliverables for the owned-brand pattern using the stable query shape', async () => {
    const { getPatternDeliverablesQuery } = await import('@/lib/intelligence/pattern-deliverable-query');
    const result = await getPatternDeliverablesQuery('owned-brand-margin-recovery');

    expect(result).toBeTruthy();
    expect(result?.pattern.slug).toBe('owned-brand-margin-recovery');
    expect(result?.source.mode).toBe('seed_manifest');
    expect(result?.citationCount).toBeGreaterThan(0);
    expect(result?.deliverables.some((deliverable) => (
      deliverable.id === 'APX-01:P3:D17:required'
      && deliverable.program.slug === 'morrison-owned-brand-margin-recovery'
      && deliverable.routePath === '/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d17-decision-memo-for-cxo'
    ))).toBe(true);
  });

  it('returns the ambient pattern for Meridian D17 using the deliverable lookup id', async () => {
    const { getDeliverablePatternsQuery } = await import('@/lib/intelligence/pattern-deliverable-query');
    const result = await getDeliverablePatternsQuery('MRD-01:P3:D17:required');

    expect(result.kind).toBe('resolved');
    if (result.kind !== 'resolved') return;

    expect(result.data.deliverable.program.slug).toBe('ambient-clinical-value-chain-activation');
    expect(result.data.patterns.map((pattern) => pattern.slug)).toContain('ambient-clinical-value-chain');
    expect(result.data.citationCount).toBeGreaterThan(0);
  });

  it('surfaces ambiguous generic deliverable identifiers instead of guessing', async () => {
    const { getDeliverablePatternsQuery } = await import('@/lib/intelligence/pattern-deliverable-query');
    const result = await getDeliverablePatternsQuery('D17');

    expect(result.kind).toBe('ambiguous');
    if (result.kind !== 'ambiguous') return;

    expect(result.matches.length).toBeGreaterThan(1);
    expect(result.matches.some((deliverable) => deliverable.id === 'APX-01:P3:D17:required')).toBe(true);
    expect(result.matches.some((deliverable) => deliverable.id === 'MRD-01:P3:D17:required')).toBe(true);
  });
});

describe('pattern-deliverable API routes', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({ clientId: 'client_1', userId: 'user_1' });
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
  });

  it('exports GET handlers for both contract routes', async () => {
    const patternRoute = await import('@/app/api/v1/patterns/[patternSlug]/deliverables/route');
    const deliverableRoute = await import('@/app/api/v1/deliverables/[deliverableId]/patterns/route');

    expect(typeof patternRoute.GET).toBe('function');
    expect(typeof deliverableRoute.GET).toBe('function');
  });

  it('returns 401 from the pattern route when tenancy fails', async () => {
    tenancyErrorResponse.mockReturnValueOnce(Response.json({ error: 'unauthenticated' }, { status: 401 }));
    requireTenancy.mockRejectedValueOnce(new Error('unauthenticated'));

    const { GET } = await import('@/app/api/v1/patterns/[patternSlug]/deliverables/route');
    const response = await GET(
      new Request('http://localhost/api/v1/patterns/owned-brand-margin-recovery/deliverables'),
      { params: Promise.resolve({ patternSlug: 'owned-brand-margin-recovery' }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' });
  });

  it('returns deliverables for a pattern route happy path', async () => {
    const { GET } = await import('@/app/api/v1/patterns/[patternSlug]/deliverables/route');
    const response = await GET(
      new Request('http://localhost/api/v1/patterns/ambient-clinical-value-chain/deliverables'),
      { params: Promise.resolve({ patternSlug: 'ambient-clinical-value-chain' }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.pattern.slug).toBe('ambient-clinical-value-chain');
    expect(body.deliverables.some((deliverable: { id: string }) => deliverable.id === 'MRD-01:P3:D17:required')).toBe(true);
  });

  it('returns patterns for a deliverable route happy path', async () => {
    const { GET } = await import('@/app/api/v1/deliverables/[deliverableId]/patterns/route');
    const response = await GET(
      new Request('http://localhost/api/v1/deliverables/APX-01%3AP3%3AD17%3Arequired/patterns'),
      { params: Promise.resolve({ deliverableId: 'APX-01:P3:D17:required' }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deliverable.id).toBe('APX-01:P3:D17:required');
    expect(body.patterns.map((pattern: { slug: string }) => pattern.slug)).toContain('owned-brand-margin-recovery');
  });

  it('returns 409 when the deliverable lookup is ambiguous', async () => {
    const { GET } = await import('@/app/api/v1/deliverables/[deliverableId]/patterns/route');
    const response = await GET(
      new Request('http://localhost/api/v1/deliverables/D17/patterns'),
      { params: Promise.resolve({ deliverableId: 'D17' }) },
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe('ambiguous_deliverable_id');
    expect(Array.isArray(body.matches)).toBe(true);
    expect(body.matches.length).toBeGreaterThan(1);
  });
});

export {};
