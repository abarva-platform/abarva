// POST /api/v1/programs/:programId/current-state/evidence/:evidenceId/approve
// Body: { decision?: "approved" | "rejected", rationale?: string }
// The GOVERNED PROMOTION for document-extracted current-state evidence: flips a
// pending review to approved (→ readiness 'committed') or rejected. This is the
// only path by which a parsed PDF/PPTX/DOCX fact becomes committed evidence —
// never automatic. Tenant + move scoped + audited.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../../_auth";
import { decideEvidenceReview } from "@/lib/programs/current-state-doc-ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; evidenceId: string }> },
) {
  try {
    const { programId, evidenceId } = await params;
    const ctx = await requireTenancy();

    const body = (await req.json().catch(() => ({}))) as {
      decision?: string;
      rationale?: string;
    };
    const decision = body.decision === "rejected" ? "rejected" : "approved";

    const result = await decideEvidenceReview(ctx, {
      moveId: programId,
      evidenceId,
      decision,
      rationale: body.rationale,
    });

    if (!result.ok) {
      // No pending review for this evidence in this move — already decided or
      // not found. Honest 409 rather than a silent success.
      return Response.json(
        { error: "no_pending_review", evidenceId },
        { status: 409 },
      );
    }

    return Response.json(result, { status: 200 });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
