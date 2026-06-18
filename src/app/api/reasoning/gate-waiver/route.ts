// POST /api/reasoning/gate-waiver
// Body: { type: 'gate_waiver'; criterionId: string; instanceId: string; reason: string }
// Records a gate-criterion waiver in an in-memory store.
// No persistence: resets on server restart (matches missions/state and
// contradiction-resolution patterns).
//
// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session +
// active client, enforces a gate-approval role (waiving a hard gate is a
// privileged write), and scopes the instanceId to the session tenant.
// The store key is namespaced by tenant so the process-level Map can
// never be read cross-tenant by instanceId.

import {
  requireReasoningTenancy,
  tenancyErrorResponse,
  assertInstanceInTenant,
  requireGateApprovalRole,
  reasoningTenantId,
} from '@/app/api/reasoning/_auth';
import { recordWaiverInternal } from '@/lib/reasoning/gate-waiver-state';

interface GateWaiverBody {
  type: 'gate_waiver';
  criterionId: string;
  instanceId: string;
  reason: string;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  let ctx;
  try {
    ctx = await requireReasoningTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    return jsonResponse({ error: 'internal_error' }, 500);
  }

  // Waiving a gate criterion is a privileged write — enforce role first.
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

  const { type, criterionId, instanceId, reason } = body as Partial<GateWaiverBody>;

  if (type !== 'gate_waiver') {
    return jsonResponse({ error: "type must be 'gate_waiver'" }, 400);
  }

  if (typeof criterionId !== 'string' || criterionId.length === 0) {
    return jsonResponse({ error: 'criterionId is required' }, 400);
  }

  if (typeof instanceId !== 'string' || instanceId.length === 0) {
    return jsonResponse({ error: 'instanceId is required' }, 400);
  }

  if (typeof reason !== 'string' || reason.length === 0) {
    return jsonResponse({ error: 'reason is required' }, 400);
  }

  // Cross-tenant scoping: only act on instances owned by the active client.
  const scopeDenied = assertInstanceInTenant(ctx, instanceId);
  if (scopeDenied) return scopeDenied;

  const tenantId = reasoningTenantId(ctx);
  recordWaiverInternal(tenantId, instanceId, criterionId, reason);

  return jsonResponse({ ok: true, key: `${tenantId}::${instanceId}::${criterionId}` }, 200);
}
