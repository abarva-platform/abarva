// Source File Cabinet — Postgres metadata registry for artifacts.
//
// Versioning: a new artifact for the same (event, artifact_type, group) is inserted at
// version N+1 with lifecycle 'current'; the prior 'current' rows are flipped to
// 'superseded' and back-linked. The default File Cabinet view shows current only;
// history is opt-in. The DB client is injectable so versioning/mapping is unit-tested
// without the data plane.

import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type {
  ArtifactFileFormat,
  ArtifactGroup,
  ArtifactLifecycle,
  ArtifactStatus,
  ListArtifactsFilter,
  SourceArtifactRecord,
} from "./types";

type DbClient = ReturnType<typeof getAzureWriteFluentClient>;

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function artifactGroup(row: Record<string, unknown>): ArtifactGroup {
  const group = firstString(row.artifact_group);
  if (
    group === "generated" ||
    group === "upload" ||
    group === "template" ||
    group === "session" ||
    group === "approval"
  ) {
    return group;
  }
  return row.source_origin === "uploaded" || row.source_origin === "reuploaded"
    ? "upload"
    : "generated";
}

function artifactStatus(row: Record<string, unknown>): ArtifactStatus {
  const status = firstString(row.status);
  if (
    status === "draft" ||
    status === "preliminary" ||
    status === "issue_ready" ||
    status === "client_to_complete" ||
    status === "legal_review_required" ||
    status === "procurement_review_required" ||
    status === "approved" ||
    status === "client_final" ||
    status === "superseded" ||
    status === "retired" ||
    status === "blocked"
  ) {
    return status;
  }
  if (row.approval_state === "approved") return "approved";
  if (row.approval_state === "rejected") return "blocked";
  if (row.approval_state === "in_review") return "preliminary";
  return "draft";
}

function artifactLifecycle(row: Record<string, unknown>): ArtifactLifecycle {
  if (
    row.lifecycle_state === "current" ||
    row.lifecycle_state === "superseded" ||
    row.lifecycle_state === "retired"
  ) {
    return row.lifecycle_state;
  }
  return row.deleted_at ? "retired" : "current";
}

function artifactFormat(row: Record<string, unknown>): ArtifactFileFormat {
  const format = firstString(row.file_format, row.source_format)?.toLowerCase();
  if (format === "markdown") return "md";
  if (
    format === "docx" ||
    format === "xlsx" ||
    format === "pptx" ||
    format === "pdf" ||
    format === "html" ||
    format === "md" ||
    format === "csv" ||
    format === "json" ||
    format === "txt" ||
    format === "image" ||
    format === "audio" ||
    format === "video"
  ) {
    return format;
  }
  return "unknown";
}

