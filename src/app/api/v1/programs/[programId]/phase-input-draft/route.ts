// POST /api/v1/programs/:programId/phase-input-draft
//
// Read-only aVa phase-input drafting. This route returns structured proposals
// from approved upstream phase state; it never writes phase capture, never
// creates deliverables, and never advances a gate. The Move page may apply a
// proposal to local draft state, but governed persistence still goes through
// the explicit phase-capture save path and its revision fence.

import { NextRequest } from "next/server";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";
import {
  getPhaseCaptureSections,
  phaseCaptureModuleKey,
} from "@/lib/programs/phase-capture-contract";
import { buildAvaPhaseInputProposals } from "@/lib/programs/phase-input-draft-proposals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePhase(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) return null;
  return parsed;
}

function readModuleValue(
  moduleState: Record<string, unknown> | null | undefined,
): string {
  const value = moduleState?.value;
  return typeof value === "string" ? value : "";
}

async function loadCaptureValuesByPhase(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
): Promise<Record<number, Record<string, string>>> {
  const modules = await getModuleState(ctx, programId);
  const byPhase: Record<number, Record<string, string>> = {};
  for (let phase = 0; phase <= 5; phase += 1) {
    const values: Record<string, string> = {};
    for (const section of getPhaseCaptureSections(phase)) {
      const capturedModule = modules.find(
        (entry) =>
          entry.moduleKey === phaseCaptureModuleKey(phase, section.key),
      );
      values[section.key] = readModuleValue(capturedModule?.state);
    }
    byPhase[phase] = values;
  }
  return byPhase;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as { phase?: unknown };
    const phase = parsePhase(body.phase);
    if (phase === null) {
      return Response.json(
        {
          error: "bad_request",
          detail: "phase must be an integer in [1,5]",
        },
        { status: 400 },
      );
    }

    const valuesByPhase = await loadCaptureValuesByPhase(ctx, programId);
    const currentValues = valuesByPhase[phase] ?? {};
    const proposals = buildAvaPhaseInputProposals({
      phase,
      currentValues,
      upstreamValuesByPhase: valuesByPhase,
    });

    return Response.json({
      ok: true,
      programId,
      phase,
      currentRevision: computeCaptureRevision(currentValues),
      proposals,
      writes: false,
      savePath: `/api/v1/programs/${programId}/phase-capture`,
      refusal:
        proposals.length === 0
          ? "No cited draft is available from approved upstream phase inputs. Add source context first or write the field manually."
          : null,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/phase-input-draft]", err);
    return Response.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}
