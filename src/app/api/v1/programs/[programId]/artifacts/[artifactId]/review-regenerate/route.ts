// POST /api/v1/programs/:programId/artifacts/:artifactId/review-regenerate
// Captures client review feedback and writes the next durable Move artifact
// version through the existing move_artifacts vault.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  downloadArtifactBytes,
  getMoveArtifactForTenant,
  saveMoveArtifact,
  type ArtifactFamily,
} from "@/lib/programs/deliverables/move-artifacts";
import {
  buildReviewRegenerationPlan,
  buildReviewRegenerationPrompt,
} from "@/lib/programs/deliverables/review-regeneration";
import { streamAgentTurn } from "@/lib/agent/stream";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function stripHtmlFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function htmlFileNameFrom(title: string, version: number): string {
  const stem =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "review-regenerated-artifact";
  return `${stem}-v${version}-review-regenerated.html`;
}

function maxTokensForReview(requested: number): number {
  const envTokens = Number(process.env.NEXUS_MOVES_ARTIFACT_MAX_TOKENS ?? 0);
  return Math.max(Number.isFinite(envTokens) ? envTokens : 0, requested);
}

function normalizeReviewArtifactKey(
  artifactType: string | undefined,
  phase: number,
  title: string,
): DeliverableKey {
  const raw = `${artifactType ?? ""} ${title}`.toLowerCase();
  if (raw.includes("charter")) return "charter";
  if (raw.includes("root cause")) return "root_cause_worksheet";
  if (
    raw.includes("diagnose") ||
    raw.includes("diagnostic") ||
    raw.includes("discover")
  ) {
    return "discovery_report";
  }
  if (raw.includes("approach") || raw.includes("option")) {
    return "solution_approach_options";
  }
  if (raw.includes("architecture") || raw.includes("target state")) {
    return "target_state_architecture";
  }
  if (raw.includes("business case")) return "business_case";
  if (raw.includes("roadmap")) return "execution_roadmap";
  if (raw.includes("handoff")) return "handoff_package";
  if (phase === 1) return "charter";
  if (phase === 2) return "discovery_report";
  if (phase === 4) return "execution_roadmap";
  if (phase === 5) return "handoff_package";
  return "solution_design";
}

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
    const original = await downloadArtifactBytes(ctx, artifactId);
    const originalArtifactBody = original
      ? original.bytes.toString("utf8")
      : "[MISSING — prior artifact body could not be retrieved from artifact storage. Use metadata and feedback, and preserve this as a client-to-complete caveat.]";
    const artifactKey = normalizeReviewArtifactKey(
      artifact.artifact_type,
      artifact.phase ?? 0,
      artifact.title,
    );
    const prompt = buildReviewRegenerationPrompt({
      artifact,
      artifactKey,
      feedbackText,
      feedbackItems: plan.feedbackItems,
      originalArtifactBody,
      phase: artifact.phase ?? 0,
      contextSummary:
        typeof artifact.metadata?.solutionContextDigest === "string"
          ? artifact.metadata.solutionContextDigest
          : undefined,
    });
    let regeneratedHtml = "";
    for await (const chunk of streamAgentTurn({
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
      model: process.env.NEXUS_COMPOSER_MODEL ?? "claude-opus-4-7",
      maxTokens: maxTokensForReview(prompt.maxTokens),
      aiEgress: {
        tenantId: ctx.clientId,
        userId: /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(ctx.userId ?? "")
          ? ctx.userId
          : undefined,
        workflow: "moves-review-regenerate-complete-artifact",
        dataClass: "confidential",
        artifactType: "program",
        metadata: {
          output_format: "html",
          artifact: artifactKey,
          phase: artifact.phase ?? 0,
          regeneratedFromArtifactId: artifact.artifact_id,
        },
      },
    })) {
      regeneratedHtml += chunk;
    }
    regeneratedHtml = stripHtmlFences(regeneratedHtml);
    if (!regeneratedHtml.trim()) {
      regeneratedHtml = plan.body;
    }

    const saved = await saveMoveArtifact(ctx, {
      moveId: programId,
      phase: artifact.phase ?? 0,
      artifactType: artifact.artifact_type,
      artifactFamily: artifact.artifact_family as ArtifactFamily,
      title: plan.title,
      description:
        "Complete regenerated artifact from client review feedback. Requires review before final use.",
      fileName: htmlFileNameFrom(artifact.title, (artifact.version ?? 1) + 1),
      fileFormat: regeneratedHtml === plan.body ? "md" : "html",
      body: regeneratedHtml,
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
        regenerationMode: "complete_artifact",
        originalArtifactBodyRetrieved: Boolean(original),
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
