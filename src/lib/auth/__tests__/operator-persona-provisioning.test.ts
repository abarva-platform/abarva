import { ensureOperatorPersonProvisioned } from "../operator-persona-provisioning";

const createPersonMock = jest.fn();
jest.mock("@/lib/db/person", () => ({
  createPerson: (...args: unknown[]) => createPersonMock(...args),
}));

// Chainable fluent-client mock. Per-table behavior is configured via `state`.
const state: {
  existingPerson: { id: string; name?: string; primary_role?: string; graph_node_id?: string } | null;
  existingMembership: { id: string } | null;
  allMemberships: Array<{ id: string; client_id: string; access_level: string; can_admin_users: boolean }>;
  inserts: Array<{ table: string; row: Record<string, unknown> }>;
  updates: Array<{ table: string; row: Record<string, unknown> }>;
} = {
  existingPerson: null,
  existingMembership: null,
  allMemberships: [],
  inserts: [],
  updates: [],
};

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({
    from(table: string) {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      builder.select = chain;
      builder.eq = chain;
      builder.then = (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: table === "person_client_memberships" ? state.allMemberships : [], error: null }).then(resolve);
      builder.maybeSingle = async () => ({
        data:
          table === "persons"
            ? state.existingPerson
            : table === "person_client_memberships"
              ? state.existingMembership
              : null,
        error: null,
      });
      builder.update = (row: Record<string, unknown>) => {
        state.updates.push({ table, row });
        return { eq: async () => ({ error: null }) };
      };
      builder.insert = async (row: Record<string, unknown>) => {
        state.inserts.push({ table, row });
        return { error: null };
      };
      return builder;
    },
  }),
}));

const base = {
  clerkUserId: "user_abc",
  email: "anand.sundaram+skyharbor@thesundaram.com",
  name: "Anand Sundaram",
  clerkRole: "maestro",
  clientId: "00000000-0000-4000-8000-000000000abc",
  clientKey: "skyharbor-air",
  clientName: "SkyHarbor Air",
};

beforeEach(() => {
  createPersonMock.mockReset().mockResolvedValue({ id: "person-uuid-1" });
  state.existingPerson = null;
  state.existingMembership = null;
  state.allMemberships = [];
  state.inserts = [];
  state.updates = [];
});

describe("ensureOperatorPersonProvisioned — safety guards", () => {
  it("refuses a non-canonical tenant (returns null, no writes)", async () => {
    const r = await ensureOperatorPersonProvisioned({
      ...base,
      clientKey: "morgan-street",
    });
    expect(r).toBeNull();
    expect(createPersonMock).not.toHaveBeenCalled();
    expect(state.inserts).toHaveLength(0);
  });

  it("accepts the app-form tenant key (skyharbor -> skyharbor-air)", async () => {
    const r = await ensureOperatorPersonProvisioned({
      ...base,
      clientKey: "skyharbor",
    });
    expect(r).not.toBeNull();
    expect(createPersonMock).toHaveBeenCalledTimes(1);
    expect(
      state.inserts.filter((i) => i.table === "person_client_memberships"),
    ).toHaveLength(1);
  });

  it("refuses when email is missing (email is the idempotency key)", async () => {
    const r = await ensureOperatorPersonProvisioned({ ...base, email: null });
    expect(r).toBeNull();
    expect(createPersonMock).not.toHaveBeenCalled();
  });

  it("refuses when clientId is missing", async () => {
    const r = await ensureOperatorPersonProvisioned({ ...base, clientId: "" });
    expect(r).toBeNull();
  });
});

