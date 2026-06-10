// POST /api/v1/programs/:programId/artifacts/backfill
// Registers the Move's pre-existing deliverables (deliverables_v2) into the
// durable Artifact Vault so the File Cabinet shows everything, not only
// artifacts generated after the vault shipped. Idempotent + tenant-scoped.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { backfillMoveArtifactsFromDeliverables } from "@/lib/programs/deliverables/move-artifacts-backfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const result = await backfillMoveArtifactsFromDeliverables(ctx, programId);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
