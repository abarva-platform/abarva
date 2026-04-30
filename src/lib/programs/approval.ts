import 'server-only';

// OV2-2a · Tenant-admin approval workflow · server lib
//
// Backs the `program_approval_requests` table introduced in migration
// 20260430120000_program_approval_workflow.sql. See the design doc
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

import { getServerSupabase } from '@/lib/supabase-server';

// ── Types ──────────────────────────────────────────────────────────────

export type LifecycleState =
  | 'draft'
  | 'submitted_for_approval'
  | 'approved'
  | 'rejected'
  | 'paused'
  | 'canceled'
  | 'completed';

export type ApprovalRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

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
  decision: 'approved' | 'rejected';
  /** Required (and non-empty) when decision === 'rejected'. */
  rationale?: string;
}

// ── Internal helpers ───────────────────────────────────────────────────

interface ApprovalRequestRow {
  id: string;
  tenant_key: string;
  program_id: string;
  requested_by_user_id: string;
  requested_at: string;
  request_status: ApprovalRequestStatus;
  decided_by_user_id: string | null;
  decided_at: string | null;
  decision_rationale: string | null;
  brief_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

const APPROVAL_COLUMNS =
  'id, tenant_key, program_id, requested_by_user_id, requested_at, ' +
  'request_status, decided_by_user_id, decided_at, decision_rationale, ' +
  'brief_snapshot, created_at, updated_at';

function rowToApprovalRequest(row: ApprovalRequestRow): ApprovalRequest {
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    programId: row.program_id,
    requestedByUserId: row.requested_by_user_id,
    requestedAt: row.requested_at,
    requestStatus: row.request_status,
    decidedByUserId: row.decided_by_user_id,
    decidedAt: row.decided_at,
    decisionRationale: row.decision_rationale,
    briefSnapshot: (row.brief_snapshot ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class ApprovalError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApprovalError';
  }
}

function wrapDbError(
  message: string,
  cause: unknown,
  context: Record<string, unknown>,
): ApprovalError {
  const detail =
    cause && typeof cause === 'object' && 'message' in cause
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
    throw new ApprovalError('submitForApproval: tenantKey is required', {
      input,
    });
  }
  if (!input.programId) {
    throw new ApprovalError('submitForApproval: programId is required', {
      input,
    });
  }
  if (!input.requestedByUserId) {
    throw new ApprovalError(
      'submitForApproval: requestedByUserId is required',
      { input },
    );
  }

  const sb = getServerSupabase();

  const { data, error } = await sb
    .from('program_approval_requests')
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
      'submitForApproval: insert into program_approval_requests failed',
      error,
      { input },
    );
  }

  // Flip the engagement's lifecycle_state. The decision-trigger only
  // covers approve/reject transitions; the submission flip is plain SQL.
  const { error: engError } = await sb
    .from('engagements')
    .update({ lifecycle_state: 'submitted_for_approval' })
    .eq('id', input.programId);

  if (engError) {
    throw wrapDbError(
      'submitForApproval: failed to update engagements.lifecycle_state to submitted_for_approval',
      engError,
      { input },
    );
  }

  return rowToApprovalRequest(data as unknown as ApprovalRequestRow);
}

/**
 * Tenant-admin approves or rejects a pending request. Throws if the
 * request is not pending, or if a rejection is missing rationale.
 *
 * The DB trigger sync_engagement_lifecycle_on_decision flips the
 * engagement's lifecycle_state automatically when this completes.
 */
export async function decideApprovalRequest(
  input: DecideApprovalInput,
): Promise<ApprovalRequest> {
  if (!input.requestId) {
    throw new ApprovalError('decideApprovalRequest: requestId is required', {
      input,
    });
  }
  if (!input.decidedByUserId) {
    throw new ApprovalError(
      'decideApprovalRequest: decidedByUserId is required',
      { input },
    );
  }
  if (input.decision !== 'approved' && input.decision !== 'rejected') {
    throw new ApprovalError(
      `decideApprovalRequest: decision must be 'approved' or 'rejected', got '${input.decision}'`,
      { input },
    );
  }
  if (input.decision === 'rejected') {
    const r = (input.rationale ?? '').trim();
    if (r.length === 0) {
      throw new ApprovalError(
        'decideApprovalRequest: rationale is required when decision is rejected',
        { input },
      );
    }
  }

  const sb = getServerSupabase();

  // Conditional update — only succeeds if the row is still 'pending'.
  // This protects against double-decision races.
  const { data, error } = await sb
    .from('program_approval_requests')
    .update({
      request_status: input.decision,
      decided_by_user_id: input.decidedByUserId,
      decided_at: new Date().toISOString(),
      decision_rationale: input.rationale?.trim() || null,
    })
    .eq('id', input.requestId)
    .eq('request_status', 'pending')
    .select(APPROVAL_COLUMNS)
    .single();

  if (error || !data) {
    throw wrapDbError(
      'decideApprovalRequest: failed to update request (already decided?)',
      error,
      { input },
    );
  }

  return rowToApprovalRequest(data as unknown as ApprovalRequestRow);
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
    throw new ApprovalError(
      'withdrawApprovalRequest: requestId is required',
      { requestId, requestedByUserId },
    );
  }
  if (!requestedByUserId) {
    throw new ApprovalError(
      'withdrawApprovalRequest: requestedByUserId is required',
      { requestId, requestedByUserId },
    );
  }

  const sb = getServerSupabase();

  const { data, error } = await sb
    .from('program_approval_requests')
    .update({
      request_status: 'withdrawn',
      decided_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('requested_by_user_id', requestedByUserId)
    .eq('request_status', 'pending')
    .select(APPROVAL_COLUMNS)
    .single();

  if (error || !data) {
    throw wrapDbError(
      'withdrawApprovalRequest: failed to withdraw (not the requester, or not pending?)',
      error,
      { requestId, requestedByUserId },
    );
  }

  return rowToApprovalRequest(data as unknown as ApprovalRequestRow);
}

/**
 * Tenant admin queue. Returns pending requests for a tenant, ordered
 * by requested_at descending. Caller must enforce admin role at the
 * API/UI layer; RLS is the second line of defense.
 */
export async function getApprovalQueueForTenant(
  tenantKey: string,
): Promise<ApprovalRequest[]> {
  if (!tenantKey) {
    throw new ApprovalError(
      'getApprovalQueueForTenant: tenantKey is required',
      { tenantKey },
    );
  }

  const sb = getServerSupabase();

  const { data, error } = await sb
    .from('program_approval_requests')
    .select(APPROVAL_COLUMNS)
    .eq('tenant_key', tenantKey)
    .eq('request_status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) {
    throw wrapDbError(
      'getApprovalQueueForTenant: query failed',
      error,
      { tenantKey },
    );
  }

  const rows = (data ?? []) as unknown as ApprovalRequestRow[];
  return rows.map(rowToApprovalRequest);
}

export async function getApprovalRequestById(
  requestId: string,
): Promise<ApprovalRequest | null> {
  if (!requestId) {
    throw new ApprovalError(
      'getApprovalRequestById: requestId is required',
      { requestId },
    );
  }

  const sb = getServerSupabase();

  const { data, error } = await sb
    .from('program_approval_requests')
    .select(APPROVAL_COLUMNS)
    .eq('id', requestId)
    .maybeSingle();

  if (error) {
    throw wrapDbError(
      'getApprovalRequestById: query failed',
      error,
      { requestId },
    );
  }

  if (!data) return null;
  return rowToApprovalRequest(data as unknown as ApprovalRequestRow);
}
