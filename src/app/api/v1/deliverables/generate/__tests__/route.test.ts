// Route proof: POST /api/v1/deliverables/generate validates input and ENQUEUES a run
// (202 + runId + status 'queued') carrying the full job payload — and does NO model work
// in the request (the durable worker runs the generation). Auth + runs-repo are mocked;
// the generation engine is mocked purely to assert it is NEVER called from the route.

const tenancy = {
  clientId: 'client-uuid',
  clientKey: 'skyharbor-air',
  userId: 'u1',
};
const created: Array<Record<string, unknown>> = [];
const mockLoadApprovedMoveEvidenceSnapshot = jest.fn();

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error('not a tenancy error');
  }),
}));
jest.mock('@/lib/deliverables/orchestrator/runs-repository', () => ({
  createDeliverableRun: jest.fn(async (input: Record<string, unknown>) => {
    created.push(input);
    return { id: 'run-1' };
  }),
}));
jest.mock('@/lib/programs/approved-move-evidence-snapshot', () => ({
  loadApprovedMoveEvidenceSnapshot: (...args: unknown[]) => mockLoadApprovedMoveEvidenceSnapshot(...args),
}));
const validateDeliverableTenantInvariant: jest.Mock<Promise<unknown>, unknown[]> = jest.fn(async () => ({
  ok: true,
  sourceKind: 'unsupported',
  sourceId: null,
}));
jest.mock('@/lib/deliverables/orchestrator/tenant-invariant', () => ({
  validateDeliverableTenantInvariant: (...args: unknown[]) => validateDeliverableTenantInvariant(...(args as [])),
  tenantInvariantHttpStatus: () => 403,
}));
const runDeliverableForTenant = jest.fn(async () => ({ ok: true }));
jest.mock('@/lib/deliverables/orchestrator/generate-service', () => ({
  runDeliverableForTenant: (...args: unknown[]) => runDeliverableForTenant(...(args as [])),
}));

import { POST } from '../route';

function reqWith(body: unknown): import('next/server').NextRequest {
  return {
    json: async () => body,
  } as unknown as import('next/server').NextRequest;
}
const validBody = {
  module: 'source',
  useCaseArchetype: 'AMS_IT_OUTSOURCING',
  deliverableType: 'rfp_package',
  sourceArtifactRef: 'evt-1',
  decisionContext: 'approve issuance',
  clientDisplayName: 'SkyHarbor Air',
  initiativeDisplayName: 'AMS resourcing',
};

beforeEach(() => {
  created.length = 0;
  runDeliverableForTenant.mockClear();
  validateDeliverableTenantInvariant.mockClear();
  validateDeliverableTenantInvariant.mockResolvedValue({
    ok: true,
    sourceKind: 'unsupported',
    sourceId: null,
  });
  mockLoadApprovedMoveEvidenceSnapshot.mockReset();
  mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValue({
    revision: 'approved-revision-1',
    approvedEvidenceCount: 1,
    rows: [],
  });
});

describe('POST /api/v1/deliverables/generate (enqueue-only)', () => {
  it('400 when module invalid', async () => {
    const res = await POST(reqWith({ ...validBody, module: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('400 when decisionContext missing', async () => {
    const { decisionContext, ...rest } = validBody;
    void decisionContext;
    const res = await POST(reqWith(rest));
    expect(res.status).toBe(400);
  });

  it('202 with runId + status queued, persists job payload, and does NO model work', async () => {
    const res = await POST(reqWith(validBody));
    expect(res.status).toBe(202);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.runId).toBe('run-1');
    expect(json.status).toBe('queued');

    expect(created).toHaveLength(1);
    expect(created[0].clientId).toBe('client-uuid');
    expect(created[0].tenantKey).toBe('skyharbor-air');
    expect(created[0].archetype).toBe('AMS_IT_OUTSOURCING');
    expect(validateDeliverableTenantInvariant).toHaveBeenCalledWith({
      module: 'source',
      sourceArtifactRef: 'evt-1',
      clientId: 'client-uuid',
      tenantKey: 'skyharbor-air',
    });

    const payload = created[0].jobPayload as Record<string, unknown>;
    expect(payload).toMatchObject({
      module: 'source',
      useCaseArchetype: 'AMS_IT_OUTSOURCING',
      deliverableType: 'rfp_package',
      decisionContext: 'approve issuance',
      sourceArtifactRef: 'evt-1',
      clientDisplayName: 'SkyHarbor Air',
      initiativeDisplayName: 'AMS resourcing',
    });

    // The request must not run the generation engine — that is the worker's job.
    expect(runDeliverableForTenant).not.toHaveBeenCalled();
  });

  it('binds a queued Moves run to the current approved-evidence revision', async () => {
    const res = await POST(
      reqWith({
        ...validBody,
        module: 'moves',
        deliverableType: 'charter',
        sourceArtifactRef: 'move-1',
      }),
    );

    expect(res.status).toBe(202);
    expect(mockLoadApprovedMoveEvidenceSnapshot).toHaveBeenCalledWith({
      tenantKey: 'skyharbor-air',
      moveId: 'move-1',
    });
    expect(created[0]?.jobPayload as Record<string, unknown>).toEqual(
      expect.objectContaining({
        evidenceSnapshotHash: 'approved-revision-1',
        phase: 1,
      }),
    );
  });

  it('fails closed when a Moves deliverable has no unique canonical phase', async () => {
    const res = await POST(
      reqWith({
        ...validBody,
        module: 'moves',
        sourceArtifactRef: 'move-1',
      }),
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({
      error: 'moves_deliverable_phase_unresolved',
    });
    expect(created).toHaveLength(0);
  });

  it('does not queue a Moves run when the evidence revision cannot be verified', async () => {
    mockLoadApprovedMoveEvidenceSnapshot.mockResolvedValueOnce(null);

    const res = await POST(
      reqWith({
        ...validBody,
        module: 'moves',
        deliverableType: 'charter',
        sourceArtifactRef: 'move-1',
      }),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({
      error: 'evidence_snapshot_unavailable',
    });
    expect(created).toHaveLength(0);
  });

  it('403 when the source artifact belongs to another tenant', async () => {
    validateDeliverableTenantInvariant.mockResolvedValueOnce({
      ok: false,
      code: 'tenant_mismatch',
      sourceKind: 'move',
      sourceId: 'move-fc',
      detail: 'move source tenant does not match the active generation tenant.',
      expectedClientId: 'client-lakeshore',
      expectedTenantKey: 'lakeshore-holdings',
      actualClientId: 'client-first-capital',
      actualTenantKey: 'first-capital',
    });

    const res = await POST(
      reqWith({
        ...validBody,
        module: 'moves',
        deliverableType: 'charter',
        sourceArtifactRef: 'move-fc',
      }),
    );
    expect(res.status).toBe(403);
    expect(created).toHaveLength(0);
    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toBe('tenant_mismatch');
    expect(json.actualTenantKey).toBe('first-capital');
  });
});
