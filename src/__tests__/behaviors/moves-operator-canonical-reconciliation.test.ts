import { ensureOperatorPersonProvisioned } from "@/lib/auth/operator-persona-provisioning";

const mockPerson = {
  id: "00000000-0000-4000-8000-000000000101", name: "Automated Proof",
  email: "proof@synthetic.invalid", role: "client_viewer", primary_role: "client_viewer",
  graph_node_id: "person_automated_proof_1791768409000",
  updated_at: "2026-10-12T01:26:49.000Z",
  xmin: "4101",
};
const mockMembership = {
  id: "00000000-0000-4000-8000-000000000103", person_id: mockPerson.id,
  client_id: "00000000-0000-4000-8000-000000000102", role: "client_viewer",
  access_level: "program_viewer", financial_visibility: false, can_admin_users: false,
  can_create_programs: false, can_approve_gates: false,
  can_create_source_events: false, can_approve_source_stages: false, can_approve_award: false,
  can_upload_source_artifacts: true, can_generate_sourcing_artifacts: true,
  can_publish_sourcing_artifacts: false,
  revision_token: "4102",
};
const mockState = {
  person: { ...mockPerson }, memberships: [{ ...mockMembership }], participants: [] as unknown[],
  duplicatePerson: false, auditFailure: false, auditZeroRows: false, personCasFailure: false, membershipCasFailure: false,
  readbackFailure: false, personDrift: false, queries: [] as string[], audits: [] as Record<string, unknown>[],
  commits: 0, rollbacks: 0, fluentWrites: 0, params: [] as unknown[][],
};
const mockCreatePerson = jest.fn();
jest.mock("@/lib/db/person", () => ({ createPerson: (...args: unknown[]) => mockCreatePerson(...args) }));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  resolveDatabaseUrlCandidates: () => ["fixture-only-not-a-database"],
  getAzureWriteFluentClient: () => ({ from: (table: string) => {
    const builder = {
      select: () => builder, eq: () => builder,
      maybeSingle: async () => ({ data: table === "person_client_memberships"
        ? { ...mockState.memberships[0], ...(mockState.readbackFailure ? { can_admin_users: true } : {}) }
        : { ...mockState.person }, error: null }),
      update: () => { mockState.fluentWrites++; return builder; },
      insert: () => { mockState.fluentWrites++; return builder; },
      then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return builder;
  } }),
  withAzureWriteTransaction: async (_url: string, work: (query: (sql: string, params: unknown[]) => Promise<unknown>) => Promise<unknown>) => {
    const before = structuredClone({ person: mockState.person, memberships: mockState.memberships, audits: mockState.audits });
    const query = async (sql: string, params: unknown[]) => {
      mockState.queries.push(sql);
      mockState.params.push(structuredClone(params));
      if (sql.startsWith("SELECT") && sql.includes("FROM persons")) {
        const person = { ...mockState.person, revision_token: mockState.personDrift ? "4103" : mockState.person.xmin };
        return { rows: mockState.duplicatePerson ? [person, { ...person, id: "another-person" }] : [person] };
      }
      if (sql.startsWith("SELECT") && sql.includes("FROM person_client_memberships")) return { rows: structuredClone(mockState.memberships) };
      if (sql.startsWith("SELECT") && sql.includes("FROM engagement_participants")) return { rows: mockState.participants };
      if (sql.startsWith("UPDATE persons")) {
        if (mockState.personCasFailure) return { rows: [], rowCount: 0 };
        mockState.person.graph_node_id = params[0] as string;
        return { rows: [{ id: mockState.person.id }], rowCount: 1 };
      }
      if (sql.startsWith("UPDATE person_client_memberships")) {
        if (mockState.membershipCasFailure) return { rows: [], rowCount: 0 };
        Object.assign(mockState.memberships[0], { access_level: "program_member", financial_visibility: true,
          can_admin_users: false, can_create_programs: true, can_approve_gates: true,
          can_create_source_events: false, can_approve_source_stages: false, can_approve_award: false,
          can_upload_source_artifacts: false, can_generate_sourcing_artifacts: false, can_publish_sourcing_artifacts: false });
        return { rows: [{ id: mockMembership.id }], rowCount: 1 };
      }
      if (sql.startsWith("INSERT INTO admin_audit_log")) {
        if (mockState.auditFailure) throw new Error("audit unavailable");
        if (mockState.auditZeroRows) return { rows: [], rowCount: 0 };
        mockState.audits.push(JSON.parse(params[3] as string));
        return { rows: [{ id: "audit-fixture" }], rowCount: 1 };
      }
      if (sql.startsWith("SELECT") && sql.includes("JOIN person_client_memberships")) return {
        rows: [{ graph_node_id: mockState.person.graph_node_id, ...mockState.memberships[0],
          ...(mockState.readbackFailure ? { can_admin_users: true } : {}) }],
      };
      throw new Error("Unexpected SQL: " + sql);
    };
    try { const result = await work(query); mockState.commits++; return result; }
    catch (error) {
      Object.assign(mockState, before); mockState.rollbacks++; throw error;
    }
  },
}));

