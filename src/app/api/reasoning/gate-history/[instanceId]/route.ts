// GET /api/reasoning/gate-history/:instanceId
// Aggregates all gate waivers, approvals, and rejections for a given instanceId.
// Returns entries sorted by timestamp descending.
// In-memory only — resets on server restart (matches gate-waiver / gate-approval patterns).

import { getWaiversForInstance } from '@/app/api/reasoning/gate-waiver/route';
import { getApprovalsForInstance } from '@/app/api/reasoning/gate-approval/route';

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
  const { instanceId } = await params;

  if (typeof instanceId !== 'string' || instanceId.length === 0) {
    return jsonResponse({ error: 'instanceId is required' }, 400);
  }

  const entries: GateHistoryEntry[] = [];

  // Collect waivers.
  for (const { criterionId, reason, waivedAt } of getWaiversForInstance(instanceId)) {
    entries.push({
      criterionId,
      action: 'waived',
      justification: reason,
      timestamp: waivedAt,
    });
  }

  // Collect approvals and rejections.
  for (const { criterionId, record } of getApprovalsForInstance(instanceId)) {
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
