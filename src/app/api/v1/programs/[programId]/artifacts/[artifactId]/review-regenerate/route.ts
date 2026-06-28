// POST /api/v1/programs/:programId/artifacts/:artifactId/review-regenerate
// Captures client review feedback and writes the next durable Move artifact
// version through the existing move_artifacts vault.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  getMoveArtifactForTenant,
  saveMoveArtifact,
  type ArtifactFamily,
} from "@/lib/programs/deliverables/move-artifacts";
import { buildReviewRegenerationPlan } from "@/lib/programs/deliverables/review-regeneration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const { programId, artifactId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json().catch(() => ({}))) as {
      feedbackText?: string;
    };
    const feedbackText = String(body.feedbackText ?? "").trim();
    if (!feedbackText) {
      return Response.json(
        {
          ok: false,
          error: "feedback_required",
          detail: "Review feedback is required before regeneration.",
        },
        { status: 400 },
      );
    }

    const artifact = await getMoveArtifactForTenant(ctx, artifactId);
    if (!artifact || artifact.move_id !== programId) {
      return Response.json(
        { ok: false, error: "artifact_not_found" },
        { status: 404 },
      );
    }

    const plan = buildReviewRegenerationPlan({
      artifact,
      feedbackText,
      requestedBy: ctx.email ?? ctx.userId,
    });

    const saved = await saveMoveArtifact(ctx, {
      moveId: programId,
      phase: artifact.phase ?? 0,
      artifactType: artifact.artifact_type,
      artifactFamily: artifact.artifact_family as ArtifactFamily,
      title: plan.title,
      description:
        "Regenerated from client review feedback. Requires review before final use.",
      fileName: plan.fileName,
      fileFormat: "md",
      body: plan.body,
      status: "review_required",
      generatedBy: ctx.email ?? ctx.userId ?? "review-regenerate",
      qualityScore: plan.qualityScore,
      unsupportedClaimsCount: 0,
      sourceBasis: "client_review_feedback",
      confidence: "medium",
      citationReady: false,
      metadata: {
        ...(artifact.metadata ?? {}),
        ...plan.metadata,
        sourceArtifactTitle: artifact.title,
      },
    });

    return Response.json({
      ok: true,
      feedbackItems: plan.feedbackItems,
      feedbackItemCount: plan.feedbackItems.length,
      regeneratedArtifact: {
        artifactId: saved.artifactId,
        version: saved.version,
        title: plan.title,
        status: "review_required",
        qualityScore: plan.qualityScore,
        qualityStatus: plan.qualityStatus,
        goldenBarStatus: plan.goldenBarStatus,
        regeneratedFromArtifactId: artifact.artifact_id,
        blobStored: saved.blobStored,
      },
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
