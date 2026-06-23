// POST /api/v1/programs/:programId/approve-brief
//
// In-place P0 origination-brief approval. The brief approval lives in
// `program_approval_requests`; the only UI that decided it was the Admin queue
// (which redirects to the Setup overview and is effectively unreachable from a
// Move). This tenant-scoped endpoint lets a human approve the brief directly
// from the Move surface: it finds the Move's pending request, checks the
// caller's gate-approval capability, and decides it 'approved' — which advances
// engagements.current_phase 0 -> 1 via decideApprovalRequest. No admin queue,
// no console/API rescue.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { decideApprovalRequest } from "@/lib/programs/approval";
import { azureRead } from "@/lib/data-plane/azureRead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;

    // Same capability that gates a phase advance: approving the brief feeds the
    // P0 gate and advances the phase, so it requires canApproveGates.
    const policy = await loadUserProgramAccessPolicy(ctx);
    if (!policy.canApproveGates) {
      return Response.json(
        {
          error: "forbidden",
          detail: "You do not have the gate-approval capability for this Move.",
        },
        { status: 403 },
      );
    }

    // Find the Move's pending brief-approval request (tenant-scoped).
    const rows = await azureRead.select<{ id: string; tenant_key: string }>({
      table: "program_approval_requests",
      columns: ["id", "tenant_key"],
      where: { program_id: programId, request_status: "pending" },
      orderBy: { column: "requested_at", direction: "desc" },
      limit: 1,
    });
    const row = rows[0];
    if (!row || row.tenant_key !== ctx.clientKey) {
      return Response.json(
        {
          error: "no_pending_request",
          detail: "No pending brief approval for this Move.",
        },
        { status: 404 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { rationale?: string };
    await decideApprovalRequest({
      requestId: row.id,
      decidedByUserId: ctx.userId,
      decision: "approved",
      actorTenancy: ctx,
      rationale:
        body.rationale?.trim() ||
        "P0 origination brief approved in-place; advancing to P1 Charter.",
    });

    return Response.json({ ok: true, requestId: row.id });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/approve-brief]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
