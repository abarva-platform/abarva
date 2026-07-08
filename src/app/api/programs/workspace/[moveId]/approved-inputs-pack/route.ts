// POST /api/programs/workspace/[moveId]/approved-inputs-pack
// Persist a client-approved next-phase Inputs Pack (Level 2 feed-forward) into
// the existing governed Move-scoped store. Auth via requireTenancy() + program
// tenancy gate. Move-scoped; server sets approvedBy/approvedAt/moveId (never
// trusts the client for those). Never promoted to enterprise context.

import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getActiveClientRow } from "@/lib/active-client";
import { clientKeyToBrokerTenantKey } from "@/lib/agent/tools/intelligence/_shared";
import { recordApprovedInputsPack } from "@/lib/programs/approved-inputs-pack-store";
import { isApprovedInputsPack } from "@/lib/programs/phase-templates";
import type { TenancyCtx } from "@/lib/programs/types.db";

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ moveId: string }> },
) {
  let ctx: TenancyCtx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return jsonError(500, "internal_error");
    }
  }

  const { moveId } = await params;
  if (!moveId) return jsonError(400, "missing_move_id");

  const program = await getProgramById(ctx, moveId);
  if (!program) return jsonError(403, "forbidden");
  if (program.archivedAt || program.deletedAt) {
    return jsonError(410, "archived_or_deleted");
  }

  let body: { pack?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }
  if (!isApprovedInputsPack(body.pack)) {
    return jsonError(400, "invalid_pack");
  }

  const client = await getActiveClientRow();
  if (!client) return jsonError(403, "no_client");
  const tenantKey = clientKeyToBrokerTenantKey(client.key);

  // Server owns identity + provenance — do not trust the client for these.
  const approvedAt = new Date().toISOString();
  const pack = {
    ...body.pack,
    moveId,
    approvedBy: ctx.userId,
    approvedAt,
    moveScopedOnly: true as const,
    enterprisePromotion: "not_eligible" as const,
  };

  let id: string;
  try {
    id = await recordApprovedInputsPack(ctx, {
      tenantKey,
      moveId,
      targetPhase: pack.targetPhase,
      targetPhaseLabel: pack.targetPhaseLabel,
      pack,
    });
  } catch (err) {
    console.error("[approved-inputs-pack] write_failed", err);
    return jsonError(500, "write_failed");
  }

  return Response.json(
    { ok: true, id, targetPhase: pack.targetPhase, approvedAt },
    { status: 201 },
  );
}
