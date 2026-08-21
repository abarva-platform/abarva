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
import {
  APPROVAL_ROLE_LABELS,
  requiredApprovalRolesFor,
  REQUIRED_APPROVAL_ROLES,
  type ApprovalRole,
} from "@/lib/programs/deliverable-role-approval-policy";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { getProgramById } from "@/lib/programs/queries";
import { isGateApprovalStrictMode } from "@/lib/auth/gate-approval-strict-mode";

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

export {
  APPROVAL_ROLE_LABELS,
  requiredApprovalRolesFor,
  REQUIRED_APPROVAL_ROLES,
  type ApprovalRole,
};

export type RoleApprovalStatus =
  | "pending"
  | "reviewed"
  | "approved"
  | "rejected";

export interface RoleApprovalRecord {
  role: ApprovalRole;
  status: RoleApprovalStatus;
  version: number;
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
  version: number;
  approver_user_id: string | null;
  approver_name: string | null;
  outstanding_conditions: string | null;
  decided_at: string | null;
}

function toRecord(row: RoleApprovalRow): RoleApprovalRecord {
  return {
    role: row.role,
    status: row.status,
    version: row.version,
    approverUserId: row.approver_user_id,
    approverName: row.approver_name,
    outstandingConditions: row.outstanding_conditions,
    decidedAt: row.decided_at,
  };
}

interface DeliverableApprovalPointer {
  id: string;
  deliverable_type_key: string;
  created_by: string | null;
  current_version: number | null;
  signed_off_version: number | null;
}

function resolveApprovalVersion(row: DeliverableApprovalPointer): number {
  return row.signed_off_version ?? row.current_version ?? 1;
}

function appendApprovalAuditNote(
  existing: string | undefined,
  note: string,
): string {
  const trimmed = existing?.trim();
  return trimmed ? `${trimmed}\n${note}` : note;
}

async function readDeliverableApprovalPointer(
  sb: SupabaseClient,
  programId: string,
  deliverableId: string,
): Promise<DeliverableApprovalPointer> {
  const { data: deliverable, error } = await sb
    .from("deliverables_v2")
    .select(
      "id, deliverable_type_key, created_by, current_version, signed_off_version",
    )
    .eq("id", deliverableId)
    .eq("engagement_id", programId)
    .maybeSingle();
  if (error) throw error;
  if (!deliverable) throw new Error("deliverable not found in this program");
  return deliverable as DeliverableApprovalPointer;
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
  const deliverable = await readDeliverableApprovalPointer(
    sb,
    programId,
    deliverableId,
  );
  const version = resolveApprovalVersion(deliverable);

  const { data, error } = await sb
    .from("deliverable_role_approvals")
    .select(
      "role, status, version, approver_user_id, approver_name, outstanding_conditions, decided_at",
    )
    .eq("deliverable_id", deliverableId)
    .eq("version", version);
  if (error) throw error;

  const existing = new Map(
    ((data ?? []) as RoleApprovalRow[]).map((row) => [row.role, toRecord(row)]),
  );

  const records: RoleApprovalRecord[] = requiredRoles.map(
    (role) =>
      existing.get(role) ?? {
        role,
        status: "pending",
        version,
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
      requiredRoles.every((role) => existing.get(role)?.status === "approved"),
    anyRejected: requiredRoles.some(
      (role) => existing.get(role)?.status === "rejected",
    ),
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
  opts: { supabase?: SupabaseClient; sandboxProxyApproval?: boolean } = {},
): Promise<RoleApprovalRecord> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  await assertProgramTenancy(ctx, programId, { supabase: sb });

  const deliverable = await readDeliverableApprovalPointer(
    sb,
    programId,
    deliverableId,
  );
  const version = resolveApprovalVersion(deliverable);
  const strictMode = isGateApprovalStrictMode();

  if (
    decision.status === "approved" &&
    deliverable.created_by === ctx.userId &&
    !opts.sandboxProxyApproval &&
    strictMode
  ) {
    throw new Error("self_approval_violation");
  }

  const requiredRoles = requiredApprovalRolesFor(
    deliverable.deliverable_type_key,
  );
  let pilotAuditNote: string | null = null;
  if (
    decision.status === "approved" &&
    deliverable.created_by === ctx.userId &&
    !opts.sandboxProxyApproval &&
    !strictMode
  ) {
    pilotAuditNote =
      "Pilot approval note: the approver is also the deliverable creator; permitted because GATE_APPROVAL_STRICT_MODE is off.";
  }
  if (decision.status === "approved" && requiredRoles.length >= 2) {
    const { data: existingApprovals, error: existingApprovalsError } = await sb
      .from("deliverable_role_approvals")
      .select("role, approver_user_id, approver_name, status")
      .eq("deliverable_id", deliverableId)
      .eq("version", version);
    if (existingApprovalsError) throw existingApprovalsError;
    const sameReviewerOtherRole = (
      (existingApprovals ?? []) as Array<{
        role: ApprovalRole;
        approver_user_id: string | null;
        approver_name: string | null;
        status: RoleApprovalStatus;
      }>
    ).filter(
      (row) =>
        row.status === "approved" &&
        row.role !== decision.role &&
        ((!opts.sandboxProxyApproval && row.approver_user_id === ctx.userId) ||
          (decision.approverName &&
            row.approver_name === decision.approverName)),
    );
    if (sameReviewerOtherRole.length > 0 && strictMode) {
      throw new Error("separation_of_duties_violation");
    }
    if (
      sameReviewerOtherRole.length > 0 &&
      !strictMode &&
      !opts.sandboxProxyApproval
    ) {
      const roles = sameReviewerOtherRole
        .map((row) => APPROVAL_ROLE_LABELS[row.role] ?? row.role)
        .join(", ");
      pilotAuditNote = appendApprovalAuditNote(
        pilotAuditNote ?? undefined,
        `Pilot approval note: the same reviewer already approved ${roles} on this deliverable version; permitted because GATE_APPROVAL_STRICT_MODE is off.`,
      );
    }
  }

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
        version,
        approver_user_id: opts.sandboxProxyApproval
          ? `sandbox-proxy:${decision.role}:${ctx.userId}`
          : ctx.userId,
        approver_name: decision.approverName ?? null,
        outstanding_conditions: pilotAuditNote
          ? appendApprovalAuditNote(
              decision.outstandingConditions,
              pilotAuditNote,
            )
          : (decision.outstandingConditions ?? null),
        decided_at: decidedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "deliverable_id,role,version" },
    )
    .select(
      "role, status, version, approver_user_id, approver_name, outstanding_conditions, decided_at",
    )
    .single();
  if (error) throw error;

  return toRecord(data as RoleApprovalRow);
}
