// POST /api/reasoning/demo-reset
// Clears all in-memory reasoning state so demos start from a clean slate.
// No body required. Returns the list of cleared stores.

import { clearWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { clearApprovals } from '@/app/api/reasoning/gate-approval/route';
import { clearWaiverAuditBuffer, clearApprovalAuditBuffer } from '@/app/api/reasoning/audit/route';
import { clearResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { clearSynthesisTelemetry } from '@/lib/reasoning/synthesis-telemetry';

export async function POST(): Promise<Response> {
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
