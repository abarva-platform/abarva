import { assignSyntheticE2eOperatorToCreatedMove } from "../synthetic-e2e-operator-participant";

const upsertParticipant = jest.fn();
jest.mock("@/lib/data-plane/write-adapters/adminWriteAdapter", () => ({
  selectAdminWriteAdapter: () => ({ upsertParticipant }),
}));

const ctx = {
  clientId: "00000000-0000-4000-8000-000000000001",
  clientKey: "meridian",
  userId: "00000000-0000-4000-8000-000000000002",
  clerkUserId: "user_operator",
  tenantRole: "viewer",
  role: "client_viewer",
  syntheticE2eOperator: true,
};
const moveId = "00000000-0000-4000-8000-000000000003";

beforeEach(() => upsertParticipant.mockReset().mockResolvedValue({ ok: true }));

it("assigns the automated creator only to its fresh Move with scoped capabilities", async () => {
  await assignSyntheticE2eOperatorToCreatedMove(ctx, moveId);
  expect(upsertParticipant).toHaveBeenCalledWith({
    existingId: null,
    payload: expect.objectContaining({
      engagement_id: moveId, user_id: ctx.userId,
      user_name: "AbarVa E2E Operator (automated)",
      program_access_level: "program_member", can_view_financial: true,
      can_approve_phase_gates: true, can_publish_deliverables: true,
    }),
  });
});

it("refuses cross-tenant and admin contexts before a write", async () => {
  await expect(assignSyntheticE2eOperatorToCreatedMove({ ...ctx, clientKey: "skyharbor" }, moveId))
    .rejects.toThrow("synthetic_e2e_operator_scope_invalid");
  await expect(assignSyntheticE2eOperatorToCreatedMove({ ...ctx, tenantRole: "tenant_admin" }, moveId))
    .rejects.toThrow("synthetic_e2e_operator_scope_invalid");
  expect(upsertParticipant).not.toHaveBeenCalled();
});

it("does not create a participant for ordinary users", async () => {
  await assignSyntheticE2eOperatorToCreatedMove({ ...ctx, syntheticE2eOperator: false }, moveId);
  expect(upsertParticipant).not.toHaveBeenCalled();
});
