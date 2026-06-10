// Route proof: POST /api/v1/deliverables/generate validates input, returns 422 with
// blockers when the quality gate refuses, and 200 with the artifact ref on success.
// Auth + service are mocked.

const tenancy = { clientId: 'client-uuid', clientKey: 'skyharbor-air', userId: 'u1' };
let serviceResult: Record<string, unknown> = { ok: true };

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not a tenancy error'); }),
}));
jest.mock('@/lib/deliverables/orchestrator/generate-service', () => ({
  runDeliverableForTenant: jest.fn(async () => serviceResult),
}));

import { POST } from '../route';

function reqWith(body: unknown): import('next/server').NextRequest {
  return { json: async () => body } as unknown as import('next/server').NextRequest;
}

const validBody = {
  module: 'source', useCaseArchetype: 'AMS_IT_OUTSOURCING', deliverableType: 'rfp_package',
  sourceArtifactRef: 'evt-1', decisionContext: 'approve issuance',
};

describe('POST /api/v1/deliverables/generate', () => {
  it('400 when module is missing/invalid', async () => {
    const res = await POST(reqWith({ ...validBody, module: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('400 when sourceArtifactRef is missing', async () => {
    const { sourceArtifactRef, ...rest } = validBody;
    void sourceArtifactRef;
    const res = await POST(reqWith(rest));
    expect(res.status).toBe(400);
  });

  it('422 with blockers when the quality gate refuses', async () => {
    serviceResult = { ok: false, blockers: ['no source register'], blockedReason: 'quality gate blocked export' };
    const res = await POST(reqWith(validBody));
    expect(res.status).toBe(422);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toBe('quality_gate_blocked');
    expect(json.blockers).toContain('no source register');
  });

  it('200 with artifact ref on success', async () => {
    serviceResult = { ok: true, artifactId: 'art-9', blobUrl: '/api/v1/artifacts/art-9', qualityPass: true, sectionCount: 12, retrievedEvidence: 7, warnings: [] };
    const res = await POST(reqWith(validBody));
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.success).toBe(true);
    expect(json.artifactId).toBe('art-9');
    expect(json.sectionCount).toBe(12);
  });
});
