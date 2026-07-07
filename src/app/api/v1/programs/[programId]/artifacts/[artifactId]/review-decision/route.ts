import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  downloadArtifactBytes,
  getMoveArtifactForTenant,
} from "@/lib/programs/deliverables/move-artifacts";
import {
  buildReviewPackageFromArtifacts,
  buildP2ReviewPacket,
  createArtifactReviewDecision,
  getLatestArtifactReviewDecision,
  normalizeDecision,
  readinessForDecision,
} from "@/lib/programs/deliverables/artifact-review-decisions";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { MoveArtifactRow } from "@/lib/programs/deliverables/move-artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 30);
}

async function loadArtifactHtml(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  artifactId: string,
): Promise<string | null> {
  const artifact = await downloadArtifactBytes(ctx, artifactId).catch(() => null);
  if (!artifact?.bytes) return null;
  if (artifact.fileFormat !== "html" && artifact.fileFormat !== "md") return null;
  return artifact.bytes.toString("utf-8");
}

async function findPairedReviewArtifact(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  artifact: MoveArtifactRow,
): Promise<MoveArtifactRow | null> {
  const meta = artifact.metadata ?? {};
  const outputRole =
    typeof meta.outputRole === "string" ? meta.outputRole : null;
  const pairedVisualCompanionArtifactId =
    typeof meta.pairedVisualCompanionArtifactId === "string"
      ? meta.pairedVisualCompanionArtifactId
      : null;

  if (outputRole === "docx_editable_phase_record" && pairedVisualCompanionArtifactId) {
    const paired = await getMoveArtifactForTenant(
      ctx,
      pairedVisualCompanionArtifactId,
    );
    return paired?.move_id === programId ? paired : null;
  }

  if (
    outputRole !== "html_visual_review_companion" &&
    artifact.file_format !== "html"
  ) {
    return null;
  }

  try {
    const sb = getAzureWriteFluentClient();
    const { data, error } = await sb
      .from("move_artifacts")
      .select("*")
      .eq("tenant_key", ctx.clientKey ?? "")
      .eq("move_id", programId)
      .eq("metadata->>pairedVisualCompanionArtifactId", artifact.artifact_id)
      .eq("metadata->>outputRole", "docx_editable_phase_record")
      .eq("lifecycle_state", "current")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as MoveArtifactRow;
  } catch {
    return null;
  }
}

async function loadReviewState(
  ctx: Awaited<ReturnType<typeof requireTenancy>>,
  programId: string,
  artifactId: string,
) {
  const artifact = await getMoveArtifactForTenant(ctx, artifactId);
  if (!artifact || artifact.move_id !== programId) return null;
  const pairedArtifact = await findPairedReviewArtifact(ctx, programId, artifact);
  const reviewPackage = buildReviewPackageFromArtifacts({
    artifact,
    pairedArtifact,
  });
  const artifactHtml = await loadArtifactHtml(ctx, artifactId);
  const latestDecision =
    (await getLatestArtifactReviewDecision(ctx, {
      moveId: programId,
      phase: artifact.phase ?? undefined,
      artifactId,
    })) ??
    (await getLatestArtifactReviewDecision(ctx, {
      moveId: programId,
      phase: artifact.phase ?? undefined,
    }));
  const readiness = readinessForDecision(latestDecision?.decision);
  return {
    artifact,
    reviewPackage,
    packet: buildP2ReviewPacket({ artifact, artifactHtml }),
    latestDecision,
    readiness,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId, artifactId } = await params;
    const state = await loadReviewState(ctx, programId, artifactId);
    if (!state) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json({
      ok: true,
      artifact: {
        artifactId: state.artifact.artifact_id,
        moveId: state.artifact.move_id,
        phase: state.artifact.phase,
        artifactType: state.artifact.artifact_type,
        version: state.artifact.version,
        status: state.artifact.status,
        title: state.artifact.title,
      },
      reviewPackage: state.reviewPackage,
      packet: state.packet,
      latestDecision: state.latestDecision,
      readiness: state.readiness,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; artifactId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId, artifactId } = await params;
    const state = await loadReviewState(ctx, programId, artifactId);
    if (!state) return Response.json({ error: "not_found" }, { status: 404 });

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const decision = normalizeDecision(body?.decision);
    const rationale = typeof body?.rationale === "string" ? body.rationale.trim() : "";
    if (!decision) {
      return Response.json({ error: "invalid_decision" }, { status: 400 });
    }
    if (!rationale) {
      return Response.json(
        { error: "rationale_required", detail: "Review decisions require a rationale." },
        { status: 400 },
      );
    }

    const persisted = await createArtifactReviewDecision(ctx, {
      artifact: state.artifact,
      decision,
      rationale,
      carriedForwardCaveats: cleanStringArray(body?.carriedForwardCaveats),
      missingEvidence: cleanStringArray(body?.missingEvidence),
      reviewPackage: state.reviewPackage,
    });

    return Response.json({
      ok: true,
      decision: persisted,
      reviewPackage: state.reviewPackage,
      packet: state.packet,
      readiness: readinessForDecision(persisted.decision),
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
