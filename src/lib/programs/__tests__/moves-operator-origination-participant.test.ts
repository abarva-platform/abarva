import { submitOriginationBrief } from "@/lib/programs/origination-submit";
const mockActor = { id: "00000000-0000-4000-8000-000000000101", name: "Automated Proof", email: "proof@synthetic.invalid", role: "client_viewer", organization: "Fixture Tenant" };
const mockOther = { id: "00000000-0000-4000-8000-000000000105", name: "Fixture Owner", email: "owner@synthetic.invalid", role: "client_viewer", organization: "Fixture Tenant" };
const mockClient = { id: "00000000-0000-4000-8000-000000000102", key: "meridian", name: "Fixture Tenant", industry_code: "general" };
const mockMove = "00000000-0000-4000-8000-000000000104";
const mockState = { dedicated: true, participants: [] as Array<Record<string, unknown>> };
jest.mock("@/app/api/v1/programs/_auth", () => ({ requireTenancy: async () => ({
  clientId: mockClient.id, clientKey: mockClient.key, userId: mockActor.id,
  email: mockActor.email, role: "client_viewer", syntheticE2eOperator: mockState.dedicated,
}), TenancyError: class extends Error {} }));
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: async () => mockClient }));
jest.mock("@/lib/auth/program-access-policy", () => ({ loadUserProgramAccessPolicy: async () => ({ canCreatePrograms: true }) }));
jest.mock("@/lib/programs/approval", () => ({ submitForApproval: async () => ({ id: "approval-fixture" }) }));
jest.mock("@/lib/programs/origination-drafts", () => ({ markDraftCommitted: async () => undefined }));
jest.mock("@/lib/decisions/auto-linker", () => ({ ensureThreadForMove: async () => ({ id: "thread-fixture" }) }));
jest.mock("@/lib/intelligence/ask/session-memory", () => ({ linkAskSessionToMove: async () => undefined }));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: () => false }));
jest.mock("@/lib/programs/mutations", () => ({ buildEngagementGraphNodeId: () => "program_fixture" }));
jest.mock("@/lib/programs/p0-phase-capture", () => ({ persistP0PhaseCaptureFromSource: async () => undefined }));
jest.mock("@/lib/programs/origination-charter-extensions", () => ({ originationCharterExtensions: () => ({}) }));
jest.mock("@/lib/programs/discovery/charter-transformers", () => ({
  applyDiscoveryShapeIfEnabled: () => null, embedDiscoveryPlanInCharter: (charter: unknown) => charter,
}));
jest.mock("@/lib/programs/discovery/discovery-intake", () => ({ planFromShape: () => ({}) }));
jest.mock("@/lib/programs/archetype-normalization", () => ({ normalizeProgramArchetype: () => "other" }));
jest.mock("@/lib/programs/declared-archetype-function-identity", () => ({ mayGuessFunctionPackForDeclaredArchetype: () => true }));
jest.mock("@/lib/programs/discovery/discovery-archetype-declaration", () => ({
  normalizeDiscoveryArchetypeDeclaration: () => null,
  withDeclaredDiscoveryArchetype: (charter: unknown) => charter,
}));
jest.mock("@/lib/programs/pattern-authority", () => ({
  programPatternLookupFromClient: () => null, resolvePromotedProgramPatternKey: async () => null,
  isProgramPatternAuthorityError: () => false,
}));
jest.mock("@/lib/auth/synthetic-e2e-operator-participant", () => ({
  isAutomaticOperatorParticipant: (...args: unknown[]) => jest.requireActual("@/lib/auth/synthetic-e2e-operator-participant").isAutomaticOperatorParticipant(...args),
  assignSyntheticE2eOperatorToCreatedMove: async (ctx: { syntheticE2eOperator: boolean }) => {
    if (ctx.syntheticE2eOperator) mockState.participants.push({ user_id: mockActor.id,
      engagement_id: mockMove, role: "Automated E2E Operator", program_access_level: "program_member",
      can_approve_phase_gates: true, can_view_financial: true, notify_on: [] });
  },
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({ from: mockBuilder }),
  getAzureWriteFluentClient: () => ({ from: mockBuilder }),
}));
function mockBuilder(table: string) {
  let operation = "select";
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "gte", "or", "order", "limit", "in", "neq", "is"])
    builder[method] = () => builder;
  builder.insert = (row: Record<string, unknown>) => {
    operation = "insert";
    if (table === "engagement_participants") mockState.participants.push(row);
    return builder;
  };
  builder.update = builder.delete = () => builder;
  const settle = async () => ({ data: table === "persons" ? [mockActor, mockOther]
    : table === "engagements" && operation === "insert" ? { id: mockMove } : null, error: null });
  builder.maybeSingle = builder.single = settle;
  builder.then = (resolve: (v: unknown) => unknown) => settle().then(resolve);
  return builder;
}
beforeEach(() => { mockState.dedicated = true; mockState.participants = []; });

it.each([
  [mockActor.name, mockActor.name], [mockOther.name, mockActor.name],
])("preserves one assigned operator when sponsor=%s and lead=%s", async (sponsor, lead) => {
  expect(await submitOriginationBrief({ surface: "/strategic-moves/new", programName: "Fixture work",
    problemStatement: "Fixture process improvement", sponsor, lead })).toMatchObject({ engagementId: mockMove });
  const assigned = mockState.participants.filter((row) => row.user_id === mockActor.id);
  expect(assigned).toHaveLength(1);
  expect(assigned[0]).toMatchObject({ role: "Automated E2E Operator", program_access_level: "program_member",
    can_approve_phase_gates: true, can_view_financial: true, notify_on: [] });
});

it("preserves ordinary sponsor contact behavior without operator privileges", async () => {
  mockState.dedicated = false;
  await submitOriginationBrief({ surface: "/strategic-moves/new", programName: "Fixture work",
    problemStatement: "Fixture process improvement", sponsor: mockActor.name, lead: mockActor.name });
  expect(mockState.participants).toHaveLength(1);
  expect(mockState.participants[0]).toMatchObject({ role: "Sponsor", program_access_level: "program_viewer",
    can_approve_phase_gates: false, notify_on: [] });
});
