import "server-only";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

export type MoveContextExtractFreshnessStatus =
  | "fresh"
  | "stale"
  | "rebuild_required";

export interface MoveContextExtractFreshness {
  extractId: string | null;
  moveId: string;
  tenantKey: string;
  evidenceFingerprint: string;
  attachedEvidenceCount: number;
  acceptedEvidenceCount: number;
  latestEvidenceUpdatedAt: string | null;
  blueprintId: string;
  blueprintVersion: string;
  createdAt: string;
  freshnessStatus: MoveContextExtractFreshnessStatus;
}

interface ExistingMoveContextExtract {
  createdAt: string | null;
  metadata: Record<string, unknown>;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function artifactTypeForPhase(phase: number): string {
  return `move_context_extract_p${phase}`;
}

export function parseMoveContextExtractFreshness(
  value: ExistingMoveContextExtract | null,
): MoveContextExtractFreshness | null {
  const extract = objectValue(value?.metadata.moveContextExtract);
  const freshness = objectValue(extract.freshness);
  const evidenceFingerprint = stringOrNull(freshness.evidenceFingerprint);
  const blueprintId = stringOrNull(freshness.blueprintId);
  const blueprintVersion = stringOrNull(freshness.blueprintVersion);
  if (!evidenceFingerprint || !blueprintId || !blueprintVersion) return null;

  return {
    extractId: stringOrNull(freshness.extractId),
    moveId: stringOrNull(freshness.moveId) ?? "",
    tenantKey: stringOrNull(freshness.tenantKey) ?? "",
    evidenceFingerprint,
    attachedEvidenceCount: numberOrNull(freshness.attachedEvidenceCount) ?? 0,
    acceptedEvidenceCount: numberOrNull(freshness.acceptedEvidenceCount) ?? 0,
    latestEvidenceUpdatedAt: stringOrNull(freshness.latestEvidenceUpdatedAt),
    blueprintId,
    blueprintVersion,
    createdAt: stringOrNull(freshness.createdAt) ?? value?.createdAt ?? "",
    freshnessStatus:
      freshness.freshnessStatus === "fresh" ||
      freshness.freshnessStatus === "stale" ||
      freshness.freshnessStatus === "rebuild_required"
        ? freshness.freshnessStatus
        : "rebuild_required",
  };
}

/**
 * Worker-safe, read-only freshness lookup. Keep this leaf free of request-scoped
 * tenancy, Clerk, evidence ingestion, audit logging, and UI/rendering imports.
 */
export async function loadCurrentMoveContextExtractFreshness(args: {
  tenantKey: string;
  moveId: string;
  phase: number;
}): Promise<MoveContextExtractFreshness | null> {
  const sb = getAzureReadFluentClient();
  const { data, error } = await sb
    .from("move_artifacts")
    .select("metadata, created_at, generated_at")
    .eq("tenant_key", args.tenantKey)
    .eq("move_id", args.moveId)
    .eq("artifact_type", artifactTypeForPhase(args.phase))
    .eq("lifecycle_state", "current")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as {
    metadata?: Record<string, unknown> | null;
    created_at?: string | null;
    generated_at?: string | null;
  };
  return parseMoveContextExtractFreshness({
    createdAt: stringOrNull(row.generated_at) ?? stringOrNull(row.created_at),
    metadata: objectValue(row.metadata),
  });
}
