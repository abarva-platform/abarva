const fromMock = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({ from: fromMock }),
}));

interface QueryState {
  table: string;
}

interface MockQueryBuilder {
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  maybeSingle: jest.Mock;
  then: (resolve: (value: { data: unknown[]; error: null }) => unknown) => Promise<unknown>;
}

function makeBuilder(state: QueryState, rowsByTable: Record<string, unknown>) {
  const builder: Partial<MockQueryBuilder> = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    is: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => {
      const value = rowsByTable[state.table];
      return { data: Array.isArray(value) ? value[0] ?? null : value ?? null, error: null };
    }),
  };
  builder.then = (resolve: (value: { data: unknown[]; error: null }) => unknown) => {
      const value = rowsByTable[state.table];
      return Promise.resolve(resolve({ data: Array.isArray(value) ? value : [], error: null }));
  };
  return builder as MockQueryBuilder;
}

function setupRows(rowsByTable: Record<string, unknown>) {
  fromMock.mockImplementation((table: string) => makeBuilder({ table }, rowsByTable));
}

describe('program access policy', () => {
  beforeEach(() => {
    jest.resetModules();
    fromMock.mockReset();
  });

  it('restricts a program-assigned user to explicit engagement ids', async () => {
    setupRows({
      person_client_memberships: {
        role: 'client_viewer',
        access_level: 'program_member',
        financial_visibility: false,
      },
      engagement_participants: [
        {
          engagement_id: 'program-a',
          approval_authority: 'contributor',
          program_access_level: 'program_member',
          can_view_financial: false,
          can_upload: true,
          can_generate_deliverables: true,
          can_publish_deliverables: false,
          can_approve_phase_gates: false,
        },
      ],
    });
    const { loadUserProgramAccessPolicy, canReadProgram } = await import('../program-access-policy');
    const ctx = { clientId: 'client-1', userId: '00000000-0000-4000-8000-000000000001', role: 'client_viewer' };

    const policy = await loadUserProgramAccessPolicy(ctx);

    expect(policy.programScope).toBe('assigned_programs_only');
    expect(policy.programIdsAllowed).toEqual(['program-a']);
    await expect(canReadProgram(ctx, 'program-a')).resolves.toBe(true);
    await expect(canReadProgram(ctx, 'program-b')).resolves.toBe(false);
  });

  it('allows client admins to see all client programs but keeps financial hidden unless explicitly granted', async () => {
    setupRows({
      person_client_memberships: {
        role: 'maestro',
        access_level: 'client_admin',
        financial_visibility: false,
        can_admin_users: true,
        can_create_programs: true,
        can_approve_gates: true,
      },
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy } = await import('../program-access-policy');
    const policy = await loadUserProgramAccessPolicy({
      clientId: 'client-1',
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'maestro',
    });

    expect(policy.programScope).toBe('all_client_programs');
    expect(policy.programIdsAllowed).toBeNull();
    expect(policy.canAdminUsers).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
    expect(policy.deniedDataClasses).toContain('restricted_financial');
  });

  it('maps app-wide admin roles to client-pinned client_admin, never cross-client super admin', async () => {
    setupRows({
      person_client_memberships: null,
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy, formatUserProgramAccessPolicyForPrompt } = await import('../program-access-policy');
    const policy = await loadUserProgramAccessPolicy({
      clientId: 'client-1',
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'admin',
    });

    expect(policy.accessLevel).toBe('client_admin');
    expect(policy.programScope).toBe('all_client_programs');
    expect(policy.programIdsAllowed).toBeNull();
    expect(formatUserProgramAccessPolicyForPrompt(policy)).toContain('no cross-client admin role exists');
  });

  it('normalizes legacy abarva_super_admin memberships to client_admin within the active client', async () => {
    setupRows({
      person_client_memberships: {
        role: 'maestro',
        access_level: 'abarva_super_admin',
        financial_visibility: false,
      },
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy } = await import('../program-access-policy');
    const policy = await loadUserProgramAccessPolicy({
      clientId: 'client-1',
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'maestro',
    });

    expect(policy.accessLevel).toBe('client_admin');
    expect(policy.clientId).toBe('client-1');
    expect(policy.programIdsAllowed).toBeNull();
  });
});
