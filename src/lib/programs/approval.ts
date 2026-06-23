import "server-only";

// OV2-2a · Tenant-admin approval workflow · server lib
//
// Backs the `program_approval_requests` table introduced in migration
// 20260430120100_program_approval_workflow.sql. See the design doc
// (docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md §B.2,
// §D.0.5, Part G) for the state-machine context.
//
// This slice is data-layer only — no UI, no agent wiring. Future slices:
//   • OV2-2b · `commit_program` agent tool intercepts and inserts here
//     instead of flipping straight to active.
//   • OV2-2c · tenant admin queue UI reads `getApprovalQueueForTenant`.
//
// The helpers here use the server-side Supabase client (service role),
// which bypasses RLS. Callers MUST enforce admin role at the API/UI
// layer for the decide path; the migration's RLS is the second line of
// defense for any direct authenticated client.

import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
import { emitNotification } from "@/lib/admin/broker/notification-broker";
import {
  notifyApprovalApproved,
  notifyApprovalRejected,
  notifyApprovalSubmitted,
} from "@/lib/programs/approval-notifications";
import { writeProgramAuditLogBestEffort } from "./audit-log";

// ── Types ──────────────────────────────────────────────────────────────

export type LifecycleState =
  | "draft"
  | "submitted_for_approval"
  | "approved"
  | "rejected"
  | "paused"
  | "canceled"
  | "completed";

export type ApprovalRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn";

export interface ApprovalRequest {
  id: string;
  tenantKey: string;
  programId: string;
  requestedByUserId: string;
  requestedAt: string; // ISO
  requestStatus: ApprovalRequestStatus;
  decidedByUserId: string | null;
  decidedAt: string | null;
  decisionRationale: string | null;
  briefSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // PRE-W4-PR-4 · escalation bookkeeping (admin-initiated only).
  // See supabase/migrations/20260530210000_approval_escalation.sql.
  escalationLevel: 0 | 1 | 2;
  lastNotifiedAt: string | null;
  notifyCount: number;
  escalatedToUserId: string | null;
}

export interface SubmitForApprovalInput {
  tenantKey: string;
  programId: string;
  requestedByUserId: string;
  briefSnapshot: Record<string, unknown>;
}

export interface DecideApprovalInput {
  requestId: string;
  decidedByUserId: string;
  decision: "approved" | "rejected";
  /** Required (and non-empty) when decision === 'rejected'. */
  rationale?: string;
}

export interface ListApprovalAuditForTenantInput {
  tenantKey: string;
  fromIso?: string | null;
  toIso?: string | null;
  status?: ApprovalRequestStatus | "all" | null;
  limit?: number | null;
}

// ── Internal helpers ───────────────────────────────────────────────────

interface ApprovalRequestRow {
  id: string;
  tenant_key: string;
  program_id: string;
  requested_by_user_id: string;
  requested_at: string | Date;
  request_status: ApprovalRequestStatus;
  decided_by_user_id: string | null;
  decided_at: string | Date | null;
  decision_rationale: string | null;
  brief_snapshot: Record<string, unknown> | null;
  created_at: string | Date;
  updated_at: string | Date;
  escalation_level?: number | null;
  last_notified_at?: string | Date | null;
  notify_count?: number | null;
  escalated_to_user_id?: string | null;
}

const APPROVAL_COLUMNS =
  "id, tenant_key, program_id, requested_by_user_id, requested_at, " +
  "request_status, decided_by_user_id, decided_at, decision_rationale, " +
  "brief_snapshot, created_at, updated_at, " +
  "escalation_level, last_notified_at, notify_count, escalated_to_user_id";

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function rowToApprovalRequest(row: ApprovalRequestRow): ApprovalRequest {
  const rawLevel = row.escalation_level ?? 0;
  const normalizedLevel: 0 | 1 | 2 =
    rawLevel === 1 || rawLevel === 2 ? (rawLevel as 1 | 2) : 0;
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    programId: row.program_id,
    requestedByUserId: row.requested_by_user_id,
    requestedAt: toIsoString(row.requested_at) ?? new Date(0).toISOString(),
    requestStatus: row.request_status,
    decidedByUserId: row.decided_by_user_id,
    decidedAt: toIsoString(row.decided_at),
    decisionRationale: row.decision_rationale,
    briefSnapshot: (row.brief_snapshot ?? {}) as Record<string, unknown>,
    createdAt: toIsoString(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date(0).toISOString(),
    escalationLevel: normalizedLevel,
    lastNotifiedAt: toIsoString(row.last_notified_at ?? null),
    notifyCount:
      typeof row.notify_count === "number" && row.notify_count >= 0
        ? row.notify_count
        : 0,
    escalatedToUserId: row.escalated_to_user_id ?? null,
  };
}

