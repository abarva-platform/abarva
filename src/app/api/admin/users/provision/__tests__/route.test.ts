const requireTenancyMock = jest.fn();
jest.mock('@/app/api/v1/programs/_auth', () => {
  class TenancyError extends Error {
    constructor(public readonly code: 'unauthenticated' | 'no_client') {
      super(code);
    }
  }
  return {
    requireTenancy: () => requireTenancyMock(),
    tenancyErrorResponse: (err: unknown) => {
      if (err instanceof TenancyError) {
        return Response.json({ error: err.code }, { status: err.code === 'unauthenticated' ? 401 : 403 });
      }
      throw err;
    },
    TenancyError,
  };
});

const loadUserProgramAccessPolicyMock = jest.fn();
jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) => loadUserProgramAccessPolicyMock(...args),
}));

const writeProgramAuditLogBestEffortMock = jest.fn();
jest.mock('@/lib/programs/audit-log', () => ({
  writeProgramAuditLogBestEffort: (...args: unknown[]) => writeProgramAuditLogBestEffortMock(...args),
}));

const createInvitationMock = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: jest.fn(async () => ({
    invitations: {
      createInvitation: (...args: unknown[]) => createInvitationMock(...args),
    },
  })),
}));

const getActiveClientRowMock = jest.fn();
jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRowMock(...args),
}));

type MaybeSingleResult = { data: unknown; error: { message: string } | null };

interface ReadQueryState {
  table: string;
  selectColumns: string | null;
  filters: Array<{ column: string; value: unknown }>;
  maybeSingleResult: MaybeSingleResult;
}

const readQueryLog: ReadQueryState[] = [];
const pendingReadResults: MaybeSingleResult[] = [];

function makeReadBuilder(table: string) {
  if (!['engagements', 'engagement_participants'].includes(table)) {
    throw new Error(`Unexpected read table: ${table}`);
  }
  const state: ReadQueryState = {
    table,
    selectColumns: null,
    filters: [],
    maybeSingleResult: pendingReadResults.shift() ?? { data: null, error: null },
  };
  readQueryLog.push(state);
  const qb = {
    select(cols: string) {
      state.selectColumns = cols;
      return qb;
    },
    eq(column: string, value: unknown) {
      state.filters.push({ column, value });
      return qb;
    },
    maybeSingle() {
      return Promise.resolve(state.maybeSingleResult);
    },
  };
  return qb;
}

const getAzureReadFluentClientMock = jest.fn(() => ({
  from: (table: string) => makeReadBuilder(table),
}));
jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureReadFluentClient: () => getAzureReadFluentClientMock(),
}));

const upsertPersonMock = jest.fn();
const upsertMembershipMock = jest.fn();
const upsertParticipantMock = jest.fn();
const selectAdminWriteAdapterMock = jest.fn(() => ({
  name: 'supabase',
  upsertPerson: (...args: unknown[]) => upsertPersonMock(...args),
  upsertMembership: (...args: unknown[]) => upsertMembershipMock(...args),
  upsertParticipant: (...args: unknown[]) => upsertParticipantMock(...args),
}));
jest.mock('@/lib/data-plane/write-adapters/adminWriteAdapter', () => ({
  selectAdminWriteAdapter: () => selectAdminWriteAdapterMock(),
}));

import { POST } from '../route';

function request(body: unknown): Request {
  return new Request('http://localhost/api/admin/users/provision', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  readQueryLog.length = 0;
  pendingReadResults.length = 0;
  requireTenancyMock.mockReset();
  loadUserProgramAccessPolicyMock.mockReset();
  writeProgramAuditLogBestEffortMock.mockReset();
  createInvitationMock.mockReset();
  getActiveClientRowMock.mockReset();
  getAzureReadFluentClientMock.mockClear();
  selectAdminWriteAdapterMock.mockClear();
  upsertPersonMock.mockReset();
  upsertMembershipMock.mockReset();
  upsertParticipantMock.mockReset();
  requireTenancyMock.mockResolvedValue({
    clientId: 'client-1',
    userId: 'admin-1',
    role: 'client_admin',
  });
  loadUserProgramAccessPolicyMock.mockResolvedValue({
    canAdminUsers: true,
  });
  getActiveClientRowMock.mockResolvedValue({
    id: 'client-1',
    key: 'client-demo',
    name: 'Example Client',
    industry_code: 'HEALTHCARE_IDN',
  });
  createInvitationMock.mockResolvedValue({
    id: 'invite-1',
    emailAddress: 'user.one@example.test',
    status: 'pending',
  });
  upsertPersonMock.mockResolvedValue({ ok: true, data: { id: 'person-1' } });
  upsertMembershipMock.mockResolvedValue({ ok: true, data: undefined });
  upsertParticipantMock.mockResolvedValue({ ok: true, data: undefined });
});

