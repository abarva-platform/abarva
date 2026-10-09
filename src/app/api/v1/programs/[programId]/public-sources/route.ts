// GET /api/v1/programs/:programId/public-sources[?decision=pending|approved|rejected]
//
// The review queue's read: every outside PUBLIC source the research step
// stored for this Move, newest first, optionally filtered by decision. A
// public source is a public web page (a program rule, a payment rule, a
// published study); it is never a fact about the client. Listing one here does
// not make it citable — only an approval through the sibling review route
// does. Behind `moves_public_source_research`; tenant + Move fenced.

import { NextRequest } from "next/server";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getProgramById } from "@/lib/programs/queries";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { listPublicSources } from "@/lib/deliverables/public-research/repository";
import {
  describePublicSourceReviewRefusal,
  toPublicSourceReviewItem,
  type PublicSourceReviewRefusalCode,
} from "@/lib/deliverables/public-research/review-contract";
import {
  PUBLIC_RESEARCH_FLAG,
  type PublicSourceDecision,
} from "@/lib/deliverables/public-research/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function refusal(code: PublicSourceReviewRefusalCode, status: number) {
  return Response.json(
    { ok: false, error: code, detail: describePublicSourceReviewRefusal(code) },
    { status },
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;
    if (
      !isFeatureEnabled(
        { clientKey: ctx.clientKey, clientId: ctx.clientId },
        PUBLIC_RESEARCH_FLAG,
      )
    ) {
      return refusal("not_enabled", 404);
    }
    const program = await getProgramById(ctx, programId);
    if (!program) {
      return Response.json(moveUnreadableRefusalBody(), { status: 404 });
    }

    // The repository validates the filter against the decision vocabulary and
    // refuses an unknown one as `invalid_input` before reading; that refusal is
    // answered as `invalid_filter` below. One check, in one place.
    const raw = new URL(req.url).searchParams.get("decision");
    const decision = raw ? (raw as PublicSourceDecision) : undefined;

    // The tenant is the session's, never the request's: no query parameter or
    // header can widen this read to another tenant's rows.
    const result = await listPublicSources(
      { tenantKey: ctx.clientKey ?? "", programId },
      decision ? { decision } : {},
    );
    if (!result.ok) {
      if (result.reason === "invalid_scope") {
        return refusal("invalid_scope", 400);
      }
      if (result.reason === "invalid_input") {
        return refusal("invalid_filter", 400);
      }
      console.error("[public-sources] list read failed", {
        programId,
        detail: result.detail,
      });
      return refusal("sources_unreadable", 503);
    }
    return Response.json({
      ok: true,
      decision: decision ?? null,
      sources: result.sources.map(toPublicSourceReviewItem),
    });
  } catch (err) {
    // A read: nothing was written on any path, so the named arm only has to
    // say the list is unknown, not empty.
    return tenancyOrNamedErrorResponse(err, tenancyErrorResponse, {
      code: "sources_unreadable",
      detail: describePublicSourceReviewRefusal("sources_unreadable"),
    });
  }
}
