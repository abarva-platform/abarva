import { loadUserProgramAccessPolicy, canReadProgram } from "@/lib/auth/program-access-policy";
const actor = "00000000-0000-4000-8000-000000000101";
const client = "00000000-0000-4000-8000-000000000102";
const program = "00000000-0000-4000-8000-000000000104";
const ctx = { userId: actor, clientId: client, clientKey: "meridian", role: "client_viewer", syntheticE2eOperator: true, email: "proof@synthetic.invalid" };
const mockState = { member: { role: "client_viewer", access_level: "program_member", financial_visibility: true,
  can_admin_users: false, can_create_programs: true, can_approve_gates: true } as Record<string, unknown> | null,
  programs: [{ id: program }], participants: [{ engagement_id: program, role: "Automated E2E Operator",
    program_access_level: "program_member", approval_authority: "approver", can_approve_phase_gates: true,
    can_view_financial: true, can_upload: true, can_generate_deliverables: true, can_publish_deliverables: true }] as Array<Record<string, unknown>>,
  fail: "", calls: [] as Array<{ table: string; method: string; args: unknown[] }> };
jest.mock("@/lib/data-plane/postgresCompat", () => ({ getAzureReadFluentClient: () => ({ from: (table: string) => {
  const b: Record<string, unknown> = {};
  for (const method of ["select", "eq", "in", "is"]) b[method] = (...args: unknown[]) => {
    mockState.calls.push({ table, method, args }); return b;
  };
  const result = () => ({ data: mockState.fail === table ? null : table === "person_client_memberships" ? mockState.member
    : table === "engagements" ? mockState.programs : mockState.participants,
    error: mockState.fail === table ? { message: "unavailable" } : null });
  b.maybeSingle = async () => result();
  b.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result()).then(resolve);
  return b;
} }) }));
beforeEach(() => {
  mockState.member = { role: "client_viewer", access_level: "program_member", financial_visibility: true,
    can_admin_users: false, can_create_programs: true, can_approve_gates: true };
  mockState.programs = [{ id: program }]; mockState.fail = ""; mockState.calls = [];
  mockState.participants = [{ engagement_id: program, role: "Automated E2E Operator", program_access_level: "program_member",
    approval_authority: "approver", can_approve_phase_gates: true, can_view_financial: true,
    can_upload: true, can_generate_deliverables: true, can_publish_deliverables: true }];
});
it("preserves assigned-only creation and exact tenant/actor read predicates", async () => {
  expect(await loadUserProgramAccessPolicy(ctx)).toMatchObject({ accessLevel: "program_member", programIdsAllowed: [program],
    programScope: "assigned_programs_only", canCreatePrograms: true, canAdminUsers: false });
  expect(mockState.calls).toEqual(expect.arrayContaining([
    { table: "engagements", method: "eq", args: ["client_id", client] },
    { table: "engagement_participants", method: "eq", args: ["user_id", actor] },
    { table: "engagement_participants", method: "in", args: ["engagement_id", [program]] },
  ]));
  expect(await canReadProgram(ctx, program)).toBe(true);
  expect(await canReadProgram(ctx, "unassigned-program")).toBe(false);
});
it("allows first creation without viewing all programs", async () => {
  mockState.programs = [];
  expect(await loadUserProgramAccessPolicy(ctx)).toMatchObject({ programIdsAllowed: [], canCreatePrograms: true, canAdminUsers: false });
  expect(mockState.calls.some((c) => c.table === "engagement_participants")).toBe(false);
});
it("retains real creation denial and financial restrictions", async () => {
  mockState.member!.can_create_programs = false; mockState.member!.financial_visibility = false;
  mockState.participants = [];
  expect(await loadUserProgramAccessPolicy(ctx)).toMatchObject({ canCreatePrograms: false, canViewFinancialData: false,
    outputPolicy: { exactFinancialValues: false } });
});
it("does not turn a sponsor contact into product access", async () => {
  mockState.member = null; mockState.participants = [{ engagement_id: program, role: "Sponsor", approval_authority: "sponsor" }];
  expect(await loadUserProgramAccessPolicy(ctx)).toMatchObject({ accessLevel: "no_program_access", programIdsAllowed: [], canCreatePrograms: false });
});
it.each(["person_client_memberships", "engagements", "engagement_participants"])("keeps %s read failure unavailable", async (table) => {
  mockState.fail = table;
  await expect(loadUserProgramAccessPolicy(ctx)).rejects.toMatchObject({ code: "program_access_policy_unavailable" });
});

it("preserves an ordinary declared client administrator's existing client scope", async () => {
  expect(await loadUserProgramAccessPolicy({ ...ctx, syntheticE2eOperator: false, tenantRole: "tenant_admin" }))
    .toMatchObject({ accessLevel: "client_admin", programIdsAllowed: null, canCreatePrograms: true, canAdminUsers: true });
});
it("derives only assigned member access from a real participant without membership", async () => {
  mockState.member = null;
  expect(await loadUserProgramAccessPolicy(ctx)).toMatchObject({ accessLevel: "program_member", programIdsAllowed: [program],
    canCreatePrograms: false, canAdminUsers: false, canApproveGates: true, canViewFinancialData: true });
});
it("keeps a participant viewer assigned and without creator or publishing rights", async () => {
  mockState.member = null; mockState.participants = [{ engagement_id: program, role: "Reviewer",
    program_access_level: "program_viewer", can_view_financial: false, can_upload: false, can_generate_deliverables: false }];
  expect(await loadUserProgramAccessPolicy(ctx)).toMatchObject({ accessLevel: "program_viewer", programIdsAllowed: [program],
    canCreatePrograms: false, canApproveGates: false, canPublishDeliverables: false,
    canUploadArtifacts: false, canGenerateDeliverables: false, canViewFinancialData: false });
});
it("denies a noncanonical actor with no identity resolver input", async () => {
  mockState.member = null; mockState.participants = [];
  expect(await loadUserProgramAccessPolicy({ ...ctx, userId: "clerk:unbound", email: undefined }))
    .toMatchObject({ accessLevel: "no_program_access", programIdsAllowed: [], canCreatePrograms: false });
  expect(mockState.calls).toHaveLength(0);
});
