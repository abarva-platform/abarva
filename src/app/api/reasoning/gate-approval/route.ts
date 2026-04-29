// POST /api/reasoning/gate-approval
// Body: { instanceId: string; criterionId: string; justification: string; action: 'approve' | 'reject' }
// Demo-only endpoint — records a gate-criterion approval or rejection in an in-memory store.
// No persistence: resets on server restart (matches gate-waiver and missions/state patterns).

interface GateApprovalBody {
  instanceId: string;
  criterionId: string;
  justification: string;
  action: 'approve' | 'reject';
}

export interface ApprovalRecord {
  action: 'approve' | 'reject';
  justification: string;
  timestamp: string;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// In-memory store — keyed by `${instanceId}::${criterionId}`.
const approvalStore = new Map<string, ApprovalRecord>();

/** Retrieve the approval/rejection record for a given instance+criterion pair. */
export function getApproval(instanceId: string, criterionId: string): ApprovalRecord | undefined {
  return approvalStore.get(`${instanceId}::${criterionId}`);
}

/** Clear all gate approvals — used by the demo-reset endpoint. */
export function clearApprovals(): void {
  approvalStore.clear();
}

export async function POST(request: Request): Promise<Response> {
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

  const key = `${instanceId}::${criterionId}`;
  const record: ApprovalRecord = { action, justification, timestamp: new Date().toISOString() };
  approvalStore.set(key, record);

  return jsonResponse({ ok: true, action, timestamp: record.timestamp }, 200);
}
