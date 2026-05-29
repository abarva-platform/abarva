const auth = jest.fn();
const clerkClient = jest.fn();
const checkTenantAccessByKey = jest.fn();
const tenantKeyForProgramCode = jest.fn();
const requireTenancy = jest.fn();
const getLatestSponsorCommitment = jest.fn();
const getProgramTensionRecords = jest.fn();
const getStakeholderSuccessRecords = jest.fn();
const dataReadinessGateMet = jest.fn();
const getSeedPlan = jest.fn();
const writeProgramAuditLog = jest.fn();
const advanceEngagementPhase = jest.fn();
const loadUserProgramAccessPolicy = jest.fn();
const isGateApprovalStrictMode = jest.fn();
const isStrictModeApprovalRole = jest.fn();
const mockAzureRead = {
  query: jest.fn(),
  select: jest.fn(),
  maybeSingle: jest.fn(),
  count: jest.fn(),
  withSession: jest.fn(),
};
const mkdirSync = jest.fn();
const readFileSync = jest.fn();
const writeFileSync = jest.fn();
const existsSync = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth,
  clerkClient,
}));

jest.mock('fs', () => ({
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
}));

jest.mock('@/lib/auth/tenant-access', () => ({
  checkTenantAccessByKey,
  tenantKeyForProgramCode,
}));

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy,
}));

jest.mock('@/lib/workflow/sponsorCommitmentLedger', () => ({
  getLatestSponsorCommitment,
}));

jest.mock('@/lib/workflow/stakeholderSuccessLedger', () => ({
  getProgramTensionRecords,
  getStakeholderSuccessRecords,
}));

jest.mock('@/lib/workflow/dataReadinessLedger', () => ({
  dataReadinessGateMet,
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: mockAzureRead,
}));

jest.mock('@/lib/deliverables/seed-route-resolver', () => ({
  getSeedPlan,
}));

jest.mock('@/lib/programs/audit-log', () => ({
  writeProgramAuditLog,
}));

jest.mock('@/lib/data-plane/write-adapters/programsWriteAdapter', () => ({
  selectProgramsWriteAdapter: () => ({ advanceEngagementPhase }),
}));

jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy,
}));

jest.mock('@/lib/auth/gate-approval-strict-mode', () => ({
  isGateApprovalStrictMode,
  isStrictModeApprovalRole,
}));

function phaseGateRequest(): Request {
  return new Request('http://localhost/api/programs/phase-gate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programCode: 'APX-01',
      fromPhase: 2,
      toPhase: 3,
      gateCriterion: 'Gate 3 advance',
    }),
  });
}

describe('POST /api/programs/phase-gate read plane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ userId: 'user_1' });
    clerkClient.mockResolvedValue({
      users: {
        getUser: jest.fn().mockResolvedValue({
          firstName: 'Maya',
          lastName: 'Patel',
          publicMetadata: { role: 'admin' },
          emailAddresses: [{ emailAddress: 'maya@example.com' }],
        }),
      },
    });
    tenantKeyForProgramCode.mockReturnValue('apex-retail');
    checkTenantAccessByKey.mockResolvedValue({ ok: true });
    requireTenancy.mockResolvedValue({ clientId: 'client_1', clientKey: 'apex-retail', userId: 'user_1', role: 'admin' });
    loadUserProgramAccessPolicy.mockResolvedValue({ canApproveGates: true });
    isGateApprovalStrictMode.mockReturnValue(false);
    isStrictModeApprovalRole.mockReturnValue(true);
    getLatestSponsorCommitment.mockReturnValue({ id: 'commitment_1' });
    getProgramTensionRecords.mockReturnValue([{ id: 'tension_1' }]);
    getStakeholderSuccessRecords.mockReturnValue([{ id: 'success_1' }]);
    dataReadinessGateMet.mockReturnValue({ met: true, blockedDimensions: [] });
    getSeedPlan.mockReturnValue({
      programs: [{ code: 'APX-01', graphNodeId: 'graph_program_1' }],
    });
    mockAzureRead.maybeSingle.mockResolvedValue({
      id: 'engagement_1',
      current_phase: 2,
      gates_passed: [1, 2],
    });
    advanceEngagementPhase.mockResolvedValue(true);
    writeProgramAuditLog.mockResolvedValue(undefined);
    existsSync.mockReturnValue(false);
  });

  it('resolves the engagement through azureRead and preserves write/audit side effects', async () => {
    const { POST } = await import('@/app/api/programs/phase-gate/route');
    const res = await POST(phaseGateRequest() as never);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      entry: {
        programCode: 'APX-01',
        fromPhase: 2,
        toPhase: 3,
      },
    });
    expect(mockAzureRead.maybeSingle).toHaveBeenCalledWith({
      table: 'engagements',
      columns: ['id', 'current_phase', 'gates_passed'],
      where: { graph_node_id: 'graph_program_1' },
    });
    expect(advanceEngagementPhase).toHaveBeenCalledWith({
      engagementId: 'engagement_1',
      toPhase: 3,
      gatesPassed: [1, 2, 3],
      tenantKey: 'apex-retail',
    });
    expect(writeProgramAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'apex-retail', userId: 'user_1' }),
      expect.objectContaining({
        tenantKey: 'apex-retail',
        programId: 'APX-01',
        engagementId: 'engagement_1',
        action: 'PHASE_GATE_ADVANCED',
      }),
    );
    expect(writeFileSync).toHaveBeenCalled();
  });
});

export {};
