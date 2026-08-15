export {};

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
  neq: jest.Mock;
  maybeSingle: jest.Mock;
  then: (
    resolve: (value: {
      data: unknown[];
      error: { message: string } | null;
    }) => unknown,
  ) => Promise<unknown>;
}

function makeBuilder(state: QueryState, rowsByTable: Record<string, unknown>) {
  const builder: Partial<MockQueryBuilder> = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    neq: jest.fn(() => builder),
    maybeSingle: jest.fn(async () => {
      const value = rowsByTable[state.table];
      return {
        data: Array.isArray(value) ? (value[0] ?? null) : (value ?? null),
        error: null,
      };
    }),
  };
  builder.then = (
    resolve: (value: {
      data: unknown[];
      error: { message: string } | null;
    }) => unknown,
  ) => {
    const value = rowsByTable[state.table];
    if (
      value &&
      typeof value === "object" &&
      "error" in (value as Record<string, unknown>)
    ) {
      return Promise.resolve(
        resolve(value as { data: unknown[]; error: { message: string } }),
      );
    }
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

describe("source access policy", () => {
  beforeEach(() => {
    jest.resetModules();
    fromMock.mockReset();
  });

  it("treats client_admin as all source events inside one active client only without implicit financial visibility", async () => {
    setupRows({
      person_client_memberships: {
        role: "maestro",
        access_level: "client_admin",
        financial_visibility: false,
        can_admin_users: true,
        can_approve_gates: true,
      },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-apex",
        userId: "00000000-0000-4000-8000-000000000001",
        role: "client_admin",
      },
      { activeClientKey: "apexretail" },
    );

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.sourceScope).toBe("all_client_source_events");
    expect(policy.sourceEventIdsAllowed).toBeNull();
    expect(policy.canApproveSourceStages).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
    expect(policy.allowedDataClasses).not.toContain("restricted_financial");
    expect(policy.deniedDataClasses).toContain("restricted_financial");
    expect(fromMock).not.toHaveBeenCalledWith("source_event_participants");
  });

  it("grants client_admin financial visibility only when the membership explicitly allows it", async () => {
    setupRows({
      person_client_memberships: {
        role: "maestro",
        access_level: "client_admin",
        financial_visibility: true,
        can_admin_users: true,
        can_approve_gates: true,
      },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-apex",
        userId: "00000000-0000-4000-8000-000000000001",
        role: "client_admin",
      },
      { activeClientKey: "apexretail" },
    );

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.sourceEventIdsAllowed).toBeNull();
    expect(policy.canViewFinancialData).toBe(true);
    expect(policy.allowedDataClasses).toContain("restricted_financial");
    expect(policy.deniedDataClasses).not.toContain("restricted_financial");
  });

  it("grants a Clerk tenant-admin with NO membership row source admin for their own active client (entry-path fix)", async () => {
    setupRows({
      person_client_memberships: null,
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-firstcapital",
        userId: "clerk:user_no_membership",
        role: "tenant_admin",
      },
      { activeClientKey: "firstcapital" },
    );

    // The fix: a Clerk tenant_admin without a persons-backed membership row is a
    // Source admin for their own active client (previously: no_source_access → 404).
    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.sourceScope).toBe("all_client_source_events");
    expect(policy.sourceEventIdsAllowed).toBeNull();
    expect(policy.canApproveSourceStages).toBe(true);
  });

  it("FENCE: a non-admin Clerk user with no membership gets NO source access (no over-grant)", async () => {
    setupRows({
      person_client_memberships: null,
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-firstcapital",
        userId: "clerk:plain_member",
        role: "member",
      },
      { activeClientKey: "firstcapital" },
    );

    // The fix must NOT over-grant: only genuine admin roles are upgraded. A plain
    // member with no membership still fails closed. Cross-tenant isolation is
    // enforced at the event-query layer (client_key) and is unchanged by this fix.
    expect(policy.accessLevel).toBe("no_source_access");
    expect(policy.sourceScope).toBe("none");
    expect(policy.sourceEventIdsAllowed).toEqual([]);
  });

  it("normalizes legacy abarva_super_admin to client_admin and never emits super-admin copy", async () => {
    setupRows({
      person_client_memberships: {
        access_level: "abarva_super_admin",
        financial_visibility: true,
      },
      source_event_participants: [],
    });
    const {
      loadUserSourceAccessPolicy,
      formatUserSourceAccessPolicyForPrompt,
    } = await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-apex",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      { activeClientKey: "apexretail" },
    );

    expect(policy.accessLevel).toBe("client_admin");
    expect(formatUserSourceAccessPolicyForPrompt(policy)).not.toContain(
      "super_admin",
    );
  });

  it("marks Lakeshore L0 sponsor as aggregate-only across the holding group", async () => {
    setupRows({
      person_client_memberships: {
        access_level: "client_admin",
        financial_visibility: true,
      },
      clients: {
        id: "client-lakeshore",
        tenant_key: "lakeshore-holdings",
        holding_group_id: "group-lakeshore",
        parent_client_id: null,
        holding_group_role: "l0_sponsor",
        aggregate_visibility_level: "group_aggregate",
      },
      source_event_participants: [],
    });
    const {
      loadUserSourceAccessPolicy,
      formatUserSourceAccessPolicyForPrompt,
    } = await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-lakeshore",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      { activeClientKey: "lakeshore" },
    );

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.federatedScope).toBe("l0_group_aggregate");
    expect(policy.canReadHoldingGroupAggregates).toBe(true);
    expect(policy.canReadSiblingTransactionGrain).toBe(false);
    expect(formatUserSourceAccessPolicyForPrompt(policy)).toContain(
      "L0 aggregate rollups",
    );
  });

  it("treats canonical client admin accounts as one-client client admins for Source", async () => {
    setupRows({});
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-skyharbor",
        userId: "clerk:user_canonical",
        role: "client_viewer",
        email: "anand@abarva.ai",
      },
      { activeClientKey: "skyharbor" },
    );

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.sourceEventIdsAllowed).toBeNull();
    expect(policy.canCreateSourceEvents).toBe(true);
    expect(policy.canApproveSourceStages).toBe(true);
    expect(policy.canViewFinancialData).toBe(false);
  });

  // Security regression guard (SEC-P1-* fix on canonical-admin shortcut at
  // source-access-policy.ts:209–227). Before the fix, a canonical admin (e.g.
  // cdio@meridian-health) acting against a *different* active tenant
  // (`apexretail`) was granted unlimited `client_admin` scope, leaking
  // cross-tenant Source events. After the fix the canonical-admin shortcut
  // only fires when the inferred home tenant matches `activeClientKey`;
  // otherwise the caller falls through to ordinary membership/participant
  // scoping (no membership row → no_source_access → denied).
  it("refuses canonical admin cross-tenant access (meridian admin reaching apexretail event)", async () => {
    setupRows({}); // no membership, no participants in apexretail
    const { loadUserSourceAccessPolicy, canReadSourceEvent } =
      await import("../source-access-policy");
    const meridianTenancy = {
      clientId: "client-apex",
      userId: "clerk:user_meridian_admin",
      role: "client_viewer",
      email: "cdio@meridian-health.example.com",
    };

    const policy = await loadUserSourceAccessPolicy(meridianTenancy, {
      activeClientKey: "apexretail",
    });

    expect(policy.accessLevel).toBe("no_source_access");
    expect(policy.sourceEventIdsAllowed).toEqual([]);
    await expect(
      canReadSourceEvent(meridianTenancy, "apexretail", "apex-event-1"),
    ).resolves.toBe(false);
  });

  it("still grants canonical admin full source access on their inferred home client", async () => {
    setupRows({});
    const { canReadSourceEvent } = await import("../source-access-policy");
    const canonicalAdminTenancy = {
      clientId: "client-apex",
      userId: "clerk:user_apex_admin",
      role: "client_admin",
      email: "cio@apex-retail.example.com",
    };

    // inferClientKeyFromEmail('cio@apex-retail.example.com') === 'apexretail',
    // so the canonical-admin shortcut fires and any event id under that
    // active client is readable (`sourceEventIdsAllowed === null`).
    await expect(
      canReadSourceEvent(canonicalAdminTenancy, "apexretail", "apex-event-1"),
    ).resolves.toBe(true);
  });

  it("treats canonical admin aliases as the same Source home client", async () => {
    setupRows({});
    const { canReadSourceEvent } = await import("../source-access-policy");
    const canonicalAdminTenancy = {
      clientId: "client-skyharbor",
      userId: "clerk:user_skyharbor_admin",
      role: "client_viewer",
      email: "anand@abarva.ai",
    };

    await expect(
      canReadSourceEvent(
        canonicalAdminTenancy,
        "skyharbor-air",
        "sky-source-1",
      ),
    ).resolves.toBe(true);
  });

  it("keeps pinned AbarVa admin/test accounts as Source admins after person provisioning", async () => {
    setupRows({
      person_client_memberships: {
        role: "client_viewer",
        access_level: "program_viewer",
        financial_visibility: false,
        can_create_source_events: false,
        can_approve_source_stages: false,
        can_approve_award: false,
      },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-skyharbor",
        userId: "00000000-0000-4000-8000-00000000a001",
        role: "client_viewer",
        email: "anand@abarva.ai",
      },
      { activeClientKey: "skyharbor" },
    );

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.sourceScope).toBe("all_client_source_events");
    expect(policy.sourceEventIdsAllowed).toBeNull();
    expect(policy.canCreateSourceEvents).toBe(true);
    expect(policy.canApproveSourceStages).toBe(true);
    expect(policy.canApproveAward).toBe(true);
  });

  it("does not grant pinned AbarVa admin/test accounts cross-tenant Source access", async () => {
    setupRows({});
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-meridian",
        userId: "00000000-0000-4000-8000-00000000a001",
        role: "client_viewer",
        email: "anand@abarva.ai",
      },
      { activeClientKey: "meridian" },
    );

    expect(policy.accessLevel).toBe("no_source_access");
    expect(policy.sourceScope).toBe("none");
    expect(policy.canCreateSourceEvents).toBe(false);
  });

  it("grants known same-tenant agent roster logins full Source proof scope", async () => {
    setupRows({});
    const { loadUserSourceAccessPolicy, canReadSourceEvent } =
      await import("../source-access-policy");
    const agentTenancy = {
      clientId: "client-skyharbor",
      userId: "65b59d7c-071c-41d7-b2b9-e52f7b45f81a",
      role: "client_viewer",
      email: "skyharbor-agent@abarva.example.com",
    };

    const policy = await loadUserSourceAccessPolicy(agentTenancy, {
      activeClientKey: "skyharbor",
    });

    expect(policy.accessLevel).toBe("client_admin");
    expect(policy.sourceScope).toBe("all_client_source_events");
    expect(policy.sourceEventIdsAllowed).toBeNull();
    await expect(
      canReadSourceEvent(
        agentTenancy,
        "skyharbor",
        "sky-source-event-1",
      ),
    ).resolves.toBe(true);
  });

  it("does not grant agent roster logins Source scope outside their tenant", async () => {
    setupRows({});
    const { loadUserSourceAccessPolicy, canReadSourceEvent } =
      await import("../source-access-policy");
    const agentTenancy = {
      clientId: "client-apex",
      userId: "clerk:user_skyharbor_agent",
      role: "client_viewer",
      email: "skyharbor-agent@abarva.example.com",
    };

    const policy = await loadUserSourceAccessPolicy(agentTenancy, {
      activeClientKey: "apexretail",
    });

    expect(policy.accessLevel).toBe("no_source_access");
    expect(policy.sourceEventIdsAllowed).toEqual([]);
    await expect(
      canReadSourceEvent(agentTenancy, "apexretail", "apex-source-event-1"),
    ).resolves.toBe(false);
  });

  it("restricts source members to assigned source event ids", async () => {
    setupRows({
      person_client_memberships: {
        access_level: "source_member",
        financial_visibility: false,
      },
      source_event_participants: [
        {
          source_event_id: "src-1",
          source_access_level: "source_member",
          approval_authority: "contributor",
          can_view_financial: false,
          can_upload_source_artifacts: true,
          can_generate_sourcing_artifacts: true,
          can_publish_sourcing_artifacts: false,
          can_approve_source_stages: false,
          can_approve_award: false,
        },
      ],
    });
    const { loadUserSourceAccessPolicy, canReadSourceEvent } =
      await import("../source-access-policy");
    const ctx = {
      clientId: "client-apex",
      userId: "00000000-0000-4000-8000-000000000001",
    };

    const policy = await loadUserSourceAccessPolicy(ctx, {
      activeClientKey: "apexretail",
    });

    expect(policy.sourceScope).toBe("assigned_source_events_only");
    expect(policy.sourceEventIdsAllowed).toEqual(["src-1"]);
    await expect(canReadSourceEvent(ctx, "apexretail", "src-1")).resolves.toBe(
      true,
    );
    await expect(canReadSourceEvent(ctx, "apexretail", "src-2")).resolves.toBe(
      false,
    );
  });

  it("resolves a canonical same-tenant Clerk persona email to person-scoped Source access", async () => {
    setupRows({
      persons: { id: "00000000-0000-4000-8000-00000000c700" },
      person_client_memberships: {
        access_level: "source_member",
        financial_visibility: false,
      },
      source_event_participants: [
        {
          source_event_id: "sky-source-1",
          source_access_level: "source_member",
          approval_authority: "contributor",
          can_view_financial: false,
          can_upload_source_artifacts: true,
          can_generate_sourcing_artifacts: true,
          can_publish_sourcing_artifacts: false,
          can_approve_source_stages: false,
          can_approve_award: false,
        },
      ],
    });
    const { loadUserSourceAccessPolicy, canReadSourceEvent } =
      await import("../source-access-policy");
    const ctx = {
      clientId: "client-skyharbor",
      userId: "clerk:user_skyharbor_cto",
      role: "client_viewer",
      email: "cto@skyharbor-air.example.com",
    };

    const policy = await loadUserSourceAccessPolicy(ctx, {
      activeClientKey: "skyharbor",
    });

    expect(policy.accessLevel).toBe("source_member");
    expect(policy.sourceEventIdsAllowed).toEqual(["sky-source-1"]);
    await expect(
      canReadSourceEvent(ctx, "skyharbor", "sky-source-1"),
    ).resolves.toBe(true);
    await expect(
      canReadSourceEvent(ctx, "skyharbor", "other-source"),
    ).resolves.toBe(false);
  });

  it("resolves a canonical same-tenant Clerk persona email when the active client key is an alias", async () => {
    setupRows({
      persons: { id: "00000000-0000-4000-8000-00000000c701" },
      person_client_memberships: {
        access_level: "source_member",
        financial_visibility: false,
      },
      source_event_participants: [
        {
          source_event_id: "sky-source-1",
          source_access_level: "source_member",
          approval_authority: "contributor",
          can_view_financial: false,
          can_upload_source_artifacts: true,
          can_generate_sourcing_artifacts: true,
          can_publish_sourcing_artifacts: false,
          can_approve_source_stages: false,
          can_approve_award: false,
        },
      ],
    });
    const { loadUserSourceAccessPolicy, canReadSourceEvent } =
      await import("../source-access-policy");
    const ctx = {
      clientId: "client-skyharbor",
      userId: "clerk:user_skyharbor_cto",
      role: "client_viewer",
      email: "cto@skyharbor-air.example.com",
    };

    const policy = await loadUserSourceAccessPolicy(ctx, {
      activeClientKey: "skyharbor-air",
    });

    expect(policy.accessLevel).toBe("source_member");
    expect(policy.sourceEventIdsAllowed).toEqual(["sky-source-1"]);
    await expect(
      canReadSourceEvent(ctx, "skyharbor-air", "sky-source-1"),
    ).resolves.toBe(true);
  });

  it("lets source members create new events without granting approval authority", async () => {
    setupRows({
      person_client_memberships: {
        access_level: "source_member",
        financial_visibility: false,
        can_create_source_events: true,
        can_approve_source_stages: false,
      },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-apex",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      { activeClientKey: "apexretail" },
    );

    expect(policy.accessLevel).toBe("source_member");
    expect(policy.canCreateSourceEvents).toBe(true);
    expect(policy.canApproveSourceStages).toBe(false);
    expect(policy.sourceEventIdsAllowed).toEqual([]);
  });

  it("treats programs-only users as no_source_access", async () => {
    setupRows({
      person_client_memberships: {
        access_level: "program_member",
        financial_visibility: false,
      },
      source_event_participants: [],
    });
    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-apex",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      { activeClientKey: "apexretail" },
    );

    expect(policy.accessLevel).toBe("no_source_access");
    expect(policy.sourceScope).toBe("none");
    expect(policy.canCreateSourceEvents).toBe(false);
    expect(policy.canUploadSourceArtifacts).toBe(false);
  });

  it("formats the financial visibility refusal rule for sourcing prompts", async () => {
    setupRows({
      person_client_memberships: {
        access_level: "source_member",
        financial_visibility: false,
      },
      source_event_participants: [
        { source_event_id: "src-1", source_access_level: "source_member" },
      ],
    });
    const {
      loadUserSourceAccessPolicy,
      formatUserSourceAccessPolicyForPrompt,
    } = await import("../source-access-policy");
    const policy = await loadUserSourceAccessPolicy(
      {
        clientId: "client-apex",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      { activeClientKey: "apexretail" },
    );

    expect(formatUserSourceAccessPolicyForPrompt(policy)).toContain(
      "exact vendor spend",
    );
    expect(formatUserSourceAccessPolicyForPrompt(policy)).toContain(
      "must not appear",
    );
  });

  it("loads membership before participant rows for non-admin users", async () => {
    const queryOrder: string[] = [];
    setupRows({
      person_client_memberships: {
        access_level: "source_member",
        financial_visibility: false,
      },
      source_event_participants: [
        { source_event_id: "src-1", source_access_level: "source_member" },
      ],
    });
    fromMock.mockImplementation((table: string) => {
      queryOrder.push(table);
      return makeBuilder(
        { table },
        {
          person_client_memberships: {
            access_level: "source_member",
            financial_visibility: false,
          },
          source_event_participants: [
            { source_event_id: "src-1", source_access_level: "source_member" },
          ],
        },
      );
    });

    const { loadUserSourceAccessPolicy } =
      await import("../source-access-policy");
    await loadUserSourceAccessPolicy(
      {
        clientId: "client-apex",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      { activeClientKey: "apexretail" },
    );

    expect(queryOrder).toEqual([
      "person_client_memberships",
      "clients",
      "source_event_participants",
    ]);
  });
});
