// POST /api/reasoning/gate-approval
// Body: { instanceId: string; criterionId: string; justification: string; action: 'approve' | 'reject' }
// Records a gate-criterion approval or rejection in an in-memory store.
// No persistence: resets on server restart (matches gate-waiver and missions/state patterns).
//
// SECURITY (audit 2026-05-22, P0-1 / P2-8): requires an authenticated
// session + active client, scopes the instanceId to the session tenant,
// and enforces a gate-approval role before recording the decision. The
// in-memory store key is namespaced by tenant so a process-level Map
// can never be read cross-tenant by instanceId.

import {
  requireReasoningTenancy,
  tenancyErrorResponse,
  assertInstanceInTenant,
  requireGateApprovalRole,
  reasoningTenantId,
} from '@/app/api/reasoning/_auth';
import {
  recordGateApproval,
  type ApprovalRecord,
} from '@/lib/reasoning/gate-approval-state';

interface GateApprovalBody {
  instanceId: string;
  criterionId: string;
  justification: string;
  action: 'approve' | 'reject';
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  let ctx;
  try {
    ctx = await requireReasoningTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    return jsonResponse({ error: 'internal_error' }, 500);
  }

  // Approve / reject is a privileged write — enforce role before anything else.
  const roleDenied = requireGateApprovalRole(ctx);
  if (roleDenied) return roleDenied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON body' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'body must be an object' }, 400);
  }

  const { instanceId, criterionId, justification, action } = body as Partial<GateApprovalBody>;

  if (typeof instanceId !== 'string' || instanceId.length === 0) {
    return jsonResponse({ error: 'instanceId is required' }, 400);
  }

  if (typeof criterionId !== 'string' || criterionId.length === 0) {
    return jsonResponse({ error: 'criterionId is required' }, 400);
  }

  if (typeof justification !== 'string' || justification.length === 0) {
    return jsonResponse({ error: 'justification is required' }, 400);
  }

  if (justification.length > 200) {
    return jsonResponse({ error: 'justification must be 200 characters or fewer' }, 400);
  }

  if (action !== 'approve' && action !== 'reject') {
    return jsonResponse({ error: "action must be 'approve' or 'reject'" }, 400);
  }

  // Cross-tenant scoping: a caller may only act on instances owned by
  // their active client.
  const scopeDenied = assertInstanceInTenant(ctx, instanceId);
  if (scopeDenied) return scopeDenied;

  const tenantId = reasoningTenantId(ctx);
  const record: ApprovalRecord = recordGateApproval({
    tenantId,
    instanceId,
    criterionId,
    action,
    justification,
    actorId: ctx.userId,
  });

  return jsonResponse({ ok: true, action, timestamp: record.timestamp }, 200);
}
