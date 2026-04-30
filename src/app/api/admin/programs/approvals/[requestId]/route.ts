// OV2-2c · Tenant-admin approval queue · single-request endpoints
//
//   GET  /api/admin/programs/approvals/[requestId]
//     → { ok: true, request: ApprovalRequest }
//
//   POST /api/admin/programs/approvals/[requestId]
//     body: { decision: 'approved' | 'rejected', rationale?: string }
//     → { ok: true, request: ApprovalRequest }
//
// Auth posture:
//   • GET — requireAdminAuth (authenticated + active tenant; tenant-scoped read).
//   • POST — requireAdminDecide (also requires admin role). The
//     POST body is validated; the rationale-required-on-rejection rule is
//     enforced both client-side and server-side (decideApprovalRequest
//     will throw on empty rationale).
//
// Audit: decideApprovalRequest writes to program_approval_requests
// with decided_by_user_id + decided_at + decision_rationale. The DB
// trigger sync_engagement_lifecycle_on_decision flips
// engagements.lifecycle_state. There is no separate program_audit_log
// table in this codebase yet (verified 2026-04-29) — the approval row
// itself is the audit record.

import { NextRequest, NextResponse } from 'next/server';
import {
  decideApprovalRequest,
  getApprovalRequestById,
} from '@/lib/programs/approval';
import {
  adminAuthErrorResponse,
  requireAdminAuth,
  requireAdminDecide,
} from '../_auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteCtx {
  params: Promise<{ requestId: string }>;
}

interface DecideBody {
  decision?: unknown;
  rationale?: unknown;
}

export async function GET(_request: NextRequest, ctx: RouteCtx) {
  let auth;
  try {
    auth = await requireAdminAuth();
  } catch (err) {
    return adminAuthErrorResponse(err);
  }

  const { requestId } = await ctx.params;
  if (!requestId) {
    return NextResponse.json(
      { error: 'requestId required' },
      { status: 400 },
    );
  }

  try {
    const request = await getApprovalRequestById(requestId);
    if (!request) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 },
      );
    }
    // Tenant-scope guard: never leak across tenants even if a user
    // somehow knows another tenant's request id.
    if (request.tenantKey !== auth.tenantKey) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, request });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'request_query_failed';
    return NextResponse.json(
      { error: 'request_query_failed', detail: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  let auth;
  try {
    auth = await requireAdminDecide();
  } catch (err) {
    return adminAuthErrorResponse(err);
  }

  const { requestId } = await ctx.params;
  if (!requestId) {
    return NextResponse.json(
      { error: 'requestId required' },
      { status: 400 },
    );
  }

  let body: DecideBody;
  try {
    body = (await request.json()) as DecideBody;
  } catch {
    return NextResponse.json(
      { error: 'invalid JSON body' },
      { status: 400 },
    );
  }

  const decision = body.decision;
  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json(
      {
        error:
          "decision must be 'approved' or 'rejected'",
      },
      { status: 400 },
    );
  }

  const rationaleRaw =
    typeof body.rationale === 'string' ? body.rationale : '';
  const rationale = rationaleRaw.trim();

  if (decision === 'rejected' && rationale.length === 0) {
    return NextResponse.json(
      { error: 'rationale required when decision is rejected' },
      { status: 400 },
    );
  }

  // Tenant-scope guard before mutating: confirm the target row belongs
  // to the caller's tenant.
  let existing;
  try {
    existing = await getApprovalRequestById(requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'request_query_failed';
    return NextResponse.json(
      { error: 'request_query_failed', detail: message },
      { status: 500 },
    );
  }
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (existing.tenantKey !== auth.tenantKey) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  try {
    const updated = await decideApprovalRequest({
      requestId,
      decidedByUserId: auth.userId,
      decision,
      rationale: rationale.length > 0 ? rationale : undefined,
    });
    return NextResponse.json({ ok: true, request: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'decide_failed';
    return NextResponse.json(
      { error: 'decide_failed', detail: message },
      { status: 400 },
    );
  }
}
