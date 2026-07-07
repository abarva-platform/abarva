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

import { recordApproval } from "@/app/api/reasoning/audit/route";
import {
  requireReasoningTenancy,
  tenancyErrorResponse,
  assertInstanceInTenant,
  requireGateApprovalRole,
  reasoningTenantId,
} from "@/app/api/reasoning/_auth";
import type { AiDecisionEvidencePacket } from "@/lib/ai-liability/human-decision-controls";
import {
  buildMovesGateApprovalEvidencePacket,
  validateMovesHumanRationale,
} from "@/lib/programs/moves-ai-liability";

interface GateApprovalBody {
  instanceId: string;
  criterionId: string;
  justification: string;
  action: "approve" | "reject";
}

export interface ApprovalRecord {
  action: "approve" | "reject";
  justification: string;
  timestamp: string;
  aiDecisionEvidencePacket: AiDecisionEvidencePacket;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// In-memory store — keyed by `${tenantId}::${instanceId}::${criterionId}`.
// The tenant prefix is the security boundary: a reader for one tenant can
// never enumerate another tenant's records by guessing instanceIds.
const approvalStore = new Map<string, ApprovalRecord>();

/** Retrieve the approval/rejection record for a given tenant+instance+criterion. */
export function getApproval(
  tenantId: string,
  instanceId: string,
  criterionId: string,
): ApprovalRecord | undefined {
  return approvalStore.get(`${tenantId}::${instanceId}::${criterionId}`);
}

/** Retrieve all approval/rejection records for a given tenant + instanceId. */
export function getApprovalsForInstance(
  tenantId: string,
  instanceId: string,
): Array<{ criterionId: string; record: ApprovalRecord }> {
  const prefix = `${tenantId}::${instanceId}::`;
  const results: Array<{ criterionId: string; record: ApprovalRecord }> = [];
  for (const [key, record] of approvalStore.entries()) {
    if (key.startsWith(prefix)) {
      results.push({ criterionId: key.slice(prefix.length), record });
    }
  }
  return results;
}

/** Clear all gate approvals — used by the demo-reset endpoint. */
export function clearApprovals(): void {
  approvalStore.clear();
}

export async function POST(request: Request): Promise<Response> {
  let ctx;
  try {
    ctx = await requireReasoningTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    return jsonResponse({ error: "internal_error" }, 500);
  }

  // Approve / reject is a privileged write — enforce role before anything else.
  const roleDenied = requireGateApprovalRole(ctx);
  if (roleDenied) return roleDenied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid JSON body" }, 400);
  }

  if (!body || typeof body !== "object") {
    return jsonResponse({ error: "body must be an object" }, 400);
  }

  const { instanceId, criterionId, justification, action } =
    body as Partial<GateApprovalBody>;

  if (typeof instanceId !== "string" || instanceId.length === 0) {
    return jsonResponse({ error: "instanceId is required" }, 400);
  }

  if (typeof criterionId !== "string" || criterionId.length === 0) {
    return jsonResponse({ error: "criterionId is required" }, 400);
  }

  if (typeof justification !== "string" || justification.length === 0) {
    return jsonResponse({ error: "justification is required" }, 400);
  }

  const justificationError = validateMovesHumanRationale(justification);
  if (justificationError) {
    return jsonResponse(
      { error: "human_rationale_required", detail: justificationError },
      400,
    );
  }

  if (justification.length > 200) {
    return jsonResponse(
      { error: "justification must be 200 characters or fewer" },
      400,
    );
  }

  if (action !== "approve" && action !== "reject") {
    return jsonResponse({ error: "action must be 'approve' or 'reject'" }, 400);
  }

  // Cross-tenant scoping: a caller may only act on instances owned by
  // their active client.
  const scopeDenied = assertInstanceInTenant(ctx, instanceId);
  if (scopeDenied) return scopeDenied;

  const tenantId = reasoningTenantId(ctx);
  const key = `${tenantId}::${instanceId}::${criterionId}`;
  const evidencePacket = buildMovesGateApprovalEvidencePacket({
    instanceId,
    tenantName: tenantId,
    criterionId,
    humanRationale: justification,
    action,
    decisionOwner: {
      name: ctx.email ?? ctx.userId,
      title: ctx.role ?? "Gate approver",
      tenantName: tenantId,
      userId: ctx.userId,
    },
  });
  const record: ApprovalRecord = {
    action,
    justification,
    timestamp: new Date().toISOString(),
    aiDecisionEvidencePacket: evidencePacket,
  };
  approvalStore.set(key, record);

  recordApproval({
    tenantId,
    instanceId,
    criterionId,
    action,
    justification,
    actedAt: record.timestamp,
    actorId: ctx.userId,
    aiDecisionEvidencePacket: evidencePacket,
  });

  return jsonResponse(
    { ok: true, action, timestamp: record.timestamp, evidencePacket },
    200,
  );
}
