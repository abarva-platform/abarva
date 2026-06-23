import "server-only";

import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import type { SolutionOption } from "@/lib/programs/solution-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApproveOptionBody {
  chosenOption?: string;
  rationale?: string;
  options?: SolutionOption[];
  tradeoffsAccepted?: string[];
  approach?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
): Promise<Response> {
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }

  const { programId } = await params;
  const program = await getProgramById(ctx, programId);
  if (!program) return Response.json({ error: "not_found" }, { status: 404 });

  let body: ApproveOptionBody;
  try {
    body = (await req.json()) as ApproveOptionBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const chosenOption = body.chosenOption?.trim();
  if (!chosenOption) {
    return Response.json(
      { error: "bad_request", detail: "chosenOption is required." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const solutionContextDigest = {
    approach: body.approach,
    options: body.options,
    chosenOption,
    tradeoffsAccepted: body.tradeoffsAccepted,
    decisions: [
      {
        phase: 3,
        decision: `Approved solution option: ${chosenOption}`,
        rationale:
          body.rationale?.trim() ||
          "Human reviewer approved the option that will drive target architecture.",
        approvedBy: ctx.userId,
        approvedAt: now,
      },
    ],
    humanApprovalNotes: [
      `P3a solution option approved by ${ctx.userId} at ${now}: ${chosenOption}`,
    ],
  };

  const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
    programId,
    moduleKey: "design",
    deliverableTypeKey: "solution_approach_options",
    title: "Approved Solution Approach Option",
    draftContent: [
      "# Approved Solution Approach Option",
      "",
      `Chosen option: ${chosenOption}`,
      "",
      `Rationale: ${solutionContextDigest.decisions[0].rationale}`,
    ].join("\n"),
    structuredData: {
      phase: 3,
      artifact: "solution_approach_options",
      output_format: "approval_digest",
      mode: "solution_option_approval",
      solutionContextDigest,
    },
    provenanceMap: {
      program: program.name,
      phase: 3,
      artifact: "solution_approach_options",
      approval: "chosen_option",
    },
  });

  return Response.json({
    ok: true,
    deliverableId,
    versionId,
    chosenOption,
    architectureMayProceed: true,
    solutionContextDigest,
  });
}
