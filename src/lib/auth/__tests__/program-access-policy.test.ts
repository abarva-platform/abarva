const fromMock = jest.fn();

jest.mock("@/lib/supabase-server", () => ({
  getServerSupabase: () => ({ from: fromMock }),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({ from: fromMock }),
}));

interface QueryState {
  table: string;
}

interface MockQueryBuilder {
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  maybeSingle: jest.Mock;
  then: (
    resolve: (value: { data: unknown[]; error: null }) => unknown,
  ) => Promise<unknown>;
}

function makeBuilder(state: QueryState, rowsByTable: Record<string, unknown>) {
  const builder: Partial<MockQueryBuilder> = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    is: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => {
      const value = rowsByTable[state.table];
      return {
        data: Array.isArray(value) ? (value[0] ?? null) : (value ?? null),
        error: null,
      };
    }),
  };
  builder.then = (
    resolve: (value: { data: unknown[]; error: null }) => unknown,
  ) => {
    const value = rowsByTable[state.table];
    return Promise.resolve(
      resolve({ data: Array.isArray(value) ? value : [], error: null }),
    );
  };
  return builder as MockQueryBuilder;
}

function setupRows(rowsByTable: Record<string, unknown>) {
  fromMock.mockImplementation((table: string) =>
    makeBuilder({ table }, rowsByTable),
  );
}

