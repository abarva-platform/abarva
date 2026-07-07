// POST /api/v1/programs/archive/restore · bulk-restore archived Strategic Moves.
//
// Returns each Move to its prior lifecycle_state (archived_from_state, falling
// back to 'approved') and clears archive provenance. Tenant-scoped + gated on
// `canApproveGates`, mirroring the archive route.

import { NextRequest } from "next/server";
import { restoreMove } from "@/lib/programs/mutations";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface RestorePayload {
  moveIds?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const accessPolicy = await loadUserProgramAccessPolicy(ctx);
    if (!accessPolicy.canApproveGates) {
      return Response.json(
        {
          error: "forbidden",
          detail:
            "Restoring Moves requires gate-approval (admin/maestro) permission.",
        },
        { status: 403 },
      );
    }

    const payload = (await req
      .json()
      .catch(() => null)) as RestorePayload | null;
    const moveIds = Array.isArray(payload?.moveIds)
      ? payload!.moveIds.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0,
        )
      : [];
    if (moveIds.length === 0) {
      return Response.json(
        { error: "bad_request", detail: "moveIds is required." },
        { status: 400 },
      );
    }

    const restored: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    for (const id of moveIds) {
      try {
        const ok = await restoreMove(ctx, { programId: id });
        if (ok) restored.push(id);
        else failed.push({ id, error: "not_found_or_not_updated" });
      } catch (err) {
        failed.push({
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return Response.json({ ok: failed.length === 0, restored, failed });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error("[POST /api/v1/programs/archive/restore]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
