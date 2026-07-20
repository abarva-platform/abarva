// Named, multi-role deliverable approval — Business / Technology / Finance /
// Risk-Security, each tracked independently.
//
// This sits ALONGSIDE the existing single-actor sign-off (mutations.ts's
// signOffDeliverable, deliverables_v2.status/signed_off_by/signed_off_version).
// That remains the "the deliverable is finalized/approved" flag and finalization
// step — it is unchanged by this file. What this file adds is a way for a
// deliverable TYPE to require one or more of the four role categories below
// to each independently record their own review status before the overall
// sign-off should be considered meaningful for a governed artifact. Whether a
// given deliverable type requires any roles at all is declared per-type in
// REQUIRED_APPROVAL_ROLES (default: no roles required, i.e. today's existing
// single-actor sign-off behavior is completely unaffected unless a type opts in).

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { getProgramById } from "@/lib/programs/queries";

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error(
      "[programs/deliverable-role-approvals] TenancyCtx missing clientId or userId",
    );
  }
}

async function assertProgramTenancy(
  ctx: TenancyCtx,
  programId: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<void> {
  const program = await getProgramById(ctx, programId, {
    supabase: opts.supabase,
  });
  if (!program)
    throw new Error(
      `[programs/deliverable-role-approvals] program ${programId} not accessible`,
    );
}

export type ApprovalRole = "business" | "technology" | "finance" | "risk_security";

export const APPROVAL_ROLE_LABELS: Record<ApprovalRole, string> = {
  business: "Business approver",
  technology: "Technology approver",
  finance: "Finance approver",
  risk_security: "Risk/security approver",
};

export type RoleApprovalStatus = "pending" | "reviewed" | "approved" | "rejected";

/**
 * Which roles a deliverable TYPE requires, keyed by deliverableTypeKey. A type
 * absent from this map requires no role approvals — the existing single-actor
 * sign-off is the only gate for it, exactly as today. Populate this
 * deliberately per type rather than defaulting every type to every role; most
 * artifact types do not need a four-way sign-off.
 *
 * These keys MUST match `deliverables_v2.deliverable_type_key` verbatim — that
 * column stores the phase-registry key from `deliverable-registry.ts`
 * (`DeliverableSpec.deliverableTypeKey`), not the orchestrator's internal
 * `deliverableType` (those two diverge for some types, e.g. the registry key
 * `operating_model_design` maps to orchestrator type `operating_model` via
 * `orchestratorDeliverableType()` in `orchestrated-deliverable-map.ts`). Using
 * the orchestrator-mapped name here — as an earlier version of this file did
 * for the operating-model entry — silently means that type never requires any
 * role approval, since no `deliverables_v2` row is ever written with that key.
 */
export const REQUIRED_APPROVAL_ROLES: Partial<Record<string, ApprovalRole[]>> = {
  business_case: ["business", "finance"],
  target_state_architecture: ["technology", "risk_security"],
  operating_model_design: ["business", "technology"],
};

export function requiredApprovalRolesFor(deliverableTypeKey: string): ApprovalRole[] {
  return REQUIRED_APPROVAL_ROLES[deliverableTypeKey] ?? [];
}

export interface RoleApprovalRecord {
  role: ApprovalRole;
  status: RoleApprovalStatus;
  approverUserId: string | null;
  approverName: string | null;
  outstandingConditions: string | null;
  decidedAt: string | null;
}

export interface RoleApprovalSummary {
  deliverableId: string;
  requiredRoles: ApprovalRole[];
  records: RoleApprovalRecord[];
  /** true only when every required role has an `approved` record. */
  allRequiredApproved: boolean;
  /** true when at least one required role has been explicitly rejected. */
  anyRejected: boolean;
}

interface RoleApprovalRow {
  role: ApprovalRole;
  status: RoleApprovalStatus;
  approver_user_id: string | null;
  approver_name: string | null;
  outstanding_conditions: string | null;
  decided_at: string | null;
}

function toRecord(row: RoleApprovalRow): RoleApprovalRecord {
  return {
    role: row.role,
    status: row.status,
    approverUserId: row.approver_user_id,
    approverName: row.approver_name,
    outstandingConditions: row.outstanding_conditions,
    decidedAt: row.decided_at,
  };
}

/**
 * Read the current per-role approval status for a deliverable. Required
 * roles with no recorded decision yet are synthesized as `pending` (no row in
 * the table) rather than omitted, so a caller always sees the full required
 * set, not just what happens to have a row.
 */
export async function getRoleApprovalSummary(
  ctx: TenancyCtx,
  programId: string,
  deliverableId: string,
  deliverableTypeKey: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<RoleApprovalSummary> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });

  const requiredRoles = requiredApprovalRolesFor(deliverableTypeKey);

  const { data, error } = await sb
    .from("deliverable_role_approvals")
    .select(
      "role, status, approver_user_id, approver_name, outstanding_conditions, decided_at",
    )
    .eq("deliverable_id", deliverableId);
  if (error) throw error;

  const existing = new Map(
    ((data ?? []) as RoleApprovalRow[]).map((row) => [row.role, toRecord(row)]),
  );

  const records: RoleApprovalRecord[] = requiredRoles.map(
    (role) =>
      existing.get(role) ?? {
        role,
        status: "pending",
        approverUserId: null,
        approverName: null,
        outstandingConditions: null,
        decidedAt: null,
      },
  );
  // include any recorded roles beyond the currently-required set too (e.g. a
  // role recorded before a requirement change), so nothing silently vanishes.
  for (const [role, record] of existing) {
    if (!requiredRoles.includes(role)) records.push(record);
  }

  return {
    deliverableId,
    requiredRoles,
    records,
    allRequiredApproved:
      requiredRoles.length > 0 &&
      requiredRoles.every(
        (role) => existing.get(role)?.status === "approved",
      ),
    anyRejected: requiredRoles.some((role) => existing.get(role)?.status === "rejected"),
  };
}

/** Record (upsert) one role's decision on a deliverable. */
export async function recordRoleApprovalDecision(
  ctx: TenancyCtx,
  programId: string,
  deliverableId: string,
  decision: {
    role: ApprovalRole;
    status: RoleApprovalStatus;
    approverName?: string;
    outstandingConditions?: string;
  },
  opts: { supabase?: SupabaseClient } = {},
): Promise<RoleApprovalRecord> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });

  const { data: deliverable, error: readError } = await sb
    .from("deliverables_v2")
    .select("id")
    .eq("id", deliverableId)
    .eq("engagement_id", programId)
    .maybeSingle();
  if (readError) throw readError;
  if (!deliverable) throw new Error("deliverable not found in this program");

  const decidedAt =
    decision.status === "approved" || decision.status === "rejected"
      ? new Date().toISOString()
      : null;

  const { data, error } = await sb
    .from("deliverable_role_approvals")
    .upsert(
      {
        deliverable_id: deliverableId,
        role: decision.role,
        status: decision.status,
        approver_user_id: ctx.userId,
        approver_name: decision.approverName ?? null,
        outstanding_conditions: decision.outstandingConditions ?? null,
        decided_at: decidedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "deliverable_id,role" },
    )
    .select(
      "role, status, approver_user_id, approver_name, outstanding_conditions, decided_at",
    )
    .single();
  if (error) throw error;

  return toRecord(data as RoleApprovalRow);
}
