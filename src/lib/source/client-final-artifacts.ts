import type { SourceArtifactRecord } from "./file-cabinet/types";
import { SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE } from "./artifact-governance";

export const CLIENT_FINAL_GOVERNANCE_MESSAGE =
  SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE;

export interface AuthoritativeArtifactCandidate {
  id: string;
  /**
   * Optional so record shapes that don't track a version number (e.g. the
   * upload-registry's `SourceArtifactRegistryRecord`) can still resolve
   * through this shared function — `latest()` treats a missing version as
   * 0, matching its pre-existing `?? 0` fallback.
   */
  version?: number;
  lifecycleState?: string | null;
  status?: string | null;
  artifactGroup?: string | null;
  isClientFinal?: boolean | null;
  isCurrentAuthoritative?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  clientFinalAcceptedAt?: string | null;
  /**
   * True when this artifact has an active (non-superseded)
   * `source_artifact_acceptances` row — an explicit, reasoned "accept as
   * authoritative" action (SOURCE-SHELL-004), distinct from the inferred
   * `isCurrentAuthoritative` flag. Optional: callers that don't join
   * acceptance data simply leave this pool empty and fall through to the
   * existing pools, unaffected.
   */
  hasActiveAcceptance?: boolean | null;
}

export interface ClientFinalChangeSummaryInput {
  previousGeneratedArtifactId?: string | null;
  previousGeneratedVersion?: number | null;
  clientFinalArtifactId?: string | null;
  clientFinalVersion?: number | null;
  note?: string | null;
  reviewMeetingDate?: string | null;
  stakeholderGroup?: string | null;
}

export function isClientFinalArtifact(
  artifact: Pick<AuthoritativeArtifactCandidate, "status" | "isClientFinal">,
): boolean {
  return artifact.isClientFinal === true || artifact.status === "client_final";
}

export function resolveAuthoritativeArtifact<
  T extends AuthoritativeArtifactCandidate,
>(artifacts: readonly T[]): T | null {
  const current = artifacts.filter((artifact) =>
    artifact.lifecycleState ? artifact.lifecycleState === "current" : true,
  );
  const pools = [
    current.filter((artifact) => isClientFinalArtifact(artifact)),
    current.filter((artifact) => artifact.hasActiveAcceptance === true),
    current.filter((artifact) => artifact.isCurrentAuthoritative === true),
    current.filter(
      (artifact) =>
        artifact.status === "approved" || artifact.status === "locked",
    ),
    current.filter((artifact) => artifact.artifactGroup === "generated"),
    current,
  ];

  for (const pool of pools) {
    const winner = latest(pool);
    if (winner) return winner;
  }
  return null;
}

export function buildClientFinalChangeSummary(
  input: ClientFinalChangeSummaryInput,
): Record<string, unknown> {
  return {
    status: "metadata_only",
    summary: CLIENT_FINAL_GOVERNANCE_MESSAGE,
    changeAnalysisCompleted: false,
    skippedReason:
      "Detailed text comparison is not required for accepting a client-final artifact.",
    previousGeneratedArtifactId: input.previousGeneratedArtifactId ?? null,
    previousGeneratedVersion: input.previousGeneratedVersion ?? null,
    clientFinalArtifactId: input.clientFinalArtifactId ?? null,
    clientFinalVersion: input.clientFinalVersion ?? null,
    note: input.note ?? null,
    reviewMeetingDate: input.reviewMeetingDate ?? null,
    stakeholderGroup: input.stakeholderGroup ?? null,
    downstreamUse: ["gate", "export", "downstream_sourcing_work", "dossier"],
  };
}

export function clientFinalMetadataFromRecord(
  artifact: SourceArtifactRecord,
): Record<string, unknown> {
  return {
    artifactId: artifact.id,
    fileName: artifact.fileName,
    version: artifact.version,
    acceptedAt: artifact.clientFinalAcceptedAt,
    acceptedBy: artifact.clientFinalAcceptedBy,
    uploadedAt: artifact.clientFinalUploadedAt,
    uploadedBy: artifact.clientFinalUploadedBy,
    note: artifact.clientFinalNote,
    reviewMeetingDate: artifact.clientFinalReviewMeetingDate,
    stakeholderGroup: artifact.clientFinalStakeholderGroup,
    sourceGeneratedArtifactId: artifact.sourceGeneratedArtifactId,
    governanceMessage: CLIENT_FINAL_GOVERNANCE_MESSAGE,
  };
}

function latest<T extends AuthoritativeArtifactCandidate>(
  artifacts: readonly T[],
): T | null {
  if (artifacts.length === 0) return null;
  return (
    [...artifacts].sort((a, b) => {
      const aTime = timestampFor(a);
      const bTime = timestampFor(b);
      if (aTime !== bTime) return bTime - aTime;
      return (b.version ?? 0) - (a.version ?? 0);
    })[0] ?? null
  );
}

function timestampFor(artifact: AuthoritativeArtifactCandidate): number {
  const value =
    artifact.clientFinalAcceptedAt ?? artifact.updatedAt ?? artifact.createdAt;
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}
