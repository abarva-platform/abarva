import "server-only";
import { randomUUID } from "node:crypto";

import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { completeDeliverable } from "@/lib/programs/mutations";
import type { SolutionOption } from "@/lib/programs/solution-context";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import {
  decisionHashFor,
  P3_ARCHITECTURE_DELIVERABLE_KEYS,
  type ApprovedSolutionApproach,
} from "@/lib/programs/approved-solution-approach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApproveOptionBody {
  chosenOption?: string;
  rationale?: string;
  options?: SolutionOption[];
  tradeoffsAccepted?: string[];
  approach?: string;
  selectedOptionVersion?: string;
  rejectedOptionReasons?: Record<string, string>;
  scope?: string[];
  exclusions?: string[];
  assumptions?: string[];
  constraints?: string[];
  unresolvedDecisions?: string[];
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
  const options = body.options ?? [];
  const selected = options.find(
    (option) =>
      option.name === chosenOption ||
      option.id === chosenOption ||
      chosenOption.includes(option.name),
  );
  if (!selected?.id) {
    return Response.json(
      { error: "bad_request", detail: "chosenOption must match one supplied option with a stable id." },
      { status: 400 },
    );
  }
  const rationale =
    body.rationale?.trim() ||
    "Human reviewer approved the option that will drive target architecture.";
  const decisionId = randomUUID();
  const decisionVersion = now;
  const decision = {
    phase: 3,
    decision: `Approved solution option: ${chosenOption}`,
    rationale,
    approvedBy: ctx.userId,
    approvedAt: now,
  };
  const rejectedOptions = options
    .filter((option) => option.id !== selected.id)
    .map((option) => ({
      optionId: option.id,
      optionVersion: "1",
      name: option.name,
      reason:
        body.rejectedOptionReasons?.[option.id]?.trim() ||
        `Not selected because the approved rationale favored ${selected.name}.`,
    }));
  const decisionPacketWithoutHash: Omit<ApprovedSolutionApproach, "decisionHash"> = {
    decisionId,
    decisionVersion,
    selectedOptionId: selected.id,
    selectedOptionVersion: body.selectedOptionVersion?.trim() || "1",
    ...(body.approach?.trim() ? { approach: body.approach.trim() } : {}),
    options,
    chosenOption,
    rejectedOptions,
    tradeoffsAccepted: body.tradeoffsAccepted ?? [],
    scope: body.scope ?? [],
    exclusions: body.exclusions ?? [],
    assumptions: body.assumptions ?? [],
    constraints: body.constraints ?? [],
    unresolvedDecisions: body.unresolvedDecisions ?? [],
    decision,
  };
  const decisionHash = decisionHashFor(decisionPacketWithoutHash);
  const decisionLineage = {
    ...decisionPacketWithoutHash,
    decisionHash,
  };
  const solutionContextDigest = {
    approach: body.approach,
    options,
    chosenOption,
    tradeoffsAccepted: body.tradeoffsAccepted,
    decisions: [decision],
    humanApprovalNotes: [
      `P3a solution option approved by ${ctx.userId} at ${now}: ${chosenOption}`,
    ],
  };

  const { deliverableId, versionId } = await completeDeliverable(ctx, programId, {
    deliverableTypeKey: "solution_approach_options",
    title: "Approved Solution Approach Option",
    content: [
      "# Approved Solution Approach Option",
      "",
      `Chosen option: ${chosenOption}`,
      "",
      `Rationale: ${solutionContextDigest.decisions[0].rationale}`,
    ].join("\n"),
    moduleKey: "design",
    signOff: true,
    structuredData: {
      phase: 3,
      artifact: "solution_approach_options",
      output_format: "approval_digest",
      mode: "solution_option_approval",
      solutionContextDigest,
      decisionLineage,
    },
    provenanceMap: {
      program: program.name,
      phase: 3,
      artifact: "solution_approach_options",
      approval: "chosen_option",
    },
  });

  // A successfully persisted new decision invalidates every authoritative P3b
  // output built from the prior basis. Historical versions remain auditable;
  // none may remain current or satisfy a gate after the decision changes.
  const { supabase } = await getProgramsRouteSupabase("mutation");
  const { error: staleError } = await supabase
    .from("deliverables_v2")
    .update({ status: "superseded" })
    .eq("engagement_id", programId)
    .in("deliverable_type_key", [...P3_ARCHITECTURE_DELIVERABLE_KEYS])
    .neq("status", "superseded");
  if (staleError) throw staleError;

  return Response.json({
    ok: true,
    deliverableId,
    versionId,
    chosenOption,
    decisionId,
    decisionVersion,
    decisionHash,
    architectureMayProceed: true,
    solutionContextDigest,
  });
}
