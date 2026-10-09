// POST /api/v1/programs/:programId/public-sources/:sourceId/review
// Body: { decision: "approved" | "rejected", note?: string }
//
// The governed review of one outside PUBLIC source: pending → approved (now
// citable by this Move's deliverables) or pending → rejected (never cited).
// A decided source is never re-decided: a second decision is refused and the
// first stands, and the write only matches a row that is still pending, so two
// reviewers cannot both win. The reviewer and the time are stamped on the row.
//
// Authority is the evidence review's: `canApproveGates`, and the Move must be
// inside the caller's program grants (see current-state/evidence/:id/approve).
// Behind `moves_public_source_research`; tenant + Move fenced. Every refusal
// carries a sentence saying what did and did not land.

import { NextRequest } from "next/server";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { decidePublicSource } from "@/lib/deliverables/public-research/repository";
import {
  describePublicSourceReviewRefusal,
  toPublicSourceReviewItem,
  type PublicSourceReviewRefusalCode,
} from "@/lib/deliverables/public-research/review-contract";
import {
  normalizeReviewNote,
  PUBLIC_RESEARCH_FLAG,
  type PublicSourceReviewDecision,
} from "@/lib/deliverables/public-research/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function refusal(
  code: PublicSourceReviewRefusalCode,
  status: number,
  extra: Record<string, unknown> = {},
  opts: { currentDecision?: PublicSourceReviewDecision } = {},
) {
  return Response.json(
    {
      ok: false,
      error: code,
      detail: describePublicSourceReviewRefusal(code, opts),
      ...extra,
    },
    { status },
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; sourceId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId, sourceId } = await params;
    if (
      !isFeatureEnabled(
        { clientKey: ctx.clientKey, clientId: ctx.clientId },
        PUBLIC_RESEARCH_FLAG,
      )
    ) {
      return refusal("not_enabled", 404);
    }
    const { supabase } = await getProgramsRouteSupabase("mutation");
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) {
      return Response.json(moveUnreadableRefusalBody(), { status: 404 });
    }

    const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (
      !accessPolicy.canApproveGates ||
      (Array.isArray(accessPolicy.programIdsAllowed) &&
        !accessPolicy.programIdsAllowed.includes(programId))
    ) {
      return refusal("forbidden", 403);
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    // No default: a missing or unknown decision is refused, never read as an
    // approval.
    const decision = body?.decision;
    if (decision !== "approved" && decision !== "rejected") {
      return refusal("invalid_decision", 400);
    }
    const note = normalizeReviewNote(body?.note);
    if (!note.ok) return refusal("invalid_note", 400);

    const result = await decidePublicSource(
      { tenantKey: ctx.clientKey ?? "", programId },
      {
        sourceId,
        decision,
        reviewerUserId: ctx.userId,
        note: note.value,
      },
    );

    if (!result.ok) {
      switch (result.reason) {
        case "already_decided":
          return refusal(
            "already_decided",
            409,
            { sourceId, currentDecision: result.currentDecision },
            { currentDecision: result.currentDecision },
          );
        case "conflict":
          return refusal("decided_by_another_reviewer", 409, { sourceId });
        case "not_found":
          return refusal("source_not_found", 404, { sourceId });
        case "invalid_input":
          // The decision and the note were checked above, so what is left is
          // a source id that is not a UUID — no such source on this Move.
          return refusal("source_not_found", 404, { sourceId });
        case "invalid_scope":
          return refusal("invalid_scope", 400);
        case "read_failed":
          console.error("[public-sources] review read failed", {
            programId,
            sourceId,
            detail: result.detail,
          });
          return refusal("review_read_failed", 503, { sourceId });
        case "write_failed":
          console.error("[public-sources] review write unconfirmed", {
            programId,
            sourceId,
            detail: result.detail,
          });
          return refusal("review_decision_unconfirmed", 500, { sourceId });
      }
    }

    return Response.json({
      ok: true,
      source: toPublicSourceReviewItem(result.source),
    });
  } catch (err) {
    // Reachable on either side of the one write, so it claims neither.
    return tenancyOrNamedErrorResponse(err, tenancyErrorResponse, {
      code: "review_decision_unconfirmed",
      detail: describePublicSourceReviewRefusal("review_decision_unconfirmed"),
    });
  }
}
