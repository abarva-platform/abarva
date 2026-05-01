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

interface QueryState {
  table: string;
  upsertPayload: Record<string, unknown> | null;
  insertPayload: Record<string, unknown> | null;
  updatePayload: Record<string, unknown> | null;
  selectColumns: string | null;
  filters: Array<{ column: string; value: unknown }>;
  singleResult: { data: unknown; error: unknown };
  maybeSingleResult: { data: unknown; error: unknown };
  directResult: { data: unknown; error: unknown };
}

const queryLog: QueryState[] = [];
const pendingResults: Array<Partial<QueryState>> = [];

function makeQueryBuilder(table: string) {
  const state: QueryState = {
    table,
    upsertPayload: null,
    insertPayload: null,
    updatePayload: null,
    selectColumns: null,
    filters: [],
    singleResult: { data: null, error: null },
    maybeSingleResult: { data: null, error: null },
    directResult: { data: null, error: null },
  };
  Object.assign(state, pendingResults.shift() ?? {});
  queryLog.push(state);
  const qb = {
    upsert(payload: Record<string, unknown>) {
      state.upsertPayload = payload;
      return qb;
    },
    insert(payload: Record<string, unknown>) {
      state.insertPayload = payload;
      return qb;
    },
    update(payload: Record<string, unknown>) {
      state.updatePayload = payload;
      return qb;
    },
    select(cols: string) {
      state.selectColumns = cols;
      return qb;
    },
    eq(column: string, value: unknown) {
      state.filters.push({ column, value });
      return qb;
    },
    single() {
      return Promise.resolve(state.singleResult);
    },
    maybeSingle() {
      return Promise.resolve(state.maybeSingleResult);
    },
    then(resolve: (v: { data: unknown; error: unknown }) => unknown) {
      resolve(state.directResult);
    },
  };
  return qb;
}

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    from: (table: string) => makeQueryBuilder(table),
  }),
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
  queryLog.length = 0;
  pendingResults.length = 0;
  requireTenancyMock.mockReset();
  loadUserProgramAccessPolicyMock.mockReset();
  writeProgramAuditLogBestEffortMock.mockReset();
  requireTenancyMock.mockResolvedValue({
    clientId: 'client-1',
    userId: 'admin-1',
    role: 'client_admin',
  });
  loadUserProgramAccessPolicyMock.mockResolvedValue({
    canAdminUsers: true,
  });
  pendingResults.push({
    singleResult: { data: { id: 'person-1' }, error: null },
  });
});

describe('POST /api/admin/users/provision', () => {
  it('requires client-admin user-management rights', async () => {
    loadUserProgramAccessPolicyMock.mockResolvedValue({ canAdminUsers: false });

    const res = await POST(request({ email: 'sarah@example.com' }) as never);

    expect(res.status).toBe(403);
    expect(queryLog).toHaveLength(0);
  });

  it('provisions client-pinned Programs user and assigns programs', async () => {
    pendingResults.push(
      {},
      { maybeSingleResult: { data: { id: 'program-1' }, error: null } },
      { maybeSingleResult: { data: null, error: null } },
      {},
      { maybeSingleResult: { data: { id: 'program-2' }, error: null } },
      { maybeSingleResult: { data: null, error: null } },
      {},
    );

    const res = await POST(request({
      email: 'sarah.chen@northstar.example',
      name: 'Sarah Chen',
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
      accessLevel: 'program_member',
      canCreatePrograms: true,
      financialVisibility: false,
    });

    const person = queryLog.find((q) => q.table === 'persons');
    expect(person?.upsertPayload).toMatchObject({
      email: 'sarah.chen@northstar.example',
      name: 'Sarah Chen',
      role: 'program_member',
    });

    const membership = queryLog.find((q) => q.table === 'person_client_memberships');
    expect(membership?.upsertPayload).toMatchObject({
      person_id: 'person-1',
      client_id: 'client-1',
      access_level: 'program_member',
      financial_visibility: false,
      can_create_programs: true,
    });

    const assignments = queryLog.filter((q) => q.table === 'engagement_participants');
    expect(assignments).toHaveLength(4);
    expect(assignments[1].insertPayload).toMatchObject({
      engagement_id: 'program-1',
      user_id: 'person-1',
      program_access_level: 'program_member',
      can_view_financial: false,
      can_upload: true,
      can_generate_deliverables: true,
    });
    expect(writeProgramAuditLogBestEffortMock).toHaveBeenCalledTimes(1);
  });

  it('does not assign a program outside the active client', async () => {
    pendingResults.push(
      {},
      { maybeSingleResult: { data: null, error: null } },
    );

    const res = await POST(request({
      email: 'sarah.chen@northstar.example',
      name: 'Sarah Chen',
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
    expect(queryLog.filter((q) => q.table === 'engagement_participants')).toHaveLength(0);
  });
});
