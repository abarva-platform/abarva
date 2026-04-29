// POST /api/reasoning/demo-reset
// Clears all in-memory reasoning state so demos start from a clean slate.
// No body required. Returns the list of cleared stores.

import { clearWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { clearWaiverAuditBuffer } from '@/app/api/reasoning/audit/route';
import { clearResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { clearSynthesisTelemetry } from '@/lib/reasoning/synthesis-telemetry';

export async function POST(): Promise<Response> {
  clearWaivers();
  clearWaiverAuditBuffer();
  clearResolved();
  clearSynthesisTelemetry();

  return new Response(
    JSON.stringify({
      cleared: ['gate-waivers', 'contradiction-resolutions', 'feedback', 'audit'],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