const input = {
  clerkUserId: "user_fixture_operator", email: mockPerson.email, name: mockPerson.name,
  clerkRole: "client_viewer", clientId: mockMembership.client_id, clientKey: "meridian",
  tenantRoles: { meridian: "viewer" }, syntheticE2eOperator: true,
  syntheticE2eApprovalRef: "private-approval-reference",
  syntheticE2eAuthority: { source: "authenticated_clerk_profile" as const,
    clerkUserId: "user_fixture_operator", email: mockPerson.email,
    approvalRef: "private-approval-reference", profileSha256: "a".repeat(64) },
};
beforeEach(() => {
  Object.assign(mockState, { person: { ...mockPerson }, memberships: [{ ...mockMembership }], participants: [],
    duplicatePerson: false, auditFailure: false, auditZeroRows: false, personCasFailure: false, membershipCasFailure: false,
    readbackFailure: false, personDrift: false, queries: [], params: [], audits: [], commits: 0, rollbacks: 0, fluentWrites: 0 });
  mockCreatePerson.mockReset();
});

it("reconciles only the verified actor's unchanged unbound viewer and one membership atomically", async () => {
  expect(await ensureOperatorPersonProvisioned(input)).toEqual({
    personId: mockPerson.id, role: "client_viewer", accessLevel: "program_member",
  });
  expect(mockState.person.id).toBe(mockPerson.id);
  expect(mockState.person.graph_node_id).toBe("clerk:user_fixture_operator");
  expect(mockState.memberships).toHaveLength(1);
  expect(mockState.memberships[0]).toMatchObject({ access_level: "program_member", can_admin_users: false,
    financial_visibility: true, can_create_programs: true, can_approve_gates: true,
    can_upload_source_artifacts: false, can_generate_sourcing_artifacts: false });
  expect(mockState.participants).toHaveLength(0);
  expect(mockState.audits).toHaveLength(1);
  expect(mockState.audits[0]).toMatchObject({ clerkUserId: input.clerkUserId,
    approvalRef: input.syntheticE2eApprovalRef, programScope: "assigned_programs_only", profileSha256: "a".repeat(64) });
  expect(mockState.commits).toBe(1);
  expect(mockCreatePerson).not.toHaveBeenCalled();
  expect(mockState.fluentWrites).toBe(0);
  const personUpdate = mockState.queries.find((sql) => sql.startsWith("UPDATE persons"));
  expect(personUpdate).toContain("graph_node_id = $3");
  expect(personUpdate).toContain("xmin::text = $8");
  expect(mockState.params[mockState.queries.indexOf(personUpdate!)]).toContain(mockPerson.xmin);
  const membershipUpdate = mockState.queries.find((sql) => sql.startsWith("UPDATE person_client_memberships"));
  expect(membershipUpdate).toContain("person_id = $2 AND client_id = $3");
  expect(membershipUpdate).toContain("can_generate_sourcing_artifacts IS NOT DISTINCT FROM");
  expect(membershipUpdate).toContain("xmin::text = $16");
  expect(mockState.params[mockState.queries.indexOf(membershipUpdate!)]).toContain(true);
});

