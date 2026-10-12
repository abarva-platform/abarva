import { NextRequest } from "next/server";
import { z } from "zod";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { evaluateGate } from "@/lib/programs/governance";
import { readP5Handoff } from "@/lib/programs/p5-tower-handoff";
import { P5_TOWER_HANDOFF_FLAG, P5HandoffBindingSchema } from "@/lib/programs/p5-measurement-plan";
import {
  P5HandoffRefusal,
  persistP5Handoff,
  p5Hash,
  withP5HandoffTransaction,
} from "@/lib/data-plane/write-adapters/p5OutcomeHandoffAdapter";
import { writeTransactionOutcome } from "@/lib/data-plane/postgresCompat";
import { getProgramById } from "@/lib/programs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.strictObject({
  action: z.literal("accept_planned_handoff"),
  binding: P5HandoffBindingSchema,
});

async function authorize(programId: string, write: boolean) {
  const ctx = await requireTenancy();
  if (
    !isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      P5_TOWER_HANDOFF_FLAG,
    )
  )
    throw new P5HandoffRefusal(
      "handoff_not_enabled",
      "The planned Tower handoff is not enabled for this workspace.",
      404,
    );
  const program = await getProgramById(ctx, programId);
  if (!program || program.clientId !== ctx.clientId)
    throw new P5HandoffRefusal(
      "move_not_readable",
      "This Move is not accessible.",
      404,
    );
  const policy = await loadUserProgramAccessPolicy(ctx, { programId });
  if (
    (policy.programIdsAllowed &&
      !policy.programIdsAllowed.includes(programId)) ||
    !policy.canViewFinancialData ||
    (write && (!policy.canApproveGates || !policy.canPublishDeliverables))
  )
    throw new P5HandoffRefusal(
      "handoff_forbidden",
      "Reviewing planned values requires financial visibility; accepting the handoff also requires gate and publication permission for this Move.",
      403,
    );
  return ctx;
}

async function prerequisites(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
) {
  for (const phase of [4, 5]) {
    const gate = await evaluateGate(ctx, programId, phase, phase + 1, {
      allowHistoricalPhase: true,
      skipP5Publication: true,
    });
    if (gate.failedChecks.some((row) => row.severity === "hard"))
      throw new P5HandoffRefusal(
        "handoff_prerequisites_blocked",
        `Review and clear the current P${phase} gate documents and hard checks before accepting the handoff.`,
      );
  }
}

function refusal(error: unknown, completedTransaction?: "committed") {
  if (error instanceof P5HandoffRefusal)
    return Response.json(
      {
        ok: false,
        error: error.code,
        detail: error.message,
        transactionOutcome: completedTransaction ?? writeTransactionOutcome(error),
      },
      { status: error.status },
    );
  try {
    return tenancyErrorResponse(error);
  } catch {
    /* authored read/write refusal below */
  }
  console.error("[moves-p5-tower-handoff]", {
    transactionOutcome: completedTransaction ?? writeTransactionOutcome(error),
  });
  return Response.json(
    {
      ok: false,
      error: "handoff_unavailable",
      transactionOutcome: completedTransaction ?? writeTransactionOutcome(error),
      detail:
        "The handoff could not be verified. Its stored state is unknown; read it before retrying.",
    },
    { status: 503 },
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await authorize(programId, false);
    return Response.json((await readP5Handoff(ctx, programId, true)).view);
  } catch (error) {
    return refusal(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  let committed = false;
  try {
    const { programId } = await params;
    const ctx = await authorize(programId, true);
    const read = requestSchema.safeParse(await req.json().catch(() => null));
    if (!read.success)
      throw new P5HandoffRefusal(
        "handoff_request_invalid",
        "Refresh the current contract and saved measurement plan before accepting the planned handoff.",
        400,
      );
    if (
      read.data.binding.moveId !== programId ||
      read.data.binding.clientId !== ctx.clientId
    )
      throw new P5HandoffRefusal(
        "handoff_scope_mismatch",
        "The handoff belongs to a different Move or tenant.",
        403,
      );
    const result = await withP5HandoffTransaction(ctx, programId, async () => {
      const currentActor = await authorize(programId, true);
      if (currentActor.clientId !== ctx.clientId || currentActor.clientKey !== ctx.clientKey || currentActor.userId !== ctx.userId)
        throw new P5HandoffRefusal("handoff_actor_changed", "The signed-in actor or tenant changed. Refresh the handoff before accepting.", 403);
      await prerequisites(ctx, programId);
      const current = await readP5Handoff(ctx, programId);
      if (
        !current.view.binding ||
        p5Hash(current.view.binding) !== p5Hash(read.data.binding)
      )
        throw new P5HandoffRefusal(
          "handoff_basis_changed",
          "The signed contract, saved plan or approved P4 inputs changed. Refresh and review before accepting.",
        );
      return persistP5Handoff(ctx, current.view.binding, current.rows);
    });
    committed = true;
    const readback = await readP5Handoff(ctx, programId, true);
    if (readback.view.publication.state !== "published")
      throw new P5HandoffRefusal(
        "publication_readback_unavailable",
        "The publication transaction completed, but independent readback did not confirm its rows. Read its stored state before retrying.",
        503,
      );
    return Response.json({
      ...readback.view,
      ...result,
      transactionOutcome: "committed",
      publishedBy: ctx.userId,
    });
  } catch (error) {
    return refusal(error, committed ? "committed" : undefined);
  }
}