describe("ensureOperatorPersonProvisioned — provisioning", () => {
  it("creates persons + exactly one client_admin membership for an admin persona", async () => {
    const r = await ensureOperatorPersonProvisioned(base);
    expect(r).toEqual({
      personId: "person-uuid-1",
      role: "maestro",
      accessLevel: "client_admin",
    });
    expect(createPersonMock).toHaveBeenCalledTimes(1);
    const memberships = state.inserts.filter(
      (i) => i.table === "person_client_memberships",
    );
    expect(memberships).toHaveLength(1);
    expect(memberships[0].row).toMatchObject({
      person_id: "person-uuid-1",
      client_id: base.clientId,
      access_level: "client_admin",
    });
  });

  it("is idempotent: reuses an existing persons row (no duplicate create)", async () => {
    state.existingPerson = {
      id: "existing-1",
      name: "Anand Sundaram",
      primary_role: "maestro",
    };
    const r = await ensureOperatorPersonProvisioned(base);
    expect(r?.personId).toBe("existing-1");
    expect(createPersonMock).not.toHaveBeenCalled();
  });

  it("repairs an existing placeholder name from the authenticated Clerk profile", async () => {
    state.existingPerson = {
      id: "existing-1",
      name: "User",
      primary_role: "maestro",
    };

    const r = await ensureOperatorPersonProvisioned(base);

    expect(r?.personId).toBe("existing-1");
    expect(state.updates).toContainEqual({
      table: "persons",
      row: { name: "Anand Sundaram" },
    });
  });

  it("does not replace an existing non-placeholder person name", async () => {
    state.existingPerson = {
      id: "existing-1",
      name: "Existing Reviewer",
      primary_role: "maestro",
    };

    await ensureOperatorPersonProvisioned(base);

    expect(state.updates).not.toContainEqual({
      table: "persons",
      row: { name: "Anand Sundaram" },
    });
  });

  it("does not insert a second membership when one already exists", async () => {
    state.existingPerson = {
      id: "existing-1",
      name: "Anand Sundaram",
      primary_role: "maestro",
    };
    state.existingMembership = { id: "m-1" };
    await ensureOperatorPersonProvisioned(base);
    expect(
      state.inserts.filter((i) => i.table === "person_client_memberships"),
    ).toHaveLength(0);
  });

  it("derives non-admin (program_viewer) when Clerk role is not admin", async () => {
    const r = await ensureOperatorPersonProvisioned({
      ...base,
      clerkRole: "client_viewer",
      tenantRoles: {},
    });
    expect(r?.role).toBe("client_viewer");
    expect(r?.accessLevel).toBe("program_viewer");
  });

  it("treats tenantRoles[clientKey]=tenant_admin as admin", async () => {
    const r = await ensureOperatorPersonProvisioned({
      ...base,
      clerkRole: "viewer",
      tenantRoles: { "skyharbor-air": "tenant_admin" },
    });
    expect(r?.accessLevel).toBe("client_admin");
  });

  it("binds the exact Clerk actor to one scoped creator membership", async () => {
    const r = await ensureOperatorPersonProvisioned({
      ...base, clerkRole: "client_viewer", clientKey: "meridian",
      tenantRoles: {}, syntheticE2eOperator: true,
      syntheticE2eApprovalRef: "private-approval-reference",
    });
    expect(r).toEqual({ personId: "person-uuid-1", role: "client_viewer", accessLevel: "program_member" });
    expect(createPersonMock).toHaveBeenCalledWith(expect.objectContaining({
      graph_node_id: "clerk:user_abc", role: "client_viewer",
    }));
    expect(state.inserts.find((item) => item.table === "person_client_memberships")?.row)
      .toMatchObject({ access_level: "program_member", can_admin_users: false,
        can_create_programs: true, can_approve_gates: true, financial_visibility: true });
    expect(state.inserts.find((item) => item.table === "admin_audit_log")?.row)
      .toMatchObject({ action: "synthetic_e2e_operator.identity_bound",
        metadata: expect.objectContaining({ clerkUserId: "user_abc", approvalRef: "private-approval-reference" }) });
  });

  it("refuses a dedicated actor on another tenant or an existing unlinked identity", async () => {
    const wrongTenant = await ensureOperatorPersonProvisioned({
      ...base, clerkRole: "client_viewer", syntheticE2eOperator: true,
      syntheticE2eApprovalRef: "private-approval-reference",
    });
    expect(wrongTenant).toBeNull();
    state.existingPerson = { id: "existing-1", primary_role: "client_viewer", graph_node_id: "another-actor" };
    const unlinked = await ensureOperatorPersonProvisioned({
      ...base, clerkRole: "client_viewer", clientKey: "meridian",
      syntheticE2eOperator: true, syntheticE2eApprovalRef: "private-approval-reference",
    });
    expect(unlinked).toBeNull();
    expect(state.inserts).toHaveLength(0);
  });
});
