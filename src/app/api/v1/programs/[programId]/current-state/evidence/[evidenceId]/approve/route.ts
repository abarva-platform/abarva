// POST /api/v1/programs/:programId/current-state/evidence/:evidenceId/approve
// Body: { decision?: "approved" | "rejected", rationale?: string }
// The GOVERNED PROMOTION for document-extracted current-state evidence: flips a
// pending review to approved (→ readiness 'committed') or rejected. This is the
// only path by which a parsed PDF/PPTX/DOCX fact becomes committed evidence —
// never automatic. Tenant + move scoped + audited.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../../_auth";
import { decideEvidenceReview } from "@/lib/programs/current-state-doc-ingest";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { normalizeReviewedEvidenceExtraction } from "@/lib/programs/evidence-review-contract";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";
import {
  describeAlreadyDecidedEvidenceReview,
  describeEvidenceDecisionRefusal,
} from "@/lib/programs/evidence-cabinet-readback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; evidenceId: string }> },
) {
  try {
    const { programId, evidenceId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase("mutation");
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (
      !accessPolicy.canApproveGates ||
      (Array.isArray(accessPolicy.programIdsAllowed) &&
        !accessPolicy.programIdsAllowed.includes(programId))
    ) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      decision?: string;
      rationale?: string;
      reviewedExtraction?: unknown;
    };
    const decision = body.decision === "rejected" ? "rejected" : "approved";
    const reviewedExtraction =
      decision === "approved"
        ? normalizeReviewedEvidenceExtraction(body.reviewedExtraction)
        : undefined;
    if (decision === "approved" && !reviewedExtraction) {
      return Response.json(
        { error: "reviewed_extraction_required" },
        { status: 400 },
      );
    }

    const result = await decideEvidenceReview(ctx, {
      moveId: programId,
      evidenceId,
      decision,
      rationale: body.rationale,
      reviewedExtraction: reviewedExtraction ?? undefined,
    });

    if (!result.ok) {
      // Three different situations arrive here and they do NOT share a next
      // action, so the promotion reports WHICH one it is and this answers each
      // on its own. They were collapsed into one `no_pending_review`, whose
      // sentence tells the reviewer the decision was already recorded and to
      // reload to read it — true when a review exists, and a fabrication when
      // the evidence is not on the Move at all, which is what an upload whose
      // evidence was never captured looks like from here.
      //
      // `reviewed_extraction_missing` is NOT given an arm: the 400 above
      // refuses an approval without the reviewed extraction before this call
      // can be made, and the promotion re-derives it from the same argument, so
      // that reason is unreachable from this route. The route suite asserts the
      // unreachability instead of exercising an arm nothing can reach.
      //
      // The status stays 409 for every one of them. A cross-tenant id must keep
      // answering exactly as a nonexistent one does, and the code is what
      // carries the distinction a reviewer can act on.
      const notOnMove = result.reason === "evidence_not_found";
      const code = notOnMove ? "evidence_not_in_move" : "no_pending_review";
      // The recorded decision rides in the SENTENCE, not in a field of its own.
      // The cabinet renders `detail` and nothing else from this body, so a
      // `recordedDecision` field beside it would be read by no client at all.
      const detail = notOnMove
        ? describeEvidenceDecisionRefusal({ code })
        : describeAlreadyDecidedEvidenceReview(result.decision);
      return Response.json(
        { ok: false, error: code, detail, evidenceId },
        { status: 409 },
      );
    }

    return Response.json(result, { status: 200 });
  } catch (err) {
    // `tenancyErrorResponse` re-throws anything that is not a `TenancyError`,
    // which left every storage/DB failure here as an unbodied 500: the cabinet
    // read no body, fell through to its unnamed-refusal sentence, and told the
    // reviewer nothing was approved. This arm is reachable on either side of
    // the promotion's one write, so it claims NEITHER direction and sends the
    // reviewer to read the evidence's own state.
    return tenancyOrNamedErrorResponse(err, tenancyErrorResponse, {
      code: "review_decision_unconfirmed",
      detail: describeEvidenceDecisionRefusal({
        code: "review_decision_unconfirmed",
      }),
    });
  }
}