describe('POST /api/admin/users/provision', () => {
  it('requires client-admin user-management rights before constructing data-plane clients', async () => {
    loadUserProgramAccessPolicyMock.mockResolvedValue({ canAdminUsers: false });

    const res = await POST(request({ email: 'user@example.test' }) as never);

    expect(res.status).toBe(403);
    expect(getAzureReadFluentClientMock).not.toHaveBeenCalled();
    expect(selectAdminWriteAdapterMock).not.toHaveBeenCalled();
    expect(createInvitationMock).not.toHaveBeenCalled();
  });

  it('provisions client-pinned Programs user and assigns programs through the admin write adapter', async () => {
    pendingReadResults.push(
      { data: { id: 'program-1' }, error: null },
      { data: null, error: null },
      { data: { id: 'program-2' }, error: null },
      { data: { id: 'participant-2' }, error: null },
    );

    const res = await POST(request({
      email: 'User.One@Example.test',
      name: 'User One',
      accessLevel: 'program_member',
      programIds: ['program-1', 'program-2'],
      financialVisibility: false,
      canCreatePrograms: true,
      canUploadArtifacts: true,
      canGenerateDeliverables: true,
    }) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      personId: 'person-1',
      email: 'user.one@example.test',
      accessLevel: 'program_member',
      canCreatePrograms: true,
      financialVisibility: false,
    });

    expect(upsertPersonMock).toHaveBeenCalledWith({
      graphNodeId: 'person:client-1:user.one@example.test',
      email: 'user.one@example.test',
      name: 'User One',
      role: 'program_member',
      organization: 'client-1',
    });
    expect(upsertMembershipMock).toHaveBeenCalledWith({
      personId: 'person-1',
      clientId: 'client-1',
      accessLevel: 'program_member',
      financialVisibility: false,
      canAdminUsers: false,
      canCreatePrograms: true,
      canApproveGates: false,
    });
    expect(upsertParticipantMock).toHaveBeenNthCalledWith(1, {
      existingId: null,
      payload: {
        engagement_id: 'program-1',
        user_id: 'person-1',
        user_name: 'User One',
        role: 'contributor',
        notify_on: ['phase_gate', 'approval'],
        approval_authority: 'contributor',
        program_access_level: 'program_member',
        can_view_financial: false,
        can_upload: true,
        can_generate_deliverables: true,
        can_publish_deliverables: false,
        can_approve_phase_gates: false,
      },
    });
    expect(upsertParticipantMock).toHaveBeenNthCalledWith(2, {
      existingId: 'participant-2',
      payload: {
        engagement_id: 'program-2',
        user_id: 'person-1',
        user_name: 'User One',
        role: 'contributor',
        notify_on: ['phase_gate', 'approval'],
        approval_authority: 'contributor',
        program_access_level: 'program_member',
        can_view_financial: false,
        can_upload: true,
        can_generate_deliverables: true,
        can_publish_deliverables: false,
        can_approve_phase_gates: false,
      },
    });

    expect(readQueryLog).toEqual([
      {
        table: 'engagements',
        selectColumns: 'id',
        filters: [
          { column: 'id', value: 'program-1' },
          { column: 'client_id', value: 'client-1' },
        ],
        maybeSingleResult: { data: { id: 'program-1' }, error: null },
      },
      {
        table: 'engagement_participants',
        selectColumns: 'id',
        filters: [
          { column: 'engagement_id', value: 'program-1' },
          { column: 'user_id', value: 'person-1' },
        ],
        maybeSingleResult: { data: null, error: null },
      },
      {
        table: 'engagements',
        selectColumns: 'id',
        filters: [
          { column: 'id', value: 'program-2' },
          { column: 'client_id', value: 'client-1' },
        ],
        maybeSingleResult: { data: { id: 'program-2' }, error: null },
      },
      {
        table: 'engagement_participants',
        selectColumns: 'id',
        filters: [
          { column: 'engagement_id', value: 'program-2' },
          { column: 'user_id', value: 'person-1' },
        ],
        maybeSingleResult: { data: { id: 'participant-2' }, error: null },
      },
    ]);
    expect(writeProgramAuditLogBestEffortMock).toHaveBeenCalledTimes(1);
    expect(createInvitationMock).not.toHaveBeenCalled();
  });

  it('can send a mocked Clerk invite pinned to the active client and Programs module', async () => {
    const res = await POST(request({
      email: 'user.one@example.test',
      name: 'User One',
      accessLevel: 'program_member',
      canCreatePrograms: true,
      financialVisibility: false,
      sendInvite: true,
    }) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invitation).toEqual({
      status: 'sent',
      invitationId: 'invite-1',
      email: 'user.one@example.test',
      clerkStatus: 'pending',
    });
    expect(createInvitationMock).toHaveBeenCalledWith({
      emailAddress: 'user.one@example.test',
      publicMetadata: {
        role: 'client',
        clientId: 'client-demo',
        defaultClientId: 'client-demo',
        clientName: 'Example Client',
        clientLocked: true,
        accountType: 'program_user_invited',
        person_id: 'person-1',
        moduleAccess: ['programs'],
        programScope: 'assigned_programs_only',
        canCreatePrograms: true,
        financialVisibility: false,
      },
      redirectUrl: 'https://app.abarva.ai/auth-redirect',
      notify: true,
    });
    expect(upsertPersonMock).toHaveBeenCalledWith(expect.objectContaining({
      graphNodeId: 'person:client-1:user.one@example.test',
      organization: 'client-1',
    }));
  });

  it('does not assign a program outside the active client', async () => {
    pendingReadResults.push({ data: null, error: null });

    const res = await POST(request({
      email: 'user.one@example.test',
      name: 'User One',
      accessLevel: 'program_member',
      programIds: ['apex-program-1'],
      canCreatePrograms: true,
    }) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assignments).toEqual([
      {
        programId: 'apex-program-1',
        status: 'failed',
        detail: 'program_not_found_for_active_client',
      },
    ]);
    expect(readQueryLog).toEqual([
      {
        table: 'engagements',
        selectColumns: 'id',
        filters: [
          { column: 'id', value: 'apex-program-1' },
          { column: 'client_id', value: 'client-1' },
        ],
        maybeSingleResult: { data: null, error: null },
      },
    ]);
    expect(upsertParticipantMock).not.toHaveBeenCalled();
    expect(createInvitationMock).not.toHaveBeenCalled();
  });
});
