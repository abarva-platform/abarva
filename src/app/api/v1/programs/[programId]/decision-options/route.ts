// POST /api/v1/programs/:programId/decision-options
//
// Records a Key Design Decision option set for a Move-backed decision thread.
// The decision belongs to the thread; the Move action only ensures the thread
// exists and supplies the selected/rejected alternatives.

import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import {
  ensureThreadForMove,
  recordDecisionOptions,
  type RecordDecisionOptionInput,
} from "@/lib/decisions/auto-linker";
import { getProgramById } from "@/lib/programs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DecisionOptionPayload {
  title?: unknown;
  ownerRole?: unknown;
  options?: Array<{
    label?: unknown;
    rationaleFor?: unknown;
    rationaleAgainst?: unknown;
    isSelected?: unknown;
  }>;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptions(body: DecisionOptionPayload, decidedBy: string): RecordDecisionOptionInput[] {
  return (Array.isArray(body.options) ? body.options : [])
    .map((option) => ({
      label: clean(option.label),
      rationaleFor: clean(option.rationaleFor),
      rationaleAgainst: clean(option.rationaleAgainst),
      isSelected: option.isSelected === true,
      decidedBy,
    }))
    .filter((option) => option.label.length > 0);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: "archived_or_deleted" }, { status: 410 });
    }

    const body = (await req.json().catch(() => ({}))) as DecisionOptionPayload;
    const title = clean(body.title) || `${program.name} key design decision`;
    const ownerRole = clean(body.ownerRole) || "Move sponsor";
    const decidedBy = ctx.email || ctx.userId;
    const options = parseOptions(body, decidedBy);
    if (options.length < 2) {
      return Response.json(
        { error: "bad_request", detail: "At least two options are required." },
        { status: 400 },
      );
    }
    if (options.filter((option) => option.isSelected).length !== 1) {
      return Response.json(
        { error: "bad_request", detail: "Exactly one option must be selected." },
        { status: 400 },
      );
    }

    const thread = await ensureThreadForMove({
      clientId: program.clientId,
      moveId: program.id,
      title,
      ownerRole,
      linkedBy: decidedBy,
      linkReason: "Move phase key design decision recorded from the governed phase workspace",
    });
    const recordedOptions = await recordDecisionOptions(thread.id, options);
    return Response.json({
      ok: true,
      thread,
      options: recordedOptions,
      dossierPath: `/dossier/${thread.id}`,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/decision-options]", err);
    return Response.json(
      {
        error: "internal_error",
        detail: err instanceof Error ? err.message : "Could not record decision options.",
      },
      { status: 500 },
    );
  }
}
