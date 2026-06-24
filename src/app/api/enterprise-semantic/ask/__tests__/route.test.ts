import { GET, POST } from '../route';

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(async () => ({ id: 'user-test' })),
}));

jest.mock('@/lib/tenant/resolveTenant', () => ({
  resolveTenant: jest.fn(async () => ({
    appClientKey: 'morganstreet',
    canonicalKey: 'morganstreet',
    displayName: 'Morgan Street',
    source: 'body',
  })),
}));

jest.mock('@/lib/enterprise-context/semantic-answer-runtime', () => ({
  answerEnterpriseSemanticQuestionFromAzure: jest.fn(async (input) => ({
    serviceName: 'Enterprise Semantic Question Layer',
    tenantKey: input.tenantKey,
    question: input.question,
    module: input.module,
    intent: 'inventory',
    directAnswer: 'The semantic layer has 6,200 records.',
    basis: 'tenant_data_volumetrics',
    facts: [],
    citations: [],
    caveats: [],
    clientToComplete: [],
    confidence: 'high',
    readinessStatus: 'answerable',
    generatedAt: '2026-06-24T12:00:00.000Z',
  })),
}));

describe('/api/enterprise-semantic/ask', () => {
  it('returns a semantic answer for GET', async () => {
    const response = await GET(new Request('https://app.test/api/enterprise-semantic/ask?q=what%20data&clientKey=morganstreet&module=home') as never);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.tenant.canonicalKey).toBe('morganstreet');
    expect(body.answer.serviceName).toBe('Enterprise Semantic Question Layer');
  });

  it('validates POST body', async () => {
    const response = await POST(new Request('https://app.test/api/enterprise-semantic/ask', {
      method: 'POST',
      body: JSON.stringify({ clientKey: 'morganstreet' }),
    }) as never);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'bad_request' });
  });
});
