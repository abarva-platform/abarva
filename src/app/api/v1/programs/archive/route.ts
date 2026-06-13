// POST /api/v1/programs/archive · bulk-archive Strategic Moves (Manage Moves).
//
// Archiving is a reversible soft state — NEVER a hard delete. Each Move's
// evidence, artifacts, approvals, deliverables, traces, and audit history are
// preserved untouched; the Move is set to lifecycle_state='archived', stamped
// with archive provenance, and excluded from active portfolio views. Restore
// (see ./restore/route.ts) returns it to its prior lifecycle_state.
//
// Tenant-scoped: each move is verified against ctx via getProgramById before
// the write. Gated on `canApproveGates` (the admin/maestro-capable permission
// the gate-approval flow uses).

import { NextRequest } from "next/server";
import { archiveMove } from "@/lib/programs/mutations";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { requireTenancy, tenancyErrorResponse } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ARCHIVE_REASONS = new Set([
  "no_longer_needed",
  "duplicate",
  "created_in_error",
  "replaced_by_another_move",
  "other",
]);

interface ArchivePayload {
  moveIds?: unknown;
  reason?: unknown;
  explanation?: unknown;
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
            "Archiving Moves requires gate-approval (admin/maestro) permission.",
        },
        { status: 403 },
      );
    }

    const payload = (await req
      .json()
      .catch(() => null)) as ArchivePayload | null;
    const moveIds = Array.isArray(payload?.moveIds)
      ? payload!.moveIds.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0,
        )
      : [];
    const reason =
      typeof payload?.reason === "string" ? payload.reason.trim() : "";
    const explanation =
      typeof payload?.explanation === "string" &&
      payload.explanation.trim().length > 0
        ? payload.explanation.trim()
        : null;

    if (moveIds.length === 0) {
      return Response.json(
        { error: "bad_request", detail: "moveIds is required." },
        { status: 400 },
      );
    }
    if (!reason || !ARCHIVE_REASONS.has(reason)) {
      return Response.json(
        { error: "bad_request", detail: "A valid reason is required." },
        { status: 400 },
      );
    }

    const archived: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    for (const id of moveIds) {
      try {
        const ok = await archiveMove(ctx, {
          programId: id,
          reason,
          explanation,
        });
        if (ok) archived.push(id);
        else failed.push({ id, error: "not_found_or_not_updated" });
      } catch (err) {
        failed.push({
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return Response.json({ ok: failed.length === 0, archived, failed });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error("[POST /api/v1/programs/archive]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
