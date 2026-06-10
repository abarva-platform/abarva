// Route proof: POST /api/v1/deliverables/generate validates input and starts an async
// run (202 + runId), creating a run row. Auth + runs-repo + service are mocked.

const tenancy = { clientId: 'client-uuid', clientKey: 'skyharbor-air', userId: 'u1' };
const created: Array<Record<string, unknown>> = [];

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not a tenancy error'); }),
}));
jest.mock('@/lib/deliverables/orchestrator/runs-repository', () => ({
  createDeliverableRun: jest.fn(async (input: Record<string, unknown>) => { created.push(input); return { id: 'run-1' }; }),
  completeDeliverableRun: jest.fn(async () => undefined),
}));
jest.mock('@/lib/deliverables/orchestrator/generate-service', () => ({
  runDeliverableForTenant: jest.fn(async () => ({ ok: true, artifactId: 'art-1', sectionCount: 10, retrievedEvidence: 5, warnings: [] })),
}));

import { POST } from '../route';

function reqWith(body: unknown): import('next/server').NextRequest {
  return { json: async () => body } as unknown as import('next/server').NextRequest;
}
const validBody = {
  module: 'source', useCaseArchetype: 'AMS_IT_OUTSOURCING', deliverableType: 'rfp_package',
  sourceArtifactRef: 'evt-1', decisionContext: 'approve issuance',
};

beforeEach(() => { created.length = 0; });

describe('POST /api/v1/deliverables/generate (async)', () => {
  it('400 when module invalid', async () => {
    const res = await POST(reqWith({ ...validBody, module: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('400 when decisionContext missing', async () => {
    const { decisionContext, ...rest } = validBody; void decisionContext;
    const res = await POST(reqWith(rest));
    expect(res.status).toBe(400);
  });

  it('202 with runId and creates a run row for the tenant', async () => {
    const res = await POST(reqWith(validBody));
    expect(res.status).toBe(202);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.runId).toBe('run-1');
    expect(json.status).toBe('running');
    expect(created).toHaveLength(1);
    expect(created[0].clientId).toBe('client-uuid');
    expect(created[0].tenantKey).toBe('skyharbor-air');
    expect(created[0].archetype).toBe('AMS_IT_OUTSOURCING');
  });
});
