export {};

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
  neq: jest.Mock;
  maybeSingle: jest.Mock;
  then: (resolve: (value: { data: unknown[]; error: { message: string } | null }) => unknown) => Promise<unknown>;
}

function makeBuilder(state: QueryState, rowsByTable: Record<string, unknown>) {
  const builder: Partial<MockQueryBuilder> = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    neq: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => {
      const value = rowsByTable[state.table];
      return { data: Array.isArray(value) ? value[0] ?? null : value ?? null, error: null };
    }),
  };
  builder.then = (resolve: (value: { data: unknown[]; error: { message: string } | null }) => unknown) => {
    const value = rowsByTable[state.table];
    if (value && typeof value === 'object' && 'error' in (value as Record<string, unknown>)) {
      return Promise.resolve(resolve(value as { data: unknown[]; error: { message: string } }));
    }
    return Promise.resolve(resolve({ data: Array.isArray(value) ? value : [], error: null }));
  };
  return builder as MockQueryBuilder;
}

function setupRows(rowsByTable: Record<string, unknown>) {
  fromMock.mockImplementation((table: string) => makeBuilder({ table }, rowsByTable));
}

describe('source access policy', () => {
  beforeEach(() => {
    jest.resetModules();
    fromMock.mockReset();
  });

  it('treats client_admin as all source events inside one active client only', async () => {
    setupRows({
      person_client_memberships: {
        role: 'maestro',
        access_level: 'client_admin',
        financial_visibility: false,
        can_admin_users: true,
        can_approve_gates: true,
      },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } = await import('../source-access-policy');
    const policy = await loadUserSourceAccessPolicy({
      clientId: 'client-apex',
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'client_admin',
    }, { activeClientKey: 'apexretail' });

    expect(policy.accessLevel).toBe('client_admin');
    expect(policy.sourceScope).toBe('all_client_source_events');
    expect(policy.sourceEventIdsAllowed).toBeNull();
    expect(policy.canApproveSourceStages).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
    expect(policy.deniedDataClasses).toContain('restricted_financial');
  });

  it('normalizes legacy abarva_super_admin to client_admin and never emits super-admin copy', async () => {
    setupRows({
      person_client_memberships: { access_level: 'abarva_super_admin', financial_visibility: true },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy, formatUserSourceAccessPolicyForPrompt } = await import('../source-access-policy');
    const policy = await loadUserSourceAccessPolicy({
      clientId: 'client-apex',
      userId: '00000000-0000-4000-8000-000000000001',
    }, { activeClientKey: 'apexretail' });

    expect(policy.accessLevel).toBe('client_admin');
    expect(formatUserSourceAccessPolicyForPrompt(policy)).not.toContain('super_admin');
  });

  it('treats pinned Clerk demo accounts as one-client client admins for Source', async () => {
    setupRows({});
    const { loadUserSourceAccessPolicy } = await import('../source-access-policy');
    const policy = await loadUserSourceAccessPolicy({
      clientId: 'client-apex',
      userId: 'clerk:user_demo',
      role: 'client_viewer',
      email: 'demo-apexretail+clerk_test@abarva.com',
    }, { activeClientKey: 'apexretail' });

    expect(policy.accessLevel).toBe('client_admin');
    expect(policy.sourceEventIdsAllowed).toBeNull();
    expect(policy.canCreateSourceEvents).toBe(true);
    expect(policy.canApproveSourceStages).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
  });

  it('restricts source members to assigned source event ids', async () => {
    setupRows({
      person_client_memberships: { access_level: 'source_member', financial_visibility: false },
      source_event_participants: [
        {
          source_event_id: 'src-1',
          source_access_level: 'source_member',
          approval_authority: 'contributor',
          can_view_financial: false,
          can_upload_source_artifacts: true,
          can_generate_sourcing_artifacts: true,
          can_publish_sourcing_artifacts: false,
          can_approve_source_stages: false,
          can_approve_award: false,
        },
      ],
    });
    const { loadUserSourceAccessPolicy, canReadSourceEvent } = await import('../source-access-policy');
    const ctx = { clientId: 'client-apex', userId: '00000000-0000-4000-8000-000000000001' };

    const policy = await loadUserSourceAccessPolicy(ctx, { activeClientKey: 'apexretail' });

    expect(policy.sourceScope).toBe('assigned_source_events_only');
    expect(policy.sourceEventIdsAllowed).toEqual(['src-1']);
    await expect(canReadSourceEvent(ctx, 'apexretail', 'src-1')).resolves.toBe(true);
    await expect(canReadSourceEvent(ctx, 'apexretail', 'src-2')).resolves.toBe(false);
  });

  it('lets source members create new events without granting approval authority', async () => {
    setupRows({
      person_client_memberships: {
        access_level: 'source_member',
        financial_visibility: false,
        can_create_source_events: true,
        can_approve_source_stages: false,
      },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } = await import('../source-access-policy');
    const policy = await loadUserSourceAccessPolicy({
      clientId: 'client-apex',
      userId: '00000000-0000-4000-8000-000000000001',
    }, { activeClientKey: 'apexretail' });

    expect(policy.accessLevel).toBe('source_member');
    expect(policy.canCreateSourceEvents).toBe(true);
    expect(policy.canApproveSourceStages).toBe(false);
    expect(policy.sourceEventIdsAllowed).toEqual([]);
  });

  it('treats programs-only users as no_source_access', async () => {
    setupRows({
      person_client_memberships: { access_level: 'program_member', financial_visibility: false },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } = await import('../source-access-policy');
    const policy = await loadUserSourceAccessPolicy({
      clientId: 'client-apex',
      userId: '00000000-0000-4000-8000-000000000001',
    }, { activeClientKey: 'apexretail' });

    expect(policy.accessLevel).toBe('no_source_access');
    expect(policy.sourceScope).toBe('none');
    expect(policy.canCreateSourceEvents).toBe(false);
    expect(policy.canUploadSourceArtifacts).toBe(false);
  });

  it('formats the financial visibility refusal rule for sourcing prompts', async () => {
    setupRows({
      person_client_memberships: { access_level: 'source_member', financial_visibility: false },
      source_event_participants: [{ source_event_id: 'src-1', source_access_level: 'source_member' }],
    });
    const { loadUserSourceAccessPolicy, formatUserSourceAccessPolicyForPrompt } = await import('../source-access-policy');
    const policy = await loadUserSourceAccessPolicy({
      clientId: 'client-apex',
      userId: '00000000-0000-4000-8000-000000000001',
    }, { activeClientKey: 'apexretail' });

    expect(formatUserSourceAccessPolicyForPrompt(policy)).toContain('exact vendor spend');
    expect(formatUserSourceAccessPolicyForPrompt(policy)).toContain('must not appear');
  });
});
