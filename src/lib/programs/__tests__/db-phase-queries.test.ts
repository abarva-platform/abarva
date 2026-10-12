const mockCanReadProgram = jest.fn();
const mockAzureSelect = jest.fn();
const mockAzureMaybeSingle = jest.fn();
const mockBuildStrategicMove = jest.fn();

jest.mock('../transformers', () => ({
  buildStrategicMove: (...args: unknown[]) => mockBuildStrategicMove(...args),
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  canReadProgram: (...args: unknown[]) => mockCanReadProgram(...args),
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: (...args: unknown[]) => mockAzureSelect(...args),
    maybeSingle: (...args: unknown[]) => mockAzureMaybeSingle(...args),
  },
}));

import { getEngagementWithPhaseData } from '../db-phase-queries';
import { getStrategicMoveById, getProgramById, getModuleState, getPhaseSnapshots } from '../queries';
import { createPhasePageReadSet } from '../phase-page-gate-reads';
import type { TenancyCtx, ProgramCore } from '../types.db';

describe('getEngagementWithPhaseData', () => {
  beforeEach(() => {
    mockCanReadProgram.mockReset();
    mockAzureSelect.mockReset();
    mockAzureMaybeSingle.mockReset();
    mockCanReadProgram.mockResolvedValue(true);
    mockAzureMaybeSingle.mockResolvedValue({
      id: 'program-1',
      client_id: 'client-1',
      name: 'Apex CDP',
      status: 'active',
      lifecycle_state: 'in_progress',
      current_phase: 3,
      program_archetype: 'ai_transformation',
      maestro_oversight_level: 'standard',
      sponsor_person_id: 'person-1',
      maestro_person_id: null,
      charter: { objective: 'Improve loyalty' },
    });
    mockAzureSelect.mockImplementation((request: { table: string }) => {
      switch (request.table) {
        case 'program_milestones':
          return Promise.resolve([{ id: 'milestone-1', name: 'Gate 3', status: 'open', target_date: null, phase_number: 3 }]);
        case 'program_risks':
          return Promise.resolve([]);
        case 'persons':
          return Promise.resolve([{ id: 'person-1', name: 'Priya Shah', role: 'CIO' }]);
        case 'evidence':
          return Promise.resolve([{ id: 'evidence-1', summary: 'Evidence', evidence_type: 'note', confidence_level: 'high', observed_at: null, created_at: '2026-05-01T00:00:00Z' }]);
        case 'engagement_phases':
          return Promise.resolve([{ id: 'phase-1' }]);
        case 'phase_approvals':
          return Promise.resolve([{ id: 'approval-1', action: 'approved', actor_name: 'Sponsor', created_at: '2026-05-01T00:00:00Z' }]);
        case 'program_modules':
        case 'program_evidence_items':
        case 'deliverables_v2':
        case 'program_audit_log':
          return Promise.resolve([]);
        default:
          return Promise.reject(new Error(`unexpected table ${request.table}`));
      }
    });
  });

  it('assembles phase data through azureRead after RBAC', async () => {
    const result = await getEngagementWithPhaseData(
      'program-1',
      'client-1',
      { clientId: 'client-1', userId: 'user-1' },
    );

    expect(mockCanReadProgram).toHaveBeenCalledWith(
      { clientId: 'client-1', userId: 'user-1' },
      'program-1',
    );
    expect(mockAzureMaybeSingle).toHaveBeenCalledWith(expect.objectContaining({
      table: 'engagements',
      where: { id: 'program-1', client_id: 'client-1' },
    }));
    expect(result?.engagement.name).toBe('Apex CDP');
    expect(result?.engagement.sponsor).toEqual({ name: 'Priya Shah', role: 'CIO' });
    expect(result?.gateApprovals).toHaveLength(1);
  });

  it('returns null when RBAC denies access', async () => {
    mockCanReadProgram.mockResolvedValue(false);

    await expect(getEngagementWithPhaseData(
      'program-1',
      'client-1',
      { clientId: 'client-1', userId: 'user-1' },
    )).resolves.toBeNull();
    expect(mockAzureMaybeSingle).not.toHaveBeenCalled();
  });
});

describe("getStrategicMoveById with a request-scoped canonical loader", () => {
  const ctx: TenancyCtx = { clientId: "client-1", userId: "user-1" };
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanReadProgram.mockResolvedValue(false);
    mockBuildStrategicMove.mockResolvedValue({ id: "move-1" });
  });

  it("reuses the loaded program and passes shared snapshots to its projection", async () => {
    const program = { id: "move-1", clientId: "client-1" } as ProgramCore;
    const loadProgram = jest.fn(async () => program);
    const loadPhaseSnapshots = jest.fn(async () => []);
    const options = {
      evaluateGateCriteria: false,
      loadProgram,
      loadPhaseSnapshots,
    };
    expect(await getStrategicMoveById(ctx, "move-1", options)).toEqual({
      id: "move-1",
    });
    expect(loadProgram).toHaveBeenCalledTimes(1);
    expect(loadProgram).toHaveBeenCalledWith(ctx, "move-1", options);
    expect(mockBuildStrategicMove).toHaveBeenCalledWith(ctx, program, options);
    expect(mockCanReadProgram).not.toHaveBeenCalled();
  });

  it("does not project an inaccessible program or retry an unavailable shared read", async () => {
    const absent = jest.fn(async () => null);
    expect(
      await getStrategicMoveById(ctx, "move-1", { loadProgram: absent }),
    ).toBeNull();
    const error = new Error("Move read unavailable");
    const failed = jest.fn(async () => {
      throw error;
    });
    await expect(
      getStrategicMoveById(ctx, "move-1", { loadProgram: failed }),
    ).rejects.toBe(error);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(mockBuildStrategicMove).not.toHaveBeenCalled();
  });

  it("keeps the canonical RBAC check on the default path", async () => {
    expect(await getStrategicMoveById(ctx, "move-1")).toBeNull();
    expect(mockCanReadProgram).toHaveBeenCalledWith(ctx, "move-1");
    expect(mockBuildStrategicMove).not.toHaveBeenCalled();
  });

  it("shares one canonical denial across program, module and snapshot readers", async () => {
    const readSet = createPhasePageReadSet(ctx, 'move-1');
    const results = await Promise.allSettled([
      getProgramById(ctx, 'move-1', { readSet }),
      getModuleState(ctx, 'move-1', { readSet }),
      getPhaseSnapshots(ctx, 'move-1', undefined, { readSet }),
    ]);
    expect(mockCanReadProgram).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual({ status: 'fulfilled', value: null });
    for (const result of results.slice(1)) {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') expect(String(result.reason)).toContain('not accessible');
    }
  });

  it("propagates the same failed access read without treating it as a denial or retrying", async () => {
    const error = new Error('Access read unavailable');
    mockCanReadProgram.mockRejectedValue(error);
    const readSet = createPhasePageReadSet(ctx, 'move-1');
    const results = await Promise.allSettled([
      getProgramById(ctx, 'move-1', { readSet }),
      getModuleState(ctx, 'move-1', { readSet }),
      getPhaseSnapshots(ctx, 'move-1', undefined, { readSet }),
    ]);
    expect(mockCanReadProgram).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array.from({length: 3}, () => ({status: 'rejected', reason: error})));
  });
});