it.each(["clerkUserId", "email", "approvalRef", "source", "profileSha256"])(
  "refuses invalid server authority %s without a reconciliation write", async (field) => {
    const authority = { ...input.syntheticE2eAuthority, [field]: "invalid" };
    expect(await ensureOperatorPersonProvisioned({ ...input, syntheticE2eAuthority: authority })).toBeNull();
    expect(mockState.person).toEqual(mockPerson);
    expect(mockState.memberships).toEqual([mockMembership]);
    expect(mockState.fluentWrites).toBe(0);
    expect(mockState.queries).toHaveLength(0);
  },
);

it("refuses an operator boolean without authenticated profile authority", async () => {
  expect(await ensureOperatorPersonProvisioned({ ...input, syntheticE2eAuthority: undefined })).toBeNull();
  expect(mockState.queries).toHaveLength(0);
});

it.each(["clerk:user_other_actor", "unknown-graph-link"])("never rebinds another identity %s", async (graph_node_id) => {
  mockState.person.graph_node_id = graph_node_id;
  expect(await ensureOperatorPersonProvisioned(input)).toBeNull();
  expect(mockState.person.graph_node_id).toBe(graph_node_id);
  expect(mockState.audits).toHaveLength(0);
});

it.each(["duplicatePerson", "personDrift", "personCasFailure", "membershipCasFailure", "auditFailure", "auditZeroRows", "readbackFailure"] as const)(
  "rolls back unchanged identity and capabilities on %s", async (flag) => {
    mockState[flag] = true;
    expect(await ensureOperatorPersonProvisioned(input)).toBeNull();
    expect(mockState.person).toEqual(mockPerson);
    expect(mockState.memberships).toEqual([mockMembership]);
    expect(mockState.audits).toHaveLength(0);
    expect(mockState.commits).toBe(0);
    expect(mockState.rollbacks).toBe(1);
    if (flag === "personCasFailure") expect(mockState.queries.some((sql) => sql.startsWith("UPDATE person_client_memberships"))).toBe(false);
    if (flag === "membershipCasFailure") expect(mockState.queries.some((sql) => sql.startsWith("INSERT INTO admin_audit_log"))).toBe(false);
  },
);

it.each(["other-client", "second-membership", "client-admin", "create-already-enabled", "existing-participant"])(
  "refuses pre-existing scope %s", async (scope) => {
    if (scope === "other-client") mockState.memberships[0].client_id = "other-client";
    if (scope === "second-membership") mockState.memberships.push({ ...mockMembership });
    if (scope === "client-admin") mockState.memberships[0].can_admin_users = true;
    if (scope === "create-already-enabled") mockState.memberships[0].can_create_programs = true;
    if (scope === "existing-participant") mockState.participants.push({ id: "participant-fixture" });
    const before = structuredClone(mockState.memberships);
    expect(await ensureOperatorPersonProvisioned(input)).toBeNull();
    expect(mockState.person).toEqual(mockPerson);
    expect(mockState.memberships).toEqual(before);
    expect(mockState.audits).toHaveLength(0);
    expect(mockState.commits).toBe(0);
    expect(mockState.queries.some((sql) => sql.startsWith("UPDATE "))).toBe(false);
  },
);

it("does not reconcile or grant creation to an ordinary viewer with the same email", async () => {
  expect(await ensureOperatorPersonProvisioned({ ...input, syntheticE2eOperator: false })).toMatchObject({ accessLevel: "program_viewer" });
  expect(mockState.person).toEqual(mockPerson);
  expect(mockState.memberships[0].can_create_programs).toBe(false);
  expect(mockState.queries).toHaveLength(0);
});
