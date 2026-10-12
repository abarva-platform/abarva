import "server-only";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { selectAdminWriteAdapter } from "@/lib/data-plane/write-adapters/adminWriteAdapter";
import { isSyntheticE2eOperatorTenant } from "@/lib/auth/synthetic-e2e-operator";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Used after automatic assignment succeeds; preserve that exact person's role. */
export function isAutomaticOperatorParticipant(ctx: TenancyCtx, personId: string): boolean {
  return ctx.syntheticE2eOperator === true && personId === ctx.userId;
}

/** Assign the creator only to the fresh Move. A failed assignment stops the flow. */
export async function assignSyntheticE2eOperatorToCreatedMove(
  ctx: TenancyCtx,
  moveId: string,
): Promise<void> {
  if (!ctx.syntheticE2eOperator) return;
  if (!ctx.clientKey || !isSyntheticE2eOperatorTenant(ctx.clientKey) ||
    !ctx.clerkUserId || !UUID.test(ctx.userId) || !UUID.test(moveId) ||
    ctx.tenantRole === "tenant_admin" || ctx.role === "maestro")
    throw new Error("synthetic_e2e_operator_scope_invalid");
  const result = await selectAdminWriteAdapter().upsertParticipant({
    existingId: null,
    payload: {
      engagement_id: moveId,
      user_id: ctx.userId,
      user_name: "AbarVa E2E Operator (automated)",
      role: "Automated E2E Operator",
      notify_on: [],
      approval_authority: "approver",
      program_access_level: "program_member",
      can_view_financial: true,
      can_upload: true,
      can_generate_deliverables: true,
      can_publish_deliverables: true,
      can_approve_phase_gates: true,
    },
  });
  if (!result.ok) throw new Error(`synthetic_e2e_operator_participant_failed:${result.detail}`);
}
