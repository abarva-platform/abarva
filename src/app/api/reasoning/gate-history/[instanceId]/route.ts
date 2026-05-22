// GET /api/reasoning/gate-history/:instanceId
// Aggregates all gate waivers, approvals, and rejections for a given instanceId.
// Returns entries sorted by timestamp descending.
// In-memory only — resets on server restart (matches gate-waiver / gate-approval patterns).
//
// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session +
// active client and scopes the instanceId to the session tenant so a
// caller cannot read another tenant's gate history by guessing ids.

import { getWaiversForInstance } from '@/app/api/reasoning/gate-waiver/route';
import { getApprovalsForInstance } from '@/app/api/reasoning/gate-approval/route';
import {
  requireReasoningTenancy,
  tenancyErrorResponse,
  assertInstanceInTenant,
  reasoningTenantId,
} from '@/app/api/reasoning/_auth';

export interface GateHistoryEntry {
  criterionId: string;
  action: 'waived' | 'approved' | 'rejected';
  justification?: string;
  timestamp: string;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ instanceId: string }> },
): Promise<Response> {
  let ctx;
  try {
    ctx = await requireReasoningTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    return jsonResponse({ error: 'internal_error' }, 500);
  }

  const { instanceId } = await params;

  if (typeof instanceId !== 'string' || instanceId.length === 0) {
    return jsonResponse({ error: 'instanceId is required' }, 400);
  }

  const scopeDenied = assertInstanceInTenant(ctx, instanceId);
  if (scopeDenied) return scopeDenied;

  const tenantId = reasoningTenantId(ctx);
  const entries: GateHistoryEntry[] = [];

  // Collect waivers.
  for (const { criterionId, reason, waivedAt } of getWaiversForInstance(tenantId, instanceId)) {
    entries.push({
      criterionId,
      action: 'waived',
      justification: reason,
      timestamp: waivedAt,
    });
  }

  // Collect approvals and rejections.
  for (const { criterionId, record } of getApprovalsForInstance(tenantId, instanceId)) {
    entries.push({
      criterionId,
      action: record.action === 'approve' ? 'approved' : 'rejected',
      justification: record.justification,
      timestamp: record.timestamp,
    });
  }

  // Sort by timestamp descending (most recent first).
  entries.sort((a, b) => {
    const tA = Date.parse(a.timestamp);
    const tB = Date.parse(b.timestamp);
    return tB - tA;
  });

  return jsonResponse({ instanceId, entries }, 200);
}
