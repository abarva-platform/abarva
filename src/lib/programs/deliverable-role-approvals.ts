// Read-only view of historical role-specific approval rows. Moves now records
// deliverable approval through the single authorized workspace-user sign-off.

import {
  getAzureReadFluentClient,
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
  current_version: number | null;
  signed_off_version: number | null;
}

function resolveApprovalVersion(row: DeliverableApprovalPointer): number {
  return row.signed_off_version ?? row.current_version ?? 1;
}

async function readDeliverableApprovalPointer(
  sb: SupabaseClient,
  programId: string,
  deliverableId: string,
): Promise<DeliverableApprovalPointer> {
  const { data: deliverable, error } = await sb
    .from("deliverables_v2")
    .select(
      "id, deliverable_type_key, current_version, signed_off_version",
    )
    .eq("id", deliverableId)
    .eq("engagement_id", programId)
    .maybeSingle();
  if (error) throw error;
  if (!deliverable) throw new Error("deliverable not found in this program");
  return deliverable as DeliverableApprovalPointer;
}

/**
 * Read historical per-role rows for audit context. No pending role rows are
 * synthesized and these records never gate the authoritative sign-off.
 */
export async function getRoleApprovalSummary(
  ctx: TenancyCtx,
  programId: string,
  deliverableId: string,
  deliverableTypeKey: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<RoleApprovalSummary> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureReadFluentClient();
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
