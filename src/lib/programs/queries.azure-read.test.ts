import {
  getModuleState,
  getOpenMaestroFlags,
  getPendingApprovals,
  getPhaseSnapshots,
  getWorkItems,
} from './queries';
import { azureRead } from '@/lib/data-plane/azureRead';
import { canReadProgram } from '@/lib/auth/program-access-policy';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  allowedProgramIdsForUser: jest.fn(),
  canReadProgram: jest.fn(),
}));

const queryMock = azureRead.query as jest.MockedFunction<typeof azureRead.query>;
const canReadProgramMock = canReadProgram as jest.MockedFunction<typeof canReadProgram>;

const ctx = { clientId: 'apexretail', userId: 'user-1' };

describe('program read queries through azureRead', () => {
  beforeEach(() => {
    queryMock.mockReset();
    canReadProgramMock.mockReset();
    canReadProgramMock.mockResolvedValue(true);
  });

  it('reads module state through azureRead with stable ordering', async () => {
    queryMock.mockResolvedValueOnce([
      {
        id: 'mod-1',
        engagement_id: 'eng-1',
        module_key: 'discover',
        module_name: 'Discover',
        phase_number: 1,
        module_order: 2,
        status: 'ready',
        state_jsonb: { done: false },
        assigned_user_id: null,
        started_at: null,
        completed_at: null,
      },
    ]);

    await expect(getModuleState(ctx, 'eng-1')).resolves.toEqual([
      {
        id: 'mod-1',
        engagementId: 'eng-1',
        moduleKey: 'discover',
        moduleName: 'Discover',
        phaseNumber: 1,
        moduleOrder: 2,
        status: 'ready',
        state: { done: false },
        assignedUserId: null,
        startedAt: null,
        completedAt: null,
      },
    ]);
    expect(queryMock).toHaveBeenCalledWith(
      'SELECT * FROM program_modules WHERE engagement_id = $1 ORDER BY phase_number ASC, module_order ASC NULLS LAST',
      ['eng-1'],
      { missingTable: 'throw' },
    );
  });

  it('reads work items through azureRead after RBAC', async () => {
    queryMock.mockResolvedValueOnce([
      {
        id: 'wi-1',
        engagement_id: 'eng-1',
        parent_id: null,
        title: 'Confirm scope',
        description: null,
        item_type: 'task',
        status: 'open',
        priority: 'high',
        assigned_user_id: null,
        module_key: null,
        phase_number: null,
        due_date: null,
        completed_at: null,
        metadata_jsonb: { source: 'nexus' },
      },
    ]);

    const rows = await getWorkItems(ctx, 'eng-1');
    expect(rows[0]).toMatchObject({
      id: 'wi-1',
      engagementId: 'eng-1',
      title: 'Confirm scope',
      metadata: { source: 'nexus' },
    });
    expect(canReadProgramMock).toHaveBeenCalledWith(ctx, 'eng-1');
    expect(queryMock).toHaveBeenCalledWith(
      'SELECT * FROM program_work_items WHERE engagement_id = $1 ORDER BY created_at DESC',
      ['eng-1'],
      { missingTable: 'throw' },
    );
  });

  it('reads open flags and pending approvals through azureRead filters', async () => {
    queryMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(getOpenMaestroFlags(ctx, 'eng-1')).resolves.toEqual([]);
    await expect(getPendingApprovals(ctx, 'eng-1')).resolves.toEqual([]);

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      'SELECT * FROM maestro_oversight_flags WHERE engagement_id = $1 AND resolved_at IS NULL ORDER BY created_at DESC',
      ['eng-1'],
      { missingTable: 'throw' },
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      "SELECT * FROM founder_approval_requests WHERE engagement_id = $1 AND status = 'pending' ORDER BY deadline_at ASC NULLS LAST",
      ['eng-1'],
      { missingTable: 'throw' },
    );
  });

  it('reads phase snapshots with optional phase filter', async () => {
    queryMock.mockResolvedValueOnce([
      {
        id: 'snap-1',
        engagement_id: 'eng-1',
        phase_number: 3,
        phase_name: 'Mobilize',
        snapshot_jsonb: { gate: 'passed' },
        locked_by_user_id: null,
        locked_at: null,
        approval_status: 'approved',
        created_at: '2026-05-28T10:00:00Z',
      },
    ]);

    await expect(getPhaseSnapshots(ctx, 'eng-1', 3)).resolves.toEqual([
      {
        id: 'snap-1',
        engagementId: 'eng-1',
        phaseNumber: 3,
        phaseName: 'Mobilize',
        snapshot: { gate: 'passed' },
        lockedByUserId: null,
        lockedAt: null,
        approvalStatus: 'approved',
        createdAt: '2026-05-28T10:00:00Z',
      },
    ]);
    expect(queryMock).toHaveBeenCalledWith(
      'SELECT * FROM phase_snapshots WHERE engagement_id = $1 AND phase_number = $2 ORDER BY created_at DESC',
      ['eng-1', 3],
      { missingTable: 'throw' },
    );
  });

  it('does not query when RBAC rejects the program', async () => {
    canReadProgramMock.mockResolvedValueOnce(false);
    await expect(getModuleState(ctx, 'eng-1')).rejects.toThrow('program eng-1 not accessible');
    expect(queryMock).not.toHaveBeenCalled();
  });
});
