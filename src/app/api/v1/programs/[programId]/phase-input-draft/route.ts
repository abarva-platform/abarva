// POST /api/v1/programs/:programId/phase-input-draft
//
// Read-only aVa phase-input drafting. Only explicit P0-to-P1 mappings create
// proposals; later phases fail closed until approved evidence is mapped to a
// specific capture field. This route never writes phase capture, creates
// deliverables, or advances a gate.

import { NextRequest } from "next/server";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getModuleState, getProgramById } from "@/lib/programs/queries";
import { computeCaptureRevision } from "@/lib/programs/phase-capture-integrity";
import {
  buildAvaPhaseInputProposals,
  describeAvaPhaseInputDraftRefusal,
} from "@/lib/programs/phase-input-draft-proposals";
import { listProgramEvidenceForPrompt } from "@/lib/programs/evidence-context";
import { listApprovedPhaseEvidence } from "@/lib/programs/approved-phase-evidence";
import {
  phaseCaptureModuleValueReader,
  phaseCaptureValuesByPhase,
  resolveMoveConfirmedSolutionRoute,
} from "@/lib/programs/phase-capture-values-for-move";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePhase(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) return null;
  return parsed;
}

/**
 * Saved answers per phase for this Move, read against the capture set the Move
 * was actually asked for. P3 Design narrows that set once P2 confirms a
 * solution route, so the route is resolved first — reading the default P3 list
 * would miss the route's own question and report two dropped ones as empty.
 */
async function loadCaptureValuesByPhase(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
): Promise<{
  valuesByPhase: Record<number, Record<string, string>>;
  confirmedSolutionRoute: ConfirmedSolutionRoute | null;
}> {
  const modules = await getModuleState(ctx, programId);
  const moduleValue = phaseCaptureModuleValueReader(modules);
  const approvedPhaseTwoEvidence = await listApprovedPhaseEvidence(
    ctx,
    programId,
    2,
  );
  const confirmedSolutionRoute = resolveMoveConfirmedSolutionRoute(
    moduleValue,
    approvedPhaseTwoEvidence.map((item) => item.evidenceId),
  );
  return {
    valuesByPhase: phaseCaptureValuesByPhase({
      moduleValue,
      confirmedSolutionRoute,
    }),
    confirmedSolutionRoute,
  };
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

    const { valuesByPhase, confirmedSolutionRoute } =
      await loadCaptureValuesByPhase(ctx, programId);
    const currentValues = valuesByPhase[phase] ?? {};
    let approvedEvidenceCount = 0;
    let approvedEvidenceUnavailable = false;
    if (phase > 1) {
      try {
        approvedEvidenceCount = (
          await listProgramEvidenceForPrompt(ctx, programId, phase)
        ).length;
      } catch {
        approvedEvidenceUnavailable = true;
      }
    }
    const proposals = buildAvaPhaseInputProposals({
      phase,
      currentValues,
      upstreamValuesByPhase: valuesByPhase,
      approvedEvidenceCount,
      approvedEvidenceUnavailable,
      confirmedSolutionRoute,
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
          ? describeAvaPhaseInputDraftRefusal({
              phase,
              currentValues,
              upstreamValuesByPhase: valuesByPhase,
              approvedEvidenceCount,
              approvedEvidenceUnavailable,
              confirmedSolutionRoute,
            })
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
