// List route proof: tenant-scoped, grouped, history opt-in.
const tenancy = { clientId: 'c1', clientKey: 'skyharbor-air', userId: 'u1' };
let listArgs: unknown[] = [];

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not tenancy'); }),
}));
jest.mock('@/lib/source/file-cabinet/repository', () => ({
  listSourceArtifacts: jest.fn(async (eventId: string, clientId: string, filter: unknown) => {
    listArgs = [eventId, clientId, filter];
    return [
      { id: 'a1', artifactGroup: 'generated', artifactType: 'rfp_package', title: 'AMS RFP', version: 1, status: 'preliminary', lifecycleState: 'current' },
      { id: 'a2', artifactGroup: 'approval', artifactType: 'approval_packet', title: 'Approval', version: 1, status: 'approved', lifecycleState: 'current' },
    ];
  }),
}));

import { GET } from '../route';

function req(url: string): import('next/server').NextRequest {
  return { url } as unknown as import('next/server').NextRequest;
}

beforeEach(() => { listArgs = []; });

describe('GET /api/v1/source/events/[eventId]/artifacts', () => {
  it('400 when eventId blank', async () => {
    const res = await GET(req('https://x/api'), { params: Promise.resolve({ eventId: ' ' }) });
    expect(res.status).toBe(400);
  });
  it('returns grouped artifacts scoped to the caller client', async () => {
    const res = await GET(req('https://x/api'), { params: Promise.resolve({ eventId: 'evt-1' }) });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, never>;
    expect((json as Record<string, unknown>).count).toBe(2);
    const grouped = (json as Record<string, Record<string, unknown[]>>).grouped;
    expect(grouped.generated).toHaveLength(1);
    expect(grouped.approval).toHaveLength(1);
    expect(listArgs[1]).toBe('c1'); // client-scoped
  });
  it('passes includeHistory + group filter through', async () => {
    await GET(req('https://x/api?includeHistory=1&group=generated'), { params: Promise.resolve({ eventId: 'evt-1' }) });
    expect((listArgs[2] as { includeHistory: boolean; artifactGroup: string }).includeHistory).toBe(true);
    expect((listArgs[2] as { artifactGroup: string }).artifactGroup).toBe('generated');
  });
});
