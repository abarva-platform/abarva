import { expect, test } from '@playwright/test';

const baseUrl = process.env.P1_SMOKE_BASE_URL || process.env.BASE_URL;
const authCookie = process.env.P1_SMOKE_AUTH_COOKIE;

test.describe('P1 corpus data layer smoke', () => {
  test.skip(!baseUrl || !authCookie, 'P1_SMOKE_BASE_URL/BASE_URL and P1_SMOKE_AUTH_COOKIE are required.');

  test('draft to review to approve to publish returns retrievable corpus record', async ({ request }) => {
    const suffix = Date.now();
    const headers = {
      Cookie: authCookie ?? '',
      'Content-Type': 'application/json',
    };
    const create = await request.post(`${baseUrl}/api/corpus`, {
      headers,
      data: {
        slug: `p1-smoke-${suffix}`,
        title: `P1 Smoke ${suffix}`,
        category: 'smoke',
        confidence: 0.9,
        markdownBody: 'A smoke pattern with quantified claim, evidence, counterargument, boundary condition, failure mode, maturity linkage, vertical overlay, related pattern, and synthesis.',
        structured: {
          claims: [{ claim: 'Smoke flow creates a draft and publishes it.' }],
          evidence: [{ source: 'P1 smoke', url: 'https://abarva.ai' }, { source: 'Depth stub' }, { source: 'Workflow' }],
          counterarguments: [{ argument: 'Only verifies route contract.' }, { argument: 'External indexing depends on Azure env.' }],
          synthesis: { soWhat: 'The corpus authoring loop is callable end to end.' },
        },
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = await create.json();
    expect(created.ok).toBe(true);
    expect(created.data.pattern.status).toBe('draft');
    const id = created.data.pattern.id;

    const submit = await request.post(`${baseUrl}/api/corpus/${id}/submit`, { headers });
    expect(submit.ok()).toBeTruthy();
    expect((await submit.json()).data.pattern.status).toBe('in_review');

    const approve = await request.post(`${baseUrl}/api/corpus/${id}/approve`, { headers });
    expect(approve.ok()).toBeTruthy();
    expect((await approve.json()).data.pattern.status).toBe('approved');

    const publish = await request.post(`${baseUrl}/api/corpus/${id}/publish`, { headers });
    expect(publish.ok()).toBeTruthy();
    const published = await publish.json();
    expect(published.data.pattern.status).toBe('published');
    expect(published.data.pattern.searchDocId).toBeTruthy();

    const search = await request.get(`${baseUrl}/api/corpus/search?q=P1%20Smoke&category=smoke`, { headers });
    expect(search.ok()).toBeTruthy();
    const body = await search.json();
    expect(body.ok).toBe(true);
    expect(body.data.hits.some((hit: { id: string }) => hit.id === id)).toBe(true);
  });
});
