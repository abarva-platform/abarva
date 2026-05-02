/** advance_phase tool tests */

const requireTenancyMock = jest.fn();
jest.mock('@/app/api/v1/programs/_auth', () => {
  class TenancyError extends Error {
    constructor(public readonly code: 'unauthenticated' | 'no_client') {
      super(code);
    }
  }
  return {
    __esModule: true,
    requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
    TenancyError,
  };
});

const getProgramByIdMock = jest.fn();
jest.mock('@/lib/programs/queries', () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

const evaluateGateMock = jest.fn();
const requestFounderApprovalMock = jest.fn();
jest.mock('@/lib/programs/governance', () => ({
  __esModule: true,
  evaluateGate: (...args: unknown[]) => evaluateGateMock(...args),
  requestFounderApproval: (...args: unknown[]) => requestFounderApprovalMock(...args),
}));

const advancePhaseMutationMock = jest.fn();
jest.mock('@/lib/programs/mutations', () => ({
  __esModule: true,
  advancePhase: (...args: unknown[]) => advancePhaseMutationMock(...args),
}));

const loadUserProgramAccessPolicyMock = jest.fn();
jest.mock('@/lib/auth/program-access-policy', () => ({
  __esModule: true,
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadUserProgramAccessPolicyMock(...args),
}));

import { advancePhaseTool } from '../program/advancePhase';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    request: new Request('http://localhost/'),
    surface: '/programs/program-1',
    ...overrides,
  };
}

const tenancy = {
  clientId: 'client-1',
  userId: 'person-1',
  role: 'Director, IT Procurement',
};

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue(tenancy);
  getProgramByIdMock.mockResolvedValue({ id: 'program-1', currentPhase: 3 });
  evaluateGateMock.mockResolvedValue({
    failedChecks: [],
    requiresApproval: true,
    approverRole: 'sponsor',
  });
  loadUserProgramAccessPolicyMock.mockResolvedValue({
    programIdsAllowed: null,
    canApproveGates: true,
    canViewFinancialData: false,
  });
  requestFounderApprovalMock.mockResolvedValue('approval-1');
  advancePhaseMutationMock.mockResolvedValue({
    programId: 'program-1',
    newPhase: 4,
    snapshotId: 'snapshot-1',
  });
});

describe('advance_phase tool', () => {
  it('self-approves a sponsor-required gate when the caller has gate approval rights', async () => {
    const result = await advancePhaseTool.handler(
      {
        program_id: 'program-1',
        to_phase: 4,
        self_approve_if_authorized: true,
        rationale: 'Carlos approved in E2E test.',
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    expect(requestFounderApprovalMock).not.toHaveBeenCalled();
    expect(loadUserProgramAccessPolicyMock).toHaveBeenCalledWith(tenancy, {
      programId: 'program-1',
    });
    expect(advancePhaseMutationMock).toHaveBeenCalledWith(
      tenancy,
      expect.objectContaining({
        programId: 'program-1',
        fromPhase: 3,
        toPhase: 4,
        approvedByUserId: 'person-1',
      }),
    );
  });

  it('keeps the sponsor approval request path when self-approval is not requested', async () => {
    const result = await advancePhaseTool.handler(
      {
        program_id: 'program-1',
        to_phase: 4,
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('approval_required');
    expect(requestFounderApprovalMock).toHaveBeenCalledWith(
      tenancy,
      'program-1',
      expect.objectContaining({
        requestType: 'phase_gate',
        headline: 'Approve phase 3 → 4 gate',
      }),
    );
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it('refuses self-approval when the session lacks gate approval rights', async () => {
    loadUserProgramAccessPolicyMock.mockResolvedValue({
      programIdsAllowed: null,
      canApproveGates: false,
      canViewFinancialData: false,
    });

    const result = await advancePhaseTool.handler(
      {
        program_id: 'program-1',
        to_phase: 4,
        self_approve_if_authorized: true,
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('approval_permission_required');
    expect(requestFounderApprovalMock).not.toHaveBeenCalled();
    expect(advancePhaseMutationMock).not.toHaveBeenCalled();
  });

  it('uses the route-provided access policy when available', async () => {
    const result = await advancePhaseTool.handler(
      {
        program_id: 'program-1',
        to_phase: 4,
        self_approve_if_authorized: true,
      },
      makeCtx({
        accessPolicy: {
          accessLevel: 'client_admin',
          programIdsAllowed: null,
          canApproveGates: true,
          canViewFinancialData: false,
        },
      }),
    );

    expect(result.success).toBe(true);
    expect(loadUserProgramAccessPolicyMock).not.toHaveBeenCalled();
    expect(advancePhaseMutationMock).toHaveBeenCalled();
  });
});
