import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  evaluateP0SourceEvidenceCoverage,
  type P0SourceEvidenceItem,
  type P0SourceEvidenceReview,
} from "@/lib/programs/p0-source-evidence-contract";
import { moveEvidenceReadTenantKeys } from "@/lib/programs/evidence-readiness/tenant-read-scope";

export interface P0MinimumEvidenceStatus {
  available: boolean;
  approvedSourceFileCount: number;
  pendingReviewCount: number;
  evidenceTitles: string[];
}

export class P0SourceEvidenceGateError extends Error {
  constructor(
    readonly code: "p0_evidence_required" | "p0_evidence_status_unavailable",
    message: string,
  ) {
    super(message);
    this.name = "P0SourceEvidenceGateError";
  }
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function loadP0MinimumEvidenceStatus(args: {
  tenantKey: string;
  moveId: string;
}): Promise<P0MinimumEvidenceStatus> {
  const unavailable = (): P0MinimumEvidenceStatus => ({
    available: false,
    approvedSourceFileCount: 0,
    pendingReviewCount: 0,
    evidenceTitles: [],
  });
  if (!args.tenantKey || !args.moveId) return unavailable();
  // Same tenant, more than one stored key: the product writes the app client
  // key and a data-plane load writes the canonical substrate key. Scoped to one
  // of them, this read reported the other producer's approved files as absent,
  // and the P0 hard criterion counts absent evidence as unmet. Per-tenant.
  const tenantKeys = moveEvidenceReadTenantKeys(args.tenantKey);

  try {
    const db = getAzureReadFluentClient();
    const { data: reviewData, error: reviewError } = await db
      .from("program_evidence_reviews")
      .select("evidence_id, decision, phase, source_ref")
      .in("tenant_key", tenantKeys)
      .eq("program_id", args.moveId)
      .eq("phase", 0)
      .in("decision", ["approved", "pending"])
      .limit(200);
    if (reviewError || !Array.isArray(reviewData)) return unavailable();

    const reviews = reviewData as P0SourceEvidenceReview[];
    const evidenceIds = reviews
      .map((review) => nonEmpty(review.evidence_id))
      .filter((id): id is string => Boolean(id));
    const uniqueEvidenceIds = [...new Set(evidenceIds)];
    const evidenceDataResult =
      uniqueEvidenceIds.length > 0
        ? await db
            .from("program_evidence_items")
            .select("id, phase, title, summary, extracted_text, attachment_id")
            .in("tenant_key", tenantKeys)
            .eq("program_id", args.moveId)
            .in("id", uniqueEvidenceIds)
        : { data: [], error: null };
    if (
      evidenceDataResult.error ||
      !Array.isArray(evidenceDataResult.data)
    ) {
      return unavailable();
    }

    const moveArtifactIds = reviews
      .map((review) => nonEmpty(objectValue(review.source_ref).move_artifact_id))
      .filter((id): id is string => Boolean(id));
    const uniqueMoveArtifactIds = [...new Set(moveArtifactIds)];
    const moveArtifactResult =
      uniqueMoveArtifactIds.length > 0
        ? await db
            .from("move_artifacts")
            .select("artifact_id, artifact_family")
            .in("tenant_key", tenantKeys)
            .eq("move_id", args.moveId)
            .eq("phase", 0)
            .eq("lifecycle_state", "current")
            .in("artifact_family", ["uploaded_evidence", "session_artifact"])
            .in("artifact_id", uniqueMoveArtifactIds)
        : { data: [], error: null };
    if (moveArtifactResult.error || !Array.isArray(moveArtifactResult.data)) {
      return unavailable();
    }
    const validMoveArtifactIds = new Set(
      moveArtifactResult.data
        .map((row: Record<string, unknown>) => nonEmpty(row.artifact_id))
        .filter((id: string | null): id is string => Boolean(id)),
    );
    const linkedReviews = reviews.filter((review) => {
      const artifactId = nonEmpty(
        objectValue(review.source_ref).move_artifact_id,
      );
      return artifactId === null || validMoveArtifactIds.has(artifactId);
    });

    return {
      available: true,
      ...evaluateP0SourceEvidenceCoverage(
        linkedReviews,
        evidenceDataResult.data as P0SourceEvidenceItem[],
      ),
    };
  } catch {
    return unavailable();
  }
}

export async function assertP0SourceEvidenceReady(args: {
  tenantKey: string;
  moveId: string;
}): Promise<P0MinimumEvidenceStatus> {
  const status = await loadP0MinimumEvidenceStatus(args);
  if (!status.available) {
    throw new P0SourceEvidenceGateError(
      "p0_evidence_status_unavailable",
      "P0 evidence review could not be verified. The approval was not recorded.",
    );
  }
  if (status.approvedSourceFileCount < 1) {
    throw new P0SourceEvidenceGateError(
      "p0_evidence_required",
      "Upload at least one P0 source file in Files & Evidence and approve its extraction before approving P0.",
    );
  }
  return status;
}