function rowToRecord(row: Record<string, unknown>): SourceArtifactRecord {
  const numOrNull = (v: unknown) =>
    v === null || v === undefined ? null : Number(v);
  const strOrNull = (v: unknown) =>
    typeof v === "string" && v.length ? v : null;
  const jsonObjOrEmpty = (v: unknown): Record<string, unknown> => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    if (typeof v === "string" && v.trim().length > 0) {
      try {
        const parsed = JSON.parse(v);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : {};
      } catch {
        return {};
      }
    }
    return {};
  };
  return {
    id: String(row.id),
    clientId: firstString(row.client_id) ?? "",
    tenantKey: firstString(row.tenant_key) ?? "",
    sourceEventId: firstString(row.source_event_id) ?? "",
    sourcingStage: firstString(row.sourcing_stage, row.stage_key),
    artifactGroup: artifactGroup(row),
    artifactType:
      firstString(row.artifact_type, row.artifact_kind, row.artifact_family) ??
      "source_artifact",
    artifactFamily: strOrNull(row.artifact_family),
    title:
      firstString(row.title, row.original_name, row.artifact_kind) ??
      "Source artifact",
    description: strOrNull(row.description),
    fileName:
      firstString(row.file_name, row.original_name) ?? "source-artifact",
    fileFormat: artifactFormat(row),
    blobContainer: firstString(row.blob_container) ?? "source-artifacts",
    blobPath: firstString(row.blob_path, row.blob_uri) ?? "",
    fileSize: numOrNull(row.file_size ?? row.size_bytes),
    version: Number(row.version ?? 1),
    status: artifactStatus(row),
    generatedBy: firstString(row.generated_by, row.uploader_user_id),
    generatedAt:
      firstString(row.generated_at, row.created_at, row.updated_at) ?? "",
    sourceBasis: firstString(row.source_basis, row.source_origin),
    confidence: strOrNull(row.confidence),
    citationReady:
      row.citation_ready === true || row.evidence_state === "cited",
    evidenceFamiliesUsed:
      arr(row.evidence_families_used).length > 0
        ? arr(row.evidence_families_used)
        : firstString(row.artifact_family)
          ? [String(row.artifact_family)]
          : [],
    sourceRegisterId: firstString(row.source_register_id, row.id),
    contextBundleTraceId: strOrNull(row.context_bundle_trace_id),
    approvalState: strOrNull(row.approval_state),
    approvedBy: strOrNull(row.approved_by),
    approvedAt: strOrNull(row.approved_at),
    maestroOverrideId: strOrNull(row.maestro_override_id),
    missingInputs: arr(row.missing_inputs),
    clientCompleteItems: arr(row.client_complete_items),
    assumptions: arr(row.assumptions),
    supersedesArtifactId: firstString(
      row.supersedes_artifact_id,
      row.supersedes_artifact_version_id,
    ),
    supersededByArtifactId: strOrNull(row.superseded_by_artifact_id),
    lifecycleState: artifactLifecycle(row),
    blobSha256: firstString(row.blob_sha256, row.sha256),
    isClientFinal: row.is_client_final === true,
    isCurrentAuthoritative: row.is_current_authoritative === true,
    sourceGeneratedArtifactId: strOrNull(row.source_generated_artifact_id),
    clientFinalUploadedBy: strOrNull(row.client_final_uploaded_by),
    clientFinalUploadedAt: strOrNull(row.client_final_uploaded_at),
    clientFinalAcceptedBy: strOrNull(row.client_final_accepted_by),
    clientFinalAcceptedAt: strOrNull(row.client_final_accepted_at),
    clientFinalNote: strOrNull(row.client_final_note),
    clientFinalReviewMeetingDate: strOrNull(
      row.client_final_review_meeting_date,
    ),
    clientFinalStakeholderGroup: strOrNull(row.client_final_stakeholder_group),
    clientFinalChangeSummary: jsonObjOrEmpty(row.client_final_change_summary),
    createdAt: firstString(row.created_at, row.generated_at) ?? "",
    updatedAt:
      firstString(row.updated_at, row.created_at, row.generated_at) ?? "",
  };
}