describe("program access policy", () => {
  beforeEach(() => {
    jest.resetModules();
    fromMock.mockReset();
  });

  it("restricts a program-assigned user to explicit engagement ids", async () => {
    setupRows({
      person_client_memberships: {
        role: "client_viewer",
        access_level: "program_member",
        financial_visibility: false,
      },
      engagement_participants: [
        {
          engagement_id: "program-a",
          approval_authority: "contributor",
          program_access_level: "program_member",
          can_view_financial: false,
          can_upload: true,
          can_generate_deliverables: true,
          can_publish_deliverables: false,
          can_approve_phase_gates: false,
        },
      ],
    });
    const { loadUserProgramAccessPolicy, canReadProgram } =
      await import("../program-access-policy");
    const ctx = {
      clientId: "client-1",
      userId: "00000000-0000-4000-8000-000000000001",
      role: "client_viewer",
    };

    const policy = await loadUserProgramAccessPolicy(ctx);

    expect(policy.programScope).toBe("assigned_programs_only");
    expect(policy.programIdsAllowed).toEqual(["program-a"]);
    await expect(canReadProgram(ctx, "program-a")).resolves.toBe(true);
    await expect(canReadProgram(ctx, "program-b")).resolves.toBe(false);
  });

  it("allows client admins to see all client programs but keeps financial hidden unless explicitly granted", async () => {
    setupRows({
      person_client_memberships: {
        role: "maestro",
        access_level: "client_admin",
        financial_visibility: false,
        can_admin_users: true,
        can_create_programs: true,
        can_approve_gates: true,
      },
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy } =
      await import("../program-access-policy");
    const policy = await loadUserProgramAccessPolicy({
      clientId: "client-1",
      userId: "00000000-0000-4000-8000-000000000001",
      role: "maestro",
    });

    expect(policy.programScope).toBe("all_client_programs");
    expect(policy.programIdsAllowed).toBeNull();
    expect(policy.canAdminUsers).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
    expect(policy.deniedDataClasses).toContain("restricted_financial");
  });

  it("maps app-wide admin roles to client-pinned client_admin, never cross-client super admin", async () => {
    setupRows({
      person_client_memberships: null,
      engagement_participants: [],
    });
    const {
      loadUserProgramAccessPolicy,
      formatUserProgramAccessPolicyForPrompt,
    } = await import("../program-access-policy");
    const policy = await loadUserProgramAccessPolicy({
      clientId: "client-1",
      userId: "00000000-0000-4000-8000-000000000001",
      role: "admin",
    });

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.programScope).toBe("all_client_programs");
    expect(policy.programIdsAllowed).toBeNull();
    expect(formatUserProgramAccessPolicyForPrompt(policy)).toContain(
      "no cross-client admin role exists",
    );
  });

  it("normalizes legacy abarva_super_admin memberships to client_admin within the active client", async () => {
    setupRows({
      person_client_memberships: {
        role: "maestro",
        access_level: "abarva_super_admin",
        financial_visibility: false,
      },
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy } =
      await import("../program-access-policy");
    const policy = await loadUserProgramAccessPolicy({
      clientId: "client-1",
      userId: "00000000-0000-4000-8000-000000000001",
      role: "maestro",
    });

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.clientId).toBe("client-1");
    expect(policy.programIdsAllowed).toBeNull();
  });

  it("lets active-client Clerk tenant_admin override stale DB viewer membership drift", async () => {
    setupRows({
      person_client_memberships: {
        role: "client_viewer",
        access_level: "program_viewer",
        financial_visibility: false,
        can_admin_users: false,
        can_create_programs: false,
        can_approve_gates: false,
      },
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy } =
      await import("../program-access-policy");
    const policy = await loadUserProgramAccessPolicy({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      userId: "00000000-0000-4000-8000-000000000001",
      clerkUserId: "user_anand_skyharbor",
      role: "client_viewer",
      tenantRole: "tenant_admin",
      email: "anand.sundaram+skyharbor@thesundaram.com",
    });

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.programIdsAllowed).toBeNull();
    expect(policy.canCreatePrograms).toBe(true);
    expect(policy.canAdminUsers).toBe(true);
    expect(policy.canApproveGates).toBe(true);
  });

  it("grants tenant-scoped Moves admin permissions to the matching automation agent", async () => {
    setupRows({});
    const { loadUserProgramAccessPolicy, canReadProgram } =
      await import("../program-access-policy");
    const ctx = {
      clientId: "client-meridian",
      clientKey: "meridian",
      userId: "clerk:user_agent_meridian",
      clerkUserId: "user_agent_meridian",
      role: "maestro",
      email: "meridian-agent@abarva.example.com",
    };

    const policy = await loadUserProgramAccessPolicy(ctx);

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.programScope).toBe("all_client_programs");
    expect(policy.programIdsAllowed).toBeNull();
    expect(policy.canCreatePrograms).toBe(true);
    expect(policy.canApproveGates).toBe(true);
    expect(policy.canGenerateDeliverables).toBe(true);
    expect(policy.canPublishDeliverables).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
    await expect(canReadProgram(ctx, "move-any")).resolves.toBe(true);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("grants matching automation-agent permissions after JIT person provisioning resolves a UUID user id", async () => {
    setupRows({});
    const { loadUserProgramAccessPolicy } =
      await import("../program-access-policy");

    const policy = await loadUserProgramAccessPolicy({
      clientId: "client-meridian",
      clientKey: "meridian",
      userId: "00000000-0000-4000-8000-00000000a6e7",
      clerkUserId: "user_agent_meridian",
      role: "client_viewer",
      email: "meridian-agent@abarva.example.com",
    });

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.programIdsAllowed).toBeNull();
    expect(policy.canCreatePrograms).toBe(true);
    expect(policy.canGenerateDeliverables).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("keeps canonical client-admin emails as all-program Moves admins after JIT person provisioning resolves a UUID user id", async () => {
    setupRows({});
    const { loadUserProgramAccessPolicy, canReadProgram } =
      await import("../program-access-policy");
    const ctx = {
      clientId: "client-lakeshore",
      clientKey: "lakeshore",
      userId: "00000000-0000-4000-8000-00000000c10a",
      clerkUserId: "user_lakeshore_cio",
      role: "client_viewer",
      email: "cio@lakeshore-holdings.example.com",
    };

    const policy = await loadUserProgramAccessPolicy(ctx);

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.programScope).toBe("all_client_programs");
    expect(policy.programIdsAllowed).toBeNull();
    expect(policy.canCreatePrograms).toBe(true);
    expect(policy.canApproveGates).toBe(true);
    expect(policy.canGenerateDeliverables).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
    await expect(canReadProgram(ctx, "lakeshore-move-any")).resolves.toBe(
      true,
    );
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does not grant an automation agent access to a different active tenant", async () => {
    setupRows({
      persons: null,
      person_client_memberships: null,
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy, canReadProgram } =
      await import("../program-access-policy");
    const ctx = {
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      userId: "clerk:user_agent_meridian",
      clerkUserId: "user_agent_meridian",
      role: "client_viewer",
      email: "meridian-agent@abarva.example.com",
    };

    const policy = await loadUserProgramAccessPolicy(ctx);

    expect(policy.accessLevel).toBe("no_program_access");
    expect(policy.programIdsAllowed).toEqual([]);
    expect(policy.canCreatePrograms).toBe(false);
    await expect(canReadProgram(ctx, "sky-move")).resolves.toBe(false);
  });

  it("does not over-grant non-admin Clerk tenant roles", async () => {
    setupRows({
      person_client_memberships: {
        role: "client_viewer",
        access_level: "program_viewer",
        financial_visibility: false,
        can_create_programs: false,
      },
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy } =
      await import("../program-access-policy");
    const policy = await loadUserProgramAccessPolicy({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      userId: "00000000-0000-4000-8000-000000000001",
      clerkUserId: "user_kk",
      role: "client_viewer",
      tenantRole: "viewer",
      email: "cto@skyharbor-air.example.com",
    });

    expect(policy.accessLevel).toBe("program_viewer");
    expect(policy.canCreatePrograms).toBe(false);
  });

  it("treats source-only users as no program access", async () => {
    setupRows({
      person_client_memberships: {
        role: "client_viewer",
        access_level: "source_member",
        financial_visibility: false,
        can_create_programs: false,
      },
      engagement_participants: [],
    });
    const { loadUserProgramAccessPolicy, canReadProgram } =
      await import("../program-access-policy");
    const ctx = {
      clientId: "client-1",
      userId: "00000000-0000-4000-8000-000000000001",
      role: "client_viewer",
    };

    const policy = await loadUserProgramAccessPolicy(ctx);

    expect(policy.accessLevel).toBe("no_program_access");
    expect(policy.programScope).toBe("assigned_programs_only");
    expect(policy.programIdsAllowed).toEqual([]);
    expect(policy.canCreatePrograms).toBe(false);
    await expect(canReadProgram(ctx, "program-a")).resolves.toBe(false);
  });

  it("resolves a canonical same-tenant Clerk persona email to person-scoped program access", async () => {
    setupRows({
      persons: { id: "00000000-0000-4000-8000-00000000c700" },
      person_client_memberships: {
        role: "client_viewer",
        access_level: "program_member",
        financial_visibility: false,
      },
      engagement_participants: [
        {
          engagement_id: "sky-move-1",
          approval_authority: "contributor",
          program_access_level: "program_member",
          can_view_financial: false,
          can_upload: true,
          can_generate_deliverables: true,
          can_publish_deliverables: false,
          can_approve_phase_gates: false,
        },
      ],
    });
    const { loadUserProgramAccessPolicy, canReadProgram } =
      await import("../program-access-policy");
    const ctx = {
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      userId: "clerk:user_skyharbor_cto",
      role: "client_viewer",
      email: "cto@skyharbor-air.example.com",
    };

    const policy = await loadUserProgramAccessPolicy(ctx);

    expect(policy.accessLevel).toBe("program_member");
    expect(policy.programIdsAllowed).toEqual(["sky-move-1"]);
    await expect(canReadProgram(ctx, "sky-move-1")).resolves.toBe(true);
    await expect(canReadProgram(ctx, "other-move")).resolves.toBe(false);
  });
});
