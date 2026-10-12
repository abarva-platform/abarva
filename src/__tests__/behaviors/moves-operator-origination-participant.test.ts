import { assignSyntheticE2eOperatorToCreatedMove, isAutomaticOperatorParticipant } from "@/lib/auth/synthetic-e2e-operator-participant";
const mockUpsert = jest.fn();
jest.mock("@/lib/data-plane/write-adapters/adminWriteAdapter", () => ({ selectAdminWriteAdapter: () => ({ upsertParticipant: mockUpsert }) }));
const ctx = { clientId: "00000000-0000-4000-8000-000000000102", clientKey: "meridian",
  userId: "00000000-0000-4000-8000-000000000101", clerkUserId: "user_fixture_operator",
  role: "client_viewer", tenantRole: "viewer", syntheticE2eOperator: true };
const moveId = "00000000-0000-4000-8000-000000000104";
beforeEach(() => mockUpsert.mockReset().mockResolvedValue({ ok: true }));
it("keeps the automatically assigned creator eligible for preservation as a sponsor or lead", async () => {
  await assignSyntheticE2eOperatorToCreatedMove(ctx, moveId);
  expect(mockUpsert).toHaveBeenCalledTimes(1);
  expect(mockUpsert).toHaveBeenCalledWith({ existingId: null, payload: expect.objectContaining({
    engagement_id: moveId, user_id: ctx.userId, role: "Automated E2E Operator",
    program_access_level: "program_member", can_approve_phase_gates: true,
    can_view_financial: true, can_publish_deliverables: true, notify_on: [],
  }) });
  expect(isAutomaticOperatorParticipant(ctx, ctx.userId)).toBe(true);
  expect(isAutomaticOperatorParticipant(ctx, "00000000-0000-4000-8000-000000000105")).toBe(false);
});
it("leaves ordinary sponsor contacts outside the automatic participant lane", async () => {
  const ordinary = { ...ctx, syntheticE2eOperator: false };
  await assignSyntheticE2eOperatorToCreatedMove(ordinary, moveId);
  expect(mockUpsert).not.toHaveBeenCalled();
  expect(isAutomaticOperatorParticipant(ordinary, ctx.userId)).toBe(false);
});
it.each([{ clientKey: "skyharbor" }, { tenantRole: "tenant_admin" }, { role: "maestro" }, { userId: "invalid" }, { clerkUserId: undefined }])(
  "refuses scope %p before participant write", async (change) => {
    await expect(assignSyntheticE2eOperatorToCreatedMove({ ...ctx, ...change }, moveId)).rejects.toThrow("synthetic_e2e_operator_scope_invalid");
    expect(mockUpsert).not.toHaveBeenCalled();
  },
);
it("does not proceed after a refused assignment", async () => {
  mockUpsert.mockResolvedValue({ ok: false, detail: "refused" });
  await expect(assignSyntheticE2eOperatorToCreatedMove(ctx, moveId)).rejects.toThrow("synthetic_e2e_operator_participant_failed");
});