function readBriefUuid(
  briefSnapshot: Record<string, unknown>,
  key: string,
): string | null {
  const value = briefSnapshot[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

/**
 * Read a free-form string from the brief snapshot (name, phase, etc).
 * Falls back to the supplied default when missing or blank. Used to
 * populate W4 notification payloads where the template needs a
 * display string the DB row does not directly expose.
 */
function readBriefString(
  briefSnapshot: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = briefSnapshot[key];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return fallback;
}

/**
 * W4-PR-3 · Fire-and-forget wrapper around `emitNotification`. The
 * notification broker must NEVER block or surface errors into the
 * approval workflow — failures (broker outage, registry mismatch,
 * subscriber-resolver error) are logged and swallowed so the primary
 * action's HTTP response remains the source of truth.
 */
function emitNotificationBestEffort(
  eventType: string,
  tenantKey: string,
  payload: Record<string, unknown>,
  options: { actorUserId?: string; targetResourceId?: string } = {},
): void {
  void emitNotification({
    tenantKey,
    eventType,
    payload,
    actorUserId: options.actorUserId,
    targetResourceId: options.targetResourceId,
  }).catch((err: unknown) => {
    console.warn(
      JSON.stringify({
        event: "approval.notification_emit_failed",
        event_type: eventType,
        tenant_key: tenantKey,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  });
}

class ApprovalError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApprovalError";
  }
}

function wrapDbError(
  message: string,
  cause: unknown,
  context: Record<string, unknown>,
): ApprovalError {
  const detail =
    cause && typeof cause === "object" && "message" in cause
      ? String((cause as { message: unknown }).message)
      : String(cause);
  return new ApprovalError(`${message}: ${detail}`, { ...context, cause });
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Insert a new pending approval request and flip the engagement to
 * 'submitted_for_approval'. Returns the inserted row (camelCase).
 */
export async function submitForApproval(
  input: SubmitForApprovalInput,
): Promise<ApprovalRequest> {
  if (!input.tenantKey) {
    throw new ApprovalError("submitForApproval: tenantKey is required", {
      input,
    });
  }
  if (!input.programId) {
    throw new ApprovalError("submitForApproval: programId is required", {
      input,
    });
  }
  if (!input.requestedByUserId) {
    throw new ApprovalError(
      "submitForApproval: requestedByUserId is required",
      { input },
    );
  }

  const sb = getAzureWriteFluentClient();

  const { data, error } = await sb
    .from("program_approval_requests")
    .insert({
      tenant_key: input.tenantKey,
      program_id: input.programId,
      requested_by_user_id: input.requestedByUserId,
      brief_snapshot: input.briefSnapshot ?? {},
    })
    .select(APPROVAL_COLUMNS)
    .single();

  if (error || !data) {
    throw wrapDbError(
      "submitForApproval: insert into program_approval_requests failed",
      error,
      { input },
    );
  }

  // Flip the engagement's lifecycle_state. The decision-trigger only
  // covers approve/reject transitions; the submission flip is plain SQL.
  const { error: engError } = await sb
    .from("engagements")
    .update({ lifecycle_state: "submitted_for_approval" })
    .eq("id", input.programId);

  if (engError) {
    throw wrapDbError(
      "submitForApproval: failed to update engagements.lifecycle_state to submitted_for_approval",
      engError,
      { input },
    );
  }

  const request = rowToApprovalRequest(data as unknown as ApprovalRequestRow);

  await writeProgramAuditLogBestEffort(
    {
      clientId: "",
      userId: input.requestedByUserId,
      role: "program_user",
    },
    {
      tenantKey: input.tenantKey,
      programId: input.programId,
      engagementId: input.programId,
      action: "program_approval_submitted",
      fromState: "draft",
      toState: "submitted_for_approval",
      rationale: "Program brief submitted for tenant-admin approval.",
      evidenceRefs: [],
    },
  );

  // OV2-2d-NOTIFY · fire-and-forget email to tenant admins. Email
  // failures must not block the approval workflow.
  void notifyApprovalSubmitted(request).catch((err: unknown) => {
    console.error("[approval] notifyApprovalSubmitted threw", {
      requestId: request.id,
      err: err instanceof Error ? err.message : String(err),
    });
  });

  // W4-PR-3 · Emit `approval.requested` through the broker. Payload
  // mirrors the W4-PR-6 ApprovalRequestedPayload contract so the email
  // template renders correctly.
  emitNotificationBestEffort(
    "approval.requested",
    request.tenantKey,
    {
      requestId: request.id,
      programId: request.programId,
      programName: readBriefString(
        request.briefSnapshot,
        "name",
        "Untitled program",
      ),
      phase: readBriefString(request.briefSnapshot, "phase", "1"),
      requestedBy: request.requestedByUserId,
      requesterName: readBriefString(
        request.briefSnapshot,
        "requester_name",
        request.requestedByUserId,
      ),
      producedAtIso: new Date().toISOString(),
    },
    {
      actorUserId: request.requestedByUserId,
      targetResourceId: request.id,
    },
  );

  return request;
}

/**
 * Tenant-admin approves or rejects a pending request. Throws if the
 * request is not pending, or if a rejection is missing rationale.
 *
 * The DB trigger sync_engagement_lifecycle_on_decision flips the
 * engagement's lifecycle_state automatically when this completes. We
 * also update engagements here so the runtime status used by legacy
 * portfolio surfaces stays in lockstep with the lifecycle state.
 */
export async function decideApprovalRequest(
  input: DecideApprovalInput,
): Promise<ApprovalRequest> {
  if (!input.requestId) {
    throw new ApprovalError("decideApprovalRequest: requestId is required", {
      input,
    });
  }
  if (!input.decidedByUserId) {
    throw new ApprovalError(
      "decideApprovalRequest: decidedByUserId is required",
      { input },
    );
  }
  if (input.decision !== "approved" && input.decision !== "rejected") {
    throw new ApprovalError(
      `decideApprovalRequest: decision must be 'approved' or 'rejected', got '${input.decision}'`,
      { input },
    );
  }
  if (input.decision === "rejected") {
    const r = (input.rationale ?? "").trim();
    if (r.length === 0) {
      throw new ApprovalError(
        "decideApprovalRequest: rationale is required when decision is rejected",
        { input },
      );
    }
  }

  const sb = getAzureWriteFluentClient();

  // Conditional update — only succeeds if the row is still 'pending'.
  // This protects against double-decision races.
  const { data, error } = await sb
    .from("program_approval_requests")
    .update({
      request_status: input.decision,
      decided_by_user_id: input.decidedByUserId,
      decided_at: new Date().toISOString(),
      decision_rationale: input.rationale?.trim() || null,
    })
    .eq("id", input.requestId)
    .eq("request_status", "pending")
    .select(APPROVAL_COLUMNS)
    .single();

  if (error || !data) {
    throw wrapDbError(
      "decideApprovalRequest: failed to update request (already decided?)",
      error,
      { input },
    );
  }

  const request = rowToApprovalRequest(data as unknown as ApprovalRequestRow);

  const sponsorPersonIdFromBrief = readBriefUuid(
    request.briefSnapshot,
    "sponsor_person_id",
  );
  const leadPersonIdFromBrief = readBriefUuid(
    request.briefSnapshot,
    "lead_person_id",
  );
  const engagementPatch =
    request.requestStatus === "approved"
      ? {
          lifecycle_state: "approved",
          status: "active",
          // Phase advancement is owned by closeP0OnApproval -> advancePhase.
          // That path signs the P0 brief, evaluates the governed gate, and
          // writes the phase_snapshots row the generation guard reads. Do not
          // set current_phase here, or the close helper will see the Move as
          // already past P0 and skip the canonical gate write.
          ...(sponsorPersonIdFromBrief
            ? { sponsor_person_id: sponsorPersonIdFromBrief }
            : {}),
          ...(leadPersonIdFromBrief
            ? { maestro_person_id: leadPersonIdFromBrief }
            : {}),
        }
      : { lifecycle_state: "rejected", status: "draft" };
  const { error: engagementError } = await sb
    .from("engagements")
    .update(engagementPatch)
    .eq("id", request.programId);

  if (engagementError) {
    throw wrapDbError(
      "decideApprovalRequest: failed to synchronize engagement lifecycle",
      engagementError,
      { input, programId: request.programId, engagementPatch },
    );
  }

  await writeProgramAuditLogBestEffort(
    {
      clientId: "",
      userId: input.decidedByUserId,
      role: "client_admin",
    },
    {
      tenantKey: request.tenantKey,
      programId: request.programId,
      engagementId: request.programId,
      action: `program_approval_${request.requestStatus}`,
      fromState: "submitted_for_approval",
      toState: request.requestStatus === "approved" ? "approved" : "rejected",
      rationale: input.rationale?.trim() || null,
      evidenceRefs: [request.id],
    },
  );

  // One approval closes P0 (founder spec 2026-06-11): the sponsor's approval
  // of the origination request IS the origination-brief sign-off, and the Move
  // advances P0→P1 through the governed gate in the same act. Best-effort —
  // a failure logs loudly and leaves the Move at P0 with the approval intact.
  if (request.requestStatus === "approved") {
    try {
      const { closeP0OnApproval } = await import("./origination-close");
      const closed = await closeP0OnApproval({
        programId: request.programId,
        tenantKey: request.tenantKey,
        deciderUserId: input.decidedByUserId,
        rationale: input.rationale ?? null,
      });
      if (!closed.advanced && closed.blockedBy.length > 0) {
        console.error("[approval] P0 close blocked after approval", {
          requestId: request.id,
          blockedBy: closed.blockedBy,
        });
      }
    } catch (err) {
      console.error("[approval] closeP0OnApproval threw", {
        requestId: request.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // OV2-2d-NOTIFY · fire-and-forget email to the requester. Email
  // failures must not block the approval workflow.
  const notify =
    request.requestStatus === "approved"
      ? notifyApprovalApproved
      : notifyApprovalRejected;
  void notify(request).catch((err: unknown) => {
    console.error("[approval] notify decision threw", {
      requestId: request.id,
      decision: request.requestStatus,
      err: err instanceof Error ? err.message : String(err),
    });
  });

  // W4-PR-3 · Emit `program.gate_decision` through the broker. The
  // template renders `decision: 'approved' | 'blocked'`; we map a
  // rejected request to 'blocked'. Payload matches the W4-PR-6
  // ProgramGateDecisionPayload contract.
  emitNotificationBestEffort(
    "program.gate_decision",
    request.tenantKey,
    {
      programId: request.programId,
      programName: readBriefString(
        request.briefSnapshot,
        "name",
        "Untitled program",
      ),
      decision: request.requestStatus === "approved" ? "approved" : "blocked",
      newPhase: readBriefString(request.briefSnapshot, "phase", "1"),
      decidedBy: input.decidedByUserId,
      deciderName: input.decidedByUserId,
      rationale: input.rationale?.trim() ?? "",
      producedAtIso: new Date().toISOString(),
    },
    {
      actorUserId: input.decidedByUserId,
      targetResourceId: request.programId,
    },
  );

  return request;
}

/**
 * The original requester withdraws their pending request. Throws if
 * the supplied user does not match the requester or if the request is
 * not pending.
 */
export async function withdrawApprovalRequest(
  requestId: string,
  requestedByUserId: string,
): Promise<ApprovalRequest> {
  if (!requestId) {
    throw new ApprovalError("withdrawApprovalRequest: requestId is required", {
      requestId,
      requestedByUserId,
    });
  }
  if (!requestedByUserId) {
    throw new ApprovalError(
      "withdrawApprovalRequest: requestedByUserId is required",
      { requestId, requestedByUserId },
    );
  }

  const sb = getAzureWriteFluentClient();

  const { data, error } = await sb
    .from("program_approval_requests")
    .update({
      request_status: "withdrawn",
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("requested_by_user_id", requestedByUserId)
    .eq("request_status", "pending")
    .select(APPROVAL_COLUMNS)
    .single();

  if (error || !data) {
    throw wrapDbError(
      "withdrawApprovalRequest: failed to withdraw (not the requester, or not pending?)",
      error,
      { requestId, requestedByUserId },
    );
  }

  const request = rowToApprovalRequest(data as unknown as ApprovalRequestRow);
  await writeProgramAuditLogBestEffort(
    {
      clientId: "",
      userId: requestedByUserId,
      role: "program_user",
    },
    {
      tenantKey: request.tenantKey,
      programId: request.programId,
      engagementId: request.programId,
      action: "program_approval_withdrawn",
      fromState: "submitted_for_approval",
      toState: "draft",
      rationale: "Requester withdrew the pending program approval request.",
      evidenceRefs: [request.id],
    },
  );
  return request;
}

/**
 * Tenant admin queue. Returns pending requests for a tenant, ordered
 * by requested_at ASCENDING (longest-pending first), so SLA-stuck
 * requests bubble to the top of the queue. Caller must enforce admin
 * role at the API/UI layer; RLS is the second line of defense.
 */
export async function getApprovalQueueForTenant(
  tenantKey: string,
): Promise<ApprovalRequest[]> {
  if (!tenantKey) {
    throw new ApprovalError(
      "getApprovalQueueForTenant: tenantKey is required",
      { tenantKey },
    );
  }

  const sb = getAzureWriteFluentClient();

  // PRE-W4-PR-4 · order longest-pending first so the SLA-stuck
  // requests bubble to the top of the queue. The detail page sort key
  // matches the SLA elapsed-time indicator the queue table renders.
  const { data, error } = await sb
    .from("program_approval_requests")
    .select(APPROVAL_COLUMNS)
    .eq("tenant_key", tenantKey)
    .eq("request_status", "pending")
    .order("requested_at", { ascending: true });

  if (error) {
    throw wrapDbError("getApprovalQueueForTenant: query failed", error, {
      tenantKey,
    });
  }

  const rows = (data ?? []) as unknown as ApprovalRequestRow[];
  return rows.map(rowToApprovalRequest);
}

export async function listApprovalAuditForTenant(
  input: ListApprovalAuditForTenantInput,
): Promise<ApprovalRequest[]> {
  if (!input.tenantKey) {
    throw new ApprovalError(
      "listApprovalAuditForTenant: tenantKey is required",
      {
        input,
      },
    );
  }

  const limit =
    typeof input.limit === "number" && Number.isFinite(input.limit)
      ? Math.min(Math.max(Math.trunc(input.limit), 1), 5000)
      : 1000;
  const sb = getAzureReadFluentClient();
  let query = sb
    .from("program_approval_requests")
    .select(APPROVAL_COLUMNS)
    .eq("tenant_key", input.tenantKey)
    .order("requested_at", { ascending: false })
    .limit(limit);

  if (input.status && input.status !== "all") {
    query = query.eq("request_status", input.status);
  }
  if (input.fromIso) {
    query = query.gte("requested_at", input.fromIso);
  }
  if (input.toIso) {
    query = query.lte("requested_at", input.toIso);
  }

  const { data, error } = await query;
  if (error) {
    throw wrapDbError("listApprovalAuditForTenant: query failed", error, {
      input,
    });
  }

  const rows = (data ?? []) as unknown as ApprovalRequestRow[];
  return rows.map(rowToApprovalRequest);
}

// ── PRE-W4-PR-4 · escalation primitives ───────────────────────────────
//
// Two admin-initiated transitions are exposed here. Both are append-only
// in spirit — the original `requested_at` and `request_status` stay
// untouched, only the escalation columns flip. The audit row (written
// by the server action) is the immutable record.
//
// These two helpers are the source of `approval.escalated` (Wave 4)
// notification events. The Wave 4 spec routes them at severity = critical.

export interface MarkSponsorNotifiedInput {
  requestId: string;
}

export interface EscalateToPlatformAdminInput {
  requestId: string;
  escalatedToUserId: string;
}

/**
 * Tier 1 escalation · "notify sponsor".
 *
 * Updates `last_notified_at = now()`, increments `notify_count`, and
 * bumps `escalation_level` to 1 IF it was previously 0. If the request
 * has already been escalated to platform-admin (level=2), the notify
 * call is still accepted (admin may want to ping the sponsor in
 * addition to the platform-admin) but escalation_level stays at 2.
 *
 * Throws if the request is not in `pending` status — once a decision
 * lands there's nothing to remind/escalate.
 */
export async function markSponsorNotified(
  input: MarkSponsorNotifiedInput,
): Promise<ApprovalRequest> {
  if (!input.requestId) {
    throw new ApprovalError("markSponsorNotified: requestId is required", {
      input,
    });
  }
  const sb = getAzureWriteFluentClient();

  // Read-then-write: we need the prior notify_count + escalation_level
  // to decide the new values without a race-prone increment.
  const { data: existing, error: readError } = await sb
    .from("program_approval_requests")
    .select(APPROVAL_COLUMNS)
    .eq("id", input.requestId)
    .eq("request_status", "pending")
    .maybeSingle();

  if (readError) {
    throw wrapDbError("markSponsorNotified: lookup failed", readError, {
      input,
    });
  }
  if (!existing) {
    throw new ApprovalError(
      "markSponsorNotified: request not found or already decided",
      { input },
    );
  }
  const current = rowToApprovalRequest(
    existing as unknown as ApprovalRequestRow,
  );

  const nextNotifyCount = (current.notifyCount ?? 0) + 1;
  const nextLevel: 0 | 1 | 2 =
    current.escalationLevel === 0 ? 1 : current.escalationLevel;

  const { data, error } = await sb
    .from("program_approval_requests")
    .update({
      last_notified_at: new Date().toISOString(),
      notify_count: nextNotifyCount,
      escalation_level: nextLevel,
    })
    .eq("id", input.requestId)
    .eq("request_status", "pending")
    .select(APPROVAL_COLUMNS)
    .single();

  if (error || !data) {
    throw wrapDbError("markSponsorNotified: update failed", error, { input });
  }
  return rowToApprovalRequest(data as unknown as ApprovalRequestRow);
}

/**
 * Tier 2 escalation · "escalate to platform admin".
 *
 * Sets `escalation_level = 2` and stores the platform-admin user id in
 * `escalated_to_user_id`. Idempotent re-routes (level was already 2)
 * are rejected so the audit trail stays clean — a re-escalation should
 * route to a *different* admin or re-trigger via a fresh request flow.
 */
export async function escalateToPlatformAdmin(
  input: EscalateToPlatformAdminInput,
): Promise<ApprovalRequest> {
  if (!input.requestId) {
    throw new ApprovalError("escalateToPlatformAdmin: requestId is required", {
      input,
    });
  }
  if (!input.escalatedToUserId) {
    throw new ApprovalError(
      "escalateToPlatformAdmin: escalatedToUserId is required",
      { input },
    );
  }
  const sb = getAzureWriteFluentClient();

  const { data, error } = await sb
    .from("program_approval_requests")
    .update({
      escalation_level: 2,
      escalated_to_user_id: input.escalatedToUserId,
    })
    .eq("id", input.requestId)
    .eq("request_status", "pending")
    .lt("escalation_level", 2)
    .select(APPROVAL_COLUMNS)
    .single();

  if (error || !data) {
    throw wrapDbError(
      "escalateToPlatformAdmin: update failed (already escalated or not pending?)",
      error,
      { input },
    );
  }
  return rowToApprovalRequest(data as unknown as ApprovalRequestRow);
}

export async function getApprovalRequestById(
  requestId: string,
): Promise<ApprovalRequest | null> {
  if (!requestId) {
    throw new ApprovalError("getApprovalRequestById: requestId is required", {
      requestId,
    });
  }

  const sb = getAzureWriteFluentClient();

  const { data, error } = await sb
    .from("program_approval_requests")
    .select(APPROVAL_COLUMNS)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw wrapDbError("getApprovalRequestById: query failed", error, {
      requestId,
    });
  }

  if (!data) return null;
  return rowToApprovalRequest(data as unknown as ApprovalRequestRow);
}
