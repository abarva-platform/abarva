import "server-only";
import { randomUUID } from "node:crypto";

import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { completeDeliverable } from "@/lib/programs/mutations";
import type { SolutionOption } from "@/lib/programs/solution-context";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import {
  decisionHashFor,
  loadApprovedSolutionApproach,
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

function normalizeString(value: string | undefined): string {
  return (value ?? "").trim();
}

function stringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function optionsSemanticallyEqual(
  left: SolutionOption[],
  right: SolutionOption[],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isSameApprovedDecision(args: {
  current: ApprovedSolutionApproach;
  selectedOptionId: string;
  selectedOptionVersion: string;
  chosenOption: string;
  rationale: string;
  approach?: string;
  options: SolutionOption[];
  tradeoffsAccepted: string[];
  scope: string[];
  exclusions: string[];
  assumptions: string[];
  constraints: string[];
  unresolvedDecisions: string[];
}): boolean {
  const { current } = args;
  return (
    current.selectedOptionId === args.selectedOptionId &&
    current.selectedOptionVersion === args.selectedOptionVersion &&
    current.chosenOption === args.chosenOption &&
    normalizeString(current.approach) === normalizeString(args.approach) &&
    current.decision.rationale === args.rationale &&
    optionsSemanticallyEqual(current.options, args.options) &&
    stringArraysEqual(current.tradeoffsAccepted, args.tradeoffsAccepted) &&
    stringArraysEqual(current.scope, args.scope) &&
    stringArraysEqual(current.exclusions, args.exclusions) &&
    stringArraysEqual(current.assumptions, args.assumptions) &&
    stringArraysEqual(current.constraints, args.constraints) &&
    stringArraysEqual(current.unresolvedDecisions, args.unresolvedDecisions)
  );
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
      {
        error: "bad_request",
        detail: "chosenOption must match one supplied option with a stable id.",
      },
      { status: 400 },
    );
  }
  const rationale =
    body.rationale?.trim() ||
    "Human reviewer approved the option that will drive target architecture.";
  const selectedOptionVersion = body.selectedOptionVersion?.trim() || "1";
  const approach = body.approach?.trim();
  const tradeoffsAccepted = body.tradeoffsAccepted ?? [];
  const scope = body.scope ?? [];
  const exclusions = body.exclusions ?? [];
  const assumptions = body.assumptions ?? [];
  const constraints = body.constraints ?? [];
  const unresolvedDecisions = body.unresolvedDecisions ?? [];

  const existingApproval = await loadApprovedSolutionApproach({
    moveId: programId,
    clientId: ctx.clientId,
  });
  if (
    existingApproval &&
    isSameApprovedDecision({
      current: existingApproval,
      selectedOptionId: selected.id,
      selectedOptionVersion,
      chosenOption,
      rationale,
      approach,
      options,
      tradeoffsAccepted,
      scope,
      exclusions,
      assumptions,
      constraints,
      unresolvedDecisions,
    })
  ) {
    return Response.json({
      ok: true,
      deliverableId: existingApproval.decisionId,
      versionId: existingApproval.decisionVersion,
      chosenOption,
      decisionId: existingApproval.decisionId,
      decisionVersion: existingApproval.decisionVersion,
      decisionHash: existingApproval.decisionHash,
      architectureMayProceed: true,
      reusedExistingApproval: true,
    });
  }

  const decisionId = randomUUID();
  const decisionVersion = now;
  // Audit record: keeps the raw actor id for lineage/hash integrity. This is
  // ops-facing (stored in decisionLineage.structured_data), never rendered
  // into a client-facing artifact directly.
  const decision = {
    phase: 3,
    decision: `Approved solution option: ${chosenOption}`,
    rationale,
    approvedBy: ctx.userId,
    approvedAt: now,
  };
  // Client-facing record: an internal DB user id must never appear in an
  // executive artifact (roadmap governed-artifact-sync review). Reference the
  // approver by role, with the decision id as the auditable back-reference.
  const clientSafeDecision = {
    phase: 3,
    decision: `Approved solution option: ${chosenOption}`,
    rationale,
    approvedByRole: "sponsor",
    auditReference: decisionId,
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
  const decisionPacketWithoutHash: Omit<
    ApprovedSolutionApproach,
    "decisionHash"
  > = {
    decisionId,
    decisionVersion,
    selectedOptionId: selected.id,
    selectedOptionVersion,
    ...(approach ? { approach } : {}),
    options,
    chosenOption,
    rejectedOptions,
    tradeoffsAccepted,
    scope,
    exclusions,
    assumptions,
    constraints,
    unresolvedDecisions,
    decision,
  };
  const decisionHash = decisionHashFor(decisionPacketWithoutHash);
  const decisionLineage = {
    ...decisionPacketWithoutHash,
    decisionHash,
  };
  const solutionContextDigest = {
    approach,
    options,
    chosenOption,
    tradeoffsAccepted,
    // Feed the CLIENT-SAFE decision (role, not user id) into the context that
    // binds to generated artifacts. The audit `decision` with the raw actor id
    // stays in `decisionLineage` only.
    decisions: [clientSafeDecision],
    humanApprovalNotes: [
      `P3 solution option approved by the sponsor at ${now}: ${chosenOption} (audit ref ${decisionId}).`,
    ],
  };

  const { deliverableId, versionId } = await completeDeliverable(
    ctx,
    programId,
    {
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
    },
  );

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
