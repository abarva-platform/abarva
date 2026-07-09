// Batch enqueue proof: POST /generate-phase enqueues one queued run per deliverable
// in the phase, scoped to the caller's tenant, and reports per-deliverable status.

const tenancy = { clientId: 'client-uuid', clientKey: 'skyharbor-air', userId: 'u1' };
const createCalls: Array<Record<string, unknown>> = [];
let createBehavior: (input: Record<string, unknown>) => { id: string } = () => ({ id: 'run-default' });

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not a tenancy error'); }),
}));
jest.mock('@/lib/deliverables/orchestrator/runs-repository', () => ({
  createDeliverableRun: jest.fn(async (input: Record<string, unknown>) => {
    createCalls.push(input);
    return createBehavior(input);
  }),
}));
const validateDeliverableTenantInvariant: jest.Mock<Promise<unknown>, unknown[]> = jest.fn(
  async () => ({ ok: true, sourceKind: 'move', sourceId: 'm-1' }),
);
jest.mock('@/lib/deliverables/orchestrator/tenant-invariant', () => ({
  validateDeliverableTenantInvariant: (...args: unknown[]) => validateDeliverableTenantInvariant(...(args as [])),
  tenantInvariantHttpStatus: () => 403,
}));

import { POST } from '../route';

function req(body: unknown) {
  return { json: async () => body } as never;
}

beforeEach(() => {
  createCalls.length = 0;
  createBehavior = (input) => ({ id: `run-${(input as { deliverableType: string }).deliverableType}` });
  validateDeliverableTenantInvariant.mockClear();
  validateDeliverableTenantInvariant.mockResolvedValue({ ok: true, sourceKind: 'move', sourceId: 'm-1' });
});

describe('POST /api/v1/deliverables/generate-phase', () => {
  it('400 when phase is out of range', async () => {
    const res = await POST(req({ moveId: 'm1', phase: 9, useCaseArchetype: 'ams' }));
    expect(res.status).toBe(400);
    expect(createCalls.length).toBe(0);
  });

  it('400 when moveId or archetype is missing', async () => {
    expect((await POST(req({ phase: 1, useCaseArchetype: 'ams' }))).status).toBe(400);
    expect((await POST(req({ moveId: 'm1', phase: 1 }))).status).toBe(400);
  });

  it('enqueues one queued run per phase deliverable, scoped to the tenant', async () => {
    // P3 has several deliverables, so this proves the batch is real (not a single enqueue).
    const res = await POST(req({ moveId: 'm-1', phase: 3, useCaseArchetype: 'ams', moveName: 'Contact Center AI', clientDisplayName: 'Apex' }));
    expect(res.status).toBe(202);
    const json = (await res.json()) as { phase: number; queued: number; total: number; deliverables: Array<Record<string, unknown>> };
    expect(json.phase).toBe(3);
    expect(json.total).toBeGreaterThanOrEqual(2);
    expect(json.queued).toBe(json.total);
    expect(json.deliverables.every((d) => d.status === 'queued' && typeof d.runId === 'string')).toBe(true);
    expect(validateDeliverableTenantInvariant).toHaveBeenCalledWith({
      module: 'moves',
      sourceArtifactRef: 'm-1',
      clientId: 'client-uuid',
      tenantKey: 'skyharbor-air',
    });
    // every enqueue carried the caller's tenant + the move as the source ref
    expect(createCalls.length).toBe(json.total);
    for (const c of createCalls) {
      expect(c.clientId).toBe('client-uuid');
      expect(c.tenantKey).toBe('skyharbor-air');
      expect(c.module).toBe('moves');
      expect((c.jobPayload as { sourceArtifactRef: string }).sourceArtifactRef).toBe('m-1');
    }
  });

  it('strips the internal phase-label prefix from decisionContext before it reaches the model (regression 2026-07-09)', async () => {
    // Live-observed: decisionContext = "<move> — P4 Roadmap & Business Case: <purpose>"
    // reached the model prompt verbatim, and the model faithfully echoed "P4" into the
    // client-facing narrative ("...at this stage of the P4 roadmap...") — which the
    // non_mechanical_writing gate then correctly blocked as a leaked phase label. The
    // registry's phaseLabel must never reach decisionContext with its "P<n>" prefix intact.
    await POST(req({ moveId: 'm-4', phase: 4, useCaseArchetype: 'risk_control', moveName: 'Legal and Vendor Contract Obligation Control' }));
    expect(createCalls.length).toBeGreaterThan(0);
    for (const c of createCalls) {
      const decisionContext = (c.jobPayload as { decisionContext: string }).decisionContext;
      expect(decisionContext).not.toMatch(/(?<![A-Za-z0-9-])P\d(?![A-Za-z0-9])/);
    }
  });

  it('reports a per-deliverable error without aborting the batch, staying 202 if any queued', async () => {
    let n = 0;
    createBehavior = () => {
      n += 1;
      if (n === 1) throw new Error('boom');
      return { id: `run-${n}` };
    };
    const res = await POST(req({ moveId: 'm-2', phase: 3, useCaseArchetype: 'ams' }));
    expect(res.status).toBe(202);
    const json = (await res.json()) as { queued: number; total: number; deliverables: Array<Record<string, unknown>> };
    expect(json.queued).toBe(json.total - 1);
    expect(json.deliverables.some((d) => d.status === 'error')).toBe(true);
  });

  it('500 when every deliverable fails to enqueue', async () => {
    createBehavior = () => { throw new Error('db down'); };
    const res = await POST(req({ moveId: 'm-3', phase: 1, useCaseArchetype: 'ams' }));
    expect(res.status).toBe(500);
  });

  it('403s before enqueueing when the Move belongs to another tenant', async () => {
    validateDeliverableTenantInvariant.mockResolvedValueOnce({
      ok: false,
      code: 'tenant_mismatch',
      sourceKind: 'move',
      sourceId: 'm-fc',
      detail: 'move source tenant does not match the active generation tenant.',
      expectedClientId: 'client-lakeshore',
      expectedTenantKey: 'lakeshore-holdings',
      actualClientId: 'client-first-capital',
      actualTenantKey: 'first-capital',
    });
    const res = await POST(req({ moveId: 'm-fc', phase: 3, useCaseArchetype: 'ams' }));
    expect(res.status).toBe(403);
    expect(createCalls).toHaveLength(0);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toBe('tenant_mismatch');
  });
});
