/**
 * @jest-environment node
 */

const requireTenancyMock = jest.fn();
jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: () => Response.json({ error: 'unauthenticated' }, { status: 401 }),
}));

const listContextInsightsMock = jest.fn();
jest.mock('@/lib/intelligence/context-insights', () => ({
  listContextInsights: (...args: unknown[]) => listContextInsightsMock(...args),
}));

import { GET } from '../route';

function req(query = ''): Request {
  return new Request(`http://localhost/api/intelligence/insights${query}`);
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({
    clientId: 'client-meridian',
    clientKey: 'meridian',
    userId: 'user-1',
  });
  listContextInsightsMock.mockResolvedValue([
    {
      id: 'ins-1',
      tenantKey: 'meridian-health',
      headline: 'Data foundation gap blocks automation',
      derivedFromRecordIds: ['rec-1'],
      derivedFromFactIds: ['fact-1'],
    },
  ]);
});

describe('GET /api/intelligence/insights', () => {
  it('requires tenancy and returns active-client insights only', async () => {
    const res = await GET(req('?limit=5&materiality=high&domain=Data%20quality') as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(listContextInsightsMock).toHaveBeenCalledWith({
      tenantKey: 'meridian-health',
      domain: 'Data quality',
      materiality: 'high',
      limit: 5,
    });
    expect(body).toMatchObject({
      tenantKey: 'meridian-health',
      totalActive: 1,
      insights: [
        {
          id: 'ins-1',
          tenantKey: 'meridian-health',
          derivedFromRecordIds: ['rec-1'],
          derivedFromFactIds: ['fact-1'],
        },
      ],
    });
  });

  it('does not honor arbitrary tenantKey query params', async () => {
    await GET(req('?tenantKey=lakeshore') as never);
    expect(listContextInsightsMock).toHaveBeenCalledWith(expect.objectContaining({
      tenantKey: 'meridian-health',
    }));
  });

  it('maps tenancy failures to auth responses', async () => {
    requireTenancyMock.mockRejectedValue(new Error('nope'));
    const res = await GET(req() as never);
    expect(res.status).toBe(401);
  });
});
