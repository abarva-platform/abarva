// GET /api/v1/programs/:programId/artifacts?family=&currentOnly=1
// Move File Cabinet data: durable artifacts registered in move_artifacts (Blob +
// Postgres), newest first, filterable by family / current-only.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import {
  listMoveArtifacts,
  type ArtifactFamily,
} from "@/lib/programs/deliverables/move-artifacts";
import { listGeneratedArtifactsForMoveAllRefs } from "@/lib/artifacts/repository";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CabinetArtifact {
  artifactId: string;
  artifactType: string;
  family: string;
  title: string;
  phase: number | null;
  fileFormat: string | null;
  fileName: string | null;
  version: number;
  status: string;
  lifecycleState?: string | null;
  qualityScore: number | null;
  unsupportedClaims?: number | null;
  generatedBy: string | null;
  createdAt: string;
  fileSize?: number | null;
  stored?: string | null;
  openItems?: string[];
  reviewStatus?: string | null;
  feedbackStatus?: string | null;
  feedbackItemCount?: number | null;
  regeneratedFromArtifactId?: string | null;
  qualityStatus?: string | null;
  goldenBarStatus?: string | null;
  artifactStatus?: string | null;
  preliminaryCaveat?: string | null;
  clientFacingVersionLabel?: string | null;
  outputRole?: string | null;
  provenanceCategory?: string | null;
  primaryEditableRecordLabel?: string | null;
  pairedVisualCompanionArtifactId?: string | null;
  visualCompanionArtifactType?: string | null;
  contextExtract?: CabinetContextExtract | null;
  downloadUrl: string;
}

interface CabinetContextExtractItem {
  status?: string;
  label?: string;
  summary?: string;
  reason?: string;
  evidenceId?: string;
  evidenceFamily?: string;
  sourceType?: string;
  sourceFileRef?: string;
  readinessStatus?: string;
  targetPhase?: number;
  whyAttached?: string;
}

interface CabinetContextExtract {
  sourceMode?: string;
  phase?: number;
  targetPhase?: number;
  generatedAt?: string;
  candidateVersionId?: string | null;
  activeTenantAccessVersionId?: string | null;
  attachedEvidenceItems?: CabinetContextExtractItem[];
  suggestedContextItems?: CabinetContextExtractItem[];
  excludedContextItems?: CabinetContextExtractItem[];
  gapItems?: CabinetContextExtractItem[];
}

function contextExtractFromMetadata(
  value: unknown,
): CabinetContextExtract | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const extract = value as CabinetContextExtract;
  const hasContextExtractShape =
    typeof extract.sourceMode === "string" ||
    Array.isArray(extract.attachedEvidenceItems) ||
    Array.isArray(extract.suggestedContextItems) ||
    Array.isArray(extract.excludedContextItems) ||
    Array.isArray(extract.gapItems);
  return hasContextExtractShape ? extract : null;
}