/** Current live rows for an (event, artifact_type, group) — drives next version + supersede. */
export async function getCurrentArtifacts(
  sourceEventId: string,
  artifactType: string,
  artifactGroup: ArtifactGroup,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<SourceArtifactRecord[]> {
  const { data, error } = await db
    .from("source_artifacts")
    .select("*")
    .eq("source_event_id", sourceEventId)
    .eq("artifact_type", artifactType)
    .eq("artifact_group", artifactGroup)
    .eq("lifecycle_state", "current");
  if (error)
    throw new Error(`source_artifacts current read failed: ${error.message}`);
  return (Array.isArray(data) ? data : []).map((r) =>
    rowToRecord(r as Record<string, unknown>),
  );
}

export interface InsertArtifactRow {
  clientId: string;
  tenantKey: string;
  sourceEventId: string;
  sourcingStage: string | null;
  artifactGroup: ArtifactGroup;
  artifactType: string;
  artifactFamily: string | null;
  title: string;
  description: string | null;
  fileName: string;
  fileFormat: string;
  blobContainer: string;
  blobPath: string;
  fileSize: number | null;
  version: number;
  status: string;
  generatedBy: string | null;
  sourceBasis: string | null;
  confidence: string | null;
  citationReady: boolean;
  evidenceFamiliesUsed: string[];
  sourceRegisterId: string | null;
  contextBundleTraceId: string | null;
  missingInputs: string[];
  clientCompleteItems: string[];
  assumptions: string[];
  supersedesArtifactId: string | null;
  blobSha256: string | null;
  isClientFinal?: boolean;
  isCurrentAuthoritative?: boolean;
  sourceGeneratedArtifactId?: string | null;
  clientFinalUploadedBy?: string | null;
  clientFinalUploadedAt?: string | null;
  clientFinalAcceptedBy?: string | null;
  clientFinalAcceptedAt?: string | null;
  clientFinalNote?: string | null;
  clientFinalReviewMeetingDate?: string | null;
  clientFinalStakeholderGroup?: string | null;
  clientFinalChangeSummary?: Record<string, unknown>;
}

export async function insertSourceArtifact(
  row: InsertArtifactRow,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<SourceArtifactRecord> {
  const { data, error } = await db
    .from("source_artifacts")
    .insert({
      client_id: row.clientId,
      tenant_key: row.tenantKey,
      source_event_id: row.sourceEventId,
      sourcing_stage: row.sourcingStage,
      artifact_group: row.artifactGroup,
      artifact_type: row.artifactType,
      artifact_family: row.artifactFamily,
      title: row.title,
      description: row.description,
      file_name: row.fileName,
      file_format: row.fileFormat,
      blob_container: row.blobContainer,
      blob_path: row.blobPath,
      file_size: row.fileSize,
      version: row.version,
      status: row.status,
      generated_by: row.generatedBy,
      source_basis: row.sourceBasis,
      confidence: row.confidence,
      citation_ready: row.citationReady,
      evidence_families_used: row.evidenceFamiliesUsed,
      source_register_id: row.sourceRegisterId,
      context_bundle_trace_id: row.contextBundleTraceId,
      missing_inputs: row.missingInputs,
      client_complete_items: row.clientCompleteItems,
      assumptions: row.assumptions,
      supersedes_artifact_id: row.supersedesArtifactId,
      blob_sha256: row.blobSha256,
      is_client_final: row.isClientFinal ?? false,
      is_current_authoritative: row.isCurrentAuthoritative ?? false,
      source_generated_artifact_id: row.sourceGeneratedArtifactId ?? null,
      client_final_uploaded_by: row.clientFinalUploadedBy ?? null,
      client_final_uploaded_at: row.clientFinalUploadedAt ?? null,
      client_final_accepted_by: row.clientFinalAcceptedBy ?? null,
      client_final_accepted_at: row.clientFinalAcceptedAt ?? null,
      client_final_note: row.clientFinalNote ?? null,
      client_final_review_meeting_date:
        row.clientFinalReviewMeetingDate ?? null,
      client_final_stakeholder_group: row.clientFinalStakeholderGroup ?? null,
      client_final_change_summary: JSON.stringify(
        row.clientFinalChangeSummary ?? {},
      ),
      lifecycle_state: "current",
    })
    .select("*")
    .single();
  if (error)
    throw new Error(`source_artifacts insert failed: ${error.message}`);
  return rowToRecord(data as Record<string, unknown>);
}

/** Flip prior current rows to superseded and back-link them to the new version. */
export async function supersedePriorVersions(
  sourceEventId: string,
  artifactType: string,
  artifactGroup: ArtifactGroup,
  newArtifactId: string,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<void> {
  const { error } = await db
    .from("source_artifacts")
    .update({
      lifecycle_state: "superseded",
      status: "superseded",
      superseded_by_artifact_id: newArtifactId,
      updated_at: new Date().toISOString(),
    })
    .eq("source_event_id", sourceEventId)
    .eq("artifact_type", artifactType)
    .eq("artifact_group", artifactGroup)
    .eq("lifecycle_state", "current")
    .neq("id", newArtifactId);
  if (error)
    throw new Error(`source_artifacts supersede failed: ${error.message}`);
}

/** All artifacts for an event (File Cabinet). Current-only unless includeHistory. */
export async function listSourceArtifacts(
  sourceEventId: string,
  scope: string | { tenantKey: string },
  filter: ListArtifactsFilter = {},
  db: DbClient = getAzureWriteFluentClient(),
): Promise<SourceArtifactRecord[]> {
  const scopeColumn = typeof scope === "string" ? "client_id" : "tenant_key";
  const scopeValue = typeof scope === "string" ? scope : scope.tenantKey;
  let q = db
    .from("source_artifacts")
    .select("*")
    .eq("source_event_id", sourceEventId)
    .eq(scopeColumn, scopeValue);
  if (!filter.includeHistory) q = q.eq("lifecycle_state", "current");
  if (filter.artifactGroup) q = q.eq("artifact_group", filter.artifactGroup);
  if (filter.status) q = q.eq("status", filter.status);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw new Error(`source_artifacts list failed: ${error.message}`);
  return (Array.isArray(data) ? data : []).map((r) =>
    rowToRecord(r as Record<string, unknown>),
  );
}

export async function getSourceArtifact(
  id: string,
  clientId: string,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<SourceArtifactRecord | null> {
  const { data, error } = await db
    .from("source_artifacts")
    .select("*")
    .eq("id", id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error(`source_artifacts get failed: ${error.message}`);
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}
