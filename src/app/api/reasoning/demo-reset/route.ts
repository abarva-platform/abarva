// POST /api/reasoning/demo-reset
// Clears all in-memory reasoning state so demos start from a clean slate.
// No body required. Returns the list of cleared stores.
//
// SECURITY (audit 2026-05-22, P0-1): this wipes process-wide reasoning
// state across every tenant — require an authenticated session and a
// gate-approval role before allowing it.

import { clearWaivers } from '@/lib/reasoning/gate-waiver-state';
import { clearApprovals } from '@/lib/reasoning/gate-approval-state';
import {
  clearApprovalAuditBuffer,
  clearWaiverAuditBuffer,
} from '@/lib/reasoning/gate-audit-state';
import { clearResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { clearSynthesisTelemetry } from '@/lib/reasoning/synthesis-telemetry';
import {
  requireReasoningTenancy,
  tenancyErrorResponse,
  requireGateApprovalRole,
} from '@/app/api/reasoning/_auth';

export async function POST(): Promise<Response> {
  let ctx;
  try {
    ctx = await requireReasoningTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const roleDenied = requireGateApprovalRole(ctx);
  if (roleDenied) return roleDenied;

  clearWaivers();
  clearApprovals();
  clearWaiverAuditBuffer();
  clearApprovalAuditBuffer();
  clearResolved();
  clearSynthesisTelemetry();

  return new Response(
    JSON.stringify({
      cleared: ['gate-waivers', 'gate-approvals', 'contradiction-resolutions', 'feedback', 'audit'],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