function phaseFromGeneratedArtifactMetadata(
  meta: Record<string, unknown> | null | undefined,
): number | null {
  const directPhase = meta?.phase;
  if (typeof directPhase === "number" && Number.isInteger(directPhase))
    return directPhase;
  if (typeof directPhase === "string" && directPhase.trim()) {
    const parsed = Number(directPhase);
    if (Number.isInteger(parsed)) return parsed;
  }

  const keyCandidates = [
    meta?.deliverableTypeKey,
    meta?.registryKey,
    meta?.deliverableType,
    meta?.renderableDoc &&
    typeof meta.renderableDoc === "object" &&
    !Array.isArray(meta.renderableDoc)
      ? (meta.renderableDoc as Record<string, unknown>).deliverableTypeKey
      : null,
    meta?.renderableDoc &&
    typeof meta.renderableDoc === "object" &&
    !Array.isArray(meta.renderableDoc)
      ? (meta.renderableDoc as Record<string, unknown>).deliverableType
      : null,
  ];
  for (const candidate of keyCandidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    const spec = DELIVERABLE_REGISTRY.find(
      (item) => item.deliverableTypeKey === candidate.trim(),
    );
    if (spec) return spec.phase;
  }

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const family = req.nextUrl.searchParams.get(
      "family",
    ) as ArtifactFamily | null;
    const currentOnly = req.nextUrl.searchParams.get("currentOnly") === "1";
    const rows = await listMoveArtifacts(ctx, programId, {
      family: family ?? undefined,
      currentOnly,
    });

    const moveArtifacts: CabinetArtifact[] = rows.map((r) => {
      const meta = r.metadata as {
        storage?: string;
        openItems?: string[];
        reviewStatus?: string;
        feedbackStatus?: string;
        feedbackItemCount?: number;
        regeneratedFromArtifactId?: string;
        qualityStatus?: string;
        goldenBarStatus?: string;
        artifactStatus?: string;
        preliminaryCaveat?: string;
        clientFacingVersionLabel?: string;
        outputRole?: string;
        provenanceCategory?: string;
        primaryEditableRecordLabel?: string;
        pairedVisualCompanionArtifactId?: string;
        visualCompanionArtifactType?: string;
        moveContextExtract?: unknown;
      };
      return {
        artifactId: r.artifact_id,
        artifactType: r.artifact_type,
        family: r.artifact_family,
        title: r.title,
        phase: r.phase,
        fileFormat: r.file_format,
        fileName: r.file_name,
        version: r.version,
        status: r.status,
        lifecycleState: r.lifecycle_state,
        qualityScore: r.quality_score,
        unsupportedClaims: r.unsupported_claims_count,
        generatedBy: r.generated_by,
        createdAt: r.created_at,
        fileSize: r.file_size,
        stored: meta?.storage ?? null,
        openItems: meta?.openItems ?? [],
        reviewStatus: meta?.reviewStatus ?? null,
        feedbackStatus: meta?.feedbackStatus ?? null,
        feedbackItemCount: meta?.feedbackItemCount ?? null,
        regeneratedFromArtifactId: meta?.regeneratedFromArtifactId ?? null,
        qualityStatus: meta?.qualityStatus ?? null,
        goldenBarStatus: meta?.goldenBarStatus ?? null,
        artifactStatus: meta?.artifactStatus ?? null,
        preliminaryCaveat: meta?.preliminaryCaveat ?? null,
        clientFacingVersionLabel: meta?.clientFacingVersionLabel ?? null,
        outputRole: meta?.outputRole ?? null,
        provenanceCategory: meta?.provenanceCategory ?? null,
        primaryEditableRecordLabel: meta?.primaryEditableRecordLabel ?? null,
        pairedVisualCompanionArtifactId:
          meta?.pairedVisualCompanionArtifactId ?? null,
        visualCompanionArtifactType: meta?.visualCompanionArtifactType ?? null,
        contextExtract: contextExtractFromMetadata(meta?.moveContextExtract),
        downloadUrl: `/api/v1/programs/${programId}/artifacts/${r.artifact_id}/download`,
      };
    });

    // Also surface the governed generated_artifacts (the real output of Approve &
    // Build / the orchestrator) — the durable move_artifacts vault often does not
    // mirror them, so the Cabinet would otherwise look near-empty. These are the
    // "generated_deliverable" family; only included when that family is selected
    // (or no family filter is applied). De-duped against move_artifacts by id.
    let generated: CabinetArtifact[] = [];
    if (!family || family === "generated_deliverable") {
      try {
        const recs = await listGeneratedArtifactsForMoveAllRefs({
          clientId: ctx.clientId,
          moveId: programId,
        });
        const seen = new Set(moveArtifacts.map((a) => a.artifactId));
        generated = recs
          .filter((rec) => !currentOnly || !rec.supersededBy)
          .filter((rec) => !seen.has(rec.id))
          .map((rec) => {
            const meta = rec.metadata as {
              renderableDoc?: { title?: string };
              phase?: number | string;
              deliverableTypeKey?: string;
              deliverableType?: string;
              registryKey?: string;
              qualityStatus?: string;
              goldenBarStatus?: string;
              artifactStatus?: string;
              outputRole?: string;
              provenanceCategory?: string;
            } | null;
            return {
              artifactId: rec.id,
              artifactType: rec.artifactType,
              family: "generated_deliverable",
              title: meta?.renderableDoc?.title ?? rec.artifactType,
              phase: phaseFromGeneratedArtifactMetadata(meta),
              fileFormat: rec.outputFormat,
              fileName: null,
              version: 1,
              status: rec.quarantineReason ? "quarantined" : "board_ready",
              // Generated deliverables are current unless a newer version
              // supersedes them. Without this the Cabinet's lifecycle filter
              // (lifecycleState === 'current') hid every generated artifact by
              // default, so a freshly-built charter showed "No artifacts yet".
              lifecycleState: rec.supersededBy ? "superseded" : "current",
              // Normalize quality to the 0–100 the Cabinet renders ("/100"):
              // the orchestrator stores 0–1, move_artifacts store 0–100.
              qualityScore:
                rec.qualityScore == null
                  ? null
                  : rec.qualityScore <= 1
                    ? Math.round(rec.qualityScore * 100)
                    : Math.round(rec.qualityScore),
              qualityStatus: meta?.qualityStatus ?? null,
              goldenBarStatus: meta?.goldenBarStatus ?? null,
              artifactStatus: meta?.artifactStatus ?? null,
              outputRole: meta?.outputRole ?? null,
              provenanceCategory: meta?.provenanceCategory ?? null,
              generatedBy: rec.renderedBy,
              createdAt: rec.renderedAt,
              downloadUrl: `/api/v1/artifacts/${rec.id}`,
            };
          });
      } catch (err) {
        // Non-fatal: the Cabinet still renders the move_artifacts vault if the
        // generated_artifacts read fails (e.g. transient DB issue).
        console.error(
          "[GET /programs/:id/artifacts] generated_artifacts merge failed",
          err,
        );
      }
    }

    const artifacts = [...generated, ...moveArtifacts].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );

    return Response.json({ ok: true, count: artifacts.length, artifacts });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
